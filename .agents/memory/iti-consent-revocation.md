---
name: ITI consent revocation policy
description: Owner-selected balance between ongoing consent and the 24-hour private record-access boundary.
---

**Decision:** Consent remains active after the invitee's 24-hour profile/history access expires. Preserve a separate, narrowly scoped way for the invitee to turn all consents off; it must never reopen profile fields or recognition history.

**Why:** The user selected ongoing consent with durable self-service revocation, while explicitly preserving the existing privacy boundary and avoiding schema changes.

**How to apply:** Do not silently expire consent at 24 hours or extend read/edit access to make revocation work. Keep recovery limited to withdrawal, disclose dependence on browser site storage, and fail closed when recovery capability cannot be saved. Derive the recovery capability from the invitation's own high-entropy access capability rather than the global session secret, so routine session-secret rotation does not disable revocation.
