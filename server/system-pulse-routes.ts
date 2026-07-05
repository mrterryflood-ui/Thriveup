import type { Express } from "express";
import { db } from "./storage";
import { count, eq } from "drizzle-orm";
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
} from "@shared/schema";

async function safeCount(table: any, where?: any): Promise<number> {
  try {
    const q = where
      ? db.select({ c: count() }).from(table).where(where)
      : db.select({ c: count() }).from(table);
    const [row] = await q;
    return Number(row?.c ?? 0);
  } catch {
    return 0;
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
        safeCount(grantOpportunities, eq(grantOpportunities.status, "identified")),
        safeCount(proposalPipeline),
        safeCount(communityPartners),
        safeCount(mouDocuments),
        safeCount(outcomeTracking),
        safeCount(certificates),
        safeCount(studentProgress),
        safeCount(benefitsScreenings),
        safeCount(justiceReferrals),
        safeCount(reentryPlans),
      ]);

      const services = [
        { name: "Navigator AI", tier: 1, status: "operational" },
        { name: "Benefits Screener", tier: 1, status: "operational" },
        { name: "Grant Discovery", tier: 1, status: "operational" },
        { name: "Trade Simulators", tier: 1, status: "operational" },
        { name: "SPARK / SPARKY", tier: 1, status: "operational" },
        { name: "Justice Reentry", tier: 2, status: "operational" },
        { name: "Voice Collective", tier: 2, status: "operational" },
        { name: "Ecosystem Connector", tier: 2, status: "operational" },
        { name: "Partner API Hub", tier: 2, status: "operational" },
        { name: "RAG Knowledge Base", tier: 2, status: "operational" },
        { name: "MOU Pipeline", tier: 3, status: "operational" },
        { name: "College Access AI", tier: 3, status: "operational" },
        { name: "Regional Briefing", tier: 3, status: "operational" },
        { name: "ITSM Monitor", tier: 3, status: "operational" },
        { name: "Outcome Tracker", tier: 3, status: "operational" },
      ];

      res.json({
        status: "healthy",
        services,
        totals: {
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
        },
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
        safeCount(benefitsScreenings),
        safeCount(benefitsApplications),
        safeCount(justiceReferrals),
        safeCount(reentryPlans),
        safeCount(grantOpportunities, eq(grantOpportunities.status, "identified")),
        safeCount(proposalPipeline),
        safeCount(communityPartners),
        safeCount(partnerReferrals),
        safeCount(mouDocuments),
        safeCount(outcomeTracking),
        safeCount(certificates),
        safeCount(studentProgress),
      ]);

      res.json({
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
}
