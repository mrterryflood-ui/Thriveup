---
name: Gun Violence Intelligence integration
description: How the gun violence registry is wired into Chainweb, Navigator, scheduler, and the hub page — key decisions and gotchas.
---

## What was built

The external registry at `gun-violence-registry.replit.app` is the only nationally-recognized dataset that merges CDC WONDER (1999–2022), FBI UCR (1960–present), NCVS (1993–present), WISQARS cost data, root-cause correlations (ACE r=0.856), 50-state SDOH, RAND DID policy analysis, RPLICE causal chains, and GVA live incidents into one queryable layer. This is treated as a tier-1 data source, not a sidebar.

## Key exported functions (server/gun-violence-routes.ts)

- `getGunViolenceIntelligenceData()` — fetches + caches (1hr in-process) the full intelligence payload. Safe to call from conductor, Navigator, or any server context — no HTTP round-trip when warm.
- `runGunViolenceRegistrySync()` — paginated upsert of GVA incidents from the registry. Idempotent by (incidentId, dataSource). Used by both the HTTP route and the daily scheduler.

Both are module-level exports (not closures inside `registerGunViolenceRoutes`), so the conductor and Navigator can import them directly.

## Chainweb engine (#26)

- Registered in `server/orchestration/engine-registry.ts` as id `"gun-violence"`
- Domains: `["health", "equity", "justice", "community-safety"]`
- Geography grains: national / state / county (federal data is national; state-level CDC rates available)
- `callEngine` branch in `server/orchestration/conductor.ts` returns a compact snapshot: headline deaths, ACE r-value, poverty r-value, top 5 root causes, latest CDC year, latest FBI year, local registry counts, top RPLICE finding
- Added to `IN_PROCESS_ENGINE_IDS`

## Navigator AI injection

In `server/navigator-routes.ts` → `assembleContext()`:
- Keyword list: gun, shooting, shot, gunshot, firearm, weapon, homicide, murder, killed, fatality, fatal, violence, violent crime, mass shooting, drive-by, community safety, neighborhood safety, public safety, ace, adverse childhood, trauma informed
- When matched: calls `getGunViolenceIntelligenceData()` and injects `[GUN VIOLENCE INTELLIGENCE]` block with headline numbers, ACE/poverty correlations, top 5 root causes with r-values, latest CDC/FBI year, evidence-based policy summary, top RPLICE finding, local registry counts
- State-level enrichment: if a state is detected in the query, finds that state's CDC crude/age-adjusted rate from `cdcStates` array

**Why:** The Navigator is the primary CHW touchpoint. When a CHW asks about violence in their community, they should get grounded federal data — not a generic response.

## Daily scheduler (server/index.ts)

- Runs regardless of environment (dev + prod)
- 3-minute startup delay so boot load settles
- Every 24 hours thereafter
- Uses dynamic import to avoid circular-ref at startup
- Errors logged as WARN, never crash the server

## PDF export (client/src/pages/gun-violence-intelligence.tsx)

- "Download PDF" button opens a new window, writes a self-contained HTML document with inline CSS, and calls `window.print()`
- Footer always includes data source attribution: CDC WONDER · FBI UCR · NCVS · WISQARS · RPLICE · GVA
- No new package dependency

## Summary / GET endpoint

`GET /api/gun-violence/summary` returns both aggregate counts AND individual incident rows:
- `incidents` (number) — total count matching filters
- `rows` (array) — individual rows (city, state, zip, occurredAt, incidentType, victimCount, fatalCount) — no PII
- Filter params: `zip`, `city`, `state`, `ward`, `from`, `to`, `limit` (max 500)

**Why:** The IncidentRows component on the hub page uses `data.rows`; the aggregate count field is `data.incidents`.

## Chicago community brief

`server/community-intelligence-routes.ts` detects 606xx ZIPs and injects a `gunViolenceContext` block by calling `fetchChicagoGunViolenceContext()` in parallel with other brief assembly.

## Local DB

Table: `gun_violence_incidents` — has `state` column (added via migration `0007_gvi-state-column.sql`). 500 GVA records seeded (Jan–Feb 2026). Idempotent sync via `(incidentId, dataSource)` unique constraint.

## How to apply

- Before adding a new AI context block, check that the keyword list doesn't already cover the case
- Before widening the `rows` select in the summary endpoint, confirm no PII columns are being added — the current select is geography + type + counts only
- The `_intelligenceCache` is module-level and process-lifetime; it does NOT survive server restarts. That's intentional — stale cache is max 1 hour.
