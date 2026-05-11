import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  fosterYouthAgencies,
  fosterYouthAgencyCases,
  fosterYouthCaseEvents,
  insertFosterYouthAgencySchema,
  insertFosterYouthAgencyCaseSchema,
  type FosterYouthAgencyCase,
} from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import { scoreCase, recommendedStakeholders, type CaseInputs } from "./foster-youth-risk";

function getUser(req: Request) {
  const u = (req as unknown as Record<string, unknown>).user as
    | { claims?: { sub?: string; email?: string }; id?: string; role?: string }
    | undefined;
  return u;
}
function getUserId(req: Request): string | undefined {
  const u = getUser(req);
  return u?.claims?.sub || u?.id;
}
function isPrivileged(req: Request): boolean {
  const u = getUser(req);
  return !!u && (u.role === "admin" || u.role === "case_manager" || u.role === "teacher");
}
function requirePrivileged(req: Request, res: Response, next: NextFunction) {
  if (!getUser(req)) return res.status(401).json({ error: "Unauthorized" });
  if (!isPrivileged(req)) return res.status(403).json({ error: "Admin or case-manager role required" });
  return next();
}

// Bulk-upload guardrails (defense in depth — never trust client).
const MAX_BULK_ROWS = 5000;
const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MB

function parseBool(v: unknown): boolean | null {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "t", "yes", "y"].includes(s)) return true;
  if (["0", "false", "f", "no", "n"].includes(s)) return false;
  return null;
}
function parseInt0(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 200 ? Math.floor(n) : null;
}

// Lightweight CSV parser. Quoted fields allowed; commas inside quotes preserved.
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQ) {
      if (c === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field.length || cur.length) { cur.push(field); rows.push(cur); cur = []; field = ""; }
        if (c === "\r" && input[i + 1] === "\n") i++;
      } else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

const ALLOWED_PLACEMENTS = new Set(["family","kinship","group_home","RTC","ILP","emergency","runaway","unknown"]);

function rowToCase(headers: string[], row: string[], agencyId: string, stateCode: string, uploadedBy: string | undefined): { ok: true; data: Omit<FosterYouthAgencyCase,"createdAt"|"updatedAt"|"riskScore"|"riskTier"|"riskFactors"> & { ageYears: number | null } } | { ok: false; error: string } {
  const get = (k: string) => {
    const idx = headers.indexOf(k);
    return idx === -1 ? "" : (row[idx] ?? "").trim();
  };
  const externalCaseId = get("externalCaseId");
  if (!externalCaseId) return { ok: false, error: "Missing externalCaseId" };
  if (externalCaseId.length > 80) return { ok: false, error: "externalCaseId > 80 chars" };
  const placement = get("currentPlacementType") || null;
  if (placement && !ALLOWED_PLACEMENTS.has(placement)) return { ok: false, error: `Invalid currentPlacementType: ${placement}` };
  return {
    ok: true,
    data: {
      id: randomUUID(),
      agencyId,
      externalCaseId,
      stateCode,
      ageYears: parseInt0(get("ageYears")),
      currentPlacementType: placement,
      monthsInCare: parseInt0(get("monthsInCare")),
      placementCount: parseInt0(get("placementCount")),
      schoolDisruptions: parseInt0(get("schoolDisruptions")),
      ageAtFirstRemoval: parseInt0(get("ageAtFirstRemoval")),
      hasIep: parseBool(get("hasIep")),
      mentalHealthDx: parseBool(get("mentalHealthDx")),
      mhInTreatment: parseBool(get("mhInTreatment")),
      priorRunaway: parseBool(get("priorRunaway")),
      justiceContact: parseBool(get("justiceContact")),
      pregnantOrParenting: parseBool(get("pregnantOrParenting")),
      siblingsSeparated: parseBool(get("siblingsSeparated")),
      permanentConnectionAdult: parseBool(get("permanentConnectionAdult")),
      pregEducDocsComplete: parseBool(get("pregEducDocsComplete")),
      lgbtqPlus: parseBool(get("lgbtqPlus")),
      notes: (get("notes") || "").slice(0, 1000) || null,
      uploadedBy: uploadedBy || null,
      source: "csv_bulk",
    },
  };
}

const csvUploadBody = z.object({
  agencyId: z.string().min(1).max(64),
  csv: z.string().min(1).max(MAX_CSV_BYTES),
});

const sampleCsv = `externalCaseId,ageYears,currentPlacementType,monthsInCare,placementCount,schoolDisruptions,ageAtFirstRemoval,hasIep,mentalHealthDx,mhInTreatment,priorRunaway,justiceContact,pregnantOrParenting,siblingsSeparated,permanentConnectionAdult,pregEducDocsComplete,lgbtqPlus,notes
TX-DEMO-0001,17,family,18,2,1,9,false,false,false,false,false,false,false,true,true,false,Stable kinship placement; on track for HS graduation
TX-DEMO-0002,17,group_home,48,7,5,11,true,true,true,true,false,false,true,false,false,false,Long stay group home; multiple placements
TX-DEMO-0003,16,RTC,30,4,3,12,false,true,false,true,true,false,false,false,false,false,Recent runaway; justice-system contact pending
TX-DEMO-0004,18,ILP,12,3,2,15,false,false,false,false,false,true,true,true,true,false,Pregnant; transitioning to ILP
TX-DEMO-0005,17,kinship,60,2,1,7,false,false,false,false,false,false,true,true,true,true,LGBTQ+ self-disclosed; affirming kinship placement
TX-DEMO-0006,17,emergency,2,9,4,13,true,true,false,true,true,false,false,false,false,false,Repeated placement disruption
`;

export function registerFosterYouthAgencyRoutes(app: Express) {
  // Sample CSV download — public so demos work without login.
  app.get("/api/foster-youth/agency/sample-csv", (_req, res) => {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="foster-youth-caseload-sample.csv"');
    res.send(sampleCsv);
  });

  // List agencies (privileged).
  app.get("/api/foster-youth/agencies", requirePrivileged, async (_req, res) => {
    const rows = await db.select().from(fosterYouthAgencies).orderBy(desc(fosterYouthAgencies.createdAt));
    res.json({ agencies: rows });
  });

  // Create agency (privileged).
  app.post("/api/foster-youth/agencies", requirePrivileged, async (req, res) => {
    try {
      const parsed = insertFosterYouthAgencySchema.parse(req.body);
      // Normalize id — never trust client id format quietly.
      const id = parsed.id?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "-").slice(0, 64) || `${parsed.stateCode}-${randomUUID().slice(0, 8)}`;
      const [row] = await db.insert(fosterYouthAgencies).values({ ...parsed, id }).returning();
      res.json({ agency: row });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid agency payload";
      return res.status(400).json({ error: msg });
    }
  });

  // List cases for an agency, with optional filters.
  app.get("/api/foster-youth/agency/:agencyId/cases", requirePrivileged, async (req, res) => {
    const agencyId = String(req.params.agencyId);
    const tier = typeof req.query.tier === "string" ? req.query.tier : undefined;
    const conds = [eq(fosterYouthAgencyCases.agencyId, agencyId)];
    if (tier && ["stable","watch","elevated","critical"].includes(tier)) {
      conds.push(eq(fosterYouthAgencyCases.riskTier, tier));
    }
    const rows = await db.select().from(fosterYouthAgencyCases).where(and(...conds)).orderBy(desc(fosterYouthAgencyCases.riskScore)).limit(1000);
    res.json({ cases: rows });
  });

  // Stratification stats for an agency (counts per tier + factor frequency).
  app.get("/api/foster-youth/agency/:agencyId/stratification", requirePrivileged, async (req, res) => {
    const agencyId = String(req.params.agencyId);
    const counts = await db.execute(sql`
      SELECT risk_tier AS tier, COUNT(*)::int AS n FROM foster_youth_agency_cases
      WHERE agency_id = ${agencyId}
      GROUP BY risk_tier
    `);
    const total = (counts.rows as Array<{ n: number }>).reduce((s, r) => s + Number(r.n || 0), 0);
    res.json({ total, byTier: counts.rows });
  });

  // Create one case manually (privileged).
  app.post("/api/foster-youth/agency/:agencyId/cases", requirePrivileged, async (req, res) => {
    try {
      const agencyId = String(req.params.agencyId);
      // Schema validates types; we recompute risk on the server.
      const parsed = insertFosterYouthAgencyCaseSchema.parse({ ...req.body, agencyId });
      const r = scoreCase(parsed as CaseInputs);
      const id = randomUUID();
      const [row] = await db.insert(fosterYouthAgencyCases).values({
        ...parsed,
        id,
        riskScore: r.score,
        riskTier: r.tier,
        riskFactors: r.factors,
        uploadedBy: getUserId(req) || null,
        source: "manual",
      }).returning();
      await db.insert(fosterYouthCaseEvents).values({
        id: randomUUID(),
        caseId: id,
        agencyId,
        eventType: "score",
        actorUserId: getUserId(req) || null,
        payload: { score: r.score, tier: r.tier, factorIds: r.factors.map(f => f.id) },
      });
      res.json({ case: row, recommendedStakeholders: recommendedStakeholders(r.tier) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid case payload";
      res.status(400).json({ error: msg });
    }
  });

  // Bulk CSV upload (privileged).
  app.post("/api/foster-youth/agency/cases/bulk-csv", requirePrivileged, async (req, res) => {
    let body: z.infer<typeof csvUploadBody>;
    try { body = csvUploadBody.parse(req.body); }
    catch { return res.status(400).json({ error: "Invalid body. Expected { agencyId, csv }." }); }
    if (Buffer.byteLength(body.csv, "utf8") > MAX_CSV_BYTES) {
      return res.status(413).json({ error: `CSV too large (max ${MAX_CSV_BYTES} bytes)` });
    }
    const [agency] = await db.select().from(fosterYouthAgencies).where(eq(fosterYouthAgencies.id, body.agencyId)).limit(1);
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    const rows = parseCsv(body.csv).filter(r => r.some(c => c.length));
    if (!rows.length) return res.status(400).json({ error: "Empty CSV" });
    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);
    if (dataRows.length > MAX_BULK_ROWS) {
      return res.status(413).json({ error: `Too many rows (max ${MAX_BULK_ROWS})` });
    }

    const inserted: FosterYouthAgencyCase[] = [];
    const errors: Array<{ rowIndex: number; error: string }> = [];
    const counts = { stable: 0, watch: 0, elevated: 0, critical: 0 };
    const uploaderId = getUserId(req);

    for (let i = 0; i < dataRows.length; i++) {
      const parsed = rowToCase(headers, dataRows[i], agency.id, agency.stateCode, uploaderId);
      if (!parsed.ok) { errors.push({ rowIndex: i + 2, error: parsed.error }); continue; }
      const r = scoreCase(parsed.data as CaseInputs);
      try {
        const [row] = await db.insert(fosterYouthAgencyCases).values({
          ...parsed.data,
          riskScore: r.score,
          riskTier: r.tier,
          riskFactors: r.factors,
        }).returning();
        inserted.push(row);
        counts[r.tier]++;
      } catch (e) {
        errors.push({ rowIndex: i + 2, error: e instanceof Error ? e.message : "Insert failed" });
      }
    }
    res.json({
      inserted: inserted.length,
      errorCount: errors.length,
      errors: errors.slice(0, 25),
      stratification: counts,
    });
  });

  // Get one case with stakeholders.
  app.get("/api/foster-youth/agency/case/:id", requirePrivileged, async (req, res) => {
    const [row] = await db.select().from(fosterYouthAgencyCases).where(eq(fosterYouthAgencyCases.id, String(req.params.id))).limit(1);
    if (!row) return res.status(404).json({ error: "Case not found" });
    res.json({ case: row, recommendedStakeholders: recommendedStakeholders(row.riskTier as "stable"|"watch"|"elevated"|"critical") });
  });
}
