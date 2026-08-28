---
name: Owner-managed event-workspace access
description: Durable authorization boundary for organization owners managing private Community Events staff access.
---

**Rule:** The Community Events workspace always requires two persisted
authorities: an approved platform-staff role and an approved
organization-scoped membership role. Owners may manage only the narrow
same-organization `member` ↔ `staff` transition; they must not assign
organization administrator roles or promote collaborators.

**Why:** A broad platform role alone must never expose a private
organization’s event records. Owner administration must remain possible
without granting that owner event-data access, while every successful
change has an immutable, content-free witness.

**How to apply:** New management paths must derive the organization and
actor from authenticated context, lock and recheck the owner/target
authorization inside the mutation transaction, use conditional state
transitions, and write the dedicated opaque access audit only after success.
Access/audit responses must not introduce event, story, contact, role-detail,
or free-text content.