# Focused opportunity/advisor verification

## Before
- ThriveUp catalogue discovery admitted past deadlines; no expiry sweep was found.
- GPP main has nightly aligned retirement and snapshot reconciliation at 00:30 UTC.
- Its committed October 1 receipt is dated execution evidence, not a receipt for the current night's run or for ThriveUp delivery.
- Existing GPP feedback is organization-specific pursuit feedback, not catalogue removal.
- Advisor baseline Quick had no answer in the initial 12-second observation.

## Changed
- Shared active gate for catalogue, management, agency opportunities, 90-day pursuit list and upcoming deadlines; explicit historical views retained.
- Status-only transactional expiry reconciliation with advisory lock and durable receipt, boot catch-up, nightly 00:45 UTC and before/after import.
- Date-only deadlines retain their UTC day; explicit timestamp precision expires at the instant. Undated and rolling opportunities receive no arbitrary age cutoff.
- Historical USAspending award intelligence is excluded from active discovery.
- Dedicated-key GPP catalogue callback with strict bounded schema, atomic admission/receipt, stable retry identity, monotonic source timestamps, source tombstone gate and evidence-backed reopening.
- No organization notes, submitted/awarded pursuit records or existing corpus records permanently deleted by this implementation.
- Manager counts/receipts, exact scope-correct bulk actions, explicit selected-org writes, search semantics/accessibility and responsive advisor progress/recovery.

## Why
Expiry must govern every active consumer immediately, not merely change a status in a nightly job. Cross-platform synchronization requires an admitted event and durable destination receipt; organization withdrawal must never become global source closure.

## Observed proof
- 14 focused unit tests passed, including progress/deadlines/disposal, optional-context cancellation, bounded persistence, strict bulk selection, search authorization/ranking and lifecycle schema.
- Development verifier passed 18 authenticated HTTP checks plus direct database assertions: identity/database target agreement, role denial, cross-tenant denial, atomic protected selection, note preservation, exact fixture-only purge, date-only versus precise timestamp expiry, rolling retention, award-history preservation, idempotent GPP retries/conflicting replay rejection, stale event rejection, suppression after source reimport and validated reopening.
- The verifier deletes only its namespaced fixtures and synthetic event receipts; its process exited zero after cleanup.
- Live Quick API: HTTP headers 77 ms, initial progress 91 ms, first/final answer 4,641 ms, one Claude engine, no advertised R1 job. This is one warm observation, not a universal latency guarantee.
- Registered catalogue callback returned HTTP 503 with the dedicated-credential-unavailable reason, rather than accepting a shared legacy key.
- Application restarted after coherent changes; workflow serves requests and partner route registration check passes. Logs contain expected test denials and existing external-source failures; no claim of globally clean external integrations.
- Six bounded independent domain rechecks completed. Four confirmed findings corrected: precise-deadline grace, expired metric overcount, selected-org write binding, and incomplete-stream draft/attachment recovery. Conditional timezone finding addressed with UTC receipt bounds and explicit timestamps.

## Limits
- GPP sender/canonical identity mapping and dedicated callback credential are not configured or verified. The local receiver is not a live bidirectional lifecycle synchronization claim.
- Different published hosts can serve different releases/databases; no canonical production target was silently selected.
- No production mutation, remote repository write, pull, push or publication.
- UI partial-stream recovery was source-reviewed; no new signed-in browser pass is claimed. The existing grant hub remains administrator-gated.
- Final compiler/diff and screenshot results are recorded in the session Omega when observed; pending results are not counted as passing here.