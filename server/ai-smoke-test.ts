/**
 * AI Engine Smoke Test — active health monitoring for the ThriveUp Navigator.
 *
 * WHY THIS EXISTS:
 * The Navigator was silently broken for an unknown period before Dr. Flood
 * reported it (2026-05-29). The root cause was deepseek-r1 taking 88s, which
 * exceeded the deployment proxy timeout, causing every Navigator chat to show
 * "I'm sorry, I'm having trouble connecting." No alert fired. No log stood out.
 *
 * This module fixes that. Every 15 minutes in production it pings each AI
 * engine with a minimal test prompt. If ALL engines fail (Navigator is down),
 * it emails Dr. Flood immediately — on the second consecutive failure to avoid
 * transient noise. When the system recovers, it sends an "all clear." Engine
 * latencies are tracked so slow engines are visible before they cause timeout
 * failures.
 *
 * Iron Rule compliance:
 * - Iron Rule #11: every claim about system state is proven by tool, not assertion.
 * - Iron Rule #2: no conjecture — we ping, we measure, we report.
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendAIEngineAlert } from "./email-service";

export interface EngineProbeResult {
  engine: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface SmokeTestResult {
  timestamp: string;
  allHealthy: boolean;
  navigatorFunctional: boolean;
  healthyCount: number;
  totalConfigured: number;
  engines: EngineProbeResult[];
  durationMs: number;
}

// ────────────────────────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────────────────────────

let lastResult: SmokeTestResult | null = null;
let consecutiveFullFailures = 0;
let wasFullyDown = false;

/** Exposed so the admin route and collaborativeStream can read the latest result. */
export function getLastSmokeResult(): SmokeTestResult | null {
  return lastResult;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-engine probes — each uses max_tokens=5 and a 10-second timeout
// ────────────────────────────────────────────────────────────────────────────

const PROBE_TIMEOUT_MS = 10_000;
const PROBE_PROMPT = "Reply with exactly one word: OK";
const PROBE_MAX_TOKENS = 5;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function probeGemini(): Promise<EngineProbeResult> {
  const start = Date.now();
  // Use OpenRouter (same path as production) — direct GEMINI_API_KEY is free-tier
  // and hits quota constantly; OR uses user's paid credits.
  const orKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const orBase = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  const model = "google/gemini-2.5-flash";
  if (!orKey || !orBase) return { engine: "gemini", model, ok: false, latencyMs: 0, error: "OpenRouter not configured" };

  try {
    const client = new OpenAI({ apiKey: orKey, baseURL: orBase });
    const resp = await withTimeout(
      client.chat.completions.create({
        model,
        messages: [{ role: "user", content: PROBE_PROMPT }],
        max_tokens: PROBE_MAX_TOKENS,
      }),
      PROBE_TIMEOUT_MS,
      "gemini-or"
    );
    const text = resp.choices[0]?.message?.content || "";
    if (!text || text.trim().length === 0) throw new Error("Empty response");
    return { engine: "gemini", model, ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { engine: "gemini", model, ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function probeClaude(): Promise<EngineProbeResult> {
  const start = Date.now();
  const key = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!key || !baseURL) return { engine: "claude", model: "claude-haiku-4-5", ok: false, latencyMs: 0, error: "AI_INTEGRATIONS_ANTHROPIC_* not set" };

  try {
    const client = new Anthropic({ apiKey: key, baseURL });
    const resp = await withTimeout(
      client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: PROBE_MAX_TOKENS,
        messages: [{ role: "user", content: PROBE_PROMPT }],
      }),
      PROBE_TIMEOUT_MS,
      "claude"
    );
    const block = resp.content[0];
    const text = block.type === "text" ? block.text : "";
    if (!text || text.trim().length === 0) throw new Error("Empty response");
    return { engine: "claude", model: "claude-haiku-4-5", ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { engine: "claude", model: "claude-haiku-4-5", ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function probeOpenAI(): Promise<EngineProbeResult> {
  const start = Date.now();
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!key || !baseURL) return { engine: "openai", model: "gpt-4o-mini", ok: false, latencyMs: 0, error: "AI_INTEGRATIONS_OPENAI_* not set" };

  try {
    const client = new OpenAI({ apiKey: key, baseURL });
    const resp = await withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: PROBE_PROMPT }],
        max_completion_tokens: PROBE_MAX_TOKENS,
      }),
      PROBE_TIMEOUT_MS,
      "openai"
    );
    const text = resp.choices[0]?.message?.content || "";
    if (!text || text.trim().length === 0) throw new Error("Empty response");
    return { engine: "openai", model: "gpt-4o-mini", ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { engine: "openai", model: "gpt-4o-mini", ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

async function probeDeepSeek(): Promise<EngineProbeResult> {
  const start = Date.now();
  const key = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  if (!key || !baseURL) return { engine: "deepseek", model: "deepseek/deepseek-chat", ok: false, latencyMs: 0, error: "AI_INTEGRATIONS_OPENROUTER_* not set" };

  try {
    const client = new OpenAI({ apiKey: key, baseURL });
    const resp = await withTimeout(
      client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: PROBE_PROMPT }],
        max_tokens: PROBE_MAX_TOKENS,
      }),
      PROBE_TIMEOUT_MS,
      "deepseek"
    );
    const text = resp.choices[0]?.message?.content || "";
    if (!text || text.trim().length === 0) throw new Error("Empty response");
    return { engine: "deepseek", model: "deepseek/deepseek-chat", ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { engine: "deepseek", model: "deepseek/deepseek-chat", ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main smoke test
// ────────────────────────────────────────────────────────────────────────────

export async function runSmokeTest(): Promise<SmokeTestResult> {
  const start = Date.now();

  const probes = await Promise.all([probeGemini(), probeClaude(), probeOpenAI(), probeDeepSeek()]);
  const configured = probes.filter(p => !p.error?.includes("not set"));
  const healthy = configured.filter(p => p.ok);

  const result: SmokeTestResult = {
    timestamp: new Date().toISOString(),
    allHealthy: healthy.length === configured.length && configured.length > 0,
    navigatorFunctional: healthy.length >= 1,
    healthyCount: healthy.length,
    totalConfigured: configured.length,
    engines: probes,
    durationMs: Date.now() - start,
  };

  // Always log so deployment logs surface the state
  const statusLine = result.navigatorFunctional
    ? `[SmokeTest] ✓ Navigator OK — ${healthy.length}/${configured.length} engines healthy (${healthy.map(e => `${e.engine} ${e.latencyMs}ms`).join(", ")})`
    : `[SmokeTest] ✗ NAVIGATOR DOWN — 0/${configured.length} engines responded`;

  if (result.navigatorFunctional) {
    console.log(statusLine);
  } else {
    console.error(statusLine);
  }

  const failed = configured.filter(p => !p.ok);
  if (failed.length > 0) {
    console.error(`[SmokeTest] Failed engines: ${failed.map(e => `${e.engine}(${e.error})`).join(", ")}`);
  }

  lastResult = result;
  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Alert logic
// ────────────────────────────────────────────────────────────────────────────

async function runAndAlert(): Promise<void> {
  try {
    const result = await runSmokeTest();

    if (!result.navigatorFunctional) {
      consecutiveFullFailures++;
      console.error(`[SmokeTest] ALERT: ${consecutiveFullFailures} consecutive full failure(s) — Navigator completely unreachable`);

      // Alert on 2nd consecutive failure to avoid transient single-check noise
      if (consecutiveFullFailures >= 2) {
        wasFullyDown = true;
        await sendAIEngineAlert({
          type: "down",
          result,
          consecutiveFailures: consecutiveFullFailures,
        });
      }
    } else {
      if (wasFullyDown) {
        // Recovery alert
        wasFullyDown = false;
        await sendAIEngineAlert({ type: "recovered", result, consecutiveFailures: 0 });
      }
      consecutiveFullFailures = 0;
    }
  } catch (err: any) {
    console.error("[SmokeTest] Smoke test itself threw:", err.message || err);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Immediate alert for use by collaborativeStream when all engines fail at runtime
// ────────────────────────────────────────────────────────────────────────────

let lastRuntimeAlertAt = 0;
const RUNTIME_ALERT_COOLDOWN_MS = 30 * 60 * 1000; // don't flood — max 1 alert per 30 min

export function triggerImmediateSmokeAlert(context: string): void {
  const now = Date.now();
  if (now - lastRuntimeAlertAt < RUNTIME_ALERT_COOLDOWN_MS) return;
  lastRuntimeAlertAt = now;

  console.error(`[SmokeTest] RUNTIME ALERT triggered: ${context}`);

  // Fire-and-forget — don't block the stream
  runAndAlert().catch((err) =>
    console.error("[SmokeTest] Runtime alert follow-up failed:", err?.message || err)
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Startup
// ────────────────────────────────────────────────────────────────────────────

const SMOKE_TEST_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes

export function startAISmokeTests(): void {
  console.log("[SmokeTest] Starting AI engine health monitoring — interval: 15 min");

  // Run immediately at startup so we know right away if something is broken
  setTimeout(() => {
    runAndAlert().catch((err) =>
      console.error("[SmokeTest] Startup probe failed:", err?.message || err)
    );
  }, 15_000); // 15-second delay so other startup tasks complete first

  setInterval(() => {
    runAndAlert().catch((err) =>
      console.error("[SmokeTest] Scheduled probe failed:", err?.message || err)
    );
  }, SMOKE_TEST_INTERVAL_MS);
}
