import { db } from "../server/storage";
import { organizations, organizationMembers, users } from "../shared/schema";
import { and, eq } from "drizzle-orm";

const TCAF_ID = "89c1eabf-1e70-469d-9962-4009fd80a6f8";
const UID = `verify-eric-his-${Date.now()}`;
const EMAIL = `verify.eric.${Date.now()}@example.com`;

(async () => {
  await db.insert(users).values({ id: UID, email: EMAIL, firstName: "Eric", lastName: "Hargrave" }).onConflictDoNothing();
  console.log("STEP1 user created:", UID);

  let mine = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, UID));
  console.log("STEP2 memberships before:", mine.length, "(expect 0)");

  const [tcaf] = await db.select().from(organizations).where(eq(organizations.id, TCAF_ID));
  if (!tcaf) { console.error("FAIL: TCAF org not found"); process.exit(1); }
  console.log("STEP3 TCAF acceptsCollaborators:", tcaf.acceptsCollaborators, "(expect true)");
  if (!tcaf.acceptsCollaborators) { console.error("FAIL: TCAF not open"); process.exit(1); }

  const [m] = await db.insert(organizationMembers).values({ orgId: TCAF_ID, userId: UID, role: "collaborator" }).returning();
  console.log("STEP4 membership inserted, role:", m.role, "(expect collaborator)");

  mine = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, UID));
  const picked = mine.slice().sort((a,b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
  const [resolvedOrg] = await db.select().from(organizations).where(eq(organizations.id, picked.orgId));
  console.log("STEP5 loadCallerOrg resolves to:", resolvedOrg.name, "MATCH:", resolvedOrg.id === TCAF_ID);

  // Idempotency
  const dup = await db.select().from(organizationMembers).where(and(eq(organizationMembers.orgId, TCAF_ID), eq(organizationMembers.userId, UID)));
  console.log("STEP6 idempotency: existing count =", dup.length, "(expect 1)");

  // Cleanup
  await db.delete(organizationMembers).where(eq(organizationMembers.userId, UID));
  await db.delete(users).where(eq(users.id, UID));
  console.log("STEP7 cleanup ok — ALL PASS");
  process.exit(0);
})().catch(e => { console.error("FAIL:", e); process.exit(1); });
