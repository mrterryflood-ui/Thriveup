/**
 * Civic Signal Connector — Bidirectional Flow
 * ----------------------------------------------------------------------------
 * ThriveUp ↔ Civic Signal bidirectional data exchange.
 *
 * DIRECTION 1 (Civic Signal → ThriveUp):
 *   Civic Signal pushes policy adaptation lessons via webhook.
 *   POST /api/chainweb/webhook/civic-signal
 *   Lessons stored in memory, injected into Chainweb RAG context.
 *
 * DIRECTION 2 (ThriveUp → Civic Signal):
 *   pushChainwebToCivicSignal() — sends ROI scenario results to their engine.
 *   fetchCivicSignalAdaptations() — pulls policy lessons from their engine.
 *
 * AUTH (outbound — ThriveUp calling Civic Signal):
 *   Header: x-ecosystem-key
 *   Value:  process.env.THRIVEUP_INBOUND_KEY
 *   Base:   process.env.CIVIC_SIGNAL_BASE_URL (https://power2thepeople.net)
 *
 * AUTH (inbound — Civic Signal calling ThriveUp):
 *   Validated against ecosystem_platforms DB (no secret needed; auto from registry)
 * ----------------------------------------------------------------------------
 */

// ── In-memory store for incoming Civic Signal lessons ─────────────────────
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

// ── Shared outbound config ─────────────────────────────────────────────────
function getOutboundConfig(): { baseUrl: string; key: string } | null {
  const baseUrl = process.env.CIVIC_SIGNAL_BASE_URL;
  const key = process.env.THRIVEUP_INBOUND_KEY;
  if (!baseUrl || !key) return null;
  return { baseUrl, key };
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

  console.log(`[CivicSignal] Received lesson: topic=${lesson.topic} state=${lesson.state} confidence=${lesson.confidence}`);
  return { stored: true, lessonId: lesson.id };
}

// ── Retrieve stored lessons (for RAG injection) ────────────────────────────
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
  const cfg = getOutboundConfig();
  if (!cfg) {
    console.log("[CivicSignal] Push skipped — CIVIC_SIGNAL_BASE_URL or THRIVEUP_INBOUND_KEY not set.");
    return { pushed: false, message: "Civic Signal credentials not configured." };
  }

  const endpoints = [
    `${cfg.baseUrl}/api/ecosystem/receive`,
    `${cfg.baseUrl}/api/ingest`,
    `${cfg.baseUrl}/api/roi/ingest`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ecosystem-key": cfg.key,
        },
        body: JSON.stringify({
          source: "thriveup_chainweb",
          sourceVersion: "1.0.0",
          ...payload,
          sentAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        console.log(`[CivicSignal] Push succeeded via ${endpoint}:`, result);
        return { pushed: true, message: `Pushed to Civic Signal via ${endpoint}` };
      }

      // 404 = wrong endpoint, try next; other errors = real failure
      if (response.status !== 404) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("HTTP")) throw err;
      // Network/endpoint error — try next
    }
  }

  console.error("[CivicSignal] Push failed — no valid endpoint found. Contact Civic Signal for their ingest path.");
  return { pushed: false, message: "No valid Civic Signal ingest endpoint found. Confirm endpoint path with Civic Signal." };
}

// ── OUTBOUND: Pull adaptation lessons FROM Civic Signal ───────────────────
export async function fetchCivicSignalAdaptations(opts: {
  topic: string;
  state?: string;
}): Promise<{ adaptations: any[]; source: string }> {
  const cfg = getOutboundConfig();

  if (!cfg) {
    const cached = getCivicSignalLessons({ topic: opts.topic, state: opts.state, limit: 5 });
    return {
      adaptations: cached.map(l => ({ lesson: l.lesson, confidence: l.confidence, receivedAt: l.receivedAt })),
      source: "civic_signal_cached_webhooks",
    };
  }

  const params = new URLSearchParams({ topic: opts.topic });
  if (opts.state) params.set("state", opts.state);

  const endpoints = [
    `${cfg.baseUrl}/api/ecosystem/lessons`,
    `${cfg.baseUrl}/api/lessons`,
    `${cfg.baseUrl}/api/adaptations`,
  ];

  for (const base of endpoints) {
    try {
      const response = await fetch(`${base}?${params}`, {
        headers: { "x-ecosystem-key": cfg.key },
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[CivicSignal] Fetch succeeded via ${base}`);
        return { adaptations: data.adaptations || data.lessons || data, source: "civic_signal_live" };
      }

      if (response.status !== 404) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("HTTP")) break;
    }
  }

  // Fallback to cached webhook lessons
  console.warn("[CivicSignal] Pull fell back to cached lessons.");
  const cached = getCivicSignalLessons({ topic: opts.topic, state: opts.state, limit: 5 });
  return {
    adaptations: cached.map(l => ({ lesson: l.lesson, confidence: l.confidence })),
    source: "civic_signal_cached_fallback",
  };
}
