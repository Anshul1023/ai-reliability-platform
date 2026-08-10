import asyncio

from app.redis.queues import dequeue
from app.services.snapshot_service import refresh_project_documents
from app.services.sync_service import sync_projects_from_github
from app.workers.ai_worker import process
from app.workers.metrics_worker import run_forever as monitoring_forever


async def project_sync_forever():
    while True:
        try:
            result = await sync_projects_from_github()
            print("project sync", result)
            snapshot = await refresh_project_documents()
            print("project data refresh", snapshot)
        except Exception as exc:  # noqa: BLE001
            print("project sync failed", repr(exc))
        await asyncio.sleep(6 * 3600)  # every 6 hours


async def seed_catalog():
    """Insert/refresh the data source catalog into the data_sources table."""
    try:
        from app.ai.data_sources import seed_data_sources
        from app.core.database import SessionLocal

        async with SessionLocal() as db:
            written = await seed_data_sources(db)
        print("data sources seeded", written)
    except Exception as exc:  # noqa: BLE001
        print("data sources seed failed", repr(exc))


async def main():
    print("worker started")
    await seed_catalog()
    monitor_task = asyncio.create_task(monitoring_forever())
    sync_task = asyncio.create_task(project_sync_forever())
    while True:
        job = await dequeue(5)
        if job:
            try:
                result = await process(job)
                print("job complete", result)
            except Exception as exc:
                print("job failed", repr(exc))


if __name__ == "__main__":
    asyncio.run(main())
