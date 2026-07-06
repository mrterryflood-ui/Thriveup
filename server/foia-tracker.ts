import { db } from "./storage";
import { foiaRequests, foiaResponses, justiceIndicators } from "../shared/justice-schema";
import { eq } from "drizzle-orm";

export const COUNTY_CLERK_CONTACTS: Record<string, {
  agencyName: string;
  email: string;
  address: string;
  responseDays: number;
  notes: string;
}> = {
  travis_county_clerk: {
    agencyName: "Travis County District Clerk",
    email: "districtclerk@traviscountytx.gov",
    address: "P.O. Box 679003, Austin, TX 78767",
    responseDays: 10,
    notes: "Online portal: www.traviscountytx.gov/district-clerk",
  },
  williamson_county_clerk: {
    agencyName: "Williamson County District Clerk",
    email: "districtclerk@wilco.org",
    address: "405 Martin Luther King St, Georgetown, TX 78626",
    responseDays: 10,
    notes: "Fax: 512-943-1358",
  },
  hays_county_clerk: {
    agencyName: "Hays County District Clerk",
    email: "districtclerk@hayscountytx.com",
    address: "712 S. Stagecoach Trail, Suite 2057, San Marcos, TX 78666",
    responseDays: 10,
    notes: "",
  },
  bastrop_county_clerk: {
    agencyName: "Bastrop County District Clerk",
    email: "districtclerk@co.bastrop.tx.us",
    address: "804 Pecan Street, Bastrop, TX 78602",
    responseDays: 10,
    notes: "",
  },
  texas_hhsc: {
    agencyName: "Texas Health and Human Services Commission",
    email: "publicinformation@hhs.texas.gov",
    address: "4900 N. Lamar Blvd., Austin, TX 78751",
    responseDays: 10,
    notes: "Online portal: hhs.texas.gov/about-hhs/records-statistics/public-information-requests",
  },
  texas_doc: {
    agencyName: "Texas Department of Criminal Justice",
    email: "open.records@tdcj.texas.gov",
    address: "P.O. Box 99, Huntsville, TX 77342",
    responseDays: 10,
    notes: "Online portal: tdcj.texas.gov/divisions/cmhc/open_records.html",
  },
};

export const HOUSING_COURT_REQUESTS: Record<string, string> = {
  eviction_filings: `Aggregate data on all eviction (forcible detainer) case filings in [COUNTY] for the period January 1, [YEAR] through December 31, [YEAR], including: (1) total number of cases filed, (2) disposition outcomes (judgment for plaintiff, judgment for defendant, dismissed, default), (3) cases by ZIP code or census tract where available, (4) demographic data if collected, and (5) cases involving government-subsidized housing (Section 8, public housing).`,
  housing_court_dispositions: `All records relating to eviction case dispositions in [COUNTY] Justice of the Peace courts for calendar year [YEAR], including case number, filing date, disposition date, disposition type, and ZIP code of the subject property (personal identifiers redacted).`,
  landlord_repeat_filers: `A list of the top 25 plaintiffs (landlords or property management companies) by number of eviction cases filed in [COUNTY] during calendar year [YEAR], including the name of the plaintiff and total number of filings.`,
};

export function generateFoiaLetter(params: {
  agency: string;
  requestedRecords: string;
  requestDate?: Date;
  requesterName?: string;
  requesterOrg?: string;
  requesterEmail?: string;
}): string {
  const contact = COUNTY_CLERK_CONTACTS[params.agency];
  const date = (params.requestDate ?? new Date()).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const requester = params.requesterName ?? "Dr. Terry D. Flood";
  const org = params.requesterOrg ?? "The Collaborative Advocate Foundation (TCAF), EIN 41-3618003";
  const email = params.requesterEmail ?? "terryflood@thrivingcommunitiesforall.com";
  const agencyName = contact?.agencyName ?? params.agency;
  const agencyAddress = contact?.address ?? "";

  return `${date}

${agencyName}
${agencyAddress}

RE: Texas Public Information Act Request — ${params.requestedRecords.substring(0, 80)}

Dear Public Information Officer:

Pursuant to the Texas Public Information Act (Tex. Gov't Code § 552.001 et seq.), I hereby request access to and copies of the following public records:

${params.requestedRecords}

This request is submitted on behalf of ${org}, a Texas 501(c)(3) nonprofit organization conducting community health equity research in Central Texas. The requested information will be used solely for research, analysis, and public benefit purposes, and will not be used for commercial gain.

Under Tex. Gov't Code § 552.228, I request that any charges for providing this information be waived on the grounds that providing the information is in the public interest because it is likely to contribute significantly to public understanding of government operations and does not primarily serve the commercial interest of the requestor.

Pursuant to Tex. Gov't Code § 552.228, please respond within ten (10) business days of receipt of this request. If any portion of the requested records is believed to be confidential or exempt from disclosure, please provide a written statement identifying the specific exception claimed and the information withheld, so that I may seek a ruling from the Office of the Attorney General if necessary.

Please direct your response to:

${requester}
${org}
Email: ${email}

Thank you for your attention to this request.

Respectfully submitted,

${requester}
${org}
${email}

---
This request was generated by ThriveUp Academy's FOIA Tracking System.
Reference: TCAF-FOIA-${Date.now()}
`;
}

export async function ingestFoiaResponse(
  foiaResponseId: string,
  parsedRecords: Array<{
    dataType: "housing_court_filing" | "eviction_filing" | "court_disposition";
    geography: string;
    countyFips: string;
    reportingYear: number;
    value: number;
    unit: string;
    demographicGroup?: string;
    notes?: string;
  }>
): Promise<number> {
  let ingested = 0;
  await db.update(foiaResponses)
    .set({ dataIngested: true, ingestedAt: new Date() })
    .where(eq(foiaResponses.id, foiaResponseId));
  for (const record of parsedRecords) {
    try {
      await db.insert(justiceIndicators).values({
        dataType: record.dataType,
        geography: record.geography,
        countyFips: record.countyFips,
        reportingYear: record.reportingYear,
        value: record.value,
        unit: record.unit,
        demographicGroup: record.demographicGroup,
        dataSource: `FOIA_${foiaResponseId}`,
        foiaRequestId: foiaResponseId,
        notes: record.notes,
      }).onConflictDoNothing();
      ingested++;
    } catch (err) {
      console.error("[foia-tracker] Ingest row error:", err);
    }
  }
  return ingested;
}
