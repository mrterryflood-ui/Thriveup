# ThriveUp / TCAF Chainweb Evidence API
## Integration Guide for Civic Signal

**Contact:** terryflood@thrivingcommunitiesforall.com  
**Base URL:** `https://thrivingcommunitiesforall.com`  
**API Version:** 1.0.0  
**Last Updated:** 2026-06-22

---

## Overview

The ThriveUp Chainweb Evidence API gives Civic Signal's adaptation engine access to:

1. **Evidence-based program catalog** — 10 intervention programs with effect sizes, citations, what worked, what failed, and ROI per dollar
2. **State/jurisdiction policy history** — 10 jurisdiction records across TX, CA, IL, US (including failed policies like mandatory minimums and DARE)
3. **26 causal ripple coefficients** — the evidence-based coefficients powering the Chainweb ROI engine (already public via `/api/chainweb/coefficients`)
4. **RAG context injection** — pre-formatted evidence paragraph for authenticated first-party AI prompt injection (`/api/chainweb/rag-context`)

In addition, ThriveUp accepts **incoming policy lessons** from Civic Signal via a webhook endpoint, enabling a bidirectional intelligence loop.

---

## Authentication

The two directions use separate authentication contracts.

### Civic Signal → ThriveUp

ThriveUp's Chainweb partner endpoints require the `x-ecosystem-key` header:

```
x-ecosystem-key: tveco_civicsignal_[your-key]
```

**To get a key:** Contact terryflood@thrivingcommunitiesforall.com with your platform name, use case, and expected request volume. Keys are issued in the format `tveco_[platformname]_[hash]`.

**Development testing:** During testing, any key beginning with `tveco_` is accepted in the non-production environment.

### ThriveUp → Civic Signal Partner Exchange v1

ThriveUp sends lessons to Civic Signal using a separate production credential for each direction:

- Write: `CIVIC_SIGNAL_PARTNER_TOKEN` and `CIVIC_SIGNAL_PARTNER_KEY_ID`
- Read: `CIVIC_SIGNAL_PARTNER_READ_TOKEN` and `CIVIC_SIGNAL_PARTNER_READ_KEY_ID`

Each request uses `Authorization: Bearer`, `X-Civic-Key-Id`, `X-Civic-Timestamp`, `X-Civic-Nonce`, `X-Civic-Partner-Origin`, and `X-Civic-Signature`. The signature is HMAC-SHA256 over the timestamp, nonce, exact origin, uppercase method, path, and SHA-256 hash of the recursively stable-sorted JSON body.

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Daily limit | 5,000 |
| Max results per page | 25 |

Rate limit responses return HTTP 429 with:
```json
{
  "error": "Rate limit exceeded",
  "retryAfterMs": 45000,
  "limit": "60 requests/minute"
}
```

---

## Endpoints

### 1. Program/Intervention Lookup

**`GET /api/chainweb/programs`**

Search the evidence-based program catalog by topic keyword and/or domain.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | no | Keyword search (matches name, short name, keywords, population) |
| `domain` | string | no | Filter by domain: `early_childhood`, `education`, `workforce`, `housing`, `health`, `justice`, `family`, `civic`, `economic` |
| `limit` | integer | no | Max results (default: 10, max: 25) |

**Results sorted:** Strong evidence → Moderate → Emerging, then by ROI ratio descending.

**Example Request:**
```
GET /api/chainweb/programs?topic=reentry&domain=justice&limit=3
x-ecosystem-key: tveco_civicsignal_[key]
```

**Example Response:**
```json
{
  "query": { "topic": "reentry", "domain": "justice", "limit": 3 },
  "count": 1,
  "programs": [
    {
      "id": "rnr_reentry",
      "name": "Risk-Need-Responsivity (RNR) Reentry Programs",
      "shortName": "RNR/CBI Reentry",
      "domains": ["justice", "workforce", "housing", "economic", "family"],
      "targetPopulation": "Adults returning from incarceration; highest effects for moderate-to-high-risk individuals",
      "deliveryModel": "Structured cognitive-behavioral intervention targeting criminogenic needs; pre- and post-release",
      "roiPerDollar": 2.80,
      "replicationQuality": "strong",
      "clearinghouseRating": "CrimeSolutions.gov: Effective (multiple RNR-based programs)",
      "topEffectSize": {
        "outcome": "Recidivism reduction (re-arrest/re-conviction)",
        "size": "20–40",
        "unit": "% reduction across meta-analyses",
        "citation": "Andrews, D. & Bonta, J. (2010). Rehabilitating Criminal Justice Policy and Practice. Psychology, Public Policy, and Law, 16(1), 39–55."
      },
      "notes": "RNR is a framework, not a single program. TCAF's Chainweb school-to-prison pipeline template is built on this framework."
    }
  ]
}
```

**Available program IDs:**
- `nurse_family_partnership` — Nurse-Family Partnership (early childhood, health)
- `perry_preschool` — HighScope Perry Preschool Program (early childhood, education)
- `housing_first` — Housing First / Pathways to Housing (housing, health)
- `rnr_reentry` — Risk-Need-Responsivity Reentry Programs (justice, workforce)
- `big_brothers_big_sisters` — BBBS Community-Based Mentoring (family, education)
- `multisystemic_therapy` — Multisystemic Therapy (family, justice)
- `dads_care_2` — Dads Care 2 / Father Re-engagement (family, early childhood)
- `snap_navigation` — Benefits Navigation / SNAP Enrollment (economic, health)
- `community_health_worker` — CHW Model (health, economic)
- `trauma_focused_cbt` — TF-CBT (health, family)

---

### 2. Evidence Detail by Program ID

**`GET /api/chainweb/programs/:id/evidence`**

Full evidence record for a specific program: all effect sizes, what worked, what failed, citations, and the matching causal coefficients from the Chainweb library.

**Path Parameter:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Program ID from the `/programs` list (e.g., `nurse_family_partnership`) |

**Example Request:**
```
GET /api/chainweb/programs/housing_first/evidence
x-ecosystem-key: tveco_civicsignal_[key]
```

**Example Response:**
```json
{
  "program": {
    "id": "housing_first",
    "name": "Housing First (Pathways to Housing Model)",
    "shortName": "Housing First",
    "topicKeywords": ["housing", "homelessness", "homeless", "supportive housing"],
    "domains": ["housing", "health", "economic", "justice"],
    "targetPopulation": "Chronically homeless adults, including those with serious mental illness and co-occurring substance use",
    "deliveryModel": "Immediate permanent housing (scattered-site) with voluntary wraparound services; no sobriety requirement",
    "effectSizes": [
      {
        "outcome": "Housing retention at 2 years",
        "size": "80 vs 30",
        "unit": "% (treatment vs usual care)",
        "citation": "Tsemberis, S. et al. (2004). Housing First, consumer choice, and harm reduction. American Journal of Public Health, 94(4), 651–656."
      },
      {
        "outcome": "Government cost reduction vs. shelter cycling",
        "size": "40",
        "unit": "% reduction",
        "citation": "Culhane, D. et al. (2002). Public Service Reductions Associated with Placement of Homeless Persons. Housing Policy Debate, 13(1), 107–163."
      }
    ],
    "roiPerDollar": 1.40,
    "roiCitation": "Montgomery, A. et al. (2016). Housing First and cost offsets. Psychiatric Services, 67(2), 168–172.",
    "whatWorked": [
      "Immediate housing — no 'housing readiness' requirement is the critical fidelity element",
      "Harm reduction philosophy rather than abstinence requirement"
    ],
    "whatFailed": [
      "Substance use outcomes are mixed — housing stability improves but substance use may not decrease without treatment",
      "Family homelessness implementation has weaker evidence than adult chronic homelessness"
    ],
    "replicationQuality": "strong",
    "clearinghouseRating": "SAMHSA Evidence-Based Practices Resource Center: Strong Research Evidence",
    "notes": "Canadian At Home/Chez Soi trial (2,000+ participants) confirmed US findings."
  },
  "causaLCoefficients": [
    {
      "fromDomain": "housing",
      "toDomain": "health",
      "fromMetric": "Housing instability rate",
      "toMetric": "ER visit rate per 1,000",
      "coefficient": 0.28,
      "direction": "positive",
      "lagYears": 0,
      "unit": "visits per instability point",
      "evidenceCitation": "Culhane, D. et al. (2002). Housing Policy Debate, 13(1), 107–163.",
      "confidenceLevel": "strong"
    }
  ],
  "meta": {
    "source": "ThriveUp / TCAF Evidence Library",
    "lastUpdated": "2024-12-01",
    "contact": "terryflood@thrivingcommunitiesforall.com",
    "disclaimer": "Effect sizes are from peer-reviewed literature. TCAF program data (Dads Care 2) is primary-source organizational data available upon request."
  }
}
```

---

### 3. State/Jurisdiction Policy History

**`GET /api/chainweb/jurisdiction`**

What states have tried on a topic, what happened, and what it cost. Includes failed policies. Also returns related evidence-based programs from the catalog.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string | no | 2-letter state code or full name (e.g., `TX`, `California`) |
| `topic` | string | no | Keyword (e.g., `pre-k`, `reentry`, `housing`, `fatherhood`) |
| `outcome` | string | no | Filter by outcome: `effective`, `null_effect`, `harmful`, `mixed`, `ongoing_promising` |

**Example Request:**
```
GET /api/chainweb/jurisdiction?state=TX&topic=pre-k
x-ecosystem-key: tveco_civicsignal_[key]
```

**Example Response:**
```json
{
  "query": { "state": "TX", "topic": "pre-k", "outcome": "" },
  "count": 1,
  "jurisdictionRecords": [
    {
      "state": "Texas",
      "stateCode": "TX",
      "topic": "early_childhood",
      "topicKeywords": ["pre-k", "preschool", "early childhood", "early education"],
      "policyName": "Texas Pre-K 4 SA (San Antonio)",
      "yearImplemented": 2013,
      "yearEnded": null,
      "outcome": "effective",
      "evidenceSummary": "Full-day pre-K in San Antonio ISD. 78% of graduates met kindergarten readiness standards vs. 62% statewide. Strong outcomes for Black and Latino students. Funded by city 1/8-cent sales tax — a local innovation bypassing state funding limits.",
      "costInvestment": "$16,000 per child annually",
      "primaryCitation": "Texas Education Agency / Pre-K 4 SA Independent Evaluation (2022). Annual Program Evaluation Report. San Antonio, TX."
    }
  ],
  "relatedEvidencePrograms": [
    {
      "id": "perry_preschool",
      "name": "HighScope Perry Preschool Program",
      "roiPerDollar": 12.90,
      "replicationQuality": "strong"
    },
    {
      "id": "nurse_family_partnership",
      "name": "Nurse-Family Partnership",
      "roiPerDollar": 5.70,
      "replicationQuality": "strong"
    }
  ],
  "meta": {
    "source": "ThriveUp / TCAF Policy Intelligence Library",
    "contact": "terryflood@thrivingcommunitiesforall.com"
  }
}
```

**Available outcomes to filter by:**

| Outcome Value | Meaning |
|---------------|---------|
| `effective` | Strong positive outcomes documented |
| `null_effect` | No statistically significant effect (e.g., DARE) |
| `harmful` | Negative outcomes documented (e.g., mandatory minimums) |
| `mixed` | Some positive, some null or negative findings |
| `ongoing_promising` | Too early for full evaluation, early indicators positive |

---

### 4. Civic Signal Webhook — Receive Policy Lessons (Bidirectional)

**`POST /api/chainweb/webhook/civic-signal`**

Civic Signal pushes policy adaptation lessons TO ThriveUp. Lessons are stored and injected into the Chainweb RAG context, surfacing in narrative generation and community story output.

**Example Request:**
```
POST /api/chainweb/webhook/civic-signal
x-ecosystem-key: tveco_civicsignal_[key]
Content-Type: application/json

{
  "lesson": "In Colorado, Housing First implementations that included employer partnerships reduced 2-year return-to-shelter rates by 22% compared to housing-only implementations. The key was a 3-month employment bridge during housing stabilization.",
  "topic": "housing",
  "state": "CO",
  "source": "civic_signal_adaptation_engine_v2",
  "confidence": "high",
  "programIds": ["housing_first"],
  "roiImplication": "Employer partnership component raises estimated ROI from $1.40 to $1.87 per dollar invested over 5 years"
}
```

**Example Response:**
```json
{
  "ok": true,
  "received": {
    "stored": true,
    "lessonId": "cs_1719072000000_a3f9b2"
  }
}
```

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lesson` | string | **required** | The policy adaptation lesson text |
| `topic` | string | no | Topic category (e.g., `housing`, `pre-k`, `reentry`) |
| `state` | string | no | State where lesson originates (2-letter code, or `US` for national) |
| `source` | string | no | Name of the sending system (e.g., `civic_signal_adaptation_engine_v2`) |
| `confidence` | string | no | `high`, `moderate`, or `low` |
| `programIds` | string[] | no | Array of matching program IDs from the evidence catalog |
| `roiImplication` | string | no | What this lesson means for ROI calculations |

---

### 5. ThriveUp Partner Exchange — Send Lessons

**`POST https://power2thepeople.net/api/partner-exchange/v1/thriveup-lessons`**

The production write operation requires the separately issued `thriveup-lessons:write` credential. A successful request returns HTTP `201`, `contractVersion: "1.0"`, `status: "accepted"`, and a trace ID.

**Accepted request body:**

```json
{
  "contractVersion": "1.0",
  "topic": "housing_navigation",
  "state": "TX",
  "lesson": "Public program navigation improved when eligibility steps were stated before referral.",
  "confidence": "medium",
  "programIds": ["community_health_worker"],
  "roiImplication": "No verified ROI claim was supplied.",
  "source": "thriveup_chainweb",
  "observedAt": "2026-09-09T19:44:40.000Z"
}
```

The outbound body must not include `eventType`, `sourceDate`, `sourceVersion`, `direction`, or `createdAt`. The read credential is separate and cannot be combined with the write credential.

**`POST https://power2thepeople.net/api/partner-exchange/v1/thriveup-lessons/query`**

The production read operation requires `thriveup-lessons:read`. A successful query returns HTTP `200`.

---

### 6. API Discovery (No Auth Required)

**`GET /api/chainweb/api-info`**

Returns available endpoints, program count, coefficient count, rate limits, and key issuance contact. No auth header required.

```
GET /api/chainweb/api-info
```

---

### 7. Coefficient Library (No Auth Required — Already Public)

**`GET /api/chainweb/coefficients`**

Returns all 26 evidence-based causal ripple coefficients. No auth required.

```
GET /api/chainweb/coefficients?fromDomain=early_childhood
```

---

### 8. RAG Context (Authenticated First-Party Session Required)

**`GET /api/chainweb/rag-context`**

Pre-formatted evidence paragraph for internal AI prompt injection. This is not a partner API and requires an authenticated first-party session.

```
GET /api/chainweb/rag-context?geography=Travis+County&domain=education&grantType=workforce
```

---

## Error Responses

| HTTP Status | Meaning |
|-------------|---------|
| `200` | Success |
| `401` | Missing `x-ecosystem-key` header |
| `403` | Invalid or unregistered key |
| `404` | Program ID not found |
| `429` | Rate limit exceeded — see `retryAfterMs` in response body |
| `500` | Server error — contact terryflood@thrivingcommunitiesforall.com |

---

## Bidirectional Flow Architecture

```
ThriveUp Chainweb Engine                    Civic Signal Adaptation Engine
─────────────────────────                    ──────────────────────────────
GET /api/chainweb/programs           →       Policy lookup for topic
GET /api/chainweb/programs/:id/evidence →    Effect sizes + citations
GET /api/chainweb/jurisdiction       →       What TX, CA, IL have tried

POST /api/chainweb/webhook/civic-signal ←   Push adaptation lessons back
(receives from Civic Signal)

PENDING — awaiting Civic Signal API details:
ThriveUp pushes Chainweb ROI results →      civic-signal-connector.ts stub built
ThriveUp pulls new adaptations      ←       fetchCivicSignalAdaptations() stub built
```

**To complete the bidirectional flow:** Provide ThriveUp with:
1. Civic Signal base URL
2. Auth header name and token format
3. Endpoint path for receiving ROI evidence
4. Endpoint path for pulling adaptation lessons
5. Payload schema for both

Once received, Dr. Flood will set `CIVIC_SIGNAL_BASE_URL` and `CIVIC_SIGNAL_API_KEY` as Replit secrets and the connector goes live immediately.

---

## Security

- All authenticated endpoints require the `x-ecosystem-key` header
- Keys are validated server-side against registered values in Replit secrets
- No PII is stored or returned by any endpoint
- All data is from peer-reviewed literature or primary-source TCAF program evaluation data
- Rate limiting uses a cryptographic hash of key + IP — not user-supplied headers

---

## Data Currency

| Dataset | Last Updated | Source |
|---------|-------------|--------|
| Evidence programs catalog | 2024-12-01 | Peer-reviewed literature (citations in each record) |
| Jurisdiction policy records | 2025-06-01 | Published state agency reports |
| Causal coefficients | 2024-12-01 | WSIPP, Heckman, Annie E. Casey, BJS, RAND, Vera |
| TCAF program data (Dads Care 2) | 2024-12-01 | TCAF organizational records |

---

*Document generated by ThriveUp's Chainweb ROI Engine build session, 2026-06-22*
