---
name: GrantPathPro opportunity handoff
description: Safety boundary for the consequential v1 Opportunity Mirror delivery and feedback loop.
---

The v1 Community Opportunity Mirror handoff is distinct from legacy GrantPathPro
exports. It may only deliver to the explicitly configured, allow-listed HTTPS
`/thriveup/mirror` receiver using a dedicated outbound-only credential. A
handoff becomes delivered only when that receiver returns JSON with
`accepted: true`; otherwise it remains unavailable, rejected, or unknown. Do
not use a live partner POST as a configuration probe, and never reuse an
inbound callback credential for outbound delivery.

Partner feedback is private to the organization, must follow a verified
delivery, and must include a stable partner-generated event ID. Exact retries
are idempotent; reuse of an event ID with changed content is a conflict rather
than a new outcome.

**Why:** Authorization to share a package is not partner commitment, outreach
authorization, award confirmation, or an observed outcome. A truth-preserving
flow must fail closed rather than invent receipt or silently merge conflicting
partner records.

**How to apply:** Keep UI language to receipt of the handoff package only.
Before enabling live delivery, provision the dedicated credential and exact
receiver through secure configuration, configure the authenticated callback,
and verify their behavior in a non-production environment. Do not treat
development or a local receiver stub as partner readiness evidence.