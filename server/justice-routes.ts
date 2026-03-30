import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  justiceReferrals, supervisionCompliance, reentryPlans, reentryMilestones, outcomeTracking,
  insertJusticeReferralSchema, insertSupervisionComplianceSchema,
  juvenileCases, courtServices, selPrograms, preventionPrograms,
  justiceStakeholders, neighborhoodIntelligence, trendAlerts, cycleBreakingSessions,
  insertJuvenileCaseSchema, insertCourtServiceSchema, insertSelProgramSchema,
  insertPreventionProgramSchema, insertJusticeStakeholderSchema,
  insertNeighborhoodIntelligenceSchema, insertTrendAlertSchema, insertCycleBreakingSessionSchema,
  rpliceAssessments,
} from "@shared/schema";
import type { ReentryMilestone, OutcomeTracking, SupervisionCompliance as SupervisionComplianceType } from "@shared/schema";
import { z } from "zod";
import { eq, desc, sql, and, gte, count } from "drizzle-orm";
import { generateAIResponse } from "./ai-provider";

const requireApiKey = (req: Request, res: Response, next: Function) => {
  const rawKey = req.headers["x-api-key"];
  const validKey = process.env.CROSS_PLATFORM_API_KEY;
  if (!validKey) return res.status(503).json({ error: "API key not configured" });
  const apiKey = typeof rawKey === "string" ? rawKey.trim() : null;
  if (!apiKey || apiKey !== validKey) return res.status(401).json({ error: "Invalid or missing API key" });
  next();
};

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher" || user?.role === "case_manager") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

const JUSTICE_RAG_KNOWLEDGE = [
  {
    category: "prevention",
    title: "Evidence-Based Prevention Science",
    content: `Prevention operates at three levels: Primary (universal — reaches all youth before risk), Secondary (selective — targets at-risk populations), Tertiary (indicated — intervenes with youth showing early problem behaviors). Evidence-based programs include: Functional Family Therapy (FFT), Multisystemic Therapy (MST), Blueprints for Healthy Youth Development certified programs. CASEL's SEL framework identifies five core competencies: self-awareness, self-management, social awareness, relationship skills, responsible decision-making. Risk factors: poverty, family dysfunction, peer delinquency, school failure, substance use, community disorganization, lack of positive role models. Protective factors: strong family bonds, school engagement, prosocial peer group, community mentors, faith community involvement, father/role model engagement.`
  },
  {
    category: "intervention",
    title: "Diversion & Intervention Models",
    content: `Diversion programs redirect youth from formal justice processing. Models: Pre-arrest diversion (police-led, crisis intervention), Pre-adjudication diversion (prosecutor-led), Post-adjudication diversion (court-ordered alternatives). Restorative justice: victim-offender mediation, community conferencing, circle sentencing. Teen/youth courts, mentoring programs, community service alternatives. Drug courts, mental health courts, veterans treatment courts. Research shows diversion reduces recidivism by 20-40% compared to traditional processing. Implementation fidelity is critical — programs delivered without fidelity show no effect.`
  },
  {
    category: "reentry",
    title: "Reentry & Recidivism Prevention",
    content: `Second Chance Act principles: individualized reentry plans, wraparound services, continuity of care, community supervision with support. Critical reentry domains: housing, employment, behavioral health, family reunification, education/credentials, substance abuse treatment, mentoring. Risk-Needs-Responsivity (RNR) model: match intervention intensity to risk level, target criminogenic needs, deliver in responsive manner. Desistance theory: identity transformation, social bonds, agency/self-efficacy, hope. Institutional barriers: collateral consequences of conviction, employment discrimination, housing restrictions, voting rights, licensing barriers. Ban-the-box, fair chance hiring, WOTC employer incentives.`
  },
  {
    category: "community",
    title: "Community-Based Violence Prevention",
    content: `CURE Violence model: treat violence as public health epidemic, use credible messengers/interrupters. Community coalitions: churches, schools, law enforcement, fathers/male role models, businesses, nonprofits, government agencies, formerly incarcerated leaders. Geographic targeting: hotspot policing combined with community investment, place-based strategies. Collective efficacy theory: social cohesion + willingness to intervene = reduced violence. Three Realities applied: What systems designed vs. what communities experience vs. what at-risk individuals actually need. Faith-based reentry: churches as reentry hubs, pastoral counseling, family support, job networks.`
  },
  {
    category: "data_analysis",
    title: "Criminal Justice Data & Trends",
    content: `Key indicators: arrest rates by type/age/neighborhood, recidivism rates (1-year, 3-year, 5-year), diversion completion rates, program enrollment vs completion, school-to-prison pipeline metrics (suspensions, expulsions, referrals), community safety indicators, employment outcomes post-release. GIS mapping: crime hotspots, resource deserts, service overlays, demographic patterns. Trend analysis: seasonal patterns, year-over-year comparisons, leading indicators (truancy, school behavior, substance use). Early warning signals: spikes in juvenile referrals, clustering of incidents, emerging gang activity, school dropout increases.`
  },
  {
    category: "implementation_science",
    title: "RPLICE & MAP-GAP for Justice Programs",
    content: `RPLICE Decision Framework applied to criminal justice: Research (evidence base for program model), Plan (adaptation for local context/population), Launch (structured rollout with training), Implement (deliver with fidelity monitoring), Check (measure outcomes against benchmarks), Evolve (improve based on data). CFIR 2.0 constructs for justice: Innovation characteristics (program model fit), Outer setting (policy environment, funding), Inner setting (organization capacity, culture), Individuals (staff competency, community readiness), Implementation process (training, supervision, adaptation). RE-AIM for justice: Reach (% of target population served), Effectiveness (recidivism reduction, positive outcomes), Adoption (stakeholder buy-in, sites implementing), Implementation (fidelity, cost), Maintenance (sustainability, policy integration). MAP-GAP: Measure current state → Analyze gaps → Plan improvements → Gap documentation → Action execution → Progress tracking.`
  },
  {
    category: "sel_framework",
    title: "Social-Emotional Learning for Justice-Involved Youth",
    content: `CASEL SEL Framework adapted for justice context: Self-Awareness (recognizing emotions, triggers, trauma responses), Self-Management (impulse control, goal-setting, anger management), Social Awareness (empathy, perspective-taking, cultural competency), Relationship Skills (communication, conflict resolution, help-seeking), Responsible Decision-Making (consequence evaluation, ethical reasoning). Trauma-informed SEL: ACEs screening, trauma-responsive teaching, restorative practices, mindfulness-based interventions. Evidence-based SEL programs for justice populations: Aggression Replacement Training (ART), Thinking for a Change (T4C), Moral Reconation Therapy (MRT), Cognitive Behavioral Interventions for Justice-Involved Youth. SEL assessment tools: DESSA (Devereux Student Strengths Assessment), SDQ (Strengths and Difficulties Questionnaire), pre/post behavioral assessments.`
  }
];

function getJusticeRAGContext(query: string): string {
  const queryLower = query.toLowerCase();
  const relevant = JUSTICE_RAG_KNOWLEDGE.filter(k => {
    const words = k.content.toLowerCase().split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    return queryWords.some(qw => qw.length > 3 && (k.category.includes(qw) || k.title.toLowerCase().includes(qw) || words.some(w => w.includes(qw))));
  });
  if (relevant.length === 0) return JUSTICE_RAG_KNOWLEDGE.map(k => k.content).join("\n\n");
  return relevant.map(k => `[${k.title}]\n${k.content}`).join("\n\n");
}

const externalReferralSchema = insertJusticeReferralSchema.pick({
  externalReferralId: true, agencyName: true, agencyType: true,
  userId: true, releaseDate: true,
  supervisionLevel: true, offenseCategory: true,
  supervisionRequirements: true, demographicData: true,
  assignedPlanId: true, notes: true,
});

const referralUpdateSchema = z.object({
  status: z.enum(["received", "assigned", "active", "completed", "declined"]).optional(),
  assignedPlanId: z.string().optional(),
  notes: z.string().optional(),
});

const complianceCreateSchema = insertSupervisionComplianceSchema.pick({
  userId: true, complianceType: true, scheduledDate: true,
  completedDate: true, status: true, notes: true, verifiedBy: true,
});

const complianceUpdateSchema = z.object({
  status: z.enum(["pending", "completed", "missed", "excused"]).optional(),
  completedDate: z.string().optional(),
  notes: z.string().optional(),
  verifiedBy: z.string().optional(),
});

export function registerJusticeRoutes(app: Express) {

  app.post("/api/external/justice/referrals", requireApiKey, async (req, res) => {
    try {
      const parsed = externalReferralSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid referral data", details: parsed.error.flatten().fieldErrors });
      const [referral] = await db.insert(justiceReferrals).values(parsed.data).returning();
      res.json({ received: true, referralId: referral.id, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Failed to create referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.get("/api/external/justice/referrals/:id/progress", requireApiKey, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [referral] = await db.select().from(justiceReferrals).where(eq(justiceReferrals.id, id));
      if (!referral) return res.status(404).json({ error: "Referral not found" });
      let planData = null;
      let milestoneData: ReentryMilestone[] = [];
      if (referral.assignedPlanId) {
        const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, referral.assignedPlanId));
        planData = plan || null;
        if (plan) milestoneData = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, plan.id));
      }
      let compliance: SupervisionComplianceType[] = [];
      if (referral.userId) compliance = await db.select().from(supervisionCompliance).where(eq(supervisionCompliance.userId, referral.userId)).orderBy(desc(supervisionCompliance.createdAt));
      res.json({
        referralId: referral.id, status: referral.status,
        plan: planData ? { phase: planData.phase, status: planData.status, riskLevel: planData.riskLevel } : null,
        milestones: { total: milestoneData.length, completed: milestoneData.filter(m => m.status === "completed").length, details: milestoneData.map(m => ({ title: m.title, category: m.category, status: m.status, completedDate: m.completedDate })) },
        compliance: compliance.map(c => ({ type: c.complianceType, scheduledDate: c.scheduledDate, completedDate: c.completedDate, status: c.status })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/external/justice/referrals/:id/report", requireApiKey, async (req, res) => {
    try {
      const id = req.params.id as string;
      const [referral] = await db.select().from(justiceReferrals).where(eq(justiceReferrals.id, id));
      if (!referral) return res.status(404).json({ error: "Referral not found" });
      let planData = null; let milestoneData: ReentryMilestone[] = []; let outcomes: OutcomeTracking[] = [];
      if (referral.assignedPlanId) {
        const [plan] = await db.select().from(reentryPlans).where(eq(reentryPlans.id, referral.assignedPlanId));
        planData = plan || null;
        if (plan) milestoneData = await db.select().from(reentryMilestones).where(eq(reentryMilestones.planId, plan.id));
      }
      if (referral.userId) outcomes = await db.select().from(outcomeTracking).where(eq(outcomeTracking.userId, referral.userId));
      const compliance = referral.userId ? await db.select().from(supervisionCompliance).where(eq(supervisionCompliance.userId, referral.userId)) : [];
      res.json({
        reportType: "Court-Ready Progress Report", generatedAt: new Date().toISOString(),
        referral: { id: referral.id, externalReferralId: referral.externalReferralId, agencyName: referral.agencyName, referralDate: referral.referralDate, status: referral.status },
        programParticipation: { planPhase: planData?.phase || "not_assigned", planStatus: planData?.status || "not_assigned", riskLevel: planData?.riskLevel || "unknown", enrollmentDate: planData?.createdAt },
        milestoneProgress: { total: milestoneData.length, completed: milestoneData.filter(m => m.status === "completed").length, inProgress: milestoneData.filter(m => m.status === "in_progress").length, milestones: milestoneData.map(m => ({ title: m.title, category: m.category, phase: m.phase, status: m.status, targetDate: m.targetDate, completedDate: m.completedDate })) },
        supervisionCompliance: { totalCheckins: compliance.length, completed: compliance.filter(c => c.status === "completed").length, complianceRate: compliance.length > 0 ? Math.round((compliance.filter(c => c.status === "completed").length / compliance.length) * 100) : 0, records: compliance.map(c => ({ type: c.complianceType, scheduled: c.scheduledDate, completed: c.completedDate, status: c.status })) },
        outcomes: outcomes.map(o => ({ category: o.category, metric: o.metricName, value: o.metricValue, date: o.measurementDate })),
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/justice/referrals", async (_req, res) => {
    try {
      const referrals = await db.select().from(justiceReferrals).orderBy(desc(justiceReferrals.createdAt));
      res.json(referrals);
    } catch (error) { res.status(500).json({ error: "Failed to fetch referrals" }); }
  });

  app.patch("/api/justice/referrals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = referralUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten().fieldErrors });
      const [updated] = await db.update(justiceReferrals).set({ ...parsed.data, updatedAt: new Date() }).where(eq(justiceReferrals.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) { res.status(500).json({ error: "Failed to update referral" }); }
  });

  app.get("/api/justice/compliance", async (_req, res) => {
    try {
      const records = await db.select().from(supervisionCompliance).orderBy(desc(supervisionCompliance.createdAt));
      res.json(records);
    } catch (error) { res.status(500).json({ error: "Failed to fetch compliance" }); }
  });

  app.post("/api/justice/compliance", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = complianceCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid compliance data", details: parsed.error.flatten().fieldErrors });
      const [record] = await db.insert(supervisionCompliance).values(parsed.data).returning();
      res.json(record);
    } catch (error) { res.status(500).json({ error: "Failed to create compliance record" }); }
  });

  app.patch("/api/justice/compliance/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = complianceUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid update data" }); 
      const updateData: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.completedDate) updateData.completedDate = new Date(parsed.data.completedDate);
      const [updated] = await db.update(supervisionCompliance).set(updateData).where(eq(supervisionCompliance.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) { res.status(500).json({ error: "Failed to update compliance" }); }
  });

  app.get("/api/external/justice/health", requireApiKey, async (_req, res) => {
    res.json({ status: "ok", platform: "ThriveUp Academy - Justice Command Center", version: "2.0", timestamp: new Date().toISOString() });
  });

  app.get("/api/justice/command-center/stats", async (_req, res) => {
    try {
      const [refCount] = await db.select({ count: count() }).from(justiceReferrals);
      const [juvCount] = await db.select({ count: count() }).from(juvenileCases);
      const [courtCount] = await db.select({ count: count() }).from(courtServices);
      const [selCount] = await db.select({ count: count() }).from(selPrograms);
      const [prevCount] = await db.select({ count: count() }).from(preventionPrograms);
      const [stakCount] = await db.select({ count: count() }).from(justiceStakeholders);
      const [nbrCount] = await db.select({ count: count() }).from(neighborhoodIntelligence);
      const [alertCount] = await db.select({ count: count() }).from(trendAlerts).where(eq(trendAlerts.status, "active"));
      const [planCount] = await db.select({ count: count() }).from(reentryPlans);
      const [sessionCount] = await db.select({ count: count() }).from(cycleBreakingSessions);
      res.json({
        totalReferrals: refCount?.count || 0,
        juvenileCases: juvCount?.count || 0,
        courtServices: courtCount?.count || 0,
        selPrograms: selCount?.count || 0,
        preventionPrograms: prevCount?.count || 0,
        activeStakeholders: stakCount?.count || 0,
        neighborhoodsMonitored: nbrCount?.count || 0,
        activeAlerts: alertCount?.count || 0,
        reentryPlans: planCount?.count || 0,
        cycleBreakingSessions: sessionCount?.count || 0,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/justice/juvenile-cases", async (_req, res) => {
    try {
      const cases = await db.select().from(juvenileCases).orderBy(desc(juvenileCases.createdAt));
      res.json(cases);
    } catch (error) { res.status(500).json({ error: "Failed to fetch juvenile cases" }); }
  });

  app.post("/api/justice/juvenile-cases", async (req, res) => {
    try {
      const parsed = insertJuvenileCaseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(juvenileCases).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create juvenile case" }); }
  });

  app.get("/api/justice/court-services", async (_req, res) => {
    try {
      const services = await db.select().from(courtServices).orderBy(desc(courtServices.createdAt));
      res.json(services);
    } catch (error) { res.status(500).json({ error: "Failed to fetch court services" }); }
  });

  app.post("/api/justice/court-services", async (req, res) => {
    try {
      const parsed = insertCourtServiceSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(courtServices).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create court service" }); }
  });

  app.get("/api/justice/sel-programs", async (_req, res) => {
    try {
      const programs = await db.select().from(selPrograms).orderBy(desc(selPrograms.createdAt));
      res.json(programs);
    } catch (error) { res.status(500).json({ error: "Failed to fetch SEL programs" }); }
  });

  app.post("/api/justice/sel-programs", async (req, res) => {
    try {
      const parsed = insertSelProgramSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(selPrograms).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create SEL program" }); }
  });

  app.get("/api/justice/prevention-programs", async (_req, res) => {
    try {
      const programs = await db.select().from(preventionPrograms).orderBy(desc(preventionPrograms.createdAt));
      res.json(programs);
    } catch (error) { res.status(500).json({ error: "Failed to fetch prevention programs" }); }
  });

  app.post("/api/justice/prevention-programs", async (req, res) => {
    try {
      const parsed = insertPreventionProgramSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(preventionPrograms).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create prevention program" }); }
  });

  app.get("/api/justice/stakeholders", async (_req, res) => {
    try {
      const stakeholders = await db.select().from(justiceStakeholders).orderBy(desc(justiceStakeholders.createdAt));
      res.json(stakeholders);
    } catch (error) { res.status(500).json({ error: "Failed to fetch stakeholders" }); }
  });

  app.post("/api/justice/stakeholders", async (req, res) => {
    try {
      const parsed = insertJusticeStakeholderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(justiceStakeholders).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create stakeholder" }); }
  });

  app.get("/api/justice/neighborhoods", async (_req, res) => {
    try {
      const neighborhoods = await db.select().from(neighborhoodIntelligence).orderBy(desc(neighborhoodIntelligence.updatedAt));
      res.json(neighborhoods);
    } catch (error) { res.status(500).json({ error: "Failed to fetch neighborhoods" }); }
  });

  app.post("/api/justice/neighborhoods", async (req, res) => {
    try {
      const parsed = insertNeighborhoodIntelligenceSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(neighborhoodIntelligence).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create neighborhood" }); }
  });

  app.get("/api/justice/trend-alerts", async (_req, res) => {
    try {
      const alerts = await db.select().from(trendAlerts).orderBy(desc(trendAlerts.createdAt));
      res.json(alerts);
    } catch (error) { res.status(500).json({ error: "Failed to fetch alerts" }); }
  });

  app.post("/api/justice/trend-alerts", async (req, res) => {
    try {
      const parsed = insertTrendAlertSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(trendAlerts).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create alert" }); }
  });

  app.get("/api/justice/cycle-breaking-sessions", async (_req, res) => {
    try {
      const sessions = await db.select().from(cycleBreakingSessions).orderBy(desc(cycleBreakingSessions.createdAt));
      res.json(sessions);
    } catch (error) { res.status(500).json({ error: "Failed to fetch sessions" }); }
  });

  app.post("/api/justice/cycle-breaking-sessions", async (req, res) => {
    try {
      const parsed = insertCycleBreakingSessionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(cycleBreakingSessions).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create session" }); }
  });

  app.patch("/api/justice/cycle-breaking-sessions/:id", async (req, res) => {
    try {
      const [updated] = await db.update(cycleBreakingSessions).set({ ...req.body, updatedAt: new Date() }).where(eq(cycleBreakingSessions.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) { res.status(500).json({ error: "Failed to update session" }); }
  });

  app.post("/api/justice/ai/analyze-trends", async (req, res) => {
    try {
      const { area, timeframe, dataType } = req.body;
      const ragContext = getJusticeRAGContext(`trends ${area || ""} ${dataType || ""} patterns analysis`);
      const alerts = await db.select().from(trendAlerts).orderBy(desc(trendAlerts.createdAt)).limit(10);
      const neighborhoods = await db.select().from(neighborhoodIntelligence).limit(20);
      const prompt = `You are the AI analytics engine for the Justice & Community Safety Command Center, part of the ThriveUp Academy 24-platform ecosystem by Dr. Terry Flood, DHA (MSCJ, Implementation Science). Analyze trends and patterns for criminal justice prevention, intervention, and community safety.

KNOWLEDGE BASE:
${ragContext}

CURRENT ACTIVE ALERTS:
${JSON.stringify(alerts.map(a => ({ type: a.alertType, severity: a.severity, title: a.title, area: a.affectedArea })), null, 2)}

NEIGHBORHOOD DATA:
${JSON.stringify(neighborhoods.map(n => ({ name: n.neighborhood, city: n.city, state: n.stateCode, crimeIndex: n.crimeIndex, hotspot: n.hotspotLevel, trend: n.trendDirection })), null, 2)}

USER REQUEST: Analyze trends for area="${area || "nationwide"}", timeframe="${timeframe || "current"}", dataType="${dataType || "all"}"

Provide a structured analysis with:
1. CURRENT TRENDS — What patterns are emerging
2. WARNING SIGNALS — Early warning indicators that need attention
3. ROOT CAUSES — Institutional barriers and systemic factors driving these patterns
4. EVIDENCE-BASED INTERVENTIONS — What the research says works, with implementation science (RPLICE) considerations
5. COMMUNITY ACTION STEPS — Specific actions for stakeholders (schools, churches, fathers/mentors, law enforcement, courts, businesses)
6. FIDELITY CONSIDERATIONS — How to ensure programs are delivered as designed (MAP-GAP checkpoints)

Format as JSON with keys: trends, warnings, rootCauses, interventions, communityActions, fidelityChecks`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 3000);
      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawAnalysis: aiResponse };
      } catch { parsed = { rawAnalysis: aiResponse }; }
      res.json({ analysis: parsed, timestamp: new Date().toISOString(), dataPoints: { alerts: alerts.length, neighborhoods: neighborhoods.length } });
    } catch (error) {
      console.error("Trend analysis error:", error);
      res.status(500).json({ error: "Failed to analyze trends" });
    }
  });

  app.post("/api/justice/ai/cycle-breaking-wizard", async (req, res) => {
    try {
      const { step, sessionData, userInput } = req.body;
      const currentStep = step || 1;
      const ragContext = getJusticeRAGContext(`cycle breaking ${sessionData?.targetCycle || ""} intervention prevention`);

      const wizardSteps = [
        { step: 1, name: "Identify the Cycle", prompt: "Help the user identify the specific cycle they want to break (e.g., generational incarceration, school-to-prison pipeline, recidivism, community violence cycle, substance abuse cycle). Ask clarifying questions about the population, geography, and current patterns." },
        { step: 2, name: "Map Current Patterns", prompt: "Based on the identified cycle, map the current patterns. What are the triggers, perpetuating factors, institutional barriers, and community dynamics? Use Three Realities: What does the system see vs. what do communities experience vs. what do at-risk individuals actually face?" },
        { step: 3, name: "Assess Root Causes", prompt: "Identify root causes using evidence-based frameworks. Consider: poverty, trauma/ACEs, educational gaps, family dysfunction, peer influence, community disorganization, institutional racism/barriers, lack of positive role models, substance abuse, mental health gaps." },
        { step: 4, name: "Design Interventions", prompt: "Design evidence-based interventions for each level: Prevention (universal, selective, indicated), Intervention (diversion, restorative justice, alternative sentencing), Reentry (wraparound services, family reunification, employment). Include SEL components and stakeholder roles." },
        { step: 5, name: "Stakeholder Coordination", prompt: "Map stakeholders and their roles: Schools (SEL, early identification), Churches (mentoring, family support, reentry hubs), Fathers/Role Models (prevention specialists, credible messengers), Law Enforcement (community policing, diversion), Courts (alternative sentencing, treatment courts), Employers (second-chance hiring, WOTC), Community Organizations (wraparound services)." },
        { step: 6, name: "Implementation Plan", prompt: "Create a RPLICE-based implementation plan: Research phase (evidence review, community assessment), Plan (adapt for local context, secure stakeholder buy-in), Launch (training, pilot sites, communication plan), Implement (fidelity monitoring, MAP-GAP checkpoints), Check (outcome measurement, early wins), Evolve (continuous improvement, scale what works)." },
        { step: 7, name: "Fidelity & Monitoring", prompt: "Design fidelity monitoring using MAP-GAP: What to Measure (process fidelity, outcome metrics, stakeholder engagement), How to Analyze (CFIR 2.0 constructs, RE-AIM framework), How to maintain Progress (quarterly reviews, community feedback loops, adjustment protocols). Set specific benchmarks and early warning triggers." },
      ];

      const currentWizardStep = wizardSteps.find(s => s.step === currentStep) || wizardSteps[0];

      const prompt = `You are the AI-powered Cycle-Breaking Wizard for the Justice & Community Safety Command Center, part of Dr. Terry Flood's (DHA, MSCJ) ThriveUp Academy ecosystem. You help communities break destructive cycles through evidence-based, implementation-science-driven approaches.

KNOWLEDGE BASE:
${ragContext}

WIZARD STEP ${currentStep} of 7: "${currentWizardStep.name}"
INSTRUCTION: ${currentWizardStep.prompt}

SESSION DATA SO FAR:
${JSON.stringify(sessionData || {}, null, 2)}

USER INPUT: "${userInput || "Starting new session"}"

Respond with a JSON object containing:
- "guidance": Your analysis and recommendations for this step (detailed, actionable)
- "questions": Array of follow-up questions to gather more information (if needed)
- "recommendations": Array of specific, evidence-based recommendations
- "nextStepPreview": Brief description of what comes next
- "threeRealities": Object with "systemDesign", "communityExperience", "individualReality" perspectives
- "stakeholderActions": Object mapping stakeholder types to their specific actions for this step
- "rpliceConsiderations": Relevant RPLICE/MAP-GAP/CFIR considerations for this step`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 3000);
      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { guidance: aiResponse };
      } catch { parsed = { guidance: aiResponse }; }

      res.json({
        step: currentStep,
        stepName: currentWizardStep.name,
        totalSteps: 7,
        response: parsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Wizard error:", error);
      res.status(500).json({ error: "Failed to process wizard step" });
    }
  });

  app.post("/api/justice/ai/sel-assessment", async (req, res) => {
    try {
      const { youthProfile, assessmentType } = req.body;
      const ragContext = getJusticeRAGContext("social emotional learning assessment youth");
      const prompt = `You are the SEL Assessment AI for the Justice & Community Safety Command Center. Assess social-emotional learning needs for justice-involved or at-risk youth.

KNOWLEDGE BASE:
${ragContext}

YOUTH PROFILE:
${JSON.stringify(youthProfile || {}, null, 2)}

ASSESSMENT TYPE: ${assessmentType || "comprehensive"}

Provide a JSON response with:
- "selProfile": Assessment of each CASEL competency (selfAwareness, selfManagement, socialAwareness, relationshipSkills, responsibleDecisionMaking) scored 1-5 with notes
- "strengthsIdentified": Array of strengths to build on
- "growthAreas": Array of areas needing development
- "traumaConsiderations": Trauma-informed observations
- "recommendedPrograms": Array of evidence-based program recommendations
- "interventionPlan": Suggested SEL intervention plan with timeline
- "stakeholderInvolvement": Who should be involved (family, school, mentors, faith community)`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 2500);
      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { assessment: aiResponse };
      } catch { parsed = { assessment: aiResponse }; }
      res.json({ assessment: parsed, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("SEL assessment error:", error);
      res.status(500).json({ error: "Failed to generate SEL assessment" });
    }
  });

  app.post("/api/justice/ai/neighborhood-analysis", async (req, res) => {
    try {
      const { neighborhood, city, stateCode } = req.body;
      const ragContext = getJusticeRAGContext("neighborhood community violence prevention hotspot");
      const existingData = await db.select().from(neighborhoodIntelligence).limit(10);

      const prompt = `You are the Neighborhood Intelligence AI for the Justice & Community Safety Command Center. Analyze a neighborhood for crime prevention, community safety, and resource needs.

KNOWLEDGE BASE:
${ragContext}

TARGET: ${neighborhood || "General"}, ${city || ""}, ${stateCode || ""}

EXISTING NEIGHBORHOOD DATA:
${JSON.stringify(existingData.slice(0, 5).map(n => ({ name: n.neighborhood, city: n.city, hotspot: n.hotspotLevel, crimeIndex: n.crimeIndex, resources: n.communityResourceScore })), null, 2)}

Provide JSON with:
- "riskAssessment": Overall risk profile with contributing factors
- "hotspotAnalysis": Crime pattern analysis and geographic considerations
- "resourceGaps": What services/resources are missing
- "institutionalBarriers": Systemic barriers affecting this community
- "communityAssets": Existing strengths to build on (churches, schools, community orgs, leaders)
- "preventionStrategy": Tailored prevention plan for this neighborhood
- "stakeholderMap": Who needs to be at the table
- "quickWins": Immediate actions that can make a difference
- "longTermStrategy": 1-3 year transformation roadmap
- "fidelityMetrics": How to measure if interventions are working`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 2500);
      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: aiResponse };
      } catch { parsed = { analysis: aiResponse }; }
      res.json({ analysis: parsed, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Neighborhood analysis error:", error);
      res.status(500).json({ error: "Failed to analyze neighborhood" });
    }
  });

  app.post("/api/justice/rplice/assess-program", async (req, res) => {
    try {
      const { programName, programType, data } = req.body;
      const ragContext = getJusticeRAGContext("RPLICE implementation fidelity CFIR RE-AIM justice program");
      const prompt = `You are the RPLICE Implementation Fidelity Engine for the Justice Command Center. Assess a criminal justice program using the RPLICE Decision Framework and CFIR 2.0.

KNOWLEDGE BASE:
${ragContext}

PROGRAM: ${programName || "Unnamed"} (${programType || "general"})
DATA: ${JSON.stringify(data || {}, null, 2)}

Provide a JSON assessment with:
- "overallScore": Fidelity score 0-100
- "rplicePhases": Object with scores/notes for each phase (Research, Plan, Launch, Implement, Check, Evolve)
- "cfirConstructs": Assessment of key CFIR 2.0 constructs relevant to this program
- "reaimScorecard": RE-AIM assessment (Reach, Effectiveness, Adoption, Implementation, Maintenance)
- "mapGapFindings": Current MAP-GAP cycle findings
- "strengthAreas": What's working well
- "improvementAreas": What needs attention
- "actionItems": Prioritized list of improvements
- "threeRealitiesCheck": Are we accounting for system design vs community experience vs individual reality?`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 2500);
      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { assessment: aiResponse };
      } catch { parsed = { assessment: aiResponse }; }

      const [saved] = await db.insert(rpliceAssessments).values({
        assessmentType: "justice_program",
        programName: programName || "Unnamed",
        data: parsed,
        score: String(parsed.overallScore || 0),
        status: "complete",
      }).returning();

      res.json({ assessment: parsed, savedId: saved.id, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("RPLICE assessment error:", error);
      res.status(500).json({ error: "Failed to assess program" });
    }
  });
}
