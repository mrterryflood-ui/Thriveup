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
