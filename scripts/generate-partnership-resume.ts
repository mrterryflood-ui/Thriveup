/**
 * Partnership Resume Generator — ThriveUp / LifeBridge
 * Uses real platform knowledge. Run: npx tsx scripts/generate-partnership-resume.ts
 * Output: attached_assets/TerryFlood_Partnership_Resume_ACCURATE.docx
 */

import {
  Document, Paragraph, TextRun, HeadingLevel, Packer,
  AlignmentType, BorderStyle, ShadingType, TableRow, TableCell,
  Table, WidthType, convertInchesToTwip, UnderlineType,
} from "docx";
import * as fs from "fs";
import * as path from "path";

// ─── Color palette ────────────────────────────────────────────────────────────
const TEAL = "0D9488";
const DARK = "1E293B";
const MID  = "475569";
const LITE = "94A3B8";
const WHITE = "FFFFFF";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function heading1(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: DARK, font: "Calibri" })],
    spacing: { before: 320, after: 80 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, color: TEAL, font: "Calibri" })],
    spacing: { before: 280, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL } },
  });
}

function heading3(text: string, rightText = ""): Paragraph {
  const runs: TextRun[] = [new TextRun({ text, bold: true, size: 22, color: DARK, font: "Calibri" })];
  if (rightText) {
    runs.push(new TextRun({ text: `     ${rightText}`, bold: false, size: 20, color: LITE, font: "Calibri" }));
  }
  return new Paragraph({ children: runs, spacing: { before: 200, after: 40 } });
}

function subheading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, italics: true, size: 20, color: TEAL, font: "Calibri" })],
    spacing: { before: 140, after: 20 },
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: DARK, font: "Calibri" })],
    spacing: { before: 40, after: 40 },
  });
}

function bullet(text: string, level = 0): Paragraph {
  const indent = level * 360;
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: DARK, font: "Calibri" })],
    bullet: { level },
    indent: { left: 360 + indent },
    spacing: { before: 30, after: 30 },
  });
}

function boldBullet(label: string, text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: label + " — ", bold: true, size: 20, color: TEAL, font: "Calibri" }),
      new TextRun({ text, size: 20, color: DARK, font: "Calibri" }),
    ],
    bullet: { level: 0 },
    indent: { left: 360 },
    spacing: { before: 30, after: 30 },
  });
}

function divider(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: "", size: 4 })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
    spacing: { before: 120, after: 120 },
  });
}

function blank(pts = 80): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: "", size: 4 })], spacing: { before: pts, after: 0 } });
}

// ─── Document body ────────────────────────────────────────────────────────────

const children: Paragraph[] = [

  // ── HEADER ──────────────────────────────────────────────────────────────────
  new Paragraph({
    children: [new TextRun({ text: "TERRY D. FLOOD, DHA", bold: true, size: 52, color: DARK, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Community Platform Builder  •  Implementation Scientist  •  Data Storyteller  •  TCAF President",
      size: 22, color: MID, font: "Calibri", italics: true,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Pflugerville, TX  •  254-319-8460  •  terryflood@thrivingcommunitiesforall.com",
      size: 20, color: MID, font: "Calibri",
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "thrivingcommunitiesforall.com  •  lifetransitionsaid.org",
      size: 20, color: TEAL, font: "Calibri",
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
  }),

  divider(),

  // ── PARTNERSHIP PROFILE ─────────────────────────────────────────────────────
  heading2("PARTNERSHIP PROFILE"),
  body(
    "Community health innovator, implementation scientist, and nonprofit founder building technology-enabled " +
    "infrastructure that expands access to social services, workforce opportunity, and health equity for " +
    "underserved populations across Texas and the nation. Founder of The Collaborative Advocate Foundation (TCAF), " +
    "EIN 41-3618003 — a Texas 501(c)(3) — operating two complementary production platforms: LifeBridge " +
    "(virtual 211 and CHW navigation hub at lifetransitionsaid.org) and ThriveUp (AI-powered community " +
    "infrastructure at thrivingcommunitiesforall.com)."
  ),
  blank(40),
  body(
    "ThriveUp is not a concept or a roadmap — it is a live, production-grade platform: 271 database " +
    "tables, 211 frontend pages, 26 interconnected ecosystem platforms, a 4-engine AI synthesis stack " +
    "(Claude + GPT-4o-mini + Gemini Flash + DeepSeek R1), 88 RAG knowledge chunks grounded in TCAF's own " +
    "commitments, 721+ grants tracked with AI-powered fit scoring, physics-grade trade simulation engines, " +
    "107-language navigation, and full FHIR/CDS-Hooks interoperability. Every feature described in this " +
    "document is running code — not aspiration."
  ),

  divider(),

  // ── COMMUNITY PLATFORMS ─────────────────────────────────────────────────────
  heading2("COMMUNITY PLATFORMS"),

  // LifeBridge
  heading3("LifeBridge — Virtual 211 & Community Navigation Hub", "2026–Present"),
  new Paragraph({
    children: [
      new TextRun({ text: "lifetransitionsaid.org", bold: true, size: 20, color: TEAL, font: "Calibri" }),
      new TextRun({ text: "  |  The Collaborative Advocate Foundation (TCAF)", size: 20, color: MID, font: "Calibri" }),
    ],
    spacing: { before: 20, after: 80 },
  }),

  subheading("What it does"),
  body(
    "Free, 24/7 virtual social services navigation platform functioning as a digital community health worker — " +
    "providing the same intake, triage, and referral functions that in-person CHW navigators deliver, extended " +
    "to families who cannot access brick-and-mortar services during business hours: working parents, shift workers, " +
    "rural-adjacent residents, newly released individuals, and immigrants navigating unfamiliar systems."
  ),

  subheading("Coverage — all five SDOH domains"),
  bullet("Economic stability: employment, benefits screening (SNAP/TANF/WIC/LIHEAP/Medicaid/CCS), financial assistance"),
  bullet("Education & training: GED/HiSET, adult basic education, ESL, workforce programs, Trade Sims pathway"),
  bullet("Health & healthcare: primary care FQHCs, mental health, substance use, maternal health, dental, vision"),
  bullet("Neighborhood & environment: emergency housing, utility assistance, domestic violence shelters, food pantries"),
  bullet("Social & community context: legal aid, immigration services, reentry support, veteran navigation, disability"),

  subheading("AI navigation layer"),
  bullet("107 languages (89 spoken + 18 signed) with dialect preservation — AAVE, Spanglish, regional dialects honored"),
  bullet("Crisis signal detection: auto-routes to 988, National DV Hotline, SAMHSA, Childhelp — no cold handoff"),
  bullet("GIS-aware referrals: ZIP-matched community resources via findhelp.org, 211, and TCAF's curated partner network"),
  bullet("Anonymous use by default — no account, no judgment, no prerequisites"),

  subheading("Data storytelling capability"),
  body(
    "LifeBridge captures anonymized usage data by need category, ZIP code, and referral pathway — enabling " +
    "community needs mapping, gap analysis, and data-informed advocacy to funders, city councils, county " +
    "health departments, and federal agencies. Usage trends feed directly into TCAF's grant development strategy."
  ),

  subheading("Partnership opportunity"),
  body(
    "LifeBridge can serve as a digital front door, after-hours extension, and co-branded resource hub for " +
    "partner organizations. The platform can be populated with partner-specific resources, embedded in partner " +
    "digital properties, and configured to capture partner-relevant intake data for shared reporting."
  ),

  blank(60),

  // ThriveUp
  heading3("ThriveUp — National Community Infrastructure Platform", "2026–Present"),
  new Paragraph({
    children: [
      new TextRun({ text: "thrivingcommunitiesforall.com", bold: true, size: 20, color: TEAL, font: "Calibri" }),
      new TextRun({ text: "  |  The Collaborative Advocate Foundation (TCAF)", size: 20, color: MID, font: "Calibri" }),
    ],
    spacing: { before: 20, after: 80 },
  }),

  subheading("Platform scale (production — not a prototype)"),
  bullet("271 database tables  |  211 frontend pages  |  26 connected ecosystem platforms"),
  bullet("4-engine AI synthesis: Claude 3.5 Haiku + GPT-4o-mini + Gemini Flash + DeepSeek R1 with automatic failover"),
  bullet("88 RAG knowledge chunks grounded in TCAF's own commitments — not generic LLM output"),
  bullet("FHIR R4 / CDS-Hooks interoperable — clinical data exchange ready"),
  bullet("Two-entity strategy: TCAF 501(c)(3) for community programs + ISS LLC for-profit for earned revenue / government contracting"),

  subheading("AI Navigator — the platform's front door"),
  bullet("Multilingual community navigation: 107 languages (89 spoken + 18 signed), dialect-preserving"),
  bullet("4-engine collaborative synthesis — engines debate, synthesize, and cite sources before responding"),
  bullet("Detects housing, food, mental health, reentry, immigration, DV, and childcare crises; provides immediate warm referrals"),
  bullet("GIS-powered: pulls CDC SVI, Census ACS, SAMHSA NSDUH, FBI UCR, and USDA data layers by ZIP code"),
  bullet("Anti-fabrication architecture: zero hallucinated resources — every referral is a verified primary source"),

  subheading("Trade Simulation Engines — physics-grade workforce training"),
  body(
    "Five industry-standard trades with real simulation engines — not videos or slideshows. 5 trades × " +
    "15 lessons = 75 lessons. Credential routing at 80% completion connects participants to apprenticeships, " +
    "licensure boards, and area technical college programs."
  ),
  bullet("Welding: AWS D1.1 structural steel heat-input evaluator — calculates preheat, interpass temp, heat input per code"),
  bullet("Plumbing: Hardy-Cross Newton-Raphson hydraulic simulation — models pipe networks, pressure, flow rates"),
  bullet("Electrical / Automotive: Mesh-Node Analysis (MNA) — simulates circuits, calculates voltage/current/resistance"),
  bullet("HVAC: Thermal-airflow simulation — models heat load, duct sizing, CFM calculations"),
  bullet("Automotive (advanced): ECM/OBD diagnostics simulation with fault code interpretation"),
  bullet("10-language AI tutor: English, Spanish, Vietnamese, Chinese, Arabic, Korean, French, Tagalog, Hindi, Burmese"),

  subheading("Grant Discovery & Compliance Engine"),
  bullet("721+ active grants tracked across federal, state, foundation, and corporate sources"),
  bullet("AI-powered SAM.gov scanning with real-time fit scoring against TCAF's program inventory"),
  bullet("RFP Fidelity Engine: compliance matrix builder that mirrors RFP rubric language and scoring weights"),
  bullet("Proposal pipeline with 29 active opportunities managed through a Kanban lifecycle (LOI → Draft → Review → Submitted)"),
  bullet("BidNet Direct integration for local government opportunities; RFPMART for state procurement"),

  subheading("Community Health Worker (CHW) Dashboard"),
  bullet("Caseload management with home visit logging, screening, and referral tracking"),
  bullet("10 CHW training modules aligned to Texas DSHS CHW standards (168-hour curriculum pathway)"),
  bullet("CHW certification pathway: credit tracking, supervisor attestation, DSHS renewal management"),
  bullet("Community resource connector with real-time availability and warm handoff documentation"),

  subheading("Implementation Science Research Hub"),
  body(
    "CFIR 2.0 fully instantiated in code — not cited as a framework, but operationalized as 39 live constructs " +
    "across 5 domains (Innovation, Outer Setting, Inner Setting, Individuals, Implementation Process). " +
    "Paired with MAP-GAP continuous quality improvement cycle and RE-AIM evaluation."
  ),
  bullet("39 CFIR 2.0 constructs: barrier/facilitator scoring, implementation driver mapping, fidelity ratings"),
  bullet("MAP-GAP QI cycle: Measure → Analyze → Plan → Gap-identification → Action → Progress tracking"),
  bullet("RE-AIM scorecard: Reach, Effectiveness, Adoption, Implementation, Maintenance — populated by platform data"),
  bullet("Research library: SAMHSA SPF, NIRN, CDC, PCORI — with implementation pathway builder per evidence level"),

  subheading("Justice & Reentry Case Management"),
  bullet("11 database tables: RNR assessments, CBI programs, recidivism baselines, reentry milestones, family visitation"),
  bullet("Risk-Need-Responsivity (RNR) model, NRRC benchmarks, CBI fidelity scoring"),
  bullet("Collateral consequence counseling: employment, housing, benefits, professional licensing barriers by state"),
  bullet("Family contact log, supervised release milestone tracker, supervisor review queue"),

  subheading("Prevention Hub & Coalition Management"),
  bullet("SAMHSA/NIDA evidence-based program registry with practice-to-research gap scoring"),
  bullet("Risk/protective factor tracking at individual and community level using CFIR constructs"),
  bullet("DFC Command Center: Drug-Free Communities grant management aggregating 20+ data sources"),
  bullet("12-sector ONDCP-aligned coalition tracker (youth, parents, business, media, schools, faith, law enforcement, civic...)"),
  bullet("Prevention logic model builder with theory-of-change documentation"),

  subheading("Parent Education & Family Strengthening"),
  bullet("7 substance prevention modules: warning signs, talking with your child, fentanyl/vaping awareness, social media"),
  bullet("6 family strengthening modules: communication, discipline, resilience, cultural strengths, mental health"),
  bullet("AI-powered conversation starters — age-banded (10-14 / 15-18), culturally adapted"),
  bullet("Family risk and protective factors assessment with personalized action plan"),

  subheading("Community Intelligence Map"),
  bullet("GIS-powered mapping with live CDC SVI, Census ACS, SAMHSA, FBI UCR, and USDA data layers"),
  bullet("Corridor Chainweb: 8-node citation-chained data pipeline (Census/CDC/BJS/USDA) — every stat has a primary source"),
  bullet("Community needs mapping by ZIP, county, and census tract — updated from live APIs"),
  bullet("Equity overlays: Social Vulnerability Index, food desert designation, rural health shortage area, child poverty rate"),

  subheading("Child Care & Workforce Navigation"),
  bullet("Texas Child Care Services (CCS) system navigator: TRS quality levels, subsidy eligibility, provider search"),
  bullet("North Texas 11-county landscape: county-by-county provider count, child/slot data, TWC performance measures"),
  bullet("Workforce-to-childcare linkage: employer-sponsored care modeling, CCS access during job search period"),
  bullet("Pre-employment CCS policy analysis with real TWC economic data and TRS rate reform recommendations"),
  bullet("Dual-generation strategy: workforce outcomes + child development outcomes measured together"),

  subheading("Benefits Screener & Navigator"),
  bullet("SDOH-aware universal screening: SNAP, Medicaid, CHIP, TANF, WIC, CCS, LIHEAP, housing, Social Security"),
  bullet("Real-time eligibility flows using federal income limits and household composition"),
  bullet("211 integration and findhelp.org deep-linking with partner-specific resource overlays"),

  subheading("AI Creation Studio — 10 professional tools"),
  bullet("Resume builder, cover letter, professional bio, portfolio builder"),
  bullet("Business plan generator, grant narrative builder, logic model builder"),
  bullet("Presentation builder, compliance matrix generator, letter of support generator"),
  bullet("All tools use TCAF's ethical AI preamble: truth + primary sources, no PII echo, plain language"),

  divider(),

  // ── IMPLEMENTATION SCIENCE ─────────────────────────────────────────────────
  heading2("IMPLEMENTATION SCIENCE & DATA STORYTELLING CAPABILITIES"),

  boldBullet("Doctoral expertise",
    "MS, Implementation Science (Dartmouth Geisel School of Medicine, expected 2026); DHA (Virginia University of " +
    "Lynchburg, 2024); developed SALP (Systemic Anchors and Leverage Points) framework for evidence-to-practice " +
    "gap identification; completed Dartmouth CBHEM Phase 1 community-based veteran outreach trial; co-authored " +
    "Springer Nature manuscript on evidence-to-practice parallax; submitted Debate article to Implementation Science journal."
  ),

  boldBullet("Five-lens platform design",
    "Every TCAF platform is designed simultaneously through five lenses: (1) Implementation science — CFIR/RE-AIM/EPIS " +
    "frame, fidelity, scalability; (2) Psychology/neuroscience — trauma-informed, regulation-first, no shame architecture; " +
    "(3) Data engineering — FHIR/CDS-Hooks interoperable, 0-PHI-egress, witness-logged, citation-chained; " +
    "(4) Community health worker — trusted-messenger model, stipended shadow workers, peer-mentor pathways; " +
    "(5) UX/user-centered design — parent, clinician, CPS worker, funder each have a coherent surface."
  ),

  boldBullet("Mixed-methods community research",
    "Trained in qualitative and quantitative methods: needs assessments, listening sessions, RE-AIM scorecards, " +
    "CBPR, and CFIR-guided implementation evaluation. Platform's Community Voice features enable participatory " +
    "evidence collection at scale — turning community listening into structured, funder-ready datasets."
  ),

  boldBullet("Data storytelling for funders & policymakers",
    "Built United Way of Williamson County stakeholder presentation with $878K Year 2 funding stack; " +
    "developing NSF Texas-wide AI readiness Coordination Hub LOI; ARPA-H PHO concept paper on child " +
    "maltreatment prevention; Travis County Central Health RFQ. Every external-facing deliverable is " +
    "evidence-anchored, rubric-mirrored, and reviewer-ready."
  ),

  boldBullet("Grant development & federal funding strategy",
    "Active pipeline: 29 proposals in lifecycle management. NSF (TechAccess / AI Coordination Hub); ARPA-H PHO; " +
    "TWC RFA-32026-00162; CDC Drug-Free Communities; Substance Abuse Prevention; USDA NIFA Open Data Framework. " +
    "Two-entity strategy (TCAF 501c3 + ISS LLC) enables both federal grant-eligible and earned-revenue contracting tracks."
  ),

  divider(),

  // ── COMMUNITY ENGAGEMENT ─────────────────────────────────────────────────────
  heading2("COMMUNITY ENGAGEMENT & COLLABORATIVE LEADERSHIP"),

  heading3("President & Founder", "2026–Present"),
  new Paragraph({
    children: [new TextRun({ text: "The Collaborative Advocate Foundation (TCAF)  —  Texas 501(c)(3) | EIN 41-3618003", size: 20, color: MID, font: "Calibri", italics: true })],
    spacing: { before: 20, after: 80 },
  }),

  boldBullet("Parenting workshops",
    "Monthly trauma-informed parenting workshops at Northwest Elementary School (Pflugerville ISD); curriculum " +
    "integrates ACEs science, resilience-building, and family systems frameworks."
  ),
  boldBullet("Dads Care 2 initiative",
    "Central Texas expansion of Dads Care 2 fatherhood engagement initiative across Williamson, McLennan, and " +
    "Travis counties — addressing family stability and child welfare outcomes."
  ),
  boldBullet("Coalition building",
    "Austin Community Police Review Commission (CPRC); Pflugerville School Health Advisory Council (SHAC); " +
    "cross-sector bridge between community health, public safety, education, and government."
  ),
  boldBullet("Veterans advocacy",
    "Veteran-centered disability navigation, behavioral health advocacy, and health system navigation for " +
    "military families across Central Texas; retired Army CW2; VA 100% P&T recipient."
  ),

  divider(),

  // ── PROFESSIONAL BACKGROUND ─────────────────────────────────────────────────
  heading2("RELEVANT PROFESSIONAL BACKGROUND"),

  heading3("Social Science Program Specialist (GS-0101-11)  —  VA Veterans Crisis Line", "Jan 2024–Mar 2026"),
  body("Designed and delivered training curricula and SOPs for 500+ employee behavioral health program; coordinated " +
    "complex cases involving MST, TBI, and SDOH barriers; applied federal health policy and HIPAA compliance in a " +
    "high-risk service environment."
  ),

  blank(40),

  heading3("Risk Reduction Coordinator / CR2i Specialist (GS-0101-11 / GS-0301-12)  —  III Corps Fort Hood", "Jul 2021–May 2023"),
  body("Coordinated readiness, behavioral health, and human services programs for 450,000 Soldiers and families; " +
    "multi-stakeholder liaison across clinical, legal, HR, and command channels; delivered data-driven briefings to senior leaders."
  ),

  blank(40),

  heading3("Veterans Service Representative / Legal Administrative Specialist  —  VA VBA Waco", "Jun 2017–Jul 2021"),
  body("Adjudicated veteran disability claims and coordinated legal/administrative appeals; direct counseling to " +
    "veterans navigating complex benefit systems; Outstanding performance rating FY2019–2020."
  ),

  divider(),

  // ── EDUCATION ─────────────────────────────────────────────────────────────
  heading2("EDUCATION & CREDENTIALS"),

  subheading("Degrees"),
  bullet("MS, Implementation Science (in progress)  —  Geisel School of Medicine at Dartmouth  |  2026"),
  bullet("Doctor of Health Administration (DHA)  —  Virginia University of Lynchburg  |  2024"),
  bullet("Doctor of Business Administration (DBA) — in progress"),
  bullet("MS, Human Resource Management  |  MS, I-O Psychology  |  MS, Criminal Justice/Public Policy  —  Walden University"),
  bullet("Graduate Certificate, Business Analytics  —  Texas A&M University  |  2023"),
  bullet("BS, Healthcare Management  —  South University  |  2021"),

  subheading("Community Health & Safety Credentials"),
  bullet("Community Health Worker Instructor  —  Texas DSHS #657, UNT Health Science Center (168 hours, valid through 2027)"),
  bullet("Six Sigma Lean Green Belt in Healthcare  —  MSI (Cert #189435541, 2023)"),
  bullet("ASIST Applied Suicide Intervention Skills Trainer  —  LivingWorks (2015)"),
  bullet("DoD Prevention Level 2  —  Integrated Prevention Workforce, Joint Staff J-7 (2022)"),
  bullet("Stanford Medicine AI in Healthcare  —  12.00 AMA PRA Category 1 CME (2024)"),
  bullet("FEMA ICS/NIMS: IS-100, IS-200, IS-700, IS-800"),

  subheading("Federal Grants & Contracting"),
  bullet("FAC-COR (Contracting Officer's Representative) — Federal Acquisition Certification"),
  bullet("Grants management experience: TWC RFA, CDC DFC, NSF, ARPA-H, USDA NIFA, OMB Uniform Guidance compliance"),

  blank(120),
  new Paragraph({
    children: [new TextRun({
      text: "Prepared by ThriveUp  •  The Collaborative Advocate Foundation  •  thrivingcommunitiesforall.com",
      size: 16, color: LITE, font: "Calibri", italics: true,
    })],
    alignment: AlignmentType.CENTER,
  }),
];

// ─── Build document ───────────────────────────────────────────────────────────

const doc = new Document({
  creator: "ThriveUp — TCAF",
  title: "Terry D. Flood — Partnership Resume",
  description: "Partnership profile with accurate ThriveUp and LifeBridge platform capabilities",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 20 },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(0.9),
          bottom: convertInchesToTwip(0.9),
          left: convertInchesToTwip(1.0),
          right: convertInchesToTwip(1.0),
        },
      },
    },
    children,
  }],
});

// ─── Write output ─────────────────────────────────────────────────────────────

const outputDir = path.join(process.cwd(), "attached_assets");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, "TerryFlood_Partnership_Resume_ACCURATE.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  const kb = Math.round(buffer.length / 1024);
  console.log(`✅  Generated: ${outputPath}`);
  console.log(`   Size: ${kb} KB`);
  console.log(`   Sections: Header, Partnership Profile, LifeBridge, ThriveUp (10 subsections), Implementation Science, Community Engagement, Professional Background, Education`);
}).catch((err) => {
  console.error("❌  Generation failed:", err);
  process.exit(1);
});
