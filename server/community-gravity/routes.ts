import type { Express, Request, Response } from "express";
import { requireStaff, getUserId } from "../yhsi-routes";
import { buildGravityField, buildMagnetMap, clearMagnetMapCache, searchOrgs, getFacts, researchOrg, setVerified, ingestState, DOMAIN_LABELS } from "./engine";
import { countyCentroid, countyCentroidsForState } from "@shared/nationwide/county-centroids";
import { resolvePlace } from "../community-banks/profile";
import { isAuthenticated } from "../replit_integrations/auth";
import { db } from "../storage";
import { communityNetworkProfiles, userJourneys } from "@shared/schema";
import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { isUsStateCode } from "@shared/us-state-codes";
import { isHttpUrl, isPublicHttpUrl, parseCommunityCityStateLabel } from "./validation";

// Public reads are anonymous, rate-limited per req.ip, cached (public endpoint doctrine).
// Writes (ingest / research / verify) are staff-only via the canonical DB role lookup.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; resetAt: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  const e = hits.get(ip);
  if (!e || e.resetAt < now) { hits.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return false; }
  e.count += 1; return e.count > MAX_PER_WINDOW;
}

const CITY_RE = /^(?=.{2,80}$)(?=.*\p{L})[\p{L}\p{M}\p{N} .,'’\-]+$/u;
const EIN_RE = /^\d{9}$/;
const NETWORK_LIMIT = 200;
const NETWORK_PROFILE_STATUSES = ["draft", "published", "archived"] as const;

function place(req: Request): { city: string; state: string } | null {
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  const state = typeof req.query.state === "string" ? req.query.state.trim() : "";
  if (!CITY_RE.test(city) || !isUsStateCode(state)) return null;
  return { city, state };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

const optionalWebUrl = z.union([
  z.string().trim().max(500).refine(value => !value || isHttpUrl(value), "Use an http(s) URL."),
  z.null(),
]).optional().transform(value => value || null);
const networkProfileInput = z.object({
  name: z.string().trim().min(2).max(300),
  stakeholderType: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  city: z.string().trim().regex(CITY_RE),
  state: z.string().trim().transform(value => value.toUpperCase()).refine(isUsStateCode, "Use a valid U.S. state or territory abbreviation."),
  communityArea: z.string().trim().max(160).nullable().optional(),
  focusAreas: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  serviceArea: z.string().trim().max(500).nullable().optional(),
  website: optionalWebUrl,
  sourceUrl: z.string().trim().max(500).refine(isHttpUrl, "A public http(s) source URL is required."),
}).strict();
const networkProfilePatch = networkProfileInput.partial();

const GEOGRAPHY_LIMIT = "Locations are the IRS filing address (city, ZIP), not a service area. Nearby uses a 50-mile straight-line radius from mapped filing ZIPs, not travel distance; unmatched ZIPs are excluded.";

export function registerCommunityGravityRoutes(app: Express) {
  // Only this user's broad place selector; never needs, referrals, or other journey fields.
  app.get("/api/community-gravity/context", isAuthenticated, async (req: Request, res: Response) => {
    res.set("Cache-Control", "private, no-store");
    try {
      const uid = getUserId(req);
      if (!uid) return res.status(401).json({ error: "Sign in required." });
      const [journey] = await db.select({ context: userJourneys.communityContext, geography: userJourneys.lastKnownGeography })
        .from(userJourneys).where(eq(userJourneys.userId, uid)).limit(1);
      if (journey?.context?.countryCode && journey.context.countryCode !== "US") {
        return res.json({ place: null, status: "unsupported", source: "journey" });
      }
      const fips = journey?.context?.usFips;
      const label = journey?.context?.localLabel;
      const candidates = [fips ? `county:${fips}` : null, journey?.geography, label];
      const selector = candidates.find(p => {
        if (typeof p !== "string") return false;
        const value = p.trim();
        return /^\d{5}$/.test(value) || /^(?:county|fips):\d{5}$/i.test(value) || parseCommunityCityStateLabel(value) !== null;
      });
      return res.json({ place: selector?.trim() ?? null, status: selector ? "available" : "empty", source: "journey" });
    } catch (error) {
      console.error("[community-gravity] journey place failed:", error);
      return res.status(503).json({ error: "Journey place is unavailable." });
    }
  });
  app.get("/api/community-gravity", async (req: Request, res: Response) => {
    try {
      if (limited(req.ip ?? "unknown")) return res.status(429).json({ error: "Too many requests. Try again in a minute." });
      const p = place(req);
      if (!p) return res.status(400).json({ error: "Provide city (letters) and a two-letter state.", example: "?city=Austin&state=TX" });
      const field = await buildGravityField(p.city, p.state);
      res.set("Cache-Control", "public, max-age=300");
      res.json({ ...field, limits: [GEOGRAPHY_LIMIT], domains: DOMAIN_LABELS });
    } catch (error) {
      console.error("[community-gravity] field failed:", error);
      res.status(500).json({ error: "Community gravity field could not be assembled." });
    }
  });

  // Public Rolodex read: a separate profile table prevents directory membership
  // from granting referral, service-capacity, MOU, or operational-partner status.
  app.get("/api/community-gravity/network", async (req: Request, res: Response) => {
    try {
      if (limited(req.ip ?? "unknown")) return res.status(429).json({ error: "Too many requests. Try again in a minute." });
      const p = place(req);
      if (!p) return res.status(400).json({ error: "Provide city (letters) and a two-letter state.", example: "?city=Austin&state=TX" });
      const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
      const conditions = [
        eq(communityNetworkProfiles.status, "published"),
        sql`upper(${communityNetworkProfiles.city}) = ${p.city.toUpperCase()}`,
        eq(communityNetworkProfiles.state, p.state.toUpperCase()),
      ];
      if (q) {
        const pattern = `%${escapeLike(q)}%`;
        const searchCondition = or(
          ilike(communityNetworkProfiles.name, pattern),
          ilike(communityNetworkProfiles.stakeholderType, pattern),
          ilike(communityNetworkProfiles.description, pattern),
          ilike(communityNetworkProfiles.serviceArea, pattern),
          ilike(communityNetworkProfiles.communityArea, pattern),
          sql`EXISTS (SELECT 1 FROM unnest(${communityNetworkProfiles.focusAreas}) AS focus_area WHERE focus_area ILIKE ${pattern})`,
        );
        if (searchCondition) conditions.push(searchCondition);
      }
      const where = and(...conditions);
      const [totalRow] = await db.select({ total: count() }).from(communityNetworkProfiles).where(where);
      const profiles = await db.select({
        id: communityNetworkProfiles.id,
        name: communityNetworkProfiles.name,
        stakeholderType: communityNetworkProfiles.stakeholderType,
        description: communityNetworkProfiles.description,
        city: communityNetworkProfiles.city,
        state: communityNetworkProfiles.state,
        communityArea: communityNetworkProfiles.communityArea,
        focusAreas: communityNetworkProfiles.focusAreas,
        serviceArea: communityNetworkProfiles.serviceArea,
        website: communityNetworkProfiles.website,
        sourceUrl: communityNetworkProfiles.sourceUrl,
        publishedAt: communityNetworkProfiles.publishedAt,
      }).from(communityNetworkProfiles).where(where).orderBy(asc(communityNetworkProfiles.name)).limit(NETWORK_LIMIT);
      res.set("Cache-Control", "no-store");
      res.json({
        community: { city: p.city, state: p.state.toUpperCase() },
        profiles,
        total: Number(totalRow?.total ?? 0),
        limit: NETWORK_LIMIT,
        source: "Organization profile with a staff-reviewed public source URL.",
        limits: [
          "A listing does not establish a partnership, endorsement, referral relationship, shared service area, or service capacity.",
          "Only profiles explicitly published by staff appear; an empty result is a directory coverage gap, not evidence that no organizations are present.",
          "Organization profiles and IRS filing records are separate sources; the same organization may appear in both without an automatic identity match.",
          "No individual contacts, contact details, street addresses, or ZIP codes are stored in or returned by this directory.",
        ],
      });
    } catch (error) {
      console.error("[community-gravity] community network failed:", error);
      res.status(500).json({ error: "Community directory could not be assembled." });
    }
  });

  app.get("/api/community-gravity/network/manage", requireStaff, async (req: Request, res: Response) => {
    try {
      const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
      const state = typeof req.query.state === "string" ? req.query.state.trim() : "";
      if ((city || state) && (!CITY_RE.test(city) || !isUsStateCode(state))) {
        return res.status(400).json({ error: "Provide both a valid city and two-letter state, or neither." });
      }
      const locationCondition = city && state
        ? and(
          sql`upper(${communityNetworkProfiles.city}) = ${city.toUpperCase()}`,
          eq(communityNetworkProfiles.state, state.toUpperCase()),
        )
        : undefined;
      const profiles = await db.select({
        id: communityNetworkProfiles.id,
        name: communityNetworkProfiles.name,
        stakeholderType: communityNetworkProfiles.stakeholderType,
        description: communityNetworkProfiles.description,
        city: communityNetworkProfiles.city,
        state: communityNetworkProfiles.state,
        communityArea: communityNetworkProfiles.communityArea,
        focusAreas: communityNetworkProfiles.focusAreas,
        serviceArea: communityNetworkProfiles.serviceArea,
        website: communityNetworkProfiles.website,
        sourceUrl: communityNetworkProfiles.sourceUrl,
        status: communityNetworkProfiles.status,
        createdAt: communityNetworkProfiles.createdAt,
        updatedAt: communityNetworkProfiles.updatedAt,
      }).from(communityNetworkProfiles).where(locationCondition)
        .orderBy(asc(communityNetworkProfiles.state), asc(communityNetworkProfiles.city), asc(communityNetworkProfiles.name)).limit(500);
      res.set("Cache-Control", "private, no-store");
      res.json({ profiles, limit: 500 });
    } catch (error) {
      console.error("[community-gravity] network management list failed:", error);
      res.status(500).json({ error: "Organization profiles could not be loaded." });
    }
  });

  app.post("/api/community-gravity/network", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = networkProfileInput.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid organization profile.", details: parsed.error.flatten().fieldErrors });
      if (!(await isPublicHttpUrl(parsed.data.sourceUrl)) ||
          (parsed.data.website && !(await isPublicHttpUrl(parsed.data.website)))) {
        return res.status(400).json({ error: "Source and website URLs must resolve only to publicly routable addresses." });
      }
      const [profile] = await db.insert(communityNetworkProfiles).values({
        ...parsed.data,
        createdByUserId: getUserId(req) ?? null,
        status: "draft",
      }).returning({ id: communityNetworkProfiles.id, city: communityNetworkProfiles.city, state: communityNetworkProfiles.state });
      res.status(201).json({ id: profile.id, status: "draft", city: profile.city, state: profile.state, message: "Saved as a draft; publish it after checking the cited source." });
    } catch (error) {
      console.error("[community-gravity] network profile create failed:", error);
      res.status(500).json({ error: "Organization profile could not be saved." });
    }
  });

  app.patch("/api/community-gravity/network/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      const parsed = networkProfilePatch.safeParse(req.body);
      if (!parsed.success || !Object.keys(parsed.data ?? {}).length) {
        return res.status(400).json({ error: "Provide at least one valid profile field.", details: parsed.success ? undefined : parsed.error.flatten().fieldErrors });
      }
      if ((parsed.data.sourceUrl && !(await isPublicHttpUrl(parsed.data.sourceUrl))) ||
          (parsed.data.website && !(await isPublicHttpUrl(parsed.data.website)))) {
        return res.status(400).json({ error: "Source and website URLs must resolve only to publicly routable addresses." });
      }
      const [profile] = await db.update(communityNetworkProfiles).set({
        ...parsed.data,
        status: "draft",
        verifiedByUserId: null,
        publishedAt: null,
        updatedAt: new Date(),
      }).where(eq(communityNetworkProfiles.id, String(req.params.id))).returning({ id: communityNetworkProfiles.id, city: communityNetworkProfiles.city, state: communityNetworkProfiles.state });
      if (!profile) return res.status(404).json({ error: "Organization profile not found." });
      res.json({ id: profile.id, status: "draft", city: profile.city, state: profile.state, message: "Changes saved as a draft; republish after reviewing the source." });
    } catch (error) {
      console.error("[community-gravity] network profile update failed:", error);
      res.status(500).json({ error: "Organization profile could not be updated." });
    }
  });

  app.post("/api/community-gravity/network/:id/publish", requireStaff, async (req: Request, res: Response) => {
    try {
      const [profile] = await db.select({
        id: communityNetworkProfiles.id,
        sourceUrl: communityNetworkProfiles.sourceUrl,
        website: communityNetworkProfiles.website,
      })
        .from(communityNetworkProfiles).where(eq(communityNetworkProfiles.id, String(req.params.id))).limit(1);
      if (!profile) return res.status(404).json({ error: "Organization profile not found." });
      const [sourceIsPublic, websiteIsPublic] = await Promise.all([
        isPublicHttpUrl(profile.sourceUrl),
        profile.website ? isPublicHttpUrl(profile.website) : Promise.resolve(true),
      ]);
      if (!sourceIsPublic || !websiteIsPublic) {
        return res.status(400).json({ error: "Source and website URLs must resolve only to publicly routable addresses before publishing." });
      }
      const [published] = await db.update(communityNetworkProfiles).set({
        status: "published",
        verifiedByUserId: getUserId(req) ?? null,
        publishedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(communityNetworkProfiles.id, profile.id)).returning({ id: communityNetworkProfiles.id });
      if (!published) return res.status(404).json({ error: "Organization profile no longer exists." });
      res.json({ id: published.id, status: "published" });
    } catch (error) {
      console.error("[community-gravity] network profile publish failed:", error);
      res.status(500).json({ error: "Organization profile could not be published." });
    }
  });

  app.post("/api/community-gravity/network/:id/archive", requireStaff, async (req: Request, res: Response) => {
    try {
      const [archived] = await db.update(communityNetworkProfiles).set({
        status: "archived",
        verifiedByUserId: null,
        publishedAt: null,
        updatedAt: new Date(),
      }).where(eq(communityNetworkProfiles.id, String(req.params.id))).returning({ id: communityNetworkProfiles.id });
      if (!archived) return res.status(404).json({ error: "Organization profile not found." });
      res.json({ id: archived.id, status: "archived" });
    } catch (error) {
      console.error("[community-gravity] network profile archive failed:", error);
      res.status(500).json({ error: "Organization profile could not be archived." });
    }
  });

  // Phase 4b: ZIP-aggregated gravity + county need + resource pins. Public, cached, no geocoding fan-out.
  app.get("/api/community-gravity/map", async (req: Request, res: Response) => {
    try {
      if (limited(req.ip ?? "unknown")) return res.status(429).json({ error: "Too many requests. Try again in a minute." });
      const countiesRaw = req.query.counties;
      let counties: string[] = [];
      let p = place(req);
      if (countiesRaw !== undefined) {
        if (typeof countiesRaw !== "string" || !/^\d{5}(?:,\d{5}){0,9}$/.test(countiesRaw)) return res.status(400).json({ error: "Provide up to 10 comma-separated county FIPS codes." });
        counties = [...new Set(countiesRaw.split(","))];
        const official = counties.map(countyCentroid);
        if (official.some(c => !c) || new Set(official.map(c => c!.state)).size !== 1) return res.status(400).json({ error: "Counties must exist and belong to one state." });
        const state = official[0]!.state;
        if (req.query.state !== undefined && (typeof req.query.state !== "string" || req.query.state.trim().toUpperCase() !== state)) return res.status(400).json({ error: "State does not match selected counties." });
        p = { city: "", state };
      } else if (req.query.place !== undefined || req.query.zip !== undefined) {
        const input = req.query.place ?? req.query.zip;
        if (typeof input !== "string" || input.length > 80 || !input.trim()) return res.status(400).json({ error: "Provide a ZIP, county:FIPS, or City, ST." });
        const resolved = await resolvePlace(input);
        if (!resolved.ok) return res.status(404).json({ error: resolved.reason });
        counties = resolved.geography.counties.map(c => c.fips);
        if (counties.some(f => !countyCentroid(f))) return res.status(404).json({ error: "County geometry unavailable." });
        p = { city: "", state: resolved.geography.state };
      }
      if (!p || !countyCentroidsForState(p.state).length) return res.status(400).json({ error: "Provide a valid city/state, ZIP, or county list." });
      const map = await buildMagnetMap(p.city, p.state, counties);
      res.set("Cache-Control", "public, max-age=600");
      res.json(map);
    } catch (error) {
      console.error("[community-gravity] map failed:", error);
      res.status(500).json({ error: "Magnet map could not be assembled." });
    }
  });

  app.get("/api/community-gravity/orgs", async (req: Request, res: Response) => {
    try {
      if (limited(req.ip ?? "unknown")) return res.status(429).json({ error: "Too many requests. Try again in a minute." });
      const p = place(req);
      if (!p) return res.status(400).json({ error: "Provide city (letters) and a two-letter state." });
      const q = typeof req.query.q === "string" ? req.query.q.slice(0, 80) : "";
      const domain = typeof req.query.domain === "string" && req.query.domain in DOMAIN_LABELS ? req.query.domain : undefined;
      const orgs = await searchOrgs(p.city, p.state, q, domain);
      res.set("Cache-Control", "public, max-age=120");
      res.json({ orgs, count: orgs.length, limits: [GEOGRAPHY_LIMIT] });
    } catch (error) {
      console.error("[community-gravity] search failed:", error);
      res.status(500).json({ error: "Organization search failed." });
    }
  });

  app.get("/api/community-gravity/orgs/:ein/facts", async (req: Request, res: Response) => {
    try {
      if (limited(req.ip ?? "unknown")) return res.status(429).json({ error: "Too many requests. Try again in a minute." });
      const ein = String(req.params.ein);
      if (!EIN_RE.test(ein)) return res.status(400).json({ error: "EIN must be 9 digits." });
      const facts = await getFacts(ein);
      res.set("Cache-Control", "public, max-age=120");
      res.json({ ein, facts, evidence: facts.length ? "Each fact carries the URL it was drawn from; facts without a citation were discarded." : "No cited research on file for this organization yet." });
    } catch (error) {
      console.error("[community-gravity] facts failed:", error);
      res.status(500).json({ error: "Facts could not be loaded." });
    }
  });

  app.post("/api/community-gravity/orgs/:ein/research", requireStaff, async (req: Request, res: Response) => {
    try {
      const ein = String(req.params.ein);
      if (!EIN_RE.test(ein)) return res.status(400).json({ error: "EIN must be 9 digits." });
      const result = await researchOrg(ein);
      try {
        res.json({ ...result, facts: await getFacts(ein) });
      } catch (readError) {
        console.error("[community-gravity] research receipt facts read failed:", readError);
        res.json({ ...result, facts: null, reason: "Research receipt recorded, but cited facts could not be reloaded. Refresh facts before retrying." });
      }
    } catch (error) {
      console.error("[community-gravity] research failed:", error);
      res.status(502).json({ error: "Web research could not be confirmed. Refresh cited facts before retrying; a database connection failure can leave the commit outcome unknown." });
    }
  });

  app.post("/api/community-gravity/orgs/:ein/verify", requireStaff, async (req: Request, res: Response) => {
    try {
      const ein = String(req.params.ein);
      if (!EIN_RE.test(ein)) return res.status(400).json({ error: "EIN must be 9 digits." });
      const verified = req.body?.verified === true;
      const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 500) : undefined;
      const ok = await setVerified(ein, getUserId(req)!, verified, note);
      if (!ok) return res.status(404).json({ error: "Unknown organization." });
      res.json({ ein, verified });
    } catch (error) {
      console.error("[community-gravity] verify failed:", error);
      res.status(500).json({ error: "Verification could not be saved." });
    }
  });

  app.post("/api/community-gravity/ingest", requireStaff, async (req: Request, res: Response) => {
    try {
      const state = typeof req.body?.state === "string" ? req.body.state.trim() : "";
      const city = typeof req.body?.city === "string" ? req.body.city.trim() : undefined;
      if (!isUsStateCode(state) || (city !== undefined && !CITY_RE.test(city))) return res.status(400).json({ error: "Provide a valid U.S. state or territory code and an optional city." });
      const result = await ingestState(state, city);
      clearMagnetMapCache();
      res.json(result);
    } catch (error) {
      console.error("[community-gravity] ingest failed:", error);
      res.status(502).json({ error: "IRS source could not be ingested. Nothing partial was reported as complete." });
    }
  });
}
