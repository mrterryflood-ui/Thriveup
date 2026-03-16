import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  workforceAssessments, trainingPrograms, trainingEnrollments,
  employerPartners, jobPostings, jobPlacements, retentionChecks,
  jobReadinessChecklists,
  insertWorkforceAssessmentSchema, insertTrainingProgramSchema,
  insertTrainingEnrollmentSchema, insertEmployerPartnerSchema,
  insertJobPostingSchema, insertJobPlacementSchema,
  insertRetentionCheckSchema, insertJobReadinessChecklistSchema,
} from "@shared/schema";
import { eq, desc, sql, and, count } from "drizzle-orm";
import { storage } from "./storage";
import { z } from "zod";

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

const workHistoryEntrySchema = z.object({
  title: z.string(),
  duration: z.string(),
  description: z.string().optional().default(""),
});

const personalizedPlanSchema = z.object({
  recommendations: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
  programs: z.array(z.string()).default([]),
});

const assessmentDataSchema = z.object({
  skills: z.array(z.string()).optional(),
  workHistory: z.array(workHistoryEntrySchema).optional(),
  educationLevel: z.string().optional(),
  barriers: z.array(z.string()).optional(),
  careerInterests: z.array(z.string()).optional(),
  readinessLevel: z.string().optional(),
}).passthrough();

const assessmentCreateSchema = z.object({
  userName: z.string().min(1),
  skills: z.array(z.string()).default([]),
  workHistory: z.array(workHistoryEntrySchema).default([]),
  educationLevel: z.string().default(""),
  barriers: z.array(z.string()).default([]),
  careerInterests: z.array(z.string()).default([]),
  readinessLevel: z.string().default("exploring"),
  assessmentData: assessmentDataSchema.default({}),
  personalizedPlan: personalizedPlanSchema.default({ recommendations: [], nextSteps: [], programs: [] }),
  status: z.string().default("draft"),
});

const assessmentUpdateSchema = z.object({
  skills: z.array(z.string()).optional(),
  workHistory: z.array(workHistoryEntrySchema).optional(),
  educationLevel: z.string().optional(),
  barriers: z.array(z.string()).optional(),
  careerInterests: z.array(z.string()).optional(),
  readinessLevel: z.string().optional(),
  assessmentData: assessmentDataSchema.optional(),
  personalizedPlan: personalizedPlanSchema.optional(),
  status: z.string().optional(),
});

const enrollmentCreateSchema = z.object({
  userName: z.string().min(1),
  programId: z.string().min(1),
  status: z.string().default("enrolled"),
});

const enrollmentUpdateSchema = z.object({
  status: z.string().optional(),
  attendanceRate: z.number().optional(),
  credentialsEarned: z.array(z.string()).optional(),
  actualCompletion: z.string().optional(),
  notes: z.string().optional(),
});

const readinessUpdateSchema = z.object({
  resumeComplete: z.boolean().optional(),
  interviewSkills: z.boolean().optional(),
  professionalAttire: z.boolean().optional(),
  transportationPlan: z.boolean().optional(),
  childcarePlan: z.boolean().optional(),
  backgroundDisclosure: z.boolean().optional(),
  bankAccount: z.boolean().optional(),
  identificationDocs: z.boolean().optional(),
  notes: z.string().optional(),
});

async function autoSeedIfEmpty() {
  try {
    const existing = await db.select({ count: count() }).from(trainingPrograms);
    if ((existing[0]?.count ?? 0) > 0) return;

    const seedPrograms = [
      { name: "Job Corps", provider: "U.S. Department of Labor", programType: "residential", description: "Free residential education and job training program for young people ages 16-24.", credentials: ["GED", "High School Diploma", "Industry Certifications"], durationWeeks: 52, cost: "Free", location: "Multiple locations nationwide", url: "https://www.jobcorps.gov", eligibility: "Ages 16-24, low-income", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["youth", "residential", "free"] },
      { name: "YouthBuild", provider: "U.S. Department of Labor", programType: "community", description: "Community-based program for opportunity youth ages 16-24 combining education with construction skills training.", credentials: ["GED", "OSHA Certification", "NCCER Certification"], durationWeeks: 40, cost: "Free", location: "270+ programs nationwide", url: "https://youthbuild.org", eligibility: "Ages 16-24, low-income", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["youth", "construction"] },
      { name: "American Job Center Services", provider: "State Workforce Agencies", programType: "career-services", description: "One-stop career centers offering job search assistance, resume help, and training referrals.", credentials: [], durationWeeks: null, cost: "Free", location: "2,400+ centers nationwide", url: "https://www.careeronestop.org", eligibility: "All adults and youth", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["career-services", "free"] },
      { name: "CompTIA A+ Certification", provider: "CompTIA", programType: "certification", description: "Entry-level IT certification covering hardware, software, networking, and troubleshooting.", credentials: ["CompTIA A+"], durationWeeks: 12, cost: "$246 per exam", location: "Online + testing centers", url: "https://www.comptia.org", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["IT", "certification"] },
      { name: "Google Career Certificates", provider: "Google / Coursera", programType: "online-certification", description: "Professional certificates in IT Support, Data Analytics, Project Management, and UX Design.", credentials: ["Google IT Support Certificate", "Google Data Analytics Certificate"], durationWeeks: 24, cost: "$49/month", location: "Online", url: "https://grow.google/certificates/", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["online", "tech"] },
      { name: "AWS Cloud Practitioner", provider: "Amazon Web Services", programType: "certification", description: "Foundational cloud computing certification for cloud concepts and AWS services.", credentials: ["AWS Certified Cloud Practitioner"], durationWeeks: 8, cost: "$100 exam fee", location: "Online + testing centers", url: "https://aws.amazon.com/certification/", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: false, tags: ["cloud", "tech"] },
      { name: "Registered Apprenticeship Programs", provider: "U.S. Department of Labor", programType: "apprenticeship", description: "Earn-and-learn model combining on-the-job training with instruction in 1,000+ occupations.", credentials: ["Journeyworker Certificate"], durationWeeks: 104, cost: "Paid", location: "Nationwide", url: "https://www.apprenticeship.gov", eligibility: "Typically 18+", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["apprenticeship", "paid"] },
      { name: "Community College Career Programs", provider: "Local Community Colleges", programType: "associate-degree", description: "Two-year degree and certificate programs in high-demand fields.", credentials: ["Associate Degree", "Career Certificates"], durationWeeks: 104, cost: "Varies", location: "Local community colleges", url: "https://www.aacc.nche.edu", eligibility: "High school diploma or GED", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["college", "degree"] },
      { name: "OSHA 10/30 Safety Training", provider: "OSHA", programType: "certification", description: "Occupational safety training required for many construction and industry jobs.", credentials: ["OSHA 10-Hour Card", "OSHA 30-Hour Card"], durationWeeks: 1, cost: "$25-$75", location: "Online + in-person", url: "https://www.osha.gov", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["safety", "construction"] },
      { name: "CDL Training Program", provider: "Various providers", programType: "vocational", description: "Commercial Driver's License training for careers in trucking and transportation.", credentials: ["Commercial Driver's License (CDL)"], durationWeeks: 4, cost: "$3,000-$7,000", location: "Nationwide", url: "https://www.fmcsa.dot.gov", eligibility: "21+ for interstate", barrierFriendly: true, justiceInvolvedFriendly: false, tags: ["trucking", "vocational"] },
    ];

    const seedEmployers = [
      { companyName: "Goodwill Industries", industry: "Nonprofit/Retail", contactName: "Hiring Department", hiringCommitments: "Fair chance employer with workforce development programs", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Goodwill provides job training and employment placement services.", location: "Nationwide", website: "https://www.goodwill.org", partnershipStatus: "active" },
      { companyName: "Amazon", industry: "Technology/Logistics", contactName: "Workforce Partnerships", hiringCommitments: "Committed to hiring veterans and military spouses", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Entry-level warehouse, delivery, and tech positions with career advancement.", location: "Nationwide", website: "https://www.amazon.jobs", partnershipStatus: "active" },
      { companyName: "Greyston Bakery", industry: "Food Manufacturing", contactName: "Open Hiring Team", hiringCommitments: "Open Hiring - no background checks, no interviews", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Pioneer of Open Hiring practice.", location: "Yonkers, NY", website: "https://greyston.org", partnershipStatus: "active" },
      { companyName: "Dave's Killer Bread", industry: "Food Manufacturing", contactName: "Second Chance Employment", hiringCommitments: "One-third of workforce are formerly incarcerated", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "A Second Chance employer that actively recruits people with criminal backgrounds.", location: "Oregon/Nationwide", website: "https://www.daveskillerbread.com", partnershipStatus: "active" },
      { companyName: "JPMorgan Chase", industry: "Financial Services", contactName: "Second Chance Hiring", hiringCommitments: "Committed to Second Chance hiring and removing barriers", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Major bank with established Second Chance hiring initiative.", location: "Nationwide", website: "https://www.jpmorganchase.com", partnershipStatus: "active" },
    ];

    for (const prog of seedPrograms) {
      await db.insert(trainingPrograms).values(prog);
    }
    for (const emp of seedEmployers) {
      await db.insert(employerPartners).values(emp);
    }
    console.log("Auto-seeded workforce data: 10 training programs, 5 employer partners");
  } catch (error) {
    console.error("Auto-seed failed (non-fatal):", error);
  }
}

autoSeedIfEmpty();

export function registerWorkforceRoutes(app: Express) {

  app.get("/api/workforce/assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const results = await db.select().from(workforceAssessments).where(eq(workforceAssessments.userId, userId)).orderBy(desc(workforceAssessments.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/workforce/assessments/all", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const results = await db.select().from(workforceAssessments).orderBy(desc(workforceAssessments.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch all assessments:", error);
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.post("/api/workforce/assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = assessmentCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [assessment] = await db.insert(workforceAssessments).values({ ...parsed.data, userId }).returning();
      res.json(assessment);
    } catch (error) {
      console.error("Failed to create assessment:", error);
      res.status(500).json({ error: "Failed to create assessment" });
    }
  });

  app.patch("/api/workforce/assessments/:id", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const assessmentId = req.params.id as string;
      const [existing] = await db.select().from(workforceAssessments).where(and(eq(workforceAssessments.id, assessmentId), eq(workforceAssessments.userId, userId)));
      if (!existing) return res.status(404).json({ error: "Assessment not found" });
      const parsed = assessmentUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const updatePayload: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      const [updated] = await db.update(workforceAssessments).set(updatePayload).where(eq(workforceAssessments.id, assessmentId)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update assessment:", error);
      res.status(500).json({ error: "Failed to update assessment" });
    }
  });

  app.get("/api/workforce/training-programs", async (_req, res) => {
    try {
      const results = await db.select().from(trainingPrograms).where(eq(trainingPrograms.isActive, true)).orderBy(trainingPrograms.name);
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch training programs:", error);
      res.status(500).json({ error: "Failed to fetch training programs" });
    }
  });

  app.post("/api/workforce/training-programs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertTrainingProgramSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [program] = await db.insert(trainingPrograms).values(parsed.data).returning();
      res.json(program);
    } catch (error) {
      console.error("Failed to create training program:", error);
      res.status(500).json({ error: "Failed to create training program" });
    }
  });

  app.get("/api/workforce/enrollments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const results = await db.select().from(trainingEnrollments).where(eq(trainingEnrollments.userId, userId)).orderBy(desc(trainingEnrollments.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/workforce/enrollments/all", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const results = await db.select().from(trainingEnrollments).orderBy(desc(trainingEnrollments.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch all enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/workforce/enrollments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = enrollmentCreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [enrollment] = await db.insert(trainingEnrollments).values({ ...parsed.data, userId }).returning();
      res.json(enrollment);
    } catch (error) {
      console.error("Failed to create enrollment:", error);
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  app.patch("/api/workforce/enrollments/:id", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const enrollmentId = req.params.id as string;
      const [existing] = await db.select().from(trainingEnrollments).where(and(eq(trainingEnrollments.id, enrollmentId), eq(trainingEnrollments.userId, userId)));
      if (!existing) return res.status(404).json({ error: "Enrollment not found" });
      const parsed = enrollmentUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const updatePayload: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      const [updated] = await db.update(trainingEnrollments).set(updatePayload).where(eq(trainingEnrollments.id, enrollmentId)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update enrollment:", error);
      res.status(500).json({ error: "Failed to update enrollment" });
    }
  });

  app.get("/api/workforce/employers", async (_req, res) => {
    try {
      const results = await db.select().from(employerPartners).orderBy(employerPartners.companyName);
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch employers:", error);
      res.status(500).json({ error: "Failed to fetch employers" });
    }
  });

  app.post("/api/workforce/employers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertEmployerPartnerSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [employer] = await db.insert(employerPartners).values(parsed.data).returning();
      res.json(employer);
    } catch (error) {
      console.error("Failed to create employer:", error);
      res.status(500).json({ error: "Failed to create employer" });
    }
  });

  app.get("/api/workforce/job-postings", async (_req, res) => {
    try {
      const results = await db.select().from(jobPostings).where(eq(jobPostings.status, "open")).orderBy(desc(jobPostings.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch job postings:", error);
      res.status(500).json({ error: "Failed to fetch job postings" });
    }
  });

  app.post("/api/workforce/job-postings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertJobPostingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [posting] = await db.insert(jobPostings).values(parsed.data).returning();
      res.json(posting);
    } catch (error) {
      console.error("Failed to create job posting:", error);
      res.status(500).json({ error: "Failed to create job posting" });
    }
  });

  app.get("/api/workforce/placements", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const results = await db.select().from(jobPlacements).where(eq(jobPlacements.userId, userId)).orderBy(desc(jobPlacements.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch placements:", error);
      res.status(500).json({ error: "Failed to fetch placements" });
    }
  });

  app.get("/api/workforce/placements/all", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const results = await db.select().from(jobPlacements).orderBy(desc(jobPlacements.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch all placements:", error);
      res.status(500).json({ error: "Failed to fetch placements" });
    }
  });

  app.post("/api/workforce/placements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertJobPlacementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [placement] = await db.insert(jobPlacements).values(parsed.data).returning();
      res.json(placement);
    } catch (error) {
      console.error("Failed to create placement:", error);
      res.status(500).json({ error: "Failed to create placement" });
    }
  });

  app.get("/api/workforce/retention-checks", requireAuth, requireAdmin, async (req, res) => {
    try {
      const placementId = req.query.placementId as string | undefined;
      let results;
      if (placementId) {
        results = await db.select().from(retentionChecks).where(eq(retentionChecks.placementId, placementId)).orderBy(desc(retentionChecks.checkDate));
      } else {
        results = await db.select().from(retentionChecks).orderBy(desc(retentionChecks.checkDate));
      }
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch retention checks:", error);
      res.status(500).json({ error: "Failed to fetch retention checks" });
    }
  });

  app.post("/api/workforce/retention-checks", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertRetentionCheckSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [check] = await db.insert(retentionChecks).values(parsed.data).returning();
      res.json(check);
    } catch (error) {
      console.error("Failed to create retention check:", error);
      res.status(500).json({ error: "Failed to create retention check" });
    }
  });

  app.get("/api/workforce/readiness", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [checklist] = await db.select().from(jobReadinessChecklists).where(eq(jobReadinessChecklists.userId, userId));
      res.json(checklist || null);
    } catch (error) {
      console.error("Failed to fetch readiness checklist:", error);
      res.status(500).json({ error: "Failed to fetch readiness checklist" });
    }
  });

  app.post("/api/workforce/readiness", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = readinessUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const existing = await db.select().from(jobReadinessChecklists).where(eq(jobReadinessChecklists.userId, userId));
      if (existing.length > 0) {
        const [updated] = await db.update(jobReadinessChecklists).set({ ...parsed.data, updatedAt: new Date() }).where(eq(jobReadinessChecklists.userId, userId)).returning();
        return res.json(updated);
      }
      const [checklist] = await db.insert(jobReadinessChecklists).values({ ...parsed.data, userId }).returning();
      res.json(checklist);
    } catch (error) {
      console.error("Failed to save readiness checklist:", error);
      res.status(500).json({ error: "Failed to save readiness checklist" });
    }
  });

  app.get("/api/workforce/dashboard", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [assessmentCount] = await db.select({ count: count() }).from(workforceAssessments);
      const [enrollmentCount] = await db.select({ count: count() }).from(trainingEnrollments);
      const [placementCount] = await db.select({ count: count() }).from(jobPlacements);
      const [employerCount] = await db.select({ count: count() }).from(employerPartners);
      const [programCount] = await db.select({ count: count() }).from(trainingPrograms);
      const [retentionCount] = await db.select({ count: count() }).from(retentionChecks);

      const allEnrollments = await db.select().from(trainingEnrollments);
      const completedEnrollments = allEnrollments.filter(e => e.status === "completed");
      const completionRate = allEnrollments.length > 0 ? Math.round((completedEnrollments.length / allEnrollments.length) * 100) : 0;

      const allPlacements = await db.select().from(jobPlacements);
      const activePlacements = allPlacements.filter(p => p.status === "active");

      const allRetention = await db.select().from(retentionChecks);
      const retainedChecks = allRetention.filter(r => r.employmentStatus === "employed");
      const retentionRate = allRetention.length > 0 ? Math.round((retainedChecks.length / allRetention.length) * 100) : 0;

      const retention30 = allRetention.filter(r => r.checkPeriodDays === 30);
      const retention90 = allRetention.filter(r => r.checkPeriodDays === 90);
      const retention180 = allRetention.filter(r => r.checkPeriodDays === 180);
      const retention365 = allRetention.filter(r => r.checkPeriodDays === 365);

      res.json({
        totalAssessments: assessmentCount?.count ?? 0,
        totalEnrollments: enrollmentCount?.count ?? 0,
        totalPlacements: placementCount?.count ?? 0,
        totalEmployers: employerCount?.count ?? 0,
        totalPrograms: programCount?.count ?? 0,
        totalRetentionChecks: retentionCount?.count ?? 0,
        trainingCompletionRate: completionRate,
        activePlacements: activePlacements.length,
        overallRetentionRate: retentionRate,
        retentionByPeriod: {
          thirtyDay: { total: retention30.length, retained: retention30.filter(r => r.employmentStatus === "employed").length },
          ninetyDay: { total: retention90.length, retained: retention90.filter(r => r.employmentStatus === "employed").length },
          sixMonth: { total: retention180.length, retained: retention180.filter(r => r.employmentStatus === "employed").length },
          twelveMonth: { total: retention365.length, retained: retention365.filter(r => r.employmentStatus === "employed").length },
        },
        pipelineStages: {
          assessment: assessmentCount?.count ?? 0,
          training: enrollmentCount?.count ?? 0,
          placed: placementCount?.count ?? 0,
          retained: retainedChecks.length,
        },
      });
    } catch (error) {
      console.error("Failed to fetch workforce dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/workforce/seed", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const existingPrograms = await db.select().from(trainingPrograms);
      if (existingPrograms.length > 0) {
        return res.json({ message: "Already seeded", count: existingPrograms.length });
      }

      const seedPrograms = [
        { name: "Job Corps", provider: "U.S. Department of Labor", programType: "residential", description: "Free residential education and job training program for young people ages 16-24. Provides career training, education, and workforce preparation.", credentials: ["GED", "High School Diploma", "Industry Certifications"], durationWeeks: 52, cost: "Free", location: "Multiple locations nationwide", url: "https://www.jobcorps.gov", eligibility: "Ages 16-24, low-income", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["youth", "residential", "free"] },
        { name: "YouthBuild", provider: "U.S. Department of Labor", programType: "community", description: "Community-based program for opportunity youth ages 16-24. Combines education with construction skills training and community service.", credentials: ["GED", "High School Diploma", "OSHA Certification", "NCCER Certification"], durationWeeks: 40, cost: "Free", location: "270+ programs nationwide", url: "https://youthbuild.org", eligibility: "Ages 16-24, low-income, disconnected youth", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["youth", "construction", "community-service"] },
        { name: "American Job Center Services", provider: "State Workforce Agencies", programType: "career-services", description: "One-stop career centers offering job search assistance, resume help, skills assessments, training referrals, and employment workshops.", credentials: [], durationWeeks: null, cost: "Free", location: "2,400+ centers nationwide", url: "https://www.careeronestop.org/LocalHelp/AmericanJobCenters/", eligibility: "All adults and youth", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["career-services", "free", "nationwide"] },
        { name: "CompTIA A+ Certification", provider: "CompTIA", programType: "certification", description: "Entry-level IT certification covering hardware, software, networking, and troubleshooting. Industry-recognized credential for IT careers.", credentials: ["CompTIA A+"], durationWeeks: 12, cost: "$246 per exam (vouchers available)", location: "Online + testing centers", url: "https://www.comptia.org/certifications/a", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["IT", "certification", "entry-level"] },
        { name: "Google Career Certificates", provider: "Google / Coursera", programType: "online-certification", description: "Professional certificates in IT Support, Data Analytics, Project Management, UX Design, and Cybersecurity. No experience required.", credentials: ["Google IT Support Professional Certificate", "Google Data Analytics Certificate", "Google Project Management Certificate"], durationWeeks: 24, cost: "$49/month (financial aid available)", location: "Online", url: "https://grow.google/certificates/", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["online", "tech", "google"] },
        { name: "AWS Cloud Practitioner", provider: "Amazon Web Services", programType: "certification", description: "Foundational cloud computing certification. Validates cloud concepts, AWS services, security, architecture, and pricing knowledge.", credentials: ["AWS Certified Cloud Practitioner"], durationWeeks: 8, cost: "$100 exam fee", location: "Online + testing centers", url: "https://aws.amazon.com/certification/certified-cloud-practitioner/", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: false, tags: ["cloud", "certification", "tech"] },
        { name: "Registered Apprenticeship Programs", provider: "U.S. Department of Labor", programType: "apprenticeship", description: "Earn-and-learn model combining on-the-job training with related instruction. Available in 1,000+ occupations including construction, healthcare, IT, and manufacturing.", credentials: ["Journeyworker Certificate", "Industry-specific credentials"], durationWeeks: 104, cost: "Paid (earn while you learn)", location: "Nationwide", url: "https://www.apprenticeship.gov", eligibility: "Varies by program, typically 18+", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["apprenticeship", "paid", "hands-on"] },
        { name: "Community College Career Programs", provider: "Local Community Colleges", programType: "associate-degree", description: "Two-year degree and certificate programs in high-demand fields: nursing, welding, automotive, IT, business, and more. Financial aid available.", credentials: ["Associate Degree", "Career Certificates"], durationWeeks: 104, cost: "Varies (financial aid available)", location: "Local community colleges", url: "https://www.aacc.nche.edu/research-trends/students/community-college-finder/", eligibility: "High school diploma or GED", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["college", "degree", "financial-aid"] },
        { name: "OSHA 10/30 Safety Training", provider: "OSHA", programType: "certification", description: "Occupational safety training required for many construction and general industry jobs. OSHA 10 for workers, OSHA 30 for supervisors.", credentials: ["OSHA 10-Hour Card", "OSHA 30-Hour Card"], durationWeeks: 1, cost: "$25-$75", location: "Online + in-person", url: "https://www.osha.gov/training/outreach", eligibility: "No prerequisites", barrierFriendly: true, justiceInvolvedFriendly: true, tags: ["safety", "construction", "required"] },
        { name: "CDL Training Program", provider: "Various providers", programType: "vocational", description: "Commercial Driver's License training for careers in trucking and transportation. High demand with competitive wages.", credentials: ["Commercial Driver's License (CDL)"], durationWeeks: 4, cost: "$3,000-$7,000 (WIOA funding available)", location: "Nationwide", url: "https://www.fmcsa.dot.gov/registration/commercial-drivers-license", eligibility: "21+ for interstate, 18+ for intrastate", barrierFriendly: true, justiceInvolvedFriendly: false, tags: ["trucking", "vocational", "high-demand"] },
      ];

      for (const prog of seedPrograms) {
        await db.insert(trainingPrograms).values(prog);
      }

      const seedEmployers = [
        { companyName: "Goodwill Industries", industry: "Nonprofit/Retail", contactName: "Hiring Department", hiringCommitments: "Fair chance employer with workforce development programs", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Goodwill provides job training, employment placement services, and other community-based programs for people with barriers to self-sufficiency.", location: "Nationwide", website: "https://www.goodwill.org", partnershipStatus: "active" },
        { companyName: "Amazon", industry: "Technology/Logistics", contactName: "Workforce Partnerships", hiringCommitments: "Committed to hiring 100,000 veterans and military spouses", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Amazon offers entry-level warehouse, delivery, and tech positions with career advancement pathways and tuition assistance through Career Choice program.", location: "Nationwide", website: "https://www.amazon.jobs", partnershipStatus: "active" },
        { companyName: "Greyston Bakery", industry: "Food Manufacturing", contactName: "Open Hiring Team", hiringCommitments: "Open Hiring - no background checks, no interviews, no resumes", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Pioneer of Open Hiring practice. Anyone can sign up for a job, no questions asked. Provides employment plus support services.", location: "Yonkers, NY", website: "https://greyston.org", partnershipStatus: "active" },
        { companyName: "Dave's Killer Bread", industry: "Food Manufacturing", contactName: "Second Chance Employment", hiringCommitments: "One-third of workforce are formerly incarcerated individuals", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "A Second Chance employer that actively recruits, hires, and retains people with criminal backgrounds. Founded by a person who served 15 years in prison.", location: "Oregon/Nationwide", website: "https://www.daveskillerbread.com/foundation", partnershipStatus: "active" },
        { companyName: "JPMorgan Chase", industry: "Financial Services", contactName: "Second Chance Hiring", hiringCommitments: "Committed to Second Chance hiring and removing barriers", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Major bank with established Second Chance hiring initiative. Provides career pathways in financial services with full benefits.", location: "Nationwide", website: "https://www.jpmorganchase.com/impact/people/jobs-and-skills", partnershipStatus: "active" },
      ];

      for (const emp of seedEmployers) {
        await db.insert(employerPartners).values(emp);
      }

      res.json({ message: "Seeded successfully", programs: seedPrograms.length, employers: seedEmployers.length });
    } catch (error) {
      console.error("Failed to seed workforce data:", error);
      res.status(500).json({ error: "Failed to seed data" });
    }
  });
}
