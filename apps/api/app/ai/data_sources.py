"""Data source catalog for the AI agent.

Maps every piece of data the assistant can reference to *where* it lives
(table / API / external host), so answers stay grounded and the agent can
tell the user exactly where each fact came from.

The catalog is the code-side source of truth. It is also seeded into the
`data_sources` table so it can be queried, edited and inspected from the
database (see ensure_data_sources / seed_data_sources).
"""

from sqlalchemy import func, select

from app.models.models import (
    AgentRun,
    Deployment,
    Incident,
    IncidentEvent,
    Project,
    ProjectData,
    Service,
)

# ---------------------------------------------------------------------------
# Catalog (source of truth)
# ---------------------------------------------------------------------------

DATA_SOURCES = [
    {
        "key": "projects",
        "label": "Projects",
        "kind": "table",
        "location": "projects",
        "fields": ["id", "name", "repo", "status", "uptime"],
        "description": (
            "Every registered project: display name, GitHub repo (owner/name), "
            "overall status and uptime percent."
        ),
    },
    {
        "key": "services",
        "label": "Monitored services",
        "kind": "table",
        "location": "services",
        "fields": ["name", "status", "latency_ms", "uptime", "check_url", "last_checked"],
        "description": (
            "Live services per project (e.g. Vercel, Render Backend): health status, "
            "latency, uptime and the URL being checked."
        ),
    },
    {
        "key": "deployments",
        "label": "Deployments",
        "kind": "table",
        "location": "deployments",
        "fields": ["sha", "message", "author", "status", "created_at"],
        "description": (
            "Deployment history per project — used to correlate outages with "
            "recent changes (e.g. a deploy 3 minutes before an incident)."
        ),
    },
    {
        "key": "incidents",
        "label": "Incidents",
        "kind": "table",
        "location": "incidents",
        "fields": ["title", "service", "severity", "status", "confidence", "summary", "created_at", "resolved_at"],
        "description": "Detected outages: title, affected service, severity, current status, confidence, summary.",
    },
    {
        "key": "incident_events",
        "label": "Incident timeline",
        "kind": "table",
        "location": "incident_events",
        "fields": ["event_type", "message", "created_at"],
        "description": "Ordered events inside an incident (detected, investigated, recovered, ...).",
    },
    {
        "key": "agent_runs",
        "label": "AI investigation runs",
        "kind": "table",
        "location": "agent_runs",
        "fields": ["incident_id", "status", "confidence", "result", "created_at"],
        "description": "Results of past AI investigations: root cause, evidence, recommended action.",
    },
    {
        "key": "project_data",
        "label": "Project JSON documents (RAG corpus)",
        "kind": "table",
        "location": "project_data (JSONB)",
        "fields": ["data_type", "payload", "source", "updated_at"],
        "description": (
            "Per-project JSON documents: repository metadata, README, file tree, "
            "services, incidents. The corpus prepared for vector RAG."
        ),
    },
    {
        "key": "github",
        "label": "GitHub API",
        "kind": "api",
        "location": "GET /github/repository, GET /github/commits",
        "fields": ["full_name", "description", "language", "default_branch", "homepage", "commits"],
        "description": "Live GitHub data: repository metadata and recent commits (message, sha, author).",
    },
    {
        "key": "vercel",
        "label": "Vercel",
        "kind": "external",
        "location": "services.check_url (Vercel service row)",
        "fields": ["status", "latency_ms", "uptime"],
        "description": "Frontend host. Health is captured by monitoring in the services table.",
    },
    {
        "key": "railway",
        "label": "Railway / Render backend",
        "kind": "external",
        "location": "services.check_url (backend service row)",
        "fields": ["status", "latency_ms", "uptime"],
        "description": "Backend host. Health is captured by monitoring in the services table.",
    },
]


def catalog_markdown() -> str:
    """Compact catalog for the AI system prompt — tells the agent where data lives."""
    return "Data: projects(name,repo,status,tech,svc,dep,inc), services(name,status,latency,uptime), deployments(sha,message,status), incidents(title,severity,status,summary). You have all registered projects with their tech stacks."


# ---------------------------------------------------------------------------
# Database fetchers
# ---------------------------------------------------------------------------


async def fetch_db_context(db, project_id: int) -> dict:
    """All relational context for a project: row, services, deployments, incidents (+ events, agent runs)."""
    out: dict = {}
    project = await db.get(Project, project_id)
    if project:
        out["project"] = {
            "name": project.name,
            "repo": project.repo,
            "status": project.status,
            "uptime": project.uptime,
        }

    svcs = (
        await db.execute(select(Service).where(Service.project_id == project_id).order_by(Service.name))
    ).scalars().all()
    out["services"] = [
        {
            "name": s.name,
            "status": s.status,
            "latency_ms": s.latency_ms,
            "uptime": s.uptime,
            "check_url": s.check_url,
            "last_checked": s.last_checked.isoformat() if s.last_checked else None,
        }
        for s in svcs
    ]

    deps = (
        await db.execute(
            select(Deployment)
            .where(Deployment.project_id == project_id)
            .order_by(Deployment.created_at.desc())
            .limit(10)
        )
    ).scalars().all()
    out["deployments"] = [
        {
            "sha": d.sha,
            "message": d.message,
            "author": d.author,
            "status": d.status,
            "created_at": d.created_at.isoformat(),
        }
        for d in deps
    ]

    incs = (
        await db.execute(
            select(Incident)
            .where(Incident.project_id == project_id)
            .order_by(Incident.created_at.desc())
            .limit(10)
        )
    ).scalars().all()
    out["incidents"] = []
    for i in incs:
        events = (
            await db.execute(
                select(IncidentEvent).where(IncidentEvent.incident_id == i.id).order_by(IncidentEvent.created_at)
            )
        ).scalars().all()
        runs = (
            await db.execute(
                select(AgentRun).where(AgentRun.incident_id == i.id).order_by(AgentRun.created_at.desc()).limit(3)
            )
        ).scalars().all()
        out["incidents"].append(
            {
                "id": i.id,
                "title": i.title,
                "service": i.service,
                "severity": i.severity,
                "status": i.status,
                "confidence": i.confidence,
                "summary": i.summary,
                "created_at": i.created_at.isoformat(),
                "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
                "events": [
                    {"event_type": e.event_type, "message": e.message, "created_at": e.created_at.isoformat()}
                    for e in events
                ],
                "agent_runs": [
                    {"status": r.status, "confidence": r.confidence, "result": r.result[:2000]}
                    for r in runs
                ],
            }
        )
    return out


async def fetch_stored_documents(db, project_id: int) -> dict:
    """The JSON documents persisted in project_data (repository, readme, files, ...)."""
    rows = (
        await db.execute(
            select(ProjectData).where(ProjectData.project_id == project_id).order_by(ProjectData.data_type)
        )
    ).scalars().all()
    return {r.data_type: r.payload for r in rows}


# ---------------------------------------------------------------------------
# Chat context assembly
# ---------------------------------------------------------------------------


async def build_global_context(db) -> dict:
    """Context spanning every project, used when no single project is selected.

    Lists all projects with repo metadata taken from the stored JSON documents,
    plus per-project counts (services / deployments / incidents) and which
    document types are available. Best-effort: any DB failure yields an empty
    context so the chat never errors out.
    """
    try:
        projects = (await db.execute(select(Project).order_by(Project.id))).scalars().all()
        docs = (await db.execute(select(ProjectData))).scalars().all()

        docs_by_project: dict[int, dict] = {}
        for d in docs:
            docs_by_project.setdefault(d.project_id, {})[d.data_type] = d.payload

        svc_counts = {pid: n for pid, n in (await db.execute(
            select(Service.project_id, func.count()).group_by(Service.project_id)
        )).all()}
        dep_counts = {pid: n for pid, n in (await db.execute(
            select(Deployment.project_id, func.count()).group_by(Deployment.project_id)
        )).all()}
        inc_counts = {pid: n for pid, n in (await db.execute(
            select(Incident.project_id, func.count()).group_by(Incident.project_id)
        )).all()}

        out_projects = []
        for p in projects:
            repo_doc = (docs_by_project.get(p.id) or {}).get("repository") or {}
            tech_doc = (docs_by_project.get(p.id) or {}).get("tech") or {}
            tech_list = (tech_doc.get("tech") or [])[:6]  # max 6 tech per project
            desc = (repo_doc.get("description") or "")[:60]  # max 60 chars desc
            entry = {
                "id": p.id,
                "name": p.name,
                "repo": p.repo,
                "status": p.status,
                "lang": repo_doc.get("language", ""),
                "tech": tech_list,
                "svc": svc_counts.get(p.id, 0),
                "dep": dep_counts.get(p.id, 0),
                "inc": inc_counts.get(p.id, 0),
            }
            if desc:
                entry["desc"] = desc
            out_projects.append(entry)
        return {"projects": out_projects}
    except Exception:  # noqa: BLE001 - global context is best-effort
        return {}


async def seed_data_sources(db) -> int:
    """Upsert the catalog into the data_sources table. Returns rows written."""
    from datetime import datetime

    from app.models.models import DataSource

    written = 0
    for item in DATA_SOURCES:
        row = (
            await db.execute(select(DataSource).where(DataSource.key == item["key"]))
        ).scalar_one_or_none()
        if row:
            row.label = item["label"]
            row.kind = item["kind"]
            row.location = item["location"]
            row.fields = item["fields"]
            row.description = item["description"]
            row.updated_at = datetime.utcnow()
        else:
            db.add(
                DataSource(
                    key=item["key"],
                    label=item["label"],
                    kind=item["kind"],
                    location=item["location"],
                    fields=item["fields"],
                    description=item["description"],
                )
            )
            written += 1
    await db.commit()
    return written


async def build_chat_context(db, project_id: int, repo: str) -> dict:
    """Full grounded context for the AI chat.

    Prefers the stored JSON documents (project_data) and enriches with the
    relational tables (services, deployments, incidents, events, agent runs).
    Falls back to a live GitHub fetch only when no documents are stored yet.
    """
    ctx = await fetch_db_context(db, project_id)
    docs = await fetch_stored_documents(db, project_id)

    if docs:
        ctx["documents"] = {
            k: (v[:2000] if isinstance(v, str) else v) for k, v in docs.items() if k != "readme"
        }
        tech_doc = docs.get("tech") or {}
        if tech_doc.get("tech"):
            ctx["tech"] = tech_doc["tech"]
        if docs.get("readme"):
            ctx["readme"] = docs["readme"][:4000]
    else:
        # No stored corpus yet — pull it live so the chat still has context.
        from app.ai.rag.retriever import retrieve_project_context

        live = await retrieve_project_context(repo, project_id, db)
        ctx.update({k: v for k, v in live.items() if k not in ctx or not ctx[k]})
    return ctx
