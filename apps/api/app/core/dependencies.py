from fastapi import Depends
from app.core.database import get_db
from app.core.security import get_current_user

async def db_dependency(db=Depends(get_db)):
    return db

async def user_dependency(user=Depends(get_current_user)):
    return user
