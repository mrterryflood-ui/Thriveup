---
name: Equity-loss scheduler Int32 overflow
description: setInterval with 30-day ms value overflows Int32 and clamps to ~1ms; fixed; CT batch repair pattern documented.
---

# Equity-loss scheduler Int32 overflow

## The rule
Never pass a value > 2,147,483,647 (Int32 max) to `setInterval` or `setTimeout`. Node's timer subsystem clamps overflowing values to ~1ms, causing rapid-fire execution that looks like an infinite loop in logs.

**Why:** 30 * 24 * 60 * 60 * 1000 = 2,592,000,000 ms > INT32_MAX. The overflow caused hundreds of log messages per minute and unnecessary DB connections.

**How to apply:** Use a shorter polling interval (24h = 86,400,000 ms < INT32_MAX) and enforce the real staleness policy inside the callback. The `checkAndRun` function already has the 30-day freshness gate so calling it every 24h is safe.

## Fix location
`server/equity-loss-national-scheduler.ts` — `CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000` (comment explains why).

## CT batch repair pattern
When a batch snapshot predates a data-source fix (here: CT USALEEP crosswalk), run `scripts/repair-ct-equity-loss-batch.ts` to re-compute just the affected counties and upsert into the latest batch using ON CONFLICT DO UPDATE. This avoids a full 3,233-county re-run.

Key gotchas in that script:
- Table is `equity_loss_national_batch_runs`, not `equity_loss_batch_runs`
- `state_fips` is not stored; derive with `LEFT(county_fips, 2) AS state_fips`
