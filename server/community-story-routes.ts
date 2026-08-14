/**
 * Community Story Pack — unified story assembly, PDF, presentation, and share/embed.
 *
 * Pulls from:
 *   • Community Brief conductor (Census demographics, SDOH systems scores, narrative)
 *   • Grant Conduit (org intelligence, matched opportunities, CEDS, gun violence)
 *
 * Routes:
 *   POST /api/community-story/pack         — full JSON story (web/API)
 *   POST /api/community-story/pdf          — downloadable PDF
 *   POST /api/community-story/presentation — downloadable HTML slide deck
 *   POST /api/community-story/share        — store + return shareId + embed code
 *   GET  /api/community-story/share/:id    — retrieve stored story for public page
 *
 * Partner API:
 *   GET  /api/partner/v1/community-story   — scoped partner-key access (community:read)
 */

import type { Express, Request, Response } from "express";
import { createRequire } from "module";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const require = createRequire((import.meta as any).url ?? (globalThis as any).__filename ?? process.cwd() + "/index.js");
const PDFDocument = require("pdfkit");

import { nanoid } from "nanoid";
import { db } from "./storage";
import { hasValidCommunityEvidence, canonicalizeGeographyFromEvidence } from "./community-evidence";
import type { AtRiskPopulation } from "./conductor-routes";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── In-memory story share store (30-day TTL, like brief shares) ───────────────
interface StoredStory {
  story: Record<string, unknown>;
  expiresAt: number;
}
const storyStore = new Map<string, StoredStory>();
const STORY_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function pruneStoryStore() {
  const now = Date.now();
  for (const [id, entry] of storyStore) {
    if (entry.expiresAt < now) storyStore.delete(id);
  }
}

function hasEvidenceContract(story: Record<string, unknown>): boolean {
  return hasValidCommunityEvidence((story as Record<string, any>).brief);
}

// ── Per-IP rate limits ────────────────────────────────────────────────────────
const packRateHits = new Map<string, number[]>();
function checkPackRateLimit(ip: string, maxPerHour = 10): boolean {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  const hits = (packRateHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (hits.length >= maxPerHour) return false;
  hits.push(now);
  packRateHits.set(ip, hits);
  return true;
}

// ── PDF colours (match export-pdf-routes.ts palette) ─────────────────────────
const NAVY  = "#1a365d";
const TEAL  = "#0d9488";
const GRAY  = "#4a5568";
const LIGHT = "#718096";
const W     = 512;

function fmt(v: number | null | undefined, suffix = ""): string {
  if (v == null || isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(1)}${suffix}`;
}
function fmtPct(v: number | null | undefined) { return fmt(v, "%"); }
function fmtDollar(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

// ── Internal fetch helpers ────────────────────────────────────────────────────
async function fetchCommunityBrief(location: string, populationSize?: number): Promise<Record<string, unknown>> {
  const port = process.env.PORT ?? 5000;
  const res = await fetch(`http://localhost:${port}/api/conductor/community-brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, populationSize: populationSize ?? 50000 }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Community brief failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function fetchGrantConduit(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const port = process.env.PORT ?? 5000;
    const res = await fetch(`http://localhost:${port}/api/grant-conduit/package`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json() as Promise<Record<string, unknown>>;
  } catch {
    return null;
  }
}

// ── Assemble the full story pack ──────────────────────────────────────────────
export async function assembleStoryPack(opts: {
  location: string;
  populationSize?: number;
  orgName?: string;
  orgType?: string;
  focusAreas?: string[];
  missionText?: string;
  includeGrantData?: boolean;
}): Promise<Record<string, unknown>> {
  const { location, populationSize, orgName, orgType, focusAreas, missionText, includeGrantData } = opts;

  const brief = await fetchCommunityBrief(location, populationSize);

  let grant: Record<string, unknown> | null = null;
  // Capture state before the grant conduit call so we can surface a disclosure
  // when it is absent. An empty state causes the grant conduit to return a 400
  // (geography.state is required), which fetchGrantConduit turns into null —
  // silently omitting the entire gunViolence block with no explanation to the
  // caller. The primary fix is in conductor-routes.ts (ZIP-range fallback), but
  // we add an explicit note here as a belt-and-suspenders disclosure.
  const geo = (brief.geography as Record<string, unknown>) ?? {};
  const resolvedState = typeof geo.state === "string" ? geo.state : "";
  const stateUnavailable = !resolvedState;

  if (includeGrantData) {
    if (stateUnavailable) {
      console.warn(
        "[assembleStoryPack] geography.state is empty for location '%s' — " +
        "grant conduit requires a state; gunViolence and state-scoped grant " +
        "data will be unavailable. The ZIP-range fallback in conductor-routes " +
        "should have populated this; check resolveLocationToZip for this input.",
        location
      );
    }
    grant = await fetchGrantConduit({
      orgType: orgType ?? "nonprofit",
      orgName,
      geography: {
        ...(resolvedState ? { state: resolvedState } : {}),
        ...(typeof geo.zip === "string" && geo.zip ? { zip: geo.zip } : {}),
      },
      focusAreas: focusAreas ?? [],
      missionText,
      generateNarratives: !!missionText,
    });
  }

  return {
    brief,
    grant,
    generatedAt: new Date().toISOString(),
    ...(stateUnavailable && includeGrantData
      ? {
          stateResolutionNote:
            "State could not be determined for this location. " +
            "State-level gun violence data and state-scoped grant intelligence " +
            "are unavailable for this story pack.",
        }
      : {}),
  };
}

// ── PDF builder for story pack ────────────────────────────────────────────────
function buildStoryPackPdf(doc: any, story: Record<string, unknown>, orgName?: string) {
  const brief = (story.brief as Record<string, unknown>) ?? {};
  const grant = (story.grant as Record<string, unknown> | null) ?? null;
  const geo        = (brief.geography as Record<string, unknown>) ?? {};
  const demo       = (brief.demographics as Record<string, unknown>) ?? {};
  const scores     = (brief.systemsScores as Record<string, Record<string, unknown>>) ?? {};
  const atRisk     = Array.isArray(brief.atRiskPopulations) ? brief.atRiskPopulations as string[] : [];
  const cascade    = (brief.cascade as Record<string, unknown>) ?? {};
  const solutions  = (brief.solutions as Record<string, unknown>) ?? {};
  const narrative  = (brief.narrative ?? brief.narrativeSummary ?? "") as string;
  const evidence = (brief.evidence as Record<string, any>) ?? null;
  const resolved = evidence?.geography?.resolved ?? {};
  const source = Array.isArray(evidence?.sources) ? evidence.sources[0] : null;
  const displayName = (resolved.label ?? geo.displayName ?? geo.input ?? "Community") as string;
  const grade      = (brief.overallGrade ?? "") as string;
  const score      = (brief.overallScore ?? null) as number | null;

  // ── Cover ─────────────────────────────────────────────────────────────────
  doc.rect(0, 0, 612, 160).fill(NAVY);
  doc.fontSize(9).font("Helvetica").fillColor("#bee3f8")
    .text("THRIVING COMMUNITIES FOR ALL (TCAF)", 50, 18, { width: W });
  if (orgName) {
    doc.fontSize(9).font("Helvetica").fillColor("#bee3f8")
      .text(orgName, 50, 30, { width: W });
  }
  doc.fontSize(20).font("Helvetica-Bold").fillColor("white")
    .text("Community Story Pack", 50, orgName ? 48 : 36, { width: W });
  doc.fontSize(13).font("Helvetica").fillColor("#bee3f8")
    .text(displayName, 50, orgName ? 74 : 62, { width: W });
  if (grade && score != null) {
    doc.fontSize(10).font("Helvetica").fillColor("#bee3f8")
      .text(`Community Health Grade: ${grade}  |  Score: ${score}/100`, 50, orgName ? 92 : 80, { width: W });
  }
  doc.fontSize(8).font("Helvetica").fillColor("#bee3f8")
    .text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 50, 140, { width: W });
  doc.y = 180;

  // ── Key demographics ──────────────────────────────────────────────────────
  doc.moveDown(0.5);
  doc.rect(50, doc.y, W, 24).fill(NAVY);
  doc.fontSize(11).font("Helvetica-Bold").fillColor("white").text("Community Demographics", 56, doc.y - 18, { width: W - 12 });
  doc.moveDown(1.8);

  const demRows = [
    ["Total Population",         demo.totalPopulation != null ? `${Number(demo.totalPopulation).toLocaleString()}` : "—"],
    ["Poverty Rate",             fmtPct(demo.povertyRate as number)],
    ["Unemployment Rate",        fmtPct(demo.unemploymentRate as number)],
    ["Uninsured Rate",           fmtPct(demo.uninsuredRate as number)],
    ["Housing Cost Burden",      fmtPct(demo.housingCostBurden as number)],
    ["Single-Parent Households", fmtPct(demo.singleParentRate as number)],
    ["No High School Diploma",   fmtPct(demo.noHighSchoolDiploma as number)],
    ["Median Household Income",  demo.medianIncome ? fmtDollar(Number(demo.medianIncome)) : "—"],
  ];
  demRows.forEach(([label, val], i) => {
    const y = doc.y;
    if (i % 2 === 0) doc.rect(50, y, W, 18).fill("#f7fafc");
    doc.fontSize(9).font("Helvetica").fillColor(GRAY)
      .text(label, 54, y + 4, { width: 260 })
      .text(val,   320, y + 4, { width: 150 });
    doc.rect(50, y, W, 18).stroke("#e2e8f0");
    doc.y = y + 18;
  });

  // ── Systems scores ────────────────────────────────────────────────────────
  doc.moveDown(1);
  if (doc.y > 620) doc.addPage();
  doc.rect(50, doc.y, W, 24).fill(NAVY);
  doc.fontSize(11).font("Helvetica-Bold").fillColor("white").text("Systems Health Scores", 56, doc.y - 18, { width: W - 12 });
  doc.moveDown(1.8);

  const scoreEntries = Object.entries(scores);
  scoreEntries.forEach(([key, s], i) => {
    if (doc.y > 700) doc.addPage();
    const y = doc.y;
    const label = (s as Record<string, unknown>).label ?? key;
    const sc = (s as Record<string, unknown>).score;
    const gr = (s as Record<string, unknown>).grade;
    const gap = (s as Record<string, unknown>).keyGap ?? "";
    if (i % 2 === 0) doc.rect(50, y, W, 18).fill("#f7fafc");
    doc.fontSize(9).font("Helvetica").fillColor(GRAY)
      .text(String(label), 54, y + 4, { width: 200 })
      .text(sc != null ? `${Number(sc).toFixed(0)}/100` : "—", 260, y + 4, { width: 50 })
      .text(gr ? String(gr) : "—", 315, y + 4, { width: 30 })
      .text(String(gap).slice(0, 80), 350, y + 4, { width: W - 305 });
    doc.rect(50, y, W, 18).stroke("#e2e8f0");
    doc.y = y + 18;
  });

  // ── At-risk populations ───────────────────────────────────────────────────
  if (atRisk.length > 0) {
    doc.moveDown(1);
    if (doc.y > 650) doc.addPage();
    doc.fontSize(11).font("Helvetica-Bold").fillColor(TEAL).text("At-Risk Populations", 50);
    doc.moveDown(0.4);
    atRisk.slice(0, 8).forEach((p) => {
      const label = typeof p === "string" ? p : (p as AtRiskPopulation)?.name ?? "";
      if (!label) return;
      doc.fontSize(9.5).font("Helvetica").fillColor(GRAY).text(`• ${label}`, 58, undefined, { width: W - 8 });
      doc.moveDown(0.2);
    });
  }

  // ── Narrative ─────────────────────────────────────────────────────────────
  if (narrative) {
    doc.addPage();
    doc.rect(50, doc.y, W, 24).fill(NAVY);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("white").text("AI-synthesized Community Narrative", 56, doc.y - 18, { width: W - 12 });
    doc.moveDown(1.8);
    doc.fontSize(9.5).font("Helvetica").fillColor(GRAY).text(narrative, 50, undefined, { width: W });
  }

  // ── Grant conduit section ─────────────────────────────────────────────────
  if (grant) {
    doc.addPage();
    doc.rect(0, 0, 612, 60).fill(TEAL);
    doc.fontSize(14).font("Helvetica-Bold").fillColor("white")
      .text("Grant Intelligence", 50, 18, { width: W });
    doc.fontSize(9).font("Helvetica").fillColor("white")
      .text("Matched opportunities and evidence base for this community", 50, 38, { width: W });
    doc.y = 80;

    // Readiness score
    const readiness = (grant.readiness as Record<string, unknown>) ?? {};
    if (readiness.score != null) {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(NAVY)
        .text(`Grant Readiness Score: ${readiness.score}/100  (${readiness.grade ?? "—"})`, 50);
      doc.moveDown(0.4);
      if (Array.isArray(readiness.gaps)) {
        (readiness.gaps as string[]).slice(0, 5).forEach((g) => {
          doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(`• ${g}`, 58, undefined, { width: W - 8 });
          doc.moveDown(0.15);
        });
      }
      doc.moveDown(0.8);
    }

    // Matched opportunities
    const opps = Array.isArray(grant.matchedOpportunities) ? grant.matchedOpportunities as Record<string, unknown>[] : [];
    if (opps.length > 0) {
      if (doc.y > 620) doc.addPage();
      doc.rect(50, doc.y, W, 24).fill(NAVY);
      doc.fontSize(11).font("Helvetica-Bold").fillColor("white").text("Matched Grant Opportunities", 56, doc.y - 18, { width: W - 12 });
      doc.moveDown(1.8);
      opps.slice(0, 8).forEach((opp, i) => {
        if (doc.y > 680) doc.addPage();
        const y = doc.y;
        if (i % 2 === 0) doc.rect(50, y, W, 36).fill("#f0fff4");
        const title = String(opp.title ?? opp.name ?? "Opportunity").slice(0, 80);
        const agency = String(opp.agency ?? opp.funder ?? "").slice(0, 50);
        const amount = opp.maxAward ? fmtDollar(Number(opp.maxAward)) : (opp.amount ? String(opp.amount) : "");
        doc.fontSize(9.5).font("Helvetica-Bold").fillColor(NAVY)
          .text(title, 54, y + 4, { width: W - 60 });
        doc.fontSize(8.5).font("Helvetica").fillColor(GRAY)
          .text(`${agency}${amount ? `  |  Up to ${amount}` : ""}`, 54, y + 17, { width: W - 60 });
        doc.rect(50, y, W, 36).stroke("#e2e8f0");
        doc.y = y + 36;
      });
    }

    // CEDS region
    const ceds = (grant.cedsRegion as Record<string, unknown> | null);
    if (ceds?.name) {
      doc.moveDown(1);
      if (doc.y > 650) doc.addPage();
      doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY)
        .text(`CEDS Region: ${ceds.name}`, 50);
      doc.moveDown(0.3);
      const goals = Array.isArray(ceds.goals) ? (ceds.goals as string[]).slice(0, 3) : [];
      goals.forEach((g) => {
        doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(`• ${g}`, 58, undefined, { width: W - 8 });
        doc.moveDown(0.2);
      });
    }

    // Gun violence context
    const gv = (grant.gunViolence as Record<string, unknown> | null);
    if (gv && Number(gv.incidents) > 0) {
      doc.moveDown(0.8);
      if (doc.y > 680) doc.addPage();
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#c53030").text("Community Safety Context", 50);
      doc.moveDown(0.2);
      doc.fontSize(9).font("Helvetica").fillColor(GRAY)
        .text(`${gv.incidents} incidents · ${gv.victims} victims · ${gv.fatalities} fatalities (last ${gv.windowDays} days)`, 58, undefined, { width: W - 8 });
      doc.moveDown(0.15);
      const gvGrants = Array.isArray(gv.triggeredGrantCategories) ? (gv.triggeredGrantCategories as string[]).slice(0, 3) : [];
      if (gvGrants.length > 0) {
        doc.text(`Triggered grant categories: ${gvGrants.join(", ")}`, 58, undefined, { width: W - 8 });
      }
    }

    // AI narratives from grant conduit
    const narratives = (grant.narratives as Record<string, string>) ?? {};
    const narKeys = ["problemStatement", "solutionApproach", "communityNeed"];
    for (const key of narKeys) {
      if (narratives[key]) {
        doc.addPage();
        const title = key === "problemStatement" ? "Problem Statement"
          : key === "solutionApproach" ? "Solution Approach"
          : "Community Need";
        doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY).text(title, 50);
        doc.moveDown(0.5);
        doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
          .text(narratives[key], 50, undefined, { width: W });
      }
    }
  }

  // ── Sources & methodology ─────────────────────────────────────────────────
  doc.addPage();
  doc.fontSize(14).font("Helvetica-Bold").fillColor(NAVY)
    .text("Sources & Methodology", 50, 52, { width: W });
  doc.moveDown(0.7);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(GRAY)
    .text(
      `Analyzed geography: ${resolved.label ?? "not disclosed"}${resolved.type ? ` (${String(resolved.type).toUpperCase()}${resolved.identifier ? ` ${resolved.identifier}` : ""})` : ""}`,
      50, undefined, { width: W },
    );
  doc.moveDown(0.35);
  doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
    .text(
      `${source?.publisher ?? "Source not disclosed"}${source?.dataset ? ` · ${source.dataset}` : ""}${source?.vintage ? ` · ${source.vintage}` : ""}.`,
      50, undefined, { width: W },
    );
  if (resolved.coverageWarning) {
    doc.moveDown(0.35);
    doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#975a16")
      .text(String(resolved.coverageWarning), 50, undefined, { width: W });
  }
  doc.moveDown(0.7);
  doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
    .text(
      "Observed values are public-data estimates at the disclosed geography grain. Systems scores and at-risk population counts are TCAF-derived calculations, not Census findings. Cascade values are TCAF scenario/model outputs, not observed expenditures or savings. The AI narrative's ROI/cost-benefit ratio, poverty rate, uninsured rate, and (when a scenario is computed) cost-of-inaction / intervention-cost / net-savings dollar figures are each mechanically checked against these real computed/Census values before you see them — a sentence stating one of those figures incorrectly is stripped, not shown. Any other number the narrative states, along with all of its qualitative framing (which risks it emphasizes, how it characterizes urgency, word choice), is an AI judgment call that is NOT and cannot be mechanically verified — it is disclosed as such rather than presented as fact. Every check we do run is permanently recorded in an internal, cryptographically hash-chained audit log — a party with direct database access could in principle rewrite it, but doing so breaks the SHA-256 linkage from that point forward, which our own continuous server-side re-verification (see /api/claim-chain/verify for the current status) will detect. This is an internal tamper-evidence mechanism, not an externally anchored public ledger.",
      50, undefined, { width: W },
    );

  // ── Footer ────────────────────────────────────────────────────────────────
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    const bottom = 750;
    doc.rect(50, bottom, W, 1).fill("#e2e8f0");
    doc.fontSize(7.5).font("Helvetica").fillColor(LIGHT)
      .text(
        `Thriving Communities for All (TCAF) · thrivingcommunitiesforall.com · Page ${i + 1} of ${pages.count}`,
        50, bottom + 4, { width: W, align: "center" },
      );
  }
}

// ── Presentation HTML builder ─────────────────────────────────────────────────
function buildPresentationHtml(story: Record<string, unknown>, orgName?: string): string {
  const brief     = (story.brief as Record<string, unknown>) ?? {};
  const grant     = (story.grant as Record<string, unknown> | null) ?? null;
  const geo       = (brief.geography as Record<string, unknown>) ?? {};
  const demo      = (brief.demographics as Record<string, unknown>) ?? {};
  const scores    = (brief.systemsScores as Record<string, Record<string, unknown>>) ?? {};
  const atRisk    = Array.isArray(brief.atRiskPopulations) ? brief.atRiskPopulations as string[] : [];
  const narrative = (brief.narrative ?? brief.narrativeSummary ?? "") as string;
  const grade     = (brief.overallGrade ?? "") as string;
  const score     = (brief.overallScore ?? null) as number | null;
  const displayName = (geo.displayName ?? geo.input ?? "") as string;
  const opps      = grant ? (Array.isArray(grant.matchedOpportunities) ? grant.matchedOpportunities as Record<string, unknown>[] : []) : [];
  const readiness = grant ? ((grant.readiness as Record<string, unknown>) ?? {}) : {};
  const evidence  = (brief.evidence as Record<string, any>) ?? null;
  const resolved  = evidence?.geography?.resolved ?? {};
  const source    = Array.isArray(evidence?.sources) ? evidence.sources[0] : null;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #f8fafc; }
    .slide {
      width: 100%; max-width: 1280px; margin: 0 auto 24px;
      min-height: 720px; border-radius: 12px; overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12); background: white;
      display: flex; flex-direction: column; justify-content: flex-start;
      page-break-after: always; break-after: page;
    }
    .slide-header { padding: 48px 64px 32px; }
    .slide-body   { padding: 0 64px 48px; flex: 1; }
    .cover        { background: linear-gradient(135deg, #1a365d 0%, #0d9488 100%); color: white; padding: 80px 80px; min-height: 720px; display: flex; flex-direction: column; justify-content: center; }
    .cover h1     { font-size: 52px; font-weight: 900; line-height: 1.1; margin-bottom: 16px; }
    .cover h2     { font-size: 28px; font-weight: 400; opacity: 0.85; margin-bottom: 32px; }
    .badge        { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 999px; padding: 6px 20px; font-size: 14px; font-weight: 600; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #0d9488; margin-bottom: 8px; }
    h2.slide-h    { font-size: 34px; font-weight: 800; color: #1a365d; margin-bottom: 24px; line-height: 1.2; }
    .stat-grid    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .stat-card    { background: #f0fff4; border-radius: 10px; padding: 20px; text-align: center; }
    .stat-card.warn { background: #fff5f5; }
    .stat-num     { font-size: 36px; font-weight: 800; color: #1a365d; }
    .stat-card.warn .stat-num { color: #c53030; }
    .stat-label   { font-size: 12px; color: #718096; margin-top: 4px; }
    .score-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .score-card   { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .score-label  { font-size: 12px; color: #4a5568; margin-bottom: 6px; }
    .score-bar-bg { height: 8px; background: #e2e8f0; border-radius: 4px; }
    .score-bar    { height: 8px; background: #0d9488; border-radius: 4px; }
    .score-num    { font-size: 11px; color: #4a5568; margin-top: 4px; }
    .opp-list     { display: flex; flex-direction: column; gap: 12px; }
    .opp-card     { border-left: 4px solid #0d9488; background: #f0fff4; border-radius: 0 8px 8px 0; padding: 14px 18px; }
    .opp-title    { font-size: 14px; font-weight: 700; color: #1a365d; }
    .opp-meta     { font-size: 12px; color: #718096; margin-top: 4px; }
    .narrative    { font-size: 15px; line-height: 1.7; color: #4a5568; max-height: 520px; overflow: hidden; }
    .at-risk      { display: flex; flex-wrap: wrap; gap: 10px; }
    .at-risk span { background: #ebf8ff; color: #2b6cb0; border-radius: 999px; padding: 6px 14px; font-size: 13px; }
    .footer-bar   { background: #1a365d; color: rgba(255,255,255,0.7); font-size: 11px; padding: 12px 64px; display: flex; justify-content: space-between; margin-top: auto; }
    .method       { margin-top: 22px; border-left: 4px solid #0d9488; background:#f0fdfa; padding:14px 16px; font-size:14px; line-height:1.45; color:#1a365d; }
    @media print {
      body { background: white; }
      .slide { box-shadow: none; border-radius: 0; margin: 0; width: 100%; max-width: 100%; }
      .controls { display: none !important; }
    }
  `;

  const footer = (text = "") => `
    <div class="footer-bar">
      <span>Thriving Communities for All (TCAF) · thrivingcommunitiesforall.com</span>
      <span>${text}</span>
    </div>`;

  const slides: string[] = [];

  // Slide 1 — Cover
  slides.push(`
    <div class="slide cover">
      <div style="font-size:13px;opacity:0.7;margin-bottom:12px;text-transform:uppercase;letter-spacing:2px;">
        ${orgName ? `${orgName} · ` : ""}Community Story Pack
      </div>
      <h1>${displayName}</h1>
      <h2>Reducing Human Suffering, Increasing Self-Sufficiency</h2>
      ${grade ? `<div class="badge">Community Grade: ${grade} · ${score}/100</div>` : ""}
      <div style="margin-top:48px;font-size:12px;opacity:0.6;">
        Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · TCAF Data Platform
      </div>
    </div>`);

  // Slide 2 — Key stats
  const keyStats = [
    { num: demo.totalPopulation != null ? Number(demo.totalPopulation).toLocaleString() : "—", label: "Total Population", warn: false },
    { num: fmtPct(demo.povertyRate as number), label: "Poverty Rate", warn: Number(demo.povertyRate ?? 0) > 15 },
    { num: fmtPct(demo.uninsuredRate as number), label: "Uninsured Rate", warn: Number(demo.uninsuredRate ?? 0) > 10 },
    { num: fmtPct(demo.unemploymentRate as number), label: "Unemployment", warn: Number(demo.unemploymentRate ?? 0) > 8 },
    { num: fmtPct(demo.housingCostBurden as number), label: "Housing Cost Burden", warn: Number(demo.housingCostBurden ?? 0) > 30 },
    { num: demo.medianIncome ? fmtDollar(Number(demo.medianIncome)) : "—", label: "Median Income", warn: false },
    { num: fmtPct(demo.singleParentRate as number), label: "Single-Parent HH", warn: false },
    { num: fmtPct(demo.noHighSchoolDiploma as number), label: "No HS Diploma", warn: true },
  ];
  slides.push(`
    <div class="slide">
      <div class="slide-header">
        <div class="section-title">The Challenge</div>
        <h2 class="slide-h">Community Demographics at a Glance</h2>
      </div>
      <div class="slide-body">
        <div class="method"><strong>Evidence &amp; methodology</strong><br>Analyzed geography: ${String(resolved.label ?? "not disclosed")}${resolved.type ? ` (${String(resolved.type).toUpperCase()}${resolved.identifier ? ` ${String(resolved.identifier)}` : ""})` : ""}.<br>${String(source?.publisher ?? "Source not disclosed")}${source?.dataset ? ` · ${String(source.dataset)}` : ""}. Observed values are public-data estimates; scores are TCAF-derived calculations; narrative is AI decision support.</div>
        <div class="stat-grid">
          ${keyStats.map(s => `
            <div class="stat-card${s.warn ? " warn" : ""}">
              <div class="stat-num">${s.num}</div>
              <div class="stat-label">${s.label}</div>
            </div>`).join("")}
        </div>
      </div>
      ${footer(displayName)}
    </div>`);

  // Slide 3 — Systems scores
  const scoreEntries = Object.entries(scores).slice(0, 9);
  if (scoreEntries.length > 0) {
    slides.push(`
      <div class="slide">
        <div class="slide-header">
          <div class="section-title">Social Determinants of Health</div>
          <h2 class="slide-h">Systems Health Scores</h2>
        </div>
        <div class="slide-body">
          <div class="score-grid">
            ${scoreEntries.map(([, s]) => {
              const sc = Number((s as Record<string, unknown>).score ?? 0);
              const label = String((s as Record<string, unknown>).label ?? "");
              const gr = String((s as Record<string, unknown>).grade ?? "");
              const gap = String((s as Record<string, unknown>).keyGap ?? "");
              return `
                <div class="score-card">
                  <div class="score-label"><strong>${label}</strong> — Grade ${gr}</div>
                  <div class="score-bar-bg"><div class="score-bar" style="width:${sc}%"></div></div>
                  <div class="score-num">${sc}/100${gap ? ` · ${gap.slice(0, 60)}` : ""}</div>
                </div>`;
            }).join("")}
          </div>
        </div>
        ${footer(displayName)}
      </div>`);
  }

  // Slide 4 — At-risk populations
  if (atRisk.length > 0) {
    slides.push(`
      <div class="slide">
        <div class="slide-header">
          <div class="section-title">Populations of Focus</div>
          <h2 class="slide-h">Who We Serve</h2>
        </div>
        <div class="slide-body">
          <div class="at-risk">
            ${atRisk.map(p => `<span>${escapeHtml(typeof p === "string" ? p : (p as AtRiskPopulation)?.name ?? "")}</span>`).filter(Boolean).join("")}
          </div>
        </div>
        ${footer(displayName)}
      </div>`);
  }

  // Slide 5 — Narrative
  if (narrative) {
    slides.push(`
      <div class="slide">
        <div class="slide-header">
          <div class="section-title">Community Context</div>
          <h2 class="slide-h">The Story</h2>
        </div>
        <div class="slide-body">
          <div class="narrative">${narrative.replace(/\n/g, "<br>").slice(0, 1800)}</div>
        </div>
        ${footer(displayName)}
      </div>`);
  }

  // Slide 6 — Grant opportunities
  if (opps.length > 0) {
    slides.push(`
      <div class="slide">
        <div class="slide-header">
          <div class="section-title">Funding Opportunities</div>
          <h2 class="slide-h">Matched Grant Opportunities</h2>
          ${readiness.score != null ? `<div style="font-size:13px;color:#718096;margin-top:-16px;">Grant Readiness: ${readiness.score}/100 (${readiness.grade ?? "—"})</div>` : ""}
        </div>
        <div class="slide-body">
          <div class="opp-list">
            ${opps.slice(0, 6).map(opp => `
              <div class="opp-card">
                <div class="opp-title">${String(opp.title ?? opp.name ?? "Opportunity").slice(0, 90)}</div>
                <div class="opp-meta">
                  ${String(opp.agency ?? opp.funder ?? "").slice(0, 60)}
                  ${opp.maxAward ? ` · Up to ${fmtDollar(Number(opp.maxAward))}` : ""}
                  ${opp.deadline ? ` · Deadline: ${String(opp.deadline).slice(0, 20)}` : ""}
                </div>
              </div>`).join("")}
          </div>
        </div>
        ${footer(displayName)}
      </div>`);
  }

  // Slide 7 — Call to action
  slides.push(`
    <div class="slide cover" style="background: linear-gradient(135deg, #0d9488 0%, #1a365d 100%);">
      <div style="font-size:13px;opacity:0.7;margin-bottom:12px;text-transform:uppercase;letter-spacing:2px;">Powered by TCAF</div>
      <h1 style="font-size:42px;">Ready to act on this data?</h1>
      <div style="font-size:18px;opacity:0.85;line-height:1.6;margin-top:24px;max-width:700px;">
        Use ThriveUp's Grant Intelligence Package, LOI Writer, and Funder Dashboard
        to turn this community story into funded programs.
      </div>
      <div style="margin-top:48px;font-size:13px;opacity:0.6;">
        thrivingcommunitiesforall.com · Grant Conduit · Navigator AI · Community Brief
      </div>
    </div>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Community Story Pack — ${displayName}</title>
  <style>${css}</style>
</head>
<body>
  <div class="controls" style="position:fixed;top:16px;right:16px;z-index:999;display:flex;gap:8px;">
    <button onclick="window.print()" style="background:#1a365d;color:white;border:none;border-radius:6px;padding:10px 20px;font-size:14px;cursor:pointer;font-weight:600;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  ${slides.join("\n")}
</body>
</html>`;
}

// ── Register routes ───────────────────────────────────────────────────────────
export function registerCommunityStoryRoutes(app: Express) {

  // ── POST /api/community-story/pack ─────────────────────────────────────────
  app.post("/api/community-story/pack", async (req: Request, res: Response) => {
    const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown").trim();
    if (!checkPackRateLimit(ip)) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again in an hour." });
    }
    const { location, populationSize, orgName, orgType, focusAreas, missionText, includeGrantData } = req.body ?? {};
    if (!location) return res.status(400).json({ error: "location is required" });
    try {
      const story = await assembleStoryPack({
        location: String(location),
        populationSize: populationSize ? Number(populationSize) : undefined,
        orgName: orgName ? String(orgName) : undefined,
        orgType: orgType ? String(orgType) : undefined,
        focusAreas: Array.isArray(focusAreas) ? focusAreas.map(String) : [],
        missionText: missionText ? String(missionText) : undefined,
        includeGrantData: !!includeGrantData,
      });
      res.json(story);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[community-story/pack]", msg);
      res.status(502).json({ error: msg });
    }
  });

  // ── POST /api/community-story/pdf ──────────────────────────────────────────
  app.post("/api/community-story/pdf", async (req: Request, res: Response) => {
    const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown").trim();
    if (!checkPackRateLimit(ip, 5)) {
      return res.status(429).json({ error: "Rate limit exceeded. 5 PDFs per hour." });
    }
    const { location, populationSize, orgName, orgType, focusAreas, missionText, includeGrantData } = req.body ?? {};
    if (!location) return res.status(400).json({ error: "location is required" });
    try {
      const story = await assembleStoryPack({
        location: String(location),
        populationSize: populationSize ? Number(populationSize) : undefined,
        orgName: orgName ? String(orgName) : undefined,
        orgType: orgType ? String(orgType) : undefined,
        focusAreas: Array.isArray(focusAreas) ? focusAreas.map(String) : [],
        missionText: missionText ? String(missionText) : undefined,
        includeGrantData: !!includeGrantData,
      });

      const brief = (story.brief as Record<string, unknown>) ?? {};
      const geo = (brief.geography as Record<string, unknown>) ?? {};
      const safeLocation = (String(geo.displayName ?? location))
        .replace(/[^a-zA-Z0-9 _\-]/g, "_")
        .replace(/\s+/g, "-")
        .slice(0, 80);

      const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="community-story-${safeLocation}.pdf"`);
      doc.pipe(res);
      buildStoryPackPdf(doc, story, orgName ? String(orgName) : undefined);
      doc.end();
    } catch (err) {
      console.error("[community-story/pdf]", err);
      if (!res.headersSent) res.status(502).json({ error: "PDF generation failed." });
    }
  });

  // ── POST /api/community-story/presentation ─────────────────────────────────
  app.post("/api/community-story/presentation", async (req: Request, res: Response) => {
    const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown").trim();
    if (!checkPackRateLimit(ip, 5)) {
      return res.status(429).json({ error: "Rate limit exceeded." });
    }
    const { location, populationSize, orgName, orgType, focusAreas, missionText, includeGrantData } = req.body ?? {};
    if (!location) return res.status(400).json({ error: "location is required" });
    try {
      const story = await assembleStoryPack({
        location: String(location),
        populationSize: populationSize ? Number(populationSize) : undefined,
        orgName: orgName ? String(orgName) : undefined,
        orgType: orgType ? String(orgType) : undefined,
        focusAreas: Array.isArray(focusAreas) ? focusAreas.map(String) : [],
        missionText: missionText ? String(missionText) : undefined,
        includeGrantData: !!includeGrantData,
      });

      const brief = (story.brief as Record<string, unknown>) ?? {};
      const geo = (brief.geography as Record<string, unknown>) ?? {};
      const safeLocation = (String(geo.displayName ?? location))
        .replace(/[^a-zA-Z0-9 _\-]/g, "_")
        .replace(/\s+/g, "-")
        .slice(0, 80);

      const html = buildPresentationHtml(story, orgName ? String(orgName) : undefined);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="community-story-${safeLocation}.html"`);
      res.send(html);
    } catch (err) {
      console.error("[community-story/presentation]", err);
      if (!res.headersSent) res.status(502).json({ error: "Presentation generation failed." });
    }
  });

  // ── POST /api/community-story/share ────────────────────────────────────────
  app.post("/api/community-story/share", async (req: Request, res: Response) => {
    const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown").trim();
    if (!checkPackRateLimit(ip, 5)) {
      return res.status(429).json({ error: "Rate limit exceeded." });
    }
    const { story, location, orgName } = req.body ?? {};
    if (!story && !location) return res.status(400).json({ error: "story or location is required" });

    try {
      pruneStoryStore();
      let storyData = story;
      if (!storyData && location) {
        storyData = await assembleStoryPack({
          location: String(location),
          orgName: orgName ? String(orgName) : undefined,
          includeGrantData: false,
        });
      }
      if (!storyData || !hasEvidenceContract(storyData as Record<string, unknown>)) {
        return res.status(422).json({ error: "This story has no valid community evidence contract and cannot be shared. Generate a new story to disclose geography, sources, and claim types." });
      }

      // Community Story shares are PUBLIC and unauthenticated. `rplice` is an
      // authenticated-analyst-only internal intelligence block; the evidence
      // check above only validates `story.brief.evidence`, so a client-supplied
      // top-level `story` payload could still smuggle its own `rplice` (or a
      // nested `brief.rplice`) key through untouched. Strip both regardless of
      // what the caller sent before it is ever persisted or served publicly.
      const cleanStory = storyData as Record<string, unknown>;
      delete cleanStory.rplice;
      if (cleanStory.brief && typeof cleanStory.brief === "object") {
        delete (cleanStory.brief as Record<string, unknown>).rplice;
        // A caller-supplied `story` can pass evidence validation while its
        // `brief.geography` (rendered prominently on the public story page,
        // in the PDF, and in embeds) disagrees with what the evidence was
        // actually resolved against. Force them to agree before persisting.
        canonicalizeGeographyFromEvidence(cleanStory.brief as Record<string, unknown>);
      }

      const shareId = nanoid(10);
      storyStore.set(shareId, { story: cleanStory, expiresAt: Date.now() + STORY_TTL_MS });

      const baseUrl = "https://thrivingcommunitiesforall.com";
      const shareUrl = `${baseUrl}/community-story/${shareId}`;
      const embedCode = `<iframe src="${shareUrl}" width="100%" height="720" frameborder="0" style="border-radius:12px;border:1px solid #e2e8f0;" title="Community Story — ${orgName ?? location}"></iframe>`;

      res.json({ shareId, shareUrl, embedCode, expiresAt: new Date(Date.now() + STORY_TTL_MS).toISOString() });
    } catch (err) {
      console.error("[community-story/share]", err);
      res.status(502).json({ error: "Share creation failed." });
    }
  });

  // ── GET /api/community-story/share/:shareId ────────────────────────────────
  app.get("/api/community-story/share/:shareId", (req: Request, res: Response) => {
    const shareId = String(req.params.shareId ?? "");
    const entry = storyStore.get(shareId);
    if (!entry || entry.expiresAt < Date.now()) {
      storyStore.delete(shareId);
      return res.status(404).json({ error: "Story not found or expired." });
    }
    // Re-validate on every read, the same way brief-share-routes.ts does. The
    // store is written only by the POST handler above, but a read-time check
    // is a cheap, independent guard against any future write path that
    // bypasses that validation.
    if (!hasEvidenceContract(entry.story)) {
      storyStore.delete(shareId);
      return res.status(422).json({ error: "This shared story lacks a valid evidence contract and is unavailable." });
    }
    const story = entry.story as Record<string, unknown>;
    if ("rplice" in story) delete story.rplice;
    if (story.brief && typeof story.brief === "object") {
      const brief = story.brief as Record<string, unknown>;
      if ("rplice" in brief) delete brief.rplice;
      // Defensive re-canonicalization on every read (mirrors brief-share-routes.ts):
      // guards against any stored entry written before this check existed.
      canonicalizeGeographyFromEvidence(brief);
    }
    res.json(story);
  });
}
