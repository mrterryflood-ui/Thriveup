# GPP ↔ ThriveUp catalogue lifecycle (v1)

GPP's repository has nightly aligned retirement and snapshot reconciliation at
00:30 UTC. ThriveUp reconciles its own deadline-backed records at 00:45 UTC,
on startup catch-up and before/after its existing harvest. A local success
receipt does not prove GPP ran, nor does GPP's receipt prove ThriveUp applied it.

The separate **catalogue** callback is:
`POST <THRIVEUP_API_BASE_URL>/api/inbound/grantpathpro/opportunity-lifecycle`.
It requires `x-api-key` matching `THRIVEUP_CALLBACK_API_KEY` when configured,
otherwise the partner-issued `THRIVEUP_API_KEY` already provisioned to GPP.
The legacy shared ingest credentials cannot authorize catalogue-wide effects.
No configured credential returns 503 without changing records.

Identity: `grantId` (ThriveUp id) OR `externalId` — an exact issuer URL or
SAM.gov notice id that ThriveUp matches exactly against its stored source URL /
notice id. Never fuzzy title matching. At least one identity field is required.

```json
{
  "contractVersion": "v1",
  "eventId": "ca3b8923-4500-4e9e-9160-846b6a61bfe9",
  "changes": [{
    "externalId": "https://issuer.example/official-opportunity",
    "status": "expired",
    "sourceTimestamp": "2026-10-05T00:30:00Z",
    "sourceUrl": "https://issuer.example/official-opportunity"
  }]
}
```

Re-sending an already-known change (same identity, same timestamp, same status)
is an acknowledged no-op (`duplicate: true`), so batch composition may change
as the retired set grows. GPP's sender lives at
`convex/thriveup/lifecyclePush.ts` and runs nightly at 00:45 UTC after its
00:30 retirement sweeps.

Up to 100 unique identities per atomic event. Never map by fuzzy title or treat
absence from an incomplete snapshot as deletion. Unknown identities, stale
events, conflicting retries or invalid fields reject the whole batch.
Statuses: `expired`, `cancelled`, `reopened`. Reopening requires a future ISO
`deadline` and newer issuer evidence. This is source-reported GPP evidence,
not independent issuer verification by ThriveUp.

An accepted event returns `accepted:true`, `receiptId`, `changed`, `duplicate`.
Retries use the same UUID and normalized body. Retired source events prevent
re-imported records from reappearing until a newer valid reopening is received.
Entity submissions, decisions, awards and notes are never deleted or rewritten.
An organization's `withdrawn` pursuit is **not** a global issuer closure.

**Activation boundary:** the local receiver and contract do not install a GPP
sender. GPP must persist canonical cross-system identities, emit events from
completed retirement runs, and retain/retry until ThriveUp acknowledges them.
Choose the canonical ThriveUp deployment explicitly; different hosts can serve
different databases. No sender delivery or current nightly execution is claimed
without observing both platforms' execution and acknowledgement receipts.