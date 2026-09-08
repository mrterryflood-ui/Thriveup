/**
 * Live Data Search — Perplexity-powered fallback for missing data
 *
 * Called by client/src/components/uncertainty-display.tsx when a data source
 * is unavailable. The platform never has a true data dead-end — Perplexity
 * Sonar Pro provides live, cited information as a fallback.
 *
 * POST /api/live-data-search
 * Body: { query: string, context?: string }
 * Response: { text: string, citations: string[], query: string }
 *
 * Rate limited: 10 requests / 60 seconds per IP.
 */
import type { Express, Request, Response } from "express";
import { perplexityResearch, withEthicalPreamble } from "./ai-provider";
import { z } from "zod";

const LiveSearchSchema = z.object({
  query: z.string().min(3).max(500).trim(),
  context: z.string().max(500).trim().optional(),
});

// ── Simple in-process rate limiter ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export function setupLiveDataSearchRoutes(app: Express): void {
  app.post("/api/live-data-search", async (req: Request, res: Response) => {
    // Rate limit by IP
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: "Too many live search requests. Please wait a minute and try again.",
      });
    }

    const parsed = LiveSearchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid search request",
        details: parsed.error.issues,
      });
    }

    const { query, context } = parsed.data;

    const systemPrompt = withEthicalPreamble(
      `You are a community data research assistant for TCAF (Texas Center for the Advancement of Families), a 501(c)(3) in Austin, Texas, serving communities across Texas and nationally.

You help community health workers, program staff, and community members find accurate, current information about community conditions, programs, and resources when local administrative data is unavailable.

RESPONSE RULES — follow these exactly:
1. Provide specific, sourced statistics when available. Cite each source explicitly.
2. State the year or date range for every statistic you provide.
3. Distinguish between official government sources (Census, BLS, HUD, USDA, HRSA, state agencies) and secondary sources. Prefer official.
4. If you cannot find reliable data for the specific geography or population asked about, say so clearly. NEVER fabricate statistics.
5. If data exists only at a broader geography level than asked (e.g., MSA instead of county), say so explicitly.
6. Format response as 2-4 short paragraphs maximum. Be direct and specific.
7. After your response, list your citations as bare URLs, one per line, prefixed with "CITATIONS:".

Context about why this search was triggered: ${context ?? "A data source was unavailable for this geography."}`,
    );

    try {
      const result = await perplexityResearch(
        `Research question: ${query}\n\nProvide specific, sourced statistics. State the year for each figure. Cite every source.`,
        systemPrompt,
        900,
      );

      return res.json({
        text: result.text,
        citations: result.citations,
        query,
      });
    } catch (err) {
      console.error("[live-data-search] Perplexity error:", err);
      return res.status(503).json({
        error:
          "Live search temporarily unavailable. Try again in a moment, or contact your CHW for assistance.",
      });
    }
  });
}
