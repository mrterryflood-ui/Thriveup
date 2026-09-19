import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { organizations, orgDocuments, organizationMembers, orgCapacity } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";
import { validateContactPhone, validateContactUrl } from "@shared/intake-contact-validators";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.claims?.sub) return res.status(401).json({ error: "Authentication required" });
  next();
}

const capacityWriteHits = new Map<string, { count: number; resetAt: number }>();
function capacityWriteRateLimit(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.claims?.sub ?? "unknown";
  const orgId = typeof req.headers["x-org-id"] === "string" ? req.headers["x-org-id"] : "default";
  const key = `${userId}:${orgId}`;
  const now = Date.now();
  if (capacityWriteHits.size > 10_000) {
    for (const [storedKey, bucket] of capacityWriteHits) {
      if (bucket.resetAt <= now) capacityWriteHits.delete(storedKey);
    }
  }
  const current = capacityWriteHits.get(key);
  if (!current || current.resetAt <= now) {
    capacityWriteHits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return next();
  }
  if (current.count >= 60) {
    res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: "Capacity update rate limit exceeded" });
  }
  current.count += 1;
  return next();
}

async function findAuthorizedOrg(userId: string, requestedOrgId: string | null) {
  const [org] = requestedOrgId
    ? await db.select().from(organizations).where(eq(organizations.id, requestedOrgId)).limit(1)
    : await db.select().from(organizations).where(eq(organizations.userId, userId)).limit(1);
  if (org && requestedOrgId && org.userId !== userId) {
    const [membership] = await db.select({ userId: organizationMembers.userId }).from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, requestedOrgId), eq(organizationMembers.userId, userId))).limit(1);
    if (!membership) return { org: null, unauthorized: true };
  }
  return { org, unauthorized: false };
}

function validateCapacityPayload(body: unknown): { ok: true; value: {
  programCode: string;
  status: string;
  waitWeeks: number | null;
  note: string | null;
  contactPhone: string | null;
  contactUrl: string | null;
  serviceZips: string[] | null;
} } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be an object" };
  }
  const { programCode = "general", status = "open", waitWeeks, note, contactPhone, contactUrl, serviceZips } =
    body as Record<string, unknown>;
  if (typeof programCode !== "string" || !/^[A-Za-z0-9:_-]{1,100}$/.test(programCode)) {
    return { ok: false, error: "programCode must be 1-100 letters, numbers, or _:- characters" };
  }
  if (typeof status !== "string" || !["open", "waitlist", "closed"].includes(status)) {
    return { ok: false, error: "status must be open|waitlist|closed" };
  }
  if (waitWeeks !== undefined && waitWeeks !== null &&
      (!Number.isInteger(waitWeeks) || (waitWeeks as number) < 0 || (waitWeeks as number) > 52)) {
    return { ok: false, error: "waitWeeks must be an integer from 0 to 52" };
  }
  if (note !== undefined && note !== null &&
      (typeof note !== "string" || note.length > 1000)) {
    return { ok: false, error: "note must be at most 1000 characters" };
  }
  if (contactPhone !== undefined && contactPhone !== null && typeof contactPhone !== "string") {
    return { ok: false, error: "contactPhone must be a string" };
  }
  if (contactUrl !== undefined && contactUrl !== null && typeof contactUrl !== "string") {
    return { ok: false, error: "contactUrl must be a string" };
  }
  if (serviceZips !== undefined && serviceZips !== null &&
      (!Array.isArray(serviceZips) || serviceZips.length > 100 ||
        serviceZips.some((zip) => typeof zip !== "string" || !/^\d{5}$/.test(zip)))) {
    return { ok: false, error: "serviceZips must contain at most 100 five-digit ZIP codes" };
  }
  return {
    ok: true,
    value: {
      programCode,
      status,
      waitWeeks: waitWeeks === undefined || waitWeeks === null ? null : waitWeeks as number,
      note: note === undefined || note === null ? null : note as string,
      contactPhone: contactPhone === undefined || contactPhone === null ? null : contactPhone,
      contactUrl: contactUrl === undefined || contactUrl === null ? null : contactUrl,
      serviceZips: serviceZips === undefined || serviceZips === null ? null : serviceZips as string[],
    },
  };
}

export function registerPartnerPortalRoutes(app: Express) {
  // GET /api/partner-portal/capacity — session-authenticated: org's own capacity entries
  app.get("/api/partner-portal/capacity", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestedOrgId = typeof req.headers["x-org-id"] === "string" ? req.headers["x-org-id"] : null;
      const { org, unauthorized } = await findAuthorizedOrg(userId, requestedOrgId);
      if (unauthorized) return res.status(403).json({ error: "You are not authorized for this organization." });

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
  app.patch("/api/partner-portal/capacity", requireAuth, capacityWriteRateLimit, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestedOrgId = typeof req.headers["x-org-id"] === "string" ? req.headers["x-org-id"] : null;
      const { org, unauthorized } = await findAuthorizedOrg(userId, requestedOrgId);
      if (unauthorized) return res.status(403).json({ error: "You are not authorized for this organization." });
      if (!org) return res.status(400).json({ error: "No organization found for your account" });

      const parsed = validateCapacityPayload(req.body);
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });
      const { programCode, status, waitWeeks, note, contactPhone, contactUrl, serviceZips } = parsed.value;

      const phoneCheck = validateContactPhone(contactPhone);
      if (!phoneCheck.ok) return res.status(400).json({ error: phoneCheck.message });

      const urlCheck = validateContactUrl(contactUrl);
      if (!urlCheck.ok) return res.status(400).json({ error: urlCheck.message });

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

      const requestedOrgId = typeof req.headers["x-org-id"] === "string" ? req.headers["x-org-id"] : null;
      const { org, unauthorized } = await findAuthorizedOrg(userId, requestedOrgId);
      if (unauthorized) return res.status(403).json({ error: "You are not authorized for this organization." });

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
