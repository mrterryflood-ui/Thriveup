/**
 * verify-capacity-badges.ts — proves the Benefits Screener capacity badge
 * endpoint returns correct statuses and excludes stale entries.
 *
 *   (1) Seeds org_capacity rows: open (fresh), waitlist (fresh), closed (fresh),
 *       an 8-day-old row (should be returned but flagged stale), and a
 *       15-day-old row (must be excluded entirely).
 *   (2) GET /api/directory/capacity — verifies each status comes back verbatim,
 *       the >14-day row is excluded, and the 8-day row carries stale:true.
 *   (3) Verifies ?program= and ?zip= filters behave.
 *
 * Run against the dev server at http://localhost:5000.
 */
import { db } from "../server/storage";
import { orgCapacity } from "@shared/schema";
import { inArray } from "drizzle-orm";

const BASE = "http://localhost:5000";
const RUN = `captest_${Date.now()}`;
const DAY = 24 * 60 * 60 * 1000;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ✓ " + msg);
}

const seedIds = [
  `${RUN}_open`,
  `${RUN}_wait`,
  `${RUN}_closed`,
  `${RUN}_aging`,
  `${RUN}_ancient`,
];

async function cleanup() {
  await db.delete(orgCapacity).where(inArray(orgCapacity.orgId, seedIds));
}

async function main() {
  await cleanup(); // in case a prior run died mid-way

  // ── (1) Seed one row per status + freshness scenario ──────────────────────
  console.log("[1] Seeding org_capacity rows");
  await db.insert(orgCapacity).values([
    {
      orgId: `${RUN}_open`, orgName: "Capbadge Test Open Org",
      programCode: "SNAP", status: "open",
      serviceZips: ["75201"], updatedAt: new Date(),
    },
    {
      orgId: `${RUN}_wait`, orgName: "Capbadge Test Waitlist Org",
      programCode: "SNAP", status: "waitlist", waitWeeks: 3,
      serviceZips: ["75201"], updatedAt: new Date(),
    },
    {
      orgId: `${RUN}_closed`, orgName: "Capbadge Test Closed Org",
      programCode: "WIC", status: "closed",
      serviceZips: ["76101"], updatedAt: new Date(),
    },
    {
      orgId: `${RUN}_aging`, orgName: "Capbadge Test Aging Org",
      programCode: "SNAP", status: "open",
      updatedAt: new Date(Date.now() - 8 * DAY), // >7d stale flag, <14d cutoff
    },
    {
      orgId: `${RUN}_ancient`, orgName: "Capbadge Test Ancient Org",
      programCode: "SNAP", status: "waitlist",
      updatedAt: new Date(Date.now() - 15 * DAY), // beyond 14-day cutoff
    },
  ]);
  console.log("  ✓ seeded 5 rows (open, waitlist, closed, 8d-old, 15d-old)");

  // ── (2) GET /api/directory/capacity — statuses + 14-day exclusion ─────────
  console.log("\n[2] GET /api/directory/capacity");
  const res = await fetch(`${BASE}/api/directory/capacity`);
  assert(res.status === 200, `endpoint returned 200 (got ${res.status})`);
  const body: any = await res.json();
  const mine = (body.orgs as any[]).filter((o) => String(o.orgId).startsWith(RUN));

  const byId = (suffix: string) => mine.find((o) => o.orgId === `${RUN}_${suffix}`);

  assert(byId("open")?.status === "open", "fresh open org returned with status 'open'");
  const wait = byId("wait");
  assert(wait?.status === "waitlist", "fresh waitlist org returned with status 'waitlist'");
  assert(wait?.waitWeeks === 3, "waitlist org carries waitWeeks=3");
  assert(byId("closed")?.status === "closed", "fresh closed org returned with status 'closed'");
  assert(!byId("ancient"), "15-day-old entry is excluded (14-day cutoff)");

  const aging = byId("aging");
  assert(!!aging, "8-day-old entry is still returned (within 14-day window)");
  assert(aging.stale === true, "8-day-old entry is flagged stale:true (>7 days)");
  assert(byId("open").stale === false, "fresh entry is flagged stale:false");

  // ── (3) program and zip filters ────────────────────────────────────────────
  console.log("\n[3] ?program= and ?zip= filters");
  const snapRes = await fetch(`${BASE}/api/directory/capacity?program=SNAP`);
  const snapBody: any = await snapRes.json();
  const snapMine = (snapBody.orgs as any[]).filter((o) => String(o.orgId).startsWith(RUN));
  assert(
    !snapMine.some((o) => o.orgId === `${RUN}_closed`),
    "program=SNAP excludes the WIC-only org",
  );
  assert(
    snapMine.some((o) => o.orgId === `${RUN}_open`),
    "program=SNAP includes the SNAP open org",
  );

  const zipRes = await fetch(`${BASE}/api/directory/capacity?zip=76101`);
  const zipBody: any = await zipRes.json();
  const zipMine = (zipBody.orgs as any[]).filter((o) => String(o.orgId).startsWith(RUN));
  assert(
    zipMine.some((o) => o.orgId === `${RUN}_closed`),
    "zip=76101 includes the org serving that zip",
  );
  assert(
    !zipMine.some((o) => o.orgId === `${RUN}_open`),
    "zip=76101 excludes orgs serving other zips",
  );
  assert(
    zipMine.some((o) => o.orgId === `${RUN}_aging`),
    "org with no serviceZips is not excluded by zip filter",
  );

  await cleanup();
  console.log("\n✅ All capacity badge verification checks passed.");
  process.exit(0);
}

main().catch(async (e) => {
  console.error("\n❌ Verification failed:", e);
  try { await cleanup(); } catch {}
  process.exit(1);
});
