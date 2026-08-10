-- Monitoring support: monitored services carry their check target and last check time.
ALTER TABLE services ADD COLUMN IF NOT EXISTS check_url VARCHAR(500);
ALTER TABLE services ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP;

-- Incidents record when they were resolved (for downtime duration).
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
