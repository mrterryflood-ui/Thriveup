import { test } from "node:test";
import assert from "node:assert/strict";
import frames from "./route-frame.generated.json";
import { frameRoute } from "./frame-route";
test("all dynamic registry pages resolve their frame without making parameter patterns navigable", () => {
  assert.ok(frames.length > 0);
  for (const row of frames) {
    const example = row.path.replace(/:[^/]+/g, "sample");
    assert.equal(frameRoute(example)?.path, row.path);
    assert.equal(frameRoute(example)?.access, row.access);
    if (row.path.endsWith("?")) assert.equal(frameRoute(row.path.replace(/\/:[^/]+\?$/, ""))?.path, row.path);
  }
  assert.equal(frameRoute("/unregistered-frame-example"), undefined);
  assert.equal(frameRoute("/start/learn")?.outcome, "learn");
});