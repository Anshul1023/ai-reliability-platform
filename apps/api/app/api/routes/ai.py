from fastapi import APIRouter, Depends
from app.ai.agent import IncidentAgent
from app.core.security import require_api_key
router=APIRouter(prefix="/ai", tags=["ai"])

@router.post("/analyze/{incident_id}")
async def analyze(incident_id:int, _=Depends(require_api_key)):
    return await IncidentAgent().analyze(incident_id)
