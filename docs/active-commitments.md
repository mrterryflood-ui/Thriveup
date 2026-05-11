# Active Commitments — TCAF / ThriveUp Academy

**Maintained as the live continuity log.** `replit.md` is kept tight (~80 lines) per platform guideline; this file holds the running operational memory that earlier lived in "Cycle L" of `replit.md`. Read at session start. Update at session end.

---

## 🔔 SURFACE TO USER — pending reminders

> **Agent: at session start, scan this section. If the current time is at/past the `surface_after` timestamp, raise the item to the user before doing anything else and clear it once acknowledged.**

| Surface after (UTC) | Topic | Message to deliver |
|---|---|---|
| **2026-05-09T21:00Z** *(set May 9, 2026 ~09:00 UTC)* | **SAM.gov API key** | "You asked me to remind you about SAM.gov in 12 hours. The discovery scanner is currently 401-ing on SAM.gov for lack of an API key — once you add `SAM_GOV_API_KEY` (request free at https://sam.gov/data-services), the daily scan will pick up federal opportunities that we're currently missing. Want me to walk through the request flow?" |

(I cannot push a notification on my own — the platform here doesn't expose a scheduler to me. The honest mechanism is this section + the session-bootstrap protocol that reads it. If we don't open a session in the next 12+ hours, the reminder won't fire on time, but it will still be the first thing I raise whenever you next open the project.)

---

## 📅 Recurring jobs (auto-running)

- **Daily grant discovery scan** — `setInterval` 24h, server-side. Sources: Grants.gov ✅, USASpending.gov ✅, SAM.gov ❌ (needs key), curated state/foundation/corporate, **City of Austin (5 funders, May 9, 2026)**, **Statewide Texas (8 funders: TDHCA, TVC, Hogg, EHF, Meadows, RGK, CFT, TX Bar Foundation — `source='tx_statewide'`, May 9, 2026)**, **Aggregator portals (BidNet Direct + RFP Mart — `source='aggregator'`, May 9, 2026; manual review only, no auto-scrape — paywall/no-API)**.
- **Weekly grant digest email** — *NEW May 9, 2026.* Auto-sends every Monday 8am America/Chicago to the recipient list. **Restart-safe** via DB sentinel row (`grant_alerts.alertType='weekly_digest_sent'`) — no double-send if server restarts inside the 8am window. Default recipient: `terryflood@thrivingcommunitiesforall.com` (Dr. Flood institutional). Override with env var `GRANT_DIGEST_RECIPIENTS` (comma-separated emails). On-request path remains `POST /api/grants/digest/send` (admin-only). Known edge case: if email send succeeds but sentinel write fails, next hourly tick within the 8am window may re-send (bounded to ≤1 hour).
- **BidNet Direct & RFP Mart — manual weekly review reminder** — listed as opportunities with `(recurring scan target)` in the title and explicit "AUTO-SCRAPING NOT WIRED" disclosure in the description. BidNet's TX State & Local subscription is ~$1,500/yr if we want full content access. RFP Mart has free email alerts — recommend setting those up for TX + ecosystem-aligned categories.

---

## 🟢 City of Austin vendor account — APPROVED (May 7, 2026)

- **Status:** Approval email received from Austin Finance Online (VendorReg@austintexas.gov, 512-974-2018).
- **What this unlocks:** TCAF can now respond to City of Austin solicitations directly — AEI, Cultural Arts, APH (Austin Public Health), EDD, AHFC, Public Works, Watershed, etc. No more being shut out at the registration gate.
- **Next operational steps:**
  1. Capture the vendor ID / login credentials in the secure vault (NOT in this repo). Need them for every City RFP/RFQ from now on.
  2. Update Dr. Flood's standing capability statement to add "Registered City of Austin vendor — Austin Finance Online" to the credentials block.
  3. Audit the AEI FY26 Equity Mini Grant submission package — confirm the application form is using the now-active vendor record (not a placeholder).
  4. Subscribe to City of Austin solicitation alerts (AustinFinanceOnline + Austin Bid Search) so we see RFPs the day they post.
- **🚨 Hard rule still applies:** Meredith Sisnett is a City of Austin employee. She MUST NOT appear on any City of Austin grant/proposal/contract as staff, contact, co-lead, board, or partner. Vendor approval does not change this — it makes the rule MORE important, not less, because the conflict-of-interest exposure is now real for live City work.

---

## 📐 Funder fit scoring methodology v1.2026-05-09 (NEW May 9, 2026)

**Reproducible rubric replacing all gut-feel scoring.** Lives in code as the `platform_funder_fit` table + the 6-component aggregation below. Re-runnable any time.

**Score = A + B + C + D + E + F (max 100).**

| Component | Range | Source of truth |
|---|---|---|
| **A. Platform fits** | 0–30 | `platform_funder_fit` table. Each row = one platform↔funder match with citation in `match_basis`. Public_visible platform = 4 pts; non-public = 2 pts. Sum capped at 30 (a single proposal can't credibly lead with more than ~7 platforms). |
| **B. Quintet hits** | 0–40 | Count of fits where `is_quintet_match = true` × 8. Quintet IDs: `speech-bridge` (TYT), `civic-signal`, `lifebridge`, `whole-person-health`, `thriveup-academy`. |
| **C. Cycle favorability** | -5 to +10 | Rolling LOI = +10 · 2+ cycles/yr = +8 · Annual NOFA = +5 · Closed = 0 · Irregular = -5 |
| **D. Match requirement** | -5 to +5 | None = +5 · Cash match = 0 · ESG-style 100% = -5 |
| **E. Award size fit** | 0–10 | $25K–$500K (sweet spot) = +10 · Wider with overlap = +5 · Sub-$25K only = 0 |
| **F. Geographic eligibility** | -10 to +5 | Statewide TX, no penalty = +5 · Statewide but other-region preference = 0 · Out-of-area = -10 |

**Honest results, statewide TX 8 funders (May 9, 2026):**

| Rank | Funder | A | B | C | D | E | F | Total |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| 1 | Meadows Foundation | 30 | 40 | 10 | 5 | 10 | 5 | **100** |
| 2 | Episcopal Health Foundation | 30 | 32 | 10 | 5 | 10 | 5 | **92** |
| 3 | Hogg Foundation for Mental Health | 30 | 32 | 8 | 5 | 10 | 5 | **90** |
| 4 | Communities Foundation of Texas | 30 | 32 | 5 | 5 | 10 | 0 | **82** |
| 5 | TVC FVA | 30 | 24 | 5 | 5 | 10 | 5 | **79** |
| 6 | RGK Foundation | 18 | 24 | 10 | 5 | 10 | 5 | **72** |
| 6 | Texas Bar Foundation | 20 | 32 | 5 | 5 | 5 | 5 | **72** |
| 8 | TDHCA Community Affairs | 16 | 24 | 5 | -5 | 5 | 5 | **50** |

**Disclosed correction:** TVC FVA was scored 95 in my Round-1 narrative (claimed 5/5 quintet). The `platform_funder_fit` table shows only **3/5 quintet platforms** have explicitly veteran-tagged capabilities in the live DB (WPH, LifeBridge, TYT). ThriveUp Academy and Civic Signal touch veterans narratively but lack the DB-tagged veteran capability — so the honest data-backed score is 79, not 95. TVC drops from rank #2 → rank #5. M2C's veteran specialization is captured in component A (it's one of the 8 vet-tagged platforms), not B.

**Cadence #1–#3 status (May 9, 2026):**
- ✅ #1 Push data-backed fit scores into `grant_opportunities.fit_score` — 8 rows, written through `samgov_notice_id`.
- ✅ #2 Tabbara prior-award research on top 4 funders → `docs/grants/Tabbara-Top4-Intel.md` (Meadows $24.1M/160 awards 2024 · TVC $44.2M/181 grants FY24 · EHF $37.9M/156 awards 2024 · Hogg PPF/PFG/HPA concluding 2026, RFF active). Named officers identified for EHF (Cindy Lucia, Patrick Moreno-Covington); Hogg portal `hogg.fluxx.io`.
- ✅ #3 `platform_funder_fit` table built (`shared/schema.ts` lines 4744-4762), `npm run db:push` applied, 66 fit rows seeded for 8 funders.
- ⏳ #4 BidNet Direct + RFP Mart credentialed scrapers — secret request opened to user (BIDNET_USERNAME/PASSWORD/SAVED_SEARCH_URL, RFPMART_USERNAME/PASSWORD).

**Future re-runs:** to re-score after platform changes, re-populate `platform_funder_fit` from the live `ecosystem_platforms` table, then aggregate via the SQL in this section. No gut.

---

## ✅ AEI FY26 Equity Mini Grant — SUBMITTED (May 7, 2026)

- **Status:** Application **submitted** via aei.grantplatform.com on May 7, 2026 (3 days ahead of the May 10, 11:59 PM CST deadline). Confirmation email received from City of Austin Equity & Inclusion (equity@austintexas.gov).
- **What was submitted:** Tab 1–7 of `docs/grants/AEI-FY26-Application-Responses-FINAL.md` — Project: "Talk Your Talk: Language-Accessible Navigation for Austin's Eastern Crescent," Category: Immigrant & Refugee Services, Ask: $25,000 over 12–15 months.
- **Narrative attachment:** `docs/grants/AEI-FY26-Equity-Mini-Grant-Narrative.md` (cleaned May 7 — corrected "89 spoken + 18 sign = 107 total" formula in 6 places; replaced stale "22-platform ecosystem" framing with the now-stronger "approved City of Austin vendor as of May 7, 2026" lede).
- **Optional Tab 5/6 "share more" section:** Drafted in chat, may or may not have been pasted in (Dr. Flood's call). Includes APOC volunteer-service disclosure framed for transparency.
- **🚨 Confirmation email contains a date typo:** Says applicants will be notified "by **late June 2024**" — this is an AEI portal template bug (year not updated). Real expected notification window: **late June 2026**. Don't be alarmed; don't email equity@ to ask unless other applicants are also confused.
- **Award notification expected:** Late June 2026.
- **If NOT awarded:** AEI offers debrief / coaching session with Equity & Inclusion staff — take it. Free intelligence for the next City of Austin RFP.

### Post-submission follow-ups
- [ ] Subscribe to AEI portal email broadcasts in user profile (per confirmation email).
- [ ] Send partner outreach emails (`docs/grants/AEI-Partner-Outreach-Email-Template.md`) — letters of support strengthen the application even if attached late, and they build the coalition independent of award outcome.
- [ ] Calendar reminder: late June 2026 — check for award decision.
- [ ] Calendar reminder: if awarded, Community Advisory Circle must be seated in Month 1 per Q3 commitment.

---

## Funding sources EVALUATED & EXCLUDED (don't re-evaluate)

| Source | Evaluated | Verdict | Why |
|---|---|---|---|
| **DANA Foundation** (Italian, RUNTS-registered) | May 8, 2026 | ❌ Geographic mismatch | Funds locally led development in the Global South; TCAF is US/Texas-based serving US residents. AI-screened intake calibrated against Global South community orgs. |
| **globalsouthopportunities.com** (the aggregator site) | May 8, 2026 | ❌ Whole-site mismatch | Site explicitly serves "marginalized communities, particularly in the Global South." Sampled funding listings (Beyond Borders Scotland, ICRISAT, IGAD, AfCFTA) all geographically restrict to Global South orgs. Not worth monitoring for TCAF pipeline. |
| **Mérieux Foundation Small Grants Program** (via fundsforngos.org) | May 9, 2026 | ❌ Geographic mismatch | Schema.org metadata on the listing page tags it for ~30 Global South countries (Bangladesh, Benin, Brazil, Burkina Faso, Cambodia, Cameroon, Chad, Congo, Cote d'Ivoire, Egypt, Haiti, Iran, Iraq, Laos, Lebanon, Madagascar, Mali, Morocco, Myanmar, Niger, Senegal, Tunisia, Vietnam, etc.). Same pattern as DANA. TCAF ineligible. |
| **fundsforngos.org "60 funding programs" listing** | May 9, 2026 | ⚠️ Cloudflare-blocked + Premium-paywalled | Page is gated by ShopShield + their paid membership. Site's primary audience is "NGOs in the Global South." Sampled entry (Mérieux) confirmed geo-restricted. Not worth scraping; revisit individual entries case-by-case if user flags one. |

## Funding sources to PRIORITIZE for TCAF pipeline

SAM.gov · Grants.gov · Texas Workforce Commission · St. David's Foundation (active engagement) · RWJF · **City of Austin Austin Bid Search + AustinFinanceOnline (now reachable as approved vendor since May 7)** · Travis County/CapMetro/AISD RFPs · Foundation Directory Online (Candid) · Inside Philanthropy + Philanthropy News Digest · Bloomberg/MacArthur/Ford/Knight/Gates (issue-area RFPs).

---

## Pipeline tracker (built May 9, 2026)

**The discovery engine was already automated** — daily 24-hour scan of SAM.gov + Grants.gov + USASpending.gov + curated state/foundation feeds. ~580 opportunities tracked, ~54 new/week. Audit reveals:

### What's automated (was already running before today)
- Daily scan cron in `server/grant-routes.ts:6359`
- AI fit scoring + alert generation (`grant_alerts` table, 32 high-fit alerts logged)
- 39 keyword domains scanned (workforce, BH, reentry, veteran, AI, maternal, etc.)
- Status endpoint: `GET /api/grants/discovery/status`
- Manual trigger: `POST /api/grants/discovery/run-now`

### What was MISSING and got built today (May 9, 2026)
- **"This Week" tab** in `/grant-command-center` — first tab, default view
  - Shows last-N-days new opps (1/3/7/14/30 day window, configurable)
  - Min-fit filter (all / ≥40 / ≥70)
  - Fit distribution stat cards + by-source breakdown
  - "Upcoming deadlines (act fast)" list with days-remaining urgency badges
  - "Refresh" + "Preview Email" actions
- **API endpoints:**
  - `GET /api/grants/this-week?days=N&minFit=N` — JSON of new opps + stats
  - `GET /api/grants/digest/preview?days=N` — rendered HTML preview of email digest
  - `POST /api/grants/digest/send` — admin-only manual trigger, body `{to: "email", days: 7}`
- **Email digest scaffolding** — uses Resend (already wired). Includes Tabbara-discipline reminder block.

### Still NOT built (need user input or larger scope — propose next session)
- [ ] **Auto-cron weekly email digest** — needs (a) recipient address confirmation (Dr. Flood `terryflood@thrivingcommunitiesforall.com`?), (b) preferred send day (Monday morning?). Ready to flip on with one config change.
- [ ] **SAM.gov API key** — currently throwing 401 on every keyword (visible in logs). Without it, ~30 federal sources are dark.
- [ ] **City of Austin Austin Bid Search source** — would scrape https://www.austintexas.gov/financeonline/finance/bid_search.cfm (now reachable as approved vendor since May 7).
- [ ] **Saved searches** — custom user-defined keyword + region + amount triggers (schema add).
- [ ] **Tabbara prior-awards UI workflow** — DB fields exist (`priorAwardsReviewed`, `priorAwardsCount`, etc. on `proposalPipeline`), no UI to enforce review-before-draft yet.

### Original active items (kept for partner pipeline reference)

- **Partner outreach template:** `docs/grants/AEI-Partner-Outreach-Email-Template.md` — ready to send.
- **Letters of support folder:** `docs/grants/AEI-letters-of-support/` (create when first letter arrives).

### AEI Partner Pipeline — Meredith referrals (received May 5, 2026)

Filed in send-priority order in `docs/grants/AEI-Partner-Outreach-Email-Template.md`:

| # | Org | Contact | Why prioritized |
|---|---|---|---|
| 1 ⭐ | El Buen Samaritano | **Georgia Hernandez** (`ghernandez@elbuen.org`) | **Only named contact.** Warm-intro path. ESL + health ed + digital literacy + family services. SEND FIRST. |
| 3 | Foundation Communities | (no named contact yet) | ESL + childcare + housing + financial wraparound. Strongest fit for AEI "support stability" priority. |
| 5 | AVANCE-Austin | (no named contact yet) | Two-generation model, parents + children, ESL + workforce + financial literacy. |
| 7 | Literacy Austin | (no named contact yet) | Adult literacy + ESL, volunteer tutoring, lowest-income residents. |
| 11 | Sixth Square | Daphne McDole | **Meredith making the intro herself.** Wait for warm handoff. |

**Outstanding to Meredith:** thank-you + ask for named contacts at Foundation Communities, AVANCE, and Literacy Austin to convert cold leads to warm intros.

---

## Speech Bridge / "Talk Your Talk" — bound custom domain

- **Custom domain `talkyourtalk.net` is BOUND and verified** (May 5, 2026, registered through Replit). Hub DB `ecosystem_platforms.url` for `speech-bridge` updated to `https://talkyourtalk.net`. Scanner fallback updated.
- AEI narrative §3 + §8 and partner-outreach template all cite `https://talkyourtalk.net`.
- **`lexibridge.net` is NOT the bound domain** — earlier internal references were a naming error and have been corrected throughout grant materials.
- Verified live capability: 107 languages + 18 sign languages, dialect-aware, real-time interpretation, document explainer, crisis detection.

---

## Ecosystem Alignment Scan — May 5, 2026 (post-binding)

Run via `scripts/ecosystem-alignment-scan.sh`. Re-run anytime alignment is in doubt.

- **15 LIVE / 9 UNBOUND** custom domains (24 platforms total).
- **LIVE:** ad-targeting, betterscience, collaborative-advocate, isss, lifebridge, m2c, mce, perfectly-different, safecognicare, safereport, sankofa, sankofa-maternal-health, sankofa-mens-health, **speech-bridge** (now at `talkyourtalk.net`), whole-person-health.
- **UNBOUND** (apps may still be alive at `.replit.app`): autoimmune-thrive, code-canvas, ecosystem-nexus, emergency-mgmt, pillscheduler, pinnacle-business-conglomerate, sankofa-feminine-health, video-creator-ai, wholemind.
- Known `.replit.app` fallbacks recorded in scanner: ad-targeting, mce (`black-business-hub.replit.app`), pinnacle-business-conglomerate, emergency-mgmt.

---

## TCAF / The Collaborative Advocate — legal status (RECONCILED May 5, 2026)

- **EIN 41-3618003 is permanent and confirmed** by President Flood. Source: `attached_assets/Agency_Fund_EOI_Collaborative_Advocate.md`.
- **501(c)(3) tax-exempt determination letter is still pending with the IRS** (IRS backlog, not a TCAF issue). Tracking 281OIP7B, filed 4/27/2026. Both facts coexist.
- For grant applications: cite EIN 41-3618003, classify as **501(c)(3) application pending IRS determination**, and where required offer fiscal sponsorship via Abundant Life Church.

---

## Next-thread queue

- **NSF SBIR/STTR (after AEI ships):** User attended BBCetc/CT-DECD presentation. ISS = for-profit entity. STTR with private nonprofit research institute partner is the path. Project Pitch is the gate. Submission windows: 1st Wednesday of March / July / November. Phase I = $305K / 6–18 months. Pick NSF topic code together when AEI is in.
- **AEI submission day (May 8):** Assemble final package; confirm portal account; upload ≥1 partner letter; submit.

---

## AEI Funder Intelligence — applied May 5, 2026 (Tabbara discipline)

Full brief at `docs/grants/AEI-Funder-Intelligence.md`. Key adopted findings:

- **Funder = City of Austin Equity Office.** Annual program since 2018; FY26 cycle Apr 17 – **May 8, 2026** (11:59 p.m. CT); ceiling $25K; ~8 awards.
- **FY26 single focus = immigrant + refugee inclusion** (narrower than FY25's three-track structure).
- **Coalition framing is explicitly bonus-scoring.** Direct quote from program page: *"If a project is working to build coalitions in partnership with other organizations addressing the same issue, it would be an even stronger candidate for a mini grant award."* Now quoted verbatim in narrative §6.
- **Grassroots / ≤$500K preference** addressed head-on in narrative §8 (new paragraph) — TCAF positions itself as infrastructure anchor for the 11-CBO grassroots coalition.
- **Mercury Grants portal** (written or video, English or Spanish).
- **Post-award commitments**: Equity Office trainings + site visit + Equity Action Team participation + final report.
- **Vendor registration with City of Austin** required *before disbursement*, not before submission. 501(c)(3) status not required.
- **Open action**: email `equity@austintexas.gov` to request FY24/FY25 awardee list (no public index available).
- **Info sessions Apr 25 + Apr 28** already passed; the FY26 Playbook (English / Spanish, on Google Drive from official program page) is the authoritative spec.

## Lesson committed to playbook

`docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md` lessons #18, #19, #20 added: AEI coalition-bonus rule, Tabbara-discipline-mandatory-for-all-grants rule, City of Austin 501(c)(3)-not-required rule.

---

## AEI Outreach Outcomes — May 7, 2026

**El Buen Samaritano (Georgia Hernandez):** Polite decline on letter of support. **Important: El Buen is also submitting under this same FY26 procurement** — direct competitor this cycle. Door open for future collaboration if TCAF is funded or pursues future opportunities. Narrative §6 updated for transparent disclosure (El Buen moved off ⭐ priority and into honest "also submitting under this procurement" note); ⭐ markers removed from list (no formal lead partner confirmed yet).

**Lesson:** Listing a direct competitor as ⭐ priority partner in a competitive grant would have been an integrity risk. AEI reviewers may cross-reference applicant-listed partners against other submissions in the same cycle. **Going forward: confirm partner is NOT submitting separately before claiming them as anchor partner.**

**Other 4 outreach contacts (Foundation Communities, AVANCE, Literacy Austin, Multicultural Refugee Coalition):** No response yet at time of submission. Coalition list of 10 stands on its own merit (named-intent commitment, not claimed signed partners).

---

## Jim Currier, MSW — meeting in a few days (May 8–10 window)

**Source:** LinkedIn 1st-degree connection (new), Austin TX-based.

**Role:**
- Director of Youth Housing & Employment
- National Foster Youth to Independence (FYI) Program Implementation Leader
- Child Welfare Housing Policy Expert
- Youth Homelessness Prevention Advocate

**Background:** Systems-focused leader, 25+ years at the intersection of child welfare and housing. Centered on preventing homelessness for youth transitioning out of foster care.

**Why this matters strategically for TCAF:**
1. **National FYI Program** = HUD's Foster Youth to Independence voucher program — federal housing assistance for youth aging out of foster care, administered through Public Housing Authorities. Jim leads national implementation = direct line to HUD/HHS/Children's Bureau funding flows.
2. **Austin-based 1st-degree connection** in a niche we already serve (LifeBridge, ISSS, Whole-Person Mental Health, ThriveUp Academy financial literacy, FAFSA navigator) but have no senior advisor in.
3. **Letter-of-support / advisor candidate** for HHS/HRSA, HUD, Children's Bureau, and SAMHSA grants where youth transition is in scope.

**TCAF surface area that aligns with Jim's work:**

| TCAF asset | Direct alignment with Jim's domain |
|---|---|
| **LifeBridge / Life Transitions Aid — Youth Homelessness Program (built and live)** | **This is the lead alignment.** A full youth-homelessness module already deployed inside LifeBridge — exactly the domain Jim leads nationally. Not a future plan; a built program. Open this first in the meeting. |
| **LifeBridge — resource navigator + CHW dispatch** | The warm-handoff infrastructure foster youth lack at age-out: 20,000+ verified resources across housing, food, healthcare, ID/documents, employment |
| **Whole-Person Mental Health Ecosystem** | Trauma-informed, multilingual; foster-experienced youth carry disproportionate trauma load |
| **ISSS (K-12 multi-tiered supports)** | Many foster youth need IEP/504 advocacy; ISSS infrastructure already deployed in districts |
| **Perfectly Different** | Neurodiversity / IEP-504 navigation — overrepresented in foster population |
| **ThriveUp Academy** | Financial literacy + workforce readiness — exactly what FYI youth need at independence |
| **FAFSA navigator + apprenticeship tracker** | Foster youth have specific FAFSA pathways (independent student status, ETV); we already build this |
| **Talk Your Talk** | Multilingual support for youth in mixed-status families and refugee youth in foster care |

**Critical meeting move:** Lead with the LifeBridge Youth Homelessness Program. Jim runs national FYI implementation — he sees pitches every week. What he doesn't see is a *built and operating* youth-homelessness platform run by an Austin-based organization. That changes the conversation from "let me tell you about our concept" to "let me show you what's already running and ask where it's missing pieces you'd want to see."

**Suggested meeting posture (per user's "short, plain English" preference):**
- Listen first — let Jim describe what's broken in FYI implementation
- Show, don't tell — pull up LifeBridge live, walk the resource navigator + CHW dispatch
- Ask one specific ask, not five — best ask = "Would you be willing to advise TCAF on how our infrastructure could plug into FYI implementation, and where the federal funding pathways are we should be tracking?"
- Defer the letter-of-support ask to a second meeting, if at all — first meeting builds the relationship

**Federal grants where Jim becomes a strategic asset:**
- HUD FYI program / Continuum of Care
- HHS Children's Bureau (Chafee Foster Care Independence)
- SAMHSA youth-serving programs
- NSF SBIR/STTR (next on TCAF queue) — youth tech as a vertical

---

## Top-5 Grants Memo Generated — May 7, 2026

Full memo: `docs/grants/Top-5-Grants-To-Pursue-Today.md`. Synthesizes 24-platform ecosystem against currently-open NOFOs.

**The 5 (priority order):**
1. **HRSA RCORP-Planning (HRSA-26-036)** — posted 4/29/2026, OPEN. Combines LifeBridge + Whole-Person MH + PillScheduler + Talk Your Talk + SafeCogniCare + M2C. Need rural multi-county consortium (Bastrop/Caldwell/Lee).
2. **St. David's Foundation Community Driven Change** — open cycle, $100M+/yr funder, Travis County. Sankofa BirthRight + TheHealthyBlkMan + Whole-Person MH + LifeBridge + Perfectly Different. Convert "actively evaluating" → first formal LOI.
3. **NIH R03 PA-25-302** — June 16 deadline (40 days). Pair with NIMHD/NIMH NOSI on multilingual behavioral health screening. Whole-Person MH + Talk Your Talk + LifeBridge.
4. **NSF SBIR/STTR Phase I — Project Pitch** — reopening imminently. Submit pitch this week (2 pages, 21-day decision). Must use STTR pathway (TCAF is 501c3). LifeBridge + Talk Your Talk + Whole-Person MH + ISSS + Code Canvas as the AI synthesis story.
5. **VA GPD FY2027 — Service Center NOFO** — open. M2C + LifeBridge youth homelessness module (novel "foster-to-veteran continuity" angle) + Whole-Person MH + PillScheduler. Jim Currier potential LOS source for round 2 meeting.

**TODAY actions surfaced by memo (regardless of which 5 prioritized):**
- ☐ Verify SAM.gov TIN status is clean (blocker for #1/#3/#4/#5)
- ☐ Submit NSF Project Pitch this week
- ☐ Begin Bastrop/Caldwell/Lee CBO outreach for RCORP consortium
- ☐ Open formal St. David's CDC conversation
- ☐ Call Austin VA Medical Center Homeless Programs office for GPD intro

**Excluded with reasoning** (full list in memo): HUD FYI competitive (no FY26 NOFO), SAMHSA NCTSI III (current grants run to 2028), CDC REACH (mid-cycle), CDMRP family (pre-announcement), MBDA CRP (no 2026 NOFO), RWJF LDEC (closed 3/3), DOL Apprenticeship (closed 4/3), Title IV-A (LEA-only).

---

## URLs & Requirements Pulled — May 7, 2026 (CORRECTION TO TOP-5)

Full reference: `docs/grants/Top-5-Grants-URLs-and-Requirements.md`

**CORRECTION:** VA GPD FY2027 (PDO + Service Center) deadline was **Feb 18, 2026 — already closed**. Removed from active-apply list. Demoted to FY2028 prep track (open VA Medical Center conversation now, Jim Currier as advisor candidate, submit Feb 2027 cycle).

**REPLACEMENT #5: HRSA-26-037 RCORP-Impact** — confirmed OPEN, posted 4/29/2026, deadline **June 1, 2026**, $750K/yr × 4yrs ($3M total), $60M program / ~80 awards. Same CFDA family as RCORP-Planning. Requires multi-sector consortium (≥3 separately-owned partners, ≥50% rural).

**Verified deadlines for the corrected 5:**
1. HRSA-26-036 RCORP-Planning — **May 29, 2026** (22 days)
2. St. David's Community Driven Change — May 2026 cycle, LOI dates being finalized
3. NIH PA-25-302 R03 — **June 16, 2026** (40 days)
4. NSF SBIR/STTR Project Pitch — rolling, reopening in coming weeks
5. HRSA-26-037 RCORP-Impact — **June 1, 2026** (25 days)

**Critical infrastructure blocker (one fix unblocks 4 of 5):** SAM.gov / TIN registration must be active and clean. Verify TODAY at https://sam.gov before doing anything else on grants #1, #3, #5 (and #4 via STTR partner).

**Other registrations needed:**
- Grants.gov organizational registration → unblocks #1, #3, #5
- eRA Commons (Dr. Flood as PI, TCAF as Signing Official) → unblocks #3
- NSF Research.gov / SBIR portal (small-business partner registers as prime) → unblocks #4

**NSF STTR pathway clarified:** TCAF as 501(c)(3) cannot lead pure SBIR. Must use STTR with for-profit small-business prime (40%+ work) + TCAF as research partner (30%+ work). Pinnacle Business Conglomerate is candidate prime; or external partner.

---

## Lesson — May 7, 2026 (mid-AEI submission)
**Don't ask the user for facts already in memory during live submissions.** When user is filling out a vendor portal / W-9 / SF-424 in real time, pull every field from this file and `AEI-FY26-Equity-Mini-Grant-Narrative.md` and present a complete, fillable answer — not a template with blanks.

**TCAF Submission-Ready Quick Reference (use for ALL future grant fields):**
- **Legal name:** The Collaborative Advocate Foundation
- **DBA:** TCAF
- **EIN:** 41-3618003
- **501(c)(3):** Pending — IRS Tracking 281OIP7B, filed 4/27/2026
- **Address:** 17912 Stefano Drive, Pflugerville, TX 78660 (Travis County)
- **President / Signer:** Dr. Terry Flood, DHA
- **Federal tax classification on W-9:** "Other" → "Nonprofit corporation — 501(c)(3) determination pending (IRS Tracking 281OIP7B)"
- **Fiscal sponsor (backup if 501(c)(3) status blocks):** Abundant Life Church
- **City of Austin Vendor Code:** TBD — register at https://financeonline.austintexas.gov
- **SAM.gov UEI:** TBD — verify status before federal grants (#1, #3, #4, #5 from top-5)

---
## AEI FY26 Submission — May 7, 2026 update

- **Live deadline confirmed:** Sunday May 10, 2026 11:59 PM CST (portal countdown is source of truth; published "May 8" was extended without page-text update)
- **Portal:** aei.grantplatform.com (Good Grants platform, NOT Mercury Grants — earlier assumption was wrong)
- **Logged in:** Terry Flood ✅
- **Application file:** docs/grants/AEI-FY26-Application-Responses-FINAL.md (paste-ready, all 7 tabs)
- **Confirmed by user:** No prior City of Austin funding (+15 bonus); apply as TCAF directly (not fiscal sponsor); budget under $500K (small-org preference)
- **Estimated score:** 106-114 / 115
- **Vendor registration deadline:** May 15, 2026 — must be ACTIVE not just submitted
- **Outstanding before submit:** phone numbers + institutional emails for Dr. Flood and Meredith Sisnett (do NOT use personal Gmail)

---
## 🚨 PERMANENT RULE — Meredith Sisnett & City of Austin

**Meredith Sisnett is a City of Austin employee.** She is therefore ineligible to be listed on ANY City of Austin grant, proposal, contract, or related material — including AEI Equity Mini Grants, Cultural Arts, APH, EDD, Public Health, AHFC, or any other City-funded opportunity.

**She may serve as an external consultant on NON-City projects only** (federal, state, foundation, private).

**Hard rule for all future sessions:**
- ❌ DO NOT list Meredith on any City of Austin application as staff, contact, co-lead, board member, or partner
- ❌ DO NOT include Meredith CV/bio/letters of support in any City of Austin submission packet
- ✅ Always confirm "is this a City of Austin opportunity?" before adding Meredith to any document
- ✅ When unsure, leave Meredith out and ask user

**AEI FY26 application updates made May 7, 2026:**
- Removed Meredith from AEI-FY26-Application-Responses-FINAL.md (field 2.10 now blank)
- Removed Meredith from AEI-FY26-Equity-Mini-Grant-Narrative.md Section 8 (org capacity)
- terryflood@thrivingcommunitiesforall.com is the ONLY listed institutional email on AEI application

**Confirmed institutional emails:**
- terryflood@thrivingcommunitiesforall.com (Dr. Flood — primary on all proposals)
- msisnett@thrivingcommunitiesforall.com (Meredith — for NON-City work only)

---
## Dr. Terry Flood — Confirmed Contact Info (May 7, 2026)

- **Phone:** (254) 319-8460
- **Email:** terryflood@thrivingcommunitiesforall.com
- **Title:** President, TCAF
- **Use on:** All grant proposals, partner outreach, City of Austin materials, federal/state/foundation submissions

---
## Dr. Flood — Calendar Booking Link (May 7, 2026)

**Booking URL:** https://calendar.google.com/calendar/appointments/schedules/AcZssZ2O1JcnlDSXEidpWJKtc02RF37MRUytN66JNOkHDRxDParffIH6eSlbRe0DVXUbfpJwGFRp2bFG?gv=true

**Embed snippet (HTML):** Available; ask if needed.

**Pending decisions:**
- Add to AEI application primary contact?
- Add to partner outreach templates?
- Embed on which website(s)?
- Personal vs. TCAF-shared calendar (affects public exposure)?

**Status (May 6, 2026):** Embedded on home page (`client/src/pages/landing.tsx`), section `section-book-appointment`, placed between Deep Dive and footer. Button opens calendar in new tab.

**⚠️ Spotted while editing landing.tsx — flag for later (NOT changed):**
- Footer contact email is `president@thecollaborativeadvocate.org` (line 895). Per current institutional-email rule, public-facing email should be `terryflood@thrivingcommunitiesforall.com`. Decide whether to swap or keep both.
- Footer brand text reads "The Collaborative Advocate Foundation 501(c)(3)" (line 869). Per honest-disclosure rule, TCAF 501(c)(3) is **pending IRS determination** (Tracking 28101P7B, filed 4/27/2026) — sidebar already says this correctly, but footer reads as if final. Worth aligning.

**Resolved (May 6, 2026):**
- Footer email swapped: `president@thecollaborativeadvocate.org` → `terryflood@thrivingcommunitiesforall.com`
- Footer 501(c)(3) line softened to "501(c)(3) status pending IRS determination" (matches sidebar)

---
## Legal Platform — power2thepeople.net (May 6, 2026)

- **Live URL:** https://power2thepeople.net (custom domain, verified)
- **Replit repl:** civic-signal-pwa.replit.app
- **Status:** NOT YET registered in `ecosystem_platforms` table — needs to be added once user provides the canonical name + role + domain + capabilities.
- **Known so far:** Legal-services platform; user said "more robust than ever." Will be covered in a separate session.

**To-do when user is ready:**
1. Get canonical name (working name = "Power 2 The People" / civic-signal)
2. Add row to `ecosystem_platforms` with role/domain/description/capabilities/grant_alignment
3. Add to outbound pinger list
4. Write the unified grant-narrative trio (LexiBridge + LifeBridge + Power2ThePeople) covering communication access + SDOH navigation + legal services for OJJDP, BJA Second Chance, SAMHSA reentry, HRSA, DOL WIOA grants

---
## Three-Platform Deep Read (May 6, 2026)

### Civic Signal — power2thepeople.net
- Civic intelligence terminal. NOT legal aid. Apolitical, primary-source only.
- 18 routes: Dashboard, Feed, Bills, Courts, Regulations, Reps, Vote, Prepare, Dormant Laws, Repealed, Policy Stories, Ask AI, Search
- Live Civic Feed (verified counts today): 1,448 court items · 880 ordinances · 360 meetings · 74 repeals · 69 bills · 41 regs · 32 CBO estimates
- Prepare = 10-step "affairs in order" wizard (caringinfo.org + ready.gov sources, explicit "not legal advice" disclaimer)
- 60-second onboarding: register-to-vote, prepare-wizard, ask-AI
- Robots.txt blocks GPTBot + ChatGPT-User (responsible AI stance)
- Best grant fits: Knight Foundation (civic info), Democracy Fund, NSF Civic Innovation, FEMA Whole Community, NIJ/BJS court transparency, Mozilla/Ford public-interest tech

### LifeBridge — lifetransitionsaid.org
- Virtual CHW with named AI persona "Julia" + 24/7 crisis-line banner (988, DV, NAMI, SAMHSA, Crisis Text, 211)
- Resource Locator: 2,935 indexed resources (verified today), filterable by ZIP/state/area-type/faith/charity/needs/category
- 5 service lines (CRITICAL — not just 211):
  1. I Need Help Now — Find Resources, Talk to Julia, Crisis Help
  2. **Foster Youth Aging Out** — Toolkit, Transition Plan, Wellbeing Check-in, My Rights, State Benefits  ← MAJOR SPECIALTY
  3. Caregivers & Families — New Guardians & Foster Parents, **Family Reunification**, Partners (Foster Care)
  4. Wellness & Healing — SSB Hub, Healing & Education, Self-Assessment, Safety Plan
  5. Local & Community — Austin Housing, MAP-GAP, Community Explorer, Library Search
- Bilingual EN/ES
- **REFRAME for grants:** This is a Chafee Foster Care Independence Program tool, not just a 211. Major HHS/ACF grant angle.
- Best grant fits: HHS/ACF Chafee, HRSA CHW training, SAMHSA crisis services, HUD CoC, USDA SNAP-Ed, DOJ OVW, St. David's (Foster Youth angle), SSG Fox

### ThriveUp Academy — thrivingcommunitiesforall.com
- Schema.org markup declares EducationalOrganization with **5-course AI Mastery Curriculum** mapped K-12: AI Explorer (3-5), Guide (3-5), Architect (6-8), Innovator (9-10), Master (11-12) — TEKS-alignable
- Marcus persona is the strongest reentry narrative across all our materials: foster youth → incarcerated → reentering, "Borders aren't real, but laws and policies are"
- 10 service domains in sidebar; Texas as St. David's pilot deployment (national framing)
- Footer 501(c)(3) wording correctly reads "status pending IRS determination" (just fixed)
- Robots.txt blocks GPTBot + ChatGPT-User (matches Civic Signal stance)
- Best grant fits: AEI (in flight), WIOA Title I Youth & Adult, OJJDP/BJA Second Chance (Marcus narrative), DOE i3/EIR (AI K-12 curriculum), NSF ITEST / CS for All, Knight/Lumina/Strada, St. David's (active evaluation)

### THE TRIO NARRATIVE (use in federal proposals where integrated service delivery is scored)
| Platform | Barrier removed | Who feels it most |
|---|---|---|
| Civic Signal | Can't see/understand/influence government | Returning citizens, low-income, rural, LEP |
| LifeBridge | Can't navigate the safety net | Foster youth aging out, families in crisis, vets in non-combat life events |
| ThriveUp Academy | Can't build skills for the new economy | Under-resourced learners of all ages |

TCAF is the only operator addressing all three non-clinical drivers — civic exclusion, navigation failure, skills gap — with one shared identity, one data layer, one outcome metric set.

---
## LexiBridge Evaluation Attempt — BLOCKED (May 6, 2026)

**Status:** Could not evaluate live. `lexibridge.net` does not resolve in public DNS ("Could not resolve host"). Tested both apex and www, http and https — all HTTP 000.

**Hub data inconsistency found:**
- `ecosystem_platforms.health_status` was reading "online" but `last_heartbeat = 2026-03-22` (6+ weeks stale)
- This is the false-positive case from our gotcha: pinger marks "online" even when DNS fails
- **Action taken:** Set `health_status = 'unknown'` and appended scan note to description
- **Bug to fix later:** Pinger should not mark a platform "online" when DNS resolution fails or heartbeat is >7 days old

**No alternate URL found in workspace:** No code references to a Replit-hosted fallback URL for LexiBridge.

**Awaiting from user (any one):**
- Correct public domain (lexibridge.com / .org / .ai / speechbridge.net / etc.)
- Replit deployment URL (e.g. lexibridge--mrterryflood.replit.app)
- Screenshot of live home page

**Pre-evaluation registry summary (NOT VERIFIED against live build):**
- Dialect-aware comms platform: AAVE, Spanglish, Cajun, Appalachian + 12 dialects
- Multi-language: EN/ES/Vietnamese/Mandarin/Arabic
- Provider cultural-responsiveness coaching, health-literacy adaptation
- Reported metrics: 4,567 dialect recognitions; 2,345 translations; 890 health-lit adaptations
- Grant alignment: HRSA LEP, ACL accessibility, St. David's, SSG Fox, WIOA accessibility

---
## Talk Your Talk (formerly LexiBridge / Speech Bridge) — DEEP READ (May 6, 2026)

**URLs:** talkyourtalk.net (custom, verified) · speech-bridge-mrterryflood.replit.app (repl)

### What changed from the registry
- **REBRANDED:** LexiBridge → Talk Your Talk · "Your Voice, Understood."
- **DOMAIN MOVED:** lexibridge.net (DNS dead) → talkyourtalk.net (live, HTTP 200)
- **MASSIVE EXPANSION:** 5 languages → 107 spoken languages + 18 sign languages
- **NEW CAPABILITIES:** crisis detection · PWA offline phrase boards · passwordless email auth · accessibility menu in global header

### The thesis (most important part)
*"Not a chatbot. Not a keyboard. A translation layer between **lived language and institutional language**."*
This is register-to-register, not language-to-language. That single framing is the strongest grant-narrative hook in our entire stack.

### Verified live (May 6, 2026)
- Homepage: "Your Voice, Understood." hero · email sign-in gate · install prompt · Accessibility + EN/ES toggle in header
- PWA manifest: name "Talk Your Talk" · theme #D46A43 (terracotta) · bg #FAF7F2 (cream) · categories ["communication","accessibility","education"]
- Inner routes (/about, /languages, /crisis, /pricing, etc.) all 404 in the SPA — everything is gated behind email auth

### What I CANNOT verify (need from user for proposal-grade detail)
- The actual list of 107 spoken languages
- The actual list of 18 sign languages (ASL? BSL? International Sign? Indigenous SLs?)
- Crisis detection rules + escalation paths (does it route to 988? to LifeBridge?)
- Provider workflow UI
- Live usage metrics (registry numbers are pre-rebrand and unverified)

### Best grant fits (now expanded — sign-language coverage opens new doors)
- HRSA Language Access Plan (meaningful access, not literal translation)
- CMS Office of Minority Health (health-literacy + LEP)
- DOJ LEP Initiative (court interpreter access — sign languages rare here)
- ED Office of English Language Acquisition (OELA) — ELL family communication
- ACL — disability + Deaf/HoH access (the 18 sign languages are gold here)
- FEMA Whole Community — offline phrase boards for disasters
- VA Equity Action Plan — veteran lived-language access
- 988 / SAMHSA — crisis-line accessibility (built-in crisis detection is rare)
- Knight / Mozilla — civic-tech LEP

### REVISED ECOSYSTEM FRAMING — now a QUARTET
Talk Your Talk is the **horizontal accessibility substrate** under the other three.

| Platform | Layer | Barrier removed |
|---|---|---|
| Talk Your Talk | Communication substrate (under all 3) | Can't be understood in your own voice |
| Civic Signal | Civic intelligence | Can't see/influence government |
| LifeBridge | Safety-net navigation | Can't navigate services |
| ThriveUp Academy | Skill building | Can't build new-economy skills |

Pitch line: *"Three service platforms, one accessibility substrate. You can't get civic information you don't understand. You can't navigate a 211 in a language no one offered. You can't learn AI through a screen reader that mispronounces your name. Talk Your Talk runs underneath."*

### Hub DB updated this session
- Renamed: LexiBridge (Speech Bridge) → Talk Your Talk (formerly LexiBridge)
- URL: → https://talkyourtalk.net
- health_status: unknown → online (verified live)
- Description, capabilities (JSON), and grant_alignment array all rewritten to match current site

---
## Talk Your Talk — VERIFIED LANGUAGE LISTS + CRISIS PATH (May 6, 2026)

**Source:** User pulled directly from `artifacts/api-server/src/lib/languageRegistry.ts` and `interpret.ts:626-633`.

### Headline correction
Honest count = **90 spoken + 18 sign = 108 total**. The "107" claim on the homepage marketing conflated spoken+sign; in the codebase it's 90 + 18. Use **108** in proposals or break it out as "90 spoken / 18 signed."

### 90 spoken languages (with ★ = explicit dialect variants modeled)
- **Western Europe (10):** English ★ (10 variants incl. Standard American, AAVE, Gullah Geechee, Appalachian, Spanglish, Caribbean, Haitian-Creole-influenced, Southern US, British, Australian) · Spanish ★ (8: Mexican, Dominican, Puerto Rican, Cuban, Colombian, Argentine, Castilian, Central American) · Portuguese ★ (Brazilian, European, African) · French ★ (Metropolitan, Canadian, African, Caribbean, Haitian Creole) · German · Italian · Dutch · Greek · Romanian · Hungarian
- **Eastern Europe & Baltics (12):** Russian, Polish, Ukrainian, Czech, Slovak, Bulgarian, Croatian, Serbian, Slovenian, Lithuanian, Latvian, Estonian
- **Nordic (4):** Swedish, Danish, Norwegian, Finnish
- **MENA (4):** Arabic ★ (Modern Standard, Egyptian, Levantine, Gulf, Maghrebi, Iraqi) · Hebrew · Persian/Farsi · Turkish
- **South Asia (12):** Hindi, Bengali, Punjabi, Urdu, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Odia, Nepali, Sinhala
- **East / SE Asia (12):** Mandarin ★ (Simplified, Traditional, Taiwanese), Cantonese, Japanese, Korean, Vietnamese, Thai, Burmese, Khmer, Lao, Indonesian, Malay, Filipino/Tagalog
- **Central Asia & Caucasus (6):** Georgian, Armenian, Azerbaijani, Uzbek, Kazakh, Mongolian
- **Sub-Saharan Africa (13):** Swahili, Yoruba, Igbo, Hausa, Amharic, Tigrinya, Somali, Kinyarwanda, Zulu, Xhosa, Shona, Chichewa, Wolof, Fulfulde, Lingala, Sesotho, Afrikaans, Malagasy
- **Pacific & Indigenous:** Māori, Samoan, Tongan, Hawaiian, Cebuano, Javanese, Sundanese, Pashto, Haitian Creole

### 18 sign languages (proposal-ready table)
1. ASL — North America
2. **Black ASL** — US (distinct entry; major equity differentiator — most platforms erase it)
3. BSL — UK
4. LSF — France
5. DGS — Germany
6. JSL (日本手話) — Japan
7. CSL (中国手语) — China
8. KSL (한국 수어) — South Korea
9. **International Sign (IS)** — Global (refugee / cross-border use)
10. LSM — Mexico
11. Auslan — Australia
12. Libras — Brazil
13. ISL — India
14. NZSL — New Zealand
15. SASL — South Africa
16. RSL (РЖЯ) — Russia
17. TİD — Turkey
18. **Tactile Sign** — Global (DeafBlind users)

**Reviewer-relevant differentiators:** Black ASL as separate entry · International Sign for refugees · Tactile Sign for DeafBlind · 4 SLs from non-English-speaking countries (LSM, LSF, Libras, NZSL).

### Crisis-detection escalation — HONEST version (use this exact framing in proposals)
**What ships today:**
- GPT-5.2 runs in parallel with every translation request (`/api/interpret/sessions/:id/speak` → interpret.ts:626-633) using a `CRISIS_DETECTION_PROMPT`
- Returns one of 5 severity levels: `none / mild / moderate / severe / critical` + `indicators[]` + `recommendedAction`
- Pre-seeded in-language crisis keywords boost recall (e.g. "救命", "ayuda", "no puedo respirar", "ਮਦਦ", and signed equivalents like "HELP", "CANT-BREATHE")
- **Persisted outcome data:** `crisisLevel` and `crisisIndicators` written per message; `crisisDetected=true` flipped on the parent session — **queryable for grant reporting** (count of crisis sessions by language × severity)
- `severe` and `critical` → in-app `crisisAlert` banner with indicators + recommended action
- **/interpreter/crisis** page: two always-visible large tap targets — `tel:911` (red) and `tel:988` (blue) — opens native dialer

**What does NOT ship (do not claim in proposals):**
- ❌ No automated dispatch to 988 (their public API does not permit third-party dispatch)
- ❌ No live human interpreter handoff (next grant cycle line item)
- ❌ No automatic routing to LifeBridge / ecosystem partners (pub/sub bus exposes the integration point but routing logic is queued)

**Proposal language (verbatim, approved by user):**
> "Crisis detection runs on every utterance in 108 languages, classifies severity into 5 levels, persists structured outcome data to the database, and presents one-tap dialer access to 911 and 988. Grant funds will extend this with (a) automated warm-handoff to ecosystem-partner human interpreters via the ThriveUp pub/sub bus, and (b) opt-in 988 chat-API integration once available."

### Outstanding (deferred — not blocking)
- Post-login screenshots of /interpreter, /interpreter/live, /interpreter/sign-language, /interpreter/crisis
  - Option A: User offered to run dev test harness via `MAGIC_LINK_DEV_BACKDOOR=1` to auto-login and snap 4 screenshots
  - Option B: User logs in on deployed app and takes them in 60 seconds
  - Awaiting user choice

---
## Hub re-seed bug — Talk Your Talk row keeps reverting (May 6, 2026)

**Symptom:** I renamed the row `speech-bridge` from "LexiBridge (Speech Bridge)" → "Talk Your Talk (formerly LexiBridge)" with URL `talkyourtalk.net`. After the next workflow restart, the row reverted to the old name and `lexibridge.net` URL. Description and grant_alignment changes survived; name and URL did not.

**Root cause:** No code in THIS workspace references `speech-bridge`, `LexiBridge`, or `lexibridge.net` (verified via ripgrep). The reverting writes are coming from **Talk Your Talk's own ecosystem connector** (the `artifacts/api-server/src/lib/...` codebase the user pulled the language registry from). When TYT pings back to the hub, it self-registers with its old metadata and overwrites this row.

**Real fix (must be done on Talk Your Talk side, not here):**
1. In the TYT codebase, update the ecosystem-connector registration payload:
   - `id`: keep as `speech-bridge` (or migrate to `talk-your-talk` — see migration risk below)
   - `name`: → "Talk Your Talk"
   - `url`: → `https://talkyourtalk.net`
   - `displayName`, marketing tagline, capabilities array → match current site
2. Migration risk if changing `id`: any hub records keyed by `speech-bridge` (heartbeats, integration logs, crisis-routing subscriptions) would need a backfill. Recommend keeping `id=speech-bridge` and only changing the human-facing fields.

**Workaround until fixed:** Re-run rename UPDATE if the row reverts again. For proposal-writing purposes, the grant_alignment + description fields persist correctly, so the data we need IS in the hub — only the displayed name/URL revert.

**Related pinger bug (still open from earlier):** Pinger marks platforms "online" when DNS fails / heartbeat is >7 days old. Both bugs live on the same hub-vs-connector boundary and should probably be fixed together.

---
## Talk Your Talk — HOMEPAGE UPDATE (May 6, 2026, post-update by user)

### Headline count reconciled: 89 spoken + 18 sign = 107 total
- Previous registry pull: 90 spoken
- Current site: 89 spoken
- **Use 89 / 18 / 107 going forward** (matches current public-facing copy, "See all 107 →" chip)
- One spoken language was apparently consolidated; not material for proposals

### NEW: Talk Your Talk is now a LEARNING platform too
The homepage just added a "Learning that meets you where you are" section with 6 feature cards. This expands the platform's grant story from accessibility/communication-only to ALSO covering ELL education, family literacy, classroom tech, and AI-tutor pedagogy.

**6 new learning surfaces (each with its own deep-link CTA):**
| Surface | Route | What it is | Grant angle |
|---|---|---|---|
| **Snap & Learn** | /snap-learn | Point your camera → bilingual flashcard | ED OELA, family literacy, ELL apps |
| **Spaced-Repetition Review** | /snap-learn/review | SM-2 algorithm (Anki-style) | Evidence-based pedagogy — citable in proposals |
| **Match Game** | /snap-learn/match | Tap-the-photo learning through play | Early childhood, IDEA Part C |
| **Live Learning Sessions** | /live | Kahoot-style classroom, 6-letter join code | Title III, ESSER, classroom tech grants |
| **Belonging Path** | /learn | 12-unit guided journey | Workforce readiness, citizenship prep, refugee resettlement |
| **Family Circles & Mentor Match** | /family /mentor | Family literacy + 1:1 mentoring | ED family literacy, AmeriCorps, IMLS |

**Plus:** "Ask Lexi — your patient AI guide" CTA strip → /chat (accessible AI tutor)

### Updated hero copy (verbatim, May 6 2026)
> "A dialect-aware, multilingual communication bridge across **89 spoken and 18 sign languages** — with real-time interpretation, crisis detection, **snap-a-photo vocabulary learning, live classroom games**, and deep respect for every voice."

### Updated "Our Why" pull-quote (verbatim)
> "89 spoken languages. 18 sign languages. Crisis detection that works in all of them. Learning games that make new vocabulary stick."

### Expanded grant fit list (added with the learning surface)
- **ED Office of English Language Acquisition (OELA)** — strengthened: now has actual learning product
- **ED Title III** — supplemental services to ELLs (camera flashcards, family circles)
- **ED ESSER / classroom tech** — Live Learning Sessions = Kahoot-style for multilingual classrooms
- **IDEA Part B & Part C** — sign-language coverage + Match Game for early childhood
- **ED Family Literacy / Even Start** — Family Circles + Snap & Learn
- **AmeriCorps / National Service** — Mentor Match
- **IMLS (Institute of Museum and Library Services)** — library-based ELL programming
- **NSF STEM ed (multilingual)** — pedagogy + spaced repetition

### Revised quartet positioning (updated)
Talk Your Talk is no longer "just" the horizontal accessibility substrate. It's now **substrate + learning loop**:
- LifeBridge gets you to the resource
- Civic Signal gets you civic agency
- ThriveUp Academy builds workforce skills
- **Talk Your Talk lets you be understood AND helps you learn the new language/vocabulary you need to navigate any of the above** — in your dialect, with your family, at your pace, with crisis safety always one tap away.

That dual-role framing (interpretation + learning) is unusually strong. Most grant programs fund one OR the other; you can pitch into both buckets with the same platform.

---
## AEI FY26 — Live Links section added (May 6, 2026)

Added a "Live Links — for the reviewer" section to `docs/grants/AEI-FY26-Application-Responses-FINAL.md` between Tab 5 and the pre-submission checklist.

**Links visually verified (all rendered to logged-out reviewer):**
- talkyourtalk.net/ → home
- power2thepeople.net/feed → Live Civic Feed (1448 court / 880 ord / 360 mtg, topic filters)
- power2thepeople.net/prepare → 10-step "Get your affairs in order" wizard with ready.gov/caringinfo.org sources
- lifetransitionsaid.org/ → "You Are Not Alone" + 24/7 crisis bar (988/DV/NAMI/SAMHSA/Crisis Text/2-1-1) + Find Resources search
- thrivingcommunitiesforall.com/academy → Panther Village campus

**Routes verified to 404 inside the SPA (DO NOT LINK in proposals):**
- lifetransitionsaid.org/julia ❌
- talkyourtalk.net/about, /how-to-install, /languages, /sign-languages, /privacy, /how-it-works, /providers, /crisis, /pricing ❌ (all gated behind email sign-in)

**Lesson learned:** SPA routes return 200 even when they 404 inside the React router. Always visually verify before putting a link in a grant. Body-size comparison helps (identical bytes = SPA shell only) but visual confirmation is required.

---
## Quartet → Quintet reframe (May 7, 2026)

User caught a strategic miss: the AEI quartet narrative omitted the mental-health platform. Added **Whole-Person Health Ecosystem** (mentalwellnesssupport.net, DB id `whole-person-health`) as the **behavioral-health safety floor** underneath the four agency platforms.

**Verified live:** mentalwellnesssupport.net renders "You don't have to figure this out alone" hero, sticky 988 Call-or-Text bar, role-based entry (myself / child or teen / someone I love / provider or educator / veteran or military family / help right now), no-login required.

**What ships (per DB description):** C-SSRS, PHQ-9, GAD-7, PCL-5 validated screenings · safety plans with auto-escalation · Reach a Vet crisis pathway · MAP-GAP biopsychosocial assessment · 20,670+ resources across 2,091 community groups, 60 condition guides, 19 population hubs · offline-capable PWA.

**Architectural role:** Every platform in the 24-platform ecosystem routes crisis, referral, and assessment data through WPH. It is the connective tissue, NOT a peer of the four.

**Edits made:**
- AEI Q2 — added "behavioral-health safety floor underneath all of this" paragraph after the six-surfaces list
- AEI Live Links — added WPH section as fifth platform group
- `docs/grants/QUARTET-ONE-PAGER.md` — fully rewritten as five-platform "quartet on a safety floor" narrative; added "Lead with the safety floor" guidance for SAMHSA/SSG Fox/St. David's BH/AHRQ/ACL crisis rubrics
- `replit.md` Pointers — updated to reflect quintet framing

**WholeMind Learning (wholemindlearning.com) — DO NOT LINK:** Loaded blank to a parking-page redirect (`/lander?oref=...`). Not currently public. Different platform from Whole-Person Health despite similar naming.

**Lesson learned:** When user references "X app," check the full ecosystem_platforms table, not just the platforms in working memory. The 24-platform ecosystem has multiple platforms per domain; assuming a "quartet" because that's what's in front of you risks omitting the most relevant platform for a given rubric. **Always pull the full DB list before locking a narrative.**

---
## Full ecosystem catalog committed to replit.md (May 7, 2026)

User feedback: *"You should know everyone and it should be in the md. Not knowing is going to make me miss opportunities."* This was the right call — we already lost one round today (quartet→quintet) because Whole-Person Health wasn't in working memory.

**Now in `docs/ecosystem-catalog.md` (moved from replit.md May 9, 2026 to slim the README):** every platform with id, name, URL, one-line description, grant alignment, and verified live/dead status as of May 7, 2026. Also queryable structured via `GET /api/agent/knowledge/topic/platforms` (live DB rows) and `GET /api/agent/knowledge/topic/ecosystem_caveats` (parsed caveats).

**Liveness summary (verified May 7, 2026):**
- ✅ LIVE (13): mce, lifebridge, safereport, isss + betterscience (shared URL), sankofa-maternal + sankofa (shared URL), sankofa-mens, **sankofa-feminine-health (at herhealthmatters2.com / myhealthybreast.com — old yourfeminineneeds.com is unbound)**, perfectly-different, safecognicare, whole-person-health, collaborative-advocate, m2c
- ✅ LIVE but unregistered in hub: Civic Signal (power2thepeople.net) — needs registration
- ⚠️ Live at correct URL but DB row wrong: speech-bridge (DB says lexibridge.net dead; true URL talkyourtalk.net live)
- 🚧 Host up, 404: emergency-mgmt, sankofa-feminine-health
- ❌ DNS dead / parked: autoimmune-thrive, pillscheduler, wholemind (parking lander), ad-targeting, video-creator-ai, ecosystem-nexus, code-canvas, pinnacle-business-conglomerate

**Standing rule going forward:** Read the `## Ecosystem catalog` section at the start of every grant work session. Re-probe URLs before linking in submissions. Register Civic Signal in the hub DB. Fix TYT URL when in TYT workspace.

**Why this matters:** 11 of 24 platforms are currently not public-facing. If a future grant rubric matches one of those (e.g., a TBI-focused SAMHSA grant matches SafeCogniCare ✅ and PillScheduler ❌), I need to know which is reachable to a reviewer and which is internal-only — without that, I either over-promise or under-pitch.

---
## Lesson: probe ALL aliases before declaring a platform dead (May 7, 2026)

Almost removed `sankofa-feminine-health` from the registry because `yourfeminineneeds.com` returned 404. User caught it: the platform is live at TWO verified alternate domains (`herhealthmatters2.com` and `myhealthybreast.com` — both serve the identical 3268-byte "HerHealth Network by Sankofa — Women's Health Equity Platform" payload).

**New standing rule:** Before flagging any platform as dead/404 in the catalog, check the project's Publishing → Domains tab for verified alternate URLs, AND probe each alias. The hub DB only stores ONE URL per platform; aliases live in the deploying workspace's domain config.

**DB now reflects truth:**
- `sankofa-feminine-health` restored: url=`herhealthmatters2.com`, public_visible=true, alias `myhealthybreast.com` documented in description
- Updated catalog count: 13 live (was 12), 9 hidden (was 9 incl. feminine, now 9 truly dead)

---
## Foster Youth Aging Out — comprehensive build for Jim Currier (May 11, 2026)

**Trigger:** Jim Currier (HUD FYI National Implementation Leader) Austin visit. Iron rule: AI assistance with no conjecture or assumptions. Audio = video. Multidisciplinary lens (impl science · engineering · social work · customer discovery · UX · marketing · community health).

**Built (all live, all clickable):**
- 6 foster-youth pages under `client/src/pages/foster-youth/`: hub · toolkit · transition-plan · wellbeing · rights · benefits — bilingual EN/ES, no login, crisis routing on every page (988 / 741741 / 1-800-RUNAWAY).
- Routes wired in `client/src/App.tsx` (lazy imports + 6 routes before `/fafsa-navigator`).
- Sidebar nav array `fosterYouthItems` added in `client/src/components/app-sidebar.tsx` (NOTE: array exists; SidebarGroup JSX render of this group still needs to be added — left as a follow-up since the routes are reachable directly).
- FAFSA navigator gained foster-youth mode at `/fafsa-navigator?audience=foster` (callout banner + Independent-Student/ETV pathway). Renamed root testid `fafsa-navigator` → `page-fafsa-navigator`.
- State Benefits Navigator covers all 50 states + DC; Texas full-detail today, others on rolling buildout (federal benefits + state Chafee/ILP search pointer).

**Congruence system (NEW — keep using this for every funder briefing):**
- `docs/grants/CONGRUENCE-MANIFEST.json` — 15 claims (FY-001..FY-015) + 4 external URL checks. Each claim → URL → required test IDs → evidence file.
- `scripts/congruence-audit.ts` — fetches each URL, asserts each test ID is present (literal OR template-literal pattern), checks external URLs respond 200 with expected keywords. Writes `.agents/congruence/last-run.md`. Exit non-zero if any FAIL. **Run before every briefing.**
- Latest run: **PASS 83 / 83 — VERDICT: CONGRUENT.**
- Playwright e2e at `tests/e2e/foster-youth-journey.spec.ts` — walks the entire journey.

**Briefing artifacts:**
- `docs/grants/Foster-Youth-Transition-Briefing.md` — every claim links to a working URL; honest disclosure first (501(c)(3) pending, not a placing agency, no current state ILP contract). Do not brief if congruence audit shows any FAIL.
- `docs/grants/Foster-Youth-Jim-Currier-Meeting-Prep.md` — 30-minute click-by-click walkthrough; anticipated Q&A; the ask (FYI rubric disqualifiers, PHA introductions, evaluation evidence HUD wants).
- `docs/grants/Foster-Youth-Outcome-Tracking-Plan.md` — 30-day plan to segment LifeBridge analytics for foster-youth cohort. Today we honestly cannot report foster-youth-specific outcomes; this plan closes the gap.

**Federal program coverage mapped & cited:** Chafee (42 USC §677) · ETV (42 USC §677(i)) · HUD FYI (24 CFR §982 youth set-aside) · ACA §2004 Medicaid-to-26 · FAFSA Independent-Student (HEA §480(d)) · McKinney-Vento (42 USC §11431) · RHYA (34 USC §11201) · TX PAL · TX Extended FC (Tex. Fam. Code §263.602) · TX ID waiver (Tex. Transp. Code §521.1811) · TX Tuition waiver (Tex. Educ. Code §54.366).

**Next-thread queue:**
- Render `fosterYouthItems` SidebarGroup in app-sidebar.tsx JSX (array exists, JSX render is pending).
- Build out states 2–50 in benefits navigator with named ILP coordinators + warm-handoff phone numbers (currently TX is full-detail; others use federal-only + ILP search pointer).
- Begin Week 1 of Outcome Tracking Plan (event_log schema + `useTracker("foster-youth")`).
- Post-meeting: capture every commitment Jim makes → log here.
