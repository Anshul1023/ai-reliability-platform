-- 005_chat_messages.sql
-- Persisted AI chat history (project_id NULL = the "all projects" conversation).
-- Reads are served from a Redis cache; this table is the source of truth.

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_chat_messages_project_created
    ON chat_messages (project_id, created_at DESC);
