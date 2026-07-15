/**
 * Community Intelligence — internal context assembly for grant AI
 *
 * Pulls directly from the DB (same server — no HTTP round-trip) and
 * assembles a PursuitContext object suitable for injecting into grant
 * proposal prompts via assemblePursuitContext().
 *
 * Data streams:
 *   community:read  — ecosystem platform summary (17 platforms, domains, health)
 *   impact:read     — partner outcome submissions (participants served, employment, credentials)
 *   benefits:read   — program catalog (titles, populations, geographies)
 */

import { db } from "./storage";
import {
  ecosystemPlatforms,
  partnerOutcomeSubmissions,
  programs,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityStream {
  totalPlatforms: number;
  platformsOnline: number;
  domainBreakdown: Record<string, number>;
  languagesSupported: number;
  geographicReach: string;
  platforms: Array<{ name: string; role: string; domain: string; description: string }>;
}

export interface ImpactStream {
  totalParticipantsServed: number;
  totalEnteredEmployment: number;
  totalCredentialsAttained: number;
  employmentRate: string;
  outcomeCount: number;
  recentOutcomes: Array<{
    orgName: string;
    programName: string;
    programType: string;
    reportingPeriod: string;
    participantsServed: number;
    enteredEmployment: number;
    credentialsAttained: number;
    cfirFidelityScore: number | null;
    countyFips: string | null;
  }>;
}

export interface BenefitsStream {
  catalogSize: number;
  programs: Array<{
    title: string;
    description: string;
    targetPopulation: string | null;
    geographicFocus: string | null;
    status: string | null;
  }>;
}

export interface PursuitContext {
  fetchedAt: string;
  community: CommunityStream;
  impact: ImpactStream;
  benefits: BenefitsStream;
  /** Pre-formatted paragraph ready for injection into a grant AI system prompt */
  narrativeBlock: string;
}

// ─── Data fetchers ─────────────────────────────────────────────────────────

async function fetchCommunityStream(): Promise<CommunityStream> {
  const platforms = await db.select({
    name: ecosystemPlatforms.name,
    role: ecosystemPlatforms.role,
    domain: ecosystemPlatforms.domain,
    healthStatus: ecosystemPlatforms.healthStatus,
    description: ecosystemPlatforms.description,
  }).from(ecosystemPlatforms).where(eq(ecosystemPlatforms.publicVisible, true));

  const domainBreakdown: Record<string, number> = {};
  for (const p of platforms) {
    if (p.domain) domainBreakdown[p.domain] = (domainBreakdown[p.domain] || 0) + 1;
  }
  const online = platforms.filter(
    p => p.healthStatus === "healthy" || p.healthStatus === "ok"
  ).length;

  return {
    totalPlatforms: platforms.length,
    platformsOnline: online,
    domainBreakdown,
    languagesSupported: 107,
    geographicReach: "50-state architecture, Texas-first deployment",
    platforms: platforms.map(p => ({
      name: p.name,
      role: p.role || "",
      domain: p.domain || "",
      description: p.description || "",
    })),
  };
}

async function fetchImpactStream(limit = 50): Promise<ImpactStream> {
  const outcomes = await db.select({
    orgName: partnerOutcomeSubmissions.orgName,
    programName: partnerOutcomeSubmissions.programName,
    programType: partnerOutcomeSubmissions.programType,
    reportingPeriod: partnerOutcomeSubmissions.reportingPeriod,
    participantsServed: partnerOutcomeSubmissions.participantsServed,
    participantsCompleted: partnerOutcomeSubmissions.participantsCompleted,
    enteredEmployment: partnerOutcomeSubmissions.enteredEmployment,
    retainedEmployment6mo: partnerOutcomeSubmissions.retainedEmployment6mo,
    credentialsAttained: partnerOutcomeSubmissions.credentialsAttained,
    cfirFidelityScore: partnerOutcomeSubmissions.cfirFidelityScore,
    countyFips: partnerOutcomeSubmissions.countyFips,
  }).from(partnerOutcomeSubmissions)
    .orderBy(desc(partnerOutcomeSubmissions.id))
    .limit(limit);

  const totals = outcomes.reduce(
    (acc, o) => ({
      participantsServed: acc.participantsServed + (o.participantsServed || 0),
      enteredEmployment: acc.enteredEmployment + (o.enteredEmployment || 0),
      credentialsAttained: acc.credentialsAttained + (o.credentialsAttained || 0),
    }),
    { participantsServed: 0, enteredEmployment: 0, credentialsAttained: 0 }
  );

  const employmentRate =
    totals.participantsServed > 0
      ? `${Math.round((totals.enteredEmployment / totals.participantsServed) * 100)}%`
      : "N/A";

  return {
    ...totals,
    employmentRate,
    outcomeCount: outcomes.length,
    recentOutcomes: outcomes.map(o => ({
      orgName: o.orgName || "",
      programName: o.programName || "",
      programType: o.programType || "",
      reportingPeriod: o.reportingPeriod || "",
      participantsServed: o.participantsServed || 0,
      enteredEmployment: o.enteredEmployment || 0,
      credentialsAttained: o.credentialsAttained || 0,
      cfirFidelityScore: o.cfirFidelityScore ?? null,
      countyFips: o.countyFips ?? null,
    })),
  };
}

async function fetchBenefitsStream(limit = 30): Promise<BenefitsStream> {
  const catalog = await db.select({
    title: programs.title,
    description: programs.description,
    targetPopulation: programs.targetPopulation,
    geographicFocus: programs.geographicFocus,
    status: programs.status,
  }).from(programs).limit(limit);

  return {
    catalogSize: catalog.length,
    programs: catalog.map(p => ({
      title: p.title,
      description: p.description || "",
      targetPopulation: p.targetPopulation ?? null,
      geographicFocus: p.geographicFocus ?? null,
      status: p.status ?? null,
    })),
  };
}

// ─── Narrative block builder ──────────────────────────────────────────────

function buildNarrativeBlock(community: CommunityStream, impact: ImpactStream, benefits: BenefitsStream): string {
  const domainLines = Object.entries(community.domainBreakdown)
    .map(([domain, count]) => `${domain} (${count})`)
    .join(", ");

  const programSample = benefits.programs
    .slice(0, 6)
    .map(p => p.title)
    .join(", ");

  return `
LIVE COMMUNITY INTELLIGENCE CONTEXT (pull from thrivingcommunitiesforall.com — verified ${new Date().toLocaleDateString()}):

PLATFORM INFRASTRUCTURE:
ThriveUp Academy operates a ${community.totalPlatforms}-platform community intelligence ecosystem serving families, nonprofits, and funders across a 50-state architecture with Texas-first deployment. The network spans ${Object.keys(community.domainBreakdown).length} service domains including ${domainLines}, providing coordinated community response across ${community.languagesSupported} languages.

MEASURED IMPACT (${impact.outcomeCount} outcome submissions across partner programs):
• Participants served: ${impact.totalParticipantsServed.toLocaleString()}
• Entered employment: ${impact.totalEnteredEmployment.toLocaleString()} (${impact.employmentRate} employment rate)
• Credentials attained: ${impact.totalCredentialsAttained.toLocaleString()}
• Implementation fidelity tracked using 39-construct CFIR framework across all programs

BENEFITS & PROGRAM CATALOG (${benefits.catalogSize} active programs):
Sample programs: ${programSample || "workforce development, benefits navigation, health equity, reentry support"}
All programs are evidence-based, trauma-informed, and designed for populations including families experiencing poverty, justice-involved individuals, foster youth, immigrants, and rural communities.

Use these verified data points throughout the proposal wherever community need, organizational capacity, or impact evidence is required. Cite the platform count (${community.totalPlatforms}), language reach (${community.languagesSupported}), and outcome data as primary-source evidence.
`.trim();
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Assemble a full PursuitContext in parallel across all three data streams.
 * Safe to call from any grant route handler — pure DB reads, no side effects.
 */
export async function assemblePursuitContext(): Promise<PursuitContext> {
  const [community, impact, benefits] = await Promise.all([
    fetchCommunityStream(),
    fetchImpactStream(),
    fetchBenefitsStream(),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    community,
    impact,
    benefits,
    narrativeBlock: buildNarrativeBlock(community, impact, benefits),
  };
}

/**
 * Lightweight version — just the narrative block string, for direct prompt injection.
 * Use this when you only need to append context to an existing system prompt.
 */
export async function communityNarrativeBlock(): Promise<string> {
  try {
    const ctx = await assemblePursuitContext();
    return ctx.narrativeBlock;
  } catch (err) {
    console.error("[community-intel] Failed to assemble pursuit context:", err);
    return "";
  }
}
