import type { Express } from "express";
import { db } from "./storage";
import {
  sudAssessments, recoveryPlans, recoveryMilestones,
  housingFirstIntakes, warmHandoffs, peerRecoveryCoaches,
  crisisRoutingLog, harmReductionServices, matCoordination,
  continuumOfCareEvents,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export function registerStreetsRoutes(app: Express) {

  // ── SUD Assessments ────────────────────────────────────────────────────────
  app.get("/api/streets/sud-assessments", async (req, res) => {
    try {
      const rows = await db.select().from(sudAssessments).orderBy(desc(sudAssessments.completedAt)).limit(200);
      res.json({ assessments: rows });
    } catch { res.status(500).json({ error: "Failed to fetch assessments." }); }
  });

  app.post("/api/streets/sud-assessments", async (req, res) => {
    try {
      const { clientName, clientId, assessorName, assessmentType, responses, clinicalNotes, referralRecommended } = req.body;
      if (!clientName || !assessmentType || !responses) return res.status(400).json({ error: "clientName, assessmentType, responses required." });

      let totalScore = 0;
      let riskLevel = "low";

      if (assessmentType === "audit_c") {
        totalScore = (responses.q1 || 0) + (responses.q2 || 0) + (responses.q3 || 0);
        riskLevel = totalScore >= 8 ? "severe" : totalScore >= 6 ? "high" : totalScore >= 4 ? "moderate" : "low";
      } else if (assessmentType === "dast_10") {
        totalScore = Object.values(responses).filter(Boolean).length;
        riskLevel = totalScore >= 7 ? "severe" : totalScore >= 4 ? "high" : totalScore >= 2 ? "moderate" : "low";
      } else if (assessmentType === "cage") {
        totalScore = Object.values(responses).filter(Boolean).length;
        riskLevel = totalScore >= 3 ? "high" : totalScore >= 2 ? "moderate" : "low";
      }

      const [row] = await db.insert(sudAssessments).values({
        clientName, clientId, assessorName, assessmentType, responses,
        totalScore, riskLevel, clinicalNotes, referralRecommended,
      }).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to save assessment." }); }
  });

  // ── Recovery Plans ─────────────────────────────────────────────────────────
  app.get("/api/streets/recovery-plans", async (req, res) => {
    try {
      const rows = await db.select().from(recoveryPlans).orderBy(desc(recoveryPlans.lastReviewedAt)).limit(200);
      res.json({ plans: rows });
    } catch { res.status(500).json({ error: "Failed to fetch recovery plans." }); }
  });

  app.post("/api/streets/recovery-plans", async (req, res) => {
    try {
      const [row] = await db.insert(recoveryPlans).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to create recovery plan." }); }
  });

  app.patch("/api/streets/recovery-plans/:id", async (req, res) => {
    try {
      const [row] = await db.update(recoveryPlans).set({ ...req.body, lastReviewedAt: new Date() })
        .where(eq(recoveryPlans.id, req.params.id)).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to update recovery plan." }); }
  });

  // ── Recovery Milestones ────────────────────────────────────────────────────
  app.get("/api/streets/recovery-milestones/:planId", async (req, res) => {
    try {
      const rows = await db.select().from(recoveryMilestones)
        .where(eq(recoveryMilestones.planId, req.params.planId))
        .orderBy(recoveryMilestones.domain);
      res.json({ milestones: rows });
    } catch { res.status(500).json({ error: "Failed to fetch milestones." }); }
  });

  app.post("/api/streets/recovery-milestones", async (req, res) => {
    try {
      const [row] = await db.insert(recoveryMilestones).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to save milestone." }); }
  });

  app.patch("/api/streets/recovery-milestones/:id/achieve", async (req, res) => {
    try {
      const [row] = await db.update(recoveryMilestones)
        .set({ status: "achieved", achievedAt: new Date() })
        .where(eq(recoveryMilestones.id, req.params.id)).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to mark milestone." }); }
  });

  // ── Housing First Intakes ──────────────────────────────────────────────────
  app.get("/api/streets/housing-intakes", async (req, res) => {
    try {
      const rows = await db.select().from(housingFirstIntakes).orderBy(desc(housingFirstIntakes.createdAt)).limit(200);
      res.json({ intakes: rows });
    } catch { res.status(500).json({ error: "Failed to fetch housing intakes." }); }
  });

  app.post("/api/streets/housing-intakes", async (req, res) => {
    try {
      const data = req.body;
      // Auto-compute priority tier from vulnerability score
      const score = data.vulnerabilityScore || 0;
      const chronical = data.chronicallyHomeless || false;
      const veteran = data.veteranStatus || false;
      const disability = data.disabilityStatus || false;
      let priority = "3";
      if (chronical || (veteran && score > 7)) priority = "1";
      else if (score > 5 || disability) priority = "2";
      const [row] = await db.insert(housingFirstIntakes).values({ ...data, priorityTier: priority }).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to save intake." }); }
  });

  app.patch("/api/streets/housing-intakes/:id/housed", async (req, res) => {
    try {
      const [row] = await db.update(housingFirstIntakes)
        .set({ housingSecuredAt: new Date() })
        .where(eq(housingFirstIntakes.id, req.params.id)).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to mark housed." }); }
  });

  // ── Warm Handoffs ──────────────────────────────────────────────────────────
  app.get("/api/streets/warm-handoffs", async (req, res) => {
    try {
      const rows = await db.select().from(warmHandoffs).orderBy(desc(warmHandoffs.handoffDate)).limit(200);
      res.json({ handoffs: rows });
    } catch { res.status(500).json({ error: "Failed to fetch handoffs." }); }
  });

  app.post("/api/streets/warm-handoffs", async (req, res) => {
    try {
      const [row] = await db.insert(warmHandoffs).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to save handoff." }); }
  });

  app.patch("/api/streets/warm-handoffs/:id/outcome", async (req, res) => {
    try {
      const { outcome, contactDate } = req.body;
      const [row] = await db.update(warmHandoffs)
        .set({ outcome, contactMade: true, contactDate: contactDate ? new Date(contactDate) : new Date() })
        .where(eq(warmHandoffs.id, req.params.id)).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to update handoff outcome." }); }
  });

  // ── Peer Recovery Coaches ──────────────────────────────────────────────────
  app.get("/api/streets/peer-coaches", async (req, res) => {
    try {
      const rows = await db.select().from(peerRecoveryCoaches)
        .where(eq(peerRecoveryCoaches.active, true))
        .orderBy(peerRecoveryCoaches.name);
      res.json({ coaches: rows });
    } catch { res.status(500).json({ error: "Failed to fetch coaches." }); }
  });

  app.post("/api/streets/peer-coaches", async (req, res) => {
    try {
      const [row] = await db.insert(peerRecoveryCoaches).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to save coach." }); }
  });

  app.patch("/api/streets/peer-coaches/:id", async (req, res) => {
    try {
      const [row] = await db.update(peerRecoveryCoaches).set(req.body)
        .where(eq(peerRecoveryCoaches.id, req.params.id)).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to update coach." }); }
  });

  // ── Crisis Routing Log ─────────────────────────────────────────────────────
  app.get("/api/streets/crisis-log", async (req, res) => {
    try {
      const rows = await db.select().from(crisisRoutingLog).orderBy(desc(crisisRoutingLog.routingDate)).limit(200);
      res.json({ entries: rows });
    } catch { res.status(500).json({ error: "Failed to fetch crisis log." }); }
  });

  app.post("/api/streets/crisis-log", async (req, res) => {
    try {
      const [row] = await db.insert(crisisRoutingLog).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to log crisis event." }); }
  });

  app.patch("/api/streets/crisis-log/:id/follow-up", async (req, res) => {
    try {
      const [row] = await db.update(crisisRoutingLog)
        .set({ followUpCompleted: true, outcome: req.body.outcome })
        .where(eq(crisisRoutingLog.id, req.params.id)).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to update follow-up." }); }
  });

  // ── Harm Reduction Services ────────────────────────────────────────────────
  app.get("/api/streets/harm-reduction", async (req, res) => {
    try {
      const rows = await db.select().from(harmReductionServices).orderBy(desc(harmReductionServices.serviceDate)).limit(200);
      res.json({ services: rows });
    } catch { res.status(500).json({ error: "Failed to fetch harm reduction services." }); }
  });

  app.post("/api/streets/harm-reduction", async (req, res) => {
    try {
      const [row] = await db.insert(harmReductionServices).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to log service." }); }
  });

  // ── MAT Coordination ───────────────────────────────────────────────────────
  app.get("/api/streets/mat", async (req, res) => {
    try {
      const rows = await db.select().from(matCoordination).orderBy(desc(matCoordination.createdAt)).limit(200);
      res.json({ records: rows });
    } catch { res.status(500).json({ error: "Failed to fetch MAT records." }); }
  });

  app.post("/api/streets/mat", async (req, res) => {
    try {
      const [row] = await db.insert(matCoordination).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to save MAT record." }); }
  });

  app.patch("/api/streets/mat/:id", async (req, res) => {
    try {
      const [row] = await db.update(matCoordination).set(req.body)
        .where(eq(matCoordination.id, req.params.id)).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to update MAT record." }); }
  });

  // ── Continuum of Care ──────────────────────────────────────────────────────
  app.get("/api/streets/continuum", async (req, res) => {
    try {
      const rows = await db.select().from(continuumOfCareEvents).orderBy(desc(continuumOfCareEvents.eventDate)).limit(300);
      res.json({ events: rows });
    } catch { res.status(500).json({ error: "Failed to fetch CoC events." }); }
  });

  app.post("/api/streets/continuum", async (req, res) => {
    try {
      const [row] = await db.insert(continuumOfCareEvents).values(req.body).returning();
      res.json(row);
    } catch { res.status(500).json({ error: "Failed to log CoC event." }); }
  });

  // ── HMIS-Compatible Export ─────────────────────────────────────────────────
  app.get("/api/streets/hmis-export", async (req, res) => {
    try {
      const [intakes, handoffs, coc, mat, crisis] = await Promise.all([
        db.select().from(housingFirstIntakes).orderBy(desc(housingFirstIntakes.createdAt)).limit(500),
        db.select().from(warmHandoffs).orderBy(desc(warmHandoffs.handoffDate)).limit(500),
        db.select().from(continuumOfCareEvents).orderBy(desc(continuumOfCareEvents.eventDate)).limit(500),
        db.select().from(matCoordination).orderBy(desc(matCoordination.createdAt)).limit(500),
        db.select().from(crisisRoutingLog).orderBy(desc(crisisRoutingLog.routingDate)).limit(500),
      ]);

      const hmisPackage = {
        exportMeta: {
          system: "ThriveUp Academy / TCAF",
          exportedAt: new Date().toISOString(),
          version: "HMIS-CSV-2024-compatible",
          organization: "The Collaborative Advocate Foundation",
          ein: "41-3618003",
        },
        clientEnrollments: intakes.map(i => ({
          PersonalID: i.clientId || i.id,
          FirstName: i.clientName.split(" ")[0],
          EnrollmentDate: i.intakeDate,
          HousingStatus: i.currentHousingStatus,
          ChronicallyHomeless: i.chronicallyHomeless ? 1 : 0,
          VeteranStatus: i.veteranStatus ? 1 : 0,
          DisablingCondition: i.disabilityStatus ? 1 : 0,
          PriorityScore: i.vulnerabilityScore,
          ExitDate: i.housingSecuredAt,
        })),
        serviceTransactions: coc.map(e => ({
          PersonalID: e.clientId || e.id,
          ServiceDate: e.eventDate,
          Provider: e.providerName,
          ServiceType: e.providerType,
          RecordType: e.eventType,
        })),
        referrals: handoffs.map(h => ({
          PersonalID: h.clientId || h.id,
          ReferralDate: h.handoffDate,
          ReferringOrg: h.fromProviderName,
          ReceivingOrg: h.toProviderName,
          Outcome: h.outcome,
        })),
        matServices: mat.map(m => ({
          PersonalID: m.clientId || m.id,
          Medication: m.medication,
          Clinic: m.clinicName,
          ReferralDate: m.referralDate,
          EnrollmentDate: m.enrollmentDate,
          Status: m.status,
        })),
        crisisEvents: crisis.map(c => ({
          PersonalID: c.clientId || c.id,
          CrisisDate: c.routingDate,
          CrisisType: c.crisisType,
          Acuity: c.acuityLevel,
          Disposition: c.disposition,
          FollowUpCompleted: c.followUpCompleted ? 1 : 0,
        })),
        summary: {
          totalClientsServed: new Set([...intakes.map(i => i.clientId || i.id)]).size,
          housingPlacements: intakes.filter(i => i.housingSecuredAt).length,
          warmHandoffsCompleted: handoffs.filter(h => h.contactMade).length,
          matEnrollments: mat.filter(m => m.enrollmentDate).length,
          crisisEvents: crisis.length,
          overdoseReversals: 0,
        },
      };

      res.json(hmisPackage);
    } catch { res.status(500).json({ error: "Export failed." }); }
  });

  // ── Dashboard Summary ──────────────────────────────────────────────────────
  app.get("/api/streets/dashboard", async (req, res) => {
    try {
      const [
        assessments, plans, intakes, handoffs, coaches, crisis, harm, mat, coc
      ] = await Promise.all([
        db.select().from(sudAssessments),
        db.select().from(recoveryPlans),
        db.select().from(housingFirstIntakes),
        db.select().from(warmHandoffs),
        db.select().from(peerRecoveryCoaches).where(eq(peerRecoveryCoaches.active, true)),
        db.select().from(crisisRoutingLog),
        db.select().from(harmReductionServices),
        db.select().from(matCoordination),
        db.select().from(continuumOfCareEvents),
      ]);

      res.json({
        sudAssessments: assessments.length,
        highRisk: assessments.filter(a => ["high", "severe"].includes(a.riskLevel)).length,
        recoveryPlans: plans.length,
        inAction: plans.filter(p => p.currentPhase === "action" || p.currentPhase === "maintenance").length,
        housingIntakes: intakes.length,
        housed: intakes.filter(i => i.housingSecuredAt).length,
        priority1: intakes.filter(i => i.priorityTier === "1" && !i.housingSecuredAt).length,
        warmHandoffs: handoffs.length,
        handoffsConnected: handoffs.filter(h => h.outcome === "connected" || h.outcome === "enrolled").length,
        activeCoaches: coaches.length,
        crisisEvents: crisis.length,
        followUpPending: crisis.filter(c => c.followUpRequired && !c.followUpCompleted).length,
        harmReductionServices: harm.length,
        overdoseReversals: harm.filter(h => h.overdoseReversal).length,
        matReferrals: mat.length,
        matEnrolled: mat.filter(m => m.enrollmentDate).length,
        cocEvents: coc.length,
      });
    } catch { res.status(500).json({ error: "Dashboard failed." }); }
  });
}
