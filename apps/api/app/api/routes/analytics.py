from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.database import get_db
from app.core.security import require_api_key
from app.models.models import ContactMessage, Feedback, PageView, Project

router = APIRouter(tags=["analytics"])


class ViewEvent(BaseModel):
    path: str
    project_id: int | None = None
    visitor_id: str | None = None


class FeedbackIn(BaseModel):
    name: str
    message: str
    visitor_id: str | None = None


class ContactIn(BaseModel):
    name: str
    topic: str = ""
    email: str
    message: str


RANGES = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30)}


@router.post("/analytics/view")
async def record_view(ev: ViewEvent, db=Depends(get_db)):
    """Record a page/project view (public — every visitor's views are tracked)."""
    db.add(
        PageView(
            path=(ev.path or "/")[:300],
            project_id=ev.project_id,
            visitor_id=ev.visitor_id,
        )
    )
    await db.commit()
    return {"ok": True}


@router.get("/analytics/views")
async def analytics_views(
    range: str = "7d", db=Depends(get_db), _=Depends(require_api_key)
):
    """Owner-only visitor analytics with a time-range filter (24h / 7d / 30d / all)."""
    since = RANGES.get(range)
    q = select(PageView)
    if since:
        q = q.where(PageView.created_at >= datetime.utcnow() - since)

    rows = (await db.execute(q)).scalars().all()
    total = len(rows)
    unique = len({r.visitor_id for r in rows if r.visitor_id})

    by_project = {}
    by_path = {}
    daily = {}
    for r in rows:
        by_path[r.path] = by_path.get(r.path, 0) + 1
        day = r.created_at.strftime("%Y-%m-%d") if r.created_at else "unknown"
        daily[day] = daily.get(day, 0) + 1
        if r.project_id:
            by_project[r.project_id] = by_project.get(r.project_id, 0) + 1

    project_names = {}
    if by_project:
        projects = (
            (await db.execute(select(Project).where(Project.id.in_(list(by_project))))).scalars().all()
        )
        project_names = {p.id: p.name for p in projects}

    return {
        "range": range,
        "total_views": total,
        "unique_visitors": unique,
        "per_project": [
            {"id": pid, "name": project_names.get(pid, f"#{pid}"), "views": n}
            for pid, n in sorted(by_project.items(), key=lambda kv: -kv[1])
        ],
        "per_path": [
            {"path": p, "views": n}
            for p, n in sorted(by_path.items(), key=lambda kv: -kv[1])[:10]
        ],
        "daily": [{"date": d, "views": daily[d]} for d in sorted(daily)],
    }


@router.post("/feedback")
async def submit_feedback(fb: FeedbackIn, db=Depends(get_db)):
    """Visitor feedback (public)."""
    name = (fb.name or "Anonymous").strip()[:120]
    message = (fb.message or "").strip()
    if not message:
        raise HTTPException(422, "Message is required")
    db.add(Feedback(name=name, message=message[:2000], visitor_id=fb.visitor_id))
    await db.commit()
    return {"ok": True}


@router.get("/feedback")
async def list_feedback(db=Depends(get_db), _=Depends(require_api_key)):
    """Owner-only feedback list (newest first)."""
    rows = (
        (await db.execute(select(Feedback).order_by(Feedback.id.desc()).limit(100)))
        .scalars()
        .all()
    )
    return [
        {
            "id": f.id,
            "name": f.name,
            "message": f.message,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in rows
    ]


@router.post("/contact")
async def submit_contact(ct: ContactIn, db=Depends(get_db)):
    """Visitor contact request (public) — stored and emailed to the owner."""
    name = (ct.name or "").strip()[:120]
    email = (ct.email or "").strip()[:200]
    message = (ct.message or "").strip()
    if not name or not email or not message:
        raise HTTPException(422, "Name, email and message are required")
    db.add(
        ContactMessage(
            name=name,
            topic=(ct.topic or "").strip()[:200],
            email=email,
            message=message[:4000],
        )
    )
    await db.commit()
    from app.services.emailer import send_contact_email

    emailed = await send_contact_email(name, ct.topic, email, message)
    return {"ok": True, "emailed": emailed}


@router.get("/contact")
async def list_contacts(db=Depends(get_db), _=Depends(require_api_key)):
    """Owner-only contact requests (newest first)."""
    rows = (
        (await db.execute(select(ContactMessage).order_by(ContactMessage.id.desc()).limit(100)))
        .scalars()
        .all()
    )
    return [
        {
            "id": c.id,
            "name": c.name,
            "topic": c.topic,
            "email": c.email,
            "message": c.message,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in rows
    ]


@router.get("/profile")
async def public_profile():
    """Public owner profile for the About page."""
    from app.services.profile_data import PROFILE

    return PROFILE
