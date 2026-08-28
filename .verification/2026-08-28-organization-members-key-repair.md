# Verification — 2026-08-28 — Organization membership composite-key repair

## Scope

Repair the Publish-time foreign-key failure for
`nonprofit_event_workspace_access(org_id, user_id)` without replacing or
modifying production data.

## Root cause

`organization_members` enforced `(org_id, user_id)` through a standalone
unique index. PostgreSQL requires a real `PRIMARY KEY` or `UNIQUE` table
constraint for the referenced columns of a composite foreign key.

## Changed

- The schema declares a named `UNIQUE (org_id, user_id)` parent constraint.
- A forward migration upgrades the existing development index into that
  constraint when possible, preserving existing data and index storage.
- The legacy workspace-access migration establishes the parent prerequisite for
  newly initialized environments.
- The Community Events verifier now rejects a missing or malformed parent key.

## Proof

- Application startup applied
  `20260908_organization_members_composite_key_repair.sql`.
- Live PostgreSQL inspection reports
  `organization_members_org_user_unique UNIQUE (org_id, user_id)`.
- The existing workspace-access foreign key remains valid and references that
  pair.
- The exact previously failing `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`
  statement was dropped, added, and rolled back successfully in a single
  development transaction.
- The Community Events verifier, zero-error TypeScript check, diff check,
  preflight, and memory-health checks passed.

## Boundary

No production database or production data was changed. Retry the normal Publish
flow; do not select any development-to-production overwrite option.