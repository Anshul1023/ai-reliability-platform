"""Pydantic models for JWT authentication."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class TokenPayload(BaseModel):
    """JWT token payload (what's encoded in the token)."""
    sub: str = Field(..., description="User ID or email")
    email: Optional[str] = None
    role: str = "user"
    exp: Optional[int] = None
    iat: Optional[int] = None
    jti: Optional[str] = None


class TokenResponse(BaseModel):
    """Response containing JWT tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes


class TokenData(BaseModel):
    """Decoded token data for dependency injection."""
    user_id: str
    email: Optional[str] = None
    role: str = "user"


class UserCreate(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: Optional[str] = None


class UserLogin(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response (no sensitive data)."""
    id: str
    email: str
    name: Optional[str] = None
    role: str = "user"
    created_at: Optional[datetime] = None


class PasswordChange(BaseModel):
    """Password change request."""
    current_password: str
    new_password: str = Field(..., min_length=8)


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str
