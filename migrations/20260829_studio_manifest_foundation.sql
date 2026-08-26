-- Studio is a declarative manifest store. Published versions are append-only.
CREATE TABLE IF NOT EXISTS "studio_module_manifests" (
  "id" varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  "module_key" varchar(64) NOT NULL,
  "version" integer NOT NULL,
  "lifecycle_stage" varchar(16) NOT NULL DEFAULT 'draft',
  "is_public" boolean NOT NULL DEFAULT false,
  "manifest" jsonb NOT NULL,
  "created_by_user_id" varchar(255) NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "studio_module_manifests_key_version_unique" UNIQUE ("module_key", "version"),
  CONSTRAINT "studio_module_manifests_stage_check"
    CHECK ("lifecycle_stage" IN ('draft', 'published', 'archived')),
  CONSTRAINT "studio_module_manifests_public_check"
    CHECK (NOT "is_public" OR "lifecycle_stage" = 'published')
);
CREATE INDEX IF NOT EXISTS "studio_module_manifests_public_idx"
  ON "studio_module_manifests" ("module_key", "lifecycle_stage", "is_public");

CREATE TABLE IF NOT EXISTS "studio_audit_events" (
  "id" varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  "module_key" varchar(64) NOT NULL,
  "manifest_version" integer,
  "event_type" varchar(48) NOT NULL,
  "actor_user_id" varchar(255),
  "event_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "studio_audit_events_module_idx"
  ON "studio_audit_events" ("module_key", "created_at");

CREATE OR REPLACE FUNCTION studio_prevent_audit_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Studio audit events are append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS studio_audit_events_append_only ON "studio_audit_events";
CREATE TRIGGER studio_audit_events_append_only
  BEFORE UPDATE OR DELETE ON "studio_audit_events"
  FOR EACH ROW EXECUTE FUNCTION studio_prevent_audit_mutation();

CREATE OR REPLACE FUNCTION studio_prevent_published_manifest_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Studio manifest versions are append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS studio_published_manifest_immutable ON "studio_module_manifests";
CREATE TRIGGER studio_published_manifest_immutable
  BEFORE UPDATE OR DELETE ON "studio_module_manifests"
  FOR EACH ROW EXECUTE FUNCTION studio_prevent_published_manifest_mutation();