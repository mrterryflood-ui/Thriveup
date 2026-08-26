---
name: Connecticut geography source alignment
description: Prevent statewide data loss when national sources use different county-equivalent vintages.
---

When national sources are joined at county level, use stable geographic identifiers or a documented crosswalk—not a display-name match alone.

**Why:** Connecticut’s current planning-region county equivalents and an older CDC life-expectancy source use different county names. A name-only join produced an honest source-coverage suppression for the entire state even though the health source contained the legacy county records.

**How to apply:** Before refreshing or adding a nationwide source, compare its geography vintage and identifiers to the operating county denominator. Add an explicit, versioned FIPS/crosswalk path for boundary changes and test that every intended state retains at least one usable record or a disclosed source limitation.