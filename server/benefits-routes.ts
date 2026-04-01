import type { Express } from "express";
import { db } from "./storage";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  benefitsEnrollmentData, benefitsPartners, benefitsChwNetwork, benefitsEnrollmentLog,
  insertBenefitsPartnerSchema, insertBenefitsChwSchema, insertBenefitsEnrollmentLogSchema,
} from "@shared/schema";
import { z } from "zod";

const ST_DAVIDS_COUNTIES = [
  { fips: "48453", name: "Travis County", seat: "Austin", strategy: "strengthen", lat: 30.2672, lng: -97.7431 },
  { fips: "48491", name: "Williamson County", seat: "Georgetown", strategy: "build", lat: 30.6333, lng: -97.6780 },
  { fips: "48209", name: "Hays County", seat: "San Marcos", strategy: "build", lat: 30.0587, lng: -97.8694 },
  { fips: "48021", name: "Bastrop County", seat: "Bastrop", strategy: "build", lat: 30.1105, lng: -97.3155 },
  { fips: "48055", name: "Caldwell County", seat: "Lockhart", strategy: "build", lat: 29.8849, lng: -97.6703 },
];

const BENEFIT_TYPES = [
  { id: "snap", name: "SNAP", category: "Food Security", icon: "utensils", color: "#22c55e" },
  { id: "wic", name: "WIC", category: "Food Security", icon: "baby", color: "#84cc16" },
  { id: "medicaid", name: "Medicaid", category: "Healthcare Access", icon: "heart-pulse", color: "#ef4444" },
  { id: "chip", name: "CHIP", category: "Healthcare Access", icon: "shield", color: "#f97316" },
  { id: "marketplace", name: "Marketplace", category: "Healthcare Access", icon: "building", color: "#8b5cf6" },
  { id: "eitc", name: "EITC", category: "Income Supports", icon: "dollar-sign", color: "#3b82f6" },
  { id: "ctc", name: "Child Tax Credit", category: "Income Supports", icon: "users", color: "#06b6d4" },
  { id: "ssi", name: "SSI", category: "Income Supports", icon: "landmark", color: "#a855f7" },
  { id: "ssdi", name: "SSDI", category: "Income Supports", icon: "briefcase", color: "#ec4899" },
];

const COUNTY_BENEFITS_DATA: Record<string, any> = {
  "48453": {
    population: 1290188, enrollmentInfrastructure: "established",
    snap: { eligible: 198000, enrolled: 99000, rate: 50 },
    medicaid: { eligible: 185000, enrolled: 148000, rate: 80 },
    chip: { eligible: 42000, enrolled: 33600, rate: 80 },
    marketplace: { eligible: 95000, enrolled: 57000, rate: 60 },
    eitc: { eligible: 156000, enrolled: 124800, rate: 80 },
    ctc: { eligible: 89000, enrolled: 71200, rate: 80 },
    wic: { eligible: 35000, enrolled: 21000, rate: 60 },
    ssi: { eligible: 28000, enrolled: 19600, rate: 70 },
    ssdi: { eligible: 34000, enrolled: 27200, rate: 80 },
    barriers: { limitedEnglish: 22.1, noVehicle: 6.8, noBroadband: 8.2, nonCitizen: 12.4, poverty: 13.2 },
    zipCodes: ["78701","78702","78704","78721","78723","78741","78744","78745","78748","78753","78758"],
  },
  "48491": {
    population: 609017, enrollmentInfrastructure: "limited",
    snap: { eligible: 52000, enrolled: 20800, rate: 40 },
    medicaid: { eligible: 58000, enrolled: 40600, rate: 70 },
    chip: { eligible: 18000, enrolled: 10800, rate: 60 },
    marketplace: { eligible: 42000, enrolled: 21000, rate: 50 },
    eitc: { eligible: 48000, enrolled: 33600, rate: 70 },
    ctc: { eligible: 38000, enrolled: 26600, rate: 70 },
    wic: { eligible: 14000, enrolled: 7000, rate: 50 },
    ssi: { eligible: 9500, enrolled: 5700, rate: 60 },
    ssdi: { eligible: 12000, enrolled: 8400, rate: 70 },
    barriers: { limitedEnglish: 15.8, noVehicle: 3.2, noBroadband: 10.5, nonCitizen: 9.7, poverty: 9.1 },
    zipCodes: ["78660","78664","78681","78626","78628","78633","78634","78641","78665","78717"],
  },
  "48209": {
    population: 252342, enrollmentInfrastructure: "limited",
    snap: { eligible: 28000, enrolled: 11200, rate: 40 },
    medicaid: { eligible: 30000, enrolled: 19500, rate: 65 },
    chip: { eligible: 9500, enrolled: 5700, rate: 60 },
    marketplace: { eligible: 18000, enrolled: 7200, rate: 40 },
    eitc: { eligible: 26000, enrolled: 15600, rate: 60 },
    ctc: { eligible: 15000, enrolled: 9000, rate: 60 },
    wic: { eligible: 7500, enrolled: 3000, rate: 40 },
    ssi: { eligible: 4200, enrolled: 2100, rate: 50 },
    ssdi: { eligible: 5500, enrolled: 3300, rate: 60 },
    barriers: { limitedEnglish: 18.3, noVehicle: 4.1, noBroadband: 14.2, nonCitizen: 11.5, poverty: 15.8 },
    zipCodes: ["78666","78640","78610","78620","78737","78676"],
  },
  "48021": {
    population: 104078, enrollmentInfrastructure: "minimal",
    snap: { eligible: 15000, enrolled: 5250, rate: 35 },
    medicaid: { eligible: 16000, enrolled: 9600, rate: 60 },
    chip: { eligible: 5200, enrolled: 2600, rate: 50 },
    marketplace: { eligible: 8500, enrolled: 2550, rate: 30 },
    eitc: { eligible: 14000, enrolled: 7700, rate: 55 },
    ctc: { eligible: 7500, enrolled: 3750, rate: 50 },
    wic: { eligible: 4000, enrolled: 1400, rate: 35 },
    ssi: { eligible: 2800, enrolled: 1120, rate: 40 },
    ssdi: { eligible: 3200, enrolled: 1600, rate: 50 },
    barriers: { limitedEnglish: 24.6, noVehicle: 5.3, noBroadband: 18.7, nonCitizen: 14.2, poverty: 18.9 },
    zipCodes: ["78602","78612","78621","78650","78659","78662"],
  },
  "48055": {
    population: 47888, enrollmentInfrastructure: "minimal",
    snap: { eligible: 8500, enrolled: 2550, rate: 30 },
    medicaid: { eligible: 9200, enrolled: 5060, rate: 55 },
    chip: { eligible: 3000, enrolled: 1350, rate: 45 },
    marketplace: { eligible: 4800, enrolled: 1200, rate: 25 },
    eitc: { eligible: 7800, enrolled: 3900, rate: 50 },
    ctc: { eligible: 4200, enrolled: 1890, rate: 45 },
    wic: { eligible: 2200, enrolled: 660, rate: 30 },
    ssi: { eligible: 1800, enrolled: 630, rate: 35 },
    ssdi: { eligible: 2100, enrolled: 840, rate: 40 },
    barriers: { limitedEnglish: 28.4, noVehicle: 7.1, noBroadband: 22.3, nonCitizen: 16.8, poverty: 22.1 },
    zipCodes: ["78644","78616","78632","78655"],
  },
};

const SEED_PARTNERS = [
  { organizationName: "Foundation Communities", countyFips: "48453", countyName: "Travis County", partnerType: "community_hub", servicesProvided: ["Benefits enrollment","Housing assistance","Financial coaching"], benefitTypesServed: ["snap","medicaid","chip","marketplace","eitc"], languages: ["English","Spanish"], hhscCppLevel: 3, isVitaSite: true, capacityStatus: "active", latitude: 30.2302, longitude: -97.7545, zipCode: "78704" },
  { organizationName: "Workforce Solutions Capital Area", countyFips: "48453", countyName: "Travis County", partnerType: "workforce", servicesProvided: ["Job training","Benefits screening","Childcare subsidies"], benefitTypesServed: ["snap","medicaid","eitc"], languages: ["English","Spanish"], hhscCppLevel: 2, capacityStatus: "active", latitude: 30.3074, longitude: -97.7385, zipCode: "78758" },
  { organizationName: "CommUnity Care", countyFips: "48453", countyName: "Travis County", partnerType: "health_center", servicesProvided: ["Primary care","Medicaid enrollment","CHIP enrollment"], benefitTypesServed: ["medicaid","chip","marketplace"], languages: ["English","Spanish","Vietnamese","Arabic"], hhscCppLevel: 3, capacityStatus: "active", latitude: 30.2849, longitude: -97.7341, zipCode: "78702" },
  { organizationName: "Central Texas Food Bank", countyFips: "48453", countyName: "Travis County", partnerType: "food_pantry", servicesProvided: ["Food distribution","SNAP screening","Benefits referral"], benefitTypesServed: ["snap","wic"], languages: ["English","Spanish"], capacityStatus: "active", latitude: 30.2185, longitude: -97.7587, zipCode: "78744" },
  { organizationName: "Lone Star Circle of Care", countyFips: "48491", countyName: "Williamson County", partnerType: "health_center", servicesProvided: ["Primary care","Dental","Medicaid enrollment"], benefitTypesServed: ["medicaid","chip","marketplace"], languages: ["English","Spanish"], hhscCppLevel: 2, capacityStatus: "active", latitude: 30.6328, longitude: -97.6778, zipCode: "78626" },
  { organizationName: "Opportunities for Williamson & Burnet Counties", countyFips: "48491", countyName: "Williamson County", partnerType: "community_action", servicesProvided: ["Utility assistance","Benefits enrollment","Emergency aid"], benefitTypesServed: ["snap","medicaid","eitc","ssi"], languages: ["English","Spanish"], hhscCppLevel: 1, isVitaSite: true, capacityStatus: "active", latitude: 30.6586, longitude: -97.6958, zipCode: "78626" },
  { organizationName: "Pflugerville Community Development Corp", countyFips: "48491", countyName: "Williamson County", partnerType: "community_hub", servicesProvided: ["Community programs","Resource referral"], benefitTypesServed: ["snap","eitc"], languages: ["English","Spanish"], capacityStatus: "potential", latitude: 30.4394, longitude: -97.6200, zipCode: "78660" },
  { organizationName: "Hays County Food Bank", countyFips: "48209", countyName: "Hays County", partnerType: "food_pantry", servicesProvided: ["Food distribution","SNAP referral"], benefitTypesServed: ["snap","wic"], languages: ["English","Spanish"], capacityStatus: "active", latitude: 29.8833, longitude: -97.9414, zipCode: "78666" },
  { organizationName: "Community Action Inc of Central Texas", countyFips: "48209", countyName: "Hays County", partnerType: "community_action", servicesProvided: ["Head Start","Utility assistance","Benefits enrollment"], benefitTypesServed: ["snap","medicaid","wic","eitc"], languages: ["English","Spanish"], hhscCppLevel: 1, capacityStatus: "active", latitude: 29.8849, longitude: -97.9388, zipCode: "78666" },
  { organizationName: "Bastrop County Cares", countyFips: "48021", countyName: "Bastrop County", partnerType: "community_hub", servicesProvided: ["Emergency assistance","Food pantry","Benefits referral"], benefitTypesServed: ["snap","medicaid"], languages: ["English","Spanish"], capacityStatus: "active", latitude: 30.1105, longitude: -97.3155, zipCode: "78602" },
  { organizationName: "Bastrop County Emergency Food Pantry", countyFips: "48021", countyName: "Bastrop County", partnerType: "food_pantry", servicesProvided: ["Food distribution","SNAP screening"], benefitTypesServed: ["snap","wic"], languages: ["English","Spanish"], capacityStatus: "active", latitude: 30.1116, longitude: -97.3163, zipCode: "78602" },
  { organizationName: "Caldwell County Community Resource Center", countyFips: "48055", countyName: "Caldwell County", partnerType: "community_hub", servicesProvided: ["Resource referral","Emergency aid"], benefitTypesServed: ["snap","medicaid"], languages: ["English","Spanish"], capacityStatus: "potential", latitude: 29.8849, longitude: -97.6703, zipCode: "78644" },
];

function computeBarrierIndex(barriers: any): number {
  const weights = { limitedEnglish: 0.25, noVehicle: 0.15, noBroadband: 0.20, nonCitizen: 0.20, poverty: 0.20 };
  return Math.min(100, Math.round(
    (barriers.limitedEnglish * weights.limitedEnglish +
     barriers.noVehicle * weights.noVehicle +
     barriers.noBroadband * weights.noBroadband +
     barriers.nonCitizen * weights.nonCitizen +
     barriers.poverty * weights.poverty) * 100 / 25
  ));
}

function recommendModality(barrierIndex: number, barriers: any): string {
  if (barrierIndex >= 70) return "in-person-accompany";
  if (barriers.noBroadband > 15 && barriers.noVehicle > 5) return "mobile-outreach";
  if (barriers.limitedEnglish > 20 || barriers.nonCitizen > 12) return "trusted-partner";
  if (barrierIndex >= 40) return "hybrid";
  return "virtual-first";
}

export function registerBenefitsRoutes(app: Express) {
  app.get("/api/benefits/counties", (_req, res) => {
    const counties = ST_DAVIDS_COUNTIES.map(c => {
      const data = COUNTY_BENEFITS_DATA[c.fips];
      const barrierIndex = data ? computeBarrierIndex(data.barriers) : 0;
      const totalEligible = data ? Object.keys(data).filter(k => BENEFIT_TYPES.find(b => b.id === k)).reduce((sum, k) => sum + (data[k]?.eligible || 0), 0) : 0;
      const totalEnrolled = data ? Object.keys(data).filter(k => BENEFIT_TYPES.find(b => b.id === k)).reduce((sum, k) => sum + (data[k]?.enrolled || 0), 0) : 0;
      const totalGap = totalEligible - totalEnrolled;

      return {
        ...c,
        population: data?.population || 0,
        enrollmentInfrastructure: data?.enrollmentInfrastructure || "unknown",
        totalEligible,
        totalEnrolled,
        totalGap,
        participationRate: totalEligible > 0 ? Math.round((totalEnrolled / totalEligible) * 100) : 0,
        barrierIndex,
        barriers: data?.barriers || {},
        recommendedModality: data ? recommendModality(barrierIndex, data.barriers) : "unknown",
        zipCodes: data?.zipCodes || [],
      };
    });
    res.json(counties);
  });

  app.get("/api/benefits/county/:fips", (req, res) => {
    const { fips } = req.params;
    const county = ST_DAVIDS_COUNTIES.find(c => c.fips === fips);
    const data = COUNTY_BENEFITS_DATA[fips];
    if (!county || !data) return res.status(404).json({ error: "County not found" });

    const benefits = BENEFIT_TYPES.map(bt => {
      const bd = data[bt.id];
      if (!bd) return null;
      return {
        ...bt,
        eligible: bd.eligible,
        enrolled: bd.enrolled,
        gap: bd.eligible - bd.enrolled,
        participationRate: bd.rate,
      };
    }).filter(Boolean);

    const barrierIndex = computeBarrierIndex(data.barriers);

    res.json({
      ...county,
      population: data.population,
      enrollmentInfrastructure: data.enrollmentInfrastructure,
      benefits,
      barriers: data.barriers,
      barrierIndex,
      recommendedModality: recommendModality(barrierIndex, data.barriers),
      zipCodes: data.zipCodes,
    });
  });

  app.get("/api/benefits/types", (_req, res) => {
    res.json(BENEFIT_TYPES);
  });

  app.get("/api/benefits/overview", (_req, res) => {
    const overview = BENEFIT_TYPES.map(bt => {
      let totalEligible = 0, totalEnrolled = 0;
      for (const fips of Object.keys(COUNTY_BENEFITS_DATA)) {
        const d = COUNTY_BENEFITS_DATA[fips][bt.id];
        if (d) { totalEligible += d.eligible; totalEnrolled += d.enrolled; }
      }
      return {
        ...bt,
        totalEligible,
        totalEnrolled,
        totalGap: totalEligible - totalEnrolled,
        participationRate: totalEligible > 0 ? Math.round((totalEnrolled / totalEligible) * 100) : 0,
      };
    });

    const regionTotal = {
      totalEligible: overview.reduce((s, o) => s + o.totalEligible, 0),
      totalEnrolled: overview.reduce((s, o) => s + o.totalEnrolled, 0),
      totalGap: overview.reduce((s, o) => s + o.totalGap, 0),
      totalPopulation: Object.values(COUNTY_BENEFITS_DATA).reduce((s: number, d: any) => s + d.population, 0),
    };

    res.json({ benefits: overview, region: regionTotal });
  });

  app.get("/api/benefits/barriers", (_req, res) => {
    const barriers = ST_DAVIDS_COUNTIES.map(c => {
      const data = COUNTY_BENEFITS_DATA[c.fips];
      if (!data) return null;
      return {
        ...c,
        barriers: data.barriers,
        barrierIndex: computeBarrierIndex(data.barriers),
        recommendedModality: recommendModality(computeBarrierIndex(data.barriers), data.barriers),
      };
    }).filter(Boolean);
    res.json(barriers);
  });

  app.get("/api/benefits/partners", async (_req, res) => {
    try {
      const partners = await db.select().from(benefitsPartners).orderBy(benefitsPartners.countyName);
      if (partners.length === 0) {
        for (const p of SEED_PARTNERS) {
          await db.insert(benefitsPartners).values(p as any);
        }
        const seeded = await db.select().from(benefitsPartners).orderBy(benefitsPartners.countyName);
        return res.json(seeded);
      }
      res.json(partners);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/benefits/partners", async (req, res) => {
    try {
      const data = insertBenefitsPartnerSchema.parse(req.body);
      const [partner] = await db.insert(benefitsPartners).values(data).returning();
      res.json(partner);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/benefits/chw-network", async (_req, res) => {
    try {
      const chws = await db.select().from(benefitsChwNetwork).orderBy(benefitsChwNetwork.name);
      res.json(chws);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/benefits/chw-network", async (req, res) => {
    try {
      const data = insertBenefitsChwSchema.parse(req.body);
      const [chw] = await db.insert(benefitsChwNetwork).values(data).returning();
      res.json(chw);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/benefits/enrollment-log", async (_req, res) => {
    try {
      const logs = await db.select().from(benefitsEnrollmentLog).orderBy(desc(benefitsEnrollmentLog.createdAt)).limit(100);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/benefits/enrollment-log", async (req, res) => {
    try {
      const data = insertBenefitsEnrollmentLogSchema.parse(req.body);
      const [log] = await db.insert(benefitsEnrollmentLog).values(data).returning();
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/benefits/metrics", (_req, res) => {
    const threeYearTargets: any[] = [];
    for (const county of ST_DAVIDS_COUNTIES) {
      const data = COUNTY_BENEFITS_DATA[county.fips];
      if (!data) continue;
      for (const bt of BENEFIT_TYPES) {
        const bd = data[bt.id];
        if (!bd) continue;
        const gap = bd.eligible - bd.enrolled;
        const year1 = Math.round(gap * 0.15);
        const year2 = Math.round(gap * 0.25);
        const year3 = Math.round(gap * 0.30);
        threeYearTargets.push({
          countyFips: county.fips,
          countyName: county.name,
          benefitType: bt.id,
          benefitName: bt.name,
          currentGap: gap,
          year1Target: year1,
          year2Target: year2,
          year3Target: year3,
          totalTarget: year1 + year2 + year3,
          targetRate: Math.round(((bd.enrolled + year1 + year2 + year3) / bd.eligible) * 100),
        });
      }
    }

    const summary = {
      totalCurrentGap: threeYearTargets.reduce((s, t) => s + t.currentGap, 0),
      totalYear1: threeYearTargets.reduce((s, t) => s + t.year1Target, 0),
      totalYear2: threeYearTargets.reduce((s, t) => s + t.year2Target, 0),
      totalYear3: threeYearTargets.reduce((s, t) => s + t.year3Target, 0),
      totalTarget: threeYearTargets.reduce((s, t) => s + t.totalTarget, 0),
    };

    res.json({ targets: threeYearTargets, summary });
  });

  app.get("/api/benefits/hhsc-cpp", (_req, res) => {
    res.json({
      program: "HHSC Community Partner Program",
      description: "Through the Community Partner Program, HHSC partners with organizations across Texas to help community members complete HHSC benefits applications. Partners receive training and varying levels of access to submitted applications.",
      levels: [
        {
          level: 1,
          name: "Community Partner",
          description: "Basic partnership allowing you to assist clients with Your Texas Benefits applications",
          requirements: ["Complete online training", "Sign MOU with HHSC", "Designate a program coordinator"],
          capabilities: ["Help clients create YTB accounts", "Assist with application submission", "Access basic application status"],
          timeToAchieve: "2-4 weeks",
        },
        {
          level: 2,
          name: "Certified Application Counselor",
          description: "Enhanced access with ability to track application progress and assist with documentation",
          requirements: ["Complete Level 1", "Additional training modules", "Pass certification exam", "Background check for designated staff"],
          capabilities: ["All Level 1 capabilities", "Track application status in detail", "Upload supporting documents", "Receive application notifications"],
          timeToAchieve: "4-8 weeks after Level 1",
        },
        {
          level: 3,
          name: "Community Based Organization (CBO)",
          description: "Full partnership with direct enrollment capabilities and dedicated HHSC liaison",
          requirements: ["Complete Level 2", "Demonstrate enrollment volume", "Annual program review", "Dedicated enrollment staff"],
          capabilities: ["All Level 2 capabilities", "Direct access to enrollment systems", "Dedicated HHSC liaison", "Priority application processing", "Aggregate reporting access"],
          timeToAchieve: "3-6 months after Level 2",
          note: "Level 3 is what St. David's Foundation considers an important signal for Travis County applicants",
        },
      ],
      tcafPlan: {
        currentLevel: 0,
        targetLevel: 3,
        timeline: [
          { phase: "Apply for Level 1", duration: "Month 1-2", status: "planned" },
          { phase: "Complete Level 1 training", duration: "Month 2-3", status: "planned" },
          { phase: "Begin Level 2 certification", duration: "Month 3-5", status: "planned" },
          { phase: "Achieve Level 2", duration: "Month 5-6", status: "planned" },
          { phase: "Build enrollment volume for Level 3", duration: "Month 6-12", status: "planned" },
          { phase: "Apply for Level 3 CBO status", duration: "Month 12-18", status: "planned" },
        ],
      },
      links: {
        overview: "https://www.hhs.texas.gov/services/financial/community-partner-program",
        training: "https://www.hhs.texas.gov/services/financial/community-partner-program/training",
        application: "https://www.hhs.texas.gov/services/financial/community-partner-program/apply",
      },
    });
  });

  app.get("/api/benefits/modality-recommendations", (_req, res) => {
    const recommendations = ST_DAVIDS_COUNTIES.map(c => {
      const data = COUNTY_BENEFITS_DATA[c.fips];
      if (!data) return null;
      const barrierIndex = computeBarrierIndex(data.barriers);
      const modality = recommendModality(barrierIndex, data.barriers);

      const modalityDetails: Record<string, any> = {
        "virtual-first": {
          name: "Virtual-First",
          description: "Platform handles eligibility screening, benefits matching, document prep, and appointment scheduling online",
          tools: ["AI eligibility screener", "Video consultations", "Digital document upload", "SMS reminders"],
          bestFor: "Areas with good broadband and lower barrier indices",
        },
        "hybrid": {
          name: "Hybrid Virtual + In-Person",
          description: "Virtual screening and intake, with in-person follow-up at community hubs for enrollment completion",
          tools: ["Online pre-screening", "Scheduled in-person appointments", "Partner hub walk-ins", "Phone follow-up"],
          bestFor: "Moderate barrier areas needing both convenience and personal touch",
        },
        "trusted-partner": {
          name: "Trusted Partner Network",
          description: "Enrollment through organizations the community already trusts — churches, food pantries, clinics, schools",
          tools: ["Partner-based intake", "Culturally matched CHWs", "Bilingual navigators", "Community event enrollment"],
          bestFor: "High limited-English or immigration-concerned populations",
        },
        "mobile-outreach": {
          name: "Mobile Outreach",
          description: "Bring enrollment services directly to underserved areas via mobile units and community events",
          tools: ["Mobile enrollment van", "Pop-up enrollment events", "Door-to-door outreach", "Community gathering enrollment"],
          bestFor: "Rural areas with limited broadband and transportation access",
        },
        "in-person-accompany": {
          name: "In-Person Accompaniment",
          description: "CHWs physically accompany clients through the entire enrollment process, from application to approval",
          tools: ["1-on-1 CHW assignment", "Transportation assistance", "Document gathering help", "Office accompaniment", "Follow-up until approval"],
          bestFor: "Highest-barrier populations — system-distrustful, isolated, complex situations",
        },
      };

      return {
        ...c,
        barrierIndex,
        modality,
        details: modalityDetails[modality] || modalityDetails["hybrid"],
        barriers: data.barriers,
        allModalities: modalityDetails,
      };
    }).filter(Boolean);

    res.json(recommendations);
  });
}
