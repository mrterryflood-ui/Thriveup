---
name: Public boundary canonicalization & deterministic claim grounding
description: Two hardening patterns for any endpoint that accepts caller-supplied structured data alongside a validated evidence/fact contract, or that ships AI-generated numeric claims.
---

## Canonicalize display fields from the validated contract, not just structural validation
An endpoint can structurally validate an `evidence` block while still accepting an
attacker- or bug-supplied `displayName`/`geography`/label field that doesn't
actually match what the evidence resolved to. Structural validation only proves
the evidence shape is well-formed — it says nothing about whether the sibling
display fields agree with it.

**Why:** A code review caught exactly this gap in a community-data sharing
feature — valid evidence for one geography could be paired with an arbitrary
displayed geography name, publishing a true-looking but false public artifact.

**How to apply:** After validating the evidence/fact contract, forcibly
overwrite every caller-controllable display field from the validated contract's
resolved values (in place), at every persist boundary (POST before insert) and
every serve boundary (GET, defensively, even for legacy/pre-existing rows).
Never trust that "evidence passed validation" implies "the displayed summary of
it is accurate" — those are separate invariants.

## AI-generated numeric claims need deterministic post-generation redaction, not just prompt instructions
Telling a model "only state the exact computed ratio X" reduces but does not
eliminate the chance it restates, rounds, or rephrases into an invented number.

**Why:** A code review rejected a first fix that only grounded an ROI claim via
prompt instructions — the model could still fabricate a ratio through any
phrasing not covered by tests.

**How to apply:** After generation, run a mechanical (non-AI) check: split into
sentences (careful — naive splitting on "." breaks on decimals like "3.2";
protect decimal points with a sentinel char before splitting, restore after),
detect every phrasing that COULD be the claim type (cast a wide net — numeric,
spelled-out, ratio, "per X", "fold", "times", percent, etc.), and treat each
triggered sentence as an allow-list: keep it only if the number it states
exactly matches the one real computed value (in whatever unit/form that
phrasing implies); otherwise strip the whole sentence. A trigger-only check
that doesn't verify the actual number will wrongly strip correctly-grounded
claims phrased in an untested way — the allow-list must bind the extracted
number to the phrasing, not just detect the phrasing's presence.
