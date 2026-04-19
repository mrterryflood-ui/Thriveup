import type { Express, Request, Response } from "express";
import { db, storage } from "./storage";
import {
  coalitionPartners, lettersOfCollaboration, recidivismBaselines,
  familyVisitations, strategicPlans, outcomeReportsNrrc, governanceMeetings,
  insertCoalitionPartnerSchema, insertLetterOfCollaborationSchema,
  insertRecidivismBaselineSchema, insertFamilyVisitationSchema,
  insertStrategicPlanSchema, insertOutcomeReportNrrcSchema, insertGovernanceMeetingSchema,
  ecosystemEvents, rnrAssessments, staffCertifications, cbiPrograms, standardsCrosswalk,
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}
function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}
async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher" || user?.role === "case_manager") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

async function emitRpliceEvent(eventType: string, eventData: Record<string, unknown>) {
  try {
    await db.insert(ecosystemEvents).values({
      sourcePlatformId: "tcaf-reentry-standards",
      targetPlatformId: null,
      eventType,
      eventData: { ...eventData, generatedAt: new Date().toISOString() },
      status: "broadcast",
    });
  } catch (err) {
    console.warn(`[rplice] failed to emit ${eventType}:`, err);
  }
}

function crud<T extends { id: any }>(app: Express, base: string, table: any, schema: any, eventName: string | null = null) {
  app.get(base, requireAuth, requireAdmin, async (_req, res) => {
    try { res.json(await db.select().from(table).orderBy(desc((table as any).createdAt))); }
    catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch" }); }
  });
  app.get(`${base}/:id`, requireAuth, requireAdmin, async (req, res) => {
    try {
      const [row] = await db.select().from(table).where(eq((table as any).id, req.params.id));
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
  });
  app.post(base, requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [row] = await db.insert(table).values(parsed.data).returning();
      if (eventName) emitRpliceEvent(eventName, { id: row.id, summary: parsed.data }).catch(() => {});
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create" }); }
  });
  app.patch(`${base}/:id`, requireAuth, requireAdmin, async (req, res) => {
    try {
      const update = { ...req.body };
      delete update.id; delete update.createdAt;
      const [row] = await db.update(table).set(update).where(eq((table as any).id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to update" }); }
  });
  app.delete(`${base}/:id`, requireAuth, requireAdmin, async (req, res) => {
    try {
      const [row] = await db.delete(table).where(eq((table as any).id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed to delete" }); }
  });
}

const SEED_BASELINES = [
  { jurisdiction: "Texas (TDCJ Statewide)", jurisdictionType: "state", metricType: "recidivism_3yr",
    metricValue: 20.3, population: "All released TDCJ adults", cohortYear: 2020,
    source: "TDCJ Reentry & Rehabilitation Division (RRD) — Statewide reincarceration data",
    sourceUrl: "https://www.tdcj.texas.gov/divisions/rrd/index.html",
    notes: "Statewide baseline from TDCJ RRD; Black-male subgroup runs ~7-9 points higher in published research." },
  { jurisdiction: "Travis County", jurisdictionType: "county", metricType: "recidivism_3yr",
    metricValue: 28.0, population: "All county jail releases (estimated)", cohortYear: 2022,
    source: "Travis County Sheriff's Office reentry reporting (estimate pending FOIA)",
    sourceUrl: "https://www.tcsheriff.org/",
    notes: "Estimate — formal local baseline still being requested. BJA SCA expects local figure." },
  { jurisdiction: "McLennan County (Waco)", jurisdictionType: "county", metricType: "recidivism_3yr",
    metricValue: 32.0, population: "County jail releases (estimated)", cohortYear: 2022,
    source: "McLennan County Jail data — pending formal request",
    notes: "Working figure; will update once county provides verified baseline." },
];

const SEED_PARTNERS = [
  { organizationName: "Beacon Connections", partnerType: "training",
    contactName: "Dr. Barry M. Gregory, Ed.D., LMHC",
    contactEmail: "admin@beaconconnections.org", contactPhone: "337-534-8801",
    website: "https://beaconconnections.org",
    servicesOffered: ["CBT facilitator training", "Motivational Interviewing", "Reentry skills curriculum", "Workbooks", "Coaching"],
    mouStatus: "none", livedExperienceLed: false,
    notes: "National CBT / reentry training partner — closes NRRC-EBP-02 and EBP-03 (staff certification + curriculum fidelity). Companion blog: beaconreentry.blogspot.com." },
  { organizationName: "Reentry Roundtable of Austin & Travis County", partnerType: "other",
    website: "https://www.reentryroundtable.org",
    county: "Travis", state: "TX",
    servicesOffered: ["Coalition convening", "Resource navigation (Get Help portal)", "Local advocacy", "Reentry referrals"],
    mouStatus: "none", livedExperienceLed: true,
    notes: "Travis County reentry coalition with public Get Help portal — strategic partner for Austin-side BJA SCA work and warm handoffs." },
];

async function seedCoalitionIfEmpty() {
  try {
    const c1 = await db.select({ c: sql<number>`count(*)::int` }).from(recidivismBaselines);
    if (Number(c1[0]?.c || 0) === 0) {
      for (const b of SEED_BASELINES) await db.insert(recidivismBaselines).values(b as any).onConflictDoNothing();
      console.log(`[coalition] Seeded ${SEED_BASELINES.length} recidivism baselines`);
    }
    const c2 = await db.select({ c: sql<number>`count(*)::int` }).from(coalitionPartners);
    if (Number(c2[0]?.c || 0) === 0) {
      for (const p of SEED_PARTNERS) await db.insert(coalitionPartners).values(p as any).onConflictDoNothing();
      console.log(`[coalition] Seeded ${SEED_PARTNERS.length} coalition partners`);
    }
  } catch (e) { console.error("[coalition] seed failed:", e); }
}

export function registerCoalitionRoutes(app: Express) {
  void seedCoalitionIfEmpty();

  crud(app, "/api/coalition/partners", coalitionPartners, insertCoalitionPartnerSchema, "coalition.partner.added");
  crud(app, "/api/coalition/letters", lettersOfCollaboration, insertLetterOfCollaborationSchema, "coalition.letter.updated");
  crud(app, "/api/coalition/baselines", recidivismBaselines, insertRecidivismBaselineSchema, null);
  crud(app, "/api/coalition/visitations", familyVisitations, insertFamilyVisitationSchema, "reentry.family_contact.logged");
  crud(app, "/api/coalition/strategic-plans", strategicPlans, insertStrategicPlanSchema, "coalition.strategic_plan.published");
  crud(app, "/api/coalition/governance-meetings", governanceMeetings, insertGovernanceMeetingSchema, "coalition.governance.met");

  // ---------- Outcome Reports (with auto-populate from real data) ----------
  app.get("/api/coalition/outcome-reports", requireAuth, requireAdmin, async (_req, res) => {
    try { res.json(await db.select().from(outcomeReportsNrrc).orderBy(desc(outcomeReportsNrrc.createdAt))); }
    catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/coalition/outcome-reports/auto-generate", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { reportName, reportingPeriod, funder, recidivismBaselineId } = req.body || {};
      if (!reportName || !reportingPeriod) return res.status(400).json({ error: "reportName and reportingPeriod required" });

      const rnrCount = (await db.select({ c: sql<number>`count(*)::int` }).from(rnrAssessments))[0]?.c || 0;
      const certCount = (await db.select({ c: sql<number>`count(*)::int` }).from(staffCertifications).where(eq(staffCertifications.status, "active")))[0]?.c || 0;
      const partnerCount = (await db.select({ c: sql<number>`count(*)::int` }).from(coalitionPartners).where(eq(coalitionPartners.status, "active")))[0]?.c || 0;
      const visitCount = (await db.select({ c: sql<number>`count(*)::int` }).from(familyVisitations))[0]?.c || 0;
      const cwAvg = await db.select({ avg: sql<number>`avg(coverage_percent)::int` }).from(standardsCrosswalk);
      const baseline = recidivismBaselineId ? (await db.select().from(recidivismBaselines).where(eq(recidivismBaselines.id, recidivismBaselineId)))[0] : null;

      const narrative = [
        `During ${reportingPeriod}, the Collaborative Advocate Foundation maintained ${cwAvg[0]?.avg || 0}% average coverage against NRRC and BJA Second Chance Act standards.`,
        `Operationally, ${rnrCount} Risk-Needs-Responsivity assessments were completed; ${certCount} staff hold active evidence-based-practice certifications; ${partnerCount} coalition partners are engaged across the corridor; ${visitCount} family-contact records were logged.`,
        baseline ? `Local recidivism baseline (${baseline.jurisdiction}, cohort ${baseline.cohortYear}): ${baseline.metricValue}% (${baseline.metricType}). Source: ${baseline.source}.` : `Local recidivism baseline pending — formal data request to county in progress.`,
      ].join("\n\n");

      const [row] = await db.insert(outcomeReportsNrrc).values({
        reportName, reportingPeriod, funder: funder || "Internal",
        rnrAssessmentsCompleted: rnrCount, participantsServed: rnrCount + visitCount,
        cbiReferrals: 0, employmentPlacements: 0, housingPlacements: 0,
        recidivismRate: baseline?.metricValue ?? null,
        narrativeSummary: narrative,
        challenges: "Local-jurisdiction recidivism baselines remain pending formal data-sharing agreements.",
        successes: "Multi-platform federation enables real-time outcome aggregation across partner agencies (RPLICE).",
        status: "draft", generatedFromData: true,
      } as any).returning();
      emitRpliceEvent("coalition.outcome_report.generated", { id: row.id, period: reportingPeriod }).catch(() => {});
      res.json(row);
    } catch (e: any) { console.error(e); res.status(500).json({ error: "Failed", message: e.message }); }
  });

  app.patch("/api/coalition/outcome-reports/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const update = { ...req.body }; delete update.id; delete update.createdAt;
      const [row] = await db.update(outcomeReportsNrrc).set(update).where(eq(outcomeReportsNrrc.id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
  });

  app.delete("/api/coalition/outcome-reports/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [row] = await db.delete(outcomeReportsNrrc).where(eq(outcomeReportsNrrc.id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
  });

  // ---------- Public coalition view (no auth) ----------
  app.get("/api/coalition/public/summary", async (_req, res) => {
    try {
      const [partners, cw, cbi] = await Promise.all([
        db.select().from(coalitionPartners).where(eq(coalitionPartners.status, "active")),
        db.select().from(standardsCrosswalk),
        db.select().from(cbiPrograms).where(eq(cbiPrograms.active, true)),
      ]);
      const avg = cw.length ? Math.round(cw.reduce((s, r) => s + r.coveragePercent, 0) / cw.length) : 0;
      res.json({
        generatedAt: new Date().toISOString(),
        organization: "The Collaborative Advocate Foundation (TCAF)",
        coverage: {
          standardsTracked: cw.length,
          averageCoverage: avg,
          byCategory: cw.reduce((acc: Record<string, { count: number; sum: number }>, r) => {
            const c = acc[r.category] ||= { count: 0, sum: 0 };
            c.count++; c.sum += r.coveragePercent;
            return acc;
          }, {}),
        },
        cbiCatalog: cbi.map(p => ({ code: p.programCode, name: p.name, evidenceTier: p.evidenceTier, modality: p.modality })),
        crosswalk: cw.map(r => ({
          code: r.standardCode, body: r.standardBody, category: r.category,
          title: r.standardTitle, status: r.coverageStatus, percent: r.coveragePercent,
          capabilities: r.tcafCapabilities,
        })),
        partners: partners.map(p => ({
          name: p.organizationName, type: p.partnerType, county: p.county, state: p.state,
          services: p.servicesOffered, livedExperienceLed: p.livedExperienceLed,
        })),
      });
    } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
  });

  // ---------- Server-rendered PDF crosswalk (printable HTML) ----------
  app.get("/api/coalition/public/crosswalk.html", async (_req, res) => {
    try {
      const [cw, cbi, partners] = await Promise.all([
        db.select().from(standardsCrosswalk).orderBy(standardsCrosswalk.category, standardsCrosswalk.standardCode),
        db.select().from(cbiPrograms).where(eq(cbiPrograms.active, true)),
        db.select().from(coalitionPartners).where(eq(coalitionPartners.status, "active")),
      ]);
      const avg = cw.length ? Math.round(cw.reduce((s, r) => s + r.coveragePercent, 0) / cw.length) : 0;
      const grouped: Record<string, typeof cw> = {};
      for (const r of cw) (grouped[r.category] ||= []).push(r);
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>TCAF Standards Crosswalk</title>
<style>
@page { size: letter; margin: 0.6in; }
body { font: 11pt/1.4 -apple-system, system-ui, "Segoe UI", sans-serif; color: #1a1a1a; }
h1 { font-size: 22pt; margin: 0 0 6pt; color: #0b1f4d; }
h2 { font-size: 14pt; margin: 18pt 0 6pt; padding-bottom: 4pt; border-bottom: 2px solid #0b1f4d; color: #0b1f4d; }
.meta { color: #555; font-size: 9pt; margin-bottom: 12pt; }
.tile-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8pt; margin: 12pt 0; }
.tile { border: 1px solid #ddd; border-radius: 6pt; padding: 8pt; }
.tile .l { text-transform: uppercase; font-size: 8pt; color: #666; letter-spacing: 0.5pt; }
.tile .v { font-size: 18pt; font-weight: 700; color: #0b1f4d; }
.std { border-left: 3px solid #ccc; padding: 6pt 8pt; margin: 6pt 0; page-break-inside: avoid; }
.std.full { border-color: #16a34a; background: #f0fdf4; }
.std.exceeds { border-color: #059669; background: #ecfdf5; }
.std.partial { border-color: #f59e0b; background: #fffbeb; }
.std.gap { border-color: #dc2626; background: #fef2f2; }
.code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 9pt; color: #555; }
.title { font-weight: 600; margin: 2pt 0; }
.desc { font-size: 9.5pt; color: #444; }
.caps { margin-top: 4pt; font-size: 9pt; color: #0b1f4d; }
.cbi-row, .partner-row { padding: 4pt 0; border-bottom: 1px dotted #eee; font-size: 10pt; }
.footer { margin-top: 24pt; font-size: 8.5pt; color: #777; border-top: 1px solid #ddd; padding-top: 6pt; }
@media print { .no-print { display: none; } }
.no-print { background: #f4f4f8; padding: 8pt; text-align: center; margin-bottom: 12pt; border-radius: 4pt; }
</style></head><body>
<div class="no-print">
  <button onclick="window.print()" style="padding:8pt 16pt;font-weight:600;background:#0b1f4d;color:#fff;border:0;border-radius:4pt;cursor:pointer">Print or Save as PDF</button>
  <span style="margin-left:8pt;color:#555">Use your browser's print dialog and select "Save as PDF" as the destination.</span>
</div>
<h1>National Reentry Standards Alignment</h1>
<div class="meta">The Collaborative Advocate Foundation (TCAF) &middot; Generated ${today}</div>
<div class="tile-row">
  <div class="tile"><div class="l">Standards Tracked</div><div class="v">${cw.length}</div></div>
  <div class="tile"><div class="l">Average Coverage</div><div class="v">${avg}%</div></div>
  <div class="tile"><div class="l">CBI Programs</div><div class="v">${cbi.length}</div></div>
  <div class="tile"><div class="l">Coalition Partners</div><div class="v">${partners.length}</div></div>
</div>
${Object.entries(grouped).map(([cat, items]) => `
<h2>${cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</h2>
${items.map(r => `<div class="std ${r.coverageStatus}">
  <div class="code">${r.standardCode} &middot; ${r.standardBody} &middot; ${r.coverageStatus.toUpperCase()} ${r.coveragePercent}%</div>
  <div class="title">${r.standardTitle}</div>
  <div class="desc">${r.standardDescription || ""}</div>
  ${(r.tcafCapabilities && r.tcafCapabilities.length) ? `<div class="caps"><strong>TCAF capabilities:</strong> ${r.tcafCapabilities.join(", ")}</div>` : ""}
  ${r.notes ? `<div class="desc" style="margin-top:3pt;font-style:italic">${r.notes}</div>` : ""}
</div>`).join("")}
`).join("")}
<h2>CBI Catalog</h2>
${cbi.map(p => `<div class="cbi-row"><strong>${p.programCode}</strong> &mdash; ${p.name} &middot; ${p.evidenceTier} evidence &middot; ${p.modality} &middot; ${p.internalDelivery ? "in-house" : "referral"}</div>`).join("")}
<h2>Coalition Partners</h2>
${partners.length ? partners.map(p => `<div class="partner-row"><strong>${p.organizationName}</strong> &mdash; ${p.partnerType} &middot; ${p.county || p.state || ""} ${p.livedExperienceLed ? "&middot; lived-experience led" : ""}</div>`).join("") : `<div class="cbi-row" style="color:#888">No partners recorded yet.</div>`}
<div class="footer">
  Generated by TCAF reentry-standards system. For verification or partnership inquiries, contact The Collaborative Advocate Foundation. This document is suitable for grant-attachment purposes.
</div>
</body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (e) { console.error(e); res.status(500).send("Failed to generate"); }
  });

  // ---------- CBI referral tracking — auto-creates a service_record + emits event ----------
  app.post("/api/coalition/cbi-referrals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { participantId, participantName, programCode, providerName, notes } = req.body || {};
      if (!participantId || !programCode) return res.status(400).json({ error: "participantId and programCode required" });
      const program = (await db.select().from(cbiPrograms).where(eq(cbiPrograms.programCode, programCode)))[0];
      if (!program) return res.status(404).json({ error: "CBI program not found" });
      const { serviceRecords } = await import("@shared/schema");
      const [rec] = await db.insert(serviceRecords).values({
        participantId, serviceCategory: "evidence_based_intervention",
        serviceType: program.name, providerName: providerName || (program.internalDelivery ? "TCAF (in-house)" : program.referralPartner || "External referral"),
        serviceDate: new Date().toISOString().slice(0, 10),
        durationMinutes: 0, location: program.modality, notes: notes || `CBI referral: ${program.name}`,
        outcome: "referred", status: "referred",
      } as any).returning();
      emitRpliceEvent("reentry.cbi.referred", { participantId, participantName, programCode, programName: program.name }).catch(() => {});
      res.json({ success: true, serviceRecord: rec });
    } catch (e: any) { console.error(e); res.status(500).json({ error: "Failed", message: e.message }); }
  });
}
