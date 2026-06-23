---
name: AI Curriculum Interactive Activities
description: Architecture for the 5 real interactive activity types that replaced passive sorting/matching in the AI literacy curriculum.
---

## Activity types added

| Type | File | Teaches |
|------|------|---------|
| `prompt-lab` | `client/src/components/activities/prompt-lab.tsx` | Prompt engineering via live AI calls; modes: basic (textarea) and craft (CRAFT fields) |
| `arcb-evaluator` | `client/src/components/activities/arcb-evaluator.tsx` | ARCB framework: rate Accuracy/Relevance/Completeness/Bias with slider, compare to expert |
| `hallucination-spotter` | `client/src/components/activities/hallucination-spotter.tsx` | Click-to-flag suspicious claims, scored on precision+recall |
| `bias-detective` | `client/src/components/activities/bias-detective.tsx` | Side-by-side response comparison, student identifies biased one + names bias type |
| `ai-or-human` | `client/src/components/activities/ai-or-human.tsx` | Classify 6 text samples as AI-generated or human-written, with per-sample explanations |

## ActivityRenderer location
`client/src/pages/lesson-viewer.tsx` — `ActivityRenderer` switch dispatches by `data.type`.

## Backend endpoint
`POST /api/lesson-lab/run` — no auth required, rate-limited 20/hour/IP.
Uses `generateAIResponse` from `ai-provider.ts` with `withEthicalPreamble` applied.
Takes `{ prompt, systemPrompt? }`, returns `{ response: string }`.

## Migration pattern
`server/seed-ai-activity-migration.ts` — `migrateAIActivityTypes(db)` called from `server/storage.ts` after every seed run.
Uses explicit `UPDATE` by lesson ID so it works on both fresh and existing DBs.
Upgraded 11 lessons on first run.

**Why:** All AI lessons previously used sorting/matching — passive, no real AI interaction. Migration applies new activity types per-lesson using UPDATE (not re-insert), so it's idempotent and safe to run on every restart.

**How to add more:** Add to the `UPDATES` array in `seed-ai-activity-migration.ts` with the lesson ID, new `activityType`, and rich `activityData` JSONB. The ActivityRenderer switch will need a new case if it's a genuinely new component type.
