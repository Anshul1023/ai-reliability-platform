from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.redis.pubsub import subscribe

router=APIRouter()

@router.websocket("/ws/incidents")
async def incident_socket(ws: WebSocket):
    await ws.accept()
    channel="pubsub:incidents"
    try:
        async for message in subscribe(channel):
            await ws.send_json(message)
    except WebSocketDisconnect:
        return
