-- Existing environments recorded the preceding archival lock migration already.
-- Make direct table truncation fail closed so it cannot bypass row-level guards.

CREATE OR REPLACE FUNCTION reject_nonprofit_event_child_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Nonprofit event child records cannot be truncated';
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_attendance_no_truncate ON nonprofit_event_attendance;
CREATE TRIGGER trg_nonprofit_event_attendance_no_truncate
  BEFORE TRUNCATE ON nonprofit_event_attendance
  FOR EACH STATEMENT EXECUTE FUNCTION reject_nonprofit_event_child_truncate();

DROP TRIGGER IF EXISTS trg_nonprofit_event_needs_no_truncate ON nonprofit_event_needs;
CREATE TRIGGER trg_nonprofit_event_needs_no_truncate
  BEFORE TRUNCATE ON nonprofit_event_needs
  FOR EACH STATEMENT EXECUTE FUNCTION reject_nonprofit_event_child_truncate();

DROP TRIGGER IF EXISTS trg_nonprofit_event_actions_no_truncate ON nonprofit_event_actions;
CREATE TRIGGER trg_nonprofit_event_actions_no_truncate
  BEFORE TRUNCATE ON nonprofit_event_actions
  FOR EACH STATEMENT EXECUTE FUNCTION reject_nonprofit_event_child_truncate();

DROP TRIGGER IF EXISTS trg_nonprofit_event_stories_no_truncate ON nonprofit_event_stories;
CREATE TRIGGER trg_nonprofit_event_stories_no_truncate
  BEFORE TRUNCATE ON nonprofit_event_stories
  FOR EACH STATEMENT EXECUTE FUNCTION reject_nonprofit_event_child_truncate();
