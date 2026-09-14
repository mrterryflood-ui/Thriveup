import assert from "node:assert/strict";
import test from "node:test";
import {
  MANOR_FUNDING_PACKAGES,
  MANOR_FUNDING_PACKAGE_PROFILE_KEY,
  MANOR_FUNDING_PACKAGE_TAXONOMY_VERSION,
  buildManorFundingPackageBlock,
  isManorOrganization,
} from "@shared/grantpathpro-taxonomy";

test("Manor taxonomy has four stable packages", () => {
  assert.equal(MANOR_FUNDING_PACKAGE_PROFILE_KEY, "manor-tx-city");
  assert.equal(MANOR_FUNDING_PACKAGE_TAXONOMY_VERSION, "manor-four-package-v1");
  assert.deepEqual(
    MANOR_FUNDING_PACKAGES.map((fundingPackage) => fundingPackage.key),
    [
      "water_infrastructure",
      "lake_flood_drought_resilience",
      "public_recreation",
      "housing_enabling_infrastructure",
    ],
  );
  for (const fundingPackage of MANOR_FUNDING_PACKAGES) {
    assert.ok(fundingPackage.label);
    assert.ok(fundingPackage.purpose);
    assert.ok(fundingPackage.candidateComponents.length > 0);
    assert.ok(fundingPackage.keepSeparateOrFlag.length > 0);
    assert.ok(fundingPackage.verificationChecklist.length > 0);
  }
  assert.deepEqual(buildManorFundingPackageBlock().packages.map((item) => item.key), [
    "water_infrastructure",
    "lake_flood_drought_resilience",
    "public_recreation",
    "housing_enabling_infrastructure",
  ]);
});

test("Manor taxonomy is limited to the verified municipal identity", () => {
  assert.equal(isManorOrganization({
    externalKey: MANOR_FUNDING_PACKAGE_PROFILE_KEY,
    name: "City of Manor",
    state: "TX",
    counties: ["Travis"],
  }), true);
  assert.equal(isManorOrganization({
    externalKey: MANOR_FUNDING_PACKAGE_PROFILE_KEY,
    name: "City of Manor",
    state: "TX",
    counties: ["Williamson"],
  }), false);
  assert.equal(isManorOrganization({
    externalKey: "other-org",
    name: "Manor Community Development",
    state: "TX",
    counties: ["Travis"],
  }), false);
});