import assert from "node:assert/strict";
import test from "node:test";
import { getProviderOrder } from "../ai-provider";
import { isConfiguredProbe } from "../ai-smoke-test";

test("fallback order keeps direct Anthropic last", () => {
  const providers = getProviderOrder({
    AI_INTEGRATIONS_OPENROUTER_API_KEY: "configured",
    AI_INTEGRATIONS_OPENROUTER_BASE_URL: "https://openrouter.example",
    AI_INTEGRATIONS_OPENAI_API_KEY: "configured",
    AI_INTEGRATIONS_OPENAI_BASE_URL: "https://openai.example",
    GEMINI_API_KEY: "configured",
    ANTHROPIC_API_KEY: "configured",
  });

  assert.deepEqual(providers, [
    "openrouter-claude",
    "perplexity",
    "deepseek-r1",
    "replit-ai-integrations",
    "gemini",
    "claude",
  ]);
  assert.equal(providers.at(-1), "claude");
});

test("Anthropic remains available as a last resort when fallbacks are absent", () => {
  assert.deepEqual(
    getProviderOrder({ ANTHROPIC_API_KEY: "configured" }),
    ["claude"],
  );
});

test("smoke tests do not count absent providers as failed configured engines", () => {
  assert.equal(isConfiguredProbe({ error: "OpenRouter not configured" }), false);
  assert.equal(isConfiguredProbe({ error: "Claude provider not configured" }), false);
  assert.equal(isConfiguredProbe({ error: "provider quota exhausted" }), true);
  assert.equal(isConfiguredProbe({ error: undefined }), true);
});