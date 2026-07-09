---
name: Platform-wide Orchestration Layer (Chainweb Conductor)
description: Status and hard constraints for the cross-engine "conductor" that merges platform engines into one geography-scoped answer.
---

## What exists
- `server/orchestration/engine-registry.ts` — manifest of platform engines with domain/geography-grain/PII tags.
- `server/orchestration/conductor.ts` — `getOrchestratedIntelligence(geo, {engines?, domains?})` calls relevant engines in parallel, returns provenance-tagged bundle.
- Wired into `queryRAG` (both non-streaming and streaming paths) in `server/rag-engine.ts` — geography auto-detected from a ZIP mentioned in the user's query.

## Hard constraints discovered (do not re-attempt without new info)
- **No free ZIP-only geocoding API exists.** Tested the Census Bureau Geocoder directly — both `geographies/address` and `geographies/onelineaddress` require a full street address; a bare ZIP returns zero matches. A real nationwide ZIP→county resolver requires bulk-loading the Census ZCTA relationship file into a DB table, not a live per-request API call.
- **Most engines are route-only, not in-process callable.** Only engines with a plain exported function (chainweb, gis-engine) or a direct-DB-query path are wired into the Conductor today. Route-only engines (benefits, rural-*, workforce, justice, etc.) are listed in orchestration output as explicitly "not yet wired" rather than silently skipped — do not make them silently disappear.

## Why this matters
The project's whole culture is anti-fabrication (Iron Rule #2, #10, #11) — an orchestration/audit claim that isn't actually backed by a working code path or a real test run is a project-level trust violation here, not just a bug.

## How to apply
Before extending the Conductor to a new engine, check `IN_PROCESS_ENGINE_IDS` in `conductor.ts` — if the target engine isn't in that list, either add a genuine function-call path or an internal-fetch-to-its-own-route path; don't fake a result.
