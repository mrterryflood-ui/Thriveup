-- Adds an explicit is_demo_data provenance flag to seed-only tables that lack
-- any other source/estimate field, so illustrative/example rows can be
-- disclosed to viewers instead of presented as verified fact. See
-- server/seed-comprehensive.ts (DEMO_DATA_SOURCE) and
-- scripts/verify-seed-provenance.ts for the enforcement side.
--
-- All of these tables also have real user-facing insert routes (e.g.
-- server/facilitator-routes.ts, server/outcome-routes.ts), so the backfill
-- below intentionally targets only the specific hand-authored seed ids from
-- server/seed-comprehensive.ts and server/seed-outcomes.ts, not every
-- pre-existing row — a genuinely admin-entered row must not be relabeled demo.
ALTER TABLE environmental_strategies ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE dfc_core_measures ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE community_readiness_assessments ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE media_campaigns ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE stakeholder_commitments ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE curriculum_delivery_logs ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
-- outcome_tracking.source already exists but describes the (real or fictional)
-- event source (e.g. "employer_report", "court_records"); it cannot double as
-- a provenance flag, so a dedicated column is added instead.
ALTER TABLE outcome_tracking ADD COLUMN IF NOT EXISTS is_demo_data boolean NOT NULL DEFAULT false;
--> statement-breakpoint
-- Backfill: label the specific hand-authored seed ids from
-- server/seed-comprehensive.ts as demo. Ids are enumerated explicitly (not
-- "every row without a flag") so a real row created through the app's own
-- create/update routes before this migration is never relabeled.
UPDATE environmental_strategies SET is_demo_data = true WHERE id IN ('es-001', 'es-002', 'es-003');
--> statement-breakpoint
UPDATE dfc_core_measures SET is_demo_data = true WHERE id IN ('dcm-001', 'dcm-002');
--> statement-breakpoint
UPDATE community_readiness_assessments SET is_demo_data = true WHERE id IN ('cra-001');
--> statement-breakpoint
UPDATE media_campaigns SET is_demo_data = true WHERE id IN ('mc-001');
--> statement-breakpoint
UPDATE stakeholder_commitments SET is_demo_data = true WHERE id IN ('sc-001', 'sc-002', 'sc-003', 'sc-004', 'sc-005');
--> statement-breakpoint
UPDATE facilitator_profiles SET is_demo_data = true WHERE id IN ('fac-001', 'fac-002', 'fac-003');
--> statement-breakpoint
UPDATE session_plans SET is_demo_data = true WHERE id IN ('sp-f-001', 'sp-f-002', 'sp-f-003', 'sp-f-004');
--> statement-breakpoint
UPDATE curriculum_delivery_logs SET is_demo_data = true WHERE id IN ('cdl-001', 'cdl-002', 'cdl-003');
--> statement-breakpoint
-- outcome_tracking seed ids: ot-001..006 (server/seed-comprehensive.ts) and
-- oc-001..073 (server/seed-outcomes.ts, fictional reentry participant journeys).
-- Enumerated explicitly (not a regex over the id prefix) so no future row
-- that happens to share the "oc-<n>" naming convention is auto-relabeled.
UPDATE outcome_tracking SET is_demo_data = true WHERE id IN (
  'ot-001', 'ot-002', 'ot-003', 'ot-004', 'ot-005', 'ot-006',
  'oc-001','oc-002','oc-003','oc-004','oc-005','oc-006','oc-007','oc-008','oc-009','oc-010',
  'oc-011','oc-012','oc-013','oc-014','oc-015','oc-016','oc-017','oc-018','oc-019','oc-020',
  'oc-021','oc-022','oc-023','oc-024','oc-025','oc-026','oc-027','oc-028','oc-029','oc-030',
  'oc-031','oc-032','oc-033','oc-034','oc-035','oc-036','oc-037','oc-038','oc-039','oc-040',
  'oc-041','oc-042','oc-043','oc-044','oc-045','oc-046','oc-047','oc-048','oc-049','oc-050',
  'oc-051','oc-052','oc-053','oc-054','oc-055','oc-056','oc-057','oc-058','oc-059','oc-060',
  'oc-061','oc-062','oc-063','oc-064','oc-065','oc-066','oc-067','oc-068','oc-069','oc-070',
  'oc-071','oc-072','oc-073'
);
--> statement-breakpoint
-- benefits_enrollment_data already has a data_source column; backfill only
-- the known hand-authored demo-seed ids (bed-001..004, bed-chi-001..004,
-- from server/seed-comprehensive.ts) as demo. Deliberately no fallback rule
-- guesses a source for any other null-source row — the county/tract-level
-- Census ACS ingest (server/benefits-routes.ts) already sets data_source on
-- every row it writes, so a null-source row outside this id list is a sign
-- of a real gap to investigate by hand, not something safe to auto-label
-- "census_acs_2022".
UPDATE benefits_enrollment_data
SET data_source = 'Illustrative demo/scenario data for platform demonstration — not sourced from official administrative or survey systems'
WHERE id IN ('bed-001', 'bed-002', 'bed-003', 'bed-004', 'bed-chi-001', 'bed-chi-002', 'bed-chi-003', 'bed-chi-004')
  AND (data_source IS NULL OR data_source NOT ILIKE '%illustrative%');
