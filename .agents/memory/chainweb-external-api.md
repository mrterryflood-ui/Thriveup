---
name: Chainweb External API
description: Architecture and status of the Chainweb Evidence API for external partner consumption (Civic Signal, ecosystem partners).
---

## What was built

### External API endpoints (all in server/chainweb-routes.ts)
- `GET /api/chainweb/programs?topic=&domain=&limit=` — evidence-based program search (auth required)
- `GET /api/chainweb/programs/:id/evidence` — full evidence record + matching coefficients (auth required)
- `GET /api/chainweb/jurisdiction?state=&topic=&outcome=` — state/jurisdiction policy history (auth required)
- `POST /api/chainweb/webhook/civic-signal` — receives incoming lessons FROM Civic Signal (auth required)
- `GET /api/chainweb/api-info` — discovery endpoint, no auth required

### Auth middleware
- Header: `x-ecosystem-key`
- Key format: `tveco_[platformname]_[hash]`
- Production keys: env vars `CIVIC_SIGNAL_ECOSYSTEM_KEY`, `ECOSYSTEM_PARTNER_KEY_1`, `ECOSYSTEM_PARTNER_KEY_2`
- Development: any `tveco_` prefix accepted
- Rate limit: 60 req/min per key (SHA-256 of key+IP as bucket key, sliding window in-memory)

### Data in server/chainweb-coefficients.ts
- `EVIDENCE_PROGRAMS`: 10 programs — NFP, Perry Preschool, Housing First, RNR/CBI, BBBS, MST, Dads Care 2, Benefits Navigation, CHW Model, TF-CBT
- `JURISDICTION_DATA`: 10 records — TX (6), CA, IL, US failed policies (mandatory minimums, DARE)

### Civic Signal bidirectional connector (server/civic-signal-connector.ts)
- `receiveCivicSignalLesson()` — live, receives lessons via webhook, stores in-memory (last 100), injects into RAG
- `getCivicSignalRAGContext()` — formats lessons as RAG paragraph
- `pushChainwebToCivicSignal()` — STUB, graceful no-op until `CIVIC_SIGNAL_BASE_URL` + `CIVIC_SIGNAL_API_KEY` secrets set
- `fetchCivicSignalAdaptations()` — STUB, returns cached webhook lessons until live credentials configured

### Community Story tab (/chainweb page)
- Tab 4 (between Results and Coefficient Library)
- Parses `form.geographyFips` (5-digit, e.g. "48453") → stateCode="48", countyCodes="453"
- Passes to `SDOHImpactChain` component — live Census/CDC/SVI data when authenticated
- Bridging callout explains this is the human story behind the ROI math
- CTAs cross-link to Build and Results tabs

### API documentation
- Written to `docs/civic-signal-api-guide.md` — ready to send to Civic Signal

## What's pending
**From Dr. Flood / Civic Signal:**
1. Civic Signal base URL → set as `CIVIC_SIGNAL_BASE_URL` secret
2. Auth header name + token → set as `CIVIC_SIGNAL_API_KEY` secret
3. Endpoint path for receiving ROI evidence from ThriveUp
4. Endpoint path for pulling adaptation lessons to ThriveUp
5. Payload schema for both

Once credentials arrive: replace TODO stubs in `server/civic-signal-connector.ts` lines `pushChainwebToCivicSignal()` and `fetchCivicSignalAdaptations()` with real endpoint calls. The connector is fully structured — it's a one-session wiring job.

**Why:**
Civic Signal is a policy intelligence platform that adapts evidence to local context. ThriveUp pushes ROI calculations + SDOH community data; Civic Signal pushes back adaptation lessons about what's working in other jurisdictions. This bidirectional loop strengthens both platforms' AI engines.
