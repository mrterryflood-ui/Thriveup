# Memory Archive

Stale-but-permanent reference material moved out of `replit.md` to keep the active memory lean. **Nothing here is deleted** — it is preserved here in full so future sessions can recover the full record if needed. `replit.md` retains one-line pointers back to entries here.

Last updated: 2026-05-17 PM-late.

---

## A1. Vann Collaboration Kit — full build detail (May 14, 2026)

**Status:** Built, shipped, in use. Active short-form summary in `replit.md` is sufficient for normal session work; reach for this entry when modifying the kit itself.

- **Docs:** `docs/partners/Vann-Vanntastic-Strategy-Memo.md` + `docs/partners/Vann-Meeting-Brief.md`
- **Pages:** `/partners/vann-hub`, `/partners/family-program-tracker`, `/partners/rfp-storyteller`
- **Schema (7 tables in `shared/schema.ts`):** `community_partner_orgs`, `households`, `household_members`, `community_programs`, `program_enrollments`, `program_attendance`, `community_services`
- **Routes:** `server/community-program-routes.ts`
- **Seed:** `server/seed-vann-demo.ts` (idempotent, runs on boot; logs `[seed] Vann demo seeded: sistahs-cwt, iasis-ccc`)
- **Sidebar group:** `communityPartnersItems` in `app-sidebar.tsx`
- **Leave-behind PPTX:** `scripts/generate-vann-leavebehind-pptx.ts` → `dist/Vann-Collaboration-LeaveBehind.pptx`
- **Two anchor RFPs in storyteller:** SAMHSA Minority BH (federal scaling-up) + Wichita CDBG Public Services (local scaling-out).
- **The three entities at the table:**
  1. **Sistahs Can We Talk Inc.** — KS 501(c)(3) since 2015; primary KS-side grant applicant; Dr. J. Michelle Vann Founder & President; 29th & Grove Wichita; BIPOC women's health, Healthy Me Initiative, free cancer screenings, youth mentoring, digital storytelling.
  2. **Iasis Christian Center** — Pentecostal/Apostolic church, 37+ yrs; Sr Pastor William Vann (spouse) + First Lady Michelle Vann; Wednesday youth programs (Joshua Generation 12+ / Academy of Excellence ≤11, Wed 5:30–7pm w/ meal & transport). **NEVER list as City of Wichita grant applicant without spouse-relationship COI on the face of the application.**
  3. **Vanntastic Solutions LLC** — for-profit executive wellness coaching + speaking + books (*Healthy Plates*, *Stop the Merry-Go-Round*, *Help Along the Journey*, *From Supporting Role to Leading Lady*); never an applicant on nonprofit/government grants.
- **Dr. Vann's affiliations that change strategy:** Sedgwick County Mental Health Advisory Board seat (opens SAMHSA + county discretionary), KSUN Radio 95.9 host, Tabor College Wichita Adjunct, Wichita Public Schools 20-yr veteran, Greater Wichita Ministerial League, WeKan, Health & Wellness Coalition of Wichita, Anthropocene Alliance.
- **Origin of the request (Dr. Vann email, May 13, 2026):** *"Something similar to what you showed for our youth program. I want to be able to track attendance, family structure, and services the families are engaged in."* Pivot from child-protection lens to community-asset lens — family is the unit, not the individual.
- **Lesson:** Dr. Vann has NEVER discussed foster youth with the user. Prior memory falsely claimed she had. Stay in her confirmed lane (wellness coaching, behavioral engagement, women's mindset) until user explicitly opens new topics. General rule: when memory says "user X expressed interest in Y," treat it as a hypothesis to verify with user, not a fact to act on.

---

## A2. Anika Amie ≠ TCAF principal (May 12, 2026)

Name was embedded in inherited RWJF draft + `STRATEGIC-INTELLIGENCE-PLAYBOOK.md` attribution + `server/rag-engine.ts:670` source citation as "TCAF Founder/ED." User does not know this person. RWJF draft quarantined with DO-NOT-USE banner; playbook + RAG stripped of false attribution; principle preserved.

**Permanent rule:** before treating ANY inherited grant draft as TCAF voice, run `rg -i "founder|executive director|project director|principal investigator|applicant name"` and verify every named person is a known TCAF principal.

---

## A3. SafeReport upgrade detail (May 15, 2026 — live at safereports.net)

No longer just mandatory-reporter incident tracking. Now **"Compliance-Grade AI for Clinical Settings"** — Clinical Decision Support (CDS) for behavioral-health workflows, FHIR + CDS Hooks healthcare interop, 0 PHI bytes egressed, HITL default-on, 100% cited recommendations, validated longitudinal screening (PHQ-9/GAD-7/C-SSRS/PCL-5/ACES), 50-state mandatory-reporter coverage, free-forever tier.

**Now belongs in the BH stack alongside Whole-Person Health, not just in the child-welfare stack.**

Files touched:
- `server/grant-routes.ts` — PLATFORM_CAPABILITIES BH + Child & Family Safety areas, PLATFORM_DIRECTORY, TIER1_KEYWORDS added: "clinical decision support", "cds hooks", "fhir", "phi-safe", "human-in-the-loop", "longitudinal screening", "compliance-grade ai"
- `server/ecosystem-connector.ts` — row updated
- `docs/ecosystem-catalog.md` — entry updated

---

## A4. EIN — full incident history (May 12 + May 15, 2026)

**Final truth (primary-source verified 2026-05-15):** EIN is `41-3618003`. Verified from:
- IRS EIN Assignment PDFs in `attached_assets/The_Collaborative_Advocate_EIN_Nonprofit_IRS_*.pdf` (dated 1/14/26 3:51 PM)
- SAM.gov entity record
- Swyft Filings business record
- IRS sa.www4.irs.gov screenshots (user-supplied 2026-05-15)

All four agree on `003`.

**May 12 sweep (WRONG):** Agent replaced `41-3618003` → `41-3618503` across ~61 files claiming the `003` was a typo and `503` was correct per "IRS Letter 947." Agent never opened the IRS PDFs. The PDFs said `003` all along. This sweep was the error.

**May 15 sweep (CORRECTION):** Agent reverted `41-3618503` → `41-3618003` across 72 files (count grew between sweeps as new content was authored using the wrong number). `attached_assets/` left untouched both times.

**Funder-side implications:** Any grant submitted before May 12 with EIN `41-3618003` was CORRECT. Any grant drafted or submitted between May 12 and May 15 with EIN `41-3618503` was WRONG and may need correction. Specific checks:
- **City of Austin AEI FY26** — submitted, verify which EIN appeared on the submitted PDF in AustinFirst portal
- **TWC RFA 32026-00162** — FORM-A-APPLICATION submitted, verify EIN on submitted Form A
- **Spencer Foundation Narrative** — check submission status
- **St. David's WAB2 LOI** — submitted via GivingData 4/27/2026 (before May 12 sweep, so likely correct `003`)
- NSF / DOL / CDMRP / RARE / Borealis / RWJF drafts — drafts only, no correction needed.

**Live public-facing sites:** ThriveUp Academy pages (`landing.tsx`, `grant-command-center.tsx`, etc.) carried wrong `503` for 3 days between sweeps; now correct. M2C / vetmissiontransition.com (separate Replit project) was never touched by either sweep — its `003` has been correct continuously.

**Why this matters:** The May 12 "correction" cited a primary source (Letter 947) that nobody had actually read. The IRS PDFs were on disk the whole time. Permanent lesson: always open the actual file before claiming a typo. Never trust prior memory's claim of verification — verify the verification. (See Iron Rule extensions in `replit.md`.)

---

## A5. Candid (free tier) workflow (May 12, 2026)

User directive — use Candid free tier (candid.org). First priority is claiming TCAF Nonprofit Profile under EIN 41-3618003 (Silver+ seal). NO API access on free tier → no automated wiring into `server/grant-routes.ts` discovery engine; manual RFP Bulletin only. Full workflow detail in `docs/active-commitments.md` "Candid (free tier)" section.

---

## A6. P-L09 & P-L10 — engineering gotchas (still active)

These remain referenced in `.agents/skills/map-gap/lessons-learned.md` and are kept here for retrieval convenience.

- **P-L09 — `pptxgenjs` is CommonJS-default-export.** Under tsx-ESM, `import PptxGenJS from "pptxgenjs"` → `TypeError: PptxGenJS is not a constructor`. Fix:
  ```ts
  import { createRequire } from "node:module";
  const require = createRequire(import.meta.url);
  const PptxGenJS = require("pptxgenjs");
  ```
- **P-L10 — `req.params` typed `string | string[]`.** Destructuring breaks Drizzle `eq()` overload. Always coerce: `const agencyId = String(req.params.agencyId);`.

---

## A7. ThriveUp Trade Sims — full build history (May 2026)
**Top-line for the agent (the version that stays in `replit.md`):** 5-trade × 15-lesson skilled-trades sim engine. Canvas coverage 45/75 (60%) after the 2026-05-17 PM Phase D wrap.

**Trades + engines:**
- Electrical → `linear-dc` (Modified Nodal Analysis solver) → `CircuitCanvas` — 15/15 lessons with canvas.
- Plumbing → `pipe-network` (Hardy-Cross) → `PlumbingCanvas` — 11/15 lessons with canvas; backflow rubric grading.
- Welding → `heat-input` (computeHeatInput + predictPenetration + evaluateWeldVsSpec, AWS D1.1/D1.2/D1.6) → `WeldingCanvas` (added 2026-05-17 PM) — 8/15 lessons with canvas.
- Automotive → `linear-dc` re-use → `AutoCanvas` — 15/15 lessons with canvas (battery sag UX).
- HVAC → `thermal-airflow` (`solveThermal` — sensible+latent loads, sizing balance, comfort verdict) → `HvacCanvas` (added 2026-05-17 PM) — 11/15 lessons with canvas.

**Pattern locked at 4 files + 1 seed per new trade:** engine solver (`client/src/lib/trade-sims/<trade>/<solver>.ts`), tests (`*.test.ts`), component-defs (`component-defs.ts`), lesson data (`shared/data/trade-sims/<trade>-lessons.ts`), seed script (`scripts/seed-trade-sims-<trade>.ts`).

**Player gating (tightened 2026-05-17 PM, no-existing-users so no migration concern):**
- Canvas lesson Mark Complete = tabs visited + ran sim once.
- Concept-only lesson Mark Complete = tabs visited + ≥40-word reflection in Solo.
- Always-visible 3-item checklist in Debrief (no silent disabled state).
- Engine-mode badge maps to learner-facing labels: linear-dc / pipe-network → "Interactive sim"; heat-input / thermal-airflow → "Calculator + sim"; concept-only → "Read + reflect". Raw mode names never leak.
- `soloReflection` and `sandboxJournal` persisted to localStorage keyed by `lesson.id` (`trade-sims:reflection:<id>` / `trade-sims:journal:<id>`) so refresh doesn't wipe drafts.

**Concept-only Sandbox (closed 2026-05-17 PM-late):** The "Sandbox available in Phase B+" placeholder is removed. Every concept-only lesson now surfaces its existing `sandboxStarter.prompt` + a persisted journal Textarea. Counts as Sandbox engagement.

**AI tutor (T008):** `POST /api/trade-sims/ai-tutor/hint` → `generateMultiAIResponse` with mode-specific prompts (hint=Socratic single-engine, debrief=ensemble consensus + credential pathway, sandbox_help=short nudge). Lesson context loaded from DB and injected so AI is grounded, not hallucinated. Multilingual via `language` param. Graceful fallback if all providers fail — player never breaks.

**Files of record:**
- Player: `client/src/pages/academy/trade-sims/lesson-player.tsx` (routes `/academy/trade-sims/:tradeSlug/:lessonSlug`).
- Backend: `server/trade-sims-routes.ts` + 6 tables in `shared/schema.ts` (tradeSimsTrades / Lessons / LessonProgress / SandboxProjects / AiTutorSessions).
- Audit: `docs/grants/trade-sims-audit-2026-05-17.md`.
- Build log (this session): `docs/active-commitments.md` "2026-05-17 PM — Trade Sims Phase D wrap" section.

## A8. SSG Fox FY27 submission — full context (May 15, 2026)
**Top-line for `replit.md`:** TCAF is applying for SSG Fox FY27 (deadline 2026-06-12 4:59 PM ET). Submission assets live on **vetmissiontransition.com** (M2C platform), NOT this ThriveUp Academy codebase. Do not rebuild Fox pages here. Year 1 = Central TX only (Pflugerville–Manor–East Austin, Travis/Williamson). Ask: $400K–$600K. EIN on live site is correct (41-3618003). Brief: `docs/grants/ssg-fox-fy27/00-funder-brief.md`.

**Pages on M2C:** Full Application Narrative `/ssg-fox-program` · Reviewer One-Pager `/ssg-fox-onepager` · Platform Overview One-Pager `/platform-onepager` · Live Evidence Dashboard `/evidence/tcaf`.

**Geography rationale:** Sedgwick County KS deferred to Year 2 renewal scaling pathway. Priority 2 new applicant stays focused, doesn't overreach.

**Blocker status (as of 2026-05-15 PM):** empty evidence dashboard now wired, 91.8% framing fixed, ecosystem-count inflation on platform-onepager still outstanding. Live list in `docs/active-commitments.md`.

**EIN history:** Live site has `41-3618003` — that is correct, matches IRS+SAM+Swyft. Memory previously claimed `503` was correct — that was the agent's error, swept and reverted 2026-05-15 PM across 72 files. See A4 for the full incident.

## A9. Iron Rule — full doctrine + extensions + costs of failure (May 15, 2026)
**Top-line for `replit.md`:** Never conjecture. Always verify against a primary source. Memory is not a primary source. No mass find-replace based on memory. Identifiers (EIN, UEI, CAGE, deadlines, dollar amounts) get treated like crypto — immutable lookups, paste verbatim from primary doc on the same turn. `attached_assets/` is read-first. Conflicting sources = hard stop, surface to user, do not reconcile silently.

**Bidirectionality (added evening 2026-05-15):** Iron Rule applies in BOTH directions. Conjecturing "we lack X" (research PI, partner, credential, capacity) without searching memory first is the same failure mode as conjecturing "we have X" without verifying. Before claiming TCAF or Dr. Flood lacks something for any grant: (a) `rg` memory for credentials, partners, prior submissions, coalition lists; (b) read the canonical bio at `docs/grants/NSF-TechAccess-LOI-Draft.md` lines 14-22; (c) check `docs/grants/TCAF-Coalition-Partner-Presentation.md` for named partners.

**Cost-of-failure log (do not delete — these are why the rule exists):**
- **2026-05-12, EIN typo.** May 12 EIN sweep (003→503) cited "IRS Letter 947" as the source without ever opening the IRS PDFs in `attached_assets/`. PDFs said 003 all along. Result: 72 files in this codebase carried a wrong EIN for 3 days, and the agent told the user the live submission site had a typo when the typo was the agent's.
- **2026-05-15 AM, Centene.** Centene Foundation May 31, 2026 deadline carried forward as fact from a stale intelligence file. Verified May 15 from centene.com — Centene Foundation moved to invitation-only in 2026, open-cycle does not exist.
- **2026-05-15 PM, WT Grant scarcity.** Claimed WT Grant would require a university PI when (1) Dr. Flood IS the research-trained PI (DHA + DBA + MS I/O Psych + MS Implementation Science in-progress at Dartmouth Geisel + VA Public Health Social Scientist + federal grants management certified), (2) the Dartmouth institutional tie was already in memory, (3) ACC was already a named coalition partner via Prof. Laura Franco. User correction (verbatim): "The audacity for you to pretend that I am not a research trained pi and that I have not given you a list of qualified pi's is insulting."

**Operational sub-rules:**
- Subagent answers that cite our own internal drafts as "verification" are circular and must be rejected.
- Any sweep touching ≥3 files for an identifier requires: (a) open the cited primary source on the current turn, (b) paste the relevant quote into reasoning, (c) get explicit user "go" before executing.

## A10. Two-entity strategy + Dr. Flood entity registry (May 15, 2026 PM)
**Top-line for `replit.md`:** Dr. Flood owns ISS LLC alongside TCAF for opportunities nonprofits can't apply for (SBIR/STTR, GSA Schedule, for-profit set-asides). Routing rule: for-profit-only opportunities → ISS LLC primary, flag for joint-venture-with-TCAF review. Never auto-submit. M&T Consulting is out-of-scope unless user says otherwise.

**Integrated Services and Solutions LLC ("ISS LLC")** — primary-source verified from SAM.gov + LegalZoom screenshots:
- EIN: `87-2795417`
- TX SOS: `0804240615`
- Formed: 2021-09-21
- SAM UEI: `C7YDV3P8EHL7`
- CAGE: `9VKK3`
- SAM Active, expires 2027-03-30
- Same Pflugerville address as TCAF
- DBA: blank

**M&T Consulting Solutions LLC** — partner-co-owned, OUT-OF-SCOPE per user directive. Do NOT route opportunities there without explicit instruction. Identifiers TBD until user provides.

Full entity registry: `docs/active-commitments.md` "Dr. Flood's Other Entities — Registry" section.

## A11. SAM.gov + federal registration — narrative (May 14, 2026)
**Top-line for `replit.md`:** TCAF SAM.gov status ACTIVE since 2026-05-14, UEI **KDDVD1FGLW35**, CAGE **209N1**, renewal due **2027-05-06** (calendar reminder 2027-04-01). Full ZIP+4 78660-7020. DBA blank → default to legal name "The Collaborative Advocate Foundation" on federal forms.

**Activation event:** SAM.gov donotreply email on 05/14/2026 confirmed ACTIVE status; CAGE Code 209N1 auto-assigned by DLA CAGE Program at activation. Eligibility to receive federal awards is now live.

**Renewal cadence:** annual. Failure to renew = loss of federal-award eligibility — set calendar reminder for 2027-04-01 to begin renewal cycle ~30 days before expiry.

Live in `docs/active-commitments.md` "TCAF SAM.gov + Federal Registration Identifiers" section.

---

## A12. Trade Sims — full implementation detail (May 17, 2026)

**Top-line for `replit.md`:** 5 trades × 15 lessons = 75 in DB. Canvas coverage **75/75 (100%)** as of 2026-05-17. Player at `client/src/pages/academy/trade-sims/lesson-player.tsx`. Backend `server/trade-sims-routes.ts` + 6 tables. AI tutor at `POST /api/trade-sims/ai-tutor/hint`. Audit doc → `docs/grants/trade-sims-audit-2026-05-17.md`.

**Schema (6 tables):** `tradeSimsTrades` · `tradeSimsLessons` · `tradeSimsLessonProgress` · `tradeSimsSandboxProjects` · `tradeSimsAiTutorSessions` · plus user-scoping joins.

**Mark Complete gate:**
- Canvas lessons (any with a sim engine): must run sim at least once before Mark Complete is enabled.
- Concept-only lessons (30 of 75): need ≥40-word Solo reflection before Mark Complete is enabled.

**LocalStorage persistence:** Reflection text + sandbox journal entries keyed by `lesson.id`. Survives anon → login transition. Server progress write happens at Mark Complete, not per-keystroke.

**Engine badge labels (learner-facing, never raw):**
- Canvas + physics → "Interactive sim"
- Calculator + light sim → "Calculator + sim"
- Concept-only → "Read + reflect"

**AI tutor prompt structure:**
- Lesson context injected automatically (trade, day number, concept, current canvas state)
- Mode-specific system prompts: Socratic-hint (nudge, no answer-giving) vs ensemble-debrief (summarize session, suggest next level, surface credential pathway)
- Multilingual via existing `POST /api/translate` route
- Graceful fallback to single-engine if 4-engine synthesis times out

**Sandbox starter prompts:** Every concept-only lesson now shows its `sandboxStarter.prompt` + persisted journal Textarea. The "Phase B+ placeholder" pattern is fully retired as of 2026-05-17 PM-late.

---

## A13. Trade Sims — credentials + apprenticeships + funder sequencing (May 17, 2026)

**Top-line for `replit.md`:** Cert page `/academy/trade-sims/:tradeSlug/certify`. Test prep gated at 80% lesson completion. Server `server/trade-sims-cert-routes.ts` (`registerTradeSimsCertRoutes`). Funder sequencing in `docs/grants/trade-sims-funder-sequencing-2026-05-17.md`. M2 partner one-pager in `docs/grants/trade-sims-m2-one-pager.md`.

**Static data files (no new DB tables):**
- `shared/data/trade-sims/certifications.ts` — 3 industry credentials per trade (OSHA 10, NCCER L1, state apprentice reg, AWS SENSE, AWS D1.1, ASE G1, EPA 609, EPA 608 Universal, NATE RTW)
- `shared/data/trade-sims/apprenticeships.ts` — 2-3 registered apprenticeship pathways per trade (IBEW/NECA, UA, ABC, Iron Workers, SMART, OEM tech programs, TDLR, TSBPE)
- `shared/data/trade-sims/cert-practice-banks.ts` — ~35 practice questions across 10 certs, explicit "study questions only" disclaimer

**Universal locators:** apprenticeship.gov · TWC · WorkInTexas (linked from every cert detail page)

**Gating logic:** Test prep page only renders practice content when `tradeSimsLessonProgress.status === "completed"` for ≥80% of that trade's lessons. Works for both userId-scoped and anon-scoped progress.

**Iron Rule framing:** No quoted fees anywhere in product UI. Every credential card links to the sponsoring body (OSHA, NCCER, AWS, ASE, EPA, NATE, etc.) for the authoritative fee/eligibility info. Funder one-pager stays scope-only; live deadlines/amounts live in the dated sequencing doc.

**Top-3 funder targets (verified 2026-05-17 PM-very-late):**
1. **Lowe's Gable CBO** — window **Aug 1 → Sep 3, 2026** (HARD DATES)
2. **TWC Skills Development Fund** — rolling, needs TX CC partner (= ACC, Dr. Flood leading outreach)
3. **Home Depot Path to Pro** — rolling, needs brick-and-mortar co-applicant (= PFISD, already agreed to partner; additional partners welcome but PFISD is locked)

**Closed/paused/invitation-only:**
- TWC JET FY26 closed
- USDOL HVRP PY26 closed; next PY27 ~early 2027 (Dr. Flood to pursue M2 signed sub-agreement before then)
- USDOL ABA + H-1B no active NOFA
- Siemens/Schultz invitation-only

**Federal pipeline scan 2026-05-17:**
- SAM.gov returned zero relevant opps for this scope (SAM = contracts, not grants)
- Real federal plays: **(a)** TCAF prime on Promise Neighborhoods ED-GRANT-26-054 (closes **08/06/2026**), **(b)** ACC prime on DOL-ETA Strengthening Community Colleges Round 7 when it announces — Round 6 FOA-ETA-26-40 closes 05/20/2026 too tight, **(c)** sub-awardee role under TWC/TEA on state-formula pots (DOL-OESE-34043 CPE state-only, SAEF4 formula, WIOA Youth formula)
- Full Tier 1/2/3 table in `docs/grants/trade-sims-funder-sequencing-2026-05-17.md`

**Confirmed partner moves (2026-05-17 PM-very-late):**
- **TX CC partner = Austin Community College (ACC)** — Dr. Flood to lead outreach
- **Physical-site partner for Path to Pro / K-12 angle = Pflugerville ISD (PFISD)**, already agreed to partner
- **M2 signed sub-agreement** — Dr. Flood to pursue before HVRP PY27
- **SAM.gov API key rotation** completed (env `SAM_GOV_API_KEY`, used in `server/grant-routes.ts`); verified returning HTTP 200 with 16,667 records
- **Pilot cohort target = 200 learners by July 1, 2026** to feed Tier 2 discovery calls
