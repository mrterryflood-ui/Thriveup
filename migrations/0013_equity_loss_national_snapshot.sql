-- 0013_equity_loss_national_snapshot.sql
--
-- Nationwide equity-loss snapshot table.
--
-- equity_loss_results (0010) is deliberately an append-only, per-request
-- audit log: every live lookup of /api/equity-loss/county/:state/:county
-- inserts a fresh row, on purpose, so history is never overwritten.
-- That design does not fit a nationwide feature: a batch job computing
-- ~3,143 counties needs a re-runnable, idempotent "current value per
-- county per frame" table it can upsert into, without growing unbounded
-- or letting a stale run's rows outlive a fresh recompute.
--
-- This table is that current-snapshot store. It is populated by
-- scripts/compute-nationwide-equity-loss.ts and read by the nationwide
-- browsing API (GET /api/equity-loss/national). It does not replace
-- equity_loss_results — the single-county detail lookup keeps using the
-- live per-request path and its audit trail unchanged.

CREATE TABLE IF NOT EXISTS equity_loss_national_snapshot (
  id SERIAL PRIMARY KEY,
  state_fips VARCHAR(2) NOT NULL,
  county_fips VARCHAR(5) NOT NULL,
  county_name TEXT NOT NULL,
  state_abbrev VARCHAR(2) NOT NULL,
  frame VARCHAR(30) NOT NULL, -- vs_parent_county | vs_state | vs_national_peer_class
  peer_class VARCHAR(60),
  hdi NUMERIC,
  ihdi NUMERIC,
  overall_loss_pct NUMERIC,
  a_health NUMERIC,
  a_education NUMERIC,
  a_income NUMERIC,
  divergence_pct NUMERIC,
  suppressed BOOLEAN NOT NULL DEFAULT FALSE,
  suppression_reason VARCHAR(50),
  tier VARCHAR(40) NOT NULL,
  assumption_text TEXT,
  engine_version VARCHAR(20) NOT NULL,
  batch_run_id VARCHAR(40) NOT NULL,
  computed_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT equity_loss_national_snapshot_unique UNIQUE (county_fips, frame)
);

CREATE INDEX IF NOT EXISTS equity_loss_national_snapshot_state_idx
  ON equity_loss_national_snapshot (state_fips, frame);

CREATE INDEX IF NOT EXISTS equity_loss_national_snapshot_loss_idx
  ON equity_loss_national_snapshot (overall_loss_pct);

CREATE INDEX IF NOT EXISTS equity_loss_national_snapshot_peer_class_idx
  ON equity_loss_national_snapshot (peer_class);

-- One row per batch run, so the API/UI can disclose "as of" freshness and
-- a client can tell a stale/partial run from a healthy one, matching this
-- project's existing convention of disclosing data provenance rather than
-- presenting live-looking numbers with no freshness signal.
CREATE TABLE IF NOT EXISTS equity_loss_national_batch_runs (
  batch_run_id VARCHAR(40) PRIMARY KEY,
  started_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP,
  counties_attempted INTEGER NOT NULL DEFAULT 0,
  counties_succeeded INTEGER NOT NULL DEFAULT 0,
  counties_suppressed INTEGER NOT NULL DEFAULT 0,
  counties_failed INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- running | completed | failed
  error_summary TEXT
);
