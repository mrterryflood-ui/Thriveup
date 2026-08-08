/**
 * Tests for the adaptive growth path pure logic (shared/trade-sims-growth.ts).
 * Run: npx tsx --test server/__tests__/trade-sims-growth.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeGrowthStates,
  mergeWeakConcepts,
  topWeakConcepts,
  type GrowthProgressLike,
} from "../../shared/trade-sims-growth";

const lessons = [
  { id: 11, dayNumber: 1 },
  { id: 12, dayNumber: 2 },
  { id: 13, dayNumber: 3 },
];

function prog(lessonId: number, over: Partial<GrowthProgressLike> = {}): GrowthProgressLike {
  return {
    lessonId,
    status: "in_progress",
    soloPassed: false,
    stretchPassed: false,
    masteryOverride: false,
    weakConcepts: null,
    ...over,
  };
}

test("first lesson is always unlocked, later days locked with no progress", () => {
  const states = computeGrowthStates(lessons, new Map());
  assert.equal(states[0].unlocked, true);
  assert.equal(states[0].reason, "first");
  assert.equal(states[1].unlocked, false);
  assert.equal(states[1].reason, "locked");
  assert.equal(states[2].unlocked, false);
});

test("passing Day 1's solo unlocks Day 2 but not Day 3", () => {
  const m = new Map([[11, prog(11, { soloPassed: true, status: "completed" })]]);
  const states = computeGrowthStates(lessons, m);
  assert.equal(states[1].unlocked, true);
  assert.equal(states[1].reason, "prev-mastered");
  assert.equal(states[2].unlocked, false);
});

test("completed WITHOUT solo pass does not unlock the next day", () => {
  const m = new Map([[11, prog(11, { status: "completed", soloPassed: false })]]);
  const states = computeGrowthStates(lessons, m);
  assert.equal(states[1].unlocked, false);
});

test("explicit override unlocks a lesson whose prerequisite is unmastered", () => {
  const m = new Map([[12, prog(12, { masteryOverride: true })]]);
  const states = computeGrowthStates(lessons, m);
  assert.equal(states[1].unlocked, true);
  assert.equal(states[1].reason, "override");
  // Override on Day 2 does NOT cascade to Day 3 — Day 2 still isn't mastered.
  assert.equal(states[2].unlocked, false);
});

test("override + later pass: chain resumes normally", () => {
  const m = new Map([
    [12, prog(12, { masteryOverride: true, soloPassed: true })],
  ]);
  const states = computeGrowthStates(lessons, m);
  assert.equal(states[2].unlocked, true);
  assert.equal(states[2].reason, "prev-mastered");
});

test("lessons out of order are sorted by dayNumber", () => {
  const shuffled = [lessons[2], lessons[0], lessons[1]];
  const states = computeGrowthStates(shuffled, new Map());
  assert.deepEqual(states.map((s) => s.dayNumber), [1, 2, 3]);
});

test("mergeWeakConcepts: fail increments tags, pass decays all", () => {
  let w = mergeWeakConcepts(null, ["voltage-sag"], false);
  assert.deepEqual(w, { "voltage-sag": 1 });
  w = mergeWeakConcepts(w, ["voltage-sag", "ohms-law"], false);
  assert.deepEqual(w, { "voltage-sag": 2, "ohms-law": 1 });
  // clean pass decays everything by 1, dropping zeros
  w = mergeWeakConcepts(w, [], true);
  assert.deepEqual(w, { "voltage-sag": 1 });
  w = mergeWeakConcepts(w, [], true);
  assert.deepEqual(w, {});
});

test("mergeWeakConcepts ignores empty tags and does not mutate input", () => {
  const orig = { a: 1 };
  const w = mergeWeakConcepts(orig, ["", "b"], false);
  assert.deepEqual(orig, { a: 1 });
  assert.deepEqual(w, { a: 1, b: 1 });
});

test("topWeakConcepts sorts by count desc and caps at n", () => {
  const top = topWeakConcepts({ a: 1, b: 3, c: 2, d: 5 }, 3);
  assert.deepEqual(top.map((t) => t.concept), ["d", "b", "c"]);
  assert.deepEqual(topWeakConcepts(null), []);
});

test("weakConcepts pass through onto growth states", () => {
  const m = new Map([[11, prog(11, { soloPassed: true, weakConcepts: { "voltage-sag": 2 } })]]);
  const states = computeGrowthStates(lessons, m);
  assert.deepEqual(states[0].weakConcepts, { "voltage-sag": 2 });
  assert.equal(states[0].mastered, true);
});

test("stretchPassed surfaces on the state", () => {
  const m = new Map([[11, prog(11, { soloPassed: true, stretchPassed: true })]]);
  const states = computeGrowthStates(lessons, m);
  assert.equal(states[0].stretchPassed, true);
});
