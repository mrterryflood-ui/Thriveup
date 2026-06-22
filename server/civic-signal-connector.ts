/**
 * Civic Signal Connector — Bidirectional Flow
 * ----------------------------------------------------------------------------
 * ThriveUp ↔ Civic Signal bidirectional data exchange.
 *
 * DIRECTION 1 (Civic Signal → ThriveUp):
 *   Civic Signal pushes policy adaptation lessons via webhook.
 *   POST /api/chainweb/webhook/civic-signal
 *   Lessons are stored and surfaced in the Chainweb RAG context and
 *   the /chainweb page's Community Story tab.
 *
 * DIRECTION 2 (ThriveUp → Civic Signal):
 *   ThriveUp pushes Chainweb ROI calculations and SDOH community data.
 *   fetchCivicSignalAdaptations() — call this to pull from Civic Signal.
 *   pushChainwebToCivicSignal() — call this to send a scenario result.
 *
 * WIRE-UP STATUS:
 *   - ThriveUp side (this file): BUILT — ready to receive and send.
 *   - Civic Signal side: PENDING — waiting for Dr. Flood to provide:
 *       1. Civic Signal base URL
 *       2. Auth header/token
 *       3. Adaptation engine endpoint + payload shape
 *
 * Once Civic Signal API details are received, replace the TODO stubs
 * in this file and set CIVIC_SIGNAL_BASE_URL + CIVIC_SIGNAL_API_KEY
 * as Replit secrets.
 * ----------------------------------------------------------------------------
 */

import { db } from "./storage";

// ── In-memory store for incoming Civic Signal lessons (until DB column added) ──
// Lessons are stored in memory and injected into RAG context.
// TODO: add civic_signal_lessons table to schema when volume justifies it.
const incomingLessons: CivicSignalLesson[] = [];

export interface CivicSignalLesson {
  id: string;
  lesson: string;           // The policy adaptation lesson text
  topic: string;            // e.g. "pre-k", "housing", "reentry"
  state: string;            // e.g. "TX", "CA"
  source: string;           // e.g. "civic_signal_adaptation_engine_v2"
  confidence: string;       // e.g. "high", "moderate", "low"
  receivedAt: string;       // ISO timestamp
  programIds?: string[];    // Optional: maps to EVIDENCE_PROGRAMS ids
  roiImplication?: string;  // Optional: what this means for ROI calculations
}

// ── Receive a lesson pushed FROM Civic Signal ─────────────────────────────
export async function receiveCivicSignalLesson(
  payload: Partial<CivicSignalLesson>
): Promise<{ stored: boolean; lessonId: string }> {
  const lesson: CivicSignalLesson = {
    id: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lesson: payload.lesson || "",
    topic: payload.topic || "general",
    state: payload.state || "US",
    source: payload.source || "civic_signal",
    confidence: payload.confidence || "moderate",
    receivedAt: new Date().toISOString(),
    programIds: payload.programIds,
    roiImplication: payload.roiImplication,
  };

  if (!lesson.lesson) {
    throw new Error("lesson field is required");
  }

  incomingLessons.push(lesson);

  // Keep last 100 lessons in memory
  if (incomingLessons.length > 100) {
    incomingLessons.splice(0, incomingLessons.length - 100);
  }

  console.log(`[CivicSignal] Received lesson: topic=${lesson.topic} state=${lesson.state} confidence=${lesson.confidence}`);

  return { stored: true, lessonId: lesson.id };
}

// ── Retrieve stored lessons (for RAG injection) ───────────────────────────
export function getCivicSignalLessons(opts?: {
  topic?: string;
  state?: string;
  limit?: number;
}): CivicSignalLesson[] {
  let results = [...incomingLessons];

  if (opts?.topic) {
    const t = opts.topic.toLowerCase();
    results = results.filter(l => l.topic.toLowerCase().includes(t));
  }
  if (opts?.state) {
    const s = opts.state.toUpperCase();
    results = results.filter(l => l.state.toUpperCase() === s || l.state === "US");
  }

  // Most recent first
  results.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  return results.slice(0, opts?.limit || 10);
}

// ── Format lessons as RAG context paragraph ───────────────────────────────
export function getCivicSignalRAGContext(topic?: string, state?: string): string {
  const lessons = getCivicSignalLessons({ topic, state, limit: 5 });
  if (!lessons.length) return "";

  const lines = ["## Civic Signal Policy Adaptation Intelligence\n"];
  for (const l of lessons) {
    lines.push(`**${l.topic.toUpperCase()} (${l.state}) — ${l.confidence} confidence**`);
    lines.push(l.lesson);
    if (l.roiImplication) lines.push(`ROI implication: ${l.roiImplication}`);
    lines.push(`Source: ${l.source} | Received: ${l.receivedAt.slice(0, 10)}`);
    lines.push("");
  }
  return lines.join("\n");
}

// ── Push Chainweb scenario TO Civic Signal ────────────────────────────────
// TODO: Wire up once Civic Signal API details received from Dr. Flood.
export async function pushChainwebToCivicSignal(payload: {
  scenarioName: string;
  interventionName: string;
  geography: string;
  domain: string;
  roiRatio: number;
  netSavings: number;
  counterfactualCost: number;
  keyStatements: Array<{ claim: string; citation: string }>;
}): Promise<{ pushed: boolean; message: string }> {
  const baseUrl = process.env.CIVIC_SIGNAL_BASE_URL;
  const apiKey  = process.env.CIVIC_SIGNAL_API_KEY;

  if (!baseUrl || !apiKey) {
    // Graceful no-op until credentials are configured
    console.log("[CivicSignal] Push skipped — CIVIC_SIGNAL_BASE_URL / CIVIC_SIGNAL_API_KEY not set. Set these secrets once Civic Signal provides API details.");
    return {
      pushed: false,
      message: "Civic Signal credentials not yet configured. Set CIVIC_SIGNAL_BASE_URL and CIVIC_SIGNAL_API_KEY as Replit secrets once API details are received.",
    };
  }

  try {
    // TODO: Replace endpoint path and payload shape once Civic Signal confirms their API
    const endpoint = `${baseUrl}/api/adaptation/ingest-roi-evidence`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: Replace header name once Civic Signal confirms auth mechanism
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        source: "thriveup_chainweb",
        sourceVersion: "1.0.0",
        ...payload,
        sentAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Civic Signal returned HTTP ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log("[CivicSignal] Push succeeded:", result);
    return { pushed: true, message: "Successfully pushed to Civic Signal adaptation engine" };

  } catch (err: any) {
    console.error("[CivicSignal] Push failed:", err.message);
    return { pushed: false, message: `Push failed: ${err.message}` };
  }
}

// ── Pull adaptations FROM Civic Signal ───────────────────────────────────
// TODO: Wire up once Civic Signal API details received from Dr. Flood.
export async function fetchCivicSignalAdaptations(opts: {
  topic: string;
  state?: string;
}): Promise<{ adaptations: any[]; source: string }> {
  const baseUrl = process.env.CIVIC_SIGNAL_BASE_URL;
  const apiKey  = process.env.CIVIC_SIGNAL_API_KEY;

  if (!baseUrl || !apiKey) {
    // Return cached incoming lessons as the best available data
    const cached = getCivicSignalLessons({ topic: opts.topic, state: opts.state, limit: 5 });
    return {
      adaptations: cached.map(l => ({ lesson: l.lesson, confidence: l.confidence, receivedAt: l.receivedAt })),
      source: "civic_signal_cached_webhooks",
    };
  }

  try {
    // TODO: Replace endpoint path and params once Civic Signal confirms their API
    const params = new URLSearchParams({ topic: opts.topic });
    if (opts.state) params.set("state", opts.state);
    const url = `${baseUrl}/api/adaptation/policy-lessons?${params}`;

    const response = await fetch(url, {
      headers: {
        // TODO: Replace header name once Civic Signal confirms auth mechanism
        "Authorization": `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { adaptations: data.adaptations || data, source: "civic_signal_live" };

  } catch (err: any) {
    console.error("[CivicSignal] Fetch failed, returning cached:", err.message);
    const cached = getCivicSignalLessons({ topic: opts.topic, state: opts.state, limit: 5 });
    return {
      adaptations: cached.map(l => ({ lesson: l.lesson, confidence: l.confidence })),
      source: "civic_signal_cached_fallback",
    };
  }
}
