# Learning Academy (Grades 3-12)

## Overview
Learning Academy is an education platform for students in grades 3-12, focusing on holistic development across six core subjects and an AI Mastery curriculum. It features age-appropriate content, an AI learning companion named Spark with ethical guardrails, and a dedicated Sixth Grade Academy. The platform integrates an entrepreneurship ecosystem, virtual campus building, and real fundraising opportunities for college tuition, fostering community engagement and preparing students for future success. The project aims to provide comprehensive, empathetic, and innovative learning experiences that promote whole-child development and equip students with essential life skills.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction.

## System Architecture
The application uses a React + Vite frontend with shadcn/ui, Tailwind CSS, wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node.js, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled by Replit Auth (OIDC) supporting magic link, Google, and GitHub logins, with user sessions and profiles stored in the database.

Key architectural decisions and features include:
- **Comprehensive Curriculum:** Structured content for subjects and AI mastery levels, with interactive lessons, quizzes, and progress tracking.
- **AI Companions (Spark & Sparky):** Spark is a grade-band-specific AI learning companion (configurable AI provider with SSE streaming, emotional intelligence framework, Socratic questioning, growth mindset, cultural awareness, bilingual support, safety guardrails). Sparky is an adult AI companion for parents and teachers, offering compassionate support without child-safety restrictions, including evidence-based strategies and context-aware conversations. Both link to the AI Creation Studio.
- **AI Creation Studio:** A unified productivity platform with 10 AI-powered tools (Presentation Builder, Video Script Creator, Sales Pitch Builder, Business Plan Generator, Research Assistant, Life Planner, Project Planner, Document Writer, Resume Builder, Brainstorm Studio). Features wizard workflows for seamless project flow between tools (e.g., brainstorm -> business plan -> pitch -> presentation), project import/export, file attachment with text content reading, streaming AI generation, and project saving. Tools are module-gated for students (must complete AI Course modules to unlock) but ungated for adults via Sparky (?mode=adult). At /ai-tools and /ai-tools/:toolKey.
- **Sixth Grade Academy:** An immersive experience including Panther Village (interactive campus landing page), avatar customization, a simulated stock market, a "Build Your Black Campus" project, academic competitions, and a virtual merchandise shop for college tuition fundraising.
- **Career & Mentorship Systems:** Features a Career Explorer, a longitudinal "My Pathway" tracker with portfolio evidence upload, and a Mentor Network for connecting students with professionals, integrated with the MCOE directory.
- **IGN-Thrive™ System:** A structured autonomy and context-aware navigation system for students, featuring a six-domain Thrive Scoring Engine, student self-assessment, GIS Context Engine for external factors, and an Early Warning System with intervention playbooks.
- **Engagement & Progression:** Includes a badge achievement system, detailed progress tracking, daily quests, and a "Panther Power Score" (unified empowerment metric across five categories).
- **Administrative & Support Tools:** Parent & Teacher Dashboards, classroom management, certificate system, student reflection journal, announcements, calendar, student help, and attendance tracking.
- **LMS Course Creator:** Admin-only LearnWorlds-style course management at /academy/course-creator. Multi-step wizard for course creation with 10 categories (Coaching, Creators, Customer Training, Enterprise LMS, Finance, Fitness, Health, Non-profit, Education, Technology). Course editor with Details, Modules & Lessons, and Enrollments tabs. Full CRUD for courses, modules, and lessons with enrollment tracking. DB tables: academy_courses, course_modules, course_lessons, course_enrollments, course_lesson_progress.
- **Accessibility & Responsiveness:** Comprehensive `AccessibilityProvider` with dyslexia-friendly fonts, large text, high contrast, reduced motion, and screen reader optimization. WCAG 2.1 AA compliance and mobile responsiveness are prioritized.
- **Design System:** Utilizes TxEA maroon and silver colors with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode.
- **Risk Management:** A "Risk Decision Tracking" system for financial decisions with configurable thresholds and educational components.
- **Multi-Game Platform (Panther Game Room):** A game lobby with various games, including a fully functional Dominoes game with CPU AI and ELO rating.
- **Internationalization (i18n):** Custom language provider supporting English and Spanish.
- **Implementation Recommendations:** District administrator planning guide with grade-by-grade (6-12) deployment strategy, pre-rollout checklists, AI framework evaluation, open-source AI strategy, cost comparison calculator, and phased rollout timeline. At /implementation.
- **Low-Bandwidth Mode:** User-toggleable mode to strip animations, images, and shadows for improved performance.

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** Provider-agnostic abstraction layer (server/ai-provider.ts). Default: Google Gemini Flash (gemini-2.0-flash, free via Google AI Studio API key). Also supports OpenAI (gpt-4o-mini) and Replit AI Integrations (gpt-5-nano) as fallbacks. School districts can bring their own provider by setting GEMINI_API_KEY, OPENAI_API_KEY, or other provider keys.
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API (Socrata), CDC/ATSDR SVI, FBI Crime Data API
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react
- **Fundraising Partner:** UBO
- **Cross-Platform Integration:** Student Support Portal (ISSS)