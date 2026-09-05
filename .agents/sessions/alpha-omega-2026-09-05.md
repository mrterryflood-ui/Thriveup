# Alpha Omega — 2026-09-05 — Childcare follow-up hardening and browser proof

## Alpha
- End-state: Execute the three childcare follow-ups: reject malformed CHW childcare payloads, add real-browser coverage for the national childcare page, and provide an in-page recovery action for partial Census results.
- In-state evidence: CHW childcare queries in `client/src/pages/chw-dashboard.tsx` currently use `useQuery<any>` and direct response rendering. The national page already has strict normalization and a live Census endpoint; Playwright is configured in `playwright.config.ts`, but the prior session recorded missing local Chromium.
- Authority/boundaries: Preserve live-source and nullability disclosures; do not turn missing Census/HHSC data into zeros; do not change auth boundaries or install packages; browser proof must remain development proof, not production proof.
- Plan and acceptance proofs: Add shared local runtime validators for CHW WSRCA/search payloads, add national-page Playwright interaction coverage using existing test conventions, add a retry control for partial national data, then run typecheck, focused childcare verification, Playwright coverage, preflight, memory health, workflow restart/log inspection, screenshot, and six-domain adversarial audit.
- Unknowns/deferred decisions: Browser availability may still block Playwright execution; if so, keep the test committed and report the environment blocker rather than weakening the test.

## Omega
- Diff scrimmage:
- Proofs and gates:
- Independent angle:
- Outcome:
- Residuals and reusable guard: