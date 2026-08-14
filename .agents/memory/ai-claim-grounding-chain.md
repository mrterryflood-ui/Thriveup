---
name: AI claim grounding + tamper-evident chain
description: Architecture and scope boundary for mechanically verifying AI-generated numeric claims.
---

Built one shared, non-AI verification engine used by every AI numeric-output surface (community
brief narrative, gun-violence story, RPLICE consensus) instead of bespoke per-surface regex logic.
Each surface defines `ClaimRule`s (ROI ratio, percent, dollar-millions, any-of-national-stats) and
runs `enforceGroundedClaims`, which strips any sentence whose numeric claim doesn't match a
server-computed expected value. Every decision (kept AND stripped) is recorded to an append-only
SHA-256 hash-chained audit table, independently re-verifiable end to end.

**Why:** the user's requirement was to make numeric claims provably accurate rather than trusting
model output, and to have a tamper-evident record of every grounding decision, not just failures.

**Deliberate scope boundary:** free-form conversational AI text (e.g. Navigator chat) is NOT
mechanically grounded — that's a much harder open-ended NLP problem. Instead, values with no
independent ground truth (e.g. an AI "fit score") are clamped to a valid range and explicitly
labeled as an AI estimate rather than presented as a verified fact. Don't claim "everything is
verified" when only closed-form numeric surfaces are — state the boundary honestly.

**How to apply:** any new AI-generated surface that states a number derived from data the app
already computed (a rate, ratio, dollar figure, or count) should build a `ClaimRule` and call
`recordClaimDecisions`, rather than trusting the model's arithmetic or inventing new ad hoc regex
checks per surface. See also [JSONB hash-chain pitfall](jsonb-hash-chain-pitfall.md) for a gotcha
hit while building the audit chain itself.

**Hash-chain gotcha:** a hash link must cover every column that records the "why," not just the
"what" — a field like an audit row's expected-value description is just as tamperable as the claim
text itself if it's excluded from the hash input. Also hash the exact value that gets persisted:
if a column has a length limit, truncate/normalize BEFORE hashing, never after — hashing the raw
value then storing a truncated one makes that row permanently fail its own re-derivation the moment
a caller supplies input at or past the limit. A public "verify" endpoint for an internal audit chain
should report self-consistency (aggregate ok/broken-at-id) only — the raw rows are audit content
(can echo user/request-controlled text) and belong behind staff auth, not full public disclosure.
