/**
 * Agent Knowledge Layer — internal endpoint
 *
 * Serves the compiled knowledge index built by scripts/compile-agent-knowledge.ts.
 * This is the "compilation-stage knowledge layer" for the Replit Agent: deterministic,
 * structured, fast — replaces fuzzy RAG for agent self-orientation.
 *
 * End-user RAG (server/rag-engine.ts) is untouched and continues to serve the
 * public AI assistant.
 *
 * Endpoints:
 *   GET  /api/agent/knowledge                     — full compiled index
 *   GET  /api/agent/knowledge/topic/:k            — narrowed slice by top-level key
 *   GET  /api/agent/knowledge/session-bootstrap   — compact briefing for session start (the "hook")
 *   POST /api/agent/knowledge/recompile           — re-run the compiler (admin-only)
 *
 * The session-bootstrap endpoint follows the "unified agentic memory across harnesses
 * via hooks" pattern: a single deterministic injection point the agent calls at fixed
 * lifecycle moments instead of fuzzy-loading prose at random.
 */

import type { Express, Request, Response } from "express";
import { readFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";
import { spawn } from "child_process";
import { storage } from "./storage";

const COMPILED_PATH = resolve(process.cwd(), ".agents/knowledge/compiled.json");

// Prevent concurrent recompiles from spawning multiple tsx processes
let recompileInFlight = false;

function getUserId(req: Request): string | null {
  const u = (req as any).user;
  return u?.claims?.sub || u?.id || null;
}

// All knowledge endpoints expose internal evaluation data (no-go funder reasoning,
// gotchas with personnel firewall warnings, internal platform metadata). Require auth.
async function requireAuthedAgent(req: Request, res: Response): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required for agent knowledge endpoints" });
    return false;
  }
  return true;
}

function loadCompiled(): { ok: true; data: any; mtime: string } | { ok: false; error: string } {
  try {
    if (!existsSync(COMPILED_PATH)) {
      return { ok: false, error: "Compiled knowledge file not found. Run: tsx scripts/compile-agent-knowledge.ts" };
    }
    const raw = readFileSync(COMPILED_PATH, "utf-8");
    const data = JSON.parse(raw);
    const mtime = statSync(COMPILED_PATH).mtime.toISOString();
    return { ok: true, data, mtime };
  } catch (e: any) {
    return { ok: false, error: `Failed to read compiled knowledge: ${e.message || e}` };
  }
}

export function registerAgentKnowledgeRoutes(app: Express) {
  // GET full compiled index (auth required — exposes internal data)
  app.get("/api/agent/knowledge", async (req: Request, res: Response) => {
    if (!(await requireAuthedAgent(req, res))) return;
    const result = loadCompiled();
    if (!result.ok) return res.status(503).json({ error: result.error });
    res.json({ ...result.data, fileLastModified: result.mtime });
  });

  // GET single top-level slice (e.g. /api/agent/knowledge/topic/gotchas)
  app.get("/api/agent/knowledge/topic/:key", async (req: Request, res: Response) => {
    if (!(await requireAuthedAgent(req, res))) return;
    const result = loadCompiled();
    if (!result.ok) return res.status(503).json({ error: result.error });
    const key = req.params.key;
    if (!(key in result.data)) {
      return res.status(404).json({
        error: `Unknown topic: ${key}`,
        availableTopics: Object.keys(result.data),
      });
    }
    res.json({ topic: key, value: result.data[key], compiledAt: result.data.compiledAt });
  });

  // GET session-bootstrap — compact briefing for agent session start.
  // Returns only the minimum the agent needs to orient deterministically:
  // project header, gotchas (critical), user preferences, vocab, no-go list,
  // ecosystem caveats, quintet, session protocol, file pointers. Skips the
  // verbose platform table and full lessons (those are available via /topic/:k).
  app.get("/api/agent/knowledge/session-bootstrap", async (req: Request, res: Response) => {
    if (!(await requireAuthedAgent(req, res))) return;
    const result = loadCompiled();
    if (!result.ok) return res.status(503).json({ error: result.error });
    const d = result.data;
    res.json({
      version: d.version,
      compiledAt: d.compiledAt,
      project: d.project,
      session_protocol: d.session_protocol,
      user_preferences: d.user_preferences,
      vocab: d.vocab,
      critical_gotchas: (d.gotchas || []).filter((g: any) => g.severity === "critical"),
      all_gotchas_count: (d.gotchas || []).length,
      quintet: d.quintet,
      ecosystem_caveats: d.ecosystem_caveats,
      active_commitments_no_go_list: d.active_commitments?.no_go_list || [],
      active_commitments_section_titles: (d.active_commitments?.sections || []).map((s: any) => s.heading),
      file_pointers: d.file_pointers,
      platform_count: (d.platforms || []).length,
      drill_down_topics: Object.keys(d).filter(k => !["version", "compiledAt", "sources", "counts", "fileLastModified"].includes(k)),
      hint: "GET /api/agent/knowledge/topic/:key for full slice (e.g. platforms, lessons_learned, gotchas).",
    });
  });

  // POST recompile (admin-only) — runs the compile script in a child process
  app.post("/api/agent/knowledge/recompile", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") return res.status(403).json({ error: "Admin access required" });

      if (recompileInFlight) {
        return res.status(429).json({ error: "Recompile already in progress. Try again in a few seconds." });
      }
      recompileInFlight = true;

      const child = spawn("tsx", ["scripts/compile-agent-knowledge.ts"], {
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", d => { stdout += d.toString(); });
      child.stderr.on("data", d => { stderr += d.toString(); });

      child.on("close", code => {
        recompileInFlight = false;
        if (code !== 0) {
          console.error("[agent-knowledge] Recompile FAILED code=" + code, stderr);
          return res.status(500).json({ ok: false, exitCode: code, stdout, stderr });
        }
        const result = loadCompiled();
        if (!result.ok) return res.status(500).json({ ok: false, error: result.error, stdout });
        res.json({
          ok: true,
          stdout: stdout.trim().split("\n").slice(-10).join("\n"),
          counts: result.data.counts,
          compiledAt: result.data.compiledAt,
        });
      });
      child.on("error", err => {
        recompileInFlight = false;
        console.error("[agent-knowledge] Recompile spawn ERROR:", err);
        res.status(500).json({ ok: false, error: err.message });
      });
    } catch (e: any) {
      console.error("[agent-knowledge] Recompile route error:", e);
      res.status(500).json({ error: e.message || String(e) });
    }
  });
}
