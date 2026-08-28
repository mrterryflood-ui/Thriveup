-- The retired nonprofit_event_workspace_access tables are a one-time source
-- of prior, explicitly granted access. Preserve continuity only for users who
-- were ordinary organization members: owner/admin/manager roles already have
-- active access, and collaborators intentionally remain ineligible.
--
-- The CTE makes the transition replay-safe. It changes only member -> staff
-- records that still have a legacy grant and records the historical grant with
-- its original actor and timestamp in the current content-free audit table.
WITH promoted_members AS (
  UPDATE organization_members AS member
  SET role = 'staff'
  FROM nonprofit_event_workspace_access AS legacy_access
  WHERE member.org_id = legacy_access.org_id
    AND member.user_id = legacy_access.user_id
    AND member.role = 'member'
  RETURNING
    member.org_id,
    member.user_id,
    legacy_access.authorized_by_user_id,
    legacy_access.authorized_at
)
INSERT INTO organization_event_workspace_access_audit (
  org_id,
  subject_user_id,
  actor_user_id,
  action,
  workspace_role,
  created_at
)
SELECT
  promoted_members.org_id,
  promoted_members.user_id,
  promoted_members.authorized_by_user_id,
  'granted',
  'staff',
  promoted_members.authorized_at
FROM promoted_members
WHERE NOT EXISTS (
  SELECT 1
  FROM organization_event_workspace_access_audit AS audit
  WHERE audit.org_id = promoted_members.org_id
    AND audit.subject_user_id = promoted_members.user_id
    AND audit.actor_user_id = promoted_members.authorized_by_user_id
    AND audit.action = 'granted'
    AND audit.workspace_role = 'staff'
);

-- No runtime route may restore the retired authorization model. Keep its
-- records for provenance until a separately authorized retention decision.
CREATE OR REPLACE FUNCTION reject_legacy_event_workspace_access_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND (
    pg_trigger_depth() > 1
    OR NOT EXISTS (SELECT 1 FROM organizations WHERE id = OLD.org_id)
  ) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Legacy event workspace access records are migration history and cannot be changed';
END $$;

DROP TRIGGER IF EXISTS trg_legacy_event_workspace_access_read_only
  ON nonprofit_event_workspace_access;
CREATE TRIGGER trg_legacy_event_workspace_access_read_only
  BEFORE INSERT OR UPDATE OR DELETE ON nonprofit_event_workspace_access
  FOR EACH ROW EXECUTE FUNCTION reject_legacy_event_workspace_access_mutation();

CREATE OR REPLACE FUNCTION reject_legacy_event_workspace_access_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Legacy event workspace access records cannot be truncated';
END $$;

DROP TRIGGER IF EXISTS trg_legacy_event_workspace_access_no_truncate
  ON nonprofit_event_workspace_access;
CREATE TRIGGER trg_legacy_event_workspace_access_no_truncate
  BEFORE TRUNCATE ON nonprofit_event_workspace_access
  FOR EACH STATEMENT EXECUTE FUNCTION reject_legacy_event_workspace_access_truncate();

CREATE OR REPLACE FUNCTION reject_legacy_event_workspace_audit_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Legacy event workspace audit records cannot be truncated';
END $$;

DROP TRIGGER IF EXISTS trg_legacy_event_workspace_audit_no_truncate
  ON nonprofit_event_workspace_access_audit;
CREATE TRIGGER trg_legacy_event_workspace_audit_no_truncate
  BEFORE TRUNCATE ON nonprofit_event_workspace_access_audit
  FOR EACH STATEMENT EXECUTE FUNCTION reject_legacy_event_workspace_audit_truncate();