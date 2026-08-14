CREATE TABLE IF NOT EXISTS ai_claim_chain (
  id serial PRIMARY KEY,
  surface varchar(100) NOT NULL,
  subject varchar(500) NOT NULL,
  rule_id varchar(100) NOT NULL,
  verdict varchar(30) NOT NULL,
  claim_text text NOT NULL,
  extracted_values_json text NOT NULL,
  expected_description varchar(500) NOT NULL,
  prev_hash varchar(64) NOT NULL,
  hash varchar(64) NOT NULL,
  created_at timestamptz DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ai_claim_chain_surface_idx ON ai_claim_chain (surface);
