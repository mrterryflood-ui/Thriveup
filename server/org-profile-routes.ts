import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  organizations,
  organizationMembers,
  organizationEventWorkspaceAccessAudit,
  academyAvatars,
  grantOrgTracking,
  grantOpportunities,
  wonProposals,
  users,
  insertOrganizationSchema,
  insertGrantOrgTrackingSchema,
} from "@shared/schema";
import { classifyFunder } from "./foundation-intelligence";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import {
  EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE,
  getCallerOrg,
  getCallerOrgRole,
  getUserId,
  isEventWorkspaceActiveMemberRole,
  isEventWorkspacePlatformStaffRole,
  loadCallerOrg,
  requireAuth,
  requireOrg,
} from "./tenant-middleware";
import { invalidateOrgScores } from "./org-scoring";

const eventWorkspaceAccessSchema = z.object({
  userId: z.string().trim().min(1).max(255),
}).strict();

type EventWorkspaceAccessChange =
  | { kind: "granted" }
  | { kind: "revoked" }
  | { kind: "not_owner" }
  | { kind: "not_eligible" }
  | { kind: "not_active" }
  | { kind: "conflict" };

async function requireEventWorkspaceOwner(req: Request, res: Response, next: () => void) {
  try {
    const userId = getUserId(req);
    const org = getCallerOrg(req);
    if (!userId || !org) {
      return res.status(403).json({ error: "Only organization owners can manage event-workspace access." });
    }
    const [membership] = await db.select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, org.id), eq(organizationMembers.userId, userId)))
      .limit(1);
    if (membership?.role !== "owner") {
      return res.status(403).json({ error: "Only organization owners can manage event-workspace access." });
    }
    next();
  } catch (error) {
    console.error("[org-profile] event-workspace owner verification failed:", error);
    return res.status(500).json({ error: "Unable to verify organization owner access." });
  }
}

function accessDisplayName(user: typeof users.$inferSelect | undefined) {
  const name = [user?.firstName, user?.lastName]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ");
  return name || "Organization member";
}

function persistedPlatformRole(
  account: Pick<typeof users.$inferSelect, "isTcafAdmin"> | undefined,
  avatar: Pick<typeof academyAvatars.$inferSelect, "role"> | undefined,
): string | undefined {
  if (!account) return undefined;
  return account.isTcafAdmin ? "admin" : avatar?.role ?? "student";
}

async function getEventWorkspaceAccess(orgId: string, actorUserId: string) {
  const members = await db.select().from(organizationMembers).where(eq(organizationMembers.orgId, orgId));
  const userIds = members.map((member) => member.userId);
  const memberUsers = userIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const memberAvatars = userIds.length > 0
    ? await db.select({ userId: academyAvatars.userId, role: academyAvatars.role })
      .from(academyAvatars)
      .where(inArray(academyAvatars.userId, userIds))
    : [];
  const usersById = new Map(memberUsers.map((user) => [user.id, user]));
  const avatarsByUserId = new Map(memberAvatars.map((avatar) => [avatar.userId, avatar]));

  const access = members
    .filter((member) => (
      isEventWorkspaceActiveMemberRole(member.role)
      && isEventWorkspacePlatformStaffRole(
        persistedPlatformRole(usersById.get(member.userId), avatarsByUserId.get(member.userId)),
      )
    ))
    .map((member) => ({
      userId: member.userId,
      displayName: accessDisplayName(usersById.get(member.userId)),
      workspaceRole: member.role,
      joinedAt: member.joinedAt,
      canRevoke: member.role === EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE,
    }));
  const eligibleStaff = members
    .filter((member) => (
      member.role === "member"
      && isEventWorkspacePlatformStaffRole(
        persistedPlatformRole(usersById.get(member.userId), avatarsByUserId.get(member.userId)),
      )
    ))
    .map((member) => ({
      userId: member.userId,
      displayName: accessDisplayName(usersById.get(member.userId)),
      joinedAt: member.joinedAt,
    }));
  const audit = await db.select({
    action: organizationEventWorkspaceAccessAudit.action,
    createdAt: organizationEventWorkspaceAccessAudit.createdAt,
  }).from(organizationEventWorkspaceAccessAudit)
    .where(eq(organizationEventWorkspaceAccessAudit.orgId, orgId))
    .orderBy(desc(organizationEventWorkspaceAccessAudit.createdAt));

  return {
    canAccessWorkspace: access.some((member) => member.userId === actorUserId),
    access,
    eligibleStaff,
    audit,
  };
}

export function registerOrgProfileRoutes(app: Express) {
  // ── Current-org context ──────────────────────────────────────────────────
  // Returns the org the caller is currently acting as. Disambiguates via
  // x-org-id header when the user belongs to multiple workspaces.
  app.get("/api/me/organization", requireAuth, loadCallerOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req);
    const role = getCallerOrgRole(req);
    res.json({ organization: org ?? null, role: role ?? null });
  });

  // List every workspace the caller is a member of, plus every open
  // workspace they could self-join. Powers the sidebar workspace switcher
  // and the "shared workspaces" discovery surface.
  app.get("/api/me/organizations", requireAuth, async (req: Request, res: Response) => {
    const userId = getUserId(req)!;
    try {
      const memberships = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, userId));
      const orgIds = memberships.map((m) => m.orgId);
      const myOrgs = orgIds.length > 0
        ? await db.select().from(organizations).where(inArray(organizations.id, orgIds))
        : [];
      const memberRows = myOrgs.map((o) => ({
        organization: o,
        role: memberships.find((m) => m.orgId === o.id)?.role ?? "member",
        joinedAt: memberships.find((m) => m.orgId === o.id)?.joinedAt ?? null,
      }));
      // Discoverable: any other org accepting collaborators
      const openOrgs = await db.select().from(organizations).where(eq(organizations.acceptsCollaborators, true));
      const joinable = openOrgs.filter((o) => !orgIds.includes(o.id));
      res.json({ memberships: memberRows, joinable });
    } catch (e) {
      console.error("[org-profile] list orgs failed:", e);
      res.status(500).json({ error: "Failed to list organizations" });
    }
  });

  // Self-join an open workspace. No invite, no approval — only condition is
  // that the org has acceptsCollaborators=true. This is the "conglomerate"
  // primitive: Eric clicks "Join workspace" on the Sedgwick page and is in.
  app.post("/api/me/organizations/:orgId/join", requireAuth, async (req: Request, res: Response) => {
    const userId = getUserId(req)!;
    const orgId = String(req.params.orgId);
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
      if (!org) return res.status(404).json({ error: "Workspace not found" });
      if (!org.acceptsCollaborators) {
        return res.status(403).json({ error: "This workspace is not open to collaborators. Ask the owner to open it on their organization settings." });
      }
      const existing = await db.select().from(organizationMembers)
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)));
      if (existing.length > 0) {
        return res.json({ membership: existing[0], organization: org, alreadyMember: true });
      }
      const [membership] = await db.insert(organizationMembers).values({
        orgId,
        userId,
        role: "collaborator",
      }).returning();
      res.status(201).json({ membership, organization: org });
    } catch (e) {
      console.error("[org-profile] join failed:", e);
      res.status(500).json({ error: "Failed to join workspace" });
    }
  });

  // Leave a workspace. Owners can leave only if at least one other owner
  // remains (to prevent orphaning the workspace).
  app.delete("/api/me/organizations/:orgId/leave", requireAuth, async (req: Request, res: Response) => {
    const userId = getUserId(req)!;
    const orgId = String(req.params.orgId);
    try {
      const mine = await db.select().from(organizationMembers)
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)));
      if (mine.length === 0) return res.status(404).json({ error: "Not a member" });
      if (mine[0].role === "owner") {
        const otherOwners = await db.select().from(organizationMembers)
          .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.role, "owner"), ne(organizationMembers.userId, userId)));
        if (otherOwners.length === 0) {
          return res.status(409).json({ error: "You are the only owner. Promote another member to owner before leaving." });
        }
      }
      await db.delete(organizationMembers)
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)));
      res.json({ ok: true });
    } catch (e) {
      console.error("[org-profile] leave failed:", e);
      res.status(500).json({ error: "Failed to leave workspace" });
    }
  });

  // List members of the caller's current org (must be a member).
  app.get("/api/me/organization/members", requireAuth, loadCallerOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req);
    if (!org) return res.status(404).json({ error: "No organization" });
    try {
      const members = await db.select().from(organizationMembers).where(eq(organizationMembers.orgId, org.id));
      const userIds = members.map((m) => m.userId);
      const userRows = userIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, userIds))
        : [];
      const rows = members.map((m) => {
        const u = userRows.find((x) => x.id === m.userId);
        return {
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          email: u?.email ?? null,
          firstName: u?.firstName ?? null,
          lastName: u?.lastName ?? null,
        };
      });
      res.json({ members: rows });
    } catch (e) {
      console.error("[org-profile] list members failed:", e);
      res.status(500).json({ error: "Failed to list members" });
    }
  });

  // Owner-only administration for the private Community Events workspace.
  // The selected organization is always resolved from the signed-in caller;
  // this API accepts no organization ID and returns no event/story content.
  app.get("/api/me/organization/event-workspace-access", requireAuth, loadCallerOrg, requireOrg, requireEventWorkspaceOwner, async (req: Request, res: Response) => {
    try {
      const org = getCallerOrg(req)!;
      const actorUserId = getUserId(req)!;
      res.json(await getEventWorkspaceAccess(org.id, actorUserId));
    } catch (err) {
      console.error("[org-profile] event workspace access list failed:", err);
      res.status(500).json({ error: "Failed to load event-workspace access." });
    }
  });

  app.post("/api/me/organization/event-workspace-access", requireAuth, loadCallerOrg, requireOrg, requireEventWorkspaceOwner, async (req: Request, res: Response) => {
    const parsed = eventWorkspaceAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Provide only a valid organization member ID.", details: parsed.error.flatten() });
    }
    try {
      const org = getCallerOrg(req)!;
      const actorUserId = getUserId(req)!;
      const targetUserId = parsed.data.userId;
      const result = await db.transaction(async (tx): Promise<EventWorkspaceAccessChange> => {
        // Recheck the actor at write time. loadCallerOrg is useful context, but
        // its earlier read must not authorize a later consequential change.
        const actorResult = await tx.execute(sql`
          SELECT role FROM organization_members
          WHERE org_id = ${org.id} AND user_id = ${actorUserId}
          FOR UPDATE
        `);
        const actor = actorResult.rows[0] as { role?: string } | undefined;
        if (actor?.role !== "owner") return { kind: "not_owner" };

        const membershipResult = await tx.execute(sql`
          SELECT role FROM organization_members
          WHERE org_id = ${org.id} AND user_id = ${targetUserId}
          FOR UPDATE
        `);
        const membership = membershipResult.rows[0] as { role?: string } | undefined;
        if (!membership) return { kind: "not_eligible" };
        if (membership.role === EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE) return { kind: "conflict" };
        if (membership.role !== "member") return { kind: "not_eligible" };

        const userResult = await tx.execute(sql`
          SELECT is_tcaf_admin FROM users
          WHERE id = ${targetUserId}
          FOR UPDATE
        `);
        const targetAccount = userResult.rows[0] as { is_tcaf_admin?: boolean } | undefined;
        const avatarResult = await tx.execute(sql`
          SELECT role FROM academy_avatars
          WHERE user_id = ${targetUserId}
          FOR UPDATE
        `);
        const targetAvatar = avatarResult.rows[0] as { role?: string } | undefined;
        const targetRole = targetAccount?.is_tcaf_admin
          ? "admin"
          : targetAvatar?.role ?? (targetAccount ? "student" : undefined);
        if (!isEventWorkspacePlatformStaffRole(targetRole)) return { kind: "not_eligible" };

        const [updated] = await tx.update(organizationMembers)
          .set({ role: EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE })
          .where(and(
            eq(organizationMembers.orgId, org.id),
            eq(organizationMembers.userId, targetUserId),
            eq(organizationMembers.role, "member"),
          ))
          .returning({ id: organizationMembers.id });
        if (!updated) return { kind: "conflict" };

        await tx.insert(organizationEventWorkspaceAccessAudit).values({
          orgId: org.id,
          subjectUserId: targetUserId,
          actorUserId,
          action: "granted",
          workspaceRole: EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE,
        });
        return { kind: "granted" };
      });

      if (result.kind === "not_owner") return res.status(403).json({ error: "Only organization owners can manage event-workspace access." });
      if (result.kind === "not_eligible") return res.status(404).json({ error: "Eligible organization staff member not found." });
      if (result.kind === "conflict") return res.status(409).json({ error: "Event-workspace staff access is already active or has changed. Refresh and try again." });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[org-profile] event workspace access grant failed:", err);
      res.status(500).json({ error: "Failed to grant event-workspace access." });
    }
  });

  app.delete("/api/me/organization/event-workspace-access/:userId", requireAuth, loadCallerOrg, requireOrg, requireEventWorkspaceOwner, async (req: Request, res: Response) => {
    const targetUserId = String(req.params.userId).trim();
    if (!targetUserId || targetUserId.length > 255) {
      return res.status(400).json({ error: "Provide a valid organization member ID." });
    }
    try {
      const org = getCallerOrg(req)!;
      const actorUserId = getUserId(req)!;
      const result = await db.transaction(async (tx): Promise<EventWorkspaceAccessChange> => {
        const actorResult = await tx.execute(sql`
          SELECT role FROM organization_members
          WHERE org_id = ${org.id} AND user_id = ${actorUserId}
          FOR UPDATE
        `);
        const actor = actorResult.rows[0] as { role?: string } | undefined;
        if (actor?.role !== "owner") return { kind: "not_owner" };

        const membershipResult = await tx.execute(sql`
          SELECT role FROM organization_members
          WHERE org_id = ${org.id} AND user_id = ${targetUserId}
          FOR UPDATE
        `);
        const membership = membershipResult.rows[0] as { role?: string } | undefined;
        if (!membership) return { kind: "not_active" };
        if (membership.role !== EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE) return { kind: "not_active" };

        const [updated] = await tx.update(organizationMembers)
          .set({ role: "member" })
          .where(and(
            eq(organizationMembers.orgId, org.id),
            eq(organizationMembers.userId, targetUserId),
            eq(organizationMembers.role, EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE),
          ))
          .returning({ id: organizationMembers.id });
        if (!updated) return { kind: "conflict" };

        await tx.insert(organizationEventWorkspaceAccessAudit).values({
          orgId: org.id,
          subjectUserId: targetUserId,
          actorUserId,
          action: "revoked",
          workspaceRole: EVENT_WORKSPACE_ASSIGNABLE_MEMBER_ROLE,
        });
        return { kind: "revoked" };
      });

      if (result.kind === "not_owner") return res.status(403).json({ error: "Only organization owners can manage event-workspace access." });
      if (result.kind === "not_active") return res.status(409).json({ error: "Event-workspace staff access is not active. Refresh and try again." });
      if (result.kind === "conflict") return res.status(409).json({ error: "Event-workspace staff access has changed. Refresh and try again." });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[org-profile] event workspace access revoke failed:", err);
      res.status(500).json({ error: "Failed to revoke event-workspace access." });
    }
  });

  // ── Current org CRUD ─────────────────────────────────────────────────────
  app.post("/api/me/organization", requireAuth, async (req: Request, res: Response) => {
    const userId = getUserId(req)!;
    try {
      const [existing] = await db.select().from(organizations).where(eq(organizations.userId, userId));
      if (existing) return res.status(409).json({ error: "Organization already exists", organization: existing });
      const parsed = insertOrganizationSchema.parse({ ...req.body, userId: userId });
      const [created] = await db.insert(organizations).values(parsed).returning();
      // Create the owner membership row so the new org plays nicely with the
      // membership model from day one.
      await db.insert(organizationMembers).values({
        orgId: created.id, userId, role: "owner",
      }).onConflictDoNothing();
      res.status(201).json({ organization: created });
    } catch (err) {
      console.error("[org-profile] create failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  app.patch("/api/me/organization", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const role = getCallerOrgRole(req);
    if (role !== "owner") return res.status(403).json({ error: "Only org owners can edit organization details." });
    try {
      // acceptsCollaborators is editable by the owner via the same patch.
      const updatable = insertOrganizationSchema.partial().omit({ userId: true }).extend({
        // accept the explicit flag from the body
      } as any).parse(req.body);
      const setBody: Record<string, unknown> = { ...updatable, updatedAt: new Date() };
      if (typeof (req.body as Record<string, unknown>)?.acceptsCollaborators === "boolean") {
        setBody.acceptsCollaborators = (req.body as Record<string, unknown>).acceptsCollaborators;
      }
      const [updated] = await db.update(organizations).set(setBody).where(eq(organizations.id, org.id)).returning();
      const scoreRelevant = ["missionText", "capabilityStatementText", "focusAreas", "populationsServed", "state", "counties", "budgetRange"];
      if (scoreRelevant.some((k) => k in updatable)) {
        invalidateOrgScores(org.id).catch((e) => console.error("[org-profile] invalidate failed:", e));
      }
      res.json({ organization: updated });
    } catch (err) {
      console.error("[org-profile] update failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  // ── Grant tracking (unchanged below) ─────────────────────────────────────
  app.post("/api/me/grants/:grantId/track", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    try {
      const parsed = insertGrantOrgTrackingSchema.parse({ ...req.body, orgId: org.id, grantId });
      const row = await db.transaction(async tx => {
        // The corpus purge path locks this same parent. No tracking insert
        // may race past its dependency check and leave an orphan pursuit.
        const [grant] = await tx.select({ id: grantOpportunities.id }).from(grantOpportunities)
          .where(eq(grantOpportunities.id, grantId)).for("update");
        if (!grant) throw new Error("Opportunity no longer exists; reload the corpus");
        const [tracked] = await tx.insert(grantOrgTracking).values(parsed).onConflictDoUpdate({
          target: [grantOrgTracking.orgId, grantOrgTracking.grantId],
          set: { ...parsed, updatedAt: new Date() },
        }).returning();
        return tracked;
      });
      res.json({ tracking: row });
    } catch (err) {
      console.error("[org-profile] track failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  app.patch("/api/me/grants/:grantId/track", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    try {
      const updatable = insertGrantOrgTrackingSchema.partial().omit({ orgId: true, grantId: true }).parse(req.body);
      const [row] = await db.update(grantOrgTracking).set({ ...updatable, updatedAt: new Date() })
        .where(and(eq(grantOrgTracking.orgId, org.id), eq(grantOrgTracking.grantId, grantId))).returning();
      if (!row) return res.status(404).json({ error: "Not tracking this grant" });

      if (row.status === "awarded") {
        try {
          const [grant] = await db.select().from(grantOpportunities).where(eq(grantOpportunities.id, grantId));
          if (grant) {
            const existing = await db.select({ id: wonProposals.id }).from(wonProposals)
              .where(and(eq(wonProposals.orgId, org.id), eq(wonProposals.grantId, grantId)));
            if (existing.length === 0) {
              await db.insert(wonProposals).values({
                orgId: org.id,
                grantId,
                funderName: grant.agency ?? "Unknown funder",
                funderType: classifyFunder(grant),
                dollarAmount: row.awardAmount ?? null,
                projectTitle: grant.title,
                draftText: "[Paste your winning proposal text here — the AI will use it to mirror your voice on future drafts to this funder.]",
                awardedAt: row.decidedAt ?? new Date(),
                tags: [],
              });
            }
          }
        } catch (e) {
          console.error("[org-profile] auto-create won-proposal stub failed (non-fatal):", e);
        }
      }
      res.json({ tracking: row });
    } catch (err) {
      console.error("[org-profile] tracking update failed:", err);
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid payload" });
    }
  });

  app.delete("/api/me/grants/:grantId/track", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const grantId = String(req.params.grantId);
    await db.delete(grantOrgTracking).where(and(eq(grantOrgTracking.orgId, org.id), eq(grantOrgTracking.grantId, grantId)));
    res.json({ ok: true });
  });

  app.get("/api/me/grants/tracked", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const rows = await db.select({
      tracking: grantOrgTracking,
      grant: grantOpportunities,
    }).from(grantOrgTracking)
      .innerJoin(grantOpportunities, eq(grantOpportunities.id, grantOrgTracking.grantId))
      .where(eq(grantOrgTracking.orgId, org.id))
      .orderBy(desc(grantOrgTracking.updatedAt));
    res.json({ tracked: rows });
  });

  app.get("/api/me/grants/win-rate", requireAuth, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const rows = await db.select().from(grantOrgTracking).where(eq(grantOrgTracking.orgId, org.id));
    const submitted = rows.filter((r) => ["submitted", "awarded", "declined"].includes(r.status)).length;
    const awarded = rows.filter((r) => r.status === "awarded").length;
    const declined = rows.filter((r) => r.status === "declined").length;
    const pending = rows.filter((r) => ["interested", "pursuing", "drafting", "submitted"].includes(r.status)).length;
    const awardAmount = rows.filter((r) => r.status === "awarded").reduce((sum, r) => sum + (r.awardAmount ?? 0), 0);
    const winRate = submitted > 0 ? Math.round((awarded / submitted) * 100) : 0;
    res.json({
      summary: {
        totalTracked: rows.length,
        submitted, awarded, declined, pending,
        awardAmount,
        winRatePct: winRate,
      },
    });
  });
}
