import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Dr. Terry Flood";
pptx.company = "Integrated Services and Solutions LLC";
pptx.title = "ThriveUp Ecosystem — The Pitch by Deel 2026";

const DARK = "0D1117";
const CARD = "161B22";
const BLUE = "0079F2";
const TEAL = "00C9A7";
const W = "FFFFFF";
const G = "8B949E";
const GOLD = "F0B429";
const PINK = "E8459E";
const GRN = "2EA043";
const PURP = "8B5CF6";
const RED = "EF4444";
const ORG = "F97316";

function lbl(sl, t, c) { sl.addText(t, { x: 0.8, y: 0.4, w: 5, h: 0.42, fontSize: 13, fontFace: "Arial", bold: true, color: c }); }
function hdr(sl, t, y) { sl.addText(t, { x: 0.8, y: y || 0.85, w: 11.7, h: 1.15, fontSize: 33, fontFace: "Arial", bold: true, color: W, lineSpacingMultiple: 1.1 }); }

// ============================================================
// SLIDE 1: TITLE
// ============================================================
let s1 = pptx.addSlide(); s1.background = { color: DARK };
s1.addText("ThriveUp", {
  x: 0.8, y: 1.0, w: 11.7, h: 1.3,
  fontSize: 66, fontFace: "Arial", bold: true, color: W
});
s1.addText("A Living Ecosystem of Interconnected Platforms\nThat Sees the Whole Person — From Any Entry Point", {
  x: 0.8, y: 2.3, w: 11.7, h: 0.9,
  fontSize: 20, fontFace: "Arial", color: TEAL, lineSpacingMultiple: 1.25
});
s1.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.5, w: 4, h: 0.04, fill: { color: BLUE } });
s1.addText("Dr. Terry Flood, DHA, DBA  |  President", {
  x: 0.8, y: 3.8, w: 8, h: 0.4, fontSize: 19, fontFace: "Arial", bold: true, color: W
});
s1.addText("Integrated Services and Solutions LLC", {
  x: 0.8, y: 4.2, w: 8, h: 0.35, fontSize: 15, fontFace: "Arial", color: G
});
s1.addText("U.S. Army Veteran  •  5× Master's  •  Implementation Science (Dartmouth)  •  25 Years Direct Service", {
  x: 0.8, y: 4.7, w: 10, h: 0.35, fontSize: 12, fontFace: "Arial", color: G
});
const pills = [
  { t: "Criminal Justice", c: RED }, { t: "Health Equity", c: PINK }, { t: "Workforce", c: BLUE },
  { t: "Education", c: GOLD }, { t: "Veterans", c: GRN }, { t: "Community", c: TEAL },
];
pills.forEach((p, i) => {
  s1.addShape(pptx.ShapeType.roundRect, { x: 0.5 + (i * 2.1), y: 5.8, w: 1.95, h: 0.4, fill: { color: CARD }, line: { color: p.c, width: 1.5 }, rectRadius: 0.15 });
  s1.addText(p.t, { x: 0.5 + (i * 2.1), y: 5.8, w: 1.95, h: 0.4, fontSize: 10, fontFace: "Arial", bold: true, color: p.c, align: "center", valign: "middle" });
});
s1.addText("The Pitch by Deel  |  New York  |  May 2026", { x: 0.8, y: 6.7, w: 6, h: 0.3, fontSize: 11, fontFace: "Arial", italic: true, color: G });

// ============================================================
// SLIDE 2: THE PROBLEM
// ============================================================
let s2 = pptx.addSlide(); s2.background = { color: DARK };
lbl(s2, "The Problem", RED);
hdr(s2, "$180 Billion Spent. Systems That\nDon't Talk. People Who Die in the Gaps.");
s2.addText("Every agency, school, clinic, and workforce board runs its own silo. A person with co-occurring needs — and they ALWAYS have co-occurring needs — gets sent to disconnected agencies that will never speak to each other. The cracks between systems are where people fall.", {
  x: 0.8, y: 2.1, w: 11.5, h: 0.75,
  fontSize: 14, fontFace: "Arial", color: G, lineSpacingMultiple: 1.35
});

const probs = [
  { s: "67%", l: "of returning citizens\nre-arrested within 3 years", c: RED },
  { s: "3×", l: "higher maternal mortality\nfor Black women", c: PINK },
  { s: "44%", l: "of veterans underemployed\nafter separation", c: GRN },
  { s: "1.2M", l: "students drop out\nof high school yearly", c: GOLD },
  { s: "8+", l: "disconnected systems\nper person in need", c: BLUE },
  { s: "$0", l: "spent on connecting\nthose systems together", c: TEAL },
];
probs.forEach((p, i) => {
  const col = i % 3; const row = Math.floor(i / 3);
  const x = 0.5 + (col * 4.15); const y = 3.2 + (row * 2.1);
  s2.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.95, h: 1.85, fill: { color: CARD }, line: { color: p.c, width: 1.5 }, rectRadius: 0.1 });
  s2.addText(p.s, { x, y: y + 0.05, w: 3.95, h: 0.75, fontSize: 36, fontFace: "Arial", bold: true, color: p.c, align: "center" });
  s2.addText(p.l, { x: x + 0.2, y: y + 0.85, w: 3.55, h: 0.7, fontSize: 12, fontFace: "Arial", color: G, align: "center", lineSpacingMultiple: 1.2 });
});

// ============================================================
// SLIDE 3: THE ECOSYSTEM MAP
// ============================================================
let s3 = pptx.addSlide(); s3.background = { color: DARK };
lbl(s3, "The Solution", TEAL);
hdr(s3, "One Ecosystem. Six Domains.\n24 Platforms That Hold Each Other Accountable.");
s3.addText("Each platform sees the others. Each platform can flag gaps, escalate needs, and trigger services across domains. Communities enter where their need is greatest — and discover every resource connected to it.", {
  x: 0.8, y: 2.05, w: 11.5, h: 0.55,
  fontSize: 13, fontFace: "Arial", color: G, lineSpacingMultiple: 1.35
});

const domains = [
  { name: "CRIMINAL JUSTICE\n& SAFETY", c: RED, items: ["LifeBridge (Reentry)", "SafeReport (Mandated Reporting)", "Shield Atlas (Emergency Mgmt)", "ISSS (Youth Supports)"] },
  { name: "HEALTH\nEQUITY", c: PINK, items: ["Black Maternal Health Network", "Sankofa Health (Breast Cancer)", "Autoimmune CoE", "Black Men's Health Hub"] },
  { name: "BEHAVIORAL\nHEALTH", c: PURP, items: ["Whole-Person Health Ecosystem", "SafeCogniCare (Cognitive)", "PillScheduler (Medication)", "WholeMind Learning (Literacy)"] },
  { name: "WORKFORCE &\nBUSINESS", c: BLUE, items: ["Mission Transition (Veterans)", "Pinnacle Business Conglomerate", "Ecosystem Nexus (Careers)", "Minority Center of Excellence"] },
  { name: "EDUCATION &\nLEARNING", c: GOLD, items: ["ThriveUp (K-12+Adult)", "Better Science Lab / RPLICE", "Perfectly Different (SpEd)", "LexiBridge (Multilingual)"] },
  { name: "COMMUNITY &\nADVOCACY", c: TEAL, items: ["The Collaborative Advocate", "Holistic Black Feminine Health", "Advertising / Outreach", "Video Creator AI"] },
];

s3.addShape(pptx.ShapeType.ellipse, { x: 5.2, y: 4.55, w: 2.9, h: 1.2, fill: { color: CARD }, line: { color: TEAL, width: 2 } });
s3.addText("AI Intelligence\nLayer\n4 Engines", { x: 5.2, y: 4.55, w: 2.9, h: 1.2, fontSize: 11, fontFace: "Arial", bold: true, color: TEAL, align: "center", valign: "middle", lineSpacingMultiple: 1.15 });

const pos = [ { x: 0.25, y: 2.8 }, { x: 4.55, y: 2.8 }, { x: 8.85, y: 2.8 }, { x: 0.25, y: 5.85 }, { x: 4.55, y: 5.85 }, { x: 8.85, y: 5.85 } ];
domains.forEach((d, i) => {
  const p = pos[i];
  s3.addShape(pptx.ShapeType.roundRect, { x: p.x, y: p.y, w: 4.1, h: 2.75, fill: { color: CARD }, line: { color: d.c, width: 1.5 }, rectRadius: 0.08 });
  s3.addText(d.name, { x: p.x, y: p.y + 0.02, w: 4.1, h: 0.6, fontSize: 11, fontFace: "Arial", bold: true, color: d.c, align: "center", valign: "middle" });
  s3.addShape(pptx.ShapeType.rect, { x: p.x + 0.35, y: p.y + 0.63, w: 3.4, h: 0.02, fill: { color: d.c } });
  d.items.forEach((item, j) => {
    s3.addText("•  " + item, { x: p.x + 0.12, y: p.y + 0.7 + (j * 0.42), w: 3.85, h: 0.4, fontSize: 10.5, fontFace: "Arial", color: G, valign: "middle" });
  });
});

// ============================================================
// SLIDE 4: MEET KEISHA — Now with 7 needs (pregnancy during cancer)
// ============================================================
let s4 = pptx.addSlide(); s4.background = { color: DARK };
lbl(s4, "One Person. The Whole Ecosystem.", PINK);
s4.addText("Meet Keisha.", {
  x: 0.8, y: 0.85, w: 11.7, h: 0.7,
  fontSize: 40, fontFace: "Arial", bold: true, color: W
});
s4.addText("She's a veteran. A mother. She's battling breast cancer — and just found out she's pregnant.\nShe has depression. She runs a small nonprofit. She needs community resources. She is every woman.", {
  x: 0.8, y: 1.55, w: 11.7, h: 0.7,
  fontSize: 15, fontFace: "Arial", italic: true, color: TEAL, lineSpacingMultiple: 1.3
});

s4.addText("In the current system, Keisha navigates 8+ disconnected agencies, tells her story 8 times, and prays someone connects the dots. Her oncologist doesn't know she's pregnant. Her OB doesn't know she has cancer. Nobody coordinates. In ThriveUp — she walks through any door and every platform responds:", {
  x: 0.8, y: 2.35, w: 11.5, h: 0.7,
  fontSize: 12, fontFace: "Arial", color: G, lineSpacingMultiple: 1.35
});

const keishaNeeds = [
  { need: "She's a veteran.", platform: "Mission Transition", what: "Skills translation, credentialing, employer matching, career tracking — her service becomes opportunity.", color: GRN, icon: "★" },
  { need: "She has breast cancer.", platform: "Sankofa Health", what: "Screening navigation, genetic counseling, survivor support. Connected to her OB, her mental health, her medication management.", color: PURP, icon: "♥" },
  { need: "She's pregnant.", platform: "Black Maternal Health", what: "High-risk pregnancy protocol activates. AI flags the cancer treatment overlap. Her oncologist and OB are in the same ecosystem — they SEE each other.", color: PINK, icon: "●" },
  { need: "She has depression.", platform: "Whole-Person Health", what: "Culturally matched counselor. PillScheduler coordinates with BOTH oncology and prenatal meds. SafeCogniCare monitors chemo brain.", color: BLUE, icon: "◆" },
  { need: "She runs a nonprofit.", platform: "Minority Center of Excellence", what: "SAM.gov, capability statements, contracting. Pinnacle helps with business continuity during her medical crisis.", color: GOLD, icon: "▲" },
  { need: "She needs resources.", platform: "Collaborative Advocate", what: "Legal aid, benefits, housing, childcare, transportation to appointments. LexiBridge if language is a barrier.", color: TEAL, icon: "■" },
];

keishaNeeds.forEach((k, i) => {
  const col = i % 3; const row = Math.floor(i / 3);
  const x = 0.3 + (col * 4.25); const y = 3.25 + (row * 2.15);
  s4.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.05, h: 1.95, fill: { color: CARD }, line: { color: k.color, width: 1.5 }, rectRadius: 0.08 });
  s4.addText(k.need, { x: x + 0.1, y: y + 0.03, w: 2.1, h: 0.35, fontSize: 12, fontFace: "Arial", bold: true, color: k.color });
  s4.addText(k.platform, { x: x + 2.1, y: y + 0.03, w: 1.85, h: 0.35, fontSize: 11, fontFace: "Arial", bold: true, color: W, align: "right" });
  s4.addShape(pptx.ShapeType.rect, { x: x + 0.15, y: y + 0.4, w: 3.75, h: 0.02, fill: { color: k.color } });
  s4.addText(k.what, { x: x + 0.1, y: y + 0.5, w: 3.85, h: 1.3, fontSize: 10, fontFace: "Arial", color: G, lineSpacingMultiple: 1.3 });
});

// ============================================================
// SLIDE 5: THE COLLISION — Pregnant + Cancer
// ============================================================
let s5 = pptx.addSlide(); s5.background = { color: DARK };
s5.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: PINK } });
lbl(s5, "When Domains Collide", PINK);
hdr(s5, "Pregnant During Cancer Treatment.\nThis Is Where Systems Kill People.");

s5.addText("This is the moment that proves why the ecosystem exists. Keisha is mid-treatment for breast cancer when she discovers she's pregnant. In the current system, her oncologist and her OB-GYN are in different networks, different EHRs, different worlds. They don't talk. Treatment decisions that affect TWO lives are made in isolation.\n\nIn ThriveUp, those platforms are already connected:", {
  x: 0.8, y: 2.05, w: 11.5, h: 1.0,
  fontSize: 13, fontFace: "Arial", color: G, lineSpacingMultiple: 1.4
});

const collision = [
  { domain: "Sankofa + Maternal Health", title: "Cancer ↔ Pregnancy", what: "The moment the pregnancy is confirmed, Sankofa Health alerts the Black Maternal Health Network. Both platforms see the full picture: treatment protocol, gestational age, risk factors. The oncologist and OB are working from the SAME record — not separate charts that never cross.", color: PINK },
  { domain: "Behavioral Health", title: "Mental Health Crisis", what: "A breast cancer diagnosis is devastating. A high-risk pregnancy on top of it is a mental health emergency. Whole-Person Health auto-escalates her care level. Her counselor is notified. PillScheduler flags every medication for pregnancy safety — her antidepressants, her chemo drugs, everything.", color: PURP },
  { domain: "Workforce + Business", title: "Income at Risk", what: "She can't work full-time through cancer treatment AND a high-risk pregnancy. Her workforce platform shifts her job profile. Her nonprofit gets emergency continuity support through Minority Center of Excellence. Benefits enrollment through Collaborative Advocate activates FMLA, disability, WIC.", color: BLUE },
  { domain: "Education + Family", title: "Her Other Children", what: "Her existing kids' school is notified (with consent) that the family is in medical crisis. ThriveUp monitors their grades for drops. Perfectly Different checks for emotional/behavioral changes. ISSS provides youth support. The ecosystem protects the WHOLE family.", color: GOLD },
  { domain: "Community Navigation", title: "Everything Else", what: "Transportation to appointments — she now has TWICE as many. Childcare during treatment. Nutritional support for pregnancy during chemo. Housing stability. Legal protections. Collaborative Advocate coordinates all of it in one record.", color: TEAL },
  { domain: "AI Intelligence Layer", title: "No Human Can Do This", what: "Cancer treatment protocol + pregnancy risk + depression severity + job loss + children's grades + housing stability + medication interactions. The AI sees ALL of it across ALL domains in real time. It alerts the right people before crisis — because no human case manager can track this many variables across this many systems.", color: ORG },
];

collision.forEach((c, i) => {
  const col = i % 3; const row = Math.floor(i / 3);
  const x = 0.3 + (col * 4.25); const y = 3.2 + (row * 2.2);
  s5.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.05, h: 2.0, fill: { color: CARD }, line: { color: c.color, width: 1.5 }, rectRadius: 0.08 });
  s5.addText(c.domain, { x: x + 0.1, y: y + 0.02, w: 2.3, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: c.color });
  s5.addText(c.title, { x: x + 2.4, y: y + 0.02, w: 1.55, h: 0.3, fontSize: 10, fontFace: "Arial", bold: true, color: W, align: "right" });
  s5.addShape(pptx.ShapeType.rect, { x: x + 0.15, y: y + 0.35, w: 3.75, h: 0.02, fill: { color: c.color } });
  s5.addText(c.what, { x: x + 0.1, y: y + 0.42, w: 3.85, h: 1.45, fontSize: 9.5, fontFace: "Arial", color: G, lineSpacingMultiple: 1.3 });
});

// ============================================================
// SLIDE 6: MARCUS — Her brother comes home
// ============================================================
let s6 = pptx.addSlide(); s6.background = { color: DARK };
s6.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: RED } });
lbl(s6, "The Ecosystem in Action: Criminal Justice", RED);
hdr(s6, "Then Her Brother Marcus\nComes Home From Prison.");

s6.addText("Same family. Same ecosystem. Marcus is released after 4 years. He also served in the military. In the current system, he'd get a bus ticket. In ThriveUp, his sister's family file means every platform already knows he's coming:", {
  x: 0.8, y: 2.05, w: 11.5, h: 0.55,
  fontSize: 13, fontFace: "Arial", italic: true, color: G, lineSpacingMultiple: 1.3
});

const steps = [
  { t: "Day 1", p: "LifeBridge", d: "Reentry profile. One record connected to every platform. Keisha's family file already exists — Marcus joins it. Housing, health, employment assessed in one intake.", c: RED },
  { t: "Week 1", p: "Mission Transition", d: "Marcus served too. His military + prison work skills are mapped. AI matches him to 3 employers. If he needs training, ThriveUp activates.", c: BLUE },
  { t: "Week 2", p: "Whole-Person Health", d: "Behavioral health screening. Substance abuse history flagged. Matched to a provider who understands BOTH reentry AND veteran experience.", c: PURP },
  { t: "Week 3", p: "SafeReport + ISSS", d: "If he has children — family reunification protocol. Mandated reporting compliance. Youth supports for his kids. Connected to Keisha's kids' records.", c: GOLD },
  { t: "Month 2", p: "Collaborative Advocate", d: "Legal aid. Record expungement. Benefits. All in the same system his sister uses — the family is connected, not siloed.", c: TEAL },
  { t: "Month 6+", p: "AI Early Warning", d: "If anything destabilizes — job, health, housing — the team is alerted before crisis. The ecosystem learned from Keisha's journey. It protects Marcus too.", c: ORG },
];

steps.forEach((s, i) => {
  const col = i % 3; const row = Math.floor(i / 3);
  const x = 0.3 + (col * 4.25); const y = 2.85 + (row * 2.2);
  s6.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.05, h: 2.0, fill: { color: CARD }, line: { color: s.c, width: 1 }, rectRadius: 0.08 });
  s6.addText(s.t, { x: x + 0.1, y: y + 0.03, w: 1.1, h: 0.3, fontSize: 11, fontFace: "Arial", bold: true, color: s.c });
  s6.addText(s.p, { x: x + 1.2, y: y + 0.03, w: 2.75, h: 0.3, fontSize: 11, fontFace: "Arial", bold: true, color: W, align: "right" });
  s6.addShape(pptx.ShapeType.rect, { x: x + 0.15, y: y + 0.36, w: 3.75, h: 0.02, fill: { color: s.c } });
  s6.addText(s.d, { x: x + 0.1, y: y + 0.45, w: 3.85, h: 1.4, fontSize: 10, fontFace: "Arial", color: G, lineSpacingMultiple: 1.3 });
});

// ============================================================
// SLIDE 7: AI INTELLIGENCE LAYER
// ============================================================
let s7 = pptx.addSlide(); s7.background = { color: DARK };
lbl(s7, "The Intelligence Layer", GOLD);
hdr(s7, "AI That Sees Across All 24 Platforms —\nBecause No Human Can Connect These Dots");

s7.addText("Keisha has needs across 6 domains simultaneously. Her unborn child adds another layer. Marcus has needs across 5. Their children across 3. No case manager can track all of that. The AI can — because it sees every platform, every record, every signal, in real time.", {
  x: 0.8, y: 2.05, w: 11.5, h: 0.55,
  fontSize: 13, fontFace: "Arial", color: G, lineSpacingMultiple: 1.35
});

const ai = [
  { title: "Predictive Risk\nDetection", ex: "Keisha's chemo protocol changes + pregnancy confirmed + depression screening worsens = immediate multi-provider alert. Her oncologist, OB, counselor, and case manager all see it. BEFORE anyone falls through the cracks.", color: PINK },
  { title: "Cross-Domain\nEarly Warning", ex: "Marcus's daughter's attendance drops → system checks family file → sees his recent release + Keisha's medical crisis → flags school counselor, youth services, AND family support. One signal, four platforms respond.", color: GOLD },
  { title: "Platform\nAccountability", ex: "Keisha was referred to a prenatal specialist 5 days ago. No appointment scheduled. The AI flags the gap. The maternal health platform escalates. No referral sits in a fax machine. Platforms hold each other accountable.", color: TEAL },
  { title: "Multi-Engine\nConsensus", ex: "4 AI models (GPT-4o, Claude, Gemini, DeepSeek) process critical decisions together — medication safety during pregnancy + chemo, risk scoring, care recommendations. No single model decides alone. Consensus-verified.", color: BLUE },
];

ai.forEach((a, i) => {
  const col = i % 2; const row = Math.floor(i / 2);
  const x = 0.4 + (col * 6.3); const y = 2.8 + (row * 2.25);
  s7.addShape(pptx.ShapeType.roundRect, { x, y, w: 6.1, h: 2.0, fill: { color: CARD }, line: { color: a.color, width: 1.5 }, rectRadius: 0.1 });
  s7.addText(a.title, { x: x + 0.15, y: y + 0.1, w: 2.0, h: 0.8, fontSize: 14, fontFace: "Arial", bold: true, color: a.color, valign: "middle" });
  s7.addText(a.ex, { x: x + 2.15, y: y + 0.1, w: 3.75, h: 1.75, fontSize: 10.5, fontFace: "Arial", color: G, lineSpacingMultiple: 1.3, valign: "middle" });
});

// ============================================================
// SLIDE 8: BUSINESS MODEL
// ============================================================
let s8 = pptx.addSlide(); s8.background = { color: DARK };
lbl(s8, "Business Model", BLUE);
hdr(s8, "Communities Enter Where Their Gap Is.\nThe Ecosystem Grows With Them.");

s8.addText("A school district starts with Education + Behavioral Health. A reentry program starts with LifeBridge + Workforce. A health center starts with Maternal Health + Cancer Navigation. Then they see what's connected — and they expand. Every expansion is recurring revenue.", {
  x: 0.8, y: 2.05, w: 11.5, h: 0.7,
  fontSize: 13, fontFace: "Arial", color: G, lineSpacingMultiple: 1.35
});

const tiers = [
  { name: "Entry Point", sub: "1-3 Platforms", desc: "Start where the gap is greatest.\nProve value. Build trust.", ex: "School district: Education + Behavioral Health\nReentry org: LifeBridge + Workforce\nHealth center: Maternal + Cancer Nav", color: BLUE },
  { name: "Expansion", sub: "5-10 Platforms", desc: "Community sees connections.\nAdds domains organically.", ex: "School adds SafeReport + Family Services\nReentry adds Health + Education\nHealth adds Workforce + Mental Health", color: TEAL },
  { name: "Full Ecosystem", sub: "All 24 Platforms", desc: "Complete community OS.\nEvery person, every need.", ex: "Community action agency deploys everything.\nOne architecture. One record. Whole person.\nMaximum impact. Maximum recurring revenue.", color: GOLD },
];

tiers.forEach((t, i) => {
  const x = 0.7 + (i * 4.1);
  s8.addShape(pptx.ShapeType.roundRect, { x, y: 3.0, w: 3.85, h: 3.6, fill: { color: CARD }, line: { color: t.color, width: 2 }, rectRadius: 0.12 });
  s8.addText(t.name, { x, y: 3.05, w: 3.85, h: 0.45, fontSize: 18, fontFace: "Arial", bold: true, color: t.color, align: "center" });
  s8.addText(t.sub, { x, y: 3.45, w: 3.85, h: 0.3, fontSize: 12, fontFace: "Arial", color: W, align: "center" });
  s8.addShape(pptx.ShapeType.rect, { x: x + 0.35, y: 3.8, w: 3.15, h: 0.02, fill: { color: t.color } });
  s8.addText(t.desc, { x: x + 0.2, y: 3.9, w: 3.45, h: 0.7, fontSize: 11, fontFace: "Arial", color: G, align: "center", lineSpacingMultiple: 1.25 });
  s8.addText(t.ex, { x: x + 0.15, y: 4.7, w: 3.55, h: 1.6, fontSize: 10, fontFace: "Arial", italic: true, color: G, lineSpacingMultiple: 1.3 });
});

s8.addText("Revenue: SaaS licensing (monthly/annual recurring)  •  Aligned to federal funding: WIOA • ESSA • SAMHSA • HRSA • DOL • DOJ • HHS", {
  x: 0.8, y: 6.8, w: 11.7, h: 0.35, fontSize: 11, fontFace: "Arial", color: BLUE, align: "center"
});

// ============================================================
// SLIDE 9: MARKET + TRACTION
// ============================================================
let s9 = pptx.addSlide(); s9.background = { color: DARK };
lbl(s9, "Market & Traction", TEAL);
hdr(s9, "Every Underserved Community\nis a Customer. We're Already Live.");

s9.addText("TOTAL ADDRESSABLE MARKET", { x: 0.5, y: 2.1, w: 5, h: 0.35, fontSize: 12, fontFace: "Arial", bold: true, color: TEAL });
const mkts = [
  { n: "40,000+", l: "Community Action Agencies", c: BLUE },
  { n: "13,000+", l: "School Districts", c: GOLD },
  { n: "4,700+", l: "Correctional Facilities", c: RED },
  { n: "3,000+", l: "Community Health Centers", c: PINK },
  { n: "550+", l: "Workforce Development Boards", c: GRN },
  { n: "32,000+", l: "Behavioral Health Providers", c: PURP },
];
mkts.forEach((m, i) => {
  s9.addText(m.n, { x: 0.5, y: 2.55 + (i * 0.6), w: 1.6, h: 0.5, fontSize: 19, fontFace: "Arial", bold: true, color: m.c, align: "right", valign: "middle" });
  s9.addText(m.l, { x: 2.2, y: 2.55 + (i * 0.6), w: 3.8, h: 0.5, fontSize: 13, fontFace: "Arial", color: W, valign: "middle" });
});
s9.addText("$180B+ US social services market", { x: 0.5, y: 6.3, w: 5, h: 0.3, fontSize: 11, fontFace: "Arial", italic: true, color: G });

s9.addShape(pptx.ShapeType.roundRect, { x: 6.5, y: 2.1, w: 6.3, h: 5.0, fill: { color: CARD }, line: { color: TEAL, width: 1.5 }, rectRadius: 0.12 });
s9.addText("TRACTION — TODAY", { x: 6.5, y: 2.15, w: 6.3, h: 0.45, fontSize: 14, fontFace: "Arial", bold: true, color: TEAL, align: "center" });
const trac = [
  { l: "Interconnected Platforms Live", v: "24 / 24", c: TEAL },
  { l: "Domains Covered", v: "6", c: BLUE },
  { l: "First Customer Active", v: "TCAF (501c3)", c: GRN },
  { l: "AI Engines Running", v: "4 (cross-checking)", c: GOLD },
  { l: "TEKS Curriculum Coverage", v: "100%", c: GOLD },
  { l: "", v: "", c: G },
  { l: "TWC Pipeline", v: "$1.6M", c: GOLD },
  { l: "DOL RESTART", v: "$5.1M (In Progress)", c: GOLD },
  { l: "Google.org", v: "Applied", c: G },
  { l: "Gates Foundation", v: "Applied", c: G },
  { l: "NSF", v: "Applied", c: G },
];
trac.forEach((t, i) => {
  if (!t.l) { s9.addShape(pptx.ShapeType.rect, { x: 6.8, y: 2.7 + (i * 0.39), w: 5.7, h: 0.02, fill: { color: G } }); return; }
  s9.addText(t.l, { x: 6.8, y: 2.7 + (i * 0.39), w: 3.5, h: 0.36, fontSize: 10.5, fontFace: "Arial", color: G, valign: "middle" });
  s9.addText(t.v, { x: 10.3, y: 2.7 + (i * 0.39), w: 2.3, h: 0.36, fontSize: 10.5, fontFace: "Arial", bold: true, color: t.c, align: "right", valign: "middle" });
});

// ============================================================
// SLIDE 10: THE ASK
// ============================================================
let s10 = pptx.addSlide(); s10.background = { color: DARK };
lbl(s10, "The Ask", GOLD);
s10.addText("$1,000,000", { x: 0.8, y: 0.65, w: 11.7, h: 0.95, fontSize: 58, fontFace: "Arial", bold: true, color: GOLD, align: "center" });
s10.addText("SAFE Investment  •  Integrated Services and Solutions LLC", { x: 0.8, y: 1.5, w: 11.7, h: 0.3, fontSize: 14, fontFace: "Arial", color: G, align: "center" });

const funds = [
  { pct: "40%", use: "5 New Communities", desc: "Scale from Central Texas\nto 5 communities in 12 months", color: BLUE },
  { pct: "35%", use: "Sales & Success", desc: "Onboard communities.\nExpand platform adoption.", color: TEAL },
  { pct: "25%", use: "Product & Infra", desc: "Platform hardening.\nCompliance. Scale.", color: GOLD },
];
funds.forEach((f, i) => {
  const x = 0.8 + (i * 4);
  s10.addShape(pptx.ShapeType.roundRect, { x, y: 2.0, w: 3.7, h: 1.5, fill: { color: CARD }, line: { color: f.color, width: 2 }, rectRadius: 0.1 });
  s10.addText(f.pct, { x, y: 2.05, w: 3.7, h: 0.45, fontSize: 22, fontFace: "Arial", bold: true, color: f.color, align: "center" });
  s10.addText(f.use, { x, y: 2.45, w: 3.7, h: 0.35, fontSize: 13, fontFace: "Arial", bold: true, color: W, align: "center" });
  s10.addText(f.desc, { x: x + 0.3, y: 2.85, w: 3.1, h: 0.5, fontSize: 10, fontFace: "Arial", color: G, align: "center", lineSpacingMultiple: 1.2 });
});

s10.addShape(pptx.ShapeType.roundRect, { x: 2.5, y: 3.75, w: 8.3, h: 0.5, fill: { color: CARD }, line: { color: GOLD, width: 1 }, rectRadius: 0.1 });
s10.addText("12-Month Target:   $2M ARR   •   5 Communities   •   50+ Organizations Licensed", { x: 2.5, y: 3.75, w: 8.3, h: 0.5, fontSize: 13, fontFace: "Arial", bold: true, color: GOLD, align: "center", valign: "middle" });

s10.addShape(pptx.ShapeType.rect, { x: 0.8, y: 4.5, w: 11.7, h: 0.03, fill: { color: BLUE } });
s10.addText("Dr. Terry Flood, DHA, DBA  —  President", { x: 0.8, y: 4.65, w: 8, h: 0.35, fontSize: 16, fontFace: "Arial", bold: true, color: W });
s10.addText("U.S. Army Veteran  •  DHA  •  DBA  •  MS Criminal Justice  •  MS I/O Psychology  •  MS HRM\nImplementation Science (Dartmouth)  •  VA Crisis Line  •  25 Years Direct Service  •  Black-led, Veteran-founded", {
  x: 0.8, y: 5.0, w: 10, h: 0.5, fontSize: 10, fontFace: "Arial", color: G, lineSpacingMultiple: 1.3
});

s10.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 5.65, w: 11.7, h: 1.85, fill: { color: CARD }, line: { color: TEAL, width: 2 }, rectRadius: 0.12 });
s10.addText("Keisha is not hypothetical. She is every woman in every underserved community in America.\n\nShe is a veteran and a mother and a cancer patient and pregnant and a person with depression\nand a business owner — all at the same time.\n\nHer oncologist doesn't talk to her OB. Her OB doesn't talk to her employer. Her employer doesn't\ntalk to her children's school. The current system treats each of those as separate problems.\n\nThriveUp treats her as one person. Because she is.", {
  x: 1.1, y: 5.7, w: 11.1, h: 1.4,
  fontSize: 11, fontFace: "Arial", italic: true, color: G, lineSpacingMultiple: 1.25, align: "center"
});
s10.addText("Walk through any door. Get help in every room.", {
  x: 1.1, y: 7.1, w: 11.1, h: 0.35,
  fontSize: 16, fontFace: "Arial", bold: true, color: TEAL, align: "center"
});

await pptx.writeFile({ fileName: "/home/runner/workspace/docs/pitches/ThriveUp-The-Pitch-by-Deel-2026.pptx" });
console.log("V6 deck saved — Keisha pregnant during cancer. Slides:", pptx.slides.length);
