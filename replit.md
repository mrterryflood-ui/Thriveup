# ThriveUp Academy
An AI-powered national community infrastructure platform that connects individuals to grant funding, aligns service delivery with workforce development, and produces measurable community impact.

## Run & Operate
- **Run:** `npm run dev` (client and server)
- **Database Push:** `npm run db:push`
- **Typecheck:** `npm run typecheck`
- **E2E Tests:** `npx playwright test`
- **Ecosystem Alignment Scan:** `scripts/ecosystem-alignment-scan.sh`
- **Environment Variables:** `NETWORK_SECRET_BIBLESTUDY`, `NETWORK_SECRET_HERHEALTH`, `SENDGRID_API_KEY`, `THRIVEUP_SHARED_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, wouter, TanStack Query v5, lucide-react
- **Backend:** Express.js (Node.js), PostgreSQL (Neon-backed) via Drizzle ORM
- **Auth:** Replit Auth (OIDC)
- **AI:** Google Gemini 2.0 Flash, Anthropic Claude Haiku 4.5, OpenAI GPT-4o-mini, Replit AI Integrations GPT-5-nano, OpenRouter (DeepSeek R1)
- **Internationalization:** EN + ES human-translated; 8 additional languages (VI, ZH, AR, KO, FR, TL, HI, MY) via opt-in AI translation (gpt-4o-mini, batched, localStorage-cached). `useLanguage()` from `@/lib/i18n`; `<LanguageSelector />` from `@/components/language-selector`. Endpoint: `POST /api/translate` (server/translate-routes.ts) using `AI_INTEGRATIONS_OPENAI_API_KEY`. RTL auto-applied for Arabic.
- **Build Tool:** Vite

## Where things live
- **Pages:** `client/src/pages/` (192 files, including `client/src/pages/academy/`)
- **Routes (Frontend):** `client/src/App.tsx` (206 wouter routes)
- **Routes (Backend):** `server/` (main `routes.ts`, plus 35+ specific route files)
- **DB Schema:** `shared/schema.ts` (249 Drizzle `pgTable` definitions)
- **Auth Logic:** `client/src/components/require-auth.tsx`, `useAuth()` hook
- **Branding/Theme:** `client/src/index.css` (Tailwind CSS configuration)
- **Partnership Status Component:** `client/src/components/partnership-status.tsx`
- **Sidebar Navigation:** `client/src/components/app-sidebar.tsx`
- **Grant Strategy:** `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md`, `CDMRP-FY2026-Master-Grant-Strategy.md`
- **Quartet-on-a-Safety-Floor One-Pager (drop-in for narratives):** `docs/grants/QUARTET-ONE-PAGER.md` — verified May 7, 2026; the **five-platform** narrative: Talk Your Talk (89 spoken + 18 sign + 6 learning surfaces + honest crisis path) as substrate, Civic Signal + LifeBridge + ThriveUp as service surfaces, **Whole-Person Health Ecosystem (mentalwellnesssupport.net)** as the behavioral-health safety floor underneath. Crisis-detection events from TYT route INTO WPH.
- **MAP-GAP Lessons Learned:** `.agents/skills/map-gap/lessons-learned.md`
- **Proposal Pipeline Seed:** `server/seed-proposal-pipeline.ts`
- **Active Commitments / Continuity Log:** `docs/active-commitments.md` — running session memory (active grants, partner pipeline, ecosystem scan results, legal status, next-thread queue). Read at session start; update at session end.
- **Grant Discovery Engine (already automated, running daily):** `server/grant-routes.ts` — 24h `setInterval` scan (line ~6359). Sources: SAM.gov (needs key — currently 401), Grants.gov (live, ~45 new/wk), USASpending.gov (live), curated state/foundation/corporate. ~580 opps tracked, ~54 new/week. Stats: `GET /api/grants/discovery/status`. Manual trigger: `POST /api/grants/discovery/run-now`.
- **"This Week" digest tab (new May 9, 2026):** Inside `/grant-command-center` → "This Week" tab. Shows last-N-days new opportunities sorted by fit score, fit distribution, source breakdown, upcoming deadlines, with email-preview button. Endpoints: `GET /api/grants/this-week?days=7&minFit=0`, `GET /api/grants/digest/preview?days=7` (HTML), `POST /api/grants/digest/send` (admin-only, manual trigger; auto-cron NOT enabled — needs recipient confirmation).
- **🧠 Compiled Agent Knowledge Layer (May 9, 2026):** Internal-only deterministic knowledge index for the Replit Agent. Inspired by VentureBeat's "RAG era is ending" + Towards Data Science's "unified agentic memory across harnesses using hooks." End-user RAG (`server/rag-engine.ts`, 86 chunks) is **UNTOUCHED** — these are parallel.
  - **Compiler:** `scripts/compile-agent-knowledge.ts` — reads `replit.md`, `docs/active-commitments.md`, `.agents/skills/map-gap/lessons-learned.md`, `docs/ecosystem-catalog.md`, queries `ecosystem_platforms` DB → emits `.agents/knowledge/compiled.json`. Re-run with `npx tsx scripts/compile-agent-knowledge.ts` after editing any source.
  - **Hook endpoint (do this first at session start):** `GET /api/agent/knowledge/session-bootstrap` — compact briefing (~3KB): project header, session protocol, user prefs, vocab, critical gotchas only, quintet, ecosystem caveats, no-go list, file pointers, drill-down topics. Skips the verbose platform table.
  - **Drill-down:** `GET /api/agent/knowledge/topic/:key` — full slice for any top-level key (`platforms`, `gotchas`, `lessons_learned`, `ecosystem_caveats`, `active_commitments`, `vocab`, `file_pointers`, etc.).
  - **Full index:** `GET /api/agent/knowledge` (everything). **Recompile:** `POST /api/agent/knowledge/recompile` (admin-only, concurrency-locked).
  - **Current counts:** 15 gotchas (3 critical) · 4 vocab · 25 platforms · 4 no-go · 5 ecosystem caveats · 7 lessons · 31 active-commitment sections · 16 file pointers.
- **24-platform catalog moved out:** Full ecosystem catalog now lives at `docs/ecosystem-catalog.md` (compiled into the knowledge layer). `replit.md` keeps a one-paragraph summary + top caveats only — slimmed from 157 to ~105 lines while preserving 100% recall via the hook.

## Architecture decisions
- **Collaborative AI:** Employs a 4-engine synthesis (Gemini, Claude, GPT-4o-mini, DeepSeek R1) with RAG and implementation science frameworks for comprehensive AI capabilities.
- **Grant Systems:** Centralized grant management with SAM.gov integration, AI-powered semantic analysis, and a proposal lifecycle workflow, deliberately separating public program descriptions from internal funder pursuit details.
- **Truth-in-Claims Primitive:** The `<PartnershipStatus>` component enforces transparent and auditable disclosure of partnership stages and dates across the public site.
- **Public/Internal Gating:** Critical internal data and funder pipelines are explicitly gated behind authentication using a `<RequireAuth>` wrapper, ensuring public visibility for general information while protecting sensitive operations.
- **Jurisdiction-Agnostic Design:** The platform is architected for national scalability, with Travis County, Texas, serving as an implementation template rather than a geographical limitation.

## Product
- **Core Platform:** Community infrastructure spanning 6 domains (Criminal Justice, Health Equity, Behavioral Health, Workforce & Business, Education & Learning, Community & Advocacy) with 24 connected platforms.
- **AI Engine:** A 4-engine collaborative AI for chat, navigation, benefits screening, and grant drafting.
- **Grant Management:** AI-powered grant discovery, analysis, narrative generation, and a command center for tracking 92+ grants.
- **Workforce & Education:** ThriveUp Academy with AI Literacy, Workforce Readiness, Financial Literacy & STEM modules, FAFSA navigator, and apprenticeship tracker.
- **Justice & Reentry:** Programs, dashboards, and strategic plans for reentry and justice-involved individuals.
- **Health & Behavioral Health:** Programs for behavioral health, health & wellness, prevention strategies, and veteran support.
- **Community Intelligence:** SDOH Explorer, Vulnerability Maps, Neighborhood Lookup with real-time Census data, and Community Resource Directory.
- **Donor Engagement:** Cryptographically-verifiable outcome receipts linking charitable gifts to service events.
- **Ecosystem Management:** Hub for monitoring and managing the ecosystem (15 public-facing service platforms + internal/dev rows = 25 total in DB), including status and interoperability.

## Ecosystem catalog
**The full ecosystem catalog lives in `docs/ecosystem-catalog.md`** (25 rows in DB, of which 15 are public-facing service platforms + 1 is the TCAF parent org row; the other 9 are dev/internal/dead-URL — see "Public-vs-total count" gotcha) — moved May 9, 2026 to keep this file scannable. Read it before writing any grant narrative. The compiler reads it too, so it's also queryable at `GET /api/agent/knowledge/topic/ecosystem_caveats` and the live DB rows at `GET /api/agent/knowledge/topic/platforms`.

**Quintet to lead with in narratives:** Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health Ecosystem. Drop-in: `docs/grants/QUARTET-ONE-PAGER.md`.

**Top caveats** (full list in `docs/ecosystem-catalog.md`): Civic Signal IS in DB now (added) · TYT row's URL is wrong (`lexibridge.net` ≠ `talkyourtalk.net`) — TYT connector self-registers and overwrites · 10 of 25 DB rows aren't public-facing service platforms (1 is TCAF parent org `collaborative-advocate`; 9 are dev/internal/dead-URL — `autoimmune-thrive`, `wholemind`, `ecosystem-nexus`, `code-canvas`, `ad-targeting`, `video-creator-ai`, `pinnacle-business-conglomerate`, `pillscheduler`, `emergency-mgmt`) — re-probe before linking in submissions, check ALL aliases (`yourfeminineneeds.com` 404s but `herhealthmatters2.com` is live) · Some URLs are shared (`implementationineducatio.com` hosts both `isss` and `betterscience`).

<!-- The huge inline table that used to be here was extracted to docs/ecosystem-catalog.md on May 9, 2026 to reduce replit.md size while keeping recall via the compiler + bootstrap hook. -->

## User preferences
- Prioritize iterative development; explain major changes before implementation.
- High-quality, well-tested code; clear, simple language for technical concepts.
- Don't change sensitive configs (`vite.config.ts`, `drizzle.config.ts`, `package.json`) without explicit instruction.
- Always work in parallel using subagents; don't stop to chat when there's more work to do; keep building.
- Speak plainly, not in jargon. Use President not CEO. Honest disclosure always.
- Every change commits to this memory file. No silent failures.
- Memory continuity is non-negotiable; every session ENDS with a memory commit; every session BEGINS by reading this file. If a fact, person, deadline, project, partner, lesson, or commitment is not here, it does not exist next session.

## Gotchas
- **"CEO" vs. "President":** Always use "President" for Dr. Flood in public-facing copy; "CEO" is reserved for for-profit contexts.
- **Personal Emails:** Never use personal Gmail addresses in public copy or grant proposals; always institutional. Confirmed institutional emails: `terryflood@thrivingcommunitiesforall.com` (Dr. Flood, all proposals), `msisnett@thrivingcommunitiesforall.com` (Meredith, non-City work only).
- **🚨 Meredith Sisnett & City of Austin:** Meredith is a City of Austin employee. NEVER list her on any City of Austin grant/proposal/contract (AEI, Cultural Arts, APH, EDD, Public Health, AHFC, etc.) as staff, contact, co-lead, board, or partner. She may consult on non-City (federal/state/foundation/private) work only. When in doubt, leave her out and ask user.
- **St. David's Foundation Status:** Always "actively evaluating," never "awarded."
- **Funder Names on Public Pages:** Avoid mentioning specific funders on public program pages; describe the program category instead.
- **FIPS Codes:** Do not expose "FIPS" labels directly to users; use "State Census Code" / "County Census Code".
- **"Texas-only" Framing:** Emphasize "national platform, Texas-piloted" for all geographic descriptions.
- **Silent Catch Blocks:** Prohibited; all server route errors must be handled and reported.
- **Conditional `useEffect`:** Avoid React hooks violations by making `useEffect` unconditional.
- **Hardcoded Arrays for Grants:** `/api/proposal-pipeline` must read from the `proposal_pipeline` database table, not hardcoded arrays, to avoid silent failures in opportunity tracking.
- **`curl HTTP 000`:** This indicates an unbound custom domain, not necessarily that the platform is down. Check `ecosystem_platforms.health_status` in the hub DB for true platform status.
- **Hub pinger false-positive:** Marks platforms "online" even when DNS fails or heartbeat is >7 days stale. Bug logged in `docs/active-commitments.md` — fix at hub-vs-connector boundary.
- **TYT connector self-registration:** Talk Your Talk's connector still announces itself as "LexiBridge (Speech Bridge)" / `lexibridge.net` — overwrites hub row name+URL on every heartbeat. Description and grant_alignment fields survive. Real fix lives in TYT workspace (`artifacts/api-server/...`), not this one.
- **🚨 ECOSYSTEM_PLATFORMS hardcoded array overwrites the DB on every startup.** Lives in `server/ecosystem-connector.ts:658` (`const ECOSYSTEM_PLATFORMS = [...]`). The startup auto-sync (a) UPDATEs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment to match this array, (b) DELETEs any DB row whose ID isn't in the array. So any DB-only edit to those fields gets wiped within seconds. **`publicVisible` is NOT in the update set, so it survives.** When you add/rename/re-URL a platform, edit BOTH the DB and this hardcoded array, or the DB change is ephemeral. (How sankofa-feminine-health URL kept reverting; how Civic Signal got "Removed stale platform" deleted on first restart.)
- **Talk Your Talk rebrand:** Old name LexiBridge / Speech Bridge → new name **Talk Your Talk** (`talkyourtalk.net`). Verified count: **89 spoken + 18 sign = 107 total** (homepage marketing previously said "107 + 18" conflated). Use **89 / 18 / 107** in all proposals.
- **🚨 Public-vs-total platform count (use 15, not 25, externally):** DB has **25 rows** in `ecosystem_platforms` but only **15 are public-facing service platforms**. The other 10 = 1 TCAF parent org row (`collaborative-advocate`, the 501c3 itself, not a service) + 9 dev/internal/dead-URL (`autoimmune-thrive`, `wholemind`, `ecosystem-nexus`, `code-canvas`, `ad-targeting`, `video-creator-ai`, `pinnacle-business-conglomerate`, `pillscheduler`, `emergency-mgmt`). **In all external/grant/briefing copy use "15 service platforms operated by TCAF."** "25" is internal architecture only. The 15: Whole-Person Health · Talk Your Talk · Sankofa Network · Black Maternal Health · Black Men's Health Hub · HerHealth Network · SafeCogniCare · Perfectly Different · LifeBridge · Mission Transition (M2C) · Minority Center of Excellence · ISSS · RPLICE/BetterScience · SafeReport · Civic Signal. Quintet to lead with: TYT · Civic Signal · LifeBridge · ThriveUp Academy · WPH.

## Pointers
- **Replit AI Integrations:** Refer to Replit documentation for `javascript_openai_ai_integrations`, `javascript_anthropic_ai_integrations`, `javascript_openrouter_ai_integrations`.
- **Replit Auth:** Consult Replit's `log_in_with_replit` documentation.
- **Drizzle ORM:** See Drizzle's official documentation for schema definitions and query building.
- **Tailwind CSS & shadcn/ui:** Refer to their respective documentation for UI component customization.
- **TanStack Query v5:** Documentation for advanced data fetching and caching.
- **Wouter:** Lightweight React router documentation.
- **SAM.gov API:** Official API documentation for federal grant opportunities.
- **Playwright:** End-to-end testing framework documentation.
- **Implementation Science:** RPLICE, CFIR/RE-AIM, MAP-GAP frameworks for program design and evaluation.
- **Grant Research Methodology:** Robert Tabbara's checklist for prior award research (SAM.gov, USASpending.gov, sbir.gov, etc.) — **mandatory for ALL grants regardless of size or source**. Reference template: `docs/grants/AEI-Funder-Intelligence.md`. See playbook lesson #19.