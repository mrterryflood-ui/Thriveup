import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  chainwebScenarios, chainwebNodes, chainwebEdges,
  chainwebCalculations, chainwebNarratives,
  insertChainwebScenarioSchema,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  buildChainwebScenario, calculateChainwebROI,
  generateChainwebNarrative, getChainwebRAGContext,
} from "./chainweb-engine";
import { CHAINWEB_COEFFICIENTS, CHAINWEB_DOMAINS, CHAINWEB_TEMPLATES } from "./chainweb-coefficients";

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

      // Auto-build and calculate
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
}
