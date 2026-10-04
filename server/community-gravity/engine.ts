/**
 * Community Gravity ("Magnet") engine.
 *
 * Source → Entity → Story → (Named person: staff gate) → Delivery → Outcome.
 *  - Source: IRS Exempt Organizations Business Master File, per-state CSV (public domain).
 *  - Entity: one row per EIN with city/state/NTEE/revenue and the source URL + fetched_at.
 *  - Story: cited web research turned into SPOC quads (subject, predicate, object, context=citation).
 *  - Human gate: staff verify an org as a community magnet; open data only *proposes*.
 * Evidence states are explicit: revenue may be null (not zero); "nearby" is same-state, same-domain
 * and is labeled as such; nothing is modeled as an observation.
 */
import { sql } from "drizzle-orm";
import { db } from "../storage";
import { generateAIJSON, isPerplexityAvailable, perplexityResearch } from "../ai-provider";

export const BMF_URL = (state: string) => `https://www.irs.gov/pub/irs-soi/eo_${state.toLowerCase()}.csv`;

/** NTEE major group → plain-language domain. Method is disclosed to the client verbatim. */
export const DOMAIN_METHOD = "Domain is derived from the first letter of the IRS NTEE code (NTEE major group). Organizations without an NTEE code are grouped as 'unclassified'.";
const NTEE_DOMAIN: Record<string, string> = {
  A: "arts-culture", B: "education", C: "environment", D: "animals", E: "health", F: "mental-health",
  G: "disease-disorders", H: "medical-research", I: "crime-legal-reentry", J: "employment-workforce",
  K: "food-agriculture", L: "housing-shelter", M: "public-safety-disaster", N: "recreation-sports",
  O: "youth-development", P: "human-services", Q: "international", R: "civil-rights-advocacy",
  S: "community-improvement", T: "philanthropy-grantmaking", U: "science-technology", V: "social-science",
  W: "public-benefit", X: "religion", Y: "mutual-benefit", Z: "unknown",
};
export const DOMAIN_LABELS: Record<string, string> = {
  "arts-culture": "Arts & culture", education: "Education", environment: "Environment", animals: "Animals", health: "Health",
  "mental-health": "Mental health & crisis", "disease-disorders": "Disease & disorders", "medical-research": "Medical research",
  "crime-legal-reentry": "Crime, legal & reentry", "employment-workforce": "Employment & workforce", "food-agriculture": "Food & agriculture",
  "housing-shelter": "Housing & shelter", "public-safety-disaster": "Public safety & disaster", "recreation-sports": "Recreation & sports",
  "youth-development": "Youth development", "human-services": "Human services", international: "International", "civil-rights-advocacy": "Civil rights & advocacy",
  "community-improvement": "Community improvement & capacity", "philanthropy-grantmaking": "Philanthropy & grantmaking", "science-technology": "Science & technology",
  "social-science": "Social science", "public-benefit": "Public & societal benefit", religion: "Religion", "mutual-benefit": "Mutual benefit", unknown: "Unknown", unclassified: "Unclassified",
};
export function domainFor(ntee: string | null | undefined): string {
  const k = (ntee ?? "").trim().charAt(0).toUpperCase();
  return NTEE_DOMAIN[k] ?? "unclassified";
}

// ── Source → Entity ─────────────────────────────────────────────────────────
function parseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out;
}

export interface IngestResult { state: string; city: string | null; fetchedRows: number; upserted: number; sourceUrl: string; }

/** Ingest one state's BMF; optionally restrict to one city (IRS CITY is upper-case). Idempotent upsert. */
export async function ingestState(state: string, city?: string): Promise<IngestResult> {
  const st = state.toUpperCase(); if (!/^[A-Z]{2}$/.test(st)) throw new Error("state must be a 2-letter code");
  const url = BMF_URL(st);
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { "user-agent": "ThriveUp community-gravity ingest" } });
  if (!r.ok) throw new Error(`IRS BMF ${st} returned ${r.status}`);
  const text = await r.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]); const col = (n: string) => header.indexOf(n);
  const iEin = col("EIN"), iName = col("NAME"), iCity = col("CITY"), iState = col("STATE"), iZip = col("ZIP"), iSub = col("SUBSECTION"),
    iTax = col("TAX_PERIOD"), iAsset = col("ASSET_AMT"), iRev = col("REVENUE_AMT"), iNtee = col("NTEE_CD");
  const want = city?.toUpperCase().trim();
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]); if (f.length < header.length) continue;
    if (want && f[iCity].toUpperCase() !== want) continue;
    rows.push(f);
  }
  let upserted = 0;
  const num = (v: string) => (v === "" || v == null ? null : Number(v));
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const values = chunk.map(f => sql`(${f[iEin]}, ${f[iName].trim()}, ${f[iCity].toUpperCase().trim()}, ${f[iState]}, ${f[iZip]?.slice(0, 10) || null}, ${f[iNtee] || null}, ${domainFor(f[iNtee])}, ${f[iSub] || null}, ${num(f[iRev])}, ${num(f[iAsset])}, ${f[iTax] || null}, ${url}, now())`);
    await db.execute(sql`
      INSERT INTO community_gravity_orgs (ein, name, city, state, zip, ntee_code, domain, subsection, revenue_amt, asset_amt, tax_period, source_url, fetched_at)
      VALUES ${sql.join(values, sql`, `)}
      ON CONFLICT (ein) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city, state = EXCLUDED.state, zip = EXCLUDED.zip,
        ntee_code = EXCLUDED.ntee_code, domain = EXCLUDED.domain, subsection = EXCLUDED.subsection, revenue_amt = EXCLUDED.revenue_amt,
        asset_amt = EXCLUDED.asset_amt, tax_period = EXCLUDED.tax_period, source_url = EXCLUDED.source_url, fetched_at = now()`);
    upserted += chunk.length;
  }
  return { state: st, city: want ?? null, fetchedRows: lines.length - 1, upserted, sourceUrl: url };
}

// ── Gravity: clusters, magnets, connections ─────────────────────────────────
export interface GravityOrg { ein: string; name: string; city: string; state: string; zip: string | null; nteeCode: string | null; domain: string; revenueAmt: number | null; taxPeriod: string | null; verified: boolean; verifiedNote: string | null; profileUrl: string; }
export interface DomainCluster { domain: string; label: string; count: number; magnets: GravityOrg[]; nearbyCount: number; nearbyCities: { city: string; count: number }[]; }
export interface GravityField {
  community: { city: string; state: string }; builtFrom: { source: string; sourceUrl: string; fetchedAt: string | null; orgCount: number } | null;
  method: { domain: string; magnet: string; nearby: string; evidence: string };
  clusters: DomainCluster[];
}
export const MAGNET_METHOD = "Magnets are the organizations in a domain with the largest most-recent IRS-reported revenue, plus any organization staff have verified. Revenue size is a proxy for capacity, not for quality or impact; organizations with no reported revenue are shown as 'not reported', never as $0.";
export const NEARBY_METHOD = "Nearby means other cities in the same state with organizations in the same domain. It is a statewide neighbor count, not a distance calculation.";
export const EVIDENCE_NOTE = "Inclusion is drawn from public IRS records and is not an endorsement. Organizations may be inactive, renamed, or misclassified; staff verification and cited research are shown where they exist.";

function toOrg(r: Record<string, unknown>): GravityOrg {
  return { ein: String(r.ein), name: String(r.name), city: String(r.city), state: String(r.state), zip: (r.zip as string) ?? null, nteeCode: (r.ntee_code as string) ?? null, domain: String(r.domain),
    revenueAmt: r.revenue_amt == null ? null : Number(r.revenue_amt), taxPeriod: (r.tax_period as string) ?? null, verified: Boolean(r.verified_at), verifiedNote: (r.verified_note as string) ?? null,
    profileUrl: `https://projects.propublica.org/nonprofits/organizations/${String(r.ein)}` };
}

export async function buildGravityField(city: string, state: string, magnetsPerDomain = 5): Promise<GravityField> {
  const c = city.toUpperCase().trim(), s = state.toUpperCase().trim();
  const meta = await db.execute(sql`SELECT count(*)::int AS n, max(fetched_at) AS fetched_at, max(source_url) AS source_url FROM community_gravity_orgs WHERE city = ${c} AND state = ${s}`);
  const m = meta.rows[0] as { n: number; fetched_at: Date | null; source_url: string | null };
  const method = { domain: DOMAIN_METHOD, magnet: MAGNET_METHOD, nearby: NEARBY_METHOD, evidence: EVIDENCE_NOTE };
  if (!m || m.n === 0) return { community: { city: c, state: s }, builtFrom: null, method, clusters: [] };
  const counts = await db.execute(sql`SELECT domain, count(*)::int AS n FROM community_gravity_orgs WHERE city = ${c} AND state = ${s} GROUP BY domain ORDER BY n DESC`);
  const magnets = await db.execute(sql`
    SELECT * FROM (
      SELECT o.*, row_number() OVER (PARTITION BY domain ORDER BY (verified_at IS NOT NULL) DESC, revenue_amt DESC NULLS LAST, name) AS rn
      FROM community_gravity_orgs o WHERE city = ${c} AND state = ${s}
    ) t WHERE rn <= ${magnetsPerDomain}`);
  const nearby = await db.execute(sql`SELECT domain, city, count(*)::int AS n FROM community_gravity_orgs WHERE state = ${s} AND city <> ${c} GROUP BY domain, city`);
  const byDomain = new Map<string, DomainCluster>();
  for (const row of counts.rows as { domain: string; n: number }[]) byDomain.set(row.domain, { domain: row.domain, label: DOMAIN_LABELS[row.domain] ?? row.domain, count: row.n, magnets: [], nearbyCount: 0, nearbyCities: [] });
  for (const row of magnets.rows as Record<string, unknown>[]) byDomain.get(String(row.domain))?.magnets.push(toOrg(row));
  for (const row of nearby.rows as { domain: string; city: string; n: number }[]) { const d = byDomain.get(row.domain); if (!d) continue; d.nearbyCount += row.n; d.nearbyCities.push({ city: row.city, count: row.n }); }
  for (const d of byDomain.values()) d.nearbyCities = d.nearbyCities.sort((a, b) => b.count - a.count).slice(0, 8);
  return { community: { city: c, state: s }, builtFrom: { source: "IRS Exempt Organizations Business Master File", sourceUrl: m.source_url ?? BMF_URL(s), fetchedAt: m.fetched_at ? new Date(m.fetched_at).toISOString() : null, orgCount: m.n }, method, clusters: [...byDomain.values()] };
}

export async function searchOrgs(city: string, state: string, q: string, domain?: string, limit = 40): Promise<GravityOrg[]> {
  const like = `%${q.trim().toUpperCase()}%`;
  const r = await db.execute(sql`SELECT * FROM community_gravity_orgs WHERE city = ${city.toUpperCase()} AND state = ${state.toUpperCase()}
    AND (${q.trim() === ""} OR upper(name) LIKE ${like}) AND (${!domain} OR domain = ${domain ?? ""})
    ORDER BY (verified_at IS NOT NULL) DESC, revenue_amt DESC NULLS LAST, name LIMIT ${Math.min(limit, 100)}`);
  return (r.rows as Record<string, unknown>[]).map(toOrg);
}

// ── Story: cited research → SPOC quads ──────────────────────────────────────
export interface Quad { subject: string; predicate: string; object: string; context: string; method: string; createdAt: string; }
const ALLOWED_PREDICATES = ["does", "serves", "website", "located_in", "partners_with", "program", "contact_public"] as const;

export async function getFacts(ein: string): Promise<Quad[]> {
  const r = await db.execute(sql`SELECT subject_ein, predicate, object, context, method, created_at FROM community_gravity_facts WHERE subject_ein = ${ein} ORDER BY id`);
  return (r.rows as Record<string, unknown>[]).map(x => ({ subject: String(x.subject_ein), predicate: String(x.predicate), object: String(x.object), context: String(x.context), method: String(x.method), createdAt: new Date(x.created_at as Date).toISOString() }));
}

/**
 * Research one organization on the open web and store only facts that carry a citation.
 * Deviation from the local-Ollama recipe: this environment has no local LLM, so the platform's
 * governed provider (ethical preamble, budgets) extracts quads from the cited research text.
 * Facts without a citation URL are discarded; nothing is invented.
 */
export async function researchOrg(ein: string): Promise<{ added: number; skipped: number; reason?: string }> {
  const existing = await getFacts(ein);
  if (existing.some(f => f.method === "web_research_llm")) return { added: 0, skipped: existing.length, reason: "already researched" };
  if (!isPerplexityAvailable()) return { added: 0, skipped: 0, reason: "web research provider unavailable" };
  const r = await db.execute(sql`SELECT name, city, state FROM community_gravity_orgs WHERE ein = ${ein}`);
  const org = r.rows[0] as { name: string; city: string; state: string } | undefined;
  if (!org) return { added: 0, skipped: 0, reason: "unknown ein" };
  const { text, citations } = await perplexityResearch(
    `What does the nonprofit "${org.name}" (EIN ${ein}, ${org.city}, ${org.state}) do? Report only verifiable facts: mission/services, populations served, programs, official website, public contact page, and named partner organizations. Say "unknown" when a fact is not found.`,
    "You are a research assistant for a community platform. Report only facts supported by the sources you cite. Never guess.", 900);
  if (!citations.length) return { added: 0, skipped: 0, reason: "no citations returned" };
  type Extracted = { facts: { predicate: string; object: string; citation: string }[] };
  const extracted = await generateAIJSON<Extracted>(
    `Extract facts about "${org.name}" from the research text as JSON {"facts":[{"predicate":..., "object":..., "citation":...}]}.
Allowed predicates: ${ALLOWED_PREDICATES.join(", ")}. "citation" must be one of these URLs exactly: ${citations.join(" | ")}.
Omit anything the text marks unknown or that has no supporting citation. Max 12 facts.

RESEARCH TEXT:
${text}`,
    "Return strict JSON only. Do not invent facts or URLs.");
  const facts = (extracted?.facts ?? []).filter(f => ALLOWED_PREDICATES.includes(f.predicate as typeof ALLOWED_PREDICATES[number]) && citations.includes(f.citation) && f.object && f.object.length <= 500);
  for (const f of facts) await db.execute(sql`INSERT INTO community_gravity_facts (subject_ein, predicate, object, context, method) VALUES (${ein}, ${f.predicate}, ${f.object.trim()}, ${f.citation}, 'web_research_llm')`);
  return { added: facts.length, skipped: (extracted?.facts?.length ?? 0) - facts.length };
}

// ── Human gate ──────────────────────────────────────────────────────────────
export async function setVerified(ein: string, userId: string, verified: boolean, note?: string): Promise<boolean> {
  const r = await db.execute(verified
    ? sql`UPDATE community_gravity_orgs SET verified_by = ${userId}, verified_at = now(), verified_note = ${note ?? null} WHERE ein = ${ein}`
    : sql`UPDATE community_gravity_orgs SET verified_by = NULL, verified_at = NULL, verified_note = NULL WHERE ein = ${ein}`);
  return (r.rowCount ?? 0) > 0;
}
