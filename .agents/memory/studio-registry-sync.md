---
name: Studio registry synchronization
description: Durable rules for exporting and bootstrapping the declarative Studio registry.
---

Studio registry exports must serialize the database snapshot and atomic file
replacement with a cross-instance advisory lock, and bootstrap must lock the
empty-registry check with the inserts. Seed files must reject duplicate
module/version entries and any mismatch between an entry envelope and its
manifest identity or visibility fields.

**Why:** Concurrent publishes can otherwise allow a delayed older snapshot to
overwrite a newer seed. A seed with mismatched identity fields can bootstrap a
runtime record under a different key than its declarative manifest.

**How to apply:** Preserve the advisory-lock boundaries when changing Studio
export or startup behavior. Keep seed content deterministic and validate it
before it can write database state. If a server-side export cannot write its
workspace file after a version is already published, report the version as live
with an explicit synchronization warning; do not describe it as a failed
publication or invite a duplicate publish retry.