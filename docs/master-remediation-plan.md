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

## Phase schedule

| Phase | Window | Items | Milestone |
|---|---|---|---|
| 0 | Now → Oct 13 | **R1 Phase A** (place handoff, 8 routes) + demo rehearsal | Oct 14 Hutto meeting: the walk carries context end to end |
| 1 | Oct 15 – Nov 9 | **R2**, **R4**, **R1 Phase B** | Single access truth; stakeholder surfaces zero-defect |
| 2 | Nov 10 – Dec 21 | **R1 Phases C–D**, **R3**, **R5**, **R6** | Live cohort report; data-currency system operating |
| 3 | Q1 2027 | National mechanics (county pilots, channels) | First out-of-region county pilot signed |

## Master gates — the definition of "no gaps"

- **G1:** Every story-walk route carries place (and audience where relevant) with zero re-entry.
- **G2:** The registry is the only access predicate; permission-sync passes.
- **G3:** Every thin domain has a documented integration path or minimal native surface.
- **G4:** All 12 stakeholder routes zero-defect at three widths; internal tools labeled.
- **G5:** A real cohort outcome report exists — real data, consented, receipt-grade.
- **G6:** Every data surface is dated; staleness is visible; CI enforces currency.
- **Standing:** real-data-only; non-destructive; main untouched; every phase verified by the independent reviewer before it is called complete.

---

## Reporting

- **Before:** Five gaps named but not work-ordered; "connected" was a claim the code did not yet fully honor; no mechanism to keep data factual over time.
- **Changed:** This plan converts every gap into a Problem → Solution → Fix → Proof work order (R1–R6), sequenced into four gated phases, with a data-currency system (R6) that keeps the platform factual after the fixes land.
- **Why:** The platform's claim — superior to any single-link competitor because it runs the whole chain — must be true in the resident's experience, not only in the architecture; and an implementation-science platform must run its own fidelity loop.
- **Proof:** Every claim above traces to the route registry, the parameter audit, or the file list — the same evidence base as the companion inventory. Gates define what "done" means before work starts.
- **Limits:** Phases 1–3 are planned, not built. R3 recommends integration over building for the four system domains — that is a sustainment decision and can be overridden by the owner. R5's timeline depends on partner adoption pace, not code. The quarterly re-verification job needs a scheduler in the deployment environment (Replit cron or Vercel cron) — an operations task, not a code gap.

**Five pillars.** Product & UX — one context across the whole journey; no re-entry anywhere. Engineering — additive, gated phases; one access truth; one context standard. Security & Access — consent-gated household context; access consolidated, never loosened. Marketing & Revenue — the Hutto standard becomes the repeatable national demo with receipt-grade proof. Legal & Compliance — data-council consent rules govern all person-level context; every shown number carries a source and a date.
