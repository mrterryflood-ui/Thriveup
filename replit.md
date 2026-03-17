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
- **Grant Discovery Engine:** A Grant Hub with SAM.gov API integration for live opportunity searching, AI-powered semantic analysis, fit scoring, and readiness checklists. Includes MAP-GAP integration for platform development gap tracking.
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
- **Ecosystem Integration Hub:** Visual ecosystem map (`/ecosystem`) connecting 8 platforms: ThriveUp Academy, ISSS, Sankofa Health Network, WholeMind Learning, Perfectly Different, SafeReport, M2C Transition, and LifeBridge. Features DFC 12-sector coverage mapping, grant alignment matrix across 5 federal grant streams, integration architecture view, and ready-to-use DFC grant narrative language.
- **LMS Course Creator:** Administrative tool for managing courses, modules, and lessons.
- **Accessibility & Responsiveness:** WCAG 2.1 AA compliance with dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, and mobile responsiveness.
- **Design System:** Violet/indigo branding with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Financial Literacy & Workforce Development:** Financial literacy courses, stock market simulation, entrepreneurship training.
- **MAP-GAP CQI Engine:** Continuous Quality Improvement engine with 5-phase cycle management, gap/intervention/fidelity/outcome CRUD, and trend visualization.
- **Internationalization (i18n):** Supports English and Spanish.
- **TX STAAR Test Prep:** Grade-level study guides aligned to TEKS.
- **Stakeholder Presentation:** Interactive presentation for showcasing platform features.
- **Logic Model & Grant Narrative Builder:** Interactive logic model visualization and AI-assisted draft generation for grant narratives, pulling live platform data.
- **First 30 Days Onboarding Journey:** Guided 30-day onboarding with population-specific templates and milestone tracking.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini Flash, OpenAI (gpt-4o-mini), Replit AI Integrations (gpt-5-nano)
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