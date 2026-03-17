# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform designed for under-resourced communities. Its core purpose is to connect individuals with grant funding opportunities and deliver measurable outcomes through coordinated service delivery. Key capabilities include an AI Mastery curriculum, over 50 career pathways, professional mentorship, an AI Creation Studio with 10 professional-grade AI tools, an entrepreneurship ecosystem, a virtual campus, financial literacy education, and community engagement tools. The platform aims to align with workforce development grant criteria and support comprehensive learner development.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers.

## System Architecture
The application employs a modern web architecture with a React + Vite frontend, styled using Tailwind CSS and components from shadcn/ui. Wouter handles client-side routing, and TanStack Query manages data. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is provided by Replit Auth (OIDC), supporting magic link, Google, and GitHub logins.

Core architectural components and features include:
- **AI Mastery Curriculum:** A five-level educational progression focusing on responsible AI use, with module-gated tool access and capstone projects.
- **AI Companions (Spark & Sparky):** Age-adaptive AI learning companions providing personalized coaching and support, with configurable AI providers, SSE streaming, and safety guardrails.
- **AI Creation Studio:** A unified platform offering 10 AI-powered tools (e.g., Presentation Builder, Resume Builder) with wizard workflows and streaming AI generation.
- **Grant Discovery Engine:** A comprehensive Grant Hub with SAM.gov federal grants API integration for live opportunity searching, AI-powered semantic analysis, fit scoring, readiness checklists, and reporting features (WIOA/DOL alignment). Includes a MAP-GAP integration for tracking platform development gaps.
- **Reentry & Case Management:** Dashboard (`/reentry`) with phase-based plans, intake assessments, milestone tracking, and service delivery records.
- **Community Partner Network:** A partner directory (`/partners`) supporting referral workflows, MOU tracking, and multi-stakeholder coordination for collective impact reporting.
- **Outcome Reporting:** Dashboard (`/outcomes`) aligned with DOJ metrics for tracking recidivism, employment, education, housing, and behavioral health, with CSV export.
- **Justice System Integration:** External API (`/api/external/justice/*`) for juvenile justice agencies to submit referrals and retrieve progress reports.
- **Panther Village Academy:** An immersive virtual campus featuring interactive elements and avatar customization.
- **Career Pipelines & Mentor Network:** Structured career pathways from exploration to job placement and connections with industry professionals.
- **Thrive System:** A structured autonomy and context-aware navigation system incorporating a six-domain Thrive Scoring Engine, self-assessment, GIS Context Engine, and an Early Warning System.
- **Pilot Data & Dosage Tracking:** Dashboards for cohort management, enrollment, and real-time metrics, including WIOA-compatible service hour reports.
- **Workforce Pipeline:** Comprehensive lifecycle management including multi-step assessments, training program directories, employer partnerships, job placement tracking, and retention checks.
- **Community Intelligence Map:** Interactive GIS map displaying data from federal APIs (e.g., CDC PLACES, SVI, FBI UCR, Census ACS) with toggleable layers and community profile cards.
- **Smart Intake Wizard & Service Delivery System:** Empathetic multi-step intake process capturing participant profiles and tracking service records based on grant-aligned categories.
- **Empathetic AI Navigator:** A persistent, context-aware AI chat panel accessible from all pages, leveraging social determinants of health (SDOH) and criminal justice frameworks. It includes context injection from GIS data, community resources, and grant opportunities, with conversation memory and crisis safety protocols.
- **Sankofa Health Network Integration:** A Health & Wellness hub (`/health-wellness`) offering behavioral health self-assessments, wellness content, and resource recommendations integrated with GIS.
- **DFC Youth Substance Prevention:** Prevention curriculum (`/prevention`) with 24 modules across 8 substance topics (alcohol, cannabis, vaping, prescription drugs, fentanyl, peer pressure, media literacy, coping strategies) × 3 age tiers (10-14, 15-18, 19-24). Includes risk/protective factor assessments, anonymous youth substance use surveys, and resources linking to SAMHSA/NIDA/CDC.
- **DFC Coalition Management Dashboard:** 12-sector coalition tracker (`/coalition`) aligned to ONDCP Drug-Free Communities requirements. Features sector map with gap indicators, meeting management with minutes and action items, SAMHSA capacity assessment scoring, SPF-aligned community action plans, cost match tracking for 100% federal match compliance, and sustainability planning.
- **Parent Prevention Education:** Parent-facing prevention modules (`/parent-education`) with 7 substance prevention and 6 family strengthening modules. Includes family risk/protective factor assessment, AI-powered conversation starters for difficult topics, and dosage tracking integration.
- **LMS Course Creator:** An administrative tool for managing courses, modules, and lessons.
- **Accessibility & Responsiveness:** WCAG 2.1 AA compliance with dyslexia-friendly fonts, high contrast, reduced motion, and screen reader optimization, alongside mobile responsiveness.
- **Design System:** Violet/indigo branding with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Internationalization (i18n):** Supports English and Spanish.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini Flash (default), with fallbacks to OpenAI (gpt-4o-mini) and Replit AI Integrations (gpt-5-nano).
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data API, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS.
- **Interactive Maps:** Leaflet + react-leaflet with OpenStreetMap tiles.
- **SAM.gov API:** Federal grants database (api.sam.gov).
- **UI Components:** shadcn/ui.
- **Styling:** Tailwind CSS.
- **Data Fetching:** TanStack Query.
- **Routing:** wouter.
- **Icons:** lucide-react.
- **Cross-Platform Integration:** Student Support Portal (ISSS).