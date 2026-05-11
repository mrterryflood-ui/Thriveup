# Foster Youth Aging Out — Transition Supports Briefing
**Audience:** HUD/HHS implementation leaders, Public Housing Authorities, child-welfare partners, foundations.
**Operator:** Thriving Communities for All Foundation, Inc. (TCAF). 501(c)(3) — IRS determination pending.
**President:** Dr. Terry Flood.
**Last verified live:** 2026-05-11. **Audit:** `npx tsx scripts/congruence-audit.ts` → `.agents/congruence/last-run.md`.

> **Honest disclosure (always first):** TCAF is a 501(c)(3) with IRS determination pending. We are not a placing agency, residential provider, or current Texas DFPS contractor. The infrastructure described in this briefing is built and live; the contracting relationships and funded designations are conversations in progress.

---

## The 30-second version
Six clickable, working tools for young people aging out of foster care, anchored on a parent platform (ThriveUp Academy) that sits inside a 5-platform ecosystem (Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health Ecosystem). Bilingual EN/ES. No login. National in design, Texas-piloted. Mapped explicitly to John H. Chafee, ETV, HUD FYI, ACA §2004 Medicaid-to-26, FAFSA Independent-Student status, McKinney-Vento, and RHYA.

---

## What is live, today, that you can click

| # | Claim | Live URL | Proof |
|---|---|---|---|
| 1 | Foster Youth Hub with Marcus narrative anchor and 6-tool door | `/foster-youth` | `client/src/pages/foster-youth/hub.tsx` · test IDs: `page-foster-youth-hub`, `card-marcus`, `section-tools`, `alert-honest-disclosure` |
| 2 | Aging-Out Toolkit — 18 categorized items, save-and-resume, progress tracker, critical/high/important triage | `/foster-youth/toolkit` | `toolkit.tsx` · 6 categories, localStorage persistence |
| 3 | Structured 90-days-before / 90-days-after Transition Plan, save and print for court hearing | `/foster-youth/transition-plan` | `transition-plan.tsx` · maps to Fostering Connections Act §475(5)(H) |
| 4 | Wellbeing Check-in — validated PHQ-2 + GAD-2 + housing/food screen, crisis-routing on red flags, no PII collected | `/foster-youth/wellbeing` | `wellbeing.tsx` · routes to 988, LifeBridge, Whole-Person MH |
| 5 | My Rights — federal (Chafee, ETV, HUD FYI, Medicaid-to-26, FAFSA Independent, McKinney-Vento, free credit report, RHYA) + Texas (PAL, Extended FC to 21, ID fee waiver, tuition waiver) — every entry shows the legal source | `/foster-youth/rights` | `rights.tsx` |
| 6 | State Benefits Navigator — all 50 states + DC, Texas full-detail, federal benefits across all states, apply links + phone numbers | `/foster-youth/benefits` | `benefits.tsx` |
| 7 | FAFSA navigator with foster-youth Independent-Student + ETV mode | `/fafsa-navigator?audience=foster` | `fafsa-navigator.tsx` · test ID `callout-foster-mode` |
| 8 | Crisis numbers (988, Crisis Text 741741, 1-800-RUNAWAY) on every page in the journey | All foster-youth pages | test IDs `link-crisis-988`, `link-crisis-text`, `link-crisis-runaway` |
| 9 | Marcus's full reentry-cycle narrative | `/resident-journey` | `resident-journey.tsx` · test ID `card-marcus-narrative` |
| 10 | **State-Agency Portal** — privileged CSV bulk-upload (≤5,000 rows), deterministic risk stratification (every factor cited), ISS-style stakeholder coordination, honest live-vs-MOU disclosure | `/foster-youth/state-portal` | `state-portal.tsx` + `server/foster-youth-agency-routes.ts` + `server/foster-youth-risk.ts` |
| 11 | **50-State Policy Comparison** — federal floor + state-by-state matrix; verified statutes only, "unverified" marked honestly | `/foster-youth/policy-comparison` | `policy-comparison.tsx` + `client/src/data/foster-youth/state-policies.ts` |

**Every row above is auto-verified by `scripts/congruence-audit.ts`.** Run it before you brief. Zero FAILs is the precondition for using this document.

---

## Why this exists — the evidence base
*(full citations: `docs/grants/Foster-Youth-Evidence-Base.md`)*

| Figure | Number | Source |
|---|---|---|
| Former foster youth experiencing homelessness by age 26 | 36% | Midwest Study (Chapin Hall) |
| Former foster youth (male) convicted of a crime by age 26 | 60% | Midwest Study (Chapin Hall) |
| Former foster youth earning a 4-year degree by age 26 | ~6–8% (vs. 36% of peers) | Midwest Study |
| Lifetime PTSD among former foster youth | ~25% (2x U.S. war veterans) | Casey Northwest Alumni Study |
| Annual federal envelope across foster-youth transition supports | $500M+ (Chafee · ETV · FYI · YHDP · RHYA · WIOA · OJJDP) | ACF + HUD + DOJ FY24 appropriations |

---

## How this maps to federal programs

| Federal program | What it funds | Where TCAF fits |
|---|---|---|
| **John H. Chafee Foster Care Program for Successful Transition to Adulthood** (42 USC §677) | State independent-living services through age 23 | Supportive-services partner — Toolkit, Transition Plan, Rights, Benefits Navigator |
| **Education and Training Voucher** (42 USC §677(i)) | Up to $5,000/year postsecondary, through age 26 | FAFSA navigator (foster mode) + Rights + Benefits |
| **HUD Foster Youth to Independence (FYI)** (24 CFR §982 youth set-aside) | Up to 36 months Housing-Choice rental assistance, ages 18–24 | Designed to wrap services around PHA-issued vouchers; ready for MOU |
| **ACA §2004 Medicaid (Former Foster Care Children)** | Free Medicaid through age 26, no income test, all 50 states | Surfaced and explained in Rights + Benefits |
| **McKinney-Vento + ESSA Title IX** (42 USC §11431) | School stability, immediate enrollment, transportation for homeless K-12 students | Surfaced and explained in Rights |
| **Runaway and Homeless Youth Act (RHYA)** (34 USC §11201) | Basic Center, Transitional Living, Street Outreach | Surfaced in Rights + Wellbeing crisis routing |

---

## What honest disclosure looks like in this briefing
- **Population:** ~20,000 young people age out of U.S. foster care every year (AFCARS). The infrastructure here is national in design, Texas-piloted today.
- **Outcome data we publish:** LifeBridge has produced 3,456 resource navigations, 234 crisis-support diversions, 178 CHW dispatches across all populations served — **not yet segmented by foster-youth user**. Our 30-day plan to fix that lives in `Foster-Youth-Outcome-Tracking-Plan.md`.
- **Outcome data we do NOT yet publish:** foster-youth-specific impact numbers. We will not claim them until at least one full month of segmented analytics is on the dashboard.
- **What we do not yet have:** signed Texas DFPS contract; HUD FYI sub-grantee designation; PHA partnership in Travis County. Each is the next conversation.
- **Funder posture:** St. David's Foundation is "actively evaluating" — not awarded.

---

## What we ask of partners
1. **Public Housing Authorities:** Talk with us about FYI MOU as supportive-services partner. We bring the wrap; you bring the voucher.
2. **State Independent-Living Coordinators (Texas DFPS PAL and counterparts):** Pilot site agreement. Refer your aging-out cohort to the Hub. We instrument outcomes for your reporting.
3. **HUD/HHS funders:** Tell us which evaluation evidence and rubric items most often disqualify non-traditional partners. We will instrument and report whatever you specify.
4. **Foundations:** Capital to scale state-by-state buildout of the Benefits Navigator (40+ states still in "federal-only + search pointer" mode today).

---

## The 5-platform ecosystem (one-pager)
- **Talk Your Talk** (`talkyourtalk.net`) — multilingual access: 89 spoken + 18 sign = 107 total. Crisis-detection events route into Whole-Person Health.
- **Civic Signal** — community advocacy and civic-engagement layer.
- **LifeBridge** (`lifetransitionsaid.org`) — 20,670+ verified resources, 211 + SDOH navigation, bilingual EN/ES.
- **ThriveUp Academy** — workforce, AI literacy, FAFSA, ETV, and the Foster Youth Aging Out experience documented here.
- **Whole-Person Health Ecosystem** (`mentalwellnesssupport.net`) — behavioral-health safety floor; receives crisis events from every platform.

(Full ecosystem catalog: `docs/ecosystem-catalog.md`. **In external copy use "15 service platforms operated by TCAF."**)

---

## Pre-briefing checklist
- [ ] `npx tsx scripts/congruence-audit.ts` returns zero FAILs (`.agents/congruence/last-run.md`)
- [ ] `npx playwright test tests/e2e/foster-youth-journey.spec.ts` passes
- [ ] All 6 foster-youth pages render in the deployed environment
- [ ] Crisis numbers tested live (988 + 741741 + 1-800-RUNAWAY)
- [ ] LifeBridge resource navigator at `/resources` returns 200
- [ ] Day-of meeting prep: `Foster-Youth-Jim-Currier-Meeting-Prep.md`

## Contact
- **Dr. Terry Flood, President** · `terryflood@thrivingcommunitiesforall.com`
- TCAF · Thriving Communities for All Foundation, Inc. · 501(c)(3) IRS determination pending
- All proposals route through the institutional email above; never personal Gmail.
