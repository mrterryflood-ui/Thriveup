import { db } from "./storage";
import { rfpDocuments, rfpRubrics, organizations, grantOpportunities, type Organization, type GrantOpportunity, type RfpDocument } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { generateAIJSON, generateAIResponse, withRfpTemplateDiscipline } from "./ai-provider";
import type { AgencyIntel } from "./agency-intelligence";
import type { FoundationIntel } from "./foundation-intelligence";
import { buildWonProposalsBlock } from "./won-proposals";
import type { WonProposal } from "@shared/schema";
import type { ActiveBid, ActiveBidRubricLine } from "@shared/active-bids";
import type { ComplianceMatrixItem } from "@shared/schema";
import { buildComplianceMatrixBlock } from "./rfp-fidelity-engine";

export type RubricSection = {
  name: string;
  pointValue?: number;
  requirements: string[];
  headingPattern?: string;
  toneNotes?: string;
};

export type ExtractedRubric = {
  sections: RubricSection[];
  pageLimit?: string;
  wordLimit?: string;
  submissionFormat?: string;
  totalPoints?: number;
  notes?: string;
};

const RUBRIC_EXTRACTION_SYS = `You extract evaluation rubrics from grant RFPs / NOFOs / FOAs / solicitations. Return strict JSON:
{
  "sections": [
    {
      "name": "Section name as it appears in the RFP",
      "pointValue": <number or null if not stated>,
      "requirements": ["sub-bullet 1", "sub-bullet 2"],
      "headingPattern": "exact heading style the RFP uses, e.g. 'A. Statement of Need'",
      "toneNotes": "short note on tone/formality for this section if discernible"
    }
  ],
  "pageLimit": "e.g. '15 pages, single-spaced' or null",
  "wordLimit": "e.g. '5000 words' or null",
  "submissionFormat": "e.g. 'PDF via Grants.gov' or null",
  "totalPoints": <sum or null>,
  "notes": "any other critical compliance constraints (font, margins, attachments, etc.)"
}

Rules:
- Extract ONLY what is in the supplied document. Do not invent criteria, point values, or limits.
- Preserve the RFP's exact section names and heading patterns. Reviewers look for these.
- If a section has sub-criteria with their own points, list them as separate sections.
- If point values are not stated, set pointValue to null. Do not guess.`;

export async function extractRubric(rfpText: string): Promise<ExtractedRubric> {
  const trimmed = rfpText.slice(0, 80000);
  const ai = await generateAIJSON<Record<string, unknown>>(
    `Extract the rubric from this RFP:\n\n${trimmed}`,
    RUBRIC_EXTRACTION_SYS,
  );
  const parsed = (ai && typeof ai === "object") ? ai : {};
  const sections = Array.isArray(parsed.sections) ? (parsed.sections as unknown[]).map((s) => {
    const o = (s && typeof s === "object") ? s as Record<string, unknown> : {};
    return {
      name: String(o.name ?? "Untitled Section"),
      pointValue: typeof o.pointValue === "number" ? o.pointValue : undefined,
      requirements: Array.isArray(o.requirements) ? (o.requirements as unknown[]).map(String) : [],
      headingPattern: typeof o.headingPattern === "string" ? o.headingPattern : undefined,
      toneNotes: typeof o.toneNotes === "string" ? o.toneNotes : undefined,
    };
  }) : [];
  return {
    sections,
    pageLimit: typeof parsed.pageLimit === "string" ? parsed.pageLimit : undefined,
    wordLimit: typeof parsed.wordLimit === "string" ? parsed.wordLimit : undefined,
    submissionFormat: typeof parsed.submissionFormat === "string" ? parsed.submissionFormat : undefined,
    totalPoints: typeof parsed.totalPoints === "number" ? parsed.totalPoints : undefined,
    notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
  };
}

export async function getOrExtractRubric(documentId: string, rfpText: string): Promise<ExtractedRubric> {
  const [cached] = await db.select().from(rfpRubrics).where(eq(rfpRubrics.documentId, documentId));
  if (cached) return cached.rubric as ExtractedRubric;
  const rubric = await extractRubric(rfpText);
  await db.insert(rfpRubrics).values({ documentId, rubric }).onConflictDoUpdate({
    target: rfpRubrics.documentId,
    set: { rubric, extractedAt: new Date() },
  });
  return rubric;
}

// Layer documents in precedence order: qa > amendment > base
export async function loadRfpDocumentStack(orgId: string, grantId: string | null): Promise<{ base: RfpDocument | null; amendments: RfpDocument[]; qa: RfpDocument[] }> {
  const conds = [eq(rfpDocuments.orgId, orgId)];
  if (grantId) conds.push(eq(rfpDocuments.grantId, grantId));
  const docs = await db.select().from(rfpDocuments).where(and(...conds)).orderBy(desc(rfpDocuments.uploadedAt));
  return {
    base: docs.find(d => d.kind === "base") ?? null,
    amendments: docs.filter(d => d.kind === "amendment").sort((a, b) => a.version - b.version),
    qa: docs.filter(d => d.kind === "qa"),
  };
}

function buildContextStack(stack: { base: RfpDocument | null; amendments: RfpDocument[]; qa: RfpDocument[] }): string {
  const parts: string[] = [];
  if (stack.base) {
    parts.push(`=== BASE RFP: ${stack.base.title} ===\n${stack.base.parsedText.slice(0, 30000)}`);
  }
  for (const a of stack.amendments) {
    parts.push(`=== AMENDMENT ${a.version}: ${a.title} (OVERRIDES BASE ON CONFLICT) ===\n${a.parsedText.slice(0, 15000)}`);
  }
  for (const q of stack.qa) {
    parts.push(`=== Q&A: ${q.title} (BINDING INTERPRETATION — OVERRIDES ALL ON CONFLICT) ===\n${q.parsedText.slice(0, 15000)}`);
  }
  return parts.join("\n\n");
}

function buildOrgBlock(org: Organization): string {
  return [
    `Organization: ${org.name}`,
    org.ein ? `EIN: ${org.ein}` : null,
    org.is501c3 ? `Status: 501(c)(3) public charity` : `Status: ${org.is501c3 ? "501(c)(3)" : "not 501(c)(3) / unconfirmed"}`,
    `Mission: ${org.missionText || "(not provided)"}`,
    `Capabilities: ${org.capabilityStatementText || "(not provided)"}`,
    `Focus areas: ${(org.focusAreas ?? []).join(", ") || "(none)"}`,
    `Populations served: ${(org.populationsServed ?? []).join(", ") || "(none)"}`,
    `Geography served: ${org.state ?? "(not specified)"}${org.counties?.length ? ` — counties: ${org.counties.join(", ")}` : ""}`,
    `Budget range: ${org.budgetRange || "(not specified)"}`,
  ].filter(Boolean).join("\n");
}

function buildFoundationIntelBlock(intel: FoundationIntel | null): string {
  if (!intel) return "(no foundation intelligence available)";
  return [
    `Foundation: ${intel.funderName}${intel.ein ? ` (EIN ${intel.ein})` : ""}`,
    `Most recent 990 on file: FY ${intel.recentFiscalYear ?? "unknown"}${intel.totalGrantsPaid ? ` · total grants paid that year ≈ $${(intel.totalGrantsPaid / 1_000_000).toFixed(2)}M` : ""}`,
    `Typical grant size: ${intel.typicalGrantSize ?? "unknown"}`,
    `What this foundation funds: ${intel.whatTheyFund}`,
    `Documented funding priorities:\n  ${(intel.fundingPriorities ?? []).map(p => `• ${p}`).join("\n  ") || "(none extracted)"}`,
    `Winning-language patterns to mirror:\n  ${(intel.languagePatterns ?? []).map(p => `• ${p}`).join("\n  ") || "(none extracted)"}`,
    `Geographic focus: ${intel.geographicFocus ?? "unknown"}`,
    `Source: ${intel.source}`,
  ].join("\n");
}

function buildAgencyIntelBlock(intel: AgencyIntel | null): string {
  if (!intel) return "(no agency intelligence available)";
  const winners = intel.recentWinners.slice(0, 8).map(w => `  • ${w.recipient}${w.amount ? ` ($${w.amount.toLocaleString()})` : ""}${w.year ? ` [${w.year}]` : ""}${w.project ? ` — ${w.project.slice(0, 120)}` : ""}`).join("\n");

  const lines: string[] = [
    `Agency: ${intel.agencyName}`,
    `Typical award size: ${intel.typicalAwardSize ?? "unknown"}`,
    `What this agency funds: ${intel.whatTheyFund}`,
    `Winning-language patterns to mirror:\n  ${intel.languagePatterns.map(p => `• ${p}`).join("\n  ") || "(none detected)"}`,
    `Recent winners (mirror their framing where applicable):\n${winners || "  (none on file)"}`,
  ];

  // ── Static profile layer (program-level intelligence) ─────────────────────
  const p = intel.profile;
  if (p) {
    lines.push(`\n=== AGENCY PROGRAM INTELLIGENCE: ${p.abbreviation} ===`);

    // Required forms checklist
    const required = p.requiredForms.filter(f => f.required);
    const conditional = p.requiredForms.filter(f => !f.required);
    if (required.length) {
      lines.push(`\nREQUIRED FORMS (every application must include these):`);
      for (const f of required) {
        lines.push(`  ✓ ${f.name} — ${f.description} [${f.url}]`);
      }
    }
    if (conditional.length) {
      lines.push(`\nCONDITIONAL FORMS (include when applicable):`);
      for (const f of conditional) {
        lines.push(`  ○ ${f.name}${f.whenRequired ? ` (when: ${f.whenRequired})` : ""} — ${f.description}`);
      }
    }

    // Performance system — write to THESE metrics
    lines.push(`\nMANDATORY PERFORMANCE SYSTEM (post-award reporting):\n  ${p.performanceSystem.slice(0, 400)}`);

    // Language dictionary — exact terminology
    lines.push(`\nAGENCY LANGUAGE DICTIONARY (use these exact terms — reviewers notice when you don't):\n  ${p.languageDictionary.slice(0, 20).map(t => `• ${t}`).join("\n  ")}`);

    // Evidence requirements
    lines.push(`\nEVIDENCE REQUIREMENTS:\n  ${p.evidenceRequirement.slice(0, 300)}`);

    // Budget rules
    lines.push(`\nBUDGET RULES:\n  ${p.budgetRules.slice(0, 300)}`);

    // Evaluation signals
    if (p.evaluationSignals.whatTheyScore.length) {
      lines.push(`\nWHAT REVIEWERS SCORE (write to each of these):`);
      for (const s of p.evaluationSignals.whatTheyScore) {
        lines.push(`  → ${s}`);
      }
    }
    if (p.evaluationSignals.winFactors.length) {
      lines.push(`\nWIN FACTORS (explicitly include these):`);
      for (const w of p.evaluationSignals.winFactors) {
        lines.push(`  ★ ${w}`);
      }
    }
    if (p.evaluationSignals.commonDisqualifiers.length) {
      lines.push(`\nCOMMON DISQUALIFIERS (do not trigger these):`);
      for (const d of p.evaluationSignals.commonDisqualifiers) {
        lines.push(`  ✗ ${d}`);
      }
    }

    // Resource page updates (monthly crawl)
    if (p.resourcePageUpdates) {
      lines.push(`\n⚠ RECENT AGENCY GUIDANCE UPDATE (fetched from ${p.resourcesUrl}):\n  ${p.resourcePageUpdates}`);
    }
  }

  return lines.join("\n");
}

export type DraftSection = { sectionName: string; pointValue?: number; body: string };
export type GeneratedDraft = { sections: DraftSection[]; complianceNotes: string };

// Format an active_bids row as a prompt block the AI engine uses to set
// per-criterion cadence. This is the bridge between the tracking dashboard
// (where we self-rate confidence per criterion + name the team lane that
// covers it) and the writer engine (which needs to know "this is the cadence,
// these are the evidence pointers, this is the partner lane on this section").
export function buildInternalStrategyBlock(bid: ActiveBid): string {
  const lines: string[] = [
    `RFP ID: ${bid.rfpId}`,
    `Funder: ${bid.funder}`,
    `Named team (lanes confirmed for THIS bid only — no standing default team): ${bid.teamIds.join(", ")}`,
    `Notes: ${bid.notes}`,
    `Submission requirements: ${bid.submission}`,
    ``,
    `Per-criterion strategy (mirror this cadence — match the criterion name verbatim, lead with the response, cite the evidence tab):`,
  ];
  for (const r of bid.rubric as ActiveBidRubricLine[]) {
    const pts = r.weight > 0 ? `${r.weight} pts` : "informational";
    const conf = r.weight > 0 ? ` · team confidence ${Math.round(r.confidence * 100)}%` : "";
    lines.push(`  • ${r.criterion} (${pts}${conf})`);
    lines.push(`      Response cadence: ${r.ourResponse}`);
    if (r.evidence) lines.push(`      Evidence pointer: ${r.evidence}`);
  }
  lines.push(``);
  lines.push(`Rule: every section of your draft must map to one of these criteria. Use the exact criterion names from this list as section headings (or as close as the RFP's heading style allows). Lead each section with the response cadence above and weave in the named evidence. If a criterion has team confidence below 70%, surface the gap honestly — do not inflate.`);
  return lines.join("\n");
}

export async function generateDraftFromRubric(params: {
  rubric: ExtractedRubric;
  org: Organization;
  grant: GrantOpportunity | null;
  agencyIntel: AgencyIntel | null;
  foundationIntel?: FoundationIntel | null;
  wonProposals?: WonProposal[];
  docStack: { base: RfpDocument | null; amendments: RfpDocument[]; qa: RfpDocument[] };
  internalStrategy?: ActiveBid | null;
  complianceMatrix?: ComplianceMatrixItem[] | null;
}): Promise<GeneratedDraft> {
  const { rubric, org, grant, agencyIntel, foundationIntel, wonProposals, docStack, internalStrategy, complianceMatrix } = params;
  const sectionList = rubric.sections.map((s, i) => `${i + 1}. ${s.headingPattern || s.name}${s.pointValue ? ` (${s.pointValue} pts)` : ""}\n   Requirements: ${s.requirements.join("; ") || "(see RFP)"}\n   Tone: ${s.toneNotes ?? "match RFP voice"}`).join("\n\n");
  const wins = wonProposals ?? [];
  const sys = withRfpTemplateDiscipline(`You are writing a grant proposal section-by-section against the supplied rubric AND compliance matrix. Return strict JSON: {"sections": [{"sectionName": "...", "pointValue": <number|null>, "body": "<the actual proposal text for this section, mirroring the RFP's tone, terminology, and heading style>"}], "complianceNotes": "short note on what compliance items still need user action (forms, signatures, attachments)"}.

WRITING POSTURE — non-negotiable:
- The contracting officer / program officer / review panel is the reader. The RFP is their requirements document. Write TO them, in THEIR language, in THEIR order, against THEIR scoring weights.
- Reality is fixed: never invent facts about the organization. Use ONLY the supplied organization profile, prior winning proposals, and the active-bid internal strategy as evidence.
- Framing, ordering, alignment are ours to control: mirror the RFP's section names, heading patterns, terminology, and tone. Honor page/word limits. Apply amendments and Q&A clarifications.

IF A COMPLIANCE MATRIX IS PROVIDED (read it as your spine):
- Every Section M (evaluation) requirement gets a paragraph response that opens with the RFP's own factor language.
  Pattern: "In response to [reqNumber]'s requirement that [verbatim shall/must clause], [TCAF answer using org evidence]."
- End each paragraph with an inline trace tag: [Evidence: <evidenceRef from the matrix>]. Reviewers trace claim → requirement → score this way.
- For items with a Workaround note, write the response AS IF the workaround is in place AND append {{ACTION REQUIRED: <workaround>}} at the end of that paragraph.
- For items with no evidence and no workaround, append {{ACTION REQUIRED: <specifically what is needed>}} — do not fabricate.
- Section L items (instructions/format/page/font/attachments) are NOT body sections; surface them in "complianceNotes" as a numbered submission checklist.

If PRIOR WINNING PROPOSALS are provided, match the org's voice (their cadence, signature phrases, the way they cite outcomes) while still mirroring the new RFP's structure. Never copy winning text verbatim.`);

  const userPrompt = [
    `=== RUBRIC TO WRITE TO ===`,
    `Total points: ${rubric.totalPoints ?? "not stated"}`,
    `Page limit: ${rubric.pageLimit ?? "not stated"}`,
    `Word limit: ${rubric.wordLimit ?? "not stated"}`,
    `Submission format: ${rubric.submissionFormat ?? "not stated"}`,
    `Compliance notes from RFP: ${rubric.notes ?? "none extracted"}`,
    ``,
    `Sections (write one body per section, in this order):`,
    sectionList,
    ``,
    `=== APPLICANT ORGANIZATION (use ONLY these facts) ===`,
    buildOrgBlock(org),
    ``,
    grant ? `=== GRANT METADATA ===\nTitle: ${grant.title}\nAgency: ${grant.agency ?? "unknown"}\nAmount: ${grant.fundingAmount ?? "unspecified"}\nDeadline: ${grant.deadline?.toISOString().slice(0, 10) ?? "rolling"}\n` : "",
    foundationIntel ? `=== FOUNDATION INTELLIGENCE (mirror winning language) ===\n${buildFoundationIntelBlock(foundationIntel)}` : `=== AGENCY INTELLIGENCE (mirror winning language) ===\n${buildAgencyIntelBlock(agencyIntel)}`,
    ``,
    `=== PRIOR WINNING PROPOSALS BY THIS ORGANIZATION (match their voice) ===`,
    buildWonProposalsBlock(wins),
    ``,
    internalStrategy
      ? `=== INTERNAL TEAM CADENCE (per-criterion strategy from the tracking dashboard — mirror this) ===\n${buildInternalStrategyBlock(internalStrategy)}`
      : `=== INTERNAL TEAM CADENCE ===\n(no active_bids row for this RFP; falling back to rubric-only structure)`,
    ``,
    `=== COMPLIANCE MATRIX (RFP Fidelity Engine — mirror this back factor-by-factor) ===`,
    buildComplianceMatrixBlock(complianceMatrix ?? []),
    ``,
    `=== SOURCE DOCUMENTS (precedence: Q&A > Amendment > Base) ===`,
    buildContextStack(docStack),
  ].join("\n");

  const text = await generateAIResponse(
    [{ role: "system", content: sys }, { role: "user", content: userPrompt }],
    8000,
  );
  let parsed: Record<string, unknown> = {};
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch { parsed = {}; }
  const sections = Array.isArray(parsed.sections) ? (parsed.sections as unknown[]).map((s) => {
    const o = (s && typeof s === "object") ? s as Record<string, unknown> : {};
    return {
      sectionName: String(o.sectionName ?? "Untitled"),
      pointValue: typeof o.pointValue === "number" ? o.pointValue : undefined,
      body: String(o.body ?? ""),
    };
  }) : [];
  return {
    sections,
    complianceNotes: typeof parsed.complianceNotes === "string" ? parsed.complianceNotes : "",
  };
}

export type CoverageRow = { sectionName: string; pointValue?: number; covered: boolean; evidenceCited: boolean; weakSignals: string[] };
export type RubricCoverage = { rows: CoverageRow[]; overallScore: number };

export async function scoreDraftAgainstRubric(draft: GeneratedDraft, rubric: ExtractedRubric): Promise<RubricCoverage> {
  const sys = withRfpTemplateDiscipline(`You are a hostile grant reviewer. For each rubric section, evaluate whether the corresponding draft section: (a) directly addresses every requirement, (b) cites evidence, (c) mirrors the RFP's tone and section structure. Return strict JSON: {"rows": [{"sectionName": "...", "pointValue": <number|null>, "covered": <bool>, "evidenceCited": <bool>, "weakSignals": ["short phrase", ...]}], "overallScore": <0-100 estimated reviewer score>}`);
  const userPrompt = `RUBRIC:\n${JSON.stringify(rubric.sections, null, 2)}\n\nDRAFT:\n${JSON.stringify(draft.sections, null, 2)}`;
  const ai = await generateAIJSON<Record<string, unknown>>(userPrompt, sys);
  const parsed = (ai && typeof ai === "object") ? ai : {};
  const rows = Array.isArray(parsed.rows) ? (parsed.rows as unknown[]).map((r) => {
    const o = (r && typeof r === "object") ? r as Record<string, unknown> : {};
    return {
      sectionName: String(o.sectionName ?? ""),
      pointValue: typeof o.pointValue === "number" ? o.pointValue : undefined,
      covered: Boolean(o.covered),
      evidenceCited: Boolean(o.evidenceCited),
      weakSignals: Array.isArray(o.weakSignals) ? (o.weakSignals as unknown[]).map(String).slice(0, 5) : [],
    };
  }) : [];
  return { rows, overallScore: typeof parsed.overallScore === "number" ? parsed.overallScore : 0 };
}
