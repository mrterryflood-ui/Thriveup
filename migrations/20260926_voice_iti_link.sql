-- Link Community Voice pins to an ITI invitation so aggregate insight
-- generation can enforce the invitee's explicit consent.
ALTER TABLE community_voice_pins
  ADD COLUMN IF NOT EXISTS iti_invitation_id varchar(100);

CREATE INDEX IF NOT EXISTS idx_voice_pins_iti
  ON community_voice_pins (iti_invitation_id);

ALTER TABLE community_voice_insights
  ADD COLUMN IF NOT EXISTS source_pin_ids jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'community_voice_pins_iti_invitation_fk'
  ) THEN
    ALTER TABLE community_voice_pins
      ADD CONSTRAINT community_voice_pins_iti_invitation_fk
      FOREIGN KEY (iti_invitation_id)
      REFERENCES integration_invitations(id)
      ON DELETE RESTRICT;
  END IF;
END $$;