# Alpha Omega — 2026-09-15 — Benefits screening request identity guard

## Alpha

- End-state: ignore an in-flight screening response after the authenticated user changes or a new screening generation starts; prove the old response cannot repopulate the new screening.
- In-state evidence: `client/src/pages/benefits-screener.tsx` reset local screening state in the account-change effect, but screening mutation callbacks applied every response. `tests/e2e/benefits-screener-navigator-prefill.spec.ts` already owned authenticated benefits-screener browser coverage.
- Authority/boundaries: the client request lifecycle and its browser regression are the scope. Do not alter screening API behavior, persisted screening records, Navigator prefill contracts, or unrelated benefits UI.
- Plan and acceptance proofs: snapshot the form, user identity, and generation at submission; guard success and error callbacks; increment generation on identity transitions and start-over; run TypeScript, focused E2E, and the post-build audit.
- Unknowns/deferred decisions: the existing browser suite's auth session remains the test identity; the regression forces the client auth query to return a different identity without changing server-side screening semantics.

## Omega

- Diff scrimmage: Screening submissions now snapshot form data, account identity, generation, and active request object. Success and error callbacks reject stale account, generation, and superseded-request responses. Account transitions mask old UI before paint, advance generation in a layout effect, clear active request state, and reset local screening state; Back and Screen Another Person invalidate pending work.
- Proofs and gates: `npm run check` passed with zero TypeScript errors after the final change. The focused browser run passed both the existing start-over flow and the delayed account-transition regression (2 tests); the regression confirmed the POST started before auth refresh, the replacement form became usable, and the delayed `$99,999/year` result stayed absent. The final static pass covered the subsequent Back/layout-effect polish; the workflow had restarted successfully and served port 5000.
- Independent angle: six-domain adversarial audit was run in parallel and repeated after fixes. It confirmed the task-439 lifecycle and browser proof; it separately identified pre-existing screening referral-ID, eligibility-analytics, and cache-invalidation mismatches as out of scope.
- Outcome: task 439 is implemented: late screening success/error callbacks cannot replace a different account, a different screening generation, a changed-back form, or a superseding request.
- Residuals and reusable guard: the benefits endpoint still has legacy response-shape issues for screening-to-referral linkage and eligibility analytics; shared auth/query caching also retains the prior user until its refetch commits. Follow-up work is proposed separately. The active-request identity must remain paired with account identity and generation whenever screening mutation callbacks are changed.