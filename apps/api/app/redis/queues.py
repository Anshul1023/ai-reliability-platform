import json
from app.redis.client import redis
QUEUE="queue:jobs"

async def enqueue(job:dict):
    await redis.rpush(QUEUE,json.dumps(job))
    return job["job_id"]

async def dequeue(timeout:int=5):
    item=await redis.blpop(QUEUE,timeout=timeout)
    return json.loads(item[1]) if item else None
