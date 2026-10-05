import { EventEmitter } from "node:events";
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Response } from "express";
import { startNavigatorProgress, withinNavigatorBudget, NavigatorStageTimeout, guardNavigatorContextDb } from "./navigator-progress";

class FakeResponse extends EventEmitter {
  chunks: string[] = [];
  headers: Record<string, string> = {};
  writableEnded = false;
  destroyed = false;
  flushed = false;
  setHeader(name: string, value: string) { this.headers[name] = value; }
  flushHeaders() { this.flushed = true; }
  write(chunk: string) { this.chunks.push(chunk); }
  end() { this.writableEnded = true; this.emit("finish"); }
  events() { return this.chunks.map(chunk => JSON.parse(chunk.slice(6).trim())); }
  response() { return this as unknown as Response; }
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test("opens SSE and acknowledges immediately, before any enrichment", () => {
  const res = new FakeResponse();
  const progress = startNavigatorProgress(res.response(), new AbortController());
  assert.equal(res.flushed, true);
  assert.equal(res.headers["X-Accel-Buffering"], "no");
  assert.equal(res.events()[0].progress.phase, "received");
  progress.setPhase("research");
  assert.equal(res.events().at(-1).progress.phase, "research");
  assert.equal(res.events().some(event => event.content), false);
  res.end();
  assert.equal(res.listenerCount("close"), 0);
});

test("periodic progress reports the actual phase, then bounded deadline aborts", async () => {
  const res = new FakeResponse();
  const controller = new AbortController();
  startNavigatorProgress(res.response(), controller, { intervalMs: 5, deadlineMs: 25 });
  await sleep(50);
  assert.ok(res.events().filter(event => event.progress).length >= 2);
  assert.equal(controller.signal.aborted, true);
  assert.equal(res.writableEnded, true);
  assert.equal(res.events().at(-1).timedOut, true);
  const count = res.chunks.length;
  await sleep(20);
  assert.equal(res.chunks.length, count);
});

test("close and finish dispose timers; abandoned work emits no further events", async () => {
  for (const event of ["close", "finish"]) {
    const res = new FakeResponse();
    startNavigatorProgress(res.response(), new AbortController(), { intervalMs: 5, deadlineMs: 15 });
    res.emit(event);
    const count = res.chunks.length;
    await sleep(30);
    assert.equal(res.chunks.length, count);
    assert.equal(res.listenerCount("close"), 0);
    assert.equal(res.listenerCount("finish"), 0);
  }
});

test("caller cancellation clears progress without pretending success", async () => {
  const res = new FakeResponse();
  const controller = new AbortController();
  startNavigatorProgress(res.response(), controller, { intervalMs: 5, deadlineMs: 15 });
  controller.abort();
  await sleep(30);
  assert.equal(res.events().length, 1);
});

test("optional context budget preserves success, bounds hangs, and respects cancellation", async () => {
  const controller = new AbortController();
  assert.equal(await withinNavigatorBudget(Promise.resolve("actual context"), 10, controller.signal), "actual context");
  await assert.rejects(withinNavigatorBudget(new Promise(() => {}), 5, controller.signal), NavigatorStageTimeout);
  const pending = withinNavigatorBudget(new Promise(() => {}), 100, controller.signal);
  controller.abort();
  await assert.rejects(pending, /cancelled/);
  await assert.rejects(withinNavigatorBudget(Promise.resolve("stale"), 10, controller.signal), /cancelled/);
});

test("stage expiry aborts cooperative work and prevents subsequent optional DB work", async () => {
  let operations = 0;
  let aborted = false;
  await assert.rejects(withinNavigatorBudget(async signal => {
    const guarded = guardNavigatorContextDb({ select() { operations++; } }, signal);
    guarded.select();
    await new Promise<void>(resolve => signal.addEventListener("abort", () => { aborted = true; resolve(); }, { once: true }));
    guarded.select();
    return "late context";
  }, 5, new AbortController().signal), NavigatorStageTimeout);
  assert.equal(aborted, true);
  assert.equal(operations, 1);
});

test("completed generation disposes its deadline before bounded persistence", async () => {
  const response = new FakeResponse();
  const progress = startNavigatorProgress(response.response(), new AbortController(), { deadlineMs: 10 });
  progress.dispose();
  response.write('data: {"content":"grounded answer"}\n\n');
  await sleep(20);
  assert.equal(response.events().some(event => event.error), false);
});