"""Authentication routes."""
import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
    decode_token_for_user
)
from app.auth.models import (
    UserCreate,
    UserLogin,
    TokenResponse,
    TokenData,
    RefreshTokenRequest,
    UserResponse
)
from app.core.database import get_db
from app.core.security import get_current_user, require_auth

router = APIRouter(prefix="/auth", tags=["auth"])

# Simple in-memory user store for demo (replace with DB in production)
_users_db = {}


def _hash_password(password: str) -> str:
    """Hash password with salt (simplified - use bcrypt in production)."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{hashed}"


def _verify_password(password: str, stored: str) -> bool:
    """Verify password against stored hash."""
    salt, hashed = stored.split(":")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == hashed


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    """Register a new user and return JWT tokens."""
    if user.email in _users_db:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Store user
    user_id = f"user_{secrets.token_hex(8)}"
    _users_db[user.email] = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": _hash_password(user.password),
        "role": "admin" if not _users_db else "user",  # First user is admin
        "created_at": datetime.now(timezone.utc)
    }
    
    # Generate tokens
    access_token = create_access_token(user_id, user.email, "admin" if len(_users_db) == 1 else "user")
    refresh_token = create_refresh_token(user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email/password and return JWT tokens."""
    user = _users_db.get(credentials.email)
    if not user or not _verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(user["id"], user["email"], user["role"])
    refresh_token = create_refresh_token(user["id"])
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh an expired access token."""
    payload = verify_token(request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Find user
    user = None
    for u in _users_db.values():
        if u["id"] == payload.sub:
            user = u
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    access_token = create_access_token(user["id"], user["email"], user["role"])
    refresh_token = create_refresh_token(user["id"])
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(require_auth)):
    """Get current authenticated user."""
    user_id = current_user.get("id")
    email = current_user.get("email")
    
    # Find user in DB
    for user in _users_db.values():
        if user["id"] == user_id:
            return UserResponse(
                id=user["id"],
                email=user["email"],
                name=user.get("name"),
                role=user["role"],
                created_at=user.get("created_at")
            )
    
    # If JWT user not in memory DB, return from token data
    return UserResponse(
        id=user_id,
        email=email or "",
        name=current_user.get("name", ""),
        role=current_user.get("role", "user")
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(require_auth)):
    """Logout (client should delete tokens)."""
    return {"message": "Successfully logged out"}
