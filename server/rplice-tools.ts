import type { Express, Response } from "express";
import { db } from "./storage";
import { rpliceAssessments } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { generateAIJSON, streamAIResponse, generateMultiAIResponse, getProviderInfo } from "./ai-provider";

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
  app.post("/api/rplice/cfir-assessment", async (req, res) => {
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

  app.post("/api/rplice/reaim-scorecard", async (req, res) => {
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

  app.post("/api/rplice/fidelity-checklist", async (req, res) => {
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

  app.post("/api/rplice/three-realities", async (req, res) => {
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

  app.post("/api/rplice/quality-reviews/:id/resolve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  const RPLICE_BASE = "https://salp-science--mrterryflood.replit.app";

  async function fetchRplice(path: string): Promise<any> {
    try {
      const resp = await fetch(`${RPLICE_BASE}${path}`, { signal: AbortSignal.timeout(12000) });
      if (!resp.ok) return null;
      return await resp.json();
    } catch { return null; }
  }

  app.post("/api/rplice/community-analysis", async (req, res) => {
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

      const [regionData, rpliceFrameworks, rpliceResearch, rpliceEcosystem] = await Promise.all([
        gatherRegionData(stateFips, countyFips),
        fetchRplice("/api/frameworks/list"),
        fetchRplice(`/api/research/search?q=${encodeURIComponent((focusAreas || ["poverty", "education", "violence prevention"]).join(" "))}`),
        fetchRplice("/api/ecosystem/status"),
      ]);

      send("status", { message: "Census data loaded — " + regionData.stats.totalTracts + " tracts analyzed" });
      send("data", {
        section: "census",
        county: regionData.targetCounty,
        stats: regionData.stats,
        incomeGap: regionData.incomeGap,
        gentrification: regionData.gentrificationIndicators,
        timeline: regionData.timeline,
      });

      send("status", { message: "RPLICE research library queried — " + (rpliceResearch?.length || 0) + " studies found" });
      send("data", {
        section: "rplice",
        frameworks: rpliceFrameworks,
        researchCount: rpliceResearch?.length || 0,
        topStudies: (rpliceResearch || []).slice(0, 5).map((r: any) => ({ title: r.title, authors: r.authors, year: r.year })),
        ecosystemStatus: rpliceEcosystem,
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

  app.post("/api/rplice/multi-ai-analysis", async (req, res) => {
    const { stateFips, countyFips, cityName, question } = req.body;
    if (!stateFips || !countyFips) return res.status(400).json({ error: "stateFips and countyFips required" });

    try {
      const [regionData, rpliceResearch] = await Promise.all([
        gatherRegionData(stateFips, countyFips),
        fetchRplice(`/api/research/search?q=${encodeURIComponent(question || "community intervention implementation")}`),
      ]);

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
}
