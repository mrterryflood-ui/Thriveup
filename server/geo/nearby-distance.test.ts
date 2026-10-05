import { test } from "node:test";
import assert from "node:assert/strict";
import { milesBetween, nearestFilingMiles } from "./nearby-distance";
test("distance is symmetric, coincident points are zero, and missing origins stay unavailable", () => {
  const a = { lat: 30.27, lon: -97.74 }, b = { lat: 30.44, lon: -97.62 };
  assert.equal(milesBetween(a, a), 0);
  assert.ok(milesBetween(a, b) > 10 && milesBetween(a, b) < 15);
  assert.equal(milesBetween(a, b), milesBetween(b, a));
  assert.equal(nearestFilingMiles([], b), null);
  assert.equal(nearestFilingMiles([a, b], b), 0);
  assert.ok(Number.isFinite(milesBetween({ lat: 0, lon: 0 }, { lat: 0, lon: 180 })));
});