CREATE TABLE IF NOT EXISTS agent_portfolio_entries(
 id BIGSERIAL PRIMARY KEY,tenant_id TEXT,agent_ref TEXT NOT NULL UNIQUE,name TEXT NOT NULL,purpose TEXT NOT NULL,
 owner TEXT NOT NULL,model_stack JSONB NOT NULL DEFAULT '[]'::jsonb,tool_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
 schedule TEXT NOT NULL,monthly_cost_usd NUMERIC(12,2) NOT NULL,outcome_metric TEXT NOT NULL,outcome_value NUMERIC(12,2) NOT NULL,
 human_approval_policy TEXT NOT NULL,last_evaluation_score NUMERIC(5,2) NOT NULL,status TEXT NOT NULL CHECK(status IN('draft','evaluation','approved','active','paused')),
 evidence JSONB NOT NULL DEFAULT '[]'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO agent_portfolio_entries(tenant_id,agent_ref,name,purpose,owner,model_stack,tool_permissions,schedule,monthly_cost_usd,outcome_metric,outcome_value,human_approval_policy,last_evaluation_score,status,evidence)
SELECT NULL,'AGP-'||LPAD(g::text,3,'0'),
 (ARRAY['Renewal Brief Agent','Incident Evidence Agent','Proposal Draft Agent','Engineering Review Agent','Customer Signal Agent'])[((g-1)%5)+1]||' · '||CEIL(g/5.0)::int,
 (ARRAY['Prepare renewal decision briefs','Assemble incident timelines and source evidence','Draft proposals from approved records','Review pull requests against policy and test evidence','Synthesize approved customer feedback'])[((g-1)%5)+1],
 (ARRAY['Revenue Operations','Reliability Engineering','Business Development','Platform Engineering','Product Research'])[((g-1)%5)+1],
 jsonb_build_array('anthropic/claude-haiku-4.5'),jsonb_build_array('read:approved-sources','write:draft-only'),
 (ARRAY['weekdays 08:00','on incident','on approved request','on pull request','weekly Friday'])[((g-1)%5)+1],
 90+g*24,(ARRAY['hours saved','evidence completeness','proposal cycle hours','review defects found','insights verified'])[((g-1)%5)+1],
 8+g*3,'Human approval required before any external write, send, publication, or consequential action.',
 74+(g%7)*3,(ARRAY['draft','evaluation','approved','active','paused'])[((g-1)%5)+1],
 jsonb_build_array(jsonb_build_object('kind','evaluation','result','passed','version','2026.07'),jsonb_build_object('kind','owner-attestation','result',CASE WHEN g%3=0 THEN 'pending' ELSE 'verified' END))
FROM generate_series(1,15) g ON CONFLICT(agent_ref) DO NOTHING;
