-- Agent Observability Plus — Pass 7 schema additions (backlog implementation)
-- NEEDS-SCHEMA items #6-#10 from _AUDIT_NOTE.md backlog.

-- #6 spans — replace deterministic mock in obsExtras.js
CREATE TABLE IF NOT EXISTS spans (
  id SERIAL PRIMARY KEY,
  trace_id INTEGER,
  parent_span_id INTEGER,
  name VARCHAR(255),
  attrs JSONB,
  duration_ms INTEGER DEFAULT 0,
  status VARCHAR(40) DEFAULT 'ok',
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_spans_trace ON spans (trace_id);
CREATE INDEX IF NOT EXISTS idx_spans_parent ON spans (parent_span_id);

-- #7 roles + project_members (RBAC). users.role already exists in 001.
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  user_id INTEGER,
  role_name VARCHAR(60) DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members (user_id);

-- #8 retention_policies + worker bookkeeping
CREATE TABLE IF NOT EXISTS retention_policies (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(80) NOT NULL,
  ttl_days INTEGER DEFAULT 30,
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_pruned_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- #9 tenants + cost_attribution rollups keyed off projects/api_keys
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) UNIQUE NOT NULL,
  isolation_mode VARCHAR(40) DEFAULT 'logical',
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cost_attribution (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  project_name VARCHAR(255),
  api_key_label VARCHAR(255),
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  total_usd NUMERIC(12,4) DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  attribution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cost_attribution_tenant ON cost_attribution (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_attribution_window ON cost_attribution (window_start, window_end);

-- #10 replay_runs — candidate-vs-baseline replays for trace
CREATE TABLE IF NOT EXISTS replay_runs (
  id SERIAL PRIMARY KEY,
  trace_id INTEGER,
  candidate_prompt_id INTEGER,
  baseline_prompt_id INTEGER,
  verdict VARCHAR(40),
  metrics JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_runs_trace ON replay_runs (trace_id);

-- Sampling strategy (NEEDS-PRODUCT-DECISION #12 default: probabilistic)
CREATE TABLE IF NOT EXISTS sampling_policies (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255),
  strategy VARCHAR(40) DEFAULT 'probabilistic',
  sample_rate NUMERIC(5,4) DEFAULT 0.1,
  head_sample_attr VARCHAR(120),
  tail_keep_errors BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B traffic harness (NEEDS-PRODUCT-DECISION #14 default: shadow + percent split)
CREATE TABLE IF NOT EXISTS ab_experiments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  baseline_prompt_id INTEGER,
  candidate_prompt_id INTEGER,
  traffic_model VARCHAR(40) DEFAULT 'shadow',
  candidate_pct INTEGER DEFAULT 0,
  status VARCHAR(40) DEFAULT 'draft',
  verdict VARCHAR(40),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drift sentinel (MECHANICAL #5) bookkeeping
CREATE TABLE IF NOT EXISTS drift_sentinel_runs (
  id SERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ DEFAULT NOW(),
  drift_score NUMERIC(6,4),
  verdict VARCHAR(40),
  alert_id INTEGER,
  payload JSONB
);
