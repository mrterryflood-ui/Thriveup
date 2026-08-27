# Equity-Loss Engine — Phase 1–2 Record (Order of Operations)

Produced under `.agents/skills/order-of-operations/SKILL.md` before Phase 3/4
(complete build). This is the environmental scan + backward-planned,
stakeholder-red-teamed plan for finishing the equity-loss engine to a real,
production-ready state.

## Phase 1 — Environmental scan

**Vision:** a domestic differences-in-differences equity tool comparing a
geography's inequality-adjusted development loss against its own state,
national peer class, and (for context) the UNDP international benchmark row
set already seeded — never averaging those frames together, never presenting
an AI estimate where a computed figure is possible.

**In-state (verified this session):**
- `server/community-context.ts` / `community-api-routes.ts`: live ACS + CDC
  PLACES pipeline exists at **county** grain only. No live place-level
  resolver. Tract-level ACS fetch exists in `benefits-routes.ts` but only
  enumerates tracts within an already-chosen county — no ZIP/point→tract
  resolver.
- `server/geo/zip-county-resolver.ts`: ZIP→county crosswalk exists (DB-backed,
  Census ZCTA relationship data). No tract or place crosswalk exists anywhere
  in the codebase.
- CDC's USALEEP tract life-expectancy dataset is **live and fetchable** via
  Socrata (`data.cdc.gov/resource/5h56-n989.json`) — confirmed with a direct
  request this session. It exposes point LE estimate + range + standard
  error per tract **and a state-level aggregate row** (`county_name:"(blank)"`).
  It does **not** expose the underlying life-table age-at-death distribution
  — only the point estimate.
- IHME's county life-expectancy dataset requires a manual GHDx
  license-acceptance download, not a live API — not integrable as a live
  pipeline in this environment. Confirmed by inspecting the GHDx record page;
  no Socrata/REST access exists for it.
- USDA ERS RUCA 2020 codes are a static, one-time-downloadable file
  (`ers.usda.gov/.../ruca2010revised.xlsx`, confirmed reachable, 74k
  tract-level rows) — suitable as a seeded reference table, not a live fetch.
- **Architectural gap found in `equity-loss-engine.ts` itself:**
  `computeAllFrames(u, ...)` calls `computeEquityLoss` three times with the
  *same* `UnitInputs`. The `frame` field only relabels identical output — the
  three frames can never numerically diverge, so `divergencePct` is
  structurally always `0` and `divergenceInterpretation` is structurally
  always `'aligned'`. The spec's own stated goal ("three frames, never
  collapsed") was not actually implemented by the provided code. Presenting
  this to a user as three real comparisons would be a fabricated distinction
  (Invariant C1). This must be fixed before Phase 4, not built on top of.

**Barriers:**
- No tract-level age-at-death distribution is publicly available anywhere →
  tier-1 (`computed`) health inequality is not achievable below the state
  level with public data, at any grain. This was already correctly
  anticipated by the engine's tier cap; it is now confirmed, not merely
  assumed.
- True national peer-class benchmarking (RUCA × density × growth band) needs
  an aggregate over many geographies — infeasible to compute per-request live.
  It has to be a precomputed/batch reference table, refreshed periodically.
- No existing tract/place crosswalk infrastructure. Building one (Census
  TIGER relationship files) is a real, separate body of work.

**Facilitators:**
- The suppression/tier machinery, DB constraints, and reference-row
  immutability built in Phase 3 already assume exactly this shape (a
  geography's inequality computed from its own subunit distribution) — no
  schema change needed.
- County grain has full live data coverage today: ACS income/education
  distributions at county grain, USALEEP tract rows aggregate cleanly into a
  county-level life-expectancy dispersion, and CDC PLACES already resolves
  county names.

**Differences within differences (stakeholder splits):** a funder/advocate
audience needs the divergence-between-frames finding most (that's the actual
policy signal — "worse than peers" vs. "worse everywhere" imply different
interventions); a CHW/frontline audience needs the suppression/assumption
language in plain terms, not the statistic; a data-skeptical reviewer needs
the tier and assumption text visible on every number, not just in a tooltip.

## Phase 2 — Plan

**Lines of effort:**
1. **Engine fix (LOE1, blocking):** redefine `computeAllFrames` to require
   each frame's *own* reference loss (state's own computed loss, peer
   class's own computed benchmark loss), not a relabeled copy of the unit's
   own number. Blocks everything downstream — building a route/UI on the
   current function would ship the fabricated-distinction bug.
2. **County-grain live pipeline (LOE2):** ACS income/education distributions
   + USALEEP tract dispersion → one real, computed county row per request.
3. **Peer-class reference table (LOE3):** one-time batch computing every US
   county's own equity-loss, seeded with RUCA/density/growth peer class, so
   a live request can look up its peer class's average instead of computing
   it inline.
4. **Route + UI (LOE4):** depends on LOE1–3.

**Backward plan (from the vision):** UI needs three genuinely different
numbers → route needs a fixed engine + a populated peer-benchmark table →
peer-benchmark table needs a batch computation over real counties → batch
computation needs the engine fix done first. So LOE1 → LOE3 → LOE2 → LOE4.

**Stakeholder red-team:**
- *End user (advocate/funder):* wants the divergence finding front and
  center, with the two comparison numbers visible, not buried.
- *UCD/UX:* every suppressed or tier-2 row must say *why* in plain language
  inline, not as a silent blank cell — consistent with C2/C9.
- *Reviewer/skeptic:* must be able to see tier + assumption text + goalpost
  scheme on every number without extra clicks.
- *Downstream integrator (Chainweb/partner API):* the API contract must
  expose `tier` and `assumptionText` as required fields, never optional,
  so a consuming system can't silently drop them.
- *Objection raised and resolved:* should tract-level scoring be attempted
  anyway using geographic-dispersion-of-neighboring-tracts as a proxy for an
  individual tract? Rejected — a single tract has no internally meaningful
  "subunit dispersion," and forcing one would manufacture a tier-2 number
  with no honest basis. Deferred, not built.

**Descoped for this build cycle (documented, not silently dropped):**
- Tract-level individual equity-loss scores (no public age-at-death data at
  that grain; no crosswalk infrastructure).
- Place-level (incorporated city) resolution (no crosswalk infrastructure;
  would require TIGER relationship-file ingestion — separate body of work).
- IHME hybrid rescaling for ME/WI (no live-fetchable IHME source in this
  environment; USALEEP-excluded states will suppress with
  `source_coverage_gap` and say so, not silently default to a national
  proxy).

**Decisions on the 5 originally-open items:**
1. **Goalpost scheme:** UNDP fixed goalposts (already in `atkinson.ts`) —
   kept, so domestic counties stay comparable to the seeded international
   reference rows. Not redefined to a US-specific scheme.
2. **UNDP health-inequality method:** confirmed via Alkire & Foster (2010)
   and UNDP Technical Notes — UNDP measures dispersion of age-at-death, not
   geography. The existing tier-2 cap for `geographic_dispersion` is correct
   and stays in place; USALEEP is the live-fetchable data source for that
   dispersion at county grain (tract-within-county).
3. **Crosswalk method:** descoped — see above.
4. **25% decadal-growth suppression threshold:** no authoritative source
   found to validate this specific figure. Kept as a disclosed assumption,
   not represented as empirically derived — consistent with C1.
5. **0.3 ACS MOE-ratio threshold:** no Census-endorsed specific threshold
   found for this exact ratio (searched Census methodology docs and ACS
   handbook this session). Kept as a disclosed assumption for the same
   reason as #4, not upgraded to "validated."

## Connecticut geography-alignment amendment

The original Phase 1 record correctly deferred a general tract/place
crosswalk because no relationship infrastructure was then available in the
application. That deferral does **not** apply to Connecticut's specific,
published county-equivalent transition. Census now provides a bounded,
authoritative three-file relationship chain from USALEEP's 2010 tract vintage
through towns to the nine planning-region county-equivalent FIPS codes.

The nationwide batch uses that identifier chain for Connecticut rather than
display-name matching. A tract with exactly one modern planning-region target
is included in that region's life-expectancy distribution. A tract with zero
or more than one target is not allocated to any region. This preserves the
existing geographic-dispersion methodology and its source-coverage suppression
rule; it neither creates tract-level individual scores nor substitutes a
statewide or legacy-county average. See
`docs/equity-loss-geography-alignment.md` for the source path and no-fabrication
boundary.
