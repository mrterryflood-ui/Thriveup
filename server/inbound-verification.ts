/**
 * Inbound Payload Verification
 * ----------------------------------------------------------------------------
 * A single, reusable, non-AI (mechanical) verification engine for data
 * received FROM other AI systems and partner platforms — the AI-to-AI /
 * partner-inbound analogue of `ai-claim-grounding.ts` (which grounds
 * numbers OUTBOUND in narrative text). Every route that receives data from
 * another AI system or partner platform MUST run the payload through this
 * module before storing it, feeding it into an AI prompt/RAG context, or
 * surfacing it to a user — never trust a partner payload's shape or values
 * bidirectionally by default just because auth passed.
 *
 * How it works:
 *   1. Caller declares a `FieldSchema` per field it cares about: type,
 *      required-ness, numeric range, string length, and/or an allowed enum.
 *      This is deliberately declarative (like the DB column constraints we'd
 *      write if this data came through our own form) rather than ad-hoc
 *      `payload.x || fallback` coercion, which silently turns "wrong" into
 *      "plausible" and hides the problem forever.
 *   2. `verifyInboundPayload` walks the schema, and for each field either
 *      accepts the value as-is, or produces a `FieldRejection` describing
 *      what was wrong and what was expected. A rejected/out-of-range field
 *      is NEVER coerced into a nearby plausible value — it is either
 *      dropped (field omitted from the cleaned payload) or nulled,
 *      depending on the field's `required` flag, and the caller decides
 *      from there (e.g. reject the whole request vs. store the row with
 *      that one field blank).
 *   3. Every decision — accepted AND rejected — can be persisted via
 *      `recordInboundVerification` to the append-only `inbound_verification_log`
 *      table, mirroring `claim-chain.ts`'s discipline for outbound claims.
 *   4. `rejectionsToCorrectionNote` turns rejections into a small structured
 *      object a route can embed in its response payload, so the sending
 *      system is told exactly what was wrong instead of the row being
 *      silently dropped or silently accepted with a bad value.
 */
import { db } from "./storage";
import { inboundVerificationLog } from "@shared/schema";

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

export type FieldType = "string" | "number" | "boolean" | "enum" | "stringArray" | "url";

export interface FieldSchema {
  type: FieldType;
  /** if true and the field is missing/invalid, the WHOLE payload should be rejected by the caller (see `hasBlockingRejection`) */
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  /** for type "enum" */
  enum?: string[];
  /** for type "stringArray": cap on element count (excess elements are dropped, not rejected) */
  maxItems?: number;
  /** for type "stringArray": cap on each element's length (elements are truncated, not rejected) */
  itemMaxLength?: number;
}

export type InboundSchema = Record<string, FieldSchema>;

export interface FieldRejection {
  field: string;
  /** missing_required | wrong_type | out_of_range | too_long | not_in_enum */
  reason: string;
  receivedValue: unknown;
  expected: string;
  /** true if the field was required — caller should treat the payload as invalid, not just missing one optional field */
  blocking: boolean;
}

export interface VerificationResult<T> {
  /** payload with only schema-declared fields, each individually validated; invalid optional fields are simply absent, invalid required fields are absent (caller must check hasBlockingRejection) */
  clean: Partial<T>;
  rejections: FieldRejection[];
}

// ---------------------------------------------------------------------------
// Core verification
// ---------------------------------------------------------------------------

function describeExpected(schema: FieldSchema): string {
  switch (schema.type) {
    case "number": {
      const bounds = [
        schema.min != null ? `>= ${schema.min}` : null,
        schema.max != null ? `<= ${schema.max}` : null,
      ].filter(Boolean).join(" and ");
      return `a finite number${bounds ? ` ${bounds}` : ""}`;
    }
    case "string":
      return `a string${schema.maxLength != null ? ` up to ${schema.maxLength} chars` : ""}`;
    case "boolean":
      return "a boolean";
    case "enum":
      return `one of: ${(schema.enum ?? []).join(", ")}`;
    case "stringArray":
      return `an array of strings${schema.maxItems != null ? ` (max ${schema.maxItems})` : ""}`;
    case "url":
      return `an http(s) URL${schema.maxLength != null ? ` up to ${schema.maxLength} chars` : ""}`;
  }
}

const HTTP_URL_RE = /^https?:\/\/[^\s]+$/i;

/**
 * Validates a single raw payload against a declared schema. Never throws —
 * callers decide what to do with rejections (reject the request, null the
 * field, log and continue, etc).
 */
export function verifyInboundPayload<T = Record<string, unknown>>(
  raw: Record<string, any> | null | undefined,
  schema: InboundSchema
): VerificationResult<T> {
  const clean: Record<string, unknown> = {};
  const rejections: FieldRejection[] = [];
  const payload = raw && typeof raw === "object" ? raw : {};

  for (const [field, fieldSchema] of Object.entries(schema)) {
    const value = payload[field];
    const isMissing = value === undefined || value === null || value === "";

    if (isMissing) {
      if (fieldSchema.required) {
        rejections.push({
          field, reason: "missing_required", receivedValue: value,
          expected: describeExpected(fieldSchema), blocking: true,
        });
      }
      continue; // absent from `clean` either way — never fabricate a default
    }

    const reject = (reason: string) => {
      rejections.push({
        field, reason, receivedValue: value,
        expected: describeExpected(fieldSchema), blocking: !!fieldSchema.required,
      });
    };

    switch (fieldSchema.type) {
      case "string": {
        if (typeof value !== "string") { reject("wrong_type"); continue; }
        if (fieldSchema.maxLength != null && value.length > fieldSchema.maxLength) { reject("too_long"); continue; }
        clean[field] = value;
        break;
      }
      case "number": {
        const n = typeof value === "number" ? value : (typeof value === "string" && value.trim() !== "" ? Number(value) : NaN);
        if (typeof n !== "number" || !Number.isFinite(n)) { reject("wrong_type"); continue; }
        if (fieldSchema.min != null && n < fieldSchema.min) { reject("out_of_range"); continue; }
        if (fieldSchema.max != null && n > fieldSchema.max) { reject("out_of_range"); continue; }
        clean[field] = n;
        break;
      }
      case "boolean": {
        if (typeof value !== "boolean") { reject("wrong_type"); continue; }
        clean[field] = value;
        break;
      }
      case "enum": {
        if (typeof value !== "string" || !(fieldSchema.enum ?? []).includes(value)) { reject("not_in_enum"); continue; }
        clean[field] = value;
        break;
      }
      case "stringArray": {
        if (!Array.isArray(value)) { reject("wrong_type"); continue; }
        const strs = value.filter((v) => typeof v === "string");
        if (strs.length !== value.length) { reject("wrong_type"); continue; }
        const capped = fieldSchema.maxItems != null ? strs.slice(0, fieldSchema.maxItems) : strs;
        clean[field] = fieldSchema.itemMaxLength != null
          ? capped.map((s) => s.slice(0, fieldSchema.itemMaxLength))
          : capped;
        break;
      }
      case "url": {
        if (typeof value !== "string" || !HTTP_URL_RE.test(value)) { reject("wrong_type"); continue; }
        if (fieldSchema.maxLength != null && value.length > fieldSchema.maxLength) { reject("too_long"); continue; }
        clean[field] = value;
        break;
      }
    }
  }

  return { clean: clean as Partial<T>, rejections };
}

/** True if any rejection came from a `required` field — caller should treat the whole payload as invalid, not just drop one optional field. */
export function hasBlockingRejection(rejections: FieldRejection[]): boolean {
  return rejections.some((r) => r.blocking);
}

// ---------------------------------------------------------------------------
// Audit log (append-only, mirrors claim-chain.ts's non-fatal-write discipline)
// ---------------------------------------------------------------------------

/**
 * Persists every verification decision for one inbound payload. Non-fatal —
 * a logging failure must never block the (already-validated) request from
 * being processed; it is logged to console instead so an operator can see
 * the audit trail has a gap.
 */
export async function recordInboundVerification(
  source: string,
  endpoint: string,
  rejections: FieldRejection[]
): Promise<void> {
  if (rejections.length === 0) return;
  try {
    await db.insert(inboundVerificationLog).values(
      rejections.map((r) => ({
        source: source.slice(0, 100),
        endpoint: endpoint.slice(0, 200),
        field: r.field.slice(0, 200),
        action: r.blocking ? "rejected" : "nulled",
        reason: r.reason.slice(0, 100),
        receivedValue: safeStringify(r.receivedValue).slice(0, 2000),
        expected: r.expected.slice(0, 300),
      }))
    );
  } catch (err) {
    console.error(`[InboundVerification] failed to record ${rejections.length} rejection(s) for ${source}/${endpoint} (non-fatal):`, err);
  }
}

function safeStringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === undefined) return "undefined";
  try {
    const s = JSON.stringify(v);
    return s === undefined ? String(v) : s;
  } catch { return String(v); }
}

// ---------------------------------------------------------------------------
// Sender-facing correction note
// ---------------------------------------------------------------------------

export interface CorrectionNote {
  field: string;
  problem: string;
  expected: string;
}

/**
 * Turns rejections into a small structured object a route can embed in its
 * JSON response, so the sending system learns exactly what was wrong and
 * what a valid value looks like — instead of the field being silently
 * dropped/nulled or the whole request silently accepted.
 */
export function rejectionsToCorrectionNote(rejections: FieldRejection[]): CorrectionNote[] {
  return rejections.map((r) => ({
    field: r.field,
    problem: `${r.reason.replace(/_/g, " ")} (received: ${safeStringify(r.receivedValue).slice(0, 200)})`,
    expected: r.expected,
  }));
}

/**
 * Convenience wrapper: verify + record in one call. Returns the same shape
 * as `verifyInboundPayload` plus a ready-to-embed `corrections` array.
 */
export async function verifyAndRecord<T = Record<string, unknown>>(
  source: string,
  endpoint: string,
  raw: Record<string, any> | null | undefined,
  schema: InboundSchema
): Promise<VerificationResult<T> & { corrections: CorrectionNote[] }> {
  const result = verifyInboundPayload<T>(raw, schema);
  await recordInboundVerification(source, endpoint, result.rejections);
  return { ...result, corrections: rejectionsToCorrectionNote(result.rejections) };
}
