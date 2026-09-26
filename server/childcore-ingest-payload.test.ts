import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeChildCORECountyPayload,
  projectChildCORECountyContext,
} from "./childcore-ingest-payload";

// Synthetic fixture only: no sender data and no production county writes.
const flat = {
  source: "ChildCORE",
  dataType: "metric",
  county_fips: "00000",
  county_name: "Example County",
  state: "TX",
  as_of_date: "2026-09-20",
  total_providers: 12,
  total_providers_suppressed: false,
  total_licensed_capacity: 120,
  total_licensed_capacity_suppressed: false,
  estimated_demand: 140,
  estimated_demand_suppressed: false,
  slot_gap: 20,
  slot_gap_suppressed: false,
  coverage_rate: 85.7,
  suppression_reason: null,
};

test("accepts the documented flat envelope and preserves aggregate provenance", () => {
  const result = normalizeChildCORECountyPayload(flat);
  assert.equal(result.kind, "flat");
  if (result.kind !== "flat") return;
  assert.deepEqual(result.records, [{
    fipsCode: "00000",
    countyName: "Example County",
    snapshotAt: "2026-09-20T00:00:00.000Z",
  }]);
  assert.equal(result.rawMetrics.as_of_date, "2026-09-20");
  assert.equal(result.rawMetrics.total_providers_suppressed, false);
  assert.equal(result.rawMetrics.total_licensed_capacity, 120);
  assert.equal(result.rawMetrics.suppression_reason, null);
  assert.deepEqual(projectChildCORECountyContext(result.rawMetrics), {
    asOfDate: "2026-09-20",
    lines: [
      "total providers 12",
      "total licensed capacity 120",
      "estimated demand 140",
    ],
  });
});

test("accepts suppressed counts as null and does not reconstruct them in Navigator context", () => {
  const result = normalizeChildCORECountyPayload({
    ...flat,
    total_licensed_capacity: null,
    total_licensed_capacity_suppressed: true,
    slot_gap: null,
    slot_gap_suppressed: true,
    coverage_rate: null,
    suppression_reason: "cell_below_floor_5",
  });
  assert.equal(result.kind, "flat");
  if (result.kind !== "flat") return;
  assert.equal(result.rawMetrics.total_licensed_capacity, null);
  assert.equal(result.rawMetrics.total_licensed_capacity_suppressed, true);
  assert.equal(result.rawMetrics.estimated_demand, 140);
  assert.deepEqual(projectChildCORECountyContext(result.rawMetrics), {
    asOfDate: "2026-09-20",
    lines: [
      "total providers 12",
      "capacity, demand, and gap withheld due to small-cell suppression",
    ],
  });
});

test("all suppressed cells remain suppressed, never zero or missing", () => {
  const result = normalizeChildCORECountyPayload({
    ...flat,
    total_providers: null,
    total_providers_suppressed: true,
    total_licensed_capacity: null,
    total_licensed_capacity_suppressed: true,
    estimated_demand: null,
    estimated_demand_suppressed: true,
    slot_gap: null,
    slot_gap_suppressed: true,
    coverage_rate: null,
    suppression_reason: "cell_below_floor_5",
  });
  assert.equal(result.kind, "flat");
  if (result.kind !== "flat") return;
  assert.deepEqual(projectChildCORECountyContext(result.rawMetrics)?.lines, [
    "total providers suppressed (cell below 5)",
    "capacity, demand, and gap withheld due to small-cell suppression",
  ]);
});

test("preserves the existing records[] batch envelope without rewriting records", () => {
  const records = [{ fipsCode: "00000", desertRate: 12 }];
  const batch = { snapshotAt: "2026-09-20T08:00:00Z", records };
  const result = normalizeChildCORECountyPayload(batch);
  assert.deepEqual(result, { kind: "batch", records, snapshotAt: batch.snapshotAt });
});

test("legacy batch envelope keeps tolerated source/dataType metadata", () => {
  const records = [{ fipsCode: "00000", desertRate: 12 }];
  const result = normalizeChildCORECountyPayload({
    source: "ChildCORE",
    dataType: "metric",
    snapshotAt: "2026-09-20T08:00:00Z",
    records,
  });
  assert.deepEqual(result, {
    kind: "batch",
    records,
    snapshotAt: "2026-09-20T08:00:00Z",
  });
});

test("batch envelope still rejects mixed flat fields", () => {
  const result = normalizeChildCORECountyPayload({
    snapshotAt: "2026-09-20T08:00:00Z",
    records: [{ fipsCode: "00000" }],
    county_fips: "00000",
  });
  assert.equal(result.kind, "invalid");
});

test("rejects malformed, small-cell, mixed, and unsupported flat payloads", () => {
  const invalid = [
    { ...flat, county_fips: 0 },
    { ...flat, county_fips: "0000" },
    { ...flat, as_of_date: "2026-02-30" },
    { ...flat, as_of_date: "2999-01-01" },
    { ...flat, source: "Other" },
    { ...flat, dataType: "event" },
    { ...flat, total_providers: 4 },
    { ...flat, total_providers: -5 },
    { ...flat, total_providers: 5.5 },
    { ...flat, total_providers: 5, total_providers_suppressed: true, suppression_reason: "cell_below_floor_5" },
    { ...flat, total_providers: null, total_providers_suppressed: true },
    { ...flat, total_providers: 5, total_providers_suppressed: "false" },
    { ...flat, slot_gap: -2 },
    { ...flat, coverage_rate: 101 },
    { ...flat, coverage_rate: Number.NaN },
    { ...flat, coverage_rate: 85, coverage_rate_suppressed: true },
    { ...flat, suppression_reason: "other" },
    { ...flat, records: [] },
    { ...flat, extra_person_name: "not accepted" },
  ];
  for (const payload of invalid) {
    const result = normalizeChildCORECountyPayload(payload);
    assert.equal(result.kind, "invalid", JSON.stringify(payload));
  }
});

test("a signed oversupply gap is retained but a small magnitude remains suppressed", () => {
  const result = normalizeChildCORECountyPayload({ ...flat, slot_gap: -20 });
  assert.equal(result.kind, "flat");
  if (result.kind !== "flat") return;
  assert.equal(result.rawMetrics.slot_gap, -20);
  assert.equal(projectChildCORECountyContext(result.rawMetrics)?.lines.at(-1), "estimated demand 140");
});

test("the read projection does not trust malformed stored evidence", () => {
  assert.equal(projectChildCORECountyContext({ source: "ChildCORE", dataType: "metric" }), null);
  assert.deepEqual(
    projectChildCORECountyContext({
      source: "ChildCORE", dataType: "metric", as_of_date: "2026-09-20",
      total_providers: 2, total_providers_suppressed: false,
      total_licensed_capacity: 100, total_licensed_capacity_suppressed: false,
      estimated_demand: 105, estimated_demand_suppressed: false,
      slot_gap: null, slot_gap_suppressed: true,
    })?.lines,
    ["capacity, demand, and gap withheld due to small-cell suppression"],
  );
});