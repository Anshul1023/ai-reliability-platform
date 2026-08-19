"""FastAPI client to communicate with Django logic service."""
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings


DJANGO_BASE_URL = "http://localhost:8002/api"


class DjangoClient:
    """Client for communicating with Django logic service."""

    def __init__(self, base_url: str = DJANGO_BASE_URL):
        self.base_url = base_url

    async def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to Django service."""
        async with httpx.AsyncClient(timeout=30) as client:
            url = f"{self.base_url}{path}"
            response = await client.request(
                method=method,
                url=url,
                json=data,
                params=params
            )
            response.raise_for_status()
            return response.json()

    # Project endpoints
    async def get_projects(self) -> list:
        """Get all projects."""
        return await self._request("GET", "/projects/")

    async def get_project(self, project_id: int) -> Dict[str, Any]:
        """Get project by ID."""
        return await self._request("GET", f"/projects/{project_id}/")

    async def create_project(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new project."""
        return await self._request("POST", "/projects/", data)

    async def update_project(self, project_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a project."""
        return await self._request("PUT", f"/projects/{project_id}/", data)

    async def delete_project(self, project_id: int) -> Dict[str, Any]:
        """Delete a project."""
        return await self._request("DELETE", f"/projects/{project_id}/")

    # Service endpoints
    async def get_services(self, project_id: Optional[int] = None) -> list:
        """Get services, optionally filtered by project."""
        params = {"project_id": project_id} if project_id else None
        return await self._request("GET", "/services/", params=params)

    async def create_service(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new service."""
        return await self._request("POST", "/services/", data)

    # Incident endpoints
    async def get_incidents(self, project_id: Optional[int] = None) -> list:
        """Get incidents, optionally filtered by project."""
        params = {"project_id": project_id} if project_id else None
        return await self._request("GET", "/incidents/", params=params)

    async def create_incident(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new incident."""
        return await self._request("POST", "/incidents/", data)

    async def investigate_incident(self, incident_id: int) -> Dict[str, Any]:
        """Trigger AI investigation for an incident."""
        return await self._request("POST", f"/incidents/{incident_id}/investigate/")

    # Deployment endpoints
    async def get_deployments(self, project_id: Optional[int] = None) -> list:
        """Get deployments, optionally filtered by project."""
        params = {"project_id": project_id} if project_id else None
        return await self._request("GET", "/deployments/", params=params)

    async def create_deployment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new deployment."""
        return await self._request("POST", "/deployments/", data)

    # Project data endpoints
    async def get_project_data(self, project_id: int, data_type: Optional[str] = None) -> list:
        """Get project data, optionally filtered by type."""
        params = {"project_id": project_id}
        if data_type:
            params["data_type"] = data_type
        return await self._request("GET", "/project-data/", params=params)

    async def create_project_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create project data."""
        return await self._request("POST", "/project-data/", data)

    # Auth endpoints
    async def register_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new user."""
        return await self._request("POST", "/auth/register/", data)

    async def login_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Login user."""
        return await self._request("POST", "/auth/login/", data)

    # Health check
    async def health_check(self) -> Dict[str, Any]:
        """Check Django service health."""
        return await self._request("GET", "/health/")


# Singleton instance
django_client = DjangoClient()
