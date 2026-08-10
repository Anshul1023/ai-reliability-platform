import httpx
from sqlalchemy import select

from app.ai.rag.retriever import retrieve_project_context
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import Project

SYSTEM_PREAMBLE = (
    "You are the reliability assistant for the user's personal projects. "
    "Answer only from the provided context. If the context does not contain the "
    "answer, say so explicitly. Never invent facts. When discussing code changes, "
    "propose precise edits with file paths. The user can approve changes which are "
    "committed to a branch and opened as a pull request."
)


def _fmt_services(services) -> str:
    return "\n".join(
        f"- {s['name']}: {s['status']} ({s['latency_ms']}ms, uptime {s['uptime']}%)" for s in services
    ) or "- none"


def _fmt_incidents(incidents) -> str:
    return "\n".join(
        f"- {i['title']} [{i['severity']}] service={i['service']} status={i['status']}" for i in incidents
    ) or "- none"


def _format_context(ctx: dict) -> str:
    parts = []
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
    if ctx.get("services"):
        parts.append("Monitored services:\n" + _fmt_services(ctx["services"]))
    if ctx.get("incidents"):
        parts.append("Recent incidents:\n" + _fmt_incidents(ctx["incidents"]))
    return "\n\n".join(parts)


async def chat(messages: list[dict], project_id: int | None = None) -> dict:
    async with SessionLocal() as db:
        project = None
        if project_id:
            project = await db.get(Project, project_id)
        ctx = await retrieve_project_context(project.repo if project else "", project_id, db)

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
    }


async def _call_llm(messages: list[dict], context_text: str) -> str:
    system = SYSTEM_PREAMBLE + "\n\nContext about the project:\n" + context_text
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
    repo = ctx.get("repository")
    if project and repo:
        lines.append(
            f"Project: {project.name} ({repo['full_name']}) — {repo.get('description') or 'no description'} "
            f"({repo.get('language')}, default branch {repo.get('default_branch')})"
        )
    if ctx.get("readme"):
        first_line = next((ln for ln in ctx["readme"].splitlines() if ln.strip()), "")
        lines.append(f"README: {first_line[:200]}")
    if ctx.get("files"):
        lines.append(f"The repository has {len(ctx['files'])} tracked files.")
        top = ", ".join(ctx["files"][:15])
        lines.append(f"Top-level paths include: {top}")
    if ctx.get("services"):
        lines.append("Monitored services:\n" + _fmt_services(ctx["services"]))
    if ctx.get("incidents"):
        lines.append("Recent incidents:\n" + _fmt_incidents(ctx["incidents"]))
    if not context_text:
        lines.append("No repository context could be fetched for this question.")
    last = messages[-1]["content"] if messages else ""
    lines.append(f"\nYou asked: {last}")
    lines.append(
        "To get real AI answers, set AI_PROVIDER, OPENAI_API_KEY, AI_MODEL and AI_BASE_URL "
        "(e.g. Groq free tier: https://api.groq.com/openai/v1)."
    )
    return "\n".join(lines)
