/**
 * Workforce Pathways — per-trade "what it takes" data.
 *
 * ANTI-FABRICATION NOTE (fable-standard C1 / Six Prohibitions):
 * Every credential name and next-step organization below is copied verbatim
 * from the REAL authored Trade Sims lesson data in
 * `shared/data/trade-sims/*-lessons.ts` — specifically each trade's TRADE_META
 * description and its Day-15 capstone `credentialPathway` field. No employer
 * promise, wage figure, or statistic is invented here; where the authored data
 * itself cites a source (BLS OEWS 2024, UA Local 286 2024 scale) it is quoted,
 * not paraphrased into a new claim.
 *
 * Time / cost are structural facts of the product, not outcome claims:
 *   - 15 lessons ("days"), one per day, ~30 min each → the 15-day framing that
 *     appears in every trade's tagline ("...in 15 days").
 *   - Free / open-access / login-optional — stated on the Trade Sims landing.
 */

export interface TradePathway {
  slug: string;
  name: string;
  /** From TRADE_META.tagline (verbatim). */
  tagline: string;
  /** lucide icon key matching the landing page ICONS map. */
  iconKey: "electrical" | "plumbing" | "hvac" | "welding" | "automotive" | "software-engineering";
  /**
   * What you can earn / the next credential — drawn from the authored capstone
   * credentialPathway + TRADE_META description. Kept faithful to the source.
   */
  earn: string;
  /** Concrete next-step orgs named in the authored lesson data. */
  nextSteps: string[];
}

/** Days per trade curriculum (all six ship 15 authored lessons). */
export const LESSON_DAYS = 15;
/** Authored per-lesson time framing. */
export const MINUTES_PER_LESSON = 30;

export const TRADE_PATHWAYS: TradePathway[] = [
  {
    slug: "electrical",
    name: "Electrical",
    tagline: "From Ohm's Law to a working capstone in 15 days.",
    iconKey: "electrical",
    earn:
      "Pass the Day-15 capstone and your ThriveUp Academy profile shows the Electrical Fundamentals badge — usable as evidence of prior learning at ACC's pre-apprenticeship intake and NCCER-affiliated programs.",
    nextSteps: [
      "ACC pre-apprenticeship cohort (Austin Community College)",
      "Sponsoring electrical contractor",
      "NCCER Electrical Level 1",
      "Journeyman electrician license exam",
    ],
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    tagline: "From water pressure to a whole-house capstone in 15 days.",
    iconKey: "plumbing",
    earn:
      "Pass the capstone and your profile shows the Plumbing Fundamentals badge — usable as evidence of prior learning at ACC's PLAB sequence, UA Local 286 pre-apprenticeship intake, and PHCC's apprenticeship application.",
    nextSteps: [
      "ACC PLAB 1305 (Basic Plumbing) intake",
      "UA Local 286 pre-apprenticeship (Austin)",
      "PHCC apprenticeship",
      "Texas State Board of Plumbing Examiners (TSBPE) licensure",
    ],
  },
  {
    slug: "hvac",
    name: "HVAC",
    tagline: "From heat transfer to a whole-home capstone in 15 days.",
    iconKey: "hvac",
    earn:
      "The capstone parallels the practical exam for NATE Installation + HVAC Excellence Employment-Ready. A strong portfolio piece for ACC's HVAC Technology certificate and sheet-metal apprenticeship interviews.",
    nextSteps: [
      "ACC HVAC Technology certificate (Austin Community College)",
      "NATE Core + specialty certification",
      "EPA Section 608 Technician Certification",
      "SMART Local 67 sheet-metal apprenticeship (Central TX)",
    ],
  },
  {
    slug: "welding",
    name: "Welding",
    tagline: "Heat input, joint geometry, code-grade welds — without burning a single rod.",
    iconKey: "welding",
    earn:
      "The capstone is the same one ACC's Welding AAS uses to graduate students into the AWS Certified Welder practical. Verify your settings against AWS D1.1, then do it once on real steel at a testing center.",
    nextSteps: [
      "AWS Certified Welder (structural, AWS D1.1)",
      "ACC Welding Technology AAS (Austin Community College)",
      "NCCER Welding Level 1",
      "Ironworkers Local 482 (Austin) — FCAW/structural",
    ],
  },
  {
    slug: "automotive",
    name: "Automotive",
    tagline: "Diagnose like a journeyman, even before you turn a wrench.",
    iconKey: "automotive",
    earn:
      "Capstone diagnostics is what ASE L1 tests. Pass it, sit for ASE A8 + L1, and you're a Master Technician candidate. ACC's Advanced Diagnostics certificate ends here too.",
    nextSteps: [
      "ASE A8 + L1 certification",
      "ACC Advanced Diagnostics certificate (Austin Community College)",
      "Credential ladder: journeyman → master → shop foreman → shop owner",
    ],
  },
  {
    slug: "software-engineering",
    name: "Software Engineering",
    tagline: "Anybody can vibe code — but you have to know how the system works to make vibecoding work.",
    iconKey: "software-engineering",
    earn:
      "A shipped capstone is the single strongest application asset for Apprenti, Microsoft LEAP, Multiverse, Year Up, and GitHub Foundations. Pair it with one credential from Days 6-14 for a credible junior-engineer onramp.",
    nextSteps: [
      "Apprenti tech apprenticeship",
      "Microsoft LEAP",
      "GitHub Foundations",
      "AWS Certified Cloud Practitioner / (ISC)² Certified in Cybersecurity",
    ],
  },
];
