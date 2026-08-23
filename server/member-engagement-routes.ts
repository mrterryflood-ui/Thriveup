/**
 * Member Health Engagement Engine — API routes
 *
 * Provides the full managed-care engagement layer:
 *   - Health plan org management (plan-agnostic: Medicaid, MA, FQHC, ACO, Commercial)
 *   - HEDIS measure catalog (27 NCQA measures, seeded at boot)
 *   - Member roster (3 entry paths: CHW manual, CSV import, self-enroll)
 *   - Care gap assignment and closure tracking
 *   - Outreach campaign builder (email via Resend, SMS-ready)
 *   - Population health dashboard data
 *   - CHW escalation queue
 *   - Benefit utilization tracking
 *
 * Mount: app.use("/api/member-engagement", memberEngagementRouter)
 */

import { Router, type Request, type Response } from "express";
import { db } from "./storage";
import { eq, and, desc, count, sql, inArray, ne } from "drizzle-orm";
import {
  healthPlanOrgs,
  hedisMeasures,
  healthPlanMembers,
  memberCareGaps,
  memberOutreachCampaigns,
  memberOutreachTouches,
  memberBenefitUtilization,
  memberCHWEngagements,
  type InsertHealthPlanOrg,
  type InsertHealthPlanMember,
  type InsertMemberCareGap,
  type InsertMemberOutreachCampaign,
} from "../shared/schema";
import { nanoid } from "nanoid";

export const memberEngagementRouter = Router();

// ── Auth helper ───────────────────────────────────────────────────────────────
function assertAuth(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

// ── HEDIS catalog seed ────────────────────────────────────────────────────────
// 27 NCQA HEDIS measures across 6 clinical domains. Call once at boot.
export async function seedHedisMeasures(): Promise<void> {
  const existing = await db.select({ id: hedisMeasures.id }).from(hedisMeasures).limit(1);
  if (existing.length > 0) return; // already seeded

  const catalog = [
    // ── Preventive Care ──────────────────────────────────────────────────────
    { measureCode: "AWV",   measureName: "Annual Wellness Visit", category: "Preventive", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Member has not had an annual wellness visit with their PCP in the past 12 months.",
      closureCriteria: "CMS AWV claim code (G0438, G0439) or IPPE code (G0402).",
      dueDateLogic: "12 months from last documented AWV", eligiblePopulation: "Medicare members age 65+" },

    { measureCode: "BCS",   measureName: "Breast Cancer Screening", category: "Preventive", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Female members age 50–74 without a mammogram in the past 27 months.",
      closureCriteria: "Bilateral or unilateral mammography claim (CPT 77067, 77066, 77065).",
      dueDateLogic: "27 months from last mammogram", eligiblePopulation: "Female members age 50–74" },

    { measureCode: "CCS",   measureName: "Cervical Cancer Screening", category: "Preventive", clinicalPriority: 1, starsWeight: "1.00",
      gapDefinition: "Female members age 21–64 without a Pap smear or HPV co-test in the required interval.",
      closureCriteria: "Pap smear (CPT 88141–88175) or HPV co-test (CPT 87620–87624) within eligible window.",
      dueDateLogic: "3 years for Pap alone; 5 years for co-test", eligiblePopulation: "Female members age 21–64" },

    { measureCode: "COL",   measureName: "Colorectal Cancer Screening", category: "Preventive", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Members age 45–75 without appropriate colorectal screening (colonoscopy, FIT, FOBT, stool DNA, CT colonography).",
      closureCriteria: "Colonoscopy within 10y, flexible sigmoidoscopy within 5y, FIT/FOBT annually, Cologuard every 3y.",
      dueDateLogic: "Varies by test type; annual FIT/FOBT is most common gap", eligiblePopulation: "Members age 45–75" },

    { measureCode: "AIS",   measureName: "Adult Immunization Status", category: "Preventive", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Member has not received influenza immunization in the current measurement year.",
      closureCriteria: "Influenza vaccine CPT code (90655–90658, 90661, 90673, 90685–90689) in measurement year.",
      dueDateLogic: "By December 31 of measurement year", eligiblePopulation: "Members age 18+" },

    { measureCode: "ABA",   measureName: "Adult BMI Assessment", category: "Preventive", clinicalPriority: 3, starsWeight: "1.00",
      gapDefinition: "Member has no documented BMI measurement in the measurement year.",
      closureCriteria: "BMI ICD-10 or CPT code documented in clinical encounter during measurement year.",
      dueDateLogic: "By December 31 of measurement year", eligiblePopulation: "Members age 18–74" },

    { measureCode: "CDF",   measureName: "Depression Screening and Follow-Up", category: "Preventive", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Member has no documented PHQ-9 or depression screening in the measurement year.",
      closureCriteria: "PHQ-9 screening documented + follow-up plan if score ≥10.",
      dueDateLogic: "Annual", eligiblePopulation: "Members age 12+" },

    // ── Chronic Disease Management ────────────────────────────────────────────
    { measureCode: "CBP",   measureName: "Controlling High Blood Pressure", category: "Chronic", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Member with hypertension diagnosis does not have blood pressure <140/90 documented.",
      closureCriteria: "BP reading <140/90 documented in an outpatient encounter during measurement year.",
      dueDateLogic: "By December 31 of measurement year", eligiblePopulation: "Members age 18–85 with hypertension" },

    { measureCode: "CDC-A1C", measureName: "Comprehensive Diabetes Care — HbA1c Testing", category: "Chronic", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Diabetic member has not had an HbA1c lab test in the past 12 months.",
      closureCriteria: "HbA1c lab result (CPT 83036) in measurement year.",
      dueDateLogic: "Annual; twice-annual for poorly controlled", eligiblePopulation: "Members age 18–75 with diabetes" },

    { measureCode: "CDC-EYE", measureName: "Comprehensive Diabetes Care — Retinal Eye Exam", category: "Chronic", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Diabetic member has not had a retinal eye exam in the past 24 months.",
      closureCriteria: "Dilated retinal exam CPT (92225, 92226, 92227, 92228) or evidence of retinopathy diagnosis.",
      dueDateLogic: "Annual if prior abnormal; every 2 years if normal", eligiblePopulation: "Members age 18–75 with diabetes" },

    { measureCode: "CDC-KIDNEY", measureName: "Comprehensive Diabetes Care — Kidney Health", category: "Chronic", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Diabetic member has not had urine microalbumin or nephropathy monitoring test in the measurement year.",
      closureCriteria: "Urine microalbumin (CPT 82042, 82043) or ACE/ARB prescription evidence.",
      dueDateLogic: "Annual", eligiblePopulation: "Members age 18–75 with diabetes" },

    { measureCode: "HBD",   measureName: "HbA1c Control for Patients with Diabetes (<8%)", category: "Chronic", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Diabetic member's most recent HbA1c is ≥8% or no HbA1c result documented.",
      closureCriteria: "HbA1c result <8% documented in measurement year.",
      dueDateLogic: "Annual", eligiblePopulation: "Members age 18–75 with diabetes" },

    // ── Pharmacy / Medication Adherence ──────────────────────────────────────
    { measureCode: "MEA",   measureName: "Medication Adherence — Hypertension (RAS Antagonists)", category: "Pharmacy", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Member on ACE inhibitor or ARB has PDC <80% (proportion of days covered).",
      closureCriteria: "PDC ≥80% for ACE inhibitor or ARB across the measurement year.",
      dueDateLogic: "Measured over 12-month rolling period", eligiblePopulation: "Members age 18–85 on ACE/ARB therapy" },

    { measureCode: "MED",   measureName: "Medication Adherence — Diabetes (Biguanides)", category: "Pharmacy", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Member on metformin or other biguanide has PDC <80%.",
      closureCriteria: "PDC ≥80% for biguanide across the measurement year.",
      dueDateLogic: "Measured over 12-month rolling period", eligiblePopulation: "Members age 18–75 on diabetes medication" },

    { measureCode: "MEH",   measureName: "Medication Adherence — Hyperlipidemia (Statins)", category: "Pharmacy", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Member on statin therapy has PDC <80%.",
      closureCriteria: "PDC ≥80% for statin across the measurement year.",
      dueDateLogic: "Measured over 12-month rolling period", eligiblePopulation: "Members age 21–75 on statin therapy" },

    { measureCode: "SAA",   measureName: "Adherence to Antipsychotic Medications (Schizophrenia)", category: "Pharmacy", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Member with schizophrenia on antipsychotic has PDC <80%.",
      closureCriteria: "PDC ≥80% for antipsychotic across the measurement year.",
      dueDateLogic: "Measured over 12-month rolling period", eligiblePopulation: "Members age 18–64 with schizophrenia on antipsychotic" },

    // ── Behavioral Health ─────────────────────────────────────────────────────
    { measureCode: "FUH",   measureName: "Follow-Up After Hospitalization for Mental Illness", category: "Behavioral Health", clinicalPriority: 1, starsWeight: "2.00",
      gapDefinition: "Member discharged from inpatient psychiatric stay has not had outpatient mental health follow-up within 7 or 30 days.",
      closureCriteria: "Outpatient mental health visit within 7 days (FUH-7) or 30 days (FUH-30) of discharge.",
      dueDateLogic: "7-day and 30-day windows from discharge date", eligiblePopulation: "Members age 6+ with inpatient psychiatric discharge" },

    { measureCode: "FUA",   measureName: "Follow-Up After ED Visit for Alcohol/Drug Abuse", category: "Behavioral Health", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Member with ED visit for alcohol/substance abuse has not had outpatient follow-up within 7 or 30 days.",
      closureCriteria: "Outpatient substance use disorder treatment visit within 7 days (FUA-7) or 30 days (FUA-30) of ED discharge.",
      dueDateLogic: "7-day and 30-day windows from ED discharge", eligiblePopulation: "Members age 13+ with substance-related ED visit" },

    { measureCode: "AMM",   measureName: "Antidepressant Medication Management", category: "Behavioral Health", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Member newly started on antidepressant has not remained on therapy for 84 days (acute phase) or 180 days (continuation phase).",
      closureCriteria: "Continuous antidepressant fills covering 84 days (acute) and 180 days (continuation) after new prescription.",
      dueDateLogic: "84-day and 180-day windows from initial fill", eligiblePopulation: "Members age 18+ newly diagnosed with MDD and starting antidepressant" },

    // ── Maternal & Pediatric ──────────────────────────────────────────────────
    { measureCode: "PPC",   measureName: "Prenatal and Postpartum Care", category: "Maternal", clinicalPriority: 1, starsWeight: "1.00",
      gapDefinition: "Pregnant member has not had a prenatal visit in the first trimester, or postpartum visit 7–84 days after delivery.",
      closureCriteria: "Prenatal visit CPT codes in first trimester; postpartum visit CPT in 7–84 day window after delivery.",
      dueDateLogic: "Trimester 1 for prenatal; 7–84 days post-delivery for postpartum", eligiblePopulation: "Female members with live birth during the measurement year" },

    { measureCode: "W34",   measureName: "Well-Child Visits (Ages 3–6)", category: "Maternal", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Child age 3–6 has not had at least one well-child visit with a PCP in the measurement year.",
      closureCriteria: "Well-child visit CPT (99382, 99392) in the measurement year.",
      dueDateLogic: "Annual", eligiblePopulation: "Members age 3–6 years" },

    { measureCode: "WCC",   measureName: "Weight Assessment and Counseling for Children", category: "Maternal", clinicalPriority: 3, starsWeight: "1.00",
      gapDefinition: "Child age 3–17 has no BMI percentile, nutrition counseling, or physical activity counseling documented.",
      closureCriteria: "BMI + counseling documented in an outpatient visit during measurement year.",
      dueDateLogic: "Annual", eligiblePopulation: "Members age 3–17 years" },

    { measureCode: "IMA",   measureName: "Immunizations for Adolescents", category: "Maternal", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Adolescent age 13 has not received Meningococcal, Tdap, and HPV vaccination series.",
      closureCriteria: "Required vaccine CPT codes documented by age 13.",
      dueDateLogic: "By 13th birthday", eligiblePopulation: "Members turning 13 in the measurement year" },

    { measureCode: "CIS",   measureName: "Childhood Immunization Status", category: "Maternal", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Child age 2 has not completed the full ACIP immunization schedule (DTaP, IPV, MMR, HiB, Hep B, VZV, PCV, Influenza).",
      closureCriteria: "All required vaccine CPT codes documented before 2nd birthday.",
      dueDateLogic: "By 2nd birthday", eligiblePopulation: "Members turning 2 in the measurement year" },

    // ── Utilization & Access ──────────────────────────────────────────────────
    { measureCode: "PCR",   measureName: "Plan All-Cause Readmissions", category: "Utilization", clinicalPriority: 2, starsWeight: "1.00",
      gapDefinition: "Member discharged from inpatient stay is readmitted within 30 days (unplanned).",
      closureCriteria: "No inpatient readmission within 30 days; care transition visit completed within 7 days.",
      dueDateLogic: "30-day window from discharge", eligiblePopulation: "Members age 18+ with inpatient discharge" },

    { measureCode: "OHD",   measureName: "Oral Health / Dental Access", category: "Utilization", clinicalPriority: 3, starsWeight: "1.00",
      gapDefinition: "Member has not had a dental visit (preventive or comprehensive) in the measurement year.",
      closureCriteria: "Dental claim (CDT D0100–D0999) in the measurement year.",
      dueDateLogic: "Annual", eligiblePopulation: "Members with dental benefit, all ages" },

    { measureCode: "TRC",   measureName: "Transitions of Care", category: "Utilization", clinicalPriority: 1, starsWeight: "1.00",
      gapDefinition: "Member discharged from inpatient stay does not have medication reconciliation or follow-up visit completed within required window.",
      closureCriteria: "Medication reconciliation post-discharge (CPT 1111F) or timely outpatient follow-up.",
      dueDateLogic: "Within 30 days of discharge", eligiblePopulation: "Members age 18+ with inpatient discharge" },
  ];

  for (const m of catalog) {
    await db.insert(hedisMeasures).values({
      id: nanoid(10),
      ...m,
      starsWeight: m.starsWeight,
      isActive: true,
    }).onConflictDoNothing();
  }

  console.log(`[MemberEngagement] HEDIS catalog seeded: ${catalog.length} measures`);
}

// ── HEDIS Measures ────────────────────────────────────────────────────────────

memberEngagementRouter.get("/hedis-measures", async (_req: Request, res: Response) => {
  try {
    const measures = await db
      .select()
      .from(hedisMeasures)
      .where(eq(hedisMeasures.isActive, true))
      .orderBy(hedisMeasures.clinicalPriority, hedisMeasures.category, hedisMeasures.measureCode);
    return res.json(measures);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load HEDIS measures" });
  }
});

// ── Health Plan Orgs ──────────────────────────────────────────────────────────

memberEngagementRouter.get("/orgs", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const orgs = await db.select().from(healthPlanOrgs).orderBy(desc(healthPlanOrgs.createdAt));
    return res.json(orgs);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load health plan orgs" });
  }
});

memberEngagementRouter.post("/orgs", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const body = req.body as Partial<InsertHealthPlanOrg>;
    if (!body.name) return res.status(400).json({ error: "name is required" });
    const [org] = await db.insert(healthPlanOrgs).values({
      id: nanoid(10),
      name: body.name,
      planType: body.planType ?? "mixed",
      state: body.state,
      statesServed: body.statesServed ?? [],
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      npiNumber: body.npiNumber,
      memberCount: body.memberCount ?? 0,
      hedisContractYear: body.hedisContractYear ?? String(new Date().getFullYear()),
      starsRatingCurrent: body.starsRatingCurrent,
      starsTargetRating: body.starsTargetRating,
      isActive: true,
    }).returning();
    return res.status(201).json(org);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create health plan org" });
  }
});

// ── Members ───────────────────────────────────────────────────────────────────

memberEngagementRouter.get("/members", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { planOrgId, riskTier, addressZip, language, search, limit = "50", offset = "0" } = req.query as Record<string, string>;
    let query = db.select().from(healthPlanMembers).$dynamic();
    if (planOrgId) query = query.where(eq(healthPlanMembers.planOrgId, planOrgId)) as typeof query;
    if (riskTier)  query = query.where(eq(healthPlanMembers.riskTier, riskTier)) as typeof query;
    if (addressZip) query = query.where(eq(healthPlanMembers.addressZip, addressZip)) as typeof query;
    if (language)  query = query.where(eq(healthPlanMembers.preferredLanguage, language)) as typeof query;
    const members = await query
      .orderBy(desc(healthPlanMembers.createdAt))
      .limit(Math.min(Number(limit), 200))
      .offset(Number(offset));
    return res.json(members);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load members" });
  }
});

memberEngagementRouter.post("/members", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const body = req.body as Partial<InsertHealthPlanMember>;
    if (!body.planOrgId) return res.status(400).json({ error: "planOrgId is required" });
    const [member] = await db.insert(healthPlanMembers).values({
      id: nanoid(10),
      planOrgId: body.planOrgId,
      memberId: body.memberId,
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      preferredLanguage: body.preferredLanguage ?? "english",
      email: body.email,
      phone: body.phone,
      preferredContactChannel: body.preferredContactChannel ?? "email",
      addressLine1: body.addressLine1,
      addressCity: body.addressCity,
      addressState: body.addressState,
      addressZip: body.addressZip,
      pcpName: body.pcpName,
      pcpNpi: body.pcpNpi,
      riskTier: body.riskTier ?? "low",
      sdohScore: body.sdohScore,
      sdohFlags: body.sdohFlags ?? [],
      entrySource: body.entrySource ?? "chw_manual",
    }).returning();
    return res.status(201).json(member);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create member" });
  }
});

// CSV import — accepts JSON array of member rows (parsed client-side from CSV)
memberEngagementRouter.post("/members/import", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { planOrgId, rows } = req.body as { planOrgId: string; rows: Partial<InsertHealthPlanMember>[] };
    if (!planOrgId) return res.status(400).json({ error: "planOrgId required" });
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "rows array required" });
    if (rows.length > 5000) return res.status(400).json({ error: "Maximum 5000 rows per import" });

    const inserted: string[] = [];
    for (const row of rows) {
      const [m] = await db.insert(healthPlanMembers).values({
        id: nanoid(10),
        planOrgId,
        memberId: row.memberId,
        firstName: row.firstName,
        lastName: row.lastName,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender,
        preferredLanguage: row.preferredLanguage ?? "english",
        email: row.email,
        phone: row.phone,
        preferredContactChannel: row.preferredContactChannel ?? "email",
        addressLine1: row.addressLine1,
        addressCity: row.addressCity,
        addressState: row.addressState,
        addressZip: row.addressZip,
        pcpName: row.pcpName,
        riskTier: row.riskTier ?? "low",
        sdohFlags: row.sdohFlags ?? [],
        entrySource: "csv_import",
      }).returning();
      inserted.push(m.id);
    }
    return res.json({ imported: inserted.length, memberIds: inserted });
  } catch (err: any) {
    return res.status(500).json({ error: "Import failed: " + err.message });
  }
});

// Public self-enrollment — no auth required
memberEngagementRouter.post("/members/self-enroll", async (req: Request, res: Response) => {
  try {
    const { planOrgId, firstName, lastName, dateOfBirth, email, phone, preferredLanguage, addressZip } = req.body as {
      planOrgId: string; firstName: string; lastName: string;
      dateOfBirth?: string; email?: string; phone?: string;
      preferredLanguage?: string; addressZip?: string;
    };
    if (!planOrgId || !firstName || !lastName) {
      return res.status(400).json({ error: "planOrgId, firstName, lastName required" });
    }
    if (!email && !phone) {
      return res.status(400).json({ error: "email or phone required for self-enrollment" });
    }
    // verify plan org exists and is active
    const [org] = await db.select({ id: healthPlanOrgs.id }).from(healthPlanOrgs)
      .where(and(eq(healthPlanOrgs.id, planOrgId), eq(healthPlanOrgs.isActive, true)));
    if (!org) return res.status(404).json({ error: "Health plan not found" });

    const [member] = await db.insert(healthPlanMembers).values({
      id: nanoid(10),
      planOrgId,
      firstName,
      lastName,
      dateOfBirth,
      email,
      phone,
      preferredLanguage: preferredLanguage ?? "english",
      addressZip,
      riskTier: "low",
      sdohFlags: [],
      entrySource: "self_enroll",
    }).returning();
    return res.status(201).json({ memberId: member.id, message: "Enrollment received. Your care team will follow up within 2 business days." });
  } catch (err: any) {
    return res.status(500).json({ error: "Self-enrollment failed" });
  }
});

memberEngagementRouter.get("/members/:id", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const memberId = String(req.params.id);
    const [member] = await db.select().from(healthPlanMembers).where(eq(healthPlanMembers.id, memberId));
    if (!member) return res.status(404).json({ error: "Member not found" });

    const [gaps, benefits, engagements] = await Promise.all([
      db.select().from(memberCareGaps)
        .where(eq(memberCareGaps.memberId, memberId))
        .orderBy(memberCareGaps.priority, desc(memberCareGaps.createdAt)),
      db.select().from(memberBenefitUtilization)
        .where(eq(memberBenefitUtilization.memberId, memberId))
        .orderBy(memberBenefitUtilization.planYear),
      db.select().from(memberCHWEngagements)
        .where(eq(memberCHWEngagements.memberId, memberId))
        .orderBy(desc(memberCHWEngagements.createdAt)).limit(5),
    ]);

    return res.json({ member, careGaps: gaps, benefits, recentEngagements: engagements });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load member" });
  }
});

memberEngagementRouter.patch("/members/:id", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const allowed = ["riskTier", "sdohScore", "sdohFlags", "pcpName", "pcpNpi",
      "preferredContactChannel", "preferredLanguage", "email", "phone",
      "addressLine1", "addressCity", "addressState", "addressZip"] as const;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const [updated] = await db.update(healthPlanMembers).set(update as any)
      .where(eq(healthPlanMembers.id, String(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "Member not found" });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update member" });
  }
});

// ── Care Gaps ─────────────────────────────────────────────────────────────────

memberEngagementRouter.get("/members/:id/care-gaps", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const gaps = await db.select({
      gap: memberCareGaps,
      measure: hedisMeasures,
    }).from(memberCareGaps)
      .innerJoin(hedisMeasures, eq(memberCareGaps.measureId, hedisMeasures.id))
      .where(eq(memberCareGaps.memberId, String(req.params.id)))
      .orderBy(memberCareGaps.priority, memberCareGaps.status);
    return res.json(gaps);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load care gaps" });
  }
});

// Assign gaps from HEDIS catalog — accepts array of measureCodes
memberEngagementRouter.post("/members/:id/care-gaps/assign", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { measureCodes, measurementYear } = req.body as { measureCodes: string[]; measurementYear?: number };
    if (!Array.isArray(measureCodes) || measureCodes.length === 0) {
      return res.status(400).json({ error: "measureCodes array required" });
    }
    const year = measurementYear ?? new Date().getFullYear();

    // resolve measure IDs
    const measures = await db.select().from(hedisMeasures)
      .where(inArray(hedisMeasures.measureCode, measureCodes));

    const created: InsertMemberCareGap[] = [];
    for (const m of measures) {
      // skip if already open for this year
      const [existing] = await db.select({ id: memberCareGaps.id }).from(memberCareGaps)
        .where(and(
          eq(memberCareGaps.memberId, String(req.params.id)),
          eq(memberCareGaps.measureId, m.id),
          eq(memberCareGaps.measurementYear, year),
          ne(memberCareGaps.status, "closed"),
        ));
      if (existing) continue;

      const [gap] = await db.insert(memberCareGaps).values({
        id: nanoid(10),
        memberId: String(req.params.id),
        measureId: m.id,
        measureCode: m.measureCode,
        measurementYear: year,
        priority: m.clinicalPriority,
        status: "open",
      }).returning();
      created.push(gap);
    }
    return res.json({ assigned: created.length, gaps: created });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to assign care gaps" });
  }
});

memberEngagementRouter.patch("/members/:id/care-gaps/:gapId/close", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { closureMethod, notes, closedByReferralId } = req.body as {
      closureMethod?: string; notes?: string; closedByReferralId?: string;
    };
    const userId = (req.user as any)?.id;
    const [updated] = await db.update(memberCareGaps).set({
      status: "closed",
      closedAt: new Date(),
      closureMethod: closureMethod ?? "provider_attestation",
      closedByReferralId: closedByReferralId,
      closedByUserId: userId,
      notes,
      updatedAt: new Date(),
    }).where(and(
      eq(memberCareGaps.id, String(req.params.gapId)),
      eq(memberCareGaps.memberId, String(req.params.id)),
    )).returning();
    if (!updated) return res.status(404).json({ error: "Care gap not found" });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to close care gap" });
  }
});

// ── Population Health Dashboard ───────────────────────────────────────────────

memberEngagementRouter.get("/population", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { planOrgId } = req.query as { planOrgId?: string };

    const [memberStats, gapStats, riskDist, campaignStats] = await Promise.all([
      // total members + SDOH breakdown
      db.select({
        total: count(),
        withEmail: sql<number>`count(*) filter (where email is not null)`,
        withPhone:  sql<number>`count(*) filter (where phone is not null)`,
        optedOut:   sql<number>`count(*) filter (where opted_out_at is not null)`,
      }).from(healthPlanMembers)
        .where(planOrgId ? eq(healthPlanMembers.planOrgId, planOrgId) : sql`1=1`),

      // open care gaps by measure code + category
      db.select({
        measureCode: memberCareGaps.measureCode,
        category:    hedisMeasures.category,
        measureName: hedisMeasures.measureName,
        priority:    hedisMeasures.clinicalPriority,
        openCount:   sql<number>`count(*) filter (where ${memberCareGaps.status} = 'open')`,
        closedCount: sql<number>`count(*) filter (where ${memberCareGaps.status} = 'closed')`,
      }).from(memberCareGaps)
        .innerJoin(hedisMeasures, eq(memberCareGaps.measureId, hedisMeasures.id))
        .groupBy(memberCareGaps.measureCode, hedisMeasures.category, hedisMeasures.measureName, hedisMeasures.clinicalPriority)
        .orderBy(hedisMeasures.clinicalPriority, memberCareGaps.measureCode),

      // risk tier distribution
      db.select({
        riskTier: healthPlanMembers.riskTier,
        count: count(),
      }).from(healthPlanMembers)
        .where(planOrgId ? eq(healthPlanMembers.planOrgId, planOrgId) : sql`1=1`)
        .groupBy(healthPlanMembers.riskTier),

      // campaign performance summary
      db.select({
        total: count(),
        sent:      sql<number>`count(*) filter (where status = 'sent')`,
        avgDeliveryRate: sql<number>`round(avg(total_delivered::float / nullif(total_recipients, 0)) * 100, 1)`,
        avgResponseRate: sql<number>`round(avg(total_responded::float / nullif(total_delivered, 0)) * 100, 1)`,
      }).from(memberOutreachCampaigns)
        .where(planOrgId ? eq(memberOutreachCampaigns.planOrgId, planOrgId) : sql`1=1`),
    ]);

    return res.json({
      members: memberStats[0],
      careGaps: gapStats,
      riskDistribution: riskDist,
      campaigns: campaignStats[0],
    });
  } catch (err: any) {
    console.error("[member-engagement] population stats error:", err);
    return res.status(500).json({ error: "Failed to load population health data" });
  }
});

// ── Campaigns ─────────────────────────────────────────────────────────────────

memberEngagementRouter.get("/campaigns", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { planOrgId } = req.query as { planOrgId?: string };
    let query = db.select().from(memberOutreachCampaigns).$dynamic();
    if (planOrgId) query = query.where(eq(memberOutreachCampaigns.planOrgId, planOrgId)) as typeof query;
    const campaigns = await query.orderBy(desc(memberOutreachCampaigns.createdAt)).limit(100);
    return res.json(campaigns);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load campaigns" });
  }
});

memberEngagementRouter.post("/campaigns", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const body = req.body as Partial<InsertMemberOutreachCampaign>;
    if (!body.planOrgId || !body.name || !body.messageBody) {
      return res.status(400).json({ error: "planOrgId, name, messageBody required" });
    }
    const userId = (req.user as any)?.id;
    const [campaign] = await db.insert(memberOutreachCampaigns).values({
      id: nanoid(10),
      planOrgId: body.planOrgId,
      name: body.name,
      description: body.description,
      channel: body.channel ?? "email",
      targetMeasureCodes: body.targetMeasureCodes ?? [],
      targetRiskTiers: body.targetRiskTiers ?? [],
      targetZips: body.targetZips ?? [],
      targetLanguages: body.targetLanguages ?? [],
      messageSubject: body.messageSubject,
      messageBody: body.messageBody,
      callToAction: body.callToAction,
      callToActionUrl: body.callToActionUrl,
      status: "draft",
      createdByUserId: userId,
    }).returning();
    return res.status(201).json(campaign);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create campaign" });
  }
});

memberEngagementRouter.get("/campaigns/:id", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const [campaign] = await db.select().from(memberOutreachCampaigns)
      .where(eq(memberOutreachCampaigns.id, String(req.params.id)));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const touches = await db.select({
      total: count(),
      delivered: sql<number>`count(*) filter (where delivered_at is not null)`,
      opened:    sql<number>`count(*) filter (where opened_at is not null)`,
      responded: sql<number>`count(*) filter (where responded_at is not null)`,
      bounced:   sql<number>`count(*) filter (where bounced = true)`,
    }).from(memberOutreachTouches).where(eq(memberOutreachTouches.campaignId, String(req.params.id)));

    return res.json({ campaign, performance: touches[0] });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load campaign" });
  }
});

// Execute a draft campaign — build member cohort + send via Resend (email)
memberEngagementRouter.post("/campaigns/:id/send", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const [campaign] = await db.select().from(memberOutreachCampaigns)
      .where(eq(memberOutreachCampaigns.id, String(req.params.id)));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      return res.status(409).json({ error: `Campaign is already ${campaign.status}` });
    }

    // Build member cohort from segment filters
    let query = db.select().from(healthPlanMembers)
      .where(eq(healthPlanMembers.planOrgId, campaign.planOrgId)).$dynamic();

    if (campaign.targetRiskTiers && campaign.targetRiskTiers.length > 0) {
      query = query.where(inArray(healthPlanMembers.riskTier, campaign.targetRiskTiers)) as typeof query;
    }

    const members = await query.limit(5000);

    // Filter by language if specified
    const cohort = campaign.targetLanguages && campaign.targetLanguages.length > 0
      ? members.filter(m => campaign.targetLanguages!.includes(m.preferredLanguage ?? "english"))
      : members;

    // Filter to members with email (email channel)
    const emailCohort = campaign.channel === "email"
      ? cohort.filter(m => m.email && !m.optedOutAt)
      : cohort.filter(m => !m.optedOutAt);

    // Mark sending
    await db.update(memberOutreachCampaigns).set({
      status: "sending",
      totalRecipients: emailCohort.length,
      updatedAt: new Date(),
    }).where(eq(memberOutreachCampaigns.id, campaign.id));

    // Send emails via Resend (fire-and-forget; track touches)
    let delivered = 0;
    const { sendMemberEngagementEmail } = await import("./email-service").catch(() => ({ sendMemberEngagementEmail: null }));

    for (const member of emailCohort) {
      // Hydrate template variables
      const body = campaign.messageBody
        .replace(/\{\{firstName\}\}/g, member.firstName ?? "Member")
        .replace(/\{\{lastName\}\}/g, member.lastName ?? "")
        .replace(/\{\{pcpName\}\}/g, member.pcpName ?? "your primary care provider");

      const touchId = nanoid(10);
      await db.insert(memberOutreachTouches).values({
        id: touchId,
        campaignId: campaign.id,
        memberId: member.id,
        channel: campaign.channel,
        sentAt: new Date(),
      });

      if (campaign.channel === "email" && member.email) {
        try {
          if (typeof sendMemberEngagementEmail === "function") {
            await (sendMemberEngagementEmail as any)({
              to: member.email,
              subject: campaign.messageSubject ?? "Health Plan Update",
              body,
              callToAction: campaign.callToAction ?? undefined,
              callToActionUrl: campaign.callToActionUrl ?? undefined,
            });
          }
          await db.update(memberOutreachTouches).set({ deliveredAt: new Date() })
            .where(eq(memberOutreachTouches.id, touchId));
          delivered++;
        } catch {
          await db.update(memberOutreachTouches).set({ bounced: true, bouncedReason: "send_failed" })
            .where(eq(memberOutreachTouches.id, touchId));
        }
      } else {
        // SMS / phone / mail — touch logged, delivery via external channel
        delivered++;
      }
    }

    await db.update(memberOutreachCampaigns).set({
      status: "sent",
      sentAt: new Date(),
      totalDelivered: delivered,
      updatedAt: new Date(),
    }).where(eq(memberOutreachCampaigns.id, campaign.id));

    return res.json({
      sent: true,
      recipients: emailCohort.length,
      delivered,
      campaignId: campaign.id,
    });
  } catch (err: any) {
    console.error("[member-engagement] campaign send error:", err);
    return res.status(500).json({ error: "Campaign send failed: " + err.message });
  }
});

// ── CHW Engagement Queue ──────────────────────────────────────────────────────

memberEngagementRouter.get("/chw-queue", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { status = "queued", assignedToMe } = req.query as { status?: string; assignedToMe?: string };
    const userId = (req.user as any)?.id;

    let query = db.select({
      engagement: memberCHWEngagements,
      member: healthPlanMembers,
    }).from(memberCHWEngagements)
      .innerJoin(healthPlanMembers, eq(memberCHWEngagements.memberId, healthPlanMembers.id))
      .$dynamic();

    if (status) query = query.where(eq(memberCHWEngagements.status, status)) as typeof query;
    if (assignedToMe === "true" && userId) {
      query = query.where(eq(memberCHWEngagements.assignedToUserId, userId)) as typeof query;
    }

    const queue = await query.orderBy(memberCHWEngagements.priority, desc(memberCHWEngagements.createdAt)).limit(100);
    return res.json(queue);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load CHW queue" });
  }
});

memberEngagementRouter.post("/chw-queue", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { memberId, escalationReason, priority, assignedToUserId } = req.body as {
      memberId: string; escalationReason: string; priority?: number; assignedToUserId?: number;
    };
    if (!memberId || !escalationReason) return res.status(400).json({ error: "memberId, escalationReason required" });

    const [openGaps] = await db.select({ c: count() }).from(memberCareGaps)
      .where(and(eq(memberCareGaps.memberId, memberId), eq(memberCareGaps.status, "open")));

    const [engagement] = await db.insert(memberCHWEngagements).values({
      id: nanoid(10),
      memberId,
      escalationReason,
      openCareGapCount: Number(openGaps?.c ?? 0),
      priority: priority ?? 3,
      assignedToUserId,
      status: "queued",
    }).returning();
    return res.status(201).json(engagement);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create CHW engagement" });
  }
});

memberEngagementRouter.patch("/chw-queue/:id", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { status, chwNotes, resolutionSummary, assignedToUserId } = req.body as {
      status?: string; chwNotes?: string; resolutionSummary?: string; assignedToUserId?: number;
    };
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (status) update.status = status;
    if (chwNotes) update.chwNotes = chwNotes;
    if (resolutionSummary) { update.resolutionSummary = resolutionSummary; update.resolvedAt = new Date(); }
    if (assignedToUserId) update.assignedToUserId = assignedToUserId;

    const [updated] = await db.update(memberCHWEngagements).set(update as any)
      .where(eq(memberCHWEngagements.id, String(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "Engagement not found" });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update engagement" });
  }
});

// ── Benefit Utilization ───────────────────────────────────────────────────────

memberEngagementRouter.get("/benefits/:memberId", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const benefits = await db.select().from(memberBenefitUtilization)
      .where(eq(memberBenefitUtilization.memberId, String(req.params.memberId)))
      .orderBy(memberBenefitUtilization.planYear, memberBenefitUtilization.benefitType);
    return res.json(benefits);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load benefit utilization" });
  }
});

memberEngagementRouter.patch("/benefits/:id", async (req: Request, res: Response) => {
  if (!assertAuth(req, res)) return;
  try {
    const { utilizedUsd, utilizationCount, notes } = req.body as {
      utilizedUsd?: string; utilizationCount?: number; notes?: string;
    };
    const update: Record<string, unknown> = { updatedAt: new Date(), lastUtilizedAt: new Date() };
    if (utilizedUsd !== undefined) update.utilizedUsd = utilizedUsd;
    if (utilizationCount !== undefined) update.utilizationCount = utilizationCount;
    if (notes !== undefined) update.notes = notes;

    const [updated] = await db.update(memberBenefitUtilization).set(update as any)
      .where(eq(memberBenefitUtilization.id, String(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "Benefit record not found" });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update benefit utilization" });
  }
});
