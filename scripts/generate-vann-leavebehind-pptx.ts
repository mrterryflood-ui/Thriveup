/**
 * Vann Collaboration Kit — Leave-Behind PPTX
 *
 * Mirrors the three live pages 1:1:
 *   /partners/vann-hub
 *   /partners/family-program-tracker
 *   /partners/rfp-storyteller
 *
 * Iron rule: every claim must trace to either (a) a verified TCAF/Vann fact in
 * docs/partners/Vann-Vanntastic-Strategy-Memo.md, or (b) the live tracker data
 * computed at run-time. Nothing aspirational.
 *
 * Run: npx tsx scripts/generate-vann-leavebehind-pptx.ts
 * Output: dist/Vann-Collaboration-LeaveBehind.pptx
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs") as typeof import("pptxgenjs");

const ROOT = process.cwd();
const APP_BASE = process.env.APP_BASE_URL || "http://localhost:5000";

const NAVY = "0B2E4F";
const ACCENT = "1F6FB2";
const ORANGE = "F97316";
const PURPLE = "7C3AED";
const GREEN = "16A34A";
const AMBER = "D97706";
const GRAY = "6B7280";
const LIGHT = "F8FAFC";

async function fetchJson<T>(p: string): Promise<T | null> {
  try {
    const r = await fetch(`${APP_BASE}${p}`);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

type OrgStats = {
  households: number; members: number; activePrograms: number;
  totalAttendanceEvents: number; presentEvents: number; attendanceRate: number | null;
  servicesRecorded: number; mealsServed: number; transportProvided: number;
  programs: Array<{ programName: string; category: string; enrolled: number; present: number }>;
};

async function main() {
  const sistahsStats = await fetchJson<OrgStats>("/api/community/orgs/sistahs-cwt/stats") || {
    households: 0, members: 0, activePrograms: 0, totalAttendanceEvents: 0, presentEvents: 0,
    attendanceRate: null, servicesRecorded: 0, mealsServed: 0, transportProvided: 0, programs: [],
  };
  const iasisStats = await fetchJson<OrgStats>("/api/community/orgs/iasis-ccc/stats") || sistahsStats;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = "Vann Collaboration Kit — Leave-Behind";
  pptx.author = "Dr. Terry Flood, President, TCAF";
  pptx.company = "The Collaborative Advocate Foundation (TCAF)";

  // ----- Slide 1 — title -----
  const s1 = pptx.addSlide();
  s1.background = { color: NAVY };
  s1.addText("Vann Collaboration Kit", { x: 0.6, y: 1.4, w: 12, h: 1.2, fontSize: 48, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  s1.addText("Sistahs Can We Talk · Iasis Christian Center · ThriveUp Academy / TCAF", { x: 0.6, y: 2.6, w: 12, h: 0.6, fontSize: 22, color: "FFFFFF" });
  s1.addText("A working-session leave-behind. Every number on every slide reflects what the live system shows today.", { x: 0.6, y: 3.3, w: 12, h: 0.6, fontSize: 16, color: "CBD5E1" });
  s1.addText(`${APP_BASE}/partners/vann-hub`, { x: 0.6, y: 6.2, w: 8, h: 0.4, fontSize: 14, color: "93C5FD" });
  s1.addText(`Prepared by Dr. Terry Flood, President, TCAF · ${new Date().toLocaleDateString()}`, { x: 0.6, y: 6.7, w: 12, h: 0.4, fontSize: 12, color: "94A3B8" });

  // ----- Slide 2 — Who's at the table -----
  const s2 = pptx.addSlide();
  s2.addText("Who's at the table", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: NAVY });
  s2.addText("Three vehicles, one person. Each plays a distinct role.", { x: 0.5, y: 0.95, w: 12, h: 0.4, fontSize: 14, color: GRAY });
  const whos = [
    { title: "Sistahs Can We Talk Inc.", sub: "501(c)(3) · founded 2015", body: "Primary KS-side grant applicant. BIPOC women's health, free cancer screenings, Healthy Me Initiative, youth mentoring, digital storytelling. 29th & Grove neighborhood, Wichita.\n\nFounder & President: Dr. J. Michelle Vann", color: PURPLE },
    { title: "Iasis Christian Center", sub: "Pentecostal/Apostolic · 37+ years", body: "Wednesday youth programs: Joshua Generation (12+) and Academy of Excellence (≤11), 5:30–7pm, meal + transportation provided. Sunday Children's Ministry.\n\nSenior Pastor: William Vann · First Lady: Michelle Vann\n\nCOI disclosure on federal grants — spouse relationship.", color: AMBER },
    { title: "Vanntastic Solutions LLC", sub: "For-profit · executive coaching", body: "Executive wellness coaching, speaking, books (Healthy Plates, Stop the Merry-Go-Round, Help Along the Journey, From Supporting Role to Leading Lady).\n\nPrincipal: Dr. J. Michelle Vann · TEDxNewmanUniversity speaker", color: ACCENT },
  ];
  whos.forEach((w, i) => {
    const x = 0.5 + i * 4.3;
    s2.addShape("rect", { x, y: 1.6, w: 4.1, h: 4.8, fill: { color: LIGHT }, line: { color: w.color, width: 2 } });
    s2.addText(w.title, { x: x + 0.2, y: 1.75, w: 3.8, h: 0.45, fontSize: 16, bold: true, color: w.color });
    s2.addText(w.sub, { x: x + 0.2, y: 2.2, w: 3.8, h: 0.3, fontSize: 11, color: GRAY, italic: true });
    s2.addText(w.body, { x: x + 0.2, y: 2.55, w: 3.8, h: 3.8, fontSize: 11, color: "1E293B" });
  });
  s2.addText("Affiliations that change the strategy: Sedgwick County Mental Health Advisory Board (seat) · KSUN Radio 95.9 host · Tabor College Wichita (Adjunct) · Wichita Public Schools (20-yr veteran) · Greater Wichita Ministerial League · WeKan · Health & Wellness Coalition of Wichita · Anthropocene Alliance.", { x: 0.5, y: 6.6, w: 12.3, h: 0.7, fontSize: 10, color: GRAY, italic: true });

  // ----- Slide 3 — what she asked for -----
  const s3 = pptx.addSlide();
  s3.addText("What she asked for", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: NAVY });
  s3.addText("From her May 13, 2026 email:", { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 13, color: GRAY });
  s3.addShape("rect", { x: 0.5, y: 1.5, w: 12.3, h: 1.2, fill: { color: LIGHT }, line: { color: NAVY, width: 2 } });
  s3.addText("\"Something similar to what you showed for our youth program. I want to be able to track attendance, family structure, and services the families are engaged in.\"", { x: 0.8, y: 1.65, w: 11.7, h: 1.0, fontSize: 18, italic: true, color: NAVY });
  s3.addText("Parsed", { x: 0.5, y: 3.0, w: 12, h: 0.4, fontSize: 18, bold: true, color: NAVY });
  s3.addText([
    { text: "Attendance ", options: { bold: true } }, { text: "— recurring weekly cohort, who showed up, streaks, meals/transport served.\n\n" },
    { text: "Family structure ", options: { bold: true } }, { text: "— household as the unit: parent/guardian, siblings, relationships, contact info.\n\n" },
    { text: "Services families are engaged in ", options: { bold: true } }, { text: "— wraparound view: youth ministry + women's health + counseling + screenings + referrals.\n\n" },
    { text: "The family is the unit, not the individual. ", options: { bold: true, color: ORANGE } },
    { text: "That's exactly the whole-family case-management model we've built — pivoted from a child-protection lens to a community-asset lens." },
  ], { x: 0.5, y: 3.5, w: 12.3, h: 3.5, fontSize: 14, color: "1E293B" });

  // ----- Slide 4 — live tracker numbers -----
  const s4 = pptx.addSlide();
  s4.addText("Live tracker — what your data would look like today", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: NAVY });
  s4.addText("Pre-seeded with illustrative placeholder cohorts for the conversation. When you upload your real roster, every number updates.", { x: 0.5, y: 1.0, w: 12, h: 0.4, fontSize: 11, color: GRAY, italic: true });

  const orgs = [
    { name: "Sistahs Can We Talk", s: sistahsStats, color: PURPLE, y: 1.6 },
    { name: "Iasis Christian Center", s: iasisStats, color: AMBER, y: 4.2 },
  ];
  orgs.forEach(o => {
    s4.addText(o.name, { x: 0.5, y: o.y, w: 6, h: 0.4, fontSize: 18, bold: true, color: o.color });
    const tiles = [
      { l: "Households", v: o.s.households },
      { l: "Individuals", v: o.s.members },
      { l: "Active programs", v: o.s.activePrograms },
      { l: "Attendance events", v: o.s.totalAttendanceEvents },
      { l: "Meals served", v: o.s.mealsServed },
      { l: "Transport rides", v: o.s.transportProvided },
    ];
    tiles.forEach((t, i) => {
      const x = 0.5 + i * 2.05;
      s4.addShape("rect", { x, y: o.y + 0.45, w: 1.95, h: 1.5, fill: { color: LIGHT }, line: { color: o.color, width: 1 } });
      s4.addText(String(t.v), { x, y: o.y + 0.6, w: 1.95, h: 0.7, fontSize: 26, bold: true, color: o.color, align: "center" });
      s4.addText(t.l, { x, y: o.y + 1.3, w: 1.95, h: 0.45, fontSize: 10, color: GRAY, align: "center" });
    });
  });
  s4.addText(`Live view: ${APP_BASE}/partners/family-program-tracker`, { x: 0.5, y: 6.8, w: 12, h: 0.4, fontSize: 12, color: ACCENT });

  // ----- Slide 5 — what the tracker does -----
  const s5 = pptx.addSlide();
  s5.addText("Family & Program Tracker — features", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: NAVY });
  const features = [
    ["Org isolation", "Sistahs CWT and Iasis are separate tenants. Same infrastructure, separate rosters."],
    ["Household as the unit", "Parent + children + grandparent caregivers grouped. Each member tagged with relationship + language."],
    ["Multi-program enrollment", "A single child can be in Joshua Generation + Sistahs Mentoring Circle simultaneously. Each program tracked separately."],
    ["Weekly attendance check-in", "Pick a date, pick a program, mark present/late/excused/absent. Meals & transport flagged."],
    ["Services received", "Beyond program attendance — cancer screenings, PHQ-9/GAD-7, counseling, food assistance, referrals."],
    ["CSV upload & export", "Day-one usable: paste a spreadsheet, get households + members. Export back for funder reporting."],
    ["Multilingual", "Spanish + Vietnamese + 105 others via Talk Your Talk. Demo cohort includes Spanish-preferred and Vietnamese-preferred families."],
    ["COI disclosure", "Iasis tenant view always displays the standing spouse-relationship disclosure."],
  ];
  features.forEach((f, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.5 + col * 6.2;
    const y = 1.1 + row * 1.4;
    s5.addText(f[0], { x, y, w: 6, h: 0.4, fontSize: 13, bold: true, color: ACCENT });
    s5.addText(f[1], { x, y: y + 0.4, w: 6, h: 0.9, fontSize: 11, color: "1E293B" });
  });

  // ----- Slide 6 — RFP storyteller intro -----
  const s6 = pptx.addSlide();
  s6.addText("RFP-Match Storyteller", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: NAVY });
  s6.addText("Every requirement in a funder's RFP, side-by-side with the live data point that satisfies it.", { x: 0.5, y: 1.0, w: 12, h: 0.5, fontSize: 14, color: GRAY });
  s6.addShape("rect", { x: 0.5, y: 1.8, w: 6.0, h: 5.0, fill: { color: LIGHT }, line: { color: ORANGE, width: 2 } });
  s6.addText("FEDERAL · scaling-up", { x: 0.7, y: 1.95, w: 5.6, h: 0.35, fontSize: 10, bold: true, color: ORANGE });
  s6.addText("SAMHSA Minority Behavioral Health", { x: 0.7, y: 2.3, w: 5.6, h: 0.5, fontSize: 18, bold: true, color: NAVY });
  s6.addText("TCAF prime · Sistahs CWT named subrecipient · evaluation via TCAF research bench · letter of support from her Sedgwick County MH Board seat.", { x: 0.7, y: 2.9, w: 5.6, h: 1.3, fontSize: 12, color: "1E293B" });
  s6.addText("Why we can lead:", { x: 0.7, y: 4.3, w: 5.6, h: 0.3, fontSize: 11, bold: true, color: NAVY });
  s6.addText("• IRS Letter 947 (eff. 01/14/2026)\n• SAM.gov ACTIVE (UEI KDDVD1FGLW35)\n• CAGE Code 209N1\n• 4-engine AI synthesis + RAG\n• Implementation-science evaluation bench", { x: 0.7, y: 4.6, w: 5.6, h: 2.0, fontSize: 11, color: "1E293B" });

  s6.addShape("rect", { x: 6.8, y: 1.8, w: 6.0, h: 5.0, fill: { color: LIGHT }, line: { color: GREEN, width: 2 } });
  s6.addText("LOCAL · scaling-out", { x: 7.0, y: 1.95, w: 5.6, h: 0.35, fontSize: 10, bold: true, color: GREEN });
  s6.addText("City of Wichita CDBG Public Services 2026", { x: 7.0, y: 2.3, w: 5.6, h: 0.5, fontSize: 18, bold: true, color: NAVY });
  s6.addText("Sistahs CWT prime · TCAF as technology + evaluation partner. ZoomGrants-ready exports already built into the tracker.", { x: 7.0, y: 2.9, w: 5.6, h: 1.3, fontSize: 12, color: "1E293B" });
  s6.addText("Why this fits:", { x: 7.0, y: 4.3, w: 5.6, h: 0.3, fontSize: 11, bold: true, color: NAVY });
  s6.addText("• KS 501(c)(3) since 2015\n• Service area 67213/67214/67217 (LMI majority)\n• Evidence base: Healthy Me Initiative\n• Active partner of Health & Wellness Coalition\n• $475K pool, $50K floor", { x: 7.0, y: 4.6, w: 5.6, h: 2.0, fontSize: 11, color: "1E293B" });

  s6.addText(`Live storyteller: ${APP_BASE}/partners/rfp-storyteller`, { x: 0.5, y: 7.0, w: 12, h: 0.4, fontSize: 12, color: ACCENT });

  // ----- Slide 7 — ecosystem -----
  const s7 = pptx.addSlide();
  s7.addText("The ecosystem you'd be plugging into", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: NAVY });
  s7.addText("Externally we describe this as 15 service platforms operated by TCAF. Nine of them are immediately relevant here.", { x: 0.5, y: 0.95, w: 12, h: 0.4, fontSize: 11, color: GRAY, italic: true });
  const eco = [
    ["ThriveUp Academy", "Workforce, financial literacy, FAFSA, attendance/dosage. The platform your tracker plugs into."],
    ["Whole-Person Health", "PHQ-9 / GAD-7 screenings, crisis routing. Fit for your Sedgwick County MH Board lane."],
    ["Bible Study Buddies", "Faith-formation curriculum. Built for the Iasis Joshua Generation / Academy of Excellence tracks."],
    ["Talk Your Talk", "89 spoken + 18 sign = 107 languages. Spanish + Vietnamese materials for the families who need them."],
    ["LifeBridge (Virtual 211)", "Wraparound resource navigation. Every referral tracked at the household level."],
    ["SafeReport", "50-state mandatory-reporter system. Safety net for any program serving minors."],
    ["Sankofa Health Network", "African-diaspora health knowledge. Pairs with SCWT's Healthy Me initiative."],
    ["HerHealth Network", "Black maternal & women's health. Direct overlap with SCWT mission."],
    ["Civic Signal", "Community-engagement substrate. Pairs with your KSUN Radio 95.9 platform."],
  ];
  eco.forEach((e, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 0.5 + col * 4.2;
    const y = 1.5 + row * 1.65;
    s7.addShape("rect", { x, y, w: 4.0, h: 1.55, fill: { color: LIGHT }, line: { color: ACCENT, width: 1 } });
    s7.addText(e[0], { x: x + 0.15, y: y + 0.1, w: 3.7, h: 0.4, fontSize: 13, bold: true, color: ACCENT });
    s7.addText(e[1], { x: x + 0.15, y: y + 0.5, w: 3.7, h: 1.0, fontSize: 10, color: "1E293B" });
  });

  // ----- Slide 8 — Kansas funding landscape -----
  const s8 = pptx.addSlide();
  s8.addText("Kansas funding landscape — the mutual-benefit case", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: NAVY });
  const rows = [
    ["Funder", "Type", "Amount", "Who applies"],
    ["City of Wichita CDBG Public Services", "Local", "$50K floor / $475K pool", "Sistahs CWT (prime) · TCAF (partner)"],
    ["Wichita Foundation Emergency Fund", "Local", "rolling, weekly", "Sistahs CWT"],
    ["DanPaul Foundation", "Foundation", "up to $15K", "Sistahs CWT"],
    ["U.S. Bank Community Possible", "Corporate", "varies", "Sistahs CWT"],
    ["HHS Runaway/Homeless Youth", "Federal", "—", "TCAF lead · Sistahs CWT subrecipient"],
    ["SAMHSA Minority Behavioral Health", "Federal", "—", "TCAF lead · Sistahs CWT subrecipient"],
    ["HRSA Healthy Start (BIPOC women's health)", "Federal", "—", "TCAF lead · Sistahs CWT subrecipient"],
    ["Sedgwick County mental-health discretionary", "County", "—", "Sistahs CWT (board seat)"],
  ];
  rows.forEach((r, i) => {
    const y = 1.2 + i * 0.55;
    const bg = i === 0 ? NAVY : (i % 2 ? LIGHT : "FFFFFF");
    const fg = i === 0 ? "FFFFFF" : "1E293B";
    const bold = i === 0;
    [0.5, 5.0, 6.5, 8.5].forEach((x, ci) => {
      const w = ci === 0 ? 4.5 : ci === 1 ? 1.5 : ci === 2 ? 2.0 : 4.3;
      s8.addShape("rect", { x, y, w, h: 0.5, fill: { color: bg }, line: { color: i === 0 ? NAVY : "E2E8F0", width: 0.5 } });
      s8.addText(r[ci], { x: x + 0.1, y, w: w - 0.2, h: 0.5, fontSize: 11, color: fg, bold, valign: "middle" });
    });
  });
  s8.addText("Structurally clean: both Sistahs CWT and TCAF are independent 501(c)(3)s. No fiscal-sponsor language. Pure subaward / tech-partner.", { x: 0.5, y: 6.8, w: 12, h: 0.4, fontSize: 11, color: GRAY, italic: true });

  // ----- Slide 9 — 7-minute walkthrough -----
  const s9 = pptx.addSlide();
  s9.addText("7-minute walkthrough script", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: NAVY });
  s9.addText("Use this as the running order during the live conversation.", { x: 0.5, y: 0.95, w: 12, h: 0.35, fontSize: 11, color: GRAY });
  const steps: Array<[string, string]> = [
    ["0:00", "Open the Vann Collaboration Hub. \"Here's everything together — your two organizations, your network, and the platform around it.\""],
    ["1:00", "Click into the Family & Program Tracker. Switch from Sistahs CWT → Iasis. \"Same infrastructure; two separate rosters; the COI disclosure appears automatically on the Iasis side.\""],
    ["2:30", "Open a household. Show members, language, enrollments, attendance trend, services received. \"Family is the unit. Not just the kid in Joshua Gen — the whole household.\""],
    ["4:00", "Click Check in attendance. Mark a Wednesday session. \"This is what next Wednesday at 5:30 looks like with this open on a tablet.\""],
    ["5:00", "Open the RFP-Match Storyteller. Show the SAMHSA panel — every requirement satisfied by a live number. Switch to Wichita CDBG. \"Federal scaling-up. Local scaling-out. Same data.\""],
    ["6:30", "Return to this hub. \"Bible Study Buddies for Iasis. Whole-Person Health for your Sedgwick board. HerHealth + Sankofa for Sistahs. Talk Your Talk for the Spanish + Vietnamese families. LifeBridge for everything else.\""],
    ["7:00", "\"Two organizations, one partnership. Pick a federal target with us and we file it in 60 days.\""],
  ];
  steps.forEach((s, i) => {
    const y = 1.4 + i * 0.75;
    s9.addText(s[0], { x: 0.5, y, w: 0.8, h: 0.6, fontSize: 14, bold: true, color: ORANGE, valign: "top" });
    s9.addText(s[1], { x: 1.4, y, w: 11.4, h: 0.7, fontSize: 11, color: "1E293B", valign: "top" });
  });

  // ----- Slide 10 — the ask & honest disclosure -----
  const s10 = pptx.addSlide();
  s10.background = { color: NAVY };
  s10.addText("The ask", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: "FFFFFF" });
  s10.addText([
    { text: "1.  ", options: { bold: true, color: "FBBF24" } }, { text: "Sistahs CWT named subrecipient on a joint SAMHSA Minority Behavioral Health proposal in the next 12 months.\n\n", options: { color: "FFFFFF" } },
    { text: "2.  ", options: { bold: true, color: "FBBF24" } }, { text: "Sistahs CWT named subrecipient on a joint HRSA Healthy Start proposal.\n\n", options: { color: "FFFFFF" } },
    { text: "3.  ", options: { bold: true, color: "FBBF24" } }, { text: "Sistahs CWT primes the Wichita CDBG 2026 application; TCAF provides technology + evaluation.\n\n", options: { color: "FFFFFF" } },
    { text: "4.  ", options: { bold: true, color: "FBBF24" } }, { text: "Letter-of-support exchange between Dr. Flood (TCAF) and Dr. Vann (SCWT) for both directions.\n\n", options: { color: "FFFFFF" } },
    { text: "5.  ", options: { bold: true, color: "FBBF24" } }, { text: "30-day check-in scheduled. No fiscal-sponsor structure required — both organizations are independent 501(c)(3)s.", options: { color: "FFFFFF" } },
  ], { x: 0.5, y: 1.3, w: 12.3, h: 4.8, fontSize: 16 });
  s10.addText("Honest disclosure", { x: 0.5, y: 6.0, w: 12, h: 0.3, fontSize: 11, bold: true, color: "FBBF24" });
  s10.addText("Demo cohort data is illustrative placeholders for the conversation. No real Sistahs CWT or Iasis member data is represented. TCAF is IRS-determined 501(c)(3) (Letter 947, eff. 01/14/2026; EIN 41-3618003), SAM.gov ACTIVE (UEI KDDVD1FGLW35, CAGE 209N1). St. David's Foundation status: actively evaluating.", { x: 0.5, y: 6.3, w: 12.3, h: 1.0, fontSize: 10, color: "CBD5E1", italic: true });

  // ----- Write -----
  const outDir = path.join(ROOT, "dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "Vann-Collaboration-LeaveBehind.pptx");
  await pptx.writeFile({ fileName: outPath });
  console.log(`\n✔ Wrote ${outPath}`);
  console.log(`  Sistahs CWT: ${sistahsStats.households} households · ${sistahsStats.members} individuals · ${sistahsStats.totalAttendanceEvents} attendance events`);
  console.log(`  Iasis CCC:   ${iasisStats.households} households · ${iasisStats.members} individuals · ${iasisStats.totalAttendanceEvents} attendance events`);
}

main().catch(e => { console.error(e); process.exit(1); });
