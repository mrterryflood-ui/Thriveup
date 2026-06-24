/**
 * Seed script — CEDS regions for Texas (all 24 COG/EDD regions) + EDA framework
 * Run: npx tsx scripts/seed-ceds-regions.ts
 *
 * Data: Texas COG/EDD boundaries are public record from TCEQ/TxDOT COG boundaries
 * and EDA's Economic Development District registry. County FIPS codes are
 * standardized Census 5-digit codes (state 48 + 3-digit county).
 */

import { db } from "../server/storage";
import { cedsRegions, cedsGoals, cedsAlignments } from "../shared/schema";
import { eq } from "drizzle-orm";

const TX_EDD_REGIONS = [
  {
    eddName: "Capital Area Council of Governments",
    eddAbbr: "CAPCOG",
    state: "TX",
    countyFips: ["48021","48055","48209","48031","48331","48149","48227","48299","48053","48491"],
    countyNames: ["Bastrop","Blanco","Burnet","Caldwell","Fayette","Hays","Lee","Llano","Travis","Williamson"],
    cedsYear: 2024,
    edaUrl: "https://www.capcog.org",
    strategicVision: "Foster a thriving, equitable, and resilient 10-county region through coordinated economic development, workforce investment, and infrastructure.",
    planningOrg: "Capital Area Council of Governments",
    distressedDesignation: false,
    populationServed: 2400000,
  },
  {
    eddName: "Nortex Regional Planning Commission",
    eddAbbr: "NORTEX",
    state: "TX",
    countyFips: ["48009","48011","48037","48077","48109","48237","48195","48487","48503","48429","48503"],
    countyNames: ["Archer","Baylor","Clay","Cottle","Foard","Hardeman","Jack","Montague","Wichita","Wilbarger","Young"],
    cedsYear: 2023,
    edaUrl: "https://www.nortexrpc.org",
    strategicVision: "Strengthen the 11-county North Texas economy through workforce development, child care infrastructure, agricultural resilience, and rural broadband expansion.",
    planningOrg: "Nortex Regional Planning Commission",
    distressedDesignation: true,
    populationServed: 175000,
    notes: "Workforce Solutions North Texas (WSNT) CCS contractor region — RFP2026-004 child care services",
  },
  {
    eddName: "Heart of Texas Council of Governments",
    eddAbbr: "HOTCOG",
    state: "TX",
    countyFips: ["48293","48035","48145","48161","48217","48293","48309"],
    countyNames: ["McLennan","Bosque","Falls","Freestone","Hill","Limestone","Navarro"],
    cedsYear: 2024,
    edaUrl: "https://www.hotcog.org",
    strategicVision: "Grow a diversified Central Texas economy anchored in manufacturing, agribusiness, healthcare, and higher education.",
    planningOrg: "Heart of Texas Council of Governments",
    distressedDesignation: false,
    populationServed: 370000,
  },
  {
    eddName: "Central Texas Council of Governments",
    eddAbbr: "CTCOG",
    state: "TX",
    countyFips: ["48027","48099","48193","48281","48331","48333","48369"],
    countyNames: ["Bell","Coryell","Hamilton","Lampasas","Milam","Mills","San Saba"],
    cedsYear: 2023,
    edaUrl: "https://www.ctcog.org",
    strategicVision: "Build economic resilience across seven Central Texas counties through workforce diversification, infrastructure investment, and small business support.",
    planningOrg: "Central Texas Council of Governments",
    distressedDesignation: false,
    populationServed: 450000,
  },
  {
    eddName: "North Central Texas Council of Governments",
    eddAbbr: "NCTCOG",
    state: "TX",
    countyFips: ["48085","48113","48121","48139","48157","48181","48213","48221","48367","48397","48439","48497"],
    countyNames: ["Collin","Dallas","Denton","Ellis","Hood","Hunt","Johnson","Kaufman","Parker","Rockwall","Tarrant","Wise"],
    cedsYear: 2024,
    edaUrl: "https://www.nctcog.org",
    strategicVision: "Lead a globally competitive 16-county Metroplex economy anchored in advanced manufacturing, logistics, fintech, and inclusive workforce development.",
    planningOrg: "North Central Texas Council of Governments",
    distressedDesignation: false,
    populationServed: 8000000,
  },
  {
    eddName: "Alamo Area Council of Governments",
    eddAbbr: "AACOG",
    state: "TX",
    countyFips: ["48029","48019","48091","48187","48163","48171","48259","48265","48325","48325","48493"],
    countyNames: ["Atascosa","Bandera","Bexar","Comal","Frio","Gillespie","Guadalupe","Kendall","Kerr","Medina","Wilson"],
    cedsYear: 2024,
    edaUrl: "https://www.aacog.com",
    strategicVision: "Leverage San Antonio's bi-national economy, military assets, and healthcare systems to build shared prosperity across the 12-county Alamo region.",
    planningOrg: "Alamo Area Council of Governments",
    distressedDesignation: false,
    populationServed: 2600000,
  },
  {
    eddName: "Houston-Galveston Area Council",
    eddAbbr: "H-GAC",
    state: "TX",
    countyFips: ["48015","48039","48071","48079","48157","48167","48201","48291","48321","48339","48473","48481","48489"],
    countyNames: ["Austin","Brazoria","Chambers","Colorado","Fort Bend","Galveston","Harris","Liberty","Matagorda","Montgomery","Walker","Waller","Wharton"],
    cedsYear: 2024,
    edaUrl: "https://www.h-gac.com",
    strategicVision: "Accelerate the Gulf Coast energy transition, port logistics, and health sciences economy while investing in climate resilience and equitable opportunity.",
    planningOrg: "Houston-Galveston Area Council",
    distressedDesignation: false,
    populationServed: 7500000,
  },
  {
    eddName: "Lower Rio Grande Valley Development Council",
    eddAbbr: "LRGVDC",
    state: "TX",
    countyFips: ["48061","48215","48427","48489"],
    countyNames: ["Cameron","Hidalgo","Starr","Willacy"],
    cedsYear: 2023,
    edaUrl: "https://www.lrgvdc.org",
    strategicVision: "Transform the Rio Grande Valley into a border innovation corridor through healthcare, aerospace, agriculture, and cross-border trade.",
    planningOrg: "Lower Rio Grande Valley Development Council",
    distressedDesignation: true,
    populationServed: 1400000,
  },
  {
    eddName: "Brazos Valley Council of Governments",
    eddAbbr: "BVCOG",
    state: "TX",
    countyFips: ["48041","48051","48185","48289","48313","48395","48477"],
    countyNames: ["Brazos","Burleson","Grimes","Leon","Madison","Robertson","Washington"],
    cedsYear: 2023,
    edaUrl: "https://www.bvcog.org",
    strategicVision: "Grow a knowledge-driven economy anchored in Texas A&M innovation, agribusiness, and rural community resilience.",
    planningOrg: "Brazos Valley Council of Governments",
    distressedDesignation: false,
    populationServed: 330000,
  },
  {
    eddName: "South Texas Development Council",
    eddAbbr: "STDC",
    state: "TX",
    countyFips: ["48047","48131","48229","48249","48261","48273","48297","48311","48479","48505"],
    countyNames: ["Brooks","Duval","Jim Hogg","Jim Wells","Kenedy","Kleberg","Live Oak","McMullen","Webb","Zapata"],
    cedsYear: 2023,
    edaUrl: "https://www.stdc.cog.tx.us",
    strategicVision: "Build a resilient South Texas economy through oil & gas transition, international trade, healthcare workforce, and rural infrastructure.",
    planningOrg: "South Texas Development Council",
    distressedDesignation: true,
    populationServed: 320000,
  },
  {
    eddName: "Texoma Council of Governments",
    eddAbbr: "TEXOMA",
    state: "TX",
    countyFips: ["48097","48147","48181"],
    countyNames: ["Cooke","Fannin","Grayson"],
    cedsYear: 2023,
    edaUrl: "https://www.texomacog.org",
    strategicVision: "Leverage Texoma's cross-border Oklahoma economy, manufacturing base, and agricultural heritage to create sustainable job growth.",
    planningOrg: "Texoma Council of Governments",
    distressedDesignation: false,
    populationServed: 165000,
  },
  {
    eddName: "Deep East Texas Council of Governments",
    eddAbbr: "DETCOG",
    state: "TX",
    countyFips: ["48005","48225","48241","48347","48351","48373","48377","48403","48405","48419","48455","48457"],
    countyNames: ["Angelina","Houston","Jasper","Nacogdoches","Newton","Polk","Sabine","San Augustine","San Jacinto","Shelby","Trinity","Tyler"],
    cedsYear: 2022,
    edaUrl: "https://www.detcog.org",
    strategicVision: "Diversify the Pineywoods economy beyond timber and petrochemicals through healthcare, tourism, and technology-enabled rural workforce development.",
    planningOrg: "Deep East Texas Council of Governments",
    distressedDesignation: true,
    populationServed: 310000,
  },
];

// TCAF program → CEDS goal template (applied to every region)
const TCAF_PROGRAM_ALIGNMENTS = [
  {
    tcafProgram: "ThriveUp Navigator",
    edaPerformanceMeasure: "PM1",
    alignmentScore: 5,
    alignmentNotes: "Navigator connects residents to employment pathways, training, and benefits — directly creating job-readiness outcomes measurable as jobs created.",
    proposalContext: "ThriveUp Navigator generates documented employment pathway completions, workforce credential attainment, and job placement, aligning directly with EDA Performance Measure PM1 (Jobs Created).",
  },
  {
    tcafProgram: "Trade Simulations & Workforce Training",
    edaPerformanceMeasure: "PM1",
    alignmentScore: 5,
    alignmentNotes: "75 Trade Sim lessons in 5 trades (welding, plumbing, HVAC, electrical, carpentry) translate to AWS D1.1, Hardy-Cross, and MNA certified credential attainment.",
    proposalContext: "Trade Simulation training produces industry-recognized certifications (AWS D1.1 welding, Hardy-Cross plumbing, MNA electrical) that feed directly into regional employer pipelines, generating PM1 (Jobs Created) outcomes.",
  },
  {
    tcafProgram: "Child Care Infrastructure",
    edaPerformanceMeasure: "PM2",
    alignmentScore: 5,
    alignmentNotes: "Child care stabilization enables working parents — particularly single mothers — to retain employment. Each sustained child care slot represents one retained job.",
    proposalContext: "Quality child care access directly enables parental workforce participation. TCAF's child care navigation and provider network expansion generates PM2 (Jobs Retained) outcomes for working parents who would otherwise exit the labor force.",
  },
  {
    tcafProgram: "Chainweb ROI Engine",
    edaPerformanceMeasure: "PM3",
    alignmentScore: 4,
    alignmentNotes: "Chainweb quantifies private investment leverage: every dollar invested in workforce development generates documented downstream private savings and reinvestment.",
    proposalContext: "TCAF's Chainweb ROI engine produces auditable, Census-anchored estimates of private investment leverage per CEDS region, directly measuring PM3 (Private Investment Leveraged).",
  },
  {
    tcafProgram: "Community Intelligence Platform",
    edaPerformanceMeasure: "PM5",
    alignmentScore: 4,
    alignmentNotes: "The platform's 721+ grant opportunities + RFP fidelity engine + coalition tools drive business formation and organizational capacity — PM5 alignment.",
    proposalContext: "ThriveUp's community intelligence platform assists businesses and nonprofits with grant navigation, compliance, and workforce planning — directly contributing to PM5 (Businesses Assisted).",
  },
  {
    tcafProgram: "Foster Care & Justice-Involved Workforce",
    edaPerformanceMeasure: "PM1",
    alignmentScore: 5,
    alignmentNotes: "Justice-involved and foster-care-adjacent adults represent the highest-ROI workforce investment: TCAF's RNR/CBI/NRRC framework turns high-cost system involvement into employed, taxpaying contributors.",
    proposalContext: "TCAF's justice-involved and foster-care workforce programming — grounded in RNR/CBI/NRRC evidence-based practices — creates documented first-time or re-entry employment for populations with multiplied PM1 impact per dollar invested.",
  },
  {
    tcafProgram: "Integration Through Invitation (Shadow Workers)",
    edaPerformanceMeasure: "PM1",
    alignmentScore: 4,
    alignmentNotes: "ITI formalizes informal caregivers, promotoras, peer mentors as stipended, credentialed workers — converting informal labor to formal employment.",
    proposalContext: "Integration Through Invitation converts informal community workers (promotoras, peer mentors, informal caregivers) into stipended, credentialed formal employees — generating PM1 (Jobs Created) outcomes from previously uncounted labor.",
  },
];

async function seed() {
  console.log("Seeding CEDS regions...");

  for (const region of TX_EDD_REGIONS) {
    // Upsert: delete existing then insert (simple approach)
    const existing = await db.select().from(cedsRegions)
      .where(eq(cedsRegions.eddAbbr, region.eddAbbr));

    let regionId: number;

    if (existing.length) {
      regionId = existing[0].id;
      console.log(`  Region exists: ${region.eddAbbr} (id=${regionId})`);
    } else {
      const [inserted] = await db.insert(cedsRegions).values(region).returning({ id: cedsRegions.id });
      regionId = inserted.id;
      console.log(`  Inserted region: ${region.eddAbbr} (id=${regionId})`);
    }

    // Seed TCAF alignments for this region (if not already there)
    const existingAlignments = await db.select().from(cedsAlignments)
      .where(eq(cedsAlignments.regionId, regionId));

    if (!existingAlignments.length) {
      for (const alignment of TCAF_PROGRAM_ALIGNMENTS) {
        await db.insert(cedsAlignments).values({ regionId, ...alignment });
      }
      console.log(`    Seeded ${TCAF_PROGRAM_ALIGNMENTS.length} alignments for ${region.eddAbbr}`);
    }

    // Seed standard goals (5 CEDS categories) for Nortex (WSNT region) with specifics
    const existingGoals = await db.select().from(cedsGoals).where(eq(cedsGoals.regionId, regionId));
    if (!existingGoals.length && region.eddAbbr === "NORTEX") {
      await db.insert(cedsGoals).values([
        {
          regionId,
          goalNumber: 1,
          category: "workforce",
          goalTitle: "Expand Child Care Infrastructure to Enable Parental Workforce Participation",
          goalDescription: "Increase licensed child care slots by 23% (from 1,032 to 1,268 children/day) and achieve a 62.2% job search success rate among parents accessing child care subsidies.",
          performanceMeasures: { primary: ["PM1","PM2"], targets: { PM1: 500, PM2: 1268 } },
          targetYear: 2030,
          tcafAlignment: "TCAF child care navigation + WSNT RFP2026-004 subrecipient services directly address this goal.",
          edaMeasureIds: ["PM1","PM2"],
        },
        {
          regionId,
          goalNumber: 2,
          category: "workforce",
          goalTitle: "Build a Certified Trades Workforce Pipeline for Rural North Texas",
          goalDescription: "Certify 300 workers annually in high-demand trades (welding, plumbing, electrical, HVAC) to serve the 11-county region's construction and energy sectors.",
          performanceMeasures: { primary: ["PM1"], targets: { PM1: 300 } },
          targetYear: 2028,
          tcafAlignment: "TCAF Trade Simulations (AWS D1.1, Hardy-Cross, MNA) directly feed this pipeline.",
          edaMeasureIds: ["PM1"],
        },
        {
          regionId,
          goalNumber: 3,
          category: "quality_of_life",
          goalTitle: "Reduce Child Poverty and Family Instability Through Integrated Services",
          goalDescription: "Reduce child poverty rate in the 11-county region by 10% through coordinated benefits navigation, fatherhood programming, and housing stability services.",
          performanceMeasures: { primary: ["PM2","PM5"], targets: { PM5: 400 } },
          targetYear: 2030,
          tcafAlignment: "TCAF Navigator + Dads Care 2 + Justice-Involved Workforce directly address this goal.",
          edaMeasureIds: ["PM2","PM5"],
        },
        {
          regionId,
          goalNumber: 4,
          category: "infrastructure",
          goalTitle: "Expand Broadband Access to Enable Remote Work and Telehealth",
          goalDescription: "Connect 85% of unserved rural households to broadband by 2028 to enable remote work, telehealth, and digital commerce.",
          performanceMeasures: { primary: ["PM3","PM4"], targets: { PM3: 5000000 } },
          targetYear: 2028,
          tcafAlignment: "TCAF Rural Connectivity Hub + USDA ReConnect screener support this goal.",
          edaMeasureIds: ["PM3","PM4"],
        },
        {
          regionId,
          goalNumber: 5,
          category: "economic_base",
          goalTitle: "Diversify the Agricultural Economy Through Value-Added Production",
          goalDescription: "Support 150 new agricultural businesses and value-added enterprises across the 11-county region.",
          performanceMeasures: { primary: ["PM5","PM3"], targets: { PM5: 150, PM3: 8000000 } },
          targetYear: 2030,
          tcafAlignment: "TCAF Farm Cooperative + Ag Trade Sims + USDA Farm Profitability tools address this.",
          edaMeasureIds: ["PM5","PM3"],
        },
      ]);
      console.log(`    Seeded 5 NORTEX goals`);
    }
  }

  console.log("\nCEDS seed complete.");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
