-- Store the county key needed for floor-5-suppressed YHSI outcome aggregates.
ALTER TABLE yhsi_youth_participants
  ADD COLUMN IF NOT EXISTS county_fips VARCHAR(5);