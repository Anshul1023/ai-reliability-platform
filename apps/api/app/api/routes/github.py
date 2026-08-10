from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.security import require_api_key
from app.services.github_service import GitHubService

router = APIRouter(prefix="/github", tags=["github"])


@router.get("/repository")
async def repository(repo: str = Query(..., description="owner/name")):
    return await GitHubService().repository(repo)


@router.get("/commits")
async def commits(repo: str = Query(...)):
    return await GitHubService().commits(repo)


@router.get("/contents")
async def contents(repo: str = Query(...), path: str = Query(default="")):
    try:
        return await GitHubService().contents(repo, path)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Could not read {repo}/{path}: {exc}") from exc


class ChangeProposal(BaseModel):
    repo: str
    path: str
    content: str
    message: str


@router.post("/change-proposal")
async def change_proposal(payload: ChangeProposal, _=Depends(require_api_key)):
    try:
        return await GitHubService().propose_change(
            payload.repo, payload.path, payload.content, payload.message
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"GitHub rejected the change: {exc}") from exc
