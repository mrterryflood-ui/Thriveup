# Alpha Omega — 2026-09-18 — Task 444

## Alpha

- End-state: the public capacity summary counts the same fresh rows as the directory, is not truncated at 200 rows, and reports database failures as errors instead of a false all-zero success.
- In-state evidence: `server/capacity-routes.ts` used `select().from(orgCapacity).limit(200)` without the directory's 14-day freshness predicate and returned zero counts when the query failed. `scripts/verify-capacity-routes.ts` covered stale directory rows but only checked summary field types.
- Authority/boundaries: the public directory's existing `updated_at > now() - 14 days` predicate is the freshness contract. Keep the directory cap and partner routes unchanged. Summary failures must remain observable to callers.
- Plan and acceptance proofs: use one database-side conditional aggregate filtered by the shared 14-day rule; return HTTP 500 for database errors; extend the route verification with baseline-relative stale and 205-row assertions; run focused route checks, typecheck, and the relevant audit gates.
- Unknowns/deferred decisions: no isolated route-mocking harness exists; database failure behavior will be proven by the explicit error path in source and type-checked route implementation, while live verification covers the data contract.

## Omega

- Diff scrimmage: the summary no longer loads arbitrary rows; it aggregates only rows newer than the directory's 14-day cutoff, preserves the response keys, and converts database exceptions into a logged HTTP 500. The verifier seeds 205 fresh rows and a stale waitlist row, then compares status deltas against a pre-seed baseline. The verifier completed cleanup with zero test rows left behind.
- Proofs and gates: `npx tsx scripts/verify-capacity-routes.ts` passed 16/16; the application workflow restarted and served both summary calls with 200 responses; TypeScript and integrated-flow foundation checks passed; `preflight.ts`, `memory-health.ts`, and `git diff --check` passed. Completion validation passed every listed gate except the unrelated community-brief Playwright suite: its API/probe checks passed, but the historical-receipt test timed out after 90 seconds while its companion test passed.
- Independent angle: six read-only adversarial auditors found the freshness predicate, conditional aggregate, response shape, and error path sound. They identified separate pre-existing follow-up opportunities around isolated database-failure testing, large-registry indexing, and exposing the integration summary to a user-facing surface.
- Outcome: Task 444 acceptance criteria are met. Fresh capacity counts no longer drift because of stale rows or the former 200-row read cap, and database failures cannot masquerade as a successful zero summary. The unrelated completion-gate timeout is recorded as a validation residual rather than changed under this task.
- Residuals and reusable guard: keep summary and directory freshness predicates aligned; preserve baseline-relative over-capacity fixtures so the test remains valid with unrelated database rows. The verifier still uses a live database rather than an isolated failure-injection harness, which is proposed separately.