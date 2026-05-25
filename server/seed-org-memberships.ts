// Idempotent startup tasks for the conglomerate / open-collaboration model.
// 1. For every existing organizations row, ensure a matching organization_members
//    row exists with role='owner' for the original organizations.user_id.
//    This backfills the pre-membership world so existing users keep working.
// 2. Mark TCAF's org as acceptsCollaborators=true so signed-in users can
//    self-join the shared workspace (Sedgwick County Vitality lives there).
//
// Safe to run repeatedly. Run at server startup (see routes.ts).

import { db } from "./storage";
import { organizations, organizationMembers } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";

export async function seedOrgMemberships(): Promise<void> {
  try {
    const orgs = await db.select({ id: organizations.id, userId: organizations.userId }).from(organizations);
    for (const o of orgs) {
      const existing = await db.select({ id: organizationMembers.id }).from(organizationMembers)
        .where(and(eq(organizationMembers.orgId, o.id), eq(organizationMembers.userId, o.userId)));
      if (existing.length === 0) {
        await db.insert(organizationMembers).values({
          orgId: o.id,
          userId: o.userId,
          role: "owner",
        }).onConflictDoNothing();
      }
    }
    // Open the TCAF workspace so collaborators (Eric & co) can self-join.
    await db.update(organizations)
      .set({ acceptsCollaborators: true })
      .where(eq(organizations.isTcafOrg, true));
    const opened = await db.select({ id: organizations.id, name: organizations.name })
      .from(organizations).where(eq(organizations.isTcafOrg, true));
    console.log(`[seed] org memberships backfilled (${orgs.length} orgs); ${opened.length} TCAF org(s) marked acceptsCollaborators=true`);
  } catch (e) {
    console.error("[seed] org memberships failed (non-fatal):", e);
  }
}
