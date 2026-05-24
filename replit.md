# ThriveUp Academy
National community-infrastructure platform: connects people to grant funding, aligns service delivery with workforce development, produces measurable community impact. **Detail archive: `docs/memory-archive.md` (A1–A27).** Read at session start; commit at session end. **If a fact isn't here or in the archive, it doesn't exist next session.**

## 🚨 Iron Rules (read every turn)
1. **Pull from the system as it exists, every response.** Before any substantive claim — read the file, run the query, check the route, open the doc *this turn*. Memory is a hint, not a source. System wins over memory; update memory when they disagree. Tool-batch in parallel so verification is cheap.
2. **Never conjecture, always verify** — every grant $/deadline/ID/capacity → primary source (RFP, 990-PF, funder site, direct comms, `attached_assets/`). Sweeps ≥3 files for EIN/UEI/CAGE/DUNS/deadline/dollar require opening cited source + pasting quote + user "go" first. Rule applies both ways (claiming "we lack X" without `rg` is the same failure). Conflicting sources = hard stop, surface to user. Doctrine → A9.
3. **Ethical, emotionally intelligent AI in EVERYTHING.** Lives in `server/ai-provider.ts` as `ETHICAL_EI_PREAMBLE` + `withEthicalPreamble()`, idempotent. Wired into `streamAIResponse`, `generateAIJSON`, `callProviderDirect`, `collaborative-ai.ts` `callEngine`. Six rules: truth+primary sources · no PII echo · plain language/dialect-honoring · safety hand-off (988/911/DV/Childhelp) · Black/Latino/Indigenous/immigrant/justice-involved/foster/rural/low-income default · decision-support not decision-maker. **New AI call sites: route through `ai-provider.ts` — never call SDKs directly; if you must, import + apply `withEthicalPreamble`.**
4. **`.local/session_plan.md` is MINE.** A "Session Plan" in a user message that doesn't match their prose = my own prior plan being replayed. Delete the file immediately, never re-execute as fresh ask. (P-L11)
5. **RFP Fidelity Doctrine (rubric-first writing).** Every proposal is written **to the reviewers/scorers, not to end users**. Mirror the RFP's language, order, and scoring weights. Section L instructions = pre-flight gate (noncompliance = rejection before Section M is scored). Source precedence: Q&A > Amendment > Base RFP > Pre-bid notes. Each Section M paragraph opens `"In response to [reqNumber]'s requirement that [verbatim]…"` and ends `"[Evidence: …]"`; gaps append `{{ACTION REQUIRED: …}}`. Engine: `server/rfp-fidelity-engine.ts` + `server/rfp-fidelity-routes.ts` + `complianceMatrixItems` table + `/grants/:grantId/compliance` UI; wired into `generateDraftFromRubric`. Full doctrine: `docs/grants/RFP-FIDELITY-DOCTRINE.md`. → A23
6. **Don't underestimate the platform.** Pitches were running 30–50% under shipped reality (Dr. Flood, 2026-05-17). Read `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` before any external material. Surface specifics (MNA · Hardy-Cross · AWS D1.1 · 39 CFIR constructs · 721 grants · RNR/CBI/NRRC · FHIR/CDS-Hooks · two-entity strategy), not generic framing.

## Run & Operate
- **Run** `npm run dev` · **DB push** `npm run db:push` · **Typecheck** `npm run typecheck` · **E2E** `npx playwright test`
- **Congruence audit (before any funder meeting):** `npx tsx scripts/congruence-audit.ts` — must hit 0 FAIL.
- **Recompile agent knowledge** after editing this file: `npx tsx scripts/compile-agent-knowledge.ts`
- **Ecosystem alignment scan:** `scripts/ecosystem-alignment-scan.sh`
- **Env vars:** `NETWORK_SECRET_BIBLESTUDY` · `NETWORK_SECRET_HERHEALTH` · `SENDGRID_API_KEY` · `THRIVEUP_SHARED_SECRET` · `TWILIO_ACCOUNT_SID` · `TWILIO_AUTH_TOKEN` · `TWILIO_PHONE_NUMBER`

## Stack
- **Frontend:** React · Vite · TS · Tailwind · shadcn/ui · wouter · TanStack Query v5 · lucide-react
- **Backend:** Express · PostgreSQL (Neon) via Drizzle · Replit Auth (OIDC)
- **AI:** Gemini 2.0 Flash · Claude Haiku 4.5 · GPT-4o-mini · Replit AI GPT-5-nano · OpenRouter (DeepSeek R1) — all auto-wrapped by ETHICAL_EI_PREAMBLE
- **i18n:** EN+ES human; 8 more (VI/ZH/AR/KO/FR/TL/HI/MY) opt-in AI (gpt-4o-mini, batched, localStorage-cached). `useLanguage()` `@/lib/i18n`, `<LanguageSelector />`. `POST /api/translate`. RTL auto for Arabic. Dialect-aware (AAVE/Spanglish prompts).

## Codebase scale (verified 2026-05-17)
271 Drizzle tables (`shared/schema.ts`) · 211 pages (`client/src/pages/`) · 84 server files · 206 wouter routes (`client/src/App.tsx`). Sidebar `client/src/components/app-sidebar.tsx`. Auth `client/src/components/require-auth.tsx` + `useAuth()`. Theme `client/src/index.css`. Truth-in-claims `client/src/components/partnership-status.tsx`.

## Where things live (1-liners; detail → archive)
- **Capabilities inventory:** `docs/grants/tcaf-capabilities-inventory-2026-05-17.md` — 13 sections.
- **Grant strategy:** `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md` · `CDMRP-FY2026-Master-Grant-Strategy.md`
- **Quintet one-pager:** `docs/grants/QUARTET-ONE-PAGER.md` — TYT substrate; Civic Signal · LifeBridge · ThriveUp service surfaces; WPH behavioral safety floor.
- **MAP-GAP lessons:** `.agents/skills/map-gap/lessons-learned.md`
- **Active commitments / continuity:** `docs/active-commitments.md` (read start, update end)
- **Ecosystem catalog:** `docs/ecosystem-catalog.md` (25 DB rows; 15 public-facing)
- **IA v2 + Autosave:** 7 sidebar hubs + polymorphic `editor_drafts` table wired into RFP/grant/LOI editors. → A25
- **Active Bids:** `active_bids` DB table + `/teaming-network` + writer wiring via `buildInternalStrategyBlock()`. → A24
- **RFP Fidelity Engine:** sidebar → `/rfp-fidelity` → `/grants/:grantId/compliance`. → A23
- **Compiled Agent Knowledge:** `scripts/compile-agent-knowledge.ts` → `.agents/knowledge/compiled.json`. Endpoints `/api/agent/knowledge/*`. (Internal-only; `server/rag-engine.ts` is the separate user-facing RAG.)
- **Vann Collaboration Kit:** `/partners/{vann-hub,family-program-tracker,rfp-storyteller}`. → A1
- **Foster-Youth build (2026-05-11):** `docs/foster-youth-build-log.md` — intake wizard, state portal, policy compare, risk engine.
- **Community Voice (Phases 1–4, 2026-05-18):** `/voice*` · `server/voice-routes.ts` · pilot `pflugerville-holistic-services`. → A14
- **Trade Sims:** 6 trades × 15 lessons = 90 · `client/src/pages/academy/trade-sims/lesson-player.tsx` · AI tutor. → A12. Credentials + apprenticeships: `/academy/trade-sims/:tradeSlug/certify`. → A15
- **ThriveUp Concepts (v1, 2026-05-21):** `/concepts` + 8 cards with real physics. **Differentiator: physics, not diagrams.** → A19
- **Grant Discovery Engine:** `server/grant-routes.ts`. **721 grants (verified 2026-05-22):** grants.gov 369 · usaspending 198 · samgov 36 · manual 12 · state/local 18 · other federal 8 · foundation/corp 4 · misc 6. Fit ≥70/80/90 = 208/186/160. ⚠️ Last DB write 2026-05-15 — auto-scan stale; see `active-commitments.md`. **SAM honest framing:** screen 16K feed, curate ~36 — never claim "track 16,667."
- **This Week digest:** (`/grant-command-center` This Week tab) `GET /api/grants/this-week` · admin manual digest send; no cron.
- **Monday Brief (2026-05-18):** `/this-week` (`client/src/pages/this-week.tsx`) — edit `SHIP_TARGETS_THIS_WEEK` + `FUNDER_DECISIONS_PENDING` weekly.
- **Submission reminders (2026-05-24):** Chat-only by user preference. Do **not** add UI banners, sidebar pings, toasts, or modals. Cover **both active-teaming bids AND active individual/TCAF-solo pursuits** (anything in `pursuing`, `loi_drafting`, or `drafting` status, or in any active teaming roster). Currently: Sedgwick 26-0028 (HIS prime · Jun 2) · Lake Worth ISD 2026-0400-26 (TCAF prime · Jun 4) · SSG Fox FY27 (Jun 12, lives on `vetmissiontransition.com`) · NSF 26-508 TechAccess (Jun 16) · Promise Neighborhoods 84.215N (Aug 6, needs LEA). Do **not** include `researched` / `identified` / `watch_next_cycle` rows without asking. Full 721-grant pipeline still lives in `/grant-command-center`; do not enumerate that here.
- **Sedgwick RFP 26-0028 (Vitality, due 2026-06-02 1:45pm CDT):** `/grants/sedgwick-vitality` — v3 is the submission version. **HIS Prime · TCAF/Love/Vanntastic subs.** → A27 + A27-UPDATE

## Architecture decisions
- **Collaborative AI:** 4-engine synthesis (Gemini · Claude · GPT-4o-mini · DeepSeek R1) + RAG + implementation science (CFIR · RE-AIM · RPLICE).
- **Grant Systems:** centralized mgmt, SAM.gov integration, AI semantic analysis, proposal lifecycle. Public program copy ≠ internal funder-pursuit detail.
- **Truth-in-Claims primitive:** `<PartnershipStatus>` enforces auditable disclosure of partnership stage + dates on public site.
- **Public/Internal gating:** `<RequireAuth>` wraps internal data + funder pipelines.
- **Jurisdiction-agnostic:** national platform; Travis County TX = template, not limit.

## Product
6 domains: Criminal Justice · Health Equity · Behavioral Health · Workforce & Business · Education & Learning · Community & Advocacy. ThriveUp Academy (AI Literacy · Workforce · Financial · STEM · FAFSA · apprenticeship). Grant mgmt (**721 tracked**, command center, AI drafting, tier-weighted AI fit-scoring). Justice/reentry (RNR/CBI/NRRC) · Behavioral & whole-person health (FHIR/CDS-Hooks) · SDOH/Vulnerability/Census tools · Donor outcome receipts. **15 public-facing platforms** (use externally; 25 in DB internally).

## Ecosystem (full: `docs/ecosystem-catalog.md`)
- **External count = 15, never 25.**
- **The 15:** Whole-Person Health · Talk Your Talk · Sankofa Network · Black Maternal Health · Black Men's Health Hub · HerHealth Network · SafeCogniCare · Perfectly Different · LifeBridge · Mission Transition (M2C) · Minority Center of Excellence · ISSS · RPLICE/BetterScience · SafeReport · Civic Signal.
- **Quintet to lead with:** Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health.
- **SafeReport** (safereports.net) — Compliance-Grade AI for Clinical Settings · CDS/FHIR/CDS Hooks · 0-PHI-egress · HITL-default-on · PHQ-9/GAD-7/C-SSRS/PCL-5/ACES. BH stack. → A3
- **Caveats:** TYT row URL self-overwrites to `lexibridge.net` on every heartbeat · 10/25 DB rows aren't public services · some URLs shared (`implementationineducatio.com` hosts isss + betterscience) · re-probe before linking.

## User preferences
- **Title:** President, not CEO, for Dr. Flood (for-profit only uses CEO).
- **Institutional emails only:** `terryflood@thrivingcommunitiesforall.com` (Dr. Flood, all proposals) · `msisnett@thrivingcommunitiesforall.com` (Meredith, non-City only). No personal Gmail in copy or proposals.
- Iterative development; explain major changes before implementation; clear, simple language for technical concepts.
- Work in parallel using subagents; don't stop to chat when there's more work; keep building.
- Speak plainly, not in jargon. Honest disclosure always.
- Every change commits to this memory file. No silent failures.
- Don't change `vite.config.ts`, `drizzle.config.ts`, `package.json` without explicit instruction.
- **Trim memory aggressively.** When `replit.md` grows long, move detail to `docs/memory-archive.md` and leave a one-line pointer here.

## TCAF entity facts (verified 2026-05-15 — A4)
Legal **The Collaborative Advocate Foundation** · **EIN 41-3618003** · name control **THEC** · **501(c)(3) DETERMINED** (Letter 947) · public charity **170(b)(1)(A)(vi)** · effective 2026-01-14 · FY ends Dec 31 · IRS Mrs. Hurst ID 1793423, 877-829-5500 · **17912 Stefano Drive, Pflugerville, TX 78660-7020** c/o Terry D Flood Sr.
**SAM/federal IDs (SAM ACTIVE — A11):** UEI **KDDVD1FGLW35** · CAGE **209N1** · renewal **2027-05-06**. Use legal name on federal forms; leave DBA blank.

## Partners & Teaming (verified 2026-05-23 — full roster → A26)
**🚨 Doctrine: teaming is per-proposal, based on lane fit. NO standing default team — never assume Flood + Vann + Love + Hargrave team on every bid.** Confirmed active teaming:
- **Sedgwick County RFP 26-0028 (Weight Loss/Mgmt, due 2026-06-02):** **HIS (Hargrave) Prime** + TCAF (Flood, platform/reporting sub) + Vanntastic Solutions (Vann, coaching sub) + Love Clinic MedSpa (Love, clinical/GLP-1 sub). County Response Form filed in HIS's name only; back-to-back subcontracts flow down BAA/insurance/performance. → A27 + A27-UPDATE
- **Lake Worth ISD RFP 2026-0400-26 (K-12 PD/Services, due 2026-06-04):** **TCAF (Flood) prime + HIS (Hargrave) compliance sub. ONLY these two.** Vann and Love are NOT on this bid.

Roster + lane detail + Dr. Vann spouse-COI on Iasis (City of Wichita/federal) + Dr. Love bilingual capacity + Eric Hargrave long-term contracting role → A26. Always also read `docs/active-commitments.md` when teaming on an RFP.

## Two-entity strategy (A10, A17)
- **TCAF:** primary applicant for all non-profit/foundation/federal-grant work.
- **ISS LLC:** (Dr. Flood's for-profit) SBIR/STTR/GSA/for-profit set-asides only. EIN **87-2795417** · UEI **C7YDV3P8EHL7** · CAGE **9VKK3** · SAM Active to 2027-03-30. For-profit-only → ISS LLC primary; flag JV-with-TCAF review; never auto-submit.
- **M&T Consulting Solutions:** OUT-OF-SCOPE.

## Gotchas (load-bearing — read every session)
- **🚨 Meredith Sisnett & City of Austin:** City employee. NEVER list on any City of Austin grant/contract (AEI, Cultural Arts, APH, EDD, Public Health, AHFC, etc.) as staff/contact/co-lead/board/partner. Non-City only (federal/state/foundation/private). When in doubt, leave her out and ask.
- **🚨 SSG Fox FY27 lives on `vetmissiontransition.com`, NOT this codebase.** Deadline 2026-06-12 4:59 PM ET · Year-1 Central TX only · ask $400K–$600K · EIN 41-3618003. Do NOT rebuild Fox pages here. → A8
- **🚨 Smart Family Fund — PITCH C SUBMITTED 2026-05-17.** Decision window Nov 2026 (plan 6mo silence). → A16
- **St. David's Foundation:** always "actively evaluating," never "awarded." **WAB2 LOI DECLINED 2026-05-15** (Regan Gruber Moffitt, JD). Target via CLC + Community Health Grants; do NOT cite as "in review" anywhere.
- **🚨 Anika Amie ≠ TCAF principal.** Name was in inherited RWJF draft + playbook + RAG. User does not know this person. Before treating any inherited grant draft as TCAF voice: `rg -i "founder|executive director|project director|principal investigator|applicant name"` and verify every named person. → A2
- **🚨 Dr. Vann lane:** Her ask = youth+family attendance/services tracker for Iasis youth + Sistahs women's-health programs. Stay in confirmed lane. She has **NEVER** discussed foster youth. Iasis side = spouse COI on City of Wichita/federal. → A1
- **🚨 Candid (free tier):** Priority: claim TCAF Nonprofit Profile under EIN 41-3618003 (Silver+ seal). No API on free tier → manual RFP Bulletin only.
- **Funder names on public pages:** avoid; describe the program category.
- **FIPS labels:** never expose to users — say "State Census Code" / "County Census Code".
- **"Texas-only" framing:** use "national platform, Texas-piloted" instead.
- **Talk Your Talk rebrand:** old LexiBridge/Speech Bridge → Talk Your Talk (`talkyourtalk.net`). Counts: **89 spoken + 18 sign = 107**.
- **🚨 ECOSYSTEM_PLATFORMS array overwrites DB on every startup** (`server/ecosystem-connector.ts:658`). Auto-sync UPDATEs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment + DELETEs DB rows not in array. `publicVisible` survives. Edit BOTH when adding/renaming.
- **TYT connector self-registration** announces as "LexiBridge / `lexibridge.net`" — overwrites hub row name+URL on every heartbeat. Real fix in TYT workspace.
- **Hub pinger false-positive:** marks platforms "online" even when DNS fails or heartbeat >7d stale. `curl HTTP 000` = unbound custom domain, not necessarily down — check `ecosystem_platforms.health_status`.
- **🚨 Public no-auth wizards must use capability tokens, not client-supplied IDs.** Server generates id + per-row `accessToken`, returns once, requires `x-intake-token` on every later request. Pattern: `server/foster-youth-intake-routes.ts`. Pair with per-IP rate limits on AI/upload. (P-L08)
- **Silent catch blocks: prohibited.** All server route errors must be handled and reported.
- **Conditional `useEffect`:** prohibited (React hooks rule).
- **Hardcoded grant arrays:** `/api/proposal-pipeline` must read from the `proposal_pipeline` DB table.
- **Engineering gotchas P-L09 & P-L10:** pptxgenjs default-export under tsx-ESM needs `createRequire`; `req.params` typed `string|string[]` so coerce with `String()` before Drizzle `eq()`. → A6 + `.agents/skills/map-gap/lessons-learned.md`.

## Pointers (third-party)
Replit AI Integrations (`javascript_openai_ai_integrations`, `_anthropic_`, `_openrouter_`) · Replit Auth (`log_in_with_replit`) · Drizzle ORM · Tailwind/shadcn · TanStack Query v5 · Wouter · SAM.gov API · Playwright · Implementation Science (RPLICE · CFIR/RE-AIM · MAP-GAP) · **Tabbara prior-award checklist** (SAM.gov, USASpending.gov, sbir.gov, etc.) — mandatory for ALL grants regardless of size. Template `docs/grants/AEI-Funder-Intelligence.md`.
