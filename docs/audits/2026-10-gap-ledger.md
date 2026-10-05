# Reviewer gap inventory — live-check ledger (read-only)

Date: 2026-10-04 · Method: every row was probed this session against the running
development server (`http://127.0.0.1:5000`, Replit boot) and, where marked, the
Vercel **Preview** of branch `chore/replit-exit-inventory` (`a17dc6f9`,
`https://thriveup-5q894mzkh-terry-flood-s-projects.vercel.app`). Status values:
**confirmed-working**, **confirmed-broken**, **confirmed-coupled** (works on the
Replit host, by design absent elsewhere), **not-checkable** (needs production
or credentials). Rows are not flipped on commit messages; each cites the probe.

| # | Reviewer claim | Status | Probe → observed |
|---|---|---|---|
| 1.1 | Sign-in is coupled to Replit OIDC | confirmed-coupled | `server/replit_integrations/auth/replitAuth.ts` is the only OIDC module. Replit: `GET /api/login` → 302. Vercel preview: `GET /api/login` → 503 `{"message":"Sign-in unavailable on this deployment: REPL_ID not configured"}` (fail-soft, no boot crash). Cutover is a separate build. |
| 1.2 | Email depends on a Replit-brokered Resend credential | confirmed-coupled | `server/email-service.ts` fetches the Resend key via `REPL_IDENTITY` + `/api/v2/connection?...connector_names=resend`; no `RESEND_API_KEY` env path. Sends not exercised (would email real people). |
| 1.3 | Object storage is Replit-bucket bound | confirmed-coupled | `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS` are the only storage configuration present (secrets inventory). Not exercised. |
| 1.4 | Production URL discovery is Replit-specific | confirmed-coupled | `server/index.ts:187` discovers the live URL from `REPLIT_DOMAINS`. |
| 2.1 | Trade Sims signup digest scheduler | not-checkable (production execution) | `server/index.ts:197-206`: `setInterval(…, 24h)` only when `NODE_ENV=production && !onVercel`. Scheduling code exists; firing has not been observed. |
| 2.2 | Welcome email on signup | confirmed-broken (dead code) | `sendWelcomeEmail` is exported from `server/email-service.ts:552` and has **no caller** anywhere in `server/` (`rg -l sendWelcomeEmail` → only its definition). |
| 2.3 | Partner webhook dispatch | confirmed-working | Zero-subscriber case is a logged no-op; `scripts/verify-referral-webhook.ts` runs inside the `auth-e2e` gate (see memory: webhook-subscriber-detection). |
| 2.4 | AI engine smoke tests every 15 min | not-checkable (production execution) | `server/index.ts:166-175`: `startAISmokeTests()` only in production off-Vercel; `GET /api/system/smoke-test` exists behind `requireAuth` (`server/routes.ts:6585`). Firing has not been observed. |
| 2.5 | Stale-capacity / heartbeat sweeps | not-checkable (production execution) | `server/routes.ts:7020` `setInterval(runStaleCapacityEmailSweep, WEEK_MS)`; gun-violence registry sync + staleness check `server/index.ts:303-312`. Interval code paths only; no firing evidence in dev. |
| 3.1 | HazardAware bridge | confirmed-working (unconfigured) | `GET /api/hazardaware/status` → 200 `{"bridge":"hazardaware","configured":false,…}` — honest disclosure, no fabricated data. |
| 3.2 | ChildCORE | confirmed-working (auth-gated) | `GET /api/childcore/status` → 401 (staff gate). Contract drift notes in memory `childcore-production-contract-drift`. |
| 3.3 | CVR ingest bridge | not-checkable / net-new | No CVR route module exists in `server/` (`rg -il "cvr" server` returns no route file). Scheduled after this ledger, not folded into IA. |
| 3.4 | RPLICE exchange | confirmed-working (empty) | `GET /api/rplice/state` → 200 with empty `countyProfiles/partners/programAlerts` — route live, no synced data yet. `/api/rplice/status` does not exist (404). |
| 3.5 | Civic Signal | confirmed-working | `GET /api/civic-signal/status` → 200 `outboundReachable:true`, "reachable and authenticated (partner-exchange v1)". |
| 3.6 | Health federation (HerHealth / MaleHealth) | confirmed-working | `GET /api/health/federation/status` → 200 `allOk:true`, herhealth `ok:true` 142 ms. (Reviewer's path `/api/health-federation/*` is wrong → 404.) |
| 4.1 | Community story returns 502 | confirmed-working | `POST /api/community-story/pack {"location":"Austin, TX"}` → 200 with ZCTA 78701 brief; empty body → 400 `location is required`; `/generate` does not exist (404). |
| 4.2 | Directory dead links | confirmed-broken (external blockers) | The unchanged full `directory-links` gate includes the three third-party problems recorded below. Scoped IA checks are not evidence that the external-link gate is green. |
| 4.3 | AI lanes | confirmed-working | `ai-preamble` gate passes; OpenRouter rotation documented; `/api/ai/status` is not a route (404) — reviewer path mismatch. |
| 4.4 | Orphaned route modules | confirmed-working (none orphaned) | 7 modules not imported by `routes.ts`/`index.ts` statically are all imported dynamically or by siblings: childcore/loi/mou/hazardaware/resident-story (`routes.ts` dynamic import), equity-loss-national (`equity-loss-routes.ts`), public-routes (`static.ts`, `vite.ts`). 117 `register*Routes(app)` calls over 122 route files. |
| 5.1 | Guide strip absent on most pages | confirmed-working (registry rail) | Shared PageFrame mounted in App shell; static and dynamic registry metadata, access floor AND legacy predicate, home/embed exclusion. G3 browser and dynamic-frame unit proof recorded in final evidence. |
| 5.2 | Live status badges | confirmed-working (network aggregate only) | Expanded PageFrame reads public `/api/ecosystem/health` through a shared cached query and polite status region. Label is network-wide reported health, explicitly not proof of the current page's health. Missing/malformed/failed status stays unavailable. |
| H | Public health endpoint (reviewer note) | confirmed-working | `GET /health` → 200 `{"status":"ok","timestamp":…}` on Replit **and** on the Vercel preview (`vercel.json` rewrite). `/api/health` is not a route (404) on either. |

## Added this session (verified)
- Community Gravity Phase 1: `GET /api/community-gravity?city=Austin&state=TX` → 200, 9,179 IRS BMF orgs, provenance + method + limits in payload; staff writes → 401 anonymous; `/community-gravity` page; `tests/e2e/community-gravity.spec.ts` 3/3.
- Route registry G1: 412 routes / 412 entries / 0 untagged (`scripts/verify-route-registry.ts`); draft is deterministic and stale-checked in the directory-links gate.

## Not done here (explicitly)
- No production (`NODE_ENV=production` long-lived host) log evidence for 2.1/2.4/2.5 firing — needs deployment logs.
- Provider cutover (1.1–1.4), CVR bridge (3.3), welcome-email wiring (2.2) are separate scoped builds.

## Phase 2 page walk (413 routes read, classified, cross-checked)
Source: four classification lanes read every route's component (`shared/route-registry/lane-*.ts`); gate `REQUIRE_FULL_CLASSIFICATION=1 scripts/verify-route-registry.ts` → 413/413, 0 unclassified, all upstream/downstream/alias targets are real routes, no lane lowered access below its `RequireAuth` floor. Outcome moves vs. the heuristic draft: get-help 132→60, operate 66→101, see-the-data 55→72, learn 50→80.

Observations surfaced by the walk (not fixed here unless marked):
- **Fixed:** legacy sidebar linked `/community-story` but only `/community-story/:shareId` and `/community-story-pack` existed (`verify-sidebar-routes` was red on `main`); added a `<Redirect>` alias. Also fixed: the Community Gravity workspace task's match term "organizations" hijacked "Our organizations need financial support" (catalog test red); terms narrowed.
- Same component under two paths without a redirect: `/` & `/hub`; `/intake` & `/intake-wizard`; `/research` & `/methodology`; `/transparency` & `/transparency-dashboard`; `/st-davids` & `/wab2-enrollment`; `/case-manager` & `/case-manager/:id` (ID ignored). Candidates for Phase 3d aliasing.
- Param routes that ignore their param: `/resident-journey/:id` (uses `?pid`, defaults to a demo profile), `/community-story/:shareId` (renders the builder).
- Demo/sample data rendered as if live: `/engagement-hub` (generated participants, simulated nudges), `/apprenticeship`, `/apprenticeship-tracker`, `/transition-plans`, `/case-manager`, student wizards claim saved selections without persistence.
- Public draft but admin-only data calls: `/ecosystem`, `/ecosystem/embed`; LifeBridge directives require authentication.
- Forms/links that go nowhere: HBCU inquiry form does not submit; links to unregistered `/profile` (Shadow Worker Hub), `/connect-with-us` (Workforce Pell), `/embed/demo` (For Partners).
- Naming mismatches: `/parents` is Parent Resources (not the dashboard); `/funder-dashboard` is staff account management, not the public funder report; Sparky is an adult companion, not a student one.
- Purpose unclear from code: `/studio/:moduleKey` (depends on runtime manifest).
- Pre-existing red in `directory-links` gate, third-party URLs: `implementationineducatio.com` (404 — TCAF-adjacent domain, needs owner decision), `wellcome.org/.../discovery-research` (moved), `easyailearning.com/api/childcore/county-metrics/ingest` (POST-only endpoint probed with GET). Not changed.

## Phase 3 nav re-map (registry is now the only nav source for sidebar, tabs, /tools)
- Slim manifest `shared/route-nav.generated.json` (339 canonical linkable rows, 213 public) generated alongside the registry; both stale-checked in the directory-links gate.
- Alias redirects added: `/hub→/`, `/intake-wizard→/intake`, `/research→/methodology`, `/transparency-dashboard→/transparency`, `/wab2-enrollment→/st-davids`. Not aliased: `/case-manager/:id` (param route), `/workforce` duplicate (second Redirect is unreachable; left as-is).
- G2 evidence: two-click gate 260 routes (every public canonical row reachable via `/tools`); `tests/e2e/outcome-nav.spec.ts` 4/4.

## Phase 4 — rail, map, disclosure (development verified; awaiting user verification)
- G3: seven passing browser cases covering the six public outcomes, home/embed absence, public next links, phone keyboard/persistence, county-map validation, live Leaflet ZIP clusters, accessible list, full bank assessment-area scope, directory expansion/search, and journey place precedence/failure.
- Geographic correction: 3,144 development county coordinates repaired against Census 2023 interior points; guard reports zero off-centroid. New map reads the official table directly. Production rows were not repaired or checked.
- Map proof: Austin 8,162 organizations placed at 49 filing-ZIP interior points, 1,017 counted but unplaced, 254 TX context counties, eight seeded curated pins. Filing-city gravity and statewide need are labeled separately; county/MSA queries retain scope.
- Quality: TypeScript zero errors, touched-client lint zero warnings, production build passed; 27 distinct browser cases passed across the consolidated gate and its scoped continuation. External URL checks remain excluded from passing claims.
- Audit residual: existing staff research can partially persist facts and misreport a subsequent read failure as “nothing stored.” Outside Phase 4; platform-engineering owner, medium severity, review before treating research retries as atomic.
- Limits and exact proof trail: `.verification/2026-10-04-phase4.md`.

## Completion continuation — Phases 5 and 7
- Six public outcomes have additive `/start/*` landings, AI-generated architectural images explicitly labeled illustrative, direct gated actions, user/saved geography, lazy map and authenticated snapshot, and native advanced-analysis tool links. `/outcomes` remains a separate authenticated report namespace.
- Dynamic parameter pages now receive frame metadata without exposing literal `:id` navigation links; literal-specific patterns precede generic patterns.
- Phase 1 remaining geographic scope: Travis primary-county ZIP ingest executed once (8,782 upserts from the 154,539-row official TX file), with cross-county/filing-location limits. Nearby is now measured from Census postal interior points within 50 miles, with actual city navigation links. The county ingest is an operator CLI, not a promised new API mode.
- Research residual from Phase 4 resolved: one atomic INSERT replaces per-fact inserts; read-after-write failure reports a successful receipt separately; ambiguous write failure does not claim zero storage. No live paid AI research or staff verification of a real nonprofit was performed as test evidence.
- Provider cutover/CVR/welcome-email wiring and live production scheduler execution remain the separately scoped items defined by the original master plan, not unfinished IA phases.
- Final review also repaired optional frame parameters, ingest-error cache clearing, explicit example-city disclosure, and the existing `/outcomes` admin-only route/sidebar/registry congruence. Final proof: 19/19 browser cases, 18 screenshots, TypeScript/lint/build pass, 419/419 registry rows and 2/2 unit cases. No blanket production/project-wide green claim.
