-- Reviewed evidence handoffs are durable audit records, not deletable work items.
CREATE OR REPLACE FUNCTION enforce_nonprofit_event_handoff_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('accepted', 'declined') THEN
      RAISE EXCEPTION 'Reviewed nonprofit event handoffs are immutable';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Reviewed nonprofit event handoffs are immutable';
  END IF;
  IF NEW.status = 'accepted' AND (NEW.event_id IS NULL OR NEW.need_id IS NULL OR NEW.action_id IS NULL) THEN
    RAISE EXCEPTION 'Accepted nonprofit event handoffs require event, need, and action links';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_nonprofit_event_handoff_transition ON nonprofit_event_handoffs;
CREATE TRIGGER trg_nonprofit_event_handoff_transition
  BEFORE UPDATE OR DELETE ON nonprofit_event_handoffs
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_event_handoff_transition();