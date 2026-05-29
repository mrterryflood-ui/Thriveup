import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  participantProfiles,
  residentJourneyEvents,
  residentRelocations,
  residentRiskSnapshots,
  reentryIntakeAssessments,
  insertResidentJourneyEventSchema,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateAIResponse } from "./ai-provider";

const STATE_BENEFIT_RULES: Record<string, {
  stateName: string;
  medicaidExpansion: boolean;
  medicaidNotes: string;
  childMedicaidProgram: string;
  snapNotes: string;
  stateSpecificPrograms: string[];
}> = {
  TX: {
    stateName: "Texas",
    medicaidExpansion: false,
    medicaidNotes: "Texas has not adopted Medicaid expansion. Adults without dependents typically do not qualify regardless of income. Coverage gap affects ~770,000 Texans.",
    childMedicaidProgram: "Texas CHIP",
    snapNotes: "Standard federal SNAP rules. ABAWD work requirement enforced in most counties.",
    stateSpecificPrograms: ["Travis County MAP (Medical Access Program)", "Texas Healthy Women", "Texas Veterans Commission benefits"],
  },
  NC: {
    stateName: "North Carolina",
    medicaidExpansion: true,
    medicaidNotes: "North Carolina adopted Medicaid expansion December 2023. Adults up to 138% of the Federal Poverty Level now qualify regardless of dependent status. This is a major eligibility change for someone moving from Texas.",
    childMedicaidProgram: "NC Health Choice / NC Medicaid for Children",
    snapNotes: "Standard federal SNAP. NC FAST is the application portal. ABAWD waiver status varies by county; New Hanover County (Wilmington) currently subject to work requirements.",
    stateSpecificPrograms: ["NC Reentry Action Plan support", "NC Works Career Centers", "Cape Fear Healthnet (free clinic, Wilmington)", "Good Shepherd Center (housing/food, Wilmington)"],
  },
};

function payloadFromProfile(profile: any): { incomeAnnual: number; householdSize: number; hasChildren: boolean; isPregnant: boolean; isDisabled: boolean } {
  const dependents = Number(profile?.dependents || 0);
  const employed = String(profile?.employmentStatus || "").toLowerCase().includes("employed full") || String(profile?.employmentStatus || "").toLowerCase().includes("employed");
  const incomeAnnual = employed ? 28000 : 0;
  return {
    incomeAnnual,
    householdSize: 1 + dependents,
    hasChildren: dependents > 0,
    isPregnant: false,
    isDisabled: !!profile?.disabilityStatus && profile.disabilityStatus !== "none",
  };
}

const SUPPORTED_STATES = new Set(Object.keys(STATE_BENEFIT_RULES));

function recomputeEligibility(state: string, payload: { incomeAnnual?: number; householdSize?: number; hasChildren?: boolean; isPregnant?: boolean; isDisabled?: boolean }) {
  if (!STATE_BENEFIT_RULES[state]) {
    return {
      state,
      stateName: state,
      medicaidExpansion: false,
      medicaidNotes: `State-specific benefit rules for ${state} are not yet loaded in this build. Federal programs (SNAP, ACA, EITC, CTC, SSI/SSDI) still apply via federal rules but state-specific programs and Medicaid expansion status are not computed.`,
      snapNotes: "Federal SNAP rules apply.",
      eligible: [],
      unsupported: true,
    };
  }
  const rules = STATE_BENEFIT_RULES[state];
  const income = payload.incomeAnnual ?? 0;
  const hh = payload.householdSize ?? 1;
  const fpl = 15060 + (hh - 1) * 5380;
  const eligible: { program: string; reason: string }[] = [];

  if (income <= fpl * 1.3) eligible.push({ program: "SNAP", reason: `Income ≤ 130% FPL ($${Math.round(fpl * 1.3).toLocaleString()})` });
  if (rules.medicaidExpansion && income <= fpl * 1.38) {
    eligible.push({ program: "Medicaid (expansion)", reason: `${rules.stateName} expanded Medicaid — adults qualify ≤ 138% FPL regardless of dependents.` });
  } else if (!rules.medicaidExpansion && (payload.hasChildren || payload.isPregnant || payload.isDisabled) && income <= fpl * 1.0) {
    eligible.push({ program: "Medicaid (non-expansion)", reason: `${rules.stateName} has not expanded Medicaid; eligibility limited to parents/pregnant/disabled at very low income.` });
  } else if (!rules.medicaidExpansion) {
    eligible.push({ program: "ACA Marketplace (Medicaid coverage gap)", reason: `${rules.stateName} non-expansion — fall into the coverage gap; refer to ACA marketplace with subsidies.` });
  }
  if (payload.hasChildren && income <= fpl * 2.0) eligible.push({ program: rules.childMedicaidProgram, reason: "Children eligible at higher income thresholds." });
  if (payload.isPregnant || payload.hasChildren) eligible.push({ program: "WIC", reason: "Pregnant women, infants, and children up to age 5." });
  if (income <= fpl * 4.0) eligible.push({ program: "ACA Marketplace (subsidized)", reason: "Premium tax credits available ≤ 400% FPL." });
  if (income > 0 && income <= fpl * 3.0) eligible.push({ program: "EITC", reason: "Federal Earned Income Tax Credit." });
  if (payload.hasChildren && income <= fpl * 4.0) eligible.push({ program: "Child Tax Credit (CTC)", reason: "Federal credit for qualifying children." });
  if (payload.isDisabled) {
    eligible.push({ program: "SSI", reason: "Supplemental Security Income for disabled individuals with limited resources." });
    eligible.push({ program: "SSDI", reason: "Social Security Disability Insurance based on work history." });
  }
  for (const p of rules.stateSpecificPrograms) {
    eligible.push({ program: p, reason: `${rules.stateName}-specific program available in this jurisdiction.` });
  }
  return { state, stateName: rules.stateName, medicaidExpansion: rules.medicaidExpansion, medicaidNotes: rules.medicaidNotes, snapNotes: rules.snapNotes, eligible };
}

function diffEligibility(beforeState: string, afterState: string, payload: any) {
  const before = recomputeEligibility(beforeState, payload);
  const after = recomputeEligibility(afterState, payload);
  const beforeNames = new Set(before.eligible.map(e => e.program));
  const afterNames = new Set(after.eligible.map(e => e.program));
  const gained = after.eligible.filter(e => !beforeNames.has(e.program));
  const lost = before.eligible.filter(e => !afterNames.has(e.program));
  const continued = after.eligible.filter(e => beforeNames.has(e.program));
  return { from: before, to: after, gained, lost, continued };
}

const DEMO_SCENARIO_KEY = "marcus-j-foster-reentry";

async function ensureDemoScenario(forceReset = false) {
  const existing = await db.select().from(participantProfiles).where(eq(participantProfiles.userId, DEMO_SCENARIO_KEY)).limit(1);
  if (existing.length > 0) {
    if (forceReset) {
      const demoId = existing[0].id;
      await db.delete(residentJourneyEvents).where(eq(residentJourneyEvents.participantId, demoId));
      await db.delete(residentRelocations).where(eq(residentRelocations.participantId, demoId));
      await db.delete(residentRiskSnapshots).where(eq(residentRiskSnapshots.participantId, demoId));
      await db.delete(reentryIntakeAssessments).where(eq(reentryIntakeAssessments.userId, DEMO_SCENARIO_KEY));
      await db.update(participantProfiles)
        .set({ city: "Austin", state: "TX", zipCode: "78702", address: "1100 E 11th St" })
        .where(eq(participantProfiles.id, demoId));
      await seedDemoEventsAndRisk(demoId);
      const refreshed = await db.select().from(participantProfiles).where(eq(participantProfiles.id, demoId)).limit(1);
      return refreshed[0];
    }
    return existing[0];
  }

  const [profile] = await db.insert(participantProfiles).values({
    userId: DEMO_SCENARIO_KEY,
    firstName: "Marcus",
    lastName: "J.",
    preferredName: "Marcus",
    dateOfBirth: "2002-03-14",
    age: 24,
    gender: "Male",
    raceEthnicity: ["Black or African American"],
    veteranStatus: false,
    disabilityStatus: "none",
    primaryLanguage: "English",
    needsInterpreter: false,
    phone: "(512) 555-0142",
    email: "marcus.j.demo@example.org",
    address: "1100 E 11th St",
    city: "Austin",
    state: "TX",
    zipCode: "78702",
    housingStatus: "Transitional housing (90-day program)",
    housingDetails: "Halfway house placement through reentry plan; lease ends in 60 days.",
    employmentStatus: "Unemployed, actively seeking",
    employmentHistory: "Pre-incarceration: warehouse work (2 yrs), kitchen prep (1 yr).",
    educationLevel: "High school diploma + 2 college credits earned in custody",
    educationDetails: "GED equivalent earned in foster care; 2 dual-credit college courses while incarcerated.",
    justiceInvolved: true,
    justiceDetails: { incarcerationLength: "18 months", releaseDate: "2026-01-26", supervisingAgency: "Travis County Adult Probation", offenseCategory: "non-violent property" },
    releaseDate: "2026-01-26",
    supervisionStatus: "Probation - 24 months remaining",
    healthNeeds: ["Routine primary care", "Dental"],
    mentalHealthNeeds: "History of anxiety; aged out of foster care at 18 with no transition support.",
    substanceUseHistory: "None reported",
    familySituation: "Aged out of foster care; one younger sibling still in care; no stable family contact.",
    dependents: 0,
  }).returning();

  await seedDemoEventsAndRisk(profile.id);
  return profile;
}

async function seedDemoEventsAndRisk(profileId: string) {
  await db.insert(reentryIntakeAssessments).values({
    planId: profileId,
    userId: DEMO_SCENARIO_KEY,
    educationHistory: { gedEarned: true, collegeCreditsEarned: 2, vocationalCerts: ["Forklift operator (in-custody)"] },
    employmentHistory: { lastEmployer: "Austin Warehouse Co.", yearsExperience: 3, postReleaseInterviews: 2 },
    housingStability: "transitional",
    behavioralHealthNeeds: { anxiety: "mild-moderate", trauma: "complex (foster + incarceration)", currentTreatment: "none yet" },
    familySituation: { fosterCareHistory: true, siblingInCare: 1, naturalSupports: "limited" },
    communitySupport: { mentor: false, faithCommunity: false, peerGroup: "halfway house cohort" },
    riskFactors: [
      { factor: "Foster care to incarceration pipeline", severity: "high", source: "ChainWeb: ATSDR ACE study + AECF Kids Count" },
      { factor: "No stable family network at reentry", severity: "high", source: "ChainWeb: Urban Institute Returning Home study" },
      { factor: "Transitional housing ends in 60 days", severity: "medium", source: "ChainWeb: HUD CHAS — Travis County rental burden" },
      { factor: "ACE score estimated 6+ (foster + incarceration)", severity: "high", source: "ChainWeb: CDC-Kaiser ACE Study" },
    ],
    protectiveFactors: [
      { factor: "Earned college credit while in custody", strength: "high", source: "ChainWeb: RAND meta-analysis — education in custody reduces recidivism 43%" },
      { factor: "Forklift certification (in-demand skill)", strength: "medium", source: "ChainWeb: BLS occupational outlook — material handling +5% growth" },
      { factor: "No substance use disorder", strength: "high", source: "Self-report + intake assessment" },
      { factor: "Engaged voluntarily with reentry plan", strength: "high", source: "Council of State Governments — voluntary engagement predictor" },
    ],
    immediateNeeds: ["Permanent housing", "Employment", "Health insurance", "Mentor relationship"],
    overallRiskScore: 58,
  });

  await db.insert(residentRiskSnapshots).values({
    participantId: profileId,
    riskFactors: [
      { factor: "Foster care to incarceration pipeline", severity: "high" },
      { factor: "No stable family network at reentry", severity: "high" },
      { factor: "Transitional housing ends in 60 days", severity: "medium" },
      { factor: "ACE score estimated 6+", severity: "high" },
    ],
    protectiveFactors: [
      { factor: "Earned college credit while in custody", strength: "high" },
      { factor: "Forklift certification (in-demand skill)", strength: "medium" },
      { factor: "No substance use disorder", strength: "high" },
      { factor: "Voluntary engagement with reentry plan", strength: "high" },
    ],
    chainwebCitations: [
      { source: "CDC-Kaiser ACE Study (1998, ongoing)", url: "https://www.cdc.gov/violenceprevention/aces/", relevance: "ACE score → adult outcomes" },
      { source: "RAND Corporation (2013) — Evaluating the Effectiveness of Correctional Education", url: "https://www.rand.org/pubs/research_reports/RR266.html", relevance: "43% recidivism reduction from in-custody education" },
      { source: "Urban Institute — Returning Home Study", url: "https://www.urban.org/policy-centers/justice-policy-center/projects/returning-home-study", relevance: "Family support is the single strongest predictor of successful reentry" },
      { source: "Council of State Governments Justice Center", url: "https://csgjusticecenter.org/", relevance: "Voluntary engagement vs. mandated participation outcomes" },
      { source: "ATSDR Social Vulnerability Index — Travis County, TX", url: "https://www.atsdr.cdc.gov/placeandhealth/svi/", relevance: "Census-tract-level vulnerability for housing stability planning" },
      { source: "AECF Kids Count — Foster Care Outcomes", url: "https://www.aecf.org/work/child-welfare", relevance: "Foster-to-prison pipeline data" },
    ],
    overallRiskScore: 58,
    trendDirection: "improving",
    recommendedInterventions: [
      { intervention: "Match with peer mentor (returning citizen, similar age, same county)", priority: "highest", rationale: "Single highest predictor: stable adult relationship in first 90 days post-release." },
      { intervention: "Lock in permanent housing before transitional period ends", priority: "highest", rationale: "Housing instability in first 6 months triples reincarceration risk." },
      { intervention: "Connect college credits to a community-college pathway (ACC)", priority: "high", rationale: "Continuing education compounds the protective factor already established." },
      { intervention: "Apply forklift certification to staffing-agency placements", priority: "high", rationale: "Skill is current; gap-to-employment under 30 days achievable." },
      { intervention: "Enroll in Travis County MAP for primary care and dental", priority: "medium", rationale: "TX coverage gap — MAP fills the Medicaid hole until other coverage available." },
    ],
  });

  const baseEvent = { participantId: profileId, stateAtEvent: "TX", countyAtEvent: "48453", sourceUserId: DEMO_SCENARIO_KEY };
  const events = [
    { eventType: "intake_completed", eventDomain: "reentry", eventTitle: "Reentry intake completed", sourcePage: "/intake-wizard", eventPayload: { riskScore: 58, immediateNeeds: 4 } },
    { eventType: "reentry_plan_generated", eventDomain: "reentry", eventTitle: "Personalized reentry plan generated (24-month)", sourcePage: "/reentry", eventPayload: { goals: 5, supervisingAgency: "Travis County Adult Probation" } },
    { eventType: "housing_placement", eventDomain: "community", eventTitle: "Placed in transitional housing (90 days)", sourcePage: "/resources", eventPayload: { provider: "Halfway house — Austin", durationDays: 90, daysRemaining: 60 } },
    { eventType: "benefit_screened", eventDomain: "benefits", eventTitle: "Benefits screening completed — Travis County, TX", sourcePage: "/benefits-screener", eventPayload: { eligibleCount: 6, estimatedAnnualValue: 12480, programs: ["SNAP", "ACA Marketplace", "EITC", "Travis County MAP"] } },
    { eventType: "training_enrolled", eventDomain: "workforce", eventTitle: "Enrolled in workforce training — Logistics & supply chain", sourcePage: "/workforce-training", eventPayload: { program: "Capital IDEA Logistics", durationWeeks: 12, startDate: "2026-03-02" } },
    { eventType: "ai_tool_used", eventDomain: "ai_training", eventTitle: "Completed AI Career Coach session — resume + interview prep", sourcePage: "/ai-tools/career-coach", eventPayload: { toolKey: "career-coach", artifactsGenerated: ["resume_v3.pdf", "interview_prep.md"] } },
    { eventType: "mentor_matched", eventDomain: "community", eventTitle: "Matched with peer mentor (returning citizen, age 31)", sourcePage: "/academy/mentor-finder", eventPayload: { mentorAlias: "Devon W.", checkInsCompleted: 4 } },
    { eventType: "ai_tool_used", eventDomain: "ai_training", eventTitle: "Completed AI Skills Bootcamp — Module 1 (Foundations)", sourcePage: "/ai-tools/skills-bootcamp", eventPayload: { toolKey: "skills-bootcamp", module: 1, score: 88 } },
    { eventType: "service_outcome", eventDomain: "workforce", eventTitle: "Job interview scheduled — H-E-B distribution center", sourcePage: "/workforce-employers", eventPayload: { employer: "H-E-B", role: "Forklift operator", interviewDate: "2026-04-29" } },
    { eventType: "compliance_event", eventDomain: "reentry", eventTitle: "Probation check-in #6 completed — all conditions met", sourcePage: "/reentry", eventPayload: { officer: "PO Ramirez", complianceStatus: "all conditions met", nextCheckIn: "2026-05-09" } },
  ];
  for (const e of events) await db.insert(residentJourneyEvents).values({ ...baseEvent, ...e });
}

export function registerResidentJourneyRoutes(app: Express) {
  app.get("/api/resident/scenarios", async (_req, res) => {
    try {
      const profile = await ensureDemoScenario();
      res.json([{
        id: profile.id,
        key: DEMO_SCENARIO_KEY,
        name: `${profile.firstName} ${profile.lastName}`,
        summary: "Former foster youth, 18 months incarcerated, released to Travis County 90 days ago. Active across reentry, workforce, AI training, benefits, community.",
        currentLocation: { state: profile.state, city: profile.city, zipCode: profile.zipCode },
      }]);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load scenarios", detail: String(error?.message || error) });
    }
  });

  app.post("/api/resident/seed-demo", async (req, res) => {
    try {
      const reset = req.query.reset === "true" || req.body?.reset === true;
      const p = await ensureDemoScenario(reset);
      res.json({ ok: true, participantId: p.id, key: DEMO_SCENARIO_KEY, reset });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to seed demo", detail: String(error?.message || error) });
    }
  });

  app.get("/api/resident/:id/journey", async (req, res) => {
    try {
      const id = req.params.id === "demo" ? (await ensureDemoScenario()).id : req.params.id;
      const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.id, id)).limit(1);
      if (!profile) return res.status(404).json({ error: "Resident not found" });
      const [latestRisk] = await db.select().from(residentRiskSnapshots).where(eq(residentRiskSnapshots.participantId, id)).orderBy(desc(residentRiskSnapshots.snapshotAt)).limit(1);
      const events = await db.select().from(residentJourneyEvents).where(eq(residentJourneyEvents.participantId, id)).orderBy(desc(residentJourneyEvents.occurredAt)).limit(50);
      const relocations = await db.select().from(residentRelocations).where(eq(residentRelocations.participantId, id)).orderBy(desc(residentRelocations.occurredAt)).limit(10);
      const eligibility = recomputeEligibility(profile.state || "TX", payloadFromProfile(profile));
      const eventsByDomain: Record<string, number> = {};
      for (const e of events) eventsByDomain[e.eventDomain] = (eventsByDomain[e.eventDomain] || 0) + 1;
      res.json({ profile, latestRisk, events, relocations, eligibility, eventsByDomain });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load journey", detail: String(error?.message || error) });
    }
  });

  app.post("/api/resident/journey/event", async (req, res) => {
    try {
      const body = { ...(req.body || {}) };
      if (body.participantId === "demo" || !body.participantId) {
        const demo = await ensureDemoScenario();
        body.participantId = demo.id;
      } else {
        const [exists] = await db.select({ id: participantProfiles.id }).from(participantProfiles).where(eq(participantProfiles.id, body.participantId)).limit(1);
        if (!exists) return res.status(404).json({ error: "Participant not found", participantId: body.participantId });
      }
      const profile = (await db.select().from(participantProfiles).where(eq(participantProfiles.id, body.participantId)).limit(1))[0];
      if (profile && !body.stateAtEvent) body.stateAtEvent = profile.state || null;
      const parsed = insertResidentJourneyEventSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [event] = await db.insert(residentJourneyEvents).values(parsed.data).returning();
      res.json({ ok: true, event });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to log event", detail: String(error?.message || error) });
    }
  });

  app.get("/api/resident/:id/eligibility", async (req, res) => {
    try {
      const id = req.params.id === "demo" ? (await ensureDemoScenario()).id : req.params.id;
      const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.id, id)).limit(1);
      if (!profile) return res.status(404).json({ error: "Resident not found" });
      const eligibility = recomputeEligibility(profile.state || "TX", payloadFromProfile(profile));
      res.json(eligibility);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to compute eligibility", detail: String(error?.message || error) });
    }
  });

  app.get("/api/resident/:id/eligibility-preview", async (req, res) => {
    try {
      const id = req.params.id === "demo" ? (await ensureDemoScenario()).id : req.params.id;
      const toState = String(req.query.toState || "");
      if (!toState) return res.status(400).json({ error: "toState query param required" });
      const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.id, id)).limit(1);
      if (!profile) return res.status(404).json({ error: "Resident not found" });
      const payload = payloadFromProfile(profile);
      res.json(diffEligibility(profile.state || "TX", toState, payload));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to preview", detail: String(error?.message || error) });
    }
  });

  app.post("/api/resident/:id/relocate", async (req, res) => {
    try {
      const id = req.params.id === "demo" ? (await ensureDemoScenario()).id : req.params.id;
      const { toState, toCounty, toCity, reason, servicesContinued, servicesNeedingTransfer } = req.body || {};
      if (!toState) return res.status(400).json({ error: "toState required" });
      const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.id, id)).limit(1);
      if (!profile) return res.status(404).json({ error: "Resident not found" });

      const fromState = profile.state || "TX";
      const fromCity = profile.city;
      const payload = payloadFromProfile(profile);
      const delta = diffEligibility(fromState, toState, payload);

      const [reloc] = await db.insert(residentRelocations).values({
        participantId: id,
        fromState, fromCounty: null, fromCity,
        toState, toCounty: toCounty || null, toCity: toCity || null,
        reason: reason || null,
        eligibilityDelta: delta,
        servicesContinued: servicesContinued || ["AI training (cloud-delivered)", "Federal benefits already enrolled (SNAP, EITC)", "Peer mentor (remote check-ins)"],
        servicesNeedingTransfer: servicesNeedingTransfer || ["Probation supervision (interstate compact)", "Housing program", "Workforce training enrollment", "State-specific benefits (Medicaid)"],
      }).returning();

      await db.update(participantProfiles).set({ state: toState, city: toCity || null }).where(eq(participantProfiles.id, id));

      await db.insert(residentJourneyEvents).values({
        participantId: id,
        eventType: "relocation_completed",
        eventDomain: "geography",
        eventTitle: `Relocated from ${fromCity || fromState} to ${toCity || toState}`,
        eventPayload: { fromState, toState, gained: delta.gained.length, lost: delta.lost.length, continued: delta.continued.length },
        stateAtEvent: toState,
        countyAtEvent: toCounty || null,
        sourcePage: "/resident-journey",
      });

      res.json({ ok: true, relocation: reloc, delta });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to relocate", detail: String(error?.message || error) });
    }
  });

  app.get("/api/case-manager/:id/risk-chain", async (req, res) => {
    try {
      const id = req.params.id === "demo" ? (await ensureDemoScenario()).id : req.params.id;
      const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.id, id)).limit(1);
      if (!profile) return res.status(404).json({ error: "Resident not found" });
      const [snapshot] = await db.select().from(residentRiskSnapshots).where(eq(residentRiskSnapshots.participantId, id)).orderBy(desc(residentRiskSnapshots.snapshotAt)).limit(1);
      const [assessment] = await db.select().from(reentryIntakeAssessments).where(eq(reentryIntakeAssessments.userId, profile.userId || "")).orderBy(desc(reentryIntakeAssessments.createdAt)).limit(1);
      const complianceEvents = await db.select().from(residentJourneyEvents).where(and(eq(residentJourneyEvents.participantId, id), eq(residentJourneyEvents.eventDomain, "reentry"))).orderBy(desc(residentJourneyEvents.occurredAt)).limit(20);
      res.json({
        profile: {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`,
          age: profile.age,
          location: { state: profile.state, city: profile.city, zip: profile.zipCode },
          supervisionStatus: profile.supervisionStatus,
          releaseDate: profile.releaseDate,
        },
        riskSnapshot: snapshot,
        assessment,
        complianceEvents,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to load risk chain", detail: String(error?.message || error) });
    }
  });

  // ── PERSONAL JOURNEY CREATOR ──
  // Creates a real profile from user-entered circumstances, computes ChainWeb
  // risk/protective factors from their inputs, seeds recommended interventions.
  // No auth required — works for any community member who wants to see their own journey.
  app.post("/api/resident/journey/create-personal", async (req, res) => {
    try {
      const {
        firstName, age, city, state, housingStatus, employmentStatus, educationLevel,
        justiceInvolved, releaseDate, supervisionStatus, healthNeeds, mentalHealthNeeds,
        dependents, veteranStatus, substanceUseHistory, familySituation,
      } = req.body || {};

      const userId = `personal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const [profile] = await db.insert(participantProfiles).values({
        userId,
        firstName: (firstName || "You").trim(),
        lastName: "",
        age: age ? parseInt(String(age)) : null,
        city: city || null,
        state: state || "TX",
        housingStatus: housingStatus || null,
        employmentStatus: employmentStatus || null,
        educationLevel: educationLevel || null,
        justiceInvolved: justiceInvolved === true || justiceInvolved === "true",
        releaseDate: releaseDate || null,
        supervisionStatus: supervisionStatus || null,
        healthNeeds: Array.isArray(healthNeeds) ? healthNeeds : (healthNeeds ? [healthNeeds] : []),
        mentalHealthNeeds: mentalHealthNeeds || null,
        dependents: dependents ? parseInt(String(dependents)) : 0,
        veteranStatus: veteranStatus === true || veteranStatus === "true",
        substanceUseHistory: substanceUseHistory || null,
        familySituation: familySituation || null,
      }).returning();

      // ── ChainWeb individual risk/protective factor computation ──
      const riskFactors: { factor: string; severity: string; source: string }[] = [];
      const protectiveFactors: { factor: string; strength: string; source: string }[] = [];
      const chainwebCitations: { source: string; url: string; relevance: string }[] = [];
      let riskScore = 0;

      const edu = (educationLevel || "").toLowerCase();
      if (edu.includes("bachelor") || edu.includes("associate") || edu.includes("college") || edu.includes("some college")) {
        protectiveFactors.push({ factor: "Post-secondary education attained", strength: "high", source: "ChainWeb: RAND Corporation — education reduces recidivism 43%" });
        chainwebCitations.push({ source: "RAND Corporation (2013) — Correctional Education Effectiveness", url: "https://www.rand.org/pubs/research_reports/RR266.html", relevance: "College attainment is the strongest educational protective factor" });
      } else if (edu.includes("high school") || edu.includes("ged") || edu.includes("diploma") || edu.includes("credit")) {
        protectiveFactors.push({ factor: "High school credential / GED attained", strength: "medium", source: "ChainWeb: National Center for Education Statistics — credential attainment outcomes" });
      } else if (edu) {
        riskScore += 15;
        riskFactors.push({ factor: "No high school credential — key barrier to employment and stability", severity: "high", source: "ChainWeb: BLS — HS dropouts earn 25% less; 4× more likely to become justice-involved" });
      }

      const emp = (employmentStatus || "").toLowerCase();
      if (emp.includes("full") || emp.includes("part-time") || emp.includes("self")) {
        protectiveFactors.push({ factor: "Currently employed — income and structure", strength: "high", source: "ChainWeb: CSG Justice Center — employment = single strongest reentry predictor" });
        chainwebCitations.push({ source: "Council of State Governments Justice Center", url: "https://csgjusticecenter.org/", relevance: "Employment in first 6 months is the strongest predictor of successful reintegration" });
      } else if (emp.includes("unemployed") || emp.includes("seeking")) {
        riskScore += 15;
        riskFactors.push({ factor: "Currently unemployed — income instability risk", severity: "high", source: "ChainWeb: Urban Institute — unemployment doubles recidivism risk in first year" });
        chainwebCitations.push({ source: "Urban Institute — Returning Home Study", url: "https://www.urban.org/policy-centers/justice-policy-center/projects/returning-home-study", relevance: "Employment stability is the primary reentry protective factor" });
      }

      const housing = (housingStatus || "").toLowerCase();
      if (housing.includes("own") || housing.includes("stable") || housing.includes("permanent")) {
        protectiveFactors.push({ factor: "Stable permanent housing — foundation for all other outcomes", strength: "high", source: "ChainWeb: HUD — stable housing cuts recidivism risk by 60%" });
      } else if (housing.includes("transitional") || housing.includes("halfway") || housing.includes("temporary")) {
        riskScore += 10;
        riskFactors.push({ factor: "Transitional/temporary housing — stability risk within 90 days", severity: "medium", source: "ChainWeb: HUD CHAS — transitional housing instability increases recidivism risk" });
        chainwebCitations.push({ source: "HUD — Housing and Reentry", url: "https://www.huduser.gov/", relevance: "Stable permanent housing is prerequisite for successful reintegration" });
      } else if (housing.includes("homeless") || housing.includes("unstable") || housing.includes("shelter")) {
        riskScore += 25;
        riskFactors.push({ factor: "Homelessness or severe housing instability", severity: "critical", source: "ChainWeb: NAEH — homelessness triples recidivism risk" });
        chainwebCitations.push({ source: "National Alliance to End Homelessness — Housing and Reentry", url: "https://endhomelessness.org/", relevance: "Housing instability is the leading structural cause of recidivism" });
      }

      if (justiceInvolved === true || justiceInvolved === "true") {
        riskScore += 10;
        riskFactors.push({ factor: "Justice system history — base recidivism risk applies", severity: "medium", source: "ChainWeb: Bureau of Justice Statistics — recidivism patterns" });
        chainwebCitations.push({ source: "Bureau of Justice Statistics — Recidivism of Prisoners Study", url: "https://www.bjs.gov/", relevance: "Justice involvement base-rate data; protective factors can offset" });
        if (releaseDate) {
          const days = Math.floor((Date.now() - new Date(releaseDate).getTime()) / 86400000);
          if (days >= 0 && days < 90) {
            riskScore += 15;
            riskFactors.push({ factor: `Released ${days} days ago — first 90 days is the highest-risk window`, severity: "high", source: "ChainWeb: CSG Justice Center — 90-day critical window post-release" });
          } else if (days >= 90 && days < 365) {
            riskScore += 5;
            protectiveFactors.push({ factor: `${days} days since release — past the highest-risk window`, strength: "medium", source: "ChainWeb: Urban Institute — risk decreases after first 90 days with stable services" });
          }
        }
      }

      if (veteranStatus === true || veteranStatus === "true") {
        protectiveFactors.push({ factor: "Veteran status — priority access to VA housing, healthcare, employment programs", strength: "high", source: "ChainWeb: VA Health Services — Veterans have priority treatment access" });
        chainwebCitations.push({ source: "U.S. Department of Veterans Affairs — Veterans Justice Outreach", url: "https://www.va.gov/homeless/vjо.asp", relevance: "Veterans receive priority access to housing, mental health, and employment programs" });
      }

      if (mentalHealthNeeds && !["none", "no", "n/a"].includes(mentalHealthNeeds.toLowerCase())) {
        riskScore += 10;
        riskFactors.push({ factor: "Mental health needs identified — support access is critical", severity: "medium", source: "ChainWeb: SAMHSA — untreated mental illness increases recidivism 3-4×" });
        chainwebCitations.push({ source: "SAMHSA — Behavioral Health and Justice", url: "https://www.samhsa.gov/", relevance: "Mental health treatment access reduces recidivism by 20-40%" });
      }

      if (substanceUseHistory && !["none", "no", "n/a"].includes((substanceUseHistory || "").toLowerCase())) {
        riskScore += 12;
        riskFactors.push({ factor: "Substance use history — recovery support is a priority", severity: "medium", source: "ChainWeb: NIDA — substance use disorder and criminal recidivism" });
        chainwebCitations.push({ source: "National Institute on Drug Abuse — Drug and Crime Research", url: "https://nida.nih.gov/", relevance: "Addiction treatment reduces criminal activity by 40-60%" });
      }

      const fam = (familySituation || "").toLowerCase();
      if (fam.includes("foster") || fam.includes("aged out")) {
        riskScore += 15;
        riskFactors.push({ factor: "Foster care history — foster-to-prison pipeline risk", severity: "high", source: "ChainWeb: AECF Kids Count — former foster youth 3× more likely to be incarcerated by 26" });
        chainwebCitations.push({ source: "Annie E. Casey Foundation — Kids Count on Foster Care Outcomes", url: "https://www.aecf.org/work/child-welfare", relevance: "Foster care experience is a significant ACE and pipeline risk factor" });
      }
      if (fam.includes("support") || fam.includes("family") || fam.includes("parent")) {
        protectiveFactors.push({ factor: "Family support network present", strength: "high", source: "ChainWeb: Urban Institute — family support is the single strongest predictor of successful reentry" });
      }

      const deps = parseInt(String(dependents || 0));
      if (deps > 0) {
        protectiveFactors.push({ factor: `Parenting role (${deps} dependent${deps > 1 ? "s" : ""}) — strong motivation for stability`, strength: "medium", source: "ChainWeb: Urban Institute — parental role as reentry motivation" });
      }

      riskScore = Math.min(100, Math.max(0, riskScore));
      const riskLevel = riskScore >= 60 ? "critical" : riskScore >= 40 ? "high" : riskScore >= 20 ? "moderate" : "low";

      const recommendedInterventions: { intervention: string; priority: string; rationale: string }[] = [];
      if (justiceInvolved) {
        recommendedInterventions.push({ intervention: "Connect with a peer mentor — returning citizen with similar background and county", priority: "highest", rationale: "Single strongest predictor: stable trusted relationship in first 90 days post-release reduces recidivism more than any other single intervention." });
      }
      if (housing.includes("transitional") || housing.includes("homeless") || housing.includes("temporary")) {
        recommendedInterventions.push({ intervention: "Secure permanent housing before transitional period ends", priority: "highest", rationale: "Housing instability in first 6 months triples reincarceration risk. This is the structural prerequisite for all other stability." });
      }
      if (emp.includes("unemployed") || emp.includes("seeking")) {
        recommendedInterventions.push({ intervention: "Enroll in workforce training with employer connections (30-day gap-to-employment target)", priority: "highest", rationale: "Employment within 90 days of release is the single strongest predictor of successful reintegration." });
      }
      if (!edu.includes("college") && !edu.includes("bachelor")) {
        recommendedInterventions.push({ intervention: "Connect to community college or credential pathway — even 1 year of college shifts outcomes dramatically", priority: "high", rationale: "RAND meta-analysis: in-custody or post-release education reduces recidivism 43%. Each additional year compounds the protective factor." });
      }
      if (mentalHealthNeeds && !["none", "no"].includes((mentalHealthNeeds || "").toLowerCase())) {
        recommendedInterventions.push({ intervention: "Schedule initial mental health assessment with community mental health center", priority: "high", rationale: "Treated mental health conditions reduce recidivism by 20-40%. Untreated, they are among the top 3 drivers of reincarceration." });
      }
      if (veteranStatus === true || veteranStatus === "true") {
        recommendedInterventions.push({ intervention: "Connect with VA Veterans Justice Outreach — priority access to housing, healthcare, employment", priority: "high", rationale: "Veterans have legal priority access to programs that dramatically improve outcomes. Many eligible veterans never connect." });
      }
      recommendedInterventions.push({ intervention: "Complete 9-benefit screener to identify all eligible programs", priority: "medium", rationale: "Most people in reentry qualify for 4-8 programs they don't know about. Average value: $10,000-15,000 per year." });

      await db.insert(residentRiskSnapshots).values({
        participantId: profile.id,
        riskFactors,
        protectiveFactors,
        chainwebCitations,
        overallRiskScore: riskScore,
        trendDirection: riskScore < 40 ? "stable" : "needs_attention",
        recommendedInterventions,
      });

      const eligibility = recomputeEligibility(state || "TX", {
        incomeAnnual: emp.includes("full") ? 28000 : 0,
        householdSize: 1 + deps,
        hasChildren: deps > 0,
        isPregnant: false,
        isDisabled: false,
      });

      res.json({ ok: true, profileId: profile.id, userId, riskScore, riskLevel, eligibility });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create personal journey", detail: String(error?.message || error) });
    }
  });

  // ── CHAINWEB INDIVIDUAL NARRATIVE ──
  // Generates an AI-powered personalized narrative for any individual's ChainWeb plan.
  // Uses the same RAND/Urban Institute/CSG/BJS citation model as the community-level analysis
  // but applied to the individual's specific risk and protective factor profile.
  app.post("/api/resident/:id/chainweb-plan", async (req, res) => {
    try {
      const id = req.params.id === "demo" ? (await ensureDemoScenario()).id : req.params.id;
      const [profile] = await db.select().from(participantProfiles).where(eq(participantProfiles.id, id)).limit(1);
      if (!profile) return res.status(404).json({ error: "Resident not found" });
      const [snapshot] = await db.select().from(residentRiskSnapshots).where(eq(residentRiskSnapshots.participantId, id)).orderBy(desc(residentRiskSnapshots.snapshotAt)).limit(1);

      const name = profile.firstName === "You" || !profile.firstName ? "this person" : profile.firstName;
      const prompt = `You are the ChainWeb Individual Planning Engine — built on Dr. Terry Flood's implementation science framework combining RNR (Risk-Need-Responsivity), CFIR, and the RAND/Urban Institute evidence base.

Your job: write a PERSONALIZED, HONEST, ACTIONABLE individual ChainWeb plan for ${name}.

PROFILE:
- Age: ${profile.age || "unknown"}
- Location: ${profile.city || ""}, ${profile.state || "TX"}
- Housing: ${profile.housingStatus || "unknown"}
- Employment: ${profile.employmentStatus || "unknown"}
- Education: ${profile.educationLevel || "unknown"}
- Justice-involved: ${profile.justiceInvolved ? "yes" : "no"}
- Days since release: ${profile.releaseDate ? Math.floor((Date.now() - new Date(profile.releaseDate).getTime()) / 86400000) : "n/a"}
- Veteran: ${profile.veteranStatus ? "yes" : "no"}
- Mental health needs: ${profile.mentalHealthNeeds || "none reported"}
- Substance use: ${profile.substanceUseHistory || "none reported"}
- Dependents: ${profile.dependents || 0}
- Family situation: ${profile.familySituation || "not reported"}

RISK FACTORS: ${JSON.stringify((snapshot?.riskFactors || []).map((r: any) => r.factor))}
PROTECTIVE FACTORS: ${JSON.stringify((snapshot?.protectiveFactors || []).map((p: any) => p.factor))}
RISK SCORE: ${snapshot?.overallRiskScore ?? "not computed"}/100
RECOMMENDED INTERVENTIONS: ${JSON.stringify((snapshot?.recommendedInterventions || []).map((i: any) => i.intervention))}

Write a ChainWeb Individual Plan in JSON:
{
  "headline": "One sentence that captures this person's situation and trajectory",
  "narrative": "2-3 paragraph personal narrative — specific to their profile, NOT generic. Name their actual risk factors, their protective factors as assets, and what the research says about people in exactly their situation. Be direct and compassionate. Use 'you' — speak to them, not about them.",
  "thirtyDayPlan": [
    {"day": "Days 1-7", "action": "...", "why": "Research basis in one sentence", "resource": "Specific program or contact"}
  ],
  "sixtyDayTargets": ["Specific, measurable outcome by day 60"],
  "ninetyDayGoals": ["Specific, measurable goal by day 90"],
  "strengthsToLead": ["How to lead with their protective factors — turn assets into traction"],
  "systemsToNavigate": ["Key systems they must engage with and how to navigate them"],
  "oneThingThatChangesEverything": "The single highest-leverage intervention for THIS person specifically, with the evidence behind it"
}`;

      const aiResponse = await generateAIResponse([{ role: "user", content: prompt }], 2500);
      let plan;
      try {
        const match = aiResponse.match(/\{[\s\S]*\}/);
        plan = match ? JSON.parse(match[0]) : { narrative: aiResponse };
      } catch { plan = { narrative: aiResponse }; }

      res.json({ plan, profileId: id, timestamp: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate ChainWeb plan", detail: String(error?.message || error) });
    }
  });
}
