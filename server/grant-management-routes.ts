import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { grantOpportunities, grantOrgTracking, proposalPipeline, nationwideDiscoveries } from "@shared/schema";
import { and, desc, eq, ilike, inArray, notInArray, or, sql, type SQL } from "drizzle-orm";
import { getCallerOrg, getCallerOrgRole, getUserId, loadCallerOrg, requireAuth, requireOrg } from "./tenant-middleware";
import { grantBulkSchema, type GrantManagementResponse } from "@shared/grant-management";
import { activeGrantCondition, getGrantLifecycleReceipt, retirableGrantCondition } from "./grant-lifecycle";

type RefreshResult = { imported: number; skipped: number; [key: string]: unknown };

export function registerGrantManagementRoutes(app: Express, refreshCorpus: () => Promise<RefreshResult>) {
  let refresh: GrantManagementResponse["refresh"] = { status: "idle" };
  let lastRefreshStart = 0;
  const admin = async (req: Request) => {
    const id = getUserId(req);
    return id ? (await storage.getUser(id))?.role === "admin" : false;
  };
  const canManage = (req: Request) => ["owner", "staff"].includes(getCallerOrgRole(req) ?? "");

  app.get("/api/grants/management", loadCallerOrg, async (req, res) => {
    try {
      const isAdmin = await admin(req);
      const scope = req.query.scope === "corpus" ? "corpus" : "entity";
      if (scope === "corpus" && !isAdmin) return res.status(403).json({ error: "Administrator access required" });
      const org = getCallerOrg(req);
      const page = Number(req.query.page ?? 1);
      if (!Number.isInteger(page) || page < 1 || page > 100000) return res.status(400).json({ error: "Invalid page" });
      const state = String(req.query.state ?? "active");
      if (!["active", "dismissed", "all", "untracked"].includes(state)) return res.status(400).json({ error: "Invalid view" });
      const search = String(req.query.search ?? "").trim().slice(0, 200).replace(/[\\%_]/g, "\\$&");
      const conditions: SQL[] = [];
      if (search) conditions.push(or(ilike(grantOpportunities.title, `%${search}%`), ilike(grantOpportunities.agency, `%${search}%`))!);
      const ownDismissed = org ? sql`exists (select 1 from grant_org_tracking t where t.grant_id = ${grantOpportunities.id} and t.org_id = ${org.id} and t.status = 'dismissed')` : sql`false`;
      if (scope === "corpus") {
        if (state === "dismissed") conditions.push(eq(grantOpportunities.status, "dismissed"));
        else if (state !== "all") conditions.push(activeGrantCondition());
      } else if (state === "dismissed") {
        conditions.push(ownDismissed);
      } else if (state !== "all") {
        conditions.push(sql`not (${ownDismissed})`, activeGrantCondition());
      }
      if (state === "untracked") {
        conditions.push(org
          ? sql`not exists (select 1 from grant_org_tracking t where t.grant_id = ${grantOpportunities.id} and t.org_id = ${org.id} and t.status <> 'dismissed')`
          : sql`not exists (select 1 from grant_org_tracking t where t.grant_id = ${grantOpportunities.id} and t.status <> 'dismissed')`);
      }
      const where = conditions.length ? and(...conditions) : undefined;
      const [counts] = await db.select({
        corpus: sql<number>`count(*)::int`,
        activeCorpus: sql<number>`count(*) filter (where ${activeGrantCondition()})::int`,
        expired: sql<number>`count(*) filter (where status = 'expired' or (${retirableGrantCondition()}))::int`,
        archived: sql<number>`count(*) filter (where status = 'dismissed')::int`,
        added7Days: sql<number>`count(*) filter (where created_at >= now() - interval '7 days')::int`,
        added30Days: sql<number>`count(*) filter (where created_at >= now() - interval '30 days')::int`,
        lastCorpusWrite: sql<string | null>`max(created_at)::text`,
        notInAnyEntityPipeline: sql<number>`count(*) filter (where not exists (select 1 from grant_org_tracking t where t.grant_id = grant_opportunities.id and t.status <> 'dismissed'))::int`,
      }).from(grantOpportunities);
      const [{ count: total }] = await db.select({ count: sql<number>`count(*)::int` }).from(grantOpportunities).where(where);
      const rows = await db.select({
        id: grantOpportunities.id, title: grantOpportunities.title, agency: grantOpportunities.agency,
        source: grantOpportunities.source, status: grantOpportunities.status, createdAt: grantOpportunities.createdAt,
        entityStatus: org ? sql<string | null>`(select status from grant_org_tracking t where t.org_id = ${org.id} and t.grant_id = grant_opportunities.id)` : sql<null>`null`,
      }).from(grantOpportunities).where(where).orderBy(desc(grantOpportunities.createdAt), grantOpportunities.id).limit(50).offset((page - 1) * 50);
      const [pipeline] = await db.select({ count: sql<number>`count(*)::int` }).from(proposalPipeline);
      const [cache] = await db.select({ count: sql<number>`count(*)::int` }).from(nationwideDiscoveries);
      const [tracking] = org ? await db.select({
        tracked: sql<number>`count(*) filter (where status <> 'dismissed')::int`,
        dismissed: sql<number>`count(*) filter (where status = 'dismissed')::int`,
      }).from(grantOrgTracking).where(eq(grantOrgTracking.orgId, org.id)) : [];
      res.setHeader("Cache-Control", "private, no-store");
      res.json({
        scope, canManageEntity: Boolean(org && canManage(req)), isAdmin,
        organizationName: org ? String(org.name ?? "Your organization") : null,
        summary: { ...counts, legacyPipelineEntries: pipeline.count, cachedResearchQueries: cache.count,
          entityTracked: tracking?.tracked ?? null, entityDismissed: tracking?.dismissed ?? null },
        rows, total, page, pageSize: 50, refresh, lifecycle: {
          lastCompletedRun: await getGrantLifecycleReceipt(),
          schedule: "00:45 UTC nightly; boot catch-up; before/after source refresh",
          gppSync: process.env.THRIVEUP_CALLBACK_API_KEY?.trim()
            ? "GPP catalogue lifecycle receiver configured; sender delivery and nightly GPP execution still require verification."
            : "GPP catalogue lifecycle receiver blocked: dedicated callback credential not configured. No upstream removals are assumed.",
        },
      });
    } catch (error) {
      console.error("[grant-management] read failed:", error);
      res.status(500).json({ error: "Unable to load opportunity counts and queue" });
    }
  });

  app.post("/api/grants/management/refresh", requireAuth, loadCallerOrg, async (req, res) => {
    try {
    if (!(await admin(req)) && !canManage(req)) return res.status(403).json({ error: "Organization owner/staff or administrator access required" });
    // Single process-wide job, not one expensive harvest per button click.
    if (refresh.status === "running") return res.status(202).json(refresh);
    if (Date.now() - lastRefreshStart < 60_000) return res.status(429).json({ error: "A scan was started recently. Reload counts or wait one minute." });
    lastRefreshStart = Date.now();
    refresh = { status: "running", startedAt: new Date().toISOString() };
    res.status(202).json(refresh);
    void refreshCorpus().then(result => {
      refresh = { ...refresh, status: "complete", finishedAt: new Date().toISOString(), imported: result.imported, skipped: result.skipped };
    }).catch(error => {
      console.error("[grant-management] discovery failed:", error);
      refresh = { ...refresh, status: "failed", finishedAt: new Date().toISOString(), error: "Discovery scan failed. Existing opportunities are unchanged by this status; some source imports may have completed." };
    });
    } catch (error) {
      console.error("[grant-management] refresh authorization failed:", error);
      res.status(500).json({ error: "Unable to authorize refresh" });
    }
  });

  app.post("/api/me/grants/bulk", requireAuth, requireOrg, async (req, res) => {
    const parsed = grantBulkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
    if (!canManage(req)) return res.status(403).json({ error: "Organization owner or staff access required" });
    if (!["dismiss", "restore"].includes(parsed.data.action)) return res.status(403).json({ error: "Entity actions cannot modify the shared corpus" });
    try {
      const org = getCallerOrg(req)!;
      const { ids, action } = parsed.data;
      const changed = await db.transaction(async tx => {
        const grants = await tx.select({ id: grantOpportunities.id }).from(grantOpportunities).where(inArray(grantOpportunities.id, ids)).for("update");
        if (grants.length !== ids.length) throw new Error("Selection changed; reload opportunities before trying again");
        if (action === "restore") {
          // Explicitly restore as tracked; never destroy pursuit notes/history
          // under a button presented as restoration.
          return (await tx.update(grantOrgTracking).set({ status: "tracking", updatedAt: new Date() }).where(and(eq(grantOrgTracking.orgId, org.id), inArray(grantOrgTracking.grantId, ids), eq(grantOrgTracking.status, "dismissed"))).returning()).length;
        }
        // Preserve original notes/award history; do not silently withdraw an
        // applied, won or lost pursuit as a housekeeping action.
        const protectedRows = await tx.select({ id: grantOrgTracking.id }).from(grantOrgTracking).where(and(eq(grantOrgTracking.orgId, org.id), inArray(grantOrgTracking.grantId, ids), notInArray(grantOrgTracking.status, ["tracking", "withdrawn", "dismissed"]))).for("update");
        if (protectedRows.length) throw new Error("Applied or decided opportunities must be managed individually; nothing was dismissed");
        const rows = await tx.insert(grantOrgTracking).values(ids.map(grantId => ({ orgId: org.id, grantId, status: "dismissed" })))
          .onConflictDoUpdate({ target: [grantOrgTracking.orgId, grantOrgTracking.grantId], set: { status: "dismissed", updatedAt: new Date() },
            setWhere: sql`${grantOrgTracking.status} in ('tracking','withdrawn','dismissed')` }).returning();
        if (rows.length !== ids.length) throw new Error("A pursuit changed during this action; nothing was dismissed. Reload and try again.");
        return rows.length;
      });
      console.info("[grant-management] entity bulk", { actor: getUserId(req), orgId: org.id, action, ids, changed });
      res.json({ action, changed });
    } catch (error) {
      console.error("[grant-management] entity mutation failed:", error);
      res.status(409).json({ error: error instanceof Error ? error.message : "Unable to update selection" });
    }
  });

  app.post("/api/grants/management/bulk", requireAuth, async (req, res) => {
    const parsed = grantBulkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
    try {
      if (!(await admin(req))) return res.status(403).json({ error: "Administrator access required" });
      const { ids, action, confirmation } = parsed.data;
      if (!["archive", "restore", "purge"].includes(action)) return res.status(400).json({ error: "Invalid corpus action" });
      if (action === "purge" && confirmation !== `PURGE ${ids.length}`) return res.status(400).json({ error: `Type PURGE ${ids.length} to confirm permanent deletion` });
      const changed = await db.transaction(async tx => {
        const existing = await tx.select({ id: grantOpportunities.id }).from(grantOpportunities).where(inArray(grantOpportunities.id, ids)).for("update");
        if (existing.length !== ids.length) throw new Error("Selection changed; reload before trying again");
        if (action === "purge") {
          // Legacy pipeline data lacks a canonical FK; protect known ID/title
          // associations as well as any entity's tracked opportunity.
          const linked = await tx.select({ id: grantOpportunities.id }).from(grantOpportunities).where(and(
            inArray(grantOpportunities.id, ids),
            sql`exists(select 1 from grant_org_tracking t where t.grant_id = ${grantOpportunities.id})
              or exists(select 1 from won_proposals w where w.grant_id = ${grantOpportunities.id})
              or exists(select 1 from grant_alerts a where a.grant_id = ${grantOpportunities.id} and a.alert_type = 'gpp_catalogue_lifecycle')
              or exists(select 1 from proposal_pipeline p where p.id = ${grantOpportunities.id}
                or p.data->>'grantId' = ${grantOpportunities.id}
                or lower(p.data->>'name') = lower(${grantOpportunities.title})
                or lower(p.data->>'title') = lower(${grantOpportunities.title}))`,
          )).limit(1);
          if (linked.length) throw new Error("Selection includes tracked or pipeline-linked opportunities; nothing was purged. Archive instead.");
          return (await tx.delete(grantOpportunities).where(inArray(grantOpportunities.id, ids)).returning({ id: grantOpportunities.id })).length;
        }
        return (await tx.update(grantOpportunities).set({ status: action === "archive" ? "dismissed" : "identified", updatedAt: new Date() }).where(inArray(grantOpportunities.id, ids)).returning({ id: grantOpportunities.id })).length;
      });
      console.info("[grant-management] corpus bulk", { actor: getUserId(req), action, ids, changed });
      res.json({ action, changed });
    } catch (error) {
      console.error("[grant-management] corpus mutation failed:", error);
      res.status(409).json({ error: error instanceof Error ? error.message : "Unable to modify corpus" });
    }
  });
}