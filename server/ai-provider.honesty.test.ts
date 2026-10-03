import assert from "node:assert/strict";
import test, { mock, afterEach } from "node:test";
import OpenAI from "openai";
import { generateAIResponseWithHonesty, getProviderInfo, streamAIResponse } from "./ai-provider";
import { MAX_HONESTY_OUTPUT_CHARS, type GateVerdict } from "@shared/inference-honesty";

// Uses the existing configured identity, but replaces the SDK transport before
// any request. No network/model calls, environment edits, or synthetic live scores.
const preferredProvider = getProviderInfo().allProviders.find(p =>
  ["replit-ai-integrations", "openrouter-claude", "perplexity"].includes(p.name))?.name;
afterEach(() => mock.restoreAll());
function transport(text: string) {
  let calls = 0;
  const create = function () {
    calls++;
    return (async function* () {
      yield { choices: [{ delta: { content: text } }] };
    })();
  };
  mock.method(OpenAI.Chat.Completions.prototype, "create", create as unknown as typeof OpenAI.Chat.Completions.prototype.create);
  return () => calls;
}
const messages = [{ role: "user", content: "Offline transport regression fixture." }];

test("envelope keeps answer string and returns a non-enforcing failed receipt", async () => {
  assert.ok(preferredProvider, "A configured SDK identity is needed, but its transport is mocked");
  const calls = transport("Completion is 99%.");
  const response = await generateAIResponseWithHonesty(messages, [{ label: "Completion", value: "78%" }], { preferredProvider });
  assert.equal(response.answer, "Completion is 99%.");
  assert.equal(response.honesty.pass, false);
  assert.equal(response.provider?.name, preferredProvider);
  assert.equal(calls(), 1);
});
test("async receipt consumers cannot discard output or trigger provider fallback", async () => {
  const calls = transport("Completion is 78%.");
  let content = "", done = 0, errors = 0;
  await streamAIResponse({ messages, preferredProvider,
    onChunk: s => { content += s; }, onDone: () => { done++; }, onError: () => { errors++; },
    onProviderComplete: async () => { throw new Error("Metadata consumer fixture"); },
    onHonesty: async () => { throw new Error("Receipt consumer fixture"); },
  });
  assert.equal(content, "Completion is 78%.");
  assert.equal(done, 1); assert.equal(errors, 0); assert.equal(calls(), 1);
});
test("short-response chunk consumer failure never invokes another provider", async () => {
  const calls = transport("Short result.");
  let errors = 0;
  await streamAIResponse({ messages, preferredProvider,
    onChunk: () => { throw new Error("Chunk consumer fixture"); },
    onDone: () => assert.fail("Failed consumer should not be marked done"),
    onError: () => { errors++; },
  });
  assert.equal(errors, 1); assert.equal(calls(), 1);
});
test("async completion failure is observed after commitment, without fallback", async () => {
  const calls = transport("Short result.");
  let errors = 0;
  await streamAIResponse({ messages, preferredProvider, onChunk: () => {},
    onDone: async () => { throw new Error("Completion consumer fixture"); },
    onError: () => { errors++; },
  });
  assert.equal(errors, 1); assert.equal(calls(), 1);
});
test("advisory size cap does not truncate delivered text", async () => {
  const text = "x".repeat(MAX_HONESTY_OUTPUT_CHARS + 1000);
  const calls = transport(text);
  let content = "", receipt: GateVerdict | undefined;
  await streamAIResponse({ messages, preferredProvider,
    onChunk: s => { content += s; }, onDone: () => {}, onError: e => assert.fail(e.message),
    onHonesty: verdict => { receipt = verdict; },
  });
  assert.equal(content, text); assert.equal(receipt?.status, "unavailable"); assert.equal(calls(), 1);
});