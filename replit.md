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
    - **Panther Village:** Interactive visual campus landing page (/academy) with clickable building cards linking to all features, student avatar display, classmates section, community activity feed, and quick stats bar. Replaces the old dashboard hub.
    - **Avatar Customization:** Sims-inspired virtual avatar creation with skin tone, hair, outfit, accessories, and background.
    - **Virtual Economy:** Simulated stock market with 10 stocks, virtual wallets, and transaction tracking.
    - **Campus Builder:** A "Build Your Black Campus" project with funding and phased development.
    - **Competitions & Houses:** Academic/cultural competitions and a Ron Clark/Harry Potter-inspired house points system.
    - **Dream Design:** Holistic resume building and goal setting.
    - **Merchandise Shop:** Integration with UBO for real college tuition fundraising through merchandise sales.
    - **Choose Your Own Adventure:** Branching CYOA scenarios teaching financial literacy, leadership, investing, and community building through choices and consequences with empathy and setback recovery.
    - **Panther Marketplace:** Peer-to-peer commerce where students list items/services, buy from each other, with wallet integration, content moderation filter, community guidelines, and student report/flag system for safety.
    - **Admin Command Center:** Dashboard for teachers/admins to monitor student metrics, activity feed, wallet balances, Panther Power scores, add intervention notes, and review flagged content reports.
    - **Career Explorer:** 50+ career fields across 12 categories equally representing college, trade school, technical certification, military, and entrepreneurship paths. Students explore careers and save interests.
    - **My Pathway (Longitudinal Career Tracking):** Grade 6-12+ milestone tracker with portfolio evidence uploads (multi-file, any format via presigned URLs), revision workflows with parent/faculty approval (3x/year limit), and progress visualization.
    - **Mentor Network:** Browse/request mentors from local professionals; admin approval workflow, session scheduling, and mentor-student matching by career interest. 8 seeded mentor profiles across Technology, Skilled Trades, Military, Healthcare, Entrepreneurship, Law & Public Safety.
    - **Mentor & Partner Finder:** MCOE-integrated discovery page linking to minoritycenterofexcellence.com directory (112K+ businesses), browse by category and ownership type, mentor outreach form, partnership resources.
    - **Admin Longitudinal Dashboard:** District-scale view of all students' career pathway progress, milestone completion rates, revision approval queue, and cohort analytics.
    - **Admin Student Wizards:** Three wizard types (Initial Setup, Career Pathway Builder, Quarterly Review) for collaborative staff-student configuration of learning style, pace, career interests (up to 5), Panther Power focus areas, feature access toggles, mentor preferences, and staff-only support notes.
    - **Multi-File Upload Component:** Reusable upload system supporting any file format with presigned URL flow, used across portfolio evidence, mentor documents, and more.
    - **Vibe Coding & 3D Printing Module:** AI curriculum Level 3 Module 5 emphasizing "Foundation First" philosophy — AI amplifies existing knowledge, not replaces it.
    - **Multi-Game Platform (Panther Game Room):** Game lobby at /academy/games with 6 game slots (Dominoes playable, Checkers/Chess/Memory/Spades/Strategy Tiles coming soon). Dominoes game with full Block Dominoes rules, CPU AI (4 difficulty levels: Beginner/Intermediate/Pro/Expert), ELO rating system, special timer/draw mechanics (draw within remaining time, +15s bonus when drawing with <=1s left). Game sessions persisted via game_sessions/game_players/player_ratings/play_sessions tables. Admin play-time monitoring (35+ minute flag).
- **Internationalization (i18n):** Custom language provider supporting English and Spanish.
- **Low-Bandwidth Mode:** User-toggleable mode to strip animations, images, and shadows for improved performance on limited connections.
- **Panther Power Score:** Unified empowerment metric across 5 categories (Education, Character, Leadership, Entrepreneurship, Community) with levels and titles.
- **Daily Quests:** AI-generated daily cross-feature challenges that reward Panther Power points.
- **Life Lessons Engine:** Business-to-life parallel universe mapping each Academy activity to real-world skills with reflections.
- **AI Mentor Wizards:** Spark-powered step-by-step guided onboarding for every Academy feature (10 wizard types).
- **Interdependent Universe:** Stock trades earn entrepreneurship power, merit awards earn leadership power, competition entries earn education power, campus funding earns community power, dream profiles earn character power.
- **IGN-Thrive™ System:** Structured Autonomy + Context-Aware Navigation System for 6-12+ students:
    - **Thrive Scoring Engine:** Six-domain scoring (Learning/Engagement 25%, Executive Function 20%, Belonging 15%, Wellbeing 10% opt-in, Context Load 15%, Protective Factors 15%) producing 0-100 scores with trend lines and composite formula.
    - **Student Self-Assessment:** Opt-in daily check-in system measuring energy, stress, focus, belonging, confidence, mood with reflection prompts and support requests. Feeds into Thrive Domains D (Wellbeing) and B (Executive Function).
    - **GIS Context Engine:** CDC PLACES (public health), CDC/ATSDR SVI (social vulnerability), FBI Crime Data API integration. Caches public data per census tract/ZCTA, computes Context_Load_Index. Privacy-first: no raw addresses stored.
    - **Early Warning System:** Watch/Support/Stabilize flag classification based on multi-domain decline detection, slope analysis, engagement drift, decision pattern risk, and context shock. Each flag produces 4-part explainable cards (what changed, why it matters, navigation action, 30-day SMART target).
    - **Intervention Playbooks:** 9 navigation action playbooks (3 flag levels x 3 trigger classes) with objectives, conversation scripts, resource options, follow-up cadence, and success indicators.
    - **Thrive Dashboard:** Student view with composite score visualization, six domain cards with progress bars and trend indicators, 90-day history chart, and active early warning flags.
- **Internationalization (i18n):** Custom language provider supporting English and Spanish.
- **Low-Bandwidth Mode:** User-toggleable mode to strip animations, images, and shadows for improved performance on limited connections.
- **Parent Support Alerts:** Parent dashboard shows prominent alert banners when a student's self-assessment indicates they need support, with context about mood/energy/stress levels and direct links to details.
- **Student Welcome Onboarding:** 6-step guided onboarding dialog on first visit to Panther Village, introducing avatar, careers, Panther Power, self-assessments. Tracked via localStorage.
- **Student Reflection Journal:** Daily/weekly free-form journaling with mood tracking (happy/neutral/focused/tired/excited). Students write reflections on learning, goals, and feelings. Accessible at /academy/journal.
- **Announcements Board:** Admin-created announcements with categories (general/important/event/reminder), pinning support, and delete capability. Visible to all users at /academy/announcements.
- **Progress Report:** Printable one-page student progress snapshot showing academic progress, Panther Power scores, Thrive score, and earned achievements. Print-friendly layout at /academy/progress-report.
- **Calendar / Events:** Central event calendar with Today/This Week/Upcoming grouping. Admin creates events with categories (school/competition/mentor/quest/special). At /academy/calendar.
- **Student Help / FAQ:** Static 10-section accordion-based help page covering all Academy features in student-friendly language. At /academy/help.
- **Attendance Tracking:** Auto-logs student logins, admin-only dashboard showing login patterns, streaks, and daily summaries. At /academy/attendance.
- **Privacy Policy:** Comprehensive 11-section privacy page covering FERPA/COPPA compliance, GIS data practices, wellbeing data handling, access controls, third-party services, and parent rights. Accessible at /privacy.
- **Mobile Responsive:** All Academy pages optimized for 375px phone screens with responsive grids, adaptive padding, and scaled typography.
- **Design System:** Utilizes TxEA maroon and silver colors, with Plus Jakarta Sans and JetBrains Mono fonts, supporting dark mode. Branding: Texas Empowerment Academy Panthers, "Education, Character, Leadership".

## External Dependencies
- **Database:** PostgreSQL (Neon-backed)
- **AI Integration:** OpenAI (gpt-4o-mini model)
- **Authentication:** Replit Auth (OIDC)
- **GIS Data Sources:** CDC PLACES API (Socrata), CDC/ATSDR SVI, FBI Crime Data API
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query
- **Routing:** wouter
- **Icons:** lucide-react (for badges)
- **Fundraising Partner:** UBO (for Sixth Grade Academy merchandise)