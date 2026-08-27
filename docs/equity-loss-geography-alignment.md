# Equity-Loss Nationwide Geography Alignment

## Connecticut county-equivalent transition

The nationwide Equity-Loss batch computes health inequality from CDC USALEEP
tract observations. CDC identifies Connecticut records with the eight legacy
county names used by its 2010–2015 tract release. Census recognizes nine
Connecticut planning regions as county equivalents beginning in 2022. These
are different geographic systems, so the batch must never join them by a
display name or relabel an entire legacy county as a planning region.

## Authoritative relationship path

The resolver joins stable Census identifiers from these public Census Bureau
relationship files:

1. `ct_cou_to_cousub_crosswalk.txt` — legacy county and town to modern
   planning-region county-equivalent FIPS.
2. `acs22_cousub22_tract22_st09.txt` — 2022 town to 2022 Census tract.
3. `tab20_tract20_tract10_st09.txt` — 2020 Census tract to USALEEP's 2010
   tract vintage.

The pipeline pairs the legacy county FIPS with the tract suffix where required
by the relationship tables. It produces a planning-region FIPS assignment only
when the full published chain has exactly one target.

## No-fabrication boundary

When an older USALEEP tract maps to multiple new planning regions, the resolver
does not duplicate, average, or allocate its life-expectancy observation. It is
reported as boundary-spanning and excluded from every modern planning-region
distribution. When a relationship source is unavailable or a tract has no
published target, it is likewise unresolved; the existing engine exposes the
county-equivalent as a `source_coverage_gap` rather than inventing a health
dimension.

The public nationwide summary calls this **analytical coverage**, never service
deployment coverage. It reports the expected 50 states, District of Columbia,
and five territories separately from expected, present, usable,
source-unavailable, otherwise suppressed, and missing county-equivalent
records.