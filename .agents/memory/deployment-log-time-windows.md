---
name: Deployment log time windows
description: Reliable timestamp sourcing when querying publishing logs from the code-execution sandbox.
---

In a 2026-09-26 production investigation, `Date.now()` inside CodeExecution returned `Date.now() is disabled in durableptc v1`, despite the general tool guidance saying it works. A deployment-log query failed before reaching the callback.

**Why:** A failed time calculation can be mistaken for absent deployment logs or consume time during an incident.

**How to apply:** When that runtime error appears, use an explicit timestamp observed from a live response or computed by the shell for the `afterTimestamp` parameter. Do not infer an empty log result from a failed call. Recheck this behavior if the runtime changes.