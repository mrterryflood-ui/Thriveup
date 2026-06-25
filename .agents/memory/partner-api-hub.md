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

## Files
- `server/partner-api-routes.ts` — all logic
- `shared/schema.ts` — `partnerApiKeys` + `partnerApiAuditLog` tables

**Why:** Dr. Flood asked "why reinvent the wheel every time?" (2026-06-25). One plug, one key per partner, revoke instantly.
