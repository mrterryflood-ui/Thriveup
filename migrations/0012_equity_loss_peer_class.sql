-- 0012_equity_loss_peer_class.sql
--
-- County-grain peer classification reference table for the equity-loss
-- engine's `vs_national_peer_class` frame.
--
-- Source: USDA ERS Rural-Urban Continuum Codes (RUCC) 2023 — a static,
-- one-time-downloadable county-level classification (confirmed reachable
-- 2026-08-15, see docs/equity-loss-phase1-2-decisions.md). Chosen over the
-- tract-level RUCA 2020 codes because this deployment's shipped scope is
-- county-grain, not tract-grain (tract/place resolution was descoped for
-- lack of a crosswalk and lack of tract-level age-at-death data).
--
-- This table is exhaustive (all ~3,143 US counties). It classifies; it does
-- NOT itself hold a computed benchmark value. The actual peer-class
-- benchmark loss values are computed by scripts/compute-peer-class-benchmarks.ts
-- and stored as `is_reference` rows in benchmark_metrics keyed by peer-class
-- string — see that script's header comment for the disclosed
-- representative-county-per-class methodology.

CREATE TABLE IF NOT EXISTS rucc_county_codes (
  county_fips VARCHAR(5) PRIMARY KEY,
  state_abbrev VARCHAR(2) NOT NULL,
  county_name TEXT NOT NULL,
  rucc_code SMALLINT NOT NULL, -- USDA RUCC 2023, 1 (most urban) .. 9 (most rural)
  population_2020 INTEGER,
  census_region VARCHAR(20) NOT NULL, -- Northeast | Midwest | South | West
  source_publisher VARCHAR(100) NOT NULL DEFAULT 'USDA ERS',
  source_vintage VARCHAR(10) NOT NULL DEFAULT '2023',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rucc_county_codes_rucc ON rucc_county_codes(rucc_code);
