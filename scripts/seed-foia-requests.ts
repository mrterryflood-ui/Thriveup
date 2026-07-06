/**
 * Pre-populate the four housing court FOIA requests — Travis, Williamson, Hays, Bastrop.
 * Each is ready to submit with one click from /foia-tracker.
 *
 * Run: npx tsx scripts/seed-foia-requests.ts
 */

import { db } from "../server/storage";
import { foiaRequests } from "../shared/justice-schema";
import { eq } from "drizzle-orm";

const YEAR = new Date().getFullYear() - 1; // Request prior year data

const EVICTION_TEMPLATE = (county: string) =>
  `Aggregate data on all eviction (forcible detainer) case filings in ${county} County for the period January 1, ${YEAR} through December 31, ${YEAR}, including: (1) total number of cases filed, (2) disposition outcomes (judgment for plaintiff, judgment for defendant, dismissed, default), (3) cases by ZIP code or census tract where available, (4) demographic data if collected, and (5) cases involving government-subsidized housing (Section 8, public housing). Additionally, please include the top 25 plaintiffs (landlords or property management companies) by number of filings during calendar year ${YEAR}, including the name of the plaintiff and total number of filings.`;

const RECIDIVISM_TEMPLATE = `
Aggregate county-level data on probation and parole revocations in Travis County for calendar years ${YEAR - 1}–${YEAR}, including: (1) total number of individuals under supervision, (2) number and percentage of revocations by type (technical vs. new offense), (3) revocation outcomes (reincarcerated, continued supervision, other), (4) breakdown by race/ethnicity and age group where available, and (5) any available data on housing status at time of revocation.
`.trim();

const REQUESTS = [
  {
    agency: "travis_county_clerk" as const,
    agencyName: "Travis County District Clerk",
    agencyEmail: "districtclerk@traviscountytx.gov",
    agencyAddress: "P.O. Box 679003, Austin, TX 78767",
    requestedRecords: EVICTION_TEMPLATE("Travis"),
    purposeStatement: "Community health equity research on housing instability and displacement patterns in Central Texas. The Collaborative Advocate Foundation (TCAF), EIN 41-3618003, is a 501(c)(3) nonprofit conducting this analysis for public benefit.",
    notes: "Priority request — Travis County is the primary service area. Submit immediately on receipt.",
  },
  {
    agency: "williamson_county_clerk" as const,
    agencyName: "Williamson County District Clerk",
    agencyEmail: "districtclerk@wilco.org",
    agencyAddress: "405 Martin Luther King St, Georgetown, TX 78626",
    requestedRecords: EVICTION_TEMPLATE("Williamson"),
    purposeStatement: "Housing equity research to identify displacement patterns affecting TCAF service participants in the Williamson County portion of the Austin-Round Rock metro area.",
    notes: "Second priority — large and growing service area. Fax backup: 512-943-1358.",
  },
  {
    agency: "hays_county_clerk" as const,
    agencyName: "Hays County District Clerk",
    agencyEmail: "districtclerk@hayscountytx.com",
    agencyAddress: "712 S. Stagecoach Trail, Suite 2057, San Marcos, TX 78666",
    requestedRecords: EVICTION_TEMPLATE("Hays"),
    purposeStatement: "Housing equity research covering the southern Austin metro area. Data will be used in aggregate community health analysis.",
    notes: "Third priority — San Marcos and Kyle service corridors.",
  },
  {
    agency: "bastrop_county_clerk" as const,
    agencyName: "Bastrop County District Clerk",
    agencyEmail: "districtclerk@co.bastrop.tx.us",
    agencyAddress: "804 Pecan Street, Bastrop, TX 78602",
    requestedRecords: EVICTION_TEMPLATE("Bastrop"),
    purposeStatement: "Housing equity research for rural communities in the greater Austin region. TCAF serves participants in the Bastrop County corridor.",
    notes: "Fourth priority — rural equity component of regional analysis.",
  },
  {
    agency: "texas_hhsc" as const,
    agencyName: "Texas Health and Human Services Commission",
    agencyEmail: "publicinformation@hhs.texas.gov",
    agencyAddress: "4900 N. Lamar Blvd., Austin, TX 78751",
    requestedRecords: `County-level data for Travis, Williamson, Hays, and Bastrop counties for calendar years ${YEAR - 1}–${YEAR}: (1) Medicaid and CHIP enrollment and disenrollment counts by county and age group, (2) SNAP participation rates vs. estimated eligible population, (3) Temporary Assistance for Needy Families (TANF) caseload and case closure reasons, (4) Child Protective Services (CPS) Preventive Services program enrollment and completion rates, (5) Any available data on benefits access barriers by geographic subregion.`,
    purposeStatement: "Community health and social determinants of health research to identify gaps between benefit eligibility and enrollment across Central Texas counties. TCAF, EIN 41-3618003.",
    notes: "Online portal available at hhs.texas.gov/about-hhs/records-statistics/public-information-requests — submit both by email and portal for tracking.",
  },
  {
    agency: "texas_doc" as const,
    agencyName: "Texas Department of Criminal Justice",
    agencyEmail: "open.records@tdcj.texas.gov",
    agencyAddress: "P.O. Box 99, Huntsville, TX 77342",
    requestedRecords: RECIDIVISM_TEMPLATE,
    purposeStatement: "Justice reinvestment research to identify supervision and reentry intervention points that reduce recidivism in Central Texas. TCAF, EIN 41-3618003, administers RNR-based reentry programming for Travis County.",
    notes: "Online portal: tdcj.texas.gov/divisions/cmhc/open_records.html — file via portal AND email. TDCJ responds promptly to organizational requests with stated public benefit.",
  },
];

async function seedFoiaRequests() {
  console.log(`[seed-foia] Seeding ${REQUESTS.length} FOIA requests...`);
  let inserted = 0;
  let skipped = 0;

  for (const req of REQUESTS) {
    const existing = await db.select().from(foiaRequests)
      .where(eq(foiaRequests.agency, req.agency));

    if (existing.length > 0) {
      console.log(`  [skip] ${req.agencyName} — already exists (status: ${existing[0].status})`);
      skipped++;
      continue;
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10); // Texas PIA: 10 business days

    await db.insert(foiaRequests).values({
      agency: req.agency,
      agencyName: req.agencyName,
      agencyEmail: req.agencyEmail,
      agencyAddress: req.agencyAddress,
      requestedRecords: req.requestedRecords,
      purposeStatement: req.purposeStatement,
      status: "draft",
      responseDeadline: deadline,
      submittedBy: "TCAF Staff",
      notes: req.notes,
    });

    console.log(`  [insert] ${req.agencyName}`);
    inserted++;
  }

  console.log(`\n[seed-foia] Done: ${inserted} requests created, ${skipped} skipped.`);
  console.log(`[seed-foia] Visit /foia-tracker to review and submit all requests.`);
  process.exit(0);
}

seedFoiaRequests().catch(err => {
  console.error("[seed-foia] Fatal:", err);
  process.exit(1);
});
