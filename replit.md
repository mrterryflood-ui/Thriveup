# Learning Academy (Grades 3-12)

## Overview
Learning Academy is a comprehensive grades 3-12 whole-child education platform. It supports six core subject areas (ELA, Math, Science, Social Studies, Social-Emotional Learning, Wellness/Self-Care) alongside a 5-level AI Mastery curriculum. Content is deeply empathetic and age-appropriate across grade bands (3-5, 6-8, 9-12). Includes Spark, an AI learning companion with strict ethical guardrails.

## Architecture
- **Frontend**: React + Vite, shadcn/ui components, Tailwind CSS, wouter routing, TanStack Query
- **Backend**: Express.js on Node, Drizzle ORM with PostgreSQL
- **Database**: PostgreSQL (Neon-backed via Replit)
- **AI Integration**: OpenAI via Replit AI Integrations (gpt-4o-mini, SSE streaming)
- **i18n**: Custom language provider (English/Spanish) with translation strings
- **Bandwidth Mode**: Low-bandwidth toggle that strips animations, images, and shadows

## Key Pages
- `/` - Landing page with whole-child philosophy, 6 subjects, AI levels, Spark CTA, Austin community section
- `/dashboard` - Student dashboard with progress, points, badges, quick actions
- `/subjects` - Browse all 6 subject areas with grade band filtering
- `/subject/:subjectId` - Subject detail with topics and lessons
- `/curriculum` - Browse all 5 AI curriculum levels
- `/curriculum/:levelId` - Level detail with modules
- `/module/:moduleId` - Module detail with lessons, objectives, activities
- `/lesson/:lessonId` - Lesson viewer with content, interactive activities, and embedded Spark help
- `/quiz/:moduleId` - Interactive quiz with scoring and badge awarding
- `/ai-companion` - Standalone Spark AI learning companion page
- `/achievements` - Badge collection and achievement stats
- `/community` - Austin community access programs (6 equity initiatives)
- `/parents` - Parent digital literacy resources and training modules

## API Routes
- `GET /api/levels` - All curriculum levels
- `GET /api/levels/:id` - Single level
- `GET /api/levels/:id/modules` - Modules for a level
- `GET /api/modules/:id` - Single module
- `GET /api/modules/:id/lessons` - Lessons for a module
- `GET /api/modules/:id/quiz` - Quiz questions for a module
- `POST /api/modules/:id/quiz/submit` - Submit quiz answers
- `GET /api/lessons/:id` - Single lesson
- `POST /api/lessons/:id/complete` - Complete a lesson
- `GET /api/dashboard` - Dashboard data
- `GET /api/achievements` - Badges and achievement stats
- `GET /api/progress` - Student progress
- `GET /api/subjects` - All subjects (optional gradeLevel query param)
- `GET /api/subjects/:id` - Single subject with topics
- `GET /api/subjects/:subjectId/topics/:topicId/lessons` - Lessons for a topic
- `POST /api/ai-companion/chat` - Spark AI chat endpoint (SSE streaming)

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

## Recent Changes
- Added 6 Austin community equity programs (free access, Title I, device lending, offline mode, Spanish, parent literacy)
- Built Community Access page (/community) showcasing all Austin programs
- Built Parent Resources page (/parents) with digital literacy training modules
- Added Spanish language support with i18n system and language toggle
- Added low-bandwidth mode with CSS-based asset stripping
- Updated landing page with Austin community section
- Updated sidebar with Community and Parents navigation links
- Added header controls: language toggle, bandwidth toggle, theme toggle
