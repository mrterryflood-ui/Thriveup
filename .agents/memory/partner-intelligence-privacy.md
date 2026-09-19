---
name: Partner intelligence privacy boundary
description: Rules for composing internal community intelligence for an authenticated external partner.
---

External partner intelligence requests have no organization identity by default, so their context must contain only aggregate/public and explicitly partner-supplied evidence. Private assessments, action plans, baselines, and organization records must be excluded unless a separately authorized tenant-bound path exists.

**Why:** An authenticated integration key proves the caller is the partner, not which ThriveUp organization’s private records it may read.

**How to apply:** Give partner-facing context builders an explicit private-data opt-in that defaults off for inbound partner routes; keep source classes and availability truthful in the response. If a response can include internal catalog metadata, pass an explicit ecosystem-caller policy and suppress those rows for ordinary partner keys.

Partner integration credentials require both secret presence and active database registration; a newly provisioned secret should be reconciled at startup, and production must be republished before that registration exists there.

**Why:** A secret alone authenticated nothing: the dev route rejected the key until its hashed record and scope set were provisioned, while production remained on the prior deployment.

**How to apply:** Treat `health:read` and `inbound:write` as explicit scope grants; keep person-level outbox delivery fail-closed until the destination health check, receipt contract, and webhook verification are proven.