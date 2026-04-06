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
- **Proposal Pipeline Dashboard:** Tracks 8 active proposals (4 NSF + TWC + RARE Impact Fund + DOL RESTART + St. David's WAB2) totaling $7.6M, with priority ordering, readiness checklists, deadline countdowns, blocker flags, implementation science lens (CFIR 2.0 + RE-AIM + RPLICE), and win strategies.
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
- **Gun Violence Registry Integration:** Live API connection to Dr. Flood's National Gun Violence Tracker and Gun Violence Archive national data.
- **Comprehensive Seed Data:** `server/seed-comprehensive.ts` populates all tables with realistic example data on startup — merch items, participant profiles, service records, grant projects, staffing plans, coalition data, pilot cohorts, benefits intelligence, prevention frameworks, facilitator profiles, and outcome tracking.
- **Cross-Pillar Navigation:** `PillarFlowNav` component (`client/src/components/dfc-cross-nav.tsx`) provides pipeline flow navigation across Community Intelligence → Grant Discovery → Program Designer → Logic Model → Grant Narrative → Outcome Reporting on all 6 pipeline pages.
- **Error Handling:** All mutation `onError` handlers across 24+ pages provide user-facing toast messages with error details (no silent failures).
- **Ecosystem Hub Status:** Platforms show "Fully Integrated", "Linked", or "In Development" status badges based on actual integration state. 16 of 20 platforms are Fully Integrated.
- **FAFSA & Financial Aid Navigator:** `/fafsa-navigator` — 6-step wizard with aid type explainers, readiness checklist, award estimator by income/school type, 12 curated scholarships, and financial aid timeline.
- **Apprenticeship Tracking System:** `/apprenticeship-tracker` — Full DOL RAPIDS-aligned apprenticeship management with hours logging, competency tracking (O*NET), mentor check-ins, wage progression, and employer partner dashboards (H-E-B, Austin Energy, Samsung, Capital Metro, Goodwill).
- **Opportunity Youth Outreach Dashboard:** `/opportunity-youth` — 5-county OSY population estimates (Travis, Williamson, Hays, Bastrop, Caldwell), outreach pipeline (Identification → Contact → Engagement → Enrollment → Retention), barrier assessment tool, evidence-based re-engagement strategies, and case tracking with 30/60/90 day retention.
- **Postsecondary Transition Plans:** `/transition-plans` — Individual Transition Plan (ITP) builder, college application tracker, credential attainment tracking, scored readiness assessment (Academic/Career/Personal-Social), support services mapping, and 12-month WIOA-aligned post-exit follow-up tracking.