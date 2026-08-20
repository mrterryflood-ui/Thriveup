/**
 * Time–Place–Need Conductor
 *
 * The community operating spine: normalize a local need, select the existing
 * aggregate intelligence engines that fit it, find locally relevant resources,
 * and optionally ask Perplexity for current place/time-sensitive facts.
 *
 * This module is deliberately a composer, not a new replacement for the
 * Community Impact Conductor, Chainweb, MAP-GAP, or resource directory. Every
 * external/local fact is labeled with its source and verification status.
 * Web research is lead generation only; it never becomes a confirmed provider,
 * open facility, or live capacity claim.
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { db } from "./storage";
import {
  communityPartners,
  cqiOutcomes,
  outcomeTracking,
  partnerReferrals,
  sharedOutcomes,
  zctaCountyMap,
} from "@shared/schema";
import { searchResources } from "./resource-engine";
import { fetchZctaData, resolveLocationToZip } from "./neighborhood-routes";
import { getOrchestratedIntelligence, type GeographyRef } from "./orchestration/conductor";
import { isPerplexityAvailable, perplexityResearch } from "./ai-provider";

const NEED_CATEGORIES = [
  "heat",
  "cooling",
  "weather",
  "emergency",
  "housing",
  "homelessness",
  "health",
  "behavioral-health",
  "food",
  "benefits",
  "workforce",
  "childcare",
  "youth",
  "safety",
  "transportation",
  "general",
] as const;

const requestSchema = z.object({
  location: z.string().trim().min(2).max(200),
  need: z.object({
    category: z.enum(NEED_CATEGORIES).default("general"),
    description: z.string().trim().max(1000).optional(),
    urgency: z.enum(["routine", "soon", "urgent", "emergency"]).default("routine"),
    population: z.string().trim().max(200).optional(),
    languages: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
    accessibility: z.array(z.string().trim().min(1).max(120)).max(10).optional(),
  }),
  requestedAt: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().trim().max(80).optional(),
  liveResearch: z.boolean().default(false),
  domains: z.array(z.string().trim().min(1).max(60)).max(15).optional(),
}).strict();

type NeedRequest = z.infer<typeof requestSchema>;

const CORE_DOMAINS = ["equity", "geospatial", "roi-causal"];
const NEED_DOMAINS: Record<string, string[]> = {
  heat: ["health", "housing", "benefits"],
  cooling: ["health", "housing", "benefits"],
  weather: ["health", "housing", "geospatial"],
  emergency: ["health", "housing", "community-safety"],
  housing: ["housing", "benefits", "health"],
  homelessness: ["housing", "benefits", "health", "family-services"],
  health: ["health", "benefits"],
  "behavioral-health": ["health", "family-services"],
  food: ["benefits", "health", "family-services"],
  benefits: ["benefits", "equity"],
  workforce: ["workforce", "economic-development", "benefits"],
  childcare: ["childcare", "family-services", "benefits"],
  youth: ["youth", "education", "family-services"],
  safety: ["community-safety", "health", "housing"],
  transportation: ["benefits", "workforce", "health"],
  general: ["health", "housing", "benefits", "workforce", "family-services"],
};

const RESOURCE_QUERY: Record<string, string> = {
  heat: "heat cooling emergency",
  cooling: "cooling heat emergency",
  weather: "weather emergency",
  emergency: "emergency assistance",
  housing: "housing shelter rental",
  homelessness: "housing shelter homeless",
  health: "healthcare clinic",
  "behavioral-health": "mental health crisis",
  food: "food SNAP",
  benefits: "benefits assistance",
  workforce: "workforce job training",
  childcare: "childcare family",
  youth: "youth family",
  safety: "safety emergency",
  transportation: "transportation",
  general: "",
};

const TEMPORAL_RESEARCH_CATEGORIES = new Set([
  "heat",
  "cooling",
  "weather",
  "emergency",
  "safety",
]);

const PUBLIC_ENGINE_IDS = new Set(["chainweb-engine"]);

const rateHits = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 4;
const MAX_IN_FLIGHT = 4;
let inFlightRequests = 0;

function clientIp(req: Request): string {
  return (req.ip || req.socket?.remoteAddress || "unknown").trim();
}

function allowRequest(ip: string): number | null {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const hits = (rateHits.get(ip) || []).filter((hit) => hit > cutoff);
  if (hits.length === 0) rateHits.delete(ip);
  if (hits.length >= RATE_LIMIT) {
    return Math.max(1, Math.ceil((hits[0] + RATE_WINDOW_MS - now) / 1000));
  }
  hits.push(now);
  rateHits.set(ip, hits);
  return null;
}

function safeTimezone(candidate: string | undefined, state: string | undefined): string {
  const fallback = state === "TX" ? "America/Chicago" : "UTC";
  const timezone = candidate || fallback;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return fallback;
  }
}

function temporalContext(requestedAt: string | undefined, timezone: string): {
  requestedAt: string;
  timezone: string;
  localDate: string;
  localTime: string;
  hour: number;
  season: "winter" | "spring" | "summer" | "fall";
  isTypicalBusinessHours: boolean;
} {
  const date = requestedAt ? new Date(requestedAt) : new Date();
  const month = Number(new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "numeric" }).format(date));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (name: string) => parts.find((part) => part.type === name)?.value || "";
  const hour = Number(value("hour"));
  const season = month >= 3 && month <= 5 ? "spring"
    : month >= 6 && month <= 8 ? "summer"
    : month >= 9 && month <= 11 ? "fall"
    : "winter";
  return {
    requestedAt: date.toISOString(),
    timezone,
    localDate: `${value("year")}-${value("month")}-${value("day")}`,
    localTime: `${value("hour")}:${value("minute")}`,
    hour,
    season,
    isTypicalBusinessHours: hour >= 8 && hour < 18,
  };
}

function normalizeCategories(need: NeedRequest["need"]): string[] {
  return [...new Set([
    ...(NEED_DOMAINS[need.category] || NEED_DOMAINS.general),
    ...((need.category === "heat" || need.category === "cooling") ? ["health", "housing"] : []),
  ])];
}

function looksLikeSupportedPlaceInput(location: string): boolean {
  return /^\d{5}$/.test(location) ||
    /,\s*[A-Za-z]{2,}$/.test(location) ||
    /\b(county|parish|borough)\b/i.test(location);
}

function partnerMatchesNeed(
  partner: typeof communityPartners.$inferSelect,
  resolved: Awaited<ReturnType<typeof resolveLocationToZip>>,
  category: string,
): boolean {
  const haystack = [
    partner.name,
    partner.type,
    partner.description,
    ...(partner.serviceCategories || []),
    ...(partner.facilitiesAvailable || []),
    ...(partner.programsOffered || []),
    JSON.stringify(partner.specialCapabilities || {}),
  ].filter(Boolean).join(" ").toLowerCase();
  const terms = (RESOURCE_QUERY[category] || category).toLowerCase().split(/\s+/).filter(Boolean);
  const categoryMatch = category === "general" || terms.some((term) => haystack.includes(term));
  const targetPlace = resolved?.displayName.split(",")[0]?.trim().toLowerCase() || "";
  const serviceArea = partner.serviceArea?.toLowerCase() || "";
  const locationMatch = Boolean(resolved && (
    partner.zipCode === resolved.zip ||
    (Boolean(partner.city) && partner.city!.toLowerCase() === targetPlace) ||
    (serviceArea.length > 0 && (
      serviceArea.includes(resolved.zip) ||
      serviceArea.includes(targetPlace)
    ))
  ));
  return categoryMatch && locationMatch;
}

function publicPartner(partner: typeof communityPartners.$inferSelect) {
  return {
    id: partner.id,
    name: partner.name,
    type: partner.type,
    description: partner.description,
    city: partner.city,
    state: partner.state,
    zipCode: partner.zipCode,
    serviceCategories: partner.serviceCategories || [],
    serviceArea: partner.serviceArea,
    website: partner.website,
    phone: partner.contactPhone,
    isVerified: Boolean(partner.isVerified),
    verificationStatus: partner.isVerified ? "platform-verified" : "source-listed-unverified",
    capacity: null,
    capacityStatus: "unknown",
    programsOffered: partner.programsOffered || [],
    facilitiesAvailable: partner.facilitiesAvailable || [],
    updatedAt: partner.updatedAt,
  };
}

async function resolveCountyForZip(zip: string | undefined): Promise<string | undefined> {
  if (!zip) return undefined;
  const [row] = await db.select({ countyFips: zctaCountyMap.countyFips })
    .from(zctaCountyMap)
    .where(eq(zctaCountyMap.zip, zip))
    .limit(1);
  return row?.countyFips || undefined;
}

async function loadLocalResources(
  resolved: Awaited<ReturnType<typeof resolveLocationToZip>>,
  category: string,
) {
  const stateCode = resolved?.stateAbbrev;
  const sourceListed = searchResources({
    stateCode,
    query: RESOURCE_QUERY[category],
    limit: 30,
  }).map((resource) => ({
    ...resource,
    verificationStatus: "source-listed-unverified" as const,
    capacityStatus: "unknown" as const,
  }));

  const partners = await db.select().from(communityPartners)
    .where(eq(communityPartners.isActive, true));
  const localPartners = partners
    .filter((partner) => partnerMatchesNeed(partner, resolved, category))
    .slice(0, 30)
    .map(publicPartner);

  return {
    sourceListed,
    localPartners,
    disclosures: [
      "Source-listed resources are not proof of current availability or referral acceptance.",
      "Partner capacity is intentionally withheld here because this public route has no live freshness/acceptance proof.",
      "A human navigator should confirm hours, accessibility, eligibility, and acceptance before directing a person to travel.",
    ],
  };
}

async function runLiveLocalResearch(
  request: NeedRequest,
  resolved: Awaited<ReturnType<typeof resolveLocationToZip>>,
  time: ReturnType<typeof temporalContext>,
) {
  const exactAddress = resolved?.requestedType === "address_or_place";
  const shouldResearch = request.liveResearch &&
    !exactAddress &&
    TEMPORAL_RESEARCH_CATEGORIES.has(request.need.category) &&
    (request.need.urgency !== "routine" || time.season === "summer" || Boolean(request.need.description));
  if (!shouldResearch) {
    return {
      status: "not-requested",
      reason: exactAddress
        ? "Live web research is disabled for exact-address requests on the public route."
        : "No live time-sensitive local research was needed for this request.",
      citations: [] as string[],
    };
  }
  if (!isPerplexityAvailable()) {
    return {
      status: "unavailable",
      reason: "Perplexity is not configured; no live web claim was made.",
      citations: [] as string[],
    };
  }

  const place = resolved?.displayName || request.location;
  const prompt = [
    `Find current, official, locally relevant information for ${place}.`,
    `The current local date/time is ${time.localDate} ${time.localTime} (${time.timezone}).`,
    `Need category: ${request.need.category}. Urgency: ${request.need.urgency}.`,
    "For heat/cooling requests, prioritize official city, county, public-health, emergency-management, transit, library, and 211 sources.",
    "Return only facts that have a source URL, including facility name, address, phone, hours, eligibility, and whether the source explicitly says it is open/current.",
    "Do not infer that a facility is open, has capacity, or accepts referrals if the source does not say so.",
  ].filter(Boolean).join("\n");
  try {
    const result = await perplexityResearch(prompt, [
      "You are a local public-service research assistant.",
      "Use primary or official sources whenever possible. Clearly separate current facts from leads requiring human confirmation.",
      "Never fabricate a cooling center, heat center, address, hours, phone number, capacity, or emergency status.",
    ].join("\n"), 1800);
    return {
      status: "researched-leads",
      text: result.text.slice(0, 7000),
      citations: [...new Set(result.citations)].slice(0, 20),
      disclosure: "Perplexity web research is a current-information lead, not a confirmed provider or live capacity feed. Verify before referral.",
    };
  } catch (error) {
    console.error("[time-place-need] live research failed:", error);
    return {
      status: "failed",
      reason: "Live research failed; existing source-listed data remains separate.",
      citations: [] as string[],
    };
  }
}

async function loadOutcomeSnapshot() {
  try {
    const [trackedByCategory, sharedByCategory, cqiByType, referralsByStatus] = await Promise.all([
      db.select({
        category: outcomeTracking.category,
        count: count(),
      }).from(outcomeTracking).groupBy(outcomeTracking.category),
      db.select({
        category: sharedOutcomes.outcomeCategory,
        count: count(),
      }).from(sharedOutcomes).where(eq(sharedOutcomes.status, "active")).groupBy(sharedOutcomes.outcomeCategory),
      db.select({
        outcomeType: cqiOutcomes.outcomeType,
        count: count(),
      }).from(cqiOutcomes).groupBy(cqiOutcomes.outcomeType),
      db.select({
        status: partnerReferrals.status,
        count: count(),
      }).from(partnerReferrals).groupBy(partnerReferrals.status),
    ]);
    return {
      status: "available",
      trackedSources: {
        outcomeTracking: trackedByCategory.length > 0,
        sharedOutcomes: sharedByCategory.length > 0,
        cqiOutcomes: cqiByType.length > 0,
        referralLifecycle: referralsByStatus.length > 0,
      },
      disclosure: "The public route exposes only whether the platform's outcome ledgers are available; it does not expose global counts, categories, participant records, or outcomes attributable to this request.",
    };
  } catch (error) {
    console.error("[time-place-need] outcome snapshot failed:", error);
    return {
      status: "unavailable",
      trackedSources: {
        outcomeTracking: false,
        sharedOutcomes: false,
        cqiOutcomes: false,
        referralLifecycle: false,
      },
      disclosure: "Outcome tables could not be read; no outcome was inferred.",
    };
  }
}

export async function buildTimePlaceNeedIntelligence(input: unknown) {
  const request = requestSchema.parse(input);
  if (!looksLikeSupportedPlaceInput(request.location)) {
    throw new Error("Location must be a ZIP, city/state, address/place with a state, or named county/parish/borough");
  }
  const resolved = await resolveLocationToZip(request.location);
  if (!resolved) {
    throw new Error("Location could not be resolved to a supported ZIP or city/state location");
  }
  if (/^\d{5}$/.test(request.location) && !resolved.stateAbbrev) {
    throw new Error("ZIP is not recognized as a supported US ZIP");
  }
  if (/^\d{5}$/.test(request.location)) {
    const zcta = await fetchZctaData(request.location);
    if (!zcta) {
      throw new Error("ZIP could not be verified as an existing Census ZCTA");
    }
  }

  const timezone = safeTimezone(request.timezone, resolved.stateAbbrev);
  const time = temporalContext(request.requestedAt, timezone);
  const countyFips = await resolveCountyForZip(resolved.zip);
  const geography: GeographyRef = {
    zip: resolved.zip,
    state: resolved.stateAbbrev,
    countyFips,
    countyName: countyFips === "48453" ? "Travis County" : undefined,
    geographyLabel: resolved.displayName,
  };
  const domains = [...new Set([
    ...CORE_DOMAINS,
    ...normalizeCategories(request.need),
    ...(request.domains || []),
  ])];

  const [localResources, orchestration, liveResearch, outcomeSnapshot] = await Promise.all([
    loadLocalResources(resolved, request.need.category),
    // This route is public. The full Conductor remains available to internal
    // operators, but public time-sensitive navigation must not fan out into
    // PII-adjacent aggregate engines. Chainweb's evidence library is the only
    // raw orchestration fact safe to expose here.
    getOrchestratedIntelligence(geography, { engines: ["chainweb-engine"] }),
    runLiveLocalResearch(request, resolved, time),
    loadOutcomeSnapshot(),
  ]);

  const unavailableEngines = orchestration.facts
    .filter((fact) => Boolean(fact.error))
    .map((fact) => ({ engineId: fact.engineId, reason: fact.error }));
  const availableEngines = orchestration.facts
    .filter((fact) => !fact.error && fact.data != null)
    .map((fact) => ({ engineId: fact.engineId, label: fact.engineLabel, fetchedAt: fact.fetchedAt }));

  const gaps = [
    ...(localResources.localPartners.length === 0 ? [{
      gapType: "service-coverage",
      severity: request.need.urgency === "emergency" ? "high" : "moderate",
      statement: resolved.requestedType === "city"
        ? `No active partner record matched the supplied city fields for the ${request.need.category} need; this is not evidence of city-wide service absence.`
        : `No active partner record matched the requested ZIP scope for the ${request.need.category} need.`,
      nextAction: resolved.requestedType === "city"
        ? "Ask a local navigator to verify city-wide providers before treating this as a service gap."
        : "Ask a local navigator or partner network to verify providers before treating this as a service gap.",
    }] : []),
    ...(localResources.localPartners.some((partner) => partner.capacityStatus === "unknown") ? [{
      gapType: "capacity-freshness",
      severity: "high",
      statement: "At least one relevant local resource has unknown or non-live capacity.",
      nextAction: "Request a partner capacity update before making a referral.",
    }] : []),
    ...(liveResearch.status !== "researched-leads" && TEMPORAL_RESEARCH_CATEGORIES.has(request.need.category) ? [{
      gapType: "time-sensitive-verification",
      severity: "high",
      statement: "Current local heat/weather/emergency facility information was not verified by live research.",
      nextAction: "Use a human navigator or official local emergency/public-health source to confirm the current option.",
    }] : []),
    ...unavailableEngines.map((engine) => ({
      gapType: "intelligence-availability",
      severity: "moderate",
      statement: `${engine.engineId} did not return a usable fact for this place and need.`,
      nextAction: "Record the missing data source in MAP-GAP and do not infer a zero or no-need condition.",
    })),
  ];

  return {
    contract: "time-place-need/v1",
    requestedAt: time.requestedAt,
    place: {
      input: request.location,
      resolved: {
        zip: resolved.zip,
        displayName: resolved.displayName,
        state: resolved.stateAbbrev,
        countyFips: countyFips || null,
        countyName: geography.countyName || null,
        requestedType: resolved.requestedType,
        scopeDisclosure: resolved.requestedType === "city"
          ? "City input uses a representative ZCTA for Census context; partner matching is not evidence of city-wide coverage or absence."
          : "Partner matching is limited to the requested ZIP/place evidence and is not proof of live availability.",
        method: resolved.resolutionMethod,
      },
    },
    time,
    need: request.need,
    enginePlan: {
      requestedDomains: domains,
      executedEngineIds: ["chainweb-engine"],
      availableEngines,
      unavailableEngines,
      disclosure: "Need-driven domain selection is recorded for the pilot contract. The public route executes only the safe Chainweb evidence projection; deeper engines require an internal operator path.",
    },
    communityGapAnalysis: {
      gaps,
      mapGapAlignment: {
        observe: "Place, time, need, source-listed resources, partner records, and aggregate intelligence are captured together.",
        prioritize: "Urgency, service coverage, capacity freshness, and missing evidence are surfaced for human review.",
        execute: "The next action points to verification, navigator coordination, partner update, or evidence retrieval.",
        validate: "Referral acceptance and outcome status must be recorded separately from recommendation.",
        learn: "The response is structured for later MAP-GAP/CQI and Chainweb outcome comparison.",
      },
    },
    localResources,
    liveLocalResearch: liveResearch,
    outcomeSnapshot,
    chainwebOutcomeContext: orchestration.facts
      .filter((fact) => PUBLIC_ENGINE_IDS.has(fact.engineId))
      .map((fact) => ({
        engineId: fact.engineId,
        label: fact.engineLabel,
        sources: fact.sources,
        fetchedAt: fact.fetchedAt,
        data: fact.error ? null : {
          evidenceAvailable: Boolean(fact.data),
          evidenceType: "aggregate-evidence-library",
          geographyScope: geography.geographyLabel ? "place-context" : geography.countyName ? "county-context" : geography.state ? "state-context" : "national-context",
        },
        status: fact.error ? "unavailable" : "aggregate-context-only",
        disclosure: "Chainweb evidence informs prioritization and learning; it is not a resident-level outcome or a confirmed service result.",
      })),
    nextActions: gaps.length > 0
      ? gaps.slice(0, 5).map((gap) => gap.nextAction)
      : ["A relevant local resource record was found; confirm current hours, accessibility, eligibility, capacity, and referral acceptance with a human navigator."],
  };
}

export function registerTimePlaceNeedConductorRoutes(app: Express): void {
  app.post("/api/conductor/time-place-need", async (req: Request, res: Response) => {
    const retryAfter = allowRequest(clientIp(req));
    if (retryAfter != null) {
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ error: "Too many local intelligence requests", retryAfterSeconds: retryAfter });
    }
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid time-place-need request",
        details: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
      });
    }
    if (inFlightRequests >= MAX_IN_FLIGHT) {
      res.setHeader("Retry-After", "15");
      return res.status(429).json({ error: "Local intelligence is busy; retry shortly", retryAfterSeconds: 15 });
    }
    inFlightRequests += 1;
    try {
      const result = await buildTimePlaceNeedIntelligence(parsed.data);
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to build local intelligence";
      if (message.includes("Location must be") ||
        message.includes("Location could not be resolved") ||
        message.includes("ZIP is not recognized") ||
        message.includes("ZIP could not be verified")) {
        return res.status(400).json({ error: message });
      }
      console.error("[time-place-need] conductor failure:", error);
      return res.status(502).json({ error: "Local intelligence is temporarily unavailable; no recommendation was fabricated." });
    } finally {
      inFlightRequests = Math.max(0, inFlightRequests - 1);
    }
  });
}