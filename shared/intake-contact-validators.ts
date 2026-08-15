/**
 * intake-contact-validators.ts
 *
 * Shared validation rules for org intake contact fields (contactPhone and
 * contactUrl). Used by both PATCH endpoints so they can never drift apart:
 *   - server/partner-portal-routes.ts  (session-auth)
 *   - server/capacity-routes.ts        (partner-key auth)
 */

/**
 * contactUrl must be a well-formed http or https URL.
 * The built-in URL constructor does the heavy lifting; we just enforce the scheme.
 */
export function validateContactUrl(raw: unknown): { ok: true } | { ok: false; message: string } {
  if (raw == null || raw === "") return { ok: true }; // optional field — absent is fine
  if (typeof raw !== "string") return { ok: false, message: "contactUrl must be a string" };
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, message: "contactUrl must start with http:// or https://" };
    }
    if (!u.hostname || u.hostname.length < 2) {
      return { ok: false, message: "contactUrl has no valid hostname" };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: `contactUrl is not a valid URL: "${raw}"` };
  }
}

/**
 * contactPhone must be a plausible NANP-ish US phone number.
 * Accepted forms (after stripping common separators):
 *   - 10 digits: 5125550142
 *   - 11 digits with leading 1: 15125550142
 *   - Common formatted: (512) 555-0142, 512-555-0142, 512.555.0142, +1 512 555 0142
 *
 * The rule: strip spaces, dashes, dots, parens, and a leading "+"; the result
 * must be exactly 10 digits OR "1" followed by 10 digits.
 * Area code first digit must be 2–9 (NANP rule).
 */
export function validateContactPhone(raw: unknown): { ok: true } | { ok: false; message: string } {
  if (raw == null || raw === "") return { ok: true }; // optional field — absent is fine
  if (typeof raw !== "string") return { ok: false, message: "contactPhone must be a string" };
  const stripped = raw.replace(/[\s\-.()+]/g, "");
  const digits = stripped.replace(/^\+?1/, ""); // remove leading country code
  if (!/^\d{10}$/.test(digits)) {
    return {
      ok: false,
      message: `contactPhone must be a US phone number (10 digits, e.g. 512-555-0142); got "${raw}"`,
    };
  }
  const areaCode = digits[0];
  if (areaCode < "2") {
    return {
      ok: false,
      message: `contactPhone area code must start with 2–9; got "${raw}"`,
    };
  }
  return { ok: true };
}
