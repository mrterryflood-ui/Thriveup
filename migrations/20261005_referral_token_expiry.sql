ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS status_token_expires_at timestamp,
  ADD COLUMN IF NOT EXISTS org_confirm_token_expires_at timestamp;

UPDATE referrals
SET
  status_token_expires_at = COALESCE(status_token_expires_at, COALESCE(created_at, now()) + interval '30 days'),
  org_confirm_token_expires_at = COALESCE(org_confirm_token_expires_at, COALESCE(created_at, now()) + interval '30 days');

ALTER TABLE referrals
  ALTER COLUMN status_token_expires_at SET NOT NULL,
  ALTER COLUMN org_confirm_token_expires_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS referrals_status_token_unique
  ON referrals (status_token) WHERE status_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS referrals_org_confirm_token_unique
  ON referrals (org_confirm_token) WHERE org_confirm_token IS NOT NULL;