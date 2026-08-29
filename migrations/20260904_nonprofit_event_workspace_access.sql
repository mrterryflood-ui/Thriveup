-- Historical, retired event-workspace access model. The following migration
-- creates the original tables for existing databases; the subsequent
-- 20260905 transition migrates eligible member grants into organization members
-- and freezes these tables as read-only provenance.

-- A composite foreign key must point to a true parent UNIQUE constraint, not
-- only a standalone unique index. The forward repair migration preserves this
-- requirement for environments that already ran this historical file.
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL
     OR to_regclass('public.organization_members') IS NULL THEN
    RAISE EXCEPTION
      'Event workspace access migration requires the baseline organizations and organization_members tables';
  END IF;
END $$;

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
END $$;

CREATE TABLE IF NOT EXISTS nonprofit_event_workspace_access (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id varchar(255) NOT NULL,
  authorized_by_user_id varchar(255) NOT NULL,
  authorized_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nonprofit_event_workspace_access_org_user_unique UNIQUE (org_id, user_id),
  CONSTRAINT nonprofit_event_workspace_access_active_member_fk
    FOREIGN KEY (org_id, user_id) REFERENCES organization_members(org_id, user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_workspace_access_user
  ON nonprofit_event_workspace_access(user_id);

CREATE TABLE IF NOT EXISTS nonprofit_event_workspace_access_audit (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_user_id varchar(255) NOT NULL,
  changed_by_user_id varchar(255) NOT NULL,
  action varchar(32) NOT NULL CHECK (action IN ('authorized', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_workspace_access_audit_org
  ON nonprofit_event_workspace_access_audit(org_id, created_at);

CREATE OR REPLACE FUNCTION reject_nonprofit_event_workspace_access_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Event workspace access audit records are append-only';
END $$;

DROP TRIGGER IF EXISTS trg_nonprofit_event_workspace_access_audit_append_only
  ON nonprofit_event_workspace_access_audit;
CREATE TRIGGER trg_nonprofit_event_workspace_access_audit_append_only
  BEFORE UPDATE OR DELETE ON nonprofit_event_workspace_access_audit
  FOR EACH ROW EXECUTE FUNCTION reject_nonprofit_event_workspace_access_audit_mutation();