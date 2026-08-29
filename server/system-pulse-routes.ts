import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import { count, eq, gte, desc } from "drizzle-orm";
import {
  grantOpportunities,
  proposalPipeline,
  communityPartners,
  partnerReferrals,
  mouDocuments,
  outcomeTracking,
  justiceReferrals,
  reentryPlans,
  benefitsScreenings,
  benefitsApplications,
  certificates,
  studentProgress,
  probeAlertFailures,
} from "@shared/schema";

const STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

function getUserId(req: Request): string | undefined {
  const user = (req as unknown as Record<string, unknown>).user as
    { claims?: { sub?: string }; id?: string } | undefined;
  return user?.claims?.sub || user?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Authentication required" });
  next();
}

async function requireStaff(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role && STAFF_ROLES.has(user.role)) return next();
  } catch (error) {
    console.error("[system-pulse] staff check failed:", error);
  }
  return res.status(403).json({ error: "Staff access required" });
}

async function countTable(table: any, where?: any): Promise<number | null> {
  try {
    const q = where
      ? db.select({ c: count() }).from(table).where(where)
      : db.select({ c: count() }).from(table);
    const [row] = await q;
    return Number(row?.c ?? 0);
  } catch (err) {
    console.error("[system-pulse] metric unavailable:", err);
    return null;
  }
}

export function registerSystemPulseRoutes(app: Express) {
  app.get("/api/system/health", async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=30");
    try {
      const [
        openOpportunities,
        inPipeline,
        partners,
        mous,
        outcomes,
        certs,
        enrollments,
        screenings,
        justiceRefs,
        reentryCount,
      ] = await Promise.all([
        countTable(grantOpportunities, eq(grantOpportunities.status, "identified")),
        countTable(proposalPipeline),
        countTable(communityPartners),
        countTable(mouDocuments),
        countTable(outcomeTracking),
        countTable(certificates),
        countTable(studentProgress),
        countTable(benefitsScreenings),
        countTable(justiceReferrals),
        countTable(reentryPlans),
      ]);

      const services = [
        "Navigator AI", "Benefits Screener", "Grant Discovery",
        "Trade Simulators", "SPARK / SPARKY", "Justice Reentry",
        "Voice Collective", "Ecosystem Connector", "Partner API Hub",
        "RAG Knowledge Base", "MOU Pipeline", "College Access AI",
        "Regional Briefing", "ITSM Monitor", "Outcome Tracker",
      ].map((name, index) => ({
        name,
        tier: index < 5 ? 1 : index < 10 ? 2 : 3,
        status: "unknown",
        note: "Service-level probe not configured",
      }));

      const totals = {
        openOpportunities,
        inPipeline,
        partners,
        mous,
        outcomes,
        certificates: certs,
        enrollments,
        screenings,
        justiceReferrals: justiceRefs,
        reentryPlans: reentryCount,
      };
      const metricsAvailable = Object.values(totals).every((value) => value !== null);

      res.json({
        status: metricsAvailable ? "metrics_available" : "degraded",
        services,
        totals,
        checkedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("system/health error:", err);
      res.status(500).json({ error: "health check unavailable" });
    }
  });

  app.get("/api/system/pulse", async (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=60");
    try {
      const [
        screenings,
        applications,
        justiceRefs,
        reentryCount,
        openOpportunities,
        inPipeline,
        partners,
        referrals,
        mous,
        outcomes,
        certs,
        enrollments,
      ] = await Promise.all([
        countTable(benefitsScreenings),
        countTable(benefitsApplications),
        countTable(justiceReferrals),
        countTable(reentryPlans),
        countTable(grantOpportunities, eq(grantOpportunities.status, "identified")),
        countTable(proposalPipeline),
        countTable(communityPartners),
        countTable(partnerReferrals),
        countTable(mouDocuments),
        countTable(outcomeTracking),
        countTable(certificates),
        countTable(studentProgress),
      ]);

      const metricsAvailable = [
        screenings, applications, justiceRefs, reentryCount,
        openOpportunities, inPipeline, partners, referrals, mous,
        outcomes, certs, enrollments,
      ].every((value) => value !== null);

      res.json({
        status: metricsAvailable ? "available" : "degraded",
        serve: {
          screenings,
          applications,
          justiceReferrals: justiceRefs,
          reentryPlans: reentryCount,
        },
        fund: {
          openOpportunities,
          inPipeline,
        },
        grow: {
          certificates: certs,
          enrollments,
        },
        connect: {
          partners,
          referrals,
          mous,
        },
        crossHub: {
          outcomesTracked: outcomes,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("system/pulse error:", err);
      res.status(500).json({ error: "pulse unavailable" });
    }
  });

  // Returns probe alert email failures from the last 7 days to authorized staff.
  app.get("/api/system/probe-alert-failures", requireAuth, requireStaff, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await db
        .select()
        .from(probeAlertFailures)
        .where(gte(probeAlertFailures.attemptedAt, sevenDaysAgo))
        .orderBy(desc(probeAlertFailures.attemptedAt))
        .limit(50);
      res.json({ failures: rows, queriedAt: new Date().toISOString() });
    } catch (err) {
      console.error("system/probe-alert-failures error:", err);
      res.status(500).json({ error: "unavailable" });
    }
  });
}
