-- Organization deletion must not cascade away retained community-event
-- history. Organizations without event-workspace history remain deletable by
-- the broader platform retention policy.
CREATE OR REPLACE FUNCTION reject_nonprofit_event_org_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM nonprofit_events WHERE org_id = OLD.id)
     OR EXISTS (SELECT 1 FROM nonprofit_event_handoffs WHERE org_id = OLD.id) THEN
    RAISE EXCEPTION 'Organization has retained community-event history and cannot be deleted';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_org_no_delete ON organizations;
CREATE TRIGGER trg_nonprofit_event_org_no_delete
  BEFORE DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_org_delete();