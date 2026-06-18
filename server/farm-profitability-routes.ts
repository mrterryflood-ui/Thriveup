import type { Express } from "express";
import { db } from "./storage";
import { farmProfitabilitySnapshots, insertFarmProfitabilitySnapshotSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

const NASS_KEY = process.env.USDA_NASS_API_KEY || "DEMO_KEY";

// Reference prices ($/unit) — 2024 USDA reference prices used in PLC program
// Source: 2018/2024 Farm Bill PLC reference prices
const PLC_REFERENCE_PRICES: Record<string, { price: number; unit: string; refPrice: number }> = {
  "CORN":        { price: 5.2,   unit: "$ / BU",  refPrice: 3.70 },
  "SOYBEANS":    { price: 13.5,  unit: "$ / BU",  refPrice: 8.40 },
  "WHEAT":       { price: 6.2,   unit: "$ / BU",  refPrice: 5.50 },
  "SORGHUM":     { price: 4.8,   unit: "$ / BU",  refPrice: 3.95 },
  "BARLEY":      { price: 5.5,   unit: "$ / BU",  refPrice: 4.95 },
  "OATS":        { price: 3.8,   unit: "$ / BU",  refPrice: 2.00 },
  "COTTON":      { price: 0.82,  unit: "$ / LB",  refPrice: 0.6698 },
  "RICE":        { price: 14.7,  unit: "$ / CWT", refPrice: 14.00 },
  "PEANUTS":     { price: 0.27,  unit: "$ / LB",  refPrice: 0.2675 },
  "SUNFLOWERS":  { price: 0.22,  unit: "$ / LB",  refPrice: 0.1935 },
  "CATTLE":      { price: 185.0, unit: "$ / CWT", refPrice: 0 },
  "HOGS":        { price: 62.0,  unit: "$ / CWT", refPrice: 0 },
  "DAIRY":       { price: 20.5,  unit: "$ / CWT", refPrice: 0 },
  "BROILERS":    { price: 0.72,  unit: "$ / LB",  refPrice: 0 },
};

// Typical input costs by commodity ($/acre, 2022-2024 averages)
// Sources: USDA ERS, Purdue Agricultural Economics, Iowa State Extension
const TYPICAL_INPUT_COSTS: Record<string, { seed: number; fert: number; chem: number; fuel: number; labor: number; other: number }> = {
  "CORN":       { seed: 115, fert: 185, chem: 60,  fuel: 35, labor: 25, other: 80  },
  "SOYBEANS":   { seed: 75,  fert: 50,  chem: 55,  fuel: 28, labor: 20, other: 60  },
  "WHEAT":      { seed: 45,  fert: 100, chem: 40,  fuel: 25, labor: 18, other: 50  },
  "SORGHUM":    { seed: 30,  fert: 120, chem: 45,  fuel: 30, labor: 20, other: 55  },
  "COTTON":     { seed: 80,  fert: 120, chem: 90,  fuel: 40, labor: 60, other: 90  },
  "RICE":       { seed: 80,  fert: 150, chem: 80,  fuel: 50, labor: 40, other: 100 },
  "PEANUTS":    { seed: 180, fert: 80,  chem: 120, fuel: 40, labor: 80, other: 100 },
  "CATTLE":     { seed: 0,   fert: 30,  chem: 20,  fuel: 25, labor: 35, other: 100 }, // per head basis
  "HOGS":       { seed: 0,   fert: 0,   chem: 15,  fuel: 15, labor: 30, other: 60  },
};

async function nassPrice(commodity: string, stateFips?: string): Promise<{ price: number; unit: string; year: number } | null> {
  const qs = new URLSearchParams({
    key: NASS_KEY, format: "json",
    commodity_desc: commodity.toUpperCase(),
    statisticcat_desc: "PRICE RECEIVED",
    agg_level_desc: stateFips ? "STATE" : "NATIONAL",
    freq_desc: "ANNUAL",
    year__GE: "2021",
    ...(stateFips ? { state_fips_code: stateFips } : {}),
  });
  try {
    const res = await fetch(`https://quickstats.nass.usda.gov/api/?${qs}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    const rows = (data?.data || []).filter((r: any) => r.Value && r.Value !== " (D)" && r.Value !== "(NA)");
    if (!rows.length) return null;
    const sorted = rows.sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year));
    const r = sorted[0];
    return { price: parseFloat(r.Value.replace(/,/g, "")), unit: r.unit_desc, year: parseInt(r.year) };
  } catch { return null; }
}

async function nassYield(commodity: string, stateFips?: string, countyFips?: string): Promise<{ yield: number; unit: string; year: number } | null> {
  const qs = new URLSearchParams({
    key: NASS_KEY, format: "json",
    commodity_desc: commodity.toUpperCase(),
    statisticcat_desc: "YIELD",
    agg_level_desc: countyFips ? "COUNTY" : stateFips ? "STATE" : "NATIONAL",
    freq_desc: "ANNUAL",
    year__GE: "2020",
    ...(stateFips ? { state_fips_code: stateFips } : {}),
    ...(countyFips ? { county_code: countyFips.padStart(3,"0") } : {}),
  });
  try {
    const res = await fetch(`https://quickstats.nass.usda.gov/api/?${qs}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    const rows = (data?.data || []).filter((r: any) => r.Value && r.Value !== " (D)" && r.Value !== "(NA)");
    if (!rows.length) return null;
    const sorted = rows.sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year));
    const r = sorted[0];
    return { yield: parseFloat(r.Value.replace(/,/g, "")), unit: r.unit_desc, year: parseInt(r.year) };
  } catch { return null; }
}

export function registerFarmProfitabilityRoutes(app: Express) {

  // Get market benchmarks (NASS prices + typical costs) for a commodity
  app.get("/api/farm-profitability/benchmarks", async (req, res) => {
    const { commodity, stateFips, countyFips } = req.query as Record<string, string>;
    if (!commodity) return res.status(400).json({ error: "commodity required" });
    const key = commodity.toUpperCase();

    const [nassP, nassY] = await Promise.all([
      nassPrice(key, stateFips),
      nassYield(key, stateFips, countyFips),
    ]);

    const builtInRef = PLC_REFERENCE_PRICES[key];
    const builtInCosts = TYPICAL_INPUT_COSTS[key];

    res.json({
      commodity: key,
      nassPrice: nassP || { price: builtInRef?.price || null, unit: builtInRef?.unit || null, year: 2022, note: "NASS did not return live data — using 2022 approximate" },
      nassYield: nassY || { yield: null, unit: null, year: 2022, note: "NASS county/state yield not available — enter farm-specific yield" },
      plcReferencePrice: builtInRef?.refPrice || null,
      typicalInputCostsPerAcre: builtInCosts || null,
      source: "USDA NASS QuickStats + USDA FSA PLC Reference Prices (2024 Farm Bill) + Extension input cost surveys",
      disclaimer: "Market prices are USDA annual averages — not current spot prices. Verify at ams.usda.gov/market-news or CME Group.",
    });
  });

  // Calculate profitability scenario
  app.post("/api/farm-profitability/calculate", async (req, res) => {
    const {
      commodity, acres, yieldPerAcre, pricePerUnit, priceUnit,
      seedCostPerAc, fertCostPerAc, chemCostPerAc, fuelCostPerAc, laborCostPerAc, otherCostPerAc,
      stateFips, countyFips, countyName, cropYear, snapshotName,
    } = req.body;

    if (!commodity || !acres || !yieldPerAcre || !pricePerUnit) {
      return res.status(400).json({ error: "commodity, acres, yieldPerAcre, pricePerUnit required" });
    }

    const totalInputCostPerAc = (seedCostPerAc || 0) + (fertCostPerAc || 0) + (chemCostPerAc || 0)
      + (fuelCostPerAc || 0) + (laborCostPerAc || 0) + (otherCostPerAc || 0);
    const grossRevPerAc = yieldPerAcre * pricePerUnit;
    const netReturnPerAc = grossRevPerAc - totalInputCostPerAc;
    const grossRevenueTotal = grossRevPerAc * acres;
    const totalInputCostTotal = totalInputCostPerAc * acres;
    const netReturnTotal = netReturnPerAc * acres;
    const breakEvenPrice = totalInputCostPerAc > 0 ? totalInputCostPerAc / yieldPerAcre : null;

    // Fetch NASS benchmarks for comparison
    const [nassP, nassY] = await Promise.all([
      nassPrice(commodity.toUpperCase(), stateFips),
      nassYield(commodity.toUpperCase(), stateFips, countyFips),
    ]);

    // FSA rough estimates (ARC-CO and PLC) — simplified
    const refPrice = PLC_REFERENCE_PRICES[commodity.toUpperCase()]?.refPrice || 0;
    const plcPaymentPerAc = refPrice > 0 && pricePerUnit < refPrice
      ? Math.min((refPrice - pricePerUnit) * yieldPerAcre * 0.85, 125)
      : 0;
    const arcCoPaymentPerAc = nassY && nassP
      ? Math.max(0, (nassY.yield * nassP.price * 0.86) - (yieldPerAcre * pricePerUnit)) * 0.85
      : 0;

    // AI insights
    let aiInsights = "";
    try {
      const prompt = `You are a farm financial advisor analyzing a crop enterprise budget for ${commodity} in ${countyName || "an unknown county"}, ${cropYear || new Date().getFullYear()}.

Farm inputs: ${acres} acres, yield=${yieldPerAcre} units/ac, price=$${pricePerUnit}/${priceUnit || "unit"}
Costs/ac: seed=$${seedCostPerAc || 0}, fertilizer=$${fertCostPerAc || 0}, chemicals=$${chemCostPerAc || 0}, fuel=$${fuelCostPerAc || 0}, labor=$${laborCostPerAc || 0}, other=$${otherCostPerAc || 0}
Results: net return=$${netReturnPerAc.toFixed(2)}/ac, break-even price=$${breakEvenPrice?.toFixed(2) || "N/A"}, total net return=$${netReturnTotal.toFixed(0)}

USDA NASS comparison: avg price=$${nassP?.price || "N/A"}/${nassP?.unit || "unit"} (${nassP?.year || "?"}), avg yield=${nassY?.yield || "N/A"} ${nassY?.unit || "units"}/ac (${nassY?.year || "?"})

Write 2-3 sentences of plain-language insights covering: (1) how this farm compares to USDA benchmarks, (2) one specific area to improve profitability. Return as JSON: { insights: string }`;
      const r = await generateAIJSON(prompt, '{"insights":""}') as { insights: string };
      aiInsights = r.insights || "";
    } catch { aiInsights = ""; }

    // Save snapshot
    let snapshotId: number | null = null;
    try {
      const payload = insertFarmProfitabilitySnapshotSchema.parse({
        commodity: commodity.toUpperCase(), cropYear: cropYear || new Date().getFullYear(),
        snapshotName: snapshotName || `${commodity} ${cropYear || new Date().getFullYear()} — ${acres} acres`,
        stateFips, countyFips, countyName,
        acres, yieldPerAcre, pricePerUnit, priceUnit,
        grossRevenueTotal, totalInputCostPerAc, totalInputCostTotal,
        netReturnPerAc, netReturnTotal, breakEvenPrice,
        nassAvgPrice: nassP?.price || null,
        nassAvgYield: nassY?.yield || null,
        fsaArcCoPaymentEstimate: arcCoPaymentPerAc * acres,
        fsaPlcPaymentEstimate: plcPaymentPerAc * acres,
        aiInsights,
        userId: req.user ? (req.user as any).id : null,
        sessionToken: req.headers["x-session-token"] as string || null,
      });
      const [snap] = await db.insert(farmProfitabilitySnapshots).values(payload).returning();
      snapshotId = snap.id;
    } catch { /* non-fatal */ }

    res.json({
      snapshotId,
      commodity: commodity.toUpperCase(),
      acres,
      grossRevenue: { perAcre: Math.round(grossRevPerAc * 100) / 100, total: Math.round(grossRevenueTotal) },
      inputCosts: { perAcre: Math.round(totalInputCostPerAc * 100) / 100, total: Math.round(totalInputCostTotal) },
      netReturn: { perAcre: Math.round(netReturnPerAc * 100) / 100, total: Math.round(netReturnTotal) },
      breakEvenPrice: breakEvenPrice ? Math.round(breakEvenPrice * 100) / 100 : null,
      priceUnit: priceUnit || "unit",
      nassComparison: {
        nassAvgPrice: nassP?.price || null, nassAvgPriceUnit: nassP?.unit || null, nassAvgPriceYear: nassP?.year || null,
        nassAvgYield: nassY?.yield || null, nassAvgYieldUnit: nassY?.unit || null, nassAvgYieldYear: nassY?.year || null,
        priceVsNass: nassP?.price ? ((pricePerUnit - nassP.price) / nassP.price * 100).toFixed(1) + "%" : null,
        yieldVsNass: nassY?.yield ? ((yieldPerAcre - nassY.yield) / nassY.yield * 100).toFixed(1) + "%" : null,
      },
      fsaEstimates: {
        plcPaymentPerAc: Math.round(plcPaymentPerAc * 100) / 100,
        plcPaymentTotal: Math.round(plcPaymentPerAc * acres),
        arcCoPaymentPerAc: Math.round(arcCoPaymentPerAc * 100) / 100,
        arcCoPaymentTotal: Math.round(arcCoPaymentPerAc * acres),
        disclaimer: "FSA payment estimates are illustrative only. Actual payments depend on FSA county office review and enrolled base acres.",
      },
      aiInsights,
      source: "USDA NASS QuickStats + FSA PLC reference prices + Extension input cost surveys",
    });
  });

  // Get saved snapshots (auth required or session)
  app.get("/api/farm-profitability/snapshots", async (req, res) => {
    const userId = req.user ? (req.user as any).id : null;
    const sessionToken = req.headers["x-session-token"] as string;
    if (!userId && !sessionToken) return res.json({ snapshots: [] });
    const all = await db.select().from(farmProfitabilitySnapshots)
      .where(userId ? eq(farmProfitabilitySnapshots.userId, userId) : eq(farmProfitabilitySnapshots.sessionToken, sessionToken));
    res.json({ snapshots: all.slice(0, 20) });
  });

  // Commodity comparison (side-by-side enterprise budget for 2 crops)
  app.post("/api/farm-profitability/compare", async (req, res) => {
    const { commodities, acres, stateFips } = req.body;
    if (!Array.isArray(commodities) || commodities.length < 2) {
      return res.status(400).json({ error: "commodities array with at least 2 items required" });
    }
    const results = await Promise.all(commodities.slice(0, 4).map(async (c: string) => {
      const key = c.toUpperCase();
      const [nassP, nassY] = await Promise.all([nassPrice(key, stateFips), nassYield(key, stateFips)]);
      const builtInCosts = TYPICAL_INPUT_COSTS[key];
      const totalCost = builtInCosts ? Object.values(builtInCosts).reduce((a, b) => a + b, 0) : null;
      const grossRev = nassP && nassY ? nassP.price * nassY.yield : null;
      const netReturn = grossRev !== null && totalCost !== null ? grossRev - totalCost : null;
      return {
        commodity: key, nassPrice: nassP?.price || null, nassYield: nassY?.yield || null,
        typicalInputCost: totalCost, estimatedNetReturnPerAc: netReturn,
        priceUnit: nassP?.unit || PLC_REFERENCE_PRICES[key]?.unit || null,
      };
    }));
    res.json({ comparison: results, acres, source: "USDA NASS QuickStats + Extension input cost surveys" });
  });
}
