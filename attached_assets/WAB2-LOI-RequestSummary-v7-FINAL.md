# TCAF Benefits Enrollment Collaborative

**Evidence-Grounded, Community-Driven, 5-County Regional Infrastructure**

**Request Title:** TCAF Benefits Enrollment Collaborative — Closing the Eligibility-to-Enrollment Gap Across the 5-County Region
**Geographic Impact:** Regional (Travis, Williamson, Hays, Bastrop, Caldwell)
**Primary County:** Travis
**Amount Requested:** $1,000,000 over 24 months
**Match Commitment:** $200,000 (20%) — in-kind partner clinical staff time and TCAF platform infrastructure
**Status:** FINAL for GivingData submission — April 27, 2026, 5:00 PM CT

---

## The Problem We Solve

Maria, a Caldwell County mother of two, was eligible for Medicaid, WIC, and the Earned Income Tax Credit for three years and received none of them. In 15 minutes on her phone, in Spanish, she enrolled in all three — capturing roughly $8,400 in annual benefits her family had been leaving on the table. Her story is the rule, not the exception.

Across the five-county region, tens of thousands of residents are eligible for SNAP, WIC, Medicaid, CHIP, ACA Marketplace subsidies, EITC, the Child Tax Credit, SSI, and SSDI but do not receive them. SNAP and Medicaid take-up trail eligibility by double digits regionally; 35–40% of EITC-eligible filers never claim. Uninsured residents who qualify for Medicaid, CHIP, or ACA subsidies remain without coverage — driving avoidable ED visits and crowding St. David's safety-net partners. The applications are long, fragmented across 9+ portals, English-default, and scheduled around bank hours families do not have.

## Our Solution

The Collaborative Advocate Foundation (TCAF) closes the gap by building shared infrastructure used by every partner in the region. A single 15-minute intake — in English, Spanish, Vietnamese, Mandarin, and Arabic — screens for all 9 benefits at once and routes each applicant to the right portal, with direct deep-links, receipt capture, and denial-to-appeal workflow built in. Any CHW, navigator, promotora, school liaison, pastor, FQHC front-desk staffer, or resident on a personal phone runs the same flow.

Our analysis platform is powered by **ChainWeb**, TCAF's citation-traceable evidence engine: every county-, ZIP-, and Census-tract-level finding it surfaces is chained back to a primary federal source — U.S. Census ACS, CDC PLACES, ATSDR SVI 2022, HUD CHAS, and FBI CDE — so partners and funders can audit any number we publish. ChainWeb feeds plain-English profiles drawn from 955 live federal data connections across 67+ agencies. County profiles differ — rural Bastrop and Caldwell show transportation and broadband gaps; Hays and Williamson mix fast-growing suburbs with deep-need pockets; Travis holds the largest absolute unenrolled count plus eligibility for the Medical Access Program (MAP), which we surface only for Travis residents.

## Two Front Doors, One Network — Proven, Not Promised

A resident can walk into this work from two production sites today and land on the same St. David's hub:

- **[lifetransitionsaid.org/st-davids](https://lifetransitionsaid.org/st-davids)** — Life Transitions, TCAF's resident-facing platform, live in production.
- **TCAF's navigator hub at `/st-davids`** — the same intake, wizard, tracker, and outcomes dashboard used by CHWs and partner staff.

Both sites share the path, the intake, the benefit catalog, and the county logic. What makes this more than two copies is **RPLICE** (Reciprocal Platform-Linked Intelligence & Coordination Exchange) — TCAF's authenticated peer-mirror event bus that keeps the two sites synchronized in real time:

- An enrollment created on either side fires a `benefit.enrollment.created` event to its peer within seconds. A status change fires `benefit.enrollment.updated`. Every record carries a stable `residentRef` + `program` key.
- Both sides de-duplicate on `peer | residentRef | program | status`, so **a resident enrolled once is counted once** — whether their navigator works out of a CommUnityCare clinic in Travis or a promotora knocks on doors in Caldwell.
- Status vocabulary is normalized across the network (`approved` → `enrolled`, `denied / withdrew` → `declined`) so renewal reports speak one language.
- Echo-loop protection: events originating from a peer are never re-emitted, so the network total cannot be inflated by cross-mirroring.
- The handshake endpoint publishes a live **Network View** card — `localOwned`, `peerMirrored`, `networkTotal`, broken down by peer, benefit, and county — so St. David's and any partner can see the one real count at any moment.

This round-trip — ThriveUp → RPLICE → LifeBridge → handshake reflecting the new resident — has been verified end-to-end. **The infrastructure St. David's would fund already exists, is in production, and measures itself in public.**

## Outcome Targets (24 Months)

- **18,000+ residents enrolled** in at least one new benefit, with ≥40% of yield from rural Bastrop and Caldwell to correct historical underinvestment.
- **$24M+ in captured annual benefit value** flowing to households across the 5-area framework: Healthcare Access, Mental Health, Dental, Healthy Aging, and Healthy Children & Families.
- **≥85% retention at 6 months** and **≥70% appeal-win rate** on initial denials, tracked per county × program × language.
- **Single, deduplicated network count** — every resident counted exactly once across every front door, auditable via the live Network View endpoint.
- **County × Area × Language renewal matrix** delivered to St. David's every 90 days — the exact reporting format your team has asked for.

## Confirmed Partners

Confirmed collaborating partners include CommUnityCare Health Centers, Lone Star Circle of Care, Central Health, Foundation Communities, and El Buen Samaritano, with active MOUs in development across school districts (Austin ISD, Hays CISD, Bastrop ISD), faith networks, and county Health & Human Services offices. Full signed roster submitted at full-application stage. Partners pay nothing under this grant and can embed the same intake on their own sites — joining the federated network without building their own stack.

## Why TCAF, Why Now

TCAF is an active HHSC Community Partner Program Level 1 organization. We monitor fidelity with a 30-day MAP-GAP cycle — measure, analyze, plan, govern, adjust, publish — with CFIR and RE-AIM implementation-science checks built in. If yield drops in a tract, outreach shifts within the cycle. If denials spike on one program, navigator training is retooled. Navigators are trained in two hours; the flow runs on any smartphone, multilingual and low-literacy by default.

## Evaluation, Sustainability, and Match

External evaluation by a Dell Medical School / UT School of Social Work partnership, with an independent IRB-reviewed protocol and quarterly public dashboards. The Network View endpoint exposes raw, citation-chained counts for independent verification — funders and evaluators audit the same numbers the Collaborative reports. Sustainability post-grant is anchored in HHSC CPP processing reimbursements, Medicaid 1115-waiver navigator billing, and ongoing TCAF infrastructure investment. Match commitment of **$200,000 (20%)** in in-kind partner clinical staff time ($120K) and TCAF platform infrastructure ($80K).

## The Ask

We respectfully request **$1,000,000 over 24 months** to operationalize the Collaborative across all five counties, embed community champions in each county, capture and report outcomes in St. David's renewal-report format, and prove a model that other Texas regions can replicate. The result is a clear, measurable path from eligibility to enrollment to retention — at a scale that finally matches the gap, on infrastructure that is already running.

---

**Legal Entity:** The Collaborative Advocate Foundation (Texas nonprofit corporation; 501(c)(3) determination pending)
**UEI:** KDDVD1FGLW35
**Live Platform Demo:** [lifetransitionsaid.org/st-davids](https://lifetransitionsaid.org/st-davids) · navigator hub at `/st-davids` on TCAF
