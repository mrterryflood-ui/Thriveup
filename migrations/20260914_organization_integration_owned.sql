ALTER TABLE organizations
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_integration_owned boolean NOT NULL DEFAULT false;