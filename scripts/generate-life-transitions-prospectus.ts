import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "attached_assets", "LifeTransitions-ALIGN-Prospectus.pdf");

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  indigo:    "#1e1b4b",
  indigoMid: "#312e81",
  emerald:   "#064e3b",
  emeraldMid:"#065f46",
  gold:      "#b45309",
  white:     "#ffffff",
  offWhite:  "#f8fafc",
  slate:     "#334155",
  muted:     "#64748b",
  border:    "#e2e8f0",
  accent:    "#7c3aed",
};

const PAGE = { w: 612, h: 792 };
const M = { t: 48, b: 48, l: 50, r: 50 };
const CW = PAGE.w - M.l - M.r;   // content width = 512

// ── Fonts ─────────────────────────────────────────────────────────────────────
const F = {
  bold: "Helvetica-Bold",
  reg:  "Helvetica",
  obl:  "Helvetica-Oblique",
};

const doc = new PDFDocument({ size: "LETTER", margin: 0, bufferPages: true });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

// ── Helpers ───────────────────────────────────────────────────────────────────
function y() { return doc.y; }

function hRule(color = C.border, lw = 0.5) {
  doc.save().strokeColor(color).lineWidth(lw)
    .moveTo(M.l, y()).lineTo(PAGE.w - M.r, y()).stroke().restore();
}

function sectionBadge(label: string, color = C.indigo) {
  const bw = 6; const bh = 11;
  doc.save()
    .rect(M.l, y(), CW, bh + 10).fill(color)
    .font(F.bold).fontSize(7).fillColor(C.white)
    .text(label.toUpperCase(), M.l + 10, y() + 7, { lineBreak: false })
    .restore();
  doc.moveDown(1.2);
}

function h1(text: string, color = C.indigo) {
  doc.font(F.bold).fontSize(18).fillColor(color).text(text, M.l, y(), { width: CW });
  doc.moveDown(0.4);
}

function h2(text: string, color = C.indigoMid) {
  doc.font(F.bold).fontSize(11).fillColor(color).text(text, M.l, y(), { width: CW });
  doc.moveDown(0.2);
}

function h3(text: string, color = C.slate) {
  doc.font(F.bold).fontSize(8.5).fillColor(color).text(text.toUpperCase(), M.l, y(), { width: CW });
  doc.moveDown(0.15);
}

function body(text: string, opts: Record<string, unknown> = {}) {
  doc.font(F.reg).fontSize(8.5).fillColor(C.slate)
    .text(text, M.l, y(), { width: CW, lineGap: 2, ...opts });
  doc.moveDown(0.5);
}

function bullet(items: string[], color = C.accent) {
  for (const item of items) {
    const cx = M.l + 8;
    const ty = y();
    doc.save().circle(M.l + 3, ty + 5, 2).fill(color).restore();
    doc.font(F.reg).fontSize(8.5).fillColor(C.slate)
      .text(item, cx, ty, { width: CW - 12, lineGap: 1.5 });
    doc.moveDown(0.25);
  }
}

function kv(label: string, value: string) {
  const ly = y();
  doc.font(F.bold).fontSize(8).fillColor(C.muted).text(label + ":", M.l, ly, { continued: false, width: 110 });
  doc.font(F.reg).fontSize(8.5).fillColor(C.slate).text(value, M.l + 115, ly, { width: CW - 115 });
  doc.moveDown(0.35);
}

function twoCol(items: { label: string; body: string }[]) {
  const colW = (CW - 8) / 2;
  let left: { label: string; body: string }[] = [];
  let right: { label: string; body: string }[] = [];
  items.forEach((it, i) => (i % 2 === 0 ? left : right).push(it));

  const startY = y();
  let maxY = startY;

  left.forEach((it) => {
    const top = doc.y;
    doc.font(F.bold).fontSize(8.5).fillColor(C.indigoMid).text(it.label, M.l, doc.y, { width: colW });
    doc.font(F.reg).fontSize(8).fillColor(C.slate).text(it.body, M.l, doc.y, { width: colW, lineGap: 1.5 });
    doc.moveDown(0.5);
    maxY = Math.max(maxY, doc.y);
  });

  doc.y = startY;
  right.forEach((it) => {
    const rx = M.l + colW + 8;
    doc.font(F.bold).fontSize(8.5).fillColor(C.indigoMid).text(it.label, rx, doc.y, { width: colW });
    doc.font(F.reg).fontSize(8).fillColor(C.slate).text(it.body, rx, doc.y, { width: colW, lineGap: 1.5 });
    doc.moveDown(0.5);
    maxY = Math.max(maxY, doc.y);
  });

  doc.y = maxY;
}

function newPage(title: string, pageNum: string) {
  doc.addPage();
  // Top accent bar
  doc.rect(0, 0, PAGE.w, 6).fill(C.indigo);
  // Header
  doc.rect(0, 6, PAGE.w, 34).fill(C.offWhite);
  doc.font(F.bold).fontSize(10).fillColor(C.indigo)
    .text("LIFE TRANSITIONS AID  |  ALIGN", M.l, 17, { lineBreak: false });
  doc.font(F.reg).fontSize(8).fillColor(C.muted)
    .text(pageNum, PAGE.w - M.r - 60, 19, { width: 60, align: "right", lineBreak: false });
  doc.font(F.reg).fontSize(8).fillColor(C.muted)
    .text(title, M.l, 29, { width: CW - 60, lineBreak: false });

  // Bottom bar
  doc.rect(0, PAGE.h - 24, PAGE.w, 24).fill(C.indigo);
  doc.font(F.reg).fontSize(7).fillColor("rgba(255,255,255,0.6)")
    .text("Confidential  ·  The Collaborative Advocate Foundation  ·  terryflood@thrivingcommunitiesforall.com  ·  thriveup.app", M.l, PAGE.h - 15, { width: CW, align: "center", lineBreak: false });

  doc.y = 52;
}

function safeDown(reserve = 80) {
  if (doc.y > PAGE.h - M.b - reserve) {
    doc.addPage();
    doc.y = M.t;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// COVER PAGE
// ══════════════════════════════════════════════════════════════════════════════
doc.rect(0, 0, PAGE.w, PAGE.h).fill(C.indigo);

// Emerald accent band
doc.rect(0, PAGE.h * 0.62, PAGE.w, PAGE.h * 0.38).fill(C.emerald);

// Gold rule
doc.rect(M.l, 280, CW, 2).fill(C.gold);

// Logo
const LOGO = path.join(process.cwd(), "attached_assets", "4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781974706746.png");
if (fs.existsSync(LOGO)) {
  doc.image(LOGO, PAGE.w / 2 - 52, 72, { width: 104, height: 104 });
}

// Platform name
doc.font(F.bold).fontSize(28).fillColor(C.white)
  .text("Life Transitions Aid", M.l, 200, { width: CW, align: "center" });
doc.font(F.bold).fontSize(22).fillColor(C.gold)
  .text("ALIGN", M.l, 232, { width: CW, align: "center" });

// Tagline
doc.font(F.obl).fontSize(12).fillColor("rgba(255,255,255,0.80)")
  .text("Aligning People with Purpose.", M.l, 290, { width: CW, align: "center" });

// Meta block
const metaY = 340;
const col = CW / 3;
[
  ["Division", "Community Development\nBehavioral Health · Workforce"],
  ["Status", "Operational\nPilot — Travis County, TX"],
  ["Platform", "thriveup.app\nlifetransitionsaid.org/thriveup/align"],
].forEach(([label, val], i) => {
  const mx = M.l + i * col;
  doc.font(F.bold).fontSize(7).fillColor(C.gold).text(label.toUpperCase(), mx, metaY, { width: col - 6 });
  doc.font(F.reg).fontSize(8.5).fillColor("rgba(255,255,255,0.85)").text(val, mx, metaY + 14, { width: col - 6 });
});

// Prepared by block
const pbY = PAGE.h * 0.63 + 20;
doc.font(F.bold).fontSize(9).fillColor(C.gold).text("PREPARED BY", M.l, pbY, { width: CW });
doc.font(F.reg).fontSize(11).fillColor(C.white)
  .text("The Collaborative Advocate Foundation (TCAF)", M.l, pbY + 15, { width: CW });
doc.font(F.reg).fontSize(9).fillColor("rgba(255,255,255,0.75)")
  .text("Terry Flood, Ph.D., President", M.l, pbY + 33, { width: CW });
doc.font(F.reg).fontSize(9).fillColor("rgba(255,255,255,0.60)")
  .text("terryflood@thrivingcommunitiesforall.com", M.l, pbY + 47, { width: CW });

// Version / date
doc.font(F.reg).fontSize(8).fillColor("rgba(255,255,255,0.45)")
  .text("Version 1.0   ·   June 2026   ·   CONFIDENTIAL", M.l, PAGE.h - 60, { width: CW, align: "center" });

// Top accent bar
doc.rect(0, 0, PAGE.w, 5).fill(C.gold);

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — STRATEGIC OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
newPage("Strategic Overview", "Page 1 of 4");

sectionBadge("Strategic Overview", C.indigo);

h3("Mission");
body("To align individuals, families, organizations, and communities with the resources, relationships, and roadmap needed to move from awareness to action — and from survival to contribution.");

h3("Vision");
body("A world where every person has a structured, supported pathway from their first moment of need to becoming a contributor in their community — regardless of background, circumstance, or starting point.");

hRule();
doc.moveDown(0.5);

h3("Executive Summary");
body(
  "Life Transitions Aid | ALIGN is a trauma-informed, community-powered growth framework that meets people where they are and walks with them through six structured phases: Assess · Listen · Integrate · Guide · Navigate · THRIVE. Built on six evidence-based frameworks — CFIR, RE-AIM, EPIS, RNR, FHIR, and Title IV-E Clearinghouse standards — ALIGN provides individuals with a personal growth journey, organizations with a capacity and program-alignment tool, and communities with a collective impact dashboard. " +
  "Currently piloting in Travis County, Texas through TCAF, with active ecosystem partners across Central Texas. The platform is designed for Hub-based replication across all 50 U.S. states."
);

h3("Problem");
twoCol([
  { label: "The Gap", body: "Millions of Americans cycle through crisis services without ever building the foundation for long-term stability. Referral systems connect people to services — but no platform tracks growth across multiple systems over time." },
  { label: "Who Experiences It", body: "Individuals navigating housing instability, workforce barriers, health disparities, justice involvement, foster care aging-out, and family crisis — and the organizations trying to serve them." },
  { label: "Why It Matters", body: "Without a shared growth language and tracking system, communities cannot demonstrate that their investment produces lasting change — only service delivery volume." },
  { label: "Cost of Inaction", body: "Communities continue to be served but not transformed. Funders lose confidence in community-based interventions. People remain in cyclical crisis rather than advancing to stability and contribution." },
]);

safeDown(160);
h3("Market Opportunity");
twoCol([
  { label: "Market Size", body: "40M+ Americans living in poverty. $50B+ annually in federal community development funding. 1.5M+ nonprofits serving vulnerable populations." },
  { label: "Funding Landscape", body: "Federal (HHS, DOL, DOJ, HUD, USDA), state, and private philanthropy. Title IV-E, WIOA, CDBG, SSBG, and community health grant streams." },
  { label: "Policy Drivers", body: "SDOH equity initiatives, DOL workforce equity agenda, FHIR interoperability mandates, place-based investment strategies, family-first prevention services." },
  { label: "Timing", body: "Post-COVID recovery investment cycle. Growing demand for cross-sector outcome frameworks. Increasing funder focus on measurable community transformation vs. activity counts." },
]);

safeDown(160);
h3("Solution Overview");
body("ALIGN is a six-phase growth framework implemented through a digital platform that tracks individual journeys, measures organizational capacity, and aggregates community-level impact. It is the growth layer that existing service platforms are missing — not a replacement for referral tools, case management, or benefits systems, but the framework that connects them to a shared measurement of human progress.");

h3("Ecosystem Role");
twoCol([
  { label: "Purpose", body: "The growth layer that connects individual service delivery to long-term community impact measurement." },
  { label: "Inputs", body: "Individual self-assessments, org profiles, program data, referral outcomes, benefits screening results." },
  { label: "Outputs", body: "ALIGN phase scores, org capacity assessments, community gap reports, funder evidence packages." },
  { label: "Connected Platforms", body: "ThriveUp Academy (15 service platforms), Unite Us, 211, HMIS, SAM.gov, BidNet, Epic (planned)." },
]);

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — PLATFORM CAPABILITIES
// ══════════════════════════════════════════════════════════════════════════════
newPage("Platform Capabilities", "Page 2 of 4");

sectionBadge("Platform Capabilities", C.emerald);

h3("Core Capabilities");
const caps = [
  ["Individual ALIGN Journey", "Six-phase personal growth tracker (Assess → Listen → Integrate → Guide → Navigate → THRIVE) with Spirit · Soul · Body self-assessment (0–100 scoring), phase-specific resource routing, and personal notes."],
  ["Organizational ALIGN Assessment", "Mission · Culture · Capacity scoring (org parallel to Spirit · Soul · Body), phase coverage mapping, and program-to-phase tagging so funders see exactly where each org fits in the ecosystem."],
  ["Community THRIVE Dashboard", "Aggregate individual + org phase distribution, gap analysis (which phases have zero org coverage), and community Spirit · Soul · Body scores — the funder-facing evidence layer."],
  ["Benefits Navigation", "9+ benefit programs screened per session with warm handoffs to ALIGN journey. 107-language AI interface. Serves individuals in their first language."],
  ["Workforce Development Integration", "Employer connections, skills gap assessment, apprenticeship pathways, and ALIGN Navigate-phase resources for economic mobility."],
  ["Grant Intelligence", "Live integration with SAM.gov, BidNet, and RFPMart. ALIGN org profiles inform grant matching. RFP Fidelity Engine produces compliance-matrix-driven proposals."],
  ["107-Language AI Interface", "Navigator and all participant-facing surfaces in 107 languages. Context-aware, dignity-first responses powered by 4-engine AI (OpenAI, Anthropic, Gemini, OpenRouter)."],
  ["Integration Through Invitation (ITI)", "8-layer consent model, all defaults OFF. Data sovereignty for shadow workers, peer mentors, promotoras. Stipend and credentialing pathways built in, not aspirational."],
];
caps.forEach(([label, desc], i) => {
  safeDown(40);
  const nx = M.l; const ny = y();
  doc.save().rect(nx, ny, 18, 18).fill(C.indigo).restore();
  doc.font(F.bold).fontSize(7).fillColor(C.white).text(String(i + 1), nx + 5, ny + 5, { width: 18, lineBreak: false });
  doc.font(F.bold).fontSize(9).fillColor(C.indigoMid).text(label, nx + 24, ny, { width: CW - 24 });
  doc.font(F.reg).fontSize(8).fillColor(C.slate).text(desc, nx + 24, doc.y, { width: CW - 24, lineGap: 1.5 });
  doc.moveDown(0.5);
});

safeDown(120);
hRule();
doc.moveDown(0.5);
h3("Technology Architecture");
twoCol([
  { label: "AI Components", body: "4-engine AI (OpenAI GPT-4o, Anthropic Claude, Gemini, OpenRouter). Ethical/EI preamble on all calls. Context-aware RAG knowledge base. 107-language interface." },
  { label: "Data Architecture", body: "PostgreSQL (Drizzle ORM). FHIR-compatible data structures. 0-PHI-egress design. Auditable witness log on all data access events." },
  { label: "Security Model", body: "Replit Auth session validation. Server-side authorization on all sensitive routes. Ecosystem key authentication for platform-to-platform trust. No client-side trust." },
  { label: "Integration Capabilities", body: "FHIR / CDS-Hooks. SAM.gov, BidNet, RFPMart APIs. HMIS bridge (in progress). Unite Us bidirectional referral sync (in progress)." },
]);

safeDown(120);
h3("Intellectual Property");
twoCol([
  { label: "ALIGN Framework", body: "Proprietary six-phase growth framework authored by Dr. Terry Flood, Ph.D. Integrates CFIR, RE-AIM, EPIS, RNR without replacing them." },
  { label: "Integration Through Invitation (ITI)", body: "8-layer consent architecture with shadow worker credentialing. Named and documented June 2026. Community governance model, not just a feature." },
  { label: "Spirit · Soul · Body Assessment", body: "Three-domain holistic wellness scoring (0–100 each) consistent with biopsychosocial frameworks used in clinical and public health settings." },
  { label: "Community THRIVE Index", body: "Aggregate scoring algorithm combining individual phase distribution, org capacity averages, and phase gap analysis into a single community-level indicator." },
  { label: "Five-Lens Design Doctrine", body: "Implementation science + psychology + data engineering + community health worker + UX design — held simultaneously in every platform decision." },
  { label: "Shadow Worker Credentialing Model", body: "Pathway from informal community contribution (promotora, peer mentor, driveway journeyman) to formal recognition, stipend, and credential." },
]);

safeDown(100);
h3("Why We Win");
bullet([
  "We track growth, not just service delivery — the only platform doing this at individual + org + community levels simultaneously.",
  "Six established evidence frameworks integrated — not invented from scratch. CFIR meets Spirit · Soul · Body.",
  "Community data sovereignty is architecture, not a feature. ITI is the governance model that communities of color actually trust.",
  "15-platform ecosystem means ALIGN data has real context — housing connects to workforce connects to health in a single growth record.",
  "Two-entity structure (nonprofit + LLC) provides financial stability that single-entity community platforms lack.",
]);

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — TRACTION, IMPACT & VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
newPage("Traction, Impact & Validation", "Page 3 of 4");

sectionBadge("Traction, Impact & Validation", C.emerald);

h3("Current Status");
[
  ["Platform", "Operational — live at thriveup.app and lifetransitionsaid.org/thriveup/align"],
  ["Deployment", "Active pilot — Travis County, Texas (Williamson, Hays, Bastrop, Caldwell counties)"],
  ["Partners", "Active ecosystem: Minority Center of Excellence, LifeBridge, SafeCogniCare, El Buen Samaritano, North Wilco Childcare Coalition"],
  ["Technology", "15 platforms operational · 107-language AI · 4-engine AI · SAM.gov/BidNet/RFPMart integrated"],
  ["Outcomes Data", "Accumulating — first case study documentation Q3 2026. Phase advancement data in active collection."],
].forEach(([k, v]) => kv(k, v));

hRule();
doc.moveDown(0.5);

h3("Evidence of Traction");
twoCol([
  { label: "15 Service Platforms", body: "Benefits screening, workforce development, grant intelligence, foster youth, justice re-entry, community health, coalition management, and more — all operational." },
  { label: "107-Language Interface", body: "AI-powered navigation in 107 languages serving multilingual communities without requiring English proficiency." },
  { label: "Active Coalition Relationships", body: "MOUs and active data-sharing partnerships with multiple Central Texas organizations. Coalition dashboard tracking joint outcomes." },
  { label: "Grant Pipeline", body: "SAM.gov-tracked federal and state grant pipeline. RFP Fidelity Engine producing compliance-matrix-driven proposals." },
]);

safeDown(140);
h3("Business Model");
twoCol([
  { label: "Revenue Stream 1 — Grants", body: "Federal (HHS, DOL, DOJ, HUD), state, and private foundation grants. Multi-year grants prioritized. No single grant >40% of operating revenue." },
  { label: "Revenue Stream 2 — Hub Licensing", body: "Hub Adoption Kit: packaged platform for regional community infrastructure operators. SaaS licensing model for other counties/states." },
  { label: "Revenue Stream 3 — Research", body: "University and think-tank partnerships for evaluation design, data access (with consent), and co-publication." },
  { label: "Revenue Stream 4 — Government Contracts", body: "Direct service contracts with city, county, and state agencies for benefits navigation, workforce, and community health services." },
]);

safeDown(180);
h3("Impact Framework");
const ifItems = [
  { label: "Inputs", body: "Individual self-assessments, org profiles, program participation data, community needs data, benefits screening results." },
  { label: "Activities", body: "ALIGN journey facilitation, org capacity building, benefits navigation, workforce development, grant intelligence, coalition coordination." },
  { label: "Outputs", body: "Phase advancement events, org assessments completed, benefits programs screened, programs mapped, community gap reports generated." },
  { label: "Outcomes", body: "Individuals advancing from crisis to stability to contribution. Orgs increasing Mission/Culture/Capacity scores. Communities reducing phase coverage gaps." },
  { label: "Long-Term Impact", body: "Communities where every person has a growth pathway and every organization knows where it fits — measurably demonstrated to funders." },
  { label: "KPIs", body: "% individuals advancing ≥1 ALIGN phase per 90 days · community gap score reduction · # orgs completing assessments · # funder evidence packages generated." },
];
ifItems.forEach(({ label, body: bdy }) => {
  safeDown(35);
  const iy = y();
  doc.save().rect(M.l, iy, 3, 16).fill(C.accent).restore();
  doc.font(F.bold).fontSize(8.5).fillColor(C.indigoMid).text(label, M.l + 9, iy, { width: 80 });
  doc.font(F.reg).fontSize(8).fillColor(C.slate).text(bdy, M.l + 95, iy, { width: CW - 95, lineGap: 1.5 });
  doc.moveDown(0.45);
});

safeDown(120);
hRule();
doc.moveDown(0.5);
h3("Validation Strategy");
twoCol([
  { label: "Implementation Science", body: "CFIR outer/inner setting assessment in Assess phase. RE-AIM community-level evaluation in THRIVE phase. EPIS org readiness tracking across all phases." },
  { label: "Evaluation Design", body: "Mixed-methods: quantitative phase progression scoring + qualitative participant narrative (aggregated with explicit consent — aggregateMyData=true)." },
  { label: "Research Design", body: "Pre/post ALIGN phase scoring. Community THRIVE Index change over time. Comparison between orgs with vs. without ALIGN framework adoption." },
  { label: "Continuous Improvement", body: "Quarterly data review. Participant feedback loop → program iteration. Phase criteria refinement based on transition velocity data." },
]);

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — ROADMAP, PARTNERSHIPS & INVESTMENT
// ══════════════════════════════════════════════════════════════════════════════
newPage("Roadmap, Partnerships & Investment", "Page 4 of 4");

sectionBadge("Roadmap, Partnerships & Investment", C.indigo);

h3("12-Month Objectives (2026–2027)");
twoCol([
  { label: "Technology", body: "Mobile offline mode (Q4 2026). HMIS integration. Unite Us bidirectional referral sync. Salesforce NPSP connector (roadmap)." },
  { label: "Customer Growth", body: "50+ organizations completing ALIGN assessments. 500+ individual journeys active. 5 Hub Adoption Kit deployments initiated." },
  { label: "Partnerships", body: "3 signed research partnerships. 10 new coalition MOUs. 1 federal agency pilot designation." },
  { label: "Revenue", body: "First Hub licensing agreements executed. 3 government service contracts. $500K+ ARR target." },
]);

h3("24-Month Objectives (2027–2028)");
twoCol([
  { label: "Scale", body: "Hub Adoption Kit deployed in 5+ additional counties/regions outside Texas." },
  { label: "Validation", body: "Peer-reviewed publication of ALIGN framework efficacy. Title IV-E Clearinghouse evaluation submitted." },
  { label: "Expansion", body: "2 additional states with active Hub operators. International adaptation scoping (Central America, Caribbean, West Africa)." },
  { label: "Revenue", body: "$1M+ ARR. Federal agency recognition. DOL/HHS pilot designation." },
]);

h3("36-Month Vision");
bullet([
  "National: Hub Adoption Kit active in all 50 states. Federal government strategic partner.",
  "International: ALIGN framework adapted for international development contexts (Central America, Caribbean, West Africa).",
  "Platform Evolution: AI-driven phase prediction · peer mentor matching algorithm · employer direct hiring pipeline.",
  "Strategic Positioning: The national standard for community growth frameworks — as recognized as CFIR is in implementation science.",
]);

safeDown(140);
hRule();
doc.moveDown(0.5);

h3("Partnership Opportunities");
twoCol([
  { label: "Funding Partners", body: "Robert Wood Johnson Foundation, Annie E. Casey Foundation, W.K. Kellogg Foundation, JPMorgan Chase, HHS, DOL, HUD, DOJ." },
  { label: "Research Partners", body: "UT Austin, Texas A&M, Morehouse School of Medicine, Howard University, RAND Corporation, implementation science institutes." },
  { label: "Technology Partners", body: "Epic Health Systems (FHIR integration), Salesforce.org, Unite Us, Microsoft Azure AI, AWS community programs." },
  { label: "Government Partners", body: "Texas HHSC, Travis County, City of Austin, HUD, DOL Employment & Training Administration, AmeriCorps." },
  { label: "Community Partners", body: "Faith networks, HBCUs, tribal nations, promotora networks, community health worker associations, peer specialist networks." },
  { label: "Industry Partners", body: "Healthcare systems, equity-committed employers, CDFIs and financial institutions, housing authorities." },
]);

safeDown(140);
h3("Risk Management");
[
  ["Platform sustainability if TCAF loses funding", "Two-entity structure (nonprofit + LLC). Hub licensing creates earned revenue independent of grant cycles. Open-source commitment on dissolution."],
  ["Community data trust", "ITI architecture: 8-layer consent defaults OFF. Full data portability. Zero PHI egress. Witness log available to all contributors."],
  ["Adoption resistance from established platforms", "Complement positioning — we fill the gap they leave, not replace them. Demonstrated in the vs-alternatives framework on every stakeholder surface."],
  ["Outcomes data lag", "Leading indicators (phase advancement velocity) are available immediately. Lagging indicators (housing, income, employment) accumulate over 12–24 months with proper attribution."],
].forEach(([risk, mit]) => {
  safeDown(45);
  const ry = y();
  doc.save().rect(M.l, ry, CW, 1).fill(C.border).restore();
  doc.moveDown(0.3);
  doc.font(F.bold).fontSize(8).fillColor(C.gold).text("Risk: ", M.l, y(), { continued: true, width: CW });
  doc.font(F.reg).fontSize(8).fillColor(C.slate).text(risk, { lineBreak: false });
  doc.moveDown(0.3);
  doc.font(F.bold).fontSize(8).fillColor(C.emeraldMid).text("Mitigation: ", M.l, y(), { continued: true, width: CW });
  doc.font(F.reg).fontSize(8).fillColor(C.slate).text(mit, { lineBreak: false });
  doc.moveDown(0.5);
});

safeDown(160);
hRule();
doc.moveDown(0.5);

h3("Investment Need");
twoCol([
  { label: "Capital Requested", body: "$2.5M over 24 months (grants, impact investment, and/or government contract)." },
  { label: "Use of Funds", body: "Technology & integrations 40% · Community outreach & org onboarding 25% · Research & evaluation 20% · Operations & team 15%." },
  { label: "Expected Outcomes", body: "50+ org assessments · 500+ individual journeys · 5 Hub deployments · 2 peer-reviewed publications." },
  { label: "Key Milestones", body: "Q3 2026 — first case study · Q4 2026 — mobile offline · Q1 2027 — first Hub license · Q4 2027 — 5 Hub deployments." },
]);

safeDown(120);
h3("Strategic Ask");
bullet([
  "Funding: $2.5M seed/growth capital — grants, impact investment, or government service contracts.",
  "Pilot Participation: Organizations willing to complete ALIGN assessments and share outcome data under ITI consent.",
  "Research Collaboration: University partners for evaluation design, peer-reviewed publication, and framework validation.",
  "Technology Integration: EHR, HMIS, and referral platform partners for bidirectional data interoperability.",
  "Strategic Advisory: Implementation scientists, equity-focused policy advocates, and community organizers.",
]);

safeDown(100);
// Closing statement — highlighted box
const csY = y();
doc.save().rect(M.l, csY, CW, 68).fill("#ede9fe").restore();
doc.rect(M.l, csY, 4, 68).fill(C.accent);
doc.font(F.bold).fontSize(9).fillColor(C.accent)
  .text("Closing Statement", M.l + 12, csY + 8, { width: CW - 16 });
doc.font(F.obl).fontSize(8.5).fillColor(C.slate)
  .text(
    "If Life Transitions Aid | ALIGN succeeds, we will live in a country where a person's first moment of need marks the beginning of a documented growth journey — not a cycle of crisis. Organizations will know exactly where they fit in their community's ecosystem. Funders will see growth, not just service. Communities will have the evidence they need to demand the investment they deserve. ALIGN is the missing layer between doing good and proving it.",
    M.l + 12, csY + 22, { width: CW - 20, lineGap: 2 }
  );
doc.y = csY + 80;

// ── Finalize ──────────────────────────────────────────────────────────────────
doc.end();

stream.on("finish", () => {
  console.log("✅  PDF written to:", OUT);
});
stream.on("error", (err) => {
  console.error("❌  PDF error:", err);
  process.exit(1);
});
