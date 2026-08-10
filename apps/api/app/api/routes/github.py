from fastapi import APIRouter, Query
from app.services.github_service import GitHubService
router=APIRouter(prefix="/github", tags=["github"])

@router.get("/repository")
async def repository(repo: str = Query(..., description="owner/name")):
    return await GitHubService().repository(repo)

@router.get("/commits")
async def commits(repo: str = Query(...)):
    return await GitHubService().commits(repo)
