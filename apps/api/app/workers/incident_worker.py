from app.ai.agent import IncidentAgent
from app.redis.locks import acquire, release

async def handle(job):
    incident_id=job["incident_id"]
    token=await acquire(f"incident:{incident_id}")
    if not token:
        return {"skipped":"already running"}
    try:
        return await IncidentAgent().analyze(incident_id)
    finally:
        await release(f"incident:{incident_id}",token)
