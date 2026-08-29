---
name: Publish custom CHECK serializer quirk
description: Replit Publish can emit invalid nested CHECK syntax for function-backed constraints introspected from the development database.
---

Function-backed PostgreSQL CHECK constraints can be valid in the development database while Replit Publish serializes them as `CHECK (CHECK (...`, causing production migration validation to fail.

**Why:** The publish flow introspects the development database and may wrap an already-wrapped constraint expression instead of using the hand-written migration text.

**How to apply:** Keep the authoritative function and constraint in a committed migration, remove only the serializer-triggering custom constraint from the development schema before publishing, verify that the migration round-trips to the exact PostgreSQL definition, and never repair this by overwriting production data.