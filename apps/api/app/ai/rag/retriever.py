import base64

import httpx
from sqlalchemy import select

from app.core.config import settings


def retrieve_evidence(incident_id:int):
    # Demo retriever. Replace with pgvector/embedding retrieval when the corpus is ready.
    return [
        "Error spike began approximately 6 minutes after deployment.",
        "82% of failures are database connection timeouts.",
        "Previous incident INC-0971 had a similar signature."
    ]


async def retrieve_project_context(repo: str, project_id: int | None = None, db=None) -> dict:
    """Gather grounded context about a project for the AI chat (RAG over live data).

    Pulls repository metadata, the README, the file tree from GitHub, and (when a
    DB session is supplied) monitored services and recent incidents. Every fetch is
    best-effort: a missing piece simply drops out of the context.
    """
    info: dict = {}
    if not repo:
        return info
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(f"{settings.github_api_url}/repos/{repo}", headers=headers)
            if r.status_code == 200:
                d = r.json()
                info["repository"] = {
                    "full_name": d["full_name"],
                    "description": d.get("description"),
                    "language": d.get("language"),
                    "default_branch": d.get("default_branch"),
                    "homepage": d.get("homepage"),
                }
        except Exception:  # noqa: BLE001
            pass
        try:
            r = await client.get(f"{settings.github_api_url}/repos/{repo}/readme", headers=headers)
            if r.status_code == 200:
                info["readme"] = base64.b64decode(r.json()["content"]).decode("utf-8", "replace")[:6000]
        except Exception:  # noqa: BLE001
            pass
        try:
            branch = (info.get("repository") or {}).get("default_branch") or "main"
            r = await client.get(
                f"{settings.github_api_url}/repos/{repo}/git/trees/{branch}?recursive=1", headers=headers
            )
            if r.status_code == 200:
                tree = [t["path"] for t in r.json().get("tree", []) if t["type"] == "blob"]
                info["files"] = tree[:300]
        except Exception:  # noqa: BLE001
            pass

    if db is not None and project_id:
        try:
            from app.models.models import Incident, Service
            svcs = (await db.execute(select(Service).where(Service.project_id == project_id))).scalars().all()
            incs = (await db.execute(
                select(Incident).where(Incident.project_id == project_id).order_by(Incident.created_at.desc()).limit(5)
            )).scalars().all()
            info["services"] = [
                {"name": s.name, "status": s.status, "latency_ms": s.latency_ms, "uptime": s.uptime}
                for s in svcs
            ]
            info["incidents"] = [
                {"title": i.title, "service": i.service, "severity": i.severity, "status": i.status}
                for i in incs
            ]
        except Exception:  # noqa: BLE001
            pass
    return info
