import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type Provider = "gemini" | "claude" | "openai" | "replit-ai-integrations" | "deepseek-r1";

/**
 * ETHICAL_EI_PREAMBLE — persistent operating principle for every AI call on
 * this platform. Per user directive (2026-05-21): "Use ethical, emotionally
 * intelligent AI in everything we do."
 *
 * This preamble is prepended to every caller-supplied system prompt by every
 * code path in this file (streamGemini, streamClaude, streamOpenAI,
 * streamDeepSeekR1, generateAIJSON, callProviderDirect). It is also re-used
 * in server/collaborative-ai.ts so the 4-engine synthesizer carries the
 * same values. Do not remove without explicit user instruction.
 */
export const ETHICAL_EI_PREAMBLE = [
  "Operating principles for this platform — apply to every response:",
  "1. ETHICS — Tell the truth. Cite primary sources when claiming facts; say \"I don't know\" when you don't. Never fabricate funders, deadlines, identifiers, statistics, or partner names. Refuse to help with anything illegal, discriminatory, or harmful to participants, families, or community members.",
  "2. PRIVACY & DIGNITY — Protect PII. Never echo a person's full name, address, phone, email, SSN, immigration status, medical detail, criminal-justice history, or benefits-eligibility detail in user-visible output unless that user asked about themselves. When summarizing case data, prefer aggregate language and role labels (\"the participant\", \"the household\") over identifiers.",
  "3. EMOTIONAL INTELLIGENCE — Many people using this platform are in crisis, in recovery, in poverty, navigating the justice system, raising children alone, grieving, undocumented, disabled, or surviving violence. Lead with calm, plain language. Acknowledge what is hard before giving instructions. Never moralize, lecture, or talk down. Use the person's stated language and dialect (AAVE, Spanglish, etc.) when they do.",
  "4. SAFETY — If a message contains signals of suicide, self-harm, domestic violence, child abuse, or imminent danger, surface 988 (Suicide & Crisis Lifeline), 911 (immediate danger), 1-800-799-7233 (DV Hotline), or 1-800-422-4453 (Childhelp), and recommend a warm hand-off to a human navigator. Do not attempt to therapize.",
  "5. BIAS & EQUITY — Center the lived experience of the communities TCAF serves (Black, Latino, Indigenous, immigrant, justice-involved, foster youth, rural, low-income). Do not assume English fluency, two-parent households, bank accounts, smartphones, internet at home, citizenship, or stable housing. Check your defaults.",
  "6. HUMILITY — You are decision-support, not the decision-maker. Recommend; do not command. Always leave a path back to a human (caseworker, navigator, clinician, attorney).",
].join("\n");

/**
 * Merge the ethical/EI preamble into a caller-supplied system prompt.
 * Internal helper — every provider path in this file uses this so the
 * principle is impossible to bypass from a route file.
 */
export function withEthicalPreamble(systemPrompt?: string): string {
  if (!systemPrompt || systemPrompt.trim().length === 0) return ETHICAL_EI_PREAMBLE;
  // Idempotent: don't double-wrap if the preamble is already present.
  if (systemPrompt.includes("Operating principles for this platform")) return systemPrompt;
  return `${ETHICAL_EI_PREAMBLE}\n\n---\n\n${systemPrompt}`;
}

/**
 * Normalize a messages[] array so the ethical/EI preamble is always
 * carried as a system message at the head of the conversation. Used by
 * the streaming entry point so streamGemini/streamClaude/streamOpenAI/
 * streamDeepSeekR1 all see a system prompt that includes the preamble,
 * no matter what the caller passed in.
 */
function withEthicalMessages(
  messages: Array<{ role: string; content: string }>,
): Array<{ role: string; content: string }> {
  const sysIdx = messages.findIndex((m) => m.role === "system");
  if (sysIdx === -1) {
    return [{ role: "system", content: ETHICAL_EI_PREAMBLE }, ...messages];
  }
  const wrapped = { ...messages[sysIdx], content: withEthicalPreamble(messages[sysIdx].content) };
  return [...messages.slice(0, sysIdx), wrapped, ...messages.slice(sysIdx + 1)];
}

interface StreamAIResponseParams {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  onChunk: (content: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  // When true, attach Anthropic's server-side web_search tool so Claude can
  // look up live facts (officeholders, current grant deadlines, primary
  // sources). Silently ignored by providers that don't support it; logged
  // when Claude is skipped so callers know retrieval didn't actually happen.
  enableWebSearch?: boolean;
  webSearchMaxUses?: number;
}

let geminiQuotaExhaustedUntil = 0;

function getAvailableProviders(): Provider[] {
  const providers: Provider[] = [];
  if (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY && process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) providers.push("claude");
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) providers.push("replit-ai-integrations");
  if (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY && process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL) providers.push("deepseek-r1");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.GEMINI_API_KEY && Date.now() > geminiQuotaExhaustedUntil) providers.push("gemini");
  return providers;
}

function detectProvider(): Provider {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    throw new Error(
      "No AI provider configured. Set one of: GEMINI_API_KEY (free), OPENAI_API_KEY, or AI_INTEGRATIONS_OPENAI_API_KEY + AI_INTEGRATIONS_OPENAI_BASE_URL"
    );
  }
  return providers[0];
}

const PROVIDER_CONFIG: Record<Provider, { model: string; isFree: boolean }> = {
  gemini: { model: "gemini-2.0-flash", isFree: true },
  claude: { model: "claude-haiku-4-5", isFree: false },
  openai: { model: "gpt-4o-mini", isFree: false },
  "replit-ai-integrations": { model: "gpt-5-nano", isFree: false },
  "deepseek-r1": { model: "deepseek/deepseek-r1", isFree: false },
};

export function getActiveProvider(): string {
  return detectProvider();
}

export function getProviderInfo(): { name: string; model: string; isFree: boolean; allProviders: Array<{ name: string; model: string; isFree: boolean }> } {
  const provider = detectProvider();
  const config = PROVIDER_CONFIG[provider];
  const allProviders = getAvailableProviders().map(p => ({
    name: p,
    model: PROVIDER_CONFIG[p].model,
    isFree: PROVIDER_CONFIG[p].isFree,
  }));
  return { name: provider, model: config.model, isFree: config.isFree, allProviders };
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const e = error as any;
    if (e.status === 429 || e.statusCode === 429) return true;
    if (e.code === "rate_limit_exceeded") return true;
    const msg = e.message || "";
    if (typeof msg === "string" && (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("Too Many Requests"))) return true;
  }
  return false;
}

async function streamGemini(params: StreamAIResponseParams): Promise<void> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  let systemInstruction: string | undefined;
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of params.messages) {
    if (msg.role === "system") {
      systemInstruction = msg.content;
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
    generationConfig: {
      maxOutputTokens: params.maxTokens || 2000,
    },
  });

  const result = await model.generateContentStream({ contents });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      params.onChunk(text);
    }
  }

  params.onDone();
}

async function streamClaude(params: StreamAIResponseParams): Promise<void> {
  const client = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });

  let systemPrompt: string | undefined;
  const chatMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const msg of params.messages) {
    if (msg.role === "system") {
      systemPrompt = msg.content;
    } else {
      chatMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }
  }

  if (chatMessages.length === 0) {
    throw new Error("No user messages provided for Claude streaming");
  }
  if (chatMessages[0].role !== "user") {
    chatMessages.unshift({ role: "user", content: chatMessages.length > 0 ? "Continue the conversation." : "Hello" });
  }

  const webSearchTool = params.enableWebSearch
    ? [{ type: "web_search_20250305", name: "web_search", max_uses: params.webSearchMaxUses ?? 8 }]
    : undefined;

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: params.maxTokens || 8192,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: chatMessages,
    ...(webSearchTool ? { tools: webSearchTool as any } : {}),
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      const delta: any = event.delta;
      if (delta.type === "text_delta" && delta.text) {
        params.onChunk(delta.text);
      } else if (delta.type === "citations_delta" && delta.citation) {
        // Surface citations inline so the markdown the user sees actually
        // carries the URL Claude consulted. Only emit a markdown link when
        // we have a real URL — document_title and similar metadata would
        // produce broken/malformed links and weaken the "primary-source-
        // cited" guarantee §4 makes.
        const c: any = delta.citation;
        const url: string | undefined = c.url || c.source_url;
        if (typeof url === "string" && /^https?:\/\//i.test(url)) {
          params.onChunk(` [↗](${url})`);
        }
      }
    }
  }

  params.onDone();
}

async function streamOpenAI(params: StreamAIResponseParams, provider: "openai" | "replit-ai-integrations"): Promise<void> {
  let client: OpenAI;
  let model: string;

  if (provider === "openai") {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    model = "gpt-4o-mini";
  } else {
    client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    model = "gpt-5-nano";
  }

  const stream = await client.chat.completions.create({
    model,
    messages: params.messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
    stream: true,
    max_completion_tokens: params.maxTokens || 2000,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      params.onChunk(content);
    }
  }

  params.onDone();
}

async function streamDeepSeekR1(params: StreamAIResponseParams): Promise<void> {
  const client = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  });

  const stream = await client.chat.completions.create({
    model: "deepseek/deepseek-r1",
    messages: params.messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
    stream: true,
    max_tokens: params.maxTokens || 4000,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      params.onChunk(content);
    }
  }

  params.onDone();
}

async function tryProvider(provider: Provider, params: StreamAIResponseParams): Promise<void> {
  if (provider === "gemini") {
    await streamGemini(params);
  } else if (provider === "claude") {
    await streamClaude(params);
  } else if (provider === "deepseek-r1") {
    await streamDeepSeekR1(params);
  } else {
    await streamOpenAI(params, provider);
  }
}

export async function generateAIJSON<T = unknown>(prompt: string, systemPrompt?: string): Promise<T> {
  const providers = getAvailableProviders();
  if (providers.length === 0) throw new Error("No AI provider configured");

  // Persistent ethics/EI principle — wrap every JSON call's system prompt.
  systemPrompt = withEthicalPreamble(systemPrompt);

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      let text = "";
      if (provider === "gemini") {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: systemPrompt,
          generationConfig: { maxOutputTokens: 4000, responseMimeType: "application/json" },
        });
        const result = await model.generateContent(prompt);
        text = result.response.text();
      } else if (provider === "claude") {
        const client = new Anthropic({
          apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
        });
        const chatMsgs: Array<{ role: "user" | "assistant"; content: string }> = [];
        chatMsgs.push({ role: "user", content: `${prompt}\n\nRespond with valid JSON only, no markdown.` });
        const resp = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 8192,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: chatMsgs,
        });
        const block = resp.content[0];
        text = block.type === "text" ? block.text : "{}";
      } else if (provider === "deepseek-r1") {
        const client = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
        });
        const msgs: Array<{ role: "system" | "user"; content: string }> = [];
        if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
        msgs.push({ role: "user", content: `${prompt}\n\nRespond with valid JSON only, no markdown.` });
        const resp = await client.chat.completions.create({
          model: "deepseek/deepseek-r1",
          messages: msgs,
          max_tokens: 4000,
        });
        text = resp.choices[0]?.message?.content || "{}";
      } else {
        const isReplit = provider === "replit-ai-integrations";
        const client = new OpenAI({
          apiKey: isReplit ? process.env.AI_INTEGRATIONS_OPENAI_API_KEY : process.env.OPENAI_API_KEY,
          baseURL: isReplit ? process.env.AI_INTEGRATIONS_OPENAI_BASE_URL : undefined,
        });
        const msgs: Array<{ role: "system" | "user"; content: string }> = [];
        if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
        msgs.push({ role: "user", content: prompt });
        const resp = await client.chat.completions.create({
          model: isReplit ? "gpt-5-nano" : "gpt-4o-mini",
          messages: msgs,
          max_completion_tokens: 4000,
          response_format: { type: "json_object" },
        });
        text = resp.choices[0]?.message?.content || "{}";
      }
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      if (!cleaned || cleaned.length === 0) {
        if (i < providers.length - 1) {
          console.error(`[AI Provider] ${provider} returned empty JSON response, falling back to ${providers[i + 1]}`);
          continue;
        }
      }
      return JSON.parse(cleaned) as T;
    } catch (error) {
      if (isRateLimitError(error) && provider === "gemini") {
        geminiQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
        console.error(`[AI Provider] Gemini quota exhausted — skipping for 30 minutes`);
      }
      if (i < providers.length - 1) {
        const reason = isRateLimitError(error) ? "rate limit" : isTransientError(error) ? "transient error" : (error instanceof SyntaxError ? "JSON parse failure" : "error");
        console.error(`[AI Provider] ${provider} failed for JSON (${reason}), falling back to ${providers[i + 1]}`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("All AI providers failed");
}

export async function generateAIResponse(
  messages: Array<{ role: string; content: string }>,
  maxTokens?: number,
  options?: { enableWebSearch?: boolean; webSearchMaxUses?: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    let result = "";
    streamAIResponse({
      messages,
      maxTokens: maxTokens || 2000,
      enableWebSearch: options?.enableWebSearch,
      webSearchMaxUses: options?.webSearchMaxUses,
      onChunk: (content: string) => { result += content; },
      onDone: () => resolve(result),
      onError: (error: Error) => reject(error),
    });
  });
}

async function callProviderDirect(provider: Provider, prompt: string, systemPrompt?: string, maxTokens?: number): Promise<string> {
  // Persistent ethics/EI principle — applied to every direct (non-streaming,
  // non-JSON) provider call as well.
  systemPrompt = withEthicalPreamble(systemPrompt);
  if (provider === "gemini") {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: maxTokens || 2000 },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } else if (provider === "claude") {
    const client = new Anthropic({
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });
    const chatMsgs: Array<{ role: "user" | "assistant"; content: string }> = [];
    chatMsgs.push({ role: "user", content: prompt });
    const resp = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens || 8192,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: chatMsgs,
    });
    const block = resp.content[0];
    return block.type === "text" ? block.text : "";
  } else if (provider === "deepseek-r1") {
    const client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
    });
    const msgs: Array<{ role: "system" | "user"; content: string }> = [];
    if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
    msgs.push({ role: "user", content: prompt });
    const resp = await client.chat.completions.create({
      model: "deepseek/deepseek-r1",
      messages: msgs,
      max_tokens: maxTokens || 4000,
    });
    const raw = resp.choices[0]?.message?.content || "";
    return raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  } else {
    const isReplit = provider === "replit-ai-integrations";
    const client = new OpenAI({
      apiKey: isReplit ? process.env.AI_INTEGRATIONS_OPENAI_API_KEY : process.env.OPENAI_API_KEY,
      baseURL: isReplit ? process.env.AI_INTEGRATIONS_OPENAI_BASE_URL : undefined,
    });
    const msgs: Array<{ role: "system" | "user"; content: string }> = [];
    if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
    msgs.push({ role: "user", content: prompt });
    const resp = await client.chat.completions.create({
      model: isReplit ? "gpt-5-nano" : "gpt-4o-mini",
      messages: msgs,
      max_completion_tokens: maxTokens || 2000,
    });
    return resp.choices[0]?.message?.content || "";
  }
}

export async function generateMultiAIResponse(
  prompt: string,
  options?: { ensemble?: boolean; systemPrompt?: string; maxTokens?: number }
): Promise<{ primary: string; secondary?: string; consensus?: string }> {
  const providers = getAvailableProviders();
  if (providers.length === 0) throw new Error("No AI provider configured");

  const messages: Array<{ role: string; content: string }> = [];
  if (options?.systemPrompt) messages.push({ role: "system", content: options.systemPrompt });
  messages.push({ role: "user", content: prompt });

  const primary = await generateAIResponse(messages, options?.maxTokens);

  if (!options?.ensemble || providers.length < 2) {
    return { primary };
  }

  try {
    const secondaryText = await callProviderDirect(providers[1], prompt, options?.systemPrompt, options?.maxTokens);

    const consensusPrompt = `You received two independent responses to the same prompt. Summarize the consensus and note any differences.\n\nResponse A:\n${primary}\n\nResponse B:\n${secondaryText}`;
    const consensus = await generateAIResponse([
      { role: "system", content: "You are an expert synthesizer. Merge two AI responses into a consensus summary." },
      { role: "user", content: consensusPrompt },
    ], options?.maxTokens);

    return { primary, secondary: secondaryText, consensus };
  } catch {
    return { primary };
  }
}

export async function dualAIReview(
  content: string,
  reviewPrompt: string
): Promise<{ reviewA: string; reviewB?: string; differences?: string }> {
  const providers = getAvailableProviders();
  if (providers.length === 0) throw new Error("No AI provider configured");

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: reviewPrompt },
    { role: "user", content: content },
  ];

  const reviewA = await generateAIResponse(messages);

  if (providers.length < 2) {
    return { reviewA };
  }

  try {
    const reviewB = await callProviderDirect(providers[1], content, reviewPrompt);

    const diffPrompt = `Compare two independent reviews and highlight differences.\n\nReview A:\n${reviewA}\n\nReview B:\n${reviewB}`;
    const differences = await generateAIResponse([
      { role: "system", content: "You are an expert reviewer. Identify key differences between two reviews." },
      { role: "user", content: diffPrompt },
    ]);

    return { reviewA, reviewB, differences };
  } catch {
    return { reviewA };
  }
}

export async function streamAIResponse(params: StreamAIResponseParams): Promise<void> {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    params.onError(new Error("No AI provider configured"));
    return;
  }

  // Persistent ethics/EI principle — applied to every streaming call, no
  // matter which provider downstream serves it.
  params = { ...params, messages: withEthicalMessages(params.messages) };

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      const collectedChunks: string[] = [];

      const wrappedParams: StreamAIResponseParams = {
        ...params,
        onChunk: (content: string) => {
          collectedChunks.push(content);
          params.onChunk(content);
        },
        onDone: () => {},
        onError: () => {},
      };

      if (provider === "gemini") {
        if (params.enableWebSearch) console.warn("[AI Provider] enableWebSearch requested but Gemini path has no web_search wired — answer will rely on training-cutoff knowledge.");
        await streamGemini(wrappedParams);
      } else if (provider === "claude") {
        await streamClaude(wrappedParams);
      } else if (provider === "deepseek-r1") {
        if (params.enableWebSearch) console.warn("[AI Provider] enableWebSearch requested but DeepSeek path has no web_search wired — answer will rely on training-cutoff knowledge.");
        await streamDeepSeekR1(wrappedParams);
      } else {
        if (params.enableWebSearch) console.warn("[AI Provider] enableWebSearch requested but OpenAI-family path has no web_search wired — answer will rely on training-cutoff knowledge.");
        await streamOpenAI(wrappedParams, provider);
      }

      const totalContent = collectedChunks.join("");
      if (totalContent.trim().length === 0) {
        const isLast = i === providers.length - 1;
        if (!isLast) {
          const next = providers[i + 1];
          console.error(`[AI Provider] ${provider} returned empty response, falling back to ${next}`);
          continue;
        }
      }

      params.onDone();
      return;
    } catch (error) {
      const isLast = i === providers.length - 1;

      if (isRateLimitError(error) && provider === "gemini") {
        geminiQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
        console.error(`[AI Provider] Gemini quota exhausted — skipping for 30 minutes`);
      }

      if (!isLast) {
        const reason = isRateLimitError(error) ? "rate limit" : isTransientError(error) ? "transient error" : "provider error";
        const next = providers[i + 1];
        console.error(`[AI Provider] ${provider} failed (${reason}), falling back to ${next}`);
        continue;
      }

      params.onError(error instanceof Error ? error : new Error(String(error)));
      return;
    }
  }
}

function isTransientError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const e = error as any;
    if (e.status >= 500 || e.statusCode >= 500) return true;
    if (e.code === "ECONNRESET" || e.code === "ETIMEDOUT" || e.code === "ENOTFOUND") return true;
    const msg = (e.message || "").toLowerCase();
    if (msg.includes("timeout") || msg.includes("network") || msg.includes("503") || msg.includes("502")) return true;
  }
  return false;
}
