import asyncio
import re

import httpx
from sqlalchemy import select

from app.ai.data_sources import (
    DATA_SOURCES,
    build_chat_context,
    build_global_context,
    catalog_markdown,
)
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import Project

SYSTEM_PREAMBLE = (
    "You are Dev — a highly experienced senior developer and reliability engineer "
    "who has personally built and operated systems like the user's for years. You "
    "talk like a trusted peer: warm, direct, practical. You always try to be "
    "genuinely useful, not just correct.\n\n"
    "Rules:\n"
    "1. Answer ONLY from the provided context. Never invent facts, versions, commit "
    "messages or numbers. If the context lacks the answer, say so clearly and tell "
    "the user which data source would have it.\n"
    "2. Cite the source when you reference a fact (table, API, or document).\n"
    "3. Keep the core answer focused and skimmable, then — when it is genuinely "
    "relevant — add a short, concrete piece of advice the user can act on right now, "
    "prefixed with an emoji such as \"💡 What I'd do here:\" or \"⚠️ Watch out for:\". "
    "Never pad; if there is no useful advice, omit it.\n"
    "4. Flag risks, trade-offs and quick wins you notice in their code, services or "
    "incidents — that is the value you add as a senior engineer.\n"
    "5. When discussing code changes, propose precise edits with file paths. The user "
    "can approve changes which are committed to a branch and opened as a PR.\n"
    "6. The context may cover a single selected project OR every registered project. "
    "When asked about any of the user's projects, identify it (name, repo, status, "
    "uptime, tech) from the projects list and stored documents. For deep detail "
    "(README, files, services) say the project can be selected for full context.\n"
    "7. If asked something outside your knowledge or context, be honest about what "
    "you don't know instead of guessing."
)


def _fmt_services(services) -> str:
    return "\n".join(
        f"- {s['name']}: {s['status']} ({s['latency_ms']}ms, uptime {s['uptime']}%)"
        + (f" url={s['check_url']}" if s.get("check_url") else "")
        for s in services
    ) or "- none"


def _fmt_deployments(deployments) -> str:
    return "\n".join(
        f"- {d['message']} ({d['sha']}) by {d['author']} → {d['status']} at {d['created_at']}"
        for d in deployments
    ) or "- none"


def _fmt_incidents(incidents) -> str:
    lines = []
    for i in incidents:
        lines.append(
            f"- #{i['id']} {i['title']} [{i['severity']}] service={i['service']} "
            f"status={i['status']} confidence={i['confidence']} at {i['created_at']}"
        )
        if i.get("summary"):
            lines.append(f"    summary: {i['summary'][:300]}")
        for e in i.get("events") or []:
            lines.append(f"    event[{e['event_type']}]: {e['message'][:200]}")
        for r in i.get("agent_runs") or []:
            lines.append(f"    ai_run[{r['status']} conf={r['confidence']}]: {(r.get('result') or '')[:300]}")
    return "\n".join(lines) or "- none"


def _fmt_global_projects(projects) -> str:
    lines = []
    for p in projects:
        tech = p.get("tech") or []
        lang = p.get("lang", "")
        desc = p.get("desc", "")
        svc = p.get("svc", 0)
        dep = p.get("dep", 0)
        inc = p.get("inc", 0)
        line = f"- #{p['id']} {p['name']} ({p['repo']}) — {p['status']}"
        if lang:
            line += f", {lang}"
        if desc:
            line += f" — {desc}"
        if tech:
            line += f" | tech: {', '.join(tech)}"
        line += f" | svc={svc} dep={dep} inc={inc}"
        lines.append(line)
    return "\n".join(lines) or "- none"


def _format_context(ctx: dict) -> str:
    parts = []
    if ctx.get("projects"):
        parts.append("Projects:\n" + _fmt_global_projects(ctx["projects"]))
    proj = ctx.get("project")
    if proj:
        parts.append(f"Project: {proj['name']} | {proj['repo']} | {proj['status']} | {proj['uptime']}%")
    repo = ctx.get("repository")
    if repo:
        parts.append(f"Repo: {repo['full_name']} | {repo.get('language', '')}")
    if ctx.get("readme"):
        parts.append(f"README:\n{ctx['readme'][:600]}")
    if ctx.get("tech"):
        parts.append("Tech: " + ", ".join(ctx["tech"][:8]))
    if ctx.get("services"):
        parts.append("Services: " + _fmt_services(ctx["services"]))
    if ctx.get("deployments"):
        parts.append("Deploys: " + _fmt_deployments(ctx["deployments"]))
    if ctx.get("incidents"):
        parts.append("Incidents: " + _fmt_incidents(ctx["incidents"]))
    return "\n".join(parts)


def _fmt_documents(documents: dict) -> str:
    lines = []
    for data_type, payload in documents.items():
        if isinstance(payload, list):
            lines.append(f"- {data_type}: {len(payload)} items")
        elif isinstance(payload, dict):
            keys = ", ".join(list(payload.keys())[:8])
            lines.append(f"- {data_type}: object with keys: {keys}")
        else:
            lines.append(f"- {data_type}: {str(payload)[:120]}")
    return "\n".join(lines)


async def _run_project_tools(messages: list[dict]):
    """Project-management commands the agent can execute: add / delete a project.

    Only explicit commands trigger actions, and everything is best-effort — if
    the DB is unreachable the tool quietly does nothing and normal chat resumes.
    Returns a dict with a human note when an action was taken (or asked for
    clarification), else None.
    """
    text = " ".join(m.get("content", "") for m in messages if m.get("role") == "user").strip()
    low = text.lower()
    if not text:
        return None
    try:
        if re.search(r"\b(add|connect|track)\b", low) and re.search(
            r"\b(projects?|repos?|repository)\b", low
        ):
            m = re.search(r"github\.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)", text) or re.search(
                r"\b([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)\b", text
            )
            if not m:
                return {
                    "note": "I can add a repo to your dashboard — tell me its owner/name, e.g. \"add Anshul1023/agentflow to my projects\".",
                    "changed": False,
                }
            repo = m.group(1).rstrip("/")
            async with SessionLocal() as db:
                existing = (
                    await db.execute(select(Project).where(Project.repo == repo))
                ).scalar_one_or_none()
                if existing:
                    return {
                        "note": f"✅ `{repo}` is already registered as project #{existing.id} ({existing.name}).",
                        "changed": False,
                    }
                name = repo.split("/")[-1].replace("-", " ").replace("_", " ").title()
                db.add(Project(name=name, repo=repo, status="Healthy", uptime=99.99))
                await db.commit()
                pid = (
                    await db.execute(select(Project).where(Project.repo == repo))
                ).scalar_one().id
            try:  # fetch README/files/services for the new project in the background
                from app.services.snapshot_service import refresh_one_project

                asyncio.get_running_loop().create_task(refresh_one_project(pid))
            except Exception:  # noqa: BLE001
                pass
            return {
                "note": f"✅ Added **{name}** (`{repo}`) as a new project (id #{pid}). I'm fetching its README, files and services now — ask me anything about it in a minute.",
                "changed": True,
            }
        if re.search(r"\b(delete|remove)\b", low) and re.search(
            r"\b(projects?|repos?|repository)\b", low
        ):
            async with SessionLocal() as db:
                projects = (
                    (await db.execute(select(Project).order_by(Project.id))).scalars().all()
                )
                target = None
                m = re.search(r"([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)", text)
                if m:
                    repo = m.group(1).rstrip("/")
                    target = next((p for p in projects if p.repo == repo), None)
                if not target:
                    for p in projects:
                        if p.name.lower() in low or p.repo.split("/")[-1].lower() in low:
                            target = p
                            break
                if not target:
                    return {
                        "note": "I can delete a project — say its name or repo (e.g. \"delete project Demo Production API\").",
                        "changed": False,
                    }
                from app.services.project_ops import delete_project_rows

                await delete_project_rows(db, target.id)
                await db.delete(target)
                await db.commit()
                return {
                    "note": f"🗑 Deleted **{target.name}** (`{target.repo}`) along with its services, deployments, incidents and stored documents.",
                    "changed": True,
                }
    except Exception:  # noqa: BLE001 - tool execution is best-effort
        pass
    return None


async def chat(messages: list[dict], project_id: int | None = None) -> dict:
    tool = await _run_project_tools(messages)
    if tool:
        provider = (
            settings.ai_provider
            if settings.ai_provider != "demo" and settings.openai_api_key and settings.ai_model
            else "demo"
        )
        return {
            "reply": tool["note"],
            "provider": provider,
            "tool": tool["changed"],
            "context_used": False,
            "project": None,
            "sources": [],
        }
    project = None
    ctx: dict = {}
    if project_id:
        async with SessionLocal() as db:
            project = await db.get(Project, project_id)
            repo = project.repo if project else ""
            ctx = await build_chat_context(db, project_id, repo)
    else:
        # No project selected -> give the agent the full picture of every project
        # (list, repo metadata from stored docs, counts). Best-effort: if the DB
        # is unreachable this stays empty and the reply degrades gracefully.
        async with SessionLocal() as db:
            ctx = await build_global_context(db)

    context_text = _format_context(ctx)
    if settings.ai_provider != "demo" and settings.openai_api_key and settings.ai_model:
        try:
            reply = await _call_llm(messages, context_text)
            provider = settings.ai_provider
        except Exception as exc:  # noqa: BLE001 - fall back to demo rather than erroring
            reply = _demo_reply(messages, project, ctx, context_text) + f"\n\n(LLM call failed: {exc})"
            provider = "demo"
    else:
        reply = _demo_reply(messages, project, ctx, context_text)
        provider = "demo"

    return {
        "reply": reply,
        "provider": provider,
        "context_used": bool(context_text),
        "project": project.name if project else None,
        "sources": [s["key"] for s in DATA_SOURCES],
    }


async def _call_llm(messages: list[dict], context_text: str) -> str:
    system = (
        SYSTEM_PREAMBLE
        + "\n\n"
        + catalog_markdown()
        + "\n\nContext about the project:\n"
        + context_text
    )
    payload = [{"role": "system", "content": system}] + [
        {"role": m["role"], "content": m["content"]} for m in messages
    ]
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{settings.ai_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": settings.ai_model, "messages": payload, "temperature": 0.3},
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


def _demo_reply(messages: list[dict], project, ctx: dict, context_text: str) -> str:
    lines = [
        "Hi — I'm Dev, your senior dev assistant. Demo mode is active (no LLM API key "
        "configured), so I answer from live project data:"
    ]
    if ctx.get("projects"):
        lines.append("Registered projects:\n" + _fmt_global_projects(ctx["projects"]))
    proj = ctx.get("project")
    if proj:
        lines.append(
            f"Project: {proj['name']} ({proj['repo']}) — status {proj['status']}, uptime {proj['uptime']}%"
        )
    if ctx.get("repository"):
        r = ctx["repository"]
        lines.append(f"Repository: {r['full_name']} — {r.get('description') or 'no description'} ({r.get('language')})")
    if ctx.get("readme"):
        first_line = next((ln for ln in ctx["readme"].splitlines() if ln.strip()), "")
        lines.append(f"README: {first_line[:200]}")
    if ctx.get("files"):
        lines.append(f"The repository has {len(ctx['files'])} tracked files.")
    if ctx.get("services"):
        lines.append("Monitored services:\n" + _fmt_services(ctx["services"]))
    if ctx.get("deployments"):
        lines.append("Deployments:\n" + _fmt_deployments(ctx["deployments"]))
    if ctx.get("incidents"):
        lines.append("Incidents:\n" + _fmt_incidents(ctx["incidents"]))
    if ctx.get("documents"):
        lines.append("Stored JSON documents:\n" + _fmt_documents(ctx["documents"]))
    if not context_text:
        lines.append("No project context could be loaded for this question.")
    last = messages[-1]["content"] if messages else ""
    lines.append(f"\nYou asked: {last}")
    lines.append(
        "To get real AI answers, set AI_PROVIDER, OPENAI_API_KEY, AI_MODEL and AI_BASE_URL "
        "(e.g. Groq free tier: https://api.groq.com/openai/v1)."
    )
    return "\n".join(lines)
