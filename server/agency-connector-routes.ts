/**
 * Agency Connector Routes
 *
 * Helps external organisations discover which ThriveUp Partner API endpoints
 * match their mission, preview live data, and generate copy-paste integration
 * code — all without needing a key up-front.
 *
 * Endpoints:
 *   POST /api/agency-connector/mission-map   → ranked endpoint recommendations
 *   GET  /api/agency-connector/preview/:ep   → live data via internal ecosystem key
 *   POST /api/agency-connector/code          → ready-to-paste code for chosen endpoints
 */

import { Express, Request, Response } from "express";

// ── Endpoint catalogue ────────────────────────────────────────────────────────
// Each entry describes one Partner API endpoint with signal keywords that
// indicate mission-alignment.  Scores are computed as weighted keyword hits
// against the submitted mission text (case-insensitive).

export interface EndpointDef {
  id: string;
  label: string;
  method: "GET" | "POST";
  path: string;
  scope: string;
  description: string;
  returnsSummary: string;
  keywords: string[];
  weight: number;           // base weight multiplier (1–3)
  gap?: string;             // known data gap to surface in UI
}

export const PARTNER_ENDPOINTS: EndpointDef[] = [
  {
    id: "benefits",
    label: "Benefits Programs",
    method: "GET",
    path: "/api/partner/v1/benefits",
    scope: "benefits:read",
    description: "Returns all active benefit programs in the ThriveUp network — food, housing, rental assistance, utilities, crisis services, and more.",
    returnsSummary: "count, programs[] with title / description / methodology / targetPopulation / geographicFocus",
    keywords: [
      "emergency", "food", "shelter", "housing", "rent", "utility", "clothing",
      "diaper", "basic needs", "assistance", "pantry", "snap", "financial assistance",
      "crisis", "family services", "benefits", "social services", "community action",
      "direct service", "case management", "wraparound", "navigation", "resource",
      "referral", "low-income", "poverty", "unhoused", "eviction", "food insecurity",
    ],
    weight: 2,
  },
  {
    id: "community",
    label: "Ecosystem Community",
    method: "GET",
    path: "/api/partner/v1/community",
    scope: "community:read",
    description: "Returns the full ThriveUp platform ecosystem — all member organisations, their domains, roles, health status, and geographic reach.",
    returnsSummary: "summary (platform count, domains, languages, reach) + platforms[]",
    keywords: [
      "advocacy", "policy", "coalition", "network", "collaboration", "partner",
      "ecosystem", "regional", "collective impact", "backbone", "cross-sector",
      "community development", "capacity building", "technical assistance",
      "consulting", "intermediary", "funder", "foundation", "united way",
    ],
    weight: 1,
  },
  {
    id: "impact",
    label: "Workforce Impact Outcomes",
    method: "GET",
    path: "/api/partner/v1/impact",
    scope: "impact:read",
    description: "Aggregated workforce and program outcomes — participants served, employment entry, credential attainment, and 6-month retention.",
    returnsSummary: "totals (participantsServed, enteredEmployment, credentialsAttained) + outcomes[] by org/program",
    keywords: [
      "workforce", "employment", "job", "career", "credential", "training",
      "apprentice", "hire", "wage", "retention", "outcome", "funder",
      "grant writer", "evaluation", "performance", "roi", "return on investment",
      "results", "impact", "workforce board", "wib", "wioa", "employer",
      "placement", "sector", "industry", "trade", "skilled", "certification",
    ],
    weight: 3,
    gap: "medianEarnings returns null — ThriveUp has not yet wired this field on their side. All other impact fields are live.",
  },
  {
    id: "community-story",
    label: "Community Story / Brief",
    method: "GET",
    path: "/api/partner/v1/community-story",
    scope: "community:read",
    description: "Generates a complete community brief for any ZIP code, county, or multi-county area — Census demographics, vulnerability index, CEDS alignment, grant intelligence, and narrative.",
    returnsSummary: "geography, demographics, indicators, vulnerabilityScore, systemsAnalysis, narrative, grantOpportunities",
    keywords: [
      "census", "demographics", "data", "community profile", "needs assessment",
      "grant", "proposal", "storytelling", "narrative", "report", "presentation",
      "equity", "disparity", "sdoh", "social determinants", "community benefit",
      "501c3", "nonprofit", "faith-based", "church", "community organization",
      "advocacy", "brief", "fact sheet", "county", "region", "zip code",
    ],
    weight: 2,
  },
  {
    id: "students",
    label: "Youth / Student Aggregate Analytics",
    method: "GET",
    path: "/api/partner/v1/students/overview",
    scope: "student:read",
    description: "Suppression-safe aggregate analytics on youth enrolled in ThriveUp Academy — grade distribution, lesson completion, engagement streaks. No PII.",
    returnsSummary: "aggregateOnly, totalStudents, averages, gradeDistribution, statusDistribution (all suppressed at floor-5)",
    keywords: [
      "youth", "student", "school", "education", "academic", "grade", "graduation",
      "college", "k-12", "teen", "young adult", "after school", "summer",
      "ged", "hse", "alternative education", "dropout", "re-engagement",
      "career and technical", "cte", "stem", "workforce readiness", "soft skills",
    ],
    weight: 2,
  },
  {
    id: "early-warnings",
    label: "Youth Early Warning System",
    method: "GET",
    path: "/api/partner/v1/early-warnings",
    scope: "student:read",
    description: "Aggregate counts of open/resolved early-warning flags across the youth cohort — attendance, engagement, and academic triggers. Suppression-safe.",
    returnsSummary: "total, open, resolved, byLevel (low/medium/high), byTrigger",
    keywords: [
      "at-risk", "early warning", "dropout prevention", "truancy", "absenteeism",
      "intervention", "mentoring", "counseling", "support services", "SEL",
      "trauma informed", "school-based", "disengaged", "disconnected youth",
    ],
    weight: 2,
  },
  {
    id: "foster-refer",
    label: "Foster Youth Referral",
    method: "POST",
    path: "/api/partner/v1/foster-youth/refer",
    scope: "inbound:write",
    description: "Submit a foster youth intake referral into ThriveUp's YHSI system — first name, state, immediate needs, and caseworker email. Returns a secure intake link.",
    returnsSummary: "intakeId, intakeUrl (secure access-token link), partnerReference",
    keywords: [
      "foster", "child welfare", "dcfs", "dfps", "cps", "foster care",
      "youth in care", "aging out", "transitional age youth", "TAY", "homelessness",
      "housing", "independent living", "extended foster care", "kinship",
    ],
    weight: 3,
  },
  {
    id: "push",
    label: "Inbound Data Push (Grant Outcomes)",
    method: "POST",
    path: "/api/partner/v1/push",
    scope: "inbound:write",
    description: "Push grant outcome data back into ThriveUp — award amounts, status, next steps. Triggers immediate intelligence refresh on the TCAF side.",
    returnsSummary: "received, id, grantOutcomeAck (grantId, grantTitle, status, awardAmount, nextStep)",
    keywords: [
      "grant", "award", "funder", "grantee", "reporting", "compliance",
      "grant management", "program officer", "foundation", "philanthropy",
      "federal award", "state award", "subaward", "pass-through",
    ],
    weight: 2,
  },
  {
    id: "embed-portal",
    label: "Embed Portal (Widget)",
    method: "GET",
    path: "/embed/tcaf-widget.js",
    scope: "public",
    description: "One script-tag widget that adds a full ThriveUp community portal to any website — community story, benefits finder, grants, and AI Navigator. No API key required for the widget itself.",
    returnsSummary: "Interactive overlay with 4 tabs: Community Story, Get Help, Grants, Navigator AI",
    keywords: [
      "website", "widget", "embed", "integration", "portal", "public-facing",
      "constituent", "client-facing", "online", "digital", "web presence",
      "iframe", "landing page", "resource hub", "community portal",
    ],
    weight: 2,
  },
];

// ── Mission scoring ───────────────────────────────────────────────────────────

interface ScoredEndpoint extends EndpointDef {
  score: number;
  matchedKeywords: string[];
  rationale: string;
}

function scoreMission(missionText: string, orgType: string): ScoredEndpoint[] {
  const haystack = (missionText + " " + orgType).toLowerCase();

  const scored: ScoredEndpoint[] = PARTNER_ENDPOINTS.map(ep => {
    const matched = ep.keywords.filter(kw => haystack.includes(kw.toLowerCase()));
    const rawScore = matched.length > 0
      ? Math.min(100, Math.round((matched.length / ep.keywords.length) * 100 * ep.weight * 3))
      : 0;

    return {
      ...ep,
      score: rawScore,
      matchedKeywords: matched,
      rationale: buildRationale(ep, matched),
    };
  });

  // Always include embed-portal and community-story at a baseline relevance
  const embedIdx = scored.findIndex(s => s.id === "embed-portal");
  if (embedIdx >= 0 && scored[embedIdx].score < 20) scored[embedIdx].score = 20;
  const storyIdx = scored.findIndex(s => s.id === "community-story");
  if (storyIdx >= 0 && scored[storyIdx].score < 20) scored[storyIdx].score = 20;

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

function buildRationale(ep: EndpointDef, matched: string[]): string {
  if (!matched.length) return "";
  const top3 = matched.slice(0, 3).join(", ");
  const rationales: Record<string, string> = {
    benefits: `Your mission signals direct-service work. The benefits endpoint surfaces every program in the network that touches "${top3}".`,
    community: `Coalition and ecosystem language in your mission ("${top3}") maps directly to the community endpoint.`,
    impact: `Funder- and workforce-facing missions benefit most from the impact endpoint — it answers "what results did the money buy?" ("${top3}").`,
    "community-story": `Grant writers and advocates use the community-story endpoint to build data-backed narratives fast. Your mission mentions "${top3}".`,
    students: `Youth-serving language ("${top3}") in your mission aligns with the aggregate student analytics endpoint.`,
    "early-warnings": `Early-intervention focus ("${top3}") maps to the youth early-warning system.`,
    "foster-refer": `Child welfare and foster-youth language ("${top3}") maps to the foster intake referral endpoint.`,
    push: `Grant management work ("${top3}") pairs with the inbound push endpoint so ThriveUp intelligence stays in sync with your award data.`,
    "embed-portal": `Any org with a public website benefits from the embed widget. One script tag puts your community portal live without any API key.`,
  };
  return rationales[ep.id] || `Your mission aligns with this endpoint via: ${top3}.`;
}

// ── Internal preview helper ───────────────────────────────────────────────────
// Calls the Partner API on localhost using the ecosystem key (all-scope).

async function previewEndpoint(endpointId: string, location: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  // Use the pre-provisioned THRIVEUP_PARTNER_KEY for previews — it has community:read,
  // impact:read, benefits:read, and inbound:write scope.  Fall back to the ecosystem key
  // so the preview still works even if the partner key is absent.
  const partnerKey   = process.env.THRIVEUP_PARTNER_KEY || "";
  const ecosystemKey = process.env.CIVIC_SIGNAL_ECOSYSTEM_KEY || "";
  const base = "http://localhost:5000";

  const pathMap: Record<string, string> = {
    benefits:         "/api/partner/v1/benefits",
    community:        "/api/partner/v1/community",
    impact:           "/api/partner/v1/impact",
    "community-story": `/api/partner/v1/community-story?location=${encodeURIComponent(location || "28472")}`,
    students:         "/api/partner/v1/students/overview",
    "early-warnings": "/api/partner/v1/early-warnings",
    "foster-refer":   null as any, // POST — skip live preview
    push:             null as any, // POST — skip live preview
    "embed-portal":   null as any, // widget JS — skip live preview
  };

  const path = pathMap[endpointId];
  if (!path) return { ok: true, data: { note: "This is a write endpoint. See the code generator for a usage example." } };

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (partnerKey)   headers["x-partner-key"] = partnerKey;
    else if (ecosystemKey) headers["x-ecosystem-key"] = ecosystemKey;

    const resp = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(15000) });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return { ok: false, error: `${resp.status}: ${text.slice(0, 200)}` };
    }
    const data = await resp.json();
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Request failed" };
  }
}

// ── Code generators ───────────────────────────────────────────────────────────

function generateJs(endpoints: EndpointDef[], orgName: string, location: string): string {
  const lines: string[] = [
    `// ThriveUp Partner API — ${orgName}`,
    `// Generated by Agency Connector · ${new Date().toISOString().slice(0, 10)}`,
    `// Replace YOUR_TCAF_PARTNER_KEY with the key ThriveUp issues you.`,
    ``,
    `const TCAF_BASE = "https://thrivingcommunitiesforall.com";`,
    `const TCAF_KEY  = "YOUR_TCAF_PARTNER_KEY";`,
    `const LOCATION  = ${JSON.stringify(location || "28472")};`,
    ``,
    `async function tcafFetch(path, options = {}) {`,
    `  const res = await fetch(TCAF_BASE + path, {`,
    `    ...options,`,
    `    headers: { "x-partner-key": TCAF_KEY, "Content-Type": "application/json", ...(options.headers || {}) },`,
    `  });`,
    `  if (!res.ok) throw new Error(\`ThriveUp API \${res.status}: \${await res.text()}\`);`,
    `  return res.json();`,
    `}`,
    ``,
  ];

  for (const ep of endpoints) {
    if (ep.id === "embed-portal") continue;
    lines.push(`// ── ${ep.label} ──`);
    if (ep.method === "GET") {
      const pathWithLoc = ep.id === "community-story"
        ? `${ep.path}?location=\${encodeURIComponent(LOCATION)}`
        : ep.path;
      lines.push(`async function get${toPascal(ep.id)}() {`);
      lines.push(`  return tcafFetch(\`${pathWithLoc}\`);`);
      lines.push(`}`);
    } else if (ep.id === "foster-refer") {
      lines.push(`async function submitFosterReferral(youthFirstName, stateCode, immediateNeeds, caseworkerEmail) {`);
      lines.push(`  return tcafFetch("${ep.path}", {`);
      lines.push(`    method: "POST",`);
      lines.push(`    body: JSON.stringify({ firstName: youthFirstName, stateCode, immediateNeeds, caseworkerEmail }),`);
      lines.push(`  });`);
      lines.push(`}`);
    } else if (ep.id === "push") {
      lines.push(`async function pushGrantOutcome(grantId, grantTitle, status, awardAmount) {`);
      lines.push(`  return tcafFetch("${ep.path}", {`);
      lines.push(`    method: "POST",`);
      lines.push(`    body: JSON.stringify({ dataType: "grant_outcome", payload: { grantId, grantTitle, status, awardAmount } }),`);
      lines.push(`  });`);
      lines.push(`}`);
    }
    lines.push(``);
  }

  const embedEp = endpoints.find(e => e.id === "embed-portal");
  if (embedEp) {
    lines.push(`// ── Embed Widget ── (add to your HTML <head>) ──`);
    lines.push(`// <script src="${"https://thrivingcommunitiesforall.com"}/embed/tcaf-widget.js"`);
    lines.push(`//   data-tcaf-portal`);
    lines.push(`//   data-location="${location || "28472"}"`);
    lines.push(`//   data-org="${orgName}"`);
    lines.push(`//   data-color="#1a6faf">`);
    lines.push(`// </script>`);
    lines.push(``);
  }

  return lines.join("\n");
}

function generatePython(endpoints: EndpointDef[], orgName: string, location: string): string {
  const lines: string[] = [
    `# ThriveUp Partner API — ${orgName}`,
    `# Generated by Agency Connector · ${new Date().toISOString().slice(0, 10)}`,
    `# pip install requests`,
    ``,
    `import requests`,
    ``,
    `TCAF_BASE = "https://thrivingcommunitiesforall.com"`,
    `TCAF_KEY  = "YOUR_TCAF_PARTNER_KEY"`,
    `LOCATION  = ${JSON.stringify(location || "28472")}`,
    `HEADERS   = {"x-partner-key": TCAF_KEY, "Content-Type": "application/json"}`,
    ``,
  ];

  for (const ep of endpoints) {
    if (ep.id === "embed-portal") continue;
    lines.push(`# ── ${ep.label} ──`);
    if (ep.method === "GET") {
      const pathWithLoc = ep.id === "community-story"
        ? `f"${ep.path}?location={LOCATION}"`
        : `"${ep.path}"`;
      lines.push(`def get_${toSnake(ep.id)}():`);
      lines.push(`    r = requests.get(TCAF_BASE + ${pathWithLoc}, headers=HEADERS, timeout=30)`);
      lines.push(`    r.raise_for_status()`);
      lines.push(`    return r.json()`);
    } else if (ep.id === "foster-refer") {
      lines.push(`def submit_foster_referral(first_name, state_code, immediate_needs, caseworker_email):`);
      lines.push(`    payload = {"firstName": first_name, "stateCode": state_code,`);
      lines.push(`               "immediateNeeds": immediate_needs, "caseworkerEmail": caseworker_email}`);
      lines.push(`    r = requests.post(TCAF_BASE + "${ep.path}", json=payload, headers=HEADERS, timeout=30)`);
      lines.push(`    r.raise_for_status()`);
      lines.push(`    return r.json()`);
    } else if (ep.id === "push") {
      lines.push(`def push_grant_outcome(grant_id, grant_title, status, award_amount):`);
      lines.push(`    payload = {"dataType": "grant_outcome",`);
      lines.push(`               "payload": {"grantId": grant_id, "grantTitle": grant_title,`);
      lines.push(`                            "status": status, "awardAmount": award_amount}}`);
      lines.push(`    r = requests.post(TCAF_BASE + "${ep.path}", json=payload, headers=HEADERS, timeout=30)`);
      lines.push(`    r.raise_for_status()`);
      lines.push(`    return r.json()`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

function generateCurl(endpoints: EndpointDef[], location: string): string {
  const lines: string[] = [
    `# ThriveUp Partner API — curl examples`,
    `# Replace YOUR_TCAF_PARTNER_KEY with the key ThriveUp issues you.`,
    ``,
    `export TCAF_KEY="YOUR_TCAF_PARTNER_KEY"`,
    `export TCAF_BASE="https://thrivingcommunitiesforall.com"`,
    ``,
  ];

  for (const ep of endpoints) {
    if (ep.id === "embed-portal") continue;
    lines.push(`# ${ep.label}`);
    if (ep.method === "GET") {
      const pathWithLoc = ep.id === "community-story"
        ? `${ep.path}?location=${encodeURIComponent(location || "28472")}`
        : ep.path;
      lines.push(`curl -s -H "x-partner-key: $TCAF_KEY" \\`);
      lines.push(`  "$TCAF_BASE${pathWithLoc}" | jq .`);
    } else if (ep.id === "foster-refer") {
      lines.push(`curl -s -X POST -H "x-partner-key: $TCAF_KEY" -H "Content-Type: application/json" \\`);
      lines.push(`  -d '{"firstName":"Alex","stateCode":"NC","immediateNeeds":["housing","food"],"caseworkerEmail":"case@agency.org"}' \\`);
      lines.push(`  "$TCAF_BASE${ep.path}" | jq .`);
    } else if (ep.id === "push") {
      lines.push(`curl -s -X POST -H "x-partner-key: $TCAF_KEY" -H "Content-Type: application/json" \\`);
      lines.push(`  -d '{"dataType":"grant_outcome","payload":{"grantId":"GR-2026-001","grantTitle":"Workforce Dev Grant","status":"awarded","awardAmount":75000}}' \\`);
      lines.push(`  "$TCAF_BASE${ep.path}" | jq .`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

function generateEmbed(orgName: string, location: string, color: string): string {
  return `<!-- ThriveUp Community Portal — ${orgName} -->
<!-- Add this snippet just before </body> on any page where you want the portal button. -->
<!-- No partner key required for the embed widget. -->

<script
  src="https://thrivingcommunitiesforall.com/embed/tcaf-widget.js"
  data-tcaf-portal
  data-location="${location || "28472"}"
  data-org="${orgName}"
  data-color="${color || "#1a6faf"}"
></script>

<!-- The widget adds a "Community Resources" button (bottom-right).
     Clicking it opens a full-screen overlay with 4 tabs:
     Community Story · Get Help · Grants · Navigator AI -->`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toPascal(s: string) {
  return s.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}
function toSnake(s: string) { return s.replace(/-/g, "_"); }

// ── Route registration ────────────────────────────────────────────────────────
export function registerAgencyConnectorRoutes(app: Express) {
  // POST /api/agency-connector/mission-map
  app.post("/api/agency-connector/mission-map", (req: Request, res: Response) => {
    const { mission = "", orgName = "", orgType = "", location = "" } = req.body || {};
    if (!mission || typeof mission !== "string") {
      return res.status(400).json({ error: "mission is required" });
    }
    const recommendations = scoreMission(mission, orgType);
    return res.json({ recommendations, orgName, location });
  });

  // GET /api/agency-connector/preview/:endpointId
  app.get("/api/agency-connector/preview/:endpointId", async (req: Request, res: Response) => {
    const { endpointId } = req.params;
    const location = String(req.query.location || "28472");
    const ep = PARTNER_ENDPOINTS.find(e => e.id === endpointId);
    if (!ep) return res.status(404).json({ error: "Unknown endpoint ID" });

    const result = await previewEndpoint(endpointId, location);
    const gap = ep.gap || null;
    return res.json({ ...result, gap });
  });

  // POST /api/agency-connector/code
  app.post("/api/agency-connector/code", (req: Request, res: Response) => {
    const { endpointIds = [], orgName = "My Organization", location = "28472", color = "#1a6faf" } = req.body || {};
    if (!Array.isArray(endpointIds) || !endpointIds.length) {
      return res.status(400).json({ error: "endpointIds[] is required" });
    }
    const endpoints = endpointIds
      .map((id: string) => PARTNER_ENDPOINTS.find(e => e.id === id))
      .filter(Boolean) as EndpointDef[];

    return res.json({
      javascript: generateJs(endpoints, orgName, location),
      python:     generatePython(endpoints, orgName, location),
      curl:       generateCurl(endpoints, location),
      embed:      generateEmbed(orgName, location, color),
    });
  });
}
