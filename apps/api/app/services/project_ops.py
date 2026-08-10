"""Project lifecycle operations shared by the API routes and the AI agent tools."""
from sqlalchemy import delete, select

from app.models.models import (
    AgentRun,
    Deployment,
    Incident,
    IncidentEvent,
    ProjectData,
    Service,
)


async def delete_project_rows(db, project_id: int) -> None:
    """Remove every row that references a project (the schema has no cascades).

    Incident events and agent runs hang off incidents, so those are deleted
    first by incident id; then incidents, deployments, services and the stored
    JSON documents go. Chat messages keep the project_id NULLed via their
    ON DELETE SET NULL foreign key.
    """
    incident_ids = (
        (
            await db.execute(
                select(Incident.id).where(Incident.project_id == project_id)
            )
        )
        .scalars()
        .all()
    )
    if incident_ids:
        await db.execute(
            delete(IncidentEvent).where(IncidentEvent.incident_id.in_(incident_ids))
        )
        await db.execute(delete(AgentRun).where(AgentRun.incident_id.in_(incident_ids)))
    for model in (Incident, Deployment, Service, ProjectData):
        await db.execute(delete(model).where(model.project_id == project_id))
