-- Collapse any historical duplicate county/program rows before enforcing the
-- invariant used by the ingestion upsert.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY county_fips, benefit_type
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
         ) AS row_num
  FROM benefits_enrollment_data
)
DELETE FROM benefits_enrollment_data
WHERE id IN (SELECT id FROM ranked WHERE row_num > 1);

CREATE UNIQUE INDEX IF NOT EXISTS benefits_enrollment_data_county_benefit_uq
  ON benefits_enrollment_data (county_fips, benefit_type);