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
| **Public (no auth)** | _(none)_ | Read-only, non-sensitive, non-AI, non-mutating endpoints. Health checks, public catalogs. Rate-limit if they call AI or external APIs. | _(none)_ |

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
| `student:read` | Student progress overview and thrive scores (education platforms) |
| `inbound:write` | POST data into ThriveUp (referrals, events, metrics, alerts) |

Scopes are assigned at key creation time in the admin panel (Ops Center → Partner API tab). A key can have multiple scopes.

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
