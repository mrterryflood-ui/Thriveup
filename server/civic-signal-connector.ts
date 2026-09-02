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

import { createHash, randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { civicSignalLessons } from "@shared/schema";
import { db } from "./storage";
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

// ── Durable store plus bounded hot cache for incoming Civic Signal lessons ──
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
  contentHash: string;
}

type VerifiedLessonFields = Omit<CivicSignalLesson, "id" | "receivedAt" | "contentHash">;

function canonicalLessonFields(fields: VerifiedLessonFields): string {
  return JSON.stringify({
    lesson: fields.lesson,
    topic: fields.topic,
    state: fields.state,
    source: fields.source,
    confidence: fields.confidence,
    programIds: fields.programIds ?? null,
    roiImplication: fields.roiImplication ?? null,
  });
}

function lessonContentHash(fields: VerifiedLessonFields): string {
  return createHash("sha256").update(canonicalLessonFields(fields)).digest("hex");
}

function toLessonFields(payload: Partial<CivicSignalLesson>): VerifiedLessonFields {
  return {
    lesson: String(payload.lesson ?? ""),
    topic: String(payload.topic || "general").trim().slice(0, 100) || "general",
    state: String(payload.state || "US").trim().toUpperCase().slice(0, 2) || "US",
    source: String(payload.source || "civic_signal").trim().slice(0, 100) || "civic_signal",
    confidence: String(payload.confidence || "moderate"),
    programIds: Array.isArray(payload.programIds) ? payload.programIds : undefined,
    roiImplication: payload.roiImplication || undefined,
  };
}

function rowToLesson(row: typeof civicSignalLessons.$inferSelect): CivicSignalLesson {
  return {
    id: row.id,
    lesson: row.lesson,
    topic: row.topic,
    state: row.state,
    source: row.source,
    confidence: row.confidence,
    receivedAt: (row.receivedAt ?? new Date()).toISOString(),
    programIds: row.programIds ?? undefined,
    roiImplication: row.roiImplication ?? undefined,
    contentHash: row.contentHash,
  };
}

function rememberLesson(lesson: CivicSignalLesson): void {
  const existingIndex = incomingLessons.findIndex((item) => item.contentHash === lesson.contentHash);
  if (existingIndex >= 0) incomingLessons.splice(existingIndex, 1);
  incomingLessons.push(lesson);
  if (incomingLessons.length > 100) incomingLessons.splice(0, incomingLessons.length - 100);
}

async function persistVerifiedLesson(fields: VerifiedLessonFields): Promise<{ lesson: CivicSignalLesson; inserted: boolean }> {
  const contentHash = lessonContentHash(fields);
  const insertedRows = await db.insert(civicSignalLessons).values({
    id: randomUUID(),
    ...fields,
    contentHash,
    receivedAt: new Date(),
  }).onConflictDoNothing({ target: civicSignalLessons.contentHash }).returning();

  if (insertedRows[0]) {
    const lesson = rowToLesson(insertedRows[0]);
    rememberLesson(lesson);
    return { lesson, inserted: true };
  }

  const [existing] = await db.select().from(civicSignalLessons)
    .where(eq(civicSignalLessons.contentHash, contentHash))
    .limit(1);
  if (!existing) {
    throw new Error("Civic Signal lesson conflict did not return the existing row");
  }
  const lesson = rowToLesson(existing);
  rememberLesson(lesson);
  return { lesson, inserted: false };
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

  const { lesson, inserted } = await persistVerifiedLesson(toLessonFields(clean));

  console.log(`[CivicSignal] Lesson received: topic=${lesson.topic} state=${lesson.state} confidence=${lesson.confidence}`);
  const corrections = rejectionsToCorrectionNote(rejections);
  return { stored: inserted, lessonId: lesson.id, ...(corrections.length ? { corrections } : {}) };
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

/** Durable source of truth for context and operator-facing lesson reads. */
export async function getCivicSignalLessonsAsync(opts?: {
  topic?: string;
  state?: string;
  limit?: number;
}): Promise<CivicSignalLesson[]> {
  const rows = await db.select().from(civicSignalLessons)
    .orderBy(desc(civicSignalLessons.receivedAt))
    .limit(100);
  const topic = opts?.topic?.toLowerCase();
  const state = opts?.state?.toUpperCase();
  const lessons = rows.map(rowToLesson).filter((lesson) => {
    const topicMatches = !topic || lesson.topic.toLowerCase().includes(topic);
    const stateMatches = !state || lesson.state === "US" || lesson.state === state;
    return topicMatches && stateMatches;
  }).slice(0, opts?.limit || 10);
  lessons.forEach(rememberLesson);
  return lessons;
}

// ── Format lessons as RAG context paragraph ───────────────────────────────
export function formatCivicSignalRAGContext(lessons: CivicSignalLesson[], sourceNote?: string): string {
  if (!lessons.length) return "";

  const lines = [
    "## CIVIC SIGNAL — PARTNER POLICY ADAPTATION INTELLIGENCE",
    "Evidence class: partner-supplied adaptation lesson. Do not restate as a local observed measure.",
    sourceNote ? `Availability: ${sourceNote}` : "",
    "Use these lessons to shape questions, options, and implementation choices; preserve the source and confidence label.",
    "",
  ];
  for (const l of lessons) {
    lines.push(`**${l.topic.toUpperCase()} (${l.state}) — ${l.confidence} confidence**`);
    lines.push(l.lesson);
    if (l.roiImplication) lines.push(`ROI implication: ${l.roiImplication}`);
    lines.push(`Source: ${l.source} | Received: ${l.receivedAt.slice(0, 10)}`);
    lines.push("");
  }
  return lines.join("\n");
}

export async function getCivicSignalRAGContextAsync(opts?: {
  topic?: string;
  state?: string;
  pullLive?: boolean;
}): Promise<string> {
  let availability = "durable verified lessons";
  if (opts?.pullLive && process.env.POWER2PEOPLE_ISSUED_KEY) {
    const pulled = await fetchCivicSignalAdaptations({
      topic: opts.topic || "general",
      state: opts.state,
    });
    if (pulled.source === "civic_signal_live") {
      availability = "live Civic Signal pull plus durable verified lessons";
    } else if (pulled.source === "civic_signal_cached_fallback") {
      availability = "durable cached lessons; live Civic Signal pull unavailable";
    } else {
      availability = "Civic Signal unavailable; no partner lesson was invented";
    }
  }

  try {
    const lessons = await getCivicSignalLessonsAsync({
      topic: opts?.topic,
      state: opts?.state,
      limit: 5,
    });
    return formatCivicSignalRAGContext(lessons, availability);
  } catch (err) {
    console.error("[CivicSignal] Durable lesson read failed:", err instanceof Error ? err.message : String(err));
    const cached = getCivicSignalLessons({ topic: opts?.topic, state: opts?.state, limit: 5 });
    return formatCivicSignalRAGContext(
      cached,
      cached.length
        ? "durable lesson store unavailable; using explicitly labeled process cache"
        : "durable lesson store unavailable; no partner lesson was invented",
    );
  }
}

/** Compatibility helper for callers that only have synchronous cache access. */
export function getCivicSignalRAGContext(topic?: string, state?: string): string {
  return formatCivicSignalRAGContext(
    getCivicSignalLessons({ topic, state, limit: 5 }),
    "process cache only; use getCivicSignalRAGContextAsync for durable context",
  );
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
  const durableLessons = await getCivicSignalLessonsAsync({ limit: 100 });
  return {
    outboundReachable,
    outboundDetail,
    inboundLessonsStored: durableLessons.length,
    inboundAuthenticationConfigured: Boolean(process.env.THRIVEUP_ISSUED_KEY),
  };
}

// ── OUTBOUND: Pull adaptation lessons FROM Civic Signal ───────────────────
const LIVE_PULL_TTL_MS = 5 * 60 * 1000;
const livePullCache = new Map<string, { expiresAt: number; result: { adaptations: any[]; source: string } }>();
const livePullInFlight = new Map<string, Promise<{ adaptations: any[]; source: string }>>();

export async function fetchCivicSignalAdaptations(opts: {
  topic: string;
  state?: string;
}): Promise<{ adaptations: any[]; source: string }> {
  const key = `${opts.topic.toLowerCase()}:${(opts.state || "US").toUpperCase()}`;
  const cachedLive = livePullCache.get(key);
  if (cachedLive && cachedLive.expiresAt > Date.now()) return cachedLive.result;
  const running = livePullInFlight.get(key);
  if (running) return running;

  const promise = (async () => {
    try {
      const params = new URLSearchParams({ topic: opts.topic });
      if (opts.state) params.set("state", opts.state);

      const response = await fetch(`${CIVIC_SIGNAL_PULL_URL}?${params}`, {
        headers: outboundHeaders(),
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log("[CivicSignal] Pull succeeded");
      const rawAdaptations: any[] = Array.isArray(data.adaptations || data.lessons || data)
        ? (data.adaptations || data.lessons || data)
        : [];
      // Same schema as an inbound-pushed lesson — a pull response is just as
      // untrusted as a webhook push. Only validated and durably persisted
      // lessons are allowed into the shared context.
      const adaptations: any[] = [];
      for (const original of rawAdaptations) {
        const { clean, rejections } = verifyInboundPayload<any>(original, CIVIC_SIGNAL_LESSON_SCHEMA);
        if (rejections.length) {
          await recordInboundVerification("civic-signal-pull", "fetchCivicSignalAdaptations", rejections);
        }
        if (hasBlockingRejection(rejections)) continue;
        try {
          const { lesson } = await persistVerifiedLesson(toLessonFields(clean));
          adaptations.push({
            ...original,
            ...clean,
            id: lesson.id,
            receivedAt: lesson.receivedAt,
            contentHash: lesson.contentHash,
          });
        } catch (err) {
          console.error("[CivicSignal] Validated pull could not be persisted:", err instanceof Error ? err.message : String(err));
        }
      }
      const result = { adaptations, source: "civic_signal_live" };
      livePullCache.set(key, { expiresAt: Date.now() + LIVE_PULL_TTL_MS, result });
      return result;
    } catch (err: any) {
      console.error("[CivicSignal] Pull fell back to durable cache:", err.message);
      const cached = await getCivicSignalLessonsAsync({ topic: opts.topic, state: opts.state, limit: 5 }).catch((readErr) => {
        console.error("[CivicSignal] Durable fallback read failed:", readErr instanceof Error ? readErr.message : String(readErr));
        return [];
      });
      const result = {
        adaptations: cached.map((lesson) => ({
          id: lesson.id,
          lesson: lesson.lesson,
          topic: lesson.topic,
          state: lesson.state,
          source: lesson.source,
          confidence: lesson.confidence,
          receivedAt: lesson.receivedAt,
          contentHash: lesson.contentHash,
          ...(lesson.roiImplication ? { roiImplication: lesson.roiImplication } : {}),
        })),
        source: "civic_signal_cached_fallback",
      };
      livePullCache.set(key, { expiresAt: Date.now() + LIVE_PULL_TTL_MS, result });
      return result;
    } finally {
      livePullInFlight.delete(key);
    }
  })();
  livePullInFlight.set(key, promise);
  return promise;
}
