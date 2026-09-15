---
name: Mirror verifier safety
description: Safety rules for destructive integration lifecycle verifiers and partner snapshot retries.
---

Destructive integration verifiers must independently validate both the HTTP target and the database target before creating any fixture users, sessions, or rows. The database check should use a development-only sentinel that production cannot satisfy, and cleanup failures must increment a visible failure count rather than being swallowed.

**Why:** A local-looking URL can still be connected to the wrong database, and partial cleanup can leave partner or identity fixtures behind. Partner callbacks can also be retried by networks, so accepting the same sanitized snapshot twice creates misleading history.

**How to apply:** Put the database sentinel immediately after connection and before all fixture writes. Use canonicalized sanitized payload text with a database uniqueness guard for retryable partner snapshots; never hash a JSONB round trip.