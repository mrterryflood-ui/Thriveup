---
name: Data foundation hardening (Phase 1 remediation)
description: Durable rules from the Aug 2026 data-layer hardening — seed idempotency, uniqueness constraints, award-once semantics.
---

## Rules
- Content seeds (AI academy, workforce lessons) are idempotent upserts on explicit IDs (`onConflictDoUpdate` targeting `id`). **Reseeding is the sanctioned way to push content fixes to users** — it repairs drift (a live reseed once restored 4 missing lessons + 1 module).
  - **Why:** blind-insert seeds made reseeding impossible, blocking every curriculum fix from shipping.
  - **How to apply:** any new seed must use natural-key upserts; run `npx tsx scripts/verify-seed-idempotency.ts` (registered validation step `seed-idempotency`) after touching seeds. The upsert `set` map MUST use real schema column names — drizzle won't catch mistakes because seeds pass `db: any`; a wrong column only fails at runtime on actual conflict.
- Completion/badge/membership tables have unique indexes (uq_completed_lessons_*, uq_earned_badges_*, uq_classroom_members_*, uq_student_progress_user partial on user_id NOT NULL). All writers use `onConflictDoNothing` + fetch-on-conflict. `completeLesson` returns `newlyCompleted` — **points are awarded only when true**; never award on a repeat completion.
- `typecheck` validation step is a no-regression gate against a hardcoded baseline (85 errors as of Aug 2026). Lower the baseline in the command whenever the count drops.
- Guest rows in student_progress keep NULL user_id and are exempt from uniqueness — do not "fix" that.
- Runtime lesson content comes from DB rows, not source files: content seeds must upsert every boot (no exists-check fast path), and content edits are only "done" once the served API response reflects them.
  - **Why:** an exists-check fast path once left corrected curriculum stale after restart — drift was invisible because source files looked right.
