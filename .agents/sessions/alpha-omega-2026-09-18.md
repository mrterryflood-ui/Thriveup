# Alpha Omega — 2026-09-18 — Capacity verifier fixture lifecycle

## Alpha

- End-state: harden `scripts/verify-capacity-routes.ts` so each run owns an isolated fixture namespace, cleanup always runs on verifier failure, cleanup failures are visible, and concurrent runs cannot overwrite or delete one another's rows while retaining the 100-row boundary regression.
- In-state evidence: the verifier used fixed `test_cap_*` organization IDs, deleted those IDs before and after the checks, swallowed delete errors, and called `process.exit(1)` from inside the run. `org_capacity` uniquely keys rows by `(orgId, programCode)`.
- Authority/boundaries: change only the verifier fixture lifecycle; do not change the capacity API or its 100-row behavior. The shared database means cleanup must be scoped to the current run.
- Plan and acceptance proofs: validate development HTTP and database targets before writes; generate a per-run UUID prefix; derive every fixture ID and cleanup list from it; wrap the check body in `try/finally`; report cleanup failures and return a non-zero exit; run the verifier and a forced request-failure path, then typecheck and inspect the diff.
- Unknowns/deferred decisions: a hard process kill cannot execute JavaScript cleanup; UUID isolation must ensure a later run cannot delete those interrupted fixtures.

## Omega

- Diff scrimmage: fixture IDs and cleanup targets all derive from one UUID namespace; target validation precedes writes; cleanup is skipped when target validation fails; validated runs clean in `finally`; a PostgreSQL advisory lock serializes the global summary baseline; lock release closes its connection and reports failures.
- Proofs and gates: normal capacity verifier passed 16/16, including the 100-row boundary and 205-row summary regression; two concurrent failed runs returned non-zero with different namespaces and zero rows remaining; rejected external target returned non-zero with zero rows; integrated-flow foundation, zero-error TypeScript, `git diff --check`, memory health, and preflight passed.
- Independent angle: final six-domain adversarial audit reported CLEAN for API, runtime, UI/navigation, storage, operations, and full-stack congruence.
- Outcome: Task 445 acceptance criteria are met. Failed, concurrent, and wrong-target runs no longer overwrite or delete another run's fixtures, and validated failures clean their own rows visibly.
- Residuals and reusable guard: hard termination can still leave that run's own rows because no process can execute `finally` after SIGKILL; UUID isolation prevents later runs from deleting those rows. Partner capacity input validation and broader orphan recovery remain separate follow-up work.

---

# Alpha Omega — 2026-09-18 — Direct backlog execution

## Alpha

- End-state: execute the concrete remaining reliability, privacy, grounding, and partner-contract work directly from the stale Draft backlog; do not create or suggest task cards.
- In-state evidence: the live task ledger contains 89 Drafts, one Active capacity task, and one recently merged GIS task. Read-only audits found implemented duplicates plus concrete gaps in capacity/referral validation, benefits authorization, ChildCORE status disclosure, partner contract probing, gun-violence cache/source handling, Navigator cancellation/metadata, and community-brief grounding.
- Authority/boundaries: preserve existing auth, aggregate-only privacy, source/vintage/unavailable disclosures, and current route contracts. Do not invent missing task specifications or weaken existing gates.
- Plan and acceptance proofs: implement independent server/client safeguards in separate waves; add focused verification for each changed contract; run typecheck, relevant gates, restart the app, inspect logs, and run the six-domain adversarial audit.
- Unknowns/deferred decisions: task titles without recoverable specifications are treated as gap signals only; unsupported or unavailable upstream data remains explicitly unavailable rather than substituted.

## Omega

- Diff scrimmage: Direct remediation covered strict gun-violence filter validation, finite grant applicant types, ChildCORE timestamp/event/ZIP bounds, Express router-failure signaling, abort-listener cleanup, bounded rate-limit and community-context maps, fail-closed RPLICE inbound writes, peer enrollment uniqueness/upsert, GPP origin/timeouts/delivery errors, safe external links, referral scoring observability, and onboarding journey ownership/validation.
- Proofs and gates: zero-error TypeScript passed with the 8 GB Node heap; integrated-flow foundation passed; benefits/ChildCORE contract gate passed; inbound verification passed 62/62; heartbeat validation and security probes passed; referral webhook verification and referral-loop E2E passed; the application restarted successfully and applied both new uniqueness migrations. The final six-domain rerun was executed independently after the first remediation wave.
- Independent angle: the final audit strands caught additional onboarding IDOR paths, milestone uniqueness, RPLICE/cache staleness, unsafe links, stale grant-package presentation, AI disclosure, and GrantPathPro delivery-state ambiguity; the highest-impact authorization and runtime issues were remediated before this record was closed.
- Outcome: the stale Draft backlog and latest audit findings were executed directly without task creation or follow-up suggestions. Local verification is green for the completed gates, and the running application is healthy on port 5000.
- Residuals and reusable guard: production post-publish verification remains unavailable because `PUBLISHED_BASE_URL` is unset. External upstream feeds may still report their own 404/credential errors; those remain disclosed rather than fabricated. Future onboarding changes must preserve owner checks, bounded actor-derived completion data, and the unique journey/milestone constraint.