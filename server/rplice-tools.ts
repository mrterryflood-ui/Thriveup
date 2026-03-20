import type { Express } from "express";
import { db } from "./storage";
import { rpliceAssessments } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerRpliceToolsRoutes(app: Express) {
  app.post("/api/rplice/cfir-assessment", async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "cfir",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/cfir-assessments", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .where(eq(rpliceAssessments.assessmentType, "cfir"))
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/reaim-scorecard", async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "reaim",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/reaim-scorecards", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .where(eq(rpliceAssessments.assessmentType, "reaim"))
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/fidelity-checklist", async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "fidelity",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/three-realities", async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "three_realities",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/quality-reviews", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/quality-reviews/:id/resolve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const [row] = await db.update(rpliceAssessments)
        .set({ status: status || "complete", updatedAt: new Date() })
        .where(eq(rpliceAssessments.id, id))
        .returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/assessments", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
