import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJurisdictionCoverage,
  type StateBreakdownEntry,
} from "./equity-loss-national-routes";
import type { Jurisdiction } from "../shared/nationwide/jurisdictions";

function coverageEntry(overrides: Partial<StateBreakdownEntry> = {}): StateBreakdownEntry {
  return {
    jurisdictionType: "state",
    expectedCountyCount: 9,
    presentCountyCount: 0,
    usableCountyCount: 0,
    sourceUnavailableCountyCount: 0,
    otherSuppressedCountyCount: 0,
    missingCountyCount: 9,
    avgLoss: null,
    ...overrides,
  };
}

const testJurisdictions: Jurisdiction[] = [
  {
    code: "CT",
    name: "Connecticut",
    capital: "Hartford",
    fips: "09",
    type: "state",
  },
];

test("does not label a partial jurisdiction as entirely source-unavailable", () => {
  const coverage = buildJurisdictionCoverage(testJurisdictions, {
    CT: coverageEntry({
      presentCountyCount: 1,
      sourceUnavailableCountyCount: 1,
      missingCountyCount: 8,
    }),
  });

  assert.equal(coverage.presentJurisdictions, 1);
  assert.equal(coverage.sourceUnavailableJurisdictions, 0);
  assert.equal(coverage.otherSuppressedJurisdictions, 0);
  assert.equal(coverage.missingJurisdictions, 0);
});

test("labels a jurisdiction source-unavailable only when every expected record is present", () => {
  const coverage = buildJurisdictionCoverage(testJurisdictions, {
    CT: coverageEntry({
      presentCountyCount: 9,
      sourceUnavailableCountyCount: 9,
      missingCountyCount: 0,
    }),
  });

  assert.equal(coverage.sourceUnavailableJurisdictions, 1);
});