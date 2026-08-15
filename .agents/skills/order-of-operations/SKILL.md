---
name: order-of-operations
description: Five-Phase Order of Operations doctrine — the mandatory front-end (environmental scan + backward planning/stakeholder red-team) that must precede ADIS's Stage 2 BUILD. Agnostic doctrine, adopted system-wide here. Load before any build cycle that touches an unfamiliar subsystem, a new external dataset/methodology, or a multi-stakeholder feature. Authored with Dr. Terry D. Flood, 2026-08-15.
---

# Five-Phase Order of Operations

**Status:** Agnostic doctrine — portable to any agent/system. Adopted here as a
mandatory extension to ADIS v4's Stage Verifier pipeline
(`.agents/skills/platform-dna/SKILL.md`). Where this doctrine is silent, ADIS
v4 governs; where they overlap (Phases 3–5 vs. ADIS Stages 2–6), this file
is the authoritative sequencing and ADIS is the authoritative mechanics.

**Why this exists:** ADIS v4's Stage Verifier pipeline assumes the environment
is already understood and the plan is already sound before Stage 2 BUILD
starts. In practice that assumption is the failure point — scaffolding gets
built on an environment nobody actually surveyed, or a plan nobody red-teamed
from the user's seat. This doctrine makes the survey and the red-team
mandatory, named, and sequenced, instead of implicit.

**Governing metaphor:** you don't pour a foundation before you've read the
site survey and the architect's plan. Phase 1–2 is the survey and the plan.
Phase 3–5 is pouring the foundation, building the building, and the
inspection that lets the *next* building go up faster because this one was
built right.

---

## Phase 1 — Environmental Compliance & Layout (the site survey)

Before any plan exists, understand the ground truth:

1. **Vision** — what is the actual desired end-state, in the requester's own
   words, not a paraphrase that drifts from it.
2. **In-state** — what does the current state actually look like, verified
   against the live system (data, code, docs) this session — not memory,
   not the last session's notes.
3. **Current operating system** — what mechanisms, pipelines, schemas,
   conventions, and constraints already govern this subsystem. What already
   works and must not be broken.
4. **Barriers and facilitators** — implementation-science framing (CFIR-style):
   what will make this land, what will make it fail, at the technical,
   organizational, and stakeholder level.
5. **Differences within differences** — this is not just "does the
   intervention work on average." Stratify: does it work differently across
   stakeholder groups, geographies, or subpopulations? A plan that only
   measures the average effect can hide a harmful or void effect on a
   specific group. Surface those splits explicitly before planning, not
   after shipping.

**Exit criterion:** you can state the vision, the in-state, the operating
constraints, the known barriers/facilitators, and the known stakeholder
splits — each traceable to something read or verified this session, not
recalled. If you cannot state one of these five with a source, Phase 1 is
not done.

## Phase 2 — Planning for That Environment (the architect's plan)

1. **Concentrated synthesis** — deliberately turn the raw Phase 1 findings
   into a plan; do not skip straight from scan to code. This is the
   "meditation" step: unfiltered understanding becomes structured intent.
2. **Lines of effort / lines of operation** — decompose the plan into its
   independent workstreams (LOEs) and the sequenced operations within each
   (LOOs). Name dependencies between them explicitly.
3. **Plan backward from the end-state** — start from the desired final state
   (Phase 1's vision) and work backward to the current state, rather than
   forward from what's easiest to build first. This surfaces prerequisites
   a forward plan misses.
4. **Stakeholder red-team, before build** — walk the plan through every
   stakeholder's seat, individually and holistically: end user, UCD/UX/UI,
   operator, reviewer, downstream integrator. This is ADIS's Stage 5
   EXTERNAL REVIEW pulled forward — done *before* Stage 2 BUILD, not only
   after. Include interoperability needs (what other systems/data this plan
   must speak to) as one of the seats.
5. **Measure twice** — an independent second pass over the plan (a different
   angle or a different reviewer) before Phase 3 starts. This is not the
   same person re-reading their own plan.

**Exit criterion:** a written plan with named LOEs/LOOs, an explicit
backward-derived critical path, and a documented pass through each
stakeholder seat — including any objection raised and how it was resolved
or explicitly deferred with a reason.

## Phase 3 — Foundational & Scaffolding
Build the skeleton only: schema, contracts, core primitives, acceptance
tests. Nothing user-facing yet. Maps to ADIS Stage 2 BUILD, first pass.
A scaffolding step that skips Phase 1–2 is building on an unsurveyed site.

## Phase 4 — Complete Building
Build the entire thing on that scaffold through to a real, working state.
Maps to ADIS Stage 2 BUILD (completed) → Stage 3 SCRIMMAGE (adversarial
self-review of the diff) → Stage 4 GAUNTLET (every validation gate green,
nothing softened — C9).

## Phase 5 — Architect Review & Closing
After-action review plus every ADIS code-review step already defined:
Stage 5 EXTERNAL REVIEW (isolated architect pass; blockers fixed in-session,
everything else logged to `.agents/residuals.md` with severity + SLA) and
Stage 6 FILM REVIEW (session summary; generalizable lessons promoted to
`.agents/memory/`). Because Phases 1–2 already surveyed the environment and
red-teamed the plan, this pass finds narrower, cheaper defects — and the
*next* iteration on this subsystem starts from a sound foundation instead of
re-discovering the same barriers.

---

## How Phase 1–2 map onto ADIS Stage Verifier

| This doctrine | ADIS v4 Stage Verifier |
|---|---|
| Phase 1 (environmental scan) | precedes / feeds Stage 0 INGEST + Stage 1 FILM STUDY |
| Phase 2 (backward plan + stakeholder red-team) | precedes Stage 2 BUILD; pulls Stage 5's review posture forward |
| Phase 3 (scaffolding) | Stage 2 BUILD, first pass |
| Phase 4 (complete build) | Stage 2 BUILD (complete) → Stage 3 SCRIMMAGE → Stage 4 GAUNTLET |
| Phase 5 (review & close) | Stage 5 EXTERNAL REVIEW → Stage 6 FILM REVIEW |

## When to invoke this doctrine

Mandatory before Phase 3/4 build work when any of these are true:
- The subsystem or dataset is new to this codebase (no existing case law in
  `.agents/memory/` covers it).
- The feature has more than one stakeholder type with potentially
  conflicting needs.
- A methodological choice (which formula, which threshold, which data
  source) has more than one defensible answer and no prior decision exists.

Not required for small, well-precedented changes (a bugfix, a copy change,
a one-file addition following an established pattern) — Phase 1–2 for those
is the existing "read the file, check the route" discipline already in
Fable Standard Rule 1, not a new ceremony.

## Record-keeping

Phase 1–2 output is written before Phase 3 starts, either inline in the
conversation (for small scopes) or as a `.agents/memory/<topic>.md` /
`.local/tasks/` artifact (for scopes large enough to span sessions). It must
name: the vision, the in-state sources checked, the barriers/facilitators
found, the stakeholder splits identified, the LOEs/LOOs, the backward
critical path, and the stakeholder red-team outcomes per seat. A Phase 3
build with no discoverable Phase 1–2 record is, by this doctrine, out of
sequence.
