import type { Express, NextFunction, Request, Response } from "express";
import { Router } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  eastAustinReadinessAuditEvents,
  eastAustinReadinessGates,
  eastAustinReadinessPackets,
  eastAustinReadinessSources,
  eastAustinReadinessTabletops,
} from "@shared/schema";
import { db, storage } from "./storage";

const TERRITORY_KEY = "east-austin-six-square";
const STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);
const APPLICABILITY = ["direct_match", "related_setting_limited", "process_support", "not_yet_mapped"] as const;
const GATE_STATUSES = ["blocked", "ready_for_review", "approved", "expired"] as const;
type GateStatus = (typeof GATE_STATUSES)[number];
const GATE_TRANSITIONS: Record<GateStatus, readonly GateStatus[]> = {
  blocked: ["blocked", "ready_for_review"],
  ready_for_review: ["ready_for_review", "blocked", "approved"],
  approved: ["approved", "expired"],
  expired: ["expired", "ready_for_review"],
};

const GATE_DEFINITIONS = [
  ["authorization", "Authorization and decision rights", "Record the accountable authority, decision scope, and approval before any implementation claim or action."],
  ["partner-data-claims", "Partner, data, and claims authority", "Record permitted data use, partner representation authority, and claims review path; public association is not approval."],
  ["geography-baseline", "Geography and reproducible baseline", "Record the exact six-square boundary, source, method, vintage, date, and approval before any area classification."],
  ["evidence-applicability", "Targeted evidence and local applicability", "Record evidence fit, implementation limits, and local applicability; a candidate bundle is not an EBI claim."],
  ["youth-family-safeguards", "Youth and family safeguards", "Record youth/family safety, consent, accessibility, language, compensation, withdrawal, and escalation decisions before any participation."],
  ["cultural-publication-correction", "Cultural stewardship, publication, and correction", "Record cultural stewardship, publication authority, challenge/correction process, and release decision before publishing."],
] as const;

function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub || user?.id;
}

async function requireEastAustinStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const user = await storage.getUser(userId);
    if (!user || !STAFF_ROLES.has(user.role)) {
      return res.status(403).json({ error: "Staff access required" });
    }
    next();
  } catch (error: any) {
    console.error("[east-austin-readiness] authorization error:", error);
    res.status(500).json({ error: "Unable to verify authorization." });
  }
}

async function getOrCreatePacket() {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(eastAustinReadinessPackets)
      .where(eq(eastAustinReadinessPackets.territoryKey, TERRITORY_KEY)).limit(1);
    const [created] = existing ? [] : await tx.insert(eastAustinReadinessPackets).values({
      territoryKey: TERRITORY_KEY,
      title: "East Austin Community Bridge — six-square approval readiness",
      boundaryLabel: "East Austin six-square territory — provisional; exact boundary not yet approved",
      stakeholderCategories: ["youth", "family", "community", "provider", "HBCU", "funder"],
      stakeholderSettings: ["inner setting", "outer setting"],
    }).onConflictDoNothing().returning();
    const packet = existing || created || (await tx.select().from(eastAustinReadinessPackets)
      .where(eq(eastAustinReadinessPackets.territoryKey, TERRITORY_KEY)).limit(1))[0];
    if (!packet) throw new Error("Unable to initialize East Austin readiness record.");

    // This is intentionally an idempotent repair on every first read so a
    // failed/concurrent initialization cannot leave a packet with fewer gates.
    await tx.insert(eastAustinReadinessGates).values(GATE_DEFINITIONS.map(([gateKey, label, requiredDecision]) => ({
      packetId: packet.id,
      gateKey,
      label,
      requiredDecision,
      status: "blocked",
      classification: "planning_only",
    }))).onConflictDoNothing();
    if (created) {
      await tx.insert(eastAustinReadinessAuditEvents).values({
        packetId: packet.id,
        eventType: "packet_initialized",
        eventData: { territoryKey: TERRITORY_KEY, boundaryStatus: "provisional", seededGateCount: GATE_DEFINITIONS.length },
      });
    }
    return packet;
  });
}

function toDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function effectiveGateStatus(gate: typeof eastAustinReadinessGates.$inferSelect): GateStatus {
  const decisionReady = Boolean(gate.namedApprover && gate.decisionRecord && gate.reviewedAt);
  const revalidationTime = gate.revalidateAt ? new Date(gate.revalidateAt).getTime() : Number.NaN;
  const expired = Number.isFinite(revalidationTime) && revalidationTime < Date.now();
  if (expired) return "expired";
  if (gate.status === "approved" && !decisionReady) return "blocked";
  return gate.status as GateStatus;
}

const geographySchema = z.object({
  boundaryLabel: z.string().trim().min(10).max(1_000),
  boundarySource: z.string().trim().min(3).max(1_000),
  boundaryMethod: z.string().trim().min(3).max(1_000),
  boundaryRecordedAt: z.string().datetime(),
  baselineMethod: z.string().trim().min(3).max(1_000),
  dataVintage: z.string().trim().min(3).max(120),
  expectedUpdatedAt: z.string().datetime(),
}).strict();

const gateUpdateSchema = z.object({
  status: z.enum(GATE_STATUSES),
  classification: z.enum(["planning_only", "approval_record", "release_control"]).default("planning_only"),
  namedApprover: z.string().trim().min(2).max(180).nullable().optional(),
  decisionRecord: z.string().trim().min(3).max(1_000).nullable().optional(),
  reviewedAt: z.string().datetime().nullable().optional(),
  revalidateAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2_000).nullable().optional(),
  expectedUpdatedAt: z.string().datetime(),
}).strict();

const httpUrlSchema = z.string().url().max(2_000).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Only http(s) source URLs are allowed.");

const sourceSchema = z.object({
  sourceTitle: z.string().trim().min(3).max(240),
  sourceType: z.enum(["public_data", "public_evidence", "internal_planning", "restricted_pending"]),
  geography: z.string().trim().min(2).max(180),
  vintage: z.string().trim().min(2).max(120),
  permittedUse: z.string().trim().min(3).max(1_000),
  applicability: z.enum(APPLICABILITY),
  limitations: z.string().trim().min(3).max(2_000),
  sourceReference: z.string().trim().min(3).max(2_000),
  sourceUrl: httpUrlSchema.nullable().optional(),
  correctsSourceId: z.string().regex(/^[A-Za-z0-9-]{8,100}$/).nullable().optional(),
}).strict();

const tabletopSchema = z.object({
  title: z.string().trim().min(3).max(180),
  scenario: z.string().trim().min(10).max(2_000),
  stakeholderSetting: z.enum(["inner_setting", "outer_setting", "cross_setting"]),
  learningQuestion: z.string().trim().min(10).max(1_000),
  decisionOwnerCategory: z.string().trim().min(3).max(120),
  actionLearningCadence: z.string().trim().min(3).max(160),
}).strict();

function sendValidationError(res: Response, parsed: z.SafeParseReturnType<unknown, unknown>) {
  if (parsed.success) return false;
  res.status(400).json({ error: "Invalid readiness record.", details: parsed.error.issues });
  return true;
}

const PROHIBITED_PLANNING_CONTENT = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/,
  /\b(?:client|participant|patient|resident)\s*(?:id|name|email|phone|address|record)\b/i,
  /\b(?:case note|referral|intake|service record|medical record)\b/i,
];

function containsProhibitedPlanningContent(record: Record<string, unknown>) {
  const text = Object.values(record).filter((value) => typeof value === "string").join("\n");
  return PROHIBITED_PLANNING_CONTENT.some((pattern) => pattern.test(text));
}

function gateAuditSnapshot(gate: typeof eastAustinReadinessGates.$inferSelect) {
  return {
    gateKey: gate.gateKey,
    status: gate.status,
    classification: gate.classification,
    namedApprover: gate.namedApprover,
    decisionRecord: gate.decisionRecord,
    reviewedAt: gate.reviewedAt?.toISOString() ?? null,
    revalidateAt: gate.revalidateAt?.toISOString() ?? null,
    notes: gate.notes,
    updatedAt: gate.updatedAt.toISOString(),
  };
}

export function registerEastAustinApprovalRoutes(app: Express) {
  const router = Router();
  app.use("/api/east-austin/readiness", requireEastAustinStaff, router);

  router.get("/", async (_req, res) => {
    try {
      const packet = await getOrCreatePacket();
      const [gates, sources, tabletops, auditEvents] = await Promise.all([
        db.select().from(eastAustinReadinessGates).where(eq(eastAustinReadinessGates.packetId, packet.id)).orderBy(asc(eastAustinReadinessGates.createdAt)),
        db.select().from(eastAustinReadinessSources).where(eq(eastAustinReadinessSources.packetId, packet.id)).orderBy(desc(eastAustinReadinessSources.createdAt)),
        db.select().from(eastAustinReadinessTabletops).where(eq(eastAustinReadinessTabletops.packetId, packet.id)).orderBy(desc(eastAustinReadinessTabletops.createdAt)),
        db.select().from(eastAustinReadinessAuditEvents).where(eq(eastAustinReadinessAuditEvents.packetId, packet.id)).orderBy(desc(eastAustinReadinessAuditEvents.createdAt)).limit(50),
      ]);
      res.set("Cache-Control", "private, no-store");
      res.json({
        packet,
        gates: gates.map((gate) => ({ ...gate, effectiveStatus: effectiveGateStatus(gate) })),
        sources,
        tabletops,
        auditEvents,
        safeguards: {
          planningOnly: true,
          noParticipantIntake: true,
          noPartnerDataImport: true,
          noPublicClassification: true,
          noPublication: true,
        },
      });
    } catch (error: any) {
      console.error("[east-austin-readiness] GET error:", error);
      res.status(500).json({ error: "Failed to load East Austin readiness workspace." });
    }
  });

  router.patch("/geography", async (req, res) => {
    try {
      const parsed = geographySchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed);
        return;
      }
      const packet = await getOrCreatePacket();
      const actorUserId = getUserId(req);
      const updated = await db.transaction(async (tx) => {
        const [current] = await tx.select().from(eastAustinReadinessPackets).where(eq(eastAustinReadinessPackets.id, packet.id)).limit(1);
        const changed = await tx.update(eastAustinReadinessPackets)
          .set({ ...parsed.data, boundaryRecordedAt: toDate(parsed.data.boundaryRecordedAt), updatedAt: new Date() })
          .where(and(eq(eastAustinReadinessPackets.id, packet.id), eq(eastAustinReadinessPackets.updatedAt, toDate(parsed.data.expectedUpdatedAt)!)))
          .returning();
        if (!changed[0]) return null;
        await tx.insert(eastAustinReadinessAuditEvents).values({
          packetId: packet.id,
          eventType: "geography_updated",
          actorUserId,
          eventData: { before: { boundaryLabel: current?.boundaryLabel, updatedAt: current?.updatedAt?.toISOString() }, after: { boundaryLabel: changed[0].boundaryLabel, boundaryRecordedAt: changed[0].boundaryRecordedAt?.toISOString(), dataVintage: changed[0].dataVintage, updatedAt: changed[0].updatedAt.toISOString() } },
        });
        return changed[0];
      });
      if (!updated) return res.status(409).json({ error: "This geography record was updated by another reviewer. Reload before saving again." });
      res.json({ packet: updated });
    } catch (error: any) {
      console.error("[east-austin-readiness] PATCH geography error:", error);
      res.status(500).json({ error: "Failed to update geography record." });
    }
  });

  router.patch("/gates/:gateKey", async (req, res) => {
    try {
      const parsed = gateUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed);
        return;
      }
      const packet = await getOrCreatePacket();
      const gateKey = String(req.params.gateKey);
      const [current] = await db.select().from(eastAustinReadinessGates)
        .where(and(eq(eastAustinReadinessGates.packetId, packet.id), eq(eastAustinReadinessGates.gateKey, gateKey))).limit(1);
      if (!current) return res.status(404).json({ error: "Readiness gate not found." });
      const data = parsed.data;
      const currentEffectiveStatus = effectiveGateStatus(current);
      if (!GATE_TRANSITIONS[currentEffectiveStatus].includes(data.status)) {
        return res.status(409).json({ error: `Invalid readiness transition: ${currentEffectiveStatus} to ${data.status}.` });
      }
      if (data.status === "approved" && (!data.namedApprover || !data.decisionRecord || !data.reviewedAt)) {
        return res.status(400).json({ error: "An approved gate requires a named approver, decision record, and review date." });
      }
      const reviewedAt = data.reviewedAt === undefined ? current.reviewedAt : toDate(data.reviewedAt ?? undefined);
      const revalidateAt = data.revalidateAt === undefined ? current.revalidateAt : toDate(data.revalidateAt ?? undefined);
      if ((data.reviewedAt && !reviewedAt) || (data.revalidateAt && !revalidateAt)) {
        return res.status(400).json({ error: "Readiness dates must be valid ISO timestamps." });
      }
      if (reviewedAt && reviewedAt.getTime() > Date.now() + 60_000) return res.status(400).json({ error: "A review date cannot be in the future." });
      if (reviewedAt && revalidateAt && revalidateAt <= reviewedAt) return res.status(400).json({ error: "Revalidation must be after the review date." });
      const updated = await db.transaction(async (tx) => {
        const [changed] = await tx.update(eastAustinReadinessGates).set({
          status: data.status,
          classification: data.classification,
          namedApprover: data.namedApprover ?? null,
          decisionRecord: data.decisionRecord ?? null,
          reviewedAt,
          revalidateAt,
          notes: data.notes ?? null,
          updatedByUserId: getUserId(req),
          updatedAt: new Date(),
        }).where(and(eq(eastAustinReadinessGates.id, current.id), eq(eastAustinReadinessGates.updatedAt, toDate(data.expectedUpdatedAt)!))).returning();
        if (!changed) return null;
        await tx.insert(eastAustinReadinessAuditEvents).values({
          packetId: packet.id,
          eventType: "gate_updated",
          actorUserId: getUserId(req),
          eventData: { before: gateAuditSnapshot(current), after: gateAuditSnapshot(changed) },
        });
        return changed;
      });
      if (!updated) return res.status(409).json({ error: "This gate was updated by another reviewer. Reload before saving again." });
      res.json({ gate: { ...updated, effectiveStatus: effectiveGateStatus(updated) } });
    } catch (error: any) {
      console.error("[east-austin-readiness] PATCH gate error:", error);
      res.status(500).json({ error: "Failed to update readiness gate." });
    }
  });

  router.post("/sources", async (req, res) => {
    try {
      const parsed = sourceSchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed);
        return;
      }
      const packet = await getOrCreatePacket();
      if (containsProhibitedPlanningContent(parsed.data)) {
        return res.status(400).json({ error: "Planning records cannot contain person-level, case, referral, intake, or contact information." });
      }
      if (parsed.data.correctsSourceId) {
        const [prior] = await db.select({ id: eastAustinReadinessSources.id }).from(eastAustinReadinessSources)
          .where(and(eq(eastAustinReadinessSources.id, parsed.data.correctsSourceId), eq(eastAustinReadinessSources.packetId, packet.id))).limit(1);
        if (!prior) return res.status(400).json({ error: "The source selected for correction is not in this readiness record." });
      }
      const source = await db.transaction(async (tx) => {
        const [created] = await tx.insert(eastAustinReadinessSources).values({
          ...parsed.data,
          sourceUrl: parsed.data.sourceUrl ?? null,
          correctsSourceId: parsed.data.correctsSourceId ?? null,
          packetId: packet.id,
          createdByUserId: getUserId(req)!,
        }).returning();
        await tx.insert(eastAustinReadinessAuditEvents).values({
          packetId: packet.id,
          eventType: "source_added",
          actorUserId: getUserId(req),
          eventData: { sourceId: created.id, sourceType: created.sourceType, applicability: created.applicability, correctsSourceId: created.correctsSourceId },
        });
        return created;
      });
      res.status(201).json({ source });
    } catch (error: any) {
      console.error("[east-austin-readiness] POST source error:", error);
      res.status(500).json({ error: "Failed to add source record." });
    }
  });

  router.post("/tabletops", async (req, res) => {
    try {
      const parsed = tabletopSchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed);
        return;
      }
      const packet = await getOrCreatePacket();
      if (containsProhibitedPlanningContent(parsed.data)) {
        return res.status(400).json({ error: "Simulated tabletops cannot contain person-level, case, referral, intake, or contact information." });
      }
      const tabletop = await db.transaction(async (tx) => {
        const [created] = await tx.insert(eastAustinReadinessTabletops).values({
          ...parsed.data,
          packetId: packet.id,
          isSimulated: true,
          createdByUserId: getUserId(req)!,
        }).returning();
        await tx.insert(eastAustinReadinessAuditEvents).values({
          packetId: packet.id,
          eventType: "simulated_tabletop_added",
          actorUserId: getUserId(req),
          eventData: { tabletopId: created.id, stakeholderSetting: created.stakeholderSetting, isSimulated: true },
        });
        return created;
      });
      res.status(201).json({ tabletop });
    } catch (error: any) {
      console.error("[east-austin-readiness] POST tabletop error:", error);
      res.status(500).json({ error: "Failed to add simulated tabletop." });
    }
  });
}