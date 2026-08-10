from app.workers.incident_worker import handle
async def process(job):
    return await handle(job)
