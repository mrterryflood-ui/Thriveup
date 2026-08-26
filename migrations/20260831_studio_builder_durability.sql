-- Governed Studio builder durability: shared rate windows, cross-instance
-- cache revisions, and retention-bounded operational metadata.
CREATE TABLE IF NOT EXISTS "studio_rate_limit_windows" (
  "bucket_key" varchar(255) PRIMARY KEY,
  "window_started_at" timestamp NOT NULL DEFAULT now(),
  "attempts" integer NOT NULL DEFAULT 0,
  "expires_at" timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "studio_rate_limit_windows_expires_idx"
  ON "studio_rate_limit_windows" ("expires_at");

CREATE TABLE IF NOT EXISTS "studio_manifest_cache_revisions" (
  "module_key" varchar(64) PRIMARY KEY,
  "version" integer NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "studio_audit_events"
  ADD COLUMN IF NOT EXISTS "retention_until" timestamp;
UPDATE "studio_audit_events"
  SET "retention_until" = "created_at" + INTERVAL '730 days'
  WHERE "retention_until" IS NULL;
ALTER TABLE "studio_audit_events"
  ALTER COLUMN "retention_until" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "studio_audit_events_retention_idx"
  ON "studio_audit_events" ("retention_until");

ALTER TABLE "studio_import_inventories"
  ADD COLUMN IF NOT EXISTS "retention_until" timestamp;
UPDATE "studio_import_inventories"
  SET "retention_until" = "created_at" + INTERVAL '90 days'
  WHERE "retention_until" IS NULL;
ALTER TABLE "studio_import_inventories"
  ALTER COLUMN "retention_until" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "studio_import_inventories_retention_idx"
  ON "studio_import_inventories" ("retention_until");

-- Active rows remain append-only. The server may purge only rows whose
-- declared retention window has elapsed; direct early edits/deletes still fail.
CREATE OR REPLACE FUNCTION studio_prevent_audit_mutation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD."retention_until" <= now() THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Studio audit events are append-only until their retention window expires';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION studio_prevent_import_inventory_mutation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD."retention_until" <= now() THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Studio import inventories are append-only until their retention window expires';
END;
$$ LANGUAGE plpgsql;