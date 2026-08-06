import { db } from "../storage";
import { grantOpportunities } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AggregatorOpportunity {
  source: "aggregator-bidnet" | "aggregator-rfpmart" | "aggregator-esbd-tx";
  externalId: string;
  title: string;
  url: string;
  agency?: string;
  deadlineText?: string;
  postedText?: string;
  raw?: string;
}

const HTML_TAG = /<[^>]+>/g;
const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const cleanText = (s: string) => decodeEntities(s.replace(HTML_TAG, "")).replace(/\s+/g, " ").trim();

async function loginBidNet(): Promise<string | null> {
  const u = process.env.BIDNET_USERNAME;
  const p = process.env.BIDNET_PASSWORD;
  if (!u || !p) return null;
  const loginUrl = "https://www.bidnetdirect.com/public/authentication/loginstandard";
  const resp = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "TCAF-Grant-Discovery/1.0" },
    body: new URLSearchParams({ j_username: u, j_password: p }),
    redirect: "manual",
  });
  const setCookie = resp.headers.get("set-cookie") || "";
  const session = setCookie.split(",").map(c => c.split(";")[0].trim()).filter(c => c.startsWith("JSESSIONID")).join("; ");
  return session || null;
}

export async function fetchBidNetSavedSearch(): Promise<AggregatorOpportunity[]> {
  const url = process.env.BIDNET_SAVED_SEARCH_URL;
  if (!url) throw new Error("BIDNET_SAVED_SEARCH_URL not set");
  const session = await loginBidNet();
  if (!session) throw new Error("BidNet login failed — check BIDNET_USERNAME/BIDNET_PASSWORD");

  const resp = await fetch(url, { headers: { Cookie: session, "User-Agent": "TCAF-Grant-Discovery/1.0" } });
  if (!resp.ok) throw new Error(`BidNet saved-search fetch returned ${resp.status}`);
  const html = await resp.text();

  // FRAGILE: BidNet does not expose a public API. We regex-parse the HTML result list.
  // The result-row pattern below targets the standard SearchSummaryView. If BidNet
  // changes markup, this will silently return [] — caller should alert if 0 results
  // for a known-non-empty saved search.
  const opps: AggregatorOpportunity[] = [];
  const rowPattern = /<a[^>]+href="(\/private\/supplier\/solicitations\/[^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,400}?(?:Closing|Due|Response)[^<]*?(\d{1,2}\/\d{1,2}\/\d{2,4})?/gi;
  let m: RegExpExecArray | null;
  while ((m = rowPattern.exec(html)) !== null) {
    const path = m[1];
    const title = cleanText(m[2]);
    const deadlineText = m[3] || undefined;
    if (!title || title.length < 5) continue;
    const fullUrl = path.startsWith("http") ? path : `https://www.bidnetdirect.com${path}`;
    const externalId = path.split("/").filter(Boolean).slice(-1)[0] || fullUrl;
    opps.push({ source: "aggregator-bidnet", externalId, title, url: fullUrl, deadlineText });
  }
  return opps;
}

export async function fetchRfpMartFeed(): Promise<AggregatorOpportunity[]> {
  const u = process.env.RFPMART_USERNAME;
  const p = process.env.RFPMART_PASSWORD;
  if (!u || !p) throw new Error("RFPMART_USERNAME / RFPMART_PASSWORD not set");

  // RFP Mart exposes a member-only listing page. We use Basic Auth on the printable
  // listing endpoint which preserves a stable, parseable HTML format. If that endpoint
  // moves, this fetch will return non-200 and we'll surface the error.
  const url = "https://www.rfpmart.com/sf-2-states-Texas.html";
  const auth = "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
  const resp = await fetch(url, { headers: { Authorization: auth, "User-Agent": "TCAF-Grant-Discovery/1.0" } });
  if (!resp.ok) throw new Error(`RFP Mart fetch returned ${resp.status}`);
  const html = await resp.text();

  const opps: AggregatorOpportunity[] = [];
  const rowPattern = /<a[^>]+href="(\/[^"]*?(?:rfp|bid|tender)[^"]*?\.html)"[^>]*>([^<]+)<\/a>[\s\S]{0,300}?(\d{1,2}[\/-][A-Za-z0-9]{2,}[\/-]\d{2,4})?/gi;
  let m: RegExpExecArray | null;
  while ((m = rowPattern.exec(html)) !== null) {
    const path = m[1];
    const title = cleanText(m[2]);
    const deadlineText = m[3] || undefined;
    if (!title || title.length < 5) continue;
    const fullUrl = path.startsWith("http") ? path : `https://www.rfpmart.com${path}`;
    const externalId = path.split("/").pop()?.replace(".html", "") || fullUrl;
    opps.push({ source: "aggregator-rfpmart", externalId, title, url: fullUrl, deadlineText });
  }
  return opps;
}

// ── Texas ESBD (Electronic State Business Daily) ─────────────────────────────
// Free, no auth required. Fetches open solicitations from the Texas Comptroller
// procurement portal. Source: https://www.txsmartbuy.gov/esbd
export async function fetchTexasEsbd(): Promise<AggregatorOpportunity[]> {
  const BASE = "https://www.txsmartbuy.gov";
  // Hit the public solicitations search — open/posted status, all categories
  const url = `${BASE}/esbd?status=POSTED&pageNumber=1&pageSize=50`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "TCAF-Contractor-Discovery/1.0 (support@thrivingcommunitiesforall.com)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`TX ESBD returned HTTP ${resp.status}`);
  const html = await resp.text();

  const opps: AggregatorOpportunity[] = [];

  // Pattern 1: anchor links to individual solicitations (e.g. /esbd/NNNNNNNN)
  const solicPattern = /href="(\/esbd\/\d[^"]{2,60})"[^>]*>\s*([^<]{5,200})/gi;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = solicPattern.exec(html)) !== null) {
    const path = m[1].trim();
    const title = cleanText(m[2]);
    if (!title || title.length < 6) continue;
    const externalId = path.split("/").filter(Boolean).pop() || path;
    if (seen.has(externalId)) continue;
    seen.add(externalId);
    const fullUrl = `${BASE}${path}`;
    // Scan nearby HTML for a date pattern (MM/DD/YYYY)
    const context = html.slice(Math.max(0, m.index - 50), m.index + 300);
    const dateM = context.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    opps.push({
      source: "aggregator-esbd-tx",
      externalId,
      title,
      url: fullUrl,
      agency: "Texas State Agency (ESBD)",
      deadlineText: dateM?.[1],
    });
  }

  // Pattern 2: fallback — generic title/date row pattern for alternate markup
  if (opps.length === 0) {
    const rowPat = /<td[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]{5,200})<\/a>[\s\S]{0,400}?(\d{1,2}\/\d{1,2}\/\d{4})/gi;
    while ((m = rowPat.exec(html)) !== null) {
      const rawUrl = m[1];
      const title = cleanText(m[2]);
      if (!title || title.length < 6) continue;
      const fullUrl = rawUrl.startsWith("http") ? rawUrl : `${BASE}${rawUrl}`;
      const externalId = fullUrl.split("/").filter(Boolean).pop() || fullUrl;
      if (seen.has(externalId)) continue;
      seen.add(externalId);
      opps.push({ source: "aggregator-esbd-tx", externalId, title, url: fullUrl, agency: "Texas State Agency (ESBD)", deadlineText: m[3] });
    }
  }

  if (opps.length === 0) {
    console.warn("[GrantDiscovery] TX ESBD returned 0 parsed solicitations — HTML structure may have changed or no open solicitations at this time. URL:", url);
  } else {
    console.log(`[GrantDiscovery] TX ESBD parsed ${opps.length} open solicitations`);
  }
  return opps;
}

export interface AggregatorImportResult {
  source: string;
  fetched: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importAggregatorBatch(
  opps: AggregatorOpportunity[],
  computeFitScore: (g: { title?: string | null; description?: string | null; focusAreas?: string[] | null; eligibilityCriteria?: string | null }) => { score: number; analysis: unknown; matchedAreas: string[] },
  generateReadinessChecklist: (areas: string[]) => unknown,
): Promise<{ imported: number; skipped: number }> {
  let imported = 0, skipped = 0;
  for (const o of opps) {
    const noticeId = `AGG-${o.source}-${o.externalId}`.substring(0, 100);
    const existing = await db.select({ id: grantOpportunities.id }).from(grantOpportunities).where(eq(grantOpportunities.samgovNoticeId, noticeId)).limit(1);
    if (existing.length > 0) { skipped++; continue; }
    const grantData = {
      title: o.title,
      description: `Aggregator-sourced opportunity from ${o.source.replace("aggregator-", "")}. Manual review required to extract full description, funding amount, and eligibility — aggregator HTML does not expose structured fields. Click sourceUrl to read full solicitation in the portal.`,
      agency: o.agency || "(see source URL)",
      fundingAmount: "",
      sourceUrl: o.url,
      grantType: "rfp",
      focusAreas: [] as string[],
      eligibilityCriteria: "",
    };
    const fit = computeFitScore(grantData);
    await db.insert(grantOpportunities).values({
      ...grantData,
      samgovId: noticeId,
      samgovNoticeId: noticeId,
      fitScore: fit.score,
      fitAnalysis: fit.analysis as never,
      readinessChecklist: generateReadinessChecklist(fit.matchedAreas) as never,
      category: "rfp",
      source: o.source,
      deadline: null,
    });
    imported++;
  }
  return { imported, skipped };
}
