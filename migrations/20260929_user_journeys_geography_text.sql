-- Navigator can capture valid city/state labels longer than the original
-- VARCHAR(20) contract. Preserve the full bounded label so the journey-spine
-- needs merge cannot fail and drop both geography and identified needs.
ALTER TABLE user_journeys
  ALTER COLUMN last_known_geography TYPE TEXT;