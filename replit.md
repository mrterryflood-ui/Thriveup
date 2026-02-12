# Learning Academy (Grades 3-12)

## Overview
Learning Academy is a comprehensive grades 3-12 whole-child education platform. It supports six core subject areas (ELA, Math, Science, Social Studies, Social-Emotional Learning, Wellness/Self-Care) alongside a 5-level AI Mastery curriculum. Content is deeply empathetic and age-appropriate across grade bands (3-5, 6-8, 9-12). Includes Spark, an AI learning companion with strict ethical guardrails.

## Architecture
- **Frontend**: React + Vite, shadcn/ui components, Tailwind CSS, wouter routing, TanStack Query
- **Backend**: Express.js on Node, Drizzle ORM with PostgreSQL
- **Database**: PostgreSQL (Neon-backed via Replit)
- **AI Integration**: OpenAI via Replit AI Integrations (gpt-4o-mini, SSE streaming)
- **Auth**: Replit Auth (OIDC) with magic link/Google/GitHub login
- **i18n**: Custom language provider (English/Spanish) with translation strings
- **Bandwidth Mode**: Low-bandwidth toggle that strips animations, images, and shadows

## Authentication
- Replit Auth with OIDC (magic link, Google, GitHub login)
- Auth routes: /api/login, /api/logout, /api/auth/user
- User sessions stored in `sessions` table
- Users table: `users` with id, email, firstName, lastName, profileImageUrl
- Auth hook: `client/src/hooks/use-auth.ts` with useAuth()
- Write endpoints (quiz submit, lesson complete, comments, reactions, tips) require auth via requireAuth middleware
- Read endpoints (subjects, levels, modules, lessons) are public for browsing
- Progress is user-bound via userId in studentProgress table

## Key Pages
- `/` - Landing page with whole-child philosophy, 6 subjects, AI levels, Spark CTA, Austin community section
- `/dashboard` - Student dashboard with progress, points, badges, quick actions
- `/subjects` - Browse all 6 subject areas with grade band filtering
- `/subject/:subjectId` - Subject detail with topics and lessons
- `/curriculum` - Browse all 5 AI curriculum levels
- `/curriculum/:levelId` - Level detail with modules
- `/module/:moduleId` - Module detail with lessons, objectives, activities, study tips
- `/lesson/:lessonId` - Lesson viewer with content, interactive activities, embedded Spark help, comments/reactions
- `/quiz/:moduleId` - Interactive quiz with scoring and badge awarding
- `/ai-companion` - Standalone Spark AI learning companion page
- `/achievements` - Badge collection with visual badges, category/rarity filters, celebration animations
- `/community` - Austin community access programs (6 equity initiatives)
- `/parents` - Parent digital literacy resources and training modules
- `/parents/dashboard` - Parent progress dashboard showing child's scores, completion, recommendations
- `/curriculum-documents` - Browse, create, and manage curriculum alignment documents
- `/curriculum-documents/new` - Create new curriculum document
- `/curriculum-documents/:id` - View/edit a single curriculum document

## API Routes
- `GET /api/levels` - All curriculum levels
- `GET /api/levels/:id` - Single level
- `GET /api/levels/:id/modules` - Modules for a level
- `GET /api/modules/:id` - Single module
- `GET /api/modules/:id/lessons` - Lessons for a module
- `GET /api/modules/:id/quiz` - Quiz questions for a module
- `POST /api/modules/:id/quiz/submit` - Submit quiz answers (auth required)
- `GET /api/lessons/:id` - Single lesson
- `POST /api/lessons/:id/complete` - Complete a lesson (auth required)
- `GET /api/dashboard` - Dashboard data
- `GET /api/achievements` - Badges and achievement stats
- `GET /api/progress` - Student progress
- `GET /api/subjects` - All subjects
- `GET /api/subjects/:id` - Single subject with topics
- `POST /api/ai-companion/chat` - Spark AI chat endpoint (SSE streaming)
- `GET /api/lessons/:lessonId/comments` - Lesson comments
- `POST /api/lessons/:lessonId/comments` - Add comment (auth required)
- `GET /api/lessons/:lessonId/reactions` - Reaction counts
- `POST /api/lessons/:lessonId/reactions` - Add reaction (auth required)
- `GET /api/modules/:moduleId/tips` - Study tips
- `POST /api/modules/:moduleId/tips` - Add tip (auth required)
- `POST /api/tips/:tipId/upvote` - Upvote a tip
- `GET /api/curriculum-documents` - All curriculum documents
- `POST /api/curriculum-documents` - Create document
- `PATCH /api/curriculum-documents/:id` - Update document
- `DELETE /api/curriculum-documents/:id` - Delete document
- `GET /api/auth/user` - Current authenticated user
- `GET /api/login` - Begin OIDC login
- `GET /api/logout` - Logout

## Collaborative Features
- Lesson Comments: Users can comment on lessons (auth required), view all comments
- Lesson Reactions: 4 reaction types (helpful, inspiring, challenging, fun) with toggle
- Study Tips: Users share tips per module, upvoting system
- All write operations require authentication, read operations are public
- Components: `client/src/components/lesson-comments.tsx`, `client/src/components/study-tips.tsx`

## Badge System
- 28 badges across categories (skill, character, milestone) and rarities (common, uncommon, rare, legendary)
- Visual BadgeIcon component: `client/src/components/badge-icon.tsx`
  - Category-based gradient backgrounds (skill=blue, character=pink, milestone=amber)
  - Rarity-based glow effects (common, uncommon=silver, rare=gold, legendary=rainbow animated)
  - Maps each badge to a specific lucide-react icon
  - Three sizes (sm, md, lg)
- Celebration overlay: `client/src/components/celebration.tsx`
  - Full-screen animated confetti on badge earn / level up
  - Auto-dismiss after 3s
  - useCelebration hook
- Achievements page: category/rarity filter tabs, progress bars, earned/unearned visual states

## Seed Data
- `server/seed-ai.ts` - AI curriculum levels, modules, badges, quiz questions
- `server/seed-subjects.ts` - Subject areas and subject modules
- `server/seed-lessons.ts` - 92+ lessons with rich content and interactive activities
- `server/seed-curriculum-docs.ts` - 93+ curriculum documents (student guides, teacher guides, rubrics)
- All seeds use onConflictDoNothing() for safe re-runs

## Spark AI Companion
- Model: gpt-4o-mini via OpenAI
- Streaming: Server-Sent Events (SSE)
- Guardrails: Never gives direct answers, age-appropriate language per grade band, growth mindset, content safety, empathetic responses, redirects off-topic
- Available: Standalone page (/ai-companion), embedded in lesson viewer, dashboard quick action

## Subject Areas
1. ELA - Reading, writing, language arts
2. Mathematics - Number sense, problem solving
3. Science - Observation, experiments, natural world
4. Social Studies - Community, history, geography
5. Social-Emotional Learning - Self-awareness, empathy, relationships
6. Wellness & Self-Care - Physical health, mindfulness, nutrition

## Grade Bands
- 3-5: Clear explanations, real-world connections
- 6-8: Relatable analogies, growing independence
- 9-12: Direct/honest, nuance and complexity

## Interactive Activities
- Matching Games (3-5+)
- Sorting Activities (3-5+)
- Breathing Exercises (all grades, SEL/Wellness)
- Emotion Check-ins (all grades, SEL)
- Writing Prompts
- Discussion Questions

## Austin Community Access Programs
1. Free & Subsidized Access - Income-based free/reduced access for Austin families
2. Title I School Partnerships - Integration with Austin ISD Title I schools
3. Device Lending Program - Chromebook/tablet lending through community centers
4. Offline & Low-Bandwidth Mode - Content caching, stripped UI for unreliable internet
5. Spanish Language Support - Full i18n with English/Spanish toggle
6. Parent Digital Literacy - Training modules, workshops, tech support for parents

## i18n System
- Provider: `client/src/lib/i18n.tsx` with LanguageProvider and useLanguage hook
- Translations: `client/src/lib/translations.ts` with en/es translation strings
- Language toggle in header (Globe icon)
- Persisted to localStorage

## Low-Bandwidth Mode
- Provider: `client/src/lib/bandwidth-mode.tsx` with BandwidthProvider
- Toggle in header (Wifi/WifiOff icon)
- CSS class `low-bandwidth` on document root strips animations, shadows, images
- Persisted to localStorage

## Design Tokens
- Primary: Purple (256 80% 58%) - main brand color
- Accent: Teal (190 80% 44%) - secondary accent
- Font: Plus Jakarta Sans (sans), JetBrains Mono (mono)
- Dark mode supported with class-based toggle

## Progress Tracking
- Per-user progress via userId in studentProgress table
- Streak tracking: daily login streak with lastActiveDate, longestStreak
- Points earned: 50 per lesson, 100 for passing quiz, 25 for failing quiz
- Badges auto-awarded at milestones (first_steps at 1 lesson, curious_mind at 3, etc.)
- Quiz scoring with pass threshold of 70%

## Parent Dashboard
- Page: `/parents/dashboard`
- Overview cards: Total Points, Lessons Completed, Quizzes Completed, Streak, Avg Score
- Progress by subject area visualization
- Recent activity (earned badges)
- Recommendations and tips for parents

## Recent Changes
- Added Replit Auth with OIDC (magic link/Google/GitHub login)
- User-bound progress tracking with streak days and longest streak
- Protected write endpoints with requireAuth middleware
- Generated 92+ lessons with rich content and interactive activities across all 31 modules
- Generated 93+ curriculum documents (student guides, teacher guides, rubrics) for all modules
- Built visual badge system with BadgeIcon component, category/rarity styling, celebration animations
- Added achievements page with category/rarity filters and progress tracking
- Built parent progress dashboard with overview stats, subject progress, recommendations
- Added collaborative features: lesson comments, reactions (4 types), study tips with upvoting
- Auth-aware UI: login prompts for unauthenticated users on write actions
- Updated sidebar with user profile, streak display, login/logout buttons
