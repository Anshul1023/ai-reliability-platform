-- JSON document store: one row per (project, data_type) holding rich project
-- data (repository metadata, README, file tree, commits, services, incidents)
-- that later feeds embeddings / vector RAG.
CREATE TABLE IF NOT EXISTS project_data (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  data_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(80) NOT NULL DEFAULT 'github',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_data_type UNIQUE (project_id, data_type)
);
CREATE INDEX IF NOT EXISTS idx_project_data_project ON project_data (project_id);
