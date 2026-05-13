const PptxGenJS = require("pptxgenjs");

const MAROON = "6B1C2A";
const DARK_MAROON = "4A1020";
const LIGHT_BG = "FAF8F5";
const DARK_BG = "1A1215";
const SILVER_TEXT = "C9A0A0";
const BODY_TEXT = "6B5050";
const DARK_TEXT = "2A1015";
const WHITE = "FFFFFF";
const GREEN = "10B981";
const VIOLET = "7C3AED";
const INDIGO = "4F46E5";
const BLUE = "2563EB";
const AMBER = "D97706";
const RED = "DC2626";
const TEAL = "0D9488";

const pptx = new PptxGenJS();
pptx.author = "Dr. Terry Flood — The Collaborative Advocate Foundation";
pptx.title = "ThriveUp Academy ACOS Ecosystem — Complete Platform Briefing";
pptx.subject = "24-Platform AI-Powered Workforce Development & Community Enablement Ecosystem";
pptx.layout = "LAYOUT_WIDE";

function addSlide({ bg, speakerNotes, buildFn }) {
  const slide = pptx.addSlide();
  if (typeof bg === "string") {
    slide.background = { color: bg };
  } else {
    slide.background = bg;
  }
  if (speakerNotes) slide.addNotes(speakerNotes);
  buildFn(slide);
  return slide;
}

function addFooter(slide, slideNum, total) {
  slide.addText(`ThriveUp Academy ACOS  |  The Collaborative Advocate Foundation  |  Slide ${slideNum}/${total}`, {
    x: 0.3, y: 7.0, w: 12.5, h: 0.3, fontSize: 8, fontFace: "Arial", color: "999999", align: "center"
  });
}

const TOTAL_SLIDES = 30;

// ============================================================
// SLIDE 1: TITLE
// ============================================================
addSlide({
  bg: { color: MAROON },
  speakerNotes: "Welcome. I'm Dr. Terry Flood, founder and CEO of The Collaborative Advocate Foundation, a 501(c)(3) nonprofit. We are veteran-founded and Black-led, headquartered in Pflugerville, Texas. ThriveUp Academy is the centerpiece of our 24-platform ACOS ecosystem — the Autonomous Collaborative Operating System — designed to break the cycle of poverty, incarceration, and inequity in under-resourced communities through AI-powered education, workforce development, and coordinated intervention. What you're about to see is not a concept deck. Every feature I'll show you is live, running, and measurable today.",
  buildFn: (slide) => {
    slide.addText("ThriveUp Academy", { x: 0.8, y: 1.2, w: 11.5, h: 1.5, fontSize: 48, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
    slide.addText("Autonomous Collaborative Operating System (ACOS)", { x: 0.8, y: 2.8, w: 11.5, h: 0.7, fontSize: 22, fontFace: "Arial", color: "E8E0E0", align: "center" });
    slide.addText("24-Platform AI-Powered Workforce Development & Community Enablement Ecosystem", { x: 0.8, y: 3.6, w: 11.5, h: 0.6, fontSize: 16, fontFace: "Arial", color: "D0D0D0", align: "center" });
    slide.addShape(pptx.ShapeType.rect, { x: 4.5, y: 4.5, w: 4.0, h: 0.04, fill: { color: "FFFFFF" } });
    slide.addText("The Collaborative Advocate Foundation  |  501(c)(3)  |  EIN 41-3618503", { x: 0.8, y: 5.0, w: 11.5, h: 0.5, fontSize: 13, fontFace: "Arial", color: "CCCCCC", align: "center" });
    slide.addText("Veteran-Founded  |  Black-Led  |  Dr. Terry Flood, President", { x: 0.8, y: 5.5, w: 11.5, h: 0.5, fontSize: 13, fontFace: "Arial", color: "BBBBBB", align: "center" });
    slide.addText("17912 Stefano Drive, Pflugerville, TX 78660  |  mr.terryflood@gmail.com", { x: 0.8, y: 6.1, w: 11.5, h: 0.4, fontSize: 11, fontFace: "Arial", color: "999999", align: "center" });
    addFooter(slide, 1, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 2: FOUNDER
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Dr. Terry Flood Sr. holds a Doctorate in Healthcare Administration, Master's degrees in Implementation Science, Psychology, Human Resource Management, Business Administration, Criminal Justice, and graduate-level Public Policy. He is a veteran and the founder and CEO of three entities: The Collaborative Advocate Foundation (501(c)(3) nonprofit), Collaboration & Implementation Professionals LLC (veteran-owned small business), and M&T Consulting Solutions LLC (strategic advisory). His core thesis: Education is the number one protective factor against every social determinant of health. County averages lie — tract-level data tells the truth. And when 2-parent households drop below 60%, poverty rises above 17% in every case studied.",
  buildFn: (slide) => {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.5, h: 7.5, fill: { color: MAROON } });
    slide.addText("Dr. Terry\nFlood Sr.", { x: 0.5, y: 1.5, w: 3.5, h: 1.8, fontSize: 36, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("President", { x: 0.5, y: 3.3, w: 3.5, h: 0.5, fontSize: 16, fontFace: "Arial", color: "DDDDDD" });
    slide.addText("Veteran  |  DHA  |  6 Master's Degrees", { x: 0.5, y: 3.9, w: 3.5, h: 0.5, fontSize: 12, fontFace: "Arial", color: "BBBBBB" });
    const creds = [
      "DHA — Healthcare Administration",
      "MS — Implementation Science",
      "MA — Psychology",
      "MSHRM — Human Resource Management",
      "MBA — Business Administration",
      "MSCJ — Criminal Justice",
      "Public Policy (Graduate)",
    ];
    creds.forEach((c, i) => {
      slide.addText(`\u2022  ${c}`, { x: 0.5, y: 4.6 + i * 0.35, w: 3.5, h: 0.35, fontSize: 10, fontFace: "Arial", color: "DDDDDD" });
    });

    slide.addText("THREE ENTITIES", { x: 5.0, y: 0.5, w: 7.5, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    const entities = [
      { name: "The Collaborative Advocate Foundation", type: "501(c)(3) Nonprofit", ein: "41-3618503", role: "Fiscal Agent & Research Engine" },
      { name: "Collaboration & Implementation Professionals LLC", type: "Veteran-Owned Small Business", ein: "41-4996540", role: "Technology & Consulting" },
      { name: "M&T Consulting Solutions LLC", type: "Consulting Entity", ein: "41-4952178", role: "Strategic Advisory & Program Design" },
    ];
    entities.forEach((e, i) => {
      const y = 1.2 + i * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x: 5.0, y, w: 7.5, h: 1.3, fill: { color: WHITE }, rectRadius: 0.1, line: { color: "E8E0D8", width: 1 } });
      slide.addText(e.name, { x: 5.3, y: y + 0.1, w: 7.0, h: 0.45, fontSize: 14, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(`${e.type}  |  EIN: ${e.ein}`, { x: 5.3, y: y + 0.5, w: 7.0, h: 0.3, fontSize: 11, fontFace: "Arial", color: BODY_TEXT });
      slide.addText(e.role, { x: 5.3, y: y + 0.85, w: 7.0, h: 0.3, fontSize: 11, fontFace: "Arial", color: MAROON });
    });

    slide.addText("CORE PRINCIPLES", { x: 5.0, y: 5.3, w: 7.5, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    const principles = [
      "Education = #1 protective factor against every social determinant",
      "Crime migrates with gentrification — it doesn't disappear",
      "County averages lie — tract-level data tells the truth",
      "2-parent households < 60% → poverty > 17% — every case studied",
    ];
    principles.forEach((p, i) => {
      slide.addText(`\u25B6  ${p}`, { x: 5.0, y: 5.8 + i * 0.4, w: 7.5, h: 0.35, fontSize: 11, fontFace: "Arial", color: DARK_TEXT });
    });
    addFooter(slide, 2, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 3: THE CRISIS
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "The crisis is real and measurable. 67.8% of released individuals are re-arrested within 3 years. Black Americans are incarcerated at 5x the rate of white Americans. 67% of low-income students lack career readiness programs. 82% of future jobs require AI literacy. And county-level averages mask neighborhoods where poverty exceeds 40% and unemployment tops 20%. These aren't abstract statistics — they're the lived reality of the communities we serve. Our platform addresses every one of these indicators with data-driven, coordinated interventions.",
  buildFn: (slide) => {
    slide.addText("THE CRISIS", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 4 });
    slide.addText("Compounding barriers demand\ncoordinated intervention", { x: 0.8, y: 0.9, w: 11, h: 1.4, fontSize: 30, fontFace: "Arial", color: WHITE, bold: true });
    const stats = [
      { stat: "67.8%", label: "3-year recidivism rate\nfor released individuals", color: RED },
      { stat: "5x", label: "Black incarceration rate\nvs. white Americans", color: AMBER },
      { stat: "67%", label: "Low-income students lack\ncareer readiness programs", color: VIOLET },
      { stat: "82%", label: "Future jobs require\ndigital & AI literacy", color: BLUE },
    ];
    stats.forEach((s, i) => {
      const x = 0.5 + i * 3.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.8, w: 2.9, h: 3.2, fill: { color: "2A2025" }, rectRadius: 0.15, line: { color: s.color, width: 2 } });
      slide.addText(s.stat, { x, y: 3.1, w: 2.9, h: 1.2, fontSize: 42, fontFace: "Arial", color: s.color, bold: true, align: "center" });
      slide.addText(s.label, { x: x + 0.2, y: 4.3, w: 2.5, h: 1.2, fontSize: 12, fontFace: "Arial", color: "D0D0D0", align: "center" });
    });
    slide.addText("County averages mask neighborhoods where poverty exceeds 40% and unemployment tops 20%", { x: 0.8, y: 6.3, w: 11.5, h: 0.4, fontSize: 12, fontFace: "Arial", color: "AAAAAA", align: "center", italic: true });
    addFooter(slide, 3, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 4: 24-PLATFORM ECOSYSTEM
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "This is the ACOS — our 24-platform Autonomous Collaborative Operating System. Each platform is a specialized tool addressing a specific domain: education, health equity, workforce development, criminal justice, veterans services, business development, research, and community safety. These are not separate apps — they are autonomous agents that communicate with each other, share data, coordinate interventions, and report outcomes. The hub orchestrates without bottlenecking. Each platform operates autonomously within its domain while maintaining coordinated alignment through the ecosystem bridge.",
  buildFn: (slide) => {
    slide.addText("24-PLATFORM ACOS ECOSYSTEM", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Autonomous Collaborative Operating System", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const platforms = [
      { name: "ThriveUp Academy", domain: "Youth & Education" },
      { name: "ISSS", domain: "School Wraparound" },
      { name: "WholeMind Learning", domain: "Adaptive Learning" },
      { name: "Perfectly Different", domain: "Neurodivergent" },
      { name: "LifeBridge", domain: "Housing" },
      { name: "M2C Transition", domain: "Benefits" },
      { name: "Mission Transition", domain: "Military-Civilian" },
      { name: "MCE", domain: "Minority Business" },
      { name: "Collaborative Advocate", domain: "VOSB Consulting" },
      { name: "Whole-Person Health", domain: "Clinical" },
      { name: "Sankofa Health", domain: "Cultural Health" },
      { name: "Black Maternal Health", domain: "Perinatal" },
      { name: "Sankofa Feminine Health", domain: "Women's Health" },
      { name: "Sankofa Men's Health", domain: "Men's Health" },
      { name: "SafeCogniCare", domain: "TBI/Cognitive" },
      { name: "PillScheduler", domain: "Medication" },
      { name: "SafeReport", domain: "Community Safety" },
      { name: "Shield Atlas", domain: "Cybersecurity" },
      { name: "RPLICE / Better Science", domain: "Research" },
      { name: "Video Creator AI", domain: "Content" },
      { name: "Pinnacle Business", domain: "Business Dev" },
      { name: "LexiBridge", domain: "Legal Navigation" },
      { name: "Code Canvas", domain: "Digital Skills" },
      { name: "Ecosystem Nexus", domain: "Integration" },
    ];
    const colors = [VIOLET, BLUE, INDIGO, "EC4899", GREEN, TEAL, "64748B", AMBER, "EA580C", "E11D48", RED, "D946EF", "A855F7", "06B6D4", "0EA5E9", "84CC16", "EAB308", "6B7280", BLUE, VIOLET, "EA580C", "475569", INDIGO, TEAL];
    platforms.forEach((p, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = 0.5 + col * 2.1;
      const y = 1.6 + row * 1.4;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.95, h: 1.15, fill: { color: WHITE }, rectRadius: 0.08, line: { color: colors[i], width: 2 } });
      slide.addText(p.name, { x: x + 0.08, y: y + 0.12, w: 1.8, h: 0.45, fontSize: 9, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(p.domain, { x: x + 0.08, y: y + 0.6, w: 1.8, h: 0.35, fontSize: 8, fontFace: "Arial", color: BODY_TEXT });
    });
    slide.addText("Each platform = autonomous agent  |  Coordinated through ecosystem bridge  |  Domain-specific intelligence", { x: 0.5, y: 7.1, w: 12, h: 0.3, fontSize: 9, fontFace: "Arial", color: "999999", align: "center" });
    addFooter(slide, 4, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 5: JUSTICE COMMAND CENTER
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "The Justice Command Center is our criminal justice intelligence hub. It tracks national crisis indicators: the 67.8% 3-year recidivism rate, 1.9 million currently incarcerated, racial sentencing disparities across drug, violent, property, and weapons offenses. It includes a Racial Disparity Dashboard tracking school suspensions, poverty, and youth unemployment by race. The Data Storyteller tab combines Census tract demographics, gun violence data from our National Gun Violence Tracker, and AI-powered narratives to tell the story of each neighborhood — not the county average, the neighborhood. We have evidence-based program profiles for FFT, MST, CURE Violence, and others with cost-benefit data. Every metric feeds directly into our grant narratives and intervention targeting.",
  buildFn: (slide) => {
    slide.addText("JUSTICE COMMAND CENTER", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Criminal Justice Intelligence & Intervention Hub", { x: 0.8, y: 0.8, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: WHITE, bold: true });
    const sections = [
      { title: "National Crisis Indicators", items: ["67.8% recidivism rate (3-year)", "1.9M currently incarcerated", "Racial sentencing disparities", "School-to-prison pipeline tracking"], color: RED },
      { title: "Racial Disparity Dashboard", items: ["Suspension rates by race", "Poverty concentration mapping", "Youth unemployment disparities", "Foster-to-prison correlations"], color: AMBER },
      { title: "Data Storyteller", items: ["Census tract-level demographics", "Gun violence incident mapping", "AI-powered data narratives", "Multi-city comparison dashboards"], color: BLUE },
      { title: "Evidence-Based Programs", items: ["FFT, MST, CURE Violence profiles", "Cost-benefit analysis per program", "Outcome data and success rates", "DOJ & SAMHSA alignment"], color: GREEN },
    ];
    sections.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.2;
      const y = 2.0 + row * 2.6;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.8, h: 2.3, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: s.color, width: 2 } });
      slide.addText(s.title, { x: x + 0.2, y: y + 0.1, w: 5.4, h: 0.45, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
      s.items.forEach((item, j) => {
        slide.addText(`\u2022  ${item}`, { x: x + 0.2, y: y + 0.6 + j * 0.38, w: 5.4, h: 0.35, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
      });
    });
    addFooter(slide, 5, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 6: REENTRY & CASE MANAGEMENT
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Our Reentry Dashboard is a full case management system for justice-involved individuals. It tracks people through 5 phases: Pre-Release, Transition, Stabilization, Independence, and Growth. Each individual gets a Thrive Score across 6 domains: Education, Employment, Housing, Health, Social connections, and Legal compliance. The system generates court-ready progress reports, manages service delivery records, and tracks milestone completion. We have intake assessments that capture justice history including incarceration length and legal status. The Justice Partners portal connects directly with the Texas Juvenile Justice Department and Travis County Juvenile Probation for bidirectional data exchange. All outcome tracking aligns with DOJ metrics and Second Chance Act grant requirements.",
  buildFn: (slide) => {
    slide.addText("REENTRY & CASE MANAGEMENT", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Phase-Based Reintegration System", { x: 0.8, y: 0.7, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const phases = ["Pre-Release", "Transition", "Stabilization", "Independence", "Growth"];
    phases.forEach((p, i) => {
      const x = 0.5 + i * 2.45;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: 2.2, h: 0.7, fill: { color: MAROON }, rectRadius: 0.08 });
      slide.addText(`${i + 1}. ${p}`, { x, y: 1.7, w: 2.2, h: 0.7, fontSize: 11, fontFace: "Arial", color: WHITE, bold: true, align: "center", valign: "middle" });
      if (i < 4) {
        slide.addText("\u2192", { x: x + 2.15, y: 1.7, w: 0.3, h: 0.7, fontSize: 16, fontFace: "Arial", color: MAROON, align: "center", valign: "middle" });
      }
    });

    slide.addText("THRIVE SCORE — 6 DOMAINS", { x: 0.8, y: 2.8, w: 5.5, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 2 });
    const domains = ["Education", "Employment", "Housing", "Health", "Social", "Legal"];
    const domColors = [VIOLET, BLUE, GREEN, RED, AMBER, "64748B"];
    domains.forEach((d, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.5 + col * 2.0;
      const y = 3.4 + row * 1.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 1.8, h: 0.75, fill: { color: WHITE }, rectRadius: 0.08, line: { color: domColors[i], width: 2 } });
      slide.addText(d, { x, y, w: 1.8, h: 0.75, fontSize: 12, fontFace: "Arial", color: DARK_TEXT, bold: true, align: "center", valign: "middle" });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 2.8, w: 5.8, h: 4.0, fill: { color: WHITE }, rectRadius: 0.12, line: { color: "E0D8D0", width: 1 } });
    slide.addText("System Capabilities", { x: 7.1, y: 2.9, w: 5.2, h: 0.5, fontSize: 16, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const caps = [
      "Court-ready progress reports (automated)",
      "Service delivery record tracking",
      "Intake assessments with justice history",
      "Milestone completion with phase transitions",
      "Justice Partners portal (TJJD, Travis County)",
      "Bidirectional data exchange API",
      "DOJ-aligned outcome tracking",
      "Second Chance Act grant alignment",
    ];
    caps.forEach((c, i) => {
      slide.addText(`\u2713  ${c}`, { x: 7.1, y: 3.5 + i * 0.38, w: 5.2, h: 0.35, fontSize: 11, fontFace: "Arial", color: DARK_TEXT });
    });
    addFooter(slide, 6, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 7: GUN VIOLENCE & DATA STORYTELLER
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "The Data Storyteller is tab 16 of the Justice Command Center. It builds a neighborhood-to-school-to-outcomes pipeline. Start with a neighborhood — say Creekwood in Wilmington, North Carolina. Pull Census demographics for that tract. Layer in gun violence data from our National Gun Violence Tracker — a separate live platform at gun-violence-registry.replit.app that provides real-time incident data with city/state filtering, multi-city comparison, monthly trends, and incident type breakdowns. Then layer in school performance data. The AI generates a narrative that connects the dots: this neighborhood has this poverty rate, this many gun violence incidents, these school outcomes — here's the story the data tells. We have 18+ pre-loaded high-impact cities plus custom city input. This is what funders need to see — not county averages, but the ground truth.",
  buildFn: (slide) => {
    slide.addText("DATA STORYTELLER & GUN VIOLENCE INTELLIGENCE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Neighborhood \u2192 School \u2192 Outcomes Pipeline", { x: 0.8, y: 0.8, w: 11, h: 0.8, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const pipeline = [
      { step: "1", title: "Neighborhood", desc: "Census tract-level\ndemographics & SDOH" },
      { step: "2", title: "Gun Violence", desc: "Real-time incidents\nfrom GV Tracker API" },
      { step: "3", title: "School Data", desc: "Performance metrics\n& pipeline indicators" },
      { step: "4", title: "AI Narrative", desc: "Data-driven story\nfor funders & policy" },
    ];
    pipeline.forEach((p, i) => {
      const x = 0.5 + i * 3.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: 2.8, h: 2.0, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: "3A3035", width: 1 } });
      slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.1, y: 2.35, w: 0.5, h: 0.5, fill: { color: MAROON } });
      slide.addText(p.step, { x: x + 0.1, y: 2.35, w: 0.5, h: 0.5, fontSize: 14, fontFace: "Arial", color: WHITE, bold: true, align: "center", valign: "middle" });
      slide.addText(p.title, { x: x + 0.7, y: 2.35, w: 2.0, h: 0.5, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(p.desc, { x: x + 0.15, y: 3.0, w: 2.5, h: 1.0, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
      if (i < 3) slide.addText("\u2192", { x: x + 2.75, y: 2.8, w: 0.4, h: 0.6, fontSize: 20, fontFace: "Arial", color: MAROON, align: "center", valign: "middle" });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 4.8, w: 6.0, h: 2.2, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: "3A3035", width: 1 } });
    slide.addText("National Gun Violence Tracker", { x: 0.8, y: 4.9, w: 5.5, h: 0.45, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("Live API at gun-violence-registry.replit.app", { x: 0.8, y: 5.3, w: 5.5, h: 0.3, fontSize: 10, fontFace: "Arial", color: "AAAAAA" });
    const gvFeatures = ["City/state filtering", "Multi-city comparison", "Monthly trends", "Incident type breakdowns"];
    gvFeatures.forEach((f, i) => {
      slide.addText(`\u2022  ${f}`, { x: 0.8 + (i % 2) * 2.8, y: 5.7 + Math.floor(i / 2) * 0.4, w: 2.6, h: 0.35, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 4.8, w: 6.0, h: 2.2, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: "3A3035", width: 1 } });
    slide.addText("Pre-Loaded Cities", { x: 7.1, y: 4.9, w: 5.5, h: 0.45, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
    const cities = ["Wilmington NC (Creekwood)", "Austin TX", "Buffalo NY", "Baltimore MD", "Detroit MI", "Memphis TN", "+ 14 more cities"];
    cities.forEach((c, i) => {
      slide.addText(`\u2022  ${c}`, { x: 7.1 + (i % 2) * 2.8, y: 5.4 + Math.floor(i / 2) * 0.35, w: 2.6, h: 0.3, fontSize: 10, fontFace: "Arial", color: "D0D0D0" });
    });
    addFooter(slide, 7, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 8: AUTONOMOUS AGENT NETWORK
// ============================================================
addSlide({
  bg: { color: VIOLET },
  speakerNotes: "This is what makes us different from any other platform. Every one of our 24 platforms is an autonomous agent. They don't just sit in a list — they communicate with each other. When ThriveUp Academy identifies a student with housing instability, it doesn't just flag it. It sends a targeted exchange to LifeBridge with documented reasoning: 'Student ID 247 has housing risk score above threshold. LifeBridge has housing transition capabilities. Requesting intake assessment.' That exchange is logged, tracked, and auditable. Every exchange requires minimum 50 characters of reasoning — WHY this platform, WHY now, what's the expected outcome. Generic messages like 'sending data' or 'FYI' are rejected by the system. This is autonomous but accountable coordination.",
  buildFn: (slide) => {
    slide.addText("AUTONOMOUS AGENT NETWORK", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: "E8E0FF", bold: true, charSpacing: 3 });
    slide.addText("24 Platforms. Reasoning-Required.\nAutonomous but Accountable.", { x: 0.8, y: 0.8, w: 11, h: 1.2, fontSize: 28, fontFace: "Arial", color: WHITE, bold: true });

    const cols = [
      { title: "Targeted Exchange", desc: "Platform-to-platform messaging with domain validation and confidence scoring (high/medium/low). Every exchange documented.", icon: "\u2709" },
      { title: "Smart Broadcasting", desc: "Domain-filtered delivery. Health alert reaches 10 platforms with health capability. data_share broadcasts rejected — target instead.", icon: "\uD83D\uDCE1" },
      { title: "DeepSeek Reasoning", desc: "Any platform can request AI-powered strategic analysis: Should I act? Who to coordinate with? What's the impact?", icon: "\uD83E\uDDE0" },
    ];
    cols.forEach((c, i) => {
      const x = 0.5 + i * 4.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.4, w: 3.85, h: 2.8, fill: { color: "5B21B6" }, rectRadius: 0.12 });
      slide.addText(c.title, { x: x + 0.2, y: 2.6, w: 3.45, h: 0.5, fontSize: 17, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(c.desc, { x: x + 0.2, y: 3.2, w: 3.45, h: 1.8, fontSize: 12, fontFace: "Arial", color: "E0D0FF" });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 5.6, w: 12.1, h: 1.2, fill: { color: "4C1D95" }, rectRadius: 0.1 });
    slide.addText("REASONING ENFORCEMENT", { x: 0.8, y: 5.7, w: 3.0, h: 0.4, fontSize: 11, fontFace: "Arial", color: "E8E0FF", bold: true });
    slide.addText("Every exchange requires 50+ characters of documented reasoning: WHY this platform, WHY now, expected outcome. Generic phrases rejected. All exchanges logged in agent_exchanges database table with timestamps, alignment scores, and response tracking.", {
      x: 0.8, y: 6.1, w: 11.5, h: 0.5, fontSize: 11, fontFace: "Arial", color: "D0C0FF"
    });
    addFooter(slide, 8, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 9: AGENT COMMUNICATION ENDPOINTS
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Here are the seven API endpoints that power the agent communication layer. POST exchange for targeted platform-to-platform messaging. POST broadcast for domain-filtered alerts. POST respond for acknowledging, acting on, declining, or deferring messages. GET inbox for pending messages with action-required flags. GET capabilities for the full data flow map showing what each platform can provide and consume. GET network for communication activity and partnership tracking. And POST reason for DeepSeek-powered strategic reasoning. Every endpoint validates domain alignment. The capabilities endpoint shows compatible platforms — who can send what to whom based on domain matching.",
  buildFn: (slide) => {
    slide.addText("AGENT COMMUNICATION API", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("7 Endpoints Powering Autonomous Coordination", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const endpoints = [
      { method: "POST", path: "/api/ecosystem/agent/exchange", desc: "Targeted platform-to-platform exchange with reasoning validation and domain alignment", color: GREEN },
      { method: "POST", path: "/api/ecosystem/agent/broadcast", desc: "Domain-filtered broadcast (alerts, outcomes, feedback only — data_share blocked)", color: BLUE },
      { method: "POST", path: "/api/ecosystem/agent/respond", desc: "Acknowledge, act on, decline, or defer an exchange with documented reasoning", color: VIOLET },
      { method: "GET", path: "/api/ecosystem/agent/inbox", desc: "Platform inbox with pending messages, action-required flags, and priorities", color: AMBER },
      { method: "GET", path: "/api/ecosystem/agent/capabilities", desc: "Full data flow map: canProvide, canConsume, domains, compatible platforms", color: TEAL },
      { method: "GET", path: "/api/ecosystem/agent/network", desc: "Communication network activity, partnership tracking, exchange history", color: "64748B" },
      { method: "POST", path: "/api/ecosystem/agent/reason", desc: "DeepSeek-powered strategic reasoning: context-aware analysis and recommendations", color: INDIGO },
    ];
    endpoints.forEach((ep, i) => {
      const y = 1.5 + i * 0.78;
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y, w: 12.1, h: 0.65, fill: { color: WHITE }, rectRadius: 0.06, line: { color: ep.color, width: 1.5 } });
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: y + 0.12, w: 0.7, h: 0.4, fill: { color: ep.method === "POST" ? MAROON : "475569" }, rectRadius: 0.05 });
      slide.addText(ep.method, { x: 0.7, y: y + 0.12, w: 0.7, h: 0.4, fontSize: 8, fontFace: "Arial", color: WHITE, bold: true, align: "center", valign: "middle" });
      slide.addText(ep.path, { x: 1.55, y: y + 0.05, w: 4.2, h: 0.28, fontSize: 10, fontFace: "Courier New", color: DARK_TEXT });
      slide.addText(ep.desc, { x: 1.55, y: y + 0.32, w: 10.8, h: 0.28, fontSize: 9, fontFace: "Arial", color: BODY_TEXT });
    });
    addFooter(slide, 9, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 10: RPLICE ACTIVATION PIPELINE
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "The RPLICE Activation Pipeline has four AI-powered tools that transform Census data and implementation science research into grant-ready deliverables. The Grant Narrative Generator has 8 funder-specific voice profiles — it doesn't just write a narrative, it writes it in the voice each funder expects. BB Collective gets research-heavy language. Rare Impact gets youth empowerment framing. St. David's gets community health focus. The Community Action Planner generates 90-day implementation plans with 18 milestones across 3 phases, assigning responsible platforms for each milestone. The Outcome Baseline Dashboard locks Census ACS metrics as baselines and tracks improvement gaps. The Platform-to-Intervention Matcher maps risk factors to platform capabilities — high poverty automatically routes to workforce development platforms, low educational attainment routes to education platforms.",
  buildFn: (slide) => {
    slide.addText("RPLICE ACTIVATION PIPELINE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Census Data \u2192 AI Analysis \u2192 Grant-Ready Deliverables", { x: 0.8, y: 0.8, w: 11, h: 0.8, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const tools = [
      { title: "Grant Narrative Generator", desc: "8 funder-specific voice profiles. SSE streaming. Narratives tuned to funder priorities, evaluation criteria, and language patterns.", badges: ["BB Collective $50K", "Rare Impact $500K", "St. David's $1M", "SSG Fox $750K"], color: AMBER },
      { title: "Community Action Planner", desc: "AI-generated 90-day plans with 18 milestones across 3 phases. Each milestone assigns responsible platforms with success criteria.", badges: ["90-Day Timeline", "18 Milestones", "3 Phases", "Platform Assignments"], color: BLUE },
      { title: "Outcome Baseline Dashboard", desc: "Locks Census ACS metrics as baselines. Sets improvement targets. Tracks current gaps with visual progress. Feeds into grant reports.", badges: ["Census Baselines", "Target Setting", "Gap Tracking", "Grant Reporting"], color: GREEN },
      { title: "Platform-to-Intervention Matcher", desc: "Maps risk factors to platform capabilities. High poverty \u2192 workforce platforms. Low education \u2192 education platforms. Live health status.", badges: ["Risk Mapping", "Live Status", "Domain Matching", "Action Plans"], color: VIOLET },
    ];
    tools.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.3;
      const y = 2.0 + row * 2.6;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.3, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: t.color, width: 2 } });
      slide.addText(t.title, { x: x + 0.2, y: y + 0.15, w: 5.5, h: 0.45, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(t.desc, { x: x + 0.2, y: y + 0.6, w: 5.5, h: 0.9, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
      slide.addText(t.badges.join("  |  "), { x: x + 0.2, y: y + 1.6, w: 5.5, h: 0.4, fontSize: 9, fontFace: "Arial", color: t.color });
    });
    addFooter(slide, 10, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 11: ECOSYSTEM RPLICE BRIDGE
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "The Ecosystem RPLICE Bridge is the intelligence distribution system. Every heartbeat response — the regular check-in each platform makes to the hub — now includes domain-filtered RPLICE intelligence. Health platforms get health metrics. Education platforms get education data. Workforce platforms get employment data. Platforms with no overlap get 'awareness only — no action required.' Four types of intelligence are delivered: intervention assignments with action vs awareness distinction and confidence scoring; action plan milestones filtered to owner vs contributor role; outcome baselines filtered to domain-relevant metrics; and reasoning justification explaining why this platform received this intelligence. It's transparent, auditable, and defensible.",
  buildFn: (slide) => {
    slide.addText("ECOSYSTEM RPLICE BRIDGE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Domain-Targeted Intelligence Delivery", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const items = [
      { title: "Intervention Assignments", desc: "Risk factors matched to platform capabilities with action vs. awareness distinction and confidence scoring", color: RED },
      { title: "Action Plan Milestones", desc: "90-day milestones filtered to owner vs. contributor role — platforms only see what they're responsible for", color: GREEN },
      { title: "Outcome Baselines", desc: "Census metrics filtered to domain-relevant indicators — education sees attainment, health sees insurance coverage", color: BLUE },
      { title: "Reasoning Justification", desc: "Every intelligence delivery explains WHY this platform received it — transparent, auditable, defensible", color: AMBER },
    ];
    items.forEach((item, i) => {
      const x = 0.5 + i * 3.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: 2.9, h: 3.0, fill: { color: WHITE }, rectRadius: 0.12, line: { color: item.color, width: 2 } });
      slide.addText(item.title, { x: x + 0.15, y: 1.9, w: 2.6, h: 0.5, fontSize: 13, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(item.desc, { x: x + 0.15, y: 2.5, w: 2.6, h: 1.8, fontSize: 11, fontFace: "Arial", color: BODY_TEXT });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 5.1, w: 12.1, h: 1.8, fill: { color: MAROON }, rectRadius: 0.12 });
    slide.addText("HEARTBEAT INTELLIGENCE PACKAGE", { x: 0.8, y: 5.2, w: 5.0, h: 0.4, fontSize: 11, fontFace: "Arial", color: "E8E0E0", bold: true, charSpacing: 2 });
    slide.addText("Every platform heartbeat now includes: RPLICE intelligence filtered to domain  |  Agent inbox with pending messages  |  Agent identity with autonomy scope  |  7 agent endpoints for self-service communication", {
      x: 0.8, y: 5.7, w: 11.5, h: 0.9, fontSize: 12, fontFace: "Arial", color: "DDDDDD"
    });
    addFooter(slide, 11, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 12: AI ENGINE
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "Our AI engine uses 5 providers with automatic failover. Gemini 2.0 Flash is the primary — it's free and fast. When Gemini hits rate limits, we fail over to Claude Haiku 4.5 or GPT-5 Nano through Replit's AI integrations, which come pre-budgeted. DeepSeek R1 via OpenRouter handles our strategic reasoning — the think tags are auto-stripped. The system detects rate limits in real-time and switches providers seamlessly. The user never sees an error. This multi-provider approach means we're never dependent on a single AI vendor and we keep costs near zero for the nonprofit.",
  buildFn: (slide) => {
    slide.addText("5-PROVIDER AI ENGINE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Automatic Failover. Zero Downtime.", { x: 0.8, y: 0.8, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: WHITE, bold: true });

    const providers = [
      { name: "Gemini 2.0 Flash", role: "Primary (Free)", desc: "Fast, free, handles 90%+ of requests", color: BLUE },
      { name: "Claude Haiku 4.5", role: "Failover 1", desc: "Anthropic quality for complex reasoning", color: AMBER },
      { name: "GPT-5 Nano", role: "Failover 2", desc: "OpenAI via Replit AI Integrations", color: GREEN },
      { name: "DeepSeek R1", role: "Strategic Reasoning", desc: "Via OpenRouter, think tags auto-stripped", color: VIOLET },
      { name: "Replit AI", role: "Integrated", desc: "Pre-budgeted through platform integration", color: TEAL },
    ];
    providers.forEach((p, i) => {
      const x = 0.3 + i * 2.55;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: 2.3, h: 3.0, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: p.color, width: 2 } });
      slide.addText(p.name, { x: x + 0.1, y: 2.5, w: 2.1, h: 0.5, fontSize: 13, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
      slide.addText(p.role, { x: x + 0.1, y: 3.0, w: 2.1, h: 0.4, fontSize: 11, fontFace: "Arial", color: p.color, align: "center" });
      slide.addText(p.desc, { x: x + 0.1, y: 3.5, w: 2.1, h: 1.2, fontSize: 10, fontFace: "Arial", color: "D0D0D0", align: "center" });
    });

    slide.addText("Rate limit detection  \u2192  Automatic provider switch  \u2192  Zero user-facing errors  \u2192  Near-zero AI costs for nonprofit", {
      x: 0.8, y: 5.8, w: 11.5, h: 0.5, fontSize: 12, fontFace: "Arial", color: "AAAAAA", align: "center"
    });
    addFooter(slide, 12, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 13: AI MASTERY CURRICULUM
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "The curriculum has 60 deep, real lessons — no placeholders. AI Literacy covers 30 lessons across 10 modules for grades 6-8 and 9-12. Workforce Readiness has 21 lessons across 7 modules. Social-Emotional Learning has 9 lessons across 3 modules for grades 3-5, 6-8, and 9-12. Each lesson includes thousands of words of instruction, interactive activities, and grant-aligned content. Students progress through 5 mastery levels: Explorer, Guide, Architect, Innovator, and Master. Each level has capstone projects and parent teachback verification. The AI companions — Spark for students, Sparky for adults — adapt to grade level, use Socratic questioning, and include comprehensive safety guardrails.",
  buildFn: (slide) => {
    slide.addText("AI MASTERY CURRICULUM", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("60 Real Lessons. Five Mastery Levels. No Placeholders.", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 22, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const levels = [
      { name: "Explorer", desc: "Discover AI basics", color: GREEN },
      { name: "Guide", desc: "Master prompting", color: BLUE },
      { name: "Architect", desc: "AI systems", color: VIOLET },
      { name: "Innovator", desc: "Entrepreneurship", color: AMBER },
      { name: "Master", desc: "Lead & educate", color: MAROON },
    ];
    levels.forEach((l, i) => {
      const x = 0.3 + i * 2.55;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.6, w: 2.3, h: 1.5, fill: { color: WHITE }, rectRadius: 0.1, line: { color: l.color, width: 2 } });
      slide.addText(`Level ${i + 1}: ${l.name}`, { x: x + 0.1, y: 1.8, w: 2.1, h: 0.5, fontSize: 12, fontFace: "Arial", color: DARK_TEXT, bold: true, align: "center" });
      slide.addText(l.desc, { x: x + 0.1, y: 2.3, w: 2.1, h: 0.5, fontSize: 11, fontFace: "Arial", color: BODY_TEXT, align: "center" });
    });

    const subjects = [
      { name: "AI Literacy", lessons: "30 lessons / 10 modules", grades: "Grades 6-8 & 9-12" },
      { name: "Workforce Readiness", lessons: "21 lessons / 7 modules", grades: "Grades 6-8 & 9-12" },
      { name: "Social-Emotional", lessons: "9 lessons / 3 modules", grades: "Grades 3-5, 6-8, 9-12" },
    ];
    subjects.forEach((s, i) => {
      const x = 0.5 + i * 4.1;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 3.5, w: 3.8, h: 1.6, fill: { color: WHITE }, rectRadius: 0.1, line: { color: "E0D8D0", width: 1 } });
      slide.addText(s.name, { x: x + 0.2, y: 3.6, w: 3.4, h: 0.5, fontSize: 16, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(s.lessons, { x: x + 0.2, y: 4.1, w: 3.4, h: 0.35, fontSize: 12, fontFace: "Arial", color: MAROON });
      slide.addText(s.grades, { x: x + 0.2, y: 4.5, w: 3.4, h: 0.35, fontSize: 11, fontFace: "Arial", color: BODY_TEXT });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 5.5, w: 5.8, h: 1.3, fill: { color: WHITE }, rectRadius: 0.1, line: { color: "E0D8D0", width: 1 } });
    slide.addText("Spark — AI for Students", { x: 0.8, y: 5.6, w: 5.2, h: 0.4, fontSize: 14, fontFace: "Arial", color: MAROON, bold: true });
    slide.addText("Grade-band adaptive, Socratic questioning, bilingual, safety guardrails", { x: 0.8, y: 6.0, w: 5.2, h: 0.5, fontSize: 11, fontFace: "Arial", color: BODY_TEXT });

    slide.addShape(pptx.ShapeType.roundRect, { x: 6.6, y: 5.5, w: 5.8, h: 1.3, fill: { color: WHITE }, rectRadius: 0.1, line: { color: "E0D8D0", width: 1 } });
    slide.addText("Sparky — AI for Adults", { x: 6.9, y: 5.6, w: 5.2, h: 0.4, fontSize: 14, fontFace: "Arial", color: MAROON, bold: true });
    slide.addText("Parents & teachers: compassionate, evidence-based, context-aware", { x: 6.9, y: 6.0, w: 5.2, h: 0.5, fontSize: 11, fontFace: "Arial", color: BODY_TEXT });
    addFooter(slide, 13, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 14: CAREER PATHWAYS & WORKFORCE
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "55 career pathways across 12 industry categories. Technology, Healthcare, Business, Engineering, Skilled Trades, Military & Public Service, Arts, Education, Law & Justice, Science, Media, and Agriculture. Each pathway has structured progression from exploration through job readiness, skill training, and career placement. The AI Workforce Academy provides adult professional AI training across 7 tracks aligned with WIOA standards. The Program Management Academy offers standalone PM certification curriculum. All pathways connect to employer partnerships and our mentor network for direct placement pipelines.",
  buildFn: (slide) => {
    slide.addText("CAREER PATHWAYS & WORKFORCE DEVELOPMENT", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("55 Pathways. 12 Industries. Direct Placement.", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const cats = [
      { name: "Technology", count: 8 }, { name: "Healthcare", count: 6 },
      { name: "Business & Finance", count: 5 }, { name: "Engineering", count: 5 },
      { name: "Skilled Trades", count: 8 }, { name: "Military/Public Svc", count: 5 },
      { name: "Arts & Creative", count: 4 }, { name: "Education", count: 3 },
      { name: "Law & Justice", count: 3 }, { name: "Science & Research", count: 3 },
      { name: "Media & Comms", count: 3 }, { name: "Agriculture", count: 2 },
    ];
    cats.forEach((c, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 0.5 + col * 3.15;
      const y = 1.8 + row * 1.2;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.9, h: 0.95, fill: { color: "2A2025" }, rectRadius: 0.08, line: { color: "3A3035", width: 1 } });
      slide.addText(c.name, { x: x + 0.15, y: y + 0.05, w: 2.0, h: 0.45, fontSize: 12, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(`${c.count} pathways`, { x: x + 0.15, y: y + 0.5, w: 2.0, h: 0.35, fontSize: 10, fontFace: "Arial", color: "AAAAAA" });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 5.5, w: 5.8, h: 1.5, fill: { color: "2A2025" }, rectRadius: 0.1, line: { color: VIOLET, width: 1 } });
    slide.addText("AI Workforce Academy", { x: 0.8, y: 5.6, w: 5.2, h: 0.4, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("Adult professional AI training across 7 tracks, WIOA-aligned", { x: 0.8, y: 6.1, w: 5.2, h: 0.5, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });

    slide.addShape(pptx.ShapeType.roundRect, { x: 6.6, y: 5.5, w: 5.8, h: 1.5, fill: { color: "2A2025" }, rectRadius: 0.1, line: { color: AMBER, width: 1 } });
    slide.addText("TEKS §127.15 CTE Alignment", { x: 6.9, y: 5.6, w: 5.2, h: 0.4, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("Full employability skills alignment, Workforce Readiness Certificate", { x: 6.9, y: 6.1, w: 5.2, h: 0.5, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
    addFooter(slide, 14, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 15: AI CREATION STUDIO & TOOLS
// ============================================================
addSlide({
  bg: { color: MAROON },
  speakerNotes: "The AI Creation Studio gives students 10 professional-grade tools — but only after they earn access by completing curriculum modules. This is our mastery-gated approach: prove you understand responsible AI use before accessing powerful tools. The tools include Presentation Builder, Video Script Creator, Sales Pitch Builder, Business Plan Generator, Research Assistant, Life Planner, Project Planner, Document Writer, Resume Builder, and Brainstorm Studio. Adults access all tools through Sparky. Beyond the studio, we have a full Video Production Pipeline for content creation, rendering, and distribution, and an Empathetic AI Navigator that provides persistent, context-aware chat leveraging SDOH and criminal justice frameworks with GIS data.",
  buildFn: (slide) => {
    slide.addText("AI CREATION STUDIO", { x: 0.8, y: 0.8, w: 5.0, h: 0.8, fontSize: 30, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("10 professional tools earned through mastery — not purchased", { x: 0.8, y: 1.8, w: 5.0, h: 0.7, fontSize: 15, fontFace: "Arial", color: "DDDDDD" });
    const tools = [
      "Presentation Builder", "Video Script Creator", "Sales Pitch Builder",
      "Business Plan Generator", "Research Assistant", "Life Planner",
      "Project Planner", "Document Writer", "Resume Builder", "Brainstorm Studio",
    ];
    tools.forEach((tool, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 6.5 + col * 3.2;
      const y = 0.5 + row * 1.2;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.9, h: 0.9, fill: { color: "3A3035" }, rectRadius: 0.1 });
      slide.addText(`\u2713 ${tool}`, { x: x + 0.2, y, w: 2.5, h: 0.9, fontSize: 12, fontFace: "Arial", color: "F5F5F5" });
    });
    slide.addText("Also: Video Production Pipeline  |  Empathetic AI Navigator  |  RAG-Powered Ecosystem Chatbot", {
      x: 0.8, y: 6.5, w: 11.5, h: 0.4, fontSize: 11, fontFace: "Arial", color: "BBBBBB", align: "center"
    });
    addFooter(slide, 15, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 16: PANTHER VILLAGE
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Panther Village is our immersive virtual campus for 6th-grade students. It features interactive buildings, avatar customization with skin tones and outfits, house systems with merit points, daily quests, and leaderboards. The stock market simulator teaches financial literacy through real-time trading simulation. The Academy Wallet provides a virtual currency system. The Campus Builder lets students fund and build virtual features. My Journal supports daily reflections and check-ins. Dream Design is a career and college goal-setting interface. And STAAR Prep provides grade-level test preparation aligned to Texas TEKS standards.",
  buildFn: (slide) => {
    slide.addText("PANTHER VILLAGE ACADEMY", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Gamified Virtual Campus", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const features = [
      { title: "Interactive Campus", items: ["Avatar customization", "House system & merit", "Daily quests & leaderboards"] },
      { title: "Financial Literacy", items: ["Stock Market Simulator", "Academy Wallet currency", "Campus Builder funding"] },
      { title: "Personal Growth", items: ["My Journal reflections", "Dream Design goals", "STAAR Test Prep"] },
      { title: "Gamification", items: ["Panther Power scoring", "Achievements & certificates", "Academic competitions"] },
    ];
    features.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.3;
      const y = 1.6 + row * 2.6;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.3, fill: { color: WHITE }, rectRadius: 0.12, line: { color: "E0D8D0", width: 1 } });
      slide.addText(f.title, { x: x + 0.2, y: y + 0.1, w: 5.5, h: 0.45, fontSize: 16, fontFace: "Arial", color: DARK_TEXT, bold: true });
      f.items.forEach((item, j) => {
        slide.addText(`\u2713  ${item}`, { x: x + 0.2, y: y + 0.6 + j * 0.45, w: 5.5, h: 0.4, fontSize: 12, fontFace: "Arial", color: BODY_TEXT });
      });
    });
    addFooter(slide, 16, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 17: HEALTH EQUITY PLATFORMS
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "Our health equity ecosystem includes 7 specialized platforms. Whole-Person Health provides clinical screenings and whole-person assessments. Sankofa Health delivers culturally responsive health services. Black Maternal Health addresses the maternal mortality crisis with perinatal care — Black women are 3 to 4 times more likely to die from pregnancy-related causes. Sankofa Feminine Health and Sankofa Men's Health provide gender-specific care. SafeCogniCare focuses on cognitive health and TBI — critical for veterans and justice-involved populations. PillScheduler handles medication adherence. Together these platforms share data through the agent network — a patient flagged in one platform automatically triggers relevant assessments in others.",
  buildFn: (slide) => {
    slide.addText("HEALTH EQUITY ECOSYSTEM", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("7 Specialized Health Platforms — Coordinated", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const healthPlatforms = [
      { name: "Whole-Person Health", focus: "Clinical Screenings & Assessments", color: "E11D48" },
      { name: "Sankofa Health", focus: "Culturally Responsive Care", color: RED },
      { name: "Black Maternal Health", focus: "Perinatal & Maternal Mortality", color: "D946EF" },
      { name: "Sankofa Feminine Health", focus: "Women's Health Services", color: "A855F7" },
      { name: "Sankofa Men's Health", focus: "Men's Health & Wellness", color: "06B6D4" },
      { name: "SafeCogniCare", focus: "TBI & Cognitive Health", color: "0EA5E9" },
      { name: "PillScheduler", focus: "Medication Adherence", color: "84CC16" },
    ];
    healthPlatforms.forEach((p, i) => {
      const col = i < 4 ? i : i - 4;
      const row = i < 4 ? 0 : 1;
      const w = i < 4 ? 2.9 : 3.9;
      const x = i < 4 ? (0.5 + col * 3.15) : (0.5 + col * 4.15);
      const y = 1.8 + row * 2.2;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 1.8, fill: { color: "2A2025" }, rectRadius: 0.1, line: { color: p.color, width: 2 } });
      slide.addText(p.name, { x: x + 0.15, y: y + 0.2, w: w - 0.3, h: 0.5, fontSize: 13, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(p.focus, { x: x + 0.15, y: y + 0.8, w: w - 0.3, h: 0.6, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
    });

    slide.addText("Cross-platform data sharing: Patient flagged in one platform triggers relevant assessments in others through the agent network", {
      x: 0.8, y: 6.3, w: 11.5, h: 0.4, fontSize: 11, fontFace: "Arial", color: "AAAAAA", align: "center", italic: true
    });
    addFooter(slide, 17, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 18: REGIONAL HUBS
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "We operate three regional hubs forming an interconnected network. The Austin Hub focuses on housing crisis response — median home price $435,000, 3,238 individuals in the 2025 point-in-time count, 85% of renters cost-burdened. Partners include CommUnity Care, ECHO, Workforce Solutions, AISD, and Travis County. The Manor Hub addresses growth without gaps — 400% population growth since 2010, 38% youth population, critical infrastructure gaps. Partners include Manor ISD and Manor Economic Development. The Pflugerville Hub focuses on infrastructure before growth — 75,000+ population, 52% growth rate, significant digital access gap. Each hub activates specific ecosystem platforms based on local needs.",
  buildFn: (slide) => {
    slide.addText("REGIONAL HUBS", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Austin \u2022 Manor \u2022 Pflugerville", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const hubs = [
      { name: "Austin Hub", focus: "Housing Crisis Response", stats: ["$435K median home", "3,238 homeless PIT 2025", "85%+ cost-burdened"], color: BLUE },
      { name: "Manor Hub", focus: "Growth Without Gaps", stats: ["400%+ pop growth", "38% under 18", "Critical infrastructure gap"], color: GREEN },
      { name: "Pflugerville Hub", focus: "Infrastructure First", stats: ["75K+ population", "52% growth (2010-20)", "Digital access gap"], color: AMBER },
    ];
    hubs.forEach((h, i) => {
      const x = 0.5 + i * 4.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.6, w: 3.85, h: 4.8, fill: { color: WHITE }, rectRadius: 0.12, line: { color: h.color, width: 2 } });
      slide.addText(h.name, { x: x + 0.2, y: 1.8, w: 3.45, h: 0.5, fontSize: 18, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(h.focus, { x: x + 0.2, y: 2.3, w: 3.45, h: 0.35, fontSize: 13, fontFace: "Arial", color: h.color, bold: true });
      h.stats.forEach((s, j) => {
        slide.addText(`\u2022  ${s}`, { x: x + 0.2, y: 2.9 + j * 0.45, w: 3.45, h: 0.4, fontSize: 12, fontFace: "Arial", color: BODY_TEXT });
      });
    });
    addFooter(slide, 18, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 19: RPLICE & IMPLEMENTATION SCIENCE
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "RPLICE — Research, Planning, Learning and Implementation Center of Excellence — is our external research platform connected as the Better Science Lab and Research Quality Gate. It runs at salp-science--mrterryflood.replit.app. The AI Community Analysis engine uses Census tract-level data to reveal disparities that county-level averages hide. We analyze 252+ tracts per region across 12 preset areas exposing the Three Realities: what research says, what politics allow, and what works on the ground. The toolkit includes CFIR assessment scoring across all 5 domains, RE-AIM evaluation scorecards, fidelity checklists, and a Quality Gate Dashboard. The 9-section RPLICE report covers Three Realities, CFIR 2.0, RE-AIM, SALP, Risk/Protective Factor Matrix, Grant Alignment, and a 90-Day Roadmap.",
  buildFn: (slide) => {
    slide.addText("RPLICE — IMPLEMENTATION SCIENCE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Research Quality Gate & AI Community Analysis", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const tools = [
      { title: "CFIR Assessment", desc: "All 5 domains scored: Intervention, Inner Setting, Outer Setting, Individuals, Process" },
      { title: "RE-AIM Evaluation", desc: "Reach, Effectiveness, Adoption, Implementation, Maintenance scoring" },
      { title: "Three Realities", desc: "What research says, what politics allow, what works on the ground" },
      { title: "AI Community Analysis", desc: "252+ Census tracts per region, 12 preset areas, 49 research studies" },
    ];
    tools.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.3;
      const y = 1.8 + row * 2.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 1.7, fill: { color: "2A2025" }, rectRadius: 0.1, line: { color: "3A3035", width: 1 } });
      slide.addText(t.title, { x: x + 0.2, y: y + 0.1, w: 5.5, h: 0.45, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(t.desc, { x: x + 0.2, y: y + 0.6, w: 5.5, h: 0.8, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
    });

    slide.addText("9-Section RPLICE Report: Three Realities  |  CFIR 2.0  |  RE-AIM  |  SALP  |  Risk Matrix  |  Grant Alignment  |  90-Day Roadmap", {
      x: 0.5, y: 6.2, w: 12.1, h: 0.5, fontSize: 10, fontFace: "Arial", color: "AAAAAA", align: "center"
    });
    addFooter(slide, 19, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 20: GRANT ENGINE
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Our grant engine handles the full lifecycle: discovery, analysis, narrative generation, and package preparation. We have daily automated discovery across 7 sources and 15 keywords with SAM.gov API integration. AI-powered semantic analysis scores each grant for fit. The Grant Narrative Generator writes funder-specific narratives. The system produces ready-to-submit grant packages with logic models, budget templates, and evidence citations. Our priority grants right now: BB Collective Research at $50,000, Rare Impact Fund at $250,000 to $500,000, Austin FC Dream Starter at $100,000, St. David's Foundation at up to $1 million, SSG Fox VA at $750,000, and Centene Foundation with a May 31 deadline.",
  buildFn: (slide) => {
    slide.addText("GRANT ENGINE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Discovery \u2192 Analysis \u2192 Narrative \u2192 Package", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 22, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const grants = [
      { name: "BB Collective Research", amount: "$50K", deadline: "April 13" },
      { name: "Rare Impact Fund", amount: "$250K-$500K", deadline: "April 10" },
      { name: "Austin FC Dream Starter", amount: "$100K", deadline: "April 13" },
      { name: "St. David's Foundation", amount: "Up to $1M", deadline: "Rolling" },
      { name: "SSG Fox VA", amount: "$750K", deadline: "Open" },
      { name: "Centene Foundation", amount: "TBD", deadline: "May 31" },
    ];
    grants.forEach((g, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.5 + col * 4.15;
      const y = 1.6 + row * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.85, h: 1.3, fill: { color: WHITE }, rectRadius: 0.08, line: { color: "E0D8D0", width: 1 } });
      slide.addText(g.name, { x: x + 0.15, y: y + 0.05, w: 3.55, h: 0.45, fontSize: 13, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(g.amount, { x: x + 0.15, y: y + 0.5, w: 2.0, h: 0.35, fontSize: 14, fontFace: "Arial", color: MAROON, bold: true });
      slide.addText(`Deadline: ${g.deadline}`, { x: x + 2.0, y: y + 0.5, w: 1.7, h: 0.35, fontSize: 10, fontFace: "Arial", color: BODY_TEXT, align: "right" });
    });

    const capabilities = [
      "Daily automated discovery (7 sources, 15 keywords)",
      "SAM.gov API integration for federal grants",
      "AI semantic analysis and fit scoring",
      "Funder-specific narrative generation (8 profiles)",
      "Logic model and evidence package assembly",
      "Team-of-Teams platform assignment per grant",
    ];
    slide.addText("SYSTEM CAPABILITIES", { x: 0.8, y: 5.0, w: 11, h: 0.35, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 2 });
    capabilities.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      slide.addText(`\u2713  ${c}`, { x: 0.5 + col * 6.3, y: 5.4 + row * 0.45, w: 6.0, h: 0.4, fontSize: 11, fontFace: "Arial", color: DARK_TEXT });
    });
    addFooter(slide, 20, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 21: ECOSYSTEM OPERATIONS
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "The ecosystem operations layer keeps everything coordinated without bottlenecking autonomy. The Ecosystem Cross-Evaluation runs weekly and on-demand MAP-GAP peer review generating executive summaries and ranked scores. The Self-Audit runs every 6 hours catching blind spots. The Bilateral Collaboration Exchange happens 3 times daily — automated exchange of intelligence, changes, lessons, and questions. The Confidence Drift and Autonomy Quadrants track earned trust to assess autonomy levels. The Captain Load Absorption Protocol lets captains temporarily absorb critical deliverables from down partners. And the Multi-Ecosystem Firewall enables platforms to connect to multiple ecosystems with strict data isolation.",
  buildFn: (slide) => {
    slide.addText("ECOSYSTEM OPERATIONS", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Coordinated Autonomy at Scale", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const ops = [
      { title: "Weekly Cross-Evaluation", desc: "MAP-GAP peer review, executive summaries, ranked scores", freq: "Weekly + On-Demand" },
      { title: "Self-Audit System", desc: "Catches blind spots in subsystem monitoring, logs critical events", freq: "Every 6 Hours" },
      { title: "Bilateral Exchange", desc: "Intelligence, changes, lessons, questions across all platforms", freq: "3x Daily" },
      { title: "Confidence Drift", desc: "Tracks earned trust and thinking scores for autonomy levels", freq: "Continuous" },
      { title: "Captain Load Absorption", desc: "Captains absorb critical deliverables from down partners", freq: "On Trigger" },
      { title: "Multi-Ecosystem Firewall", desc: "Platforms connect to multiple ecosystems with data isolation", freq: "Always On" },
    ];
    ops.forEach((o, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.3;
      const y = 1.8 + row * 1.6;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 1.3, fill: { color: "2A2025" }, rectRadius: 0.1, line: { color: "3A3035", width: 1 } });
      slide.addText(o.title, { x: x + 0.2, y: y + 0.05, w: 4.0, h: 0.4, fontSize: 14, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(o.freq, { x: x + 4.0, y: y + 0.05, w: 1.7, h: 0.4, fontSize: 9, fontFace: "Arial", color: AMBER, align: "right" });
      slide.addText(o.desc, { x: x + 0.2, y: y + 0.5, w: 5.5, h: 0.6, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
    });

    slide.addText("Also: UOSD (Unified Operating System Directive)  |  CEA (Cognitive Elevation Addendum)  |  Fidelity Report Cards  |  Directive Compliance Center", {
      x: 0.5, y: 6.5, w: 12.1, h: 0.3, fontSize: 10, fontFace: "Arial", color: "AAAAAA", align: "center"
    });
    addFooter(slide, 21, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 22: COMMUNITY INTELLIGENCE
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Our community intelligence layer includes GIS-enabled resource mapping using Leaflet with OpenStreetMap tiles, covering all 50 states plus DC and territories. The Community Intelligence Map shows local support services, the Impact Dashboard visualizes outcomes across social determinants, and the Transparency Dashboard provides public-facing metrics. The Smart Intake Wizard captures comprehensive profiles including SDOH factors, justice history, and housing status. The Community Partner Network manages referrals across organizations. Data sources include CDC PLACES API, CDC ATSDR SVI, FBI Crime Data API, Census Bureau ACS, USDA Food Access Atlas, HUD, SAMHSA, and BLS. Everything is tract-level, not county-level.",
  buildFn: (slide) => {
    slide.addText("COMMUNITY INTELLIGENCE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("GIS-Powered, Tract-Level, Real Data", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const features = [
      { title: "Interactive Maps", desc: "Leaflet + OpenStreetMap tiles, 55 U.S. jurisdictions", color: BLUE },
      { title: "Resource Finder", desc: "Healthcare, food, housing, education, employment services", color: GREEN },
      { title: "Impact Dashboard", desc: "Outcomes across all social determinants of health", color: VIOLET },
      { title: "Smart Intake Wizard", desc: "SDOH, justice history, housing status capture", color: AMBER },
    ];
    features.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.3;
      const y = 1.6 + row * 1.8;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 1.5, fill: { color: WHITE }, rectRadius: 0.1, line: { color: f.color, width: 2 } });
      slide.addText(f.title, { x: x + 0.2, y: y + 0.1, w: 5.5, h: 0.45, fontSize: 15, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(f.desc, { x: x + 0.2, y: y + 0.6, w: 5.5, h: 0.6, fontSize: 12, fontFace: "Arial", color: BODY_TEXT });
    });

    slide.addText("DATA SOURCES", { x: 0.8, y: 5.5, w: 11, h: 0.35, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 2 });
    const sources = ["CDC PLACES API", "CDC/ATSDR SVI", "FBI Crime Data", "Census ACS", "USDA Food Atlas", "HUD", "SAMHSA", "BLS"];
    sources.forEach((s, i) => {
      slide.addText(`\u2022 ${s}`, { x: 0.5 + (i % 4) * 3.15, y: 5.9 + Math.floor(i / 4) * 0.4, w: 3.0, h: 0.35, fontSize: 11, fontFace: "Arial", color: DARK_TEXT });
    });
    addFooter(slide, 22, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 23: PROGRAM ENGINE & MANAGEMENT
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "The Program Execution Engine is our full operational program management system. It has a 6-step setup wizard, three methodology paths — Implementation Science, Traditional Project Management, and Hybrid — a real-time Execution Dashboard, and grant alignment tracking. The MCE Contract Management Center handles full contract lifecycle management for our minority business enterprise platform. The Dosage Engine tracks the amount of service delivery to individuals. The Early Warning System provides predictive analytics for at-risk students or program gaps. Post-award grant execution tools, KPI dashboards, and a Facilitator Hub round out the suite.",
  buildFn: (slide) => {
    slide.addText("PROGRAM ENGINE & MANAGEMENT", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Full Operational Program Lifecycle", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const items = [
      { title: "6-Step Setup Wizard", desc: "Guided program creation with methodology selection" },
      { title: "3 Methodology Paths", desc: "Implementation Science, Traditional PM, Hybrid" },
      { title: "Execution Dashboard", desc: "Real-time monitoring with grant alignment" },
      { title: "MCE Contract Center", desc: "Full contract lifecycle management" },
      { title: "Dosage Engine", desc: "Tracks service delivery amounts per individual" },
      { title: "Early Warning System", desc: "Predictive analytics for at-risk populations" },
    ];
    items.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.5 + col * 4.15;
      const y = 1.8 + row * 2.2;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.85, h: 1.8, fill: { color: "2A2025" }, rectRadius: 0.1, line: { color: "3A3035", width: 1 } });
      slide.addText(item.title, { x: x + 0.2, y: y + 0.15, w: 3.45, h: 0.45, fontSize: 15, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(item.desc, { x: x + 0.2, y: y + 0.7, w: 3.45, h: 0.8, fontSize: 12, fontFace: "Arial", color: "D0D0D0" });
    });
    addFooter(slide, 23, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 24: ACCESSIBILITY & COMPLIANCE
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Accessibility is not an afterthought — it's built into every component. WCAG 2.1 AA compliance with 2,415+ test identifiers and 95+ accessibility labels. Adaptive learning features include dyslexia-friendly fonts, large text mode, high contrast, and reduced motion support. We support English and Spanish. Mobile responsive design works on all devices. COPPA compliant with parental consent and age-appropriate content. FERPA aligned with student data protection. OIDC authentication with magic link, Google, and GitHub login. All API routes have rate limiting, error handling, and input validation.",
  buildFn: (slide) => {
    slide.addText("ACCESSIBILITY & COMPLIANCE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Built for Everyone. Enterprise Standards.", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const cols = [
      { title: "WCAG 2.1 AA", items: ["2,415+ test identifiers", "95+ accessibility labels", "Skip-to-content navigation", "Focus-visible indicators"], color: BLUE },
      { title: "Adaptive Learning", items: ["Dyslexia-friendly fonts", "Large text mode", "High contrast mode", "Reduced motion support"], color: VIOLET },
      { title: "Inclusive Design", items: ["English & Spanish", "Low-bandwidth mode", "Mobile responsive", "Screen reader optimized"], color: GREEN },
      { title: "Security", items: ["COPPA compliant", "FERPA aligned", "OIDC authentication", "Rate limited APIs"], color: RED },
    ];
    cols.forEach((col, i) => {
      const x = 0.5 + i * 3.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.6, w: 2.9, h: 4.5, fill: { color: WHITE }, rectRadius: 0.12, line: { color: col.color, width: 2 } });
      slide.addText(col.title, { x: x + 0.15, y: 1.8, w: 2.6, h: 0.5, fontSize: 15, fontFace: "Arial", color: DARK_TEXT, bold: true });
      col.items.forEach((item, j) => {
        slide.addText(`\u2713  ${item}`, { x: x + 0.15, y: 2.5 + j * 0.55, w: 2.6, h: 0.45, fontSize: 12, fontFace: "Arial", color: BODY_TEXT });
      });
    });
    addFooter(slide, 24, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 25: TECHNICAL ARCHITECTURE
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "The platform runs on a production-ready stack. Over 70 pages, 124+ API routes with 100% error handling, 60+ code-split components. The frontend uses React with Vite for fast builds, TanStack Query for data management, Tailwind CSS with shadcn/ui components, and wouter for routing. The backend runs Node.js with Express, PostgreSQL via Drizzle ORM, and our 5-provider AI engine. The database uses Neon-backed PostgreSQL. We have live GIS integration with interactive Leaflet maps. The entire stack is deployed on Replit with automatic scaling.",
  buildFn: (slide) => {
    slide.addText("TECHNICAL ARCHITECTURE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Production-Ready. Battle-Tested.", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const stats = [
      { value: "70+", label: "Pages" },
      { value: "124+", label: "API Routes" },
      { value: "100%", label: "Error Handling" },
      { value: "60+", label: "Components" },
      { value: "24", label: "Platforms" },
      { value: "5", label: "AI Providers" },
    ];
    stats.forEach((s, i) => {
      const x = 0.3 + i * 2.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.8, w: 1.95, h: 1.5, fill: { color: "2A2025" }, rectRadius: 0.1, line: { color: "3A3035", width: 1 } });
      slide.addText(s.value, { x, y: 1.9, w: 1.95, h: 0.9, fontSize: 30, fontFace: "Arial", color: MAROON, bold: true, align: "center" });
      slide.addText(s.label, { x, y: 2.7, w: 1.95, h: 0.4, fontSize: 11, fontFace: "Arial", color: "AAAAAA", align: "center" });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 0.5, y: 3.7, w: 5.8, h: 2.5, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: "3A3035", width: 1 } });
    slide.addText("Frontend Stack", { x: 0.8, y: 3.8, w: 5.2, h: 0.5, fontSize: 16, fontFace: "Arial", color: WHITE, bold: true });
    const frontend = ["React + Vite (fast builds)", "TanStack Query (data)", "Tailwind CSS + shadcn/ui", "wouter routing", "Leaflet + OpenStreetMap"];
    frontend.forEach((f, i) => {
      slide.addText(`\u2022  ${f}`, { x: 0.8, y: 4.4 + i * 0.35, w: 5.2, h: 0.3, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
    });

    slide.addShape(pptx.ShapeType.roundRect, { x: 6.6, y: 3.7, w: 5.8, h: 2.5, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: "3A3035", width: 1 } });
    slide.addText("Backend Stack", { x: 6.9, y: 3.8, w: 5.2, h: 0.5, fontSize: 16, fontFace: "Arial", color: WHITE, bold: true });
    const backend = ["Node.js + Express", "PostgreSQL (Neon)", "Drizzle ORM", "5-Provider AI Engine", "Resend Email Integration"];
    backend.forEach((b, i) => {
      slide.addText(`\u2022  ${b}`, { x: 6.9, y: 4.4 + i * 0.35, w: 5.2, h: 0.3, fontSize: 11, fontFace: "Arial", color: "D0D0D0" });
    });
    addFooter(slide, 25, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 26: WHAT FUNDERS & COLLABORATORS GET
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "This slide speaks to both funders and collaborators — because organizations like Measure Austin, United Way, and local coalitions need to see what they gain from partnering with us, not just what a funder gets for their money. For funders: measurable outcomes with locked Census baselines, real-time gap tracking, and automated reporting. For collaborators: shared data infrastructure — tract-level community data, GIS mapping, and 8 federal data sources already integrated and actionable. Both get coordinated intervention through 24 autonomous platforms with documented reasoning on every exchange. And both get ready-made deliverables — funders get grant narratives and logic models, collaborators get community data packages, shared dashboards, and API access to co-build on our infrastructure. The value proposition is different but equally strong: funders see accountability, collaborators see infrastructure they don't have to build themselves.",
  buildFn: (slide) => {
    slide.addText("WHAT FUNDERS & COLLABORATORS GET", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Why Partner With Us — Whether You Fund or Build", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const items = [
      { title: "For Funders: Measurable ROI", items: ["Locked Census baselines with targets", "Real-time gap tracking dashboards", "Automated outcome reporting", "Grant-specific narratives & logic models"], color: GREEN },
      { title: "For Collaborators: Shared Infrastructure", items: ["Tract-level community data access", "8 federal data sources integrated", "GIS mapping & visualization tools", "API access to co-build solutions"], color: VIOLET },
      { title: "For Both: Coordinated Impact", items: ["24 autonomous platforms — not siloed tools", "Risk-to-platform routing", "Documented reasoning on every exchange", "CFIR & RE-AIM validated frameworks"], color: BLUE },
      { title: "For Both: Ready-Made Deliverables", items: ["Community data packages", "Impact dashboards & CSV export", "Evidence packages & budget templates", "90-day action plans with accountability"], color: AMBER },
    ];
    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.3;
      const y = 1.6 + row * 2.8;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.5, fill: { color: WHITE }, rectRadius: 0.12, line: { color: item.color, width: 2 } });
      slide.addText(item.title, { x: x + 0.2, y: y + 0.1, w: 5.5, h: 0.45, fontSize: 16, fontFace: "Arial", color: DARK_TEXT, bold: true });
      item.items.forEach((it, j) => {
        slide.addText(`\u2713  ${it}`, { x: x + 0.25, y: y + 0.6 + j * 0.4, w: 5.4, h: 0.35, fontSize: 12, fontFace: "Arial", color: BODY_TEXT });
      });
    });
    addFooter(slide, 26, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 27: WHO WE SERVE
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "We serve five distinct populations. Students of all ages get AI mastery curriculum, career exploration, mentorship, and financial literacy. Justice-involved individuals get reentry case management with 5-phase progression, Thrive Scores, and court-ready reports. Veterans get military-to-civilian transition through Mission Transition, VA service connection, and cognitive health through SafeCogniCare. Schools and districts get our LMS, classroom management, progress tracking, and STAAR preparation. And funders and community partners get grant-aligned metrics, impact dashboards, data export, and API integration. Each audience gets specific value from the ecosystem, and the autonomous agent network ensures coordinated service delivery across all populations.",
  buildFn: (slide) => {
    slide.addText("WHO WE SERVE", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Five Populations. One Ecosystem.", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const groups = [
      { title: "Students (All Ages)", items: ["AI mastery curriculum", "Career exploration", "Mentorship", "Financial literacy"], color: VIOLET },
      { title: "Justice-Involved", items: ["5-phase reentry", "Thrive Scores", "Court-ready reports", "Service tracking"], color: RED },
      { title: "Veterans", items: ["Military-civilian transition", "VA service connection", "Cognitive health (TBI)", "Benefits navigation"], color: "64748B" },
      { title: "Schools & Districts", items: ["LMS & classrooms", "Progress tracking", "STAAR test prep", "Parent dashboards"], color: BLUE },
      { title: "Funders & Partners", items: ["Grant-aligned metrics", "Impact dashboards", "Data export (CSV)", "API integration"], color: GREEN },
    ];
    groups.forEach((g, i) => {
      const x = 0.3 + i * 2.55;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.8, w: 2.3, h: 4.5, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: g.color, width: 2 } });
      slide.addText(g.title, { x: x + 0.1, y: 2.0, w: 2.1, h: 0.5, fontSize: 13, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
      g.items.forEach((item, j) => {
        slide.addText(`\u2022  ${item}`, { x: x + 0.1, y: 2.7 + j * 0.55, w: 2.1, h: 0.45, fontSize: 10, fontFace: "Arial", color: "D0D0D0" });
      });
    });
    addFooter(slide, 27, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 28: COMPETITIVE ADVANTAGE
// ============================================================
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Four things differentiate us from every other workforce development platform. First: autonomous agents, not siloed tools. Our 24 platforms coordinate through reasoning-required communication — they don't just exist side by side, they actively collaborate. Second: earn through mastery. AI tools are unlocked by completing curriculum modules, not purchased. Students prove readiness before accessing professional tools. Third: tract-level truth. We expose what county averages hide — poverty, unemployment, and educational attainment at the Census tract level, not the county level. And fourth: implementation science. Everything is validated through CFIR and RE-AIM frameworks. This isn't just a platform — it's a scientifically validated intervention system.",
  buildFn: (slide) => {
    slide.addText("WHY WE'RE DIFFERENT", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 3 });
    slide.addText("Competitive Advantage", { x: 0.8, y: 0.7, w: 11, h: 0.6, fontSize: 24, fontFace: "Arial", color: DARK_TEXT, bold: true });

    const diffs = [
      { title: "Autonomous Agents, Not Siloed Tools", desc: "24 platforms coordinate through reasoning-required communication. Domain alignment validated on every exchange. Targeted, not broadcast.", color: VIOLET },
      { title: "Earn Through Mastery", desc: "AI tools unlocked by completing curriculum modules — not purchased. Students prove responsible AI use before accessing professional tools.", color: GREEN },
      { title: "Tract-Level Truth", desc: "County averages hide reality. We expose poverty, unemployment, and education at Census tract level — 252+ tracts analyzed per region.", color: BLUE },
      { title: "Implementation Science", desc: "CFIR and RE-AIM frameworks validate every intervention. Not just a platform — a scientifically validated system with 49 peer-reviewed studies.", color: AMBER },
    ];
    diffs.forEach((d, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.3;
      const y = 1.6 + row * 2.6;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 2.3, fill: { color: WHITE }, rectRadius: 0.12, line: { color: d.color, width: 2 } });
      slide.addText(d.title, { x: x + 0.2, y: y + 0.15, w: 5.5, h: 0.5, fontSize: 16, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(d.desc, { x: x + 0.2, y: y + 0.7, w: 5.5, h: 1.3, fontSize: 12, fontFace: "Arial", color: BODY_TEXT });
    });
    addFooter(slide, 28, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 29: DEPLOYMENT STRATEGY
// ============================================================
addSlide({
  bg: DARK_BG,
  speakerNotes: "Our phased rollout starts with foundation in months 1-3: platform deployment, initial school partnerships, core curriculum launch, and reentry program pilot. Phase 2, Growth, runs months 4-6: mentor network expansion, career pipeline activation, student onboarding at scale, and justice partner integration. Phase 3, Scale, runs months 7-12: multi-district rollout, employer partnerships, national hub expansion, and full agent network activation. The live platform is already running at thrivingcommunitiesforall.com with production data. We're not asking funders to invest in a concept — we're asking them to scale what's already working.",
  buildFn: (slide) => {
    slide.addText("DEPLOYMENT STRATEGY", { x: 0.8, y: 0.3, w: 11, h: 0.4, fontSize: 11, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 3 });
    slide.addText("Phased Implementation", { x: 0.8, y: 0.8, w: 11, h: 0.7, fontSize: 26, fontFace: "Arial", color: WHITE, bold: true });

    const phases = [
      { phase: "1", title: "Foundation", items: ["Platform deployment", "School partnerships", "Core curriculum launch", "Reentry program pilot"], timeline: "Months 1-3", color: GREEN },
      { phase: "2", title: "Growth", items: ["Mentor network expansion", "Career pipeline activation", "Student onboarding at scale", "Justice partner integration"], timeline: "Months 4-6", color: BLUE },
      { phase: "3", title: "Scale", items: ["Multi-district rollout", "Employer partnerships", "National hub expansion", "Full agent network activation"], timeline: "Months 7-12", color: VIOLET },
    ];
    phases.forEach((p, i) => {
      const x = 0.5 + i * 4.15;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 1.8, w: 3.85, h: 4.8, fill: { color: "2A2025" }, rectRadius: 0.12, line: { color: p.color, width: 2 } });
      slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.2, y: 2.1, w: 0.5, h: 0.5, fill: { color: p.color } });
      slide.addText(p.phase, { x: x + 0.2, y: 2.1, w: 0.5, h: 0.5, fontSize: 16, fontFace: "Arial", color: WHITE, bold: true, align: "center", valign: "middle" });
      slide.addText(p.title, { x: x + 0.85, y: 2.1, w: 2.7, h: 0.5, fontSize: 18, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(p.timeline, { x: x + 0.85, y: 2.55, w: 2.7, h: 0.35, fontSize: 11, fontFace: "Arial", color: p.color });
      p.items.forEach((item, j) => {
        slide.addText(`\u2192  ${item}`, { x: x + 0.2, y: 3.2 + j * 0.6, w: 3.45, h: 0.5, fontSize: 13, fontFace: "Arial", color: "DDDDDD" });
      });
    });
    addFooter(slide, 29, TOTAL_SLIDES);
  },
});

// ============================================================
// SLIDE 30: CLOSING / CTA
// ============================================================
addSlide({
  bg: { color: MAROON },
  speakerNotes: "The people who learn to think with AI today will lead tomorrow. This is not a concept. This is a live, production-running, data-validated ecosystem with 24 autonomous platforms, implementation science validation, criminal justice intelligence, health equity coordination, and workforce development pipelines — all connected through an AI-powered agent network with reasoning-required communication. We invite you to explore the live platform at thrivingcommunitiesforall.com, review our impact data, and connect with us about partnership or funding. Contact Dr. Terry Flood at mr.terryflood@gmail.com. Payments can be made via Cash App at $MRTDFLOOD or PayPal at paypal.me/TERRYFLOODCEO. Thank you for your time.",
  buildFn: (slide) => {
    slide.addText("Ready to Transform Futures?", { x: 0.8, y: 1.0, w: 11.5, h: 1.2, fontSize: 42, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
    slide.addText("The people who learn to think with AI today will lead tomorrow.", { x: 1.5, y: 2.5, w: 10.0, h: 0.7, fontSize: 18, fontFace: "Arial", color: "DDDDDD", align: "center", italic: true });
    slide.addShape(pptx.ShapeType.rect, { x: 4.5, y: 3.5, w: 4.0, h: 0.04, fill: { color: "999999" } });

    slide.addText("Dr. Terry Flood  |  President", { x: 0.8, y: 4.0, w: 11.5, h: 0.5, fontSize: 16, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
    slide.addText("mr.terryflood@gmail.com", { x: 0.8, y: 4.5, w: 11.5, h: 0.4, fontSize: 14, fontFace: "Arial", color: "E8E8E8", align: "center" });
    slide.addText("Cash App: $MRTDFLOOD  |  PayPal: paypal.me/TERRYFLOODCEO", { x: 0.8, y: 5.0, w: 11.5, h: 0.4, fontSize: 13, fontFace: "Arial", color: "CCCCCC", align: "center" });

    slide.addShape(pptx.ShapeType.roundRect, { x: 3.0, y: 5.8, w: 3.5, h: 0.7, fill: { color: WHITE }, rectRadius: 0.1 });
    slide.addText("thrivingcommunitiesforall.com", { x: 3.0, y: 5.8, w: 3.5, h: 0.7, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, align: "center", valign: "middle" });

    slide.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 5.8, w: 3.5, h: 0.7, fill: { color: "3A3035" }, rectRadius: 0.1, line: { color: "999999", width: 1 } });
    slide.addText("View Impact Dashboard", { x: 7.0, y: 5.8, w: 3.5, h: 0.7, fontSize: 12, fontFace: "Arial", color: WHITE, bold: true, align: "center", valign: "middle" });

    slide.addText("The Collaborative Advocate Foundation  |  501(c)(3)  |  EIN 41-3618503  |  Veteran-Founded  |  Black-Led", {
      x: 0.8, y: 6.6, w: 11.5, h: 0.4, fontSize: 10, fontFace: "Arial", color: "999999", align: "center"
    });
    addFooter(slide, 30, TOTAL_SLIDES);
  },
});

pptx.writeFile({ fileName: "ThriveUp_ACOS_Complete_Briefing.pptx" })
  .then(() => console.log("PowerPoint saved: ThriveUp_ACOS_Complete_Briefing.pptx"))
  .catch((err) => console.error("Error:", err));
