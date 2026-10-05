---
name: Unconditional boot seeds multiply rows
description: Why a seed that inserts on every boot without a unique constraint silently bloats tables and crashes list pages.
---
Rule: every boot-time seed must be an upsert or a skip-if-exists keyed on a natural identifier, and any table it writes needs a unique constraint on that identifier.

**Why:** career_fields had no unique constraint and its seed inserted on every boot; after ~1,500 restarts /api/careers returned 53k rows / 32 MB and crashed the browser tab. The page looked "broken" for months while every verification gate passed, because no gate measured response size.

**How to apply:** when a list endpoint feels slow or a page crashes at load, check row counts vs expected cardinality first. Presentation gates should fail on JS errors and tab crashes, not just on layout. Surplus-row cleanup is a separate, owner-approved script (dry-run default), never part of the fix PR.
