# ThriveUp Academy

## Overview
ThriveUp Academy is a community infrastructure platform — the operating system for how communities support, engage, connect, and serve their people across 6 domains (Criminal Justice, Health Equity, Behavioral Health, Workforce & Business, Education & Learning, Community & Advocacy), 24 platforms, and 4-engine AI. It offers AI mastery curricula, career pathways, mentorship, an AI Creation Studio, entrepreneurship tools, financial literacy, and community engagement features. The platform's core purpose is to connect individuals with grant funding, align with workforce development criteria, and achieve significant community impact through technology and education, addressing critical community needs and fostering economic mobility.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers. CRITICAL: Always work in parallel using subagents. Never stop to have conversations when there is more work to do. Keep building.

## System Architecture
ThriveUp Academy uses a modern web architecture with a React frontend (Vite, Tailwind CSS, shadcn/ui, Wouter, TanStack Query) and an Express.js backend (Node.js, PostgreSQL with Drizzle ORM). Authentication is handled by Replit Auth (OIDC).

Key architectural features and design decisions include:
- **Collaborative AI Intelligence Engine:** A 4-engine parallel synthesis system (Gemini 2.0 Flash, Claude Haiku 4.5, OpenAI GPT-4o-mini, DeepSeek R1) processes every AI output. It integrates RAG knowledge retrieval and implementation science frameworks (RPLICE, CFIR/RE-AIM, MAP-GAP) into prompts, synthesizing responses for consensus. This engine powers chat, navigation, benefits AI, grant drafting, and other AI tools.
- **AI-Powered Learning & Creation:** Features an AI Mastery curriculum, age-adaptive AI companions, and an AI Creation Studio with 10 professional-grade AI tools.
- **Grant Management System:** Includes a Grant Hub with SAM.gov API integration for discovery, AI-powered semantic analysis, fit scoring, readiness checklists, and AI-assisted narrative generation. It offers daily automated grant discovery and a "Team-of-Teams" platform assignment.
- **Workforce Development & Case Management:** Provides reentry and case management dashboards with phase-based plans, intake assessments, milestone tracking, and service delivery records.
- **Community Engagement & Coordination:** Features a Community Partner Network, an interactive Community Intelligence Map, and a Smart Intake Wizard.
- **Outcome Measurement & Reporting:** Offers dashboards aligned with DOJ and SAMHSA metrics, with CSV export and a Continuous Quality Improvement (CQI) engine.
- **Ecosystem Integration Hub:** A 24-platform connected ecosystem with visual mapping, real-time health monitoring, cross-platform event routing, and embeddable integration code generation.
- **Platform Management Systems:** Includes SiteSync Inject for external code fixes, Ecosystem Directives for broadcasting improvements, a Unified Operating System Directive (UOSD) with a Cognitive Elevation Addendum (CEA) for foundational standards, and a Fidelity Report Card System.
- **Mandatory RAG AI Integration:** Enforces RAG AI system integration across all platforms.
- **Program Execution Engine:** A full operational program management system with a 6-step setup wizard, three methodology paths (Implementation Science, Traditional PM, Hybrid), and a real-time Execution Dashboard.
- **RPLICE Implementation Science Toolkit:** Interactive tools for CFIR assessment, RE-AIM scorecards, fidelity checklists, a Quality Gate Dashboard, and AI-Powered Community Analysis streaming live Census ACS data for 9-section RPLICE reports.
- **Agent Communication Layer:** All 24 platforms function as autonomous agents with reasoning-required communication, tracking inter-platform exchanges.
- **Accessibility & Design:** WCAG 2.1 AA compliant, with dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, mobile responsiveness, and a violet/indigo branding system with dark mode.
- **Internationalization:** Supports English and Spanish.
- **4-Layer Congruence Rule:** Ensures synchronization across database schema, backend API, frontend, and public-facing pages.
- **Workforce Readiness Academy (TEKS §127.15):** A complete 15-week, 5-module, 20-lesson, 50-quiz-question employability skills curriculum for CTE grades 9-12. Culturally responsive, phone-first, student-centered design with relatable characters (Jaylen, Aaliyah, Marcus, Sofia, DeAndre), "Real Talk" barrier sections, resume building threaded across all modules, neighborhood champion connections, weekly live virtual check-ins, motivational video postings, and ecosystem tool integrations. Seed file: `server/seed-workforce-lessons.ts`. Landing page: `/workforce-readiness`. Badges: 11 (5 module completion + 5 resume milestones + 1 certificate). PWA download encouraged on Day 1.
- **Proposal Pipeline Dashboard:** Tracks 11 active proposals totaling ~$8.6M, with priority ordering, readiness checklists, deadline countdowns, blocker flags, implementation science lens (CFIR 2.0 + RE-AIM + RPLICE), and win strategies.
- **Outcome Receipts (Donor Surface):** Cryptographically-verifiable receipts that bind a charitable gift to a specific service event in the resident journey. Each event in `residentJourneyEvents` is hashed into a tamper-evident chain (`h_n = sha256(h_{n-1} | event_id | event_type | event_title | occurredAt)`); a receipt cites the event hash + chain position, and any third party can re-derive the chain via `POST /api/donor/verify`. PII is stripped at the receipt boundary (resident shown only as alias, e.g., "Resident #M-2026-001"). Routes: `GET /api/donor/receipt-demo` (live anonymized 3-receipt demo from real cohort), `POST /api/donor/verify` (independent verification). Pages: `/donors` (donor product landing with gift tiers and AI-generated donor brief via the Incubator narrative engine in `mode: "donor"`), `/donor-receipt-demo` (live receipt grid + full chain table). For Donors panel surfaces on `/st-davids`. Files: `server/donor-receipts.ts`, `client/src/pages/donors.tsx`, `client/src/pages/donor-receipt-demo.tsx`. Donor-mode prompt branch added to `POST /api/benefits/coalition/ai-loi`.
- **Security:** All mutation API endpoints require authentication. API keys stored as environment variables (not in config files). Response logging truncated to prevent PII exposure. Shield Atlas branding removed from all public-facing content, replaced with "Emergency Management".
- **Confidence Drift + Autonomy Quadrants:** Tracks earned trust and thinking scores to assess autonomy levels.
- **Capability Orchestration Map:** Maps all 23 platforms to lead/support/validate roles for coordinated execution.
- **Full Curriculum Library:** 60 in-depth lessons across AI Literacy, Workforce Readiness, and Social-Emotional Learning.
- **Conditional Seed Architecture:** Uses targeted conditional seeds for content delivery, preventing data duplication.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini 2.0 Flash, Anthropic Claude Haiku 4.5, OpenAI GPT-4o-mini, Replit AI Integrations GPT-5-nano.
- **Email:** Resend (via Replit connector integration)
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data API, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS.
- **Federal Grants:** SAM.gov API (api.sam.gov).
- **Mapping:** Leaflet + react-leaflet with OpenStreetMap tiles.
- **UI Components:** shadcn/ui.
- **Styling:** Tailwind CSS.
- **Data Fetching:** TanStack Query.
- **Routing:** wouter.
- **Icons:** lucide-react.
- **External Platform Integration:** Student Support Portal (ISSS).
- **5-County Benefits Intelligence System:** Integrates Census ACS data for Travis, Williamson, Hays, Bastrop, and Caldwell counties for benefits enrollment gap analysis, barrier index computation, and eligibility screening.
- **Strategic Intelligence Playbook:** Persistent learning system at `docs/grants/STRATEGIC-INTELLIGENCE-PLAYBOOK.md`. All strategic intel (GovCon risk reduction, grant writing rules, compliance frameworks, partnership leads) is stored in both the RAG knowledge base and this document. Intel flows bidirectionally — user shares information, it gets internalized into RAG chunks, and ecosystem AI systems (Spark, Sparky, Nia, Malik) can reference it. RAG engine currently has 78+ knowledge chunks covering ecosystem operations, grant strategy, partnerships, and compliance intelligence.
- **Gun Violence Registry Integration:** Live API connection to Dr. Flood's National Gun Violence Tracker and Gun Violence Archive national data.
- **Neighborhood Intelligence System:** Flexible location lookup (ZIP code, neighborhood name, street, city — uses Census geocoder + Nominatim fallback), real-time Census ACS data with SVI scoring, up to 10-page PDF reports with full data story, 15-20 slide scripted PPTX presentations, scenario sandbox with "what if" sliders, and up to 20 matched live grants. Email reports with rate limiting and input sanitization. Routes: `/api/neighborhood/lookup`, `/api/neighborhood/scenario`, `/api/neighborhood/report-pdf`, `/api/neighborhood/presentation`, `/api/neighborhood/email-report`.
- **Comprehensive Seed Data:** `server/seed-comprehensive.ts` populates all tables with realistic example data on startup — merch items, participant profiles, service records, grant projects, staffing plans, coalition data, pilot cohorts, benefits intelligence, prevention frameworks, facilitator profiles, and outcome tracking.
- **Cross-Pillar Navigation:** `PillarFlowNav` component (`client/src/components/dfc-cross-nav.tsx`) provides pipeline flow navigation across Community Intelligence → Grant Discovery → Program Designer → Logic Model → Grant Narrative → Outcome Reporting on all 6 pipeline pages.
- **Error Handling:** All mutation `onError` handlers across 24+ pages provide user-facing toast messages with error details (no silent failures).
- **Ecosystem Hub Status:** Platforms show "Fully Integrated", "Linked", or "In Development" status badges based on actual integration state. 16 of 20 platforms are Fully Integrated.
- **FAFSA & Financial Aid Navigator:** `/fafsa-navigator` — AI-powered with 4-engine collaborative advisor. 6-step process visualization, holistic dashboard (estimated aid, scholarship matches, readiness %), FAFSA readiness checklist, award estimator, 12 curated scholarships, financial aid timeline. Example cards with guidance. Cross-links to apprenticeships, benefits, workforce, transition plans.
- **Apprenticeship Tracking System:** `/apprenticeship-tracker` — AI Career Coach with competency gap analysis. DOL RAPIDS-aligned with lifecycle visualization (Pre-Apprenticeship → Journeyworker), holistic dashboard (completion funnel, wage progression, employer engagement), hours logging, O*NET competency tracking, mentor check-ins. Example cards with setup guidance. Cross-links to FAFSA, transition plans, workforce, employers, OY.
- **Opportunity Youth Outreach Dashboard:** `/opportunity-youth` — AI Community Analyst with re-engagement plan generator, outreach strategy creator, and grant narrative writer. 7-step engagement lifecycle, holistic dashboard (population estimates, pipeline conversion, retention rates, barrier heat map), 5-county Census data, barrier assessment, evidence-based strategies. Example cards with guidance. Cross-links to intake wizard, benefits, case management, apprenticeships, transition plans, partners.
- **Postsecondary Transition Plans:** `/transition-plans` — AI Transition Advisor with plan generator, readiness predictor, and support services recommender. 6-step lifecycle, holistic dashboard (readiness scores, college acceptance, credential attainment, WIOA compliance, post-exit employment), ITP builder, college tracker, credential tracker. Example cards with guidance. Cross-links to FAFSA, apprenticeships, workforce, careers, OY, My Journey, benefits.
- **College Access AI Routes:** `server/college-access-ai-routes.ts` — 4 collaborative AI endpoints (FAFSA advisor, apprenticeship coach, OY analyst, transition advisor) using 4-engine parallel synthesis with RPLICE/MAP-GAP frameworks and RAG knowledge retrieval.
- **SVI Analysis Engine:** `GET /api/benefits/svi-analysis` — Computes CDC/ATSDR Social Vulnerability Index scores from live Census ACS data at the census tract level. Analyzes 16 social indicators across 4 SVI themes (Socioeconomic, Household Characteristics, Minority Status, Housing/Transportation). Identifies risk factors (High Poverty, Low Educational Attainment, Language Barrier, etc.) and protective factors (Transportation Access, Insurance Coverage, Employment) per tract. Connects high-vulnerability tracts to nearby low-vulnerability tracts ("Resources Without Borders" — problems don't have borders). Used by SDOH Explorer (Vulnerability Map tab) and Opportunity Youth (Neighborhood Intel tab).
- **SDOH Explorer SVI Tab:** `/sdoh-explorer` → Vulnerability Map tab — Prominent SVI vulnerability score, 4 theme breakdowns, risk factor prevalence analysis, protective factor identification, adjacent community resources, cross-page navigation to Opportunity Youth, Transition Plans, Benefits Screener, Community Map, and Grant Narrative.
- **Opportunity Youth Neighborhood Intel:** `/opportunity-youth` → Neighborhood Intel tab — SVI data surfaced for youth outreach targeting, risk factors with OY-specific explanations (why each factor matters for disconnected youth), protective factors with implementation science notes on how to leverage them, high-vulnerability tract table with "Design Outreach Strategy" AI integration, adjacent resources, cross-page links.
- **Grant Command Center:** `/grant-command-center` — 92 grants tracked across all ecosystem platforms including 31 CDMRP programs ($1.187B addressable, CFDA 12.420). CDMRP organized by tier: Tier 1 (14 programs, ~$890M — submit to all), Tier 2 (12 programs, ~$245M — submit 3-4 strongest), Tier 3 (5 programs, ~$52M — concept awards only). All grants have submit portal buttons, criteria in notes, and linked strategy documents. Grant docs at `docs/grants/`. Key docs: `CDMRP-FY2026-Master-Grant-Strategy.md`, `HerHealth-33-Grant-Opportunities-Prospectus.md`, `GRANT-OPPORTUNITY-CRITERIA-MATRIX.md`, `ECOSYSTEM-COMPLETE-PLATFORM-REFERENCE.md` (all 24 platforms, 70 HerHealth conditions, screening tools, data collection, CDMRP topic matching).
## Funder Readiness Cycles — Apr–May 2026

The site was put through 4 disciplined cycles + 1 architect audit pass to lift it from
"unfundable" to A/A− across BJA, NSF, Centene, and VA reviewer lenses. Cardinal rules
applied site-wide:

- **Real, not notional** — every number, partnership, and capability disclosed at its honest
  status (operational / pilot / in-development / exploratory).
- **Plain English, no acronym fog** — FIPS labels relabeled "Census Code", ACOS / RPLICE /
  MAP-GAP defined on first use.
- **No FIPS-as-jargon to users** — internal data structures preserved; user-visible labels
  rewritten.
- **"President" not "CEO"** — TCAF is a 501(c)(3) (pending), not a for-profit.
- **St. David's "actively evaluating"** — never claimed as awarded.
- **Institutional email placeholders** — `president@thecollaborativeadvocate.org` and
  `programs@thecollaborativeadvocate.org` (not personal Gmail).

### Cycle deliverables
- **Cycle A** (Honesty & Identity): `/about` (ALC + TCAF dual-org card, IRS Tracking
  281OIP7B), `/non-discrimination`, footer transparency note, `PartnershipStatus` 7-stage
  badge component, site-wide CEO→President + Gmail→institutional sweep.
- **Cycle B** (Agency Targeting): `/veterans` (VA SSG Fox), `/behavioral-health` (Centene +
  St. David's), `/reentry-program` (BJA SCA), `/research` (NSF intellectual merit). Each
  page evidence-based with honest disclosure banner + partnership pathway.
- **Cycle C** (Structure & Plain English): sidebar restructured to 8 public pillars
  (Texas Pilot · Programs · Grant Engine · Research · Community Intel · Workforce ·
  Justice · Partnerships) with admin-gated operations sections (only shown when
  `isAdmin`). Healthcare-grants reframed: NOFO ranges + honest disclosure banner.
- **Cycle D** (Evidence & Polish): `/transparency-matrix` (4-status × 3-category grid),
  `/stakeholder-map` (29 stakeholders × 6 categories with PartnershipStatus stages),
  `/open-innovation-lab` (reframes sandbox/dev surface).
- **Audit Pass**: P0/P1 punch-list executed — `paypal.me/TERRYFLOODCEO` references hidden
  from visible labels in pricing surfaces, and replaced in business-document templates;
  `Dr. Terry Flood, CEO` → `President` in funder-facing grant-packages copy; FIPS labels
  relabeled to "State Census Code" / "County Census Code" in rplice-tools and
  justice-command-center; `$15M+ Pipeline Value` replaced with NOFO-range tracking.

### Key files added/modified
- `client/src/pages/about-leadership.tsx`, `client/src/pages/non-discrimination.tsx`
- `client/src/pages/veterans-program.tsx`, `client/src/pages/behavioral-health-program.tsx`,
  `client/src/pages/reentry-program.tsx`, `client/src/pages/research-methodology.tsx`
- `client/src/pages/transparency-matrix.tsx`, `client/src/pages/stakeholder-map.tsx`,
  `client/src/pages/open-innovation-lab.tsx`
- `client/src/components/partnership-status.tsx` (7-stage `PartnershipStage` type +
  `<PartnershipStatusLegend>`)
- `client/src/components/app-sidebar.tsx` (8-pillar restructure with admin gating)
- `client/src/pages/healthcare-grants.tsx` (honest-disclosure banner + NOFO reframe)
