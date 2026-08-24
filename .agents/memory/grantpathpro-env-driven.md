---
name: GrantPathPro integration is env-var-driven, not hardcoded
description: There is no hardcoded GrantPathPro domain anywhere in the codebase; the outbound push URL and auth come from environment variables.
---

Grepping the entire codebase for `grantpathpro.com` or any literal GrantPathPro domain returns nothing. The
integration (`server/grantpathpro-routes.ts`, `server/grant-conduit-routes.ts`, `server/conductor-routes.ts`) reads
`process.env.GPP_API_URL` (base URL) and `process.env.THRIVE_GPP_API_KEY` / `GRANTPATHPRO_WEBHOOK_API_KEY` (bearer
auth) at request time via a shared `pushToGpp()` helper. If `GPP_API_URL` is unset, push endpoints return a preview
payload instead of failing.

**Why:** Lets the actual GrantPathPro endpoint change (e.g. a new domain) without a code deploy — set the env var.

**How to apply:** To point the platform at a new GrantPathPro address, update the `GPP_API_URL` env var via
`setEnvVars` (not a code edit, not a secret — it's a plain URL). UI copy that says "GrantPathPro" is just a
product-name label; it never encodes the URL. Do not hand-edit source files hunting for a hardcoded domain.

## Mirror/embed contract (confirmed 2026-08-24)

The current partner contract uses two purpose-specific credentials: `THRIVEUP_INGEST_KEY` authenticates
GrantPathPro Mirror pushes into ThriveUp, while `THRIVEUP_PARTNER_KEY` authenticates ThriveUp's calls to the
partner's `GET /thriveup/embed?orgId=<id>&mode=iframe` endpoint. The embed target is stored in the non-secret
`GPP_EMBED_URL` environment variable rather than inferred from the older grant API base.

**Why:** The partner's Convex embed host is separate from the legacy GPP grant API host; deriving one from the
other silently sends authenticated requests to the wrong system.

**How to apply:** Keep Mirror snapshots append-only and tenant-scoped. Expose only the latest snapshot to an
authorized organization member/staff user, show its received time and freshness honestly, and never serialize
either credential into client code or URLs.

---

## Current status (confirmed 2026-08-15)

`GPP_API_URL` = `https://pursuitsfundingprofessionals.com`. Probe findings:
- `/api/health` → 200 JSON (public, server is live)
- `/api/inbound/entity`, `/api/inbound/proposal`, `/api/inbound/pursuit`, `/api/inbound/collaborative`
  → all return **401 with Clerk auth headers** (`x-clerk-auth-status: signed-out`,
  `x-clerk-auth-message: Invalid JWT form…`). The new GPP server uses Clerk JWT for all `/api/*`
  routes. Our `THRIVE_GPP_API_KEY` is a plain API key string (not a Clerk JWT with 3 dot-parts).

**pushToGpp() now detects the Clerk auth wall** — checks for `x-clerk-auth-status` response header on 401
and returns `{ sent: false, authMismatch: true }` with a clear console.warn pointing to the resolution.

**Verification script:** `scripts/verify-gpp-endpoint.ts` — probes all four endpoints and exits 1 with
actionable guidance when the Clerk wall is detected.

**Resolution needed from GPP (two options):**
- A) They expose `/api/inbound/*` outside their Clerk middleware (accept plain Bearer API key).
- B) They issue ThriveUp a Clerk machine token (a proper 3-part JWT) to use as `THRIVE_GPP_API_KEY`.
