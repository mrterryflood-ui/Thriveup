# Orphan-Table Disposition Log — August 8, 2026 (WP-1C)

Audit method: full-repo search for readers/writers of each table (variable name + snake_case), row counts on live DB. "Orphan" = declared in schema with zero server/client reads or writes.

## DROPPED (11) — empty and zero code consumers
| Table | Rows | Rationale |
|---|---|---|
| course_lesson_progress | 0 | Course engine never wired lesson-level progress; enrollment-level progress is what code uses. |
| coalition_action_items | 0 | DFC coalition feature stub; no UI or routes ever built. |
| coalition_capacity_assessments | 0 | Same DFC stub family. |
| community_action_plans | 0 | Same DFC stub family. |
| cost_match_records | 0 | Grant cost-match tracking never implemented. |
| dfc_stakeholder_surveys | 0 | DFC survey stub. |
| community_readiness_interviews | 0 | Readiness interviews stub (assessments table IS used and kept). |
| campaign_content | 0 | Media campaign child tables never wired (parent media_campaigns kept — it has consumers). |
| campaign_metrics | 0 | Same. |
| dfc_wizard_state | 0 | Wizard state never persisted server-side. |
| benefits_enrollment_log | 0 | Enrollment logging never wired; benefits_enrollment_data is the live table. |

Recovery: any of these can be re-declared from git history if the feature is built later.

## KEPT ON HOLD (3)
| Table | Rows | Rationale |
|---|---|---|
| dfc_readiness_items | 19 | Holds seeded data; wire-or-drop decision deferred to Phase 4 DFC content review. |
| platform_funder_fit | 66 | Holds seeded funder-fit analysis referenced in documentation; Phase 4 claims-reconciliation decides. |
| trade_sims_credential_pathways | 0 | Required by the in-flight employer-credential work — must NOT be dropped. |
