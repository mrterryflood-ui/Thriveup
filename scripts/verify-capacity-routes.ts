#!/usr/bin/env tsx
/**
 * Capacity registry smoke tests.
 * Exercises the public GET endpoint and the upsert logic:
 *   - open / waitlist / closed status round-trips
 *   - stale records (>14 days) are excluded from the public feed
 *   - ZIP restriction: orgs with serviceZips set are excluded when ZIP doesn't match
 *   - general-record fallback: shown only when serviceZips is null/empty
 *   - summary counts only fresh rows, including more than 200 rows
 *
 * Run standalone:  npx tsx scripts/verify-capacity-routes.ts
 */

import { db } from "../server/storage";
import { orgCapacity } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";
const CROWD_ORG_IDS = Array.from({ length: 100 }, (_, index) =>
  `test_cap_crowd_${String(index).padStart(3, "0")}`,
);
const SUMMARY_CROWD_ORG_IDS = Array.from({ length: 205 }, (_, index) =>
  `test_cap_summary_${String(index).padStart(3, "0")}`,
);
const TEST_ORG_IDS = [
  "test_cap_001",
  "test_cap_002",
  "test_cap_003",
  "test_cap_004",
  "test_cap_summary_stale",
  ...CROWD_ORG_IDS,
  ...SUMMARY_CROWD_ORG_IDS,
];

async function request(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — GET ${path}`);
  return res.json() as Promise<any>;
}

async function seedRow(opts: {
  orgId: string;
  orgName: string;
  programCode: string;
  status: "open" | "waitlist" | "closed";
  waitWeeks?: number;
  serviceZips?: string[];
  ageOffset?: number; // days in the past for updatedAt
}) {
  const updatedAt = new Date(Date.now() - (opts.ageOffset ?? 0) * 24 * 60 * 60 * 1000);
  await db
    .insert(orgCapacity)
    .values({
      orgId: opts.orgId,
      orgName: opts.orgName,
      programCode: opts.programCode,
      status: opts.status,
      waitWeeks: opts.waitWeeks ?? null,
      serviceZips: opts.serviceZips ?? null,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: [orgCapacity.orgId, orgCapacity.programCode],
      set: { status: opts.status, waitWeeks: opts.waitWeeks ?? null, serviceZips: opts.serviceZips ?? null, updatedAt },
    });
}

async function cleanup() {
  await db.delete(orgCapacity).where(inArray(orgCapacity.orgId, TEST_ORG_IDS)).catch(() => {});
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    failed++;
  }
}

async function run() {
  await cleanup();

  // Seed test rows
  await seedRow({ orgId: "test_cap_001", orgName: "Open Org",     programCode: "SNAP",    status: "open"     });
  await seedRow({ orgId: "test_cap_001", orgName: "Open Org",     programCode: "Medicaid", status: "waitlist", waitWeeks: 3 });
  await seedRow({ orgId: "test_cap_002", orgName: "Closed Org",   programCode: "WIC",     status: "closed"   });
  // Stale row — older than 14 days, should not appear in public feed
  await seedRow({ orgId: "test_cap_002", orgName: "Stale Org",    programCode: "SNAP",    status: "open", ageOffset: 15 });
  // ZIP-scoped general org (serves 78660 only)
  await seedRow({ orgId: "test_cap_003", orgName: "Zip Org",      programCode: "general", status: "open", serviceZips: ["78660"] });

  // Test 1: All fresh records returned without filter
  {
    const { orgs } = await request("/api/directory/capacity");
    assert(orgs.some((o: any) => o.orgId === "test_cap_001" && o.programCode === "SNAP" && o.status === "open"),
      "open SNAP record appears in public feed");
    assert(orgs.some((o: any) => o.orgId === "test_cap_001" && o.programCode === "Medicaid" && o.status === "waitlist"),
      "waitlist Medicaid record appears");
    assert(orgs.some((o: any) => o.orgId === "test_cap_002" && o.programCode === "WIC" && o.status === "closed"),
      "closed WIC record appears");
  }

  // Test 2: Stale rows (>14 days) excluded from public feed
  {
    const { orgs } = await request("/api/directory/capacity");
    const staleRow = orgs.find((o: any) => o.orgId === "test_cap_002" && o.programCode === "SNAP");
    assert(!staleRow, "stale row (>14 days) is excluded from public feed");
  }

  // Test 3: Program filter — ?program=SNAP excludes non-SNAP rows
  {
    const { orgs } = await request("/api/directory/capacity?program=SNAP");
    assert(orgs.some((o: any) => o.programCode === "SNAP"),   "SNAP filter returns SNAP records");
    assert(!orgs.some((o: any) => o.programCode === "WIC"),   "SNAP filter excludes WIC records");
    assert(!orgs.some((o: any) => o.programCode === "Medicaid"), "SNAP filter excludes Medicaid records");
  }

  // Test 4: ZIP filter — ?zip=78660 includes ZIP-scoped org
  {
    const { orgs } = await request("/api/directory/capacity?zip=78660");
    assert(orgs.some((o: any) => o.orgId === "test_cap_003"),
      "ZIP-scoped general org appears when matching ZIP queried");
  }

  // Test 5: ZIP filter — ?zip=99999 excludes ZIP-scoped org
  {
    const { orgs } = await request("/api/directory/capacity?zip=99999");
    assert(!orgs.some((o: any) => o.orgId === "test_cap_003"),
      "ZIP-scoped general org excluded when ZIP doesn't match");
  }

  // Test 6: Matching rows are not lost when 100 earlier non-matches exist
  {
    // Keep the matching row beyond the public route's 100-row cap. The route
    // must apply program and ZIP filters before limiting, or this org vanishes.
    for (const [index, orgId] of CROWD_ORG_IDS.entries()) {
      await seedRow({
        orgId,
        orgName: `AAA Capacity Distractor ${String(index).padStart(3, "0")}`,
        programCode: "OTHER",
        status: "open",
        serviceZips: ["99999"],
      });
    }
    await seedRow({
      orgId: "test_cap_004",
      orgName: "ZZZ Local SNAP Org",
      programCode: "SNAP",
      status: "open",
      serviceZips: ["78660"],
    });

    const { orgs } = await request("/api/directory/capacity?program=SNAP&zip=78660");
    assert(orgs.some((o: any) => o.orgId === "test_cap_004"),
      "program and ZIP filters run before the 100-row limit");
    assert(!orgs.some((o: any) => o.orgId === CROWD_ORG_IDS[0]),
      "non-matching rows remain excluded before limiting");
  }

  // Test 7: Summary endpoint — fresh rows only, with no arbitrary row cap
  {
    const beforeSummaryRows = await request("/api/directory/capacity/summary");

    for (const [index, orgId] of SUMMARY_CROWD_ORG_IDS.entries()) {
      await seedRow({
        orgId,
        orgName: `Summary Crowd ${String(index).padStart(3, "0")}`,
        programCode: "general",
        status: "open",
      });
    }
    await seedRow({
      orgId: "test_cap_summary_stale",
      orgName: "Stale Summary Row",
      programCode: "general",
      status: "waitlist",
      ageOffset: 15,
    });

    const summary = await request("/api/directory/capacity/summary");
    assert(typeof summary.open === "number" && typeof summary.waitlist === "number" && typeof summary.closed === "number",
      "summary endpoint returns open/waitlist/closed counts");
    assert(summary.open - beforeSummaryRows.open === SUMMARY_CROWD_ORG_IDS.length,
      "summary counts every fresh row beyond the old 200-row cap");
    assert(summary.waitlist - beforeSummaryRows.waitlist === 0,
      "summary excludes stale rows from status counts");
    assert(summary.closed - beforeSummaryRows.closed === 0,
      "summary leaves unrelated status counts unchanged");
    assert(summary.lastUpdated !== null,
      "summary reports the latest fresh capacity update");
  }

  await cleanup();

  console.log(`\nCapacity route checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Capacity verification error:", err.message || err);
  process.exit(1);
});
