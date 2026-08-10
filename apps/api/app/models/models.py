from datetime import datetime
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    repo: Mapped[str] = mapped_column(String(300), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="Healthy")
    uptime: Mapped[float] = mapped_column(Float, default=99.99)

class Service(Base):
    __tablename__ = "services"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(30), default="Healthy")
    latency_ms: Mapped[float] = mapped_column(Float, default=120)
    uptime: Mapped[float] = mapped_column(Float, default=99.99)
    check_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)
    last_checked: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)

class Deployment(Base):
    __tablename__ = "deployments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    sha: Mapped[str] = mapped_column(String(80))
    message: Mapped[str] = mapped_column(String(300))
    author: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="Passed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(300))
    service: Mapped[str] = mapped_column(String(150))
    severity: Mapped[str] = mapped_column(String(30), default="Warning")
    status: Mapped[str] = mapped_column(String(40), default="Investigating")
    confidence: Mapped[int] = mapped_column(Integer, default=50)
    summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)

class IncidentEvent(Base):
    __tablename__ = "incident_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id"))
    event_type: Mapped[str] = mapped_column(String(80))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AgentRun(Base):
    __tablename__ = "agent_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id"))
    status: Mapped[str] = mapped_column(String(40), default="queued")
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ProjectData(Base):
    """Rich per-project data stored as JSON documents (the future vector-RAG corpus).

    One row per (project, data_type): e.g. repository, readme, files, commits,
    services, incidents. Populated by the snapshot/refresh worker.
    """
    __tablename__ = "project_data"
    __table_args__ = (UniqueConstraint("project_id", "data_type", name="uq_project_data_type"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    data_type: Mapped[str] = mapped_column(String(80))
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    source: Mapped[str] = mapped_column(String(80), default="github")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
