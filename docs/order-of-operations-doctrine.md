# The Five-Phase Order of Operations Doctrine

**Authored with Dr. Terry D. Flood, 2026-08-15.**
**Status:** Agnostic doctrine — portable to any agent, team, or system. This
copy is self-contained: it does not assume any particular codebase, tool, or
prior framework. Wherever it references "the agent," read that as whichever
person or system is doing the work.

---

## Why this exists

Most build failures are not coding failures. They are sequencing failures:
building before the site was surveyed, or building before the plan was
checked from every seat that has to live with it. This doctrine makes the
survey and the check-before-you-build mandatory and named, instead of
implicit and skippable under deadline pressure.

**Governing metaphor:** you don't pour a foundation before you've read the
site survey and the architect's plan. Phase 1–2 is the survey and the plan.
Phase 3–5 is pouring the foundation, building the building, and the
inspection that lets the *next* building go up faster because this one was
built right.

---

## Phase 1 — Environmental Compliance & Layout (the site survey)

Before any plan exists, understand the ground truth:

1. **Vision** — the actual desired end-state, in the requester's own words,
   not a paraphrase that quietly drifts from it.
2. **In-state** — what the current state actually looks like, verified
   against the live system (data, code, docs, people) right now — not
   memory, not last time's notes.
3. **Current operating system** — what mechanisms, conventions, and
   constraints already govern this space. What already works and must not
   be broken.
4. **Barriers and facilitators** — implementation-science framing: what will
   make this land, what will make it fail, at the technical, organizational,
   and stakeholder level.
5. **Differences within differences** — never settle for "does this work on
   average." Stratify: does it work differently across groups, geographies,
   or subpopulations? An average can hide a harmful or void effect on a
   specific group. Surface those splits before planning, not after shipping.

**Exit criterion:** you can state the vision, the in-state, the operating
constraints, the barriers/facilitators, and the stakeholder splits — each
traceable to something verified this cycle, not recalled from memory. If you
cannot source one of the five, Phase 1 is not done.

## Phase 2 — Planning for That Environment (the architect's plan)

1. **Concentrated synthesis** — deliberately turn the raw Phase 1 findings
   into a plan. Do not skip straight from scan to build. Unfiltered
   understanding becomes structured intent on purpose, not by accident.
2. **Lines of effort / lines of operation** — decompose the plan into its
   independent workstreams (LOEs) and the sequenced operations within each
   (LOOs). Name the dependencies between them explicitly.
3. **Plan backward from the end-state** — start from the desired final state
   and work backward to the current state, rather than forward from
   whatever is easiest to build first. This surfaces prerequisites a forward
   plan misses.
4. **Stakeholder red-team, before build** — walk the plan through every
   stakeholder's seat, individually and holistically: end user, UX/UI/UCD,
   operator, reviewer, downstream integrator. This is the after-the-fact
   review pulled forward — done *before* building, not only after. Include
   interoperability needs (what else this plan must speak to) as one seat.
5. **Measure twice** — an independent second pass over the plan, from a
   different angle or a different reviewer, before Phase 3 starts. Not the
   same person re-reading their own plan.

**Exit criterion:** a written plan with named LOEs/LOOs, an explicit
backward-derived critical path, and a documented pass through each
stakeholder seat — including any objection raised and how it was resolved
or explicitly deferred with a stated reason.

## Phase 3 — Foundational & Scaffolding
Build the skeleton only: schema, contracts, core primitives, acceptance
tests. Nothing user-facing yet. A scaffolding step that skips Phase 1–2 is
building on a site nobody surveyed.

## Phase 4 — Complete Building
Build the entire thing on that scaffold through to a real, working state:
finish the build, adversarially self-review the diff (silent failures,
missing checks, dead logic, skipped context, contract violations), then run
every quality gate to green — nothing softened just to pass.

## Phase 5 — Architect Review & Closing
An independent review pass — someone (or something) other than the builder,
checking against evidence, not vibes. Blockers get fixed before calling it
done; everything else gets logged with severity and a deadline, not
forgotten. Then a closing summary: what was learned, and what general-purpose
guard should exist now so this class of mistake can't recur silently.
Because Phases 1–2 already surveyed the ground and red-teamed the plan, this
pass finds narrower, cheaper defects — and the next cycle starts from a
sound foundation instead of re-discovering the same barriers.

---

## Phase 5 Addendum — Accuracy & Continuous-Learning Ledger

A closing review that isn't measured against reality is an opinion, not a
verification. Every Phase 5 close deposits a dated entry to an **accuracy
ledger** — not a narrative summary, a falsifiable record of what was
claimed, how it was checked, and whether the check confirmed or overturned
the claim. Read as a whole over time, this ledger is the only honest answer
to "is this system actually getting more accurate, or does it just sound
more confident?"

**What gets logged, every close:**
1. **Date** and the subsystem/decision in question.
2. **The claim or output** being tracked — specific enough to re-check later.
3. **How it was verified** this cycle (a tool run, a live query, a test, an
   independent reviewer) — never "it looks right."
4. **Outcome:** confirmed / overturned / partially-overturned. An overturned
   prior claim is not a failure to hide — it is the ledger doing its job.
   Log it exactly like a confirmation, not more quietly.
5. **Class of finding**, so patterns are visible over time: methodology gap,
   architecture gap, data-availability wall, or a stakeholder need the
   Phase 2 red-team should have caught but didn't.

**What this produces, read as a whole (never per-entry):**
- A **rolling accuracy rate**: confirmed vs. overturned claims per period.
  A rising overturn rate is a real regression, not noise — escalate it.
  A falling overturn rate on repeat subsystems means the doctrine is working.
- A **recurrence check**: the same class of finding twice means the guard
  from the first occurrence didn't generalize. Fix the guard, not just the
  instance, and say so in the entry.
- **Never self-graded.** The verification step must be independent of the
  claim's author — self-marking a claim "confirmed" from memory makes the
  ledger worthless.

**Reporting cadence:** when asked how accuracy or reliability is trending,
answer from the ledger's actual entries — counts, dates, what changed —
never from a general impression that "it's been going well." If there are
too few entries yet to show a trend, say that plainly instead of estimating
one.

---

## Quick-reference mapping (for systems that already have a build pipeline)

| This doctrine | Typical existing pipeline stage |
|---|---|
| Phase 1 (environmental scan) | Before/feeding intake or discovery |
| Phase 2 (backward plan + stakeholder red-team) | Before design/build sign-off; pulls end-of-cycle review forward |
| Phase 3 (scaffolding) | Build, first pass (schema/contracts/tests only) |
| Phase 4 (complete build) | Build (complete) → self-review → CI/quality gates |
| Phase 5 (review & close) | Independent review → retro/lessons-learned |
| Accuracy ledger | Whatever your team already calls "did we actually get better" — usually nothing, until now |

## When to invoke this doctrine

Mandatory before Phase 3/4 build work when any of these are true:
- The subsystem or data source is new (no prior case law/decisions cover it).
- The feature has more than one stakeholder type with potentially
  conflicting needs.
- A methodological choice (which formula, which threshold, which data
  source) has more than one defensible answer and no prior decision exists.

Not required for small, well-precedented changes — a bugfix, a copy change,
a one-file addition following an established pattern doesn't need this
ceremony; ordinary "check the current state before you claim something"
discipline covers it.
