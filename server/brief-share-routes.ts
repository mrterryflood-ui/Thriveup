/**
 * Shareable community brief links.
 *
 *   POST /api/conductor/community-brief/share  — store a brief, return a share URL
 *   GET  /api/conductor/community-brief/share/:shareId — retrieve stored brief
 */

import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { briefShares } from "@shared/schema";
import { eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hasValidCommunityEvidence, canonicalizeGeographyFromEvidence } from "./community-evidence";

// ── Per-IP rate limiter (5 shares / hour) ────────────────────────────────────
const SHARE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SHARE_MAX = 5;
const shareIpHits = new Map<string, number[]>();

function shareRateLimit(ip: string): number | null {
  const now = Date.now();
  const cutoff = now - SHARE_WINDOW_MS;
  const hits = (shareIpHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (hits.length >= SHARE_MAX) {
    return Math.max(1, Math.ceil((hits[0] + SHARE_WINDOW_MS - now) / 1000));
  }
  hits.push(now);
  shareIpHits.set(ip, hits);
  return null;
}

function clientIp(req: Request): string {
  return (req.ip || req.socket?.remoteAddress || "unknown").trim();
}

const MAX_PUBLIC_STRING = 4_000;
const MAX_PUBLIC_ARRAY = 50;
const DEMOGRAPHIC_FIELDS = [
  "totalPopulation", "population", "povertyRate", "unemploymentRate", "medianHouseholdIncome",
  "medianIncome", "uninsuredRate", "housingCostBurden", "noHighSchoolDiploma",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function publicString(value: unknown, limit = MAX_PUBLIC_STRING): string | undefined {
  return typeof value === "string" ? value.slice(0, limit) : undefined;
}

function publicNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function publicStrings(value: unknown, limit = MAX_PUBLIC_ARRAY): string[] {
  return Array.isArray(value)
    ? value.slice(0, limit).map((item) => publicString(item)).filter((item): item is string => item !== undefined)
    : [];
}

function projectPublicBrief(input: Record<string, unknown>): Record<string, unknown> {
  const geography = asRecord(input.geography);
  const evidence = asRecord(input.evidence);
  const evidenceGeography = asRecord(evidence.geography);
  const evidenceRequested = asRecord(evidenceGeography.requested);
  const evidenceResolved = asRecord(evidenceGeography.resolved);
  const evidenceClaims = asRecord(evidence.claims);
  const evidenceQuality = asRecord(evidence.dataQuality);
  const demographics = asRecord(input.demographics);
  const systemsScores = asRecord(input.systemsScores);
  const cascade = asRecord(input.cascade);
  const historicalCascade = asRecord(input.historicalCascade);
  const solutions = asRecord(input.solutions);

  const projected: Record<string, unknown> = {
    geography: {
      input: publicString(geography.input, 160),
      zip: publicString(geography.zip, 10),
      displayName: publicString(geography.displayName, 240),
      state: publicString(geography.state, 80),
      countyName: publicString(geography.countyName, 160),
    },
    evidence: {
      version: publicString(evidence.version, 64),
      geography: {
        requested: { input: publicString(evidenceRequested.input, 160), type: publicString(evidenceRequested.type, 32) },
        resolved: {
          type: publicString(evidenceResolved.type, 32),
          identifier: publicString(evidenceResolved.identifier, 80),
          label: publicString(evidenceResolved.label, 240),
          method: publicString(evidenceResolved.method, 120),
          coverageWarning: publicString(evidenceResolved.coverageWarning),
        },
      },
      sources: Array.isArray(evidence.sources) ? evidence.sources.slice(0, 12).map((raw) => {
        const source = asRecord(raw);
        return {
          publisher: publicString(source.publisher, 160),
          dataset: publicString(source.dataset, 240),
          vintage: publicString(source.vintage, 32),
          retrievedAt: publicString(source.retrievedAt, 64),
          url: publicString(source.url, 2_000),
          variables: publicStrings(source.variables, 50),
          geographyGrain: publicString(source.geographyGrain, 80),
        };
      }) : [],
      claims: Object.fromEntries(["observed", "tcafDerived", "tcafScenario", "historicalCascade", "aiSynthesis"]
        // historicalCascade is optional (added after the v1 contract shipped).
        // Only project it if it was actually present on the input — an empty
        // placeholder object (all-undefined fields) is a *present-but-invalid*
        // claim to hasValidCommunityEvidence, not an absent/optional one, and
        // would wrongly fail the post-projection re-validation below.
        .filter((name) => name !== "historicalCascade" || evidenceClaims[name] != null)
        .map((name) => {
          const claim = asRecord(evidenceClaims[name]);
          return [name, {
            label: publicString(claim.label, 160),
            status: publicString(claim.status, 32),
            disclosure: publicString(claim.disclosure),
          }];
        })),
      dataQuality: {
        status: publicString(evidenceQuality.status, 64),
        warnings: publicStrings(evidenceQuality.warnings, 20),
      },
    },
    overallScore: publicNumber(input.overallScore),
    overallGrade: publicString(input.overallGrade, 4),
    demographics: Object.fromEntries(DEMOGRAPHIC_FIELDS
      .map((field) => [field, typeof demographics[field] === "string" ? publicString(demographics[field], 160) : publicNumber(demographics[field])])
      .filter(([, value]) => value !== undefined)),
    systemsScores: Object.fromEntries(Object.entries(systemsScores).slice(0, 16).map(([domain, raw]) => {
      const score = asRecord(raw);
      return [domain.slice(0, 80), {
        score: publicNumber(score.score),
        grade: publicString(score.grade, 4),
        label: publicString(score.label, 160),
        icon: publicString(score.icon, 32),
        keyGap: publicString(score.keyGap, 500),
        urgency: publicString(score.urgency, 32),
      }];
    })),
    atRiskPopulations: Array.isArray(input.atRiskPopulations) ? input.atRiskPopulations.slice(0, 20).map((raw) => {
      const population = asRecord(raw);
      return {
        id: publicString(population.id, 80),
        name: publicString(population.name, 160),
        icon: publicString(population.icon, 32),
        estimated: publicNumber(population.estimated),
        unit: publicString(population.unit, 80),
        primaryGap: publicString(population.primaryGap, 500),
        urgency: publicString(population.urgency, 32),
        interventions: publicStrings(population.interventions, 12),
      };
    }) : [],
    cascade: input.cascade == null ? null : {
      timeHorizonYears: publicNumber(cascade.timeHorizonYears),
      populationSize: publicNumber(cascade.populationSize),
      counterfactualCost: publicNumber(cascade.counterfactualCost),
      interventionCost: publicNumber(cascade.interventionCost),
      netSavings: publicNumber(cascade.netSavings),
      roi: publicString(cascade.roi, 32),
      keyChains: Array.isArray(cascade.keyChains) ? cascade.keyChains.slice(0, 20).map((raw) => {
        const chain = asRecord(raw);
        return { chain: publicString(chain.chain, 240), without: publicString(chain.without), with: publicString(chain.with), costDelta: publicNumber(chain.costDelta) };
      }) : [],
      timeline: Array.isArray(cascade.timeline) ? cascade.timeline.slice(0, 30).map((raw) => {
        const node = asRecord(raw);
        return { age: publicString(node.age, 80), milestone: publicString(node.milestone, 240), without: publicString(node.without), with: publicString(node.with), interventionWindow: publicString(node.interventionWindow, 240) };
      }) : [],
    },
    historicalCascade: input.historicalCascade == null ? null : {
      vintages: Array.isArray(historicalCascade.vintages) ? historicalCascade.vintages.slice(0, 20).map((raw) => {
        const vintage = asRecord(raw);
        return { year: publicNumber(vintage.year), povertyRate: publicNumber(vintage.povertyRate), unemploymentRate: publicNumber(vintage.unemploymentRate), cohortCost: publicNumber(vintage.cohortCost) };
      }) : [],
      totalAccumulatedCost: publicNumber(historicalCascade.totalAccumulatedCost),
      trendDirection: publicString(historicalCascade.trendDirection, 32),
      yearsAboveCrisisThreshold: publicNumber(historicalCascade.yearsAboveCrisisThreshold),
      keyInsight: publicString(historicalCascade.keyInsight),
      yearsOfData: publicNumber(historicalCascade.yearsOfData),
    },
    solutions: {
      topInterventions: Array.isArray(solutions.topInterventions) ? solutions.topInterventions.slice(0, 20).map((raw) => {
        const intervention = asRecord(raw);
        return {
          id: publicString(intervention.id, 120), title: publicString(intervention.title, 240),
          shortName: publicString(intervention.shortName, 160), description: publicString(intervention.description),
          targetPopulation: publicString(intervention.targetPopulation, 240), deliveryModel: publicString(intervention.deliveryModel, 240),
          evidenceLevel: publicString(intervention.evidenceLevel, 80),
        };
      }) : [],
      grants: Array.isArray(solutions.grants) ? solutions.grants.slice(0, 20).map((raw) => {
        const grant = asRecord(raw);
        return { title: publicString(grant.title, 240), funder: publicString(grant.funder, 160), focusAreas: publicStrings(grant.focusAreas, 20), eligibility: publicString(grant.eligibility), url: publicString(grant.url, 2_000) };
      }) : [],
      policyActions: publicStrings(solutions.policyActions, 20),
    },
    narrative: publicString(input.narrative),
    generatedAt: publicString(input.generatedAt, 64),
  };
  return projected;
}

export function registerBriefShareRoutes(app: Express) {
  /**
   * POST /api/conductor/community-brief/share
   * Body: the full brief object the client already has.
   * Stores in brief_shares and returns {shareId, shareUrl}.
   * Public, rate-limited 5/hour/IP.
   */
  app.post("/api/conductor/community-brief/share", async (req: Request, res: Response) => {
    try {
      const ip = clientIp(req);
      const retryAfter = shareRateLimit(ip);
      if (retryAfter !== null) {
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: "Too many share requests. Please wait before sharing again.",
        });
      }

      const brief = req.body;
      if (!brief || typeof brief !== "object") {
        return res.status(400).json({ error: "brief object is required in request body" });
      }
      if (!hasValidCommunityEvidence(brief)) {
        return res.status(422).json({
          error: "This brief cannot be shared because it has no valid community evidence contract. Generate a new brief so the requested and resolved geography, sources, and claim types are disclosed.",
        });
      }

      // Share links cross a public trust boundary. Persist an explicit,
      // recursively bounded public projection rather than deleting a known
      // sensitive key from an otherwise arbitrary client object.
      const publicBrief = projectPublicBrief(brief as Record<string, unknown>);
      if (!hasValidCommunityEvidence(publicBrief)) {
        return res.status(422).json({
          error: "This brief cannot be shared because its public projection lacks a complete community evidence contract.",
        });
      }

      // The client supplies the whole brief object, including `geography`.
      // A structurally-valid evidence block does not guarantee the displayed
      // geography actually matches it — force the two to agree so a share
      // link can never show a geography/claims mismatch to the public.
      canonicalizeGeographyFromEvidence(publicBrief);

      const location = String(
        (publicBrief.geography as Record<string, unknown> | undefined)?.displayName
          ?? (publicBrief.geography as Record<string, unknown> | undefined)?.input
          ?? "community",
      ).slice(0, 400);

      const id = nanoid(8);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.insert(briefShares).values({
        id,
        location,
        briefData: publicBrief,
        createdAt: now,
        expiresAt,
      });

      // Opportunistic cleanup of expired rows (non-blocking; best-effort).
      db.delete(briefShares)
        .where(lt(briefShares.expiresAt, now))
        .catch((err: Error) => console.error("[brief-share] cleanup error:", err));

      const shareUrl = `https://thrivingcommunitiesforall.com/brief/${id}`;
      return res.json({ shareId: id, shareUrl });
    } catch (err) {
      console.error("[brief-share/post] error:", err);
      return res.status(500).json({ error: "Failed to create shareable link." });
    }
  });

  /**
   * GET /api/conductor/community-brief/share/:shareId
   * Returns the stored brief JSON. 404 if expired or not found.
   * Public.
   */
  app.get("/api/conductor/community-brief/share/:shareId", async (req: Request, res: Response) => {
    try {
      const shareId = String(req.params.shareId ?? "");
      if (!shareId) return res.status(400).json({ error: "shareId is required" });

      const [row] = await db
        .select()
        .from(briefShares)
        .where(eq(briefShares.id, shareId))
        .limit(1);

      if (!row) {
        return res.status(404).json({
          error: "Shared brief not found. It may have expired (links are valid for 30 days) or the ID is incorrect.",
        });
      }

      if (new Date(row.expiresAt) < new Date()) {
        // Clean up the expired row.
        await db.delete(briefShares).where(eq(briefShares.id, shareId)).catch(() => {});
        return res.status(404).json({
          error: "This shared brief has expired. Links are valid for 30 days from creation.",
        });
      }

      // Defensive strip on read: rows written before the POST-side strip was
      // deployed may still carry the analyst-only `rplice` block. The share
      // GET is public, so never return it — and scrub the stored row so the
      // legacy data doesn't linger until expiry.
      const stored = row.briefData as Record<string, unknown> | null;
      if (!hasValidCommunityEvidence(stored)) {
        return res.status(422).json({
          error: "This legacy shared brief lacks a complete evidence contract and is unavailable for public viewing. Generate a new brief before sharing it.",
        });
      }
      let dirty = false;
      const publicStored = projectPublicBrief(stored as Record<string, unknown>);
      if (JSON.stringify(publicStored) !== JSON.stringify(stored)) dirty = true;
      // Defensive re-canonicalization: a row written before this guard
      // existed could have a geography/evidence mismatch baked in already.
      if (publicStored) {
        const before = JSON.stringify(publicStored.geography);
        canonicalizeGeographyFromEvidence(publicStored);
        if (JSON.stringify(publicStored.geography) !== before) dirty = true;
      }
      if (dirty) {
        db.update(briefShares)
          .set({ briefData: publicStored })
          .where(eq(briefShares.id, shareId))
          .catch((err: Error) => console.error("[brief-share] legacy scrub error:", err));
      }
      return res.json(publicStored);
    } catch (err) {
      console.error("[brief-share/get] error:", err);
      return res.status(500).json({ error: "Failed to retrieve shared brief." });
    }
  });
}
