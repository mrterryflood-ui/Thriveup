import assert from "node:assert/strict";
import { test } from "node:test";
import { gppLifecycleSchema } from "./grant-lifecycle";
const event = {
  contractVersion: "v1", eventId: "ca3b8923-4500-4e9e-9160-846b6a61bfe9",
  changes: [{ grantId: "fixture", status: "expired", sourceTimestamp: "2026-10-05T00:30:00Z", sourceUrl: "https://issuer.example/fixture" }],
};
test("GPP catalogue lifecycle uses strict source-backed identities, not pursuit withdrawal", () => {
  assert.equal(gppLifecycleSchema.safeParse(event).success, true);
  for (const changes of [
    [], [event.changes[0], event.changes[0]],
    [{ ...event.changes[0], status: "withdrawn" }],
    [{ ...event.changes[0], sourceUrl: "http://issuer.example/fixture" }],
    [{ ...event.changes[0], sourceTimestamp: "yesterday" }],
    [{ ...event.changes[0], orgId: "other" }],
  ]) assert.equal(gppLifecycleSchema.safeParse({ ...event, changes }).success, false);
  assert.equal(gppLifecycleSchema.safeParse({ ...event, eventId: "unstable" }).success, false);
});