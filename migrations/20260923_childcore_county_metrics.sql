-- Create childcore_county_metrics table for ChildCORE inbound data pushes.
-- Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS childcore_county_metrics (
  id                    VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  fips_code             VARCHAR(10)  NOT NULL,
  county_name           VARCHAR(100),
  state_fips            VARCHAR(2),
  desert_rate           REAL,
  prek_enrollment_rate  REAL,
  kindergarten_readiness REAL,
  subsidy_access_rate   REAL,
  child_poverty_rate    REAL,
  staff_turnover_rate   REAL,
  raw_metrics           JSONB,
  received_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  pushed_by             VARCHAR(100) DEFAULT 'childcore'
);

CREATE INDEX IF NOT EXISTS childcore_county_metrics_fips_idx     ON childcore_county_metrics (fips_code);
CREATE INDEX IF NOT EXISTS childcore_county_metrics_received_idx ON childcore_county_metrics (received_at);
