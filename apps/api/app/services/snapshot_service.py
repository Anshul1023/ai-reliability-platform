from datetime import datetime

from sqlalchemy import select

from app.ai.rag.retriever import retrieve_project_context
from app.core.database import SessionLocal
from app.models.models import Project, ProjectData

# Which context buckets to persist as JSON documents.
DOCUMENT_TYPES = ("repository", "readme", "files", "services", "incidents")


async def _upsert(db, project_id: int, data_type: str, payload: dict):
    row = (
        await db.execute(
            select(ProjectData).where(
                ProjectData.project_id == project_id, ProjectData.data_type == data_type
            )
        )
    ).scalar_one_or_none()
    if row:
        row.payload = payload
        row.updated_at = datetime.utcnow()
    else:
        db.add(ProjectData(project_id=project_id, data_type=data_type, payload=payload))


async def refresh_project_documents() -> dict:
    """Re-fetch GitHub + monitoring context for every project and store it as JSON docs."""
    async with SessionLocal() as db:
        projects = (await db.execute(select(Project).order_by(Project.id))).scalars().all()
        for project in projects:
            ctx = await retrieve_project_context(project.repo, project.id, db)
            for data_type in DOCUMENT_TYPES:
                if data_type in ctx:
                    await _upsert(db, project.id, data_type, ctx[data_type])
        await db.commit()
    return {"projects": len(projects), "document_types": list(DOCUMENT_TYPES)}


async def stored_documents(project_id: int):
    """The persisted JSON documents for a project, ordered by type."""
    async with SessionLocal() as db:
        rows = (
            await db.execute(
                select(ProjectData)
                .where(ProjectData.project_id == project_id)
                .order_by(ProjectData.data_type)
            )
        ).scalars().all()
        return [
            {
                "data_type": r.data_type,
                "source": r.source,
                "updated_at": r.updated_at,
                "payload": r.payload,
            }
            for r in rows
        ]
