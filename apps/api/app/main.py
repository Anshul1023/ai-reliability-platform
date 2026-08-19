from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import JSONResponse, Response
from sqlalchemy import select
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.redis.client import ping as redis_ping
from app.redis.rate_limiter import allow as rate_limit_allow
from app.api.routes import analytics, auth, projects, services, incidents, deployments, metrics, github, ai
from app.api.websocket import router as ws_router
from app.models.models import Project, Service, Deployment, Incident

RATE_LIMIT_EXEMPT = {"/health", "/metrics/prometheus", "/docs", "/redoc", "/openapi.json"}

REQUESTS=Counter("api_requests_total","Total API requests")

@asynccontextmanager
async def lifespan(app:FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        result=await db.execute(select(Project))
        if not result.scalars().first():
            p=Project(name="Demo Production API",repo="demo/reliability-api",status="Healthy",uptime=99.96)
            db.add(p); await db.flush()
            for name,status,lat in [("API Gateway","Healthy",220),("Payments API","Healthy",245),("AI Worker","Degraded",612),("PostgreSQL","Healthy",32),("Redis","Healthy",4)]:
                db.add(Service(project_id=p.id,name=name,status=status,latency_ms=lat,uptime=99.9))
            db.add_all([
                Deployment(project_id=p.id,sha="8f31c2a",message="Tune DB connection pool",author="Ansh",status="Passed"),
                Deployment(project_id=p.id,sha="91bd2e1",message="Add incident context tool",author="Ansh",status="Passed"),
                Incident(project_id=p.id,title="Payment API latency spike",service="Payments API",severity="Critical",status="Investigating",confidence=87,summary="Database connection timeouts increased after deployment.")
            ])
            await db.commit()
    yield
    await engine.dispose()

app=FastAPI(title=settings.app_name,version="1.0.0",lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in settings.cors_origins.split(",")],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])

@app.middleware("http")
async def count_requests(request:Request,call_next):
    REQUESTS.inc()
    return await call_next(request)

@app.middleware("http")
async def rate_limit_requests(request:Request,call_next):
    if request.url.path in RATE_LIMIT_EXEMPT:
        return await call_next(request)
    forwarded = request.headers.get("x-forwarded-for")
    client = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    try:
        allowed = await rate_limit_allow(client)
    except Exception:  # noqa: BLE001 - never break the API because of limiting
        allowed = True
    if not allowed:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Please try again shortly."})
    return await call_next(request)

@app.get("/health")
async def health():
    try:
        redis_ok = bool(await redis_ping())
    except Exception:  # noqa: BLE001 - report dependency state instead of crashing
        redis_ok = False
    return {"status": "ok", "redis": redis_ok, "environment": settings.environment}

@app.get("/metrics/prometheus")
async def prometheus():
    return Response(generate_latest(),media_type=CONTENT_TYPE_LATEST)

from app.auth.routes import router as jwt_auth_router

for router in [auth.router,jwt_auth_router,projects.router,services.router,incidents.router,deployments.router,metrics.router,github.router,ai.router,analytics.router,ws_router]:
    app.include_router(router)
