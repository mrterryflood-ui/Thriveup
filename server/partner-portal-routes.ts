import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { organizations, orgDocuments, organizationMembers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.claims?.sub) return res.status(401).json({ error: "Authentication required" });
  next();
}

export function registerPartnerPortalRoutes(app: Express) {
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
              "Join an existing teaming thread or open a new one to start working alongside TCAF and partner orgs.",
            done: teamingConnected,
            path: "/teaming-network",
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
