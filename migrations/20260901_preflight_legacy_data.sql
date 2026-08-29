-- Compatibility preflight for databases that already contain rows created
-- before the event-workspace constraints were introduced.
--
-- This migration intentionally runs before 20260902...20260916.  It does not
-- invent participant data: duplicate membership rows are collapsed to one
-- canonical relationship, and malformed handoff metadata is normalized to
-- explicit review/unavailable states so later CHECK/UNIQUE constraints can be
-- applied without rejecting an otherwise usable production database.

DO $$
DECLARE
  removed_members integer := 0;
BEGIN
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
      EXECUTE $sql$
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
          AND ranked.row_rank > 1
      $sql$;
    ELSE
      EXECUTE $sql$
        DELETE FROM organization_members members
        USING organization_members duplicate
        WHERE members.org_id = duplicate.org_id
          AND members.user_id = duplicate.user_id
          AND members.ctid > duplicate.ctid
      $sql$;
    END IF;

    GET DIAGNOSTICS removed_members = ROW_COUNT;
    IF removed_members > 0 THEN
      RAISE NOTICE 'organization_members preflight removed % duplicate relationship row(s)', removed_members;
    END IF;
  END IF;
END $$;

-- Fail early with an actionable compatibility error instead of allowing a
-- later constraint/function migration to fail after partial normalization.
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL
     AND to_regclass('public.organization_members') IS NULL THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: organizations exists but organization_members is missing; restore the baseline membership schema before event-workspace migrations';
  END IF;

  IF to_regclass('public.nonprofit_event_handoffs') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nonprofit_event_handoffs'
        AND column_name IN (
          'id', 'org_id', 'status', 'claim_types', 'resource_verification',
          'source_snapshot', 'reviewed_by_user_id', 'reviewed_at',
          'event_id', 'need_id', 'action_id'
        )
      GROUP BY table_schema, table_name
      HAVING count(*) = 11
    ) THEN
      RAISE EXCEPTION
        'Legacy compatibility preflight: nonprofit_event_handoffs exists but is missing required columns for event-workspace migrations';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nonprofit_event_handoffs'
        AND (
          (column_name = 'claim_types' AND udt_name <> '_text')
          OR (column_name = 'source_snapshot' AND udt_name <> 'jsonb')
          OR (column_name IN ('status', 'resource_verification')
              AND udt_name NOT IN ('text', 'varchar', 'bpchar'))
        )
    ) THEN
      RAISE EXCEPTION
        'Legacy compatibility preflight: nonprofit_event_handoffs has incompatible column types; expected claim_types text[], source_snapshot jsonb, and textual status/resource_verification';
    END IF;
  END IF;

  IF to_regclass('public.nonprofit_events') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'nonprofit_events'
         AND column_name IN ('id', 'org_id', 'status')
       GROUP BY table_schema, table_name
       HAVING count(*) = 3
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_events exists but lacks id, org_id, or status';
  END IF;

  IF to_regclass('public.nonprofit_event_needs') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'nonprofit_event_needs'
         AND column_name IN ('id', 'event_id', 'org_id')
       GROUP BY table_schema, table_name
       HAVING count(*) = 3
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_needs exists but lacks id, event_id, or org_id';
  END IF;

  IF to_regclass('public.nonprofit_event_actions') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'nonprofit_event_actions'
         AND column_name IN ('id', 'event_id', 'org_id')
       GROUP BY table_schema, table_name
       HAVING count(*) = 3
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_actions exists but lacks id, event_id, or org_id';
  END IF;

  IF to_regclass('public.nonprofit_event_stories') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'nonprofit_event_stories'
         AND column_name IN ('id', 'event_id', 'org_id')
       GROUP BY table_schema, table_name
       HAVING count(*) = 3
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_stories exists but lacks id, event_id, or org_id';
  END IF;

  IF to_regclass('public.nonprofit_event_audit_log') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'nonprofit_event_audit_log'
         AND column_name IN ('id', 'event_id', 'org_id')
       GROUP BY table_schema, table_name
       HAVING count(*) = 3
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_audit_log exists but lacks id, event_id, or org_id';
  END IF;
END $$;

-- Composite event foreign keys must not discover orphaned or cross-tenant
-- legacy rows only after ALTER TABLE has already begun.
DO $$
BEGIN
  IF to_regclass('public.nonprofit_events') IS NOT NULL
     AND to_regclass('public.nonprofit_event_needs') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_needs child
       LEFT JOIN nonprofit_events parent
         ON parent.id = child.event_id
        AND parent.org_id = child.org_id
       WHERE child.event_id IS NOT NULL
         AND parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_needs contains an orphaned or cross-organization event link';
  END IF;

  IF to_regclass('public.nonprofit_events') IS NOT NULL
     AND to_regclass('public.nonprofit_event_actions') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_actions child
       LEFT JOIN nonprofit_events parent
         ON parent.id = child.event_id
        AND parent.org_id = child.org_id
       WHERE parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_actions contains an orphaned or cross-organization event link';
  END IF;

  IF to_regclass('public.nonprofit_events') IS NOT NULL
     AND to_regclass('public.nonprofit_event_stories') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_stories child
       LEFT JOIN nonprofit_events parent
         ON parent.id = child.event_id
        AND parent.org_id = child.org_id
       WHERE parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_stories contains an orphaned or cross-organization event link';
  END IF;

  IF to_regclass('public.nonprofit_events') IS NOT NULL
     AND to_regclass('public.nonprofit_event_audit_log') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_audit_log child
       LEFT JOIN nonprofit_events parent
         ON parent.id = child.event_id
        AND parent.org_id = child.org_id
       WHERE parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_audit_log contains an orphaned or cross-organization event link';
  END IF;

  IF to_regclass('public.nonprofit_event_handoffs') IS NOT NULL
     AND to_regclass('public.nonprofit_event_actions') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_actions child
       LEFT JOIN nonprofit_event_handoffs parent
         ON parent.id = child.handoff_id
        AND parent.org_id = child.org_id
       WHERE child.handoff_id IS NOT NULL
         AND parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_actions contains an orphaned or cross-organization handoff link';
  END IF;

  IF to_regclass('public.nonprofit_event_handoffs') IS NOT NULL
     AND to_regclass('public.nonprofit_events') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_handoffs child
       LEFT JOIN nonprofit_events parent
         ON parent.id = child.event_id
        AND parent.org_id = child.org_id
       WHERE child.event_id IS NOT NULL
         AND parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_handoffs contains an orphaned or cross-organization event link';
  END IF;

  IF to_regclass('public.nonprofit_event_handoffs') IS NOT NULL
     AND to_regclass('public.nonprofit_event_needs') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_handoffs child
       LEFT JOIN nonprofit_event_needs parent
         ON parent.id = child.need_id
        AND parent.org_id = child.org_id
       WHERE child.need_id IS NOT NULL
         AND parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_handoffs contains an orphaned or cross-organization need link';
  END IF;

  IF to_regclass('public.nonprofit_event_handoffs') IS NOT NULL
     AND to_regclass('public.nonprofit_event_actions') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM nonprofit_event_handoffs child
       LEFT JOIN nonprofit_event_actions parent
         ON parent.id = child.action_id
        AND parent.org_id = child.org_id
       WHERE child.action_id IS NOT NULL
         AND parent.id IS NULL
     ) THEN
    RAISE EXCEPTION
      'Legacy compatibility preflight: nonprofit_event_handoffs contains an orphaned or cross-organization action link';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.nonprofit_event_handoffs') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nonprofit_event_handoffs'
        AND column_name IN ('status', 'reviewed_by_user_id', 'reviewed_at')
      GROUP BY table_schema, table_name
      HAVING count(*) = 3
    ) THEN
      -- A reviewed handoff with incomplete review metadata cannot satisfy the
      -- later consistency CHECK. Keep it for human review instead of
      -- fabricating a reviewer or review timestamp.
      ALTER TABLE nonprofit_event_handoffs DISABLE TRIGGER USER;
      UPDATE nonprofit_event_handoffs
      SET status = 'pending_review',
          reviewed_by_user_id = NULL,
          reviewed_at = NULL
      WHERE status IS NULL
         OR status NOT IN ('pending_review', 'accepted', 'declined')
         OR (
           status IN ('accepted', 'declined')
           AND (reviewed_by_user_id IS NULL OR reviewed_at IS NULL)
         )
         OR (
           status = 'pending_review'
           AND (reviewed_by_user_id IS NOT NULL OR reviewed_at IS NOT NULL)
         );
      ALTER TABLE nonprofit_event_handoffs ENABLE TRIGGER USER;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nonprofit_event_handoffs'
        AND column_name = 'claim_types'
        AND udt_name = '_text'
    ) THEN
      -- Preserve only the closed vocabulary used by the constraint. A row
      -- with no trustworthy claim type becomes explicitly unavailable.
      UPDATE nonprofit_event_handoffs handoff
      SET claim_types = COALESCE(
        (
          SELECT ARRAY_AGG(value ORDER BY ordinal)
          FROM unnest(COALESCE(handoff.claim_types, ARRAY[]::text[]))
            WITH ORDINALITY AS claims(value, ordinal)
          WHERE value = ANY (
            ARRAY['observed', 'derived', 'modeled', 'partner_reported',
                  'self_reported', 'unavailable']::text[]
          )
        ),
        ARRAY['unavailable']::text[]
      );
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nonprofit_event_handoffs'
        AND column_name = 'resource_verification'
    ) THEN
      UPDATE nonprofit_event_handoffs
      SET resource_verification = 'unknown'
      WHERE resource_verification IS NULL
         OR resource_verification NOT IN ('verified', 'source-listed-unverified', 'unknown');
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'nonprofit_event_handoffs'
        AND column_name = 'source_snapshot'
        AND udt_name = 'jsonb'
    ) THEN
      -- Project legacy snapshots onto the allowlisted shape required by the
      -- provenance CHECK. Disclosure is mandatory and explicit when unusable.
      UPDATE nonprofit_event_handoffs handoff
      SET source_snapshot = jsonb_strip_nulls(
        jsonb_build_object(
          'disclosure',
            CASE
              WHEN jsonb_typeof(handoff.source_snapshot->'disclosure') = 'string'
                THEN handoff.source_snapshot->>'disclosure'
              ELSE 'Historical source disclosure unavailable; requires review.'
            END,
          'sourceCount',
            CASE
              WHEN jsonb_typeof(handoff.source_snapshot->'sourceCount') = 'number'
               AND (handoff.source_snapshot->>'sourceCount')::numeric >= 0
               AND (handoff.source_snapshot->>'sourceCount')::numeric <= 20
               AND (handoff.source_snapshot->>'sourceCount')::numeric =
                   trunc((handoff.source_snapshot->>'sourceCount')::numeric)
                THEN handoff.source_snapshot->'sourceCount'
              ELSE NULL
            END,
          'geography',
            CASE
              WHEN jsonb_typeof(handoff.source_snapshot->'geography') = 'object'
                THEN jsonb_strip_nulls(jsonb_build_object(
                  'displayName',
                    CASE
                      WHEN jsonb_typeof(handoff.source_snapshot->'geography'->'displayName') = 'string'
                        THEN handoff.source_snapshot->'geography'->'displayName'
                      ELSE NULL
                    END,
                  'analyticalUnit',
                    CASE
                      WHEN jsonb_typeof(handoff.source_snapshot->'geography'->'analyticalUnit') = 'string'
                        THEN handoff.source_snapshot->'geography'->'analyticalUnit'
                      ELSE NULL
                    END
                ))
              ELSE NULL
            END
        )
      );
    END IF;
  END IF;
END $$;