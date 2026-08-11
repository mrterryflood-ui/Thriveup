import { Router } from "express";
import { db } from "./storage";
import { funders, referrals } from "@shared/schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";
// Use the canonical staff auth gate — same function used by YHSI, reentry,
// and all other staff-gated server endpoints. Importing directly keeps the
// funder gate in lockstep with the rest of the platform's staff policy.
import { requireStaff } from "./yhsi-routes";

export const funderRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a yyyy-mm-dd string safely; returns undefined on bad input. */
function parseDate(raw: unknown): Date | undefined {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const d = new Date(raw + "T00:00:00Z");
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Escape a CSV cell value for safe display in spreadsheet applications.
 * Prefixes cells starting with formula-injection characters (=, +, -, @, \t, \r)
 * with a single-quote so they render as text, not formulas.
 * Also wraps cells containing commas, quotes, or newlines in double-quotes.
 */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Guard against CSV formula injection (Excel / Google Sheets)
  if (s.length > 0 && /^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  // Quote cells that contain commas, double-quotes, or newlines
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ── POST /api/funder — create funder (staff only) ────────────────────────────
funderRouter.post("/", requireStaff, async (req, res) => {
  const { name, type = "foundation", linkedOrgIds = [] } = req.body;
  if (!name || typeof name !== "string" || !name.trim())
    return res.status(400).json({ error: "name required" });
  try {
    const [created] = await db
      .insert(funders)
      .values({ name: name.trim(), type, linkedOrgIds })
      .returning();
    res.status(201).json({
      funder: created,
      dashboardUrl: `/funder/${created.shareToken}`,
    });
  } catch (err: any) {
    console.error("[funder] create failed:", err.message);
    res.status(500).json({ error: "Failed to create funder" });
  }
});

// ── GET /api/funder/list — all funders (staff only) ──────────────────────────
funderRouter.get("/list", requireStaff, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: funders.id,
        name: funders.name,
        type: funders.type,
        shareToken: funders.shareToken,
        createdAt: funders.createdAt,
      })
      .from(funders)
      .orderBy(desc(funders.createdAt));

    // Attach quick referral counts via DB aggregation (unbounded)
    const counts = await db
      .select({
        funderId: referrals.funderId,
        total: sql<number>`count(*)::int`,
        enrolled: sql<number>`count(*) filter (where status = 'enrolled')::int`,
        valueUnlocked: sql<number>`coalesce(sum(benefit_value_estimate) filter (where status = 'enrolled'), 0)::int`,
      })
      .from(referrals)
      .groupBy(referrals.funderId);

    const countMap = Object.fromEntries(counts.map((c) => [c.funderId, c]));

    res.json({
      funders: rows.map((f) => ({
        ...f,
        dashboardUrl: `/funder/${f.shareToken}`,
        stats: countMap[f.id] ?? { total: 0, enrolled: 0, valueUnlocked: 0 },
      })),
    });
  } catch (err: any) {
    console.error("[funder] list failed:", err.message);
    res.status(500).json({ error: "Failed to list funders" });
  }
});

// ── GET /api/funder/:token/dashboard — public via share token ─────────────────
// Aggregate metrics come from DB-level COUNT/SUM (unbounded — all matching rows).
// recentActivity is capped at 20 rows for display.
// Optional query params: dateFrom=yyyy-mm-dd, dateTo=yyyy-mm-dd
funderRouter.get("/:token/dashboard", async (req, res) => {
  try {
    const [funder] = await db
      .select()
      .from(funders)
      .where(eq(funders.shareToken, req.params.token as string));
    if (!funder) return res.status(404).json({ error: "Dashboard not found" });

    const dateFrom = parseDate(req.query.dateFrom);
    const dateTo = parseDate(req.query.dateTo);
    if (dateTo) dateTo.setUTCHours(23, 59, 59, 999);

    // Build WHERE clause
    const whereClauses = [eq(referrals.funderId, funder.id)];
    if (dateFrom) whereClauses.push(gte(referrals.createdAt, dateFrom));
    if (dateTo) whereClauses.push(lte(referrals.createdAt, dateTo));
    const where = and(...whereClauses);

    // ── Aggregate metrics via DB (unbounded, handles any row count) ──────────
    const [agg] = await db
      .select({
        totalReferrals: sql<number>`count(*)::int`,
        enrolled: sql<number>`count(*) filter (where status = 'enrolled')::int`,
        lost: sql<number>`count(*) filter (where status in ('ineligible','withdrew'))::int`,
        pending: sql<number>`count(*) filter (where status in ('sent','accepted'))::int`,
        valueUnlocked: sql<number>`coalesce(sum(benefit_value_estimate) filter (where status = 'enrolled'), 0)::int`,
        // FEATURE 1: how many confirmed enrollments used a program default value
        // (org confirmed without a dollar estimate). Sums are unaffected — the
        // default value is already stored on the row — this is transparency only.
        defaultsUsed: sql<number>`count(*) filter (where status = 'enrolled' and value_source = 'default')::int`,
      })
      .from(referrals)
      .where(where);

    const metrics = {
      totalReferrals: agg.totalReferrals,
      enrolled: agg.enrolled,
      lost: agg.lost,
      pending: agg.pending,
      valueUnlocked: agg.valueUnlocked,
      defaultsUsed: agg.defaultsUsed,
      enrollmentRate: agg.totalReferrals > 0
        ? Math.round((agg.enrolled / agg.totalReferrals) * 100)
        : 0,
    };

    // ── Per-program breakdown via DB aggregation (unbounded) ─────────────────
    const programRows = await db
      .select({
        programCode: referrals.programCode,
        referrals: sql<number>`count(*)::int`,
        enrolled: sql<number>`count(*) filter (where status = 'enrolled')::int`,
        lost: sql<number>`count(*) filter (where status in ('ineligible','withdrew'))::int`,
        value: sql<number>`coalesce(sum(benefit_value_estimate) filter (where status = 'enrolled'), 0)::int`,
      })
      .from(referrals)
      .where(where)
      .groupBy(referrals.programCode)
      .orderBy(desc(sql`count(*)`));

    const byProgram = programRows;

    // ── Recent activity — display only, limited to 20 rows ───────────────────
    const recentActivity = await db
      .select({
        id: referrals.id,
        programCode: referrals.programCode,
        orgName: referrals.orgName,
        status: referrals.status,
        benefitValueEstimate: referrals.benefitValueEstimate,
        createdAt: referrals.createdAt,
        resolvedAt: referrals.resolvedAt,
      })
      .from(referrals)
      .where(where)
      .orderBy(desc(referrals.createdAt))
      .limit(20);

    res.json({
      funder: { name: funder.name, type: funder.type },
      metrics,
      byProgram,
      recentActivity,
      filters: {
        dateFrom: dateFrom?.toISOString().slice(0, 10) ?? null,
        dateTo: dateTo?.toISOString().slice(0, 10) ?? null,
      },
    });
  } catch (err: any) {
    console.error("[funder] dashboard error:", err.message);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// ── GET /api/funder/:token/export.csv — CSV export (public via token) ─────────
// Exports funder-safe aggregate outcome fields only.
// Omits sensitive fields: notes, chw_user_id, client_display_name, client_phone.
// All cell values are formula-injection-safe.
funderRouter.get("/:token/export.csv", async (req, res) => {
  try {
    const [funder] = await db
      .select()
      .from(funders)
      .where(eq(funders.shareToken, req.params.token as string));
    if (!funder) return res.status(404).json({ error: "Dashboard not found" });

    const dateFrom = parseDate(req.query.dateFrom);
    const dateTo = parseDate(req.query.dateTo);
    if (dateTo) dateTo.setUTCHours(23, 59, 59, 999);

    const whereClauses = [eq(referrals.funderId, funder.id)];
    if (dateFrom) whereClauses.push(gte(referrals.createdAt, dateFrom));
    if (dateTo) whereClauses.push(lte(referrals.createdAt, dateTo));

    // Select only funder-appropriate outcome fields — no client PII, no CHW IDs, no notes
    const rows = await db
      .select({
        id: referrals.id,
        programCode: referrals.programCode,
        orgName: referrals.orgName,
        status: referrals.status,
        benefitValueEstimate: referrals.benefitValueEstimate,
        createdAt: referrals.createdAt,
        resolvedAt: referrals.resolvedAt,
      })
      .from(referrals)
      .where(and(...whereClauses))
      .orderBy(desc(referrals.createdAt));

    // referral_id is intentionally omitted from this public export.
    // The outcome-mutation endpoint (PATCH /api/referrals/:id/outcome) requires
    // staff auth, but supplying raw IDs in a share-token-accessible file is
    // unnecessary and would widen the attack surface if auth controls change.
    // A sequential row_number is provided as a non-actionable reporting key.
    const HEADER = [
      "row_number",
      "program_code",
      "org_name",
      "status",
      "benefit_value_estimate_annual_usd",
      "referred_at",
      "resolved_at",
    ].join(",");

    const lines = rows.map((r, i) =>
      [
        i + 1,
        r.programCode,
        r.orgName,
        r.status,
        r.benefitValueEstimate ?? "",
        r.createdAt?.toISOString() ?? "",
        r.resolvedAt?.toISOString() ?? "",
      ]
        .map(csvCell)
        .join(",")
    );

    const safe = funder.name.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="funder_impact_${safe}.csv"`);
    res.send([HEADER, ...lines].join("\r\n"));
  } catch (err: any) {
    console.error("[funder] csv export error:", err.message);
    res.status(500).json({ error: "CSV export failed" });
  }
});

// ── GET /api/funder/:token/impact-report — PDF-printable summary JSON ─────────
// Aggregate metrics via DB (unbounded). No PII or sensitive fields.
funderRouter.get("/:token/impact-report", async (req, res) => {
  try {
    const [funder] = await db
      .select()
      .from(funders)
      .where(eq(funders.shareToken, req.params.token as string));
    if (!funder) return res.status(404).json({ error: "Report not found" });

    const dateFrom = parseDate(req.query.dateFrom);
    const dateTo = parseDate(req.query.dateTo);
    if (dateTo) dateTo.setUTCHours(23, 59, 59, 999);

    const whereClauses = [eq(referrals.funderId, funder.id)];
    if (dateFrom) whereClauses.push(gte(referrals.createdAt, dateFrom));
    if (dateTo) whereClauses.push(lte(referrals.createdAt, dateTo));
    const where = and(...whereClauses);

    const [agg] = await db
      .select({
        totalReferrals: sql<number>`count(*)::int`,
        enrolled: sql<number>`count(*) filter (where status = 'enrolled')::int`,
        lost: sql<number>`count(*) filter (where status in ('ineligible','withdrew'))::int`,
        pending: sql<number>`count(*) filter (where status in ('sent','accepted'))::int`,
        valueUnlocked: sql<number>`coalesce(sum(benefit_value_estimate) filter (where status = 'enrolled'), 0)::int`,
      })
      .from(referrals)
      .where(where);

    const metrics = {
      totalReferrals: agg.totalReferrals,
      enrolled: agg.enrolled,
      lost: agg.lost,
      pending: agg.pending,
      valueUnlocked: agg.valueUnlocked,
      enrollmentRate: agg.totalReferrals > 0
        ? Math.round((agg.enrolled / agg.totalReferrals) * 100)
        : 0,
    };

    const byProgram = await db
      .select({
        programCode: referrals.programCode,
        referrals: sql<number>`count(*)::int`,
        enrolled: sql<number>`count(*) filter (where status = 'enrolled')::int`,
        value: sql<number>`coalesce(sum(benefit_value_estimate) filter (where status = 'enrolled'), 0)::int`,
      })
      .from(referrals)
      .where(where)
      .groupBy(referrals.programCode)
      .orderBy(desc(sql`count(*)`));

    res.json({
      reportGeneratedAt: new Date().toISOString(),
      funder: { name: funder.name, type: funder.type },
      period: {
        from: dateFrom?.toISOString().slice(0, 10) ?? "all time",
        to: dateTo?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      },
      metrics,
      byProgram,
      narrative: {
        headline: `${funder.name} investment connected ${metrics.totalReferrals} families to public benefits programs, with ${metrics.enrolled} confirmed enrollments and an estimated $${metrics.valueUnlocked.toLocaleString()} in annual benefit value unlocked.`,
        enrollmentRate: `${metrics.enrollmentRate}% of referrals resulted in enrollment.`,
        topPrograms: byProgram
          .slice(0, 3)
          .map((p) => `${p.programCode}: ${p.enrolled} enrollments, $${p.value.toLocaleString()} value`)
          .join("; "),
      },
    });
  } catch (err: any) {
    console.error("[funder] impact report error:", err.message);
    res.status(500).json({ error: "Impact report failed" });
  }
});
