-- Content-free, append-only authorization history for the private Community
-- Events & Impact workspace. Current access remains the explicit
-- organization_members role projection; this table is only the immutable
-- witness of successful member <-> staff changes.

CREATE TABLE IF NOT EXISTS organization_event_workspace_access_audit (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subject_user_id varchar(255) NOT NULL,
  actor_user_id varchar(255) NOT NULL,
  action varchar(16) NOT NULL,
  workspace_role varchar(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_org_event_workspace_access_audit_action'
  ) THEN
    ALTER TABLE organization_event_workspace_access_audit
      ADD CONSTRAINT chk_org_event_workspace_access_audit_action
      CHECK (action IN ('granted', 'revoked'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_org_event_workspace_access_audit_role'
  ) THEN
    ALTER TABLE organization_event_workspace_access_audit
      ADD CONSTRAINT chk_org_event_workspace_access_audit_role
      CHECK (workspace_role = 'staff');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_org_event_workspace_access_audit_org_created
  ON organization_event_workspace_access_audit(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_org_event_workspace_access_audit_subject_created
  ON organization_event_workspace_access_audit(subject_user_id, created_at);

CREATE OR REPLACE FUNCTION reject_org_event_workspace_access_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- The only permitted deletion is referential cleanup when its organization
  -- is deleted. Direct UPDATE and DELETE attempts must fail loudly.
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Organization event workspace access audit records are append-only';
END $$;

DROP TRIGGER IF EXISTS trg_org_event_workspace_access_audit_append_only
  ON organization_event_workspace_access_audit;
CREATE TRIGGER trg_org_event_workspace_access_audit_append_only
  BEFORE UPDATE OR DELETE ON organization_event_workspace_access_audit
  FOR EACH ROW EXECUTE FUNCTION reject_org_event_workspace_access_audit_mutation();

CREATE OR REPLACE FUNCTION reject_org_event_workspace_access_audit_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Organization event workspace access audit records cannot be truncated';
END $$;

DROP TRIGGER IF EXISTS trg_org_event_workspace_access_audit_no_truncate
  ON organization_event_workspace_access_audit;
CREATE TRIGGER trg_org_event_workspace_access_audit_no_truncate
  BEFORE TRUNCATE ON organization_event_workspace_access_audit
  FOR EACH STATEMENT EXECUTE FUNCTION reject_org_event_workspace_access_audit_truncate();