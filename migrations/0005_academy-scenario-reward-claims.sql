-- Cross-run scenario reward idempotency: each positive wallet award is claimed
-- at most once per (user, scenario, node), enforced with a unique constraint
-- and inserted in the same transaction as the wallet credit. Idempotent.
CREATE TABLE IF NOT EXISTS academy_scenario_reward_claims (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  scenario_id varchar(100) NOT NULL,
  node_key text NOT NULL,
  amount numeric(12,2) NOT NULL,
  created_at timestamp DEFAULT now(),
  CONSTRAINT academy_scenario_reward_claims_unique UNIQUE (user_id, scenario_id, node_key)
);
