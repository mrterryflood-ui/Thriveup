---
name: Trade Sims adaptive growth path
description: Durable design decisions and trust boundaries for mastery gating, weakness tracking, stretch tiers, and tutor history in trade sims.
---

# Trade Sims adaptive growth path

- **Gating rule:** the next day unlocks only when the previous day earned a solo pass (graded rubric pass, or honest completion for lessons with no rubric). Plain completion does NOT unlock. A mastery override on the *target* lesson unlocks it (note recorded) and never cascades.
  **Why:** IGN doctrine — mastery first, but nobody hard-blocked; skips are recorded so coaches can circle back.
- **Grading trust boundary:** clients submit ONLY their canvas (components + connectivity). The server reconstructs the network, re-runs the authoritative solver, and grades the recomputed physics. Client solver output, pass claims, concept tags, and mastery fields are never accepted anywhere. Stretch attempts require a server-recorded standard pass.
  **Why:** the sim solvers and canvas adapters are pure numeric modules, so the server imports them from the client tree — one physics engine, zero drift. Bound node ids/component counts: MNA is O(n²).
  **How to apply:** any future graded/mastery endpoint must re-simulate server-side; anything weaker is forgeable.
- **Weakness tracking:** failed graded attempts increment per-concept counts; a clean pass decays every count by 1 so stale flags fade. Review reps come from a server-side concept registry.
- **Stretch tiers are harder rubric MODES from the same grader family**, registered server-side — graders hardcode thresholds, so "tighter tolerance" means a new mode, not a parameter tweak.
- **Tutor history:** the AI tutor prompt gets recent attempt outcomes + top weak concepts (server-generated tags only, never user text).
- **Migrations quirk:** this project syncs schema via drizzle push; the migrations folder started empty, so `drizzle-kit generate` emits a full-schema baseline that would break existing DBs. Write delta-only idempotent SQL (IF NOT EXISTS guards) instead, and test apply + re-apply inside a rolled-back transaction.
- **React lesson:** two effects sharing one dedupe ref silently starve the second — a single effect must own tier selection for attempt recording.
- Anonymous↔authed continuity: the anon merge also re-points attempt-event rows.
