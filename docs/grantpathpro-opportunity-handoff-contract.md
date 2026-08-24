# ThriveUp ↔ GrantPathPro Community Opportunity Handoff Contract — v1

## Purpose and boundary

ThriveUp is the organization-facing discovery and strategy layer. It translates
an organization's documented mission, capabilities, geography, and priorities
into exploration lanes and a reviewable opportunity package. GrantPathPro is
the pursuit-execution layer.

This contract does **not** represent eligibility, funding availability, a
deadline, award likelihood, partner commitment, submission, or outreach. Those
facts require current primary-source confirmation and human action.

The existing GrantPathPro Embed and Mirror payloads are separate compatibility
interfaces and are not changed by this contract.

## Authorization

A handoff can only be created by a signed-in user who owns the organization, is
an active member, or has a DB-verified staff role. The browser must send:

```json
{
  "contractVersion": "v1",
  "authorizationConfirmed": true,
  "selectedOpportunity": {
    "title": "string",
    "lane": "grants | procurement_contracting | sponsorship_in_kind | research_technology_transfer | capacity_building | partnership",
    "sourceType": "primary_source | organization_provided | unverified_exploration",
    "sourceLabel": "string",
    "sourceUrl": "https://optional.example/source"
  }
}
```

Viewing a package, opening the GrantPathPro workspace, or selecting a lane is
not authorization. The authorization is recorded with the authorizing user,
timestamp, exact package, and delivery result.

## Outbound package

ThriveUp creates an immutable package containing:

- `handoffId`, `contractVersion`, and authorization timestamp;
- organization profile context with source status;
- a selected, source-labeled opportunity or exploration target;
- the six opportunity lanes and their required verification step;
- known readiness signals and explicit unknowns;
- collaborator categories only—not asserted collaborators;
- the private-by-default, cross-organization-learning-disabled boundary.

Delivery is attempted only if `GPP_OPPORTUNITY_HANDOFF_URL` and the existing
outbound service credential are configured. The generic GrantPathPro API URL
is never inferred as a receiver. Delivery states are:

- `previewed` — persisted before a delivery evaluation;
- `delivered` — the explicit receiver accepted the package;
- `rejected` — the explicit receiver returned a non-success response;
- `unavailable` — no receiver is configured or the receiver could not be
  reached.

No state other than `delivered` represents a partner handoff.

## Inbound feedback

GrantPathPro sends authenticated JSON to:

`POST /api/inbound/grantpathpro/opportunity-feedback`

Required fields:

- `contractVersion: "v1"`
- `handoffId`
- `orgId`
- `status`
- `sourceTimestamp` (parseable ISO timestamp)
- `sourceLabel`

Allowed `status` values:

`selected`, `preparing`, `submitted`, `clarification`, `declined`,
`withdrawn`, `awarded`, `partially_awarded`, `cancelled`, `expired`, and
`not_pursued`.

Optional fields are `externalPursuitId`, `decisionAt`, whole-number
`awardAmount`, `amountDisclosure`, `funderFeedback`, `lesson`, and
`sourceUrl`. Invalid required fields reject the payload with a correction note.
Invalid optional fields are removed, logged, and returned as corrections.

The `handoffId` must resolve to an existing authorized handoff and its
organization must match `orgId`; otherwise no feedback is stored.

## Privacy and learning

Handoffs and feedback are private to the owning organization by default.
Award amounts, funder feedback, and lessons are not public evidence and are not
general AI context. Cross-organization learning remains disabled until a
separate policy defines explicit organization consent, minimum aggregation
thresholds, provenance, and human review.