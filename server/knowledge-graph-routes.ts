/**
 * Knowledge Graph API Routes
 *
 * Public + auth endpoints:
 *   GET  /api/knowledge-graph/stats                  — node/edge counts by type
 *   GET  /api/knowledge-graph/nodes                  — list nodes (optional ?type=&q=)
 *   GET  /api/knowledge-graph/nodes/:id              — single node
 *   GET  /api/knowledge-graph/neighbors/:id          — BFS neighborhood (?depth=1|2|3)
 *   POST /api/knowledge-graph/nodes                  — add/update node [auth]
 *   POST /api/knowledge-graph/edges                  — add edge [auth]
 *   DELETE /api/knowledge-graph/nodes/:id            — remove node + cascade edges [auth]
 *
 * Ecosystem endpoints (x-ecosystem-key):
 *   GET  /api/ecosystem/knowledge-graph/nodes        — list nodes (scoped view)
 *   GET  /api/ecosystem/knowledge-graph/neighbors/:id
 *   POST /api/ecosystem/knowledge-graph/nodes        — contribute node
 *   POST /api/ecosystem/knowledge-graph/edges        — contribute edge
 */

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "./storage";
import { kgNodes, kgEdges, ecosystemPlatforms } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  upsertNode, upsertEdge, getNode, getNeighbors,
  searchNodes, listNodes, getStats, buildGraphContext,
} from "./knowledge-graph";

function requireEcosystemAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-ecosystem-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-ecosystem-key header" });
  }
  // Resolve platform from DB key (async — attach to req for downstream use)
  db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey)).then(([platform]) => {
    if (!platform) return res.status(401).json({ error: "Invalid x-ecosystem-key" });
    (req as any).ecosystemPlatform = platform;
    next();
  }).catch(() => res.status(500).json({ error: "Auth check failed" }));
}

function getUserId(req: Request): string | null {
  const u = (req as any).user;
  return u?.claims?.sub || u?.id || null;
}

async function requireAuth(req: Request, res: Response): Promise<boolean> {
  if (!getUserId(req)) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

const nodeBodySchema = z.object({
  id: z.string().min(3).max(200),
  type: z.enum(["platform", "grant_program", "partner", "service_area", "population", "outcome", "concept", "domain"]),
  label: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  url: z.string().url().optional().or(z.literal("")),
  properties: z.record(z.unknown()).optional(),
  source: z.string().optional(),
});

const edgeBodySchema = z.object({
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  relationshipType: z.string().min(1).max(80),
  weight: z.number().min(0).max(1).optional(),
  properties: z.record(z.unknown()).optional(),
  source: z.string().optional(),
});

export function registerKnowledgeGraphRoutes(app: Express) {

  // ── Stats ──────────────────────────────────────────────────────────────────
  app.get("/api/knowledge-graph/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await getStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── List / search nodes ────────────────────────────────────────────────────
  app.get("/api/knowledge-graph/nodes", async (req: Request, res: Response) => {
    try {
      const { type, q, limit } = req.query as Record<string, string>;
      const lim = Math.min(parseInt(limit || "100"), 500);
      const nodes = q
        ? await searchNodes(q, type, lim)
        : await listNodes(type, lim);
      res.json({ nodes, count: nodes.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Single node ────────────────────────────────────────────────────────────
  app.get("/api/knowledge-graph/nodes/:id", async (req: Request, res: Response) => {
    try {
      const node = await getNode(decodeURIComponent(req.params.id));
      if (!node) return res.status(404).json({ error: "Node not found" });
      res.json(node);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Neighborhood (BFS) ────────────────────────────────────────────────────
  app.get("/api/knowledge-graph/neighbors/:id", async (req: Request, res: Response) => {
    try {
      const depth = Math.min(parseInt((req.query.depth as string) || "1"), 3);
      const result = await getNeighbors(decodeURIComponent(req.params.id), depth);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Graph context text for an entity (AI prompt injection) ─────────────────
  app.get("/api/knowledge-graph/context/:id", async (req: Request, res: Response) => {
    try {
      const ctx = await buildGraphContext(decodeURIComponent(req.params.id));
      res.json({ context: ctx });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Add/update node [auth] ─────────────────────────────────────────────────
  app.post("/api/knowledge-graph/nodes", async (req: Request, res: Response) => {
    if (!(await requireAuth(req, res))) return;
    const parsed = nodeBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      await upsertNode({ ...parsed.data, source: parsed.data.source ?? "api" });
      const node = await getNode(parsed.data.id);
      res.json({ ok: true, node });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Add edge [auth] ────────────────────────────────────────────────────────
  app.post("/api/knowledge-graph/edges", async (req: Request, res: Response) => {
    if (!(await requireAuth(req, res))) return;
    const parsed = edgeBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      // Ensure both nodes exist
      const [from, to] = await Promise.all([
        getNode(parsed.data.fromNodeId),
        getNode(parsed.data.toNodeId),
      ]);
      if (!from) return res.status(404).json({ error: `from_node_id not found: ${parsed.data.fromNodeId}` });
      if (!to) return res.status(404).json({ error: `to_node_id not found: ${parsed.data.toNodeId}` });
      await upsertEdge({ ...parsed.data, source: parsed.data.source ?? "api" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Delete node + cascade [auth] ───────────────────────────────────────────
  app.delete("/api/knowledge-graph/nodes/:id", async (req: Request, res: Response) => {
    if (!(await requireAuth(req, res))) return;
    try {
      const id = decodeURIComponent(req.params.id);
      // Edges cascade via FK
      await db.delete(kgNodes).where(eq(kgNodes.id, id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ══ Ecosystem endpoints (x-ecosystem-key) ══════════════════════════════════

  // GET nodes (scoped — excludes internal-only properties)
  app.get("/api/ecosystem/knowledge-graph/nodes", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const { type, q, limit } = req.query as Record<string, string>;
      const lim = Math.min(parseInt(limit || "50"), 100);
      const nodes = q
        ? await searchNodes(q, type, lim)
        : await listNodes(type, lim);
      const scoped = nodes.map(n => ({
        id: n.id, type: n.type, label: n.label,
        description: n.description, url: n.url,
      }));
      res.json({ nodes: scoped, count: scoped.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET neighborhood
  app.get("/api/ecosystem/knowledge-graph/neighbors/:id", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const depth = Math.min(parseInt((req.query.depth as string) || "1"), 2);
      const result = await getNeighbors(decodeURIComponent(req.params.id), depth);
      const scoped = {
        nodes: result.nodes.map(n => ({ id: n.id, type: n.type, label: n.label, description: n.description })),
        edges: result.edges,
      };
      res.json(scoped);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET graph context text block
  app.get("/api/ecosystem/knowledge-graph/context/:id", requireEcosystemAuth, async (req: Request, res: Response) => {
    try {
      const ctx = await buildGraphContext(decodeURIComponent(req.params.id));
      res.json({ context: ctx });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST — ecosystem platform contributes a node
  app.post("/api/ecosystem/knowledge-graph/nodes", requireEcosystemAuth, async (req: Request, res: Response) => {
    const parsed = nodeBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const platform = (req as any).ecosystemPlatform;
      await upsertNode({
        ...parsed.data,
        source: `api:${platform?.id ?? "ecosystem"}`,
      });
      const node = await getNode(parsed.data.id);
      res.json({ ok: true, node });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST — ecosystem platform contributes an edge
  app.post("/api/ecosystem/knowledge-graph/edges", requireEcosystemAuth, async (req: Request, res: Response) => {
    const parsed = edgeBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const [from, to] = await Promise.all([
        getNode(parsed.data.fromNodeId),
        getNode(parsed.data.toNodeId),
      ]);
      if (!from) return res.status(404).json({ error: `from_node_id not found: ${parsed.data.fromNodeId}` });
      if (!to) return res.status(404).json({ error: `to_node_id not found: ${parsed.data.toNodeId}` });
      const platform = (req as any).ecosystemPlatform;
      await upsertEdge({ ...parsed.data, source: `api:${platform?.id ?? "ecosystem"}` });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
