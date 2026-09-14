import { db } from "./storage";
import { userJourneys, type InsertUserJourney } from "@shared/schema";
import type { CommunityContext } from "@shared/community-context";
import { sql } from "drizzle-orm";

type JourneyFields = Omit<Partial<InsertUserJourney>, "userId" | "updatedAt">;

async function upsertJourneyFields(userId: string, fields: JourneyFields): Promise<void> {
  if (!userId.trim()) return;
  const updatedAt = new Date();
  await db
    .insert(userJourneys)
    .values({ userId, ...fields, updatedAt })
    .onConflictDoUpdate({
      target: userJourneys.userId,
      set: { ...fields, updatedAt },
    });
}

export async function mergeJourneyNeeds(
  userId: string,
  needs: string[],
  geography?: string,
): Promise<void> {
  if (!userId.trim() || (needs.length === 0 && !geography)) return;
  const values: InsertUserJourney = {
    userId,
    identifiedNeeds: needs.length > 0 ? needs : null,
    ...(geography ? { lastKnownGeography: geography } : {}),
    updatedAt: new Date(),
  };
  await db
    .insert(userJourneys)
    .values(values)
    .onConflictDoUpdate({
      target: userJourneys.userId,
      set: {
        identifiedNeeds: needs.length > 0
          ? sql`(
              SELECT jsonb_agg(DISTINCT elem ORDER BY elem)
              FROM jsonb_array_elements(
                COALESCE(user_journeys.identified_needs, '[]'::jsonb) ||
                EXCLUDED.identified_needs
              ) AS elem
            )`
          : undefined,
        ...(geography ? { lastKnownGeography: geography } : {}),
        updatedAt: new Date(),
      },
    });
}

export async function mergeJourneyScreenerFlags(
  userId: string,
  flags: Record<string, boolean>,
  geography?: string,
): Promise<void> {
  if (!userId.trim() || (Object.keys(flags).length === 0 && !geography)) return;
  await db
    .insert(userJourneys)
    .values({
      userId,
      screenerFlags: Object.keys(flags).length > 0 ? flags : null,
      ...(geography ? { lastKnownGeography: geography } : {}),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userJourneys.userId,
      set: {
        screenerFlags: Object.keys(flags).length > 0
          ? sql`COALESCE(user_journeys.screener_flags, '{}'::jsonb) || EXCLUDED.screener_flags`
          : undefined,
        ...(geography ? { lastKnownGeography: geography } : {}),
        updatedAt: new Date(),
      },
    });
}

export async function appendJourneyReferral(userId: string, referralId: string): Promise<void> {
  if (!userId.trim() || !referralId.trim()) return;
  await db
    .insert(userJourneys)
    .values({ userId, activeReferralIds: [referralId], updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userJourneys.userId,
      set: {
        activeReferralIds: sql`(
          SELECT jsonb_agg(DISTINCT elem ORDER BY elem)
          FROM jsonb_array_elements(
            COALESCE(user_journeys.active_referral_ids, '[]'::jsonb) ||
            jsonb_build_array(CAST(${referralId} AS text))
          ) AS elem
        )`,
        updatedAt: new Date(),
      },
    });
}

export async function setJourneyYhsiStatus(userId: string, status: string): Promise<void> {
  await upsertJourneyFields(userId, { yhsiStatus: status });
}

export async function mergeJourneyCommunityContext(userId: string, context: CommunityContext): Promise<void> {
  await upsertJourneyFields(userId, { communityContext: context });
}

export async function markJourneyCommunityContextWarmed(userId: string): Promise<void> {
  await upsertJourneyFields(userId, { communityContextAt: new Date() });
}