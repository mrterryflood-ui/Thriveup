import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  evidenceBasedPrograms, ebpImplementations, environmentalStrategies,
  strategyMetrics, cfirAssessments,
  insertEvidenceBasedProgramSchema, insertEbpImplementationSchema,
  insertEnvironmentalStrategySchema, insertStrategyMetricSchema,
  insertCfirAssessmentSchema,
} from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { storage } from "./storage";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

const EBP_SEED_DATA = [
  {
    id: "ebp-lst",
    name: "LifeSkills Training (LST)",
    acronym: "LST",
    description: "Evidence-based universal prevention program that teaches personal self-management skills, social skills, and drug resistance skills to middle school students.",
    targetPopulation: "Middle school students (universal)",
    ageRange: "11-14",
    evidenceLevel: "strong",
    outcomesDemo: ["Reduced alcohol use by 50%", "Reduced marijuana use by 60%", "Reduced tobacco use by 75%", "Improved social skills"],
    implementationReqs: "Trained facilitators, 30-session curriculum over 3 years, classroom setting",
    costEstimate: "$875 per classroom kit",
    culturalAdaptability: "Adapted versions for Hispanic/Latino, African American, and rural communities",
    fidelityMeasures: "Structured observation checklist, session completion logs, student assessments",
    registrySource: "SAMHSA NREPP, Blueprints for Healthy Youth Development",
    websiteUrl: "https://www.lifeskillstraining.com",
    stakeholderFit: { youth: true, parents: false, educators: true, veterans: false, returning_citizens: false, neurodivergent: true },
  },
  {
    id: "ebp-success",
    name: "Project SUCCESS",
    acronym: "SUCCESS",
    description: "School-based program for high-risk youth providing substance abuse education, individual and group counseling, and referral services.",
    targetPopulation: "High-risk adolescents in alternative schools",
    ageRange: "14-18",
    evidenceLevel: "strong",
    outcomesDemo: ["Reduced substance use", "Improved school attendance", "Decreased behavioral problems", "Increased connection to services"],
    implementationReqs: "Licensed counselor, school partnership, referral network",
    costEstimate: "$2,500-5,000 per school site annually",
    culturalAdaptability: "Adaptable to diverse populations with cultural sensitivity training",
    fidelityMeasures: "Service delivery logs, outcome tracking, supervision protocols",
    registrySource: "SAMHSA NREPP",
    websiteUrl: "https://www.sascorp.org/project-success",
    stakeholderFit: { youth: true, parents: true, educators: true, veterans: false, returning_citizens: true, neurodivergent: true },
  },
  {
    id: "ebp-ctc",
    name: "Communities That Care (CTC)",
    acronym: "CTC",
    description: "Community-level prevention operating system that guides coalitions through a 5-phase process to reduce risk factors and enhance protective factors.",
    targetPopulation: "Entire community (universal system)",
    ageRange: "All ages",
    evidenceLevel: "strong",
    outcomesDemo: ["30% reduction in youth delinquency", "25% reduction in substance initiation", "Improved community collaboration", "Sustained prevention effects at 9-year follow-up"],
    implementationReqs: "Community coalition, trained CTC coordinator, youth survey data, 2-3 year implementation cycle",
    costEstimate: "$50,000-100,000 per community for initial implementation",
    culturalAdaptability: "Implemented in 500+ communities across diverse populations",
    fidelityMeasures: "CTC milestones and benchmarks, community readiness scores, fidelity monitoring system",
    registrySource: "Blueprints for Healthy Youth Development (Model Plus)",
    websiteUrl: "https://www.communitiesthatcare.net",
    stakeholderFit: { youth: true, parents: true, educators: true, veterans: true, returning_citizens: true, neurodivergent: true },
  },
  {
    id: "ebp-sfp",
    name: "Strengthening Families Program (SFP)",
    acronym: "SFP",
    description: "Family-based prevention program providing parenting skills, children's life skills, and family practice sessions to reduce substance use and behavior problems.",
    targetPopulation: "Families with children ages 6-11",
    ageRange: "6-11 (with parents)",
    evidenceLevel: "strong",
    outcomesDemo: ["Reduced substance use initiation", "Improved parenting skills", "Decreased family conflict", "Improved child behavior"],
    implementationReqs: "Trained facilitators (2 per group), 14-session curriculum, family recruitment strategy",
    costEstimate: "$1,200-2,500 per family",
    culturalAdaptability: "Culturally adapted for African American, Hispanic, Asian, Pacific Islander, and Native American families",
    fidelityMeasures: "Facilitator observation ratings, attendance records, pre/post family assessments",
    registrySource: "SAMHSA NREPP, Blueprints for Healthy Youth Development",
    websiteUrl: "https://strengtheningfamiliesprogram.org",
    stakeholderFit: { youth: true, parents: true, educators: false, veterans: true, returning_citizens: true, neurodivergent: true },
  },
  {
    id: "ebp-tgfd",
    name: "Too Good for Drugs",
    acronym: "TGFD",
    description: "K-12 prevention curriculum building social-emotional skills, peer resistance, and healthy decision-making to prevent substance use.",
    targetPopulation: "K-12 students (universal)",
    ageRange: "5-18",
    evidenceLevel: "promising",
    outcomesDemo: ["Reduced intention to use substances", "Improved emotional competence", "Increased conflict resolution skills"],
    implementationReqs: "Teacher training, grade-specific curriculum materials, classroom delivery",
    costEstimate: "$300-500 per classroom",
    culturalAdaptability: "Designed for diverse populations, used in 50 states",
    fidelityMeasures: "Lesson completion logs, teacher self-assessment, student pre/post surveys",
    registrySource: "SAMHSA NREPP",
    websiteUrl: "https://www.toogoodprograms.org",
    stakeholderFit: { youth: true, parents: false, educators: true, veterans: false, returning_citizens: false, neurodivergent: true },
  },
  {
    id: "ebp-prosper",
    name: "PROSPER",
    acronym: "PROSPER",
    description: "Community-university partnership delivery system sustaining evidence-based family and youth programs through existing community infrastructure.",
    targetPopulation: "Rural and semi-rural communities",
    ageRange: "10-14 (with families)",
    evidenceLevel: "strong",
    outcomesDemo: ["Reduced substance use initiation", "Improved family functioning", "Sustained community prevention capacity"],
    implementationReqs: "University partnership, community team, trained coordinators, school and community agency collaboration",
    costEstimate: "$25,000-50,000 per community per year",
    culturalAdaptability: "Primarily tested in rural communities, adaptable to suburban settings",
    fidelityMeasures: "Implementation quality ratings, partnership assessments, outcome data tracking",
    registrySource: "Blueprints for Healthy Youth Development",
    websiteUrl: "https://www.prosper.ppsi.iastate.edu",
    stakeholderFit: { youth: true, parents: true, educators: true, veterans: false, returning_citizens: false, neurodivergent: false },
  },
  {
    id: "ebp-alert",
    name: "Project ALERT",
    acronym: "ALERT",
    description: "Middle school substance prevention curriculum using participatory activities to motivate against substance use and build resistance skills.",
    targetPopulation: "Middle school students",
    ageRange: "11-14",
    evidenceLevel: "promising",
    outcomesDemo: ["Reduced marijuana initiation by 30%", "Reduced cigarette use", "Reduced alcohol misuse"],
    implementationReqs: "Trained teachers, 14-lesson curriculum in 7th and 8th grades",
    costEstimate: "$200-400 per classroom",
    culturalAdaptability: "Tested across diverse student populations including urban and rural",
    fidelityMeasures: "Lesson delivery checklists, student engagement ratings",
    registrySource: "SAMHSA NREPP",
    websiteUrl: "https://www.projectalert.com",
    stakeholderFit: { youth: true, parents: false, educators: true, veterans: false, returning_citizens: false, neurodivergent: true },
  },
  {
    id: "ebp-ggc",
    name: "Guiding Good Choices",
    acronym: "GGC",
    description: "Parent education program providing skills to reduce risk for early substance use by teaching parents interaction and communication strategies.",
    targetPopulation: "Parents of children ages 9-14",
    ageRange: "9-14 (parent program)",
    evidenceLevel: "promising",
    outcomesDemo: ["Reduced alcohol and marijuana initiation", "Improved parent-child communication", "Reduced family conflict"],
    implementationReqs: "Trained facilitators, 5-session workshop series, parent recruitment plan",
    costEstimate: "$500-1,000 per family group",
    culturalAdaptability: "Adaptable for diverse cultural groups with facilitator training",
    fidelityMeasures: "Session observation ratings, attendance tracking, parent surveys",
    registrySource: "SAMHSA NREPP",
    websiteUrl: "https://www.channing-bete.com/ggc",
    stakeholderFit: { youth: false, parents: true, educators: false, veterans: true, returning_citizens: true, neurodivergent: false },
  },
  {
    id: "ebp-kir",
    name: "keepin' it REAL",
    acronym: "kiR",
    description: "Culturally grounded substance use prevention curriculum for middle schoolers using narrative-based pedagogy and media literacy.",
    targetPopulation: "Middle school students in diverse communities",
    ageRange: "12-14",
    evidenceLevel: "strong",
    outcomesDemo: ["Reduced substance use", "Improved anti-drug attitudes", "Enhanced refusal skills", "Cultural identity strengthening"],
    implementationReqs: "Trained teachers, 10-lesson curriculum, culturally grounded materials",
    costEstimate: "$250-500 per classroom",
    culturalAdaptability: "Originally developed for Mexican/Mexican-American youth; adapted for multiple cultural groups",
    fidelityMeasures: "Lesson delivery logs, student knowledge assessments, teacher observation protocols",
    registrySource: "SAMHSA NREPP, Blueprints for Healthy Youth Development",
    websiteUrl: "https://real-prevention.com",
    stakeholderFit: { youth: true, parents: false, educators: true, veterans: false, returning_citizens: false, neurodivergent: true },
  },
  {
    id: "ebp-botvin",
    name: "Botvin LifeSkills Training",
    acronym: "BLST",
    description: "Comprehensive social-emotional learning and substance abuse prevention program targeting cognitive-behavioral skills for youth.",
    targetPopulation: "Elementary through high school students",
    ageRange: "8-18",
    evidenceLevel: "strong",
    outcomesDemo: ["Up to 75% reduction in tobacco use", "Up to 60% reduction in alcohol use", "Up to 75% reduction in marijuana use", "Reduced violence and risky behavior"],
    implementationReqs: "Trained teachers/facilitators, multi-year curriculum, classroom delivery",
    costEstimate: "$600-1,200 per classroom kit",
    culturalAdaptability: "Validated across diverse populations; available in Spanish",
    fidelityMeasures: "Implementation checklists, student outcome measures, teacher evaluations",
    registrySource: "SAMHSA NREPP, Blueprints for Healthy Youth Development (Model)",
    websiteUrl: "https://www.lifeskillstraining.com",
    stakeholderFit: { youth: true, parents: false, educators: true, veterans: false, returning_citizens: false, neurodivergent: true },
  },
];

const STRATEGY_CATEGORIES = [
  { key: "access_availability", label: "Access/Availability Reduction" },
  { key: "social_norms", label: "Social Norms Change" },
  { key: "policy_enforcement", label: "Policy/Enforcement" },
  { key: "community_design", label: "Community Design" },
  { key: "economic_incentives", label: "Economic Incentives" },
  { key: "media_advocacy", label: "Media Advocacy" },
  { key: "coalition_capacity", label: "Coalition Capacity Building" },
];

export function registerPreventionStrategiesRoutes(app: Express) {
  seedEBPData();

  app.get("/api/prevention-strategies/programs", async (_req, res) => {
    try {
      const programs = await db.select().from(evidenceBasedPrograms);
      res.json(programs);
    } catch (error) {
      console.error("Failed to fetch EBP programs:", error);
      res.status(500).json({ error: "Failed to fetch programs" });
    }
  });

  app.get("/api/prevention-strategies/programs/:id", async (req, res) => {
    try {
      const [program] = await db.select().from(evidenceBasedPrograms).where(eq(evidenceBasedPrograms.id, req.params.id));
      if (!program) return res.status(404).json({ error: "Program not found" });
      res.json(program);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  app.post("/api/prevention-strategies/programs", requireAuth, async (req, res) => {
    try {
      const parsed = insertEvidenceBasedProgramSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [program] = await db.insert(evidenceBasedPrograms).values(parsed.data).returning();
      res.json(program);
    } catch (error) {
      res.status(500).json({ error: "Failed to create program" });
    }
  });

  app.get("/api/prevention-strategies/implementations", async (_req, res) => {
    try {
      const impls = await db.select().from(ebpImplementations).orderBy(desc(ebpImplementations.createdAt));
      res.json(impls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch implementations" });
    }
  });

  app.post("/api/prevention-strategies/implementations", requireAuth, async (req, res) => {
    try {
      const parsed = insertEbpImplementationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [impl] = await db.insert(ebpImplementations).values(parsed.data).returning();
      res.json(impl);
    } catch (error) {
      res.status(500).json({ error: "Failed to create implementation" });
    }
  });

  app.patch("/api/prevention-strategies/implementations/:id", requireAuth, async (req, res) => {
    try {
      const allowed = insertEbpImplementationSchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(ebpImplementations).set(allowed.data).where(eq(ebpImplementations.id, String(req.params.id))).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update implementation" });
    }
  });

  app.get("/api/prevention-strategies/strategies", async (_req, res) => {
    try {
      const strategies = await db.select().from(environmentalStrategies).orderBy(desc(environmentalStrategies.createdAt));
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.post("/api/prevention-strategies/strategies", requireAuth, async (req, res) => {
    try {
      const parsed = insertEnvironmentalStrategySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [strategy] = await db.insert(environmentalStrategies).values(parsed.data).returning();
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: "Failed to create strategy" });
    }
  });

  app.patch("/api/prevention-strategies/strategies/:id", requireAuth, async (req, res) => {
    try {
      const allowed = insertEnvironmentalStrategySchema.partial().safeParse(req.body);
      if (!allowed.success) return res.status(400).json({ error: "Invalid data" });
      const [updated] = await db.update(environmentalStrategies).set(allowed.data).where(eq(environmentalStrategies.id, String(req.params.id))).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update strategy" });
    }
  });

  app.get("/api/prevention-strategies/strategy-metrics/:strategyId", async (req, res) => {
    try {
      const metrics = await db.select().from(strategyMetrics).where(eq(strategyMetrics.strategyId, req.params.strategyId));
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.post("/api/prevention-strategies/strategy-metrics", requireAuth, async (req, res) => {
    try {
      const parsed = insertStrategyMetricSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [metric] = await db.insert(strategyMetrics).values(parsed.data).returning();
      res.json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to create metric" });
    }
  });

  app.get("/api/prevention-strategies/cfir", async (_req, res) => {
    try {
      const assessments = await db.select().from(cfirAssessments).orderBy(desc(cfirAssessments.createdAt));
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CFIR assessments" });
    }
  });

  app.post("/api/prevention-strategies/cfir", requireAuth, async (req, res) => {
    try {
      const parsed = insertCfirAssessmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const data = parsed.data;
      const ic = data.interventionCharacteristics ?? 0;
      const os = data.outerSetting ?? 0;
      const is_ = data.innerSetting ?? 0;
      const ind = data.individuals ?? 0;
      const ip = data.implementationProcess ?? 0;
      const overallScore = Math.round((ic + os + is_ + ind + ip) / 5);
      const [assessment] = await db.insert(cfirAssessments).values({ ...data, overallScore, assessorId: getUserId(req as Request) || data.assessorId }).returning();
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create CFIR assessment" });
    }
  });

  app.get("/api/prevention-strategies/categories", (_req, res) => {
    res.json(STRATEGY_CATEGORIES);
  });

  app.get("/api/prevention-strategies/dashboard", async (_req, res) => {
    try {
      const totalPrograms = await db.select({ count: count() }).from(evidenceBasedPrograms);
      const totalImpls = await db.select({ count: count() }).from(ebpImplementations);
      const totalStrategies = await db.select({ count: count() }).from(environmentalStrategies);
      const totalCfir = await db.select({ count: count() }).from(cfirAssessments);
      const demoStrategies = await db.select({ count: count() }).from(environmentalStrategies).where(eq(environmentalStrategies.isDemoData, true));

      res.json({
        totalPrograms: totalPrograms[0]?.count || 0,
        totalImplementations: totalImpls[0]?.count || 0,
        totalStrategies: totalStrategies[0]?.count || 0,
        totalCfirAssessments: totalCfir[0]?.count || 0,
        dataProvenance: {
          totalStrategies: totalStrategies[0]?.count || 0,
          demoStrategies: demoStrategies[0]?.count || 0,
          hasDemoData: (demoStrategies[0]?.count || 0) > 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });
}

async function seedEBPData() {
  try {
    const existing = await db.select().from(evidenceBasedPrograms);
    if (existing.length > 0) return;
    await db.insert(evidenceBasedPrograms).values(EBP_SEED_DATA);
    console.log("[prevention-strategies] Seeded EBP registry with", EBP_SEED_DATA.length, "programs");
  } catch (e) {
    console.error("[prevention-strategies] Seed error:", e);
  }
}
