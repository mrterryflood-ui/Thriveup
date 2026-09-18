ALTER TABLE grant_reminders
  DROP COLUMN IF EXISTS date_type;

DROP INDEX IF EXISTS idx_grant_reminders_user_due;