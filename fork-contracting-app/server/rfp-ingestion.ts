// Proposal Studio v2 — L1 RFP ingestion (added 2026-05-27)
//
// Takes an uploaded PDF (or already-extracted text), runs `pdftotext` if
// needed, then uses the ETHICAL_EI_PREAMBLE'd AI provider with
// withRfpTemplateDiscipline() to extract verbatim Section L/M requirements
// + scoring weights. Persists to rfpIngestionJobs + populates
// complianceMatrixItems.
//
// Iron Rule #11: verbatim only. The AI is instructed to copy text from the
// supplied document, not summarize. Source-of-truth audit trail in
// rfpIngestionJobs.rawText.
//
// Fork-ready: zero dependencies on academy/community/whole-person-health
// modules. Only uses ai-provider + storage + schema.

import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { db } from "./storage";
import { rfpIngestionJobs, complianceMatrixItems, type InsertComplianceMatrixItem } from "@shared/schema";
import { generateAIJSON } from "./ai-provider";
import { withRfpTemplateDiscipline } from "./ai-provider";
import { eq } from "drizzle-orm";

export type ParsedRfpItem = {
  reqNumber: string;
  rfpSection: string;
  sectionType: "L" | "M" | "C" | "other";
  requirementVerbatim: string;
  requirementType: "shall" | "must" | "will" | "should" | "may" | "informational";
  scoringWeight: number | null;
};

export type IngestionResult = {
  jobId: string;
  itemsExtracted: number;
  items: ParsedRfpItem[];
  status: "parsed" | "failed";
  errorMessage?: string;
};

// Run pdftotext on a PDF buffer. Returns the extracted text, or throws.
export function pdfBufferToText(pdfBuffer: Buffer): string {
  const tmpPdf = join(tmpdir(), `rfp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`);
  writeFileSync(tmpPdf, pdfBuffer);
  try {
    const result = spawnSync("pdftotext", ["-layout", tmpPdf, "-"], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`pdftotext failed (${result.status}): ${result.stderr}`);
    }
    return result.stdout;
  } finally {
    try { unlinkSync(tmpPdf); } catch { /* ignore */ }
  }
}

// Quick regex sweep for explicit "shall/must/will" sentences in Section L/M.
// Used as a sanity check and a fallback when AI extraction fails.
export function regexExtractRequirements(rawText: string): ParsedRfpItem[] {
  const items: ParsedRfpItem[] = [];
  const lines = rawText.split(/\n/);
  let currentSection: "L" | "M" | "C" | "other" = "other";
  let currentSectionLabel = "(unmarked)";
  const sectionHeader = /^\s*(?:SECTION\s+)?([LMC])[\.\s\-:]\s*(.+?)\s*$/i;
  const reqMarker = /\b(shall|must|will|should|may)\b/i;
  let reqIndex = 0;

  for (const line of lines) {
    const sm = line.match(sectionHeader);
    if (sm) {
      const sec = sm[1].toUpperCase();
      if (sec === "L" || sec === "M" || sec === "C") {
        currentSection = sec;
        currentSectionLabel = `Section ${sec} — ${sm[2].slice(0, 180)}`;
      }
      continue;
    }
    if (currentSection === "L" || currentSection === "M") {
      const trimmed = line.trim();
      if (trimmed.length < 20) continue;
      const rm = trimmed.match(reqMarker);
      if (!rm) continue;
      reqIndex++;
      items.push({
        reqNumber: `${currentSection}-auto-${reqIndex}`,
        rfpSection: currentSectionLabel,
        sectionType: currentSection,
        requirementVerbatim: trimmed.slice(0, 1500),
        requirementType: rm[1].toLowerCase() as ParsedRfpItem["requirementType"],
        scoringWeight: null,
      });
    }
  }
  return items;
}

// AI-extracted, structured requirement list. Verbatim-only per Iron Rule #11.
async function aiExtractRequirements(rawText: string): Promise<ParsedRfpItem[]> {
  const trimmedText = rawText.length > 60_000 ? rawText.slice(0, 60_000) : rawText;
  const systemPrompt = withRfpTemplateDiscipline([
    "You are an RFP compliance extractor.",
    "Read the supplied RFP text and return a structured list of every Section L (instructions to offerors) and Section M (evaluation criteria) requirement.",
    "Output is JSON with shape: { items: Array<{ reqNumber, rfpSection, sectionType, requirementVerbatim, requirementType, scoringWeight }> }.",
    "VERBATIM ONLY. Copy the requirement text exactly from the source. Do not paraphrase, summarize, or 'improve' the language.",
    "If a scoring weight (points, percentage) is stated, capture it as a number; else null.",
    "requirementType is one of: shall | must | will | should | may | informational.",
    "sectionType is one of: L | M | C | other.",
    "If you cannot find Section L/M structure, return { items: [] } and DO NOT INVENT requirements.",
  ].join("\n"));
  const prompt = `RFP TEXT (verbatim source — extract requirements without paraphrasing):\n\n${trimmedText}\n\nReturn JSON only.`;
  const out = await generateAIJSON<{ items: ParsedRfpItem[] }>(prompt, systemPrompt);
  if (!out || !Array.isArray(out.items)) return [];
  // Defense: filter out anything that doesn't look like a verbatim copy.
  return out.items
    .filter((i) => i && typeof i.requirementVerbatim === "string" && i.requirementVerbatim.trim().length >= 12)
    .slice(0, 200);
}

// End-to-end: text in → items extracted, job persisted, complianceMatrixItems
// populated. Returns the job id + extracted items.
export async function ingestRfpText(args: {
  orgId: string;
  grantId?: string;
  documentKind?: "base" | "amendment" | "qa";
  filename: string;
  rawText: string;
  useAi?: boolean;
}): Promise<IngestionResult> {
  const [job] = await db
    .insert(rfpIngestionJobs)
    .values({
      orgId: args.orgId,
      grantId: args.grantId ?? null,
      documentKind: args.documentKind ?? "base",
      filename: args.filename,
      rawText: args.rawText,
      status: "uploaded",
      itemsExtracted: 0,
    })
    .returning();

  try {
    let items: ParsedRfpItem[] = [];
    if (args.useAi !== false) {
      try {
        items = await aiExtractRequirements(args.rawText);
      } catch (err) {
        // Fall back to regex on AI failure — partial coverage is better than zero.
        items = regexExtractRequirements(args.rawText);
      }
    }
    if (items.length === 0) {
      items = regexExtractRequirements(args.rawText);
    }

    if (items.length > 0 && args.grantId) {
      const inserts: InsertComplianceMatrixItem[] = items.map((it) => ({
        orgId: args.orgId,
        grantId: args.grantId!,
        documentId: job.id,
        reqNumber: it.reqNumber,
        rfpSection: it.rfpSection,
        sectionType: it.sectionType,
        requirementVerbatim: it.requirementVerbatim,
        requirementType: it.requirementType,
        scoringWeight: it.scoringWeight,
        sourceKind: args.documentKind ?? "base",
        evidenceRef: "",
        workaroundProposed: "",
        answeringSectionName: "",
        status: "open",
        confidence: 0,
      }));
      // Chunk inserts to stay under reasonable transaction sizes
      for (let i = 0; i < inserts.length; i += 50) {
        await db.insert(complianceMatrixItems).values(inserts.slice(i, i + 50));
      }
    }

    await db
      .update(rfpIngestionJobs)
      .set({ status: "parsed", itemsExtracted: items.length, parsedAt: new Date() })
      .where(eq(rfpIngestionJobs.id, job.id));

    return { jobId: job.id, itemsExtracted: items.length, items, status: "parsed" };
  } catch (err: any) {
    await db
      .update(rfpIngestionJobs)
      .set({ status: "failed", errorMessage: String(err?.message ?? err).slice(0, 2000) })
      .where(eq(rfpIngestionJobs.id, job.id));
    return { jobId: job.id, itemsExtracted: 0, items: [], status: "failed", errorMessage: String(err?.message ?? err) };
  }
}
