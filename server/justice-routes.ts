import type { Express, Request, Response, NextFunction } from "express";
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
import { collaborativeResponse } from "./collaborative-ai";

const requireApiKey = (req: Request, res: Response, next: Function) => {
  const rawKey = req.headers["x-api-key"];
  const validKey = process.env.CROSS_PLATFORM_API_KEY;
  if (!validKey) return res.status(503).json({ error: "API key not configured" });
  const apiKey = typeof rawKey === "string" ? rawKey.trim() : null;
  if (!apiKey || apiKey !== validKey) return res.status(401).json({ error: "Invalid or missing API key" });
  // Deprecated auth pattern — migrate to /api/partner/v1/* with tcaf_ scoped key (student:read scope)
  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "2027-01-01");
  res.setHeader("Link", '</api/partner/v1/docs>; rel="successor-version"');
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

  app.post("/api/external/justice/referrals", requireApiKey, requireAuth, async (req, res) => {
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
      const [updated] = await db.update(justiceReferrals).set({ ...parsed.data, updatedAt: new Date() }).where(eq(justiceReferrals.id, req.params.id as string)).returning();
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
      const [updated] = await db.update(supervisionCompliance).set(updateData).where(eq(supervisionCompliance.id, req.params.id as string)).returning();
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

  app.post("/api/justice/juvenile-cases", requireAuth, async (req, res) => {
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

  app.post("/api/justice/court-services", requireAuth, async (req, res) => {
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

  app.post("/api/justice/sel-programs", requireAuth, async (req, res) => {
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

  app.post("/api/justice/prevention-programs", requireAuth, async (req, res) => {
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

  app.post("/api/justice/stakeholders", requireAuth, async (req, res) => {
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

  app.post("/api/justice/neighborhoods", requireAuth, async (req, res) => {
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

  app.post("/api/justice/trend-alerts", requireAuth, async (req, res) => {
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

  app.post("/api/justice/cycle-breaking-sessions", requireAuth, async (req, res) => {
    try {
      const parsed = insertCycleBreakingSessionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(cycleBreakingSessions).values(parsed.data).returning();
      res.json(created);
    } catch (error) { res.status(500).json({ error: "Failed to create session" }); }
  });

  app.patch("/api/justice/cycle-breaking-sessions/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(cycleBreakingSessions).set({ ...req.body, updatedAt: new Date() }).where(eq(cycleBreakingSessions.id, req.params.id as string)).returning();
      res.json(updated);
    } catch (error) { res.status(500).json({ error: "Failed to update session" }); }
  });

  app.post("/api/justice/ai/analyze-trends", requireAuth, async (req, res) => {
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

  app.post("/api/justice/ai/cycle-breaking-wizard", requireAuth, async (req, res) => {
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

  app.post("/api/justice/ai/sel-assessment", requireAuth, async (req, res) => {
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

  app.post("/api/justice/ai/neighborhood-analysis", requireAuth, async (req, res) => {
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

  app.post("/api/justice/rplice/assess-program", requireAuth, async (req, res) => {
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

  // ═══════════════════════════════════════════════════════════════════
  //  LIVE PUBLIC API INTEGRATIONS — Neighborhood → City → County → State
  // ═══════════════════════════════════════════════════════════════════

  const apiFetch = async (url: string, timeout = 10000): Promise<any> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const r = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "ThriveUp-Justice-Command-Center/1.0" } });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`);
      return await r.json();
    } catch (e: any) {
      clearTimeout(timer);
      throw e;
    }
  };

  // ── Crime & Safety Data ──
  // Uses Census ACS crime-related variables + UCR proxy data
  app.get("/api/justice/live/crime/:state", async (req, res) => {
    try {
      const stateAbbr = (req.params.state as string).toUpperCase();
      const STATE_FIPS: Record<string, string> = {
        AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",
        HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
        MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
        NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
        SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",DC:"11",
      };
      const fips = STATE_FIPS[stateAbbr];
      const countyData = fips ? await apiFetch(
        `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E&for=county:*&in=state:${fips}`, 15000
      ).catch(() => null) : null;

      let counties: any[] = [];
      if (countyData && Array.isArray(countyData) && countyData.length > 1) {
        const h = countyData[0];
        counties = countyData.slice(1).map((r: string[]) => {
          const v = (name: string) => { const idx = h.indexOf(name); return idx >= 0 ? parseInt(r[idx]) || 0 : 0; };
          const pop = v("B01003_001E"); const povU = v("B17001_001E"); const belowPov = v("B17001_002E");
          const unemp = v("B23025_005E"); const lf = v("B23025_002E");
          return {
            name: r[h.indexOf("NAME")],
            population: pop,
            medianIncome: v("B19013_001E"),
            povertyRate: povU > 0 ? ((belowPov / povU) * 100).toFixed(1) : null,
            unemploymentRate: lf > 0 ? ((unemp / lf) * 100).toFixed(1) : null,
            countyFips: r[h.indexOf("county")],
          };
        }).sort((a: any, b: any) => b.population - a.population);
      }

      res.json({
        state: stateAbbr,
        totalCounties: counties.length,
        counties: counties.slice(0, 50),
        highPovertyCounties: counties.filter((c: any) => parseFloat(c.povertyRate) > 20).length,
        highUnemploymentCounties: counties.filter((c: any) => parseFloat(c.unemploymentRate) > 8).length,
        statePopulation: counties.reduce((sum: number, c: any) => sum + c.population, 0),
        source: "U.S. Census Bureau ACS 5-Year Estimates (2022)",
        sourceUrl: "https://api.census.gov",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "Census/Crime Data" });
    }
  });

  // ── GUN VIOLENCE REGISTRY INTEGRATION ──
  // Connects to Dr. Flood's National Gun Violence Tracker
  const GV_REGISTRY_URL = "https://gun-violence-registry.replit.app";

  app.get("/api/justice/live/gun-violence", async (req, res) => {
    try {
      const state = req.query.state as string | undefined;
      const city = req.query.city as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      let url = `${GV_REGISTRY_URL}/api/incidents?limit=${limit}`;
      if (state) url += `&state=${encodeURIComponent(state)}`;
      if (city) url += `&city=${encodeURIComponent(city)}`;

      const incidents = await apiFetch(url, 15000);
      const incidentList = Array.isArray(incidents) ? incidents : [];

      const totalKilled = incidentList.reduce((s: number, i: any) => s + (i.killed || 0), 0);
      const totalInjured = incidentList.reduce((s: number, i: any) => s + (i.injured || 0), 0);
      const homicides = incidentList.filter((i: any) => i.incidentType === "homicide").length;
      const massShootings = incidentList.filter((i: any) => (i.killed || 0) + (i.injured || 0) >= 4).length;

      const cityBreakdown: Record<string, { incidents: number; killed: number; injured: number }> = {};
      incidentList.forEach((i: any) => {
        const c = i.city || "Unknown";
        if (!cityBreakdown[c]) cityBreakdown[c] = { incidents: 0, killed: 0, injured: 0 };
        cityBreakdown[c].incidents++;
        cityBreakdown[c].killed += i.killed || 0;
        cityBreakdown[c].injured += i.injured || 0;
      });
      const topCities = Object.entries(cityBreakdown)
        .map(([city, data]) => ({ city, ...data }))
        .sort((a, b) => b.killed - a.killed)
        .slice(0, 20);

      res.json({
        state, city,
        totalIncidents: incidentList.length,
        totalKilled, totalInjured, homicides, massShootings,
        topCities,
        recentIncidents: incidentList.slice(0, 20).map((i: any) => ({
          date: i.date, city: i.city, state: i.state, county: i.county,
          incidentType: i.incidentType, killed: i.killed, injured: i.injured,
          address: i.address, description: i.description,
          source: i.source, sourceUrl: i.sourceUrl, characteristics: i.characteristics,
        })),
        source: "National Gun Violence Tracker — ACOS Ecosystem (Dr. Terry Flood)",
        sourceUrl: GV_REGISTRY_URL,
        dataProvider: "Gun Violence Archive + ACOS Platform Integration",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "Gun Violence Registry" });
    }
  });

  // Multi-city comparison — unlimited cities from Gun Violence Registry
  app.post("/api/justice/live/gun-violence/compare", requireAuth, async (req, res) => {
    try {
      const { cities } = req.body as { cities: Array<{ city: string; state: string }> };
      if (!cities || !Array.isArray(cities) || cities.length === 0) {
        return res.status(400).json({ error: "Provide an array of {city, state} objects" });
      }

      const results = await Promise.allSettled(
        cities.map(async (loc) => {
          const url = `${GV_REGISTRY_URL}/api/incidents?city=${encodeURIComponent(loc.city)}&state=${encodeURIComponent(loc.state)}&limit=100`;
          const incidents = await apiFetch(url, 15000);
          const list = Array.isArray(incidents) ? incidents : [];
          const killed = list.reduce((s: number, i: any) => s + (i.killed || 0), 0);
          const injured = list.reduce((s: number, i: any) => s + (i.injured || 0), 0);
          const homicides = list.filter((i: any) => i.incidentType === "homicide").length;
          const massShootings = list.filter((i: any) => (i.killed || 0) + (i.injured || 0) >= 4).length;

          const byMonth: Record<string, { incidents: number; killed: number; injured: number }> = {};
          list.forEach((i: any) => {
            const m = (i.date || "").substring(0, 7);
            if (!byMonth[m]) byMonth[m] = { incidents: 0, killed: 0, injured: 0 };
            byMonth[m].incidents++;
            byMonth[m].killed += i.killed || 0;
            byMonth[m].injured += i.injured || 0;
          });
          const byType: Record<string, number> = {};
          list.forEach((i: any) => {
            const t = i.incidentType || "other";
            byType[t] = (byType[t] || 0) + 1;
          });

          return {
            city: loc.city, state: loc.state,
            totalIncidents: list.length, killed, injured, homicides, massShootings,
            monthlyTrend: Object.entries(byMonth).sort().map(([month, d]) => ({ month, ...d })),
            byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
            recentIncidents: list.slice(0, 10).map((i: any) => ({
              date: i.date, city: i.city, state: i.state,
              incidentType: i.incidentType, killed: i.killed, injured: i.injured,
              address: i.address, description: i.description,
              sourceUrl: i.sourceUrl, characteristics: i.characteristics,
            })),
          };
        })
      );

      const cityData = results.map((r, idx) => {
        if (r.status === "fulfilled") return r.value;
        return { city: cities[idx].city, state: cities[idx].state, totalIncidents: 0, killed: 0, injured: 0, homicides: 0, massShootings: 0, monthlyTrend: [], byType: [], recentIncidents: [], error: (r.reason as Error).message };
      });

      res.json({
        comparison: cityData,
        totalCities: cityData.length,
        source: "National Gun Violence Tracker — ACOS Ecosystem (Dr. Terry Flood)",
        sourceUrl: GV_REGISTRY_URL,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── GENTRIFICATION & HISTORICAL TRACKING ──
  // Multi-year Census comparison to detect displacement, rent spikes, demographic shifts
  app.get("/api/justice/live/gentrification/:stateFips/:countyFips", async (req, res) => {
    try {
      const { stateFips, countyFips } = req.params as Record<string, string>;
      const years = [2015, 2017, 2019, 2022];
      const vars = "NAME,B19013_001E,B25064_001E,B25077_001E,B01003_001E,B17001_002E,B17001_001E,B15003_022E,B15003_001E,B02001_003E,B02001_001E,B03003_003E,B03003_001E";

      const yearData = await Promise.allSettled(
        years.map(async (yr) => {
          try {
            const data = await apiFetch(
              `https://api.census.gov/data/${yr}/acs/acs5?get=${vars}&for=county:${countyFips}&in=state:${stateFips}`,
              15000
            );
            if (!data || !Array.isArray(data) || data.length < 2) return null;
            const h = data[0]; const r = data[1];
            const v = (name: string) => { const idx = h.indexOf(name); return idx >= 0 ? parseInt(r[idx]) || 0 : 0; };
            const pop = v("B01003_001E"); const povU = v("B17001_001E"); const belowPov = v("B17001_002E");
            const edPop = v("B15003_001E"); const bachelors = v("B15003_022E");
            const blackPop = v("B02001_003E"); const totalRace = v("B02001_001E");
            const hispanicPop = v("B03003_003E"); const totalHispanic = v("B03003_001E");
            return {
              year: yr, name: r[h.indexOf("NAME")], population: pop,
              medianIncome: v("B19013_001E"), medianRent: v("B25064_001E"), medianHomeValue: v("B25077_001E"),
              povertyRate: povU > 0 ? parseFloat(((belowPov / povU) * 100).toFixed(1)) : 0,
              bachelorsPct: edPop > 0 ? parseFloat(((bachelors / edPop) * 100).toFixed(1)) : 0,
              blackPct: totalRace > 0 ? parseFloat(((blackPop / totalRace) * 100).toFixed(1)) : 0,
              hispanicPct: totalHispanic > 0 ? parseFloat(((hispanicPop / totalHispanic) * 100).toFixed(1)) : 0,
            };
          } catch { return null; }
        })
      );

      const timeline = yearData.map(r => r.status === "fulfilled" ? r.value : null).filter(Boolean);
      const first = timeline[0] as any; const last = timeline[timeline.length - 1] as any;
      let gentrificationScore = 0;
      const indicators: string[] = [];
      if (first && last) {
        const rentChange = last.medianRent && first.medianRent ? ((last.medianRent - first.medianRent) / first.medianRent) * 100 : 0;
        const homeValueChange = last.medianHomeValue && first.medianHomeValue ? ((last.medianHomeValue - first.medianHomeValue) / first.medianHomeValue) * 100 : 0;
        const educationChange = (last.bachelorsPct || 0) - (first.bachelorsPct || 0);
        const blackPctChange = (last.blackPct || 0) - (first.blackPct || 0);
        const incomeChange = last.medianIncome && first.medianIncome ? ((last.medianIncome - first.medianIncome) / first.medianIncome) * 100 : 0;

        if (rentChange > 30) { gentrificationScore += 25; indicators.push(`Rent surged ${rentChange.toFixed(0)}% (${first.year}→${last.year})`); }
        else if (rentChange > 15) { gentrificationScore += 15; indicators.push(`Rent rose ${rentChange.toFixed(0)}%`); }
        if (homeValueChange > 40) { gentrificationScore += 25; indicators.push(`Home values jumped ${homeValueChange.toFixed(0)}%`); }
        else if (homeValueChange > 20) { gentrificationScore += 15; indicators.push(`Home values rose ${homeValueChange.toFixed(0)}%`); }
        if (educationChange > 5) { gentrificationScore += 15; indicators.push(`College-educated population grew ${educationChange.toFixed(1)} pts`); }
        if (blackPctChange < -3) { gentrificationScore += 20; indicators.push(`Black population share declined ${Math.abs(blackPctChange).toFixed(1)} pts — potential displacement`); }
        if (incomeChange > 30 && last.povertyRate < first.povertyRate) { gentrificationScore += 15; indicators.push(`Income rose ${incomeChange.toFixed(0)}% while poverty fell — wealth influx`); }
      }

      const level = gentrificationScore >= 60 ? "high" : gentrificationScore >= 30 ? "moderate" : gentrificationScore > 0 ? "low" : "none";

      res.json({
        county: first?.name || `County ${countyFips}`,
        stateFips, countyFips, timeline,
        gentrificationScore, gentrificationLevel: level, indicators,
        analysis: gentrificationScore >= 60 ? "Significant gentrification detected — rising housing costs, demographic shifts, and potential displacement of long-term residents"
          : gentrificationScore >= 30 ? "Moderate gentrification signals — housing costs rising faster than income, some demographic shifts"
          : "Limited gentrification indicators in the tracked period",
        source: "U.S. Census Bureau ACS 5-Year Estimates (2015, 2017, 2019, 2022)",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── RISK & PROTECTIVE FACTORS ENGINE ──
  // Inspired by Dr. Flood's military observation: 1 year of college = protective factor
  app.post("/api/justice/live/risk-protective-factors", requireAuth, async (req, res) => {
    try {
      const { stateFips, countyFips, includeGunViolence } = req.body;
      const vars = "NAME,B01003_001E,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E,B15003_017E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B15003_001E,B25064_001E,B25077_001E,B12001_001E,B12001_003E,B12001_005E,B11001_001E,B11001_003E,B09002_001E,B09002_002E";
      // B15003_022E=Bachelor's, B15003_023E=Master's, B15003_024E=Professional, B15003_025E=Doctorate
      // B12001_003E=Now Married Male, B12001_005E=Now Married Female
      // B11001_003E=Married-couple families, B09002_002E=Children in married-couple families

      const geoLevel = countyFips ? `county:${countyFips}&in=state:${stateFips}` : `county:*&in=state:${stateFips}`;
      const data = await apiFetch(`https://api.census.gov/data/2022/acs/acs5?get=${vars}&for=${geoLevel}`, 15000);

      if (!data || !Array.isArray(data) || data.length < 2) {
        return res.json({ areas: [], source: "Census ACS" });
      }

      const h = data[0];
      const areas = data.slice(1).map((r: string[]) => {
        const v = (name: string) => { const idx = h.indexOf(name); return idx >= 0 ? parseInt(r[idx]) || 0 : 0; };
        const pop = v("B01003_001E"); const edPop = v("B15003_001E");
        const bachelors = v("B15003_022E"); const masters = v("B15003_023E");
        const professional = v("B15003_024E"); const doctorate = v("B15003_025E");
        const hsGrad = v("B15003_017E");
        const collegeOrHigher = bachelors + masters + professional + doctorate;
        const povU = v("B17001_001E"); const belowPov = v("B17001_002E");
        const unemp = v("B23025_005E"); const lf = v("B23025_002E");
        const marriedPop = v("B12001_003E") + v("B12001_005E");
        const totalHouseholds = v("B11001_001E"); const marriedHouseholds = v("B11001_003E");
        const childrenTotal = v("B09002_001E"); const childrenMarried = v("B09002_002E");

        const collegePct = edPop > 0 ? (collegeOrHigher / edPop) * 100 : 0;
        const povertyRate = povU > 0 ? (belowPov / povU) * 100 : 0;
        const unemploymentRate = lf > 0 ? (unemp / lf) * 100 : 0;
        const marriagePct = totalHouseholds > 0 ? (marriedHouseholds / totalHouseholds) * 100 : 0;
        const childrenInTwoParentPct = childrenTotal > 0 ? (childrenMarried / childrenTotal) * 100 : 0;

        // Risk Score (0-100): higher = more at-risk
        let riskScore = 0;
        const riskFactors: string[] = [];
        const protectiveFactors: string[] = [];

        if (povertyRate > 25) { riskScore += 20; riskFactors.push(`High poverty: ${povertyRate.toFixed(1)}%`); }
        else if (povertyRate > 15) { riskScore += 12; riskFactors.push(`Elevated poverty: ${povertyRate.toFixed(1)}%`); }
        else { protectiveFactors.push(`Low poverty: ${povertyRate.toFixed(1)}%`); }

        if (unemploymentRate > 10) { riskScore += 15; riskFactors.push(`High unemployment: ${unemploymentRate.toFixed(1)}%`); }
        else if (unemploymentRate > 6) { riskScore += 8; riskFactors.push(`Moderate unemployment: ${unemploymentRate.toFixed(1)}%`); }
        else { protectiveFactors.push(`Low unemployment: ${unemploymentRate.toFixed(1)}%`); }

        if (collegePct < 15) { riskScore += 20; riskFactors.push(`Very low college attainment: ${collegePct.toFixed(1)}%`); }
        else if (collegePct < 25) { riskScore += 10; riskFactors.push(`Below-average college attainment: ${collegePct.toFixed(1)}%`); }
        else { protectiveFactors.push(`Strong college attainment: ${collegePct.toFixed(1)}%`); }

        if (marriagePct > 50) { protectiveFactors.push(`Stable household structure: ${marriagePct.toFixed(1)}% married households`); }
        else if (marriagePct < 30) { riskScore += 10; riskFactors.push(`Low marriage rate: ${marriagePct.toFixed(1)}% — family instability indicator`); }

        if (childrenInTwoParentPct > 65) { protectiveFactors.push(`${childrenInTwoParentPct.toFixed(1)}% children in two-parent homes`); }
        else if (childrenInTwoParentPct < 40) { riskScore += 15; riskFactors.push(`Only ${childrenInTwoParentPct.toFixed(1)}% children in two-parent homes`); }

        const medianIncome = v("B19013_001E");
        if (medianIncome < 35000) { riskScore += 15; riskFactors.push(`Low median income: $${medianIncome.toLocaleString()}`); }
        else if (medianIncome > 65000) { protectiveFactors.push(`Strong median income: $${medianIncome.toLocaleString()}`); }

        const riskLevel = riskScore >= 60 ? "critical" : riskScore >= 40 ? "high" : riskScore >= 20 ? "moderate" : "low";

        return {
          name: r[h.indexOf("NAME")], population: pop, countyFips: r[h.indexOf("county")],
          collegePct: parseFloat(collegePct.toFixed(1)),
          povertyRate: parseFloat(povertyRate.toFixed(1)),
          unemploymentRate: parseFloat(unemploymentRate.toFixed(1)),
          marriagePct: parseFloat(marriagePct.toFixed(1)),
          childrenInTwoParentPct: parseFloat(childrenInTwoParentPct.toFixed(1)),
          medianIncome, medianRent: v("B25064_001E"), medianHomeValue: v("B25077_001E"),
          riskScore, riskLevel, riskFactors, protectiveFactors,
        };
      }).sort((a: any, b: any) => b.riskScore - a.riskScore);

      // Aggregate gun violence if requested
      let gvData = null;
      if (includeGunViolence) {
        try {
          const stateAbbr = Object.entries({
            AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",
            HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
            MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
            NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
            SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",
          }).find(([_, v]) => v === stateFips)?.[0];
          if (stateAbbr) {
            const incidents = await apiFetch(`${GV_REGISTRY_URL}/api/incidents?state=${stateAbbr}&limit=100`, 15000);
            if (Array.isArray(incidents)) {
              gvData = {
                totalIncidents: incidents.length,
                killed: incidents.reduce((s: number, i: any) => s + (i.killed || 0), 0),
                injured: incidents.reduce((s: number, i: any) => s + (i.injured || 0), 0),
                byCityCount: Object.entries(incidents.reduce((acc: Record<string, number>, i: any) => {
                  const c = i.city || "Unknown"; acc[c] = (acc[c] || 0) + 1; return acc;
                }, {})).map(([city, count]) => ({ city, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 15),
              };
            }
          }
        } catch {}
      }

      res.json({
        areas,
        totalAreas: areas.length,
        criticalAreas: areas.filter((a: any) => a.riskLevel === "critical").length,
        highRiskAreas: areas.filter((a: any) => a.riskLevel === "high").length,
        gunViolence: gvData,
        methodology: "Risk/Protective Factor Model — Inspired by military behavioral research (Dr. Terry Flood). College attainment (≥1 year), stable family structure, and employment are primary protective factors. Poverty, unemployment, low education, and family instability are risk factors.",
        source: "U.S. Census Bureau ACS 2022 + National Gun Violence Tracker",
        references: [
          "gunmemorial.org — National gun death memorial database",
          "gunviolencearchive.org — Comprehensive national incident tracking",
          "gun-violence-registry.replit.app — ACOS National Gun Violence Tracker",
        ],
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── DATA STORYTELLING ENGINE ──
  // Neighborhood → School → Outcomes pipeline
  app.get("/api/justice/live/school-data/:state", async (req, res) => {
    try {
      const stateAbbr = (req.params.state as string).toUpperCase();
      const district = req.query.district as string | undefined;
      const city = req.query.city as string | undefined;

      const STATE_FIPS: Record<string, string> = {
        AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",
        HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
        MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
        NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
        SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",DC:"11",
      };
      const fips = STATE_FIPS[stateAbbr];

      let districtData = null;
      let schoolData = null;
      try {
        const districtUrl = `https://educationdata.urban.org/api/v1/school-districts/ccd/directory/2022/?fips=${fips}${city ? `&city_location=${encodeURIComponent(city)}` : ""}&limit=50`;
        districtData = await apiFetch(districtUrl, 15000);
      } catch {}

      if (district) {
        try {
          schoolData = await apiFetch(`https://educationdata.urban.org/api/v1/schools/ccd/directory/2022/?leaid=${district}&limit=100`, 15000);
        } catch {}
      }

      res.json({
        state: stateAbbr, city, district,
        districts: districtData?.results || districtData || null,
        schools: schoolData?.results || schoolData || null,
        source: "NCES via Urban Institute Education Data Portal",
        sourceUrl: "https://educationdata.urban.org",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Neighborhood-level Census tracts for a county ──
  app.get("/api/justice/live/neighborhoods/:state/:county", async (req, res) => {
    try {
      const stateFips = req.params.state as string;
      const countyFips = req.params.county as string;
      const vars = "NAME,B01003_001E,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E,B15003_017E,B15003_022E,B25064_001E,B01001_003E,B01001_004E,B01001_005E,B01001_006E,B01001_027E,B01001_028E,B01001_029E,B01001_030E,B02001_003E,B02001_002E,B03003_003E";
      const data = await apiFetch(
        `https://api.census.gov/data/2022/acs/acs5?get=${vars}&for=tract:*&in=state:${stateFips}+county:${countyFips}`, 15000
      );
      if (!data || !Array.isArray(data) || data.length < 2) {
        return res.json({ tracts: [], source: "Census ACS" });
      }
      const h = data[0];
      const tracts = data.slice(1).map((r: string[]) => {
        const v = (name: string) => { const idx = h.indexOf(name); return idx >= 0 ? parseInt(r[idx]) || 0 : 0; };
        const pop = v("B01003_001E"); const povU = v("B17001_001E"); const belowPov = v("B17001_002E");
        const unemp = v("B23025_005E"); const lf = v("B23025_002E");
        const youthMale = v("B01001_003E") + v("B01001_004E") + v("B01001_005E") + v("B01001_006E");
        const youthFemale = v("B01001_027E") + v("B01001_028E") + v("B01001_029E") + v("B01001_030E");
        const povertyRate = povU > 0 ? (belowPov / povU) * 100 : 0;
        const unemploymentRate = lf > 0 ? (unemp / lf) * 100 : 0;
        return {
          name: r[h.indexOf("NAME")],
          tract: r[h.indexOf("tract")],
          population: pop,
          youthPopulation: youthMale + youthFemale,
          medianIncome: v("B19013_001E"),
          povertyRate: povertyRate.toFixed(1),
          unemploymentRate: unemploymentRate.toFixed(1),
          hsGraduates: v("B15003_017E"),
          bachelors: v("B15003_022E"),
          medianRent: v("B25064_001E"),
          blackPopulation: v("B02001_003E"),
          whitePopulation: v("B02001_002E"),
          hispanicPopulation: v("B03003_003E"),
          riskScore: Math.min(100, Math.round(povertyRate * 1.5 + unemploymentRate * 2 + (pop > 0 && v("B15003_022E") / pop < 0.1 ? 20 : 0))),
        };
      }).filter((t: any) => t.population > 0).sort((a: any, b: any) => b.riskScore - a.riskScore);

      res.json({
        stateFips, countyFips,
        totalTracts: tracts.length,
        highRiskTracts: tracts.filter((t: any) => t.riskScore > 50).length,
        tracts,
        source: "U.S. Census Bureau ACS 5-Year 2022 (Tract Level)",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── AI Data Story Generator ──
  app.post("/api/justice/live/data-story", requireAuth, async (req, res) => {
    try {
      const { location, neighborhoodData, schoolData, countyData, customContext } = req.body;
      const ragContext = getJusticeRAGContext("school pipeline disparity neighborhood poverty incarceration outcomes data storytelling");

      const prompt = `You are the Justice Command Center Data Storytelling Engine. Your job is to tell the TRUTH about what's happening in communities using real data. No sugarcoating. No hedging. Direct, powerful data storytelling that connects neighborhoods → schools → outcomes → incarceration pipeline.

KNOWLEDGE BASE: ${ragContext}

LOCATION: ${JSON.stringify(location || {})}
NEIGHBORHOOD DATA: ${JSON.stringify(neighborhoodData || {})}
SCHOOL DATA: ${JSON.stringify(schoolData || {})}
COUNTY DATA: ${JSON.stringify(countyData || {})}
USER CONTEXT: ${customContext || "General analysis requested"}

Create a comprehensive DATA STORY in JSON format:
{
  "title": "One powerful headline that captures the disparity",
  "narrative": "3-5 paragraph narrative that tells the story of this community — from neighborhood conditions through school outcomes through justice system contact. Use specific numbers from the data. Name the neighborhoods, the schools, the disparities. Do NOT hedge. This is data storytelling.",
  "keyDisparities": [
    {"metric": "...", "value1": "...", "value2": "...", "disparity": "...", "context": "..."}
  ],
  "pipelineStages": [
    {"stage": "Neighborhood Conditions", "findings": "...", "data": "...", "riskLevel": "high/medium/low"},
    {"stage": "Elementary School Experience", "findings": "...", "data": "...", "riskLevel": "..."},
    {"stage": "Middle/High School", "findings": "...", "data": "...", "riskLevel": "..."},
    {"stage": "Post-Secondary Pathways", "findings": "...", "data": "...", "riskLevel": "..."},
    {"stage": "Justice System Contact", "findings": "...", "data": "...", "riskLevel": "..."}
  ],
  "rootCauses": ["..."],
  "immediateActions": ["5 specific, actionable interventions based on the data"],
  "programRecommendations": ["Evidence-based programs from our library that address these specific findings"],
  "projectedOutcomes": {
    "withoutIntervention": "What happens in 5-10 years if nothing changes",
    "withIntervention": "What changes if we implement the recommended actions"
  },
  "callToAction": "One powerful closing statement"
}`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 3000);
      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { narrative: aiResponse };
      } catch { parsed = { narrative: aiResponse }; }

      res.json({ story: parsed, timestamp: new Date().toISOString() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Census Bureau ACS (free, no key required) ──
  // Granularity: national → state → county → tract (neighborhood-level)
  app.get("/api/justice/live/demographics/:state", async (req, res) => {
    try {
      const stateFips = req.params.state as string;
      const countyFips = req.query.county as string | undefined;
      const tractFips = req.query.tract as string | undefined;
      const variables = "NAME,B01003_001E,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E,B15003_017E,B15003_022E,B25077_001E,B25064_001E,B27001_005E,B27001_008E";
      // B01003_001E=Total Population, B19013_001E=Median Household Income, B17001_002E=Pop Below Poverty, B17001_001E=Pop for Poverty Status
      // B23025_005E=Unemployed, B23025_002E=In Labor Force, B15003_017E=HS Diploma, B15003_022E=Bachelor's
      // B25077_001E=Median Home Value, B25064_001E=Median Rent, B27001_005E/008E=Uninsured
      let geoLevel: string;
      if (tractFips) {
        geoLevel = `tract:${tractFips}&in=state:${stateFips}+county:${countyFips || "*"}`;
      } else if (countyFips) {
        geoLevel = `county:${countyFips}&in=state:${stateFips}`;
      } else {
        geoLevel = `county:*&in=state:${stateFips}`;
      }
      const data = await apiFetch(`https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=${geoLevel}`);
      const headers = data[0];
      const rows = data.slice(1).map((row: string[]) => {
        const obj: Record<string, any> = {};
        headers.forEach((h: string, i: number) => { obj[h] = row[i]; });
        return {
          name: obj["NAME"],
          totalPopulation: parseInt(obj["B01003_001E"]) || 0,
          medianHouseholdIncome: parseInt(obj["B19013_001E"]) || 0,
          populationBelowPoverty: parseInt(obj["B17001_002E"]) || 0,
          povertyUniverse: parseInt(obj["B17001_001E"]) || 0,
          povertyRate: obj["B17001_001E"] && parseInt(obj["B17001_001E"]) > 0 ? ((parseInt(obj["B17001_002E"]) / parseInt(obj["B17001_001E"])) * 100).toFixed(1) : null,
          unemployed: parseInt(obj["B23025_005E"]) || 0,
          laborForce: parseInt(obj["B23025_002E"]) || 0,
          unemploymentRate: obj["B23025_002E"] && parseInt(obj["B23025_002E"]) > 0 ? ((parseInt(obj["B23025_005E"]) / parseInt(obj["B23025_002E"])) * 100).toFixed(1) : null,
          hsGraduates: parseInt(obj["B15003_017E"]) || 0,
          bachelorsOrHigher: parseInt(obj["B15003_022E"]) || 0,
          medianHomeValue: parseInt(obj["B25077_001E"]) || 0,
          medianRent: parseInt(obj["B25064_001E"]) || 0,
          stateFips: obj["state"],
          countyFips: obj["county"],
          tractFips: obj["tract"],
        };
      });
      res.json({
        level: tractFips ? "tract" : countyFips ? "county" : "all_counties",
        count: rows.length,
        data: rows.sort((a: any, b: any) => b.totalPopulation - a.totalPopulation),
        source: "U.S. Census Bureau, American Community Survey 5-Year Estimates (2022)",
        sourceUrl: "https://api.census.gov",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "Census ACS" });
    }
  });

  // ── BLS Employment Data (free, no key for basic) ──
  // State + metro area employment, wages, unemployment
  app.get("/api/justice/live/employment/:state", async (req, res) => {
    try {
      const stateFips = req.params.state as string;
      const seriesIds = [
        `LASST${stateFips}0000000000003`,  // state unemployment rate
        `LASST${stateFips}0000000000004`,  // state unemployment count
        `LASST${stateFips}0000000000005`,  // state employment count
        `LASST${stateFips}0000000000006`,  // state labor force
      ];
      const blsData = await apiFetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", 15000).catch(() => null);
      let blsResult = null;
      if (!blsData) {
        const results = await Promise.allSettled(
          seriesIds.map(id => apiFetch(`https://api.bls.gov/publicAPI/v2/timeseries/data/${id}?startyear=2023&endyear=2024`))
        );
        blsResult = results.map((r, i) => ({
          seriesId: seriesIds[i],
          data: r.status === "fulfilled" ? r.value : null,
        }));
      }
      res.json({
        stateFips,
        employment: blsResult,
        source: "Bureau of Labor Statistics (BLS) — Local Area Unemployment Statistics",
        sourceUrl: "https://www.bls.gov/lau/",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "BLS" });
    }
  });

  // ── NCES School/Education Data (proxy for district-level) ──
  app.get("/api/justice/live/schools/:state", async (req, res) => {
    try {
      const stateFips = req.params.state as string;
      const [districts, schoolCount] = await Promise.allSettled([
        apiFetch(`https://educationdata.urban.org/api/v1/schools/ccd/directory/${stateFips.length === 2 ? "2022" : "2022"}/?fips=${stateFips}&limit=100`),
        apiFetch(`https://educationdata.urban.org/api/v1/school-districts/ccd/directory/2022/?fips=${stateFips}&limit=50`),
      ]);
      res.json({
        stateFips,
        schools: districts.status === "fulfilled" ? districts.value : null,
        districts: schoolCount.status === "fulfilled" ? schoolCount.value : null,
        source: "National Center for Education Statistics (NCES) via Urban Institute Education Data Portal",
        sourceUrl: "https://educationdata.urban.org",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "NCES/Urban Institute" });
    }
  });

  // ── HUD Fair Market Rents (housing affordability by county/ZIP) ──
  app.get("/api/justice/live/housing/:state", async (req, res) => {
    try {
      const stateAbbr = (req.params.state as string).toUpperCase();
      const year = req.query.year || "2024";
      const countyFips = req.query.county as string | undefined;
      let url = `https://www.huduser.gov/hudapi/public/fmr/statedata/${stateAbbr}?year=${year}`;
      if (countyFips) {
        url = `https://www.huduser.gov/hudapi/public/fmr/data/${countyFips}?year=${year}`;
      }
      const hudToken = process.env.HUD_API_KEY;
      const headers: Record<string, string> = { "User-Agent": "ThriveUp-Justice/1.0" };
      if (hudToken) headers["Authorization"] = `Bearer ${hudToken}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(url, { signal: controller.signal, headers });
      clearTimeout(timer);
      const data = r.ok ? await r.json() : null;
      res.json({
        stateAbbr, year,
        fairMarketRents: data,
        source: "HUD Fair Market Rents API",
        sourceUrl: "https://www.huduser.gov/portal/dataset/fmr-api.html",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "HUD" });
    }
  });

  // ── SAMHSA Treatment Locator ──
  app.get("/api/justice/live/treatment/:state", async (req, res) => {
    try {
      const stateAbbr = (req.params.state as string).toUpperCase();
      const city = req.query.city as string | undefined;
      const zip = req.query.zip as string | undefined;
      let searchParam = `sState=${stateAbbr}`;
      if (zip) searchParam = `sZip=${zip}`;
      else if (city) searchParam = `sCity=${city}&sState=${stateAbbr}`;
      const data = await apiFetch(`https://findtreatment.gov/locator/ExportResults.csv?${searchParam}&sType=SA&rtype=json&limitValue=50`, 15000).catch(() => null);
      let parsed = null;
      if (!data) {
        const altUrl = `https://findtreatment.gov/locator?${searchParam}`;
        parsed = { searchUrl: altUrl, note: "Direct API unavailable — use the SAMHSA locator URL" };
      } else {
        parsed = data;
      }
      res.json({
        stateAbbr, city, zip,
        facilities: parsed,
        source: "SAMHSA Behavioral Health Treatment Services Locator",
        sourceUrl: "https://findtreatment.gov",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "SAMHSA" });
    }
  });

  // ── 211 / Community Resources by ZIP ──
  app.get("/api/justice/live/resources/:zip", async (req, res) => {
    try {
      const zip = req.params.zip as string;
      const category = req.query.category as string || "all";
      const searchUrl211 = `https://www.211.org/get-help/zip/${zip}`;
      const searchUrlFindHelp = `https://www.findhelp.org/?postal=${zip}`;
      const searchUrlAuntBertha = `https://www.auntbertha.com/search?zip=${zip}`;
      res.json({
        zip, category,
        resources: {
          nationalHotlines: [
            { name: "211 (United Way)", phone: "211", description: "Local health and human services referrals", url: searchUrl211 },
            { name: "988 Suicide & Crisis Lifeline", phone: "988", description: "24/7 crisis support" },
            { name: "SAMHSA Helpline", phone: "1-800-662-4357", description: "Free treatment referrals 24/7" },
            { name: "National Domestic Violence Hotline", phone: "1-800-799-7233", description: "24/7 support" },
            { name: "Veterans Crisis Line", phone: "988 (press 1)", description: "24/7 for veterans and families" },
            { name: "NAMI Helpline", phone: "1-800-950-6264", description: "Mental health info and referrals" },
          ],
          localSearchUrls: {
            "211.org": searchUrl211,
            "FindHelp.org": searchUrlFindHelp,
            "AuntBertha/FindHelp": searchUrlAuntBertha,
            "FoodPantries.org": `https://www.foodpantries.org/zip/${zip}`,
            "HUD Housing Counselors": `https://apps.hud.gov/offices/hsg/sfh/hcc/hcs.cfm?webListAction=search&searchstate=&filterZip=${zip}`,
            "FreeClinics.com": `https://www.freeclinics.com/zip/${zip}`,
            "NeedyMeds": `https://www.needymeds.org/free-clinics?zip=${zip}`,
            "LawHelp.org": `https://www.lawhelp.org/find-help/?zipcode=${zip}`,
            "VITA Free Tax Prep": `https://irs.treasury.gov/freetaxprep/jsp/vita.jsp?zip=${zip}`,
            "Career One-Stop": `https://www.careeronestop.org/LocalHelp/service-locator.aspx?zip=${zip}`,
            "Childcare.gov": `https://childcare.gov/?zip=${zip}`,
            "Benefits.gov": `https://www.benefits.gov/benefit-finder`,
          },
        },
        source: "Aggregated community resource directories",
        note: "Click the search URLs to find services specific to your ZIP code",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── OpenStates Legislative Tracking (state bills) ──
  app.get("/api/justice/live/legislation/:state", async (req, res) => {
    try {
      const stateAbbr = (req.params.state as string).toLowerCase();
      const openStatesKey = process.env.OPENSTATES_API_KEY;
      if (openStatesKey) {
        const query = `{ jurisdiction(name: "${stateAbbr}") { name legislativeSessions { identifier name startDate endDate } } }`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const r = await fetch("https://v3.openstates.org/graphql", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", "X-API-Key": openStatesKey },
          body: JSON.stringify({ query }),
        });
        clearTimeout(timer);
        const data = r.ok ? await r.json() : null;
        res.json({ state: stateAbbr, legislation: data, source: "OpenStates API" });
      } else {
        res.json({
          state: stateAbbr,
          searchUrls: {
            openStates: `https://openstates.org/${stateAbbr}/`,
            billTrack50: `https://www.billtrack50.com/LegislatorDetail/${stateAbbr}`,
            ncsl: `https://www.ncsl.org/research/civil-and-criminal-justice.aspx`,
            legislativeLookup: `https://legiscan.com/gaits/search?state=${stateAbbr.toUpperCase()}&query=criminal+justice`,
          },
          justiceKeywords: ["criminal justice reform", "sentencing reform", "juvenile justice", "expungement", "ban the box", "bail reform", "police accountability", "reentry", "diversion programs", "restorative justice", "clean slate", "raise the age"],
          source: "Legislative tracking URLs (configure OPENSTATES_API_KEY for live data)",
        });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message, source: "OpenStates" });
    }
  });

  // ── Geocoding: Address/City → FIPS codes for drill-down ──
  app.get("/api/justice/live/geocode", async (req, res) => {
    try {
      const address = req.query.address as string;
      const city = req.query.city as string;
      const state = req.query.state as string;
      const zip = req.query.zip as string;
      let searchStr = "";
      if (address) searchStr = address;
      else if (zip) searchStr = zip;
      else if (city && state) searchStr = `${city}, ${state}`;
      else return res.status(400).json({ error: "Provide address, city+state, or zip" });
      const geocodeData = await apiFetch(
        `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(searchStr)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
      ).catch(() => null);
      let result: any = null;
      if (geocodeData?.result?.addressMatches?.[0]) {
        const match = geocodeData.result.addressMatches[0];
        const geo = match.geographies;
        result = {
          matchedAddress: match.matchedAddress,
          coordinates: match.coordinates,
          stateFips: geo?.States?.[0]?.STATE || null,
          countyFips: geo?.Counties?.[0]?.COUNTY || null,
          countyName: geo?.Counties?.[0]?.NAME || null,
          tractFips: geo?.["Census Tracts"]?.[0]?.TRACT || null,
          blockGroup: geo?.["Census Block Groups"]?.[0]?.BLKGRP || null,
          congressionalDistrict: geo?.["118th Congressional Districts"]?.[0]?.CD118 || null,
          placeName: geo?.["Incorporated Places"]?.[0]?.NAME || geo?.["Census Designated Places"]?.[0]?.NAME || null,
        };
      }
      if (!result && zip) {
        const zipData = await apiFetch(
          `https://geocoding.geo.census.gov/geocoder/geographies/address?street=&city=&state=&zip=${zip}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
        ).catch(() => null);
        if (zipData?.result?.addressMatches?.[0]) {
          const match = zipData.result.addressMatches[0];
          const geo = match.geographies;
          result = {
            matchedAddress: match.matchedAddress,
            coordinates: match.coordinates,
            stateFips: geo?.States?.[0]?.STATE || null,
            countyFips: geo?.Counties?.[0]?.COUNTY || null,
            countyName: geo?.Counties?.[0]?.NAME || null,
            tractFips: geo?.["Census Tracts"]?.[0]?.TRACT || null,
          };
        }
      }
      res.json({
        query: searchStr,
        result,
        source: "U.S. Census Bureau Geocoding Services",
        usage: "Use stateFips/countyFips/tractFips to drill down into demographics, crime, housing, and school data",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Master Location Intelligence: One call → everything for a location ──
  app.get("/api/justice/live/location-intel", async (req, res) => {
    try {
      const zip = req.query.zip as string;
      const city = req.query.city as string;
      const state = req.query.state as string;
      const stateAbbr = (state || "").toUpperCase();
      if (!state) return res.status(400).json({ error: "State is required (2-letter abbreviation)" });

      const STATE_FIPS: Record<string, string> = {
        AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",
        HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
        MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
        NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
        SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",DC:"11",
      };
      const stateFips = STATE_FIPS[stateAbbr];
      if (!stateFips) return res.status(400).json({ error: `Unknown state: ${stateAbbr}` });

      let geoResult: any = null;
      if (zip || city) {
        const strategies = [
          zip ? `https://geocoding.geo.census.gov/geocoder/geographies/address?street=&city=&state=&zip=${zip}&benchmark=Public_AR_Current&vintage=Current_Current&format=json` : null,
          city ? `https://geocoding.geo.census.gov/geocoder/geographies/address?street=100+Main+St&city=${encodeURIComponent(city)}&state=${stateAbbr}&zip=&benchmark=Public_AR_Current&vintage=Current_Current&format=json` : null,
          city ? `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent("100 Main St, " + city + ", " + stateAbbr)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json` : null,
          zip ? `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(zip)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json` : null,
        ].filter(Boolean);
        for (const url of strategies) {
          try {
            const geoData = await apiFetch(url!, 8000);
            if (geoData?.result?.addressMatches?.[0]) {
              const m = geoData.result.addressMatches[0];
              const g = m.geographies;
              geoResult = {
                matchedAddress: m.matchedAddress,
                coordinates: m.coordinates,
                countyFips: g?.Counties?.[0]?.COUNTY,
                countyName: g?.Counties?.[0]?.NAME,
                tractFips: g?.["Census Tracts"]?.[0]?.TRACT,
                placeName: g?.["Incorporated Places"]?.[0]?.NAME || g?.["Census Designated Places"]?.[0]?.NAME,
              };
              break;
            }
          } catch {}
        }
        if (!geoResult) {
          try {
            const countyLookup = await apiFetch(
              `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E&for=county:*&in=state:${stateFips}`, 10000
            );
            if (countyLookup && Array.isArray(countyLookup) && city) {
              const cityLower = city.toLowerCase();
              const h = countyLookup[0];
              const cIdx = h.indexOf("county");
              const nameMatch = countyLookup.slice(1).find((r: string[]) => r[0]?.toLowerCase().includes(cityLower));
              if (nameMatch) {
                geoResult = { countyFips: nameMatch[cIdx], countyName: nameMatch[0], note: "Matched county containing city name" };
              }
            }
            if (!geoResult && countyLookup && Array.isArray(countyLookup)) {
              const h = countyLookup[0];
              const cIdx = h.indexOf("county");
              const biggest = countyLookup.slice(1).sort((a: string[], b: string[]) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0));
              if (biggest[0]) {
                geoResult = { countyFips: biggest[0][cIdx], countyName: biggest[0][0], note: "Largest county in state (city not matched to specific county)" };
              }
            }
          } catch {}
        }
      }
      const countyFips = geoResult?.countyFips || (req.query.county as string);
      const tractFips = geoResult?.tractFips || (req.query.tract as string);

      const [crimeData, countyDemographics, tractDemographics, resourceLinks] = await Promise.allSettled([
        apiFetch(`https://api.usa.gov/crime/fbi/sapi/api/estimates/states/${stateAbbr}/2022/2022?API_KEY=iiHnOKfno2Mgkt5AynpvPpUQTEyxE77jo1RU8PIv`, 8000),
        countyFips ? apiFetch(`https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E,B15003_017E,B15003_022E,B25077_001E,B25064_001E&for=county:${countyFips}&in=state:${stateFips}`, 8000) : Promise.reject("no county"),
        tractFips && countyFips ? apiFetch(`https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E,B25064_001E&for=tract:${tractFips}&in=state:${stateFips}+county:${countyFips}`, 8000) : Promise.reject("no tract"),
        Promise.resolve(zip ? {
          "211.org": `https://www.211.org/get-help/zip/${zip}`,
          "FindHelp.org": `https://www.findhelp.org/?postal=${zip}`,
          "FoodPantries.org": `https://www.foodpantries.org/zip/${zip}`,
          "FreeClinics.com": `https://www.freeclinics.com/zip/${zip}`,
          "LawHelp.org": `https://www.lawhelp.org/find-help/?zipcode=${zip}`,
          "HUD Housing": `https://apps.hud.gov/offices/hsg/sfh/hcc/hcs.cfm?webListAction=search&filterZip=${zip}`,
          "VITA Tax Prep": `https://irs.treasury.gov/freetaxprep/jsp/vita.jsp?zip=${zip}`,
          "Career Centers": `https://www.careeronestop.org/LocalHelp/service-locator.aspx?zip=${zip}`,
          "Childcare.gov": `https://childcare.gov/?zip=${zip}`,
          "SAMHSA Treatment": `https://findtreatment.gov/locator?sZip=${zip}`,
          "NeedyMeds Clinics": `https://www.needymeds.org/free-clinics?zip=${zip}`,
        } : null),
      ]);

      const parseCensus = (raw: any) => {
        if (!raw || !Array.isArray(raw) || raw.length < 2) return null;
        const h = raw[0]; const r = raw[1];
        const v = (name: string) => { const idx = h.indexOf(name); return idx >= 0 ? parseInt(r[idx]) || 0 : 0; };
        const pop = v("B01003_001E"); const povPop = v("B17001_001E"); const belowPov = v("B17001_002E");
        const unemp = v("B23025_005E"); const lf = v("B23025_002E");
        return {
          name: r[h.indexOf("NAME")],
          totalPopulation: pop,
          medianHouseholdIncome: v("B19013_001E"),
          povertyRate: povPop > 0 ? ((belowPov / povPop) * 100).toFixed(1) + "%" : null,
          unemploymentRate: lf > 0 ? ((unemp / lf) * 100).toFixed(1) + "%" : null,
          medianHomeValue: v("B25077_001E"),
          medianRent: v("B25064_001E"),
          hsGraduates: v("B15003_017E"),
          bachelorsOrHigher: v("B15003_022E"),
        };
      };

      res.json({
        location: { state: stateAbbr, stateFips, city: city || geoResult?.placeName, zip, county: geoResult?.countyName, countyFips, tractFips },
        geocode: geoResult,
        crimeEstimates: crimeData.status === "fulfilled" ? crimeData.value : null,
        countyDemographics: countyDemographics.status === "fulfilled" ? parseCensus(countyDemographics.value) : null,
        neighborhoodDemographics: tractDemographics.status === "fulfilled" ? parseCensus(tractDemographics.value) : null,
        localResources: resourceLinks.status === "fulfilled" ? resourceLinks.value : null,
        legislativeTracking: {
          openStates: `https://openstates.org/${stateAbbr.toLowerCase()}/`,
          legiScan: `https://legiscan.com/gaits/search?state=${stateAbbr}&query=criminal+justice`,
        },
        dataSources: [
          "FBI Crime Data Explorer (crime estimates)",
          "U.S. Census Bureau ACS 5-Year (demographics, poverty, employment, housing)",
          "Census Geocoding Services (location resolution)",
          "Community resource directories (211, FindHelp, SAMHSA, HUD, etc.)",
        ],
        drillDownAvailable: {
          hasCounty: !!countyFips,
          hasTract: !!tractFips,
          hasZip: !!zip,
          note: "County-level provides demographics for ~100K-1M population. Tract-level provides neighborhood data (~4K people). ZIP provides local service directories.",
        },
      });
    } catch (e: any) {
      console.error("Location intelligence error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ── State-Specific Legal Guides (expungement, rights) ──
  app.get("/api/justice/live/legal-guide/:state", async (req, res) => {
    try {
      const stateAbbr = (req.params.state as string).toUpperCase();
      const ragContext = getJusticeRAGContext("expungement legal rights reentry policy " + stateAbbr);
      const prompt = `You are the Justice Command Center legal guide AI. Provide a comprehensive, ACCURATE legal guide for ${stateAbbr}. This must be factual — do not make up laws.

Cover these topics for ${stateAbbr} specifically:
1. EXPUNGEMENT/RECORD SEALING: eligibility criteria, waiting periods, which offenses qualify, filing process, costs, relevant statutes
2. VOTING RIGHTS RESTORATION: when rights are restored (after incarceration? parole? probation?), registration process
3. BAN THE BOX/FAIR CHANCE HIRING: state and local laws, what employers can/cannot ask, when background checks happen
4. CLEAN SLATE: whether state has automatic expungement, what it covers
5. OCCUPATIONAL LICENSING BARRIERS: which licenses are restricted, appeal processes
6. HOUSING RIGHTS: restrictions on public housing with criminal records, fair housing protections
7. GOVERNMENT BENEFITS: which benefits are restricted (SNAP, TANF), restoration options
8. PAROLE/PROBATION SPECIFICS: key rules, supervision levels, early termination options
9. JUVENILE RECORDS: sealing/destruction rules, age of criminal responsibility
10. KEY LEGAL AID RESOURCES: specific organizations in ${stateAbbr} that provide free legal help

CONTEXT: ${ragContext}

Return as a JSON object with these 10 categories as keys, each containing "summary", "keyStatutes", "actionSteps", and "resources" arrays.`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 3000);
      let parsed;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { guide: aiResponse };
      } catch { parsed = { guide: aiResponse }; }

      res.json({
        state: stateAbbr,
        legalGuide: parsed,
        disclaimer: "This information is for educational purposes only and does not constitute legal advice. Laws change frequently. Always consult with a licensed attorney in your state.",
        source: "AI-generated from current legal databases, statutes, and case law",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── State FIPS lookup ──
  app.get("/api/justice/live/fips-lookup", (_req, res) => {
    res.json({
      states: {
        AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",DC:"11",FL:"12",GA:"13",
        HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
        MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
        NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
        SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",
      },
    });
  });
}
