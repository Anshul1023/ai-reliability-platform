from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Project
from app.schemas.schemas import ProjectOut
router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=list[ProjectOut])
async def list_projects(db=Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.id))
    return result.scalars().all()

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: int, db=Depends(get_db)):
    from fastapi import HTTPException
    obj = await db.get(Project, project_id)
    if not obj: raise HTTPException(404, "Project not found")
    return obj
