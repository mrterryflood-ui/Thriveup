# Magnet IA Master Plan — "who's who, what connects to what, on every page"

Date: 2026-10-04 · Owner: Terry Flood · Builder: Replit Agent (main + parallel helpers) · Independent review: external architect (black-box, §7 acceptance) · Final validation: Perplexity, before any publish.

## 0. Alpha — ground truth (measured this session, not from the reviewer's repo read)

| Fact | Evidence |
|---|---|
| 287 page files, 413 `<Route>` lines in `client/src/App.tsx` | `ls client/src/pages`, `rg -c "<Route "` |
| Three navigation systems: focused sidebar (4 workspaces × 24 tasks in `shared/workspace-catalog.ts`), legacy `app-sidebar.tsx` (284 URLs in 8 hubs + 13 groups), `command-palette.tsx` ALL_ITEMS | file reads |
| `/tools` = `tool-directory.tsx` (46 lines) = flat merge of sidebar catalog + palette items; no categories, no connections | file read |
| Per-page frame: none. `hub-shell.tsx` exists but renders only inside hub pages; homepage "why strip"/doors stop at `/` | `focused-navigation.tsx`, `App.tsx:1129` (frame only for a hard-coded `focusedEntry` list) |
| GIS/terminal assets exist and are wired to one page only (`/community-impact`, `/hub`): `GisNeedHeatMap`, `CorrelationMatrix`, `SkylineMap`, `ParticleFlow`, `system-pulse` | rg |
| Community Gravity engine (Phase 1) written, not yet routed, migrated, or ingested: `server/community-gravity/engine.ts`, `migrations/20261009_community_gravity.sql` | this session |
| IRS EO BMF is reachable and sufficient: TX file 154,540 orgs; Austin 9,179 with NTEE + revenue | live curl |
| Git: origin = github.com/mrterryflood-ui/Thriveup, current branch `chore/replit-exit-inventory`, 4 uncommitted files. No pull/push in this request (user instruction). | `git remote -v`, `git status` |
| Reviewer gap inventory items 1.x–5.x are **repo-read claims**; each needs a live check before it is treated as fact | attachment honesty note |

Reviewer diagnosis accepted: audience and task are mixed in one flat list; connections are told not shown; no progressive disclosure; the picture stops at the homepage.

## 1. Target model (approved direction, reconciled to what exists)

Two orthogonal axes. **Outcome** is the primary nav; **audience** is context set once and carried.

Outcomes (6): Get Help · Learn · Work & Earn · Connect (the Magnet) · Fund · See the Data.
Audiences (10): Resident/Family · Students & youth · Foster youth · Veterans · Returning citizens · Caregivers/CHWs · Nonprofit/CBO · Agency/government · Funder/evaluator · Rural/farm.

Reconciliation with the existing 4 workspaces (residents / organizations / funders / community): workspaces become audience *groups*; the 10 audiences nest under them. Nothing already built on `/` or `/workspace/*` is removed — doors and starting tasks keep their testids and routes, their labels reconcile to the 6 outcomes.

The "Bloomberg terminal + GIS" is a **frame**, not a page:
- Top rail on every page: *You are here → Outcome → (Audience) → connects to [upstream need | downstream action] → next step → guide*.
- Magnet map (GIS + nodal): organizations ↔ resources ↔ data for the user's community, driven by the Community Gravity engine + existing resource directory + county evidence layers.
- Progressive disclosure: simple surface, drill-down for detail; staff/admin tools behind an Operator door.

## 2. Backward plan (from the acceptance criteria to the first commit)

Acceptance gates the reviewer will check black-box (and we check first):
G1 Registry complete — tagged routes == total routes, zero untagged (automated test).
G2 Every URL reachable from 6-outcome nav + search, zero 404s (crawl script).
G3 Frame renders on every page and is correct per page (Playwright sample + automated registry check).
G4 Non-destructive — no page file deleted; aliases only (git diff test).
G5 Magnet works for Austin end-to-end: ingest → clusters → magnets → nearby → cited facts → staff verify → link to Partners/referral (API + UI e2e).
G6 Landings carry the photorealistic/terminal language (screenshots at 375/1024/1440).
G7 Live-check ledger: every reviewer gap item marked confirmed-working / confirmed-broken / not-checkable, with the command or log that proves it.
G8 tsc 0, lint clean, preflight, two-click reachability, touch targets — all green.

Working backward: G3 needs G1 (frame reads registry) → G1 needs the registry schema → registry needs an inventory of all 413 routes → inventory is generated, not typed by hand (script reads `App.tsx` + sidebar + palette, emits a draft `shared/route-registry.ts`, humans classify). G5 needs Phase 1 routes + page + ingest. G2 needs G1 plus the nav re-map. G7 is independent of all of them and runs in parallel from day one.

## 3. Phases, owners, parallelism

Phase 0 — Branch sync verified in the final authorized continuation. Canonical non-main branch: `chore/replit-exit-inventory`; remote head is an ancestor of local HEAD. Identical-SHA connector replay with `force:false` is the push path; no pull, rebase, force-push or main push.

Phase 1 — Connect / the Magnet (implementation complete). Austin and Travis-primary-ZIP cities are ingested; nearby uses measured Census ZIP-centroid distance. Paid AI research and real human verification are not claimed as live-tested; see final G5 limits. Serial owner: main agent.
1a routes (`/api/community-gravity` public cached; orgs search; facts; staff research/verify/ingest) · 1b page `/community-gravity` · 1c ingest Austin TX via script, then the rest of Travis County cities (Pflugerville, Manor, Del Valle…) · 1d nearby by distance via ZIP centroid (already have zcta→county map) · 1e link each org to Partners/MOU + referral tools · 1f e2e + gates.
Replication contract: `ingestState(state, city?)` is the whole nationwide path; one state file per run.

Phase 2 — Route registry (structure first, zero visual risk). Parallel lanes after the schema is fixed:
2a schema + generator script + completeness test (main) · 2b–2e classification of 413 routes split by hub into 4 helper lanes, each lane 1–3 files, each row: path, outcome, audiences, title, description, upstream, downstream, guide, access · 2f main merges, runs G1.

Phase 3 — Navigation re-map (reads registry only). 3a sidebar: 6 outcomes collapsible + audience switcher, Operator door for staff/admin · 3b bottom tabs → outcomes · 3c `/tools` becomes an outcome-grouped, connection-showing directory (replaces the flat list) · 3d alias redirects for renamed paths · 3e crawl → G2.

Phase 4 — Shared frame + magnet map app-wide. 4a `PageFrame` top rail from registry (one component, mounted in App shell, not per page) · 4b Magnet map component = Leaflet `GisNeedHeatMap` + gravity nodes + resource pins, place-aware via the journey spine · 4c progressive disclosure defaults · 4d Playwright sample → G3.

Phase 4 status: user accepted; implementation and development QA complete. PageFrame uses registry AND legacy access, including dynamic and optional routes. Progressive map and directory behavior is retained. Original 27 browser cases and final seven G3 cases pass. County coordinates corrected to Census 2023 with a recurring guard. Full external-link checks remain blocked separately. Proof: `.verification/2026-10-04-phase4.md` and final record. No production repair or publish.

Phase 5 — Terminal depth on 6 outcome landings + key tools: reuse `CorrelationMatrix`, `SkylineMap`, `ParticleFlow`, `system-pulse`; photorealistic door images (AI-generated, disclosed). Design helper lanes, one landing each, after 4a lands. → G6.

Phase 6 — Live-check ledger of the reviewer's gap inventory (parallel from day one, read-only probes): email/auth/storage provider coupling (1.1–1.4), digest/welcome/webhook/smoke/heartbeat schedulers (2.1–2.5), HazardAware/ChildCORE/CVR/RPLICE/Civic Signal (3.1–3.6), story 502 / directory links / AI lanes / mounted-vs-orphaned route modules (4.1–4.4), guide strip (5.1–5.2 — satisfied by Phase 4 rail + live status badges). Output: `docs/audits/2026-10-gap-ledger.md`, each row with command + observed output. Net-new builds (CVR ingest bridge, RPLICE exchange route, provider cutover) are **separate scoped builds after the ledger**, not folded into IA work.

Phase 7 — Omega. Adversarial 6-domain audit, Alpha Omega record, session record, memory deposit, Before/Changed/Why/Proof/Limits report. Then user runs Perplexity validation; publish only after that.

## Completion status
All approved IA implementation phases are complete. Six `/start/*` landings are additive, disclosed and wired to real tools; native specialist visualization contracts are preserved, not supplied invented model inputs. Phase 6 ledger is reconciled; Phase 7 six-domain reviews and narrowed final verification are recorded. QA: TypeScript/lint/build pass, 19 final browser cases, 18 screenshots, registry 419/419, distance/dynamic-frame units and nav/touch gates pass. See `.verification/2026-10-04-magnet-ia-final.md` for exact commands, proofs and residual limits; this does not assert every project-wide or production gate is green. The user obtains independent architect/Perplexity review; publication remains unauthorized.

## 4. Non-negotiables carried into every lane
- Additive only; no page deletions; all old URLs resolve.
- Canonical copy only via `shared/canonical-claims.ts`; never "first/only"; no outcome/ROI claims.
- Evidence states on every number: observed / modeled / unavailable; missing ≠ zero.
- Staff gates use the canonical 5-role set, enforced server-side via DB lookup.
- Public endpoints: anonymous, rate-limited by `req.ip`, cached, no PII.
- People appear only behind consent/staff verification; organizations from public records with provenance.
- TypeScript zero errors; gates not softened to get green.

## 5. Gaps found during planning (map-gap)
1. No route registry → every surface disagrees (root of "overwhelming everywhere").
2. Frame exists only for a hard-coded path list in `App.tsx:1129` → the picture stops at the homepage.
3. GIS/terminal components single-mounted → the vision is invisible on 400+ routes.
4. Magnet has no data layer yet → Phase 1 fills it.
5. `/tools` has no taxonomy → Phase 3c.
6. Reviewer's integration gaps are unverified → Phase 6 ledger.
7. Trunk/branch ambiguity (`chore/replit-exit-inventory` vs main) → Phase 0, user-gated.

## 6. Open decisions for the user
- Approve 6 outcomes + 10 audiences with workspaces as audience groups (recommended).
- Phase 0 timing: when to authorize the GitHub sync check.
- Phase 6 net-new builds (CVR bridge, RPLICE exchange, provider cutover) are scheduled after the ledger, not before the IA work — confirm or reorder.
