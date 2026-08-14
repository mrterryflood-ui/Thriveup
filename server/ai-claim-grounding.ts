/**
 * AI Claim Grounding
 * ----------------------------------------------------------------------------
 * A single, reusable, non-AI (mechanical) claim-verification engine. Prompt
 * instructions alone are never a guarantee a model complied — it can still
 * restate, round, reframe, or invent a number. Every AI surface that emits a
 * user-facing statistic, dollar figure, ratio, or rate MUST run its output
 * through this module before the text reaches a user.
 *
 * How it works (same architecture originally built for community-brief ROI
 * claims, now generalized):
 *   1. Split the narrative into sentences (decimal points are protected with
 *      a sentinel character first, so "3.2" is never misread as a sentence
 *      break).
 *   2. For each sentence, check it against a set of `ClaimRule`s. A rule
 *      fires on a broad TRIGGER regex (deliberately over-inclusive — a
 *      trigger match only ever risks removing text, never lets a mismatch
 *      through) and, if triggered, extracts the specific number(s) the
 *      sentence states.
 *   3. A triggered sentence is kept only if every extracted number matches
 *      one of the rule's allowed source values within tolerance. Otherwise
 *      the whole sentence is redacted.
 *   4. Every decision (claim text, extracted value, matched/unmatched source
 *      value, verdict) is returned so the caller can append it to the
 *      tamper-evident claim chain (see `claim-chain.ts`).
 */

// ---------------------------------------------------------------------------
// Decimal protection + sentence splitting (shared primitives)
// ---------------------------------------------------------------------------

/**
 * A real decimal point ("3.2") always has a digit on both sides with no
 * space; a sentence-ending period never does. Swap decimal points for a
 * sentinel character before sentence-splitting or pattern-matching, so "."
 * can be trusted as a sentence boundary, and restore it in the final output.
 */
export function protectDecimals(text: string): string {
  return text.replace(/(\d)\.(?=\d)/g, "$1\u0000");
}
export function restoreDecimals(text: string): string {
  return text.replace(/\u0000/g, ".");
}

function splitSentences(protectedText: string): string[] {
  return protectedText.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [protectedText];
}

// ---------------------------------------------------------------------------
// Claim rules
// ---------------------------------------------------------------------------

export interface NumericClaim {
  value: number;
  /** free-form tag the rule uses to decide which source value(s) it may match, e.g. "percent", "dollar", "ratio", "rate", "count" */
  kind: string;
}

export interface ClaimRule {
  /** short id for logging / chain records, e.g. "roi", "poverty-rate" */
  id: string;
  /** broad trigger — if a sentence matches this, it is inspected. Over-triggering is safe; it only risks redacting the sentence, never letting a mismatch through. */
  trigger: RegExp;
  /** pull every number this sentence states that this rule cares about, from the *decimal-restored* sentence text */
  extract: (sentence: string) => NumericClaim[];
  /** true if `claim` matches one of the real, computed/DB source values within tolerance */
  isGrounded: (claim: NumericClaim) => boolean;
  /** human-readable description of what a grounded claim looks like, for logging/chain records */
  expectedDescription: string;
}

export interface GroundingDecision {
  ruleId: string;
  sentence: string;
  extractedValues: NumericClaim[];
  verdict: "kept" | "stripped" | "no_claim_extracted";
  expectedDescription: string;
}

export interface GroundingResult {
  text: string;
  droppedAny: boolean;
  decisions: GroundingDecision[];
}

/**
 * Runs every rule against every sentence. A sentence is dropped if ANY rule
 * it triggers is not satisfied. Rules that don't trigger on a sentence are
 * silently skipped for that sentence (a sentence can trigger zero, one, or
 * several rules).
 */
export function enforceGroundedClaims(narrative: string, rules: ClaimRule[]): GroundingResult {
  const protectedText = protectDecimals(narrative);
  const anyTrigger = rules.some((r) => r.trigger.test(protectedText));
  if (!anyTrigger) return { text: narrative, droppedAny: false, decisions: [] };

  const sentences = splitSentences(protectedText);
  const decisions: GroundingDecision[] = [];
  let droppedAny = false;

  const kept = sentences.filter((protectedSentence) => {
    const sentence = restoreDecimals(protectedSentence).trim();
    let sentenceOk = true;
    for (const rule of rules) {
      if (!rule.trigger.test(protectedSentence)) continue;
      const claims = rule.extract(sentence);
      if (claims.length === 0) {
        // Trigger fired but no verifiable number was found — can't confirm
        // it's grounded, so it does not count as grounded.
        decisions.push({ ruleId: rule.id, sentence, extractedValues: [], verdict: "no_claim_extracted", expectedDescription: rule.expectedDescription });
        sentenceOk = false;
        continue;
      }
      const allGrounded = claims.every((c) => rule.isGrounded(c));
      decisions.push({
        ruleId: rule.id,
        sentence,
        extractedValues: claims,
        verdict: allGrounded ? "kept" : "stripped",
        expectedDescription: rule.expectedDescription,
      });
      if (!allGrounded) sentenceOk = false;
    }
    if (!sentenceOk) droppedAny = true;
    return sentenceOk;
  });

  if (!droppedAny) return { text: narrative, droppedAny: false, decisions };
  return {
    text: restoreDecimals(kept.join(" ").replace(/\s{2,}/g, " ").trim()),
    droppedAny: true,
    decisions,
  };
}

// ---------------------------------------------------------------------------
// Reusable rule builders
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/**
 * Builds a rule for cost-benefit / ROI / "for every dollar" style claims.
 * `allowedRatio` is the one real computed ratio this rule permits (or null
 * to permit NONE — i.e. no scenario/cascade was computed for this surface,
 * so any such claim is fabricated and must be stripped).
 */
export function buildRoiRule(id: string, allowedRatio: number | null, tolerance = 0.05): ClaimRule {
  const TRIGGER =
    /(return on investment|\bROI\b|for every\s*(?:dollar|\$ ?1)\b|dollars?\s+for every|per\s*(?:dollar|\$1)\b(?:\s+invested)?|\d+(?:\u0000\d+)?\s*(?::|to)\s*1\b|\d+(?:\u0000\d+)?\s*x\b|\w*fold\b|times\s*(?:the\s*)?(?:investment|cost)\b|%\s*return|percent\s*return|cost[- ]benefit)/i;
  return {
    id,
    trigger: TRIGGER,
    expectedDescription: allowedRatio != null ? `computed ratio ${allowedRatio}x (or ${(allowedRatio * 100).toFixed(0)}% return)` : "no cost-benefit ratio computed for this surface — any such claim is fabricated",
    extract: (sentence) => extractRatioClaims(sentence),
    isGrounded: (claim) => {
      if (allowedRatio == null) return false;
      return claim.kind === "percent" ? Math.abs(claim.value - allowedRatio * 100) < 0.5 : Math.abs(claim.value - allowedRatio) < tolerance;
    },
  };
}

function extractRatioClaims(text: string): NumericClaim[] {
  const claims: NumericClaim[] = [];
  const ratioNumericPatterns = [
    /(\d+(?:\.\d+)?)\s*(?::|to)\s*1\b/gi,
    /(\d+(?:\.\d+)?)\s*x\b/gi,
    /\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?)?\s*for every\s*(?:\$ ?1|dollar)\b/gi,
    /\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?)?\s*(?:saved|returned)?\s*per\s*(?:dollar|\$1)\b(?:\s+invested)?/gi,
    /(\d+(?:\.\d+)?)[\s-]*fold\b/gi,
    /(\d+(?:\.\d+)?)\s*times\s*(?:the\s*)?(?:investment|cost)\b/gi,
  ];
  for (const re of ratioNumericPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n)) claims.push({ value: n, kind: "ratio" });
    }
  }
  const percentPatterns = [/(\d+(?:\.\d+)?)\s*%\s*return\b/gi, /(\d+(?:\.\d+)?)\s*percent\s*return\b/gi];
  for (const re of percentPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n)) claims.push({ value: n, kind: "percent" });
    }
  }
  const wordAlternation = Object.keys(NUMBER_WORDS).join("|");
  const wordPatterns = [
    new RegExp(`\\b(${wordAlternation})\\b[\\s-]*(?:dollars?)?\\s*(?:for every|to|per)\\s*\\$?(?:one|1|dollar)\\b`, "gi"),
    new RegExp(`\\b(${wordAlternation})[\\s-]*fold\\b`, "gi"),
    new RegExp(`\\b(${wordAlternation})\\b\\s*times\\s*(?:the\\s*)?(?:investment|cost)\\b`, "gi"),
  ];
  for (const re of wordPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = NUMBER_WORDS[m[1].toLowerCase()];
      if (n != null) claims.push({ value: n, kind: "ratio" });
    }
  }
  return claims;
}

/**
 * Builds a rule for a plain "X%" claim about a specific named quantity
 * (e.g. poverty rate, uninsured rate). `trigger` should be a regex that only
 * matches sentences plausibly about that quantity (to avoid flagging
 * unrelated percentages in the same narrative).
 */
export function buildPercentRule(id: string, trigger: RegExp, allowedValue: number | null, tolerance = 0.5): ClaimRule {
  return {
    id,
    trigger,
    expectedDescription: allowedValue != null ? `${allowedValue}%` : "no source value available — any percentage claim here is unverifiable",
    extract: (sentence) => {
      const claims: NumericClaim[] = [];
      const re = /(\d+(?:\.\d+)?)\s*(?:%|percent)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(sentence))) {
        const n = parseFloat(m[1]);
        if (Number.isFinite(n)) claims.push({ value: n, kind: "percent" });
      }
      return claims;
    },
    isGrounded: (claim) => allowedValue != null && Math.abs(claim.value - allowedValue) < tolerance,
  };
}

/**
 * Builds a rule for a dollar-figure claim (e.g. "$4.2M cost of inaction").
 * Values are compared in millions with a relative tolerance, since AI
 * paraphrasing legitimately rounds ("$4.2M" vs "$4.18M").
 */
export function buildDollarMillionsRule(id: string, trigger: RegExp, allowedMillions: number | null, relTolerance = 0.06): ClaimRule {
  return {
    id,
    trigger,
    expectedDescription: allowedMillions != null ? `$${allowedMillions.toFixed(1)}M` : "no source dollar figure available — any such claim here is unverifiable",
    extract: (sentence) => {
      const claims: NumericClaim[] = [];
      const re = /\$\s*(\d+(?:\.\d+)?)\s*([MmBbKk])?/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(sentence))) {
        let n = parseFloat(m[1]);
        if (!Number.isFinite(n)) continue;
        const unit = (m[2] || "").toLowerCase();
        if (unit === "b") n *= 1000;
        else if (unit === "k") n /= 1000;
        // no unit / "m" both treated as millions (matches how these prompts always state figures)
        claims.push({ value: n, kind: "dollar-millions" });
      }
      return claims;
    },
    isGrounded: (claim) => {
      if (allowedMillions == null) return false;
      const tol = Math.max(0.05, Math.abs(allowedMillions) * relTolerance);
      return Math.abs(claim.value - allowedMillions) < tol;
    },
  };
}

/**
 * Builds a rule matching a numeric claim against ANY of several allowed
 * source values (useful when a sentence could legitimately restate one of
 * several known figures — e.g. total deaths, a rate, a correlation).
 */
export function buildAnyOfRule(id: string, trigger: RegExp, extract: (sentence: string) => NumericClaim[], allowedValues: number[], tolerance: (v: number) => number): ClaimRule {
  return {
    id,
    trigger,
    expectedDescription: allowedValues.length ? `one of: ${allowedValues.join(", ")}` : "no source value available for this surface",
    extract,
    isGrounded: (claim) => allowedValues.some((v) => Math.abs(claim.value - v) < tolerance(v)),
  };
}
