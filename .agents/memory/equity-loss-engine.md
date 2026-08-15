---
name: Equity-Loss Engine (IHDI/Atkinson)
description: County-grain US equity-loss engine — three-frame comparison architecture, peer-class benchmark methodology, and the Census API key gotcha hit while building it.
---

## What it is
Domestic-only (US) county-grain human development loss-to-inequality engine
(IHDI/Atkinson method). Live at `/equity-loss` (UI) and
`GET /api/equity-loss/county/:stateFips/:countyFips` (API, public, rate-limited
by IP). Mounted separately from the pre-existing unrelated `/api/equity`
router — do not conflate the two.

## Three-frame architecture — the load-bearing pattern
Every result is compared against three *independent, never-averaged*
reference values: national (US), the county's own state, and a national
"peer class" (rurality × growth × census-region). A county can read as
deprived against its own state and advantaged against national peers of the
same type — both can be true and imply different policy responses.

**Why this matters for future changes:** the original implementation called
the same loss-computation function three times with identical inputs, so all
three frames were structurally guaranteed to be identical (divergence always
0) — a bug that looked correct at every level except tracing actual data flow.
Caught only by reading the function before building on top of it, not by
running it. A regression guard now lives in `scripts/verify-equity-loss-frames.ts`
(chained into the `access-model-guards` workflow) that fails loudly if all
three frames' reference values are ever identical again — do not remove it
without a repro of why the identical case is now legitimately expected.

## Peer-class benchmark methodology (disclosed assumption)
Each of the 36 peer classes (3 rurality bands × 3 growth bands × 4 census
regions) is benchmarked using ONE representative county (highest population
in that class), not a true average across all counties — an exhaustive
national average would require ~3,143 live per-county computations, not
viable as a batch job. This is disclosed via `PEER_CLASS_ASSUMPTION_TEXT`,
returned inline in every API response — never hide this the way UNDP-vs-
geographic-dispersion health-methodology divergence is also disclosed.
Rerun `scripts/compute-peer-class-benchmarks.ts` if RUCC codes or growth-band
thresholds change; it's idempotent (skips existing `benchmark_metrics` ids).

## RUCC over RUCA
Peer classification uses USDA ERS **Rural-Urban Continuum Codes (RUCC) 2023**
(county-level, static xlsx, ~3,143 counties), not tract-level RUCA — chosen
because the shipped scope is county-grain and there's no existing
tract-aggregation infrastructure. If a future feature needs sub-county
(tract-level) rurality, RUCA is the correct source; don't force RUCC down to
tract level.

## Census API now requires a key — a shipped assumption changed silently
`api.census.gov` used to tolerate keyless requests for low-volume use. It now
302-redirects every keyless request to `missing_key.html` (confirmed live,
2026-08-15) instead of returning a clean error — a `fetch()` without
`redirect: "manual"` will try to JSON-parse the redirect's HTML body and fail
with a confusing "Unexpected token '<'" error that looks like a payload bug,
not an auth bug. `CENSUS_API_KEY` is already provisioned in this environment
and used by the pre-existing `community-api-routes.ts` / `benefits-routes.ts`
call sites — reuse that same key for any new Census fetch code; don't assume
keyless still works just because older code comments say so.
