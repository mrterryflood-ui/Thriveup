import assert from "node:assert/strict";
import test from "node:test";
import { runRpliceIntegrationProbeOnce } from "./rplice-integration-probe";

type FetchFn = typeof fetch;

const ORIGINAL_FETCH = globalThis.fetch;

function makeResponse(status: number): Response {
  return new Response("", { status });
}

test("RPLICE probe passes when public and authenticated checks return 200", async () => {
  process.env.RPLICE_BASE_URL = "https://example.org";
  process.env.RPLICE_API_KEY = "rplice_test_key";

  let callCount = 0;
  globalThis.fetch = (async () => {
    callCount++;
    return makeResponse(200);
  }) as FetchFn;

  const result = await runRpliceIntegrationProbeOnce();
  assert.equal(result.ok, true);
  assert.equal(result.failures.length, 0);
  assert.equal(callCount, 2);
});

test("RPLICE probe fails closed when API key is missing", async () => {
  process.env.RPLICE_BASE_URL = "https://example.org";
  process.env.RPLICE_API_KEY = "";

  globalThis.fetch = (async () => makeResponse(200)) as FetchFn;
  const result = await runRpliceIntegrationProbeOnce();
  assert.equal(result.ok, false);
  assert.equal(result.failures.includes("missing_rplice_api_key"), true);
});

test.after(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});
