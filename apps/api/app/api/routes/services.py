from fastapi import APIRouter, Depends
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Service
from app.schemas.schemas import ServiceOut
router = APIRouter(prefix="/services", tags=["services"])

@router.get("/{project_id}", response_model=list[ServiceOut])
async def list_services(project_id:int, db=Depends(get_db)):
    result = await db.execute(select(Service).where(Service.project_id==project_id))
    return result.scalars().all()
