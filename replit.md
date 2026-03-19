# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform designed for under-resourced communities. Its core purpose is to connect individuals with grant funding opportunities and deliver measurable outcomes through coordinated service delivery. The platform offers an AI Mastery curriculum, career pathways, professional mentorship, an AI Creation Studio with professional-grade AI tools, an entrepreneurship ecosystem, a virtual campus, financial literacy education, and community engagement tools. It aims to align with workforce development grant criteria and support comprehensive learner development, driving measurable outcomes and community impact.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers.

## System Architecture
The application uses a modern web architecture with a React + Vite frontend, styled with Tailwind CSS and shadcn/ui components. Wouter handles routing, and TanStack Query manages data. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is provided by Replit Auth (OIDC).

Core architectural features include:
- **AI-Powered Learning & Creation:** AI Mastery curriculum, age-adaptive AI companions (Spark & Sparky), and an AI Creation Studio with 10 professional-grade AI tools and wizard workflows.
- **Grant Management System:** Grant Hub with SAM.gov API integration for live opportunity searching, AI-powered semantic analysis, fit scoring, readiness checklists, and end-to-end grant submission packages with AI-assisted narrative generation and human-in-the-loop approval. Includes an Interactive Program Designer for grant capability mapping. Each grant package includes comprehensive NOFO knowledge (eligibility, scoring criteria, requirements), reference links to source grant pages, section-level page limits and word counts, and AI drafting that respects these constraints. 4 active grants: DFC ($625K, April 14 2026), WIOA ($200K-$500K, rolling), NBA Foundation ($100K-$500K, rolling LOI), St. David's Foundation (up to $1M collaborative, opens March 30 2026). Reminders & Execution Checklists with backend persistence (grant_reminders, grant_checklist_items tables).
- **Workforce Development & Case Management:** Reentry and case management dashboards with phase-based plans, intake assessments, milestone tracking, and service delivery records. Features career pipelines, a mentor network, and comprehensive workforce lifecycle management.
- **Community Engagement & Coordination:** Community Partner Network supporting referral workflows, an interactive Community Intelligence Map with GIS data, and a Smart Intake Wizard. DFC Coalition Management Dashboard for 12-sector tracking.
- **Outcome Measurement & Reporting:** Dashboard aligned with DOJ metrics for tracking outcomes with CSV export, SAMHSA Core Measures tracking, and a Continuous Quality Improvement (CQI) engine (MAP-GAP CQI Engine).
- **Ecosystem Integration Hub:** A visual map connecting all 14 Collaborative Advocate platforms (including MCE for minority-owned businesses), offering portfolio views, grant matching, and competitive advantage analysis. Includes an **Ecosystem Command Center** for the SSG Fox VA Suicide Prevention grant's 5-platform ecosystem (Whole-Person Health, Mission Transition, Life Transitions Aid, SALP Science, EasyAI Learning) with real-time health monitoring, heartbeat tracking, cross-platform event routing, and embeddable integration code generation. DB tables: `ecosystem_platforms`, `ecosystem_events`, `ecosystem_health_logs`. Routes: `server/ecosystem-connector.ts`.
- **Implementation Science & Research:** Research & Implementation Science Hub with RE-AIM evaluation, CFIR explorer, and a curated research library. Includes a MAP-GAP Living Framework page and Case Study Deep Dives demonstrating multi-platform integration.
- **Empathetic AI Navigator:** A persistent, context-aware AI chat panel leveraging SDOH and criminal justice frameworks with GIS data and conversation memory.
- **Program Management Suite:** Post-award grant execution tools, KPI dashboards, and a Facilitator Hub for curriculum delivery.
- **Accessibility & Design:** WCAG 2.1 AA compliance, dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, mobile responsiveness, and a violet/indigo branding design system with dark mode support.
- **Internationalization:** Supports English and Spanish.
- **Stakeholder Management:** Stakeholder Transparency Dashboard with 7 role-based views and a First 30 Days Onboarding Journey.
- **Multi-AI Ensemble:** Dual-AI review and multi-AI response synthesis for enhanced AI capabilities.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini Flash, OpenAI (gpt-4o-mini), Replit AI Integrations (gpt-5-nano), Multi-AI Ensemble
- **Email:** Resend (via Replit connector integration)
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data API, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS
- **Interactive Maps:** Leaflet + react-leaflet with OpenStreetMap tiles
- **Federal Grants:** SAM.gov API (api.sam.gov)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react
- **Cross-Platform Integration:** Student Support Portal (ISSS)