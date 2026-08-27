-- Enforce the privacy and tenant-boundary invariants for private event records.
-- source_note is intentionally removed: a free-text attendance field cannot
-- guarantee aggregate-only, non-identifying records.

ALTER TABLE nonprofit_event_attendance DROP COLUMN IF EXISTS source_note;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nonprofit_events_id_org_unique
  ON nonprofit_events(id, org_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nonprofit_event_needs_event_org') THEN
    ALTER TABLE nonprofit_event_needs
      ADD CONSTRAINT fk_nonprofit_event_needs_event_org
      FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nonprofit_event_actions_event_org') THEN
    ALTER TABLE nonprofit_event_actions
      ADD CONSTRAINT fk_nonprofit_event_actions_event_org
      FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nonprofit_event_stories_event_org') THEN
    ALTER TABLE nonprofit_event_stories
      ADD CONSTRAINT fk_nonprofit_event_stories_event_org
      FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nonprofit_event_audit_event_org') THEN
    ALTER TABLE nonprofit_event_audit_log
      ADD CONSTRAINT fk_nonprofit_event_audit_event_org
      FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION enforce_nonprofit_event_status_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'archived' THEN
    RAISE EXCEPTION 'Archived events are read-only';
  END IF;
  IF (OLD.status = 'planned' AND NEW.status NOT IN ('planned', 'scheduled', 'archived'))
    OR (OLD.status = 'scheduled' AND NEW.status NOT IN ('scheduled', 'completed', 'archived'))
    OR (OLD.status = 'completed' AND NEW.status NOT IN ('completed', 'archived')) THEN
    RAISE EXCEPTION 'Invalid nonprofit event status transition from % to %', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_status_transition ON nonprofit_events;
CREATE TRIGGER trg_nonprofit_event_status_transition
  BEFORE UPDATE ON nonprofit_events
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_event_status_transition();

CREATE OR REPLACE FUNCTION enforce_nonprofit_action_status_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (OLD.status = 'planned' AND NEW.status NOT IN ('planned', 'in_progress', 'blocked', 'completed'))
    OR (OLD.status = 'in_progress' AND NEW.status NOT IN ('in_progress', 'blocked', 'completed'))
    OR (OLD.status = 'blocked' AND NEW.status NOT IN ('blocked', 'in_progress', 'completed'))
    OR (OLD.status = 'completed' AND NEW.status <> 'completed') THEN
    RAISE EXCEPTION 'Invalid nonprofit action status transition from % to %', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_action_status_transition ON nonprofit_event_actions;
CREATE TRIGGER trg_nonprofit_action_status_transition
  BEFORE UPDATE ON nonprofit_event_actions
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_action_status_transition();

CREATE OR REPLACE FUNCTION reject_nonprofit_event_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Allow only referential cascade cleanup when an event is legally removed.
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Nonprofit event audit records are append-only';
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_audit_append_only ON nonprofit_event_audit_log;
CREATE TRIGGER trg_nonprofit_event_audit_append_only
  BEFORE UPDATE OR DELETE ON nonprofit_event_audit_log
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_audit_mutation();