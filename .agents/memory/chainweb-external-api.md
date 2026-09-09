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

### Civic Signal bidirectional connector — updated credential contract

**Inbound (Civic Signal → ThriveUp):**
- Civic Signal uses `THRIVEUP_ISSUED_KEY` in `x-ecosystem-key` header
- `chainweb-routes.ts` already validates this — inbound auth is configured and working
- Civic Signal probes: `GET /api/chainweb/programs?topic=health&limit=1`
- Civic Signal pushes lessons to: `POST /api/chainweb/webhook/civic-signal`
- Civic Signal fetches RAG context from: `GET /api/chainweb/rag-context` (now accepts ecosystem key)

**Outbound (ThriveUp → Civic Signal) — Partner Exchange v1:**
- `POWER2PEOPLE_ISSUED_KEY` is permanently retired; old routes return 410
- Requires new credential issued by Civic Signal admin via `POST /api/partner-exchange/v1/admin/credentials`
- Write secrets: `CIVIC_SIGNAL_PARTNER_TOKEN` (bearer) and `CIVIC_SIGNAL_PARTNER_KEY_ID`
- Read secrets are separate because Civic Signal does not allow read and write scopes on one credential: `CIVIC_SIGNAL_PARTNER_READ_TOKEN` and `CIVIC_SIGNAL_PARTNER_READ_KEY_ID`
- Six signed headers: Authorization Bearer, X-Civic-Key-Id, X-Civic-Timestamp, X-Civic-Nonce, X-Civic-Partner-Origin, X-Civic-Signature
- Body must include `contractVersion: "1.0"` and be stable-key-sorted before HMAC signing
- HMAC: SHA-256 over `timestamp\nnonce\norigin\nMETHOD\npath\nbody-sha256-hex`, secret = bearer token
- After credential issuance, Civic Signal admin must enable production direction via `PATCH /api/partner-exchange/v1/admin/directions`
- Success requires HTTP 201 + `contractVersion: "1.0"` + `status: "accepted"` + trace ID
- Read (`thriveup-lessons:read`) and write (`thriveup-lessons:write`) require separate credentials

**Status endpoint:** `GET /api/civic-signal/status` reports all four states accurately.
**Current state:** Inbound configured; outbound awaiting v1 credential issuance by Civic Signal admin.

### Community Story tab (/chainweb page)
- Tab 4 (between Results and Coefficient Library)
- Parses `form.geographyFips` (5-digit, e.g. "48453") → stateCode="48", countyCodes="453"
- Passes to `SDOHImpactChain` component — live Census/CDC/SVI data when authenticated
- Bridging callout explains this is the human story behind the ROI math
- CTAs cross-link to Build and Results tabs

### API documentation
- Written to `docs/civic-signal-api-guide.md` — ready to send to Civic Signal

## Operating rule
Treat live cross-platform verification as directional and receipt-based:
1. authenticate a safe malformed request to prove the receiving auth boundary;
2. verify it is rejected before storage;
3. use only a truthful, bounded payload for a successful exchange;
4. retain the receiving system's explicit acceptance receipt;
5. keep participant, referral, intake, contact, and case information out of the exchange.

**Why:**
Civic Signal is a policy intelligence platform that adapts evidence to local context. Directional credentials and watchdog containment protect both systems, while a receipt-based proof prevents a green status from being mistaken for an unverified or fabricated data exchange.
