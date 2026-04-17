/**
 * Corridor Deck Builder v2
 * --------------------------------------------------------------------------
 * Pulls the unified story from /api/corridor/story (live data + provenance)
 * and renders both PPTX and DOCX with every number footnoted to its source.
 *
 * Usage:  node scripts/build-corridor-deck.mjs
 * Env:    BASE_URL (default http://localhost:5000)
 */
import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, Footer, PageNumber } from "docx";
import fs from "fs";

const BASE = process.env.BASE_URL || "http://localhost:5000";
const OUT = "attached_assets/decks";
fs.mkdirSync(OUT, { recursive: true });

const COLORS = { navy: "0B2545", gold: "D4A24C", crimson: "9B1C2E", slate: "2D3E50", cream: "F7F2E7", ink: "1A1A1A", gray: "5A6470", emerald: "2E7D32" };

console.log("[deck] fetching corridor story from", BASE);
const res = await fetch(`${BASE}/api/corridor/story`);
if (!res.ok) { console.error("[deck] fetch failed", res.status); process.exit(1); }
const story = await res.json();
console.log("[deck] story OK · generated", story.generatedAt);

const fmt = (v, unit) => {
  if (v == null) return "—";
  if (typeof v === "number") return unit === "USD" ? `$${v.toLocaleString()}` : v.toLocaleString();
  return String(v);
};
const cite = (c) => c?.source ? `${c.source}${c.asOfDate ? ` · ${c.asOfDate}` : ""}` : "—";
const conf = (c) => c?.confidence ?? "unverified";

/* ---------------- PPTX ---------------- */
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.title = "I-35 Corridor Intelligence: Black Youth Fatherhood Gap";
pptx.author = "TCAF · ThriveUp Community Academy";
const W = 13.33, H = 7.5;

function header(s, t, sub) {
  s.addShape("rect", { x: 0, y: 0, w: W, h: 0.9, fill: { color: COLORS.navy }, line: { color: COLORS.navy } });
  s.addText(t, { x: 0.4, y: 0.12, w: W - 0.8, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  if (sub) s.addText(sub, { x: 0.4, y: 0.5, w: W - 0.8, h: 0.35, fontSize: 12, italic: true, color: COLORS.gold, fontFace: "Calibri" });
}
function footer(s, label) {
  s.addText(`TCAF · ${label} · ${new Date(story.generatedAt).toISOString().slice(0, 10)} · live from /api/corridor/story`, {
    x: 0.4, y: H - 0.32, w: W - 0.8, h: 0.25, fontSize: 9, color: COLORS.gray, fontFace: "Calibri"
  });
}
function divider(t, sub) {
  const s = pptx.addSlide();
  s.background = { color: COLORS.navy };
  s.addShape("rect", { x: 0, y: H/2 - 0.05, w: W, h: 0.05, fill: { color: COLORS.gold }, line: { color: COLORS.gold } });
  s.addText(t, { x: 0.5, y: H/2 - 1.5, w: W - 1, h: 1, fontSize: 44, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri" });
  if (sub) s.addText(sub, { x: 0.5, y: H/2 + 0.2, w: W - 1, h: 0.6, fontSize: 18, italic: true, color: COLORS.gold, align: "center", fontFace: "Calibri" });
}
function statTile(s, x, y, w, h, value, label, claim) {
  const c = conf(claim);
  const color = c === "verified" ? COLORS.emerald : c === "modeled" ? COLORS.gold : COLORS.crimson;
  s.addShape("rect", { x, y, w, h, fill: { color: "FFFFFF" }, line: { color, width: 1.5 } });
  s.addText(value, { x, y: y + 0.1, w, h: h * 0.4, fontSize: 26, bold: true, color, align: "center", fontFace: "Calibri" });
  s.addText(label, { x: x + 0.1, y: y + h * 0.45, w: w - 0.2, h: h * 0.28, fontSize: 10, color: COLORS.slate, align: "center", fontFace: "Calibri" });
  s.addText(`[${c}] ${cite(claim)}`, { x: x + 0.1, y: y + h * 0.73, w: w - 0.2, h: h * 0.25, fontSize: 7, italic: true, color: COLORS.gray, align: "center", fontFace: "Calibri" });
}

// 1. Title
{
  const s = pptx.addSlide();
  s.background = { color: COLORS.navy };
  s.addShape("rect", { x: 0, y: 5.6, w: W, h: 0.06, fill: { color: COLORS.gold }, line: { color: COLORS.gold } });
  s.addText("THE I-35 CORRIDOR INTELLIGENCE BRIEF", { x: 0.5, y: 1.2, w: W - 1, h: 0.7, fontSize: 32, color: COLORS.gold, bold: true, align: "center", fontFace: "Calibri" });
  s.addText(story.narrative.headline, { x: 0.5, y: 2.1, w: W - 1, h: 1.2, fontSize: 26, color: "FFFFFF", bold: true, align: "center", fontFace: "Calibri" });
  s.addText("One story. Two metros. Verified data + modeled bridges + live grant pipeline.\nEvery number on every slide is sourced.", { x: 1, y: 3.7, w: W - 2, h: 1.2, fontSize: 16, color: "FFFFFF", italic: true, align: "center", fontFace: "Calibri" });
  s.addText(`TCAF · synthesized ${new Date(story.generatedAt).toLocaleString()}`, { x: 0.5, y: 5.9, w: W - 1, h: 0.6, fontSize: 13, color: COLORS.gold, align: "center", fontFace: "Calibri" });
}

// 2. Story arc — the 6 beats
{
  const s = pptx.addSlide(); s.background = { color: COLORS.cream };
  header(s, "The single story · 6 connected beats", "How verified SDOH → school discipline → fatherhood gap → platform → funding → partners chain together.");
  s.addText(
    story.narrative.arc.map((b, i) => ({
      text: `${i + 1}. ${b.beat}\n${b.text}\n`,
      options: { fontSize: 12, color: COLORS.ink, breakLine: true, paraSpaceAfter: 8, bold: false }
    })),
    { x: 0.5, y: 1.1, w: W - 1, h: H - 1.6, fontFace: "Calibri", valign: "top" }
  );
  footer(s, "Narrative arc");
}

// 3 & 4: per-metro stat slides + chained story
for (const metroKey of ["waco", "austin"]) {
  const m = story.metros[metroKey];
  divider(`PART · ${m.metro.name.toUpperCase()}`, `${m.metro.character} pattern · focus ZIP ${m.metro.focusZip} · ${m.metro.district}`);

  // stats
  {
    const s = pptx.addSlide(); s.background = { color: COLORS.cream };
    header(s, `${m.metro.name} — verified baseline`, `Data as of ${m.dataFreshness.asOfDate ?? "—"} · sources: ${m.dataFreshness.dataSources ?? "—"}`);
    statTile(s, 0.5, 1.3, 3.0, 1.6, fmt(m.counts.totalPopulation.value), "Total population", m.counts.totalPopulation);
    statTile(s, 3.7, 1.3, 3.0, 1.6, m.counts.povertyRate.value != null ? m.counts.povertyRate.value.toFixed(1) + "%" : "—", "Poverty rate", m.counts.povertyRate);
    statTile(s, 6.9, 1.3, 3.0, 1.6, m.counts.medianIncome.value ? `$${(m.counts.medianIncome.value / 1000).toFixed(0)}K` : "—", "Median income", m.counts.medianIncome);
    statTile(s, 10.1, 1.3, 2.8, 1.6, m.counts.unemployment.value != null ? m.counts.unemployment.value.toFixed(1) + "%" : "—", "Unemployment", m.counts.unemployment);
    statTile(s, 0.5, 3.1, 3.0, 1.6, m.counts.svi.value != null ? m.counts.svi.value.toFixed(0) : "—", "SVI percentile", m.counts.svi);
    statTile(s, 3.7, 3.1, 3.0, 1.6, m.counts.healthBurden.value != null ? m.counts.healthBurden.value.toFixed(2) : "—", "Health burden", m.counts.healthBurden);
    statTile(s, 6.9, 3.1, 3.0, 1.6, m.counts.foodAccess.value != null ? (m.counts.foodAccess.value > 0.5 ? "YES" : "no") : "—", "Food desert flag", m.counts.foodAccess);
    statTile(s, 10.1, 3.1, 2.8, 1.6, String(m.zipDetail.length), "ZIP rows on file", { confidence: m.zipDetail.length ? "verified" : "unverified", source: "neighborhood_intelligence", asOfDate: null });
    s.addText("Green border = verified primary source · Gold = modeled from verified base · Red = unverified / pending ingestion.", {
      x: 0.5, y: 5.0, w: W - 1, h: 0.4, fontSize: 10, italic: true, color: COLORS.gray, fontFace: "Calibri", align: "center"
    });
    footer(s, `${m.metro.name} · baseline`);
  }

  // fatherhood gap (modeled) + chained story
  {
    const s = pptx.addSlide(); s.background = { color: COLORS.cream };
    header(s, `${m.metro.name} — fatherhood gap (modeled from verified base)`, "Every modeled number shows its method.");
    statTile(s, 0.5, 1.3, 3.0, 1.6, fmt(m.fatherhoodGap.blackPopulation.value), "Black population", m.fatherhoodGap.blackPopulation);
    statTile(s, 3.7, 1.3, 3.0, 1.6, fmt(m.fatherhoodGap.blackChildrenSingleParent.value), "Children · single-parent HH", m.fatherhoodGap.blackChildrenSingleParent);
    statTile(s, 6.9, 1.3, 3.0, 1.6, fmt(m.fatherhoodGap.disconnectedBlackYouth.value), "Disconnected youth 16–24", m.fatherhoodGap.disconnectedBlackYouth);
    statTile(s, 10.1, 1.3, 2.8, 1.6, fmt(m.fatherhoodGap.mentorGap.value), "Mentor gap", m.fatherhoodGap.mentorGap);
    s.addText(
      m.chainedStory.map((t) => ({ text: t, options: { bullet: { code: "25A0" }, fontSize: 12, color: COLORS.ink, paraSpaceAfter: 6, breakLine: true } })),
      { x: 0.5, y: 3.2, w: W - 1, h: 3.4, fontFace: "Calibri", valign: "top" }
    );
    footer(s, `${m.metro.name} · chained story`);
  }
}

// Comparison divider
divider("PART C · SYMMETRY · ALIGNMENT · DIFFERENCES", "Two metros, one corridor, one playbook.");

// Symmetry
{
  const s = pptx.addSlide(); s.background = { color: COLORS.cream };
  header(s, "Symmetry — what the data confirms is identical");
  s.addText(
    story.comparison.symmetry.map((t) => ({ text: t, options: { bullet: { code: "25A0" }, fontSize: 14, color: COLORS.ink, paraSpaceAfter: 8, breakLine: true } })),
    { x: 0.6, y: 1.2, w: W - 1.2, h: H - 1.7, fontFace: "Calibri", valign: "top" }
  );
  footer(s, "Comparison · Symmetry");
}

// Numeric symmetry table
{
  const s = pptx.addSlide(); s.background = { color: COLORS.cream };
  header(s, "Numeric symmetry — does the data actually mirror?");
  const headers = ["Metric", "Waco / McLennan", "Austin / Travis", "Δ %"];
  const rows = Object.entries(story.comparison.numericSymmetry).map(([k, v]) => [
    k, v.waco != null ? v.waco.toFixed(1) : "—", v.austin != null ? v.austin.toFixed(1) : "—", v.deltaPct != null ? v.deltaPct.toFixed(0) + "%" : "—"
  ]);
  const td = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 14 } })),
    ...rows.map(r => r.map((c, j) => ({ text: c, options: { fontSize: 13, color: COLORS.ink, fill: { color: "FFFFFF" }, align: j === 0 ? "left" : "center", bold: j === 0 } })))
  ];
  s.addTable(td, { x: 0.5, y: 1.3, w: 12.3, colW: [3.5, 3, 3, 2.8], rowH: 0.6, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  s.addText("Δ within ±15% = strong symmetry; outside = local divergence requiring metro-specific strategy.", {
    x: 0.5, y: 5.5, w: 12.3, h: 0.5, fontSize: 11, italic: true, color: COLORS.gray, fontFace: "Calibri", align: "center"
  });
  footer(s, "Comparison · Numeric");
}

// Alignment
{
  const s = pptx.addSlide(); s.background = { color: COLORS.cream };
  header(s, "Alignment — where the two ecosystems already meet");
  const headers = ["Layer", "Waco partner", "Austin partner", "Shared rail"];
  const rows = story.comparison.alignment.map((a) => [a.layer, a.waco, a.austin, a.rail]);
  const td = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 13 } })),
    ...rows.map(r => r.map((c, j) => ({ text: c, options: { fontSize: 11.5, color: COLORS.ink, fill: { color: "FFFFFF" }, align: "left", bold: j === 0 } })))
  ];
  s.addTable(td, { x: 0.4, y: 1.3, w: 12.5, colW: [2.4, 2.7, 3.4, 4], rowH: 0.55, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  footer(s, "Comparison · Alignment");
}

// Differences
{
  const s = pptx.addSlide(); s.background = { color: COLORS.cream };
  header(s, "Differences — what makes each metro unique");
  s.addText(
    story.comparison.differences.map((t) => ({ text: t, options: { bullet: { code: "25A0" }, fontSize: 13, color: COLORS.ink, paraSpaceAfter: 7, breakLine: true } })),
    { x: 0.6, y: 1.2, w: W - 1.2, h: H - 1.7, fontFace: "Calibri", valign: "top" }
  );
  footer(s, "Comparison · Differences");
}

// Grant pipeline
{
  const s = pptx.addSlide(); s.background = { color: COLORS.cream };
  header(s, `Live grant pipeline · ${story.grantPipeline.length} corridor-relevant opportunities`, "From the platform's grant tracker — refreshed automatically.");
  if (story.grantPipeline.length === 0) {
    s.addText("No grants currently matched corridor keywords. Run grants discovery in the Grants module to populate.", {
      x: 0.6, y: 3, w: W - 1.2, h: 1, fontSize: 14, italic: true, color: COLORS.gray, align: "center", fontFace: "Calibri"
    });
  } else {
    const top = story.grantPipeline.slice(0, 10);
    const headers = ["Title", "Funder", "Amount", "Deadline", "Fit"];
    const rows = top.map(g => [
      (g.title ?? "—").slice(0, 90),
      g.funder ?? "—",
      g.amount ?? "—",
      g.deadline ? new Date(g.deadline).toLocaleDateString() : "—",
      g.fitScore != null ? String(g.fitScore) : "—"
    ]);
    const td = [
      headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 12 } })),
      ...rows.map(r => r.map((c, j) => ({ text: c, options: { fontSize: 10, color: COLORS.ink, fill: { color: "FFFFFF" }, align: j === 0 ? "left" : "center" } })))
    ];
    s.addTable(td, { x: 0.3, y: 1.3, w: 12.7, colW: [5.2, 3, 1.7, 1.5, 1.3], rowH: 0.4, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  }
  footer(s, "Funding pipeline");
}

// Sources
{
  const s = pptx.addSlide(); s.background = { color: COLORS.cream };
  header(s, "Data sources powering this brief", "All public, all primary, all linked.");
  s.addText(
    story.sources.map((src) => ({
      text: `${src.name} — ${src.role}\n${src.url}\n`,
      options: { bullet: { code: "25A0" }, fontSize: 11, color: COLORS.ink, paraSpaceAfter: 4, breakLine: true }
    })),
    { x: 0.6, y: 1.2, w: W - 1.2, h: H - 1.7, fontFace: "Calibri", valign: "top" }
  );
  footer(s, "Sources");
}

// Closing
{
  const s = pptx.addSlide();
  s.background = { color: COLORS.navy };
  s.addShape("rect", { x: 0, y: 5.6, w: W, h: 0.06, fill: { color: COLORS.gold }, line: { color: COLORS.gold } });
  s.addText("The math is alarming. The mechanics are knowable.\nThe partners are present. The platform is built.", {
    x: 0.5, y: 1.6, w: W - 1, h: 1.6, fontSize: 28, color: "FFFFFF", italic: true, align: "center", fontFace: "Calibri"
  });
  s.addText("Stitch the corridor. Close the gap.", {
    x: 0.5, y: 3.5, w: W - 1, h: 0.8, fontSize: 24, color: COLORS.gold, bold: true, align: "center", fontFace: "Calibri"
  });
  s.addText(`TCAF · ${new Date(story.generatedAt).toISOString().slice(0,10)} · /corridor`, {
    x: 0.5, y: 5.9, w: W - 1, h: 0.6, fontSize: 13, color: "FFFFFF", align: "center", fontFace: "Calibri"
  });
}

/* ---------------- DOCX ---------------- */
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, color: opts.color, size: opts.size ? opts.size * 2 : undefined })],
    heading: opts.heading, alignment: opts.align,
    spacing: { after: opts.spaceAfter ?? 120, before: opts.spaceBefore ?? 0 }
  });
}
function bullet(text, level = 0) {
  return new Paragraph({ children: [new TextRun({ text })], bullet: { level }, spacing: { after: 80 } });
}
function tbl(headers, rows) {
  return new Table({
    rows: [
      new TableRow({ children: headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })] })], shading: { fill: COLORS.navy } })) }),
      ...rows.map(r => new TableRow({ children: r.map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(c) })] })] })) }))
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}
function metroSection(metroKey, m) {
  const out = [
    p(`Part · ${m.metro.name}`, { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
    p(`Pattern: ${m.metro.character} · Focus ZIP: ${m.metro.focusZip} · District(s): ${m.metro.district}`, { italic: true, color: "555555" }),
    p(`Data as of: ${m.dataFreshness.asOfDate ?? "—"}  ·  Sources: ${m.dataFreshness.dataSources ?? "—"}`, { color: "777777", spaceAfter: 200 }),
    p("Verified county baseline", { heading: HeadingLevel.HEADING_2 }),
    tbl(["Metric", "Value", "Source", "As of", "Confidence"], [
      ["Total population", fmt(m.counts.totalPopulation.value), m.counts.totalPopulation.source, m.counts.totalPopulation.asOfDate ?? "—", m.counts.totalPopulation.confidence],
      ["Poverty rate (%)", m.counts.povertyRate.value != null ? m.counts.povertyRate.value.toFixed(1) : "—", m.counts.povertyRate.source, m.counts.povertyRate.asOfDate ?? "—", m.counts.povertyRate.confidence],
      ["Median income", m.counts.medianIncome.value ? `$${m.counts.medianIncome.value.toLocaleString()}` : "—", m.counts.medianIncome.source, m.counts.medianIncome.asOfDate ?? "—", m.counts.medianIncome.confidence],
      ["Unemployment (%)", m.counts.unemployment.value != null ? m.counts.unemployment.value.toFixed(1) : "—", m.counts.unemployment.source, m.counts.unemployment.asOfDate ?? "—", m.counts.unemployment.confidence],
      ["SVI percentile", m.counts.svi.value != null ? m.counts.svi.value.toFixed(0) : "—", m.counts.svi.source, m.counts.svi.asOfDate ?? "—", m.counts.svi.confidence],
      ["Health burden composite", m.counts.healthBurden.value != null ? m.counts.healthBurden.value.toFixed(2) : "—", m.counts.healthBurden.source, m.counts.healthBurden.asOfDate ?? "—", m.counts.healthBurden.confidence],
      ["Food desert flag", m.counts.foodAccess.value != null ? (m.counts.foodAccess.value > 0.5 ? "YES" : "no") : "—", m.counts.foodAccess.source, m.counts.foodAccess.asOfDate ?? "—", m.counts.foodAccess.confidence],
    ]),
    p(""),
    p("Modeled fatherhood-gap math", { heading: HeadingLevel.HEADING_2 }),
    tbl(["Metric", "Value", "Methodology", "Confidence"], [
      ["Black population (modeled)", fmt(m.fatherhoodGap.blackPopulation.value), m.fatherhoodGap.blackPopulation.methodology ?? "—", m.fatherhoodGap.blackPopulation.confidence],
      ["Children · single-parent HH", fmt(m.fatherhoodGap.blackChildrenSingleParent.value), m.fatherhoodGap.blackChildrenSingleParent.methodology ?? "—", m.fatherhoodGap.blackChildrenSingleParent.confidence],
      ["Disconnected youth 16–24", fmt(m.fatherhoodGap.disconnectedBlackYouth.value), m.fatherhoodGap.disconnectedBlackYouth.methodology ?? "—", m.fatherhoodGap.disconnectedBlackYouth.confidence],
      ["Mentor gap", fmt(m.fatherhoodGap.mentorGap.value), m.fatherhoodGap.mentorGap.methodology ?? "—", m.fatherhoodGap.mentorGap.confidence],
    ]),
    p(""),
    p("Chained story", { heading: HeadingLevel.HEADING_2 }),
    ...m.chainedStory.map(t => bullet(t)),
    p(""),
    p(`ZIP-level intelligence (${m.zipDetail.length} ZIPs on file)`, { heading: HeadingLevel.HEADING_2 }),
    ...(m.zipDetail.length ? m.zipDetail.map(z => bullet(`${z.zip} · ${z.neighborhood ?? ""} · pop ${z.population ?? "—"} · poverty ${z.povertyRate ?? "—"}% · juvenile ${z.juvenileOffenseRate ?? "—"} · hotspot ${z.hotspotLevel}`)) : [bullet("No ZIP rows seeded for these anchors yet — refresh the data sources to populate.")]),
    p(""),
    p(`Community partners on file: ${m.partners.length}`, { heading: HeadingLevel.HEADING_2 }),
    ...(m.partners.length ? m.partners.slice(0, 12).map(pt => bullet(`${pt.name} · ${pt.type} · ${pt.city ?? ""} ${pt.state ?? ""} ${pt.zip ?? ""} · MOU ${pt.mou ?? "none"}`)) : [bullet("No partners matched — load community_partners table.")]),
  ];
  return out;
}

const doc = new Document({
  creator: "TCAF",
  title: "I-35 Corridor Intelligence Brief",
  description: "Live, sourced, integrated story across Waco/McLennan and Austin/Travis",
  sections: [{
    children: [
      p("THE I-35 CORRIDOR INTELLIGENCE BRIEF", { heading: HeadingLevel.TITLE, align: AlignmentType.CENTER }),
      p(story.narrative.headline, { heading: HeadingLevel.HEADING_2, align: AlignmentType.CENTER, italic: true }),
      p(`Synthesized live from /api/corridor/story · generated ${new Date(story.generatedAt).toLocaleString()}`, { align: AlignmentType.CENTER, color: "777777", spaceAfter: 400 }),

      p("Executive narrative — the single story", { heading: HeadingLevel.HEADING_1 }),
      ...story.narrative.arc.flatMap(b => [
        p(b.beat, { heading: HeadingLevel.HEADING_2 }),
        p(b.text),
      ]),

      ...metroSection("waco", story.metros.waco),
      ...metroSection("austin", story.metros.austin),

      p("Part C · Symmetry, Alignment, Differences", { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      p("Symmetry", { heading: HeadingLevel.HEADING_2 }),
      ...story.comparison.symmetry.map(t => bullet(t)),
      p("Numeric symmetry — does the data mirror?", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Metric", "Waco / McLennan", "Austin / Travis", "Δ %"],
        Object.entries(story.comparison.numericSymmetry).map(([k, v]) => [
          k, v.waco != null ? v.waco.toFixed(1) : "—", v.austin != null ? v.austin.toFixed(1) : "—", v.deltaPct != null ? v.deltaPct.toFixed(0) + "%" : "—"
        ])
      ),
      p(""),
      p("Alignment — where the two ecosystems meet", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Layer", "Waco", "Austin", "Shared rail"], story.comparison.alignment.map(a => [a.layer, a.waco, a.austin, a.rail])),
      p(""),
      p("Differences — what makes each metro unique", { heading: HeadingLevel.HEADING_2 }),
      ...story.comparison.differences.map(t => bullet(t)),

      p(`Live grant pipeline (${story.grantPipeline.length} corridor-relevant)`, { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      ...(story.grantPipeline.length
        ? [tbl(["Title", "Funder", "Amount", "Deadline", "Fit"],
            story.grantPipeline.slice(0, 20).map(g => [
              (g.title ?? "—").slice(0, 100),
              g.funder ?? "—",
              g.amount ?? "—",
              g.deadline ? new Date(g.deadline).toLocaleDateString() : "—",
              g.fitScore != null ? String(g.fitScore) : "—"
            ]))]
        : [p("No grants currently matched. Run grants discovery to populate.")]),
      p(""),
      p("Data sources", { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      ...story.sources.map(s => bullet(`${s.name} — ${s.role} — ${s.url}`)),

      p(""),
      p("Stitch the corridor. Close the gap.", { heading: HeadingLevel.HEADING_2, align: AlignmentType.CENTER, italic: true, spaceBefore: 400 }),
      p(`TCAF · ThriveUp Community Academy · ${new Date(story.generatedAt).toISOString().slice(0,10)}`, { align: AlignmentType.CENTER, color: "777777" }),
    ]
  }]
});

const PPT = `${OUT}/Corridor-Intelligence-Brief-v1.pptx`;
const DOC = `${OUT}/Corridor-Intelligence-Brief-v1.docx`;
await pptx.writeFile({ fileName: PPT });
fs.writeFileSync(DOC, await Packer.toBuffer(doc));
console.log("WROTE:", PPT, fs.statSync(PPT).size);
console.log("WROTE:", DOC, fs.statSync(DOC).size);
