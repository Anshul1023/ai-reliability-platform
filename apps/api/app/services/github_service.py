import base64
import time

import httpx

from app.core.config import settings
from app.redis.cache import get_json, set_json


class GitHubService:
    def _headers(self) -> dict:
        headers = {"Accept": "application/vnd.github+json"}
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"
        return headers

    async def repository(self, repo: str):
        return await self._cached(f"github:repo:{repo}", self._repository(repo))

    async def commits(self, repo: str):
        return await self._cached(f"github:commits:{repo}", self._commits(repo))

    async def list_owner_repos(self):
        """All repos owned by the user (private too, when a token is set)."""
        if settings.github_token:
            url = f"{settings.github_api_url}/user/repos"
        elif settings.github_owner:
            url = f"{settings.github_api_url}/users/{settings.github_owner}/repos"
        else:
            return []
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, headers=self._headers(), params={"per_page": 100, "sort": "updated"})
            r.raise_for_status()
            return [{"name": x["name"], "full_name": x["full_name"]} for x in r.json()]

    async def contents(self, repo: str, path: str = ""):
        """List a directory or read a file (base64 content) via the contents API."""
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{settings.github_api_url}/repos/{repo}/contents/{path}",
                headers=self._headers(),
            )
            r.raise_for_status()
            data = r.json()
            if isinstance(data, list):  # directory
                return [{"name": x["name"], "type": x["type"], "path": x["path"]} for x in data]
            return {
                "name": data["name"],
                "path": data["path"],
                "type": "file",
                "content": data.get("content"),
                "sha": data.get("sha"),
            }

    async def propose_change(self, repo: str, path: str, content: str, message: str) -> dict:
        """Commit a change on a new branch and open a pull request (never pushes to main directly)."""
        if not settings.github_token:
            raise ValueError("GITHUB_TOKEN is required to propose changes")
        headers = self._headers()
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get(f"{settings.github_api_url}/repos/{repo}", headers=headers)
            r.raise_for_status()
            default_branch = r.json()["default_branch"]

            r = await client.get(
                f"{settings.github_api_url}/repos/{repo}/git/ref/heads/{default_branch}", headers=headers
            )
            r.raise_for_status()
            head_sha = r.json()["object"]["sha"]

            branch = f"pulseops/{int(time.time())}"
            r = await client.post(
                f"{settings.github_api_url}/repos/{repo}/git/refs",
                headers=headers,
                json={"ref": f"refs/heads/{branch}", "sha": head_sha},
            )
            r.raise_for_status()

            sha = None
            try:
                r = await client.get(f"{settings.github_api_url}/repos/{repo}/contents/{path}", headers=headers)
                if r.status_code == 200:
                    sha = r.json().get("sha")
            except Exception:  # noqa: BLE001 - new file
                pass

            body = {
                "message": message,
                "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
                "branch": branch,
            }
            if sha:
                body["sha"] = sha
            r = await client.put(
                f"{settings.github_api_url}/repos/{repo}/contents/{path}", headers=headers, json=body
            )
            r.raise_for_status()

            r = await client.post(
                f"{settings.github_api_url}/repos/{repo}/pulls",
                headers=headers,
                json={
                    "title": message,
                    "head": branch,
                    "base": default_branch,
                    "body": "Change proposed from the AI Reliability Platform dashboard.",
                },
            )
            r.raise_for_status()
            pr = r.json()
            return {"branch": branch, "pr_number": pr["number"], "pr_url": pr["html_url"]}

    async def _repository(self, repo: str):
        if settings.demo_mode or not settings.github_token:
            return {"full_name": repo, "default_branch": "main", "private": False, "demo": True}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{settings.github_api_url}/repos/{repo}", headers=self._headers())
            r.raise_for_status()
            return r.json()

    async def _commits(self, repo: str):
        if settings.demo_mode or not settings.github_token:
            return [{"sha": "8f31c2a", "message": "Tune DB connection pool", "author": "demo", "status": "passed"}]
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{settings.github_api_url}/repos/{repo}/commits",
                headers=self._headers(),
                params={"per_page": 10},
            )
            r.raise_for_status()
            return [
                {"sha": x["sha"], "message": x["commit"]["message"], "author": x["commit"]["author"]["name"]}
                for x in r.json()
            ]

    async def _cached(self, key: str, fetch):
        try:
            cached = await get_json(key)
            if cached is not None:
                return cached
        except Exception:  # noqa: BLE001 - caching is best-effort
            pass
        data = await fetch
        try:
            await set_json(key, data)
        except Exception:  # noqa: BLE001
            pass
        return data
