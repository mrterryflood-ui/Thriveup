# Topic: Grants

Strategy, pipeline mechanics, active pursuits, submission doctrine.

---

## Discovery Engine (verified 2026-05-22)

- **721 grants** tracked across sources:
  - grants.gov 369 · usaspending 198 · samgov 36 · manual 12 · state/local 18 · other federal 8 · foundation/corp 4 · misc 6
- Fit scores: **≥70 = 208** · **≥80 = 186** · **≥90 = 160**
- Engine: `server/grant-routes.ts`
- ⚠️ Last DB write 2026-05-15 — auto-scan stale; see `docs/active-commitments.md`
- **SAM.gov honest framing:** screen 16K feed, curate ~36. Never claim "track 16,667."

## Public surfaces

- **Live Grants:** `/grants` (Live Grant Opportunities)
- **My Grants & Win Rate:** `/my-grants` (auth)
- **Application Tracker:** `/grants/applications` (auth)
- **Grant Command Center:** `/grant-command-center` (auth) — includes This Week tab via `GET /api/grants/this-week`
- **Monday Brief:** `/this-week` (`client/src/pages/this-week.tsx`) — edit `SHIP_TARGETS_THIS_WEEK` + `FUNDER_DECISIONS_PENDING` weekly
- **RFP Fidelity Engine:** `/rfp-fidelity` → `/grants/:grantId/compliance` (engine: `server/rfp-fidelity-engine.ts` + `complianceMatrixItems` table)
- **LOI Writer:** `/loi-writer` · **RFP/Narrative Writer:** `/grant-narrative` · **Grant Packages:** `/grant-packages`

## Active pursuits (status = pursuing / loi_drafting / drafting)

| Grant | Funder | Deadline | Status | Owner notes |
|---|---|---|---|---|
| **Sedgwick County RFP #26-0028** (Vitality Weight Mgmt) | Sedgwick County KS | 2026-06-02 1:45 PM CDT | drafting (v3) | HIS Prime · TCAF/Love/Vanntastic subs. Page `/grants/sedgwick-vitality`. v3 at `docs/grants/sedgwick-rfp-26-0028/vitality-proposal-v3.md` (1,110 lines, 34 ACTION REQUIRED, all owner-tagged) |
| **Lake Worth ISD #2026-0400-26** (K-12 PD/Services) | Lake Worth ISD TX | 2026-06-04 5:00 PM CDT | drafting | TCAF Prime + HIS compliance sub. Vann + Love NOT on this bid |
| **SSG Fox FY27** (VA Suicide Prevention) | US Dept of Veterans Affairs | 2026-06-12 4:59 PM ET | pursuing | **Lives on `vetmissiontransition.com`, NOT this codebase.** Year-1 Central TX only · ask $400K–$600K · EIN 41-3618003 |
| **NSF 26-508 TechAccess** (AI-Ready America Coordination Hub) | NSF (TIP/EDU/CISE) + DOL/ETA/USDA-NIFA/SBA | 2026-06-16 | loi_drafting | Fit 100. LOI draft: `docs/grants/NSF-TechAccess-LOI-Draft.md` |
| **Promise Neighborhoods 84.215N** (Cradle-to-Career) | US Dept of Education | 2026-08-06 | pursuing | Fit very high (Chainweb + Community Voice + Trade Sims). REAL GAP: needs LEA partner. Score = capability fit, not award probability |
| **FY 2026 Tech Youth Program DFOP0018281** | State Dept / Bureau of Educational and Cultural Affairs (ECA) | **2026-07-06** | pursuing | $1.1M fixed (floor=ceiling). Cooperative agreement. ~96 HS students (72 international + 24 US). 3-week US-based exchange summer 2027. **TEAM LOCKED — see below.** |

## Tech Youth Program (DFOP0018281) — team & strategy locked 2026-06-29

**Funder:** State Dept ECA, Office of Citizen Exchanges — `ShieldsSD@state.gov`
**Award:** $1,100,000 fixed (cooperative agreement, floor = ceiling)
**Deadline:** July 6, 2026 — confirmed pursuing
**Program:** 3-week US-based tech/leadership/entrepreneurship exchange, summer 2027. ~72 international + 24 US high school students. Pre-exchange prep + post-exchange alumni + capstone projects.

**Team (locked by Dr. Flood 2026-06-29):**
- **WSU Community Relations** (Wichita State University) — **Prime**. Closes every ECA logistics gap: dorms for 72 international students, WSU International Programs Office for visa letters, prior federal cooperative agreement capacity, Wichita industry ecosystem (Boeing, Spirit AeroSystems, Textron Aviation, Koch Industries) for site visits.
- **TCAF** — Sub: technical curriculum platform (Trade Sims, AI Workforce Academy, Career Explorer, capstone architecture). TCAF writes and delivers the entire tech curriculum section.
- **USD 259 Wichita KS** (Wichita public schools) — US student pipeline. Sources and screens the 24 American HS participants. Adds public-school equity credibility ECA values.
- Dr. Love (Wichita) and Dr. Vann available as community-support subs if needed.

**TCAF's differentiating contribution:**
- Trade Sims (5 trades, 75 lessons, industry-grade physics engines — MNA, Hardy-Cross, AWS D1.1)
- AI Workforce Academy (6 tracks, 29 modules, 24+ hands-on projects)
- 55+ career pathways across 12 industries
- Capstone project framework (credential routing at 80% completion)
- Implementation-science fidelity tracking (CFIR 2.0, 39 constructs in live code)
- Platform already live and deployed — not aspirational

**Why WSU as prime, not TCAF:** ECA scores exchange program track record heavily. WSU as a public university (explicitly listed eligible applicant category) absorbs the ECA-experience gap. TCAF's curriculum platform is the competitive differentiator ECA can't find elsewhere.

**Next actions:**
1. Dr. Flood calls WSU Community Relations today — confirm prime, get UEI for budget
2. USD 259 letter of support or MOU stub
3. TCAF drafts: technical curriculum narrative, capstone project framework, TCAF budget sub-portion
4. WSU drafts: exchange logistics, housing plan, international student support, program management

---

## Decision-pending (not yet in active rotation)

From the 2026-05-19 rescore:

- **OSERS-OSEP 84.325J** → fit 82 (Trade Sims + Perfectly Different, eligibility caveat)
- **TEA Community Partnership** → fit 67
- **Innovative Approaches to Literacy 84.215G** → fit 62 (Talk Your Talk fit, track-record gap)
- **DOE: Energy Auditor Training** → 80 · **Inclusive Energy Innovation Prize** → 78 · **Communities LEAP** → 75 · **C2C NREL** → 70
- **NIH PAR-25-144 / PA-25-301** (due 2026-06-05) · **NIH PA-25-304 / PAR-25-143** (due 2026-06-16) — all `researched`
- **NSF IUSE-EDU** (due 2026-07-15) — `evaluation_complete`
- **FEMA BRIC** (due 2026-07-23 3pm) — `partner_required`

User to select pursuit set; agent then writes `grant_reminders` rows tied to each `grant_id`.

## Submitted / awarded / declined

- **Central Health Compensation Mgmt System** (Travis County Healthcare District) — submitted 2026-04-24. Live at `centralhealthcms.com` + `secure-health-plug.replit.app`.
- **Smart Family Fund — Pitch C** — submitted 2026-05-17 via `smartfamilyfund.org/introduce-yourself`. Decision window: November 2026 (plan 6mo silence).
- **St. David's WAB2 LOI** — DECLINED 2026-05-15 (Regan Gruber Moffitt, JD). Target via CLC + Community Health Grants only.

## RFP Fidelity Doctrine (Iron Rule #5 — full)

Every proposal is written **to the reviewers/scorers, not to end users.**

- Mirror the RFP's language, order, and scoring weights
- **Section L instructions = pre-flight gate** (noncompliance = rejection before Section M is scored)
- Source precedence: **Q&A > Amendment > Base RFP > Pre-bid notes**
- Each Section M paragraph opens: `"In response to [reqNumber]'s requirement that [verbatim]…"` and ends `"[Evidence: …]"`
- Gaps append `{{ACTION REQUIRED: …}}` (now `{{ACTION REQUIRED — <owner>}}` per 2026-05-24 update)
- Engine: `server/rfp-fidelity-engine.ts` + `server/rfp-fidelity-routes.ts` + `complianceMatrixItems` table + `/grants/:grantId/compliance` UI; wired into `generateDraftFromRubric`
- Full doctrine: `docs/grants/RFP-FIDELITY-DOCTRINE.md` → archive A23

## Submission reminders (chat-only)

- **No UI banners, sidebar pings, toasts, or modals** — user preference confirmed 2026-05-24
- Cover both **active-teaming bids AND individual/TCAF-solo pursuits**
- Do **not** include `researched` / `identified` / `watch_next_cycle` without asking

## Reference docs

- `docs/grants/MASTER-GRANTS-TRACKER-2026-05-19.md` — single-doc inventory of every grant + every draft
- `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md`
- `docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md`
- `docs/grants/QUARTET-ONE-PAGER.md` — TYT substrate; Civic Signal · LifeBridge · ThriveUp service surfaces; WPH behavioral safety floor
- `docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md`
- `docs/grants/AEI-Funder-Intelligence.md` — Tabbara prior-award checklist template (mandatory for ALL grants regardless of size)
- `docs/grants/sedgwick-rfp-26-0028/` — Sedgwick workspace (v1, v2, v3, REJECTED draft, crosswalk, base RFP, addenda)
- `docs/grants/aisd-26rfp052/` · `docs/grants/centene-foundation-2026/` · `docs/grants/crump-foundation-2026/` · `docs/grants/powell-foundation-2026/` · `docs/grants/rosendin-foundation-2026/`

## Public-page funder copy

- Avoid funder names; describe the program category instead
- `<PartnershipStatus>` enforces auditable stage + date on public site
- `<RequireAuth>` wraps internal pipelines + funder data
