ALTER TABLE gpp_mirror_snapshots
  ADD COLUMN IF NOT EXISTS request_fingerprint varchar(64);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS gpp_mirror_snapshots_org_fingerprint_uq
  ON gpp_mirror_snapshots (org_id, request_fingerprint)
  WHERE request_fingerprint IS NOT NULL;