from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Deployment
from app.schemas.schemas import DeploymentOut
router=APIRouter(prefix="/deployments", tags=["deployments"])

@router.get("/{project_id}", response_model=list[DeploymentOut])
async def list_deployments(project_id:int, db=Depends(get_db)):
    result=await db.execute(select(Deployment).where(Deployment.project_id==project_id).order_by(Deployment.created_at.desc()))
    return result.scalars().all()
