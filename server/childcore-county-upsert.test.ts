import assert from "node:assert/strict";
import test from "node:test";
import { buildChildCORECountyUpsert } from "./childcore-county-upsert";

test("stale-snapshot guard is on DO UPDATE, not the conflict target", () => {
  const statement = buildChildCORECountyUpsert([{
    fipsCode: "00000",
    receivedAt: new Date("2026-09-20T00:00:00.000Z"),
    rawMetrics: {
      source: "ChildCORE",
      dataType: "metric",
      as_of_date: "2026-09-20",
      state: "TX",
      total_providers: null,
      total_providers_suppressed: true,
    },
  }]).toSQL().sql;

  assert.match(statement, /on conflict \("fips_code"\) do update set /);
  assert.match(
    statement,
    / where "childcore_county_metrics"\."received_at" <= excluded\.received_at returning /,
  );
  assert.doesNotMatch(statement, /on conflict \("fips_code"\) where /);
});