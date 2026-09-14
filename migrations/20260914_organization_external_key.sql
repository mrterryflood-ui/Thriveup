ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS external_key varchar(120);

DO $$
BEGIN
  IF EXISTS (
    SELECT external_key
    FROM organizations
    WHERE external_key IS NOT NULL
    GROUP BY external_key
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce organizations.external_key uniqueness while duplicate non-null values exist';
  END IF;
END $$;

DO $$
DECLARE
  index_is_expected boolean;
BEGIN
  SELECT i.indisunique
    AND pg_get_expr(i.indpred, i.indrelid) ILIKE '%external_key%IS NOT NULL%'
    INTO index_is_expected
  FROM pg_class c
  JOIN pg_index i ON i.indexrelid = c.oid
  WHERE c.relname = 'idx_organizations_external_key';
  IF FOUND AND NOT COALESCE(index_is_expected, false) THEN
    RAISE EXCEPTION 'Existing idx_organizations_external_key does not enforce the expected unique non-null external_key invariant';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_external_key
  ON organizations (external_key)
  WHERE external_key IS NOT NULL;