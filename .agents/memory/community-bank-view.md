---
name: Community bank impact view
description: /community-banks composer design decisions and data honesty limits
---
- Rule: the bank page composes existing organs only; every tile declares observed/modeled/unavailable and nothing is substituted for a missing source.
- **Why:** page is put in front of sponsors; fabricated or silently-defaulted numbers would violate anti-fabrication rules.
- **How to apply:** county-level SVI is absent from gis_context_data (tile unavailable until ingested); fetchCountyAcs median income is a band-midpoint weighted median → modeled; childcare gap uses modeled demand → modeled even in TX; city names resolve only via a curated table, everything else needs a ZIP (404 with guidance). User owns all registry platforms — present as one ecosystem, no partner/owned split. PDF one-pager = print stylesheet, not a server route.
- gis_context_data.data_year is a calendar stamp overwritten by PLACES/SVI refreshes; it is not the ACS vintage. County rows (TX only, 254) carry ACS B19013 median + B17001 poverty, so TX gets observed tiles; other states fall back to band-midpoint income and no poverty tile.
- Bare 5-digit input is ZIP-first (48453 is a Michigan ZIP); county FIPS needs the `county:` prefix.
