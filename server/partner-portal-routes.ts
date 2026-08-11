import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { organizations, orgDocuments, organizationMembers, orgCapacity } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.claims?.sub) return res.status(401).json({ error: "Authentication required" });
  next();
}

export function registerPartnerPortalRoutes(app: Express) {
  // GET /api/partner-portal/capacity — session-authenticated: org's own capacity entries
  app.get("/api/partner-portal/capacity", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [org] = await db.select({ id: organizations.id, name: organizations.name })
        .from(organizations).where(eq(organizations.userId, userId)).limit(1);

      if (!org) return res.json({ entries: [], orgId: null });

      const orgId = `portal_${org.id}`;
      const rows = await db.select().from(orgCapacity)
        .where(eq(orgCapacity.orgId, orgId))
        .orderBy(orgCapacity.programCode);

      const STALE_MS = 14 * 24 * 60 * 60 * 1000;
      const entries = rows.map((r) => ({
        ...r,
        stale: r.updatedAt ? Date.now() - new Date(r.updatedAt).getTime() > STALE_MS : true,
      }));
      res.json({ entries, orgId, orgName: org.name });
    } catch (err) {
      console.error("[partner-portal] capacity GET error", err);
      res.status(500).json({ error: "Failed to load capacity entries" });
    }
  });

  // PATCH /api/partner-portal/capacity — session-authenticated: upsert org capacity
  app.patch("/api/partner-portal/capacity", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [org] = await db.select({ id: organizations.id, name: organizations.name })
        .from(organizations).where(eq(organizations.userId, userId)).limit(1);

      if (!org) return res.status(400).json({ error: "No organization found for your account" });

      const { programCode = "general", status = "open", waitWeeks, note, contactPhone, contactUrl, serviceZips } = req.body;
      if (!["open", "waitlist", "closed"].includes(status)) {
        return res.status(400).json({ error: "status must be open|waitlist|closed" });
      }

      const orgId = `portal_${org.id}`;
      await db.insert(orgCapacity).values({
        orgId,
        orgName: org.name,
        programCode,
        status,
        waitWeeks: waitWeeks ?? null,
        note: note ?? null,
        contactPhone: contactPhone ?? null,
        contactUrl: contactUrl ?? null,
        serviceZips: serviceZips ?? null,
        updatedByPartnerKey: `portal:${userId.slice(0, 8)}`,
      }).onConflictDoUpdate({
        target: [orgCapacity.orgId, orgCapacity.programCode],
        set: {
          orgName: org.name,
          status,
          waitWeeks: waitWeeks ?? null,
          note: note ?? null,
          contactPhone: contactPhone ?? null,
          contactUrl: contactUrl ?? null,
          serviceZips: serviceZips ?? null,
          updatedAt: new Date(),
          updatedByPartnerKey: `portal:${userId.slice(0, 8)}`,
        },
      });

      res.json({ ok: true, orgId, programCode, status });
    } catch (err) {
      console.error("[partner-portal] capacity PATCH error", err);
      res.status(500).json({ error: "Failed to update capacity entry" });
    }
  });

  app.get("/api/partner-portal/home", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.userId, userId))
        .limit(1);

      if (!org) {
        return res.json({ org: null, onboarding: buildEmptyOnboarding(), stats: null });
      }

      const [docCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orgDocuments)
        .where(eq(orgDocuments.orgId, org.id));
      const docCount = docCountRow?.count ?? 0;

      const [memberCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizationMembers)
        .where(eq(organizationMembers.orgId, org.id));
      const memberCount = memberCountRow?.count ?? 0;

      const profileComplete =
        !!org.name && !!org.missionText && (org.focusAreas?.length ?? 0) > 0;
      const docsUploaded = docCount > 0;
      const teamingConnected = memberCount > 1;

      const onboarding = {
        steps: [
          {
            id: "account",
            label: "Create your account",
            description: "Sign in with Replit Auth — one click, no new password.",
            done: true,
            path: null,
          },
          {
            id: "profile",
            label: "Complete your organization profile",
            description: "Mission statement, focus areas, populations served, and location.",
            done: profileComplete,
            path: "/settings/organization",
          },
          {
            id: "documents",
            label: "Upload supporting documents",
            description:
              "Capability statement, 501(c)(3) letter, W-9, COI, and past performance. These auto-fill every joint proposal.",
            done: docsUploaded,
            path: "/settings/documents",
          },
          {
            id: "teaming",
            label: "Connect to a collaboration",
            description:
              "Open the Collaboration Hub to start working alongside TCAF and partner orgs on shared projects.",
            done: teamingConnected,
            path: "/collaboration-hub",
          },
          {
            id: "orientation",
            label: "Explore your tools",
            description:
              "Use at least one platform tool — AI companion, coalition portal, resource navigator, or grant engine.",
            done: false,
            path: "/partner-portal#tools",
          },
        ],
        pct: 0,
      };

      const done = onboarding.steps.filter((s) => s.done).length;
      onboarding.pct = Math.round((done / onboarding.steps.length) * 100);

      return res.json({
        org,
        onboarding,
        stats: {
          docCount,
          memberCount,
          focusAreas: org.focusAreas ?? [],
          populationsServed: org.populationsServed ?? [],
        },
      });
    } catch (err) {
      console.error("[partner-portal] home error", err);
      return res.status(500).json({ error: "Failed to load portal data" });
    }
  });
}

function buildEmptyOnboarding() {
  return {
    steps: [
      { id: "account", label: "Create your account", done: true, path: null, description: "Sign in with Replit Auth." },
      { id: "profile", label: "Complete your organization profile", done: false, path: "/onboarding/org", description: "Set up your org." },
      { id: "documents", label: "Upload supporting documents", done: false, path: "/settings/documents", description: "" },
      { id: "teaming", label: "Connect to a collaboration", done: false, path: "/teaming-network", description: "" },
      { id: "orientation", label: "Explore your tools", done: false, path: "/partner-portal#tools", description: "" },
    ],
    pct: 20,
  };
}
