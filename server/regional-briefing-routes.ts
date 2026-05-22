/**
 * Regional Briefing — chat-style, city-agnostic, multi-location compare.
 *
 * v2 (2026-05-22): multi-location compare + stakeholders/outcomes by ZIP +
 * save-as-workflow CRUD. AI extracts locations + topic from one free-text ask.
 *
 * Endpoints:
 *   POST  /api/regional-briefing/extract       — parse question -> {locations, topic}
 *   POST  /api/regional-briefing/stream        — SSE briefing (multi-location)
 *   POST  /api/regional-briefing/query         — non-streaming briefing
 *   GET   /api/regional-briefing/context       — preview matches, no AI cost
 *
 *   GET   /api/regional-briefing/workflows           — list mine
 *   POST  /api/regional-briefing/workflows           — save
 *   GET   /api/regional-briefing/workflows/:slug     — load one
 *   POST  /api/regional-briefing/workflows/:slug/cache  — store last briefing text
 *   DELETE /api/regional-briefing/workflows/:slug    — delete mine
 */
import type { Express, Request, Response, NextFunction } from "express";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./storage";
import {
  briefingWorkflows,
  ecosystemPlatforms,
  grantOpportunities,
  rpliceAssessments,
  rpliceActionPlans,
  outcomeBaselines,
} from "@shared/schema";
import { generateAIJSON, generateAIResponse, streamAIResponse } from "./ai-provider";

const MAX_LEN = 2000;
const MAX_LOCATIONS = 6;

// ── Auth + rate-limit ────────────────────────────────────────────────────────
function getUserId(req: Request): string | undefined {
  const u = (req as unknown as { user?: { claims?: { sub?: string }; id?: string } }).user;
  return u?.claims?.sub || u?.id;
}
function requireSignedIn(req: Request, res: Response, next: NextFunction) {
  if (!getUserId(req)) return res.status(401).json({ error: "Sign in to use the Regional Briefing." });
  return next();
}
function ipHashOf(req: Request): string {
  const raw = req.socket.remoteAddress || "0.0.0.0";
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}
const rateBucket = new Map<string, { count: number; resetAt: number }>();
function rateLimit(opts: { keyPrefix: string; max: number; windowMs: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${opts.keyPrefix}:${ipHashOf(req)}`;
    const now = Date.now();
    const entry = rateBucket.get(key);
    if (!entry || entry.resetAt < now) {
      rateBucket.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    if (entry.count >= opts.max) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again shortly." });
    }
    entry.count += 1;
    return next();
  };
}

function clean(s: unknown, max = MAX_LEN): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

// ── RPLICE context loader (shared by /stream, /query, /followup) ────────────
// Pulls recent CFIR/RE-AIM/fidelity assessments network-wide + action plans
// and outcome baselines scoped to the briefing's county FIPS. Best-effort:
// failures fall back to a one-line marker so the briefing is never blocked.
async function loadRpliceContextBlock(countyFipsList: string[]): Promise<string> {
  try {
    const [recentAssessments, relevantPlans, relevantBaselines] = await Promise.all([
      db
        .select({
          id: rpliceAssessments.id,
          type: rpliceAssessments.assessmentType,
          programName: rpliceAssessments.programName,
          score: rpliceAssessments.score,
          status: rpliceAssessments.status,
        })
        .from(rpliceAssessments)
        .orderBy(sql`${rpliceAssessments.updatedAt} DESC NULLS LAST`)
        .limit(8),
      countyFipsList.length > 0
        ? db
            .select({
              id: rpliceActionPlans.id,
              regionName: rpliceActionPlans.regionName,
              countyFips: rpliceActionPlans.countyFips,
              status: rpliceActionPlans.status,
            })
            .from(rpliceActionPlans)
            .where(inArray(rpliceActionPlans.countyFips, countyFipsList))
            .orderBy(sql`${rpliceActionPlans.updatedAt} DESC NULLS LAST`)
            .limit(8)
        : Promise.resolve([] as Array<{ id: number; regionName: string; countyFips: string; status: string }>),
      countyFipsList.length > 0
        ? db
            .select({
              id: outcomeBaselines.id,
              regionName: outcomeBaselines.regionName,
              countyFips: outcomeBaselines.countyFips,
              timelineMonths: outcomeBaselines.timelineMonths,
              status: outcomeBaselines.status,
            })
            .from(outcomeBaselines)
            .where(inArray(outcomeBaselines.countyFips, countyFipsList))
            .limit(8)
        : Promise.resolve([] as Array<{ id: number; regionName: string; countyFips: string; timelineMonths: number | null; status: string }>),
    ]);

    const lines: string[] = [];
    if (recentAssessments.length > 0) {
      lines.push("Recent RPLICE assessments (network-wide, most recent first):");
      for (const a of recentAssessments) {
        lines.push(`- [${a.type}] ${a.programName} — status=${a.status}${a.score != null ? `, score=${a.score}` : ""}`);
      }
    }
    if (relevantPlans.length > 0) {
      lines.push("");
      lines.push("Existing RPLICE action plans in this region (do NOT duplicate; build on or supersede):");
      for (const p of relevantPlans) {
        lines.push(`- #${p.id} ${p.regionName} (FIPS ${p.countyFips}) — status=${p.status}`);
      }
    }
    if (relevantBaselines.length > 0) {
      lines.push("");
      lines.push("Outcome baselines already tracked in this region:");
      for (const b of relevantBaselines) {
        lines.push(`- #${b.id} ${b.regionName} (FIPS ${b.countyFips}) — ${b.timelineMonths ?? 12}mo timeline, status=${b.status}`);
      }
    }
    if (lines.length === 0) {
      lines.push("No RPLICE assessments, action plans, or outcome baselines found for these counties yet.");
      lines.push("If implementation is in scope, propose: (1) a CFIR assessment, (2) a RE-AIM scorecard, (3) an outcome-baseline row — savable via /rplice-tools or the 'Save as RPLICE action plan' button on follow-up answers.");
    }
    return lines.join("\n");
  } catch (rpliceErr) {
    console.warn("[regional-briefing] RPLICE context fetch failed (continuing without):", rpliceErr);
    return "RPLICE context unavailable for this request.";
  }
}

// Extracts valid 5-digit county FIPS from a locations array.
function extractCountyFips(locs: Array<{ countyFips?: string }>): string[] {
  return locs
    .map((l) => l?.countyFips)
    .filter((f): f is string => typeof f === "string" && /^\d{5}$/.test(f));
}

// Wraps the base system prompt with an RPLICE / implementation-science layer
// so every briefing — not just follow-ups — is implementation-science-grounded.
function wrapWithRpliceLayer(baseSystemPrompt: string, rpliceContextBlock: string): string {
  return [
    baseSystemPrompt,
    "",
    "═══════════════════════════════════════════════════════════════════════",
    "IMPLEMENTATION-SCIENCE LAYER (RPLICE)",
    "═══════════════════════════════════════════════════════════════════════",
    "This is a research + implementation-science platform. If section 7 (implementation plan) or section 8 (measurable outcomes) is in scope, you MUST frame them in RPLICE language:",
    "- CFIR (Consolidated Framework for Implementation Research) for determinants — intervention characteristics · outer setting · inner setting · individuals · process. Name which determinants are favorable vs. risky in this region.",
    "- RE-AIM for outcomes — Reach (who actually gets served, by ZIP) · Effectiveness (the change in the metric that matters) · Adoption (which providers/institutions join) · Implementation (fidelity to the model) · Maintenance (year-2 sustainability plan).",
    "- Fidelity checklist — name the 3–6 things that, if not done with fidelity, kill the result.",
    "- Build on EXISTING action plans / baselines listed below. Do not propose new ones if a live plan already covers this region — refine or sequence into it instead. Cite the action plan # when you reference one.",
    "- If nothing exists yet for this county, recommend creating CFIR + RE-AIM + baseline rows so the work is trackable from day 1.",
    "",
    "RPLICE STATE FOR THESE COUNTIES:",
    rpliceContextBlock,
    "═══════════════════════════════════════════════════════════════════════",
  ].join("\n");
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface BriefingLocation {
  label: string;          // human-readable: "Round Rock TX 78664"
  region: string;         // city/county/region for narrative + grant filter
  zip?: string;           // optional 5-digit ZIP
  countyFips?: string;    // optional 5-digit FIPS (for Chainweb-anywhere)
  metroId?: string;       // optional internal metro id
}

interface LocationContext {
  location: BriefingLocation;
  grants: GrantHit[];
  platforms: PlatformHit[];
}

interface GrantHit {
  id: string;
  title: string;
  agency: string | null;
  funding_amount: string | null;
  deadline: string | null;
  fit_score: number | null;
  status: string | null;
  source_url: string | null;
  cfda: string | null;
  snippet: string;
}
interface PlatformHit {
  name: string;
  url: string | null;
  role: string | null;
  description: string | null;
}

// ── AI extraction: question -> {locations[], topic} ─────────────────────────
async function extractLocationsAndTopic(question: string): Promise<{ locations: BriefingLocation[]; topic: string }> {
  const sys = [
    "You extract structured fields from a user's regional-briefing question.",
    "Return STRICT JSON of the form:",
    '{"locations":[{"label":"...","region":"...","zip":"...","countyFips":"...","metroId":"..."}],"topic":"..."}',
    "- locations: 1–6 items. ONE per place the user wants briefed/compared.",
    "  • label = short human-friendly tag the UI will show (city + state + ZIP if given).",
    "  • region = the city/county/region only — no state suffix unless needed for disambiguation.",
    "  • zip = 5-digit ZIP if explicitly named, else omit.",
    "  • countyFips = 5-digit US county FIPS if you know it confidently, else omit.",
    "  • metroId = omit (internal id, leave blank).",
    "- topic = short issue/sector phrase (e.g., 'childcare infrastructure', 'reentry housing', 'behavioral health access').",
    "- If user named no place, return one location with region='United States'.",
    "- If user named no topic, return topic='community well-being'.",
    "- Do NOT invent ZIPs or FIPS codes you aren't sure of. Omit instead.",
    "- JSON only. No prose. No extra fields.",
  ].join("\n");
  try {
    const out = await generateAIJSON<{
      locations?: Array<{ label?: string; region?: string; zip?: string; countyFips?: string; metroId?: string }>;
      topic?: string;
    }>(`User question: ${question}\n\nReturn JSON only.`, sys);
    const rawLocs = Array.isArray(out?.locations) ? out!.locations! : [];
    const locations: BriefingLocation[] = rawLocs.slice(0, MAX_LOCATIONS).map((l) => {
      const region = clean(l.region, 200) || "United States";
      const zip = /^\d{5}$/.test(String(l.zip ?? "").trim()) ? String(l.zip).trim() : undefined;
      const countyFips = /^\d{5}$/.test(String(l.countyFips ?? "").trim()) ? String(l.countyFips).trim() : undefined;
      const label = clean(l.label, 200) || (zip ? `${region} ${zip}` : region);
      return { label, region, zip, countyFips };
    });
    const safeLocations = locations.length ? locations : [{ label: "United States", region: "United States" }];
    const topic = clean(out?.topic, 200) || "community well-being";
    return { locations: safeLocations, topic };
  } catch {
    return { locations: [{ label: "United States", region: "United States" }], topic: "community well-being" };
  }
}

function tokensFrom(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

async function loadLocationContext(loc: BriefingLocation, topic: string): Promise<LocationContext> {
  const tokens = [
    ...tokensFrom(loc.region),
    ...tokensFrom(topic),
    ...(loc.zip ? [loc.zip] : []),
  ].filter((t, i, a) => a.indexOf(t) === i);

  const topicMatch = tokens.length
    ? sql`(${sql.join(
        tokens.map(
          (t) =>
            sql`(LOWER(${grantOpportunities.title}) LIKE ${"%" + t + "%"} OR LOWER(COALESCE(${grantOpportunities.description},'')) LIKE ${"%" + t + "%"})`,
        ),
        sql` OR `,
      )})`
    : sql`TRUE`;
  // Hard rule: never surface grants whose deadline has passed.
  // Allow NULL deadlines (rolling) and future deadlines only.
  const notClosed = sql`(${grantOpportunities.deadline} IS NULL OR ${grantOpportunities.deadline} >= CURRENT_DATE)`;
  const filtered = sql`(${topicMatch}) AND ${notClosed}`;

  const grants = await db
    .select({
      id: grantOpportunities.id,
      title: grantOpportunities.title,
      agency: grantOpportunities.agency,
      funding_amount: grantOpportunities.fundingAmount,
      deadline: grantOpportunities.deadline,
      fit_score: grantOpportunities.fitScore,
      status: grantOpportunities.status,
      source_url: grantOpportunities.sourceUrl,
      cfda: grantOpportunities.cfda,
      description: grantOpportunities.description,
    })
    .from(grantOpportunities)
    .where(filtered)
    .orderBy(sql`${grantOpportunities.fitScore} DESC NULLS LAST, ${grantOpportunities.deadline} ASC NULLS LAST`)
    .limit(20);

  // Canonical 15 public-facing platforms (replit.md gotcha: "External count = 15, never 25").
  // DB drift across environments has caused stale rows (e.g. "Advertising Targeting", "PillScheduler",
  // "Ecosystem Nexus", "Code Canvas") to leak into briefings. Lock the list at the source.
  const CANONICAL_PUBLIC_15 = [
    "Whole-Person Health Ecosystem",
    "Talk Your Talk",
    "LexiBridge (Speech Bridge)", // legacy DB alias for Talk Your Talk — TYT connector overwrites on heartbeat
    "Sankofa Health Network",
    "Black Maternal Health Network",
    "Black Men's Health Hub",
    "HerHealth Network (Holistic Black Feminine Health Hub)",
    "SafeCogniCare",
    "Perfectly Different",
    "LifeBridge",
    "Mission Transition (M2C)",
    "Minority Center of Excellence",
    "ISSS — Integrated Supports for Thriving Youth",
    "RPLICE — Research-to-Practice Lifecycle Implementation & Community Evidence",
    "SafeReport",
    "Civic Signal",
  ];
  const platformsRaw = await db
    .select({
      name: ecosystemPlatforms.name,
      url: ecosystemPlatforms.url,
      role: ecosystemPlatforms.role,
      description: ecosystemPlatforms.description,
    })
    .from(ecosystemPlatforms)
    .where(and(eq(ecosystemPlatforms.publicVisible, true), inArray(ecosystemPlatforms.name, CANONICAL_PUBLIC_15)))
    .orderBy(ecosystemPlatforms.name);
  // De-dupe LexiBridge ↔ Talk Your Talk legacy collision (whichever name the row carries, surface once as "Talk Your Talk").
  const seen = new Set<string>();
  const platforms = platformsRaw
    .map((p) => (p.name.startsWith("LexiBridge") ? { ...p, name: "Talk Your Talk" } : p))
    .filter((p) => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  return {
    location: loc,
    grants: grants.map((g) => ({
      id: g.id,
      title: g.title,
      agency: g.agency,
      funding_amount: g.funding_amount,
      deadline: g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : null,
      fit_score: g.fit_score,
      status: g.status,
      source_url: g.source_url,
      cfda: g.cfda,
      snippet: (g.description ?? "").slice(0, 240),
    })),
    platforms,
  };
}

function buildSystemPrompt(multi: boolean): string {
  const lines = [
    "You are a Regional Briefing AI built INSIDE TCAF, but the briefing is NOT a TCAF pitch. You write a DEEP, INTERCONNECTED data story — the kind of briefing where, when someone finishes reading, they actually understand the PLACE: its geography, history, economy, demographic shifts, civic anatomy, and the live forces pressing on it right now. Not a section dump. A woven narrative. Service to the community + the named audience comes first; TCAF appears only when the user has explicitly invited it in.",
    "",
    "🚨 PARTNER-AUDIENCE RULE (READ THIS FIRST, EVERY TIME).",
    "When the audience is anyone other than 'TCAF internal' — a partner organization, a coalition, a funder, a city, an ISD, a hospital, an FQHC, a community group — TCAF is a GUEST. The audience is the lead. The briefing's job is to make THE AUDIENCE smarter about the community and the implementation logic, so THE AUDIENCE can act. This is not a fundraising tool. This is not a capability menu. Do NOT close with 'here's what TCAF can offer.' Do NOT pivot to grants. Do NOT enumerate the platform list. If a partner has offered TCAF a seat at their table, they don't need to be sold to — they need to be informed.",
    "",
    "Default posture: 'You (the audience) lead. Here is what your community is already doing. Here is what your levers are. Here is how to act with fidelity. We're here if you want help on a specific thing — ask.'",
    "",
    "🎯 SCOPE CONTROL — READ THE USER'S QUESTION FIRST.",
    "The user controls what they get. Your job is to give them ONLY what they asked for. Do not append grants, TCAF solutions, implementation plans, or outcomes unless they explicitly asked for them. More is NOT better — staying in scope is the job.",
    "",
    "Read the USER QUESTION carefully and pick a scope. When in doubt, pick the smallest scope that honestly answers the question and offer the larger scopes at the end as a one-line menu (e.g., \"Want me to go deeper on the implementation logic (CFIR), the outcomes scorecard (RE-AIM), or the asset map? Just ask.\"). Notice that the default offer-line should NOT mention funding or TCAF capabilities — those are only on the menu if the user invited them. If the user names a third-party audience (United Way, a foundation, a city, a coalition), frame the WHOLE briefing through THAT audience's lens — do not center TCAF unless they tell you to.",
    "",
    "SCOPE MENU — produce ONLY the sections that match the user's intent:",
    "",
    "[A] SITUATION UNDERSTANDING (DEFAULT when user says 'tell me about', 'what's happening', 'help me understand', 'I'm preparing for a meeting with X', 'paint the picture', etc.)",
    "    → Produce sections 1, 2, 3, 4 only. Stop there. Do NOT add grants, TCAF capabilities, plans, or outcomes.",
    "",
    "[B] ASSET / ECOSYSTEM MAP (when user says 'what's already there', 'who's serving this community', 'map the assets', 'what's the landscape', 'what exists already')",
    "    → Produce sections 1, 2, 3, 4, and a section [Assets in the region] that maps EVERY public + nonprofit + philanthropic + faith + business-anchor + coalition asset already serving the area — NOT just TCAF. Pull from your general knowledge of the region's public infrastructure (county/ISD/MHMR/FQHC/hospital district/workforce board/library system/health dept), nonprofit ecosystem (food banks, shelters, reentry, refugee resettlement, DV, youth-serving, faith anchors, immigrant-serving, disability), philanthropy (community foundations, corporate giving, healthcare anchor community-benefit), and coordinating tables (CoC, behavioral-health consortia, education collective-impact, food-systems coalitions). Mark [verify] for any specific org/name you're not 95% sure of. Do NOT include TCAF platforms unless the user asked for them.",
    "",
    "[C] FUNDING PICTURE (when user says 'what grants', 'who funds this', 'show me the money', 'funding picture')",
    "    → Produce sections 1, 2, 3, 4, plus section 5 (grants). Do NOT add TCAF solutions or plan unless asked.",
    "",
    "[D] TCAF FIT (ONLY when user EXPLICITLY says 'how would TCAF help', 'what can we offer', 'where do we plug in', 'show me TCAF capabilities', or names a TCAF platform by name). Do NOT pick [D] just because the audience is a potential funder or partner — those are still [A] until the user explicitly invites TCAF in.",
    "    → Produce sections 1, 2, 3, 4, plus section 6 (TCAF as a possible contributor — NOT a pitch). Be honest about what already exists in the ecosystem and where TCAF is genuinely additive vs. duplicative. The audience is in charge; TCAF is on offer only as a contributor.",
    "",
    "[E] FULL ANALYSIS (when user says 'build me a plan', 'full briefing', 'implementation plan', 'what should we do', 'how do we execute', 'CFIR / RE-AIM', 'the whole thing')",
    "    → Produce sections 1, 2, 3, 4, 7 (CFIR implementation), 8 (RE-AIM outcomes). §7 and §8 are MANDATORY in [E] — if you skip them, you've failed the scope.",
    "    → DO NOT include §5 (funding) unless the user ALSO explicitly asked for funding. DO NOT include §6 (TCAF) unless the user ALSO explicitly asked 'how does TCAF fit' or named TCAF capabilities. A partner asking for a 'full plan' is asking for the PLAN, not a TCAF brochure or a grant list.",
    "    → If the user explicitly mixed intents (e.g., 'full plan AND show me the grants', 'full plan AND how TCAF plugs in'), THEN add §5 and/or §6 accordingly.",
    "",
    "If the user's question mixes intents (e.g., 'understand the situation AND show me the grants'), combine the matching sections only.",
    "",
    "PRE-FLIGHT ANCHOR — REQUIRED FIRST LINE OF YOUR OUTPUT. Before producing any section, you MUST write exactly one line in this format, then a blank line, then begin: ",
    "    `> Audience: <name or 'TCAF internal'> · Scope: <letter A/B/C/D/E + section numbers> · Disciplines on: R&R, CFIR, RE-AIM, fidelity, dignity-clause`",
    "This forces you to commit to the audience and scope before you drift. If you cannot fill in the audience confidently, write 'TCAF internal'. If you cannot determine scope, default to [A] (sections 1–4).",
    "",
    "GRANTS DISCIPLINE — DO NOT BE A GRANT ROLLER. Default = NO grant section. Only produce §5 when the user explicitly asks for funding ('grants', 'funding', 'money', 'who pays', 'pursue dollars', 'RFP') OR explicitly picks scope [C] or [E]. In every other scope ([A]/[B]/[D]), the GRANT CANDIDATES block in the user prompt is reference-only — do NOT surface it, do NOT list grants in passing, do NOT close with grant suggestions. If you think a grant is genuinely worth flagging, end with ONE single line: 'Want the funding picture? Ask for it.' That's it.",
    "GRANTS ACCURACY — only grants in the GRANT CANDIDATES block. The block is already pre-filtered to non-closed deadlines server-side, but if a deadline in the block has passed by the time you reply, SKIP it. Never invent or recall closed grants from memory.",
    "ECOSYSTEM ACCURACY — only platforms in the TCAF ECOSYSTEM PLATFORMS block. The block is already locked to the canonical 15 public-facing platforms. NEVER mention platforms like 'Advertising Targeting', 'Autoimmune Center of Excellence', 'Code Canvas', 'Ecosystem Nexus', 'Emergency Management', 'PillScheduler', 'Pinnacle Business' — these are internal or retired and must not appear in any output. If a platform isn't in the block, it doesn't exist for this briefing.",
    "",
    "THE BAR (applies to every scope):",
    "- Treat each location as a living system, not a row in a table. Pretend you grew up there. What does someone learn driving the county on a Tuesday morning?",
    "- EVERY data point must connect to (a) the people it lands on, (b) the institution that owns the response, (c) the upstream cause, (d) the downstream consequence if nothing changes. If you can't draw those four threads, the stat doesn't belong.",
    "- Name the hidden drivers — annexation history, school-district boundaries, redlining patterns, water/power infrastructure, ISD bond cycles, MHMR/LMHA catchment, oil & gas legacy, refugee-resettlement corridors, jail-population trends, FQHC service-area maps. These are usually the real story under the surface stat.",
    "- Show the THREADS between whichever sections you produce. A stat in section 2 should reappear as a stakeholder action in section 4 (and onward, if those sections are in scope). Don't repeat — interlock.",
    "- Comparison mode (multi-location): compare SYSTEMS, not stats. Same demographic shift, different civic capacity. Why does intervention X work here and fail 30 miles away?",
    "- RECOGNITION-AND-RATIFICATION DOCTRINE (TCAF / Flood, 2026 — operating lens for every briefing). Communities are already adapting BEFORE the formal system shows up. Grandmothers do the childcare, aunties do the eldercare, barbershops do the mental-health check-ins, churches do the food and the funeral logistics, neighbors absorb the returning citizen, cousins double up the housing, promotoras do the diabetes outreach, returning citizens mentor the next ones home, peer-recovery folks hold the relapsing friend, family caregivers do the disability support, side-hustlers do the income smoothing, informal tutors do the literacy work, doulas do the perinatal coverage, faith volunteers do the immigration navigation. THIS IS THE ACTUAL BASELINE. The counterfactual you're trying to change is not 'nothing is happening' — it is 'a lot is happening, sub-optimally, invisibly, and at personal cost to the adapters.' This briefing apparatus is the ACTOR — its job is to do the seeing, translating, and resourcing. Three things flow from that: (1) THE MECHANISM IS AT THE BRIEFING LAYER. Prior strands (Positive Deviance, Harm Reduction, ABCD, CHW/task-shifting, Rogers' reinvention, FRAME-IS, Lipsky's street-level bureaucracy, Green's practice-based evidence) act on the community or the practitioner. R&R puts the duty here, on the briefing. You SEE the adaptation, NAME the people doing it, TRANSLATE it into a policy/funding ask, and RESOURCE it. (2) THE DIGNITY CLAUSE IS A HARD NON-DISPLACEMENT CONSTRAINT. Bring the adapters INTO the fold — equip, train, network, credential, insure, micro-grant, license-pathway, channel real pay — so they keep doing what they're already doing, with dignity, legal cover, and durability. REFUSE any move that professionalizes the function out of their hands (the CHW-over-medicalization, harm-reduction-clinic-capture, peer-support-clinician-supervised, doula-hospital-defanged failure pattern). (3) THE COUNTERFACTUAL CLAIM IS THE BITE. R&R is not one way to do implementation. R&R is the only path that actually moves the dependent variable, because any approach that DISPLACES existing adaptation is fighting a current rather than riding one. The intervention's success metric is not 'we built a thing' — it is 'the people already holding this community got the backing they needed.' Apply this lens regardless of domain (early care, behavioral health, reentry, workforce, food, housing, education, eldercare, immigration, disability). When you write sections 4 / 6 / 7, the informal/community adapters belong in them by default. When asked where this comes from, cite docs/recognition-and-ratification-doctrine.md and name the eight component strands honestly — this is a TCAF synthesis, not a single inherited theory.",
    "",
    "SECTION DEFINITIONS (use these exact H2 headings, in this order, only for sections in scope):",
    "## 1. The place (the setting)",
    "    For EACH location: 2–4 paragraphs establishing the world. Geography + economy + demographic shift (last 10–20y) + civic structure (county judge form, ISD count, LMHA, hospital district) + the 1–2 historical decisions that still shape today (annexation, refinery siting, ISD splits, base closures, immigration waves). This is the lens every later section views through.",
    "## 2. The data story (woven)",
    "    Plain-language narrative of what's actually happening on the ground. Per location, weave the stats together: who is affected, where they live, what institution is supposed to be catching them, why it isn't, what the trend line says. Use numbers IN sentences, not stat blocks. Show cause→effect→consequence.",
    "## 3. Verifiable data (primary sources)",
    "    Two-column treatment: what numbers you HAVE in this context vs. what needs a primary-source pull (Census ACS, CDC PLACES, ATSDR SVI, FBI CDE, TEA AEIS, HHSC, state portals, TCAF Corridor Chainweb). Cite source name + URL when possible. Flag conflicts.",
    "## 4. The stakeholder ecosystem (named, by ZIP)",
    "    For EACH location, the real human anatomy by ZIP / county. Not a list — a map of who-touches-whom: county judge → commissioners court → ISD superintendents → MHMR/LMHA director → FQHC CMOs → hospital district CEO → workforce board director → DA + sheriff + chief PD/PO → faith-network anchors → philanthropy program officers → grassroots conveners. Mark [verify] for any name you're not 95% sure of. Add a one-line note on each: what they actually control, and what they're known to care about right now.",
    "## 5. Funding picture (situated — only if in scope)",
    "    AUDIENCE RULE: when a third-party audience is named (United Way, foundation, city, coalition), the grants you surface in this section must be ones THE AUDIENCE could realistically pursue, recommend, or co-fund — NOT grants TCAF or ecosystem platforms would chase for themselves. If the GRANT CANDIDATES block contains grants only TCAF could apply for, say so honestly and offer to surface them in a follow-up. Then for each grant: title, agency, $, deadline, fit, link. Situate each one: which ZIP / which stakeholder / which problem from §2 does it solve? Group by location if multi.",
    "## 6. TCAF as a possible contributor (ONLY if user explicitly invited — default = OMIT this section entirely)",
    "    DEFAULT FOR THIRD-PARTY AUDIENCES = DO NOT WRITE THIS SECTION. The audience did not ask for a TCAF pitch. If they wanted one, they would have said 'how can TCAF plug in' or 'where do we fit'. Without that explicit invitation, SKIP §6 even in scope [E].",
    "    IF (and only if) the user explicitly invited TCAF capabilities: heading is 'TCAF as a possible contributor for [Audience]'. Answer ONE question: which 1–3 TCAF capabilities (not all 15) would [Audience] genuinely benefit from for ONE specific decision they're making. Be explicit about what's ALREADY covered by community adapters (R&R) or existing ecosystem assets — and therefore does NOT need TCAF. Lead with what they don't need from us. Close with: 'If any of these are useful, here's who to talk to. If not, no offense taken — the work belongs to the community.'",
    "## 7. Implementation plan by ZIP — CFIR-framed (MANDATORY in scope [E] — if you skip §7 in scope [E] you have failed)",
    "    For EACH location's primary ZIP(s), you MUST produce this exact structure (use these H3 headings literally):",
    "    ### CFIR determinants for this ZIP",
    "        Walk the five CFIR domains briefly and concretely: (1) Intervention characteristics (what the R&R-backed move actually is and why it's adaptable), (2) Outer setting (policy, funding, community readiness — name the specific Texas/county policy levers), (3) Inner setting (which institution houses the convening — ISD? FQHC? County HCHS? — its culture and constraints), (4) Individuals (the named stakeholders from §4 whose buy-in is required), (5) Process (what convening / planning / piloting / scaling steps fit here). Flag which determinants are FAVORABLE vs. RISKY in this ZIP.",
    "    ### Fidelity-critical actions (the 3–6 things that, if not done with fidelity, kill the result)",
    "        Bulleted. Name each one in plain language. These are the dignity-clause guardrails — usually about not displacing the existing adapters.",
    "    ### Sequenced rollout (30 / 60 / 90 day)",
    "        4–8 ordered steps. Each step names (a) the owner, (b) the stakeholder convening from §4, (c) the TCAF backbone capability from §6 (if any — be honest if none is needed), (d) the funding source from §5, (e) the 30/60/90-day milestone.",
    "## 8. Measurable outcomes per stakeholder per ZIP — RE-AIM scorecard (MANDATORY in scope [E] — if you skip §8 in scope [E] you have failed)",
    "    For EACH location, you MUST produce this exact structure (use these H3 headings literally):",
    "    ### RE-AIM scorecard for this ZIP",
    "        Walk the five RE-AIM dimensions concretely: (1) Reach — who actually gets served, by ZIP, baseline → 12mo target, with denominator (e.g., '450 of 1,340 children needing care in 78642'). (2) Effectiveness — the change in the metric that matters (waitlist time, ECI referral rate, credentialed-FFN count, parent-employment retention). (3) Adoption — which providers / institutions / community adapters joined, named. (4) Implementation — fidelity score: of the fidelity-critical actions in §7, how many are being executed as designed; what's slipping. (5) Maintenance — the year-2 sustainability plan (funding, governance, who carries it after pilot $ ends).",
    "    ### Outcome commitments table",
    "        Markdown table: stakeholder | ZIP | committed outcome | RE-AIM dimension (Reach/Eff/Adopt/Impl/Maint) | metric (count / % / $ / days served) | timeframe (90d / 6mo / 12mo) | evidence source.",
  ];
  if (multi) {
    lines.push(
      "## 9. Cross-location systems comparison (multi-location, in scope at any depth)",
      "    Do NOT just tabulate similarities and differences. Compare the SYSTEMS: same demographic shift but different civic capacity? Markdown table of dimensions (demographic engine · economic base · civic capacity · political risk) × locations. Then 4–6 bullets on the strategic implication. If grants/TCAF/plan are out of scope, drop the grant-fit + lead-capability columns and the entity-strategy bullets.",
    );
  }
  lines.push(
    "## 10. Concrete next moves (only if user asked for action)",
    "    Named, owned, dated. Each move references a section above so the user can trace why.",
    "## 11. Iron Rule reminders (always include when the briefing makes verifiable claims)",
    "    Bulleted list of claims in this briefing that need a primary-source pull before any external use. Be specific (which paragraph, which number).",
    "",
    "RULES (non-negotiable, every scope):",
    "- STAY IN SCOPE. Producing extra sections the user didn't ask for is a failure, not a bonus.",
    "- Never invent grant titles, funder names, dollar amounts, deadlines, IDs, or stats. Use only the GRANT CANDIDATES + PLATFORMS blocks plus widely-known public facts. When unsure, mark '[needs primary-source pull]'.",
    "- Never invent stakeholder names. If you don't know the current county judge / superintendent / LMHA director, write 'the [role] (verify current officeholder)'.",
    "- 'President' not 'CEO' for Dr. Flood. Institutional email only: terryflood@thrivingcommunitiesforall.com.",
    "- If ANY location touches the City of Austin, FLAG that Meredith Sisnett (City employee) cannot be on any City-of-Austin pass-through.",
    "- Plain language. No jargon walls. The reader is a smart, busy practitioner — not an academic.",
    "- If section 6 is in scope: when a third-party audience is named (United Way, foundation, city, coalition), pick only the 2–4 TCAF capabilities that audience actually needs and be explicit about what's already covered by R&R adapters or the existing ecosystem. Only when audience is 'TCAF internal' AND the user explicitly asks for a full inventory may you enumerate every capability.",
    "- If section 8 is in scope, outcomes must be measurable AND attributable to a named stakeholder AND tied to a timeframe.",
    "- End with a single-line offer of the OTHER scopes the user didn't pick, BUT phrase it audience-first, not TCAF-first. Default: \"Want me to go deeper on the implementation logic (CFIR), the outcomes scorecard (RE-AIM), or map the wider ecosystem of who's already doing this work? Just ask.\" Only mention funding or TCAF capabilities in the close-line if the user has already invited them.",
    "- RECOGNITION-AND-RATIFICATION CLOSE: when the audience is a partner (anyone other than 'TCAF internal'), end the briefing with one short paragraph asking 'what is this community already doing that you (the audience) could ratify and resource?' This is the dignity-clause reflex. It is not a pitch. It hands the action back to the audience.",
  );
  return lines.join("\n");
}

function blockForLocation(ctx: LocationContext, idx: number, includeGrants: boolean): string {
  const header = [
    `=== LOCATION ${idx}: ${ctx.location.label} ===`,
    `  Region: ${ctx.location.region}${ctx.location.zip ? `  ZIP: ${ctx.location.zip}` : ""}${ctx.location.countyFips ? `  CountyFIPS: ${ctx.location.countyFips}` : ""}`,
  ];
  if (!includeGrants) {
    // Funding not invited — withhold grant rows entirely so the model can't
    // pivot the briefing into a funding pitch.
    return [...header, `  GRANT CANDIDATES: withheld (funding not in scope for this question).`].join("\n");
  }
  const g = ctx.grants.length
    ? ctx.grants
        .map(
          (x, i) =>
            `  [L${idx}-G${i + 1}] ${x.title}\n      Agency: ${x.agency ?? "n/a"} | Funding: ${x.funding_amount ?? "n/a"} | Deadline: ${x.deadline ?? "n/a"} | Fit: ${x.fit_score ?? "n/a"} | Status: ${x.status ?? "n/a"} | CFDA: ${x.cfda ?? "n/a"}\n      URL: ${x.source_url ?? "n/a"}\n      Snippet: ${x.snippet.replace(/\s+/g, " ").trim()}`,
        )
        .join("\n")
    : "  (no matching grants — note this honestly)";
  return [...header, `  GRANT CANDIDATES (${ctx.grants.length}):`, g].join("\n");
}

// Lightweight intent heuristics. These gate whether we even SHOW the model the
// grants block or the TCAF platforms block. If the user hasn't invited funding
// or TCAF, we don't even let the model see those rows — that's the only way to
// stop it from sneaking them back in.
function hasFundingIntent(q: string): boolean {
  return /\b(grant|grants|funding|funder|funders|rfp|rfa|nofo|money|dollar|\$|pursue dollars|who pays|who funds|fundraising|capital)\b/i.test(q);
}
function hasTcafIntent(q: string): boolean {
  return /\b(tcaf|how (does|would|can) (we|tcaf|the platform) (help|plug|fit|contribute)|where do we (plug|fit)|what can we offer|our capabilities|our platforms|backbone capabilities)\b/i.test(q);
}

function buildUserPrompt(contexts: LocationContext[], topic: string, question: string): string {
  const platforms = contexts[0]?.platforms ?? [];
  const wantsFunding = hasFundingIntent(question);
  const wantsTcaf = hasTcafIntent(question);

  // GRANT CANDIDATES block: only injected when the user signaled funding intent.
  // Otherwise the model literally cannot list grants — no source rows to draw from.
  const locsBlock = contexts.map((c, i) => blockForLocation(c, i + 1, wantsFunding)).join("\n\n");
  const labels = contexts.map((c) => c.location.label).join(" | ");

  // TCAF PLATFORMS block: only injected when the user invited TCAF in.
  // Otherwise the platforms are invisible to the model, and §6 cannot be written.
  const tcafBlock = wantsTcaf
    ? [
        `=== TCAF ECOSYSTEM PLATFORMS (${platforms.length} public-facing) — the user has explicitly asked about TCAF fit; pick the 1–3 most relevant only ===`,
        platforms.length
          ? platforms.map((p) => `- ${p.name} (${p.role ?? "n/a"}) — ${p.description ?? "n/a"} — ${p.url ?? "n/a"}`).join("\n")
          : "(no public-visible platforms loaded)",
        "",
      ].join("\n")
    : "=== TCAF ECOSYSTEM PLATFORMS: NOT INJECTED — the user did not invite TCAF. §6 is OUT OF SCOPE. Do NOT write §6, do NOT enumerate capabilities, do NOT close with what TCAF can offer. ===";

  const fundingNote = wantsFunding
    ? `=== FUNDING INTENT: DETECTED — §5 may be written if scope allows. Grants are listed per-location above. ===`
    : `=== FUNDING INTENT: NOT DETECTED — §5 is OUT OF SCOPE. The grant rows have NOT been injected. Do NOT list grants, do NOT name funders, do NOT close with funding suggestions. If the user wants funding they will ask. ===`;

  // Default fallback question used to be a TCAF/grant sales pitch. Replaced with
  // a community-and-audience-first ask so the model defaults to service, not selling.
  const defaultQuestion = "Brief me on this place — geography, demographics, civic anatomy, the live forces pressing on the community right now, who's already doing the work, and what the named audience would need to understand to act with fidelity.";

  return [
    `TOPIC: ${topic}`,
    `LOCATIONS (${contexts.length}): ${labels}`,
    `USER QUESTION: ${question || defaultQuestion}`,
    "",
    locsBlock,
    "",
    fundingNote,
    "",
    tcafBlock,
    "",
    "Now produce the briefing per the system prompt. Obey the PRE-FLIGHT ANCHOR (first line, quoted). Obey the PARTNER-AUDIENCE RULE — if the audience is anyone other than 'TCAF internal', you are a guest at their table, not a salesperson. Obey the chosen scope — producing sections the user didn't ask for is a failure. Be specific. Tell the data story. Serve the community first.",
  ].join("\n");
}

// ── No-AI structured briefing ────────────────────────────────────────────────
// Door 2: assembles the briefing markdown directly from DB rows. No LLM call.
// If the AI provider is down, slow, or off-discipline, this surface still works.

type BriefingScope = "A" | "B" | "C" | "D" | "E";

function parseScope(raw: unknown): BriefingScope {
  const v = String(raw ?? "").trim().toUpperCase();
  return v === "B" || v === "C" || v === "D" || v === "E" ? (v as BriefingScope) : "A";
}

// Scope rules for the structured door. Mirrors the AI-door philosophy:
//   §5 funding ONLY when scope = C (or user-flagged includeFunding).
//   §6 TCAF   ONLY when scope = D (or user-flagged includeTcaf).
//   §7/§8 (CFIR/RE-AIM) come with scope E. Scope E intentionally does NOT
//   include §5 or §6 — a partner asking for the "full plan" is asking for the
//   plan, not a TCAF brochure or a grant list.
function scopeIncludes(
  scope: BriefingScope,
  section: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
  flags?: { includeFunding?: boolean; includeTcaf?: boolean },
): boolean {
  if (section <= 4) return true;
  if (section === 5) return scope === "C" || !!flags?.includeFunding;
  if (section === 6) return scope === "D" || !!flags?.includeTcaf;
  return scope === "E"; // 7, 8
}

// Per-county RPLICE pull. rpliceAssessments are NOT scoped by countyFips in the
// schema, so we deliberately do NOT render them under per-location headings —
// rendering them there would be geographic misattribution. They surface
// network-wide in a separate clearly-labelled section instead.
async function loadStructuredRpliceForCounty(countyFips: string) {
  if (!/^\d{5}$/.test(countyFips)) return { plans: [], baselines: [] };
  const [plans, baselines] = await Promise.all([
    db
      .select()
      .from(rpliceActionPlans)
      .where(eq(rpliceActionPlans.countyFips, countyFips))
      .orderBy(sql`${rpliceActionPlans.updatedAt} DESC NULLS LAST`)
      .limit(5),
    db
      .select()
      .from(outcomeBaselines)
      .where(eq(outcomeBaselines.countyFips, countyFips))
      .orderBy(sql`${outcomeBaselines.updatedAt} DESC NULLS LAST`)
      .limit(5),
  ]);
  return { plans, baselines };
}

async function loadNetworkWideAssessments() {
  return db
    .select({
      id: rpliceAssessments.id,
      type: rpliceAssessments.assessmentType,
      programName: rpliceAssessments.programName,
      score: rpliceAssessments.score,
      status: rpliceAssessments.status,
    })
    .from(rpliceAssessments)
    .orderBy(sql`${rpliceAssessments.updatedAt} DESC NULLS LAST`)
    .limit(8);
}

function buildStructuredBriefing(args: {
  contexts: LocationContext[];
  topic: string;
  scope: BriefingScope;
  rpliceByCounty: Map<string, Awaited<ReturnType<typeof loadStructuredRpliceForCounty>>>;
  networkAssessments: Awaited<ReturnType<typeof loadNetworkWideAssessments>>;
  includeFunding?: boolean;
  includeTcaf?: boolean;
  audience?: string | null;
}): string {
  const { contexts, topic, scope, rpliceByCounty, networkAssessments, includeFunding, includeTcaf, audience } = args;
  const flags = { includeFunding, includeTcaf };
  const lines: string[] = [];
  const audienceLabel = contexts.length > 1 ? `${contexts.length} locations` : contexts[0]?.location.label ?? "United States";

  lines.push(`> Source: Data-only briefing (no AI) · Topic: ${topic} · Scope: [${scope}] · Locations: ${audienceLabel} · Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`# ${topic} — data-only briefing`);
  lines.push("");
  lines.push("> This briefing is assembled directly from the platform database. Every row below came from a real query, not a model. Use it as the trusted backbone; the AI briefing adds narrative on top.");
  lines.push("");

  // §1 Place
  if (scopeIncludes(scope, 1)) {
    lines.push("## 1. Place");
    for (const c of contexts) {
      const bits = [c.location.region, c.location.zip ? `ZIP ${c.location.zip}` : null, c.location.countyFips ? `County FIPS ${c.location.countyFips}` : null].filter(Boolean);
      lines.push(`- **${c.location.label}** — ${bits.join(" · ")}`);
    }
    if (!contexts.some((c) => c.location.countyFips)) {
      lines.push("");
      lines.push("> _Tip: add a 5-digit county FIPS to each location to unlock RPLICE plans + outcome baselines + Chainweb pulls. ANSI lookup at census.gov/library/reference/code-lists/ansi.html._");
    }
    lines.push("");
  }

  // §2 Data story (county-scoped action plans only — assessments are
  // network-wide and rendered separately to avoid geographic misattribution)
  if (scopeIncludes(scope, 2)) {
    lines.push("## 2. Data story (county-scoped rows on file)");
    const hasAny = Array.from(rpliceByCounty.values()).some((r) => r.plans.length);
    if (!hasAny) {
      lines.push("- No RPLICE action plans recorded for these counties yet.");
      lines.push("- Run the Chainweb pull from the briefing page to populate Census ACS · CDC PLACES · ATSDR SVI · FBI CDE evidence for each county.");
      lines.push("- Then come back here and the data story will fill itself in.");
    } else {
      for (const c of contexts) {
        const r = c.location.countyFips ? rpliceByCounty.get(c.location.countyFips) : undefined;
        if (!r?.plans.length) continue;
        lines.push(`### ${c.location.label}`);
        for (const p of r.plans) {
          lines.push(`- RPLICE plan #${p.id} — **${p.regionName}** (status: ${p.status})`);
        }
      }
    }
    if (networkAssessments.length) {
      lines.push("");
      lines.push("**Network-wide RPLICE assessments (not county-scoped — context only):**");
      for (const a of networkAssessments) {
        lines.push(`- [${a.type}] **${a.programName}** — status: ${a.status}${a.score != null ? ` · score ${a.score}` : ""}`);
      }
    }
    lines.push("");
  }

  // §3 Verifiable data — list primary sources we routinely pull
  if (scopeIncludes(scope, 3)) {
    lines.push("## 3. Verifiable data (primary sources)");
    lines.push("| Source | What it gives you | URL |");
    lines.push("|---|---|---|");
    lines.push("| Census ACS 5-year | demographics, income, language, household type | https://data.census.gov |");
    lines.push("| CDC PLACES | small-area health outcomes (chronic disease, mental health) | https://www.cdc.gov/places |");
    lines.push("| ATSDR SVI | Social Vulnerability Index by tract | https://www.atsdr.cdc.gov/placeandhealth/svi |");
    lines.push("| FBI Crime Data Explorer | offense/arrest by agency | https://cde.ucr.cjis.gov |");
    lines.push("| HHSC Childcare Licensing (TX) | licensed centers + family homes | https://www.hhs.texas.gov/services/safety/child-care |");
    lines.push("| TEA AEIS (TX schools) | district enrollment, demographics | https://tea.texas.gov |");
    lines.push("| SAM.gov / Grants.gov | federal funding opportunities | https://sam.gov · https://grants.gov |");
    lines.push("");
    lines.push("> _The Chainweb runner on this page chains the first four for any county and writes evidence rows you can audit. No AI in that chain._");
    lines.push("");
  }

  // §4 Stakeholder ecosystem. The data-only door cannot name local stakeholders
  // without inventing them, so it is HONEST about that gap. TCAF platforms are
  // NOT stakeholders for the audience — they live under §6 when invited.
  if (scopeIncludes(scope, 4, flags)) {
    lines.push("## 4. Stakeholder ecosystem (named, by ZIP)");
    lines.push("> _This data-only door does NOT auto-name local stakeholders. Naming the county judge, commissioners court, ISD superintendents, LMHA/MHMR director, FQHC CMOs, hospital district CEO, workforce-board director, DA, sheriff, faith-network anchors, and philanthropy program officers requires verified primary sources for each county. Run the AI briefing on the same locations + topic to get the named map with [verify] tags, or open the county official websites to fill the table below by hand._");
    lines.push("");
    lines.push("| ZIP / County | Role | Who currently holds it | What they control | What they care about |");
    lines.push("|---|---|---|---|---|");
    for (const c of contexts) {
      const where = c.location.zip ? `ZIP ${c.location.zip}` : c.location.region;
      lines.push(`| ${where} | County Judge | _verify_ | Commissioners Court agenda · county budget · HHS appointments | growth · property tax · workforce |`);
      lines.push(`| ${where} | ISD Superintendent(s) | _verify_ | Pre-K enrollment · ECI referrals · bond authority | enrollment growth · teacher recruitment |`);
      lines.push(`| ${where} | LMHA / MHMR Director | _verify_ | crisis response · behavioral-health screening · family-support referrals | unmet psychiatric need · crisis stabilization |`);
      lines.push(`| ${where} | FQHC CMO(s) | _verify_ | primary care access · sliding-scale fees · behavioral integration | uninsured load · panel size · workforce |`);
      lines.push(`| ${where} | Philanthropy program officers | _verify_ | grant priorities · convening power · co-funding | measurable community outcomes |`);
    }
    lines.push("");
  }

  // §5 Funding — list grants honestly (already deadline-filtered server-side)
  if (scopeIncludes(scope, 5, flags)) {
    lines.push("## 5. Funding picture (open grants only)");
    const allGrants = contexts.flatMap((c) => c.grants.map((g) => ({ ...g, locationLabel: c.location.label })));
    if (!allGrants.length) {
      lines.push("- No open grants matched this topic + region in the database.");
      lines.push("- Try a broader topic phrase, or run the grant discovery scan from the Grant Command Center.");
    } else {
      lines.push("| # | Title | Agency | Funding | Deadline | Fit | Location | Link |");
      lines.push("|---|---|---|---|---|---|---|---|");
      allGrants.slice(0, 30).forEach((g, i) => {
        const link = g.source_url ? `[open](${g.source_url})` : "n/a";
        lines.push(`| ${i + 1} | ${g.title.replace(/\|/g, "\\|")} | ${g.agency ?? "n/a"} | ${g.funding_amount ?? "n/a"} | ${g.deadline ?? "rolling"} | ${g.fit_score ?? "n/a"} | ${g.locationLabel} | ${link} |`);
      });
    }
    lines.push("");
  }

  // §6 TCAF fit — ONLY when explicitly invited. The audience leads; TCAF
  // contributes only if asked. We don't lead with what we sell.
  if (scopeIncludes(scope, 6, flags)) {
    const who = audience ? audience : "the audience";
    lines.push(`## 6. TCAF as a possible contributor for ${who}`);
    lines.push("> _You did not need a pitch — you asked where TCAF could plug in. Here is the honest answer. The lead is yours; we contribute only where you say it helps. Anything you can already do through your existing partners, you should — that's the dignity-clause default._");
    lines.push("");
    const platforms = contexts[0]?.platforms ?? [];
    if (!platforms.length) {
      lines.push("- _No public-facing TCAF platforms loaded._");
    } else {
      lines.push("| Platform | What it does | When you'd call us | When you'd skip us |");
      lines.push("|---|---|---|---|");
      for (const p of platforms) {
        const desc = (p.description ?? "—").replace(/\|/g, "\\|");
        lines.push(`| **${p.name}** | ${desc} | _you tell us_ | _if your existing partner already covers it_ |`);
      }
    }
    lines.push("");
    lines.push("_If any of these are useful, here's who to talk to: Dr. Terry Flood, President — terryflood@thrivingcommunitiesforall.com. If none are, no offense taken — the work belongs to the community._");
    lines.push("");
  }

  // §7 Implementation plan — existing RPLICE action plans by county
  if (scopeIncludes(scope, 7, flags)) {
    lines.push("## 7. Implementation plan (RPLICE action plans on file)");
    let anyPlan = false;
    for (const c of contexts) {
      const r = c.location.countyFips ? rpliceByCounty.get(c.location.countyFips) : undefined;
      if (!r?.plans.length) continue;
      anyPlan = true;
      lines.push(`### ${c.location.label}`);
      for (const p of r.plans) {
        lines.push(`- **Plan #${p.id} — ${p.regionName}** (status: ${p.status})`);
        const phases = Array.isArray(p.phases) ? (p.phases as Array<Record<string, unknown>>) : [];
        if (phases.length) {
          for (const ph of phases.slice(0, 6)) {
            const name = String(ph?.name ?? ph?.title ?? "phase");
            const owner = ph?.owner ? ` · owner: ${ph.owner}` : "";
            const window = ph?.window ?? ph?.timeline ?? "";
            lines.push(`  - ${name}${window ? ` (${window})` : ""}${owner}`);
          }
        }
      }
    }
    if (!anyPlan) {
      lines.push("- No RPLICE action plans on file for these counties.");
      lines.push("- Create one: open `/rplice-tools` or save an AI-generated plan from a follow-up answer.");
    }
    lines.push("");
  }

  // §8 Outcomes — outcome baselines by county
  if (scopeIncludes(scope, 8, flags)) {
    lines.push("## 8. Measurable outcomes (outcome baselines on file)");
    let anyBase = false;
    for (const c of contexts) {
      const r = c.location.countyFips ? rpliceByCounty.get(c.location.countyFips) : undefined;
      if (!r?.baselines.length) continue;
      anyBase = true;
      lines.push(`### ${c.location.label}`);
      for (const b of r.baselines) {
        const mCount = b.metrics && typeof b.metrics === "object" ? Object.keys(b.metrics as Record<string, unknown>).length : 0;
        const tCount = b.targets && typeof b.targets === "object" ? Object.keys(b.targets as Record<string, unknown>).length : 0;
        lines.push(`- **Baseline #${b.id} — ${b.regionName}** · ${b.timelineMonths ?? 12} months · status: ${b.status} · ${mCount} metric${mCount === 1 ? "" : "s"}, ${tCount} target${tCount === 1 ? "" : "s"}`);
      }
    }
    if (!anyBase) {
      lines.push("- No outcome baselines on file for these counties.");
      lines.push("- Create one: open `/rplice-tools` and define metrics + 12-month targets per ZIP.");
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("_This briefing was assembled in code from your database — no AI was called. If you want narrative depth (data story woven through CFIR/RE-AIM/R&R lens, named stakeholders, audience-framed implications), run the AI briefing on the same locations + topic. Both doors lead to the same data._");

  return lines.join("\n");
}

// ── Slug helper for saved workflows ──────────────────────────────────────────
function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "workflow";
  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

// ── Routes ───────────────────────────────────────────────────────────────────
export function registerRegionalBriefingRoutes(app: Express): void {
  // Cheap preview (used by context-tab / debug)
  app.get(
    "/api/regional-briefing/context",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-context", max: 30, windowMs: 5 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const region = clean(req.query.region, 200);
        const topic = clean(req.query.topic, 200);
        if (!region || !topic) return res.status(400).json({ error: "region and topic are required" });
        const ctx = await loadLocationContext({ label: region, region }, topic);
        res.json({
          region,
          topic,
          grant_count: ctx.grants.length,
          platform_count: ctx.platforms.length,
          grants: ctx.grants,
          platforms: ctx.platforms,
        });
      } catch (err) {
        console.error("[regional-briefing] context failed:", err);
        res.status(500).json({ error: "Failed to load context" });
      }
    },
  );

  // AI extraction only — let the UI show parsed {locations, topic} before paying for the full stream
  app.post(
    "/api/regional-briefing/extract",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-extract", max: 20, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const question = clean(req.body?.question, MAX_LEN);
        if (!question) return res.status(400).json({ error: "question is required" });
        const out = await extractLocationsAndTopic(question);
        res.json(out);
      } catch (err) {
        console.error("[regional-briefing] extract failed:", err);
        res.status(500).json({ error: "Extraction failed" });
      }
    },
  );

  // Resolve {question OR explicit locations[] + topic} -> normalized {locations[], topic, question}
  async function resolveAsk(body: Record<string, unknown>): Promise<{ locations: BriefingLocation[]; topic: string; question: string } | { error: string }> {
    const question = clean(body?.question, MAX_LEN);
    const rawLocs = Array.isArray(body?.locations) ? (body!.locations as unknown[]) : null;
    let topic = clean(body?.topic, 200);

    if (rawLocs && rawLocs.length) {
      const locations: BriefingLocation[] = rawLocs.slice(0, MAX_LOCATIONS).map((raw) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        const region = clean(r.region, 200) || clean(r.label, 200) || "United States";
        const zip = /^\d{5}$/.test(String(r.zip ?? "").trim()) ? String(r.zip).trim() : undefined;
        const countyFips = /^\d{5}$/.test(String(r.countyFips ?? "").trim()) ? String(r.countyFips).trim() : undefined;
        const label = clean(r.label, 200) || (zip ? `${region} ${zip}` : region);
        return { label, region, zip, countyFips };
      });
      if (!topic) topic = "community well-being";
      return { locations, topic, question };
    }

    if (!question) return { error: "Ask a question, or pass explicit locations + topic." };
    const extracted = await extractLocationsAndTopic(question);
    return { locations: extracted.locations, topic: topic || extracted.topic, question };
  }

  app.post(
    "/api/regional-briefing/query",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-query", max: 6, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const resolved = await resolveAsk(req.body ?? {});
        if ("error" in resolved) return res.status(400).json({ error: resolved.error });
        const { locations, topic, question } = resolved;
        const [contexts, rpliceBlock] = await Promise.all([
          Promise.all(locations.map((l) => loadLocationContext(l, topic))),
          loadRpliceContextBlock(extractCountyFips(locations)),
        ]);
        const answer = await generateAIResponse(
          [
            {
              role: "system",
              content: wrapWithRpliceLayer(buildSystemPrompt(locations.length > 1), rpliceBlock),
            },
            { role: "user", content: buildUserPrompt(contexts, topic, question) },
          ],
          16000,
        );
        res.json({
          locations,
          topic,
          question: question || null,
          per_location: contexts.map((c) => ({
            location: c.location,
            grant_count: c.grants.length,
            grants: c.grants,
          })),
          platforms: contexts[0]?.platforms ?? [],
          briefing: answer,
        });
      } catch (err) {
        console.error("[regional-briefing] query failed:", err);
        res.status(500).json({ error: "Failed to generate briefing" });
      }
    },
  );

  app.post(
    "/api/regional-briefing/stream",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-stream", max: 6, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const resolved = await resolveAsk(req.body ?? {});
        if ("error" in resolved) return res.status(400).json({ error: resolved.error });
        const { locations, topic, question } = resolved;
        const [contexts, rpliceBlock] = await Promise.all([
          Promise.all(locations.map((l) => loadLocationContext(l, topic))),
          loadRpliceContextBlock(extractCountyFips(locations)),
        ]);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let clientDisconnected = false;
        req.on("close", () => {
          clientDisconnected = true;
        });

        res.write(
          `data: ${JSON.stringify({
            context: {
              locations,
              topic,
              platforms: contexts[0]?.platforms ?? [],
              per_location: contexts.map((c) => ({
                location: c.location,
                grant_count: c.grants.length,
                grants: c.grants,
              })),
            },
          })}\n\n`,
        );

        await streamAIResponse({
          messages: [
            {
              role: "system",
              content: wrapWithRpliceLayer(buildSystemPrompt(locations.length > 1), rpliceBlock),
            },
            { role: "user", content: buildUserPrompt(contexts, topic, question) },
          ],
          maxTokens: 16000,
          onChunk: (content: string) => {
            if (!clientDisconnected) res.write(`data: ${JSON.stringify({ content })}\n\n`);
          },
          onDone: () => {
            if (!clientDisconnected) res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          },
          onError: (error: Error) => {
            if (!clientDisconnected) res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
          },
        });
      } catch (err) {
        console.error("[regional-briefing] stream failed:", err);
        if (!res.headersSent) res.status(500).json({ error: "Failed to stream briefing" });
      }
    },
  );

  // ── Follow-up question against the just-produced briefing ─────────────────
  // Now ALSO pulls RPLICE assessments + action plans + outcome baselines tied
  // to the briefing's counties, so the AI sees the implementation-science
  // scaffolding (CFIR / RE-AIM / fidelity / prior plans) — not just grants.
  app.post(
    "/api/regional-briefing/followup",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-followup", max: 20, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const question = clean(req.body?.question, MAX_LEN);
        const priorBriefing = clean(req.body?.priorBriefing, 20000);
        if (!question) return res.status(400).json({ error: "question is required" });
        if (!priorBriefing) return res.status(400).json({ error: "priorBriefing is required" });

        // Optional locations: used to scope RPLICE context to relevant counties
        const inputLocations: BriefingLocation[] = Array.isArray(req.body?.locations)
          ? (req.body.locations as BriefingLocation[]).slice(0, MAX_LOCATIONS)
          : [];
        const countyFipsList = extractCountyFips(inputLocations);
        const regionNames = inputLocations
          .map((l) => l?.region || l?.label)
          .filter((r): r is string => typeof r === "string" && r.length > 0);

        const rpliceContextBlock = await loadRpliceContextBlock(countyFipsList);

        const sys = [
          "You are TCAF's Regional Briefing AI in FOLLOW-UP mode. The user already received a full briefing (below). They now have ONE specific question about it.",
          "",
          "RULES:",
          "- Answer ONLY the user's specific question. Do not re-summarize the whole briefing.",
          "- Ground your answer in the prior briefing first. If they ask about something the briefing covered, quote or reference that section.",
          "- If the question is about implementation, sequencing, fidelity, or measurement, USE the RPLICE context below — CFIR for determinants, RE-AIM for outcomes (Reach / Effectiveness / Adoption / Implementation / Maintenance), fidelity checklists for delivery quality, and named existing action plans so we build on them rather than duplicating.",
          "- If the question goes beyond what the briefing or RPLICE context covered, say plainly what you'd need to look up next (Census ACS, CDC PLACES, state portal, etc.) and mark unverified claims '[needs primary-source pull]'.",
          "- Never invent stakeholder names, dollar amounts, deadlines, or stats. If unsure, say so.",
          "- Plain language. Short. The user is a smart, busy practitioner mid-conversation.",
          "- 'President' not 'CEO' for Dr. Flood. If City of Austin is involved, remember Meredith Sisnett (City employee) COI flag.",
        ].join("\n");

        const user = [
          "=== PRIOR BRIEFING (what you produced earlier) ===",
          priorBriefing,
          "",
          "=== RPLICE CONTEXT (implementation-science scaffolding for these counties) ===",
          rpliceContextBlock,
          regionNames.length > 0 ? `\nRegions in scope: ${regionNames.join(", ")}` : "",
          "",
          "=== USER'S FOLLOW-UP QUESTION ===",
          question,
        ].join("\n");

        const answer = await generateAIResponse(
          [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          6000,
        );
        res.json({ answer, rpliceWired: true });
      } catch (err) {
        console.error("[regional-briefing] followup failed:", err);
        res.status(500).json({ error: "Follow-up failed" });
      }
    },
  );

  // ── Save a follow-up answer as a tracked RPLICE action plan ───────────────
  app.post(
    "/api/regional-briefing/save-action-plan",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-save-plan", max: 30, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const planText = clean(req.body?.planText, 20000);
        const sourceQuestion = clean(req.body?.sourceQuestion, MAX_LEN);
        const topic = clean(req.body?.topic, 200);
        const locations: BriefingLocation[] = Array.isArray(req.body?.locations)
          ? (req.body.locations as BriefingLocation[]).slice(0, MAX_LOCATIONS)
          : [];
        if (!planText) return res.status(400).json({ error: "planText is required" });
        if (locations.length === 0) {
          return res.status(400).json({ error: "At least one location with regionName + countyFips is required" });
        }

        const primary = locations.find((l) => l?.countyFips && /^\d{5}$/.test(l.countyFips)) || locations[0];
        const countyFips = primary?.countyFips && /^\d{5}$/.test(primary.countyFips) ? primary.countyFips : "00000";
        const stateFips = countyFips.slice(0, 2);
        const regionName = primary?.region || primary?.label || "Unspecified region";

        const [row] = await db
          .insert(rpliceActionPlans)
          .values({
            regionName,
            stateFips,
            countyFips,
            analysisData: {
              source: "regional-briefing-followup",
              sourceQuestion,
              topic,
              locations,
              createdBy: getUserId(req),
            },
            phases: { planText, generatedAt: new Date().toISOString() },
            status: "draft",
          })
          .returning({ id: rpliceActionPlans.id });

        res.json({
          id: row.id,
          regionName,
          countyFips,
          viewUrl: "/rplice-tools",
          message: `Saved as RPLICE action plan #${row.id} for ${regionName} (FIPS ${countyFips}). Open /rplice-tools to manage phases, fidelity checks, and RE-AIM scoring.`,
        });
      } catch (err) {
        console.error("[regional-briefing] save-action-plan failed:", err);
        res.status(500).json({ error: "Could not save action plan" });
      }
    },
  );

  // ── DOOR 2: structured / no-AI briefing ───────────────────────────────────
  // Assembles markdown from DB rows only. Used as a single-point-of-failure
  // backup when the AI provider is down, slow, or off-discipline, AND as the
  // "trusted backbone" view that funders and auditors can ask for explicitly.
  app.post(
    "/api/regional-briefing/structured",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-structured", max: 30, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        // SPOF discipline: door 2 must NEVER call the AI provider. Reject
        // question-only requests with a clear instruction to Parse first (which
        // populates explicit locations[] + topic via /extract, the only place
        // we tolerate AI in this flow). This guarantees /structured stays up
        // even when the AI stack is down.
        const rawLocs = Array.isArray(req.body?.locations) ? (req.body.locations as unknown[]) : null;
        if (!rawLocs || !rawLocs.length) {
          return res.status(400).json({
            error: "Structured (no-AI) briefing requires explicit locations[]. Click Parse to populate locations from your question, then try again. (This door never calls the AI.)",
          });
        }
        const resolved = await resolveAsk(req.body ?? {});
        if ("error" in resolved) return res.status(400).json({ error: resolved.error });
        const { locations, topic, question } = resolved;
        const scope = parseScope(req.body?.scope);
        const includeFunding = req.body?.includeFunding === true;
        const includeTcaf = req.body?.includeTcaf === true;
        const audience = typeof req.body?.audience === "string" && req.body.audience.trim() ? String(req.body.audience).trim() : null;
        const contexts = await Promise.all(locations.map((l) => loadLocationContext(l, topic)));
        const countyFipsList = extractCountyFips(locations);
        const rpliceByCounty = new Map<string, Awaited<ReturnType<typeof loadStructuredRpliceForCounty>>>();
        const [, networkAssessments] = await Promise.all([
          Promise.all(
            countyFipsList.map(async (f) => {
              rpliceByCounty.set(f, await loadStructuredRpliceForCounty(f));
            }),
          ),
          loadNetworkWideAssessments(),
        ]);
        const briefing = buildStructuredBriefing({ contexts, topic, scope, rpliceByCounty, networkAssessments, includeFunding, includeTcaf, audience });
        res.json({
          source: "structured",
          locations,
          topic,
          scope,
          includeFunding,
          includeTcaf,
          audience,
          question: question || null,
          per_location: contexts.map((c) => ({ location: c.location, grant_count: c.grants.length, grants: c.grants })),
          platforms: contexts[0]?.platforms ?? [],
          briefing,
        });
      } catch (err) {
        console.error("[regional-briefing] structured failed:", err);
        res.status(500).json({ error: "Failed to assemble structured briefing" });
      }
    },
  );

  // ── Saved workflows CRUD ──────────────────────────────────────────────────
  app.get(
    "/api/regional-briefing/workflows",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-list", max: 60, windowMs: 5 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const rows = await db
          .select()
          .from(briefingWorkflows)
          .where(eq(briefingWorkflows.createdBy, uid))
          .orderBy(sql`${briefingWorkflows.updatedAt} DESC`)
          .limit(100);
        res.json({ workflows: rows });
      } catch (err) {
        console.error("[regional-briefing] list workflows failed:", err);
        res.status(500).json({ error: "Failed to list workflows" });
      }
    },
  );

  app.post(
    "/api/regional-briefing/workflows",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-save", max: 30, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const name = clean(req.body?.name, 200);
        const question = clean(req.body?.question, MAX_LEN);
        const topic = clean(req.body?.topic, 200) || "community well-being";
        const rawLocs = Array.isArray(req.body?.locations) ? (req.body.locations as unknown[]) : [];
        if (!name || !question || !rawLocs.length) {
          return res.status(400).json({ error: "name, question, and locations are required" });
        }
        const locations: BriefingLocation[] = rawLocs.slice(0, MAX_LOCATIONS).map((raw) => {
          const r = (raw ?? {}) as Record<string, unknown>;
          const region = clean(r.region, 200) || clean(r.label, 200) || "United States";
          const zip = /^\d{5}$/.test(String(r.zip ?? "").trim()) ? String(r.zip).trim() : undefined;
          const countyFips = /^\d{5}$/.test(String(r.countyFips ?? "").trim()) ? String(r.countyFips).trim() : undefined;
          const label = clean(r.label, 200) || (zip ? `${region} ${zip}` : region);
          return { label, region, zip, countyFips };
        });
        const slug = makeSlug(name);
        const [row] = await db
          .insert(briefingWorkflows)
          .values({ slug, name, question, topic, locations, createdBy: uid })
          .returning();
        res.json({ workflow: row });
      } catch (err) {
        console.error("[regional-briefing] save workflow failed:", err);
        res.status(500).json({ error: "Failed to save workflow" });
      }
    },
  );

  app.get(
    "/api/regional-briefing/workflows/:slug",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-get", max: 120, windowMs: 5 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const slug = clean(req.params.slug, 96);
        const [row] = await db
          .select()
          .from(briefingWorkflows)
          .where(and(eq(briefingWorkflows.slug, slug), eq(briefingWorkflows.createdBy, uid)))
          .limit(1);
        if (!row) return res.status(404).json({ error: "Workflow not found" });
        res.json({ workflow: row });
      } catch (err) {
        console.error("[regional-briefing] get workflow failed:", err);
        res.status(500).json({ error: "Failed to load workflow" });
      }
    },
  );

  app.post(
    "/api/regional-briefing/workflows/:slug/cache",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-cache", max: 60, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const slug = clean(req.params.slug, 96);
        const briefing = clean(req.body?.briefing, 60_000);
        if (!briefing) return res.status(400).json({ error: "briefing required" });
        const [row] = await db
          .update(briefingWorkflows)
          .set({ lastBriefing: briefing, lastRunAt: new Date(), updatedAt: new Date() })
          .where(and(eq(briefingWorkflows.slug, slug), eq(briefingWorkflows.createdBy, uid)))
          .returning();
        if (!row) return res.status(404).json({ error: "Workflow not found" });
        res.json({ workflow: row });
      } catch (err) {
        console.error("[regional-briefing] cache workflow failed:", err);
        res.status(500).json({ error: "Failed to cache briefing" });
      }
    },
  );

  app.delete(
    "/api/regional-briefing/workflows/:slug",
    requireSignedIn,
    rateLimit({ keyPrefix: "rb-wf-del", max: 30, windowMs: 10 * 60_000 }),
    async (req: Request, res: Response) => {
      try {
        const uid = getUserId(req)!;
        const slug = clean(req.params.slug, 96);
        const deleted = await db
          .delete(briefingWorkflows)
          .where(and(eq(briefingWorkflows.slug, slug), eq(briefingWorkflows.createdBy, uid)))
          .returning({ id: briefingWorkflows.id });
        if (!deleted.length) return res.status(404).json({ error: "Workflow not found" });
        res.json({ ok: true });
      } catch (err) {
        console.error("[regional-briefing] delete workflow failed:", err);
        res.status(500).json({ error: "Failed to delete workflow" });
      }
    },
  );
}
