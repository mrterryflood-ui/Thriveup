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
import { tradeSimsTrades, tradeSimsLessons, tradeSimsLessonProgress, certificates, users } from "@shared/schema";
import { eq, and, inArray, asc, isNull } from "drizzle-orm";
import { fireWebhook } from "./webhook-dispatcher";

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

/** Anti-fabrication disclaimer shipped with every transcript/verification payload. */
const TRANSCRIPT_DISCLAIMER =
  "This transcript documents simulation-based training completed in ThriveUp Trade Sims. " +
  "It is evidence of study and simulated skill practice only. It is NOT an industry certification, " +
  "license, or credential, and it does not claim NCCER, TSBPE, TDLR, EPA, AWS, ASE, or any other " +
  "sponsor's credential. Listed credentials are pathways this training prepares a learner to pursue " +
  "through the sponsor's own exam and eligibility process.";

/** Honest per-lesson evidence rows shared by the transcript and public verify endpoints. */
function buildLessonEntries(lessons: LessonRow[], progressByLesson: Map<number, ProgressRow>) {
  return lessons.map((l: LessonRow) => {
    const p = progressByLesson.get(l.id);
    const concept = (l.concept ?? {}) as { engineMode?: string; keyTerms?: Array<{ term: string }> };
    const engineMode = concept.engineMode ?? "concept-only";
    const solo = (l.soloChallenge ?? {}) as { successCriteria?: string };
    return {
      dayNumber: l.dayNumber,
      title: l.title,
      shortDescription: l.shortDescription,
      // Honest evidence typing: interactive physics sim vs. concept study.
      evidenceType: engineMode === "concept-only" ? "concept_study" : "interactive_simulation",
      keyConcepts: (concept.keyTerms ?? []).slice(0, 6).map((k) => k.term),
      soloSuccessCriteria: solo.successCriteria ?? null,
      credentialPathway: l.credentialPathway ?? null,
      status: p?.status ?? "not_started",
      completed: p?.status === "completed",
      soloScore: p?.soloScore ?? null,
      attemptCount: p?.attemptCount ?? 0,
      completedAt: p?.status === "completed" ? p.updatedAt : null,
    };
  });
}

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
   * GET /api/trade-sims/verify/:certificateId
   * PUBLIC capability-URL verification: anyone holding the certificate's
   * unguessable UUID can view that learner's transcript snapshot — this is
   * the link learners share with employers. Exposes only the certificate
   * holder's name and their evidence for the certified trade; never any
   * other learner records. Same anti-fabrication disclaimer as the
   * transcript endpoint.
   */
  app.get("/api/trade-sims/verify/:certificateId", async (req: Request, res: Response) => {
    try {
      const certificateId = String(req.params.certificateId ?? "");
      const [cert] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.id, certificateId))
        .limit(1);
      if (!cert || !cert.sourceKey?.startsWith("trade-sim:")) {
        return res.status(404).json({ error: "certificate_not_found" });
      }
      const tradeSlug = cert.sourceKey.slice("trade-sim:".length);
      const [trade] = await db
        .select()
        .from(tradeSimsTrades)
        .where(eq(tradeSimsTrades.slug, tradeSlug))
        .limit(1);
      if (!trade) return res.status(404).json({ error: "certificate_not_found" });

      const lessons = await db
        .select()
        .from(tradeSimsLessons)
        .where(and(eq(tradeSimsLessons.tradeId, trade.id), eq(tradeSimsLessons.active, true)))
        .orderBy(asc(tradeSimsLessons.dayNumber));
      const progressRows: ProgressRow[] = lessons.length
        ? await db
            .select()
            .from(tradeSimsLessonProgress)
            .where(and(
              eq(tradeSimsLessonProgress.userId, cert.userId),
              inArray(tradeSimsLessonProgress.lessonId, lessons.map((l: LessonRow) => l.id)),
            ))
        : [];
      const progressByLesson = new Map<number, ProgressRow>(
        progressRows.map((p: ProgressRow) => [p.lessonId, p]),
      );
      const lessonEntries = buildLessonEntries(lessons, progressByLesson);
      const completedLessons = lessonEntries.filter((e) => e.completed).length;
      const certCatalog = getCertCatalogForTrade(tradeSlug);

      return res.json({
        valid: true,
        certificate: {
          id: cert.id,
          holderName: cert.userName,
          levelTitle: cert.levelTitle,
          issuedAt: cert.issuedAt,
        },
        tradeSlug,
        tradeName: trade.name,
        generatedAt: new Date().toISOString(),
        summary: { totalLessons: lessons.length, completedLessons },
        lessons: lessonEntries,
        preparationFor: (certCatalog?.certifications ?? []).map((c) => ({
          name: c.name,
          sponsor: c.sponsor,
          level: c.level,
          sponsorUrl: c.sponsorUrl,
        })),
        disclaimer: TRANSCRIPT_DISCLAIMER,
      });
    } catch (err) {
      console.error("[trade-sims/verify] failed", err);
      return res.status(500).json({ error: "verification_failed" });
    }
  });

  /**
   * GET /api/trade-sims/transcript/:tradeSlug
   * Skills transcript: per-lesson evidence (status, scores, attempts, dates),
   * completion summary, credential pathways, and — for authenticated learners
   * who completed every lesson — the issued certificate record. Issues the
   * certificate lazily if it doesn't exist yet (covers learners who finished
   * before certificate issuance shipped).
   *
   * Anti-fabrication contract: everything here is labeled simulation-based
   * training evidence. It is NEVER presented as an industry credential; the
   * `preparationFor` block explicitly says "preparation for", and the
   * disclaimer travels with the payload so every renderer shows it.
   */
  app.get("/api/trade-sims/transcript/:tradeSlug", async (req: Request, res: Response) => {
    try {
      const tradeSlug = String(req.params.tradeSlug ?? "");
      const [trade] = await db
        .select()
        .from(tradeSimsTrades)
        .where(eq(tradeSimsTrades.slug, tradeSlug))
        .limit(1);
      if (!trade) return res.status(404).json({ error: "trade_not_found", tradeSlug });

      const lessons = await db
        .select()
        .from(tradeSimsLessons)
        .where(and(eq(tradeSimsLessons.tradeId, trade.id), eq(tradeSimsLessons.active, true)))
        .orderBy(asc(tradeSimsLessons.dayNumber));

      const scope = getCallerScope(req);
      let progressRows: ProgressRow[] = [];
      if (scope && lessons.length > 0) {
        const callerCondition = scope.userId
          ? eq(tradeSimsLessonProgress.userId, scope.userId)
          : eq(tradeSimsLessonProgress.anonSessionId, scope.anonSessionId!);
        progressRows = await db
          .select()
          .from(tradeSimsLessonProgress)
          .where(
            and(
              callerCondition,
              inArray(tradeSimsLessonProgress.lessonId, lessons.map((l: LessonRow) => l.id)),
            ),
          );
      }
      const progressByLesson = new Map<number, ProgressRow>(
        progressRows.map((p: ProgressRow) => [p.lessonId, p]),
      );

      const lessonEntries = buildLessonEntries(lessons, progressByLesson);

      const totalLessons = lessons.length;
      const completedLessons = lessonEntries.filter((e) => e.completed).length;
      const complete = totalLessons > 0 && completedLessons === totalLessons;

      // Certificate: authenticated + fully complete only. Lazy-issue if missing
      // (covers learners who finished before certificate issuance shipped).
      // The (userId, sourceKey) unique index + onConflictDoNothing makes this
      // safe under concurrent transcript requests — exactly one insert wins.
      let certificate: { id: string; levelTitle: string; issuedAt: Date | null } | null = null;
      if (scope?.userId && complete) {
        const certTitle = `${trade.name} Trade Certification`;
        const sourceKey = `trade-sim:${tradeSlug}`;
        const [existing] = await db
          .select()
          .from(certificates)
          .where(and(eq(certificates.userId, scope.userId), eq(certificates.sourceKey, sourceKey)))
          .limit(1);
        if (existing) {
          certificate = { id: existing.id, levelTitle: existing.levelTitle, issuedAt: existing.issuedAt };
        } else {
          // Use the learner's real name on the credential, not a placeholder.
          const [u] = await db
            .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
            .from(users)
            .where(eq(users.id, scope.userId))
            .limit(1);
          const userName =
            [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || u?.email || "Learner";
          // Claim a legacy pre-source_key certificate for this trade (repairing
          // any placeholder name) instead of minting a duplicate alongside it.
          // Historical duplicates are possible, so claim exactly ONE
          // deterministic row (earliest issued) by primary key; extras stay
          // NULL-keyed (retired). A concurrent winner's unique-index conflict
          // is swallowed and the winner re-read below.
          const [legacy] = await db
            .select({ id: certificates.id })
            .from(certificates)
            .where(and(
              eq(certificates.userId, scope.userId),
              eq(certificates.levelTitle, certTitle),
              isNull(certificates.sourceKey),
            ))
            .orderBy(asc(certificates.issuedAt), asc(certificates.id))
            .limit(1);
          let claimed: typeof certificates.$inferSelect | undefined;
          if (legacy) {
            try {
              [claimed] = await db
                .update(certificates)
                .set({ sourceKey, userName })
                .where(and(eq(certificates.id, legacy.id), isNull(certificates.sourceKey)))
                .returning();
            } catch (err: any) {
              if (err?.code !== "23505") throw err;
            }
            if (!claimed) {
              // Lost the claim race — read whichever keyed certificate won.
              [claimed] = await db
                .select()
                .from(certificates)
                .where(and(eq(certificates.userId, scope.userId), eq(certificates.sourceKey, sourceKey)))
                .limit(1);
            }
          }
          if (claimed) {
            certificate = { id: claimed.id, levelTitle: claimed.levelTitle, issuedAt: claimed.issuedAt };
          } else {
          const [issued] = await db
            .insert(certificates)
            .values({ userId: scope.userId, userName, levelId: 1, levelTitle: certTitle, sourceKey })
            .onConflictDoNothing({ target: [certificates.userId, certificates.sourceKey] })
            .returning();
          if (issued) {
            certificate = { id: issued.id, levelTitle: issued.levelTitle, issuedAt: issued.issuedAt };
            // Fire webhook for new certificate issuance — non-blocking, never throws.
            fireWebhook("trade_cert.issued", {
              certId: issued.id,
              trade: sourceKey,
              issuedAt: (issued.issuedAt ?? new Date()).toISOString(),
              verificationUrl: `/api/trade-sims/verify/${issued.id}`,
            });
          } else {
            // Lost a benign race with a concurrent request — read the winner.
            const [winner] = await db
              .select()
              .from(certificates)
              .where(and(eq(certificates.userId, scope.userId), eq(certificates.sourceKey, sourceKey)))
              .limit(1);
            certificate = winner
              ? { id: winner.id, levelTitle: winner.levelTitle, issuedAt: winner.issuedAt }
              : null;
          }
          }
        }
      }

      const certCatalog = getCertCatalogForTrade(tradeSlug);

      return res.json({
        tradeSlug,
        tradeName: trade.name,
        generatedAt: new Date().toISOString(),
        learner: {
          kind: scope?.userId ? "account" : scope?.anonSessionId ? "anonymous" : "none",
        },
        summary: { totalLessons, completedLessons, complete },
        lessons: lessonEntries,
        certificate,
        // "Preparation for" — named credential pathways. Explicitly NOT claims.
        preparationFor: (certCatalog?.certifications ?? []).map((c) => ({
          name: c.name,
          sponsor: c.sponsor,
          level: c.level,
          sponsorUrl: c.sponsorUrl,
        })),
        disclaimer: TRANSCRIPT_DISCLAIMER,
      });
    } catch (err) {
      console.error("[trade-sims/transcript] failed", err);
      return res.status(500).json({ error: "transcript_failed" });
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
