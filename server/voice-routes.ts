// Community Voice routes — Open Point / Social Point analog.
// Map-pin community input collection with capability-token pattern (P-L08),
// crisis-detection on every utterance, with local project safety-review flags,
// per-IP rate limiting on public endpoints.

import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  communityVoiceProjects,
  communityVoicePins,
  communityVoiceReactions,
  communityVoiceComments,
  communityVoiceInsights,
  communityVoiceRouting,
  invitationConsents,
  integrationInvitations,
  insertCommunityVoiceProjectSchema,
  type CommunityVoicePin,
  type CommunityVoiceProject,
} from "@shared/schema";
import { and, asc, desc, eq, sql, inArray } from "drizzle-orm";
import { randomUUID, randomBytes, timingSafeEqual, createHash } from "crypto";
import { z } from "zod";
import { communityContextSchema } from "@shared/community-context";
import { generateAIJSON } from "./ai-provider";
import { filterByItiConsent } from "./integration-invitation-routes";
import { isItiAccessWithinWindow } from "./iti-token-policy";

// Deterministic category → ecosystem-platform routing map.
// Used both for AI theme recommendations and the chain-web visualization.
const PLATFORM_ROUTING: Record<string, string[]> = {
  "safety-concern": ["whole-person-health", "lifebridge"],
  "mental-health": ["whole-person-health", "safe-cogni-care"],
  "food-access": ["lifebridge", "sankofa-health-network"],
  "housing": ["lifebridge"],
  "transportation": ["lifebridge"],
  "workforce-training": ["trade-sims", "mission-transition"],
  "youth-services": ["isss", "foster-youth"],
  "veteran-services": ["mission-transition"],
  "assistance-request": ["lifebridge"],
  "gap-need": ["lifebridge", "civic-signal"],
  "service-working": [],
  "story": [],
};

const PLATFORM_LABELS: Record<string, string> = {
  "whole-person-health": "Whole-Person Health",
  "lifebridge": "LifeBridge",
  "safe-cogni-care": "SafeCogniCare",
  "sankofa-health-network": "Sankofa Health Network",
  "trade-sims": "Trade Sims (ThriveUp)",
  "mission-transition": "Mission Transition (M2C)",
  "isss": "ISSS",
  "foster-youth": "Foster Youth Wizard",
  "civic-signal": "Civic Signal",
};

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
  // Strict admin only for Community Voice admin surfaces. The UI gates these
  // behind <RequireAuth adminOnly>, so the backend must enforce the same
  // boundary — case_manager / staff must not be able to mutate voice projects,
  // generate paid AI insights, or publish to the public story page directly.
  const u = getUser(req);
  return !!u && u.role === "admin";
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
  itiInvitationId: z.string().uuid().optional().nullable(),
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
  const { accessToken: _t, ipHash: _i, authorEmail: _e, itiInvitationId: _iti, ...safe } = pin as CommunityVoicePin & { accessToken?: string; ipHash?: string; itiInvitationId?: string | null };
  return safe;
}

async function publicizePins(pins: CommunityVoicePin[]) {
  const invitationIds = Array.from(new Set(
    pins.map((pin) => pin.itiInvitationId).filter((id): id is string => Boolean(id)),
  ));
  if (invitationIds.length === 0) return pins.map(publicizePin);

  const [invitations, consents] = await Promise.all([
    db.select({ id: integrationInvitations.id, status: integrationInvitations.status })
      .from(integrationInvitations)
      .where(inArray(integrationInvitations.id, invitationIds)),
    db.select({
      invitationId: invitationConsents.invitationId,
      quoteMe: invitationConsents.quoteMe,
      nameMePublicly: invitationConsents.nameMePublicly,
    }).from(invitationConsents).where(inArray(invitationConsents.invitationId, invitationIds)),
  ]);
  const statusById = new Map(invitations.map((invitation) => [invitation.id, invitation.status]));
  const consentById = new Map(consents.map((consent) => [consent.invitationId, consent]));

  return pins.map((pin) => {
    const safe = publicizePin(pin) as Omit<CommunityVoicePin, "accessToken" | "ipHash" | "authorEmail" | "itiInvitationId"> & { authorName?: string | null; body?: string };
    if (!pin.itiInvitationId) return safe;
    const consent = consentById.get(pin.itiInvitationId);
    const active = statusById.get(pin.itiInvitationId) !== "withdrawn";
    if (!active || !consent?.quoteMe) safe.body = "";
    if (!active || !consent?.nameMePublicly) safe.authorName = null;
    return safe;
  });
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
      res.json({ pins: await publicizePins(pins) });
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

        const result = await db.transaction(async (tx) => {
          if (data.itiInvitationId) {
            const [invitation] = await tx
              .select({
                id: integrationInvitations.id,
                accessToken: integrationInvitations.accessToken,
                status: integrationInvitations.status,
                createdAt: integrationInvitations.createdAt,
              })
              .from(integrationInvitations)
              .where(eq(integrationInvitations.id, data.itiInvitationId))
              .for("update");
            const presented = (req.header("x-iti-token") || "").trim();
            if (!invitation || invitation.status === "withdrawn" ||
                !isItiAccessWithinWindow(invitation.createdAt) ||
                !tokensMatch(invitation.accessToken, presented)) {
              return { error: "invalid-invitation" as const };
            }
          }

          const [created] = await tx.insert(communityVoicePins).values({
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
            itiInvitationId: data.itiInvitationId ?? null,
            sentiment,
            crisisFlag,
            crisisRoutedTo: crisisFlag ? "project_safety_review" : null,
            status: "published",
            ipHash: ipHashOf(req),
          } as typeof communityVoicePins.$inferInsert).returning();
          return { row: created };
        });
        if ("error" in result) return res.status(403).json({ error: "The linked invitation is invalid or withdrawn." });
        const row = result.row;

        // Crisis flag is recorded for project safety review. No external
        // notification is claimed until an actual partner delivery contract exists.
        if (crisisFlag) {
          console.warn(`[voice][CRISIS] project=${project.slug} pin=${row.id} flagged=project_safety_review`);
        }

       const [safe] = await publicizePins([row]);
        return res.json({ pin: safe, accessToken, crisisDetected: crisisFlag, crisisRouted: false });
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
       if (!Object.keys(patch).length) {
         const [safe] = await publicizePins([auth.pin]);
         return res.json({ pin: safe });
       }

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
       const [safe] = await publicizePins([row]);
       res.json({ pin: safe });
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
          console.warn(`[voice][CRISIS-COMMENT] pin=${id} comment=${row.id} flagged=project_safety_review`);
        }
        const { ipHash: _h, ...safe } = row as typeof row & { ipHash?: string };
        res.json({ comment: safe, crisisDetected: crisisFlag, crisisRouted: false });
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
      const contextResult = req.body?.communityContext == null
        ? null
        : communityContextSchema.safeParse(req.body.communityContext);
      if (contextResult && !contextResult.success) {
        return res.status(400).json({ error: "Invalid community context", details: contextResult.error.flatten() });
      }
      if (contextResult?.success && contextResult.data?.countryCode !== "US") {
        return res.status(400).json({ error: "Community Voice is currently a domestic U.S. surface; use a country adapter for international projects." });
      }
      const [row] = await db.insert(communityVoiceProjects).values({
        ...parsed.data,
        ...(contextResult ? {
          communityContext: {
            ...contextResult.data,
            source: "partner_reported" as const,
            confidence: "reported" as const,
          },
        } : {}),
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
      if ("communityContext" in (req.body ?? {})) {
        if (req.body.communityContext == null) {
          patch.communityContext = null;
        } else {
          const contextResult = communityContextSchema.safeParse(req.body.communityContext);
          if (!contextResult.success) return res.status(400).json({ error: "Invalid community context", details: contextResult.error.flatten() });
           if (contextResult.data.countryCode !== "US") {
             return res.status(400).json({ error: "Community Voice is currently a domestic U.S. surface; use a country adapter for international projects." });
           }
          patch.communityContext = contextResult.data;
        }
      }
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

  // ── Wizard-friendly project creation (any authenticated user can launch a project) ──
  app.post("/api/voice/projects/wizard", (req, res, next) => {
    if (!getUserId(req)) return res.status(401).json({ error: "Sign in to start a project." });
    next();
  }, rateLimit({ keyPrefix: "voice-wizard", max: 5, windowMs: 60 * 60_000 }), async (req, res) => {
    try {
      const parsed = insertCommunityVoiceProjectSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Please fill in every step before launching.", details: parsed.error.flatten() });
      const contextResult = req.body?.communityContext == null
        ? null
        : communityContextSchema.safeParse(req.body.communityContext);
      if (contextResult && !contextResult.success) {
        return res.status(400).json({ error: "Invalid community context", details: contextResult.error.flatten() });
      }
      if (contextResult?.success && contextResult.data?.countryCode !== "US") {
        return res.status(400).json({ error: "Community Voice is currently a domestic U.S. surface; use a country adapter for international projects." });
      }
      // Wizard always starts with publiclyVisible=true so the owner can share their project link immediately.
      // Admin can still moderate via the admin endpoints.
      const [row] = await db.insert(communityVoiceProjects).values({
        ...parsed.data,
        ...(contextResult ? {
          communityContext: {
            ...contextResult.data,
            source: "partner_reported" as const,
            confidence: "reported" as const,
          },
        } : {}),
        publiclyVisible: parsed.data.publiclyVisible ?? true,
        status: parsed.data.status ?? "active",
        createdBy: getUserId(req) ?? null,
      } as typeof communityVoiceProjects.$inferInsert).returning();
      res.json({ project: row });
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code;
      if (code === "23505") {
        return res.status(409).json({ error: "A project with that short link already exists. Pick a different one." });
      }
      console.error("[voice] wizard create project failed:", err);
      res.status(500).json({ error: "Couldn't launch your project. Please try again." });
    }
  });

  // ── Insights generation (admin only — runs paid AI calls) ──
  app.post("/api/voice/projects/:slug/insights/generate", requireAdmin, rateLimit({ keyPrefix: "voice-insights-gen", max: 10, windowMs: 10 * 60_000 }), async (req, res) => {
    try {
      const project = await getProjectBySlug(String(req.params.slug));
      if (!project) return res.status(404).json({ error: "Project not found" });
      const pins = await db.select().from(communityVoicePins)
        .where(and(eq(communityVoicePins.projectId, project.id), eq(communityVoicePins.status, "published")))
        .orderBy(desc(communityVoicePins.createdAt))
        .limit(500);
      if (pins.length === 0) return res.status(400).json({ error: "No pins yet. Drop a few first." });

      // === ITI anti-extraction gate (Iron Rule #8) ===
      // Filter before computing any derived metric, not only before the AI
      // corpus. Otherwise a non-consenting pin could still affect counts.
      const pinsForAI = await filterByItiConsent(pins, "aggregateMyData");
      const itiFilteredOut = pins.length - pinsForAI.length;

      // Sentiment timeline (per day), from consent-eligible pins only.
      const timelineMap: Record<string, { positive: number; neutral: number; negative: number; mixed: number; crisis: number }> = {};
      for (const p of pinsForAI) {
        const d = new Date(p.createdAt as unknown as string).toISOString().slice(0, 10);
        timelineMap[d] ||= { positive: 0, neutral: 0, negative: 0, mixed: 0, crisis: 0 };
        const k = (p.sentiment ?? "neutral") as keyof (typeof timelineMap)[string];
        timelineMap[d][k] = (timelineMap[d][k] ?? 0) + 1;
        if (p.crisisFlag) timelineMap[d].crisis += 1;
      }
      const sentimentTimeline = Object.entries(timelineMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, c]) => ({ date, ...c }));

      // Stakeholder breakdown
      const stakeholder: Record<string, number> = {};
      for (const p of pinsForAI) stakeholder[p.authorType] = (stakeholder[p.authorType] ?? 0) + 1;

      // AI cluster — routed through ai-provider.ts (ETHICAL_EI_PREAMBLE applied)
      let themes: Array<{ title: string; summary: string; sentiment: string; memberPinIds: string[]; recommendedPlatforms: string[]; confidence: number }> = [];
      let modelUsed = "fallback-rule-based";
      if (pinsForAI.length > 0) {
        const corpus = pinsForAI.slice(0, 200).map((p, i) =>
          `[${i}] cat=${p.category} sent=${p.sentiment ?? "neutral"} crisis=${p.crisisFlag ? "Y" : "N"} body=${JSON.stringify((p.body ?? "").slice(0, 280))}`
        ).join("\n");
        const prompt = `You are a community-engagement analyst for a nonprofit. Cluster these resident voice pins into 3–7 SPECIFIC, ACTIONABLE themes. Each theme summary should be 1–2 sentences in plain language a community organizer would read out loud. Output JSON: { "themes": [{ "title": "...", "summary": "...", "sentiment": "positive|negative|mixed|neutral", "memberIndexes": [0,3,7], "confidence": 0.0-1.0 }] }. Be honest. Prefer specificity over generic categories.\n\nPINS:\n${corpus}`;
        try {
          const parsed = await generateAIJSON<{ themes?: Array<{ title?: string; summary?: string; sentiment?: string; memberIndexes?: number[]; confidence?: number }> }>(prompt);
          if (Array.isArray(parsed.themes)) {
            themes = parsed.themes.map((t) => {
              const memberPinIds = (t.memberIndexes ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < pinsForAI.length).map((i) => pinsForAI[i].id);
              const recs = new Set<string>();
              for (const id of memberPinIds) {
                const pin = pinsForAI.find((p) => p.id === id);
                if (pin) for (const plat of PLATFORM_ROUTING[pin.category] ?? []) recs.add(plat);
              }
              return {
                title: String(t.title ?? "Theme").slice(0, 120),
                summary: String(t.summary ?? "").slice(0, 600),
                sentiment: (t.sentiment ?? "neutral"),
                memberPinIds,
                recommendedPlatforms: Array.from(recs),
                confidence: Math.min(1, Math.max(0, Number(t.confidence) || 0.7)),
              };
            }).filter((t) => t.memberPinIds.length > 0);
            if (themes.length > 0) modelUsed = "ai-provider";
          }
        } catch (e) {
          console.error("[voice-insights] AI cluster failed — using rule-based fallback:", e);
        }
      }
      if (itiFilteredOut > 0) {
        console.log(`[voice-insights] ITI anti-extraction gate filtered ${itiFilteredOut}/${pins.length} pins (aggregateMyData=false)`);
      }
      if (themes.length === 0) {
        // Iron Rule #8: fallback MUST also use the ITI-filtered set. Never
        // summarize a non-consenting invitee's pin into themes.
        const byCat: Record<string, typeof pinsForAI> = {};
        for (const p of pinsForAI) (byCat[p.category] ||= []).push(p);
        themes = Object.entries(byCat).map(([cat, group]) => {
          const neg = group.filter((g) => g.sentiment === "negative").length;
          const pos = group.filter((g) => g.sentiment === "positive").length;
          const sentiment = neg > group.length / 2 ? "negative" : pos > group.length / 2 ? "positive" : "mixed";
          const crisisCount = group.filter((g) => g.crisisFlag).length;
          const label = cat.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
          return {
            title: label,
            summary: `${group.length} ${group.length === 1 ? "voice" : "voices"} in ${label}.${crisisCount > 0 ? ` ${crisisCount} flagged for project safety review.` : ""}`,
            sentiment,
            memberPinIds: group.map((g) => g.id),
            recommendedPlatforms: PLATFORM_ROUTING[cat] ?? [],
            confidence: 0.6,
          };
        }).sort((a, b) => b.memberPinIds.length - a.memberPinIds.length);
      }

      // Consent may be withdrawn while the AI call is in flight. Recheck
      // immediately before persistence so revoked pins cannot be published.
      const latestPinsForAI = await filterByItiConsent(pins, "aggregateMyData");
      const initialEligibleIds = new Set(pinsForAI.map((pin) => pin.id));
      const latestEligibleIds = new Set(latestPinsForAI.map((pin) => pin.id));
      const consentChanged = initialEligibleIds.size !== latestEligibleIds.size
        || Array.from(initialEligibleIds).some((pinId) => !latestEligibleIds.has(pinId));
      if (consentChanged) {
        return res.status(409).json({ error: "Consent changed while the insight was being prepared. Nothing was published; please generate again." });
      }

      const insightResult = await db.transaction(async (tx) => {
        // Withdrawal locks the invitation first, then resets its consent.
        // Lock the same rows before checking consent and inserting the
        // insight so withdrawal cannot commit between those two operations.
        const invitationIds = Array.from(new Set(
          pinsForAI.map((pin) => pin.itiInvitationId).filter((id): id is string => Boolean(id)),
        )).sort();
        if (invitationIds.length > 0) {
          const invitations = await tx
            .select({ id: integrationInvitations.id, status: integrationInvitations.status })
            .from(integrationInvitations)
            .where(inArray(integrationInvitations.id, invitationIds))
            .orderBy(asc(integrationInvitations.id))
            .for("update");
          const consents = await tx
            .select({ invitationId: invitationConsents.invitationId, aggregateMyData: invitationConsents.aggregateMyData })
            .from(invitationConsents)
            .where(inArray(invitationConsents.invitationId, invitationIds));
          const consentByInvitation = new Map(consents.map((consent) => [consent.invitationId, consent.aggregateMyData]));
          if (
            invitations.length !== invitationIds.length
            || invitations.some((invitation) => invitation.status === "withdrawn" || !consentByInvitation.get(invitation.id))
          ) {
            return { error: "consent-changed" as const };
          }
        }

        const [created] = await tx.insert(communityVoiceInsights).values({
          projectId: project.id,
          generatedBy: getUserId(req) ?? null,
          // pinCount reflects what was actually summarized after the ITI
          // anti-extraction gate, not the unfiltered total.
          pinCount: pinsForAI.length,
          sourcePinIds: pinsForAI.map((pin) => pin.id),
          themes,
          sentimentTimeline,
          stakeholderBreakdown: stakeholder,
          modelUsed,
        } as typeof communityVoiceInsights.$inferInsert).returning();
        return { row: created };
      });
      if ("error" in insightResult) {
        return res.status(409).json({ error: "Consent changed while the insight was being published. Nothing was published; please generate again." });
      }
      const row = insightResult.row;
      res.json({ insight: row });
    } catch (err) {
      console.error("[voice] generate insights failed:", err);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // Get latest insight — admin sees any, public sees only synced ones (for the Story page).
  app.get("/api/voice/projects/:slug/insights/latest", async (req, res) => {
    try {
      const project = await getProjectBySlug(String(req.params.slug));
      if (!project) return res.status(404).json({ error: "Project not found" });
      const admin = isAdminish(req);
      // Mirror the hidden-project guard from /projects/:slug — anonymous callers
      // must not learn anything about non-public projects even if they know the slug.
      if (!project.publiclyVisible && !getUserId(req)) {
        return res.status(404).json({ error: "Project not found" });
      }
      const baseCond = admin
        ? eq(communityVoiceInsights.projectId, project.id)
        : and(eq(communityVoiceInsights.projectId, project.id), sql`${communityVoiceInsights.syncedToStoryAt} IS NOT NULL`);
       const [foundRow] = await db.select().from(communityVoiceInsights)
        .where(baseCond as ReturnType<typeof eq>)
        .orderBy(desc(communityVoiceInsights.generatedAt))
        .limit(1);
       let row: typeof communityVoiceInsights.$inferSelect | undefined = foundRow;
       if (row && !admin) {
         const sourcePinIds = Array.isArray(row.sourcePinIds)
           ? row.sourcePinIds.filter((id): id is string => typeof id === "string")
           : [];
         // Insights created before source provenance was persisted are not
         // safe to expose after consent changes; regenerate them instead.
         if (sourcePinIds.length === 0) {
           row = undefined;
         } else {
           const referencedPins = await db.select().from(communityVoicePins).where(inArray(communityVoicePins.id, sourcePinIds));
           const eligiblePins = await filterByItiConsent(referencedPins, "aggregateMyData");
           if (eligiblePins.length !== sourcePinIds.length) row = undefined;
         }
       }
      res.json({ insight: row ?? null });
    } catch (err) {
      console.error("[voice] get latest insight failed:", err);
      res.status(500).json({ error: "Failed to load insight" });
    }
  });

  // Sync an insight to the public Story page.
  app.post("/api/voice/insights/:id/sync", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const [row] = await db.update(communityVoiceInsights)
        .set({ syncedToStoryAt: new Date() })
        .where(eq(communityVoiceInsights.id, id))
        .returning();
      if (!row) return res.status(404).json({ error: "Insight not found" });
      res.json({ insight: row });
    } catch (err) {
      console.error("[voice] sync insight failed:", err);
      res.status(500).json({ error: "Failed to sync insight" });
    }
  });

  // ── Chain web — pin-to-platform routing ──
  app.post("/api/voice/pins/:id/route", requireAdmin, async (req, res) => {
    try {
      const id = String(req.params.id);
      const { targetPlatform, status = "queued", outcome } = (req.body ?? {}) as { targetPlatform?: string; status?: string; outcome?: string };
      if (!targetPlatform) return res.status(400).json({ error: "targetPlatform required" });
      if (!PLATFORM_LABELS[targetPlatform]) return res.status(400).json({ error: "Unknown platform" });
      const result = await db.transaction(async (tx) => {
        const [pin] = await tx.select({ itiInvitationId: communityVoicePins.itiInvitationId })
          .from(communityVoicePins)
          .where(eq(communityVoicePins.id, id))
          .limit(1);
        if (!pin) return { error: "pin-not-found" as const };
        if (pin.itiInvitationId) {
          const [invitation] = await tx
            .select({ id: integrationInvitations.id, status: integrationInvitations.status })
            .from(integrationInvitations)
            .where(eq(integrationInvitations.id, pin.itiInvitationId))
            .for("update");
          if (!invitation || invitation.status === "withdrawn") return { error: "consent-denied" as const };
          const [consent] = await tx.select({ routeMyInfoToService: invitationConsents.routeMyInfoToService })
            .from(invitationConsents)
            .where(eq(invitationConsents.invitationId, pin.itiInvitationId))
            .limit(1);
          if (!consent?.routeMyInfoToService) return { error: "consent-denied" as const };
        }
        const [created] = await tx.insert(communityVoiceRouting).values({
          pinId: id,
          targetPlatform,
          status,
          outcome: outcome ?? null,
          recordedBy: getUserId(req) ?? null,
        } as typeof communityVoiceRouting.$inferInsert).returning();
        return { row: created };
      });
      if ("error" in result) {
        return res.status(result.error === "pin-not-found" ? 404 : 403).json({
          error: result.error === "pin-not-found" ? "Pin not found" : "This contributor has not consented to service routing.",
        });
      }
      res.json({ routing: result.row });
    } catch (err) {
      console.error("[voice] route pin failed:", err);
      res.status(500).json({ error: "Failed to route pin" });
    }
  });

  app.patch("/api/voice/routing/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const allowed = ["status", "outcome"] as const;
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (k in (req.body ?? {})) patch[k] = (req.body as Record<string, unknown>)[k];
      if (typeof patch.outcome === "string" && patch.outcome.length > 0) (patch as { outcomeRecordedAt: Date }).outcomeRecordedAt = new Date();
      const [row] = await db.update(communityVoiceRouting)
        .set(patch as Partial<typeof communityVoiceRouting.$inferInsert>)
        .where(eq(communityVoiceRouting.id, id))
        .returning();
      if (!row) return res.status(404).json({ error: "Routing not found" });
      res.json({ routing: row });
    } catch (err) {
      console.error("[voice] update routing failed:", err);
      res.status(500).json({ error: "Failed to update routing" });
    }
  });

  // Chain web data — pins + routings + platform labels. Public; respects publiclyVisible.
  app.get("/api/voice/projects/:slug/chain", async (req, res) => {
    try {
      const project = await getProjectBySlug(String(req.params.slug));
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (!project.publiclyVisible && !getUserId(req)) return res.status(404).json({ error: "Project not found" });
      const pins = await db.select().from(communityVoicePins)
        .where(and(eq(communityVoicePins.projectId, project.id), eq(communityVoicePins.status, "published")))
        .orderBy(desc(communityVoicePins.createdAt))
        .limit(500);
      const routings = pins.length === 0 ? [] : await db.select().from(communityVoiceRouting)
        .where(inArray(communityVoiceRouting.pinId, pins.map((p) => p.id)))
        .limit(2000);
      const byPin: Record<string, typeof routings> = {};
      for (const r of routings) (byPin[r.pinId] ||= []).push(r);
      res.json({
        // Use the same sanitizer as the public pin list — strips accessToken,
        // ipHash, AND authorEmail so the public chain endpoint never leaks PII.
        pins: await publicizePins(pins),
        routings: byPin,
        platformLabels: PLATFORM_LABELS,
        platformMap: PLATFORM_ROUTING,
      });
    } catch (err) {
      console.error("[voice] get chain failed:", err);
      res.status(500).json({ error: "Failed to load chain" });
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
        "Pilot map for residents and partners to pin where holistic services are working, where gaps remain, and where assistance is most needed. Every pin can route to the right TCAF platform — Whole-Person Health for behavioral, LifeBridge for SDOH, Trade Sims for workforce, Foster Youth for transition support. Crisis signals are flagged for project safety review.",
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
