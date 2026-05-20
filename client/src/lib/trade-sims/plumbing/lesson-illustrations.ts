/**
 * Static map from plumbing lesson slug -> hero illustration metadata.
 *
 * Images are pure visual scenes (no in-image text — see the regeneration
 * note in `docs/active-commitments.md`). Real, translatable, accessible
 * text is rendered as an HTML overlay in `<LessonHero>` so language toggle,
 * screen readers, and copy edits all work without re-running image gen.
 *
 * To add a new illustrated lesson:
 *   1. Generate the image (no text) into client/src/assets/trade-sims/plumbing/
 *   2. Add a record below keyed by the lesson slug.
 *   3. That's it — `<LessonHero>` and the lesson card auto-render it.
 */

import day05 from "@/assets/trade-sims/plumbing/day-05-drainage-venting.png";
import day06 from "@/assets/trade-sims/plumbing/day-06-backflow-prevention.png";

export interface LessonHeroPanel {
  /** Short top label, e.g. "UNVENTED". */
  title: string;
  /** Sub-label appearing under the title, e.g. "Trap siphoned dry". */
  subtitle: string;
  /** Which side of the underlying split image this overlay sits on. */
  side: "left" | "right";
  /** Outcome flavor — controls overlay color. */
  outcome: "fail" | "pass";
}

export interface LessonHeroIllustration {
  /** Imported PNG source. */
  src: string;
  /** Day banner, e.g. "DAY 5 · DRAINAGE & VENTING". */
  banner: string;
  /** One-line caption below the panels. */
  caption: string;
  /** The two overlay labels (left + right panel). */
  panels: [LessonHeroPanel, LessonHeroPanel];
  /** Long-form alt text for screen readers. */
  alt: string;
}

export const PLUMBING_LESSON_ILLUSTRATIONS: Record<string, LessonHeroIllustration> = {
  "drainage-venting": {
    src: day05,
    banner: "DAY 5 · DRAINAGE & VENTING",
    caption: "NO VENT = NO TRAP SEAL = SEWER GAS IN THE HOUSE",
    panels: [
      { title: "UNVENTED", subtitle: "Trap siphoned dry", side: "left", outcome: "fail" },
      { title: "VENTED", subtitle: "Trap holds water", side: "right", outcome: "pass" },
    ],
    alt: "Split-panel illustration. Left: a bathroom with no vent pipe, sewer gas rising up a dry P-trap, worried plumber. Right: the same bathroom with a vent pipe to the roof, water sealing the trap, plumber giving a thumbs up.",
  },
  "backflow-prevention": {
    src: day06,
    banner: "DAY 6 · BACKFLOW PREVENTION",
    caption: "CODE-REQUIRED PROTECTION AT EVERY CROSS-CONNECTION",
    panels: [
      { title: "NO CHECK VALVE", subtitle: "Backflow contamination", side: "left", outcome: "fail" },
      { title: "CHECK VALVE INSTALLED", subtitle: "Backflow prevented", side: "right", outcome: "pass" },
    ],
    alt: "Split-panel illustration. Left: a bathroom where a garden hose in a bucket of dirty water is siphoning contamination back into the supply because no check valve is installed; alarmed plumber. Right: the same bathroom with a bronze check valve on the supply line catching the reverse pressure; confident plumber giving a thumbs up.",
  },
};

export function getPlumbingLessonIllustration(slug: string): LessonHeroIllustration | null {
  return PLUMBING_LESSON_ILLUSTRATIONS[slug] ?? null;
}
