---
name: ChildCORE production contract drift
description: Partner API source, public docs, and published routes can be out of sync; validate all three before claiming a capability is live.
---

The Partner API has three independently verifiable states: route implementation in the workspace, public `/api/partner/v1/docs` discovery output, and published HTTP behavior. A capability is not live for ChildCORE until all three agree.

**Why:** A published ThriveUp build previously exposed the older docs and returned 404 for heartbeat while the workspace already contained the newer inbound and scope-protected routes.

**How to apply:** After Partner API changes, typecheck locally, inspect local docs, probe protected routes without credentials for 401 (not 404), then compare the same docs and probes against the published URL. Keep compatibility aliases when an external flow contract uses a different resource path. Bind the check to the requested origin, reject redirects, bypass caches, bound body reads, and exact-match method/path/scope entries. Treat a published mismatch as deployment drift, not as an authorization success.

## Monitoring destinations

Keep the ChildCORE API base URL and external documentation URL in one shared integration configuration. Protected monitoring UI should consume the authenticated status metadata and render an explicit unavailable state when that metadata cannot be loaded; external URL liveness checks remain separate and warning-only for network failures.

**Why:** Upstream hosts and documentation addresses can change independently of the in-app route. A stale link should be caught for maintainers without preventing operators from opening the protected dashboard to diagnose the integration.

**How to apply:** Do not copy ChildCORE destinations into page components. Return them from the existing status contract, reuse the shared config for public documentation links and focused checks, and treat HTTP errors as findings while allowing DNS/timeouts to be reported without blocking the dashboard.
