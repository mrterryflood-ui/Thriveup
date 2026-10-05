import assert from "node:assert/strict";
import { test } from "node:test";
import { ITI_ACCESS_TTL_MS, isItiAccessWithinWindow } from "./iti-token-policy";

test("ITI access is valid strictly before the 24-hour boundary", () => {
  const now = Date.parse("2026-10-05T12:00:00.000Z");
  assert.equal(isItiAccessWithinWindow(now - ITI_ACCESS_TTL_MS + 1, now), true);
  assert.equal(isItiAccessWithinWindow(now - ITI_ACCESS_TTL_MS, now), false);
});

test("ITI access rejects invalid and future creation timestamps", () => {
  const now = Date.parse("2026-10-05T12:00:00.000Z");
  assert.equal(isItiAccessWithinWindow("not-a-date", now), false);
  assert.equal(isItiAccessWithinWindow(now + 1, now), false);
});
