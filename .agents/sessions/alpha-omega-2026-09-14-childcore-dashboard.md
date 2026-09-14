# Alpha Omega — 2026-09-14 — ChildCORE dashboard destination proof

## Alpha

- **End-state:** an authenticated browser test proves `/childcore-integration`
  clearly reports unavailable upstream and documentation destinations when the
  status metadata request returns 503, while a healthy response renders the
  configured host and external docs link.
- **In-state evidence:** `client/src/pages/childcore-integration.tsx` already
  renders explicit unavailable copy from null status fields; the protected
  route is admin-gated in `client/src/App.tsx`; `server/childcore-routes.ts`
  returns 503 with null destinations when status loading fails; the shared
  forged-session helper is in `tests/e2e/helpers/auth.ts`.
- **Authority/boundaries:** preserve the existing protected route, shared
  destination contract, and fail-closed copy. Add only the focused browser
  proof and its existing authenticated gate wiring. No production calls,
  deployment, schema migration, or destination changes.
- **Plan and acceptance proofs:** provision an isolated admin fixture, forge a
  real app session, intercept only controlled browser responses, assert both
  unavailable and healthy UI states, run the focused Playwright spec and
  TypeScript/diff checks, then perform an independent six-domain audit.
- **Unknowns/deferred decisions:** the live ChildCORE upstream is not part of
  this proof; the test must keep external network behavior out of the
  assertions so a provider outage cannot make the browser gate flaky.

## Omega

- **Diff scrimmage:** the six-domain audit confirmed the asserted test IDs,
  status response shape, protected route wiring, and auth-e2e inclusion. The
  fixture was hardened to provision both `users.is_tcaf_admin` for the client
  gate and the canonical `academy_avatars.role = admin` for server role
  resolution. Separate anonymous/non-admin authorization coverage remains out
  of this narrow destination-state task.
- **Proofs and gates:** focused Playwright proof passed 2/2 tests on the live
  development workflow: controlled 503 shows unavailable API/docs copy and
  leaves the tabs usable; healthy metadata renders the configured host and
  both external docs links. TypeScript `npx tsc --noEmit -p .` passed with zero
  errors. `git diff --check` passed. Workflow restarted and served on port
  5000.
- **Independent angle:** six parallel read-only auditors reviewed API
  contracts, runtime/DOM, UI/navigation, offline behavior, UX/performance,
  and full-stack congruence. No blocking finding remained after the fixture
  role hardening; synthetic docs URLs are intentionally rendering fixtures,
  not liveness checks.
- **Outcome:** complete. The authenticated browser regression proof is included
  in `scripts/run-auth-e2e.sh`.
- **Residuals and reusable guard:** future changes should preserve null
  destination fields on status failures and keep the UI copy tied to status
  metadata rather than hardcoded hosts. Access-policy and other-tab outage
  coverage are proposed as separate follow-ups.