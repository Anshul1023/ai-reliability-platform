import random
import time
from datetime import datetime

import httpx
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.models import Incident, IncidentEvent, Project, Service
from app.redis.client import redis
from app.services.notification_service import notify_incident

# Real monitoring for services that have a check_url set.
CHECK_TIMEOUT = 15.0        # generous: Render free tier cold-starts can take 20-60s
SLOW_MS = 2000              # latency above this marks a service "Degraded"
DOWN_STREAK_REQUIRED = 2    # consecutive failures before declaring an outage
UPTIME_WINDOW = 100         # rolling window of checks used for uptime %


def current_metrics(project_id: int):
    # Demo-only synthetic metrics for the legacy /metrics endpoint.
    base = 220 + (project_id % 3) * 15
    return {
        "project_id": project_id,
        "timestamp": time.time(),
        "latency_ms": base + random.randint(-15, 25),
        "error_rate": round(1.0 + random.random() * 1.8, 2),
        "requests_per_minute": 850 + random.randint(0, 400),
        "uptime": "99.96%",
    }


async def check_url(url: str) -> dict:
    """Perform a real HTTP check and return status/latency. Never raises."""
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=CHECK_TIMEOUT, follow_redirects=True) as client:
            r = await client.get(url)
        return {
            "ok": r.status_code < 400,
            "status": r.status_code,
            "latency_ms": round((time.time() - start) * 1000),
            "error": None,
        }
    except Exception as exc:  # noqa: BLE001 - any failure is a "down" result
        return {
            "ok": False,
            "status": None,
            "latency_ms": round((time.time() - start) * 1000),
            "error": str(exc)[:160],
        }


async def _redis_safe(fn):
    """Redis is optional at runtime; monitoring must survive it being down."""
    try:
        return await fn()
    except Exception:  # noqa: BLE001
        return None


async def record_check(service_id: int, ok: bool):
    """Track a rolling uptime window in Redis. Returns uptime % or None."""
    async def _do():
        key = f"uptime:svc:{service_id}"
        await redis.rpush(key, 1 if ok else 0)
        await redis.ltrim(key, -UPTIME_WINDOW, -1)
        values = await redis.lrange(key, 0, -1)
        return round(100 * sum(int(v) for v in values) / len(values), 2)
    return await _redis_safe(_do)


async def down_streak(service_id: int, ok: bool):
    """Track consecutive failures in Redis. Returns streak or None (no Redis)."""
    async def _do():
        key = f"streak:svc:{service_id}"
        if ok:
            await redis.delete(key)
            return 0
        n = await redis.incr(key)
        await redis.expire(key, 3600)
        return n
    return await _redis_safe(_do)


async def run_monitoring_cycle():
    """Check every service with a check_url, update its state, and open/resolve incidents."""
    async with SessionLocal() as db:
        result = await db.execute(select(Service).where(Service.check_url.is_not(None)))
        services = result.scalars().all()
        touched_projects: set[int] = set()

        for svc in services:
            res = await check_url(svc.check_url)
            ok = res["ok"]
            streak = await down_streak(svc.id, ok)
            # Without Redis we have no failure history; treat a single failure as an outage.
            evidence = streak if streak is not None else DOWN_STREAK_REQUIRED

            if not ok:
                new_status = "Down"
            elif res["latency_ms"] >= SLOW_MS:
                new_status = "Degraded"
            else:
                new_status = "Healthy"

            svc.status = new_status
            svc.latency_ms = res["latency_ms"]
            svc.last_checked = datetime.utcnow()
            uptime = await record_check(svc.id, ok)
            if uptime is not None:
                svc.uptime = uptime
            touched_projects.add(svc.project_id)

            open_incidents = (await db.execute(
                select(Incident).where(
                    Incident.project_id == svc.project_id,
                    Incident.service == svc.name,
                    Incident.status != "Resolved",
                )
            )).scalars().all()

            if new_status == "Down" and evidence >= DOWN_STREAK_REQUIRED and not open_incidents:
                detail = res["error"] or (f"HTTP {res['status']}" if res["status"] else "no response")
                incident = Incident(
                    project_id=svc.project_id,
                    title=f"{svc.name} unavailable",
                    service=svc.name,
                    severity="Critical",
                    status="Investigating",
                    confidence=70,
                    summary=f"Health check failed: {detail}",
                )
                db.add(incident)
                await db.flush()
                db.add(IncidentEvent(
                    incident_id=incident.id,
                    event_type="detected",
                    message=f"Monitoring detected {svc.name} down (failure streak {evidence}).",
                ))
                try:  # queue the AI investigation; Redis-backed so may be unavailable
                    from app.services.incident_service import queue_investigation
                    await queue_investigation(incident.id)
                    await notify_incident(incident.id, "Investigating")
                except Exception:  # noqa: BLE001
                    pass
            elif new_status != "Down" and open_incidents:
                for inc in open_incidents:
                    inc.status = "Resolved"
                    inc.resolved_at = datetime.utcnow()
                    db.add(IncidentEvent(
                        incident_id=inc.id,
                        event_type="recovered",
                        message=f"{svc.name} recovered ({new_status}).",
                    ))
                    try:
                        await notify_incident(inc.id, "Resolved")
                    except Exception:  # noqa: BLE001
                        pass

        # Roll service uptimes up to the project level.
        for pid in touched_projects:
            svcs = (await db.execute(
                select(Service).where(Service.project_id == pid)
            )).scalars().all()
            if svcs:
                avg = round(sum(s.uptime for s in svcs) / len(svcs), 2)
                await db.execute(Project.__table__.update().where(Project.id == pid).values(uptime=avg))

        await db.commit()
