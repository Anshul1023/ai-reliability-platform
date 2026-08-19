from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user, require_auth
router = APIRouter(prefix="/auth", tags=["auth"])
@router.get("/me")
async def me(user=Depends(require_auth)):
    return {**user}
