-- Correct the retired-table guard for deployments that received the initial
-- transition migration before its organization-cascade allowance was added.
-- Direct edits still fail closed; deleting the parent organization continues
-- to clean up legacy provenance through its foreign key.
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