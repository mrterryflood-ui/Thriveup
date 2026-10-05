# FCC Broadband Data Collection (BDC) — Public Data API

Source of truth: `bdc-public-data-api-specifications-v1.6.pdf` in this directory
(FCC, revision 1.6, 2025-09-30; fetched 2026-10-05 from
https://us-fcc.app.box.com/v/bdc-public-data-api-spec). OpenAPI/Swagger YAML:
https://us-fcc.box.com/v/bdc-public-data-api-swagger. File-format specs for the
downloads: https://us-fcc.box.com/v/bdc-public-data-downloads-specs.

## What this API is — and is not

- Base URL: `https://bdc.fcc.gov`
- It is a **bulk-download catalogue**: list "as of" dates → list files for a date
  (by state / provider / geography summary) → download a CSV or GIS zip.
- There is **no point lookup** (lat/lng → providers) in the public spec. The
  undocumented `broadbandmap.fcc.gov/api/public/map/listAvailability` endpoint
  that earlier code relied on now answers HTTP 405 "Method Not Available"
  (verified live 2026-10-05). Location-level answers must come from the state
  **Location Coverage** download joined to the fabric, or be deferred to the
  public map UI (`https://broadbandmap.fcc.gov/location/fixed?lat=..&lon=..`).
- Every endpoint: `GET`, rate limit **10 calls per minute**, response envelope
  `{ data: [...], result_count, status_code, message, status, request_date }`.

## Authentication

1. FCC User Registration account (https://help.bdc.fcc.gov/hc/en-us/articles/20044640394395).
2. Sign in at https://broadbandmap.fcc.gov/login → username menu → **Manage API
   Access** → accept the FCC Terms of Use disclaimer → **Generate**. Tokens can be
   regenerated/revoked by the user and revoked by an FCC administrator.
3. Send two request headers on every call: `username: <fcc username>` and
   `hash_value: <token>`.

In ThriveUp these live in the secrets `FCC_BDC_USERNAME` and `FCC_BDC_HASH_VALUE`
(aliases accepted: `BROADBAND_USERNAME`, `BROADBAND_MAP_API`)
and are consumed only by `server/fcc-bdc-client.ts`. When either is missing the
client reports itself offline; it never substitutes data.

## Endpoints (spec §3 Broadband Data Collection, §4 Funding Map)

| § | Path | Params | Output fields |
|---|------|--------|---------------|
| 3.1 | `/api/public/map/listAsOfDates` | — | `data_type` (availability \| challenge), `as_of_date` (YYYY-MM-DD) |
| 3.2 | `/api/public/map/downloads/listAvailabilityData/{as_of_date}` | query `category` (Summary \| State \| Provider), `subcategory`, `technology_type` (Fixed Broadband \| Mobile Broadband \| Mobile Voice), `speed_tier` (35/3 \| 7/1, Provider hexagon/raw only) | `file_id, category, subcategory, technology_type, technology_code, technology_code_desc, speed_tier, state_fips, state_name, provider_id, provider_name, file_type (csv \| gis), file_name, record_count` |
| 3.3 | `/api/public/map/downloads/listChallengeData/{as_of_date}` | query `category` (Fabric/Fixed/Mobile Challenge · Verification · Audit, each In Progress / Resolved; Fixed Challenge - Cumulative) | `file_id, category, state_fips, state_name, record_count` |
| 3.4 | `/api/public/map/downloads/downloadFile/{data_type}/{file_id}/{file_type?}` | `data_type` availability \| challenge; `file_type` for gis: 1 = ESRI Shapefile, 2 = GeoPackage | binary; `Content-Disposition: attachment; filename=...zip` |
| 4.1 | `/api/public/fundingmap/downloads/listFundingData` | — | `file_id, category (Unserved-Unfunded \| Funding Data \| Funded Locations State \| Funded Locations State Program), data_type (Program \| Project \| State), agency_name, program_name, project_name, state_fips, state_name, file_name, record_count` |
| 4.1 | `/api/public/fundingmap/downloads/downloadFile/{file_id}` | — | binary zip |
| 4.1 | `/api/public/fundingmap/downloads/listReadmeFiles` · `downloadReadmeFile/{ref_id}` | — | readme PDFs |
| 4.2 | `/api/public/fundingmap/downloads/listGeographyData` | — | `geography_type` (state \| county \| cdist \| place \| tribal \| cbsa), `geography_id`, `geography_desc_full` |

Subcategory values (3.2): Summary → "Summary by Geography Type - Census Place",
"Summary by Geography Type - Other Geographies", "Provider Summary by Geography
Type", "Provider Summary". State → "Provider List", "Location Coverage", "Hexagon
Coverage", "Served-Unserved". Provider → "Location Coverage", "Hexagon Coverage",
"Raw Coverage", "Supporting Data".

## ThriveUp surfaces

- `server/fcc-bdc-client.ts` — typed client, 10/min limiter, credential gate.
- `GET /api/rural-connectivity/bdc/status` — truthful credential/connectivity state.
- `GET /api/rural-connectivity/bdc/as-of-dates`, `/bdc/availability-files/:asOfDate`,
  `/bdc/funding-files`, `/bdc/geographies` — thin pass-throughs with provenance.
- `GET /api/rural-connectivity/broadband` — point lookup now fails closed
  (`isBroadbandDesert: null`, `error` populated) instead of reporting a desert
  when the upstream endpoint is unavailable.
