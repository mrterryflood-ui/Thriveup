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
