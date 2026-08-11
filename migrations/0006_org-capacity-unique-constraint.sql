-- Idempotent unique constraint on org_capacity(org_id, program_code).
-- Required for the PATCH upsert (onConflictDoUpdate) to work in any environment
-- whose org_capacity table predates this change. Safe to run multiple times.
CREATE TABLE IF NOT EXISTS org_capacity (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  org_name text NOT NULL,
  program_code text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  wait_weeks integer,
  note text,
  contact_phone text,
  contact_url text,
  service_zips text[],
  updated_at timestamptz DEFAULT now(),
  updated_by_partner_key text
);

-- Add the unique index if it does not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'org_capacity'
      AND indexname  = 'org_capacity_org_program_uq'
  ) THEN
    CREATE UNIQUE INDEX org_capacity_org_program_uq ON org_capacity (org_id, program_code);
  END IF;
END$$;
