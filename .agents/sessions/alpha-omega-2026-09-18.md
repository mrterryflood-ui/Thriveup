# Alpha Omega — 2026-09-18 — Task 443

## Alpha

- End-state: the focused Benefits Screener browser spec proves malformed capacity responses remain an explicit, actionable recovery state instead of looking like no local help.
- In-state evidence: `tests/e2e/benefits-screener-navigator-prefill.spec.ts` already covered valid capacity, valid empty capacity, and HTTP failure retry. `client/src/pages/benefits-screener.tsx` strictly rejects invalid JSON, invalid top-level shapes, count mismatches, invalid organizations, and non-string ZIP entries.
- Authority/boundaries: change only the focused browser spec; preserve the existing client contract and production routes. Recovery proof must assert the error notice, retry action, hidden empty state, and successful valid response after retry.
- Plan and acceptance proofs: add cases for malformed JSON, malformed capacity shape, and a numeric ZIP entry; run the focused Playwright spec and TypeScript validation.
- Unknowns/deferred decisions: none; the existing UI test IDs and recovery copy are the acceptance surface.

## Omega

- Diff scrimmage: the shared test stub returns a malformed payload only on the first capacity request, then a valid organization on retry; each case asserts the alert role, error copy, hidden empty state, exactly two ZIP-scoped requests, and successful recovery.
- Proofs and gates: focused Playwright suite passed 16/16; TypeScript passed with zero errors; `git diff --check`, preflight, and memory health passed.
- Independent angle: six-domain audit found no blockers; the browser suite exercised the actual UI recovery path for invalid JSON, malformed top-level shape, and a numeric ZIP entry, while workflow logs showed no new browser-console errors.
- Outcome: Task 443 acceptance criteria are met; malformed capacity data remains visible as an actionable error and cannot masquerade as no local help.
- Residuals and reusable guard: preserve the distinction between malformed/unavailable capacity data and a valid zero-organization response; keep malformed payload cases paired with an actionable retry assertion. Medium residuals outside this task are delayed-response/cache-contamination coverage and broader loading/empty-state announcement assertions.