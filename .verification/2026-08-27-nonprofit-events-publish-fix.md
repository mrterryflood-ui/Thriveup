# Verification — 2026-08-27 — Nonprofit event publish migration repair

## Scope

Repair the publish-time PostgreSQL failure where composite child foreign keys
referenced `(nonprofit_events.id, nonprofit_events.org_id)` without a matching
parent-side unique constraint, while preserving production data.

## Evidence

- The generated development-to-production schema diff emits
  `CONSTRAINT "nonprofit_events_id_org_unique" UNIQUE("id","org_id")` inside
  `CREATE TABLE "nonprofit_events"`.
- The generated diff emits all four composite event foreign keys after the
  parent constraint:
  `fk_nonprofit_event_needs_event_org`,
  `fk_nonprofit_event_actions_event_org`,
  `fk_nonprofit_event_stories_event_org`, and
  `fk_nonprofit_event_audit_event_org`.
- The regression verifier requires exactly those four parent-referencing
  foreign keys, on their intended child tables, with `(event_id, org_id)` and
  `ON DELETE CASCADE`; legacy scalar event foreign keys are rejected.
- `explainSchemaDiff()` reports `structuralDataLoss: false`.
- The new forward migration was applied at application startup and is tracked
  in `schema_migrations`.
- The nonprofit event regression passed, including tenant isolation, consent,
  suppression, audit immutability, and archived-event behavior.
- TypeScript completed with zero errors.
- Preflight passed 9/9 and memory health passed.
- The application restarted and served on port 5000.

## Outcome and boundary

The composite-key migration failure is repaired for both fresh and previously
migrated environments. No production database or production data was modified.
The user must initiate the normal Publish flow; the destructive
development-to-production overwrite option is not required for this fix.