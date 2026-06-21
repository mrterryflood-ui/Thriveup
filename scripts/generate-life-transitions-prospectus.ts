import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "attached_assets", "LifeTransitions-ALIGN-Prospectus.pdf");

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  indigo:    "#1e1b4b",
  indigoMid: "#312e81",
  indigoLt:  "#4338ca",
  emerald:   "#064e3b",
  emeraldMid:"#065f46",
  emeraldLt: "#059669",
  gold:      "#b45309",
  goldLt:    "#d97706",
  ruby:      "#9f1239",
  violet:    "#6d28d9",
  white:     "#ffffff",
  offWhite:  "#f8fafc",
  slate:     "#334155",
  muted:     "#64748b",
  faint:     "#94a3b8",
  border:    "#e2e8f0",
  bgLight:   "#f1f5f9",
};

const PAGE = { w: 612, h: 792 };
const M    = { t: 48, b: 40, l: 50, r: 50 };
const CW   = PAGE.w - M.l - M.r;   // 512

// ── Font aliases ──────────────────────────────────────────────────────────────
const FB = "Helvetica-Bold";
const FR = "Helvetica";
const FI = "Helvetica-Oblique";
const FO = "Helvetica-BoldOblique";

// ── Asset paths ───────────────────────────────────────────────────────────────
const LOGO_ALIGN  = path.join(process.cwd(), "attached_assets", "4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781974706746.png");
const LOGO_COVER  = path.join(process.cwd(), "attached_assets", "4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781970914957.png");

// ── Document ──────────────────────────────────────────────────────────────────
const doc = new PDFDocument({ size: "LETTER", margin: 0, bufferPages: true });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function cy() { return doc.y; }

function hRule(color = C.border, lw = 0.5, x = M.l, w = CW) {
  doc.save().strokeColor(color).lineWidth(lw)
    .moveTo(x, cy()).lineTo(x + w, cy()).stroke().restore();
}

/** Colored bar + white label — section opener */
function sectionBanner(label: string, color = C.indigo, sub = "") {
  const bh = sub ? 26 : 18;
  doc.save().rect(M.l, cy(), CW, bh).fill(color).restore();
  doc.font(FB).fontSize(8).fillColor(C.white)
    .text(label.toUpperCase(), M.l + 10, cy() + 5, { width: CW - 20, lineBreak: false });
  if (sub) {
    doc.font(FR).fontSize(7).fillColor("rgba(255,255,255,0.70)")
      .text(sub, M.l + 10, cy() + 15, { width: CW - 20, lineBreak: false });
  }
  doc.moveDown(sub ? 1.8 : 1.3);
}

/** Page header + footer — call right after addPage() */
function pageChrome(title: string, pageNum: string) {
  doc.rect(0, 0, PAGE.w, 6).fill(C.gold);
  doc.rect(0, 6, PAGE.w, 34).fill(C.offWhite);
  doc.font(FB).fontSize(9).fillColor(C.indigo)
    .text("THRIVEUP ACADEMY  ·  TCAF", M.l, 17, { lineBreak: false });
  doc.font(FR).fontSize(7.5).fillColor(C.muted)
    .text(pageNum, 0, 19, { width: PAGE.w - M.r, align: "right", lineBreak: false });
  doc.font(FR).fontSize(7.5).fillColor(C.muted)
    .text(title, M.l, 29, { lineBreak: false });
  // footer
  doc.rect(0, PAGE.h - 22, PAGE.w, 22).fill(C.indigo);
  doc.font(FR).fontSize(6.5).fillColor("rgba(255,255,255,0.55)")
    .text(
      "Confidential  ·  The Collaborative Advocate Foundation  ·  EIN 41-3618003  ·  CAGE 209N1  ·  terryflood@thrivingcommunitiesforall.com  ·  thriveup.app  ·  June 2026",
      M.l, PAGE.h - 13, { width: CW, align: "center", lineBreak: false }
    );
  doc.y = 52;
}

function newPage(title: string, pageNum: string) {
  doc.addPage();
  pageChrome(title, pageNum);
}

/** Reserve space; add page if needed */
function safeDown(reserve = 80) {
  if (cy() > PAGE.h - M.b - reserve) { doc.addPage(); doc.y = M.t; }
}

// Text helpers
function h2(text: string, color = C.indigoMid) {
  safeDown(40);
  doc.font(FB).fontSize(12).fillColor(color).text(text, M.l, cy(), { width: CW });
  doc.moveDown(0.3);
}
function h3(text: string, color = C.indigo) {
  safeDown(30);
  doc.font(FB).fontSize(8.5).fillColor(color)
    .text(text.toUpperCase(), M.l, cy(), { width: CW, characterSpacing: 0.4 });
  doc.moveDown(0.2);
}
function body(text: string, indent = 0, width = CW) {
  safeDown(25);
  doc.font(FR).fontSize(8.5).fillColor(C.slate)
    .text(text, M.l + indent, cy(), { width: width - indent, lineGap: 2 });
  doc.moveDown(0.4);
}
function kv(label: string, value: string, lw = 100) {
  safeDown(18);
  const ky = cy();
  doc.font(FB).fontSize(8).fillColor(C.muted)
    .text(label + ":", M.l, ky, { width: lw, lineBreak: false });
  doc.font(FR).fontSize(8.5).fillColor(C.slate)
    .text(value, M.l + lw + 5, ky, { width: CW - lw - 5 });
  doc.moveDown(0.3);
}

function bullet(items: string[], accent = C.violet, indent = 8) {
  for (const item of items) {
    safeDown(20);
    const by = cy();
    doc.save().circle(M.l + indent - 2, by + 5.5, 2.2).fill(accent).restore();
    doc.font(FR).fontSize(8.5).fillColor(C.slate)
      .text(item, M.l + indent + 4, by, { width: CW - indent - 6, lineGap: 1.5 });
    doc.moveDown(0.25);
  }
}

function twoCol(items: { label: string; body: string }[], colGap = 10) {
  const colW = (CW - colGap) / 2;
  const lx = M.l;
  const rx = M.l + colW + colGap;
  const startY = cy();
  let maxY = startY;
  const left  = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 !== 0);

  doc.y = startY;
  left.forEach(it => {
    safeDown(30);
    doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(it.label, lx, doc.y, { width: colW });
    doc.font(FR).fontSize(8).fillColor(C.slate).text(it.body, lx, doc.y, { width: colW, lineGap: 1.5 });
    doc.moveDown(0.5);
    maxY = Math.max(maxY, doc.y);
  });

  doc.y = startY;
  right.forEach(it => {
    safeDown(30);
    doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(it.label, rx, doc.y, { width: colW });
    doc.font(FR).fontSize(8).fillColor(C.slate).text(it.body, rx, doc.y, { width: colW, lineGap: 1.5 });
    doc.moveDown(0.5);
    maxY = Math.max(maxY, doc.y);
  });

  doc.y = maxY;
}

/** Numbered capability block */
function capBlock(num: number, label: string, desc: string, color = C.indigo) {
  safeDown(45);
  const oy = cy();
  doc.save().rect(M.l, oy, 22, 20).fill(color).restore();
  doc.font(FB).fontSize(8).fillColor(C.white)
    .text(String(num), M.l + 3, oy + 6, { width: 22, align: "center", lineBreak: false });
  doc.font(FB).fontSize(9).fillColor(color).text(label, M.l + 28, oy, { width: CW - 28 });
  doc.font(FR).fontSize(8).fillColor(C.slate).text(desc, M.l + 28, doc.y, { width: CW - 28, lineGap: 1.5 });
  doc.moveDown(0.5);
}

/** Small tagged pill row */
function tagRow(items: string[], color = C.indigoMid) {
  let x = M.l;
  const rowY = cy();
  for (const item of items) {
    const tw = doc.widthOfString(item, { font: FR, size: 7 }) + 10;
    if (x + tw > PAGE.w - M.r) { doc.y += 14; x = M.l; }
    doc.save().rect(x, rowY, tw, 12).fill(color).restore();
    doc.font(FR).fontSize(7).fillColor(C.white).text(item, x + 5, rowY + 3, { lineBreak: false });
    x += tw + 4;
  }
  doc.y = rowY + 18;
  doc.moveDown(0.3);
}

/** Highlighted callout box */
function callout(text: string, color = C.violet, bgAlpha = "#ede9fe") {
  safeDown(50);
  const oy = cy();
  const lines = doc.heightOfString(text, { font: FI, size: 8.5, width: CW - 20 });
  const bh = lines + 18;
  doc.save().rect(M.l, oy, CW, bh).fill(bgAlpha).restore();
  doc.save().rect(M.l, oy, 4, bh).fill(color).restore();
  doc.font(FI).fontSize(8.5).fillColor(C.slate)
    .text(text, M.l + 12, oy + 8, { width: CW - 18, lineGap: 2 });
  doc.y = oy + bh + 6;
}

// ════════════════════════════════════════════════════════════════════════════
// COVER PAGE
// ════════════════════════════════════════════════════════════════════════════

// Full-bleed indigo background
doc.rect(0, 0, PAGE.w, PAGE.h).fill(C.indigo);
// Emerald lower third
doc.rect(0, PAGE.h * 0.60, PAGE.w, PAGE.h * 0.40).fill(C.emerald);
// Gold accent stripe at top
doc.rect(0, 0, PAGE.w, 6).fill(C.gold);
// Subtle diagonal stripe decoration
for (let i = 0; i < 8; i++) {
  doc.save().opacity(0.04)
    .moveTo(PAGE.w * 0.55 + i * 28, 0).lineTo(PAGE.w, PAGE.h * 0.55 - i * 22)
    .lineWidth(18).strokeColor(C.white).stroke().restore();
}

// Logo
const logoPath = fs.existsSync(LOGO_COVER) ? LOGO_COVER : (fs.existsSync(LOGO_ALIGN) ? LOGO_ALIGN : null);
if (logoPath) {
  doc.image(logoPath, PAGE.w / 2 - 56, 60, { width: 112, height: 112 });
}

// Platform names
doc.font(FB).fontSize(30).fillColor(C.white)
  .text("ThriveUp Academy", M.l, 196, { width: CW, align: "center" });
doc.font(FB).fontSize(13).fillColor(C.gold)
  .text("The Collaborative Advocate Foundation  ·  TCAF", M.l, 234, { width: CW, align: "center" });

// Tagline
doc.save().rect(M.l + 60, 268, CW - 120, 1).fill(C.gold).restore();
doc.font(FI).fontSize(11).fillColor("rgba(255,255,255,0.82)")
  .text("The Nonprofit for Nonprofits. Built from Community. Powered by Data.", M.l, 278, { width: CW, align: "center" });
doc.save().rect(M.l + 60, 298, CW - 120, 1).fill(C.gold).restore();

// 3-column meta block
const cols3 = [
  { label: "Division", val: "Community Development\nBehavioral Health · Workforce\nEducation · Justice · Health Equity" },
  { label: "Status", val: "Operational — Pilot\nTravis County, Texas\n50-State Architecture" },
  { label: "Scale", val: "15 Platforms  ·  271 Tables\n107 Languages  ·  4 AI Engines\n721 Grants Tracked" },
];
cols3.forEach(({ label, val }, i) => {
  const mx = M.l + i * (CW / 3);
  doc.font(FB).fontSize(7).fillColor(C.gold)
    .text(label.toUpperCase(), mx, 320, { width: CW / 3 - 6 });
  doc.font(FR).fontSize(8).fillColor("rgba(255,255,255,0.82)")
    .text(val, mx, 334, { width: CW / 3 - 6 });
});

// 15 platforms tag row on cover
const allPlatforms = [
  "Whole-Person Health","Talk Your Talk","Sankofa Network",
  "Black Maternal Health","Black Men's Health","HerHealth Network",
  "SafeCogniCare","Perfectly Different","LifeBridge",
  "Mission Transition","Minority Center of Excellence","ISSS",
  "RPLICE/BetterScience","SafeReport","Civic Signal",
];
let px = M.l; let py = 390;
doc.font(FR).fontSize(6.5).fillColor(C.gold).text("15 PUBLIC-FACING PLATFORMS:", M.l, py, { lineBreak: false });
py += 12;
for (const p of allPlatforms) {
  const tw = doc.widthOfString(p, { font: FR, size: 6.5 }) + 10;
  if (px + tw > PAGE.w - M.r) { py += 13; px = M.l; }
  doc.save().rect(px, py, tw, 11).fill("rgba(255,255,255,0.12)").restore();
  doc.font(FR).fontSize(6.5).fillColor("rgba(255,255,255,0.80)")
    .text(p, px + 5, py + 2, { lineBreak: false });
  px += tw + 3;
}

// Prepared by block in emerald section
const pbY = PAGE.h * 0.61 + 18;
doc.font(FB).fontSize(8).fillColor(C.gold).text("PREPARED BY", M.l, pbY, { width: CW });
doc.font(FB).fontSize(13).fillColor(C.white).text("The Collaborative Advocate Foundation (TCAF)", M.l, pbY + 14, { width: CW });
doc.font(FR).fontSize(9).fillColor("rgba(255,255,255,0.78)").text("Terry D. Flood, Ph.D., President", M.l, pbY + 32, { width: CW });
doc.font(FR).fontSize(8.5).fillColor("rgba(255,255,255,0.60)").text("terryflood@thrivingcommunitiesforall.com  ·  thriveup.app", M.l, pbY + 45, { width: CW });

// Three credential pillars
const credY = pbY + 68;
const credItems = [
  { t: "EIN 41-3618003", s: "IRS 501(c)(3) Public Charity" },
  { t: "SAM UEI KDDVD1FGLW35", s: "CAGE 209N1 · Active to 2027-05-06" },
  { t: "Two-Entity Strategy", s: "TCAF Nonprofit + ISS LLC (SBIR/STTR)" },
];
credItems.forEach(({ t, s }, i) => {
  const cx2 = M.l + i * (CW / 3);
  doc.save().rect(cx2, credY, CW / 3 - 6, 30).fill("rgba(0,0,0,0.20)").restore();
  doc.font(FB).fontSize(7.5).fillColor(C.gold).text(t, cx2 + 6, credY + 5, { width: CW / 3 - 14 });
  doc.font(FR).fontSize(7).fillColor("rgba(255,255,255,0.65)").text(s, cx2 + 6, credY + 17, { width: CW / 3 - 14 });
});

doc.font(FR).fontSize(7.5).fillColor("rgba(255,255,255,0.35)")
  .text("VERSION 1.0  ·  JUNE 2026  ·  CONFIDENTIAL  ·  INVESTMENT & PARTNERSHIP READY", M.l, PAGE.h - 30, { width: CW, align: "center", lineBreak: false });

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — STRATEGIC OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
newPage("Strategic Overview", "Page 1 of 5");

sectionBanner("Strategic Overview", C.indigo, "Mission · Vision · Problem · Market · Stakeholders · Solution");

h3("Mission");
callout(
  "To build, equip, and sustain the community infrastructure that nonprofits, service organizations, and the individuals they serve need — connecting people to funding, aligning service delivery with workforce development, and producing measurable community impact at every level of need.",
  C.indigo, "#e0e7ff"
);

h3("Vision");
body("A nation where every community organization has the data, technology, and partnerships to turn passion into lasting, provable impact — and every person has a structured growth pathway from their first moment of need to becoming a contributor in their community.");

hRule(); doc.moveDown(0.5);

h3("Executive Summary");
body(
  "ThriveUp Academy / TCAF is a national community-infrastructure platform — 15 public-facing service platforms, a 5-trade workforce simulation and credentialing engine, an 86-chunk AI knowledge base, and a live grant intelligence system tracking 721 opportunities — all under a single integrated architecture built to serve any U.S. county. " +
  "We are explicitly the nonprofit for nonprofits: organizations use ThriveUp to discover funding, train and credential their workforce, measure outcomes, navigate implementation science frameworks, and demonstrate impact to funders. Individuals use it to navigate benefits, build careers, access health services, and track their own growth journey through the ALIGN framework. " +
  "Currently piloting in Travis County, Texas through a two-entity structure — TCAF (501c3) + ISS LLC (SBIR/STTR-eligible for-profit) — with a Hub Adoption Kit designed for replication across all 50 states."
);

hRule(); doc.moveDown(0.4);

h3("Problem");
twoCol([
  { label: "For Nonprofits", body: "Most community organizations lack the grant intelligence, outcome measurement tools, and implementation-science frameworks needed to compete for federal funding and prove impact. Technology adoption barriers are high; platforms are expensive, siloed, and require English proficiency." },
  { label: "For Individuals & Families", body: "People navigating housing instability, workforce barriers, health disparities, justice involvement, foster care, and family crisis cycle through services without ever building a documented growth pathway. No existing platform tracks human development — only service delivery." },
  { label: "For Funders & Evaluators", body: "Funders see activity, not movement. Without a shared growth language and cross-sector outcome framework, community investment cannot demonstrate longitudinal transformation. Grant reporting is retrospective and siloed by program." },
  { label: "Cost of Inaction", body: "Communities continue to be served but not transformed. Funders lose confidence in community-based interventions. Organizations compete instead of coordinate. Shadow workers (promotoras, peer mentors, informal caregivers) go uncredited and unsupported." },
]);

safeDown(140);
hRule(); doc.moveDown(0.4);
h3("Market Opportunity");
twoCol([
  { label: "Market Size", body: "1.5M+ nonprofits in the U.S. 40M+ Americans living in poverty. $50B+ annually in federal community development, workforce, health, and justice funding. $4.5B WIOA. $9.8B Title IV-E." },
  { label: "Funding Landscape", body: "Federal streams: HHS, DOL, DOJ, HUD, USDA, NSF, VA, DOEd. State: HHSC, TWC. Private: RWJF, Annie E. Casey, W.K. Kellogg, JPMorgan Chase." },
  { label: "Policy Drivers", body: "SDOH equity mandates. FHIR interoperability requirements. DOL equity hiring agenda. Family First Prevention Services. Place-based investment strategies. AI literacy for workforce." },
  { label: "Timing", body: "Post-COVID recovery infrastructure investment. Funder shift from activity reporting to outcome evidence. Growing demand for cross-sector frameworks. SBIR/STTR expansion for nonprofit-adjacent LLCs." },
]);

safeDown(180);
hRule(); doc.moveDown(0.4);
h3("Stakeholders");
const stk = [
  ["Individuals & Families", "Adults navigating housing, workforce, health, justice re-entry, foster care aging-out, and family crisis — in 107 languages and dialects."],
  ["Nonprofit Organizations", "CBOs, faith communities, CHW networks, workforce programs, social enterprises — using TCAF to find funding, train staff, and measure outcomes."],
  ["Government Agencies", "City/county human services, state workforce and health agencies, federal grantmakers — using TCAF data for accountability and co-investment."],
  ["Researchers & Evaluators", "Implementation scientists, university partners, think tanks — using CFIR/RE-AIM/EPIS tools and outcomes data for publication and policy."],
  ["Funders & Philanthropists", "Foundation program officers, federal grant officers, impact investors — using TCAF evidence packages and ALIGN community dashboards."],
  ["Shadow Workers", "Informal caregivers, promotoras, peer mentors, driveway journeymen — credentialed and stipended through the ITI model."],
  ["Industry & Employers", "Healthcare systems, employers with equity commitments, CDFIs — accessing workforce pipeline, apprenticeship, and hiring data."],
  ["Communities", "Neighborhoods, zip codes, coalitions — tracking THRIVE Index scores and phase gap analysis for collective impact planning."],
];
stk.forEach(([label, desc]) => {
  safeDown(28);
  const sy = cy();
  doc.save().rect(M.l, sy, 3, 16).fill(C.violet).restore();
  doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(label + ":", M.l + 8, sy, { width: 130, lineBreak: false });
  doc.font(FR).fontSize(8.5).fillColor(C.slate).text(desc, M.l + 145, sy, { width: CW - 145, lineGap: 1.5 });
  doc.moveDown(0.4);
});

// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — PROGRAMS & PLATFORM CAPABILITIES
// ════════════════════════════════════════════════════════════════════════════
newPage("Programs & Platform Capabilities", "Page 2 of 5");

sectionBanner("Programs & Platform Capabilities", C.emerald, "15 Platforms · Training & Simulation · Education · Research");

// The 15 platforms in a grid
h3("The 15 Public-Facing Service Platforms");
body("TCAF operates 15 integrated platforms across six service domains. Each platform is a distinct public-facing service; all share the same AI infrastructure, 107-language interface, grant alignment layer, and outcome reporting system.");

const platforms = [
  { name: "Whole-Person Health (WPH)", domain: "Health Equity", desc: "Behavioral safety floor. Longitudinal SDOH screening. PHQ-9, GAD-7, C-SSRS, PCL-5, ACES validated instruments." },
  { name: "Talk Your Talk (TYT)", domain: "Civic Engagement", desc: "talkyourtalk.net — 89 spoken + 18 signed dialects = 107 total. AAVE, Spanglish, ASL, LSM, regional dialects honored. RTL layout for Arabic/Hebrew." },
  { name: "Sankofa Network", domain: "Health / Community", desc: "Cultural health platform rooted in African heritage and community-based healing traditions. Bridges clinical services and community wisdom." },
  { name: "Black Maternal Health Network", domain: "Health Equity", desc: "Focused maternal health navigation, doula/midwife directories, prenatal screening, and maternal mortality risk reduction tools." },
  { name: "Black Men's Health Hub", domain: "Health Equity", desc: "Health navigation, preventive care, and mental health resources specifically designed for and by Black men and their communities." },
  { name: "HerHealth Network", domain: "Health Equity", desc: "Holistic Black Feminine Health Hub. Integrative health, reproductive justice, and advocacy resources. Consent-first design." },
  { name: "SafeCogniCare", domain: "Behavioral Health", desc: "Cognitive health and dementia navigation for individuals, families, and caregivers. Caregiver burnout screening and resource routing." },
  { name: "Perfectly Different", domain: "Disability / IDD", desc: "Disability and intellectual/developmental disability platform. Accessibility-first design. SSI/SSDI navigation. Self-advocacy tools." },
  { name: "LifeBridge", domain: "SDOH Navigation", desc: "Social determinants of health navigation hub. Benefits screening (9+ programs/session). Warm referral handoffs. Used as ALIGN on-ramp." },
  { name: "Mission Transition (M2C)", domain: "Veterans", desc: "Military-to-civilian transition platform. Benefits, employment, housing, and SDOH navigation for veterans and service members." },
  { name: "Minority Center of Excellence", domain: "Community", desc: "Technical assistance and capacity-building hub for minority-serving orgs. Grant readiness, data literacy, coalition building." },
  { name: "ISSS", domain: "Youth / Education", desc: "Integrated Supports for Thriving Youth. Multi-agency case management. Foster youth transition. 50-state policy comparator." },
  { name: "RPLICE / BetterScience", domain: "Research", desc: "Research-to-Practice Lifecycle Implementation & Community Evidence. CFIR/RE-AIM/EPIS tooling. MAP-GAP CQI. Outcomes reporting." },
  { name: "SafeReport", domain: "Clinical / Behavioral Health", desc: "safereports.net — Compliance-grade AI for clinical settings. FHIR/CDS-Hooks interoperability. 0-PHI-egress. HITL-default-on." },
  { name: "Civic Signal", domain: "Civic Engagement", desc: "Civic engagement, advocacy tracking, and policy navigation. Community voice amplification. Election and policy information hub." },
];

const domainColors: Record<string, string> = {
  "Health Equity": C.ruby, "Behavioral Health": C.emeraldMid, "SDOH Navigation": C.emeraldLt,
  "Civic Engagement": C.indigoLt, "Research": C.violet, "Clinical / Behavioral Health": C.emerald,
  "Health / Community": C.gold, "Youth / Education": C.goldLt, "Veterans": C.indigo,
  "Disability / IDD": C.indigoMid, "Community": C.violet,
};

platforms.forEach((p, i) => {
  safeDown(38);
  const py2 = cy();
  const dColor = domainColors[p.domain] || C.indigo;
  doc.save().rect(M.l, py2, 2, 26).fill(dColor).restore();
  doc.save().rect(M.l + 2, py2, 90, 12).fill(dColor).restore();
  doc.font(FB).fontSize(6.5).fillColor(C.white)
    .text(p.domain.toUpperCase(), M.l + 5, py2 + 3, { width: 86, lineBreak: false });
  doc.font(FB).fontSize(8.5).fillColor(dColor).text(p.name, M.l + 8, py2 + 14, { width: CW - 10 });
  doc.font(FR).fontSize(7.5).fillColor(C.slate).text(p.desc, M.l + 8, doc.y, { width: CW - 12, lineGap: 1.5 });
  doc.moveDown(0.55);
});

// ── Training & Simulation ─────────────────────────────────────────────────────
safeDown(50); hRule(); doc.moveDown(0.5);
h3("Training & Simulation — ThriveUp Academy Trade Sims");
body("Five industry-grade physics simulations with 15 lessons each (75 total), AI-powered tutoring in 10 languages, and integrated credential routing. This is workforce simulation, not diagrams — four distinct physics engines running real calculations.");

const trades = [
  { name: "Electrical", engine: "Modified Nodal Analysis (MNA) DC Solver", standard: "Standard undergraduate EE solver", creds: "OSHA 10, IBEW/NECA apprenticeship, NCCER L1" },
  { name: "Automotive", engine: "MNA via Adapter (automotive component-defs)", standard: "Reuses electrical solver — engineering-clean reuse", creds: "ASE G1, OEM Tech apprenticeship, NCCER" },
  { name: "Plumbing", engine: "Hardy-Cross Newton-Raphson Flow Solver", standard: "Standard civil/mechanical pipe-network solver", creds: "TSBPE apprenticeship, UA pathway, NCCER L1" },
  { name: "Welding", engine: "Heat-Input Evaluator", standard: "Per AWS D1.1 §5.7 Structural Welding Code", creds: "AWS SENSE, AWS D1.1, Iron Workers apprenticeship" },
  { name: "HVAC", engine: "Thermal-Airflow Engine", standard: "Thermal equilibrium + duct flow model", creds: "EPA 608 Universal, NATE RTW, SMART pathway" },
];

trades.forEach((t, i) => {
  safeDown(30);
  const ty = cy();
  doc.save().rect(M.l, ty, 24, 20).fill(C.indigoMid).restore();
  doc.font(FB).fontSize(7).fillColor(C.white).text(t.name.slice(0, 4).toUpperCase(), M.l + 2, ty + 6, { width: 22, align: "center", lineBreak: false });
  doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(t.name, M.l + 30, ty, { width: 100 });
  doc.font(FR).fontSize(7.5).fillColor(C.muted).text("Engine: " + t.engine + " — " + t.standard, M.l + 30, doc.y, { width: CW - 32 });
  doc.font(FR).fontSize(7.5).fillColor(C.slate).text("Credentials: " + t.creds, M.l + 30, doc.y, { width: CW - 32 });
  doc.moveDown(0.45);
});

body("Credential routing fires at 80% lesson completion — not aspirational. 3 industry credentials + 2–3 registered apprenticeship pathways per trade. 9 certifications total across OSHA, NCCER, AWS, ASE, EPA, NATE, TDLR, TSBPE.");

safeDown(60); hRule(); doc.moveDown(0.4);
h3("Education & Academy — ThriveUp Academy Learning Engine");
twoCol([
  { label: "Live Economic Simulation", body: "academyWallets · academyStocks · academyPortfolios — real market simulation for learners. academyCompetitions for gamified cohorts. academyMerchOrders for real fulfillment loops." },
  { label: "Financial & Civic Literacy", body: "academyLifeLessons: financial literacy, civic engagement, SDOH navigation, health literacy. academyPantherPower: GAM-ready merit scoring for behavioral economics." },
  { label: "Branching Narrative Scenarios", body: "academyScenarios + nodes + logs: interactive branching stories for FAFSA, foster care, workforce choices. Full behavioral audit trail (academy_choice_logs)." },
  { label: "FAFSA & College Access", body: "FAFSA navigation, financial aid literacy, college application support, Chafee/ETV for foster youth, scholarship search with AI fit-scoring." },
]);

safeDown(80); hRule(); doc.moveDown(0.4);
h3("Research & Implementation Science — RPLICE / BetterScience");
body("TCAF operationalizes evidence-based frameworks in code — not theater. Implementation science is not a buzzword here; it is the architecture.");
twoCol([
  { label: "CFIR 2.0 — 39 Constructs", body: "5 CFIR domains, 39 constructs operationalized in research-hub.tsx. Scoring rubrics in standards-routes.ts mapping capabilities to NRRC and CFIR 2.0 fidelity benchmarks." },
  { label: "RE-AIM Community Evaluation", body: "Reach · Effectiveness · Adoption · Implementation · Maintenance framework applied at the community level through the ALIGN THRIVE phase." },
  { label: "EPIS Org Readiness", body: "Exploration · Preparation · Implementation · Sustainment framework tracking organizational readiness across ALIGN Mission·Culture·Capacity phases." },
  { label: "RNR / CBI / NRRC — Justice", body: "Risk-Need-Responsivity assessments, Cognitive Behavioral Intervention programs, and NRRC outcome reports — production-grade reentry stack for justice-involved populations." },
  { label: "MAP-GAP CQI", body: "1,705-line continuous quality improvement system identifying and prioritizing ecosystem gaps. Drives funder recruitment and partner coordination." },
  { label: "RPLICE Bridge", body: "Auto-routes RPLICE analysis findings to relevant platform domains (e.g., behavioral health findings → SafeReport). Cross-platform intelligence layer." },
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — TECHNOLOGY, IP & COMPETITIVE ADVANTAGE
// ════════════════════════════════════════════════════════════════════════════
newPage("Technology, IP & Competitive Advantage", "Page 3 of 5");

sectionBanner("Technology Architecture & Intellectual Property", C.indigoMid);

h3("AI Stack — We Don't Use AI. We Orchestrate It.");
body("Four AI engines in collaborative synthesis — not a single-vendor wrapper. Any one engine outage doesn't break the session. All calls auto-wrapped in Ethical/EI Preamble: truth + primary sources, no PII echo, plain-language/dialect-honoring, safety handoff (988/911), margin-community-first defaults, decision-support not decision-maker.");
twoCol([
  { label: "4-Engine Collaborative AI", body: "Gemini 2.0 Flash · Claude Haiku 4.5 · GPT-4o-mini · OpenRouter DeepSeek R1. Resilience architecture: engine failover is automatic. ai-provider.ts wraps all calls idempotently." },
  { label: "86-Chunk RAG Engine", body: "Grounded in TCAF's own active-commitment documents — not the generic web. Relevant platform docs, evidence registry, and grant intelligence feed the knowledge base." },
  { label: "Trade Sims AI Tutor", body: "Two modes: Socratic-hint (never gives the answer — teaches) and ensemble-debrief (multi-engine synthesis after lesson completion). Available in 10 languages." },
  { label: "Dialect-Aware Translation", body: "107 languages/dialects. Preserves AAVE, Spanglish, and regional dialects — not just literal translation. RTL layout auto-applied for Arabic/Hebrew." },
  { label: "AI Grant Intelligence", body: "Tier-weighted keyword scoring (Tier1 like 'PHI-safe' = +10, 'HITL' = +12) + semantic AI fit-analysis. 721 grants tracked across SAM.gov, Grants.gov, USASpending.gov." },
  { label: "AI Risk + Early-Warning", body: "Foster youth 4-domain risk engine (housing/food/mental-health/documents). Early-warning engine triggering intervention playbooks. RPLICE analysis auto-routing." },
]);

safeDown(60); hRule(); doc.moveDown(0.4);
h3("Platform Scale (Primary-Source Verified, 2026-05-22)");
const scaleItems = [
  ["271", "Drizzle/PostgreSQL database tables"],
  ["211", "Frontend page files"],
  ["84", "Server route/logic files"],
  ["206", "Registered wouter client routes"],
  ["721", "Grants tracked (SAM.gov, Grants.gov, USASpending.gov, state/foundation/corporate)"],
  ["75", "Trade simulation lessons (5 trades × 15 lessons each)"],
  ["107", "Languages/dialects (89 spoken + 18 signed)"],
  ["4", "Physics engines (MNA, Hardy-Cross, AWS D1.1, thermal-airflow)"],
  ["86", "RAG knowledge chunks"],
  ["15", "Public-facing service platforms"],
  ["39", "CFIR constructs operationalized in code"],
  ["9", "Industry credentials routed at completion (OSHA, NCCER, AWS, ASE, EPA, NATE)"],
];
const colWs = 45;
const colW3 = CW - colWs - 10;
scaleItems.forEach(([num, label]) => {
  safeDown(16);
  const sy = cy();
  doc.save().rect(M.l, sy, colWs, 14).fill(C.indigo).restore();
  doc.font(FB).fontSize(10).fillColor(C.gold)
    .text(num, M.l, sy + 1, { width: colWs, align: "center", lineBreak: false });
  doc.font(FR).fontSize(8.5).fillColor(C.slate)
    .text(label, M.l + colWs + 10, sy + 3, { width: colW3, lineBreak: false });
  doc.moveDown(0.7);
});

safeDown(80); hRule(); doc.moveDown(0.4);
h3("Intellectual Property");
twoCol([
  { label: "ALIGN Framework", body: "Proprietary 6-phase growth framework (Assess → Listen → Integrate → Guide → Navigate → THRIVE). Spirit · Soul · Body 3-domain holistic scoring. Dr. Terry Flood, Ph.D., author." },
  { label: "Integration Through Invitation (ITI)", body: "8-layer consent architecture — all defaults OFF. Shadow worker credentialing, stipend pathways, witness loop always on. Named 2026-05-24. Community governance model." },
  { label: "Trade Physics Engines", body: "MNA DC solver, Hardy-Cross Newton-Raphson, AWS D1.1 heat-input evaluator, thermal-airflow engine. 4 distinct industry-grade calculation engines — not simulated." },
  { label: "Five-Lens Design Doctrine", body: "Implementation science + psychology + data engineering + CHW + UX design — held simultaneously in every platform decision. Constitutional design protocol." },
  { label: "Community THRIVE Index", body: "Aggregate community scoring: individual phase distribution + org capacity averages + phase gap analysis → single community-level indicator." },
  { label: "Shadow Worker Credentialing Model", body: "Pathway from informal community contribution (promotora, peer mentor, driveway journeyman) to formal recognition, stipend, and industry credential." },
]);

safeDown(80); hRule(); doc.moveDown(0.4);
h3("Why We Win");
bullet([
  "We are the nonprofit for nonprofits — one platform gives a CBO grant intelligence, workforce simulation, outcome measurement, and implementation science tools simultaneously.",
  "We track human growth, not just service delivery — individual + organizational + community layers in a single evidence framework.",
  "Four real physics engines (MNA, Hardy-Cross, AWS D1.1, thermal-airflow) — workforce simulation no other community platform offers.",
  "107 languages with dialect preservation — the communities with the greatest need aren't asked to flatten their voice to use the platform.",
  "ITI consent architecture earns trust in communities where extractive data practices have caused lasting harm.",
  "Two-entity strategy (TCAF 501c3 + ISS LLC SBIR/STTR) means we can pursue federal contracts, set-asides, and grant streams most single-entity orgs can't access.",
  "721 grants tracked with tier-weighted AI fit-scoring — we can find our funders, and we can help our partner orgs find theirs.",
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 4 — TRACTION, IMPACT, REVENUE & VALIDATION
// ════════════════════════════════════════════════════════════════════════════
newPage("Traction, Impact, Revenue & Validation", "Page 4 of 5");

sectionBanner("Traction · Revenue · Impact Framework · Validation", C.emerald);

h3("Current Operational Status");
[
  ["Platform", "Operational — live at thriveup.app and lifetransitionsaid.org/thriveup/align"],
  ["Deployment", "Active pilot — Travis County, TX (Williamson, Hays, Bastrop, Caldwell counties in scope)"],
  ["Entity Status", "TCAF 501(c)(3) determined 2026-01-14 · ISS LLC active · SAM.gov ACTIVE both entities"],
  ["Active Partners", "Minority Center of Excellence · LifeBridge · SafeCogniCare · El Buen Samaritano · North Wilco Childcare Coalition"],
  ["Grant Pipeline", "721 tracked opportunities · Fit ≥70 = 208 · ≥80 = 186 · ≥90 = 160 · Active pursuit queue maintained"],
  ["Codebase", "271 tables · 211 pages · 84 server files · 206 routes — all primary-source-verified 2026-05-22"],
].forEach(([k, v]) => kv(k, v, 95));

hRule(); doc.moveDown(0.4);
h3("Revenue Model");
body("TCAF is designed for financial sustainability from multiple independent streams — no single funder controls more than 40% of operating revenue by policy.");

const revStreams = [
  { num: "1", label: "Federal & Foundation Grants", desc: "HHS, DOL, DOJ, HUD, USDA, NSF, VA, DOEd, and private foundation grants. Multi-year grants prioritized. Active pipeline across SAM.gov, Grants.gov, USASpending.gov." },
  { num: "2", label: "Hub Adoption Kit — SaaS Licensing", desc: "Packaged platform license for counties, states, or regional community infrastructure operators to deploy their own ThriveUp Hub. Recurring SaaS revenue independent of grant cycles." },
  { num: "3", label: "Government Service Contracts", desc: "Direct service contracts with city, county, and state agencies for benefits navigation, workforce simulation, community health, and SDOH navigation. NAICS 624190 primary." },
  { num: "4", label: "SBIR / STTR (ISS LLC)", desc: "ISS LLC (UEI C7YDV3P8EHL7, CAGE 9VKK3) is SBIR/STTR-eligible. AI tutoring engine, physics simulation, and dialect-aware translation are viable SBIR Phase I/II candidates." },
  { num: "5", label: "Research Partnerships", desc: "University and think-tank partnerships for evaluation design, data access (with ITI consent), co-publication, and implementation science training. Overhead-eligible on federal research grants." },
];
revStreams.forEach(({ num, label, desc }) => {
  safeDown(38);
  const ry = cy();
  doc.save().rect(M.l, ry, 20, 20).fill(C.emerald).restore();
  doc.font(FB).fontSize(9).fillColor(C.gold).text(num, M.l + 2, ry + 5, { width: 18, align: "center", lineBreak: false });
  doc.font(FB).fontSize(9).fillColor(C.emerald).text(label, M.l + 26, ry, { width: CW - 28 });
  doc.font(FR).fontSize(8).fillColor(C.slate).text(desc, M.l + 26, doc.y, { width: CW - 28, lineGap: 1.5 });
  doc.moveDown(0.5);
});

safeDown(80); hRule(); doc.moveDown(0.4);
h3("Impact Framework");
const impact = [
  { label: "Inputs", body: "Org assessments, individual journeys, benefits screened, program data, grant intelligence, workforce completions, research data — all primary-source, ITI-consented." },
  { label: "Activities", body: "ALIGN journey facilitation · benefits navigation · trade simulation + credentialing · grant intelligence + proposal writing · org capacity building · community coalitions · clinical screening." },
  { label: "Outputs", body: "ALIGN phase advancement events · org capacity scores · benefits matches · credential completions · grants submitted · clinical screenings completed · coalition events · community THRIVE Index scores." },
  { label: "Outcomes", body: "Individuals advancing from crisis to stability to contribution · orgs increasing grant-readiness and capacity scores · practitioners credentialed · communities reducing phase coverage gaps." },
  { label: "Long-Term Impact", body: "A national ecosystem of community organizations equipped to compete for federal funding, measure outcomes, and demonstrate transformation — not just service delivery volume." },
  { label: "KPIs", body: "% individuals advancing ≥1 ALIGN phase per 90 days · % org assessments showing capacity increase · credential completions per quarter · grant win rate · community THRIVE Index trend." },
];
impact.forEach(({ label, body: bdy }) => {
  safeDown(28);
  const iy = cy();
  doc.save().rect(M.l, iy, 3, 18).fill(C.gold).restore();
  doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(label, M.l + 9, iy, { width: 85, lineBreak: false });
  doc.font(FR).fontSize(8).fillColor(C.slate).text(bdy, M.l + 100, iy, { width: CW - 100, lineGap: 1.5 });
  doc.moveDown(0.45);
});

safeDown(80); hRule(); doc.moveDown(0.4);
h3("Validation Strategy");
twoCol([
  { label: "Implementation Science", body: "CFIR 39 constructs + RE-AIM community evaluation + EPIS org readiness scoring. Standards-routes.ts maps TCAF capabilities to NRRC and CFIR 2.0 fidelity benchmarks." },
  { label: "Justice Stack Validation", body: "RNR assessments + CBI programs + NRRC outcome reports — the gold standard in criminal justice corrections. Recidivism baselines tracked over time." },
  { label: "Clinical Validation", body: "PHQ-9, GAD-7, C-SSRS, PCL-5, ACES validated instruments in SafeReport. FHIR/CDS-Hooks clinical interoperability. HITL-default-on." },
  { label: "Continuous Improvement", body: "MAP-GAP CQI (1,705 lines) identifies ecosystem gaps. Quarterly data review. Phase transition data identifies which resources advance people fastest." },
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 5 — ROADMAP, PARTNERSHIPS & INVESTMENT
// ════════════════════════════════════════════════════════════════════════════
newPage("Roadmap, Partnerships & Investment", "Page 5 of 5");

sectionBanner("Roadmap · Partnerships · Risk · Investment Ask", C.indigoMid);

h3("12-Month Objectives (2026–2027)");
twoCol([
  { label: "Technology", body: "Mobile offline mode (Q4 2026). HMIS integration. Unite Us bidirectional referral sync. FHIR CDS-Hooks live clinical integration. 6th trade simulation (HVAC complete)." },
  { label: "Orgs & Users", body: "50+ organizations completing ALIGN assessments. 500+ individual journeys active. 5 Hub Adoption Kit deployments initiated. SDVOSB certification filed (TCAF)." },
  { label: "Research", body: "First case study publication (Q3 2026). Peer-reviewed submission on ALIGN framework. University research partnership signed. CFIR fidelity baseline published." },
  { label: "Revenue", body: "First Hub licensing agreements. 3 government service contracts. SBIR Phase I submitted. $500K+ ARR target. Federal agency pilot designation." },
]);

h3("24-Month Objectives (2027–2028)");
twoCol([
  { label: "Scale", body: "Hub Adoption Kit deployed in 5+ additional counties/regions outside Texas. 2 state government partnerships signed." },
  { label: "Validation", body: "Peer-reviewed publication of ALIGN framework efficacy. Title IV-E Clearinghouse evaluation submitted. SBIR Phase II awarded." },
  { label: "Revenue", body: "$1M+ ARR. Federal HHS/DOL agency recognition. GSA Schedule (ISS LLC). DOL/HHS pilot designation." },
  { label: "Platforms", body: "3 additional specialized platforms launched. SafeReport Epic integration live. RPLICE national implementation science community launched." },
]);

h3("36-Month Vision");
bullet([
  "National: Hub Adoption Kit active in all 50 states. Federal government strategic partner (HHS, DOL, DOJ, HUD).",
  "SDVOSB: VA sole-source contracts (up to $5M services) once SBA VetCert certification complete.",
  "Research: TCAF-affiliated publication stream. National CFIR/RE-AIM training and certification program.",
  "Platform Evolution: AI-driven phase prediction · peer mentor matching algorithm · employer direct hiring pipeline.",
  "International: ALIGN framework adapted for Central America, Caribbean, West Africa.",
  "Financial: $5M ARR through diversified streams — grants, contracts, licensing, research, SBIR.",
]);

safeDown(120); hRule(); doc.moveDown(0.4);
h3("Partnership Opportunities");
twoCol([
  { label: "Funding Partners", body: "Robert Wood Johnson Foundation, Annie E. Casey, W.K. Kellogg, JPMorgan Chase, HHS, DOL, HUD, DOJ, NSF, VA, DOEd." },
  { label: "Research Partners", body: "UT Austin, Texas A&M, Morehouse School of Medicine, Howard University, RAND Corporation, implementation science institutes." },
  { label: "Technology Partners", body: "Epic Health Systems (FHIR), Salesforce.org NPSP, Unite Us, Microsoft Azure AI, AWS Nonprofit Credits, Socrata/Tyler." },
  { label: "Government Partners", body: "Texas HHSC, Travis County, City of Austin, HUD, DOL ETA, AmeriCorps, SAMHSA, ACF." },
  { label: "Community Partners", body: "Faith networks, HBCUs, tribal nations, promotora networks, CHW associations, peer specialist networks, Boys & Girls Clubs." },
  { label: "Industry Partners", body: "Healthcare systems, equity employers, CDFIs, workforce intermediaries, apprenticeship sponsors (IBEW, UA, ABC, Iron Workers, SMART)." },
]);

safeDown(120); hRule(); doc.moveDown(0.4);
h3("Risk Management");
[
  ["Grant funding concentration", "No single grant >40% of operating revenue by policy. Hub licensing and government contracts diversify the base. Two-entity structure enables SBIR/STTR."],
  ["Technology sustainability", "TCAF holds the IP. ISS LLC licenses it. Hub Adoption Kit creates earned revenue independent of TCAF operating budget."],
  ["Community data trust", "ITI architecture: 8 consent layers, all defaults OFF. Full data portability. Zero PHI egress. Witness log available to all data contributors."],
  ["Adoption resistance", "Complement positioning — TCAF fills the gap existing platforms leave (growth tracking + grant intelligence), not replace them. Demonstrated in every public surface."],
].forEach(([risk, mit]) => {
  safeDown(38);
  const ry = cy();
  doc.save().rect(M.l, ry, CW, 0.5).fill(C.border).restore(); doc.moveDown(0.25);
  doc.font(FB).fontSize(8).fillColor(C.ruby).text("Risk: ", M.l, cy(), { continued: true });
  doc.font(FR).fontSize(8).fillColor(C.slate).text(risk);
  doc.font(FB).fontSize(8).fillColor(C.emeraldMid).text("Mitigation: ", M.l, cy(), { continued: true });
  doc.font(FR).fontSize(8).fillColor(C.slate).text(mit);
  doc.moveDown(0.4);
});

safeDown(130); hRule(); doc.moveDown(0.4);
h3("Investment Need");
twoCol([
  { label: "Capital Requested", body: "$2.5M over 24 months — grants, impact investment, and/or government service contract." },
  { label: "Use of Funds", body: "Technology & integrations 40% · Community outreach & org onboarding 25% · Research & evaluation 20% · Operations & team 15%." },
  { label: "Expected Outcomes", body: "50+ org assessments · 500+ individual journeys · 5 Hub deployments · 2 peer-reviewed publications · 9 government/foundation grants." },
  { label: "Milestones", body: "Q3 2026 — case study · Q4 2026 — mobile offline · Q1 2027 — first Hub license · Q4 2027 — 5 Hub deployments · Q2 2028 — Title IV-E clearinghouse submission." },
]);

safeDown(110);
h3("Strategic Ask");
bullet([
  "Funding: $2.5M seed/growth capital — grants, impact investment, or government service contracts.",
  "Pilot Participation: Organizations willing to complete ALIGN assessments and share outcome data under ITI consent.",
  "Research Collaboration: University partners for evaluation design, peer-reviewed publication, and framework validation.",
  "Technology Integration: EHR, HMIS, and referral platform partners for bidirectional FHIR/CDS-Hooks data interoperability.",
  "Strategic Advisory: Implementation scientists, equity-focused policy advocates, apprenticeship sponsors, and community organizers.",
  "Shadow Worker Recognition: Employers and credentialing bodies willing to accept TCAF-issued ITI credentials for informal community workers.",
]);

// ── Closing callout ──────────────────────────────────────────────────────────
safeDown(90);
const csY = cy();
const csText = "If ThriveUp Academy succeeds, every nonprofit in America will have what TCAF has: the grant intelligence to find funding, the simulation tools to train and credential a workforce, the research frameworks to prove impact, and the human growth tracking to show funders not just what they funded — but what changed. The nonprofit for nonprofits. Built from community. Powered by data.";
const csh = doc.heightOfString(csText, { font: FI, size: 9, width: CW - 22 }) + 24;
doc.save().rect(M.l, csY, CW, csh).fill("#ede9fe").restore();
doc.save().rect(M.l, csY, 5, csh).fill(C.violet).restore();
doc.font(FB).fontSize(8.5).fillColor(C.violet).text("Closing Statement", M.l + 14, csY + 8, { width: CW - 20 });
doc.font(FI).fontSize(9).fillColor(C.slate).text(csText, M.l + 14, csY + 22, { width: CW - 20, lineGap: 2 });
doc.y = csY + csh + 8;

// ════════════════════════════════════════════════════════════════════════════
// APPENDIX — LEADERSHIP & FEDERAL CREDENTIALS
// ════════════════════════════════════════════════════════════════════════════
newPage("Appendix — Leadership & Federal Credentials", "Appendix");

sectionBanner("Appendix: Leadership · Federal Credentials · Entity Structure", C.slate);

h3("Leadership");
kv("Name", "Terry D. Flood, Ph.D.", 130);
kv("Title", "President, The Collaborative Advocate Foundation (TCAF)  |  CEO, Integrated Services & Solutions LLC (ISS LLC)", 130);
kv("Background", "Implementation scientist · Psychologist · Data engineer · Community health worker · User-centered designer. Medically retired U.S. veteran (service-connected disability, MS). Active U.S. Government Secret-level clearance.", 130);
kv("Contact", "terryflood@thrivingcommunitiesforall.com  ·  254-319-8460", 130);
kv("Address", "17912 Stefano Drive, Pflugerville, TX 78660-7020", 130);

hRule(); doc.moveDown(0.4);
h3("Federal Entity Credentials (Primary-Source Verified, SAM.gov)");

const entities = [
  {
    name: "The Collaborative Advocate Foundation (TCAF)",
    items: [
      ["Legal Name", "The Collaborative Advocate Foundation"],
      ["EIN", "41-3618003  |  Name Control: THEC"],
      ["501(c)(3)", "Determined 2026-01-14  ·  Public Charity §170(b)(1)(A)(vi)"],
      ["SAM UEI", "KDDVD1FGLW35"],
      ["CAGE", "209N1"],
      ["SAM Status", "ACTIVE through 2027-05-06"],
      ["Eligible For", "Federal grants, foundation grants, state grants, nonprofit set-asides"],
      ["NAICS", "624190 (primary) · 624229 · 923120 · 611430 · 541611 · 541690 · 541720"],
    ],
    color: C.indigo,
  },
  {
    name: "Integrated Services & Solutions LLC (ISS LLC)",
    items: [
      ["Legal Name", "Integrated Services & Solutions LLC"],
      ["EIN", "87-2795417"],
      ["Entity Type", "For-profit LLC (subsidiary/partner entity)"],
      ["SAM UEI", "C7YDV3P8EHL7"],
      ["CAGE", "9VKK3"],
      ["SAM Status", "ACTIVE through 2027-03-30"],
      ["Eligible For", "SBIR/STTR, GSA Schedule, for-profit set-asides, government contracts"],
      ["SDVOSB", "SDVOSB certification pending — SBA VetCert application in progress (Dr. Flood, medically retired)"],
    ],
    color: C.emerald,
  },
];

entities.forEach(({ name, items, color }) => {
  safeDown(100);
  const ey = cy();
  doc.save().rect(M.l, ey, CW, 16).fill(color).restore();
  doc.font(FB).fontSize(9).fillColor(C.white).text(name, M.l + 8, ey + 4, { width: CW - 16 });
  doc.moveDown(1.1);
  items.forEach(([k, v]) => kv(k, v, 120));
  doc.moveDown(0.3);
});

safeDown(60); hRule(); doc.moveDown(0.4);
h3("Two-Entity Strategy");
callout(
  "TCAF (nonprofit) pursues grants, foundation funding, and nonprofit set-aside contracts. ISS LLC (for-profit) pursues SBIR/STTR, GSA Schedule, and government service contracts. Both entities share the ThriveUp platform IP under a licensing agreement — clean financial firewall, no co-mingling, maximum funding eligibility. This structure is unusual in early-stage community organizations and signals operational sophistication to federal program officers.",
  C.indigoMid, "#e0e7ff"
);

safeDown(60); hRule(); doc.moveDown(0.4);
h3("SDVOSB Advantage");
body(
  "Dr. Flood is a medically retired, service-connected disabled veteran (MS). Once SBA VetCert SDVOSB certification is filed and approved, VA statute requires SDVOSB set-asides first (Veterans First Contracting Program). Sole-source authority up to $5M in services. This is the most powerful unlocked competitive advantage in the current pipeline."
);

// ── Finalize ──────────────────────────────────────────────────────────────────
doc.end();
stream.on("finish", () => console.log("✅  PDF written to:", OUT));
stream.on("error",  (e) => { console.error("❌", e); process.exit(1); });
