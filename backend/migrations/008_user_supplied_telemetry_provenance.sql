-- Imported source rows remain explicitly user-supplied, without attesting validation or approval.
ALTER TABLE traces ADD COLUMN IF NOT EXISTS source_provenance TEXT;
ALTER TABLE traces ADD COLUMN IF NOT EXISTS content_hash CHAR(64);
