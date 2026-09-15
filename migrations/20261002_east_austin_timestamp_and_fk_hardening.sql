ALTER TABLE east_austin_readiness_packets ALTER COLUMN updated_at TYPE timestamp(3);
ALTER TABLE east_austin_readiness_gates ALTER COLUMN updated_at TYPE timestamp(3);
ALTER TABLE east_austin_ebi_protocols ALTER COLUMN updated_at TYPE timestamp(3);
ALTER TABLE east_austin_ebi_evaluation_contracts ALTER COLUMN updated_at TYPE timestamp(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'east_austin_gate_packet_fk') THEN
    ALTER TABLE east_austin_readiness_gates ADD CONSTRAINT east_austin_gate_packet_fk
      FOREIGN KEY (packet_id) REFERENCES east_austin_readiness_packets(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'east_austin_source_packet_fk') THEN
    ALTER TABLE east_austin_readiness_sources ADD CONSTRAINT east_austin_source_packet_fk
      FOREIGN KEY (packet_id) REFERENCES east_austin_readiness_packets(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'east_austin_source_correction_fk') THEN
    ALTER TABLE east_austin_readiness_sources ADD CONSTRAINT east_austin_source_correction_fk
      FOREIGN KEY (corrects_source_id) REFERENCES east_austin_readiness_sources(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'east_austin_tabletop_packet_fk') THEN
    ALTER TABLE east_austin_readiness_tabletops ADD CONSTRAINT east_austin_tabletop_packet_fk
      FOREIGN KEY (packet_id) REFERENCES east_austin_readiness_packets(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'east_austin_audit_packet_fk') THEN
    ALTER TABLE east_austin_readiness_audit_events ADD CONSTRAINT east_austin_audit_packet_fk
      FOREIGN KEY (packet_id) REFERENCES east_austin_readiness_packets(id) ON DELETE RESTRICT;
  END IF;
END $$;