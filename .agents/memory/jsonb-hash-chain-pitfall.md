---
name: JSONB hash-chain pitfall
description: Why hash-chained audit tables must never hash a jsonb column value directly.
---

Any tamper-evident hash chain (e.g. `linkHash = sha256(prevHash + ...fields)`) that includes a
Postgres `jsonb` column in its input must not compute the hash from `JSON.stringify(value)` at
insert time and then recompute it from the value read back from the DB later. Postgres's `jsonb`
type canonicalizes on write — it reorders object keys alphabetically (and can normalize numeric
formatting) — so a round-tripped value will not `JSON.stringify` identically to the pre-insert
object, even though the content is logically unchanged. The chain verification then falsely
reports every row as tampered.

**Why:** discovered while building a tamper-evident claim-grounding audit chain — every row failed
integrity verification immediately after insertion, with no actual tampering involved.

**How to apply:** for any column that feeds a hash computation, either (a) store it as `text`
containing the exact JSON string used for hashing (never re-serialize on read), or (b) apply a
canonical/stable serialization (e.g. sorted keys) consistently on both the write path and the
verify/read path. Never mix "hash the live JS object" with "hash the DB-round-tripped value."
