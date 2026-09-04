---
name: HHSC CCL API field mapping
description: Actual field names in the Texas HHSC Child Care Licensing Socrata dataset (bc5r-88dy) as verified 2026-09-04.
---

# HHSC CCL API field mapping (bc5r-88dy)

Verified by fetching `https://data.texas.gov/resource/bc5r-88dy.json?$limit=1&$where=upper(county)='WILLIAMSON'`

## Field name corrections

| What you might expect | Actual field name | Notes |
|---|---|---|
| `licensed_capacity` | `total_capacity` | String, e.g. `"187"` — parse with `parseInt` |
| `status` or `license_status` | `operation_status` | `"Y"` = active, `"N"` = inactive |
| `ages_served` | `licensed_to_serve_ages` | e.g. `"Infant,Toddler,Pre-Kindergarten,School"` |
| `phone` | `phone_number` | Plain digits string |
| `zip` | `zipcode` | May contain space, e.g. `"78664 6154"` |
| `website_url` | `website_address` | Plain URL string |
| lat / lon | (none) | `location_address_geo` has embedded JSON, no separate coordinates |
| `trs_designation` | (none) | TRS ratings are in a **separate** dataset; not in CCL |

## Additional fields available
`type_of_issuance` (e.g. "Full Permit"), `accepts_child_care_subsidies` (Y/N), `days_of_operation`, `corrective_action`, `adverse_action`, `temporarily_closed`, deficiency counts (high/medium-high/medium/medium-low/low), `total_inspections`, `total_assessments`, `total_reports`.

## TRS data source
Texas Rising Star ratings are NOT in this dataset. They come from a separate Texas HHSC TRS portal. As of 2026-09-04, all providers in `server/childcare-provider-intel.ts` will show `trs_designation: null` → "Not Rated" until TRS integration is added.

## Capacity computation note
`buildSummary` uses `includes("LICENSED")` to count licensed providers. With the corrected field mapping, `license_status` is "Full Permit" (not "LICENSED"), so `licensedProviders` count will be 0. The correct check should be `operation_status === "Y"` or check `type_of_issuance` for "Permit". (Known bug as of 2026-09-04.)
