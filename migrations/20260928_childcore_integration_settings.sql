-- Operator-managed ChildCORE destinations and append-only change history.
CREATE TABLE IF NOT EXISTS childcore_integration_settings (
  id varchar(32) PRIMARY KEY,
  base_url text NOT NULL,
  docs_url text NOT NULL,
  updated_by_user_id varchar(255),
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS childcore_integration_settings_audit (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id varchar(32) NOT NULL,
  actor_user_id varchar(255) NOT NULL,
  previous_base_url text,
  previous_docs_url text,
  next_base_url text NOT NULL,
  next_docs_url text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS childcore_settings_audit_created_idx
  ON childcore_integration_settings_audit (created_at);

CREATE INDEX IF NOT EXISTS childcore_settings_audit_actor_idx
  ON childcore_integration_settings_audit (actor_user_id, created_at);

CREATE OR REPLACE FUNCTION prevent_childcore_settings_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ChildCORE settings audit records are append-only';
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'childcore_settings_audit_append_only'
      AND tgrelid = 'childcore_integration_settings_audit'::regclass
  ) THEN
    CREATE TRIGGER childcore_settings_audit_append_only
      BEFORE UPDATE OR DELETE ON childcore_integration_settings_audit
      FOR EACH ROW EXECUTE FUNCTION prevent_childcore_settings_audit_mutation();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'childcore_settings_audit_no_truncate'
      AND tgrelid = 'childcore_integration_settings_audit'::regclass
  ) THEN
    CREATE TRIGGER childcore_settings_audit_no_truncate
      BEFORE TRUNCATE ON childcore_integration_settings_audit
      FOR EACH STATEMENT EXECUTE FUNCTION prevent_childcore_settings_audit_mutation();
  END IF;
END
$$;