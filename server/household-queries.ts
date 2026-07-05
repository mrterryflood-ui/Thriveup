import { db } from "./storage";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  households,
  householdMembers,
  householdMemberConsent,
  householdSdohSnapshots,
  householdOutcomes,
} from "../shared/household-schema";

export interface HouseholdProfile {
  household: typeof households.$inferSelect;
  members: (typeof householdMembers.$inferSelect)[];
  latestSdoh: (typeof householdSdohSnapshots.$inferSelect)[];
  latestOutcome: typeof householdOutcomes.$inferSelect | null;
  aggregates: {
    totalMembers: number;
    activeMembers: number;
    employedCount: number;
    activeLearners: number;
    avgBurdenScore: number;
    highestBurdenDomains: string[];
    combinedWagePerHour: number;
    credentialsEarned: number;
  };
  consentMap: Record<string, string>;
}

export async function getHouseholdProfile(
  householdId: string,
  requestingUserId?: string
): Promise<HouseholdProfile | null> {
  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId));

  if (!household) return null;

  const members = await db
    .select()
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        isNull(householdMembers.leftHouseholdAt)
      )
    );

  const latestSdoh = await db
    .select()
    .from(householdSdohSnapshots)
    .where(eq(householdSdohSnapshots.householdId, householdId))
    .orderBy(desc(householdSdohSnapshots.screeningDate))
    .limit(members.length * 2 + 2);

  const [latestOutcome] = await db
    .select()
    .from(householdOutcomes)
    .where(eq(householdOutcomes.householdId, householdId))
    .orderBy(desc(householdOutcomes.measuredAt))
    .limit(1);

  const consents = await db
    .select()
    .from(householdMemberConsent)
    .where(
      and(
        eq(householdMemberConsent.householdId, householdId),
        isNull(householdMemberConsent.revokedAt)
      )
    );

  const consentMap: Record<string, string> = {};
  for (const c of consents) {
    consentMap[`${c.memberId}:${c.domain}`] = c.consentLevel;
  }

  const activeMembers = members.filter((m) => m.status === "active");
  const employedCount = activeMembers.filter((m) => m.isEmployed).length;
  const totalWageCents = activeMembers.reduce((s, m) => s + (m.employmentWage ?? 0), 0);

  const memberIds = new Set(members.map((m) => m.id));
  const seenMembers = new Set<string>();
  const relevantSdoh = latestSdoh.filter((s) => {
    if (!memberIds.has(s.memberId) || seenMembers.has(s.memberId)) return false;
    seenMembers.add(s.memberId);
    return true;
  });

  const avgBurden =
    relevantSdoh.length > 0
      ? relevantSdoh.reduce((s, r) => s + (r.compositeBurdenScore ?? 0), 0) /
        relevantSdoh.length / 10
      : 0;

  const domainTotals: Record<string, number> = {
    housing: 0, food: 0, transportation: 0,
    childcare: 0, legal: 0, healthcare: 0, safety: 0,
  };
  for (const s of relevantSdoh) {
    domainTotals.housing += s.housingScore ?? 0;
    domainTotals.food += s.foodScore ?? 0;
    domainTotals.transportation += s.transportationScore ?? 0;
    domainTotals.childcare += s.childcareScore ?? 0;
    domainTotals.legal += s.legalScore ?? 0;
    domainTotals.healthcare += s.healthcareScore ?? 0;
    domainTotals.safety += s.safetyScore ?? 0;
  }
  const highestBurdenDomains = Object.entries(domainTotals)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k);

  return {
    household,
    members,
    latestSdoh: relevantSdoh,
    latestOutcome: latestOutcome ?? null,
    aggregates: {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      employedCount,
      activeLearners: latestOutcome?.activeLearnersCount ?? 0,
      avgBurdenScore: Math.round(avgBurden * 10) / 10,
      highestBurdenDomains,
      combinedWagePerHour: totalWageCents / 100,
      credentialsEarned: latestOutcome?.credentialsEarnedCount ?? 0,
    },
    consentMap,
  };
}

export async function findOrCreateHousehold(
  userId: string,
  memberName: string,
  options?: { zipCode?: string; countyFips?: string; censusTract?: string }
): Promise<{ householdId: string; memberId: string; isNew: boolean }> {
  const [existing] = await db
    .select({ householdId: householdMembers.householdId, memberId: householdMembers.id })
    .from(householdMembers)
    .where(and(eq(householdMembers.userId, userId), isNull(householdMembers.leftHouseholdAt)));

  if (existing) return { ...existing, isNew: false };

  const zip = options?.zipCode ?? "00000";
  const rand = Math.floor(Math.random() * 9000) + 1000;
  const householdCode = `HH-${zip}-${rand}`;

  const [newHousehold] = await db
    .insert(households)
    .values({ householdCode, zipCode: options?.zipCode, countyFips: options?.countyFips, censustract: options?.censusTract })
    .returning();

  const [newMember] = await db
    .insert(householdMembers)
    .values({ householdId: newHousehold.id, userId, memberName, role: "primary", status: "active" })
    .returning();

  await db.insert(householdMemberConsent).values([
    { householdId: newHousehold.id, memberId: newMember.id, domain: "employment", consentLevel: "household", consentedBy: userId },
    { householdId: newHousehold.id, memberId: newMember.id, domain: "education", consentLevel: "household", consentedBy: userId },
  ]);

  return { householdId: newHousehold.id, memberId: newMember.id, isNew: true };
}

export async function snapshotHouseholdOutcomes(householdId: string): Promise<void> {
  const profile = await getHouseholdProfile(householdId);
  if (!profile) return;

  const { aggregates, members } = profile;
  const reentryHousehold = members.some(
    (m) => m.notes?.toLowerCase().includes("reentry") || m.status === "incarcerated"
  );

  await db.insert(householdOutcomes).values({
    householdId,
    employedMemberCount: aggregates.employedCount,
    totalHouseholdWageCents: Math.round(aggregates.combinedWagePerHour * 100),
    activeLearnersCount: aggregates.activeLearners,
    credentialsEarnedCount: aggregates.credentialsEarned,
    householdBurdenScore: Math.round(aggregates.avgBurdenScore * 10),
    reentryHousehold,
    source: "system_snapshot",
  });
}
