-- Add navigator context columns to referrals.
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe to replay.
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS navigator_conversation_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS navigator_context JSONB;
