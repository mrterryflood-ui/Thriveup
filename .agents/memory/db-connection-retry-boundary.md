---
name: DB connection retry boundary
description: Why database timeouts must not be retried at the query level without proof a write never started.
---

Do not retry a database query just because its error message resembles a connection-establishment timeout. A retry of a write requires a verified pre-dispatch acquisition boundary or explicit idempotency; ambiguous outcomes fail closed.

**Why:** A driver can wrap errors and the message alone does not prove whether SQL was dispatched. A broad retry may repeat a committed write. A longer connection-establishment deadline is a safer cold-start mitigation, but it cannot repair an unreachable production primary.

**How to apply:** Separate connection acquisition from query execution when adding resilience, bound retries by the caller's deadline, and verify the deployed app's write connection directly. A read-only production replica answering SELECTs is not proof that the app can connect to its primary.