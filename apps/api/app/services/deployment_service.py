from app.services.github_service import GitHubService
async def recent_deployments(repo:str):
    return await GitHubService().commits(repo)
