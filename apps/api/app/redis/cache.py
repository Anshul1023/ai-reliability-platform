import json
from app.redis.client import redis
from app.core.config import settings

async def get_json(key:str):
    value=await redis.get(key)
    return json.loads(value) if value else None

async def set_json(key:str,value,ttl:int|None=None):
    await redis.set(key,json.dumps(value,default=str),ex=ttl or settings.cache_ttl_seconds)

async def delete(key:str):
    await redis.delete(key)
