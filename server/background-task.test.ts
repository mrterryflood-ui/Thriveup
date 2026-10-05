import assert from "node:assert/strict";
import test from "node:test";
import { runBackgroundTaskSafely } from "./background-task";

test("contains a rejected task and logs the error with its task label", async () => {
  const expectedError = new Error("database temporarily unavailable");
  const logged: Array<[string, unknown]> = [];

  const result = await runBackgroundTaskSafely(
    "Ecosystem self-audit",
    async () => {
      throw expectedError;
    },
    (message, error) => {
      logged.push([message, error]);
    },
  );

  assert.equal(result, undefined);
  assert.deepEqual(logged, [
    ["[BackgroundTask] Ecosystem self-audit failed:", expectedError],
  ]);
});

test("returns a successful task result without logging", async () => {
  const logged: Array<[string, unknown]> = [];
  const expected = { checked: 3 };

  const result = await runBackgroundTaskSafely(
    "Ecosystem self-audit",
    async () => expected,
    (message, error) => {
      logged.push([message, error]);
    },
  );

  assert.equal(result, expected);
  assert.deepEqual(logged, []);
});
