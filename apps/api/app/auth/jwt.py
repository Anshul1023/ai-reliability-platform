"""JWT token creation and verification."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from pydantic import ValidationError

from app.auth.models import TokenPayload, TokenData
from app.core.config import settings


# JWT configuration
SECRET_KEY = settings.jwt_secret_key or secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(
    user_id: str,
    email: Optional[str] = None,
    role: str = "user",
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token with Pydantic validation."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    payload = TokenPayload(
        sub=user_id,
        email=email,
        role=role,
        exp=int(expire.timestamp()),
        iat=int(now.timestamp()),
        jti=secrets.token_urlsafe(16)
    )
    
    return jwt.encode(payload.model_dump(), SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a JWT refresh token (longer lived)."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = TokenPayload(
        sub=user_id,
        exp=int(expire.timestamp()),
        iat=int(now.timestamp()),
        jti=secrets.token_urlsafe(16)
    )
    
    return jwt.encode(payload.model_dump(), SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[TokenPayload]:
    """Verify and decode a JWT token using Pydantic validation."""
    try:
        payload_dict = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**payload_dict)
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except ValidationError:
        return None


def decode_token_for_user(token: str) -> Optional[TokenData]:
    """Decode token and extract user data for dependency injection."""
    payload = verify_token(token)
    if not payload:
        return None
    
    return TokenData(
        user_id=payload.sub,
        email=payload.email,
        role=payload.role
    )
