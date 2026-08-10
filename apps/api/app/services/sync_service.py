from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.models import Project
from app.services.github_service import GitHubService


async def sync_projects_from_github() -> dict:
    """Upsert every GitHub repo owned by the user as a dashboard project.

    With GITHUB_TOKEN set, this includes private repos (GET /user/repos).
    Otherwise it falls back to the public repos of settings.github_owner.
    """
    repos = await GitHubService().list_owner_repos()
    added = skipped = 0
    async with SessionLocal() as db:
        existing = {p.repo for p in (await db.execute(select(Project))).scalars().all()}
        for r in repos:
            if r["full_name"] in existing:
                skipped += 1
                continue
            db.add(Project(name=r["name"], repo=r["full_name"], status="Healthy", uptime=99.99))
            added += 1
        await db.commit()
    return {"repos_found": len(repos), "added": added, "skipped": skipped}
