import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "./storage";
import { referrals } from "@shared/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
// Canonical staff gate — same function used by YHSI, funder, and reentry routes.
import { requireStaff } from "./yhsi-routes";
import { PROGRAM_DEFAULT_ANNUAL_VALUE } from "./benefits-screener-fix";
import { fireWebhook } from "./webhook-dispatcher";

export const referralRouter = Router();

const VALID_STATUSES = ["enrolled", "ineligible", "withdrew", "accepted"];

// ── In-memory rate limiter for the public org-confirm endpoint ────────────────
// Same trust model / pattern as yhsi-routes.ts: req.ip is reliable because
// trust proxy is set at boot; we never read x-forwarded-for.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
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
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const r = consume(`ip:${name}:${ip}`, max, windowMs);
    if (!r.allowed) {
      res.setHeader("Retry-After", String(r.retryAfterSec));
      return res.status(429).json({ error: `Rate limit exceeded. Try again in ${r.retryAfterSec}s.` });
    }
    return next();
  };
}

/**
 * Resolve the benefit value + provenance for an outcome update.
 * FEATURE 1: when an org confirms enrollment ("enrolled") but provides no
 * dollar estimate, fall back to the program default so funder dashboards never
 * show $0 for a confirmed enrollment. valueSource records the provenance.
 */
function resolveBenefitValue(
  status: string,
  programCode: string,
  provided: unknown,
): { benefitValueEstimate: number | null; valueSource: string | null } {
  const parsed =
    provided === null || provided === undefined || provided === ""
      ? null
      : Number(provided);
  const hasProvided = parsed !== null && !Number.isNaN(parsed) && parsed > 0;

  if (status === "enrolled" && !hasProvided) {
    const fallback = PROGRAM_DEFAULT_ANNUAL_VALUE[programCode];
    if (typeof fallback === "number" && fallback > 0) {
      return { benefitValueEstimate: fallback, valueSource: "default" };
    }
  }
  return {
    benefitValueEstimate: hasProvided ? parsed : null,
    valueSource: hasProvided ? "reported" : null,
  };
}

// POST /api/referrals — create referral. Staff-gated: an open endpoint would
// let any internet caller attach fake referrals (and client PII) to a funder's
// public dashboard and pump the outcome webhook. Rate-limited defense-in-depth.
referralRouter.post("/", requireStaff, rateLimit("referral-create", 60, 60 * 60 * 1000), async (req, res) => {
  try {
    const { programCode, orgName, orgId, clientDisplayName, clientPhone, screeningId, funderId, notes } = req.body;
    if (!programCode || !orgName) return res.status(400).json({ error: "programCode and orgName required" });

    const [created] = await db.insert(referrals).values({
      programCode,
      orgName,
      orgId: orgId || null,
      clientDisplayName: clientDisplayName || null,
      clientPhone: clientPhone || null,
      screeningId: screeningId ? parseInt(screeningId) : null,
      chwUserId: (req as any).user?.id ? parseInt((req as any).user.id) : null,
      funderId: funderId || null,
      notes: notes || null,
    }).returning();

    // FEATURE 3: fire-and-forget referral.created. Never awaited; zero
    // subscribers is a clean no-op and failures never affect this response.
    fireWebhook("referral.created", {
      referralId: created.id,
      programCode: created.programCode,
      orgName: created.orgName,
      status: created.status,
      funderId: created.funderId,
    });

    const statusUrl = `/status/${created.statusToken}`;
    const orgConfirmUrl = `/org-confirm/${created.orgConfirmToken}`;
    res.status(201).json({
      referral: { id: created.id, status: created.status, programCode, orgName },
      statusUrl,
      orgConfirmUrl,
    });
  } catch (err: any) {
    console.error("[referral] create failed:", err.message);
    res.status(500).json({ error: "Failed to create referral" });
  }
});

// GET /api/referrals/status/:token — public client status check via capability token
referralRouter.get("/status/:token", async (req, res) => {
  try {
    const [r] = await db.select({
      orgName: referrals.orgName,
      programCode: referrals.programCode,
      status: referrals.status,
      notes: referrals.notes,
    }).from(referrals).where(eq(referrals.statusToken, req.params.token as string));

    if (!r) return res.status(404).json({ error: "Referral not found" });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: "Failed to look up referral" });
  }
});

// PATCH /api/referrals/:id/outcome — org confirms enrollment.
// Requires staff auth: the referral id is included in funder CSV exports, so
// an unauthenticated mutation endpoint would allow any recipient of a share
// link to corrupt outcome data and the value metrics that depend on it.
referralRouter.patch("/:id/outcome", requireStaff, async (req: Request, res: Response) => {
  try {
    const { status, benefitValueEstimate, notes } = req.body;
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });

    // Load current row to apply program default + immutability guard.
    const [existing] = await db.select().from(referrals).where(eq(referrals.id, req.params.id as string));
    if (!existing) return res.status(404).json({ error: "Referral not found" });

    // Immutability: a referral in a terminal resolved state cannot be changed.
    if (existing.resolvedAt) {
      return res.status(409).json({ error: "Referral outcome is already resolved and is immutable" });
    }

    const { benefitValueEstimate: bve, valueSource } = resolveBenefitValue(
      status,
      existing.programCode,
      benefitValueEstimate,
    );

    // Atomic guard: conditional on resolved_at IS NULL so two concurrent
    // confirms can't both win — the loser matches zero rows and gets a 409.
    const [updated] = await db.update(referrals)
      .set({
        status,
        benefitValueEstimate: bve,
        valueSource,
        notes: notes || null,
        resolvedAt: new Date(),
      })
      .where(and(eq(referrals.id, req.params.id as string), isNull(referrals.resolvedAt)))
      .returning({ id: referrals.id, status: referrals.status, benefitValueEstimate: referrals.benefitValueEstimate, valueSource: referrals.valueSource });
    if (!updated) {
      return res.status(409).json({ error: "Referral outcome is already resolved and is immutable" });
    }

    // FEATURE 3: fire-and-forget referral.outcome.
    fireWebhook("referral.outcome", {
      referralId: updated.id,
      status: updated.status,
      benefitValueEstimate: updated.benefitValueEstimate,
      valueSource: updated.valueSource,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update outcome" });
  }
});

// POST /api/referrals/org-confirm/:orgToken — org confirms enrollment WITHOUT
// a staff login. Public, no auth, rate-limited by req.ip. Looks up by the
// org_confirm_token capability token (NOT id, NOT statusToken). Completed
// (resolved) referrals are immutable per project doctrine.
referralRouter.post(
  "/org-confirm/:orgToken",
  rateLimit("org-confirm", 20, 60 * 60 * 1000),
  async (req: Request, res: Response) => {
    try {
      const { status, benefitValueEstimate, notes } = req.body;
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });

      const [existing] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.orgConfirmToken, req.params.orgToken as string));
      if (!existing) return res.status(404).json({ error: "Referral not found" });

      // Immutability: reject changes once terminally resolved.
      if (existing.resolvedAt) {
        return res.status(409).json({ error: "Referral outcome is already resolved and is immutable" });
      }

      const { benefitValueEstimate: bve, valueSource } = resolveBenefitValue(
        status,
        existing.programCode,
        benefitValueEstimate,
      );

      // Atomic guard: conditional on resolved_at IS NULL (see PATCH above).
      const [updated] = await db.update(referrals)
        .set({
          status,
          benefitValueEstimate: bve,
          valueSource,
          notes: notes || null,
          resolvedAt: new Date(),
        })
        .where(and(eq(referrals.id, existing.id), isNull(referrals.resolvedAt)))
        .returning({ id: referrals.id, status: referrals.status, benefitValueEstimate: referrals.benefitValueEstimate, valueSource: referrals.valueSource });
      if (!updated) {
        return res.status(409).json({ error: "Referral outcome is already resolved and is immutable" });
      }

      // FEATURE 3: fire-and-forget referral.outcome.
      fireWebhook("referral.outcome", {
        referralId: updated.id,
        status: updated.status,
        benefitValueEstimate: updated.benefitValueEstimate,
        valueSource: updated.valueSource,
        via: "org-confirm",
      });

      res.json(updated);
    } catch (err) {
      console.error("[referral] org-confirm failed:", (err as any)?.message);
      res.status(500).json({ error: "Failed to confirm outcome" });
    }
  },
);

// GET /api/referrals/my-sent — CHW's sent referrals (requires auth)
referralRouter.get("/my-sent", async (req, res) => {
  if (!(req as any).user?.id) return res.status(401).json({ error: "Authentication required" });
  try {
    const sent = await db.select().from(referrals)
      .where(eq(referrals.chwUserId, parseInt((req as any).user.id as any)))
      .orderBy(desc(referrals.createdAt))
      .limit(50);
    res.json({ referrals: sent });
  } catch (err) {
    res.status(500).json({ error: "Failed to load referrals" });
  }
});
