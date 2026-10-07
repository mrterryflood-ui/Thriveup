import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  rnrAssessments, cbiPrograms, staffCertifications, standardsCrosswalk,
  insertRnrAssessmentSchema, insertCbiProgramSchema,
  insertStaffCertificationSchema, insertStandardsCrosswalkSchema,
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ecosystemEvents, reentryMilestones } from "@shared/schema";

async function emitRpliceEvent(eventType: string, eventData: Record<string, unknown>) {
  try {
    await db.insert(ecosystemEvents).values({
      sourcePlatformId: "tcaf-reentry-standards",
      targetPlatformId: null,
      eventType,
      eventData: { ...eventData, generatedAt: new Date().toISOString() },
      status: "broadcast",
    });
  } catch (err) { console.warn(`[rplice] failed to emit ${eventType}:`, err); }
}

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

const SEED_CBI_PROGRAMS = [
  {
    programCode: "T4C",
    name: "Thinking for a Change",
    shortName: "T4C",
    description: "Integrated cognitive-behavioral curriculum from the National Institute of Corrections combining cognitive restructuring, social skills development, and problem solving.",
    evidenceTier: "strong",
    evidenceSource: "CrimeSolutions.gov — Effective; NIC official curriculum",
    targetPopulation: "Adults and juveniles in justice system, all risk levels",
    durationWeeks: 14,
    sessionsCount: 25,
    modality: "group",
    certificationRequired: true,
    facilitatorTraining: "32-hour NIC-certified facilitator training",
    costPerParticipant: "$0 (curriculum free; staff time only)",
    internalDelivery: false,
    referralPartner: null,
    resourceUrl: "https://nicic.gov/projects/thinking-change",
    active: true,
  },
  {
    programCode: "MRT",
    name: "Moral Reconation Therapy",
    shortName: "MRT",
    description: "Cognitive-behavioral treatment focused on moral reasoning, identity development, and decision-making for justice-involved adults.",
    evidenceTier: "strong",
    evidenceSource: "CrimeSolutions.gov — Effective; SAMHSA NREPP",
    targetPopulation: "Adults with substance use, criminal thinking patterns",
    durationWeeks: 16,
    sessionsCount: 16,
    modality: "group",
    certificationRequired: true,
    facilitatorTraining: "MRT-certified facilitator training (Correctional Counseling, Inc.)",
    costPerParticipant: "$30 workbook per participant",
    internalDelivery: false,
    referralPartner: null,
    resourceUrl: "https://www.moral-reconation-therapy.com/",
    active: true,
  },
  {
    programCode: "ART",
    name: "Aggression Replacement Training",
    shortName: "ART",
    description: "10-week intervention combining social-skills training, anger control, and moral reasoning for chronically aggressive individuals.",
    evidenceTier: "strong",
    evidenceSource: "CrimeSolutions.gov — Promising; OJJDP Model Programs Guide",
    targetPopulation: "Adolescents and young adults with aggression issues",
    durationWeeks: 10,
    sessionsCount: 30,
    modality: "group",
    certificationRequired: true,
    facilitatorTraining: "ART trainer certification (Prepare Curriculum)",
    costPerParticipant: "Curriculum cost varies",
    internalDelivery: false,
    referralPartner: null,
    resourceUrl: "https://www.crimesolutions.gov/ProgramDetails.aspx?ID=254",
    active: true,
  },
  {
    programCode: "RR2",
    name: "Reasoning and Rehabilitation 2 (R&R2)",
    shortName: "R&R2",
    description: "Short-version cognitive-behavioral program addressing antisocial cognitions, attitudes, values and behaviors. Versions for adults and youth.",
    evidenceTier: "moderate",
    evidenceSource: "CrimeSolutions.gov — Promising",
    targetPopulation: "Adults and youth, medium-to-high risk",
    durationWeeks: 5,
    sessionsCount: 15,
    modality: "group",
    certificationRequired: true,
    facilitatorTraining: "R&R2 facilitator training (Cognitive Centre of Canada)",
    costPerParticipant: "Licensing fee per site",
    internalDelivery: false,
    referralPartner: null,
    resourceUrl: "https://www.cognitivecentre.com/",
    active: true,
  },
  {
    programCode: "DP",
    name: "Decision Points",
    shortName: "DP",
    description: "Brief CBT intervention (4 modules) targeting high-risk decisions in real time — peer pressure, substances, conflict.",
    evidenceTier: "promising",
    evidenceSource: "Bogue & Nandi field-validated; used in 30+ states",
    targetPopulation: "Probation/parole caseloads, brief intervention contexts",
    durationWeeks: 4,
    sessionsCount: 4,
    modality: "both",
    certificationRequired: false,
    facilitatorTraining: "1-day Decision Points training",
    costPerParticipant: "$15 workbook",
    internalDelivery: true,
    referralPartner: null,
    resourceUrl: "https://www.thecarey.com/",
    active: true,
  },
];

const SEED_CROSSWALK = [
  // Governance
  { standardCode: "NRRC-GOV-01", standardBody: "NRRC", category: "governance",
    standardTitle: "Coalition has established mission and bylaws",
    standardDescription: "Coalition must establish a clear mission and vision and create bylaws to establish governance and operational structure.",
    coverageStatus: "full", coveragePercent: 100,
    tcafCapabilities: ["TCAF Bylaws", "Advisory Board"],
    evidenceUrl: "/governance", notes: "TCAF 501(c)(3) bylaws + Advisory Board governance." },
  { standardCode: "NRRC-GOV-02", standardBody: "NRRC", category: "governance",
    standardTitle: "Strategic plan with measurable goals + performance measures",
    standardDescription: "Strategic plan should include task and action steps and performance measures to track success.",
    coverageStatus: "exceeds", coveragePercent: 110,
    tcafCapabilities: ["RPLICE", "Outcome Reporting", "MAP-GAP"],
    evidenceUrl: "/outcome-reporting", notes: "RPLICE provides CFIR 2.0 + RE-AIM tracking — exceeds NRRC baseline." },
  { standardCode: "NRRC-GOV-03", standardBody: "NRRC", category: "governance",
    standardTitle: "Multi-tier committee structure (core, full, executive)",
    standardDescription: "Coalition includes core planning team (monthly), full committee (quarterly), and executive committee (semi-annually).",
    coverageStatus: "partial", coveragePercent: 60,
    tcafCapabilities: ["Advisory Board"],
    evidenceUrl: "/governance", notes: "Advisory board exists; need formal multi-tier cadence documentation." },

  // Evidence-based practice
  { standardCode: "NRRC-EBP-01", standardBody: "NRRC", category: "ebp",
    standardTitle: "Risk-Needs-Responsivity (RNR) assessment used at intake",
    standardDescription: "Programs assess risk and assign appropriate programming using RNR framework.",
    coverageStatus: "full", coveragePercent: 100,
    tcafCapabilities: ["RNR Assessment", "Reentry Intake", "Thrive Score"],
    evidenceUrl: "/reentry/standards", notes: "Formal 8-domain RNR scoring tool deployed." },
  { standardCode: "NRRC-EBP-02", standardBody: "NRRC", category: "ebp",
    standardTitle: "Cognitive Behavioral Intervention (CBI) curricula available",
    standardDescription: "Manualized evidence-based CBI programs (T4C, MRT, ART, etc.) available to participants.",
    coverageStatus: "full", coveragePercent: 95,
    tcafCapabilities: ["CBI Library", "Referral Pathways", "LifeBridge"],
    evidenceUrl: "/reentry/standards", notes: "5-program CBI catalog with referral + internal-delivery status." },
  { standardCode: "NRRC-EBP-03", standardBody: "NRRC", category: "ebp",
    standardTitle: "Motivational Interviewing (MI) used by case managers",
    standardDescription: "MI is expected of all case managers, navigators, CHWs touching the population.",
    coverageStatus: "partial", coveragePercent: 50,
    tcafCapabilities: ["Staff Certifications"],
    evidenceUrl: "/reentry/standards", notes: "Tracking framework live; need certified staff entered." },
  { standardCode: "NRRC-EBP-04", standardBody: "NRRC", category: "ebp",
    standardTitle: "Gender-responsive programming",
    standardDescription: "Men benefit from attitudinal-change programs; women from practical-skills + life-skills.",
    coverageStatus: "partial", coveragePercent: 70,
    tcafCapabilities: ["MaleHealth Matters", "HerHealth Matters", "Whole-Person Health"],
    evidenceUrl: "/ecosystem-hub", notes: "Gender-specific platforms exist; need gender-responsive routing in reentry intake." },
  { standardCode: "NRRC-EBP-05", standardBody: "NRRC", category: "ebp",
    standardTitle: "Incentives + graduated sanctions framework",
    standardDescription: "Coalition aligns with probation/parole on incentives and graduated sanctions.",
    coverageStatus: "partial", coveragePercent: 65,
    tcafCapabilities: ["Reentry Dashboard 4-phase model", "Stipend Pilot"],
    evidenceUrl: "/reentry", notes: "4-phase milestone model is incentive-compatible; explicit mapping pending." },

  // Services
  { standardCode: "NRRC-SVC-01", standardBody: "NRRC", category: "services",
    standardTitle: "Housing navigation and referral",
    standardDescription: "Coordinated housing referrals — transitional, supportive, permanent.",
    coverageStatus: "full", coveragePercent: 100,
    tcafCapabilities: ["LifeBridge", "Benefits Screener", "Reentry Dashboard"],
    evidenceUrl: "/", notes: "LifeBridge virtual 211 covers housing navigation across the corridor." },
  { standardCode: "NRRC-SVC-02", standardBody: "NRRC", category: "services",
    standardTitle: "Employment services and workforce readiness",
    standardDescription: "Career pathways, job-readiness training, employer engagement with justice-involved flags.",
    coverageStatus: "exceeds", coveragePercent: 110,
    tcafCapabilities: ["Career Explorer (89 pathways, 56 non-collegiate)", "Workforce Assessment", "ThriveUp", "Stipend Pilot"],
    evidenceUrl: "/career-explorer", notes: "Exceeds standard — 89 pathways including 56 non-collegiate options." },
  { standardCode: "NRRC-SVC-03", standardBody: "NRRC", category: "services",
    standardTitle: "Behavioral health screening and referral",
    standardDescription: "Mental health and substance use screening with warm handoffs to treatment.",
    coverageStatus: "full", coveragePercent: 95,
    tcafCapabilities: ["Whole-Person Health", "AUDIT-C", "DAST-10", "C-SSRS", "LifeBridge"],
    evidenceUrl: "/", notes: "Standardized screening tools deployed via Whole-Person Health." },
  { standardCode: "NRRC-SVC-04", standardBody: "NRRC", category: "services",
    standardTitle: "Benefits navigation (Medicaid, SNAP, TANF, etc.)",
    standardDescription: "Coordinated screening and application assistance for major benefits programs.",
    coverageStatus: "full", coveragePercent: 100,
    tcafCapabilities: ["Benefits Screener (9+ programs)", "LifeBridge"],
    evidenceUrl: "/benefits", notes: "9+ benefit programs screened including Medicaid and SNAP." },
  { standardCode: "NRRC-SVC-05", standardBody: "NRRC", category: "services",
    standardTitle: "Family unification + community visitation support",
    standardDescription: "Programs promote family/community connection — research shows visitation reduces recidivism.",
    coverageStatus: "partial", coveragePercent: 55,
    tcafCapabilities: ["Mentorship Directory", "Parent Education"],
    evidenceUrl: "/mentorship-directory", notes: "Mentorship + parent education exist; explicit family-visitation module pending." },
  { standardCode: "NRRC-SVC-06", standardBody: "NRRC", category: "services",
    standardTitle: "Mentoring + peer support",
    standardDescription: "Trained mentors and peer-support specialists matched to participants.",
    coverageStatus: "full", coveragePercent: 90,
    tcafCapabilities: ["Mentorship Directory"],
    evidenceUrl: "/mentorship-directory", notes: "Mentor matching live across corridor." },

  // Data + measurement
  { standardCode: "NRRC-DATA-01", standardBody: "NRRC", category: "data",
    standardTitle: "Recidivism + outcomes tracked over multi-year window",
    standardDescription: "Outcomes measured across corrections, supervision, and community-based agencies.",
    coverageStatus: "exceeds", coveragePercent: 115,
    tcafCapabilities: ["RPLICE", "Reentry Dashboard", "Outcome Reporting", "Better Science Lab"],
    evidenceUrl: "/outcome-reporting", notes: "RPLICE multi-AI evidence engine + CFIR fidelity scoring exceeds standard." },
  { standardCode: "NRRC-DATA-02", standardBody: "NRRC", category: "data",
    standardTitle: "Quality assurance + continuous monitoring",
    standardDescription: "Coalition maintains QA measures and updates strategic plan based on data.",
    coverageStatus: "exceeds", coveragePercent: 110,
    tcafCapabilities: ["MAP-GAP CQI", "RPLICE", "Compliance Dashboard"],
    evidenceUrl: "/map-gap-cqi", notes: "MAP-GAP cycle is a documented CQI methodology." },
  { standardCode: "NRRC-DATA-03", standardBody: "NRRC", category: "data",
    standardTitle: "Shared data model across agencies",
    standardDescription: "Coalition members share a common measurement framework.",
    coverageStatus: "full", coveragePercent: 100,
    tcafCapabilities: ["Network Federation", "RPLICE event bus"],
    evidenceUrl: "/network/members", notes: "HMAC-signed federation events shared across sister platforms." },

  // Lived experience
  { standardCode: "NRRC-LE-01", standardBody: "NRRC", category: "lived_experience",
    standardTitle: "Lived-experience leadership in decision-making",
    standardDescription: "People with lived justice-involved experience represented in coalition governance.",
    coverageStatus: "partial", coveragePercent: 60,
    tcafCapabilities: ["Staff Certifications (lived-experience flag)", "Advisory Board"],
    evidenceUrl: "/reentry/standards", notes: "Tracking framework live; need lived-experience advisors entered." },
  { standardCode: "NRRC-LE-02", standardBody: "NRRC", category: "lived_experience",
    standardTitle: "Peer mentor / peer specialist roles",
    standardDescription: "Trained peer specialists with lived experience serve participants.",
    coverageStatus: "partial", coveragePercent: 55,
    tcafCapabilities: ["Mentorship Directory", "Staff Certifications"],
    evidenceUrl: "/mentorship-directory", notes: "Mentor framework supports peer roles; certification tracking now live." },

  // BJA Second Chance Act-specific
  { standardCode: "BJA-SCA-01", standardBody: "BJA", category: "ebp",
    standardTitle: "Evidence-based practices required",
    standardDescription: "BJA SCA grant requires explicit use of evidence-based practices.",
    coverageStatus: "full", coveragePercent: 100,
    tcafCapabilities: ["RPLICE", "CBI Library", "RNR Assessment"],
    evidenceUrl: "/reentry/standards", notes: "EBP framework fully deployed." },
  { standardCode: "BJA-SCA-02", standardBody: "BJA", category: "governance",
    standardTitle: "Letters of collaboration from correctional partners",
    standardDescription: "BJA SCA requires letters from releasing institutions.",
    coverageStatus: "gap", coveragePercent: 20,
    tcafCapabilities: [],
    evidenceUrl: "/grant-command-center", notes: "Need: TDCJ/Travis County Jail letter of collaboration." },
  { standardCode: "BJA-SCA-03", standardBody: "BJA", category: "data",
    standardTitle: "Local recidivism + employment baseline data",
    standardDescription: "BJA SCA requires local baseline data on recidivism and employment.",
    coverageStatus: "partial", coveragePercent: 70,
    tcafCapabilities: ["Stipend Pilot data", "Census/BLS connectors"],
    evidenceUrl: "/data-sources", notes: "Have stipend pilot + Census data; need formal recidivism baseline from county." },
  { standardCode: "BJA-SCA-04", standardBody: "BJA", category: "ebp",
    standardTitle: "Sustainability + replicability plan",
    standardDescription: "BJA SCA requires explicit sustainability and replicability plan.",
    coverageStatus: "full", coveragePercent: 95,
    tcafCapabilities: ["24-platform ecosystem", "RPLICE", "Network Federation"],
    evidenceUrl: "/ecosystem-hub", notes: "24-platform federated architecture is the replicability proof." },
];

async function seedStandardsIfEmpty() {
  try {
    const cbiCount = await db.select({ c: sql<number>`count(*)::int` }).from(cbiPrograms);
    if (Number(cbiCount[0]?.c || 0) === 0) {
      for (const p of SEED_CBI_PROGRAMS) {
        await db.insert(cbiPrograms).values(p as typeof cbiPrograms.$inferInsert).onConflictDoNothing();
      }
      console.log(`[standards] Seeded ${SEED_CBI_PROGRAMS.length} CBI programs`);
    }
    const cwCount = await db.select({ c: sql<number>`count(*)::int` }).from(standardsCrosswalk);
    if (Number(cwCount[0]?.c || 0) === 0) {
      for (const s of SEED_CROSSWALK) {
        await db.insert(standardsCrosswalk).values(s as typeof standardsCrosswalk.$inferInsert).onConflictDoNothing();
      }
      console.log(`[standards] Seeded ${SEED_CROSSWALK.length} standards crosswalk entries`);
    }
  } catch (e) {
    console.error("[standards] Seed failed:", e);
  }
}

export function registerStandardsRoutes(app: Express) {
  void seedStandardsIfEmpty();

  // ---------- RNR Assessments ----------
  app.get("/api/standards/rnr", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const rows = await db.select().from(rnrAssessments).orderBy(desc(rnrAssessments.assessmentDate));
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch RNR assessments" }); }
  });

  app.post("/api/standards/rnr", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertRnrAssessmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid RNR data", details: parsed.error.flatten().fieldErrors });
      const [row] = await db.insert(rnrAssessments).values(parsed.data).returning();

      // Auto-link recommended programs as reentry-plan milestones if a planId was provided
      const planId = (req.body as { planId?: string }).planId;
      const userId = (req.body as { userId?: string }).userId;
      const recs = (parsed.data.recommendedPrograms || []) as string[];
      if (planId && userId && recs.length) {
        for (const code of recs) {
          try {
            await db.insert(reentryMilestones).values({
              planId, userId, category: "evidence_based_intervention",
              title: `Enroll in ${code}`,
              description: `Auto-recommended by RNR assessment ${row.id}. Risk level: ${row.riskLevel}.`,
              status: "pending", phase: "phase_2_active",
              evidence: { rnrAssessmentId: row.id, programCode: code },
            } as any);
          } catch (e) { console.warn("milestone insert failed:", e); }
        }
      }

      emitRpliceEvent("reentry.rnr.completed", {
        assessmentId: row.id, riskLevel: row.riskLevel, riskScore: row.riskScore,
        recommendedPrograms: recs, planId, participantName: row.participantName,
      }).catch(() => {});

      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create RNR assessment" }); }
  });

  app.delete("/api/standards/rnr/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [row] = await db.delete(rnrAssessments).where(eq(rnrAssessments.id, req.params.id as string)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to delete" }); }
  });

  // ---------- CBI Programs ----------
  app.get("/api/standards/cbi", async (_req, res) => {
    try {
      const rows = await db.select().from(cbiPrograms).orderBy(desc(cbiPrograms.evidenceTier));
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch CBI programs" }); }
  });

  app.post("/api/standards/cbi", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCbiProgramSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid CBI data", details: parsed.error.flatten().fieldErrors });
      const [row] = await db.insert(cbiPrograms).values(parsed.data).returning();
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create CBI program" }); }
  });

  app.patch("/api/standards/cbi/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allowed = ["internalDelivery", "referralPartner", "facilitatorTraining", "active", "notes"];
      const update: Record<string, unknown> = {};
      for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
      const [row] = await db.update(cbiPrograms).set(update).where(eq(cbiPrograms.id, req.params.id as string)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to update" }); }
  });

  // ---------- Staff Certifications ----------
  app.get("/api/standards/certifications", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const rows = await db.select().from(staffCertifications).orderBy(desc(staffCertifications.createdAt));
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch certifications" }); }
  });

  app.post("/api/standards/certifications", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertStaffCertificationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid certification data", details: parsed.error.flatten().fieldErrors });
      const [row] = await db.insert(staffCertifications).values(parsed.data).returning();
      emitRpliceEvent("coalition.staff_certification.added", {
        id: row.id, type: row.certificationType, livedExperience: row.livedExperience,
      }).catch(() => {});
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create certification" }); }
  });

  app.delete("/api/standards/certifications/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [row] = await db.delete(staffCertifications).where(eq(staffCertifications.id, req.params.id as string)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to delete" }); }
  });

  // ---------- Public scorecard (no auth, for coalition view) ----------
  app.get("/api/standards/public/scorecard", async (_req, res) => {
    try {
      const cw = await db.select().from(standardsCrosswalk);
      const cbi = await db.select().from(cbiPrograms).where(eq(cbiPrograms.active, true));
      const totalPct = cw.reduce((s, r) => s + r.coveragePercent, 0);
      res.json({
        generatedAt: new Date().toISOString(),
        totalStandards: cw.length,
        averageCoverage: cw.length ? Math.round(totalPct / cw.length) : 0,
        cbiCatalogSize: cbi.length,
        byBody: cw.reduce((acc: Record<string, { count: number; sum: number }>, r) => {
          const b = acc[r.standardBody] ||= { count: 0, sum: 0 };
          b.count++; b.sum += r.coveragePercent; return acc;
        }, {}),
      });
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/standards/public/crosswalk", async (_req, res) => {
    try {
      const rows = await db.select().from(standardsCrosswalk).orderBy(standardsCrosswalk.category, standardsCrosswalk.standardCode);
      res.json(rows.map(r => ({
        standardCode: r.standardCode, standardBody: r.standardBody, category: r.category,
        standardTitle: r.standardTitle, standardDescription: r.standardDescription,
        coverageStatus: r.coverageStatus, coveragePercent: r.coveragePercent,
        tcafCapabilities: r.tcafCapabilities, notes: r.notes,
      })));
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
  });

  // ---------- Standards Crosswalk ----------
  app.get("/api/standards/crosswalk", async (_req, res) => {
    try {
      const rows = await db.select().from(standardsCrosswalk).orderBy(standardsCrosswalk.standardCode);
      res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch crosswalk" }); }
  });

  app.patch("/api/standards/crosswalk/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allowed = ["coverageStatus", "coveragePercent", "tcafCapabilities", "evidenceUrl", "notes"];
      const update: Record<string, unknown> = { lastReviewedAt: new Date() };
      for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
      const [row] = await db.update(standardsCrosswalk).set(update).where(eq(standardsCrosswalk.id, req.params.id as string)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to update" }); }
  });

  // ---------- Scorecard (computed) ----------
  app.get("/api/standards/scorecard", async (_req, res) => {
    try {
      const cw = await db.select().from(standardsCrosswalk);
      const certs = await db.select().from(staffCertifications);
      const cbi = await db.select().from(cbiPrograms);
      const rnr = await db.select().from(rnrAssessments);

      const byBody: Record<string, { total: number; sumPct: number; full: number; exceeds: number; partial: number; gap: number }> = {};
      const byCategory: Record<string, { total: number; sumPct: number }> = {};
      let totalPct = 0;
      for (const r of cw) {
        totalPct += r.coveragePercent;
        const b = byBody[r.standardBody] ||= { total: 0, sumPct: 0, full: 0, exceeds: 0, partial: 0, gap: 0 };
        b.total++; b.sumPct += r.coveragePercent;
        if (r.coverageStatus === "full") b.full++;
        else if (r.coverageStatus === "exceeds") b.exceeds++;
        else if (r.coverageStatus === "partial") b.partial++;
        else if (r.coverageStatus === "gap") b.gap++;
        const c = byCategory[r.category] ||= { total: 0, sumPct: 0 };
        c.total++; c.sumPct += r.coveragePercent;
      }

      res.json({
        generatedAt: new Date().toISOString(),
        totalStandards: cw.length,
        averageCoverage: cw.length ? Math.round(totalPct / cw.length) : 0,
        coverageByBody: Object.fromEntries(Object.entries(byBody).map(([k, v]) => [k, {
          ...v, avgPct: v.total ? Math.round(v.sumPct / v.total) : 0,
        }])),
        coverageByCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, {
          total: v.total, avgPct: v.total ? Math.round(v.sumPct / v.total) : 0,
        }])),
        cbiCatalogSize: cbi.length,
        cbiInternalDelivery: cbi.filter(p => p.internalDelivery).length,
        certificationsActive: certs.filter(c => c.status === "active").length,
        certificationsLivedExperience: certs.filter(c => c.livedExperience).length,
        rnrAssessmentsCompleted: rnr.length,
      });
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to compute scorecard" }); }
  });
}
