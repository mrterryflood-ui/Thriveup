import { GOVERNMENT_RESOURCES, type GovernmentRequest, type GovernmentCoordination, type GovernmentMeasure } from "@shared/government-coordination";
import { navRoute } from "@shared/route-nav";
import { getGovernmentPlaces } from "./government-places";

const NEED_TOOLS: Record<GovernmentRequest["need"], string[]> = {
  health: ["/health-network", "/benefits-screener", "/rural-health"],
  housing: ["/benefits-screener", "/rural-housing", "/community-analysis"],
  food: ["/benefits-screener", "/health-network", "/community-analysis"],
  "family-workforce": ["/child-care-workforce", "/workforce", "/jobs", "/benefits-screener"],
  education: ["/workforce-training", "/workforce-pell", "/community-analysis"],
  recovery: ["/benefits-screener", "/community-analysis", "/health-network"],
};
const QUESTIONS: Record<GovernmentRequest["need"], string> = {
  health: "Which concern and access barrier should we address first? Area estimates do not describe your personal health.",
  housing: "Is the immediate issue rent, utilities, unsafe housing, or finding a place? What deadline applies?",
  food: "Is the main barrier food cost, transport, dietary needs, or finding a service open now?",
  "family-workforce": "Which constraint comes first: childcare, transportation, training cost, schedule, or finding work?",
  education: "What program or credential are you considering, and what cost, schedule, or access constraint matters most?",
  recovery: "What event, location, and immediate need are involved? Confirm current official notices before acting.",
};
const NEED_TERMS: Record<GovernmentRequest["need"], RegExp> = {
  health: /health|prevention|disability|outcomes|risk behaviors/i,
  housing: /housing|utility|mental distress|support|loneliness/i,
  food: /food|diabetes|obesity|physical health|transport/i,
  "family-workforce": /transport|housing|food|insurance|disability|mental distress|utility/i,
  education: /cognition|mental distress|sleep|support|disability/i,
  recovery: /disability|health insurance|transport|housing|utility|support/i,
};

/** Prioritizes measures relevant to the expressed task, never ranks a person's needs from area data. */
export function relevantGovernmentMeasures(measures: GovernmentMeasure[], need: GovernmentRequest["need"]) {
  return measures.filter(m => NEED_TERMS[need].test(`${m.label} ${m.category}`));
}

export async function coordinateGovernmentEvidence(request: GovernmentRequest): Promise<GovernmentCoordination> {
  // Education/recovery have no direct PLACES evidence requirement: don't fetch an irrelevant source.
  const requested = !["education", "recovery"].includes(request.need);
  const { snapshot, error } = requested ? await getGovernmentPlaces(request) : { snapshot: null, error: null };
  const paths = [
    "/ai-navigator",
    ...(request.role === "planner" ? ["/community-analysis"] : []),
    ...(request.role === "chw" ? ["/chw-dashboard"] : []),
    ...NEED_TOOLS[request.need],
  ];
  const tools = [...new Set(paths)].flatMap(path => {
    const route = navRoute(path);
    // Unregistered tools are not advertised; selected role is not an access entitlement.
    return route ? [{
      path, title: route.title, access: route.access,
      reason: path === "/ai-navigator"
        ? "Continue with this place and need; review the draft before sending."
        : route.description,
    }] : [];
  });
  const evidenceUrl = `/api/data-sources/coordination?${new URLSearchParams(request)}`;
  return {
    request, checkedAt: new Date().toISOString(), evidence: snapshot, error,
    relevantMeasureIds: relevantGovernmentMeasures(snapshot?.measures ?? [], request.need).map(m => m.id),
    resources: GOVERNMENT_RESOURCES.filter(r => r.needs.includes(request.need)),
    tools, nextQuestion: QUESTIONS[request.need],
    handoff: {
      geography: `${request.geography}:${request.id}`, need: request.need, evidenceUrl,
      instruction: "Evidence supports exploration. Confirm individual circumstances, jurisdiction rules, and service availability; choose actions yourself. Existing referral/status/outcome workflows remain authoritative.",
    },
  };
}

/** Only validated source-backed numbers enter AI context; fetching time is never the observation year. */
export async function governmentContextForZip(zip: string): Promise<string> {
  if (!/^\d{5}$/.test(zip)) return "";
  return governmentContextForRequest({ geography: "zcta", id: zip, need: "health", role: "resident" });
}

export async function governmentContextForZipWithStatus(zip: string) {
  const result = await getGovernmentPlaces({ geography: "zcta", id: zip });
  return {
    content: await governmentContextForZip(zip),
    failed: result.error !== null,
    expiresAt: result.snapshot ? Date.parse(result.snapshot.fetchedAt) + 6 * 60 * 60 * 1000 : Date.now() + 60_000,
  };
}

export async function governmentContextForRequest(request: GovernmentRequest): Promise<string> {
  const { snapshot, error } = await getGovernmentPlaces(request);
  if (!snapshot) return `[CDC PLACES NOT RETRIEVED — ${request.geography} ${request.id}] ${error || "Evidence unavailable."} Do not cite or invent CDC values.`;
  const lines = [
    `[CDC PLACES — ${request.geography} ${request.id}; modeled adult estimates; ${snapshot.release}]`,
    `Retrieved ${snapshot.fetchedAt}; source: ${snapshot.sourceUrl}`,
    "Do not infer a person's circumstances or claim local intervention effects. A ZCTA is not an exact postal service area.",
  ];
  for (const m of relevantGovernmentMeasures(snapshot.measures, request.need)) {
    lines.push(m.value !== null
      ? `${m.label}: ${m.value}${m.unit} (${m.year}; 95% CI ${m.lower95 ?? "unavailable"}–${m.upper95 ?? "unavailable"}; crude prevalence)`
      : `${m.label}: unavailable, not zero (${m.year}; ${m.footnote ?? "source did not report an estimate"}).`);
  }
  if (snapshot.coverage.unavailableMeasureIds.length) lines.push(`Source measure gaps for this area: ${snapshot.coverage.unavailableMeasureIds.join(", ")}. Coverage gaps are not evidence of low need.`);
  if (!snapshot.measures.length) lines.push("No estimates available for this geography; missing does not mean zero.");
  lines.push(`Next question: ${QUESTIONS[request.need]}`);
  lines.push(`Relevant specialist tools (not approvals): ${NEED_TOOLS[request.need].join(", ")}`);
  if (snapshot.rejectedRows) lines.push(`${snapshot.rejectedRows} invalid rows excluded; evidence is partial.`);
  return lines.join("\n");
}
