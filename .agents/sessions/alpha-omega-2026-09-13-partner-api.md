# Alpha Omega — 2026-09-13 — Partner API copy-ready documentation

## Alpha
- End-state: give external partners safe, copy-ready examples for authentication, aggregate student and YHSI reads, the Chainweb scenario lifecycle, and heartbeat, with scopes and expected statuses beside each example.
- Boundaries: no real partner credentials, no publish/deploy action, preserve aggregate-only and suppression-floored student/YHSI behavior, and keep examples aligned with the shared route registry and handlers.
- Plan and acceptance proofs:
  1. Inspect the shared route registry, handler behavior, schema fields, and existing public docs.
  2. Add matching examples to the in-app docs, machine-readable docs response, and human contract guide.
  3. Reconcile documentation drift found during the adversarial audit, including route inventory, authenticated health wording, certificate URL shape, rate limits, and intentional 410 routes.
  4. Verify zero-error TypeScript, integrated-flow foundation, partner contract parsing, preflight, memory health, live docs JSON, workflow restart, and preview rendering.

## Omega
- Diff scrimmage: the in-app page has one canonical H1, responsive endpoint rows, in-page navigation, accessible copy buttons, copy status, browser-safe base URL resolution, and a complete registry-aligned endpoint inventory. The Chainweb example extracts scenario and calculation IDs with `jq` and stops clearly when an ID is absent.
- Proofs and gates: TypeScript/integrated-flow validation passed; partner contract probe passed 26/26; preflight passed 9/9; memory health passed; live `/docs` assertions passed; workflow restarted successfully; preview rendered with no new browser exception or duplicate-key warning.
- Limits: the optional narrow Playwright DOM probe could not launch because the workspace does not have the Playwright browser executable installed. Existing screenshot and static responsive checks were used instead. Startup logs still show unrelated upstream data-source 404s and ecosystem heartbeat 403s.
- Outcome: Task scope is complete without exposing a real key or changing deployment state.