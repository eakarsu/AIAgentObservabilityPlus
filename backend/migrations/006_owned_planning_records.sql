-- Add ownership metadata only. Existing unowned records stay unchanged and hidden
-- from the new personal planning lists; no legacy records are assigned to users.
DO $$
DECLARE entity TEXT;
BEGIN
  FOREACH entity IN ARRAY ARRAY['projects','traces','prompts','evals','alerts','prompt_versions','eval_results','api_keys'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64)', entity);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by INTEGER', entity);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS record_kind TEXT', entity);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(tenant_id,created_by,id)', 'idx_owned_' || entity, entity);
  END LOOP;
END $$;
