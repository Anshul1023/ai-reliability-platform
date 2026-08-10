import uuid
from app.redis.queues import enqueue

async def queue_investigation(incident_id:int):
    return await enqueue({"type":"incident_investigation","incident_id":incident_id,"job_id":str(uuid.uuid4())})
