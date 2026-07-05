import { db } from "./storage";
import { eq, and, isNull } from "drizzle-orm";
import { participantProfiles, employerPartners, jobPostings } from "../shared/schema";
import { findOrCreateHousehold } from "./household-queries";
import { computeEligibility } from "./benefits-screener-fix";
import { scoreRiskNeeds } from "./workforce-match";

export { scoreRiskNeeds };

export async function matchFairChanceEmployers(): Promise<
  Array<{
    employer: typeof employerPartners.$inferSelect;
    openPostings: typeof jobPostings.$inferSelect[];
  }>
> {
  const employers = await db
    .select()
    .from(employerPartners)
    .where(
      and(
        eq(employerPartners.banTheBox, true),
        eq(employerPartners.partnershipStatus, "active")
      )
    );

  const results = await Promise.all(
    employers.map(async (employer) => {
      const openPostings = await db
        .select()
        .from(jobPostings)
        .where(
          and(
            eq(jobPostings.employerId, employer.id),
            eq(jobPostings.status, "open"),
            eq(jobPostings.barrierFriendly, true)
          )
        );
      return { employer, openPostings };
    })
  );

  return results.filter((r) => r.openPostings.length > 0);
}

export async function createParticipantEnhanced(
  participantData: typeof participantProfiles.$inferInsert,
  options: {
    riskAnswers?: Record<string, boolean>;
    zipCode?: string;
    countyFips?: string;
  } = {}
): Promise<{
  profile: typeof participantProfiles.$inferSelect;
  householdId: string;
  benefitsScreening: ReturnType<typeof computeEligibility> | null;
  employerMatches: Awaited<ReturnType<typeof matchFairChanceEmployers>>;
  riskScreen: ReturnType<typeof scoreRiskNeeds> | null;
}> {
  const [profile] = await db
    .insert(participantProfiles)
    .values(participantData)
    .returning();

  const userId = profile.userId ?? profile.id;

  const [householdResult, benefitsResult, employerResult, riskResult] =
    await Promise.allSettled([
      (async () => {
        const { householdId } = await findOrCreateHousehold(
          userId,
          profile.firstName + " " + profile.lastName,
          {
            zipCode: options.zipCode ?? profile.zipCode ?? undefined,
            countyFips: options.countyFips ?? "48453",
          }
        );
        await db
          .update(participantProfiles)
          .set({ householdId })
          .where(eq(participantProfiles.id, profile.id));
        return householdId;
      })(),

      (async () => {
        return computeEligibility({
          annualIncome: 0,
          householdSize: 1 + (profile.dependents ?? 0),
          hasChildren: (profile.dependents ?? 0) > 0,
          isVeteran: profile.veteranStatus ?? false,
          currentBenefits: [],
        });
      })(),

      matchFairChanceEmployers(),

      (async () => {
        if (!options.riskAnswers) return null;
        const result = scoreRiskNeeds(options.riskAnswers);
        await db
          .update(participantProfiles)
          .set({
            riskScore: result.score,
            riskLevel: result.riskLevel,
            riskDomains: result.flaggedDomains as any,
          })
          .where(eq(participantProfiles.id, profile.id));
        return result;
      })(),
    ]);

  return {
    profile,
    householdId:
      householdResult.status === "fulfilled" ? householdResult.value : "unlinked",
    benefitsScreening:
      benefitsResult.status === "fulfilled" ? benefitsResult.value : null,
    employerMatches:
      employerResult.status === "fulfilled" ? employerResult.value : [],
    riskScreen:
      riskResult.status === "fulfilled" ? riskResult.value : null,
  };
}
