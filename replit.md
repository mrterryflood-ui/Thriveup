# Learning Academy (PreK-12)

## Overview
Learning Academy is a comprehensive PreK-12 whole-child education platform. It supports six core subject areas (ELA/Phonics, Math, Science, Social Studies, Social-Emotional Learning, Wellness/Self-Care) alongside a 5-level AI Mastery curriculum. Content is deeply empathetic and age-appropriate across grade bands (PreK-K, 1-2, 3-5, 6-8, 9-12). Includes Spark, an AI learning companion with strict ethical guardrails.

## Architecture
- **Frontend**: React + Vite, shadcn/ui components, Tailwind CSS, wouter routing, TanStack Query
- **Backend**: Express.js on Node, Drizzle ORM with PostgreSQL
- **Database**: PostgreSQL (Neon-backed via Replit)
- **AI Integration**: OpenAI via Replit AI Integrations (gpt-4o-mini, SSE streaming)

## Key Pages
- `/` - Landing page with whole-child philosophy, 6 subjects, AI levels, Spark CTA
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
1. ELA & Phonics - Reading, writing, language arts
2. Mathematics - Number sense, problem solving
3. Science - Observation, experiments, natural world
4. Social Studies - Community, history, geography
5. Social-Emotional Learning - Self-awareness, empathy, relationships
6. Wellness & Self-Care - Physical health, mindfulness, nutrition

## Grade Bands
- PreK-K: Simple/warm language, visual activities (letter tracing, matching)
- 1-2: Concrete examples, gentle guidance
- 3-5: Clear explanations, real-world connections
- 6-8: Relatable analogies, growing independence
- 9-12: Direct/honest, nuance and complexity

## Interactive Activities
- Letter Tracing (PreK-K)
- Matching Games (PreK-2)
- Sorting Activities (K-3)
- Breathing Exercises (all grades, SEL/Wellness)
- Emotion Check-ins (all grades, SEL)

## Design Tokens
- Primary: Purple (256 80% 58%) - main brand color
- Accent: Teal (190 80% 44%) - secondary accent
- Font: Plus Jakarta Sans (sans), JetBrains Mono (mono)
- Dark mode supported with class-based toggle

## Recent Changes
- Expanded from AI-only to whole-child PreK-12 platform with 6 subject areas
- Built Spark AI learning companion with ethical guardrails and SSE streaming
- Added interactive activity components (tracing, matching, sorting, breathing, emotion check)
- Transformed landing page to show whole-child philosophy
- Updated dashboard with Subjects, Spark, AI Curriculum, Achievements quick actions
- Integrated Spark into lesson viewer as collapsible help section
