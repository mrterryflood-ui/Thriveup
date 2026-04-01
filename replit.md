# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform designed for under-resourced communities. It offers AI mastery curricula, career pathways, mentorship, an AI Creation Studio, entrepreneurship tools, financial literacy, and community engagement. The platform aims to connect individuals with grant funding, align with workforce development criteria, and achieve significant community impact through technology and education.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers. CRITICAL: Always work in parallel using subagents. Never stop to have conversations when there is more work to do. Keep building.

## System Architecture
ThriveUp Academy utilizes a modern web architecture. The frontend is built with React, Vite, Tailwind CSS, shadcn/ui, Wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node.js with a PostgreSQL database managed by Drizzle ORM. Authentication is handled by Replit Auth (OIDC).

Core architectural features and design decisions include:
- **5-Provider AI Engine:** Incorporates Gemini 2.0 Flash, Claude Haiku 4.5, GPT-5 Nano (Replit AI Integrations), and DeepSeek R1 (via OpenRouter) with automatic failover and rate-limit detection.
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
- **RPLICE Implementation Science Toolkit:** Interactive tools for CFIR assessment, RE-AIM scorecards, fidelity checklists, Quality Gate Dashboard, and AI-Powered Community Analysis, which streams live Census ACS data and external research to produce 9-section RPLICE reports. Includes an Activation Pipeline for grant narrative generation, community action planning, and outcome baseline tracking.
- **Agent Communication Layer:** All 24 platforms function as autonomous agents with reasoning-required communication, tracking inter-platform exchanges and enabling targeted or broadcast communication, responses, and strategic reasoning.
- **Ecosystem Integration Guide:** Provides instructions for DeepSeek Strategic Reasoning, RPLICE Framework integration, MAP-GAP Cycle instructions, interdependent communication protocols, and grant coordination guidelines.
- **Accessibility & Design:** WCAG 2.1 AA compliant, with dyslexia-friendly fonts, high contrast, reduced motion, screen reader optimization, mobile responsiveness, and a violet/indigo branding system with dark mode.
- **Internationalization:** Supports English and Spanish.
- **Collaborative Multi-AI Intelligence:** A 4-provider AI architecture (Gemini, Claude, OpenAI, Replit AI) for dual-AI review and perspective synthesis.
- **4-Layer Congruence Rule:** Ensures synchronization across database schema, backend API, frontend, and public-facing pages.
- **Ecosystem Cross-Evaluation & Self-Audit:** Weekly/on-demand peer review and automated self-audits for continuous improvement.
- **Bilateral Collaboration Exchange:** Automated daily exchange of intelligence, changes, lessons, and questions.
- **TEKS §127.15 CTE Employability Skills Alignment:** Full alignment map and API endpoint for structured JSON alignment data, offering a verifiable Workforce Readiness Certificate.
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