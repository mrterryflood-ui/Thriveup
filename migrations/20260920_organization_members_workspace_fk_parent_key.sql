-- Replit Publish can treat a standalone unique index as equivalent to a
-- UNIQUE constraint even though PostgreSQL cannot use that index as a
-- composite foreign-key parent. Keep an explicit, separately named parent
-- constraint so the publish diff has a concrete constraint to apply.
DO $$
BEGIN
  IF to_regclass('public.organization_members') IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'organization_members'
         AND column_name IN ('org_id', 'user_id')
       GROUP BY table_schema, table_name
       HAVING count(*) = 2
     ) THEN
    RAISE NOTICE 'Skipping workspace FK parent-key repair: organization_members key columns are not present';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM organization_members
    GROUP BY org_id, user_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create organization_members_event_workspace_fk_key: duplicate (org_id, user_id) rows exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.organization_members'::regclass
      AND conname = 'organization_members_event_workspace_fk_key'
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.organization_members
      ADD CONSTRAINT organization_members_event_workspace_fk_key
      UNIQUE (org_id, user_id);
  END IF;
END $$;