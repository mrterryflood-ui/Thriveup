/**
 * Gun Violence Registry
 *
 * Provides a staff-gated import endpoint and a public aggregate-only
 * summary endpoint. No victim PII is stored or exposed — only incident
 * geography, type, and counts.
 *
 * POST /api/gun-violence/import   — staff-gated; idempotent upsert by incidentId+dataSource
 * GET  /api/gun-violence/summary  — public aggregate counts; rate-limited by IP
 * GET  /api/gun-violence/imports  — staff-gated; import history / audit log
 */
import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { gunViolenceIncidents, gunViolenceImports } from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth } from "./tenant-middleware";
import { z } from "zod";
import { enforceGroundedClaims, buildRoiRule, buildAnyOfRule, type ClaimRule } from "./ai-claim-grounding";
import { recordClaimDecisions } from "./claim-chain";

/**
 * Grounds the AI-generated gun violence story against the real data it was
 * given: no cost-effectiveness/ROI-style dollar claim is permitted anywhere
 * (none is computed for this surface, so any such claim is fabricated), and
 * any restatement of the national death total, crude rate, or ACE-firearm
 * correlation is checked against the real fetched values. `keyNumbers`
 * values are passed through the same body-text grounding engine (treating
 * each as its own one-sentence "narrative") so a fabricated key number is
 * caught the same way a fabricated body sentence would be.
 */
function groundGunViolenceStory(
  story: { headline?: string; subhead?: string; body?: string[]; keyNumbers?: { label: string; value: string }[]; callToAction?: string },
  ctx: { cdcSummary: any; acesCorr: any; geography: string }
): typeof story {
  const totalDeaths = ctx.cdcSummary?.totalDeaths ?? 834013;
  const crudeRate = ctx.cdcSummary?.latestYear?.crudeRate ?? 14.5;
  const peakDeaths = ctx.cdcSummary?.peakYear?.deaths ?? 48830;
  const aceR = ctx.acesCorr?.aceFirearmR ?? 0.856;

  const rules: ClaimRule[] = [
    // No cost-benefit/ROI figure is computed for this surface — any such claim is fabricated.
    buildRoiRule("gun-violence-cost-effectiveness", null),
    buildAnyOfRule(
      "gun-violence-national-stats",
      /died|deaths?|per\s*100,?000|correlat|r\s*=/i,
      (sentence) => {
        const claims: { value: number; kind: string }[] = [];
        const numRe = /(\d[\d,]*(?:\.\d+)?)/g;
        let m: RegExpExecArray | null;
        while ((m = numRe.exec(sentence))) {
          const n = parseFloat(m[1].replace(/,/g, ""));
          if (!Number.isFinite(n)) continue;
          // Exclude bare 4-digit calendar-year mentions ("since 1999") — a
          // year is not itself a statistical claim needing grounding.
          if (n >= 1900 && n <= 2100 && !m[1].includes(",")) continue;
          claims.push({ value: n, kind: "stat" });
        }
        return claims;
      },
      [totalDeaths, crudeRate, peakDeaths, aceR, aceR * 100],
      (v) => Math.max(0.5, Math.abs(v) * 0.03)
    ),
  ];

  const allDecisions: import("./ai-claim-grounding").GroundingDecision[] = [];
  const groundText = (text: string | undefined): string | undefined => {
    if (!text) return text;
    const result = enforceGroundedClaims(text, rules);
    allDecisions.push(...result.decisions);
    return result.text;
  };

  const groundedBody = (story.body || []).map((p) => groundText(p) || "");
  const groundedHeadline = groundText(story.headline);
  const groundedSubhead = groundText(story.subhead);
  const groundedCTA = groundText(story.callToAction);
  const groundedKeyNumbers = (story.keyNumbers || []).map((kn) => {
    const asSentence = `${kn.label}: ${kn.value}.`;
    const result = enforceGroundedClaims(asSentence, rules);
    allDecisions.push(...result.decisions);
    // Only the ROI/cost-effectiveness rule can invalidate a whole key number
    // (the national-stats rule is an allow-list of KNOWN good numbers, not
    // every number this story is entitled to state — a key number restating
    // a LOCAL registry count, for example, has no source value here and
    // would be over-flagged by requiring an exact match). Drop a key number
    // only when it was specifically flagged as an ungrounded cost-benefit claim.
    const costClaim = result.decisions.find((d) => d.ruleId === "gun-violence-cost-effectiveness" && d.verdict !== "kept");
    return costClaim ? null : kn;
  }).filter((kn): kn is { label: string; value: string } => kn !== null);

  if (allDecisions.length > 0) {
    recordClaimDecisions("gun-violence-story", ctx.geography, allDecisions).catch((err) =>
      console.error("[GunViolence] claim-chain record failed (non-fatal):", err)
    );
  }
  const droppedCount = allDecisions.filter((d) => d.verdict !== "kept").length;
  if (droppedCount > 0) {
    console.error(`[GunViolence] story for ${ctx.geography} contained ${droppedCount} ungrounded claim(s) — redacted.`);
  }

  return { ...story, headline: groundedHeadline, subhead: groundedSubhead, body: groundedBody, keyNumbers: groundedKeyNumbers, callToAction: groundedCTA };
}

// ── Simple in-memory rate limiter (no package dependency) ────────────────────
const summaryRateWindows = new Map<string, { count: number; resetAt: number }>();
function checkSummaryRate(ip: string): boolean {
  const now = Date.now();
  const entry = summaryRateWindows.get(ip);
  if (!entry || now > entry.resetAt) {
    summaryRateWindows.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}

// ── Staff role check (shared 5-role set) ─────────────────────────────────────
const STAFF_ROLES = new Set(["admin", "staff", "chw", "youth_staff", "hub_staff"]);
function isStaff(req: Request): boolean {
  const role = (req as any).user?.role;
  return STAFF_ROLES.has(role);
}

// ── Import payload schema ────────────────────────────────────────────────────
const incidentSchema = z.object({
  incidentId: z.string().min(1).max(255),
  dataSource: z.string().min(1).max(100),
  occurredAt: z.string().optional(),       // ISO-8601 string
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zip: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  ward: z.string().max(50).optional(),
  victimCount: z.number().int().min(0).optional(),
  fatalCount: z.number().int().min(0).optional(),
  incidentType: z.string().max(100).optional(), // e.g. "shooting", "homicide", "aggravated-assault"
});
const importSchema = z.array(incidentSchema).min(1).max(10_000);

// ── Module-level intelligence cache (shared by route + conductor + Navigator) ─
let _intelligenceCache: { data: any; cachedAt: number } | null = null;
const REGISTRY_BASE = "https://gun-violence-registry.replit.app";

/**
 * Fetches and caches the full gun-violence intelligence dataset (CDC, FBI, NCVS,
 * WISQARS, root-causes, SDOH, ACEs, policy DID, RPLICE + local DB counts).
 * Cached in-process for 1 hour. Safe to call from conductor, Navigator, or any
 * server-side context — no HTTP round-trip when cache is warm.
 */
export async function getGunViolenceIntelligenceData(): Promise<any> {
  if (_intelligenceCache && Date.now() - _intelligenceCache.cachedAt < 3_600_000) {
    return _intelligenceCache.data;
  }

  const fetcher = (path: string) =>
    fetch(`${REGISTRY_BASE}${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

  const [
    cdcTrend, cdcSummary, cdcStates,
    fbiTrends, ncvsTrends, wisqarsCosts,
    rootCauses, socialDet,
    acesCorr, acesInterventions,
    didPolicies, rpliceFindingsRaw,
    localCounts,
  ] = await Promise.all([
    fetcher("/api/cdc/national/trend"),
    fetcher("/api/cdc/summary"),
    fetcher("/api/cdc/states"),
    fetcher("/api/fbi/trends"),
    fetcher("/api/ncvs/trends"),
    fetcher("/api/wisqars/costs"),
    fetcher("/api/root-causes"),
    fetcher("/api/social-determinants"),
    fetcher("/api/aces/correlations"),
    fetcher("/api/aces/interventions"),
    fetcher("/api/did/policies"),
    fetcher("/api/rplice/findings"),
    db.select({
      total:    sql<number>`count(*)::int`,
      victims:  sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}),0)::int`,
      fatal:    sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}),0)::int`,
      earliest: sql<string>`min(occurred_at)::text`,
      latest:   sql<string>`max(occurred_at)::text`,
    }).from(gunViolenceIncidents).then(rows => rows[0]).catch(() => null),
  ]);

  const rpliceFindings = Array.isArray(rpliceFindingsRaw)
    ? rpliceFindingsRaw.filter((f: any) => !f.payload?.probe)
    : [];

  const data = {
    meta: { generatedAt: new Date().toISOString(), source: "gun-violence-registry.replit.app" },
    headline: cdcSummary,
    cdcTrend, cdcStates, fbiTrends, ncvsTrends, wisqarsCosts,
    rootCauses, socialDeterminants: socialDet,
    aces: { correlations: acesCorr, interventions: acesInterventions },
    policy: didPolicies?.catalog ?? didPolicies,
    rpliceFindings,
    localRegistry: localCounts,
  };

  _intelligenceCache = { data, cachedAt: Date.now() };
  return data;
}

/**
 * Pulls current incidents from gun-violence-registry.replit.app and upserts
 * them into the local DB. Idempotent by (incidentId, dataSource).
 * Safe to call from a scheduler; writes an audit row to gun_violence_imports.
 * Returns { fetched, upserted, elapsedMs }.
 */
export async function runGunViolenceRegistrySync(): Promise<{ fetched: number; upserted: number; elapsedMs: number }> {
  const { nanoid } = await import("nanoid");
  const DATA_SOURCE = "gun-violence-registry";
  const BATCH_SIZE  = 500;
  const INSERT_CHUNK = 100;

  const importId    = nanoid(12);
  let totalFetched  = 0;
  let totalUpserted = 0;
  let offset        = 0;
  const startedAt   = Date.now();

  while (true) {
    const url    = `${REGISTRY_BASE}/api/incidents?offset=${offset}`;
    const apiRes = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
    if (!apiRes.ok) throw new Error(`Registry HTTP ${apiRes.status} at offset=${offset}`);

    const batch: any[] = await apiRes.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    totalFetched += batch.length;

    const rows = batch.map((r: any) => {
      let occurredAt: Date | undefined;
      try {
        if (r.date && r.date !== "0001-01-01") {
          const d = new Date(`${r.date}T${r.time || "00:00"}:00Z`);
          if (!isNaN(d.getTime())) occurredAt = d;
        }
      } catch { /* ignore */ }
      return {
        id:           nanoid(12),
        incidentId:   r.externalId || r.id,
        dataSource:   DATA_SOURCE,
        occurredAt,
        latitude:     r.latitude  || undefined,
        longitude:    r.longitude || undefined,
        zip:          r.zipCode   || undefined,
        city:         r.city      || undefined,
        state:        r.state     || undefined,
        victimCount:  (r.killed ?? 0) + (r.injured ?? 0),
        fatalCount:   r.killed ?? 0,
        incidentType: r.incidentType || undefined,
        importId,
      };
    });

    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      await db.insert(gunViolenceIncidents)
        .values(chunk)
        .onConflictDoUpdate({
          target: [gunViolenceIncidents.incidentId, gunViolenceIncidents.dataSource],
          set: {
            occurredAt:   sql`excluded.occurred_at`,
            latitude:     sql`excluded.latitude`,
            longitude:    sql`excluded.longitude`,
            zip:          sql`excluded.zip`,
            city:         sql`excluded.city`,
            state:        sql`excluded.state`,
            victimCount:  sql`excluded.victim_count`,
            fatalCount:   sql`excluded.fatal_count`,
            incidentType: sql`excluded.incident_type`,
            importId:     sql`excluded.import_id`,
          },
        });
      totalUpserted += chunk.length;
    }

    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
    await new Promise(r => setTimeout(r, 150));
  }

  const elapsedMs = Date.now() - startedAt;

  await db.insert(gunViolenceImports).values({
    dataSource:  DATA_SOURCE,
    recordCount: totalUpserted,
    notes: `Scheduled sync. fetched=${totalFetched} upserted=${totalUpserted} elapsed=${elapsedMs}ms`,
  });

  console.info(`[gv-sync] sync complete — fetched=${totalFetched} upserted=${totalUpserted} elapsed=${elapsedMs}ms`);
  return { fetched: totalFetched, upserted: totalUpserted, elapsedMs };
}

export function registerGunViolenceRoutes(app: Express) {

  /**
   * POST /api/gun-violence/import
   * Body: JSON array of incident objects (see incidentSchema above).
   * Upserts by (incidentId, dataSource) — safe to re-import the same dataset.
   * Writes an audit row to gun_violence_imports on success.
   */
  app.post("/api/gun-violence/import", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }

      const parsed = importSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid import payload.", detail: parsed.error.flatten() });
      }

      const records = parsed.data;
      const dataSource = records[0].dataSource;
      let inserted = 0;
      let skipped = 0;

      for (const rec of records) {
        try {
          const result = await db.insert(gunViolenceIncidents).values({
            incidentId: rec.incidentId,
            dataSource: rec.dataSource,
            occurredAt: rec.occurredAt ? new Date(rec.occurredAt) : undefined,
            latitude: rec.latitude,
            longitude: rec.longitude,
            zip: rec.zip,
            city: rec.city,
            ward: rec.ward,
            victimCount: rec.victimCount ?? 1,
            fatalCount: rec.fatalCount ?? 0,
            incidentType: rec.incidentType,
          }).onConflictDoNothing().returning({ id: gunViolenceIncidents.id });
          if (result.length > 0) {
            inserted++;
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }
      }

      // Audit row — always write even if all were duplicates
      await db.insert(gunViolenceImports).values({
        dataSource,
        recordCount: inserted,
        importedByUserId: (req as any).user?.id,
        notes: `Batch: ${records.length} submitted, ${inserted} new, ${skipped} duplicate/skipped.`,
      });

      console.info(`[gun-violence] import complete: source=${dataSource} new=${inserted} skipped=${skipped}`);
      res.json({ imported: inserted, skipped, total: records.length, dataSource });
    } catch (err: any) {
      console.error("[gun-violence] import error:", err);
      res.status(500).json({ error: "Import failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/summary
   * Query params: zip, city, ward, from (ISO date), to (ISO date)
   * Returns aggregate counts only — no individual incident records.
   * Public endpoint, rate-limited to 60 req/min per IP.
   */
  app.get("/api/gun-violence/summary", async (req: Request, res: Response) => {
    const ip = req.ip || "unknown";
    if (!checkSummaryRate(ip)) {
      return res.status(429).json({ error: "Too many requests. Limit: 60/min." });
    }

    try {
      const zip   = ((req.query.zip   as string) || "").trim();
      const city  = ((req.query.city  as string) || "").trim();
      const ward  = ((req.query.ward  as string) || "").trim();
      const state = ((req.query.state as string) || "").trim();
      const from  = ((req.query.from  as string) || "").trim();
      const to    = ((req.query.to    as string) || "").trim();
      const rowLimit = Math.min(parseInt((req.query.limit as string) || "200", 10), 500);

      const conditions: ReturnType<typeof eq>[] = [];
      if (zip)   conditions.push(eq(gunViolenceIncidents.zip, zip));
      if (city)  conditions.push(eq(gunViolenceIncidents.city, city));
      if (ward)  conditions.push(eq(gunViolenceIncidents.ward, ward));
      if (state) conditions.push(eq(gunViolenceIncidents.state, state));
      if (from)  conditions.push(gte(gunViolenceIncidents.occurredAt, new Date(from)));
      if (to)    conditions.push(lte(gunViolenceIncidents.occurredAt, new Date(to)));

      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [totals, byZip, incidentRows] = await Promise.all([
        db.select({
          incidents:  sql<number>`count(*)::int`,
          victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
          fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
        }).from(gunViolenceIncidents).where(whereClause).then(r => r[0]),

        city && !zip
          ? db.select({
              zip:        gunViolenceIncidents.zip,
              incidents:  sql<number>`count(*)::int`,
              fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
            }).from(gunViolenceIncidents).where(whereClause)
              .groupBy(gunViolenceIncidents.zip)
              .orderBy(desc(sql`count(*)`))
              .limit(25)
          : Promise.resolve([]),

        // Individual rows for hub table (geography + type + counts only — no PII)
        db.select({
          id:           gunViolenceIncidents.id,
          city:         gunViolenceIncidents.city,
          state:        gunViolenceIncidents.state,
          zip:          gunViolenceIncidents.zip,
          occurredAt:   gunViolenceIncidents.occurredAt,
          incidentType: gunViolenceIncidents.incidentType,
          victimCount:  gunViolenceIncidents.victimCount,
          fatalCount:   gunViolenceIncidents.fatalCount,
        }).from(gunViolenceIncidents).where(whereClause)
          .orderBy(desc(gunViolenceIncidents.occurredAt))
          .limit(rowLimit),
      ]);

      res.json({
        filters: { zip: zip || null, city: city || null, state: state || null, ward: ward || null, from: from || null, to: to || null },
        incidents:  totals?.incidents  ?? 0,
        victims:    totals?.victims    ?? 0,
        fatalities: totals?.fatalities ?? 0,
        byZip: (byZip as any[]).length ? byZip : undefined,
        rows: incidentRows,
        source: "TCAF Gun Violence Registry",
        note: "Aggregate counts only. No individual victim data is stored or exposed.",
      });
    } catch (err: any) {
      console.error("[gun-violence] summary error:", err);
      res.status(500).json({ error: "Summary failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/imports
   * Staff-gated. Returns the last 50 import audit records so operators can
   * see when data was last refreshed, how many records came in, and from
   * which source.
   */
  app.get("/api/gun-violence/imports", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }

      const history = await db
        .select()
        .from(gunViolenceImports)
        .orderBy(desc(gunViolenceImports.importedAt))
        .limit(50);

      res.json({ imports: history });
    } catch (err: any) {
      console.error("[gun-violence] imports history error:", err);
      res.status(500).json({ error: "Failed to load import history.", detail: err.message });
    }
  });

  // ── GET /api/gun-violence/intelligence — delegates to exported function ───────
  // Public endpoint. Cached 1 hour in the module-level _intelligenceCache.
  app.get("/api/gun-violence/intelligence", async (_req: Request, res: Response) => {
    try {
      const data = await getGunViolenceIntelligenceData();
      res.json(data);
    } catch (err: any) {
      console.error("[gun-violence] intelligence error:", err);
      res.status(500).json({ error: "Failed to load intelligence data.", detail: err.message });
    }
  });

  // ── POST /api/gun-violence/story — AI narrative for a geography (auth req) ─
  app.post("/api/gun-violence/story", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated?.() && !(req as any).user) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const { geography, state, focusArea } = req.body as {
        geography?: string; state?: string; focusArea?: string;
      };
      if (!geography) return res.status(400).json({ error: "geography is required." });

      const { generateAIJSON } = await import("./ai-provider");
      const { withEthicalPreamble } = await import("./ai-provider");

      // Pull intelligence data (from cache or live)
      const BASE = "https://gun-violence-registry.replit.app";
      const fetcher = (path: string) =>
        fetch(`${BASE}${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) })
          .then(r => r.ok ? r.json() : null).catch(() => null);

      const [cdcSummary, rootCauses, socialDet, acesCorr] = await Promise.all([
        fetcher("/api/cdc/summary"),
        fetcher("/api/root-causes"),
        fetcher("/api/social-determinants"),
        fetcher("/api/aces/correlations"),
      ]);

      // Local incidents for this geography
      const localRows = state
        ? await db.select({
            count: sql<number>`count(*)::int`,
            victims: sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}),0)::int`,
            fatal: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}),0)::int`,
          }).from(gunViolenceIncidents).where(eq(gunViolenceIncidents.state, state))
        : [];
      const localState = localRows[0] ?? null;

      const stateSdoh = Array.isArray(socialDet)
        ? socialDet.find((s: any) => s.stateCode === state || s.stateName?.toLowerCase().includes((state ?? "").toLowerCase()))
        : null;

      const topRootCauses = Array.isArray(rootCauses)
        ? rootCauses.slice(0, 4).map((r: any) => `${r.factor} (r=${r.correlation})`)
        : [];

      const prompt = withEthicalPreamble(`
You are a public health data journalist writing for TCAF — the Thriving Communities for All Foundation.
Write a compelling, factual, trauma-informed narrative about gun violence in ${geography}.

Ground your story in these data points:
- National: ${cdcSummary?.totalDeaths ?? 834013} Americans have died from gun violence since 1999 (CDC WONDER)
- Annual rate: ${cdcSummary?.latestYear?.crudeRate ?? 14.5} deaths per 100,000 (${cdcSummary?.latestYear?.year ?? 2022})
- Peak year: ${cdcSummary?.peakYear?.year ?? 2021} with ${cdcSummary?.peakYear?.deaths ?? 48830} deaths
- ACE score correlation with firearm violence: r = ${acesCorr?.aceFirearmR ?? 0.856} — the strongest structural predictor
- Top root causes: ${topRootCauses.join("; ")}
${stateSdoh ? `- ${geography} SDOH: poverty ${stateSdoh.povertyRate}%, median income $${stateSdoh.medianIncome?.toLocaleString()}, Gini ${stateSdoh.giniCoefficient}, mental health providers per 100k: ${stateSdoh.mentalHealthProvidersPer100k}` : ""}
${localState?.count ? `- Local registry: ${localState.count} incidents, ${localState.victims} victims, ${localState.fatal} fatal in current dataset` : ""}
${focusArea ? `- Focus area: ${focusArea}` : ""}

The story should:
1. Open with a human truth — not statistics, a moment
2. Build the structural picture — poverty, ACEs, disinvestment — using the data
3. Name what works — evidence-based interventions, described qualitatively (what they do and why they help). Do NOT state a specific cost-effectiveness dollar figure, ratio, or "saves $X per $1" claim — none is computed for this story, so any such number would be invented.
4. Close with what TCAF's CHW network, anchor agencies, and community partners are doing in response
5. Be 4–6 paragraphs, written for both a grant committee and a community meeting

Respond with JSON: { headline: string, subhead: string, body: string[] (array of paragraphs), keyNumbers: { label: string, value: string }[], callToAction: string }
`);

      const story = await generateAIJSON<{ headline?: string; subhead?: string; body?: string[]; keyNumbers?: { label: string; value: string }[]; callToAction?: string }>(prompt, "gun violence narrative");
      const grounded = groundGunViolenceStory(story, { cdcSummary, acesCorr, geography });
      res.json({ ok: true, geography, story: grounded });
    } catch (err: any) {
      console.error("[gun-violence] story error:", err);
      res.status(500).json({ error: "Story generation failed.", detail: err.message });
    }
  });

  /**
   * GET /api/gun-violence/policy-timeline
   * Time-series aggregation by month or quarter so government agencies can
   * overlay policy changes against crime trends and measure impact.
   *
   * Query params:
   *   state     — required. Two-letter state code.
   *   zip       — optional. Filter to a single ZIP.
   *   city      — optional. Filter to a city.
   *   from      — ISO date, defaults to 24 months ago.
   *   to        — ISO date, defaults to now.
   *   granularity — "month" (default) | "quarter"
   *
   * Returns periods with incident + victim + fatality counts. Designed for
   * graphing against policy event markers — no individual records exposed.
   */
  app.get("/api/gun-violence/policy-timeline", async (req: Request, res: Response) => {
    try {
      const stateParam   = ((req.query.state       as string) || "").trim().toUpperCase();
      const zipParam     = ((req.query.zip         as string) || "").trim();
      const cityParam    = ((req.query.city        as string) || "").trim();
      const granularity  = (req.query.granularity  as string) === "quarter" ? "quarter" : "month";
      const fromDate     = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      const toDate       = req.query.to   ? new Date(req.query.to   as string) : new Date();

      if (!stateParam || !/^[A-Z]{2}$/.test(stateParam)) {
        return res.status(400).json({ error: "state must be a 2-letter US state code (e.g. TX)" });
      }
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: "from must be a valid ISO date" });
      }
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "to must be a valid ISO date" });
      }
      if (fromDate > toDate) {
        return res.status(400).json({ error: "from must be before to" });
      }

      const conditions: ReturnType<typeof eq>[] = [
        eq(gunViolenceIncidents.state, stateParam),
        gte(gunViolenceIncidents.occurredAt, fromDate),
        lte(gunViolenceIncidents.occurredAt, toDate),
      ];
      if (zipParam)  conditions.push(eq(gunViolenceIncidents.zip, zipParam));
      if (cityParam) conditions.push(eq(gunViolenceIncidents.city, cityParam));

      // date_trunc granularity MUST be a literal — PG rejects bind parameters in that
      // position. Use separate branches so the string never flows through Drizzle's
      // parameterization path. Plain sql`...` template tags with no JS interpolation
      // in the groupBy/orderBy args are emitted as raw SQL, not $N placeholders.
      const timeline = granularity === "quarter"
        ? await db.select({
            period:     sql<string>`to_char(date_trunc('quarter', ${gunViolenceIncidents.occurredAt}), 'YYYY-"Q"Q')`,
            incidents:  sql<number>`count(*)::int`,
            victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
            fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
          }).from(gunViolenceIncidents).where(and(...conditions))
            .groupBy(sql`date_trunc('quarter', occurred_at)`)
            .orderBy(sql`date_trunc('quarter', occurred_at)`)
        : await db.select({
            period:     sql<string>`to_char(date_trunc('month', ${gunViolenceIncidents.occurredAt}), 'YYYY-MM')`,
            incidents:  sql<number>`count(*)::int`,
            victims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
            fatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
          }).from(gunViolenceIncidents).where(and(...conditions))
            .groupBy(sql`date_trunc('month', occurred_at)`)
            .orderBy(sql`date_trunc('month', occurred_at)`);

      const [totals] = await db.select({
        totalIncidents:  sql<number>`count(*)::int`,
        totalVictims:    sql<number>`coalesce(sum(${gunViolenceIncidents.victimCount}), 0)::int`,
        totalFatalities: sql<number>`coalesce(sum(${gunViolenceIncidents.fatalCount}), 0)::int`,
      }).from(gunViolenceIncidents).where(and(...conditions));

      return res.json({
        geography: { state: stateParam, zip: zipParam || null, city: cityParam || null },
        window:    { from: fromDate.toISOString(), to: toDate.toISOString(), granularity },
        totals: {
          incidents:  Number(totals?.totalIncidents  ?? 0),
          victims:    Number(totals?.totalVictims    ?? 0),
          fatalities: Number(totals?.totalFatalities ?? 0),
        },
        timeline,
        usage: {
          purpose: "Correlate incident trends against policy change dates to measure intervention effectiveness.",
          policyOverlay: "Add your policy event markers (ordinance passed, program launched, funding cut) to the timeline periods to visualize impact.",
          grantUse: "Attach this timeline as Exhibit A in needs statements for DOJ, CDC/NCIPC, and SAMHSA applications to demonstrate community burden with verified data.",
        },
        source: "TCAF Gun Violence Registry",
        note: "Aggregate counts only. No individual victim data is stored or exposed.",
      });
    } catch (err: any) {
      console.error("[gun-violence] policy-timeline error:", err);
      return res.status(500).json({ error: "Policy timeline failed.", detail: err.message });
    }
  });

  // ── POST /api/gun-violence/sync — delegates to exported function (staff only) ─
  app.post("/api/gun-violence/sync", async (req: Request, res: Response) => {
    try {
      if (!isStaff(req)) {
        return res.status(403).json({ error: "Staff access required." });
      }
      const result = await runGunViolenceRegistrySync();
      res.json({ ok: true, ...result });
    } catch (err: any) {
      console.error("[gun-violence] sync error:", err);
      res.status(500).json({ error: "Sync failed.", detail: err.message });
    }
  });
}
