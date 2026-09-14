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

---

# Alpha Omega — 2026-09-14 — ChildCORE destination settings

## Alpha

- End-state: Platform staff can update the ChildCORE API base URL and external
  documentation URL without a code release; all connector, monitoring, public
  documentation, landing, and focused liveness consumers use the same persisted
  values.
- In-state evidence: `shared/childcore-config.ts` contains compile-time
  destinations; `server/childcore-connector.ts` captures the base URL at module
  load; `server/childcore-routes.ts` exposes protected status/ping routes;
  `client/src/pages/api-docs.tsx` and `client/src/pages/landing.tsx` import the
  shared constants; `scripts/verify-childcore-doc-target.ts` imports the docs
  constant. Existing platform-staff authorization and Drizzle/Postgres
  patterns are available in the inspected server routes/schema.
- Authority/boundaries: authenticated platform staff are the only writers;
  both values must be absolute HTTPS URLs; settings changes are append-only
  audit events; public consumers may read destination metadata but no
  credential or private operational data.
- Plan and acceptance proofs:
  1. Add shared defaults/HTTPS validation and persisted singleton settings plus
     audit schema.
  2. Add server settings accessors with a cache invalidation path, protected
     GET/PATCH settings routes, and a public read-only destination route.
  3. Make connector, monitoring status, API docs, landing card, and focused
     liveness check consume the persisted configuration.
  4. Add focused route/config verification, then run typecheck, preflight,
     relevant liveness/security checks, and an independent adversarial review.
- Unknowns/deferred decisions: no production publish or production migration is
  part of this task; deployment verification remains an operator action after
  the code and development schema are validated.

## Omega

- Diff scrimmage: Added validated persisted singleton destinations, append-only audit history with row/truncate guards, authoritative startup SQL plus idempotent helper migration, staff-only settings UI/routes, operation-scoped connector reads, public metadata/liveness protections, and all required consumer rewiring.
- Proofs and gates: Development startup applied `20260928_childcore_integration_settings.sql`; migration helper reran safely; TypeScript and integrated-flow foundation passed; HTTPS validation cases passed; public-config returned the persisted docs URL; focused docs liveness remained warning-only on upstream network failure; workflow restarted cleanly.
- Independent angle: Six-domain adversarial audits found and remediated first-read concurrency, stale config fallback, mixed probe snapshots, public probe load, audit truncation, role mismatch, stale public links, validation feedback, and in-flight form overwrite risks.
- Outcome: Task 401 is complete in development. Platform staff can update both HTTPS destinations; connector, protected monitoring, public API docs, landing ChildCORE card, and focused liveness resolve the persisted configuration.
- Residuals and reusable guard: No publish or production migration was performed. External ChildCORE documentation was unreachable during the focused check, so the check correctly reported a warning rather than claiming the upstream was live.