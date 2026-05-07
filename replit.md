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
- **Internationalization:** English + Spanish (`useLanguage()` from `@/lib/i18n`)
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
- **Ecosystem Management:** Hub for monitoring and managing the 24-platform ecosystem, including status and interoperability.

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
- **Talk Your Talk rebrand:** Old name LexiBridge / Speech Bridge → new name **Talk Your Talk** (`talkyourtalk.net`). Verified count: **89 spoken + 18 sign = 107 total** (homepage marketing previously said "107 + 18" conflated). Use **89 / 18 / 107** in all proposals.

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