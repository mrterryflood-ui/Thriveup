// Pure, testable eligibility rules for foster youth programs.
// Single source of truth used by the public Know Your Rights screener AND the
// staff entitlement gap checklist. Every rule traces to the uploaded source
// documents (McKinney-Vento Quick Reference Aug 2024; ACF Chafee page,
// current as of 2026-07-24). Do not add rules without a source.

export type FosterStatus = "current" | "former" | "adopted16" | "never";
export type Verdict = "likely" | "maybe" | "no";

export interface EligibilityInput {
  age: number;
  fosterStatus: FosterStatus;
  housingUnstable: boolean;
  /** true when NOT in the physical custody of a parent/guardian (42 U.S.C. §11434a(6)) */
  unaccompanied: boolean;
  /** Was the person in foster care at any point AFTER turning 14? (required for ETV) */
  careAfter14: boolean;
}

export interface EligibilityResult {
  program: string;
  key: "mckinney_vento" | "chafee" | "etv" | "fafsa_independent";
  eligible: Verdict;
  why: string;
}

// ── Staff gap screening (unverified-facts variant) ──────────────────────────
// Participant records store only a fosterCareHistory boolean and age — NOT
// current-care status, care-after-14 timing, or custody status. Any result
// that depends on an unverified fact must be capped at "maybe": staff verify
// before acting. Age is never used as a proxy for an unrecorded fact.
export interface ParticipantScreenInput {
  age: number;
  fosterCareHistory: boolean;
  housingUnstable: boolean; // living situation IS on file
}

export function screenParticipantGaps(p: ParticipantScreenInput): EligibilityResult[] {
  // Screen with the most permissive assumptions so nothing is missed…
  const optimistic = checkEligibility({
    age: p.age,
    fosterStatus: p.fosterCareHistory ? (p.age < 18 ? "current" : "former") : "never",
    housingUnstable: p.housingUnstable,
    unaccompanied: false, // not on file — FAFSA capped at "maybe" by the rules
    careAfter14: true,    // not on file — capped below
  });
  // …then cap every result that rests on an unverified fact at "maybe".
  // Only McKinney-Vento (housing IS recorded) may remain "likely".
  return optimistic.map((r) =>
    r.key !== "mckinney_vento" && r.eligible === "likely"
      ? { ...r, eligible: "maybe" as Verdict, why: `${r.why} Screening only — care timing/current-care status is not on file; verify with the youth and child welfare agency first.` }
      : r
  );
}

export function checkEligibility(input: EligibilityInput): EligibilityResult[] {
  const { age, fosterStatus, housingUnstable, unaccompanied, careAfter14 } = input;
  const results: EligibilityResult[] = [];
  const inCareOrFormer = fosterStatus !== "never";

  // ── McKinney-Vento: purely housing-based (42 U.S.C. §11434a(2)) ──
  if (housingUnstable) {
    results.push({ key: "mckinney_vento", program: "McKinney-Vento school rights", eligible: "likely", why: "Lacking a fixed, regular, adequate nighttime residence (including doubled-up, motels, shelters, cars) qualifies. 42 U.S.C. §11434a(2)." });
  } else {
    results.push({ key: "mckinney_vento", program: "McKinney-Vento school rights", eligible: "no", why: "These rights apply while you lack stable housing (school-of-origin rights continue through the school year after you get permanent housing)." });
  }

  // ── Chafee (Kansas: to 21; KS is not on the 31-state age-23 list) ──
  // Source bands: youth IN care 14+; in/formerly in care 18-21;
  // adoption/guardianship exit at 16+; "likely to remain until 18" support.
  if (!inCareOrFormer) {
    results.push({ key: "chafee", program: "Chafee services", eligible: "no", why: "Chafee is for youth in or formerly in foster care." });
  } else if (fosterStatus === "current" && age >= 14) {
    results.push({ key: "chafee", program: "Chafee services (Kansas)", eligible: "likely", why: "Youth in foster care ages 14 and older are eligible." });
  } else if (fosterStatus === "current") {
    results.push({ key: "chafee", program: "Chafee services", eligible: "maybe", why: "Chafee starts at 14, but youth 'likely to remain in foster care until 18' can get help participating in age-appropriate activities." });
  } else if (fosterStatus === "adopted16" && age <= 21) {
    results.push({ key: "chafee", program: "Chafee services (Kansas)", eligible: "likely", why: "Youth who left foster care through adoption or guardianship at age 16 or older are eligible." });
  } else if (fosterStatus === "former" && age >= 18 && age <= 21) {
    results.push({ key: "chafee", program: "Chafee services (Kansas)", eligible: "likely", why: "Young people formerly in foster care, ages 18 to 21, are eligible in Kansas." });
  } else if (fosterStatus === "former" && age < 18) {
    results.push({ key: "chafee", program: "Chafee services", eligible: "maybe", why: "The formerly-in-care band in the federal rules is ages 18-21; ask your child welfare agency what applies before 18." });
  } else if (age > 21 && age <= 23) {
    results.push({ key: "chafee", program: "Chafee services", eligible: "maybe", why: "Kansas serves to age 21, but 31 states + DC + PR serve to 23 — if you live in one of those states, you may still qualify." });
  } else {
    results.push({ key: "chafee", program: "Chafee services", eligible: "no", why: "Chafee ends at 21 (23 in some states)." });
  }

  // ── ETV: foster care experience AFTER 14 required; to 26; max 5 years ──
  if (inCareOrFormer && age >= 14 && age <= 26 && careAfter14) {
    results.push({ key: "etv", program: "ETV — up to $5,000/yr for college or training", eligible: "likely", why: "Available up to age 26 (max 5 years total) for young adults who experienced foster care after age 14." });
  } else if (inCareOrFormer && age <= 26) {
    results.push({ key: "etv", program: "ETV", eligible: "maybe", why: "ETV requires foster care experience after age 14 — if that ends up applying to you, you may qualify up to age 26." });
  } else if (inCareOrFormer) {
    results.push({ key: "etv", program: "ETV", eligible: "no", why: "ETV ends at age 26." });
  }

  // ── FAFSA independent status: UNACCOMPANIED homeless youth only ──
  if (housingUnstable && unaccompanied) {
    results.push({ key: "fafsa_independent", program: "FAFSA independent student status", eligible: "likely", why: "Unaccompanied homeless youth (not in a parent/guardian's physical custody) file FAFSA without parent info. Your school liaison must give you verification. 42 U.S.C. §11432(g)(6)(A)(x)(III)." });
  } else if (housingUnstable) {
    results.push({ key: "fafsa_independent", program: "FAFSA independent student status", eligible: "maybe", why: "This applies to unaccompanied homeless youth — youth not in a parent or guardian's physical custody. Since you're with a parent/guardian, talk to your school liaison about your situation." });
  }

  return results;
}
