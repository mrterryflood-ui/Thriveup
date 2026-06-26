import PDFDocument from "pdfkit";
import fs from "fs";

const OUT = "attached_assets/tcaf-hbcu-one-pager.pdf";

const CRIMSON  = "#8C0D21";
const DARK     = "#1A1A1A";
const MID      = "#444444";
const LIGHT    = "#F7F4F4";
const RULE     = "#C9A0A8";
const WHITE    = "#FFFFFF";

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 36, bottom: 36, left: 48, right: 48 },
  info: {
    Title:   "ThriveUp Academy — One Pager",
    Author:  "The Collaborative Advocate Foundation",
    Subject: "National Community Infrastructure Platform",
  },
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const PW = doc.page.width;
const ML = doc.page.margins.left;
const MR = doc.page.margins.right;
const BODY_W = PW - ML - MR;

// ── Crimson header bar ────────────────────────────────────────────────────
doc.rect(0, 0, PW, 68).fill(CRIMSON);

doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(20)
   .text("ThriveUp Academy", ML, 14, { width: BODY_W });
doc.fillColor(WHITE).font("Helvetica").fontSize(9.5)
   .text("The Collaborative Advocate Foundation  ·  501(c)(3)  ·  EIN 41-3618003  ·  thrivingcommunitiesforall.com", ML, 37, { width: BODY_W });
doc.fillColor(WHITE).font("Helvetica-Oblique").fontSize(8.5)
   .text("National Community Infrastructure Platform", ML, 51, { width: BODY_W });

doc.y = 80;

// ── Tagline ───────────────────────────────────────────────────────────────
doc.fillColor(DARK).font("Helvetica-Bold").fontSize(11.5)
   .text("Connecting people to opportunity — at scale, with evidence, in every language.", ML, doc.y, { width: BODY_W });

doc.moveDown(0.3);
doc.moveTo(ML, doc.y).lineTo(ML + BODY_W, doc.y).lineWidth(0.75).strokeColor(RULE).stroke();
doc.moveDown(0.4);

// ── Helper functions ──────────────────────────────────────────────────────
function sectionHead(label: string) {
  doc.rect(ML, doc.y, BODY_W, 15).fill(LIGHT);
  doc.fillColor(CRIMSON).font("Helvetica-Bold").fontSize(8.5)
     .text(label.toUpperCase(), ML + 6, doc.y - 12, { width: BODY_W - 12 });
  doc.moveDown(0.55);
}

function body(text: string, indent = 0) {
  doc.fillColor(MID).font("Helvetica").fontSize(8.5)
     .text(text, ML + indent, doc.y, { width: BODY_W - indent });
  doc.moveDown(0.25);
}

function bullet(text: string) {
  const bx = ML + 10;
  const ty = doc.y;
  doc.fillColor(CRIMSON).circle(bx - 5, ty + 4.5, 2).fill();
  doc.fillColor(MID).font("Helvetica").fontSize(8.5)
     .text(text, bx + 2, ty, { width: BODY_W - 16 });
  doc.moveDown(0.18);
}

function statRow(items: { label: string; value: string }[]) {
  const colW = BODY_W / items.length;
  const startY = doc.y;
  items.forEach((item, i) => {
    const x = ML + i * colW;
    doc.fillColor(CRIMSON).font("Helvetica-Bold").fontSize(14)
       .text(item.value, x, startY, { width: colW, align: "center" });
    doc.fillColor(MID).font("Helvetica").fontSize(7.5)
       .text(item.label, x, startY + 17, { width: colW, align: "center" });
  });
  doc.y = startY + 33;
  doc.moveDown(0.25);
}

// ── At a Glance ───────────────────────────────────────────────────────────
sectionHead("At a Glance");
statRow([
  { value: "15",   label: "Live Service Platforms" },
  { value: "721",  label: "Funding Opps Tracked" },
  { value: "107",  label: "Languages (89 spoken + 18 signed)" },
  { value: "5",    label: "Industry-Grade Trade Simulations" },
]);

doc.moveTo(ML, doc.y).lineTo(ML + BODY_W, doc.y).lineWidth(0.5).strokeColor(RULE).stroke();
doc.moveDown(0.4);

// ── Two-column layout ─────────────────────────────────────────────────────
const COL_W = (BODY_W - 12) / 2;
const COL2_X = ML + COL_W + 12;
let leftY: number;
let rightY: number;

// Save Y for column start
const colTopY = doc.y;

// ── LEFT column ───────────────────────────────────────────────────────────
function lHead(label: string) {
  doc.rect(ML, doc.y, COL_W, 14).fill(LIGHT);
  doc.fillColor(CRIMSON).font("Helvetica-Bold").fontSize(8)
     .text(label.toUpperCase(), ML + 5, doc.y - 11, { width: COL_W - 8 });
  doc.moveDown(0.45);
}
function lBody(text: string) {
  doc.fillColor(MID).font("Helvetica").fontSize(8.2)
     .text(text, ML, doc.y, { width: COL_W });
  doc.moveDown(0.22);
}
function lBullet(text: string) {
  const ty = doc.y;
  doc.fillColor(CRIMSON).circle(ML + 5, ty + 4, 1.8).fill();
  doc.fillColor(MID).font("Helvetica").fontSize(8.2)
     .text(text, ML + 11, ty, { width: COL_W - 11 });
  doc.moveDown(0.15);
}

doc.y = colTopY;
lHead("Workforce Development");
lBody("Five industry-grade trade simulations — electrical, plumbing, welding, automotive, HVAC — built on the same solvers used in engineering training:");
lBullet("Modified Nodal Analysis (MNA) electrical solver");
lBullet("Hardy-Cross Newton-Raphson pipe-network solver");
lBullet("AWS D1.1 welding heat-input evaluator");
lBody("At 80% lesson completion the platform routes learners to OSHA 10, NCCER, AWS, ASE, and EPA credentials, and to IBEW, United Association, and ABC registered apprenticeship pathways.");

doc.moveDown(0.3);
lHead("Benefits & Navigation");
lBody("Real-time eligibility screening for SNAP, housing, healthcare, and safety-net programs. AI that speaks plain language and honors dialect — preserving AAVE, Spanglish, and regional speech — not bureaucratic translation.");

doc.moveDown(0.3);
lHead("Academy & Financial Empowerment");
lBody("Live economic simulation — wallets, portfolios, branching life-scenario narratives, and financial literacy — making FAFSA, apprenticeship, and early-career decisions legible to young people and their families.");

leftY = doc.y;

// ── RIGHT column ──────────────────────────────────────────────────────────
function rHead(label: string) {
  doc.rect(COL2_X, doc.y, COL_W, 14).fill(LIGHT);
  doc.fillColor(CRIMSON).font("Helvetica-Bold").fontSize(8)
     .text(label.toUpperCase(), COL2_X + 5, doc.y - 11, { width: COL_W - 8 });
  doc.moveDown(0.45);
}
function rBody(text: string) {
  doc.fillColor(MID).font("Helvetica").fontSize(8.2)
     .text(text, COL2_X, doc.y, { width: COL_W });
  doc.moveDown(0.22);
}
function rBullet(text: string) {
  const ty = doc.y;
  doc.fillColor(CRIMSON).circle(COL2_X + 5, ty + 4, 1.8).fill();
  doc.fillColor(MID).font("Helvetica").fontSize(8.2)
     .text(text, COL2_X + 11, ty, { width: COL_W - 11 });
  doc.moveDown(0.15);
}

doc.y = colTopY;
rHead("Grant Intelligence");
rBody("721 funding opportunities tracked across SAM.gov, Grants.gov, USASpending, and foundation sources. AI fit-scoring, proposal and narrative generation, and a full grant operations command center — operational maturity most organizations build toward for years.");

doc.moveDown(0.3);
rHead("Justice & Reentry");
rBody("Production-grade RNR (Risk-Need-Responsivity) case management, CBI program tracking, family visitation coordination, and NRRC-standard outcome reporting. Not a vision — a running system.");

doc.moveDown(0.3);
rHead("Foster Youth Transition");
rBody("50-state policy comparator with statute citations. Education and Training Voucher navigation, Chafee eligibility, Medicaid-to-26 routing, 4-domain AI risk engine (housing / food / mental health / documents), and PPTX case plans for youth and caseworkers.");

doc.moveDown(0.3);
rHead("Implementation Science");
rBody("39 CFIR constructs, RE-AIM evaluation framework, and NRRC fidelity benchmarks instantiated in code — not cited in a methods section. MAP-GAP continuous quality improvement. FHIR/CDS-Hooks clinical interoperability. Zero PHI egress.");

rightY = doc.y;

// ── Resume single column ──────────────────────────────────────────────────
doc.y = Math.max(leftY, rightY) + 6;
doc.moveTo(ML, doc.y).lineTo(ML + BODY_W, doc.y).lineWidth(0.5).strokeColor(RULE).stroke();
doc.moveDown(0.4);

// ── Integration Through Invitation ───────────────────────────────────────
sectionHead("Integration Through Invitation — The Initiative Behind the Platform");
body(
  "HBCUs have long known that the most trusted community infrastructure is not in office buildings. It lives in faith halls, barbershops, neighborhood kitchens, and the phones of community health workers who have never been paid for what they do. ThriveUp Academy's Integration Through Invitation framework names those workers, stipends them, credentials them, and integrates their knowledge into the systems serving their own communities — with layered consent, no extraction, and real career pathways. Every surface of the platform carries this commitment."
);
doc.moveDown(0.2);

// ── Partnership ───────────────────────────────────────────────────────────
sectionHead("Partnership Opportunity");
body(
  "ThriveUp Academy is architected for interoperability. HBCU workforce programs, community health institutes, reentry partnerships, and academic research centers can connect directly through a secure Partner API — pulling platform data for their own programs or contributing community insights back into the network. We are actively seeking institutional partners who share this vision of community infrastructure as a civil rights issue."
);

doc.moveDown(0.3);
doc.moveTo(ML, doc.y).lineTo(ML + BODY_W, doc.y).lineWidth(0.75).strokeColor(CRIMSON).stroke();
doc.moveDown(0.35);

// ── Footer contact ────────────────────────────────────────────────────────
doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8.5)
   .text("Dr. Terry D. Flood, Sr.  ·  President, The Collaborative Advocate Foundation", ML, doc.y, { width: BODY_W });
doc.fillColor(MID).font("Helvetica").fontSize(8.5)
   .text("terryflood@thrivingcommunitiesforall.com  ·  254-319-8460  ·  thrivingcommunitiesforall.com", ML, doc.y + 11, { width: BODY_W });
doc.fillColor(MID).font("Helvetica-Oblique").fontSize(7.5)
   .text("Medically retired U.S. Army veteran · Implementation scientist · Psychologist · Data engineer · Community health worker", ML, doc.y + 22, { width: BODY_W });

doc.end();

stream.on("finish", () => {
  console.log(`✓ One-pager written to ${OUT}`);
  const stats = fs.statSync(OUT);
  console.log(`  ${(stats.size / 1024).toFixed(1)} KB`);
});
stream.on("error", (err) => {
  console.error("PDF write failed:", err.message);
  process.exit(1);
});
