import type { Express } from "express";
import { db } from "./storage";
import { agSimSessions, insertAgSimSessionSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

// ─── IRRIGATION WATER BALANCE MODEL ────────────────────────────────────────
// Based on FAO-56 Reference Evapotranspiration (Penman-Monteith simplified)
interface IrrigationInputs {
  cropType: string;
  growthStage: string; // planting, vegetative, flowering, grain-fill, maturity
  soilType: string;    // sandy, loam, clay-loam, clay, silt-loam
  fieldAcres: number;
  currentSoilMoistureInches: number; // 0-available water capacity
  precipitationLastWeekInches: number;
  avgTempF: number;
  avgRelHumidityPct: number;
  windSpeedMph: number;
  solarRadiationMJm2: number; // optional, default to region estimate
}

// Crop coefficients (Kc) by growth stage — FAO-56 Table 12
const KC_BY_CROP: Record<string, Record<string, number>> = {
  CORN:     { planting: 0.30, vegetative: 0.80, flowering: 1.20, "grain-fill": 1.10, maturity: 0.60 },
  WHEAT:    { planting: 0.30, vegetative: 0.70, flowering: 1.15, "grain-fill": 0.90, maturity: 0.25 },
  SOYBEANS: { planting: 0.40, vegetative: 0.80, flowering: 1.15, "grain-fill": 1.00, maturity: 0.50 },
  COTTON:   { planting: 0.35, vegetative: 0.70, flowering: 1.20, "grain-fill": 1.05, maturity: 0.60 },
  SORGHUM:  { planting: 0.30, vegetative: 0.75, flowering: 1.10, "grain-fill": 1.00, maturity: 0.50 },
  DEFAULT:  { planting: 0.35, vegetative: 0.75, flowering: 1.15, "grain-fill": 1.00, maturity: 0.50 },
};

// Soil water capacity (inches per foot)
const SOIL_CAPACITY: Record<string, { awc: number; drainageRate: number }> = {
  sandy: { awc: 0.6, drainageRate: 0.35 },
  loam: { awc: 1.5, drainageRate: 0.20 },
  "clay-loam": { awc: 1.8, drainageRate: 0.12 },
  clay: { awc: 2.0, drainageRate: 0.08 },
  "silt-loam": { awc: 1.7, drainageRate: 0.15 },
};

function calculateETo(tempF: number, relHumPct: number, windMph: number, solarMJm2?: number): number {
  // Simplified Hargreaves-Samani ET reference (mm/day)
  const tempC = (tempF - 32) * 5 / 9;
  const es = 0.6108 * Math.exp(17.27 * tempC / (tempC + 237.3));
  const ea = es * (relHumPct / 100);
  const vpd = es - ea;
  const windMs = windMph * 0.44704;
  const Ra = solarMJm2 || (Math.max(8, Math.min(25, tempC / 40 * 20 + 10)));
  const ETo = 0.0023 * Ra * (tempC + 17.8) * Math.sqrt(Math.abs(tempC - 10) + 1) * 0.408;
  return Math.max(0, ETo + vpd * windMs * 0.05); // mm/day
}

function runIrrigationSim(inputs: IrrigationInputs): Record<string, any> {
  const crop = inputs.cropType?.toUpperCase() || "DEFAULT";
  const stage = inputs.growthStage || "vegetative";
  const soil = inputs.soilType || "loam";
  const kc = (KC_BY_CROP[crop] || KC_BY_CROP.DEFAULT)[stage] || 1.0;
  const soilProps = SOIL_CAPACITY[soil] || SOIL_CAPACITY.loam;

  const eToMmDay = calculateETo(inputs.avgTempF, inputs.avgRelHumidityPct, inputs.windSpeedMph, inputs.solarRadiationMJm2);
  const etcMmDay = eToMmDay * kc; // crop ET demand (mm/day)
  const etcInchesWeek = (etcMmDay * 7) / 25.4;

  const precipIn = inputs.precipitationLastWeekInches || 0;
  const soilMoistureIn = inputs.currentSoilMoistureInches || soilProps.awc * 2;
  const madThreshold = soilProps.awc * 0.5; // management allowed depletion = 50% AWC

  const currentDeficitIn = Math.max(0, etcInchesWeek - precipIn);
  const availableWater = soilMoistureIn - (soilProps.awc * 0.5); // above MAD threshold
  const irrigationNeededIn = Math.max(0, currentDeficitIn - availableWater);
  const irrigationGallonsAcre = irrigationNeededIn * 27154; // gallons per acre-inch
  const irrigationGallonsField = irrigationGallonsAcre * inputs.fieldAcres;

  const recommendation = irrigationNeededIn === 0
    ? "No irrigation needed this week — soil moisture and precipitation are sufficient."
    : irrigationNeededIn < 0.5
    ? `Light irrigation: apply ${irrigationNeededIn.toFixed(2)} inches (${Math.round(irrigationGallonsField).toLocaleString()} gallons for ${inputs.fieldAcres} acres). Soil is approaching stress threshold.`
    : `Irrigation needed: apply ${irrigationNeededIn.toFixed(2)} inches (${Math.round(irrigationGallonsField).toLocaleString()} gallons for ${inputs.fieldAcres} acres). Crop is at or below management allowed depletion.`;

  return {
    model: "FAO-56 Penman-Monteith simplified (Hargreaves-Samani)",
    inputs,
    cropCoefficient: kc,
    eToMmPerDay: Math.round(eToMmDay * 100) / 100,
    etcMmPerDay: Math.round(etcMmDay * 100) / 100,
    weeklyEtcInches: Math.round(etcInchesWeek * 100) / 100,
    weeklyPrecipInches: precipIn,
    netWaterDeficitInches: Math.round(currentDeficitIn * 100) / 100,
    soilAvailableWaterInches: Math.round(availableWater * 100) / 100,
    irrigationNeededInches: Math.round(irrigationNeededIn * 100) / 100,
    irrigationGallonsAcre: Math.round(irrigationGallonsAcre),
    irrigationGallonsTotal: Math.round(irrigationGallonsField),
    recommendation,
    stressRisk: irrigationNeededIn > 1.5 ? "HIGH" : irrigationNeededIn > 0.5 ? "MODERATE" : "LOW",
    madThresholdInches: Math.round(madThreshold * 100) / 100,
  };
}

// ─── SOIL AMENDMENT MODEL ────────────────────────────────────────────────────
interface SoilAmendmentInputs {
  targetCrop: string;
  soilPh: number;
  organicMatterPct: number;
  nitrogenLbsAc: number;    // from soil test
  phosphorusLbsAc: number;
  potassiumLbsAc: number;
  cationExchangeCapacity: number; // CEC meq/100g
  acres: number;
}

// Nutrient sufficiency ranges by crop (from Land Grant Extension standards)
const NUTRIENT_TARGETS: Record<string, { phMin: number; phMax: number; nMin: number; pMin: number; kMin: number }> = {
  CORN:     { phMin: 6.0, phMax: 6.8, nMin: 150, pMin: 25, kMin: 120 },
  SOYBEANS: { phMin: 6.0, phMax: 6.8, nMin: 0,   pMin: 25, kMin: 120 },
  WHEAT:    { phMin: 5.8, phMax: 6.5, nMin: 100, pMin: 20, kMin: 100 },
  COTTON:   { phMin: 5.8, phMax: 7.0, nMin: 80,  pMin: 20, kMin: 100 },
  VEGETABLE:{ phMin: 6.0, phMax: 7.0, nMin: 100, pMin: 30, kMin: 140 },
  DEFAULT:  { phMin: 6.0, phMax: 7.0, nMin: 100, pMin: 25, kMin: 100 },
};

function runSoilAmendmentSim(inputs: SoilAmendmentInputs): Record<string, any> {
  const crop = inputs.targetCrop?.toUpperCase() || "DEFAULT";
  const targets = NUTRIENT_TARGETS[crop] || NUTRIENT_TARGETS.DEFAULT;

  const recommendations: string[] = [];
  const amendments: Array<{ amendment: string; rateLbsAc: number; totalLbsField: number; estimatedCostAc: number; source: string }> = [];

  // pH correction
  let phStatus = "optimal";
  if (inputs.soilPh < targets.phMin) {
    phStatus = "acidic";
    const limeNeeded = (targets.phMin - inputs.soilPh) * inputs.cationExchangeCapacity * 200; // simplified
    amendments.push({ amendment: "Ag Lime (calcium carbonate)", rateLbsAc: Math.round(limeNeeded), totalLbsField: Math.round(limeNeeded * inputs.acres), estimatedCostAc: Math.round(limeNeeded * 0.05), source: "NRCS practice 333 — Amending Soil Properties" });
    recommendations.push(`Soil pH ${inputs.soilPh} is below ${targets.phMin} target for ${inputs.targetCrop}. Apply ${Math.round(limeNeeded)} lbs/ac agricultural lime. Test again in 6 months.`);
  } else if (inputs.soilPh > targets.phMax) {
    phStatus = "alkaline";
    const sulfurNeeded = (inputs.soilPh - targets.phMax) * inputs.cationExchangeCapacity * 150;
    amendments.push({ amendment: "Elemental Sulfur", rateLbsAc: Math.round(sulfurNeeded), totalLbsField: Math.round(sulfurNeeded * inputs.acres), estimatedCostAc: Math.round(sulfurNeeded * 0.30), source: "NRCS guidance — acidifying amendments" });
    recommendations.push(`Soil pH ${inputs.soilPh} is above ${targets.phMax} target. Apply ${Math.round(sulfurNeeded)} lbs/ac elemental sulfur. Re-test in 12 months.`);
  } else {
    recommendations.push(`Soil pH ${inputs.soilPh} is within the ${targets.phMin}–${targets.phMax} optimal range for ${inputs.targetCrop}.`);
  }

  // Nitrogen
  const nDeficit = Math.max(0, targets.nMin - inputs.nitrogenLbsAc);
  if (nDeficit > 0) {
    amendments.push({ amendment: "Urea (46-0-0)", rateLbsAc: Math.round(nDeficit / 0.46), totalLbsField: Math.round((nDeficit / 0.46) * inputs.acres), estimatedCostAc: Math.round((nDeficit / 0.46) * 0.35), source: "Extension N recommendation tables" });
    recommendations.push(`Nitrogen deficient: ${inputs.nitrogenLbsAc} vs ${targets.nMin} lbs/ac target. Apply ${Math.round(nDeficit / 0.46)} lbs/ac urea in split applications.`);
  }

  // Phosphorus
  const pDeficit = Math.max(0, targets.pMin - inputs.phosphorusLbsAc);
  if (pDeficit > 0) {
    amendments.push({ amendment: "DAP (18-46-0)", rateLbsAc: Math.round(pDeficit / 0.46), totalLbsField: Math.round((pDeficit / 0.46) * inputs.acres), estimatedCostAc: Math.round((pDeficit / 0.46) * 0.42), source: "Extension P recommendation tables" });
    recommendations.push(`Phosphorus deficient: ${inputs.phosphorusLbsAc} vs ${targets.pMin} lbs/ac target. Apply ${Math.round(pDeficit / 0.46)} lbs/ac DAP.`);
  }

  // Potassium
  const kDeficit = Math.max(0, targets.kMin - inputs.potassiumLbsAc);
  if (kDeficit > 0) {
    amendments.push({ amendment: "Muriate of Potash (0-0-60)", rateLbsAc: Math.round(kDeficit / 0.60), totalLbsField: Math.round((kDeficit / 0.60) * inputs.acres), estimatedCostAc: Math.round((kDeficit / 0.60) * 0.28), source: "Extension K recommendation tables" });
    recommendations.push(`Potassium deficient: ${inputs.potassiumLbsAc} vs ${targets.kMin} lbs/ac target. Apply ${Math.round(kDeficit / 0.60)} lbs/ac MOP.`);
  }

  // Organic matter
  if (inputs.organicMatterPct < 2.5) {
    recommendations.push(`Low organic matter (${inputs.organicMatterPct}%). Consider cover crops, reduced tillage, or compost additions to build SOM toward 3%+ over 3-5 years.`);
  }

  const totalEstimatedCost = amendments.reduce((s, a) => s + a.estimatedCostAc * inputs.acres, 0);

  return {
    model: "Land Grant Extension Soil Test Interpretation + NRCS Amendment Guidelines",
    inputs,
    soilHealthSummary: { phStatus, organicMatterStatus: inputs.organicMatterPct >= 3.5 ? "excellent" : inputs.organicMatterPct >= 2.5 ? "adequate" : "low" },
    amendments,
    recommendations,
    estimatedTotalCost: Math.round(totalEstimatedCost),
    eqipEligibility: "EQIP Nutrient Management (Practice 590) may cost-share these amendments. Contact your local NRCS office.",
    source: "Land grant extension soil test tables + NRCS practice standards",
  };
}

// ─── COVER CROP ROTATION MODEL ───────────────────────────────────────────────
interface CoverCropInputs {
  primaryCrop: string;
  previousCrops: string[]; // last 2 years
  soilPh: number;
  organicMatterPct: number;
  avgAnnualPrecipIn: number; // annual precipitation
  state: string;
  goals: string[]; // nitrogen-fixation, erosion-control, weed-suppression, soil-health, cash-flow, pollinator
}

const COVER_CROP_OPTIONS = [
  { name: "Cereal Rye", category: "grass", nitrogenFixation: false, biomassLbsAc: 4000, winterHardy: true, droughtTolerant: false, benefits: ["erosion-control","weed-suppression","soil-health"], seedCostAc: 25, termMethod: "herbicide or roller-crimper" },
  { name: "Crimson Clover", category: "legume", nitrogenFixation: true, nFixLbsAc: 80, biomassLbsAc: 2500, winterHardy: false, droughtTolerant: false, benefits: ["nitrogen-fixation","pollinator","soil-health"], seedCostAc: 20, termMethod: "herbicide before 25% bloom" },
  { name: "Hairy Vetch", category: "legume", nitrogenFixation: true, nFixLbsAc: 120, biomassLbsAc: 3500, winterHardy: true, droughtTolerant: false, benefits: ["nitrogen-fixation","soil-health","cash-flow"], seedCostAc: 35, termMethod: "herbicide before pod-set" },
  { name: "Winter Wheat (CC)", category: "grass", nitrogenFixation: false, biomassLbsAc: 5000, winterHardy: true, droughtTolerant: false, benefits: ["erosion-control","weed-suppression"], seedCostAc: 30, termMethod: "grazing or herbicide" },
  { name: "Sunflower", category: "broadleaf", nitrogenFixation: false, biomassLbsAc: 3000, winterHardy: false, droughtTolerant: true, benefits: ["pollinator","cash-flow","weed-suppression"], seedCostAc: 18, termMethod: "natural frost or herbicide" },
  { name: "Sorghum-Sudan Hybrid", category: "grass", nitrogenFixation: false, biomassLbsAc: 8000, winterHardy: false, droughtTolerant: true, benefits: ["soil-health","weed-suppression","erosion-control"], seedCostAc: 20, termMethod: "frost or herbicide" },
  { name: "Radish (Tillage)", category: "broadleaf", nitrogenFixation: false, biomassLbsAc: 2000, winterHardy: false, droughtTolerant: false, benefits: ["soil-health","erosion-control"], seedCostAc: 20, termMethod: "winter-kill (usually)" },
  { name: "Cowpea", category: "legume", nitrogenFixation: true, nFixLbsAc: 90, biomassLbsAc: 2500, winterHardy: false, droughtTolerant: true, benefits: ["nitrogen-fixation","soil-health","pollinator"], seedCostAc: 25, termMethod: "frost or herbicide" },
  { name: "Austrian Winter Pea", category: "legume", nitrogenFixation: true, nFixLbsAc: 100, biomassLbsAc: 2000, winterHardy: true, droughtTolerant: false, benefits: ["nitrogen-fixation","soil-health"], seedCostAc: 30, termMethod: "herbicide in spring" },
  { name: "Buckwheat", category: "broadleaf", nitrogenFixation: false, biomassLbsAc: 1500, winterHardy: false, droughtTolerant: false, benefits: ["pollinator","weed-suppression","cash-flow"], seedCostAc: 25, termMethod: "before seed set" },
];

function runCoverCropSim(inputs: CoverCropInputs): Record<string, any> {
  const goals = inputs.goals || ["soil-health"];
  const droughtState = ["TX","OK","KS","NM","AZ","CO","NV","UT","MT","WY"].includes(inputs.state?.toUpperCase());
  const coldState = ["ND","SD","MN","WI","MI","MT","MN","WY","CO","ID"].includes(inputs.state?.toUpperCase());

  const scored = COVER_CROP_OPTIONS.map(cc => {
    let score = 0;
    for (const g of goals) if (cc.benefits.includes(g)) score += 2;
    if (droughtState && cc.droughtTolerant) score += 1;
    if (coldState && !cc.winterHardy) score -= 1;
    if (inputs.avgAnnualPrecipIn < 20 && !cc.droughtTolerant) score -= 1;
    // Avoid repeating same family
    if (inputs.previousCrops?.some(p => p.toLowerCase().includes(cc.category.toLowerCase()))) score -= 0.5;
    return { ...cc, score };
  }).sort((a, b) => b.score - a.score).slice(0, 4);

  const topPick = scored[0];
  const projectedSoilOmGain = (topPick.biomassLbsAc / 2000) * 0.03 * 0.58; // rough OM gain (%/yr)

  return {
    model: "Land Grant Extension Cover Crop Selector + NRCS Practice 340",
    inputs,
    recommendations: scored.map(cc => ({
      name: cc.name, category: cc.category, score: cc.score,
      benefits: cc.benefits, seedCostPerAc: cc.seedCostAc,
      estimatedBiomassLbsAc: cc.biomassLbsAc,
      nitrogenFixationLbsAc: (cc as any).nFixLbsAc || 0,
      winterHardy: cc.winterHardy, droughtTolerant: cc.droughtTolerant,
      terminationMethod: cc.termMethod,
    })),
    projectedSoilOmGain5Yr: Math.round(projectedSoilOmGain * 5 * 100) / 100,
    currentOm: inputs.organicMatterPct,
    projectedOm5Yr: Math.min(6, inputs.organicMatterPct + projectedSoilOmGain * 5),
    cspEligibility: "CSP Enhancement Activity ED23 — Intensive Cover Crop Rotation may qualify for $18+/ac annual payments.",
    eqipPractice: "EQIP Practice 340 — Cover Crop — may cover 50% of seed cost.",
    source: "NRCS Cover Crop Practice Standard 340 + Land Grant Extension cover crop guides",
  };
}

export function registerAgTradeSimsRoutes(app: Express) {

  // Run irrigation simulation
  app.post("/api/ag-sims/irrigation", async (req, res) => {
    try {
      const inputs: IrrigationInputs = req.body;
      if (!inputs.cropType || !inputs.fieldAcres) return res.status(400).json({ error: "cropType and fieldAcres required" });
      const results = runIrrigationSim(inputs);

      // AI enhanced recommendation
      try {
        const prompt = `You are an agricultural water management specialist. A farmer has run an irrigation simulation with the following results:
${JSON.stringify(results, null, 2)}

Add 1-2 sentences of context about why the irrigation recommendation matters for ${inputs.cropType} at the ${inputs.growthStage} growth stage, and one water conservation tip. Return as JSON: { aiNote: string }`;
        const ai = await generateAIJSON(prompt, '{"aiNote":""}') as { aiNote: string };
        results.aiNote = ai.aiNote;
      } catch { results.aiNote = ""; }

      // Save session
      try {
        await db.insert(agSimSessions).values({
          simType: "irrigation", title: `${inputs.cropType} irrigation — ${inputs.fieldAcres} acres`,
          inputsJson: JSON.stringify(inputs), resultsJson: JSON.stringify(results),
          aiRecommendation: results.aiNote,
          userId: req.user ? (req.user as any).id : null,
          sessionToken: req.headers["x-session-token"] as string || null,
          completedAt: new Date(),
        });
      } catch { /* non-fatal */ }

      res.json(results);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Run soil amendment simulation
  app.post("/api/ag-sims/soil-amendment", async (req, res) => {
    try {
      const inputs: SoilAmendmentInputs = req.body;
      if (!inputs.targetCrop || !inputs.soilPh || !inputs.acres) return res.status(400).json({ error: "targetCrop, soilPh, and acres required" });
      const results = runSoilAmendmentSim(inputs);

      try {
        const prompt = `You are a certified crop advisor (CCA) helping a farmer interpret their soil amendment plan for ${inputs.targetCrop}. Briefly explain the most important action in the amendment plan in 2 plain-language sentences. Return as JSON: { aiNote: string }`;
        const ai = await generateAIJSON(prompt, '{"aiNote":""}') as { aiNote: string };
        results.aiNote = ai.aiNote;
      } catch { results.aiNote = ""; }

      try {
        await db.insert(agSimSessions).values({
          simType: "soil-amendment", title: `${inputs.targetCrop} soil amendment — ${inputs.acres} acres`,
          inputsJson: JSON.stringify(inputs), resultsJson: JSON.stringify(results),
          aiRecommendation: results.aiNote,
          userId: req.user ? (req.user as any).id : null,
          sessionToken: req.headers["x-session-token"] as string || null,
          completedAt: new Date(),
        });
      } catch { /* non-fatal */ }

      res.json(results);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Run cover crop rotation simulation
  app.post("/api/ag-sims/cover-crop", async (req, res) => {
    try {
      const inputs: CoverCropInputs = req.body;
      if (!inputs.primaryCrop || !inputs.state) return res.status(400).json({ error: "primaryCrop and state required" });
      const results = runCoverCropSim(inputs);

      try {
        const prompt = `A farmer in ${inputs.state} growing ${inputs.primaryCrop} is evaluating cover crops. Their top recommendation is ${results.recommendations[0]?.name}. Write 2 sentences explaining why this cover crop is the best fit for their goals (${inputs.goals?.join(", ")}). Return as JSON: { aiNote: string }`;
        const ai = await generateAIJSON(prompt, '{"aiNote":""}') as { aiNote: string };
        results.aiNote = ai.aiNote;
      } catch { results.aiNote = ""; }

      try {
        await db.insert(agSimSessions).values({
          simType: "cover-crop-rotation", title: `${inputs.primaryCrop} cover crop plan — ${inputs.state}`,
          inputsJson: JSON.stringify(inputs), resultsJson: JSON.stringify(results),
          aiRecommendation: results.aiNote,
          userId: req.user ? (req.user as any).id : null,
          sessionToken: req.headers["x-session-token"] as string || null,
          completedAt: new Date(),
        });
      } catch { /* non-fatal */ }

      res.json(results);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get recent sessions
  app.get("/api/ag-sims/sessions", async (req, res) => {
    const userId = req.user ? (req.user as any).id : null;
    const sessionToken = req.headers["x-session-token"] as string;
    if (!userId && !sessionToken) return res.json({ sessions: [] });
    const sessions = await db.select().from(agSimSessions)
      .where(userId ? eq(agSimSessions.userId, userId) : eq(agSimSessions.sessionToken, sessionToken))
      .orderBy(desc(agSimSessions.createdAt));
    res.json({ sessions: sessions.slice(0, 10) });
  });

  // Credential pathways for ag practitioners
  app.get("/api/ag-sims/credentials", async (req, res) => {
    res.json({
      credentials: [
        { name: "Certified Crop Adviser (CCA)", org: "American Society of Agronomy", url: "https://www.certifiedcropadviser.org/", description: "Nationally recognized crop management credential. Requires exam + experience.", simConnection: "All three simulators" },
        { name: "NRCS Conservation Practice Specialist", org: "USDA NRCS", url: "https://www.nrcs.usda.gov/", description: "NRCS requires CPS designation for conservation practice design including irrigation (430-I) and nutrient management (590).", simConnection: "Soil amendment, Irrigation" },
        { name: "State Pesticide Applicator License", org: "State Dept of Agriculture (varies)", url: "https://npic.orst.edu/reg/state_agencies.html", description: "Required for commercial pesticide application. Categories vary by state.", simConnection: "Cover crop termination, soil amendment" },
        { name: "Certified Irrigation Designer (CID)", org: "Irrigation Association", url: "https://www.irrigation.org/IA/Certification/", description: "Irrigation system design certification. Relevant to large-scale irrigation planning.", simConnection: "Irrigation" },
        { name: "NRCS AgLearn Conservation Planning", org: "USDA NRCS / AgLearn", url: "https://aglearn.usda.gov/", description: "Free USDA online training covering conservation planning, EQIP, and practice standards.", simConnection: "All three simulators" },
      ],
      source: "USDA NRCS + American Society of Agronomy + Irrigation Association",
    });
  });
}
