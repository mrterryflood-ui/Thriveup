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
Two sender formats are supported:
- Documented flat ChildCORE metric: `source: "ChildCORE"`, `dataType: "metric"`, `county_fips`, `county_name`, `state`, `as_of_date` (YYYY-MM-DD), four nullable counts, matching `_suppressed` booleans, nullable `coverage_rate`, and `suppression_reason` when suppressed.
- Existing batch: `{ "records": [ { "fipsCode": "48453", ... } ] }`, max 500.

Flat suppression metadata is preserved in `rawMetrics`; Navigator projects only safe aggregate context and does not infer suppressed capacity/demand/gap or interpret coverage/gap semantics. The stale-source guard belongs in Drizzle `setWhere`, not `targetWhere`.

## Audit log
Uses `partnerApiAuditLog` table. Key fields: `keyId`, `keyPrefix`, `partnerName`, `endpoint`, `method`, `statusCode`, `ip`, `userAgent`. NOTE: NO `requestBody` or `responseStatus` fields — the correct field is `statusCode`.

## Schema
`childcore_county_metrics` table in `shared/schema.ts`. Indexed on `fips_code` and `received_at`. Migration already run via `scripts/migrate-journey-childcore.ts`.

**Why:**
ChildCORE pushes county-level early childhood metrics every 30 minutes. ThriveUp uses them to enrich the Navigator's community context and Community Brief when a user's ZIP falls in that county. Closes the 0–26 longitudinal arc.

**How to apply:**
To feed the ingested data into Navigator: query `childcoreCountyMetrics` in `server/rplice-intelligence.ts` or `server/personal-context.ts` when `lastKnownGeography` is available, filter by `fipsCode` where the first 5 chars match the user's county FIPS.
