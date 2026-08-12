-- Add state column to gun_violence_incidents for national filtering
ALTER TABLE gun_violence_incidents
  ADD COLUMN IF NOT EXISTS state varchar(50);
