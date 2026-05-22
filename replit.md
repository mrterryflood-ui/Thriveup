# ThriveUp Academy
National community-infrastructure platform: connects people to grant funding, aligns service delivery with workforce development, produces measurable community impact. **Detail archive: `docs/memory-archive.md` (A1–A20).** Read at session start; commit at session end. **If a fact isn't here or in the archive, it doesn't exist next session.**

## 🚨 Iron Rules (read every turn)
1. **Pull from the system as it exists, every response.** Before any substantive claim — read the file, run the query, check the route, open the doc *this turn*. Memory is a hint, not a source. System wins over memory; update memory when they disagree. Tool-batch in parallel so verification is cheap.
2. **Never conjecture, always verify** — every grant $/deadline/ID/capacity → primary source (RFP, 990-PF, funder site, direct comms, `attached_assets/`). Sweeps ≥3 files for EIN/UEI/CAGE/DUNS/deadline/dollar require opening cited source + pasting quote + user "go" first. Rule applies both ways (claiming "we lack X" without `rg` is the same failure). Conflicting sources = hard stop, surface to user. Doctrine → A9.
3. **Ethical, emotionally intelligent AI in EVERYTHING.** Lives in `server/ai-provider.ts` as `ETHICAL_EI_PREAMBLE` + `withEthicalPreamble()`, idempotent. Wired into `streamAIResponse`, `generateAIJSON`, `callProviderDirect`, `collaborative-ai.ts` `callEngine`. Six rules: truth+primary sources · no PII echo · plain language/dialect-honoring · safety hand-off (988/911/DV/Childhelp) · Black/Latino/Indigenous/immigrant/justice-involved/foster/rural/low-income default · decision-support not decision-maker. **New AI call sites: route through `ai-provider.ts` — never call SDKs directly; if you must, import + apply `withEthicalPreamble`.**
4. **`.local/session_plan.md` is MINE.** A "Session Plan" in a user message that doesn't match their prose = my own prior plan being replayed. Delete the file immediately, never re-execute as fresh ask. (P-L11)
5. **Don't underestimate the platform.** Pitches were running 30–50% under shipped reality (Dr. Flood, 2026-05-17). Read the capabilities inventory before drafting any external material. Surface specifics (MNA · Hardy-Cross · AWS D1.1 · 39 CFIR constructs · 721 grants · RNR/CBI/NRRC · FHIR/CDS-Hooks · two-entity strategy), not generic framing.

## Run & Operate
- **Run** `npm run dev` · **DB push** `npm run db:push` · **Typecheck** `npm run typecheck` · **E2E** `npx playwright test`
- **Congruence audit (mandatory before any funder meeting):** `npx tsx scripts/congruence-audit.ts` — must hit 0 FAIL.
- **Recompile agent knowledge** after editing this file or any source it reads: `npx tsx scripts/compile-agent-knowledge.ts`
- **Ecosystem alignment scan:** `scripts/ecosystem-alignment-scan.sh`
- **Env vars:** `NETWORK_SECRET_BIBLESTUDY` · `NETWORK_SECRET_HERHEALTH` · `SENDGRID_API_KEY` · `THRIVEUP_SHARED_SECRET` · `TWILIO_ACCOUNT_SID` · `TWILIO_AUTH_TOKEN` · `TWILIO_PHONE_NUMBER`

## Stack
- **Frontend:** React · Vite · TS · Tailwind · shadcn/ui · wouter · TanStack Query v5 · lucide-react
- **Backend:** Express · PostgreSQL (Neon) via Drizzle · Replit Auth (OIDC)
- **AI:** Gemini 2.0 Flash · Claude Haiku 4.5 · GPT-4o-mini · Replit AI GPT-5-nano · OpenRouter (DeepSeek R1) — all auto-wrapped by ETHICAL_EI_PREAMBLE
- **i18n:** EN+ES human; 8 more (VI/ZH/AR/KO/FR/TL/HI/MY) opt-in AI (gpt-4o-mini, batched, localStorage-cached). `useLanguage()` `@/lib/i18n`, `<LanguageSelector />`. `POST /api/translate` (`server/translate-routes.ts`). RTL auto for Arabic. Dialect-aware (AAVE/Spanglish prompts).

## Codebase scale (verified 2026-05-17)
271 Drizzle tables (`shared/schema.ts`) · 211 pages (`client/src/pages/`) · 84 server files · 206 wouter routes (`client/src/App.tsx`). Sidebar `client/src/components/app-sidebar.tsx`. Auth `client/src/components/require-auth.tsx` + `useAuth()`. Theme `client/src/index.css`. Truth-in-claims `client/src/components/partnership-status.tsx`.

## Where things live
<!-- 1-liners; detail → archive -->

- **Capabilities inventory:** `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` — 13 sections. **Read before any external material.**
- **Grant strategy:** `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md` · `CDMRP-FY2026-Master-Grant-Strategy.md`
- **Quintet one-pager (narrative drop-in):** `docs/grants/QUARTET-ONE-PAGER.md` — Talk Your Talk substrate; Civic Signal · LifeBridge · ThriveUp service surfaces; Whole-Person Health behavioral safety floor. TYT crisis events route INTO WPH.
- **MAP-GAP lessons:** `.agents/skills/map-gap/lessons-learned.md`
- **Active commitments / continuity:** `docs/active-commitments.md` (read start, update end)
- **Ecosystem catalog:** `docs/ecosystem-catalog.md` (25 DB rows; 15 public-facing)
- **Compiled Agent Knowledge:** `scripts/compile-agent-knowledge.ts` → `.agents/knowledge/compiled.json`. Endpoints `GET /api/agent/knowledge/session-bootstrap` (~3KB) · `/topic/:key` · `/api/agent/knowledge` · admin `POST /api/agent/knowledge/recompile`. (Internal-only; user-facing RAG `server/rag-engine.ts` is separate, untouched.)
- **Vann Collaboration Kit:** `/partners/{vann-hub,family-program-tracker,rfp-storyteller}` · entities: Sistahs Can We Talk Inc. (Dr. Vann's KS 501(c)(3)) · Iasis Christian Center (spouse — COI on City of Wichita/federal) · Vanntastic Solutions LLC (never applicant). → A1
- **Foster-Youth build (2026-05-11):** `docs/foster-youth-build-log.md` — intake wizard, state portal, policy compare, risk engine, congruence audit, PPTX. Sidebar `fosterYouthItems`.
- **Community Voice (Phases 1–4 live 2026-05-18):** `/voice`, `/voice/new`, `/voice/:slug{,/story,/insights,/admin}` · `server/voice-routes.ts` + 6 tables · pilot `pflugerville-holistic-services`. → A14
- **Trade Sims:** 6 trades × 15 lessons = 90 · player `client/src/pages/academy/trade-sims/lesson-player.tsx` · `server/trade-sims-routes.ts` + 6 tables · AI tutor `POST /api/trade-sims/ai-tutor/hint` · seeds `scripts/seed-trade-sims-{slug}.ts`. → A12
- **Trade Sims Credentials + Apprenticeships (2026-05-17):** `/academy/trade-sims/:tradeSlug/certify` (80% gate) · `server/trade-sims-cert-routes.ts` · **pilot 200 learners by 2026-07-01**. → A15
- **ThriveUp Concepts (v1 live 2026-05-21):** hub `/concepts` + 8 cards each with REAL working physics (pumpjack · transformer · suspension bridge · Li battery · airplane wing · real RSA · wind turbine · pacemaker). Shell `client/src/components/concepts/concept-card-shell.tsx`; registry `client/src/lib/concepts/registry.ts`. Transformer cross-links to Electrical Trade Sims. **Differentiator: physics, not diagrams.** → A19
- **Recognition-and-Ratification Doctrine (R&R, Flood 2026-05-22):** `docs/recognition-and-ratification-doctrine.md` — TCAF operating lens encoded into every regional briefing. Three novel claims vs. the 8 nearest strands (Positive Deviance · Harm Reduction · ABCD · CHW/task-shifting · Rogers reinvention · FRAME-IS · Lipsky · Practice-Based Evidence): (1) mechanism lives at the BRIEFING layer, not the intervention layer; (2) dignity clause = hard non-displacement constraint; (3) counterfactual claim = R&R is the only path that moves the dependent variable, because displacing existing adaptation is fighting a current. Wired into `buildSystemPrompt()` in `server/regional-briefing-routes.ts`. Cite this doc on June 3 capstone Q&A.
- **Regional Briefing v2 (2026-05-22):** `/regional-briefing` — chat input, multi-location compare (≤6), save-as-workflow, stakeholders+outcomes by ZIP. **Prompt upgraded 2026-05-22 PM** to woven-narrative depth + **scope-aware 2026-05-22 EVE**: 5 scopes [A]Situation (§1-4 default) · [B]Asset map (§1-4 + ecosystem assets, NOT TCAF-only) · [C]Funding (+§5) · [D]TCAF fit (+§6) · [E]Full strategy (all). Audience-lens framing (United Way / foundation / city) overrides TCAF-centering. Stay-in-scope is the job. **2026-05-22 NIGHT discipline hardening:** §7 now requires literal H3s `### CFIR determinants` + `### Fidelity-critical actions` + `### Sequenced rollout`; §8 requires `### RE-AIM scorecard` + `### Outcome commitments table`; pre-flight anchor line `> Audience: X · Scope: Y · Disciplines on: R&R, CFIR, RE-AIM, fidelity, dignity-clause` is REQUIRED first line; no-grant-roller default (only [C]/[E] or explicit funding ask surfaces §5); closed grants filtered server-side (`deadline IS NULL OR >= CURRENT_DATE`); platforms locked to canonical 15 allowlist in code (stops "25 in scope" drift + stale rows like Advertising Targeting/PillScheduler/Ecosystem Nexus from ever entering AI context). Backend `server/regional-briefing-routes.ts` + `briefing_workflows` table. Endpoints `/extract` · `/stream` · `/query` · `/context` · `/workflows` CRUD. **2026-05-22 LATE-NIGHT three-door architecture (single-point-of-failure fix):** AI is no longer the only path. (1) AI chat = `/stream`. (2) **No-AI structured = `POST /structured`** — same `{locations, topic, scope}` body, assembles markdown deterministically from DB rows (loadLocationContext + loadStructuredRpliceForCounty); honest disclosure ("no RPLICE plans on file" instead of inventing them); badge "data-only · no AI" on briefing card; scope dropdown + "Build from data" button live in same Ask card. (3) **Saved-workflow replay** — every saved workflow now has both "Re-run AI" and "Replay data" buttons; replay path is no-AI. When AI is down, slow, expensive, or off-discipline, doors 2+3 still serve. Drizzle: uses `inArray()` not `sql ANY()` to avoid the crash that took /stream offline 2026-05-22 22:28 UTC. → A20
- **Corridor Chainweb:** ~4K LOC, 8-step citation chain → Census ACS · CDC PLACES · ATSDR SVI · FBI CDE. Iron-Rule enforcement under Community Voice. Routes `POST /api/corridor/chainweb/run` · `POST /api/corridor/chainweb/run-counties` (anywhere, ≤12 counties; both auth+rate-limited as of 2026-05-22) · `GET /last`. → A18, A20
- **Grant Discovery Engine:** `server/grant-routes.ts`. **721 grants (verified 2026-05-22 live SQL):** grants.gov 369 · usaspending 198 · samgov 36 · manual 12 · state/local 18 · other federal 8 · foundation/corp 4 · misc 6. Fit ≥70/80/90 = 208/186/160. ⚠️ Last DB write 2026-05-15 — auto-scan stale; see `active-commitments.md`. **SAM honest framing:** screen 16K feed, curate ~36 — never claim "track 16,667." Status `GET /api/grants/discovery/status`; manual `POST /api/grants/discovery/run-now`.
- **This Week digest:** (`/grant-command-center` This Week tab) `GET /api/grants/this-week?days=7&minFit=0` · `GET /api/grants/digest/preview?days=7` · `POST /api/grants/digest/send` (admin, manual; no cron).
- **Monday Brief (live 2026-05-18):** `/this-week` (`client/src/pages/this-week.tsx`) — 4 strategic dims + ship targets + grants closing in 14d + decisions pending. Edit `SHIP_TARGETS_THIS_WEEK` + `FUNDER_DECISIONS_PENDING` weekly.

## Architecture decisions
- **Collaborative AI:** 4-engine synthesis (Gemini · Claude · GPT-4o-mini · DeepSeek R1) + RAG + implementation science (CFIR · RE-AIM · RPLICE).
- **Grant Systems:** centralized mgmt, SAM.gov integration, AI semantic analysis, proposal lifecycle. Public program copy ≠ internal funder-pursuit detail.
- **Truth-in-Claims primitive:** `<PartnershipStatus>` enforces auditable disclosure of partnership stage + dates on public site.
- **Public/Internal gating:** `<RequireAuth>` wraps internal data + funder pipelines.
- **Jurisdiction-agnostic:** national platform; Travis County TX = template, not limit.

## Product
6 domains: Criminal Justice · Health Equity · Behavioral Health · Workforce & Business · Education & Learning · Community & Advocacy. ThriveUp Academy (AI Literacy · Workforce · Financial · STEM · FAFSA · apprenticeship). Grant mgmt (**721 tracked 2026-05-22**, command center, AI drafting, tier-weighted AI fit-scoring). Justice/reentry (RNR/CBI/NRRC) · Behavioral & whole-person health (FHIR/CDS-Hooks) · SDOH/Vulnerability/Census tools · Donor outcome receipts. **15 public-facing platforms** (use externally; 25 in DB internally).

## Ecosystem (full: `docs/ecosystem-catalog.md`)
- **External count = 15, never 25.**
- **The 15:** Whole-Person Health · Talk Your Talk · Sankofa Network · Black Maternal Health · Black Men's Health Hub · HerHealth Network · SafeCogniCare · Perfectly Different · LifeBridge · Mission Transition (M2C) · Minority Center of Excellence · ISSS · RPLICE/BetterScience · SafeReport · Civic Signal.
- **Quintet to lead with:** Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health.
- **SafeReport** (safereports.net) — Compliance-Grade AI for Clinical Settings · CDS/FHIR/CDS Hooks · 0-PHI-egress · HITL-default-on · PHQ-9/GAD-7/C-SSRS/PCL-5/ACES. BH stack. → A3
- **Caveats:** TYT row URL self-overwrites to `lexibridge.net` on every heartbeat (real fix in TYT workspace) · 10/25 DB rows aren't public services · some URLs shared (`implementationineducatio.com` hosts isss + betterscience) · re-probe before linking, check ALL aliases.

## User preferences
- **Title:** President, not CEO, for Dr. Flood (for-profit only uses CEO).
- **Institutional emails only:** `terryflood@thrivingcommunitiesforall.com` (Dr. Flood, all proposals) · `msisnett@thrivingcommunitiesforall.com` (Meredith, non-City only). No personal Gmail in copy or proposals.
- Iterative development; explain major changes before implementation; clear, simple language for technical concepts.
- Work in parallel using subagents; don't stop to chat when there's more work; keep building.
- Speak plainly, not in jargon. Honest disclosure always.
- Every change commits to this memory file. No silent failures.
- Don't change `vite.config.ts`, `drizzle.config.ts`, `package.json` without explicit instruction.

## TCAF entity facts (verified 2026-05-15 — A4)
Legal **The Collaborative Advocate Foundation** · **EIN 41-3618003** · name control **THEC** · **501(c)(3) DETERMINED** (Letter 947) · public charity **170(b)(1)(A)(vi)** · effective 2026-01-14 · FY ends Dec 31 · IRS Mrs. Hurst ID 1793423, 877-829-5500 · **17912 Stefano Drive, Pflugerville, TX 78660-7020** c/o Terry D Flood Sr.
**SAM/federal IDs (SAM ACTIVE — A11):** UEI **KDDVD1FGLW35** · CAGE **209N1** · renewal **2027-05-06**. Use legal name on federal forms; leave DBA blank.

## Two-entity strategy (A10, A17)
- **TCAF:** (501(c)(3) above) primary applicant for all non-profit/foundation/federal-grant work.
- **ISS LLC:** (Dr. Flood's for-profit) SBIR/STTR/GSA/for-profit set-asides only. EIN **87-2795417** · UEI **C7YDV3P8EHL7** · CAGE **9VKK3** · SAM Active to 2027-03-30. For-profit-only → ISS LLC primary; flag JV-with-TCAF review; never auto-submit.
- **M&T Consulting Solutions:** OUT-OF-SCOPE.

## Gotchas
<!-- Load-bearing — read every session. -->

- **🚨 Meredith Sisnett & City of Austin:** City employee. NEVER list on any City of Austin grant/contract (AEI, Cultural Arts, APH, EDD, Public Health, AHFC, etc.) as staff/contact/co-lead/board/partner. Non-City only (federal/state/foundation/private). When in doubt, leave her out and ask.
- **🚨 SSG Fox FY27 lives on `vetmissiontransition.com`, NOT this codebase.** Deadline 2026-06-12 4:59 PM ET · Year-1 Central TX only · ask $400K–$600K · EIN 41-3618003 on live site (correct). Do NOT rebuild Fox pages here. Brief `docs/grants/ssg-fox-fy27/00-funder-brief.md`. → A8
- **🚨 Smart Family Fund — PITCH C SUBMITTED 2026-05-17.** Decision window Nov 2026 (plan 6mo silence). `docs/grants/smart-family-fund-pitches-2026-05-17.md`. → A16
- **St. David's Foundation:** always "actively evaluating," never "awarded." **WAB2 LOI DECLINED 2026-05-15** (Regan Gruber Moffitt, JD, VP Community Investments). Still target via CLC + Community Health Grants; do NOT cite as "in review" anywhere.
- **🚨 Anika Amie ≠ TCAF principal.** Name was in inherited RWJF draft + playbook + RAG as "Founder/ED." User does not know this person. Quarantined; attribution stripped. **Rule:** before treating any inherited grant draft as TCAF voice, `rg -i "founder|executive director|project director|principal investigator|applicant name"` and verify every named person. → A2
- **🚨 Dr. Vann lane:** Her ask = youth+family attendance/services tracker for Iasis youth + Sistahs women's-health programs. Stay in confirmed lane (wellness coaching, behavioral engagement, women's mindset). She has **NEVER** discussed foster youth — don't assume. Iasis side = spouse COI on City of Wichita/federal. General rule: when memory says "user X expressed interest in Y," verify with user before acting. → A1
- **🚨 Candid (free tier):** Priority: claim TCAF Nonprofit Profile under EIN 41-3618003 (Silver+ seal). No API on free tier → manual RFP Bulletin only. Workflow in `docs/active-commitments.md` "Candid (free tier)".
- **Funder names on public pages:** avoid; describe the program category.
- **FIPS labels:** never expose to users — say "State Census Code" / "County Census Code".
- **"Texas-only" framing:** use "national platform, Texas-piloted" instead.
- **Talk Your Talk rebrand:** old LexiBridge/Speech Bridge → Talk Your Talk (`talkyourtalk.net`). Counts: **89 spoken + 18 sign = 107**. Use 89/18/107 in proposals.
- **🚨 ECOSYSTEM_PLATFORMS array overwrites DB on every startup:** (`server/ecosystem-connector.ts:658`) Auto-sync UPDATEs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment + DELETEs DB rows not in array. `publicVisible` survives. Edit BOTH when adding/renaming.
- **TYT connector self-registration:** announces as "LexiBridge / `lexibridge.net`" — overwrites hub row name+URL on every heartbeat. Description + grant_alignment survive. Real fix in TYT workspace.
- **Hub pinger false-positive:** marks platforms "online" even when DNS fails or heartbeat >7d stale. Logged in `active-commitments.md`. `curl HTTP 000` = unbound custom domain, not necessarily down — check `ecosystem_platforms.health_status`.
- **🚨 Public no-auth wizards must use capability tokens, not client-supplied IDs.** Server generates id + per-row `accessToken`, returns once, requires `x-intake-token` on every later request. Otherwise IDOR + cost runaway. Pattern: `server/foster-youth-intake-routes.ts` (`authorizeIntake` + `tokensMatch` w/ `timingSafeEqual`). Pair with per-IP rate limits on AI/upload. (P-L08)
- **Silent catch blocks: prohibited.** All server route errors must be handled and reported.
- **Conditional `useEffect`:** prohibited (React hooks rule).
- **Hardcoded grant arrays:** `/api/proposal-pipeline` must read from the `proposal_pipeline` DB table, never hardcoded.
- **Engineering gotchas P-L09 & P-L10:** pptxgenjs default-export under tsx-ESM needs `createRequire`; `req.params` typed `string|string[]` so coerce with `String()` before Drizzle `eq()`. Full code → A6 + `.agents/skills/map-gap/lessons-learned.md`.

## Pointers (third-party)
Replit AI Integrations (`javascript_openai_ai_integrations`, `_anthropic_`, `_openrouter_`) · Replit Auth (`log_in_with_replit`) · Drizzle ORM · Tailwind/shadcn · TanStack Query v5 · Wouter · SAM.gov API · Playwright · Implementation Science (RPLICE · CFIR/RE-AIM · MAP-GAP) · **Tabbara prior-award checklist** (SAM.gov, USASpending.gov, sbir.gov, etc.) — **mandatory for ALL grants regardless of size.** Template `docs/grants/AEI-Funder-Intelligence.md`. (Playbook lesson #19.)
