import uuid
from app.redis.client import redis

async def acquire(name:str,ttl:int=120):
    token=str(uuid.uuid4())
    ok=await redis.set(f"lock:{name}",token,nx=True,ex=ttl)
    return token if ok else None

async def release(name:str,token:str):
    current=await redis.get(f"lock:{name}")
    if current==token:
        await redis.delete(f"lock:{name}")
        return True
    return False
