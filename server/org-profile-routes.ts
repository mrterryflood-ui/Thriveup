import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { organizations, organizationMembers, grantOrgTracking, grantOpportunities, wonProposals, users, insertOrganizationSchema, insertGrantOrgTrackingSchema, nonprofitEventWorkspaceAccess, nonprofitEventWorkspaceAccessAudit } from "@shared/schema";
import { classifyFunder } from "./foundation-intelligence";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { requireAuth, getUserId, loadCallerOrg, requireOrg, getCallerOrg, getCallerOrgRole } from "./tenant-middleware";
import { invalidateOrgScores } from "./org-scoring";
import { isPlatformStaff } from "./event-workspace-auth";

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

  // Event-workspace authorization is separate from membership: it lets an
  // owner designate eligible platform staff without changing collaborator or
  // member status.
  app.get("/api/me/organization/event-workspace-access", requireAuth, loadCallerOrg, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    if (getCallerOrgRole(req) !== "owner") return res.status(403).json({ error: "Only organization owners can view event-workspace access." });
    try {
      const memberships = await db.select().from(organizationMembers).where(eq(organizationMembers.orgId, org.id));
      const userIds = memberships.map((member) => member.userId);
      const [userRows, authorizations] = await Promise.all([
        userIds.length > 0
          ? db.select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName }).from(users).where(inArray(users.id, userIds))
          : Promise.resolve([]),
        db.select().from(nonprofitEventWorkspaceAccess).where(eq(nonprofitEventWorkspaceAccess.orgId, org.id)),
      ]);
      const authorizedByUserId = new Set(authorizations.map((authorization) => authorization.userId));
      const eligibilityByUserId = new Map(await Promise.all(userRows.map(async (user) => [user.id, await isPlatformStaff(user.id)] as const)));
      res.json({
        members: memberships.map((membership) => {
          const user = userRows.find((row) => row.id === membership.userId);
          return {
            userId: membership.userId,
            membershipRole: membership.role,
            email: user?.email ?? null,
            firstName: user?.firstName ?? null,
            lastName: user?.lastName ?? null,
            eligibleForEventWorkspace: eligibilityByUserId.get(membership.userId) === true,
            eventWorkspaceAccess: membership.role === "owner" ? "owner" : authorizedByUserId.has(membership.userId) ? "authorized" : "not_authorized",
          };
        }),
      });
    } catch (error) {
      console.error("[org-profile] list event-workspace access failed:", error);
      res.status(500).json({ error: "Failed to load event-workspace access." });
    }
  });

  app.post("/api/me/organization/event-workspace-access/:userId", requireAuth, loadCallerOrg, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const actorUserId = getUserId(req)!;
    const targetUserId = String(req.params.userId);
    if (getCallerOrgRole(req) !== "owner") return res.status(403).json({ error: "Only organization owners can authorize event-workspace staff." });
    try {
      const [membership] = await db.select().from(organizationMembers).where(and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, targetUserId),
      ));
      if (!membership) return res.status(404).json({ error: "That person is not a current member of this organization." });
      if (membership.role === "owner") return res.status(409).json({ error: "Organization owners already have event-workspace access." });
      if (!(await isPlatformStaff(targetUserId))) {
        return res.status(422).json({ error: "This member is not eligible for event-workspace authorization. Authorization does not create platform staff access." });
      }
      const result = await db.transaction(async (tx) => {
        const [authorization] = await tx.insert(nonprofitEventWorkspaceAccess).values({
          orgId: org.id, userId: targetUserId, authorizedByUserId: actorUserId,
        }).onConflictDoNothing().returning();
        if (!authorization) return { authorization: null, alreadyAuthorized: true };
        await tx.insert(nonprofitEventWorkspaceAccessAudit).values({
          orgId: org.id, targetUserId, changedByUserId: actorUserId, action: "authorized",
        });
        return { authorization, alreadyAuthorized: false };
      });
      res.status(result.alreadyAuthorized ? 200 : 201).json(result);
    } catch (error) {
      console.error("[org-profile] grant event-workspace access failed:", error);
      res.status(500).json({ error: "Failed to authorize event-workspace staff." });
    }
  });

  app.delete("/api/me/organization/event-workspace-access/:userId", requireAuth, loadCallerOrg, requireOrg, async (req: Request, res: Response) => {
    const org = getCallerOrg(req)!;
    const actorUserId = getUserId(req)!;
    const targetUserId = String(req.params.userId);
    if (getCallerOrgRole(req) !== "owner") return res.status(403).json({ error: "Only organization owners can revoke event-workspace access." });
    try {
      const [membership] = await db.select().from(organizationMembers).where(and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, targetUserId),
      ));
      if (!membership) return res.status(404).json({ error: "That person is not a current member of this organization." });
      if (membership.role === "owner") return res.status(409).json({ error: "Organization owners retain event-workspace access while they are owners." });
      const result = await db.transaction(async (tx) => {
        const [revoked] = await tx.delete(nonprofitEventWorkspaceAccess).where(and(
          eq(nonprofitEventWorkspaceAccess.orgId, org.id),
          eq(nonprofitEventWorkspaceAccess.userId, targetUserId),
        )).returning();
        if (!revoked) return false;
        await tx.insert(nonprofitEventWorkspaceAccessAudit).values({
          orgId: org.id, targetUserId, changedByUserId: actorUserId, action: "revoked",
        });
        return true;
      });
      if (!result) return res.status(404).json({ error: "This member does not currently have event-workspace access." });
      res.json({ ok: true });
    } catch (error) {
      console.error("[org-profile] revoke event-workspace access failed:", error);
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
      const [row] = await db.insert(grantOrgTracking).values(parsed).onConflictDoUpdate({
        target: [grantOrgTracking.orgId, grantOrgTracking.grantId],
        set: { ...parsed, updatedAt: new Date() },
      }).returning();
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
