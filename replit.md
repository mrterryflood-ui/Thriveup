# Learning Academy (Grades 3-12)

## Overview
Learning Academy is a comprehensive education platform for grades 3-12, focusing on whole-child development across six core subjects (ELA, Math, Science, Social Studies, Social-Emotional Learning, Wellness/Self-Care) and a 5-level AI Mastery curriculum. It features empathetic, age-appropriate content for grade bands 3-5, 6-8, and 9-12, and includes Spark, an AI learning companion with ethical guardrails. The platform also integrates a unique Sixth Grade Academy, an entrepreneurship ecosystem with simulated fintech, virtual campus building, and real fundraising opportunities for college tuition, fostering a holistic and community-engaged learning experience.

## User Preferences
The agent should prioritize iterative development, clearly explaining major changes before implementation. It should focus on delivering high-quality, well-tested code, and use clear, simple language when describing technical concepts. Avoid making changes to sensitive configuration files or core architectural components without explicit instruction.

## System Architecture
The application is built with a React + Vite frontend utilizing shadcn/ui, Tailwind CSS, wouter for routing, and TanStack Query for data management. The backend is an Express.js server on Node, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled by Replit Auth (OIDC) supporting magic link, Google, and GitHub logins, with user sessions and profiles stored in the database.

Key features include:
- **Comprehensive Curriculum Delivery:** Structured content for subjects and AI mastery levels, with interactive lessons, quizzes, and progress tracking.
- **Spark AI Companion:** An AI learning assistant powered by gpt-4o-mini, integrated via SSE streaming, offering age-appropriate, growth-mindset-oriented support.
- **Collaborative Features:** Lesson comments, reactions, and module-specific study tips with upvoting, fostering community engagement.
- **Achievement System:** A visually rich badge system (28 badges across categories/rarities) with celebration animations and an achievements dashboard.
- **Progress Tracking:** Detailed user progress, point accumulation, streak tracking, and quiz scoring.
- **Parent & Teacher Dashboards:** Dedicated interfaces for parents to monitor child's progress and for teachers to manage classrooms and track student performance.
- **Classroom Management:** Teachers can create and manage classrooms, inviting students to track their progress.
- **Certificate System:** Automated certificate issuance for level completion, with printable views.
- **Sixth Grade Academy:**
    - **Avatar Customization:** Sims-inspired virtual avatar creation.
    - **Virtual Economy:** Simulated stock market with 10 stocks, virtual wallets, and transaction tracking.
    - **Campus Builder:** A "Build Your Black Campus" project with funding and phased development.
    - **Competitions & Houses:** Academic/cultural competitions and a Ron Clark/Harry Potter-inspired house points system.
    - **Dream Design:** Holistic resume building and goal setting.
    - **Merchandise Shop:** Integration with UBO for real college tuition fundraising through merchandise sales.
- **Internationalization (i18n):** Custom language provider supporting English and Spanish.
- **Low-Bandwidth Mode:** User-toggleable mode to strip animations, images, and shadows for improved performance on limited connections.
- **Panther Power Score:** Unified empowerment metric across 5 categories (Education, Character, Leadership, Entrepreneurship, Community) with levels and titles.
- **Daily Quests:** AI-generated daily cross-feature challenges that reward Panther Power points.
- **Life Lessons Engine:** Business-to-life parallel universe mapping each Academy activity to real-world skills with reflections.
- **AI Mentor Wizards:** Spark-powered step-by-step guided onboarding for every Academy feature (10 wizard types).
- **Interdependent Universe:** Stock trades earn entrepreneurship power, merit awards earn leadership power, competition entries earn education power, campus funding earns community power, dream profiles earn character power.
- **Internationalization (i18n):** Custom language provider supporting English and Spanish.
- **Low-Bandwidth Mode:** User-toggleable mode to strip animations, images, and shadows for improved performance on limited connections.
- **Design System:** Utilizes TxEA maroon and silver colors, with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode. Branding: Texas Empowerment Academy Panthers, "Education, Character, Leadership".

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** OpenAI (gpt-4o-mini model)
- **Authentication:** Replit Auth (OIDC)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react (for badges)
- **Fundraising Partner:** UBO (for Sixth Grade Academy merchandise)