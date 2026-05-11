# Foster Youth Aging Out — Executive Briefing

**Operator:** Thriving Communities for All Foundation, Inc. (TCAF). 501(c)(3) IRS determination pending.
**President:** Dr. Terry Flood.
**Generated:** 2026-05-11 from the live system.
**Verification:** 175/175 congruence checks passing as of 2026-05-11 (`scripts/congruence-audit.ts`).

> **Iron rule:** Audio = video. Every claim in this briefing is a clickable URL backed by a data-testid that the audit script verifies. If a claim is not in the manifest, it does not exist in this briefing.

---

## 1. The 30-second version

Eleven clickable, working surfaces for young people aging out of foster care AND for the state and county agencies who serve them. Anchored on a parent platform (ThriveUp Academy) that sits inside a five-platform ecosystem (Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health Ecosystem). Bilingual EN/ES. No login on youth-facing pages. National in design, Texas-piloted. Mapped to John H. Chafee, ETV, HUD FYI, ACA §2004 Medicaid-to-26, FAFSA Independent-Student, McKinney-Vento, and RHYA.

## 2. Why this exists

| Figure | Number | Source |
|---|---|---|
| Former foster youth experiencing homelessness by 26 | 36% | Midwest Study (Chapin Hall) |
| Former foster youth (male) convicted by 26 | 60% | Midwest Study |
| Former foster youth earning a 4-year degree by 26 | ~6–8% (vs. 36% peers) | Midwest Study |
| Lifetime PTSD among former foster youth | ~25% (2x U.S. war veterans) | Casey Northwest Alumni Study |
| Annual federal envelope in this lane | $500M+ | ACF + HUD + DOJ FY24 appropriations |

## 3. What is live, today, that you can click

| # | Surface | Live URL | Test IDs verified |
|---|---|---|---|
| 1 | Hub — One door for foster youth aging out | `/foster-youth` | `page-foster-youth-hub` · `card-marcus` · `text-marcus-title` · `section-tools` |
| 2 | Toolkit — 18 categorized items, save & resume | `/foster-youth/toolkit` | `page-foster-youth-toolkit` · `card-progress` · `section-cat-identity-documents` · `section-cat-records-you-own` · … |
| 3 | Transition Plan — 90 days before / 90 days after | `/foster-youth/transition-plan` | `page-foster-youth-transition-plan` · `tab-before` · `tab-after` · `button-save` · … |
| 4 | Wellbeing Check-in — PHQ-2, GAD-2, housing & food | `/foster-youth/wellbeing` | `page-foster-youth-wellbeing` · `card-item-phq1` · `card-item-phq2` · `card-item-gad1` · … |
| 5 | My Rights — federal entitlements, every citation visible | `/foster-youth/rights` | `page-foster-youth-rights` · `accordion-right-chafee` · `accordion-right-etv` · `accordion-right-fyi` · … |
| 6 | State Benefits Navigator — 50 states + DC | `/foster-youth/benefits` | `page-foster-youth-benefits` |
| 7 | FAFSA / ETV pathway — foster-youth Independent-Student mode | `/fafsa-navigator?audience=foster` | `page-fafsa-navigator` · `callout-foster-mode` |
| 8 | AI-assisted Intake — 4 steps, Anthropic Haiku 4.5 fallback chain | `/foster-youth/intake` | `page-foster-youth-intake` · `alert-honest` · `stepper` · `card-step-1` · … |
| 9 | Cohort Analytics — segmented data story per user | `/foster-youth/cohort-analytics` | `page-foster-youth-cohort-analytics` · `text-analytics-title` · `select-window-trigger` · `card-stat-intakes` · … |
| 10 | State-Agency Portal — caseload upload, ISS-style coordination | `/foster-youth/state-portal` | `page-foster-youth-state-portal` · `text-page-title` · `alert-honest-disclosure` · `tab-caseload` · … |
| 11 | 50-state Policy Comparison — non-adversarial, what's working | `/foster-youth/policy-comparison` | `page-foster-youth-policy-comparison` · `text-page-title` · `alert-federal-floor` · `alert-roadmap` · … |

Every row above is auto-verified by `scripts/congruence-audit.ts` (last run: 175 PASS / 0 FAIL).

## 4. Honest disclosure

- **TCAF is a 501(c)(3) with IRS determination pending.** We are not a placing agency, residential provider, or current Texas DFPS contractor.
- **No current Texas DFPS contract.** The infrastructure is built; the contracting relationship is the next milestone.
- **St. David's Foundation status:** actively evaluating, not awarded.
- **Outcome data we publish:** LifeBridge has produced 3,456 resource navigations, 234 crisis-support diversions, 178 CHW dispatches across all populations served — **not yet segmented by foster-youth user**. Plan to segment in 30 days lives in `docs/grants/Foster-Youth-Outcome-Tracking-Plan.md`.
- **Outcome data we do NOT yet publish:** foster-youth-specific impact numbers. We will not claim them until at least one full month of segmented analytics is on the dashboard.
- **Population:** ~20,000 young people age out of U.S. foster care every year (AFCARS). National in design, Texas-piloted today.

## 5. National State-Agency Portal (the new capability)

State and county child-welfare agencies upload **de-identified** caseload data via CSV (≤5,000 rows / 2MB). The system stratifies every case using a rule-based engine — every factor cites a published source — and surfaces who needs coordinated stakeholder attention before the youth ages out unsupported.

**Risk-stratification factors (all sourced):**

| Points | Factor | Source |
|---|---|---|
| +25 | Placement instability (>5 placements) | Midwest Study, Chapin Hall |
| +20 | Long stay in congregate care (>36 mo) | Casey Family Programs |
| +15 | School disruption (>3 changes) | National Working Group on Foster Care & Education |
| +15 | Prior runaway / AWOL | NYTD |
| +15 | Justice-system crossover | Vera Institute |
| +10 | Untreated mental-health diagnosis | AAP / Casey |
| +10 | No identified lifelong-connection adult | Midwest Study |
| +10 | Pregnant or parenting in care | CSSP |
| +5  | Sibling separation · Late entry (≥12) · LGBTQ+ self-disclosed · IEP-doc gap | Casey · Children's Bureau · True Colors United · IDEA §300.43 |

**Tiers: 0–19 Stable · 20–39 Watch · 40–59 Elevated · 60+ Critical.** Tiers communicate urgency of system response, never deficit in the youth.

**ISS-style stakeholder loop** (modeled on the integrated student-support pattern at <https://implementationineducatio.com>): caseworker · foster parent · school counselor · ILP coordinator · healthcare PCP · mental-health clinician · CASA/GAL · court · PHA (FYI voucher pre-screen) · education advocate.

**Live vs. roadmap (honest):** the engine, the upload pipeline, the stratification view, and the stakeholder coordination panel are LIVE. CCWIS direct integration, FERPA/HIPAA data-sharing MOUs, and SOC 2 audit are ROADMAP.

## 6. 50-state Policy Comparison (non-adversarial)

We surface what's working in each state so we can lift the floor everywhere.

**Federal floor (all 50 + DC):** Medicaid-to-26 (ACA §2004) · Chafee (42 USC §677) · ETV (§677(i)) · FAFSA Independent (HEA §480(d)) · HUD FYI (24 CFR §982) · McKinney-Vento · RHYA.

**State extensions we surface:** Extended Foster Care to 21 (Title IV-E opt-in) · public-college tuition waiver · transitional housing program · monthly transition stipend · state ID-fee waiver. Each "Yes" cites a statute. Each "Unverified" is honest about what we have not confirmed in this build — never invented.

**Roadmap (not claimed today):** A 30-year longitudinal causal model linking state policy adoption to NYTD/AFCARS outcomes requires NDACAN restricted-access micro-data (≈18-month approval) and a peer-reviewed analytic plan. We will not pretend we have the model when we don't.

## 7. The five-platform ecosystem

- **Talk Your Talk** (`talkyourtalk.net`) — multilingual access: 89 spoken + 18 sign = 107 total. Crisis-detection events route into Whole-Person Health.
- **Civic Signal** — community advocacy and civic-engagement layer.
- **LifeBridge** (`lifetransitionsaid.org`) — 20,670+ verified resources, 211 + SDOH navigation, bilingual EN/ES.
- **ThriveUp Academy** — workforce, AI literacy, FAFSA, ETV, and the Foster Youth Aging Out experience documented above.
- **Whole-Person Health Ecosystem** (`mentalwellnesssupport.net`) — behavioral-health safety floor; receives crisis events from every platform.

In external copy: **"15 service platforms operated by TCAF."** "25" is internal architecture only.

## 8. Federal program alignment

| Federal program | What it funds | Where TCAF fits |
|---|---|---|
| **John H. Chafee** (42 USC §677) | State independent-living services through age 23 | Toolkit · Transition Plan · Rights · Benefits Navigator |
| **ETV** (42 USC §677(i)) | Up to $5,000/year postsecondary, through 26 | FAFSA navigator (foster mode) + Rights + Benefits |
| **HUD FYI** (24 CFR §982 youth set-aside) | Up to 36 mo Housing-Choice rental assistance, 18–24 | Designed to wrap services around PHA-issued vouchers; ready for MOU |
| **ACA §2004 Medicaid (Former FC)** | Free Medicaid to 26, no income test, all 50 states | Surfaced and explained in Rights + Benefits |
| **McKinney-Vento + ESSA Title IX** (42 USC §11431) | School stability, immediate enrollment, transportation | Surfaced in Rights |
| **RHYA** (34 USC §11201) | Basic Center, Transitional Living, Street Outreach | Surfaced in Rights + Wellbeing crisis routing |

## 9. What we ask of partners

1. **Public Housing Authorities** — talk with us about an FYI MOU as supportive-services partner. We bring the wrap; you bring the voucher.
2. **State Independent-Living coordinators (Texas DFPS PAL and counterparts)** — pilot site agreement. Refer your aging-out cohort to the Hub. We instrument outcomes for your reporting.
3. **HUD/HHS funders** — tell us which evaluation evidence and rubric items most often disqualify non-traditional partners. We will instrument and report whatever you specify.
4. **Foundations** — capital to scale state-by-state buildout of the Benefits Navigator and the State-Agency Portal (CCWIS interoperability).

## 10. Contact

- **Dr. Terry Flood, President** · `terryflood@thrivingcommunitiesforall.com`
- TCAF · Thriving Communities for All Foundation, Inc. · 501(c)(3) IRS determination pending
- All proposals route through the institutional email above; never personal Gmail.
- Audit: `npx tsx scripts/congruence-audit.ts` → `.agents/congruence/last-run.md` (must show 0 FAIL before any external use of this briefing).
