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

## Ecosystem catalog — all 24 platforms (+ 1 unregistered)
*Read this before writing any grant narrative. Verified liveness: May 7, 2026. Source of truth: `ecosystem_platforms` table; this table is a snapshot. Re-probe before linking in submissions.*

**Status legend:** ✅ live & rendering · ⚠️ row exists but URL/data wrong · 🚧 host up but returns 404 · ❌ DNS dead, parked, or unreachable

### Known but NOT in hub DB (must register)
| ID | Name | URL | What it does | Status |
|---|---|---|---|---|
| (none) | **Civic Signal** | power2thepeople.net | Civic intelligence terminal: Live Civic Feed (1,448 court / 880 ord / 360 mtg), 10-step Prepare wizard, EN/ES. **One of the quartet but not registered in hub.** | ✅ |

### Health Equity (10 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `whole-person-health` | **Whole-Person Health Ecosystem** | mentalwellnesssupport.net | **Behavioral-health safety floor under entire ecosystem.** No-login. C-SSRS/PHQ-9/GAD-7/PCL-5 screenings, safety plans, Reach-a-Vet, MAP-GAP, 20,670+ resources, offline PWA. Every platform routes crisis here. | SSG Fox, St. David's, WIOA, Foundation | ✅ |
| `speech-bridge` | **Talk Your Talk** *(DB still says "LexiBridge")* | DB: lexibridge.net ❌ · **TRUE: talkyourtalk.net** ✅ | 89 spoken + 18 sign langs (incl. Black ASL, Intl Sign, Tactile Sign), 6 learning surfaces, crisis detection on every utterance, honest no-auto-988 disclosure. | St. David's, SSG Fox, WIOA, Foundation | ⚠️ true URL live; DB row needs URL+name fix (TYT connector self-registers — fix in TYT workspace) |
| `sankofa` | Sankofa Health Network | yourhealthbirthright.net | Health-equity gateway orchestrating the 5 Sankofa sub-platforms; culturally-responsive BH assessments, GIS resource matching. | St. David's, SSG Fox, Foundation | ✅ |
| `sankofa-maternal-health` | Black Maternal Health Network | yourhealthbirthright.net *(shared)* | Black maternal mortality response: doula matching, EPDS/PHQ-9 peripartum screening, postpartum recovery, CHW dispatch. | St. David's, SSG Fox, Foundation | ✅ |
| `sankofa-mens-health` | Black Men's Health Hub | thehealthyblkman.com | Prostate/CV/diabetes prevention, BH stigma reduction, AUDIT-C/DAST-10, peer-mentor matching for Black men. | St. David's, SSG Fox, Foundation | ✅ |
| `sankofa-feminine-health` | **HerHealth Network** (Holistic Black Feminine Health Hub) | **herhealthmatters2.com** (alias: myhealthybreast.com) — *old yourfeminineneeds.com is unbound; URL+name fixed in `ECOSYSTEM_PLATFORMS` array May 7, 2026* | OB/GYN, hormonal wellness, cervical/breast cancer awareness, menopause, culturally-responsive provider matching. | St. David's, Foundation | ✅ |
| `safecognicare` | SafeCogniCare | safecognicare.com | TBI/ADHD/dementia/peripartum cognitive: MoCA/MMSE/Trail Making, early intervention, family caregiver burden. Critical for veteran TBI + maternal cognitive change. | SSG Fox, St. David's, Foundation | ✅ |
| `perfectly-different` | Perfectly Different | neurodifferentassistant.app | Neurodiversity-affirming (autism, ADHD, AuDHD): IEP/504 templates, crisis routes to WPH, evidence-based therapy library. | St. David's, Foundation, WIOA | ✅ |
| `pillscheduler` | PillScheduler | pillscheduler.net | Polypharmacy management: adaptive reminders, FDA interaction DB, care-team coordination, adherence scoring. | SSG Fox, St. David's, Foundation | ❌ |
| `autoimmune-thrive` | Autoimmune Center of Excellence | autoimmunethrive.com | Lived-experience-built autoimmune companion: symptom check-ins, flare tracking, 80+ condition guides. | St. David's, Foundation, WIOA, SSG Fox | ❌ |

### Community / Workforce / Veterans (4 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `lifebridge` | **LifeBridge** | lifetransitionsaid.org | Virtual 211 + CHW coordination across housing/food/health/MH/SUD/DV/crisis. 20,670+ resources. Addresses non-combat veteran-suicide drivers (divorce, job loss, retirement, bereavement). | St. David's, SSG Fox | ✅ |
| `collaborative-advocate` | **The Collaborative Advocate** *(TCAF parent org)* | thrivingcommunitiesforall.com | The 501(c)(3) entity itself. Veteran-founded, Black-led VOSB. Service-delivery + grant-execution arm. Hosts ThriveUp Academy `/academy`. | All | ✅ |
| `m2c` | Mission Transition (M2C) | vetmissiontransition.com | Full mil-to-civ transition: MOS/AFSC translation, GI Bill/VA/disability claims, identity transition for loss-of-purpose crisis, employer matching. | SSG Fox, WIOA, Foundation | ✅ |
| `mce` | Minority Center of Excellence | minoritycenterofexcellence.com | 656,794 SAM.gov records; 14 AI tools across 6-stage business lifecycle; dual-AI (GPT+Claude) proposal review; 50-state certification coverage. | WIOA, Foundation, SSG Fox | ✅ |

### Education (3 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `isss` | ISSS — Integrated Supports for Thriving Youth | implementationineducatio.com *(shared)* | Whole-child MTSS engine, early-warning indicators, Thrive Score, CFIR/RE-AIM fidelity tracking. | WIOA, Foundation, St. David's | ✅ |
| `betterscience` | RPLICE — Research-to-Practice Lifecycle | implementationineducatio.com *(shared)* | Closes science→practice gap: live evidence search, project assessment, implementation planning, outcome tracking. CFIR 2.0 + RE-AIM. | SSG Fox, Foundation, WIOA, St. David's | ✅ |
| `wholemind` | WholeMind Learning | wholemindlearning.com | Free Pre-K-12 visual-first learning, silent accessibility mode, AI homework help, gamified engagement. | WIOA, Foundation, St. David's | ❌ (parking lander) |

### Compliance / Operations / Marketing / System (7 platforms)
| ID | Name | URL | What it does | Grants | Status |
|---|---|---|---|---|---|
| `safereport` | SafeReport | safereports.net | Mandatory-reporter incident management: 50-state reg DB, 7-stage lifecycle, blockchain-anchored audit trails, court-admissible evidence. | SSG Fox, Foundation, St. David's | ✅ |
| `emergency-mgmt` | Emergency Management | emergency-mgmt.replit.app | Risk intelligence: geographic risk maps, multi-factor safety analytics, ingests SafeReport/WPH/LifeBridge data for predictive safety models. | SSG Fox, Foundation, St. David's | 🚧 (404) |
| `ecosystem-nexus` | Ecosystem Nexus | ecosystemnexus.net | Cross-platform health monitoring, directive enforcement, triad team-of-teams coordination, bilateral exchange protocols. | All | ❌ |
| `code-canvas` | Code Canvas — System Evaluator | codecanvaseval.com | Independent code/architecture/perf audits across the ecosystem; QA backbone. | All | ❌ |
| `ad-targeting` | Advertising Targeting for Platforms | adtargetingplatforms.com | Audience segmentation, A/B campaigns, cross-platform ad delivery for grant-funded program outreach. | WIOA, St. David's, Foundation, SSG Fox | ❌ |
| `video-creator-ai` | Video Creator AI | videocreatorai.com | AI content production for the ecosystem: promo videos, grant decks, training, platform showcases. | All | ❌ |
| `pinnacle-business-conglomerate` | Pinnacle Business Conglomerate | pinnaclebusinessconglomerate.com | Cradle-to-grave contractor enablement for minority/veteran-owned: 8(a)/HUBZone/SDVOSB/WOSB cert, dual-AI proposal dev, milestone tracking. | All | ❌ |

### Quintet (the 5 platforms to lead with in narratives)
**Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health Ecosystem.** See `docs/grants/QUARTET-ONE-PAGER.md` for the drop-in narrative.

### Critical caveats for any grant work
1. **Civic Signal is not in the hub DB.** It's part of the quintet but missing from `ecosystem_platforms`. Register it before next ecosystem-wide claim.
2. **TYT row's URL is wrong.** DB says `lexibridge.net` (dead). True URL is `talkyourtalk.net`. The TYT connector self-registers as "LexiBridge" on every heartbeat — fix lives in TYT workspace, not here.
3. **9 of 24 platforms are not currently public-facing** (DNS dead, parked, or 404). Never link to a platform in a proposal without re-probing first. **Probe ALL known aliases before declaring a platform dead** — `sankofa-feminine-health` was nearly removed because `yourfeminineneeds.com` 404s, but the same site is live at `herhealthmatters2.com` AND `myhealthybreast.com` (same payload). Always check the project's Publishing → Domains tab for verified alternate URLs. The ecosystem-alignment-scan script (`scripts/ecosystem-alignment-scan.sh`) and the probe pattern in `docs/active-commitments.md` ("SPA route 200 ≠ real page") apply here too.
4. **Some URLs are shared.** `implementationineducatio.com` hosts BOTH `isss` and `betterscience`. `yourhealthbirthright.net` hosts BOTH `sankofa` and `sankofa-maternal-health`. `thrivingcommunitiesforall.com/academy` is ThriveUp Academy on the `collaborative-advocate` domain.
5. **Always pull the full table before locking a narrative.** Today's quartet→quintet miss happened because I worked from in-context platforms instead of the DB. The cost is missed grant fits.

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