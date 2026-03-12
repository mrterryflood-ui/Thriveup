# AI Mastery Academy & School Support Hub

## Overview
AI Mastery Academy is an education platform and school support hub dedicated to empowering under-resourced youth aged 14-24. Its core mission is to equip students with AI literacy, workforce readiness, and clear school-to-career pathways. The platform offers a five-level AI Mastery curriculum, over 50 school-to-career pipelines, professional mentorship, and workforce development programs. It integrates an AI Creation Studio with 10 professional-grade AI tools, an entrepreneurship ecosystem, a virtual campus (Panther Village), financial literacy education, and opportunities for college tuition fundraising. The platform utilizes IGN-Thrive analytics for comprehensive student support and is designed to align with workforce development grant criteria, focusing on employment opportunities, skill training, job placement, and career advancement for its target demographic.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction.

## System Architecture
The application features a React + Vite frontend utilizing shadcn/ui for components, Tailwind CSS for styling, wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled by Replit Auth (OIDC), supporting magic link, Google, and GitHub logins, with user data stored in the database.

Key architectural elements include:
- **AI Mastery Curriculum:** A five-level progression (Explorer to Master) focusing on responsible AI use, with module-gated tool access and capstone projects.
- **AI Companions (Spark & Sparky):** Spark is a grade-band-specific AI learning companion featuring configurable AI providers, SSE streaming, emotional intelligence, Socratic questioning, and safety guardrails. Sparky is an adult AI companion for parents/teachers, offering support without child-safety restrictions.
- **AI Creation Studio:** A unified productivity platform with 10 AI-powered tools (e.g., Presentation Builder, Resume Builder), featuring wizard workflows, project import/export, file attachment reading, and streaming AI generation. Tools are module-gated for students but accessible to adults.
- **Panther Village Academy:** An immersive virtual campus with interactive elements, avatar customization, and a virtual merchandise shop for fundraising.
- **School-to-Career Pipelines:** Over 50 structured career pathways from exploration to job placement, including assessments and workforce milestones.
- **Mentor Network:** Connects youth with industry professionals for coaching and career development.
- **IGN-Thrive System:** A structured autonomy and context-aware navigation system incorporating a six-domain Thrive Scoring Engine, self-assessment, GIS Context Engine, and an Early Warning System.
- **Engagement & Progression:** Includes a badge achievement system, progress tracking, daily quests, and a "Panther Power Score."
- **Administrative & Support Tools:** Features Parent & Teacher Dashboards, classroom management, a certificate system, student reflection journal, and announcements.
- **LMS Course Creator:** An admin-only tool for managing courses, modules, and lessons.
- **Accessibility & Responsiveness:** Designed for WCAG 2.1 AA compliance, featuring dyslexia-friendly fonts, high contrast, reduced motion, and screen reader optimization, alongside mobile responsiveness.
- **Design System:** Employs maroon and silver branding with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Financial Literacy & Workforce Development:** Offers financial literacy courses, a stock market simulation, entrepreneurship training, and real fundraising for college.
- **Multi-Game Platform (Panther Game Room):** Hosts educational games like Dominoes with AI.
- **Internationalization (i18n):** Supports English and Spanish.
- **TX STAAR Test Prep:** Provides grade-level study guides aligned to TEKS, gamified for engagement.
- **Stakeholder Presentation:** An interactive 21-slide presentation at `/presentation` for showcasing platform features and impact.

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
- **Fundraising Partner:** UBO
- **Cross-Platform Integration:** Student Support Portal (ISSS)