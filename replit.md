# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform designed for under-resourced communities. Its core purpose is to connect individuals with grant funding opportunities and deliver measurable outcomes through coordinated service delivery. The platform offers an AI Mastery curriculum, career pathways, professional mentorship, an AI Creation Studio with professional-grade AI tools, an entrepreneurship ecosystem, a virtual campus, financial literacy education, and community engagement tools. It aims to align with workforce development grant criteria and support comprehensive learner development.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers.

## System Architecture
The application uses a modern web architecture with a React + Vite frontend, styled with Tailwind CSS and shadcn/ui components. Wouter handles routing, and TanStack Query manages data. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is provided by Replit Auth (OIDC).

Core architectural features include:
- **AI Mastery Curriculum:** A five-level educational progression focusing on responsible AI use with module-gated tool access.
- **AI Companions (Spark & Sparky):** Age-adaptive AI learning companions providing personalized coaching.
- **AI Creation Studio:** A unified platform offering 10 AI-powered tools with wizard workflows and streaming AI generation.
- **Grant Discovery Engine:** A Grant Hub with SAM.gov API integration for live opportunity searching, AI-powered semantic analysis, fit scoring, and readiness checklists.
- **Reentry & Case Management:** Dashboard with phase-based plans, intake assessments, milestone tracking, and service delivery records.
- **Community Partner Network:** A partner directory supporting referral workflows, MOU tracking, and multi-stakeholder coordination.
- **Outcome Reporting:** Dashboard aligned with DOJ metrics for tracking various outcomes with CSV export.
- **Justice System Integration:** External API for juvenile justice agencies to submit referrals and retrieve progress reports.
- **Panther Village Academy:** An immersive virtual campus with interactive elements.
- **Career Pipelines & Mentor Network:** Structured career pathways and connections with industry professionals.
- **Thrive System:** A structured autonomy and context-aware navigation system with a six-domain Thrive Scoring Engine and an Early Warning System.
- **Pilot Data & Dosage Tracking:** Dashboards for cohort management, enrollment, and real-time metrics, including WIOA-compatible service hour reports.
- **Workforce Pipeline:** Comprehensive lifecycle management including multi-step assessments, training program directories, employer partnerships, job placement, and retention checks.
- **Community Intelligence Map:** Interactive GIS map displaying data from federal APIs with toggleable layers and community profile cards.
- **Smart Intake Wizard & Service Delivery System:** Empathetic multi-step intake process and service record tracking.
- **Empathetic AI Navigator:** A persistent, context-aware AI chat panel accessible from all pages, leveraging SDOH and criminal justice frameworks with context injection from GIS data and conversation memory.
- **Sankofa Health Network Integration:** A Health & Wellness hub offering behavioral health self-assessments, wellness content, and resource recommendations.
- **DFC Youth Substance Prevention:** Prevention curriculum with modules across substance topics and age tiers, including risk/protective factor assessments.
- **DFC Coalition Management Dashboard:** 12-sector coalition tracker aligned to ONDCP requirements with meeting management and action items.
- **Parent Prevention Education:** Parent-facing prevention modules with family strengthening content and AI-powered conversation starters.
- **Ecosystem Integration Hub:** Visual ecosystem map connecting all 14 Collaborative Advocate platforms including MCE. Features full portfolio view, Grant Opportunity Matcher, Competitive Advantages dashboard, DFC 12-sector coverage mapping, grant alignment matrix, integration architecture view, ready-to-use narrative language, discipline tags on every platform card, and a "By Discipline" toggle view grouping platforms by academic discipline (Implementation Science, Criminal Justice, HR Management, I-O Psychology).
- **MCE (Minority Center of Excellence):** Platform 14 in the ecosystem, a comprehensive digital ecosystem for minority-owned businesses with curated records, AI tools, dual-AI proposal review, 6-stage business journey, SAM.gov live integration, certification eligibility wizard, B2B networking, Business Health Score, and teaming hub.
- **Program Management Suite:** Post-award grant execution tools with dashboards for KPIs, project lifecycle, staffing, facilities, schedule, in-kind match tracking, and sustainability planning.
- **Facilitator Hub:** Curriculum delivery and facilitator tools including dashboards, AI-assisted session planning, delivery logs, fidelity monitoring, and certification tracking.
- **Platform Metrics Dashboard:** Comprehensive cross-platform metrics across 8 categories: Engagement, Prevention, Coalition, Workforce, Grants, Facilitator, Parent Education, Email/Communications.
- **Resend Email Integration:** Transactional email via Resend connector for contact inquiries, partner notifications, grant alerts, and welcome emails.
- **About / Leadership Page:** Dr. Terry Flood credentials page featuring academic and professional background, proprietary methodologies, co-founder bio, and entity overview.
- **Interactive Ecosystem Story:** Narrative walkthrough showing how the 14-platform ecosystem works through a real scenario.
- **Multi-AI Ensemble:** Dual-AI review and multi-AI response synthesis in `server/ai-provider.ts` for querying multiple providers with consensus scoring and independent evaluation.
- **DFC Command Center:** Unified dashboard aggregating live metrics from all DFC subsystems across Coalition Health, Prevention Impact, Community Engagement, and Grant Readiness, with AI-powered recommendations.
- **DFC Guided Wizards:** 4 step-by-step wizard flows for Coalition Setup, Prevention Launch, Grant Application, and Community Assessment.
- **Cross-Page Navigation:** Reusable DFCCrossNav component on all 6 DFC pages showing "Related Tools" cards with live metrics.
- **DFC Performance Measures & Community Readiness:** DFC-specific reporting with SAMHSA Core Measures tracking, stakeholder surveys, Tri-Ethnic Center Community Readiness Model, RE-AIM implementation science dashboard, and CSV/PDF export.
- **Evidence-Based Programs Registry & Environmental Strategies:** Prevention strategies hub with SAMHSA/NIDA-registered programs, implementation fidelity tracking, environmental strategies tracker, CFIR implementation research framework, and stakeholder fit mapping.
- **DFC Readiness & Media Campaign Planner:** Application readiness dashboard with SAM.gov/UEI/Grants.gov checklist, coalition eligibility verification, stakeholder commitment tracker, media campaign builder, and overall readiness scoring.
- **LMS Course Creator:** Administrative tool for managing courses, modules, and lessons.
- **Accessibility & Responsiveness:** WCAG 2.1 AA compliance with dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, and mobile responsiveness.
- **Design System:** Violet/indigo branding with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Financial Literacy & Workforce Development:** Financial literacy courses, stock market simulation, entrepreneurship training.
- **Landing Page Narrative Transformation:** Hero section leads with "We Plan. We Coordinate. We Build. We Measure." and names four academic disciplines. MAP-GAP cycle section (6 steps: Identify → Design → Coordinate → Execute → Measure → Capture) with discipline tags. Four Disciplines → MAP-GAP Components section mapping each discipline to its IP contribution. Program Showcase section with expandable case studies (My Brother's Keeper Chicago/DC, Rural Workforce Revitalization) showing disciplines activated, stakeholders coordinated, platforms used, and grant alignment. Data-driven from `client/src/lib/mvv-content.ts` exports (DISCIPLINES, MAPGAP_CYCLE, PROGRAM_SHOWCASES).
- **MAP-GAP CQI Engine:** Continuous Quality Improvement engine with 5-phase cycle management, gap/intervention/fidelity/outcome CRUD, and trend visualization.
- **Internationalization (i18n):** Supports English and Spanish.
- **TX STAAR Test Prep:** Grade-level study guides aligned to TEKS.
- **Stakeholder Presentation:** Interactive presentation for showcasing platform features.
- **Logic Model & Grant Narrative Builder:** Interactive logic model visualization and AI-assisted draft generation for grant narratives, pulling live platform data.
- **First 30 Days Onboarding Journey:** Guided 30-day onboarding with population-specific templates and milestone tracking.
- **APEX Accelerators Integration:** DoD APEX Accelerators integration for center locator, service cards, contracting journey, and cross-links.
- **Business Plan:** Comprehensive shareable business plan for ecosystem overview, MVV, pipeline, competitive advantages, funding, and leadership.
- **Research & Implementation Science Hub:** Interactive RE-AIM evaluation tool (5 domains, 20 questions), CFIR explorer (5 domains, 39 constructs), research-to-practice translation pipeline with MAP-GAP integration, curated research library (12 resources from SAMHSA, NIRN, CDC, PCORI). For implementation scientists, researchers, public health professionals.
- **Community Health Worker Dashboard:** Caseload management, home visit logging with best practices, screening/referral tracking, community resource connector (8 resource categories), professional development tracker (10 training modules), CHW certification pathway. For frontline health workers and community navigators.
- **MAP-GAP Living Framework Page:** Interactive 6-step cycle visualization, Three Realities explainer, methodology registry (MAP-GAP, SALP, Three Realities, MG-PATR), MAP-GAP in Action tabbed scenarios. Under Research & Implementation sidebar.
- **Stakeholder Transparency Dashboard:** 7 role-based views (Funder, Partner, School, Justice, Parent, Staff, Participant) showing the same data presented for each stakeholder's context. SALP fidelity indicators panel, SMART goals tracker. Under Community Intelligence sidebar.
- **Interactive Program Designer:** MAP-GAP-driven grant capability mapping. 5 grant profiles (DFC, WIOA, Second Chance Act, SAMHSA, Truist Foundation) with requirement mapping, capability inventory, gap analysis matrix, and execution plan builder. Under Grant Engine sidebar.
- **Program Lifecycle Pipeline:** Visual kanban showing programs through 6 lifecycle stages (Discovery → Assessment → Design → Implementation → Measurement → Improvement). 8 program cards with fidelity scores, risk levels, and task progress. Under Grant Engine sidebar.
- **Case Study Deep Dives:** 4 comprehensive case studies (Substance Use Prevention, Workforce Reentry, Youth Development, Coalition Building) with Challenge → MAP-GAP Application → Implementation → Measured Outcomes → Lessons Learned structure. Under Research & Implementation sidebar.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini Flash, OpenAI (gpt-4o-mini), Replit AI Integrations (gpt-5-nano), Multi-AI Ensemble (dual-AI review)
- **Email:** Resend (via Replit connector integration)
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data API, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS
- **Interactive Maps:** Leaflet + react-leaflet with OpenStreetMap tiles
- **SAM.gov API:** Federal grants database (api.sam.gov)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react
- **Cross-Platform Integration:** Student Support Portal (ISSS)