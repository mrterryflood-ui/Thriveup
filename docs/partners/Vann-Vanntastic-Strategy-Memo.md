# Strategy Memo — Partnership with Dr. J. Michelle Vann

**Status:** Pre-meeting. Source-of-truth for the upcoming conversation. Living document.
**Author:** TCAF / ThriveUp
**Date:** May 14, 2026
**Trigger:** May 13, 2026 email from Dr. Vann asking for "something similar to what you showed for our youth program — track attendance, family structure, and services the families are engaged in."

---

## 1. Who Dr. Vann Is — Three Entities, One Person

Dr. J. Michelle Vann, ThD, DCC, MS, BS — based in Wichita, Kansas. She is the principal of **three** vehicles, and each has a different role in any partnership we structure:

| Vehicle | Type | Programmatic role | Grant-applicant role |
|---|---|---|---|
| **Vanntastic Solutions** | For-profit LLC | Executive wellness coaching, speaking, books for women / couples / leaders. Author of *Stop the Merry-Go-Round*, *Help Along the Journey*, *From Supporting Role to Leading Lady*, *Healthy Plates*. TEDxNewmanUniversity speaker (*Realigning When Life Gets Busy*). | Not grant-eligible. Possible vendor / paid consultant role only. |
| **Sistahs Can We Talk (SCWT)** | 501(c)(3), founded 2015 | BIPOC women's health-disparities nonprofit operating in 29th St N & Grove (80% POC, 68% low-income, 2.5× state liver-cancer rate from Union Pacific groundwater contamination). Free cancer screenings, breast-cancer awareness, counseling, *Healthy Me* initiative, youth mentoring, digital storytelling, quarterly teaching sessions. Partner of Health & Wellness Coalition of Wichita; works with Sedgwick County Health Dept and KDHE. | **Primary KS-side grant applicant.** Should be subrecipient on federal awards we lead and prime on local Wichita Foundation / CDBG / Sedgwick County asks. |
| **Iasis Christian Center** | Pentecostal/Apostolic church, 37+ years | Her husband Pastor William Vann is Senior Pastor; she is "First Lady." Two Wednesday youth tracks: **Joshua Generation (12+)** and **Academy of Excellence (≤11)**, 5:30–7pm, meal + transportation provided. Children's Ministry ages 2–10 during Sunday services. | Not a grant applicant for the federal/state pursuits we'd run jointly. **Programmatic site only.** |

**Other affiliations that matter:**
- **Sedgwick County Mental Health Advisory Board** (seat — real influence on county-level behavioral-health funding)
- KSUN Radio 95.9 — hosts *Spotlight on Business* every Saturday (joint-announcement platform)
- Adjunct prof, Tabor College Wichita; former Dual Credit Coordinator at Friends University
- 20-year veteran of Wichita Public Schools (retired)
- WeKan (Women Entrepreneurs of Kansas), Greater Wichita Ministerial League, Urban Young Life, **community member** of Camp Destination Innovation (founder is Marquetta Atkins-Woods — note for any joint pitch)

**Memory correction:** Prior internal memory placed Dr. Vann in a "wellness coaching / women's mindset" lane only. That is accurate for Vanntastic Solutions LLC alone but understates her by ~70%. The Sistahs Can We Talk + Iasis programs + Sedgwick MH Board seat together represent a substantial community-infrastructure footprint. Treat her as a full nonprofit principal with a county-board seat, not as a coach.

---

## 2. What She's Asking For

> *"Something similar to what you showed for our youth program. I want to be able to track attendance, family structure, and services the families are engaged in."*

Parsed:
- **"Our youth program"** — likely the **Iasis Wednesday youth tracks (Joshua Generation + Academy of Excellence)** because meal + transport + recurring cohort = exactly the data a tracker captures. Possibly augmented by Sistahs CWT youth-mentoring under *Healthy Me*. **Confirm in the meeting; do not assume.**
- **"Attendance"** — recurring weekly cohort, who showed up, streaks, no-show follow-up, meals/transport served.
- **"Family structure"** — household as the unit: parent/guardian, siblings (the 12-year-old's younger sibling is likely in Children's Ministry next door), contact info, relationships.
- **"Services the families are engaged in"** — wraparound view: youth ministry + women's health screenings + counseling + adult education + community-resource referrals. **The family is the unit, not the individual.**

This is exactly the whole-family case-management pattern we already built half of for foster youth — pivoted from a child-protection lens to a community-asset / engagement lens.

---

## 3. What We Already Have (~85% of the plumbing exists)

| Capability she needs | What we have | Where |
|---|---|---|
| Cohort dashboard with stratification + recharts | ✅ live | `foster-youth/state-portal.tsx` |
| CSV bulk upload + validation + sample-download | ✅ live | `/api/foster-youth/agency/cases/bulk-csv` |
| Per-record detail w/ computed score + factor citations | ✅ live | `scoreCase()` in `foster-youth-risk.ts` |
| Attendance tracking (streaks, daily) | ✅ live | `academy/attendance.tsx` + `attendanceLogs` |
| Services-engaged tracking | ✅ live | `engagementDosageLogs` |
| Outcome reporting + CSV export | ✅ live | `/api/outcomes/export/csv` |
| Wellbeing screenings (PHQ-2, GAD-2) | ✅ live | `foster-youth/wellbeing` |
| Resource navigation (Virtual 211) | ✅ live | `/resources` |
| Multi-language (Talk Your Talk) | ✅ live | `<LanguageSelector />` |
| Donor / outcome receipts w/ tamper-evident provenance | ✅ live | `donor-receipt-demo.tsx` |
| Capability-token (IDOR-safe) intake | ✅ live | `authorizeIntake` pattern |
| PPTX leave-behind generation | ✅ live | `pptxgenjs` via `createRequire` shim |

**Three real gaps to ship a Vann-ready product (small):**
1. **Households as a unit** — multi-child, parent linkage, relationship type. Today we track individuals.
2. **Program enrollments (many-to-many)** — person × program × dates. Today we use a single status field.
3. **Per-org isolation enforcement** — `agencyId` column exists; query-layer needs to enforce.

Build = one new tables file + one new routes file + two new pages + sidebar entry. Roughly 8–12 hours of focused work.

---

## 4. The Kansas Funding Landscape — The Mutual-Benefit Case

| Funder | Amount | Requirement | Who applies |
|---|---|---|---|
| **City of Wichita CDBG Public Services** | $50K floor; $475K pool | Evidence-based / proven-model; ZoomGrants portal; 14-member GRC review | **Sistahs Can We Talk** (local, evidence base via *Healthy Me*) |
| **Wichita Foundation Emergency Fund** | rolling, weekly | KS Secretary of State good standing | Sistahs CWT |
| **DanPaul Foundation** | up to $15K | Child welfare / youth | Sistahs CWT |
| **U.S. Bank Community Possible** | varies | DEI-priority | Sistahs CWT |
| **HHS Runaway/Homeless Youth** | federal | 501(c)(3) + SAM.gov | **TCAF lead** + Sistahs CWT named subrecipient |
| **SAMHSA Minority Behavioral Health** | federal | 501(c)(3) + SAM.gov + evidence base | **TCAF lead** + Sistahs CWT subrecipient + Sedgwick MH Board letter of support |
| **HRSA Healthy Start (BIPOC women's health)** | federal | 501(c)(3) + SAM.gov | **TCAF lead** + Sistahs CWT subrecipient |
| **Sedgwick County mental-health discretionary** | county | Local org + board relationships | Sistahs CWT (she's on the Advisory Board) |

**Structurally clean and ethical:** Sistahs CWT has its own 501(c)(3); TCAF has its own (Letter 947). Neither needs to fiscally-sponsor the other. Pure subaward / partnership structure — exactly what the post-Letter-947 / SAM-Active TCAF is now positioned for.

---

## 5. The Mutual-Benefit Case — One Paragraph

Dr. Vann has spent 10+ years building irreplaceable trust in a Wichita community that lives with 2.5× state cancer rates from environmental injustice. She runs a recurring Wednesday youth program with built-in attendance/meal/transport data she wants to capture, and she sits on the Sedgwick County Mental Health Advisory Board. She's stuck on infrastructure — she's emailing late on a Tuesday asking for "something similar to what you showed." TCAF has spent eight months building exactly that infrastructure plus federal-award eligibility (IRS Letter 947, SAM.gov Active, CAGE 209N1), and has zero footprint in Kansas. **The trade:** she gets day-one production infrastructure she'd otherwise need $200K+ to build; TCAF gets its first Kansas anchor partner, two SAMHSA/HRSA-eligible joint proposals with real community trust behind them, and an entry to Sedgwick County mental-health funding through her board seat. Both organizations are post-pending and grant-ready. Both are Black-led. Both center women and youth. This is the kind of partnership the SAM.gov activation was for.

---

## 6. Ecosystem Surfaces to Show

She was specifically impressed by the RFP-match tracker you previously demoed (data → RFP-requirement verbatim crosswalk). The full ecosystem she can plug into:

- **ThriveUp** — workforce, financial literacy, FAFSA, attendance, dosage-engagement
- **Whole-Person Health** (mentalwellnesssupport.net) — behavioral-health screenings (PHQ-9, GAD-7), Medicaid-billable service designs — direct fit for her Sedgwick MH Board lane
- **Bible Study Buddies** — faith-formation curriculum (env: `NETWORK_SECRET_BIBLESTUDY`); direct fit for Iasis Joshua Generation / Academy of Excellence
- **Talk Your Talk** — 89 spoken + 18 sign languages = 107 total, RTL for Arabic; her congregation likely includes Spanish + Vietnamese households in Wichita
- **LifeBridge** — Virtual 211 resource navigation, CHW dispatch
- **SafeReport** — 50-state mandatory-reporter system (relevant if Iasis youth disclose abuse)
- **Sankofa Health Network** — African-diaspora health knowledge layer; pairs with Sistahs CWT's *Healthy Me*
- **HerHealth Network** — Black maternal/women's health hub (env: `NETWORK_SECRET_HERHEALTH`) — direct overlap with SCWT mission
- **Civic Signal** — community-engagement substrate; pairs with her radio platform

The Vann Collaboration Hub page will visualize this ecosystem and let her click into each surface live.

---

## 7. COI / Disclosure Flags

- **Pastor-spouse relationship:** Iasis Christian Center is led by Pastor William Vann (her husband). If joint federal grants collect youth-program attendance data at Iasis, the COI must be disclosed on every federal application's conflict-of-interest section. **Not a blocker** — it's a routine disclosure — but iron-rule honest-disclosure says we flag it visibly inside the platform UI on the Iasis instance, not bury it.
- **BaM Group LLC** — she and her husband co-own a rental management + business consulting company. Routine personal disclosure on federal grants where applicable. Flag.
- **Vanntastic Solutions LLC for-profit:** if SCWT receives funds and Vanntastic provides paid services (coaching, speaking) to grant-funded program participants, those need arms-length pricing + board sign-off, or they need to be excluded from grant scope.

---

## 8. Decisions Anchored (per May 14, 2026 conversation)

- **Customer = both** Sistahs Can We Talk *and* Iasis Christian Center, modeled as two seeded "community partner orgs" in the system.
- **First-grant target = two anchor RFPs** for the storyteller: SAMHSA Minority Behavioral Health (federal — scaling up) + Wichita CDBG Public Services (local — scaling out).
- **Branding** = co-branded but her org names forward; TCAF as quiet infrastructure.
- **Demo mode = both** placeholder cohort + day-one usable empty-shell upload.
- **COI disclosure** = visible card on the Iasis tenant view.

---

## 9. Open Questions for the Conversation

1. Which entity is the customer of the tracker — SCWT, Iasis, or both as separate instances? (Default per build decisions: both.)
2. What does she currently use to track? (Spreadsheets? Paper? Church-management software like Planning Center?) — informs migration story.
3. Who else on her team / volunteer roster will use it? Roles & access.
4. Does she want to plug Bible Study Buddies into the Iasis side?
5. Is she willing to be a named subrecipient on a joint SAMHSA / HRSA proposal in the next 12 months?
6. Does she want her Sedgwick MH Board seat to inform our joint advocacy strategy or stay separate?
7. Any data she already has (member roster, attendance) she'd want to import on day one?

---

## 10. Honest Disclosure (Iron Rule)

Everything in this memo about Dr. Vann is from her public footprint (jmichellevann.com, sistahscanwetalk.com, iccwichita.org, espeakers.com, TEDx, LinkedIn, GreatNonprofits, Anthropocene Alliance) plus her May 13, 2026 email. Nothing is inferred about her data, her donors, her members, or her finances. The TCAF-side capability inventory is from this codebase as of May 14, 2026. The Kansas funding landscape is from City of Wichita / Sedgwick County / foundation public pages as of May 14, 2026 — re-verify before any submission.
