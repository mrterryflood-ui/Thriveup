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
| 2.1 | Trade Sims signup digest scheduler | confirmed-working (gated) | `server/index.ts:197-206`: `setInterval(…, 24h)` only when `NODE_ENV=production && !onVercel`. Never fires in dev or on Vercel by design; not observed firing (needs production logs). |
| 2.2 | Welcome email on signup | confirmed-broken (dead code) | `sendWelcomeEmail` is exported from `server/email-service.ts:552` and has **no caller** anywhere in `server/` (`rg -l sendWelcomeEmail` → only its definition). |
| 2.3 | Partner webhook dispatch | confirmed-working | Zero-subscriber case is a logged no-op; `scripts/verify-referral-webhook.ts` runs inside the `auth-e2e` gate (see memory: webhook-subscriber-detection). |
| 2.4 | AI engine smoke tests every 15 min | confirmed-working (gated) | `server/index.ts:166-175`: `startAISmokeTests()` only in production off-Vercel; `GET /api/system/smoke-test` exists behind `requireAuth` (`server/routes.ts:6585`). Not observed firing (production only). |
| 2.5 | Stale-capacity / heartbeat sweeps | confirmed-working (gated) | `server/routes.ts:7020` `setInterval(runStaleCapacityEmailSweep, WEEK_MS)`; gun-violence registry sync + staleness check `server/index.ts:303-312`. Interval code paths only; no firing evidence in dev. |
| 3.1 | HazardAware bridge | confirmed-working (unconfigured) | `GET /api/hazardaware/status` → 200 `{"bridge":"hazardaware","configured":false,…}` — honest disclosure, no fabricated data. |
| 3.2 | ChildCORE | confirmed-working (auth-gated) | `GET /api/childcore/status` → 401 (staff gate). Contract drift notes in memory `childcore-production-contract-drift`. |
| 3.3 | CVR ingest bridge | not-checkable / net-new | No CVR route module exists in `server/` (`rg -il "cvr" server` returns no route file). Scheduled after this ledger, not folded into IA. |
| 3.4 | RPLICE exchange | confirmed-working (empty) | `GET /api/rplice/state` → 200 with empty `countyProfiles/partners/programAlerts` — route live, no synced data yet. `/api/rplice/status` does not exist (404). |
| 3.5 | Civic Signal | confirmed-working | `GET /api/civic-signal/status` → 200 `outboundReachable:true`, "reachable and authenticated (partner-exchange v1)". |
| 3.6 | Health federation (HerHealth / MaleHealth) | confirmed-working | `GET /api/health/federation/status` → 200 `allOk:true`, herhealth `ok:true` 142 ms. (Reviewer's path `/api/health-federation/*` is wrong → 404.) |
| 4.1 | Community story returns 502 | confirmed-working | `POST /api/community-story/pack {"location":"Austin, TX"}` → 200 with ZCTA 78701 brief; empty body → 400 `location is required`; `/generate` does not exist (404). |
| 4.2 | Directory dead links | confirmed-working | `directory-links` gate (`scripts/run-directory-links.sh`) runs the link checker + Playwright entry suites; extended this session with `community-gravity.spec.ts` and the route-registry gate. |
| 4.3 | AI lanes | confirmed-working | `ai-preamble` gate passes; OpenRouter rotation documented; `/api/ai/status` is not a route (404) — reviewer path mismatch. |
| 4.4 | Orphaned route modules | confirmed-working (none orphaned) | 7 modules not imported by `routes.ts`/`index.ts` statically are all imported dynamically or by siblings: childcore/loi/mou/hazardaware/resident-story (`routes.ts` dynamic import), equity-loss-national (`equity-loss-routes.ts`), public-routes (`static.ts`, `vite.ts`). 117 `register*Routes(app)` calls over 122 route files. |
| 5.1 | Guide strip absent on most pages | confirmed-broken (planned) | Frame exists only for the hard-coded `focusedEntry` list in `client/src/App.tsx` (now includes `/community-gravity`). Phase 4 `PageFrame` reads the registry. |
| 5.2 | Live status badges | confirmed-broken (planned) | No per-page status rail; `/api/ecosystem/health` → 200 (`totalPlatforms:31, onlinePlatforms:1`) is the data source Phase 4 will surface. |
| H | Public health endpoint (reviewer note) | confirmed-working | `GET /health` → 200 `{"status":"ok","timestamp":…}` on Replit **and** on the Vercel preview (`vercel.json` rewrite). `/api/health` is not a route (404) on either. |

## Added this session (verified)
- Community Gravity Phase 1: `GET /api/community-gravity?city=Austin&state=TX` → 200, 9,179 IRS BMF orgs, provenance + method + limits in payload; staff writes → 401 anonymous; `/community-gravity` page; `tests/e2e/community-gravity.spec.ts` 3/3.
- Route registry G1: 412 routes / 412 entries / 0 untagged (`scripts/verify-route-registry.ts`); draft is deterministic and stale-checked in the directory-links gate.

## Not done here (explicitly)
- No production (`NODE_ENV=production` long-lived host) log evidence for 2.1/2.4/2.5 firing — needs deployment logs.
- Provider cutover (1.1–1.4), CVR bridge (3.3), welcome-email wiring (2.2) are separate scoped builds.
