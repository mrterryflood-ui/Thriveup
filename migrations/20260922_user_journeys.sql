-- Create user_journeys table for persistent navigator journey state.
-- Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS user_journeys (
  user_id               VARCHAR(255) PRIMARY KEY NOT NULL,
  last_known_geography  VARCHAR(20),
  identified_needs      JSONB,
  screener_flags        JSONB,
  active_referral_ids   JSONB,
  yhsi_status           VARCHAR(50),
  community_context_at  TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_journeys_updated_idx ON user_journeys (updated_at);
