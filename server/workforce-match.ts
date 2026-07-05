import { db } from "./storage";
import { eq, and } from "drizzle-orm";
import { employerPartners, jobPostings, certificates } from "../shared/schema";

export interface RiskScreenResult {
  score: number;
  riskLevel: "low" | "medium" | "high";
  flaggedDomains: string[];
  recommendFullAssessment: boolean;
}

export function scoreRiskNeeds(answers: Record<string, boolean>): RiskScreenResult {
  const domains: Record<string, boolean> = {
    "Prior felony convictions (2+)": answers.priorFelonies ?? false,
    "Prior probation/parole violations": answers.priorViolations ?? false,
    "Unstable housing at release": answers.unstableHousing ?? false,
    "Unemployed at time of offense": answers.unemployedAtOffense ?? false,
    "Less than HS diploma/GED": answers.noHsDiploma ?? false,
    "History of substance use": answers.substanceHistory ?? false,
    "Family/social network with criminal history": answers.antisocialNetwork ?? false,
    "Self-reported mental health needs": answers.mentalHealthNeeds ?? false,
  };

  const flaggedDomains = Object.entries(domains)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const score = flaggedDomains.length * 2;
  const riskLevel = score >= 10 ? "high" : score >= 6 ? "medium" : "low";

  return {
    score,
    riskLevel,
    flaggedDomains,
    recommendFullAssessment: score >= 6,
  };
}

export async function getEmployerMatches(userId: string): Promise<{
  userId: string;
  credentialsEarned: string[];
  fairChanceMatches: Array<{
    employer: typeof employerPartners.$inferSelect;
    matchReason: string[];
    openPostings: typeof jobPostings.$inferSelect[];
  }>;
  allFairChanceJobs: typeof jobPostings.$inferSelect[];
}> {
  const earnedCerts = await db
    .select({ levelTitle: certificates.levelTitle })
    .from(certificates)
    .where(eq(certificates.userId, userId));

  const credentialNames = earnedCerts.map((c) =>
    c.levelTitle.toLowerCase().replace(/trade certification/gi, "").trim()
  );

  const fairChanceEmployers = await db
    .select()
    .from(employerPartners)
    .where(
      and(
        eq(employerPartners.banTheBox, true),
        eq(employerPartners.partnershipStatus, "active")
      )
    );

  const matches = await Promise.all(
    fairChanceEmployers.map(async (employer) => {
      const postings = await db
        .select()
        .from(jobPostings)
        .where(
          and(
            eq(jobPostings.employerId, employer.id),
            eq(jobPostings.status, "open")
          )
        );

      const matchReason: string[] = [];
      if (employer.banTheBox) matchReason.push("Ban-the-box employer");
      if (employer.fairChanceHiring) matchReason.push("Fair-chance hiring policy");
      if (employer.barrierFriendly) matchReason.push("Barrier-friendly workplace");

      for (const posting of postings) {
        for (const cred of credentialNames) {
          if (
            posting.title.toLowerCase().includes(cred) ||
            (posting.requirements ?? "").toLowerCase().includes(cred)
          ) {
            matchReason.push(`Matches your ${cred} certification`);
            break;
          }
        }
      }

      return {
        employer,
        matchReason: [...new Set(matchReason)],
        openPostings: postings.filter((p) => p.status === "open"),
      };
    })
  );

  const allFairChanceJobs = await db
    .select()
    .from(jobPostings)
    .where(
      and(
        eq(jobPostings.status, "open"),
        eq(jobPostings.barrierFriendly, true)
      )
    );

  return {
    userId,
    credentialsEarned: credentialNames,
    fairChanceMatches: matches.filter((m) => m.openPostings.length > 0),
    allFairChanceJobs,
  };
}
