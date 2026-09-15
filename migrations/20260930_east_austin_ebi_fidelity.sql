CREATE TABLE IF NOT EXISTS east_austin_readiness_packets (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_key varchar(64) NOT NULL UNIQUE,
  title varchar(160) NOT NULL,
  planning_state varchar(32) NOT NULL DEFAULT 'approval_readiness',
  boundary_status varchar(32) NOT NULL DEFAULT 'provisional',
  boundary_label text NOT NULL,
  boundary_source text NOT NULL DEFAULT 'Not yet recorded',
  boundary_method text NOT NULL DEFAULT 'Not yet recorded',
  boundary_recorded_at timestamp,
  baseline_method text NOT NULL DEFAULT 'Not yet recorded',
  data_vintage varchar(120) NOT NULL DEFAULT 'Not yet recorded',
  stakeholder_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  stakeholder_settings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS east_austin_readiness_gates (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id varchar(100) NOT NULL,
  gate_key varchar(80) NOT NULL,
  label varchar(180) NOT NULL,
  required_decision text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'blocked',
  classification varchar(48) NOT NULL DEFAULT 'planning_only',
  named_approver varchar(180),
  decision_record text,
  reviewed_at timestamp,
  revalidate_at timestamp,
  notes text,
  updated_by_user_id varchar(255),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(packet_id, gate_key)
);

CREATE INDEX IF NOT EXISTS east_austin_readiness_gate_packet_idx
  ON east_austin_readiness_gates(packet_id, status);

CREATE TABLE IF NOT EXISTS east_austin_readiness_sources (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id varchar(100) NOT NULL,
  source_title varchar(240) NOT NULL,
  source_type varchar(40) NOT NULL,
  geography varchar(180) NOT NULL,
  vintage varchar(120) NOT NULL,
  permitted_use text NOT NULL,
  applicability varchar(40) NOT NULL,
  limitations text NOT NULL,
  source_reference text NOT NULL,
  source_url text,
  corrects_source_id varchar(100),
  created_by_user_id varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS east_austin_readiness_source_packet_idx
  ON east_austin_readiness_sources(packet_id, created_at);

CREATE TABLE IF NOT EXISTS east_austin_readiness_tabletops (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id varchar(100) NOT NULL,
  title varchar(180) NOT NULL,
  scenario text NOT NULL,
  stakeholder_setting varchar(40) NOT NULL,
  learning_question text NOT NULL,
  decision_owner_category varchar(120) NOT NULL,
  action_learning_cadence varchar(160) NOT NULL,
  is_simulated boolean NOT NULL DEFAULT true,
  created_by_user_id varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS east_austin_readiness_tabletop_packet_idx
  ON east_austin_readiness_tabletops(packet_id, created_at);

CREATE TABLE IF NOT EXISTS east_austin_readiness_audit_events (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id varchar(100) NOT NULL,
  event_type varchar(120) NOT NULL,
  actor_user_id varchar(255),
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS east_austin_readiness_audit_packet_idx
  ON east_austin_readiness_audit_events(packet_id, created_at);

CREATE TABLE IF NOT EXISTS east_austin_ebi_protocols (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id varchar(100) NOT NULL UNIQUE,
  intervention_name varchar(240) NOT NULL,
  intervention_version varchar(80) NOT NULL,
  evidence_basis text NOT NULL,
  target_population text NOT NULL,
  setting text NOT NULL,
  delivery_mode text NOT NULL,
  dosage text NOT NULL,
  staffing_requirements text NOT NULL,
  training_requirements text NOT NULL,
  supervision_requirements text NOT NULL,
  contraindications text NOT NULL,
  theory_of_change text NOT NULL,
  core_components jsonb NOT NULL DEFAULT '[]'::jsonb,
  adaptable_components jsonb NOT NULL DEFAULT '[]'::jsonb,
  prohibited_changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  fidelity_instrument text NOT NULL,
  fidelity_scoring_method text NOT NULL,
  fidelity_threshold integer NOT NULL CHECK (fidelity_threshold BETWEEN 1 AND 100),
  observation_cadence varchar(180) NOT NULL,
  below_threshold_action text NOT NULL,
  protocol_status varchar(32) NOT NULL DEFAULT 'draft'
    CHECK (protocol_status IN ('draft', 'ready_for_review', 'superseded')),
  updated_by_user_id varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS east_austin_ebi_protocol_status_idx
  ON east_austin_ebi_protocols(protocol_status, updated_at);

CREATE TABLE IF NOT EXISTS east_austin_ebi_adaptations (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id varchar(100) NOT NULL,
  protocol_id varchar(100) NOT NULL,
  adaptation_title varchar(240) NOT NULL,
  proposed_change text NOT NULL,
  rationale text NOT NULL,
  local_input text NOT NULL,
  component_classification varchar(32) NOT NULL
    CHECK (component_classification IN ('core', 'adaptable', 'prohibited')),
  expected_fidelity_effect text NOT NULL,
  expected_equity_effect text NOT NULL,
  decision_status varchar(32) NOT NULL DEFAULT 'proposed'
    CHECK (decision_status IN ('proposed', 'approved', 'rejected', 'withdrawn')),
  decision_reason text,
  decided_by_user_id varchar(255),
  decided_at timestamp,
  review_at timestamp,
  created_by_user_id varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS east_austin_ebi_adaptation_packet_idx
  ON east_austin_ebi_adaptations(packet_id, created_at);
CREATE INDEX IF NOT EXISTS east_austin_ebi_adaptation_protocol_idx
  ON east_austin_ebi_adaptations(protocol_id, created_at);

CREATE TABLE IF NOT EXISTS east_austin_ebi_evaluation_contracts (
  id varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id varchar(100) NOT NULL UNIQUE,
  evaluation_version varchar(80) NOT NULL,
  design_type varchar(120) NOT NULL,
  causal_claim_allowed boolean NOT NULL DEFAULT false CHECK (causal_claim_allowed = false),
  non_causal_statement text NOT NULL,
  primary_outcome text NOT NULL,
  process_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  fidelity_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  equity_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  harm_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  baseline_period varchar(180) NOT NULL,
  followup_windows jsonb NOT NULL DEFAULT '[]'::jsonb,
  denominator_definition text NOT NULL,
  comparator_description text NOT NULL,
  measurement_instruments jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_dictionary_reference text NOT NULL,
  missing_data_rules text NOT NULL,
  attrition_rules text NOT NULL,
  suppression_rules text NOT NULL,
  subgroup_dimensions jsonb NOT NULL DEFAULT '[]'::jsonb,
  continue_rule text NOT NULL,
  adapt_rule text NOT NULL,
  pause_rule text NOT NULL,
  stop_rule text NOT NULL,
  updated_by_user_id varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS east_austin_ebi_evaluation_updated_idx
  ON east_austin_ebi_evaluation_contracts(updated_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'east_austin_ebi_protocol_packet_fk'
  ) THEN
    ALTER TABLE east_austin_ebi_protocols
      ADD CONSTRAINT east_austin_ebi_protocol_packet_fk
      FOREIGN KEY (packet_id) REFERENCES east_austin_readiness_packets(id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'east_austin_ebi_adaptation_packet_fk'
  ) THEN
    ALTER TABLE east_austin_ebi_adaptations
      ADD CONSTRAINT east_austin_ebi_adaptation_packet_fk
      FOREIGN KEY (packet_id) REFERENCES east_austin_readiness_packets(id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'east_austin_ebi_adaptation_protocol_fk'
  ) THEN
    ALTER TABLE east_austin_ebi_adaptations
      ADD CONSTRAINT east_austin_ebi_adaptation_protocol_fk
      FOREIGN KEY (protocol_id) REFERENCES east_austin_ebi_protocols(id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'east_austin_ebi_evaluation_packet_fk'
  ) THEN
    ALTER TABLE east_austin_ebi_evaluation_contracts
      ADD CONSTRAINT east_austin_ebi_evaluation_packet_fk
      FOREIGN KEY (packet_id) REFERENCES east_austin_readiness_packets(id)
      ON DELETE RESTRICT;
  END IF;
END $$;