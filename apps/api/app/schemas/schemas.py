from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; name: str; repo: str; status: str; uptime: float

class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; project_id: int; title: str; service: str; severity: str; status: str; confidence: int; summary: str; created_at: datetime

class DeploymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; project_id: int; sha: str; message: str; author: str; status: str; created_at: datetime

class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; project_id: int; name: str; status: str; latency_ms: float; uptime: float

class AIResult(BaseModel):
    incident_id: int
    confidence: int
    root_cause: str
    evidence: list[str]
    recommendation: str
