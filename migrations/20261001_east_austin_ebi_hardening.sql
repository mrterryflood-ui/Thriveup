ALTER TABLE east_austin_ebi_evaluation_contracts
  DROP CONSTRAINT IF EXISTS east_austin_ebi_evaluation_noncausal_check;
ALTER TABLE east_austin_ebi_evaluation_contracts
  ADD CONSTRAINT east_austin_ebi_evaluation_noncausal_check
  CHECK (causal_claim_allowed = false);

CREATE OR REPLACE FUNCTION block_east_austin_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'east_austin_readiness_audit_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS east_austin_audit_no_update_delete
  ON east_austin_readiness_audit_events;
CREATE TRIGGER east_austin_audit_no_update_delete
BEFORE UPDATE OR DELETE ON east_austin_readiness_audit_events
FOR EACH ROW EXECUTE FUNCTION block_east_austin_audit_mutation();

DROP TRIGGER IF EXISTS east_austin_audit_no_truncate
  ON east_austin_readiness_audit_events;
CREATE TRIGGER east_austin_audit_no_truncate
BEFORE TRUNCATE ON east_austin_readiness_audit_events
FOR EACH STATEMENT EXECUTE FUNCTION block_east_austin_audit_mutation();