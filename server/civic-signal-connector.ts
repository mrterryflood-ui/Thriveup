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
 *   Auth: x-civic-signal-key: process.env.POWER2PEOPLE_ISSUED_KEY
 * ----------------------------------------------------------------------------
 */

import { verifyInboundPayload, recordInboundVerification, rejectionsToCorrectionNote, hasBlockingRejection, type InboundSchema, type CorrectionNote } from "./inbound-verification";

const CIVIC_SIGNAL_BASE_URL = process.env.CIVIC_SIGNAL_BASE_URL || "https://power2thepeople.net";
const CIVIC_SIGNAL_PUSH_URL = `${CIVIC_SIGNAL_BASE_URL}/api/thriveup/ingest`;
const CIVIC_SIGNAL_PULL_URL = `${CIVIC_SIGNAL_BASE_URL}/api/thriveup/lessons`;

// Civic Signal is a partner AI system, not our own form — its lesson/topic/
// confidence/programIds/roiImplication fields are quoted directly into RAG
// context (see getCivicSignalRAGContext) that other AI calls treat as
// ground truth. Validate before storage, not after, so a malformed or
// out-of-range field never gets a chance to enter that context.
const CIVIC_SIGNAL_LESSON_SCHEMA: InboundSchema = {
  lesson:         { type: "string", required: true, maxLength: 4000 },
  topic:          { type: "string", maxLength: 100 },
  state:          { type: "string", maxLength: 2 },
  source:         { type: "string", maxLength: 100 },
  confidence:     { type: "enum", enum: ["low", "moderate", "high"] },
  programIds:     { type: "stringArray", maxItems: 20, itemMaxLength: 100 },
  roiImplication: { type: "string", maxLength: 500 },
};

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
  const raw = process.env.POWER2PEOPLE_ISSUED_KEY;
  if (!raw) throw new Error("POWER2PEOPLE_ISSUED_KEY secret not set");
  // Defensive: HTTP header values must be ISO-8859-1/ASCII-range. Secret
  // managers/copy-paste flows can silently append stray non-ASCII
  // characters (e.g. a trailing em dash, U+2014) which fetch() rejects with
  // an opaque "Cannot convert argument to a ByteString" error that looks
  // like a network failure, not a value-formatting one. Strip anything
  // outside the printable ASCII range rather than fail confusingly.
  const key = raw.trim().replace(/[^\x20-\x7E]/g, "");
  if (!key) throw new Error("POWER2PEOPLE_ISSUED_KEY secret contains no valid ASCII characters after sanitization");
  return {
    "Content-Type": "application/json",
    "x-civic-signal-key": key,
  };
}

// ── INBOUND: Receive a lesson pushed FROM Civic Signal ────────────────────
export async function receiveCivicSignalLesson(
  payload: Partial<CivicSignalLesson>
): Promise<{ stored: boolean; lessonId: string; corrections?: CorrectionNote[] }> {
  const { clean, rejections } = verifyInboundPayload<CivicSignalLesson>(payload as any, CIVIC_SIGNAL_LESSON_SCHEMA);
  await recordInboundVerification("civic-signal-webhook", "receiveCivicSignalLesson", rejections);

  if (hasBlockingRejection(rejections)) {
    // No `lesson` text (or it's not a usable string) — nothing safe to
    // store. Tell Civic Signal exactly what was wrong instead of silently
    // dropping the push or throwing an opaque 500.
    const corrections = rejectionsToCorrectionNote(rejections);
    throw Object.assign(new Error("Payload rejected: " + corrections.map(c => `${c.field}: ${c.problem}`).join("; ")), { corrections });
  }

  const lesson: CivicSignalLesson = {
    id: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lesson: clean.lesson!,
    topic: clean.topic || "general",
    state: clean.state || "US",
    source: clean.source || "civic_signal",
    confidence: clean.confidence || "moderate",
    receivedAt: new Date().toISOString(),
    programIds: clean.programIds,
    roiImplication: clean.roiImplication,
  };

  incomingLessons.push(lesson);
  if (incomingLessons.length > 100) incomingLessons.splice(0, incomingLessons.length - 100);

  console.log(`[CivicSignal] Lesson received: topic=${lesson.topic} state=${lesson.state} confidence=${lesson.confidence}`);
  const corrections = rejectionsToCorrectionNote(rejections);
  return { stored: true, lessonId: lesson.id, ...(corrections.length ? { corrections } : {}) };
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

// ── OUTBOUND: Push an Equity-Loss Engine result TO Civic Signal ───────────
// Reuses the same ingest endpoint/schema convention as the Chainweb ROI
// push (Civic Signal ingests "evidence events" generically) — this is a
// distinct function, not a call-through, so the equity-loss payload shape
// can evolve independently of the ROI scenario shape.
export async function pushEquityLossToCivicSignal(payload: {
  countyFips: string;
  countyName: string;
  state: string;
  frame: string;
  overallLossPct: number;
  referenceLossPct: number | null;
  divergenceFromReferencePct: number | null;
  tier: string;
  assumptionText: string | null;
}): Promise<{ pushed: boolean; message: string }> {
  try {
    const response = await fetch(CIVIC_SIGNAL_PUSH_URL, {
      method: "POST",
      headers: outboundHeaders(),
      body: JSON.stringify({
        source: "thriveup_equity_loss_engine",
        sourceVersion: "0.1.0",
        eventType: "equity_loss_result",
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
    console.log("[CivicSignal] Equity-loss push succeeded:", result);
    return { pushed: true, message: "Equity-loss result pushed to Civic Signal" };
  } catch (err: any) {
    console.error("[CivicSignal] Equity-loss push failed:", err.message);
    return { pushed: false, message: `Push failed: ${err.message}` };
  }
}

// ── Live connection status check (does not mutate state; safe to poll) ───
export async function checkCivicSignalConnection(): Promise<{
  outboundReachable: boolean;
  outboundDetail: string;
  inboundLessonsStored: number;
  inboundAuthenticationConfigured: boolean;
}> {
  let outboundReachable = false;
  let outboundDetail = "not checked";
  try {
    const params = new URLSearchParams({ topic: "_connection_probe" });
    const response = await fetch(`${CIVIC_SIGNAL_PULL_URL}?${params}`, {
      headers: outboundHeaders(),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) {
      outboundReachable = true;
      outboundDetail = "reachable and authenticated";
    } else {
      outboundDetail = `HTTP ${response.status}: ${await response.text().catch(() => "")}`.slice(0, 300);
    }
  } catch (err: any) {
    outboundDetail = err.message;
  }
  return {
    outboundReachable,
    outboundDetail,
    inboundLessonsStored: incomingLessons.length,
    inboundAuthenticationConfigured: Boolean(process.env.THRIVEUP_ISSUED_KEY),
  };
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
    const rawAdaptations: any[] = Array.isArray(data.adaptations || data.lessons || data)
      ? (data.adaptations || data.lessons || data)
      : [];
    // Same schema as an inbound-pushed lesson — a pull response is just as
    // untrusted as a webhook push, and these values feed the same RAG
    // context downstream. Rows that fail validation are dropped (not
    // stored/quoted), not coerced.
    const validated = rawAdaptations.map((a) => {
      const { clean, rejections } = verifyInboundPayload<any>(a, CIVIC_SIGNAL_LESSON_SCHEMA);
      if (rejections.length) void recordInboundVerification("civic-signal-pull", "fetchCivicSignalAdaptations", rejections);
      return { ok: !hasBlockingRejection(rejections), clean, original: a };
    });
    return {
      adaptations: validated.filter((v) => v.ok).map((v) => ({ ...v.original, ...v.clean })),
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
