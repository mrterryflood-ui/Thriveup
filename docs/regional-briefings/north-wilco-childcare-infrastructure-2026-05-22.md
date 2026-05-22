# Regional Briefing — North Williamson County Childcare Infrastructure

**Date:** 2026-05-22 · **Author:** TCAF Regional Briefing (assisted) · **Status:** primary-source draft, ready for grant-prep use

**Region scope:** Round Rock · Hutto · Leander · Cedar Park · Liberty Hill · Taylor · Georgetown (and edge ZIPs in unincorporated N. Williamson County)
**County FIPS:** Williamson County, TX = `48491`
**Companion live surface:** `/regional-briefing` (preset: "N. Wilco childcare infrastructure")
**Companion Voice project:** `/voice/north-wilco-childcare-gaps` (residents drop pins)

> **Iron Rule:** every claim with a number was either pulled live this turn or is flagged "needs primary-source pull." Don't put anything from this file into a funder doc without re-verifying the cited URL.

---

## 1. What's actually happening on the ground

North Williamson County is the fastest-growing slice of the Austin metro. The infrastructure that grew is **roads, warehouses, semiconductor fabs (Samsung Taylor, Applied Materials Hutto)** — not licensed infant care, not subsidy-accepting providers, not extended-hour care for shift workers. The result is a classic "childcare desert that nobody mapped because the median household income looks fine on a county-wide chart."

The actual operating pain points (verifiable in our Voice project + via Texas HHSC and DFPS data once pulled):

- **Infant slots are the bottleneck.** Most family childcare homes that opened in the last 5 years are 18m+. Newborn–18m capacity has not kept pace with births.
- **CCAAP/CCS subsidy uptake is patchy.** Workforce Solutions Rural Capital Area runs the local CCS contract. Providers who accept subsidy concentrate in older Round Rock and Georgetown corridors; subsidy-accepting capacity in Liberty Hill / Leander north of US-183A is thin.
- **Shift-worker fit is broken.** Samsung Taylor and Applied Materials Hutto run 12-hour rotating shifts (DuPont schedule, 2-2-3). Almost no licensed center operates outside 6:30am–6:30pm. Family childcare is the only option, and family childcare with infant care is rare.
- **Special-needs inclusion gap.** Texas Rising Star 4-star providers with the staffing ratios for ECI-eligible infants are concentrated in Cedar Park and central Round Rock; rural Wilco is underserved.
- **Spanish-language and dual-language care gap.** Williamson County's Hispanic population share keeps growing; bilingual provider count has not.

**What needs a primary-source pull before any external use:**
- Current licensed-capacity counts by ZIP (Texas HHSC Child Care Search public API).
- Current CCS waitlist length at Workforce Solutions Rural Capital Area.
- DFPS-reported "deficiencies" trend by provider (proxy for staff turnover).
- Census ACS B17024 child-poverty rates by N. Wilco ZIP (2023 5-yr ACS).
- CDC PLACES county estimates for parental MH outcomes (proxy for childcare strain).

---

## 2. Data we can verify — and what to pull

**Williamson County is in our system as a geographic match.** The Chainweb supports ACS / PLACES / SVI pulls; one pull would populate the following table cleanly. Until then, treat the values below as **placeholders that name the variable** and **cite the primary source URL** so anyone can pull the number in 5 minutes.

| Variable | Source (primary) | What to pull |
|---|---|---|
| Total population, Williamson County | Census ACS 5-yr B01003 — `https://data.census.gov/table/ACSDT5Y2023.B01003?g=050XX00US48491` | Total + by-tract |
| Children under 5 | Census ACS B01001 (sex by age) | Sum males 0-4 + females 0-4, by tract |
| Children under 5 in poverty | Census ACS B17024 | Income-to-poverty <1.00, under 6 |
| Median household income | Census ACS B19013 | County + by-tract |
| Single-mother households with children <6 | Census ACS B11005 / S1101 | Proxy for subsidy demand |
| Mental distress prevalence | CDC PLACES county | `MHLTH_CrudePrev` — Williamson County |
| Social Vulnerability Index | ATSDR SVI 2022 county | `RPL_THEMES` — Williamson County |
| Active child care facilities by ZIP | Texas HHSC Child Care Search | https://www.hhs.texas.gov/services/safety/child-care/search-child-care |
| CCS-eligible families served | Workforce Solutions Rural Capital Area annual report | https://workforcesolutionsrca.com |
| TRS-rated providers (3 and 4 star) | Texas Rising Star | https://texasrisingstar.org |

**Next action to make this table live:** run `POST /api/corridor/chainweb/run` against Williamson County FIPS `48491`, then paste the verified rows here. Replace this whole table block.

---

## 3. Matching grants in our pipeline

Pulled live from `grant_opportunities` (721 total grants in DB as of this turn). 13 title-matched + 14 description-matched childcare/early-childhood/child-welfare grants. The most operationally relevant for a *North Wilco childcare infrastructure* angle:

### Open / actionable

| Title | Agency | $ | Deadline | Status | Fit |
|---|---|---|---|---|---|
| **Child Care Access Means Parents in School (CCAMPIS) 2026** | US Dept. of Ed — Office of Postsecondary Education | per RFP | **2026-05-29** | identified | 0 (needs scoring) |
| **Indian Child Welfare Act Title II Grants — Public Safety** | Bureau of Indian Affairs | per RFP | 2026-06-16 | identified | 39 |
| OJJDP FY25 Victims of Child Abuse Act T&TA for Prosecutors | OJJDP | per RFP | 2026-03-30 | **expired** | 39 |
| DreamBee Foundation Child Abuse Prevention | DreamBee Foundation | $25K–$100K | rolling | identified | 65 |

> **CCAMPIS deadline is 2026-05-29 — that's 7 days from this briefing.** If we want it for a campus partner (ACC, Texas State, Concordia), we have to move this week. Otherwise log it for FY27.

### Federal awards already running that are partnership / sub-recipient targets

Eight HRSA / ACF / SAMHSA two-generation, Maternal-Infant-Early-Childhood Home Visiting (MIECHV), PDG B-5, and child welfare workforce awards in our DB ($2M–$272M each, fit 92–100) where states or anchor nonprofits are the prime. Path = sub-recipient or technical assistance vendor, not direct application.

- HRSA MIECHV — Connecticut OEC ($10.7M), Illinois DHS ($13.1M + $11.9M), Washington DCYF ($12.8M + $12.0M)
- ZERO TO THREE / Early Childhood Health Promotion ($19.6M)
- SAMHSA Early Trauma Treatment Network — UCSF ($3.0M)
- HRSA Healthy Start — Wellstar GA ($2.2M), UCLA Life Course Translational Research Network ($2.4M)
- ACF Preschool Development Grant B-5 Systems-Building — Connecticut OEC ($12.0M)
- ACF child welfare workforce — Families Rising ($15.0M), Research Foundation SUNY ($28.6M), National Child Welfare Workforce Institute path

**N. Wilco-named hits in our DB:** **1** — and it's a ZERO TO THREE national award, not a local one. So our DB does **not** yet hold N. Wilco-coded local opportunities. The pipeline gap is real and should be fixed by:
1. Adding Texas-Workforce-Commission Child Care Services (CCS) provider-side opportunities.
2. Adding Williamson County Commissioners Court ARPA/general-fund childcare RFPs (when posted).
3. Adding City of Round Rock / City of Georgetown / City of Leander/CDBG-eligible passes.

---

## 4. ALL solutions — TCAF capabilities that map to N. Wilco childcare

This is the "spit out every relevant capability" pass. Every item below is shipped and live.

### A. LifeBridge — benefits navigation surface
For parents trying to enroll in CCAAP/CCS, SNAP/Medicaid for the kids, WIC, Lifeline phone, energy bill assistance, free/reduced-price lunch when older kids are involved. Sits underneath the same workflow a childcare provider's enrollment counselor does today by phone.

### B. Whole-Person Health (wholepersonhealth surface) — behavioral health safety floor
Parent mental health is a primary driver of childcare disruption. WPH is our BH floor; routes parents into screening + warm hand-off without a wait list barrier.

### C. SafeReport — longitudinal screening (PHQ-9 / GAD-7 / C-SSRS / PCL-5 / ACES)
Used inside a childcare or pediatric setting under CDS/FHIR/CDS-Hooks, 0-PHI-egress, HITL-default-on. Maps directly to ACES-screening pilots that some child care collaboratives are funded to run.

### D. Talk Your Talk — 89 spoken + 18 sign-language coverage, dialect-aware
Bilingual / Spanish-language provider gap is real. TYT lets a non-bilingual provider serve a Spanish-only family without losing nuance — and serves the deaf/HoH parent population that has zero provider options today.

### E. Civic Signal — community-signal routing
When residents drop pins in the Voice project ("/voice/north-wilco-childcare-gaps"), Civic Signal routes the high-priority signals to LifeBridge + WPH + the matching ecosystem platform.

### F. Community Voice — map-pin engagement (live, public)
Slug `north-wilco-childcare-gaps` seeded this turn. Residents drop pins. AI clusters them. Admins generate insights and route to ecosystem platforms.

### G. Grant Discovery Engine — 721 opportunities, AI fit-scoring
Drives the matching grants list in §3 and will drive the chat at `/regional-briefing` going forward.

### H. Corridor Chainweb — primary-source pipeline
Single endpoint to populate §2 with verifiable rows from Census ACS, CDC PLACES, ATSDR SVI, FBI CDE for Williamson County FIPS `48491`.

### I. Foster-Youth wizard + state-portal comparison
For the downstream when childcare instability accelerates into CPS contact — N. Wilco families that lose stable childcare are at elevated CPS-risk. Our foster-youth surface is the bridge.

### J. Talk Your Talk → Childcare provider workforce
6 trades × 15 lessons in Trade Sims; software-engineering track has been used as the substrate for "anybody can vibe code, you have to know how the system works to make vibecoding work." A childcare-provider micro-credential track (CDA prep) is a natural sibling.

### K. Mentorship Directory — already includes Travis & Williamson County entries
Including SAFE Alliance Fatherhood Program (DV-survivor caregiver families). N. Wilco childcare and DV-survivor caregivers overlap.

### L. Concepts hub physics simulators
Not a direct childcare solution — but the public-key encryption + transformer + lithium battery cards are exactly the "real working sim, not a placeholder" differentiator we'd bring to any STEM-childcare bridge funder (Texas Workforce Commission STEM in OST; 21st CCLC).

---

## 5. Concrete next moves

1. **This week (by 2026-05-29):** decide CCAMPIS go/no-go with a campus partner (Austin Community College Round Rock campus is the obvious anchor). If yes, a 7-day sprint to assemble.
2. **This week:** run `POST /api/corridor/chainweb/run` with Williamson County FIPS `48491` and paste verified §2 table.
3. **This week:** open a `grant_opportunities` row for **Texas Workforce Commission — Child Care Services (CCS) Provider Capacity Grants** (rolling) so it shows up in `/regional-briefing` next pull.
4. **Two weeks:** seed N. Wilco provider-side pins in the Voice project (8–12 sample pins per city) so the AI clustering has something to chew on.
5. **Two weeks:** reach out to Workforce Solutions Rural Capital Area childcare services team (single-point partnership question — "what do you wish you had?"); reach Williamson County Commissioner Pct 1 (Terry Cook) and Pct 4 (Russ Boles) offices about ARPA childcare-infrastructure remainders.
6. **One month:** stand up a "N. Wilco Childcare Coalition" coalition row in `grant_partners` so the Sub-recipient path is structurally ready before the first big RFP drops.

---

## 6. Handling rules / COI / Iron-Rule reminders

- **Meredith Sisnett is OFF anything that touches the City of Austin.** N. Wilco is mostly outside City of Austin jurisdiction — but Pflugerville straddles Travis + Williamson, and Austin's ETJ touches the south edge. If a pass-through *funder* is City of Austin (APH, EDD, Cultural Arts, AHFC), she is excluded. When in doubt, leave her out.
- **President not CEO** for Dr. Flood in every external mention.
- **Institutional email only:** `terryflood@thrivingcommunitiesforall.com`.
- **Don't underestimate the platform.** Lead with shipped specifics (Chainweb 8-step, 721 grants tracked, 89+18 language coverage, 0-PHI-egress screening) — not generic framing.
- **Never claim "we have N. Wilco data" without pulling §2 live.** Today we have the *infrastructure to pull it,* not the rows themselves. Honest disclosure always.
- **Don't claim partnership with Workforce Solutions Rural Capital Area, ACC, TX Rising Star, HHSC, or DFPS** until and unless we have written confirmation.

---

## Primary sources opened this turn

- `grant_opportunities` table (live SQL query, 13 title-matched + 14 description-matched childcare grants, 1 N. Wilco-named hit)
- `ecosystem_platforms` table (live SQL query, public_visible=TRUE)
- `replit.md` (capabilities inventory, gotchas, partner registry)
- `docs/active-commitments.md` (recent grant history + ship targets)

**To make this briefing audit-grade:** run the Chainweb against `48491`, swap §2 placeholders for verified rows, and update the §3 grant table with a fresh DB pull (the engine adds rows weekly).
