import type { GrantOpportunity } from "@shared/schema";

type FundingRecord = Pick<GrantOpportunity,
  "id" | "title" | "agency" | "description" | "eligibilityCriteria" |
  "fundingAmount" | "deadline" | "source" | "sourceUrl" |
  "verificationStatus" | "lastVerifiedAt"
>;

export function safeFundingUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function presentFundingCandidate(record: FundingRecord, stateName: string, now: Date) {
  const sourceUrl = safeFundingUrl(record.sourceUrl);
  if (!sourceUrl || !record.deadline || record.deadline <= now) return null;
  const text = `${record.description ?? ""} ${record.eligibilityCriteria ?? ""}`;
  const escapedState = stateName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stateMentioned = new RegExp(`\\b${escapedState}\\b`, "i").test(text);
  const nationalMentioned = /\bnationwide\b|\ball (?:50 |fifty )?states\b/i.test(text);
  // A grant with unknown geography is not a lead for a requested state.
  // A negative mention is not positive location evidence.
  const excludesState = new RegExp(`\\b(?:except|excluding|excludes|not available in|not eligible in)\\s+${escapedState}\\b`, "i").test(text);
  if ((!stateMentioned && !nationalMentioned) || excludesState) return null;
  return {
    id: record.id,
    title: record.title,
    agency: record.agency,
    description: record.description?.slice(0, 800) ?? null,
    eligibilityCriteria: record.eligibilityCriteria?.slice(0, 800) ?? null,
    fundingAmount: record.fundingAmount,
    deadline: record.deadline.toISOString(),
    source: record.source,
    sourceUrl,
    verificationStatus: record.verificationStatus,
    lastVerifiedAt: record.lastVerifiedAt?.toISOString() ?? null,
    geographyEvidence: stateMentioned ? "state mentioned in listing" : nationalMentioned ? "national scope mentioned in listing" : "not established",
    nonprofitEligibility: /\bnon.?profit\b|501\s*\(c\)\s*\(3\)/i.test(record.eligibilityCriteria ?? "")
      ? "nonprofit mentioned in eligibility text"
      : "not established",
    availability: "candidate — verify current status, geography, and eligibility with the funder",
  };
}