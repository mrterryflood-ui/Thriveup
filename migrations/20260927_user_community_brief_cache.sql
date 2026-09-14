-- User Community Brief Cache
-- One row per authenticated user; upserted whenever a community brief
-- (/query or /stream) completes. Navigator personal-context reads this table
-- to ground answers in the geographic intelligence the user last reviewed.
-- Only aggregate geographic indicators are stored — no PII.
CREATE TABLE IF NOT EXISTS user_community_brief_cache (
  id            serial          PRIMARY KEY,
  user_id       varchar(255)    NOT NULL UNIQUE,
  locations     jsonb           NOT NULL DEFAULT '[]',
  topic         varchar(500),
  brief_summary text,
  generated_at  timestamptz     NOT NULL DEFAULT now(),
  updated_at    timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_community_brief_cache_user_idx
  ON user_community_brief_cache (user_id);

CREATE INDEX IF NOT EXISTS user_community_brief_cache_generated_idx
  ON user_community_brief_cache (generated_at);
