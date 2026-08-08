// ── YHSI System Improvement Routes ───────────────────────────────────────────
// CES (assessment/prioritization/diversion), Partner registry (MOUs, data-
// sharing), YAB governance (members/decisions/stipends), Sage compliance
// (spending caps, APR/MCU export), and HUD PIT landscape (imported official
// data ONLY — never seeded with invented numbers).
import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  yhsiYouthParticipants,
  yhsiCesAssessments,
  yhsiPartnerOrgs,
  yhsiYabMembers,
  yhsiYabDecisions,
  yhsiYabStipends,
  yhsiSpendingCategories,
  yhsiSpendingEntries,
  yhsiMilestones,
  hudPitCounts,
  insertYhsiCesAssessmentSchema,
  insertYhsiPartnerOrgSchema,
  insertYhsiYabMemberSchema,
  insertYhsiYabDecisionSchema,
  insertYhsiYabStipendSchema,
  insertYhsiSpendingCategorySchema,
  insertYhsiSpendingEntrySchema,
} from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireStaff, getUserId, suppress, SUPPRESSION_FLOOR } from "./yhsi-routes";
import { PROGRAM_GUIDE } from "./yhsi-program-knowledge";

const coerceDate = z.preprocess((v) => (typeof v === "string" || v instanceof Date ? new Date(v as string) : v), z.date());

// Server-enforced vocabularies (free-form values corrupt summaries silently).
const ASSESSMENT_TYPES = z.enum(["ty_vi_spdat", "next_step_tool", "local_youth_tool", "other"]);
const PRIORITIZATION_TIERS = z.enum(["high", "medium", "low"]);
const DIVERSION_OUTCOMES = z.enum(["diverted_family", "diverted_kin", "diverted_other", "not_diverted", "pending"]);
const SYSTEM_TYPES = z.enum(["k12_mckinney_vento", "child_welfare", "juvenile_justice", "workforce", "coc_hmis", "healthcare", "housing_provider", "other"]);
const MOU_STATUSES = z.enum(["none", "drafting", "signed", "expired"]);
const YAB_ROLES = z.enum(["member", "co_chair", "chair", "alumni"]);
const YAB_MEMBER_STATUSES = z.enum(["active", "inactive", "alumni"]);
const DECISION_STATUSES = z.enum(["proposed", "adopted", "implemented", "declined"]);
const STIPEND_PURPOSES = z.enum(["meeting", "workgroup", "interview_panel", "conference", "other"]);

// Single source of truth for the CES cohort: the LATEST assessment per
// participant. The queue and the summary must count the same population —
// counting every historical assessment in the summary while the queue shows
// one row per participant made the two surfaces disagree. This subquery is
// shared so a participant is represented exactly once in both.
function latestCesAssessmentPerParticipant() {
  return db
    .select({
      id: yhsiCesAssessments.id,
      participantId: yhsiCesAssessments.participantId,
      assessmentType: yhsiCesAssessments.assessmentType,
      acuityScore: yhsiCesAssessments.acuityScore,
      prioritizationTier: yhsiCesAssessments.prioritizationTier,
      diversionAttempted: yhsiCesAssessments.diversionAttempted,
      diversionOutcome: yhsiCesAssessments.diversionOutcome,
      assessedAt: yhsiCesAssessments.assessedAt,
      rn: sql<number>`row_number() over (partition by ${yhsiCesAssessments.participantId} order by ${yhsiCesAssessments.assessedAt} desc)`.as("rn"),
    })
    .from(yhsiCesAssessments)
    .as("latest_ces");
}

export function registerYhsiSystemRoutes(app: Express) {
  // ═══ Program guide — PUBLIC by design ════════════════════════════════════
  // McKinney-Vento requires public notice of rights "in a manner and form
  // understandable" to youth (42 U.S.C. §11432(g)(6)(A)(iii)). Static,
  // citation-backed content from uploaded source documents; contains no PII.
  app.get("/api/yhsi/program-guide", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.json(PROGRAM_GUIDE);
  });

  // ═══ CES — youth coordinated entry ═══════════════════════════════════════
  app.post("/api/yhsi/participants/:id/ces-assessments", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiCesAssessmentSchema.omit({ participantId: true }).extend({
        assessmentType: ASSESSMENT_TYPES,
        acuityScore: z.number().int().min(0).max(100),
        prioritizationTier: PRIORITIZATION_TIERS,
        diversionOutcome: DIVERSION_OUTCOMES.optional().nullable(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [participant] = await db.select({ id: yhsiYouthParticipants.id }).from(yhsiYouthParticipants).where(eq(yhsiYouthParticipants.id, String(req.params.id))).limit(1);
      if (!participant) return res.status(404).json({ error: "Participant not found" });
      const [row] = await db.insert(yhsiCesAssessments).values({ ...parsed.data, id: randomUUID(), participantId: String(req.params.id), recordedBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI-SYS] CES assessment create failed:", err);
      return res.status(500).json({ error: "Failed to record assessment" });
    }
  });

  // Prioritization queue — latest assessment per participant, highest acuity first.
  app.get("/api/yhsi/ces/queue", requireStaff, async (_req: Request, res: Response) => {
    try {
      const latest = latestCesAssessmentPerParticipant();
      const rows = await db
        .select({
          id: latest.id,
          participantId: latest.participantId,
          assessmentType: latest.assessmentType,
          acuityScore: latest.acuityScore,
          prioritizationTier: latest.prioritizationTier,
          diversionAttempted: latest.diversionAttempted,
          diversionOutcome: latest.diversionOutcome,
          assessedAt: latest.assessedAt,
          preferredName: yhsiYouthParticipants.preferredName,
          firstName: yhsiYouthParticipants.firstName,
        })
        .from(latest)
        .innerJoin(yhsiYouthParticipants, eq(yhsiYouthParticipants.id, latest.participantId))
        .where(eq(latest.rn, 1));
      const queue = (rows as any[]).sort((a, b) => {
        const tierRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (tierRank[a.prioritizationTier] - tierRank[b.prioritizationTier]) || (b.acuityScore - a.acuityScore);
      });
      return res.json(queue);
    } catch (err) {
      console.error("[YHSI-SYS] CES queue failed:", err);
      return res.status(500).json({ error: "Failed to load queue" });
    }
  });

  // Diversion effectiveness — suppressed rates.
  app.get("/api/yhsi/ces/summary", requireStaff, async (_req: Request, res: Response) => {
    try {
      // Reconcile with the queue: count the LATEST assessment per participant,
      // not every historical assessment. Otherwise `assessments` here reports a
      // larger number than the queue shows, and diversion/tier rates are drawn
      // from a different (stale-inclusive) population.
      const latest = latestCesAssessmentPerParticipant();
      const [r] = await db.select({
        total: sql<number>`count(*)::int`,
        attempted: sql<number>`count(*) filter (where ${latest.diversionAttempted})::int`,
        diverted: sql<number>`count(*) filter (where ${latest.diversionOutcome} like 'diverted%')::int`,
        highTier: sql<number>`count(*) filter (where ${latest.prioritizationTier} = 'high')::int`,
      }).from(latest).where(eq(latest.rn, 1));
      const rate = (num: number, den: number) => (den >= SUPPRESSION_FLOOR ? Math.round((num / den) * 100) : null);
      return res.json({
        assessments: suppress(r.total),
        diversionAttemptRate: rate(r.attempted, r.total),
        diversionSuccessRate: rate(r.diverted, r.attempted),
        highAcuityShare: rate(r.highTier, r.total),
        suppressionNote: `Rates require at least ${SUPPRESSION_FLOOR} in the denominator.`,
      });
    } catch (err) {
      console.error("[YHSI-SYS] CES summary failed:", err);
      return res.status(500).json({ error: "Failed to compute CES summary" });
    }
  });

  // ═══ Partner registry ═════════════════════════════════════════════════════
  app.post("/api/yhsi/partners", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiPartnerOrgSchema.extend({
        systemType: SYSTEM_TYPES,
        mouStatus: MOU_STATUSES.optional(),
        contactEmail: z.string().email().max(320).optional().nullable().or(z.literal("").transform(() => null)),
        mouSignedAt: coerceDate.optional().nullable(),
        mouExpiresAt: coerceDate.optional().nullable(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.insert(yhsiPartnerOrgs).values({ ...parsed.data, id: randomUUID() }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI-SYS] partner create failed:", err);
      return res.status(500).json({ error: "Failed to create partner" });
    }
  });

  app.get("/api/yhsi/partners", requireStaff, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiPartnerOrgs).orderBy(yhsiPartnerOrgs.name);
      const now = Date.now();
      const DAY = 86400000;
      return res.json(rows.map((p) => {
        const daysToExpiry = p.mouExpiresAt ? Math.ceil((p.mouExpiresAt.getTime() - now) / DAY) : null;
        const mouAlert = p.mouStatus === "signed" && daysToExpiry !== null
          ? (daysToExpiry < 0 ? "expired" : daysToExpiry <= 60 ? "expiring_soon" : "none")
          : "none";
        return { ...p, daysToExpiry, mouAlert };
      }));
    } catch (err) {
      console.error("[YHSI-SYS] partner list failed:", err);
      return res.status(500).json({ error: "Failed to list partners" });
    }
  });

  app.patch("/api/yhsi/partners/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiPartnerOrgSchema.partial().extend({
        systemType: SYSTEM_TYPES.optional(),
        mouStatus: MOU_STATUSES.optional(),
        mouSignedAt: coerceDate.optional().nullable(),
        mouExpiresAt: coerceDate.optional().nullable(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.mouStatus === "signed" && !parsed.data.mouSignedAt) updates.mouSignedAt = new Date();
      const [row] = await db.update(yhsiPartnerOrgs).set(updates).where(eq(yhsiPartnerOrgs.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI-SYS] partner update failed:", err);
      return res.status(500).json({ error: "Failed to update partner" });
    }
  });

  app.delete("/api/yhsi/partners/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const [row] = await db.delete(yhsiPartnerOrgs).where(eq(yhsiPartnerOrgs.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json({ deleted: true });
    } catch (err) {
      console.error("[YHSI-SYS] partner delete failed:", err);
      return res.status(500).json({ error: "Failed to delete partner" });
    }
  });

  // ═══ YAB governance ═══════════════════════════════════════════════════════
  app.post("/api/yhsi/yab/members", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiYabMemberSchema.extend({
        role: YAB_ROLES.optional(),
        status: YAB_MEMBER_STATUSES.optional(),
        stipendRate: z.number().min(0).max(10000).optional().nullable(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.insert(yhsiYabMembers).values({ ...parsed.data, id: randomUUID(), stipendRate: parsed.data.stipendRate != null ? String(parsed.data.stipendRate) : null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI-SYS] YAB member create failed:", err);
      return res.status(500).json({ error: "Failed to add member" });
    }
  });

  app.get("/api/yhsi/yab/members", requireStaff, async (_req: Request, res: Response) => {
    try {
      return res.json(await db.select().from(yhsiYabMembers).orderBy(yhsiYabMembers.displayName));
    } catch (err) {
      console.error("[YHSI-SYS] YAB member list failed:", err);
      return res.status(500).json({ error: "Failed to list members" });
    }
  });

  app.patch("/api/yhsi/yab/members/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiYabMemberSchema.partial().extend({
        role: YAB_ROLES.optional(),
        status: YAB_MEMBER_STATUSES.optional(),
        stipendRate: z.number().min(0).max(10000).optional().nullable(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const { stipendRate, ...rest } = parsed.data;
      const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (stipendRate !== undefined) updates.stipendRate = stipendRate != null ? String(stipendRate) : null;
      const [row] = await db.update(yhsiYabMembers).set(updates).where(eq(yhsiYabMembers.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI-SYS] YAB member update failed:", err);
      return res.status(500).json({ error: "Failed to update member" });
    }
  });

  app.post("/api/yhsi/yab/decisions", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiYabDecisionSchema.extend({
        meetingDate: coerceDate,
        status: DECISION_STATUSES.optional(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.insert(yhsiYabDecisions).values({ ...parsed.data, id: randomUUID() }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI-SYS] YAB decision create failed:", err);
      return res.status(500).json({ error: "Failed to record decision" });
    }
  });

  app.get("/api/yhsi/yab/decisions", requireStaff, async (_req: Request, res: Response) => {
    try {
      return res.json(await db.select().from(yhsiYabDecisions).orderBy(desc(yhsiYabDecisions.meetingDate)).limit(500));
    } catch (err) {
      console.error("[YHSI-SYS] YAB decision list failed:", err);
      return res.status(500).json({ error: "Failed to list decisions" });
    }
  });

  app.patch("/api/yhsi/yab/decisions/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiYabDecisionSchema.partial().extend({
        meetingDate: coerceDate.optional(),
        status: DECISION_STATUSES.optional(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.status === "implemented") updates.implementedAt = new Date();
      const [row] = await db.update(yhsiYabDecisions).set(updates).where(eq(yhsiYabDecisions.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI-SYS] YAB decision update failed:", err);
      return res.status(500).json({ error: "Failed to update decision" });
    }
  });

  app.post("/api/yhsi/yab/stipends", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiYabStipendSchema.extend({
        amount: z.number().min(0.01).max(10000),
        purpose: STIPEND_PURPOSES.optional(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [member] = await db.select({ id: yhsiYabMembers.id }).from(yhsiYabMembers).where(eq(yhsiYabMembers.id, parsed.data.memberId)).limit(1);
      if (!member) return res.status(404).json({ error: "Member not found" });
      const [row] = await db.insert(yhsiYabStipends).values({ ...parsed.data, id: randomUUID(), amount: String(parsed.data.amount), recordedBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI-SYS] stipend create failed:", err);
      return res.status(500).json({ error: "Failed to record stipend" });
    }
  });

  app.get("/api/yhsi/yab/summary", requireStaff, async (_req: Request, res: Response) => {
    try {
      const [members] = await db.select({
        active: sql<number>`count(*) filter (where status = 'active')::int`,
        total: sql<number>`count(*)::int`,
      }).from(yhsiYabMembers);
      const [decisions] = await db.select({
        total: sql<number>`count(*)::int`,
        adopted: sql<number>`count(*) filter (where status in ('adopted','implemented'))::int`,
        implemented: sql<number>`count(*) filter (where status = 'implemented')::int`,
        signedOff: sql<number>`count(*) filter (where co_design_signoff)::int`,
      }).from(yhsiYabDecisions);
      const [stipends] = await db.select({
        totalPaid: sql<number>`coalesce(sum(amount), 0)::float`,
        payments: sql<number>`count(*)::int`,
        ytdPaid: sql<number>`coalesce(sum(amount) filter (where paid_at >= date_trunc('year', now())), 0)::float`,
      }).from(yhsiYabStipends);
      return res.json({
        activeMembers: members.active,
        totalMembers: members.total,
        decisions: decisions.total,
        adoptionRate: decisions.total > 0 ? Math.round((decisions.adopted / decisions.total) * 100) : null,
        implementedCount: decisions.implemented,
        coDesignSignoffs: decisions.signedOff,
        stipendPayments: stipends.payments,
        stipendTotalPaid: stipends.totalPaid,
        stipendYtdPaid: stipends.ytdPaid,
      });
    } catch (err) {
      console.error("[YHSI-SYS] YAB summary failed:", err);
      return res.status(500).json({ error: "Failed to compute YAB summary" });
    }
  });

  // ═══ Sage compliance — spending caps + APR/MCU export ════════════════════
  app.post("/api/yhsi/sage/categories", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiSpendingCategorySchema.extend({
        capPercent: z.number().min(0).max(100).optional().nullable(),
        budgetedAmount: z.number().min(0),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.insert(yhsiSpendingCategories).values({
        ...parsed.data, id: randomUUID(),
        capPercent: parsed.data.capPercent != null ? String(parsed.data.capPercent) : null,
        budgetedAmount: String(parsed.data.budgetedAmount),
      }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI-SYS] category create failed:", err);
      return res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.post("/api/yhsi/sage/entries", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiSpendingEntrySchema.extend({
        amount: z.number().min(0.01),
        spentAt: coerceDate.optional(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [cat] = await db.select({ id: yhsiSpendingCategories.id }).from(yhsiSpendingCategories).where(eq(yhsiSpendingCategories.id, parsed.data.categoryId)).limit(1);
      if (!cat) return res.status(404).json({ error: "Category not found" });
      const [row] = await db.insert(yhsiSpendingEntries).values({ ...parsed.data, id: randomUUID(), amount: String(parsed.data.amount), recordedBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI-SYS] spending entry failed:", err);
      return res.status(500).json({ error: "Failed to record spending" });
    }
  });

  app.get("/api/yhsi/sage/spending-summary", requireStaff, async (_req: Request, res: Response) => {
    try {
      const cats = await db.select().from(yhsiSpendingCategories).orderBy(yhsiSpendingCategories.category);
      const spent = await db.select({
        categoryId: yhsiSpendingEntries.categoryId,
        total: sql<number>`coalesce(sum(amount), 0)::float`,
      }).from(yhsiSpendingEntries).groupBy(yhsiSpendingEntries.categoryId);
      const spentBy = new Map(spent.map((s) => [s.categoryId, s.total]));
      const totalBudget = cats.reduce((a, c) => a + Number(c.budgetedAmount), 0);
      const rows = cats.map((c) => {
        const spentAmt = spentBy.get(c.id) ?? 0;
        const budget = Number(c.budgetedAmount);
        const capPercent = c.capPercent != null ? Number(c.capPercent) : null;
        const capAmount = capPercent != null && totalBudget > 0 ? (capPercent / 100) * totalBudget : null;
        return {
          ...c,
          spent: spentAmt,
          utilizationPct: budget > 0 ? Math.round((spentAmt / budget) * 100) : null,
          capAmount,
          overCap: capAmount != null && spentAmt > capAmount,
          overBudget: spentAmt > budget,
        };
      });
      return res.json({ totalBudget, totalSpent: rows.reduce((a, r) => a + r.spent, 0), categories: rows });
    } catch (err) {
      console.error("[YHSI-SYS] spending summary failed:", err);
      return res.status(500).json({ error: "Failed to compute spending summary" });
    }
  });

  // Sage-ready APR/MCU export — milestone chart + spending status as CSV.
  app.get("/api/yhsi/sage/mcu-export", requireStaff, async (_req: Request, res: Response) => {
    try {
      const milestones = await db.select().from(yhsiMilestones).orderBy(yhsiMilestones.dueAt);
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [
        ["Section", "Item", "Type", "Due Date", "Status", "Completed/Notes"].map(esc).join(","),
        ...milestones.map((m) => ["Milestone Chart", m.title, m.milestoneType, m.dueAt.toISOString().slice(0, 10), m.status, m.completedAt ? m.completedAt.toISOString().slice(0, 10) : (m.notes ?? "")].map(esc).join(",")),
      ];
      const cats = await db.select().from(yhsiSpendingCategories);
      const spent = await db.select({ categoryId: yhsiSpendingEntries.categoryId, total: sql<number>`coalesce(sum(amount),0)::float` }).from(yhsiSpendingEntries).groupBy(yhsiSpendingEntries.categoryId);
      const spentBy = new Map(spent.map((s) => [s.categoryId, s.total]));
      for (const c of cats) {
        lines.push(["Budget", c.category, c.capPercent != null ? `cap ${c.capPercent}%` : "no cap", "", `spent ${spentBy.get(c.id) ?? 0} of ${c.budgetedAmount}`, c.notes ?? ""].map(esc).join(","));
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="yhsi-mcu-export-${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(lines.join("\n"));
    } catch (err) {
      console.error("[YHSI-SYS] MCU export failed:", err);
      return res.status(500).json({ error: "Failed to export MCU" });
    }
  });

  // ═══ HUD PIT landscape — official imported data only ═════════════════════
  // Accepts the official HUD "PIT Counts by CoC" file saved as CSV. Header
  // names vary by year ("Overall Homeless, 2024"), so match by prefix.
  app.post("/api/yhsi/pit/import", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = z.object({
        source: z.string().min(3).max(300), // filename or huduser.gov URL of the official file
        year: z.number().int().min(2007).max(2100),
        csv: z.string().min(10).max(10_000_000),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const { source, year, csv } = parsed.data;

      // Minimal CSV parser handling quoted fields.
      const parseLine = (line: string): string[] => {
        const out: string[] = []; let cur = ""; let inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQ) {
            if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (ch === '"') inQ = false;
            else cur += ch;
          } else if (ch === '"') inQ = true;
          else if (ch === ",") { out.push(cur); cur = ""; }
          else cur += ch;
        }
        out.push(cur);
        return out;
      };
      const rows = csv.split(/\r?\n/).filter((l) => l.trim());
      if (rows.length < 2) return res.status(400).json({ error: "CSV has no data rows" });
      const header = parseLine(rows[0]).map((h) => h.trim().toLowerCase());
      const findCol = (...prefixes: string[]) => header.findIndex((h) => prefixes.some((p) => h.startsWith(p)));
      const iCoc = findCol("coc number");
      const iName = findCol("coc name");
      const iOverall = findCol("overall homeless,", "overall homeless");
      const iYouth = findCol("overall homeless unaccompanied youth", "unaccompanied homeless youth", "unaccompanied youth");
      const iUnshel = findCol("unsheltered homeless,", "unsheltered homeless");
      if (iCoc < 0 || iName < 0 || iOverall < 0) {
        return res.status(400).json({ error: "Could not find required columns (CoC Number, CoC Name, Overall Homeless). Export the official HUD file as CSV and retry.", headerSeen: header.slice(0, 12) });
      }
      // Strict whole-number parsing: "12x" or "1.5" must fail loudly, never
      // become a valid count that silently understates or restates totals.
      const toStrictInt = (v: string | undefined): { ok: boolean; value: number | null } => {
        const t = (v ?? "").replace(/[",\s]/g, "");
        if (t === "" || t.toLowerCase() === "n/a" || t === ".") return { ok: true, value: null };
        if (!/^\d+$/.test(t)) return { ok: false, value: null };
        return { ok: true, value: parseInt(t, 10) };
      };
      const valid: Array<Record<string, unknown>> = [];
      const invalid: Array<{ line: number; cocNumber: string; problem: string }> = [];
      let skipped = 0;
      rows.slice(1).forEach((line, idx) => {
        const cells = parseLine(line);
        const cocNumber = (cells[iCoc] ?? "").trim();
        if (!/^[A-Z]{2}-\d{3}$/.test(cocNumber)) { skipped++; return; } // totals/footnote rows
        const overall = toStrictInt(cells[iOverall]);
        const youth = iYouth >= 0 ? toStrictInt(cells[iYouth]) : { ok: true, value: null };
        const unshel = iUnshel >= 0 ? toStrictInt(cells[iUnshel]) : { ok: true, value: null };
        if (!overall.ok || !youth.ok || !unshel.ok) {
          invalid.push({ line: idx + 2, cocNumber, problem: !overall.ok ? `bad Overall Homeless value "${cells[iOverall]}"` : !youth.ok ? `bad youth count "${cells[iYouth]}"` : `bad unsheltered count "${cells[iUnshel]}"` });
          return;
        }
        if (overall.value === null) {
          invalid.push({ line: idx + 2, cocNumber, problem: "missing required Overall Homeless count" });
          return;
        }
        valid.push({
          cocNumber,
          cocName: (cells[iName] ?? "").trim().slice(0, 300),
          state: cocNumber.slice(0, 2),
          year,
          overallHomeless: overall.value,
          unaccompaniedYouthUnder25: youth.value,
          unshelteredHomeless: unshel.value,
          source: source.slice(0, 300),
          importedAt: new Date(),
        });
      });
      // Fail the whole import on any invalid row — partial imports misstate
      // state/national totals, which is worse than no data.
      if (invalid.length > 0) {
        return res.status(400).json({ error: `Import rejected: ${invalid.length} invalid row(s). Fix the CSV and retry — partial imports would misstate totals.`, invalidRows: invalid.slice(0, 20), skipped });
      }
      if (valid.length === 0) return res.status(400).json({ error: "No valid CoC rows found in the CSV." });
      await db.transaction(async (tx) => {
        for (const values of valid) {
          await tx.insert(hudPitCounts).values({ ...(values as any), id: randomUUID() })
            .onConflictDoUpdate({ target: [hudPitCounts.cocNumber, hudPitCounts.year], set: values as any });
        }
      });
      return res.json({ imported: valid.length, skipped, year, source });
    } catch (err) {
      console.error("[YHSI-SYS] PIT import failed:", err);
      return res.status(500).json({ error: "Failed to import PIT data" });
    }
  });

  // Nationwide picture — state totals for a year (latest imported by default).
  app.get("/api/yhsi/pit/national", requireStaff, async (req: Request, res: Response) => {
    try {
      const [latest] = await db.select({ year: sql<number>`max(year)::int` }).from(hudPitCounts);
      const year = req.query.year ? parseInt(String(req.query.year), 10) : latest?.year;
      if (!year) return res.json({ year: null, states: [], note: "No PIT data imported yet. Import the official HUD PIT Counts by CoC file (huduser.gov) as CSV." });
      const states = await db.select({
        state: hudPitCounts.state,
        cocs: sql<number>`count(*)::int`,
        overallHomeless: sql<number>`coalesce(sum(overall_homeless), 0)::int`,
        unaccompaniedYouthUnder25: sql<number>`coalesce(sum(unaccompanied_youth_under_25), 0)::int`,
        unshelteredHomeless: sql<number>`coalesce(sum(unsheltered_homeless), 0)::int`,
      }).from(hudPitCounts).where(eq(hudPitCounts.year, year)).groupBy(hudPitCounts.state).orderBy(desc(sql`sum(overall_homeless)`));
      const [src] = await db.select({ source: hudPitCounts.source }).from(hudPitCounts).where(eq(hudPitCounts.year, year)).limit(1);
      return res.json({ year, source: src?.source ?? null, states });
    } catch (err) {
      console.error("[YHSI-SYS] PIT national failed:", err);
      return res.status(500).json({ error: "Failed to load national data" });
    }
  });

  // State drill-down (default KS) — per-CoC rows + multi-year trend.
  app.get("/api/yhsi/pit/state/:state", requireStaff, async (req: Request, res: Response) => {
    try {
      const state = String(req.params.state).toUpperCase().slice(0, 2);
      const rows = await db.select().from(hudPitCounts).where(eq(hudPitCounts.state, state)).orderBy(hudPitCounts.cocNumber, hudPitCounts.year);
      const trend = await db.select({
        year: hudPitCounts.year,
        overallHomeless: sql<number>`coalesce(sum(overall_homeless), 0)::int`,
        unaccompaniedYouthUnder25: sql<number>`coalesce(sum(unaccompanied_youth_under_25), 0)::int`,
      }).from(hudPitCounts).where(eq(hudPitCounts.state, state)).groupBy(hudPitCounts.year).orderBy(hudPitCounts.year);
      return res.json({ state, cocs: rows, trend });
    } catch (err) {
      console.error("[YHSI-SYS] PIT state failed:", err);
      return res.status(500).json({ error: "Failed to load state data" });
    }
  });

  console.log("[YHSI-SYS] system improvement routes registered");
}
