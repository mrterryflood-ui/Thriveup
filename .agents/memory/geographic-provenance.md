---
name: Geographic provenance
description: Numeric coordinates and seeded resource addresses do not prove geographic accuracy or service coverage.
---

County or ZIP coordinates must come from a disclosed authoritative geography source; missing coordinates stay unavailable. Filing ZIPs are not service locations, and a county FIPS must never be passed to a postal-ZIP input.

**Why:** A complete-looking county coordinate dataset previously used state-offset estimates and placed known counties in the wrong locations. A benefits handoff also treated an assessment-area FIPS as a ZIP.

**How to apply:** Inspect how coordinates and geography identifiers were produced before reusing a populated field. Validate known places against the source, preserve county/MSA scope, disclose interior-point and ZIP-primary-county approximations, and never label seeded resource locations independently verified.

When the same stored metric may represent incompatible definitions, omit it from a new evidence surface until its definition is identifiable.

**Why:** The legacy poverty field can contain either ACS 100%-poverty or SVI 150%-poverty percentages; a generic “poverty rate” label hides that distinction.

**How to apply:** Bind displayed measures to a source, definition, vintage, and denominator rather than trusting a familiar field name.