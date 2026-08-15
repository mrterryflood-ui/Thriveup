---
name: Equity-Loss Engine (IHDI/Atkinson)
description: Domestic equity-loss tool built from a UNDP IHDI/Atkinson formula; schema enforcement pattern, tolerance finding, and open methodological risk to track before it grows a real data pipeline.
---

Two tables: `benchmark_metrics` (static reference rows, immutable via a
BEFORE UPDATE/DELETE trigger once `is_reference=TRUE`; `benchmark_metrics_display`
view nulls any `rank` whose `rank_conf <> 'verified'`) and `equity_loss_results`
(this platform's own computed output; CHECK constraints enforce that a
`derived_with_stated_assumption` row must carry non-empty `assumption_text`,
and that `health_inequality_method='geographic_dispersion'` can never be
tier `'computed'`). All three were verified live by attempting the forbidden
write and watching Postgres reject it, not just by reading the DDL.

Pure formula code lives in `server/equity-loss/atkinson.ts` +
`equity-loss-engine.ts`. It computes IHDI itself from raw component inputs
(ACS income/education, life-expectancy distribution) rather than ever
ingesting a pre-computed loss percentage — that's what lets the
ai-claim-grounding-chain certify the output as a grounded claim later.

**Why:** reproducing UNDP's own published HDR25 figures from UNDP's own
published component percentages does NOT round-trip within a ±0.05
(1-decimal-precision) tolerance — worst case (Iceland) is off by 0.087
points, because three independently-1-decimal-rounded percentages get
compounded through a geometric mean. This is measurement-rounding
propagation, not a formula bug. The formula itself was verified correct
(all other property tests — bottom-coding, weighting, geometric-mean
load-bearing property, USALEEP/IHME shape-preservation — pass exactly).

**How to apply:** any future acceptance test reproducing UNDP published
figures from published component inputs needs an absolute tolerance of
~±0.1 percentage points, not a tight decimal-precision assertion.

**Open, not yet resolved:** the sub-national health-inequality measure
(geographic dispersion of life expectancy across tracts) is a genuinely
different statistic from UNDP's true method (distribution of ages at
death) — capped at trust tier 2 by both application code and a DB CHECK
constraint until verified against UNDP Technical Note 2. Do not remove
that cap without doing that verification first. Four other decisions
(goalpost scheme UNDP-vs-US-specific, city-geometry crosswalk, 25%
decadal-growth suppression threshold, 0.3 ACS MOE-ratio threshold) are
still unvalidated defaults pending a human call against real tract data.
