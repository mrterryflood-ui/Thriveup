import type { Express, Request, Response, NextFunction } from "express";
import { db, storage } from "./storage";
import {
  partnerApiKeys, partnerApiAuditLog, partnerInboundData, ecosystemPlatforms,
  programs, partnerOutcomeSubmissions,
  studentProgress, academyPantherPower, pathwayPlans,
  attendanceLogs, earlyWarningFlags,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { AI_TRANSLATION_LANGUAGE_COUNT, GEOGRAPHIC_REACH } from "@shared/canonical-claims";
import { SUPPRESSION_FLOOR, suppress } from "./yhsi-routes";
import crypto from "crypto";

function hashKey(plaintext: string): string {
  return crypto.createHash("sha256").update(plaintext).digest("hex");
}

function generateKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const plaintext = `tcaf_${raw}`;
  const prefix = plaintext.slice(0, 14);
  return { plaintext, prefix, hash: hashKey(plaintext) };
}

export async function requirePartnerAuth(req: Request, res: Response, next: NextFunction) {
  const ecosystemKey = req.headers["x-ecosystem-key"] as string;
  const partnerKeyRaw = (req.headers["x-partner-key"] as string) || (req.headers["authorization"] || "").replace("Bearer ", "");

  // ── Path A: Ecosystem sibling platform (your own platforms) ─────────────
  if (ecosystemKey) {
    const [platform] = await db.select({
      id: ecosystemPlatforms.id,
      name: ecosystemPlatforms.name,
      domain: ecosystemPlatforms.domain,
      role: ecosystemPlatforms.role,
    }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, ecosystemKey));

    if (!platform) {
      return res.status(401).json({ error: "Invalid ecosystem key." });
    }

    // Ecosystem platforms get all scopes — they are trusted siblings
    (req as any).partnerKey = {
      partnerName: platform.name,
      scopes: ["content:read","platforms:read","community:read","benefits:read","impact:read","student:read","inbound:write"],
      isEcosystemPlatform: true,
      platformId: platform.id,
    };

    await db.insert(partnerApiAuditLog).values({
      keyId: platform.id,
      keyPrefix: `eco_${platform.id.slice(0, 10)}`,
      partnerName: platform.name,
      endpoint: req.path,
      method: req.method,
      statusCode: 200,
      ip: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
      userAgent: (req.headers["user-agent"] || "").slice(0, 299),
    }).catch(() => {});

    return next();
  }

  // ── Path B: External partner with tcaf_ key ──────────────────────────────
  if (!partnerKeyRaw || !partnerKeyRaw.startsWith("tcaf_")) {
    return res.status(401).json({
      error: "Authentication required. Include x-ecosystem-key (ecosystem platforms) or x-partner-key: tcaf_... (external partners).",
    });
  }

  const hash = hashKey(partnerKeyRaw);
  const [key] = await db.select().from(partnerApiKeys).where(and(eq(partnerApiKeys.keyHash, hash), eq(partnerApiKeys.active, true)));
  if (!key) {
    return res.status(401).json({ error: "Invalid or revoked partner key." });
  }

  (req as any).partnerKey = key;

  await db.insert(partnerApiAuditLog).values({
    keyId: key.id,
    keyPrefix: key.keyPrefix,
    partnerName: key.partnerName,
    endpoint: req.path,
    method: req.method,
    statusCode: 200,
    ip: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
    userAgent: (req.headers["user-agent"] || "").slice(0, 299),
  }).catch(() => {});

  await db.update(partnerApiKeys)
    .set({ usageCount: key.usageCount + 1, lastUsedAt: new Date() })
    .where(eq(partnerApiKeys.id, key.id))
    .catch(() => {});

  next();
}

export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key: any = (req as any).partnerKey;
    // Ecosystem platforms already have all scopes granted in requirePartnerAuth
    if (key?.isEcosystemPlatform) return next();
    if (!key?.scopes?.includes(scope)) {
      return res.status(403).json({ error: `This key does not have the '${scope}' scope.` });
    }
    next();
  };
}

// Admin auth. Roles live in the users table and are NEVER trusted from
// req.user/session — we resolve the id and hit the DB, matching the YHSI
// requireStaff pattern in server/yhsi-routes.ts. Session presence alone is
// insufficient; any authenticated non-admin must be rejected with 403.
const ADMIN_ROLES = new Set(["admin", "teacher"]);

async function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  // Resolve the caller's user id from the passport session / req.user.
  const user = (req as any).user;
  const session = (req as any).session;
  const userId: string | undefined =
    user?.claims?.sub || user?.id || session?.passport?.user?.claims?.sub || session?.passport?.user;

  if (!userId || typeof userId !== "string") {
    return res.status(401).json({ error: "Admin authentication required." });
  }

  try {
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !ADMIN_ROLES.has(dbUser.role)) {
      return res.status(403).json({ error: "Admin access required." });
    }
    return next();
  } catch (err) {
    console.error("[PartnerAPI] admin role lookup failed:", err);
    return res.status(500).json({ error: "Admin authorization check failed." });
  }
}

export function registerPartnerApiRoutes(app: Express) {

  // ── Startup: auto-provision pinned partner keys from env secrets ───────────
  // Runs once on boot. Safe to re-run — skips if key already present.
  // This ensures keys provisioned in dev are automatically present in production
  // after deploy without requiring a manual DB insert on the prod replica.
  ;(async () => {
    try {
      const PINNED: Array<{
        envVar: string;
        partnerName: string;
        partnerEmail: string;
        scopes: string[];
        notes: string;
      }> = [
        {
          envVar: "THRIVEUP_PARTNER_KEY",
          partnerName: "GrantPathPro",
          partnerEmail: "terryflood@thrivingcommunitiesforall.com",
          scopes: ["community:read", "impact:read", "benefits:read", "inbound:write"],
          notes: "Pinned key — auto-provisioned from THRIVEUP_PARTNER_KEY secret",
        },
      ];

      for (const pin of PINNED) {
        const plaintext = process.env[pin.envVar];
        if (!plaintext || !plaintext.startsWith("tcaf_")) continue;

        const hash = hashKey(plaintext);
        const existing = await db.select({ id: partnerApiKeys.id })
          .from(partnerApiKeys)
          .where(eq(partnerApiKeys.keyHash, hash));

        if (existing.length === 0) {
          const prefix = plaintext.slice(0, 14);
          await db.insert(partnerApiKeys).values({
            partnerName: pin.partnerName,
            partnerEmail: pin.partnerEmail,
            keyHash: hash,
            keyPrefix: prefix,
            scopes: pin.scopes,
            active: true,
            notes: pin.notes,
          });
          console.log(`[PartnerAPI] Auto-provisioned pinned key for ${pin.partnerName} (${prefix}...)`);
        } else {
          console.log(`[PartnerAPI] Pinned key for ${pin.partnerName} already present — skipping.`);
        }
      }
    } catch (err) {
      console.error("[PartnerAPI] Startup key provisioning error:", err);
    }
  })();

  // ── Public schema docs (no auth — external devs can self-onboard) ─────────

  app.get("/api/partner/v1/docs", (_req, res) => {
    res.json({
      gateway: "ThriveUp Academy Partner API",
      version: "1.0",
      baseUrl: "/api/partner/v1",
      auth: {
        option_A_ecosystem_platforms: {
          header: "x-ecosystem-key",
          value: "<your platform's ecosystem API key from the DB>",
          who: "The Collaborative Advocate Foundation's own sibling platforms (WPH, Sankofa, LifeBridge, etc.)",
          scopes: "all — no restrictions",
          setup: "Zero setup. Your ecosystem key is already provisioned. Pass it in x-ecosystem-key.",
        },
        option_B_external_partners: {
          header: "x-partner-key",
          format: "tcaf_<hex>",
          who: "External organizations, third-party sites",
          setup: "Email terryflood@thrivingcommunitiesforall.com to request a scoped key.",
        },
      },
      scopes: [
        { scope: "content:read",    description: "Ecosystem platform list and content export" },
        { scope: "platforms:read",  description: "Live platform health status and metadata" },
        { scope: "community:read",  description: "Community impact metrics and service-platform summary" },
        { scope: "benefits:read",   description: "Public benefits program catalog" },
        { scope: "impact:read",     description: "Community intervention impact scores and outcome data" },
        { scope: "student:read",    description: "AGGREGATE, suppression-floored youth metrics only — no per-student PII. See students/* endpoints." },
        { scope: "inbound:write",   description: "POST referrals, events, metrics, or alerts into ThriveUp" },
      ],
      endpoints: [
        "GET  /api/partner/v1/docs              — this schema (public)",
        "GET  /api/partner/v1/health            — auth check + key info (any scope)",
        "GET  /api/partner/v1/platforms         — live platform list (platforms:read)",
        "GET  /api/partner/v1/export            — content export (content:read)",
        "GET  /api/partner/v1/community         — community service summary (community:read)",
        "GET  /api/partner/v1/benefits          — benefits program catalog (benefits:read)",
        "GET  /api/partner/v1/impact            — community impact metrics (impact:read)",
        "GET  /api/partner/v1/students/overview — AGGREGATE cohort metrics, suppression-floored (student:read)",
        "GET  /api/partner/v1/attendance/summary      — AGGREGATE attendance metrics, suppression-floored (student:read)",
        "GET  /api/partner/v1/early-warnings          — AGGREGATE early-warning counts, suppression-floored (student:read)",
        "GET  /api/partner/v1/pathways/overview       — AGGREGATE pathway distribution, suppression-floored (student:read)",
        "POST /api/partner/v1/push              — push data to ThriveUp (inbound:write)",
        "POST /api/partner/v1/heartbeat         — platform keepalive (any scope)",
      ],
      deprecatedEndpoints: {
        note: "The /api/external/* endpoints are deprecated. Migrate to /api/partner/v1/* with a scoped tcaf_ key. Per-student detail endpoints (thrive/assessments/pathway by id) are REMOVED — see students/* aggregate note below.",
        studentDataNote: "Per-student youth records are no longer served over the partner API. Partner keys have no tenant/audience binding in the schema, so honoring an arbitrary :userId would expose any child's records to any keyholder. All student:read endpoints now return AGGREGATE, suppression-floored data only.",
        mapping: {
          "GET /api/external/students/overview"         : "GET /api/partner/v1/students/overview (now AGGREGATE only)",
          "GET /api/external/students/:id/thrive"       : "REMOVED (410) — no per-student PII over partner API",
          "GET /api/external/students/:id/assessments"  : "REMOVED (410) — no per-student PII over partner API",
          "GET /api/external/students/:id/pathway"      : "REMOVED (410) — no per-student PII over partner API",
          "GET /api/external/attendance/summary"        : "GET /api/partner/v1/attendance/summary (now AGGREGATE only)",
          "GET /api/external/early-warnings"            : "GET /api/partner/v1/early-warnings (now AGGREGATE counts only)",
          "GET /api/external/reflections/recent"        : "REMOVED (410) — no per-student reflections over partner API",
          "GET /api/external/pathways/overview"         : "GET /api/partner/v1/pathways/overview (scope: student:read)",
          "POST /api/external/interventions/receive"    : "POST /api/partner/v1/push with dataType=intervention (scope: inbound:write)",
        },
      },
      rateLimit: "No hard rate limit currently. Please be respectful — bulk imports should be batched.",
      contact: "terryflood@thrivingcommunitiesforall.com",
    });
  });

  // ── Authenticated partner endpoints ───────────────────────────────────────

  app.get("/api/partner/v1/health", requirePartnerAuth, (req, res) => {
    const key: any = (req as any).partnerKey;
    res.json({
      status: "ok",
      partner: key.partnerName,
      scopes: key.scopes,
      timestamp: new Date().toISOString(),
      message: "ThriveUp Partner API is live. You are authenticated.",
    });
  });

  app.get("/api/partner/v1/export", requirePartnerAuth, requireScope("content:read"), async (req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        description: ecosystemPlatforms.description,
        domain: ecosystemPlatforms.domain,
        role: ecosystemPlatforms.role,
        url: ecosystemPlatforms.url,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      const records = platforms
        .filter(p => p.description)
        .map(p => ({
          id: `platform:${p.id}`,
          content: `${p.name}: ${p.description}`,
          metadata: {
            source: "thriveup-academy",
            type: "platform",
            domain: p.domain,
            role: p.role,
            url: p.url,
            exportedAt: new Date().toISOString(),
          },
        }));

      res.json({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        count: records.length,
        records,
      });
    } catch (err) {
      res.status(500).json({ error: "Export failed." });
    }
  });

  app.get("/api/partner/v1/platforms", requirePartnerAuth, requireScope("platforms:read"), async (req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        url: ecosystemPlatforms.url,
        domain: ecosystemPlatforms.domain,
        role: ecosystemPlatforms.role,
        healthStatus: ecosystemPlatforms.healthStatus,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      res.json({ count: platforms.length, platforms });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch platforms." });
    }
  });

  // ── Community data (community:read) ──────────────────────────────────────

  app.get("/api/partner/v1/community", requirePartnerAuth, requireScope("community:read"), async (_req, res) => {
    try {
      const platforms = await db.select({
        id: ecosystemPlatforms.id,
        name: ecosystemPlatforms.name,
        role: ecosystemPlatforms.role,
        domain: ecosystemPlatforms.domain,
        healthStatus: ecosystemPlatforms.healthStatus,
        description: ecosystemPlatforms.description,
      }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

      const byDomain: Record<string, number> = {};
      const byRole: Record<string, number> = {};
      for (const p of platforms) {
        if (p.domain) byDomain[p.domain] = (byDomain[p.domain] || 0) + 1;
        if (p.role) byRole[p.role] = (byRole[p.role] || 0) + 1;
      }
      const online = platforms.filter(p => p.healthStatus === "healthy" || p.healthStatus === "ok").length;

      res.json({
        summary: {
          totalPlatforms: platforms.length,
          platformsOnline: online,
          platformsByDomain: byDomain,
          platformsByRole: byRole,
          languagesSupported: AI_TRANSLATION_LANGUAGE_COUNT,
          languagesNote: "Machine translation via the AI layer — not human-verified translations.",
          geographicReach: GEOGRAPHIC_REACH,
          exportedAt: new Date().toISOString(),
        },
        platforms,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch community summary." });
    }
  });

  // ── Benefits program catalog (benefits:read) ──────────────────────────────

  app.get("/api/partner/v1/benefits", requirePartnerAuth, requireScope("benefits:read"), async (req, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || "100", 10), 500);
      const catalog = await db.select({
        id: programs.id,
        title: programs.title,
        description: programs.description,
        methodology: programs.methodology,
        status: programs.status,
        targetPopulation: programs.targetPopulation,
        geographicFocus: programs.geographicFocus,
      }).from(programs).limit(limit);
      res.json({ count: catalog.length, programs: catalog, exportedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch benefits catalog." });
    }
  });

  // ── Community impact metrics (impact:read) ────────────────────────────────

  app.get("/api/partner/v1/impact", requirePartnerAuth, requireScope("impact:read"), async (req, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);
      const outcomes = await db.select({
        orgName: partnerOutcomeSubmissions.orgName,
        programName: partnerOutcomeSubmissions.programName,
        programType: partnerOutcomeSubmissions.programType,
        reportingPeriod: partnerOutcomeSubmissions.reportingPeriod,
        participantsServed: partnerOutcomeSubmissions.participantsServed,
        participantsCompleted: partnerOutcomeSubmissions.participantsCompleted,
        enteredEmployment: partnerOutcomeSubmissions.enteredEmployment,
        retainedEmployment6mo: partnerOutcomeSubmissions.retainedEmployment6mo,
        credentialsAttained: partnerOutcomeSubmissions.credentialsAttained,
        cfirFidelityScore: partnerOutcomeSubmissions.cfirFidelityScore,
        countyFips: partnerOutcomeSubmissions.countyFips,
      }).from(partnerOutcomeSubmissions).orderBy(desc(partnerOutcomeSubmissions.id)).limit(limit);

      const totals = outcomes.reduce((acc, o) => ({
        participantsServed: acc.participantsServed + (o.participantsServed || 0),
        enteredEmployment: acc.enteredEmployment + (o.enteredEmployment || 0),
        credentialsAttained: acc.credentialsAttained + (o.credentialsAttained || 0),
      }), { participantsServed: 0, enteredEmployment: 0, credentialsAttained: 0 });

      res.json({ totals, count: outcomes.length, outcomes, exportedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch impact metrics." });
    }
  });

  // ── Student data (student:read) — AGGREGATE, SUPPRESSION-FLOORED ONLY ──────
  //
  // DECISION (adversarial re-audit remediation): The partner_api_keys table has
  // NO org/tenant/audience column (see shared/schema.ts ~6374). A partner key is
  // therefore an UNBOUNDED credential — it cannot be scoped to a subset of youth.
  // Honoring an arbitrary :userId or returning per-student rows would let ANY
  // keyholder pull ANY child's thrive scores, early-warning flags, self-
  // assessments, pathway plans, attendance, and reflections. That is a cross-
  // tenant youth-PII exposure and inventing a tenant model here would require a
  // schema change (out of scope / no db:push allowed).
  //
  // Least-breaking honest fix (option a): all student:read endpoints now return
  // ONLY aggregate, small-cell-suppressed metrics (floor 5, mirroring the YHSI
  // suppress() doctrine). Per-student detail routes are REMOVED and answer 410.
  // No names, no user ids, no per-row PII ever leave these handlers.
  // Every access is already recorded by requirePartnerAuth's audit-log insert.

  const suppressMap = (m: Record<string, number>): Record<string, number | null> =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, suppress(v)]));

  // Per-student detail routes are permanently removed — they cannot be served
  // safely without a tenant binding. Answer 410 Gone (still auth+scope gated so
  // the audit log captures the attempt) rather than silently 404.
  const removedStudentDetail = (req: Request, res: Response) => {
    res.status(410).json({
      error: "Per-student detail is no longer served over the partner API.",
      reason: "Partner keys are not bound to a data boundary; serving arbitrary :userId would expose any youth's records to any keyholder.",
      alternative: "Use the aggregate, suppression-floored endpoints: /students/overview, /attendance/summary, /early-warnings, /pathways/overview.",
    });
  };
  app.get("/api/partner/v1/students/:userId/thrive", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);
  app.get("/api/partner/v1/students/:userId/assessments", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);
  app.get("/api/partner/v1/students/:userId/pathway", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);
  app.get("/api/partner/v1/students/reflections", requirePartnerAuth, requireScope("student:read"), removedStudentDetail);

  app.get("/api/partner/v1/students/overview", requirePartnerAuth, requireScope("student:read"), async (req, res) => {
    try {
      const gradeFilter = req.query.grade ? parseInt(req.query.grade as string, 10) : null;
      const progress = await db.select().from(studentProgress);
      const power = await db.select().from(academyPantherPower);
      const pathways = await db.select().from(pathwayPlans);
      const powerMap = new Map(power.map(p => [p.userId, p]));
      const pathwayMap = new Map(pathways.map(pw => [pw.userId, pw]));

      // Build a per-student view internally, but ONLY emit suppressed aggregates.
      let students = progress.map(p => {
        const uid = p.userId ?? "";
        const pp = uid ? powerMap.get(uid) : undefined;
        const pw = uid ? pathwayMap.get(uid) : undefined;
        return {
          totalPoints: p.totalPoints ?? 0,
          lessonsCompleted: p.lessonsCompleted ?? 0,
          streakDays: p.streakDays ?? 0,
          pantherLevel: pp?.level ?? null,
          currentGrade: pw?.currentGrade ?? null,
          status: pw?.status ?? null,
        };
      });
      if (gradeFilter !== null && !isNaN(gradeFilter)) {
        students = students.filter(s => s.currentGrade === gradeFilter);
      }

      const n = students.length;
      const gradeDistribution: Record<string, number> = {};
      const statusDistribution: Record<string, number> = {};
      const levelDistribution: Record<string, number> = {};
      let sumPoints = 0, sumLessons = 0, sumStreak = 0;
      for (const s of students) {
        sumPoints += s.totalPoints; sumLessons += s.lessonsCompleted; sumStreak += s.streakDays;
        if (s.currentGrade != null) gradeDistribution[String(s.currentGrade)] = (gradeDistribution[String(s.currentGrade)] || 0) + 1;
        if (s.status) statusDistribution[s.status] = (statusDistribution[s.status] || 0) + 1;
        if (s.pantherLevel != null) levelDistribution[String(s.pantherLevel)] = (levelDistribution[String(s.pantherLevel)] || 0) + 1;
      }

      res.json({
        aggregateOnly: true,
        suppressionNote: `Cohort counts below ${SUPPRESSION_FLOOR} are suppressed (null); averages require a cohort of at least ${SUPPRESSION_FLOOR}.`,
        totalStudents: suppress(n),
        averages: n >= SUPPRESSION_FLOOR ? {
          avgTotalPoints: Math.round(sumPoints / n),
          avgLessonsCompleted: Math.round((sumLessons / n) * 10) / 10,
          avgStreakDays: Math.round((sumStreak / n) * 10) / 10,
        } : null,
        gradeDistribution: suppressMap(gradeDistribution),
        statusDistribution: suppressMap(statusDistribution),
        pantherLevelDistribution: suppressMap(levelDistribution),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch student overview." });
    }
  });

  app.get("/api/partner/v1/attendance/summary", requirePartnerAuth, requireScope("student:read"), async (_req, res) => {
    try {
      const logs = await db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.loginTime));
      const perStudent = new Map<string, { logins: number; dates: Set<string> }>();
      for (const log of logs) {
        const existing = perStudent.get(log.userId);
        if (existing) { existing.logins++; existing.dates.add(log.loginDate); }
        else { perStudent.set(log.userId, { logins: 1, dates: new Set([log.loginDate]) }); }
      }
      const n = perStudent.size;
      let totalLogins = 0, totalUniqueDays = 0;
      for (const data of perStudent.values()) { totalLogins += data.logins; totalUniqueDays += data.dates.size; }

      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed; averages require at least ${SUPPRESSION_FLOOR} students.`,
        totalStudents: suppress(n),
        totalLogins: suppress(totalLogins),
        averages: n >= SUPPRESSION_FLOOR ? {
          avgLoginsPerStudent: Math.round((totalLogins / n) * 10) / 10,
          avgActiveDaysPerStudent: Math.round((totalUniqueDays / n) * 10) / 10,
        } : null,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch attendance summary." });
    }
  });

  app.get("/api/partner/v1/early-warnings", requirePartnerAuth, requireScope("student:read"), async (_req, res) => {
    try {
      const flags = await db.select({
        flagLevel: earlyWarningFlags.flagLevel,
        triggerClass: earlyWarningFlags.triggerClass,
        resolvedAt: earlyWarningFlags.resolvedAt,
      }).from(earlyWarningFlags);

      const byLevel: Record<string, number> = {};
      const byTrigger: Record<string, number> = {};
      let resolved = 0, open = 0;
      for (const f of flags) {
        if (f.flagLevel) byLevel[f.flagLevel] = (byLevel[f.flagLevel] || 0) + 1;
        if (f.triggerClass) byTrigger[f.triggerClass] = (byTrigger[f.triggerClass] || 0) + 1;
        if (f.resolvedAt) resolved++; else open++;
      }

      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed (null).`,
        total: suppress(flags.length),
        open: suppress(open),
        resolved: suppress(resolved),
        byLevel: suppressMap(byLevel),
        byTrigger: suppressMap(byTrigger),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch early warnings." });
    }
  });

  app.get("/api/partner/v1/pathways/overview", requirePartnerAuth, requireScope("student:read"), async (_req, res) => {
    try {
      const allPlans = await db.select().from(pathwayPlans);
      const gradeDistribution: Record<string, number> = {};
      const educationPathCounts: Record<string, number> = {};
      let activeCount = 0;
      for (const plan of allPlans) {
        const g = plan.currentGrade;
        if (g >= 6 && g <= 12) gradeDistribution[String(g)] = (gradeDistribution[String(g)] || 0) + 1;
        const pt = plan.educationPathType || "unspecified";
        educationPathCounts[pt] = (educationPathCounts[pt] || 0) + 1;
        if (plan.status === "active") activeCount++;
      }
      res.json({
        aggregateOnly: true,
        suppressionNote: `Counts below ${SUPPRESSION_FLOOR} are suppressed (null).`,
        total: suppress(allPlans.length),
        totalActive: suppress(activeCount),
        gradeDistribution: suppressMap(gradeDistribution),
        educationPathCounts: suppressMap(educationPathCounts),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pathways overview." });
    }
  });

  // ── Inbound — partners push data TO ThriveUp ─────────────────────────────

  app.post("/api/partner/v1/heartbeat", requirePartnerAuth, async (req, res) => {
    const key: any = (req as any).partnerKey;
    await db.insert(partnerInboundData).values({
      keyId: key.id,
      partnerName: key.partnerName,
      dataType: "heartbeat",
      payload: { message: req.body?.message || "alive", meta: req.body?.meta || {} },
    }).catch(() => {});
    res.json({ received: true, partner: key.partnerName, timestamp: new Date().toISOString() });
  });

  app.post("/api/partner/v1/push", requirePartnerAuth, requireScope("inbound:write"), async (req, res) => {
    const key: any = (req as any).partnerKey;
    const { dataType, payload } = req.body;
    if (!dataType || !payload) {
      return res.status(400).json({ error: "dataType and payload are required." });
    }
    const ALLOWED_TYPES = ["content", "event", "insight", "update", "metric", "referral", "alert", "grant_outcome", "intervention"];
    if (!ALLOWED_TYPES.includes(dataType)) {
      return res.status(400).json({ error: `dataType must be one of: ${ALLOWED_TYPES.join(", ")}` });
    }

    // grant_outcome: validate required fields before storing
    if (dataType === "grant_outcome") {
      const { grantId, grantTitle, status } = payload as any;
      if (!grantId && !grantTitle) {
        return res.status(400).json({ error: "grant_outcome payload must include at least grantId or grantTitle." });
      }
      if (!status) {
        return res.status(400).json({ error: "grant_outcome payload must include a status field (e.g. 'awarded', 'submitted', 'declined')." });
      }
    }

    const [row] = await db.insert(partnerInboundData).values({
      keyId: key.id,
      partnerName: key.partnerName,
      dataType,
      payload,
    }).returning({ id: partnerInboundData.id, receivedAt: partnerInboundData.receivedAt });

    const response: Record<string, unknown> = {
      received: true,
      id: row.id,
      partner: key.partnerName,
      dataType,
      receivedAt: row.receivedAt,
    };

    // Echo a grant_outcome acknowledgement so the caller knows what was captured
    if (dataType === "grant_outcome") {
      const p = payload as any;
      response.grantOutcomeAck = {
        grantId: p.grantId ?? null,
        grantTitle: p.grantTitle ?? null,
        status: p.status,
        awardAmount: p.awardAmount ?? null,
        nextStep: "Outcome stored. ThriveUp team will log this in the grant compliance matrix.",
      };
      console.log(`[PartnerAPI] Grant outcome received from ${key.partnerName}: ${p.grantTitle || p.grantId} — ${p.status}`);
    }

    res.json(response);
  });

  // ── Admin — inbound data viewer ───────────────────────────────────────────

  app.get("/api/admin/partner-inbound", requireAdminKey, async (req, res) => {
    try {
      const rows = await db.select().from(partnerInboundData)
        .orderBy(desc(partnerInboundData.receivedAt))
        .limit(100);
      res.json({ count: rows.length, data: rows });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inbound data." });
    }
  });

  app.patch("/api/admin/partner-inbound/:id/mark-processed", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerInboundData)
        .set({ processed: true, processedAt: new Date() })
        .where(eq(partnerInboundData.id, req.params.id))
        .returning({ id: partnerInboundData.id });
      if (!updated) return res.status(404).json({ error: "Record not found." });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark processed." });
    }
  });

  // ── Admin key management ──────────────────────────────────────────────────

  app.get("/api/admin/partner-keys", requireAdminKey, async (req, res) => {
    try {
      const keys = await db.select({
        id: partnerApiKeys.id,
        partnerName: partnerApiKeys.partnerName,
        partnerEmail: partnerApiKeys.partnerEmail,
        keyPrefix: partnerApiKeys.keyPrefix,
        scopes: partnerApiKeys.scopes,
        active: partnerApiKeys.active,
        usageCount: partnerApiKeys.usageCount,
        lastUsedAt: partnerApiKeys.lastUsedAt,
        notes: partnerApiKeys.notes,
        createdAt: partnerApiKeys.createdAt,
      }).from(partnerApiKeys).orderBy(desc(partnerApiKeys.createdAt));

      res.json({ keys });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch partner keys." });
    }
  });

  app.post("/api/admin/partner-keys", requireAdminKey, async (req, res) => {
    try {
      const { partnerName, partnerEmail, scopes, notes } = req.body;
      if (!partnerName) return res.status(400).json({ error: "partnerName is required." });

      const { plaintext, prefix, hash } = generateKey();
      const [created] = await db.insert(partnerApiKeys).values({
        partnerName,
        partnerEmail: partnerEmail || null,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: scopes && scopes.length ? scopes : ["content:read"],
        notes: notes || null,
      }).returning();

      res.json({
        success: true,
        key: created,
        plaintextKey: plaintext,
        warning: "Copy this key now — it will never be shown again.",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to create partner key." });
    }
  });

  app.patch("/api/admin/partner-keys/:id/revoke", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerApiKeys)
        .set({ active: false })
        .where(eq(partnerApiKeys.id, req.params.id))
        .returning({ id: partnerApiKeys.id, partnerName: partnerApiKeys.partnerName });
      if (!updated) return res.status(404).json({ error: "Key not found." });
      res.json({ success: true, revoked: updated });
    } catch (err) {
      res.status(500).json({ error: "Failed to revoke key." });
    }
  });

  app.patch("/api/admin/partner-keys/:id/restore", requireAdminKey, async (req, res) => {
    try {
      const [updated] = await db.update(partnerApiKeys)
        .set({ active: true })
        .where(eq(partnerApiKeys.id, req.params.id))
        .returning({ id: partnerApiKeys.id, partnerName: partnerApiKeys.partnerName });
      if (!updated) return res.status(404).json({ error: "Key not found." });
      res.json({ success: true, restored: updated });
    } catch (err) {
      res.status(500).json({ error: "Failed to restore key." });
    }
  });

  app.get("/api/admin/partner-keys/audit", requireAdminKey, async (req, res) => {
    try {
      const logs = await db.select().from(partnerApiAuditLog)
        .orderBy(desc(partnerApiAuditLog.calledAt))
        .limit(200);
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch audit log." });
    }
  });
}
