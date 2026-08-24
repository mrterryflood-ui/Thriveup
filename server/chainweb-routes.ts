import type { Express, NextFunction, Request, Response } from "express";
import { createHash } from "node:crypto";
import { db, storage } from "./storage";
import {
  chainwebScenarios, chainwebNodes, chainwebEdges,
  chainwebCalculations, chainwebNarratives,
  insertChainwebScenarioSchema, ecosystemPlatforms,
} from "@shared/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  buildChainwebScenario, calculateChainwebROI,
  generateChainwebNarrative, getChainwebRAGContext,
} from "./chainweb-engine";
import {
  CHAINWEB_COEFFICIENTS, CHAINWEB_DOMAINS, CHAINWEB_TEMPLATES,
  EVIDENCE_PROGRAMS, JURISDICTION_DATA,
} from "./chainweb-coefficients";
import { receiveCivicSignalLesson } from "./civic-signal-connector";
import { assembleImpactChain } from "./impact-chain-contract";

// ── External API auth + rate-limiting (for Civic Signal and partner platforms) ──
const externalRateBucket = new Map<string, { count: number; resetAt: number }>();
const pendingNarratives = new Map<string, Promise<Awaited<ReturnType<typeof generateChainwebNarrative>>>>();

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

// Daily counter bucket — enforces the 5000/day limit advertised in /api-info.
// Previously that daily limit was documented but never enforced (dishonest).
const externalDailyBucket = new Map<string, { count: number; resetAt: number }>();

function cwExternalRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-ecosystem-key"] as string || "anon";
  const ipRaw = req.socket.remoteAddress || "0.0.0.0";
  const bucket = createHash("sha256").update(key + ipRaw).digest("hex").slice(0, 24);
  const now = Date.now();

  const windowMs = 60_000; // 1 minute
  const maxPerMinute = 60;
  const dailyMs = 24 * 60 * 60 * 1000;
  const maxPerDay = 5000; // matches the advertised limit in /api/chainweb/api-info

  // ── Daily limit (honest enforcement of the advertised 5000/day) ──────────
  const daily = externalDailyBucket.get(bucket);
  if (!daily || daily.resetAt < now) {
    externalDailyBucket.set(bucket, { count: 1, resetAt: now + dailyMs });
  } else {
    if (daily.count >= maxPerDay) {
      return res.status(429).json({
        error: "Daily rate limit exceeded",
        retryAfterMs: daily.resetAt - now,
        limit: `${maxPerDay} requests/day`,
      });
    }
    daily.count += 1;
  }

  // ── Per-minute limit ─────────────────────────────────────────────────────
  const entry = externalRateBucket.get(bucket);
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

// ── First-party session auth (mirrors requireAuth/requireAdmin in server/routes.ts) ──
// Roles live in the users table, never on req.user — resolve via storage.getUser.
function cwGetUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub || user?.id;
}

function cwRequireAuth(req: Request, res: Response, next: NextFunction) {
  if (!cwGetUserId(req)) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

const CW_ADMIN_ROLES = new Set(["admin", "teacher"]);
async function cwIsAdmin(req: Request): Promise<boolean> {
  const userId = cwGetUserId(req);
  if (!userId) return false;
  const user = await storage.getUser(userId);
  return Boolean(user && CW_ADMIN_ROLES.has(user.role));
}

const firstPartyBuckets = new Map<string, { count: number; resetAt: number }>();
function cwUserRateLimit(req: Request, res: Response, next: NextFunction) {
  const userId = cwGetUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  const now = Date.now();
  const key = `${userId}:${req.path}`;
  const bucket = firstPartyBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    firstPartyBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (bucket.count >= 30) return res.status(429).json({ error: "Rate limit exceeded. Try again shortly." });
  bucket.count += 1;
  return next();
}

const templateScenarioInputSchema = z.object({
  templateId: z.string().min(1).max(100),
  geographyLabel: z.string().trim().min(2).max(160),
  geographyFips: z.string().trim().regex(/^\d{5}$/, "A five-digit county Census code is required"),
  populationSize: z.coerce.number().int().positive().max(10_000_000),
  interventionCostPerPerson: z.coerce.number().positive().max(1_000_000),
});

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
  app.get("/api/chainweb/scenarios", async (req: Request, res: Response) => {
    try {
      const userId = cwGetUserId(req);
      const isAdmin = await cwIsAdmin(req);
      const scenarios = await db.select().from(chainwebScenarios)
        .where(isAdmin ? undefined : userId
          ? or(isNull(chainwebScenarios.createdBy), eq(chainwebScenarios.createdBy, userId))
          : isNull(chainwebScenarios.createdBy))
        .orderBy(chainwebScenarios.createdAt);
      res.json(scenarios);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Reads of a scenario OWNED by someone (createdBy set) require auth + ownership,
  // since scenarios carry the caller's causal-web inputs. Legacy rows with a null
  // createdBy predate ownership tracking and stay publicly readable (documented
  // decision) so existing links do not break.
  app.get("/api/chainweb/scenarios/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const [scenario] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      if (!scenario) return res.status(404).json({ error: "Not found" });

      if (scenario.createdBy) {
        const userId = cwGetUserId(req);
        if (!userId) return res.status(401).json({ error: "Authentication required" });
        if (scenario.createdBy !== userId && !(await cwIsAdmin(req))) {
          return res.status(403).json({ error: "You may only view scenarios you created" });
        }
      }

      const nodes = await db.select().from(chainwebNodes).where(eq(chainwebNodes.scenarioId, id));
      const edges = await db.select().from(chainwebEdges).where(eq(chainwebEdges.scenarioId, id));
      const calcs = await db.select().from(chainwebCalculations).where(eq(chainwebCalculations.scenarioId, id));
      const narratives = calcs[0]
        ? await db.select().from(chainwebNarratives).where(eq(chainwebNarratives.calculationId, calcs[0].id))
        : [];
      res.json({
        scenario, nodes, edges, calculation: calcs[0] || null, narratives,
        impactChain: assembleImpactChain({ scenario, nodes, calculation: calcs[0] || null, narratives }),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Mutations require an authenticated first-party user. The scenario table has a
  // createdBy column, so we track ownership and enforce it on PATCH/DELETE — a
  // user may only modify/delete scenarios they created. createdBy is set from the
  // session, never trusted from the request body.
  app.post("/api/chainweb/scenarios", cwRequireAuth, cwUserRateLimit, async (req: Request, res: Response) => {
    try {
      const parsed = insertChainwebScenarioSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const userId = cwGetUserId(req)!;
      const { createdBy: _ignoreOwner, status: _ignoreStatus, populationProfile: _ignoreProfile, ...scenarioInput } = parsed.data;
      const [scenario] = await db.insert(chainwebScenarios)
        .values({ ...scenarioInput, status: "draft", createdBy: userId })
        .returning();
      res.json(scenario);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/chainweb/scenarios/:id", cwRequireAuth, cwUserRateLimit, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const userId = cwGetUserId(req)!;

      const [existing] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      if (!existing) return res.status(404).json({ error: "Not found" });
      if (existing.createdBy !== userId && !(await cwIsAdmin(req))) {
        return res.status(403).json({ error: "You may only modify scenarios you created" });
      }

      // Validate against the insert schema's .partial() — this strips unknown
      // keys (Zod objects are strip-by-default) and rejects malformed values,
      // matching the POST path's validation contract.
      const parsed = insertChainwebScenarioSchema.partial().safeParse(req.body ?? {});
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      // Never let the client reassign ownership.
      const { createdBy: _ignore, populationProfile: _ignoreProfile, ...body } = parsed.data;
      if (body.status === "published" && !(await cwIsAdmin(req))) {
        return res.status(403).json({ error: "Only an authorized reviewer may publish a scenario" });
      }
      const [updated] = await db.update(chainwebScenarios)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(chainwebScenarios.id, id))
        .returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/chainweb/scenarios/:id", cwRequireAuth, cwUserRateLimit, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const userId = cwGetUserId(req)!;

      const [existing] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      if (!existing) return res.status(404).json({ error: "Not found" });
      if (existing.createdBy !== userId && !(await cwIsAdmin(req))) {
        return res.status(403).json({ error: "You may only delete scenarios you created" });
      }

      await db.transaction(async (tx) => {
        const calculations = await tx.select().from(chainwebCalculations).where(eq(chainwebCalculations.scenarioId, id));
        for (const calculation of calculations) {
          await tx.delete(chainwebNarratives).where(eq(chainwebNarratives.calculationId, calculation.id));
        }
        await tx.delete(chainwebEdges).where(eq(chainwebEdges.scenarioId, id));
        await tx.delete(chainwebNodes).where(eq(chainwebNodes.scenarioId, id));
        await tx.delete(chainwebCalculations).where(eq(chainwebCalculations.scenarioId, id));
        await tx.delete(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Calculate ROI ─────────────────────────────────────────────────────────
  // Calculate mutates the scenario (status + calculation rows) — require auth
  // and ownership so a user cannot recompute/overwrite scenarios they don't own.
  app.post("/api/chainweb/scenarios/:id/calculate", cwRequireAuth, cwUserRateLimit, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const userId = cwGetUserId(req)!;
      const [existing] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, id));
      if (!existing) return res.status(404).json({ error: "Not found" });
      if (existing.createdBy !== userId && !(await cwIsAdmin(req))) {
        return res.status(403).json({ error: "You may only calculate scenarios you created" });
      }
      const calculation = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${id})`);
        await buildChainwebScenario(id, tx);
        const calculated = await calculateChainwebROI(id, tx);
        await tx.update(chainwebScenarios)
          .set({ status: "calculated", updatedAt: new Date() })
          .where(eq(chainwebScenarios.id, id));
        return calculated;
      });
      res.json(calculation);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Narratives ────────────────────────────────────────────────────────────
  // Narrative generation persists rows and calls the AI provider (cost) — require
  // auth AND ownership: calculation → scenario → createdBy must match the caller,
  // so one user cannot burn AI spend against or overwrite another user's narratives.
  app.post("/api/chainweb/calculations/:id/narratives", cwRequireAuth, cwUserRateLimit, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const { audience } = req.body as {
        audience: "grant_writer" | "org_leader" | "researcher" | "council" | "funder"
      };
      const allowedAudiences = new Set(["grant_writer", "org_leader", "researcher", "council", "funder"]);
      if (!allowedAudiences.has(audience)) return res.status(400).json({ error: "A supported audience is required" });

      const [calc] = await db.select().from(chainwebCalculations).where(eq(chainwebCalculations.id, id));
      if (!calc) return res.status(404).json({ error: "Calculation not found" });
      const [scenario] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, calc.scenarioId));
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      const userId = cwGetUserId(req);
      const isAdmin = await cwIsAdmin(req);
      if (!scenario.createdBy && !isAdmin) {
        return res.status(403).json({ error: "Legacy public scenarios are read-only; an administrator must generate their narratives" });
      }
      if (scenario.createdBy && scenario.createdBy !== userId && !isAdmin) {
        return res.status(403).json({ error: "You can only generate narratives for your own scenarios" });
      }

      const [existingNarrative] = await db.select().from(chainwebNarratives)
        .where(and(eq(chainwebNarratives.calculationId, id), eq(chainwebNarratives.audienceType, audience)));
      if (existingNarrative) {
        return res.json({
          headline: existingNarrative.headline,
          narrative: existingNarrative.narrativeText,
          keyStats: existingNarrative.keyStats,
          citations: existingNarrative.dataCitations,
        });
      }

      const requestKey = `${id}:${audience}`;
      let generation = pendingNarratives.get(requestKey);
      if (!generation) {
        generation = generateChainwebNarrative(id, audience);
        pendingNarratives.set(requestKey, generation);
      }
      let result;
      try {
        result = await generation;
      } finally {
        pendingNarratives.delete(requestKey);
      }

      await db.insert(chainwebNarratives).values({
        calculationId: id,
        audienceType: audience,
        headline: result.headline,
        narrativeText: result.narrative,
        keyStats: result.keyStats,
        dataCitations: result.citations,
      }).onConflictDoUpdate({
        target: [chainwebNarratives.calculationId, chainwebNarratives.audienceType],
        set: {
          headline: result.headline,
          narrativeText: result.narrative,
          keyStats: result.keyStats,
          dataCitations: result.citations,
          generatedAt: new Date(),
        },
      });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Narratives belong to a calculation → scenario. If that scenario is owned
  // (createdBy set) the narratives are private: require auth + ownership.
  // Legacy scenarios with a null createdBy stay publicly readable.
  app.get("/api/chainweb/calculations/:id/narratives", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const [calc] = await db.select().from(chainwebCalculations).where(eq(chainwebCalculations.id, id));
      if (!calc) return res.status(404).json({ error: "Calculation not found" });
      const [scenario] = await db.select().from(chainwebScenarios).where(eq(chainwebScenarios.id, calc.scenarioId));
      if (scenario?.createdBy) {
        const userId = cwGetUserId(req);
        if (!userId) return res.status(401).json({ error: "Authentication required" });
        if (scenario.createdBy !== userId && !(await cwIsAdmin(req))) {
          return res.status(403).json({ error: "You may only view narratives for your own scenarios" });
        }
      }
      const narratives = await db.select().from(chainwebNarratives)
        .where(eq(chainwebNarratives.calculationId, id));
      res.json(narratives);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── RAG context endpoint (internal use) ───────────────────────────────────
  // Internal-only: require an authenticated first-party session.
  app.get("/api/chainweb/rag-context", cwRequireAuth, async (req: Request, res: Response) => {
    try {
      const { grantType, geography, domain } = req.query as Record<string, string>;
      const context = await getChainwebRAGContext(grantType, geography, domain);
      res.json({ context });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Quick scenario from template ──────────────────────────────────────────
  // Creates a scenario (and calculates it) — require auth and stamp ownership.
  app.post("/api/chainweb/from-template", cwRequireAuth, cwUserRateLimit, async (req: Request, res: Response) => {
    try {
      const userId = cwGetUserId(req)!;
      const parsed = templateScenarioInputSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { templateId, geographyLabel, geographyFips, populationSize, interventionCostPerPerson } = parsed.data;
      const template = CHAINWEB_TEMPLATES.find(t => t.id === templateId);
      if (!template) return res.status(404).json({ error: "Template not found" });

      const { scenario, calculation } = await db.transaction(async (tx) => {
        const [scenario] = await tx.insert(chainwebScenarios).values({
          createdBy: userId,
          name: template.name,
          description: template.description,
          geographyType: "county",
          geographyLabel,
          geographyFips,
          entryDomain: template.entryDomain,
          interventionName: template.interventionName,
          interventionDescription: template.description,
          interventionCostPerPerson: String(interventionCostPerPerson),
          populationSize,
          timeHorizonYears: 10,
          status: "draft",
        }).returning();
        await buildChainwebScenario(scenario.id, tx);
        const calculation = await calculateChainwebROI(scenario.id, tx);
        await tx.update(chainwebScenarios)
          .set({ status: "calculated", updatedAt: new Date() })
          .where(eq(chainwebScenarios.id, scenario.id));
        return { scenario, calculation };
      });

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
  app.post("/api/chainweb/webhook/civic-signal", cwExternalAuth, cwExternalRateLimit, async (req: Request, res: Response) => {
    try {
      const result = await receiveCivicSignalLesson(req.body);
      res.json({ ok: true, received: result, ...(result.corrections?.length ? { corrections: result.corrections } : {}) });
    } catch (e: any) {
      // e.corrections is populated when receiveCivicSignalLesson rejected
      // the payload for a validation reason — surface it as a 400 with the
      // structured correction so Civic Signal knows what to fix, instead of
      // an opaque 500.
      if (e.corrections) {
        return res.status(400).json({ ok: false, error: e.message, corrections: e.corrections });
      }
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
