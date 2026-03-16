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

const pptx = new PptxGenJS();
pptx.author = "ThriveUp Academy";
pptx.title = "ThriveUp Academy - Stakeholder Presentation";
pptx.subject = "AI-Powered Workforce Development & Community Enablement";
pptx.layout = "LAYOUT_WIDE";

function addSlide({ bg, title, speakerNotes, buildFn }) {
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

// Slide 1: Title
addSlide({
  bg: { color: MAROON },
  speakerNotes: "Welcome to the ThriveUp Academy stakeholder presentation. This platform is an AI-powered workforce development and community enablement platform serving under-resourced communities of all ages, focused on AI mastery, career pipelines, and reentry support. Our tagline captures our mission: teaching the first generation to guide their smartest classmate.",
  buildFn: (slide) => {
    slide.addText("ThriveUp Academy", { x: 0.8, y: 1.5, w: 11.5, h: 1.5, fontSize: 44, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
    slide.addText("AI-Powered Workforce Development & Community Enablement", { x: 0.8, y: 3.0, w: 11.5, h: 0.8, fontSize: 22, fontFace: "Arial", color: "D0D0D0", align: "center" });
    slide.addText([
      { text: "All Ages", options: { fontSize: 14, color: "E8E8E8" } },
      { text: "    |    ", options: { fontSize: 14, color: "999999" } },
      { text: "Workforce Development", options: { fontSize: 14, color: "E8E8E8" } },
      { text: "    |    ", options: { fontSize: 14, color: "999999" } },
      { text: "AI-Powered Learning", options: { fontSize: 14, color: "E8E8E8" } },
    ], { x: 0.8, y: 4.2, w: 11.5, h: 0.5, align: "center" });
    slide.addText("Teaching the first generation to guide their smartest classmate", { x: 0.8, y: 5.8, w: 11.5, h: 0.5, fontSize: 14, fontFace: "Arial", color: "AAAAAA", align: "center", italic: true });
  },
});

// Slide 2: Mission
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Our mission is empowering under-resourced communities of all ages with AI literacy, workforce readiness, and career pipelines. We focus on three pillars: AI literacy as the new foundation for every career, direct pipelines from learning to career placement, and whole-person support through mentorship and community resources.",
  buildFn: (slide) => {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.5, h: 7.5, fill: { color: MAROON } });
    slide.addText("Our\nMission", { x: 0.5, y: 2.0, w: 3.5, h: 2.0, fontSize: 40, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("Empowering under-resourced communities with AI mastery, workforce readiness, and career pipelines for all ages.", { x: 5.0, y: 1.0, w: 7.5, h: 1.2, fontSize: 20, fontFace: "Arial", color: DARK_TEXT });
    const items = [
      "AI literacy as the new foundation for career success",
      "Direct pipelines from learning to career placement",
      "Whole-person support through mentorship and community",
    ];
    items.forEach((item, i) => {
      slide.addText(`\u2713  ${item}`, { x: 5.0, y: 2.8 + i * 1.0, w: 7.5, h: 0.7, fontSize: 16, fontFace: "Arial", color: BODY_TEXT });
    });
  },
});

// Slide 3: The Challenge
addSlide({
  bg: DARK_BG,
  speakerNotes: "The challenge is significant. 67% of low-income students lack career readiness programs. Without workforce training, they are 3x more likely to face unemployment. And 82% of future jobs will require digital and AI literacy. These compounding barriers create a cycle that our platform is designed to break.",
  buildFn: (slide) => {
    slide.addText("THE CHALLENGE", { x: 0.8, y: 0.5, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 4 });
    slide.addText("Under-resourced communities face\ncompounding barriers", { x: 0.8, y: 1.0, w: 11, h: 1.5, fontSize: 32, fontFace: "Arial", color: WHITE, bold: true });
    const stats = [
      { stat: "67%", label: "of low-income students lack access\nto career readiness programs" },
      { stat: "3x", label: "more likely to face unemployment\nwithout workforce training" },
      { stat: "82%", label: "of future jobs will require digital\nand AI literacy skills" },
    ];
    stats.forEach((s, i) => {
      const x = 0.8 + i * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 3.0, w: 3.6, h: 3.5, fill: { color: "2A2025" }, rectRadius: 0.15, line: { color: "3A3035", width: 1 } });
      slide.addText(s.stat, { x, y: 3.2, w: 3.6, h: 1.2, fontSize: 44, fontFace: "Arial", color: SILVER_TEXT, bold: true, align: "center" });
      slide.addText(s.label, { x: x + 0.3, y: 4.5, w: 3.0, h: 1.5, fontSize: 13, fontFace: "Arial", color: "D0D0D0", align: "center" });
    });
  },
});

// Slide 4: Our Solution
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Our solution is a complete ecosystem, not just a course. It includes a 5-level AI curriculum, 55 career pathways across 12 industries, an AI Creation Studio with 10 professional tools, and a growing mentor network.",
  buildFn: (slide) => {
    slide.addText("OUR SOLUTION", { x: 0.8, y: 0.5, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("A complete ecosystem, not just a course", { x: 0.8, y: 1.0, w: 11, h: 1.0, fontSize: 30, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const items = [
      { title: "5-Level AI Curriculum", desc: "From Explorer to Master with module-gated progression" },
      { title: "55 Career Pathways", desc: "Structured pipelines across 12 industries" },
      { title: "AI Creation Studio", desc: "10 professional tools earned through mastery" },
      { title: "Mentor Network", desc: "Professional coaching for career advancement" },
    ];
    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.8 + col * 6.0;
      const y = 2.5 + row * 2.2;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.5, h: 1.8, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
      slide.addText(item.title, { x: x + 0.3, y: y + 0.2, w: 4.9, h: 0.6, fontSize: 18, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(item.desc, { x: x + 0.3, y: y + 0.8, w: 4.9, h: 0.6, fontSize: 14, fontFace: "Arial", color: BODY_TEXT });
    });
  },
});

// Slide 5: AI Mastery Curriculum
addSlide({
  bg: DARK_BG,
  speakerNotes: "The curriculum progresses through five mastery levels: Explorer, Guide, Architect, Innovator, and Master. Each level has specific competencies, capstone projects, and parent teachback verification. The 31 modules are structured so students build skills progressively.",
  buildFn: (slide) => {
    slide.addText("AI MASTERY CURRICULUM", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 4 });
    slide.addText("Five levels of progressive mastery", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: WHITE, bold: true });
    const levels = [
      { name: "Explorer", desc: "Discover AI basics through stories and activities", color: "10B981" },
      { name: "Guide", desc: "Master prompting, explore AI ethics", color: "3B82F6" },
      { name: "Architect", desc: "Advanced prompting, understand AI systems", color: "8B5CF6" },
      { name: "Innovator", desc: "Cutting-edge AI, entrepreneurship", color: "F97316" },
      { name: "Master", desc: "Lead as Educator, Researcher, or Implementer", color: "BE123C" },
    ];
    levels.forEach((l, i) => {
      const x = 0.5 + i * 2.5;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: 2.2, h: 3.5, fill: { color: "2A2025" }, rectRadius: 0.15, line: { color: "3A3035", width: 1 } });
      slide.addShape(pptx.ShapeType.rect, { x, y: 2.2, w: 2.2, h: 0.08, fill: { color: l.color } });
      slide.addText(`Level ${i + 1}`, { x, y: 2.5, w: 2.2, h: 0.5, fontSize: 11, fontFace: "Arial", color: "999999", align: "center" });
      slide.addText(l.name, { x, y: 3.0, w: 2.2, h: 0.6, fontSize: 18, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
      slide.addText(l.desc, { x: x + 0.15, y: 3.7, w: 1.9, h: 1.5, fontSize: 11, fontFace: "Arial", color: "D0D0D0", align: "center" });
    });
    slide.addText("31 Modules  |  Capstone Projects  |  Parent Teachback Verification", { x: 0.8, y: 6.2, w: 11, h: 0.5, fontSize: 13, fontFace: "Arial", color: "AAAAAA", align: "left" });
  },
});

// Slide 6: Career Pathways
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "We offer 55 career pathways across 12 industry categories including Technology, Healthcare, Skilled Trades, Engineering, and more. Each pathway has structured progression from exploration through job readiness, skill training, and career placement.",
  buildFn: (slide) => {
    slide.addText("SCHOOL-TO-CAREER PIPELINES", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("55 career pathways across 12 industries", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const cats = [
      { name: "Technology", count: 8 }, { name: "Healthcare", count: 6 },
      { name: "Business & Finance", count: 5 }, { name: "Engineering", count: 5 },
      { name: "Skilled Trades", count: 8 }, { name: "Military & Public Svc", count: 5 },
      { name: "Arts & Creative", count: 4 }, { name: "Education", count: 3 },
      { name: "Law & Justice", count: 3 }, { name: "Science & Research", count: 3 },
      { name: "Media & Comms", count: 3 }, { name: "Agriculture", count: 2 },
    ];
    cats.forEach((c, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 0.8 + col * 3.0;
      const y = 2.2 + row * 1.5;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.7, h: 1.2, fill: { color: WHITE }, rectRadius: 0.1, line: { color: "E8E0D8", width: 1 } });
      slide.addText(c.name, { x: x + 0.2, y: y + 0.15, w: 2.3, h: 0.5, fontSize: 13, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(`${c.count} pathways`, { x: x + 0.2, y: y + 0.6, w: 2.3, h: 0.4, fontSize: 11, fontFace: "Arial", color: BODY_TEXT });
    });
  },
});

// Slide 7: AI Creation Studio
addSlide({
  bg: { color: MAROON },
  speakerNotes: "The AI Creation Studio gives students 10 professional-grade tools. Students earn access by completing curriculum modules, ensuring they understand responsible AI use before accessing powerful tools. Adults can access all tools through Sparky.",
  buildFn: (slide) => {
    slide.addText("AI Creation Studio", { x: 0.8, y: 1.0, w: 5.0, h: 1.0, fontSize: 32, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("10 professional-grade tools students earn through demonstrated AI mastery", { x: 0.8, y: 2.2, w: 5.0, h: 1.0, fontSize: 16, fontFace: "Arial", color: "DDDDDD" });
    const tools = [
      "Presentation Builder", "Video Script Creator", "Sales Pitch Builder",
      "Business Plan Generator", "Research Assistant", "Life Planner",
      "Project Planner", "Document Writer", "Resume Builder", "Brainstorm Studio",
    ];
    tools.forEach((tool, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 6.5 + col * 3.2;
      const y = 0.8 + row * 1.2;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.9, h: 0.9, fill: { color: "3A3035" }, rectRadius: 0.1, line: { color: "3A3035", width: 1 } });
      slide.addText(`\u2713 ${tool}`, { x: x + 0.2, y, w: 2.5, h: 0.9, fontSize: 13, fontFace: "Arial", color: "F5F5F5" });
    });
  },
});

// Slide 8: AI Companions
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Spark is our AI learning companion for students with grade-band-specific responses, Socratic questioning, emotional intelligence, bilingual support, and comprehensive safety guardrails. Sparky serves parents and teachers with compassionate, evidence-based support.",
  buildFn: (slide) => {
    slide.addText("AI COMPANIONS", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("Meet Spark & Sparky", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 30, fontFace: "Arial", color: DARK_TEXT, bold: true });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 2.2, w: 5.5, h: 3.5, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
    slide.addText("Spark  \u2014  For Students", { x: 1.1, y: 2.4, w: 5.0, h: 0.6, fontSize: 20, fontFace: "Arial", color: MAROON, bold: true });
    slide.addText("Grade-band AI companion with Socratic questioning, emotional intelligence, bilingual support, and safety guardrails", { x: 1.1, y: 3.1, w: 5.0, h: 1.5, fontSize: 14, fontFace: "Arial", color: BODY_TEXT });
    slide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 2.2, w: 5.5, h: 3.5, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
    slide.addText("Sparky  \u2014  For Parents & Teachers", { x: 7.1, y: 2.4, w: 5.0, h: 0.6, fontSize: 20, fontFace: "Arial", color: MAROON, bold: true });
    slide.addText("Compassionate support with evidence-based strategies and context-aware conversations", { x: 7.1, y: 3.1, w: 5.0, h: 1.5, fontSize: 14, fontFace: "Arial", color: BODY_TEXT });
  },
});

// Slide 9: Panther Village
addSlide({
  bg: DARK_BG,
  speakerNotes: "Panther Village is our immersive virtual campus featuring interactive buildings, avatar customization, a stock market simulation for financial literacy, and academic competitions with houses, quests, and leaderboards.",
  buildFn: (slide) => {
    slide.addText("VIRTUAL CAMPUS", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 4 });
    slide.addText("Panther Village Academy", { x: 0.8, y: 1.0, w: 11, h: 0.8, fontSize: 32, fontFace: "Arial", color: WHITE, bold: true });
    const features = [
      { title: "Interactive Campus", desc: "Buildings, avatars, and exploration" },
      { title: "Stock Market Simulation", desc: "Financial literacy through practice" },
      { title: "Academic Competitions", desc: "Houses, quests, and leaderboards" },
    ];
    features.forEach((f, i) => {
      const x = 0.8 + i * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.5, w: 3.6, h: 3.0, fill: { color: "2A2025" }, rectRadius: 0.15, line: { color: "3A3035", width: 1 } });
      slide.addText(f.title, { x: x + 0.3, y: 2.8, w: 3.0, h: 0.7, fontSize: 18, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(f.desc, { x: x + 0.3, y: 3.6, w: 3.0, h: 0.8, fontSize: 14, fontFace: "Arial", color: "D0D0D0" });
    });
  },
});

// Slide 10: Impact Metrics
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "These are live numbers from our platform. We track learners served, career pathways available, professional mentors, mastery levels, learning modules, and career milestones. The full impact dashboard is available online.",
  buildFn: (slide) => {
    slide.addText("LIVE PLATFORM DATA", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("Impact at a Glance", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 30, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const metrics = [
      { value: "14", label: "Learners Served" },
      { value: "55", label: "Career Pathways" },
      { value: "8", label: "Professional Mentors" },
      { value: "5", label: "Mastery Levels" },
      { value: "31", label: "Learning Modules" },
      { value: "24", label: "Career Milestones" },
    ];
    metrics.forEach((m, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.8 + col * 4.0;
      const y = 2.2 + row * 2.4;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.6, h: 2.0, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
      slide.addText(m.value, { x, y: y + 0.1, w: 3.6, h: 1.2, fontSize: 44, fontFace: "Arial", color: MAROON, bold: true, align: "center" });
      slide.addText(m.label, { x, y: y + 1.2, w: 3.6, h: 0.5, fontSize: 14, fontFace: "Arial", color: BODY_TEXT, align: "center" });
    });
  },
});

// Slide 11: Grant Alignment
addSlide({
  bg: DARK_BG,
  speakerNotes: "Our platform meets every criterion for workforce development grant eligibility. Each checkmark represents a fully implemented capability, not a planned feature.",
  buildFn: (slide) => {
    slide.addText("Grant Aligned", { x: 0.8, y: 0.8, w: 5.0, h: 1.0, fontSize: 34, fontFace: "Arial", color: WHITE, bold: true });
    slide.addText("Every criterion met for workforce development grant eligibility", { x: 0.8, y: 2.0, w: 5.0, h: 0.8, fontSize: 16, fontFace: "Arial", color: "D0D0D0" });
    const criteria = [
      "School-to-career employment pipelines",
      "Workforce development programming",
      "Job readiness training",
      "Skill training and certification",
      "Job placement support",
      "Career advancement pathways",
      "Professional mentorship programs",
      "Community impact for under-resourced populations",
    ];
    criteria.forEach((c, i) => {
      const y = 0.8 + i * 0.78;
      slide.addShape(pptx.ShapeType.roundRect, { x: 6.2, y, w: 6.3, h: 0.6, fill: { color: "2A2025" }, rectRadius: 0.08, line: { color: "3A3035", width: 1 } });
      slide.addText(`\u2713  ${c}`, { x: 6.4, y, w: 6.0, h: 0.6, fontSize: 13, fontFace: "Arial", color: "E8E8E8" });
    });
  },
});

// Slide 12: Mentor Network
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Our mentor network connects learners with professional coaches across all 12 career categories. The system includes structured pathway planning with milestone tracking.",
  buildFn: (slide) => {
    slide.addText("MENTOR NETWORK", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("8 professional mentors and growing", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const items = [
      { title: "Career Coaching", desc: "One-on-one professional guidance from industry mentors across all 12 career categories" },
      { title: "Pathway Planning", desc: "Structured career readiness assessments with milestone tracking and revision support" },
      { title: "Job Placement", desc: "Direct pipelines from skill demonstration to workforce entry and career advancement" },
    ];
    items.forEach((item, i) => {
      const x = 0.8 + i * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.3, w: 3.6, h: 3.5, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
      slide.addText(item.title, { x: x + 0.3, y: 2.6, w: 3.0, h: 0.7, fontSize: 20, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(item.desc, { x: x + 0.3, y: 3.4, w: 3.0, h: 1.8, fontSize: 14, fontFace: "Arial", color: BODY_TEXT });
    });
  },
});

// Slide 13: Whole-Child Support
addSlide({
  bg: { color: MAROON },
  speakerNotes: "Beyond academics, we provide whole-person support including the Thrive six-domain scoring engine with early warning systems, financial literacy through stock market simulation, a nationwide community resource finder, and STAAR test preparation.",
  buildFn: (slide) => {
    slide.addText("BEYOND ACADEMICS", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: "D0D0D0", bold: true, charSpacing: 4 });
    slide.addText("Whole-child support system", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 30, fontFace: "Arial", color: WHITE, bold: true });
    const items = [
      { title: "Thrive Analytics", desc: "Six-domain scoring engine with early warning system and intervention playbooks" },
      { title: "Financial Literacy", desc: "Stock market simulation, entrepreneurship training, and real fundraising for college tuition" },
      { title: "Community Resources", desc: "Nationwide resource finder covering 55 U.S. jurisdictions with real-time data" },
      { title: "STAAR Test Prep", desc: "Grade-level study guides for Grades 3-11 aligned to Texas TEKS standards" },
    ];
    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.8 + col * 6.0;
      const y = 2.2 + row * 2.2;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.5, h: 1.8, fill: { color: "3A3035" }, rectRadius: 0.15, line: { color: "4A3540" } });
      slide.addText(item.title, { x: x + 0.3, y: y + 0.15, w: 4.9, h: 0.6, fontSize: 18, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(item.desc, { x: x + 0.3, y: y + 0.8, w: 4.9, h: 0.7, fontSize: 13, fontFace: "Arial", color: "D0D0D0" });
    });
  },
});

// Slide 14: Resource Finder
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Our Community Resource Finder connects families to local support services including healthcare, food assistance, housing, education, and employment across all 50 states plus DC and territories.",
  buildFn: (slide) => {
    slide.addText("Community Resource Finder", { x: 0.8, y: 1.2, w: 5.5, h: 1.0, fontSize: 30, fontFace: "Arial", color: DARK_TEXT, bold: true });
    slide.addText("Connecting families to local support services across the nation", { x: 0.8, y: 2.4, w: 5.5, h: 0.8, fontSize: 16, fontFace: "Arial", color: BODY_TEXT });
    const items = [
      "50 states + DC + territories (55 jurisdictions)",
      "Healthcare, food, housing, education, employment",
      "Real-time GIS data from CDC, FBI, and ATSDR",
    ];
    items.forEach((item, i) => {
      slide.addText(`\u2713  ${item}`, { x: 0.8, y: 3.6 + i * 0.7, w: 5.5, h: 0.5, fontSize: 15, fontFace: "Arial", color: DARK_TEXT });
    });
    slide.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 1.5, w: 5.0, h: 4.0, fill: { color: MAROON }, rectRadius: 0.2 });
    slide.addText("Try Resource Finder", { x: 7.0, y: 2.8, w: 5.0, h: 0.7, fontSize: 22, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
    slide.addText("Search any U.S. location", { x: 7.0, y: 3.5, w: 5.0, h: 0.5, fontSize: 14, fontFace: "Arial", color: "DDDDDD", align: "center" });
  },
});

// Slide 15: Who We Serve
addSlide({
  bg: DARK_BG,
  speakerNotes: "We serve multiple audiences. Learners of all ages, schools and districts, community organizations, and funders and employers. Each audience gets specific value from the platform.",
  buildFn: (slide) => {
    slide.addText("WHO WE SERVE", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 4 });
    slide.addText("Multiple stakeholder value", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 30, fontFace: "Arial", color: WHITE, bold: true });
    const groups = [
      { title: "Learners (All Ages)", items: ["AI mastery curriculum", "Career exploration tools", "Professional mentorship", "Workforce reintegration"] },
      { title: "Schools & Districts", items: ["LMS course creator", "Classroom management", "Progress tracking", "STAAR test preparation"] },
      { title: "Funders & Employers", items: ["Grant-aligned metrics", "Impact dashboard", "CSV data export", "API integration"] },
    ];
    groups.forEach((g, i) => {
      const x = 0.8 + i * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: 3.6, h: 4.5, fill: { color: "2A2025" }, rectRadius: 0.15, line: { color: "3A3035", width: 1 } });
      slide.addText(g.title, { x: x + 0.3, y: 2.4, w: 3.0, h: 0.7, fontSize: 18, fontFace: "Arial", color: WHITE, bold: true });
      g.items.forEach((item, j) => {
        slide.addText(`\u2022  ${item}`, { x: x + 0.3, y: 3.3 + j * 0.7, w: 3.0, h: 0.5, fontSize: 13, fontFace: "Arial", color: "DDDDDD" });
      });
    });
  },
});

// Slide 16: Differentiators
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Four things differentiate us. Tools earned through mastery, safety-first AI, real impact data, and community-embedded support.",
  buildFn: (slide) => {
    slide.addText("COMPETITIVE ADVANTAGE", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("What makes us different", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const diffs = [
      { title: "Earn Through Mastery", desc: "AI tools are unlocked by completing curriculum modules, not purchased. Students prove readiness before accessing professional tools." },
      { title: "Safety-First AI", desc: "Every AI interaction includes age-appropriate guardrails, Socratic questioning, and cultural awareness. Never just a chatbot." },
      { title: "Real Impact Data", desc: "Live metrics dashboard with grant-aligned reporting. Funders see real numbers, not projections." },
      { title: "Community-Embedded", desc: "Nationwide resource finder, GIS context engine, and early warning system connecting people to local support." },
    ];
    diffs.forEach((d, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.8 + col * 6.0;
      const y = 2.2 + row * 2.4;
      slide.addText(d.title, { x: x + 0.3, y, w: 5.0, h: 0.6, fontSize: 18, fontFace: "Arial", color: DARK_TEXT, bold: true });
      slide.addText(d.desc, { x: x + 0.3, y: y + 0.7, w: 5.0, h: 1.2, fontSize: 13, fontFace: "Arial", color: BODY_TEXT });
    });
  },
});

// Slide 17: Accessibility
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "Accessibility is not an afterthought. We have WCAG 2.1 AA compliance, adaptive learning features, and inclusive design with bilingual support.",
  buildFn: (slide) => {
    slide.addText("BUILT FOR EVERYONE", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("Accessibility & Inclusion", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const cols = [
      { title: "WCAG 2.1 AA", items: ["2,415+ test identifiers", "95+ accessibility labels", "Skip-to-content navigation", "Focus-visible indicators"] },
      { title: "Adaptive Learning", items: ["Dyslexia-friendly fonts", "Large text mode", "High contrast mode", "Reduced motion support"] },
      { title: "Inclusive Design", items: ["English & Spanish support", "Low-bandwidth mode", "Mobile responsive", "Screen reader optimized"] },
    ];
    cols.forEach((col, i) => {
      const x = 0.8 + i * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: 3.6, h: 4.2, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
      slide.addText(col.title, { x: x + 0.3, y: 2.4, w: 3.0, h: 0.6, fontSize: 18, fontFace: "Arial", color: MAROON, bold: true });
      col.items.forEach((item, j) => {
        slide.addText(`\u2713  ${item}`, { x: x + 0.3, y: 3.2 + j * 0.7, w: 3.0, h: 0.5, fontSize: 13, fontFace: "Arial", color: DARK_TEXT });
      });
    });
  },
});

// Slide 18: Security & Compliance
addSlide({
  bg: DARK_BG,
  speakerNotes: "We are COPPA compliant, FERPA aligned, with secure OIDC authentication and rate-limited AI interactions. All 124 API routes have comprehensive error handling.",
  buildFn: (slide) => {
    slide.addText("ENTERPRISE STANDARDS", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 4 });
    slide.addText("Security & Compliance", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 30, fontFace: "Arial", color: WHITE, bold: true });
    const items = [
      { title: "COPPA Compliant", desc: "Parental consent, data retention policies, age-appropriate content safeguards" },
      { title: "FERPA Aligned", desc: "Student data protection, role-based access control, secure session management" },
      { title: "Authentication", desc: "OIDC authentication via magic link, Google, and GitHub with encrypted sessions" },
      { title: "Rate Limited", desc: "AI chat rate-limited at 20 req/min, all routes with error handling, input validation" },
    ];
    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.8 + col * 6.0;
      const y = 2.2 + row * 2.4;
      slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.5, h: 2.0, fill: { color: "2A2025" }, rectRadius: 0.15, line: { color: "3A3035", width: 1 } });
      slide.addText(item.title, { x: x + 0.3, y: y + 0.2, w: 4.9, h: 0.6, fontSize: 18, fontFace: "Arial", color: WHITE, bold: true });
      slide.addText(item.desc, { x: x + 0.3, y: y + 0.9, w: 4.9, h: 0.8, fontSize: 14, fontFace: "Arial", color: "D0D0D0" });
    });
  },
});

// Slide 19: Technical Architecture
addSlide({
  bg: LIGHT_BG,
  speakerNotes: "The platform runs on a production-ready stack with 70+ pages, 124 API routes with 100% error handling, 60+ code-split components. React, Vite, TanStack Query frontend. Express, PostgreSQL, Drizzle ORM, Gemini AI backend.",
  buildFn: (slide) => {
    slide.addText("TECHNICAL FOUNDATION", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: MAROON, bold: true, charSpacing: 4 });
    slide.addText("Production-Ready Architecture", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 28, fontFace: "Arial", color: DARK_TEXT, bold: true });
    const stats = [
      { value: "70+", label: "Pages" },
      { value: "124", label: "API Routes" },
      { value: "100%", label: "Error Handling" },
      { value: "60+", label: "Code Split" },
    ];
    stats.forEach((s, i) => {
      const x = 0.8 + i * 3.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: 2.7, h: 2.0, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
      slide.addText(s.value, { x, y: 2.3, w: 2.7, h: 1.2, fontSize: 36, fontFace: "Arial", color: MAROON, bold: true, align: "center" });
      slide.addText(s.label, { x, y: 3.4, w: 2.7, h: 0.5, fontSize: 13, fontFace: "Arial", color: BODY_TEXT, align: "center" });
    });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 4.8, w: 5.5, h: 1.8, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
    slide.addText("Frontend Stack", { x: 1.1, y: 4.9, w: 5.0, h: 0.5, fontSize: 16, fontFace: "Arial", color: DARK_TEXT, bold: true });
    slide.addText("React, Vite, TanStack Query, Tailwind CSS, shadcn/ui, wouter", { x: 1.1, y: 5.5, w: 5.0, h: 0.5, fontSize: 13, fontFace: "Arial", color: BODY_TEXT });
    slide.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 4.8, w: 5.5, h: 1.8, fill: { color: WHITE }, rectRadius: 0.15, line: { color: "E8E0D8", width: 1 } });
    slide.addText("Backend Stack", { x: 7.1, y: 4.9, w: 5.0, h: 0.5, fontSize: 16, fontFace: "Arial", color: DARK_TEXT, bold: true });
    slide.addText("Node.js, Express, PostgreSQL, Drizzle ORM, Gemini AI", { x: 7.1, y: 5.5, w: 5.0, h: 0.5, fontSize: 13, fontFace: "Arial", color: BODY_TEXT });
  },
});

// Slide 20: Implementation Plan
addSlide({
  bg: DARK_BG,
  speakerNotes: "Our phased rollout starts with foundation deployment in months 1-3, growth with mentor expansion in months 4-6, and scales to multi-district rollout with national expansion in months 7-12.",
  buildFn: (slide) => {
    slide.addText("DEPLOYMENT STRATEGY", { x: 0.8, y: 0.4, w: 11, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT, bold: true, charSpacing: 4 });
    slide.addText("Phased Implementation", { x: 0.8, y: 0.9, w: 11, h: 0.8, fontSize: 30, fontFace: "Arial", color: WHITE, bold: true });
    const phases = [
      { phase: "1", title: "Foundation", items: ["Platform deployment", "Initial school partnerships", "Core curriculum launch"], timeline: "Months 1-3" },
      { phase: "2", title: "Growth", items: ["Mentor network expansion", "Career pipeline activation", "Student onboarding at scale"], timeline: "Months 4-6" },
      { phase: "3", title: "Scale", items: ["Multi-district rollout", "Employer partnerships", "National expansion planning"], timeline: "Months 7-12" },
    ];
    phases.forEach((p, i) => {
      const x = 0.8 + i * 4.0;
      slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.2, w: 3.6, h: 4.5, fill: { color: "2A2025" }, rectRadius: 0.15, line: { color: "3A3035", width: 1 } });
      slide.addShape(pptx.ShapeType.rect, { x, y: 2.2, w: 3.6, h: 0.08, fill: { color: MAROON } });
      slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.3, y: 2.5, w: 0.6, h: 0.6, fill: { color: MAROON } });
      slide.addText(p.phase, { x: x + 0.3, y: 2.5, w: 0.6, h: 0.6, fontSize: 14, fontFace: "Arial", color: WHITE, bold: true, align: "center", valign: "middle" });
      slide.addText(p.title, { x: x + 1.1, y: 2.5, w: 2.2, h: 0.6, fontSize: 18, fontFace: "Arial", color: WHITE, bold: true });
      p.items.forEach((item, j) => {
        slide.addText(`\u2192  ${item}`, { x: x + 0.3, y: 3.5 + j * 0.7, w: 3.0, h: 0.5, fontSize: 13, fontFace: "Arial", color: "DDDDDD" });
      });
      slide.addText(p.timeline, { x: x + 0.3, y: 5.8, w: 3.0, h: 0.5, fontSize: 12, fontFace: "Arial", color: SILVER_TEXT });
    });
  },
});

// Slide 21: Closing
addSlide({
  bg: { color: MAROON },
  speakerNotes: "The people who learn to think with AI today will lead tomorrow. We invite you to explore the live platform, review our impact dashboard, and connect with us. Contact us at sisnett.meredith@gmail.com and mr.terryflood@gmail.com.",
  buildFn: (slide) => {
    slide.addText("Ready to transform futures?", { x: 0.8, y: 1.5, w: 11.5, h: 1.2, fontSize: 40, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
    slide.addText("The people who learn to think with AI today will lead tomorrow.", { x: 1.5, y: 3.0, w: 10.0, h: 0.8, fontSize: 18, fontFace: "Arial", color: "DDDDDD", align: "center" });
    slide.addText("Contact Us", { x: 0.8, y: 4.2, w: 11.5, h: 0.6, fontSize: 18, fontFace: "Arial", color: "F5F5F5", align: "center" });
    slide.addText("sisnett.meredith@gmail.com    |    mr.terryflood@gmail.com", { x: 0.8, y: 4.8, w: 11.5, h: 0.6, fontSize: 16, fontFace: "Arial", color: "E8E8E8", align: "center" });
    slide.addShape(pptx.ShapeType.roundRect, { x: 3.5, y: 5.8, w: 3.0, h: 0.7, fill: { color: WHITE }, rectRadius: 0.1 });
    slide.addText("View Impact Dashboard", { x: 3.5, y: 5.8, w: 3.0, h: 0.7, fontSize: 13, fontFace: "Arial", color: MAROON, bold: true, align: "center" });
    slide.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 5.8, w: 3.0, h: 0.7, fill: { color: "6B1C2A" }, rectRadius: 0.1, line: { color: "999999", width: 2 } });
    slide.addText("Explore Platform", { x: 7.0, y: 5.8, w: 3.0, h: 0.7, fontSize: 13, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
  },
});

pptx.writeFile({ fileName: "ThriveUp_Academy_Stakeholder_Deck.pptx" })
  .then(() => console.log("PowerPoint saved: ThriveUp_Academy_Stakeholder_Deck.pptx"))
  .catch((err) => console.error("Error:", err));
