/**
 * ThriveUp Trade Sims — Certification + Apprenticeship + Test-Prep routes.
 *
 *   GET  /api/trade-sims/certifications/:tradeSlug
 *        Public. Returns the cert catalog, apprenticeship pathways, and
 *        universal locator URLs for the trade. Caller is also told whether
 *        their progress unlocks practice tests (≥80% lessons complete).
 *
 *   GET  /api/trade-sims/certifications/:tradeSlug/practice/:certSlug
 *        Gated. Returns the practice question bank for the cert only when
 *        the caller has reached the unlock threshold for the trade. Same
 *        caller-scope rule as /progress (Replit user id OR x-anon-session).
 *
 * No new DB tables — cert/apprenticeship catalogs are static data files,
 * unlock state is derived from the existing tradeSimsLessonProgress table.
 */

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { tradeSimsTrades, tradeSimsLessons, tradeSimsLessonProgress } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

type LessonRow = typeof tradeSimsLessons.$inferSelect;
type ProgressRow = typeof tradeSimsLessonProgress.$inferSelect;
import {
  getCertCatalogForTrade,
  findCertification,
} from "@shared/data/trade-sims/certifications";
import {
  getApprenticeshipCatalogForTrade,
  UNIVERSAL_APPRENTICESHIP_LOCATORS,
} from "@shared/data/trade-sims/apprenticeships";
import { getPracticeBank } from "@shared/data/trade-sims/cert-practice-banks";

/**
 * Resolve the caller's identity scope. Mirrors getCallerScope() in
 * trade-sims-routes.ts — we re-implement locally to avoid cross-file
 * coupling and keep this file self-contained.
 */
function getCallerScope(req: Request): { userId?: string; anonSessionId?: string } | null {
  const u = (req as Request & { user?: { claims?: { sub?: string } } }).user;
  const userId = u?.claims?.sub;
  if (userId) return { userId };
  const raw = req.header("x-anon-session");
  if (typeof raw === "string" && raw.length > 0 && raw.length <= 128) {
    return { anonSessionId: raw };
  }
  return null;
}

/** Threshold (0-1) of lessons completed before practice tests unlock. */
const UNLOCK_THRESHOLD = 0.8;

/**
 * Compute lesson-completion progress for a caller within a trade. Returns
 * { totalLessons, completedLessons, fractionComplete, unlocked }. Counts
 * any lesson where the latest progress row has `completed = true`.
 */
async function computeTradeProgress(
  tradeSlug: string,
  scope: { userId?: string; anonSessionId?: string } | null,
): Promise<{
  totalLessons: number;
  completedLessons: number;
  fractionComplete: number;
  unlocked: boolean;
}> {
  // Look up the trade by slug to get its id.
  const tradeRows = await db.select().from(tradeSimsTrades).where(eq(tradeSimsTrades.slug, tradeSlug)).limit(1);
  const trade = tradeRows[0];
  if (!trade) {
    return { totalLessons: 0, completedLessons: 0, fractionComplete: 0, unlocked: false };
  }

  // All lessons for the trade.
  const lessons: LessonRow[] = await db
    .select()
    .from(tradeSimsLessons)
    .where(eq(tradeSimsLessons.tradeId, trade.id));
  const totalLessons = lessons.length;

  // No caller scope = no progress — return totals but locked.
  if (!scope || (!scope.userId && !scope.anonSessionId)) {
    return { totalLessons, completedLessons: 0, fractionComplete: 0, unlocked: false };
  }

  // Pull progress rows for this caller across the trade's lessons.
  // DB-side filter — never load the full table into memory. Caller-scope
  // (userId OR anonSessionId) is mutually exclusive per getCallerScope.
  const lessonIds = lessons.map((l: LessonRow) => l.id);
  if (lessonIds.length === 0) {
    return { totalLessons: 0, completedLessons: 0, fractionComplete: 0, unlocked: false };
  }
  const callerCondition = scope.userId
    ? eq(tradeSimsLessonProgress.userId, scope.userId)
    : eq(tradeSimsLessonProgress.anonSessionId, scope.anonSessionId!);
  const completedRows: ProgressRow[] = await db
    .select()
    .from(tradeSimsLessonProgress)
    .where(
      and(
        callerCondition,
        inArray(tradeSimsLessonProgress.lessonId, lessonIds),
        eq(tradeSimsLessonProgress.status, "completed"),
      ),
    );
  const completedLessons = completedRows.length;

  const fractionComplete = totalLessons === 0 ? 0 : completedLessons / totalLessons;
  return {
    totalLessons,
    completedLessons,
    fractionComplete,
    unlocked: fractionComplete >= UNLOCK_THRESHOLD,
  };
}

export function registerTradeSimsCertRoutes(app: Express) {
  /**
   * GET /api/trade-sims/certifications/:tradeSlug
   * Returns the cert + apprenticeship catalog plus the caller's unlock state.
   * Public — no auth required, but progress is scoped if a caller identity
   * is provided (login or x-anon-session).
   */
  app.get("/api/trade-sims/certifications/:tradeSlug", async (req: Request, res: Response) => {
    try {
      const tradeSlug = String(req.params.tradeSlug ?? "");
      const certCatalog = getCertCatalogForTrade(tradeSlug);
      const apprCatalog = getApprenticeshipCatalogForTrade(tradeSlug);
      if (!certCatalog || !apprCatalog) {
        return res.status(404).json({ error: "trade_not_found", tradeSlug });
      }
      const scope = getCallerScope(req);
      const progress = await computeTradeProgress(tradeSlug, scope);

      return res.json({
        tradeSlug,
        unlockThreshold: UNLOCK_THRESHOLD,
        progress,
        certifications: {
          intro: certCatalog.introCopy,
          items: certCatalog.certifications.map((cert) => ({
            slug: cert.slug,
            name: cert.name,
            sponsor: cert.sponsor,
            level: cert.level,
            whatItProves: cert.whatItProves,
            examDomains: cert.examDomains,
            unlocks: cert.unlocks,
            sponsorUrl: cert.sponsorUrl,
            eligibility: cert.eligibility,
            hasPerformanceTest: cert.hasPerformanceTest,
            // True only if we have practice questions seeded AND the caller unlocked.
            practiceAvailable: !!getPracticeBank(cert.slug),
          })),
        },
        apprenticeships: {
          intro: apprCatalog.introCopy,
          pathways: apprCatalog.pathways,
          universalLocators: UNIVERSAL_APPRENTICESHIP_LOCATORS,
        },
      });
    } catch (err) {
      // Per project gotcha: no silent catch — surface a structured error.
      console.error("[trade-sims/certifications] failed", err);
      return res.status(500).json({ error: "cert_catalog_failed" });
    }
  });

  /**
   * GET /api/trade-sims/certifications/:tradeSlug/practice/:certSlug
   * Returns the practice question bank ONLY if the caller has crossed the
   * unlock threshold for the trade. Gated so learners earn the prep.
   */
  app.get(
    "/api/trade-sims/certifications/:tradeSlug/practice/:certSlug",
    async (req: Request, res: Response) => {
      try {
        const tradeSlug = String(req.params.tradeSlug ?? "");
        const certSlug = String(req.params.certSlug ?? "");
        const cert = findCertification(tradeSlug, certSlug);
        if (!cert) {
          return res.status(404).json({ error: "cert_not_found", tradeSlug, certSlug });
        }
        const bank = getPracticeBank(certSlug);
        if (!bank) {
          return res.status(404).json({
            error: "practice_bank_not_seeded",
            certSlug,
            message: "Practice questions for this credential are still being written.",
          });
        }

        const scope = getCallerScope(req);
        const progress = await computeTradeProgress(tradeSlug, scope);
        if (!progress.unlocked) {
          return res.status(403).json({
            error: "practice_locked",
            progress,
            unlockThreshold: UNLOCK_THRESHOLD,
            message: `Finish at least ${Math.round(UNLOCK_THRESHOLD * 100)}% of ${tradeSlug} lessons to unlock practice.`,
          });
        }

        return res.json({
          certSlug,
          tradeSlug,
          intro: bank.intro,
          disclaimer:
            "Study questions only — not official exam content. Verify exam objectives, fees, and scheduling with the sponsor before paying or testing.",
          questions: bank.questions,
        });
      } catch (err) {
        console.error("[trade-sims/practice] failed", err);
        return res.status(500).json({ error: "practice_fetch_failed" });
      }
    },
  );
}
