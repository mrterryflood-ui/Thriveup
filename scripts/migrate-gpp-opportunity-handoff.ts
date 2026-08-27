/**
 * Idempotent runtime migration for the private Community Opportunity Mirror
 * lifecycle tables. The post-merge runner executes scripts/migrate-*.ts.
 */
import { db } from "../server/storage";
import { sql } from "drizzle-orm";

const statements = [
  `CREATE TABLE IF NOT EXISTS gpp_opportunity_handoffs (
    id text PRIMARY KEY, org_id varchar(100) NOT NULL, request_hash varchar(64),
    contract_version varchar(16) NOT NULL DEFAULT 'v1',
    authorized_by_user_id varchar(255) NOT NULL, authorized_at timestamptz NOT NULL, delivery_state varchar(32) NOT NULL,
    delivered_at timestamptz, external_pursuit_id varchar(200), delivery_detail text, opportunity_package jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE gpp_opportunity_handoffs ADD COLUMN IF NOT EXISTS request_hash varchar(64)`,
  `DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_opportunity_handoffs' AND column_name = 'authorized_at' AND data_type = 'timestamp without time zone') THEN
      ALTER TABLE gpp_opportunity_handoffs ALTER COLUMN authorized_at TYPE timestamptz USING authorized_at AT TIME ZONE 'UTC';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_opportunity_handoffs' AND column_name = 'delivered_at' AND data_type = 'timestamp without time zone') THEN
      ALTER TABLE gpp_opportunity_handoffs ALTER COLUMN delivered_at TYPE timestamptz USING delivered_at AT TIME ZONE 'UTC';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_opportunity_handoffs' AND column_name = 'created_at' AND data_type = 'timestamp without time zone') THEN
      ALTER TABLE gpp_opportunity_handoffs ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
    END IF;
  END $$`,
  `CREATE INDEX IF NOT EXISTS gpp_opportunity_handoffs_org_created_idx ON gpp_opportunity_handoffs (org_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS gpp_opportunity_handoffs_external_pursuit_idx ON gpp_opportunity_handoffs (external_pursuit_id)`,
  `CREATE TABLE IF NOT EXISTS gpp_pursuit_feedback (
    id text PRIMARY KEY, handoff_id text NOT NULL REFERENCES gpp_opportunity_handoffs(id), org_id varchar(100) NOT NULL,
    event_fingerprint varchar(64) NOT NULL, contract_version varchar(16) NOT NULL DEFAULT 'v1', external_pursuit_id varchar(200),
    status varchar(32) NOT NULL, source_timestamp timestamptz NOT NULL, decision_at timestamptz, award_amount integer,
    amount_disclosure varchar(32) NOT NULL DEFAULT 'not_shared', funder_feedback text, lesson text,
    source_label varchar(500) NOT NULL, source_url varchar(2000), received_at timestamptz NOT NULL DEFAULT now()
  )`,
  `DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_pursuit_feedback' AND column_name = 'source_timestamp' AND data_type = 'timestamp without time zone') THEN
      ALTER TABLE gpp_pursuit_feedback ALTER COLUMN source_timestamp TYPE timestamptz USING source_timestamp AT TIME ZONE 'UTC';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gpp_pursuit_feedback' AND column_name = 'decision_at' AND data_type = 'timestamp without time zone') THEN
      ALTER TABLE gpp_pursuit_feedback ALTER COLUMN decision_at TYPE timestamptz USING decision_at AT TIME ZONE 'UTC';
    END IF;
  END $$`,
  `ALTER TABLE gpp_pursuit_feedback ADD COLUMN IF NOT EXISTS event_fingerprint varchar(64)`,
  `UPDATE gpp_pursuit_feedback SET event_fingerprint = id WHERE event_fingerprint IS NULL`,
  `ALTER TABLE gpp_pursuit_feedback ALTER COLUMN event_fingerprint SET NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS gpp_pursuit_feedback_fingerprint_unique ON gpp_pursuit_feedback (event_fingerprint)`,
  `CREATE INDEX IF NOT EXISTS gpp_pursuit_feedback_org_received_idx ON gpp_pursuit_feedback (org_id, received_at)`,
  `CREATE INDEX IF NOT EXISTS gpp_pursuit_feedback_handoff_received_idx ON gpp_pursuit_feedback (handoff_id, received_at)`,
  `CREATE TABLE IF NOT EXISTS gpp_opportunity_handoff_attempts (
    id text PRIMARY KEY, handoff_id text NOT NULL REFERENCES gpp_opportunity_handoffs(id) ON DELETE CASCADE,
    started_at timestamptz NOT NULL, finished_at timestamptz,
    outcome varchar(32) NOT NULL, http_status integer, accepted boolean,
    external_pursuit_id varchar(200), idempotency_key varchar(200) NOT NULL,
    error_class varchar(64), response_hash varchar(64)
  )`,
  `CREATE INDEX IF NOT EXISTS gpp_opportunity_handoff_attempts_handoff_started_idx ON gpp_opportunity_handoff_attempts (handoff_id, started_at)`,
  `DO $$ BEGIN
    ALTER TABLE gpp_opportunity_handoff_attempts DROP CONSTRAINT IF EXISTS gpp_opportunity_handoff_attempts_handoff_id_fkey;
    ALTER TABLE gpp_opportunity_handoff_attempts
      ADD CONSTRAINT gpp_opportunity_handoff_attempts_handoff_id_fkey
      FOREIGN KEY (handoff_id) REFERENCES gpp_opportunity_handoffs(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS gpp_opportunity_handoffs_one_unknown_per_org_idx
    ON gpp_opportunity_handoffs (org_id) WHERE delivery_state = 'delivery_unknown'`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_opportunity_handoffs_delivery_state_check') THEN
      ALTER TABLE gpp_opportunity_handoffs ADD CONSTRAINT gpp_opportunity_handoffs_delivery_state_check
      CHECK (delivery_state IN ('previewed','delivered','rejected','unavailable','delivery_unknown')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_opportunity_handoff_attempts_outcome_check') THEN
      ALTER TABLE gpp_opportunity_handoff_attempts ADD CONSTRAINT gpp_opportunity_handoff_attempts_outcome_check
      CHECK (outcome IN ('delivered','rejected','unavailable','delivery_unknown')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_status_check') THEN
      ALTER TABLE gpp_pursuit_feedback ADD CONSTRAINT gpp_pursuit_feedback_status_check
      CHECK (status IN ('selected','preparing','submitted','clarification','declined','withdrawn','awarded','partially_awarded','cancelled','expired','not_pursued')) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_amount_disclosure_check') THEN
      ALTER TABLE gpp_pursuit_feedback ADD CONSTRAINT gpp_pursuit_feedback_amount_disclosure_check
      CHECK (award_amount IS NULL OR (amount_disclosure = 'shared' AND award_amount >= 0)) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_amount_nonnegative_check') THEN
      ALTER TABLE gpp_pursuit_feedback ADD CONSTRAINT gpp_pursuit_feedback_amount_nonnegative_check
      CHECK (award_amount IS NULL OR award_amount >= 0) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gpp_pursuit_feedback_source_https_check') THEN
      ALTER TABLE gpp_pursuit_feedback ADD CONSTRAINT gpp_pursuit_feedback_source_https_check
      CHECK (source_url IS NULL OR source_url LIKE 'https://%') NOT VALID;
    END IF;
  END $$`,
];

for (const statement of statements) await db.execute(sql.raw(statement));
console.log("[migrate-gpp-opportunity-handoff] Community Opportunity Mirror tables are ready.");