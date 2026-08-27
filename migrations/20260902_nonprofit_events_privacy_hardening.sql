-- Harden the initial nonprofit-event MVP after independent privacy review.
-- Reports never return story text; this DB constraint prevents attendee-name
-- attribution from entering the private story model in the first place.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_nonprofit_event_stories_nonidentifying_attribution'
  ) THEN
    ALTER TABLE nonprofit_event_stories
      ADD CONSTRAINT chk_nonprofit_event_stories_nonidentifying_attribution
      CHECK (attribution_preference IN ('anonymous', 'organization'));
  END IF;
END $$;