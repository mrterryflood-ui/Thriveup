import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { rpliceAssessments, rpliceActionPlans, outcomeBaselines, ecosystemPlatforms } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { generateAIJSON, streamAIResponse, generateMultiAIResponse, getProviderInfo } from "./ai-provider";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated?.() && !(req as any).user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

const CENSUS_API_KEY = process.env.CENSUS_API_KEY || "";

async function fetchCensus(url: string, timeout = 15000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const sep = url.includes("?") ? "&" : "?";
    const fullUrl = CENSUS_API_KEY ? `${url}${sep}key=${CENSUS_API_KEY}` : url;
    const resp = await fetch(fullUrl, { signal: controller.signal });
    if (!resp.ok) throw new Error(`Census API ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

async function gatherRegionData(stateFips: string, countyFips: string) {
  const vars = "NAME,B01003_001E,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E,B15003_017E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B15003_001E,B25064_001E,B25077_001E,B12001_001E,B12001_003E,B12001_005E,B11001_001E,B11001_003E,B09002_001E,B09002_002E,B02001_003E,B01003_001E,B03003_003E";
  const raceVars = "NAME,B02001_001E,B02001_002E,B02001_003E,B03003_003E";

  const [countyData, stateCounties, tractData, genYears] = await Promise.all([
    fetchCensus(`https://api.census.gov/data/2022/acs/acs5?get=${vars}&for=county:${countyFips}&in=state:${stateFips}`),
    fetchCensus(`https://api.census.gov/data/2022/acs/acs5?get=${vars}&for=county:*&in=state:${stateFips}`),
    fetchCensus(`https://api.census.gov/data/2022/acs/acs5?get=NAME,B19013_001E,B17001_002E,B17001_001E,B23025_005E,B23025_002E,B25064_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B15003_001E&for=tract:*&in=state:${stateFips}&in=county:${countyFips}`),
    Promise.all([2015, 2017, 2019, 2022].map(async (year) => {
      try {
        const gv = "NAME,B01003_001E,B19013_001E,B25064_001E,B25077_001E,B17001_002E,B17001_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E,B15003_001E,B02001_003E,B01003_001E,B03003_003E";
        const d = await fetchCensus(`https://api.census.gov/data/${year}/acs/acs5?get=${gv}&for=county:${countyFips}&in=state:${stateFips}`);
        if (!d || d.length < 2) return null;
        const h = d[0]; const r = d[1];
        const v = (n: string) => { const i = h.indexOf(n); return i >= 0 ? parseInt(r[i]) || 0 : 0; };
        const pop = v("B01003_001E"); const edPop = v("B15003_001E");
        const college = v("B15003_022E") + v("B15003_023E") + v("B15003_024E") + v("B15003_025E");
        const povU = v("B17001_001E"); const belowPov = v("B17001_002E");
        return {
          year, name: r[h.indexOf("NAME")], population: pop,
          medianIncome: v("B19013_001E"), medianRent: v("B25064_001E"), medianHomeValue: v("B25077_001E"),
          povertyRate: povU > 0 ? Math.round((belowPov / povU) * 1000) / 10 : 0,
          collegePct: edPop > 0 ? Math.round((college / edPop) * 1000) / 10 : 0,
          blackPop: v("B02001_003E"), hispanicPop: v("B03003_003E"),
          blackPct: pop > 0 ? Math.round((v("B02001_003E") / pop) * 1000) / 10 : 0,
          hispanicPct: pop > 0 ? Math.round((v("B03003_003E") / pop) * 1000) / 10 : 0,
        };
      } catch { return null; }
    })),
  ]);

  function parseCounty(data: any[]) {
    if (!data || data.length < 2) return [];
    const h = data[0];
    return data.slice(1).map((r: string[]) => {
      const v = (n: string) => { const i = h.indexOf(n); return i >= 0 ? parseInt(r[i]) || 0 : 0; };
      const pop = v("B01003_001E"); const edPop = v("B15003_001E");
      const college = v("B15003_022E") + v("B15003_023E") + v("B15003_024E") + v("B15003_025E");
      const povU = v("B17001_001E"); const belowPov = v("B17001_002E");
      const lf = v("B23025_002E"); const unemp = v("B23025_005E");
      const marriedPop = v("B12001_003E") + v("B12001_005E"); const marriageUniverse = v("B12001_001E");
      const totalHH = v("B11001_001E"); const marriedHH = v("B11001_003E");
      const childTotal = v("B09002_001E"); const childMarried = v("B09002_002E");
      return {
        name: r[h.indexOf("NAME")], population: pop, countyFips: r[h.indexOf("county")] || "",
        collegePct: edPop > 0 ? Math.round((college / edPop) * 1000) / 10 : 0,
        povertyRate: povU > 0 ? Math.round((belowPov / povU) * 1000) / 10 : 0,
        unemploymentRate: lf > 0 ? Math.round((unemp / lf) * 1000) / 10 : 0,
        marriagePct: marriageUniverse > 0 ? Math.round((marriedPop / marriageUniverse) * 1000) / 10 : 0,
        twoParentPct: childTotal > 0 ? Math.round((childMarried / childTotal) * 1000) / 10 : 0,
        medianIncome: v("B19013_001E"), medianRent: v("B25064_001E"), medianHomeValue: v("B25077_001E"),
      };
    });
  }

  function parseTracts(data: any[]) {
    if (!data || data.length < 2) return [];
    const h = data[0];
    return data.slice(1).map((r: string[]) => {
      const v = (n: string) => { const i = h.indexOf(n); return i >= 0 ? parseInt(r[i]) || 0 : 0; };
      const income = v("B19013_001E");
      const povU = v("B17001_001E"); const belowPov = v("B17001_002E");
      const lf = v("B23025_002E"); const unemp = v("B23025_005E");
      const edPop = v("B15003_001E");
      const college = v("B15003_022E") + v("B15003_023E") + v("B15003_024E") + v("B15003_025E");
      const pov = povU > 0 ? Math.round((belowPov / povU) * 1000) / 10 : 0;
      const unempRate = lf > 0 ? Math.round((unemp / lf) * 1000) / 10 : 0;
      let risk = 0;
      if (pov > 30) risk += 40; else if (pov > 20) risk += 25; else if (pov > 15) risk += 10;
      if (unempRate > 15) risk += 30; else if (unempRate > 10) risk += 20; else if (unempRate > 7) risk += 10;
      if (income > 0 && income < 25000) risk += 30; else if (income < 40000) risk += 15;
      return {
        tract: r[h.indexOf("tract")] || "", name: r[h.indexOf("NAME")] || "",
        medianIncome: income, povertyRate: pov, unemploymentRate: unempRate, medianRent: v("B25064_001E"),
        collegePct: edPop > 0 ? Math.round((college / edPop) * 1000) / 10 : 0,
        riskScore: Math.min(risk, 100),
      };
    }).filter(t => t.medianIncome > 0);
  }

  const targetCounty = parseCounty(countyData)[0];
  const allCounties = parseCounty(stateCounties).sort((a, b) => a.povertyRate - b.povertyRate);
  const tracts = parseTracts(tractData).sort((a, b) => b.riskScore - a.riskScore);
  const timeline = genYears.filter(Boolean);

  const highRiskTracts = tracts.filter(t => t.riskScore >= 80);
  const lowRiskTracts = tracts.filter(t => t.riskScore < 15);
  const incomes = tracts.map(t => t.medianIncome).filter(i => i > 0).sort((a, b) => a - b);
  const incomeGap = incomes.length > 1 ? Math.round(incomes[incomes.length - 1] / incomes[0]) : 1;

  let gentrificationIndicators: string[] = [];
  if (timeline.length >= 2) {
    const first = timeline[0] as any; const last = timeline[timeline.length - 1] as any;
    if (first.medianRent && last.medianRent) {
      const rentChange = Math.round(((last.medianRent - first.medianRent) / first.medianRent) * 100);
      if (rentChange > 20) gentrificationIndicators.push(`Rent surged ${rentChange}% (${first.year}→${last.year})`);
    }
    if (first.medianHomeValue && last.medianHomeValue) {
      const homeChange = Math.round(((last.medianHomeValue - first.medianHomeValue) / first.medianHomeValue) * 100);
      if (homeChange > 30) gentrificationIndicators.push(`Home values jumped ${homeChange}%`);
    }
    if (first.blackPct > 0 && last.blackPct > 0 && first.blackPct - last.blackPct > 1) {
      gentrificationIndicators.push(`Black population declined ${first.blackPct}% → ${last.blackPct}% — displacement detected`);
    }
    if (first.hispanicPct > 0 && last.hispanicPct > 0 && first.hispanicPct - last.hispanicPct > 1) {
      gentrificationIndicators.push(`Hispanic population declined ${first.hispanicPct}% → ${last.hispanicPct}%`);
    }
  }

  return {
    targetCounty, allCounties, tracts, timeline, highRiskTracts, lowRiskTracts, incomeGap, gentrificationIndicators,
    stats: {
      totalTracts: tracts.length,
      tractsOver30Poverty: tracts.filter(t => t.povertyRate > 30).length,
      tractsUnder5Poverty: tracts.filter(t => t.povertyRate < 5).length,
      tractsRisk100: tracts.filter(t => t.riskScore === 100).length,
      tractsRiskUnder10: tracts.filter(t => t.riskScore < 10).length,
      lowestIncome: incomes[0] || 0,
      highestIncome: incomes[incomes.length - 1] || 0,
    },
  };
}

export function registerRpliceToolsRoutes(app: Express) {
  app.post("/api/rplice/cfir-assessment", requireAuth, async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "cfir",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/cfir-assessments", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .where(eq(rpliceAssessments.assessmentType, "cfir"))
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/reaim-scorecard", requireAuth, async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "reaim",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/reaim-scorecards", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .where(eq(rpliceAssessments.assessmentType, "reaim"))
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/fidelity-checklist", requireAuth, async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "fidelity",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/three-realities", requireAuth, async (req, res) => {
    try {
      const { programName, data, score, status } = req.body;
      const [row] = await db.insert(rpliceAssessments).values({
        assessmentType: "three_realities",
        programName: programName || "Untitled",
        data: data || {},
        score: score != null ? String(score) : null,
        status: status || "complete",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/quality-reviews", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/quality-reviews/:id/resolve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { status } = req.body;
      const [row] = await db.update(rpliceAssessments)
        .set({ status: status || "complete", updatedAt: new Date() })
        .where(eq(rpliceAssessments.id, id))
        .returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/assessments", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceAssessments)
        .orderBy(desc(rpliceAssessments.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const GRANT_PROFILES: Record<string, { name: string; funder: string; voice: string; focusAreas: string[] }> = {
    "bb-collective": {
      name: "BB Collective Research Grant",
      funder: "BB Collective",
      voice: "Academic research methodology — emphasize study design, evidence base, peer-reviewed literature, replicability, and methodological rigor. Use formal academic tone with citations and theoretical frameworks.",
      focusAreas: ["research methodology", "implementation science", "evidence-based practice", "community-based participatory research"],
    },
    "rare-impact": {
      name: "Rare Impact Fund",
      funder: "Rare Beauty / Rare Impact Fund",
      voice: "Community impact and mental health focus — emphasize lived experience, community voice, mental wellness, youth empowerment, and systemic change. Use accessible, empathetic language that centers the community.",
      focusAreas: ["mental health", "youth development", "community empowerment", "stigma reduction"],
    },
    "st-davids": {
      name: "St. David's Foundation Health Equity Grant",
      funder: "St. David's Foundation",
      voice: "Health equity and social determinants — emphasize health disparities, SDOH, access barriers, community health workers, clinical-community linkages. Use public health language with epidemiological data.",
      focusAreas: ["health equity", "social determinants of health", "community health", "healthcare access"],
    },
    "austin-fc": {
      name: "Austin FC Community Fund",
      funder: "Austin FC Foundation",
      voice: "Youth development and community building — emphasize sports as a vehicle for social change, after-school programming, character development, mentorship, and physical wellness. Use energetic, community-first language.",
      focusAreas: ["youth development", "after-school programs", "physical wellness", "mentorship"],
    },
    "ssg-fox": {
      name: "SSG Fox Veteran Services Fund",
      funder: "SSG Fox Foundation",
      voice: "Veteran services and military transition — emphasize military-to-civilian transition, veteran mental health, post-service employment, family reintegration, and service-connected challenges. Honor military service while addressing systemic gaps.",
      focusAreas: ["veteran services", "military transition", "PTSD treatment", "veteran employment"],
    },
    "doj-bja": {
      name: "DOJ/BJA Violence Prevention Grant",
      funder: "Department of Justice / Bureau of Justice Assistance",
      voice: "Evidence-based violence prevention and community safety — emphasize data-driven approaches, risk/protective factors, recidivism reduction, and community-led safety strategies. Use federal grant language with outcome metrics.",
      focusAreas: ["violence prevention", "community safety", "reentry support", "juvenile justice"],
    },
    "samhsa": {
      name: "SAMHSA Community Grant",
      funder: "Substance Abuse and Mental Health Services Administration",
      voice: "Behavioral health and substance use prevention — emphasize trauma-informed care, recovery support, community-based treatment, and integrated behavioral health services. Use clinical and public health terminology.",
      focusAreas: ["substance abuse prevention", "mental health services", "trauma-informed care", "behavioral health"],
    },
    "wioa-title-i": {
      name: "WIOA Title I Youth Program",
      funder: "Department of Labor / Texas Workforce Commission",
      voice: "Workforce development and youth employment — emphasize 14 youth elements, career pathways, work-based learning, credential attainment, and measurable employment outcomes. Use DOL performance metrics language.",
      focusAreas: ["workforce development", "youth employment", "career pathways", "credential attainment"],
    },
  };

  app.post("/api/rplice/grant-narrative", requireAuth, async (req, res) => {
    const { stateFips, countyFips, cityName, grantName } = req.body;
    if (!stateFips || !countyFips || !grantName) {
      return res.status(400).json({ error: "stateFips, countyFips, and grantName required" });
    }

    const grantProfile = GRANT_PROFILES[grantName];
    if (!grantProfile) {
      return res.status(400).json({ error: "Unknown grant: " + grantName });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (type: string, data: any) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
      send("status", { message: `Preparing ${grantProfile.name} narrative for ${cityName || countyFips}...` });

      const savedAnalyses = await db.select().from(rpliceAssessments)
        .where(eq(rpliceAssessments.assessmentType, "community_analysis"))
        .orderBy(desc(rpliceAssessments.createdAt));

      const matchingAnalysis = savedAnalyses.find((a: any) =>
        a.data?.stateFips === stateFips && a.data?.countyFips === countyFips
      );

      send("status", { message: matchingAnalysis ? "Found saved RPLICE analysis — pulling data..." : "No saved analysis found — gathering fresh Census data..." });

      const [regionData, allRpliceResearch] = await Promise.all([
        gatherRegionData(stateFips, countyFips),
        fetchRplice("/api/research"),
      ]);
      const rpliceResearch = filterRpliceResearch(allRpliceResearch, grantProfile.focusAreas);

      send("status", { message: `Census data loaded — ${regionData.stats.totalTracts} tracts analyzed` });

      send("data", {
        section: "census",
        county: regionData.targetCounty,
        stats: regionData.stats,
        incomeGap: regionData.incomeGap,
        gentrification: regionData.gentrificationIndicators,
        grantProfile: { name: grantProfile.name, funder: grantProfile.funder },
      });

      const topHighRisk = regionData.highRiskTracts.slice(0, 6);

      const systemPrompt = `You are a senior grant writer working for Dr. Terry Flood's RPLICE (Research, Planning, Learning & Implementation Center of Excellence). You specialize in writing compelling, data-driven grant narratives.

VOICE AND TONE FOR THIS GRANT:
Funder: ${grantProfile.funder}
Grant: ${grantProfile.name}
Writing Style: ${grantProfile.voice}

Your analysis frameworks: CFIR 2.0, RE-AIM, Three Realities, SALP Indicators, MAP-GAP.

Key principles:
1. "1 year of college = primary protective factor" — education is THE intervention
2. "Crime doesn't disappear, it migrates" — gentrification displaces poverty
3. Every claim must be backed by specific Census data (cite tract numbers)
4. Use the funder's language and priorities throughout`;

      const dataPackage = {
        targetCounty: regionData.targetCounty,
        highRiskTracts: topHighRisk,
        incomeGap: regionData.incomeGap + "x",
        stats: regionData.stats,
        gentrification: regionData.gentrificationIndicators,
        timeline: regionData.timeline,
        savedAnalysis: matchingAnalysis ? {
          programName: matchingAnalysis.programName,
          savedStats: (matchingAnalysis.data as any)?.stats,
          savedGentrification: (matchingAnalysis.data as any)?.gentrification,
        } : null,
        relevantResearch: (rpliceResearch || []).slice(0, 5).map((r: any) => r.title),
      };

      const userPrompt = `Generate a complete grant narrative for the ${grantProfile.name} using this community data:

${JSON.stringify(dataPackage, null, 2)}

Write a COMPLETE 5-SECTION GRANT NARRATIVE with these EXACT sections:

## 1. NEED STATEMENT
- Open with a compelling statement about the community's challenges
- Cite specific tract-level data: poverty rates, unemployment, income gaps
- Reference ${regionData.stats.tractsOver30Poverty} tracts with 30%+ poverty
- Mention the ${regionData.incomeGap}x income gap between richest and poorest neighborhoods
- Include gentrification displacement data: ${regionData.gentrificationIndicators.join("; ")}
- Connect to ${grantProfile.funder}'s mission and focus areas: ${grantProfile.focusAreas.join(", ")}
- Every statistic must cite the specific Census table or tract number

## 2. TARGET POPULATION
- Define the primary population to be served with demographic detail
- Population size: ${regionData.targetCounty?.population || "N/A"}
- Poverty rate: ${regionData.targetCounty?.povertyRate || "N/A"}%
- College attainment: ${regionData.targetCounty?.collegePct || "N/A"}%
- Describe risk factors specific to the highest-risk tracts
- Include ACEs (Adverse Childhood Experiences) connection
- Explain the neighborhood→school→outcomes pipeline
- Detail eligibility criteria and recruitment strategy

## 3. PROGRAM DESIGN
- Evidence-based interventions aligned with ${grantProfile.focusAreas.join(", ")}
- Connect to RPLICE frameworks (CFIR 2.0, RE-AIM)
- Describe specific program components and activities
- Include dosage (frequency, duration, intensity)
- Address the specific needs identified in the data
- Reference Dr. Flood's "1 year of college = primary protective factor"
- Include staffing plan (roles, qualifications, cultural competency)

## 4. EVALUATION PLAN
- Baseline metrics from the Census data (current state)
- SALP indicators: Specific, Actionable, Linked, Predictive
- RE-AIM evaluation dimensions with specific measures
- Data collection methods and timeline
- Process and outcome measures
- How results will be reported to ${grantProfile.funder}
- Continuous quality improvement using MAP-GAP framework

## 5. BUDGET JUSTIFICATION
- Cost per participant projections
- ROI analysis based on intervention outcomes
- Personnel costs breakdown
- Program supplies and materials
- Technology and data systems
- Indirect costs and administrative overhead
- Sustainability plan beyond grant period
- Cost-effectiveness compared to status quo (cost of inaction)

Write in the voice specified for this funder. Be specific. Every claim must reference actual data. This is for a real grant submission — quality must be publication-ready.`;

      send("status", { message: `AI generating ${grantProfile.name} narrative — streaming...` });

      await new Promise<void>((resolve, reject) => {
        streamAIResponse({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          maxTokens: 8000,
          onChunk: (content: string) => {
            send("chunk", { content });
          },
          onDone: async () => {
            try {
              await db.insert(rpliceAssessments).values({
                assessmentType: "grant_narrative",
                programName: `${grantProfile.name} — ${cityName || regionData.targetCounty?.name}`,
                data: {
                  stateFips, countyFips, cityName, grantName,
                  grantFunder: grantProfile.funder,
                  stats: regionData.stats,
                  incomeGap: regionData.incomeGap,
                  gentrification: regionData.gentrificationIndicators,
                  aiProvider: getProviderInfo().name,
                  timestamp: new Date().toISOString(),
                },
                score: null,
                status: "complete",
              });
            } catch (e) {
              console.error("[RPLICE] Failed to save grant narrative:", e);
            }
            send("done", { message: "Grant narrative complete", provider: getProviderInfo().name, grantName: grantProfile.name });
            resolve();
          },
          onError: (error: Error) => {
            send("error", { message: error.message });
            reject(error);
          },
        });
      });
    } catch (error: any) {
      send("error", { message: error.message || "Narrative generation failed" });
    }
    res.end();
  });

  const RPLICE_BASE = "https://www.bettersciencelab.com";
  const RPLICE_API_KEY = process.env.THRIVE_GPP_API_KEY || process.env.THRIVE_GPP_API || process.env.RPLICE_API_KEY || "";

  async function fetchRplice(path: string): Promise<any> {
    try {
      const headers: Record<string, string> = {};
      if (RPLICE_API_KEY && path.includes("/api/v1/")) {
        headers["Authorization"] = `Bearer ${RPLICE_API_KEY}`;
        headers["Content-Type"] = "application/json";
      }
      const resp = await fetch(`${RPLICE_BASE}${path}`, {
        headers,
        signal: AbortSignal.timeout(12000),
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  }

  async function postRplice(path: string, body: Record<string, unknown>): Promise<any> {
    if (!RPLICE_API_KEY) return null;
    try {
      const resp = await fetch(`${RPLICE_BASE}${path}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RPLICE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  }

  /** Filter the full /api/research library by keywords (client-side, avoids CSRF). */
  function filterRpliceResearch(studies: any[], keywords: string[]): any[] {
    if (!studies?.length || !keywords?.length) return studies || [];
    const terms = keywords.map(k => k.toLowerCase());
    return studies.filter(s => {
      const text = [
        s.title, s.abstract, s.journal,
        ...(s.keywords || []), ...(s.frameworks || []), s.category,
      ].join(" ").toLowerCase();
      return terms.some(t => text.includes(t));
    });
  }

  app.post("/api/rplice/community-analysis", requireAuth, async (req, res) => {
    const { stateFips, countyFips, cityName, neighboringCounties, focusAreas } = req.body;
    if (!stateFips || !countyFips) return res.status(400).json({ error: "stateFips and countyFips required" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (type: string, data: any) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
      send("status", { message: "Gathering Census data for " + (cityName || countyFips) + "..." });

      const [regionData, rpliceFrameworks, allRpliceResearch] = await Promise.all([
        gatherRegionData(stateFips, countyFips),
        fetchRplice("/api/frameworks/list"),
        fetchRplice("/api/research"),
      ]);
      // Filter the 49-study library client-side — /api/research/search requires CSRF tokens
      const rpliceResearch = filterRpliceResearch(
        allRpliceResearch,
        focusAreas?.length ? focusAreas : ["poverty", "education", "violence prevention", "implementation", "community"]
      );

      send("status", { message: "Census data loaded — " + regionData.stats.totalTracts + " tracts analyzed" });
      send("data", {
        section: "census",
        county: regionData.targetCounty,
        stats: regionData.stats,
        incomeGap: regionData.incomeGap,
        gentrification: regionData.gentrificationIndicators,
        timeline: regionData.timeline,
      });

      send("status", { message: "RPLICE research library queried — " + (rpliceResearch?.length || 0) + " studies matched from " + (allRpliceResearch?.length || 0) + " total" });
      send("data", {
        section: "rplice",
        frameworks: rpliceFrameworks,
        researchCount: rpliceResearch?.length || 0,
        totalLibraryCount: allRpliceResearch?.length || 0,
        topStudies: (rpliceResearch || []).slice(0, 5).map((r: any) => ({ title: r.title, authors: r.authors, year: r.year, frameworks: r.frameworks })),
        platformNote: "bettersciencelab.com — 100+ implementation science tools, ~1000 live data sources",
      });

      const topHighRisk = regionData.highRiskTracts.slice(0, 8);
      const topLowRisk = regionData.lowRiskTracts.slice(0, 5);
      const neighborData: any[] = [];
      if (neighboringCounties && neighboringCounties.length > 0) {
        for (const nc of neighboringCounties.slice(0, 4)) {
          const found = regionData.allCounties.find((c: any) => c.countyFips === nc.fips);
          if (found) neighborData.push({ ...found, label: nc.label });
        }
      }

      send("status", { message: "Building AI analysis using " + getProviderInfo().allProviders.length + " AI providers..." });

      const dataPackage = {
        targetCounty: regionData.targetCounty,
        highRiskTracts: topHighRisk,
        lowRiskTracts: topLowRisk,
        incomeGap: regionData.incomeGap + "x",
        stats: regionData.stats,
        gentrification: regionData.gentrificationIndicators,
        timeline: regionData.timeline,
        neighboringCounties: neighborData,
        rpliceFrameworks: (rpliceFrameworks || []).map((f: any) => f.id + ": " + f.fullName),
        relevantResearch: (rpliceResearch || []).slice(0, 5).map((r: any) => r.title),
      };

      const systemPrompt = `You are a senior implementation scientist and community development analyst working for Dr. Terry Flood's RPLICE (Research, Planning, Learning & Implementation Center of Excellence). Dr. Flood is a U.S. Army veteran (Bronze Star x2) with a DHA, MS Implementation Science, MA Psychology, MSHRM, MBA, MSCJ, and Public Policy credentials.

Your analysis frameworks:
- CFIR 2.0 (Consolidated Framework for Implementation Research)
- RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance)
- Three Realities (Research Reality, Political Reality, Ground Truth)
- SALP Indicators (Specific, Actionable, Linked, Predictive)
- MAP-GAP (Dr. Flood's continuous improvement framework)
- ACEs (Adverse Childhood Experiences) integration

Key principles from Dr. Flood's military research:
1. "1 year of college = primary protective factor" — education is THE intervention
2. "Crime doesn't disappear, it migrates" — gentrification displaces poverty, doesn't solve it
3. Family structure (2-parent households) amplifies ALL other factors
4. Neighborhood→School→Outcomes pipeline determines life trajectory
5. Risk and protective factors must be measured at the tract/neighborhood level, not county level

You must produce a structured analysis with these exact sections.`;

      const userPrompt = `Analyze this community using the RPLICE framework. Here is the live Census data:

${JSON.stringify(dataPackage, null, 2)}

Produce a COMPLETE RPLICE Community Analysis with these EXACT sections:

## 1. RESEARCH REALITY (What the Data Says)
- Summarize the key findings from the Census tract data
- Identify the income gap, poverty concentration, and educational attainment patterns
- Note specific tract-level disparities (highest risk vs lowest risk neighborhoods)
- Reference gentrification indicators and population displacement
- Compare the target county to neighboring counties

## 2. POLITICAL REALITY (What Officials and Media Say)
- Based on the county-level averages, what story do politicians and media tell?
- How do county averages MASK the neighborhood-level crisis?
- What gentrification narrative is being sold vs what's actually happening?

## 3. GROUND TRUTH (What the Community Experiences)
- Translate the data into lived experience for residents of the highest-risk tracts
- What does $${topHighRisk[0]?.medianIncome || "15,000"}/year mean for a family?
- What does ${topHighRisk[0]?.povertyRate || 50}% poverty look like in a neighborhood?
- Connect ACEs, family structure, and educational access

## 4. CFIR 2.0 ASSESSMENT — Implementation Readiness
Rate each domain (1-5) with justification:
- Innovation Characteristics (evidence base for interventions)
- Outer Setting (policy environment, community needs)
- Inner Setting (organizational capacity, resources)
- Individuals (workforce readiness, community champions)
- Implementation Process (planning, execution, evaluation)

## 5. RE-AIM SCORECARD
Score each dimension for a proposed intervention:
- Reach: Who needs to be served and how many?
- Effectiveness: What evidence-based approaches work here?
- Adoption: What organizations can deliver this?
- Implementation: What does fidelity look like?
- Maintenance: How do we sustain past the grant period?

## 6. SALP INTERVENTION PLAN
For each risk factor identified, provide:
- Specific: Measurable target
- Actionable: Concrete program activity
- Linked: Connection to outcome
- Predictive: Leading indicator to track

## 7. RISK & PROTECTIVE FACTOR MATRIX
Create a structured matrix of:
- Education (college attainment, K-12 quality)
- Employment (rates, quality, career pathways)
- Family Structure (marriage, 2-parent homes, ACEs)
- Income/Poverty (median income, poverty concentration)
- Housing (affordability, displacement, gentrification)
For each: Current state → Target state → Intervention → Timeline

## 8. GRANT ALIGNMENT & FUNDING STRATEGY
Based on this data, which grant categories are strongest:
- DOJ/BJA (violence prevention, reentry)
- SAMHSA (substance abuse, mental health)
- ED (education, workforce)
- HHS/HRSA (health equity, CHW)
- Private foundations (community development)
Specific dollar amounts and grant programs to target.

## 9. 90-DAY IMPLEMENTATION ROADMAP
Phase 1 (Days 1-30): Assessment and Coalition Building
Phase 2 (Days 31-60): Program Launch and Data Collection
Phase 3 (Days 61-90): Evaluation and Course Correction

Be specific. Use actual numbers from the data. Reference specific tracts. This is for grant submissions — every claim must be data-backed.`;

      send("status", { message: "AI analysis streaming — this is the full RPLICE report..." });

      await new Promise<void>((resolve, reject) => {
        streamAIResponse({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          maxTokens: 8000,
          onChunk: (content: string) => {
            send("chunk", { content });
          },
          onDone: async () => {
            try {
              await db.insert(rpliceAssessments).values({
                assessmentType: "community_analysis",
                programName: cityName || regionData.targetCounty?.name || "Community Analysis",
                data: {
                  stateFips, countyFips, cityName,
                  stats: regionData.stats,
                  incomeGap: regionData.incomeGap,
                  gentrification: regionData.gentrificationIndicators,
                  aiProvider: getProviderInfo().name,
                  timestamp: new Date().toISOString(),
                },
                score: null,
                status: "complete",
              });
            } catch (e) {
              console.error("[RPLICE] Failed to save analysis:", e);
            }
            send("done", { message: "RPLICE Community Analysis complete", provider: getProviderInfo().name });
            resolve();
          },
          onError: (error: Error) => {
            send("error", { message: error.message });
            reject(error);
          },
        });
      });
    } catch (error: any) {
      send("error", { message: error.message || "Analysis failed" });
    }
    res.end();
  });

  app.post("/api/rplice/match-platforms", requireAuth, async (req, res) => {
    try {
      const { analysisId, riskFactors } = req.body;

      const PLATFORM_INTERVENTIONS: Record<string, { platforms: { id: string; name: string; domain: string; url: string; interventions: string[] }[] }> = {
        "education": {
          platforms: [
            { id: "isss", name: "ISSS — Integrated Supports for Thriving Youth", domain: "education", url: "https://implementationineducatio.com", interventions: ["MTSS implementation", "Student support coordination", "Early warning system", "Implementation fidelity tracking"] },
            { id: "wholemind", name: "WholeMind Learning", domain: "education", url: "https://wholemindlearning.com", interventions: ["Pre-K to 12th grade curriculum", "AI homework help", "Adaptive learning", "Skill mastery tracking"] },
            { id: "betterscience", name: "RPLICE — Research-to-Practice Lifecycle Implementation & Community Evidence", domain: "education", url: "https://implementationineducatio.com", interventions: ["Evidence-based practice registry", "CFIR/RE-AIM evaluation", "Research translation", "Fidelity measurement", "Live community data assessment", "Implementation plan builder"] },
          ],
        },
        "health-equity": {
          platforms: [
            { id: "whole-person-health", name: "Whole-Person Health Ecosystem", domain: "health-equity", url: "https://mentalwellnesssupport.net", interventions: ["Clinical screenings (C-SSRS, PHQ-9, GAD-7)", "Safety plan builder", "Crisis routing", "MAP-GAP assessment"] },
            { id: "sankofa", name: "Sankofa Health Network", domain: "health-equity", url: "https://yourhealthbirthright.net", interventions: ["Health equity gateway", "Culturally responsive care", "GIS resource matching", "Population-specific health navigation"] },
            { id: "sankofa-maternal-health", name: "Black Maternal Health Network", domain: "health-equity", url: "https://yourhealthbirthright.net", interventions: ["Maternal risk assessment", "Doula matching", "Prenatal care navigation", "Postpartum recovery"] },
            { id: "safecognicare", name: "SafeCogniCare", domain: "health-equity", url: "https://safecognicare.com", interventions: ["Cognitive health assessments (MoCA/MMSE)", "TBI screening", "Cognitive decline monitoring", "Care coordination"] },
          ],
        },
        "workforce": {
          platforms: [
            { id: "mce", name: "Minority Center of Excellence", domain: "business-intelligence", url: "https://minoritycenterofexcellence.com", interventions: ["Business lifecycle tools", "SAM.gov integration", "Certification wizard", "Dual-AI proposal review"] },
            { id: "pinnacle-business-conglomerate", name: "Pinnacle Business Conglomerate", domain: "workforce-contracting", url: "https://pinnaclebusinessconglomerate.com", interventions: ["Contractor enablement", "MAP-GAP diagnostics", "Bid strategy", "Workforce pipeline"] },
            { id: "collaborative-advocate", name: "The Collaborative Advocate", domain: "veteran-services", url: "https://thrivingcommunitiesforall.com", interventions: ["Workforce development consulting", "Grant execution management", "Service delivery operations"] },
          ],
        },
        "housing": {
          platforms: [
            { id: "lifebridge", name: "LifeBridge", domain: "community-workforce", url: "https://lifetransitionsaid.org", interventions: ["Housing assistance", "24/7 resource navigation", "Social determinant scoring", "Community health worker dispatch"] },
          ],
        },
        "safety": {
          platforms: [
            { id: "safereport", name: "SafeReport", domain: "compliance", url: "https://safereports.net", interventions: ["Incident management", "50-state regulation database", "Compliance tracking", "Court-admissible records"] },
            { id: "emergency-mgmt", name: "Emergency Management", domain: "compliance", url: "https://shieldatlas.net", interventions: ["Geographic risk mapping", "Community resilience scoring", "Predictive safety modeling", "Emergency coordination"] },
          ],
        },
        "mental-health": {
          platforms: [
            { id: "perfectly-different", name: "Perfectly Different", domain: "health-equity", url: "https://neurodifferentassistant.app", interventions: ["Neurodiversity support", "IEP/504 plan assistance", "Executive function coaching", "Sensory management"] },
            { id: "safecognicare", name: "SafeCogniCare", domain: "health-equity", url: "https://safecognicare.com", interventions: ["Cognitive health assessments", "TBI screening", "Early intervention alerts", "Caregiver support"] },
            { id: "whole-person-health", name: "Whole-Person Health Ecosystem", domain: "health-equity", url: "https://mentalwellnesssupport.net", interventions: ["PHQ-9 depression screening", "GAD-7 anxiety screening", "C-SSRS suicidality screening", "Safety plan builder"] },
          ],
        },
        "veterans": {
          platforms: [
            { id: "m2c", name: "Mission Transition (M2C)", domain: "veterans", url: "https://vetmissiontransition.com", interventions: ["MOS/AFSC career translation", "Benefits navigation", "Identity transition support", "Proactive outreach"] },
            { id: "collaborative-advocate", name: "The Collaborative Advocate", domain: "veteran-services", url: "https://thrivingcommunitiesforall.com", interventions: ["Veteran advocacy", "Peer support coordination", "SSG Fox grant execution"] },
            { id: "sankofa-mens-health", name: "Black Men's Health Hub", domain: "health-equity", url: "https://thehealthyblkman.com", interventions: ["Veteran health pathways", "Mental health stigma reduction", "Peer mentor matching"] },
          ],
        },
        "research": {
          platforms: [
            { id: "betterscience", name: "RPLICE — Research-to-Practice Lifecycle Implementation & Community Evidence", domain: "education", url: "https://implementationineducatio.com", interventions: ["CFIR implementation framework", "RE-AIM evaluation", "Evidence-based practice registry", "Fidelity measurement", "Live community data assessment", "Outcome tracking"] },
          ],
        },
      };

      const factors = riskFactors || [
        "education", "health-equity", "workforce", "housing", "safety", "mental-health", "veterans", "research",
      ];

      const platformStatuses: Record<string, string> = {};
      try {
        const dbPlatforms = await db.select({
          id: ecosystemPlatforms.id,
          healthStatus: ecosystemPlatforms.healthStatus,
        }).from(ecosystemPlatforms);
        for (const p of dbPlatforms) {
          platformStatuses[p.id] = p.healthStatus || "unknown";
        }
      } catch {
      }

      const matches: { riskFactor: string; label: string; platforms: { id: string; name: string; domain: string; url: string; interventions: string[]; status: string }[] }[] = [];

      const RISK_LABELS: Record<string, string> = {
        "education": "Education Gaps",
        "health-equity": "Health Equity",
        "workforce": "Workforce Development",
        "housing": "Housing & Displacement",
        "safety": "Community Safety",
        "mental-health": "Mental Health",
        "veterans": "Veteran Services",
        "research": "Research & Evidence",
      };

      for (const factor of factors) {
        const mapping = PLATFORM_INTERVENTIONS[factor];
        if (!mapping) continue;

        matches.push({
          riskFactor: factor,
          label: RISK_LABELS[factor] || factor,
          platforms: mapping.platforms.map((p) => ({
            ...p,
            status: platformStatuses[p.id] || "unknown",
          })),
        });
      }

      res.json({ matches, totalPlatforms: new Set(matches.flatMap(m => m.platforms.map(p => p.id))).size });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/multi-ai-analysis", requireAuth, async (req, res) => {
    const { stateFips, countyFips, cityName, question } = req.body;
    if (!stateFips || !countyFips) return res.status(400).json({ error: "stateFips and countyFips required" });

    try {
      const [regionData, allRpliceResearch] = await Promise.all([
        gatherRegionData(stateFips, countyFips),
        fetchRplice("/api/research"),
      ]);
      const rpliceResearch = filterRpliceResearch(
        allRpliceResearch,
        (question || "community intervention implementation").split(/\s+/).filter(w => w.length > 3)
      );

      const prompt = `Using RPLICE frameworks (CFIR, RE-AIM, Three Realities, SALP), analyze this community data and answer: "${question || "What are the priority interventions for this community?"}"

Census Data Summary for ${cityName || regionData.targetCounty?.name}:
- Population: ${regionData.targetCounty?.population}
- College Attainment: ${regionData.targetCounty?.collegePct}%
- Poverty Rate: ${regionData.targetCounty?.povertyRate}%
- Unemployment: ${regionData.targetCounty?.unemploymentRate}%
- Median Income: $${regionData.targetCounty?.medianIncome}
- Marriage Rate: ${regionData.targetCounty?.marriagePct}%
- Children in 2-Parent Homes: ${regionData.targetCounty?.twoParentPct}%
- Neighborhood Income Gap: ${regionData.incomeGap}x
- High-Risk Tracts (risk 80+): ${regionData.highRiskTracts.length}
- Low-Risk Tracts (risk <15): ${regionData.lowRiskTracts.length}
- Tracts over 30% poverty: ${regionData.stats.tractsOver30Poverty}
- Gentrification: ${regionData.gentrificationIndicators.join("; ")}
${rpliceResearch?.length ? "\nRelevant research from RPLICE library: " + rpliceResearch.slice(0, 3).map((r: any) => r.title).join("; ") : ""}

Be specific. Use the actual data. Apply Dr. Flood's principle: education is the primary protective factor.`;

      const result = await generateMultiAIResponse(prompt, {
        ensemble: true,
        systemPrompt: "You are an implementation scientist working in the RPLICE framework. Apply CFIR 2.0, RE-AIM, Three Realities, and SALP to community analysis. Dr. Flood's research shows 1 year of college = primary protective factor.",
        maxTokens: 4000,
      });

      await db.insert(rpliceAssessments).values({
        assessmentType: "multi_ai_analysis",
        programName: cityName || regionData.targetCounty?.name || "Multi-AI Analysis",
        data: {
          stateFips, countyFips, question,
          providers: getProviderInfo().allProviders.map((p: any) => p.name),
          hasConsensus: !!result.consensus,
        },
        score: null,
        status: "complete",
      });

      res.json({
        primary: result.primary,
        secondary: result.secondary || null,
        consensus: result.consensus || null,
        providers: getProviderInfo().allProviders.map((p: any) => ({ name: p.name, model: p.model })),
        dataUsed: {
          county: regionData.targetCounty?.name,
          tracts: regionData.stats.totalTracts,
          highRisk: regionData.highRiskTracts.length,
          incomeGap: regionData.incomeGap + "x",
          gentrification: regionData.gentrificationIndicators,
          rpliceStudies: rpliceResearch?.length || 0,
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/baseline", requireAuth, async (req, res) => {
    try {
      const { regionName, stateFips, countyFips, metrics, targets, timelineMonths } = req.body;
      if (!regionName || !stateFips || !countyFips || !metrics) {
        return res.status(400).json({ error: "regionName, stateFips, countyFips, and metrics are required" });
      }
      const [row] = await db.insert(outcomeBaselines).values({
        regionName,
        stateFips,
        countyFips,
        metrics,
        targets: targets || {},
        timelineMonths: timelineMonths || 12,
        status: "active",
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/baselines", async (_req, res) => {
    try {
      const rows = await db.select().from(outcomeBaselines).orderBy(desc(outcomeBaselines.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/rplice/baseline/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { targets, timelineMonths, status } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (targets !== undefined) updates.targets = targets;
      if (timelineMonths !== undefined) updates.timelineMonths = timelineMonths;
      if (status !== undefined) updates.status = status;
      const [row] = await db.update(outcomeBaselines)
        .set(updates)
        .where(eq(outcomeBaselines.id, id))
        .returning();
      if (!row) return res.status(404).json({ error: "Baseline not found" });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rplice/action-plan", requireAuth, async (req, res) => {
    try {
      const { regionName, stateFips, countyFips, analysisData } = req.body;
      if (!regionName || !stateFips || !countyFips) {
        return res.status(400).json({ error: "regionName, stateFips, and countyFips are required" });
      }

      const summaryData = analysisData || {};
      const prompt = `Based on this RPLICE community analysis data, generate a 90-day action plan with 3 phases. Each phase has specific milestones.

Region: ${regionName}
Analysis Summary: ${JSON.stringify(summaryData).slice(0, 3000)}

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "phases": [
    {
      "name": "Phase 1: Assessment & Coalition Building",
      "days": "Days 1-30",
      "milestones": [
        {
          "title": "milestone title",
          "description": "what needs to happen",
          "owner": "suggested role/person",
          "deadline": "Day X",
          "status": "pending",
          "linkedPlatform": "relevant ecosystem platform or empty string"
        }
      ]
    },
    {
      "name": "Phase 2: Program Launch & Data Collection",
      "days": "Days 31-60",
      "milestones": [...]
    },
    {
      "name": "Phase 3: Evaluation & Course Correction",
      "days": "Days 61-90",
      "milestones": [...]
    }
  ]
}

Generate 4-6 milestones per phase. Make them specific to the region's data. Use RPLICE frameworks (CFIR, RE-AIM, SALP). Reference specific risk factors from the data. Milestones should be actionable and measurable.`;

      let phases: any[];
      try {
        const aiResult = await generateAIJSON<{ phases: any[] }>(prompt, "You are an implementation scientist generating action plans using the RPLICE framework. Return ONLY valid JSON.");
        phases = aiResult.phases || [];
      } catch {
        phases = [
          {
            name: "Phase 1: Assessment & Coalition Building",
            days: "Days 1-30",
            milestones: [
              { title: "Complete community needs assessment", description: "Gather baseline data from Census tracts and local stakeholders", owner: "Project Lead", deadline: "Day 7", status: "pending", linkedPlatform: "RPLICE" },
              { title: "Identify key stakeholders and partners", description: "Map organizations, agencies, and community leaders for coalition", owner: "Community Liaison", deadline: "Day 10", status: "pending", linkedPlatform: "" },
              { title: "Establish data collection protocols", description: "Set up SALP indicators and tracking dashboards", owner: "Data Analyst", deadline: "Day 15", status: "pending", linkedPlatform: "RPLICE" },
              { title: "Hold coalition kickoff meeting", description: "Present analysis findings and align on priorities", owner: "Project Lead", deadline: "Day 20", status: "pending", linkedPlatform: "" },
              { title: "Submit initial grant applications", description: "Target aligned federal and foundation opportunities", owner: "Grant Writer", deadline: "Day 30", status: "pending", linkedPlatform: "" },
            ],
          },
          {
            name: "Phase 2: Program Launch & Data Collection",
            days: "Days 31-60",
            milestones: [
              { title: "Launch pilot intervention programs", description: "Begin evidence-based programs in highest-risk tracts", owner: "Program Manager", deadline: "Day 35", status: "pending", linkedPlatform: "ThriveUp Academy" },
              { title: "Begin participant enrollment", description: "Recruit and screen participants using eligibility criteria", owner: "Intake Coordinator", deadline: "Day 40", status: "pending", linkedPlatform: "" },
              { title: "Implement fidelity monitoring", description: "Use RPLICE fidelity checklists for all program activities", owner: "Quality Manager", deadline: "Day 45", status: "pending", linkedPlatform: "RPLICE" },
              { title: "Collect baseline outcome data", description: "Record initial metrics for all enrolled participants", owner: "Data Analyst", deadline: "Day 50", status: "pending", linkedPlatform: "" },
              { title: "Monthly coalition progress report", description: "Share early data and adjust approach as needed", owner: "Project Lead", deadline: "Day 60", status: "pending", linkedPlatform: "" },
            ],
          },
          {
            name: "Phase 3: Evaluation & Course Correction",
            days: "Days 61-90",
            milestones: [
              { title: "Conduct RE-AIM evaluation", description: "Score all five dimensions for each active program", owner: "Evaluator", deadline: "Day 65", status: "pending", linkedPlatform: "RPLICE" },
              { title: "Analyze preliminary outcomes", description: "Compare participant outcomes to baseline data", owner: "Data Analyst", deadline: "Day 70", status: "pending", linkedPlatform: "" },
              { title: "Identify and implement course corrections", description: "Address gaps found in fidelity and outcome data", owner: "Program Manager", deadline: "Day 75", status: "pending", linkedPlatform: "" },
              { title: "Prepare sustainability plan", description: "Outline funding, staffing, and partnership strategies beyond 90 days", owner: "Project Lead", deadline: "Day 85", status: "pending", linkedPlatform: "" },
              { title: "Submit 90-day impact report", description: "Comprehensive report with data, outcomes, and next steps", owner: "Project Lead", deadline: "Day 90", status: "pending", linkedPlatform: "" },
            ],
          },
        ];
      }

      const [row] = await db.insert(rpliceActionPlans).values({
        regionName,
        stateFips,
        countyFips,
        analysisData: summaryData,
        phases,
        status: "active",
      }).returning();

      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rplice/action-plans", async (_req, res) => {
    try {
      const rows = await db.select().from(rpliceActionPlans).orderBy(desc(rpliceActionPlans.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/rplice/action-plan/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { phases, status } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (phases !== undefined) updates.phases = phases;
      if (status !== undefined) updates.status = status;
      const [row] = await db.update(rpliceActionPlans)
        .set(updates)
        .where(eq(rpliceActionPlans.id, id))
        .returning();
      if (!row) return res.status(404).json({ error: "Action plan not found" });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── RPLICE Compute Engine Routes ─────────────────────────────────────────────
  // All require RPLICE_API_KEY. Return 503 with clear message when key not set.
  // Documented at: https://www.bettersciencelab.com/api-docs

  /**
   * MAP-GAP Assessment Engine
   * POST /api/rplice/compute/mapgap
   * Body: { programName, currentState, targetState, domains[], barriers[], facilitators[] }
   */
  app.post("/api/rplice/compute/mapgap", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set — add the secret to unlock compute engines", engine: "MAP-GAP" });
      }
      const result = await postRplice("/api/v1/partner/mapgap/assess", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE MAP-GAP engine did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * Implementation Preflight Engine
   * POST /api/rplice/compute/preflight
   * Body: { programName, interventionType, targetPopulation, settingType, fidelityRequirements, cfirBarriers[] }
   */
  app.post("/api/rplice/compute/preflight", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set — add the secret to unlock compute engines", engine: "Preflight" });
      }
      const result = await postRplice("/api/v1/partner/preflight", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE Preflight engine did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * Behavioral Determinants Monte Carlo Engine (TDF/COM-B)
   * POST /api/rplice/compute/monte-carlo/behavioral
   * Body: { behavior, population, priors: { capability, opportunity, motivation }, iterations? }
   * Returns: probability distributions + driver correlations (P50/P80)
   */
  app.post("/api/rplice/compute/monte-carlo/behavioral", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set — add the secret to unlock compute engines", engine: "MC-Behavioral" });
      }
      const result = await postRplice("/api/v1/partner/monte-carlo/behavioral", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE Behavioral MC engine did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * Cost-Effectiveness Monte Carlo Engine
   * POST /api/rplice/compute/monte-carlo/cea
   * Body: { intervention, comparator, costs: { low, mid, high }, outcomes: { low, mid, high }, iterations? }
   * Returns: ICER distribution, P50/P80 thresholds, net benefit curve
   */
  app.post("/api/rplice/compute/monte-carlo/cea", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set — add the secret to unlock compute engines", engine: "MC-CEA" });
      }
      const result = await postRplice("/api/v1/partner/monte-carlo/cea", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE CEA MC engine did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * Statistical Analysis Engine
   * POST /api/rplice/compute/stats
   * Body: { method: "mann-whitney"|"did"|"its"|"logistic", data, groupVar?, outcomeVar?, covariates? }
   * Returns: test statistic, p-value, effect size, confidence intervals, interpretation
   */
  app.post("/api/rplice/compute/stats", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set — add the secret to unlock compute engines", engine: "Stats" });
      }
      const result = await postRplice("/api/v1/partner/stats/run", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE Stats engine did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * RPLICE Compute Engine Catalog
   * GET /api/rplice/compute/catalog
   * Returns the list of 11 available compute engines and their schemas (public, no auth required)
   */
  app.get("/api/rplice/compute/catalog", async (_req, res) => {
    try {
      const catalog = await fetchRplice("/api/v1/partner/execution/catalog");
      if (!catalog) {
        return res.json({
          keyConfigured: !!RPLICE_API_KEY,
          engines: [
            { id: "mapgap", name: "MAP-GAP Assessment", endpoint: "POST /api/rplice/compute/mapgap" },
            { id: "preflight", name: "Implementation Preflight", endpoint: "POST /api/rplice/compute/preflight" },
            { id: "monte-carlo-behavioral", name: "Behavioral Determinants Monte Carlo (TDF/COM-B)", endpoint: "POST /api/rplice/compute/monte-carlo/behavioral" },
            { id: "monte-carlo-cea", name: "Cost-Effectiveness Monte Carlo", endpoint: "POST /api/rplice/compute/monte-carlo/cea" },
            { id: "stats", name: "Statistical Analysis (Mann-Whitney, DID, ITS, Logistic)", endpoint: "POST /api/rplice/compute/stats" },
          ],
          note: RPLICE_API_KEY ? "API key configured — engines ready" : "Add RPLICE_API_KEY secret to unlock engines",
        });
      }
      res.json({ ...catalog, keyConfigured: !!RPLICE_API_KEY });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * Grant Alignment Engine (authenticated)
   * POST /api/rplice/compute/grant-alignment
   * Body: { grantId?, grantTitle, focusAreas[], cfirBarriers[], targetPopulation, serviceArea }
   * Returns: alignment scores, narrative guidance, section-by-section strategy
   */
  app.post("/api/rplice/compute/grant-alignment", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set", engine: "Grant-Alignment" });
      }
      const result = await postRplice("/api/v1/grants/alignment", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE grant alignment engine did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * Implementation Strategy Matcher (ERIC taxonomy)
   * POST /api/rplice/compute/impl-strategy-match
   * Body: { barriers[], context, targetBehavior, cfirDomains[] }
   * Returns: ranked ERIC strategies with rationale
   */
  app.post("/api/rplice/compute/impl-strategy-match", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set", engine: "ERIC-Match" });
      }
      const result = await postRplice("/api/v1/implementation-strategy/match", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE implementation strategy matcher did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /**
   * Fidelity Scorer
   * POST /api/rplice/compute/fidelity-score
   * Body: { intervention, observedComponents[], requiredComponents[], adaptations[] }
   * Returns: fidelity score, component-level analysis, adaptation classification
   */
  app.post("/api/rplice/compute/fidelity-score", requireAuth, async (req, res) => {
    try {
      if (!RPLICE_API_KEY) {
        return res.status(503).json({ error: "RPLICE_API_KEY not set", engine: "Fidelity" });
      }
      const result = await postRplice("/api/v1/fidelity/score", req.body);
      if (!result) return res.status(502).json({ error: "RPLICE fidelity scorer did not respond" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
