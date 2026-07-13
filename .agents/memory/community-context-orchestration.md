---
name: Community Context Orchestration
description: How live community intelligence (Census + RPLICE) flows automatically into every AI call across the platform.
---

## The Architecture

`server/community-context.ts` is the orchestration hub. Uses Node.js `AsyncLocalStorage` so community data flows through the async call stack without any route-level changes.

## How it flows

1. `communityContextMiddleware()` registered in `server/routes.ts` after `dosageTrackingMiddleware`.
2. Extracts ZIP from: `body.zip`, `body.zipCode`, `body.zip_code`, `body.geography.zip`, `body.location.zip`, `body.address.zip`, `body.brief.geography.zip`, `params.zip`, `query.zip`.
3. Hot path: ZIP is cached → wraps `next()` in `AsyncLocalStorage.run()` → all downstream AI calls inherit context.
4. Cold path: ZIP not cached → fires `warmCommunityContext(zip)` in background → next request for same ZIP hits cache.
5. `withEthicalPreamble()` in `ai-provider.ts` calls `getCurrentCommunityContext()` and appends it to EVERY system prompt when context is active.

## Cache

- TTL: 30 minutes per ZIP
- Max entries: 80 (LRU eviction by expiry)
- In-flight deduplication: same ZIP requested simultaneously → one fetch, all callers share result

## What the context block contains

Built by `buildCommunityAIContext({ zip, stateFips, countyFips, crisisDomains })`:
- Census ACS 5-year: population, median income, poverty rate, unemployment, uninsured, no HS diploma, single-parent %, SNAP %, limited English, SVI score, needsAttention flags
- RPLICE community analysis: 15 domains sorted by severity, CFIR construct tags
- RPLICE aiContextBlock: IS frameworks, grant profiles, implementation science

## Navigator special case

Navigator detects ZIP from message text (not request body), so middleware doesn't catch it. The Navigator ZIP block calls `buildCommunityAIContext({ zip })` directly in parallel with GIS lookup and injects into `contextParts`. This also populates the cache for future requests.

## GPP export

`POST /api/conductor/export-to-grantpathpro` calls `buildRpliceIntelligencePackage` with `stateFips` derived from `geography.stateFips || stateFipsFromZip(zip) || stateFipsFromName(state)`.

**Why:** The original design sent community data TO GPP but never injected it into ThriveUp's own AI surfaces. AsyncLocalStorage is the right tool because it flows automatically without touching 20+ route files.

**How to apply:** Any new AI surface that knows geography should either (a) have ZIP in request body (middleware handles it automatically) or (b) call `warmCommunityContext(zip)` + `runWithCommunityContext(ctx, () => callAI(...))` directly.
