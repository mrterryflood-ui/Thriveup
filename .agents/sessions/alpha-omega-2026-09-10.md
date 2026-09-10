# Alpha Omega — 2026-09-10 — ChildCORE capability truth and Partner API contract

## Alpha
- End-state: ChildCORE ROI and YHSI capabilities must show truthful connecting/available states, and the Partner API must advertise the scopes and endpoints it enforces.
- In-state evidence: The workspace source declared `chainweb:read` and `yhsi:read`, but the admin dashboard hard-coded all scopes as active. Production `/api/partner/v1/heartbeat` returned 404 and production docs omitted the newer Chainweb/YHSI contract entries.
- Authority/boundaries: Partner authorization is determined by the hashed `THRIVEUP_API_KEY` row in `partnerApiKeys`; no secret values are exposed. The admin capability route remains session-protected. Production publication is outside this code change.
- Plan and acceptance proofs: Add a redacted live capability-status route; make Connection, ROI, and YHSI UI states depend on it; advertise the enforced scopes/endpoints; run typecheck, integrated-flow, preflight, local protected-route checks, and live production status checks.
- Unknowns/deferred decisions: The production key’s exact scope row cannot be inspected without exposing credentials or using a production database operation. Publishing the current workspace build is still user-controlled.

## Omega
- Diff scrimmage: The capability route hashes only the configured key, returns no key material, and uses the same scope vocabulary as Partner API enforcement. Unauthenticated access returned 401. Public docs returned 200 and listed Chainweb/YHSI scopes and endpoints.
- Proofs and gates: TypeScript passed; integrated-flow foundation passed; preflight passed after this record was added; local docs contained the new contract; `git diff --check` passed. Production showed 401 for protected Chainweb/YHSI/student routes and 404 for heartbeat, proving the deployment is behind the workspace.
- Independent angle: Direct live HTTP checks against `https://easyailearning.com` were compared with local route/docs behavior rather than relying on source inspection.
- Outcome: Workspace implementation is verified. The admin dashboard no longer makes an unconditional “Active” claim, and ROI/YHSI capability panels render connecting states until the live key row grants the required scope.
- Residuals and reusable guard: Publish the current workspace build before treating the new scopes or heartbeat as live. Compare public Partner API docs and one unauthenticated status probe with source routes after future Partner API changes.