"""Persisted AI chat history with a Redis read cache.

Every /ai/chat exchange is written to the `chat_messages` table (source of
truth). Reads go through Redis (`chat:history:<project_id|all>`) for speed and
fall back to Postgres when Redis is unavailable — Redis is always optional here,
matching the rest of the platform.
"""
import logging

from sqlalchemy import delete, select

from app.models.models import ChatMessage
from app.redis.cache import delete as redis_delete
from app.redis.cache import get_json, set_json

log = logging.getLogger(__name__)

REDIS_TTL_SECONDS = 3600  # 1 hour of cached history per conversation
HISTORY_LIMIT = 100  # messages kept per conversation in Redis


def _key(project_id: int | None) -> str:
    return f"chat:history:{project_id if project_id is not None else 'all'}"


async def _redis_safe(fn, default=None):
    """Redis is optional at runtime — chat history must survive it being down."""
    try:
        return await fn()
    except Exception:  # noqa: BLE001 - Redis unavailable: degrade to DB-only
        return default


async def save_messages(db, project_id, user_content, assistant_content, provider="", meta=None):
    """Persist one user/assistant exchange to Postgres and refresh the Redis cache.

    `meta` is stored on the assistant row and captures the full response details
    (context_used, project, sources) so saved replies are complete.
    """
    db.add(ChatMessage(project_id=project_id, role="user", content=user_content))
    db.add(
        ChatMessage(
            project_id=project_id,
            role="assistant",
            content=assistant_content,
            provider=provider,
            meta=meta or {},
        )
    )
    await db.commit()
    await _redis_safe(lambda: _refresh_cache(db, project_id))


async def _refresh_cache(db, project_id: int | None):
    """Rebuild the Redis list for a conversation from the latest DB rows."""
    rows = (
        (
            await db.execute(
                select(ChatMessage)
                .where(
                    ChatMessage.project_id.is_(project_id)
                    if project_id is None
                    else ChatMessage.project_id == project_id
                )
                .order_by(ChatMessage.id.desc())
                .limit(HISTORY_LIMIT)
            )
        )
        .scalars()
        .all()
    )
    history = [_row_to_dict(r) for r in reversed(rows)]
    await set_json(_key(project_id), history, ttl=REDIS_TTL_SECONDS)
    return history


def _row_to_dict(row: ChatMessage) -> dict:
    return {
        "role": row.role,
        "content": row.content,
        "provider": row.provider or "",
        "meta": row.meta or {},
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


async def get_history(db, project_id: int | None, limit: int = 50) -> list[dict]:
    """Return recent messages (oldest first). Redis cache, DB fallback + warm."""
    cached = await _redis_safe(lambda: get_json(_key(project_id)))
    if cached:
        return cached[-limit:]
    rows = (
        (
            await db.execute(
                select(ChatMessage)
                .where(
                    ChatMessage.project_id.is_(project_id)
                    if project_id is None
                    else ChatMessage.project_id == project_id
                )
                .order_by(ChatMessage.id.desc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    history = [_row_to_dict(r) for r in reversed(rows)]
    await _redis_safe(lambda: set_json(_key(project_id), history, ttl=REDIS_TTL_SECONDS))
    return history


async def clear_history(db, project_id: int | None):
    """Delete a conversation from Postgres and drop its Redis cache."""
    await db.execute(
        delete(ChatMessage).where(
            ChatMessage.project_id.is_(project_id)
            if project_id is None
            else ChatMessage.project_id == project_id
        )
    )
    await db.commit()
    await _redis_safe(lambda: redis_delete(_key(project_id)))
