import json
from app.redis.client import redis

async def publish(channel:str,message:dict):
    await redis.publish(channel,json.dumps(message))

async def subscribe(channel:str):
    pubsub=redis.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for item in pubsub.listen():
            if item["type"]=="message":
                yield json.loads(item["data"])
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
