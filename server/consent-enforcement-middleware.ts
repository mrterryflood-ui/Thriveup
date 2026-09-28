/**
 * Consent Enforcement Middleware — DIS Alignment Condition 2
 *
 * Checks consent_toggles table before including any user's data in aggregates
 * or reports. All eight consent toggles default OFF — explicit consent required.
 *
 * Usage in report routes:
 *   import { checkConsentToggle, filterByConsent } from "./consent-enforcement-middleware";
 *   const allowed = await filterByConsent(userRecords, "share_with_funder");
 */
import type { Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { consentToggles } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export type ConsentScope =
  | "share_with_funder"
  | "include_in_report"
  | "name_me_publicly"
  | "share_story"
  | "export_data"
  | "record_outcome"
  | "share_with_research"
  | "community_intelligence";

/** Runtime list of valid scopes — used by API routes to validate input. */
export const CONSENT_SCOPES: ConsentScope[] = [
  "share_with_funder",
  "include_in_report",
  "name_me_publicly",
  "share_story",
  "export_data",
  "record_outcome",
  "share_with_research",
  "community_intelligence",
];

/**
 * Check if a specific user has consented to a specific data use.
 * Returns false by default (default-off). A DB error also returns false.
 */
export async function checkConsentToggle(
  userId: string,
  scope: ConsentScope,
): Promise<boolean> {
  try {
    const rows = await db
      .select({ enabled: consentToggles.enabled })
      .from(consentToggles)
      .where(
        and(
          eq(consentToggles.userId, userId),
          eq(consentToggles.scope, scope),
        ),
      )
      .limit(1);
    return rows.length > 0 && rows[0].enabled === true;
  } catch (err) {
    console.error("[consent-enforcement] checkConsentToggle error:", err);
    // Default-off: if we can't check, don't include the user's data
    return false;
  }
}

/**
 * Set a consent toggle for a user.
 * Upserts the toggle (creates if not exists, updates if exists).
 */
export async function setConsentToggle(
  userId: string,
  scope: ConsentScope,
  enabled: boolean,
): Promise<void> {
  await db
    .insert(consentToggles)
    .values({ userId, scope, enabled, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [consentToggles.userId, consentToggles.scope],
      set: { enabled, updatedAt: new Date() },
    });
}

/**
 * Get all consent toggles for a user (for the privacy settings page).
 * Returns an object with all scopes and their current values (default false).
 */
export async function getUserConsentToggles(
  userId: string,
): Promise<Record<ConsentScope, boolean>> {
  const defaults: Record<ConsentScope, boolean> = {
    share_with_funder: false,
    include_in_report: false,
    name_me_publicly: false,
    share_story: false,
    export_data: false,
    record_outcome: false,
    share_with_research: false,
    community_intelligence: false,
  };

  try {
    const rows = await db
      .select({ scope: consentToggles.scope, enabled: consentToggles.enabled })
      .from(consentToggles)
      .where(eq(consentToggles.userId, userId));

    for (const row of rows) {
      defaults[row.scope as ConsentScope] = row.enabled;
    }
  } catch (err) {
    console.error("[consent-enforcement] getUserConsentToggles error:", err);
  }

  return defaults;
}

/**
 * Filter an array of user records to only those who have consented to the scope.
 * Use before including any identifiable records in reports or aggregates.
 */
export async function filterByConsent<T extends { userId: string }>(
  records: T[],
  scope: ConsentScope,
): Promise<T[]> {
  if (records.length === 0) return [];
  const results = await Promise.all(
    records.map(async (r) => ({
      record: r,
      consented: await checkConsentToggle(r.userId, scope),
    })),
  );
  return results.filter((r) => r.consented).map((r) => r.record);
}

/**
 * Express middleware that adds consent checking to the request object.
 * Mount on routes that generate reports or aggregates.
 */
export function consentEnforcementMiddleware(
  req: Request & { checkConsent?: typeof checkConsentToggle },
  _res: Response,
  next: NextFunction,
): void {
  req.checkConsent = checkConsentToggle;
  next();
}
