import type { Express, NextFunction, Request, Response } from "express";
import { createHash } from "node:crypto";
import { db } from "./storage";
import {
  chainwebScenarios, chainwebNodes, chainwebEdges,
  chainwebCalculations, chainwebNarratives,
  insertChainwebScenarioSchema, ecosystemPlatforms,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  buildChainwebScenario, calculateChainwebROI,
  generateChainwebNarrative, getChainwebRAGContext,
} from "./chainweb-engine";
import {
  CHAINWEB_COEFFICIENTS, CHAINWEB_DOMAINS, CHAINWEB_TEMPLATES,
  EVIDENCE_PROGRAMS, JURISDICTION_DATA,
} from "./chainweb-coefficients";
import { receiveCivicSignalLesson } from "./civic-signal-connector";

// ── External API auth + rate-limiting (for Civic Signal and partner platforms) ──
const externalRateBucket = new Map<string, { count: number; resetAt: number }>();

// Validates x-ecosystem-key against:
// 1. Any registered ecosystem platform's api_key (DB lookup — self-managing, no secrets needed)
// 2. Optional env var overrides (CIVIC_SIGNAL_ECOSYSTEM_KEY etc.)
// 3. Dev fallback: any tveco_ prefix
async function cwExternalAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-ecosystem-key"] as string;
  if (!key) return res.status(401).json({ error: "Missing x-ecosystem-key header" });

  try {
    // Primary: check against registered ecosystem platforms (covers all owned platforms automatically)
    const platform = await db
      .select({ id: ecosystemPlatforms.id, name: ecosystemPlatforms.name })
      .from(ecosystemPlatforms)
      .where(eq(ecosystemPlatforms.apiKey, key))
      .limit(1);

    if (platform.length > 0) return next();

    // Secondary: env var overrides
    const envKeys = [
      process.env.CIVIC_SIGNAL_ECOSYSTEM_KEY,
      process.env.ECOSYSTEM_PARTNER_KEY_1,
      process.env.ECOSYSTEM_PARTNER_KEY_2,
    ].filter(Boolean);
    if (envKeys.includes(key)) return next();

    // Dev fallback
    if (process.env.NODE_ENV !== "production" && key.startsWith("tveco_")) return next();

    return res.status(403).json({ error: "Invalid x-ecosystem-key — register your platform at /api/ecosystem/register-key" });
  } catch (err) {
    return res.status(500).json({ error: "Auth check failed" });
  }
}

function cwExternalRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-ecosystem-key"] as string || "anon";
  const ipRaw = req.socket.remoteAddress || "0.0.0.0";
  const bucket = createHash("sha256").update(key + ipRaw).digest("hex").slice(0, 24);
  const now = Date.now();

  const entry = externalRateBucket.get(bucket);
  const windowMs = 60_000; // 1 minute
  const maxPerMinute = 60;

  if (!entry || entry.resetAt < now) {
    externalRateBucket.set(bucket, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= maxPerMinute) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfterMs: entry.resetAt - now,
      limit: `${maxPerMinute} requests/minute`,
    });
  }
  entry.count += 1;
  return next();
}

export function registerChainwebRoutes(app: Express) {

  // ── Metadata ─────────────────────────────────────────────────────────────
  app.get("/api/chainweb/domains", (_req: Request, res: Response) => {
    res.json(CHAINWEB_DOMAINS);
  });

  app.get("/api/chainweb/coefficients", (_req: Request, res: Response) => {
    const { fromDomain, toDomain } = (_req as any).query;
    let data = CHAINWEB_COEFFICIENTS;
    if (fromDomain) data = data.filter(c => c.fromDomain === fromDomain);
    if (toDomain)   data = data.filter(c => c.toDomain === toDomain);
    res.json(data);
  });

  app.get("/api/chainweb/templates", (_req: Request, res: Response) => {
    res.json(CHAINWEB_TEMPLATES);
  });

  // ── Scenarios ─────────────────────────────────────────────────────────────
  app.get("/api/chainweb/scenarios", async (_req: Request, res: Response) => {
    try {
      const scenarios = await db.select().from(chainwebScenarios)
        .orderBy(chainwebScenarios.createdAt);
      res.json(scenarios);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/chainweb/scenarios/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [scenario] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      if (!scenario) return res.status(404).json({ error: "Not found" });

      const nodes = await db.select().from(chainwebNodes).where(eq(chainwebNodes.scenarioId, id));
      const edges = await db.select().from(chainwebEdges).where(eq(chainwebEdges.scenarioId, id));
      const calcs = await db.select().from(chainwebCalculations).where(eq(chainwebCalculations.scenarioId, id));

      res.json({ scenario, nodes, edges, calculation: calcs[0] || null });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/chainweb/scenarios", async (req: Request, res: Response) => {
    try {
      const parsed = insertChainwebScenarioSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const [scenario] = await db.insert(chainwebScenarios).values(parsed.data).returning();
      res.json(scenario);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/chainweb/scenarios/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [updated] = await db.update(chainwebScenarios)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(chainwebScenarios.id, id))
        .returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/chainweb/scenarios/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(chainwebEdges).where(eq(chainwebEdges.scenarioId, id));
      await db.delete(chainwebNodes).where(eq(chainwebNodes.scenarioId, id));
      await db.delete(chainwebCalculations).where(eq(chainwebCalculations.scenarioId, id));
      await db.delete(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Calculate ROI ─────────────────────────────────────────────────────────
  app.post("/api/chainweb/scenarios/:id/calculate", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Build the causal web first
      await buildChainwebScenario(id);
      // Then calculate ROI
      const calculation = await calculateChainwebROI(id);
      // Mark scenario as calculated
      await db.update(chainwebScenarios)
        .set({ status: "calculated", updatedAt: new Date() })
        .where(eq(chainwebScenarios.id, id));
      res.json(calculation);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Narratives ────────────────────────────────────────────────────────────
  app.post("/api/chainweb/calculations/:id/narratives", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { audience } = req.body as {
        audience: "grant_writer" | "org_leader" | "researcher" | "council" | "funder"
      };
      if (!audience) return res.status(400).json({ error: "audience required" });

      const result = await generateChainwebNarrative(id, audience);

      // Persist narrative
      const existing = await db.select().from(chainwebNarratives)
        .where(eq(chainwebNarratives.calculationId, id));
      const existingForAudience = existing.find(n => n.audienceType === audience);

      if (existingForAudience) {
        await db.update(chainwebNarratives)
          .set({
            headline: result.headline,
            narrativeText: result.narrative,
            keyStats: result.keyStats,
            dataCitations: result.citations,
            generatedAt: new Date(),
          })
          .where(eq(chainwebNarratives.id, existingForAudience.id));
      } else {
        await db.insert(chainwebNarratives).values({
          calculationId: id,
          audienceType: audience,
          headline: result.headline,
          narrativeText: result.narrative,
          keyStats: result.keyStats,
          dataCitations: result.citations,
        });
      }

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/chainweb/calculations/:id/narratives", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const narratives = await db.select().from(chainwebNarratives)
        .where(eq(chainwebNarratives.calculationId, id));
      res.json(narratives);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── RAG context endpoint (internal use) ───────────────────────────────────
  app.get("/api/chainweb/rag-context", async (req: Request, res: Response) => {
    try {
      const { grantType, geography, domain } = req.query as Record<string, string>;
      const context = await getChainwebRAGContext(grantType, geography, domain);
      res.json({ context });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Quick scenario from template ──────────────────────────────────────────
  app.post("/api/chainweb/from-template", async (req: Request, res: Response) => {
    try {
      const { templateId, geographyLabel, geographyFips, populationSize, interventionCostPerPerson } = req.body;
      const template = CHAINWEB_TEMPLATES.find(t => t.id === templateId);
      if (!template) return res.status(404).json({ error: "Template not found" });

      const [scenario] = await db.insert(chainwebScenarios).values({
        name: template.name,
        description: template.description,
        geographyType: "county",
        geographyLabel: geographyLabel || "Travis County, TX",
        geographyFips: geographyFips || "48453",
        entryDomain: template.entryDomain,
        interventionName: template.interventionName,
        interventionDescription: template.description,
        interventionCostPerPerson: String(interventionCostPerPerson || 9500),
        populationSize: populationSize || 1000,
        timeHorizonYears: 10,
        status: "draft",
      }).returning();

      await buildChainwebScenario(scenario.id);
      const calculation = await calculateChainwebROI(scenario.id);
      await db.update(chainwebScenarios)
        .set({ status: "calculated", updatedAt: new Date() })
        .where(eq(chainwebScenarios.id, scenario.id));

      res.json({ scenario, calculation });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // EXTERNAL PARTNER API — authenticated + rate-limited
  // Auth: x-ecosystem-key header (value issued per partner platform)
  // Rate limit: 60 req/min per key
  // Intended consumers: Civic Signal adaptation engine, ecosystem partners
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Program/Intervention Lookup ────────────────────────────────────────
  // GET /api/chainweb/programs?topic=nurse+home+visiting&domain=early_childhood&limit=5
  // Returns matching evidence-based programs with outcomes, effect sizes, ROI
  app.get("/api/chainweb/programs", cwExternalAuth, cwExternalRateLimit, (req: Request, res: Response) => {
    const { topic = "", domain = "", limit = "10" } = req.query as Record<string, string>;
    const maxResults = Math.min(parseInt(limit) || 10, 25);

    const topicLower = topic.toLowerCase().trim();
    const domainLower = domain.toLowerCase().trim();

    let results = EVIDENCE_PROGRAMS;

    if (topicLower) {
      results = results.filter(p =>
        p.topicKeywords.some(kw => kw.includes(topicLower) || topicLower.includes(kw)) ||
        p.name.toLowerCase().includes(topicLower) ||
        p.shortName.toLowerCase().includes(topicLower) ||
        p.targetPopulation.toLowerCase().includes(topicLower)
      );
    }

    if (domainLower) {
      results = results.filter(p => p.domains.includes(domainLower));
    }

    // Sort: strong evidence first, then by ROI descending
    results = results.sort((a, b) => {
      const qualityOrder = { strong: 0, moderate: 1, emerging: 2 };
      const qDiff = qualityOrder[a.replicationQuality] - qualityOrder[b.replicationQuality];
      if (qDiff !== 0) return qDiff;
      return (b.roiPerDollar || 0) - (a.roiPerDollar || 0);
    }).slice(0, maxResults);

    res.json({
      query: { topic, domain, limit: maxResults },
      count: results.length,
      programs: results.map(p => ({
        id: p.id,
        name: p.name,
        shortName: p.shortName,
        domains: p.domains,
        targetPopulation: p.targetPopulation,
        deliveryModel: p.deliveryModel,
        roiPerDollar: p.roiPerDollar,
        replicationQuality: p.replicationQuality,
        clearinghouseRating: p.clearinghouseRating,
        topEffectSize: p.effectSizes[0] || null,
        notes: p.notes,
      })),
    });
  });

  // ── 2. Evidence Detail by Program ID ──────────────────────────────────────
  // GET /api/chainweb/programs/:id/evidence
  // Returns full evidence record: all effect sizes, what worked, what failed, citations
  app.get("/api/chainweb/programs/:id/evidence", cwExternalAuth, cwExternalRateLimit, (req: Request, res: Response) => {
    const program = EVIDENCE_PROGRAMS.find(p => p.id === req.params.id);
    if (!program) {
      return res.status(404).json({
        error: `Program '${req.params.id}' not found`,
        availableIds: EVIDENCE_PROGRAMS.map(p => p.id),
      });
    }

    // Also pull matching causal coefficients from the library
    const matchingCoefficients = CHAINWEB_COEFFICIENTS.filter(c =>
      program.domains.includes(c.fromDomain) || program.domains.includes(c.toDomain)
    ).map(c => ({
      fromDomain: c.fromDomain,
      toDomain: c.toDomain,
      fromMetric: c.fromMetric,
      toMetric: c.toMetric,
      coefficient: c.coefficient,
      direction: c.direction,
      lagYears: c.lagYears,
      unit: c.unit,
      evidenceCitation: c.evidenceCitation,
      confidenceLevel: c.confidenceLevel,
    }));

    res.json({
      program,
      causaLCoefficients: matchingCoefficients,
      meta: {
        source: "ThriveUp Academy / TCAF Evidence Library",
        lastUpdated: "2024-12-01",
        contact: "terryflood@thrivingcommunitiesforall.com",
        disclaimer: "Effect sizes are from peer-reviewed literature. TCAF program data (Dads Care 2) is primary-source organizational data available upon request.",
      },
    });
  });

  // ── 3. State/Jurisdiction Policy History ──────────────────────────────────
  // GET /api/chainweb/jurisdiction?state=TX&topic=pre-k&outcome=effective
  // Returns what a state/jurisdiction has tried on a topic and what happened
  app.get("/api/chainweb/jurisdiction", cwExternalAuth, cwExternalRateLimit, (req: Request, res: Response) => {
    const { state = "", topic = "", outcome = "" } = req.query as Record<string, string>;
    const stateLower = state.toLowerCase().trim();
    const topicLower = topic.toLowerCase().trim();

    let results = JURISDICTION_DATA;

    if (stateLower) {
      results = results.filter(j =>
        j.stateCode.toLowerCase() === stateLower ||
        j.state.toLowerCase().includes(stateLower)
      );
    }

    if (topicLower) {
      results = results.filter(j =>
        j.topicKeywords.some(kw => kw.includes(topicLower) || topicLower.includes(kw)) ||
        j.topic === topicLower ||
        j.policyName.toLowerCase().includes(topicLower)
      );
    }

    if (outcome) {
      results = results.filter(j => j.outcome === outcome);
    }

    // Also attach relevant programs from the catalog
    const relatedPrograms = topicLower
      ? EVIDENCE_PROGRAMS.filter(p =>
          p.topicKeywords.some(kw => kw.includes(topicLower) || topicLower.includes(kw))
        ).map(p => ({ id: p.id, name: p.name, roiPerDollar: p.roiPerDollar, replicationQuality: p.replicationQuality }))
      : [];

    res.json({
      query: { state, topic, outcome },
      count: results.length,
      jurisdictionRecords: results,
      relatedEvidencePrograms: relatedPrograms,
      meta: {
        source: "ThriveUp Academy / TCAF Policy Intelligence Library",
        note: "Jurisdiction records reflect published evaluations and publicly available outcome data. TCAF-specific program data is available upon request.",
        contact: "terryflood@thrivingcommunitiesforall.com",
      },
    });
  });

  // ── 4. Civic Signal Webhook — receive policy lessons ──────────────────────
  // POST /api/chainweb/webhook/civic-signal
  // Civic Signal pushes policy adaptation lessons back to ThriveUp
  app.post("/api/chainweb/webhook/civic-signal", cwExternalAuth, async (req: Request, res: Response) => {
    try {
      const result = await receiveCivicSignalLesson(req.body);
      res.json({ ok: true, received: result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── 5. API Discovery endpoint (no auth — tells partners what's available) ──
  app.get("/api/chainweb/api-info", (_req: Request, res: Response) => {
    res.json({
      platform: "ThriveUp Academy / TCAF Chainweb Evidence Engine",
      version: "1.0.0",
      contact: "terryflood@thrivingcommunitiesforall.com",
      auth: {
        method: "Header",
        headerName: "x-ecosystem-key",
        keyFormat: "tveco_[platformname]_[hash]",
        obtainKey: "Contact terryflood@thrivingcommunitiesforall.com to register your platform",
      },
      baseUrl: "https://thrivingcommunitiesforall.com",
      rateLimit: { requestsPerMinute: 60, dailyLimit: 5000 },
      endpoints: [
        {
          method: "GET", path: "/api/chainweb/programs",
          description: "Search evidence-based programs by topic keyword and/or domain",
          params: ["topic (string)", "domain (string)", "limit (integer, max 25)"],
          example: "/api/chainweb/programs?topic=nurse+home+visiting",
        },
        {
          method: "GET", path: "/api/chainweb/programs/:id/evidence",
          description: "Full evidence record for a specific program: effect sizes, what worked, what failed, causal coefficients",
          params: ["id (program ID from /programs list)"],
          example: "/api/chainweb/programs/nurse_family_partnership/evidence",
        },
        {
          method: "GET", path: "/api/chainweb/jurisdiction",
          description: "State/jurisdiction policy history: what was tried, outcomes (effective/null/harmful/mixed)",
          params: ["state (2-letter code or full name)", "topic (string)", "outcome (effective|null_effect|harmful|mixed|ongoing_promising)"],
          example: "/api/chainweb/jurisdiction?state=TX&topic=pre-k",
        },
        {
          method: "GET", path: "/api/chainweb/coefficients",
          description: "26 evidence-based causal ripple coefficients (open, no auth required)",
          params: ["fromDomain (optional)", "toDomain (optional)"],
          example: "/api/chainweb/coefficients?fromDomain=early_childhood",
        },
        {
          method: "GET", path: "/api/chainweb/rag-context",
          description: "Pre-formatted evidence paragraph for AI injection (open, no auth required)",
          params: ["geography (string)", "domain (string)", "grantType (string)"],
          example: "/api/chainweb/rag-context?geography=Travis+County&domain=education",
        },
        {
          method: "POST", path: "/api/chainweb/webhook/civic-signal",
          description: "Receive policy adaptation lessons from Civic Signal (bidirectional flow)",
          body: "{ lesson: string, topic: string, state: string, source: string, confidence: string }",
        },
      ],
      programCount: EVIDENCE_PROGRAMS.length,
      jurisdictionRecordCount: JURISDICTION_DATA.length,
      coefficientCount: CHAINWEB_COEFFICIENTS.length,
    });
  });
}
