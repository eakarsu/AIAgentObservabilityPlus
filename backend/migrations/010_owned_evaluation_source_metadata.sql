-- Preserve old evaluations/incidents; new records identify their actual supplied source and owning actor.
ALTER TABLE evaluation_runs ADD COLUMN IF NOT EXISTS source_provenance TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS record_kind TEXT;
CREATE INDEX IF NOT EXISTS idx_owned_evaluation_runs ON evaluation_runs(tenant_id,created_by,id);
CREATE INDEX IF NOT EXISTS idx_owned_evaluation_incidents ON incidents(tenant_id,created_by,id);
