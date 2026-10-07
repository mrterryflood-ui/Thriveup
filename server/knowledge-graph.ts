/**
 * Knowledge Graph — persistent entity + relationship store
 *
 * Nodes: platforms, grant_programs, partners, service_areas, populations,
 *        outcomes, concepts, domains
 * Edges: typed directional relationships with weight (0–1 confidence)
 *
 * Wires into:
 *  - withEthicalPreamble() via AsyncLocalStorage (getCurrentGraphContext)
 *  - Startup seeder (seedKnowledgeGraph) — idempotent, pulls ECOSYSTEM_PLATFORMS
 *  - REST API (/api/knowledge-graph/*)
 *  - Ecosystem API (/api/ecosystem/knowledge-graph/*) behind x-ecosystem-key
 */

import { AsyncLocalStorage } from "async_hooks";
import { db } from "./storage";
import { kgNodes, kgEdges, ecosystemPlatforms, type KgNode, type KgEdge } from "@shared/schema";
import { eq, inArray, sql } from "drizzle-orm";

// ─── AsyncLocalStorage (graph context wire) ───────────────────────────────────
const graphStorage = new AsyncLocalStorage<string>();

export function getCurrentGraphContext(): string {
  return graphStorage.getStore() ?? "";
}

export function runWithGraphContext<T>(context: string, fn: () => T): T {
  return graphStorage.run(context, fn);
}

// ─── Core CRUD ────────────────────────────────────────────────────────────────

export async function upsertNode(node: {
  id: string; type: string; label: string; description?: string;
  url?: string; properties?: Record<string, any>; source?: string;
}): Promise<void> {
  await db.insert(kgNodes).values({
    id: node.id,
    type: node.type,
    label: node.label,
    description: node.description ?? null,
    url: node.url ?? null,
    properties: node.properties ?? {},
    source: node.source ?? "manual",
  }).onConflictDoUpdate({
    target: kgNodes.id,
    set: {
      label: node.label,
      description: node.description ?? null,
      url: node.url ?? null,
      properties: node.properties ?? {},
      source: node.source ?? "manual",
      updatedAt: new Date(),
    },
  });
}

export async function upsertEdge(edge: {
  fromNodeId: string; toNodeId: string; relationshipType: string;
  weight?: number; properties?: Record<string, any>; source?: string;
}): Promise<void> {
  // Upsert by (from, to, relationship) — prevent duplicate edges
  await db.execute(sql`
    INSERT INTO kg_edges (from_node_id, to_node_id, relationship_type, weight, properties, source)
    VALUES (${edge.fromNodeId}, ${edge.toNodeId}, ${edge.relationshipType},
            ${edge.weight ?? 1.0}, ${JSON.stringify(edge.properties ?? {})}::jsonb, ${edge.source ?? "manual"})
    ON CONFLICT DO NOTHING
  `);
}

export async function getNode(id: string): Promise<KgNode | null> {
  const rows = await db.select().from(kgNodes).where(eq(kgNodes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getNeighbors(nodeId: string, depth = 2): Promise<{
  nodes: KgNode[]; edges: KgEdge[];
}> {
  if (depth < 1) depth = 1;
  if (depth > 3) depth = 3;

  // BFS via recursive CTE — up to `depth` hops outward
  const result = await db.execute(sql`
    WITH RECURSIVE traversal AS (
      SELECT from_node_id, to_node_id, relationship_type, weight, 1 AS depth
      FROM kg_edges
      WHERE from_node_id = ${nodeId} OR to_node_id = ${nodeId}
      UNION
      SELECT e.from_node_id, e.to_node_id, e.relationship_type, e.weight, t.depth + 1
      FROM kg_edges e
      INNER JOIN traversal t
        ON (e.from_node_id = t.to_node_id OR e.from_node_id = t.from_node_id
            OR e.to_node_id = t.from_node_id OR e.to_node_id = t.to_node_id)
      WHERE t.depth < ${depth}
    )
    SELECT DISTINCT from_node_id, to_node_id, relationship_type, weight FROM traversal
  `);

  const edgeRows = (result as any).rows ?? result ?? [];
  const nodeIds = new Set<string>([nodeId]);
  for (const r of edgeRows) {
    nodeIds.add(r.from_node_id);
    nodeIds.add(r.to_node_id);
  }

  const nodes = await db.select().from(kgNodes).where(inArray(kgNodes.id, [...nodeIds]));

  return { nodes, edges: edgeRows as KgEdge[] };
}

export async function searchNodes(query: string, type?: string, limit = 20): Promise<KgNode[]> {
  const q = query.toLowerCase();
  const rows = await db.execute(sql`
    SELECT * FROM kg_nodes
    WHERE (LOWER(label) LIKE ${'%' + q + '%'} OR LOWER(description) LIKE ${'%' + q + '%'})
    ${type ? sql`AND type = ${type}` : sql``}
    ORDER BY label ASC
    LIMIT ${limit}
  `);
  return ((rows as any).rows ?? rows) as KgNode[];
}

export async function listNodes(type?: string, limit = 100): Promise<KgNode[]> {
  const rows = await db.execute(sql`
    SELECT * FROM kg_nodes
    ${type ? sql`WHERE type = ${type}` : sql``}
    ORDER BY label ASC
    LIMIT ${limit}
  `);
  return ((rows as any).rows ?? rows) as KgNode[];
}

export async function getStats(): Promise<{ nodeCount: number; edgeCount: number; byType: Record<string, number> }> {
  const [nc, ec, byType] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as c FROM kg_nodes`),
    db.execute(sql`SELECT COUNT(*) as c FROM kg_edges`),
    db.execute(sql`SELECT type, COUNT(*) as c FROM kg_nodes GROUP BY type`),
  ]);
  const nodeCount = parseInt(((nc as any).rows ?? nc)[0]?.c ?? "0");
  const edgeCount = parseInt(((ec as any).rows ?? ec)[0]?.c ?? "0");
  const typeCounts: Record<string, number> = {};
  for (const r of ((byType as any).rows ?? byType)) typeCounts[r.type] = parseInt(r.c);
  return { nodeCount, edgeCount, byType: typeCounts };
}

// ─── Graph context builder ─────────────────────────────────────────────────────
/** Build a compact text block (injected into AI prompts) describing a node's
 *  neighborhood — what it connects to, what serves it, what it produces. */
export async function buildGraphContext(nodeId: string): Promise<string> {
  const [node, { nodes, edges }] = await Promise.all([
    getNode(nodeId),
    getNeighbors(nodeId, 1),
  ]);
  if (!node) return "";

  const others = nodes.filter(n => n.id !== nodeId);
  if (edges.length === 0 && others.length === 0) return "";

  const edgeSummary = edges.slice(0, 12).map((e: any) => {
    const fromLabel = others.find(n => n.id === e.from_node_id)?.label ?? e.from_node_id;
    const toLabel = others.find(n => n.id === e.to_node_id)?.label ?? e.to_node_id;
    return `${fromLabel} —[${e.relationship_type}]→ ${toLabel}`;
  }).join("\n  ");

  return [
    `══ KNOWLEDGE GRAPH: ${node.label} ══`,
    `Type: ${node.type}`,
    node.description ? `Summary: ${node.description.slice(0, 180)}` : "",
    others.length > 0 ? `Connected entities (${others.length}): ${others.slice(0, 8).map(n => n.label).join(", ")}` : "",
    edges.length > 0 ? `Relationships:\n  ${edgeSummary}` : "",
    "══ END KNOWLEDGE GRAPH ══",
  ].filter(Boolean).join("\n");
}

// ─── Ecosystem-wide context summary ───────────────────────────────────────────
/** Light summary of the graph topology — injected into ecosystem-level AI calls. */
export async function buildEcosystemGraphSummary(): Promise<string> {
  const stats = await getStats();
  if (stats.nodeCount === 0) return "";
  const byTypeStr = Object.entries(stats.byType)
    .map(([t, c]) => `${c} ${t}`)
    .join(", ");
  return [
    "══ ECOSYSTEM KNOWLEDGE GRAPH ══",
    `${stats.nodeCount} nodes (${byTypeStr}) · ${stats.edgeCount} relationships`,
    "Graph is queryable via GET /api/knowledge-graph/nodes and /api/knowledge-graph/neighbors/:nodeId",
    "══ END ECOSYSTEM KNOWLEDGE GRAPH ══",
  ].join("\n");
}

// ─── Startup seeder ───────────────────────────────────────────────────────────
/** Idempotent — upserts nodes + edges from the ECOSYSTEM_PLATFORMS constant.
 *  Safe to call on every server start; existing nodes are updated, not duplicated. */
export async function seedKnowledgeGraph(): Promise<void> {
  // Pull platforms from DB (avoids importing the non-exported ECOSYSTEM_PLATFORMS constant)
  const platforms = await db.select().from(ecosystemPlatforms);

  const GRANT_PROGRAM_LABELS: Record<string, string> = {
    "federal": "Federal Grant Programs",
    "foundation": "Foundation Grants",
    "wioa": "WIOA Title I Workforce",
    "nsf": "NSF Research Grants",
    "hrsa": "HRSA Health Workforce",
    "ssg-fox": "SSG Fox VA Suicide Prevention",
    "st-davids": "St. David's Foundation",
    "workforce": "Workforce Development Grants",
    "ntia": "NTIA Digital Equity",
    "usda": "USDA Rural Development",
    "dot": "DOT Transportation",
    "hud": "HUD Community Development",
    "epa": "EPA Environmental Justice",
    "arpa-h": "ARPA-H Health Innovation",
    "nih": "NIH Health Research",
    "dol": "DOL Employment & Training",
  };

  const DOMAIN_LABELS: Record<string, string> = {
    "ecosystem-orchestration": "Ecosystem Orchestration",
    "civic-intelligence": "Civic Intelligence",
    "workforce-development": "Workforce Development",
    "health-equity": "Health Equity",
    "housing-stability": "Housing Stability",
    "education": "Education & Learning",
    "business-operations": "Business Operations",
    "legal-aid": "Legal Aid",
    "rural-development": "Rural Development",
    "marketing-content": "Marketing & Content",
    "chronic-disease-management": "Chronic Disease Management",
    "system-optimization": "System Optimization",
    "worker-safety": "Worker Safety",
    "contractor-enablement": "Contractor Enablement",
    "ad-intelligence": "Advertising Intelligence",
    "language-access": "Language Access",
    "substance-use-recovery": "Substance Use & Recovery",
    "veteran-services": "Veteran Services",
    "foster-youth": "Foster Youth Services",
    "justice-reentry": "Justice & Reentry",
  };

  // ── Phase 1: collect and upsert ALL nodes first (FK constraint requires nodes before edges) ──
  const nodeOps: Promise<void>[] = [];
  const edgeOps: Array<{ fromNodeId: string; toNodeId: string; relationshipType: string; weight: number; source: string }> = [];

  // Hub node
  nodeOps.push(upsertNode({
    id: "concept:tcaf-hub",
    type: "concept",
    label: "TCAF / ThriveUp (Hub)",
    description: "National community-infrastructure platform. Orchestrating hub for 25+ ecosystem platforms.",
    url: "https://thrivingcommunitiesforall.com",
    source: "ecosystem_seeder",
  }));

  for (const p of platforms) {
    const nodeId = `platform:${p.id}`;

    // Platform node
    nodeOps.push(upsertNode({
      id: nodeId,
      type: "platform",
      label: p.name,
      description: (p.description || "").slice(0, 300),
      url: p.url ?? null,
      properties: {
        role: p.role,
        domain: p.domain,
        features: (p.capabilities as any)?.features ?? [],
      },
      source: "ecosystem_seeder",
    }));

    // Domain node
    const domain = p.domain as string;
    if (domain) {
      nodeOps.push(upsertNode({
        id: `domain:${domain}`,
        type: "domain",
        label: DOMAIN_LABELS[domain] ?? domain,
        source: "ecosystem_seeder",
      }));
      edgeOps.push({ fromNodeId: nodeId, toNodeId: `domain:${domain}`, relationshipType: "operates_in", weight: 1.0, source: "ecosystem_seeder" });
    }

    // Grant alignment nodes
    const grantAlignment: string[] = Array.isArray(p.grantAlignment) ? p.grantAlignment as string[] : [];
    for (const ga of grantAlignment) {
      nodeOps.push(upsertNode({
        id: `grant_program:${ga}`,
        type: "grant_program",
        label: GRANT_PROGRAM_LABELS[ga] ?? ga,
        source: "ecosystem_seeder",
      }));
      edgeOps.push({ fromNodeId: nodeId, toNodeId: `grant_program:${ga}`, relationshipType: "is_aligned_with", weight: 0.9, source: "ecosystem_seeder" });
    }

    // Hub → platform edge (queued for phase 2)
    if (p.id !== "thriveup-hub") {
      edgeOps.push({ fromNodeId: "concept:tcaf-hub", toNodeId: nodeId, relationshipType: "connects_to", weight: 1.0, source: "ecosystem_seeder" });
    }
  }

  // Flush nodes in batches
  const BATCH = 20;
  for (let i = 0; i < nodeOps.length; i += BATCH) {
    await Promise.all(nodeOps.slice(i, i + BATCH));
  }

  // ── Phase 2: upsert edges after all nodes are guaranteed to exist ──
  for (let i = 0; i < edgeOps.length; i += BATCH) {
    await Promise.all(edgeOps.slice(i, i + BATCH).map(e => upsertEdge(e)));
  }

  const stats = await getStats();
  console.log(`[knowledge-graph] Seeded: ${stats.nodeCount} nodes, ${stats.edgeCount} edges`);
}
