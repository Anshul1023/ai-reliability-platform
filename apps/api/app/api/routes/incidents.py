from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_api_key
from app.models.models import Incident, IncidentEvent
from app.schemas.schemas import IncidentOut
from app.services.incident_service import queue_investigation
router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.get("", response_model=list[IncidentOut])
async def list_incidents(db=Depends(get_db)):
    result = await db.execute(select(Incident).order_by(Incident.created_at.desc()))
    return result.scalars().all()

@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(incident_id:int, db=Depends(get_db)):
    obj=await db.get(Incident, incident_id)
    if not obj: raise HTTPException(404,"Incident not found")
    return obj

@router.post("/{incident_id}/investigate")
async def investigate(incident_id:int, db=Depends(get_db), _=Depends(require_api_key)):
    obj=await db.get(Incident, incident_id)
    if not obj: raise HTTPException(404,"Incident not found")
    job_id=await queue_investigation(incident_id)
    return {"queued": True, "job_id": job_id}
