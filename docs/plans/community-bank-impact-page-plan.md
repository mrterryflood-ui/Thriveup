# Community Bank Impact Page — Integration Plan (no new engines)

Status: PLAN ONLY. Nothing built. Authored 2026-10-04 for review.

## 1. What the platform is (as verified in code, not from memory)

TCAF + ThriveUp is a free, cross-sector civic platform with four stakeholder entrances
(residents, organizations, funders, community leaders) and these place-aware data organs
already live on the server:

| Organ | Endpoint(s) | Geography coverage |
|---|---|---|
| Location resolution | `/api/community-map/location-search`, `/api/benefits/resolve-zip/:zip`, `server/geo/zip-county-resolver.ts` | ZIP → county FIPS → state, nationwide (DB + static fallback) |
| Community context narrative | `/api/community-map/context/:geographyKey`, `/api/community-map/search/:state`, heatmap, compare, resource graph | 50-state architecture; depth varies by state |
| Census ACS (population, income, housing, child pop) | `/api/sdoh/location`, `/api/benefits/tracts/:countyFips`, `/api/benefits/svi-analysis` | Nationwide (API-key gated at place level) |
| Equity-Loss Engine (3-frame divergence) | `/api/equity-loss/*`, `/equity-loss/national` | Nationwide, county-level, disclosed peer-class |
| HUD PIT homelessness | `hud-pit` routes, `/hud-report` PDF | Nationwide CoC, 2015+ youth |
| Childcare supply/demand | `/api/childcare/national-overview`, `/api/childcare/search` | TX = HHSC licensing; other states = Census CBP + ACS |
| Benefits access + barriers + CHW network | `/api/benefits/barriers/:countyFips`, `/outreach-strategy/:countyFips`, `/how-to-apply/:program`, screener | Screener nationwide; barrier/CHW depth strongest in TX |
| Gun-violence intelligence | `/api/gun-violence/summary`, `/intelligence` | Registry nationwide |
| Workforce / CEDS regional alignment | `/api/ceds/lookup`, `/api/ceds/regions` (PM1–PM5) | 12 TX EDD regions seeded; framework is national |
| Resource directory + referral loop | `/get-help`, directory, referral status/confirm tokens | Nationwide directory; referral loop requires org onboarding |
| Academy (financial literacy, trade sims, youth workforce) | `/academy/*` | Nationwide, no geography dependency |
| Ecosystem registry (external platforms) | `ECOSYSTEM_PLATFORMS` in `server/ecosystem-connector.ts`, `/api/ecosystem/health`, `/api/ecosystem/capability-portfolio` | 30 platform profiles with live health pings |

Existing views that already assemble some of this: `/community-analysis` (primary GIS shell),
`/community-impact` (3D viz tabs), `/impact`, `/ecosystem`, `/for-agencies`, `/hub/fund`,
`/workspace/funders`. None of them is framed for a bank, and none ties geography → data
→ tools → external sites → funding ask into one scroll.

## 2. What a community bank actually needs to see (stakeholder red-team)

A community bank officer evaluating a sponsorship asks, in this order:
1. **Is this my assessment area?** — the page must open on *their* geography (county/MSA), not "Texas."
2. **What are the documented community needs?** — credible, sourced indicators (ACS, HUD, SVI, Equity-Loss divergence), with provenance and small-cell suppression intact.
3. **What does the platform already do about it?** — concrete tools residents/orgs use *today*, each with a one-click live demonstration (not a description).
4. **How does it map to CRA community development categories?** — affordable housing, community services to LMI individuals, economic development/small business/workforce, revitalization/stabilization. (The platform has only one CRA mention today, in grant-package copy — this framing must be *added as a lens*, not invented data.)
5. **What is interconnected?** — the referral loop, the journey spine, Chainweb/Civic Signal, and the external owned sites; shown as one system diagram with live health.
6. **What does funding buy?** — the platform is free; the funded piece is TCAF human coordination/fidelity work + local activation (per standing brand rule: free platform + separately funded implementation).
7. **How do we talk to you?** — a contact / sponsorship inquiry path, not a dead end.

Nothing on the page may assert outcomes, dollar impacts, or utilization that the platform
does not measure. The user's own standing rule: *no fabricated scores, telemetry or outcomes*.
Canonical public stats only (15 service platforms, 107 languages, 4 AI engines, 50-state
architecture ≠ deployment). No grant numbers.

## 3. Proposed section: `/community-banks` (public, no sign-in)

One route, one page, geography-parameterized. Canonical form:
`/community-banks?place=<zip|county FIPS|"City, ST">`, defaulting to the Central Texas
MSA (Travis/Williamson/Hays/Bastrop/Caldwell) when no place is given.
Chicago, IL → Cook County; Philadelphia, PA → Philadelphia County — same code path,
no per-city build. Every panel declares its own coverage: if a dataset is TX-only
(HHSC licensing, CEDS regions, CHW network depth), the panel says so and shows the
national fallback that already exists instead of hiding.

### Page anatomy (single scroll, every block clickable into the live tool)

1. **Header + assessment-area selector** — reuse `/api/community-map/location-search`
   and `resolveZipBestEffort`. Shows resolved county/state, data vintage, and a
   "change area" control. Shareable URL.
2. **Community snapshot** — 6–8 sourced indicators from Census/SVI/HUD/Equity-Loss/
   childcare with source + year labels, pulled from existing endpoints. Each tile links
   to the deeper existing page (`/community-analysis`, `/equity-loss`, `/sdoh-explorer`,
   `/hud-report`). No new computation.
3. **CRA lens** — a static mapping table (new *copy*, not new data): CRA community
   development category → ThriveUp tools that serve it → data panel that evidences it.
   Housing → directory/HUD/referrals; Community services (LMI) → benefits screener,
   guided apply, CHW coordination; Economic development/workforce → Academy, trade sims,
   CEDS alignment, workforce dashboard; Revitalization → community analysis, equity-loss.
   Explicitly labeled as "how to read our tools through a CRA lens — not a legal opinion."
4. **Live tool demonstrations** — the three resident actions already on the homepage
   (find support / check benefits / learn skills) rendered as embedded `?embed=1`
   frames or deep links **pre-scoped to the selected geography**, plus the professional
   entrances. Banker clicks one and sees it work for *their* county.
5. **Interconnection map** — a compact system diagram: ThriveUp hub ⇄ referral loop ⇄
   partner orgs ⇄ external owned platforms ⇄ Civic Signal/Chainweb. Data from
   `/api/ecosystem/capability-portfolio` + `/api/ecosystem/health` (live status dots,
   last-ping time). Needs the registry to carry an explicit **`ownership` flag**
   (TCAF/ISS-owned vs partner) — today it only has `role`. This is metadata, not a feature.
6. **External owned sites rail** — each owned site: name, one-line purpose, live status,
   link. Drawn from the same registry filtered by ownership.
7. **What funding supports** — free platform statement; funded items = local activation,
   CHW/coordination fidelity, partner onboarding, reporting cadence. Plain, no price list
   unless the user supplies one.
8. **Evidence & limits** — provenance footer: which panels are observed vs modeled,
   suppression floor, data vintages, coverage caveats for the selected state. This is the
   honesty block that makes the page safe to put in front of a bank.
9. **Contact / sponsorship inquiry** — reuse existing contact or partner-join path
   (`/partners/join`) with a `source=community-bank` tag; no new backend unless the
   existing form cannot carry the geography.

### Also generates (same data, second surface)
- **Printable one-pager**: reuse the existing PDF generation pattern (HUD report /
  community brief) so a banker can forward it internally. Same panels, same provenance.

## 4. What must change in code (integration-only, scalpel scope)

| # | Change | Type | New? |
|---|---|---|---|
| A | Add `ownership: "tcaf" \| "partner"` to `ECOSYSTEM_PLATFORMS` entries | metadata | no new engine |
| B | One server composer `GET /api/community-banks/profile?place=` that calls existing resolvers/endpoints in parallel and returns `{geography, indicators[], tools[], ecosystem[], coverage[], provenance[]}` with explicit `coverage` and `valueSource` per item | thin aggregation over existing functions; cached; rate-limited by `req.ip`; public | composer only |
| C | `client/src/pages/community-banks.tsx` + route; add to `shared/workspace-catalog.ts` (funders + community workspaces) and nav/tools so the two-click gate finds it | page | yes (the page itself) |
| D | Geography pre-scoping on the three resident entry tools (pass `?zip=`/`?county=` where they already accept it; otherwise link only) | wiring | no |
| E | CRA lens copy + funding/limits copy | content | yes (copy) |
| F | PDF one-pager via existing report generator | reuse | no |
| G | Tests: composer unit test (TX, IL, PA, invalid, unresolvable ZIP → explicit "unavailable" not empty-success), Playwright: page loads for Austin/Chicago/Philadelphia, every tile link resolves, coverage labels render, 360×640 fit, no sign-in wall, no helper overlap; chain into an existing gate | guards | yes |

Explicitly **not** in scope: new datasets, new AI calls, new scoring, schema changes,
publishing, repository sync, any outcome/ROI figures.

## 5. Risks and how they are closed

- **Fabrication risk** — every indicator carries source/vintage from the producing
  endpoint; panels with no data render "not available for this area" (fail closed).
- **TX-centric depth read as nationwide** — `coverage` field per panel; page copy states
  "50-state architecture; local depth varies" in the user's canonical framing.
- **Ownership claims** — only registry entries flagged `tcaf` are described as "websites
  we own"; partners are labeled partners. Needs user confirmation of the owned list.
- **Performance** — composer fans out to slow external sources (Census, HUD). Use existing
  caches + request deadlines; render tiles progressively; never block the page on one source.
- **Access regression** — page is public; it must not expose internal blocks (strip for
  anon per public-endpoint doctrine); it grants no roles.
- **Nav overload** — the user's standing direction is focus before integration. The page
  is a *curated* view for one audience; it does not add to the resident homepage.

## 6. Order of execution (after approval)

1. Confirm owned-site list + default Central Texas county set (user input).
2. A + B (server metadata + composer) with unit tests; verify Austin/Chicago/Philadelphia
   payloads by curl.
3. C + D + E (page, wiring, copy) with design pass at 360/390/1280.
4. F (PDF) once panels are stable.
5. G gates, typecheck zero errors, lint, build, preflight, independent browser pass,
   adversarial read-only audits, Alpha/Omega record.

Acceptance: a banker in any US county types a ZIP or city and, without signing in, sees
sourced local indicators, clicks into working tools scoped to that place, sees the live
interconnection map with correct ownership labels, reads what funding supports, and can
print or inquire — with every number traceable and every coverage limit stated.
