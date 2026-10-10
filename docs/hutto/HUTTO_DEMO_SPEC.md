<!-- Committed copy of the shared Hutto Ready demo spec (hutto/HUTTO_DEMO_SPEC.md in the six-lane workspace) so contributors can audit shared/hutto-ready.ts against the allowed facts. Content is verbatim; the final "NO push / NO PR" line described the lane rules at build time — later pushes to feat/hutto-ready and PR #23 were owner-approved. -->

# Hutto Ready — Shared Demo Spec (source of truth for all six lanes)

Owner: Dr. Terry Flood (final umpire). Meeting: Oct 14, 2026, Hutto ISD + Hutto Area Chamber + VeraBank.
Goal: every platform recognizes "Hutto" BY NAME, and each has a `/hutto` page that is part of one integrated, synced demo.

## Canonical place
- Name: **Hutto, Texas** (display "Hutto, TX"), ZIP **78634**, **Williamson County**, lat 30.5427638, lon -97.5468898.
- Inputs that must resolve to Hutto: "Hutto", "hutto", "Hutto, TX", "Hutto, Texas", "Hutto TX", "78634", "Hutto ISD", "Hutto Independent School District". Wherever the product has a place/ZIP/district search, these must land on Hutto and display the NAME (not just the ZIP).

## Canonical URLs (each lane implements its own; every page cross-links all six)
| Platform | Hutto page |
|---|---|
| ThriveUp (hub + integrated demo) | https://thrivingcommunitiesforall.com/hutto |
| ChildCORE | https://childcorelearning.com/hutto |
| LineReady | https://linereadylabs.com/hutto |
| FinLitSpark | https://financetrainingandtrading.com/hutto |
| HazardAware | https://www.clearsignalresponse.tech/hutto (must open the Hutto, Texas place view directly, no welcome-dialog blocker) |
| Funding Path Pro | https://pursuitsfundingprofessionals.com/hutto |

If a framework makes `/hutto` impossible, use the closest path and REPORT it; do not silently change.

## "Hutto Ready" cross-platform strip (same on every page)
A compact strip/section titled **"Hutto Ready — Every Link, One Community"** listing the six links in this order with these labels:
1. ThriveUp — Community front door
2. ChildCORE — Early childhood
3. LineReady — Workforce pathways
4. FinLitSpark — Financial readiness
5. HazardAware — Emergency readiness
6. Funding Path Pro — Grants and funding
Current platform is marked as "You are here". Use each product's own design system.

## Demo family (composite — must be labeled "Illustrative composite family, not a real Hutto record")
- Parent (Maria) works an early shift; 4-year-old (Leo) on a Pre-K waitlist; 14-year-old (Andre) interested in robotics; 17-year-old (Sofia) has a summer internship offer and her first paycheck coming.
- Use the same names on every site where a family appears.

## Facts allowed (each must show its source link where displayed)
- Blue Origin: >$500M investment, >2,000 Hutto jobs over 10 years, paid HS internships + CTE support with Hutto ISD — https://www.kut.org/business/2026-10-08/blue-origin-hutto-aerospace-manufacturing
- Hutto ISD: 20 CTE programs of study across 11 career clusters — https://www.hipponation.org/career-technical-education/programs-of-study-2026-2027
- First area district with full-day Head Start — https://www.huttotx.gov/476/About-Hutto
- Hutto ISD Pre-K: free for eligible; paid Pre-K $7,400/yr (2025-26) — https://www.hipponation.org/early-childhood/prekindergarten-eligibility
- REACH program (internships with local businesses) — https://www.huttotxedc.gov/workforce
- TSTC robotics expanding to Williamson County — https://www.tstc.edu/blog/2026/08/17/tstc-expands-robotics-program-to-williamson-county-to-fill-regional-manufacturing-jobs/
- HB 27: students entering grade 9 in 2026–27 take a half-credit personal financial literacy course — https://tea.texas.gov/taa-letters/updates-high-school-social-studies-personal-financial-literacy-graduation-requirements ; TEC §28.0021 allows programs free to students — https://texas.public.law/statutes/tex._educ._code_section_28.0021
- Williamson County avg infant care $10,660/yr; 89% of surveyed centers had hiring difficulty — https://unitedwayaustin.org/wp-content/uploads/2024/01/United-Way-for-Greater-Austin_ImpactReport_2022-2023-Financials.pdf
- Williamson County 752,827 residents (2025), 9th largest numeric growth in US — https://www.census.gov/newsroom/press-releases/2026/2025-popest-metro-micro-counties.html
- Samsung Taylor $17B initial, 1,800 direct jobs — https://semiconductor.samsung.com/sas/company/taylor/
- ~30 data centers operating/planned in Williamson County, 5 in Hutto — https://austinfreepress.org/data-boom/
No other statistics about Hutto may be invented. Missing data is shown as missing.

## Non-negotiables
- Disclaimer on every page: "Prepared for a conversation with Hutto ISD, the Hutto Area Chamber of Commerce and VeraBank. Not affiliated with, endorsed by, or sponsored by these organizations." No partner logos.
- Do NOT state VeraBank is a sponsor. Sponsor slot says "Community sponsor: to be confirmed".
- Fictional/demo data is labeled on screen. No student-level real data.
- LineReady Early status stays "Pilot draft — district approval required before classroom use".
- HazardAware: people decide; nothing auto-sends.
- Mobile responsive, accessible (labels, contrast, keyboard).
- Follow each repo's AGENTS.md / AUDIT-GATE.md / doctrine. Preserve the existing stack; no new persistence layer.
- NO push, NO PR, NO deploy, NO Convex deploy. Local feature branch `feat/hutto-ready` only. Owner approves writes.
