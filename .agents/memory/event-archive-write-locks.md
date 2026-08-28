---
name: Event archive write locks
description: Archive permanence needs parent-row locking plus direct-database enforcement and wait-graph proof.
---

An archived event is a parent-owned immutable state. Any child write that can
outlive a preflight status check must synchronize on the event parent inside
its own transaction, and the database must reject bypass writes independently.

**Why:** A status check before a transaction can be true when read and false
when the child write commits. Tests that infer contention from a timer can
also pass even if the competing database operation has not reached the lock.

**How to apply:** For future parent/child archival invariants, pair
transaction-scoped parent locking with direct-database guards covering ordinary
row writes and bulk destructive paths. In concurrency tests, observe the
database wait graph or another explicit rendezvous before releasing the
archive transaction; then assert the rejected write leaves the persisted child
state unchanged.