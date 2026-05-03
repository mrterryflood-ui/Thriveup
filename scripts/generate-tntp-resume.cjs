const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Dr. Terry Flood";
pres.title = "Dr. Terry Flood — Resume — TNTP Partner, Education to Career";

const C = {
  navy: "1B2A4A",
  gold: "D4A843",
  white: "FFFFFF",
  light: "F5F6F8",
  dark: "2D3748",
  mid: "555555",
  accent: "3B82F6",
  line: "CCCCCC",
  green: "10B981",
};

// ============================================================
// PAGE 1
// ============================================================
let slide = pres.addSlide();
slide.background = { color: C.white };

// Header bar
slide.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 13.33, h: 1.6,
  fill: { color: C.navy },
});

slide.addText("DR. TERRY FLOOD", {
  x: 0.6, y: 0.15, w: 8, h: 0.65,
  fontSize: 32, fontFace: "Arial", color: C.gold, bold: true,
});

slide.addText("Partner, Education to Career — TNTP Application", {
  x: 0.6, y: 0.75, w: 8, h: 0.35,
  fontSize: 14, fontFace: "Arial", color: C.white, italic: true,
});

slide.addText([
  { text: "Pflugerville, TX 78660  |  mr.terryflood@gmail.com\n", options: { fontSize: 11 } },
  { text: "thrivingcommunitiesforall.com  |  U.S. Army Veteran", options: { fontSize: 11 } },
], {
  x: 0.6, y: 1.05, w: 8, h: 0.45,
  fontFace: "Arial", color: "AABBDD", lineSpacingMultiple: 1.3,
});

// PROFESSIONAL SUMMARY
let y = 1.85;
slide.addText("PROFESSIONAL SUMMARY", {
  x: 0.5, y, w: 12, h: 0.4,
  fontSize: 13, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: y + 0.35, w: 12, h: 0, line: { color: C.gold, width: 2 },
});

y += 0.45;
slide.addText(
  "Veteran-founded nonprofit CEO and workforce development architect with 7+ years leading cross-sector partnerships spanning PK\u201312 education, postsecondary, workforce boards, employers, and community organizations. Built a 24-platform AI-powered technology ecosystem (thrivingcommunitiesforall.com) serving workforce development, health equity, criminal justice reform, and youth empowerment across Central Texas. Manages $3.5M+ active grant pipeline including federal (DOJ, DOL/WIOA), state (Texas Veterans Commission), and foundation funding. Academic foundation across 7 disciplines: Implementation Science, Criminal Justice, HR Management, I-O Psychology, Education, Social Science, and Healthcare & Public Health.",
  {
    x: 0.5, y, w: 12.3, h: 1.1,
    fontSize: 10.5, fontFace: "Arial", color: C.dark, lineSpacingMultiple: 1.3,
  }
);

// CORE COMPETENCIES
y += 1.2;
slide.addText("CORE COMPETENCIES", {
  x: 0.5, y, w: 12, h: 0.4,
  fontSize: 13, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: y + 0.35, w: 12, h: 0, line: { color: C.gold, width: 2 },
});

y += 0.45;
const competencies = [
  ["Career Pathway Design & Implementation", "Cross-Sector Coalition Building", "WIOA Title I / Perkins V / ESSA Policy"],
  ["Business Development & Grant Writing", "Data Analytics & Census Tract Analysis", "Workforce Board & Employer Partnerships"],
  ["Implementation Science (CFIR 2.0, RE-AIM)", "PK\u201312 to Postsecondary Systems Alignment", "Stakeholder Facilitation & Consensus Building"],
];

competencies.forEach((row, ri) => {
  row.forEach((comp, ci) => {
    const xPos = 0.5 + ci * 4.15;
    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: y + ri * 0.4, w: 3.95, h: 0.35,
      fill: { color: C.light }, rectRadius: 0.05,
    });
    slide.addText("\u2022  " + comp, {
      x: xPos + 0.05, y: y + ri * 0.4, w: 3.85, h: 0.35,
      fontSize: 9, fontFace: "Arial", color: C.dark, valign: "middle",
    });
  });
});

// PROFESSIONAL EXPERIENCE
y += 1.4;
slide.addText("PROFESSIONAL EXPERIENCE", {
  x: 0.5, y, w: 12, h: 0.4,
  fontSize: 13, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: y + 0.35, w: 12, h: 0, line: { color: C.gold, width: 2 },
});

// TCAF Role
y += 0.5;
slide.addText("President", {
  x: 0.5, y, w: 6, h: 0.3,
  fontSize: 12, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addText("2019 \u2013 Present", {
  x: 9.5, y, w: 3, h: 0.3,
  fontSize: 10, fontFace: "Arial", color: C.mid, align: "right",
});
slide.addText("The Collaborative Advocate Foundation (TCAF)  |  Pflugerville, TX", {
  x: 0.5, y: y + 0.27, w: 8, h: 0.25,
  fontSize: 10, fontFace: "Arial", color: C.accent, italic: true,
});

y += 0.6;
const tcafBullets = [
  "Designed and launched 24-platform AI-powered ecosystem serving workforce development, health equity, criminal justice reform, and community empowerment \u2014 all platforms live at thrivingcommunitiesforall.com",
  "Built 50+ stackable career pathways with credential tracking spanning CNA, CompTIA, CDL, CHW certification, welding, and advanced manufacturing \u2014 aligned to Austin MSA labor market demand data",
  "Manage $3.5M+ active grant pipeline including DOJ Second Chance Act ($1M), SSG Fox VA ($750K), Rare Impact Fund ($500K), St. David\u2019s Health Equity ($1M), WIOA Title I Youth ($500K), and Austin FC Dream Starter ($100K)",
  "Lead cross-sector coalition development with workforce boards (Workforce Solutions Capital Area), employers (Ascension Seton, H-E-B, Dell, Samsung), community health centers (CommUnityCare), and PK\u201312 systems",
  "Created RPLICE implementation science system using CFIR 2.0 and RE-AIM frameworks to measure program fidelity, ensuring interventions produce measurable outcomes in the communities they serve",
  "Developed Census tract-level data analytics revealing how poverty, crime, and health disparities concentrate \u2014 replacing misleading county-level averages with block-by-block evidence for strategic decision-making",
  "Designed Community Health Worker (CHW) training pipeline addressing healthcare access gaps in underserved neighborhoods \u2014 training nonclinical workforce to expand health system reach",
  "Built Mission Transition (M2C) platform for military-to-civilian career transition \u2014 skill translation, employer matching, credential mapping for veterans",
];

tcafBullets.forEach((b, i) => {
  slide.addText("\u2022  " + b, {
    x: 0.7, y: y + i * 0.38, w: 11.8, h: 0.38,
    fontSize: 9, fontFace: "Arial", color: C.dark, lineSpacingMultiple: 1.15, valign: "top",
  });
});

// ============================================================
// PAGE 2
// ============================================================
slide = pres.addSlide();
slide.background = { color: C.white };

// Continue header
slide.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 13.33, h: 0.5,
  fill: { color: C.navy },
});
slide.addText("DR. TERRY FLOOD  \u2014  Resume (continued)", {
  x: 0.5, y: 0, w: 12, h: 0.5,
  fontSize: 11, fontFace: "Arial", color: C.gold, bold: true,
});

// CIP LLC
y = 0.7;
slide.addText("Managing Principal", {
  x: 0.5, y, w: 6, h: 0.3,
  fontSize: 12, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addText("2019 \u2013 Present", {
  x: 9.5, y, w: 3, h: 0.3,
  fontSize: 10, fontFace: "Arial", color: C.mid, align: "right",
});
slide.addText("CIP LLC (Community Implementation Partners)  |  Pflugerville, TX", {
  x: 0.5, y: y + 0.27, w: 8, h: 0.25,
  fontSize: 10, fontFace: "Arial", color: C.accent, italic: true,
});

y += 0.6;
const cipBullets = [
  "Provide consulting and implementation services to organizations adopting workforce development, health equity, and community enablement strategies",
  "Translate partner ecosystem needs into fundable scopes of work for foundation and government funders",
  "Lead business development including proposal drafting, funder briefings, and progress reporting across multiple simultaneous engagements",
];

cipBullets.forEach((b, i) => {
  slide.addText("\u2022  " + b, {
    x: 0.7, y: y + i * 0.35, w: 11.8, h: 0.35,
    fontSize: 9.5, fontFace: "Arial", color: C.dark, lineSpacingMultiple: 1.15,
  });
});

// M&T Consulting
y += 1.2;
slide.addText("Principal Consultant", {
  x: 0.5, y, w: 6, h: 0.3,
  fontSize: 12, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addText("2019 \u2013 Present", {
  x: 9.5, y, w: 3, h: 0.3,
  fontSize: 10, fontFace: "Arial", color: C.mid, align: "right",
});
slide.addText("M&T Consulting  |  Pflugerville, TX", {
  x: 0.5, y: y + 0.27, w: 8, h: 0.25,
  fontSize: 10, fontFace: "Arial", color: C.accent, italic: true,
});

y += 0.6;
const mtBullets = [
  "Technical advisory services for organizations implementing workforce technology platforms and data-driven community health programs",
  "Strategic counsel to cross-sector leaders establishing shared goals, governance structures, and accountability systems across education, workforce, and health systems",
];

mtBullets.forEach((b, i) => {
  slide.addText("\u2022  " + b, {
    x: 0.7, y: y + i * 0.35, w: 11.8, h: 0.35,
    fontSize: 9.5, fontFace: "Arial", color: C.dark, lineSpacingMultiple: 1.15,
  });
});

// Military Service
y += 1.0;
slide.addText("MILITARY SERVICE", {
  x: 0.5, y, w: 12, h: 0.4,
  fontSize: 13, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: y + 0.35, w: 12, h: 0, line: { color: C.gold, width: 2 },
});

y += 0.45;
slide.addText("United States Army", {
  x: 0.5, y, w: 6, h: 0.3,
  fontSize: 12, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addText([
  { text: "\u2022  Honorably discharged veteran with leadership experience in team management, logistics, and mission-critical operations\n", options: {} },
  { text: "\u2022  Military service informs TCAF's disciplined approach to program implementation, accountability, and measurable outcomes\n", options: {} },
  { text: "\u2022  Built Mission Transition (M2C) platform from personal understanding of military-to-civilian transition challenges", options: {} },
], {
  x: 0.7, y: y + 0.3, w: 11.8, h: 0.9,
  fontSize: 9.5, fontFace: "Arial", color: C.dark, lineSpacingMultiple: 1.3,
});

// EDUCATION
y += 1.4;
slide.addText("EDUCATION & ACADEMIC FOUNDATION", {
  x: 0.5, y, w: 12, h: 0.4,
  fontSize: 13, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: y + 0.35, w: 12, h: 0, line: { color: C.gold, width: 2 },
});

y += 0.5;
slide.addText("Interdisciplinary Academic Foundation Spanning 7 Disciplines:", {
  x: 0.5, y, w: 12, h: 0.3,
  fontSize: 10.5, fontFace: "Arial", color: C.dark, bold: true,
});

y += 0.35;
const disciplines = [
  "Implementation Science", "Criminal Justice", "Human Resource Management",
  "Industrial-Organizational Psychology", "Education", "Social Science", "Healthcare & Public Health",
];
disciplines.forEach((d, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  slide.addText("\u2713  " + d, {
    x: 0.7 + col * 4.1, y: y + row * 0.3, w: 3.9, h: 0.3,
    fontSize: 9.5, fontFace: "Arial", color: C.dark,
  });
});

// KEY ACHIEVEMENTS
y += 1.0;
slide.addText("KEY ACHIEVEMENTS & METRICS", {
  x: 0.5, y, w: 12, h: 0.4,
  fontSize: 13, fontFace: "Arial", color: C.navy, bold: true,
});
slide.addShape(pres.ShapeType.line, {
  x: 0.5, y: y + 0.35, w: 12, h: 0, line: { color: C.gold, width: 2 },
});

y += 0.5;
const achievements = [
  { metric: "24", label: "Live technology platforms serving workforce, health, education, justice, and business" },
  { metric: "50+", label: "Career pathways designed with stackable credentials aligned to labor market demand" },
  { metric: "$3.5M+", label: "Active grant pipeline across federal, state, and foundation sources" },
  { metric: "7", label: "Academic disciplines integrated into ecosystem design and implementation" },
  { metric: "5", label: "Counties served in Central Texas (Travis, Williamson, Hays, Bastrop, Caldwell)" },
  { metric: "3", label: "Business entities supporting diversified revenue (nonprofit, consulting, advisory)" },
];

achievements.forEach((a, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const xPos = 0.5 + col * 4.15;
  const yPos = y + row * 0.7;
  
  slide.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: yPos, w: 3.95, h: 0.6,
    fill: { color: C.light }, rectRadius: 0.05,
  });
  slide.addText([
    { text: a.metric + "  ", options: { color: C.accent, fontSize: 16, bold: true } },
    { text: a.label, options: { color: C.dark, fontSize: 9 } },
  ], {
    x: xPos + 0.1, y: yPos, w: 3.75, h: 0.6,
    fontFace: "Arial", valign: "middle",
  });
});

// Footer
slide.addShape(pres.ShapeType.rect, {
  x: 0, y: 7.05, w: 13.33, h: 0.45,
  fill: { color: C.navy },
});
slide.addText("thrivingcommunitiesforall.com  |  mr.terryflood@gmail.com  |  Pflugerville, TX 78660  |  EIN 41-3618003", {
  x: 0.5, y: 7.05, w: 12, h: 0.45,
  fontSize: 10, fontFace: "Arial", color: C.gold, align: "center",
});

pres.writeFile({ fileName: "Dr_Terry_Flood_Resume_TNTP.pptx" })
  .then(() => console.log("Resume created: Dr_Terry_Flood_Resume_TNTP.pptx"))
  .catch(err => console.error("Error:", err));
