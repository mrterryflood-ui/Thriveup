// RPLICE v2 — Replicable Contract
// Deterministic resident reference. MUST produce the same hash on every peer
// for the same applicant, without transmitting PII.
//
// Formula (byte-exact):
//   residentRef = sha256( lower(firstInitial) + lower(lastName) + birthYear
//                       + zip5 + last4(phoneOrEmailLocalPart) ).substr(0,16)
//
// Inputs are normalized (trim + lowercase + ASCII-fold) before hashing.

import { createHash } from "crypto";

export type ResidentRefInputs = {
  firstName: string;      // "Maria"
  lastName: string;       // "García"
  birthYear: number;      // 1987
  zip: string;            // "78644" (first 5 digits used)
  phoneOrEmail: string;   // "512-555-0123" or "maria.g@example.com"
};

// ASCII-fold: strip diacritics, collapse non-ASCII to closest ASCII, lowercase.
function normalize(s: string): string {
  return (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function last4(phoneOrEmail: string): string {
  const s = (phoneOrEmail || "").trim();
  if (!s) return "";
  if (s.includes("@")) {
    const local = normalize(s.split("@")[0]);
    return local.slice(-4);
  }
  const digits = s.replace(/\D/g, "");
  return digits.slice(-4);
}

export function computeResidentRef(inputs: ResidentRefInputs): string {
  const firstInitial = normalize(inputs.firstName).charAt(0);
  const lastName = normalize(inputs.lastName);
  const year = String(inputs.birthYear || "").slice(0, 4);
  const zip5 = String(inputs.zip || "").replace(/\D/g, "").slice(0, 5);
  const tail = last4(inputs.phoneOrEmail);
  const material = `${firstInitial}${lastName}${year}${zip5}${tail}`;
  return createHash("sha256").update(material).digest("hex").substring(0, 16);
}

// Convenience for code paths that already have separate phone/email fields.
export function computeResidentRefFromFields(o: {
  firstName: string; lastName: string; birthYear: number;
  zip: string; phone?: string | null; email?: string | null;
}): string {
  return computeResidentRef({
    firstName: o.firstName,
    lastName: o.lastName,
    birthYear: o.birthYear,
    zip: o.zip,
    phoneOrEmail: o.phone || o.email || "",
  });
}
