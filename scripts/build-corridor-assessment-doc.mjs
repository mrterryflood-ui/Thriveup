import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun,
  Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle,
  PageOrientation, Footer, PageNumber,
} from "docx";

const OUT_DIR = "attached_assets/decks";
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const NAVY = "1F3A5F";
const ACCENT = "B8862E";
const GREY = "5A5A5A";
const LIGHT = "F2F2F2";
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const CB = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const fmtNum = (n, unit = "") => {
  if (n === null || n === undefined || Number.isNaN(n)) return "Not yet verified";
  const v = typeof n === "number" ? n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 }) : String(n);
  return unit ? `${v} ${unit}` : v;
};
const fmtClaim = (c) => {
  if (!c) return "—";
  if (c.value === null || c.value === undefined) return `Not yet verified (source: ${c.source || "n/a"})`;
  const unit = c.unit && c.unit !== "people" && !c.unit.startsWith("USD") ? ` ${c.unit}` : "";
  let v = c.value;
  if (typeof v === "number") {
    if (c.unit === "USD") v = `$${v.toLocaleString("en-US")}`;
    else v = v.toLocaleString("en-US", { maximumFractionDigits: c.unit === "%" ? 1 : 0 });
  }
  return `${v}${unit}`;
};
const conf = (c) => c?.confidence ? ` (${c.confidence})` : "";

// ---------- doc helpers ----------
const P = (text, opts = {}) => new Paragraph({
  spacing: { before: opts.before ?? 60, after: opts.after ?? 60 },
  alignment: opts.align,
  children: opts.children || [new TextRun({ text, bold: opts.bold, italics: opts.italics, color: opts.color, size: opts.size ?? 22 })],
});
const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
  spacing: { before: 280, after: 160 },
  children: [new TextRun({ text, bold: true, color: NAVY, size: 36 })],
});
const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 320, after: 120 },
  children: [new TextRun({ text, bold: true, color: NAVY, size: 28 })],
});
const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 220, after: 80 },
  children: [new TextRun({ text, bold: true, color: NAVY, size: 24 })],
});
const Bullet = (text, bold = false) => new Paragraph({
  bullet: { level: 0 }, spacing: { before: 30, after: 30 },
  children: [new TextRun({ text, bold, size: 22 })],
});
const Cell = (content, opts = {}) => {
  const runs = Array.isArray(content) ? content : [new TextRun({
    text: String(content), bold: opts.bold, color: opts.color, size: opts.size ?? 20,
  })];
  return new TableCell({
    borders: CB, width: opts.width,
    shading: opts.fill ? { fill: opts.fill } : undefined,
    children: [new Paragraph({ spacing: { before: 30, after: 30 }, alignment: opts.align, children: runs })],
  });
};
const HeaderCell = (t, w) => Cell(t, { bold: true, color: "FFFFFF", fill: NAVY, width: w });
const buildTable = (headers, rows) => {
  const cols = headers.length;
  const colWidth = Math.floor(9000 / cols);
  const wSpec = { size: colWidth, type: WidthType.DXA };
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map(h => HeaderCell(h, wSpec)) }),
      ...rows.map((r, i) => new TableRow({
        children: r.map(c => Cell(c, { width: wSpec, fill: i % 2 === 1 ? LIGHT : undefined })),
      })),
    ],
  });
};

// ---------- builders ----------
function buildCoverAndNarrative(story) {
  const out = [];
  out.push(H1("The Interstate 35 Corridor"));
  out.push(P("Black-Youth Fatherhood & Mentorship Gap Assessment", { align: AlignmentType.CENTER, bold: true, color: NAVY, size: 28 }));
  out.push(P("Waco / McLennan County  ↔  Austin / Travis County", { align: AlignmentType.CENTER, color: GREY, italics: true, size: 24 }));
  out.push(P(`Generated ${new Date(story.generatedAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} from live verified data`, { align: AlignmentType.CENTER, color: GREY, italics: true, size: 20 }));
  out.push(P(""));
  out.push(P("Prepared by ThriveUp & The Collaborative Advocate Foundation (TCAF)", { align: AlignmentType.CENTER, color: GREY, size: 20 }));
  out.push(P(""));

  out.push(H2("How to read this assessment"));
  out.push(P("This document compares two Texas metropolitan areas — Waco / McLennan County and Austin / Travis County — that sit on the same 90-mile stretch of Interstate 35 and share the same gap in mentorship, fatherhood support, and opportunity for Black children and youth. Every number that appears here is either pulled directly from a federal or state data source (marked verified) or calculated from a verified base using a published methodology (marked estimated). Acronyms are spelled out the first time they appear, and a glossary of every source is provided at the end."));
  out.push(P(""));

  out.push(H2("Headline finding"));
  out.push(P(story.narrative.headline, { bold: true, size: 24, color: NAVY }));
  out.push(P(""));

  out.push(H2("The story in six beats"));
  for (const beat of story.narrative.arc) {
    out.push(H3(beat.beat));
    out.push(P(beat.text));
  }
  return out;
}

function buildComparison(story) {
  const out = [];
  out.push(H2("How the two cities mirror each other"));
  out.push(P("These are the patterns that show up the same in both metros — the reason the corridor must be addressed as one system, not two separate cities."));
  for (const s of story.comparison.symmetry || []) out.push(Bullet(s));

  out.push(H3("Where they differ"));
  out.push(P("The differences matter for how the work is delivered in each city, even though the underlying need is the same."));
  for (const s of story.comparison.differences || []) out.push(Bullet(s));

  if (Array.isArray(story.comparison.alignment) && story.comparison.alignment.length) {
    out.push(H3("Partner alignment by layer"));
    out.push(P("Where each city's existing partner sits on the same coordinated rail."));
    out.push(buildTable(
      ["Layer", "Waco partner", "Austin partner", "Shared corridor rail"],
      story.comparison.alignment.map(a => [a.layer, a.waco, a.austin, a.rail || ""]),
    ));
  }
  return out;
}

function buildMetroSection(metro) {
  const out = [];
  const m = metro.metro;
  out.push(H2(`Deep dive — ${m.name}`));
  out.push(P(`School district(s): ${m.district}`, { color: GREY, italics: true }));
  out.push(P(`Anchor ZIP codes: ${(m.anchorZips || []).join(", ")} (focus ZIP: ${m.focusZip})`, { color: GREY, italics: true }));
  out.push(P(`Geographic character: ${m.character} — ${m.character === "concentrated" ? "the Black community is concentrated in a smaller set of ZIP codes" : "the Black community is dispersed across many ZIP codes"}.`, { color: GREY, italics: true }));
  out.push(P(""));

  // Counts table
  out.push(H3("Population & community-condition baseline"));
  const c = metro.counts;
  out.push(buildTable(
    ["Measure", "Value", "Source / confidence"],
    [
      ["Total county population", fmtClaim(c.totalPopulation), `${c.totalPopulation?.source || ""}${conf(c.totalPopulation)}`],
      ["Poverty rate", fmtClaim(c.povertyRate), `${c.povertyRate?.source || ""}${conf(c.povertyRate)}`],
      ["Median household income", fmtClaim(c.medianIncome), `${c.medianIncome?.source || ""}${conf(c.medianIncome)}`],
      ["Health-burden composite", fmtClaim(c.healthBurden), `${c.healthBurden?.source || ""}${conf(c.healthBurden)}`],
      ["Unemployment rate", fmtClaim(c.unemployment), `${c.unemployment?.source || ""}${conf(c.unemployment)}`],
      ["Food access (federal Food Access Research Atlas)", fmtClaim(c.foodAccess), `${c.foodAccess?.source || ""}${conf(c.foodAccess)}`],
      ["Social Vulnerability Index percentile", fmtClaim(c.svi), `${c.svi?.source || ""}${conf(c.svi)}`],
    ],
  ));

  // Fatherhood gap
  const f = metro.fatherhoodGap;
  if (f) {
    out.push(H3("The fatherhood and mentorship gap (verified Census + derived)"));
    out.push(P("These numbers are the foundation of the corridor case. Each one cites the specific U.S. Census American Community Survey table, the year, and (where applicable) the percentage applied to derive the estimate."));
    out.push(buildTable(
      ["Measure", "Value", "How it was derived"],
      [
        ["Black population (county)", fmtClaim(f.blackPopulation), f.blackPopulation?.methodology || f.blackPopulation?.source || ""],
        ["Black children in single-parent households", fmtClaim(f.blackChildrenSingleParent), f.blackChildrenSingleParent?.methodology || ""],
        ["Disconnected Black youth (ages 16–24, not in work or school)", fmtClaim(f.disconnectedBlackYouth), f.disconnectedBlackYouth?.methodology || ""],
        ["Black-male mentors needed (mentor gap)", fmtClaim(f.mentorGap), f.mentorGap?.methodology || ""],
        ["Black-student discipline rate (district)", fmtClaim(f.blackStudentDisciplineRate), `${f.blackStudentDisciplineRate?.source || ""}${conf(f.blackStudentDisciplineRate)}`],
        ["Big Brothers Big Sisters Black-boy waitlist", fmtClaim(f.bbbsWaitlist), f.bbbsWaitlist?.source || "Pending direct chapter confirmation"],
      ],
    ));
  }

  // Risk factors
  if (Array.isArray(metro.riskFactors) && metro.riskFactors.length) {
    out.push(H3("Risk factors"));
    for (const r of metro.riskFactors) {
      out.push(Bullet(`${r.label || r.name || r.id}: ${r.value !== undefined ? r.value : ""} ${r.unit || ""} ${r.note ? "— " + r.note : ""}`.trim()));
    }
  }
  if (metro.riskIndex) {
    out.push(P(`Composite risk index: ${fmtClaim(metro.riskIndex)}`, { italics: true, color: GREY }));
  }

  // Protective factors
  if (Array.isArray(metro.protectiveFactors) && metro.protectiveFactors.length) {
    out.push(H3("Protective factors (existing strengths)"));
    for (const r of metro.protectiveFactors) {
      out.push(Bullet(`${r.label || r.name || r.id}: ${r.value !== undefined ? r.value : ""} ${r.unit || ""} ${r.note ? "— " + r.note : ""}`.trim()));
    }
  }

  // Crime profile
  if (metro.crimeProfile) {
    out.push(H3("Public-safety profile"));
    const cp = metro.crimeProfile;
    const rows = Object.entries(cp).map(([k, v]) => [k, typeof v === "object" ? fmtClaim(v) : String(v ?? "—")]);
    if (rows.length) out.push(buildTable(["Indicator", "Value"], rows));
  }

  // Root causes
  if (Array.isArray(metro.rootCauses) && metro.rootCauses.length) {
    out.push(H3("Root causes (what drives the gap)"));
    for (const rc of metro.rootCauses) {
      out.push(Bullet(`${rc.title || rc.label || rc.cause || rc.name}: ${rc.description || rc.detail || rc.text || ""}`.trim(), true));
    }
  }

  // Recommended solutions
  if (Array.isArray(metro.recommendedSolutions) && metro.recommendedSolutions.length) {
    out.push(H3("Recommended solutions"));
    for (const s of metro.recommendedSolutions) {
      const title = s.title || s.label || s.name || "";
      const desc = s.description || s.detail || s.text || "";
      out.push(Bullet(`${title}${title && desc ? ": " : ""}${desc}`, !!title));
    }
  }

  // Community resources
  if (Array.isArray(metro.communityResources) && metro.communityResources.length) {
    out.push(H3("Community resources currently active"));
    out.push(buildTable(
      ["Resource", "Type", "Notes"],
      metro.communityResources.map(r => [r.name || r.label || "", r.type || r.category || "", r.note || r.description || r.url || ""]),
    ));
  }

  // ZIP detail
  if (Array.isArray(metro.zipDetail) && metro.zipDetail.length) {
    out.push(H3("ZIP-code-level detail"));
    out.push(buildTable(
      ["ZIP", "Population", "Black share", "Notes"],
      metro.zipDetail.map(z => [
        String(z.zip || ""),
        z.population !== undefined ? fmtNum(z.population) : "—",
        z.blackShare !== undefined ? `${z.blackShare}%` : "—",
        z.note || z.description || "",
      ]),
    ));
  }

  // Partners
  if (Array.isArray(metro.partners) && metro.partners.length) {
    out.push(H3("Partner organizations at the table"));
    out.push(buildTable(
      ["Organization", "Role", "Notes"],
      metro.partners.map(p => [p.name || "", p.role || p.layer || "", p.note || p.description || p.url || ""]),
    ));
  }

  // Chained story
  if (Array.isArray(metro.chainedStory) && metro.chainedStory.length) {
    out.push(H3("Chain-of-evidence story for this metro"));
    out.push(P("Each step below depends on the verified data step before it — no link in the chain is unsupported."));
    for (const s of metro.chainedStory) out.push(Bullet(s));
  }
  return out;
}

function buildChainWeb(story) {
  const out = [];
  if (!story.chainWeb?.steps?.length) return out;
  out.push(H2("Chain-of-evidence framework"));
  out.push(P("Every claim in this assessment can be traced through the chain below. Each step depends only on the steps above it, so a reviewer can audit the data path from raw federal source to final claim."));
  out.push(buildTable(
    ["#", "Step", "Source", "Depends on"],
    story.chainWeb.steps.map((s, i) => [
      String(i + 1),
      `${s.label}\n(id: ${s.id})`,
      s.source || "",
      Array.isArray(s.dependsOn) && s.dependsOn.length ? s.dependsOn.join(", ") : "(root)",
    ]),
  ));
  return out;
}

function buildSources(story) {
  const out = [];
  if (!Array.isArray(story.sources) || !story.sources.length) return out;
  out.push(H2("Data sources cited"));
  out.push(buildTable(
    ["Source", "Role in this assessment", "URL"],
    story.sources.map(s => [s.name || s.id, s.role || s.description || "", s.url || ""]),
  ));
  return out;
}

function buildGlossary() {
  const out = [];
  out.push(H2("Glossary of terms and acronyms"));
  out.push(buildTable(
    ["Term", "Stands for / definition"],
    [
      ["ACS", "American Community Survey — annual U.S. Census Bureau survey that produces the population, income, and household data used throughout this brief"],
      ["AISD", "Austin Independent School District"],
      ["BBBS", "Big Brothers Big Sisters — the parent mentor-matching organization (BBBS West Central Texas in Waco, BBBS Lone Star in Austin)"],
      ["AAUL", "Austin Area Urban League"],
      ["100 BMCT", "100 Black Men of Central Texas"],
      ["CDC PLACES", "Centers for Disease Control and Prevention's PLACES dataset — local health-burden estimates"],
      ["Disconnected youth", "Young people aged 16–24 who are neither in school nor working — a federally tracked indicator"],
      ["Fatherhood gap", "The estimated number of Black children in a county who are growing up in a single-parent household"],
      ["FIPS code", "Federal Information Processing Standard county code (48309 = McLennan County, 48453 = Travis County)"],
      ["HHSC", "Texas Health and Human Services Commission"],
      ["LAUS", "Local Area Unemployment Statistics — U.S. Bureau of Labor Statistics dataset"],
      ["Mentor gap", "The estimated number of Black-male mentors needed to meet the demand from single-parent Black households (calculated as black-children-in-single-parent-households × 22% active mentor demand)"],
      ["MISD / DVISD / PfISD", "Manor / Del Valle / Pflugerville Independent School Districts (suburban Austin districts)"],
      ["SDOH", "Social Determinants of Health — non-medical conditions (housing, income, education, food access) that shape health outcomes"],
      ["SVI", "Social Vulnerability Index — Centers for Disease Control measure of how vulnerable a community is to disasters and chronic stress; reported as a percentile (higher = more vulnerable)"],
      ["TAPR", "Texas Academic Performance Report — annual public report from the Texas Education Agency that includes district-level student-discipline data"],
      ["TCAF", "The Collaborative Advocate Foundation"],
      ["TEA", "Texas Education Agency"],
      ["TJJD", "Texas Juvenile Justice Department"],
      ["TWC", "Texas Workforce Commission"],
      ["USDA Food Access Research Atlas", "U.S. Department of Agriculture dataset that flags whether a census tract qualifies as a food desert"],
    ],
  ));
  return out;
}

// ---------- main ----------
const res = await fetch("http://localhost:5000/api/corridor/story");
if (!res.ok) {
  console.error("Failed to fetch corridor story:", res.status);
  process.exit(1);
}
const story = await res.json();
const metros = Object.values(story.metros || {});

const children = [
  ...buildCoverAndNarrative(story),
  ...buildComparison(story),
  ...metros.flatMap(buildMetroSection),
  ...buildChainWeb(story),
  ...buildSources(story),
  ...buildGlossary(),
  P(""),
  P("This assessment is generated from live, audit-traceable data. Numbers may update as federal and state sources refresh.", { align: AlignmentType.CENTER, italics: true, color: GREY, size: 18 }),
  P("Prepared by ThriveUp & The Collaborative Advocate Foundation — thrivingcommunitiesforall.com", { align: AlignmentType.CENTER, italics: true, color: GREY, size: 18 }),
];

const doc = new Document({
  creator: "ThriveUp / TCAF",
  title: "I-35 Corridor Black-Youth Fatherhood & Mentorship Gap Assessment",
  description: "Plain-language Waco↔Austin corridor assessment with verified data lineage",
  styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
  sections: [{
    properties: { page: { size: { orientation: PageOrientation.PORTRAIT } } },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "I-35 Corridor Assessment — Page ", color: GREY, size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 18 }),
            new TextRun({ text: " of ", color: GREY, size: 18 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GREY, size: 18 }),
          ],
        })],
      }),
    },
    children,
  }],
});

const buf = await Packer.toBuffer(doc);
const outPath = path.join(OUT_DIR, "I35-Corridor-Black-Youth-Assessment-v2.docx");
writeFileSync(outPath, buf);
console.log(`✔ ${outPath}  (${(buf.length / 1024).toFixed(1)} KB)`);
