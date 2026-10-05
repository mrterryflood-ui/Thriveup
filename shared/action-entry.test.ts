import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { HOME_ENTRY_TASK_IDS, WORKSPACE_TASKS, homeEntryTasks, entryTaskForPath } from "./workspace-catalog";

test("default entrance is exactly three public resident actions, not every audience's priorities", () => {
  const tasks = homeEntryTasks();
  assert.deepEqual(tasks.map(t => t.id), [...HOME_ENTRY_TASK_IDS]);
  assert.equal(tasks.length, 3);
  assert.equal(new Set(tasks.map(t => t.href)).size, 3);
  for (const t of tasks) {
    assert.equal(t.access, "public"); assert.equal(t.workspace, "residents");
    assert.ok(t.nextStep.length > 20);
  }
});
test("arrival guidance is exact-route only; query content and private routes cannot select a task", () => {
  assert.equal(entryTaskForPath("/get-help?housing=private#search")?.id, "find-support");
  assert.equal(entryTaskForPath("/academy")?.id, "learn-work");
  for (const path of ["/", "/get-help-other", "/academy/lessons", "/chw-dashboard", "/my-journey", "/no-match?path=/academy"]) {
    assert.equal(entryTaskForPath(path), undefined, path);
  }
});
test("all professional perspectives and tools remain; activation does not store or send intake", () => {
  for (const workspace of ["organizations", "funders", "community"]) {
    assert.ok(WORKSPACE_TASKS.some(t => t.workspace === workspace && t.access === "public"));
  }
  const activation = readFileSync("client/src/components/task-start-hint.tsx", "utf8");
  assert.doesNotMatch(activation, /\b(?:fetch|apiRequest|sessionStorage|localStorage)\s*(?:\.|\()/);
  assert.match(activation, /task-start-change/);
  assert.match(activation, /task-start-dismiss/);
});