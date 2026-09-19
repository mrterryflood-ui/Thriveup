DELETE FROM onboarding_milestone_completions a
USING onboarding_milestone_completions b
WHERE a.journey_id = b.journey_id
  AND a.milestone_id = b.milestone_id
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_milestone_completions_journey_milestone_uq
  ON onboarding_milestone_completions (journey_id, milestone_id);