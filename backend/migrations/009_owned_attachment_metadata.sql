-- Preserve all old attachments. New imports are private user-supplied records without approval attestation.
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS record_kind TEXT;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_owned_attachment_records ON attachments(tenant_id,created_by,resource_type,resource_id,id);
