-- Retained event evidence is an audit record, not disposable working state.
-- Parent deletion is already blocked; reject direct child deletion as well.
CREATE OR REPLACE FUNCTION reject_nonprofit_event_child_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Nonprofit event child records are retained and cannot be deleted';
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_attendance_retained_delete ON nonprofit_event_attendance;
CREATE TRIGGER trg_nonprofit_event_attendance_retained_delete
  BEFORE DELETE ON nonprofit_event_attendance
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_child_delete();

DROP TRIGGER IF EXISTS trg_nonprofit_event_needs_retained_delete ON nonprofit_event_needs;
CREATE TRIGGER trg_nonprofit_event_needs_retained_delete
  BEFORE DELETE ON nonprofit_event_needs
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_child_delete();

DROP TRIGGER IF EXISTS trg_nonprofit_event_actions_retained_delete ON nonprofit_event_actions;
CREATE TRIGGER trg_nonprofit_event_actions_retained_delete
  BEFORE DELETE ON nonprofit_event_actions
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_child_delete();

DROP TRIGGER IF EXISTS trg_nonprofit_event_stories_retained_delete ON nonprofit_event_stories;
CREATE TRIGGER trg_nonprofit_event_stories_retained_delete
  BEFORE DELETE ON nonprofit_event_stories
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_child_delete();