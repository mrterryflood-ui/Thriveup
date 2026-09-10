// ── YHSI Routes — HUD CPD-2600-DC-0035 implementation stack ──────────────────
// Youth Voice Portal (public, capability tokens), Referral Pathway Tracker,
// Youth data layer (participants + outcome snapshots), HMIS-compatible export,
// metrics with small-cell suppression, and biannual HUD progress reports.
import type { Express, Request, Response, NextFunction } from "express";
import { db, storage } from "./storage";
import {
  yhsiYouthParticipants,
  yhsiOutcomeSnapshots,
  yhsiReferrals,
  yhsiReferralTouchpoints,
  yhsiVoiceEntries,
  yhsiReports,
  insertYhsiYouthParticipantSchema,
  insertYhsiOutcomeSnapshotSchema,
  insertYhsiReferralSchema,
  insertYhsiReferralTouchpointSchema,
  insertYhsiVoiceEntrySchema,
  yhsiEntitlements,
  yhsiFidelityObservations,
  yhsiMilestones,
  insertYhsiEntitlementSchema,
  insertYhsiFidelityObservationSchema,
  insertYhsiMilestoneSchema,
  type YhsiVoiceEntry,
} from "@shared/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { generateAIResponse } from "./ai-provider";
import { pushYHSIEventToChildCORE } from "./childcore-connector";
import { randomUUID, randomBytes, timingSafeEqual, createHash } from "crypto";
import { z } from "zod";
import { screenParticipantGaps } from "@shared/foster-eligibility";
import PDFDocument from "pdfkit";

const coerceDate = z.preprocess((v) => (typeof v === "string" || v instanceof Date ? new Date(v as string) : v), z.date());

// Server-enforced enums — free-form values would silently vanish from the
// fixed-milestone outcomes summary and corrupt funder metrics.
const SNAPSHOT_TYPES = z.enum(["at_contact", "day_30", "day_90", "day_180", "day_365", "month_6", "month_12", "exit", "custom"]);
const HOUSING_STATUSES = z.enum(["stable_permanent", "stable_temporary", "doubled_up", "shelter", "unsheltered", "transitional", "hotel_motel", "unknown"]);
const HS_COMPLETION = z.enum(["completed", "on_track", "ged_track", "disengaged", "na", "unknown"]);
const POST_SECONDARY = z.enum(["enrolled", "apprenticeship", "applied", "not_enrolled", "na", "unknown"]);
const EMPLOYMENT_STATUSES = z.enum(["employed_ft", "employed_pt", "seeking", "not_seeking", "unknown"]);
const EDUCATION_STATUSES = z.enum(["enrolled", "disengaged", "graduated", "ged_track", "unknown"]);
const ENTITLEMENT_TYPES = z.enum(["chafee", "etv", "medicaid_former_foster", "fafsa_independent", "mckinney_vento_services", "snap", "other"]);
const ENTITLEMENT_STATUSES = z.enum(["offered", "declined", "applied", "enrolled", "denied", "ineligible"]);
const MILESTONE_TYPES = z.enum(["hud_biannual_report", "project_plan_update", "budget_report", "drawdown", "site_visit", "renewal_application", "other"]);
const MILESTONE_STATUSES = z.enum(["upcoming", "submitted", "waived"]);

const snapshotFieldConstraints = {
  snapshotType: SNAPSHOT_TYPES,
  housingStatus: HOUSING_STATUSES,
  educationStatus: EDUCATION_STATUSES.optional().nullable(),
  employmentStatus: EMPLOYMENT_STATUSES.optional().nullable(),
  hsCompletion: HS_COMPLETION.optional().nullable(),
  postSecondaryStatus: POST_SECONDARY.optional().nullable(),
  hourlyWage: z.number().min(0).max(500).optional().nullable(),
  mentorConnections: z.number().int().min(0).max(50).optional().nullable(),
  mhScaleScore: z.number().int().min(0).max(300).optional().nullable(),
};
function sqlEnum<T extends [string, ...string[]]>(values: T) {
  return z.enum(values);
}
function optionalString(max: number) {
  return z.string().max(max).optional();
}

// Sentinel narrative used when AI drafting fails. A report carrying this text
// is INCOMPLETE and must never be finalizable — a placeholder can't be
// submitted to HUD. Detection is substring-based so human edits that keep the
// marker are still blocked, but a fully rewritten narrative clears it.
export const NARRATIVE_PLACEHOLDER = "[Narrative generation unavailable — draft manually from the metrics below.]";
export function isPlaceholderNarrative(narrative?: string | null): boolean {
  return !narrative?.trim() || narrative.includes(NARRATIVE_PLACEHOLDER);
}

// Timezone-safe period parsing. A date-only string like "2024-06-30" must
// resolve to the same UTC day regardless of server locale; parsing "2024-06-30"
// then reading it in a negative-offset zone could roll back to the 29th. We
// pin date-only inputs to UTC midnight explicitly.
export function toUtcPeriodDate(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v !== "string") return null;
  const s = v.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    return new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
const utcPeriodDate = z.preprocess((v) => toUtcPeriodDate(v) ?? v, z.date());

// Small-cell suppression floor (platform doctrine): never expose counts 1–4.
export const SUPPRESSION_FLOOR = 5;
export function suppress(n: number): number | null {
  return n > 0 && n < SUPPRESSION_FLOOR ? null : n;
}

// ── Metric-truth doctrine (exported so tests lock the exact rules) ──────────
// Referral resolution counts ONLY genuinely terminal-success statuses. The
// lifecycle is initiated → contacted → enrolled → in_service → completed;
// enrolled/in_service are still in progress, closed_unresolved/declined are
// terminal failures. Only "completed" is a resolution.
export const RESOLVED_REFERRAL_STATUSES = new Set(["completed"]);
export function isResolvedReferralStatus(status: string): boolean {
  return RESOLVED_REFERRAL_STATUSES.has(status);
}
// An entitlement was actually OFFERED only if it reached offered/applied/
// enrolled. declined/denied/ineligible were never offers extended-and-open.
export const OFFERED_ENTITLEMENT_STATUSES = new Set(["offered", "applied", "enrolled"]);
export function isOfferedEntitlementStatus(status: string): boolean {
  return OFFERED_ENTITLEMENT_STATUSES.has(status);
}

// ── Referral status transition matrix ───────────────────────────────────────
// The lifecycle is initiated → contacted → enrolled → in_service → completed,
// with terminal-failure exits (closed_unresolved, declined) reachable from any
// live stage. Without a guard the UI's free-choice dropdown lets staff jump a
// referral straight from "declined" back to "completed" — which silently
// inflates the completed-only resolution rate the funder reports on. We keep it
// simple: an explicit map of the moves that make sense. A youth re-referred
// after a decline should get a NEW referral row (re-referral), not have the old
// terminal one rewritten — so terminal statuses only allow reopening back to an
// in-progress stage, never a direct hop to another terminal outcome.
export const ALLOWED_REFERRAL_TRANSITIONS: Record<string, string[]> = {
  initiated: ["contacted", "enrolled", "in_service", "completed", "closed_unresolved", "declined"],
  contacted: ["enrolled", "in_service", "completed", "closed_unresolved", "declined"],
  enrolled: ["in_service", "completed", "closed_unresolved", "declined"],
  in_service: ["completed", "closed_unresolved", "declined"],
  // Terminal statuses: completed is IMMUTABLE — it feeds the funder-reported
  // resolution rate, so history must not be rewritten. A youth returning to
  // service gets a NEW referral row (re-referral). Failure terminals are
  // correctable only by reopening to a live stage (premature closure), never
  // by hopping directly to a different outcome.
  completed: [],
  closed_unresolved: ["contacted", "enrolled", "in_service"],
  declined: ["contacted", "enrolled", "in_service"],
};
export function isAllowedReferralTransition(from: string, to: string): boolean {
  if (from === to) return true; // idempotent no-op (e.g. re-saving notes on same status)
  return ALLOWED_REFERRAL_TRANSITIONS[from]?.includes(to) ?? false;
}

function getUser(req: Request) {
  const u = (req as unknown as Record<string, unknown>).user as
    | { claims?: { sub?: string; email?: string }; id?: string; role?: string }
    | undefined;
  return u;
}
export function getUserId(req: Request): string | undefined {
  const u = getUser(req);
  return u?.claims?.sub || u?.id;
}
// Roles are persisted in the users table, NOT attached to req.user by the
// auth layer — resolve via storage.getUser(claims.sub), same as the main
// requireAdmin in server/routes.ts. Session-only checks are nonfunctional.
// Canonical staff-role set — keep in lockstep with server/reentry-routes.ts
// STAFF_ROLES and the client RequireAuth staffOnly gate, or staff-routed pages
// will render while their APIs 403.
const STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);
async function isStaff(req: Request): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) return false;
  try {
    const user = await storage.getUser(userId);
    return !!user && STAFF_ROLES.has(user.role);
  } catch (err) {
    console.error("[YHSI] role lookup failed:", err);
    return false;
  }
}
export async function requireStaff(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  if (await isStaff(req)) return next();
  return res.status(403).json({ error: "Staff access required" });
}

function tokensMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// In-memory rate limiter (same trust model as foster-youth intake: req.ip is
// reliable because trust proxy is set at boot; we never read x-forwarded-for).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const GLOBAL_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "voice-create": { max: 300, windowMs: 60 * 60 * 1000 },
  "report-generate": { max: 30, windowMs: 60 * 60 * 1000 },
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
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const r = consume(`ip:${name}:${ip}`, max, windowMs);
    if (!r.allowed) {
      res.setHeader("Retry-After", String(r.retryAfterSec));
      return res.status(429).json({ error: `Rate limit exceeded. Try again in ${r.retryAfterSec}s.` });
    }
    const g = GLOBAL_LIMITS[name];
    if (g) {
      const gr = consume(`global:${name}`, g.max, g.windowMs);
      if (!gr.allowed) {
        res.setHeader("Retry-After", String(gr.retryAfterSec));
        return res.status(429).json({ error: `Service is temporarily busy. Try again in ${gr.retryAfterSec}s.` });
      }
    }
    return next();
  };
}

function stripToken(entry: YhsiVoiceEntry): Omit<YhsiVoiceEntry, "accessToken"> {
  const { accessToken: _t, ...rest } = entry;
  return rest;
}

// All released metrics apply the small-cell suppression floor: any count of
// 1-4 is returned as null ("<5"), and rates are only computed when the
// denominator meets the floor. Raw (unsuppressed) values never leave this
// function — reports persist the suppressed representation.
async function computeYhsiMetrics(periodStart?: Date, periodEnd?: Date) {
  const inPeriod = (col: any) =>
    periodStart && periodEnd ? and(gte(col, periodStart), lte(col, periodEnd)) : sql`true`;

  const suppressMap = (rows: Array<{ key: string; n: number }>) =>
    Object.fromEntries(rows.map((r) => [r.key, suppress(r.n)]));
  const rate = (num: number, den: number) =>
    den >= SUPPRESSION_FLOOR ? Math.round((num / den) * 100) : null;

  const [participantCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(yhsiYouthParticipants)
    .where(inPeriod(yhsiYouthParticipants.createdAt));
  const referralsByStatus = await db
    .select({ key: yhsiReferrals.status, n: sql<number>`count(*)::int` })
    .from(yhsiReferrals)
    .where(inPeriod(yhsiReferrals.initiatedAt))
    .groupBy(yhsiReferrals.status);
  const referralsByService = await db
    .select({ key: yhsiReferrals.serviceType, n: sql<number>`count(*)::int` })
    .from(yhsiReferrals)
    .where(inPeriod(yhsiReferrals.initiatedAt))
    .groupBy(yhsiReferrals.serviceType);
  const [avgDaysToContact] = await db
    .select({
      days: sql<number | null>`round(avg(extract(epoch from (first_contact_at - initiated_at)) / 86400)::numeric, 1)::float`,
      n: sql<number>`count(*)::int`,
    })
    .from(yhsiReferrals)
    .where(and(inPeriod(yhsiReferrals.initiatedAt), sql`first_contact_at is not null`));
  const housingAt6mo = await db
    .select({ key: yhsiOutcomeSnapshots.housingStatus, n: sql<number>`count(*)::int` })
    .from(yhsiOutcomeSnapshots)
    .where(and(eq(yhsiOutcomeSnapshots.snapshotType, "month_6"), inPeriod(yhsiOutcomeSnapshots.recordedAt)))
    .groupBy(yhsiOutcomeSnapshots.housingStatus);
  const voiceByStatus = await db
    .select({ key: yhsiVoiceEntries.status, n: sql<number>`count(*)::int` })
    .from(yhsiVoiceEntries)
    .where(inPeriod(yhsiVoiceEntries.createdAt))
    .groupBy(yhsiVoiceEntries.status);

  const total = referralsByStatus.reduce((s, r) => s + r.n, 0);
  // Resolution = genuinely terminal-success only (see isResolvedReferralStatus).
  // in_service/enrolled are still in progress; counting them inflated the rate.
  const resolved = referralsByStatus.filter((r) => isResolvedReferralStatus(r.key)).reduce((s, r) => s + r.n, 0);
  const stable6mo = housingAt6mo.filter((r) => r.key.startsWith("stable")).reduce((s, r) => s + r.n, 0);
  const total6mo = housingAt6mo.reduce((s, r) => s + r.n, 0);
  const voiceTotal = voiceByStatus.reduce((s, r) => s + r.n, 0);

  return {
    computedAt: new Date().toISOString(),
    period: periodStart && periodEnd
      ? { start: periodStart.toISOString().slice(0, 10), end: periodEnd.toISOString().slice(0, 10) }
      : "all_time",
    suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed (shown as null) to protect small cohorts; rates require a denominator of at least ${SUPPRESSION_FLOOR}.`,
    participants: suppress(participantCount?.n ?? 0),
    referrals: {
      total: suppress(total),
      byStatus: suppressMap(referralsByStatus),
      byService: suppressMap(referralsByService),
      resolutionRate: rate(resolved, total),
      avgDaysToFirstContact: (avgDaysToContact?.n ?? 0) >= SUPPRESSION_FLOOR ? avgDaysToContact?.days ?? null : null,
    },
    housingStabilityAt6Months: {
      total: suppress(total6mo),
      stable: suppress(stable6mo),
      stableRate: rate(stable6mo, total6mo),
      byStatus: suppressMap(housingAt6mo),
    },
    youthVoice: {
      byStatus: suppressMap(voiceByStatus),
      incorporated: suppress(voiceByStatus.find((r) => r.key === "incorporated")?.n ?? 0),
      total: suppress(voiceTotal),
    },
  };
}

export function registerYhsiRoutes(app: Express): void {
  // ── Youth Voice Portal (public) ─────────────────────────────────────────
  // Create an entry. Server mints id + capability token; token returned ONCE.
  app.post("/api/yhsi/voice", rateLimit("voice-create", 10, 60 * 60 * 1000), async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiVoiceEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      if (!parsed.data.body?.trim() || parsed.data.body.length > 10000) {
        return res.status(400).json({ error: "Entry text is required (max 10,000 characters)." });
      }
      const id = randomUUID();
      const accessToken = randomBytes(24).toString("base64url");
      const [entry] = await db
        .insert(yhsiVoiceEntries)
        .values({ ...parsed.data, id, accessToken })
        .returning();
      return res.status(201).json({ accessToken, entry: stripToken(entry) });
    } catch (err) {
      console.error("[YHSI] voice create failed:", err);
      return res.status(500).json({ error: "Failed to save your input. Please try again." });
    }
  });

  // Contributor revisits their entry with token; staff can view any.
  app.get("/api/yhsi/voice/:id", async (req: Request, res: Response) => {
    try {
      const [entry] = await db.select().from(yhsiVoiceEntries).where(eq(yhsiVoiceEntries.id, String(req.params.id))).limit(1);
      if (!entry) return res.status(404).json({ error: "Not found" });
      // Header-only capability token (query strings leak via logs/referrers).
      const presented = (req.header("x-voice-token") || "").trim();
      if (!tokensMatch(entry.accessToken, presented) && !(await isStaff(req))) {
        return res.status(404).json({ error: "Not found" });
      }
      return res.json(stripToken(entry));
    } catch (err) {
      console.error("[YHSI] voice fetch failed:", err);
      return res.status(500).json({ error: "Failed to load entry" });
    }
  });

  // Public impact wall: incorporated entries (alias + impact note only) plus
  // suppressed aggregate counts. Proves "youth input shaped the program."
  app.get("/api/yhsi/voice-wall", async (_req: Request, res: Response) => {
    try {
      const incorporated = await db
        .select({
          id: yhsiVoiceEntries.id,
          contributorAlias: yhsiVoiceEntries.contributorAlias,
          inputType: yhsiVoiceEntries.inputType,
          relatedProgram: yhsiVoiceEntries.relatedProgram,
          impactNote: yhsiVoiceEntries.impactNote,
          incorporatedAt: yhsiVoiceEntries.incorporatedAt,
        })
        .from(yhsiVoiceEntries)
        .where(eq(yhsiVoiceEntries.status, "incorporated"))
        .orderBy(desc(yhsiVoiceEntries.incorporatedAt))
        .limit(50);
      const byStatus = await db
        .select({ status: yhsiVoiceEntries.status, n: sql<number>`count(*)::int` })
        .from(yhsiVoiceEntries)
        .groupBy(yhsiVoiceEntries.status);
      const total = byStatus.reduce((s, r) => s + r.n, 0);
      return res.json({
        totalContributions: suppress(total),
        incorporatedCount: suppress(incorporated.length),
        incorporated: incorporated.map((e) => ({ ...e, contributorAlias: e.contributorAlias || "A young person with lived experience" })),
      });
    } catch (err) {
      console.error("[YHSI] voice wall failed:", err);
      return res.status(500).json({ error: "Failed to load impact wall" });
    }
  });

  // Staff: list + review/incorporate voice entries
  app.get("/api/yhsi/voice", requireStaff, async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string | undefined)?.trim();
      const rows = await db
        .select()
        .from(yhsiVoiceEntries)
        .where(status ? eq(yhsiVoiceEntries.status, status) : sql`true`)
        .orderBy(desc(yhsiVoiceEntries.createdAt))
        .limit(500);
      return res.json(rows.map(stripToken));
    } catch (err) {
      console.error("[YHSI] voice list failed:", err);
      return res.status(500).json({ error: "Failed to list entries" });
    }
  });

  app.patch("/api/yhsi/voice/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const schema = insertYhsiVoiceEntrySchema.partial().extend({
        status: sqlEnum(["new", "reviewed", "incorporated", "not_actionable"]).optional(),
        impactNote: optionalString(4000),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      if (parsed.data.status === "incorporated" && !parsed.data.impactNote?.trim()) {
        const [existing] = await db.select({ impactNote: yhsiVoiceEntries.impactNote }).from(yhsiVoiceEntries).where(eq(yhsiVoiceEntries.id, String(req.params.id))).limit(1);
        if (!existing?.impactNote?.trim()) {
          return res.status(400).json({ error: "An impact note is required when marking an entry incorporated — youth must be able to see how their input shaped the program." });
        }
      }
      const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date(), reviewedBy: getUserId(req) ?? null };
      if (parsed.data.status === "incorporated") updates.incorporatedAt = new Date();
      const [updated] = await db.update(yhsiVoiceEntries).set(updates).where(eq(yhsiVoiceEntries.id, String(req.params.id))).returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      return res.json(stripToken(updated));
    } catch (err) {
      console.error("[YHSI] voice update failed:", err);
      return res.status(500).json({ error: "Failed to update entry" });
    }
  });

  // ── Participants + outcome snapshots (staff only — PII) ─────────────────
  app.post("/api/yhsi/participants", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiYouthParticipantSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.insert(yhsiYouthParticipants).values({ ...parsed.data, id: randomUUID(), createdBy: getUserId(req) ?? null }).returning();
      // Fire-and-forget: notify ChildCORE so it can check for younger siblings.
      // A ChildCORE outage must never block enrollment — catch and log only.
      pushYHSIEventToChildCORE("yhsi_enrollment", row).catch((err) => {
        console.error("[YHSI→ChildCORE] enrollment push failed:", err);
      });
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI] participant create failed:", err);
      return res.status(500).json({ error: "Failed to create participant" });
    }
  });

  app.get("/api/yhsi/participants", requireStaff, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiYouthParticipants).orderBy(desc(yhsiYouthParticipants.createdAt)).limit(1000);
      return res.json(rows);
    } catch (err) {
      console.error("[YHSI] participant list failed:", err);
      return res.status(500).json({ error: "Failed to list participants" });
    }
  });

  app.patch("/api/yhsi/participants/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiYouthParticipantSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.update(yhsiYouthParticipants).set({ ...parsed.data, updatedAt: new Date() }).where(eq(yhsiYouthParticipants.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI] participant update failed:", err);
      return res.status(500).json({ error: "Failed to update participant" });
    }
  });

  app.post("/api/yhsi/participants/:id/snapshots", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiOutcomeSnapshotSchema.omit({ participantId: true }).extend(snapshotFieldConstraints).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [participant] = await db.select({ id: yhsiYouthParticipants.id }).from(yhsiYouthParticipants).where(eq(yhsiYouthParticipants.id, String(req.params.id))).limit(1);
      if (!participant) return res.status(404).json({ error: "Participant not found" });
      const [row] = await db.insert(yhsiOutcomeSnapshots).values({ ...parsed.data, id: randomUUID(), participantId: String(req.params.id), recordedBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI] snapshot create failed:", err);
      return res.status(500).json({ error: "Failed to record snapshot" });
    }
  });

  app.get("/api/yhsi/participants/:id/snapshots", requireStaff, async (req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiOutcomeSnapshots).where(eq(yhsiOutcomeSnapshots.participantId, String(req.params.id))).orderBy(desc(yhsiOutcomeSnapshots.recordedAt));
      return res.json(rows);
    } catch (err) {
      console.error("[YHSI] snapshot list failed:", err);
      return res.status(500).json({ error: "Failed to list snapshots" });
    }
  });

  // ── Referral pathway tracker (staff only) ────────────────────────────────
  app.post("/api/yhsi/referrals", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiReferralSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.insert(yhsiReferrals).values({ ...parsed.data, id: randomUUID(), createdBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI] referral create failed:", err);
      return res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.get("/api/yhsi/referrals", requireStaff, async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string | undefined)?.trim();
      const rows = await db
        .select()
        .from(yhsiReferrals)
        .where(status ? eq(yhsiReferrals.status, status) : sql`true`)
        .orderBy(desc(yhsiReferrals.initiatedAt))
        .limit(1000);
      return res.json(rows);
    } catch (err) {
      console.error("[YHSI] referral list failed:", err);
      return res.status(500).json({ error: "Failed to list referrals" });
    }
  });

  app.patch("/api/yhsi/referrals/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const schema = insertYhsiReferralSchema.partial().extend({
        firstContactAt: coerceDate.optional(),
        resolvedAt: coerceDate.optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      // Enforce the lifecycle matrix on any status change. Read the current
      // status first so we can reject nonsensical jumps (e.g. declined →
      // completed) with an honest 400 instead of silently corrupting metrics.
      if (parsed.data.status !== undefined) {
        const [current] = await db.select({ status: yhsiReferrals.status }).from(yhsiReferrals).where(eq(yhsiReferrals.id, String(req.params.id))).limit(1);
        if (!current) return res.status(404).json({ error: "Not found" });
        if (!isAllowedReferralTransition(current.status, parsed.data.status)) {
          return res.status(400).json({
            error: `Can't change referral status from "${current.status}" to "${parsed.data.status}". A youth re-engaged after a terminal outcome needs a new (re-)referral, not an edit to the closed one. Allowed next steps: ${(ALLOWED_REFERRAL_TRANSITIONS[current.status] ?? []).join(", ") || "none"}.`,
          });
        }
      }
      const [row] = await db.update(yhsiReferrals).set({ ...parsed.data, updatedAt: new Date() }).where(eq(yhsiReferrals.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI] referral update failed:", err);
      return res.status(500).json({ error: "Failed to update referral" });
    }
  });

  app.post("/api/yhsi/referrals/:id/touchpoints", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiReferralTouchpointSchema.omit({ referralId: true }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [referral] = await db.select({ id: yhsiReferrals.id, firstContactAt: yhsiReferrals.firstContactAt }).from(yhsiReferrals).where(eq(yhsiReferrals.id, String(req.params.id))).limit(1);
      if (!referral) return res.status(404).json({ error: "Referral not found" });
      const [row] = await db.insert(yhsiReferralTouchpoints).values({ ...parsed.data, id: randomUUID(), referralId: String(req.params.id), recordedBy: getUserId(req) ?? null }).returning();
      // First touchpoint of a contact-type auto-stamps firstContactAt.
      if (!referral.firstContactAt && ["outreach_call", "meeting", "warm_handoff"].includes(parsed.data.touchpointType)) {
        await db.update(yhsiReferrals).set({ firstContactAt: new Date(), status: "contacted", updatedAt: new Date() }).where(and(eq(yhsiReferrals.id, String(req.params.id)), eq(yhsiReferrals.status, "initiated")));
      }
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI] touchpoint create failed:", err);
      return res.status(500).json({ error: "Failed to record touchpoint" });
    }
  });

  app.get("/api/yhsi/referrals/:id/touchpoints", requireStaff, async (req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiReferralTouchpoints).where(eq(yhsiReferralTouchpoints.referralId, String(req.params.id))).orderBy(desc(yhsiReferralTouchpoints.occurredAt));
      return res.json(rows);
    } catch (err) {
      console.error("[YHSI] touchpoint list failed:", err);
      return res.status(500).json({ error: "Failed to list touchpoints" });
    }
  });

  // ── Metrics (staff) ──────────────────────────────────────────────────────
  app.get("/api/yhsi/metrics", requireStaff, async (_req: Request, res: Response) => {
    try {
      return res.json(await computeYhsiMetrics());
    } catch (err) {
      console.error("[YHSI] metrics failed:", err);
      return res.status(500).json({ error: "Failed to compute metrics" });
    }
  });

  // ── HMIS-compatible CSV export (staff) ───────────────────────────────────
  // Subset of HMIS CSV Client + latest living situation; de-identified unless
  // ?includeNames=true.
  app.get("/api/yhsi/hmis/export.csv", requireStaff, async (req: Request, res: Response) => {
    try {
      const includeNames = req.query.includeNames === "true";
      // Consent gate: only participants with consent on file may leave the
      // system in an export. Youth without consent are excluded entirely —
      // never de-identified-and-included, which still discloses their record.
      const rows = await db
        .select()
        .from(yhsiYouthParticipants)
        .where(eq(yhsiYouthParticipants.consentOnFile, true))
        .orderBy(desc(yhsiYouthParticipants.createdAt));

      // Per-export rotating pseudonymous ID. The prior export used the STABLE
      // hmisPersonalId/id as PersonalID, which let two exports be joined back
      // to the same youth across runs (re-identification). We salt with a
      // random per-export value + timestamp so the same youth gets a different
      // PersonalID every run; joins across exports are no longer possible.
      const exportSalt = randomBytes(16).toString("hex");
      const exportedAt = new Date();
      const pseudonymousId = (participantId: string) =>
        createHash("sha256").update(`${exportSalt}:${participantId}`).digest("hex").slice(0, 32);

      // Audit trail: releasing real names is a privileged disclosure. Log who
      // exported, with which option, how many records, and the (non-reversible)
      // salt fingerprint so the export is accountable after the fact.
      console.log("[YHSI][AUDIT] HMIS export", JSON.stringify({
        actor: getUserId(req) ?? "unknown",
        includeNames,
        recordCount: rows.length,
        saltFingerprint: createHash("sha256").update(exportSalt).digest("hex").slice(0, 12),
        at: exportedAt.toISOString(),
      }));

      const header = [
        "PersonalID", ...(includeNames ? ["FirstName", "LastNameInitial"] : []),
        "DOBDataQuality", "BirthYear", "AgeAtContact", "State",
        "McKinneyVentoStatus", "LivingSituation", "ChronicPattern",
        "FosterCareHistory", "JusticeInvolvement", "Parenting",
        "EducationStatus", "EmploymentStatus", "ReferralSource", "DateCreated",
      ];
      const esc = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [header.join(",")];
      for (const p of rows) {
        lines.push([
          pseudonymousId(p.id),
          ...(includeNames ? [p.firstName || "", p.lastNameInitial || ""] : []),
          p.dobQuality || "", p.birthYear ?? "", p.ageAtContact ?? "", p.stateCode || "",
          p.mckinneyVentoStatus || "", p.livingSituation || "", p.chronicPattern ? 1 : 0,
          p.fosterCareHistory ? 1 : 0, p.justiceInvolvement ? 1 : 0, p.isParenting ? 1 : 0,
          p.educationStatus || "", p.employmentStatus || "", p.referralSource || "",
          p.createdAt.toISOString().slice(0, 10),
        ].map(esc).join(","));
      }
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="yhsi-hmis-export-${exportedAt.toISOString().slice(0, 10)}.csv"`);
      return res.send(lines.join("\n"));
    } catch (err) {
      console.error("[YHSI] HMIS export failed:", err);
      return res.status(500).json({ error: "Failed to export HMIS data" });
    }
  });

  // ── Biannual HUD progress reports (staff) ────────────────────────────────
  app.post("/api/yhsi/reports/generate", requireStaff, rateLimit("report-generate", 5, 60 * 60 * 1000), async (req: Request, res: Response) => {
    try {
      const body = z.object({ periodStart: utcPeriodDate, periodEnd: utcPeriodDate }).safeParse(req.body);
      if (!body.success) return res.status(400).json({ error: "periodStart and periodEnd (ISO dates) are required", details: body.error.flatten() });
      const { periodStart, periodEnd } = body.data;
      if (periodEnd <= periodStart) return res.status(400).json({ error: "periodEnd must be after periodStart" });

      // Guard against duplicate report periods — two reports for the same
      // period would confuse HUD reviewers about which is authoritative and
      // risk double-counting in the funder record.
      const [dup] = await db
        .select({ id: yhsiReports.id })
        .from(yhsiReports)
        .where(and(eq(yhsiReports.periodStart, periodStart), eq(yhsiReports.periodEnd, periodEnd)))
        .limit(1);
      if (dup) return res.status(409).json({ error: "A report for this exact period already exists. Edit or delete the existing report instead of generating a duplicate." });

      const metrics = await computeYhsiMetrics(periodStart, periodEnd);
      let narrative: string;
      try {
        narrative = await generateAIResponse([
          {
            role: "system",
            content: [
              "You draft HUD YHSI (Youth Homelessness System Improvement, CPD-2600-DC-0035) biannual progress report narratives.",
              "Use ONLY the metrics provided — never invent numbers, participants, outcomes, or activities not present in the data.",
              "If a metric is null or zero, state that plainly. Where data is thin, say so and describe what will be tracked next period.",
              "Structure: 1) Reporting Period Summary, 2) Referral Pathway Performance, 3) Housing Stability Outcomes, 4) Youth Leadership & Voice, 5) Challenges & Next Period Plan.",
              "Tone: factual, plain language, HUD-report register. 400-700 words.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `Reporting period: ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}\n\nMetrics JSON:\n${JSON.stringify(metrics, null, 2)}`,
          },
        ], 2000);
      } catch (aiErr) {
        console.error("[YHSI] report narrative generation failed:", aiErr);
        narrative = NARRATIVE_PLACEHOLDER;
      }

      const [report] = await db.insert(yhsiReports).values({
        id: randomUUID(),
        periodStart,
        periodEnd,
        status: "draft",
        metrics,
        narrative,
        generatedBy: getUserId(req) ?? null,
      }).returning();
      return res.status(201).json({ ...report, incomplete: isPlaceholderNarrative(report.narrative) });
    } catch (err) {
      console.error("[YHSI] report generate failed:", err);
      return res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/yhsi/reports", requireStaff, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiReports).orderBy(desc(yhsiReports.periodStart));
      // Surface a computed `incomplete` flag so the UI can flag drafts whose
      // narrative is still a placeholder — these cannot be finalized.
      return res.json(rows.map((r) => ({ ...r, incomplete: isPlaceholderNarrative(r.narrative) })));
    } catch (err) {
      console.error("[YHSI] report list failed:", err);
      return res.status(500).json({ error: "Failed to list reports" });
    }
  });

  // One-click HUD-format PDF export of a biannual report. Values already
  // stored suppressed — the PDF renders nulls as "<5 (suppressed)".
  app.get("/api/yhsi/reports/:id/pdf", requireStaff, async (req: Request, res: Response) => {
    try {
      const [report] = await db.select().from(yhsiReports).where(eq(yhsiReports.id, String(req.params.id)));
      if (!report) return res.status(404).json({ error: "Not found" });
      const filename = `YHSI-HUD-Report-${report.periodStart.toISOString().slice(0, 10)}_to_${report.periodEnd.toISOString().slice(0, 10)}${report.status === "final" ? "" : "-DRAFT"}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      renderYhsiReportPdf(report, res);
    } catch (err) {
      console.error("[YHSI] report PDF export failed:", err);
      if (!res.headersSent) return res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.patch("/api/yhsi/reports/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        narrative: z.string().max(50000).optional(),
        status: z.enum(["draft", "final"]).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.status === "final") {
        // Block finalizing a report whose narrative is still the AI-failure
        // placeholder (or empty). The effective narrative is the one being set
        // in this request if present, otherwise the stored one.
        let effectiveNarrative = parsed.data.narrative;
        if (effectiveNarrative === undefined) {
          const [existing] = await db.select({ narrative: yhsiReports.narrative }).from(yhsiReports).where(eq(yhsiReports.id, String(req.params.id))).limit(1);
          if (!existing) return res.status(404).json({ error: "Not found" });
          effectiveNarrative = existing.narrative ?? undefined;
        }
        if (isPlaceholderNarrative(effectiveNarrative)) {
          return res.status(400).json({ error: "This report cannot be finalized: its narrative is a placeholder or empty. Write the report narrative before finalizing." });
        }
        updates.finalizedAt = new Date();
      }
      const [row] = await db.update(yhsiReports).set(updates).where(eq(yhsiReports.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI] report update failed:", err);
      return res.status(500).json({ error: "Failed to update report" });
    }
  });

  // ── Funder-ready outcomes summary (staff) ────────────────────────────────
  // The "73% stably housed at 12 months" proof engine. All values suppressed.
  app.get("/api/yhsi/outcomes-summary", requireStaff, async (_req: Request, res: Response) => {
    try {
      const MILESTONES = ["at_contact", "day_30", "day_90", "day_180", "day_365", "month_6", "month_12", "exit"];
      // Dedupe to one snapshot per (participant, snapshotType) — the latest by
      // recorded_at. A participant re-recorded at the same milestone must count
      // once, otherwise a single youth double-counts and every rate/denominator
      // is corrupted. Denominators are then KNOWN-only and consistent per
      // measure (a youth with an unknown value is excluded from that measure's
      // numerator AND denominator, never silently counted against them).
      const latestPerType = db
        .select({
          participantId: yhsiOutcomeSnapshots.participantId,
          snapshotType: yhsiOutcomeSnapshots.snapshotType,
          housingStatus: yhsiOutcomeSnapshots.housingStatus,
          hsCompletion: yhsiOutcomeSnapshots.hsCompletion,
          postSecondaryStatus: yhsiOutcomeSnapshots.postSecondaryStatus,
          employmentStatus: yhsiOutcomeSnapshots.employmentStatus,
          livableWage: yhsiOutcomeSnapshots.livableWage,
          mentorConnections: yhsiOutcomeSnapshots.mentorConnections,
          rn: sql<number>`row_number() over (partition by ${yhsiOutcomeSnapshots.participantId}, ${yhsiOutcomeSnapshots.snapshotType} order by ${yhsiOutcomeSnapshots.recordedAt} desc)`.as("rn"),
        })
        .from(yhsiOutcomeSnapshots)
        .as("latest_per_type");
      const rows = await db
        .select({
          snapshotType: latestPerType.snapshotType,
          total: sql<number>`count(*)::int`,
          stableHoused: sql<number>`count(*) filter (where housing_status like 'stable%')::int`,
          housingKnown: sql<number>`count(*) filter (where housing_status is not null and housing_status <> 'unknown')::int`,
          hsDone: sql<number>`count(*) filter (where hs_completion in ('completed','on_track','ged_track'))::int`,
          hsKnown: sql<number>`count(*) filter (where hs_completion is not null and hs_completion not in ('na','unknown'))::int`,
          postSec: sql<number>`count(*) filter (where post_secondary_status in ('enrolled','apprenticeship'))::int`,
          postSecKnown: sql<number>`count(*) filter (where post_secondary_status is not null and post_secondary_status not in ('na','unknown'))::int`,
          livableWage: sql<number>`count(*) filter (where livable_wage = true)::int`,
          livableWageKnown: sql<number>`count(*) filter (where livable_wage is not null)::int`,
          employed: sql<number>`count(*) filter (where employment_status in ('employed_ft','employed_pt'))::int`,
          employmentKnown: sql<number>`count(*) filter (where employment_status is not null and employment_status <> 'unknown')::int`,
          twoPlusMentors: sql<number>`count(*) filter (where mentor_connections >= 2)::int`,
          mentorsKnown: sql<number>`count(*) filter (where mentor_connections is not null)::int`,
        })
        .from(latestPerType)
        .where(eq(latestPerType.rn, 1))
        .groupBy(latestPerType.snapshotType);

      // MH scores are only comparable within the same validated scale —
      // PHQ-9, GAD-7, CANS etc. have incompatible ranges. Never cross-average.
      // Same dedupe: one latest snapshot per (participant, snapshotType, scale).
      const latestMh = db
        .select({
          snapshotType: yhsiOutcomeSnapshots.snapshotType,
          scale: yhsiOutcomeSnapshots.mhScaleUsed,
          score: yhsiOutcomeSnapshots.mhScaleScore,
          rn: sql<number>`row_number() over (partition by ${yhsiOutcomeSnapshots.participantId}, ${yhsiOutcomeSnapshots.snapshotType}, ${yhsiOutcomeSnapshots.mhScaleUsed} order by ${yhsiOutcomeSnapshots.recordedAt} desc)`.as("rn"),
        })
        .from(yhsiOutcomeSnapshots)
        .where(and(sql`mh_scale_score is not null`, sql`mh_scale_used is not null`))
        .as("latest_mh");
      const mhRows = await db
        .select({
          snapshotType: latestMh.snapshotType,
          scale: latestMh.scale,
          n: sql<number>`count(*)::int`,
          avg: sql<number>`round(avg(score)::numeric, 1)::float`,
        })
        .from(latestMh)
        .where(eq(latestMh.rn, 1))
        .groupBy(latestMh.snapshotType, latestMh.scale);

      const rate = (num: number, den: number) => (den >= SUPPRESSION_FLOOR ? Math.round((num / den) * 100) : null);
      const byMilestone: Record<string, any> = {};
      for (const r of rows) {
        byMilestone[r.snapshotType] = {
          youthTracked: suppress(r.total),
          stableHousingRate: rate(r.stableHoused, r.housingKnown),
          hsCompletionOrOnTrackRate: rate(r.hsDone, r.hsKnown),
          postSecondaryRate: rate(r.postSec, r.postSecKnown),
          employmentRate: rate(r.employed, r.employmentKnown),
          livableWageRate: rate(r.livableWage, r.livableWageKnown),
          twoPlusStableAdultsRate: rate(r.twoPlusMentors, r.mentorsKnown),
          mhByScale: Object.fromEntries(
            mhRows
              .filter((m) => m.snapshotType === r.snapshotType && m.n >= SUPPRESSION_FLOOR)
              .map((m) => [m.scale as string, { n: m.n, avg: m.avg }]),
          ),
        };
      }
      return res.json({
        computedAt: new Date().toISOString(),
        suppressionNote: `Rates require at least ${SUPPRESSION_FLOOR} youth in the denominator; smaller cohorts show null.`,
        milestoneOrder: MILESTONES.filter((m) => byMilestone[m]),
        byMilestone,
      });
    } catch (err) {
      console.error("[YHSI] outcomes summary failed:", err);
      return res.status(500).json({ error: "Failed to compute outcomes summary" });
    }
  });

  // ── Chafee / ETV entitlement navigation (staff) ──────────────────────────
  app.post("/api/yhsi/participants/:id/entitlements", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiEntitlementSchema.omit({ participantId: true }).extend({
        entitlementType: ENTITLEMENT_TYPES,
        status: ENTITLEMENT_STATUSES.optional(),
        annualValue: z.number().min(0).max(1000000).optional().nullable(),
      }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [participant] = await db.select({ id: yhsiYouthParticipants.id }).from(yhsiYouthParticipants).where(eq(yhsiYouthParticipants.id, String(req.params.id))).limit(1);
      if (!participant) return res.status(404).json({ error: "Participant not found" });
      const [row] = await db.insert(yhsiEntitlements).values({ ...parsed.data, id: randomUUID(), participantId: String(req.params.id), recordedBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI] entitlement create failed:", err);
      return res.status(500).json({ error: "Failed to record entitlement" });
    }
  });

  // ── Entitlement gap checklist ──────────────────────────────────────────
  // For each participant, screen against the codified federal rules
  // (shared/foster-eligibility.ts) and flag programs with NO tracked
  // entitlement record. These are screening suggestions requiring staff
  // verification — never determinations (careAfter14 and unaccompanied
  // status are not on file, so those conditions are surfaced as caveats).
  app.get("/api/yhsi/entitlements/gaps", requireStaff, async (_req: Request, res: Response) => {
    try {
      const participants = await db.select().from(yhsiYouthParticipants).orderBy(desc(yhsiYouthParticipants.createdAt)).limit(1000);
      const entitlements = await db.select({ participantId: yhsiEntitlements.participantId, entitlementType: yhsiEntitlements.entitlementType }).from(yhsiEntitlements).limit(5000);
      const tracked = new Map<string, Set<string>>();
      for (const e of entitlements) {
        if (!tracked.has(e.participantId)) tracked.set(e.participantId, new Set());
        tracked.get(e.participantId)!.add(e.entitlementType);
      }
      const KEY_TO_TYPE: Record<string, string> = { chafee: "chafee", etv: "etv", fafsa_independent: "fafsa_independent", mckinney_vento: "mckinney_vento_services" };
      const gaps: any[] = [];
      for (const p of participants) {
        if (p.ageAtContact == null) continue; // cannot screen without age — skip, never guess
        const housingUnstable = ["doubled_up", "shelter", "unsheltered", "transitional", "hotel_motel"].includes(p.livingSituation ?? "") || p.mckinneyVentoStatus === "identified";
        // screenParticipantGaps caps every result that depends on a fact NOT
        // on file (care timing, current-care status, custody) at "maybe".
        const results = screenParticipantGaps({
          age: p.ageAtContact,
          fosterCareHistory: !!p.fosterCareHistory,
          housingUnstable,
        });
        const have = tracked.get(p.id) ?? new Set();
        const missing = results
          .filter((r) => (r.eligible === "likely" || r.eligible === "maybe") && !have.has(KEY_TO_TYPE[r.key]))
          .map((r) => ({ key: r.key, entitlementType: KEY_TO_TYPE[r.key], program: r.program, screen: r.eligible, why: r.why }));
        if (missing.length > 0) {
          gaps.push({ participantId: p.id, name: `${p.preferredName || p.firstName} ${p.lastNameInitial ?? ""}.`, age: p.ageAtContact, fosterCareHistory: p.fosterCareHistory, missing });
        }
      }
      return res.json({ gaps, note: "Screening suggestions from codified federal rules — staff must verify care timing and custody status before applying." });
    } catch (err) {
      console.error("[YHSI] entitlement gaps failed:", err);
      return res.status(500).json({ error: "Failed to compute entitlement gaps" });
    }
  });

  app.get("/api/yhsi/entitlements", requireStaff, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiEntitlements).orderBy(desc(yhsiEntitlements.createdAt)).limit(2000);
      return res.json(rows);
    } catch (err) {
      console.error("[YHSI] entitlement list failed:", err);
      return res.status(500).json({ error: "Failed to list entitlements" });
    }
  });

  app.patch("/api/yhsi/entitlements/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const schema = insertYhsiEntitlementSchema.partial().omit({ participantId: true }).extend({
        entitlementType: ENTITLEMENT_TYPES.optional(),
        status: ENTITLEMENT_STATUSES.optional(),
        annualValue: z.number().min(0).max(1000000).optional().nullable(),
        appliedAt: coerceDate.optional(),
        enrolledAt: coerceDate.optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      // Status transitions auto-stamp their timestamps if not provided.
      if (parsed.data.status === "applied" && !parsed.data.appliedAt) updates.appliedAt = new Date();
      if (parsed.data.status === "enrolled" && !parsed.data.enrolledAt) updates.enrolledAt = new Date();
      const [row] = await db.update(yhsiEntitlements).set(updates).where(eq(yhsiEntitlements.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI] entitlement update failed:", err);
      return res.status(500).json({ error: "Failed to update entitlement" });
    }
  });

  // Entitlement summary — "% of participants offered / enrolled" + $ to youth
  app.get("/api/yhsi/entitlements/summary", requireStaff, async (_req: Request, res: Response) => {
    try {
      const [participants] = await db.select({ n: sql<number>`count(*)::int` }).from(yhsiYouthParticipants);
      // "Offered" must mean an offer actually extended (see
      // isOfferedEntitlementStatus): offered/applied/enrolled. Counting
      // declined/ineligible/denied records as "offered" inflated reach — a
      // youth screened ineligible was never offered the benefit. Denominators
      // for offeredRate stay consistent with this.
      const offeredStatusList = sql.join([...OFFERED_ENTITLEMENT_STATUSES].map((s) => sql`${s}`), sql`, `);
      const byType = await db
        .select({
          entitlementType: yhsiEntitlements.entitlementType,
          offered: sql<number>`count(distinct participant_id) filter (where status in (${offeredStatusList}))::int`,
          enrolled: sql<number>`count(distinct participant_id) filter (where status = 'enrolled')::int`,
          annualValue: sql<number>`coalesce(sum(annual_value) filter (where status = 'enrolled'), 0)::float`,
        })
        .from(yhsiEntitlements)
        .groupBy(yhsiEntitlements.entitlementType);
      const rate = (num: number, den: number) => (den >= SUPPRESSION_FLOOR ? Math.round((num / den) * 100) : null);
      const totalParticipants = participants?.n ?? 0;
      return res.json({
        totalParticipants: suppress(totalParticipants),
        byType: byType.map((t) => ({
          entitlementType: t.entitlementType,
          offeredCount: suppress(t.offered),
          enrolledCount: suppress(t.enrolled),
          offeredRate: rate(t.offered, totalParticipants),
          enrolledRateOfOffered: rate(t.enrolled, t.offered),
          annualDollarsToYouth: t.enrolled >= SUPPRESSION_FLOOR ? t.annualValue : null,
        })),
      });
    } catch (err) {
      console.error("[YHSI] entitlement summary failed:", err);
      return res.status(500).json({ error: "Failed to compute entitlement summary" });
    }
  });

  // ── Trauma-informed fidelity tracker (staff) ─────────────────────────────
  app.post("/api/yhsi/fidelity", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiFidelityObservationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const scores = [parsed.data.scoreRespectAgency, parsed.data.scoreStrengthsBased, parsed.data.scoreStaffRegulation, parsed.data.scoreGentleTransitions, parsed.data.scoreYouthVoiceChoice];
      if (scores.some((s) => s < 1 || s > 5)) return res.status(400).json({ error: "All domain scores must be 1-5" });
      const [row] = await db.insert(yhsiFidelityObservations).values({ ...parsed.data, id: randomUUID(), recordedBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI] fidelity create failed:", err);
      return res.status(500).json({ error: "Failed to record observation" });
    }
  });

  app.get("/api/yhsi/fidelity", requireStaff, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiFidelityObservations).orderBy(desc(yhsiFidelityObservations.observedAt)).limit(1000);
      return res.json(rows);
    } catch (err) {
      console.error("[YHSI] fidelity list failed:", err);
      return res.status(500).json({ error: "Failed to list observations" });
    }
  });

  // Quarterly fidelity trend — per-domain averages, suppressed below floor.
  app.get("/api/yhsi/fidelity/summary", requireStaff, async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          quarter: sql<string>`to_char(date_trunc('quarter', observed_at), 'YYYY "Q"Q')`,
          n: sql<number>`count(*)::int`,
          respectAgency: sql<number>`round(avg(score_respect_agency)::numeric, 2)::float`,
          strengthsBased: sql<number>`round(avg(score_strengths_based)::numeric, 2)::float`,
          staffRegulation: sql<number>`round(avg(score_staff_regulation)::numeric, 2)::float`,
          gentleTransitions: sql<number>`round(avg(score_gentle_transitions)::numeric, 2)::float`,
          youthVoiceChoice: sql<number>`round(avg(score_youth_voice_choice)::numeric, 2)::float`,
        })
        .from(yhsiFidelityObservations)
        .groupBy(sql`date_trunc('quarter', observed_at)`)
        .orderBy(sql`date_trunc('quarter', observed_at) desc`);
      return res.json(rows.map((r) => (r.n >= SUPPRESSION_FLOOR
        ? { ...r, n: r.n }
        : { quarter: r.quarter, n: suppress(r.n), respectAgency: null, strengthsBased: null, staffRegulation: null, gentleTransitions: null, youthVoiceChoice: null, note: `Fewer than ${SUPPRESSION_FLOOR} observations this quarter — averages withheld.` })));
    } catch (err) {
      console.error("[YHSI] fidelity summary failed:", err);
      return res.status(500).json({ error: "Failed to compute fidelity summary" });
    }
  });

  // ── HUD compliance milestone tracker (staff) ─────────────────────────────
  app.post("/api/yhsi/milestones", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = insertYhsiMilestoneSchema.extend({ dueAt: coerceDate, milestoneType: MILESTONE_TYPES.optional(), status: MILESTONE_STATUSES.optional() }).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const [row] = await db.insert(yhsiMilestones).values({ ...parsed.data, id: randomUUID(), createdBy: getUserId(req) ?? null }).returning();
      return res.status(201).json(row);
    } catch (err) {
      console.error("[YHSI] milestone create failed:", err);
      return res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  app.get("/api/yhsi/milestones", requireStaff, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select().from(yhsiMilestones).orderBy(yhsiMilestones.dueAt);
      const now = Date.now();
      const DAY = 86400000;
      return res.json(rows.map((m) => {
        const daysUntil = Math.ceil((m.dueAt.getTime() - now) / DAY);
        const alert = m.status !== "upcoming" ? "none"
          : daysUntil < 0 ? "overdue"
          : daysUntil <= 14 ? "due_soon"
          : daysUntil <= 45 ? "approaching"
          : "none";
        return { ...m, daysUntil, alert };
      }));
    } catch (err) {
      console.error("[YHSI] milestone list failed:", err);
      return res.status(500).json({ error: "Failed to list milestones" });
    }
  });

  app.patch("/api/yhsi/milestones/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const schema = insertYhsiMilestoneSchema.partial().extend({ dueAt: coerceDate.optional(), milestoneType: MILESTONE_TYPES.optional(), status: MILESTONE_STATUSES.optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.status === "submitted") updates.completedAt = new Date();
      const [row] = await db.update(yhsiMilestones).set(updates).where(eq(yhsiMilestones.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(row);
    } catch (err) {
      console.error("[YHSI] milestone update failed:", err);
      return res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  app.delete("/api/yhsi/milestones/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const [row] = await db.delete(yhsiMilestones).where(eq(yhsiMilestones.id, String(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json({ deleted: true });
    } catch (err) {
      console.error("[YHSI] milestone delete failed:", err);
      return res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  console.log("[YHSI] routes registered");
}

export function renderYhsiReportPdf(
  report: {
    periodStart: Date; periodEnd: Date; status: string;
    metrics: Record<string, any> | null; narrative: string | null;
    finalizedAt?: Date | null;
  },
  out: NodeJS.WritableStream,
) {
      const fmtDate = (d: Date | string | null | undefined) =>
        d ? new Date(d).toISOString().slice(0, 10) : "—";
      const fmtVal = (v: unknown, pct = false): string => {
        if (v === null || v === undefined) return "<5 (suppressed)";
        if (typeof v === "number") return pct ? `${v}%` : String(v);
        return String(v);
      };
      const titleCase = (s: string) =>
        s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      const m = (report.metrics ?? {}) as Record<string, any>;
      const NAVY = "#1a365d";
      const TEAL = "#2c7a7b";
      const GRAY = "#4a5568";
      const PAGE_W = 612;
      const MARGIN = 50;
      const W = PAGE_W - MARGIN * 2;

      const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, bufferPages: true });
      doc.pipe(out);

      // ── HUD cover header ──
      doc.rect(0, 0, PAGE_W, 130).fill(NAVY);
      doc.fontSize(10).font("Helvetica").fillColor("#bee3f8")
        .text("U.S. Department of Housing and Urban Development", MARGIN, 24, { width: W });
      doc.fontSize(17).font("Helvetica-Bold").fillColor("white")
        .text("Youth Homelessness System Improvement (YHSI)", MARGIN, 40, { width: W });
      doc.fontSize(13).font("Helvetica-Bold").fillColor("white")
        .text("Biannual Progress Report", MARGIN, 62, { width: W });
      doc.fontSize(9.5).font("Helvetica").fillColor("#bee3f8")
        .text(`Grant Agreement: CPD-2600-DC-0035  ·  Recipient: Innovative Support Services LLC / TCAF`, MARGIN, 84, { width: W });
      doc.fontSize(9.5).font("Helvetica").fillColor("#bee3f8")
        .text(`Reporting Period: ${fmtDate(report.periodStart)} to ${fmtDate(report.periodEnd)}  ·  Status: ${report.status === "final" ? "FINAL" : "DRAFT — not yet submitted"}`, MARGIN, 100, { width: W });

      doc.y = 150;

      const sectionHeader = (label: string) => {
        if (doc.y > 680) doc.addPage();
        doc.moveDown(0.8);
        doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY).text(label, MARGIN, doc.y, { width: W });
        doc.moveDown(0.2);
        doc.rect(MARGIN, doc.y, W, 1.2).fill(TEAL);
        doc.moveDown(0.5);
      };
      const kvLine = (label: string, value: string, indent = 0) => {
        if (doc.y > 710) doc.addPage();
        const x = MARGIN + indent;
        doc.fontSize(10).font("Helvetica-Bold").fillColor(GRAY).text(`${label}: `, x, doc.y, { continued: true, width: W - indent });
        doc.font("Helvetica").fillColor("#1a202c").text(value);
      };
      const mapLines = (obj: Record<string, unknown> | undefined, indent = 14) => {
        for (const [k, v] of Object.entries(obj ?? {})) kvLine(titleCase(k), fmtVal(v), indent);
      };

      // ── I. Report metadata ──
      sectionHeader("I. Report Information");
      kvLine("Reporting Period", `${fmtDate(report.periodStart)} to ${fmtDate(report.periodEnd)}`);
      kvLine("Report Status", report.status === "final" ? "Final" : "Draft");
      kvLine("Metrics Computed At", m.computedAt ? String(m.computedAt).slice(0, 19).replace("T", " ") + " UTC" : "—");
      if (report.finalizedAt) kvLine("Finalized At", fmtDate(report.finalizedAt));

      // ── II. Metrics ──
      sectionHeader("II. Performance Metrics");
      if (m.suppressionNote) {
        doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(GRAY)
          .text(`Data privacy note: ${m.suppressionNote}`, MARGIN, doc.y, { width: W });
        doc.moveDown(0.6);
      }
      kvLine("Youth Participants Enrolled (period)", fmtVal(m.participants));
      doc.moveDown(0.4);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text("A. Referral Pathway Performance", MARGIN, doc.y, { width: W });
      doc.moveDown(0.2);
      kvLine("Total Referrals", fmtVal(m.referrals?.total), 14);
      kvLine("Resolution Rate", fmtVal(m.referrals?.resolutionRate, true), 14);
      kvLine("Avg Days to First Contact", fmtVal(m.referrals?.avgDaysToFirstContact), 14);
      if (m.referrals?.byStatus && Object.keys(m.referrals.byStatus).length) {
        kvLine("Referrals by Status", "", 14);
        mapLines(m.referrals.byStatus, 28);
      }
      if (m.referrals?.byService && Object.keys(m.referrals.byService).length) {
        kvLine("Referrals by Service Type", "", 14);
        mapLines(m.referrals.byService, 28);
      }
      doc.moveDown(0.4);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text("B. Housing Stability at 6 Months", MARGIN, doc.y, { width: W });
      doc.moveDown(0.2);
      kvLine("Youth with 6-Month Snapshot", fmtVal(m.housingStabilityAt6Months?.total), 14);
      kvLine("Stably Housed", fmtVal(m.housingStabilityAt6Months?.stable), 14);
      kvLine("Stability Rate", fmtVal(m.housingStabilityAt6Months?.stableRate, true), 14);
      if (m.housingStabilityAt6Months?.byStatus && Object.keys(m.housingStabilityAt6Months.byStatus).length) {
        kvLine("By Housing Status", "", 14);
        mapLines(m.housingStabilityAt6Months.byStatus, 28);
      }
      doc.moveDown(0.4);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(NAVY).text("C. Youth Leadership & Voice", MARGIN, doc.y, { width: W });
      doc.moveDown(0.2);
      kvLine("Total Youth Voice Submissions", fmtVal(m.youthVoice?.total), 14);
      kvLine("Incorporated into Programming", fmtVal(m.youthVoice?.incorporated), 14);
      if (m.youthVoice?.byStatus && Object.keys(m.youthVoice.byStatus).length) {
        kvLine("Submissions by Status", "", 14);
        mapLines(m.youthVoice.byStatus, 28);
      }

      // ── III. Narrative ──
      sectionHeader("III. Progress Narrative");
      const narrative = (report.narrative ?? "").trim();
      doc.fontSize(10).font("Helvetica").fillColor("#1a202c")
        .text(narrative || "[No narrative on file for this report.]", MARGIN, doc.y, { width: W, align: "left", lineGap: 2 });

      // ── Footer with page numbers on every page ──
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font("Helvetica-Oblique").fillColor(GRAY)
          .text(
            `YHSI Biannual Progress Report · CPD-2600-DC-0035 · ${fmtDate(report.periodStart)}–${fmtDate(report.periodEnd)} · Page ${i - range.start + 1} of ${range.count}`,
            MARGIN, 755, { width: W, align: "center", lineBreak: false },
          );
      }
      doc.end();
}
