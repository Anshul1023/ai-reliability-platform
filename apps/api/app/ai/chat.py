import httpx
from sqlalchemy import select

from app.ai.data_sources import DATA_SOURCES, build_chat_context, catalog_markdown
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import Project

SYSTEM_PREAMBLE = (
    "You are the reliability assistant for the user's personal projects. "
    "Answer only from the provided context. If the context does not contain the "
    "answer, say so explicitly and tell the user which data source would have it. "
    "Never invent facts. When you reference a fact, say which data source it came "
    "from (table, API or service). When discussing code changes, propose precise "
    "edits with file paths. The user can approve changes which are committed to a "
    "branch and opened as a pull request."
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


def _format_context(ctx: dict) -> str:
    parts = []
    proj = ctx.get("project")
    if proj:
        parts.append(
            f"Project: {proj['name']} | repo={proj['repo']} | status={proj['status']} | uptime={proj['uptime']}%"
        )
    repo = ctx.get("repository")
    if repo:
        parts.append(
            f"Repository: {repo['full_name']} | {repo.get('description') or 'no description'} "
            f"| language={repo.get('language')} | default branch={repo.get('default_branch')}"
        )
    if ctx.get("readme"):
        parts.append(f"README:\n{ctx['readme'][:2500]}")
    if ctx.get("files"):
        parts.append(f"Files ({len(ctx['files'])}):\n" + "\n".join(ctx["files"][:80]))
    if ctx.get("documents"):
        parts.append("Stored JSON documents (data_type → summary):\n" + _fmt_documents(ctx["documents"]))
    if ctx.get("services"):
        parts.append("Monitored services (source: services table):\n" + _fmt_services(ctx["services"]))
    if ctx.get("deployments"):
        parts.append("Deployments (source: deployments table):\n" + _fmt_deployments(ctx["deployments"]))
    if ctx.get("incidents"):
        parts.append("Incidents (source: incidents / incident_events / agent_runs tables):\n" + _fmt_incidents(ctx["incidents"]))
    return "\n\n".join(parts)


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


async def chat(messages: list[dict], project_id: int | None = None) -> dict:
    async with SessionLocal() as db:
        project = None
        repo = ""
        if project_id:
            project = await db.get(Project, project_id)
            repo = project.repo if project else ""
        ctx = await build_chat_context(db, project_id or 0, repo)

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
    lines = ["Demo mode is active (no LLM API key configured), so I answer from live project data:"]
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
