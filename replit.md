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
- **i18n:** EN+ES human-translated; 8 more (VI, ZH, AR, KO, FR, TL, HI, MY) via opt-in AI translation (gpt-4o-mini, batched, localStorage-cached). `useLanguage()` from `@/lib/i18n`; `<LanguageSelector />` from `@/components/language-selector`. Endpoint `POST /api/translate` (`server/translate-routes.ts`). RTL auto for Arabic. Dialect-aware (AAVE/Spanglish system prompts).

## Where things live
- **Codebase scale (primary-source verified 2026-05-17):** **271 Drizzle tables** in `shared/schema.ts` · **211 page files** in `client/src/pages/` · **84 server files** in `server/`. 206 wouter routes in `client/src/App.tsx`. Sidebar `client/src/components/app-sidebar.tsx`. Auth `client/src/components/require-auth.tsx`, `useAuth()`.
- **🚨 Capabilities inventory:** `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` — 13 sections (4 physics engines, 86-chunk RAG, 39 CFIR constructs, justice stack, 648-grant engine, 45-table Academy, FHIR+CDS-Hooks, two-entity strategy). **Read before drafting ANY external material.**
- **Theme:** `client/src/index.css` · **Truth-in-claims:** `client/src/components/partnership-status.tsx`
- **Grant strategy:** `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md`, `CDMRP-FY2026-Master-Grant-Strategy.md`
- **Quintet one-pager (drop-in for narratives):** `docs/grants/QUARTET-ONE-PAGER.md` — Talk Your Talk (89 spoken + 18 sign + 6 learning surfaces) as substrate; Civic Signal + LifeBridge + ThriveUp as service surfaces; Whole-Person Health (mentalwellnesssupport.net) as behavioral-health safety floor. TYT crisis events route INTO WPH.
- **MAP-GAP lessons:** `.agents/skills/map-gap/lessons-learned.md`
- **🔗 Corridor Chainweb (citation-chained evidence pipeline):** `server/corridor-chainweb.ts` (593 lines) + `server/corridor-story.ts` (911) + `server/corridor-docs.ts` (457) + `server/resident-journey.ts` (399) + frontend `client/src/pages/corridor-{docs,docs-live,evidence,intelligence}.tsx` + `client/src/pages/resident-journey.tsx` (~4,000 LOC total). **Every fact written to evidence storage cites its primary-source step.** 8-step chain pulls Census ACS (B01003 total pop · B01001B Black pop · B17001B Black poverty · B11003B Black family structure), CDC PLACES (mental health prevalence), ATSDR SVI 2022, FBI Crime Data Explorer. Each step records `methodology: "CHAIN STEP N · ..."` and `verifiedBy: "chainweb:<step_id>"`. Routes: `POST /api/corridor/chainweb/run`, `GET /api/corridor/chainweb/last`. **This is the machine-checkable Iron-Rule enforcement layer under Community Voice and all community storytelling — the "Measure equivalent for the entire US" foundation, automated, primary-source-only, citation-traceable.**
- **Active commitments / continuity log:** `docs/active-commitments.md` — running session memory. Read at session start; update at session end.
- **Foster-Youth build log (May 11, 2026):** `docs/foster-youth-build-log.md` — intake wizard, state portal, policy comparison, risk engine, congruence audit, leave-behind PPTX. Sidebar group `fosterYouthItems` in `app-sidebar.tsx`.
- **Vann Collaboration Kit (May 14, 2026):** Pages `/partners/vann-hub`, `/partners/family-program-tracker`, `/partners/rfp-storyteller`. Three entities (KEEP STRAIGHT): **Sistahs Can We Talk Inc.** (KS 501(c)(3), Dr. Vann is President), **Iasis Christian Center** (her husband Pastor William Vann's church — COI on every City of Wichita/federal grant), **Vanntastic Solutions LLC** (for-profit, never an applicant). Full detail → `docs/memory-archive.md#A1`.
- **Ecosystem catalog:** `docs/ecosystem-catalog.md` — 25 DB rows; 15 are public-facing service platforms.
- **📍 Community Voice (Phases 1-4 live 2026-05-18):** Map-pin → AI-cluster → ecosystem-route → #DATA story. Routes `/voice`, `/voice/new` (4-step wizard, authed users, 5/hr), `/voice/:slug`, `/voice/:slug/{story,insights,admin}`. Backend `server/voice-routes.ts` + 6 tables. Strict-admin gate, `publicizePin` PII sanitizer, hidden-project guard, deterministic platform routing map (safety→WPH+LifeBridge, workforce→Trade Sims+M2C, etc.). Pilot: `pflugerville-holistic-services`. Full detail → `docs/memory-archive.md#A14`. Phase 5 backlog in archive.
- **🎮 Trade Sims (live):** 6 trades × 15 lessons = 90 (electrical · plumbing · HVAC · welding · automotive · **software-engineering added 2026-05-18**). Player `client/src/pages/academy/trade-sims/lesson-player.tsx`. Backend `server/trade-sims-routes.ts` + 6 tables. AI tutor `POST /api/trade-sims/ai-tutor/hint`. SE trade pitch: "anybody can vibe code, but you have to know how the system works to make vibecoding work." Each trade seed is standalone: `scripts/seed-trade-sims-{slug}.ts`. Detail → `docs/memory-archive.md#A12`.
- **🎓 Trade Sims Credentials + Apprenticeships (live 2026-05-17):** Page `/academy/trade-sims/:tradeSlug/certify`, gated at 80% lesson completion. Server `server/trade-sims-cert-routes.ts`. **Top funders:** Lowe's Gable CBO (Aug 1 → Sep 3, 2026), TWC SDF (rolling, needs ACC), Home Depot P2P. **Federal:** Promise Neighborhoods ED-GRANT-26-054 closes 08/06/2026. **Pilot target: 200 learners by July 1, 2026.** Full detail → `docs/memory-archive.md#A15`.
- **Grant Discovery Engine:** `server/grant-routes.ts`. **651 grants (verified 2026-05-17):** grants.gov 369 · usaspending 198 · samgov 36 · manual 12 · state/local 18 · other federal 8 · foundation/corporate 4 · misc 6. Fit ≥70/80/90 = 208/186/160. ⚠️ Last DB write 2026-05-15 — auto-scan stale; investigation in `active-commitments.md`. SAM honest framing: screen 16K feed, curate ~36 — never claim "track 16,667." Status `GET /api/grants/discovery/status`; manual `POST /api/grants/discovery/run-now`.
- **"This Week" digest** (`/grant-command-center` → This Week tab): `GET /api/grants/this-week?days=7&minFit=0`, `GET /api/grants/digest/preview?days=7`, `POST /api/grants/digest/send` (admin, manual; auto-cron NOT enabled).
- **📅 Monday Brief (live 2026-05-18):** Standalone page at `/this-week` (`client/src/pages/this-week.tsx`, sidebar entry under Grant Engine). Surfaces 4 strategic dimensions + targets + goals, curated ship targets for the week, grants closing in 14 days (live from `/api/grants/this-week?days=14`), and declared funder decisions pending. Edit `SHIP_TARGETS_THIS_WEEK` + `FUNDER_DECISIONS_PENDING` weekly. One URL for any briefing prep.
- **Compiled Agent Knowledge Layer:** internal-only deterministic memory hook for the agent (end-user RAG `server/rag-engine.ts` is parallel and untouched). Compiler: `scripts/compile-agent-knowledge.ts` → `.agents/knowledge/compiled.json`. Endpoints: `GET /api/agent/knowledge/session-bootstrap` (~3KB) · `/topic/:key` · `/api/agent/knowledge` (full) · `POST /api/agent/knowledge/recompile` (admin).

## Architecture decisions
- **Collaborative AI:** 4-engine synthesis (Gemini, Claude, GPT-4o-mini, DeepSeek R1) with RAG and implementation-science frameworks (CFIR, RE-AIM, RPLICE).
- **Grant Systems:** Centralized management with SAM.gov integration, AI semantic analysis, proposal lifecycle. Public program descriptions kept separate from internal funder pursuit details.
- **Truth-in-Claims primitive:** `<PartnershipStatus>` enforces auditable disclosure of partnership stages + dates across the public site.
- **Public/Internal gating:** `<RequireAuth>` wrapper protects internal data + funder pipelines.
- **Jurisdiction-agnostic:** National platform; Travis County TX is implementation template, not a limit.

## Product
- 6 domains: Criminal Justice, Health Equity, Behavioral Health, Workforce & Business, Education & Learning, Community & Advocacy
- ThriveUp Academy (AI Literacy, Workforce, Financial, STEM, FAFSA, apprenticeship)
- Grant management (**651 tracked** as of 2026-05-17, command center, AI drafting, tier-weighted AI fit-scoring)
- Justice & reentry (RNR/CBI/NRRC stack) · Behavioral & whole-person health (FHIR/CDS-Hooks) · SDOH/Vulnerability/Census tools · Donor outcome receipts
- Ecosystem hub: 15 public-facing service platforms + internal/dev rows = 25 in DB

## Ecosystem (full catalog: `docs/ecosystem-catalog.md`)
- **Use "15 service platforms operated by TCAF" externally — not 25.** "25" is internal architecture only.
- **The 15:** Whole-Person Health · Talk Your Talk · Sankofa Network · Black Maternal Health · Black Men's Health Hub · HerHealth Network · SafeCogniCare · Perfectly Different · LifeBridge · Mission Transition (M2C) · Minority Center of Excellence · ISSS · RPLICE/BetterScience · SafeReport · Civic Signal.
- **SafeReport (live at safereports.net):** "Compliance-Grade AI for Clinical Settings" — CDS/FHIR/CDS Hooks/0-PHI-egress/HITL-default-on/longitudinal screening (PHQ-9/GAD-7/C-SSRS/PCL-5/ACES). Belongs in BH stack. Detail → `docs/memory-archive.md#A3`.
- **Quintet to lead with in narratives:** Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health.
- **Top caveats:** TYT row's URL self-overwrites to `lexibridge.net` on every heartbeat (real fix in TYT workspace) · 10 of 25 DB rows aren't public-facing services (1 TCAF parent + 9 dev/internal/dead-URL) · Some URLs shared (`implementationineducatio.com` hosts both `isss` and `betterscience`) · Re-probe before linking; check ALL aliases.

## User preferences
- Iterative development; explain major changes before implementation.
- High-quality, well-tested code; clear, simple language for technical concepts.
- Don't change `vite.config.ts`, `drizzle.config.ts`, `package.json` without explicit instruction.
- Always work in parallel using subagents; don't stop to chat when there's more work to do; keep building.
- Speak plainly, not in jargon. Use President not CEO. Honest disclosure always.
- Every change commits to this memory file. No silent failures.
- Memory continuity is non-negotiable: every session ENDS with a memory commit; every session BEGINS by reading this file. If a fact, person, deadline, partner, lesson, or commitment is not here, it does not exist next session.
- **Don't underestimate the platform.** Pitches were running 30-50% under shipped reality (Dr. Flood callout 2026-05-17). Default to the capabilities inventory before drafting any external material. Surface specifics (MNA, Hardy-Cross, AWS D1.1, 39 CFIR constructs, 648 grants, RNR/CBI/NRRC, FHIR/CDS-Hooks, two-entity strategy), not generic framing.
- **🚨 SSG Fox FY27 lives on `vetmissiontransition.com`, NOT this codebase.** Deadline 2026-06-12 4:59 PM ET · Year 1 = Central TX only · ask $400K–$600K · EIN on live site is `41-3618003` (correct). Do not rebuild Fox pages here. Brief: `docs/grants/ssg-fox-fy27/00-funder-brief.md`. Full context → `docs/memory-archive.md#A8`.
- **🚨 `.local/session_plan.md` is MINE, not user pastes.** If a "Session Plan" appears in a user message but the user prose doesn't match, it's my own prior plan being replayed. Behavior: delete the file immediately, never re-execute as fresh ask. Lesson P-L11.
- **🚨 IRON RULE — never conjecture, always verify.** Every grant amount, deadline, funder policy, identifier, capacity claim → primary source (funder site, RFP, 990-PF, direct comms, or `attached_assets/` opened this turn). Memory is NOT primary. Sweeps ≥3 files for EIN/UEI/CAGE/DUNS/deadline/dollar require opening cited source + pasting quote + explicit user "go" first. Rule applies both ways (conjecturing "we lack X" without `rg` = same failure). Conflicting sources = hard stop, surface to user. Full doctrine → `docs/memory-archive.md#A9`.

## Gotchas
<!-- Load-bearing — read every session. -->

- **"President" not "CEO"** for Dr. Flood in public-facing copy; "CEO" is for-profit only.
- **Institutional emails only:** `terryflood@thrivingcommunitiesforall.com` (Dr. Flood, all proposals); `msisnett@thrivingcommunitiesforall.com` (Meredith, non-City work only). No personal Gmail in public copy or proposals.
- **🚨 Meredith Sisnett & City of Austin:** City of Austin employee. NEVER list on any City grant/proposal/contract (AEI, Cultural Arts, APH, EDD, Public Health, AHFC, etc.) as staff/contact/co-lead/board/partner. Non-City (federal/state/foundation/private) only. When in doubt, leave her out and ask user.
- **🚨 Smart Family Fund — ✅ PITCH C SUBMITTED 2026-05-17.** Decision window **November 2026** (plan 6mo silence). Pitches archive: `docs/grants/smart-family-fund-pitches-2026-05-17.md`. Full detail → `docs/memory-archive.md#A16`.
- **St. David's Foundation:** always "actively evaluating," never "awarded." **WAB2 LOI DECLINED 2026-05-15** (Regan Gruber Moffitt, J.D., VP Community Investments — `docs/grants/submitted/StDavids-WAB2-LOI-Decision-2026-05-15.md`). Still a target via CLC + Community Health Grants cycles; do NOT cite as "in review" anywhere in pipeline.
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
- **🚨 ECOSYSTEM_PLATFORMS array overwrites the DB on every startup** (`server/ecosystem-connector.ts:658`). Auto-sync UPDATEs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment + DELETEs DB rows not in array. `publicVisible` survives. Edit BOTH when adding/renaming.
- **Talk Your Talk rebrand:** old LexiBridge / Speech Bridge → **Talk Your Talk** (`talkyourtalk.net`). Verified count: **89 spoken + 18 sign = 107 total**. Use 89/18/107 in all proposals.
- **🚨 Public-vs-total platform count:** DB has 25 rows; only 15 are public-facing service platforms. Use "15" externally.
- **🚨 Engineering gotchas P-L09 (pptxgenjs default-export under tsx-ESM needs `createRequire`) & P-L10 (`req.params` typed `string|string[]`, coerce with `String()` before Drizzle `eq()`)** — full code in `docs/memory-archive.md#A6` and `.agents/skills/map-gap/lessons-learned.md`.
- **🚨 Dr. Vann lane:** Her ask was a youth+family attendance/services tracker for Iasis youth program + Sistahs women's-health programs. Stay in her confirmed lane (wellness coaching, behavioral engagement, women's mindset); she has **NEVER** discussed foster youth with the user — don't assume. Iasis side = spouse-relationship COI on every City of Wichita/federal grant. Detail in `docs/memory-archive.md#A1`. General rule: when memory says "user X expressed interest in Y," verify with user before acting.
- **🚨 Anika Amie ≠ TCAF principal:** Name was in inherited RWJF draft + playbook + RAG as "TCAF Founder/ED." User does not know this person. Quarantined; attribution stripped. **Rule:** before treating ANY inherited grant draft as TCAF voice, `rg -i "founder|executive director|project director|principal investigator|applicant name"` and verify every named person. Detail → `docs/memory-archive.md#A2`.
- **🚨 Candid (free tier):** Use candid.org free tier. Priority: claim TCAF Nonprofit Profile under EIN 41-3618003 (Silver+ seal). No API on free tier → manual RFP Bulletin only. Full workflow in `docs/active-commitments.md` "Candid (free tier)" section.
- **🚨 TCAF federal IDs (SAM ACTIVE):** UEI **`KDDVD1FGLW35`** · CAGE **`209N1`** · renewal **2027-05-06**. ZIP+4 78660-7020. Use legal name "The Collaborative Advocate Foundation" on federal forms (DBA blank). Narrative → `docs/memory-archive.md#A11`.
- **🚨 Two-entity strategy.** **ISS LLC** = Dr. Flood's for-profit (SBIR/STTR/GSA/for-profit set-asides only). EIN `87-2795417` · UEI `C7YDV3P8EHL7` · CAGE `9VKK3` · SAM Active to 2027-03-30. For-profit-only → ISS LLC primary, flag JV-with-TCAF review, never auto-submit. **M&T Consulting Solutions** = OUT-OF-SCOPE. Full registry → `docs/memory-archive.md#A17`.
- **🚨 TCAF entity facts (verified 2026-05-15):** Legal **The Collaborative Advocate Foundation** · **EIN `41-3618003`** · Name control **THEC** · **501(c)(3) DETERMINED** (Letter 947) · Public charity **170(b)(1)(A)(vi)** · Effective 01/14/2026 · FY ends Dec 31 · IRS Mrs. Hurst ID 1793423, 877-829-5500 · 17912 Stefano Drive, Pflugerville, TX 78660-7020 c/o Terry D Flood Sr. Incident history → `docs/memory-archive.md#A4`.

## Pointers (third-party docs)
Replit AI Integrations (`javascript_openai_ai_integrations`, `_anthropic_`, `_openrouter_`) · Replit Auth (`log_in_with_replit`) · Drizzle ORM · Tailwind/shadcn · TanStack Query v5 · Wouter · SAM.gov API · Playwright · Implementation Science (RPLICE, CFIR/RE-AIM, MAP-GAP) · **Tabbara prior-award checklist** (SAM.gov, USASpending.gov, sbir.gov, etc.) — **mandatory for ALL grants regardless of size.** Reference template: `docs/grants/AEI-Funder-Intelligence.md`. See playbook lesson #19.
