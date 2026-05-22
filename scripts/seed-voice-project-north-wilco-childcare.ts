/**
 * Seed a Community Voice project for North Williamson County childcare gaps.
 * Idempotent: if the slug already exists, no-op.
 *
 * Run:  npx tsx scripts/seed-voice-project-north-wilco-childcare.ts
 */
import { db } from "../server/storage";
import { communityVoiceProjects } from "../shared/schema";
import { eq } from "drizzle-orm";

const SLUG = "north-wilco-childcare-gaps";

async function main(): Promise<void> {
  const existing = await db.select().from(communityVoiceProjects).where(eq(communityVoiceProjects.slug, SLUG)).limit(1);
  if (existing.length > 0) {
    console.log(`[seed-voice:n-wilco-childcare] already exists (id=${existing[0].id}). No-op.`);
    return;
  }

  const [row] = await db
    .insert(communityVoiceProjects)
    .values({
      slug: SLUG,
      name: "North Wilco Childcare Gaps",
      summary:
        "Residents and providers across North Williamson County (Round Rock, Hutto, Leander, Cedar Park, Liberty Hill, Taylor, Georgetown) drop pins where childcare is too far, too expensive, has no infant slots, or has no extended hours for shift workers. AI clusters the pins into infrastructure gaps; route into LifeBridge (benefits), Whole-Person Health (parent BH), and TCAF's Grant Discovery Engine for matched funding.",
      focusAreas: ["childcare-infrastructure", "early-childhood", "workforce-access", "shift-workers", "infant-care", "subsidy-deserts"] as string[],
      centerLat: "30.5083",
      centerLng: "-97.6789",
      defaultZoom: 11,
      publiclyVisible: true,
      status: "active",
      createdBy: null,
    } as typeof communityVoiceProjects.$inferInsert)
    .returning();

  console.log(`[seed-voice:n-wilco-childcare] created project id=${row.id} slug=${row.slug}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-voice:n-wilco-childcare] failed:", err);
    process.exit(1);
  });
