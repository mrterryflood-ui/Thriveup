import type { Express, NextFunction, Request, Response } from "express";
import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import {
  nonprofitEventActions,
  nonprofitEventAttendance,
  nonprofitEventAuditLog,
  nonprofitEventHandoffs,
  nonprofitEventNeeds,
  nonprofitEvents,
  nonprofitEventStories,
  organizationMembers,
} from "@shared/schema";
import { db, storage } from "./storage";
import {
  getCallerOrg,
  getUserId,
  isEventWorkspaceActiveMemberRole,
  isEventWorkspacePlatformStaffRole,
  loadCallerOrg,
  requireAuth,
  requireOrg,
} from "./tenant-middleware";

const eventStatuses = ["planned", "scheduled", "completed"] as const;
const actionStatuses = ["planned", "in_progress", "blocked", "completed"] as const;
const evidenceStatuses = ["observed", "derived", "self_reported", "partner_report", "needs_review"] as const;
const handoffClaimTypes = ["observed", "derived", "modeled", "partner_reported", "self_reported", "unavailable"] as const;
const attendanceSources = ["self_reported", "observed", "partner_reported", "unknown"] as const;
const audiences = ["private", "internal_team", "partner", "funder", "public"] as const;
const sharingStates = ["draft", "approved", "withdrawn"] as const;
const dateText = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.")
  .refine((value) => new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value, "Use a real calendar date.");
const timeText = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour HH:MM time.").nullable().optional();
const nullableCount = z.number().int().min(0).nullable();
const EVENT_TRANSITIONS: Record<string, readonly string[]> = {
  planned: ["scheduled"],
  scheduled: ["completed"],
  completed: [],
};
const ACTION_TRANSITIONS: Record<string, readonly string[]> = {
  planned: ["in_progress", "blocked", "completed"],
  in_progress: ["blocked", "completed"],
  blocked: ["in_progress", "completed"],
  completed: [],
};
const STORY_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["approved"],
  approved: ["withdrawn"],
  withdrawn: [],
};

const eventFieldsSchema = z.object({
  title: z.string().trim().min(2).max(240),
  purpose: z.string().trim().min(2).max(5000),
  eventDate: dateText,
  startTime: timeText,
  endTime: timeText,
  format: z.enum(["in_person", "virtual", "hybrid"]).default("in_person"),
  locationName: z.string().trim().max(240).optional().nullable(),
  locationDetails: z.string().trim().max(500).optional().nullable(),
  serviceArea: z.string().trim().min(2).max(240),
  communityNeedFocus: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
});
const eventCreateSchema = eventFieldsSchema.superRefine((value, ctx) => {
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time." });
  }
});
const eventUpdateSchema = eventFieldsSchema.partial().extend({
  status: z.enum(eventStatuses).optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one event field to update.");

const attendanceSchema = z.object({
  invitedCount: nullableCount,
  registeredCount: nullableCount,
  attendedCount: nullableCount,
  followUpCount: nullableCount,
  valueSource: z.enum(attendanceSources),
}).strict().superRefine((value, ctx) => {
  if (value.invitedCount !== null && value.registeredCount !== null && value.registeredCount > value.invitedCount) {
    ctx.addIssue({ code: "custom", path: ["registeredCount"], message: "Registered count cannot exceed invited count." });
  }
  if (value.registeredCount !== null && value.attendedCount !== null && value.attendedCount > value.registeredCount) {
    ctx.addIssue({ code: "custom", path: ["attendedCount"], message: "Attended count cannot exceed registered count." });
  }
  if (value.attendedCount !== null && value.followUpCount !== null && value.followUpCount > value.attendedCount) {
    ctx.addIssue({ code: "custom", path: ["followUpCount"], message: "Follow-up count cannot exceed attended count." });
  }
  if (value.invitedCount !== null && value.attendedCount !== null && value.attendedCount > value.invitedCount) {
    ctx.addIssue({ code: "custom", path: ["attendedCount"], message: "Attended count cannot exceed invited count." });
  }
  if (value.registeredCount !== null && value.followUpCount !== null && value.followUpCount > value.registeredCount) {
    ctx.addIssue({ code: "custom", path: ["followUpCount"], message: "Follow-up count cannot exceed registered count." });
  }
});

const needCreateSchema = z.object({
  needArea: z.string().trim().min(2).max(160),
  sourceName: z.string().trim().min(2).max(240),
  sourceUrl: z.string().trim().url().max(1000).nullable().optional(),
  geography: z.string().trim().min(2).max(240),
  evidenceStatus: z.enum(evidenceStatuses),
  responseExplanation: z.string().trim().min(5).max(5000),
});
const needUpdateSchema = needCreateSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one need field to update.");

const actionFieldsSchema = z.object({
  title: z.string().trim().min(2).max(240),
  ownerLabel: z.string().trim().min(2).max(160),
  dueDate: dateText.nullable().optional(),
  status: z.enum(actionStatuses),
  completionEvidence: z.string().trim().max(5000).nullable().optional(),
  nextStep: z.string().trim().max(5000).nullable().optional(),
  followUpObservation: z.string().trim().max(5000).nullable().optional(),
});
const actionCreateSchema = actionFieldsSchema.extend({
  status: z.enum(actionStatuses).default("planned"),
}).superRefine((value, ctx) => {
  if (value.status === "completed" && !value.completionEvidence) {
    ctx.addIssue({ code: "custom", path: ["completionEvidence"], message: "Completion evidence is required when an action is completed." });
  }
});
const actionUpdateSchema = actionFieldsSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one action field to update.");

const handoffCreateSchema = z.object({
  sourceKind: z.enum(["community_brief", "time_place_need"]),
  sourceVersion: z.string().trim().regex(/^[a-z0-9][a-z0-9._/-]{0,63}$/, "Use a canonical lowercase source version."),
  issue: z.string().trim().min(2).max(500),
  geography: z.string().trim().min(2).max(240),
  evidenceRefs: z.array(z.string().url().max(1000)).max(20),
  freshnessAt: z.string().datetime({ offset: true }).refine((value) => new Date(value).getTime() <= Date.now() + 10 * 60 * 1000, "Freshness cannot be in the future."),
  claimTypes: z.array(z.enum(handoffClaimTypes)).min(1).max(8),
  resourceVerification: z.enum(["verified", "source-listed-unverified", "unknown"]),
  consentBoundary: z.string().trim().min(2).max(1000),
  unresolvedGaps: z.array(z.string().trim().min(1).max(500)).max(20),
  sourceSnapshot: z.object({
    geography: z.object({
      displayName: z.string().trim().min(1).max(240).optional(),
      analyticalUnit: z.string().trim().max(120).optional(),
    }).strict().optional(),
    sourceCount: z.number().int().min(0).max(20).optional(),
    disclosure: z.string().trim().min(2).max(1000),
  }).strict(),
}).strict();

const handoffAcceptSchema = z.object({
  eventId: z.string().trim().min(1).max(100).optional(),
  newEvent: eventCreateSchema.optional(),
  needResponseExplanation: z.string().trim().min(5).max(5000),
  action: actionCreateSchema,
}).strict().superRefine((value, ctx) => {
  if (!value.eventId && !value.newEvent) ctx.addIssue({ code: "custom", path: ["eventId"], message: "Choose an existing event or provide a new event." });
  if (value.eventId && value.newEvent) ctx.addIssue({ code: "custom", path: ["eventId"], message: "Choose either an existing event or a new event, not both." });
});

const storyCreateSchema = z.object({
  title: z.string().trim().min(2).max(240),
  storyText: z.string().trim().min(5).max(10000),
  attributionPreference: z.enum(["anonymous", "first_name", "organization", "named"]).default("anonymous"),
  intendedAudience: z.enum(audiences).default("private"),
  permittedUses: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  consentGranted: z.boolean().default(false),
  sharingState: z.enum(sharingStates).default("draft"),
});
const storyUpdateSchema = storyCreateSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one story field to update.");

type AccessibleEvent = typeof nonprofitEvents.$inferSelect;
type EventTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

class EventMutationError extends Error {
  constructor(
    readonly statusCode: 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = "EventMutationError";
  }
}

function asNullableText(value: string | null | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

async function callerIsStaff(req: Request): Promise<boolean> {
  const userId = getUserId(req);
  const org = getCallerOrg(req);
  if (!userId || !org) return false;
  const [user, membership] = await Promise.all([
    storage.getUser(userId),
    db.select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.orgId, org.id)))
      .limit(1)
      .then((rows) => rows[0]),
  ]);
  return Boolean(
    user
    && isEventWorkspacePlatformStaffRole(user.role)
    && membership
    && isEventWorkspaceActiveMemberRole(membership.role),
  );
}

async function requireStaff(req: Request, res: Response, next: NextFunction) {
  try {
    if (await callerIsStaff(req)) return next();
    return res.status(403).json({ error: "Staff access required for the private organization event workspace." });
  } catch (err) {
    console.error("[nonprofit-events] staff authorization failed:", err);
    return res.status(500).json({ error: "Unable to verify staff access." });
  }
}

async function getAccessibleEvent(req: Request, res: Response, eventId: string, writing = false): Promise<AccessibleEvent | null> {
  const [event] = await db.select().from(nonprofitEvents).where(eq(nonprofitEvents.id, eventId));
  if (!event) {
    res.status(404).json({ error: "Event not found." });
    return null;
  }
  const callerOrg = getCallerOrg(req);
  if (callerOrg?.id !== event.orgId) {
    res.status(404).json({ error: "Event not found." });
    return null;
  }
  if (writing && event.status === "archived") {
    res.status(409).json({ error: "Archived events are read-only." });
    return null;
  }
  return event;
}

async function lockEventForMutation(tx: EventTransaction, req: Request, eventId: string): Promise<AccessibleEvent> {
  const orgId = getCallerOrg(req)?.id;
  if (!orgId) throw new EventMutationError(404, "Event not found.");
  const [event] = await tx.select().from(nonprofitEvents)
    .where(and(eq(nonprofitEvents.id, eventId), eq(nonprofitEvents.orgId, orgId)))
    .for("update");
  if (!event) throw new EventMutationError(404, "Event not found.");
  return event;
}

async function lockWritableEvent(tx: EventTransaction, req: Request, eventId: string): Promise<AccessibleEvent> {
  const event = await lockEventForMutation(tx, req, eventId);
  if (event.status === "archived") {
    throw new EventMutationError(409, "Archived events are read-only.");
  }
  return event;
}

function sendEventMutationError(res: Response, err: unknown, fallbackStatus: number, fallbackMessage: string) {
  const status = err instanceof EventMutationError ? err.statusCode : err instanceof z.ZodError ? 400 : fallbackStatus;
  const message = err instanceof EventMutationError
    ? err.message
    : err instanceof z.ZodError
      ? err.message
    : err instanceof Error
      ? err.message
      : fallbackMessage;
  res.status(status).json({ error: message });
}

function hasAllowedTransition(transitions: Record<string, readonly string[]>, from: string, to: string) {
  return from === to || transitions[from]?.includes(to) === true;
}

async function recordAudit(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: { orgId: string; eventId: string | null; entityType: string; entityId: string; action: string; actorUserId: string; details?: Record<string, unknown> },
) {
  await tx.insert(nonprofitEventAuditLog).values({
    ...input,
    details: input.details ?? {},
  });
}

function safeAttendance(rows: ReadonlyArray<typeof nonprofitEventAttendance.$inferSelect>) {
  const fields = ["invitedCount", "registeredCount", "attendedCount", "followUpCount"] as const;
  if (rows.length === 0) {
    return {
      ...Object.fromEntries(fields.map((field) => [field, { value: null, disclosure: "Unknown or incomplete" }])),
      attendanceRatePct: null,
      attendanceRateDisclosure: "Not shown when the underlying attendance data are unknown or suppressed.",
      sourceLabels: [] as string[],
    };
  }
  const values = Object.fromEntries(fields.map((field) => {
    const allKnown = rows.every((row) => row[field] !== null);
    const total = allKnown ? rows.reduce((sum, row) => sum + (row[field] ?? 0), 0) : null;
    if (!allKnown) return [field, { value: null, disclosure: "Unknown or incomplete" }];
    if (total! > 0 && total! < 5) return [field, { value: null, disclosure: "Suppressed (fewer than 5)" }];
    return [field, { value: total, disclosure: "Aggregate only" }];
  })) as Record<typeof fields[number], { value: number | null; disclosure: string }>;
  const rate = values.invitedCount.value !== null && values.attendedCount.value !== null && values.invitedCount.value >= 5 && values.attendedCount.value >= 5
    ? Math.round((values.attendedCount.value / values.invitedCount.value) * 100)
    : null;
  return {
    ...values,
    attendanceRatePct: rate,
    attendanceRateDisclosure: rate === null ? "Not shown when the underlying attendance data are unknown or suppressed." : "Aggregate rate",
    sourceLabels: [...new Set(rows.map((row) => row.valueSource))],
  };
}

function summarize(events: ReadonlyArray<typeof nonprofitEvents.$inferSelect>, attendance: ReadonlyArray<typeof nonprofitEventAttendance.$inferSelect>, needs: ReadonlyArray<typeof nonprofitEventNeeds.$inferSelect>, actions: ReadonlyArray<typeof nonprofitEventActions.$inferSelect>, handoffs: ReadonlyArray<typeof nonprofitEventHandoffs.$inferSelect> = []) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    eventCount: events.filter((event) => event.status !== "archived").length,
    archivedEventCount: events.filter((event) => event.status === "archived").length,
    needsLinked: needs.length,
    actions: {
      total: actions.length,
      completed: actions.filter((action) => action.status === "completed").length,
      blocked: actions.filter((action) => action.status === "blocked").length,
      overdue: actions.filter((action) => Boolean(action.dueDate) && action.dueDate! < today && action.status !== "completed").length,
      withFollowUp: actions.filter((action) => Boolean(action.followUpObservation?.trim())).length,
    },
    handoffs: {
      total: handoffs.length,
      pendingReview: handoffs.filter((handoff) => handoff.status === "pending_review").length,
      accepted: handoffs.filter((handoff) => handoff.status === "accepted").length,
      declined: handoffs.filter((handoff) => handoff.status === "declined").length,
    },
    attendance: safeAttendance(attendance),
  };
}

async function buildWorkspace(orgId: string) {
  const events = await db.select().from(nonprofitEvents)
    .where(eq(nonprofitEvents.orgId, orgId))
    .orderBy(desc(nonprofitEvents.eventDate), desc(nonprofitEvents.createdAt));
  const eventIds = events.map((event) => event.id);
  const [attendance, needs, actions, stories, handoffs] = await Promise.all([
      eventIds.length ? db.select().from(nonprofitEventAttendance).where(inArray(nonprofitEventAttendance.eventId, eventIds)) : Promise.resolve([]),
      eventIds.length ? db.select().from(nonprofitEventNeeds).where(inArray(nonprofitEventNeeds.eventId, eventIds)).orderBy(desc(nonprofitEventNeeds.createdAt)) : Promise.resolve([]),
      eventIds.length ? db.select().from(nonprofitEventActions).where(inArray(nonprofitEventActions.eventId, eventIds)).orderBy(desc(nonprofitEventActions.updatedAt)) : Promise.resolve([]),
      eventIds.length ? db.select().from(nonprofitEventStories).where(inArray(nonprofitEventStories.eventId, eventIds)).orderBy(desc(nonprofitEventStories.updatedAt)) : Promise.resolve([]),
      db.select().from(nonprofitEventHandoffs).where(eq(nonprofitEventHandoffs.orgId, orgId)).orderBy(desc(nonprofitEventHandoffs.createdAt)),
    ]);

  return {
    events: events.map((event) => ({
      ...event,
      attendance: attendance.find((row) => row.eventId === event.id) ?? null,
      needs: needs.filter((row) => row.eventId === event.id),
      actions: actions.filter((row) => row.eventId === event.id),
      stories: stories.filter((row) => row.eventId === event.id),
    })),
    summary: summarize(events, attendance, needs, actions, handoffs),
    handoffs,
  };
}

function ensureShareable(story: {
  consentGranted: boolean;
  attributionPreference: string;
  intendedAudience: string;
  permittedUses: string[];
  sharingState: string;
}) {
  if (story.sharingState !== "approved") return;
  if (!story.consentGranted || !story.attributionPreference || story.intendedAudience === "private" || story.permittedUses.length === 0) {
    throw new Error("An approved story requires explicit consent, attribution preference, a non-private audience, and at least one permitted use.");
  }
}

export function registerNonprofitEventRoutes(app: Express) {
  app.get("/api/nonprofit-events/access", requireAuth, loadCallerOrg, requireOrg, async (req: Request, res: Response) => {
    try {
      res.json({ authorized: await callerIsStaff(req) });
    } catch (err) {
      console.error("[nonprofit-events] access-status check failed:", err);
      res.status(500).json({ error: "Unable to verify event workspace access." });
    }
  });

  app.get("/api/nonprofit-events/workspace", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const org = getCallerOrg(req)!;
      const workspace = await buildWorkspace(org.id);
      res.json({ organization: org, ...workspace, privacyNotice: "Attendance is aggregate-only. Draft stories remain private until explicitly approved." });
    } catch (err) {
      console.error("[nonprofit-events] workspace load failed:", err);
      res.status(500).json({ error: "Failed to load the organization event workspace." });
    }
  });

  app.post("/api/nonprofit-events/handoffs", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const org = getCallerOrg(req)!;
      const userId = getUserId(req)!;
      const input = handoffCreateSchema.parse(req.body);
      const [handoff] = await db.transaction(async (tx) => {
        const [created] = await tx.insert(nonprofitEventHandoffs).values({
          ...input,
          freshnessAt: new Date(input.freshnessAt),
          orgId: org.id,
          status: "pending_review",
          createdByUserId: userId,
        }).returning();
        await recordAudit(tx, {
          orgId: org.id,
          eventId: null,
          entityType: "evidence_handoff",
          entityId: created.id,
          action: "created",
          actorUserId: userId,
          details: { sourceKind: created.sourceKind, sourceVersion: created.sourceVersion, status: created.status },
        });
        return [created];
      });
      res.status(201).json({ handoff });
    } catch (err) {
      console.error("[nonprofit-events] handoff create failed:", err);
      res.status(err instanceof z.ZodError ? 400 : 500).json({ error: err instanceof z.ZodError ? err.message : "Evidence handoff could not be saved." });
    }
  });

  app.patch("/api/nonprofit-events/handoffs/:handoffId/decline", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const org = getCallerOrg(req)!;
      const userId = getUserId(req)!;
      const [handoff] = await db.transaction(async (tx) => {
        const [current] = await tx.select().from(nonprofitEventHandoffs)
          .where(and(eq(nonprofitEventHandoffs.id, String(req.params.handoffId)), eq(nonprofitEventHandoffs.orgId, org.id)))
          .for("update");
        if (!current) throw new EventMutationError(404, "Evidence handoff not found.");
        if (current.status !== "pending_review") throw new EventMutationError(409, "This evidence handoff has already been reviewed.");
        const [updated] = await tx.update(nonprofitEventHandoffs).set({
          status: "declined",
          reviewedByUserId: userId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
          version: current.version + 1,
        }).where(and(eq(nonprofitEventHandoffs.id, current.id), eq(nonprofitEventHandoffs.orgId, org.id), eq(nonprofitEventHandoffs.version, current.version))).returning();
        await recordAudit(tx, { orgId: org.id, eventId: null, entityType: "evidence_handoff", entityId: current.id, action: "declined", actorUserId: userId, details: { sourceKind: current.sourceKind, issue: current.issue } });
        return [updated];
      });
      res.json({ handoff });
    } catch (err) {
      console.error("[nonprofit-events] handoff decline failed:", err);
      sendEventMutationError(res, err, 400, "Evidence handoff could not be declined.");
    }
  });

  app.post("/api/nonprofit-events/handoffs/:handoffId/accept", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const org = getCallerOrg(req)!;
      const userId = getUserId(req)!;
      const input = handoffAcceptSchema.parse(req.body);
      const result = await db.transaction(async (tx) => {
        const [handoff] = await tx.select().from(nonprofitEventHandoffs)
          .where(and(eq(nonprofitEventHandoffs.id, String(req.params.handoffId)), eq(nonprofitEventHandoffs.orgId, org.id)))
          .for("update");
        if (!handoff) throw new EventMutationError(404, "Evidence handoff not found.");
        if (handoff.status !== "pending_review") throw new EventMutationError(409, "This evidence handoff has already been reviewed.");

        let event: AccessibleEvent;
        if (input.eventId) {
          event = await lockWritableEvent(tx, req, input.eventId);
        } else {
          const [created] = await tx.insert(nonprofitEvents).values({
            ...input.newEvent!,
            startTime: asNullableText(input.newEvent!.startTime),
            endTime: asNullableText(input.newEvent!.endTime),
            locationName: asNullableText(input.newEvent!.locationName),
            locationDetails: asNullableText(input.newEvent!.locationDetails),
            orgId: org.id,
            createdByUserId: userId,
            updatedByUserId: userId,
          }).returning();
          event = created;
          await recordAudit(tx, { orgId: org.id, eventId: event.id, entityType: "event", entityId: event.id, action: "created_from_evidence_handoff", actorUserId: userId, details: { handoffId: handoff.id } });
        }

        const evidenceStatus = handoff.claimTypes.includes("modeled")
          ? "needs_review"
          : handoff.claimTypes.includes("self_reported")
          ? "self_reported"
          : handoff.claimTypes.includes("partner_reported")
            ? "partner_report"
            : handoff.claimTypes.includes("observed")
              ? "observed"
              : handoff.claimTypes.includes("derived")
                ? "derived"
                : "needs_review";
        const [need] = await tx.insert(nonprofitEventNeeds).values({
          eventId: event.id,
          orgId: org.id,
          needArea: handoff.issue.slice(0, 160),
          sourceName: `${handoff.sourceKind} evidence handoff`,
          sourceUrl: handoff.evidenceRefs[0] ?? null,
          geography: handoff.geography,
          evidenceStatus,
          responseExplanation: input.needResponseExplanation,
          createdByUserId: userId,
        }).returning();
        const [action] = await tx.insert(nonprofitEventActions).values({
          ...input.action,
          dueDate: input.action.dueDate ?? null,
          completionEvidence: asNullableText(input.action.completionEvidence),
          nextStep: asNullableText(input.action.nextStep),
          followUpObservation: asNullableText(input.action.followUpObservation),
          completedAt: input.action.status === "completed" ? new Date() : null,
          eventId: event.id,
          orgId: org.id,
          handoffId: handoff.id,
          createdByUserId: userId,
          updatedByUserId: userId,
        }).returning();
        const [accepted] = await tx.update(nonprofitEventHandoffs).set({
          status: "accepted",
          eventId: event.id,
          needId: need.id,
          actionId: action.id,
          reviewedByUserId: userId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
          version: handoff.version + 1,
        }).where(and(eq(nonprofitEventHandoffs.id, handoff.id), eq(nonprofitEventHandoffs.orgId, org.id), eq(nonprofitEventHandoffs.version, handoff.version))).returning();
        if (!accepted) throw new EventMutationError(409, "This evidence handoff changed before it could be accepted.");
        await recordAudit(tx, { orgId: org.id, eventId: event.id, entityType: "evidence_handoff", entityId: handoff.id, action: "accepted", actorUserId: userId, details: { claimTypes: handoff.claimTypes, resourceVerification: handoff.resourceVerification, unresolvedGapCount: handoff.unresolvedGaps.length, needId: need.id, actionId: action.id } });
        await recordAudit(tx, { orgId: org.id, eventId: event.id, entityType: "need_link", entityId: need.id, action: "created_from_evidence_handoff", actorUserId: userId, details: { handoffId: handoff.id, evidenceStatus } });
        await recordAudit(tx, { orgId: org.id, eventId: event.id, entityType: "action", entityId: action.id, action: "created_from_evidence_handoff", actorUserId: userId, details: { handoffId: handoff.id, status: action.status } });
        return { handoff: accepted, event, need, action };
      });
      res.status(201).json(result);
    } catch (err) {
      console.error("[nonprofit-events] handoff accept failed:", err);
      sendEventMutationError(res, err, 500, "Evidence handoff could not be accepted.");
    }
  });

  app.post("/api/nonprofit-events/events", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const org = getCallerOrg(req)!;
      const userId = getUserId(req)!;
      const input = eventCreateSchema.parse(req.body);
      const [event] = await db.transaction(async (tx) => {
        const [created] = await tx.insert(nonprofitEvents).values({
          ...input,
          startTime: asNullableText(input.startTime),
          endTime: asNullableText(input.endTime),
          locationName: asNullableText(input.locationName),
          locationDetails: asNullableText(input.locationDetails),
          orgId: org.id,
          createdByUserId: userId,
          updatedByUserId: userId,
        }).returning();
        await recordAudit(tx, { orgId: org.id, eventId: created.id, entityType: "event", entityId: created.id, action: "created", actorUserId: userId, details: { fields: Object.keys(input) } });
        return [created];
      });
      res.status(201).json({ event });
    } catch (err) {
      console.error("[nonprofit-events] event create failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Unable to create the event." });
    }
  });

  app.patch("/api/nonprofit-events/events/:eventId", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = eventUpdateSchema.parse(req.body);
      const [updated] = await db.transaction(async (tx) => {
        const event = await lockWritableEvent(tx, req, String(req.params.eventId));
        if (input.status && !hasAllowedTransition(EVENT_TRANSITIONS, event.status, input.status)) {
          throw new Error(`Cannot move an event from ${event.status} back to ${input.status}.`);
        }
        const nextStart = input.startTime === undefined ? event.startTime : input.startTime;
        const nextEnd = input.endTime === undefined ? event.endTime : input.endTime;
        if (nextStart && nextEnd && nextEnd <= nextStart) {
          throw new Error("End time must be after start time.");
        }
        const [row] = await tx.update(nonprofitEvents).set({
          ...input,
          startTime: input.startTime === undefined ? undefined : asNullableText(input.startTime),
          endTime: input.endTime === undefined ? undefined : asNullableText(input.endTime),
          locationName: input.locationName === undefined ? undefined : asNullableText(input.locationName),
          locationDetails: input.locationDetails === undefined ? undefined : asNullableText(input.locationDetails),
          updatedByUserId: userId,
          updatedAt: new Date(),
        }).where(and(
          eq(nonprofitEvents.id, event.id),
          eq(nonprofitEvents.orgId, event.orgId),
        )).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "event", entityId: event.id, action: "updated", actorUserId: userId, details: { fields: Object.keys(input) } });
        return [row];
      });
      res.json({ event: updated });
    } catch (err) {
      console.error("[nonprofit-events] event update failed:", err);
      sendEventMutationError(res, err, 400, "Unable to update the event.");
    }
  });

  app.post("/api/nonprofit-events/events/:eventId/archive", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const result = await db.transaction(async (tx) => {
        const event = await lockEventForMutation(tx, req, String(req.params.eventId));
        if (event.status === "archived") return { event, alreadyArchived: true };
        const [row] = await tx.update(nonprofitEvents).set({
          status: "archived", archivedAt: new Date(), updatedAt: new Date(), updatedByUserId: userId,
        }).where(eq(nonprofitEvents.id, event.id)).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "event", entityId: event.id, action: "archived", actorUserId: userId });
        return { event: row, alreadyArchived: false };
      });
      res.json(result);
    } catch (err) {
      console.error("[nonprofit-events] event archive failed:", err);
      sendEventMutationError(res, err, 500, "Unable to archive the event.");
    }
  });

  app.put("/api/nonprofit-events/events/:eventId/attendance", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = attendanceSchema.parse(req.body);
      const [attendance] = await db.transaction(async (tx) => {
        const event = await lockWritableEvent(tx, req, String(req.params.eventId));
        const [row] = await tx.insert(nonprofitEventAttendance).values({
          ...input, eventId: event.id, recordedByUserId: userId,
        }).onConflictDoUpdate({
          target: nonprofitEventAttendance.eventId,
          set: { ...input, recordedByUserId: userId, updatedAt: new Date() },
        }).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "attendance", entityId: row.id, action: "recorded", actorUserId: userId, details: { valueSource: input.valueSource } });
        return [row];
      });
      res.json({ attendance });
    } catch (err) {
      console.error("[nonprofit-events] attendance update failed:", err);
      sendEventMutationError(res, err, 400, "Attendance counts could not be saved.");
    }
  });

  app.post("/api/nonprofit-events/events/:eventId/needs", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = needCreateSchema.parse(req.body);
      const [need] = await db.transaction(async (tx) => {
        const event = await lockWritableEvent(tx, req, String(req.params.eventId));
        const [row] = await tx.insert(nonprofitEventNeeds).values({ ...input, sourceUrl: asNullableText(input.sourceUrl), eventId: event.id, orgId: event.orgId, createdByUserId: userId }).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "need_link", entityId: row.id, action: "created", actorUserId: userId, details: { needArea: row.needArea, evidenceStatus: row.evidenceStatus } });
        return [row];
      });
      res.status(201).json({ need });
    } catch (err) {
      console.error("[nonprofit-events] need create failed:", err);
      sendEventMutationError(res, err, 400, "Need link could not be created.");
    }
  });

  app.patch("/api/nonprofit-events/needs/:needId", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = needUpdateSchema.parse(req.body);
      const [updated] = await db.transaction(async (tx) => {
        const [need] = await tx.select().from(nonprofitEventNeeds)
          .where(eq(nonprofitEventNeeds.id, String(req.params.needId)))
          .for("update");
        if (!need) throw new EventMutationError(404, "Need link not found.");
        const event = await lockWritableEvent(tx, req, need.eventId);
        const [row] = await tx.update(nonprofitEventNeeds).set({
          ...input, sourceUrl: input.sourceUrl === undefined ? undefined : asNullableText(input.sourceUrl), updatedAt: new Date(),
        }).where(and(
          eq(nonprofitEventNeeds.id, need.id),
          eq(nonprofitEventNeeds.eventId, event.id),
          eq(nonprofitEventNeeds.orgId, event.orgId),
        )).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "need_link", entityId: need.id, action: "updated", actorUserId: userId, details: { fields: Object.keys(input) } });
        return [row];
      });
      res.json({ need: updated });
    } catch (err) {
      console.error("[nonprofit-events] need update failed:", err);
      sendEventMutationError(res, err, 400, "Need link could not be updated.");
    }
  });

  app.delete("/api/nonprofit-events/needs/:needId", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      await db.transaction(async (tx) => {
        const [need] = await tx.select().from(nonprofitEventNeeds)
          .where(eq(nonprofitEventNeeds.id, String(req.params.needId)))
          .for("update");
        if (!need) throw new EventMutationError(404, "Need link not found.");
        const event = await lockWritableEvent(tx, req, need.eventId);
        await tx.delete(nonprofitEventNeeds).where(and(
          eq(nonprofitEventNeeds.id, need.id),
          eq(nonprofitEventNeeds.eventId, event.id),
          eq(nonprofitEventNeeds.orgId, event.orgId),
        ));
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "need_link", entityId: need.id, action: "removed", actorUserId: userId, details: { needArea: need.needArea } });
      });
      res.json({ ok: true });
    } catch (err) {
      console.error("[nonprofit-events] need delete failed:", err);
      sendEventMutationError(res, err, 500, "Need link could not be removed.");
    }
  });

  app.post("/api/nonprofit-events/events/:eventId/actions", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = actionCreateSchema.parse(req.body);
      const [action] = await db.transaction(async (tx) => {
        const event = await lockWritableEvent(tx, req, String(req.params.eventId));
        const [row] = await tx.insert(nonprofitEventActions).values({
          ...input, dueDate: input.dueDate ?? null, completionEvidence: asNullableText(input.completionEvidence), nextStep: asNullableText(input.nextStep), followUpObservation: asNullableText(input.followUpObservation),
          completedAt: input.status === "completed" ? new Date() : null, eventId: event.id, orgId: event.orgId, createdByUserId: userId, updatedByUserId: userId,
        }).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "action", entityId: row.id, action: "created", actorUserId: userId, details: { status: row.status } });
        return [row];
      });
      res.status(201).json({ action });
    } catch (err) {
      console.error("[nonprofit-events] action create failed:", err);
      sendEventMutationError(res, err, 400, "Action could not be created.");
    }
  });

  app.patch("/api/nonprofit-events/actions/:actionId", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = actionUpdateSchema.parse(req.body);
      const [updated] = await db.transaction(async (tx) => {
        const [action] = await tx.select().from(nonprofitEventActions)
          .where(eq(nonprofitEventActions.id, String(req.params.actionId)))
          .for("update");
        if (!action) throw new EventMutationError(404, "Action not found.");
        const event = await lockWritableEvent(tx, req, action.eventId);
        const next = { ...action, ...input };
        if (input.status && !hasAllowedTransition(ACTION_TRANSITIONS, action.status, input.status)) {
          throw new Error(`Cannot move an action from ${action.status} back to ${input.status}. Create a new action if prior work needs to be revisited.`);
        }
        if (next.status === "completed" && !next.completionEvidence) {
          throw new Error("Completion evidence is required when an action is completed.");
        }
        const [row] = await tx.update(nonprofitEventActions).set({
          ...input,
          dueDate: input.dueDate === undefined ? undefined : input.dueDate,
          completionEvidence: input.completionEvidence === undefined ? undefined : asNullableText(input.completionEvidence),
          nextStep: input.nextStep === undefined ? undefined : asNullableText(input.nextStep),
           followUpObservation: input.followUpObservation === undefined ? undefined : asNullableText(input.followUpObservation),
          completedAt: next.status === "completed" ? (action.completedAt ?? new Date()) : null,
          updatedByUserId: userId,
          updatedAt: new Date(),
        }).where(and(
          eq(nonprofitEventActions.id, action.id),
          eq(nonprofitEventActions.eventId, event.id),
          eq(nonprofitEventActions.orgId, event.orgId),
        )).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "action", entityId: action.id, action: "updated", actorUserId: userId, details: { fields: Object.keys(input), status: row.status } });
        return [row];
      });
      res.json({ action: updated });
    } catch (err) {
      console.error("[nonprofit-events] action update failed:", err);
      sendEventMutationError(res, err, 400, "Action could not be updated.");
    }
  });

  app.post("/api/nonprofit-events/events/:eventId/stories", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = storyCreateSchema.parse(req.body);
      ensureShareable(input);
      const now = new Date();
      const [story] = await db.transaction(async (tx) => {
        const event = await lockWritableEvent(tx, req, String(req.params.eventId));
        const [row] = await tx.insert(nonprofitEventStories).values({
          ...input, eventId: event.id, orgId: event.orgId, consentedAt: input.consentGranted ? now : null,
          approvedAt: input.sharingState === "approved" ? now : null, approvedByUserId: input.sharingState === "approved" ? userId : null,
          createdByUserId: userId, updatedByUserId: userId,
        }).returning();
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "story", entityId: row.id, action: input.sharingState === "approved" ? "approved" : "drafted", actorUserId: userId, details: { audience: row.intendedAudience, consentGranted: row.consentGranted, permittedUseCount: row.permittedUses.length } });
        return [row];
      });
      res.status(201).json({ story });
    } catch (err) {
      console.error("[nonprofit-events] story create failed:", err);
      sendEventMutationError(res, err, 400, "Story could not be saved.");
    }
  });

  app.patch("/api/nonprofit-events/stories/:storyId", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req)!;
      const input = storyUpdateSchema.parse(req.body);
      const [updated] = await db.transaction(async (tx) => {
        const [story] = await tx.select().from(nonprofitEventStories)
          .where(eq(nonprofitEventStories.id, String(req.params.storyId)))
          .for("update");
        if (!story) throw new EventMutationError(404, "Story not found.");
        const event = await lockWritableEvent(tx, req, story.eventId);
        const changedConsent = ["attributionPreference", "intendedAudience", "permittedUses", "consentGranted"].some((key) => key in input);
        const changedConsentTerms = ["title", "storyText", "attributionPreference", "intendedAudience", "permittedUses"].some((key) => key in input);
        const next = { ...story, ...input };
        if (input.sharingState && !hasAllowedTransition(STORY_TRANSITIONS, story.sharingState, input.sharingState)) {
          throw new Error("A withdrawn story remains withdrawn. Create a new story only after new consent is recorded.");
        }
        if (input.sharingState === "withdrawn") {
          next.consentGranted = false;
        } else if (story.sharingState === "approved" && changedConsentTerms && input.sharingState === undefined) {
          next.sharingState = "draft";
          next.consentGranted = false;
        } else if (story.sharingState === "approved" && changedConsent && input.sharingState === "approved") {
          throw new Error("Changing consent or sharing terms requires a new draft and a fresh approval.");
        }
        ensureShareable(next);
        const now = new Date();
        const [row] = await tx.update(nonprofitEventStories).set({
          ...input,
          consentGranted: next.consentGranted,
          sharingState: next.sharingState,
          consentedAt: next.consentGranted ? (story.consentGranted && story.consentedAt ? story.consentedAt : now) : null,
          approvedAt: next.sharingState === "approved" ? (story.approvedAt ?? now) : null,
          approvedByUserId: next.sharingState === "approved" ? (story.approvedByUserId ?? userId) : null,
          withdrawnAt: input.sharingState === "withdrawn" ? now : story.withdrawnAt,
          updatedByUserId: userId,
          updatedAt: now,
        }).where(and(
          eq(nonprofitEventStories.id, story.id),
          eq(nonprofitEventStories.eventId, event.id),
          eq(nonprofitEventStories.orgId, event.orgId),
        )).returning();
        const transition = input.sharingState === "withdrawn" ? "withdrawn" : next.sharingState === "approved" ? "approved" : "updated";
        await recordAudit(tx, { orgId: event.orgId, eventId: event.id, entityType: "story", entityId: story.id, action: transition, actorUserId: userId, details: { audience: next.intendedAudience, consentGranted: next.consentGranted, permittedUseCount: next.permittedUses.length } });
        return [row];
      });
      res.json({ story: updated });
    } catch (err) {
      console.error("[nonprofit-events] story update failed:", err);
      sendEventMutationError(res, err, 400, "Story could not be updated.");
    }
  });

  app.get("/api/nonprofit-events/events/:eventId/audit", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const event = await getAccessibleEvent(req, res, String(req.params.eventId));
      if (!event) return;
      const audit = await db.select().from(nonprofitEventAuditLog)
        .where(eq(nonprofitEventAuditLog.eventId, event.id))
        .orderBy(desc(nonprofitEventAuditLog.createdAt));
      res.json({ audit });
    } catch (err) {
      console.error("[nonprofit-events] audit load failed:", err);
      res.status(500).json({ error: "Audit history could not be loaded." });
    }
  });

  app.get("/api/nonprofit-events/report", requireAuth, loadCallerOrg, requireOrg, requireStaff, async (req: Request, res: Response) => {
    try {
      const org = getCallerOrg(req)!;
      const filters = z.object({
        orgId: z.string().max(100).optional(),
        serviceArea: z.string().max(240).optional(),
        needArea: z.string().max(160).optional(),
        startDate: dateText.optional(),
        endDate: dateText.optional(),
      }).parse(req.query);
      if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
        return res.status(400).json({ error: "The report start date must be on or before the end date." });
      }
      if (filters.orgId && filters.orgId !== org.id) {
        return res.status(403).json({ error: "Reports are limited to your active organization workspace." });
      }
      const clauses = [eq(nonprofitEvents.orgId, org.id), ne(nonprofitEvents.status, "archived")];
      if (filters.serviceArea) clauses.push(eq(nonprofitEvents.serviceArea, filters.serviceArea));
      if (filters.startDate) clauses.push(gte(nonprofitEvents.eventDate, filters.startDate));
      if (filters.endDate) clauses.push(lte(nonprofitEvents.eventDate, filters.endDate));
      const { events, attendance, actions, reportNeeds, reportHandoffs } = await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`);
        const loadedEvents = await tx.select().from(nonprofitEvents).where(and(...clauses)).orderBy(desc(nonprofitEvents.eventDate));
        const initialIds = loadedEvents.map((event) => event.id);
        const needs = initialIds.length ? await tx.select().from(nonprofitEventNeeds).where(inArray(nonprofitEventNeeds.eventId, initialIds)) : [];
        const selectedIds = filters.needArea
          ? new Set(needs.filter((need) => need.needArea.toLowerCase() === filters.needArea!.toLowerCase()).map((need) => need.eventId))
          : new Set(initialIds);
        const events = loadedEvents.filter((event) => selectedIds.has(event.id));
        const eventIds = events.map((event) => event.id);
        const [attendance, actions] = eventIds.length === 0
          ? [[], []] as const
          : await Promise.all([
            tx.select().from(nonprofitEventAttendance).where(inArray(nonprofitEventAttendance.eventId, eventIds)),
            tx.select().from(nonprofitEventActions).where(inArray(nonprofitEventActions.eventId, eventIds)),
          ]);
        const reportNeeds = needs.filter((need) => selectedIds.has(need.eventId));
        const reportHandoffs = eventIds.length
          ? await tx.select().from(nonprofitEventHandoffs).where(and(eq(nonprofitEventHandoffs.orgId, org.id), inArray(nonprofitEventHandoffs.eventId, eventIds)))
          : [];
        return { events, attendance, actions, reportNeeds, reportHandoffs };
      });
      const actionById = new Map(actions.map((action) => [action.id, action]));
      res.json({
        filters,
        generatedAt: new Date().toISOString(),
        disclosure: "This is a non-identifying aggregate report for the active organization only. Attendance counts fewer than five and incomplete totals are not reported as precise values. Stories and narrative content are never included. Event activity is not a participant outcome claim.",
        organizations: [{
          organization: org.name ?? "Organization",
          orgId: org.id,
           summary: summarize(events, attendance, reportNeeds, actions, reportHandoffs),
           actionTrace: reportHandoffs.map((handoff) => {
             const action = handoff.actionId ? actionById.get(handoff.actionId) : undefined;
             return {
               handoffId: handoff.id,
               issue: handoff.issue,
               geography: handoff.geography,
               sourceKind: handoff.sourceKind,
               claimTypes: handoff.claimTypes,
               freshnessAt: handoff.freshnessAt,
               resourceVerification: handoff.resourceVerification,
               unresolvedGapCount: handoff.unresolvedGaps.length,
               actionStatus: action?.status ?? "unavailable",
               followUpObservation: action?.followUpObservation ? "recorded" : "unavailable",
               outcomeClaim: "unavailable",
               disclosure: "This trace records an organization-selected action and follow-up availability. It does not establish a participant outcome.",
             };
           }),
        }],
      });
    } catch (err) {
      console.error("[nonprofit-events] report failed:", err);
      res.status(err instanceof z.ZodError ? 400 : 500).json({ error: err instanceof z.ZodError ? err.message : "Report could not be generated." });
    }
  });
}
