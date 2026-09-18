# Alpha Omega — 2026-09-18 — Capacity results across screening resets

## Alpha

- End-state: capacity results must stay scoped to the active ZIP and screening attempt; a reset must not show an earlier organization, empty state, or capacity error unless the new lookup returns it.
- In-state evidence: the capacity query was keyed by ZIP and retry attempt, while a successful result could remain fresh in the shared in-memory TanStack Query cache after “Screen Another Person” reset the form.
- Authority/boundaries: change the Benefits Screener client query identity and its browser regression only; do not change the capacity API or unrelated referral, accessibility, or answer-editing behavior.
- Plan and acceptance proofs: include the screening generation in the capacity query key, reset the retry counter with a new screening, and run a same-browser E2E flow through organization → empty → error states across ZIP changes and resets.
- Unknowns/deferred decisions: broader Benefits Screener UX findings from the adversarial audit are outside this task and remain separate work.

## Omega

- Diff scrimmage: the query key now includes screening generation, ZIP, and retry attempt; start-over increments the generation and resets retry state; loading/error states continue to suppress prior organizations.
- Proofs and gates: focused Benefits Screener Playwright coverage passed 18/18; TypeScript and integrated-flow foundation passed; `git diff --check` passed; the workflow restarted cleanly; the route screenshot rendered and showed no new browser-console errors beyond the existing anonymous auth 401.
- Independent angle: six-domain adversarial audit found no capacity-isolation defect; full-stack congruence confirmed the request, response, rendered-state, and E2E contracts.
- Outcome: capacity state is isolated across ZIP changes and screening resets, including a reset with the same ZIP where a cached empty result would otherwise be reused.
- Residuals and reusable guard: future capacity changes should keep screening identity in the query key and test organization, empty, and error transitions in one browser context; unrelated audit findings are not part of this task.