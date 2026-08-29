CREATE OR REPLACE FUNCTION validate_nonprofit_event_handoff_snapshot(snapshot jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  key_name text;
BEGIN
  IF jsonb_typeof(snapshot) <> 'object' OR NOT (snapshot ? 'disclosure') OR jsonb_typeof(snapshot->'disclosure') <> 'string' THEN
    RETURN false;
  END IF;
  FOR key_name IN SELECT jsonb_object_keys(snapshot) LOOP
    IF key_name NOT IN ('geography', 'sourceCount', 'disclosure') THEN
      RETURN false;
    END IF;
  END LOOP;
  IF snapshot ? 'sourceCount' AND (jsonb_typeof(snapshot->'sourceCount') <> 'number' OR (snapshot->>'sourceCount')::numeric < 0 OR (snapshot->>'sourceCount')::numeric > 20 OR (snapshot->>'sourceCount')::numeric <> trunc((snapshot->>'sourceCount')::numeric)) THEN
    RETURN false;
  END IF;
  IF snapshot ? 'geography' THEN
    IF jsonb_typeof(snapshot->'geography') <> 'object' THEN
      RETURN false;
    END IF;
    FOR key_name IN SELECT jsonb_object_keys(snapshot->'geography') LOOP
      IF key_name NOT IN ('displayName', 'analyticalUnit') OR jsonb_typeof(snapshot->'geography'->key_name) <> 'string' THEN
        RETURN false;
      END IF;
    END LOOP;
  END IF;
  RETURN true;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_handoffs'::regclass
      AND conname = 'chk_nonprofit_event_handoffs_claim_types_nonempty'
  ) THEN
    ALTER TABLE nonprofit_event_handoffs
      ADD CONSTRAINT chk_nonprofit_event_handoffs_claim_types_nonempty
      CHECK (cardinality(claim_types) > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_handoffs'::regclass
      AND conname = 'chk_nonprofit_event_handoffs_source_snapshot_shape'
  ) THEN
    ALTER TABLE nonprofit_event_handoffs
      ADD CONSTRAINT chk_nonprofit_event_handoffs_source_snapshot_shape
      CHECK (validate_nonprofit_event_handoff_snapshot(source_snapshot));
  END IF;
END $$;