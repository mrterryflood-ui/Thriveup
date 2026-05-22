/**
 * Regional Briefing — "Tell me the issues going on in {region} re: {topic}"
 *
 * Built 2026-05-22. Spits out ALL solutions: matching grants from our 721 +
 * relevant ecosystem platforms + a synthesized briefing through the
 * ethical-EI-preambled AI provider.
 *
 * POST  /api/regional-briefing/query    — non-streaming JSON answer
 * POST  /api/regional-briefing/stream   — SSE streaming answer
 * GET   /api/regional-briefing/context  — preview: which grants + platforms
 *                                         match a (region, topic) — no AI cost
 */
import type { Express, Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "./storage";
import { grantOpportunities, ecosystemPlatforms } from "@shared/schema";
import { streamAIResponse, generateAIResponse } from "./ai-provider";

const MAX_LEN = 2000;

// ── Auth + rate-limit (same pattern as voice-routes; paid AI = must be gated) ──
function getUserId(req: Request): string | undefined {
  const u = (req as unknown as { user?: { claims?: { sub?: string }; id?: string } }).user;
  return u?.claims?.sub || u?.id;
}
function requireSignedIn(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) return res.status(401).json({ error: "Sign in to use the Regional Briefing." });
  return next();
}
function ipHashOf(req: Request): string {
  // SECURITY: use trusted socket peer, never client-supplied XFF — see voice-routes.ts:96.
  const raw = req.socket.remoteAddress || "0.0.0.0";
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}
const rateBucket = new Map<string, { count: number; resetAt: number }>();
function rateLimit(opts: { keyPrefix: string; max: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${opts.keyPrefix}:${ipHashOf(req)}`;
    const now = Date.now();
    const entry = rateBucket.get(key);
    if (!entry || entry.resetAt < now) {
      rateBucket.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    if (entry.count >= opts.max) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again shortly." });
    }
    entry.count += 1;
    return next();
  };
}

function clean(s: unknown, max = MAX_LEN): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function tokensFrom(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

interface BriefingContext {
  region: string;
  topic: string;
  grants: Array<{
    id: string;
    title: string;
    agency: string | null;
    funding_amount: string | null;
    deadline: string | null;
    fit_score: number | null;
    status: string | null;
    source_url: string | null;
    cfda: string | null;
    snippet: string;
  }>;
  platforms: Array<{
    name: string;
    url: string | null;
    role: string | null;
    description: string | null;
  }>;
  grant_total_in_db: number;
}

async function loadContext(region: string, topic: string): Promise<BriefingContext> {
  const allTokens = [...tokensFrom(region), ...tokensFrom(topic)].filter((t, i, a) => a.indexOf(t) === i);
  // Build OR-of-ILIKE for grants on title+description
  const filtered = allTokens.length
    ? sql`(${sql.join(
        allTokens.map(
          (t) =>
            sql`(LOWER(${grantOpportunities.title}) LIKE ${"%" + t + "%"} OR LOWER(COALESCE(${grantOpportunities.description},'')) LIKE ${"%" + t + "%"})`,
        ),
        sql` OR `,
      )})`
    : sql`TRUE`;

  const grants = await db
    .select({
      id: grantOpportunities.id,
      title: grantOpportunities.title,
      agency: grantOpportunities.agency,
      funding_amount: grantOpportunities.fundingAmount,
      deadline: grantOpportunities.deadline,
      fit_score: grantOpportunities.fitScore,
      status: grantOpportunities.status,
      source_url: grantOpportunities.sourceUrl,
      cfda: grantOpportunities.cfda,
      description: grantOpportunities.description,
    })
    .from(grantOpportunities)
    .where(filtered)
    .orderBy(sql`${grantOpportunities.fitScore} DESC NULLS LAST, ${grantOpportunities.deadline} ASC NULLS LAST`)
    .limit(30);

  const totalRow = await db.execute(sql`SELECT COUNT(*)::int AS n FROM grant_opportunities`);
  // drizzle's execute returns rows in .rows on neon
  const totalRows = (totalRow as unknown as { rows?: Array<{ n: number }> }).rows ?? (totalRow as unknown as Array<{ n: number }>);
  const grant_total_in_db = (totalRows[0]?.n as number) ?? 0;

  const platforms = await db
    .select({
      name: ecosystemPlatforms.name,
      url: ecosystemPlatforms.url,
      role: ecosystemPlatforms.role,
      description: ecosystemPlatforms.description,
    })
    .from(ecosystemPlatforms)
    .where(sql`${ecosystemPlatforms.publicVisible} = TRUE`)
    .orderBy(ecosystemPlatforms.name);

  return {
    region,
    topic,
    grant_total_in_db,
    grants: grants.map((g) => ({
      id: g.id,
      title: g.title,
      agency: g.agency,
      funding_amount: g.funding_amount,
      deadline: g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : null,
      fit_score: g.fit_score,
      status: g.status,
      source_url: g.source_url,
      cfda: g.cfda,
      snippet: (g.description ?? "").slice(0, 240),
    })),
    platforms,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are TCAF's Regional Briefing AI. Your job is to give a primary-source, action-ready briefing on regional issues — and SPIT OUT ALL SOLUTIONS available through TCAF + matching grants + ecosystem partners.",
    "",
    "OUTPUT STRUCTURE (use these exact H2 headings):",
    "## 1. What's actually happening on the ground",
    "## 2. The data we can verify (Census ACS, CDC PLACES, ATSDR SVI, FBI CDE, state portals) — say plainly which numbers you HAVE vs which need a primary-source pull",
    "## 3. Matching grants (list every one I gave you in the GRANT CANDIDATES block — title, agency, $, deadline, fit, link)",
    "## 4. ALL SOLUTIONS — TCAF capabilities that map to this issue (use the PLATFORMS block + general TCAF knowledge)",
    "## 5. Concrete next moves — specific, named, owned, dated",
    "",
    "RULES:",
    "- Never invent grant titles, funder names, dollar amounts, deadlines, or stats. If it's not in the context, say 'needs primary-source verification' and move on.",
    "- Never use the phrase 'I cannot' or 'as an AI'. Just deliver the briefing.",
    "- 'President' not 'CEO' for Dr. Flood. Institutional email only: terryflood@thrivingcommunitiesforall.com.",
    "- If region is Texas + topic touches the City of Austin, FLAG that Meredith Sisnett (City employee) cannot be on any City-of-Austin pass-through.",
    "- Plain language. No jargon walls. The reader is a grant operator or community partner, not an academic.",
    "- Solutions section must enumerate EVERY relevant TCAF capability (don't pick favorites — the user wants ALL).",
    "- Include a final 'Iron Rule reminders' bullet listing which claims need a primary-source pull before any external use.",
  ].join("\n");
}

function buildUserPrompt(ctx: BriefingContext, question?: string): string {
  const grantBlock = ctx.grants.length
    ? ctx.grants
        .map(
          (g, i) =>
            `[G${i + 1}] ${g.title}\n    Agency: ${g.agency ?? "n/a"}\n    Funding: ${g.funding_amount ?? "n/a"}    Deadline: ${g.deadline ?? "n/a"}    Fit: ${g.fit_score ?? "n/a"}    Status: ${g.status ?? "n/a"}    CFDA: ${g.cfda ?? "n/a"}\n    URL: ${g.source_url ?? "n/a"}\n    Snippet: ${g.snippet.replace(/\s+/g, " ").trim()}`,
        )
        .join("\n\n")
    : "(no matching grants — note this honestly in section 3)";

  const platformBlock = ctx.platforms.length
    ? ctx.platforms.map((p) => `- ${p.name} (${p.role ?? "n/a"}) — ${p.description ?? "n/a"} — ${p.url ?? "n/a"}`).join("\n")
    : "(no public-visible platforms loaded)";

  return [
    `REGION: ${ctx.region}`,
    `TOPIC: ${ctx.topic}`,
    `USER QUESTION: ${question ?? "Tell me what's going on here and give me every grant and TCAF capability that can move this forward."}`,
    "",
    `=== GRANT CANDIDATES (${ctx.grants.length} of ${ctx.grant_total_in_db} total in our DB) — list EVERY one in section 3 ===`,
    grantBlock,
    "",
    `=== TCAF ECOSYSTEM PLATFORMS (${ctx.platforms.length} public-facing) — use these in section 4 ===`,
    platformBlock,
    "",
    "Now produce the briefing per the system prompt structure. Be specific. Spit out ALL solutions.",
  ].join("\n");
}

export function registerRegionalBriefingRoutes(app: Express): void {
  // Preview: who would the AI see? Cheap, no token spend — but still auth + light limit
  // to keep this from becoming an anonymous data-mining endpoint.
  app.get("/api/regional-briefing/context", requireSignedIn, rateLimit({ keyPrefix: "rb-context", max: 30, windowMs: 5 * 60_000 }), async (req: Request, res: Response) => {
    try {
      const region = clean(req.query.region, 200);
      const topic = clean(req.query.topic, 200);
      if (!region || !topic) {
        return res.status(400).json({ error: "region and topic are required" });
      }
      const ctx = await loadContext(region, topic);
      res.json({
        region: ctx.region,
        topic: ctx.topic,
        grant_count: ctx.grants.length,
        grant_total_in_db: ctx.grant_total_in_db,
        platform_count: ctx.platforms.length,
        grants: ctx.grants,
        platforms: ctx.platforms,
      });
    } catch (err) {
      console.error("[regional-briefing] context failed:", err);
      res.status(500).json({ error: "Failed to load context" });
    }
  });

  app.post("/api/regional-briefing/query", requireSignedIn, rateLimit({ keyPrefix: "rb-query", max: 8, windowMs: 10 * 60_000 }), async (req: Request, res: Response) => {
    try {
      const region = clean(req.body?.region, 200);
      const topic = clean(req.body?.topic, 200);
      const question = clean(req.body?.question, MAX_LEN);
      if (!region || !topic) {
        return res.status(400).json({ error: "region and topic are required" });
      }
      const ctx = await loadContext(region, topic);
      const answer = await generateAIResponse(
        [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(ctx, question) },
        ],
        2500,
      );
      res.json({
        region,
        topic,
        question: question || null,
        grant_count: ctx.grants.length,
        platform_count: ctx.platforms.length,
        grants: ctx.grants,
        platforms: ctx.platforms,
        briefing: answer,
      });
    } catch (err) {
      console.error("[regional-briefing] query failed:", err);
      res.status(500).json({ error: "Failed to generate briefing" });
    }
  });

  app.post("/api/regional-briefing/stream", requireSignedIn, rateLimit({ keyPrefix: "rb-stream", max: 8, windowMs: 10 * 60_000 }), async (req: Request, res: Response) => {
    try {
      const region = clean(req.body?.region, 200);
      const topic = clean(req.body?.topic, 200);
      const question = clean(req.body?.question, MAX_LEN);
      if (!region || !topic) {
        return res.status(400).json({ error: "region and topic are required" });
      }
      const ctx = await loadContext(region, topic);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let clientDisconnected = false;
      req.on("close", () => {
        clientDisconnected = true;
      });

      // Send context first so the UI can render the grant + platform list immediately.
      res.write(
        `data: ${JSON.stringify({
          context: {
            region,
            topic,
            grant_count: ctx.grants.length,
            platform_count: ctx.platforms.length,
            grants: ctx.grants,
            platforms: ctx.platforms,
          },
        })}\n\n`,
      );

      await streamAIResponse({
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(ctx, question) },
        ],
        maxTokens: 2500,
        onChunk: (content: string) => {
          if (!clientDisconnected) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          if (!clientDisconnected) res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error: Error) => {
          if (!clientDisconnected) res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
        },
      });
    } catch (err) {
      console.error("[regional-briefing] stream failed:", err);
      if (!res.headersSent) res.status(500).json({ error: "Failed to stream briefing" });
    }
  });
}
