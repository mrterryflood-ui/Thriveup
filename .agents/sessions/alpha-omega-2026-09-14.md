# Alpha Omega — 2026-09-14 — International closeout and Manor GrantPathPro vertical

## Alpha

- **Objective:** finish the international community-context contract, truthful
  global/local homebase framing, ITI consent hardening, and domestic-only
  boundary for Community Voice/WPH/LifeBridge.
- **Authority:** international claims require local adapters and evidence
  provenance; domestic methods are not assumed portable; no publish, deploy,
  destructive action, or production migration.
- **Acceptance:** public invitee provenance is server-normalized,
  invitation/consent creation is atomic, withdrawal is lock-safe, Voice pins
  linked to ITI are token-verified and consent-filterable, crisis copy is
  truthful, the homepage discloses availability limits, and the Manor
  GrantPathPro package exposes a permanent four-package taxonomy while the
   organization bootstrap remains staff-only, idempotent, and integration-owned;
   it does not require a personal owner ID.

## Omega

- Typecheck/integrated-flow foundation: PASS.
- International community-context tests: 3/3 PASS.
- Seed idempotency and provenance checks: PASS, with the existing static warning
  list for tables without provenance columns.
- `git diff --check`: PASS.
- Focused six-domain adversarial audit completed; high-risk findings in the
  new path were remediated and the final runtime/type/build gates passed.
- No publish, deploy, destructive action, or production schema migration.
- Manor taxonomy and staff-only bootstrap implementation added. The development
  database has the additive external-key and integration-owned schema; no Manor
  row was created during verification.

## Residuals

- International RPLICE exchange-contract fetching and journey-spine context
  priming remain future work.
- Community Voice remains domestic until a country adapter, local owner,
  safeguarding/legal contract, language/accessibility plan, service destination,
  and human escalation agreement are verified.
- Existing unrelated youth-mode, event-authorization, and preview-proxy
  residuals remain open in the project ledger.
- GrantPathPro production contract verification was not run because
`PUBLISHED_BASE_URL` is not configured; no live partner claim is made.

---

# Alpha Omega — 2026-09-14 — Youth Mode persistence gate

## Alpha

- End-state: authenticated and anonymous Youth Mode toggles expose real persistence; saved Navigator threads restore Youth Mode in a fresh browser; the serialized gate keeps its app process.
- In-state evidence: the first live gate run showed the development server exiting during database startup before Playwright could connect. The UI owns state in client/src/components/ai-navigator.tsx; profile persistence is /api/learner-profile; thread restoration is /api/navigator/conversations/:id/messages.
- Authority/boundaries: preserve account isolation, anonymous localStorage fallback, conversation-level Youth Mode truth, and server-side AI mode enforcement. No publish, deploy, destructive action, or production migration.
- Plan and acceptance proofs: reproduce the serialized gate and startup lifecycle; patch root causes; run the focused gate, typecheck, and independent adversarial review; record exact evidence.
- Unknowns/deferred decisions: determine whether the startup exit is a database wake-up condition or an application lifecycle issue before changing process handling.

## Omega

- Diff scrimmage: scoped profile and conversation caches by authenticated user; added explicit query functions for URL-only endpoints; cancelled debounced writes, thread loads, active streams, and deep-think polling on identity changes; restored both true and false thread values; persisted both active-thread transitions; hardened learner-profile ownership; added process-group startup retries and cleanup.
- Proofs and gates: focused serialized Youth Mode gate PASS (5/5) after the first implementation and again after the final source changes; TypeScript PASS; memory-health PASS; preflight PASS (9/9); git diff check PASS.
- Independent angle: six-domain audit was run before remediation and identified the cache URL-shape, account-state, and true/false symmetry gaps that were fixed. A second isolated audit produced additional account-hydration, anonymous-thread, and persistence findings that were fixed; architect review was unavailable in Free mode.
- Outcome: Task end-state is verified in development: authenticated and anonymous toggles persist, profile state survives a fresh browser, both on/off conversation states restore, and the serialized gate keeps a healthy app process.
- Residuals and reusable guard: broader app-wide authenticated local-storage surfaces, non-YouthMode SSE routes, and cross-gate cleanup remain outside this task. Cache keys that add identity must use an explicit queryFn when the endpoint URL is not parameterized.