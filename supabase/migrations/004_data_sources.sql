-- 004_data_sources.sql
-- The AI agent's data source catalog: where to get which data.
-- Seeded by app.ai.data_sources.seed_data_sources (runs on worker startup
-- and lazily from the /ai/sources endpoint).

CREATE TABLE IF NOT EXISTS data_sources (
  id          serial PRIMARY KEY,
  key         varchar(64)  UNIQUE NOT NULL,
  label       varchar(255) NOT NULL,
  kind        varchar(32)  NOT NULL,
  location    varchar(512) NOT NULL,
  fields      jsonb        NOT NULL DEFAULT '[]'::jsonb,
  description text         NOT NULL DEFAULT '',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
