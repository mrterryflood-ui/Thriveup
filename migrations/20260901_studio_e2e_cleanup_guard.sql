-- Published Studio versions and audit events remain append-only in normal
-- operation. The narrowly scoped exception below exists only for disposable
-- forged-session E2E fixtures: it requires BOTH an e2e-* actor id and an
-- explicit PostgreSQL session setting that the HTTP application never sets.

CREATE OR REPLACE FUNCTION studio_prevent_audit_mutation()
RETURNS trigger AS $$
BEGIN
  IF OLD.actor_user_id LIKE 'e2e-%'
     AND current_setting('studio.test_cleanup', true) = 'enabled' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Studio audit events are append-only until their retention window expires';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION studio_prevent_published_manifest_mutation()
RETURNS trigger AS $$
BEGIN
  IF OLD.lifecycle_stage = 'published'
     AND NOT (
       OLD.created_by_user_id LIKE 'e2e-%'
       AND current_setting('studio.test_cleanup', true) = 'enabled'
     ) THEN
    RAISE EXCEPTION 'Published Studio manifest versions are append-only';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;