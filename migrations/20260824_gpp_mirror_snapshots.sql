CREATE TABLE IF NOT EXISTS gpp_mirror_snapshots (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL,
  source varchar(80) NOT NULL DEFAULT 'grantpathpro'
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS gpp_mirror_snapshots_org_received_idx
  ON gpp_mirror_snapshots (org_id, received_at DESC);