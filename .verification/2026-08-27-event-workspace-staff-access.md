# Verification Record — Organization Event-Workspace Staff Access

**Scope:** Let organization owners grant and revoke the narrow
organization-scoped staff assignment for the private Community Events &
Impact workspace without widening access for ordinary members or
collaborators.

## Claim and implementation boundary

- Private event data requires both a persisted platform-staff role and an
  approved active organization membership role.
- Owners may administer staff assignment without themselves qualifying for
  private event-data access.
- Grant accepts only a target user ID and can change only an eligible
  same-organization `member` to `staff`; revoke is only the exact inverse.
- Each successful change is recorded in a dedicated content-free audit row.
  The owner-facing response exposes only action and timestamp—never raw audit
  IDs, roles, subject/actor IDs, event, contact, story, or free-text fields.

## Development evidence

| Check | Result |
|---|---|
| Schema migration at application restart | Applied `20260904_organization_event_workspace_access.sql` |
| Strict TypeScript | Passed with zero errors |
| Diff whitespace check | Passed |
| Formal preflight | Passed all nine checks |
| Memory health | Passed all eight checks |
| Focused live authorization verifier | Passed all grant, revoke, duplicate/no-op, broad-role member, collaborator, cross-org, strict-input, privacy, and audit-immutability assertions |
| Complete authentication gate | Passed: 32 browser tests and all chained verification checks, exiting 0 on the final frozen source |
| Independent architecture review | PASS — no Task 340 security or architectural blocker |
| Six-domain adversarial re-audit | PASS/CLEAN for Task 340 scope |
| Local application preview | Rendered successfully at port 5000; anonymous sign-in boundary saved at `screenshots/task-340-final-events-route.jpg` |
| Authenticated owner-panel browser journey | Not completed: the dedicated Replit Auth test job returned no verdict, screenshots, browser logs, or product failure after two 600-second waits and was cancelled; workflow stayed healthy |

## Independent proof and residuals

The focused verifier uses disposable organizations and forged development
sessions to exercise the real server and database. It proves that a
platform-role `member` is denied, gains event access only after an owner’s
grant, loses it after revocation, and cannot be substituted with a
collaborator or foreign-organization target. It also proves failed/no-op
writes emit no audit record and direct audit update/delete/truncate fail.

The final dedicated Replit Auth browser test did not return a usable result
after two 600-second waits and was cancelled. The development workflow
remained healthy and was restarted to clear its temporary issuer override.
This prevents an authenticated interactive-browser claim only; it is not a
product failure or a production claim. Separate pre-existing Community Events
concurrency, existing-event audit, and cross-account selection findings are
recorded in `.agents/residuals.md`.