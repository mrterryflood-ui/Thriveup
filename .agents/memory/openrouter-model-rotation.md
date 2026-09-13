---
name: OpenRouter proxy model rotation
description: The Replit AI Integrations OpenRouter proxy silently retires model IDs; how to detect and fix.
---

# OpenRouter proxy model rotation

**Rule:** When any AI provider starts failing with "provider error" / "No endpoints found", assume the model ID was retired upstream. Probe the live catalog with 1-token `/chat/completions` calls before touching fallback logic — the proxy does NOT expose `/models` (returns 405).

**Why:** On 2026-07-13 every Claude 3.x ID (`anthropic/claude-3-5-haiku`, `anthropic/claude-3.5-haiku`, 3.5/3.7 sonnet) and `google/gemini-2.0-flash-001` returned "No endpoints found" on the OpenRouter proxy, silently breaking 3 of 4 collaborative engines and the openrouter-claude fallback. The direct Anthropic integration also rejects `claude-3-5-haiku-20241022` (400 UNSUPPORTED_MODEL).

**How to apply:**
- Known-good model IDs are time-sensitive. On 2026-09-13, direct bounded probes confirmed `anthropic/claude-haiku-4-5`, `google/gemini-2.5-flash`, `deepseek/deepseek-chat`, and `perplexity/sonar-pro`; the Replit OpenAI proxy returned content for `gpt-4o-mini`. Do not assume GPT-5 IDs or `perplexity/sonar-online` are valid in this proxy.
- Model IDs are hardcoded in several files, not one config: sweep with `rg` for the old ID across `server/` (ai-provider, collaborative-ai, navigator-routes, ai-smoke-test all carried copies).
- Probe pattern: POST `${AI_INTEGRATIONS_OPENROUTER_BASE_URL}/chat/completions` with `max_tokens: 1` per candidate ID; 200 = live, "No endpoints found" = retired.
