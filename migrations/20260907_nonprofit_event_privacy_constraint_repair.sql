-- Forward repair for databases where the early privacy constraint was created
-- as NOT VALID by schema synchronization before its source migration ran.
-- Existing incompatible attribution must block deployment rather than leave a
-- historical privacy gap hidden behind a non-validating constraint.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_stories'::regclass
       AND conname = 'chk_nonprofit_event_stories_nonidentifying_attribution'
  ) THEN
    ALTER TABLE nonprofit_event_stories
      ADD CONSTRAINT chk_nonprofit_event_stories_nonidentifying_attribution
      CHECK (attribution_preference IN ('anonymous', 'organization'));
  ELSIF EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'nonprofit_event_stories'::regclass
       AND conname = 'chk_nonprofit_event_stories_nonidentifying_attribution'
       AND NOT convalidated
  ) THEN
    ALTER TABLE nonprofit_event_stories
      VALIDATE CONSTRAINT chk_nonprofit_event_stories_nonidentifying_attribution;
  END IF;
END $$;