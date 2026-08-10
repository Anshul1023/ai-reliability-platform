import httpx

from app.core.config import settings
from app.redis.cache import get_json, set_json


class GitHubService:
    async def repository(self, repo: str):
        return await self._cached(f"github:repo:{repo}", self._repository(repo))

    async def commits(self, repo: str):
        return await self._cached(f"github:commits:{repo}", self._commits(repo))

    async def _repository(self, repo: str):
        if settings.demo_mode or not settings.github_token:
            return {"full_name": repo, "default_branch": "main", "private": False, "demo": True}
        headers = {"Authorization": f"Bearer {settings.github_token}", "Accept": "application/vnd.github+json"}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{settings.github_api_url}/repos/{repo}", headers=headers)
            r.raise_for_status()
            return r.json()

    async def _commits(self, repo: str):
        if settings.demo_mode or not settings.github_token:
            return [{"sha": "8f31c2a", "message": "Tune DB connection pool", "author": "demo", "status": "passed"}]
        headers = {"Authorization": f"Bearer {settings.github_token}", "Accept": "application/vnd.github+json"}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{settings.github_api_url}/repos/{repo}/commits", headers=headers, params={"per_page": 10}
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
