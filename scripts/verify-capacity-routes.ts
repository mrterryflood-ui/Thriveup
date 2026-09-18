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
import { orgCapacity, organizations, partnerApiKeys } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { Client } from "pg";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5000";
const DEVELOPMENT_MANOR_EXTERNAL_KEY = "manor-tx-city";
const DEVELOPMENT_MANOR_ID = "3aeda19b-9719-4157-8e27-6d6c78444672";
const VERIFIER_LOCK_KEY = "thriveup:verify-capacity-routes";
const RUN = randomUUID().replace(/-/g, "").slice(0, 12);
const ORG_PREFIX = `test_cap_${RUN}`;
const orgId = (suffix: string) => `${ORG_PREFIX}_${suffix}`;
const CROWD_ORG_IDS = Array.from({ length: 100 }, (_, index) =>
  orgId(`crowd_${String(index).padStart(3, "0")}`),
);
const SUMMARY_CROWD_ORG_IDS = Array.from({ length: 205 }, (_, index) =>
  orgId(`summary_${String(index).padStart(3, "0")}`),
);
const TEST_ORG_IDS = [
  orgId("001"),
  orgId("002"),
  orgId("003"),
  orgId("004"),
  orgId("summary_stale"),
  ...CROWD_ORG_IDS,
  ...SUMMARY_CROWD_ORG_IDS,
];
const UNDER_SCOPED_PARTNER_KEY = `tcaf_capacity_scope_test_${randomUUID().replace(/-/g, "")}`;
const UNDER_SCOPED_PARTNER_KEY_HASH = createHash("sha256").update(UNDER_SCOPED_PARTNER_KEY).digest("hex");
let lockClient: Client | undefined;

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — GET ${path}`);
  return res.json() as Promise<any>;
}

async function requestRaw(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, init);
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
  await db.delete(orgCapacity).where(inArray(orgCapacity.orgId, TEST_ORG_IDS));
  await db.delete(partnerApiKeys).where(eq(partnerApiKeys.keyHash, UNDER_SCOPED_PARTNER_KEY_HASH));
}

function assertDevelopmentTarget() {
  let base: URL;
  try {
    base = new URL(BASE);
  } catch {
    throw new Error(`Refusing capacity verification with invalid E2E_BASE_URL: ${BASE}`);
  }

  const localHost = ["localhost", "127.0.0.1", "::1"].includes(base.hostname);
  const configuredDevHost = !!process.env.REPLIT_DEV_DOMAIN && base.hostname === process.env.REPLIT_DEV_DOMAIN;
  if ((!localHost && !configuredDevHost) || process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT) {
    throw new Error("Refusing capacity verification outside a development HTTP target");
  }
}

async function assertDevelopmentDatabase() {
  const [sentinel] = await db
    .select({
      id: organizations.id,
      externalKey: organizations.externalKey,
      isIntegrationOwned: organizations.isIntegrationOwned,
      userId: organizations.userId,
    })
    .from(organizations)
    .where(eq(organizations.externalKey, DEVELOPMENT_MANOR_EXTERNAL_KEY))
    .limit(1);

  if (
    !sentinel
    || sentinel.id !== DEVELOPMENT_MANOR_ID
    || sentinel.externalKey !== DEVELOPMENT_MANOR_EXTERNAL_KEY
    || sentinel.isIntegrationOwned !== true
    || sentinel.userId !== null
  ) {
    throw new Error("Refusing capacity verification: DATABASE_URL is not the known development database");
  }
}

async function acquireVerifierLock() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Refusing capacity verification without DATABASE_URL");

  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query("SELECT pg_advisory_lock(hashtext($1))", [VERIFIER_LOCK_KEY]);
    lockClient = client;
  } catch (error) {
    try {
      await client.end();
    } catch (closeError) {
      console.error("Capacity verifier lock connection close failed:", closeError);
    }
    throw error;
  }
}

async function releaseVerifierLock() {
  const client = lockClient;
  lockClient = undefined;
  if (!client) return;

  let unlockError: unknown;
  try {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", [VERIFIER_LOCK_KEY]);
  } catch (error) {
    unlockError = error;
  }

  try {
    await client.end();
  } catch (error) {
    console.error("Capacity verifier lock connection close failed:", error);
    unlockError ??= error;
  }

  if (unlockError) throw unlockError;
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
  let cleanupError: unknown;
  let targetValidated = false;
  console.log(`Capacity verification fixture namespace: ${ORG_PREFIX}`);
  try {
    assertDevelopmentTarget();
    await assertDevelopmentDatabase();
    await acquireVerifierLock();
    targetValidated = true;

    await db.insert(partnerApiKeys).values({
      partnerName: `Capacity scope verifier ${RUN}`,
      keyHash: UNDER_SCOPED_PARTNER_KEY_HASH,
      keyPrefix: UNDER_SCOPED_PARTNER_KEY.slice(0, 14),
      scopes: ["content:read"],
      active: true,
    });

    // Test 0: A valid partner key without capacity scopes cannot read or write.
    {
      const writeResponse = await requestRaw("/api/partner/v1/capacity", {
        method: "PATCH",
        headers: {
          "x-partner-key": UNDER_SCOPED_PARTNER_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          orgName: `Unauthorized capacity ${RUN}`,
          programCode: "general",
          status: "open",
        }),
      });
      assert(writeResponse.status === 403,
        "valid partner key without capacity:write cannot mutate capacity");

      const readResponse = await requestRaw("/api/partner/v1/capacity", {
        headers: { "x-partner-key": UNDER_SCOPED_PARTNER_KEY },
      });
      assert(readResponse.status === 403,
        "valid partner key without capacity:read cannot read capacity");

      const unauthorizedRows = await db.select({ orgId: orgCapacity.orgId })
        .from(orgCapacity)
        .where(eq(orgCapacity.orgId, `pk_${UNDER_SCOPED_PARTNER_KEY.slice(0, 14)}`));
      assert(unauthorizedRows.length === 0,
        "under-scoped capacity write creates no database row");
    }

    // Seed test rows
    await seedRow({ orgId: orgId("001"), orgName: "Open Org",     programCode: "SNAP",    status: "open"     });
    await seedRow({ orgId: orgId("001"), orgName: "Open Org",     programCode: "Medicaid", status: "waitlist", waitWeeks: 3 });
    await seedRow({ orgId: orgId("002"), orgName: "Closed Org",   programCode: "WIC",     status: "closed"   });
    // Stale row — older than 14 days, should not appear in public feed
    await seedRow({ orgId: orgId("002"), orgName: "Stale Org",    programCode: "SNAP",    status: "open", ageOffset: 15 });
    // ZIP-scoped general org (serves 78660 only)
    await seedRow({ orgId: orgId("003"), orgName: "Zip Org",      programCode: "general", status: "open", serviceZips: ["78660"] });

    // Test 1: All fresh records returned without filter
    {
      const { orgs } = await request("/api/directory/capacity");
      assert(orgs.some((o: any) => o.orgId === orgId("001") && o.programCode === "SNAP" && o.status === "open"),
        "open SNAP record appears in public feed");
      assert(orgs.some((o: any) => o.orgId === orgId("001") && o.programCode === "Medicaid" && o.status === "waitlist"),
        "waitlist Medicaid record appears");
      assert(orgs.some((o: any) => o.orgId === orgId("002") && o.programCode === "WIC" && o.status === "closed"),
        "closed WIC record appears");
    }

    // Test 2: Stale rows (>14 days) excluded from public feed
    {
      const { orgs } = await request("/api/directory/capacity");
      const staleRow = orgs.find((o: any) => o.orgId === orgId("002") && o.programCode === "SNAP");
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
      assert(orgs.some((o: any) => o.orgId === orgId("003")),
        "ZIP-scoped general org appears when matching ZIP queried");
    }

    // Test 5: ZIP filter — ?zip=99999 excludes ZIP-scoped org
    {
      const { orgs } = await request("/api/directory/capacity?zip=99999");
      assert(!orgs.some((o: any) => o.orgId === orgId("003")),
        "ZIP-scoped general org excluded when ZIP doesn't match");
    }

    // Test 6: Matching rows are not lost when 100 earlier non-matches exist
    {
      // Keep the matching row beyond the public route's 100-row cap. The route
      // must apply program and ZIP filters before limiting, or this org vanishes.
      for (const [index, crowdOrgId] of CROWD_ORG_IDS.entries()) {
        await seedRow({
          orgId: crowdOrgId,
          orgName: `AAA Capacity Distractor ${String(index).padStart(3, "0")}`,
          programCode: "OTHER",
          status: "open",
          serviceZips: ["99999"],
        });
      }
      await seedRow({
        orgId: orgId("004"),
        orgName: "ZZZ Local SNAP Org",
        programCode: "SNAP",
        status: "open",
        serviceZips: ["78660"],
      });

      const { orgs } = await request("/api/directory/capacity?program=SNAP&zip=78660");
      assert(orgs.some((o: any) => o.orgId === orgId("004")),
        "program and ZIP filters run before the 100-row limit");
      assert(!orgs.some((o: any) => o.orgId === CROWD_ORG_IDS[0]),
        "non-matching rows remain excluded before limiting");
    }

    // Test 7: Summary endpoint — fresh rows only, with no arbitrary row cap
    {
      const beforeSummaryRows = await request("/api/directory/capacity/summary");

      for (const [index, summaryOrgId] of SUMMARY_CROWD_ORG_IDS.entries()) {
        await seedRow({
          orgId: summaryOrgId,
          orgName: `Summary Crowd ${String(index).padStart(3, "0")}`,
          programCode: "general",
          status: "open",
        });
      }
      await seedRow({
        orgId: orgId("summary_stale"),
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
  } finally {
    if (targetValidated) {
      try {
        await cleanup();
      } catch (error) {
        cleanupError = error;
        failed++;
        console.error(`  ✗ fixture cleanup failed for ${ORG_PREFIX}:`, error instanceof Error ? error.message : error);
      }
      try {
        await releaseVerifierLock();
      } catch (error) {
        cleanupError = error;
        failed++;
        console.error(`  ✗ verifier lock release failed for ${ORG_PREFIX}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  console.log(`\nCapacity route checks (${ORG_PREFIX}): ${passed} passed, ${failed} failed`);
  if (cleanupError) throw new Error("Capacity verification cleanup failed");
  if (failed > 0) throw new Error("Capacity route checks failed");
}

run().catch((err) => {
  console.error("Capacity verification error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
