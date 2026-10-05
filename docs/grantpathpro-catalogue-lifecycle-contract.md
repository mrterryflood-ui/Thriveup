# GPP ↔ ThriveUp catalogue lifecycle (v1)

GPP's repository has nightly aligned retirement and snapshot reconciliation at
00:30 UTC. ThriveUp reconciles its own deadline-backed records at 00:45 UTC,
on startup catch-up and before/after its existing harvest. A local success
receipt does not prove GPP ran, nor does GPP's receipt prove ThriveUp applied it.

The separate **catalogue** callback is:
`POST <THRIVEUP_API_BASE_URL>/api/inbound/grantpathpro/opportunity-lifecycle`.
It requires `x-api-key` matching the **dedicated** `THRIVEUP_CALLBACK_API_KEY`;
the legacy shared ingest credential cannot authorize catalogue-wide effects.
Missing configuration returns 503 without changing records.

```json
{
  "contractVersion": "v1",
  "eventId": "ca3b8923-4500-4e9e-9160-846b6a61bfe9",
  "changes": [{
    "grantId": "the-canonical-ThriveUp-opportunity-id",
    "status": "expired",
    "sourceTimestamp": "2026-10-05T00:30:00Z",
    "sourceUrl": "https://issuer.example/official-opportunity"
  }]
}
```

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