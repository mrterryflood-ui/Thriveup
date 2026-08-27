-- Hardening for the Community Opportunity Mirror lifecycle.
ALTER TABLE gpp_opportunity_handoffs
  ADD COLUMN IF NOT EXISTS request_hash varchar(64);

CREATE TABLE IF NOT EXISTS gpp_opportunity_handoff_attempts (
  id text PRIMARY KEY,
  handoff_id text NOT NULL REFERENCES gpp_opportunity_handoffs(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  outcome varchar(32) NOT NULL CHECK (outcome IN ('delivered','rejected','unavailable','delivery_unknown')),
  http_status integer,
  accepted boolean,
  external_pursuit_id varchar(200),
  idempotency_key varchar(200) NOT NULL,
  error_class varchar(64),
  response_hash varchar(64)
);

CREATE INDEX IF NOT EXISTS gpp_opportunity_handoff_attempts_handoff_started_idx
  ON gpp_opportunity_handoff_attempts (handoff_id, started_at);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gpp_opportunity_handoff_attempts') THEN
    ALTER TABLE gpp_opportunity_handoff_attempts DROP CONSTRAINT IF EXISTS gpp_opportunity_handoff_attempts_handoff_id_fkey;
    ALTER TABLE gpp_opportunity_handoff_attempts
      ADD CONSTRAINT gpp_opportunity_handoff_attempts_handoff_id_fkey
      FOREIGN KEY (handoff_id) REFERENCES gpp_opportunity_handoffs(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_opportunity_handoffs' AND column_name = 'authorized_at' AND data_type = 'timestamp without time zone') THEN
    ALTER TABLE gpp_opportunity_handoffs ALTER COLUMN authorized_at TYPE timestamptz USING authorized_at AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_opportunity_handoffs' AND column_name = 'delivered_at' AND data_type = 'timestamp without time zone') THEN
    ALTER TABLE gpp_opportunity_handoffs ALTER COLUMN delivered_at TYPE timestamptz USING delivered_at AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_opportunity_handoffs' AND column_name = 'created_at' AND data_type = 'timestamp without time zone') THEN
    ALTER TABLE gpp_opportunity_handoffs ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_pursuit_feedback' AND column_name = 'source_timestamp' AND data_type = 'timestamp without time zone') THEN
    ALTER TABLE gpp_pursuit_feedback ALTER COLUMN source_timestamp TYPE timestamptz USING source_timestamp AT TIME ZONE 'UTC';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_pursuit_feedback' AND column_name = 'decision_at' AND data_type = 'timestamp without time zone') THEN
    ALTER TABLE gpp_pursuit_feedback ALTER COLUMN decision_at TYPE timestamptz USING decision_at AT TIME ZONE 'UTC';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_opportunity_handoffs_delivery_state_check') THEN
    ALTER TABLE gpp_opportunity_handoffs ADD CONSTRAINT gpp_opportunity_handoffs_delivery_state_check
      CHECK (delivery_state IN ('previewed','delivered','rejected','unavailable','delivery_unknown')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_opportunity_handoff_attempts_outcome_check') THEN
    ALTER TABLE gpp_opportunity_handoff_attempts ADD CONSTRAINT gpp_opportunity_handoff_attempts_outcome_check
      CHECK (outcome IN ('delivered','rejected','unavailable','delivery_unknown')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_amount_disclosure_check') THEN
    ALTER TABLE gpp_pursuit_feedback
      ADD CONSTRAINT gpp_pursuit_feedback_amount_disclosure_check
      CHECK (award_amount IS NULL OR (amount_disclosure = 'shared' AND award_amount >= 0)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_status_check') THEN
    ALTER TABLE gpp_pursuit_feedback
      ADD CONSTRAINT gpp_pursuit_feedback_status_check
      CHECK (status IN ('selected','preparing','submitted','clarification','declined','withdrawn','awarded','partially_awarded','cancelled','expired','not_pursued')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_amount_nonnegative_check') THEN
    ALTER TABLE gpp_pursuit_feedback
      ADD CONSTRAINT gpp_pursuit_feedback_amount_nonnegative_check
      CHECK (award_amount IS NULL OR award_amount >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_source_https_check') THEN
    ALTER TABLE gpp_pursuit_feedback
      ADD CONSTRAINT gpp_pursuit_feedback_source_https_check
      CHECK (source_url IS NULL OR source_url LIKE 'https://%') NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS gpp_opportunity_handoffs_one_unknown_per_org_idx
  ON gpp_opportunity_handoffs (org_id) WHERE delivery_state = 'delivery_unknown';