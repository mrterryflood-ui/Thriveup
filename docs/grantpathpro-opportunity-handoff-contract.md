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

A handoff can only be created by the organization owner or DB-verified staff.
Organization members may review the private package and its history but cannot
authorize a consequential external delivery. The browser must send:

```json
{
  "contractVersion": "v1",
  "requestId": "UUID generated once per deliberate browser authorization attempt",
  "authorizationConfirmed": true,
  "selectedOpportunity": {
    "title": "string",
    "lane": "grants | procurement_contracting | sponsorship_in_kind | research_technology_transfer | capacity_building | partnership",
    "sourceType": "primary_source | organization_provided | unverified_exploration",
    "sourceLabel": "string",
    "sourceUrl": "https://optional.example/source",
    "sourceCheckedAt": "2026-08-23T12:00:00.000Z"
  }
}
```

Viewing a package, opening the GrantPathPro workspace, or selecting a lane is
not authorization. The authorization is recorded with the authorizing user,
timestamp, exact package, and delivery result. Reusing the same `requestId`
returns the original handoff without sending it a second time.

## Outbound package

ThriveUp creates an immutable package containing:

- `handoffId`, `contractVersion`, and authorization timestamp;
- organization profile context with source status;
- a selected, source-labeled opportunity or exploration target;
- the six opportunity lanes and their required verification step;
- known readiness signals and explicit unknowns;
- collaborator categories only—not asserted collaborators;
- the private-by-default, cross-organization-learning-disabled boundary.

Delivery is attempted against GrantPath Pro's `/thriveup/mirror` receiver when
`GPP_OPPORTUNITY_HANDOFF_URL` is explicitly configured, with
`Authorization: Bearer <GPP_OPPORTUNITY_HANDOFF_API_KEY>`. This is a dedicated
outbound-only credential; ThriveUp's inbound callback key is never replayed to
a partner. The generic GrantPathPro API URL is never inferred as a receiver.
The receiver must acknowledge successful acceptance with JSON containing
`{ "accepted": true }`; an HTTP success status alone is not delivery evidence.
Delivery states are:

- `previewed` — persisted before a delivery evaluation;
- `delivered` — the explicit receiver returned the required acceptance acknowledgement;
- `rejected` — the explicit receiver returned a non-success response or no valid acceptance acknowledgement;
- `unavailable` — no explicit receiver and dedicated outbound credential are configured.
- `delivery_unknown` — the receiver may have received the package, but no
  acknowledgement was returned; the same handoff must be reconciled before a
  replacement is authorized.

No state other than `delivered` represents a partner handoff.
The receiver must treat the package as internal pursuit intake only. It does
not authorize partner, funder, or collaborator outreach, commitments, or
referrals.

## Inbound feedback

GrantPathPro sends authenticated JSON to:

`POST /api/inbound/grantpathpro/opportunity-feedback`

Grant Path Pro should call the full ThriveUp callback URL:
`<THRIVEUP_API_BASE_URL>/api/inbound/grantpathpro/opportunity-feedback`.
Unless ThriveUp confirms a different authentication method, the callback uses
the provisioned `x-api-key` credential, must not receive a browser session
cookie, and returns a correction response for invalid payloads.

Authentication uses the `x-api-key` header provisioned out of band; the key
value is never part of this document or a client payload. The recommended
Secrets-tab name for a dedicated callback credential is
`THRIVEUP_CALLBACK_API_KEY`; when absent, the existing
`THRIVEUP_INGEST_KEY` remains the compatibility key. If ThriveUp confirms
Bearer or another scheme instead, update this middleware and contract before
accepting that traffic.

Required fields:

- `contractVersion: "v1"`
- `handoffId`
- `orgId`
- `eventId` — stable, receiver-generated identifier for this feedback event; retries of the same event must reuse it
- `status`
- `sourceTimestamp` (parseable ISO timestamp)
- `sourceLabel`

Allowed `status` values:

`selected`, `preparing`, `submitted`, `clarification`, `declined`,
`withdrawn`, `awarded`, `partially_awarded`, `cancelled`, `expired`, and
`not_pursued`.

The feedback callback may include `sourceUrl`; the selected opportunity's
`sourceCheckedAt` remains part of the original immutable handoff package, not
a feedback field.
Optional feedback fields are `externalPursuitId`, `decisionAt`, whole-number
`awardAmount`, `amountDisclosure`, `funderFeedback`, `lesson`, and
`sourceUrl`. Invalid required fields reject the payload with a correction note.
Invalid optional fields are removed, logged, and returned as corrections.

The `handoffId` must resolve to an existing, delivered handoff and its
organization must match `orgId`; otherwise no feedback is stored. If ThriveUp
recorded an `externalPursuitId`, the callback must supply the same identifier.
If no pursuit identifier was acknowledged, the callback must not supply one.
ThriveUp derives a stable event fingerprint from the validated feedback body:
an identical partner retry returns success with `duplicate: true` and does not
create another feedback record.

## Reconciliation

`POST /api/organizations/:orgId/opportunity-handoffs/:handoffId/reconcile` is
an authenticated owner/staff recovery action. It retries the original package
with the original `handoffId` as the idempotency key; it cannot create a
replacement pursuit. A timeout remains `delivery_unknown` until the receiver
acknowledges or rejects the same request. An unavailable package can use this
same recovery action after a dedicated outbound credential is configured.

## Privacy and learning

Handoffs and feedback are private to the owning organization by default.
Award amounts, funder feedback, and lessons are not public evidence and are not
general AI context. Cross-organization learning remains disabled until a
separate policy defines explicit organization consent, minimum aggregation
thresholds, provenance, and human review.