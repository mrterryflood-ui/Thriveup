import { and, eq } from "drizzle-orm";
import { nonprofitEventWorkspaceAccess } from "@shared/schema";
import { db, storage } from "./storage";

export const PLATFORM_STAFF_ROLES = new Set(["admin", "teacher", "case_manager", "facilitator", "staff"]);

export async function isPlatformStaff(userId: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  return Boolean(user && PLATFORM_STAFF_ROLES.has(user.role));
}

export async function canAccessEventWorkspace(userId: string, orgId: string, membershipRole: string | undefined): Promise<boolean> {
  if (!(await isPlatformStaff(userId))) return false;
  if (membershipRole === "owner") return true;
  const [authorization] = await db.select({ id: nonprofitEventWorkspaceAccess.id })
    .from(nonprofitEventWorkspaceAccess)
    .where(and(
      eq(nonprofitEventWorkspaceAccess.orgId, orgId),
      eq(nonprofitEventWorkspaceAccess.userId, userId),
    ));
  return Boolean(authorization);
}