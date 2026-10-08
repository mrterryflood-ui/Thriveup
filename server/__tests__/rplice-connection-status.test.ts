import test from "node:test";
import assert from "node:assert/strict";
import { createRpliceConnectionStatusHandler } from "../rplice-connection-status";

type MockResponse = {
  statusCode: number;
  payload: unknown;
  status: (code: number) => MockResponse;
  json: (body: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.payload = body;
      return this;
    },
  };
}

test("missing API key returns 503 with connected false", async () => {
  const handler = createRpliceConnectionStatusHandler({ apiKey: "", baseUrl: "https://rplice.test" });
  const res = createMockResponse();

  await handler({} as any, res as any, (() => {}) as any);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.payload, { connected: false, reason: "RPLICE_API_KEY is not configured" });
});

test("upstream success returns connected true with latency and no upstream body", async () => {
  let capturedAuthHeader = "";
  const handler = createRpliceConnectionStatusHandler({
    apiKey: "rplice_test_key",
    baseUrl: "https://rplice.test",
    now: (() => {
      const ticks = [1000, 1025];
      return () => ticks.shift() ?? 1025;
    })(),
    fetchImpl: async (_url, init) => {
      capturedAuthHeader = String((init?.headers as Record<string, string>)?.Authorization || "");
      return { ok: true, status: 200 };
    },
  });
  const res = createMockResponse();

  await handler({} as any, res as any, (() => {}) as any);

  assert.ok(capturedAuthHeader.startsWith("Bearer "));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { connected: true, upstreamStatus: 200, latencyMs: 25 });
  assert.equal((res.payload as any).body, undefined);
  assert.equal((res.payload as any).upstreamBody, undefined);
  assert.equal((res.payload as any).apiKey, undefined);
});

test("upstream non-2xx returns 502 and connected false", async () => {
  const handler = createRpliceConnectionStatusHandler({
    apiKey: "rplice_test_key",
    baseUrl: "https://rplice.test",
    now: (() => {
      const ticks = [5000, 5030];
      return () => ticks.shift() ?? 5030;
    })(),
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  const res = createMockResponse();

  await handler({} as any, res as any, (() => {}) as any);

  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.payload, { connected: false, upstreamStatus: 429, latencyMs: 30 });
});

test("timeout/network failure returns 502 and masks upstream details", async () => {
  const handler = createRpliceConnectionStatusHandler({
    apiKey: "rplice_test_key",
    baseUrl: "https://rplice.test",
    now: (() => {
      const ticks = [9000, 9035];
      return () => ticks.shift() ?? 9035;
    })(),
    fetchImpl: async () => {
      throw new Error("socket hang up: upstream body secrets...");
    },
  });
  const res = createMockResponse();

  await handler({} as any, res as any, (() => {}) as any);

  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.payload, { connected: false, reason: "RPLICE request failed", latencyMs: 35 });
  assert.equal((res.payload as any).error, undefined);
  assert.equal((res.payload as any).details, undefined);
  assert.equal((res.payload as any).body, undefined);
});
