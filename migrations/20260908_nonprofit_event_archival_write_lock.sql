-- Existing environments have already recorded the original integrity migration.
-- Reinstall the child-write lock guard so archive permanence is protected there too.

CREATE OR REPLACE FUNCTION enforce_nonprofit_event_child_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_status varchar(24);
BEGIN
  -- Retain legal referential cleanup when an event is deleted.
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  IF TG_OP <> 'INSERT' THEN
    IF TG_TABLE_NAME = 'nonprofit_event_attendance' THEN
      SELECT status INTO parent_status
        FROM nonprofit_events
       WHERE id = OLD.event_id
       FOR UPDATE;
    ELSE
      SELECT status INTO parent_status
        FROM nonprofit_events
       WHERE id = OLD.event_id
         AND org_id = OLD.org_id
       FOR UPDATE;
    END IF;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent nonprofit event does not exist';
    END IF;
    IF parent_status = 'archived' THEN
      RAISE EXCEPTION 'Archived events are read-only';
    END IF;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    IF TG_TABLE_NAME = 'nonprofit_event_attendance' THEN
      SELECT status INTO parent_status
        FROM nonprofit_events
       WHERE id = NEW.event_id
       FOR UPDATE;
    ELSE
      SELECT status INTO parent_status
        FROM nonprofit_events
       WHERE id = NEW.event_id
         AND org_id = NEW.org_id
       FOR UPDATE;
    END IF;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent nonprofit event does not exist';
    END IF;
    IF parent_status = 'archived' THEN
      RAISE EXCEPTION 'Archived events are read-only';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_attendance_active_parent ON nonprofit_event_attendance;
CREATE TRIGGER trg_nonprofit_event_attendance_active_parent
  BEFORE INSERT OR UPDATE OR DELETE ON nonprofit_event_attendance
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_event_child_mutation();

DROP TRIGGER IF EXISTS trg_nonprofit_event_needs_active_parent ON nonprofit_event_needs;
CREATE TRIGGER trg_nonprofit_event_needs_active_parent
  BEFORE INSERT OR UPDATE OR DELETE ON nonprofit_event_needs
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_event_child_mutation();

DROP TRIGGER IF EXISTS trg_nonprofit_event_actions_active_parent ON nonprofit_event_actions;
CREATE TRIGGER trg_nonprofit_event_actions_active_parent
  BEFORE INSERT OR UPDATE OR DELETE ON nonprofit_event_actions
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_event_child_mutation();

DROP TRIGGER IF EXISTS trg_nonprofit_event_stories_active_parent ON nonprofit_event_stories;
CREATE TRIGGER trg_nonprofit_event_stories_active_parent
  BEFORE INSERT OR UPDATE OR DELETE ON nonprofit_event_stories
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_event_child_mutation();