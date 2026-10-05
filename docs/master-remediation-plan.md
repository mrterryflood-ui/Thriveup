# ThriveUp — Master Remediation Plan: Complete Orchestration & Integration

**For:** the Replit builder (executor). **Verified by:** the independent reviewer (Perplexity). **Authority:** non-main branch only (`chore/replit-exit-inventory`); no production flip; real-data-only (never synthetic data about a city); additive, no deletions; every phase gated with evidence before it is called complete.

**Standard:** each item below is written as **Problem** (what is broken, with evidence) → **Solution** (the design) → **Fix** (exact steps) → **Proof** (the acceptance gate). Do not skip a gate. Do not mark complete without evidence.

**Companion documents already in the repo:** `docs/demo-door-spec.md` (the stakeholder door, built at `5ab9457`) and `docs/complete-system-inventory-and-remediation.md` (the full 374-route inventory this plan remediates).

---

## R1. Journey continuity — the context-preserved handoff

**Problem.** The chain is linked conceptually, not contextually. Verified in code: only 4 of the 12 resident-journey routes accept a place parameter today (`/community-gravity`: place/zip/city/state; `/community-banks`: place; `/community-map`: geo/q; `/sdoh-explorer`: state). `/411`, `/benefits-screener`, `/parents`, `/academy/financial-literacy`, `/academy/careers`, `/impact`, `/community-analysis`, `/corridor-intelligence`, and `/chainweb` accept none. A family moving through the chain re-enters their place at every door. This is the single reason the platform has felt "not connected."

**Solution.** One JourneyContext standard, carried in the URL, merged with the signed-in journey:

- `JourneyContext = { place, audience, entry, referral? }` as URL query parameters — stateless, shareable, deep-linkable (the pattern the outcome landings and demo door already use).
- Merge rule: explicit URL place wins; else the signed-in journey place (`use-magnet-journey-place`); else the tool asks. No default city, ever.
- Consent rules per the Community Data Council principles: `place` and `audience` are non-sensitive and carry freely; `household` and `referral` attach only when signed in AND consented.
- Exit handoffs: outbound external partner links carry source tags so partners can see the referral flow the platform generates.

**Fix.**
1. Create `shared/journey-context.ts` (types + `parseJourneyContext`) and `client/src/lib/journey-context.ts` (`useJourneyContext()` reader, `buildJourneyHref(path, ctx)` writer). No new store, no server dependency.
2. **Phase A (8 routes):** accept `?place=` in `community-411`, `benefits-screener`, `parents`, `community-analysis`, `corridor-intelligence`, `chainweb`, and `impact`. Each page: read the param on mount, pre-fill its place selector, and show "Showing: {place}" with a clear control. Where a page has its own internal place state, sync from the URL.
3. **Phase B (audience continuity):** honor `?audience=` in `community-411`, `benefits-screener`, `parents`, the academy pages, and `/community-gravity` — set the existing audience preference on arrival.
4. **Phase C (consent-gated household/referral):** extend `useJourneyContext` to attach household/referral context only for authenticated users with recorded consent, following the existing consent patterns; anonymous users are never prompted mid-journey.
5. **Phase D (external tagging):** outbound partner/source links append a source tag (`?src=thriveup`) where the destination allows it.
6. Update the outcome landings, the demo door story steps, and the tools directory "Leads to" links to route through `buildJourneyHref` so context propagates from every surface.

**Proof (gate).** Playwright: start at `/411?place=78634`, walk through benefits-screener → parents → academy → impact; place visible and pre-filled at every arrival with zero re-entry; anonymous walk triggers no consent prompts; signed-in walk attaches household only with consent recorded; tsc 0; no default city anywhere in the walk.

---

## R2. One source of access truth

**Problem.** Five files still import the legacy sidebar predicate `getSidebarNavigationAccess` (`page-frame.tsx`, `tool-directory.tsx`, `outcome-landing.tsx`, `command-palette.tsx`, `risk-monitor.tsx`). Visibility = registry AND legacy — two truths that can drift apart. `/hub/legacy` also survives as a parallel front door.

**Solution.** The route registry becomes the only access predicate.

**Fix.**
1. Diff the legacy predicate against the registry's access tiers; fold any access fact that exists only in the legacy list into the registry entry for that route (the permission-sync script `verify-navigation-permission-sync.ts` is the checker).
2. Remove the legacy import from the five files; reduce `app-sidebar` to presentation-only (or delete the predicate export).
3. Alias `/hub/legacy` to `/workspaces`; remove it from navigable surfaces.

**Proof (gate).** Zero components import the legacy predicate; permission-sync script passes with the existing 19 restricted destinations unchanged; Playwright auth matrix (anonymous / authenticated / staff / admin) shows zero visibility regressions.

---

## R3. Thin domains — integrate, don't build

**Problem.** The inventory (Part 1 of the companion document) found five work domains with thin or absent coverage for the nonprofit-for-nonprofits mission: volunteer management, donor cultivation CRM, constituent communications (email/SMS), financial and budget management, and full multilingual breadth.

**Solution.** Partner-integration posture, not feature sprawl: nonprofits keep their incumbent systems; ThriveUp remains the orchestration layer. The `/agency-connector` and `/api-docs` surfaces exist for exactly this.

**Fix.**
1. For each of the four system domains (volunteers, donor CRM, communications, finance): write a one-page integration pattern in `/api-docs` — what syncs, what events flow into the platform's outcome records, what stays external.
2. Define the minimal native surface only where outcomes demand it: volunteer hours and donor commitments become outcome events in `/outcomes`; nothing more.
3. Multilingual: extend `useLanguage` to the 12 stakeholder-visible routes first (Spanish), before any broader i18n pass.

**Proof (gate).** Each domain has either a documented integration path in `/api-docs` or a minimal native surface spec; no CRM-building scope creep; the 12 stakeholder routes render correctly in Spanish.

---

## R4. Presentation grade — honest two-tier surfaces

**Problem.** 91 operate-lane routes and several specialist hubs are staff-utility grade, not stakeholder-grade; deep analytics are desktop-first; naming is inconsistent (legacy hubs, parallel front doors).

**Solution.** An honest two-grade system: stakeholder-grade surfaces polished to zero-defect, internal tools explicitly labeled internal.

**Fix.**
1. Polish pass on the 12 stakeholder-visible story routes (typography, contrast, tap targets, 375/1024/1440).
2. Add an "Internal tool" badge to operate-lane routes so the grade difference is declared, not discovered.
3. Naming and alias pass: consolidate legacy hub names behind aliases; one term per concept platform-wide.
4. Mobile pass on the demo-critical tools (gravity, corridor intelligence, chainweb, community map).

**Proof (gate).** Screenshots of all 12 routes at three widths reviewed with zero clipped text, overlaps, or contrast failures; internal badge present on operate routes; nothing deleted.

---

## R5. Measurement activation — the first real longitudinal record

**Problem.** The outcome machinery is built (outcome reporting, WIOA outcomes, longitudinal dashboards, donor receipts) but there is no live cohort record yet — so the platform's central promise (documented outcomes) is demonstrated, not yet operating.

**Solution.** Activate with the Hutto cohort: baseline → events → the first receipt-grade quarterly report, all real data.

**Fix.**
1. Define the cohort's outcome event schema using the existing `/outcomes` model.
2. Onboard Hutto ISD/Chamber partners (`/partners/join`) and record the baseline.
3. Generate the first quarterly engagement report from live data; link the donor-receipt surface to real, consented receipts.

**Proof (gate).** A real cohort report exists with sources and dates; zero synthetic numbers; consent documented for every person-level record.

---

## R6. Factual and updated data — get there and STAY there

**Problem.** Facts drift: sources age, benchmarks go stale, links rot. A platform claiming evidence must prove currency continuously, not once. (This is the implementation-science requirement: the platform must run its own fidelity and CQI loop on itself.)

**Solution.** Treat platform data like a clinical-quality system: a source registry with verification dates, staleness surfaced in the UI, automated CI checks, and scheduled re-verification — using the platform's own CQI/RE-AIM/peer-review tooling applied to the platform.

**Fix.**
1. **Source registry:** extend `/data-sources` with `lastVerified`, `nextCheck`, `owner`, and `status` per source. Every data-driven page renders "Data as of {date}" from this registry — never hardcoded.
2. **Staleness UI rule:** anything past its source's refresh window shows an amber "verify" badge. Data is never silently stale.
3. **CI gates:** extend the verification scripts to fail the build if a stakeholder-visible page shows data without a date, or a benchmark without a year and URL.
4. **Scheduled re-verification:** a quarterly job re-pulls public sources (IRS, Census, HUD), flags diffs, and writes a dated `.verification/` record.
5. **Pre-meeting rule (already in the demo spec):** re-verify every on-screen number before any stakeholder meeting; label benchmark years prominently.

**Proof (gate).** `/data-sources` shows verification dates for all sources; a deliberately stale fixture fails CI; the quarterly job has run once and written its record.

---

## R7. Open Referral alignment — speak the ecosystem's shared language

**Problem.** The integration-first posture (R3) lacks the handshake with the wider ecosystem: most 211s, United Way systems, and resource directories exchange organization and service data in Open Referral's Human Services Data Specification (HSDS). Without an HSDS-compatible surface, ThriveUp is easy to integrate with only for partners who write custom code — the opposite of reducing friction for the nonprofit sector.

**Solution.** Make the partner API HSDS-compatible in both directions: export a place's organization/service data as valid HSDS (so any Open Referral consumer can load it, including 211 systems), and import HSDS (so a partner's existing directory can seed the platform instead of being retyped).

**Fix.**
1. Map the platform's organization / service / location / schedule models to the HSDS tables; document the mapping in `/api-docs` with the HSDS version pinned.
2. Add an HSDS export endpoint (CSV and JSON) for a place's Community Gravity organization records first — IRS-sourced orgs are the highest-value dataset the ecosystem wants.
3. Add HSDS import to the `/agency-connector` flow so partner directories load without manual entry.
4. Validate exports against the HSDS spec (required fields, table shapes); round-trip test one partner dataset.
5. Label the surface in `/api-docs`: "Open Referral (HSDS) compatible."

**Proof (gate).** An HSDS-valid export for a Travis/Hutto place loads into an Open Referral-compatible consumer with zero transformation; an import round-trips; the mapping is documented with the spec version pinned.

## R8. Every door has an example — the show-me layer (adoption curve)

**Problem.** 340 real pages, and a first-time nonprofit director, caseworker, or resident faces the same question at every door: what does this do, who is it for, what happens next? The full chain's value is invisible from any single tool. Sensibility, learning curve, and adoption friction — not capability — are the binding constraint on growth.

**Solution.** A universal example layer powered by the registry. Every route already carries `guide` ("Need → this page → next action"), `upstream`, `downstream`, `audiences`, and `outcome` — the raw material for a per-door example already exists in classified form. Render it as a consistent "How this fits" panel on every tool page, then curate walkthroughs for the doors that carry stakeholder weight.

**Fix.**
1. **R8a — auto-generated panels, every door at once (quick win):** build one `ToolExamplePanel` component that renders the registry entry — who it's for (audience labels), what it does (description), where you likely came from (upstream), what's next (downstream), and the guide line. Mount it through `PageFrame`, which is already on every page. One component = all 340 doors have examples immediately, zero per-page work.
2. **R8b — curated walkthroughs:** for the 12 stakeholder-visible routes and the four demo door audiences, add curated step-by-step walkthroughs in the demo-door story pattern — 3–5 steps, real data or clearly-badged format examples, "Leads to" links that carry journey context (R1).
3. **R8c — first-run teaching:** empty states teach instead of sitting blank — a "Try it" affordance with a real sample input the user can replace (e.g., a ZIP), so first-use friction drops to one click; a guided tour mode for organization onboarding.

**Proof (gate).** E2E asserts the example panel renders on every real route (registry-driven, not a hardcoded list); the 12 curated walkthroughs are reviewed at three widths; a new-user test — stakeholder goes from `/tools` to a completed action inside a walkthrough without assistance — passes. No synthetic data about any city appears in any example.

---

## R9. Data expansion — verified public sources, key-gated orchestration

**Problem.** The live data spine (Census ACS, CDC PLACES, IRS, ProPublica Nonprofit Explorer, SAMHSA FindTreatment, plus agency datasets) is strong, but six verified gaps remain: EJScreen environmental justice scores, FRED county economic series, NIH RePORTER live queries, CareerOneStop live job/training data, FBI CDE agency-level crime data, and the HUD USPS ZIP crosswalk join. Three of the six are already named or registered in the platform without live calls (CareerOneStop as a registered source, RePORTER as a link, FBI as curated datasets) — the gap is adapters, not awareness.

**Solution.** Build one adapter per source through the R6 source registry. APIs that need keys ship dark — fully built, hidden until the owner supplies the key in environment secrets — so nothing blocks on key acquisition and no half-configured surface ever shows a user an error.

**Logic model — what each adapter is for.** Every adapter follows the same chain: place context (R1) → adapter → source registry entry (R6, dated) → one existing surface (no new doors) → example panel (R8) → decision. Per source:

| Source | Input | Output (surface) | Outcome (who decides what) | Counterfactual today |
|---|---|---|---|---|
| EJScreen (EPA) | County / tract / ZIP from place context | Environmental justice indicator percentiles (PM2.5, diesel, traffic, Superfund proximity) on community analysis and corridor intelligence | Grant writers, cities, and banks make sourced EJ claims for a specific tract — CDBG, EPA, and Justice40-scored applications become competitive | Environmental layer absent; every EJ claim hand-assembled off-platform; EJ-scored applications weaker |
| NIH RePORTER | Institution, district, or researcher name | Live award history (dollars, years, mechanism) on grant prior-awards / GrantPath | Clients write grants knowing what was actually funded in their space; universities see research dollars in their district | Static link; users leave the platform, proposals written blind to funding history |
| FBI CDE | County + agency ORI | Agency-level offense/arrest trends in the community violence register and regional briefings | Violence-prevention coalitions cite local official trendlines vs. state/national in grant applications | Curated national datasets only; local claims uncited or stale |
| FRED | County FIPS from place context | Economic time series (unemployment, labor force, income, poverty) as trend charts in community analysis and the banks demo view | Banks, EDOs, and corridor decisions see trajectory — improving or declining — not one-year snapshots | Single-year ACS figures; "is this place getting better or worse" cannot be answered |
| CareerOneStop | Occupation/SOC code + learner location | Live job postings, wages, in-demand skills, nearby training providers in workforce surfaces and LineReady | Learners choose trades with real local demand; program designers align curriculum to live demand | Static occupation profiles; training decisions on stale national data |
| HUD USPS crosswalk | ZIP code | Correct ZIP↔county↔tract↔entitlement-area joins so HUD program data attaches to place pages | Housing counts and HUD dollars cite the right jurisdiction every time | ZIP-level data cannot join HUD jurisdictions reliably; county briefings risk misattributed numbers — a correctness gap, not just coverage |

**Fix.**
1. **No-key adapters first** (value ships immediately, nothing to wait on):
   - EJScreen Report API (EPA) — environmental justice scores per geography for corridor intelligence and community analysis.
   - NIH RePORTER API — replace the static link in grant prior-awards with live award-history queries (GrantPath).
   - FBI Crime Data Explorer — agency-level offense data supplementing the curated gun-violence cache (community violence register).
2. **Key-gated adapters, built dark** (render nothing, not an error, while the key is absent):
   - FRED API (St. Louis Fed) — county economic time series.
   - CareerOneStop Web API (DOL) — live job postings and training providers; upgrade the registered source to live calls.
   - HUD USPS ZIP-crosswalk API — join ZIP-level work to HUD program data.
3. **Owner key checklist — the only manual step in R9:**
   - FRED: register at `api.stlouisfed.org` (instant).
   - HUD: register at `huduser.gov` API portal (instant).
   - CareerOneStop: request at `careeronestop.org/Developers/` (approval may take a day or more).
   - Store each as `FRED_API_KEY`, `CAREERONESTOP_API_KEY`, `HUD_API_KEY` in Replit environment secrets. Keys never appear in the repo, commits, or code.
4. **Per-adapter standard:** registry entry with `lastVerified`; source label and date on every surfaced figure; graceful dark behavior with the key absent; a verification record row per source showing live / dark / key-pending status. Build no-key adapters first so the phase produces value from day one; keyed adapters light up without a rebuild the moment the owner adds the secret.

**Proof (gate).** Each adapter returns live real data for a Hutto/Travis test geography when its key is present (or is key-free); each keyed adapter stays dark and error-free with the key absent; every surfaced figure carries source and date; no synthetic data about any city.

---

## R10. Ecosystem showcase — external URLs presented as the wraparound, not a link list

**Problem.** The platform holds dozens of verified external URLs — the partner directory, state-parameterized federal networks (Cooperative Extension, American Job Centers, SBDCs), state benefit program URLs, navigator recommendations, and benchmark citations — but they live on separate operational surfaces. An external audience (bank, district, county) sees either a partner CRM or scattered links, so the strongest visual proof of the claim — "we run the whole chain, and these are the trusted handoffs" — is never shown. The ecosystem is real in the data and invisible in the experience.

**Solution.** One audience-facing ecosystem surface, registry-driven, that lays out every external resource in an aligned and linked way: grouped by wraparound domain and the chain step each serves (find help → refer → track → measure → fund), each entry carrying an honest relationship label, a plain-language purpose, who it's for, and a state-aware deep link. Curated by relationship, not alphabetized — the difference between "hey, we have these websites too" and a wraparound map.

**Fix.**
1. **Consolidate into one registry** (`shared/external-resources.ts`): merge federal-partners, federal-programs, navigator recommendations, and benchmark links into one typed registry — `{ name, url | urlByState, domain, chainStep, relationship, purpose, audience, lastVerified }`.
2. **Honest relationship labels** — the anti-overclaim rule: **Verified partner** (MOU or active relationship) · **Official referral** (we send people there; not a partnership) · **Federal/state network** (official locator, state-parameterized) · **Data source** (feeds our numbers) · **Benchmark** (how the sector is measured). Nothing is implied beyond what the label states.
3. **The showcase surface**: `/ecosystem` (linked from /partners and the demo door) — grouped by domain, filterable by audience (resident / organization / funder / government) and chain step; each card: name, relationship badge, one-line purpose, "who it's for," deep link. Same visual language as the demo door.
4. **State-aware links**: federal-partner and program URLs are already parameterized by jurisdiction — drive them from JourneyContext place → state, so a Texas visitor gets Texas extension, job centers, and benefits URLs without asking.
5. **Demo door integration**: each audience view gains an "your ecosystem" section showing only the slice relevant to that audience — banks see the funding and benchmark slice; districts see education and family wraparound.
6. **Currency**: extend the existing link-verification gate to the new registry; every entry carries `lastVerified`; staleness per R6.

**Proof (gate).** Every registry entry renders with its relationship label, purpose, audience, and verified URL; state-aware links resolve correctly for a Hutto/Texas context; link verification passes with zero dead links; each demo door audience shows the correct ecosystem slice; no partnership is implied that the relationship label does not state.

---

## Phase schedule

| Phase | Window | Items | Milestone |
|---|---|---|---|
| 0 | Now → Oct 13 | **R1 Phase A** (place handoff, 8 routes) + demo rehearsal | Oct 14 Hutto meeting: the walk carries context end to end |
| 1 | Oct 15 – Nov 9 | **R2**, **R4**, **R1 Phase B**, **R8a** (auto example panels, every door) | Single access truth; every door explains itself; stakeholder surfaces zero-defect |
| 2 | Nov 10 – Dec 21 | **R1 Phases C–D**, **R3**, **R5**, **R6**, **R8b** (curated walkthroughs), **R10** (ecosystem showcase) | Live cohort report; data-currency system operating; walkthroughs teach the chain; the wraparound is visible to audiences |
| 3 | Q1 2027 | **R7** (HSDS), **R8c** (first-run teaching), **R9** (data expansion), national mechanics (county pilots, channels) | Open Referral-compatible export live; six new sources live or key-ready; first out-of-region county pilot signed |

## Master gates — the definition of "no gaps"

- **G1:** Every story-walk route carries place (and audience where relevant) with zero re-entry.
- **G2:** The registry is the only access predicate; permission-sync passes.
- **G3:** Every thin domain has a documented integration path or minimal native surface.
- **G4:** All 12 stakeholder routes zero-defect at three widths; internal tools labeled.
- **G5:** A real cohort outcome report exists — real data, consented, receipt-grade.
- **G6:** Every data surface is dated; staleness is visible; CI enforces currency.
- **G7:** HSDS (Open Referral) export validates and round-trips with a real consumer.
- **G8:** Every real route renders its example panel; the 12 curated walkthroughs pass the new-user test.
- **G9:** Every R9 adapter is live-or-dark per key status; surfaced figures carry source and date; no key ever touches the repo.
- **G10:** Every external URL renders with relationship label, purpose, audience, and a verified link; no dead links; no partnership implied beyond its label.
- **Standing:** real-data-only; non-destructive; main untouched; every phase verified by the independent reviewer before it is called complete.

---

## Reporting

- **Before:** Five gaps named but not work-ordered; "connected" was a claim the code did not yet fully honor; no mechanism to keep data factual over time.
- **Changed:** This plan converts every gap into a Problem → Solution → Fix → Proof work order (R1–R10), sequenced into four gated phases, with a data-currency system (R6) that keeps the platform factual after the fixes land, an example layer (R8) that collapses the learning curve on every door, and a key-gated data expansion (R9) whose only manual step is the owner supplying API keys.
- **Why:** The platform's claim — superior to any single-link competitor because it runs the whole chain — must be true in the resident's experience, not only in the architecture; and an implementation-science platform must run its own fidelity loop.
- **Proof:** Every claim above traces to the route registry, the parameter audit, or the file list — the same evidence base as the companion inventory. Gates define what "done" means before work starts.
- **Limits:** Phases 1–3 are planned, not built. R3 recommends integration over building for the four system domains — that is a sustainment decision and can be overridden by the owner. R5's timeline depends on partner adoption pace, not code. The quarterly re-verification job needs a scheduler in the deployment environment (Replit cron or Vercel cron) — an operations task, not a code gap.

**Five pillars.** Product & UX — one context across the whole journey; no re-entry anywhere. Engineering — additive, gated phases; one access truth; one context standard. Security & Access — consent-gated household context; access consolidated, never loosened. Marketing & Revenue — the Hutto standard becomes the repeatable national demo with receipt-grade proof. Legal & Compliance — data-council consent rules govern all person-level context; every shown number carries a source and a date.
