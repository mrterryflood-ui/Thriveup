-- International community context is a broad, provenance-labeled place envelope.
-- It is not an address and does not replace legacy U.S. ZIP/county markers.
ALTER TABLE IF EXISTS user_journeys
  ADD COLUMN IF NOT EXISTS community_context JSONB;

ALTER TABLE IF EXISTS integration_invitations
  ADD COLUMN IF NOT EXISTS community_context JSONB;

ALTER TABLE IF EXISTS community_voice_projects
  ADD COLUMN IF NOT EXISTS community_context JSONB;