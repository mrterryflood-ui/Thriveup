# Rosendin Foundation — Concept Paper (DRAFT v0.1)

**Applicant:** The Collaborative Advocate Foundation (TCAF) d/b/a ThriveUp Academy
**EIN:** 41-3618003 · **UEI:** KDDVD1FGLW35 · **CAGE:** 209N1
**501(c)(3) status:** Determined 01/14/2026 (Letter 947) · Public charity 170(b)(1)(A)(vi)
**Address:** 17912 Stefano Drive, Pflugerville, TX 78660-7020
**Primary contact:** Terry D. Flood Sr., President — terryflood@thrivingcommunitiesforall.com
**Deadline:** 2026-05-31 (per OneStar Foundation TX funder roundup 2026-05-19 — primary source not yet verified at funder site)
**Drafted:** 2026-05-19 · **Status:** DRAFT — pending primary-source verification of budget cap, page limit, application format, and required attachments at `rosendinfoundation.org`

> **⚠️ Iron Rule note for the user:** This concept paper is built from the program description in the OneStar Foundation TX funder roundup forwarded 2026-05-19. Before submission, open `rosendinfoundation.org` directly, confirm (a) request range, (b) page or word limit, (c) eligibility statement, (d) required attachments (990, IRS determination, board list, etc.), and (e) submission portal/format. Adjust this draft accordingly.

---

## Program fit summary

The Rosendin Foundation funds nonprofits running **emotional, nutritional, and occupational health programs** in Texas markets that explicitly include **Austin, Coppell, Fort Worth, Pflugerville, San Antonio, and Temple**. TCAF is headquartered in Pflugerville and operates a Travis County (Austin-area) implementation pilot, placing us inside two named eligible cities at once.

The Rosendin program description maps directly onto three TCAF service platforms already in production:

| Rosendin priority | TCAF platform | Status |
|---|---|---|
| Emotional health | **Whole-Person Health (mentalwellnesssupport.net)** + **SafeReport (safereports.net)** — CDS Hooks + FHIR + 0-PHI-egress clinical screening with PHQ-9, GAD-7, C-SSRS, PCL-5, ACEs; HITL default on; longitudinal monitoring | Live |
| Occupational health | **Mission Transition (M2C)** + **Trade Sims (90 lessons across 6 trades, 7th in build)** + **Talk Your Talk (89 spoken + 18 sign + 6 learning surfaces)** language-coverage layer for LEP workers | Live |
| Nutritional health | **Sankofa Network** + **LifeBridge** SDOH/benefits navigation that includes food-security routing (SNAP, WIC, community food access) | Live |

We do not run a freestanding nutritional-health program; the nutritional prong is met through SDOH/benefits navigation and food-access routing. We will be honest about that distinction in the narrative rather than dress it up.

---

## Proposed project (one paragraph)

**Whole-Person Health Access — Pflugerville + Austin Pilot.** Over 12 months, TCAF will deliver an integrated emotional-and-occupational health access program to 400 adults and youth across Pflugerville and Austin. The program braids three components: (1) **clinical-grade behavioral screening** at community partner sites using SafeReport (PHQ-9 / GAD-7 / C-SSRS / PCL-5 / ACEs) with HITL clinician review, no PHI egress, and longitudinal follow-up; (2) **occupational pathway placement** via Mission Transition (veteran and second-chance workforce) and Trade Sims (electrical, plumbing, HVAC, welding, automotive, software engineering — apprenticeship-aligned); (3) **SDOH stabilization** through LifeBridge benefits navigation including food security, housing, transportation, and utility assistance — the floor that has to be in place before behavioral and occupational interventions stick. Talk Your Talk provides language access in 89 spoken languages plus 18 signed languages, dialect-aware (AAVE, Spanglish) and RTL-capable for Arabic — directly addressing AISD's documented 28.1% LEP student population and the broader regional LEP workforce.

---

## Why TCAF — capability proof, not aspiration

These platforms are not concept slides. Verified as of 2026-05-17 (`docs/grants/tcaf-capabilities-inventory-2026-05-17.md`):

- 271 production Drizzle tables · 211 frontend pages · 84 server modules
- 39 CFIR implementation-science constructs operationalized (RPLICE bridge, MAP-GAP continuous quality improvement, 1,705 LOC)
- 86-chunk RAG knowledge layer
- 648 tracked grant opportunities (671 as of 2026-05-19) with tier-weighted AI fit-scoring
- FHIR + CDS Hooks behavioral-health stack (SafeReport)
- 8-step Corridor Chainweb citation-chained evidence pipeline pulling Census ACS, CDC PLACES, ATSDR SVI 2022, FBI Crime Data Explorer — every fact written to evidence storage cites its primary-source step (the machine-checkable Iron Rule layer under Community Voice)
- Community Voice platform live since 2026-05-18: map-pin → AI-cluster → ecosystem-route → public story, with pilot in Pflugerville Holistic Services

---

## Population served and equity frame

**Geographic:** Pflugerville (HQ) and Austin/Travis County (pilot site). Both named in Rosendin eligibility.

**Equity:** Travis County's eastern crescent — the historically Black corridor from East 12th Street through Pflugerville's Heatherwilde/Pecan branch — is documented through our Corridor Chainweb against Census B01001B (Black population), B17001B (Black poverty), B11003B (Black family structure), CDC PLACES (mental health prevalence), and ATSDR SVI 2022. This is not a paragraph; it is a running data pipeline. We will share the live evidence at any site visit.

**Languages:** 89 spoken + 18 sign + 6 learning surfaces. Dialect-aware. No participant turned away for language.

**Scale realism:** 400 adults and youth across 12 months — a defensible Year 1 pilot, not a 10,000-person promise. We are early-stage as an IRS-determined 501(c)(3) (01/14/2026) and we will not overpromise.

---

## Budget framing (placeholder pending Rosendin request-range confirmation)

| Category | Year 1 |
|---|---|
| Personnel (1.0 FTE program lead, 0.5 FTE behavioral-health navigator, 0.5 FTE workforce navigator) | TBD |
| Participant direct services (screenings, navigation incentives, transit, language interpretation) | TBD |
| Platform licensing + secure hosting (SafeReport HIPAA infrastructure, TCAF cloud) | TBD |
| Evaluation (RE-AIM-aligned, CFIR-constructed, MAP-GAP CQI) | TBD |
| Indirect (10% de minimis, federally negotiable) | TBD |
| **Total request** | **TBD — confirm Rosendin typical range first** |

> **Iron Rule:** I am not writing a dollar number until you confirm Rosendin's typical request range from the funder site or prior 990-PF.

---

## Evaluation and reporting

- **Reach:** unique participants screened, screened-positive routed to care, occupational pathway placements, SDOH cases closed.
- **Effectiveness:** PHQ-9 / GAD-7 score change over 6 months among screened-positive participants engaged in care; Trade Sims lesson completion → certification → apprenticeship placement; benefits-claims approval rate via LifeBridge.
- **Adoption:** site partner count, monthly active screening locations, language-pair distribution.
- **Implementation:** CFIR constructs tracked (Inner Setting Readiness, Outer Setting Local Conditions, Process Engaging, Intervention Adaptability), MAP-GAP CQI cycles per quarter.
- **Maintenance:** 12-month participant follow-up via Whole-Person Health longitudinal cohort.

Reports delivered quarterly, with one mid-year site visit offered to Rosendin program staff.

---

## Disclosures (Iron Rule — partnership status truth-in-claims)

- **TCAF is the sole applicant.** We are not naming partner organizations on this concept paper that we have not confirmed by written commitment.
- **Mission Transition partner outreach** in Central Texas is in-flight via the live build at `vetmissiontransition.com` (separate codebase). Not yet a formal MOU.
- **No funder relationship history with Rosendin.** This would be a first-time relationship.
- **Two-entity strategy disclosed if asked:** TCAF (501(c)(3), this application) and ISS LLC (Dr. Flood's for-profit, federal SBIR/STTR vehicle only — not relevant here).
- **Board governance disclosed if asked.**

---

## Next steps if invited to full proposal

1. Confirm 3 community partner sites (likely candidates: an Austin/Travis County FQHC, a Pflugerville faith community, a workforce board partner).
2. Refine budget against confirmed Rosendin range.
3. Add letters of support and evaluation MOU.
4. Submit complete evaluation logic model (RE-AIM × CFIR × MAP-GAP).

---

**Word count of this concept paper:** ~950 (adjust to Rosendin's actual cap once confirmed).

**Submission package will additionally include (per funder requirements once verified):** IRS Determination Letter 947, FY26 board roster, FY25-26 organizational budget (`docs/grants/TCAF-Organizational-Budget-FY2025-2026.doc`), 990 or financial statement, leadership bios.
