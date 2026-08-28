-- Enforce the privacy and tenant-boundary invariants for private event records.
-- source_note is intentionally removed: a free-text attendance field cannot
-- guarantee aggregate-only, non-identifying records.

ALTER TABLE nonprofit_event_attendance DROP COLUMN IF EXISTS source_note;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_events'::regclass
       AND conname = 'nonprofit_events_id_org_unique'
  ) THEN
    IF EXISTS (
      SELECT 1
        FROM pg_indexes
       WHERE schemaname = 'public'
         AND tablename = 'nonprofit_events'
         AND indexname = 'idx_nonprofit_events_id_org_unique'
         AND indexdef LIKE '%(id, org_id)%'
    ) THEN
      ALTER TABLE nonprofit_events
        ADD CONSTRAINT nonprofit_events_id_org_unique
        UNIQUE USING INDEX idx_nonprofit_events_id_org_unique;
    ELSE
      ALTER TABLE nonprofit_events
        ADD CONSTRAINT nonprofit_events_id_org_unique
        UNIQUE (id, org_id);
    END IF;
  END IF;
END $$;

ALTER TABLE nonprofit_event_needs
  DROP CONSTRAINT IF EXISTS nonprofit_event_needs_event_id_fkey;
ALTER TABLE nonprofit_event_actions
  DROP CONSTRAINT IF EXISTS nonprofit_event_actions_event_id_fkey;
ALTER TABLE nonprofit_event_stories
  DROP CONSTRAINT IF EXISTS nonprofit_event_stories_event_id_fkey;
ALTER TABLE nonprofit_event_audit_log
  DROP CONSTRAINT IF EXISTS nonprofit_event_audit_log_event_id_fkey;

DO $$
DECLARE
  legacy_fk record;
BEGIN
  FOR legacy_fk IN
    SELECT child.relname AS child_table, constraint_row.conname
      FROM pg_constraint AS constraint_row
      JOIN pg_class AS child ON child.oid = constraint_row.conrelid
     WHERE constraint_row.contype = 'f'
       AND constraint_row.confrelid = 'nonprofit_events'::regclass
       AND child.relname IN (
         'nonprofit_event_needs',
         'nonprofit_event_actions',
         'nonprofit_event_stories',
         'nonprofit_event_audit_log'
       )
       AND pg_get_constraintdef(constraint_row.oid)
           LIKE 'FOREIGN KEY (event_id) REFERENCES nonprofit_events(id)%'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I DROP CONSTRAINT %I',
      legacy_fk.child_table,
      legacy_fk.conname
    );
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_needs'::regclass
       AND conname = 'fk_nonprofit_event_needs_event_org'
  ) THEN
    ALTER TABLE nonprofit_event_needs
      ADD CONSTRAINT fk_nonprofit_event_needs_event_org
      FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_actions'::regclass
       AND conname = 'fk_nonprofit_event_actions_event_org'
  ) THEN
    ALTER TABLE nonprofit_event_actions
      ADD CONSTRAINT fk_nonprofit_event_actions_event_org
      FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_stories'::regclass
       AND conname = 'fk_nonprofit_event_stories_event_org'
  ) THEN
    ALTER TABLE nonprofit_event_stories
      ADD CONSTRAINT fk_nonprofit_event_stories_event_org
      FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_audit_log'::regclass
       AND conname = 'fk_nonprofit_event_audit_event_org'
  ) THEN
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