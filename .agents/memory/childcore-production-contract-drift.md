---
name: ChildCORE production contract drift
description: Partner API source, public docs, and published routes can be out of sync; validate all three before claiming a capability is live.
---

The Partner API has three independently verifiable states: route implementation in the workspace, public `/api/partner/v1/docs` discovery output, and published HTTP behavior. A capability is not live for ChildCORE until all three agree.

**Why:** A published ThriveUp build previously exposed the older docs and returned 404 for heartbeat while the workspace already contained the newer inbound and scope-protected routes.

**How to apply:** After Partner API changes, typecheck locally, inspect local docs, probe protected routes without credentials for 401 (not 404), then compare the same docs and probes against the published URL. Treat a mismatch as deployment drift, not as an authorization success.