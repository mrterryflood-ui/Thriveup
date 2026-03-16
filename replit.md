# ThriveUp Academy

## Overview
ThriveUp Academy is an AI-powered workforce development and community enablement platform serving under-resourced communities of all ages — returning citizens, veterans, single parents, seniors, youth, and any learner. The platform functions as a two-sided system: (1) a Grant Discovery Engine that finds and aligns federal, state, local, and private funding opportunities, and (2) a Workforce & Community Platform that delivers measurable outcomes through coordinated service delivery. It offers a five-level AI Mastery curriculum, over 50 career pathways, professional mentorship, and workforce development programs. It integrates an AI Creation Studio with 10 professional-grade AI tools, an entrepreneurship ecosystem, a virtual campus (Panther Village), financial literacy education, and community engagement tools. The platform utilizes Thrive analytics for comprehensive learner support and is designed to align with workforce development grant criteria.

Contact: sisnett.meredith@gmail.com and mr.terryflood@gmail.com

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction. CRITICAL: "NBA" must NEVER appear in UI code identifiers.

## System Architecture
The application features a React + Vite frontend utilizing shadcn/ui for components, Tailwind CSS for styling, wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled by Replit Auth (OIDC), supporting magic link, Google, and GitHub logins, with user data stored in the database.

Key architectural elements include:
- **AI Mastery Curriculum:** A five-level progression (Explorer to Master) for all ages, focusing on responsible AI use, with module-gated tool access and capstone projects.
- **AI Companions (Spark & Sparky):** Spark is an age-adaptive AI learning companion that adapts to any user — professional career coaching for adults (returning citizens, veterans, career changers), grade-band personalities for youth. Sparky is an AI companion for all adult users — parents, teachers, returning citizens, veterans, community org leaders, and case managers. Both feature configurable AI providers, SSE streaming, and safety guardrails.
- **AI Creation Studio:** A unified productivity platform with 10 AI-powered tools (e.g., Presentation Builder, Resume Builder), featuring wizard workflows, project import/export, file attachment reading, and streaming AI generation.
- **Grant Discovery Engine:** Grant Hub (`/grants`) with AI-powered fit scoring, readiness checklists, alignment to WIOA/DOJ/DOL/OJJDP/HHS/private foundation criteria, and exportable alignment reports.
- **Reentry & Case Management:** Dashboard (`/reentry`) with phase-based plans (Pre-Release to Independence), intake assessments, milestone tracking, and service delivery records.
- **Community Partner Network:** Partner directory (`/partners`) with referral workflows, MOU tracking, impact metrics, and multi-stakeholder coordination.
- **Outcome Reporting:** Dashboard (`/outcomes`) with DOJ-aligned metrics (recidivism, employment, education, housing, behavioral health) and CSV export.
- **Justice System Integration:** Landing page (`/justice-partners`) and external API at `/api/external/justice/*` for justice agencies.
- **Panther Village Academy:** An immersive virtual campus with interactive elements, avatar customization, and a virtual merchandise shop.
- **Career Pipelines:** Over 50 structured career pathways from exploration to job placement, including assessments and workforce milestones.
- **Mentor Network:** Connects learners with industry professionals for coaching and career development.
- **Thrive System:** A structured autonomy and context-aware navigation system incorporating a six-domain Thrive Scoring Engine, self-assessment, GIS Context Engine, and an Early Warning System.
- **Engagement & Progression:** Includes a badge achievement system, progress tracking, daily quests, and a "Panther Power Score."
- **Administrative & Support Tools:** Features Parent & Teacher Dashboards, classroom management, a certificate system, reflection journal, and announcements.
- **LMS Course Creator:** An admin-only tool for managing courses, modules, and lessons.
- **Accessibility & Responsiveness:** Designed for WCAG 2.1 AA compliance, featuring dyslexia-friendly fonts, high contrast, reduced motion, and screen reader optimization, alongside mobile responsiveness.
- **Design System:** Violet/indigo branding with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Financial Literacy & Workforce Development:** Financial literacy courses, stock market simulation, entrepreneurship training, and fundraising.
- **Internationalization (i18n):** Supports English and Spanish.
- **TX STAAR Test Prep:** Provides grade-level study guides aligned to TEKS, gamified for engagement.
- **Stakeholder Presentation:** An interactive 21-slide presentation at `/presentation` for showcasing platform features and impact.
- **Grant & Workforce Ecosystem:** Grant Discovery Hub (`/grants`) with fit scoring and readiness checklists, Reentry Case Management Dashboard (`/reentry`) with phase-based plans (Pre-Release to Independence), Community Partner Network (`/partners`) with referral workflows and MOU tracking, Outcome Reporting (`/outcomes`) with DOJ-aligned metrics (recidivism, employment, education, housing, behavioral health) and CSV export, and Justice Partner Integration (`/justice-partners`) landing page with secure API documentation. Backend routes in `server/grant-routes.ts`, `server/reentry-routes.ts`, `server/partner-routes.ts`, `server/outcome-routes.ts`, and `server/justice-routes.ts`. Database tables: `reentryPlans`, `reentryMilestones`, `reentryIntakeAssessments`, `communityPartners`, `partnerReferrals`, `partnerEngagements`, `mouDocuments`, `ambassadorProfiles`, `grantOpportunities`, `outcomeTracking`, `justiceReferrals`, `supervisionCompliance`, `workforceAssessments`, `trainingPrograms`, `trainingEnrollments`, `employerPartners`, `jobPostings`, `jobPlacements`, `retentionChecks`, `jobReadinessChecklists`.
- **Stakeholder Ecosystem & Community Engagement (`/partners`):** Full multi-stakeholder engagement layer with 18 partner types (community orgs, churches/faith-based, law enforcement, community policing commissions, recidivism prevention task forces, schools, healthcare providers, housing authorities, employers, legal aid, etc.). Features include: tabbed interface (Partner Directory, Coordination, Ambassadors, MOU Management, Collective Impact), partner type-specific views (employer hiring commitments, law enforcement diversion referrals, church volunteer coordination), ambassador/ground partner onboarding workflow (invite → onboard → activate), MOU lifecycle management (draft → sent → signed → active with renewal reminders), community engagement tracking (volunteer hours, events, participants served, resources distributed, facility sharing), multi-agency coordination dashboard with service gap analysis, and collective impact reporting aggregating outcomes across all partners for grant applications.
- **Justice System Integration API:** External-facing API at `/api/external/justice/*` for juvenile justice agencies to submit referrals and retrieve progress reports. Uses `CROSS_PLATFORM_API_KEY` for authentication.
- **Workforce Pipeline:** Complete workforce lifecycle management at `/workforce-assessment`, `/workforce-training`, `/workforce-employers`, and `/workforce-dashboard`. Features multi-step assessment wizard (skills, barriers, work history, interests, readiness), training program directory with real programs (Job Corps, YouthBuild, CompTIA, Google Certs, AWS, apprenticeships), enrollment tracking with completion/credentials, employer partnership framework with fair-chance/ban-the-box flagging, job placement tracking, retention check-ins at 30/90/180/365 days, job readiness checklist, and grant compliance dashboard (WIOA/DOL/DOJ). Backend routes in `server/workforce-routes.ts`. Database tables: `workforceAssessments`, `trainingPrograms`, `trainingEnrollments`, `employerPartners`, `jobPostings`, `jobPlacements`, `retentionChecks`, `jobReadinessChecklists`.
- **Community Intelligence Map:** Interactive GIS map at `/community-map` powered by Leaflet/OpenStreetMap with data from 8+ federal APIs (CDC PLACES, CDC SVI, FBI UCR, Census ACS, USDA Food Access, HUD, SAMHSA, BLS). Features toggleable data layers, Context Load Index visualization, community profile cards with plain-language narratives, side-by-side comparison, resource listing by state, and PDF export for grant applications. API routes at `/api/community-map/*`. Frontend page: `client/src/pages/community-map.tsx`. Backend engine: `server/gis-engine.ts`.
- **Smart Intake Wizard & Service Delivery System:** Multi-step intake wizard at `/intake` with empathetic language and progress indicators capturing demographics, contact info, housing, education, employment, justice involvement, health needs, family situation, goals, referral source, and consent. Service delivery tracking at `/services` with service record management, dosage tracking (hours per category), caseload management dashboard, and follow-up tracking. Service categories aligned to grant requirements (case management, workforce training, education, housing assistance, mental health, substance abuse treatment, legal aid, mentoring, financial coaching, transportation, childcare). Database tables: `participant_profiles`, `service_records`, `consent_records`. API routes in `server/reentry-routes.ts`. Data exportable via `/api/intake/export` for grant reporting.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Provider-agnostic abstraction, defaulting to Google Gemini Flash. Supports OpenAI (gpt-4o-mini) and Replit AI Integrations (gpt-5-nano) as fallbacks.
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API, CDC/ATSDR SVI, FBI Crime Data API, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, BLS
- **Interactive Maps:** Leaflet + react-leaflet with OpenStreetMap tiles (Community Intelligence Map at `/community-map`)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react
- **Cross-Platform Integration:** Student Support Portal (ISSS)
