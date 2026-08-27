-- Forward repair for environments that already recorded
-- 20260903_nonprofit_events_integrity.sql before the parent key was modeled as
-- a real UNIQUE constraint. This file must remain a new filename: the startup
-- migration runner records applied filenames and will not replay old files.

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
      FOREIGN KEY (event_id, org_id)
      REFERENCES nonprofit_events(id, org_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_actions'::regclass
       AND conname = 'fk_nonprofit_event_actions_event_org'
  ) THEN
    ALTER TABLE nonprofit_event_actions
      ADD CONSTRAINT fk_nonprofit_event_actions_event_org
      FOREIGN KEY (event_id, org_id)
      REFERENCES nonprofit_events(id, org_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_stories'::regclass
       AND conname = 'fk_nonprofit_event_stories_event_org'
  ) THEN
    ALTER TABLE nonprofit_event_stories
      ADD CONSTRAINT fk_nonprofit_event_stories_event_org
      FOREIGN KEY (event_id, org_id)
      REFERENCES nonprofit_events(id, org_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_audit_log'::regclass
       AND conname = 'fk_nonprofit_event_audit_event_org'
  ) THEN
    ALTER TABLE nonprofit_event_audit_log
      ADD CONSTRAINT fk_nonprofit_event_audit_event_org
      FOREIGN KEY (event_id, org_id)
      REFERENCES nonprofit_events(id, org_id)
      ON DELETE CASCADE;
  END IF;
END $$;