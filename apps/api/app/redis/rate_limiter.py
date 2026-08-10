import asyncio
import time

from app.core.config import settings
from app.redis.client import redis

_memory_counts: dict[str, tuple[int, int]] = {}  # client_id -> (window_start, count)
_memory_lock = asyncio.Lock()


async def allow(client_id: str) -> bool:
    """Fixed-window rate limit in Redis, with an in-memory fallback for when Redis is down."""
    try:
        key = f"ratelimit:{client_id}:{int(time.time()) // settings.rate_limit_window_seconds}"
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, settings.rate_limit_window_seconds)
        return count <= settings.rate_limit_requests
    except Exception:  # noqa: BLE001 - Redis unavailable: fall back to process-local limiting
        return await _memory_allow(client_id)


async def _memory_allow(client_id: str) -> bool:
    global _memory_counts
    window = settings.rate_limit_window_seconds
    now = int(time.time())
    async with _memory_lock:
        start, count = _memory_counts.get(client_id, (now, 0))
        if now - start >= window:
            start, count = now, 0
        count += 1
        _memory_counts[client_id] = (start, count)
        if len(_memory_counts) > 10_000:
            cutoff = now - window
            _memory_counts = {k: v for k, v in _memory_counts.items() if v[0] > cutoff}
        return count <= settings.rate_limit_requests
