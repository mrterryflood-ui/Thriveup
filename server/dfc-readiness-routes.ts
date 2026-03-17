import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  mediaCampaigns, campaignContent, campaignMetrics,
  dfcReadinessItems, stakeholderCommitments,
  insertMediaCampaignSchema, insertCampaignContentSchema,
  insertCampaignMetricSchema, insertDfcReadinessItemSchema,
  insertStakeholderCommitmentSchema,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

const DEFAULT_READINESS_ITEMS = [
  { category: "pre_application", title: "Active SAM.gov Registration", description: "Verify SAM.gov registration is active and not expired", sortOrder: 1 },
  { category: "pre_application", title: "Unique Entity Identifier (UEI)", description: "Obtain and verify UEI number", sortOrder: 2 },
  { category: "pre_application", title: "Grants.gov Account", description: "Active Grants.gov account with submission capability", sortOrder: 3 },
  { category: "pre_application", title: "501(c)(3) or Eligible Entity Documentation", description: "Valid tax-exempt status documentation", sortOrder: 4 },
  { category: "pre_application", title: "DUNS Number (if applicable)", description: "Data Universal Numbering System number", sortOrder: 5 },
  { category: "coalition_eligibility", title: "12-Sector Representation", description: "All 12 DFC sectors have active representatives", sortOrder: 6, linkUrl: "/coalition" },
  { category: "coalition_eligibility", title: "No Prior DFC Funding", description: "Coalition has not previously received DFC funding", sortOrder: 7 },
  { category: "coalition_eligibility", title: "Coalition Formation Date", description: "Document coalition formation date and activity history", sortOrder: 8 },
  { category: "coalition_eligibility", title: "Community Needs Assessment", description: "Completed community-level needs assessment", sortOrder: 9 },
  { category: "coalition_eligibility", title: "Strategic Plan", description: "Current strategic prevention plan exists", sortOrder: 10 },
  { category: "application_component", title: "Project Narrative Draft", description: "Complete project narrative addressing all required sections", sortOrder: 11, linkUrl: "/grant-narrative" },
  { category: "application_component", title: "Logic Model", description: "Complete logic model with inputs, activities, outputs, outcomes", sortOrder: 12, linkUrl: "/logic-model" },
  { category: "application_component", title: "Budget & Budget Justification", description: "Detailed budget with line-item justification", sortOrder: 13 },
  { category: "application_component", title: "Letters of Support/Commitment", description: "Letters from coalition members and community partners", sortOrder: 14, linkUrl: "/partners" },
  { category: "application_component", title: "MOU Documentation", description: "Memoranda of Understanding from key partners", sortOrder: 15, linkUrl: "/partners" },
  { category: "application_component", title: "Data Collection Plan", description: "Plan for collecting core measures and evaluation data", sortOrder: 16 },
  { category: "application_component", title: "Evaluation Plan", description: "Process and outcome evaluation methodology", sortOrder: 17 },
  { category: "application_component", title: "Sustainability Plan", description: "Plan for continuing coalition work beyond funding period", sortOrder: 18 },
  { category: "application_component", title: "Cultural Competency Plan", description: "Plan addressing cultural responsiveness and equity", sortOrder: 19 },
];

async function seedReadinessItems() {
  try {
    const existing = await db.select().from(dfcReadinessItems);
    if (existing.length > 0) return;
    for (const item of DEFAULT_READINESS_ITEMS) {
      await db.insert(dfcReadinessItems).values(item);
    }
    console.log("[dfc-readiness] Seeded default readiness checklist items");
  } catch (e) {
    console.error("[dfc-readiness] Seed error:", e);
  }
}

export function registerDfcReadinessRoutes(app: Express) {
  seedReadinessItems();

  app.get("/api/dfc-readiness/items", async (_req, res) => {
    try {
      const items = await db.select().from(dfcReadinessItems).orderBy(dfcReadinessItems.sortOrder);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch readiness items:", error);
      res.status(500).json({ error: "Failed to fetch readiness items" });
    }
  });

  app.patch("/api/dfc-readiness/items/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertDfcReadinessItemSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(dfcReadinessItems).set(allowed.data).where(eq(dfcReadinessItems.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update readiness item:", error);
      res.status(500).json({ error: "Failed to update readiness item" });
    }
  });

  app.get("/api/dfc-readiness/dashboard", async (_req, res) => {
    try {
      const items = await db.select().from(dfcReadinessItems);
      const campaigns = await db.select().from(mediaCampaigns);
      const commitments = await db.select().from(stakeholderCommitments);

      const total = items.length;
      const completed = items.filter(i => i.status === "completed").length;
      const inProgress = items.filter(i => i.status === "in_progress").length;
      const readinessScore = total > 0 ? Math.round((completed / total) * 100) : 0;

      const byCategory: Record<string, { total: number; completed: number }> = {};
      for (const item of items) {
        if (!byCategory[item.category]) byCategory[item.category] = { total: 0, completed: 0 };
        byCategory[item.category].total++;
        if (item.status === "completed") byCategory[item.category].completed++;
      }

      const activeCampaigns = campaigns.filter(c => c.status === "active").length;
      const totalCommitments = commitments.length;
      const deliveredCommitments = commitments.filter(c => c.status === "delivered").length;

      res.json({
        readinessScore,
        totalItems: total,
        completedItems: completed,
        inProgressItems: inProgress,
        byCategory,
        activeCampaigns,
        totalCampaigns: campaigns.length,
        totalCommitments,
        deliveredCommitments,
      });
    } catch (error) {
      console.error("Failed to fetch readiness dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/media-campaigns", async (_req, res) => {
    try {
      const campaigns = await db.select().from(mediaCampaigns).orderBy(desc(mediaCampaigns.createdAt));
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/media-campaigns", requireAuth, async (req, res) => {
    try {
      const parsed = insertMediaCampaignSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [campaign] = await db.insert(mediaCampaigns).values(parsed.data).returning();
      res.json(campaign);
    } catch (error) {
      console.error("Failed to create campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/media-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertMediaCampaignSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(mediaCampaigns).set(allowed.data).where(eq(mediaCampaigns.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/media-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      await db.delete(campaignMetrics).where(eq(campaignMetrics.campaignId, id));
      await db.delete(campaignContent).where(eq(campaignContent.campaignId, id));
      await db.delete(mediaCampaigns).where(eq(mediaCampaigns.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  app.get("/api/media-campaigns/:id/content", async (req, res) => {
    try {
      const campaignId = req.params.id as string;
      const content = await db.select().from(campaignContent).where(eq(campaignContent.campaignId, campaignId)).orderBy(desc(campaignContent.createdAt));
      res.json(content);
    } catch (error) {
      console.error("Failed to fetch campaign content:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/campaign-content", requireAuth, async (req, res) => {
    try {
      const parsed = insertCampaignContentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [content] = await db.insert(campaignContent).values(parsed.data).returning();
      res.json(content);
    } catch (error) {
      console.error("Failed to create content:", error);
      res.status(500).json({ error: "Failed to create content" });
    }
  });

  app.get("/api/media-campaigns/:id/metrics", async (req, res) => {
    try {
      const campaignId = req.params.id as string;
      const metrics = await db.select().from(campaignMetrics).where(eq(campaignMetrics.campaignId, campaignId)).orderBy(desc(campaignMetrics.createdAt));
      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.post("/api/campaign-metrics", requireAuth, async (req, res) => {
    try {
      const parsed = insertCampaignMetricSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [metric] = await db.insert(campaignMetrics).values(parsed.data).returning();
      res.json(metric);
    } catch (error) {
      console.error("Failed to create metric:", error);
      res.status(500).json({ error: "Failed to create metric" });
    }
  });

  app.get("/api/stakeholder-commitments", async (_req, res) => {
    try {
      const commitments = await db.select().from(stakeholderCommitments).orderBy(stakeholderCommitments.sectorNumber);
      res.json(commitments);
    } catch (error) {
      console.error("Failed to fetch commitments:", error);
      res.status(500).json({ error: "Failed to fetch commitments" });
    }
  });

  app.post("/api/stakeholder-commitments", requireAuth, async (req, res) => {
    try {
      const parsed = insertStakeholderCommitmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [commitment] = await db.insert(stakeholderCommitments).values(parsed.data).returning();
      res.json(commitment);
    } catch (error) {
      console.error("Failed to create commitment:", error);
      res.status(500).json({ error: "Failed to create commitment" });
    }
  });

  app.patch("/api/stakeholder-commitments/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      const allowed = insertStakeholderCommitmentSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(stakeholderCommitments).set(allowed.data).where(eq(stakeholderCommitments.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update commitment:", error);
      res.status(500).json({ error: "Failed to update commitment" });
    }
  });

  app.delete("/api/stakeholder-commitments/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as string;
      await db.delete(stakeholderCommitments).where(eq(stakeholderCommitments.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete commitment:", error);
      res.status(500).json({ error: "Failed to delete commitment" });
    }
  });
}
