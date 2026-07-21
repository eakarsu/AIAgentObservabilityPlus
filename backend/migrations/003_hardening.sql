ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_observability_users_tenant ON users (tenant_id, email);
ALTER TABLE traces ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE traces ADD COLUMN IF NOT EXISTS external_trace_id VARCHAR(64);
ALTER TABLE traces ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);
ALTER TABLE traces ADD COLUMN IF NOT EXISTS total_cost_usd NUMERIC(14,6) DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_trace_external_tenant ON traces (tenant_id, external_trace_id) WHERE external_trace_id IS NOT NULL;
ALTER TABLE spans ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE spans ADD COLUMN IF NOT EXISTS external_span_id VARCHAR(64);
ALTER TABLE spans ADD COLUMN IF NOT EXISTS external_parent_span_id VARCHAR(64);
ALTER TABLE spans ADD COLUMN IF NOT EXISTS kind VARCHAR(40);
ALTER TABLE spans ADD COLUMN IF NOT EXISTS input_tokens BIGINT DEFAULT 0;
ALTER TABLE spans ADD COLUMN IF NOT EXISTS output_tokens BIGINT DEFAULT 0;
ALTER TABLE spans ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(14,6) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_spans_tenant_trace ON spans (tenant_id, trace_id, started_at);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_observability_alert_tenant ON alerts (tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS evaluation_datasets (
  id BIGSERIAL PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, name VARCHAR(160) NOT NULL,
  version VARCHAR(80) NOT NULL, content_hash CHAR(64) NOT NULL, case_count INTEGER NOT NULL,
  created_by INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name, version)
);
CREATE TABLE IF NOT EXISTS evaluation_runs (
  id BIGSERIAL PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, dataset_id BIGINT NOT NULL REFERENCES evaluation_datasets(id),
  project_name VARCHAR(255) NOT NULL, candidate_version VARCHAR(160) NOT NULL, baseline_version VARCHAR(160),
  threshold NUMERIC(6,5) NOT NULL, pass_rate NUMERIC(6,5) NOT NULL, regression NUMERIC(6,5),
  gate_status VARCHAR(20) NOT NULL, metrics JSONB NOT NULL, created_by INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eval_runs_tenant_project ON evaluation_runs (tenant_id, project_name, created_at DESC);
CREATE TABLE IF NOT EXISTS evaluation_cases (
  id BIGSERIAL PRIMARY KEY, run_id BIGINT NOT NULL REFERENCES evaluation_runs(id), case_ref VARCHAR(160) NOT NULL,
  passed BOOLEAN NOT NULL, score NUMERIC(8,6), latency_ms NUMERIC(12,3), details JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY, tenant_id VARCHAR(64) NOT NULL, project_name VARCHAR(255) NOT NULL,
  source_type VARCHAR(80) NOT NULL, source_id BIGINT, severity VARCHAR(20) NOT NULL,
  title VARCHAR(240) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'open', owner_id INTEGER,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_status ON incidents (tenant_id, status, created_at DESC);
