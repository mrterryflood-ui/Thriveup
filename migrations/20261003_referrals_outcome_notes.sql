-- Keep the referral outcome-notes column present on every deployment.
-- Idempotent for databases that already received the standalone repair.
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS outcome_notes TEXT;