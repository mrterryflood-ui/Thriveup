import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveRelevantChunks, buildLiveIntelligenceContext } from "./rag-engine";
import { withEthicalPreamble } from "./ai-provider";
import { triggerImmediateSmokeAlert } from "./ai-smoke-test";

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
  systemPrompt?: string;
  maxTokens?: number;
  /** When true, skip RAG retrieval entirely (e.g. user has already supplied
   *  document context — RAG would only waste context-window budget). */
  skipRAG?: boolean;
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
}

const RPLICE_LENS = `Apply RPLICE implementation science framework:
- Reach: Who does this serve? How many people? What populations?
- Plan: What's the evidence-based approach? What implementation strategy?
- Launch: What resources, training, infrastructure are needed?
- Implement: What are the fidelity indicators? Quality measures?
- Cultivate: How do we sustain, scale, and improve over time?
- Evaluate: What outcomes do we measure? Using CFIR/RE-AIM frameworks.`;

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
const ENGINES_GLOBAL_DEADLINE_MS = 12_000;

// DeepSeek R1 runs on its own independent track — deep reasoning takes 30-90s.
// It does NOT block the initial synthesis. When it finishes, its output flows
// as a "Deep Thinking Addendum" over the still-open SSE connection.
const DEEP_THINK_TIMEOUT_MS = 80_000;

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
  maxTokens: number
): Promise<EngineResult[]> {
  const collected: EngineResult[] = [];

  // Each engine pushes its result into collected as soon as it finishes.
  const perEnginePromises = engines.map(engine =>
    callEngine(engine, prompt, systemPrompt, maxTokens)
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
  await Promise.race([
    Promise.all(perEnginePromises),
    new Promise<void>(resolve => setTimeout(resolve, ENGINES_GLOBAL_DEADLINE_MS)),
  ]);

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
  if (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY && process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) engines.push({ id: "claude", model: "claude-haiku-4-5" });
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) engines.push({ id: "openai", model: "gpt-4o-mini" });
  // DeepSeek R1 — deep reasoning model (30-90s). Runs on its own track via
  // deepThinkPromise in collaborativeStream; never blocks the 12s fast-engine
  // synthesis. Its output arrives as a "Deep Thinking" addendum after the
  // initial response has already streamed to the user.
  if (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY && process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL) engines.push({ id: "deepseek-r1", model: "deepseek/deepseek-r1" });
  if (process.env.GEMINI_API_KEY && Date.now() > geminiCollabQuotaExhaustedUntil) engines.push({ id: "gemini", model: "gemini-2.0-flash" });
  return engines;
}

async function callEngine(engine: { id: EngineId; model: string }, prompt: string, systemPrompt: string, maxTokens: number): Promise<EngineResult> {
  // Persistent ethics/EI principle — every engine in the 4-engine
  // collaborative synthesis carries the same operating values as the
  // single-provider path in ai-provider.ts.
  systemPrompt = withEthicalPreamble(systemPrompt);
  const start = Date.now();
  try {
    let response = "";

    if (engine.id === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: maxTokens },
      });
      const result = await model.generateContent(prompt);
      response = result.response.text();

    } else if (engine.id === "claude") {
      const client = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });
      const resp = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });
      const block = resp.content[0];
      response = block.type === "text" ? block.text : "";

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
      });
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
      });
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
  synthesisEngine: { id: EngineId; model: string }
): Promise<string> {
  const validResults = engineResults.filter(r => r.response && r.response.length > 20);

  if (validResults.length === 0) return "All engines failed to produce output.";
  if (validResults.length === 1) return validResults[0].response;

  const engineOutputs = validResults.map((r, i) =>
    `=== ENGINE ${i + 1}: ${r.engine.toUpperCase()} (${r.model}) — ${r.responseTimeMs}ms ===\n${r.response}`
  ).join("\n\n");

  const synthesisPrompt = `You are the TCAF Collaborative Intelligence Synthesizer. Multiple AI engines have independently analyzed the same prompt. Your job is to produce a SINGLE superior output that:

1. Captures the BEST insights from each engine
2. Resolves any contradictions by choosing the most evidence-grounded position
3. Ensures nothing important is missed
4. Produces a cohesive, authoritative response — not a list of "Engine A said X, Engine B said Y"

RAG knowledge sources used: ${ragSources.join(", ") || "none"}
Frameworks applied: RPLICE (implementation science), MAP-GAP (continuous improvement)

ORIGINAL PROMPT:
${originalPrompt}

ENGINE OUTPUTS:
${engineOutputs}

Produce a single, synthesized response that is BETTER than any individual engine output. Do not reference engines by name. Speak with one authoritative voice.`;

  try {
    const result = await callEngine(synthesisEngine, synthesisPrompt, "You are an expert synthesizer for the ThriveUp Academy ACOS. Produce cohesive, authoritative outputs.", 4000);
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
  if (includeRPLICE) frameworkContext += `\n\n=== RPLICE IMPLEMENTATION SCIENCE LENS ===\n${RPLICE_LENS}`;
  if (includeMAPGAP) frameworkContext += `\n\n=== MAP-GAP CONTINUOUS IMPROVEMENT LENS ===\n${MAPGAP_LENS}`;

  const enrichedPrompt = `${prompt}${ragContext}${frameworkContext}

INSTRUCTIONS: Incorporate the RAG knowledge context and apply both RPLICE and MAP-GAP framework thinking in your response. Ground every statement in real data. Be specific and actionable.`;

  const baseSystem = options?.systemPrompt || "You are part of the ThriveUp Academy Collaborative Intelligence System — a multi-engine AI that uses RAG knowledge retrieval, RPLICE implementation science, and MAP-GAP continuous improvement to produce evidence-grounded outputs for a 24-platform workforce development ecosystem.";

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

  const data = JSON.parse(cleaned) as T;
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
  const engines = getAvailableEngines();
  if (engines.length === 0) {
    params.onError(new Error("No AI engines configured"));
    return;
  }

  // Separate DeepSeek R1 (deep thinker, 30-90s) from the fast engines
  // (Claude, OpenAI, Gemini, ~3-8s). R1 starts immediately on its own
  // track — it will NOT block the initial synthesis.
  const deepThinkEngine = engines.find(e => e.id === "deepseek-r1");
  const allFastEngines = engines.filter(e => e.id !== "deepseek-r1");

  // When the user has supplied document context (skipRAG=true), prefer Claude
  // as the sole fast engine — it has a 200K-token context window and handles
  // large documents far better than a parallel multi-engine synthesis would.
  // If Claude isn't available fall back to all fast engines.
  let enginesForFastPass = allFastEngines.length > 0 ? allFastEngines : engines;
  if (params.skipRAG) {
    const claudeEngine = allFastEngines.find(e => e.id === "claude");
    if (claudeEngine) enginesForFastPass = [claudeEngine];
  }

  let ragSources: string[] = [];
  let ragContext = "";
  let ragChunkCount = 0;

  if (!params.skipRAG) {
    try {
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
    ? `${params.prompt}\n\n=== RPLICE IMPLEMENTATION SCIENCE LENS ===\n${RPLICE_LENS}\n\nINSTRUCTIONS: Analyse the supplied document(s) carefully. Apply RPLICE implementation science thinking. Be specific and actionable. Do NOT truncate your response — produce the full output the user requested.`
    : `${params.prompt}${ragContext}\n\n=== RPLICE IMPLEMENTATION SCIENCE LENS ===\n${RPLICE_LENS}\n\n=== MAP-GAP CONTINUOUS IMPROVEMENT LENS ===\n${MAPGAP_LENS}\n\nINSTRUCTIONS: Incorporate the RAG knowledge context and apply both RPLICE and MAP-GAP framework thinking. Ground every statement in real data. Be specific and actionable.`;

  const baseSystem = params.systemPrompt || "You are part of the ThriveUp Academy Collaborative Intelligence System — a multi-engine AI that uses RAG knowledge retrieval, RPLICE implementation science, and MAP-GAP continuous improvement to produce evidence-grounded outputs.";

  params.onMeta({
    engines: engines.map(e => e.id),
    ragSources,
    frameworks: ["RPLICE", "MAP-GAP"],
  });

  const totalStart = Date.now();
  console.log(`[CollabAI-Stream] Phase 1: ${enginesForFastPass.length} fast engine(s) + DeepSeek R1 deep thinker starting (RAG: ${ragChunkCount} chunks)`);

  // Start DeepSeek R1 immediately — it runs independently. We await it
  // AFTER the initial synthesis has been streamed, so it never delays users.
  const deepThinkStart = Date.now();
  const deepThinkPromise: Promise<EngineResult | null> = deepThinkEngine
    ? Promise.race([
        callEngine(deepThinkEngine, enrichedPrompt, baseSystem, params.maxTokens || 3000),
        new Promise<EngineResult>(resolve => setTimeout(() => resolve({
          engine: deepThinkEngine.id,
          model: deepThinkEngine.model,
          response: "",
          responseTimeMs: DEEP_THINK_TIMEOUT_MS,
          error: `Deep think timeout after ${DEEP_THINK_TIMEOUT_MS}ms`,
        }), DEEP_THINK_TIMEOUT_MS))
      ])
    : Promise.resolve(null);

  // ── Phase 1: Fast engines → 12s global deadline → initial synthesis ──────
  const fastResults = await collectEngineResults(enginesForFastPass, enrichedPrompt, baseSystem, params.maxTokens || 3000);

  const successfulEngines = fastResults.filter(r => !r.error && r.response.length > 20);
  const failedStreamEngines = fastResults.filter(r => r.error || r.response.length <= 20);
  if (failedStreamEngines.length > 0) {
    console.error(`[CollabAI-Stream] ${failedStreamEngines.length} fast engine(s) failed: ${failedStreamEngines.map(e => `${e.engine}(${e.error || "empty"})`).join(", ")}`);
  }
  console.log(`[CollabAI-Stream] Phase 1 complete: ${successfulEngines.length}/${enginesForFastPass.length} fast engines in ${Date.now() - totalStart}ms`);

  if (successfulEngines.length >= 2) {
    const synthesisEngine = enginesForFastPass.find(e => e.id === "claude") || enginesForFastPass.find(e => e.id === "openai") || enginesForFastPass[0];
    const synthesis = await synthesizeResponses(fastResults, params.prompt, ragSources, synthesisEngine);
    const words = synthesis.split(/(\s+)/);
    for (let i = 0; i < words.length; i += 3) {
      params.onChunk(words.slice(i, i + 3).join(""));
      await new Promise(r => setTimeout(r, 10));
    }
  } else if (successfulEngines.length === 1) {
    const words = successfulEngines[0].response.split(/(\s+)/);
    for (let i = 0; i < words.length; i += 3) {
      params.onChunk(words.slice(i, i + 3).join(""));
      await new Promise(r => setTimeout(r, 10));
    }
  } else {
    // All fast engines failed — fire the smoke alert immediately.
    triggerImmediateSmokeAlert(
      `collaborativeStream: 0/${enginesForFastPass.length} fast engines responded within ${ENGINES_GLOBAL_DEADLINE_MS}ms global deadline. ` +
      `Failed: ${fastResults.map(e => `${e.engine}(${e.error || "empty"})`).join(", ")}`
    );
    params.onError(new Error("All AI engines failed to produce a response. Please try again in a few minutes."));
    return;
  }

  // Signal that the fast-engine synthesis is done — callers can unlock the
  // input immediately so users can re-prompt while R1 continues in the background.
  params.onSynthesisComplete?.();

  // ── Phase 2: Await DeepSeek R1 deep thinking (already running) ───────────
  const r1Result = await deepThinkPromise;
  if (r1Result && !r1Result.error && r1Result.response.length > 20 && params.onDeepThinking) {
    const deepThinkTimeMs = Date.now() - deepThinkStart;
    console.log(`[CollabAI-Stream] Phase 2: DeepSeek R1 deep thinking complete in ${deepThinkTimeMs}ms`);
    params.onDeepThinking(r1Result.response, r1Result.engine, deepThinkTimeMs);
  } else if (r1Result?.error) {
    console.log(`[CollabAI-Stream] Phase 2: DeepSeek R1 did not produce output — ${r1Result.error}`);
  }

  const allResults = [...fastResults, ...(r1Result ? [r1Result] : [])];
  const totalTimeMs = Date.now() - totalStart;
  const consensusMethod = successfulEngines.length >= 2
    ? `${successfulEngines.length}-engine parallel synthesis`
    : successfulEngines.length === 1
      ? `single-engine (${successfulEngines[0].engine})`
      : "none";

  console.log(`[CollabAI-Stream] Total complete in ${totalTimeMs}ms — ${consensusMethod}`);

  params.onDone({
    synthesis: "",
    engines: allResults,
    ragContext: { chunkCount: ragChunkCount, sources: ragSources, liveData: true },
    frameworks: { rplice: true, mapGap: true },
    consensusMethod,
    totalTimeMs,
  });
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
