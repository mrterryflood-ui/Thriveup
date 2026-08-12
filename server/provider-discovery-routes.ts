/**
 * Dynamic Provider Discovery
 *
 * When the platform has no seeded partner records for a given geography, this
 * endpoint calls Perplexity Sonar Pro to surface real local non-profits and
 * service providers. Results are clearly labeled as AI-discovered (not vetted)
 * so CHWs know to verify before referring.
 *
 * GET /api/providers/discover?location=&category=
 *
 * - Requires auth (no anonymous Perplexity spend)
 * - 60 requests/hour per user ID
 * - Responses cached 24h per location+category
 */
import type { Express, Request, Response } from "express";
import { requireAuth } from "./tenant-middleware";
import { perplexityResearch } from "./ai-provider";

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
const rateLimitWindows = new Map<string, { count: number; resetAt: number }>();
function checkRate(key: string, limit = 60): boolean {
  const now = Date.now();
  const entry = rateLimitWindows.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitWindows.set(key, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// ── 24-hour response cache ─────────────────────────────────────────────────────
const discoveryCache = new Map<string, { result: any; expiresAt: number }>();

export function registerProviderDiscoveryRoutes(app: Express) {
  /**
   * GET /api/providers/discover?location=Memphis%2C+TN&category=food+housing
   *
   * Uses Perplexity Sonar Pro to find real local orgs when the DB has none.
   * Returns a structured list — name, address, phone, services, source citation.
   */
  app.get("/api/providers/discover", requireAuth, async (req: Request, res: Response) => {
    const userId = String((req as any).user?.id || req.ip || "anon");
    if (!checkRate(userId)) {
      return res.status(429).json({ error: "Too many discovery requests. Limit: 60/hr." });
    }

    const location = ((req.query.location as string) || "").trim();
    const category = ((req.query.category as string) || "social services").trim();

    if (!location) {
      return res.status(400).json({ error: "location query parameter is required." });
    }

    const cacheKey = `${location.toLowerCase()}::${category.toLowerCase()}`;
    const cached = discoveryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return res.json({ ...cached.result, cached: true });
    }

    try {
      const prompt = `Find real, currently-operating non-profit organizations and government social service providers in ${location} that offer ${category} services. 

For each organization include:
- Name (official)
- Full street address
- Phone number
- Website URL
- Services offered (specific programs, not vague categories)
- Whether walk-ins are accepted or appointment required
- Languages served if known

Focus on organizations that serve people with low income, unhoused individuals, or families in crisis. Prioritize faith-based community organizations, community action agencies, and FQHC clinics alongside government offices.

Return at least 5 and up to 10 organizations. Do not include organizations that have closed. Include at least one government office (e.g. SNAP/Medicaid enrollment office) if one exists in this area.`;

      const systemPrompt = `You are a community resource specialist with deep knowledge of social service infrastructure in U.S. cities. Return factual, verifiable information only. If you are uncertain whether an organization is currently operating, omit it rather than guess.`;

      const { text, citations } = await perplexityResearch(prompt, systemPrompt, 2000);

      // Parse the Perplexity response into structured entries
      const entries = parseProviderText(text, location, category);

      const result = {
        location,
        category,
        providers: entries,
        rawText: text,
        citations,
        source: "Perplexity Sonar Pro — AI-discovered, not vetted by TCAF",
        disclaimer: "These organizations were identified by AI search. Verify hours, eligibility, and contact info before referring a client. TCAF does not endorse or validate AI-discovered providers.",
        discoveredAt: new Date().toISOString(),
        cached: false,
      };

      // Cache for 24 hours
      discoveryCache.set(cacheKey, { result, expiresAt: Date.now() + 86_400_000 });

      console.info(`[provider-discovery] ${location} / ${category}: ${entries.length} orgs found (${citations.length} citations)`);
      res.json(result);
    } catch (err: any) {
      console.error("[provider-discovery] error:", err);
      res.status(500).json({ error: "Provider discovery failed.", detail: err.message });
    }
  });
}

/**
 * Best-effort parse of Perplexity's free-text response into structured entries.
 * The AI often returns numbered lists or markdown headers — this extracts what
 * it can and passes the rest through as-is so the client can still display it.
 */
function parseProviderText(
  text: string,
  location: string,
  category: string,
): Array<{
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  services?: string;
  notes?: string;
}> {
  // Split on numbered list items (1. Name, 2. Name, etc.) or markdown headers (## Name, ### Name)
  const chunks = text
    .split(/(?:^|\n)(?:\d+\.\s+|#{1,3}\s+)/m)
    .map((c) => c.trim())
    .filter((c) => c.length > 20);

  if (chunks.length < 2) {
    // Couldn't parse into chunks — return the whole thing as a single entry note
    return [{ notes: text, name: `Community Resources in ${location}`, services: category }];
  }

  return chunks.map((chunk) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const name = lines[0]?.replace(/^[*_]+|[*_]+$/g, "").trim();

    const phoneMatch = chunk.match(/(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);
    const websiteMatch = chunk.match(/https?:\/\/[^\s\)]+/);
    const addressMatch = chunk.match(/\d+\s+[A-Z][a-zA-Z\s]+(?:St|Ave|Blvd|Dr|Rd|Way|Pkwy|Ln|Ct|Pl|Suite|Ste)[.,\s]+[A-Z][a-zA-Z\s]+,\s+[A-Z]{2}\s+\d{5}/i);

    return {
      name,
      phone: phoneMatch?.[0],
      website: websiteMatch?.[0],
      address: addressMatch?.[0],
      services: category,
      notes: lines.slice(1).join(" ").replace(/\*+/g, "").trim().slice(0, 400),
    };
  }).filter((e) => e.name && e.name.length > 2);
}
