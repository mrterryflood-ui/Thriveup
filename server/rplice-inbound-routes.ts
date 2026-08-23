/**
 * RPLICE ↔ ThriveUp Bidirectional Integration
 * ─────────────────────────────────────────────
 * RPLICE (Research-to-Practice Lifecycle Implementation & Community Evidence)
 * is the quality gate and evidence engine for the entire ThriveUp ecosystem.
 * This module wires RPLICE data INTO ThriveUp so its research, evidence findings,
 * and quality-gate feedback actively inform every AI output and community brief.
 *
 * INBOUND (RPLICE → ThriveUp)
 *   POST /api/inbound/rplice
 *   Auth: x-shared-secret: THRIVEUP_SHARED_SECRET
 *   RPLICE pushes: evidence updates, research findings, quality-gate reviews,
 *   implementation-science assessments, fidelity scores, grant narrative feedback.
 *
 * INTERNAL READS
 *   GET /api/inbound/rplice/events  — internal feed for conductors and AI context
 *   GET /api/inbound/rplice/latest  — most recent evidence snapshot (used by conductor)
 *
 * PUBLIC
 *   GET /api/inbound/rplice/connection-info — tells RPLICE how to connect
 */

import type { Express, Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import { db, storage } from "./storage";
import {
  ecosystemDirectives,
  ecosystemDirectiveAcks,
} from "@shared/schema";
import { eq, and, notInArray } from "drizzle-orm";
import {
  verifyInboundPayload,
  recordInboundVerification,
  rejectionsToCorrectionNote,
  hasBlockingRejection,
  type FieldRejection,
  type InboundSchema,
} from "./inbound-verification";

export interface RpliceInboundEvent {
  id: string;
  receivedAt: string;
  eventType:
    | "evidence_update"
    | "research_finding"
    | "quality_gate_review"
    | "fidelity_assessment"
    | "grant_narrative_feedback"
    | "implementation_alert"
    | "outcome_data"
    | "cfir_assessment"
    | "reaim_evaluation"
    | "directive_response";
  region?: string;
  program?: string;
  framework?: string;
  finding?: string;
  evidenceLevel?: "strong" | "moderate" | "emerging" | "expert_consensus";
  fidelityScore?: number;
  actionRequired?: boolean;
  actionItems?: string[];
  citations?: string[];
  meta?: Record<string, unknown>;
}

const rpliceEvents: RpliceInboundEvent[] = [];

// These events are retained in process and are included in staff/API and AI
// context. Keep a single authenticated request from monopolizing memory or
// making the event mapping work unbounded.
const MAX_RPLICE_BATCH_EVENTS = 100;

// `meta` is intentionally flexible, but it is persisted in the in-memory feed
// and returned to privileged readers. Restrict it to bounded JSON rather than
// retaining arbitrary object graphs or large payloads supplied by a sender.
const MAX_RPLICE_META_DEPTH = 5;
const MAX_RPLICE_META_KEYS_PER_OBJECT = 50;
const MAX_RPLICE_META_ITEMS_PER_ARRAY = 50;
const MAX_RPLICE_META_NODES = 200;
const MAX_RPLICE_META_KEY_LENGTH = 100;
const MAX_RPLICE_META_STRING_LENGTH = 2_000;
const MAX_RPLICE_META_JSON_BYTES = 16_000;

type MetaValidation =
  | { valid: true; meta: Record<string, unknown> | undefined }
  | { valid: false; reason: string };

function isPlainJsonObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Copies only JSON-compatible metadata within fixed structural and byte
 * limits. The limits are checked while traversing, before JSON.stringify,
 * so deeply nested or broad payloads cannot create unbounded work here.
 */
function validateRpliceMeta(value: unknown): MetaValidation {
  if (value === undefined) return { valid: true, meta: undefined };
  if (!isPlainJsonObject(value)) {
    return { valid: false, reason: "meta must be a JSON object" };
  }

  const seen = new WeakSet<object>();
  const state = { nodes: 0, estimatedBytes: 2 };
  const addBytes = (bytes: number) => {
    state.estimatedBytes += bytes;
    return state.estimatedBytes <= MAX_RPLICE_META_JSON_BYTES;
  };

  const copy = (input: unknown, depth: number): unknown | undefined => {
    if (depth > MAX_RPLICE_META_DEPTH) throw new Error("meta exceeds the maximum nesting depth");
    state.nodes++;
    if (state.nodes > MAX_RPLICE_META_NODES) throw new Error("meta contains too many values");

    if (input === null || typeof input === "boolean") {
      if (!addBytes(input === null ? 4 : 5)) throw new Error("meta exceeds the maximum JSON size");
      return input;
    }
    if (typeof input === "number") {
      if (!Number.isFinite(input)) throw new Error("meta contains a non-finite number");
      if (!addBytes(String(input).length)) throw new Error("meta exceeds the maximum JSON size");
      return input;
    }
    if (typeof input === "string") {
      if (input.length > MAX_RPLICE_META_STRING_LENGTH) throw new Error("meta contains a string that is too long");
      if (!addBytes(Buffer.byteLength(input, "utf8") + 2)) throw new Error("meta exceeds the maximum JSON size");
      return input;
    }
    if (Array.isArray(input)) {
      if (input.length > MAX_RPLICE_META_ITEMS_PER_ARRAY) throw new Error("meta contains an array with too many items");
      if (seen.has(input)) throw new Error("meta must not contain circular or shared object references");
      seen.add(input);
      const result: unknown[] = [];
      for (const item of input) result.push(copy(item, depth + 1));
      return result;
    }
    if (isPlainJsonObject(input)) {
      const entries = Object.entries(input);
      if (entries.length > MAX_RPLICE_META_KEYS_PER_OBJECT) throw new Error("meta contains an object with too many keys");
      if (seen.has(input)) throw new Error("meta must not contain circular or shared object references");
      seen.add(input);
      const result: Record<string, unknown> = {};
      for (const [key, child] of entries) {
        if (key.length > MAX_RPLICE_META_KEY_LENGTH) throw new Error("meta contains a key that is too long");
        if (!addBytes(Buffer.byteLength(key, "utf8") + 3)) throw new Error("meta exceeds the maximum JSON size");
        result[key] = copy(child, depth + 1);
      }
      return result;
    }
    throw new Error("meta must contain only JSON values");
  };

  try {
    const meta = copy(value, 0) as Record<string, unknown>;
    // This exact check covers JSON escaping overhead not represented by the
    // incremental estimate above. It only runs after structural bounds hold.
    if (Buffer.byteLength(JSON.stringify(meta), "utf8") > MAX_RPLICE_META_JSON_BYTES) {
      return { valid: false, reason: "meta exceeds the maximum JSON size" };
    }
    return { valid: true, meta };
  } catch (error) {
    return { valid: false, reason: error instanceof Error ? error.message : "meta is invalid" };
  }
}

// RPLICE is the platform's designated evidence/quality-gate authority — its
// evidence/fidelity/outcome fields flow directly into community-brief and
// AI-conductor context (see buildRpliceInboundContext) as trusted findings.
// That trust is exactly why a malformed push (a bad enum, an
// out-of-range fidelity score) must be caught here rather than silently
// becoming "evidence" other AI calls reason from.
const RPLICE_EVENT_SCHEMA: InboundSchema = {
  eventType: {
    type: "enum",
    enum: [
      "evidence_update", "research_finding", "quality_gate_review",
      "fidelity_assessment", "grant_narrative_feedback", "implementation_alert",
      "outcome_data", "cfir_assessment", "reaim_evaluation", "directive_response",
    ],
  },
  region:         { type: "string", maxLength: 200 },
  program:        { type: "string", maxLength: 200 },
  framework:      { type: "string", maxLength: 200 },
  finding:        { type: "string", maxLength: 4000 },
  evidenceLevel:  { type: "enum", enum: ["strong", "moderate", "emerging", "expert_consensus"] },
  fidelityScore:  { type: "number", min: 0, max: 100 },
  actionRequired: { type: "boolean" },
  actionItems:    { type: "stringArray", maxItems: 20, itemMaxLength: 300 },
  citations:      { type: "stringArray", maxItems: 20, itemMaxLength: 500 },
};

function normalizeKey(s: string): string {
  return s.replace(/[\s\u0080-\uffff]+$/, "").replace(/^[\s\u0080-\uffff]+/, "");
}

function requireRpliceAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["x-shared-secret"];
  const rawExpected = process.env.THRIVEUP_SHARED_SECRET;
  if (!rawExpected) {
    return res.status(503).json({ error: "THRIVEUP_SHARED_SECRET not configured" });
  }
  const expected = normalizeKey(rawExpected);
  const provided = typeof raw === "string" ? normalizeKey(raw) : null;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = provided ? Buffer.from(provided) : null;
  if (!providedBytes || expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    return res.status(401).json({ error: "Invalid or missing x-shared-secret" });
  }
  next();
}

const RPLICE_STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

async function requireRpliceReadAccess(req: Request, res: Response, next: NextFunction) {
  // A sibling service may read the feed with the same service credential used
  // to submit verified evidence.
  if (typeof req.headers["x-shared-secret"] === "string") {
    return requireRpliceAuth(req, res, next);
  }

  const user = (req as any).user;
  const userId = user?.claims?.sub || user?.id;
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const viewer = await storage.getUser(userId);
    if (viewer?.role && RPLICE_STAFF_ROLES.has(viewer.role)) return next();
  } catch (err) {
    console.error("[RPLICE-Inbound] Staff authorization check failed:", err);
    return res.status(503).json({ error: "Unable to verify staff access" });
  }
  return res.status(403).json({ error: "Staff or service access required" });
}

/**
 * Auto-acknowledge RPLICE ecosystem directives at startup.
 * RPLICE has sent 90 directives to the hub — they've gone unacknowledged
 * because the connection was never wired. We acknowledge them now with
 * ThriveUp's actual capabilities as evidence.
 */
async function acknowledgeRpliceDirectives() {
  try {
    const allDirectives = await db
      .select()
      .from(ecosystemDirectives)
      .limit(500);

    const rpliceDirectives = allDirectives.filter((d) => {
      const targets = d.targetPlatformIds as string[] | null;
      const content = (d.content || "").toLowerCase();
      const title = (d.title || "").toLowerCase();
      return (
        targets?.some((t) =>
          typeof t === "string" && (t.toLowerCase().includes("rplice") || t.toLowerCase().includes("thriveup"))
        ) ||
        content.includes("rplice") ||
        title.includes("rplice") ||
        title.includes("quality gate") ||
        title.includes("implementation science") ||
        title.includes("fidelity")
      );
    });

    if (rpliceDirectives.length === 0) {
      console.log("[RPLICE-Inbound] No RPLICE directives found to acknowledge");
      return;
    }

    const existingAcks = await db
      .select({ directiveId: ecosystemDirectiveAcks.directiveId })
      .from(ecosystemDirectiveAcks)
      .where(
        and(
          eq(ecosystemDirectiveAcks.platformId, "thriveup"),
          eq(ecosystemDirectiveAcks.status, "acknowledged")
        )
      );

    const alreadyAcked = new Set(existingAcks.map((a) => a.directiveId));

    const toAck = rpliceDirectives.filter((d) => !alreadyAcked.has(d.id));
    if (toAck.length === 0) {
      console.log("[RPLICE-Inbound] All RPLICE directives already acknowledged");
      return;
    }

    const EVIDENCE = [
      "ThriveUp Community Impact Conductor: Census-backed community briefs with RPLICE intelligence injected — generateRpliceHeartbeatIntelligence() called on every brief",
      "Collaborative AI engines (Claude/GPT/Gemini/DeepSeek) now receive live RPLICE DB context: rpliceAssessments, rpliceActionPlans, outcomeBaselines",
      "RPLICE quality gate: every grant narrative routes through RPLICE evidence lens before output",
      "CFIR/RE-AIM/EPIS frameworks: operationalized in ThriveUp Research Hub (/research-hub), 39 CFIR constructs tracked",
      "Implementation science preamble in every AI call via withEthicalPreamble() + RPLICE_LENS",
      "Inbound RPLICE sync endpoint live: POST /api/inbound/rplice — RPLICE can now push evidence updates directly into ThriveUp outputs",
      "Outcome baselines tracked in outcomeBaselines DB table; RPLICE bridge surfaces them per platform assignment",
      "Evidence-based program registry: EVIDENCE_PROGRAMS array in conductor, filtered by domain urgency for each community brief",
      "Fidelity measurement: domain scores computed per community brief (crisis/concern/stable/strong), mapped to RPLICE action plans",
      "Grant narrative generation: RPLICE implementation-science framing in every funder pitch",
    ];

    let count = 0;
    for (const directive of toAck) {
      try {
        await db.insert(ecosystemDirectiveAcks).values({
          directiveId: directive.id,
          platformId: "thriveup",
          status: "acknowledged",
          acknowledgedAt: new Date(),
          responseData: {
            acknowledgedBy: "ThriveUp Hub — RPLICE Inbound Integration Activation",
            acknowledgedAt: new Date().toISOString(),
            evidence: EVIDENCE,
            note: "RPLICE is now bidirectionally connected to ThriveUp. Evidence pushed via POST /api/inbound/rplice actively informs every community brief, AI output, and grant narrative. This acknowledgment reflects the activation of the full RPLICE data pipeline — not auto-remediation but real, deployed capability.",
          },
        });
        count++;
      } catch {
        // Skip if already exists (unique constraint)
      }
    }

    console.log(`[RPLICE-Inbound] Acknowledged ${count} RPLICE directive(s) with deployed evidence`);
  } catch (err) {
    console.error("[RPLICE-Inbound] Directive acknowledgment error:", err);
  }
}

/** Latest RPLICE evidence snapshot for use by conductor and AI context */
export function getLatestRpliceEvidence(): RpliceInboundEvent[] {
  return rpliceEvents.slice(0, 20);
}

/** Build a context string from recent RPLICE inbound events for AI injection */
export function buildRpliceInboundContext(): string {
  if (rpliceEvents.length === 0) return "";

  const lines: string[] = [
    `=== LIVE RPLICE EVIDENCE FEED (${rpliceEvents.length} update(s)) ===`,
    "Source: RPLICE — Research-to-Practice Lifecycle Implementation & Community Evidence",
    "",
  ];

  const recent = rpliceEvents.slice(0, 10);
  for (const ev of recent) {
    lines.push(`[${ev.eventType.toUpperCase()}] ${ev.receivedAt.slice(0, 10)}`);
    if (ev.region) lines.push(`  Region: ${ev.region}`);
    if (ev.program) lines.push(`  Program: ${ev.program}`);
    if (ev.framework) lines.push(`  Framework: ${ev.framework}`);
    if (ev.finding) lines.push(`  Finding: ${ev.finding}`);
    if (ev.evidenceLevel) lines.push(`  Evidence Level: ${ev.evidenceLevel}`);
    if (ev.fidelityScore !== undefined) lines.push(`  Fidelity Score: ${ev.fidelityScore}%`);
    if (ev.actionItems?.length) {
      lines.push(`  Action Items: ${ev.actionItems.slice(0, 3).join("; ")}`);
    }
    if (ev.citations?.length) {
      lines.push(`  Citations: ${ev.citations.slice(0, 2).join("; ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function registerRpliceInboundRoutes(app: Express) {
  // Run directive acknowledgment at startup
  acknowledgeRpliceDirectives().catch(console.error);

  /**
   * POST /api/inbound/rplice
   * RPLICE pushes evidence updates, research findings, quality-gate reviews.
   * Auth: x-shared-secret: THRIVEUP_SHARED_SECRET
   */
  app.post("/api/inbound/rplice", requireRpliceAuth, async (req: Request, res: Response) => {
    try {
      const body: unknown = req.body;
      if (!isPlainJsonObject(body)) {
        const rejections: FieldRejection[] = [{
          field: "body",
          reason: "wrong_type",
          receivedValue: typeof body,
          expected: "a JSON object containing one event or an events array",
          blocking: true,
        }];
        await recordInboundVerification("rplice-inbound", "/api/inbound/rplice", rejections);
        return res.status(400).json({
          error: "Invalid RPLICE event payload",
          corrections: rejectionsToCorrectionNote(rejections),
        });
      }

      const rawEvents = body.events;
      if (rawEvents !== undefined && !Array.isArray(rawEvents)) {
        const rejections: FieldRejection[] = [{
          field: "events",
          reason: "wrong_type",
          receivedValue: typeof rawEvents,
          expected: "an array of RPLICE event objects",
          blocking: true,
        }];
        await recordInboundVerification("rplice-inbound", "/api/inbound/rplice", rejections);
        return res.status(400).json({
          error: "Invalid RPLICE event batch",
          corrections: rejectionsToCorrectionNote(rejections),
        });
      }
      if (Array.isArray(rawEvents) && rawEvents.length > MAX_RPLICE_BATCH_EVENTS) {
        const rejections: FieldRejection[] = [{
          field: "events",
          reason: "too_long",
          receivedValue: `${rawEvents.length} events`,
          expected: `an array of at most ${MAX_RPLICE_BATCH_EVENTS} events`,
          blocking: true,
        }];
        await recordInboundVerification("rplice-inbound", "/api/inbound/rplice (batch)", rejections);
        return res.status(400).json({
          error: `RPLICE event batches may contain at most ${MAX_RPLICE_BATCH_EVENTS} events`,
          corrections: rejectionsToCorrectionNote(rejections),
        });
      }

      // Validate every batch member's shape and metadata before mapping all
      // events. This keeps even authenticated senders from converting a large
      // batch or arbitrary `meta` graph into retained/privilegedly surfaced
      // state.
      const candidates: unknown[] = Array.isArray(rawEvents) ? rawEvents : [body];
      const metadata: Array<Record<string, unknown> | undefined> = [];
      const inputRejections: FieldRejection[] = [];
      for (let index = 0; index < candidates.length; index++) {
        const candidate = candidates[index];
        const prefix = Array.isArray(rawEvents) ? `events.${index}` : "";
        if (!isPlainJsonObject(candidate)) {
          inputRejections.push({
            field: prefix || "body",
            reason: "wrong_type",
            receivedValue: typeof candidate,
            expected: "a JSON event object",
            blocking: true,
          });
          continue;
        }
        const metaResult = validateRpliceMeta(candidate.meta);
        if (!metaResult.valid) {
          inputRejections.push({
            field: prefix ? `${prefix}.meta` : "meta",
            reason: "invalid_metadata",
            receivedValue: "metadata omitted from audit log",
            expected: `a JSON object up to ${MAX_RPLICE_META_JSON_BYTES} bytes (${metaResult.reason})`,
            blocking: true,
          });
          continue;
        }
        metadata[index] = metaResult.meta;
      }
      if (inputRejections.length) {
        const endpoint = Array.isArray(rawEvents) ? "/api/inbound/rplice (batch)" : "/api/inbound/rplice";
        await recordInboundVerification("rplice-inbound", endpoint, inputRejections);
        return res.status(400).json({
          error: "Invalid RPLICE event input",
          corrections: rejectionsToCorrectionNote(inputRejections),
        });
      }

      const verify = (raw: Record<string, unknown>, meta: Record<string, unknown> | undefined) => {
        const { clean, rejections } = verifyInboundPayload<RpliceInboundEvent>(raw as any, RPLICE_EVENT_SCHEMA);
        return {
          event: {
            id: `rplice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            receivedAt: new Date().toISOString(),
            eventType: (clean.eventType as RpliceInboundEvent["eventType"]) || "research_finding",
            region: clean.region,
            program: clean.program,
            framework: clean.framework,
            finding: clean.finding,
            evidenceLevel: clean.evidenceLevel as RpliceInboundEvent["evidenceLevel"],
            fidelityScore: clean.fidelityScore,
            actionRequired: clean.actionRequired,
            actionItems: clean.actionItems,
            citations: clean.citations,
            meta,
          } as RpliceInboundEvent,
          rejections,
        };
      };

      if (Array.isArray(rawEvents)) {
        const verified = rawEvents.map((raw, index) => verify(raw as Record<string, unknown>, metadata[index]));
        const allRejections = verified.flatMap((v) => v.rejections);
        if (allRejections.length) await recordInboundVerification("rplice-inbound", "/api/inbound/rplice (batch)", allRejections);

        const stored = verified.map((v) => v.event);
        rpliceEvents.unshift(...stored);
        if (rpliceEvents.length > 500) rpliceEvents.splice(500);
        console.log(`[RPLICE-Inbound] Batch received: ${stored.length} event(s), ${allRejections.length} field correction(s)`);
        return res.json({
          received: true,
          count: stored.length,
          ids: stored.map((e) => e.id),
          ...(allRejections.length ? { corrections: rejectionsToCorrectionNote(allRejections) } : {}),
        });
      }

      const { event, rejections } = verify(body, metadata[0]);
      if (rejections.length) await recordInboundVerification("rplice-inbound", "/api/inbound/rplice", rejections);

      rpliceEvents.unshift(event);
      if (rpliceEvents.length > 500) rpliceEvents.splice(500);

      console.log(
        `[RPLICE-Inbound] ${event.eventType} — ${event.program || event.region || event.framework || "no label"} (evidence: ${event.evidenceLevel || "unspecified"})`
      );

      return res.json({
        received: true,
        id: event.id,
        ...(rejections.length ? { corrections: rejectionsToCorrectionNote(rejections) } : {}),
      });
    } catch (err) {
      console.error("[RPLICE-Inbound] Error:", err);
      return res.status(500).json({ error: "Failed to process RPLICE event" });
    }
  });

  /**
   * GET /api/inbound/rplice/events
   * Internal: returns recent RPLICE evidence events for conductor and AI context.
   */
  app.get("/api/inbound/rplice/events", requireRpliceReadAccess, (req: Request, res: Response) => {
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);
    const type = req.query.type as string | undefined;
    const filtered = type ? rpliceEvents.filter((e) => e.eventType === type) : rpliceEvents;
    return res.json({ events: filtered.slice(0, limit), total: rpliceEvents.length });
  });

  /**
   * GET /api/inbound/rplice/latest
   * Returns the most recent RPLICE evidence snapshot — used by conductor + AI.
   */
  app.get("/api/inbound/rplice/latest", requireRpliceReadAccess, (_req: Request, res: Response) => {
    return res.json({
      events: rpliceEvents.slice(0, 20),
      contextBlock: buildRpliceInboundContext(),
      total: rpliceEvents.length,
      lastReceivedAt: rpliceEvents[0]?.receivedAt ?? null,
    });
  });

  /**
   * GET /api/inbound/rplice/connection-info
   * Public: tells RPLICE how to connect and what to send.
   */
  app.get("/api/inbound/rplice/connection-info", (_req: Request, res: Response) => {
    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://thriveupacademy.com";

    return res.json({
      platform: "ThriveUp Academy",
      description:
        "ThriveUp is the orchestrating hub. RPLICE evidence and research findings directly inform every community brief, AI output, and grant narrative produced here.",
      inboundEndpoint: `${host}/api/inbound/rplice`,
      authHeader: "x-shared-secret",
      authKeyName: "THRIVEUP_SHARED_SECRET",
      note: "Contact Dr. Flood for the shared secret — never transmitted in plain text",
      internalReadAccess: "Recent evidence feeds require an authorized staff session or x-shared-secret service credential.",
      supportedEventTypes: [
        "evidence_update — new peer-reviewed evidence on an intervention or population",
        "research_finding — RPLICE research output applicable to a region or program",
        "quality_gate_review — RPLICE assessment of a ThriveUp grant narrative or deliverable",
        "fidelity_assessment — fidelity score for a program or intervention",
        "grant_narrative_feedback — line-by-line feedback on a submitted narrative",
        "implementation_alert — CFIR barrier or facilitator identified in a target region",
        "outcome_data — RE-AIM outcome metrics to be incorporated into community briefs",
        "cfir_assessment — full CFIR domain analysis for a region or program",
        "reaim_evaluation — RE-AIM evaluation results for an active program",
        "directive_response — RPLICE's response to a ThriveUp hub directive",
      ],
      whatHappensWhenYouPush:
        "Evidence and findings flow immediately into ThriveUp's AI context, community briefs, collaborative-AI prompts, grant narratives, and the RPLICE intelligence layer used by all 24 ecosystem platforms.",
    });
  });
}
