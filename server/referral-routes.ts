import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "./storage";
import { referrals, orgCapacity } from "@shared/schema";
import { eq, desc, isNull, and, gt, or, sql, inArray } from "drizzle-orm";
// Canonical staff gate — same function used by YHSI, funder, and reentry routes.
import { requireStaff, getUserId } from "./yhsi-routes";
import { requirePartnerAuth, requireScope } from "./partner-api-routes";
import { PROGRAM_DEFAULT_ANNUAL_VALUE } from "./benefits-screener-fix";
import { fireWebhook, fireWebhookForOrg } from "./webhook-dispatcher";
import { sendReferralStatusSms } from "./sms-service";
import { onReferralEnrolled } from "./grant-scoring-events";

// ── Combined auth: staff login OR partner key with inbound:write scope ────────
// Used on PATCH /:id/outcome so receiving orgs can confirm enrollment using
// their tcaf_ partner key without needing a ThriveUp staff account.
function requireStaffOrPartnerInbound(req: Request, res: Response, next: NextFunction): void {
  // Try partner key first (x-partner-key / Authorization: Bearer tcaf_...).
  const partnerKeyRaw =
    (req.headers["x-partner-key"] as string) ||
    (req.headers["authorization"] || "").replace(/^Bearer /i, "");
  const ecosystemKey = req.headers["x-ecosystem-key"] as string;

  if (ecosystemKey || (partnerKeyRaw && partnerKeyRaw.startsWith("tcaf_"))) {
    // Run partner auth then scope check, then continue.
    requirePartnerAuth(req, res, (err?: any) => {
      if (err) return next(err);
      requireScope("inbound:write")(req, res, next);
    });
    return;
  }

  // Fall back to staff session auth.
  requireStaff(req, res, next);
}

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

// ── Failure-only rate limiter (anti-enumeration) ──────────────────────────
// Unlike rateLimit() above, this does NOT consume the bucket on every
// request — only when the caller explicitly reports a "miss" (invalid/
// not-found token). This is the correct shape for token-guarded public
// endpoints: a legitimate org can confirm many distinct, valid referrals in
// a row without being throttled (each real token is single-use anyway —
// resolved referrals are immutable), while an attacker guessing tokens
// racks up misses and gets locked out. Rejects up-front if the caller has
// already exceeded the miss budget, without itself counting as a miss.
function checkEnumerationGuard(name: string, max: number, windowMs: number) {
  return {
    isBlocked(req: Request): number | null {
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      const key = `ip:${name}:${ip}`;
      const b = buckets.get(key);
      if (!b || b.resetAt < Date.now()) return null;
      if (b.count >= max) return Math.ceil((b.resetAt - Date.now()) / 1000);
      return null;
    },
    recordMiss(req: Request) {
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      consume(`ip:${name}:${ip}`, max, windowMs);
    },
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

/**
 * Look up the freshest capacity record for the org a referral targets.
 * Matches by orgId when provided, otherwise by case-insensitive orgName.
 * Prefers an exact programCode match over a "general" record. Records older
 * than 14 days are ignored (same freshness window as the public GET).
 */
async function lookupCapacity(
  orgId: string | undefined,
  orgName: string,
  programCode: string,
): Promise<{ status: string; waitWeeks: number | null; orgName: string } | null> {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  // Canonicalize both sides so trivial formatting variants ("snap", extra
  // internal spaces) cannot slip past the guard.
  const nameNorm = orgName.trim().toLowerCase().replace(/\s+/g, " ");
  const programNorm = programCode.trim().toLowerCase();
  // Match entirely in the database (no pre-limit that could drop the target
  // org in a large registry): org identity by id or normalized name, program
  // by case-insensitive exact code or "general". Deterministic precedence:
  // orgId match beats name fallback, exact program record beats "general",
  // then most recently updated.
  const nameMatch = sql`lower(regexp_replace(trim(${orgCapacity.orgName}), '\\s+', ' ', 'g')) = ${nameNorm}`;
  const identity = orgId ? or(eq(orgCapacity.orgId, orgId), nameMatch) : nameMatch;
  const programMatch = sql`lower(trim(${orgCapacity.programCode})) in (${programNorm}, 'general')`;
  const [best] = await db.select().from(orgCapacity)
    .where(and(
      gt(orgCapacity.updatedAt, cutoff),
      identity,
      programMatch,
    ))
    .orderBy(
      ...(orgId ? [sql`case when ${orgCapacity.orgId} = ${orgId} then 0 else 1 end`] : []),
      sql`case when lower(trim(${orgCapacity.programCode})) = ${programNorm} then 0 else 1 end`,
      desc(orgCapacity.updatedAt),
    )
    .limit(1);
  if (!best) return null;
  return { status: best.status, waitWeeks: best.waitWeeks ?? null, orgName: best.orgName };
}

// POST /api/referrals — create referral. Staff-gated: an open endpoint would
// let any internet caller attach fake referrals (and client PII) to a funder's
// public dashboard and pump the outcome webhook. Rate-limited defense-in-depth.
referralRouter.post("/", requireStaff, rateLimit("referral-create", 60, 60 * 60 * 1000), async (req, res) => {
  try {
    const { programCode, orgName, orgId, clientDisplayName, clientPhone, screeningId, funderId, notes, waitlistAcknowledged } = req.body;
    if (!programCode || !orgName) return res.status(400).json({ error: "programCode and orgName required" });

    // Capacity guard: block referrals to orgs whose intake is closed, and
    // require explicit acknowledgement when the org is on a waitlist. The
    // client shows the same states pre-submit; this is the server-side
    // enforcement so the check can't be bypassed.
    const capacity = await lookupCapacity(orgId, orgName, programCode);
    if (capacity?.status === "closed") {
      return res.status(409).json({
        error: `${capacity.orgName} has closed intake for this program right now. Please choose a different organization.`,
        capacityStatus: "closed",
      });
    }
    if (capacity?.status === "waitlist" && waitlistAcknowledged !== true) {
      const wait = capacity.waitWeeks
        ? ` Estimated wait: ~${capacity.waitWeeks} week${capacity.waitWeeks === 1 ? "" : "s"}.`
        : "";
      return res.status(409).json({
        error: `${capacity.orgName} is currently on a waitlist.${wait} Confirm the client understands the wait to proceed.`,
        capacityStatus: "waitlist",
        waitWeeks: capacity.waitWeeks,
      });
    }

    const [created] = await db.insert(referrals).values({
      programCode,
      orgName,
      orgId: orgId || null,
      clientDisplayName: clientDisplayName || null,
      clientPhone: clientPhone || null,
      screeningId: screeningId ? parseInt(screeningId) : null,
      chwUserId: (() => { const uid = getUserId(req); const n = uid ? parseInt(uid) : NaN; return isNaN(n) ? null : n; })(),
      funderId: funderId || null,
      notes: notes || null,
    }).returning();

    // FEATURE 3: fire-and-forget referral.created. Never awaited; zero
    // subscribers is a clean no-op and failures never affect this response.
    // orgConfirmUrl is intentionally NOT broadcast here: it is a one-time
    // mutation capability token that must only reach the intended org. Delivery
    // is scoped to the target org (fireWebhookForOrg) so that a partner key
    // provisioned for Org A cannot receive events intended for Org B.
    // The staff user who created the referral receives orgConfirmUrl in the
    // HTTP response below and can share it with the org directly.
    if (created.orgName) {
      fireWebhookForOrg("referral.created", {
        referralId: created.id,
        programCode: created.programCode,
        orgName: created.orgName,
        status: created.status,
        funderId: created.funderId,
      }, created.orgName);
    } else {
      // No target org — still fire broadly so any subscriber can see it,
      // but there is no org-scoped data to protect.
      fireWebhook("referral.created", {
        referralId: created.id,
        programCode: created.programCode,
        orgName: created.orgName,
        status: created.status,
        funderId: created.funderId,
      });
    }

    // Fire-and-forget SMS: deliver the status link to the client's phone so they
    // can check their referral status without needing the CHW to forward a URL.
    // Only sent when a clientPhone was provided. Failure is logged but never
    // blocks this response — SMS is a best-effort notification.
    if (created.clientPhone) {
      sendReferralStatusSms(created.clientPhone, created.statusToken as string).catch(() => {
        // already logged inside sendReferralStatusSms; swallow here for safety
      });
    }

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
referralRouter.get("/status/:token", rateLimit("referral-status", 30, 60 * 1000), async (req, res) => {
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
// Accepts a staff session OR a partner key with inbound:write scope. The
// partner-key path lets receiving orgs confirm enrollment programmatically
// using their tcaf_ API key, without needing a ThriveUp staff account.
referralRouter.patch("/:id/outcome", requireStaffOrPartnerInbound, async (req: Request, res: Response) => {
  try {
      const { status, benefitValueEstimate, notes } = req.body;

const VALID_STATUSES = ["enrolled", "ineligible", "withdrew", "accepted"];
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });

      const referralId = (req.params.id as string).trim();
      if (!referralId) return res.status(400).json({ error: "Invalid referral id" });

      const [existing] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, referralId));
      if (!existing) return res.status(404).json({ error: "Referral not found" });

      // Org binding: if the caller is a partner key (not a staff session), verify
      // their partnerName matches the referral's orgName. This prevents a key
      // provisioned for Org A from resolving a referral sent to Org B.
      const partnerKey = (req as any).partnerKey as { partnerName?: string } | undefined;
      if (partnerKey) {
        const keyOrg = (partnerKey.partnerName ?? "").trim().toLowerCase().replace(/\s+/g, " ");
        const refOrg = (existing.orgName ?? "").trim().toLowerCase().replace(/\s+/g, " ");
        if (!keyOrg || keyOrg !== refOrg) {
          return res.status(403).json({
            error: "This partner key is not authorized to update this referral. The key's organization does not match the referral's target organization.",
          });
        }
      }

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

    // FEATURE 3: fire-and-forget referral.outcome (org-scoped).
    // Delivery is restricted to the referral's target org so Org A cannot
    // receive outcome data for referrals sent to Org B.
    if (existing.orgName) {
      fireWebhookForOrg("referral.outcome", {
        referralId: updated.id,
        status: updated.status,
        benefitValueEstimate: updated.benefitValueEstimate,
        valueSource: updated.valueSource,
      }, existing.orgName);
    } else {
      fireWebhook("referral.outcome", {
        referralId: updated.id,
        status: updated.status,
        benefitValueEstimate: updated.benefitValueEstimate,
        valueSource: updated.valueSource,
      });
    }

    // Outcome-driven grant scoring: bump fit scores on matching grants.
    if (updated.status === "enrolled") {
      onReferralEnrolled(updated.id, existing.orgId ?? "", existing.programCode ?? "").catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update outcome" });
  }
});

// POST /api/referrals/org-confirm/:orgToken — org confirms enrollment WITHOUT
// a staff login. Public, no auth, rate-limited by req.ip. Looks up by the
// org_confirm_token capability token (NOT id, NOT statusToken). Completed
// (resolved) referrals are immutable per project doctrine.
const orgConfirmEnumerationGuard = checkEnumerationGuard("org-confirm-miss", 20, 60 * 60 * 1000);
referralRouter.post(
  "/org-confirm/:orgToken",
  async (req: Request, res: Response) => {
    try {
      const blockedForSec = orgConfirmEnumerationGuard.isBlocked(req);
      if (blockedForSec !== null) {
        res.setHeader("Retry-After", String(blockedForSec));
        return res.status(429).json({ error: `Too many invalid attempts. Try again in ${blockedForSec}s.` });
      }

      const { status, benefitValueEstimate, notes } = req.body;

const VALID_STATUSES = ["enrolled", "ineligible", "withdrew", "accepted"];
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });

      const [existing] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.orgConfirmToken, req.params.orgToken as string));
      if (!existing) {
        // Only invalid/guessed tokens count against the anti-enumeration
        // budget — a legitimate org confirming many real referrals never
        // gets throttled.
        orgConfirmEnumerationGuard.recordMiss(req);
        return res.status(404).json({ error: "Referral not found" });
      }

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

      // FEATURE 3: fire-and-forget referral.outcome (org-scoped).
      // Delivery is restricted to the referral's target org so Org A cannot
      // receive outcome data for referrals sent to Org B.
      if (existing.orgName) {
        fireWebhookForOrg("referral.outcome", {
          referralId: updated.id,
          status: updated.status,
          benefitValueEstimate: updated.benefitValueEstimate,
          valueSource: updated.valueSource,
          via: "org-confirm",
        }, existing.orgName);
      } else {
        fireWebhook("referral.outcome", {
          referralId: updated.id,
          status: updated.status,
          benefitValueEstimate: updated.benefitValueEstimate,
          valueSource: updated.valueSource,
          via: "org-confirm",
        });
      }

      // Outcome-driven grant scoring.
      if (updated.status === "enrolled") {
        onReferralEnrolled(updated.id, existing.orgId ?? "", existing.programCode ?? "").catch(() => {});
      }

      res.json(updated);
    } catch (err) {
      console.error("[referral] org-confirm failed:", (err as any)?.message);
      res.status(500).json({ error: "Failed to confirm outcome" });
    }
  },
);

// GET /api/referrals/my-sent — CHW's sent referrals (requires auth).
// Scoped to the authenticated CHW's userId only — a CHW cannot read another
// CHW's referral tokens. orgConfirmUrl is derived from orgConfirmToken and
// included so the CHW can copy it to the receiving org without re-opening
// each referral. statusToken is intentionally NOT returned here (it is a
// client-facing token and should not be surfaced on this CHW-facing list).
referralRouter.get("/my-sent", async (req, res) => {
  const rawUserId = getUserId(req);
  if (!rawUserId) return res.status(401).json({ error: "Authentication required" });
  try {
    const chwUserId = parseInt(rawUserId);
    // chwUserId is an integer FK mirroring Replit numeric user IDs.  If the
    // parsed value is NaN (non-numeric sub — shouldn't happen in production)
    // return an empty list rather than a DB error.
    if (isNaN(chwUserId)) return res.json({ referrals: [] });
    const sent = await db
      .select({
        id: referrals.id,
        programCode: referrals.programCode,
        orgName: referrals.orgName,
        clientDisplayName: referrals.clientDisplayName,
        status: referrals.status,
        createdAt: referrals.createdAt,
        resolvedAt: referrals.resolvedAt,
        benefitValueEstimate: referrals.benefitValueEstimate,
        valueSource: referrals.valueSource,
        // Include the org-confirm token so the CHW can reconstruct the URL.
        // Only visible to the CHW who created the referral (chwUserId scope above).
        orgConfirmToken: referrals.orgConfirmToken,
      })
      .from(referrals)
      .where(eq(referrals.chwUserId, chwUserId))
      .orderBy(desc(referrals.createdAt))
      .limit(50);

    // Construct the orgConfirmUrl server-side so the client never needs to
    // know the token-to-URL mapping convention.
    const referralsWithUrls = sent.map((r) => ({
      id: r.id,
      programCode: r.programCode,
      orgName: r.orgName,
      clientDisplayName: r.clientDisplayName,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      benefitValueEstimate: r.benefitValueEstimate,
      valueSource: r.valueSource,
      orgConfirmUrl: r.orgConfirmToken ? `/org-confirm/${r.orgConfirmToken}` : null,
    }));

    res.json({ referrals: referralsWithUrls });
  } catch (err) {
    res.status(500).json({ error: "Failed to load referrals" });
  }
});
