/**
 * Env-name aliases for the AI provider layer.
 *
 * On 2026-09-27 the ThriveUp Vercel project's AI credentials were re-added
 * under plain vendor names (OPENROUTER_API_KEY, OPENAI_API_KEY,
 * CLAUDE_API_KEY, PERPLEXITY_API_KEY, GEMINI_API_KEY), while the provider
 * code reads the legacy AI_INTEGRATIONS_* names (and the corresponding
 * AI_INTEGRATIONS_*_BASE_URL vars were removed from the project entirely).
 *
 * This module bridges the two so both naming conventions work. It must be
 * imported FIRST in server/index.ts — before any module that reads
 * process.env — so aliases are in place at import time.
 */

function applyEnvAliases(): void {
  const alias = (target: string, source: string, fallback?: string) => {
    if (!process.env[target]) {
      const value = process.env[source] ?? fallback;
      if (value) {
        process.env[target] = value;
      }
    }
  };

  // OpenRouter lanes (openrouter-claude / perplexity / deepseek-r1)
  alias("AI_INTEGRATIONS_OPENROUTER_API_KEY", "OPENROUTER_API_KEY");
  alias("AI_INTEGRATIONS_OPENROUTER_BASE_URL", "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1");

  // OpenAI lane (replit-ai-integrations)
  alias("AI_INTEGRATIONS_OPENAI_API_KEY", "OPENAI_API_KEY");
  alias("AI_INTEGRATIONS_OPENAI_BASE_URL", "OPENAI_BASE_URL", "https://api.openai.com/v1");

  // Anthropic lane (claude) — ANTHROPIC_API_KEY is read directly by the
  // provider code and already set; alias the legacy integration name too.
  alias("AI_INTEGRATIONS_ANTHROPIC_API_KEY", "CLAUDE_API_KEY");
  alias("AI_INTEGRATIONS_ANTHROPIC_BASE_URL", "CLAUDE_BASE_URL", "https://api.anthropic.com");
}

applyEnvAliases();
