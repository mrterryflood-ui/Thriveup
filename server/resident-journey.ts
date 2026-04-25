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
}
