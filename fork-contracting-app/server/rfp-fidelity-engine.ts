// RFP Fidelity Engine
// =====================
// Contracting officers / program officers / review panels are the customer.
// The RFP and its rubric/instructions are their requirements document. We
// answer them in their language, in their order, against their scoring
// criteria, with verifiable fidelity.
//
// Reality is fixed — we never distort facts. Framing, ordering, and
// alignment are ours to control. We use the RFP's structure, language, and
// weightings as the spine, then position our actual capabilities as evidence
// against each requirement.
//
// Section L (instructions to offerors: page count, font, margins, attachments,
// transmission channel) vs Section M (evaluation factors) are tracked
// separately because L noncompliance gets a proposal rejected BEFORE M is
// even scored.

import { db } from "./storage";
import { complianceMatrixItems, type ComplianceMatrixItem, type InsertComplianceMatrixItem } from "@shared/schema";
import { and, asc, eq } from "drizzle-orm";
import { generateAIJSON, withEthicalPreamble } from "./ai-provider";
import type { RfpDocument } from "@shared/schema";

export type ExtractedRequirement = {
  reqNumber: string;
  rfpSection: string;
  sectionType: "L" | "M" | "C" | "other";
  requirementVerbatim: string;
  requirementType: "shall" | "must" | "will" | "should" | "may" | "informational";
  scoringWeight: number | null;
  sourceKind: "base" | "amendment" | "qa" | "meeting-notes";
};

const EXTRACTION_SYS = withEthicalPreamble(`You extract a compliance matrix from a federal/state/local/foundation RFP / NOFO / FOAA / solicitation, including amendments and Q&A. Return strict JSON:
{
  "items": [
    {
      "reqNumber": "stable id like 'L.3.2-a' or 'M-4-3' or 'C.2.1'",
      "rfpSection": "exact RFP section heading, e.g. 'Section L.3.2 — Past Performance'",
      "sectionType": "L | M | C | other",
      "requirementVerbatim": "the EXACT sentence(s) of the requirement, copied verbatim from the RFP. No paraphrasing.",
      "requirementType": "shall | must | will | should | may | informational",
      "scoringWeight": <number or null>
    }
  ]
}

Rules — these are non-negotiable:
- Extract every "shall", "must", "will", "the Offeror will/shall", "the Contractor shall", "is required to", "no later than", "page limit", "font", "margin", "in [N] pages or fewer", and every numbered/lettered evaluation factor. Do NOT skip any.
- Tag sectionType correctly:
  - L = Instructions to Offerors (format, submission channel, page count, font, margins, attachments, signatures, copies, transmission)
  - M = Evaluation Factors / Selection Criteria / Scoring
  - C = Statement of Work / Performance Work Statement / Scope
  - other = anything else (background, definitions, etc.) — usually informational
- requirementVerbatim must be the RFP's words. Reviewers search for their own language. Do not summarize.
- If a single sentence contains multiple requirements (e.g. "The Offeror shall submit a Past Performance Volume in 10 pages or fewer using 12-point Times New Roman"), split into separate items.
- If scoringWeight is not stated for an item, set to null. Do not guess.
- Preserve numbering hierarchy in reqNumber so items sort naturally.`);

export async function extractComplianceMatrix(opts: {
  base: string;
  amendments: { text: string; version: number }[];
  qa: { text: string }[];
  meetingNotes?: string;
}): Promise<ExtractedRequirement[]> {
  const sections: string[] = [`=== BASE RFP ===\n${opts.base.slice(0, 60000)}`];
  for (const a of opts.amendments) sections.push(`=== AMENDMENT v${a.version} (supersedes base where in conflict) ===\n${a.text.slice(0, 20000)}`);
  for (const q of opts.qa) sections.push(`=== Q&A (supersedes base + amendment where in conflict) ===\n${q.text.slice(0, 20000)}`);
  if (opts.meetingNotes) sections.push(`=== MEETING / PRE-BID NOTES ===\n${opts.meetingNotes.slice(0, 10000)}`);

  const aiOut = await generateAIJSON<Record<string, unknown>>(
    `Extract the compliance matrix from this combined RFP source stack. Source precedence: Q&A > Amendment > Base > Meeting Notes. When in conflict, use the higher-precedence source's wording and tag the source.\n\n${sections.join("\n\n")}`,
    EXTRACTION_SYS,
  );

  const items = Array.isArray(aiOut?.items) ? (aiOut.items as unknown[]) : [];
  const normalized: ExtractedRequirement[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const reqType = String(o.requirementType ?? "").toLowerCase();
    const allowed = ["shall", "must", "will", "should", "may", "informational"] as const;
    const requirementType = (allowed as readonly string[]).includes(reqType) ? (reqType as ExtractedRequirement["requirementType"]) : "informational";
    const sType = String(o.sectionType ?? "M").toUpperCase();
    const sectionType: ExtractedRequirement["sectionType"] = sType === "L" || sType === "M" || sType === "C" ? (sType as "L" | "M" | "C") : "other";
    const verbatim = String(o.requirementVerbatim ?? "").trim();
    if (!verbatim) continue;
    normalized.push({
      reqNumber: String(o.reqNumber ?? "").trim() || `auto-${normalized.length + 1}`,
      rfpSection: String(o.rfpSection ?? "Unspecified Section").trim(),
      sectionType,
      requirementVerbatim: verbatim,
      requirementType,
      scoringWeight: typeof o.scoringWeight === "number" ? o.scoringWeight : null,
      sourceKind: "base", // overwritten by caller per-source when we know which document chunk produced it
    });
  }
  return normalized;
}

// Persist extracted matrix, replacing prior auto-extracted items for this
// grant so re-extracts stay clean. Manually-edited items (status !== "open"
// AND answeringSectionName set) are preserved by reqNumber match.
export async function saveComplianceMatrix(opts: {
  orgId: string;
  grantId: string;
  documentId: string;
  items: ExtractedRequirement[];
}): Promise<ComplianceMatrixItem[]> {
  const existing = await db.select().from(complianceMatrixItems).where(and(
    eq(complianceMatrixItems.orgId, opts.orgId),
    eq(complianceMatrixItems.grantId, opts.grantId),
  ));
  const preserveByReq = new Map<string, ComplianceMatrixItem>();
  for (const e of existing) {
    if (e.status !== "open" || e.answeringSectionName || e.workaroundProposed || e.evidenceRef) {
      preserveByReq.set(e.reqNumber, e);
    }
  }
  // Wipe + reinsert. Preserved fields (status, evidence, workaround, answering section, confidence) get re-applied on match.
  await db.delete(complianceMatrixItems).where(and(
    eq(complianceMatrixItems.orgId, opts.orgId),
    eq(complianceMatrixItems.grantId, opts.grantId),
  ));
  const rows: InsertComplianceMatrixItem[] = opts.items.map((it) => {
    const preserved = preserveByReq.get(it.reqNumber);
    return {
      orgId: opts.orgId,
      grantId: opts.grantId,
      documentId: opts.documentId,
      reqNumber: it.reqNumber,
      rfpSection: it.rfpSection,
      sectionType: it.sectionType,
      requirementVerbatim: it.requirementVerbatim,
      requirementType: it.requirementType,
      scoringWeight: it.scoringWeight ?? null,
      sourceKind: it.sourceKind,
      evidenceRef: preserved?.evidenceRef ?? "",
      workaroundProposed: preserved?.workaroundProposed ?? "",
      answeringSectionName: preserved?.answeringSectionName ?? "",
      status: preserved?.status ?? "open",
      confidence: preserved?.confidence ?? 0,
    };
  });
  if (rows.length === 0) return [];
  const inserted = await db.insert(complianceMatrixItems).values(rows).returning();
  return inserted;
}

export async function loadComplianceMatrix(orgId: string, grantId: string): Promise<ComplianceMatrixItem[]> {
  return await db.select().from(complianceMatrixItems).where(and(
    eq(complianceMatrixItems.orgId, orgId),
    eq(complianceMatrixItems.grantId, grantId),
  )).orderBy(asc(complianceMatrixItems.sectionType), asc(complianceMatrixItems.reqNumber));
}

// Format the matrix as a prompt block the drafter uses to mirror the RFP
// back at the evaluator factor-by-factor.
export function buildComplianceMatrixBlock(items: ComplianceMatrixItem[]): string {
  if (items.length === 0) return "(no compliance matrix extracted yet — drafter falling back to rubric-only structure)";
  const byType: Record<string, ComplianceMatrixItem[]> = { L: [], M: [], C: [], other: [] };
  for (const it of items) (byType[it.sectionType] ?? byType.other).push(it);
  const out: string[] = [];
  const fmt = (label: string, rows: ComplianceMatrixItem[]) => {
    if (rows.length === 0) return;
    out.push(`--- ${label} ---`);
    for (const r of rows) {
      const wt = r.scoringWeight ? ` [${r.scoringWeight} pts]` : "";
      const ev = r.evidenceRef ? ` | Evidence: ${r.evidenceRef}` : "";
      const wa = r.workaroundProposed ? ` | Workaround: ${r.workaroundProposed}` : "";
      out.push(`  ${r.reqNumber} (${r.requirementType.toUpperCase()}) — ${r.rfpSection}${wt}`);
      out.push(`    Verbatim: "${r.requirementVerbatim}"`);
      if (ev || wa) out.push(`   ${ev}${wa}`.trimStart());
    }
  };
  fmt("SECTION L — Instructions to Offerors (FORMAT-CRITICAL — noncompliance = rejection before scoring)", byType.L);
  fmt("SECTION M — Evaluation Factors (SCORED)", byType.M);
  fmt("SECTION C — Statement of Work / Scope", byType.C);
  fmt("OTHER / INFORMATIONAL", byType.other);
  out.push("");
  out.push("DRAFTER RULES:");
  out.push("1. Every Section M item must have a paragraph response that opens with the RFP's own factor language.");
  out.push("   Pattern: 'In response to [reqNumber]'s requirement that [verbatim shall/must clause], [TCAF answer using org evidence].'");
  out.push("2. Every Section L item must be satisfied in the submission package (format, page count, font, margins, attachments).");
  out.push("3. Each paragraph must include an inline evidence tag in brackets at the end: [Evidence: <evidenceRef>]. Reviewers trace claim → requirement → score this way.");
  out.push("4. If an item has a Workaround note, write the response AS IF the workaround is in place AND emit an `{{ACTION REQUIRED: <workaround>}}` flag at the end of that paragraph.");
  out.push("5. If an item has no evidence and no workaround, write `{{ACTION REQUIRED: <what is needed>}}` — do not fabricate.");
  return out.join("\n");
}

// Hybrid workaround proposer. Only suggests workarounds when there's an
// actual gap (no evidence, low confidence, or status=gap). If we're a clean
// fit, returns null — we don't force support we don't need.
const WORKAROUND_SYS = withEthicalPreamble(`You propose realistic, RFP-permissible workarounds for procurement gaps. Hybrid posture:
- If the org clearly meets the requirement (evidenceRef present, confidence >= 70), return {"workaround": null, "reasoning": "clean fit — no workaround needed"}.
- If there is a real gap, return a SPECIFIC workaround a contracting officer would accept: named teaming sub, MOU with named-type partner, phased delivery, key personnel hire-on-award commitment, CPA-attested financial statement, prime/sub arrangement, joint venture, letter of credit/bonding partner, etc.
- Hybrid permissibility: if the RFP explicitly allows teaming/subs/JVs, propose freely. If silent, propose AND note "requires verification that this is permissible under this solicitation."
- If the gap cannot be reasonably worked around (e.g. minimum 3-year past performance and we have 18 months), say so honestly: {"workaround": null, "reasoning": "no realistic workaround — disclose honestly + emphasize other strengths"}.

Return strict JSON: {"workaround": "<one-sentence workaround or null>", "reasoning": "<why>"}`);

export async function proposeWorkaround(opts: {
  item: ComplianceMatrixItem;
  orgCapabilitiesSummary: string;
  rfpAllowsTeaming: boolean | null; // null = unknown
}): Promise<{ workaround: string | null; reasoning: string }> {
  // Short-circuit: clean fit = no workaround
  if (opts.item.evidenceRef && opts.item.confidence >= 70 && opts.item.status !== "gap") {
    return { workaround: null, reasoning: "clean fit — no workaround needed" };
  }
  const userPrompt = [
    `REQUIREMENT (${opts.item.reqNumber} · ${opts.item.requirementType.toUpperCase()} · ${opts.item.rfpSection})`,
    `Verbatim: "${opts.item.requirementVerbatim}"`,
    `Current evidence on file: ${opts.item.evidenceRef || "(none)"}`,
    `Current confidence: ${opts.item.confidence}%`,
    `RFP teaming/subcontracting allowed: ${opts.rfpAllowsTeaming === null ? "unknown / silent" : opts.rfpAllowsTeaming ? "YES — explicit" : "NO — explicit"}`,
    ``,
    `Org capabilities snapshot:`,
    opts.orgCapabilitiesSummary,
  ].join("\n");
  const out = await generateAIJSON<{ workaround?: string | null; reasoning?: string }>(userPrompt, WORKAROUND_SYS);
  const workaround = typeof out?.workaround === "string" && out.workaround.trim() ? out.workaround.trim() : null;
  return { workaround, reasoning: typeof out?.reasoning === "string" ? out.reasoning : "" };
}

// Final fidelity audit: walks the matrix, confirms every shall/must has an
// answering section OR a workaround. Returns gaps. Pre-submit gate.
export type FidelityAuditResult = {
  ok: boolean;
  totalShallMust: number;
  covered: number;
  withWorkaround: number;
  gaps: Array<{ reqNumber: string; rfpSection: string; sectionType: string; requirementVerbatim: string; reason: string }>;
  sectionLNoncompliance: Array<{ reqNumber: string; rfpSection: string; requirementVerbatim: string; reason: string }>;
};

export function runFidelityAudit(items: ComplianceMatrixItem[], draftSectionNames: string[]): FidelityAuditResult {
  const draftSet = new Set(draftSectionNames.map(s => s.toLowerCase().trim()));
  const isMandatory = (it: ComplianceMatrixItem) => ["shall", "must", "will"].includes(it.requirementType);
  const mandatory = items.filter(isMandatory);
  let covered = 0;
  let withWorkaround = 0;
  const gaps: FidelityAuditResult["gaps"] = [];
  const lGaps: FidelityAuditResult["sectionLNoncompliance"] = [];
  for (const it of mandatory) {
    const answered = it.answeringSectionName && draftSet.has(it.answeringSectionName.toLowerCase().trim());
    if (answered && it.status === "covered") {
      covered++;
    } else if (it.workaroundProposed && it.status === "workaround") {
      withWorkaround++;
    } else {
      const reason = !it.answeringSectionName
        ? "No answering section assigned"
        : !answered
          ? `Assigned section "${it.answeringSectionName}" not found in generated draft`
          : `Status "${it.status}" — not yet marked covered or workaround`;
      gaps.push({
        reqNumber: it.reqNumber,
        rfpSection: it.rfpSection,
        sectionType: it.sectionType,
        requirementVerbatim: it.requirementVerbatim,
        reason,
      });
      if (it.sectionType === "L") {
        lGaps.push({ reqNumber: it.reqNumber, rfpSection: it.rfpSection, requirementVerbatim: it.requirementVerbatim, reason });
      }
    }
  }
  return {
    ok: gaps.length === 0,
    totalShallMust: mandatory.length,
    covered,
    withWorkaround,
    gaps,
    sectionLNoncompliance: lGaps,
  };
}

// Helper: layered source stack → extractor input
export function buildExtractorInputFromStack(stack: {
  base: RfpDocument | null;
  amendments: RfpDocument[];
  qa: RfpDocument[];
}, meetingNotes?: string): { base: string; amendments: { text: string; version: number }[]; qa: { text: string }[]; meetingNotes?: string } | null {
  if (!stack.base) return null;
  return {
    base: stack.base.parsedText,
    amendments: stack.amendments.map(a => ({ text: a.parsedText, version: a.version })),
    qa: stack.qa.map(q => ({ text: q.parsedText })),
    meetingNotes,
  };
}
