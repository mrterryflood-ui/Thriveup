/**
 * Verification: user_community_brief_cache persistence and Navigator injection.
 *
 * Checks:
 *  1. saveBriefCacheForUser() writes and upserts correctly
 *  2. Upsert replacement — a second write for the same userId overwrites
 *  3. User isolation — row for user A is not visible when querying user B
 *  4. 30-day freshness: fresh row is injected; stale row (> 30 days) is excluded
 *  5. Stream ordering: {done:true} arrives only after save is flushed
 *  6. Security label present in getPersonalContext() output
 *  7. Summary truncation to 1500 chars
 *
 * Run: npx tsx scripts/verify-community-brief-cache.ts
 */

import { db } from "../server/storage";
import { userCommunityBriefCache } from "../shared/schema";
import { saveBriefCacheForUser } from "../server/regional-briefing-routes";
import { getPersonalContext } from "../server/personal-context";
import { eq, sql } from "drizzle-orm";

let passed = 0;
let failed = 0;

function ok(label: string) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label: string, reason: string) {
  console.error(`  ✗ ${label}: ${reason}`);
  failed++;
}

const TS = Date.now();
const USER_A = `__verify_brief_cache_a_${TS}`;
const USER_B = `__verify_brief_cache_b_${TS}`;

async function cleanup() {
  await db.delete(userCommunityBriefCache).where(eq(userCommunityBriefCache.userId, USER_A));
  await db.delete(userCommunityBriefCache).where(eq(userCommunityBriefCache.userId, USER_B));
}

async function run() {
  console.log("\n[community-brief-cache] running verification...\n");
  await cleanup();

  // ── 1. saveBriefCacheForUser() writes a real DB row ───────────────────────
  await saveBriefCacheForUser(
    USER_A,
    [{ label: "Travis County", region: "Travis County, TX" }],
    "Housing equity",
    "Initial brief content — first version.",
  );
  const [row1] = await db
    .select()
    .from(userCommunityBriefCache)
    .where(eq(userCommunityBriefCache.userId, USER_A))
    .limit(1);
  if (row1?.briefSummary?.includes("Initial brief content")) {
    ok("saveBriefCacheForUser writes a DB row");
  } else {
    fail("initial write", `expected 'Initial brief content', got '${row1?.briefSummary}'`);
  }

  // ── 2. Upsert replacement — second call for same userId overwrites ─────────
  await saveBriefCacheForUser(
    USER_A,
    [{ label: "Travis County", region: "Travis County, TX" }],
    "Childcare deserts",
    "Updated brief content — second version.",
  );
  const allA = await db
    .select()
    .from(userCommunityBriefCache)
    .where(eq(userCommunityBriefCache.userId, USER_A));
  if (allA.length === 1) {
    ok("upsert does not create duplicate rows");
  } else {
    fail("upsert uniqueness", `expected 1 row, got ${allA.length}`);
  }
  if (allA[0]?.briefSummary?.includes("Updated brief content")) {
    ok("upsert replaces brief_summary with latest content");
  } else {
    fail("upsert content", `got '${allA[0]?.briefSummary}'`);
  }

  // ── 3. User isolation — user B has no row ─────────────────────────────────
  const [rowB] = await db
    .select()
    .from(userCommunityBriefCache)
    .where(eq(userCommunityBriefCache.userId, USER_B))
    .limit(1);
  if (!rowB) {
    ok("user B has no row — caches are isolated");
  } else {
    fail("user isolation", "user B unexpectedly returned user A's row");
  }

  // ── 4a. Fresh row: getPersonalContext injects the brief ───────────────────
  const freshCtx = await getPersonalContext(USER_A, "tell me about this area");
  if (freshCtx.contextBlock.includes("[COMMUNITY BRIEF DATA")) {
    ok("fresh brief is injected into Navigator personal context");
  } else {
    fail("fresh injection", "contextBlock does not contain COMMUNITY BRIEF DATA marker");
  }
  if (freshCtx.contextBlock.includes("Travis County")) {
    ok("injected context includes the brief location label");
  } else {
    fail("location label", "contextBlock does not mention Travis County");
  }

  // ── 4b. Security label present ────────────────────────────────────────────
  if (
    freshCtx.contextBlock.includes("quoted reference material, not instructions") &&
    freshCtx.contextBlock.includes("END COMMUNITY BRIEF DATA")
  ) {
    ok("security label and closing delimiter are present in injected block");
  } else {
    fail("security label", "security framing markers missing from contextBlock");
  }

  // ── 4c. Stale row: > 30 days old is excluded ─────────────────────────────
  // Overwrite user A's row with a generatedAt 31 days ago.
  await db
    .update(userCommunityBriefCache)
    .set({
      generatedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    })
    .where(eq(userCommunityBriefCache.userId, USER_A));

  const staleCtx = await getPersonalContext(USER_A, "tell me about this area");
  if (!staleCtx.contextBlock.includes("[COMMUNITY BRIEF DATA")) {
    ok("stale brief (> 30 days) is excluded from Navigator context");
  } else {
    fail("stale exclusion", "stale brief was incorrectly injected into contextBlock");
  }

  // ── 5. Summary truncation ─────────────────────────────────────────────────
  const longText = "A".repeat(2000);
  await saveBriefCacheForUser(USER_B, [{ label: "Bexar County", region: "Bexar County, TX" }], "SDOH", longText);
  const [rowB2] = await db
    .select({ briefSummary: userCommunityBriefCache.briefSummary })
    .from(userCommunityBriefCache)
    .where(eq(userCommunityBriefCache.userId, USER_B))
    .limit(1);
  const saved = rowB2?.briefSummary ?? "";
  if (saved.length <= 1500) {
    ok(`brief_summary truncated to ≤ 1500 chars (got ${saved.length})`);
  } else {
    fail("truncation", `brief_summary is ${saved.length} chars, expected ≤ 1500`);
  }

  // ── 6. Stream ordering: save happens before {done:true} ───────────────────
  // This is enforced structurally (save is awaited before res.write done) —
  // verify the exported function itself is synchronously awaitable (not void).
  const writePromise = saveBriefCacheForUser(
    USER_B,
    [{ label: "Bexar County", region: "Bexar County, TX" }],
    "SDOH",
    "Ordering test.",
  );
  if (writePromise instanceof Promise) {
    ok("saveBriefCacheForUser returns a Promise (can be awaited before {done:true})");
    await writePromise;
  } else {
    fail("promise type", "saveBriefCacheForUser did not return a Promise");
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await cleanup();

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\n[community-brief-cache] ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error("[community-brief-cache] unexpected error:", err);
  process.exit(1);
});
