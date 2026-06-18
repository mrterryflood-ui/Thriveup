import type { Express } from "express";
import { db } from "./storage";
import { fsaEligibilityChecks, insertFsaEligibilityCheckSchema } from "@shared/schema";
import { generateAIJSON } from "./ai-provider";

// FSA program eligibility rules (based on 2024 Farm Bill program parameters)
const FSA_PROGRAMS = [
  {
    id: "arc-co",
    name: "Agriculture Risk Coverage — County (ARC-CO)",
    fullName: "Agriculture Risk Coverage — County Option",
    description: "Provides revenue loss protection when county revenues fall below the ARC-CO benchmark.",
    eligibleCommodities: ["corn","wheat","soybeans","sorghum","barley","oats","cotton","rice","peanuts","sunflowers","soybeans"],
    requiresFSARegistration: true,
    requiresBaseAcres: true,
    paymentBasis: "base-acres",
    maxPaymentPerAc: 125, // rough 2022 estimate
    adminAgency: "USDA FSA",
    applicationPeriod: "Annual enrollment — typically Dec-Mar",
    websiteUrl: "https://www.fsa.usda.gov/programs-and-services/arcplc_program/index",
    notes: "Mutually exclusive with PLC — producers choose annually per crop. Cannot be used with Marketing Assistance Loans without separation.",
    qualifies: (inputs: EligibilityInputs) =>
      inputs.primaryCommodity && ["corn","wheat","soybeans","sorghum","barley","oats","cotton","rice","peanuts"].some(c => inputs.primaryCommodity!.toLowerCase().includes(c)),
    estimatePayment: (inputs: EligibilityInputs) => inputs.totalAcres ? inputs.totalAcres * 18 : null, // rough county average
  },
  {
    id: "plc",
    name: "Price Loss Coverage (PLC)",
    fullName: "Price Loss Coverage Program",
    description: "Provides payments when effective price for a commodity falls below its reference price.",
    eligibleCommodities: ["corn","wheat","soybeans","sorghum","barley","oats","cotton","rice","peanuts","oilseed","pulse"],
    requiresFSARegistration: true,
    requiresBaseAcres: true,
    paymentBasis: "base-acres",
    adminAgency: "USDA FSA",
    applicationPeriod: "Annual enrollment — typically Dec-Mar",
    websiteUrl: "https://www.fsa.usda.gov/programs-and-services/arcplc_program/index",
    notes: "Better than ARC-CO when commodity prices are more volatile than county revenues.",
    qualifies: (inputs: EligibilityInputs) =>
      inputs.primaryCommodity && ["corn","wheat","soybeans","sorghum","barley","oats","cotton","rice","peanuts"].some(c => inputs.primaryCommodity!.toLowerCase().includes(c)),
    estimatePayment: (inputs: EligibilityInputs) => inputs.totalAcres ? inputs.totalAcres * 22 : null,
  },
  {
    id: "eqip",
    name: "Environmental Quality Incentives Program (EQIP)",
    fullName: "EQIP — Conservation Practice Cost-Share",
    description: "Cost-share and incentive payments for implementing conservation practices.",
    eligibleCommodities: ["all"],
    requiresFSARegistration: false,
    requiresBaseAcres: false,
    paymentBasis: "practice-cost",
    adminAgency: "USDA NRCS",
    applicationPeriod: "Continuous sign-up — funding allocated by state NRCS",
    websiteUrl: "https://www.nrcs.usda.gov/programs-and-services/financial-assistance/eqip",
    notes: "Priority given to beginning farmers, socially disadvantaged, and veterans. Payments cover 50-90% of practice costs.",
    qualifies: (inputs: EligibilityInputs) => true, // universal
    estimatePayment: (inputs: EligibilityInputs) => {
      let base = inputs.totalAcres ? Math.min(inputs.totalAcres * 35, 450000) : 5000;
      if (inputs.isBeginningFarmer || inputs.isSociallyDisadvantaged || inputs.isVeteranFarmer) base *= 1.25;
      return base;
    },
  },
  {
    id: "crp",
    name: "Conservation Reserve Program (CRP)",
    fullName: "Conservation Reserve Program",
    description: "Annual rental payments for retiring environmentally sensitive cropland from production for 10-15 years.",
    eligibleCommodities: ["all"],
    requiresFSARegistration: true,
    requiresBaseAcres: false,
    paymentBasis: "rental-rate",
    adminAgency: "USDA FSA",
    applicationPeriod: "Continuous and general sign-up periods — check FSA for next sign-up",
    websiteUrl: "https://www.fsa.usda.gov/programs-and-services/conservation-programs/conservation-reserve-program/index",
    notes: "Land must be cropland or marginal pasture. 10-15 year contract. Removes land from production.",
    qualifies: (inputs: EligibilityInputs) => (inputs.totalAcres || 0) >= 10,
    estimatePayment: (inputs: EligibilityInputs) => inputs.totalAcres ? inputs.totalAcres * 130 : null, // $130/ac national avg
  },
  {
    id: "csp",
    name: "Conservation Stewardship Program (CSP)",
    fullName: "CSP — Conservation Stewardship for Active Operations",
    description: "Annual payments for maintaining and improving existing conservation systems while in production.",
    eligibleCommodities: ["all"],
    requiresFSARegistration: false,
    requiresBaseAcres: false,
    paymentBasis: "stewardship-points",
    adminAgency: "USDA NRCS",
    applicationPeriod: "Continuous sign-up — 5-year contracts",
    websiteUrl: "https://www.nrcs.usda.gov/programs-and-services/financial-assistance/csp",
    notes: "Requires existing conservation activity. Average $18,000/yr. EQIP must be reviewed simultaneously.",
    qualifies: (inputs: EligibilityInputs) => inputs.hasEqipHistory || (inputs.totalAcres || 0) >= 50,
    estimatePayment: (inputs: EligibilityInputs) => inputs.totalAcres ? Math.min(inputs.totalAcres * 20, 40000) : null,
  },
  {
    id: "elap",
    name: "Emergency Livestock Assistance Program (ELAP)",
    fullName: "ELAP — Emergency Livestock, Honeybee, and Farm-Raised Fish",
    description: "Emergency assistance for losses due to adverse weather, disease, and other conditions.",
    eligibleCommodities: ["livestock","cattle","hogs","poultry","honeybees","aquaculture"],
    requiresFSARegistration: true,
    requiresBaseAcres: false,
    paymentBasis: "loss-documentation",
    adminAgency: "USDA FSA",
    applicationPeriod: "Must apply within 30 days of loss — disaster-triggered",
    websiteUrl: "https://www.fsa.usda.gov/programs-and-services/disaster-assistance-program/emergency-livestock-assist/index",
    notes: "Retroactive application allowed in some circumstances. Requires loss documentation.",
    qualifies: (inputs: EligibilityInputs) =>
      inputs.farmType === "livestock" || inputs.farmType === "mixed" ||
      ["cattle","hogs","poultry","livestock","dairy"].some(c => inputs.primaryCommodity?.toLowerCase().includes(c) || false),
    estimatePayment: () => null, // loss-dependent
  },
  {
    id: "bfrdp",
    name: "Beginning Farmer and Rancher Development Program (BFRDP)",
    fullName: "BFRDP — Education and Training for New Farmers",
    description: "Grants for organizations providing education, training, and technical assistance to beginning farmers.",
    eligibleCommodities: ["all"],
    requiresFSARegistration: false,
    requiresBaseAcres: false,
    paymentBasis: "training-grant",
    adminAgency: "USDA NIFA",
    applicationPeriod: "Annual NIFA grant competition — typically spring",
    websiteUrl: "https://www.nifa.usda.gov/grants/programs/beginning-farmers-ranchers-development-program",
    notes: "Primarily for organizations, not individual farmers. Farmers can benefit through partnering organizations.",
    qualifies: (inputs: EligibilityInputs) => inputs.isBeginningFarmer,
    estimatePayment: () => null,
  },
  {
    id: "snap-ed",
    name: "SNAP Education Program (SNAP-Ed)",
    fullName: "Supplemental Nutrition Assistance Program Education",
    description: "Nutrition education and obesity prevention for SNAP-eligible individuals and communities.",
    eligibleCommodities: ["direct-market","community-garden","urban-farm"],
    requiresFSARegistration: false,
    requiresBaseAcres: false,
    paymentBasis: "outreach",
    adminAgency: "USDA FNS",
    applicationPeriod: "Continuous — contact state SNAP-Ed implementing agency",
    websiteUrl: "https://www.fns.usda.gov/snap/snap-ed",
    notes: "Relevant for community gardens, direct-market farmers selling to low-income households, and farm stands accepting SNAP.",
    qualifies: (inputs: EligibilityInputs) =>
      ["specialty","organic","direct-market","community"].some(t => inputs.farmType?.includes(t) || false),
    estimatePayment: () => null,
  },
];

interface EligibilityInputs {
  farmType?: string;
  totalAcres?: number;
  primaryCommodity?: string;
  hasEqipHistory?: boolean;
  hasCrpHistory?: boolean;
  isBeginningFarmer?: boolean;
  isSociallyDisadvantaged?: boolean;
  isVeteranFarmer?: boolean;
  grossFarmIncomePriorYr?: number;
  stateFips?: string;
  countyFips?: string;
  countyName?: string;
}

export function registerFsaEligibilityRoutes(app: Express) {

  // List all FSA programs (reference)
  app.get("/api/fsa-eligibility/programs", async (req, res) => {
    const programs = FSA_PROGRAMS.map(({ qualifies, estimatePayment, ...rest }) => rest);
    res.json({ programs, source: "USDA FSA / NRCS 2024 Farm Bill programs" });
  });

  // Run eligibility check
  app.post("/api/fsa-eligibility/check", async (req, res) => {
    const inputs: EligibilityInputs = req.body;
    const eligible = FSA_PROGRAMS
      .filter(p => p.qualifies(inputs))
      .map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        adminAgency: p.adminAgency,
        applicationPeriod: p.applicationPeriod,
        websiteUrl: p.websiteUrl,
        notes: p.notes,
        paymentEstimate: p.estimatePayment(inputs),
        requiresFSARegistration: p.requiresFSARegistration,
      }));

    const ineligible = FSA_PROGRAMS
      .filter(p => !p.qualifies(inputs))
      .map(p => ({ id: p.id, name: p.name, reason: "Does not match current farm profile inputs" }));

    const totalEstimate = eligible.reduce((sum, p) => sum + (p.paymentEstimate || 0), 0);

    // AI narrative
    let aiNarrative = "";
    try {
      const prompt = `You are a USDA FSA county office specialist helping a farmer understand their program eligibility. Based on their farm profile, write 2 paragraphs of plain-language guidance.

Farm profile: type=${inputs.farmType || "?"}, ${inputs.totalAcres || "?"} acres, primary commodity=${inputs.primaryCommodity || "?"}, beginning farmer=${inputs.isBeginningFarmer}, socially disadvantaged=${inputs.isSociallyDisadvantaged}, veteran=${inputs.isVeteranFarmer}, prior EQIP=${inputs.hasEqipHistory}, county=${inputs.countyName || "?"}

Eligible programs: ${eligible.map(p => p.name).join(", ")}

Write guidance covering: (1) which program to prioritize first and why, (2) what the farmer should do this week to start the process. Be specific, actionable, no jargon. Return as JSON: { narrative: string }`;
      const result = await generateAIJSON(prompt, '{"narrative":""}') as { narrative: string };
      aiNarrative = result.narrative || "";
    } catch { aiNarrative = ""; }

    // Save check to DB
    try {
      const payload = insertFsaEligibilityCheckSchema.parse({
        ...inputs,
        userId: req.user?.id,
        sessionToken: req.headers["x-session-token"] as string || null,
        eligibleProgramsJson: JSON.stringify(eligible),
        estimatedPaymentsJson: JSON.stringify({ totalEstimate }),
        aiNarrativeJson: JSON.stringify({ narrative: aiNarrative }),
      });
      await db.insert(fsaEligibilityChecks).values(payload);
    } catch { /* non-fatal */ }

    res.json({
      eligible,
      ineligible,
      totalEstimatedPayment: totalEstimate,
      aiNarrative,
      disclaimer: "Payment estimates are illustrative averages. Actual payments depend on FSA county office determination, available funding, and farm-specific data. Contact your local FSA office to verify.",
      fsaOfficeLocator: `https://offices.sc.egov.usda.gov/locator/app?agency=fsa`,
      nrcsOfficeLocator: `https://offices.sc.egov.usda.gov/locator/app?agency=nrcs`,
      source: "USDA FSA / NRCS 2024 Farm Bill program parameters",
    });
  });

  // Get saved checks (auth required)
  app.get("/api/fsa-eligibility/history", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: "Auth required" });
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ error: "User ID not found" });
    const checks = await db.select().from(fsaEligibilityChecks).where(eq(fsaEligibilityChecks.userId, userId));
    res.json({ checks });
  });
}
