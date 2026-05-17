# ThriveUp Academy
An AI-powered national community infrastructure platform that connects individuals to grant funding, aligns service delivery with workforce development, and produces measurable community impact.

## Run & Operate
- **Run:** `npm run dev` · **DB push:** `npm run db:push` · **Typecheck:** `npm run typecheck` · **E2E:** `npx playwright test`
- **Ecosystem alignment scan:** `scripts/ecosystem-alignment-scan.sh`
- **Congruence audit (every briefing):** `npx tsx scripts/congruence-audit.ts` — must hit 0 FAIL before any funder meeting.
- **Recompile agent knowledge:** `npx tsx scripts/compile-agent-knowledge.ts` after editing this file or any source it reads.
- **Env vars:** `NETWORK_SECRET_BIBLESTUDY`, `NETWORK_SECRET_HERHEALTH`, `SENDGRID_API_KEY`, `THRIVEUP_SHARED_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, wouter, TanStack Query v5, lucide-react
- **Backend:** Express.js (Node.js), PostgreSQL (Neon) via Drizzle ORM
- **Auth:** Replit Auth (OIDC)
- **AI:** Gemini 2.0 Flash, Claude Haiku 4.5, GPT-4o-mini, Replit AI Integrations GPT-5-nano, OpenRouter (DeepSeek R1)
- **i18n:** EN+ES human-translated; 8 more (VI, ZH, AR, KO, FR, TL, HI, MY) via opt-in AI translation (gpt-4o-mini, batched, localStorage-cached). `useLanguage()` from `@/lib/i18n`; `<LanguageSelector />` from `@/components/language-selector`. Endpoint `POST /api/translate` (`server/translate-routes.ts`). RTL auto for Arabic.

## Where things live
- **Pages:** `client/src/pages/` (192 files inc. `academy/` and `foster-youth/`)
- **Frontend routes:** `client/src/App.tsx` (206 wouter routes) · **Sidebar:** `client/src/components/app-sidebar.tsx`
- **Backend routes:** `server/` (main `routes.ts` + 35+ specific files)
- **Schema:** `shared/schema.ts` (249 Drizzle tables) · **Auth:** `client/src/components/require-auth.tsx`, `useAuth()`
- **Theme:** `client/src/index.css` · **Truth-in-claims:** `client/src/components/partnership-status.tsx`
- **Grant strategy:** `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md`, `CDMRP-FY2026-Master-Grant-Strategy.md`
- **Quintet one-pager (drop-in for narratives):** `docs/grants/QUARTET-ONE-PAGER.md` — Talk Your Talk (89 spoken + 18 sign + 6 learning surfaces) as substrate; Civic Signal + LifeBridge + ThriveUp as service surfaces; Whole-Person Health (mentalwellnesssupport.net) as behavioral-health safety floor. TYT crisis events route INTO WPH.
- **MAP-GAP lessons:** `.agents/skills/map-gap/lessons-learned.md`
- **Active commitments / continuity log:** `docs/active-commitments.md` — running session memory. Read at session start; update at session end.
- **Foster-Youth build log (May 11, 2026):** `docs/foster-youth-build-log.md` — full detail of intake wizard, state portal, policy comparison, risk engine, congruence audit, leave-behind PPTX. Sidebar group `fosterYouthItems` in `app-sidebar.tsx`.
- **Vann Collaboration Kit (May 14, 2026):** Pages `/partners/vann-hub`, `/partners/family-program-tracker`, `/partners/rfp-storyteller`. Three entities (KEEP STRAIGHT): **Sistahs Can We Talk Inc.** (KS 501(c)(3), Dr. Vann is President), **Iasis Christian Center** (her husband Pastor William Vann's church — COI on every City of Wichita/federal grant), **Vanntastic Solutions LLC** (for-profit coaching, never an applicant). Full build detail + entity bios + Dr. Vann affiliations archived in `docs/memory-archive.md#A1`.
- **Ecosystem catalog:** `docs/ecosystem-catalog.md` — 25 DB rows; 15 are public-facing service platforms.
- **🎮 ThriveUp Trade Sims (live):** 5 trades × 15 lessons = 75 in DB. Canvas coverage **75/75 (100%)** as of 2026-05-17 PM-late — all 30 concept-only lessons now show their `sandboxStarter.prompt` + a persisted journal Textarea (no more "Phase B+" placeholder). Player: `client/src/pages/academy/trade-sims/lesson-player.tsx`. Backend: `server/trade-sims-routes.ts` + 6 tables (`tradeSimsTrades` / `Lessons` / `LessonProgress` / `SandboxProjects` / `AiTutorSessions`). AI tutor: `POST /api/trade-sims/ai-tutor/hint` (mode-specific prompts, lesson context injected, multilingual, graceful fallback). Mark Complete gate: canvas lessons must run sim once; concept-only lessons need ≥40-word Solo reflection. Reflection + sandbox journal persisted to `localStorage` keyed by `lesson.id`. Engine badge shows learner-facing labels ("Interactive sim" / "Calculator + sim" / "Read + reflect"), never raw modes. Full history → `docs/memory-archive.md#A7`. Audit doc → `docs/grants/trade-sims-audit-2026-05-17.md`.
- **Grant Discovery Engine (24h auto-scan):** `server/grant-routes.ts` (~line 6359). Sources: SAM.gov (key currently 401), Grants.gov (~45 new/wk), USASpending.gov, curated state/foundation/corporate. ~605 tracked, 205 high-fit. Status `GET /api/grants/discovery/status`; manual trigger `POST /api/grants/discovery/run-now`.
- **"This Week" digest** (`/grant-command-center` → This Week tab): `GET /api/grants/this-week?days=7&minFit=0`, `GET /api/grants/digest/preview?days=7`, `POST /api/grants/digest/send` (admin, manual; auto-cron NOT enabled).
- **Compiled Agent Knowledge Layer:** internal-only deterministic memory hook for the agent. End-user RAG (`server/rag-engine.ts`) is parallel and untouched.
  - Compiler: `scripts/compile-agent-knowledge.ts` reads this file + active-commitments + lessons-learned + ecosystem-catalog + foster-youth-build-log + DB → emits `.agents/knowledge/compiled.json`.
  - Endpoints: `GET /api/agent/knowledge/session-bootstrap` (~3KB at session start) · `GET /api/agent/knowledge/topic/:key` (drill-down) · `GET /api/agent/knowledge` (full) · `POST /api/agent/knowledge/recompile` (admin).

## Architecture decisions
- **Collaborative AI:** 4-engine synthesis (Gemini, Claude, GPT-4o-mini, DeepSeek R1) with RAG and implementation-science frameworks (CFIR, RE-AIM, RPLICE).
- **Grant Systems:** Centralized management with SAM.gov integration, AI semantic analysis, proposal lifecycle. Public program descriptions kept separate from internal funder pursuit details.
- **Truth-in-Claims primitive:** `<PartnershipStatus>` enforces auditable disclosure of partnership stages + dates across the public site.
- **Public/Internal gating:** `<RequireAuth>` wrapper protects internal data + funder pipelines.
- **Jurisdiction-agnostic:** National platform; Travis County TX is implementation template, not a limit.

## Product
- 6 domains: Criminal Justice, Health Equity, Behavioral Health, Workforce & Business, Education & Learning, Community & Advocacy
- ThriveUp Academy (AI Literacy, Workforce, Financial, STEM, FAFSA, apprenticeship)
- Grant management (92+ tracked, command center, AI drafting)
- Justice & reentry · Behavioral & whole-person health · SDOH/Vulnerability/Census tools · Donor outcome receipts
- Ecosystem hub: 15 public-facing service platforms + internal/dev rows = 25 in DB

## Ecosystem (full catalog: `docs/ecosystem-catalog.md`)
- **Use "15 service platforms operated by TCAF" externally — not 25.** "25" is internal architecture only.
- **The 15:** Whole-Person Health · Talk Your Talk · Sankofa Network · Black Maternal Health · Black Men's Health Hub · HerHealth Network · SafeCogniCare · Perfectly Different · LifeBridge · Mission Transition (M2C) · Minority Center of Excellence · ISSS · RPLICE/BetterScience · SafeReport · Civic Signal.
- **SafeReport (May 15, 2026, live at safereports.net):** rebranded "Compliance-Grade AI for Clinical Settings" — CDS/FHIR/CDS Hooks/0-PHI-egress/HITL-default-on/longitudinal screening (PHQ-9/GAD-7/C-SSRS/PCL-5/ACES). Belongs in BH stack now, not just child-welfare. Full detail + file changes in `docs/memory-archive.md#A3`.
- **Quintet to lead with in narratives:** Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health.
- **Top caveats:** TYT row's URL self-overwrites to `lexibridge.net` on every heartbeat (real fix in TYT workspace) · 10 of 25 DB rows aren't public-facing services (1 TCAF parent org + 9 dev/internal/dead-URL: `autoimmune-thrive`, `wholemind`, `ecosystem-nexus`, `code-canvas`, `ad-targeting`, `video-creator-ai`, `pinnacle-business-conglomerate`, `pillscheduler`, `emergency-mgmt`) · Some URLs shared (`implementationineducatio.com` hosts both `isss` and `betterscience`) · Re-probe before linking in submissions; check ALL aliases.

## User preferences
- Iterative development; explain major changes before implementation.
- High-quality, well-tested code; clear, simple language for technical concepts.
- Don't change `vite.config.ts`, `drizzle.config.ts`, `package.json` without explicit instruction.
- Always work in parallel using subagents; don't stop to chat when there's more work to do; keep building.
- Speak plainly, not in jargon. Use President not CEO. Honest disclosure always.
- Every change commits to this memory file. No silent failures.
- Memory continuity is non-negotiable: every session ENDS with a memory commit; every session BEGINS by reading this file. If a fact, person, deadline, partner, lesson, or commitment is not here, it does not exist next session.
- **🚨 SSG Fox FY27 lives on `vetmissiontransition.com`, NOT this codebase.** Deadline 2026-06-12 4:59 PM ET · Year 1 = Central TX only · ask $400K–$600K · EIN on live site is `41-3618003` (correct). Do not rebuild Fox pages here. Brief: `docs/grants/ssg-fox-fy27/00-funder-brief.md`. Full context + blockers → `docs/memory-archive.md#A8` and `docs/active-commitments.md`.
- **🚨 IRON RULE — never conjecture, always verify.** Pull every grant amount, deadline, funder policy, identifier, and capacity claim from a primary source — funder website, RFP attachment, 990-PF, direct funder comms, or a doc in `attached_assets/` opened on the current turn. Memory is **not** a primary source: any sweep touching ≥3 files for an identifier (EIN, UEI, CAGE, DUNS, deadline, dollar amount) requires opening the cited source + pasting the quote + getting explicit user "go" first. Rule applies in **both directions** — conjecturing "we lack X" (research PI, partner, credential) without `rg`-ing memory first is the same failure as conjecturing "we have X." Subagent answers citing our own internal drafts are circular and rejected. Conflicting sources = hard stop, surface to user, do not reconcile silently. Full doctrine + cost-of-failure log (EIN typo, Centene, WT Grant) → `docs/memory-archive.md#A9`.

## Gotchas
<!-- Load-bearing — read every session. -->

- **"President" not "CEO"** for Dr. Flood in public-facing copy; "CEO" is for-profit only.
- **Institutional emails only:** `terryflood@thrivingcommunitiesforall.com` (Dr. Flood, all proposals); `msisnett@thrivingcommunitiesforall.com` (Meredith, non-City work only). No personal Gmail in public copy or proposals.
- **🚨 Meredith Sisnett & City of Austin:** City of Austin employee. NEVER list on any City grant/proposal/contract (AEI, Cultural Arts, APH, EDD, Public Health, AHFC, etc.) as staff/contact/co-lead/board/partner. Non-City (federal/state/foundation/private) only. When in doubt, leave her out and ask user.
- **St. David's Foundation:** always "actively evaluating," never "awarded." **WAB2 LOI DECLINED 2026-05-15** (Regan Gruber Moffitt, J.D., VP Community Investments — letter archived at `docs/grants/submitted/StDavids-WAB2-LOI-Decision-2026-05-15.md`). Funder remains a target via CLC + Community Health Grants cycles; do NOT cite St. David's as "in review" or "under consideration" anywhere in pipeline going forward.
- **Funder names on public pages:** avoid; describe the program category instead.
- **FIPS labels:** never expose to users — use "State Census Code" / "County Census Code".
- **"Texas-only" framing:** use "national platform, Texas-piloted" instead.
- **Silent catch blocks:** prohibited; all server route errors must be handled and reported.
- **Conditional `useEffect`:** prohibited (React hooks rule).
- **Hardcoded grant arrays:** `/api/proposal-pipeline` must read from the `proposal_pipeline` DB table, never hardcoded.
- **🚨 Public no-auth wizards must use capability tokens, not client-supplied IDs.** Server generates id + per-row `accessToken`, returns token once, requires it on every later request as `x-intake-token`. Otherwise IDOR + cost-runaway. Pattern: `server/foster-youth-intake-routes.ts` (`authorizeIntake` + `tokensMatch` w/ `timingSafeEqual`). Pair with per-IP rate limits on AI/upload endpoints. Lesson P-L08.
- **`curl HTTP 000`** = unbound custom domain, not necessarily down. Check `ecosystem_platforms.health_status`.
- **Hub pinger false-positive:** marks platforms "online" even when DNS fails or heartbeat >7d stale. Logged in `docs/active-commitments.md`.
- **TYT connector self-registration:** announces as "LexiBridge / `lexibridge.net`" — overwrites hub row name+URL on every heartbeat. Description + grant_alignment survive. Real fix in TYT workspace.
- **🚨 ECOSYSTEM_PLATFORMS hardcoded array overwrites the DB on every startup** (`server/ecosystem-connector.ts:658`). Startup auto-sync UPDATEs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment to match the array, and DELETEs any DB row whose ID isn't in it. `publicVisible` is NOT in the update set, so it survives. When adding/renaming/re-URLing, edit BOTH the DB and the array.
- **Talk Your Talk rebrand:** old LexiBridge / Speech Bridge → **Talk Your Talk** (`talkyourtalk.net`). Verified count: **89 spoken + 18 sign = 107 total**. Use 89/18/107 in all proposals.
- **🚨 Public-vs-total platform count:** DB has 25 rows; only 15 are public-facing service platforms. Use "15" externally.
- **🚨 Engineering gotchas P-L09 (pptxgenjs default-export under tsx-ESM needs `createRequire`) & P-L10 (`req.params` typed `string|string[]`, coerce with `String()` before Drizzle `eq()`)** — full code in `docs/memory-archive.md#A6` and `.agents/skills/map-gap/lessons-learned.md`.
- **🚨 Dr. Vann lane (May 13, 2026):** Her ask was a youth+family attendance/services tracker for Iasis youth program + Sistahs women's-health programs. Stay in her confirmed lane (wellness coaching, behavioral engagement, women's mindset); she has **NEVER** discussed foster youth with the user — don't assume she has. Iasis side = spouse-relationship COI on every City of Wichita/federal grant. Detail in `docs/memory-archive.md#A1`. General rule: when memory says "user X expressed interest in Y," verify with user before acting.
- **🚨 Anika Amie ≠ TCAF principal (May 12, 2026):** Name was in inherited RWJF draft + playbook + RAG as "TCAF Founder/ED." User does not know this person. Quarantined; attribution stripped. **Rule:** before treating ANY inherited grant draft as TCAF voice, `rg -i "founder|executive director|project director|principal investigator|applicant name"` and verify every named person. Full record in `docs/memory-archive.md#A2`.
- **🚨 Candid (free tier) for grants (May 12, 2026):** Use candid.org free tier. Priority: claim TCAF Nonprofit Profile under EIN 41-3618003 (Silver+ seal). No API on free tier → manual RFP Bulletin only. Full workflow in `docs/active-commitments.md` "Candid (free tier)" section.
- **🚨 SAM.gov & federal IDs (TCAF, ACTIVE):** UEI **`KDDVD1FGLW35`** · CAGE **`209N1`** · renewal due **2027-05-06** (calendar reminder 2027-04-01) · ZIP+4 78660-7020 · DBA blank → use legal name "The Collaborative Advocate Foundation" on federal forms. Activation narrative → `docs/memory-archive.md#A11`.
- **🚨 Two-entity strategy.** **ISS LLC** (Integrated Services and Solutions LLC) is Dr. Flood's for-profit, used for opportunities nonprofits can't apply for (SBIR/STTR, GSA Schedule, for-profit set-asides). IDs (primary-source verified): EIN **`87-2795417`** · TX SOS **`0804240615`** · SAM UEI **`C7YDV3P8EHL7`** · CAGE **`9VKK3`** · SAM Active, expires **2027-03-30**. Routing: for-profit-only opportunities → ISS LLC primary, flag for joint-venture-with-TCAF review, never auto-submit. **M&T Consulting Solutions LLC** = partner-co-owned, OUT-OF-SCOPE unless user explicitly says otherwise. Full registry → `docs/memory-archive.md#A10` and `docs/active-commitments.md` "Dr. Flood's Other Entities — Registry."
- **🚨 CAF/TCAF entity facts (PRIMARY-SOURCE VERIFIED 2026-05-15 from IRS EIN Assignment PDFs + SAM.gov + Swyft Filings):** Legal name **The Collaborative Advocate Foundation** · **EIN `41-3618003`** · Name control **THEC** · **501(c)(3) DETERMINED** (Letter 947) · Public charity under **170(b)(1)(A)(vi)** · Effective 01/14/2026 · Contributions deductible · 990 series required · Fiscal year ends Dec 31 · IRS contact Mrs. Hurst, ID 1793423, 877-829-5500 · Address 17912 Stefano Drive, Pflugerville, TX 78660-7020, c/o Terry D Flood Sr. Full incident history (May 12 wrong sweep + May 15 correction sweep + funder-side implications) in `docs/memory-archive.md#A4`.

## Pointers (third-party docs)
Replit AI Integrations (`javascript_openai_ai_integrations`, `_anthropic_`, `_openrouter_`) · Replit Auth (`log_in_with_replit`) · Drizzle ORM · Tailwind/shadcn · TanStack Query v5 · Wouter · SAM.gov API · Playwright · Implementation Science (RPLICE, CFIR/RE-AIM, MAP-GAP) · **Tabbara prior-award checklist** (SAM.gov, USASpending.gov, sbir.gov, etc.) — **mandatory for ALL grants regardless of size.** Reference template: `docs/grants/AEI-Funder-Intelligence.md`. See playbook lesson #19.
