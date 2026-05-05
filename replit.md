# ThriveUp Academy / TCAF / ALC — Institutional Memory

> **Read this file first, every session.** This is the durable memory of who we are,
> how we operate, and the discipline we hold ourselves to. Every change to the platform
> updates this file. No silent failures, no information silos. If a fact lives only in
> one session's chat history, it does not exist next session — write it here.

---

## 1. Identity (do not get this wrong)

### The two organizations
- **The Collaborative Advocate Foundation (TCAF)** — technology partner, methodology
  developer, healthcare administrative support. Operates the 24-platform Autonomous
  Community Operating System and the methodology catalog (RPLICE, MAP-GAP, SALP,
  MG-PATR). **501(c)(3) status: pending IRS determination.** IRS Tracking number
  **281OIP7B**, application filed **April 27, 2026**.
- **Abundant Life Church (ALC)** — legal applicant and fiscal sponsor (fiduciary).
  Holds an **active 501(c)(3) determination**. ALC is the lead applicant on all
  current grant submissions; TCAF operates as sub-recipient under ALC during the
  pendency period. This is a structurally sound, IRS-compliant pattern.
- **ThriveUp Academy** — the youth-facing learning brand within the platform
  (AI Literacy Curriculum, Workforce Readiness, Financial Literacy & STEM
  Engagement Modules, etc.). Not a separate legal entity.

### The President
- **Dr. Terry Flood, President, TCAF.** Public title is always **President** —
  never "CEO" on the public site. TCAF is a 501(c)(3); the title must reflect that.
- Public-facing email is institutional only:
  `president@thecollaborativeadvocate.org`, `programs@thecollaborativeadvocate.org`.
  Personal Gmail addresses must never appear in public copy.

### Geography
- **National community-infrastructure platform**, designed for all 50 states + 5
  U.S. territories.
- **Live pilot:** Travis County, Texas (Austin, Pflugerville, Manor) with active
  outreach across Central Texas.
- Travis County is the **implementation template**, not the ceiling. The 24-platform
  ecosystem, RPLICE protocol, MAP-GAP CQI engine, and benefits screener are
  jurisdiction-agnostic by design — replicable in Ohio, Mississippi, Puerto Rico, or
  any U.S. county via the open Hub Adoption Kit.

### Funder posture (cardinal rules)
- **Real, not notional** — every number, partnership, and capability is disclosed at
  its honest status: operational / pilot / in-development / exploratory.
- **St. David's Foundation is "actively evaluating"** — never described as awarded.
  WAB2 LOI was submitted 4/27/2026.
- **Funder pursuit pipeline is gated behind auth.** Public visitors describe what we
  do; internal workspace describes who we're pitching. Only the St. David's WAB2
  surface (`/st-davids`, `/st-davids-wab2`, `/wab2-enrollment`) is public — that is
  the single funder-facing demonstration of how funds distribute across 5 counties ×
  5 benefit areas in the LOI.
- **Funder names stripped from public program pages.** `/veterans`,
  `/behavioral-health`, `/reentry-program`, `/research` describe program model and
  federal program category — never the specific funder being pursued.

---

## 2. Mission & Theory of Change

ThriveUp Academy / TCAF is national community infrastructure — the operating system
for how communities support, engage, connect, and serve their people. It spans
**6 domains** (Criminal Justice, Health Equity, Behavioral Health, Workforce &
Business, Education & Learning, Community & Advocacy), **24 connected platforms**,
and a **4-engine collaborative AI** that processes every output through parallel
synthesis.

The platform connects individuals to grant funding, aligns service delivery with
workforce-development criteria, and produces measurable community impact. It
addresses critical community needs — economic mobility, health equity, justice
reform, AI literacy — through technology-enabled service delivery that is
jurisdiction-agnostic and replicable.

**Honest operational status (always disclose this when asked):**
- Technology platform and methodology framework: unusually mature for an
  organization of this stage.
- 501(c)(3) structure: handled transparently and competently (ALC active + TCAF
  pending).
- Operational pilot: real but small.
- Peer-reviewed publication record: does not yet exist; first submissions targeted
  Q3 2026.
- Evaluator of record: not yet named — required for any outcomes claim funded by
  NSF/BJA.
- Fundability posture: B+ today — fundable for the right NOFO with the right
  co-applicant team; not yet fundable as sole lead applicant on a large federal
  research award.

---

## 3. System Architecture (durable reference)

### Stack
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, shadcn/ui, **wouter**
  routing, **TanStack Query v5**, lucide-react icons.
- **Backend:** Express.js (Node.js), PostgreSQL via Drizzle ORM (Neon-backed).
- **Auth:** Replit Auth (OIDC). Client-side via `useAuth()` hook returning
  `isAuthenticated`, `user`, `isLoading`. Role lookup via avatar query: `userRole`
  defaults to `"student"`; `isAdmin = userRole === "admin"`,
  `isTeacher = userRole === "teacher" || isAdmin`.
- **Internationalization:** English + Spanish via `useLanguage()` from `@/lib/i18n`.
- **Accessibility:** WCAG 2.1 AA compliant — dyslexia-friendly fonts, high contrast,
  reduced motion, screen reader optimization, mobile responsive.
- **Branding:** violet/indigo system with dark mode.

### Surface area (current inventory — updated each cycle)
- **Pages:** 192 page files in `client/src/pages/`.
- **Routes:** 206 wouter `<Route>` declarations in `client/src/App.tsx`.
- **Database tables:** 248 Drizzle `pgTable` definitions in `shared/schema.ts`
  (4,713 lines).
- **API endpoints:** 124+ unique endpoints across 35+ server route files.
- **Sidebar nav groups:** 25 named `NavItem[]` arrays in `app-sidebar.tsx`.

### Server route file map (in `server/`)
`routes.ts` (main), `agent-communication.ts`, `benefits-routes.ts`,
`coalition-routes.ts`, `collaboration-routes.ts`, `collaborative-ai.ts`,
`college-access-ai-routes.ts`, `contact-routes.ts`, `corridor-chainweb.ts`,
`corridor-docs.ts`, `corridor-story.ts`, `cross-platform-api.ts`,
`donor-receipts.ts`, `dosage-middleware.ts`, `early-warning.ts`,
`ecosystem-capacity-routes.ts`, `ecosystem-connector.ts`, `email-service.ts`,
`facilitator-routes.ts`, `gis-engine.ts`, `grant-routes.ts`,
`hub-intelligence.ts`, `justice-routes.ts`, `loi-routes.ts`, `mce-contracts.ts`,
`metrics-routes.ts`, `mou-routes.ts`, `navigator-routes.ts`,
`neighborhood-routes.ts`, `network-routes.ts`, `onboarding-routes.ts`,
`outcome-routes.ts`, `parent-education-routes.ts`, `partner-routes.ts`,
`peer-review-routes.ts`, `pilot-routes.ts`, `prevention-routes.ts`,
`prevention-strategies-routes.ts`, `pricing-routes.ts`, `program-engine.ts`,
`program-management-routes.ts`, `rag-engine.ts`, `reentry-routes.ts`,
`resident-journey.ts`, `resource-engine.ts`, `rplice-tools.ts`,
`safety-escalation.ts`, `sankofa-gateway.ts`, `standards-routes.ts`,
`thrive-engine.ts`, `video-pipeline.ts`, `workforce-routes.ts`.
Seed files: `seed-comprehensive.ts` (master), plus 10+ targeted seeds.

### Sidebar architecture (canonical structure)
File: `client/src/components/app-sidebar.tsx`. **25 NavItem arrays grouped into
public / authenticated / admin tiers.** Gating logic at lines 387–413:

- **Always public:** `texasPilotItems`, `programsItems`, `partnershipItems`,
  `aboutItems`, `communityIntelItems`, `workforceSolutionsItems`,
  `justiceReentryItems`, `healthWellnessItems`, `researchItems`, plus the public
  Academy/AI groups.
- **Only when `isAuthenticated`:** `grantEngineItems` (the funder pursuit pipeline)
  and `internalWorkspaceItems` (Healthcare Grants Catalog, Grant Packages,
  Transparency Matrix, Stakeholder Map).
- **Only when `isAdmin`:** `adminOpsItems`, `programMgmtItems`,
  `dataReportingItems`, `teachingAdminItems`.

### Route-level gating
- Component: `client/src/components/require-auth.tsx` — `<RequireAuth>` wrapper.
- Currently gated routes: `/healthcare-grants`, `/grant-packages`,
  `/transparency-matrix`, `/stakeholder-map`. Unauthenticated visitors see an
  "Internal Workspace" notice with sign-in CTA.
- St. David's WAB2 deliberately remains public.

### PartnershipStatus component (the truth-in-claims primitive)
File: `client/src/components/partnership-status.tsx`. Exports:
- `PartnershipStage` type — 7 honest stages from "exploratory" to "operational".
- `<PartnershipStatus stage={...} asOf={...}>` — single-badge component.
- `<PartnershipStatusLegend>` — full legend for transparency surfaces.

**Discipline rule:** any claim of partnership on the public site uses this
component. No "partner" claim ships without a stage badge and an `asOf` date.

---

## 4. Major Subsystems (every important capability, mapped)

### 4.1 Collaborative AI Intelligence Engine (4-engine synthesis)
Parallel synthesis across **Gemini 2.0 Flash + Claude Haiku 4.5 + OpenAI
GPT-4o-mini + DeepSeek R1**, with RAG knowledge retrieval and implementation
science frameworks (RPLICE, CFIR/RE-AIM, MAP-GAP) injected into prompts.
Powers chat (Spark, Sparky, Nia, Malik), navigation, benefits AI, grant drafting,
and every AI tool. Implemented in `server/collaborative-ai.ts` +
`server/ai-provider.ts`. RAG store has 78+ knowledge chunks covering ecosystem
operations, grant strategy, partnerships, and compliance.

### 4.2 Grant systems
- **Grant Hub** (`/grants`) — SAM.gov API integration, AI-powered semantic
  analysis, fit scoring, readiness checklists, AI-assisted narrative generation,
  daily automated discovery, "Team-of-Teams" platform assignment.
- **Grant Command Center** (`/grant-command-center`) — 92 grants tracked across
  the ecosystem, including 31 CDMRP programs ($1.187B addressable, CFDA 12.420).
  CDMRP organized by tier: Tier 1 (14 programs, ~$890M), Tier 2 (12, ~$245M),
  Tier 3 (5, ~$52M).
- **Healthcare Grants Catalog** (`/healthcare-grants`) — gated. 549 NOFOs in
  catalog with honest disclosure banner.
- **Grant Packages, LOI Writer, Logic Model, Grant Narrative, Proposal
  Pipeline, Proposal Command** — the proposal lifecycle surface.
- **Strategic Intelligence Playbook** at `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md`
  + bidirectional RAG ingestion.
- Key grant docs: `CDMRP-FY2026-Master-Grant-Strategy.md`,
  `HerHealth-33-Grant-Opportunities-Prospectus.md`,
  `GRANT-OPPORTUNITY-CRITERIA-MATRIX.md`,
  `ECOSYSTEM-COMPLETE-PLATFORM-REFERENCE.md`.

### 4.3 St. David's WAB2 surface (the only public funder demo)
- `/st-davids` — public landing for the WAB2 LOI demonstration.
- `/st-davids-wab2` — operator workspace.
- `/wab2-enrollment` — 5-county enrollment hub (Travis, Williamson, Hays, Bastrop,
  Caldwell).
- `/stdavids-prep` — proposal prep workspace.
- LOI submitted 4/27/2026; foundation actively evaluating. Never "awarded."

### 4.4 Benefits Intelligence (5-county system)
Census ACS data across Travis, Williamson, Hays, Bastrop, Caldwell counties.
- `/benefits-screener` — public 9-benefit screener (single front door).
- `/benefits` (Benefits Command Center) — operator workspace, 10 tabs:
  command, gis, barriers, map, partners, chw, navigator, hhsc, metrics, outreach.
- `/coalition` — partner coordination.
- `/network` — live network view.

### 4.5 Workforce / Education stack
- **Workforce Readiness Academy** (`/workforce-readiness`) — TEKS §127.15 compliant,
  15 weeks, 5 modules, 20 lessons, 50 quiz questions. Culturally responsive,
  phone-first. Characters: Jaylen, Aaliyah, Marcus, Sofia, DeAndre. Resume building
  threaded across all modules. 11 badges (5 module completion + 5 resume
  milestones + 1 certificate). Seed: `server/seed-workforce-lessons.ts`.
- **AI Literacy Curriculum & Creation Studio** (`/ai-tools`) — workforce-aligned;
  each tool paired with learning objective + guided lesson + portfolio artifact.
- **Financial Literacy & STEM Engagement Modules** (`/academy/games`) — game-based
  modules with documented learning objectives (Wallet=budgeting,
  Stocks=long-horizon decisions, Dominoes=strategic reasoning, Scenarios=real-world
  problem solving), aligned to TEKS §127.15 + DOL/ETA youth-workforce standards.
- **Full Curriculum Library** — 60 in-depth lessons across AI Literacy, Workforce
  Readiness, and Social-Emotional Learning.
- **FAFSA & Financial Aid Navigator** (`/fafsa-navigator`).
- **Apprenticeship Tracker** (`/apprenticeship-tracker`) — DOL RAPIDS-aligned,
  pre-apprenticeship → journeyworker lifecycle.
- **Opportunity Youth Outreach** (`/opportunity-youth`) — 7-step engagement
  lifecycle, 5-county Census data, barrier assessment, evidence-based strategies.
- **Postsecondary Transition Plans** (`/transition-plans`) — 6-step lifecycle,
  WIOA compliance, ITP builder, college tracker, credential tracker.

### 4.6 Justice / Reentry stack
- **Reentry Program** (`/reentry-program`), **Reentry Dashboard** (`/reentry`),
  **Reentry Standards** (`/reentry/standards`), **Reentry Strategic Plan**
  (`/reentry/strategic-plan`), **NRRC Outcome Reports** (`/reentry/outcome-reports`),
  **Reentry Stipend Pilot** (`/reentry-stipend-pilot`).
- **Justice Command Center** (`/justice-command-center`),
  **Justice Partners** (`/justice-partners`).

### 4.7 Health / Behavioral Health stack
- **Behavioral Health Program** (`/behavioral-health`) — Texas Medicaid Aligned ·
  Foundation Pathway. "Superior HealthPlan" (no Centene); "Foundation-aligned
  community health network" (no St. David's by name).
- **Health & Wellness** (`/health-wellness`), **Health Network** (`/health-network`),
  **CHW Dashboard** (`/chw-dashboard`).
- **Prevention** (`/prevention`), **Prevention Strategies** (`/prevention-strategies`).
- **Veterans Program** (`/veterans`) — federal Veterans suicide-prevention program
  standards (no SSG Fox by name on public surface).

### 4.8 Research & Methodology
- `/research` and `/methodology` (alias) → `ResearchMethodologyPage` — academic
  format with honest-disclosure banner. TCAF stated as **applied implementation
  science organization**, not a traditional research university. First peer-reviewed
  submissions targeted Q3 2026.
- `/research-hub` — broader research index.
- **RPLICE Implementation Science Toolkit** (`/rplice-tools`) — CFIR assessment,
  RE-AIM scorecards, fidelity checklists, Quality Gate Dashboard, AI-Powered
  Community Analysis streaming live Census ACS data into 9-section RPLICE reports.
- **MAP-GAP CQI** (`/cqi`) and **MAP-GAP Framework** (`/mapgap-framework`) —
  the Reflective Adaptive Learning Architecture (5 phases: MAP, GAP, EXECUTE,
  VALIDATE, LEARN). Lessons persisted in `.agents/skills/map-gap/lessons-learned.md`.
- **Peer Review** (`/peer-review`).

### 4.9 Community Intelligence
- **SDOH Explorer** (`/sdoh-explorer`) with Vulnerability Map tab (CDC/ATSDR SVI
  scores from live Census ACS at census tract level; 16 indicators × 4 themes).
- **SDOH Impact Chain** (`/sdoh-chain`).
- **Neighborhood Lookup** (`/neighborhood`) — flexible location lookup (ZIP, name,
  street, city; Census geocoder + Nominatim fallback). Real-time Census ACS, SVI
  scoring, up to 10-page PDF reports, 15-20 slide PPTX, scenario sandbox, up to 20
  matched live grants. Email reports rate-limited and sanitized.
- **Community Map** (`/community-map`), **Community Resource Directory**
  (`/resource-directory`), **Coalition Portal** (`/coalition`), **Coalition**
  (`/coalition-portal`), **Network Members** (`/network/members`).
- **GIS Sources:** CDC PLACES, CDC/ATSDR SVI, FBI Crime Data, Census Bureau ACS,
  USDA Food Access Atlas, HUD, SAMHSA, BLS.
- **Gun Violence Registry** — live API to Dr. Flood's National Gun Violence
  Tracker + Gun Violence Archive national data.

### 4.10 Donor surface (Outcome Receipts)
Cryptographically-verifiable receipts that bind a charitable gift to a specific
service event. Hash chain: `h_n = sha256(h_{n-1} | event_id | event_type | event_title | occurredAt)`.
PII stripped at receipt boundary (e.g., "Resident #M-2026-001").
- `/donors` — donor product landing with gift tiers + AI-generated donor brief.
- `/donor-receipt-demo` — live anonymized 3-receipt demo + full chain table.
- `GET /api/donor/receipt-demo`, `POST /api/donor/verify`.
- Files: `server/donor-receipts.ts`, `client/src/pages/donors.tsx`,
  `client/src/pages/donor-receipt-demo.tsx`.

### 4.11 Ecosystem / Platform Management
- **Ecosystem Hub** (`/ecosystem`, `/ops-center`) — 24 platforms with status
  badges (Fully Integrated / Linked / In Development); 16 of 20 currently Fully
  Integrated.
- **Ecosystem AI** (`/ecosystem-ai`), **Ecosystem Story** (`/ecosystem-story`),
  **Ecosystem Connector** (`/ecosystem-connector`).
- **SiteSync Inject**, **Ecosystem Directives**, **Unified Operating System
  Directive (UOSD)** with **Cognitive Elevation Addendum (CEA)**.
- **Fidelity Report Card System**.
- **Confidence Drift + Autonomy Quadrants** — earned trust + thinking scores.
- **Capability Orchestration Map** — 23-platform lead/support/validate roles.
- **Agent Communication Layer** — all 24 platforms as autonomous agents with
  reasoning-required communication.

### 4.12 Texas Pilot surface (the implementation template)
Public group "Texas (St. David's Pilot)" in sidebar. The 5-county WAB2 demo plus
the implementing neighborhoods:
- `/st-davids` (front door), `/benefits-screener`, `/benefits`, `/coalition`,
  `/network`, `/st-davids-wab2`, `/austin`, `/manor`, `/pflugerville`,
  `/voices-of-austin`, `/texas-assessment`, `/third-spaces`.

### 4.13 Public legal / transparency
- `/about` — ALC + TCAF dual-org card, 501(c)(3) honest disclosure, Geographic
  Scope card (national platform, Texas-piloted).
- `/non-discrimination`, `/privacy`.
- `/transparency` (public dashboard) — distinct from the gated
  `/transparency-matrix`.
- `/contact`, `/get-help`, `/impact`, `/coverage`, `/data-sources`.
- `/open-innovation-lab` — reframes sandbox/dev surface.
- `/api-docs`, `/business-card`.

---

## 5. Coding Conventions & Discipline

### Always
- **Auth:** every mutation API endpoint requires authentication. User-specific
  data routes verify identity via `getUserId`/`getUserName` patterns.
- **Error handling:** every server route wrapped in try/catch; every client
  mutation `onError` shows a user-facing toast.
- **PageHeader:** every navigable page uses `<PageHeader>` from
  `@/components/page-header` for breadcrumbs + title.
- **ErrorRetry:** every page that fetches data uses `<ErrorRetry>` from
  `@/components/error-retry`.
- **data-testid + aria-label:** every interactive element. Pattern:
  `{action}-{target}` for buttons/inputs/links; `{type}-{content}` for displays.
- **useEffect(document.title):** unconditional, before any early returns.
- **TanStack Query v5:** object form only. Hierarchical query keys as arrays
  (`['/api/x', id]` not template strings) so invalidation works.
- **Forms:** `useForm` + `Form` + `zodResolver` + insert schema from
  `@shared/schema.ts`.
- **Routing:** `wouter` `Link` and `useLocation`.
- **Icons:** `lucide-react`.

### Never
- "CEO" in public copy — always **President**.
- Personal Gmail in public copy — always institutional `@thecollaborativeadvocate.org`.
- "Awarded" St. David's — always "actively evaluating".
- Funder names (BJA, NSF, VA SSG Fox, Centene, St. David's) on public program
  pages — describe the program category instead.
- "FIPS" labels in user-facing UI — use "State Census Code" / "County Census Code".
- "Texas-only" framing — always "national platform, Texas-piloted".
- `paypal.me/TERRYFLOODCEO` visible labels — payment URL hidden behind
  institutional copy.
- Edit `package.json` directly — use the package management tool.
- Modify `vite.config.ts`, `server/vite.ts`, or `drizzle.config.ts` unless
  absolutely necessary.
- Emoji in UI code unless explicitly requested.
- Silent catch blocks. `console.log` in server.
- Conditional `useEffect` (React hooks violation).
- Nested anchor tags (`<Link><a>...`).

### MAP-GAP cycle discipline (every improvement cycle)
1. **MAP** — run health-check scripts (see `.agents/skills/map-gap/SKILL.md`),
   launch parallel explorers, never fix what you haven't mapped first.
2. **GAP** — classify by severity (CRITICAL / HIGH / MODERATE / LOW) + stakeholder
   impact (Students / Teachers / Funders / Technical).
3. **EXECUTE** — max 8 tasks per cycle; one cycle = one category of gap.
4. **VALIDATE** — `curl` endpoints, refresh logs, architect review, `runTest()`.
5. **LEARN** — update this file (`replit.md`) and
   `.agents/skills/map-gap/lessons-learned.md`. Delete `.local/session_plan.md`.

### Compound metrics tracking
| Metric | Status |
|---|---|
| GET routes with try/catch | 124/124 (100%) |
| Pages with ErrorRetry | 50+ |
| Pages with PageHeader | 55+ |
| data-testid attributes | 2,338+ |
| aria-labels | 95+ |
| React hooks violations | 0 |
| User-specific routes with auth | 100% |
| Silent catch blocks | 0 |
| `console.log` in server | 0 |

---

## 6. External Dependencies & Integrations

- **Database:** PostgreSQL (Neon-backed).
- **AI:** Google Gemini 2.0 Flash, Anthropic Claude Haiku 4.5, OpenAI GPT-4o-mini,
  Replit AI Integrations GPT-5-nano, OpenRouter (DeepSeek R1).
- **Email:** Resend (Replit connector).
- **Auth:** Replit Auth (OIDC).
- **Federal grants:** SAM.gov API (`api.sam.gov`).
- **Mapping:** Leaflet + react-leaflet + OpenStreetMap.
- **GIS data sources:** CDC PLACES, CDC/ATSDR SVI, FBI Crime Data, Census Bureau
  ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS.
- **External platform integration:** Student Support Portal (ISSS).

### Installed Replit integrations (do not reinstall)
- `javascript_openai_ai_integrations` 2.0.0
- `javascript_anthropic_ai_integrations` 2.0.0
- `javascript_openrouter_ai_integrations` 2.0.0
- `javascript_log_in_with_replit` 2.0.0
- `javascript_object_storage` 2.0.0
- `resend` 1.0.0

### Secrets the app needs but may not have set
- `NETWORK_SECRET_BIBLESTUDY`, `NETWORK_SECRET_HERHEALTH`
- `SENDGRID_API_KEY`
- `THRIVEUP_SHARED_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

---

## 7. Cycle History (the durable log)

### Cycle A — Honesty & Identity (April 2026)
- A01: Personal Gmail → institutional email site-wide.
- A02: Personal name → "President, TCAF" in functional/role contexts.
- A03: Built `/about` with ALC + TCAF dual-org card, 501(c)(3) disclosure,
  IRS Tracking 281OIP7B.
- A04: Built `/non-discrimination` + footer link.
- A05: `PartnershipStatus` 7-stage badge + retrofit.
- A06: Footer transparency note.

### Cycle B — Agency Targeting (April 2026)
- B01: `/veterans` (initially VA SSG Fox, later genericized).
- B02: `/behavioral-health` (initially Centene + St. David's, later genericized).
- B03: `/reentry-program` (initially BJA SCA, later genericized).
- B04: `/research` (NSF intellectual merit framing).
Each page shipped with evidence-based content + honest disclosure banner.

### Cycle C — Structure & Plain English (April 2026)
- C01: Sidebar restructured to 8 public pillars + admin gating.
- C02: Admin/dev pages moved behind `/admin` gate.
- C03: FIPS labels relabeled "State Census Code" / "County Census Code"
  in `rplice-tools` and `justice-command-center`.
- C04: Healthcare-grants speculative numbers replaced with NOFO ranges +
  honest disclosure banner.
- C05: Duplicate dashboards consolidated (later finished in Cycle F).

### Cycle D — Evidence & Methodology (April 2026)
- D01: Methodology page (later promoted to dedicated `/methodology` route).
- D02: `/transparency-matrix` (4-status × 3-category grid) — later gated.
- D03: Academy games reframed (later finished in Cycle F).
- D04: AI Tools reframed as AI Literacy Curriculum (later finished in Cycle F).
- D05: `/open-innovation-lab` reframes sandbox/dev surface.
- D06: `/stakeholder-map` (29 stakeholders × 6 categories) — later gated.

### Audit Pass (April 2026)
P0/P1 punch-list: `paypal.me/TERRYFLOODCEO` hidden from visible labels,
"Dr. Terry Flood, CEO" → "President" in funder-facing copy, FIPS relabeled,
`$15M+ Pipeline Value` replaced with NOFO-range tracking.

### Cycle E — Public/Internal Separation (May 2026)
- Built `<RequireAuth>` wrapper (`client/src/components/require-auth.tsx`).
- Gated routes: `/healthcare-grants`, `/grant-packages`, `/transparency-matrix`,
  `/stakeholder-map`.
- Sidebar restructure: `grantEngineItems` + new `internalWorkspaceItems` only
  render when `isAuthenticated`.
- Funder names stripped from public program pages (VA SSG Fox → "federal Veterans
  suicide-prevention program standards"; BJA SCA → "federal Second Chance program
  standards"; NSF → "peer-review-grade research funding"; Centene → "Superior
  HealthPlan"; St. David's named only on the WAB2 demo surface).
- St. David's WAB2 surface remains public.

### Cycle F — National Framing + Closing the Yellow Triangles (May 2026)
- Footer copy reframed: "National community-infrastructure platform. Live pilot
  in Travis County, Texas — the template for the all-50-states + 5-territory
  rollout via the open Hub Adoption Kit."
- `/about` Geographic Scope card now leads with "National platform,
  Texas-piloted" and explicitly names jurisdiction-agnostic architecture.
- D01 closed: `/methodology` route alias → `ResearchMethodologyPage`.
- D03 closed: `academy-game-lobby.tsx` page header is now "Financial Literacy
  & STEM Engagement Modules" with documented learning objectives (TEKS §127.15
  + DOL/ETA alignment).
- D04 closed: `ai-tools-hub.tsx` page header is now "AI Literacy Curriculum
  & Creation Studio" with workforce-aligned framing.
- C05 closed: removed duplicate "Benefits Intel" + "Benefits Screener" entries
  from gated `grantEngineItems`. Each page has exactly one canonical sidebar entry.

### Cycle H — Grant Opportunity Reconciliation (May 3, 2026)

- **SAM.gov IRS TIN mismatch: RESOLVED** (per Dr. Flood, May 3, 2026).
  Federal submissions are no longer structurally blocked. Every proposal in
  `server/grant-routes.ts` still carries a `"SAM.gov TIN Resolution": "blocker"`
  checklist line — these are stale and must be flipped to `complete` on the
  next pipeline edit.
- **Defect identified — silent failure of opportunity tracking.**
  `/api/proposal-pipeline` is a hardcoded array of **11 proposals** in
  `server/grant-routes.ts`. It does not read from the `grant_opportunities`
  table (536 rows, SAM.gov-imported), nor from the 50 docs in `docs/grants/`,
  nor from the live-researched Criteria Matrix. Result: when asked "what's due
  this week," the dashboard answered honestly about its own 11 entries while
  ~80+ opportunities Dr. Flood was actively pursuing were invisible. This is
  the exact silent-failure pattern Cycle G's Memory Discipline forbids.
- **True opportunity universe (May 2026), reconciled:**
  - **In `/api/proposal-pipeline` (11):** NSF STEM K-12, NSF ATE, NSF IUSE:EDU,
    NSF Quantum DCL, NSF SBIR Phase I, NIH SBIR Phase I, TWC RFA 32026-00162,
    Rare Impact Fund LOI, DOL RESTART, Agency Fund EOI, St. David's WAB2 LOI.
  - **Drafted in `docs/grants/` but NOT in pipeline (8):** NSF TechAccess
    AI-Ready America (NSF 26-508, due **Jun 16, 2026**, $1M/yr × 3),
    NSF SoSDCI, CDMRP PRMRP Concept Award (window May–Aug 2026),
    Borealis DIF × Tech 2026, RWJF Global Ideas 2026 (up to $500K),
    Spencer Foundation Small Research Grant 2026, St. David's Community-Led
    Change LOI (separate from WAB2), HerHealth Network Prospectus
    (33 sub-opportunities).
  - **Criteria Matrix Tier 1 (Apr 10 priority list) NOT in pipeline (5):**
    RWJF Learning from Abroad (Apr 13 — passed, needs go/no-go log),
    Gates AI to Accelerate Charitable Giving (Apr 28 — passed, needs status),
    CDC Drug-Free Communities ($1.25M over 10 yr, NOFO ~May 2026, DFC
    Command Center already built), TWC + DSHS Healthcare Apprenticeship
    ($500K/yr × 2, rolling), FEMA BRIC (up to $20M, **Jul 23, 2026**,
    requires City of Austin or Travis County as gov't applicant).
  - **Criteria Matrix Tier 2 NOT in pipeline (5):** SAMHSA NCTSI Cat III
    ($400K–$1M/yr × 5), HRSA MCH PIP, DOL HVRP/IVTP, Title IV-A Stronger
    Connections (via PfISD), SAMHSA CCBHC-PDI ($2M–$4M/yr).
  - **NIH HerHealth pathways with near deadlines NOT in pipeline (5):**
    NIH PAR-25-144 D&I Research R01 (**Jun 5, 2026**, $500K/yr),
    NIH PA-25-301 NIMHD Parent R01 (**Jun 5, 2026**, $500K/yr),
    NIH PAR-25-143 D&I Research R21 (**Jun 16, 2026**, $275K),
    NIH PA-25-304 NIMHD Parent R21 (**Jun 16, 2026**, $275K),
    NLM G08 Health Disparities Info Resources (Apr 24 — passed).
  - **CDMRP FY26:** ~31 programs across Tier 1/2/3 in
    `CDMRP-FY2026-Master-Grant-Strategy.md`, $1.187B total addressable.
    All FOAs in pre-announcement; submission window May–Aug 2026.
  - **`/api/grants` (536 SAM.gov-imported):** 29 federal opportunities due
    May 3–10, 2026. High-fit subset for ALC/TCAF includes BJA FY25 Second
    Chance Act (Reentry Education + Community-based Reentry, due **May 4**),
    BJA FY25 Comprehensive Opioid/Stimulant/SUD Site-Based (May 4),
    OJJDP FY25 Family-Based Alternative Justice (May 4), BJA FY25 National
    Center on Restorative Justice (May 8), NIJ FY25 Research and Evaluation
    on Violence Against Women (May 11), BJA FY25 Byrne State Crisis
    Intervention Formula (May 12).
- **Pipeline hygiene needed (4 items showed "passed deadline" but uncertain
  submission status):** TWC RFA 32026-00162 (Apr 10 — `narrative_drafted`),
  Rare Impact Fund LOI (Apr 10 — `loi_drafted`; a SUBMITTED narrative exists
  in `docs/grants/` so this likely DID ship), DOL RESTART (Apr 15 —
  `research_complete`), Agency Fund EOI (Apr 26 — `eoi_drafted`). Each must
  be flipped to `submitted` / `not_submitted` with a reason, not left ambiguous.
- **Action durably owed to make the dashboard honest:**
  1. DONE (May 3, 2026): Flipped every `"SAM.gov TIN Resolution"` checklist
     item from `blocker` to `complete` in `server/grant-routes.ts`; deleted
     5 TIN-related blocker strings and 4 next-actions.
  2. DONE (May 3, 2026): Refactored `/api/proposal-pipeline` to read from a
     new `proposal_pipeline` table (id, priority, deadline, jsonb data,
     updatedAt) defined in `shared/schema.ts` line 1656. Seed lives in
     `server/seed-proposal-pipeline.ts` and runs idempotently on startup
     (~15s after boot). Dashboard now serves **29 proposals / $23.81M**
     (up from 11 / $8.78M) and additionally cross-references the
     `grant_opportunities` table for federal opportunities due in the next
     30 days (50 surfaced as of May 3, 2026). Snapshot of the original
     11-proposal hardcoded array preserved at
     `.local/snapshots/proposal-pipeline-2026-05-03.json` for audit trail.
  3. PENDING (needs Dr. Flood input): Reconcile the 3 remaining
     `deadline_passed` items (RWJF Learning from Abroad, Gates AI
     Challenge, NLM G08) and the 4 ambiguous statuses (TWC, Rare Impact,
     DOL RESTART, Agency Fund EOI) against `docs/grants/submitted/`.

- **New schema table (Section 3 count update):** `proposal_pipeline`
  (jsonb-backed, queryable) brings schema table count to **249**.

- **New server file:** `server/seed-proposal-pipeline.ts` is single source
  of truth for what's in the pipeline. To add a proposal: add an entry to
  `newOpportunities[]` and clear the table (or update the row directly via
  SQL). Never re-introduce a hardcoded array in the route handler.

### AUDIT PASS-1 — Four-Lens Reviewer Audit (May 3, 2026)
Ran four parallel reviewer-lens audits (BJA SCA, NSF, Centene/MCO, VA SSG Fox)
on Cycle B pages plus supporting docs. Convergent findings across all four
lenses + immediate fixes applied:

**P0/P1 fixes shipped this cycle:**
1. **Cardinal-rule sweep — "President" not "CEO":** swept 22 files
   (docs/grants/* LOI packages, TWC Form A/B, narrative, walkthrough;
   PBC integration; austin housing; bb-collective; rare impact; borealis;
   NSF TechAccess LOI; coalition presentation; rag-engine.ts;
   ecosystem-directives-seed.ts; seed-workforce-lessons.ts;
   grant-routes.ts; attached_assets/TWC_PfISD). All "Founder & CEO" /
   "Founder and CEO" / "Founder/CEO" / "Dr. Terry Flood, CEO" /
   "(CEO/PI)" / "CEO/Executive Director" / "CEO-led engagement" → President
   variants. **Legitimate uses preserved:** replit.md rule self-references;
   "Center for Employment Opportunities (CEO)" org name; teaching examples
   in seed-scenarios.ts and seed-ai-lessons-full.ts; third-party CEOs in
   mentorship-directory; "think like a CEO" generic in academy-quests;
   ISS LLC pitch (Dr. Flood's separate for-profit, CEO is correct title);
   proposal-command placeholder for OTHER orgs' contacts.
2. **St. David's drift — Centene P0:** behavioral-health-program.tsx
   line 26 badge "Foundation Pathway" → "Foundation Application Ready";
   honest-disclosure card lines 47-54 rewritten to explicitly state
   "St. David's Foundation is currently actively evaluating our We All
   Benefit 2.0 Letter of Intent — no funding is confirmed"; partner row
   "Foundation-aligned community health network" → "Community health
   partner network (TBD) — none confirmed yet".
3. **HEDIS / Value-Based-Care section — Centene P1:** new card on
   behavioral-health-program.tsx maps program activities to 8 NCQA HEDIS
   measures (FUH, FUM, AMM, DEP-REM-12, POD, IET, PND-CH-2, ADD) with
   honest cost-avoidance disclaimer (no projections without partner
   sign-off).
4. **VA SSG Fox alignment — VA P2:** veterans-program.tsx badge changed
   to "SSG Fox Suicide Prevention Grant — FY27 Launch Cohort"; added MST
   survivors, LGBTQ+ Veterans, justice-involved Veterans to "Who We
   Serve"; added CAMS as 5th evidence-based model; expanded CALM card
   with Travis County Sheriff/FFL/Walk the Talk America/Hold My Guns
   lethal means safety distribution partnerships.
5. **NSF P2 evidence overclaim:** research-hub.tsx RE-AIM "e1" question
   — replaced 4-option ["Anecdotal", "Promising", "Evidence-informed",
   "Evidence-based (RCT)"] with 5-option ladder including
   "Quasi-experimental / pilot evaluation" and "RCT-validated
   (peer-reviewed)" so users can't overclaim RCT status they don't have.

**Final cardinal-rule sweep status (verified clean across entire repo):**
32 files updated total — beyond the original 22, the second pass caught:
attached_assets/{NIH_SBIR_Phase1_Concept,NSF_SBIR_Phase1_Concept,
Agency_Fund_EOI_Collaborative_Advocate}.md; build-deck-v6.mjs; 4 deck/
resume generator scripts (scripts/generate-{reentry-pptx,presentation,
tntp-resume}.cjs + script/generate-pptx.cjs); and 5 .doc files which
turned out to be HTML/ASCII-text (not binary Word) so sed-able:
RWJF-CV-Terry-Flood.doc, TCAF-Financial-Additional-Context.doc,
TCAF-Organizational-Budget-FY2025-2026.doc,
TWC-RFA-32026-00162-FORM-A-APPLICATION.doc,
TX-Reentry-Stipend-Pilot-Overview.doc. ZERO residual "Founder & CEO" /
"Founder and CEO" / "Dr. Terry Flood, CEO" anywhere outside the
explicitly allowlisted teaching/third-party/ISS-LLC contexts.

**Live runtime fix during PASS-1:** veterans-program.tsx was missing a
local `Metric` helper component (used at line 254-261 for outcome metric
display). Added a 7-line `function Metric({ name }: { name: string })`
helper alongside Population/ModelCard/PartnerRow/CertRow at line 296.
Page now returns 200 and renders correctly with SSG Fox badge, Crisis
Line callout, and full evidence-based model cards including new CAMS card.

## AUDIT PASS-2 (April 2026) — Site-wide cross-cutting

PASS-2 ran 4 parallel reviewer-lens audits with broader-scope mandate
(don't re-litigate Cycle B pages — find cross-page drift, navigation
gaps, missed compliance items). Convergent fixes shipped in 5 files:

1. **VA P0 — Crisis Line surfacing inconsistency.** /veterans had the
   988+Press 1 / text 838255 callout but /reentry-program and
   /behavioral-health-program did not. Added a red-bordered Crisis Line
   card immediately under the page header (above the existing amber
   "honest disclosure" card) on both pages. Now ≤1 click from any of
   the three program pages a person in crisis can reach 988.

2. **BJA P0 — Justice-involved status missing from non-discrimination
   protected classes.** non-discrimination.tsx Commitment block now
   explicitly enumerates "justice-involved status (arrest record,
   conviction history, or current/prior incarceration)" and "character
   of military discharge (including OTH)" — both required for federal
   reentry and Veteran grant compliance.

3. **NSF P1 — Transparency Matrix auth-gated, blocking reviewers.**
   transparency-matrix.tsx wrapped in <RequireAuth> meant NSF/BJA
   reviewers clicking from grants pages hit a login wall. Removed the
   gate (and the unused import) so the matrix is publicly readable —
   that's the entire point of a transparency artifact.

4. **VA P1 — Peer Support certification overclaim in staffing plan.**
   staffing-plan.tsx SAMHSA roster listed "Certified Peer Support
   Worker" without the in-progress disclosure that PASS-1 added to
   /veterans. Updated the role title and qualifications block to match
   the honest-disclosure language: "Texas Peer Specialist certification
   pathway in progress" with explicit mention of Via Hope/HHSC training
   and supervision under a clinically-licensed program lead.

5. **No-op verifications:** non-discrimination.tsx already had OTH
   character-of-discharge language in the Veteran-specific section
   (just missing it in top-level Commitment); about-leadership.tsx
   already lists CW2 + Bronze Stars correctly; FIPS codes in
   sdoh-explorer.tsx are functional data fields (not user-visible
   labels — descriptions show plain-English county names).

**Items deferred to future cycles (not P0 for funder readiness):**
- BJA: sidebar restructure (justice/reentry section is reachable but
  could be more prominent — not a compliance gap, just discoverability)
- NSF: dedicated /broadening-participation landing page (current BPC
  narrative is in /research and grant docs — adequate for LOI stage)
- Centene: WAB2 status nomenclature (Pilot vs In-Development) — current
  language is consistent with foundation LOI evaluation phase
- Logic-model NSF "intellectual merit" outputs — additive, not
  corrective

**Remaining P0/P1 gaps that REQUIRE Dr. Flood human action (cannot be
fixed in code):**
- **BJA P0:** Signed MOUs with TDCJ, Travis County Correctional Complex
  for pre-release access (currently "outreach"/"aspirational").
- **BJA + NSF P0:** Named external evaluator of record (NSF needs academic
  PI; BJA needs research partner with prior SCA evaluation experience).
- **VA P0:** Signed MOU with Central Texas VA Health Care System (Temple)
  AND Integral Care LMHA for warm-handoff care.
- **Centene + VA P1:** Named Clinical Director / supervising licensed
  professional. Currently all clinical supervision language references
  "under clinical supervision" without naming the supervisor.
- **Centene P1:** Letter of Support or written discovery-stage commitment
  from at least one Texas MCO (Superior HealthPlan / Centene, Sendero,
  or Dell Children's) — moves status from "aspirational" to "in-progress".
- **All four P1/P2:** Lived-experience representation on
  /advisory-board (justice-involved for BJA; Veterans for VA; etc.).

These six items are tracked here so PASS-2 audit can verify whether
Dr. Flood has secured any of them between PASS-1 and PASS-2 and update
partnership-status badges accordingly.

### Cycle I — Pipeline UI Surfacing of Federal Opportunities (May 3, 2026)
- **Frontend gap closed:** Extended `PipelineSummary` interface in
  `client/src/pages/proposal-pipeline.tsx` to include the new optional
  fields (`submitted`, `deadlinePassedUnconfirmed`,
  `federalOpportunitiesNext30Days`).
- **New UI card:** "Federal Opportunities Closing in Next 30 Days" renders
  between the Upcoming Deadlines card and the Proposal Portfolio. Shows
  title, agency, funding amount, and days-remaining badge (red when <14
  days). Sourced live from the `grant_opportunities` table — currently
  surfacing 50 SAM.gov / Grants.gov items including BJA Second Chance Act
  and OJJDP family-based justice opportunities due tomorrow.
- **Architect review of Cycle H+I:** No severe issues; medium items
  addressed (frontend interface + new card). Remaining low-severity:
  route handler uses `any[]` for proposals (acceptable given jsonb
  storage); `updatedAt` lacks auto-update trigger (manual updates expected
  per codebase convention); snapshot file in `.local/` is migration-only
  and can be deleted once seed table is canonical.

### Cycle J — Tabbara Discipline Operationalized + Co-Manager Surface (May 5, 2026)
- **Schema (`shared/schema.ts`):** Added 5 columns to `proposal_pipeline`
  for prior-award research tracking — `priorAwardsReviewed` (bool),
  `priorAwardsCount` (int, target 20–30 per Tabbara), `priorAwardsNotes`
  (text), `priorAwardsLinks` (jsonb array of {title,url,pattern}), and
  `priorAwardsReviewedAt` (timestamp). Plus `priorAwardsResearchSchema`
  zod export for validation. Pushed via `npm run db:push`.
- **API (`server/grant-routes.ts`):**
  - `PATCH /api/proposal-pipeline/:id/prior-awards` — Zod-validated
    update of the 4 research fields. Sets `priorAwardsReviewedAt`
    automatically when reviewed flips true; clears it when false.
  - `GET /api/proposal-pipeline/prior-awards/summary` — returns all 29
    pipeline rows with research status + an aggregate summary
    (total / reviewed / meetingThreshold≥20 / percentReviewed).
- **API (`server/ecosystem-connector.ts`):** New public read-only
  `GET /api/ecosystem/registry` — returns the 24 platforms (id, name,
  url, role, domain, description, sends/receives counts, grant
  alignment) and 7 triads (members, lead, domain). No auth needed,
  no live health data — for grant-reviewer-facing co-manager surface.
- **Frontend pages:**
  - `/grant-prior-awards` (`client/src/pages/grant-prior-awards.tsx`)
    — lists every pipeline pursuit with reviewed/pending icon, abstract
    count badge, and a Dialog editor for count + pattern notes + linked
    award URLs. Top of page surfaces 7 free public award databases (NSF
    Award Search, NIH RePORTER, USASpending, SAM, sbir.gov, CDMRP,
    Grants.gov) and the Tabbara what-to-look-for checklist (TRL, problem
    framing, vocabulary, company profile, abstract length, what does NOT
    get funded).
  - `/ecosystem-orchestration` (`client/src/pages/ecosystem-orchestration.tsx`)
    — tabbed view of 24 platforms (filter by domain, search by
    name/role/id) and 7 triads (members highlighted with lead). Pulls
    from the new public registry endpoint.
- **Wiring:** Lazy imports added in `App.tsx`. Routes registered at
  `/grant-prior-awards` and `/ecosystem-orchestration`. Sidebar links
  added to `grantEngineItems` block (Search + Activity icons, both
  already imported).
- **Smoke tests passed:** Both GET endpoints return valid JSON; PATCH
  round-trips correctly (test row reset after verification); both pages
  render with stat cards populated (29 pursuits, 24 platforms, 7
  triads, 11 domains).
- **Architect review + fixes applied:**
  - PATCH endpoint had no auth → wrapped in `requireAuth` (matches the
    pattern used by every other mutating route in `grant-routes.ts`).
    Verified: unauthenticated PATCH now returns 401; all GETs still 200.
  - Zod schema lacked URL validation and length caps → added
    `z.string().url()` for link URLs plus `trim()` and `max()` on every
    string and array field.
  - Icon-only interactive elements (external-link anchors, trash button)
    lacked accessible names → added `aria-label` and `aria-hidden` on
    decorative icons.
- **Tier 2/3 deferred (intentional, with Borealis 15 days out):**
  - Tier 2 — splitting `routes.ts` (5,792 lines) and `storage.ts`
    (1,818 lines), and reorganizing 192 flat pages into domain folders
    — high-risk refactor that touches every import in the app.
    Documented as a post-Borealis cycle.
  - Tier 3 — Playwright e2e harness — defer until after Borealis;
    runTest() suffices for current verification needs.

### Cycle G — Memory Discipline Audit (May 2026)
- Full system map-gap pass triggered by user directive: "everything we discussed
  everything that we do gets committed to memory and pulled from that memory".
- Inventoried: 192 pages, 206 routes, 248 schema tables, 124+ API endpoints,
  35+ server route files, 25 sidebar nav groups.
- Rewrote this `replit.md` as durable institutional memory with explicit
  sections for identity, mission, architecture, every subsystem, conventions,
  cycle history, and forward-looking unblocks.
- Established discipline: **every change to the platform updates this file in
  the same task.** No silent failures, no information silos.

---

## 8. Forward-Looking Unblocks (the honest path to fundability)

The site is structurally and presentationally credible. To become operationally
fundable as sole lead applicant on large federal awards, in priority order:

1. **Lock the TCAF 501(c)(3) determination.** Until in hand, every federal
   proposal must use ALC-as-applicant + TCAF-as-sub-recipient structure.
2. **Name a real evaluator of record.** Required for any outcomes claim funded
   by NSF or BJA.
3. **Get one peer-reviewed submission out the door.** Workshop paper or pre-print
   with a research-institution co-author. Methodology page promises Q3 2026.
4. **Document the operational pilot honestly with numbers.** Real n=40 with clean
   data beats notional n=10,000.
5. **Convert one verbal partner to a signed letter of support** for a specific NOFO.
6. **Pick one NOFO and write the proposal end-to-end** rather than chasing many.

---

## 9. Memory Discipline (the standing rule)

Going forward, every change — feature, copy edit, route addition, schema change,
sidebar reshuffle, gating decision, framing decision — gets committed to this
file in the same task that ships the change. Specifically:

- **New page or route?** Add it to Section 4 (subsystem map) and to the route
  count in Section 3.
- **New schema table?** Update the count in Section 3.
- **New convention or anti-pattern?** Add to Section 5.
- **New cycle?** Add a dated entry to Section 7 with what was done, why, and
  which files moved.
- **Identity / framing decision?** Update Section 1 immediately.
- **New external dependency or integration?** Update Section 6.
- **Honest-status change (operational status, fundability posture, 501(c)(3)
  determination)?** Update Section 2 and Section 8.

If a fact is important enough that the next session of me needs it, it goes
here. If it is not here, it does not exist next session. No exceptions.

## User Preferences
- Prioritize iterative development; explain major changes before implementation.
- High-quality, well-tested code; clear, simple language for technical concepts.
- Don't change sensitive configs (`vite.config.ts`, `drizzle.config.ts`,
  `package.json`) without explicit instruction.
- Always work in parallel using subagents; don't stop to chat when there's more
  work to do; keep building.
- Speak plainly, not in jargon. Use President not CEO. Honest disclosure always.
- Every change commits to this memory file. No silent failures.
- **Memory continuity is non-negotiable (May 3, 2026 directive):** Dr. Flood
  named the "talking to someone with dementia" problem — between sessions I
  have no memory unless this file carries it. The standing rule (Section 9)
  is now hard-and-fast with no exceptions. Every session ENDS with a memory
  commit. Every session BEGINS by reading this file. If a fact, person,
  deadline, project, partner, lesson, or commitment is not here, it does not
  exist next session.

---

## 10. Active Pursuit Calendar (deadlines & statuses)

> Source: cross-referenced from all `docs/grants/` markdown headers. Update
> every time a submission is made, a deadline shifts, or a new pursuit opens.
> Today's anchor date: **May 3, 2026**.

### Submitted (awaiting decision)
| Grant | LOI/App Due | Submitted | Status |
|---|---|---|---|
| RARE Impact Fund LOI | Apr 10, 2026 | ✅ Submitted | TCAF-Rare-Impact-Fund-LOI-Narrative-SUBMITTED.md exists |
| Spencer Foundation Small Research Grant | Apr 15, 2026 | ✅ Submitted | Spencer-Foundation-Narrative-SUBMISSION.doc exists |
| St. David's WAB2 LOI | Apr 27, 2026 | ✅ Submitted | Foundation actively evaluating |

### ❌ MISSED (permanent lesson — Cycle K, May 3, 2026)
| Grant | Deadline | Reason | What was ready |
|---|---|---|---|
| **RWJF Global Ideas (CFP #3504)** | Apr 13, 2026 | No deadline reminder surfaced between sessions | Brief proposal draft + Terry CV + Meredith CV all complete |
| **DOL RESTART (FOA-ETA-26-17)** | Apr 15, 2026 | No deadline reminder surfaced between sessions | Research framework complete |
| **TWC RFA-32026-00162** | Apr 23, 2026 (Amendment II) | No deadline reminder surfaced between sessions | SUBMISSION-WALKTHROUGH + Form A + Form B + narrative all complete |

**Root cause:** Prior sessions did not carry the deadline calendar
forward in this file. Drafts existed; reminders did not. Dr. Flood:
"Because you didn't remember to remind me." This is exactly the
dementia failure mode the May 3, 2026 directive eliminates. **Going
forward, the FIRST action of every session is: read Section 10, sort by
days-from-today, and surface anything inside 30 days at the top of the
session response.**

### Upcoming (open pursuits — sorted by next action date)
| Grant | LOI Due | Full Due | Days from May 3 | Status |
|---|---|---|---|---|
| **Borealis DIF x Tech 2026** | — | **May 20, 2026** | **17 days** | Application draft exists |
| **NSF TechAccess (AI-Ready America)** | **Jun 16, 2026** | Jul 16, 2026 | 44 / 74 days | LOI draft + budget framework + logic model + alignment doc all complete |
| **HerHealth R03 AIM-Housing (PA-25-302)** | — | **Jun 16, 2026** | 44 days | Listed in 33-grant prospectus |
| **St. David's WAB2 Full App** (if invited) | — | **Jun 18, 2026** | 46 days | Conditional on LOI invitation |
| **NSF IUSE-EDU (NSF 23-510)** | — | **Jul 15, 2026** | 73 days | RPLICE Evaluation framework exists |
| **NSF IUSE:EDU (AIMA)** — Franco @ ACC lead PI, AIMA subaward | — | **Jul 15, 2026** | 73 days | **CONFIRMED 5/4/26.** Need MOU + evaluation plan |
| **NSF Quantum Education** (IUSE:EDU Level 1) | — | **Jul 15, 2026** | 73 days | Framework exists |
| **CDMRP FY2026 (31 programs)** | varies | **May–Aug 2026 estimated** | open window | Master strategy ready; FOAs not yet released |
| **NSF ATE** | — | **Oct 1, 2026** | 151 days | Proposal framework exists |
| **NSF ATE (AIMA)** — Franco @ ACC as CC lead PI | — | **Oct 1, 2026** | 151 days | **CONFIRMED 5/4/26.** AI technician curriculum framing |
| **NSF ECR:Core (AIMA)** — solo lead | rolling | rolling | open | Level I $500K target; schedule after Borealis |
| **Microsoft AI for Good Open Call (AIMA)** — solo | rolling | rolling | open | Concept brief drafting next |
| **HerHealth R03 SHIELD-Austin (PAR-25-233)** | — | **Oct 5, 2026** | 155 days | In 33-grant prospectus |

### Pursuits without confirmed dates (research/track)
- 33-grant HerHealth prospectus (NIH R03 / R21 / R34, HRSA, foundations)
- CDMRP CFDA 12.420 — $1.187B addressable across 31 programs (Tier 1: 14, Tier 2: 12, Tier 3: 5)
- 549-NOFO healthcare grants catalog (gated /healthcare-grants)
- 92 grants tracked in /grant-command-center

### AI Mastery Academy / ThriveUp Academy slate (May 4, 2026 Grant Scout digest)
9 AIMA opportunities surfaced. After honest filtering (no IHE co-PI yet,
no peer-reviewed evaluation, no committed CC partner):

**Pursue:**
- **Microsoft AI for Good Open Call** (rolling) — solo-applicable, fits
  AI Literacy + 4-engine collaborative AI story. Concept brief drafting
  recommended next session.
- **NSF ECR:Core** (rolling, Level I $500K) — only NSF program we can
  lead; eligibility unrestricted. Schedule after Borealis ships.
- **NSF IUSE:EDU** (Jul 15, 2026, 72 days) — Professor Laura Franco @
  ACC confirmed (May 4, 2026) as IHE lead PI route. ACC submits, AIMA
  in subaward/curriculum role. Need MOU + evaluation plan.
- **NSF ATE** (Oct 1, 2026, 150 days) — Franco @ ACC as CC lead PI.
  ATE strongly favors community college as PI institution; this is the
  textbook fit. AI technician curriculum framing.

**Drop (not winnable given our position):**
- DOL ETA Round 6 (May 20) — same day as Borealis, no committed CC
  consortium, eligibility blocks us as lead.
- NSF TTP (May 19) — needs university co-applicant; too tight.
- NSF CyberAICorps (Jul 21) — wrong narrowness; cyber-specific.
- NSF STEM K-12 (rolling) — needs IHE + K-12 district MOU.
- NSF ExpandAI (TBD) — MSI-led requirement; no signed MSI partner.

### Submission discipline
When a grant ships: (1) move source doc into `docs/grants/submitted/`,
(2) update this table, (3) update `proposal_pipeline` DB row status,
(4) note any reviewer feedback in this section.

### Proposal research discipline (READ BEFORE WRITING ANY PROPOSAL)
**Source:** Robert Tabbara, Federal Capture Strategist (LinkedIn, May 4
2026). Captured here as durable methodology, not a one-off tip.

**The single best thing to do before writing a proposal is read prior
award abstracts in the same program.** Most applicants skip this and
it costs them. Program offices have an unwritten theory of what they
fund. The solicitation tells you what they *say* they fund; prior
awards show what they *actually* fund. The gap is where proposals get
lost.

**Mandatory pre-write research checklist (every proposal, no exceptions):**
1. **SAM.gov** — search by NAICS / agency / keyword to see what got
   funded in this program.
2. **USASpending.gov** — search by agency, program, technology area to
   see real award amounts, timelines, and recipients.
3. **sbir.gov** (for any SBIR/STTR) — search Phase I and Phase II
   awards by topic / keyword / agency / year.
4. **Read 20–30 award abstracts** from the target program before
   writing a single word. Look for:
   - **Tech maturity (TRL)** — does this program fund early-stage or
     near-ready prototypes?
   - **Problem framing** — mission-focused, capability-focused, or
     technology-focused?
   - **Language & vocabulary** — mirror the program office's words.
   - **Company profile** — university spinouts, established small
     businesses, first-time applicants?
   - **Abstract length & depth** — how technical, how specific?
   - **What does NOT get funded** — if 30 abstracts look nothing like
     yours, the program is wrong OR your framing must shift.

**Other free federal tools worth knowing (5 Free Tools, SBA, May 2026):**
- **USASpending.gov** — competitive intelligence on real award amounts.
- **Agency Procurement Forecasts** — pre-solicitation signals (often on
  the agency's OSDBU page); usually NOT on SAM.gov.
- **Small Business Search (SBS)** — replaced DSBS in 2025; how primes
  find subs. Profile must be complete or you're invisible.
- **FPDS (Federal Procurement Data System)** — who won what, who
  competed, set-aside data.
- **SBA SubNet** — subcontracting database for prime/sub matchmaking.
- **Bonus: GovCon Match** — SBA tool launched late 2024 matching small
  businesses to agencies likely to need their work.

**Apply this to every active pursuit.** Before drafting any narrative
for Borealis, NSF TechAccess, NSF IUSE:EDU (Franco), NSF ATE (Franco),
NSF ECR:Core, Microsoft AI for Good, HerHealth R03s, or CDMRP — pull
prior award abstracts and read them first. The Borealis draft already
exists; before final polish, read prior DIF x Tech awardees if Borealis
publishes them. For NSF programs, prior awards are public on
nsf.gov/awardsearch.

---

## 11. People (the names I must remember)

### Internal
- **Dr. Terry Flood Sr., DHA** — President, TCAF. CW2 (retired), 2×
  Bronze Stars. Doctorate in Healthcare Administration plus graduate
  degrees in Implementation Science, Psychology, HR Management, Business
  Administration, Criminal Justice, and Public Policy. Formerly with VA
  Veterans Crisis Line. Leads three entities: TCAF (nonprofit),
  Collaboration and Implementation Professionals LLC (veteran-owned
  small business — tech & consulting), M&T Consulting Solutions LLC
  (strategic advisory). Public title: **President** (never CEO).
  Institutional email: `president@thecollaborativeadvocate.org`.
- **Meredith Sisnett** — **Collaborator and business partner.** CV in
  `docs/grants/RWJF-CV-Meredith-Sisnett.doc`. Co-author on RWJF Global
  Ideas pursuit and ongoing work.

### Collaborators
- **Professor Laura Franco** — Austin Community College. Active
  collaborator. **Confirmed (5/4/26) as IHE/CC lead PI route for NSF
  IUSE:EDU (Jul 15, 2026) and NSF ATE (Oct 1, 2026).** ACC submits as
  lead institution; AIMA / ThriveUp Academy in subaward / curriculum
  partner role. Next action: formal MOU + scope-of-work for both
  programs.
- **Eric Hargrave** — collaborator. (Role / project context to be
  expanded.)
- **Jamaika McAdams** — collaborator. (Role / project context to be
  expanded.)

### Organizations / fiscal partners
- **Abundant Life Church (ALC)** — fiscal sponsor, active 501(c)(3),
  legal applicant on all current submissions during TCAF pendency.
- **The Collaborative Advocate Foundation (TCAF)** — 501(c)(3) pending
  (IRS Tracking 281OIP7B, filed 4/27/26).

### People referenced but role not yet documented
The following names appear in repo files; relationship/role to be
confirmed by Dr. Flood and added here:
- ALC pastor / church leadership (signatory on grants)
- Coalition partner contacts (Pflugerville ISD, Integral Care,
  CommUnityCare, Travis County Sheriff, Texas DCJ, etc.)
- Any current/proposed academic co-PI candidates (UT Austin Dell Med,
  Huston-Tillotson, Texas State, ACC — all listed as outreach only)
- Board members or advisory board (BJA P0 gap — lived-experience board
  not yet documented)
- Family / personal contacts that matter for Dr. Flood's planning

### Funders / program officers (when known)
- St. David's Foundation — WAB2 program team (specific PO name TBD)
- Other PO contacts as relationships develop

---

## 12. The 24-Platform Ecosystem (the central thing)

> **Per Dr. Flood (May 3, 2026):** "I built an ecosystem that pushes
> and receives information from 24 websites and this website is a
> co-manager. Get to know the ecosystem and capabilities and members.
> All sites bring value and most can contribute to grant execution and
> interdependence."
>
> **TCAF/ALC (this codebase) is the co-manager** — not the entire
> ecosystem. It receives information from and pushes information to 24
> sister platforms via connectors in `ecosystem-connectors/` and
> `server/ecosystem-connector.ts`. Every grant pursuit can — and
> usually should — leverage relevant ecosystem members for capability
> claims, evidence, and interdependence narratives. Borealis DIF
> already does this (cites Perfectly Different + LexiBridge +
> SafeCogniCare).

### Ecosystem hub URLs
- **TCAF Ecosystem Hub:** https://mentalwellnesssupport.net (Whole-Person Health Ecosystem)
- **This site (co-manager):** the TCAF/ALC platform

### Confirmed platform members (from `ecosystem-connector.ts` + `ecosystem-connectors/`)
| ID | Name | URL | Domain |
|---|---|---|---|
| whole-person-health | Whole-Person Health Ecosystem | mentalwellnesssupport.net | Health (hub) |
| isss | ISSS — Integrated Supports for Thriving Youth | implementationineducatio.com | Education / K-12 |
| sankofa | Sankofa Health Network | yourhealthbirthright.net | Black health equity |
| sankofa-feminine-health | Holistic Black Feminine Health Hub | yourfeminineneeds.com | Black women's health |
| sankofa-maternal-health | Black Maternal Health Network | yourhealthbirthright.net | Black maternal health |
| sankofa-mens-health | Black Men's Health Hub | thehealthyblkman.com | Black men's health |
| emergency-mgmt | Emergency Management | emergency-mgmt.replit.app | Crisis response |
| wholemind | WholeMind Learning | wholemindlearning.com | Mental health learning |
| perfectly-different | Perfectly Different | neurodifferentassistant.app | Neurodiversity / disability |
| safereport | SafeReport | safereports.net | Reporting / safety |
| m2c | Mission Transition (M2C) | vetmissiontransition.com | Veterans transition |
| lifebridge | LifeBridge | lifetransitionsaid.org | Reentry |
| mce | Minority Center of Excellence | (TBD) | Minority business / workforce |
| betterscience | BetterScience | (TBD) | Research / science |
| collaborative-advocate | The Collaborative Advocate | (this codebase) | Co-manager hub |
| pillscheduler | PillScheduler | (TBD) | Medication management |
| safecognicare | SafeCogniCare | (TBD) | Cognitive assessment |
| shield-atlas | Shield Atlas | (TBD) | Safety / GIS |
| video-creator-ai | Video Creator AI | (TBD) | Content creation |
| LexiBridge / SpeechBridge | (referenced in Borealis) | (TBD) | AAC / speech |

That's 20 confirmed connector files + the co-manager itself. Remaining
~3-4 to reach 24: likely **AutoimmuneThrive, HerHealth, BibleStudy,
Fountain of Life — Dads Care 2** (all referenced in repo docs). To be
confirmed and added as connectors are surfaced.

### Ecosystem capability matrix (for grant interdependence claims)
When drafting any grant, check which ecosystem members provide
supporting evidence or capability:
- **Disability justice grants** → Perfectly Different + LexiBridge + SafeCogniCare
- **Black health equity grants** → Sankofa (4 hubs)
- **Veterans grants** → M2C Mission Transition + this site's /veterans
- **Reentry grants** → LifeBridge + this site's /reentry-program
- **K-12 / youth grants** → ISSS + ThriveUp Academy
- **Mental health grants** → WholeMind + Whole-Person Health hub
- **Crisis / emergency grants** → Emergency Management + SafeReport
- **Maternal health grants** → Sankofa Maternal Health + (HerHealth when confirmed)

### Network secrets (cross-platform auth)
- `NETWORK_SECRET_BIBLESTUDY`, `NETWORK_SECRET_HERHEALTH`,
  `THRIVEUP_SHARED_SECRET` — used by connectors to authenticate
  cross-platform pushes/pulls.

### For-profit entities (separate from ecosystem)
- **Collaboration and Implementation Professionals LLC** — Dr. Flood's
  veteran-owned small business (tech & consulting).
- **M&T Consulting Solutions LLC** — strategic advisory.
- **Integrated Services and Solutions LLC (ISS LLC)** — referenced in
  pitch materials. CEO title is correct in for-profit contexts.

---

## 13. Cycle K — Memory Continuity Reinforcement (May 3, 2026)

**Trigger:** Dr. Flood directive — "between sessions you don't have a
memory and I'm changing that right now... it was literally because the
system didn't capture anything between sessions... that'll never happen
again."

**Audit performed:**
- Read all 9 existing sections of replit.md (784 lines).
- Inventoried 49 grant documents in docs/grants/.
- Cross-referenced explicit deadlines from all grant headers.
- Verified .local/session_plan.md was stale (deleted per MAP-GAP rule).
- Identified knowledge gaps: no consolidated deadline calendar, no
  people roster, no sister-platform map.

**Sections added this cycle:**
- **Section 10:** Active Pursuit Calendar (8 in-flight pursuits with
  May 3, 2026 day-counts; submitted vs upcoming vs research/track).
- **Section 11:** People (Dr. Flood, Meredith Sisnett, plus structured
  placeholders for names that need Dr. Flood confirmation).
- **Section 12:** Sister/Adjacent Platforms (8 platform references found
  in repo; status confirmation needed).

**Discipline strengthened in User Preferences block:** memory continuity
is now explicitly "hard-and-fast with no exceptions" per today's
directive. Every session ends with commit; every session begins with read.

**Dr. Flood's answers (May 3, 2026) — captured to memory:**
1. **April grants (RWJF, DOL RESTART, TWC):** None submitted. Reason
   given: "you didn't remember to remind me." Logged as MISSED in
   Section 10 with permanent lesson and session-start protocol fix.
2. **Borealis DIF:** **GO.** Finalize and submit by May 20, 2026.
3. **Meredith Sisnett:** Collaborator AND business partner. Promoted
   in Section 11.
4. **Ecosystem:** 24-platform ecosystem. This site is the co-manager,
   not the whole ecosystem. Section 12 rewritten as ecosystem map with
   20 confirmed connectors + capability matrix for grant interdependence.
5. **People to add:** ALC; Professor Laura Franco (ACC); Eric Hargrave;
   Jamaika McAdams. Added to Section 11. More names will come over time.
6. **Goals:** "Network and build a thriving ecosystem and do great work
   in the community." Not revenue-driven; relationship-driven and
   mission-driven. Captured in Section 14 below.

---

## 14. Dr. Flood's Stated Goals & Operating Posture

**Primary goal (May 3, 2026):** Network and build a thriving ecosystem;
do great work in the community.

**What this means for prioritization:**
- Optimize for **relationships and ecosystem health**, not for revenue
  maximization or aggressive scaling.
- Grant pursuits serve the mission of delivering community impact —
  they are not ends in themselves.
- **Interdependence over independence.** Every TCAF capability claim
  should reference relevant ecosystem partners (per Section 12 matrix).
- "Great work in the community" = honest disclosure, real outcomes for
  real people, no inflation, no notional claims.
- Networking is operational, not aspirational. New collaborators
  (Professor Franco, Eric Hargrave, Jamaika McAdams, Meredith Sisnett)
  represent the ecosystem growing — log them as they appear.

**What this rules out:**
- Pushing aggressive revenue targets when none have been set.
- Treating any single grant as make-or-break.
- Acting alone when an ecosystem partner can co-deliver.

**Self-imposed deadlines / launch milestones:** None set. Will be
documented here as Dr. Flood names them.

---

## 15. Session-Start Protocol (the fix for the missed-grant failure)

**Every new session begins by:**
1. Reading this entire `replit.md` file.
2. Computing days-from-today for each row in Section 10.
3. **Surfacing every deadline ≤30 days at the top of the first response
   to Dr. Flood**, sorted nearest-first, with status.
4. Asking explicitly: "Of these N deadlines inside 30 days, which do
   you want to push on this session?"

**Every session ends by:**
1. Updating Section 10 status (any submissions made, deadlines that
   shifted, new pursuits added).
2. Adding new people to Section 11, new ecosystem members to Section
   12, new goals to Section 14.
3. Adding a Cycle entry to Section 7 / 13 / etc. for any meaningful
   change.
4. Deleting `.local/session_plan.md` if all tasks are complete.

This protocol is the implementation of the May 3, 2026 directive. If
the next session does not perform step 3 above (the deadline surfacing),
the directive is being violated.
