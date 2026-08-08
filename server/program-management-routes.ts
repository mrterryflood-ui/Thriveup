import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  grantProjects, staffingPlans, facilityPlans, programSchedules,
  inKindContributions, complianceCalendar, sustainabilityPlans, adjacentAgencies,
  insertGrantProjectSchema, insertStaffingPlanSchema, insertFacilityPlanSchema,
  insertProgramScheduleSchema, insertInKindContributionSchema,
  insertComplianceCalendarSchema, insertSustainabilityPlanSchema, insertAdjacentAgencySchema,
} from "@shared/schema";
import { eq, desc, sql, gte, and } from "drizzle-orm";
import { generateAIResponse, withEthicalPreamble } from "./ai-provider";

function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  if (!user?.claims) return undefined;
  return user.claims.sub || user.claims.id;
}

function requireAuth(req: Request, res: any, next: any) {
  if (!getUserId(req)) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function registerProgramManagementRoutes(app: Express) {
  app.get("/api/program-management/projects", requireAuth, async (_req, res) => {
    try {
      const projects = await db.select().from(grantProjects).orderBy(desc(grantProjects.createdAt));
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/program-management/projects", requireAuth, async (req, res) => {
    try {
      const data = insertGrantProjectSchema.parse(req.body);
      const [project] = await db.insert(grantProjects).values(data).returning();
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.patch("/api/program-management/projects/:id", requireAuth, async (req, res) => {
    try {
      const [project] = await db.update(grantProjects).set(req.body).where(eq(grantProjects.id, req.params.id as string)).returning();
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/program-management/projects/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(grantProjects).where(eq(grantProjects.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.get("/api/program-management/projects/:projectId/staffing", requireAuth, async (req, res) => {
    try {
      const items = await db.select().from(staffingPlans).where(eq(staffingPlans.grantProjectId, req.params.projectId as string));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staffing plans" });
    }
  });

  app.post("/api/program-management/staffing", requireAuth, async (req, res) => {
    try {
      const data = insertStaffingPlanSchema.parse(req.body);
      const [item] = await db.insert(staffingPlans).values(data).returning();
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid staffing data" });
    }
  });

  app.patch("/api/program-management/staffing/:id", requireAuth, async (req, res) => {
    try {
      const [item] = await db.update(staffingPlans).set(req.body).where(eq(staffingPlans.id, req.params.id as string)).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update staffing plan" });
    }
  });

  app.delete("/api/program-management/staffing/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(staffingPlans).where(eq(staffingPlans.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete staffing plan" });
    }
  });

  app.get("/api/program-management/projects/:projectId/facilities", requireAuth, async (req, res) => {
    try {
      const items = await db.select().from(facilityPlans).where(eq(facilityPlans.grantProjectId, req.params.projectId as string));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facility plans" });
    }
  });

  app.post("/api/program-management/facilities", requireAuth, async (req, res) => {
    try {
      const data = insertFacilityPlanSchema.parse(req.body);
      const [item] = await db.insert(facilityPlans).values(data).returning();
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid facility data" });
    }
  });

  app.patch("/api/program-management/facilities/:id", requireAuth, async (req, res) => {
    try {
      const [item] = await db.update(facilityPlans).set(req.body).where(eq(facilityPlans.id, req.params.id as string)).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update facility plan" });
    }
  });

  app.delete("/api/program-management/facilities/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(facilityPlans).where(eq(facilityPlans.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete facility plan" });
    }
  });

  app.get("/api/program-management/projects/:projectId/schedules", requireAuth, async (req, res) => {
    try {
      const items = await db.select().from(programSchedules).where(eq(programSchedules.grantProjectId, req.params.projectId as string));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.post("/api/program-management/schedules", requireAuth, async (req, res) => {
    try {
      const data = insertProgramScheduleSchema.parse(req.body);
      const [item] = await db.insert(programSchedules).values(data).returning();
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid schedule data" });
    }
  });

  app.patch("/api/program-management/schedules/:id", requireAuth, async (req, res) => {
    try {
      const [item] = await db.update(programSchedules).set(req.body).where(eq(programSchedules.id, req.params.id as string)).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  app.delete("/api/program-management/schedules/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(programSchedules).where(eq(programSchedules.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

  app.get("/api/program-management/projects/:projectId/in-kind", requireAuth, async (req, res) => {
    try {
      const items = await db.select().from(inKindContributions).where(eq(inKindContributions.grantProjectId, req.params.projectId as string));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch in-kind contributions" });
    }
  });

  app.post("/api/program-management/in-kind", requireAuth, async (req, res) => {
    try {
      const data = insertInKindContributionSchema.parse(req.body);
      const [item] = await db.insert(inKindContributions).values(data).returning();
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid in-kind data" });
    }
  });

  app.patch("/api/program-management/in-kind/:id", requireAuth, async (req, res) => {
    try {
      const [item] = await db.update(inKindContributions).set(req.body).where(eq(inKindContributions.id, req.params.id as string)).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update in-kind contribution" });
    }
  });

  app.delete("/api/program-management/in-kind/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(inKindContributions).where(eq(inKindContributions.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete in-kind contribution" });
    }
  });

  app.get("/api/program-management/projects/:projectId/compliance", requireAuth, async (req, res) => {
    try {
      const items = await db.select().from(complianceCalendar).where(eq(complianceCalendar.grantProjectId, req.params.projectId as string));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance items" });
    }
  });

  app.post("/api/program-management/compliance", requireAuth, async (req, res) => {
    try {
      const data = insertComplianceCalendarSchema.parse(req.body);
      const [item] = await db.insert(complianceCalendar).values(data).returning();
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid compliance data" });
    }
  });

  app.patch("/api/program-management/compliance/:id", requireAuth, async (req, res) => {
    try {
      const [item] = await db.update(complianceCalendar).set(req.body).where(eq(complianceCalendar.id, req.params.id as string)).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update compliance item" });
    }
  });

  app.delete("/api/program-management/compliance/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(complianceCalendar).where(eq(complianceCalendar.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete compliance item" });
    }
  });

  app.get("/api/program-management/projects/:projectId/sustainability", requireAuth, async (req, res) => {
    try {
      const items = await db.select().from(sustainabilityPlans).where(eq(sustainabilityPlans.grantProjectId, req.params.projectId as string));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sustainability plans" });
    }
  });

  app.post("/api/program-management/sustainability", requireAuth, async (req, res) => {
    try {
      const data = insertSustainabilityPlanSchema.parse(req.body);
      const [item] = await db.insert(sustainabilityPlans).values(data).returning();
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid sustainability data" });
    }
  });

  app.patch("/api/program-management/sustainability/:id", requireAuth, async (req, res) => {
    try {
      const [item] = await db.update(sustainabilityPlans).set(req.body).where(eq(sustainabilityPlans.id, req.params.id as string)).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update sustainability plan" });
    }
  });

  app.delete("/api/program-management/sustainability/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(sustainabilityPlans).where(eq(sustainabilityPlans.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sustainability plan" });
    }
  });

  app.get("/api/program-management/projects/:projectId/agencies", requireAuth, async (req, res) => {
    try {
      const items = await db.select().from(adjacentAgencies).where(eq(adjacentAgencies.grantProjectId, req.params.projectId as string));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agencies" });
    }
  });

  app.post("/api/program-management/agencies", requireAuth, async (req, res) => {
    try {
      const data = insertAdjacentAgencySchema.parse(req.body);
      const [item] = await db.insert(adjacentAgencies).values(data).returning();
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid agency data" });
    }
  });

  app.patch("/api/program-management/agencies/:id", requireAuth, async (req, res) => {
    try {
      const [item] = await db.update(adjacentAgencies).set(req.body).where(eq(adjacentAgencies.id, req.params.id as string)).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update agency" });
    }
  });

  app.delete("/api/program-management/agencies/:id", requireAuth, async (req, res) => {
    try {
      await db.delete(adjacentAgencies).where(eq(adjacentAgencies.id, req.params.id as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete agency" });
    }
  });

  app.get("/api/program-management/dashboard", requireAuth, async (_req, res) => {
    try {
      const projects = await db.select().from(grantProjects);
      const allStaffing = await db.select().from(staffingPlans);
      const allFacilities = await db.select().from(facilityPlans);
      const allCompliance = await db.select().from(complianceCalendar);
      const allInKind = await db.select().from(inKindContributions);
      const allSustainability = await db.select().from(sustainabilityPlans);

      const staffFilled = allStaffing.filter(s => s.status === "hired" || s.status === "onboarded").length;
      const facilitiesSecured = allFacilities.filter(f => f.status === "secured").length;
      const complianceOnTrack = allCompliance.filter(c => c.status === "submitted" || c.status === "approved").length;
      const totalInKindValue = allInKind.reduce((sum, ik) => sum + parseFloat(ik.estimatedValue || "0"), 0);
      const sustainabilityEstablished = allSustainability.filter(s => s.status === "established" || s.status === "implementing").length;

      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const upcomingDeadlines = allCompliance.filter(c =>
        c.dueDate && c.dueDate >= today && c.dueDate <= thirtyDaysOut && c.status !== "submitted" && c.status !== "approved"
      );

      res.json({
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === "active" || p.status === "awarded").length,
        staffPositions: { total: allStaffing.length, filled: staffFilled, fillPercent: allStaffing.length ? Math.round((staffFilled / allStaffing.length) * 100) : 0 },
        facilities: { total: allFacilities.length, secured: facilitiesSecured, securedPercent: allFacilities.length ? Math.round((facilitiesSecured / allFacilities.length) * 100) : 0 },
        compliance: { total: allCompliance.length, onTrack: complianceOnTrack, onTrackPercent: allCompliance.length ? Math.round((complianceOnTrack / allCompliance.length) * 100) : 0 },
        inKindMatch: { totalValue: totalInKindValue, contributionCount: allInKind.length, verifiedCount: allInKind.filter(ik => ik.verificationStatus === "verified").length },
        sustainability: { total: allSustainability.length, established: sustainabilityEstablished },
        upcomingDeadlines,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/program-management/compliance-upcoming", requireAuth, async (_req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const ninetyDaysOut = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const items = await db.select().from(complianceCalendar);
      const upcoming = items.filter(c => c.dueDate && c.dueDate >= today && c.dueDate <= ninetyDaysOut)
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const sixtyDays = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      res.json({
        next30: upcoming.filter(c => c.dueDate && c.dueDate <= thirtyDays),
        next60: upcoming.filter(c => c.dueDate && c.dueDate > thirtyDays && c.dueDate <= sixtyDays),
        next90: upcoming.filter(c => c.dueDate && c.dueDate > sixtyDays),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming compliance" });
    }
  });

  app.post("/api/program-management/adjacent-agencies/discover", requireAuth, async (req, res) => {
    try {
      const { focusArea, location, grantProjectId } = req.body;
      if (!focusArea) return res.status(400).json({ error: "focusArea is required" });

      const prompt = `You are an expert in community development and grant program management. Given a grant project with focus area "${focusArea}" ${location ? `in the ${location} area` : ""}, suggest 5 adjacent agencies that could be partners, referral sources, or collaborators.

For each agency, provide:
- agencyName: A realistic organization name
- agencyType: one of "government", "nonprofit", "education", "healthcare", "faith-based", "business"
- focusArea: their primary focus
- relationship: one of "potential-partner", "referral-source", "funder"
- reasoning: why they would be a good fit

Return ONLY a JSON array of objects with these fields. No markdown, no extra text.`;

      const aiResponse = await generateAIResponse([
        { role: "system", content: withEthicalPreamble("You are a community partnership expert. Return only valid JSON arrays.") },
        { role: "user", content: prompt },
      ], 2000);

      let suggestions: any[] = [];
      try {
        const cleaned = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        suggestions = JSON.parse(cleaned);
      } catch {
        suggestions = [];
      }

      res.json({ suggestions, grantProjectId });
    } catch (error) {
      res.status(500).json({ error: "Failed to discover agencies" });
    }
  });
}
