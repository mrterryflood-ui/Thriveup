-- Separate event-workspace access from ordinary organization membership roles.
-- A current membership is required through the composite foreign key below.

CREATE TABLE IF NOT EXISTS nonprofit_event_workspace_access (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id varchar(255) NOT NULL,
  authorized_by_user_id varchar(255) NOT NULL,
  authorized_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nonprofit_event_workspace_access_org_user_unique UNIQUE (org_id, user_id),
  CONSTRAINT nonprofit_event_workspace_access_active_member_fk
    FOREIGN KEY (org_id, user_id) REFERENCES organization_members(org_id, user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_workspace_access_user
  ON nonprofit_event_workspace_access(user_id);

CREATE TABLE IF NOT EXISTS nonprofit_event_workspace_access_audit (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_user_id varchar(255) NOT NULL,
  changed_by_user_id varchar(255) NOT NULL,
  action varchar(32) NOT NULL CHECK (action IN ('authorized', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_workspace_access_audit_org
  ON nonprofit_event_workspace_access_audit(org_id, created_at);

CREATE OR REPLACE FUNCTION reject_nonprofit_event_workspace_access_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Event workspace access audit records are append-only';
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_workspace_access_audit_append_only
  ON nonprofit_event_workspace_access_audit;
CREATE TRIGGER trg_nonprofit_event_workspace_access_audit_append_only
  BEFORE UPDATE OR DELETE ON nonprofit_event_workspace_access_audit
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_workspace_access_audit_mutation();