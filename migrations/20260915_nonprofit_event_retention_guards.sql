-- Community event records are retained as an auditable operational history.
-- There is no application delete path; block direct parent deletion as well.
CREATE OR REPLACE FUNCTION reject_nonprofit_event_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Nonprofit event records are retained and cannot be deleted';
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_no_delete ON nonprofit_events;
CREATE TRIGGER trg_nonprofit_event_no_delete
  BEFORE DELETE ON nonprofit_events
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_delete();

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