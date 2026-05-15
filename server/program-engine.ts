import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  programs, programMilestones, programRisks, programUpdates,
  insertProgramSchema, insertProgramMilestoneSchema,
  insertProgramRiskSchema, insertProgramUpdateSchema,
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated?.() && !(req as any).user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function registerProgramEngineRoutes(app: Express) {

  app.post("/api/programs", requireAuth, async (req, res) => {
    try {
      const parsed = insertProgramSchema.parse(req.body);
      const [program] = await db.insert(programs).values(parsed).returning();
      await db.insert(programUpdates).values({
        programId: program.id,
        authorName: parsed.createdBy || "System",
        updateType: "status",
        content: `Program "${program.title}" created with ${parsed.methodology} methodology.`,
      });
      res.json(program);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/programs", async (_req, res) => {
    try {
      const allPrograms = await db.select().from(programs).orderBy(desc(programs.createdAt));
      const result = await Promise.all(allPrograms.map(async (p) => {
        const milestones = await db.select().from(programMilestones).where(eq(programMilestones.programId, p.id));
        const risks = await db.select().from(programRisks).where(eq(programRisks.programId, p.id));
        const total = milestones.length;
        const completed = milestones.filter(m => m.status === "completed").length;
        const atRisk = milestones.filter(m => m.status === "at_risk").length;
        const overdue = milestones.filter(m => m.status === "overdue" || (m.dueDate && new Date(m.dueDate) < new Date() && m.status !== "completed")).length;
        const activeRisks = risks.filter(r => r.status !== "resolved").length;
        const healthScore = total > 0 ? Math.round(((completed + milestones.filter(m => m.status === "in_progress").length) / total) * 100) : 100;
        return { ...p, _summary: { total, completed, atRisk, overdue, activeRisks, healthScore } };
      }));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const [program] = await db.select().from(programs).where(eq(programs.id, id));
      if (!program) return res.status(404).json({ error: "Program not found" });
      const milestones = await db.select().from(programMilestones).where(eq(programMilestones.programId, id)).orderBy(programMilestones.dueDate);
      const risks = await db.select().from(programRisks).where(eq(programRisks.programId, id)).orderBy(desc(programRisks.createdAt));
      const updates = await db.select().from(programUpdates).where(eq(programUpdates.programId, id)).orderBy(desc(programUpdates.createdAt));
      res.json({ ...program, milestones, risks, updates });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/programs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const allowedFields = ["title", "description", "objectives", "stakeholders", "timeline", "successCriteria", "methodology", "status", "setupData", "platformIds", "grantIds", "targetPopulation", "geographicFocus"];
      const updates: any = { updatedAt: new Date() };
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const [updated] = await db.update(programs).set(updates).where(eq(programs.id, id)).returning();
      if (!updated) return res.status(404).json({ error: "Program not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/programs/:id/milestones", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const milestones = await db.select().from(programMilestones).where(eq(programMilestones.programId, id)).orderBy(programMilestones.dueDate);
      res.json(milestones);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/programs/:id/milestones", requireAuth, async (req, res) => {
    try {
      const programId = parseInt(req.params.id as string);
      const parsed = insertProgramMilestoneSchema.parse({ ...req.body, programId });
      const [milestone] = await db.insert(programMilestones).values(parsed).returning();
      await db.insert(programUpdates).values({
        programId,
        authorName: req.body.assignee || "System",
        updateType: "milestone",
        content: `Milestone added: "${milestone.title}" — due ${milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : "TBD"}`,
      });
      res.json(milestone);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/programs/:id/milestones/:milestoneId", requireAuth, async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.milestoneId as string);
      const programId = parseInt(req.params.id as string);
      const milestoneAllowed = ["title", "description", "phase", "dueDate", "completedDate", "status", "assignee", "evidenceUrl", "deliverables", "dependencies", "notes"];
      const updates: any = { updatedAt: new Date() };
      for (const key of milestoneAllowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (updates.status === "completed" && !updates.completedDate) {
        updates.completedDate = new Date();
      }
      const [updated] = await db.update(programMilestones).set(updates).where(and(eq(programMilestones.id, milestoneId), eq(programMilestones.programId, programId))).returning();
      if (!updated) return res.status(404).json({ error: "Milestone not found" });
      if (req.body.status) {
        await db.insert(programUpdates).values({
          programId,
          authorName: req.body.assignee || updated.assignee || "System",
          updateType: "milestone",
          content: `Milestone "${updated.title}" status changed to ${req.body.status}.`,
        });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/programs/:id/risks", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const risks = await db.select().from(programRisks).where(eq(programRisks.programId, id)).orderBy(desc(programRisks.createdAt));
      res.json(risks);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/programs/:id/risks", requireAuth, async (req, res) => {
    try {
      const programId = parseInt(req.params.id as string);
      const parsed = insertProgramRiskSchema.parse({ ...req.body, programId });
      const [risk] = await db.insert(programRisks).values(parsed).returning();
      await db.insert(programUpdates).values({
        programId,
        authorName: req.body.owner || "System",
        updateType: "risk",
        content: `Risk identified: "${risk.title}" (${risk.likelihood} likelihood × ${risk.impact} impact)`,
      });
      res.json(risk);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/programs/:id/risks/:riskId", requireAuth, async (req, res) => {
    try {
      const riskId = parseInt(req.params.riskId as string);
      const programId = parseInt(req.params.id as string);
      const riskAllowed = ["title", "description", "likelihood", "impact", "mitigation", "owner", "status"];
      const updates: any = {};
      for (const key of riskAllowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const [updated] = await db.update(programRisks).set(updates).where(and(eq(programRisks.id, riskId), eq(programRisks.programId, programId))).returning();
      if (!updated) return res.status(404).json({ error: "Risk not found" });
      if (req.body.status) {
        await db.insert(programUpdates).values({
          programId,
          authorName: req.body.owner || updated.owner || "System",
          updateType: "risk",
          content: `Risk "${updated.title}" status changed to ${req.body.status}.`,
        });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/programs/:id/updates", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const filter = req.query.type as string | undefined;
      let query = db.select().from(programUpdates).where(eq(programUpdates.programId, id)).orderBy(desc(programUpdates.createdAt));
      const allUpdates = await query;
      const filtered = filter ? allUpdates.filter(u => u.updateType === filter) : allUpdates;
      res.json(filtered);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/programs/:id/updates", requireAuth, async (req, res) => {
    try {
      const programId = parseInt(req.params.id as string);
      const parsed = insertProgramUpdateSchema.parse({ ...req.body, programId });
      const [update] = await db.insert(programUpdates).values(parsed).returning();
      res.json(update);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/programs/:id/health", async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const [program] = await db.select().from(programs).where(eq(programs.id, id));
      if (!program) return res.status(404).json({ error: "Program not found" });
      const milestones = await db.select().from(programMilestones).where(eq(programMilestones.programId, id));
      const risks = await db.select().from(programRisks).where(eq(programRisks.programId, id));

      const total = milestones.length;
      const completed = milestones.filter(m => m.status === "completed").length;
      const inProgress = milestones.filter(m => m.status === "in_progress").length;
      const atRisk = milestones.filter(m => m.status === "at_risk").length;
      const overdue = milestones.filter(m => m.status === "overdue" || (m.dueDate && new Date(m.dueDate) < new Date() && m.status !== "completed")).length;
      const notStarted = milestones.filter(m => m.status === "not_started").length;
      const activeRisks = risks.filter(r => r.status !== "resolved").length;
      const highRisks = risks.filter(r => r.status !== "resolved" && (r.likelihood === "high" || r.impact === "high")).length;

      const healthScore = total > 0
        ? Math.round(((completed * 1.0 + inProgress * 0.5) / total) * 100)
        : 100;

      const timeline = program.timeline as any;
      const phases = timeline?.phases || [];
      const now = new Date();
      let currentPhase = phases.length > 0 ? phases[0]?.name || "Phase 1" : "Not Set";
      for (const phase of phases) {
        if (phase.startDate && phase.endDate) {
          const start = new Date(phase.startDate);
          const end = new Date(phase.endDate);
          if (now >= start && now <= end) {
            currentPhase = phase.name;
            break;
          }
        }
      }

      const dueThisWeek = milestones.filter(m => {
        if (!m.dueDate || m.status === "completed") return false;
        const due = new Date(m.dueDate);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return due >= now && due <= weekFromNow;
      }).length;

      res.json({
        healthScore,
        currentPhase,
        milestones: { total, completed, inProgress, atRisk, overdue, notStarted, dueThisWeek },
        risks: { total: risks.length, active: activeRisks, high: highRisks, resolved: risks.length - activeRisks },
        methodology: program.methodology,
        status: program.status,
        grants: program.grantIds,
        platforms: program.platformIds,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
