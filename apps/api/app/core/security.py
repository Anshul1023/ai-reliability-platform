import secrets

from fastapi import Depends, Header, HTTPException

from app.core.config import settings


async def get_current_user(x_user_id: str | None = Header(default=None)):
    # Demo authentication. Replace with Supabase JWT verification in production.
    return {"id": x_user_id or "demo-user", "role": "developer"}


def require_role(user, *roles):
    if user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


def _extract_key(authorization: str | None, x_api_key: str | None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    if x_api_key:
        return x_api_key.strip()
    return ""


async def get_api_key(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
) -> str:
    return _extract_key(authorization, x_api_key)


async def require_api_key(api_key: str = Depends(get_api_key)) -> str:
    """Guard write endpoints with the configured API key.

    Accepts the key via ``Authorization: Bearer <key>`` or ``X-API-Key: <key>``.
    An empty ``settings.api_key`` disables the check (local development only) —
    set it for any public deployment.
    """
    if not settings.api_key:
        return api_key
    if api_key and secrets.compare_digest(api_key, settings.api_key):
        return api_key
    raise HTTPException(status_code=401, detail="Invalid or missing API key")
