import asyncio

from app.redis.queues import dequeue
from app.workers.ai_worker import process
from app.workers.metrics_worker import run_forever as monitoring_forever


async def main():
    print("worker started")
    monitor_task = asyncio.create_task(monitoring_forever())
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
