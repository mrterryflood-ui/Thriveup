---
name: ChildCORE Partner API
description: Live bidirectional partner API for community providers, schools, SDOH, and impact data by ZIP. Two-way connection wired into community intelligence layer.
---

## What it is
ChildCORE Partner API v1.0 — live at `https://useful-viper-536.convex.site/api/v1/`
Docs: https://childcore.app/docs/partner-api

## Authentication
`Authorization: Bearer <CHILDCORE_API_KEY>` — this is the key ChildCORE issues to ThriveUp and it belongs in this site's Replit Secrets.
`/ping` is the only unauthenticated endpoint.

## Endpoints
- `GET /ping` — health check, no auth (returns `{"status":"ok","service":"ChildCORE Partner API","version":"1.0.0"}`)
- `GET /community/{zip}/providers` — community providers for a ZIP
- `GET /community/{zip}/schools` — school intelligence for a ZIP
- `GET /community/{geo}/sdoh` — social determinants data
- `GET /community/{geo}/impact` — aggregate impact data
- `POST /push` — push ThriveUp events to ChildCORE

## Integration points
- `server/childcore-connector.ts` — connector (fetch helpers, community data pull, AI context builder, push function, status probe); outbound auth reads `CHILDCORE_API_KEY`
- `server/childcore-routes.ts` — Express routes registered at `/api/childcore/*`; GET routes require ThriveUp session auth; push requires admin role
- `server/routes.ts` — routes registered via dynamic import after `/api/civic-signal`
- `server/rplice-intelligence.ts` — `getChildCORECommunityData(zip)` added as 4th parallel call in `buildCommunityAIContextWithStatus`; `buildChildCOREContextBlock()` appended to community AI context; `CommunityAIContextResult.sources.childcore` field added
- `server/grantpathpro-routes.ts:1576` — timeout fallback object also needed `childcore` field (TS error, fixed)

## Homepage
`PartnerNetworkSection` in `client/src/pages/landing.tsx` shows 4 live data partners (ChildCORE, Civic Signal, RPLICE, Census) with live ping badge for ChildCORE.

## Evidence class
Partner-reported. AI context label: "Source: ChildCORE Partner API (live, partner-reported)."
Never represented as independently verified.

**Why:** Dr. Flood connected ChildCORE at https://useful-viper-536.convex.site/api/v1/ and requires separate credentials for outbound ChildCORE access versus inbound ThriveUp access.
**How to apply:** Any new community-intelligence surface that pulls ChildCORE data should call `getChildCORECommunityData(zip)` and use `buildChildCOREContextBlock(data)` to produce the AI context block. Ping is unauthenticated and safe to call from the frontend. ChildCORE's inbound credential is created separately in Settings → Partner API and given to ChildCORE as its `THRIVEUP_API_KEY`.
