import secrets
from typing import Optional

from fastapi import Depends, Header, HTTPException, status

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


async def get_current_user_jwt(
    authorization: str | None = Header(default=None),
) -> Optional[dict]:
    """Extract and verify JWT token from Authorization header.

    Returns user data if token is valid, None otherwise.
    Supports both JWT tokens and legacy API keys.
    """
    if not authorization:
        return None
    
    # Try JWT token first
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        
        # Check if it's a JWT (starts with eyJ)
        if token.startswith("eyJ"):
            try:
                from app.auth.jwt import decode_token_for_user
                token_data = decode_token_for_user(token)
                if token_data:
                    return {
                        "id": token_data.user_id,
                        "email": token_data.email,
                        "role": token_data.role
                    }
            except Exception:
                pass
        
        # Fall back to API key check
        if settings.api_key and secrets.compare_digest(token, settings.api_key):
            return {"id": "api-key-user", "role": "admin"}
    
    # Check X-API-Key header
    x_api_key = authorization if not authorization.lower().startswith("bearer ") else None
    if x_api_key and settings.api_key and secrets.compare_digest(x_api_key, settings.api_key):
        return {"id": "api-key-user", "role": "admin"}
    
    return None


async def require_auth(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
) -> dict:
    """Require authentication via JWT or API key.

    Returns user data if authenticated, raises 401 otherwise.
    """
    # Try JWT first
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        if token.startswith("eyJ"):
            try:
                from app.auth.jwt import decode_token_for_user
                token_data = decode_token_for_user(token)
                if token_data:
                    return {
                        "id": token_data.user_id,
                        "email": token_data.email,
                        "role": token_data.role
                    }
            except Exception:
                pass
    
    # Try API key
    api_key = _extract_key(authorization, x_api_key)
    if api_key and settings.api_key and secrets.compare_digest(api_key, settings.api_key):
        return {"id": "api-key-user", "role": "admin"}
    
    # If no auth configured (dev mode) and no token provided, allow as dev user
    if not settings.api_key and not authorization:
        return {"id": "dev-user", "role": "admin"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication",
        headers={"WWW-Authenticate": "Bearer"}
    )
