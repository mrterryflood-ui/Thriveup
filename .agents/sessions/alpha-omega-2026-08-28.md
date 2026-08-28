# Alpha Omega — 2026-08-28 — Archived community-event write integrity

## Alpha
- End-state: An archive operation and any attendance, need, action, or story mutation cannot commit a child change after the parent event becomes archived. Every child mutation must be transactionally bound to the caller's active organization and an unarchived event.
- In-state evidence: `server/nonprofit-events-routes.ts` applies `getAccessibleEvent(..., true)` before starting child-write transactions, so the archive state is not rechecked or locked with those writes. The archive write is a separate transaction. `migrations/20260903_nonprofit_events_integrity.sql` currently enforces tenant foreign keys and parent lifecycle transitions but no child-write archive invariant. `scripts/verify-nonprofit-events.ts` proves ordinary post-archive attendance rejection but not concurrent archive/write behavior.
- Authority/boundaries: The database is the source of truth for archive permanence and tenant ownership; route checks remain a user-facing early rejection only. Existing organization access, aggregate-only attendance, story consent transitions, append-only audit history, and event lifecycle semantics must remain unchanged. No deployment, data deletion, or public-surface change is authorized.
- Plan and acceptance proofs: Add a database-level parent-row lock plus active-org/unarchived recheck for each child write path, coordinate the archive update through that same lock, and add a trigger-level invariant so direct or missed write paths also fail closed. Extend the live verification script with simultaneous archive/update requests and direct-state assertions. Prove with the focused verifier, TypeScript validation, migration replay as applicable, workflow/log check, independent adversarial audit, and one isolated code review.
- Unknowns/deferred decisions: The exact current database test harness behavior and transaction helper typing still need inspection. UI end-to-end testing is not the primary proof because the race is server/database-concurrent; the existing live HTTP verification script is the behavior-layer acceptance test.

## Omega
- Diff scrimmage: Every child mutation route now locks the same tenant-qualified parent event inside its transaction, rechecks archive state, and binds existing child updates/deletes to the locked event and organization. The archive operation locks that parent before its idempotency decision and state change. Database triggers independently guard child inserts, updates, deletes, parent moves, and direct truncation, while retaining legal referential cleanup.
- Proofs and gates: The application restarted twice and applied the archival write-lock and truncation-guard migrations during normal development startup. The focused live verifier passed aggregate-only attendance, tenant isolation, lifecycle, consent, audit, direct truncation, normal post-archive rejection, and an observed PostgreSQL blocking-chain race across attendance, need, action, and story writes. Strict TypeScript compilation with the integrated-flow foundation check completed with zero errors; the diff whitespace check, memory-health gate, and formal preflight all passed. The first completion validation caught an expected database rejection that the new verifier had not handled until a later await; result handlers were attached at launch, the focused verifier and TypeScript passed again, and the complete `auth-e2e` gate then passed with all 32 browser tests and every chained server/database check. A rebase onto the current main branch was then reconciled by preserving its in-transaction event locking/lifecycle flow alongside this task's triggers, tenant-qualified predicates, and wait-graph proof; the application restarted and the focused verifier, TypeScript/integrated-flow, repeated full `auth-e2e`, preflight, and memory-health gates all passed on that rebased source.
- Independent angle: A browser-based test rendered `/organization/events` for a disposable authorized staff session at local port 5000 and confirmed that archived-event controls are absent. The development proxy returned HTTP 502 and remains separately logged; no production claim is made. Six independent adversarial auditors and an isolated architecture review found the final Task 341 diff clean after the verifier was strengthened from a timing inference to a database-observed lock-chain rendezvous.
- Outcome: Development evidence supports the requested invariant: a child write finishes before archival or waits and is rejected after archival; no archived child record can be altered through the guarded routes, direct row mutation, or table truncation.
- Residuals and reusable guard: The pre-existing story-consent transition race and staff-authorization recheck concerns remain explicitly tracked in the shared residual ledger and were neither conflated with nor worsened by this archive-specific work. Reusable guard: parent-owned archival invariants require both transaction-scoped parent locking and database enforcement; concurrency tests must prove a real database wait graph, never infer a race from elapsed time.

- Publish repair guard: The organization-members composite parent-key repair is also invoked through the post-merge migration hook, so a future merge cannot leave development with only a standalone unique index before Publish.

## Platform orchestration audit

- **Scope:** Read-only map of the existing stakeholder journeys and the
  issue/place/evidence/resource/action/follow-up/reporting orchestration spine.
- **Observed truth:** Community Impact, Time–Place–Need, Conductor/engine
  registry, Chainweb/RAG/RPLICE paths, Partner Portal, and Community Events &
  Impact are real but only partially joined. The current missing primitive is
  a durable, reviewable handoff context rather than another specialist engine.
- **Record:** Detailed Real / Partial / Stub-or-in-memory / Aspirational
  classification and a five-workstream MAP-GAP bridge plan are in
  `docs/remediation/platform-orchestration-audit-2026-08-28.md`.
- **Boundary:** No implementation, broad navigation rewrite, production
  migration, or publication claim was made. “Next best tool” remains a
  transparent, human-selected recommendation; no automatic matching or
  surveillance is proposed.
- **Operational limit:** The application workflow's prior failure was an
  `EADDRINUSE` port collision caused by concurrent checks; it is not treated
  as a code-quality or production result.