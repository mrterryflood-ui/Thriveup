---
name: ChildCORE Inbound County Metrics
description: POST /api/childcore/county-metrics/ingest endpoint for receiving ChildCORE's 30-min county data push.
---

# ChildCORE Inbound County Metrics

## Endpoint
`POST /api/childcore/county-metrics/ingest` (mounted at `/api` via childcoreRouter)

## Auth
Partner-key auth via `resolveInboundPartnerKey()` helper in `server/childcore-routes.ts`.
- Reads `Authorization: Bearer <key>` or `x-partner-key: <key>` header.
- Hashes the key with SHA-256, looks up in `partner_api_keys` table.
- Uses `partnerApiKeys.active` field (NOT `isActive`) — this is a common gotcha since most other tables use `isActive`.

## Payload
```json
{ "records": [ { "fipsCode": "48453", "countyName": "Travis County", "desertRate": 68.5, "prekEnrollmentRate": 42.1, ... } ] }
```
- Batch limit: 500 records
- `fipsCode` must be a 5-digit string (validated with regex)
- Writes to `childcore_county_metrics` table
- `stateFips` is auto-derived from first 2 digits of `fipsCode`

## Audit log
Uses `partnerApiAuditLog` table. Key fields: `keyId`, `keyPrefix`, `partnerName`, `endpoint`, `method`, `statusCode`, `ip`, `userAgent`. NOTE: NO `requestBody` or `responseStatus` fields — the correct field is `statusCode`.

## Schema
`childcore_county_metrics` table in `shared/schema.ts`. Indexed on `fips_code` and `received_at`. Migration already run via `scripts/migrate-journey-childcore.ts`.

**Why:**
ChildCORE pushes county-level early childhood metrics every 30 minutes. ThriveUp uses them to enrich the Navigator's community context and Community Brief when a user's ZIP falls in that county. Closes the 0–26 longitudinal arc.

**How to apply:**
To feed the ingested data into Navigator: query `childcoreCountyMetrics` in `server/rplice-intelligence.ts` or `server/personal-context.ts` when `lastKnownGeography` is available, filter by `fipsCode` where the first 5 chars match the user's county FIPS.
