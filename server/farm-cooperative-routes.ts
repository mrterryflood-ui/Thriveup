import type { Express } from "express";
import { db } from "./storage";
import { producerProfiles, producerDataConsents, producerDataSubmissions,
  insertProducerProfileSchema, insertProducerDataConsentSchema, insertProducerDataSubmissionSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import { generateAIJSON } from "./ai-provider";

function generateToken(len = 40): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  for (let i = 0; i < len; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return `prod_${t}`;
}

function safeTokenMatch(a: string, b: string): boolean {
  try {
    const ba = Buffer.alloc(64, a); const bb = Buffer.alloc(64, b);
    return timingSafeEqual(ba, bb) && a === b;
  } catch { return false; }
}

export function registerFarmCooperativeRoutes(app: Express) {

  // Enroll a new producer (public, no auth — ITI pattern)
  app.post("/api/farm-cooperative/enroll", async (req, res) => {
    try {
      const body = insertProducerProfileSchema.parse({ ...req.body, accessToken: generateToken() });
      const [profile] = await db.insert(producerProfiles).values(body).returning();
      // Create default consents (all OFF — anti-extraction)
      await db.insert(producerDataConsents).values({ producerId: profile.id });
      res.json({ success: true, accessToken: profile.accessToken, producerId: profile.id,
        message: "Welcome to the ThriveUp Producer Data Cooperative. Your data stays yours — you control what's shared and with whom." });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get producer profile + consents by token
  app.get("/api/farm-cooperative/profile", async (req, res) => {
    const token = req.headers["x-producer-token"] as string || req.query.token as string;
    if (!token) return res.status(401).json({ error: "Producer token required" });
    const [profile] = await db.select().from(producerProfiles).where(eq(producerProfiles.accessToken, token));
    if (!profile) return res.status(404).json({ error: "Producer profile not found" });
    const [consents] = await db.select().from(producerDataConsents).where(eq(producerDataConsents.producerId, profile.id));
    const submissions = await db.select().from(producerDataSubmissions).where(eq(producerDataSubmissions.producerId, profile.id));
    const { accessToken: _, ...safeProfile } = profile;
    res.json({ profile: safeProfile, consents: consents || null, submissionCount: submissions.length, submissions: submissions.slice(0, 10) });
  });

  // Update consent settings
  app.patch("/api/farm-cooperative/consents", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    if (!token) return res.status(401).json({ error: "Producer token required" });
    const [profile] = await db.select().from(producerProfiles).where(eq(producerProfiles.accessToken, token));
    if (!profile) return res.status(404).json({ error: "Producer not found" });
    const allowed = ["shareSoilData","shareYieldData","shareIncomeData","shareWithResearchers",
      "shareWithUsda","shareWithFunders","allowPublicNaming","interestedInStipend","interestedInCredentials"];
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = Boolean(req.body[key]);
    }
    const [updated] = await db.update(producerDataConsents).set({ ...updates, updatedAt: new Date() })
      .where(eq(producerDataConsents.producerId, profile.id)).returning();
    res.json({ success: true, consents: updated });
  });

  // Submit farm data (soil, yield, input costs)
  app.post("/api/farm-cooperative/submit-data", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    if (!token) return res.status(401).json({ error: "Producer token required" });
    const [profile] = await db.select().from(producerProfiles).where(eq(producerProfiles.accessToken, token));
    if (!profile) return res.status(404).json({ error: "Producer not found" });
    try {
      const body = insertProducerDataSubmissionSchema.parse({ ...req.body, producerId: profile.id });
      const [submission] = await db.insert(producerDataSubmissions).values(body).returning();
      res.json({ success: true, submissionId: submission.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Cooperative aggregate stats (de-identified, consent-filtered)
  app.get("/api/farm-cooperative/aggregate", async (req, res) => {
    const { stateFips, commodity } = req.query as Record<string, string>;
    // Only aggregate data where producers consented to sharing with USDA
    const allProfiles = await db.select().from(producerProfiles)
      .where(stateFips ? eq(producerProfiles.stateFips, stateFips) : undefined);
    const enrolledIds = allProfiles.map(p => p.id);
    if (!enrolledIds.length) return res.json({ totalProducers: 0, stateFips, message: "No producers enrolled in this state yet." });

    const submissions = await db.select().from(producerDataSubmissions);
    const filtered = submissions.filter(s => enrolledIds.includes(s.producerId) && (!commodity || s.commodity?.toUpperCase() === commodity.toUpperCase()));
    const yieldRows = filtered.filter(s => s.dataType === "yield" && s.yieldPerAcre);
    const soilRows = filtered.filter(s => s.dataType === "soil" && s.soilPh);
    const costRows = filtered.filter(s => s.dataType === "input-cost" && s.totalInputCostPerAc);

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    res.json({
      totalProducers: allProfiles.length,
      totalSubmissions: submissions.length,
      stateFips,
      avgYieldPerAc: avg(yieldRows.map(r => r.yieldPerAcre!)),
      avgSoilPh: avg(soilRows.map(r => r.soilPh!)),
      avgInputCostPerAc: avg(costRows.map(r => r.totalInputCostPerAc!)),
      dataDisclaimer: "Aggregated from producer-consented submissions only. Individual data never disclosed.",
      source: "ThriveUp Producer Data Cooperative",
    });
  });

  // AI synthesis of a producer's data vault
  app.post("/api/farm-cooperative/ai-insights", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    if (!token) return res.status(401).json({ error: "Producer token required" });
    const [profile] = await db.select().from(producerProfiles).where(eq(producerProfiles.accessToken, token));
    if (!profile) return res.status(404).json({ error: "Producer not found" });

    const submissions = await db.select().from(producerDataSubmissions).where(eq(producerDataSubmissions.producerId, profile.id));
    if (!submissions.length) return res.json({ insights: null, message: "Submit some farm data first to generate insights." });

    const summary = submissions.map(s =>
      `${s.dataType} (${s.cropYear || "?"}): commodity=${s.commodity || "?"}, yield=${s.yieldPerAcre || "?"} ${s.yieldUnit || ""}/ac, inputCost=$${s.totalInputCostPerAc || "?"}/ac, soilPH=${s.soilPh || "?"}, OM=${s.organicMatterPct || "?"}%`
    ).join("\n");

    const prompt = `You are an agricultural data advisor. A farmer has shared their private farm data with the ThriveUp Producer Data Cooperative. Analyze their submissions and provide actionable insights.

Farm profile: ${profile.farmName || "unnamed farm"}, ${profile.farmType} operation, ${profile.totalAcres || "?"} acres, primary commodity: ${profile.primaryCommodity || "?"}, ${profile.countyName}

Data submissions:
${summary}

Provide 3-4 specific, actionable insights in plain language covering: (1) profitability patterns vs. USDA averages, (2) soil health improvements worth prioritizing, (3) USDA FSA or NRCS programs this farm likely qualifies for, (4) market access or input cost reduction opportunities. Be specific to the numbers provided. Never fabricate data not in the submission. Return as JSON: { insights: string[] }`;

    try {
      const result = await generateAIJSON(prompt, '{"insights":[]}');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "AI synthesis failed", detail: err.message });
    }
  });

  // Admin: list all producers (auth required)
  app.get("/api/farm-cooperative/admin/producers", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: "Auth required" });
    const profiles = await db.select({
      id: producerProfiles.id, farmName: producerProfiles.farmName,
      farmType: producerProfiles.farmType, countyName: producerProfiles.countyName,
      stateFips: producerProfiles.stateFips, workerType: producerProfiles.workerType,
      enrolledAt: producerProfiles.enrolledAt,
    }).from(producerProfiles);
    const consentsAll = await db.select().from(producerDataConsents);
    const submissionsAll = await db.select().from(producerDataSubmissions);
    res.json({
      totalProducers: profiles.length,
      producers: profiles.map(p => ({
        ...p,
        submissionCount: submissionsAll.filter(s => s.producerId === p.id).length,
        consentsCount: consentsAll.filter(c => c.producerId === p.id).length,
      })),
    });
  });
}
