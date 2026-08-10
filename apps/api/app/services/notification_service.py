from app.redis.pubsub import publish
async def notify_incident(incident_id:int, status:str):
    await publish("pubsub:incidents", {"incident_id":incident_id,"status":status})
