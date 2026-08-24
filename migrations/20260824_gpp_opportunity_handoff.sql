-- Durable, organization-private Community Opportunity Mirror lifecycle.
-- The delivery state is updated only to record a receiver acknowledgement;
-- feedback is append-only and idempotent by partner-event fingerprint.

CREATE TABLE IF NOT EXISTS gpp_opportunity_handoffs (
  id text PRIMARY KEY,
  org_id varchar(100) NOT NULL,
  contract_version varchar(16) NOT NULL DEFAULT 'v1',
  authorized_by_user_id varchar(255) NOT NULL,
  authorized_at timestamp NOT NULL,
  delivery_state varchar(32) NOT NULL,
  delivered_at timestamp,
  external_pursuit_id varchar(200),
  delivery_detail text,
  opportunity_package jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gpp_opportunity_handoffs_org_created_idx
  ON gpp_opportunity_handoffs (org_id, created_at);
CREATE INDEX IF NOT EXISTS gpp_opportunity_handoffs_external_pursuit_idx
  ON gpp_opportunity_handoffs (external_pursuit_id);

CREATE TABLE IF NOT EXISTS gpp_pursuit_feedback (
  id text PRIMARY KEY,
  handoff_id text NOT NULL REFERENCES gpp_opportunity_handoffs(id),
  org_id varchar(100) NOT NULL,
  event_fingerprint varchar(64) NOT NULL,
  contract_version varchar(16) NOT NULL DEFAULT 'v1',
  external_pursuit_id varchar(200),
  status varchar(32) NOT NULL,
  source_timestamp timestamp NOT NULL,
  decision_at timestamp,
  award_amount integer,
  amount_disclosure varchar(32) NOT NULL DEFAULT 'not_shared',
  funder_feedback text,
  lesson text,
  source_label varchar(500) NOT NULL,
  source_url varchar(2000),
  received_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE gpp_pursuit_feedback
  ADD COLUMN IF NOT EXISTS event_fingerprint varchar(64);
UPDATE gpp_pursuit_feedback
  SET event_fingerprint = id
  WHERE event_fingerprint IS NULL;
ALTER TABLE gpp_pursuit_feedback
  ALTER COLUMN event_fingerprint SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS gpp_pursuit_feedback_fingerprint_unique
  ON gpp_pursuit_feedback (event_fingerprint);
CREATE INDEX IF NOT EXISTS gpp_pursuit_feedback_org_received_idx
  ON gpp_pursuit_feedback (org_id, received_at);
CREATE INDEX IF NOT EXISTS gpp_pursuit_feedback_handoff_received_idx
  ON gpp_pursuit_feedback (handoff_id, received_at);