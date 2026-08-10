import asyncio

from app.services.monitoring_service import run_monitoring_cycle


async def run_forever(interval: int = 30):
    print("monitoring worker started")
    while True:
        try:
            await run_monitoring_cycle()
        except Exception as exc:  # noqa: BLE001
            print("monitoring cycle failed", repr(exc))
        await asyncio.sleep(interval)
