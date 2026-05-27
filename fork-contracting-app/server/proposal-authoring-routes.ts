// Proposal Studio v2 — L6 section-by-section authoring assistant (added 2026-05-27)
//
// Wraps the existing ETHICAL_EI_PREAMBLE'd + withRfpTemplateDiscipline'd AI
// provider so every authored paragraph mirrors the RFP verbatim language,
// applies Five-Lens thinking (implementation science · psychology/neuro ·
// data engineering · CHW · UCD per replit.md user preferences), and refuses
// to generate decision-maker text (always recommends; never commands).
//
// Returns the draft text + a list of suggested evidenceBindings (RPLICE hints)
// so the user can immediately bind sources.
//
//   POST /api/me/proposal-authoring/draft   → draft one section
//
// Fork-ready.

import type { Express, Request, Response } from "express";
import { generateAIResponse, withRfpTemplateDiscipline } from "./ai-provider";
import { requireAuth, requireOrg, getCallerOrg, rateLimitAi } from "./tenant-middleware";
import { z } from "zod";

const FIVE_LENS_PROMPT = [
  "FIVE-LENS THINKING (apply to every paragraph):",
  "1. Implementation science — CFIR/RE-AIM/EPIS frame; fidelity; scalability; Title IV-E Clearinghouse-grade evaluation where applicable.",
  "2. Psychology / neuroscience — developmental science; trauma-informed design; regulation skills front-loaded; no shame architecture.",
  "3. Data engineering — primary-source verifiable; FHIR/CDS-Hooks interoperable where clinical; 0-PHI-egress; witness-logged; auditable.",
  "4. Community health worker — trusted-messenger model; dialect-honoring; stipended shadow workers; peer-mentor / promotora / neighbor / faith-leader pathways named.",
  "5. UCD — parent, clinician, case-worker, evaluator, funder, reviewer each have a coherent surface; consent default OFF; friction calibrated; no surprises.",
  "Hold all five simultaneously. Never sacrifice one to optimize another.",
].join("\n");

const DECISION_SUPPORT_PROMPT = [
  "REFUSAL RULE: You are decision-support, never decision-maker. Recommend; do not command. Always leave a path back to a human (caseworker, navigator, clinician, attorney, evaluator).",
  "When tempted to write 'we will' as a definitive operational decision, write 'we propose to' or 'we recommend' and name the human accountable.",
].join("\n");

const RFP_MIRROR_PROMPT = [
  "RFP VERBATIM MIRROR: For every paragraph you draft, open with:",
  "  \"In response to [reqNumber]'s requirement that [verbatim quote]…\"",
  "Close with:",
  "  \"[Evidence: <source kind>:<source ref> — verbatim: '<quote>']\"",
  "If a claim cannot be evidence-bound from the supplied context, mark it explicitly:",
  "  \"{{ACTION REQUIRED — <owner>: bind primary source for <claim>}}\"",
  "Do NOT silently invent evidence. Do NOT paraphrase the RFP requirement — quote it verbatim.",
].join("\n");

export function registerProposalAuthoringRoutes(app: Express) {
  const draftSchema = z.object({
    grantId: z.string().min(1),
    sectionName: z.string().min(1).max(500),
    rfpRequirementVerbatim: z.string().min(12, "Provide the verbatim RFP requirement so the draft can mirror it"),
    reqNumber: z.string().min(1),
    scoringWeight: z.number().nullable().optional(),
    orgProfile: z.string().optional(), // short canonical org pitch
    evidencePool: z.array(z.object({
      sourceKind: z.string(),
      sourceRef: z.string(),
      quote: z.string(),
    })).optional(),
    targetWordCount: z.number().int().min(50).max(2000).optional(),
  }).strict();

  app.post("/api/me/proposal-authoring/draft", requireAuth, requireOrg, rateLimitAi, async (req: Request, res: Response) => {
    const _org = getCallerOrg(req)!;
    const parse = draftSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "validation failed", details: parse.error.flatten() });
    }
    const { sectionName, rfpRequirementVerbatim, reqNumber, scoringWeight, orgProfile, evidencePool, targetWordCount } = parse.data;

    const systemPrompt = withRfpTemplateDiscipline([
      FIVE_LENS_PROMPT,
      "",
      DECISION_SUPPORT_PROMPT,
      "",
      RFP_MIRROR_PROMPT,
    ].join("\n"));

    const evidenceBlock = (evidencePool && evidencePool.length > 0)
      ? `\nEVIDENCE POOL (use only these — do not invent):\n${evidencePool.map((e, i) => `[${i + 1}] (${e.sourceKind}:${e.sourceRef}) "${e.quote}"`).join("\n")}\n`
      : "\nEVIDENCE POOL: (none supplied — mark every factual claim with {{ACTION REQUIRED}})\n";

    const userPrompt = [
      `Draft Section M paragraph: ${sectionName}`,
      `RFP requirement #${reqNumber}${scoringWeight ? ` (${scoringWeight} pts)` : ""}:`,
      `"${rfpRequirementVerbatim}"`,
      "",
      orgProfile ? `APPLICANT PROFILE:\n${orgProfile}` : "",
      evidenceBlock,
      `TARGET LENGTH: ~${targetWordCount ?? 350} words.`,
      "",
      "Output: the paragraph only. Start with the verbatim-mirror opener. End with the [Evidence: …] closer or a {{ACTION REQUIRED}} marker per binding rules.",
    ].filter(Boolean).join("\n");

    try {
      const draft = await generateAIResponse([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], 2400);
      // Surface suggested bindings: any [Evidence: ...] tags the model emitted.
      const suggestedBindings: Array<{ sourceKind: string; sourceRef: string; quote: string }> = [];
      const evidenceTag = /\[Evidence:\s*([^:]+):([^—]+)—\s*verbatim:\s*['"]([^'"]+)['"]\s*\]/g;
      let m: RegExpExecArray | null;
      while ((m = evidenceTag.exec(draft)) !== null) {
        suggestedBindings.push({
          sourceKind: m[1].trim(),
          sourceRef: m[2].trim(),
          quote: m[3].trim(),
        });
      }
      const actionMarkers = (draft.match(/\{\{ACTION REQUIRED[^}]+\}\}/g) ?? []);
      res.json({
        draft,
        suggestedBindings,
        actionMarkers,
        meta: { reqNumber, sectionName, scoringWeight: scoringWeight ?? null },
      });
    } catch (err: any) {
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  });
}
