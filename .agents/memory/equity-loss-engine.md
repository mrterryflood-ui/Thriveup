---
name: Equity-Loss Engine — nationwide extension
description: How the county-grain IHDI/Atkinson equity-loss engine scales from a single manual lookup to all ~3,200 US counties.
---

The live single-county lookup path (`server/equity-loss-routes.ts`) fans out to per-county Census ACS + CDC USALEEP calls — fine for one request, but ~3,143x too slow to run for every US county serially.

**Why:** Census ACS5 supports `for=county:*&in=state:*`, returning every county nationwide in ONE call per variable set (3 calls total for income/education/growth) instead of one call per county. Socrata (USALEEP) supports the same trick via `$limit`/`$offset` pagination (2 calls covered ~73k tract rows). This turned a nationwide batch from a theoretical multi-hour crawl into a ~70-second job.

**How to apply:** A nationwide/batch feature built on a per-record live-lookup API should always check whether the underlying data source supports a bulk "all records" query shape before assuming a serial per-record loop is required — most government open-data APIs (Census, Socrata-based CDC/HUD datasets) do.

**Design pattern used:** kept the existing append-only per-request audit table (`equity_loss_results`) untouched, and added a separate current-snapshot table (`equity_loss_national_snapshot`, unique on county+frame, upserted per batch run, tagged with a `batch_run_id`) plus a `equity_loss_national_batch_runs` status table — so the API only ever serves rows from the most recent *completed* run, never a stale/failed partial mix. This separation (audit log vs. current-snapshot) is the right shape whenever a live single-record endpoint and a batch/nationwide endpoint need to coexist without one degrading the other.

Known disclosed gap (not a bug): only 12 of 36 peer-classification benchmark cells are populated in `benchmark_metrics`; counties in the other 24 classes get a null `vs_national_peer_class` reference rather than a fabricated one. Tracked as a follow-up, not fixed inline.
