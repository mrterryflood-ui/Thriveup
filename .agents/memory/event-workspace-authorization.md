---
name: Event-workspace authorization boundary
description: Why Community Events & Impact authorization is deliberately separate from organization membership roles.
---

Community Events & Impact access has two independent prerequisites: a current database-backed platform staff role and a current organization-level entitlement. Organization owners have an implicit organization-level entitlement, while other members need an owner-created, organization-specific authorization. Ownership alone never creates platform-staff access.

**Why:** Organization membership describes ordinary collaboration. Treating it as a platform-wide staff privilege would let an owner expand unrelated internal access, and revoking event-workspace access could wrongly demote or remove an otherwise valid collaborator.

**How to apply:** Grant/revoke only the narrow event-workspace authorization for an active member. Keep actual workspace admission contingent on both the staff-role check and owner/record entitlement. Surface the distinction in owner-facing copy, and rely on the membership-bound database relationship so access disappears when membership ends.