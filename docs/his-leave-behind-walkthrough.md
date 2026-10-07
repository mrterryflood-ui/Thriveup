# ThriveUp / TCAF Platform — New-User Walkthrough
### Leave-behind for Hargrave Innovative Solutions (HIS)
**Prepared by:** Dr. Terry D. Flood Sr., President, The Collaborative Advocate Foundation (TCAF)
**For:** Eric Hargrave, Founder, Hargrave Innovative Solutions
**Purpose:** Give HIS staff a single document they can read once, share internally, and use to navigate the platform when teaming with TCAF on government RFPs, compliance work, and community-impact contracts.

> **Live site:** `https://[your-thriveup-domain]` — paste in once. Every link below is a path; append it to that base URL.
> **Sign-in:** top-right "Log in" → Replit Auth (one click). Public pages render without sign-in; anything that touches grant pipeline, partner data, or paid AI requires sign-in (you'll see a "Sign in to use…" banner with a reason).
> **Mobile:** the sidebar collapses to a hamburger; everything below works on phone.

---

## 1. Why this platform exists (90 seconds)

TCAF runs a **national community-infrastructure platform**. It does three things at once:

1. **Connects people to grant funding** — a live discovery engine pulling from grants.gov, USASpending, SAM.gov, foundations, and state/local sources (721 grants tracked as of 2026-05-22).
2. **Aligns service delivery with workforce development** — benefits screeners, case-manager views, foster-youth toolkits, reentry dashboards, apprenticeship trackers, AI-assisted intake.
3. **Produces measurable community impact** — transparency dashboards, dosage reports, outcome reporting, CFIR/RE-AIM implementation science, donor outcome receipts.

**Where HIS fits:** HIS is TCAF's long-term contracting/compliance partner. The platform gives HIS staff a working surface for:
- Pulling RFPs, scoring them, and building rubric-mirrored proposals (RFP Fidelity Engine).
- Tracking active bids, teaming combinations, and submission deadlines.
- Demonstrating capability to county/state/federal buyers with live, working tools (not slides).

---

## 2. The Grant Engine — the part HIS will use daily

This is the heart of the platform. There are **six surfaces**, each with one job. Use them in this order on every RFP.

### 2.1 Grant Command Center → `/grant-command-center`
**What it is:** The home base for everything grants. Tabs: This Week, By Fit Score, By Deadline, By Source, Tracked Pipeline.
**When to use:** First thing Monday morning. Shows what's closing in the next 14 days, what's high-fit, what's new since last check.
**Backed by:** live DB of 721 grants across grants.gov (369), USASpending (198), SAM.gov (36), manual (12), state/local (18), federal-other (8), foundation/corp (4), misc (6).

### 2.2 This Week / Monday Brief → `/this-week`
**What it is:** A weekly strategic snapshot — four strategic dimensions, ship targets for the week, grants closing in 14 days, decisions pending.
**When to use:** Standing Monday agenda item. Read aloud in the joint TCAF/HIS check-in.

### 2.3 RFP Fidelity Engine → `/rfp-fidelity`
**What it is:** The flagship. Pick a grant → it extracts Section L (instructions/format/page limits) and Section M (evaluation criteria) into a compliance matrix → drafts each response paragraph **verbatim to the rubric** ("In response to Criterion N's requirement that…") → runs a final fidelity audit before submission.
**Why it matters:** Section L noncompliance gets you rejected **before** Section M is scored. This engine treats L as a pre-flight gate. That's the doctrine.
**Per-grant matrix:** `/grants/:grantId/compliance` — the working surface for any specific RFP.
**Live worked example:** `/grants/sedgwick-vitality` — the Sedgwick County Vitality Weight Management bid (#26-0028, due June 2, 2026 1:45 PM CDT) where HIS is prime. Open it and click through the tabs: Crosswalk → Base RFP → Addendum #2 → Strategic Analysis → **Proposal v2 (rubric-mirrored)** → v1 archive → Pre-Submission Checklist → Honest Critique.

### 2.4 RFP-Driven Writer → `/grant-narrative`
**What it is:** The AI writer wired to the same rubric the Fidelity Engine extracted. Every paragraph it generates is tagged to a criterion + ends with an `[Evidence: …]` pointer. Gaps come back as `{{ACTION REQUIRED: …}}` markers — never as fabricated detail.
**When to use:** After the Fidelity matrix is built. Drafts whole sections in the rubric's order, in the reviewer's language.

### 2.5 Application Tracker → `/grants/applications`
**What it is:** Win/loss tracker. Status, submission date, decision date, dollar amount, owner, notes.
**When to use:** End of each bid cycle. Logging losses is as important as logging wins.

### 2.6 Prior Award Research → `/grant-prior-awards`
**What it is:** Tabbara prior-award checklist surface. SAM.gov, USASpending, SBIR awards, funder history. Mandatory before any submission regardless of grant size.
**When to use:** Before drafting. Tells you who's already won similar work and what teams looked like.

### Supporting surfaces (use as needed)
| Surface | URL | Use |
|---|---|---|
| Grant Hub (catalog view) | `/grants` | Browse all 721 |
| My Grants (saved/tracked) | `/my-grants` | Personal queue |
| Grant Packages | `/grant-packages` | Pre-assembled bid packages |
| Healthcare Grants Catalog | `/healthcare-grants` | Vertical view |
| LOI Writer | `/loi-writer` | Letters of Inquiry |
| Coalition Portal | `/coalition` | Multi-org joint bids |
| Teaming Network | `/teaming-network` | Per-RFP rubric + named team lanes (DB-backed) |
| St. David's Prep | `/stdavids-prep` | Specific funder pipeline |
| Logic Model | `/logic-model` | Required for many federal apps |
| Advisory Board | `/advisory-board` | Required attachment for several RFPs |
| Staffing Plan | `/staffing-plan` | Required attachment |

### What makes the engine different
- **Rubric-first writing.** Every paragraph mirrors the reviewer's words back at them. Not how we'd describe the work — how *they* asked for it described.
- **Section L pre-flight gate.** Format, page count, font, attachments, response form — checked before content is even drafted.
- **No fabrication, ever.** Every $/deadline/ID/capacity claim is traced to a primary source (RFP, 990-PF, funder site, attached_assets). Gaps come back marked `{{ACTION REQUIRED}}` for the team to fill — they don't get invented.
- **Honest framing on SAM.** We *screen* the 16K+ SAM.gov feed; we *curate* ~36. We never claim to "track 16,667."

---

## 3. Community Tools — what HIS can demo to a county or city buyer

These are live, working tools. Not mockups. When a buyer asks "what would residents actually use?" — open these on a laptop and click through.

### 3.1 Community Intelligence
| Surface | URL | One-line pitch |
|---|---|---|
| Transparency Dashboard | `/transparency` | Public-facing: every program, every dollar, every outcome |
| Impact Dashboard | `/impact` | Aggregate outcomes across all programs |
| Resident Journey (demo) | `/resident-journey` | Walk a hypothetical resident through services |
| Case Manager View | `/case-manager` | What a caseworker sees |
| Resource Finder | `/resources` | Searchable directory of community resources |
| Community Map | `/community-map` | Geographic view |
| Community Voice | `/voice` | Resident-submitted stories + insights (Pflugerville pilot live) |
| Regional Briefing | `/regional-briefing` | AI synthesizes grant + Census + program data for a region |
| Neighborhood Intel | `/neighborhood` | Census tract-level breakdown (252+ tracts/region) |
| Opportunity Youth | `/opportunity-youth` | 16–24 disconnected youth tools |

### 3.2 Workforce & Apprenticeship
| Surface | URL | Use |
|---|---|---|
| Workforce Dashboard | `/workforce-dashboard` | Aggregate workforce KPIs |
| Apprenticeship Tracker | `/apprenticeship-tracker` | Live apprentice cohort tracking |
| Workforce Training | `/workforce-training` | Training catalog + enrollment |
| Workforce Assessment | `/workforce-assessment` | Intake → skills matching |
| Career Explorer | `/academy/careers` | Youth-facing career discovery |
| Employer Connections | `/workforce-employers` | Employer side of the marketplace |
| Mentorship Directory | `/mentorship-directory` | Find a mentor / be a mentor |
| Transition Plans | `/transition-plans` | Individualized career transition planning |

### 3.3 Foster Youth (full vertical — strong demo for HHS / state child-welfare buyers)
| Surface | URL | Use |
|---|---|---|
| Foster Youth Hub | `/foster-youth` | Front door for youth aging out of care |
| Aging-Out Toolkit | `/foster-youth/toolkit` | Checklist + resources |
| Transition Plan Builder | `/foster-youth/transition-plan` | AI-assisted individualized plan |
| Wellbeing Check-in | `/foster-youth/wellbeing` | Risk screening |
| My Rights | `/foster-youth/rights` | State-specific rights |
| State Benefits (all 50) | `/foster-youth/benefits` | Searchable benefits database |
| AI-assisted Intake | `/foster-youth/intake` | No-auth wizard (capability-token secured) |
| State-Agency Portal | `/foster-youth/state-portal` | What a state caseworker sees |
| Policy Comparison (50 states) | `/foster-youth/policy-comparison` | Side-by-side state policy diff |

### 3.4 Reentry / Justice
| Surface | URL | Use |
|---|---|---|
| Reentry Program overview | `/reentry-program` | Public-facing program description |
| Reentry Operational Dashboard | `/reentry` | Caseload, milestones, outcomes |
| TX Reentry Stipend Pilot | `/reentry-stipend-pilot` | Pilot dashboard |
| National Reentry Standards | `/reentry/standards` | RNR/CBI/NRRC alignment view |
| Justice Command Center | `/justice-command-center` | Aggregate justice-system KPIs |
| For Justice Partners | `/justice-partners` | Partner intake |
| Resource Directory | `/resource-directory` | Reentry resources |

### 3.5 Health & Whole-Person
| Surface | URL | Use |
|---|---|---|
| Behavioral Health Program | `/behavioral-health` | Program landing |
| Veterans Program | `/veterans` | Veteran-specific services |
| Health Network | `/health-network` | Clinical referral network |
| Health Hub | `/health-wellness` | Wellness catalog |
| CHW Dashboard | `/chw-dashboard` | Community Health Worker view |
| Benefits Command Center | `/benefits` | Multi-benefit caseworker surface |
| 9-Benefit Screener | `/benefits-screener` | Public-facing screener (no-auth) |

### 3.6 St. David's / Texas pilots (template-jurisdiction)
| Surface | URL | Use |
|---|---|---|
| St. David's Hub (front door) | `/st-davids` | Funder-facing |
| Live Network View | `/network` | Real-time network state |
| Operator Workspace | `/st-davids-wab2` | Internal operator surface |
| Austin Initiative | `/austin` | City-level view |
| Manor Hub | `/manor` | City-level |
| Pflugerville Hub | `/pflugerville` | City-level (Community Voice pilot lives here) |
| Voices of Austin | `/voices-of-austin` | Resident voice |
| Texas Assessment | `/texas-assessment` | Statewide picture |

### 3.7 ThriveUp (workforce + youth + AI literacy)
| Surface | URL | Use |
|---|---|---|
| Academy Hub | `/academy/hub` | Front door |
| Trade Sims (6 trades × 15 lessons) | `/academy/trade-sims` | Working physics-based trade trainers — pilot target 200 learners by 2026-07-01 |
| Concepts (8 working physics demos) | `/concepts` | Pumpjack · Transformer · Suspension Bridge · Li-battery · Airplane wing · RSA · Wind turbine · Pacemaker. **The differentiator: real physics, not diagrams.** |
| AI Curriculum (youth) | `/curriculum` | Pre-K–12 |
| Social Media Literacy | `/social-media-literacy` | Standalone curriculum |
| FAFSA Navigator | `/fafsa-navigator` | College-access tool (foster mode at `?audience=foster`) |
| Financial Literacy | `/academy/financial-literacy` | Standalone module |

### 3.8 Partner & coalition surfaces (where HIS lives)
| Surface | URL | Use |
|---|---|---|
| Community Partner Hub | `/partners/vann-hub` | Hub for partner orgs |
| Family & Program Tracker | `/partners/family-program-tracker` | Youth/family attendance + services |
| RFP-Match Storyteller | `/partners/rfp-storyteller` | AI-narrated story-from-data for proposals |
| Teaming Network | `/teaming-network` | Per-RFP team lanes (Sedgwick + Lake Worth ISD seeded) |

---

## 4. How HIS and TCAF work together on a bid (the playbook)

For every RFP HIS brings in, here is the standard loop:

1. **HIS uploads or links the RFP.** TCAF extracts base RFP + addenda + Q&A into `docs/grants/<rfp-id>/`.
2. **Run the Fidelity Engine.** `/rfp-fidelity` → pick the grant → it builds the Section L + Section M compliance matrix.
3. **Confirm teaming.** Open `/teaming-network` and confirm the team for *this* RFP. **There is no standing team.** Sedgwick uses Flood + Vann + Love + Hargrave. Lake Worth ISD uses Flood (TCAF prime) + Hargrave (HIS sub) **only** — Vann and Love are not on that bid. Check the lane fit before assuming.
4. **Draft from the rubric.** `/grant-narrative` writes section by section in the reviewer's words. Every gap comes back as `{{ACTION REQUIRED: …}}`.
5. **HIS fills the action-requireds.** UEIs, license numbers, references, COIs, insurance certs — anything HIS has authority over. TCAF fills TCAF's (EIN 41-3618003, UEI KDDVD1FGLW35, CAGE 209N1).
6. **Final fidelity audit.** Same Fidelity Engine, audit mode. Checks every Section L item (format, page, font, attachments, response form) **before** content is locked.
7. **Submit.** Log to `/grants/applications` immediately — win or lose, this builds prior-award history.

### Partner lanes (verified 2026-05-23, do not reassign)
- **Dr. Terry D. Flood Sr. (TCAF, President):** digital platform, reporting, participant engagement, AI/data infrastructure.
- **Dr. J. Michelle Vann (Sistahs Can We Talk, KS 501(c)(3) + Vanntastic Solutions LLC):** wellness coaching, behavioral engagement, women's mindset. *Spouse COI on Iasis Christian Center — must be disclosed on City of Wichita/federal bids.*
- **Dr. Chela Love, DNP, FNP (Love Clinic & Med Spa, Wichita KS):** bilingual primary-care clinical delivery, GLP-1 oversight, clinical referral.
- **Eric Hargrave (HIS):** government contract management, compliance oversight, reporting coordination, administrative support. **Long-term partner — not a one-bid relationship.**

### Two-entity strategy (so HIS knows which TCAF entity to put on the form)
- **The Collaborative Advocate Foundation (TCAF)** — 501(c)(3), primary applicant for all non-profit / foundation / federal-grant work.
- **ISS LLC** (Dr. Flood's for-profit) — SBIR/STTR/GSA/for-profit set-asides only. EIN 87-2795417 · UEI C7YDV3P8EHL7 · CAGE 9VKK3.
- **For-profit-only solicitation?** → ISS LLC primary, flag for JV-with-TCAF review. Never auto-submit.

### Iron Rules HIS staff should know
1. **Verify, never conjecture.** Every $/deadline/ID claim → primary source. Conflicting sources = hard stop, surface to the team.
2. **Section L is a pre-flight gate.** Format/page/font/attachment noncompliance = rejection *before* Section M is scored.
3. **Source precedence:** Q&A > Amendment > Base RFP > Pre-bid notes.
4. **No silent failures.** If something doesn't compute, the system surfaces it — it doesn't paper over it.
5. **Honest disclosure always.** "Actively evaluating" ≠ "awarded." "Tracked" ≠ "applied." "Modeled" ≠ "realized."

---

## 5. Capabilities inventory (what to put in HIS's capability statement when teaming)

This is the short version. Full inventory: `docs/grants/tcaf-capabilities-inventory-2026-05-17.md`.

**Engineering / data platform**
- 271 database tables, 211 pages, 84 server modules, 206 routes — a real production platform, not a prototype.
- Replit Auth (OIDC), PostgreSQL (Neon) via Drizzle, Express + React/Vite/TanStack Query.
- AI providers: Gemini 2.0 Flash · Claude Haiku 4.5 · GPT-4o-mini · Replit AI GPT-5-nano · OpenRouter (DeepSeek R1) — all auto-wrapped by an ethical/emotional-intelligence preamble.
- Capability-token security for public no-auth wizards (no IDOR, no cost runaway).
- 10 languages (EN+ES human, 8 more AI-translated, dialect-aware including AAVE and Spanglish).

**Domain coverage (6 verticals)**
Criminal Justice · Health Equity · Behavioral Health · Workforce & Business · Education & Learning · Community & Advocacy.

**Specific signals to use in capability statements**
- 721 grants tracked across 8 sources (verified live SQL 2026-05-22).
- 89 spoken + 18 sign = 107 languages on Talk Your Talk (the language-access platform).
- 39 CFIR constructs operationalized; RE-AIM + RPLICE in production.
- RNR/CBI/NRRC alignment on the reentry side.
- FHIR / CDS-Hooks on the clinical side (SafeReport: 0-PHI-egress, HITL-default-on, PHQ-9/GAD-7/C-SSRS/PCL-5/ACES).
- Hardy-Cross and AWS D1.1 worked examples in the Concepts library.
- 15 public-facing ecosystem platforms (use this number externally — the 25-row internal count is not for external pitches).

---

## 6. Quick reference card (print this page)

**Daily / weekly**
- Monday Brief: `/this-week`
- Grant Command Center: `/grant-command-center`
- Application Tracker: `/grants/applications`

**Per RFP**
- Fidelity Engine (pick a grant): `/rfp-fidelity`
- Compliance matrix: `/grants/:grantId/compliance`
- RFP-Driven Writer: `/grant-narrative`
- Prior award research: `/grant-prior-awards`
- Teaming for this RFP: `/teaming-network`

**Live worked example (read first)**
- Sedgwick Vitality #26-0028: `/grants/sedgwick-vitality`

**Demos to buyers**
- Transparency Dashboard: `/transparency`
- Resident Journey: `/resident-journey`
- Foster Youth Hub: `/foster-youth`
- Reentry Operational Dashboard: `/reentry`
- Concepts (working physics): `/concepts`
- Trade Sims: `/academy/trade-sims`

**Reference docs**
- RFP Fidelity Doctrine: `docs/grants/RFP-FIDELITY-DOCTRINE.md`
- Capabilities inventory: `docs/grants/tcaf-capabilities-inventory-2026-05-17.md`
- Strategic Intelligence Playbook: `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md`
- Active commitments / continuity: `docs/active-commitments.md`
- Ecosystem catalog: `docs/ecosystem-catalog.md`

**Institutional contacts (use these on every proposal — never personal Gmail)**
- Dr. Terry D. Flood Sr., President, TCAF — `terryflood@thrivingcommunitiesforall.com`
- TCAF address: 17912 Stefano Drive, Pflugerville, TX 78660-7020 c/o Terry D Flood Sr.

**Federal IDs (TCAF)**
EIN **41-3618003** · UEI **KDDVD1FGLW35** · CAGE **209N1** · SAM Active to **2027-05-06** · 501(c)(3) determined under 170(b)(1)(A)(vi)
