import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveRelevantChunks, buildLiveIntelligenceContext } from "./rag-engine";
import { withEthicalPreamble } from "./ai-provider";
import { triggerImmediateSmokeAlert } from "./ai-smoke-test";
import { buildRpliceIntelligencePackage, buildCommunityAIContext } from "./rplice-intelligence";
import { warmCommunityContext, runWithCommunityContext } from "./community-context";
import { buildRpliceInboundContext } from "./rplice-inbound-routes";

type EngineId = "gemini" | "claude" | "openai" | "deepseek-r1";

interface EngineResult {
  engine: EngineId;
  model: string;
  response: string;
  responseTimeMs: number;
  error?: string;
}

interface CollaborativeResult {
  synthesis: string;
  engines: EngineResult[];
  ragContext: { chunkCount: number; sources: string[]; liveData: boolean };
  frameworks: { rplice: boolean; mapGap: boolean };
  consensusMethod: string;
  totalTimeMs: number;
}

interface CollaborativeStreamParams {
  prompt: string;
  /** Interactive first pass: one fast engine, no synthesis or background R1. */
  fastFirst?: boolean;
  systemPrompt?: string;
  maxTokens?: number;
  /** When true, skip RAG retrieval entirely (e.g. user has already supplied
   *  document context — RAG would only waste context-window budget). */
  skipRAG?: boolean;
  /** When true, do NOT inject RPLICE/MAP-GAP framework lenses into the
   *  enriched prompt. Use for the Navigator, which already has its own
   *  comprehensive system prompt. Prevents consulting-speak / infomercial
   *  "MEASURE Phase / ANALYZE Phase" output. RAG context is still injected
   *  when skipRAG=false. */
  noFrameworkInjection?: boolean;
  onChunk: (content: string) => void;
  onMeta: (meta: { engines: string[]; ragSources: string[]; frameworks: string[] }) => void;
  onDone: (result: CollaborativeResult) => void;
  onError: (error: Error) => void;
  /** Fired immediately after the fast-engine synthesis finishes streaming —
   *  before DeepSeek R1 completes. Use this to unlock the input so users
   *  can re-prompt while R1 continues its deep reasoning in the background. */
  onSynthesisComplete?: () => void;
  /** Called when DeepSeek R1 finishes its deep-reasoning pass — AFTER the
   *  initial synthesis has already been streamed. The SSE connection stays
   *  open until this resolves (or R1 times out). */
  onDeepThinking?: (text: string, engineId: string, timeMs: number) => void;
  /** Called every ~10s during the Phase-2 R1 wait so the caller can send
   *  SSE keepalive comments and prevent proxy/mobile connection timeouts. */
  onKeepAlive?: () => void;
  /** Cancels provider work when the requesting client disconnects. */
  signal?: AbortSignal;
}

const RPLICE_LENS_STATIC = `Apply implementation science thinking grounded in ThriveUp's actual frameworks:
- RPLICE (Research-to-Practice Lifecycle Implementation & Community Evidence) is a sister platform at implementationineducatio.com — NOT a generic acronym. Reference it correctly when relevant.
- CFIR 2.0 (Consolidated Framework for Implementation Research): 5 domains, 39 constructs — operationalized in ThriveUp's Research Hub (/research-hub), not just named.
- RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance): evaluation lens built into outcome reporting.
- Three Realities (Dr. Flood): Research Reality (what data says) / Political Reality (what officials say) / Ground Truth (what community experiences).
- SALP Indicators: every outcome must be Specific, Actionable, Linked, and Predictive.
- MAP-GAP continuous improvement: Measure → Analyze → Plan → Gap → Action → Progress.
- RNR (Risk-Need-Responsivity): gold-standard criminal justice framework embedded in reentry case management.
- ACEs (Adverse Childhood Experiences): every youth/family outcome must cite Felitti 1998; education is the primary protective factor.
- Dr. Flood's key principles: "1 year of college = primary protective factor"; "crime doesn't disappear, it migrates"; family structure amplifies all other factors; tract-level data, not county averages.
- When analyzing a problem, ask: Who does this reach? What evidence supports the approach? What are the fidelity indicators? How is maintenance and scale planned?`;

/**
 * Pull the full RPLICE intelligence package. When geography is provided
 * (zip/stateFips/crisisDomains), returns a community-specific context block
 * from the cache (warm if needed). Falls back to generic RPLICE aiContextBlock
 * when no geography is known.
 */
async function buildLiveRpliceLens(geography?: {
  zip?: string;
  stateFips?: string;
  countyFips?: string;
  crisisDomains?: string[];
}): Promise<string> {
  try {
    const inboundContext = buildRpliceInboundContext();
    if (geography && (geography.zip || geography.stateFips)) {
      const ctx = await buildCommunityAIContext({
        zip: geography.zip,
        stateFips: geography.stateFips,
        countyFips: geography.countyFips,
        crisisDomains: geography.crisisDomains ?? [],
      });
      return ctx + (inboundContext ? "\n\n" + inboundContext : "");
    }
    const pkg = await buildRpliceIntelligencePackage({ crisisDomains: [] });
    return pkg.aiContextBlock + (inboundContext ? "\n\n" + inboundContext : "");
  } catch {
    return RPLICE_LENS_STATIC + "\n\n" + buildRpliceInboundContext();
  }
}

const MAPGAP_LENS = `Apply MAP-GAP continuous improvement framework:
- Measure: What is the current state? What data do we have?
- Analyze: What patterns, gaps, or underperformance exists?
- Plan: What's the priority fix? What action items?
- Gap: What's the specific distance between current and desired state?
- Action: What concrete steps close the gap?
- Progress: How do we track improvement and verify results?`;

let geminiCollabQuotaExhaustedUntil = 0;

// Global collection deadline for FAST engines (Claude, OpenAI, Gemini).
// Synthesis fires as soon as this deadline hits with whoever responded.
const ENGINES_GLOBAL_DEADLINE_MS = 25_000;

// DeepSeek R1 runs on its own independent track — deep reasoning takes 30-90s.
// It does NOT block the initial synthesis. When it finishes, its output flows
// as a "Deep Thinking Addendum" over the still-open SSE connection.
// 45s keeps us safely inside deployment proxy timeouts (typically 60s).
const DEEP_THINK_TIMEOUT_MS = 70_000;
const COLLAB_ENGINE_TIMEOUT_MS = 20_000;
const COLLAB_SYNTHESIS_TIMEOUT_MS = 20_000;

async function callEngineWithDeadline(
  engine: { id: EngineId; model: string },
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<EngineResult> {
  const controller = new AbortController();
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
  const onExternalAbort = () => controller.abort();
  if (externalSignal && !externalSignal.aborted) {
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }
  let onCancellationAbort: (() => void) | undefined;
  const timeoutPromise = new Promise<EngineResult>((_, reject) =>
    timeoutTimer = setTimeout(() => reject(new Error(`Engine timed out after ${timeoutMs}ms`)), timeoutMs),
  );
  const cancellationPromise = externalSignal
    ? new Promise<EngineResult>((_, reject) => {
        if (externalSignal.aborted) reject(new Error("AI request cancelled"));
        else {
          onCancellationAbort = () => reject(new Error("AI request cancelled"));
          externalSignal.addEventListener("abort", onCancellationAbort, { once: true });
        }
      })
    : null;
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await Promise.race([
      callEngine(engine, prompt, systemPrompt, maxTokens, controller.signal),
      timeoutPromise,
      ...(cancellationPromise ? [cancellationPromise] : []),
    ]);
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    clearTimeout(abortTimer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
    if (externalSignal && onCancellationAbort) {
      externalSignal.removeEventListener("abort", onCancellationAbort);
    }
    controller.abort();
  }
}

/**
 * Start all engines simultaneously. Proceed as soon as all respond OR the
 * global deadline fires — whichever comes first. Engines that haven't
 * responded by the deadline are dropped with a logged Timeout error rather
 * than blocking synthesis.
 */
async function collectEngineResults(
  engines: Array<{ id: EngineId; model: string }>,
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<EngineResult[]> {
  const collected: EngineResult[] = [];

  // Each engine pushes its result into collected as soon as it finishes.
  const perEnginePromises = engines.map(engine =>
    callEngineWithDeadline(engine, prompt, systemPrompt, maxTokens, COLLAB_ENGINE_TIMEOUT_MS, signal)
      .then(result => { collected.push(result); })
      .catch(err => {
        // callEngine already catches internally; this is a belt-and-suspenders guard.
        collected.push({
          engine: engine.id,
          model: engine.model,
          response: "",
          responseTimeMs: ENGINES_GLOBAL_DEADLINE_MS,
          error: err?.message || "Engine threw unexpectedly",
        });
      })
  );

  // Race: finish when all complete, or drop stragglers at the global deadline.
  let globalDeadlineTimer: ReturnType<typeof setTimeout> | undefined;
  let onExternalAbort: (() => void) | undefined;
  const externalAbortPromise = signal
    ? new Promise<void>(resolve => {
        if (signal.aborted) {
          resolve();
        } else {
          onExternalAbort = () => resolve();
          signal.addEventListener("abort", onExternalAbort, { once: true });
        }
      })
    : null;
  try {
    await Promise.race([
      Promise.all(perEnginePromises),
      new Promise<void>(resolve => {
        globalDeadlineTimer = setTimeout(resolve, ENGINES_GLOBAL_DEADLINE_MS);
      }),
      ...(externalAbortPromise ? [externalAbortPromise] : []),
    ]);
  } finally {
    if (globalDeadlineTimer) clearTimeout(globalDeadlineTimer);
    if (signal && onExternalAbort) {
      signal.removeEventListener("abort", onExternalAbort);
    }
  }

  // Any engine that hasn't pushed a result yet has been dropped by the deadline.
  const respondedIds = new Set(collected.map(r => r.engine));
  for (const engine of engines) {
    if (!respondedIds.has(engine.id)) {
      console.error(`[CollabAI] Engine ${engine.id} dropped — did not respond within ${ENGINES_GLOBAL_DEADLINE_MS}ms global deadline`);
      collected.push({
        engine: engine.id,
        model: engine.model,
        response: "",
        responseTimeMs: ENGINES_GLOBAL_DEADLINE_MS,
        error: `Dropped — did not respond within ${ENGINES_GLOBAL_DEADLINE_MS}ms`,
      });
    }
  }

  return collected;
}

function getAvailableEngines(): Array<{ id: EngineId; model: string }> {
  const engines: Array<{ id: EngineId; model: string }> = [];
  const hasOR = !!(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY && process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL);

  // Claude: OpenRouter (preferred — uses user's credits, no proxy latency)
  //         → direct ANTHROPIC_API_KEY → Replit integration proxy
  const hasClaudeDirect = !!(process.env.ANTHROPIC_API_KEY || (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY && process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL));
  if (hasOR) engines.push({ id: "claude", model: "anthropic/claude-haiku-4-5" });
  else if (hasClaudeDirect) engines.push({ id: "claude", model: "claude-haiku-4-5" });

  // OpenAI via Replit integration
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) engines.push({ id: "openai", model: "gpt-4o-mini" });

  // DeepSeek chat via OpenRouter — use the content model for the bounded
  // collaborative path; the reasoning model can exhaust a short response
  // budget before emitting user-visible content.
  if (hasOR) engines.push({ id: "deepseek-r1", model: "deepseek/deepseek-chat" });

  // Gemini: OpenRouter (bypasses free-tier quota issues) → direct API key
  const hasGeminiDirect = !!(process.env.GEMINI_API_KEY && Date.now() > geminiCollabQuotaExhaustedUntil);
  if (hasOR) engines.push({ id: "gemini", model: "google/gemini-3.8-flash" });
  else if (hasGeminiDirect) engines.push({ id: "gemini", model: "gemini-3.8-flash" });

  return engines;
}

async function callEngine(
  engine: { id: EngineId; model: string },
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<EngineResult> {
  // Persistent ethics/EI principle — every engine in the 4-engine
  // collaborative synthesis carries the same operating values as the
  // single-provider path in ai-provider.ts.
  systemPrompt = withEthicalPreamble(systemPrompt);
  const start = Date.now();
  try {
    let response = "";

    if (engine.id === "gemini") {
      if (engine.model.includes("/")) {
        // Route through OpenRouter (OpenAI-compatible) — uses user's OR credits,
        // bypasses Google free-tier quota entirely.
        const orClient = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
        });
        const resp = await orClient.chat.completions.create({
          model: engine.model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
          max_tokens: maxTokens,
        }, { signal } as any);
        response = resp.choices[0]?.message?.content || "";
      } else {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction: systemPrompt,
          generationConfig: { maxOutputTokens: maxTokens },
        });
         const result = await model.generateContent(prompt, { signal } as any);
        response = result.response.text();
      }

    } else if (engine.id === "claude") {
      if (engine.model.includes("/")) {
        // Route through OpenRouter — uses user's OR credits, no proxy latency.
        const orClient = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
        });
        const resp = await orClient.chat.completions.create({
          model: engine.model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
          max_tokens: maxTokens,
         }, { signal } as any);
        response = resp.choices[0]?.message?.content || "";
      } else {
        // Direct key or Replit integration proxy fallback
        const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
        const anthropicBase = process.env.ANTHROPIC_API_KEY ? undefined : process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
        const client = new Anthropic({ apiKey: anthropicKey, ...(anthropicBase ? { baseURL: anthropicBase } : {}) });
        const resp = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
       }, { signal } as any);
        const block = resp.content[0];
        response = block.type === "text" ? block.text : "";
      }

    } else if (engine.id === "openai") {
      const client = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
      const resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: maxTokens,
      }, { signal } as any);
      response = resp.choices[0]?.message?.content || "";

    } else if (engine.id === "deepseek-r1") {
      const client = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
      });
      const resp = await client.chat.completions.create({
        model: engine.model,  // uses whatever model getAvailableEngines() sets (currently deepseek/deepseek-chat)
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
      }, { signal } as any);
      const raw = resp.choices[0]?.message?.content || "";
      // Strip chain-of-thought <think> blocks — only present in R1 reasoning models, no-op on V3
      response = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    }

    return {
      engine: engine.id,
      model: engine.model,
      response,
      responseTimeMs: Date.now() - start,
    };
  } catch (err: any) {
    const msg = err.message || "Engine failed";
    if (engine.id === "gemini" && (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests"))) {
      geminiCollabQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
      console.error(`[CollabAI] Gemini quota exhausted — skipping for 30 minutes`);
    } else {
      console.error(`[CollabAI] Engine ${engine.id} (${engine.model}) failed: ${msg}`);
    }
    return {
      engine: engine.id,
      model: engine.model,
      response: "",
      responseTimeMs: Date.now() - start,
      error: msg,
    };
  }
}

async function synthesizeResponses(
  engineResults: EngineResult[],
  originalPrompt: string,
  ragSources: string[],
  synthesisEngine: { id: EngineId; model: string },
  skipRAG?: boolean,
  noFrameworkInjection?: boolean
): Promise<string> {
  const validResults = engineResults.filter(r => r.response && r.response.length > 20);

  if (validResults.length === 0) return "All engines failed to produce output.";
  if (validResults.length === 1) return validResults[0].response;

  const engineOutputs = validResults.map((r, i) =>
    `=== ENGINE ${i + 1}: ${r.engine.toUpperCase()} (${r.model}) — ${r.responseTimeMs}ms ===\n${r.response}`
  ).join("\n\n");

  // For document queries (skipRAG) or Navigator calls (noFrameworkInjection),
  // do NOT inject framework framing — it causes the synthesizer to reformat
  // responses into RPLICE/MAP-GAP sections nobody asked for.
  const frameworkLine = (skipRAG || noFrameworkInjection)
    ? ""
    : `\nFrameworks applied: RPLICE (implementation science), MAP-GAP (continuous improvement)`;

  const synthesisInstruction = skipRAG
    ? `Produce a single, synthesized response that directly answers the user's question about the document. Do NOT restructure, reformat, or restate the document — the user already has it. Pick the most insightful, specific, and helpful content from the engine outputs. Be conversational and substantive. Do NOT truncate.`
    : noFrameworkInjection
    ? `Produce a single, synthesized response that directly and empathetically addresses the person's situation. Choose the most specific, locally-grounded, and actionable content from the engine outputs. Write in a warm, conversational voice — NOT as a framework analysis, NOT using section headers like "MEASURE Phase" or "MAP-GAP Phase." Do NOT use consulting-speak. Do NOT reference engines by name. Do NOT truncate.`
    : `Produce a single, synthesized response that is BETTER than any individual engine output. Do not reference engines by name. Speak with one authoritative voice. Do NOT truncate.`;

  const synthesisPrompt = `You are the TCAF Collaborative Intelligence Synthesizer. Multiple AI engines have independently analyzed the same prompt. Your job is to produce a SINGLE superior output that:

1. Captures the BEST insights from each engine
2. Resolves any contradictions by choosing the most evidence-grounded position
3. Ensures nothing important is missed
4. Produces a cohesive, authoritative response — not a list of "Engine A said X, Engine B said Y"

RAG knowledge sources used: ${ragSources.join(", ") || "none"}${frameworkLine}

ORIGINAL PROMPT:
${originalPrompt}

ENGINE OUTPUTS:
${engineOutputs}

${synthesisInstruction}`;

  const systemPrompt = skipRAG
    ? "You are an expert analyst and synthesizer. Produce cohesive, authoritative outputs that directly address the user's question. Do NOT reproduce framework templates. Do NOT truncate."
    : noFrameworkInjection
    ? "You are an expert synthesizer. Your output must feel like a knowledgeable, caring guide speaking directly to a person — not a framework report. Be specific, warm, and actionable. Do NOT use consulting headers. Do NOT truncate."
    : "You are an expert synthesizer for the ThriveUp Academy ACOS. Produce cohesive, authoritative outputs. Do NOT truncate — always complete every section and produce the full depth of analysis needed.";

  try {
    const result = await callEngineWithDeadline(
      synthesisEngine,
      synthesisPrompt,
      systemPrompt,
      8000,
      COLLAB_SYNTHESIS_TIMEOUT_MS,
    );
    if (result.response && result.response.length > 20) return result.response;
  } catch {}

  return validResults.sort((a, b) => b.response.length - a.response.length)[0].response;
}

export async function collaborativeResponse(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    includeRAG?: boolean;
    includeRPLICE?: boolean;
    includeMAPGAP?: boolean;
    topic?: string;
  }
): Promise<CollaborativeResult> {
  const totalStart = Date.now();
  const engines = getAvailableEngines();
  if (engines.length === 0) throw new Error("No AI engines configured");

  const includeRAG = options?.includeRAG !== false;
  const includeRPLICE = options?.includeRPLICE !== false;
  const includeMAPGAP = options?.includeMAPGAP !== false;

  let ragContext = "";
  let ragSources: string[] = [];
  let ragChunkCount = 0;

  if (includeRAG) {
    try {
      const searchQuery = options?.topic || prompt.slice(0, 200);
      const [chunks, liveContext] = await Promise.all([
        retrieveRelevantChunks(searchQuery, 8),
        buildLiveIntelligenceContext(),
      ]);
      ragChunkCount = chunks.length;
      ragSources = chunks.map(c => c.title);
      ragContext = `\n=== RAG KNOWLEDGE BASE (${chunks.length} relevant chunks) ===\n` +
        chunks.map((c, i) => `[${i + 1}] ${c.title}: ${c.content}`).join("\n") +
        `\n\n${liveContext}`;
    } catch (err) {
      console.error("[CollabAI] RAG retrieval failed:", err);
    }
  }

  let frameworkContext = "";
  if (includeRPLICE) {
    const liveLens = await buildLiveRpliceLens();
    frameworkContext += `\n\n=== RPLICE IMPLEMENTATION SCIENCE LENS (LIVE) ===\n${liveLens}`;
  }
  if (includeMAPGAP) frameworkContext += `\n\n=== MAP-GAP CONTINUOUS IMPROVEMENT LENS ===\n${MAPGAP_LENS}`;

  const enrichedPrompt = `${prompt}${ragContext}${frameworkContext}

INSTRUCTIONS: Incorporate the RAG knowledge context and apply both RPLICE and MAP-GAP framework thinking in your response. Ground every statement in real data. Be specific and actionable.`;

  const COLLAB_ANTI_FAB = `NON-NEGOTIABLE TRUTH RULES (override everything else):
1. No fabricated numbers — every metric/percentage/count must come from RAG context, user document, or live data explicitly provided. If absent, say "I don't have that data."
2. No fabricated acronym expansions — RPLICE = "Research-to-Practice Lifecycle Implementation & Community Evidence" (sister platform at implementationineducatio.com), never invent other expansions.
3. No fabricated grades or scores — never generate platform letter grades, fidelity percentages, or ecosystem ratings from general AI knowledge.
4. No projected outcomes without a cited primary source — omit forecasts entirely if no source exists.
5. Uncertainty = disclosure, not fabrication — say "I don't have specific data on that" rather than generating plausible-sounding content.
`;
  const baseSystem = options?.systemPrompt || (COLLAB_ANTI_FAB + "You are part of the ThriveUp Academy Collaborative Intelligence System — a multi-engine AI that uses RAG knowledge retrieval, implementation science (CFIR 2.0, RE-AIM, MAP-GAP, RNR), and evidence-grounded synthesis to produce outputs for a 26-platform community-infrastructure ecosystem. Ground every statement in the RAG context provided. Never fabricate facts about ThriveUp's capabilities — use the knowledge base or disclose the gap.");

  console.log(`[CollabAI] Launching ${engines.length} engines in parallel (RAG: ${ragChunkCount} chunks, RPLICE: ${includeRPLICE}, MAP-GAP: ${includeMAPGAP})`);

  const engineResults = await collectEngineResults(engines, enrichedPrompt, baseSystem, options?.maxTokens || 3000);

  const successfulEngines = engineResults.filter(r => !r.error && r.response.length > 20);
  const failedEngines = engineResults.filter(r => r.error || r.response.length <= 20);

  if (failedEngines.length > 0) {
    console.error(`[CollabAI] ${failedEngines.length} engine(s) failed: ${failedEngines.map(e => `${e.engine}(${e.error || "empty"})`).join(", ")}`);
  }
  console.log(`[CollabAI] ${successfulEngines.length}/${engines.length} engines produced output`);

  let synthesis: string;
  let consensusMethod: string;

  if (successfulEngines.length >= 2) {
    const synthesisEngine = engines.find(e => e.id === "claude") || engines.find(e => e.id === "openai") || engines[0];
    synthesis = await synthesizeResponses(engineResults, prompt, ragSources, synthesisEngine);
    consensusMethod = `${successfulEngines.length}-engine parallel synthesis via ${synthesisEngine.id}`;
  } else if (successfulEngines.length === 1) {
    synthesis = successfulEngines[0].response;
    consensusMethod = `single-engine (${successfulEngines[0].engine}) — other engines unavailable`;
  } else {
    synthesis = "All collaborative intelligence engines failed to produce output.";
    consensusMethod = "none — all engines failed";
  }

  const totalTimeMs = Date.now() - totalStart;
  console.log(`[CollabAI] Synthesis complete in ${totalTimeMs}ms — ${consensusMethod}`);

  return {
    synthesis,
    engines: engineResults,
    ragContext: { chunkCount: ragChunkCount, sources: ragSources, liveData: includeRAG },
    frameworks: { rplice: includeRPLICE, mapGap: includeMAPGAP },
    consensusMethod,
    totalTimeMs,
  };
}

export async function collaborativeJSON<T = unknown>(
  prompt: string,
  options?: {
    systemPrompt?: string;
    topic?: string;
    includeRAG?: boolean;
    includeRPLICE?: boolean;
    includeMAPGAP?: boolean;
  }
): Promise<{ data: T; meta: { engines: string[]; ragSources: string[]; consensusMethod: string; totalTimeMs: number } }> {
  const result = await collaborativeResponse(prompt + "\n\nRespond with valid JSON only, no markdown code fences.", {
    ...options,
    maxTokens: 4000,
  });

  const cleaned = result.synthesis
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .trim();

  let data: T;
  try {
    data = JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("[CollabAI] Provider returned invalid JSON", {
      error: error instanceof Error ? error.message : String(error),
      preview: cleaned.slice(0, 500),
    });
    throw new Error("The AI response was not valid JSON. Please try again.");
  }
  return {
    data,
    meta: {
      engines: result.engines.filter(e => !e.error).map(e => e.engine),
      ragSources: result.ragContext.sources,
      consensusMethod: result.consensusMethod,
      totalTimeMs: result.totalTimeMs,
    },
  };
}

export async function collaborativeStream(params: CollaborativeStreamParams): Promise<void> {
  if (params.signal?.aborted) return;
  const engines = getAvailableEngines();
  if (engines.length === 0) {
    params.onError(new Error("No AI engines configured"));
    return;
  }

  // Separate DeepSeek R1 (deep thinker, 30-90s) from the fast engines
  // (Claude, OpenAI, Gemini, ~3-8s). R1 starts immediately on its own
  // track — it will NOT block the initial synthesis.
  const deepThinkEngine = params.fastFirst ? undefined : engines.find(e => e.id === "deepseek-r1");
  const allFastEngines = engines.filter(e => e.id !== "deepseek-r1");
  if (params.fastFirst && allFastEngines.length === 0) {
    await params.onError(new Error("No fast AI engine configured; Quick mode will not use the slow reasoning engine"));
    return;
  }

  // When the user has supplied document context (skipRAG=true), prefer Claude
  // as the sole fast engine — it has a 200K-token context window and handles
  // large documents far better than a parallel multi-engine synthesis would.
  // If Claude isn't available fall back to all fast engines.
  let enginesForFastPass = allFastEngines.length > 0 ? allFastEngines : engines;
  if (params.skipRAG) {
    const claudeEngine = allFastEngines.find(e => e.id === "claude");
    if (claudeEngine) enginesForFastPass = [claudeEngine];
  }
  if (params.fastFirst && allFastEngines.length > 0) {
    enginesForFastPass = [allFastEngines.find(e => e.id === "claude") || allFastEngines[0]];
  }

  let ragSources: string[] = [];
  let ragContext = "";
  let ragChunkCount = 0;

  if (!params.skipRAG && !params.fastFirst) {
    try {
      if (params.signal?.aborted) return;
      const searchQuery = params.prompt.slice(0, 200);
      const [chunks, liveContext] = await Promise.all([
        retrieveRelevantChunks(searchQuery, 8),
        buildLiveIntelligenceContext(),
      ]);
      ragChunkCount = chunks.length;
      ragSources = chunks.map(c => c.title);
      ragContext = `\n=== RAG KNOWLEDGE BASE (${chunks.length} relevant chunks) ===\n` +
        chunks.map((c, i) => `[${i + 1}] ${c.title}: ${c.content}`).join("\n") +
        `\n\n${liveContext}`;
    } catch {}
  }

  const enrichedPrompt = params.skipRAG
    ? `${params.prompt}\n\nCRITICAL DOCUMENT READING INSTRUCTIONS:\nOne or more documents are attached above inside [ATTACHED DOCUMENT: "..."] blocks. These are EXTERNAL documents the user is asking you to read and work with — they did NOT write them and want YOU to analyze, synthesize, or produce output BASED on the actual content.\n\nYou MUST:\n1. Read the attached document(s) carefully before responding.\n2. Ground EVERY fact, figure, and claim in what the documents actually say. Quote specific numbers, names, dollar amounts, programs, and policy language from the documents.\n3. Answer the user's question using the documents as your primary source. Do NOT substitute generic AI knowledge, internal ThriveUp frameworks, or MAP-GAP boilerplate for document content.\n4. If the user asks you to brief, analyze, build on, or produce output from the documents — do exactly that using the real content in the documents.\n5. Do NOT produce generic framework templates. Do NOT apply RPLICE/MAP-GAP sections unless the documents themselves use that framing. Be specific, substantive, and grounded in the actual document text.\n6. Do NOT truncate. Write full, complete responses.`
    : params.noFrameworkInjection
    ? `${params.prompt}${ragContext}\n\nINSTRUCTIONS: Use the RAG knowledge context above if it is relevant to the person's question. Ground every statement in real data. Speak directly to the person's actual situation — be specific, warm, and conversational. Do NOT produce framework headers, "Phase" sections, or generic consulting-speak. Answer as a knowledgeable, empathetic guide.`
    : `${params.prompt}${ragContext}\n\n=== RPLICE IMPLEMENTATION SCIENCE LENS (LIVE) ===\n${RPLICE_LENS_STATIC}\n\n${buildRpliceInboundContext()}\n\n=== MAP-GAP CONTINUOUS IMPROVEMENT LENS ===\n${MAPGAP_LENS}\n\nINSTRUCTIONS: Incorporate the RAG knowledge context and apply both RPLICE and MAP-GAP framework thinking. Ground every statement in real data. Be specific and actionable.`;

  const STREAM_ANTI_FAB = `NON-NEGOTIABLE TRUTH RULES (override everything else):
1. No fabricated numbers — every metric/percentage/count must come from RAG context, user document, or live data explicitly provided. If absent, say "I don't have that data."
2. No fabricated acronym expansions — RPLICE = "Research-to-Practice Lifecycle Implementation & Community Evidence" (sister platform at implementationineducatio.com), never invent other expansions.
3. No fabricated grades, scores, or projected outcomes without a cited primary source.
4. Uncertainty = disclosure, not fabrication.
`;
  const baseSystem = params.systemPrompt || (STREAM_ANTI_FAB + "You are part of the ThriveUp Academy Collaborative Intelligence System — evidence-grounded synthesis for a 26-platform community-infrastructure ecosystem. Use the RAG context provided. Never fabricate facts.");

  params.onMeta({
    engines: (params.fastFirst ? enginesForFastPass : engines).map(e => e.id),
    ragSources,
    frameworks: ["RPLICE", "MAP-GAP"],
  });

  const totalStart = Date.now();
  console.log(`[CollabAI-Stream] Phase 1: ${enginesForFastPass.length} fast engine(s) + DeepSeek R1 deep thinker starting (RAG: ${ragChunkCount} chunks)`);

  // Start DeepSeek R1 immediately — it runs independently. We await it
  // AFTER the initial synthesis has been streamed, so it never delays users.
  const deepThinkStart = Date.now();
  let deepThinkTimeout: ReturnType<typeof setTimeout> | undefined;
  const deepThinkPromise: Promise<EngineResult | null> = deepThinkEngine
    ? Promise.race([
        callEngineWithDeadline(
          deepThinkEngine,
          enrichedPrompt,
          baseSystem,
          params.maxTokens || 3000,
          DEEP_THINK_TIMEOUT_MS,
          params.signal,
        ),
        new Promise<EngineResult>(resolve => {
          deepThinkTimeout = setTimeout(() => resolve({
            engine: deepThinkEngine.id,
            model: deepThinkEngine.model,
            response: "",
            responseTimeMs: DEEP_THINK_TIMEOUT_MS,
            error: `Deep think timeout after ${DEEP_THINK_TIMEOUT_MS}ms`,
          }), DEEP_THINK_TIMEOUT_MS);
        }),
      ]).finally(() => {
        if (deepThinkTimeout) clearTimeout(deepThinkTimeout);
      }).catch(error => ({
        engine: deepThinkEngine.id,
        model: deepThinkEngine.model,
        response: "",
        responseTimeMs: Date.now() - deepThinkStart,
        error: error?.message || "Deep think engine failed",
      }))
    : Promise.resolve(null);

  // ── Phase 1: Fast engines → 25s global deadline → initial synthesis ──────
  // Send keepalive SSE comments every 8s so mobile Safari / deployment proxies
  // don't drop the connection while engines are computing.
  const phase1Keepalive = params.onKeepAlive
    ? setInterval(() => {
        try { params.onKeepAlive!(); } catch (error) {
          console.warn("[CollabAI] keepalive callback failed:", error instanceof Error ? error.message : error);
        }
      }, 8_000)
    : null;
  let fastResults: EngineResult[];
  try {
    fastResults = await collectEngineResults(
      enginesForFastPass,
      enrichedPrompt,
      baseSystem,
      params.maxTokens || 3000,
      params.signal,
    );
  } finally {
    if (phase1Keepalive) clearInterval(phase1Keepalive);
  }
  if (params.signal?.aborted) return;

  const successfulEngines = fastResults.filter(r => !r.error && r.response.length > 20);
  const failedStreamEngines = fastResults.filter(r => r.error || r.response.length <= 20);
  if (failedStreamEngines.length > 0) {
    console.error(`[CollabAI-Stream] ${failedStreamEngines.length} fast engine(s) failed: ${failedStreamEngines.map(e => `${e.engine}(${e.error || "empty"})`).join(", ")}`);
  }
  console.log(`[CollabAI-Stream] Phase 1 complete: ${successfulEngines.length}/${enginesForFastPass.length} fast engines in ${Date.now() - totalStart}ms`);

  if (successfulEngines.length >= 2) {
    const synthesisEngine = enginesForFastPass.find(e => e.id === "claude") || enginesForFastPass.find(e => e.id === "openai") || enginesForFastPass[0];
    const synthesis = await synthesizeResponses(fastResults, params.prompt, ragSources, synthesisEngine, params.skipRAG, params.noFrameworkInjection);
    const words = synthesis.split(/(\s+)/);
    for (let i = 0; i < words.length; i += 3) {
      if (params.signal?.aborted) return;
      params.onChunk(words.slice(i, i + 3).join(""));
      await new Promise(r => setTimeout(r, 10));
    }
  } else if (successfulEngines.length === 1) {
    const words = successfulEngines[0].response.split(/(\s+)/);
    for (let i = 0; i < words.length; i += 3) {
      if (params.signal?.aborted) return;
      params.onChunk(words.slice(i, i + 3).join(""));
      await new Promise(r => setTimeout(r, 10));
    }
  } else {
    // All fast engines failed — fire the smoke alert immediately.
    triggerImmediateSmokeAlert(
      `collaborativeStream: 0/${enginesForFastPass.length} fast engines responded within ${ENGINES_GLOBAL_DEADLINE_MS}ms global deadline. ` +
      `Failed: ${fastResults.map(e => `${e.engine}(${e.error || "empty"})`).join(", ")}`
    );
    if (deepThinkEngine && params.onDeepThinking) {
      deepThinkPromise
        .then((r1Result) => {
          const deepThinkTimeMs = Date.now() - deepThinkStart;
          params.onDeepThinking!(
            r1Result && !r1Result.error ? r1Result.response : "",
            r1Result?.engine || deepThinkEngine!.id,
            deepThinkTimeMs,
          );
        })
        .catch((err) => {
          console.error(`[CollabAI-Stream] Phase 2 background error after fast failure: ${err}`);
          params.onDeepThinking!("", deepThinkEngine!.id, Date.now() - deepThinkStart);
        });
    }
    params.onError(new Error("All AI engines failed to produce a response. Please try again in a few minutes."));
    return;
  }

  // Signal that Phase 1 is done — unlock input immediately.
  params.onSynthesisComplete?.();
  if (params.signal?.aborted) return;

  // ── Close the SSE NOW — Phase 1 result is fully delivered ────────────────
  // DeepSeek R1 continues running in the background. The client polls
  // GET /api/navigator/deep-think/:jobId every 4s so mobile browsers never need
  // to hold a 70s+ SSE connection open. This eliminates iOS Safari SSE drops.
  const phase1TimeMs = Date.now() - totalStart;
  const consensusMethod = successfulEngines.length >= 2
    ? `${successfulEngines.length}-engine parallel synthesis`
    : successfulEngines.length === 1
      ? `single-engine (${successfulEngines[0].engine})`
      : "none";

  console.log(`[CollabAI-Stream] Phase 1 delivered in ${phase1TimeMs}ms — ${consensusMethod}. R1 running in background.`);

  await params.onDone({
    synthesis: "",
    engines: fastResults,
    ragContext: { chunkCount: ragChunkCount, sources: ragSources, liveData: true },
    frameworks: { rplice: true, mapGap: true },
    consensusMethod,
    totalTimeMs: phase1TimeMs,
  });

  // ── Phase 2: DeepSeek R1 finishes after SSE closes ───────────────────────
  // onDeepThinking fires asynchronously. navigator-routes stores the result
  // in deepThinkResultStore for the client to poll.
  if (deepThinkEngine && params.onDeepThinking) {
    deepThinkPromise
      .then(r1Result => {
        if (params.signal?.aborted) return;
        const deepThinkTimeMs = Date.now() - deepThinkStart;
        if (r1Result && !r1Result.error && r1Result.response.length > 20) {
          console.log(`[CollabAI-Stream] Phase 2: DeepSeek R1 complete in ${deepThinkTimeMs}ms — storing for poll`);
          params.onDeepThinking!(r1Result.response, r1Result.engine, deepThinkTimeMs);
        } else {
          console.log(`[CollabAI-Stream] Phase 2: DeepSeek R1 no output — ${r1Result?.error || "empty"}`);
          // Let the caller release any admission slot even when the provider
          // times out or returns an unusable response.
          params.onDeepThinking!("", deepThinkEngine!.id, deepThinkTimeMs);
        }
      })
      .catch(err => console.error(`[CollabAI-Stream] Phase 2 background error: ${err}`));
  }
}

export function getCollaborativeStatus(): {
  enginesAvailable: Array<{ id: string; model: string }>;
  engineCount: number;
  ragEnabled: boolean;
  rpliceEnabled: boolean;
  mapGapEnabled: boolean;
  status: string;
} {
  const engines = getAvailableEngines();
  return {
    enginesAvailable: engines,
    engineCount: engines.length,
    ragEnabled: true,
    rpliceEnabled: true,
    mapGapEnabled: true,
    status: engines.length >= 3 ? "FULLY_COLLABORATIVE" : engines.length >= 2 ? "PARTIALLY_COLLABORATIVE" : engines.length === 1 ? "SINGLE_ENGINE" : "NO_ENGINES",
  };
}
