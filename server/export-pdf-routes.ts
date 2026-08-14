import type { Express, Request, Response } from "express";
import { createRequire } from "module";
// import.meta.url is undefined in esbuild CJS bundles; fall back to __filename (CJS global)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const require = createRequire((import.meta as any).url ?? (globalThis as any).__filename ?? process.cwd() + "/index.js");
const PDFDocument = require("pdfkit");

import { db } from "./storage";
import { certificates } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hasValidCommunityEvidence } from "./community-evidence";

const NAVY = "#1a365d";
const TEAL = "#0d9488";
const GRAY = "#4a5568";
const LIGHT_GRAY = "#718096";
const W = 512;

// ── Anti-fabrication disclaimer (verbatim from trade-sims-cert-routes.ts) ────
const TRANSCRIPT_DISCLAIMER =
  "This transcript documents simulation-based training completed in ThriveUp Trade Sims. " +
  "It is evidence of study and simulated skill practice only. It is NOT an industry certification, " +
  "license, or credential, and it does not claim NCCER, TSBPE, TDLR, EPA, AWS, ASE, or any other " +
  "sponsor's credential. Listed credentials are pathways this training prepares a learner to pursue " +
  "through the sponsor's own exam and eligibility process.";

// ── Per-IP rate limiter (sliding window) ─────────────────────────────────────
const EXPORT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const briefPdfIpHits = new Map<string, number[]>();

function briefPdfRateLimit(ip: string, maxHits: number): number | null {
  const now = Date.now();
  const cutoff = now - EXPORT_WINDOW_MS;
  const hits = (briefPdfIpHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (hits.length >= maxHits) {
    return Math.max(1, Math.ceil((hits[0] + EXPORT_WINDOW_MS - now) / 1000));
  }
  hits.push(now);
  briefPdfIpHits.set(ip, hits);
  return null;
}

function clientIp(req: Request): string {
  return (req.ip || req.socket?.remoteAddress || "unknown").trim();
}

// ── Markdown → PDF renderer (unchanged from original) ────────────────────────
function renderMarkdownToPdf(doc: any, content: string) {
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      if (doc.y > 650) doc.addPage();
      const heading = line.replace(/^# /, "").replace(/\s*\(\d+ pts\)/, "");
      const pts = line.match(/\((\d+) pts\)/)?.[1];
      doc.moveDown(0.8);
      doc.rect(50, doc.y, W, 28).fill(NAVY);
      doc.fontSize(12).font("Helvetica-Bold").fillColor("white")
        .text(heading + (pts ? ` — ${pts} pts` : ""), 56, doc.y - 22, { width: W - 12 });
      doc.moveDown(1.6);
      i++; continue;
    }

    if (line.startsWith("## ")) {
      if (doc.y > 680) doc.addPage();
      doc.moveDown(0.6);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(TEAL)
        .text(line.replace(/^## /, ""), 50, undefined, { width: W });
      doc.moveDown(0.4);
      i++; continue;
    }

    if (line.startsWith("### ")) {
      if (doc.y > 680) doc.addPage();
      doc.fontSize(10).font("Helvetica-Bold").fillColor(GRAY)
        .text(line.replace(/^### /, ""), 50, undefined, { width: W });
      doc.moveDown(0.3);
      i++; continue;
    }

    if (line === "---") {
      doc.moveDown(0.5);
      doc.rect(50, doc.y, W, 1).fill("#e2e8f0");
      doc.moveDown(0.8);
      i++; continue;
    }

    if (line.match(/^[-*•]\s/)) {
      if (doc.y > 720) doc.addPage();
      const bullet = line.replace(/^[-*•]\s/, "");
      doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
        .text(`• ${bullet}`, 58, undefined, { width: W - 8 });
      doc.moveDown(0.2);
      i++; continue;
    }

    if (line.trim() === "") {
      doc.moveDown(0.4);
      i++; continue;
    }

    if (doc.y > 700) doc.addPage();
    doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
      .text(line, 50, undefined, { width: W });
    doc.moveDown(0.25);
    i++;
  }
}

// ── Helpers for community-brief PDF ──────────────────────────────────────────

function fmtDollar(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function fmtPct(n: number): string {
  return `${Number(n).toFixed(1)}%`;
}

function drawTableRow(
  doc: any,
  x: number,
  y: number,
  col1: string,
  col2: string,
  col3: string,
  shade: boolean,
  col1W = 200,
  col2W = 120,
) {
  const rowH = 18;
  if (shade) {
    doc.rect(x, y, col1W + col2W + 80, rowH).fill("#f7fafc");
  }
  doc.fontSize(8.5).font("Helvetica").fillColor(GRAY)
    .text(col1, x + 4, y + 4, { width: col1W - 8 })
    .text(col2, x + col1W + 4, y + 4, { width: col2W - 8 })
    .text(col3, x + col1W + col2W + 4, y + 4, { width: 76 });
  doc.rect(x, y, col1W + col2W + 80, rowH).stroke("#e2e8f0");
}

function drawTableHeader(
  doc: any,
  x: number,
  y: number,
  h1: string,
  h2: string,
  h3: string,
  col1W = 200,
  col2W = 120,
) {
  const rowH = 20;
  doc.rect(x, y, col1W + col2W + 80, rowH).fill(NAVY);
  doc.fontSize(9).font("Helvetica-Bold").fillColor("white")
    .text(h1, x + 4, y + 5, { width: col1W - 8 })
    .text(h2, x + col1W + 4, y + 5, { width: col2W - 8 })
    .text(h3, x + col1W + col2W + 4, y + 5, { width: 76 });
}

function buildCommunityBriefPdf(
  doc: any,
  brief: any,
  orgName?: string,
): void {
  const geo = brief.geography ?? {};
  const demographics = brief.demographics ?? {};
  const systemsScores = brief.systemsScores ?? {};
  const atRisk = Array.isArray(brief.atRiskPopulations) ? brief.atRiskPopulations : [];
  const cascade = brief.cascade ?? {};
  const narrative = brief.narrativeSummary ?? brief.narrative ?? "";
  const evidence = brief.evidence ?? null;
  const resolved = evidence?.geography?.resolved ?? {};
  const source = Array.isArray(evidence?.sources) ? evidence.sources[0] : null;
  const overallScore = brief.overallScore ?? null;
  const overallGrade = brief.overallGrade ?? null;
  const displayName = resolved.label ?? geo.displayName ?? geo.input ?? "Community";

  // ── Cover header ──────────────────────────────────────────────────────────
  doc.rect(0, 0, 612, 130).fill(NAVY);

  // TCAF header text
  doc.fontSize(9).font("Helvetica").fillColor("#bee3f8")
    .text("THRIVING COMMUNITIES FOR ALL (TCAF)", 50, 18, { width: W });
  if (orgName) {
    doc.fontSize(9).font("Helvetica").fillColor("#bee3f8")
      .text(orgName, 50, 30, { width: W });
  }

  doc.fontSize(18).font("Helvetica-Bold").fillColor("white")
    .text("Community Impact Brief", 50, orgName ? 44 : 32, { width: W });

  // Grade badge text
  const gradeText = overallGrade && overallScore != null
    ? `Grade: ${overallGrade}  |  Score: ${overallScore}/100`
    : "";

  doc.fontSize(22).font("Helvetica-Bold").fillColor("#fcd34d")
    .text(displayName, 50, orgName ? 70 : 58, { width: 380 });

  if (gradeText) {
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#fcd34d")
      .text(gradeText, 50, orgName ? 96 : 84, { width: W });
  }

  doc.fontSize(8).font("Helvetica").fillColor("#bee3f8")
    .text(
      `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · TCAF Community Impact Analyzer`,
      50,
      112,
      { width: W },
    );

  doc.moveDown(8);

  // ── Demographics summary ──────────────────────────────────────────────────
  if (doc.y > 650) doc.addPage();
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY)
    .text("Demographics", 50, undefined, { width: W });
  doc.moveDown(0.3);

  const demRows: [string, string][] = [];
  if (demographics.totalPopulation != null) demRows.push(["Total Population", Number(demographics.totalPopulation).toLocaleString()]);
  if (demographics.povertyRate != null) demRows.push(["Poverty Rate", fmtPct(demographics.povertyRate)]);
  if (demographics.uninsuredRate != null) demRows.push(["Uninsured Rate", fmtPct(demographics.uninsuredRate)]);
  if (demographics.housingCostBurden != null) demRows.push(["Housing Cost Burden", fmtPct(demographics.housingCostBurden)]);
  if (demographics.unemploymentRate != null) demRows.push(["Unemployment Rate", fmtPct(demographics.unemploymentRate)]);
  if (demographics.noHighSchoolDiploma != null) demRows.push(["No High School Diploma", fmtPct(demographics.noHighSchoolDiploma)]);
  if (demographics.singleParentRate != null) demRows.push(["Single-Parent Households", fmtPct(demographics.singleParentRate)]);
  if (demographics.medianIncome != null) demRows.push(["Median Household Income", `$${Number(demographics.medianIncome).toLocaleString()}`]);

  if (demRows.length > 0) {
    const startY = doc.y;
    drawTableHeader(doc, 50, startY, "Indicator", "Value", "", 280, 120);
    demRows.forEach(([label, val], idx) => {
      const y = startY + 20 + idx * 18;
      if (y > 700) doc.addPage();
      drawTableRow(doc, 50, y, label, val, "", idx % 2 === 0, 280, 120);
    });
    doc.y = startY + 20 + demRows.length * 18 + 8;
  }

  // ── Systems scores ────────────────────────────────────────────────────────
  const scoreEntries = Object.entries(systemsScores) as [string, any][];
  if (scoreEntries.length > 0) {
    if (doc.y > 580) doc.addPage();
    doc.moveDown(0.8);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY)
      .text("Systems Scores", 50, undefined, { width: W });
    doc.moveDown(0.3);
    const sy = doc.y;
    drawTableHeader(doc, 50, sy, "Domain", "Score / Grade", "Urgency", 220, 120);
    scoreEntries.forEach(([domain, ds], idx) => {
      const rowY = sy + 20 + idx * 18;
      if (rowY > 700) { doc.addPage(); }
      const domainLabel = ds.label ?? domain;
      const scoreStr = ds.score != null ? `${ds.score}/100  ${ds.grade ?? ""}` : "—";
      const urgency = ds.urgency ?? "";
      drawTableRow(doc, 50, rowY, domainLabel, scoreStr, urgency, idx % 2 === 0, 220, 120);
    });
    doc.y = sy + 20 + scoreEntries.length * 18 + 8;
  }

  // ── At-risk populations ───────────────────────────────────────────────────
  if (atRisk.length > 0) {
    if (doc.y > 580) doc.addPage();
    doc.moveDown(0.8);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY)
      .text("At-Risk Populations", 50, undefined, { width: W });
    doc.moveDown(0.3);
    atRisk.forEach((pop: any, idx: number) => {
      if (doc.y > 680) doc.addPage();
      const est = pop.estimated != null ? `${Number(pop.estimated).toLocaleString()} ${pop.unit ?? ""}` : "";
      const line = `${pop.name ?? pop.id}${est ? " — " + est : ""}${pop.urgency ? "  [" + pop.urgency + "]" : ""}`;
      doc.fontSize(9.5).font(idx % 2 === 0 ? "Helvetica-Bold" : "Helvetica").fillColor(GRAY)
        .text(`• ${line}`, 58, undefined, { width: W - 8 });
      if (pop.primaryGap) {
        doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(LIGHT_GRAY)
          .text(`  Gap: ${pop.primaryGap}`, 66, undefined, { width: W - 16 });
      }
      doc.moveDown(0.2);
    });
  }

  // ── Cascade cost summary ──────────────────────────────────────────────────
  const hasCascade = cascade.counterfactualCost != null || cascade.interventionCost != null || cascade.netSavings != null;
  if (hasCascade) {
    if (doc.y > 600) doc.addPage();
    doc.moveDown(0.8);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY)
      .text("25-Year TCAF Scenario Model", 50, undefined, { width: W });
    doc.moveDown(0.3);
    const cascRows: [string, string][] = [];
    if (cascade.counterfactualCost != null) cascRows.push(["Model: cost of inaction", fmtDollar(cascade.counterfactualCost)]);
    if (cascade.interventionCost != null) cascRows.push(["Model: investment", fmtDollar(cascade.interventionCost)]);
    if (cascade.netSavings != null) cascRows.push(["Model: net savings", fmtDollar(cascade.netSavings)]);
    if (cascade.roi != null) cascRows.push(["Model: return on investment", String(cascade.roi)]);
    const csy = doc.y;
    drawTableHeader(doc, 50, csy, "Metric", "Value", "", 280, 180);
    cascRows.forEach(([label, val], idx) => {
      drawTableRow(doc, 50, csy + 20 + idx * 18, label, val, "", idx % 2 === 0, 280, 180);
    });
    doc.y = csy + 20 + cascRows.length * 18 + 8;
  }

  // ── Narrative summary ─────────────────────────────────────────────────────
  if (narrative) {
    if (doc.y > 600) doc.addPage();
    doc.moveDown(0.8);
    doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY)
      .text("AI-synthesized Narrative Summary", 50, undefined, { width: W });
    doc.moveDown(0.4);
    const narLines = String(narrative).split("\n").filter(Boolean);
    for (const line of narLines) {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
        .text(line, 50, undefined, { width: W });
      doc.moveDown(0.3);
    }
  }

  // ── Sources & methodology ─────────────────────────────────────────────────
  if (doc.y > 590) doc.addPage();
  doc.moveDown(1);
  doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY)
    .text("Sources & Methodology", 50, undefined, { width: W });
  doc.moveDown(0.35);
  doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
    .text(
      `Analyzed geography: ${resolved.label ?? "not disclosed"}${resolved.type ? ` (${String(resolved.type).toUpperCase()}${resolved.identifier ? ` ${resolved.identifier}` : ""})` : ""}.`,
      50, undefined, { width: W },
    )
    .text(
      `${source?.publisher ?? "Source not disclosed"}${source?.dataset ? ` · ${source.dataset}` : ""}${source?.vintage ? ` · ${source.vintage}` : ""}.`,
      50, undefined, { width: W },
    );
  if (resolved.coverageWarning) {
    doc.moveDown(0.25);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#975a16").text(String(resolved.coverageWarning), 50, undefined, { width: W });
  }
  doc.moveDown(0.4);
  doc.fontSize(9).font("Helvetica").fillColor(GRAY)
    .text(
      "Observed values are public-data estimates at the disclosed geography grain. Scores and population estimates are TCAF-derived calculations, not Census findings. Cascade figures are TCAF scenario/model outputs, not observed costs. Narrative text is AI decision support, not an independently verified factual finding.",
      50, undefined, { width: W },
    );

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.moveDown(1.5);
  doc.rect(50, doc.y, W, 1).fill(TEAL);
  doc.moveDown(0.5);
  doc.fontSize(8).font("Helvetica-Oblique").fillColor(LIGHT_GRAY)
    .text(
      "Powered by TCAF | thrivingcommunitiesforall.com · See Sources & Methodology for geography, source, and claim labels.",
      50,
      undefined,
      { width: W, align: "center" },
    );
}

// ── Trade slug → title case ───────────────────────────────────────────────────
function slugToTitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function registerExportPdfRoutes(app: Express) {
  // ── Original markdown-export route ──────────────────────────────────────────
  app.post("/api/export/pdf", async (req: Request, res: Response) => {
    try {
      const { content, title, subtitle, filename } = req.body as {
        content: string;
        title?: string;
        subtitle?: string;
        filename?: string;
      };

      if (!content) return res.status(400).json({ error: "content is required" });

      const safeFilename = (filename || title || "document")
        .replace(/[^a-zA-Z0-9_\-. ]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/\.md$/, "");

      const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
      doc.pipe(res);

      doc.rect(0, 0, 612, 120).fill(NAVY);
      doc.fontSize(20).font("Helvetica-Bold").fillColor("white")
        .text(title || "Document", 50, 28, { width: W });
      if (subtitle) {
        doc.fontSize(11).font("Helvetica").fillColor("#bee3f8")
          .text(subtitle, 50, 60, { width: W });
      }
      doc.fontSize(8.5).font("Helvetica").fillColor("#bee3f8")
        .text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ThriveUp Academy / TCAF`, 50, 96, { width: W });

      doc.moveDown(5.5);
      doc.rect(50, doc.y, W, 1.5).fill(TEAL);
      doc.moveDown(1.5);

      renderMarkdownToPdf(doc, content);

      doc.moveDown(2);
      doc.rect(50, doc.y, W, 1).fill(TEAL);
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(LIGHT_GRAY)
        .text("Thriving Communities for All (TCAF) · ThriveUp Academy · thrivingcommunitiesforall.com", 50, undefined, { width: W, align: "center" });

      doc.end();
    } catch (err) {
      console.error("Export PDF error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF." });
      }
    }
  });

  // ── Community brief PDF export ────────────────────────────────────────────
  // POST /api/export/community-brief-pdf
  // Public, rate-limited 10/hour/IP.
  // Body: {location, populationSize?, timeHorizon?, orgName?, orgColor?}
  // Internally calls the community-brief endpoint and renders a PDF.
  app.post("/api/export/community-brief-pdf", async (req: Request, res: Response) => {
    try {
      const ip = clientIp(req);
      const retryAfter = briefPdfRateLimit(ip, 10);
      if (retryAfter !== null) {
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({ error: "Rate limit exceeded. Please wait before downloading another brief." });
      }

      const { location, populationSize, timeHorizon, orgName } = req.body ?? {};
      if (!location || typeof location !== "string") {
        return res.status(400).json({ error: "location is required" });
      }

      // Internally call the community-brief endpoint to get real data.
      const briefRes = await fetch(`http://localhost:${process.env.PORT ?? 5000}/api/conductor/community-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: String(location).trim(),
          populationSize: populationSize ?? 10000,
          timeHorizon: timeHorizon ?? 25,
        }),
      });

      if (!briefRes.ok) {
        const body = await briefRes.text().catch(() => "");
        let errMsg = "Community brief generation failed";
        try { errMsg = (JSON.parse(body) as { error?: string }).error ?? errMsg; } catch {}
        return res.status(briefRes.status === 404 ? 404 : 502).json({ error: errMsg });
      }

      const brief = await briefRes.json() as Record<string, any>;
      if (!hasValidCommunityEvidence(brief)) {
        return res.status(502).json({ error: "Community brief generation did not return a valid evidence contract; PDF export was refused." });
      }

      // Generate PDF — only from fields actually present in the brief.
      const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });

      const safeLocation = (brief.geography?.displayName ?? location)
        .replace(/[^a-zA-Z0-9 _\-]/g, "_")
        .replace(/\s+/g, "-")
        .slice(0, 80);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="community-brief-${safeLocation}.pdf"`);
      doc.pipe(res);

      buildCommunityBriefPdf(doc, brief, orgName ? String(orgName) : undefined);

      doc.end();
    } catch (err) {
      console.error("[export/community-brief-pdf] error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate community brief PDF." });
      }
    }
  });

  // ── Trade certificate PDF export ──────────────────────────────────────────
  // GET /api/export/trade-cert-pdf/:certId
  // Public — certs are publicly verifiable by design.
  app.get("/api/export/trade-cert-pdf/:certId", async (req: Request, res: Response) => {
    try {
      const certId = String(req.params.certId ?? "");
      if (!certId) return res.status(400).json({ error: "certId is required" });

      const [cert] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.id, certId))
        .limit(1);

      if (!cert) {
        return res.status(404).json({ error: "Certificate not found." });
      }

      // Parse trade name from sourceKey "trade-sim:{slug}"
      let tradeName = cert.levelTitle ?? "Trade";
      if (cert.sourceKey?.startsWith("trade-sim:")) {
        tradeName = slugToTitle(cert.sourceKey.slice("trade-sim:".length));
      }

      const issuedDate = cert.issuedAt
        ? new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—";
      const verifyUrl = `https://thrivingcommunitiesforall.com/verify/${certId}`;

      const doc = new PDFDocument({ size: "LETTER", margin: 60, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="trade-cert-${certId.slice(0, 8)}.pdf"`);
      doc.pipe(res);

      // ── Cover band ──────────────────────────────────────────────────────
      doc.rect(0, 0, 612, 140).fill(NAVY);
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#bee3f8")
        .text("THRIVING COMMUNITIES FOR ALL (TCAF)", 60, 22, { width: 492 });
      doc.fontSize(10).font("Helvetica").fillColor("#bee3f8")
        .text("ThriveUp Trade Sims — Credential Achievement", 60, 40, { width: 492 });

      // Certificate of Completion
      doc.fontSize(24).font("Helvetica-Bold").fillColor("white")
        .text("Certificate of Completion", 60, 62, { width: 492 });

      doc.fontSize(8).font("Helvetica").fillColor("#bee3f8")
        .text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 60, 112, { width: 492 });

      doc.y = 158;
      doc.moveDown(1);

      // ── Certificate body ────────────────────────────────────────────────
      doc.fontSize(12).font("Helvetica").fillColor(GRAY)
        .text("This certifies that", 60, undefined, { width: 492 });
      doc.moveDown(0.4);

      doc.fontSize(22).font("Helvetica-Bold").fillColor(NAVY)
        .text(cert.userName ?? "Learner", 60, undefined, { width: 492 });
      doc.moveDown(0.6);

      doc.fontSize(12).font("Helvetica").fillColor(GRAY)
        .text("has successfully completed the ThriveUp Trade Sims simulation curriculum for", 60, undefined, { width: 492 });
      doc.moveDown(0.4);

      doc.fontSize(18).font("Helvetica-Bold").fillColor(TEAL)
        .text(tradeName, 60, undefined, { width: 492 });
      doc.moveDown(0.6);

      doc.fontSize(11).font("Helvetica").fillColor(GRAY)
        .text(`Issued: ${issuedDate}`, 60, undefined, { width: 492 });
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica").fillColor(GRAY)
        .text(`Certificate ID: ${certId}`, 60, undefined, { width: 492 });
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica").fillColor(GRAY)
        .text(`Verify at: ${verifyUrl}`, 60, undefined, { width: 492 });

      // Decorative divider
      doc.moveDown(1.2);
      doc.rect(60, doc.y, 492, 1.5).fill(TEAL);
      doc.moveDown(0.8);

      // ── Disclaimer ──────────────────────────────────────────────────────
      doc.fontSize(8.5).font("Helvetica-Oblique").fillColor(LIGHT_GRAY)
        .text(TRANSCRIPT_DISCLAIMER, 60, undefined, { width: 492 });

      // ── Footer ──────────────────────────────────────────────────────────
      doc.moveDown(2);
      doc.rect(60, doc.y, 492, 1).fill(TEAL);
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(LIGHT_GRAY)
        .text(
          "Thriving Communities for All (TCAF) · ThriveUp Academy · thrivingcommunitiesforall.com",
          60,
          undefined,
          { width: 492, align: "center" },
        );

      doc.end();
    } catch (err) {
      console.error("[export/trade-cert-pdf] error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate certificate PDF." });
      }
    }
  });
}
