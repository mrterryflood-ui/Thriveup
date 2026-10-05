import assert from "node:assert/strict";
import { test } from "node:test";
import { grantBulkSchema } from "./grant-management";

test("bulk selections are strict, nonempty, unique and bounded", () => {
  assert.equal(grantBulkSchema.safeParse({ ids: ["a", "b"], action: "dismiss" }).success, true);
  for (const ids of [[], ["a", "a"], [""], Array.from({ length: 101 }, (_, i) => String(i))]) {
    assert.equal(grantBulkSchema.safeParse({ ids, action: "purge" }).success, false);
  }
  assert.equal(grantBulkSchema.safeParse({ ids: ["a"], action: "delete-all" }).success, false);
  assert.equal(grantBulkSchema.safeParse({ ids: ["a"], action: "dismiss", orgId: "other-org" }).success, false);
});