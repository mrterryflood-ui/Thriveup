import test from "node:test";
import assert from "node:assert/strict";
import { communityContextSchema } from "@shared/community-context";

test("accepts international geography without inventing numeric coverage", () => {
  const result = communityContextSchema.safeParse({
    countryCode: "KE",
    administrativeLevel: "district",
    district: "Kisumu East",
    localLabel: "Manyatta",
    serviceArea: "Community health outreach",
    locale: "sw-KE",
    source: "partner_reported",
    confidence: "reported",
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.countryCode, "KE");
    assert.equal(result.data.usFips, undefined);
  }
});

test("accepts U.S. FIPS only when explicitly supplied", () => {
  const result = communityContextSchema.safeParse({
    countryCode: "us",
    administrativeLevel: "region",
    region: "Texas",
    usFips: "48453",
    locale: "en-US",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.countryCode, "US");
});

test("rejects an empty or malformed geography envelope", () => {
  assert.equal(communityContextSchema.safeParse({ locale: "en" }).success, false);
  assert.equal(communityContextSchema.safeParse({ countryCode: "USA", localLabel: "Austin" }).success, false);
  assert.equal(communityContextSchema.safeParse({ countryCode: "KE", usFips: "48453" }).success, false);
  assert.equal(communityContextSchema.safeParse({ countryCode: "US", usFips: "48453" }).success, true);
  assert.equal(communityContextSchema.safeParse({ countryCode: "US", usFips: "not-fips" }).success, false);
});