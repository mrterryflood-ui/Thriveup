# ThriveUp Academy — API Contract

> **Iron Rule:** Any agent building a new server route MUST read this document first.
> Any agent completing a task MUST run `npx tsx scripts/preflight.ts` and confirm exit 0 before calling `mark_task_complete`.

---

## Four Auth Patterns — When to Use Each

| Pattern | Middleware | When to Use | Header |
|---|---|---|---|
| **Session (Replit Auth)** | `requireAuth` | Any route a logged-in ThriveUp user calls from the browser | Session cookie (automatic) |
| **Partner API Key** | `requirePartnerAuth` + `requireScope(scope)` | External sites, ecosystem siblings, any machine-to-machine call from OUTSIDE the ThriveUp session system | `x-partner-key: tcaf_...` or `Authorization: Bearer tcaf_...` |
| **Ecosystem Machine-to-Machine** | `requireEcosystemAuth` | Platform-to-platform calls between the 15+ ecosystem siblings (Whole-Person Health → ThriveUp hub, etc.) | `x-ecosystem-key: <secret>` |
| **Public (no auth)** | _(none)_ | Read-only, non-sensitive, non-AI, non-mutating endpoints. Documentation and public catalogs. Authenticated health/keepalive routes are not public. | _(none)_ |

### Decision Rule (pick exactly one)

```
Is the caller a browser with a logged-in ThriveUp user session?
  YES → requireAuth

Is the caller an external partner site or app (not a ThriveUp session)?
  YES → requirePartnerAuth + requireScope(scope)

Is the caller another platform in the ThriveUp ecosystem (sibling platform)?
  YES → requireEcosystemAuth

Is the data fully public, non-sensitive, and does NOT call AI or paid APIs?
  YES → No auth, but add rate-limiting if called frequently

None of the above?
  STOP — clarify before building.
```

**NEVER use `CROSS_PLATFORM_API_KEY` (raw env var string comparison) for new routes.** That pattern is deprecated. Use `requirePartnerAuth` instead.

---

## Partner API Scopes

All partner keys use `x-partner-key: tcaf_...` and are scoped. Available scopes:

| Scope | What it unlocks |
|---|---|
| `content:read` | Ecosystem platform list and content export |
| `platforms:read` | Live platform health status and metadata |
| `community:read` | Community impact metrics and SDOH summary by ZIP/county |
| `benefits:read` | Public benefits program catalog |
| `impact:read` | Community intervention impact scores and outcome data |
| `student:read` | Aggregate, suppression-floored student progress metrics only; no per-student records or thrive-score detail |
| `chainweb:read` | Chainweb ROI coefficients, templates, scenarios, calculations, and narratives |
| `yhsi:read` | Aggregate, floor-5-suppressed YHSI metrics and outcome summaries |
| `inbound:write` | POST data into ThriveUp (referrals, events, metrics, alerts) |
| `outcomes:read` | Read aggregated outcome data — trade sim completion counts and employer-ready metrics (no PII) |
| `certs:read` | Verify and read certificate records |

Scopes are assigned at key creation time in the admin panel (Ops Center → Partner API tab). A key can have multiple scopes.

### Post-publish contract gate (automatic + manual)

After every publish, the Partner API contract is checked in two ways:

#### Automatic — production server startup probe

The server automatically probes its own contract 90 seconds after every
production startup (i.e., after every publish).  Results appear in the Replit
Deployments panel under Publishing → Logs:

- `[partner-api-contract] ✅ PASSED` — the surface matches; integration-live
  confirmation is cleared.
- `[partner-api-contract] ❌ FAILED` — drift detected; **do NOT send a
  ChildCORE or partner integration-live message** until the drift is fixed,
  redeployed, and the next startup log shows `✅ PASSED`.

The probe (`server/partner-api-contract-probe.ts`) discovers the production URL
from the `REPLIT_DOMAINS` environment variable, which Replit sets to the live
hostname (`.replit.app` or custom domain) in production containers.  It rejects
`.replit.dev` URLs so the dev-workspace domain can never be certified.

#### Manual — operator-run wrapper script

Operators can also run the check explicitly at any time by copying the published
URL from the Replit Deployments panel (Adjust settings → Published URL):

```bash
PUBLISHED_BASE_URL=https://easyailearning.com \
  npx tsx scripts/post-publish-partner-api-check.ts
```

Or invoke the `partner-api-contract` workflow from the Replit Workflows panel
with `PUBLISHED_BASE_URL` set.  This is useful for confirming readiness before
the 90-second startup probe has fired, or for re-checking after a rollback.

The wrapper (`scripts/post-publish-partner-api-check.ts`):

- Requires an explicit HTTPS `PUBLISHED_BASE_URL`.  Rejects `.replit.dev`
  URLs (dev-workspace domain) so a URL copied from the preview bar instead of
  the Deployments panel fails fast with a clear message.
- Distinguishes configuration errors (exit 2, check not run) from contract
  drift (exit 1, check ran and found a problem).
- Spawns `verify-published-partner-api-contract.ts`, which:
  - confirms the public `/api/partner/v1/docs` response advertises
    `chainweb:read` and `yhsi:read`, and lists the Chainweb, YHSI, and
    heartbeat routes with correct scope labels;
  - probes protected Chainweb, YHSI, and aggregate student routes without any
    credentials and requires `401` or `403`, so a stale published app's `404`
    is reported as deployment drift; and
  - sends a bodyless `POST /api/partner/v1/heartbeat` without partner data and
    requires `401` or `403`, proving the route is present without writing a
    heartbeat.

The community brief is available at both `GET /api/partner/v1/community-brief`
(canonical) and `GET /api/partner/v1/community/brief` (ChildCORE-compatible
alias). Both require `community:read` and accept the same geography query
parameters.

Neither script sends or prints a partner key, authorization header, or partner
payload.

**Operator rule:** a deployment whose `partner-api-contract` check has not
returned exit 0 since the last publish must NOT receive an integration-live
confirmation.

---

## Standard Route Template

Every new route file MUST follow this pattern:

```typescript
import type { Express } from "express";
import { requireAuth } from "./replit_integrations/auth/replitAuth"; // if session-auth

export function registerMyRoutes(app: Express) {

  app.get("/api/my-resource", requireAuth, async (req, res) => {
    try {
      // ... logic here
      res.json({ data });
    } catch (err: any) {
      console.error("[my-resource] GET error:", err);
      res.status(500).json({ error: "Failed to load resource." });
    }
  });

}
```

**Non-negotiables:**
1. Every route handler MUST be wrapped in `try { } catch (err: any) { console.error(...); res.status(500).json(...) }`
2. Every non-public route MUST have at least one auth middleware before the handler
3. Every new route file MUST be registered in `server/routes.ts` via `registerXxxRoutes(app)`
4. Every route MUST add `data-testid` to any new frontend elements it powers

---

## Base URLs by Caller Type

| Caller | Base URL | Auth Header |
|---|---|---|
| ThriveUp browser session | `/api/...` | Session cookie |
| External partner site | `/api/partner/v1/...` | `x-partner-key: tcaf_...` |
| Ecosystem sibling platform | `/api/ecosystem/...` | `x-ecosystem-key: <secret>` |
| Public (no auth) | `/api/...` | _(none)_ |

---

## Partner API route inventory

The complete scoped route inventory is also available as JSON at
`GET /api/partner/v1/docs`. The paths below use the `/api/partner/v1` base
path, and `any partner key` means the key does not need a particular scope.

| Method | Path | Required scope |
|---|---|---|
| GET | `/docs` | Public |
| GET | `/health` | Any partner key |
| POST | `/heartbeat` | Any partner key |
| GET, POST | `/webhooks` | Any partner key |
| DELETE | `/webhooks/:id` | Any partner key |
| GET | `/export` | `content:read` |
| GET | `/platforms` | `platforms:read` |
| GET | `/community` | `community:read` |
| GET | `/community-brief` | `community:read` |
| GET | `/community/brief` | `community:read` |
| GET | `/community-story` | `community:read` |
| POST | `/community-brief/subscribe` | `community:read` |
| GET | `/subscriptions` | `community:read` |
| DELETE | `/subscriptions/:id` | `community:read` |
| GET | `/benefits` | `benefits:read` |
| GET | `/impact` | `impact:read` |
| GET | `/students/overview` | `student:read` |
| GET | `/attendance/summary` | `student:read` |
| GET | `/early-warnings` | `student:read` |
| GET | `/pathways/overview` | `student:read` |
| GET | `/chainweb/coefficients` | `chainweb:read` |
| GET | `/chainweb/templates` | `chainweb:read` |
| POST | `/chainweb/scenarios` | `chainweb:read` |
| GET | `/chainweb/scenarios/:id` | `chainweb:read` |
| POST | `/chainweb/scenarios/:id/calculate` | `chainweb:read` |
| POST | `/chainweb/calculations/:id/narratives` | `chainweb:read` |
| GET | `/yhsi/metrics` | `yhsi:read` |
| GET | `/yhsi/outcomes-summary` | `yhsi:read` |
| GET | `/outcomes/trade-completions` | `outcomes:read` |
| GET | `/certificates/verify/:certId` | `certs:read` |
| POST | `/push` | `inbound:write` |
| POST | `/foster-youth/refer` | `inbound:write` |

---

## Copy-ready curl examples

These examples use the public `/api/partner/v1` contract. They contain no
credential: replace the host, the fake key placeholder, and the IDs returned by
earlier requests in your local shell. Use `Authorization: Bearer $PARTNER_KEY`
instead of `x-partner-key` if that is more convenient.

The community brief is limited to 20 requests per hour per partner key, and the
community story pack is limited to 10 requests per hour per partner key. A
limited request returns `429 Too Many Requests`.

```bash
BASE_URL="https://your-thriveup-host.example.com/api/partner/v1"
PARTNER_KEY="tcaf_replace_with_your_scoped_key"
```

### 1. Verify authentication

Required scope: any active partner key. Success: `200 OK`. Errors:
`401 Unauthorized` when the key is missing, invalid, or revoked.

```bash
curl --fail-with-body "$BASE_URL/health" \
  -H "x-partner-key: $PARTNER_KEY"
```

### 2. Read aggregate student metrics

Required scope: `student:read`. Success: `200 OK`. Errors:
`401 Unauthorized` for missing/invalid authentication or `403 Forbidden` when
the key lacks `student:read`. The response is aggregate-only and
suppression-floored.

```bash
curl --fail-with-body "$BASE_URL/students/overview?grade=10" \
  -H "x-partner-key: $PARTNER_KEY"
```

### 3. Read aggregate YHSI metrics

Required scope: `yhsi:read`. Success: `200 OK`. Errors:
`401 Unauthorized` for missing/invalid authentication or `403 Forbidden` when
the key lacks `yhsi:read`. Individual youth records are never returned.

```bash
curl --fail-with-body "$BASE_URL/yhsi/metrics" \
  -H "x-partner-key: $PARTNER_KEY"
```

### 4. Run a Chainweb scenario lifecycle

Required scope: `chainweb:read`. Each successful lifecycle request returns
`200 OK`. Invalid input or IDs return `400 Bad Request`; missing/invalid
authentication returns `401 Unauthorized`; a scenario owned by another key
returns `403 Forbidden`; unknown records return `404 Not Found`.

Create the scenario:

```bash
CREATE_RESPONSE=$(curl --fail-with-body "$BASE_URL/chainweb/scenarios" \
  -X POST \
  -H "x-partner-key: $PARTNER_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "Austin youth reengagement",
    "description": "Estimate the effect of a community-based education intervention.",
    "geographyType": "county",
    "geographyLabel": "Travis County, TX",
    "geographyFips": "48453",
    "entryDomain": "education",
    "interventionName": "Community-based mentoring",
    "interventionDescription": "Mentoring and reengagement support for high-school students.",
    "interventionCostPerPerson": "1500.00",
    "populationSize": 5000,
    "timeHorizonYears": 10
  }')
SCENARIO_ID=$(printf '%s' "$CREATE_RESPONSE" | jq -r '.id // empty')
test -n "$SCENARIO_ID" || { echo "Create response did not include an id."; exit 1; }
```

Read and calculate it:

```bash
curl --fail-with-body "$BASE_URL/chainweb/scenarios/$SCENARIO_ID" \
  -H "x-partner-key: $PARTNER_KEY"

CALCULATION_RESPONSE=$(curl --fail-with-body "$BASE_URL/chainweb/scenarios/$SCENARIO_ID/calculate" \
  -X POST \
  -H "x-partner-key: $PARTNER_KEY")
CALCULATION_ID=$(printf '%s' "$CALCULATION_RESPONSE" | jq -r '.id // empty')
test -n "$CALCULATION_ID" || { echo "Calculate response did not include an id."; exit 1; }
```

Generate a narrative:

```bash
curl --fail-with-body "$BASE_URL/chainweb/calculations/$CALCULATION_ID/narratives" \
  -X POST \
  -H "x-partner-key: $PARTNER_KEY" \
  -H "Content-Type: application/json" \
  --data '{"audience":"grant_writer"}'
```

### 5. Send a heartbeat

Required scope: any active partner key. Success: `200 OK` when the heartbeat
is persisted. Errors: `401 Unauthorized` for missing/invalid authentication;
`422 Unprocessable Content` when the heartbeat is accepted after correcting
invalid optional fields.

```bash
curl --fail-with-body "$BASE_URL/heartbeat" \
  -X POST \
  -H "x-partner-key: $PARTNER_KEY" \
  -H "Content-Type: application/json" \
  --data '{"status":"ok","version":"2026.09"}'
```

---

## Deprecated Patterns (do not use in new code)

| Deprecated | Replacement |
|---|---|
| `CROSS_PLATFORM_API_KEY` env var comparison | `requirePartnerAuth` + scope |
| `GET /api/external/students/*` | `GET /api/partner/v1/students/*` with scope `student:read` |
| Any route that reads `process.env.X` as the sole auth check | `requirePartnerAuth` |

The `/api/external/` routes still exist but send `Deprecation` headers. They will be removed in a future session.

---

## Pre-flight Gate (required before mark_task_complete)

```bash
npx tsx scripts/preflight.ts
```

Must exit 0. Checks:
- TypeScript: zero errors
- try/catch coverage: 0 uncovered routes in routes.ts, benefits-routes.ts, mou-routes.ts
- No `/api/external/` new additions
- No raw `process.env.*` used as sole auth check in new route files

---

*Last updated: 2026-07-15. If you find a pattern in the codebase that contradicts this doc, update this doc and file a session note — do not silently continue the old pattern.*
