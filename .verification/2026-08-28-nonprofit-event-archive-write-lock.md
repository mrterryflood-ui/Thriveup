# Verification Record — Archived Community-Event Write Integrity

**Scope:** Prevent a concurrent attendance, need, action, or story mutation
from altering a Community Events & Impact record after its parent event is
archived.

## Claim and implementation boundary

- The archive state is a parent-owned data invariant. Archive and child writes
  lock the same event row within their respective transactions before deciding
  whether to write.
- Child routes bind their writes to the authenticated active organization and
  recheck that the locked parent is not archived. Early accessibility checks
  remain for prompt user-facing 404/409 responses, but are not the concurrency
  control.
- Database triggers independently protect child insert, update, delete, and
  parent-reference changes. Direct `TRUNCATE` is rejected for every child table
  so it cannot bypass row-level protection.
- Existing event lifecycle, aggregate-only attendance, story-consent behavior,
  audit insertion/immutability, tenant foreign keys, and legal referential
  cleanup remain unchanged.

## Development evidence

| Check | Result |
|---|---|
| Normal application startup | Applied `20260908_nonprofit_event_archival_write_lock.sql` and `20260909_nonprofit_event_archival_truncate_guard.sql`; server served port 5000 |
| Strict TypeScript | Passed with zero errors using the configured 8 GB heap |
| Diff whitespace check | Passed |
| Focused live workspace verifier | Passed tenant, lifecycle, aggregate attendance, consent, report-suppression, audit, normal archive, trigger-installation, and direct-truncation assertions |
| Concurrent mutation proof | Passed with four independent child sessions—attendance, need, action, and story—whose PostgreSQL blocking chains were observed to reach the uncommitted archive session before its commit; all four writes then failed and every baseline value remained unchanged |
| Browser journey | A disposable authorized staff session rendered `/organization/events` locally and an archived event showed its read-only notice with save/archive controls absent |
| Complete authentication gate | Passed after the verifier’s expected-rejection handlers were attached at promise launch: all 32 browser tests and every chained server/database verifier, including the final Community Events race check, exited 0 |
| Rebase validation | A merge with current main preserved its transaction-scoped lifecycle checks plus this task’s archival triggers, organization-bound writes, and wait-graph test; workflow restart, focused verifier, TypeScript/integrated flow, repeated complete authentication gate, preflight, and memory health all passed on the merged source |
| Independent review | Six-domain adversarial re-audit and isolated architecture review were CLEAN for this scope |
| Memory-health gate | Passed all eight checks, including the current session record |
| Formal preflight | Passed all nine checks, including strict TypeScript and the Alpha Omega structural gate |

## Independent proof and residuals

The focused verifier creates disposable organizations and records, then uses
real server routes and separate PostgreSQL sessions. Its lock rendezvous reads
the database wait graph rather than relying on a delay, preventing a
scheduler-timing false pass. Once archival commits, it requires each child
write to return the database's archived-read-only error and queries the final
stored values directly.

The first all-project completion attempt exposed a test-runner issue rather
than a product-invariant failure: expected rejected child queries were left
without handlers until after archive commit, so Node terminated on an
unhandled rejection. Handlers now attach as each query starts. The focused
verifier and the complete authentication gate both passed on the corrected
source.

The development preview proxy returned HTTP 502 during the browser run while
the application rendered normally at local port 5000. This limits proxy-host
interaction proof only and is already tracked in `.agents/residuals.md`; it is
not a production observation. The pre-existing concurrent story-consent and
transactional staff-authorization residuals remain open there as separate
work, without being represented as resolved by this archive-specific change.