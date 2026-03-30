# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform designed for under-resourced communities. It provides a comprehensive ecosystem including AI mastery curricula, career pathways, mentorship, an AI Creation Studio, entrepreneurship tools, financial literacy, and community engagement features. The platform aims to connect individuals with grant funding and align with workforce development criteria to achieve measurable outcomes and significant community impact, empowering individuals and communities through technology and education.

## Founder — Dr. Terry Flood
- **Full Name:** Dr. Terry Flood (Sr.)
- **Academic Credentials:** DHA (Doctorate in Healthcare Administration), MS in Implementation Science, MA in Psychology, MSHRM (Human Resource Management), MBA, MSCJ (Criminal Justice), Public Policy (graduate level)
- **Email:** mr.terryflood@gmail.com
- **Role:** Founder & CEO of all three entities
- **Veteran Status:** Yes
- **Address:** 17912 Stefano Drive, Pflugerville, TX 78660
- **Payment:** Cash App ($MRTDFLOOD), PayPal (paypal.me/TERRYFLOODCEO) — NEVER Stripe

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers. CRITICAL: Always work in parallel using subagents. Never stop to have conversations when there is more work to do. Keep building.

## System Architecture
ThriveUp Academy employs a modern web architecture. The frontend uses React with Vite, styled by Tailwind CSS and shadcn/ui components, with Wouter for routing and TanStack Query for data management. The backend is an Express.js server on Node.js, utilizing a PostgreSQL database via Drizzle ORM. Authentication is managed by Replit Auth (OIDC).

Core architectural features and design decisions include:
- **AI-Powered Learning & Creation:** AI Mastery curriculum, age-adaptive AI companions, and an AI Creation Studio with 10 professional-grade AI tools.
- **Grant Management System:** Grant Hub with SAM.gov API integration for discovery, AI-powered semantic analysis, fit scoring, readiness checklists, and AI-assisted narrative generation for grant submissions. It includes **Daily Automated Grant Discovery** across 7 sources and 15 keywords, with a "Team-of-Teams" platform assignment based on grant relevance.
- **Workforce Development & Case Management:** Reentry and case management dashboards with phase-based plans, intake assessments, milestone tracking, and service delivery records.
- **Community Engagement & Coordination:** Community Partner Network for referrals, an interactive Community Intelligence Map, and a Smart Intake Wizard.
- **Outcome Measurement & Reporting:** Dashboards tracking outcomes aligned with DOJ and SAMHSA metrics, with CSV export and a Continuous Quality Improvement (CQI) engine.
- **Ecosystem Integration Hub:** A 24-platform connected ecosystem with visual mapping, real-time health monitoring, cross-platform event routing, and embeddable integration code generation.
- **SiteSync Inject System:** Enables external platforms (e.g., Code Canvas) to push code fixes for review and approval.
- **Ecosystem Directives System:** Broadcasts improvement directives across all 23 platforms with acknowledgment tracking.
- **Unified Operating System Directive (UOSD) + Cognitive Elevation Addendum (CEA):** Foundational operating standards governing all platforms, ensuring compliance, identity, and cognitive standards.
- **Fidelity Report Card System:** Provides report cards with grades and improvement plans, integrated into ecosystem health responses.
- **Mandatory RAG AI Integration:** Enforces RAG AI system integration across all platforms.
- **Auto-Deliverable Verification:** Automatically verifies evidence URLs.
- **Regional Hubs & Network:** Dedicated community hubs in Austin, Manor, and Pflugerville, forming an interconnected regional network.
- **Program Execution Engine:** Full operational program management system with a 6-step setup wizard, three methodology paths (Implementation Science, Traditional PM, Hybrid), a real-time Execution Dashboard, and grant alignment.
- **Implementation Science & Research:** Research & Implementation Science Hub with RE-AIM evaluation, CFIR explorer, and a research library.
- **Empathetic AI Navigator:** A persistent, context-aware AI chat panel leveraging SDOH and criminal justice frameworks with GIS data.
- **Program Management Academy:** A standalone PM curriculum for certification.
- **AI Workforce Academy:** Adult professional AI training across 7 tracks, aligned with WIOA standards.
- **Directive Compliance Center:** Real-time tracking of directives, statistics, and grant readiness views.
- **Instructor Presentation System:** Reusable component for interactive slideshows.
- **Video Production Pipeline:** End-to-end system for video content creation, rendering, and distribution.
- **RPLICE Implementation Science Toolkit:** Interactive tools for CFIR assessment, RE-AIM scorecards, fidelity checklists, and a Quality Gate Dashboard.
- **MCE Contract Management Center:** Full contract lifecycle management.
- **Program Management Suite:** Post-award grant execution tools, KPI dashboards, and a Facilitator Hub.
- **Accessibility & Design:** WCAG 2.1 AA compliant, with dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, mobile responsiveness, and a violet/indigo branding system with dark mode.
- **Internationalization:** Supports English and Spanish.
- **Stakeholder Management:** Stakeholder Transparency Dashboard and First 30 Days Onboarding Journey.
- **Collaborative Multi-AI Intelligence:** A 4-provider AI architecture (Gemini, Claude, OpenAI, Replit AI) for dual-AI review and perspective synthesis for quality assurance.
- **4-Layer Congruence Rule:** Ensures database schema, backend API, frontend, and public-facing pages remain synchronized to prevent silent failures.
- **Shadow/Observer Mode:** Allows external applications to observe hub operations without directives, with a two-way collaboration feature for insights.
- **Ecosystem Cross-Evaluation (Weekly + On-Demand):** MAP-GAP peer review system generating executive summaries, ranked scores, and strategic recommendations.
- **Ecosystem Self-Audit (Every 6 Hours):** Catches blind spots in subsystem monitoring, logging critical events.
- **Bilateral Collaboration Exchange (3x Daily):** Automated exchange of intelligence, recent changes, lessons, and questions.
- **Confidence Drift + Autonomy Quadrants:** Tracks earned trust and thinking scores to assess autonomy levels, integrated into heartbeat responses.
- **Captain Load Absorption Protocol:** Hybrid model for captains to temporarily absorb critical deliverables from down partners.
- **Multi-Ecosystem Firewall:** Enables platforms to connect to multiple ecosystems with strict data isolation.
- **Pre-Build Gate:** Ensures new capabilities are not redundant and are properly orchestrated before development.
- **Capability Orchestration Map:** Maps all 23 platforms to lead/support/validate roles for coordinated execution.
- **Capability Portfolio (Pay-for-Play):** Public endpoint for sales, showcasing platforms organized into 10 service domains with package types.
- **TEKS §127.15 CTE Employability Skills Alignment:** Full alignment map and API endpoint for structured JSON alignment data, offering a verifiable Workforce Readiness Certificate.
- **Full Curriculum Library:** 60 deep, real lessons across all subjects — AI Literacy (30 lessons across 10 modules in grades 6-8 and 9-12), Workforce Readiness (21 lessons across 7 modules in grades 6-8 and 9-12), and Social-Emotional Learning (9 lessons across 3 modules in grades 3-5, 6-8, and 9-12). Each lesson includes multi-thousand-word instruction, interactive activities, and grant-aligned content. No placeholders.
- **Conditional Seed Architecture:** Storage.ts uses targeted conditional seeds (seed-ai-literacy.ts, seed-ai-lessons-full.ts, seed-workforce-lessons.ts) that only run when content is absent, preventing duplicate data while ensuring all content is present.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Google Gemini 2.0 Flash, Anthropic Claude Haiku 4.5, OpenAI GPT-4o-mini, Replit AI Integrations GPT-5-nano.
- **Email:** Resend (via Replit connector integration)
- **Authentication:** Replit Auth (OIDC)
- **Gun Violence Registry Integration:** Live API connection to Dr. Flood's National Gun Violence Tracker (gun-violence-registry.replit.app), providing real-time incident data with city/state filtering, multi-city comparison, monthly trends, and incident type breakdowns. Combined with Gun Violence Archive national data.
- **Data Storyteller Tab:** Justice Command Center tab #16 — neighborhood → school → outcomes pipeline with unlimited city comparison dashboards, Census demographics, gun violence data, and AI-powered data narratives. Pre-loaded with Wilmington NC (Creekwood) and Austin TX examples plus 18 other high-impact cities.
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