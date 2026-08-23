import type { Express, Request, Response, NextFunction } from "express";
import { db, storage } from "./storage";
import { producerProfiles, producerDataConsents, producerDataSubmissions,
  insertProducerProfileSchema, insertProducerDataConsentSchema, insertProducerDataSubmissionSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes, timingSafeEqual } from "crypto";
import { generateAIJSON } from "./ai-provider";

function generateToken(len = 40): string {
  // The argument is retained for call compatibility; tokens are always 256-bit
  // capabilities rather than pseudo-random, guessable identifiers.
  void len;
  return `prod_${randomBytes(32).toString("base64url")}`;
}

// Farmworker ITI capabilities are session-scoped for 12 hours. Producer
// capabilities use the same server-enforced boundary even though legacy
// clients may still retain them locally longer.
const PRODUCER_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const INVALID_PRODUCER_TOKEN_ERROR = "Producer access token is invalid, revoked, or expired. Enroll again to receive a new token.";

function safeTokenMatch(a: string, b: string): boolean {
  try {
    const ba = Buffer.alloc(64, a); const bb = Buffer.alloc(64, b);
    return timingSafeEqual(ba, bb) && a === b;
  } catch { return false; }
}

function parseStrictBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function isExpired(enrolledAt: Date | null): boolean {
  return !enrolledAt || Date.now() - enrolledAt.getTime() >= PRODUCER_TOKEN_TTL_MS;
}

async function getActiveProducerProfile(token: unknown) {
  if (typeof token !== "string" || token.length === 0) return undefined;
  const [profile] = await db.select().from(producerProfiles).where(eq(producerProfiles.accessToken, token));
  return profile && !isExpired(profile.enrolledAt) ? profile : undefined;
}

type RateLimitBucket = { count: number; resetAt: number };
const publicRateLimitBuckets = new Map<string, RateLimitBucket>();

function limitPublicRoute(name: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = (req.ip || req.socket?.remoteAddress || "unknown").trim();
    const key = `${name}:${ip}`;
    const bucket = publicRateLimitBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      publicRateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: "Rate limit exceeded. Try again later.", retryAfterSec });
    }
    bucket.count += 1;
    next();
  };
}

export function registerFarmCooperativeRoutes(app: Express) {

  // Enroll a new producer (public, no auth — ITI pattern)
  app.post("/api/farm-cooperative/enroll", limitPublicRoute("enroll", 10, 60 * 60 * 1000), async (req, res) => {
    try {
      const body = insertProducerProfileSchema.parse({ ...req.body, accessToken: generateToken() });
      const [profile] = await db.insert(producerProfiles).values(body).returning();
      // Create default consents (all OFF — anti-extraction)
      await db.insert(producerDataConsents).values({ producerId: profile.id });
      res.json({ success: true, accessToken: profile.accessToken, producerId: profile.id,
        message: "Welcome to the ThriveUp Producer Data Cooperative. Your data stays yours — you control what's shared and with whom." });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get producer profile + consents by token
  app.get("/api/farm-cooperative/profile", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    const profile = await getActiveProducerProfile(token);
    if (!profile) return res.status(401).json({ error: INVALID_PRODUCER_TOKEN_ERROR });
    const [consents] = await db.select().from(producerDataConsents).where(eq(producerDataConsents.producerId, profile.id));
    const submissions = await db.select().from(producerDataSubmissions).where(eq(producerDataSubmissions.producerId, profile.id));
    const { accessToken: _, ...safeProfile } = profile;
    res.json({ profile: safeProfile, consents: consents || null, submissionCount: submissions.length, submissions: submissions.slice(0, 10) });
  });

  // Update consent settings
  app.patch("/api/farm-cooperative/consents", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    const profile = await getActiveProducerProfile(token);
    if (!profile) return res.status(401).json({ error: INVALID_PRODUCER_TOKEN_ERROR });
    const allowed = ["shareSoilData","shareYieldData","shareIncomeData","shareWithResearchers",
      "shareWithUsda","shareWithFunders","allowPublicNaming","interestedInStipend","interestedInCredentials"];
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Consent updates must be a JSON object with boolean values." });
    }
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
      if (!(key in req.body)) continue;
      const value = parseStrictBoolean(req.body[key]);
      if (value === undefined) return res.status(400).json({ error: `${key} must be a boolean.` });
      updates[key] = value;
    }
    const [updated] = await db.update(producerDataConsents).set({ ...updates, updatedAt: new Date() })
      .where(eq(producerDataConsents.producerId, profile.id)).returning();
    res.json({ success: true, consents: updated });
  });

  // Submit farm data (soil, yield, input costs)
  app.post("/api/farm-cooperative/submit-data", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    const profile = await getActiveProducerProfile(token);
    if (!profile) return res.status(401).json({ error: INVALID_PRODUCER_TOKEN_ERROR });
    try {
      const body = insertProducerDataSubmissionSchema.parse({ ...req.body, producerId: profile.id });
      const [submission] = await db.insert(producerDataSubmissions).values(body).returning();
      res.json({ success: true, submissionId: submission.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Cooperative aggregate stats (de-identified, consent-filtered)
  app.get("/api/farm-cooperative/aggregate", limitPublicRoute("aggregate", 30, 60 * 60 * 1000), async (req, res) => {
    const rawStateFips = req.query.stateFips;
    const rawCommodity = req.query.commodity;
    if (rawStateFips !== undefined && typeof rawStateFips !== "string") {
      return res.status(400).json({ error: "stateFips must be a single two-digit FIPS code." });
    }
    if (rawCommodity !== undefined && typeof rawCommodity !== "string") {
      return res.status(400).json({ error: "commodity must be a single string." });
    }
    const stateFips = rawStateFips;
    const commodity = rawCommodity;
    if (stateFips !== undefined && !/^\d{2}$/.test(stateFips)) {
      return res.status(400).json({ error: "stateFips must be a two-digit FIPS code." });
    }
    if (commodity !== undefined && (commodity.trim().length === 0 || commodity.length > 100)) {
      return res.status(400).json({ error: "commodity must be a non-empty string of at most 100 characters." });
    }
    const SUPPRESSION_FLOOR = 5;
    // Aggregate data is visible only when a producer explicitly chose research
    // sharing. The query returns no profiles, contacts, notes, or submissions.
    const allProfiles = await db.select().from(producerProfiles)
      .where(stateFips ? eq(producerProfiles.stateFips, stateFips) : undefined);
    const allConsents = await db.select().from(producerDataConsents);
    const consentByProducerId = new Map(allConsents.map((consent) => [consent.producerId, consent]));
    const consentedIds = new Set(allConsents.filter(c => c.shareWithResearchers).map(c => c.producerId));
    const enrolledIds = allProfiles.filter(p => consentedIds.has(p.id)).map(p => p.id);
    const disclosure = {
      source: "ThriveUp Producer Data Cooperative",
      dataStatus: "self_reported" as const,
      retrievedAt: new Date().toISOString(),
      minimumCellSize: SUPPRESSION_FLOOR,
      consentBasis: "Producer explicitly enabled research sharing.",
    };
    if (enrolledIds.length < SUPPRESSION_FLOOR) {
      return res.json({
        availability: "unavailable",
        stateFips,
        disclosure,
        reason: "Aggregate is unavailable because fewer than the minimum cell size consented to research sharing. This does not mean there is no need or no producer activity.",
      });
    }

    const submissions = await db.select().from(producerDataSubmissions);
    // Research permission alone does not authorize publication of a producer's
    // commodity or data category. Publish only the categories separately
    // consented to by each contributing producer; unrecognized types fail closed.
    const canPublishSubmission = (submission: typeof submissions[number]) => {
      const consent = consentByProducerId.get(submission.producerId);
      if (!consent?.shareWithResearchers) return false;
      if (submission.dataType === "yield") return consent.shareYieldData === true;
      if (submission.dataType === "soil") return consent.shareSoilData === true;
      if (submission.dataType === "input-cost") return consent.shareIncomeData === true;
      return false;
    };
    const filtered = submissions.filter(s => canPublishSubmission(s)
      && (!commodity || s.commodity?.toUpperCase() === commodity.toUpperCase()));
    // A global/state-level cell may clear the floor while a requested commodity
    // subgroup does not. The subgroup itself must clear suppression before any
    // count or metric is disclosed.
    const subgroupProducerIds = new Set(filtered.map(s => s.producerId));
    if (subgroupProducerIds.size < SUPPRESSION_FLOOR) {
      return res.json({
        availability: "unavailable",
        stateFips,
        commodity: commodity || undefined,
        disclosure,
        reason: "The requested aggregate subgroup is unavailable because fewer than the minimum cell size contributed data. This does not mean there is no need, activity, or production.",
      });
    }
    const yieldRows = filtered.filter((s) => s.dataType === "yield"
      && s.yieldPerAcre != null && consentByProducerId.get(s.producerId)?.shareYieldData);
    const soilRows = filtered.filter((s) => s.dataType === "soil"
      && s.soilPh != null && consentByProducerId.get(s.producerId)?.shareSoilData);
    const costRows = filtered.filter((s) => s.dataType === "input-cost"
      && s.totalInputCostPerAc != null && consentByProducerId.get(s.producerId)?.shareIncomeData);

    const safeAverage = (rows: typeof filtered, value: (row: typeof filtered[number]) => number | null | undefined) => {
      const producerCount = new Set(rows.map((row) => row.producerId)).size;
      const values = rows.map(value).filter((item): item is number => typeof item === "number" && Number.isFinite(item));
      return producerCount >= SUPPRESSION_FLOOR && values.length > 0
      ? { status: "available" as const, value: values.reduce((a, b) => a + b, 0) / values.length }
      : { status: "unavailable" as const, value: null };
    };

    res.json({
      availability: "available",
      producerCount: subgroupProducerIds.size,
      submissionCount: filtered.length,
      stateFips,
      averageYieldPerAc: safeAverage(yieldRows, row => row.yieldPerAcre),
      averageSoilPh: safeAverage(soilRows, row => row.soilPh),
      averageInputCostPerAc: safeAverage(costRows, row => row.totalInputCostPerAc),
      disclosure,
    });
  });

  // AI synthesis of a producer's data vault
  app.post("/api/farm-cooperative/ai-insights", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    const profile = await getActiveProducerProfile(token);
    if (!profile) return res.status(401).json({ error: INVALID_PRODUCER_TOKEN_ERROR });

    const submissions = await db.select().from(producerDataSubmissions).where(eq(producerDataSubmissions.producerId, profile.id));
    if (!submissions.length) return res.json({ insights: null, message: "Submit some farm data first to generate insights." });

    const summary = submissions.map(s =>
      `${s.dataType} (${s.cropYear || "?"}): commodity=${s.commodity || "?"}, yield=${s.yieldPerAcre || "?"} ${s.yieldUnit || ""}/ac, inputCost=$${s.totalInputCostPerAc || "?"}/ac, soilPH=${s.soilPh || "?"}, OM=${s.organicMatterPct || "?"}%`
    ).join("\n");

    const prompt = `You are an agricultural data advisor. A farmer has shared their private farm data with the ThriveUp Producer Data Cooperative. Analyze their submissions and provide actionable insights.

Farm profile: ${profile.farmName || "unnamed farm"}, ${profile.farmType} operation, ${profile.totalAcres || "?"} acres, primary commodity: ${profile.primaryCommodity || "?"}, ${profile.countyName}

Data submissions:
${summary}

Provide 3-4 specific, actionable insights in plain language covering: (1) profitability patterns vs. USDA averages, (2) soil health improvements worth prioritizing, (3) USDA FSA or NRCS programs this farm likely qualifies for, (4) market access or input cost reduction opportunities. Be specific to the numbers provided. Never fabricate data not in the submission. Return as JSON: { insights: string[] }`;

    try {
      const result = await generateAIJSON(prompt, '{"insights":[]}');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "AI synthesis failed", detail: err.message });
    }
  });

  // Rotate to an undisclosed cryptographic capability rather than deleting
  // the producer profile or private submissions. The old token is invalidated
  // atomically by the equality condition and the replacement is never sent.
  app.post("/api/farm-cooperative/revoke", async (req, res) => {
    const token = req.headers["x-producer-token"] as string;
    const profile = await getActiveProducerProfile(token);
    if (!profile) return res.status(401).json({ error: INVALID_PRODUCER_TOKEN_ERROR });
    const [revoked] = await db.update(producerProfiles)
      .set({ accessToken: generateToken(), updatedAt: new Date() })
      .where(eq(producerProfiles.accessToken, token))
      .returning({ id: producerProfiles.id });
    if (!revoked) return res.status(401).json({ error: INVALID_PRODUCER_TOKEN_ERROR });
    res.json({ success: true });
  });

  // Admin: list all producers — staff role required (DB-resolved, not just any
  // authenticated account). Keep in lockstep with server/reentry-routes.ts STAFF_ROLES.
  const STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);
  function getUserId(req: Request): string | undefined {
    const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
    return u?.claims?.sub || u?.id;
  }
  app.get("/api/farm-cooperative/admin/producers", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: "Auth required" });
    const userId = getUserId(req);
    const user = userId ? await storage.getUser(userId) : undefined;
    if (!user || !STAFF_ROLES.has(user.role)) return res.status(403).json({ error: "Staff access required" });
    const profiles = await db.select({
      id: producerProfiles.id, farmName: producerProfiles.farmName,
      farmType: producerProfiles.farmType, countyName: producerProfiles.countyName,
      stateFips: producerProfiles.stateFips, workerType: producerProfiles.workerType,
      enrolledAt: producerProfiles.enrolledAt,
    }).from(producerProfiles);
    const consentsAll = await db.select().from(producerDataConsents);
    const submissionsAll = await db.select().from(producerDataSubmissions);
    res.json({
      totalProducers: profiles.length,
      producers: profiles.map(p => ({
        ...p,
        submissionCount: submissionsAll.filter(s => s.producerId === p.id).length,
        consentsCount: consentsAll.filter(c => c.producerId === p.id).length,
      })),
    });
  });
}
