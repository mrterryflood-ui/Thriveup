// ── Canonical claims: single source of truth for every public-facing statistic ──
//
// WHY THIS FILE EXISTS
// Every number that appears in marketing/public copy or in machine-readable
// /api-info responses MUST be imported from here, not hard-coded at the call
// site. That keeps every surface honest and consistent, and means a single
// edit here propagates everywhere.
//
// HONESTY RULES (do not weaken without a real audit artifact):
//  • Language support is provided by the AI TRANSLATION LAYER. These are NOT
//    human-verified translations. Word every claim as "available in N languages
//    via AI translation" (or equivalent) — never imply certified translation.
//  • "Nationwide" describes ARCHITECTURE (the system is built to cover all 50
//    states), NOT a claim of active deployments in all 50 states.
//  • NEVER put a grant-dollar figure in this file or in public copy.

/** Number of sibling service platforms in the ecosystem. */
export const SERVICE_PLATFORM_COUNT = 15;

/**
 * Languages the AI translation layer can render UI + navigation into.
 * These are machine translations, NOT human-verified translations.
 */
export const AI_TRANSLATION_LANGUAGE_COUNT = 107;

/** Distinct AI engines the platform integrates. */
export const AI_ENGINE_COUNT = 4;

/**
 * Geographic reach is an ARCHITECTURE claim, not a deployment claim.
 * The system is built to cover all 50 states; it does not assert active
 * programs running in every state.
 */
export const STATES_COVERED_BY_ARCHITECTURE = 50;

// ── Short, reusable phrasings (import these to keep copy identical everywhere) ──

/** e.g. "available in 107 languages via AI translation" */
export const LANGUAGES_PHRASE = `available in ${AI_TRANSLATION_LANGUAGE_COUNT} languages via AI translation`;

/** e.g. "107 languages via AI translation" — for tight spaces / list items */
export const LANGUAGES_SHORT_PHRASE = `${AI_TRANSLATION_LANGUAGE_COUNT} languages via AI translation`;

/** e.g. "15 service platforms" */
export const PLATFORMS_PHRASE = `${SERVICE_PLATFORM_COUNT} service platforms`;

/** e.g. "4 AI engines" */
export const AI_ENGINES_PHRASE = `${AI_ENGINE_COUNT} AI engines`;

/**
 * The one-line identity strap used in the hero and elsewhere.
 * Honest wording: platforms + engines are counts; languages is AI translation.
 */
export const IDENTITY_STRAP = `${PLATFORMS_PHRASE} · ${AI_ENGINES_PHRASE} · ${LANGUAGES_SHORT_PHRASE}`;

/** Architecture-not-deployment phrasing for "nationwide". */
export const NATIONWIDE_ARCHITECTURE_PHRASE = `${STATES_COVERED_BY_ARCHITECTURE}-state architecture`;

/** Value used in machine-readable /api-info geographicReach fields. */
export const GEOGRAPHIC_REACH = `${STATES_COVERED_BY_ARCHITECTURE}-state architecture (built to cover all ${STATES_COVERED_BY_ARCHITECTURE} states; not a claim of active deployment in every state)`;
