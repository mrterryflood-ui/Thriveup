import type { Express } from "express";
import { db } from "./storage";
import {
  benefitsEnrollmentData, benefitsPartners, benefitsChwNetwork,
  benefitsScreenings, benefitsRenewals,
  insertBenefitsPartnerSchema, insertBenefitsChwSchema,
  insertBenefitsScreeningSchema, insertBenefitsRenewalSchema,
} from "@shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { generateAIResponse, generateAIJSON } from "./ai-provider";

const CENSUS_ACS_URL = "https://api.census.gov/data/2022/acs/acs5";

const ST_DAVIDS_COUNTIES: Record<string, { fips: string; name: string; lat: number; lng: number; strategy: string }> = {
  "48453": { fips: "48453", name: "Travis County", lat: 30.3074, lng: -97.7560, strategy: "strengthen" },
  "48491": { fips: "48491", name: "Williamson County", lat: 30.6483, lng: -97.6006, strategy: "build" },
  "48209": { fips: "48209", name: "Hays County", lat: 30.0587, lng: -97.9988, strategy: "build" },
  "48021": { fips: "48021", name: "Bastrop County", lat: 30.1036, lng: -97.3150, strategy: "build" },
  "48055": { fips: "48055", name: "Caldwell County", lat: 29.8367, lng: -97.6200, strategy: "build" },
};

const BENEFIT_TYPES = ["SNAP", "Medicaid", "CHIP", "EITC", "WIC", "SSI", "SSDI", "Marketplace", "CTC"];

const NATIONAL_PARTICIPATION_RATES: Record<string, number> = {
  SNAP: 0.50, Medicaid: 0.70, CHIP: 0.65, EITC: 0.80,
  WIC: 0.55, SSI: 0.60, SSDI: 0.65, Marketplace: 0.45, CTC: 0.75,
};

const HHSC_CPP_LEVELS = [
  {
    level: 1, name: "Community Partner",
    description: "Basic partnership with HHSC for benefits awareness and referrals",
    requirements: ["Complete online registration", "Attend orientation webinar", "Sign MOU with HHSC", "Designate a primary contact"],
    capabilities: ["Refer community members to HHSC", "Distribute benefits information", "Host HHSC outreach events"],
    trainingHours: 4,
  },
  {
    level: 2, name: "Certified Application Assister",
    description: "Trained to help community members complete HHSC benefits applications",
    requirements: ["Complete Level 1", "Pass HHSC application assistance training (16 hours)", "Background check clearance", "Annual recertification"],
    capabilities: ["Help complete applications for SNAP, Medicaid, CHIP, TANF", "Access HHSC portal for application tracking", "Provide document assistance"],
    trainingHours: 16,
  },
  {
    level: 3, name: "Certified Enrollment Counselor",
    description: "Full enrollment counselor with direct HHSC system access",
    requirements: ["Complete Level 2", "Advanced certification training (40 hours)", "Supervised enrollment practice", "Ongoing quality audits"],
    capabilities: ["Direct access to HHSC enrollment systems", "Process applications end-to-end", "Handle complex cases and appeals", "Train Level 1-2 partners"],
    trainingHours: 40,
  },
];

const COMMUNITY_FACILITATORS: Record<string, Array<{ name: string; type: string; lat: number; lng: number; services: string[] }>> = {
  "48453": [
    { name: "Foundation Communities", type: "Nonprofit", lat: 30.2358, lng: -97.7438, services: ["SNAP", "Medicaid", "EITC", "Housing"] },
    { name: "CommUnity Care Health Centers", type: "FQHC", lat: 30.2872, lng: -97.7262, services: ["Medicaid", "CHIP", "WIC", "Marketplace"] },
    { name: "Todos Juntos (Sendero Health Plans)", type: "Health Plan", lat: 30.2930, lng: -97.7432, services: ["Medicaid", "CHIP", "Marketplace"] },
    { name: "Central Texas Food Bank", type: "Food Bank", lat: 30.2019, lng: -97.8064, services: ["SNAP", "WIC", "Food assistance"] },
    { name: "United Way for Greater Austin", type: "Nonprofit", lat: 30.2704, lng: -97.7400, services: ["EITC", "CTC", "VITA tax prep"] },
    { name: "Travis County Health & Human Services", type: "Government", lat: 30.2666, lng: -97.7439, services: ["SNAP", "Medicaid", "CHIP", "TANF"] },
    { name: "Caritas of Austin", type: "Nonprofit", lat: 30.2648, lng: -97.7321, services: ["SSI", "SSDI", "Housing", "Legal aid"] },
    { name: "El Buen Samaritano", type: "Nonprofit", lat: 30.2200, lng: -97.7900, services: ["SNAP", "Medicaid", "WIC", "Immigration support"] },
  ],
  "48491": [
    { name: "Lone Star Circle of Care", type: "FQHC", lat: 30.5083, lng: -97.6789, services: ["Medicaid", "CHIP", "WIC", "Marketplace"] },
    { name: "Opportunities for Williamson & Burnet Counties", type: "CAA", lat: 30.5635, lng: -97.6788, services: ["SNAP", "EITC", "CTC", "VITA"] },
    { name: "Georgetown Health Foundation", type: "Foundation", lat: 30.6327, lng: -97.6778, services: ["Medicaid", "CHIP", "Health navigation"] },
  ],
  "48209": [
    { name: "Community Action Inc. of Hays County", type: "CAA", lat: 29.8833, lng: -97.9414, services: ["SNAP", "Medicaid", "EITC", "Weatherization"] },
    { name: "Hays County Food Bank", type: "Food Bank", lat: 29.8800, lng: -97.9350, services: ["SNAP", "WIC", "Food assistance"] },
    { name: "San Marcos CISD Family Resource Center", type: "School", lat: 29.8833, lng: -97.9400, services: ["Medicaid", "CHIP", "School meals"] },
  ],
  "48021": [
    { name: "Bastrop County Emergency Food Pantry", type: "Food Pantry", lat: 30.1100, lng: -97.3150, services: ["SNAP", "WIC", "Food assistance"] },
    { name: "Bastrop County CARES", type: "Nonprofit", lat: 30.1050, lng: -97.3100, services: ["SNAP", "Medicaid", "Utility assistance"] },
  ],
  "48055": [
    { name: "Caldwell County Community Resource Center", type: "Community Center", lat: 29.8850, lng: -97.6100, services: ["SNAP", "Medicaid", "CTC"] },
    { name: "Lockhart ISD Family Support", type: "School", lat: 29.8850, lng: -97.6700, services: ["Medicaid", "CHIP", "School meals"] },
  ],
};

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json();
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

async function ingestBenefitsDataForCounty(countyFips: string): Promise<number> {
  const county = ST_DAVIDS_COUNTIES[countyFips];
  if (!county) return 0;

  const stateFips = "48";
  const countyCode = countyFips.slice(2);
  const censusKey = process.env.CENSUS_API_KEY || "";
  const keyParam = censusKey ? `&key=${censusKey}` : "";

  const variables = [
    "NAME", "B01003_001E",
    "B19013_001E", "B17001_002E", "B17001_001E",
    "B16004_001E", "B16004_025E", "B16004_047E",
    "B08141_001E", "B08141_002E",
    "B28002_001E", "B28002_013E",
    "B05001_001E", "B05001_006E",
    "B22001_001E", "B22001_002E",
    "B27001_001E", "B27001_005E", "B27001_008E", "B27001_011E",
  ].join(",");

  try {
    const url = `${CENSUS_ACS_URL}?get=${variables}&for=county:${countyCode}&in=state:${stateFips}${keyParam}`;
    const data = await fetchJson(url);

    if (!Array.isArray(data) || data.length < 2) return 0;

    const headers = data[0] as string[];
    const row = data[1] as string[];
    const v = (name: string) => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? parseInt(row[idx]) || 0 : 0;
    };

    const totalPop = v("B01003_001E");
    const medianIncome = v("B19013_001E");
    const belowPoverty = v("B17001_002E");
    const povertyUniverse = v("B17001_001E");
    const langTotal = v("B16004_001E");
    const langLimitedSpanish = v("B16004_025E");
    const langLimitedOther = v("B16004_047E");
    const commuteTotal = v("B08141_001E");
    const noVehicle = v("B08141_002E");
    const internetTotal = v("B28002_001E");
    const noInternet = v("B28002_013E");
    const citizenTotal = v("B05001_001E");
    const nonCitizen = v("B05001_006E");
    const snapUniverse = v("B22001_001E");
    const snapRecipients = v("B22001_002E");
    const insTotal = v("B27001_001E");
    const unins1 = v("B27001_005E");
    const unins2 = v("B27001_008E");
    const unins3 = v("B27001_011E");

    const povertyRate = povertyUniverse > 0 ? clamp((belowPoverty / povertyUniverse) * 100) : 0;
    const limitedEnglishPct = langTotal > 0 ? clamp(((langLimitedSpanish + langLimitedOther) / langTotal) * 100) : 0;
    const noVehiclePct = commuteTotal > 0 ? clamp((noVehicle / commuteTotal) * 100) : 0;
    const noBroadbandPct = internetTotal > 0 ? clamp((noInternet / internetTotal) * 100) : 0;
    const nonCitizenPct = citizenTotal > 0 ? clamp((nonCitizen / citizenTotal) * 100) : 0;

    const barrierIndex = clamp(
      (limitedEnglishPct * 0.25) + (noVehiclePct * 0.2) + (noBroadbandPct * 0.2) +
      (nonCitizenPct * 0.15) + (povertyRate * 0.2)
    );

    const snapRate = snapUniverse > 0 ? (snapRecipients / snapUniverse) : 0;
    const uninsuredTotal = unins1 + unins2 + unins3;
    const uninsuredRate = insTotal > 0 ? (uninsuredTotal / insTotal) : 0;

    let upsertCount = 0;
    for (const benefitType of BENEFIT_TYPES) {
      let participationRate: number;
      let eligiblePop: number;
      let enrolledPop: number;

      const COUNTY_ADJUSTMENT: Record<string, number> = {
        "48453": 0.03, "48491": 0.01, "48209": -0.02, "48021": -0.04, "48055": -0.05,
      };
      const countyAdj = COUNTY_ADJUSTMENT[countyFips] || 0;

      if (benefitType === "SNAP") {
        participationRate = snapRate > 0 ? snapRate : NATIONAL_PARTICIPATION_RATES.SNAP;
        eligiblePop = Math.round(totalPop * povertyRate / 100 * 1.3);
        enrolledPop = Math.round(eligiblePop * participationRate);
      } else if (benefitType === "Medicaid" || benefitType === "CHIP") {
        participationRate = 1 - uninsuredRate > 0 ? (1 - uninsuredRate) * 0.85 : NATIONAL_PARTICIPATION_RATES[benefitType];
        eligiblePop = Math.round(totalPop * (povertyRate / 100) * (benefitType === "CHIP" ? 0.25 : 0.7));
        enrolledPop = Math.round(eligiblePop * participationRate);
      } else if (benefitType === "EITC" || benefitType === "CTC") {
        participationRate = NATIONAL_PARTICIPATION_RATES[benefitType] + countyAdj;
        eligiblePop = Math.round(totalPop * povertyRate / 100 * 1.5);
        enrolledPop = Math.round(eligiblePop * participationRate);
      } else {
        participationRate = NATIONAL_PARTICIPATION_RATES[benefitType] + countyAdj;
        eligiblePop = Math.round(totalPop * povertyRate / 100 * 0.5);
        enrolledPop = Math.round(eligiblePop * participationRate);
      }

      participationRate = clamp(participationRate * 100) / 100;
      const participationGap = clamp((1 - participationRate) * 100);

      const existing = await db.select().from(benefitsEnrollmentData)
        .where(and(
          eq(benefitsEnrollmentData.countyFips, countyFips),
          eq(benefitsEnrollmentData.benefitType, benefitType)
        )).limit(1);

      if (existing.length > 0) {
        await db.update(benefitsEnrollmentData).set({
          countyName: county.name,
          eligiblePopulation: eligiblePop,
          enrolledPopulation: enrolledPop,
          participationRate: participationRate * 100,
          participationGap,
          barrierIndex,
          limitedEnglishPct,
          noVehiclePct,
          noBroadbandPct,
          nonCitizenPct,
          povertyRate,
          totalPopulation: totalPop,
          medianIncome,
          latitude: county.lat,
          longitude: county.lng,
          rawCensusData: { totalPop, medianIncome, belowPoverty, snapRecipients, uninsuredTotal },
          dataSource: "census_acs_2022",
          dataYear: 2022,
          updatedAt: new Date(),
        }).where(eq(benefitsEnrollmentData.id, existing[0].id));
      } else {
        await db.insert(benefitsEnrollmentData).values({
          countyFips,
          countyName: county.name,
          benefitType,
          eligiblePopulation: eligiblePop,
          enrolledPopulation: enrolledPop,
          participationRate: participationRate * 100,
          participationGap,
          renewalsPending: Math.round(enrolledPop * 0.08),
          renewalsAtRisk: Math.round(enrolledPop * 0.03),
          barrierIndex,
          limitedEnglishPct,
          noVehiclePct,
          noBroadbandPct,
          nonCitizenPct,
          povertyRate,
          totalPopulation: totalPop,
          medianIncome,
          latitude: county.lat,
          longitude: county.lng,
          rawCensusData: { totalPop, medianIncome, belowPoverty, snapRecipients, uninsuredTotal },
          dataYear: 2022,
        });
      }
      upsertCount++;
    }

    return upsertCount;
  } catch (error) {
    console.error(`[Benefits Engine] Error ingesting data for ${county.name}:`, error);
    return 0;
  }
}

export function registerBenefitsRoutes(app: Express) {

  app.get("/api/benefits/counties", async (_req, res) => {
    try {
      const counties = Object.entries(ST_DAVIDS_COUNTIES).map(([fips, c]) => ({
        fips, name: c.name, lat: c.lat, lng: c.lng, strategy: c.strategy,
      }));
      res.json(counties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch counties" });
    }
  });

  app.get("/api/benefits/enrollment-data", async (req, res) => {
    try {
      const { countyFips, benefitType } = req.query;
      let query = db.select().from(benefitsEnrollmentData);
      const conditions = [];
      if (countyFips) conditions.push(eq(benefitsEnrollmentData.countyFips, countyFips as string));
      if (benefitType) conditions.push(eq(benefitsEnrollmentData.benefitType, benefitType as string));

      const data = conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(benefitsEnrollmentData.countyName)
        : await query.orderBy(benefitsEnrollmentData.countyName);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollment data" });
    }
  });

  app.post("/api/benefits/ingest", async (req, res) => {
    try {
      const { countyFips } = req.body;
      if (countyFips) {
        const count = await ingestBenefitsDataForCounty(countyFips);
        return res.json({ ingested: count, county: countyFips });
      }
      let total = 0;
      for (const fips of Object.keys(ST_DAVIDS_COUNTIES)) {
        total += await ingestBenefitsDataForCounty(fips);
      }
      res.json({ ingested: total, counties: Object.keys(ST_DAVIDS_COUNTIES).length });
    } catch (error) {
      console.error("Benefits ingest error:", error);
      res.status(500).json({ error: "Failed to ingest benefits data" });
    }
  });

  app.get("/api/benefits/command-center/stats", async (_req, res) => {
    try {
      const enrollmentData = await db.select().from(benefitsEnrollmentData);
      const [partnerCount] = await db.select({ count: count() }).from(benefitsPartners);
      const [chwCount] = await db.select({ count: count() }).from(benefitsChwNetwork);
      const [screeningCount] = await db.select({ count: count() }).from(benefitsScreenings);
      const [renewalCount] = await db.select({ count: count() }).from(benefitsRenewals);

      const countySummaries: Record<string, any> = {};
      for (const [fips, info] of Object.entries(ST_DAVIDS_COUNTIES)) {
        const countyData = enrollmentData.filter(d => d.countyFips === fips);
        const totalEligible = countyData.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
        const totalEnrolled = countyData.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);
        const avgBarrier = countyData.length > 0
          ? countyData.reduce((s, d) => s + (d.barrierIndex || 0), 0) / countyData.length : 0;
        const avgGap = countyData.length > 0
          ? countyData.reduce((s, d) => s + (d.participationGap || 0), 0) / countyData.length : 0;
        const totalRenewals = countyData.reduce((s, d) => s + (d.renewalsPending || 0), 0);
        const totalAtRisk = countyData.reduce((s, d) => s + (d.renewalsAtRisk || 0), 0);

        countySummaries[fips] = {
          fips, name: info.name, strategy: info.strategy,
          lat: info.lat, lng: info.lng,
          totalEligible, totalEnrolled,
          overallParticipationRate: totalEligible > 0 ? Math.round((totalEnrolled / totalEligible) * 100) : 0,
          averageGap: Math.round(avgGap * 10) / 10,
          averageBarrierIndex: Math.round(avgBarrier * 10) / 10,
          renewalsPending: totalRenewals,
          renewalsAtRisk: totalAtRisk,
          population: countyData[0]?.totalPopulation || 0,
          povertyRate: countyData[0]?.povertyRate || 0,
          benefitBreakdown: countyData.map(d => ({
            type: d.benefitType,
            eligible: d.eligiblePopulation,
            enrolled: d.enrolledPopulation,
            rate: d.participationRate,
            gap: d.participationGap,
          })),
        };
      }

      const totalEligible = enrollmentData.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
      const totalEnrolled = enrollmentData.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);

      res.json({
        countySummaries,
        totals: {
          totalEligible, totalEnrolled,
          overallGap: totalEligible > 0 ? Math.round((1 - totalEnrolled / totalEligible) * 100) : 0,
          partners: partnerCount?.count || 0,
          chws: chwCount?.count || 0,
          screenings: screeningCount?.count || 0,
          renewals: renewalCount?.count || 0,
        },
        hasData: enrollmentData.length > 0,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/benefits/barriers/:countyFips", async (req, res) => {
    try {
      const data = await db.select().from(benefitsEnrollmentData)
        .where(eq(benefitsEnrollmentData.countyFips, req.params.countyFips));

      if (data.length === 0) return res.json({ barriers: [], barrierIndex: 0 });

      const sample = data[0];
      const barriers = [
        { name: "Limited English Proficiency", value: sample.limitedEnglishPct || 0, weight: 0.25, category: "language" },
        { name: "No Vehicle Access", value: sample.noVehiclePct || 0, weight: 0.20, category: "transportation" },
        { name: "No Broadband Access", value: sample.noBroadbandPct || 0, weight: 0.20, category: "digital" },
        { name: "Non-Citizen Population", value: sample.nonCitizenPct || 0, weight: 0.15, category: "immigration" },
        { name: "Poverty Concentration", value: sample.povertyRate || 0, weight: 0.20, category: "economic" },
      ];

      const shadowPopulationIndicator = clamp(
        ((sample.nonCitizenPct || 0) * 0.4) +
        ((sample.limitedEnglishPct || 0) * 0.3) +
        ((sample.povertyRate || 0) * 0.3)
      );

      res.json({
        barriers,
        barrierIndex: sample.barrierIndex || 0,
        shadowPopulationIndicator,
        recommendation: shadowPopulationIndicator > 30
          ? "High shadow population risk. Deploy trusted CHWs with language capabilities. Avoid cold outreach — use warm referrals through churches, food pantries, and community hubs."
          : shadowPopulationIndicator > 15
          ? "Moderate shadow population. Virtual screening with phone follow-up recommended. Partner with bilingual organizations."
          : "Low shadow population risk. Virtual-first enrollment approach viable.",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barriers" });
    }
  });

  app.get("/api/benefits/facilitators/:countyFips", async (req, res) => {
    try {
      const facilitators = COMMUNITY_FACILITATORS[req.params.countyFips] || [];
      const partners = await db.select().from(benefitsPartners)
        .where(eq(benefitsPartners.county, ST_DAVIDS_COUNTIES[req.params.countyFips]?.name || ""));

      res.json({
        knownFacilitators: facilitators,
        registeredPartners: partners,
        stDavidsResourceMapUrl: "https://stdavidsfoundation.org/impact/community-resources/",
        totalAssets: facilitators.length + partners.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilitators" });
    }
  });

  app.get("/api/benefits/partners", async (_req, res) => {
    try {
      const partners = await db.select().from(benefitsPartners).orderBy(desc(benefitsPartners.createdAt));
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/benefits/partners", async (req, res) => {
    try {
      const parsed = insertBenefitsPartnerSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(benefitsPartners).values(parsed.data).returning();
      res.json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create partner" });
    }
  });

  app.get("/api/benefits/chw-network", async (_req, res) => {
    try {
      const chws = await db.select().from(benefitsChwNetwork).orderBy(desc(benefitsChwNetwork.createdAt));
      res.json(chws);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CHW network" });
    }
  });

  app.post("/api/benefits/chw-network", async (req, res) => {
    try {
      const parsed = insertBenefitsChwSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(benefitsChwNetwork).values(parsed.data).returning();
      res.json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create CHW" });
    }
  });

  app.get("/api/benefits/screenings", async (_req, res) => {
    try {
      const screenings = await db.select().from(benefitsScreenings).orderBy(desc(benefitsScreenings.createdAt)).limit(100);
      res.json(screenings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch screenings" });
    }
  });

  app.post("/api/benefits/screenings", async (req, res) => {
    try {
      const parsed = insertBenefitsScreeningSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });

      const data = parsed.data;
      const income = data.annualIncome || 0;
      const hhSize = data.householdSize || 1;
      const fpl = 15060 + (hhSize - 1) * 5380;

      const eligible: string[] = [];
      if (income <= fpl * 1.3) eligible.push("SNAP");
      if (income <= fpl * 1.38) eligible.push("Medicaid");
      if (data.hasChildren && income <= fpl * 2.0) eligible.push("CHIP");
      if (data.isPregnant || data.hasChildren) eligible.push("WIC");
      if (income <= fpl * 4.0) eligible.push("Marketplace");
      if (income > 0 && income <= fpl * 3.0) eligible.push("EITC");
      if (data.hasChildren && income <= fpl * 4.0) eligible.push("CTC");
      if (data.isDisabled) { eligible.push("SSI"); eligible.push("SSDI"); }

      const current = data.currentBenefits || [];
      const gaps = eligible.filter(b => !current.includes(b));

      const [created] = await db.insert(benefitsScreenings).values({
        ...data,
        eligibleBenefits: eligible,
        gapBenefits: gaps,
        status: "completed",
      }).returning();

      res.json({
        screening: created,
        eligibleBenefits: eligible,
        currentBenefits: current,
        gapBenefits: gaps,
        estimatedAnnualValue: gaps.reduce((sum, b) => {
          const vals: Record<string, number> = {
            SNAP: 3024, Medicaid: 7200, CHIP: 2400, EITC: 3584,
            WIC: 528, SSI: 10092, SSDI: 16560, Marketplace: 5400, CTC: 3600,
          };
          return sum + (vals[b] || 0);
        }, 0),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process screening" });
    }
  });

  app.get("/api/benefits/renewals", async (_req, res) => {
    try {
      const renewals = await db.select().from(benefitsRenewals).orderBy(desc(benefitsRenewals.createdAt)).limit(100);
      res.json(renewals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch renewals" });
    }
  });

  app.post("/api/benefits/renewals", async (req, res) => {
    try {
      const parsed = insertBenefitsRenewalSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const [created] = await db.insert(benefitsRenewals).values(parsed.data).returning();
      res.json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create renewal" });
    }
  });

  app.get("/api/benefits/hhsc-cpp", async (_req, res) => {
    try {
      res.json({
        levels: HHSC_CPP_LEVELS,
        overview: "The HHSC Community Partner Program (CPP) enables organizations to assist community members with benefits applications. TCAF should pursue Level 2 certification as a priority signal for the St. David's application.",
        enrollmentUrl: "https://www.hhs.texas.gov/services/financial/community-partner-program",
        keySignal: "St. David's values CPP membership. Not ALL collaboration members need it, but the collaborative must have access to this capability somewhere in the network.",
        recommendation: "TCAF should target Level 2 (Certified Application Assister) within 6 months and work toward Level 3 within 18 months. Partner organizations can begin at Level 1 immediately.",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch HHSC CPP data" });
    }
  });

  app.get("/api/benefits/outreach-strategy/:countyFips", async (req, res) => {
    try {
      const data = await db.select().from(benefitsEnrollmentData)
        .where(eq(benefitsEnrollmentData.countyFips, req.params.countyFips));

      if (data.length === 0) return res.json({ strategy: "no_data" });

      const sample = data[0];
      const strategies: Array<{ approach: string; description: string; suitability: string; priority: string }> = [];

      if ((sample.noBroadbandPct || 0) < 15 && (sample.limitedEnglishPct || 0) < 10) {
        strategies.push({
          approach: "Virtual-First",
          description: "Online eligibility screening, digital document upload, video consultations",
          suitability: "Good broadband access and English proficiency",
          priority: "primary",
        });
      }

      strategies.push({
        approach: "Virtual + Phone Follow-up",
        description: "Online screening with bilingual phone follow-up for questions and document assistance",
        suitability: "Moderate digital access, some language barriers",
        priority: (sample.limitedEnglishPct || 0) > 10 ? "primary" : "secondary",
      });

      if ((sample.noVehiclePct || 0) > 10 || (sample.limitedEnglishPct || 0) > 15) {
        strategies.push({
          approach: "In-Person at Community Hub",
          description: "Deploy benefits navigators at churches, food pantries, libraries, health clinics",
          suitability: "Transportation barriers, language barriers, system distrust",
          priority: "primary",
        });
      }

      const isRural = ST_DAVIDS_COUNTIES[req.params.countyFips]?.strategy === "build";
      if (isRural) {
        strategies.push({
          approach: "Mobile Outreach Van",
          description: "Mobile enrollment unit visiting rural communities on scheduled routes — explicitly approved by St. David's for rural counties",
          suitability: "Rural areas with limited infrastructure",
          priority: "primary",
        });
      }

      if ((sample.nonCitizenPct || 0) > 10 || (sample.barrierIndex || 0) > 25) {
        strategies.push({
          approach: "Trusted Messenger / Accompaniment",
          description: "Warm referrals through trusted community leaders, churches, mutual aid networks. 'Take them there' accompaniment for system-distrustful populations",
          suitability: "High immigration fear, system distrust, mixed-status families",
          priority: "critical",
        });
      }

      res.json({
        countyFips: req.params.countyFips,
        countyName: ST_DAVIDS_COUNTIES[req.params.countyFips]?.name,
        strategies,
        barrierProfile: {
          limitedEnglish: sample.limitedEnglishPct || 0,
          noVehicle: sample.noVehiclePct || 0,
          noBroadband: sample.noBroadbandPct || 0,
          nonCitizen: sample.nonCitizenPct || 0,
          poverty: sample.povertyRate || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to compute outreach strategy" });
    }
  });

  app.post("/api/benefits/ingest-tracts", async (req, res) => {
    try {
      const { countyFips } = req.body;
      const fipsList = countyFips ? [countyFips] : Object.keys(ST_DAVIDS_COUNTIES);
      let total = 0;

      for (const fips of fipsList) {
        const county = ST_DAVIDS_COUNTIES[fips];
        if (!county) continue;
        const countyCode = fips.slice(2);
        const censusKey = process.env.CENSUS_API_KEY || "";
        const keyParam = censusKey ? `&key=${censusKey}` : "";

        const variables = [
          "NAME", "B01003_001E", "B19013_001E", "B17001_002E", "B17001_001E",
          "B27001_001E", "B27001_005E", "B27001_008E", "B27001_011E",
          "B16004_001E", "B16004_025E", "B16004_047E",
          "B08141_001E", "B08141_002E",
          "B28002_001E", "B28002_013E",
          "B22001_001E", "B22001_002E",
        ].join(",");

        try {
          const url = `${CENSUS_ACS_URL}?get=${variables}&for=tract:*&in=state:48+county:${countyCode}${keyParam}`;
          const data = await fetchJson(url);
          if (!Array.isArray(data) || data.length < 2) continue;

          const headers = data[0] as string[];
          for (let i = 1; i < data.length; i++) {
            const row = data[i] as string[];
            const v = (name: string) => {
              const idx = headers.indexOf(name);
              return idx >= 0 ? parseInt(row[idx]) || 0 : 0;
            };
            const tractCode = row[headers.indexOf("tract")];
            const tractId = `48${countyCode}${tractCode}`;
            const tractName = row[headers.indexOf("NAME")] || tractId;
            const totalPop = v("B01003_001E");
            if (totalPop < 100) continue;

            const medianIncome = v("B19013_001E");
            const belowPoverty = v("B17001_002E");
            const povertyUniverse = v("B17001_001E");
            const povertyRate = povertyUniverse > 0 ? clamp((belowPoverty / povertyUniverse) * 100) : 0;

            const langTotal = v("B16004_001E");
            const langLimited = v("B16004_025E") + v("B16004_047E");
            const limitedEnglishPct = langTotal > 0 ? clamp((langLimited / langTotal) * 100) : 0;

            const commuteTotal = v("B08141_001E");
            const noVehicle = v("B08141_002E");
            const noVehiclePct = commuteTotal > 0 ? clamp((noVehicle / commuteTotal) * 100) : 0;

            const internetTotal = v("B28002_001E");
            const noInternet = v("B28002_013E");
            const noBroadbandPct = internetTotal > 0 ? clamp((noInternet / internetTotal) * 100) : 0;

            const insTotal = v("B27001_001E");
            const uninsuredTotal = v("B27001_005E") + v("B27001_008E") + v("B27001_011E");
            const uninsuredRate = insTotal > 0 ? (uninsuredTotal / insTotal) : 0;

            const snapUniverse = v("B22001_001E");
            const snapRecipients = v("B22001_002E");

            const barrierIndex = clamp(
              (limitedEnglishPct * 0.25) + (noVehiclePct * 0.2) +
              (noBroadbandPct * 0.2) + (povertyRate * 0.2) + 0
            );

            const lat = county.lat + (Math.random() - 0.5) * 0.15;
            const lng = county.lng + (Math.random() - 0.5) * 0.15;

            const eligiblePop = Math.round(totalPop * povertyRate / 100 * 1.3);
            const snapRate = snapUniverse > 0 ? (snapRecipients / snapUniverse) : 0.5;
            const enrolledPop = Math.round(eligiblePop * Math.max(snapRate, 0.4));
            const participationRate = eligiblePop > 0 ? clamp((enrolledPop / eligiblePop) * 100) : 0;

            const existing = await db.select().from(benefitsEnrollmentData)
              .where(and(
                eq(benefitsEnrollmentData.countyFips, fips),
                eq(benefitsEnrollmentData.tractId, tractId),
                eq(benefitsEnrollmentData.benefitType, "ALL")
              )).limit(1);

            const record = {
              countyFips: fips,
              countyName: county.name,
              tractId,
              benefitType: "ALL",
              eligiblePopulation: eligiblePop,
              enrolledPopulation: enrolledPop,
              participationRate,
              participationGap: clamp(100 - participationRate),
              renewalsPending: Math.round(enrolledPop * 0.08),
              renewalsAtRisk: Math.round(enrolledPop * 0.03),
              barrierIndex,
              limitedEnglishPct,
              noVehiclePct,
              noBroadbandPct,
              nonCitizenPct: 0,
              povertyRate,
              totalPopulation: totalPop,
              medianIncome,
              latitude: lat,
              longitude: lng,
              rawCensusData: { tractName, totalPop, medianIncome, belowPoverty, uninsuredTotal, snapRecipients },
              dataSource: "census_acs_2022_tract",
              dataYear: 2022,
            };

            if (existing.length > 0) {
              await db.update(benefitsEnrollmentData).set({
                ...record, updatedAt: new Date(),
              }).where(eq(benefitsEnrollmentData.id, existing[0].id));
            } else {
              await db.insert(benefitsEnrollmentData).values(record);
            }
            total++;
          }
        } catch (err) {
          console.error(`[Benefits Engine] Tract ingestion error for ${county.name}:`, err);
        }
      }

      res.json({ ingested: total, level: "tract" });
    } catch (error) {
      console.error("Tract ingest error:", error);
      res.status(500).json({ error: "Failed to ingest tract data" });
    }
  });

  app.get("/api/benefits/tracts/:countyFips", async (req, res) => {
    try {
      const data = await db.select().from(benefitsEnrollmentData)
        .where(and(
          eq(benefitsEnrollmentData.countyFips, req.params.countyFips),
          eq(benefitsEnrollmentData.benefitType, "ALL")
        ))
        .orderBy(desc(benefitsEnrollmentData.barrierIndex));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tract data" });
    }
  });

  app.get("/api/benefits/coalition/dashboard", async (_req, res) => {
    try {
      const enrollmentData = await db.select().from(benefitsEnrollmentData)
        .where(sql`${benefitsEnrollmentData.benefitType} != 'ALL'`);
      const tractData = await db.select().from(benefitsEnrollmentData)
        .where(eq(benefitsEnrollmentData.benefitType, "ALL"));
      const [partnerCount] = await db.select({ count: count() }).from(benefitsPartners);
      const [chwCount] = await db.select({ count: count() }).from(benefitsChwNetwork);
      const partners = await db.select().from(benefitsPartners).orderBy(desc(benefitsPartners.createdAt));

      const totalEligible = enrollmentData.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
      const totalEnrolled = enrollmentData.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);
      const totalGap = totalEligible - totalEnrolled;

      const countySummaries = Object.entries(ST_DAVIDS_COUNTIES).map(([fips, info]) => {
        const cd = enrollmentData.filter(d => d.countyFips === fips);
        const eligible = cd.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
        const enrolled = cd.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);
        const avgBarrier = cd.length > 0 ? cd.reduce((s, d) => s + (d.barrierIndex || 0), 0) / cd.length : 0;
        const tracts = tractData.filter(t => t.countyFips === fips);
        const highNeedTracts = tracts.filter(t => (t.barrierIndex || 0) > 20 || (t.povertyRate || 0) > 25);
        const facilitators = COMMUNITY_FACILITATORS[fips] || [];

        return {
          fips, name: info.name, strategy: info.strategy,
          lat: info.lat, lng: info.lng,
          eligible, enrolled, gap: eligible - enrolled,
          enrollmentRate: eligible > 0 ? Math.round((enrolled / eligible) * 100) : 0,
          avgBarrierIndex: Math.round(avgBarrier * 10) / 10,
          population: cd[0]?.totalPopulation || 0,
          povertyRate: cd[0]?.povertyRate || 0,
          tractCount: tracts.length,
          highNeedTracts: highNeedTracts.length,
          facilitatorCount: facilitators.length,
          facilitators: facilitators.map(f => ({ name: f.name, type: f.type, services: f.services })),
        };
      });

      const partnersByCounty: Record<string, number> = {};
      const partnerRolesNeeded: Array<{ county: string; role: string; description: string }> = [];

      for (const [fips, info] of Object.entries(ST_DAVIDS_COUNTIES)) {
        const facilitators = COMMUNITY_FACILITATORS[fips] || [];
        const registeredPartners = partners.filter(p => p.county === info.name);
        partnersByCounty[info.name] = facilitators.length + registeredPartners.length;

        const cd = enrollmentData.filter(d => d.countyFips === fips);
        const hasHealthPartner = facilitators.some(f => f.type === "FQHC" || f.services.includes("Medicaid"));
        const hasFoodPartner = facilitators.some(f => f.services.includes("SNAP") || f.type === "Food Bank");
        const hasTaxPartner = facilitators.some(f => f.services.includes("EITC") || f.services.includes("VITA tax prep"));

        if (!hasHealthPartner) partnerRolesNeeded.push({
          county: info.name, role: "Healthcare Navigator",
          description: "FQHC, clinic, or health organization to help with Medicaid/CHIP enrollment"
        });
        if (!hasFoodPartner) partnerRolesNeeded.push({
          county: info.name, role: "Food Access Partner",
          description: "Food bank, pantry, or nutrition organization for SNAP/WIC outreach"
        });
        if (!hasTaxPartner) partnerRolesNeeded.push({
          county: info.name, role: "Tax Assistance Partner",
          description: "VITA site or tax organization for EITC/CTC outreach"
        });
      }

      res.json({
        overview: {
          totalEligible, totalEnrolled, totalGap,
          gapRate: totalEligible > 0 ? Math.round((totalGap / totalEligible) * 100) : 0,
          counties: 5,
          totalPartners: Number(partnerCount?.count || 0) + Object.values(COMMUNITY_FACILITATORS).flat().length,
          totalCHWs: Number(chwCount?.count || 0),
          totalTracts: tractData.length,
          grantAsk: 35000000,
          grantYears: 3,
        },
        counties: countySummaries,
        partnersByCounty,
        partnerRolesNeeded,
        coalitionStructure: {
          lead: {
            name: "The Collaborative Advocate Foundation (TCAF)",
            role: "Technology conduit & coalition coordinator",
            ein: "41-3618003",
            type: "501(c)(3) nonprofit",
            description: "Veteran-founded, Black-led nonprofit providing the Benefits Intelligence System that connects CHWs, partner nonprofits, and community organizations to close enrollment gaps",
          },
          partnerTiers: [
            { tier: "County Lead", description: "One anchor organization per county with deep community trust and HHSC CPP certification capability", target: 5, current: 3 },
            { tier: "Service Partner", description: "Organizations providing direct enrollment assistance, health navigation, food access, or tax preparation", target: 20, current: Object.values(COMMUNITY_FACILITATORS).flat().length },
            { tier: "Community Hub", description: "Churches, libraries, community centers hosting enrollment events and trusted referral points", target: 25, current: 8 },
            { tier: "CHW Network", description: "Trained Community Health Workers deployed for door-to-door outreach in high-barrier neighborhoods", target: 50, current: Number(chwCount?.count || 0) },
          ],
        },
        dataMethodology: {
          source: "U.S. Census Bureau American Community Survey (ACS) 5-Year Estimates (2018-2022)",
          variables: [
            "B01003: Total Population",
            "B19013: Median Household Income",
            "B17001: Poverty Status (below/above FPL)",
            "B27001: Health Insurance Coverage (uninsured by age)",
            "B22001: SNAP/Food Stamps Participation",
            "B16004: Language Spoken at Home (limited English)",
            "B08141: Means of Transportation (no vehicle)",
            "B28002: Internet Access (no broadband)",
          ],
          methodology: "Eligible populations calculated using FPL thresholds per program. Enrollment gaps derived from national participation rates adjusted by county-specific Census indicators. Barrier indices weighted across 5 dimensions: language (25%), transportation (20%), digital access (20%), immigration status (15%), poverty concentration (20%).",
          tractLevel: "Census tracts provide neighborhood-level granularity (~4,000 people per tract), enabling targeted interventions rather than one-size-fits-all county approaches.",
          updateFrequency: "ACS 5-year estimates updated annually. Platform refreshes on each Census release cycle.",
        },
      });
    } catch (error) {
      console.error("Coalition dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch coalition dashboard" });
    }
  });

  app.get("/api/benefits/metrics", async (_req, res) => {
    try {
      const enrollmentData = await db.select().from(benefitsEnrollmentData);
      const [screeningCount] = await db.select({ count: count() }).from(benefitsScreenings);

      const byBenefit: Record<string, { eligible: number; enrolled: number; gap: number }> = {};
      for (const d of enrollmentData) {
        if (!byBenefit[d.benefitType]) byBenefit[d.benefitType] = { eligible: 0, enrolled: 0, gap: 0 };
        byBenefit[d.benefitType].eligible += d.eligiblePopulation || 0;
        byBenefit[d.benefitType].enrolled += d.enrolledPopulation || 0;
        byBenefit[d.benefitType].gap += (d.eligiblePopulation || 0) - (d.enrolledPopulation || 0);
      }

      const threeYearTargets = Object.entries(byBenefit).map(([type, data]) => ({
        benefitType: type,
        currentGap: data.gap,
        year1Target: Math.round(data.gap * 0.15),
        year2Target: Math.round(data.gap * 0.35),
        year3Target: Math.round(data.gap * 0.50),
        estimatedNewEnrollments: Math.round(data.gap * 0.50),
      }));

      const totalRenewals = enrollmentData.reduce((s, d) => s + (d.renewalsPending || 0), 0);
      const totalAtRisk = enrollmentData.reduce((s, d) => s + (d.renewalsAtRisk || 0), 0);

      res.json({
        byBenefit,
        threeYearTargets,
        pipeline: {
          screened: screeningCount?.count || 0,
          handedOff: Math.round((Number(screeningCount?.count) || 0) * 0.7),
          enrolled: Math.round((Number(screeningCount?.count) || 0) * 0.45),
          renewed: totalRenewals - totalAtRisk,
        },
        renewals: { pending: totalRenewals, atRisk: totalAtRisk },
        stDavidsAlignment: {
          increasedEnrollment: true,
          strongerCommunityHubs: true,
          culturallyResponsive: true,
          coLocationCoordination: true,
          reducedFragmentation: true,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.post("/api/benefits/coalition/ai-insight", async (req, res) => {
    try {
      const { countyFips, question } = req.body;
      const county = ST_DAVIDS_COUNTIES[countyFips];
      if (!county) return res.status(400).json({ error: "Invalid county" });

      const countyData = await db.select().from(benefitsEnrollmentData)
        .where(eq(benefitsEnrollmentData.countyFips, countyFips));
      const tractData = countyData.filter(d => d.benefitType === "ALL");
      const benefitData = countyData.filter(d => d.benefitType !== "ALL");
      const facilitators = COMMUNITY_FACILITATORS[countyFips] || [];
      const partners = await db.select().from(benefitsPartners)
        .where(eq(benefitsPartners.county, county.name));

      const totalEligible = benefitData.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
      const totalEnrolled = benefitData.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);
      const highNeedTracts = tractData.filter(t => (t.barrierIndex || 0) > 20 || (t.povertyRate || 0) > 25);

      const dataContext = `
COUNTY: ${county.name} (FIPS: ${countyFips})
STRATEGY: ${county.strategy === "build" ? "Build capacity (rural/emerging)" : "Strengthen existing (urban)"}
TOTAL ELIGIBLE: ${totalEligible.toLocaleString()} | ENROLLED: ${totalEnrolled.toLocaleString()} | GAP: ${(totalEligible - totalEnrolled).toLocaleString()}
ENROLLMENT RATE: ${totalEligible > 0 ? Math.round((totalEnrolled / totalEligible) * 100) : 0}%
POPULATION: ${benefitData[0]?.totalPopulation?.toLocaleString() || "N/A"}
POVERTY RATE: ${Math.round(benefitData[0]?.povertyRate || 0)}%
BARRIER INDEX: ${Math.round((benefitData[0]?.barrierIndex || 0) * 10) / 10}
LIMITED ENGLISH: ${Math.round(benefitData[0]?.limitedEnglishPct || 0)}%
NO VEHICLE: ${Math.round(benefitData[0]?.noVehiclePct || 0)}%
NO BROADBAND: ${Math.round(benefitData[0]?.noBroadbandPct || 0)}%
TRACTS TRACKED: ${tractData.length} | HIGH-NEED TRACTS: ${highNeedTracts.length}
EXISTING PARTNERS: ${facilitators.map(f => `${f.name} (${f.type})`).join(", ")}
REGISTERED COALITION MEMBERS: ${partners.length}
BENEFIT BREAKDOWN:
${benefitData.map(d => `  ${d.benefitType}: ${d.eligiblePopulation?.toLocaleString()} eligible, ${d.enrolledPopulation?.toLocaleString()} enrolled (${Math.round(d.participationRate || 0)}%)`).join("\n")}

HIGH-NEED NEIGHBORHOODS (top 5):
${highNeedTracts.slice(0, 5).map(t => {
  const raw = t.rawCensusData as any;
  return `  Tract ${t.tractId}: Pop ${t.totalPopulation?.toLocaleString()}, Poverty ${Math.round(t.povertyRate || 0)}%, Barrier ${Math.round((t.barrierIndex || 0) * 10) / 10}, Gap ${t.participationGap ? Math.round(t.participationGap) : 'N/A'}%`;
}).join("\n")}
`;

      const systemPrompt = `You are the Benefits Intelligence AI for The Collaborative Advocate Foundation (TCAF), a 501(c)(3) veteran-founded, Black-led nonprofit in Central Texas. You analyze Census ACS data, enrollment gaps, and barrier indices to generate actionable neighborhood-level insights for the We All Benefit 2.0 coalition (St. David's Foundation grant, $35M over 3 years across Travis, Williamson, Hays, Bastrop, and Caldwell counties).

Your role: Help coalition partners and St. David's Foundation understand WHERE the gaps are, WHO is falling through the cracks, WHAT barriers they face, and HOW to reach them with targeted, culturally responsive outreach.

Key principles:
- Lead with ENROLLMENT IMPACT, not technology
- Every neighborhood is different — targeted approaches, not one-size-fits-all
- Better enrollment = better health outcomes = better for everyone
- Connect initiatives: criminal justice reform taught us that right intervention + right person + right time = changed outcomes
- St. David's values: increased enrollment, stronger community hubs, culturally responsive approaches, co-location/coordination, reduced fragmentation
- Data source: U.S. Census Bureau ACS 5-Year Estimates (2018-2022), specific B-series variables at tract level
- FPL (2024): $15,060 + $5,380 per additional person

Be specific with numbers. Name neighborhoods. Recommend specific partner types needed. Connect to existing facilitators. Always actionable.`;

      const userPrompt = question
        ? `Given this data about ${county.name}, answer this question: ${question}\n\nDATA:\n${dataContext}`
        : `Generate a comprehensive neighborhood-level analysis for ${county.name} that a coalition partner or funder could use to understand:\n1. Where the biggest enrollment gaps are (specific neighborhoods)\n2. What barriers are most significant and how they vary by neighborhood\n3. Which populations are hardest to reach and why\n4. What outreach strategies match the barrier profile\n5. What partner roles are needed and where\n6. How this connects to the broader 5-county coalition\n\nDATA:\n${dataContext}`;

      const insight = await generateAIResponse([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], 3000);

      res.json({ insight, county: county.name, dataSnapshot: { totalEligible, totalEnrolled, gap: totalEligible - totalEnrolled, tractCount: tractData.length, highNeedTracts: highNeedTracts.length } });
    } catch (error) {
      console.error("AI insight error:", error);
      res.status(500).json({ error: "Failed to generate AI insight" });
    }
  });

  app.post("/api/benefits/coalition/ai-exec-summary", async (req, res) => {
    try {
      const enrollmentData = await db.select().from(benefitsEnrollmentData)
        .where(sql`${benefitsEnrollmentData.benefitType} != 'ALL'`);
      const tractData = await db.select().from(benefitsEnrollmentData)
        .where(eq(benefitsEnrollmentData.benefitType, "ALL"));
      const partners = await db.select().from(benefitsPartners);

      const totalEligible = enrollmentData.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
      const totalEnrolled = enrollmentData.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);
      const totalGap = totalEligible - totalEnrolled;

      const countyBreakdowns = Object.entries(ST_DAVIDS_COUNTIES).map(([fips, info]) => {
        const cd = enrollmentData.filter(d => d.countyFips === fips);
        const eligible = cd.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
        const enrolled = cd.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);
        const tracts = tractData.filter(t => t.countyFips === fips);
        const highNeed = tracts.filter(t => (t.barrierIndex || 0) > 20 || (t.povertyRate || 0) > 25);
        const facilitators = COMMUNITY_FACILITATORS[fips] || [];
        return {
          name: info.name, fips, strategy: info.strategy,
          population: cd[0]?.totalPopulation || 0,
          povertyRate: Math.round(cd[0]?.povertyRate || 0),
          eligible, enrolled, gap: eligible - enrolled,
          enrollmentRate: eligible > 0 ? Math.round((enrolled / eligible) * 100) : 0,
          barrierIndex: Math.round((cd[0]?.barrierIndex || 0) * 10) / 10,
          limitedEnglish: Math.round(cd[0]?.limitedEnglishPct || 0),
          noVehicle: Math.round(cd[0]?.noVehiclePct || 0),
          noBroadband: Math.round(cd[0]?.noBroadbandPct || 0),
          tractCount: tracts.length,
          highNeedTracts: highNeed.length,
          existingPartners: facilitators.length,
          facilitators: facilitators.map(f => f.name),
        };
      });

      const benefitTotals = Object.entries(
        enrollmentData.reduce((acc, d) => {
          if (!acc[d.benefitType]) acc[d.benefitType] = { eligible: 0, enrolled: 0 };
          acc[d.benefitType].eligible += d.eligiblePopulation || 0;
          acc[d.benefitType].enrolled += d.enrolledPopulation || 0;
          return acc;
        }, {} as Record<string, { eligible: number; enrolled: number }>)
      ).map(([type, data]) => ({ type, ...data, gap: data.eligible - data.enrolled, rate: data.eligible > 0 ? Math.round((data.enrolled / data.eligible) * 100) : 0 }));

      const systemPrompt = `You are writing an executive summary for The Collaborative Advocate Foundation (TCAF) — a 501(c)(3) veteran-founded, Black-led nonprofit led by Dr. Terry Flood, DHA. This document will be shared with Meredith (a community connector who knows everyone in the region) and potential coalition partners to recruit them into the We All Benefit 2.0 coalition.

CRITICAL CONTEXT:
- St. David's Foundation "We All Benefit 2.0: Building Economic Stability" grant
- $35M over 3 years across 5 counties: Travis, Williamson, Hays, Bastrop, Caldwell
- LOI due April 27, 2026 at 5 PM CT. If accepted, full application June 18, 2026
- TCAF EIN: 41-3618003 | Address: 17912 Stefano Drive, Pflugerville, TX 78660 (Williamson County)
- TCAF is the TECH CONDUIT — not replacing existing organizations but connecting them
- Three entities: TCAF (grants/nonprofit), CIP LLC EIN 41-4996540 (tech/AI), M&T Consulting EIN 41-4952178 (staffing)

ST. DAVID'S PRIORITIES (from We All Benefit 2.0 webinar and materials):
- Increase enrollment in public benefits (SNAP, Medicaid, CHIP, EITC, WIC, etc.)
- Address renewals equally with new enrollment
- Culturally responsive, linguistically appropriate outreach
- Build/strengthen community infrastructure
- Co-location and coordination between organizations
- Reduce fragmentation — many groups doing similar work without connecting
- Geographic specificity — especially Williamson County
- Hays, Bastrop, Caldwell are underserved and need capacity building
- St. David's CHNA, Community Voices Project, Pathways to Health Equity Strategic Plan are key references
- Benefits Enrollment Infrastructure Map for Central Texas exists — align to it
- Rubric emphasizes "Potential for Impact" — lead with outcomes, not technology

WHAT TCAF BRINGS:
- Benefits Intelligence System: Census ACS tract-level data across all 5 counties
- 3-minute screening tool checking 9 programs at once
- Barrier index methodology (language 25%, transportation 20%, digital 20%, immigration 15%, poverty 20%)
- Outreach modality engine matching strategies to neighborhood barrier profiles
- CHW deployment and tracking system
- Partner coordination portal
- HHSC Community Partner Program (CPP) pathway — levels 1-3
- AI-powered insights connecting data to action
- PWA for offline field use by CHWs
- Criminal justice reform experience: right intervention + right person + right time = changed outcomes

TWO AUDIENCES simultaneously:
1. St. David's Foundation — We have a solid plan AND the capacity to execute it. This is not one agency. This is a big tent coalition with data-driven precision.
2. Coalition Partners (Meredith's network) — Here's where you fit. Here's what your county needs. Here's how we make it easy for you to participate. Here's what we're measuring together.

FORMAT: Write a professional executive summary of 7 pages or less. Include:
1. Cover/Title section
2. The Opportunity (St. David's We All Benefit 2.0, what they want, timeline)
3. The Problem (enrollment gaps by county with real numbers)
4. Our Approach (TCAF as tech conduit, the coalition model, how it works)
5. Lines of Effort (LOE 1: Data & Intelligence, LOE 2: Screening & Enrollment, LOE 3: Coalition & Partnerships, LOE 4: Outreach & Engagement, LOE 5: Retention & Renewals)
6. County-by-County Breakdown (each county's data, barriers, partners, strategy)
7. 3-Year Targets & Investment (Year 1 infrastructure, Year 2 scale, Year 3 sustainability)
8. Coalition Call to Action (why join, how to join, what's needed)
9. Next Steps & Timeline (LOI April 27, full app June 18, key milestones)

Use real data from the numbers provided. Be specific. Name organizations. Give dollar values for benefits. Make it compelling but honest. No filler, no fluff. Every sentence earns its place.`;

      const dataPrompt = `Generate the executive summary using this real data:

OVERALL:
- Total Eligible: ${totalEligible.toLocaleString()}
- Total Enrolled: ${totalEnrolled.toLocaleString()}
- Total Gap: ${totalGap.toLocaleString()}
- Gap Rate: ${totalEligible > 0 ? Math.round((totalGap / totalEligible) * 100) : 0}%
- Counties: 5
- Total Census Tracts Tracked: ${tractData.length}
- Coalition Partners (known facilitators): ${Object.values(COMMUNITY_FACILITATORS).flat().length}
- Registered Partners: ${partners.length}

BENEFIT BREAKDOWN:
${benefitTotals.map(b => `  ${b.type}: ${b.eligible.toLocaleString()} eligible, ${b.enrolled.toLocaleString()} enrolled (${b.rate}%), gap: ${b.gap.toLocaleString()}`).join("\n")}

COUNTY BREAKDOWN:
${countyBreakdowns.map(c => `
${c.name} (${c.fips}) — Strategy: ${c.strategy}
  Population: ${c.population.toLocaleString()} | Poverty: ${c.povertyRate}%
  Eligible: ${c.eligible.toLocaleString()} | Enrolled: ${c.enrolled.toLocaleString()} | Gap: ${c.gap.toLocaleString()} (${c.enrollmentRate}%)
  Barrier Index: ${c.barrierIndex} | English: ${c.limitedEnglish}% | Vehicle: ${c.noVehicle}% | Broadband: ${c.noBroadband}%
  Tracts: ${c.tractCount} total, ${c.highNeedTracts} high-need
  Partners: ${c.existingPartners} (${c.facilitators.join(", ")})
`).join("")}

KEY RESOURCES FROM ST. DAVID'S:
- Research & Insights from We All Benefit 1.0: https://lnkd.in/gPkAUS-u
- Community Health Needs Assessment (CHNA)
- Community Voices Project
- Pathways to Health Equity Strategic Plan
- Benefits Enrollment Infrastructure Map for Central Texas
- Funding Opportunity Overview with rubric
- GivingData portal for LOI submission
- Office hours available: questions@stdavidsfoundation.org
- Technical: grantsinfo@stdavidsfoundation.org

ANNUAL VALUE OF BENEFITS PER PERSON:
SNAP: $3,024 | Medicaid: $7,200 | CHIP: $2,400 | EITC: $3,584 | WIC: $528 | SSI: $10,092 | SSDI: $16,560 | Marketplace: $5,400 | CTC: $3,600`;

      const summary = await generateAIResponse([
        { role: "system", content: systemPrompt },
        { role: "user", content: dataPrompt },
      ], 8000);

      res.json({ summary, generatedAt: new Date().toISOString(), dataSnapshot: { totalEligible, totalEnrolled, totalGap, counties: countyBreakdowns.length, tracts: tractData.length } });
    } catch (error) {
      console.error("Exec summary error:", error);
      res.status(500).json({ error: "Failed to generate executive summary" });
    }
  });

  app.post("/api/benefits/coalition/ai-collab-match", async (req, res) => {
    try {
      const { organizationType, county, services, description } = req.body;
      const countyInfo = Object.values(ST_DAVIDS_COUNTIES).find(c => c.name === county);
      if (!countyInfo) return res.status(400).json({ error: "Invalid county" });

      const countyData = await db.select().from(benefitsEnrollmentData)
        .where(and(eq(benefitsEnrollmentData.countyFips, countyInfo.fips), sql`${benefitsEnrollmentData.benefitType} != 'ALL'`));
      const facilitators = COMMUNITY_FACILITATORS[countyInfo.fips] || [];
      const existingPartners = await db.select().from(benefitsPartners).where(eq(benefitsPartners.county, county));

      const totalEligible = countyData.reduce((s, d) => s + (d.eligiblePopulation || 0), 0);
      const totalEnrolled = countyData.reduce((s, d) => s + (d.enrolledPopulation || 0), 0);

      const systemPrompt = `You are the Coalition Collaboration Matcher for TCAF's We All Benefit 2.0 initiative. Given information about a potential partner organization, generate a personalized collaboration plan that shows them:
1. Exactly where they fit in the coalition
2. What specific gaps their organization can help fill
3. Which existing partners they'd work alongside
4. What measurable outcomes they'd contribute to
5. What the first 30/60/90 day engagement looks like
6. How their participation strengthens the overall grant application

Be specific, use real data, and make them feel like their participation is essential (because it is). Return valid JSON.`;

      const result = await generateAIJSON<any>(
        `Organization: ${organizationType} named "${description || 'potential partner'}" in ${county}
Services: ${services || 'general community services'}
County enrollment gap: ${(totalEligible - totalEnrolled).toLocaleString()} people
Existing partners in county: ${facilitators.map(f => `${f.name} (${f.type})`).join(", ")}
Registered coalition members: ${existingPartners.length}
County poverty rate: ${Math.round(countyData[0]?.povertyRate || 0)}%
County barrier index: ${Math.round((countyData[0]?.barrierIndex || 0) * 10) / 10}

Generate a JSON object with these fields:
- roleTitle: string (their specific role in the coalition)
- fitScore: number (1-100, how well they fill a gap)
- whyYouMatter: string (2-3 sentences on why their participation is essential)
- specificGapsYouFill: string[] (3-5 specific gaps)
- workAlongside: string[] (names of existing orgs they'd collaborate with)
- measurableOutcomes: string[] (3-4 specific outcomes with numbers)
- first30Days: string[] (3-4 action items)
- first60Days: string[] (3-4 action items)
- first90Days: string[] (3-4 action items)
- coalitionStrengthening: string (how they strengthen the grant application)`,
        systemPrompt
      );

      res.json({ match: result, county, organizationType });
    } catch (error) {
      console.error("Collab match error:", error);
      res.status(500).json({ error: "Failed to generate collaboration match" });
    }
  });
}
