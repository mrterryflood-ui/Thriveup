/**
 * Nationwide ZIP → county resolver, backed by the zcta_county_map table
 * (loaded via scripts/load-zcta-county.ts from the Census Bureau's public
 * ZCTA-to-County relationship file — see that script for provenance).
 *
 * This supersedes the "no free ZIP-only geocoding API" blocker documented
 * in shared/nationwide/zip-resolver.ts: that file's `resolveZip` remains a
 * fast, dependency-free fallback (state-level only outside the 5-county
 * seed region) for callers that can't await a DB query (e.g. shared/client
 * code). Server-side geography resolution should prefer this resolver.
 */
import { db } from "../storage";
import { zctaCountyMap } from "@shared/schema";
import { eq } from "drizzle-orm";
import { resolveZip as resolveZipStatic } from "@shared/nationwide/zip-resolver";

const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL",
  "13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME",
  "24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
  "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
  "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
};

export interface ZipCountyResolution {
  zip: string;
  countyFips: string;
  stateFips: string;
  state: string;
  popPct: number | null;
  source: string;
}

/**
 * Resolve a ZIP to its county via the loaded Census ZCTA-county crosswalk.
 * Returns null if the table has no row for this ZIP (e.g. new/retired ZIP,
 * or the table hasn't been loaded) — falls back to nothing here; callers
 * that need a best-effort state guess should fall back to the static
 * `resolveZip` from shared/nationwide/zip-resolver themselves.
 */
export async function resolveZipToCountyDB(zip: string): Promise<ZipCountyResolution | null> {
  const clean = (zip || "").replace(/\D/g, "").slice(0, 5);
  if (clean.length !== 5) return null;
  const [row] = await db.select().from(zctaCountyMap).where(eq(zctaCountyMap.zip, clean)).limit(1);
  if (!row) return null;
  return {
    zip: row.zip,
    countyFips: row.countyFips,
    stateFips: row.stateFips,
    state: STATE_FIPS_TO_ABBR[row.stateFips] || "",
    popPct: row.popPct ?? null,
    source: row.source,
  };
}

/**
 * Best-effort resolver: DB crosswalk first (nationwide, county-accurate),
 * falls back to the static in-memory range table (state-only outside the
 * seeded 5-county region) if the DB has no row or the query fails.
 */
export async function resolveZipBestEffort(zip: string): Promise<{ countyFips?: string; state?: string; countyName?: string; source: "db" | "static" | "none" }> {
  try {
    const dbHit = await resolveZipToCountyDB(zip);
    if (dbHit) return { countyFips: dbHit.countyFips, state: dbHit.state, source: "db" };
  } catch {
    // fall through to static
  }
  const staticHit = resolveZipStatic(zip);
  if (staticHit) return { countyFips: staticHit.countyFips || undefined, state: staticHit.state, countyName: staticHit.countyName || undefined, source: "static" };
  return { source: "none" };
}
