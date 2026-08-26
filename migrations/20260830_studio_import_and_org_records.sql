-- Safe, append-only Studio import inventory and organization records.
CREATE TABLE IF NOT EXISTS "studio_import_inventories" (
  "id" varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_label" varchar(120) NOT NULL,
  "actor_user_id" varchar(255),
  "items" jsonb NOT NULL,
  "counts" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "studio_import_inventories_created_idx" ON "studio_import_inventories" ("created_at");
CREATE OR REPLACE FUNCTION studio_prevent_import_inventory_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Studio import inventories are append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS studio_import_inventories_append_only ON "studio_import_inventories";
CREATE TRIGGER studio_import_inventories_append_only
  BEFORE UPDATE OR DELETE ON "studio_import_inventories"
  FOR EACH ROW EXECUTE FUNCTION studio_prevent_import_inventory_mutation();
CREATE TABLE IF NOT EXISTS "studio_module_records" (
  "id" varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  "module_key" varchar(64) NOT NULL,
  "module_version" integer NOT NULL,
  "org_id" varchar(100) NOT NULL,
  "actor_user_id" varchar(255) NOT NULL,
  "values" jsonb NOT NULL,
  "provenance" jsonb NOT NULL,
  "retention_until" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "studio_module_records_module_org_time_idx" ON "studio_module_records" ("module_key", "org_id", "created_at");
CREATE INDEX IF NOT EXISTS "studio_module_records_org_time_idx" ON "studio_module_records" ("org_id", "created_at");
CREATE INDEX IF NOT EXISTS "studio_module_records_retention_idx" ON "studio_module_records" ("retention_until");