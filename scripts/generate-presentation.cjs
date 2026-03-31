const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Dr. Terry Flood";
pres.company = "The Collaborative Advocate Foundation";
pres.subject = "TCAF Community Presentation";
pres.title = "Building Pflugerville's Future — A 24-Platform Ecosystem";

const COLORS = {
  navy: "1B2A4A",
  gold: "D4A843",
  white: "FFFFFF",
  lightGray: "F0F2F5",
  darkGray: "2D3748",
  accent: "3B82F6",
  green: "10B981",
  red: "EF4444",
  teal: "0D9488",
  indigo: "6366F1",
  orange: "F59E0B",
  rose: "F43F5E",
};

function addFooter(slide, slideNum, total) {
  slide.addText("The Collaborative Advocate Foundation | thrivingcommunitiesforall.com", {
    x: 0.5, y: 7.0, w: 10, h: 0.35,
    fontSize: 9, color: "888888", fontFace: "Arial",
  });
  slide.addText(`${slideNum} / ${total}`, {
    x: 11.5, y: 7.0, w: 1.5, h: 0.35,
    fontSize: 9, color: "888888", fontFace: "Arial", align: "right",
  });
}

const TOTAL_SLIDES = 14;

// ============================================================
// SLIDE 1 — TITLE
// ============================================================
let slide = pres.addSlide();
slide.background = { color: COLORS.navy };
slide.addText("BUILDING PFLUGERVILLE'S FUTURE", {
  x: 1, y: 1.5, w: 11, h: 1.2,
  fontSize: 40, fontFace: "Arial", color: COLORS.gold, bold: true, align: "center",
});
slide.addText("A 24-Platform AI-Powered Ecosystem for\nWorkforce Development, Health Equity & Community Enablement", {
  x: 1, y: 2.8, w: 11, h: 1.2,
  fontSize: 20, fontFace: "Arial", color: COLORS.white, align: "center", lineSpacingMultiple: 1.3,
});
slide.addShape(pres.ShapeType.line, {
  x: 4, y: 4.2, w: 5, h: 0, line: { color: COLORS.gold, width: 2 },
});
slide.addText("Dr. Terry Flood\nFounder & CEO | U.S. Army Veteran", {
  x: 1, y: 4.5, w: 11, h: 0.9,
  fontSize: 18, fontFace: "Arial", color: COLORS.white, align: "center", lineSpacingMultiple: 1.3,
});
slide.addText("The Collaborative Advocate Foundation\n501(c)(3) | EIN 41-3618003", {
  x: 1, y: 5.5, w: 11, h: 0.7,
  fontSize: 14, fontFace: "Arial", color: "AABBCC", align: "center", lineSpacingMultiple: 1.3,
});
slide.addText("Pflugerville, Texas", {
  x: 1, y: 6.3, w: 11, h: 0.5,
  fontSize: 16, fontFace: "Arial", color: COLORS.gold, align: "center", italic: true,
});

// ============================================================
// SLIDE 2 — WHO WE ARE
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 2, TOTAL_SLIDES);
slide.addText("WHO WE ARE", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

const whoWeArePoints = [
  { icon: "\u2605", text: "Veteran-Founded, Black-Led 501(c)(3) nonprofit headquartered in Pflugerville, TX" },
  { icon: "\u2605", text: "Built on 7 Academic Disciplines: Implementation Science, Criminal Justice, HR Management, I-O Psychology, Education, Social Science, Healthcare & Public Health" },
  { icon: "\u2605", text: 'Core Belief: "Education is the #1 protective factor against every negative outcome \u2014 poverty, crime, poor health, unemployment"' },
  { icon: "\u2605", text: "3 Business Entities supporting the mission: TCAF (nonprofit), CIP LLC (consulting), M&T Consulting (advisory)" },
];

whoWeArePoints.forEach((pt, i) => {
  slide.addText([
    { text: pt.icon + "  ", options: { color: COLORS.gold, fontSize: 16, bold: true } },
    { text: pt.text, options: { color: COLORS.darkGray, fontSize: 15 } },
  ], {
    x: 0.8, y: 1.4 + i * 1.2, w: 11.5, h: 1.0,
    fontFace: "Arial", valign: "top", lineSpacingMultiple: 1.2,
  });
});

slide.addShape(pres.ShapeType.roundRect, {
  x: 1, y: 6.0, w: 11, h: 0.7,
  fill: { color: COLORS.navy }, rectRadius: 0.1,
});
slide.addText("17912 Stefano Drive, Pflugerville, TX 78660  |  mr.terryflood@gmail.com  |  thrivingcommunitiesforall.com", {
  x: 1, y: 6.0, w: 11, h: 0.7,
  fontSize: 12, fontFace: "Arial", color: COLORS.white, align: "center",
});

// ============================================================
// SLIDE 3 — THE PROBLEM
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.navy };
addFooter(slide, 3, TOTAL_SLIDES);
slide.addText("THE PROBLEM WE SOLVE", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.gold, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

slide.addText("Underserved communities face fragmented support \u2014 workforce in one place,\nhealth in another, education somewhere else, justice-involved individuals\nfalling through every crack.", {
  x: 0.8, y: 1.3, w: 11.5, h: 1.0,
  fontSize: 16, fontFace: "Arial", color: COLORS.white, italic: true, lineSpacingMultiple: 1.3,
});

const stats = [
  { number: "< 60%", label: "2-parent households", detail: "= poverty exceeds 17%\nEVERY SINGLE CASE", color: COLORS.red },
  { number: "10.2%", label: "Austin MSA youth\nunemployment (16-24)", detail: "vs 7.8% statewide", color: COLORS.orange },
  { number: "~18,000", label: "Out-of-school youth\nin Travis County", detail: "Ages 16-24 facing\nbarriers to employment", color: COLORS.accent },
  { number: "21.4%", label: "Texas reincarceration\nrate within 3 years", detail: "Crime migrates with\ngentrification", color: COLORS.rose },
];

stats.forEach((st, i) => {
  const xPos = 0.5 + i * 3.1;
  slide.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: 2.7, w: 2.8, h: 3.5,
    fill: { color: "243555" }, rectRadius: 0.15,
    line: { color: st.color, width: 2 },
  });
  slide.addText(st.number, {
    x: xPos, y: 2.9, w: 2.8, h: 0.8,
    fontSize: 28, fontFace: "Arial", color: st.color, bold: true, align: "center",
  });
  slide.addText(st.label, {
    x: xPos + 0.1, y: 3.7, w: 2.6, h: 0.8,
    fontSize: 12, fontFace: "Arial", color: COLORS.white, align: "center", lineSpacingMultiple: 1.2,
  });
  slide.addShape(pres.ShapeType.line, {
    x: xPos + 0.5, y: 4.6, w: 1.8, h: 0, line: { color: "3A4A6A", width: 1 },
  });
  slide.addText(st.detail, {
    x: xPos + 0.1, y: 4.8, w: 2.6, h: 0.9,
    fontSize: 11, fontFace: "Arial", color: "AABBCC", align: "center", lineSpacingMultiple: 1.2,
  });
});

slide.addText('"County averages lie \u2014 tract-level tells the truth."  \u2014 Dr. Terry Flood', {
  x: 1, y: 6.5, w: 11, h: 0.4,
  fontSize: 13, fontFace: "Arial", color: COLORS.gold, italic: true, align: "center",
});

// ============================================================
// SLIDE 4 — THE 24-PLATFORM ECOSYSTEM (Overview)
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 4, TOTAL_SLIDES);
slide.addText("THE 24-PLATFORM ECOSYSTEM", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});
slide.addText("Not concepts. Not proposals. 24 live, working platforms you can visit today.", {
  x: 0.8, y: 1.1, w: 11, h: 0.5,
  fontSize: 16, fontFace: "Arial", color: COLORS.darkGray, italic: true,
});

const domains = [
  { name: "WORKFORCE & EDUCATION", color: COLORS.accent, platforms: "ThriveUp Academy \u2022 Career Explorer \u2022 Credential Tracker \u2022 WholeMind Learning", impact: "50+ career pathways with stackable credentials" },
  { name: "HEALTH & WELLNESS", color: COLORS.green, platforms: "Sankofa Health \u2022 PillScheduler \u2022 AutoImmune Thrive \u2022 Speech Bridge \u2022 Black Maternal Health \u2022 Black Men's Health \u2022 Holistic Feminine Health", impact: "Culturally responsive screening, medication adherence, chronic disease support" },
  { name: "YOUTH & FAMILY", color: COLORS.indigo, platforms: "Three Realities \u2022 ISSS \u2022 Perfectly Different \u2022 SafeReport \u2022 SafeCogniCare", impact: "Youth voice, integrated supports, neurodiversity, safety reporting" },
  { name: "VETERANS & JUSTICE", color: COLORS.teal, platforms: "Mission Transition (M2C) \u2022 Justice Command Center \u2022 LifeBridge", impact: "Military transition, tract-level crime analysis, reentry pathways" },
  { name: "BUSINESS & TECHNOLOGY", color: COLORS.orange, platforms: "MCE \u2022 Pinnacle Business \u2022 Ad Targeting \u2022 Code Canvas \u2022 Video Creator AI \u2022 Ecosystem Nexus", impact: "Minority business incubation, procurement readiness, platform analytics" },
];

domains.forEach((d, i) => {
  const yPos = 1.8 + i * 1.0;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: yPos, w: 2.5, h: 0.85,
    fill: { color: d.color }, rectRadius: 0.1,
  });
  slide.addText(d.name, {
    x: 0.5, y: yPos, w: 2.5, h: 0.85,
    fontSize: 10, fontFace: "Arial", color: COLORS.white, bold: true, align: "center", valign: "middle",
  });
  slide.addText(d.platforms, {
    x: 3.2, y: yPos, w: 5.5, h: 0.85,
    fontSize: 10, fontFace: "Arial", color: COLORS.darkGray, valign: "middle",
  });
  slide.addText(d.impact, {
    x: 8.8, y: yPos, w: 4, h: 0.85,
    fontSize: 10, fontFace: "Arial", color: "666666", italic: true, valign: "middle",
  });
});

slide.addShape(pres.ShapeType.roundRect, {
  x: 2, y: 6.6, w: 9, h: 0.45,
  fill: { color: COLORS.navy }, rectRadius: 0.1,
});
slide.addText("thrivingcommunitiesforall.com  \u2014  All 24 platforms live and operational", {
  x: 2, y: 6.6, w: 9, h: 0.45,
  fontSize: 13, fontFace: "Arial", color: COLORS.gold, align: "center", bold: true,
});

// ============================================================
// SLIDE 5 — WORKFORCE & EDUCATION DEEP DIVE
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 5, TOTAL_SLIDES);
slide.addText("WORKFORCE & EDUCATION", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.accent, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.accent, width: 3 },
});

const wfItems = [
  { title: "50+ Career Pathways", desc: "Stackable credentials from entry-level to advanced certifications \u2014 CNA, CompTIA, CDL, welding, CHW, and more" },
  { title: "CHW Training Pipeline", desc: "Community Health Workers trained and deployed in underserved neighborhoods \u2014 expanding healthcare access where it's needed most" },
  { title: "Youth Workforce (Ages 16-24)", desc: "Targeting ~18,000 out-of-school youth in Travis County. Career exploration, paid work experience, employer-matched internships" },
  { title: "Real-Time Performance Tracking", desc: "WIOA-aligned: employment rate, median earnings, credential attainment, measurable skill gains \u2014 all tracked automatically" },
  { title: "Employer Partnership Portal", desc: "Direct pipeline to Austin growth sectors: Healthcare (+12%), IT (+15%), Construction (+9%), Advanced Manufacturing" },
];

wfItems.forEach((item, i) => {
  const yPos = 1.3 + i * 1.1;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: yPos, w: 0.4, h: 0.9,
    fill: { color: COLORS.accent }, rectRadius: 0.05,
  });
  slide.addText(item.title, {
    x: 1.1, y: yPos, w: 5, h: 0.4,
    fontSize: 15, fontFace: "Arial", color: COLORS.navy, bold: true,
  });
  slide.addText(item.desc, {
    x: 1.1, y: yPos + 0.35, w: 11, h: 0.5,
    fontSize: 12, fontFace: "Arial", color: "555555", lineSpacingMultiple: 1.2,
  });
});

// ============================================================
// SLIDE 6 — HEALTH EQUITY
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 6, TOTAL_SLIDES);
slide.addText("HEALTH EQUITY & COMMUNITY WELLNESS", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.green, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.green, width: 3 },
});

const healthPlatforms = [
  { name: "Sankofa Health Network", desc: "Culturally responsive health screening rooted in African diaspora wellness traditions" },
  { name: "PillScheduler", desc: "Medication adherence tracking \u2014 ensuring patients take the right medication at the right time" },
  { name: "WholeMind Learning", desc: "K-12 mental health curriculum integrating social-emotional learning with academic support" },
  { name: "AutoImmune Thrive", desc: "Chronic disease management for autoimmune conditions \u2014 support, education, community" },
  { name: "Speech Bridge (LexiBridge)", desc: "Communication access for individuals with speech/language needs" },
  { name: "Black Maternal Health Network", desc: "Addressing the maternal mortality crisis \u2014 Black women are 3x more likely to die from pregnancy complications" },
  { name: "Black Men's Health Hub", desc: "Proactive health screening, mental health support, and preventive care for Black men" },
];

healthPlatforms.forEach((p, i) => {
  const yPos = 1.2 + i * 0.8;
  slide.addText([
    { text: "\u25CF  ", options: { color: COLORS.green, fontSize: 12 } },
    { text: p.name + "  \u2014  ", options: { color: COLORS.navy, fontSize: 12, bold: true } },
    { text: p.desc, options: { color: "555555", fontSize: 11 } },
  ], {
    x: 0.7, y: yPos, w: 11.5, h: 0.7,
    fontFace: "Arial", valign: "top", lineSpacingMultiple: 1.1,
  });
});

// ============================================================
// SLIDE 7 — VETERANS & JUSTICE
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.navy };
addFooter(slide, 7, TOTAL_SLIDES);
slide.addText("VETERANS & JUSTICE", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.gold, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

slide.addText('"As a veteran, I know what it means to transition \u2014 and I built this\necosystem so no one has to do it alone." \u2014 Dr. Terry Flood', {
  x: 0.8, y: 1.2, w: 11, h: 0.8,
  fontSize: 15, fontFace: "Arial", color: COLORS.white, italic: true, lineSpacingMultiple: 1.3,
});

slide.addShape(pres.ShapeType.roundRect, {
  x: 0.5, y: 2.3, w: 5.7, h: 2.5,
  fill: { color: "243555" }, rectRadius: 0.15, line: { color: COLORS.teal, width: 2 },
});
slide.addText("Mission Transition (M2C)", {
  x: 0.7, y: 2.4, w: 5.3, h: 0.5,
  fontSize: 18, fontFace: "Arial", color: COLORS.teal, bold: true,
});
const m2cPoints = [
  "Military skill translation to civilian careers",
  "Employer matching based on MOS/rate codes",
  "Credential mapping \u2014 military training to certifications",
  "Peer mentoring from fellow veterans",
  "Benefits navigation and VA resource connection",
];
m2cPoints.forEach((p, i) => {
  slide.addText("\u2022  " + p, {
    x: 0.9, y: 3.0 + i * 0.35, w: 5, h: 0.35,
    fontSize: 11, fontFace: "Arial", color: COLORS.white,
  });
});

slide.addShape(pres.ShapeType.roundRect, {
  x: 6.5, y: 2.3, w: 5.7, h: 2.5,
  fill: { color: "243555" }, rectRadius: 0.15, line: { color: COLORS.indigo, width: 2 },
});
slide.addText("Justice Command Center", {
  x: 6.7, y: 2.4, w: 5.3, h: 0.5,
  fontSize: 18, fontFace: "Arial", color: COLORS.indigo, bold: true,
});
const jccPoints = [
  "Tract-level crime migration analysis",
  '"Crime migrates with gentrification" \u2014 proven by data',
  "Reentry pathways for justice-involved adults",
  "Buffalo East Side, Wilmington, Austin data stories",
  "Recidivism reduction through wraparound services",
];
jccPoints.forEach((p, i) => {
  slide.addText("\u2022  " + p, {
    x: 6.9, y: 3.0 + i * 0.35, w: 5, h: 0.35,
    fontSize: 11, fontFace: "Arial", color: COLORS.white,
  });
});

slide.addShape(pres.ShapeType.roundRect, {
  x: 0.5, y: 5.2, w: 11.7, h: 1.2,
  fill: { color: "243555" }, rectRadius: 0.15, line: { color: COLORS.gold, width: 2 },
});
slide.addText("LifeBridge \u2014 Community Reintegration", {
  x: 0.7, y: 5.3, w: 5, h: 0.4,
  fontSize: 16, fontFace: "Arial", color: COLORS.gold, bold: true,
});
slide.addText("Connecting returning citizens to housing, employment, healthcare, and mentoring through the same integrated ecosystem. No more falling through cracks between siloed agencies.", {
  x: 0.7, y: 5.7, w: 11, h: 0.6,
  fontSize: 12, fontFace: "Arial", color: COLORS.white, lineSpacingMultiple: 1.2,
});

// ============================================================
// SLIDE 8 — DATA-DRIVEN APPROACH
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 8, TOTAL_SLIDES);
slide.addText("DATA-DRIVEN \u2014 NOT GUESSWORK", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

slide.addText("We don't guess where the need is. We prove it.", {
  x: 0.8, y: 1.2, w: 11, h: 0.5,
  fontSize: 18, fontFace: "Arial", color: COLORS.darkGray, italic: true,
});

const dataPoints = [
  { title: "Census Tract Analysis", desc: "Every community we serve is analyzed at the tract level \u2014 not county averages that hide disparities. We map poverty, health access, education, employment, and housing block by block.", icon: "\uD83D\uDCCA" },
  { title: "Implementation Science (RPLICE)", desc: "CFIR 2.0 and RE-AIM frameworks ensure programs don't just exist \u2014 they actually work in the communities they serve. Built-in fidelity monitoring from Day 1.", icon: "\uD83D\uDD2C" },
  { title: "Real-Time Platform Analytics", desc: "24 platforms generating live data on engagement, outcomes, completion rates, and community impact. Not quarterly reports \u2014 real-time dashboards.", icon: "\u26A1" },
  { title: "Gentrification Corridor Mapping", desc: "Original research showing how crime, poverty, and displacement migrate as neighborhoods gentrify \u2014 backed by Census data from Buffalo, Wilmington, and Austin.", icon: "\uD83D\uDDFA\uFE0F" },
];

dataPoints.forEach((dp, i) => {
  const yPos = 2.0 + i * 1.3;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: yPos, w: 12, h: 1.1,
    fill: { color: COLORS.lightGray }, rectRadius: 0.1,
  });
  slide.addText(dp.title, {
    x: 1.0, y: yPos + 0.05, w: 10, h: 0.4,
    fontSize: 15, fontFace: "Arial", color: COLORS.navy, bold: true,
  });
  slide.addText(dp.desc, {
    x: 1.0, y: yPos + 0.45, w: 11, h: 0.6,
    fontSize: 12, fontFace: "Arial", color: "555555", lineSpacingMultiple: 1.2,
  });
});

// ============================================================
// SLIDE 9 — PFLUGERVILLE & CENTRAL TEXAS IMPACT
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 9, TOTAL_SLIDES);
slide.addText("LOCAL IMPACT \u2014 PFLUGERVILLE & CENTRAL TEXAS", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 30, fontFace: "Arial", color: COLORS.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

slide.addText('"Pflugerville isn\'t just where we live \u2014 it\'s where we build.\nEvery platform, every line of code, every job placement comes from right here."', {
  x: 0.8, y: 1.2, w: 11, h: 0.7,
  fontSize: 15, fontFace: "Arial", color: COLORS.darkGray, italic: true, lineSpacingMultiple: 1.3,
});

const localImpact = [
  { area: "Service Area", detail: "Travis, Williamson, Hays, Bastrop, Caldwell counties" },
  { area: "CHW Pipeline", detail: "Training Community Health Workers to serve underserved neighborhoods \u2014 expanding healthcare where clinics can't reach" },
  { area: "Youth Workforce", detail: "Career pathways aligned to Austin's growth sectors: Healthcare (+12%), IT (+15%), Construction (+9%), Manufacturing" },
  { area: "Veteran Services", detail: "Military-to-civilian transition support for Central Texas veterans \u2014 Fort Cavazos, Camp Mabry, and surrounding communities" },
  { area: "Justice Reform", detail: "Reentry pathways for Travis County's ~40,000 annual criminal cases \u2014 mentoring, employment, housing, treatment" },
  { area: "Business Development", detail: "Minority business incubation through MCE \u2014 procurement readiness, certification support, contracting pipelines" },
];

localImpact.forEach((li, i) => {
  const yPos = 2.2 + i * 0.8;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: yPos, w: 2.3, h: 0.65,
    fill: { color: COLORS.navy }, rectRadius: 0.08,
  });
  slide.addText(li.area, {
    x: 0.5, y: yPos, w: 2.3, h: 0.65,
    fontSize: 11, fontFace: "Arial", color: COLORS.white, bold: true, align: "center", valign: "middle",
  });
  slide.addText(li.detail, {
    x: 3.0, y: yPos, w: 9.5, h: 0.65,
    fontSize: 12, fontFace: "Arial", color: COLORS.darkGray, valign: "middle",
  });
});

// ============================================================
// SLIDE 10 — FUNDING & SUSTAINABILITY
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.navy };
addFooter(slide, 10, TOTAL_SLIDES);
slide.addText("FUNDING & SUSTAINABILITY", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.gold, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

slide.addText("Active Grant Pipeline: $3.5M+", {
  x: 0.8, y: 1.3, w: 11, h: 0.6,
  fontSize: 24, fontFace: "Arial", color: COLORS.white, bold: true,
});

const grants = [
  { name: "St. David's Health Equity", amount: "Up to $1M", status: "Active", color: COLORS.green },
  { name: "DOJ Second Chance Act", amount: "Up to $1M", status: "Due May 11", color: COLORS.orange },
  { name: "SSG Fox VA Grant", amount: "$750K", status: "Active", color: COLORS.green },
  { name: "Rare Impact Fund", amount: "$250K-$500K", status: "Due April 10", color: COLORS.orange },
  { name: "Austin FC Dream Starter", amount: "$100K", status: "Due April 13", color: COLORS.orange },
  { name: "TX Capital Foundation", amount: "$50K-$100K", status: "Preparing", color: COLORS.accent },
  { name: "WIOA Title I Youth", amount: "$200K-$500K", status: "Rolling", color: COLORS.accent },
];

const tableRows = [["Grant", "Amount", "Status"]].concat(grants.map(g => [g.name, g.amount, g.status]));
slide.addTable(tableRows, {
  x: 0.5, y: 2.2, w: 12,
  fontSize: 12, fontFace: "Arial",
  border: { type: "solid", pt: 0.5, color: "3A4A6A" },
  colW: [5, 3, 4],
  rowH: 0.45,
  color: COLORS.white,
  autoPage: false,
  headerRow: true,
});

slide.addText("3 Revenue Streams \u2014 Not Dependent on Any Single Source", {
  x: 0.8, y: 5.8, w: 11, h: 0.5,
  fontSize: 16, fontFace: "Arial", color: COLORS.gold, bold: true,
});

const streams = [
  { name: "TCAF 501(c)(3)", desc: "Grants & Programs", w: 3.5 },
  { name: "CIP LLC", desc: "Consulting & Implementation", w: 3.5 },
  { name: "M&T Consulting", desc: "Technical Advisory", w: 3.5 },
];
streams.forEach((s, i) => {
  const xPos = 0.8 + i * 3.8;
  slide.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: 6.3, w: s.w, h: 0.7,
    fill: { color: "243555" }, rectRadius: 0.1, line: { color: COLORS.gold, width: 1 },
  });
  slide.addText(s.name + "\n" + s.desc, {
    x: xPos, y: 6.3, w: s.w, h: 0.7,
    fontSize: 11, fontFace: "Arial", color: COLORS.white, align: "center", lineSpacingMultiple: 1.3,
  });
});

// ============================================================
// SLIDE 11 — 7 ACADEMIC DISCIPLINES
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 11, TOTAL_SLIDES);
slide.addText("GROUNDED IN 7 ACADEMIC DISCIPLINES", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 30, fontFace: "Arial", color: COLORS.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

const disciplines = [
  { name: "Implementation\nScience", desc: "CFIR 2.0 & RE-AIM frameworks ensure programs work in real communities", color: COLORS.accent },
  { name: "Criminal\nJustice", desc: "Tract-level crime analysis, reentry pathways, recidivism reduction", color: COLORS.indigo },
  { name: "HR\nManagement", desc: "Workforce development, staffing models, organizational capacity", color: COLORS.teal },
  { name: "I-O\nPsychology", desc: "Employee assessment, job matching, workplace performance optimization", color: COLORS.green },
  { name: "Education", desc: "K-12 through adult learning, credentialing, career pathway design", color: COLORS.orange },
  { name: "Social\nScience", desc: "Census analysis, community assessment, stakeholder engagement", color: COLORS.rose },
  { name: "Healthcare &\nPublic Health", desc: "CHW training, health screening, SDoH, chronic disease management", color: COLORS.red },
];

disciplines.forEach((d, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const xPos = 0.5 + col * 3.1;
  const yPos = 1.4 + row * 2.8;

  slide.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: yPos, w: 2.8, h: 2.3,
    fill: { color: COLORS.lightGray }, rectRadius: 0.15,
    line: { color: d.color, width: 2, dashType: "solid" },
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: yPos, w: 2.8, h: 0.8,
    fill: { color: d.color }, rectRadius: 0.15,
  });
  slide.addText(d.name, {
    x: xPos, y: yPos, w: 2.8, h: 0.8,
    fontSize: 12, fontFace: "Arial", color: COLORS.white, bold: true, align: "center", valign: "middle", lineSpacingMultiple: 1.1,
  });
  slide.addText(d.desc, {
    x: xPos + 0.15, y: yPos + 0.9, w: 2.5, h: 1.3,
    fontSize: 10, fontFace: "Arial", color: COLORS.darkGray, valign: "top", lineSpacingMultiple: 1.2,
  });
});

// ============================================================
// SLIDE 12 — COMPETITIVE EDGE
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.navy };
addFooter(slide, 12, TOTAL_SLIDES);
slide.addText("WHY TCAF STANDS OUT", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.gold, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

const edges = [
  { left: "Most nonprofits", right: "TCAF", leftDesc: "Use disconnected tools,\nspreadsheets, separate systems", rightDesc: "24 integrated platforms \u2014\none ecosystem, zero gaps" },
  { left: "Most applicants", right: "TCAF", leftDesc: "Present plans and proposals\n(\"we will build...\")", rightDesc: "Shows live, working software\nyou can visit TODAY" },
  { left: "Typical data", right: "TCAF", leftDesc: "County-level averages that\nhide real disparities", rightDesc: "Census tract-level analysis\nthat reveals the truth" },
  { left: "Standard approach", right: "TCAF", leftDesc: "Single-focus programs \u2014\njust workforce OR just health", rightDesc: "Wraparound ecosystem \u2014\nworkforce + health + education + justice" },
  { left: "Common leadership", right: "TCAF", leftDesc: "Well-intentioned but lacking\nacademic rigor", rightDesc: "7 academic disciplines,\nveteran leadership, lived experience" },
];

edges.forEach((e, i) => {
  const yPos = 1.3 + i * 1.1;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: yPos, w: 5, h: 0.9,
    fill: { color: "1E3050" }, rectRadius: 0.08,
  });
  slide.addText(e.leftDesc, {
    x: 0.7, y: yPos + 0.05, w: 4.5, h: 0.8,
    fontSize: 10, fontFace: "Arial", color: "889AAA", valign: "middle",
  });
  slide.addText("VS", {
    x: 5.7, y: yPos, w: 1, h: 0.9,
    fontSize: 11, fontFace: "Arial", color: COLORS.gold, bold: true, align: "center", valign: "middle",
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 6.8, y: yPos, w: 5.5, h: 0.9,
    fill: { color: "243555" }, rectRadius: 0.08, line: { color: COLORS.gold, width: 1 },
  });
  slide.addText(e.rightDesc, {
    x: 7.0, y: yPos + 0.05, w: 5, h: 0.8,
    fontSize: 10, fontFace: "Arial", color: COLORS.white, valign: "middle", bold: true,
  });
});

// ============================================================
// SLIDE 13 — THE ASK (Customizable)
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.white };
addFooter(slide, 13, TOTAL_SLIDES);
slide.addText("HOW YOU CAN HELP", {
  x: 0.5, y: 0.3, w: 12, h: 0.7,
  fontSize: 32, fontFace: "Arial", color: COLORS.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: 1.0, w: 3, h: 0, line: { color: COLORS.gold, width: 3 },
});

const asks = [
  { audience: "VETERANS COMMISSION", ask: "A letter of support for our DOJ Second Chance Act application \u2014 bringing up to $1M in federal reentry funding to Central Texas. Your guidance on better serving Austin-area veterans.", color: COLORS.teal },
  { audience: "EQUITY ADVISORY BOARD", ask: "Explore how TCAF's data tools and community health platforms can support the Board's equity recommendations. Consider Dr. Flood for a board seat \u2014 this mission is his life's work.", color: COLORS.indigo },
  { audience: "CITY COUNCIL", ask: "A letter of support that tells funders Pflugerville stands behind TCAF. This helps us bring millions in grant funding into our community \u2014 workforce training, health access, youth programs.", color: COLORS.accent },
  { audience: "COMMUNITY PARTNERS", ask: "If you're an employer looking for trained workers, a nonprofit seeking partnership, or a community member who wants to get involved \u2014 we're your neighbors. Let's build together.", color: COLORS.green },
];

asks.forEach((a, i) => {
  const yPos = 1.3 + i * 1.4;
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: yPos, w: 12, h: 1.2,
    fill: { color: COLORS.lightGray }, rectRadius: 0.1,
    line: { color: a.color, width: 2, dashType: "solid" },
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: yPos, w: 3, h: 1.2,
    fill: { color: a.color }, rectRadius: 0.1,
  });
  slide.addText(a.audience, {
    x: 0.5, y: yPos, w: 3, h: 1.2,
    fontSize: 12, fontFace: "Arial", color: COLORS.white, bold: true, align: "center", valign: "middle",
  });
  slide.addText(a.ask, {
    x: 3.7, y: yPos + 0.1, w: 8.5, h: 1.0,
    fontSize: 12, fontFace: "Arial", color: COLORS.darkGray, valign: "middle", lineSpacingMultiple: 1.3,
  });
});

// ============================================================
// SLIDE 14 — CLOSING / CONTACT
// ============================================================
slide = pres.addSlide();
slide.background = { color: COLORS.navy };
slide.addText("LET'S BUILD TOGETHER", {
  x: 1, y: 1.0, w: 11, h: 1.0,
  fontSize: 42, fontFace: "Arial", color: COLORS.gold, bold: true, align: "center",
});
slide.addShape(pres.ShapeType.line, {
  x: 4, y: 2.2, w: 5, h: 0, line: { color: COLORS.gold, width: 2 },
});

slide.addText("Dr. Terry Flood", {
  x: 1, y: 2.8, w: 11, h: 0.6,
  fontSize: 24, fontFace: "Arial", color: COLORS.white, bold: true, align: "center",
});
slide.addText("Founder & CEO  |  U.S. Army Veteran", {
  x: 1, y: 3.4, w: 11, h: 0.5,
  fontSize: 16, fontFace: "Arial", color: "AABBCC", align: "center",
});

const contactItems = [
  "mr.terryflood@gmail.com",
  "thrivingcommunitiesforall.com",
  "17912 Stefano Drive, Pflugerville, TX 78660",
  "The Collaborative Advocate Foundation  |  EIN 41-3618003",
];
contactItems.forEach((c, i) => {
  slide.addText(c, {
    x: 1, y: 4.3 + i * 0.45, w: 11, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: COLORS.white, align: "center",
  });
});

slide.addShape(pres.ShapeType.roundRect, {
  x: 3, y: 6.2, w: 7, h: 0.7,
  fill: { color: "243555" }, rectRadius: 0.1, line: { color: COLORS.gold, width: 1 },
});
slide.addText("Cash App: $MRTDFLOOD   |   PayPal: paypal.me/TERRYFLOODCEO", {
  x: 3, y: 6.2, w: 7, h: 0.7,
  fontSize: 13, fontFace: "Arial", color: COLORS.gold, align: "center",
});

// Generate
pres.writeFile({ fileName: "TCAF_Community_Presentation.pptx" })
  .then(() => console.log("Presentation created: TCAF_Community_Presentation.pptx"))
  .catch(err => console.error("Error:", err));
