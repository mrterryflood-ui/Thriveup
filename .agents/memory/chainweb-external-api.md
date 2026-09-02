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

### Civic Signal bidirectional connector
- Each direction has its own authentication and lifecycle. Never infer that a failure in one direction invalidates the other direction's credential.
- Civic Signal’s administrator attested that its earlier ThriveUp read failure was caused by its client selecting the wrong local secret variable, not by an invalid ThriveUp-issued credential. After its correction, its authenticated read probe returned HTTP 200.
- The active Civic Signal-to-ThriveUp inbound credential is the registered Civic Signal ecosystem credential; ThriveUp's malformed-payload probe reached validation (HTTP 400), proving authentication passed without storing test data.
- Civic Signal’s remote-write watchdog remains intentionally contained until its administrator-recovery process is recorded and a truthful, bounded lesson can be exchanged with an acceptance receipt. Do not fabricate a lesson or bypass that audit to make a status display green.
- ThriveUp-to-Civic Signal health must be measured separately by its own live pull/push receipt. Do not tell either operator to rotate or re-register credentials from a one-direction 401 alone.
- Civic Signal retired the key-only `/api/thriveup/*` routes in favor of `POST /api/partner-exchange/v1/thriveup-lessons[/query]`. The replacement currently rejects ThriveUp with partner authorization failure, so keep durable fallback explicit and do not claim the live leg is connected.

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
