#!/usr/bin/env tsx
/**
 * Compile Agent Knowledge Layer
 *
 * Reads canonical project knowledge sources and compiles them into a structured,
 * deterministic JSON index for the Replit Agent's internal use.
 *
 * This is the "compilation-stage knowledge layer" — the agent loads it once at
 * session start instead of grepping/RAG-ing canonical files at every step.
 *
 * End-user RAG (server/rag-engine.ts, 86 chunks) is UNTOUCHED and continues to
 * serve the public AI assistant. This index is agent-only.
 *
 * Usage:
 *   tsx scripts/compile-agent-knowledge.ts
 *
 * Output:
 *   .agents/knowledge/compiled.json
 *
 * Re-run after editing replit.md, docs/active-commitments.md, or
 * .agents/skills/map-gap/lessons-learned.md, OR to refresh DB-sourced sections.
 */

import { readFileSync, writeFileSync, statSync } from "fs";
import { resolve } from "path";
import { db } from "../server/storage";
import { ecosystemPlatforms } from "../shared/schema";

const ROOT = process.cwd();
const SOURCES = {
  replitMd: resolve(ROOT, "replit.md"),
  activeCommitments: resolve(ROOT, "docs/active-commitments.md"),
  lessonsLearned: resolve(ROOT, ".agents/skills/map-gap/lessons-learned.md"),
  ecosystemCatalog: resolve(ROOT, "docs/ecosystem-catalog.md"),
  fosterYouthBuildLog: resolve(ROOT, "docs/foster-youth-build-log.md"),
  memoryIndex: resolve(ROOT, "docs/agent-memory/INDEX.md"),
  memoryCurrent: resolve(ROOT, "docs/agent-memory/CURRENT.md"),
  topicGotchas: resolve(ROOT, "docs/agent-memory/topics/gotchas.md"),
  topicArchitecture: resolve(ROOT, "docs/agent-memory/topics/architecture.md"),
};
const OUT_PATH = resolve(ROOT, ".agents/knowledge/compiled.json");

type Section = { id: string; heading: string; level: number; body: string; sourceFile: string };

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function safeRead(path: string): { content: string; mtime: string } | null {
  try {
    const content = readFileSync(path, "utf-8");
    const mtime = statSync(path).mtime.toISOString();
    return { content, mtime };
  } catch {
    return null;
  }
}

/** Parse markdown into sections by heading (## and ###). */
function parseMarkdownSections(md: string, sourceFile: string): Section[] {
  const lines = md.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) sections.push(current);
      current = {
        id: slugify(m[2]),
        heading: m[2].trim(),
        level: m[1].length,
        body: "",
        sourceFile,
      };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections.map(s => ({ ...s, body: s.body.trim() }));
}

/** Extract bulleted "key: value" gotchas/preferences from a markdown body. */
function extractBullets(body: string): Array<{ raw: string; key?: string; value: string }> {
  const out: Array<{ raw: string; key?: string; value: string }> = [];
  const bulletRe = /^[-*]\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = bulletRe.exec(body)) !== null) {
    const raw = m[1].trim();
    const kv = /^\*\*(.+?):\*\*\s*(.+)$/s.exec(raw);
    if (kv) {
      out.push({ raw, key: kv[1].trim(), value: kv[2].trim() });
    } else {
      out.push({ raw, value: raw });
    }
  }
  return out;
}

async function loadEcosystemPlatformsFromDb() {
  try {
    const rows = await db.select().from(ecosystemPlatforms);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      url: r.url,
      role: r.role,
      domain: r.domain,
      status: r.status,
      health_status: r.healthStatus,
      public_visible: r.publicVisible,
      description: r.description,
      capabilities: r.capabilities,
      grant_alignment: r.grantAlignment,
      last_heartbeat: r.lastHeartbeat?.toISOString() || null,
    }));
  } catch (e) {
    console.error("[compile-agent-knowledge] Failed to load ecosystem_platforms from DB:", e);
    return [];
  }
}

async function main() {
  console.log("[compile-agent-knowledge] Starting compilation…");

  const replitMd = safeRead(SOURCES.replitMd);
  const activeCommitments = safeRead(SOURCES.activeCommitments);
  const lessons = safeRead(SOURCES.lessonsLearned);
  const ecosystemCatalog = safeRead(SOURCES.ecosystemCatalog);
  const fosterBuildLog = safeRead(SOURCES.fosterYouthBuildLog);

  if (!replitMd) throw new Error(`Cannot read ${SOURCES.replitMd}`);

  const replitSections = parseMarkdownSections(replitMd.content, "replit.md");
  const acSections = activeCommitments
    ? parseMarkdownSections(activeCommitments.content, "docs/active-commitments.md")
    : [];
  const lessonSections = lessons
    ? parseMarkdownSections(lessons.content, ".agents/skills/map-gap/lessons-learned.md")
    : [];
  const catalogSections = ecosystemCatalog
    ? parseMarkdownSections(ecosystemCatalog.content, "docs/ecosystem-catalog.md")
    : [];
  const fosterBuildLogSections = fosterBuildLog
    ? parseMarkdownSections(fosterBuildLog.content, "docs/foster-youth-build-log.md")
    : [];

  // Extract ecosystem caveats (numbered list under "Critical caveats for any grant work")
  const caveatsSection = catalogSections.find(s => /critical caveats/i.test(s.heading));
  const ecosystemCaveats: Array<{ id: number; rule: string }> = [];
  if (caveatsSection) {
    const lineRe = /^\d+\.\s+(.+?)(?=\n\d+\.|\n\n|$)/gms;
    let cm: RegExpExecArray | null;
    let n = 1;
    while ((cm = lineRe.exec(caveatsSection.body)) !== null) {
      ecosystemCaveats.push({ id: n++, rule: cm[1].replace(/\s+/g, " ").trim().slice(0, 600) });
    }
  }
  const quintetSection = catalogSections.find(s => /quintet/i.test(s.heading));
  const quintet = quintetSection ? quintetSection.body.slice(0, 400) : "";

  // Section lookup helpers
  const findSection = (sections: Section[], slug: string) => sections.find(s => s.id === slug);

  // === Project header (top of replit.md before first H2) ===
  const headerMatch = /^#\s+(.+?)\n([\s\S]*?)(?=\n##\s|$)/.exec(replitMd.content);
  const project = {
    name: headerMatch ? headerMatch[1].trim() : "ThriveUp Academy",
    summary: headerMatch ? headerMatch[2].trim() : "",
  };

  // === Gotchas (parsed from docs/agent-memory/topics/gotchas.md — h3 headings) ===
  // Gotchas moved out of replit.md (2026-05-24) into the agent-memory topic file.
  const topicGotchasFile = safeRead(SOURCES.topicGotchas);
  const topicGotchasSections = topicGotchasFile
    ? parseMarkdownSections(topicGotchasFile.content, "docs/agent-memory/topics/gotchas.md")
    : [];
  const gotchas = topicGotchasSections
    .filter(s => s.level === 3) // h3 = one gotcha per heading
    .map(s => ({
      id: slugify(s.heading),
      rule: s.heading,
      detail: s.body.slice(0, 600),
      severity: /\bnever\b|🚨|\bprohibited|\bcritical|\bmust\b/i.test(s.heading + " " + s.body)
        ? "critical"
        : "high",
    }));

  // === User preferences ===
  const prefsSection = findSection(replitSections, "user-preferences");
  const userPreferences = prefsSection
    ? extractBullets(prefsSection.body).map(b => b.value)
    : [];

  // === Vocab (CEO/President, FIPS/Census, etc.) — extracted from gotchas ===
  const vocab: Array<{ wrong: string; right: string; context: string }> = [];
  for (const g of gotchas) {
    const m1 = /["“](.+?)["”]\s+vs\.?\s+["“](.+?)["”]/i.exec(g.rule);
    if (m1) {
      vocab.push({ wrong: m1[1], right: m1[2], context: g.detail.slice(0, 200) });
    }
  }
  // Hard-coded canonical vocab from project memory (most stable)
  const canonicalVocab = [
    { wrong: "CEO", right: "President", context: "Dr. Flood, public-facing copy. CEO is for-profit only." },
    { wrong: "FIPS", right: "State Census Code / County Census Code", context: "User-facing labels — never expose 'FIPS' directly." },
    { wrong: "Texas-only", right: "national platform, Texas-piloted", context: "Geographic framing for ThriveUp." },
    { wrong: "LexiBridge / Speech Bridge", right: "Talk Your Talk", context: "Old name → new name. URL: talkyourtalk.net. 89 spoken + 18 sign = 107 langs." },
  ];
  for (const v of canonicalVocab) {
    if (!vocab.find(existing => existing.wrong.toLowerCase() === v.wrong.toLowerCase())) {
      vocab.push(v);
    }
  }

  // === Stack ===
  const stackSection = findSection(replitSections, "stack");
  const stack = stackSection
    ? extractBullets(stackSection.body).reduce((acc, b) => {
        if (b.key) acc[slugify(b.key)] = b.value;
        return acc;
      }, {} as Record<string, string>)
    : {};

  // === Where things live (file pointers) ===
  // Pointers moved out of replit.md (2026-05-24) into INDEX.md + topics/architecture.md.
  const memoryIndexFile = safeRead(SOURCES.memoryIndex);
  const archFile = safeRead(SOURCES.topicArchitecture);
  const indexSections = memoryIndexFile
    ? parseMarkdownSections(memoryIndexFile.content, "docs/agent-memory/INDEX.md")
    : [];
  const archSections = archFile
    ? parseMarkdownSections(archFile.content, "docs/agent-memory/topics/architecture.md")
    : [];
  const wtlSection = archSections.find(s => /where things live/i.test(s.heading));
  // Table-row pointer extractor: | Feature | Location |
  const filePointers: Array<{ label: string; detail: string }> = [];
  if (wtlSection) {
    const rowRe = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;
    let m: RegExpExecArray | null;
    while ((m = rowRe.exec(wtlSection.body)) !== null) {
      const label = m[1].replace(/\*\*/g, "").trim();
      const detail = m[2].replace(/\*\*/g, "").trim();
      if (!label || /^-+$/.test(label) || /^Feature$/i.test(label)) continue;
      filePointers.push({ label, detail });
    }
  }
  // Also pull pointers from INDEX.md "File layout" code block
  const layoutSection = indexSections.find(s => /file layout/i.test(s.heading));
  if (layoutSection) {
    const codeMatch = /```([\s\S]*?)```/.exec(layoutSection.body);
    if (codeMatch) {
      const lineRe = /^\s*([\w./-]+\.[a-z]+|[\w/-]+\/)\s+←\s+(.+?)$/gm;
      let m: RegExpExecArray | null;
      while ((m = lineRe.exec(codeMatch[1])) !== null) {
        filePointers.push({ label: m[1].trim(), detail: m[2].trim() });
      }
    }
  }

  // === Active commitments — top-level sections ===
  const activeCommitmentSections = acSections
    .filter(s => s.level === 2)
    .map(s => ({ id: s.id, heading: s.heading, summary: s.body.slice(0, 800) }));

  // === No-go list (evaluated & excluded grants/funders) ===
  const evaluatedSection = acSections.find(s => /evaluated.*excluded|excluded/i.test(s.heading));
  const noGoList: Array<{ name: string; reason: string; evaluatedDate?: string }> = [];
  if (evaluatedSection) {
    // Parse markdown table rows
    const rowRe = /^\|\s*\*?\*?(.+?)\*?\*?\s*(?:\(.+?\))?\s*\|\s*([^|]+?)\s*\|\s*[^|]*?\|\s*([^|]+?)\s*\|/gm;
    let mr: RegExpExecArray | null;
    while ((mr = rowRe.exec(evaluatedSection.body)) !== null) {
      const name = mr[1].trim();
      if (!name || /^(Funder|Source|---|:?-+:?)$/i.test(name)) continue;
      noGoList.push({
        name,
        evaluatedDate: mr[2].trim(),
        reason: mr[3].trim().slice(0, 400),
      });
    }
  }
  // Always-include from project memory
  if (!noGoList.find(n => /m[ée]rieux/i.test(n.name))) {
    noGoList.push({
      name: "Mérieux Foundation Small Grants Program",
      evaluatedDate: "2026-05-09",
      reason: "Geographic restriction: Global South only (Bangladesh, Benin, Brazil, Cambodia, Cameroon, Haiti, Madagascar, Mali, Senegal, Vietnam, etc.). No US/Texas eligibility. Same pattern as DANA Foundation and globalsouthopportunities.com.",
    });
  }

  // === Lessons learned ===
  const lessonsParsed = lessonSections
    .filter(s => s.level === 2 || s.level === 3)
    .map(s => ({
      id: s.id,
      title: s.heading,
      summary: s.body.slice(0, 600),
      sourceFile: s.sourceFile,
    }));

  // === Ecosystem platforms (LIVE from DB) ===
  const platforms = await loadEcosystemPlatformsFromDb();

  // === Session protocol (deterministic agent procedure) ===
  const sessionProtocol = {
    on_session_start: [
      "Read .agents/skills/alpha-omega/SKILL.md — Alpha ground truth before action; Omega proof before claim.",
      "Read replit.md — project overview, stack, gotchas, user preferences.",
      "Read docs/active-commitments.md — running session memory, active grants, partner pipeline.",
      "GET /api/agent/knowledge — load this compiled index for deterministic facts.",
      "If grant work: read docs/grants/QUARTET-ONE-PAGER.md before drafting narratives.",
    ],
    on_session_end: [
      "Complete .agents/sessions/alpha-omega-YYYY-MM-DD.md with Alpha evidence, Omega proofs, outcome, and residuals.",
      "Update docs/active-commitments.md with what changed (active grants, partner status, lessons).",
      "Run: tsx scripts/compile-agent-knowledge.ts to rebuild this index.",
      "Verify: GET /api/agent/knowledge returns updated compiledAt timestamp.",
    ],
    when_to_recompile: [
      "After editing replit.md (gotchas, user prefs, file pointers).",
      "After editing docs/active-commitments.md (commitments, no-go list).",
      "After editing .agents/skills/map-gap/lessons-learned.md.",
      "After ecosystem_platforms DB changes (platform add/remove, URL change).",
    ],
  };

  const fidelityDoctrineDoc = safeRead(resolve(ROOT, "docs/grants/RFP-FIDELITY-DOCTRINE.md"));
  const rfpFidelityDoctrine = {
    summary: "RFP Fidelity Doctrine: write TO the reviewer/scorer in THEIR language, in THEIR order, against THEIR scoring criteria. Reality is fixed; framing is ours.",
    pipeline: [
      "1. Upload base RFP + amendments + Q&A via POST /api/me/rfp-documents.",
      "2. Extract compliance matrix: POST /api/me/rfp-fidelity/:grantId/extract (every shall/must/will/should/may, tagged L/M/C).",
      "3. Review at /grants/:grantId/compliance: set evidenceRef, answeringSectionName, status, confidence per item. AI-propose workaround for gaps.",
      "4. Generate draft: POST /api/me/grant-narratives/generate — drafter spine = matrix (not just rubric).",
      "5. Final audit: GET /api/me/rfp-fidelity/:grantId/audit — must return ok:true and sectionLNoncompliance:[] before submit.",
    ],
    section_L_vs_M: "Section L (instructions/format/page/font/attachments) noncompliance = rejection BEFORE Section M (evaluation) is scored. Treat L as a pre-flight gate.",
    source_precedence: "Q&A > Amendment > Base RFP > Pre-bid meeting notes.",
    workaround_posture: "Hybrid: only propose workarounds for real gaps (no evidence or confidence < 70). If RFP is silent on teaming/subs, flag 'requires verification.' If no realistic workaround, disclose honestly.",
    drafter_pattern: "Each Section M paragraph opens: 'In response to [reqNumber]'s requirement that [verbatim shall/must clause], TCAF...' and ends: '[Evidence: <evidenceRef>]'. Gaps get appended {{ACTION REQUIRED: ...}}.",
    code: {
      schema: "shared/schema.ts → complianceMatrixItems",
      engine: "server/rfp-fidelity-engine.ts",
      routes: "server/rfp-fidelity-routes.ts (/api/me/rfp-fidelity/...)",
      drafter: "server/rfp-rubric.ts → generateDraftFromRubric(complianceMatrix)",
      narrative: "server/grant-narrative-routes.ts → POST /api/me/grant-narratives/generate (returns complianceMatrixUsed)",
      ui: "/grants/:grantId/compliance → client/src/pages/rfp-fidelity-page.tsx",
      doctrine_doc: "docs/grants/RFP-FIDELITY-DOCTRINE.md",
    },
    full_text: fidelityDoctrineDoc?.content ?? "(doctrine doc not found at docs/grants/RFP-FIDELITY-DOCTRINE.md)",
  };

  const compiled = {
    version: "1.2.0",
    compiledAt: new Date().toISOString(),
    sources: [
      { path: "replit.md", mtime: replitMd.mtime },
      activeCommitments && { path: "docs/active-commitments.md", mtime: activeCommitments.mtime },
      lessons && { path: ".agents/skills/map-gap/lessons-learned.md", mtime: lessons.mtime },
      ecosystemCatalog && { path: "docs/ecosystem-catalog.md", mtime: ecosystemCatalog.mtime },
      fosterBuildLog && { path: "docs/foster-youth-build-log.md", mtime: fosterBuildLog.mtime },
      { path: "DB:ecosystem_platforms", mtime: new Date().toISOString() },
    ].filter(Boolean),
    project,
    stack,
    file_pointers: filePointers,
    gotchas,
    user_preferences: userPreferences,
    vocab,
    platforms,
    quintet,
    ecosystem_caveats: ecosystemCaveats,
    active_commitments: {
      sections: activeCommitmentSections,
      no_go_list: noGoList,
    },
    lessons_learned: lessonsParsed,
    foster_youth_build_log: fosterBuildLogSections.map(s => ({
      id: s.id,
      heading: s.heading,
      level: s.level,
      body: s.body,
      sourceFile: s.sourceFile,
    })),
    session_protocol: sessionProtocol,
    rfp_fidelity_doctrine: rfpFidelityDoctrine,
    counts: {
      gotchas: gotchas.length,
      vocab: vocab.length,
      platforms: platforms.length,
      file_pointers: filePointers.length,
      lessons: lessonsParsed.length,
      no_go: noGoList.length,
      active_commitment_sections: activeCommitmentSections.length,
      ecosystem_caveats: ecosystemCaveats.length,
      foster_youth_build_log_sections: fosterBuildLogSections.length,
    },
  };

  writeFileSync(OUT_PATH, JSON.stringify(compiled, null, 2), "utf-8");
  console.log("[compile-agent-knowledge] WROTE", OUT_PATH);
  console.log("[compile-agent-knowledge] Counts:", compiled.counts);
  process.exit(0);
}

main().catch(err => {
  console.error("[compile-agent-knowledge] FAILED:", err);
  process.exit(1);
});
