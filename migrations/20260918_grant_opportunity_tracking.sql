ALTER TABLE grant_opportunities
  ADD COLUMN IF NOT EXISTS discovery_url varchar(1000),
  ADD COLUMN IF NOT EXISTS verification_status varchar(32) NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS deadline_type varchar(32) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS known_requirements text,
  ADD COLUMN IF NOT EXISTS unknowns text;
