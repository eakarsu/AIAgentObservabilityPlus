ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'default';
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS provider_request_id VARCHAR(255);
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS provider_model VARCHAR(255);
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS result_text TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_results_provider_request ON ai_results(provider_request_id) WHERE provider_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_results_tenant_feature_created ON ai_results(tenant_id, feature, created_at DESC);
