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

---

## A14. Community Voice — full build detail (Phases 1-4, 2026-05-17/18)

**Status:** All four phases shipped, code-review approved. Active short-form pointer in `replit.md`.

- **Routes:** `/voice` (list + start-a-project CTA for authed users) · `/voice/new` (4-step wizard, any authed user, rate 5/hr) · `/voice/:slug` (map + drop-pin) · `/voice/:slug/story` (public #DATA storytelling — anonymized verbatims, chain arrows, thank-you CTA) · `/voice/:slug/insights` (admin-only — gpt-4o-mini clustering with rule-based fallback, sentiment bar, platform badges, JSON export, sync-to-story) · `/voice/:slug/admin` (admin moderation + safety-routing review + settings).
- **Backend:** `server/voice-routes.ts` (~800 lines) + 6 tables (Phase 1: `communityVoiceProjects`, `communityVoicePins`, `communityVoiceComments`, `communityVoiceReactions`; Phase 2-4: `communityVoiceInsights`, `communityVoiceRouting`).
- **Security primitives:** Capability-token P-L08 pattern (`x-voice-token` HEADER ONLY — no query fallback, `timingSafeEqual`) · socket-only IP rate limits (no XFF trust) · regex crisis-detection routes silently to WPH + LifeBridge when `project.crisisRoutingEnabled` · strict-admin gate (`isAdminish` returns true only for `role==="admin"`) · `publicizePin` strips `accessToken`, `ipHash`, `authorEmail` on every public surface · hidden-project guard on `/projects/:slug`, `/pins`, `/insights/latest`, `/chain`.
- **Deterministic platform-routing map (PLATFORM_ROUTING):** safety-concern → WPH + LifeBridge · mental-health → WPH + SafeCogniCare · food-access → LifeBridge + Sankofa · housing/transportation → LifeBridge · workforce-training → Trade Sims + M2C · youth-services → ISSS + Foster Youth · veteran-services → M2C · gap-need → LifeBridge + Civic Signal · story/service-working → narrative only.
- **AI clustering:** gpt-4o-mini, JSON-mode, temp 0.4, 200-pin context cap, 280-char body trim. Returns 3-7 themes with title/summary/sentiment/memberPinIds/recommendedPlatforms/confidence. Rule-based fallback groups by category if AI fails. Rate-limited 10 gens/10min per admin.
- **Publish gate:** Public sees insights only after admin clicks Sync-to-Story (`syncedToStoryAt IS NOT NULL`). Owner controls the publish moment.
- **Pilot:** `pflugerville-holistic-services` (Pflugerville Holistic Services & Assistance, center 30.4394/-97.62, 12 categories, access=public, crisis-routing ON).
- **Phase 5 backlog:** photo uploads via object storage (presigned URLs, same pattern as foster-youth), iframe-embeddable widget (`?embed=1`), chain-web force-graph viz, email/hybrid access enforcement on POST /pins, EN-mirror translation of non-EN pin bodies for AI cluster.
- **Build log:** `docs/active-commitments.md` top section.

---

## A15. Trade Sims — Credentials + Apprenticeships (full detail, 2026-05-17)

- **Page:** `/academy/trade-sims/:tradeSlug/certify`. Test prep gated at 80% lesson completion.
- **Server:** `server/trade-sims-cert-routes.ts`.
- **Static data:** `shared/data/trade-sims/{certifications,apprenticeships,cert-practice-banks}.ts`.
- **Iron Rule:** no quoted fees, every cert links to sponsor.
- **Top-3 funder targets:** Lowe's Gable CBO (window **Aug 1 → Sep 3, 2026**) · TWC Skills Development Fund (rolling, needs ACC) · Home Depot Path to Pro (rolling, PFISD locked as physical-site co-applicant).
- **Federal pipeline:** TCAF prime on Promise Neighborhoods ED-GRANT-26-054 (closes **08/06/2026**); ACC prime on DOL-ETA Strengthening Community Colleges Round 7 when it announces.
- **Pilot cohort target:** 200 learners by July 1, 2026.
- **Live sequencing doc:** `docs/grants/trade-sims-funder-sequencing-2026-05-17.md`.
- **M2 partner one-pager:** `docs/grants/trade-sims-m2-one-pager.md`.

---

## A16. Smart Family Fund — Pitch C submission (2026-05-17)

- ✅ **PITCH C SUBMITTED 2026-05-17 12:13 PM CT** via smartfamilyfund.org/introduce-yourself.
- **Confirmation:** `attached_assets/image_1779038012829.png`.
- **Decision window:** November 2026. Plan ~6 months silence as normal cycle.
- **Three pitches archived:** `docs/grants/smart-family-fund-pitches-2026-05-17.md` (A=Trade Sims, B=Foster-Youth, C=Ecosystem **SUBMITTED**).
- **Summer parallel work:** warm-intro outreach (Archie/Horizons or Roland/TheraHive lanes) + diligence-stage follow-up materials addressing scale-density caution.
- **Current status:** `docs/active-commitments.md` top section.

---

## A17. Two-entity registry — full IDs (verified 2026-05-15)

- **ISS LLC** (Integrated Services and Solutions LLC) — Dr. Flood's for-profit. Used for opportunities nonprofits can't apply for (SBIR/STTR, GSA Schedule, for-profit set-asides).
  - EIN **`87-2795417`** · TX SOS **`0804240615`** · SAM UEI **`C7YDV3P8EHL7`** · CAGE **`9VKK3`** · SAM Active, expires **2027-03-30**.
- **Routing:** for-profit-only → ISS LLC primary, flag for joint-venture-with-TCAF review, never auto-submit.
- **M&T Consulting Solutions LLC** = partner-co-owned, OUT-OF-SCOPE unless user explicitly says otherwise.
- **TCAF SAM activation narrative:** UEI `KDDVD1FGLW35` · CAGE `209N1` · renewal due 2027-05-06 (calendar 2027-04-01) · ZIP+4 78660-7020 · DBA blank → use legal name "The Collaborative Advocate Foundation" on federal forms.


## A18. Corridor Chainweb — citation-chained evidence pipeline (full detail)

The machine-checkable Iron-Rule enforcement layer under Community Voice and all community storytelling — the "Measure equivalent for the entire US" foundation, automated, primary-source-only, citation-traceable.

- **Files (~4,000 LOC total):** `server/corridor-chainweb.ts` (593) · `server/corridor-story.ts` (911) · `server/corridor-docs.ts` (457) · `server/resident-journey.ts` (399) · frontend `client/src/pages/corridor-{docs,docs-live,evidence,intelligence}.tsx` + `client/src/pages/resident-journey.tsx`.
- **Guarantee:** every fact written to evidence storage cites its primary-source step.
- **8-step chain pulls:**
  - Census ACS — B01003 (total pop) · B01001B (Black pop) · B17001B (Black poverty) · B11003B (Black family structure)
  - CDC PLACES — mental health prevalence
  - ATSDR SVI 2022
  - FBI Crime Data Explorer
- **Provenance contract:** each step records `methodology: "CHAIN STEP N · ..."` and `verifiedBy: "chainweb:<step_id>"`.
- **Routes:** `POST /api/corridor/chainweb/run`, `GET /api/corridor/chainweb/last`.

## A19. ThriveUp Concepts v1 — full build detail (May 21, 2026)

Hub + 8 cards, one per engineering lane, every card has a real working physics simulator (not a placeholder).

- **Hub:** `/concepts` with lane filter.
- **Sidebar:** "Concepts" under Career Mentors.
- **Shared shell:** `client/src/components/concepts/concept-card-shell.tsx` — lane badge, hook, title, sim slot, 90-sec explainer, related links, meta title/description.
- **Registry:** `client/src/lib/concepts/registry.ts` (`LANES` + `CONCEPTS`) — single source of truth for hub + sidebar + cross-links.

**The 8 cards:**
- mechanical → oil pumpjack (four-bar linkage, kinematics-solved)
- electrical → transformer (V₂=V₁·N₂/N₁, animated flux + current arrows, turns-ratio slider)
- civil → suspension bridge (drag truck, real cable tension + tower compression in kN, dead+live load)
- chemical → lithium battery (Li⁺ ions animate between anode/cathode, SoC bar, voltage 3.0–4.2V)
- aerospace → airplane wing (AoA slider -4° to 25°, streamlines, Cl curve with stall at ~16°)
- software → public-key encryption (real RSA with p=11/q=13/n=143/e=7/d=103; type any text, see m^e mod n live)
- energy → wind turbine (P=½ρAv³Cp, cut-in 3 / rated 12 / cut-out 25 m/s, pitch auto-feathers above rated)
- biomedical → pacemaker (live ECG trace, intrinsic-rate slider, demand-pacing floor — pacer only fires when interval > 60/floor seconds)

**Files:** `client/src/components/concepts/<slug>-sim.tsx` × 8 + `client/src/pages/concepts/<slug>.tsx` × 8 + hub `client/src/pages/concepts/index.tsx`.

**Cross-links:** Transformer card → Electrical Trade Sims (`/academy/trade-sims/electrical`).

**Differentiator vs. SmartyMe/Brilliant:** working physics simulators behind every explainer, not just diagrams.

**Audiences:** curious adults, parents, career-curious teens, tradespeople browsing the next lane, re-entry folks, foster youth, funder leave-behinds.

**Next-version backlog (NOT shipped):** authoring tool, more cards per lane, in-card embedded readings, share/screenshot export.

## A20. Regional Briefing v2 — multi-location compare + save-as-workflow + Chainweb-anywhere (2026-05-22)

**Surface:** `/regional-briefing` (sidebar Community Intelligence). One chat-style textarea. AI parses → `{locations[≤6], topic}`. *Parse* exposes an editable chip list (region · ZIP · 5-digit county FIPS). *Run briefing* streams a 10-section answer.

**Output sections (system prompt enforces all 10):** 1. data story · 2. verifiable data (Census ACS · CDC PLACES · ATSDR SVI · FBI CDE — say HAVE vs needs-pull) · 3. **stakeholders by ZIP** (named: county judge, ISDs, MHMR/LMHA, FQHCs, hospital, faith, workforce, justice, philanthropy) · 4. matching grants (every one in context) · 5. ALL TCAF solutions (enumerate every relevant platform) · 6. **implementation plan by ZIP** · 7. **measurable outcomes per stakeholder per ZIP** (table) · 8. cross-location comparison table (only when 2+ locations) · 9. concrete next moves · 10. Iron Rule reminders.

**Backend (`server/regional-briefing-routes.ts`):**
- `POST /api/regional-briefing/extract` — parse question → `{locations, topic}` (cheap, no full briefing).
- `POST /api/regional-briefing/stream` — SSE. Context event first (locations + per_location grants + platforms), then content chunks, then `{done:true}`.
- `POST /api/regional-briefing/query` — non-streaming JSON variant.
- `GET /api/regional-briefing/context` — preview matches, no AI cost.
- Saved-workflow CRUD: `GET /workflows` · `POST /workflows` · `GET /workflows/:slug` · `POST /workflows/:slug/cache` · `DELETE /workflows/:slug`. All scoped `createdBy = uid` (no IDOR).
- All endpoints auth-gated + per-IP rate-limited.

**Per-location context loader:** dedup tokens from region + topic + zip, OR-LIKE on `grant_opportunities.title` + `description`, ordered by fit DESC then deadline ASC, limited 20 per location. Platforms loaded once (global, `publicVisible=TRUE`).

**Schema:** `briefing_workflows` (id · slug UNIQUE · name · question · `locations` jsonb `[{label,region,zip?,countyFips?,metroId?}]` · topic · lastBriefing · lastRunAt · createdBy · timestamps). Index on `createdBy`. Pushed to DB 2026-05-22.

**Chainweb-anywhere:** `POST /api/corridor/chainweb/run-counties` body `{counties:[{countyFips, metroId?}]}`. `runChainWeb()` already took a `counties` param — endpoint just exposes it. Filters to 5-digit FIPS, caps 12 counties, hardens `metroId` to `[A-Za-z0-9_-]{≤32}`. Both `/run` and `/run-counties` now gated: `requireSignedIn` + rate limit (3/15m and 6/15m). Logs triggering uid. (Pre-2026-05-22 the `/run` endpoint was unauthenticated — gated as part of this build per code-review finding.)

**Frontend (`client/src/pages/regional-briefing.tsx`):** chat textarea + Parse + Run + editable locations + Save-as-workflow dialog + saved-workflows sidebar (Load / Re-run / Delete) + Run-Chainweb button (uses FIPS from rows). Streams answer, then best-effort caches `lastBriefing` to active workflow.

**Pilot artifacts (Round-1, single-location):** `docs/regional-briefings/north-wilco-childcare-infrastructure-2026-05-22.md`; Voice project `/voice/north-wilco-childcare-gaps` (id=2).

**Lesson:** when refactoring an existing engine to be input-driven (Chainweb counties param), check whether the new HTTP entrypoint inherits the same auth posture as the old one. Here the old `/run` was unauthenticated — adding `/run-counties` without auth would have doubled an existing hole. Always gate the new sibling AND backfill the old one.

### A20 addendum — Briefing prompt upgrade to woven-narrative (2026-05-22 PM)

**Trigger:** Dr. Flood feedback — the v2 output read as a section dump, not a deep data story. He wanted the depth of an in-chat tri-county comparison (Williamson · Travis · McLennan) where the briefing actually *understood the place*.

**`buildSystemPrompt` rewritten in `server/regional-briefing-routes.ts`** (function still at the same name; multi flag unchanged). Key shifts:

1. **New section 1 — "The place (the setting)":** 2–4 paragraphs per location establishing geography, economy, demographic shift (last 10–20y), civic structure (county judge form, ISD count, LMHA, hospital district), and the 1–2 historical decisions that still shape today (annexation, refinery siting, ISD splits, base closures, immigration waves). Every later section reads through this lens.
2. **New "THE BAR" preamble** before the section list — four ground rules: (a) treat the location as a living system, (b) every stat must connect to people-institution-cause-consequence or it doesn't belong, (c) name the hidden drivers (annexation, redlining, ISD boundaries, LMHA catchment, oil/gas legacy, refugee corridors, jail trends, FQHC service-area maps), (d) show threads — section 4's stakeholder must reappear in section 7's plan and section 8's outcome table.
3. **Stakeholder ecosystem (section 4)** is now a *map of who-touches-whom*, not a list. County judge → commissioners court → ISD supts → MHMR/LMHA director → FQHC CMOs → hospital district CEO → workforce board → DA + sheriff + PD/PO → faith anchors → philanthropy POs → grassroots conveners. Each gets a one-line note on what they actually control + what they're known to care about right now. `[verify]` mark required when not 95% sure.
4. **Grants (section 5)** must be *situated* — every grant tied to a ZIP, a stakeholder, and a problem from section 2 (not just listed).
5. **TCAF solutions (section 6)** mapped to threads, including honest "this one isn't a clean fit here" calls.
6. **Implementation plan (section 7)** — each step names owner + stakeholder convening + TCAF capability + funding source + 30/60/90-day milestone. Threads visible.
7. **Outcomes (section 8)** — full table: stakeholder | ZIP | committed outcome | metric | timeframe | evidence source. Every stakeholder named in section 4 must appear here or be explicitly out-of-scope.
8. **Comparison mode (section 9, multi only)** is now a SYSTEMS comparison — same demographic shift but different civic capacity, same grant fit but different political risk. Dimensions × locations: demographic engine · economic base · civic capacity · funding receptivity · political risk · best-fit grant · TCAF lead capability.
9. **Closing rule** explicit: "If a stat in section 2 doesn't reappear as a stakeholder action in section 4, a grant target in section 5, a TCAF activation in section 6, a plan step in section 7, and a measured outcome in section 8 — you haven't done the job."

**Hallucination guardrails preserved + tightened:** never invent stakeholder names — write "the [role] (verify current officeholder)" when unsure. All prior rules retained (Dr. Flood = President, terryflood@…, Meredith COI flag on any City-of-Austin pass-through).

**No backend/DB changes.** Same endpoints, same context loader, same rate limits. Just a richer system prompt → richer output for the same token cost on the input side (output will be longer; user can shorten with a follow-up if needed).

### A20 addendum 2 — Scope-aware briefing (2026-05-22 EVE)

**Trigger:** Dr. Flood — "I'm not looking for answers about grants right now. Can it allow me to choose the scope based on my input? I am just trying to understand the situation. They can have options to add that additional analysis, but what I want is what I want." Previous version always produced all 11 sections regardless of question.

**`buildSystemPrompt` rewritten again** to add a SCOPE CONTROL preamble + 5-scope menu the AI picks from based on intent:
- **[A] Situation understanding (DEFAULT)** — triggers: "tell me about", "what's happening", "help me understand", "preparing for a meeting with X", "paint the picture" → §1-4 only (place / data story / verifiable data / stakeholders). Stops there.
- **[B] Asset / ecosystem map** — triggers: "what's already there", "who's serving this community", "map the assets", "landscape" → §1-4 + an "Assets in the region" section that pulls ALL public/nonprofit/philanthropic/faith/business-anchor/coalition assets in the area (county/ISD/MHMR/FQHC/hospital district/workforce board/library system/health dept · food banks/shelters/reentry/refugee/DV/youth/faith anchors/immigrant-serving/disability · community foundations/corporate giving/healthcare anchor community-benefit · CoC/BH consortia/education collective-impact/food-systems coalitions). **Explicitly NOT TCAF-only.** `[verify]` mark on uncertain names.
- **[C] Funding picture** — triggers: "what grants", "who funds this", "show me the money" → §1-4 + §5.
- **[D] TCAF fit** — triggers: "how would TCAF help", "where do we plug in" → §1-4 + §6, with honest "what's already covered well" framing.
- **[E] Full strategy** — triggers: "build me a plan", "full briefing", "I need to pitch this", "give me everything" → all sections.

**Audience-lens rule:** if the user names a third-party audience (United Way, foundation, city, coalition), frame the WHOLE briefing through THAT audience's lens — do not center TCAF unless explicitly asked.

**End-of-output offer:** always close with a one-liner offering the other scopes the user didn't pick ("Want me to add the funding picture, the asset map, or a sequenced plan? Just ask.") so they can expand without re-typing the setup.

**Stay-in-scope explicitly framed as the job, not a fallback:** "Producing extra sections the user didn't ask for is a failure, not a bonus."

No backend/DB/endpoint changes; pure prompt rewrite. Same context loader, same rate limits.

---

## A21 — Recognition-and-Ratification Doctrine (R&R, Flood 2026-05-22)

`docs/recognition-and-ratification-doctrine.md` — TCAF operating lens encoded into every regional briefing.

Three novel claims vs. the 8 nearest strands (Positive Deviance · Harm Reduction · ABCD · CHW/task-shifting · Rogers reinvention · FRAME-IS · Lipsky · Practice-Based Evidence):

1. Mechanism lives at the **BRIEFING layer**, not the intervention layer.
2. **Dignity clause** = hard non-displacement constraint.
3. **Counterfactual claim** = R&R is the only path that moves the dependent variable, because displacing existing adaptation is fighting a current.

Wired into `buildSystemPrompt()` in `server/regional-briefing-routes.ts`. Cite this doc on June 3 capstone Q&A.

---

## A22 — Regional Briefing v2 prompt + architecture (2026-05-22)

**Scope-aware prompt (5 scopes):**
- [A] Situation — §1-4 default
- [B] Asset map — §1-4 + ecosystem assets, NOT TCAF-only
- [C] Funding — adds §5
- [D] TCAF fit — adds §6
- [E] Full strategy — all sections

Audience-lens framing (United Way / foundation / city) overrides TCAF-centering. Stay-in-scope is the job. "Producing extra sections the user didn't ask for is a failure, not a bonus."

**Discipline hardening (NIGHT pass):**
- §7 requires literal H3s `### CFIR determinants` + `### Fidelity-critical actions` + `### Sequenced rollout`
- §8 requires `### RE-AIM scorecard` + `### Outcome commitments table`
- Pre-flight anchor line REQUIRED first line: `> Audience: X · Scope: Y · Disciplines on: R&R, CFIR, RE-AIM, fidelity, dignity-clause`
- No-grant-roller default (only [C]/[E] or explicit funding ask surfaces §5)
- Closed grants filtered server-side (`deadline IS NULL OR >= CURRENT_DATE`)
- Platforms locked to canonical 15 allowlist in code (stops "25 in scope" drift + stale rows like Advertising Targeting / PillScheduler / Ecosystem Nexus from entering AI context)

**Three-door architecture (LATE-NIGHT, single-point-of-failure fix):** AI is no longer the only path.
1. AI chat = `/stream`
2. **No-AI structured = `POST /structured`** — same `{locations, topic, scope}` body; deterministic markdown from DB rows via `loadLocationContext` + `loadStructuredRpliceForCounty`; honest disclosure ("no RPLICE plans on file" instead of inventing them); badge "data-only · no AI" on briefing card; scope dropdown + "Build from data" button in same Ask card.
3. **Saved-workflow replay** — both "Re-run AI" and "Replay data" buttons per saved workflow.

Drizzle uses `inArray()` not `sql ANY()` (avoid crash that took /stream offline 2026-05-22 22:28 UTC).
