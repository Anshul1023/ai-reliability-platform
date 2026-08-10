from fastapi import APIRouter
from app.services.monitoring_service import current_metrics
router=APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/{project_id}")
async def metrics(project_id:int):
    return current_metrics(project_id)
