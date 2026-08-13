---
name: County-level Census resolution
description: How the conductor resolves county names / FIPS → Census ACS data without downsampling to a single ZIP.
---

## Rule
Any input matching "X County, ST" or a 5-digit county FIPS or a pipe-separated multi-county list MUST be routed through the county path in `conductor-routes.ts` — it must NEVER be passed to `resolveLocationToZip()`.

**Why:** `resolveLocationToZip()` always returns one ZIP, which fabricates scope for any multi-ZIP geography (violates doctrine C1).

## How to apply
Priority order in the conductor's Step 1 block (line ~1133):
1. Pipe-separated → `fetchMultiCountyData()` (population-weighted aggregate)
2. Single county name or 5-digit FIPS → `resolveCountyInput()` → `fetchCountyData()`
3. ZIP or city (comma-normalised) → existing ZIP path

## Key functions (all exported from `neighborhood-routes.ts`)
- `resolveCountyInput(input)` — regex + static table + Census API fallback; returns `{stateFips, countyFips, displayName, stateAbbrev}` or null
- `fetchCountyData(stateFips, countyFips)` — ACS5 `for=county:XXX&in=state:XX`; same variable set as `fetchZctaData`
- `fetchMultiCountyData(counties[])` — fetches each county separately, then population-weights rates

## Static county table (`STATIC_COUNTY_FIPS`)
All 100 NC + all 254 TX counties seeded inline — instant name→FIPS with no Census API call.
`STATIC_FIPS_TO_COUNTY_NAME` is the auto-built inverse (FIPS→display name).
Other states fall back to the Census county-list API (`for=county:*&in=state:XX`), cached per state.

## City-name normalisation
Comma-less "City ST" → "City, ST" before passing to `resolveLocationToZip()` (M7 fix).

## State field derivation
`stateName` is ALWAYS derived from `FIPS_TO_STATE[stateFips]` — never from Nominatim `display_name` string which returns "United States" or the full address (C5 fix).

## Verified probe results (2026-08-13)
| Input | povertyRate | grade |
|---|---|---|
| Columbus County, NC | 21.1% | F |
| Brunswick County, NC | 9.1% | D |
| Bladen County, NC | 24.4% | F |
| Pender County, NC | 11.7% | D |
| New Hanover County, NC | 12.7% | D |
| 5-county aggregate | 13.1% | D |
| 37047 (FIPS) | 21.1% | F |
| Whiteville NC (no comma) | 21.6% (ZIP 28472) | F |
