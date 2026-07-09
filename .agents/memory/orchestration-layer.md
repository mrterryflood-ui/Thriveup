---
name: Platform-wide Orchestration Layer (Chainweb Conductor)
description: Status and hard constraints for the cross-engine "conductor" that merges platform engines into one geography-scoped answer.
---

## What exists
- `server/orchestration/engine-registry.ts` — manifest of platform engines with domain/geography-grain/PII tags.
- `server/orchestration/conductor.ts` — `getOrchestratedIntelligence(geo, {engines?, domains?})` calls relevant engines in parallel, returns provenance-tagged bundle.
- Wired into `queryRAG` (both non-streaming and streaming paths) in `server/rag-engine.ts` — geography auto-detected from a ZIP mentioned in the user's query.
- 7 engines now wired into the in-process Conductor (`IN_PROCESS_ENGINE_IDS` in `conductor.ts`): chainweb-engine, gis-engine, equity, benefits, corridor-chainweb (read-only accessor `getLastChainWebRun()` — never triggers a live Census/FBI-hitting run), scorecard, corridor-story (Waco/Austin I-35 narrative — hardcoded to McLennan 48309 / Travis 48453 only, returns explicit out-of-scope error for any other county; verified via direct in-process call returning real ACS/CDC-sourced data).
- Remaining route-only engines split into two real buckets, not just "not done yet": (a) live-external-API engines with no backing DB table (rural-health/-housing/-connectivity, neighborhood, regional-briefing) — wiring these in-process means either a refactor to a callable function or accepting multi-second external HTTP latency inside the Conductor's parallel call, not a quick win; (b) PII-bearing engines with no county-aggregate view over their core table (workforce, justice, clinical, trade-sims, farmworker-iti, foster-youth-agency, safe-passage, reentry, resident-journey) — `reentry`/`resident-journey` store individual plans/milestones/risk snapshots keyed by participantId with no county rollup; a safe aggregate (e.g. "N open reentry plans in county X") would need a new COUNT-style query, not just exposing the existing per-record query — don't wire the per-record query directly.
- Instrument picker has a real (minimal) UI: `client/src/pages/ecosystem-ai.tsx` has domain-toggle chips above the chat input that pass `domains` to `POST /api/ecosystem-ai/stream`; verified end-to-end with curl (domains filter accepted, sourced response returned).
- Pattern for adding a new DB-backed engine: check the table has a `countyFips` column (or equivalent geography key) in `shared/schema.ts` before wiring — most PII-bearing engines (workforce, justice, clinical) do NOT have a geography column on their core tables, so a true "safe aggregate by county" path isn't currently buildable for them without a schema change; don't fake it.

## Safety note discovered while wiring engines
`touchesPII: false` on an ENGINE_REGISTRY entry is a per-*engine* label, not a per-*table* guarantee. The `benefits` engine, for example, spans multiple tables — `benefitsEnrollmentData` (safe, county aggregate, no PII columns) but also `benefitsApplications`/`benefitsScreenings` (applicant name/phone/email, household composition). Conductor only ever queries `benefitsEnrollmentData` for this engine — do NOT extend it to the other benefits tables without re-classifying them, even though the registry entry says `touchesPII: false` at the engine level. Always open the actual table definition in `shared/schema.ts` and check for name/phone/email/address columns before wiring a new query, regardless of what the registry says.

## Hard constraints discovered (do not re-attempt without new info)
- **No free ZIP-only geocoding API exists.** Tested the Census Bureau Geocoder directly — both `geographies/address` and `geographies/onelineaddress` require a full street address; a bare ZIP returns zero matches. A real nationwide ZIP→county resolver requires bulk-loading the Census ZCTA relationship file into a DB table, not a live per-request API call.
- **Most engines are still route-only, not in-process callable.** 6 of 24 registered engines are wired (see above); the remaining ~18 (rural-*, workforce, justice, regional-briefing, neighborhood, safe-passage, reentry, clinical, trade-sims, college-access-ai, foster-youth-agency, farm-*, corridor-story, resident-journey) are listed in orchestration output as explicitly "not yet wired" rather than silently skipped — do not make them silently disappear.

## Why this matters
The project's whole culture is anti-fabrication (Iron Rule #2, #10, #11) — an orchestration/audit claim that isn't actually backed by a working code path or a real test run is a project-level trust violation here, not just a bug.

## How to apply
Before extending the Conductor to a new engine, check `IN_PROCESS_ENGINE_IDS` in `conductor.ts` — if the target engine isn't in that list, either add a genuine function-call path or an internal-fetch-to-its-own-route path; don't fake a result.
