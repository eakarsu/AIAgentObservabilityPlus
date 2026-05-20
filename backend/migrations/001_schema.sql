-- Agent Observability Plus schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(120) NOT NULL,
  name VARCHAR(120),
  role VARCHAR(30) DEFAULT 'commander',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id SERIAL PRIMARY KEY,
  feature VARCHAR(80) NOT NULL,
  input JSONB,
  output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created ON ai_results (feature, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title VARCHAR(200),
  body TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  source VARCHAR(80),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(60),
  resource_id INTEGER,
  filename VARCHAR(255),
  original_name VARCHAR(255),
  mimetype VARCHAR(120),
  size_bytes INTEGER,
  uploaded_by VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120),
  url VARCHAR(500),
  secret VARCHAR(120),
  events TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER,
  event VARCHAR(120),
  payload JSONB,
  status_code INTEGER,
  response_body TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  environment VARCHAR(255),
  status VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traces (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255),
  span_count INTEGER DEFAULT 0,
  status VARCHAR(255),
  duration_ms INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompts (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255),
  name VARCHAR(255),
  version VARCHAR(255),
  model VARCHAR(255),
  perf_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evals (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255),
  name VARCHAR(255),
  eval_type VARCHAR(255),
  pass_rate INTEGER DEFAULT 0,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255),
  severity VARCHAR(255),
  message TEXT,
  status VARCHAR(255),
  fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id SERIAL PRIMARY KEY,
  prompt_name VARCHAR(255),
  version VARCHAR(255),
  content TEXT,
  perf_score INTEGER DEFAULT 0,
  deployed VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eval_results (
  id SERIAL PRIMARY KEY,
  eval_name VARCHAR(255),
  sample_count INTEGER DEFAULT 0,
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255),
  key_prefix VARCHAR(255),
  label VARCHAR(255),
  last_used TIMESTAMPTZ,
  status VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
