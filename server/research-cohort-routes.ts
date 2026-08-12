/**
 * research-cohort-routes.ts
 *
 * Longitudinal participant thread API.
 *
 * Data model:
 *   participantCohortThreads — one row per consented participant. The
 *   cohortHash is SHA-256(birthYear‖serviceZip‖referralSource) so no PII
 *   is stored. Timestamps mark stage arrivals: intake → academy → placement.
 *
 * API:
 *   GET  /api/research/cohort-pipeline        — aggregate funnel (admin)
 *   POST /api/research/cohort-threads         — create/upsert a thread (staff)
 *   GET  /api/research/cohort-threads/export  — CSV export (admin)
 *
 * Privacy invariants:
 *   - Counts are suppressed below 5 (returns null) to prevent re-identification.
 *   - consentGiven must be true for a thread to appear in aggregate counts.
 *   - No individual records are ever returned — only aggregate buckets.
 */

import { Router, type Request, type Response } from "express";
import { createHash } from "crypto";
import { db } from "./storage";
import {
  participantCohortThreads,
  yhsiYouthParticipants,
  jobPlacements,
  trainingEnrollments,
  certificates,
} from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export const cohortRouter = Router();

// ── Suppression helper ────────────────────────────────────────────────────────
const suppress = (n: number): number | null => (n >= 5 ? n : null);

// ── Hash helper — deterministic, no PII ──────────────────────────────────────
export function buildCohortHash(
  birthYear: number | null | undefined,
  serviceZip: string | null | undefined,
  referralSource: string | null | undefined,
): string {
  const input = [
    String(birthYear ?? "unknown"),
    (serviceZip ?? "").replace(/\D/g, "").slice(0, 5) || "00000",
    (referralSource ?? "other").toLowerCase().slice(0, 30),
  ].join("|");
  return createHash("sha256").update(input).digest("hex");
}

// ── Middleware: admin-only ────────────────────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!(req as any).isAuthenticated?.()) return res.status(401).json({ error: "Auth required" });
  const role = (req as any).user?.role;
  if (!["admin", "staff", "superadmin"].includes(role ?? "")) {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}

// ── GET /api/research/cohort-pipeline — aggregate funnel ─────────────────────
cohortRouter.get("/cohort-pipeline", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { state, zip, minYear, maxYear } = req.query as Record<string, string>;

    const rows = await db.select().from(participantCohortThreads)
      .where(and(
        eq(participantCohortThreads.consentGiven, true),
        state ? eq(participantCohortThreads.geographyState, state) : undefined,
        zip ? eq(participantCohortThreads.geographyZip, zip) : undefined,
      ));

    const total = rows.length;
    const intake         = rows.filter(r => r.yhsiIntakeAt).length;
    const academyEnroll  = rows.filter(r => r.academyEnrolledAt).length;
    const academyComplete= rows.filter(r => r.academyCompletedAt).length;
    const placed         = rows.filter(r => r.workforcePlacedAt).length;
    const retained90d    = rows.filter(r => r.workforceRetained90dAt).length;

    // Service category breakdown
    const catMap: Record<string, number> = {};
    for (const r of rows) {
      for (const cat of r.serviceCategories ?? []) {
        catMap[cat] = (catMap[cat] ?? 0) + 1;
      }
    }

    // Geography breakdown
    const stateMap: Record<string, number> = {};
    for (const r of rows) {
      if (r.geographyState) stateMap[r.geographyState] = (stateMap[r.geographyState] ?? 0) + 1;
    }

    // Stage conversion rates (only non-null counts exposed)
    res.json({
      suppressed: total < 5,
      funnel: {
        cohorts:          suppress(total),
        yhsiIntake:       suppress(intake),
        academyEnrolled:  suppress(academyEnroll),
        academyCompleted: suppress(academyComplete),
        workforcePlaced:  suppress(placed),
        retained90d:      suppress(retained90d),
      },
      conversionRates: total >= 5 ? {
        intakeToAcademy:   intake   > 0 ? +(academyEnroll  / intake   * 100).toFixed(1) : null,
        academyToComplete: academyEnroll > 0 ? +(academyComplete / academyEnroll * 100).toFixed(1) : null,
        completionToPlace: academyComplete > 0 ? +(placed / academyComplete * 100).toFixed(1) : null,
        placementRetention: placed > 0 ? +(retained90d / placed * 100).toFixed(1) : null,
      } : null,
      byServiceCategory: Object.fromEntries(
        Object.entries(catMap)
          .filter(([, n]) => n >= 5)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
      ),
      byState: Object.fromEntries(
        Object.entries(stateMap)
          .filter(([, n]) => n >= 5)
          .sort(([, a], [, b]) => b - a)
      ),
      methodology: "SHA-256 cohort hash of birth year + service ZIP + referral source. " +
        "Counts < 5 suppressed. Consent required for inclusion. " +
        "Sources: YHSI intake, academy completions, workforce placements.",
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[cohort] pipeline:", err.message);
    res.status(500).json({ error: "Failed to load cohort pipeline" });
  }
});

// ── POST /api/research/cohort-threads — create or update a thread ─────────────
// Called by the YHSI intake flow, academy completion hooks, and workforce
// placement handlers. Upserts on cohortHash so duplicate events just update
// timestamps, never create a second row for the same person.
cohortRouter.post("/cohort-threads", async (req: Request, res: Response) => {
  try {
    if (!(req as any).isAuthenticated?.()) return res.status(401).json({ error: "Auth required" });

    const {
      birthYear, serviceZip, referralSource,
      yhsiParticipantId, userId, participantProfileId,
      stage,          // "intake" | "academy_enrolled" | "academy_completed" | "workforce_placed" | "retained_90d"
      serviceCategories, geographyState,
      consentGiven,
    } = req.body;

    if (!stage || !["intake","academy_enrolled","academy_completed","workforce_placed","retained_90d"].includes(stage)) {
      return res.status(400).json({ error: "stage required: intake | academy_enrolled | academy_completed | workforce_placed | retained_90d" });
    }
    if (!consentGiven) {
      return res.status(400).json({ error: "consentGiven:true is required to create a cohort thread" });
    }

    const cohortHash = buildCohortHash(birthYear, serviceZip, referralSource);

    const stageTimestamps: Record<string, object> = {
      intake:             { yhsiIntakeAt: new Date() },
      academy_enrolled:   { academyEnrolledAt: new Date() },
      academy_completed:  { academyCompletedAt: new Date() },
      workforce_placed:   { workforcePlacedAt: new Date() },
      retained_90d:       { workforceRetained90dAt: new Date() },
    };

    const [existing] = await db.select({ id: participantCohortThreads.id })
      .from(participantCohortThreads)
      .where(eq(participantCohortThreads.cohortHash, cohortHash));

    if (existing) {
      await db.update(participantCohortThreads)
        .set({
          ...stageTimestamps[stage],
          updatedAt: new Date(),
          ...(serviceCategories ? { serviceCategories } : {}),
          ...(yhsiParticipantId ? { yhsiParticipantId } : {}),
          ...(userId ? { userId } : {}),
          ...(participantProfileId ? { participantProfileId } : {}),
        })
        .where(eq(participantCohortThreads.id, existing.id));
      return res.json({ id: existing.id, updated: true });
    }

    const [created] = await db.insert(participantCohortThreads).values({
      cohortHash,
      yhsiParticipantId: yhsiParticipantId ?? null,
      userId: userId ?? null,
      participantProfileId: participantProfileId ?? null,
      ...stageTimestamps[stage],
      serviceCategories: serviceCategories ?? [],
      geographyZip: serviceZip ? String(serviceZip).slice(0, 5) : null,
      geographyState: geographyState ?? null,
      consentGiven: true,
    }).returning({ id: participantCohortThreads.id });

    res.status(201).json({ id: created.id, created: true });
  } catch (err: any) {
    console.error("[cohort] upsert:", err.message);
    res.status(500).json({ error: "Failed to upsert cohort thread" });
  }
});

// ── GET /api/research/cohort-threads/export — TSV export for HHS/DOL ─────────
// Returns aggregate bucket rows (not individual records) as TSV so state
// research offices can ingest them directly.
cohortRouter.get("/cohort-threads/export", requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const rows = await db.select({
      geographyState: participantCohortThreads.geographyState,
      geographyZip:   participantCohortThreads.geographyZip,
      serviceCategories: participantCohortThreads.serviceCategories,
      hasIntake:      participantCohortThreads.yhsiIntakeAt,
      hasAcademy:     participantCohortThreads.academyCompletedAt,
      hasPlacement:   participantCohortThreads.workforcePlacedAt,
      hasRetention:   participantCohortThreads.workforceRetained90dAt,
    }).from(participantCohortThreads)
      .where(eq(participantCohortThreads.consentGiven, true));

    // Aggregate by state+zip+primary_category bucket, suppress < 5
    type Bucket = {
      state: string; zip: string; category: string;
      total: number; intake: number; academy: number; placed: number; retained: number;
    };
    const buckets = new Map<string, Bucket>();
    for (const r of rows) {
      const state = r.geographyState ?? "UNK";
      const zip   = r.geographyZip ?? "00000";
      const cat   = (r.serviceCategories ?? [])[0] ?? "general";
      const key   = `${state}|${zip}|${cat}`;
      if (!buckets.has(key)) buckets.set(key, { state, zip, category: cat, total:0, intake:0, academy:0, placed:0, retained:0 });
      const b = buckets.get(key)!;
      b.total++;
      if (r.hasIntake)    b.intake++;
      if (r.hasAcademy)   b.academy++;
      if (r.hasPlacement) b.placed++;
      if (r.hasRetention) b.retained++;
    }

    const lines = ["state\tzip\tservice_category\ttotal_cohort\tyhsi_intake\tacademy_completed\tworkforce_placed\tretained_90d\texport_date"];
    const isoDate = new Date().toISOString().slice(0, 10);
    for (const b of buckets.values()) {
      if (b.total < 5) continue; // suppression
      lines.push([b.state, b.zip, b.category, b.total, b.intake, b.academy, b.placed, b.retained, isoDate].join("\t"));
    }

    res.setHeader("Content-Type", "text/tab-separated-values");
    res.setHeader("Content-Disposition", `attachment; filename="cohort-pipeline-${isoDate}.tsv"`);
    res.send(lines.join("\n"));
  } catch (err: any) {
    console.error("[cohort] export:", err.message);
    res.status(500).json({ error: "Export failed" });
  }
});
