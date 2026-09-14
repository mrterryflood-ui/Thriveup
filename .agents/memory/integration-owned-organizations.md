---
name: Integration-owned organizations
description: Boundary between personal organization ownership and partner/API organization identities
---

Partner/API organization identities do not require a personal ThriveUp owner ID. They should be keyed by a stable external identity and marked integration-owned, with access limited to verified staff and the appropriate partner/API scope. Normal user-created organizations retain the existing owner and membership model.

**Why:** A partner credential authenticates the integration, not a human tenant owner. Requiring a personal owner for an API-connected organization creates unnecessary provisioning friction and encourages unsafe fake service accounts.

**How to apply:** When adding a partner-backed organization, use a stable external key, keep the local legacy owner nullable for that integration-owned row, and make every read/write path explicitly reject ordinary member access while allowing staff/API-scoped access.