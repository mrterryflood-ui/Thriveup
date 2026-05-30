---
name: Anti-fabrication guardrails
description: Where fabrication guardrails live and why they must be placed at prompt TOP, not buried.
---

## The rule
Every AI call site in this platform must have explicit anti-fabrication rules at the TOP of its system prompt — before identity, empathy framing, or any other content. Rules buried at the bottom get underweighted by the model.

## What failed (2026-05-30)
Navigator generated a "B- platform assessment" with a fake RPLICE expansion ("Reach, Plan, Launch, Implement, Cultivate, Evaluate") and fabricated metrics ("Ecosystem Fidelity: 44%", "Projected Outcomes: 35–50% in 6 months"). The RAG had no matching chunk for the expansion — the model hallucinated it because nothing explicitly prohibited it.

**Why:** RPLICE_LENS in collaborative-ai.ts contained a fabricated acronym expansion the author invented. That wrong text was injected into every multi-engine call. The Navigator system prompt had correct facts but no explicit prohibition on fabrication.

## Where guardrails now live
- `server/navigator-routes.ts` — `ANTI_FABRICATION_RULES` const, prepended to `NAVIGATOR_SYSTEM_PROMPT` before any identity content.
- `server/collaborative-ai.ts` — `COLLAB_ANTI_FAB` injected into both `baseSystem` fallbacks (lines ~382 and ~510).

## The six prohibitions (reproduce in any new AI call site)
1. No fabricated numbers — must come from RAG context, user doc, or explicit live data.
2. No fabricated acronym expansions — RPLICE = "Research-to-Practice Lifecycle Implementation & Community Evidence" always.
3. No fabricated grades or assessments — never generate letter grades or fidelity % from general knowledge.
4. No projected outcomes without a cited primary source — omit entirely if no source.
5. No generic consulting-speak when real ThriveUp facts are available.
6. Uncertainty = disclosure, not fabrication — "I don't have that specific data."

## How to apply
Any new route that calls `streamCollaborativeAI`, `runCollaborativeAI`, or any AI SDK directly:
- If passing a custom `systemPrompt`, prepend `ANTI_FABRICATION_RULES` from navigator-routes.ts or equivalent.
- If using the default, the guardrails are already baked into the `baseSystem` fallback.
