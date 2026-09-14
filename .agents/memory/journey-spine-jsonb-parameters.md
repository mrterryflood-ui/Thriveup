---
name: Journey spine JSONB parameters
description: PostgreSQL cannot infer the type of an interpolated referral ID inside jsonb_build_array during a parameterized upsert.
---

Cast interpolated scalar IDs explicitly when constructing JSONB arrays inside raw SQL fragments, for example `CAST(parameter AS text)`.

**Why:** PostgreSQL raised `42P18 could not determine data type of parameter` for the referral append path even though the destination JSONB array held strings. The failure only appeared when the atomic conflict-update expression executed.

**How to apply:** When adding or changing journey-spine JSONB merge expressions, run the concurrent append contract gate; do not assume Drizzle's inferred parameter type is sufficient inside `jsonb_build_array`.