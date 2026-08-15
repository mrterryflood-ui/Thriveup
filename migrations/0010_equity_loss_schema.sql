-- Equity-Loss Engine schema.
--
-- Two tables, deliberately separate:
--   benchmark_metrics    — static reference/comparison values (international,
--                          national, and later state rows). Immutable once
--                          inserted with is_reference = TRUE.
--   equity_loss_results  — this platform's own computed output per geography.
--                          The engine never ingests a pre-computed loss
--                          percentage; it only ever writes here, so the
--                          claim-grounding engine can certify what it reads.
--
-- See attached_assets equity-loss engine spec for the full design rationale.

CREATE TABLE IF NOT EXISTS benchmark_metrics (
  id TEXT PRIMARY KEY,
  domain VARCHAR(30) NOT NULL,
  metric_key VARCHAR(100) NOT NULL,
  geo_level VARCHAR(20) NOT NULL, -- international | national | state | county | place | tract
  geo_value TEXT,
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  measurement_system VARCHAR(50),
  age_standardization VARCHAR(50),
  comparison_set TEXT,
  hdr_edition VARCHAR(20),
  race_ethnicity_stratum VARCHAR(50),
  rank INTEGER,
  rank_conf VARCHAR(30), -- verified | band_only | unverified_middle
  is_reference BOOLEAN NOT NULL DEFAULT FALSE,
  source_publisher VARCHAR(200) NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  -- A rank can only be displayed if its confidence is stated. This is the
  -- structural half of "never fabricate a middle-of-list rank" — the other
  -- half is the display view below, which additionally hides anything not
  -- explicitly marked 'verified'.
  CONSTRAINT benchmark_metrics_rank_conf_check CHECK (
    rank IS NULL OR rank_conf IS NOT NULL
  )
);

--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_reference_row_mutation() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_reference THEN
    RAISE EXCEPTION 'benchmark_metrics: row % is a reference row (is_reference=true) and is immutable', OLD.id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint

DROP TRIGGER IF EXISTS benchmark_metrics_immutable_reference ON benchmark_metrics;

--> statement-breakpoint

CREATE TRIGGER benchmark_metrics_immutable_reference
BEFORE UPDATE OR DELETE ON benchmark_metrics
FOR EACH ROW EXECUTE FUNCTION prevent_reference_row_mutation();

--> statement-breakpoint

-- Query-layer enforcement of rank confidence: any consumer that reads from
-- this view instead of the base table gets NULL instead of a rank whenever
-- that rank wasn't explicitly verified against the named publisher. A naive
-- display component built later cannot render a fabricated middle rank
-- because it never receives one.
CREATE OR REPLACE VIEW benchmark_metrics_display AS
SELECT
  bm.*,
  CASE WHEN bm.rank_conf = 'verified' THEN bm.rank ELSE NULL END AS display_rank
FROM benchmark_metrics bm;

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS equity_loss_results (
  id SERIAL PRIMARY KEY,
  geo_id VARCHAR(100) NOT NULL,
  geo_level VARCHAR(20) NOT NULL, -- tract | place | county | state
  frame VARCHAR(30) NOT NULL, -- vs_parent_county | vs_state | vs_national_peer_class
  race_ethnicity_stratum VARCHAR(50),
  year INTEGER NOT NULL,
  suppressed BOOLEAN NOT NULL DEFAULT FALSE,
  suppression_reason VARCHAR(50),
  hdi NUMERIC,
  ihdi NUMERIC,
  overall_loss_pct NUMERIC,
  a_health NUMERIC,
  a_education NUMERIC,
  a_income NUMERIC,
  tier VARCHAR(40) NOT NULL, -- computed | derived_with_stated_assumption | ai_estimate
  assumption_text TEXT,
  health_inequality_method VARCHAR(30) NOT NULL, -- life_table_age_at_death | geographic_dispersion
  health_value_basis VARCHAR(20), -- observed | predicted | mixed
  goalpost_scheme VARCHAR(20) NOT NULL, -- UNDP | US_specific
  coverage_flags TEXT[],
  source_vintage_years_stale INTEGER,
  engine_version VARCHAR(20) NOT NULL,
  computed_at TIMESTAMP NOT NULL DEFAULT now(),
  -- DB-level enforcement, not code review: an assumption-tier row must state
  -- its assumption, or the insert fails outright.
  CONSTRAINT equity_loss_tier2_requires_assumption CHECK (
    tier <> 'derived_with_stated_assumption'
    OR (assumption_text IS NOT NULL AND length(trim(assumption_text)) > 0)
  ),
  -- There is currently no path to tier 1 for geographic-dispersion health
  -- inputs — see spec §3. Enforced here so a future code change cannot
  -- silently regress this guarantee.
  CONSTRAINT equity_loss_geo_dispersion_capped_at_tier2 CHECK (
    health_inequality_method <> 'geographic_dispersion' OR tier <> 'computed'
  )
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS equity_loss_results_geo_idx
  ON equity_loss_results (geo_id, frame, year);
