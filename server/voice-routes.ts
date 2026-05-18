// Community Voice routes — Open Point / Social Point analog.
// Map-pin community input collection with capability-token pattern (P-L08),
// crisis-detection on every utterance, optional silent route to WPH/LifeBridge,
// per-IP rate limiting on public endpoints.

import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  communityVoiceProjects,
  communityVoicePins,
  communityVoiceReactions,
  communityVoiceComments,
  insertCommunityVoiceProjectSchema,
  type CommunityVoicePin,
  type CommunityVoiceProject,
} from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID, randomBytes, timingSafeEqual, createHash } from "crypto";
import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Auth helpers (same shape as foster-youth-intake-routes)
// ────────────────────────────────────────────────────────────────────────────
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
function isAdminish(req: Request): boolean {
  const u = getUser(req);
  return !!u && (u.role === "admin" || u.role === "case_manager" || u.role === "staff");
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!getUser(req)) return res.status(401).json({ error: "Unauthorized" });
  if (!isAdminish(req)) return res.status(403).json({ error: "Forbidden" });
  return next();
}

function tokensMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function ipHashOf(req: Request): string {
  // SECURITY: never trust raw `x-forwarded-for` here — trust proxy is not configured
  // app-wide, so a client-supplied XFF header would let attackers rotate fake IPs and
  // bypass rate limits + reaction dedupe. Use only the trusted socket peer address.
  const raw = req.socket.remoteAddress || "0.0.0.0";
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

// ────────────────────────────────────────────────────────────────────────────
// Per-IP rate limiter (in-memory; resets on restart — fine for Phase 1)
// ────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────
// Crisis detection (lightweight regex pass — same intent as TYT crisis layer).
// Returns true if any high-risk pattern matches.
// ────────────────────────────────────────────────────────────────────────────
const CRISIS_PATTERNS = [
  /\b(kill|hurt|harm)\s*(my\s*self|myself)\b/i,
  /\bsuicid/i,
  /\bend\s*(my|the)\s*(life|pain)\b/i,
  /\bnot\s*safe\b/i,
  /\bbeing\s*(beaten|abused|assault)/i,
  /\bdomestic\s*violence\b/i,
  /\bno\s*where\s*to\s*go\b/i,
  /\bhomeless\s*tonight\b/i,
  /\bno\s*food\s*for\s*(my\s*kids|the\s*kids|us)\b/i,
  /\boverdos/i,
];
function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((rx) => rx.test(text));
}

// Lightweight rule-based sentiment (positive/negative/neutral); upgrade to AI later.
function detectSentiment(text: string): "positive" | "negative" | "neutral" | "mixed" {
  const pos = (text.match(/\b(love|great|good|amazing|helpful|grateful|thank|happy|safe|proud)\b/gi) || []).length;
  const neg = (text.match(/\b(hate|bad|terrible|awful|broken|dangerous|unsafe|scared|afraid|angry|sad|need|missing|lack)\b/gi) || []).length;
  if (pos > 0 && neg > 0) return "mixed";
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

// ────────────────────────────────────────────────────────────────────────────
// Validators
// ────────────────────────────────────────────────────────────────────────────
const pinCreateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.string().min(1).max(48),
  body: z.string().min(3).max(2000),
  originalLanguage: z.string().min(2).max(8).optional().default("en"),
  authorType: z.enum(["resident", "partner", "participant", "staff"]).optional().default("resident"),
  authorEmail: z.string().email().max(256).optional().nullable(),
  authorName: z.string().max(128).optional().nullable(),
  anonymized: z.boolean().optional().default(true),
  photoUrls: z.array(z.string().url()).max(8).optional(),
});

const reactionSchema = z.object({
  reactionType: z.enum(["up", "heart", "idea", "concern"]),
});

const commentCreateSchema = z.object({
  body: z.string().min(2).max(1500),
  authorType: z.enum(["resident", "partner", "participant", "staff"]).optional().default("resident"),
  authorName: z.string().max(128).optional().nullable(),
  anonymized: z.boolean().optional().default(true),
});

// Strip server-controlled fields from pin responses for public callers.
function publicizePin(pin: CommunityVoicePin) {
  const { accessToken: _t, ipHash: _i, authorEmail: _e, ...safe } = pin as CommunityVoicePin & { accessToken?: string; ipHash?: string };
  return safe;
}

// Look up a project by slug; throws 404 to caller.
async function getProjectBySlug(slug: string): Promise<CommunityVoiceProject | null> {
  const [row] = await db.select().from(communityVoiceProjects).where(eq(communityVoiceProjects.slug, slug)).limit(1);
  return row ?? null;
}

// Capability-token authorization for pin-owner-only operations (edit/delete own pin).
async function authorizePin(req: Request, pinId: string): Promise<{ pin: CommunityVoicePin } | null> {
  const [pin] = await db.select().from(communityVoicePins).where(eq(communityVoicePins.id, pinId)).limit(1);
  if (!pin) return null;
  // SECURITY: header only — query-string tokens leak through logs/referrers/browser history.
  const presented = (req.header("x-voice-token") || "").trim();
  if (tokensMatch(pin.accessToken, presented)) return { pin };
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
export function registerVoiceRoutes(app: Express) {
  // List public projects
  app.get("/api/voice/projects", async (_req, res) => {
    try {
      const rows = await db
        .select()
        .from(communityVoiceProjects)
        .where(and(eq(communityVoiceProjects.publiclyVisible, true), eq(communityVoiceProjects.status, "active")))
        .orderBy(desc(communityVoiceProjects.createdAt));
      res.json({ projects: rows });
    } catch (err) {
      console.error("[voice] list projects failed:", err);
      res.status(500).json({ error: "Failed to load projects" });
    }
  });

  // Get a single project by slug
  app.get("/api/voice/projects/:slug", async (req, res) => {
    try {
      const project = await getProjectBySlug(String(req.params.slug));
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (!project.publiclyVisible && !getUserId(req)) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ project });
    } catch (err) {
      console.error("[voice] get project failed:", err);
      res.status(500).json({ error: "Failed to load project" });
    }
  });

  // List pins for a project (public; only published)
  app.get("/api/voice/projects/:slug/pins", async (req, res) => {
    try {
      const project = await getProjectBySlug(String(req.params.slug));
      if (!project) return res.status(404).json({ error: "Project not found" });
      // Mirror the hidden-project guard from /projects/:slug — non-public projects must not
      // expose their pins to anonymous callers even if the slug is known.
      if (!project.publiclyVisible && !getUserId(req)) {
        return res.status(404).json({ error: "Project not found" });
      }
      const pins = await db
        .select()
        .from(communityVoicePins)
        .where(and(eq(communityVoicePins.projectId, project.id), eq(communityVoicePins.status, "published")))
        .orderBy(desc(communityVoicePins.createdAt))
        .limit(500);
      res.json({ pins: pins.map(publicizePin) });
    } catch (err) {
      console.error("[voice] list pins failed:", err);
      res.status(500).json({ error: "Failed to load pins" });
    }
  });

  // Create pin — rate-limited, capability-token returned ONCE for later edit/delete.
  app.post(
    "/api/voice/projects/:slug/pins",
    rateLimit({ keyPrefix: "voice-pin", max: 8, windowMs: 5 * 60_000 }),
    async (req, res) => {
      try {
        const project = await getProjectBySlug(String(req.params.slug));
        if (!project) return res.status(404).json({ error: "Project not found" });
        if (project.status !== "active") return res.status(403).json({ error: "Project not accepting input" });

        // Access-mode gating
        if (project.accessMode === "email" || project.accessMode === "hybrid") {
          // For Phase 1: hybrid still requires authorEmail on pin create; email mode requires same.
          const candidateEmail = (req.body && typeof req.body.authorEmail === "string") ? req.body.authorEmail.trim() : "";
          if (!candidateEmail) {
            return res.status(401).json({ error: "This project requires an email address to drop a pin." });
          }
        }

        const parsed = pinCreateSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid pin payload", details: parsed.error.flatten() });
        }
        const data = parsed.data;

        const accessToken = randomBytes(24).toString("base64url");
        const id = randomUUID();
        const crisisFlag = project.crisisRoutingEnabled && detectCrisis(data.body);
        const sentiment = detectSentiment(data.body);

        const [row] = await db
          .insert(communityVoicePins)
          .values({
            id,
            projectId: project.id,
            accessToken,
            lat: data.lat,
            lng: data.lng,
            category: data.category,
            body: data.body,
            originalLanguage: data.originalLanguage ?? "en",
            authorType: data.authorType ?? "resident",
            authorEmail: data.authorEmail ?? null,
            authorName: data.authorName ?? null,
            anonymized: data.anonymized ?? true,
            photoUrls: data.photoUrls ?? null,
            sentiment,
            crisisFlag,
            crisisRoutedTo: crisisFlag ? "wph+lifebridge" : null,
            status: "published",
            ipHash: ipHashOf(req),
          } as typeof communityVoicePins.$inferInsert)
          .returning();

        // Crisis routing side-effect — log a row in voice_comments-like trail so audit shows the routing happened.
        if (crisisFlag) {
          console.warn(`[voice][CRISIS] project=${project.slug} pin=${row.id} routed=wph+lifebridge`);
          // Phase 2: actual outbound call to WPH/LifeBridge intake endpoint.
        }

        const safe = publicizePin(row);
        return res.json({ pin: safe, accessToken, crisisRouted: crisisFlag });
      } catch (err) {
        console.error("[voice] create pin failed:", err);
        return res.status(500).json({ error: "Failed to create pin" });
      }
    }
  );

  // Update own pin (token-gated)
  app.patch("/api/voice/pins/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      const auth = await authorizePin(req, id);
      if (!auth) return res.status(403).json({ error: "Invalid or missing token" });

      const allowed = ["body", "category", "anonymized", "authorName"];
      const patch: Record<string, unknown> = {};
      for (const k of allowed) {
        if (k in (req.body ?? {})) patch[k] = (req.body as Record<string, unknown>)[k];
      }
      if (!Object.keys(patch).length) return res.json({ pin: publicizePin(auth.pin) });

      if (typeof patch.body === "string") {
        patch.crisisFlag = detectCrisis(patch.body);
        patch.sentiment = detectSentiment(patch.body);
      }
      (patch as { updatedAt: Date }).updatedAt = new Date();

      const [row] = await db
        .update(communityVoicePins)
        .set(patch as Partial<typeof communityVoicePins.$inferInsert>)
        .where(eq(communityVoicePins.id, id))
        .returning();
      res.json({ pin: publicizePin(row) });
    } catch (err) {
      console.error("[voice] update pin failed:", err);
      res.status(500).json({ error: "Failed to update pin" });
    }
  });

  // Delete own pin (token-gated; soft-archive)
  app.delete("/api/voice/pins/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      const auth = await authorizePin(req, id);
      if (!auth) return res.status(403).json({ error: "Invalid or missing token" });
      await db
        .update(communityVoicePins)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(communityVoicePins.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error("[voice] delete pin failed:", err);
      res.status(500).json({ error: "Failed to archive pin" });
    }
  });

  // Reactions — anonymous-but-deduped per (pin, ipHash, reactionType)
  app.post(
    "/api/voice/pins/:id/reactions",
    rateLimit({ keyPrefix: "voice-react", max: 40, windowMs: 60_000 }),
    async (req, res) => {
      try {
        const id = String(req.params.id);
        const parsed = reactionSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: "Invalid reaction" });
        const [pin] = await db.select().from(communityVoicePins).where(eq(communityVoicePins.id, id)).limit(1);
        if (!pin) return res.status(404).json({ error: "Pin not found" });
        const authorHash = ipHashOf(req);
        let inserted = false;
        try {
          await db.insert(communityVoiceReactions).values({
            pinId: id,
            reactionType: parsed.data.reactionType,
            authorHash,
          });
          inserted = true;
        } catch (insertErr) {
          // Explicitly distinguish unique-index violation (idempotent re-react) from real errors.
          // Postgres unique_violation = SQLSTATE 23505.
          const code = (insertErr as { code?: string; cause?: { code?: string } } | null)?.code
            ?? (insertErr as { cause?: { code?: string } } | null)?.cause?.code;
          if (code !== "23505") {
            console.error("[voice] reaction insert failed (non-duplicate):", insertErr);
            return res.status(500).json({ error: "Failed to record reaction" });
          }
          // Duplicate = caller already reacted with same type from same client identity. Idempotent OK.
        }
        if (inserted && parsed.data.reactionType === "up") {
          await db
            .update(communityVoicePins)
            .set({ upvotes: sql`${communityVoicePins.upvotes} + 1` })
            .where(eq(communityVoicePins.id, id));
        }
        res.json({ ok: true, deduped: !inserted });
      } catch (err) {
        console.error("[voice] reaction failed:", err);
        res.status(500).json({ error: "Failed to record reaction" });
      }
    }
  );

  // Comments on a pin (public, rate-limited, crisis-checked)
  app.post(
    "/api/voice/pins/:id/comments",
    rateLimit({ keyPrefix: "voice-comment", max: 20, windowMs: 5 * 60_000 }),
    async (req, res) => {
      try {
        const id = String(req.params.id);
        const parsed = commentCreateSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: "Invalid comment" });
        const [pin] = await db.select().from(communityVoicePins).where(eq(communityVoicePins.id, id)).limit(1);
        if (!pin) return res.status(404).json({ error: "Pin not found" });
        const crisisFlag = detectCrisis(parsed.data.body);
        const [row] = await db
          .insert(communityVoiceComments)
          .values({
            pinId: id,
            body: parsed.data.body,
            authorType: parsed.data.authorType ?? "resident",
            authorName: parsed.data.authorName ?? null,
            anonymized: parsed.data.anonymized ?? true,
            crisisFlag,
            ipHash: ipHashOf(req),
          })
          .returning();
        if (crisisFlag) {
          console.warn(`[voice][CRISIS-COMMENT] pin=${id} comment=${row.id} routed=wph+lifebridge`);
        }
        const { ipHash: _h, ...safe } = row as typeof row & { ipHash?: string };
        res.json({ comment: safe, crisisRouted: crisisFlag });
      } catch (err) {
        console.error("[voice] comment failed:", err);
        res.status(500).json({ error: "Failed to add comment" });
      }
    }
  );

  // List comments on a pin (public, published only)
  app.get("/api/voice/pins/:id/comments", async (req, res) => {
    try {
      const id = String(req.params.id);
      const rows = await db
        .select()
        .from(communityVoiceComments)
        .where(and(eq(communityVoiceComments.pinId, id), eq(communityVoiceComments.status, "published")))
        .orderBy(desc(communityVoiceComments.createdAt))
        .limit(200);
      res.json({ comments: rows.map((r) => { const { ipHash: _h, ...safe } = r as typeof r & { ipHash?: string }; return safe; }) });
    } catch (err) {
      console.error("[voice] list comments failed:", err);
      res.status(500).json({ error: "Failed to load comments" });
    }
  });

  // ── Admin operations ──
  app.post("/api/voice/projects", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCommunityVoiceProjectSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid project payload", details: parsed.error.flatten() });
      const [row] = await db.insert(communityVoiceProjects).values({
        ...parsed.data,
        createdBy: getUserId(req) ?? null,
      } as typeof communityVoiceProjects.$inferInsert).returning();
      res.json({ project: row });
    } catch (err) {
      console.error("[voice] create project failed:", err);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/voice/projects/:slug", requireAdmin, async (req, res) => {
    try {
      const slug = String(req.params.slug);
      const allowed = ["name", "description", "accessMode", "crisisRoutingEnabled", "pinCategories", "status", "publiclyVisible", "centerLat", "centerLng", "defaultZoom"] as const;
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (k in (req.body ?? {})) patch[k] = (req.body as Record<string, unknown>)[k];
      (patch as { updatedAt: Date }).updatedAt = new Date();
      const [row] = await db
        .update(communityVoiceProjects)
        .set(patch as Partial<typeof communityVoiceProjects.$inferInsert>)
        .where(eq(communityVoiceProjects.slug, slug))
        .returning();
      if (!row) return res.status(404).json({ error: "Project not found" });
      res.json({ project: row });
    } catch (err) {
      console.error("[voice] update project failed:", err);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.get("/api/voice/projects/:slug/admin/pins", requireAdmin, async (req, res) => {
    try {
      const project = await getProjectBySlug(String(req.params.slug));
      if (!project) return res.status(404).json({ error: "Project not found" });
      const pins = await db
        .select()
        .from(communityVoicePins)
        .where(eq(communityVoicePins.projectId, project.id))
        .orderBy(desc(communityVoicePins.createdAt))
        .limit(2000);
      // Admin sees everything except accessTokens.
      res.json({ pins: pins.map((p) => { const { accessToken: _t, ...safe } = p as typeof p & { accessToken?: string }; return safe; }) });
    } catch (err) {
      console.error("[voice] admin list pins failed:", err);
      res.status(500).json({ error: "Failed to load pins" });
    }
  });

  app.patch("/api/voice/pins/:id/admin", requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      const allowed = ["status", "category", "anonymized"] as const;
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (k in (req.body ?? {})) patch[k] = (req.body as Record<string, unknown>)[k];
      (patch as { updatedAt: Date }).updatedAt = new Date();
      const [row] = await db
        .update(communityVoicePins)
        .set(patch as Partial<typeof communityVoicePins.$inferInsert>)
        .where(eq(communityVoicePins.id, id))
        .returning();
      if (!row) return res.status(404).json({ error: "Pin not found" });
      const { accessToken: _t, ...safe } = row as typeof row & { accessToken?: string };
      res.json({ pin: safe });
    } catch (err) {
      console.error("[voice] admin update pin failed:", err);
      res.status(500).json({ error: "Failed to update pin" });
    }
  });

  // Seed Pflugerville pilot project on first start if missing.
  void seedPflugervillePilot();
}

async function seedPflugervillePilot() {
  try {
    const [existing] = await db
      .select()
      .from(communityVoiceProjects)
      .where(eq(communityVoiceProjects.slug, "pflugerville-holistic-services"))
      .limit(1);
    if (existing) return;
    await db.insert(communityVoiceProjects).values({
      slug: "pflugerville-holistic-services",
      name: "Pflugerville Holistic Services & Assistance",
      description:
        "Pilot map for residents and partners to pin where holistic services are working, where gaps remain, and where assistance is most needed. Every pin can route to the right TCAF platform — Whole-Person Health for behavioral, LifeBridge for SDOH, Trade Sims for workforce, Foster Youth for transition support. Crisis-routed silently to WPH safety floor.",
      centerLat: 30.4394, // Pflugerville TX
      centerLng: -97.6200,
      defaultZoom: 12,
      accessMode: "public",
      crisisRoutingEnabled: true,
      pinCategories: [
        "service-working",
        "gap-need",
        "assistance-request",
        "safety-concern",
        "transportation",
        "housing",
        "food-access",
        "mental-health",
        "workforce-training",
        "youth-services",
        "veteran-services",
        "story",
      ],
      status: "active",
      publiclyVisible: true,
      createdBy: "system-seed",
    } as typeof communityVoiceProjects.$inferInsert);
    console.log("[voice] Pflugerville pilot project seeded.");
  } catch (err) {
    console.error("[voice] failed to seed Pflugerville pilot:", err);
  }
}
