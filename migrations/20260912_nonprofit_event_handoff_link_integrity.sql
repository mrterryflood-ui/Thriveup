-- Keep every reviewed handoff link tenant-qualified and referentially valid.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_needs'::regclass
      AND conname = 'nonprofit_event_needs_id_org_unique'
  ) THEN
    ALTER TABLE nonprofit_event_needs
      ADD CONSTRAINT nonprofit_event_needs_id_org_unique UNIQUE (id, org_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_actions'::regclass
      AND conname = 'nonprofit_event_actions_id_org_unique'
  ) THEN
    ALTER TABLE nonprofit_event_actions
      ADD CONSTRAINT nonprofit_event_actions_id_org_unique UNIQUE (id, org_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_handoffs'::regclass
      AND conname = 'fk_nonprofit_event_handoffs_event_org'
  ) THEN
    ALTER TABLE nonprofit_event_handoffs
      ADD CONSTRAINT fk_nonprofit_event_handoffs_event_org
      FOREIGN KEY (event_id, org_id)
      REFERENCES nonprofit_events(id, org_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_handoffs'::regclass
      AND conname = 'fk_nonprofit_event_handoffs_need_org'
  ) THEN
    ALTER TABLE nonprofit_event_handoffs
      ADD CONSTRAINT fk_nonprofit_event_handoffs_need_org
      FOREIGN KEY (need_id, org_id)
      REFERENCES nonprofit_event_needs(id, org_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_handoffs'::regclass
      AND conname = 'fk_nonprofit_event_handoffs_action_org'
  ) THEN
    ALTER TABLE nonprofit_event_handoffs
      ADD CONSTRAINT fk_nonprofit_event_handoffs_action_org
      FOREIGN KEY (action_id, org_id)
      REFERENCES nonprofit_event_actions(id, org_id);
  END IF;
END $$;