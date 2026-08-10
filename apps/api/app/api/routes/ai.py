from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from app.ai.agent import IncidentAgent
from app.ai.chat import chat as chat_with_context
from app.core.database import get_db
from app.core.security import require_api_key
from app.services.chat_history import clear_history, get_history, save_messages

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/sources")
async def list_sources(db=Depends(get_db)):
    """The data source catalog — where to get which data. Seeds lazily if empty."""
    from app.ai.data_sources import seed_data_sources
    from app.models.models import DataSource

    count = (await db.execute(select(DataSource))).scalars().all()
    if not count:
        await seed_data_sources(db)
        count = (await db.execute(select(DataSource).order_by(DataSource.key))).scalars().all()
    return [
        {
            "key": s.key,
            "label": s.label,
            "kind": s.kind,
            "location": s.location,
            "fields": s.fields,
            "description": s.description,
        }
        for s in count
    ]


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
async def chat_endpoint(req: ChatRequest, db=Depends(get_db), _=Depends(require_api_key)):
    result = await chat_with_context(
        [{"role": m.role, "content": m.content} for m in req.messages], req.project_id
    )
    # Persist the exchange (user message + reply) — best effort, never breaks the response.
    try:
        last_user = req.messages[-1].content if req.messages else ""
        await save_messages(
            db,
            req.project_id,
            last_user,
            result.get("reply", ""),
            result.get("provider", ""),
        )
    except Exception:  # noqa: BLE001 - history persistence is optional
        pass
    return result


@router.get("/chat/history")
async def chat_history(
    project_id: int | None = None,
    limit: int = 50,
    db=Depends(get_db),
):
    """Saved chat messages for a conversation (project_id omitted = all projects).

    Served from the Redis cache when available, Postgres otherwise.
    """
    return await get_history(db, project_id, min(max(limit, 1), 200))


@router.delete("/chat/history")
async def clear_chat_history(
    project_id: int | None = None,
    db=Depends(get_db),
    _=Depends(require_api_key),
):
    """Delete a saved conversation (project_id omitted = all projects)."""
    await clear_history(db, project_id)
    return {"cleared": True, "project_id": project_id}
