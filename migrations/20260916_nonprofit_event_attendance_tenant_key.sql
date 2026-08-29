ALTER TABLE nonprofit_event_attendance
  ADD COLUMN IF NOT EXISTS org_id varchar(100);

ALTER TABLE nonprofit_event_attendance DISABLE TRIGGER USER;
UPDATE nonprofit_event_attendance attendance
SET org_id = events.org_id
FROM nonprofit_events events
WHERE events.id = attendance.event_id
  AND attendance.org_id IS NULL;
ALTER TABLE nonprofit_event_attendance ENABLE TRIGGER USER;

ALTER TABLE nonprofit_event_attendance
  ALTER COLUMN org_id SET NOT NULL;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute child ON child.attrelid = con.conrelid AND child.attnum = ANY(con.conkey)
  JOIN pg_class parent ON parent.oid = con.confrelid
  WHERE con.conrelid = 'nonprofit_event_attendance'::regclass
    AND parent.relname = 'nonprofit_events'
    AND con.contype = 'f'
    AND child.attname = 'event_id'
  LIMIT 1;
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE nonprofit_event_attendance DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    WHERE con.conrelid = 'public.nonprofit_event_attendance'::regclass
      AND con.contype = 'f'
      AND con.confrelid = 'public.nonprofit_events'::regclass
      AND pg_get_constraintdef(con.oid) LIKE
        'FOREIGN KEY (event_id, org_id) REFERENCES nonprofit_events(id, org_id)%'
  ) THEN
    ALTER TABLE nonprofit_event_attendance
      ADD CONSTRAINT nonprofit_event_attendance_event_org_fk
      FOREIGN KEY (event_id, org_id)
      REFERENCES nonprofit_events(id, org_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nonprofit_event_handoffs'::regclass
      AND conname = 'chk_nonprofit_event_handoffs_claim_types_allowed'
  ) THEN
    ALTER TABLE nonprofit_event_handoffs
      ADD CONSTRAINT chk_nonprofit_event_handoffs_claim_types_allowed
      CHECK (claim_types <@ ARRAY['observed','derived','modeled','partner_reported','self_reported','unavailable']::text[]);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nonprofit_event_handoffs'::regclass
      AND conname = 'chk_nonprofit_event_handoffs_reviewed_consistency'
  ) THEN
    ALTER TABLE nonprofit_event_handoffs
      ADD CONSTRAINT chk_nonprofit_event_handoffs_reviewed_consistency
      CHECK (
        (status = 'pending_review' AND reviewed_by_user_id IS NULL AND reviewed_at IS NULL)
        OR (status IN ('accepted', 'declined') AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
      );
  END IF;
END $$;