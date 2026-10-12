-- Preserve all existing portfolio examples and their unknown ownership.
ALTER TABLE agent_portfolio_entries ADD COLUMN IF NOT EXISTS created_by INTEGER;
CREATE INDEX IF NOT EXISTS idx_owned_agent_portfolio ON agent_portfolio_entries(tenant_id,created_by,id);
