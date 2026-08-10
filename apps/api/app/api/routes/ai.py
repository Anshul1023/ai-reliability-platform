from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.ai.agent import IncidentAgent
from app.ai.chat import chat as chat_with_context
from app.core.security import require_api_key

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze/{incident_id}")
async def analyze(incident_id: int, _=Depends(require_api_key)):
    return await IncidentAgent().analyze(incident_id)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    project_id: int | None = None


@router.post("/chat")
async def chat_endpoint(req: ChatRequest, _=Depends(require_api_key)):
    return await chat_with_context(
        [{"role": m.role, "content": m.content} for m in req.messages], req.project_id
    )
