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