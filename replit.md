# AI Mastery Academy & School Support Hub

## Overview
AI Mastery Academy is an education platform and school support hub for under-resourced youth ages 14-24, built on the foundation that the students who learn to think with AI today will lead tomorrow. The platform features a five-level AI Mastery curriculum (Explorer through Master), 50+ school-to-career pipelines, professional mentorship, workforce development, and an AI Creation Studio with 10 professional-grade tools students earn through demonstrated mastery. It integrates an entrepreneurship ecosystem, virtual campus (Panther Village), financial literacy, real fundraising opportunities for college tuition, and IGN-Thrive analytics for whole-child support. The platform is aligned with workforce development grant criteria: school-to-career employment opportunities, job readiness, skill training, job placement, career advancement, and mentorship for under-resourced communities.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction.

## Branding & Identity
- **Platform Name:** AI Mastery Academy (primary), School Support Hub (secondary positioning)
- **Legacy Name:** Texas Empowerment Academy (TxEA) - used in some narrative content
- **Mission:** Empowering under-resourced youth with AI mastery, workforce readiness, and school-to-career pipelines
- **Tagline:** Teaching the first generation to guide their smartest classmate
- **Values:** AI Mastery, Workforce Development, Mentorship, Equity, Whole-Child Support
- **Contact:** sisnett.meredith@gmail.com, mr.terryflood@gmail.com

## Grant Alignment
The platform is positioned for workforce development grant eligibility:
- **Target Population:** Under-resourced youth ages 14-24
- **Core Focus:** School-to-career employment pipelines
- **Key Areas:** Job readiness, skill training, job placement, career advancement
- **Mentorship:** Professional coaching and pipeline development
- **Impact Metrics:** Youth served, career pathways, mentorship connections, workforce skills, program retention
- **Community:** Launching in Austin, TX with plans for national scaling

## System Architecture
The application uses a React + Vite frontend with shadcn/ui, Tailwind CSS, wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled by Replit Auth (OIDC) supporting magic link, Google, and GitHub logins, with user sessions and profiles stored in the database.

Key architectural decisions and features include:
- **AI Mastery Curriculum:** Five-level progression (Explorer, Guide, Architect, Innovator, Master) teaching responsible, ethical AI use. Module-gated tool access. Parent Teachback verification. Capstone projects at each level.
- **AI Companions (Spark & Sparky):** Spark is a grade-band-specific AI learning companion (configurable AI provider with SSE streaming, emotional intelligence framework, Socratic questioning, growth mindset, cultural awareness, bilingual support, safety guardrails). Sparky is an adult AI companion for parents and teachers, offering compassionate support without child-safety restrictions, including evidence-based strategies and context-aware conversations. Both link to the AI Creation Studio.
- **AI Creation Studio:** A unified productivity platform with 10 AI-powered tools (Presentation Builder, Video Script Creator, Sales Pitch Builder, Business Plan Generator, Research Assistant, Life Planner, Project Planner, Document Writer, Resume Builder, Brainstorm Studio). Features wizard workflows for seamless project flow between tools, project import/export, file attachment with text content reading, streaming AI generation, and project saving. Tools are module-gated for students (must complete AI Course modules to unlock) but ungated for adults via Sparky (?mode=adult). At /ai-tools and /ai-tools/:toolKey.
- **Panther Village Academy:** An immersive virtual campus with interactive buildings, avatar customization, a simulated stock market, academic competitions, and a virtual merchandise shop for college tuition fundraising.
- **School-to-Career Pipelines:** 50+ career pathways with structured progression from exploration to job readiness, skill training, and career placement. Career readiness assessments, workforce milestones, and industry partnership pipelines.
- **Mentor Network:** Professional coaching connecting under-resourced youth with industry mentors for career advancement and workforce readiness.
- **IGN-Thrive System:** A structured autonomy and context-aware navigation system featuring a six-domain Thrive Scoring Engine, student self-assessment, GIS Context Engine for external factors, and an Early Warning System with intervention playbooks.
- **Engagement & Progression:** Badge achievement system, detailed progress tracking, daily quests, and "Panther Power Score" (unified empowerment metric across five categories).
- **Administrative & Support Tools:** Parent & Teacher Dashboards (School Support Hub), classroom management, certificate system, student reflection journal, announcements, calendar, student help, and attendance tracking.
- **LMS Course Creator:** Admin-only LearnWorlds-style course management at /academy/course-creator. Multi-step wizard for course creation with 10 categories. Course editor with Details, Modules & Lessons, and Enrollments tabs. Full CRUD for courses, modules, and lessons with enrollment tracking.
- **Accessibility & Responsiveness:** Comprehensive AccessibilityProvider with dyslexia-friendly fonts, large text, high contrast, reduced motion, and screen reader optimization. WCAG 2.1 AA compliance and mobile responsiveness.
- **Design System:** Maroon and silver colors with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Financial Literacy & Workforce Development:** Financial literacy academy, stock market simulation, entrepreneurship training, and real fundraising for college tuition.
- **Multi-Game Platform (Panther Game Room):** A game lobby with educational games including Dominoes with CPU AI and ELO rating.
- **Internationalization (i18n):** Custom language provider supporting English and Spanish.
- **TX STAAR Test Prep:** Grade-level study guides (Grades 3-11) aligned to TEKS. Covers Math, RLA, Science, Social Studies, and high school EOCs. Gamified with streaks, celebrations, and mastery tracking. At /academy/staar-prep.
- **Feature Video Guide:** Homepage video player with Arthur Wakanda platform tour (play/pause, mute, fullscreen controls with accessibility labels).
- **Implementation Recommendations:** District administrator planning guide with phased rollout timeline. At /implementation.
- **Low-Bandwidth Mode:** User-toggleable mode for improved performance.
- **Orientation-MAP-GAP Framework:** System improvement methodology integrated into platform development approach.

## Security Hardening (Completed)
- **Authentication:** All mutating routes (POST/PATCH/DELETE) require `requireAuth` middleware
- **Authorization:** `requireAdmin` checks `user.role` for admin/teacher access; all `/api/admin/` routes protected
- **Mass Assignment:** All `req.body` spreads either use explicit field picking or are wrapped in Zod schema validation
- **Rate Limiting:** AI companion chat rate-limited at 20 requests/minute per user (in-memory)
- **Input Validation:** Attachment uploads validate MIME types; all form submissions validated via Zod schemas
- **Sensitive Routes:** User-specific GET routes (`/api/academy/merit/user/:userId`, `/api/risk-decisions`, `/api/staar/*`) require authentication
- **No Hardcoded Keys:** GIS engine uses environment variables only; no DEMO_KEY fallbacks

## Quality & Accessibility (Completed)
- **Error Boundary:** React ErrorBoundary wraps all routes; crashes show friendly fallback UI
- **Document Titles:** All 30+ pages set descriptive `document.title` via `useEffect`
- **data-testid:** All interactive elements across all pages have `data-testid` attributes
- **Aria Labels:** Icon-only buttons, navigation elements, and sidebar links have proper aria-labels
- **Skip-to-Content:** Keyboard navigation skip link at top of layout
- **Focus Visible:** Global focus-visible ring styles for keyboard navigation
- **Empty States:** Journal, announcements, and marketplace show meaningful empty states with CTAs
- **404 Page:** Polished with navigation links to home, dashboard, and academy
- **Privacy Policy:** COPPA compliance, parental consent, data retention, and third-party sharing sections
- **Console Cleanup:** All `console.log` removed from production server files; only `console.error` retained
- **Content Consistency:** No "NBA Foundation" branding anywhere; "NBA" only appears in educational athlete stories

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Provider-agnostic abstraction layer (server/ai-provider.ts). Default: Google Gemini Flash (gemini-2.0-flash, free via Google AI Studio API key). Also supports OpenAI (gpt-4o-mini) and Replit AI Integrations (gpt-5-nano) as fallbacks.
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API (Socrata), CDC/ATSDR SVI, FBI Crime Data API
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react
- **Fundraising Partner:** UBO
- **Cross-Platform Integration:** Student Support Portal (ISSS)
