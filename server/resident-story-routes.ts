// The community story: one place, every lens ThriveUp owns, honestly joined.
//
// A resident shares a location (ZIP) or a point (GPS): ThriveUp tells the
// community and leadership story — schools and providers (ChildCORE), the
// county's economic and social context (Census + RPLICE), and live hazard
// context (HazardAware partner bridge). Elected representatives and local
// news are NOT ingested feeds yet: they are the official lookup tools,
// linked as such, never fabricated as data.
//
// Doctrine: every section carries its own status. A source that did not
// answer is named, never shown as calm or empty. Nothing here invents a
// number, an official, or a headline.
import type { Express, Request, Response } from "express";
import { getChildCORECommunityData, isChildCOREConfigured, buildChildCOREContextBlock } from "./childcore-connector";
import { warmCommunityContext } from "./community-context";
import { hazardContext } from "./hazardaware-routes";

type Section = {
  id: string;
  title: string;
  status: "live" | "unavailable" | "external" | "needs-zip";
  note: string;
  data?: unknown;
  links?: { label: string; url: string }[];
};

const HOUSE_ZIP_LOOKUP = (zip: string) => `https://ziplook.house.gov/htbin/findrep_house?ZIP=${encodeURIComponent(zip)}`;

async function countyFromPoint(lat: number, lon: number): Promise<{ county: string; state: string } | null> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/reverse?x=${lon}&y=${lat}&benchmark=Public_AR_Current&format=json&vintage=Current_Current`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const d = await r.json();
    const g = d?.result?.geographies?.Counties?.[0];
    if (g?.NAME && g?.STATE) return { county: `${g.NAME} County`, state: String(g.STATE) };
    return null;
  } catch {
    return null;
  }
}

export function registerResidentStoryRoutes(app: Express) {
  app.get("/api/story", async (req: Request, res: Response) => {
    const zip = typeof req.query.zip === "string" ? req.query.zip.replace(/\D/g, "").slice(0, 5) : "";
    const lat = typeof req.query.lat === "string" ? Number(req.query.lat) : NaN;
    const lon = typeof req.query.lon === "string" ? Number(req.query.lon) : NaN;
    const hasPoint = Number.isFinite(lat) && Number.isFinite(lon);

    if (!zip && !hasPoint) {
      return res.status(400).json({ message: "A story needs a place: a ZIP code, or lat and lon." });
    }

    const sections: Section[] = [];
    let communityName = zip ? `ZIP ${zip}` : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    let county: string | null = null;

    // County from the point when GPS is shared — unlocks the Census + RPLICE
    // story and the state-level links without a typed ZIP.
    if (hasPoint) {
      const c = await countyFromPoint(lat, lon);
      if (c) { county = c.county; communityName = c.county; }
    }

    // 1. Schools, providers, SDOH — ChildCORE school intelligence per ZIP.
    if (zip && isChildCOREConfigured()) {
      try {
        const data = await getChildCORECommunityData(zip);
        if (data) {
          sections.push(
            { id: "schools", title: "Schools", status: "live", note: "ChildCORE school intelligence for this ZIP.", data: data.schools ?? null },
            { id: "providers", title: "Providers", status: "live", note: "ChildCORE community providers for this ZIP.", data: data.providers ?? null },
            { id: "sdoh", title: "Social determinants", status: "live", note: "ChildCORE social determinants for this community.", data: data.sdoh ?? null },
          );
        } else {
          sections.push({ id: "childcore", title: "Schools and providers", status: "unavailable", note: "ChildCORE did not answer for this ZIP. Unknown, not empty." });
        }
      } catch (err: any) {
        sections.push({ id: "childcore", title: "Schools and providers", status: "unavailable", note: `ChildCORE failed: ${String(err?.message || err)}` });
      }
    } else if (!zip) {
      sections.push({ id: "childcore", title: "Schools and providers", status: "needs-zip", note: "School, provider, and SDOH intelligence is keyed by ZIP code — enter one to unlock this part of the story." });
    } else {
      sections.push({ id: "childcore", title: "Schools and providers", status: "unavailable", note: "ChildCORE is not configured on this deployment (CHILDCORE_API_KEY). Unknown, not empty." });
    }

    // 2. County economic and social context — Census + RPLICE narrative.
    try {
      const narrative = await warmCommunityContext(zip || county || communityName);
      sections.push({
        id: "community-context", title: "Community context", status: "live",
        note: "Census and RPLICE community intelligence, joined by ThriveUp.",
        data: { narrative },
      });
    } catch (err: any) {
      sections.push({ id: "community-context", title: "Community context", status: "unavailable", note: `The community context service did not answer: ${String(err?.message || err)}` });
    }

    // 3. Hazard context — the HazardAware partner bridge. Unconfigured or
    // unreachable says so; never an empty hazard list shown as calm.
    try {
      const hazard = await hazardContext(zip ? { q: zip } : { lat, lon });
      const ok = typeof hazard === "object" && hazard !== null && !("message" in (hazard as any));
      sections.push({
        id: "hazard", title: "Hazard context", status: ok ? "live" : "unavailable",
        note: ok
          ? "Live hazard context bridged from HazardAware; failed feeds are named there, never shown as calm."
          : `The HazardAware bridge did not return live context: ${typeof hazard === "object" && hazard !== null && "message" in (hazard as any) ? String((hazard as any).message) : "no answer"}. This is not calm weather.`,
        data: ok ? hazard : null,
      });
    } catch (err: any) {
      sections.push({ id: "hazard", title: "Hazard context", status: "unavailable", note: `The bridge call failed: ${String(err?.message || err)}` });
    }

    // 4. Elected representatives — the official lookup tools, linked, not
    // fabricated as data. An ingested feed is future work, named here.
    const repLinks = [
      ...(zip ? [{ label: "Find your U.S. Representative (official House lookup)", url: HOUSE_ZIP_LOOKUP(zip) }] : []),
      { label: "Your U.S. Senators (official Senate page)", url: "https://www.senate.gov/senators/senator-by-state.htm" },
      { label: "State and local officials (USA.gov directory)", url: "https://www.usa.gov/elected-officials" },
    ];
    sections.push({
      id: "reps", title: "Your representatives", status: "external",
      note: "Elected-official data is not yet an ingested feed. These are the official lookup tools — ThriveUp links them rather than inventing rows.",
      links: repLinks,
    });

    // 5. Local news — searched, not ingested. Honest about what it is.
    sections.push({
      id: "news", title: "Local news", status: "external",
      note: "Local news is not yet an ingested feed. This searches live news for the community; ThriveUp does not curate or fabricate headlines.",
      links: [{ label: `Search local news for ${communityName}`, url: `https://news.google.com/search?q=${encodeURIComponent(communityName)}` }],
    });

    res.json({
      community: { zip: zip || null, lat: hasPoint ? lat : null, lon: hasPoint ? lon : null, name: communityName, county },
      generatedAt: new Date().toISOString(),
      sections,
      law: "One place, every lens ThriveUp owns, honestly joined. A source that did not answer is named. Representatives and news are the official tools, linked — never fabricated as data.",
    });
  });
}
