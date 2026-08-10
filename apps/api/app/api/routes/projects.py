from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from app.core.database import get_db
from app.core.security import require_api_key
from app.models.models import Deployment, Incident, Project, Service
from app.schemas.schemas import ProjectOut
from app.services.project_ops import delete_project_rows
router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=list[ProjectOut])
async def list_projects(db=Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.id))
    return result.scalars().all()

@router.get("/summary")
async def projects_summary(db=Depends(get_db)):
    """Real service/deployment/incident counts per project (3 grouped queries)."""
    svc = (await db.execute(
        select(Service.project_id, func.count()).group_by(Service.project_id)
    )).all()
    dep = (await db.execute(
        select(Deployment.project_id, func.count()).group_by(Deployment.project_id)
    )).all()
    inc = (await db.execute(
        select(Incident.project_id, func.count()).group_by(Incident.project_id)
    )).all()
    return {
        "services": {pid: n for pid, n in svc},
        "deployments": {pid: n for pid, n in dep},
        "incidents": {pid: n for pid, n in inc},
    }

@router.post("/sync")
async def sync_projects(_=Depends(require_api_key)):
    from app.services.sync_service import sync_projects_from_github
    return await sync_projects_from_github()

@router.post("/refresh")
async def refresh_project_data(_=Depends(require_api_key)):
    from app.services.snapshot_service import refresh_project_documents
    return await refresh_project_documents()

@router.get("/{project_id}/data")
async def project_data_documents(project_id: int):
    from app.services.snapshot_service import stored_documents
    return await stored_documents(project_id)

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: int, db=Depends(get_db)):
    obj = await db.get(Project, project_id)
    if not obj: raise HTTPException(404, "Project not found")
    return obj

@router.delete("/{project_id}")
async def delete_project(project_id: int, db=Depends(get_db), _=Depends(require_api_key)):
    """Delete a project and everything attached to it (owner-only, API key required)."""
    obj = await db.get(Project, project_id)
    if not obj:
        raise HTTPException(404, "Project not found")
    await delete_project_rows(db, project_id)
    await db.delete(obj)
    await db.commit()
    return {"deleted": True, "id": project_id, "name": obj.name}
