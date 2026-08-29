-- A composite foreign key may reference only a parent PRIMARY KEY or UNIQUE
-- constraint. Earlier schemas used a standalone unique index for this pair,
-- which PostgreSQL can enforce locally but cannot use as the parent key for
-- nonprofit_event_workspace_access.
--
-- This is intentionally forward-only: environments that already recorded the
-- original workspace-access migration must receive the repair by filename.

DO $$
BEGIN
  -- The preflight migration normally handles this first.  Keep this repair
  -- independently safe for databases that received an older partial push
  -- without the preflight filename.
  IF to_regclass('public.organization_members') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'organization_members'
         AND column_name IN ('org_id', 'user_id')
       GROUP BY table_schema, table_name
       HAVING count(*) = 2
     ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'organization_members'
        AND column_name IN ('role', 'joined_at', 'id')
      GROUP BY table_schema, table_name
      HAVING count(*) = 3
    ) THEN
      WITH ranked AS (
        SELECT
          ctid,
          row_number() OVER (
            PARTITION BY org_id, user_id
            ORDER BY
              CASE role
                WHEN 'owner' THEN 6
                WHEN 'admin' THEN 5
                WHEN 'manager' THEN 4
                WHEN 'staff' THEN 3
                WHEN 'member' THEN 2
                WHEN 'collaborator' THEN 1
                ELSE 0
              END DESC,
              joined_at ASC NULLS LAST,
              id ASC
          ) AS row_rank
        FROM organization_members
      )
      DELETE FROM organization_members members
      USING ranked
      WHERE members.ctid = ranked.ctid
        AND ranked.row_rank > 1;
    ELSE
      DELETE FROM organization_members members
      USING organization_members duplicate
      WHERE members.org_id = duplicate.org_id
        AND members.user_id = duplicate.user_id
        AND members.ctid > duplicate.ctid;
    END IF;
  END IF;

  IF to_regclass('public.organization_members') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'organization_members'
         AND column_name IN ('org_id', 'user_id')
       GROUP BY table_schema, table_name
       HAVING count(*) = 2
     ) THEN
    IF NOT EXISTS (
      SELECT 1
        FROM pg_constraint
       WHERE conrelid = to_regclass('public.organization_members')
         AND conname = 'organization_members_org_user_unique'
         AND contype = 'u'
    ) THEN
      IF EXISTS (
        SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'organization_members'
            AND indexname = 'idx_org_members_unique'
            AND EXISTS (
              SELECT 1
              FROM pg_index idx
              JOIN pg_class index_class ON index_class.oid = idx.indexrelid
              WHERE index_class.relname = pg_indexes.indexname
                AND idx.indrelid = 'public.organization_members'::regclass
                AND idx.indisunique
                AND idx.indisvalid
                AND idx.indpred IS NULL
                AND idx.indexprs IS NULL
                AND idx.indnatts = 2
                AND (
                  SELECT array_agg(keys.attnum::integer ORDER BY keys.ordinality)
                  FROM unnest(idx.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
                ) = ARRAY[
                  (SELECT attnum::integer FROM pg_attribute
                   WHERE attrelid = 'public.organization_members'::regclass
                     AND attname = 'org_id'),
                  (SELECT attnum::integer FROM pg_attribute
                   WHERE attrelid = 'public.organization_members'::regclass
                     AND attname = 'user_id')
                ]
            )
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
  ELSE
    RAISE NOTICE 'Skipping organization_members composite-key repair: table or key columns are not present';
  END IF;
END $$;