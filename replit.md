# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform designed for under-resourced communities. It offers AI mastery curricula, career pathways, mentorship, an AI Creation Studio, entrepreneurship tools, financial literacy, and community engagement. The platform aims to connect individuals with grant funding, align with workforce development criteria, and achieve significant community impact through technology and education.

## Founder / PI Credentials — Dr. Terry Flood (VERIFIED FROM TRANSCRIPTS)

### Doctoral Degrees
- **DHA (Doctor of Healthcare Administration)** — Virginia University of Lynchburg
- **DBA (Doctor of Business Administration)** — Virginia University of Lynchburg

### Master's Degrees
- **MS, Industrial-Organizational Psychology** — Walden University, Conferred 02/02/2024, 4.0 GPA, General Practice specialization. Coursework: Themes & Theories of I/O Psych, Consulting for Organizational Development & Change, Psychology of Organizational Behavior, Ethics/Values/Legal Issues in I/O Psych, Personnel Psychology in the Workplace, Leadership & Leader Development, Research Theory/Design/Methods, Quantitative Reasoning & Analysis, Capstone. ALL A's.
- **MS, Implementation Science (In Progress)** — Dartmouth College, Geisel School of Medicine. Fall 2025 completed (HP/P grades): Foundations of ImpSci, Intro Study Design & Data Analysis, Application of Theory/Models/Frameworks, Experimental Designs, Climate & Health. Winter 2026 (in progress): Implementation & De-Implementation Strategies, Qualitative & Mixed-Methods in Impl Research, Ed/Comm Research & State Services, Measuring IS Context/Process/Outcome. Spring 2026 (in progress): Behavior Interventions Scaling Up/Out, Evaluation of Experimental Trials Including Cost, UC Design Applications, Fidelity/Adaptation/Sustainability of EBI. Capstone IMPACT Project spans all 3 terms.
- **MS, Human Resource Management** — Walden University
- **MS, Criminal Justice (Public Policy)** — Walden University
- **MBA, Leadership** — South University

### Undergraduate & Certificates
- **Graduate Certificate, Business Analytics** — Texas A&M University
- **BS, Healthcare Management** — South University

### Professional Certifications (VERIFIED)
- **168-Hour Community Health Worker Instructor Certification** — UNT Health Science Center (DSHS Site #73), DSHS-Certified, completed 03/02/2023–06/22/2023. 8 competency areas: Communication, Interpersonal, Service Coordination, Capacity-Building, Advocacy, Teaching, Organizational Skills, Knowledge Base. (NOTE: cert has EXPIRED — frame as "access to certified CHW instructors in professional network")
- **Stanford University School of Medicine: AI Series — Introduction to Healthcare** — 12.00 AMA PRA Category 1 Credits, completed 06/28/2024
- **Federal Grants & Agreements Management** — Pre-Award (GRT 0020), Award Phase (GRT 0030), Post-Award (GRT 0040), all completed 07/26/2024
- **Contracting Officer's Representative (COR) Level 1** (FCR 110) — 8 CLPs, completed 07/25/2024
- **R&D Processes & Programs** (CON 0210) — completed 07/26/2024
- **Legal Considerations for R&D Instruments** (CCON 021) — completed 07/26/2024
- **Federally Funded Research & Development Centers** (ACQ 0800) — completed 07/26/2024
- **FEMA Emergency Management:** ICS-100.C, ICS-200.C, IS-700.B (NIMS), IS-800.D (National Response Framework) — all July 2024
- **TEEX/DHS CBRNE:** Basic EMS Concepts for Chemical, Biological, Radiological, Nuclear, and Explosive Events — July 2024

### Federal Service
- **Public Health Social Scientist** — VA + DoD (2017–present)
- **Community Readiness & Resilience Implementer (CR2I) Advisor** — Department of Defense (2021–2023)
- **Trainer, Veterans Crisis Line (VCL)** — U.S. Department of Veterans Affairs (current)

### Military
- **U.S. Army Warrant Officer (Retired)**

### Leadership Roles
- Founder & CEO, The Collaborative Advocate Foundation (TCAF)
- Pflugerville ISD SHAC member

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers. CRITICAL: Always work in parallel using subagents. Never stop to have conversations when there is more work to do. Keep building.

## System Architecture
ThriveUp Academy utilizes a modern web architecture. The frontend is built with React, Vite, Tailwind CSS, shadcn/ui, Wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node.js with a PostgreSQL database managed by Drizzle ORM. Authentication is handled by Replit Auth (OIDC).

Core architectural features and design decisions include:
- **Collaborative AI Intelligence Engine (`server/collaborative-ai.ts`):** 4-engine parallel synthesis — Gemini 2.0 Flash, Claude Haiku 4.5, OpenAI GPT-4o-mini, DeepSeek R1 — ALL fire simultaneously on every AI output. RAG knowledge retrieval, RPLICE implementation science (CFIR/RE-AIM), and MAP-GAP continuous improvement frameworks are injected into every prompt. A synthesis engine merges all responses into consensus. Status: `GET /api/collaborative-ai/status`. Integrated into: Spark/Sparky chat, Navigator, Benefits AI, Grant drafting/refinement, AI Tools, and all streaming endpoints. Previous fallback-only architecture replaced with true collaborative multi-engine synthesis.
- **AI-Powered Learning & Creation:** Features an AI Mastery curriculum, age-adaptive AI companions, and an AI Creation Studio with 10 professional-grade AI tools.
- **Grant Management System:** Includes a Grant Hub with SAM.gov API integration for discovery, AI-powered semantic analysis, fit scoring, readiness checklists, and AI-assisted narrative generation. It performs daily automated grant discovery and offers a "Team-of-Teams" platform assignment. A Funder & Collaborator Pipeline distinguishes relationship types and maps bilateral value exchange propositions across six domains.
- **Workforce Development & Case Management:** Provides reentry and case management dashboards with phase-based plans, intake assessments, milestone tracking, and service delivery records.
- **Community Engagement & Coordination:** Features a Community Partner Network, an interactive Community Intelligence Map, and a Smart Intake Wizard.
- **Outcome Measurement & Reporting:** Offers dashboards tracking outcomes aligned with DOJ and SAMHSA metrics, with CSV export and a Continuous Quality Improvement (CQI) engine.
- **Ecosystem Integration Hub:** A 24-platform connected ecosystem with visual mapping, real-time health monitoring, cross-platform event routing, and embeddable integration code generation.
- **SiteSync Inject System:** Allows external platforms to push code fixes for review and approval.
- **Ecosystem Directives System:** Broadcasts improvement directives across all 23 platforms with acknowledgment tracking.
- **Unified Operating System Directive (UOSD) + Cognitive Elevation Addendum (CEA):** Foundational operating standards governing all platforms.
- **Fidelity Report Card System:** Provides report cards with grades and improvement plans.
- **Mandatory RAG AI Integration:** Enforces RAG AI system integration across all platforms.
- **Auto-Deliverable Verification:** Automatically verifies evidence URLs.
- **Regional Hubs & Network:** Dedicated community hubs in Austin, Manor, and Pflugerville.
- **Program Execution Engine:** A full operational program management system with a 6-step setup wizard, three methodology paths (Implementation Science, Traditional PM, Hybrid), and a real-time Execution Dashboard.
- **RPLICE Implementation Science Toolkit:** Interactive tools for CFIR assessment, RE-AIM scorecards, fidelity checklists, Quality Gate Dashboard, and AI-Powered Community Analysis, which streams live Census ACS data and external research to produce 9-section RPLICE reports. Includes an Activation Pipeline for grant narrative generation, community action planning, and outcome baseline tracking.
- **Agent Communication Layer:** All 24 platforms function as autonomous agents with reasoning-required communication, tracking inter-platform exchanges and enabling targeted or broadcast communication, responses, and strategic reasoning.
- **Ecosystem Integration Guide:** Provides instructions for DeepSeek Strategic Reasoning, RPLICE Framework integration, MAP-GAP Cycle instructions, interdependent communication protocols, and grant coordination guidelines.
- **Accessibility & Design:** WCAG 2.1 AA compliant, with dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, mobile responsiveness, and a violet/indigo branding system with dark mode.
- **Internationalization:** Supports English and Spanish.
- **Collaborative Multi-AI Intelligence:** A 4-provider AI architecture (Gemini, Claude, OpenAI, Replit AI) for dual-AI review and perspective synthesis.
- **4-Layer Congruence Rule:** Ensures synchronization across database schema, backend API, frontend, and public-facing pages.
- **Shadow/Observer Mode:** Allows external applications to observe operations.
- **Ecosystem Cross-Evaluation & Self-Audit:** Weekly/on-demand peer review and automated self-audits for continuous improvement.
- **Bilateral Collaboration Exchange:** Automated daily exchange of intelligence, changes, lessons, and questions.
- **TEKS §127.15 CTE Employability Skills Alignment:** Full alignment map and API endpoint for structured JSON alignment data, offering a verifiable Workforce Readiness Certificate.
- **Confidence Drift + Autonomy Quadrants:** Tracks earned trust and thinking scores to assess autonomy levels.
- **Capability Orchestration Map:** Maps all 23 platforms to lead/support/validate roles for coordinated execution.
- **Full Curriculum Library:** 60 in-depth lessons across AI Literacy, Workforce Readiness, and Social-Emotional Learning, complete with multi-thousand-word instruction and interactive activities.
- **Conditional Seed Architecture:** Uses targeted conditional seeds for content, preventing data duplication while ensuring all necessary content is present.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini 2.0 Flash, Anthropic Claude Haiku 4.5, OpenAI GPT-4o-mini, Replit AI Integrations GPT-5-nano.
- **Email:** Resend (via Replit connector integration)
- **Authentication:** Replit Auth (OIDC)
- **Gun Violence Registry Integration:** Live API connection to Dr. Flood's National Gun Violence Tracker and Gun Violence Archive national data.
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
- **Ecosystem Operations Center:** Real-time health monitoring and management.
- **5-County Benefits Intelligence System:** Benefits enrollment gap analysis covering Travis, Williamson, Hays, Bastrop, and Caldwell counties for St. David's Foundation "We All Benefit 2.0" ($35M/3yr). Features Census ACS data ingestion (501 tracts), barrier index computation, facilitator/partner mapping, CHW network management, virtual eligibility screening, HHSC Community Partner Program pathway, 3-year enrollment targets, and outreach strategy generation. Tables: `benefitsEnrollmentData`, `benefitsPartners`, `benefitsChwNetwork`, `benefitsScreenings`, `benefitsRenewals`. Routes: `/benefits-command-center`, `/benefits-screener`, `/coalition`, `/loi-writer`. API: `server/benefits-routes.ts`. Key AI endpoints: `ai-insight` (RAG+Census), `ai-exec-summary` (7-page summary), `ai-collab-match` (partner matcher), `ai-loi` (500-word LOI writer), `rplice-validation` (CFIR 2.0 + RE-AIM scoring). Generated documents: `TCAF_WeAllBenefit_Executive_Summary.md`, `TCAF_WeAllBenefit_LOI_Draft.md`.
- **SDOH Impact Chain — Nationwide Dynamic SOP:** The SDOH Impact Chain is TCAF's standard operating procedure for telling the #DATA story — EVERY time, EVERY region. The dynamic endpoint (`/api/benefits/sdoh-impact-chain/live?state=XX&counties=YYY`) pulls live Census ACS tract-level data for ANY U.S. counties and produces the full 6-link chain: (1) Poverty & Low Income → (2) Education Gaps → (3) Benefits Enrollment Gap → (4) Health & Food Insecurity → (5) Social Isolation & System Distrust → (6) Crime & Community Safety. Every analysis includes: Three Realities Framework (Research vs Political vs Ground Truth), Crime-Education Correlation, intervention mapping at each link, worst-tract identification, income gap calculation, and breaking points. NEVER present county averages without tract-level truth. Crime is the DOWNSTREAM OUTCOME; education is the #1 PROTECTIVE FACTOR. The `SDOHImpactChain` component accepts `stateCode` and `countyCodes` props to dynamically generate chain analysis for any selected region in the SDOH Explorer. SOP documented at `docs/RPLICE-Data-Science-SOP.md`.