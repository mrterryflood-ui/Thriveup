-- Preserve the append-only audit boundary for administrative maintenance too.
-- Row UPDATE/DELETE protection alone does not cover PostgreSQL TRUNCATE.

CREATE OR REPLACE FUNCTION reject_nonprofit_event_audit_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Nonprofit event audit records cannot be truncated';
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_audit_no_truncate ON nonprofit_event_audit_log;
CREATE TRIGGER trg_nonprofit_event_audit_no_truncate
  BEFORE TRUNCATE ON nonprofit_event_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION reject_nonprofit_event_audit_truncate();