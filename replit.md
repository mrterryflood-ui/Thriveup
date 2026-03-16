# Workforce Development & Community Enablement Platform

## Overview
An AI-powered workforce development and community enablement platform designed to strengthen under-resourced communities. The platform serves ALL ages — returning citizens, single parents, veterans, youth, seniors, and anyone seeking workforce training and community support. It functions as a two-sided system: (1) a Grant Discovery Engine that finds and aligns federal, state, local, and private funding opportunities, and (2) a Workforce & Community Platform that delivers measurable outcomes through coordinated service delivery.

The platform is funder-agnostic and adaptable — it speaks the language of any grant maker (WIOA, DOJ, DOL, OJJDP, HHS, private foundations) by presenting the relevant slice of outcomes backed by the same underlying data and delivery system. AI is the foundation powering the platform, not the product itself. The user is the architect who finds community needs, writes grants, and delivers solutions through local ambassadors and community partners.

Contact: sisnett.meredith@gmail.com and mr.terryflood@gmail.com

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers.

## System Architecture
The application features a React + Vite frontend utilizing shadcn/ui for components, Tailwind CSS for styling, wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled by Replit Auth (OIDC), supporting magic link, Google, and GitHub logins, with user data stored in the database.

Key architectural elements include:
- **AI Digital Literacy Curriculum:** A five-level progression (Explorer to Master) for all ages — Foundation, Intermediate, Advanced, and Professional tracks. Focuses on responsible AI use, with module-gated tool access and capstone projects.
- **AI Navigator (Spark & Sparky):** Spark is an empathetic AI companion that adapts to any user — meeting returning citizens, parents, case managers, and community leaders where they are. Sparky is a staff AI companion for administrators and teachers. Both feature configurable AI providers, SSE streaming, and safety guardrails.
- **AI Creation Studio:** A unified productivity platform with 10 AI-powered tools (e.g., Presentation Builder, Resume Builder), featuring wizard workflows, project import/export, file attachment reading, and streaming AI generation.
- **Grant Discovery Engine:** Grant Hub (`/grants`) with AI-powered fit scoring, readiness checklists, alignment to WIOA/DOJ/DOL/OJJDP/HHS/private foundation criteria, and exportable alignment reports.
- **Reentry & Case Management:** Dashboard (`/reentry`) with phase-based plans (Pre-Release to Independence), intake assessments, milestone tracking, and service delivery records.
- **Community Partner Network:** Partner directory (`/partners`) with referral workflows, MOU tracking, impact metrics, and multi-stakeholder coordination (churches, employers, law enforcement, schools, community orgs).
- **Outcome Reporting:** Dashboard (`/outcomes`) with DOJ-aligned metrics (recidivism, employment, education, housing, behavioral health) and CSV export, plus WIOA/DOL reporting templates.
- **Justice System Integration:** Landing page (`/justice-partners`) and external API at `/api/external/justice/*` for justice agencies to submit referrals and retrieve progress reports.
- **Community Intelligence (planned):** GIS-powered interactive maps with layered data overlays (health, crime, poverty, food deserts, employment, resources) for any US location.
- **Workforce Pipeline (planned):** Complete lifecycle from intake assessment through training, credential attainment, job placement, retention tracking (30/90/180/365 days), and career advancement.
- **Panther Village Academy:** An immersive virtual campus with interactive elements, avatar customization, and a virtual merchandise shop.
- **School-to-Career Pipelines:** Over 50 structured career pathways from exploration to job placement, including assessments and workforce milestones.
- **Mentor Network:** Connects participants with industry professionals for coaching and career development.
- **IGN-Thrive System:** A structured autonomy and context-aware navigation system incorporating a six-domain Thrive Scoring Engine, self-assessment, GIS Context Engine, and an Early Warning System.
- **Engagement & Progression:** Includes a badge achievement system, progress tracking, daily quests, and a "Panther Power Score."
- **Administrative & Support Tools:** Features Parent & Teacher Dashboards, classroom management, a certificate system, reflection journal, and announcements.
- **LMS Course Creator:** An admin-only tool for managing courses, modules, and lessons.
- **Accessibility & Responsiveness:** Designed for WCAG 2.1 AA compliance, featuring dyslexia-friendly fonts, high contrast, reduced motion, and screen reader optimization, alongside mobile responsiveness.
- **Design System:** Violet/indigo branding with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Financial Literacy & Workforce Development:** Financial literacy courses, stock market simulation, entrepreneurship training, and fundraising.
- **Internationalization (i18n):** Supports English and Spanish.
- **TX STAAR Test Prep:** Provides grade-level study guides aligned to TEKS, gamified for engagement.
- **Stakeholder Presentation:** An interactive 21-slide presentation at `/presentation` for showcasing platform features and impact.
- **Grant & Workforce Ecosystem:** Grant Discovery Hub (`/grants`) with fit scoring and readiness checklists, Reentry Case Management Dashboard (`/reentry`) with phase-based plans (Pre-Release to Independence), Community Partner Network (`/partners`) with referral workflows and MOU tracking, Outcome Reporting (`/outcomes`) with DOJ-aligned metrics (recidivism, employment, education, housing, behavioral health) and CSV export, and Justice Partner Integration (`/justice-partners`) landing page with secure API documentation. Backend routes in `server/grant-routes.ts`, `server/reentry-routes.ts`, `server/partner-routes.ts`, `server/outcome-routes.ts`, and `server/justice-routes.ts`. Database tables: `reentryPlans`, `reentryMilestones`, `reentryIntakeAssessments`, `communityPartners`, `partnerReferrals`, `grantOpportunities`, `outcomeTracking`, `justiceReferrals`, `supervisionCompliance`.
- **Justice System Integration API:** External-facing API at `/api/external/justice/*` for juvenile justice agencies to submit referrals and retrieve progress reports. Uses `CROSS_PLATFORM_API_KEY` for authentication.
- **Workforce Pipeline:** Complete workforce lifecycle management at `/workforce-assessment`, `/workforce-training`, `/workforce-employers`, and `/workforce-dashboard`. Features multi-step assessment wizard (skills, barriers, work history, interests, readiness), training program directory with real programs (Job Corps, YouthBuild, CompTIA, Google Certs, AWS, apprenticeships), enrollment tracking with completion/credentials, employer partnership framework with fair-chance/ban-the-box flagging, job placement tracking, retention check-ins at 30/90/180/365 days, job readiness checklist, and grant compliance dashboard (WIOA/DOL/DOJ). Backend routes in `server/workforce-routes.ts`. Database tables: `workforceAssessments`, `trainingPrograms`, `trainingEnrollments`, `employerPartners`, `jobPostings`, `jobPlacements`, `retentionChecks`, `jobReadinessChecklists`.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Provider-agnostic abstraction, defaulting to Google Gemini Flash. Supports OpenAI (gpt-4o-mini) and Replit AI Integrations (gpt-5-nano) as fallbacks.
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data API
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react
- **Cross-Platform Integration:** Student Support Portal (ISSS)
