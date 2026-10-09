import { governmentNavigatorReceiptSchema, type GovernmentCoordination, type GovernmentNavigatorReceipt } from "@shared/government-coordination";
import type { ClaimRule } from "./ai-claim-grounding";

export function governmentNavigatorReceipt(bundle: GovernmentCoordination): GovernmentNavigatorReceipt {
  return governmentNavigatorReceiptSchema.parse({
    request: bundle.request, checkedAt: bundle.checkedAt, evidence: bundle.evidence,
    error: bundle.error, tools: bundle.tools, nextQuestion: bundle.nextQuestion,
  });
}

/** Exact coverage is source-bound. Narrative percentages are kept in the data panel. */
export function governmentNavigatorRules(receipt: GovernmentNavigatorReceipt): ClaimRule[] {
  const source = receipt.evidence;
  const returned = source?.coverage.returnedMeasureCount;
  const expected = source?.coverage.datasetMeasureCount;
  const missing = source
    ? new Set([...source.coverage.unavailableMeasureIds, ...source.measures.filter(m => m.value === null).map(m => m.id)]).size
    : undefined;
  const number = "(\\d+(?:,\\d{3})*)";
  return [
    {
      id: "nav-government-coverage",
      trigger: /\b(?:indicators?|measures?)\b/i,
      extract(sentence) {
        const claims: Array<{ value: number; kind: string }> = [];
        const paired = new RegExp(`${number}\\s+(?:out\\s+)?of\\s+${number}\\s+(?:(?:health|CDC|PLACES|source|available|returned|retrieved|reported|total)\\s+){0,4}(?:indicators?|measures?)\\b`, "gi");
        const remaining = sentence.replace(paired, (_match, a, b) => {
          claims.push({ value: Number(a.replaceAll(",", "")), kind: "returned" },
            { value: Number(b.replaceAll(",", "")), kind: "expected" });
          return "";
        });
        const single = new RegExp(`${number}\\s+(?:(?:health|CDC|PLACES|source|available|returned|retrieved|reported|total|missing|unavailable)\\s+){0,4}(?:indicators?|measures?)\\b`, "gi");
        for (const match of remaining.matchAll(single)) {
          const clause = remaining.slice(Math.max(0, (match.index ?? 0) - 70), (match.index ?? 0) + match[0].length);
          const kind = /\b(?:missing|unavailable)\b/i.test(clause) ? "missing"
            : /\b(?:definitions?|catalog|globally|dataset defines|dataset contains)\b/i.test(clause) ? "expected" : "returned";
          claims.push({ value: Number(match[1].replaceAll(",", "")), kind });
        }
        return claims;
      },
      isGrounded: claim => claim.value === (claim.kind === "expected" ? expected : claim.kind === "missing" ? missing : returned),
      expectedDescription: source
        ? `Source records: ${returned}; definitions: ${expected}; unavailable estimates: ${missing}.`
        : "No CDC coverage counts were retrieved.",
    },
    {
      id: "nav-government-narrative-percentages",
      trigger: /%|\bpercent(?:age)?\b/i,
      extract: sentence => [...sentence.matchAll(/(\d+(?:\.\d+)?)\s*(?:%|percent(?:age)?)/gi)]
        .map(match => ({ value: Number(match[1]), kind: "percent" })),
      isGrounded: () => false,
      expectedDescription: "Exact CDC prevalence and intervals belong in the server-owned evidence panel; narrative is qualitative.",
    },
  ];
}

export function governmentNavigatorInstructions(receipt: GovernmentNavigatorReceipt): string {
  const source = receipt.evidence;
  return [
    "[GOVERNMENT EVIDENCE RESPONSE CONTRACT]",
    `Requested geography: ${receipt.request.geography}:${receipt.request.id}; topic: ${receipt.request.need}; perspective: ${receipt.request.role}. Perspective is not an access entitlement.`,
    source
      ? `The source returned exactly ${source.coverage.returnedMeasureCount} measure records out of ${source.coverage.datasetMeasureCount} definitions. Record presence is not a non-null estimate. Missing record IDs: ${source.coverage.unavailableMeasureIds.join(", ") || "none"}.`
      : `CDC evidence was not retrieved: ${receipt.error || "not requested for this topic"}. Do not invent local evidence.`,
    source ? `Source: ${source.sourceUrl}; release: ${source.release}; retrieved: ${source.fetchedAt}. Modeled adult crude estimates, not personal diagnoses or observed intervention effects.\n${source.measures.map(m =>
      `${m.id} — ${m.label}: ${m.value === null ? "unavailable, not zero" : `${m.value}${m.unit}`}; observation ${m.year}; 95% CI ${m.lower95 ?? "unavailable"}–${m.upper95 ?? "unavailable"}${m.footnote ? `; ${m.footnote}` : ""}`).join("\n")}` : "",
    "The interface separately displays the server-owned source coverage, complete unavailable list, exact values/years/intervals, and real tool buttons. Do not reproduce percentages, numeric prevalence comparisons, or long missing-data lists in narrative.",
    "Give a short qualitative interpretation, its limitations, and one useful next question. No unsupported comparisons, causal intervention claims, individual diagnosis, eligibility, or capacity assertions. Do not claim the evidence panel verifies all free-form interpretation.",
    `Public tool plan for narrative: ${receipt.tools.filter(t => t.access === "public").map(t => `${t.title} (${t.path})`).join("; ")}. Suggest only public tools from this plan. Additional restricted tools may appear in the interface only after its actual signed-in access checks; the selected perspective never grants access.`,
    `Next question: ${receipt.nextQuestion}`,
  ].join("\n");
}
