/**
 * Civic Signal Connector — Bidirectional Flow (LIVE)
 * ----------------------------------------------------------------------------
 * ThriveUp ↔ Civic Signal bidirectional data exchange.
 *
 * INBOUND (Civic Signal → ThriveUp):
 *   POST /api/chainweb/webhook/civic-signal
 *   Auth: x-ecosystem-key (validated against ecosystem_platforms DB registry)
 *
 * OUTBOUND (ThriveUp → Civic Signal):
 *   PUSH: POST https://power2thepeople.net/api/thriveup/ingest
 *   PULL: GET  https://power2thepeople.net/api/thriveup/lessons
 *   Auth: x-civic-signal-key: process.env.THRIVEUP_INBOUND_KEY
 * ----------------------------------------------------------------------------
 */

const CIVIC_SIGNAL_BASE_URL = process.env.CIVIC_SIGNAL_BASE_URL || "https://power2thepeople.net";
const CIVIC_SIGNAL_PUSH_URL = `${CIVIC_SIGNAL_BASE_URL}/api/thriveup/ingest`;
const CIVIC_SIGNAL_PULL_URL = `${CIVIC_SIGNAL_BASE_URL}/api/thriveup/lessons`;

// ── In-memory store for incoming Civic Signal lessons ─────────────────────
const incomingLessons: CivicSignalLesson[] = [];

export interface CivicSignalLesson {
  id: string;
  lesson: string;
  topic: string;
  state: string;
  source: string;
  confidence: string;
  receivedAt: string;
  programIds?: string[];
  roiImplication?: string;
}

function outboundHeaders(): Record<string, string> {
  const key = process.env.THRIVEUP_INBOUND_KEY;
  if (!key) throw new Error("THRIVEUP_INBOUND_KEY secret not set");
  return {
    "Content-Type": "application/json",
    "x-civic-signal-key": key,
  };
}

// ── INBOUND: Receive a lesson pushed FROM Civic Signal ────────────────────
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

  if (!lesson.lesson) throw new Error("lesson field is required");

  incomingLessons.push(lesson);
  if (incomingLessons.length > 100) incomingLessons.splice(0, incomingLessons.length - 100);

  console.log(`[CivicSignal] Lesson received: topic=${lesson.topic} state=${lesson.state} confidence=${lesson.confidence}`);
  return { stored: true, lessonId: lesson.id };
}

// ── Retrieve stored lessons ────────────────────────────────────────────────
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

// ── OUTBOUND: Push Chainweb ROI scenario TO Civic Signal ──────────────────
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
  try {
    const response = await fetch(CIVIC_SIGNAL_PUSH_URL, {
      method: "POST",
      headers: outboundHeaders(),
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
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const result = await response.json().catch(() => ({}));
    console.log("[CivicSignal] Push succeeded:", result);
    return { pushed: true, message: "ROI scenario pushed to Civic Signal adaptation engine" };

  } catch (err: any) {
    console.error("[CivicSignal] Push failed:", err.message);
    return { pushed: false, message: `Push failed: ${err.message}` };
  }
}

// ── OUTBOUND: Pull adaptation lessons FROM Civic Signal ───────────────────
export async function fetchCivicSignalAdaptations(opts: {
  topic: string;
  state?: string;
}): Promise<{ adaptations: any[]; source: string }> {
  try {
    const params = new URLSearchParams({ topic: opts.topic });
    if (opts.state) params.set("state", opts.state);

    const response = await fetch(`${CIVIC_SIGNAL_PULL_URL}?${params}`, {
      headers: outboundHeaders(),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("[CivicSignal] Pull succeeded");
    return {
      adaptations: data.adaptations || data.lessons || data,
      source: "civic_signal_live",
    };

  } catch (err: any) {
    console.error("[CivicSignal] Pull fell back to cached:", err.message);
    const cached = getCivicSignalLessons({ topic: opts.topic, state: opts.state, limit: 5 });
    return {
      adaptations: cached.map(l => ({ lesson: l.lesson, confidence: l.confidence, receivedAt: l.receivedAt })),
      source: "civic_signal_cached_fallback",
    };
  }
}
