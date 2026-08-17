---
name: Census place-level query key requirement
description: ACS5 batched queries at the place (city) level require CENSUS_API_KEY, unlike county-subdivision queries.
---

Census Bureau ACS5 batched API queries at the **place** (incorporated city) geography level return a quota/auth error without `CENSUS_API_KEY`, even though the existing county-subdivision (CCD) batched query approach in `server/neighborhood-routes.ts` works keyless.

**Why:** This is an undocumented, geography-level-specific Census API quota rule — not a general "Census needs a key" fact. Verified live by testing the same batched-query shape against both geography levels, with and without a key.

**How to apply:** Any new Census integration that queries at the place/city level (not county or county-subdivision) must have `CENSUS_API_KEY` set, and should fail soft (return empty, not throw) if it's absent — see `fetchCountyMicroGeographies` in `server/community-intel.ts` for the pattern.
