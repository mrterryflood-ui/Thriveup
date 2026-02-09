# AI Mastery Academy

## Overview
AI Mastery Academy is an interactive K-12 curriculum platform for AI education. It features a gamified learning journey with 5 progressive mastery levels (Explorer through Master), comprehensive curriculum browsing, lesson viewing, quiz taking with scoring, badge achievements, and progress tracking.

## Architecture
- **Frontend**: React + Vite, shadcn/ui components, Tailwind CSS, wouter routing, TanStack Query
- **Backend**: Express.js on Node, Drizzle ORM with PostgreSQL
- **Database**: PostgreSQL (Neon-backed via Replit)

## Key Pages
- `/` - Landing page with program overview
- `/dashboard` - Student dashboard with progress, points, badges
- `/curriculum` - Browse all 5 levels
- `/curriculum/:levelId` - Level detail with modules
- `/module/:moduleId` - Module detail with lessons, objectives, activities
- `/lesson/:lessonId` - Lesson viewer with content
- `/quiz/:moduleId` - Interactive quiz with scoring and badge awarding
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

## Design Tokens
- Primary: Purple (256 80% 58%) - main brand color
- Accent: Teal (190 80% 44%) - secondary accent
- Font: Plus Jakarta Sans (sans), JetBrains Mono (mono)
- Dark mode supported with class-based toggle

## Recent Changes
- Initial build: Full curriculum platform with 5 levels, 20 modules, lessons, quizzes, badges, and gamification
