// Integration test for the referral capacity guard (Task: block referrals to
// closed orgs; require waitlist acknowledgement).
//
// Matrix (all as an authed staff user, via the real referralRouter):
//   org with status=closed                    → 409, capacityStatus=closed
//   org with status=waitlist, no ack          → 409, capacityStatus=waitlist, waitWeeks echoed
//   org with status=waitlist, ack=true        → 201 created
//   org with status=open                      → 201 created
//   org with no capacity record               → 201 created (no false blocks)
//   closed record older than 14 days (stale)  → 201 created (stale data never blocks)
//   match by orgName only (no orgId)          → 409 for closed org
//
// Run: npx tsx scripts/test-referral-capacity-guard.ts
// Uses the real DB; seeds prefixed rows and deletes them afterward.

import express, { type Request, type Response, type NextFunction } from "express";
import type { Server } from "http";
import { db } from "../server/storage";
import { academyAvatars, orgCapacity, referrals } from "@shared/schema";
import { like, eq } from "drizzle-orm";
import { referralRouter } from "../server/referral-routes";

const PREFIX = "cap-guard-test-";
const STAFF_ID = `${PREFIX}staff`;

let passed = 0, failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
}

async function cleanup() {
  await db.delete(orgCapacity).where(like(orgCapacity.orgId, `${PREFIX}%`));
  await db.delete(referrals).where(like(referrals.orgName, `${PREFIX}%`));
  await db.delete(academyAvatars).where(like(academyAvatars.userId, `${PREFIX}%`));
}

async function main() {
  await cleanup();
  await db.insert(academyAvatars).values({ userId: STAFF_ID, displayName: "cap guard staff", role: "case_manager" });

  const now = new Date();
  const stale = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
  await db.insert(orgCapacity).values([
    { orgId: `${PREFIX}closed`, orgName: `${PREFIX}Closed Org`, programCode: "SNAP", status: "closed", updatedAt: now },
    { orgId: `${PREFIX}wait`, orgName: `${PREFIX}Waitlist Org`, programCode: "SNAP", status: "waitlist", waitWeeks: 3, updatedAt: now },
    { orgId: `${PREFIX}open`, orgName: `${PREFIX}Open Org`, programCode: "SNAP", status: "open", updatedAt: now },
    { orgId: `${PREFIX}stale`, orgName: `${PREFIX}Stale Closed Org`, programCode: "SNAP", status: "closed", updatedAt: stale },
    { orgId: `${PREFIX}gen`, orgName: `${PREFIX}General Closed Org`, programCode: "general", status: "closed", updatedAt: now },
    // Duplicate-name precedence: exact program record (closed) must beat a
    // fresher "general" record (open) for the same org name.
    { orgId: `${PREFIX}dup-exact`, orgName: `${PREFIX}Dup Org`, programCode: "SNAP", status: "closed", updatedAt: new Date(Date.now() - 60 * 60 * 1000) },
    { orgId: `${PREFIX}dup-gen`, orgName: `${PREFIX}Dup Org`, programCode: "general", status: "open", updatedAt: now },
  ]);

  // Registry-scale regression: seed 250 fresh filler rows so the target org
  // would fall outside any fixed pre-match row limit; the guard must still
  // find it via DB-side matching.
  await db.insert(orgCapacity).values(
    Array.from({ length: 250 }, (_, i) => ({
      orgId: `${PREFIX}filler-${String(i).padStart(3, "0")}`,
      orgName: `${PREFIX}AAA Filler Org ${String(i).padStart(3, "0")}`, // sorts before the targets
      programCode: "SNAP",
      status: "open",
      updatedAt: now,
    })),
  );
  await db.insert(orgCapacity).values({
    orgId: `${PREFIX}zzz-closed`, orgName: `${PREFIX}zzz Beyond Limit Closed Org`, programCode: "SNAP", status: "closed", updatedAt: now,
  });

  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const sub = req.header("x-test-user");
    // Mimic real auth: claims.sub only — no numeric id (chwUserId stays null).
    if (sub) (req as any).user = { claims: { sub } };
    next();
  });
  app.use("/api/referrals", referralRouter);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const addr = server.address();
  const base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

  async function create(body: Record<string, unknown>) {
    const res = await fetch(`${base}/api/referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-user": STAFF_ID },
      body: JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* ignore */ }
    return { status: res.status, json };
  }

  // 1. Closed org → blocked
  let r = await create({ programCode: "SNAP", orgName: `${PREFIX}Closed Org`, orgId: `${PREFIX}closed` });
  check("closed org blocked with 409", r.status === 409, `got ${r.status}`);
  check("closed org capacityStatus=closed", r.json?.capacityStatus === "closed");

  // 2. Waitlist without ack → blocked with waitWeeks
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}Waitlist Org`, orgId: `${PREFIX}wait` });
  check("waitlist without ack blocked with 409", r.status === 409, `got ${r.status}`);
  check("waitlist response echoes waitWeeks=3", r.json?.waitWeeks === 3);
  check("waitlist message mentions wait", /week/i.test(r.json?.error || ""));

  // 3. Waitlist WITH ack → created
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}Waitlist Org`, orgId: `${PREFIX}wait`, waitlistAcknowledged: true });
  check("waitlist with ack creates referral (201)", r.status === 201, `got ${r.status}: ${JSON.stringify(r.json)}`);

  // 4. Open org → created
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}Open Org`, orgId: `${PREFIX}open` });
  check("open org creates referral (201)", r.status === 201, `got ${r.status}`);

  // 5. Unknown org (no capacity record) → created
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}Unknown Org` });
  check("org with no capacity record creates (201)", r.status === 201, `got ${r.status}`);

  // 6. Stale closed record (>14d) → not blocked
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}Stale Closed Org`, orgId: `${PREFIX}stale` });
  check("stale closed record does not block (201)", r.status === 201, `got ${r.status}`);

  // 7. Match by orgName only, closed via "general" program record
  r = await create({ programCode: "WIC", orgName: `${PREFIX}General Closed Org` });
  check("orgName-only match against general closed record blocked (409)", r.status === 409, `got ${r.status}`);

  // 8. Registry-scale: closed org among 250+ fresh rows is still found
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}zzz Beyond Limit Closed Org` });
  check("closed org beyond 200-row registry still blocked (409)", r.status === 409, `got ${r.status}`);

  // 9. Duplicate-name precedence: exact program record (closed) beats fresher "general" (open)
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}Dup Org` });
  check("exact program record wins over fresher general record (409)", r.status === 409, `got ${r.status}`);

  // 10. Same org, different program → falls back to the general (open) record
  r = await create({ programCode: "WIC", orgName: `${PREFIX}Dup Org` });
  check("other program falls back to open general record (201)", r.status === 201, `got ${r.status}`);

  // 11. Bypass attempts: case/whitespace variants must NOT evade the guard
  r = await create({ programCode: "snap", orgName: `${PREFIX}Closed Org`, orgId: `${PREFIX}closed` });
  check("lowercase programCode cannot bypass closed record (409)", r.status === 409, `got ${r.status}`);
  r = await create({ programCode: "SNAP", orgName: `  ${PREFIX.toUpperCase()}CLOSED   ORG  ` });
  check("case/whitespace org-name variant cannot bypass (409)", r.status === 409, `got ${r.status}`);

  // 12. Supplied orgId wins over a name that matches a different (open) org
  r = await create({ programCode: "SNAP", orgName: `${PREFIX}Open Org`, orgId: `${PREFIX}closed` });
  check("explicit orgId (closed) beats open name match (409)", r.status === 409, `got ${r.status}`);

  server.close();
  await cleanup();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
