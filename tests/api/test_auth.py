import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app


@pytest.mark.asyncio
async def test_write_endpoints_require_api_key_when_configured():
    original = settings.api_key
    settings.api_key = "test-secret-key"
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            # Missing key -> 401 on both write endpoints (no DB/Redis touched)
            r = await c.post("/ai/analyze/1")
            assert r.status_code == 401
            r = await c.post("/incidents/999/investigate")
            assert r.status_code == 401

            # Wrong key -> 401
            r = await c.post("/ai/analyze/1", headers={"Authorization": "Bearer wrong"})
            assert r.status_code == 401

            # Correct key via Bearer -> auth passes, demo analysis runs
            r = await c.post("/ai/analyze/1", headers={"Authorization": "Bearer test-secret-key"})
            assert r.status_code == 200

            # Correct key via X-API-Key header -> auth passes
            r = await c.post("/ai/analyze/1", headers={"X-API-Key": "test-secret-key"})
            assert r.status_code == 200

            # Reads stay open (no auth required)
            r = await c.get("/health")
            assert r.status_code == 200
    finally:
        settings.api_key = original
