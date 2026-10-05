# ThriveUp — Whole-Chain System Map

Companion to `master-remediation-plan.md` (R1–R10). One page: what the system is, what is live today, what is planned and when. Visual version: `docs/system-map.svg` (generated Oct 5, 2026 from the verified route inventory and the remediation plan, commit f9030a7).

Legend — **solid = live today**, *dashed = planned (P0–P3 per the phase schedule)*.

## 01 · Stakeholders — the right customer, at the right time

- **Residents & families** — need → help → follow-through, end to end, every domain, no re-entering their story
- **Nonprofits & agencies** — network, referrals, client outcomes, scorecard, agency connector
- **Community banks & funders** — the community case, ROI, outcome receipts (demo door default view)
- **Schools & universities** — student & family wraparound, research funding flowing to the district
- **Governments & counties** — jurisdiction evidence, coordination, procurement, grant compliance
- **Partner platforms** *(P3, via R7)* — 211s, United Ways, resource directories, through the Open Referral handshake

## 02 · Entry doors — one door per audience

- **Demo door `/demo`** — built; four audience views (banks default), real data only, cited benchmarks, go-live checklist, funding ask. Rehearsal by Oct 13.
- **Journey entries** — need-first routes: community-411, benefits screener, parents, analysis, corridor, chainweb
- **Tools directory** — 340 real tools, one front door per concept, registry-driven
- **Place landings** — Community Gravity by place/ZIP/city/state, every number anchored and sourced

## 03 · The spine — context and truth carried door to door

- **Journey context (R1, P0–P2)** — place · audience · entry · referral, URL-carried, consent-gated. Today only 4 of 12 story routes accept place; this closes the gap.
- **Route registry** — 374 routes · 18 domains · aliases; one front door per concept; two-click reachability; guide + upstream + downstream per route
- **Access truth (R2, P1)** — retire the legacy predicate in 5 files; the registry becomes the only gate
- **Example layer (R8, P1–P3)** — every door explains itself: auto panels on all 340 doors (P1), curated walkthroughs (P2), first-run teaching (P3)

## 04 · Capability domains — 18 domains · 374 routes · live today

Find help & resources · Benefits screening · Food security · Housing & shelter · Health & behavioral · Childcare & education · Workforce & trades · Justice & reentry · Violence prevention · Community banks & finance · Community analysis · Corridor intelligence · Outcomes & measurement · Funding & grants · Government contracting · Hazard intelligence · Learning & training · Operations & admin

## 05 · Data & evidence layer — sourced, dated, kept current

**Live today (adapter calls verified in code Oct 5):** Census ACS · CDC PLACES (ZCTA) · CDC WONDER · IRS tax-exempt · ProPublica Nonprofit Explorer · SAMHSA FindTreatment.gov · FEMA · HUD · BLS · EPA · NCES · USDA · USAspending · SAM.gov · Grants.gov. Iron Rule #2: every stat sourced.

**R9 expansion (P3) — each wired input → output → outcome → counterfactual:**

| Source | Input → Output → Outcome | Counterfactual today |
|---|---|---|
| EJScreen (EPA) | tract → EJ percentiles on community analysis/corridor → competitive Justice40/CDBG claims | EJ claims hand-assembled off-platform |
| NIH RePORTER | institution/district → award history on GrantPath → grants written knowing what was funded | static link; proposals blind to history |
| FBI CDE | county+agency → offense trends in violence register → local claims official and current | national curated data only; local claims uncited |
| FRED | county → economic time series → trajectory, not one-year snapshots | "better or worse?" unanswerable |
| CareerOneStop | occupation+place → live jobs/wages/providers → training where demand exists | stale national occupation profiles |
| HUD USPS crosswalk | ZIP → correct jurisdiction joins → right numbers in every briefing | misattribution risk — correctness gap |

**Data-currency system (R6, P2):** source registry with lastVerified · "Data as of" on every surface · staleness badges · CI gates · quarterly re-verification.

## 06 · Integration surface & ecosystem showcase — outside systems plug in, not replaced

- **Agency connector (R3, P2)** — volunteer, donor, comms, finance integrate rather than rebuild
- **Partner API** — documented, key-gated, consent-aware
- **Open Referral HSDS export/import (R7, P3)** — the handshake 211s and United Ways already speak
- **Ecosystem showcase `/ecosystem` (R10, P2)** — every external URL on display with honest relationship labels (sister product · verified partner · official referral · federal/state network · data source · benchmark), grouped by domain and chain step, state-aware links; per-demand routing surfaces LineReady, Shield Atlas, RepLoop, and FinLitSpark when a matching need occurs — discovery only, never merged

## 07 · Learning loop — implementation science applied to the platform itself (P2)

Measure (R5 real Hutto cohort) → receipt (auditable outcome receipts) → stay current (R6 staleness visible, CI-enforced) → feed back (evidence returns to demos, briefings, funding asks — the loop compounds).

## 08 · Roadmap to "no gaps" — four gated phases · G1–G9

| Phase | Window | Items |
|---|---|---|
| 0 | now → Oct 13 | R1-A place handoff (8 routes) · demo rehearsal · Oct 14 Hutto meeting |
| 1 | → Nov 9 | R2 access truth · R4 polish · R1-B audience continuity · R8a example panels |
| 2 | → Dec 21 | R1 C–D consent-gated handoffs · R3 integrate · R5 measure · R6 currency · R8b walkthroughs · R10 ecosystem showcase |
| 3 | Q1 2027 | R7 HSDS · R8c first-run teaching · R9 data expansion · national county pilots |

Gates G1–G9: journey continuity · access truth · integration paths · zero-defect surfaces · receipt-grade outcomes · data currency · HSDS round-trip · every door teaches · every adapter live-or-dark.

**Maturity ladder:** Fragmented → Co-located (NOW) → Integrated (after repairs, Dec) → Interoperable (R7) → Ecosystem (adoption density).

---

Standing rules: real-data-only (never synthetic data about a city) · non-destructive · main untouched · every phase independently verified before it is called complete.
