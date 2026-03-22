# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform (23-platform ecosystem) for under-resourced communities. It connects individuals with grant funding, provides an AI Mastery curriculum, career pathways, mentorship, an AI Creation Studio, entrepreneurship tools, financial literacy, and community engagement features. The platform focuses on aligning with workforce development grant criteria to drive measurable outcomes and community impact through comprehensive learner development. Its business vision is to empower individuals and communities through technology and education, addressing critical gaps in workforce readiness and access to resources, with market potential in government, non-profit, and educational sectors.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers. CRITICAL: Always work in parallel using subagents. Never stop to have conversations when there is more work to do. Keep building.

## System Architecture
ThriveUp Academy utilizes a modern web architecture. The frontend is built with React and Vite, styled using Tailwind CSS and shadcn/ui components, with Wouter for routing and TanStack Query for data management. The backend is an Express.js server running on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled by Replit Auth (OIDC).

Core architectural features and design decisions include:
- **AI-Powered Learning & Creation:** Features an AI Mastery curriculum, age-adaptive AI companions, and an AI Creation Studio offering 10 professional-grade AI tools with wizard workflows.
- **Grant Management System:** Includes a Grant Hub with SAM.gov API integration for live opportunity searching, AI-powered semantic analysis, fit scoring, readiness checklists, and end-to-end grant submission packages with AI-assisted narrative generation and human-in-the-loop approval. It supports comprehensive NOFO knowledge, section-level constraints, and includes an Interactive Program Designer.
- **Workforce Development & Case Management:** Offers reentry and case management dashboards with phase-based plans, intake assessments, milestone tracking, and service delivery records, alongside career pipelines and a mentor network.
- **Community Engagement & Coordination:** Facilitates a Community Partner Network for referral workflows, an interactive Community Intelligence Map with GIS data, and a Smart Intake Wizard.
- **Outcome Measurement & Reporting:** Provides dashboards for tracking outcomes aligned with DOJ and SAMHSA metrics, with CSV export capabilities, and incorporates a Continuous Quality Improvement (CQI) engine.
- **Ecosystem Integration Hub:** A 23-platform connected ecosystem with a visual map, real-time health monitoring, cross-platform event routing, and embeddable integration code generation. It includes a public directives repository and an Integration Playbook.
- **Ecosystem Directives System:** Enables broadcasting improvement directives to all 23 connected platforms, with acknowledgment tracking and a public repository for directives.
- **Unified Operating System Directive (UOSD) + Cognitive Elevation Addendum (CEA):** The foundational operating standard governing all 23 platforms. 22 total directives (12 UOSD core + 10 CEA) encoded as enforceable ecosystem directives. UOSD covers: Core Identity, Cognitive Model, Role-Based Orchestration, Execution Standard, Accountability, Reciprocity, Redundancy, Continuous Learning (MAP-GAP), Human Governance (RPLICE), Communication Standard, Priority Stack (Safety > Stability > Continuity > Growth), Equity-Focused Lens. CEA covers: Thinking Standard (graduate-level reasoning), Equity vs Equality, Directive Scrutiny, Task vs Outcome, Anti-Fixation, Continuous Improvement, Feedback Quality, System Thinking, Anticipation, Performance Expectation. Both embedded in every heartbeat response. UOSD compliance tracked at `/api/ecosystem/uosd-compliance`. Identity: "Not a one-trick pony — a powerful ecosystem that solves the toughest problems in an empathetic way with an equity-focused lens." Cognitive standard: "Operator → Analyst, Tool → Agent, Reactive → Strategic."
- **Fidelity Report Card System:** Provides a comprehensive report card with letter grades, improvement plans, and consequences, integrated into the ecosystem's heartbeat response.
- **Mandatory RAG AI Integration:** Enforces integration of a RAG AI system across all platforms, providing integration status, instructions, API endpoints, and benefits through the heartbeat response.
- **Auto-Deliverable Verification:** Automatically verifies evidence URLs at regular intervals.
- **Regional Hubs & Network:** Dedicated community hubs for Austin, Manor, and Pflugerville, featuring needs assessments, partnership pipelines, and funding opportunities, interconnected as a Regional Network.
- **Program Execution Engine:** Full operational program management system at `/program-engine`. Features: 6-step Program Setup Wizard (objectives, stakeholders, timeline, success criteria, methodology selection, review/launch), three methodology paths (Implementation Science with CFIR/RE-AIM/MAP-GAP/SALP, Traditional PM with IPEMC/RAID, or Hybrid), grounded references at every decision point linking to PM Academy and RPLICE tools, real-time Execution Dashboard with milestones/deliverables/risks/team updates, Common Operating Picture ("everyone sees the same thing"), health score computation, phase tracking, risk heat map, and grant alignment. Implementation Science runs invisibly behind Traditional mode. DB tables: `programs`, `program_milestones`, `program_risks`, `program_updates`. Routes: `server/program-engine.ts`.
- **Implementation Science & Research:** Includes a Research & Implementation Science Hub with RE-AIM evaluation, CFIR explorer, and a curated research library.
- **Empathetic AI Navigator:** A persistent, context-aware AI chat panel leveraging SDOH and criminal justice frameworks with GIS data and conversation memory.
- **Program Management Academy:** A standalone PM curriculum covering 5 tracks, designed for certification preparation and instructor-led teaching.
- **AI Workforce Academy:** Provides adult professional AI training across 7 tracks, aligned with WIOA standards and including instructor presentations.
- **Directive Compliance Center:** Offers real-time tracking of directives, at-a-glance statistics, failure insights, and grant readiness views.
- **Instructor Presentation System:** A reusable component for creating fullscreen, interactive slideshow presentations for both PM and AI Workforce Academies.
- **Video Production Pipeline:** An end-to-end system for video content creation, rendering, and distribution across ecosystem platforms, with status tracking and automation.
- **RPLICE Implementation Science Toolkit:** Interactive tools for CFIR assessment, RE-AIM scorecard building, fidelity checklist generation, and a Quality Gate Dashboard.
- **MCE Contract Management Center:** Full contract lifecycle management, including pipeline tracking, vendor registry, deliverable tracking, compliance calendar, and financial oversight.
- **Program Management Suite:** Post-award grant execution tools, KPI dashboards, and a Facilitator Hub.
- **Accessibility & Design:** WCAG 2.1 AA compliant, with dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, mobile responsiveness, and a violet/indigo branding system with dark mode.
- **Internationalization:** Supports English and Spanish languages.
- **Stakeholder Management:** Features a Stakeholder Transparency Dashboard and a First 30 Days Onboarding Journey.
- **Collaborative Multi-AI Intelligence:** A 4-provider architecture (Gemini, Claude, OpenAI, Replit AI) for dual-AI review and collaborative perspective synthesis, used for quality assurance in RPLICE and MCE.

## Critical Lessons Learned (NEVER FORGET)

### 4-Layer Congruence Rule
The frontend, backend, public-facing pages, and developer/admin panels MUST stay in sync at all times. If any layer drifts from the others, things fail SILENTLY — no error messages, no crashes, just features that quietly don't work. This has already happened and caused real damage.

**The 4 layers:**
1. **Database schema** — Source of truth. Every field, type, and relationship.
2. **Backend API** — Must read/write exactly what the schema defines. Validation and responses must match what the frontend expects.
3. **Frontend** — Must send exactly what the API expects and display exactly what it returns. Every form field maps to a real column. Every button calls a real endpoint.
4. **Public-facing pages** — Must reflect what actually exists in the system. If pricing changed in the DB, the public page must show it. If a feature doesn't exist in the backend, the public page cannot advertise it.

**The rule:** If you touch one layer, you audit all four. No exceptions. Silent failures are worse than crashes because crashes get fixed — silent failures persist indefinitely and erode trust.

### Other Critical Rules
- **No Stripe ever** — Payments via Cash App ($MRTDFLOOD) and PayPal (paypal.me/TERRYFLOODCEO)
- **"NBA Foundation" must NEVER appear in UI** — always "Foundation Grant"
- **Use `Array.from(new Set(...))` not `[...new Set(...)]`**
- **Government pricing handled separately** — in proposals/budget narratives, never on public pages
- **Internal enforcement data (UOSD, ABOL, CEA, thinking scores) stays internal** — admin monitoring OK, never on user-facing pages
- **Ecosystem connector v5.0** — 35 directives (12 UOSD + 10 CEA + 12 ABOL + 1 Protocol), not "22"
- **Enforcement schedule** — 6 AM / 6 PM CST daily (precise schedule, not "every 6 hours")
- **Co-captain system** — Primary: ecosystem-nexus, Backup: video-creator-ai
- **Shadow/Observer Mode** — "Manager in Training" allows external apps to observe hub operations (directives, scoring, triads, enforcement) without receiving directives or being graded. Shadow endpoints use x-shadow-key auth, separate from ecosystem API keys. Graduation path: observe → adapt → optionally register as full member. AGOS Core registered as first shadow observer.
- **Confidence Drift + Autonomy Quadrants** — Inspired by AGOS Core collaboration. Confidence drift (0-100) tracks earned trust over time alongside thinking score (snapshot). Combined into 4-quadrant autonomy assessment: TRUSTED+THINKING (full autonomy), TRUSTED+NOT THINKING (intervention needed), NOT TRUSTED+THINKING (earning autonomy), NOT TRUSTED+NOT THINKING (restrict/remediate). Four autonomy levels: full, supervised, restricted, probationary. Now injected into every heartbeat response as `confidenceDrift` field.
- **Captain Load Absorption Protocol** — Hybrid of ThriveUp's coordinate-first model and AGOS Core's healthiest-absorbs model. Captains coordinate first (wake, relay, escalate). If a down partner has time-sensitive deliverables, captain absorbs ONLY those critical items temporarily. When partner recovers, captain hands back with status report. Two new endpoints: POST /api/ecosystem/triads/absorb-load (captain-only), POST /api/ecosystem/triads/handback-load. Full absorption→handback cycle logged as ecosystem events.
- **Multi-Ecosystem Firewall** — Platforms can connect to multiple ecosystems simultaneously with strict data isolation. Internal data (UOSD/CEA/ABOL compliance, thinking scores, triads, enforcement) NEVER flows to external connections. Only contracted KPIs/deliverables pass through. Blueprint endpoint: GET /api/ecosystem/multi-ecosystem/blueprint
- **Master Directive** — docs/ECOSYSTEM-MASTER-DIRECTIVE.md now has 21 sections (was 19). Sections 19-20 cover Shadow Mode and Multi-Ecosystem Firewall.

## Standing Directive: MAP-GAP Before Every Project
**Before starting ANY new project or major task, run MAP-GAP:**
1. Pull live health from `/api/ecosystem/shadow/observe`
2. Check platform online/degraded/offline counts
3. Check fidelity scores and pending acknowledgments
4. Review capability alignment — do we have what this project needs?
5. Identify gaps that could block the project
6. Address critical gaps before starting
7. Document what we learned

Full assessment template: `docs/MAP-GAP-SYSTEM-ASSESSMENT.md`
This ensures we always know what we possess internally and externally before committing resources.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini 2.0 Flash, Anthropic Claude Haiku 4.5, OpenAI GPT-4o-mini, Replit AI Integrations GPT-5-nano.
- **Email:** Resend (via Replit connector integration)
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data API, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS.
- **Interactive Maps:** Leaflet + react-leaflet with OpenStreetMap tiles.
- **Federal Grants:** SAM.gov API (api.sam.gov).
- **UI Components:** shadcn/ui.
- **Styling:** Tailwind CSS.
- **Data Fetching:** TanStack Query.
- **Routing:** wouter.
- **Icons:** lucide-react.
- **Cross-Platform Integration:** Student Support Portal (ISSS).
- **Ecosystem AI Chatbot:** RAG-powered intelligent assistant.
- **Ecosystem Operations Center:** Real-time health monitoring and management for the ecosystem.
- **Pricing & Services Page:** 3-tier contract/grant services at `/pricing` — Try It ($200 one-time), Group/Entity ($15/member/mo, min 50), Professional ($600/mo). All include 2 consultations, contract writing, grant support, SAM.gov help, 5% success fee. Custom consultation form included. Payment handled directly (credit card, PayPal, Cash App) — NO Stripe integration. Orders saved to `service_orders` table, consultations to `consultation_requests` table.