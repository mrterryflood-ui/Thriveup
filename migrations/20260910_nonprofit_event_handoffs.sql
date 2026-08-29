-- Durable, reviewable bridge from public evidence contracts into the private
-- organization workspace. It stores no attendee identity or story content.
CREATE TABLE IF NOT EXISTS nonprofit_event_handoffs (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_kind varchar(32) NOT NULL CHECK (source_kind IN ('community_brief','time_place_need')),
  source_version varchar(64) NOT NULL,
  issue text NOT NULL,
  geography varchar(240) NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  freshness_at timestamptz NOT NULL,
  claim_types text[] NOT NULL DEFAULT '{}',
  resource_verification varchar(40) NOT NULL CHECK (resource_verification IN ('verified','source-listed-unverified','unknown')),
  consent_boundary text NOT NULL,
  unresolved_gaps text[] NOT NULL DEFAULT '{}',
  source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(24) NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','accepted','declined')),
  event_id varchar(100),
  need_id varchar(100),
  action_id varchar(100),
  reviewed_by_user_id varchar(255),
  reviewed_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_user_id varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, org_id)
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_handoffs_org_status
  ON nonprofit_event_handoffs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_handoffs_event
  ON nonprofit_event_handoffs(event_id);

ALTER TABLE nonprofit_event_actions
  ADD COLUMN IF NOT EXISTS handoff_id varchar(100);
ALTER TABLE nonprofit_event_actions
  ADD COLUMN IF NOT EXISTS follow_up_observation text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'nonprofit_event_actions'::regclass
      AND conname = 'fk_nonprofit_event_actions_handoff_org'
  ) THEN
    ALTER TABLE nonprofit_event_actions
      ADD CONSTRAINT fk_nonprofit_event_actions_handoff_org
      FOREIGN KEY (handoff_id, org_id)
      REFERENCES nonprofit_event_handoffs(id, org_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_actions_handoff
  ON nonprofit_event_actions(handoff_id);

CREATE OR REPLACE FUNCTION enforce_nonprofit_event_handoff_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Reviewed nonprofit event handoffs are immutable';
  END IF;
  IF NEW.status = 'accepted' AND (NEW.event_id IS NULL OR NEW.need_id IS NULL OR NEW.action_id IS NULL) THEN
    RAISE EXCEPTION 'Accepted nonprofit event handoffs require event, need, and action links';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_nonprofit_event_handoff_transition ON nonprofit_event_handoffs;
CREATE TRIGGER trg_nonprofit_event_handoff_transition
  BEFORE UPDATE ON nonprofit_event_handoffs
  FOR EACH ROW EXECUTE FUNCTION enforce_nonprofit_event_handoff_transition();