/**
 * Gap 8 — Seed programGeography table.
 * Maps RPLICE program names to Central Texas county FIPS codes.
 * Also creates default entries for known CFIR program types.
 *
 * Run: npx tsx scripts/seed-program-geography.ts
 */

import { db } from "../server/storage";
import { programGeography, rpliceAssessments } from "../shared/schema";
import { eq } from "drizzle-orm";

// Central Texas FIPS reference
const TX_COUNTIES = [
  { fips: "48453", name: "Travis" },
  { fips: "48491", name: "Williamson" },
  { fips: "48209", name: "Hays" },
  { fips: "48021", name: "Bastrop" },
  { fips: "48055", name: "Caldwell" },
];

// Program types that serve the entire 5-county Austin metro
const REGIONAL_PROGRAMS = [
  "Workforce Development",
  "Reentry Services",
  "Family Support",
  "Youth Development",
  "Health Navigation",
  "Housing Stability",
  "Child Care",
  "Benefits Navigation",
  "Financial Literacy",
  "Substance Use Recovery",
  "Mental Health",
  "Community Health Worker",
  "Adult Education / GED",
  "Job Placement",
  "Peer Support",
];

// Programs specific to Travis County (urban core)
const TRAVIS_PROGRAMS = [
  "Austin ISD After-School",
  "Travis County Reentry",
  "Austin Housing Authority Programs",
  "CommUnity Care FQHCs",
  "Integral Care Services",
  "Austin Resource Recovery Jobs",
  "Capital Metro Workforce",
];

// Programs specific to Williamson County (suburban)
const WILCO_PROGRAMS = [
  "Round Rock ISD Programs",
  "Williamson County Crisis Center",
  "Georgetown Housing Authority",
  "Wilco Family Services",
];

async function seedGeography() {
  console.log("[seed-program-geography] Seeding program geography records...");
  let inserted = 0;
  let skipped = 0;

  // Seed regional programs across all 5 counties
  for (const programName of REGIONAL_PROGRAMS) {
    for (const county of TX_COUNTIES) {
      const existing = await db.select().from(programGeography)
        .where(eq(programGeography.programName, programName));
      const alreadyHasCounty = existing.some(r => r.countyFips === county.fips);

      if (alreadyHasCounty) {
        skipped++;
        continue;
      }

      await db.insert(programGeography).values({
        programName,
        countyFips: county.fips,
        countyName: county.name,
        stateFips: "48",
        serviceType: "primary",
        notes: "Auto-seeded: regional program serving all Central Texas counties",
      });
      inserted++;
    }
  }

  // Travis County specific programs
  for (const programName of TRAVIS_PROGRAMS) {
    const existing = await db.select().from(programGeography)
      .where(eq(programGeography.programName, programName));
    if (existing.length > 0) { skipped++; continue; }

    await db.insert(programGeography).values({
      programName,
      countyFips: "48453",
      countyName: "Travis",
      stateFips: "48",
      serviceType: "primary",
      notes: "Auto-seeded: Travis County-specific program",
    });
    inserted++;
  }

  // Williamson County specific programs
  for (const programName of WILCO_PROGRAMS) {
    const existing = await db.select().from(programGeography)
      .where(eq(programGeography.programName, programName));
    if (existing.length > 0) { skipped++; continue; }

    await db.insert(programGeography).values({
      programName,
      countyFips: "48491",
      countyName: "Williamson",
      stateFips: "48",
      serviceType: "primary",
      notes: "Auto-seeded: Williamson County-specific program",
    });
    inserted++;
  }

  // Map any existing rpliceAssessments to Travis County if not already mapped
  const assessments = await db.select().from(rpliceAssessments);
  for (const assessment of assessments) {
    const existing = await db.select().from(programGeography)
      .where(eq(programGeography.programName, assessment.programName));
    if (existing.length === 0) {
      await db.insert(programGeography).values({
        programName: assessment.programName,
        countyFips: "48453",
        countyName: "Travis",
        stateFips: "48",
        serviceType: "primary",
        notes: `Auto-seeded from RPLICE assessment id=${assessment.id}`,
      });
      inserted++;
      console.log(`  [map] ${assessment.programName} → Travis County`);
    }
  }

  console.log(`\n[seed-program-geography] Done: ${inserted} records inserted, ${skipped} skipped.`);
  process.exit(0);
}

seedGeography().catch(err => {
  console.error("[seed-program-geography] Fatal:", err);
  process.exit(1);
});
