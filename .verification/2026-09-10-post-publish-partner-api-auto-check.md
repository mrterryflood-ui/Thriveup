# Post-Publish Partner API Contract Gate — 2026-09-10

## Claim

After every publish, the Partner API contract is checked automatically via a
production server startup probe and is also available as a manual operator gate.
Failure is visible in the Replit Deployments panel before any integration-live
confirmation can be sent.

## What was built

### `server/partner-api-contract-probe.ts` — automatic production startup probe

Registered in `server/index.ts` in the `NODE_ENV === "production"` block.
90 seconds after the production server binds to its port, the probe:

1. **Discovers the production URL from `REPLIT_DOMAINS`.**  In production
   containers Replit sets this to the `.replit.app` or custom-domain hostname.
   The probe filters out `.replit.dev` entries (the dev-workspace domain).
   Falls back to `PARTNER_API_CONTRACT_TARGET` env var for explicit overrides.
   If no non-dev URL is found, the probe skips silently (dev container).

2. **Runs the credential-free contract checks inline (no child process):**
   - GET `/api/partner/v1/docs` must return 200 with `chainweb:read` and
     `yhsi:read` scopes advertised and all expected routes listed with correct
     scope labels.
   - Every protected Chainweb, YHSI, student aggregate, and heartbeat route
     must return 401 or 403 without credentials, not a stale 404.
   - No partner credentials or payloads are sent.

3. **Logs results prominently to stdout** (visible in Deployments → Logs):
   - `[partner-api-contract] ✅ PASSED` — surface matches; integration-live
     confirmation cleared.
   - `[partner-api-contract] ❌ FAILED` — drift detected; explicit "do NOT
     confirm integration live" message with repair instructions.

4. **Never crashes the server.** The probe is fire-and-forget; all errors are
   caught and logged.

### `scripts/post-publish-partner-api-check.ts` — manual operator gate

A TypeScript script for the dev workspace that:
- Requires an explicit HTTPS `PUBLISHED_BASE_URL` (from the Deployments panel).
- Logs only the sanitized parsed origin — never the raw env var, which may
  contain credentials, tokens, or query strings.
- Rejects `.replit.dev` URLs (dev-workspace domain) with exit 2.
- Spawns `verify-published-partner-api-contract.ts` via `spawnSync` and
  preserves exit codes: 0 = pass, 1 = drift, 2 = config error.

### `partner-api-contract` named workflow in `.replit`

Registered as a plain workflow (no `isValidation` flag — it requires a
production URL unavailable in the automated validation environment).
Operators invoke it from the Workflows panel with `PUBLISHED_BASE_URL` set.

### `docs/api-contract.md` updated

The ChildCORE publication contract section now documents both paths:
- The automatic production startup probe (visible in Deployments logs).
- The manual operator-run wrapper script (for pre-confirmation or rollback).
- The operator rule: a deployment whose startup log shows `❌ FAILED` must not
  receive an integration-live confirmation.

## Safety properties

- **Automatic:** the probe runs on every production deployment without any
  operator action.
- **URL discovery:** `REPLIT_DOMAINS` in production containers contains the
  live hostname — the same mechanism used by `server/community-brief-probe.ts`.
- **No credential logging:** the manual wrapper logs only `parsed.origin`.
- **No crash risk:** the startup probe is completely non-blocking.
- **`.replit.dev` guard:** both the probe and the wrapper reject dev-workspace
  URLs explicitly.
- **Exit code separation (manual script):** 0 = pass, 1 = drift, 2 = config.
- **No partner credentials sent:** all checks are credential-free.
- **Application run button:** `runButton = "Start application"` (unchanged).
