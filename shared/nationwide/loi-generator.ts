// RPLICE v2 — NSF 26-508 TechAccess Coordination Hub LOI generator.
// Pure function: given a state code + lead-org info + optional live
// intelligence (Perplexity-grounded findings), produces an NSF-compliant
// LOI in markdown. Works for any of 56 jurisdictions.

import { getJurisdiction } from "./jurisdictions";
import { getFederalPartners } from "./federal-partners";
import { STATE_PROGRAMS } from "./state-programs";

export interface LoiPartner {
  org: string;
  role: string;       // e.g., "Workforce", "Cooperative Extension", "SBDC"
  contact?: string;
}

export interface LoiInput {
  stateCode: string;
  leadOrg: string;
  leadOrgUei?: string;
  leadOrgPi?: string;
  partners?: LoiPartner[];
  live?: LiveIntelligence;
}

export interface LiveIntelligenceFinding {
  text: string;
  citations?: string[];
}

export interface LiveIntelligence {
  aiInitiatives?: LiveIntelligenceFinding;
  recentFederalAwards?: LiveIntelligenceFinding;
  workforcePrograms?: LiveIntelligenceFinding;
  retrievedAt?: string;
}

export interface LoiResult {
  markdown: string;
  citations: string[];
  jurisdictionName: string;
  partnerCount: number;
  programCount: number;
}

function citeBlock(label: string, finding?: LiveIntelligenceFinding): { body: string; cites: string[] } {
  if (!finding || !finding.text) return { body: `*${label}: pending research — run live intelligence to populate.*`, cites: [] };
  return { body: finding.text.trim(), cites: finding.citations ?? [] };
}

export function generateHubLoi(input: LoiInput): LoiResult {
  const j = getJurisdiction(input.stateCode);
  if (!j) throw new Error(`Unknown jurisdiction: ${input.stateCode}`);
  const fp = getFederalPartners(input.stateCode);
  const stateProgs = STATE_PROGRAMS.filter(p => p.state === input.stateCode);
  const partners = input.partners ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const ai = citeBlock("Current AI initiatives in " + j.name, input.live?.aiInitiatives);
  const fed = citeBlock("Recent federal AI awards in " + j.name, input.live?.recentFederalAwards);
  const wf = citeBlock("Workforce AI programs in " + j.name, input.live?.workforcePrograms);
  const allCites = Array.from(new Set([...ai.cites, ...fed.cites, ...wf.cites]));

  const partnersBlock = partners.length
    ? partners.map(p => `- **${p.role}** — ${p.org}${p.contact ? ` (${p.contact})` : ""}`).join("\n")
    : "*Partner roster in formation; named MOUs by full-proposal deadline.*";

  const fpBlock = fp ? [
    `- **USDA-NIFA Cooperative Extension** — [${fp.extension.institution}](${fp.extension.url})`,
    `- **DOL Employment & Training (American Job Centers)** — [${j.name} AJC locator](${fp.americanJobCenterLocator})`,
    `- **SBA Small Business Development Centers** — [${j.name} SBDC locator](${fp.sbdcLocator})`,
  ].join("\n") : "*Federal partner registry unavailable for this jurisdiction.*";

  const progBlock = stateProgs.length
    ? stateProgs.slice(0, 8).map(p => `- ${p.programName} — <${p.portalUrl}>`).join("\n")
    : "*State program catalog seeding in progress.*";

  const md = `# Letter of Intent — NSF 26-508 TechAccess: AI-Ready America
## ${j.name} State/Territory Coordination Hub (Round 1)

**Submission date:** ${today}
**Solicitation:** NSF 26-508 — TechAccess: AI-Ready America
**Round 1 LOI deadline:** June 16, 2026 (5:00 PM submitting-organization local time)
**Lead Institution:** ${input.leadOrg}${input.leadOrgUei ? `  (UEI: ${input.leadOrgUei})` : ""}
${input.leadOrgPi ? `**Principal Investigator:** ${input.leadOrgPi}\n` : ""}**Jurisdiction:** ${j.name} (${j.code}, FIPS ${j.fips})

---

### 1. Hub Vision

The ${j.name} Coordination Hub will accelerate AI readiness across education, workforce,
small business, and public-serving sectors by anchoring a coordinated state-level
implementation network on a proven multi-organization coordination protocol (RPLICE v2).
Where most applicants will *propose* coordination, ${input.leadOrg} *demonstrates* it
today: a production federation contract running between ThriveUp / TCAF and LifeBridge,
exchanging benefit-enrollment events with byte-identical fidelity.

This hub extends that working model — replicable across all 56 jurisdictions — to the
NSF AI-Ready America mission: connecting nationally developed resources and technical
expertise with state leadership and local implementation.

### 2. State Context

${ai.body}

${fed.body}

${wf.body}

### 3. Federal Partner Plug-Ins

${fpBlock}

### 4. State Program Coordination Surface

The hub's coordination layer connects to ${stateProgs.length} state programs already
catalogued for ${j.name}, enabling AI-readiness initiatives to leverage existing
service-delivery infrastructure rather than build parallel systems:

${progBlock}

### 5. Hub Partners (forming)

${partnersBlock}

### 6. Coordination Mechanism — RPLICE v2

The hub will operate on RPLICE v2, an open coordination protocol with:
- **Resident-reference dedup keys** — byte-identical SHA-256 hashing across peers,
  preventing double-counting in cross-organization reporting.
- **Canonical program slugs** — every federal/state/local benefit and AI program
  resolves to one slug across all 56 jurisdictions.
- **Federated event vocabulary** — \`benefit.enrollment.updated\`,
  \`grantPartner.tagged\`, \`benefitProgram.discovered\`, etc.
- **Catalog growth loop** — discoveries persist and propagate to all peers, so the
  national catalog grows from on-the-ground coordination, not central edict.

The full contract specification is published at the hub's adoption kit URL and is
available to all 55 other Coordination Hubs at no licensing cost.

### 7. Alignment with Solicitation Objectives

| NSF Objective | Hub Approach |
|---|---|
| Strengthen state-level coordination | RPLICE v2 federation already operating in production |
| Connect to federal partners (DOL, USDA-NIFA, SBA) | Pre-integrated partner catalog (above) |
| Reach businesses and public-serving organizations | 24-platform AI ecosystem covering K-16, workforce, small business, rural, healthcare |
| Practical implementation & up-skilling | Existing live deployments serving real residents in Travis County corridor |
| Scale what works | Adoption kit lets any Hub adopt the protocol in 4 steps |

### 8. Anticipated Budget Outline (3 years × $1M/yr)

| Category | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Hub coordination staff (PI, hub director, 2 partner liaisons) | $480K | $495K | $510K |
| Partner subawards (workforce, extension, SBDC pilot integrations) | $300K | $310K | $315K |
| Convenings (statewide + regional) | $80K | $80K | $80K |
| RPLICE v2 protocol stewardship & adoption support to other Hubs | $90K | $80K | $70K |
| Evaluation, reporting, indirects | $50K | $35K | $25K |
| **Total** | **$1,000K** | **$1,000K** | **$1,000K** |

*No cost-share included (solicitation prohibits voluntary committed cost share).*

### 9. Hub Lead Capacity Statement

${input.leadOrg} brings:
- Operating multi-organization coordination protocol (RPLICE v2)
- 24 production AI platforms spanning education, workforce, healthcare, small business
- Existing federal funding alignment (DOL workforce, SAMHSA prevention, AJC linkages)
- Demonstrated equity reach: live deployments in high-poverty census tracts with
  Spanish-language service delivery and CHW navigators

### 10. Contact

${input.leadOrgPi ? input.leadOrgPi : "[Principal Investigator]"} · ${input.leadOrg}
ai-ready-${j.code.toLowerCase()}-hub@${input.leadOrg.toLowerCase().replace(/[^a-z0-9]/g, "")}.org

---

${allCites.length ? `**Citations**\n\n${allCites.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n` : ""}*Generated by RPLICE v2 LOI generator from the AI-Ready America Hub Workbench.
Live intelligence retrieved: ${input.live?.retrievedAt ?? "(not yet run)"}*
`;

  return {
    markdown: md,
    citations: allCites,
    jurisdictionName: j.name,
    partnerCount: partners.length,
    programCount: stateProgs.length,
  };
}
