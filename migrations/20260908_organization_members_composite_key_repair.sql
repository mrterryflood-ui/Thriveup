-- A composite foreign key may reference only a parent PRIMARY KEY or UNIQUE
-- constraint. Earlier schemas used a standalone unique index for this pair,
-- which PostgreSQL can enforce locally but cannot use as the parent key for
-- nonprofit_event_workspace_access.
--
-- This is intentionally forward-only: environments that already recorded the
-- original workspace-access migration must receive the repair by filename.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'organization_members'::regclass
       AND conname = 'organization_members_org_user_unique'
       AND contype = 'u'
  ) THEN
    IF EXISTS (
      SELECT 1
        FROM pg_indexes
       WHERE schemaname = 'public'
         AND tablename = 'organization_members'
         AND indexname = 'idx_org_members_unique'
         AND indexdef LIKE '%(org_id, user_id)%'
    ) THEN
      ALTER TABLE organization_members
        ADD CONSTRAINT organization_members_org_user_unique
        UNIQUE USING INDEX idx_org_members_unique;
    ELSE
      ALTER TABLE organization_members
        ADD CONSTRAINT organization_members_org_user_unique
        UNIQUE (org_id, user_id);
    END IF;
  END IF;
END $$;