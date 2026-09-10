---
name: User Journey Spine
description: The shared userJourneys table and write/read pattern that breaks the tool silo architecture.
---

# User Journey Spine

## Problem it solves
All ThriveUp tools were siloed — Navigator, Benefits Screener, CHW referrals, and YHSI each held separate data models with no cross-tool visibility. A user identified in Navigator as needing housing would have to re-explain themselves when reaching the Benefits Screener.

## Architecture
`user_journeys` table (primary key: `userId`) — one row per authenticated user, updated by every tool, read by personal context.

### Schema columns
- `userId` — primary key
- `lastKnownGeography` — ZIP or county FIPS
- `identifiedNeeds` — JSONB string[] (merged across all tools)
- `screenerFlags` — JSONB Record<string, boolean> (from Benefits Screener submit)
- `activeReferralIds` — JSONB string[] (from CHW referral create)
- `yhsiStatus` — varchar (from YHSI record update)
- `communityContextAt` — timestamp (when community context was last warmed)
- `updatedAt` — auto-updated

### Write hooks (where each tool writes)
1. **Navigator** (`server/navigator-routes.ts`): After every Navigator message that surfaces needs, fire-and-forget upsert of `identifiedNeeds` using JSONB union merge:
   ```sql
   jsonb_agg(DISTINCT elem FROM jsonb_array_elements(existing || excluded))
   ```
   The write is non-blocking — wraps `.then().catch()` so Navigator SSE is never delayed.

2. **Benefits Screener** — not yet wired; should upsert `screenerFlags` on submit.
3. **CHW Referral** — not yet wired; should upsert `activeReferralIds` on create.
4. **YHSI** — not yet wired; should upsert `yhsiStatus` on record update.

### Read hook
`server/personal-context.ts` reads `userJourneys` at the START of personal context build (before Navigator conversations section). Surfaces: identified needs, geography, YHSI status, screener flags, active referral count. All wrapped in a try/catch — non-fatal if table is empty.

## Migration
`scripts/migrate-journey-childcore.ts` — creates both `user_journeys` and `childcore_county_metrics` tables idempotently. Already run.

**Why:**
ChildCORE's architecture showed the causal-chain model: a shared journey spine that every tool reads before acting and writes to after learning something new.

**How to apply:**
Any new tool that captures user context should import `userJourneys` from `@shared/schema` and upsert after capturing. Read from `personal-context.ts` is automatic — no new code needed there since the read hook is already in place.
