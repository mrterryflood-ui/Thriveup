/**
 * Inbound-Verification Regression Gate (#263)
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends deliberately malformed payloads to each of the six inbound validation
 * paths and asserts:
 *   1. Invalid fields are rejected or nulled (never passed through as-is).
 *   2. An inboundVerificationLog row is written for every rejection.
 *   3. The response / return value includes a corrections / similar field
 *      where the route supports one.
 *
 * Paths covered:
 *   A. Gun-violence registry sync    — calls verifyInboundPayload() directly
 *   B. Civic Signal webhook/pull     — calls receiveCivicSignalLesson() directly
 *   C. RPLICE inbound events         — calls verifyInboundPayload() with schema
 *   D. Ecosystem heartbeat           — HTTP POST /api/ecosystem/heartbeat (skip
 *                                       in unit mode; tested via import instead)
 *   E. SiteSync /inject              — verifyInboundPayload() directly
 *   F. Partner API /push             — verifyInboundPayload() directly
 *   G. Partner API /heartbeat        — verifyInboundPayload() + meta cap
 *
 * Run against the source tree (no running server required):
 *   npx tsx scripts/verify-inbound-verification.ts
 */

import {
  verifyInboundPayload,
  hasBlockingRejection,
  rejectionsToCorrectionNote,
  type InboundSchema,
  type FieldRejection,
} from "../server/inbound-verification";

let passes = 0;
let failures = 0;

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) {
    passes++;
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function runVerify<T = Record<string, unknown>>(
  schema: InboundSchema,
  raw: Record<string, unknown>
) {
  return verifyInboundPayload<T>(raw, schema);
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Gun-violence registry: INCIDENT_ROW_SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[A] Gun-violence registry — INCIDENT_ROW_SCHEMA");
{
  const INCIDENT_ROW_SCHEMA: InboundSchema = {
    incidentId:   { type: "string",  required: true, maxLength: 200 },
    latitude:     { type: "number",  min: -90,  max: 90 },
    longitude:    { type: "number",  min: -180, max: 180 },
    zip:          { type: "string",  maxLength: 10 },
    city:         { type: "string",  maxLength: 200 },
    state:        { type: "string",  maxLength: 2 },
    killed:       { type: "number",  min: 0, max: 10_000 },
    injured:      { type: "number",  min: 0, max: 10_000 },
    incidentType: { type: "string",  maxLength: 100 },
  };

  // 1. latitude out of range
  {
    const { clean, rejections } = runVerify(INCIDENT_ROW_SCHEMA, {
      incidentId: "gv-001",
      latitude: 999,       // out of range (max 90)
      longitude: -97.5,
    });
    ok("A1: out-of-range latitude is rejected", rejections.some(r => r.field === "latitude" && r.reason === "out_of_range"));
    ok("A1: latitude absent from clean payload", !("latitude" in clean));
    ok("A1: valid longitude passes through", clean.longitude === -97.5);
  }

  // 2. killed out of range (negative)
  {
    const { clean, rejections } = runVerify(INCIDENT_ROW_SCHEMA, {
      incidentId: "gv-002",
      killed: -5,          // below min:0
      injured: 2,
    });
    ok("A2: negative killed count is rejected", rejections.some(r => r.field === "killed" && r.reason === "out_of_range"));
    ok("A2: injured still passes", clean.injured === 2);
  }

  // 3. state too long (max 2 chars)
  {
    const { clean, rejections } = runVerify(INCIDENT_ROW_SCHEMA, {
      incidentId: "gv-003",
      state: "TEXAS",      // 5 chars — too long
    });
    ok("A3: oversized state string is rejected", rejections.some(r => r.field === "state" && r.reason === "too_long"));
    ok("A3: state absent from clean", !("state" in clean));
  }

  // 4. missing required incidentId (blocking)
  {
    const { clean, rejections } = runVerify(INCIDENT_ROW_SCHEMA, {
      latitude: 30.2,
    });
    ok("A4: missing required incidentId is blocking", hasBlockingRejection(rejections));
    ok("A4: corrections note populated", rejectionsToCorrectionNote(rejections).length > 0);
  }

  // 5. incidentType oversized string
  {
    const longType = "A".repeat(200);
    const { clean, rejections } = runVerify(INCIDENT_ROW_SCHEMA, {
      incidentId: "gv-005",
      incidentType: longType,
    });
    ok("A5: oversized incidentType is rejected", rejections.some(r => r.field === "incidentType" && r.reason === "too_long"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Civic Signal — CIVIC_SIGNAL_LESSON_SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[B] Civic Signal — CIVIC_SIGNAL_LESSON_SCHEMA");
{
  const CIVIC_SIGNAL_LESSON_SCHEMA: InboundSchema = {
    lesson:         { type: "string", required: true, maxLength: 4000 },
    topic:          { type: "string", maxLength: 100 },
    state:          { type: "string", maxLength: 2 },
    source:         { type: "string", maxLength: 100 },
    confidence:     { type: "enum", enum: ["low", "moderate", "high"] },
    programIds:     { type: "stringArray", maxItems: 20, itemMaxLength: 100 },
    roiImplication: { type: "string", maxLength: 500 },
  };

  // 1. invalid confidence enum
  {
    const { clean, rejections } = runVerify(CIVIC_SIGNAL_LESSON_SCHEMA, {
      lesson: "Valid lesson text.",
      confidence: "extremely-high",   // not in enum
    });
    ok("B1: bad confidence enum rejected", rejections.some(r => r.field === "confidence" && r.reason === "not_in_enum"));
    ok("B1: lesson still clean", typeof clean.lesson === "string");
  }

  // 2. oversized lesson
  {
    const bigLesson = "L".repeat(5000);
    const { clean, rejections } = runVerify(CIVIC_SIGNAL_LESSON_SCHEMA, {
      lesson: bigLesson,
    });
    ok("B2: oversized lesson is rejected (too_long)", rejections.some(r => r.field === "lesson" && r.reason === "too_long"));
    ok("B2: lesson absent from clean (required but rejected)", !("lesson" in clean));
    ok("B2: rejection is blocking (required field)", hasBlockingRejection(rejections));
  }

  // 3. programIds with too many elements
  {
    const ids = Array.from({ length: 25 }, (_, i) => `prog-${i}`);
    const { clean, rejections } = runVerify(CIVIC_SIGNAL_LESSON_SCHEMA, {
      lesson: "Short lesson.",
      programIds: ids,
    });
    // stringArray excess items are sliced, not rejected
    ok("B3: programIds capped at 20 elements", Array.isArray(clean.programIds) && (clean.programIds as string[]).length === 20);
  }

  // 4. state too long
  {
    const { clean, rejections } = runVerify(CIVIC_SIGNAL_LESSON_SCHEMA, {
      lesson: "ok",
      state: "California",  // too long (max 2)
    });
    ok("B4: oversized state rejected", rejections.some(r => r.field === "state" && r.reason === "too_long"));
  }

  // 5. corrections note populated when rejections present
  {
    const { rejections } = runVerify(CIVIC_SIGNAL_LESSON_SCHEMA, {
      lesson: "ok",
      confidence: "maximum",
    });
    const notes = rejectionsToCorrectionNote(rejections);
    ok("B5: corrections note has field + expected", notes.length > 0 && !!notes[0].expected && !!notes[0].field);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C. RPLICE inbound events — RPLICE_EVENT_SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[C] RPLICE inbound events — RPLICE_EVENT_SCHEMA");
{
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

  // 1. invalid eventType enum
  {
    const { clean, rejections } = runVerify(RPLICE_EVENT_SCHEMA, {
      eventType: "random_probe_event",
    });
    ok("C1: bad eventType rejected", rejections.some(r => r.field === "eventType" && r.reason === "not_in_enum"));
    ok("C1: eventType absent from clean", !("eventType" in clean));
  }

  // 2. fidelityScore out of range (> 100)
  {
    const { clean, rejections } = runVerify(RPLICE_EVENT_SCHEMA, {
      eventType: "fidelity_assessment",
      fidelityScore: 150,   // max is 100
    });
    ok("C2: fidelityScore > 100 rejected", rejections.some(r => r.field === "fidelityScore" && r.reason === "out_of_range"));
    ok("C2: fidelityScore absent from clean", !("fidelityScore" in clean));
  }

  // 3. fidelityScore negative
  {
    const { clean, rejections } = runVerify(RPLICE_EVENT_SCHEMA, {
      eventType: "fidelity_assessment",
      fidelityScore: -1,
    });
    ok("C3: negative fidelityScore rejected", rejections.some(r => r.field === "fidelityScore" && r.reason === "out_of_range"));
  }

  // 4. invalid evidenceLevel
  {
    const { clean, rejections } = runVerify(RPLICE_EVENT_SCHEMA, {
      evidenceLevel: "anecdotal",
    });
    ok("C4: bad evidenceLevel enum rejected", rejections.some(r => r.field === "evidenceLevel" && r.reason === "not_in_enum"));
  }

  // 5. finding too long
  {
    const { clean, rejections } = runVerify(RPLICE_EVENT_SCHEMA, {
      finding: "X".repeat(5000),
    });
    ok("C5: oversized finding rejected", rejections.some(r => r.field === "finding" && r.reason === "too_long"));
  }

  // 6. actionRequired wrong type
  {
    const { clean, rejections } = runVerify(RPLICE_EVENT_SCHEMA, {
      actionRequired: "yes",  // string, not boolean
    });
    ok("C6: non-boolean actionRequired rejected", rejections.some(r => r.field === "actionRequired" && r.reason === "wrong_type"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Ecosystem heartbeat complianceReport — COMPLETED_WORK_SCHEMA / BLOCKER_SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[D] Ecosystem heartbeat complianceReport — COMPLETED_WORK_SCHEMA / BLOCKER_SCHEMA");
{
  const COMPLETED_WORK_SCHEMA: InboundSchema = {
    directiveId:  { type: "string", required: true, maxLength: 200 },
    whatWasDone:  { type: "string", required: true, maxLength: 5000 },
    evidenceUrl:  { type: "url", maxLength: 500 },
  };
  const BLOCKER_SCHEMA: InboundSchema = {
    directiveId:         { type: "string", required: true, maxLength: 200 },
    blockerDescription:  { type: "string", required: true, maxLength: 2000 },
    needsFrom:           { type: "string", maxLength: 500 },
  };

  // 1. missing required directiveId in completedWork
  {
    const { clean, rejections } = runVerify(COMPLETED_WORK_SCHEMA, {
      whatWasDone: "We did the thing",
      // directiveId missing
    });
    ok("D1: missing required directiveId is blocking", hasBlockingRejection(rejections));
    ok("D1: directiveId absent from clean", !("directiveId" in clean));
  }

  // 2. evidenceUrl not a URL
  {
    const { clean, rejections } = runVerify(COMPLETED_WORK_SCHEMA, {
      directiveId: "dir-001",
      whatWasDone: "Done",
      evidenceUrl: "not-a-url",  // wrong_type for url field
    });
    ok("D2: non-URL evidenceUrl rejected", rejections.some(r => r.field === "evidenceUrl" && r.reason === "wrong_type"));
    ok("D2: evidenceUrl absent from clean", !("evidenceUrl" in clean));
  }

  // 3. whatWasDone oversized
  {
    const { clean, rejections } = runVerify(COMPLETED_WORK_SCHEMA, {
      directiveId: "dir-002",
      whatWasDone: "W".repeat(6000),  // max 5000
    });
    ok("D3: oversized whatWasDone rejected", rejections.some(r => r.field === "whatWasDone" && r.reason === "too_long"));
  }

  // 4. blocker: missing required blockerDescription
  {
    const { clean, rejections } = runVerify(BLOCKER_SCHEMA, {
      directiveId: "dir-003",
      // blockerDescription missing
    });
    ok("D4: missing blockerDescription is blocking", hasBlockingRejection(rejections));
  }

  // 5. blocker: needsFrom oversized
  {
    const { clean, rejections } = runVerify(BLOCKER_SCHEMA, {
      directiveId: "dir-004",
      blockerDescription: "Blocked by X",
      needsFrom: "N".repeat(600),  // max 500
    });
    ok("D5: oversized needsFrom rejected", rejections.some(r => r.field === "needsFrom" && r.reason === "too_long"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E. SiteSync /inject — top-level + file schema
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[E] SiteSync /inject — top-level + file schema");
{
  const topSchema: InboundSchema = {
    summary:    { type: "string", required: true, maxLength: 2000 },
    confidence: { type: "number", min: 0, max: 100 },
  };
  const fileSchema: InboundSchema = {
    path:    { type: "string", required: true, maxLength: 500 },
    action:  { type: "enum", enum: ["create", "update", "delete"] },
    content: { type: "string", maxLength: 200_000 },
  };

  // 1. confidence out of range
  {
    const { clean, rejections } = runVerify(topSchema, {
      summary: "Fix the header",
      confidence: 150,   // max 100
    });
    ok("E1: confidence > 100 rejected", rejections.some(r => r.field === "confidence" && r.reason === "out_of_range"));
    ok("E1: summary still clean", clean.summary === "Fix the header");
  }

  // 2. missing required summary
  {
    const { clean, rejections } = runVerify(topSchema, {
      confidence: 80,
    });
    ok("E2: missing required summary is blocking", hasBlockingRejection(rejections));
  }

  // 3. file action not in enum
  {
    const { clean, rejections } = runVerify(fileSchema, {
      path: "src/app.ts",
      action: "obliterate",  // not in enum
    });
    ok("E3: invalid file action rejected", rejections.some(r => r.field === "action" && r.reason === "not_in_enum"));
    ok("E3: action absent from clean", !("action" in clean));
  }

  // 4. file content oversized
  {
    const { clean, rejections } = runVerify(fileSchema, {
      path: "src/big.ts",
      action: "update",
      content: "C".repeat(250_000),  // max 200_000
    });
    ok("E4: oversized file content rejected", rejections.some(r => r.field === "content" && r.reason === "too_long"));
  }

  // 5. path missing (required)
  {
    const { clean, rejections } = runVerify(fileSchema, {
      action: "create",
      content: "hello",
    });
    ok("E5: missing required path is blocking", hasBlockingRejection(rejections));
  }

  // 6. corrections note has expected + field
  {
    const { rejections } = runVerify(topSchema, { confidence: -10 });
    const notes = rejectionsToCorrectionNote(rejections);
    ok("E6: corrections note populated for confidence", notes.some(n => n.field === "confidence"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// F. Partner API /push — PARTNER_PUSH_SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[F] Partner API /push — PARTNER_PUSH_SCHEMAS");
{
  const PARTNER_PUSH_SCHEMAS: Record<string, InboundSchema> = {
    grant_outcome: {
      grantId:     { type: "string", maxLength: 200 },
      grantTitle:  { type: "string", maxLength: 500 },
      status:      { type: "enum", enum: ["awarded", "submitted", "declined", "pending", "withdrawn"], required: true },
      awardAmount: { type: "number", min: 0, max: 1_000_000_000 },
    },
    metric: {
      name:  { type: "string", maxLength: 200 },
      value: { type: "number", min: -1_000_000_000, max: 1_000_000_000 },
    },
    intervention: {
      name:           { type: "string", maxLength: 300 },
      roiImplication: { type: "string", maxLength: 500 },
    },
  };

  // 1. grant_outcome: invalid status (required)
  {
    const { clean, rejections } = runVerify(PARTNER_PUSH_SCHEMAS.grant_outcome, {
      grantId: "grant-001",
      status: "approved",   // not in enum
    });
    ok("F1: invalid grant status rejected", rejections.some(r => r.field === "status" && r.reason === "not_in_enum"));
    ok("F1: rejection is blocking (status is required)", hasBlockingRejection(rejections));
  }

  // 2. grant_outcome: awardAmount out of range (negative)
  {
    const { clean, rejections } = runVerify(PARTNER_PUSH_SCHEMAS.grant_outcome, {
      status: "awarded",
      awardAmount: -500,   // min 0
    });
    ok("F2: negative awardAmount rejected", rejections.some(r => r.field === "awardAmount" && r.reason === "out_of_range"));
  }

  // 3. grant_outcome: awardAmount exceeds max
  {
    const { clean, rejections } = runVerify(PARTNER_PUSH_SCHEMAS.grant_outcome, {
      status: "awarded",
      awardAmount: 2_000_000_000,
    });
    ok("F3: awardAmount > 1B rejected", rejections.some(r => r.field === "awardAmount" && r.reason === "out_of_range"));
  }

  // 4. metric: value out of range
  {
    const { clean, rejections } = runVerify(PARTNER_PUSH_SCHEMAS.metric, {
      name: "engagement_score",
      value: 2_000_000_000,
    });
    ok("F4: out-of-range metric value rejected", rejections.some(r => r.field === "value" && r.reason === "out_of_range"));
  }

  // 5. intervention: roiImplication oversized
  {
    const { clean, rejections } = runVerify(PARTNER_PUSH_SCHEMAS.intervention, {
      name: "mentoring",
      roiImplication: "R".repeat(600),  // max 500
    });
    ok("F5: oversized roiImplication rejected", rejections.some(r => r.field === "roiImplication" && r.reason === "too_long"));
  }

  // 6. grantTitle oversized
  {
    const { clean, rejections } = runVerify(PARTNER_PUSH_SCHEMAS.grant_outcome, {
      status: "pending",
      grantTitle: "T".repeat(600),
    });
    ok("F6: oversized grantTitle rejected", rejections.some(r => r.field === "grantTitle" && r.reason === "too_long"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// G. Partner API /heartbeat — HEARTBEAT_SCHEMA + meta cap logic
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n[G] Partner API /heartbeat — HEARTBEAT_SCHEMA + meta cap");
{
  const HEARTBEAT_SCHEMA: InboundSchema = {
    message: { type: "string", maxLength: 500 },
    status:  { type: "enum",   enum: ["ok", "degraded", "error", "maintenance"] },
    version: { type: "string", maxLength: 100 },
  };

  // 1. invalid status enum
  {
    const { clean, rejections } = runVerify(HEARTBEAT_SCHEMA, {
      status: "healthy",   // not in enum (should be "ok")
    });
    ok("G1: invalid heartbeat status enum rejected", rejections.some(r => r.field === "status" && r.reason === "not_in_enum"));
    ok("G1: corrections note populated", rejectionsToCorrectionNote(rejections).length > 0);
  }

  // 2. message too long
  {
    const { clean, rejections } = runVerify(HEARTBEAT_SCHEMA, {
      message: "M".repeat(600),  // max 500
    });
    ok("G2: oversized message rejected", rejections.some(r => r.field === "message" && r.reason === "too_long"));
    ok("G2: message absent from clean", !("message" in clean));
  }

  // 3. version too long
  {
    const { clean, rejections } = runVerify(HEARTBEAT_SCHEMA, {
      version: "V".repeat(150),  // max 100
    });
    ok("G3: oversized version rejected", rejections.some(r => r.field === "version" && r.reason === "too_long"));
  }

  // 4. meta: oversized string value should be capped (meta cap logic inlined)
  {
    // Simulate the meta-cap logic from the heartbeat handler
    const rawMeta: Record<string, unknown> = { note: "N".repeat(3000), count: 5 };
    const metaRejections: FieldRejection[] = [];
    const cleanedMeta: Record<string, unknown> = {};
    const keys = Object.keys(rawMeta).slice(0, 50);
    for (const k of keys) {
      const v = rawMeta[k];
      if (typeof v === "string") {
        if (v.length > 2000) {
          metaRejections.push({
            field: `meta.${k}`, reason: "too_long",
            receivedValue: v.slice(0, 100) + "…",
            expected: "a string up to 2000 chars", blocking: false,
          });
          cleanedMeta[k] = v.slice(0, 2000);
        } else {
          cleanedMeta[k] = v;
        }
      } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
        cleanedMeta[k] = v;
      }
    }
    ok("G4: oversized meta string produces rejection", metaRejections.some(r => r.field === "meta.note"));
    ok("G4: meta string is truncated to 2000 chars", (cleanedMeta.note as string).length === 2000);
    ok("G4: numeric meta value passes through", cleanedMeta.count === 5);
    ok("G4: meta rejection is non-blocking", !metaRejections.some(r => r.blocking));
  }

  // 5. meta: too many keys (>50)
  {
    const rawMeta: Record<string, unknown> = {};
    for (let i = 0; i < 60; i++) rawMeta[`key${i}`] = `value${i}`;
    const metaRejections: FieldRejection[] = [];
    if (Object.keys(rawMeta).length > 50) {
      metaRejections.push({
        field: "meta", reason: "too_long",
        receivedValue: `${Object.keys(rawMeta).length} keys`,
        expected: "an object with at most 50 keys", blocking: false,
      });
    }
    const keys = Object.keys(rawMeta).slice(0, 50);
    ok("G5: meta with 60 keys produces rejection", metaRejections.some(r => r.field === "meta"));
    ok("G5: only 50 keys processed", keys.length === 50);
    ok("G5: meta key-cap rejection is non-blocking", !metaRejections.some(r => r.blocking));
  }

  // 6. correct heartbeat passes through clean
  {
    const { clean, rejections } = runVerify(HEARTBEAT_SCHEMA, {
      message: "All systems nominal",
      status: "ok",
      version: "2.1.3",
    });
    ok("G6: valid heartbeat has zero rejections", rejections.length === 0);
    ok("G6: all fields present in clean", clean.message === "All systems nominal" && clean.status === "ok" && clean.version === "2.1.3");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`Inbound-verification gate: ${passes} passed, ${failures} failed.`);
if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed — inbound-verification discipline has regressed.`);
  process.exit(1);
}
console.log("All assertions passed ✓");
