/**
 * Regional Briefing — chat-style, city-agnostic, multi-location compare.
 *
 * v2 (2026-05-22): multi-location compare + stakeholders/outcomes by ZIP +
 * save-as-workflow CRUD. AI extracts locations + topic from one free-text ask.
 *
 * Endpoints:
 *   POST  /api/regional-briefing/extract       — parse question -> {locations, topic}
 *   POST  /api/regional-briefing/stream        — SSE briefing (multi-location)
 *   POST  /api/regional-briefing/query         — non-streaming briefing
 *   GET   /api/regional-briefing/context       — preview matches, no AI cost
 *
 *   GET   /api/regional-briefing/workflows           — list mine
 *   POST  /api/regional-briefing/workflows           — save
 *   GET   /api/regional-briefing/workflows/:slug     — load one
 *   POST  /api/regional-briefing/workflows/:slug/cache  — store last briefing text
 *   DELETE /api/regional-briefing/workflows/:slug    — delete mine
 */
import type { Express, Request, Response, NextFunction } from "express";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./storage";
import { briefingWorkflows, ecosystemPlatforms, grantOpportunities } from "@shared/schema";
import { generateAIJSON, generateAIResponse, streamAIResponse } from "./ai-provider";

const MAX_LEN = 2000;
const MAX_LOCATIONS = 6;

// ── Auth + rate-limit ────────────────────────────────────────────────────────
function getUserId(req: Request): string | undefined {
  const u = (req as unknown as { user?: { claims?: { sub?: string }; id?: string } }).user;
  return u?.claims?.sub || u?.id;
}
function requireSignedIn(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) return res.status(401).json({ error: "Sign in to use the Regional Briefing." });
  return next();
}
function ipHashOf(req: Request): string {
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

// ── Types ────────────────────────────────────────────────────────────────────
export interface BriefingLocation {
  label: string;          // human-readable: "Round Rock TX 78664"
  region: string;         // city/county/region for narrative + grant filter
  zip?: string;           // optional 5-digit ZIP
  countyFips?: string;    // optional 5-digit FIPS (for Chainweb-anywhere)
  metroId?: string;       // optional internal metro id
}

interface LocationContext {
  location: BriefingLocation;
  grants: GrantHit[];
  platforms: PlatformHit[];
}

interface GrantHit {
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
}
interface PlatformHit {
  name: string;
  url: string | null;
  role: string | null;
  description: string | null;
}

// ── AI extraction: question -> {locations[], topic} ─────────────────────────
async function extractLocationsAndTopic(question: string): Promise<{ locations: BriefingLocation[]; topic: string }> {
  const sys = [
    "You extract structured fields from a user's regional-briefing question.",
    "Return STRICT JSON of the form:",
    '{"locations":[{"label":"...","region":"...","zip":"...","countyFips":"...","metroId":"..."}],"topic":"..."}',
    "- locations: 1–6 items. ONE per place the user wants briefed/compared.",
    "  • label = short human-friendly tag the UI will show (city + state + ZIP if given).",
    "  • region = the city/county/region only — no state suffix unless needed for disambiguation.",
    "  • zip = 5-digit ZIP if explicitly named, else omit.",
    "  • countyFips = 5-digit US county FIPS if you know it confidently, else omit.",
    "  • metroId = omit (internal id, leave blank).",
    "- topic = short issue/sector phrase (e.g., 'childcare infrastructure', 'reentry housing', 'behavioral health access').",
    "- If user named no place, return one location with region='United States'.",
    "- If user named no topic, return topic='community well-being'.",
    "- Do NOT invent ZIPs or FIPS codes you aren't sure of. Omit instead.",
    "- JSON only. No prose. No extra fields.",
  ].join("\n");
  try {
    const out = await generateAIJSON<{
      locations?: Array<{ label?: string; region?: string; zip?: string; countyFips?: string; metroId?: string }>;
      topic?: string;
    }>(`User question: ${question}\n\nReturn JSON only.`, sys);
    const rawLocs = Array.isArray(out?.locations) ? out!.locations! : [];
    const locations: BriefingLocation[] = rawLocs.slice(0, MAX_LOCATIONS).map((l) => {
      const region = clean(l.region, 200) || "United States";
      const zip = /^\d{5}$/.test(String(l.zip ?? "").trim()) ? String(l.zip).trim() : undefined;
      const countyFips = /^\d{5}$/.test(String(l.countyFips ?? "").trim()) ? String(l.countyFips).trim() : undefined;
      const label = clean(l.label, 200) || (zip ? `${region} ${zip}` : region);
      return { label, region, zip, countyFips };
    });
    const safeLocations = locations.length ? locations : [{ label: "United States", region: "United States" }];
    const topic = clean(out?.topic, 200) || "community well-being";
    return { locations: safeLocations, topic };
  } catch {
    return { locations: [{ label: "United States", region: "United States" }], topic: "community well-being" };
  }
}

function tokensFrom(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

async function loadLocationContext(loc: BriefingLocation, topic: string): Promise<LocationContext> {
  const tokens = [
    ...tokensFrom(loc.region),
    ...tokensFrom(topic),
    ...(loc.zip ? [loc.zip] : []),
  ].filter((t, i, a) => a.indexOf(t) === i);

  const filtered = tokens.length
    ? sql`(${sql.join(
        tokens.map(
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
    .limit(20);

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
    location: loc,
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

function buildSystemPrompt(multi: boolean): string {
  const lines = [
    "You are TCAF's Regional Briefing AI. You produce a primary-source, action-ready briefing that tells a data story, names stakeholders by ZIP, and enumerates ALL solutions available through TCAF + matching grants + ecosystem partners.",
    "",
    "OUTPUT STRUCTURE (use these exact H2 headings, IN THIS ORDER):",
    "## 1. The data story",
    "    Plain-language narrative of what's actually happening on the ground per location. Tell it like a story, not a stat dump.",
    "## 2. Verifiable data (primary sources)",
    "    Say plainly which numbers you HAVE in context vs which need a primary-source pull from Census ACS, CDC PLACES, ATSDR SVI, FBI CDE, state portals, or the TCAF Corridor Chainweb. Cite source name + URL when possible.",
    "## 3. Stakeholders by ZIP",
    "    For EACH location, list the real, named stakeholder ecosystem by ZIP / county: county judge, school district(s), MHMR / LMHA, FQHCs, hospital systems, faith networks, workforce board, justice partners, philanthropy, grassroots orgs. If a name needs verification, mark it [verify].",
    "## 4. Matching grants",
    "    List EVERY grant in the GRANT CANDIDATES block (title, agency, $, deadline, fit, link). Group by location if multi-location.",
    "## 5. ALL TCAF solutions",
    "    Enumerate EVERY relevant TCAF capability from the PLATFORMS block — don't pick favorites. The user wants all of them mapped to this issue.",
    "## 6. Implementation plan by ZIP",
    "    For EACH location's primary ZIP(s): a concrete, sequenced 4–8 step rollout (who does what, in what order). Specific, named, owned.",
    "## 7. Measurable outcomes per stakeholder per ZIP",
    "    For EACH stakeholder named in section 3, the specific outcome you'd commit to (with a measurable target + timeframe). Markdown table is fine.",
  ];
  if (multi) {
    lines.push(
      "## 8. Cross-location comparison",
      "    Markdown table: rows = locations, columns = (what's similar, what's different, what each one uniquely needs, fit-score of best matching grant). Then 3 bullets on the strategic implication.",
    );
  }
  lines.push(
    "## 9. Concrete next moves",
    "    Specific, named, owned, dated next steps for the user.",
    "## 10. Iron Rule reminders",
    "    Bulleted list of claims in this briefing that need a primary-source pull before any external use.",
    "",
    "RULES:",
    "- Never invent grant titles, funder names, dollar amounts, deadlines, or stats. Use only what's in the GRANT CANDIDATES + PLATFORMS blocks plus widely-known public facts. When unsure, mark '[needs primary-source pull]'.",
    "- 'President' not 'CEO' for Dr. Flood. Institutional email only: terryflood@thrivingcommunitiesforall.com.",
    "- If any location touches the City of Austin, FLAG that Meredith Sisnett (City employee) cannot be on any City-of-Austin pass-through.",
    "- Plain language. No jargon walls. The reader is a grant operator or community partner, not an academic.",
    "- Section 5 must enumerate EVERY relevant TCAF capability. Do not omit one because it 'feels weaker.'",
    "- Section 7's outcomes must be measurable (count, %, $, days, served) with a timeframe (90 days / 6 mo / 12 mo).",
  );
  return lines.join("\n");
}

function blockForLocation(ctx: LocationContext, idx: number): string {
  const g = ctx.grants.length
    ? ctx.grants
        .map(
          (x, i) =>
            `  [L${idx}-G${i + 1}] ${x.title}\n      Agency: ${x.agency ?? "n/a"} | Funding: ${x.funding_amount ?? "n/a"} | Deadline: ${x.deadline ?? "n/a"} | Fit: ${x.fit_score ?? "n/a"} | Status: ${x.status ?? "n/a"} | CFDA: ${x.cfda ?? "n/a"}\n      URL: ${x.source_url ?? "n/a"}\n      Snippet: ${x.snippet.replace(/\s+/g, " ").trim()}`,
        )
        .join("\n")
    : "  (no matching grants — note this honestly)";
  return [
    `=== LOCATION ${idx}: ${ctx.location.label} ===`,
    `  Region: ${ctx.location.region}${ctx.location.zip ? `  ZIP: ${ctx.location.zip}` : ""}${ctx.location.countyFips ? `  CountyFIPS: ${ctx.location.countyFips}` : ""}`,
    `  GRANT CANDIDATES (${ctx.grants.length}):`,
    g,
  ].join("\n");
}

function buildUserPrompt(contexts: LocationContext[], topic: string, question: string): string {
  // Platforms are global (TCAF capabilities are the same regardless of location) so render once.
  const platforms = contexts[0]?.platforms ?? [];
  const platformBlock = platforms.length
    ? platforms.map((p) => `- ${p.name} (${p.role ?? "n/a"}) — ${p.description ?? "n/a"} — ${p.url ?? "n/a"}`).join("\n")
    : "(no public-visible platforms loaded)";

  const locsBlock = contexts.map((c, i) => blockForLocation(c, i + 1)).join("\n\n");
  const labels = contexts.map((c) => c.location.label).join(" | ");

  return [
    `TOPIC: ${topic}`,
    `LOCATIONS (${contexts.length}): ${labels}`,
    `USER QUESTION: ${question || "Tell me the data story, the stakeholders by ZIP, every grant, every TCAF capability, the implementation plan, and the measurable outcomes I should commit to."}`,
    "",
    locsBlock,
    "",
    `=== TCAF ECOSYSTEM PLATFORMS (${platforms.length} public-facing) — use ALL of these in section 5 ===`,
    platformBlock,
    "",
    "Now produce the full briefing per the system prompt structure. Be specific. Spit out ALL solutions. Tell the data story.",
  ].join("\n");
}

// ── Slug helper for saved workflows ──────────────────────────────────────────
function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "workflow";
  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

// ── Routes ───────────────────────────────────────────────────────────────────
export function registerRegionalBriefingRoutes(app: Express): void {
  // Cheap preview (used by context-tab / debug)
  app.get(
    "/api/regional-briefing/context",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-context", max: 30, windowMs: 5 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const region = clean(req.query.region, 200);
        const topic = clean(req.query.topic, 200);
        if (!region || !topic) return res.status(400).json({ error: "region and topic are required" });
        const ctx = await loadLocationContext({ label: region, region }, topic);
        res.json({
          region,
          topic,
          grant_count: ctx.grants.length,
          platform_count: ctx.platforms.length,
          grants: ctx.grants,
          platforms: ctx.platforms,
        });
      } catch (err) {
        console.error("[regional-briefing] context failed:", err);
        res.status(500).json({ error: "Failed to load context" });
      }
    },
  );

  // AI extraction only — let the UI show parsed {locations, topic} before paying for the full stream
  app.post(
    "/api/regional-briefing/extract",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-extract", max: 20, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const question = clean(req.body?.question, MAX_LEN);
        if (!question) return res.status(400).json({ error: "question is required" });
        const out = await extractLocationsAndTopic(question);
        res.json(out);
      } catch (err) {
        console.error("[regional-briefing] extract failed:", err);
        res.status(500).json({ error: "Extraction failed" });
      }
    },
  );

  // Resolve {question OR explicit locations[] + topic} -> normalized {locations[], topic, question}
  async function resolveAsk(body: Record<string, unknown>): Promise<{ locations: BriefingLocation[]; topic: string; question: string } | { error: string }> {
    const question = clean(body?.question, MAX_LEN);
    const rawLocs = Array.isArray(body?.locations) ? (body!.locations as unknown[]) : null;
    let topic = clean(body?.topic, 200);

    if (rawLocs && rawLocs.length) {
      const locations: BriefingLocation[] = rawLocs.slice(0, MAX_LOCATIONS).map((raw) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        const region = clean(r.region, 200) || clean(r.label, 200) || "United States";
        const zip = /^\d{5}$/.test(String(r.zip ?? "").trim()) ? String(r.zip).trim() : undefined;
        const countyFips = /^\d{5}$/.test(String(r.countyFips ?? "").trim()) ? String(r.countyFips).trim() : undefined;
        const label = clean(r.label, 200) || (zip ? `${region} ${zip}` : region);
        return { label, region, zip, countyFips };
      });
      if (!topic) topic = "community well-being";
      return { locations, topic, question };
    }

    if (!question) return { error: "Ask a question, or pass explicit locations + topic." };
    const extracted = await extractLocationsAndTopic(question);
    return { locations: extracted.locations, topic: topic || extracted.topic, question };
  }

  app.post(
    "/api/regional-briefing/query",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-query", max: 6, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const resolved = await resolveAsk(req.body ?? {});
        if ("error" in resolved) return res.status(400).json({ error: resolved.error });
        const { locations, topic, question } = resolved;
        const contexts = await Promise.all(locations.map((l) => loadLocationContext(l, topic)));
        const answer = await generateAIResponse(
          [
            { role: "system", content: buildSystemPrompt(locations.length > 1) },
            { role: "user", content: buildUserPrompt(contexts, topic, question) },
          ],
          4000,
        );
        res.json({
          locations,
          topic,
          question: question || null,
          per_location: contexts.map((c) => ({
            location: c.location,
            grant_count: c.grants.length,
            grants: c.grants,
          })),
          platforms: contexts[0]?.platforms ?? [],
          briefing: answer,
        });
      } catch (err) {
        console.error("[regional-briefing] query failed:", err);
        res.status(500).json({ error: "Failed to generate briefing" });
      }
    },
  );

  app.post(
    "/api/regional-briefing/stream",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-stream", max: 6, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const resolved = await resolveAsk(req.body ?? {});
        if ("error" in resolved) return res.status(400).json({ error: resolved.error });
        const { locations, topic, question } = resolved;
        const contexts = await Promise.all(locations.map((l) => loadLocationContext(l, topic)));

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let clientDisconnected = false;
        req.on("close", () => {
          clientDisconnected = true;
        });

        res.write(
          `data: ${JSON.stringify({
            context: {
              locations,
              topic,
              platforms: contexts[0]?.platforms ?? [],
              per_location: contexts.map((c) => ({
                location: c.location,
                grant_count: c.grants.length,
                grants: c.grants,
              })),
            },
          })}\n\n`,
        );

        await streamAIResponse({
          messages: [
            { role: "system", content: buildSystemPrompt(locations.length > 1) },
            { role: "user", content: buildUserPrompt(contexts, topic, question) },
          ],
          maxTokens: 4000,
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
    },
  );

  // ── Saved workflows CRUD ──────────────────────────────────────────────────
  app.get(
    "/api/regional-briefing/workflows",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-list", max: 60, windowMs: 5 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const rows = await db
          .select()
          .from(briefingWorkflows)
          .where(eq(briefingWorkflows.createdBy, uid))
          .orderBy(sql`${briefingWorkflows.updatedAt} DESC`)
          .limit(100);
        res.json({ workflows: rows });
      } catch (err) {
        console.error("[regional-briefing] list workflows failed:", err);
        res.status(500).json({ error: "Failed to list workflows" });
      }
    },
  );

  app.post(
    "/api/regional-briefing/workflows",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-save", max: 30, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const name = clean(req.body?.name, 200);
        const question = clean(req.body?.question, MAX_LEN);
        const topic = clean(req.body?.topic, 200) || "community well-being";
        const rawLocs = Array.isArray(req.body?.locations) ? (req.body.locations as unknown[]) : [];
        if (!name || !question || !rawLocs.length) {
          return res.status(400).json({ error: "name, question, and locations are required" });
        }
        const locations: BriefingLocation[] = rawLocs.slice(0, MAX_LOCATIONS).map((raw) => {
          const r = (raw ?? {}) as Record<string, unknown>;
          const region = clean(r.region, 200) || clean(r.label, 200) || "United States";
          const zip = /^\d{5}$/.test(String(r.zip ?? "").trim()) ? String(r.zip).trim() : undefined;
          const countyFips = /^\d{5}$/.test(String(r.countyFips ?? "").trim()) ? String(r.countyFips).trim() : undefined;
          const label = clean(r.label, 200) || (zip ? `${region} ${zip}` : region);
          return { label, region, zip, countyFips };
        });
        const slug = makeSlug(name);
        const [row] = await db
          .insert(briefingWorkflows)
          .values({ slug, name, question, topic, locations, createdBy: uid })
          .returning();
        res.json({ workflow: row });
      } catch (err) {
        console.error("[regional-briefing] save workflow failed:", err);
        res.status(500).json({ error: "Failed to save workflow" });
      }
    },
  );

  app.get(
    "/api/regional-briefing/workflows/:slug",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-get", max: 120, windowMs: 5 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const slug = clean(req.params.slug, 96);
        const [row] = await db
          .select()
          .from(briefingWorkflows)
          .where(and(eq(briefingWorkflows.slug, slug), eq(briefingWorkflows.createdBy, uid)))
          .limit(1);
        if (!row) return res.status(404).json({ error: "Workflow not found" });
        res.json({ workflow: row });
      } catch (err) {
        console.error("[regional-briefing] get workflow failed:", err);
        res.status(500).json({ error: "Failed to load workflow" });
      }
    },
  );

  app.post(
    "/api/regional-briefing/workflows/:slug/cache",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-cache", max: 60, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const slug = clean(req.params.slug, 96);
        const briefing = clean(req.body?.briefing, 60_000);
        if (!briefing) return res.status(400).json({ error: "briefing required" });
        const [row] = await db
          .update(briefingWorkflows)
          .set({ lastBriefing: briefing, lastRunAt: new Date(), updatedAt: new Date() })
          .where(and(eq(briefingWorkflows.slug, slug), eq(briefingWorkflows.createdBy, uid)))
          .returning();
        if (!row) return res.status(404).json({ error: "Workflow not found" });
        res.json({ workflow: row });
      } catch (err) {
        console.error("[regional-briefing] cache workflow failed:", err);
        res.status(500).json({ error: "Failed to cache briefing" });
      }
    },
  );

  app.delete(
    "/api/regional-briefing/workflows/:slug",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-del", max: 30, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const slug = clean(req.params.slug, 96);
        const deleted = await db
          .delete(briefingWorkflows)
          .where(and(eq(briefingWorkflows.slug, slug), eq(briefingWorkflows.createdBy, uid)))
          .returning({ id: briefingWorkflows.id });
        if (!deleted.length) return res.status(404).json({ error: "Workflow not found" });
        res.json({ ok: true });
      } catch (err) {
        console.error("[regional-briefing] delete workflow failed:", err);
        res.status(500).json({ error: "Failed to delete workflow" });
      }
    },
  );
}
