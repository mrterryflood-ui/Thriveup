// ── Full Interconnected Orchestra ────────────────────────────────────────────
// Live demonstration endpoint: runs every layer of the platform brain against
// any community nationwide (ZIP-driven) and streams each phase over SSE so the
// operator can watch the engines hand data to each other in real time.
//
// Phases:
//   1. providers   — AI provider health (Claude chain, Gemini, OpenRouter, Perplexity)
//   2. community   — Census ACS + RPLICE community intelligence (live, cached 30 min)
//   3. research    — Perplexity live web research with citations
//   4. synthesis   — Collaborative multi-engine synthesis (RAG + RPLICE + MAP-GAP)
//                    running INSIDE the community context, proving that
//                    withEthicalPreamble() auto-injects live local data into
//                    every engine downstream.
//
// Auth: real paid AI calls — admin/authenticated only (threat model: public
// endpoints must not trigger paid model calls).

import type { Express, NextFunction, Request, Response } from "express";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { storage } from "./storage";
import {
  getProviderInfo,
  isPerplexityAvailable,
  perplexityResearch,
} from "./ai-provider";
import { buildCommunityAIContext } from "./rplice-intelligence";
import { runWithCommunityContext, warmCommunityContext } from "./community-context";
import { collaborativeResponse, getCollaborativeStatus } from "./collaborative-ai";

function sse(res: Response, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// Server-side admin enforcement — mirrors the requireAdmin gate in routes.ts.
// The frontend RequireAuth adminOnly wrapper is UX only; this is the boundary.
async function requireOrchestraAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.claims?.sub as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher") {
      next();
      return;
    }
  } catch (e) {
    console.error("[Orchestra] Admin check error:", e);
  }
  res.status(403).json({ error: "Admin access required" });
}

export function registerOrchestraRoutes(app: Express) {
  // Engine inventory — no AI calls, cheap status snapshot.
  app.get("/api/orchestra/status", isAuthenticated, requireOrchestraAdmin, (_req: Request, res: Response) => {
    const providers = getProviderInfo();
    const collab = getCollaborativeStatus();
    res.json({
      providers: providers.allProviders,
      activeProvider: { name: providers.name, model: providers.model },
      perplexity: isPerplexityAvailable(),
      collaborative: collab,
      orchestration: {
        communityContext: true,
        censusLive: Boolean(process.env.CENSUS_API_KEY),
        rplice: collab.rpliceEnabled,
        mapGap: collab.mapGapEnabled,
        rag: collab.ragEnabled,
      },
    });
  });

  // Live orchestra run — SSE stream of every phase.
  app.get("/api/orchestra/run", isAuthenticated, requireOrchestraAdmin, async (req: Request, res: Response) => {
    const zip = String(req.query.zip || "78653").replace(/\D/g, "").slice(0, 5);
    const question = String(
      req.query.question ||
      "What are the three highest-leverage community-infrastructure investments for this area right now, and which funding streams should we pursue for each?"
    ).slice(0, 600);

    if (zip.length !== 5) {
      res.status(400).json({ error: "zip must be a 5-digit ZIP code" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const runStart = Date.now();
    let clientGone = false;
    req.on("close", () => { clientGone = true; });

    const phase = (name: string, status: "start" | "done" | "error", extra: Record<string, unknown> = {}) => {
      if (!clientGone) sse(res, { type: "phase", phase: name, status, elapsedMs: Date.now() - runStart, ...extra });
    };

    try {
      // ── Phase 1: provider health ─────────────────────────────────────────
      phase("providers", "start", { label: "AI Provider Health" });
      const providers = getProviderInfo();
      const collab = getCollaborativeStatus();
      phase("providers", "done", {
        providers: providers.allProviders.map(p => `${p.name} (${p.model})`),
        perplexity: isPerplexityAvailable(),
        collaborativeEngines: collab.enginesAvailable.map(e => e.id),
      });

      // ── Phase 2: community intelligence (Census + RPLICE) ────────────────
      if (clientGone) { res.end(); return; }
      phase("community", "start", { label: `Community Intelligence — ZIP ${zip}`, zip });
      let communityContext = "";
      let communityMs = 0;
      try {
        const t = Date.now();
        communityContext = await buildCommunityAIContext({ zip });
        communityMs = Date.now() - t;
        // Warm the shared cache so every downstream engine (Navigator, Voice,
        // benefits, justice) gets this same context for free for 30 minutes.
        warmCommunityContext(zip).catch(() => {});
        phase("community", "done", {
          ms: communityMs,
          contextChars: communityContext.length,
          preview: communityContext.slice(0, 900),
        });
      } catch (err) {
        phase("community", "error", { message: err instanceof Error ? err.message : String(err) });
      }

      // ── Phase 3: Perplexity live web research ────────────────────────────
      // Client left — stop before spending on paid research/synthesis.
      if (clientGone) { res.end(); return; }
      phase("research", "start", { label: "Perplexity Live Research" });
      let researchText = "";
      let researchCitations: string[] = [];
      if (isPerplexityAvailable()) {
        try {
          const t = Date.now();
          const research = await perplexityResearch(
            `For ZIP code ${zip} (identify the city/county/state), what are the most significant CURRENT community needs, active local initiatives, and open or upcoming public funding opportunities (federal, state, local, philanthropic)? Be specific: name programs, agencies, and dollar amounts where verifiable. Today is ${new Date().toISOString().slice(0, 10)}.`,
            "You are a community-infrastructure research analyst. Only state facts you can cite. If something cannot be verified, say so.",
            1200,
          );
          researchText = research.text;
          researchCitations = research.citations;
          phase("research", "done", {
            ms: Date.now() - t,
            citations: researchCitations,
            preview: researchText.slice(0, 900),
          });
        } catch (err) {
          phase("research", "error", { message: err instanceof Error ? err.message : String(err) });
        }
      } else {
        phase("research", "error", { message: "Perplexity unavailable (OpenRouter credentials not configured)" });
      }

      // ── Phase 4: collaborative multi-engine synthesis ────────────────────
      // Runs inside runWithCommunityContext so withEthicalPreamble() injects
      // the live Census+RPLICE block into EVERY engine's system prompt —
      // the same mechanism now active platform-wide.
      if (clientGone) { res.end(); return; }
      phase("synthesis", "start", { label: "Collaborative Synthesis (all engines)" });
      try {
        const t = Date.now();
        const researchBlock = researchText
          ? `\n\n=== LIVE WEB RESEARCH (Perplexity, cited) ===\n${researchText}\nCitations: ${researchCitations.join(" | ")}`
          : "";
        const result = await runWithCommunityContext(communityContext, () =>
          collaborativeResponse(
            `${question}${researchBlock}`,
            {
              systemPrompt:
                "You are the ThriveUp orchestration conductor. Synthesize the live community data, web research, RAG knowledge base, and RPLICE framework into a concrete, prioritized answer. Cite which data source supports each claim. Plain language.",
              maxTokens: 1600,
              topic: `community infrastructure priorities ZIP ${zip}`,
            },
          ),
        );
        phase("synthesis", "done", {
          ms: Date.now() - t,
          engines: result.engines.map(e => ({ id: e.engine, model: e.model, ok: !e.error, ms: e.responseTimeMs })),
          consensusMethod: result.consensusMethod,
          ragChunks: result.ragContext.chunkCount,
          ragSources: result.ragContext.sources.slice(0, 8),
          frameworks: result.frameworks,
          synthesis: result.synthesis,
        });
      } catch (err) {
        phase("synthesis", "error", { message: err instanceof Error ? err.message : String(err) });
      }

      sse(res, { type: "done", totalMs: Date.now() - runStart, zip });
    } catch (err) {
      sse(res, { type: "fatal", message: err instanceof Error ? err.message : String(err) });
    } finally {
      res.end();
    }
  });
}
