/**
 * ThriveUp Trade Sims — backend routes.
 *
 * Phase A (foundation):
 *   GET  /api/trade-sims/trades                            list active trades
 *   GET  /api/trade-sims/lessons/:tradeSlug                lessons for a trade
 *   GET  /api/trade-sims/lessons/:tradeSlug/:lessonSlug    single lesson
 *   POST /api/trade-sims/progress                          upsert progress (auth or anon)
 *   GET  /api/trade-sims/progress/:tradeSlug               caller's progress for a trade
 *   POST /api/trade-sims/sandbox-projects                  save sandbox project
 *   GET  /api/trade-sims/sandbox-projects                  list caller's sandbox projects
 *   POST /api/trade-sims/ai-tutor/hint                     rate-limited hint (stub until T008)
 *   POST /api/trade-sims/admin/seed-electrical             admin: seed the 15 electrical lessons
 *
 * Open access: most endpoints accept either an authenticated user OR an
 * anonymous session id provided via the `x-anon-session` header. Anonymous
 * sessions are client-generated (UUID stored in localStorage). They are NOT
 * security tokens — they only scope progress to the current browser.
 *
 * Rate-limiting follows the foster-youth-intake pattern: per-IP + global
 * per-process bucket. Privileged users skip the limiter.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  tradeSimsTrades,
  tradeSimsLessons,
  tradeSimsLessonProgress,
  tradeSimsSandboxProjects,
  tradeSimsAiTutorSessions,
  insertTradeSimsLessonProgressSchema,
  insertTradeSimsSandboxProjectSchema,
} from "@shared/schema";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  ELECTRICAL_LESSONS,
  ELECTRICAL_TRADE_META,
} from "../shared/data/trade-sims/electrical-lessons";

// ---------- auth helpers (mirror foster-youth pattern) ----------

function getUser(req: Request) {
  const u = (req as unknown as Record<string, unknown>).user as
    | { claims?: { sub?: string; email?: string }; id?: string; role?: string }
    | undefined;
  return u;
}
function getUserId(req: Request): string | undefined {
  const u = getUser(req);
  return u?.claims?.sub || u?.id;
}
function isPrivileged(req: Request): boolean {
  const u = getUser(req);
  return !!u && (u.role === "admin" || u.role === "teacher" || u.role === "case_manager");
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!getUser(req)) return res.status(401).json({ error: "Unauthorized" });
  if (isPrivileged(req)) return next();
  return res.status(403).json({ error: "Admin access required" });
}

/** Anonymous session id — opt-in scoping, not security. */
function getAnonSessionId(req: Request): string | undefined {
  const raw = req.header("x-anon-session");
  if (!raw) return undefined;
  // Constrain to a sane shape so it can't be used as a SQL/log injection vector.
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(raw)) return undefined;
  return raw;
}

/** Returns the caller identity for progress scoping: either userId or anonSessionId. */
function getCallerScope(req: Request): { userId?: string; anonSessionId?: string } | null {
  const userId = getUserId(req);
  if (userId) return { userId };
  const anon = getAnonSessionId(req);
  if (anon) return { anonSessionId: anon };
  return null;
}

// ---------- rate limiter ----------

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const GLOBAL_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "ai-tutor": { max: 400, windowMs: 60 * 60 * 1000 },
  progress: { max: 5000, windowMs: 60 * 60 * 1000 },
  "sandbox-save": { max: 600, windowMs: 60 * 60 * 1000 },
};

function consume(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (b.count >= max) return { allowed: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  b.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function rateLimit(name: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isPrivileged(req)) return next();
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const ipResult = consume(`ip:${name}:${ip}`, max, windowMs);
    if (!ipResult.allowed) {
      res.setHeader("Retry-After", String(ipResult.retryAfterSec));
      return res.status(429).json({ error: `Rate limit exceeded for ${name}. Try again in ${ipResult.retryAfterSec}s.` });
    }
    const g = GLOBAL_LIMITS[name];
    if (g) {
      const gResult = consume(`global:${name}`, g.max, g.windowMs);
      if (!gResult.allowed) {
        res.setHeader("Retry-After", String(gResult.retryAfterSec));
        return res.status(429).json({ error: `Service is temporarily limiting ${name}. Try again in ${gResult.retryAfterSec}s.` });
      }
    }
    return next();
  };
}

// ---------- route registration ----------

export function registerTradeSimsRoutes(app: Express) {
  // List all active trades.
  app.get("/api/trade-sims/trades", async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(tradeSimsTrades)
        .where(eq(tradeSimsTrades.active, true))
        .orderBy(asc(tradeSimsTrades.displayOrder));
      res.json(rows);
    } catch (err) {
      console.error("[TradeSims] list trades failed:", err);
      res.status(500).json({ error: "Failed to load trades." });
    }
  });

  // List all lessons for a trade (by slug).
  app.get("/api/trade-sims/lessons/:tradeSlug", async (req, res) => {
    try {
      const tradeSlug = String(req.params.tradeSlug);
      const [trade] = await db
        .select()
        .from(tradeSimsTrades)
        .where(eq(tradeSimsTrades.slug, tradeSlug))
        .limit(1);
      if (!trade) return res.status(404).json({ error: "Trade not found." });

      const lessons = await db
        .select()
        .from(tradeSimsLessons)
        .where(and(eq(tradeSimsLessons.tradeId, trade.id), eq(tradeSimsLessons.active, true)))
        .orderBy(asc(tradeSimsLessons.dayNumber));
      res.json({ trade, lessons });
    } catch (err) {
      console.error("[TradeSims] list lessons failed:", err);
      res.status(500).json({ error: "Failed to load lessons." });
    }
  });

  // Single lesson by trade slug + lesson slug.
  app.get("/api/trade-sims/lessons/:tradeSlug/:lessonSlug", async (req, res) => {
    try {
      const tradeSlug = String(req.params.tradeSlug);
      const lessonSlug = String(req.params.lessonSlug);
      const [trade] = await db
        .select()
        .from(tradeSimsTrades)
        .where(eq(tradeSimsTrades.slug, tradeSlug))
        .limit(1);
      if (!trade) return res.status(404).json({ error: "Trade not found." });

      const [lesson] = await db
        .select()
        .from(tradeSimsLessons)
        .where(and(eq(tradeSimsLessons.tradeId, trade.id), eq(tradeSimsLessons.slug, lessonSlug)))
        .limit(1);
      if (!lesson) return res.status(404).json({ error: "Lesson not found." });
      res.json({ trade, lesson });
    } catch (err) {
      console.error("[TradeSims] get lesson failed:", err);
      res.status(500).json({ error: "Failed to load lesson." });
    }
  });

  // Upsert progress for a lesson. Caller is either authenticated (userId) or
  // anonymous (x-anon-session header). Anonymous scoping is for convenience only,
  // not a security boundary.
  app.post("/api/trade-sims/progress", rateLimit("progress", 200, 60 * 60 * 1000), async (req, res) => {
    try {
      const scope = getCallerScope(req);
      if (!scope) return res.status(400).json({ error: "Missing caller scope. Provide login or x-anon-session header." });

      const bodySchema = insertTradeSimsLessonProgressSchema
        .omit({ userId: true, anonSessionId: true })
        .extend({ lessonId: z.number().int().positive() });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid progress payload", details: parsed.error.format() });

      const payload = parsed.data;

      // Pre-validate lesson existence so a stale id returns 400, not a DB FK 500.
      const [lessonExists] = await db
        .select({ id: tradeSimsLessons.id })
        .from(tradeSimsLessons)
        .where(eq(tradeSimsLessons.id, payload.lessonId))
        .limit(1);
      if (!lessonExists) return res.status(400).json({ error: "Unknown lessonId." });

      // Look up existing row by (scope, lessonId).
      const scopeFilter = scope.userId
        ? eq(tradeSimsLessonProgress.userId, scope.userId)
        : eq(tradeSimsLessonProgress.anonSessionId, scope.anonSessionId!);
      const [existing] = await db
        .select()
        .from(tradeSimsLessonProgress)
        .where(and(scopeFilter, eq(tradeSimsLessonProgress.lessonId, payload.lessonId)))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(tradeSimsLessonProgress)
          .set({
            ...payload,
            attemptCount: (existing.attemptCount ?? 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(tradeSimsLessonProgress.id, existing.id))
          .returning();
        return res.json(updated);
      }

      const [inserted] = await db
        .insert(tradeSimsLessonProgress)
        .values({
          ...payload,
          userId: scope.userId ?? null,
          anonSessionId: scope.anonSessionId ?? null,
          attemptCount: 1,
        })
        .returning();
      res.json(inserted);
    } catch (err) {
      console.error("[TradeSims] upsert progress failed:", err);
      res.status(500).json({ error: "Failed to save progress." });
    }
  });

  // Caller's progress across an entire trade.
  app.get("/api/trade-sims/progress/:tradeSlug", async (req, res) => {
    try {
      const scope = getCallerScope(req);
      if (!scope) return res.json([]); // anon w/ no scope = empty

      const tradeSlug = String(req.params.tradeSlug);
      const [trade] = await db
        .select()
        .from(tradeSimsTrades)
        .where(eq(tradeSimsTrades.slug, tradeSlug))
        .limit(1);
      if (!trade) return res.status(404).json({ error: "Trade not found." });

      const lessons = await db
        .select({ id: tradeSimsLessons.id })
        .from(tradeSimsLessons)
        .where(eq(tradeSimsLessons.tradeId, trade.id));
      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return res.json([]);

      const scopeFilter = scope.userId
        ? eq(tradeSimsLessonProgress.userId, scope.userId)
        : eq(tradeSimsLessonProgress.anonSessionId, scope.anonSessionId!);
      const rows = await db
        .select()
        .from(tradeSimsLessonProgress)
        .where(scopeFilter);
      const filtered = rows.filter((r) => lessonIds.includes(r.lessonId));
      res.json(filtered);
    } catch (err) {
      console.error("[TradeSims] get progress failed:", err);
      res.status(500).json({ error: "Failed to load progress." });
    }
  });

  // Save a sandbox project. Caller must have a scope.
  app.post(
    "/api/trade-sims/sandbox-projects",
    rateLimit("sandbox-save", 60, 60 * 60 * 1000),
    async (req, res) => {
      try {
        const scope = getCallerScope(req);
        if (!scope) return res.status(400).json({ error: "Missing caller scope. Provide login or x-anon-session header." });

        const bodySchema = insertTradeSimsSandboxProjectSchema
          .omit({ userId: true, anonSessionId: true })
          .extend({
            tradeId: z.number().int().positive(),
            name: z.string().min(1).max(200),
          });
        const parsed = bodySchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: "Invalid project payload", details: parsed.error.format() });

        // Cap canvasState payload to keep storage / replay cost bounded.
        const MAX_CANVAS_BYTES = 64 * 1024; // 64 KB; ~hundreds of components worth
        const canvasBytes = Buffer.byteLength(JSON.stringify(parsed.data.canvasState ?? null), "utf8");
        if (canvasBytes > MAX_CANVAS_BYTES) {
          return res.status(413).json({ error: `canvasState too large (${canvasBytes} bytes; max ${MAX_CANVAS_BYTES}).` });
        }

        // Pre-validate trade existence — same defensive pattern as /progress.
        const [tradeExists] = await db
          .select({ id: tradeSimsTrades.id })
          .from(tradeSimsTrades)
          .where(eq(tradeSimsTrades.id, parsed.data.tradeId))
          .limit(1);
        if (!tradeExists) return res.status(400).json({ error: "Unknown tradeId." });

        const [inserted] = await db
          .insert(tradeSimsSandboxProjects)
          .values({
            ...parsed.data,
            userId: scope.userId ?? null,
            anonSessionId: scope.anonSessionId ?? null,
          })
          .returning();
        res.json(inserted);
      } catch (err) {
        console.error("[TradeSims] save sandbox failed:", err);
        res.status(500).json({ error: "Failed to save project." });
      }
    },
  );

  // List the caller's sandbox projects.
  app.get("/api/trade-sims/sandbox-projects", async (req, res) => {
    try {
      const scope = getCallerScope(req);
      if (!scope) return res.json([]);
      const scopeFilter = scope.userId
        ? eq(tradeSimsSandboxProjects.userId, scope.userId)
        : eq(tradeSimsSandboxProjects.anonSessionId, scope.anonSessionId!);
      const rows = await db
        .select()
        .from(tradeSimsSandboxProjects)
        .where(scopeFilter)
        .orderBy(desc(tradeSimsSandboxProjects.updatedAt));
      res.json(rows);
    } catch (err) {
      console.error("[TradeSims] list sandbox failed:", err);
      res.status(500).json({ error: "Failed to list projects." });
    }
  });

  // AI tutor hint — Phase A stub. Returns a canned, lesson-aware response and
  // logs the request so we can replace the body in T008 with the 4-engine call.
  app.post("/api/trade-sims/ai-tutor/hint", rateLimit("ai-tutor", 30, 60 * 60 * 1000), async (req, res) => {
    try {
      const bodySchema = z.object({
        lessonId: z.number().int().positive().optional(),
        mode: z.enum(["hint", "debrief", "sandbox_help"]).default("hint"),
        canvasState: z.unknown().optional(),
        question: z.string().max(2000).optional(),
        language: z.string().max(8).default("en"),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid hint payload", details: parsed.error.format() });
      const { lessonId, mode, language } = parsed.data;

      // Cap canvasState payload (same cap as sandbox-save).
      const MAX_CANVAS_BYTES = 64 * 1024;
      if (parsed.data.canvasState !== undefined) {
        const bytes = Buffer.byteLength(JSON.stringify(parsed.data.canvasState ?? null), "utf8");
        if (bytes > MAX_CANVAS_BYTES) {
          return res.status(413).json({ error: `canvasState too large (${bytes} bytes; max ${MAX_CANVAS_BYTES}).` });
        }
      }

      // Phase A canned response. Real 4-engine call lands in T008.
      const stubResponses: Record<string, string> = {
        hint: "Look at the loop you've drawn. Is current able to flow from the + terminal all the way back to − without an interruption? If a switch is open or a wire is missing, current can't flow and your readings will all be zero.",
        debrief:
          "Nice work on this lesson. The big idea: V = I × R. Every electrician keeps that triangle in their head. Next up — try the parallel-circuit variant in the sandbox to feel how current splits across paths.",
        sandbox_help:
          "Free-build mode. If the simulator says a node is floating, make sure every component terminal is wired into the circuit. If you get a singular-matrix error, you may have a short circuit — two nodes that should be different are being forced equal.",
      };
      const responseText = stubResponses[mode];

      const scope = getCallerScope(req);

      // Validate the lessonId exists before insert; FK will reject a stale id and
      // we'd rather log the tutor call with null than fail the user-visible request.
      let resolvedLessonId: number | null = null;
      if (typeof lessonId === "number") {
        const [exists] = await db
          .select({ id: tradeSimsLessons.id })
          .from(tradeSimsLessons)
          .where(eq(tradeSimsLessons.id, lessonId))
          .limit(1);
        if (exists) resolvedLessonId = exists.id;
      }

      await db.insert(tradeSimsAiTutorSessions).values({
        userId: scope?.userId ?? null,
        anonSessionId: scope?.anonSessionId ?? null,
        lessonId: resolvedLessonId,
        mode,
        promptContext: parsed.data as Record<string, unknown>,
        responseText,
        modelUsed: "stub-phase-a",
        language,
      });

      // Expose the resolved lesson id so the client can tell whether the
      // server actually attributed this session to the requested lesson.
      // Prevents silent attribution loss when lessonId is stale.
      const lessonIdWarning =
        typeof lessonId === "number" && resolvedLessonId === null
          ? `Unknown lessonId ${lessonId}; tutor session logged without attribution.`
          : undefined;
      res.json({
        response: responseText,
        modelUsed: "stub-phase-a",
        resolvedLessonId,
        ...(lessonIdWarning ? { warning: lessonIdWarning } : {}),
      });
    } catch (err) {
      console.error("[TradeSims] ai-tutor hint failed:", err);
      res.status(500).json({ error: "AI tutor unavailable." });
    }
  });

  // Admin: seed the Electrical trade + 15 lessons from shared data.
  // Idempotent — upserts by slug.
  app.post("/api/trade-sims/admin/seed-electrical", requireAdmin, async (_req, res) => {
    try {
      const [existing] = await db
        .select()
        .from(tradeSimsTrades)
        .where(eq(tradeSimsTrades.slug, ELECTRICAL_TRADE_META.slug))
        .limit(1);

      let tradeId: number;
      if (existing) {
        const [updated] = await db
          .update(tradeSimsTrades)
          .set({
            name: ELECTRICAL_TRADE_META.name,
            tagline: ELECTRICAL_TRADE_META.tagline,
            description: ELECTRICAL_TRADE_META.description,
            iconKey: ELECTRICAL_TRADE_META.iconKey,
            displayOrder: ELECTRICAL_TRADE_META.displayOrder,
            active: true,
          })
          .where(eq(tradeSimsTrades.id, existing.id))
          .returning();
        tradeId = updated.id;
      } else {
        const [inserted] = await db
          .insert(tradeSimsTrades)
          .values({
            slug: ELECTRICAL_TRADE_META.slug,
            name: ELECTRICAL_TRADE_META.name,
            tagline: ELECTRICAL_TRADE_META.tagline,
            description: ELECTRICAL_TRADE_META.description,
            iconKey: ELECTRICAL_TRADE_META.iconKey,
            displayOrder: ELECTRICAL_TRADE_META.displayOrder,
            active: true,
          })
          .returning();
        tradeId = inserted.id;
      }

      let upserted = 0;
      for (const lesson of ELECTRICAL_LESSONS) {
        const [existingLesson] = await db
          .select()
          .from(tradeSimsLessons)
          .where(and(eq(tradeSimsLessons.tradeId, tradeId), eq(tradeSimsLessons.slug, lesson.slug)))
          .limit(1);
        const values = {
          tradeId,
          dayNumber: lesson.dayNumber,
          slug: lesson.slug,
          title: lesson.title,
          shortDescription: lesson.shortDescription,
          concept: lesson.concept as unknown,
          guidedSteps: lesson.guidedSteps as unknown,
          soloChallenge: lesson.soloChallenge as unknown,
          sandboxStarter: lesson.sandboxStarter as unknown,
          credentialPathway: lesson.credentialPathway,
          active: true,
        };
        if (existingLesson) {
          await db.update(tradeSimsLessons).set(values).where(eq(tradeSimsLessons.id, existingLesson.id));
        } else {
          await db.insert(tradeSimsLessons).values(values);
        }
        upserted += 1;
      }

      res.json({ ok: true, tradeId, lessonsUpserted: upserted });
    } catch (err) {
      console.error("[TradeSims] seed failed:", err);
      res.status(500).json({ error: "Seed failed." });
    }
  });
}
