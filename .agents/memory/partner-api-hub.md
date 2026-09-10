---
name: Partner API Hub
description: Permanent external integration layer for third-party platforms connecting to ThriveUp data
---

## What it is
A standardized, authenticated API layer so external partners (Black Praxis Labs, Chainweb, etc.) plug into one permanent endpoint instead of requiring custom work each time.

## Key facts
- Keys: `tcaf_` prefix, SHA-256 hashed at rest, shown plaintext once on creation, never again
- Auth header: `x-partner-key` (or `Authorization: Bearer tcaf_...`)
- Scopes: `content:read` (programs + RAG export), `platforms:read` (platform catalog)
- All calls audit-logged to `partner_api_audit_log` table

## Endpoints
- `GET /api/partner/v1/health` — verify key, no scope required
- `GET /api/partner/v1/export` — full content export for RAG ingestion (content:read)
- `GET /api/partner/v1/platforms` — platform catalog + health (platforms:read)

## Admin (requires Replit session auth)
- `GET /api/admin/partner-keys` — list all keys
- `POST /api/admin/partner-keys` — create key, returns plaintext once
- `PATCH /api/admin/partner-keys/:id/revoke` — kill access instantly
- `PATCH /api/admin/partner-keys/:id/restore` — re-enable
- `GET /api/admin/partner-keys/audit` — last 200 calls

## UI location
Ops Center → Partner API tab (8th tab)

## Publication guard

The published Partner API must be checked without credentials before an external
partner is told the integration is live. The guard compares the public docs'
exact method/path/scope entries and probes protected routes without a body or
auth header, requiring the request to reach `401`/`403` rather than a stale
`404` or server error.

**Why:** The workspace can advance ahead of the published build; a credentialed
probe could hide missing public discovery or accidentally send partner data
during a publication check.

**How to apply:** Run `scripts/verify-published-partner-api-contract.ts` with
`PUBLISHED_BASE_URL` after every Partner API publication and treat any nonzero
exit as deployment drift.

## Files
- `server/partner-api-routes.ts` — all logic
- `shared/schema.ts` — `partnerApiKeys` + `partnerApiAuditLog` tables

**Why:** Dr. Flood asked "why reinvent the wheel every time?" (2026-06-25). One plug, one key per partner, revoke instantly.
