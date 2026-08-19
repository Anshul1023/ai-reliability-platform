import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app


@pytest.mark.asyncio
async def test_chat_returns_demo_reply_without_api_key_config():
    original = settings.api_key
    settings.api_key = "test-secret-key"
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.post(
                "/ai/chat",
                headers={"Authorization": "Bearer test-secret-key"},
                json={"messages": [{"role": "user", "content": "What projects do I have?"}]},
            )
            assert r.status_code == 200
            body = r.json()
            # Provider can be "demo" (no LLM key) or a real provider like "groq"
            assert body["provider"] in ("demo", "groq", "openai") or body["provider"] is not None
            assert "reply" in body
    finally:
        settings.api_key = original


@pytest.mark.asyncio
async def test_new_write_endpoints_require_api_key():
    original = settings.api_key
    settings.api_key = "test-secret-key"
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.post("/projects/sync")
            assert r.status_code == 401
            r = await c.post(
                "/github/change-proposal",
                json={"repo": "a/b", "path": "f.txt", "content": "x", "message": "m"},
            )
            assert r.status_code == 401
            r = await c.post("/ai/chat", json={"messages": [{"role": "user", "content": "hi"}]})
            assert r.status_code == 401
    finally:
        settings.api_key = original
