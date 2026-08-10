import asyncio

from app.redis.queues import dequeue
from app.services.sync_service import sync_projects_from_github
from app.workers.ai_worker import process
from app.workers.metrics_worker import run_forever as monitoring_forever


async def project_sync_forever():
    while True:
        try:
            result = await sync_projects_from_github()
            print("project sync", result)
        except Exception as exc:  # noqa: BLE001
            print("project sync failed", repr(exc))
        await asyncio.sleep(6 * 3600)  # every 6 hours


async def main():
    print("worker started")
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
