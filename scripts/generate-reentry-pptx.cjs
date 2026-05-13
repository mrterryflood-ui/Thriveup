const PptxGenJS = require("pptxgenjs");

const pptx = new PptxGenJS();

pptx.author = "The Collaborative Advocate Foundation";
pptx.company = "TCAF";
pptx.subject = "Texas Reentry Stipend Pilot";
pptx.title = "Invest $7,600 to Save $75,000";

const COLORS = {
  dark: "1E293B",
  darkBg: "0F172A",
  emerald: "059669",
  emeraldLight: "D1FAE5",
  red: "DC2626",
  redLight: "FEE2E2",
  blue: "2563EB",
  blueLight: "DBEAFE",
  amber: "D97706",
  amberLight: "FEF3C7",
  white: "FFFFFF",
  gray: "64748B",
  grayLight: "F1F5F9",
  grayDark: "334155",
  black: "000000",
};

function addTitleSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.darkBg };
  slide.addShape(pptx.shapes.OVAL, { x: 6.5, y: -1, w: 5, h: 5, fill: { color: COLORS.emerald, transparency: 85 } });
  slide.addShape(pptx.shapes.OVAL, { x: -1, y: 3, w: 5, h: 5, fill: { color: COLORS.blue, transparency: 85 } });
  slide.addText("PROPOSED PILOT STUDY", { x: 0.8, y: 1.0, w: 8.4, h: 0.4, fontSize: 14, color: COLORS.emerald, fontFace: "Arial", bold: true, letterSpacing: 3 });
  slide.addText("Invest $7,600\nto Save $75,000", { x: 0.8, y: 1.5, w: 8.4, h: 2.0, fontSize: 40, color: COLORS.white, fontFace: "Arial", bold: true, lineSpacing: 48 });
  slide.addText("A Texas Reentry Stipend Pilot to Break the Cycle of Recidivism", { x: 0.8, y: 3.5, w: 8.4, h: 0.6, fontSize: 18, color: "94A3B8", fontFace: "Arial" });
  slide.addText("The Collaborative Advocate Foundation (TCAF)\nDr. Terry Flood, DHA -- President\nEIN: 41-3618503", { x: 0.8, y: 4.5, w: 5, h: 1.0, fontSize: 12, color: "CBD5E1", fontFace: "Arial", lineSpacing: 18 });

  const statsData = [
    { val: "$50", label: "Gate Money", color: COLORS.red },
    { val: "46%", label: "TX Recidivism (3yr)", color: COLORS.red },
    { val: "60,000", label: "Annual Releases", color: COLORS.amber },
    { val: "$25,174", label: "Cost/Inmate/Year", color: COLORS.emerald },
  ];
  statsData.forEach((s, i) => {
    const x = 0.8 + i * 2.2;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 5.8, w: 2.0, h: 1.1, fill: { color: COLORS.white, transparency: 90 }, rectRadius: 0.1 });
    slide.addText(s.val, { x, y: 5.85, w: 2.0, h: 0.6, fontSize: 24, color: s.color, fontFace: "Arial", bold: true, align: "center" });
    slide.addText(s.label, { x, y: 6.4, w: 2.0, h: 0.4, fontSize: 9, color: "94A3B8", fontFace: "Arial", align: "center" });
  });
}

function addProblemSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.05, fill: { color: COLORS.red } });

  slide.addText("THE PROBLEM", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 28, color: COLORS.dark, fontFace: "Arial", bold: true });
  slide.addText("Setting People Up to Fail on Day 1", { x: 0.8, y: 0.8, w: 8.4, h: 0.4, fontSize: 16, color: COLORS.gray, fontFace: "Arial" });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.5, w: 2.8, h: 3.5, fill: { color: COLORS.redLight }, rectRadius: 0.15 });
  slide.addText("Day 1 After Release", { x: 0.5, y: 1.55, w: 2.8, h: 0.45, fontSize: 14, color: COLORS.red, fontFace: "Arial", bold: true, align: "center" });
  const day1Items = ["Cash in hand: $50", "Transport: Bus ticket", "Housing: None", "Job: None", "Valid ID: Expired", "Phone: None"];
  day1Items.forEach((item, i) => {
    slide.addText(item, { x: 0.7, y: 2.1 + i * 0.42, w: 2.4, h: 0.38, fontSize: 11, color: COLORS.grayDark, fontFace: "Arial" });
  });
  slide.addText("$50 won't cover 1 motel night\nin Austin ($89/night avg)", { x: 0.6, y: 4.6, w: 2.6, h: 0.4, fontSize: 9, color: COLORS.red, fontFace: "Arial", italic: true, align: "center" });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.6, y: 1.5, w: 2.8, h: 3.5, fill: { color: COLORS.amberLight }, rectRadius: 0.15 });
  slide.addText("First 90 Days", { x: 3.6, y: 1.55, w: 2.8, h: 0.45, fontSize: 14, color: COLORS.amber, fontFace: "Arial", bold: true, align: "center" });
  const ninetyDayStats = [
    { pct: "33%", label: "Homeless within 60 days" },
    { pct: "60%", label: "Unemployed at 90 days" },
    { pct: "68%", label: "Substance relapse in Year 1" },
    { pct: "8.2 mo", label: "Median time to employment" },
  ];
  ninetyDayStats.forEach((s, i) => {
    slide.addText(s.pct, { x: 3.75, y: 2.15 + i * 0.7, w: 1.0, h: 0.35, fontSize: 18, color: COLORS.amber, fontFace: "Arial", bold: true });
    slide.addText(s.label, { x: 4.75, y: 2.15 + i * 0.7, w: 1.5, h: 0.35, fontSize: 10, color: COLORS.grayDark, fontFace: "Arial" });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.7, y: 1.5, w: 2.8, h: 3.5, fill: { color: COLORS.grayLight }, rectRadius: 0.15 });
  slide.addText("The Cost of Failure", { x: 6.7, y: 1.55, w: 2.8, h: 0.45, fontSize: 14, color: COLORS.grayDark, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("$25,174", { x: 6.7, y: 2.2, w: 2.8, h: 0.5, fontSize: 28, color: COLORS.red, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("per inmate per year", { x: 6.7, y: 2.7, w: 2.8, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center" });
  slide.addText("$75,522", { x: 6.7, y: 3.2, w: 2.8, h: 0.5, fontSize: 28, color: COLORS.red, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("per re-incarceration (3 years)", { x: 6.7, y: 3.7, w: 2.8, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center" });
  slide.addText("~$696M", { x: 6.7, y: 4.15, w: 2.8, h: 0.4, fontSize: 22, color: COLORS.dark, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("annual cost of TX recidivism", { x: 6.7, y: 4.5, w: 2.8, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center" });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 5.3, w: 9.0, h: 1.2, fill: { color: COLORS.darkBg }, rectRadius: 0.1 });
  slide.addText("Every person who returns to prison costs Texas $75,000+.\nThe $50 they leave with hasn't changed since 1973.", { x: 0.8, y: 5.4, w: 8.4, h: 1.0, fontSize: 16, color: COLORS.white, fontFace: "Arial", align: "center", bold: true, lineSpacing: 24 });
}

function addInterventionSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.05, fill: { color: COLORS.blue } });

  slide.addText("THE INTERVENTION", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 28, color: COLORS.dark, fontFace: "Arial", bold: true });
  slide.addText("4-Arm Randomized Controlled Trial  |  400 Participants  |  100 Per Arm", { x: 0.8, y: 0.8, w: 8.4, h: 0.4, fontSize: 14, color: COLORS.gray, fontFace: "Arial" });

  const arms = [
    { name: "CONTROL", label: "Status Quo", amount: "$50", desc: "Current TDCJ\npractice: $50 cash\nand a bus ticket", color: COLORS.gray, bg: COLORS.grayLight },
    { name: "ARM 1", label: "Cash Stability", amount: "$250", desc: "Tests whether\nimmediate cash\nalone changes\nbehavior", color: COLORS.blue, bg: COLORS.blueLight },
    { name: "ARM 2", label: "Enhanced Cash", amount: "$500", desc: "Dose-response:\ndoes more cash\nproduce a larger\neffect?", color: COLORS.amber, bg: COLORS.amberLight },
    { name: "ARM 3", label: "Full Bridge", amount: "$7,600", desc: "$500 release +\n$500 workforce +\n$3,600 training +\n$3,000 stipend", color: COLORS.emerald, bg: COLORS.emeraldLight },
  ];

  arms.forEach((arm, i) => {
    const x = 0.5 + i * 2.35;
    const w = 2.15;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.4, w, h: 4.5, fill: { color: arm.bg }, rectRadius: 0.15, line: { color: arm.color, width: 2 } });
    slide.addText(arm.name, { x, y: 1.5, w, h: 0.35, fontSize: 11, color: arm.color, fontFace: "Arial", bold: true, align: "center", letterSpacing: 2 });
    slide.addText(arm.label, { x, y: 1.85, w, h: 0.35, fontSize: 13, color: COLORS.dark, fontFace: "Arial", bold: true, align: "center" });
    slide.addText(arm.amount, { x, y: 2.4, w, h: 0.7, fontSize: 32, color: arm.color, fontFace: "Arial", bold: true, align: "center" });
    slide.addText("per person", { x, y: 3.05, w, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center" });
    slide.addText(arm.desc, { x: x + 0.15, y: 3.5, w: w - 0.3, h: 1.8, fontSize: 11, color: COLORS.grayDark, fontFace: "Arial", align: "center", lineSpacing: 16 });
    slide.addText("n = 100", { x, y: 5.5, w, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center", italic: true });
  });

  if (arms.length > 1) {
    for (let i = 0; i < 3; i++) {
      const x = 2.65 + i * 2.35;
      slide.addText("\u25B6", { x: x - 0.1, y: 2.6, w: 0.2, h: 0.3, fontSize: 14, color: COLORS.gray, fontFace: "Arial", align: "center" });
    }
  }

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 6.1, w: 9.0, h: 0.7, fill: { color: COLORS.emeraldLight }, rectRadius: 0.1 });
  slide.addText("Arm 3 bridges EVERY financial gap: immediate cash + workforce connection + paid training + sustained support", { x: 0.8, y: 6.15, w: 8.4, h: 0.6, fontSize: 13, color: COLORS.emerald, fontFace: "Arial", bold: true, align: "center" });
}

function addCostBenefitSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.05, fill: { color: COLORS.emerald } });

  slide.addText("COST-BENEFIT ANALYSIS", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 28, color: COLORS.dark, fontFace: "Arial", bold: true });
  slide.addText("The Math That Changes the Conversation", { x: 0.8, y: 0.8, w: 8.4, h: 0.4, fontSize: 16, color: COLORS.gray, fontFace: "Arial" });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.5, w: 4.2, h: 3.0, fill: { color: COLORS.blueLight }, rectRadius: 0.15 });
  slide.addText("PILOT SCALE  |  400 Participants", { x: 0.5, y: 1.55, w: 4.2, h: 0.4, fontSize: 12, color: COLORS.blue, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("At 20% Recidivism Reduction:", { x: 0.7, y: 2.05, w: 3.8, h: 0.35, fontSize: 12, color: COLORS.grayDark, fontFace: "Arial", bold: true });
  const pilotRows = [
    ["Investment (Arm 3, 100 people)", "$760,000"],
    ["Incarcerations prevented", "20 people"],
    ["Savings (20 x $75,522)", "$1,510,440"],
    ["Net benefit", "$750,440"],
    ["Return on Investment", "199%"],
  ];
  pilotRows.forEach((row, i) => {
    slide.addText(row[0], { x: 0.7, y: 2.5 + i * 0.4, w: 2.6, h: 0.35, fontSize: 11, color: COLORS.grayDark, fontFace: "Arial" });
    slide.addText(row[1], { x: 3.3, y: 2.5 + i * 0.4, w: 1.2, h: 0.35, fontSize: 11, color: COLORS.dark, fontFace: "Arial", bold: true, align: "right" });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 5.3, y: 1.5, w: 4.2, h: 3.0, fill: { color: COLORS.emeraldLight }, rectRadius: 0.15 });
  slide.addText("STATE SCALE  |  60,000 Releases/Year", { x: 5.3, y: 1.55, w: 4.2, h: 0.4, fontSize: 12, color: COLORS.emerald, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("At 20% Recidivism Reduction:", { x: 5.5, y: 2.05, w: 3.8, h: 0.35, fontSize: 12, color: COLORS.grayDark, fontFace: "Arial", bold: true });
  const stateRows = [
    ["Annual investment", "$456M"],
    ["People diverted from prison", "12,000"],
    ["Annual savings", "$2.27B"],
    ["Net annual savings", "$1.81B"],
    ["% of incarceration budget", "13.9%"],
  ];
  stateRows.forEach((row, i) => {
    slide.addText(row[0], { x: 5.5, y: 2.5 + i * 0.4, w: 2.6, h: 0.35, fontSize: 11, color: COLORS.grayDark, fontFace: "Arial" });
    slide.addText(row[1], { x: 8.1, y: 2.5 + i * 0.4, w: 1.2, h: 0.35, fontSize: 11, color: COLORS.dark, fontFace: "Arial", bold: true, align: "right" });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.8, w: 9.0, h: 1.5, fill: { color: COLORS.darkBg }, rectRadius: 0.15 });
  slide.addText("BREAK-EVEN ANALYSIS", { x: 0.8, y: 4.9, w: 8.4, h: 0.4, fontSize: 14, color: COLORS.emerald, fontFace: "Arial", bold: true, align: "center" });

  const scenarios = [
    { pct: "5%", saves: "$340M", net: "Break-even", color: COLORS.gray },
    { pct: "10%", saves: "$906M", net: "+$450M", color: COLORS.blue },
    { pct: "20%", saves: "$2.27B", net: "+$1.81B", color: COLORS.emerald },
    { pct: "30%", saves: "$3.4B", net: "+$2.94B", color: COLORS.emerald },
  ];
  scenarios.forEach((s, i) => {
    const x = 1.0 + i * 2.1;
    slide.addText(s.pct, { x, y: 5.3, w: 1.8, h: 0.35, fontSize: 20, color: s.color, fontFace: "Arial", bold: true, align: "center" });
    slide.addText("reduction", { x, y: 5.6, w: 1.8, h: 0.25, fontSize: 9, color: "94A3B8", fontFace: "Arial", align: "center" });
    slide.addText(s.net, { x, y: 5.85, w: 1.8, h: 0.35, fontSize: 14, color: COLORS.white, fontFace: "Arial", bold: true, align: "center" });
  });

  slide.addText("Even at 5% reduction, the program pays for itself. Above 10%, it's one of the highest-ROI investments Texas can make.", { x: 0.8, y: 6.5, w: 8.4, h: 0.4, fontSize: 12, color: COLORS.emerald, fontFace: "Arial", italic: true, align: "center" });
}

function addOutcomesSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.05, fill: { color: COLORS.blue } });

  slide.addText("WHAT WE MEASURE", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 28, color: COLORS.dark, fontFace: "Arial", bold: true });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.2, w: 2.8, h: 4.0, fill: { color: COLORS.redLight }, rectRadius: 0.15, line: { color: COLORS.red, width: 2 } });
  slide.addText("Primary Outcomes", { x: 0.5, y: 1.3, w: 2.8, h: 0.4, fontSize: 14, color: COLORS.red, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("Measured at 12, 24, 36 months", { x: 0.5, y: 1.7, w: 2.8, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center" });
  const primary = ["Rearrest rates", "Reconviction rates", "Reincarceration rates"];
  primary.forEach((item, i) => {
    slide.addText("\u2022  " + item, { x: 0.7, y: 2.2 + i * 0.5, w: 2.4, h: 0.4, fontSize: 13, color: COLORS.grayDark, fontFace: "Arial" });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.6, y: 1.2, w: 2.8, h: 4.0, fill: { color: COLORS.blueLight }, rectRadius: 0.15, line: { color: COLORS.blue, width: 2 } });
  slide.addText("Secondary Outcomes", { x: 3.6, y: 1.3, w: 2.8, h: 0.4, fontSize: 14, color: COLORS.blue, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("Measured at 6-month intervals", { x: 3.6, y: 1.7, w: 2.8, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center" });
  const secondary = ["Employment & income", "Housing stability", "Substance use treatment", "ER/crisis utilization", "Family reunification"];
  secondary.forEach((item, i) => {
    slide.addText("\u2022  " + item, { x: 3.8, y: 2.2 + i * 0.4, w: 2.4, h: 0.35, fontSize: 12, color: COLORS.grayDark, fontFace: "Arial" });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 6.7, y: 1.2, w: 2.8, h: 4.0, fill: { color: COLORS.emeraldLight }, rectRadius: 0.15, line: { color: COLORS.emerald, width: 2 } });
  slide.addText("Community Outcomes", { x: 6.7, y: 1.3, w: 2.8, h: 0.4, fontSize: 14, color: COLORS.emerald, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("ZIP code level analysis", { x: 6.7, y: 1.7, w: 2.8, h: 0.3, fontSize: 10, color: COLORS.gray, fontFace: "Arial", align: "center" });
  const community = ["Local crime rates", "Economic activity", "Service utilization", "Neighborhood stability"];
  community.forEach((item, i) => {
    slide.addText("\u2022  " + item, { x: 6.9, y: 2.2 + i * 0.45, w: 2.4, h: 0.4, fontSize: 12, color: COLORS.grayDark, fontFace: "Arial" });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 5.5, w: 9.0, h: 1.3, fill: { color: COLORS.grayLight }, rectRadius: 0.1 });
  slide.addText("42-MONTH TIMELINE", { x: 0.8, y: 5.6, w: 2.0, h: 0.4, fontSize: 12, color: COLORS.dark, fontFace: "Arial", bold: true });
  const phases = [
    { name: "Design & IRB", mo: "Mo 1-6", color: COLORS.gray },
    { name: "Enrollment", mo: "Mo 7-18", color: COLORS.blue },
    { name: "Follow-Up", mo: "Mo 19-36", color: COLORS.amber },
    { name: "Analysis", mo: "Mo 37-42", color: COLORS.emerald },
  ];
  phases.forEach((p, i) => {
    const x = 0.7 + i * 2.2;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 6.1, w: 2.0, h: 0.55, fill: { color: p.color }, rectRadius: 0.08 });
    slide.addText(p.name + " (" + p.mo + ")", { x, y: 6.1, w: 2.0, h: 0.55, fontSize: 10, color: COLORS.white, fontFace: "Arial", bold: true, align: "center" });
  });
}

function addSitesSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.05, fill: { color: COLORS.amber } });

  slide.addText("PILOT SITES & FUNDING STRATEGY", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 28, color: COLORS.dark, fontFace: "Arial", bold: true });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.1, w: 4.2, h: 2.8, fill: { color: COLORS.blueLight }, rectRadius: 0.15 });
  slide.addText("Travis County (Primary)", { x: 0.5, y: 1.2, w: 4.2, h: 0.4, fontSize: 16, color: COLORS.blue, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("4,200 annual TDCJ releases", { x: 0.5, y: 1.6, w: 4.2, h: 0.3, fontSize: 12, color: COLORS.grayDark, fontFace: "Arial", align: "center" });
  const travisPartners = ["Travis County Sheriff's Office", "Austin Transitional Center", "Goodwill Central Texas", "Integral Care", "Capital Area Workforce Solutions"];
  travisPartners.forEach((p, i) => {
    slide.addText("\u2022  " + p, { x: 0.8, y: 2.1 + i * 0.3, w: 3.7, h: 0.28, fontSize: 10, color: COLORS.grayDark, fontFace: "Arial" });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 5.3, y: 1.1, w: 4.2, h: 2.8, fill: { color: COLORS.amberLight }, rectRadius: 0.15 });
  slide.addText("Williamson County (Secondary)", { x: 5.3, y: 1.2, w: 4.2, h: 0.4, fontSize: 16, color: COLORS.amber, fontFace: "Arial", bold: true, align: "center" });
  slide.addText("1,100 annual TDCJ releases", { x: 5.3, y: 1.6, w: 4.2, h: 0.3, fontSize: 12, color: COLORS.grayDark, fontFace: "Arial", align: "center" });
  const willPartners = ["Williamson County Community Supervision", "Opportunities for Williamson & Burnet", "Growing suburban reentry population", "Rapid population growth = new service gaps"];
  willPartners.forEach((p, i) => {
    slide.addText("\u2022  " + p, { x: 5.6, y: 2.1 + i * 0.3, w: 3.7, h: 0.28, fontSize: 10, color: COLORS.grayDark, fontFace: "Arial" });
  });

  slide.addText("FUNDING STRATEGY", { x: 0.8, y: 4.2, w: 8.4, h: 0.4, fontSize: 16, color: COLORS.dark, fontFace: "Arial", bold: true });

  const funders = [
    { name: "Arnold Ventures", desc: "Criminal justice research, RCT studies", amt: "$250K-$2M", color: COLORS.blue },
    { name: "NIJ", desc: "Federal reentry research", amt: "$250K-$750K", color: COLORS.emerald },
    { name: "DOJ Second Chance Act", desc: "Federal reentry programming", amt: "Competitive", color: COLORS.amber },
    { name: "MacArthur Foundation", desc: "Safety & Justice Challenge", amt: "Systems change", color: COLORS.grayDark },
    { name: "TX Legislature (90th)", desc: "2027 session policy brief", amt: "Statute reform", color: COLORS.red },
  ];
  funders.forEach((f, i) => {
    const x = 0.5 + (i % 3) * 3.15;
    const y = i < 3 ? 4.75 : 5.85;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.95, h: 0.9, fill: { color: COLORS.grayLight }, rectRadius: 0.1 });
    slide.addText(f.name, { x: x + 0.15, y: y + 0.05, w: 2.65, h: 0.3, fontSize: 12, color: f.color, fontFace: "Arial", bold: true });
    slide.addText(f.desc + " | " + f.amt, { x: x + 0.15, y: y + 0.4, w: 2.65, h: 0.35, fontSize: 9, color: COLORS.gray, fontFace: "Arial" });
  });
}

function addWhyTCAFSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.05, fill: { color: COLORS.emerald } });

  slide.addText("WHY TCAF", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 28, color: COLORS.dark, fontFace: "Arial", bold: true });
  slide.addText("24-Platform AI Operating System for Communities -- Already Built and Running", { x: 0.8, y: 0.8, w: 8.4, h: 0.4, fontSize: 14, color: COLORS.gray, fontFace: "Arial" });

  const platforms = [
    { name: "RPLICE", desc: "Implementation science engine\nCFIR/RE-AIM frameworks\nFidelity measurement", icon: "R", color: COLORS.blue },
    { name: "Justice Command Center", desc: "Criminal justice data aggregation\nBJS, FBI UCR, TDCJ, local LE\nReentry case management", icon: "J", color: COLORS.red },
    { name: "Mission Transition", desc: "Career transition platform\nWorkforce pathway mapping\nVeteran & civilian reentry", icon: "M", color: COLORS.amber },
    { name: "Workforce Dashboard", desc: "Employment tracking\nSkills gap analysis\nLabor market integration", icon: "W", color: COLORS.emerald },
    { name: "LifeBridge", desc: "Benefits screening\nSNAP, Medicaid, CHIP\nWIC, EITC enrollment", icon: "L", color: COLORS.blue },
    { name: "ISSS", desc: "Integrated support coordination\nEarly warning systems\nMulti-stakeholder case mgmt", icon: "I", color: COLORS.grayDark },
  ];

  platforms.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.15;
    const y = 1.5 + row * 2.3;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.95, h: 2.0, fill: { color: COLORS.grayLight }, rectRadius: 0.15 });
    slide.addShape(pptx.shapes.OVAL, { x: x + 0.15, y: y + 0.15, w: 0.5, h: 0.5, fill: { color: p.color } });
    slide.addText(p.icon, { x: x + 0.15, y: y + 0.15, w: 0.5, h: 0.5, fontSize: 16, color: COLORS.white, fontFace: "Arial", bold: true, align: "center", valign: "middle" });
    slide.addText(p.name, { x: x + 0.75, y: y + 0.15, w: 2.05, h: 0.4, fontSize: 13, color: COLORS.dark, fontFace: "Arial", bold: true });
    slide.addText(p.desc, { x: x + 0.15, y: y + 0.75, w: 2.65, h: 1.1, fontSize: 10, color: COLORS.gray, fontFace: "Arial", lineSpacing: 15 });
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 6.3, w: 9.0, h: 0.5, fill: { color: COLORS.emeraldLight }, rectRadius: 0.08 });
  slide.addText("Every measurement tool, data pipeline, and coordination infrastructure already exists and is operational.", { x: 0.8, y: 6.3, w: 8.4, h: 0.5, fontSize: 12, color: COLORS.emerald, fontFace: "Arial", bold: true, align: "center" });
}

function addClosingSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.darkBg };
  slide.addShape(pptx.shapes.OVAL, { x: 7, y: -1, w: 5, h: 5, fill: { color: COLORS.emerald, transparency: 85 } });
  slide.addShape(pptx.shapes.OVAL, { x: -2, y: 4, w: 5, h: 5, fill: { color: COLORS.blue, transparency: 85 } });

  slide.addText("The question is not whether\nwe can afford this program.", { x: 0.8, y: 1.0, w: 8.4, h: 1.2, fontSize: 28, color: COLORS.white, fontFace: "Arial", bold: true, align: "center", lineSpacing: 36 });

  slide.addText("The question is whether\nwe can afford not to.", { x: 0.8, y: 2.5, w: 8.4, h: 1.2, fontSize: 28, color: COLORS.emerald, fontFace: "Arial", bold: true, align: "center", lineSpacing: 36 });

  slide.addShape(pptx.shapes.RECTANGLE, { x: 3.5, y: 3.9, w: 3.0, h: 0.02, fill: { color: "475569" } });

  slide.addText("Every person who cycles back costs Texas $75,000+.\nEvery person who successfully reintegrates becomes a\ntaxpayer, a parent, a neighbor, and a contributor.", { x: 0.8, y: 4.2, w: 8.4, h: 1.0, fontSize: 14, color: "94A3B8", fontFace: "Arial", align: "center", lineSpacing: 22 });

  slide.addText("The difference may be as simple as having enough\nmoney to survive the first 90 days.", { x: 0.8, y: 5.2, w: 8.4, h: 0.7, fontSize: 14, color: COLORS.white, fontFace: "Arial", align: "center", italic: true, lineSpacing: 22 });

  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 6.2, w: 10, h: 1.3, fill: { color: "0B1120" } });
  slide.addText("The Collaborative Advocate Foundation  |  EIN: 41-3618503", { x: 0.8, y: 6.3, w: 8.4, h: 0.35, fontSize: 12, color: COLORS.emerald, fontFace: "Arial", align: "center", bold: true });
  slide.addText("Dr. Terry Flood, DHA  |  mr.terryflood@gmail.com\n17912 Stefano Drive, Pflugerville, TX 78660", { x: 0.8, y: 6.7, w: 8.4, h: 0.5, fontSize: 11, color: "94A3B8", fontFace: "Arial", align: "center", lineSpacing: 16 });
}

addTitleSlide();
addProblemSlide();
addInterventionSlide();
addCostBenefitSlide();
addOutcomesSlide();
addSitesSlide();
addWhyTCAFSlide();
addClosingSlide();

pptx.writeFile({ fileName: "docs/grants/TX-Reentry-Stipend-Pilot-Presentation.pptx" })
  .then(() => console.log("PowerPoint generated successfully!"))
  .catch(err => console.error("Error:", err));
