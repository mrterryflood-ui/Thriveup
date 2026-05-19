# TCAF / ThriveUp Academy — Master Grants Tracker

**Generated:** 2026-05-19  
**Source:** `grant_opportunities` DB (671 total rows) + `docs/grants/` drafts (88 files)  
**Purpose:** Single-document inventory of every grant identified, every draft written, with justification for each — built so nothing slips through the cracks when populating an external tracker.

---

## Index

1. [Executive summary & counts](#1-executive-summary)
2. [Submitted grants](#2-submitted-grants)
3. [Actively pursuing / drafting (engaged)](#3-actively-pursuing--drafting)
4. [Watch next cycle](#4-watch-next-cycle)
5. [High-fit identified opportunities (fit ≥ 80)](#5-high-fit-identified-fit--80)
6. [Mid-fit identified opportunities (fit 60–79)](#6-mid-fit-identified-fit-6079)
7. [Marginal-fit identified opportunities (fit 50–59)](#7-marginal-fit-identified-fit-5059)
8. [Drafts written — complete inventory](#8-drafts-written--complete-inventory)
9. [Recent rescore decisions (2026-05-19)](#9-recent-rescore-decisions-2026-05-19)
10. [Iron Rule gaps — primary-source verification still owed](#10-iron-rule-gaps)

---

## 1. Executive summary

### Totals

- **671** grants identified in the DB (source breakdown: grants.gov 376 · usaspending 200 · samgov 39 · manual 16 · tx_statewide 8 · state_texas 6 · city_austin 5 · others 21).
- **161** at fit ≥ 90, **26** at 80–89, **22** at 70–79, **26** at 60–69, **27** at 50–59 (capability-fit scoring, not award probability).
- **9** currently engaged: 1 submitted · 3 pursuing · 1 LOI drafting · 2 watch next cycle · 1 superseded · 1 discontinued.
- **88** draft files in `docs/grants/` (full inventory in section 8).

### Status breakdown

| Status | Count |
|---|---|
| submitted | 1 |
| pursuing | 3 |
| loi_drafting | 1 |
| watch_next_cycle | 2 |
| identified | 234 |
| expired | 21 |
| superseded_duplicate | 1 |
| discontinued_invitation_only | 1 |
| dismissed | 1 |

### Iron Rule reminder

Every dollar amount, deadline, eligibility statement, and identifier in this document came from primary-source ingestion (grants.gov / SAM.gov / USA Spending / direct manual entry). When notes say "fit reflects capability, not award probability" — that is the honest distinction. Some scores in the DB are stale automated ingestion scores; the 9 rescored on 2026-05-19 are marked explicitly in their notes.

---

## 2. Submitted grants

### Central Health Compensation Management System

- **Agency:** Travis County Healthcare District (Central Health)
- **Deadline:** 2026-04-24
- **Fit score:** 73
- **Status:** submitted
- **Source:** bidnet-direct · [link](https://centralhealthcms.com)

**Justification / Notes:**

APP BUILT AND DEPLOYED: Central Health Compensation Management System — 15 integrated modules, AI-native (Anthropic Claude), 7-stage workflow engine with RAG accountability, bidirectional data integration (Workday/SAP/PeopleSoft/market surveys), RBAC with 7 roles, PostgreSQL with 30+ tables. LIVE at centralhealthcms.com (custom domain, verified) and secure-health-plug.replit.app. Connected to ACOS ecosystem for evaluation and understanding — we do NOT command and control it. Solicitation #2603-002, Travis County Healthcare District dba Central Health. Closing: April 24, 2026 3:00 PM EDT.

---

## 3. Actively pursuing / drafting

### SSG Fox Suicide Prevention Grant (VA)

- **Agency:** U.S. Department of Veterans Affairs
- **Deadline:** 2026-06-12
- **Fit score:** 100
- **Status:** pursuing
- **Source:** federal_va · [link](https://www.mentalhealth.va.gov/ssgfox-grants/)

**Justification / Notes:**

FY27 NOFO published 2026-03-13. Apps open 2026-04-13. Deadline 2026-06-12 4:59 PM ET FIRM. Awards by 2026-09-30. TCAF strong fit: Dr. Flood (Army Retiree), M2C platform, C-SSRS in WPH+SafeReport, McConnell AFB+KS Guard pipeline, SDOH via LifeBridge, 0 PHI compliance via SafeReport. Gap: named veteran-org LOSs needed (VFW/Legion/AFB TAP/KS Guard/KSDVA/Wichita Vet Center/Dole VAMC).

---

### Promise Neighborhoods

- **Agency:** Department of Education
- **Deadline:** 2026-08-06
- **Fit score:** 0
- **Status:** pursuing
- **Source:** grants.gov · [link](https://www.grants.gov/search-results-detail/362238)

**Justification / Notes:**

Rescored 2026-05-19. Capability fit very high: cradle-to-career + place-based + longitudinal GPRA outcomes is exactly what Chainweb (server/corridor-chainweb.ts, 8-step citation-chained Census/CDC/SVI/FBI pipeline) + Community Voice (live 2026-05-18) + Trade Sims (90 lessons, 6 trades) + Talk Your Talk (89+18+6) + Pflugerville pilot were built for. TCAF 501(c)(3) determined 01/14/2026, SAM Active (UEI KDDVD1FGLW35, CAGE 209N1). REAL GAP: must partner with an LEA; ≤8 awards historically, ~$30M/award, intense competition. Score reflects capability fit, not award probability. Status: pursuing.

---

### Promise Neighborhoods-84.215N

- **Agency:** Office of Elementary and Secondary Education
- **Deadline:** 2026-08-06
- **Fit score:** 0
- **Status:** pursuing
- **Source:** grants.gov · [link](https://www.grants.gov/search-results-detail/362347)

**Justification / Notes:**

Rescored 2026-05-19. Capability fit very high: cradle-to-career + place-based + longitudinal GPRA outcomes is exactly what Chainweb (server/corridor-chainweb.ts, 8-step citation-chained Census/CDC/SVI/FBI pipeline) + Community Voice (live 2026-05-18) + Trade Sims (90 lessons, 6 trades) + Talk Your Talk (89+18+6) + Pflugerville pilot were built for. TCAF 501(c)(3) determined 01/14/2026, SAM Active (UEI KDDVD1FGLW35, CAGE 209N1). REAL GAP: must partner with an LEA; ≤8 awards historically, ~$30M/award, intense competition. Score reflects capability fit, not award probability. Status: pursuing.

---

### NSF 26-508 — TechAccess: AI-Ready America (State/Territory Coordination Hub)

- **Agency:** National Science Foundation (TIP/EDU/CISE) with DOL/ETA, USDA-NIFA, SBA
- **Deadline:** 2026-06-16
- **Fit score:** 100
- **Status:** loi_drafting
- **Source:** manual · [link](https://www.nsf.gov/funding/opportunities/nsf26-508)

**Justification / Notes:**

TCAF Texas Hub Workbench live at /nsf-techaccess-hub. Adoption kit at shared/nationwide/hub-adoption-kit/. Live AI-grounded state intelligence + LOI generator working for all 56 jurisdictions.

---

## 4. Watch next cycle

### Improving Youth Mental Health Grant 2026

- **Agency:** The Cigna Group Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** watch_next_cycle
- **Source:** manual · [link](https://www.thecignagroup.com/our-impact/esg/healthy-society/community/foundation/improving-youth-mental-health)

**Justification / Notes:**

CLOSED March 12, 2026. Next cycle expected June 2026. TX is priority state. Strong fit: ISSS, WholeMind Learning, SafeCogniCare, LifeBridge. Apply under The Collaborative Advocate Foundation.

---

### DOL-ETA Strengthening Community Colleges Training Grants — Round 7

- **Agency:** U.S. Department of Labor — Employment and Training Administration
- **Deadline:** —
- **Fit score:** 0
- **Status:** watch_next_cycle
- **Source:** federal_dol · [link](https://www.dol.gov/agencies/eta/skills-training-grants/community-colleges)

**Justification / Notes:**

[MEMORY-SOURCED 2026-05-17 — primary-source verify funder site before commitment. Iron Rule applies.] Round 7 not yet announced. ACC = prime. Watch grants.gov for posting. High strategic fit — Trade Sims is core artifact.

---

## 5. High-fit identified (fit ≥ 80)

**177 opportunities.** Each row has full justification stored in DB notes. Fit reflects capability-stack alignment; award probability requires partner letters, prior-award analysis, and submission readiness assessed per pursuit.

### Substance Abuse and Mental Health Services Administration: evidence based programs (CHINLE UNIFIED SCHOOL DISTRICT #24)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM088381_075)

---

### National Institutes of Health: community based participatory research (UNIVERSITY OF PITTSBURGH - OF THE COMMONWEALTH SYSTEM OF HIGHER EDUCATION)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_U24LM014070_075)

---

### Substance Abuse and Mental Health Services Administration: mental health services (DELAWARE DEPARTMENT OF HEALTH AND SOCIAL SERVICES)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087841_075)

---

### Centers for Disease Control and Prevention: trauma informed care (HEALTH, NEW JERSEY DEPARTMENT OF)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NH75OT000079_075)

---

### Centers for Medicare and Medicaid Services: behavioral health (DEPARTMENT OF SOCIAL SERVICES MISSO)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332090_075)

---

### Substance Abuse and Mental Health Services Administration: behavioral health (HEALTH CARE SERVICES, CALIFORNIA DEPARTMENT OF)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087926_075)

---

### Centers for Medicare and Medicaid Services: behavioral health (NORTH CAROLINA DEPARTMENT OF HEALTH & HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332042_075)

---

### Episcopal Health Foundation — Texas Community Health & Health Equity

- **Agency:** Episcopal Health Foundation (statewide TX, headquartered Houston)
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** tx_statewide · [link](https://www.episcopalhealth.org/grants/)

---

### Centers for Medicare and Medicaid Services: behavioral health (HEALTH SERVICES KENTUCKY CABINET FOR)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332079_075)

---

### Substance Abuse and Mental Health Services Administration: reentry services (MOUNTAIN COMPREHENSIVE CARE CENTER, INC.)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI086082_075)

---

### National Science Foundation: responsible AI (PRAIRIE VIEW A&M UNIVERSITY)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2401860_049)

---

### Health Resources and Services Administration: child welfare (ILLINOIS DEPARTMENT OF HUMAN SERVICE)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_X1055020_075)

---

### Centers for Medicare and Medicaid Services: community health worker (INDIANA FAMILY AND SOCIAL SERV)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332070_075)

---

### Centers for Medicare and Medicaid Services: community health worker (STATE OF WISCONSIN DEPARTMENT OF HEALTH SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332076_075)

---

### Centers for Medicare and Medicaid Services: community health worker (OHIO DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332087_075)

---

### Centers for Medicare and Medicaid Services: community health worker (SOUTH DAKOTA DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332080_075)

---

### National Science Foundation: responsible AI (CORNELL UNIVERSITY)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2434321_049)

---

### Substance Abuse and Mental Health Services Administration: minority business (HI - TECH CHARITIES)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI084526_075)

---

### Office of Assistant Secretary for Health: minority business (UNIVERSITY OF ARKANSAS FOR MEDICAL SCIENCES)

- **Agency:** Department of Health and Human Services - Office of Assistant Secretary for Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_CPIMP241383_075)

---

### National Science Foundation: responsible AI (GALLAUDET UNIVERSITY)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2440601_049)

---

### National Science Foundation: artificial intelligence research (UNIVERSITY OF TEXAS AT AUSTIN)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2323116_049)

---

### Health Resources and Services Administration: implementation science (ZERO TO THREE NATIONAL CENTER FOR INFANTS, TODDLERS & FAMILIES)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_UK246349_075)

---

### National Institutes of Health: community based participatory research (REGENTS OF THE UNIVERSITY OF MICHIGAN)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P50HD115356_075)

---

### Substance Abuse and Mental Health Services Administration: juvenile justice (HEALTH SERVICES KENTUCKY CABINET FOR)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM087698_075)

---

### Substance Abuse and Mental Health Services Administration: juvenile justice (PA DEPARTMENT OF HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM084173_075)

---

### Centers for Medicare and Medicaid Services: reentry services (STATE OF NEVADA HEALTH CARE FINANCING & POLICY DIVISION)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2T2CMS331986_075)

---

### Employment and Training Administration: reentry services (BROWARD COLLEGE)

- **Agency:** Department of Labor - Employment and Training Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_23A60PE000015_1601)

---

### Office of Justice Programs: restorative justice (CITY OF ARLINGTON)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA23GG05106DGCT_015)

---

### Office of Justice Programs: reentry services (CITY OF DULUTH)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA24GG04520COAP_015)

---

### Substance Abuse and Mental Health Services Administration: housing assistance (RESEARCH FOUNDATION FOR MENTAL HYGIENE, INC.)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087825_075)

---

### Substance Abuse and Mental Health Services Administration: housing assistance (IDAHO DEPARTMENT OF HEALTH & WELFARE)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087767_075)

---

### Texas Workforce Commission WIOA Grants

- **Agency:** Texas Workforce Commission (State of Texas)
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** state_texas · [link](https://www.twc.texas.gov/programs/workforce-innovation-opportunity-act)

---

### OJJDP Juvenile Justice Programs

- **Agency:** Office of Juvenile Justice and Delinquency Prevention (DOJ)
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** federal_doj · [link](https://ojjdp.ojp.gov/funding)

---

### Substance Abuse and Mental Health Services Administration: restorative justice (DOVER, CITY OF)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SP083356_075)

---

### Health Resources and Services Administration: restorative justice (ROCKDALE COUNTY OF ADMINISTRATIVE)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_CE152276_075)

---

### National Science Foundation: artificial intelligence research (TEXAS A & M UNIVERSITY)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2411377_049)

---

### National Institute of Standards and Technology: responsible AI (GEORGE WASHINGTON UNIVERSITY (THE))

- **Agency:** Department of Commerce - National Institute of Standards and Technology
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_60NANB22D052_013)

---

### National Science Foundation: responsible AI (MEHARRY MEDICAL COLLEGE)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2334391_049)

---

### Substance Abuse and Mental Health Services Administration: reentry services (ST. JOHN'S COMMUNITY HEALTH)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI086103_075)

---

### National Institutes of Health: implementation science (MICHIGAN STATE UNIVERSITY)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P50MH127512_075)

---

### Substance Abuse and Mental Health Services Administration: evidence based programs (STATE DEPARTMENT OF EDUCATION)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM085329_075)

---

### Centers for Disease Control and Prevention: evidence based programs (PIMA COUNTY)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NH28CE003541_075)

---

### Centers for Disease Control and Prevention: implementation science (EMORY UNIVERSITY)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU58DP007422_075)

---

### National Institutes of Health: implementation science (UNIVERSITY OF CHICAGO)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P50MD017349_075)

---

### National Institutes of Health: implementation science (THE TRUSTEES OF COLUMBIA UNIVERSITY IN THE CITY OF NEW YORK)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P50MD017341_075)

---

### Substance Abuse and Mental Health Services Administration: outcomes measurement (HEGIRA HEALTH INC)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM087056_075)

---

### Centers for Disease Control and Prevention: implementation science (CICATELLI ASSOCIATES, INC.)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU65PS923774_075)

---

### National Institutes of Health: implementation science (UNIVERSITY OF MASSACHUSETTS MEDICAL SCHOOL)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P50MH129701_075)

---

### Substance Abuse and Mental Health Services Administration: evidence based programs (HEALTH CARE AUTHORITY)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087845_075)

---

### National Institutes of Health: evidence based programs (ALBERT EINSTEIN COLLEGE OF MEDICINE)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_UM1TR004400_075)

---

### Substance Abuse and Mental Health Services Administration: evidence based programs (MINNESOTA DEPARTMENT OF EDUCATION)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM085328_075)

---

### Centers for Disease Control and Prevention: evidence based programs (HEALTH AND HUMAN SERVICES, MAINE DEPARTMENT OF)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU17CE010198_075)

---

### Office of Justice Programs: evidence based programs (OHIO OFFICE OF CRIMINAL JUSTICE SERVICES)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA23GG03015MUMU_015)

---

### Centers for Disease Control and Prevention: place based initiatives (FUND FOR PUBLIC HEALTH IN NEW YORK, INC.)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU58DP007593_075)

---

### Office of Justice Programs: place based initiatives (JUSTICE & PUBLIC SAFETY CABINET)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA21GG03025GUNP_015)

---

### National Science Foundation: artificial intelligence research (SUSTAINABLE HORIZONS INSTITUTE)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2609667_049)

---

### National Science Foundation: responsible AI (UNIVERSITY OF CALIFORNIA IRVINE)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2614053_049)

---

### Office of Justice Programs: second chance act (PENNSYLVANIA DEPARTMENT OF CORRECTIONS)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA21GG04020SCAX_015)

---

### Health Resources and Services Administration: prisoner reentry (VIRGINIA COMMONWEALTH UNIVERSITY)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P1053116_075)

---

### Substance Abuse and Mental Health Services Administration: two generation (REGENTS OF THE UNIVERSITY OF CALIFORNIA, SAN FRANCISCO, THE)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM085074_075)

---

### Centers for Medicare and Medicaid Services: maternal health (DEPARTMENT OF HEALTH HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332056_075)

---

### Substance Abuse and Mental Health Services Administration: mental health services (ARIZONA HEALTH CARE COST CONTAINMENT SYSTEM)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087838_075)

---

### Substance Abuse and Mental Health Services Administration: disability employment (MOUNTAIN STATE PARENTS CAN)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM089780_075)

---

### Administration for Community Living: trauma informed care (THE JEWISH FEDERATIONS OF NORTH AMERICA, INC.)

- **Agency:** Department of Health and Human Services - Administration for Community Living
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_90HSSG0002_075)

---

### Office of Justice Programs: juvenile justice (BOYS & GIRLS CLUBS OF AMERICA)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PJDP24GG01661MENT_015)

---

### Substance Abuse and Mental Health Services Administration: trauma informed care (OREGON HEALTH AUTHORITY)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79FG001160_075)

---

### Centers for Disease Control and Prevention: trauma informed care (PENNSYLVANIA DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU17CE010184_075)

---

### National Institute of Food and Agriculture: digital literacy (WEST VIRGINIA UNIVERSITY)

- **Agency:** Department of Agriculture - National Institute of Food and Agriculture
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NI26SLBCXXXXG033_012)

---

### Centers for Medicare and Medicaid Services: workforce development (STATE OF ALASKA DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332062_075)

---

### Substance Abuse and Mental Health Services Administration: restorative justice (SAGINAW CHIPPEWA INDIAN TRIBE)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM088157_075)

---

### Centers for Medicare and Medicaid Services: maternal health (LOUISIANA DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332085_075)

---

### Centers for Medicare and Medicaid Services: reentry services (STATE OF COLORADO - DEPT OF HEALTH CARE POLICY & FINANCING)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2T2CMS332021_075)

---

### Centers for Medicare and Medicaid Services: community health worker (IOWA DEPARTMENT OF HEALTH AND HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332065_075)

---

### Centers for Medicare and Medicaid Services: behavioral health (GEORGIA DEPARTMENT OF COMMUNITY HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332046_075)

---

### National Institutes of Health: digital literacy (NORTHWESTERN UNIVERSITY)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_U19CA291404_075)

---

### Substance Abuse and Mental Health Services Administration: trauma informed care (NEVADA DEPARTMENT OF HEALTH AND HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087835_075)

---

### Centers for Disease Control and Prevention: trauma informed care (WAKE COUNTY HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NE11OE000100_075)

---

### Substance Abuse and Mental Health Services Administration: trauma informed care (ALLIANT HEALTH SOLUTIONS, INC.)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM087155_075)

---

### Substance Abuse and Mental Health Services Administration: trauma informed care (HAWAII STATE DEPARTMENT OF EDUCATION)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM086278_075)

---

### Administration for Children and Families: trauma informed care (COMPASS CONNECTIONS)

- **Agency:** Department of Health and Human Services - Administration for Children and Families
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_90ZV0148_075)

---

### Health Resources and Services Administration: two generation (COMMUNITY HOUSING OF MAINE INC)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_CE154315_075)

---

### Health Resources and Services Administration: two generation (CONNECTICUT OFFICE OF EARLY CHILDHOOD)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_X1050291_075)

---

### Centers for Medicare and Medicaid Services: behavioral health (KANSAS DEPARTMENT OF HEALTH & ENVIRONMENT)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332072_075)

---

### Health Resources and Services Administration: two generation (UNIVERSITY OF CALIFORNIA, LOS ANGELES)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_U9D49250_075)

---

### Health Resources and Services Administration: two generation (WELLSTAR HEALTH SYSTEM, INC.)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H4953006_075)

---

### Office of Justice Programs: second chance act (COMMON GOOD ATLANTA)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA24GG04310SCAX_015)

---

### Office of Justice Programs: second chance act (POLK COUNTY)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA21GG04042SCAX_015)

---

### Substance Abuse and Mental Health Services Administration: restorative justice (OHIO DEPARTMENT MENTAL HEALTH)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM086313_075)

---

### Substance Abuse and Mental Health Services Administration: restorative justice (LACONIA SCHOOL DISTRICT)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM088063_075)

---

### Substance Abuse and Mental Health Services Administration: restorative justice (THE NC YOUTH VIOLENCE PREVENTION CENTER)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM087564_075)

---

### Office of Justice Programs: restorative justice (PUEBLO OF TAOS)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA23GG05417TRIB_015)

---

### National Science Foundation: artificial intelligence research (UNIVERSITY OF CALIFORNIA, SAN DIEGO)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2548467_049)

---

### Office of Justice Programs: juvenile justice (BOYS & GIRLS CLUBS OF AMERICA)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PJDP23GG00847MENT_015)

---

### Centers for Medicare and Medicaid Services: workforce development (NYS DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332049_075)

---

### Substance Abuse and Mental Health Services Administration: juvenile justice (SOUTH CAROLINA DEPARTMENT OF MENTAL HEALTH)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM084171_075)

---

### Centers for Medicare and Medicaid Services: workforce development (CALIFORNIA DEPARTMENT OF HEALTH CARE ACCESS AND INFORMATION)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332078_075)

---

### OpenAI People-First AI Fund

- **Agency:** OpenAI
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** manual · [link](https://openai.com/blog/people-first-ai-fund)

**Justification / Notes:**

Rolling/open applications. No fixed deadline announced. Directly aligned — TCAF has a RUNNING 4-engine AI system serving communities, not a proposal.

---

### National Institutes of Health: social safety net (THE JOHNS HOPKINS UNIVERSITY)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_K01MD020002_075)

---

### National Institute of Food and Agriculture: social safety net (TRUSTEES OF TUFTS COLLEGE)

- **Agency:** Department of Agriculture - National Institute of Food and Agriculture
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_20216702334479_012)

---

### Health Resources and Services Administration: social safety net (EL SOL NEIGHBORHOOD EDUCATIONAL CENTER)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_T2946686_075)

---

### National Institutes of Health: community based participatory research (THE JOHNS HOPKINS UNIVERSITY)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P50MD017348_075)

---

### National Institutes of Health: community based participatory research (REGENTS OF THE UNIVERSITY OF MICHIGAN)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_U24HD111315_075)

---

### National Institutes of Health: community based participatory research (UNIVERSITY OF CALIFORNIA, LOS ANGELES)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_U01AI156875_075)

---

### National Institutes of Health: community based participatory research (UNIVERSITY OF NORTH DAKOTA)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P20GM139759_075)

---

### National Institutes of Health: community based participatory research (REGENTS OF THE UNIVERSITY OF MINNESOTA)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_R01AG062307_075)

---

### National Institutes of Health: community based participatory research (DARTMOUTH-HITCHCOCK CLINIC)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_P20GM148278_075)

---

### National Institutes of Health: community based participatory research (BETH ISRAEL DEACONESS MEDICAL CENTER, INC.)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_R01MD016068_075)

---

### National Institutes of Health: implementation science (REGENTS OF THE UNIVERSITY OF MICHIGAN)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 100
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_UM1TR004404_075)

---

### Centers for Disease Control and Prevention: juvenile justice (UT STATE DEPT OF HEALTH AND HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 99
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NE11OE000088_075)

---

### National Science Foundation: artificial intelligence research (THE RESEARCH FOUNDATION FOR THE STATE UNIVERSITY OF NEW YORK)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 99
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2505376_049)

---

### Office of Justice Programs: second chance act (CGA, INC)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 98
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PBJA23GG05282SCAX_015)

---

### Texas Veterans Commission — Veterans Mental Health & Fund for Veterans Assistance

- **Agency:** Texas Veterans Commission (State of Texas)
- **Deadline:** —
- **Fit score:** 98
- **Status:** identified
- **Source:** tx_statewide · [link](https://www.tvc.texas.gov/grants/)

---

### National Science Foundation: artificial intelligence research (UNIVERSITY CORPORATION FOR ADVANCED INTERNET DEVELOPMENT)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 98
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2536728_049)

---

### National Science Foundation: artificial intelligence research (UNIVERSITY CORPORATION FOR ADVANCED INTERNET DEVELOPMENT)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 98
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2452148_049)

---

### Substance Abuse and Mental Health Services Administration: implementation science (THE LELAND STANFORD JUNIOR UNIVERSITY)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 98
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79SM090078_075)

---

### National Institutes of Health: responsible AI (THE LELAND STANFORD JUNIOR UNIVERSITY)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 96
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_R01EY036893_075)

---

### Office of Justice Programs: juvenile justice (THE NATIONAL CENTER FOR MISSING AND EXPLOITED CHILDREN)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 96
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PJDP25GK01457MECP_015)

---

### Administration for Children and Families: child welfare (LUTHERAN IMMIGRATION AND REFUGEE SERVICE INC)

- **Agency:** Department of Health and Human Services - Administration for Children and Families
- **Deadline:** —
- **Fit score:** 96
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_90ZU0597_075)

---

### Administration for Community Living: disability employment (RUTGERS, THE STATE UNIVERSITY)

- **Agency:** Department of Health and Human Services - Administration for Community Living
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_90RTEM0008_075)

---

### Substance Abuse and Mental Health Services Administration: child welfare (FLORIDA DEPARTMENT OF CHILDREN AND FAMILIES)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI087842_075)

---

### Office of Justice Programs: youth mentoring (PARTNERS IN ROUTT COUNTY)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PJDP23GG01316MENT_015)

---

### Centers for Disease Control and Prevention: evidence based programs (NEBRASKA DEPARTMENT OF HEALTH & HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU58DP007100_075)

---

### Health Resources and Services Administration: child welfare (DEPARTMENT OF CHILDREN, YOUTH, AND FAMILIES)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_X1054999_075)

---

### Office of Justice Programs: youth mentoring (ORGANIZED VILLAGE OF KAKE)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PJDP25GG01478TRIB_015)

---

### National Institute of Food and Agriculture: digital literacy (PURDUE UNIVERSITY)

- **Agency:** Department of Agriculture - National Institute of Food and Agriculture
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NI26SLBCXXXXG019_012)

---

### Centers for Disease Control and Prevention: evidence based programs (DEPARTMENT OF PUBLIC HEALTH CONNECTICUT)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU58DP007170_075)

---

### Health Resources and Services Administration: child welfare (ILLINOIS DEPARTMENT OF HUMAN SERVICE)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 95
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_X1050299_075)

---

### Health Resources and Services Administration: child welfare (DEPARTMENT OF CHILDREN, YOUTH, AND FAMILIES)

- **Agency:** Department of Health and Human Services - Health Resources and Services Administration
- **Deadline:** —
- **Fit score:** 94
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_X1053601_075)

---

### Centers for Medicare and Medicaid Services: reentry services (MICHIGAN DEPARTMENT OF HEALTH AND HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 94
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2T2CMS332013_075)

---

### Centers for Disease Control and Prevention: community resilience (DEPARTMENT OF PUBLIC HEALTH CONNECTICUT)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 94
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NE11OE000019_075)

---

### Corporation for National and Community Service: youth mentoring (NEW YORK STATE COMMISSION ON NATIONAL & COMMUNITY SERVICE)

- **Agency:** Corporation for National and Community Service - Corporation for National and Community Service
- **Deadline:** —
- **Fit score:** 93
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_22ACFNY001_485)

---

### Veterans Employment and Training Services: veteran transition (VOCATIONAL REHABILITATION SPECIALISTS INC)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 93
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV38350226056_1601)

---

### Centers for Medicare and Medicaid Services: maternal health (FLORIDA AGENCY FOR HEALTH CARE ADMINISTRATION)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 93
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332067_075)

---

### Centers for Disease Control and Prevention: evidence based programs (OHIO DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 93
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU58DP007097_075)

---

### Office of Justice Programs: youth mentoring (THE URBAN INSTITUTE)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 93
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PNIJ23GG04238MENT_015)

---

### Veterans Employment and Training Services: veteran transition (FEDCAP INC)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV383532260536_1601)

---

### Office of Justice Programs: youth mentoring (NATIONAL RECREATION AND PARK ASSOCIATION, INCORPORATED)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PJDP24GG03819MENT_015)

---

### Assistant Secretary for Community Planning and Development: housing assistance (CITY OF ATLANTA)

- **Agency:** Department of Housing and Urban Development - Assistant Secretary for Community Planning and Development
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_GAH25F001_086)

---

### Centers for Medicare and Medicaid Services: workforce development (STATE OF MONTANA DEPARTMENT OF HEALTH AND HUMAN SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332058_075)

---

### Veterans Employment and Training Services: veteran transition (RESTART INC)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV383802260529_1601)

---

### Employment and Training Administration: workforce development (STATE OF CALIFORNIA EMPLOYMENT DEVELOPMENT DEPARTMENT)

- **Agency:** Department of Labor - Employment and Training Administration
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_AA385182255A6_1601)

---

### Veterans Employment and Training Services: veteran transition (BLACK VETERANS FOR SOCIAL JUSTICE INC)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV383372260536_1601)

---

### Veterans Employment and Training Services: veteran transition (THE SALVATION ARMY)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV38379226056_1601)

---

### Veterans Employment and Training Services: veteran transition (ASHEVILLE-BUNCOMBE COMMUNITY CHRISTIAN MINISTRY, INC)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV383712260537_1601)

---

### Administration for Children and Families: outcomes measurement (CONNECTICUT OFFICE OF EARLY CHILDHOOD)

- **Agency:** Department of Health and Human Services - Administration for Children and Families
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_90TP0142_075)

---

### Veterans Employment and Training Services: veteran transition (AMERICA WORKS OF ILLINOIS, INC.)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV383692260536_1601)

---

### Veterans Employment and Training Services: veteran transition (VOLUNTEERS OF AMERICA NORTHERN ROCKIES)

- **Agency:** Department of Labor - Veterans Employment and Training Services
- **Deadline:** —
- **Fit score:** 92
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_HV383572260556_1601)

---

### City of Austin — Austin Economic Injury (AEI) / EDD Small Business Grants

- **Agency:** City of Austin Economic Development Department
- **Deadline:** —
- **Fit score:** 91
- **Status:** identified
- **Source:** city_austin · [link](https://www.austintexas.gov/department/economic-development)

---

### Centers for Disease Control and Prevention: behavioral health (DEPARTMENT OF STATE HEALTH SERVICES)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 91
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NE11OE000001_075)

---

### SAMHSA Community Mental Health Grants

- **Agency:** Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 90
- **Status:** identified
- **Source:** federal_samhsa · [link](https://www.samhsa.gov/grants)

---

### Office of Justice Programs: juvenile justice (RESEARCH TRIANGLE INSTITUTE)

- **Agency:** Department of Justice - Office of Justice Programs
- **Deadline:** —
- **Fit score:** 90
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_15PNIJ23GK00931NIJB_015)

---

### National Science Foundation: artificial intelligence research (REGENTS OF THE UNIVERSITY OF MICHIGAN)

- **Agency:** National Science Foundation - National Science Foundation
- **Deadline:** —
- **Fit score:** 90
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2541910_049)

---

### Austin Public Health (APH) — Community Services Block Grant & Wellness

- **Agency:** Austin Public Health (City of Austin)
- **Deadline:** —
- **Fit score:** 89
- **Status:** identified
- **Source:** city_austin · [link](https://www.austintexas.gov/department/health)

---

### TDHCA — Community Affairs / CSBG / Homelessness Programs

- **Agency:** Texas Department of Housing and Community Affairs (State of Texas)
- **Deadline:** —
- **Fit score:** 88
- **Status:** identified
- **Source:** tx_statewide · [link](https://www.tdhca.texas.gov/community-affairs)

---

### Employment and Training Administration: reentry services (FEDCAP INC)

- **Agency:** Department of Labor - Employment and Training Administration
- **Deadline:** —
- **Fit score:** 87
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_PE386062260A36_1601)

---

### Centers for Disease Control and Prevention: outcomes measurement (OHIO DEPARTMENT OF HEALTH)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 87
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NUF2CE002583_075)

---

### Substance Abuse and Mental Health Services Administration: reentry services (THE MCSHIN FOUNDATION)

- **Agency:** Department of Health and Human Services - Substance Abuse and Mental Health Services Administration
- **Deadline:** —
- **Fit score:** 86
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_H79TI086104_075)

---

### Texas Health and Human Services Commission Grants

- **Agency:** Texas HHSC (State of Texas)
- **Deadline:** —
- **Fit score:** 84
- **Status:** identified
- **Source:** state_texas · [link](https://www.hhs.texas.gov/about/funding-grant-opportunities)

---

### National Institutes of Health: social safety net (UNIVERSITY OF UTAH)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 84
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_R01HD107077_075)

---

### National Institutes of Health: two generation (THE TRUSTEES OF COLUMBIA UNIVERSITY IN THE CITY OF NEW YORK)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 84
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_R01HD103669_075)

---

### National Institute of Food and Agriculture: minority business (KENTUCKY STATE UNIVERSITY)

- **Agency:** Department of Agriculture - National Institute of Food and Agriculture
- **Deadline:** —
- **Fit score:** 84
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NI241444XXXXG007_012)

---

### Under Secretary for Health/Veterans Health Administration: housing assistance (ST. VINCENT DE PAUL CARES, INC.)

- **Agency:** Department of Veterans Affairs - Under Secretary for Health/Veterans Health Administration
- **Deadline:** —
- **Fit score:** 83
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2023-FL-099-25_036)

---

### Centers for Disease Control and Prevention: social safety net (UNIVERSITY OF NORTH CAROLINA AT CHAPEL HILL)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 83
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_K01CE003548_075)

---

### Institute of Museum and Library Services: responsible AI (MONTANA STATE UNIVERSITY)

- **Agency:** Institute of Museum and Library Services - Institute of Museum and Library Services
- **Deadline:** —
- **Fit score:** 83
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_LG-252307-OLS-22_474)

---

### Under Secretary for Health/Veterans Health Administration: housing assistance (VOLUNTEERS OF AMERICA OF THE CAROLINAS, INC.)

- **Agency:** Department of Veterans Affairs - Under Secretary for Health/Veterans Health Administration
- **Deadline:** —
- **Fit score:** 83
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_2021-NC-237-25_036)

---

### Centers for Medicare and Medicaid Services: maternal health (ARIZONA HEALTH CARE COST CONTAINMENT SYSTEM)

- **Agency:** Department of Health and Human Services - Centers for Medicare and Medicaid Services
- **Deadline:** —
- **Fit score:** 83
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_RHTCMS332059_075)

---

### Community-Based Participatory Research to Advance Data and Practice Transformation (ADAPT) for Optimizing Oral Health for All (UG3/UH3 Clinical Trial Optional)

- **Agency:** National Institutes of Health
- **Deadline:** 2028-11-16
- **Fit score:** 83
- **Status:** identified
- **Source:** grants.gov · [link](https://www.grants.gov/search-results-detail/358864)

---

### Centers for Disease Control and Prevention: evidence based programs (RWANDA BIOMEDICAL CENTER)

- **Agency:** Department of Health and Human Services - Centers for Disease Control and Prevention
- **Deadline:** —
- **Fit score:** 82
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_NU2GGH002531_075)

---

### National Institutes of Health: outcomes measurement (CLEVELAND CLINIC LERNER COLLEGE OF MEDICINE OF CASE WESTERN RESERVE UNIVERSITY)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 82
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_R33NS113258_075)

---

### National Institutes of Health: digital literacy (UNIVERSITY OF MARYLAND, BALTIMORE)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 82
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_UG4LM013724_075)

---

### National Institutes of Health: outcomes measurement (UNIVERSITY OF WASHINGTON)

- **Agency:** Department of Health and Human Services - National Institutes of Health
- **Deadline:** —
- **Fit score:** 82
- **Status:** identified
- **Source:** usaspending · [link](https://www.usaspending.gov/award/ASST_NON_R01MH125179_075)

---

### Navigator Emergency Department Diversion Models for Non-Urgent Mental Health Concerns (R34 Clinical Trial Required)

- **Agency:** National Institutes of Health
- **Deadline:** 2028-01-07
- **Fit score:** 82
- **Status:** identified
- **Source:** grants.gov · [link](https://www.grants.gov/search-results-detail/357386)

---

### Navigator Emergency Department Diversion Models for Non-Urgent Mental Health Concerns (R01 Clinical Trial Required)

- **Agency:** National Institutes of Health
- **Deadline:** 2028-01-07
- **Fit score:** 82
- **Status:** identified
- **Source:** grants.gov · [link](https://www.grants.gov/search-results-detail/357382)

---

### Hogg Foundation for Mental Health — Statewide Texas Mental Health Funding

- **Agency:** Hogg Foundation for Mental Health (UT Austin / statewide TX)
- **Deadline:** —
- **Fit score:** 81
- **Status:** identified
- **Source:** tx_statewide · [link](https://hogg.utexas.edu/grants)

---

### RGK Foundation — Statewide Texas Education, Community & Health

- **Agency:** RGK Foundation (Austin, TX — statewide reach)
- **Deadline:** —
- **Fit score:** 80
- **Status:** identified
- **Source:** tx_statewide · [link](https://www.rgkfoundation.org/grants/)

---

### Meadows Foundation — Statewide Texas General-Operating & Project Grants

- **Agency:** Meadows Foundation (statewide TX)
- **Deadline:** —
- **Fit score:** 80
- **Status:** identified
- **Source:** tx_statewide · [link](https://www.mfi.org/grants)

---

### St. David's Foundation Community Health Grants

- **Agency:** St. David's Foundation (Austin, TX)
- **Deadline:** —
- **Fit score:** 80
- **Status:** identified
- **Source:** foundation · [link](https://stdavidsfoundation.org/grants/)

---

## 6. Mid-fit identified (fit 60–79)

**35 opportunities.** Compact format below; full notes available via DB query `SELECT notes FROM grant_opportunities WHERE id=...`.

| Title | Agency | Deadline | Fit | Status | URL |
|---|---|---|---|---|---|
| Communities Foundation of Texas (CFT) — Statewide TX Community Grants | Communities Foundation of Texas (statewide TX) | — | 79 | identified | [link](https://www.cftexas.org/grants) |
| ⭐ PRIORITY: U.S. Space Force SkillBridge & DoD Workforce Transition | U.S. Space Force / Department of Defense | — | 77 | identified | [link](https://skillbridge.osd.mil/) |
| Texas Bar Foundation — Justice, Reentry & Civil Legal Aid Grants | Texas Bar Foundation (statewide TX) | — | 77 | identified | [link](https://www.txbf.org/grants/) |
| OSERS-OSEP: Expanding Career Pathways and Workforce Readiness of Special Education Teachers and Early Intervention Personnel Through Registered Apprenticeships, Assistance Listing Number (ALN) 84.325J | Department of Education | 2026-07-13 | 77 | identified | [link](https://www.grants.gov/search-results-detail/362373) |
| SAMHSA FY2026 NOFO Portfolio — Behavioral Health Grants | SAMHSA | — | 76 | identified | [link](https://www.samhsa.gov/grants) |
| Department of Energy: workforce development (VALE USA LLC) | Department of Energy - Department of Energy | — | 75 | identified | [link](https://www.usaspending.gov/award/ASST_NON_DECD0000101_089) |
| Administration for Children and Families: child welfare (MARSELL WELLNESS CENTER) | Department of Health and Human Services - Administration for Children and Families | — | 75 | identified | [link](https://www.usaspending.gov/award/ASST_NON_90ZU0638_075) |
| NIMH Mental Health Program Grants FY2026 | National Institute of Mental Health (NIH/NIMH) | — | 74 | identified | [link](https://www.nimh.nih.gov/funding) |
| DoD Cyber Workforce Development Grants | Department of Defense / Cyber Command | — | 74 | identified | [link](https://www.cybercom.mil/) |
| National Institutes of Health: outcomes measurement (BRIGHAM & WOMENS HOSPITAL INC) | Department of Health and Human Services - National Institutes of Health | — | 74 | identified | [link](https://www.usaspending.gov/award/ASST_NON_R01CA280619_075) |
| Office of Justice Programs: youth mentoring (ONE STEP FURTHER INC) | Department of Justice - Office of Justice Programs | — | 74 | identified | [link](https://www.usaspending.gov/award/ASST_NON_15PBJA23GG00114BRND_015) |
| National Institutes of Health: outcomes measurement (BRIGHAM & WOMENS HOSPITAL INC) | Department of Health and Human Services - National Institutes of Health | — | 73 | identified | [link](https://www.usaspending.gov/award/ASST_NON_R01CA279175_075) |
| Substance Abuse and Mental Health Services Administration: reentry services (COMMUNITY PARTNERS IN ACTION, INC.) | Department of Health and Human Services - Substance Abuse and Mental Health Services Administration | — | 73 | identified | [link](https://www.usaspending.gov/award/ASST_NON_H79TI080926_075) |
| Health Resources and Services Administration: digital literacy (THE HEALTH FEDERATION OF PHILADELPHIA) | Department of Health and Human Services - Health Resources and Services Administration | — | 73 | identified | [link](https://www.usaspending.gov/award/ASST_NON_U8645873_075) |
| RFP Mart — Public-Sector RFPs (recurring scan target) | RFPMart.com (national aggregator) | — | 73 | identified | [link](https://www.rfpmart.com/) |
| EPSCoR Research Infrastructure Improvement Program: EPSCoR Collaborations for Optimizing Research Ecosystems | U.S. National Science Foundation | 2026-07-21 | 73 | identified | [link](https://www.grants.gov/search-results-detail/357725) |
| Grand Founders Network-to-Capital Program | Grand Founders | — | 71 | identified | [link](https://grandfounders.org/initiatives-network-to-capital) |
| SBA Minority Business Development Grants | U.S. Small Business Administration | — | 71 | identified | [link](https://www.sba.gov/funding-programs/grants) |
| Texas Education Agency Community Partnership Grants | Texas Education Agency (State of Texas) | — | 67 | identified | [link](https://tea.texas.gov/about-tea/funding) |
| Secure Innovation: Advancing Artificial Intelligence, Cybersecurity, and Digital Resilience in Argentina | U.S. Mission to Argentina | 2026-05-31 | 67 | identified | [link](https://www.grants.gov/search-results-detail/361926) |
| OJJDP FY25 Juvenile Justice System Enhancements | Office of Juvenile Justice Delinquency Prevention  | 2026-06-08 | 67 | identified | [link](https://www.grants.gov/search-results-detail/362102) |
| NIJ FY25 Research and Evaluation of Artificial Intelligence for Criminal Justice Purposes | National Institute of Justice | 2026-06-15 | 67 | identified | [link](https://www.grants.gov/search-results-detail/362406) |
| DoW Arthritis Translational Research Award | Dept. of the Army -- USAMRAA | 2026-10-22 | 67 | identified | [link](https://www.grants.gov/search-results-detail/362177) |
| Adient Foundation Community Grants | Adient Foundation (Corporate) | — | 65 | identified | [link](https://www.adient.com/sustainability/community) |
| DreamBee Foundation Child Abuse Prevention | DreamBee Foundation | — | 65 | identified | [link](https://dreambeefoundation.org/) |
| APAF Community Grants — Youth of Color Mental Health | American Psychiatric Association Foundation (APAF) | — | 63 | identified | [link](https://www.apafdn.org) |
| Federal Highway Administration: community resilience (TRANSPORTATION NORTH CAROLINA DEPARTMENT) | Department of Transportation - Federal Highway Administration | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_693JJ22630000Y115NC0001156_069) |
| Collaboratory to Advance Mathematics Education and Learning (CAMEL) for K-12 | U.S. National Science Foundation | — | 61 | identified | [link](https://www.grants.gov/search-results-detail/361008) |
| Federal Highway Administration: community resilience (TRANSPORTATION NORTH CAROLINA DEPARTMENT) | Department of Transportation - Federal Highway Administration | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_693JJ22630000Y113NC0001156_069) |
| Federal Highway Administration: community resilience (TRANSPORTATION NORTH CAROLINA DEPARTMENT) | Department of Transportation - Federal Highway Administration | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_693JJ22640002RPA0NC0001156MEGA_069) |
| Federal Highway Administration: community resilience (TRANSPORTATION NORTH CAROLINA DEPARTMENT) | Department of Transportation - Federal Highway Administration | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_693JJ22630000Y116NC0001156_069) |
| Federal Highway Administration: community resilience (TRANSPORTATION NORTH CAROLINA DEPARTMENT) | Department of Transportation - Federal Highway Administration | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_693JJ22630000Y114NC0001156_069) |
| National Institutes of Health: outcomes measurement (TRUSTEES OF TUFTS COLLEGE) | Department of Health and Human Services - National Institutes of Health | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_R01AG071717_075) |
| Federal Highway Administration: minority business (TRANSPORTATION & DEVELOPMENT LOUISIANA D) | Department of Transportation - Federal Highway Administration | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_693JJ22630000Y049LAH971911_069) |
| Institute of Museum and Library Services: digital literacy (MISSOURI SECRETARY OF STATE) | Institute of Museum and Library Services - Institute of Museum and Library Services | — | 61 | identified | [link](https://www.usaspending.gov/award/ASST_NON_LS-259300-OLS-26_474) |

## 7. Marginal-fit identified (fit 50–59)

**22 opportunities.** Reviewed periodically; not active targets.

| Title | Agency | Deadline | Fit | Status |
|---|---|---|---|---|
| City of Austin — Cultural Arts Funding (Nexus, Elevate, Thrive) | City of Austin Economic Development Department — Cultural Arts Division | — | 59 | identified |
| Austin Housing Finance Corporation (AHFC) — Community Development Programs | Austin Housing Finance Corporation / City of Austin Housing Department | — | 59 | identified |
| Assistant Secretary for Community Planning and Development: housing assistance (ILLINOIS HOUSING DEVELOPMENT AUTHORITY) | Department of Housing and Urban Development - Assistant Secretary for Community Planning and Development | — | 59 | identified |
| Assistant Secretary for Community Planning and Development: housing assistance (NORTH CAROLINA HOUSING FINANCE AGENCY) | Department of Housing and Urban Development - Assistant Secretary for Community Planning and Development | — | 59 | identified |
| Assistant Secretary for Community Planning and Development: housing assistance (FLORIDA HOUSING FINANCE CORPORATION) | Department of Housing and Urban Development - Assistant Secretary for Community Planning and Development | — | 59 | identified |
| Minority Business Development Agency: minority business (ONABEN) | Department of Commerce - Minority Business Development Agency | — | 59 | identified |
| Administration for Children and Families: child welfare (FAMILIES RISING) | Department of Health and Human Services - Administration for Children and Families | — | 59 | identified |
| Administration for Children and Families: child welfare (RESEARCH FOUNDATION FOR THE STATE UNIVERSITY OF NEW YORK, THE) | Department of Health and Human Services - Administration for Children and Families | — | 59 | identified |
| Manufacturing Systems Integration | U.S. National Science Foundation | — | 59 | identified |
| EONS 2018: Appendix E Minority University Research and Education Project (MUREP) for Sustainability and Innovation Collaborative &ndash; (MUSIC)  | National Aeronautics and Space Administration | — | 59 | identified |
| Building EPSCoR-State/National Laboratory Partnerships | Office of Science | 2026-05-21 | 59 | identified |
| Alcohol and Other Substance Use Research Education Programs for Health Professionals (R25 Clinical Trial Not Allowed) | National Institutes of Health | 2026-05-25 | 59 | identified |
| Estimated Fiscal Year 2026 Adult Education and Family Literacy Act State Award Amounts | Office of Career Technical and Adult Education  | 2026-05-26 | 59 | identified |
| BJA FY25 De-escalation and Crisis Response Training Program | Bureau of Justice Assistance | 2026-05-27 | 59 | identified |
| NIJ FY25 Research and Evaluation on Forensic Science Systems | National Institute of Justice | 2026-06-02 | 59 | identified |
| NIJ FY25 Research and Evaluation for the Testing and Interpretation of Physical Evidence in Publicly Funded Forensic Laboratories | National Institute of Justice | 2026-06-03 | 59 | identified |
| Accelerating Research through International Network-to-Network Collaborations | U.S. National Science Foundation | 2026-09-21 | 59 | identified |
| Community Engagement Evaluation and Data Coordination (CEED) Hub to Advance Data and Practice Transformation for Optimizing Oral Health for All (U01, Clinical Trial Not Allowed) | National Institutes of Health | 2026-10-19 | 59 | identified |
| Agriculture and Food Research Initiative Competitive Grants Program Education and Workforce Development | National Institute of Food and Agriculture | 2026-12-31 | 59 | identified |
| Public Health Crisis Response Cooperative Agreement | Centers for Disease Control - OPHPR | 2027-02-11 | 59 | identified |
| Effectiveness Trials to Test Mental Health System Interventions (R61/R33 Clinical Trial Required) | National Institutes of Health | 2027-10-15 | 59 | identified |
| FEMA Emergency Preparedness Grants | Federal Emergency Management Agency | — | 50 | identified |

---

## 8. Drafts written — complete inventory

Every file currently in `docs/grants/` (88 total). Includes narratives, LOIs, budget docs, partner outreach, walkthroughs, strategic memos, capabilities inventories, and the AISD package (passed 2026-05-19, archived for reuse).

### (top-level)

- `docs/grants/AEI-FY26-Application-Responses-FINAL.md` _(27.9 KB)_
- `docs/grants/AEI-FY26-Equity-Mini-Grant-Narrative.md` _(28.3 KB)_
- `docs/grants/AEI-Funder-Intelligence.md` _(8.0 KB)_
- `docs/grants/AEI-Partner-Outreach-Email-Template.md` _(5.8 KB)_
- `docs/grants/Borealis-DIF-x-Tech-2026-Application-Draft.md` _(9.1 KB)_
- `docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md` _(40.4 KB)_
- `docs/grants/CDMRP-PRMRP-Concept-Award-Draft.md` _(14.5 KB)_
- `docs/grants/CONGRUENCE-MANIFEST.json` _(17.1 KB)_
- `docs/grants/DOL-RESTART-FOA-ETA-26-17-RESEARCH.md` _(13.7 KB)_
- `docs/grants/Foster-Youth-Evidence-Base.md` _(15.6 KB)_
- `docs/grants/Foster-Youth-Executive-Briefing.md` _(10.3 KB)_
- `docs/grants/Foster-Youth-Jim-Currier-Meeting-Prep.md` _(11.6 KB)_
- `docs/grants/Foster-Youth-Outcome-Tracking-Plan.md` _(5.0 KB)_
- `docs/grants/Foster-Youth-Transition-Briefing.md` _(8.9 KB)_
- `docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md` _(25.9 KB)_
- `docs/grants/Grant-Cross-Reference-Report.md` _(11.1 KB)_
- `docs/grants/Grant-Opportunity-Scan-2026-05-14.md` _(31.4 KB)_
- `docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md` _(25.6 KB)_
- `docs/grants/HerHealth-Network-Grant-Prospectus.md` _(6.2 KB)_
- `docs/grants/NSF-ATE-Proposal-Framework.md` _(30.1 KB)_
- `docs/grants/NSF-IUSE-EDU-RPLICE-Evaluation.md` _(9.4 KB)_
- `docs/grants/NSF-Quantum-Education-RPLICE-Evaluation.md` _(11.1 KB)_
- `docs/grants/NSF-STEM-K12-Proposal-Framework.md` _(20.8 KB)_
- `docs/grants/NSF-SoSDCI-Alignment.md` _(16.5 KB)_
- `docs/grants/NSF-TechAccess-AI-Ready-America-Alignment.md` _(17.9 KB)_
- `docs/grants/NSF-TechAccess-Budget-Framework.md` _(8.9 KB)_
- `docs/grants/NSF-TechAccess-LOI-Draft.md` _(9.2 KB)_
- `docs/grants/NSF-TechAccess-Logic-Model.md` _(9.6 KB)_
- `docs/grants/NSF-TechAccess-Proposal-Framework.md` _(22.3 KB)_
- `docs/grants/PFISD-PARTNER-LETTER-TEMPLATE.md` _(3.8 KB)_
- `docs/grants/QUARTET-ONE-PAGER.md` _(8.2 KB)_
- `docs/grants/RARE-IMPACT-FUND-LOI.md` _(12.8 KB)_
- `docs/grants/RPLICE-Platform-Overview.doc` _(11.9 KB)_
- `docs/grants/RWJF-Brief-Proposal-Narrative-UPLOAD.doc` _(6.5 KB)_
- `docs/grants/RWJF-CV-Meredith-Sisnett.doc` _(5.2 KB)_
- `docs/grants/RWJF-CV-Terry-Flood.doc` _(6.7 KB)_
- `docs/grants/RWJF-Global-Ideas-2026-Brief-Proposal.md` _(19.2 KB)_
- `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md` _(10.8 KB)_
- `docs/grants/SUBMISSION-WALKTHROUGH-StDavids-WAB2-LOI.md` _(9.5 KB)_
- `docs/grants/SUBMISSION-WALKTHROUGH-TWC-RFA-32026-00162.md` _(9.9 KB)_
- `docs/grants/Spencer-Foundation-Narrative-SUBMISSION.doc` _(12.4 KB)_
- `docs/grants/Spencer-Foundation-Narrative-v2.0.doc` _(12.4 KB)_
- `docs/grants/Spencer-Foundation-Narrative-v2.1.doc` _(13.0 KB)_
- `docs/grants/Spencer-Foundation-Small-Research-Grant-2026.md` _(9.8 KB)_
- `docs/grants/St-Davids-Community-Led-Change-LOI-Package.md` _(15.9 KB)_
- `docs/grants/St-Davids-Strategic-Alignment.md` _(9.8 KB)_
- `docs/grants/St-Davids-WAB2-LOI-FINAL-DRAFT.md` _(4.0 KB)_
- `docs/grants/St-Davids-WAB2-LOI-Package.md` _(39.4 KB)_
- `docs/grants/TCAF-Coalition-Partner-Presentation.md` _(14.1 KB)_
- `docs/grants/TCAF-Financial-Additional-Context.doc` _(3.1 KB)_
- `docs/grants/TCAF-Leadership-Staff-Overview.doc` _(8.3 KB)_
- `docs/grants/TCAF-Organizational-Budget-FY2025-2026.doc` _(8.3 KB)_
- `docs/grants/TCAF-Rare-Impact-Fund-LOI-Narrative-SUBMITTED.md` _(5.4 KB)_
- `docs/grants/TCAF-Rare-Impact-Fund-LOI-Narrative.doc` _(11.4 KB)_
- `docs/grants/TCAF_FormB_Budget_2026-04-21.xlsx` _(16330.8 KB)_
- `docs/grants/TWC-FORM-A-FILL-IN-SHEET.md` _(5.7 KB)_
- `docs/grants/TWC-FORM-B-BUDGET-COMPLETE.md` _(10.0 KB)_
- `docs/grants/TWC-RFA-32026-00162-FORM-A-APPLICATION.doc` _(28.8 KB)_
- `docs/grants/TWC-RFA-32026-00162-NARRATIVE.md` _(26.6 KB)_
- `docs/grants/TX-Reentry-Stipend-Pilot-Overview.doc` _(10.4 KB)_
- `docs/grants/TX-Reentry-Stipend-Pilot-Presentation.pptx` _(254.5 KB)_
- `docs/grants/Tabbara-Top4-Intel.md` _(9.7 KB)_
- `docs/grants/Top-5-Grants-To-Pursue-Today.md` _(14.0 KB)_
- `docs/grants/Top-5-Grants-URLs-and-Requirements.md` _(13.0 KB)_
- `docs/grants/smart-family-fund-pitches-2026-05-17.md` _(30.7 KB)_
- `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` _(15.8 KB)_
- `docs/grants/trade-sims-audit-2026-05-17.md` _(9.3 KB)_
- `docs/grants/trade-sims-funder-sequencing-2026-05-17.md` _(13.2 KB)_
- `docs/grants/trade-sims-funder-targets.md` _(7.6 KB)_
- `docs/grants/trade-sims-m2-one-pager.md` _(5.9 KB)_

### AEI-Outreach-Drafts

- `docs/grants/AEI-Outreach-Drafts/00-Reply-to-Meredith.md` _(1.8 KB)_
- `docs/grants/AEI-Outreach-Drafts/01-El-Buen-Georgia-Hernandez.md` _(4.0 KB)_
- `docs/grants/AEI-Outreach-Drafts/02-Reply-to-Georgia-Hernandez.md` _(1.4 KB)_

### aisd-26rfp052

- `docs/grants/aisd-26rfp052/00-README-and-Submission-Checklist.md` _(3.8 KB)_
- `docs/grants/aisd-26rfp052/00-README-and-Submission-Checklist.pdf` _(7.4 KB)_
- `docs/grants/aisd-26rfp052/01-Proposal-Response-Form.md` _(25.2 KB)_
- `docs/grants/aisd-26rfp052/01-Proposal-Response-Form.pdf` _(29.5 KB)_
- `docs/grants/aisd-26rfp052/02-Sample-Unit-Plan-and-Lessons.md` _(15.1 KB)_
- `docs/grants/aisd-26rfp052/02-Sample-Unit-Plan-and-Lessons.pdf` _(18.8 KB)_
- `docs/grants/aisd-26rfp052/03-Required-Forms-Filled.md` _(7.4 KB)_
- `docs/grants/aisd-26rfp052/03-Required-Forms-Filled.pdf` _(10.1 KB)_

### centene-foundation-2026

- `docs/grants/centene-foundation-2026/01-concept-paper.md` _(17.7 KB)_
- `docs/grants/centene-foundation-2026/02-budget.md` _(5.6 KB)_
- `docs/grants/centene-foundation-2026/03-budget-narrative.md` _(13.1 KB)_

### ssg-fox-fy27

- `docs/grants/ssg-fox-fy27/00-funder-brief.md` _(8.9 KB)_

### submitted

- `docs/grants/submitted/StDavids-GivingData-Profile-Update-Checklist.md` _(3.2 KB)_
- `docs/grants/submitted/StDavids-WAB2-Feedback-Request-DRAFT.md` _(3.4 KB)_
- `docs/grants/submitted/StDavids-WAB2-LOI-Decision-2026-05-15.md` _(4.1 KB)_

---

## 9. Recent rescore decisions (2026-05-19)

Nine ED grants and four DOE additions rescored against actual capability stack. Memory of every shift:

| Grant | Old Fit | New Fit | Direction | Rationale |
|---|---|---|---|---|
| Promise Neighborhoods 84.215N (×2 rows) | 0 | 88 | ↑ | Chainweb (8-step citation-chained Census/CDC/SVI/FBI evidence pipeline, 593 LOC) is exactly the longitudinal-GPRA evidence engine PN requires. Real gap: needs LEA partner; ≤8 awards historically, ~$30M each. |
| OSERS-OSEP 84.325J (SpEd apprenticeships) | 77 | 82 | ↑ | Adds Perfectly Different (neurodiversity IEP/504 builder) to the apprenticeship match. Caveat: eligibility typically IHE/SEA/LEA. |
| TEA Community Partnership Grants | 67 | 67 | = | Mid-fit confirmed; state, ISD-led typical. No deadline in DB — needs verification. |
| Innovative Approaches to Literacy 84.215G (×2 rows) | 0 | 62 | ↑ | Talk Your Talk (89 spoken + 18 sign + 6 learning, dialect-aware) + WholeMind visual-first Pre-K-12 is real literacy innovation. Track-record gap (501(c)(3) only effective 01/14/2026) prevents higher score. |
| AEFLA FY2026 state awards | 59 | 22 | ↓ | Honest correction: this is state pass-through, not direct grant. Path is TWC AEL provider RFP, not federal listing. |
| College Assistance Migrant 84.149A | 0 | 15 | ↑ | IHE-applicant program; not our profile. |
| Ready To Learn Programming | 0 | 20 | ↑ | CPB/PBS-affiliated media producers, not our scale. |
| Energy Auditor Training Grant Program (NEW) | — | 80 | new | Trade Sims expansion — 7th trade fit. DOE/EERE. |
| Inclusive Energy Innovation Prize (NEW) | — | 78 | new | DOE/Diversity prize, TCAF 501(c)(3) eligible, simpler app. |
| Communities LEAP (NEW) | — | 75 | new | DOE/SCEP place-based TA cohort, no cash but ~$4M in-kind. |
| Clean Energy to Communities C2C (NEW) | — | 70 | new | NREL TA, lowest-lift DOE relationship-builder. |

---

## 10. Iron Rule gaps

Primary-source verification still owed before committing dates to the DB or external tracker:

1. **DOE deadlines (4 rows)** — Energy Auditor Training · Inclusive Energy Innovation Prize · Communities LEAP · C2C. Currently NULL in DB. First task next session: open each program page and write verified next-cycle date.
2. **Innovative Approaches to Literacy 84.215G duplicate** — two rows with 2026-06-07 vs 2026-06-09 deadlines. Reconcile against grants.gov primary.
3. **TEA Community Partnership Grants deadline** — state ingestion didn't capture; check TEA site.
4. **Auto-scan stale since 2026-05-15** — grant discovery cron last wrote four days ago; investigation already in `docs/active-commitments.md`.

---

## How to use this document

**Populate your external tracker (Airtable, Notion, Asana, etc.) using these columns:**

1. Title
2. Agency / Funder
3. Deadline
4. Fit Score (0–100, capability-only)
5. Status (submitted / pursuing / loi_drafting / watch_next_cycle / identified / expired)
6. Source (grants.gov / usaspending / samgov / manual / state / city / foundation / corporate)
7. Source URL
8. Justification (paste from Notes field — Iron-Rule primary-source rationale)
9. Draft Location (if any — section 8 maps grant → file)
10. Next Action + Date
11. Owner
12. Decision Date (when scored / pursued / declined)

**Mapping drafts to grants:** Section 8 lists all drafts; common pairings:

- AISD 26RFP052 → `docs/grants/aisd-26rfp052/` (passed 2026-05-19, archived)
- Centene Foundation 2026 → `docs/grants/centene-foundation-2026/`
- SSG Fox FY27 → `docs/grants/ssg-fox-fy27/` + live build at `vetmissiontransition.com`
- St. David's WAB2 → `docs/grants/St-Davids-WAB2-*.md` (declined 2026-05-15)
- NSF TechAccess → 7 docs starting with `docs/grants/NSF-TechAccess-*`
- AEI FY26 → `docs/grants/AEI-*.md` + `docs/grants/AEI-Outreach-Drafts/`
- TWC RFA-32026-00162 → `docs/grants/TWC-*.md` + `TWC-FORM-A/B-*.md`
- RWJF Global Ideas → `docs/grants/RWJF-*`
- Spencer Foundation → `docs/grants/Spencer-*`
- Trade Sims funder strategy → `docs/grants/trade-sims-*`
- Foster Youth track → `docs/grants/Foster-Youth-*` + `docs/foster-youth-build-log.md`
- Capabilities baseline (read before drafting anything new) → `docs/grants/tcaf-capabilities-inventory-2026-05-17.md`
