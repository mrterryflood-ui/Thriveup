import { db } from "./storage";
import { and, eq } from "drizzle-orm";
import { tradeSimsTrades, tradeSimsLessons } from "@shared/schema";
import { ELECTRICAL_TRADE_META, ELECTRICAL_LESSONS } from "@shared/data/trade-sims/electrical-lessons";
import { PLUMBING_TRADE_META, PLUMBING_LESSONS } from "@shared/data/trade-sims/plumbing-lessons";
import { HVAC_TRADE_META, HVAC_LESSONS } from "@shared/data/trade-sims/hvac-lessons";
import { WELDING_TRADE_META, WELDING_LESSONS } from "@shared/data/trade-sims/welding-lessons";
import { AUTOMOTIVE_TRADE_META, AUTOMOTIVE_LESSONS } from "@shared/data/trade-sims/automotive-lessons";
import { SOFTWARE_ENGINEERING_TRADE_META, SOFTWARE_ENGINEERING_LESSONS } from "@shared/data/trade-sims/software-engineering-lessons";
import {
  academyMerchItems,
  participantProfiles,
  serviceRecords,
  grantProjects,
  grantOpportunities,
  hubMous,
  staffingPlans,
  complianceCalendar,
  employerPartners,
  jobPostings,
  jobPlacements,
  coalitions,
  coalitionSectors,
  coalitionMembers,
  coalitionMeetings,
  pilotCohorts,
  workforceAssessments,
  benefitsEnrollmentData,
  benefitsPartners,
  benefitsChwNetwork,
  environmentalStrategies,
  dfcCoreMeasures,
  communityReadinessAssessments,
  mediaCampaigns,
  stakeholderCommitments,
  facilitatorProfiles,
  sessionPlans,
  curriculumDeliveryLogs,
  outcomeTracking,
} from "@shared/schema";

// ---------------------------------------------------------------------------
// Trade Sims — idempotent boot-time seed for all 6 trades (electrical,
// plumbing, HVAC, welding, automotive, software-engineering). Mirrors the
// admin/seed-electrical endpoint and the standalone scripts/seed-trade-sims-*
// files. Runs on every startup so a freshly deployed production DB picks up
// the 6 trades + 90 lessons automatically with no admin step required.
// ---------------------------------------------------------------------------
async function upsertTrade(meta: { slug: string; name: string; tagline: string; description: string; iconKey: string; displayOrder: number }, lessons: ReadonlyArray<any>): Promise<void> {
  const [existing] = await db.select().from(tradeSimsTrades).where(eq(tradeSimsTrades.slug, meta.slug)).limit(1);
  let tradeId: number;
  if (existing) {
    const [updated] = await db.update(tradeSimsTrades).set({
      name: meta.name, tagline: meta.tagline, description: meta.description,
      iconKey: meta.iconKey, displayOrder: meta.displayOrder, active: true,
    }).where(eq(tradeSimsTrades.id, existing.id)).returning();
    tradeId = updated.id;
  } else {
    const [inserted] = await db.insert(tradeSimsTrades).values({
      slug: meta.slug, name: meta.name, tagline: meta.tagline,
      description: meta.description, iconKey: meta.iconKey,
      displayOrder: meta.displayOrder, active: true,
    }).returning();
    tradeId = inserted.id;
  }
  for (const lesson of lessons) {
    const [existingLesson] = await db.select().from(tradeSimsLessons)
      .where(and(eq(tradeSimsLessons.tradeId, tradeId), eq(tradeSimsLessons.slug, lesson.slug))).limit(1);
    const values = {
      tradeId,
      dayNumber: lesson.dayNumber,
      slug: lesson.slug,
      title: lesson.title,
      shortDescription: lesson.shortDescription,
      concept: lesson.concept as unknown,
      guidedSteps: lesson.guidedSteps as unknown,
      soloChallenge: lesson.soloChallenge as unknown,
      sandboxStarter: lesson.sandboxStarter as unknown,
      credentialPathway: lesson.credentialPathway,
      active: true,
    };
    if (existingLesson) {
      await db.update(tradeSimsLessons).set(values).where(eq(tradeSimsLessons.id, existingLesson.id));
    } else {
      await db.insert(tradeSimsLessons).values(values);
    }
  }
}

async function seedTradeSimsAll(): Promise<void> {
  try {
    // Fast path: if all 6 trades already exist, skip the upsert work.
    const existing = await db.select({ slug: tradeSimsTrades.slug }).from(tradeSimsTrades);
    const have = new Set(existing.map(r => r.slug));
    const needed = ["electrical","plumbing","hvac","welding","automotive","software-engineering"];
    if (needed.every(s => have.has(s))) return;

    await upsertTrade(ELECTRICAL_TRADE_META as any, ELECTRICAL_LESSONS);
    await upsertTrade(PLUMBING_TRADE_META as any, PLUMBING_LESSONS);
    await upsertTrade(HVAC_TRADE_META as any, HVAC_LESSONS);
    await upsertTrade(WELDING_TRADE_META as any, WELDING_LESSONS);
    await upsertTrade(AUTOMOTIVE_TRADE_META as any, AUTOMOTIVE_LESSONS);
    await upsertTrade(SOFTWARE_ENGINEERING_TRADE_META as any, SOFTWARE_ENGINEERING_LESSONS);
    console.log("[Seed] Trade Sims: 6 trades + lessons upserted");
  } catch (err) {
    console.error("[Seed] Trade Sims seed failed:", err);
  }
}

export async function seedComprehensive(): Promise<void> {
  try {
    await seedMerchItems();
    await seedParticipantData();
    await seedGrantData();
    await seedWorkforceData();
    await seedCoalitionData();
    await seedPilotData();
    await seedBenefitsData();
    await seedPreventionFramework();
    await seedFacilitatorData();
    await seedNsfTechAccessOpportunity();
    await seedTexasHubMous();
    await seedTradeSimsAll();
    console.log("[Seed] Comprehensive seed completed");
  } catch (err) {
    console.error("[Seed] Comprehensive seed error:", err);
  }
}

async function seedMerchItems() {
  const existing = await db.select().from(academyMerchItems).limit(1);
  if (existing.length > 0) return;

  await db.insert(academyMerchItems).values([
    { id: "merch-001", name: "ThriveUp Academy Hoodie", description: "Premium heavyweight hoodie with embroidered ThriveUp logo. Soft fleece interior. Available in youth and adult sizes.", price: "45.00", category: "apparel", inStock: true },
    { id: "merch-002", name: "Panther Pride T-Shirt", description: "100% cotton crew-neck tee featuring the ThriveUp Panther mascot. Preshrunk and comfortable for everyday wear.", price: "22.00", category: "apparel", inStock: true },
    { id: "merch-003", name: "Entrepreneur Starter Journal", description: "200-page ruled journal with business planning templates, goal-setting pages, and motivational prompts.", price: "15.00", category: "supplies", inStock: true },
    { id: "merch-004", name: "ThriveUp Water Bottle", description: "24oz insulated stainless steel water bottle. Keeps drinks cold 24 hours, hot 12 hours. Laser-engraved logo.", price: "28.00", category: "accessories", inStock: true },
    { id: "merch-005", name: "Academy Laptop Sleeve", description: "Neoprene laptop sleeve fits 13-15 inch devices. Padded protection with ThriveUp badge. Front zipper pocket.", price: "30.00", category: "accessories", inStock: true },
    { id: "merch-006", name: "Dream Builder Cap", description: "Structured cotton snapback cap with raised embroidered Dream Builder text. Adjustable fit.", price: "18.00", category: "apparel", inStock: true },
    { id: "merch-007", name: "Coding & Creativity Sticker Pack", description: "Set of 12 vinyl die-cut stickers featuring tech, entrepreneurship, and motivational designs.", price: "8.00", category: "accessories", inStock: true },
    { id: "merch-008", name: "ThriveUp Backpack", description: "Durable 25L backpack with padded laptop compartment, organizational pockets, and reflective accents.", price: "55.00", category: "accessories", inStock: true },
    { id: "merch-009", name: "Financial Literacy Card Game", description: "Fun card game teaching budgeting, investing, and money management. Ages 10 and up. 2-6 players.", price: "12.00", category: "supplies", inStock: true },
    { id: "merch-010", name: "Leadership Lanyard & ID Holder", description: "Woven lanyard with detachable clip and clear ID badge holder. Perfect for campus events.", price: "6.00", category: "accessories", inStock: true },
  ]);
  console.log("[Seed] Merch items seeded");
}

async function seedParticipantData() {
  const existing = await db.select().from(participantProfiles).limit(1);
  if (existing.length > 0) return;

  const participants = [
    { id: "part-001", firstName: "Marcus", lastName: "Washington", age: 24, gender: "male", primaryLanguage: "English", city: "Austin", state: "TX", zipCode: "78702", housingStatus: "transitional", employmentStatus: "part-time", educationLevel: "GED", justiceInvolved: true, referralSource: "probation", status: "active" as const },
    { id: "part-002", firstName: "Aaliyah", lastName: "Johnson", age: 19, gender: "female", primaryLanguage: "English", city: "Austin", state: "TX", zipCode: "78741", housingStatus: "stable", employmentStatus: "unemployed", educationLevel: "high-school", justiceInvolved: false, referralSource: "community-center", status: "active" as const },
    { id: "part-003", firstName: "Carlos", lastName: "Rodriguez", age: 28, gender: "male", primaryLanguage: "Spanish", needsInterpreter: true, city: "Round Rock", state: "TX", zipCode: "78664", housingStatus: "stable", employmentStatus: "unemployed", educationLevel: "some-college", justiceInvolved: true, referralSource: "reentry-program", status: "active" as const },
    { id: "part-004", firstName: "Jasmine", lastName: "Davis", age: 22, gender: "female", primaryLanguage: "English", city: "Austin", state: "TX", zipCode: "78745", housingStatus: "at-risk", employmentStatus: "part-time", educationLevel: "high-school", justiceInvolved: false, referralSource: "self", status: "active" as const },
    { id: "part-005", firstName: "DeShawn", lastName: "Thompson", age: 31, gender: "male", primaryLanguage: "English", city: "Austin", state: "TX", zipCode: "78723", housingStatus: "homeless", employmentStatus: "unemployed", educationLevel: "some-high-school", justiceInvolved: true, referralSource: "shelter", status: "active" as const },
    { id: "part-006", firstName: "Linh", lastName: "Nguyen", age: 26, gender: "female", primaryLanguage: "Vietnamese", needsInterpreter: true, city: "Austin", state: "TX", zipCode: "78758", housingStatus: "stable", employmentStatus: "unemployed", educationLevel: "bachelors", justiceInvolved: false, referralSource: "workforce-center", status: "active" as const },
    { id: "part-007", firstName: "Jordan", lastName: "Baker", age: 20, gender: "non-binary", primaryLanguage: "English", city: "Pflugerville", state: "TX", zipCode: "78660", housingStatus: "transitional", employmentStatus: "unemployed", educationLevel: "GED", justiceInvolved: false, referralSource: "school", status: "active" as const },
    { id: "part-008", firstName: "Robert", lastName: "Garcia", age: 45, gender: "male", primaryLanguage: "English", city: "Austin", state: "TX", zipCode: "78744", housingStatus: "stable", employmentStatus: "part-time", educationLevel: "some-college", justiceInvolved: true, veteranStatus: true, referralSource: "va-services", status: "active" as const },
  ];

  await db.insert(participantProfiles).values(participants);

  const services = [
    { id: "svc-001", participantId: "part-001", serviceCategory: "employment", serviceType: "Resume Workshop", providerName: "ThriveUp Workforce", serviceDate: "2025-01-15", durationMinutes: 90, location: "Main Campus", outcome: "completed", status: "completed" as const },
    { id: "svc-002", participantId: "part-001", serviceCategory: "housing", serviceType: "Housing Navigation", providerName: "Austin Housing Authority", serviceDate: "2025-01-18", durationMinutes: 60, location: "Partner Office", outcome: "referral-made", status: "completed" as const },
    { id: "svc-003", participantId: "part-002", serviceCategory: "education", serviceType: "College Prep Advising", providerName: "ThriveUp Academy", serviceDate: "2025-01-20", durationMinutes: 45, location: "Virtual", outcome: "completed", status: "completed" as const },
    { id: "svc-004", participantId: "part-003", serviceCategory: "employment", serviceType: "Job Interview Coaching", providerName: "ThriveUp Workforce", serviceDate: "2025-01-22", durationMinutes: 60, location: "Main Campus", outcome: "completed", status: "completed" as const },
    { id: "svc-005", participantId: "part-003", serviceCategory: "legal", serviceType: "Record Expunction Guidance", providerName: "Legal Aid of Central TX", serviceDate: "2025-01-25", durationMinutes: 30, location: "Partner Office", outcome: "in-progress", status: "completed" as const },
    { id: "svc-006", participantId: "part-004", serviceCategory: "financial", serviceType: "Benefits Enrollment Assistance", providerName: "ThriveUp Benefits Nav", serviceDate: "2025-02-01", durationMinutes: 45, location: "Community Center", outcome: "completed", status: "completed" as const },
    { id: "svc-007", participantId: "part-005", serviceCategory: "housing", serviceType: "Emergency Shelter Placement", providerName: "ARCH Austin", serviceDate: "2025-02-03", durationMinutes: 120, location: "Shelter", outcome: "placed", status: "completed" as const },
    { id: "svc-008", participantId: "part-005", serviceCategory: "health", serviceType: "Mental Health Screening", providerName: "Integral Care", serviceDate: "2025-02-05", durationMinutes: 60, location: "Partner Clinic", outcome: "referral-made", followUpNeeded: true, followUpDate: "2025-02-19", status: "completed" as const },
    { id: "svc-009", participantId: "part-006", serviceCategory: "employment", serviceType: "Skills Assessment", providerName: "ThriveUp Workforce", serviceDate: "2025-02-07", durationMinutes: 90, location: "Main Campus", outcome: "completed", status: "completed" as const },
    { id: "svc-010", participantId: "part-007", serviceCategory: "education", serviceType: "GED Tutoring", providerName: "Austin Community College", serviceDate: "2025-02-10", durationMinutes: 120, location: "ACC Campus", outcome: "ongoing", status: "completed" as const },
    { id: "svc-011", participantId: "part-008", serviceCategory: "health", serviceType: "VA Benefits Navigation", providerName: "Texas Veterans Commission", serviceDate: "2025-02-12", durationMinutes: 60, location: "VA Office", outcome: "completed", status: "completed" as const },
    { id: "svc-012", participantId: "part-002", serviceCategory: "employment", serviceType: "Internship Placement", providerName: "ThriveUp Workforce", serviceDate: "2025-02-15", durationMinutes: 45, location: "Virtual", outcome: "placed", status: "completed" as const },
  ];

  await db.insert(serviceRecords).values(services);
  console.log("[Seed] Participant profiles and service records seeded");
}

async function seedNsfTechAccessOpportunity() {
  const { eq } = await import("drizzle-orm");
  const exists = await db.select().from(grantOpportunities).where(eq(grantOpportunities.cfda, "47.084-26-508")).limit(1);
  if (exists.length > 0) return;
  await db.insert(grantOpportunities).values({
    title: "NSF 26-508 — TechAccess: AI-Ready America (State/Territory Coordination Hub)",
    agency: "National Science Foundation (TIP/EDU/CISE) with DOL/ETA, USDA-NIFA, SBA",
    fundingAmount: "$1,000,000/year × 3 years (Y4 optional)",
    deadline: new Date("2026-06-16T22:00:00Z"),
    description: "National program funding one Coordination Hub per state/territory to accelerate AI readiness across education, workforce, small business, and public-serving sectors. TCAF positioning: Texas State Coordination Hub anchored on RPLICE v2 (live multi-org coordination protocol) + 24-platform AI ecosystem + open Hub Adoption Kit usable by all 55 other jurisdictions.",
    eligibilityCriteria: "One proposal per institution. No cost-share. Round 1: 10 hubs (LOI Jun 16, 2026; full Jul 16, 2026). Round 2: 20 hubs (LOI Dec 15, 2026). Round 3: remainder (LOI Jun 1, 2027).",
    focusAreas: ["AI readiness","workforce development","small business","cooperative extension","state coordination","federal partner integration"],
    grantType: "Standard Grant or Continuing Grant",
    sourceUrl: "https://www.nsf.gov/funding/opportunities/nsf26-508",
    cfda: "47.084-26-508",
    awardFloor: 1000000,
    awardCeiling: 4000000,
    estimatedFunding: 224000000,
    expectedAwards: 56,
    category: "Federal — National Science Foundation",
    status: "loi_drafting",
    source: "manual",
    postedDate: new Date("2026-03-25T00:00:00Z"),
    responseDate: new Date("2026-07-16T22:00:00Z"),
    notes: "TCAF Texas Hub Workbench live at /nsf-techaccess-hub. Adoption kit at shared/nationwide/hub-adoption-kit/. Live AI-grounded state intelligence + LOI generator working for all 56 jurisdictions.",
  });
  console.log("[Seed] NSF 26-508 TechAccess opportunity inserted");
}

async function seedTexasHubMous() {
  const { eq } = await import("drizzle-orm");
  const exists = await db.select().from(hubMous).where(eq(hubMous.hubStateCode, "TX")).limit(1);
  if (exists.length > 0) return;
  await db.insert(hubMous).values([
    {
      hubStateCode: "TX",
      partnerOrg: "Texas Workforce Commission (TWC)",
      partnerRole: "Workforce — DOL/ETA alignment, AJC integration",
      contactName: "Workforce Solutions Capital Area",
      contactEmail: "info@wfscapitalarea.com",
      status: "outreached",
      notes: "Aligns NSF 26-508 hub workforce track with active Workforce Innovation & Opportunity Act (WIOA) infrastructure across 28 local boards.",
    },
    {
      hubStateCode: "TX",
      partnerOrg: "Texas A&M AgriLife Extension Service",
      partnerRole: "USDA-NIFA Cooperative Extension — rural reach, county network",
      contactName: "AgriLife Extension State Office",
      contactEmail: "agrilife-extension@tamu.edu",
      status: "outreached",
      notes: "Extension presence in all 254 Texas counties — operational reach for AI-readiness curriculum delivery to rural and small-business audiences.",
    },
    {
      hubStateCode: "TX",
      partnerOrg: "UTSA Small Business Development Center (Network)",
      partnerRole: "SBA SBDC — small business AI readiness pilot",
      contactName: "South-West Texas Border SBDC Network",
      contactEmail: "sbdc@utsa.edu",
      status: "outreached",
      notes: "SBDC Network covers 79 counties in south/west Texas; pilot fits SBA AI-for-small-business priority and provides direct business audience for hub.",
    },
  ]);
  console.log("[Seed] Texas Hub MOUs seeded");
}

async function seedGrantData() {
  const existing = await db.select().from(grantProjects).limit(1);
  if (existing.length > 0) return;

  const projects = [
    { id: "gp-001", grantName: "SAMHSA Drug-Free Communities Grant", fundingSource: "SAMHSA/ONDCP", awardAmount: "125000.00", startDate: "2024-10-01", endDate: "2025-09-30", status: "active", projectDirector: "Dr. Angela Morales", description: "Year 2 of DFC support coalition to reduce youth substance use through environmental strategies and community mobilization.", objectives: [{ name: "Reduce youth marijuana use by 5%", status: "in-progress" }, { name: "Increase perception of harm among 12-17 year-olds", status: "in-progress" }, { name: "Establish 12-sector coalition", status: "completed" }] },
    { id: "gp-002", grantName: "DOL YouthBuild Workforce Training", fundingSource: "U.S. Department of Labor", awardAmount: "750000.00", startDate: "2024-07-01", endDate: "2027-06-30", status: "active", projectDirector: "James Patterson", description: "Three-year grant supporting workforce readiness training, GED preparation, and job placement for opportunity youth ages 16-24.", objectives: [{ name: "Enroll 60 participants per year", status: "in-progress" }, { name: "Achieve 75% credential attainment", status: "in-progress" }, { name: "Place 80% of completers in employment or education", status: "planning" }] },
    { id: "gp-003", grantName: "OJJDP Second Chance Reentry", fundingSource: "Office of Juvenile Justice", awardAmount: "500000.00", startDate: "2025-01-01", endDate: "2027-12-31", status: "pre-award", projectDirector: "Maria Santos", description: "Comprehensive reentry support for justice-involved youth including mentoring, family engagement, and wraparound services.", objectives: [{ name: "Serve 40 youth annually", status: "planning" }, { name: "Reduce recidivism by 30%", status: "planning" }, { name: "Connect 90% to mental health services", status: "planning" }] },
  ];

  await db.insert(grantProjects).values(projects);

  await db.insert(staffingPlans).values([
    { id: "sp-001", grantProjectId: "gp-001", positionTitle: "Coalition Coordinator", qualifications: "BA in public health or related field; 2+ years community organizing experience", fte: "1.00", salary: "52000.00", status: "filled", hiredPersonName: "Sarah Chen", startDate: "2024-10-15" },
    { id: "sp-002", grantProjectId: "gp-001", positionTitle: "Data & Evaluation Specialist", qualifications: "MA in evaluation or social science; experience with SAMHSA core measures", fte: "0.50", salary: "30000.00", status: "filled", hiredPersonName: "Dr. Raj Patel", startDate: "2024-11-01" },
    { id: "sp-003", grantProjectId: "gp-002", positionTitle: "Program Manager", qualifications: "BA required; 3+ years youth workforce program management", fte: "1.00", salary: "58000.00", status: "filled", hiredPersonName: "James Patterson", startDate: "2024-07-01" },
    { id: "sp-004", grantProjectId: "gp-002", positionTitle: "Career Coach", qualifications: "BA preferred; workforce development experience; bilingual Spanish/English preferred", fte: "1.00", salary: "45000.00", status: "filled", hiredPersonName: "Rosa Hernandez", startDate: "2024-08-01" },
    { id: "sp-005", grantProjectId: "gp-002", positionTitle: "GED Instructor", qualifications: "Teaching certification; adult education experience", fte: "0.75", salary: "38000.00", status: "interviewing" },
    { id: "sp-006", grantProjectId: "gp-003", positionTitle: "Reentry Case Manager", qualifications: "MSW or related; trauma-informed care certification", fte: "1.00", salary: "50000.00", status: "planned" },
  ]);

  await db.insert(complianceCalendar).values([
    { id: "cc-001", grantProjectId: "gp-001", taskName: "Semi-Annual Progress Report", taskType: "report", dueDate: "2025-03-31", status: "upcoming", responsiblePerson: "Sarah Chen" },
    { id: "cc-002", grantProjectId: "gp-001", taskName: "Core Measures Data Submission", taskType: "data", dueDate: "2025-04-15", status: "upcoming", responsiblePerson: "Dr. Raj Patel" },
    { id: "cc-003", grantProjectId: "gp-001", taskName: "Annual Financial Report (SF-425)", taskType: "financial", dueDate: "2025-10-30", status: "upcoming", responsiblePerson: "Finance Office" },
    { id: "cc-004", grantProjectId: "gp-002", taskName: "Quarterly Performance Report", taskType: "report", dueDate: "2025-04-30", status: "upcoming", responsiblePerson: "James Patterson" },
    { id: "cc-005", grantProjectId: "gp-002", taskName: "Annual Evaluation Report", taskType: "report", dueDate: "2025-07-31", status: "upcoming", responsiblePerson: "External Evaluator" },
    { id: "cc-006", grantProjectId: "gp-003", taskName: "Grant Award Acceptance & Onboarding", taskType: "admin", dueDate: "2025-02-15", status: "completed", responsiblePerson: "Maria Santos" },
  ]);

  console.log("[Seed] Grant projects, staffing plans, and compliance calendar seeded");
}

async function seedWorkforceData() {
  const existingEmployers = await db.select().from(employerPartners).limit(1);
  if (existingEmployers.length > 0) return;

  const employers = [
    { id: "emp-001", companyName: "H-E-B Grocery Company", industry: "Retail", contactName: "David Torres", contactEmail: "dtorres@heb.com", hiringCommitments: "15 positions annually for program graduates", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Texas-based grocery chain committed to community workforce development", location: "Austin, TX", partnershipStatus: "active" as const },
    { id: "emp-002", companyName: "Austin Energy", industry: "Utilities", contactName: "Karen Mitchell", contactEmail: "karen.mitchell@austinenergy.com", hiringCommitments: "Apprenticeship pipeline for 10 trainees per year", barrierFriendly: true, banTheBox: true, fairChanceHiring: false, description: "Municipal utility providing clean energy workforce training opportunities", location: "Austin, TX", partnershipStatus: "active" as const },
    { id: "emp-003", companyName: "Goodwill Central Texas", industry: "Nonprofit/Retail", contactName: "Lisa Ramirez", contactEmail: "lramirez@goodwillcentraltx.org", hiringCommitments: "Rolling intake, 20+ positions", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Workforce development and retail social enterprise providing second-chance employment", location: "Austin, TX", partnershipStatus: "active" as const },
    { id: "emp-004", companyName: "Samsung Austin Semiconductor", industry: "Manufacturing", contactName: "Michael Park", contactEmail: "m.park@samsung.com", hiringCommitments: "5 entry-level technician roles quarterly", barrierFriendly: false, banTheBox: false, fairChanceHiring: false, description: "Advanced semiconductor manufacturing facility with structured training programs", location: "Austin, TX", partnershipStatus: "active" as const },
    { id: "emp-005", companyName: "Capital Metro", industry: "Transportation", contactName: "Andrea Williams", contactEmail: "andrea.williams@capmetro.org", hiringCommitments: "CDL training and placement for 8 participants annually", barrierFriendly: true, banTheBox: true, fairChanceHiring: true, description: "Public transit authority offering CDL training and career pathways", location: "Austin, TX", partnershipStatus: "active" as const },
  ];

  await db.insert(employerPartners).values(employers);

  await db.insert(jobPostings).values([
    { id: "job-001", employerId: "emp-001", title: "Warehouse Associate", description: "Receive, sort, and organize deliveries. Maintain clean and safe warehouse. Operate pallet jack and basic equipment.", wageRange: "$16-$18/hr", hoursPerWeek: "40", benefits: "Health insurance, 401k match, tuition reimbursement", requirements: "Ability to lift 50lbs; no experience required; paid training provided", barrierFriendly: true, location: "Austin Distribution Center", status: "open" as const },
    { id: "job-002", employerId: "emp-001", title: "Grocery Clerk", description: "Stock shelves, assist customers, maintain department presentation. Entry-level role with advancement opportunities.", wageRange: "$14-$16/hr", hoursPerWeek: "32-40", benefits: "Health insurance after 60 days, employee discount", requirements: "Customer service orientation; bilingual English/Spanish preferred", barrierFriendly: true, location: "Multiple Austin locations", status: "open" as const },
    { id: "job-003", employerId: "emp-002", title: "Utility Maintenance Apprentice", description: "Learn utility infrastructure maintenance under experienced mentors. Combination of classroom and field training.", wageRange: "$18-$22/hr", hoursPerWeek: "40", benefits: "Full benefits package, pension, tuition support", requirements: "HS diploma or GED; valid driver license; mechanical aptitude", barrierFriendly: true, location: "Austin Energy facilities", status: "open" as const },
    { id: "job-004", employerId: "emp-003", title: "Retail Sales Associate", description: "Process sales transactions, organize merchandise, provide customer service in thrift retail environment.", wageRange: "$13-$15/hr", hoursPerWeek: "20-40", benefits: "Flexible scheduling, employee discount, career coaching", requirements: "No experience needed; training provided; all backgrounds welcome", barrierFriendly: true, location: "Goodwill stores", status: "open" as const },
    { id: "job-005", employerId: "emp-005", title: "Bus Operator Trainee", description: "Paid CDL training program leading to full-time transit operator position. Comprehensive 8-week training academy.", wageRange: "$20-$24/hr", hoursPerWeek: "40", benefits: "Full benefits, pension, transit pass", requirements: "Valid driver license; clean driving record for 3 years; GED or equivalent", barrierFriendly: true, location: "Capital Metro HQ", status: "open" as const },
  ]);

  await db.insert(jobPlacements).values([
    { id: "jp-001", userId: "part-001", userName: "Marcus Washington", employerId: "emp-003", employerName: "Goodwill Central Texas", jobTitle: "Retail Sales Associate", startDate: new Date("2025-02-01"), wage: "$14.50/hr", hoursPerWeek: 32, benefits: "Employee discount, career coaching", placementSource: "ThriveUp Workforce", status: "active" as const },
    { id: "jp-002", userId: "part-004", userName: "Jasmine Davis", employerId: "emp-001", employerName: "H-E-B Grocery Company", jobTitle: "Grocery Clerk", startDate: new Date("2025-01-15"), wage: "$15.00/hr", hoursPerWeek: 40, benefits: "Health insurance, 401k, tuition reimbursement", placementSource: "ThriveUp Workforce", status: "active" as const },
    { id: "jp-003", userId: "part-006", userName: "Linh Nguyen", employerId: "emp-004", employerName: "Samsung Austin Semiconductor", jobTitle: "Production Technician", startDate: new Date("2025-03-01"), wage: "$22.00/hr", hoursPerWeek: 40, benefits: "Full benefits package", placementSource: "Workforce Solutions Capital Area", status: "active" as const },
  ]);

  await db.insert(workforceAssessments).values([
    { id: "wa-001", userId: "part-001", userName: "Marcus Washington", skills: [{ name: "Customer Service", level: "intermediate" }, { name: "Inventory Management", level: "beginner" }], workHistory: [{ employer: "Temp Agency", role: "General Labor", duration: "6 months" }], educationLevel: "GED", barriers: [{ type: "criminal-record", severity: "moderate" }, { type: "transportation", severity: "low" }], careerInterests: [{ field: "Logistics", priority: "high" }], readinessLevel: "job-ready", status: "completed" as const },
    { id: "wa-002", userId: "part-002", userName: "Aaliyah Johnson", skills: [{ name: "Communication", level: "advanced" }, { name: "Social Media", level: "intermediate" }], workHistory: [], educationLevel: "high-school", barriers: [{ type: "lack-of-experience", severity: "moderate" }], careerInterests: [{ field: "Marketing", priority: "high" }, { field: "Business", priority: "medium" }], readinessLevel: "exploring", status: "completed" as const },
    { id: "wa-003", userId: "part-003", userName: "Carlos Rodriguez", skills: [{ name: "Construction", level: "advanced" }, { name: "Equipment Operation", level: "intermediate" }], workHistory: [{ employer: "Day Labor", role: "Construction Helper", duration: "2 years" }], educationLevel: "some-college", barriers: [{ type: "criminal-record", severity: "high" }, { type: "language", severity: "moderate" }], careerInterests: [{ field: "Skilled Trades", priority: "high" }], readinessLevel: "training", status: "completed" as const },
  ]);

  console.log("[Seed] Workforce data seeded");
}

async function seedCoalitionData() {
  const existing = await db.select().from(coalitions).limit(1);
  if (existing.length > 0) return;

  await db.insert(coalitions).values([
    { id: "coal-001", name: "ThriveUp Community Coalition", mission: "Mobilize 12 community sectors to reduce youth substance use, promote positive development, and strengthen protective factors through evidence-based environmental strategies.", formationDate: "2024-01-15", status: "active" },
  ]);

  await db.insert(coalitionSectors).values([
    { id: "cs-001", coalitionId: "coal-001", sectorNumber: 1, sectorName: "Youth", description: "Youth-serving organizations including afterschool programs, mentoring, and youth development", isRepresented: true, representativeNames: ["Jordan Blake", "Maria Santos"] },
    { id: "cs-002", coalitionId: "coal-001", sectorNumber: 2, sectorName: "Parents", description: "Parent organizations, PTA/PTO groups, and family resource centers", isRepresented: true, representativeNames: ["Patricia Gomez"] },
    { id: "cs-003", coalitionId: "coal-001", sectorNumber: 3, sectorName: "Business Community", description: "Local business owners, chambers of commerce, and workforce development entities", isRepresented: true, representativeNames: ["David Torres", "Karen Mitchell"] },
    { id: "cs-004", coalitionId: "coal-001", sectorNumber: 4, sectorName: "Media", description: "Local media outlets, communication professionals, and digital media organizations", isRepresented: true, representativeNames: ["Alexis Rivera"] },
    { id: "cs-005", coalitionId: "coal-001", sectorNumber: 5, sectorName: "Schools", description: "K-12 schools, administrators, counselors, and education support staff", isRepresented: true, representativeNames: ["Dr. Lisa Park", "Coach Williams"] },
    { id: "cs-006", coalitionId: "coal-001", sectorNumber: 6, sectorName: "Youth-Serving Organizations", description: "Boys & Girls Clubs, YMCA, scouting, and other youth organizations", isRepresented: true, representativeNames: ["James Patterson"] },
    { id: "cs-007", coalitionId: "coal-001", sectorNumber: 7, sectorName: "Law Enforcement", description: "Local police, sheriff departments, school resource officers, and juvenile justice", isRepresented: true, representativeNames: ["Officer Daniels"] },
    { id: "cs-008", coalitionId: "coal-001", sectorNumber: 8, sectorName: "Religious/Fraternal Organizations", description: "Faith-based organizations, churches, and community spiritual leaders", isRepresented: true, representativeNames: ["Pastor Grace Lee"] },
    { id: "cs-009", coalitionId: "coal-001", sectorNumber: 9, sectorName: "Civic/Volunteer Groups", description: "Service clubs, volunteer organizations, and civic engagement groups", isRepresented: false },
    { id: "cs-010", coalitionId: "coal-001", sectorNumber: 10, sectorName: "Healthcare Professionals", description: "Doctors, nurses, pharmacists, mental health providers, and public health staff", isRepresented: true, representativeNames: ["Dr. Angela Morales", "Nurse Thompson"] },
    { id: "cs-011", coalitionId: "coal-001", sectorNumber: 11, sectorName: "State/Local Government", description: "Elected officials, city/county staff, and state agency representatives", isRepresented: true, representativeNames: ["Council Member Reyes"] },
    { id: "cs-012", coalitionId: "coal-001", sectorNumber: 12, sectorName: "Other Substance Use Organizations", description: "Prevention, treatment, and recovery organizations focused on substance use", isRepresented: true, representativeNames: ["Robert Chen"] },
  ]);

  await db.insert(coalitionMembers).values([
    { id: "cm-001", coalitionId: "coal-001", sectorId: "cs-001", memberName: "Jordan Blake", role: "Co-Chair", organization: "ThriveUp Academy", email: "jordan@thriveup.org" },
    { id: "cm-002", coalitionId: "coal-001", sectorId: "cs-010", memberName: "Dr. Angela Morales", role: "Chair", organization: "Travis County Health Dept", email: "amorales@traviscounty.gov" },
    { id: "cm-003", coalitionId: "coal-001", sectorId: "cs-003", memberName: "David Torres", role: "Sector Representative", organization: "H-E-B", email: "dtorres@heb.com" },
    { id: "cm-004", coalitionId: "coal-001", sectorId: "cs-005", memberName: "Dr. Lisa Park", role: "Sector Representative", organization: "Austin ISD", email: "lpark@austinisd.org" },
    { id: "cm-005", coalitionId: "coal-001", sectorId: "cs-007", memberName: "Officer Daniels", role: "Sector Representative", organization: "Austin Police Department", email: "m.daniels@austintexas.gov" },
    { id: "cm-006", coalitionId: "coal-001", sectorId: "cs-008", memberName: "Pastor Grace Lee", role: "Sector Representative", organization: "New Hope Community Church", email: "grace@newhopeatx.org" },
    { id: "cm-007", coalitionId: "coal-001", sectorId: "cs-002", memberName: "Patricia Gomez", role: "Parent Representative", organization: "Parent Community Network", email: "pgomez@pcn.org" },
    { id: "cm-008", coalitionId: "coal-001", sectorId: "cs-012", memberName: "Robert Chen", role: "Prevention Specialist", organization: "Austin Recovery", email: "rchen@austinrecovery.org" },
  ]);

  await db.insert(coalitionMeetings).values([
    { id: "mtg-001", coalitionId: "coal-001", title: "Q1 Coalition General Meeting", scheduledDate: "2025-01-22", location: "ThriveUp Main Campus - Community Room", agenda: "1. Welcome & introductions\n2. Review FY25 strategic plan\n3. Core measures data update\n4. Environmental strategy progress\n5. Sector recruitment update\n6. Upcoming training opportunities", status: "completed" as const, minutes: "Meeting called to order at 6pm. 14 of 18 members present. Strategic plan approved unanimously. Core measures baseline data presented by Dr. Patel showing 23% past-30-day marijuana use among surveyed youth. Three new environmental strategies proposed for Q2." },
    { id: "mtg-002", coalitionId: "coal-001", title: "Prevention Strategies Workgroup", scheduledDate: "2025-02-12", location: "Virtual - Zoom", agenda: "1. Review retailer compliance check results\n2. Plan youth media literacy campaign\n3. Discuss prescription drug take-back event\n4. Assign action items", status: "completed" as const },
    { id: "mtg-003", coalitionId: "coal-001", title: "Q2 Coalition General Meeting", scheduledDate: "2025-04-16", location: "Travis County Community Center", agenda: "1. Welcome\n2. Q1 progress report\n3. Community readiness assessment findings\n4. Media campaign launch update\n5. Summer programming plans\n6. Open floor", status: "scheduled" as const },
    { id: "mtg-004", coalitionId: "coal-001", title: "Data & Evaluation Committee", scheduledDate: "2025-03-20", location: "Virtual - Zoom", agenda: "1. Review stakeholder survey instrument\n2. Discuss youth focus group protocol\n3. Core measures collection timeline\n4. Evaluation plan updates", status: "scheduled" as const },
  ]);

  console.log("[Seed] Coalition data seeded");
}

async function seedPilotData() {
  const existing = await db.select().from(pilotCohorts).limit(1);
  if (existing.length > 0) return;

  await db.insert(pilotCohorts).values([
    { id: "pilot-001", name: "Spring 2025 Youth Workforce Cohort", description: "First cohort of YouthBuild workforce training program participants. Focus on construction trades, GED prep, and leadership development.", targetPopulation: "Opportunity youth ages 16-24", targetSize: 25, startDate: "2025-01-06", endDate: "2025-06-20", status: "active" as const, createdBy: "james-patterson" },
    { id: "pilot-002", name: "DFC Prevention Champions Cohort", description: "Youth leaders trained in prevention science to serve as peer educators and community advocates.", targetPopulation: "High school students ages 14-18", targetSize: 15, startDate: "2025-02-01", endDate: "2025-05-31", status: "active" as const, createdBy: "sarah-chen" },
    { id: "pilot-003", name: "Summer 2025 Reentry Support Cohort", description: "Comprehensive wraparound services for justice-involved young adults transitioning back to community.", targetPopulation: "Justice-involved youth ages 17-25", targetSize: 20, startDate: "2025-06-01", endDate: "2025-12-31", status: "planning" as const, createdBy: "maria-santos" },
  ]);

  console.log("[Seed] Pilot cohort data seeded");
}

async function seedBenefitsData() {
  const existingEnrollment = await db.select().from(benefitsEnrollmentData).limit(1);
  if (existingEnrollment.length > 0) return;

  await db.insert(benefitsEnrollmentData).values([
    { id: "bed-001", countyFips: "48453", countyName: "Travis County", zipCode: "78702", benefitType: "SNAP", eligiblePopulation: 12400, enrolledPopulation: 8680, participationRate: 0.70, participationGap: 0.30, renewalsPending: 340, renewalsAtRisk: 85, barrierIndex: 3.2, limitedEnglishPct: 0.18, noVehiclePct: 0.12, noBroadbandPct: 0.08, povertyRate: 0.22, totalPopulation: 54000, medianIncome: 42000, dataYear: 2024 },
    { id: "bed-002", countyFips: "48453", countyName: "Travis County", zipCode: "78741", benefitType: "Medicaid", eligiblePopulation: 18200, enrolledPopulation: 14560, participationRate: 0.80, participationGap: 0.20, renewalsPending: 520, renewalsAtRisk: 130, barrierIndex: 2.8, limitedEnglishPct: 0.22, noVehiclePct: 0.09, noBroadbandPct: 0.06, povertyRate: 0.19, totalPopulation: 67000, medianIncome: 45000, dataYear: 2024 },
    { id: "bed-003", countyFips: "48453", countyName: "Travis County", zipCode: "78745", benefitType: "CHIP", eligiblePopulation: 4800, enrolledPopulation: 3360, participationRate: 0.70, participationGap: 0.30, renewalsPending: 120, renewalsAtRisk: 45, barrierIndex: 2.5, limitedEnglishPct: 0.15, noVehiclePct: 0.07, noBroadbandPct: 0.05, povertyRate: 0.16, totalPopulation: 42000, medianIncome: 48000, dataYear: 2024 },
    { id: "bed-004", countyFips: "48491", countyName: "Williamson County", zipCode: "78664", benefitType: "SNAP", eligiblePopulation: 6200, enrolledPopulation: 3720, participationRate: 0.60, participationGap: 0.40, renewalsPending: 180, renewalsAtRisk: 60, barrierIndex: 3.8, limitedEnglishPct: 0.14, noVehiclePct: 0.15, noBroadbandPct: 0.10, povertyRate: 0.14, totalPopulation: 38000, medianIncome: 52000, dataYear: 2024 },
  ]);

  await db.insert(benefitsPartners).values([
    { id: "bp-001", name: "Foundation Communities", organizationType: "nonprofit", county: "Travis County", servicesOffered: ["benefits-enrollment", "tax-prep", "housing-counseling"], benefitTypes: ["SNAP", "Medicaid", "CHIP"], languages: ["English", "Spanish"], contactName: "Jessica Watts", contactEmail: "jwatts@foundcom.org", address: "3036 S First St, Austin, TX 78704", capacity: 200, currentCaseload: 145, isActive: true },
    { id: "bp-002", name: "Catholic Charities of Central TX", organizationType: "nonprofit", county: "Travis County", servicesOffered: ["immigration-services", "benefits-enrollment", "food-assistance"], benefitTypes: ["SNAP", "Medicaid", "WIC"], languages: ["English", "Spanish", "Vietnamese", "Arabic"], contactName: "Maria Hernandez", contactEmail: "mhernandez@ccctx.org", address: "1625 Rutherford Ln, Austin, TX 78754", capacity: 150, currentCaseload: 120, isActive: true },
    { id: "bp-003", name: "Lone Star Legal Aid", organizationType: "legal-aid", county: "Travis County", servicesOffered: ["legal-assistance", "benefits-appeals", "disability-claims"], benefitTypes: ["Medicaid", "SSI", "SSDI"], languages: ["English", "Spanish"], contactName: "Tom Reynolds", contactEmail: "treynolds@lonestarlegal.org", address: "816 Congress Ave #1600, Austin, TX 78701", capacity: 80, currentCaseload: 62, isActive: true },
  ]);

  await db.insert(benefitsChwNetwork).values([
    { id: "chw-001", name: "Rosa Martinez", role: "Community Health Worker", county: "Travis County", assignedZips: ["78702", "78741", "78744"], languages: ["English", "Spanish"], certifications: ["DSHS CHW Certification", "Benefits Navigation"], affiliatedOrg: "Foundation Communities", contactEmail: "rmartinez@foundcom.org", capacity: 25, activeCases: 18, specializations: ["SNAP enrollment", "Medicaid renewals"], trustLevel: "high", isActive: true },
    { id: "chw-002", name: "Thanh Le", role: "Community Health Worker", county: "Travis County", assignedZips: ["78758", "78753"], languages: ["English", "Vietnamese"], certifications: ["DSHS CHW Certification", "Cultural Mediator"], affiliatedOrg: "Catholic Charities of Central TX", contactEmail: "tle@ccctx.org", capacity: 20, activeCases: 14, specializations: ["Refugee benefits", "Language access"], trustLevel: "established", isActive: true },
    { id: "chw-003", name: "Deanna Brooks", role: "Peer Navigator", county: "Travis County", assignedZips: ["78723", "78721", "78702"], languages: ["English"], certifications: ["DSHS CHW Certification", "Peer Support"], affiliatedOrg: "ThriveUp Academy", contactEmail: "dbrooks@thriveup.org", capacity: 20, activeCases: 12, specializations: ["Reentry benefits", "Youth transitions"], trustLevel: "established", isActive: true },
  ]);

  console.log("[Seed] Benefits intelligence data seeded");
}

async function seedPreventionFramework() {
  const existing = await db.select().from(environmentalStrategies).limit(1);
  if (existing.length > 0) return;

  await db.insert(environmentalStrategies).values([
    { id: "es-001", name: "Retailer Education & Compliance Checks", category: "access-reduction", description: "Partner with local retailers to ensure compliance with tobacco and alcohol age-verification laws. Conduct semi-annual compliance checks and provide merchant education materials.", responsibleSectors: ["Business Community", "Law Enforcement"], targetSubstances: ["Alcohol", "Tobacco"], expectedOutcomes: "Increase retailer compliance rate from 72% to 90% within 12 months", implementationTimeline: "Ongoing quarterly", status: "active", implementationStage: "implementation", coalitionId: "coal-001" },
    { id: "es-002", name: "Youth Media Literacy Campaign", category: "education", description: "Develop and deliver media literacy curriculum to help youth critically analyze substance use marketing and social media influence. Partner with schools for classroom delivery.", responsibleSectors: ["Schools", "Media", "Youth"], targetSubstances: ["Alcohol", "Marijuana", "Vaping"], expectedOutcomes: "Increase youth critical thinking about substance marketing by 25%", implementationTimeline: "School year 2025-2026", status: "planned", implementationStage: "preparation", coalitionId: "coal-001" },
    { id: "es-003", name: "Prescription Drug Take-Back Program", category: "access-reduction", description: "Organize quarterly community prescription drug take-back events in partnership with law enforcement and pharmacies. Install permanent collection boxes at participating pharmacies.", responsibleSectors: ["Healthcare Professionals", "Law Enforcement", "Business Community"], targetSubstances: ["Prescription Drugs"], expectedOutcomes: "Collect 500+ lbs of unused medications annually and reduce household medication access by youth", implementationTimeline: "Quarterly events", status: "active", implementationStage: "implementation", coalitionId: "coal-001" },
  ]);

  await db.insert(dfcCoreMeasures).values([
    { id: "dcm-001", surveyPeriod: "Fall 2024", periodType: "baseline", ageGroup: "12-14", alcoholPast30: 8.2, marijuanaPast30: 5.1, tobaccoPast30: 3.8, prescriptionPast30: 1.2, perceptionOfRiskAlcohol: 62.0, perceptionOfRiskMarijuana: 48.5, parentalDisapproval: 88.0, peerDisapproval: 52.0, averageAgeFirstUse: 13.2, perceivedAvailability: 35.0, sampleSize: 420, notes: "Baseline survey administered across 3 middle schools" },
    { id: "dcm-002", surveyPeriod: "Fall 2024", periodType: "baseline", ageGroup: "15-17", alcoholPast30: 22.5, marijuanaPast30: 18.3, tobaccoPast30: 12.1, prescriptionPast30: 4.5, perceptionOfRiskAlcohol: 45.0, perceptionOfRiskMarijuana: 38.2, parentalDisapproval: 75.0, peerDisapproval: 35.0, averageAgeFirstUse: 14.8, perceivedAvailability: 58.0, sampleSize: 380, notes: "Baseline survey administered across 2 high schools" },
  ]);

  await db.insert(communityReadinessAssessments).values([
    { id: "cra-001", assessmentDate: "2024-11-15", communityEfforts: 5, communityKnowledgeOfEfforts: 4, leadership: 6, communityclimate: 4, communityKnowledgeOfIssue: 5, resources: 4, overallReadiness: 4.7, readinessStage: "Preplanning", recommendations: ["Increase public awareness of coalition efforts", "Engage faith community leaders as champions", "Develop community education materials in Spanish"], assessorId: "dr-raj-patel" },
  ]);

  await db.insert(mediaCampaigns).values([
    { id: "mc-001", title: "Know the Risks: Youth Vaping Awareness", campaignType: "social-media", targetAudience: "Youth ages 13-18 and parents", messagingGuidance: "Use youth voice and peer-to-peer messaging. Avoid scare tactics. Focus on facts and decision-making skills.", status: "active", startDate: "2025-02-01", endDate: "2025-05-31", targetSubstance: "Vaping/E-cigarettes", objectives: "Reach 10,000 youth through social media; increase perception of harm by 15%", createdBy: "alexis-rivera" },
  ]);

  await db.insert(stakeholderCommitments).values([
    { id: "sc-001", sectorName: "Business Community", sectorNumber: 3, commitmentType: "in-kind", description: "Provide meeting space and refreshments for quarterly coalition meetings", contactName: "David Torres", contactEmail: "dtorres@heb.com", status: "active" },
    { id: "sc-002", sectorName: "Healthcare Professionals", sectorNumber: 10, commitmentType: "data-sharing", description: "Share anonymized community health data for coalition needs assessment", contactName: "Dr. Angela Morales", contactEmail: "amorales@traviscounty.gov", status: "active" },
    { id: "sc-003", sectorName: "Schools", sectorNumber: 5, commitmentType: "program-delivery", description: "Allocate classroom time for prevention curriculum delivery in 5 campuses", contactName: "Dr. Lisa Park", contactEmail: "lpark@austinisd.org", status: "active" },
    { id: "sc-004", sectorName: "Law Enforcement", sectorNumber: 7, commitmentType: "program-support", description: "Conduct retailer compliance checks and participate in take-back events", contactName: "Officer Daniels", contactEmail: "m.daniels@austintexas.gov", status: "active" },
    { id: "sc-005", sectorName: "Media", sectorNumber: 4, commitmentType: "communications", description: "Pro bono social media campaign design and youth focus group facilitation", contactName: "Alexis Rivera", contactEmail: "arivera@communityvoice.org", status: "active" },
  ]);

  console.log("[Seed] Prevention framework data seeded");
}

async function seedFacilitatorData() {
  const existing = await db.select().from(facilitatorProfiles).limit(1);
  if (existing.length > 0) return;

  const facilitators = [
    { id: "fac-001", visitorId: "sarah-chen", name: "Sarah Chen", certifications: [{ name: "LifeSkills Training Facilitator", body: "Botvin LifeSkills", earned: "2024-03" }], specializations: ["Youth prevention", "LifeSkills Training"], clearanceLevel: "background-cleared", trainingCompleted: [{ name: "LST Facilitator Training", completedDate: "2024-03-15" }, { name: "Trauma-Informed Facilitation", completedDate: "2024-06-20" }], status: "active" },
    { id: "fac-002", visitorId: "james-patterson", name: "James Patterson", certifications: [{ name: "Workforce Development Specialist", body: "NAWDP", earned: "2023-09" }], specializations: ["Workforce readiness", "Youth leadership"], clearanceLevel: "background-cleared", trainingCompleted: [{ name: "YouthBuild Model Training", completedDate: "2024-06-01" }, { name: "Motivational Interviewing", completedDate: "2024-08-15" }], status: "active" },
    { id: "fac-003", visitorId: "rosa-hernandez", name: "Rosa Hernandez", certifications: [{ name: "Certified Career Services Provider", body: "NCDA", earned: "2024-01" }], specializations: ["Career coaching", "Bilingual facilitation"], clearanceLevel: "background-cleared", trainingCompleted: [{ name: "Career Development Facilitator Training", completedDate: "2024-01-20" }, { name: "Cultural Responsiveness", completedDate: "2024-04-10" }], status: "active" },
  ];

  await db.insert(facilitatorProfiles).values(facilitators);

  await db.insert(sessionPlans).values([
    { id: "sp-f-001", facilitatorId: "fac-001", sessionDate: "2025-02-10", duration: 60, location: "ThriveUp Main Campus - Room A", targetAudience: "Prevention Champions Cohort (ages 14-18)", materialsNeeded: ["LifeSkills workbooks", "Whiteboard markers", "Scenario cards"], learningObjectives: ["Identify 3 refusal strategies", "Practice assertive communication"], assessmentMethod: "Role-play observation", status: "completed", attendeeCount: 14 },
    { id: "sp-f-002", facilitatorId: "fac-002", sessionDate: "2025-02-14", duration: 120, location: "ThriveUp Workshop Bay", targetAudience: "Spring YouthBuild Cohort (ages 16-24)", materialsNeeded: ["Safety equipment", "Tool kits", "Project blueprints"], learningObjectives: ["Demonstrate proper tool safety", "Read basic construction blueprints"], assessmentMethod: "Practical demonstration", status: "completed", attendeeCount: 22 },
    { id: "sp-f-003", facilitatorId: "fac-003", sessionDate: "2025-02-18", duration: 90, location: "Virtual - Zoom", targetAudience: "Job-Ready Participants", materialsNeeded: ["Resume templates", "Interview question bank", "Dress code guide"], learningObjectives: ["Update resume with action verbs", "Practice STAR interview responses"], assessmentMethod: "Mock interview scoring rubric", status: "completed", attendeeCount: 8 },
    { id: "sp-f-004", facilitatorId: "fac-001", sessionDate: "2025-03-10", duration: 60, location: "ThriveUp Main Campus - Room A", targetAudience: "Prevention Champions Cohort", materialsNeeded: ["Media analysis worksheets", "Ad examples", "Projector"], learningObjectives: ["Analyze advertising tactics targeting youth", "Create counter-messaging content"], assessmentMethod: "Written analysis worksheet", status: "scheduled" },
  ]);

  await db.insert(curriculumDeliveryLogs).values([
    { id: "cdl-001", sessionPlanId: "sp-f-001", facilitatorId: "fac-001", actualDate: "2025-02-10", actualDuration: 65, actualAttendeeCount: 14, fidelityScore: 4, adaptationsNoted: "Extended role-play activity by 10 minutes due to high engagement", participantFeedback: "Students reported high confidence in refusal skills after session", followUpNeeded: false, dosageMinutes: 65 },
    { id: "cdl-002", sessionPlanId: "sp-f-002", facilitatorId: "fac-002", actualDate: "2025-02-14", actualDuration: 130, actualAttendeeCount: 20, fidelityScore: 5, adaptationsNoted: "Two participants arrived late; provided catch-up materials. Added extra safety drill.", challengesFaced: "One power tool malfunctioned; used backup equipment", participantFeedback: "Participants showed strong engagement with hands-on blueprint reading", followUpNeeded: false, dosageMinutes: 130 },
    { id: "cdl-003", sessionPlanId: "sp-f-003", facilitatorId: "fac-003", actualDate: "2025-02-18", actualDuration: 85, actualAttendeeCount: 7, fidelityScore: 4, adaptationsNoted: "One participant needed Spanish-language resume template", challengesFaced: "Minor connectivity issues for 2 participants on mobile", participantFeedback: "All participants completed updated resumes; 3 reported feeling interview-ready", followUpNeeded: true, dosageMinutes: 85 },
  ]);

  await db.insert(outcomeTracking).values([
    { id: "ot-001", userId: "part-001", cohortId: "pilot-001", category: "employment", metricName: "Job Placement", metricValue: "placed", baseline: "unemployed", target: "full-time employment", notes: "Placed at Goodwill Central Texas", source: "workforce-team" },
    { id: "ot-002", userId: "part-002", cohortId: "pilot-001", category: "education", metricName: "College Enrollment", metricValue: "enrolled", baseline: "no-postsecondary", target: "enrolled-in-postsecondary", notes: "Accepted to ACC for Fall 2025", source: "education-navigator" },
    { id: "ot-003", userId: "part-003", cohortId: "pilot-001", category: "credential", metricName: "Industry Certification", metricValue: "in-progress", baseline: "no-credentials", target: "osha-10-certification", notes: "Expected completion March 2025", source: "workforce-team" },
    { id: "ot-004", userId: "part-004", cohortId: "pilot-001", category: "employment", metricName: "Wage Growth", metricValue: "$15.00/hr", baseline: "$0/hr", target: "$16.00/hr", notes: "Started at H-E-B January 2025", source: "workforce-team" },
    { id: "ot-005", userId: "part-005", cohortId: "pilot-001", category: "housing", metricName: "Housing Stability", metricValue: "transitional", baseline: "homeless", target: "stable-housing", notes: "Placed in transitional housing program", source: "case-manager" },
    { id: "ot-006", userId: "pilot-youth-001", cohortId: "pilot-002", category: "prevention", metricName: "Knowledge Assessment Score", metricValue: "82%", baseline: "65%", target: "85%", notes: "Post-test score after LifeSkills module 1-3", source: "facilitator" },
  ]);

  console.log("[Seed] Facilitator and outcome tracking data seeded");
}
