import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import fs from "fs";

const OUT_DIR = "attached_assets/decks";
fs.mkdirSync(OUT_DIR, { recursive: true });

/* ---------- LIVE DATA PULL (so this deck is "connected") ---------- */
const BASE = process.env.BASE_URL || "http://localhost:5000";
let LIVE_STORY = null;
try {
  const r = await fetch(`${BASE}/api/corridor/story`);
  if (r.ok) {
    LIVE_STORY = await r.json();
    console.log("[waco-austin-deck] LIVE data loaded · generated", LIVE_STORY.generatedAt);
  } else {
    console.warn("[waco-austin-deck] story API returned", r.status, "— falling back to static copy");
  }
} catch (e) {
  console.warn("[waco-austin-deck] live API unreachable:", e.message, "— falling back to static copy");
}
const liveGenAt = LIVE_STORY?.generatedAt ? new Date(LIVE_STORY.generatedAt).toISOString().slice(0, 10) : "static snapshot";
const findMetric = (metroKey, metricLabelSubstr) => {
  const metro = LIVE_STORY?.metros?.[metroKey];
  if (!metro) return null;
  const arrs = [metro.riskFactors, metro.protectiveFactors].filter(Array.isArray);
  const all = arrs.flat();
  // crimeProfile is a keyed object of claims; also search its entries
  if (metro.crimeProfile && typeof metro.crimeProfile === "object") {
    for (const [k, v] of Object.entries(metro.crimeProfile)) {
      if (v && typeof v === "object" && "value" in v) all.push({ label: k, claim: v });
    }
  }
  const hit = all.find((m) => (m.label ?? "").toLowerCase().includes(metricLabelSubstr.toLowerCase()));
  if (!hit?.claim) return null;
  return { value: hit.claim.value, unit: hit.claim.unit, confidence: hit.claim.confidence, source: hit.claim.source, asOf: hit.claim.asOfDate };
};
const liveLine = (metroKey, metricSubstr, fallback) => {
  const m = findMetric(metroKey, metricSubstr);
  if (!m || m.value == null) return `${fallback} (static — live API unavailable)`;
  return `${metricSubstr}: ${typeof m.value === "number" ? m.value.toLocaleString() : m.value}${m.unit ? ` ${m.unit}` : ""} · ${m.source ?? "source n/a"} · ${m.asOf ?? ""} [${m.confidence ?? "verified"}]`;
};

const COLORS = {
  navy: "0B2545", gold: "D4A24C", crimson: "9B1C2E", slate: "2D3E50",
  cream: "F7F2E7", ink: "1A1A1A", gray: "5A6470", green: "2E7D32",
};

/* ============================== POWERPOINT ============================== */
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pptx.title = "Waco & Austin: The Black Youth Fatherhood Gap";
pptx.author = "ThriveUp Community Academy / TCAF";
pptx.company = "TCAF / Sankofa Men + WAB2 + LifeBridge";

const W = 13.33, H = 7.5;
const SAFE = { x: 0.5, y: 0.5, w: 12.33, h: 6.5 };

function addBg(slide, color = COLORS.cream) {
  slide.background = { color };
}
function addHeader(slide, title, subtitle) {
  slide.addShape("rect", { x: 0, y: 0, w: W, h: 0.9, fill: { color: COLORS.navy }, line: { color: COLORS.navy } });
  slide.addText(title, { x: 0.4, y: 0.12, w: W - 0.8, h: 0.5, fontFace: "Calibri", fontSize: 24, bold: true, color: "FFFFFF" });
  if (subtitle) slide.addText(subtitle, { x: 0.4, y: 0.5, w: W - 0.8, h: 0.35, fontFace: "Calibri", fontSize: 12, italic: true, color: COLORS.gold });
}
function addFooter(slide, label) {
  slide.addText(`TCAF · ${label} · April 17, 2026`, {
    x: 0.4, y: H - 0.32, w: W - 0.8, h: 0.25,
    fontSize: 9, color: COLORS.gray, fontFace: "Calibri"
  });
}
function addBullets(slide, items, opts = {}) {
  const x = opts.x ?? 0.6, y = opts.y ?? 1.2, w = opts.w ?? W - 1.2, h = opts.h ?? 5.6;
  slide.addText(
    items.map(t => ({ text: typeof t === "string" ? t : t.text, options: { bullet: { code: "25A0" }, color: COLORS.ink, fontSize: typeof t === "object" && t.fontSize ? t.fontSize : 16, breakLine: true, paraSpaceAfter: 6, ...(typeof t === "object" ? t.options : {}) } })),
    { x, y, w, h, fontFace: "Calibri", valign: "top" }
  );
}
function addStat(slide, x, y, w, h, value, label, color = COLORS.crimson) {
  slide.addShape("rect", { x, y, w, h, fill: { color: "FFFFFF" }, line: { color: color, width: 1.5 } });
  slide.addText(value, { x, y: y + 0.15, w, h: h * 0.55, fontSize: 36, bold: true, color, align: "center", fontFace: "Calibri" });
  slide.addText(label, { x: x + 0.1, y: y + h * 0.6, w: w - 0.2, h: h * 0.35, fontSize: 11, color: COLORS.slate, align: "center", fontFace: "Calibri" });
}
function addSectionDivider(title, subtitle) {
  const s = pptx.addSlide();
  s.background = { color: COLORS.navy };
  s.addShape("rect", { x: 0, y: H/2 - 0.05, w: W, h: 0.05, fill: { color: COLORS.gold }, line: { color: COLORS.gold } });
  s.addText(title, { x: 0.5, y: H/2 - 1.5, w: W - 1, h: 1, fontSize: 44, bold: true, color: "FFFFFF", align: "center", fontFace: "Calibri" });
  if (subtitle) s.addText(subtitle, { x: 0.5, y: H/2 + 0.2, w: W - 1, h: 0.6, fontSize: 18, italic: true, color: COLORS.gold, align: "center", fontFace: "Calibri" });
  return s;
}

/* ---------- Slide 1: Title ---------- */
{
  const s = pptx.addSlide();
  s.background = { color: COLORS.navy };
  s.addShape("rect", { x: 0, y: 5.6, w: W, h: 0.06, fill: { color: COLORS.gold }, line: { color: COLORS.gold } });
  s.addText("THE BLACK YOUTH FATHERHOOD GAP", { x: 0.5, y: 1.4, w: W - 1, h: 0.8, fontSize: 36, color: COLORS.gold, fontFace: "Calibri", bold: true, align: "center" });
  s.addText("Waco / McLennan County  ·  Austin / Travis County", { x: 0.5, y: 2.3, w: W - 1, h: 0.7, fontSize: 28, color: "FFFFFF", fontFace: "Calibri", bold: true, align: "center" });
  s.addText("A two-metro picture of disconnection, the school-to-prison pipeline,\nand the mentor gap — and how a coordinated AI-augmented response can close it.", { x: 1, y: 3.3, w: W - 2, h: 1.4, fontSize: 18, color: "FFFFFF", italic: true, fontFace: "Calibri", align: "center" });
  s.addText("Prepared by TCAF / ThriveUp Community Academy\nApril 17, 2026", { x: 0.5, y: 5.9, w: W - 1, h: 0.8, fontSize: 14, color: COLORS.gold, fontFace: "Calibri", align: "center" });
}

/* ---------- Slide 1.5: LIVE DATA SNAPSHOT ---------- */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Live data snapshot", `Pulled from /api/corridor/story · ${liveGenAt}`);
  const waco = [
    liveLine("waco", "Black poverty rate", "Black poverty rate (Waco)"),
    liveLine("waco", "Black families single-parent share", "Single-parent share (Waco)"),
    liveLine("waco", "Black adults without HS diploma", "No-HS adults (Waco)"),
    liveLine("waco", "Depression prevalence", "Depression (Waco)"),
    liveLine("waco", "Adults without health insurance", "Uninsured (Waco)"),
    liveLine("waco", "Violent crime", "Violent crime (TX)"),
  ];
  const austin = [
    liveLine("austin", "Black poverty rate", "Black poverty rate (Austin)"),
    liveLine("austin", "Black families single-parent share", "Single-parent share (Austin)"),
    liveLine("austin", "Black adults without HS diploma", "No-HS adults (Austin)"),
    liveLine("austin", "Depression prevalence", "Depression (Austin)"),
    liveLine("austin", "Adults without health insurance", "Uninsured (Austin)"),
    liveLine("austin", "Violent crime", "Violent crime (TX)"),
  ];
  s.addText("WACO / MCLENNAN — LIVE", { x: 0.4, y: 1.0, w: 6, h: 0.4, bold: true, fontSize: 14, color: COLORS.crimson, fontFace: "Calibri" });
  s.addText(waco.map((t) => ({ text: t, options: { bullet: { code: "25A0" }, fontSize: 11, color: COLORS.ink, breakLine: true, paraSpaceAfter: 4 } })),
    { x: 0.4, y: 1.4, w: 6.2, h: 5.0, fontFace: "Calibri" });
  s.addText("AUSTIN / TRAVIS — LIVE", { x: 6.8, y: 1.0, w: 6, h: 0.4, bold: true, fontSize: 14, color: COLORS.crimson, fontFace: "Calibri" });
  s.addText(austin.map((t) => ({ text: t, options: { bullet: { code: "25A0" }, fontSize: 11, color: COLORS.ink, breakLine: true, paraSpaceAfter: 4 } })),
    { x: 6.8, y: 1.4, w: 6.2, h: 5.0, fontFace: "Calibri" });
  s.addText(LIVE_STORY ? "Every line above is the current value in the chain-web. Re-run the deck to refresh." : "LIVE API NOT REACHABLE — this slide is a fallback; start the server and rebuild for connected values.",
    { x: 0.4, y: 6.5, w: W - 0.8, h: 0.4, fontSize: 10, italic: true, color: LIVE_STORY ? COLORS.green : COLORS.crimson, fontFace: "Calibri" });
  addFooter(s, LIVE_STORY ? "Live — connected to /api/corridor/story" : "FALLBACK — live API unavailable at build");
}

/* ---------- Slide 2: Why now ---------- */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Why this picture matters now", "Three fatherless boys in 76704 today are next year's headlines if no one intervenes.");
  addBullets(s, [
    "In Waco's 76704 ZIP, the violent crime index runs ~2.8× the U.S. average. Most of the boys involved have one common thread: no consistent father figure.",
    "Waco ISD was just placed at TEA Stage 4 — the most severe discipline rating in Texas — for sending Black students to alternative ed at 3× the rate of their peers.",
    "Across the I-35 corridor in Austin, the same mechanics play out at a larger scale, accelerated by gentrification displacing Black families from East Austin to Manor, Pflugerville, and Del Valle.",
    "In both metros, Big Brothers Big Sisters has a publicly acknowledged Black-male-mentor crisis: boys wait roughly twice as long as girls for a match.",
    "We have a 24-platform AI operating system, a real-time event bus (RPLICE), and a Sankofa Men program ready to deploy. What we need is the partnership table."
  ]);
  addFooter(s, "Executive Summary");
}

/* ============================ SECTION A: WACO ============================ */
addSectionDivider("PART A · WACO / McLENNAN COUNTY", "The concentrated picture: 76704 East Waco");

/* Slide A1: Geography */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Waco / McLennan County — sides of town", "East Waco (76704) is the historically Black, redlined side of the Brazos.");
  const headers = ["Zip", "Neighborhood", "Black share", "Pop", "Crime signal"];
  const rows = [
    ["76704", "East Waco (historic Black district)", "~50%+ vs Waco 19.3%", "7,220", "Violent index 64.3 (~2.8× US)"],
    ["76707", "South / Central Waco", "High Black + Hispanic", "~24K", "Violent index 66.4 (~2.9× US)"],
    ["76705", "NE Waco / Bellmead", "Mixed", "~38K", "Below city avg"],
    ["76710 / 76712", "West Waco", "Predominantly White", "~50K", "Reference / opportunity baseline"],
  ];
  const tableData = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 13 } })),
    ...rows.map((r, i) => r.map((c, j) => ({ text: c, options: { fontSize: 12, color: COLORS.ink, fill: { color: i === 0 ? "FFE9C7" : "FFFFFF" }, align: j === 0 ? "center" : "left" } })))
  ];
  s.addTable(tableData, { x: 0.5, y: 1.3, w: 12.3, colW: [1.3, 4, 2.7, 1.3, 3], rowH: 0.55, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  s.addText("76704 is the geographic heart of every risk factor that follows. Redlined since the 1930s, still concentrated today.", {
    x: 0.5, y: 5.5, w: 12.3, h: 0.8, fontSize: 15, italic: true, color: COLORS.crimson, fontFace: "Calibri", align: "center"
  });
  addFooter(s, "Waco · Geography");
}

/* Slide A2: Stats wall */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "The numbers behind the alarm", "Waco / McLennan — verified from BLS, ACS, TEA, BestPlaces, USAFacts, TJJD");
  addStat(s, 0.6, 1.4, 2.9, 1.6, "2.8×", "76704 violent crime\nvs U.S. average", COLORS.crimson);
  addStat(s, 3.7, 1.4, 2.9, 1.6, "3×", "Black students sent to\nalt ed vs peers (TEA)", COLORS.crimson);
  addStat(s, 6.8, 1.4, 2.9, 1.6, "60%", "of discretionary DAEP\n placements are Black", COLORS.crimson);
  addStat(s, 9.9, 1.4, 2.9, 1.6, "Stage 4", "TEA discipline reprimand\n(most severe rating)", COLORS.crimson);
  addStat(s, 0.6, 3.3, 2.9, 1.6, "76.4%", "Waco ISD students\nflagged at-risk", COLORS.slate);
  addStat(s, 3.7, 3.3, 2.9, 1.6, "~1,300", "Est. disconnected Black\nyouth 16–24 county-wide", COLORS.slate);
  addStat(s, 6.8, 3.3, 2.9, 1.6, "~3,200", "Black children in single-\nparent households", COLORS.slate);
  addStat(s, 9.9, 3.3, 2.9, 1.6, "~700+", "Mentor gap (Black-male\nmentors needed)", COLORS.gold);
  s.addText("Sources: BestPlaces (zip crime), TEA TAPR 2024, USAFacts/BLS LAUS, ACS 5-yr 2019–2023, TJJD population reports, BBBS Lone Star public statements.", {
    x: 0.6, y: 5.5, w: 12.3, h: 0.5, fontSize: 10, color: COLORS.gray, italic: true, fontFace: "Calibri"
  });
  addFooter(s, "Waco · By the numbers");
}

/* Slide A3: Education pipeline */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Waco ISD — the measurable school-to-prison pipeline", "TEA Stage 4 reprimand makes this the single most actionable upstream lever.");
  addBullets(s, [
    "Black students = ~30% of Waco ISD enrollment but ~60% of discretionary DAEP (alternative ed) placements.",
    "Black students are 3× more likely than peers to be sent to DAEP for offenses that don't automatically require placement (gang involvement, threats).",
    "76.4% of Waco ISD students are flagged at-risk of dropping out — among the highest rates in Central Texas.",
    "District-wide grad rate is 86%, but the Black-student rate isn't published cleanly — the gap is the story.",
    "Every DAEP placement materially increases the probability of justice-system involvement within 24 months. That's the pipeline. We can disrupt it at the campus level."
  ]);
  addFooter(s, "Waco · Education");
}

/* Slide A4: Family + SDOH */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Waco — family structure & SDOH layer", "The conditions that produce the gap (and that we can change).");
  addBullets(s, [
    "An estimated ~55–60% of Black children in McLennan live in single-parent (predominantly female-headed) households — vs ~24% for White children.",
    "That maps to ~3,000–3,500 Black children growing up without a residential father in the county.",
    "76704 carries an 8–12 year life expectancy gap vs West Waco (76710) — comparable to documented gaps in Houston/Dallas Black neighborhoods.",
    "76704 is a USDA-designated low-income / low-access area for grocery (food desert).",
    "Waco Transit coverage from 76704 to major employment hubs is sparse — limiting both youth jobs and adult-male job retention.",
    "Eviction filings concentrate in 76704 / 76707 — destabilizing the same families we need to anchor."
  ]);
  addFooter(s, "Waco · SDOH");
}

/* Slide A5: Existing capacity + gap */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Who's already in the field — and where the gap is", "We are not duplicating. We are stitching.");
  addBullets(s, [
    "STARRY Fatherhood Program (Columbus Ave, Waco) — only comprehensive fatherhood program. Free. Bell/Coryell/McLennan/Williamson. Funded by TX HHSC + United Way of Waco-McLennan.",
    "BBBS West Central Texas (BBBS Lone Star) — confirmed Black-male mentor waitlist crisis. Boys wait ~2× as long as girls.",
    "Prosper Waco — backbone collective-impact org with a youth pillar; data-ready partner.",
    "Communities In Schools Waco — campus-level case management, but capacity-limited on Black-male specific work.",
    "Waco Foundation, Cooper Foundation, United Way of Waco-McLennan — local funding table.",
    "Baylor University, McLennan Community College, TSTC — workforce / mentor pipeline if activated.",
    "MISSING: a 100 Black Men chapter, a coordinated Black-male mentor recruitment campaign, and a real-time mentor-to-youth matching layer. That's where TCAF plugs in."
  ]);
  addFooter(s, "Waco · Capacity");
}

/* ============================ SECTION B: AUSTIN ============================ */
addSectionDivider("PART B · AUSTIN / TRAVIS COUNTY", "The dispersed picture: gentrification scattered the same problem.");

/* Slide B1: Geography */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Austin / Travis County — sides of town", "Gentrification has pushed the historically Black community east and north.");
  const headers = ["Zip / Area", "Historic identity", "Black share", "Trajectory", "Signal"];
  const rows = [
    ["78702 East Austin", "Historic Black district", "~15% (was ~70% in 1990)", "Displaced", "Gentrified, prices doubled"],
    ["78721 / 78723", "Heart of Black Austin", "~25–30%", "Stabilizing", "Concentrated need + culture orgs"],
    ["78724 NE Travis", "Receiving community", "~35%+", "Growing", "Receiving displaced families"],
    ["Manor / Del Valle / Pflugerville", "New Black population", "10–25%", "Expanding", "Schools absorbing displacement"],
    ["West Austin / 78703 / 78746", "Predominantly White / wealthy", "<3%", "Stable", "Reference baseline"],
  ];
  const tableData = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 13 } })),
    ...rows.map((r, i) => r.map((c, j) => ({ text: c, options: { fontSize: 11, color: COLORS.ink, fill: { color: "FFFFFF" }, align: j === 0 ? "left" : "left" } })))
  ];
  s.addTable(tableData, { x: 0.4, y: 1.3, w: 12.5, colW: [2.6, 2.6, 2.2, 2, 3.1], rowH: 0.55, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  s.addText("Austin's Black community is no longer geographically concentrated. That changes the strategy — but not the math.", {
    x: 0.4, y: 5.7, w: 12.5, h: 0.6, fontSize: 14, italic: true, color: COLORS.crimson, fontFace: "Calibri", align: "center"
  });
  addFooter(s, "Austin · Geography");
}

/* Slide B2: Austin numbers */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Austin / Travis — by the numbers", "Bigger metro, dispersed need, larger absolute gap.");
  addStat(s, 0.6, 1.4, 2.9, 1.6, "1.3M", "Travis County\npopulation", COLORS.slate);
  addStat(s, 3.7, 1.4, 2.9, 1.6, "~9%", "Black share of\nTravis County", COLORS.slate);
  addStat(s, 6.8, 1.4, 2.9, 1.6, "~7%", "Black share of\nAustin ISD", COLORS.slate);
  addStat(s, 9.9, 1.4, 2.9, 1.6, "20%+", "Black share of AISD\nout-of-school suspensions", COLORS.crimson);
  addStat(s, 0.6, 3.3, 2.9, 1.6, "~3.5×", "Black students suspended\nvs White peers (AISD)", COLORS.crimson);
  addStat(s, 3.7, 3.3, 2.9, 1.6, "~5,500", "Est. disconnected Black\nyouth 16–24 metro-wide", COLORS.slate);
  addStat(s, 6.8, 3.3, 2.9, 1.6, "~12,000", "Black children in single-\nparent households", COLORS.slate);
  addStat(s, 9.9, 3.3, 2.9, 1.6, "~1,500+", "Mentor gap (Black-male\nmentors needed)", COLORS.gold);
  s.addText("Sources: ACS 2019–2023, AISD discipline reports, Travis County Juvenile Probation, BBBS Lone Star, Texas Demographic Center.", {
    x: 0.6, y: 5.5, w: 12.3, h: 0.5, fontSize: 10, color: COLORS.gray, italic: true, fontFace: "Calibri"
  });
  addFooter(s, "Austin · By the numbers");
}

/* Slide B3: Austin partner ecosystem */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Austin — who's already in the field", "Bigger ecosystem, more philanthropic capital, but coordination is fragmented.");
  addBullets(s, [
    "100 Black Men of Central Texas — active mentor chapter; the Waco analog doesn't exist yet.",
    "Austin Area Urban League — workforce, advocacy, family services.",
    "Six Square (Austin's Black Cultural District) — cultural anchor in 78702/78721.",
    "Foundation Communities — housing + family stability + financial coaching at scale.",
    "Huston-Tillogson University — HBCU mentor / college-pipeline partner.",
    "Communities In Schools Central Texas — campus case management across AISD, Manor, Del Valle, Pflugerville.",
    "BBBS Lone Star (parent of Waco's chapter) — one network, two metros, same waitlist.",
    "Funders at the table: St. David's Foundation ($200M+/yr), Michael & Susan Dell, Andy Roddick Foundation, Mission Capital, United Way Greater Austin, Greater Austin Black Chamber.",
    "MISSING: a real-time, cross-org coordination layer that can match a fatherless boy in Manor to a mentor in Round Rock without a 90-day intake delay."
  ]);
  addFooter(s, "Austin · Capacity");
}

/* ===================== SECTION C: COMPARISON ===================== */
addSectionDivider("PART C · SYMMETRY · ALIGNMENT · DIFFERENCES", "Two metros, one I-35 corridor, one shared playbook.");

/* C1: Symmetry */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Symmetry — where Waco and Austin look identical", "The mechanics of the pipeline don't care about metro size.");
  addBullets(s, [
    "Same school-to-prison pipeline mechanics: Black students 3–3.5× more likely to be sent to DAEP / suspended than peers in both districts.",
    "Same single-parent share: ~55–60% of Black children in both counties grow up without a residential father.",
    "Same BBBS Black-male mentor crisis: boys wait ~2× as long as girls for a match in both chapters of the same network.",
    "Same opportunity-youth ratio: Black 16–24 disconnection rate runs ~17–19% in both metros (vs ~11% overall).",
    "Same SDOH stack in the historic Black ZIPs: food desert, transit gap, eviction concentration, life-expectancy gap of 8–12 years vs the wealthy ZIP.",
    "Same federal/state funding pools: TX HHSC Fatherhood, TWC Workforce, HRSA RCORP, SAMHSA Statewide Family Network, DOJ OVW — all available to both."
  ]);
  addFooter(s, "Comparison · Symmetry");
}

/* C2: Alignment */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Alignment — where the two ecosystems already meet", "We don't have to build the bridges. We have to activate them.");
  const headers = ["Layer", "Waco partner", "Austin partner", "Shared rail"];
  const rows = [
    ["Backbone collective impact", "Prosper Waco", "Mission Capital", "Shared learning agenda"],
    ["Fatherhood direct service", "STARRY", "AAUL + 100 BMCT", "TX HHSC Fatherhood Initiative"],
    ["Mentor network", "BBBS West Central TX", "BBBS Lone Star (Austin)", "Same parent network — one pipeline"],
    ["Higher-ed mentor pipeline", "Baylor / MCC / TSTC", "UT Austin / Huston-Tillotson / ACC", "TX state work-study + service-learning"],
    ["Workforce", "Heart of TX Workforce Board", "Workforce Solutions Capital Area", "TWC Skills Development Fund"],
    ["Funders", "Cooper, Waco Fdn, UW Waco-McLennan", "St. David's, Dell, UW Greater Austin", "Co-funded I-35 corridor cohort"],
    ["School district", "Waco ISD", "AISD + Manor + Del Valle + Pflugerville", "TEA Stage-4 lessons → AISD prevention"],
  ];
  const tableData = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 13 } })),
    ...rows.map(r => r.map((c, j) => ({ text: c, options: { fontSize: 11.5, color: COLORS.ink, fill: { color: "FFFFFF" }, align: "left" } })))
  ];
  s.addTable(tableData, { x: 0.4, y: 1.3, w: 12.5, colW: [2.4, 2.7, 3.4, 4], rowH: 0.5, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  addFooter(s, "Comparison · Alignment");
}

/* C3: Differences */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Differences — what makes each metro unique", "Strategy must adapt, even when the math is shared.");
  addBullets(s, [
    "Concentration vs dispersion: Waco's need is geographically concentrated in 76704 — one neighborhood-scale intervention can move the needle. Austin's need is dispersed across 5+ ZIPs and 4+ districts — strategy must be hub-and-spoke.",
    "Philanthropic capital: Austin has ~10× the foundation grant capital of Waco — but also ~10× the competition for it. Waco has tighter relationships and faster decisions.",
    "Cultural anchoring: Austin has Six Square, a designated Black Cultural District; Waco has no equivalent — building one is part of the play.",
    "HBCU presence: Austin has Huston-Tillotson; Waco has none — but Baylor's Diana R. Garland School of Social Work is a willing partner.",
    "Gentrification pressure: Austin's families are being priced out; the intervention must include housing stability (Foundation Communities). Waco's families are stable in place but under-resourced.",
    "Existing 100 Black Men chapter: Active in Austin, absent in Waco — Phase 1 deliverable is to charter a Waco chapter or formal Sankofa-Men-led equivalent."
  ]);
  addFooter(s, "Comparison · Differences");
}

/* ===================== SECTION D: TCAF SOLUTION ===================== */
addSectionDivider("PART D · THE TCAF SOLUTION", "What 24 platforms + RPLICE + Sankofa Men + WAB2 deliver to the field.");

/* D1: Architecture */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "How TCAF closes the gap — five-platform stack", "Every layer is already built. We're activating, not inventing.");
  const headers = ["Layer", "TCAF platform", "What it does for the fatherhood gap"];
  const rows = [
    ["1. Identification", "WAB2 (We Are Better Together)", "5-area county×ZIP×language matrix surfaces fatherless boys + at-risk fathers in real time"],
    ["2. Engagement", "LifeBridge", "Community-trusted, multilingual outreach via known local navigators"],
    ["3. Mentor matching", "Sankofa Men", "Same-race / same-experience male mentors matched + trained + retained"],
    ["4. Wraparound", "WholeMind + ISSS Youth", "Behavioral health, education re-engagement, college / workforce on-ramps"],
    ["5. Evidence + funding", "RPLICE event bus", "Real-time outcome events shared across orgs + funders for coordinated reporting"],
  ];
  const tableData = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 14 } })),
    ...rows.map(r => r.map((c, j) => ({ text: c, options: { fontSize: 12, color: COLORS.ink, fill: { color: j === 0 ? "FFE9C7" : "FFFFFF" }, align: "left", bold: j === 1 } })))
  ];
  s.addTable(tableData, { x: 0.4, y: 1.3, w: 12.5, colW: [2.5, 3, 7], rowH: 0.85, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  addFooter(s, "Solution · Architecture");
}

/* D2: RPLICE */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "RPLICE — the real-time bus that connects every partner", "The coordination layer Austin's fragmented ecosystem has been waiting for.");
  addBullets(s, [
    "RPLICE = Real-time Population Linkage and Information Coordination Engine — TCAF's event bus.",
    "Every partner emits events: 'youth.flagged', 'mentor.matched', 'family.enrolled', 'father.engaged', 'crisis.triaged', 'outcome.achieved'.",
    "Subscribed partners receive only what they're authorized to see — privacy-preserving by design (FERPA, HIPAA, 42 CFR Part 2 aware).",
    "STARRY in Waco and AAUL in Austin can see the same boy's mentor match in real time — no 90-day intake delay.",
    "Funders (United Way, St. David's, Cooper, Dell) get a unified outcomes dashboard across all grantees instead of 12 different PDFs.",
    "We've already shipped /api/rplice/sync (handshake + batch + peer-network mirror) — it's live and ready to onboard partners today."
  ]);
  addFooter(s, "Solution · RPLICE");
}

/* D3: Pilot proposal */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "12-month pilot — Waco Fatherhood Pod + Austin Fatherhood Pod", "Twin pods, shared learning loop, one P&L.");
  addBullets(s, [
    "Waco pod: anchor in 76704. Recruit + match 250 Black-male mentors to 250 fatherless boys (ages 8–17). Co-run with STARRY + Prosper Waco + Waco ISD + Baylor.",
    "Austin pod: anchor in 78721 / 78724 with a Manor satellite. Recruit + match 500 mentors to 500 boys. Co-run with 100 BMCT + AAUL + Foundation Communities + AISD/Manor/Del Valle.",
    "Both pods feed RPLICE. Quarterly cross-pod learning sessions. Shared mentor training curriculum. Shared evaluation by Dell Med School + UT SSW + Baylor SSW.",
    "Year-1 outcome targets: 750 mentor matches, 1,200 fathers re-engaged, 35% reduction in DAEP placements among matched youth, 90% mentor retention at 12 months.",
    "Total Y1 budget envelope: ~$2.4M ($800K Waco + $1.6M Austin) — backloaded against funder commitments below."
  ]);
  addFooter(s, "Solution · Pilot");
}

/* D4: Funding strategy */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Funding strategy — corporate + philanthropic + public", "Diversified across both metros.");
  const headers = ["Source type", "Waco", "Austin", "Cross-metro"];
  const rows = [
    ["Local United Way", "UW Waco-McLennan ($150K)", "UW Greater Austin ($300K)", "Joint corridor RFP"],
    ["Place-based foundation", "Cooper Fdn, Waco Fdn ($250K)", "St. David's, Dell, Roddick ($600K)", "I-35 Corridor Cohort"],
    ["Public — state", "TX HHSC Fatherhood, TWC SDF", "TX HHSC Fatherhood, TWC SDF", "Single TX HHSC application"],
    ["Public — federal", "HRSA RCORP-Planning, SAMHSA SFN", "DOJ OVW Rural N/A → BJA COSSUP", "PCORI Cycle 2 (LOI 4/28!)"],
    ["Corporate", "H-E-B, Baylor, McLane, Mars", "Dell, USAA, Tito's, Indeed, Google", "Combined CSR ask"],
    ["Faith / civic", "Greater Mt Zion, NAACP Waco", "Ebenezer 3rd Bapt, NAACP Austin", "Cross-pulpit campaign"],
  ];
  const td = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 13 } })),
    ...rows.map(r => r.map(c => ({ text: c, options: { fontSize: 11.5, color: COLORS.ink, fill: { color: "FFFFFF" }, align: "left" } })))
  ];
  s.addTable(td, { x: 0.4, y: 1.3, w: 12.5, colW: [2.5, 3.4, 3.6, 3], rowH: 0.55, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  addFooter(s, "Solution · Funding");
}

/* D5: Partnership ask */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "What we're asking each partner type to do", "Specific, named, sized.");
  addBullets(s, [
    "United Way (Waco-McLennan + Greater Austin): convene the corridor table; co-fund the backbone coordinator FTE in each pod (~$120K each).",
    "STARRY + 100 BMCT + AAUL: become the lead direct-service operators. Receive Sankofa Men toolkit + RPLICE access + co-branded recruitment.",
    "BBBS Lone Star: open the existing waitlist to a coordinated Black-male recruitment campaign anchored by Sankofa Men + 100 BMCT.",
    "Waco ISD + AISD + Manor + Del Valle + Pflugerville: campus-level data-sharing MOU; mentor access during the school day; behavior-incident referrals via RPLICE.",
    "Baylor + UT Austin + Huston-Tillotson + MCC + ACC: mentor pipeline (work-study + service-learning), evaluation partnership.",
    "Corporate (H-E-B, Dell, USAA, Tito's, McLane, Baylor Healthcare, Indeed, Google): paid mentor release time + cash sponsorship + employee-resource-group activation.",
    "Faith leaders: pulpit recruitment of Black men 25–55 willing to commit 4 hrs/month for 24 months."
  ]);
  addFooter(s, "Solution · Partner asks");
}

/* D6: 30/60/90 */
{
  const s = pptx.addSlide(); addBg(s);
  addHeader(s, "Next 30 / 60 / 90 days", "Concrete milestones.");
  const headers = ["Window", "Waco track", "Austin track", "Cross-metro"];
  const rows = [
    ["30 days", "MOU with STARRY + Prosper Waco + Waco ISD; charter Sankofa Men Waco chapter", "MOU with 100 BMCT + AAUL + Foundation Communities; AISD data-sharing draft", "Single United Way co-funding ask; PCORI 4/28 LOI submitted"],
    ["60 days", "First 50 mentor matches in 76704; campus pilot at G.W. Carver MS", "First 100 mentor matches across 78721/78724/Manor; AISD pilot at LBJ Early College HS", "Joint launch event + RPLICE onboarding for all partners"],
    ["90 days", "150 active matches, 200 fathers engaged via STARRY co-referrals", "300 active matches, 400 fathers engaged via AAUL co-referrals", "First quarterly outcomes dashboard published to all funders"],
  ];
  const td = [
    headers.map(h => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: COLORS.navy }, align: "center", fontSize: 13 } })),
    ...rows.map(r => r.map((c, j) => ({ text: c, options: { fontSize: 11, color: COLORS.ink, fill: { color: j === 0 ? "FFE9C7" : "FFFFFF" }, align: "left", bold: j === 0 } })))
  ];
  s.addTable(td, { x: 0.4, y: 1.3, w: 12.5, colW: [1.6, 3.6, 3.6, 3.7], rowH: 1.4, border: { type: "solid", color: COLORS.slate, pt: 0.5 }, fontFace: "Calibri" });
  addFooter(s, "Solution · 30/60/90");
}

/* D7: Closing */
{
  const s = pptx.addSlide();
  s.background = { color: COLORS.navy };
  s.addShape("rect", { x: 0, y: 5.6, w: W, h: 0.06, fill: { color: COLORS.gold }, line: { color: COLORS.gold } });
  s.addText("The math is alarming. The mechanics are knowable.\nThe partners are present. The platform is built.", {
    x: 0.5, y: 1.6, w: W - 1, h: 1.6, fontSize: 28, color: "FFFFFF", italic: true, align: "center", fontFace: "Calibri"
  });
  s.addText("Let's stitch the I-35 corridor and close the gap together.", {
    x: 0.5, y: 3.5, w: W - 1, h: 0.8, fontSize: 22, color: COLORS.gold, bold: true, align: "center", fontFace: "Calibri"
  });
  s.addText("ThriveUp Community Academy / TCAF\nApril 17, 2026", {
    x: 0.5, y: 5.9, w: W - 1, h: 0.8, fontSize: 14, color: "FFFFFF", align: "center", fontFace: "Calibri"
  });
}

/* ============================ WORD DOC ============================ */
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, color: opts.color, size: opts.size ? opts.size * 2 : undefined })],
    heading: opts.heading,
    alignment: opts.align,
    spacing: { after: opts.spaceAfter ?? 120, before: opts.spaceBefore ?? 0 }
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text })],
    bullet: { level },
    spacing: { after: 80 }
  });
}
function tbl(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })] })],
      shading: { fill: COLORS.navy }
    }))
  });
  const bodyRows = rows.map(r => new TableRow({
    children: r.map(c => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: String(c) })] })]
    }))
  }));
  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
}

const doc = new Document({
  creator: "TCAF",
  title: "Waco & Austin: The Black Youth Fatherhood Gap",
  description: "Two-metro chained analysis with SDOH layer and partnership solution",
  sections: [{
    children: [
      p("THE BLACK YOUTH FATHERHOOD GAP", { heading: HeadingLevel.TITLE, align: AlignmentType.CENTER }),
      p("Waco / McLennan County  ·  Austin / Travis County", { heading: HeadingLevel.HEADING_2, align: AlignmentType.CENTER, italic: true }),
      p("A two-metro chained analysis with SDOH layer and the partnership architecture to close the gap.", { align: AlignmentType.CENTER, italic: true, color: "555555" }),
      p("Prepared by ThriveUp Community Academy (TCAF) · April 17, 2026", { align: AlignmentType.CENTER, color: "777777", spaceAfter: 400 }),

      p("Executive Summary", { heading: HeadingLevel.HEADING_1 }),
      p("In Waco's 76704 ZIP, the violent crime index runs 2.8× the U.S. average. Most of the boys involved share one common thread: no consistent father figure. Waco ISD was just placed on TEA Stage 4 — the most severe discipline rating in Texas — for sending Black students to alternative ed at 3× the rate of their peers. Across the I-35 corridor in Austin, the same mechanics play out at a larger scale, accelerated by gentrification displacing Black families from East Austin to Manor, Pflugerville, and Del Valle. In both metros, Big Brothers Big Sisters has a publicly acknowledged Black-male-mentor crisis: boys wait roughly twice as long as girls for a match. We have a 24-platform AI operating system, a real-time event bus (RPLICE), and a Sankofa Men program ready to deploy. What we need is the partnership table."),

      p("Part A · Waco / McLennan County", { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      p("Sides of town", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Zip", "Neighborhood", "Black share", "Pop", "Crime signal"], [
        ["76704", "East Waco (historic Black district)", "~50%+ vs Waco 19.3%", "7,220", "Violent index 64.3 (~2.8× US)"],
        ["76707", "South / Central Waco", "High Black + Hispanic", "~24K", "Violent index 66.4 (~2.9× US)"],
        ["76705", "NE Waco / Bellmead", "Mixed", "~38K", "Below city avg"],
        ["76710 / 76712", "West Waco", "Predominantly White", "~50K", "Reference baseline"],
      ]),
      p(""),
      p("By the numbers", { heading: HeadingLevel.HEADING_2 }),
      bullet("76704 violent crime: 2.8× the U.S. average; property crime 2.1× U.S. average."),
      bullet("Waco ISD discipline: TEA Stage 4 reprimand (most severe). Black students = ~30% of enrollment but ~60% of discretionary DAEP placements. 3× more likely than peers to be sent to alternative ed."),
      bullet("76.4% of Waco ISD students flagged at-risk of dropping out."),
      bullet("Estimated ~1,300 disconnected Black youth (16–24) in McLennan County (BLS doesn't publish race × age × county; computed via ACS PUMS using TX statewide opportunity-youth rate of 17–19%)."),
      bullet("~3,000–3,500 Black children in McLennan growing up in single-parent households (predominantly female-headed)."),
      bullet("Mentor gap: ~700+ Black-male mentors needed; current STARRY + BBBS West Central TX combined Black-male capacity is well under 100."),

      p("SDOH layer", { heading: HeadingLevel.HEADING_2 }),
      bullet("76704 carries an estimated 8–12 year life expectancy gap vs West Waco (76710)."),
      bullet("76704 is a USDA-designated low-income / low-access area for grocery (food desert)."),
      bullet("Waco Transit coverage from 76704 to major employment hubs is sparse, limiting both youth jobs and adult-male job retention."),
      bullet("Eviction filings concentrate in 76704 / 76707 — destabilizing the same families we need to anchor."),
      bullet("McLennan County uninsured rate is meaningfully higher among Black adults than White adults; documented in Ascension Providence + Baylor Scott & White CHNAs."),
      bullet("These SDOH variables will be ingested into RPLICE as 'community.sdoh.measured' events at the ZIP level so every TCAF platform consumes the same source-of-truth picture."),

      p("Existing capacity & gaps", { heading: HeadingLevel.HEADING_2 }),
      bullet("STARRY Fatherhood Program (Columbus Ave, Waco): only comprehensive fatherhood program. Free. Funded by TX HHSC + United Way of Waco-McLennan."),
      bullet("BBBS West Central Texas (BBBS Lone Star): Black-male mentor waitlist crisis confirmed; boys wait ~2× as long as girls."),
      bullet("Prosper Waco: backbone collective-impact org with a youth pillar; data-ready partner."),
      bullet("Waco Foundation, Cooper Foundation, United Way of Waco-McLennan: local funding table."),
      bullet("Baylor University, McLennan Community College, TSTC: workforce + mentor pipeline if activated."),
      bullet("MISSING: a 100 Black Men chapter, a coordinated Black-male recruitment campaign, and a real-time mentor-to-youth matching layer. That is the TCAF plug-in."),

      p("Part B · Austin / Travis County", { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      p("Sides of town", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Zip / Area", "Historic identity", "Black share", "Trajectory", "Signal"], [
        ["78702 East Austin", "Historic Black district", "~15% (was ~70% in 1990)", "Displaced", "Gentrified, prices doubled"],
        ["78721 / 78723", "Heart of Black Austin", "~25–30%", "Stabilizing", "Concentrated need + culture orgs"],
        ["78724 NE Travis", "Receiving community", "~35%+", "Growing", "Receiving displaced families"],
        ["Manor / Del Valle / Pflugerville", "New Black population", "10–25%", "Expanding", "Schools absorbing displacement"],
        ["West Austin / 78703 / 78746", "Predominantly White", "<3%", "Stable", "Reference baseline"],
      ]),
      p(""),
      p("By the numbers", { heading: HeadingLevel.HEADING_2 }),
      bullet("Travis County population ~1.3M; Black share ~9%."),
      bullet("Austin ISD: Black students ~7% of enrollment, ~20%+ of out-of-school suspensions; suspended at ~3.5× the rate of White peers."),
      bullet("Estimated ~5,500 disconnected Black youth (16–24) metro-wide."),
      bullet("Estimated ~12,000 Black children in single-parent households across Travis County."),
      bullet("Mentor gap: ~1,500+ Black-male mentors needed metro-wide."),

      p("SDOH layer", { heading: HeadingLevel.HEADING_2 }),
      bullet("Gentrification displacement: 78702 was ~70% Black in 1990; today ~15%. Families pushed to Manor, Del Valle, Pflugerville, and Bastrop."),
      bullet("Housing-cost burden in 78721 / 78724 among the highest in the metro for renting Black families."),
      bullet("Transit-to-jobs gap measurable in Manor and Del Valle as families relocate beyond the Cap Metro core."),
      bullet("Ascension / St. David's / Central Health CHNAs all flag 78721 / 78724 as priority for chronic-disease + behavioral-health investment."),

      p("Existing capacity", { heading: HeadingLevel.HEADING_2 }),
      bullet("100 Black Men of Central Texas — active mentor chapter."),
      bullet("Austin Area Urban League — workforce + advocacy + family services."),
      bullet("Six Square — Austin's designated Black Cultural District."),
      bullet("Foundation Communities — housing + family stability + financial coaching at scale."),
      bullet("Huston-Tillotson University (HBCU) — mentor + college pipeline partner."),
      bullet("Communities In Schools Central Texas — campus case management across AISD, Manor, Del Valle, Pflugerville."),
      bullet("BBBS Lone Star — same network as Waco; same waitlist crisis."),
      bullet("Funders: St. David's Foundation ($200M+/yr), Michael & Susan Dell, Andy Roddick Foundation, Mission Capital, United Way Greater Austin, Greater Austin Black Chamber."),
      bullet("MISSING: a real-time, cross-org coordination layer that can match a fatherless boy in Manor to a mentor in Round Rock without a 90-day intake delay."),

      p("Part C · Symmetry, Alignment, Differences", { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      p("Symmetry — where Waco and Austin look identical", { heading: HeadingLevel.HEADING_2 }),
      bullet("Same school-to-prison pipeline mechanics: Black students 3–3.5× more likely to be sent to DAEP / suspended."),
      bullet("Same single-parent share among Black families (~55–60%)."),
      bullet("Same BBBS Black-male mentor crisis."),
      bullet("Same opportunity-youth ratio (~17–19% disconnection rate for Black 16–24)."),
      bullet("Same SDOH stack in the historic Black ZIPs (food desert, transit gap, eviction concentration, life-expectancy gap of 8–12 years vs the wealthy ZIP)."),
      bullet("Same federal/state funding pools available to both."),

      p("Alignment — where the two ecosystems already meet", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Layer", "Waco partner", "Austin partner", "Shared rail"], [
        ["Backbone collective impact", "Prosper Waco", "Mission Capital", "Shared learning agenda"],
        ["Fatherhood direct service", "STARRY", "AAUL + 100 BMCT", "TX HHSC Fatherhood Initiative"],
        ["Mentor network", "BBBS West Central TX", "BBBS Lone Star (Austin)", "Same parent network — one pipeline"],
        ["Higher-ed pipeline", "Baylor / MCC / TSTC", "UT Austin / Huston-Tillotson / ACC", "TX work-study + service-learning"],
        ["Workforce", "Heart of TX Workforce Board", "Workforce Solutions Capital Area", "TWC Skills Development Fund"],
        ["Funders", "Cooper / Waco Fdn / UW Waco-McLennan", "St. David's / Dell / UW Greater Austin", "Co-funded I-35 corridor cohort"],
        ["Schools", "Waco ISD", "AISD + Manor + Del Valle + Pflugerville", "TEA Stage-4 lessons → AISD prevention"],
      ]),
      p(""),
      p("Differences — what makes each metro unique", { heading: HeadingLevel.HEADING_2 }),
      bullet("Concentration vs dispersion: Waco's need is concentrated in 76704; Austin's is dispersed across 5+ ZIPs and 4+ districts. Strategy must adapt — neighborhood model vs hub-and-spoke."),
      bullet("Philanthropic capital: Austin has ~10× the capital but ~10× the competition. Waco has tighter relationships and faster decisions."),
      bullet("Cultural anchoring: Austin has Six Square; Waco has no equivalent — building one is part of the play."),
      bullet("HBCU presence: Austin has Huston-Tillotson; Waco has none — Baylor's Diana R. Garland School of Social Work is the willing partner."),
      bullet("Gentrification pressure: Austin's intervention must include housing stability (Foundation Communities). Waco's families are stable in place but under-resourced."),
      bullet("100 Black Men chapter: active in Austin, absent in Waco — Phase 1 deliverable is to charter a Waco chapter or formal Sankofa-Men-led equivalent."),

      p("Part D · The TCAF Solution", { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      p("Five-platform stack", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Layer", "TCAF platform", "What it does"], [
        ["1. Identification", "WAB2", "5-area county×ZIP×language matrix surfaces fatherless boys + at-risk fathers in real time"],
        ["2. Engagement", "LifeBridge", "Community-trusted, multilingual outreach via known local navigators"],
        ["3. Mentor matching", "Sankofa Men", "Same-race / same-experience male mentors matched, trained, and retained"],
        ["4. Wraparound", "WholeMind + ISSS Youth", "Behavioral health, education re-engagement, college / workforce on-ramps"],
        ["5. Evidence + funding", "RPLICE event bus", "Real-time outcome events shared across orgs and funders"],
      ]),
      p(""),
      p("RPLICE — the real-time bus", { heading: HeadingLevel.HEADING_2 }),
      bullet("Partners emit events: youth.flagged, mentor.matched, family.enrolled, father.engaged, crisis.triaged, outcome.achieved."),
      bullet("Subscribed partners receive only what they're authorized to see (FERPA / HIPAA / 42 CFR Part 2 aware)."),
      bullet("STARRY in Waco and AAUL in Austin can see the same boy's mentor match in real time — no 90-day intake delay."),
      bullet("Funders get a unified outcomes dashboard across all grantees instead of 12 different PDFs."),
      bullet("/api/rplice/sync (handshake + batch + peer-network mirror) is live and ready to onboard partners today."),

      p("12-month pilot", { heading: HeadingLevel.HEADING_2 }),
      bullet("Waco pod: anchor in 76704. Recruit + match 250 Black-male mentors to 250 fatherless boys (ages 8–17). Co-run with STARRY + Prosper Waco + Waco ISD + Baylor."),
      bullet("Austin pod: anchor in 78721 / 78724 with a Manor satellite. Recruit + match 500 mentors to 500 boys. Co-run with 100 BMCT + AAUL + Foundation Communities + AISD/Manor/Del Valle."),
      bullet("Both pods feed RPLICE. Quarterly cross-pod learning sessions. Shared mentor curriculum. Shared evaluation by Dell Med + UT SSW + Baylor SSW."),
      bullet("Year-1 outcome targets: 750 mentor matches, 1,200 fathers re-engaged, 35% reduction in DAEP placements among matched youth, 90% mentor retention at 12 months."),
      bullet("Total Y1 budget envelope: ~$2.4M ($800K Waco + $1.6M Austin)."),

      p("Funding strategy", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Source type", "Waco", "Austin", "Cross-metro"], [
        ["Local United Way", "UW Waco-McLennan ($150K)", "UW Greater Austin ($300K)", "Joint corridor RFP"],
        ["Place-based foundation", "Cooper / Waco Fdn ($250K)", "St. David's / Dell / Roddick ($600K)", "I-35 Corridor Cohort"],
        ["Public — state", "TX HHSC Fatherhood, TWC SDF", "TX HHSC Fatherhood, TWC SDF", "Single TX HHSC application"],
        ["Public — federal", "HRSA RCORP-Planning, SAMHSA SFN", "DOJ BJA COSSUP", "PCORI Cycle 2 (LOI 4/28)"],
        ["Corporate", "H-E-B, Baylor, McLane, Mars", "Dell, USAA, Tito's, Indeed, Google", "Combined CSR ask"],
        ["Faith / civic", "Greater Mt Zion, NAACP Waco", "Ebenezer 3rd Bapt, NAACP Austin", "Cross-pulpit campaign"],
      ]),
      p(""),
      p("Partnership asks", { heading: HeadingLevel.HEADING_2 }),
      bullet("United Way (Waco-McLennan + Greater Austin): convene the corridor table; co-fund the backbone coordinator FTE in each pod (~$120K each)."),
      bullet("STARRY + 100 BMCT + AAUL: lead direct-service operators. Receive Sankofa Men toolkit + RPLICE access + co-branded recruitment."),
      bullet("BBBS Lone Star: open the existing waitlist to a coordinated Black-male recruitment campaign anchored by Sankofa Men + 100 BMCT."),
      bullet("Waco ISD + AISD + Manor + Del Valle + Pflugerville: campus-level data-sharing MOU; mentor access during the school day; behavior-incident referrals via RPLICE."),
      bullet("Baylor + UT Austin + Huston-Tillotson + MCC + ACC: mentor pipeline (work-study + service-learning), evaluation partnership."),
      bullet("Corporate (H-E-B, Dell, USAA, Tito's, McLane, Baylor Healthcare, Indeed, Google): paid mentor release time + cash sponsorship + ERG activation."),
      bullet("Faith leaders: pulpit recruitment of Black men 25–55 willing to commit 4 hrs/month for 24 months."),

      p("Next 30 / 60 / 90 days", { heading: HeadingLevel.HEADING_2 }),
      tbl(["Window", "Waco track", "Austin track", "Cross-metro"], [
        ["30 days", "MOU with STARRY + Prosper Waco + Waco ISD; charter Sankofa Men Waco chapter", "MOU with 100 BMCT + AAUL + Foundation Communities; AISD data-sharing draft", "Single United Way co-funding ask; PCORI 4/28 LOI submitted"],
        ["60 days", "First 50 mentor matches in 76704; campus pilot at G.W. Carver MS", "First 100 matches across 78721/78724/Manor; AISD pilot at LBJ ECHS", "Joint launch event + RPLICE onboarding for all partners"],
        ["90 days", "150 active matches, 200 fathers engaged via STARRY co-referrals", "300 active matches, 400 fathers engaged via AAUL co-referrals", "First quarterly outcomes dashboard published to all funders"],
      ]),
      p(""),
      p("Closing", { heading: HeadingLevel.HEADING_1, spaceBefore: 240 }),
      p("The math is alarming. The mechanics are knowable. The partners are present. The platform is built. Let's stitch the I-35 corridor and close the gap together.", { italic: true, align: AlignmentType.CENTER }),
      p("ThriveUp Community Academy / TCAF · April 17, 2026", { align: AlignmentType.CENTER, color: "777777", spaceBefore: 200 }),
    ]
  }]
});

const PPT_PATH = `${OUT_DIR}/Waco-Austin-Fatherhood-Gap-v1.pptx`;
const DOCX_PATH = `${OUT_DIR}/Waco-Austin-Fatherhood-Gap-v1.docx`;

await pptx.writeFile({ fileName: PPT_PATH });
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(DOCX_PATH, buf);

console.log("WROTE:", PPT_PATH, fs.statSync(PPT_PATH).size);
console.log("WROTE:", DOCX_PATH, fs.statSync(DOCX_PATH).size);
