#!/usr/bin/env bash
set -e

# Start local Redis (locks, rate limiting, queues, uptime history)
redis-server --daemonize yes

# Background worker: monitoring loop, job queue, project auto-sync
python -m app.workers.run &

# Foreground API (Hugging Face Spaces provides $PORT, default 7860)
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-7860}"
