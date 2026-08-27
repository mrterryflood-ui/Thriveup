-- Private, organization-scoped community event planning and impact records.
-- Attendance is aggregate-only; no attendee identity/contact fields exist.

CREATE TABLE IF NOT EXISTS nonprofit_events (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title varchar(240) NOT NULL,
  purpose text NOT NULL,
  event_date date NOT NULL,
  start_time varchar(10),
  end_time varchar(10),
  format varchar(24) NOT NULL DEFAULT 'in_person' CHECK (format IN ('in_person','virtual','hybrid')),
  location_name varchar(240),
  location_details varchar(500),
  service_area varchar(240) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','scheduled','completed','archived')),
  community_need_focus text[] NOT NULL DEFAULT '{}',
  created_by_user_id varchar(255) NOT NULL,
  updated_by_user_id varchar(255) NOT NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_events_org_date ON nonprofit_events(org_id, event_date);
CREATE INDEX IF NOT EXISTS idx_nonprofit_events_org_status ON nonprofit_events(org_id, status);

CREATE TABLE IF NOT EXISTS nonprofit_event_attendance (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(100) NOT NULL UNIQUE REFERENCES nonprofit_events(id) ON DELETE CASCADE,
  invited_count integer CHECK (invited_count IS NULL OR invited_count >= 0),
  registered_count integer CHECK (registered_count IS NULL OR registered_count >= 0),
  attended_count integer CHECK (attended_count IS NULL OR attended_count >= 0),
  follow_up_count integer CHECK (follow_up_count IS NULL OR follow_up_count >= 0),
  value_source varchar(32) NOT NULL DEFAULT 'self_reported' CHECK (value_source IN ('self_reported','observed','partner_reported','unknown')),
  source_note text,
  recorded_by_user_id varchar(255) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (invited_count IS NULL OR registered_count IS NULL OR registered_count <= invited_count),
  CHECK (registered_count IS NULL OR attended_count IS NULL OR attended_count <= registered_count),
  CHECK (attended_count IS NULL OR follow_up_count IS NULL OR follow_up_count <= attended_count)
);

CREATE TABLE IF NOT EXISTS nonprofit_event_needs (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(100) NOT NULL REFERENCES nonprofit_events(id) ON DELETE CASCADE,
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  need_area varchar(160) NOT NULL,
  source_name varchar(240) NOT NULL,
  source_url varchar(1000),
  geography varchar(240) NOT NULL,
  evidence_status varchar(32) NOT NULL DEFAULT 'self_reported'
    CHECK (evidence_status IN ('observed','derived','self_reported','partner_report','needs_review')),
  response_explanation text NOT NULL,
  created_by_user_id varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_needs_org_area ON nonprofit_event_needs(org_id, need_area);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_needs_event ON nonprofit_event_needs(event_id);

CREATE TABLE IF NOT EXISTS nonprofit_event_actions (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(100) NOT NULL REFERENCES nonprofit_events(id) ON DELETE CASCADE,
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title varchar(240) NOT NULL,
  owner_label varchar(160) NOT NULL,
  due_date date,
  status varchar(24) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','blocked','completed')),
  completion_evidence text,
  next_step text,
  completed_at timestamptz,
  created_by_user_id varchar(255) NOT NULL,
  updated_by_user_id varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_actions_org_status ON nonprofit_event_actions(org_id, status);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_actions_event ON nonprofit_event_actions(event_id);

CREATE TABLE IF NOT EXISTS nonprofit_event_stories (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(100) NOT NULL REFERENCES nonprofit_events(id) ON DELETE CASCADE,
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title varchar(240) NOT NULL,
  story_text text NOT NULL,
  attribution_preference varchar(32) NOT NULL DEFAULT 'anonymous'
    CHECK (attribution_preference IN ('anonymous','first_name','organization','named')),
  intended_audience varchar(32) NOT NULL DEFAULT 'private'
    CHECK (intended_audience IN ('private','internal_team','partner','funder','public')),
  permitted_uses text[] NOT NULL DEFAULT '{}',
  consent_granted boolean NOT NULL DEFAULT false,
  sharing_state varchar(24) NOT NULL DEFAULT 'draft' CHECK (sharing_state IN ('draft','approved','withdrawn')),
  consented_at timestamptz,
  approved_at timestamptz,
  approved_by_user_id varchar(255),
  withdrawn_at timestamptz,
  created_by_user_id varchar(255) NOT NULL,
  updated_by_user_id varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    sharing_state <> 'approved'
    OR (consent_granted = true AND intended_audience <> 'private' AND cardinality(permitted_uses) > 0)
  )
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_stories_org_state ON nonprofit_event_stories(org_id, sharing_state);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_stories_event ON nonprofit_event_stories(event_id);

CREATE TABLE IF NOT EXISTS nonprofit_event_audit_log (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id varchar(100) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id varchar(100) REFERENCES nonprofit_events(id) ON DELETE CASCADE,
  entity_type varchar(40) NOT NULL,
  entity_id varchar(100) NOT NULL,
  action varchar(80) NOT NULL,
  actor_user_id varchar(255) NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_audit_org_created ON nonprofit_event_audit_log(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_nonprofit_event_audit_event_created ON nonprofit_event_audit_log(event_id, created_at);