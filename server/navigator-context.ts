import { JURISDICTIONS } from "@shared/nationwide/jurisdictions";

export type NavigatorContextGeography = {
  zip?: string;
  city?: string;
  state?: string;
  county?: string;
};

const STATE_NAMES =
  "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\\s+Hampshire|New\\s+Jersey|New\\s+Mexico|New\\s+York|North\\s+Carolina|North\\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\\s+Island|South\\s+Carolina|South\\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\\s+Virginia|Wisconsin|Wyoming";
const STATE_ABBREVIATIONS =
  "AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI";
const STATE_NAME_TOKEN = `(?:${STATE_NAMES})`;
const STATE_ABBREVIATION_TOKEN = `(?:${STATE_ABBREVIATIONS})`;
const STATE_ABBREVIATION_FLEX_TOKEN =
  `(?:${STATE_ABBREVIATIONS}|${STATE_ABBREVIATIONS.toLowerCase()})`;
const LOCATION_PREFIX =
  "(?:in|near|from|at|located\\s+in|live\\s+in|lives\\s+in|based\\s+in)";
const STATE_LOCATION_PREFIX =
  "(?:I(?:'m| am)\\s+(?:in|from)|we(?:'re| are)\\s+(?:in|from)|my\\s+location\\s+is|location\\s*(?:is|:)|state\\s+is|my\\s+state\\s+is|located\\s+in|live\\s+in|lives\\s+in|based\\s+in)";

/**
 * Keep the cross-tool Navigator handoff limited to the geography fields the
 * CHW panel displays. Navigator context can gain additional internal fields
 * over time; those must not become referral-visible by pass-through.
 */
export function sanitizeNavigatorContextGeography(
  value: unknown,
): NavigatorContextGeography | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = value as Record<string, unknown>;
  const geography: NavigatorContextGeography = {};
  for (const key of ["zip", "city", "state", "county"] as const) {
    const field = key === "county" ? source.county ?? source.countyFips : source[key];
    if (typeof field !== "string") continue;
    const normalized = field.trim();
    if (
      !normalized ||
      normalized.length > (
        key === "zip" ? 10 :
        key === "state" || key === "county" ? 50 : 100
      ) ||
      /[\u0000-\u001f\u007f]/.test(normalized)
    ) {
      continue;
    }
    if (key === "zip" && !/^\d{5}(?:-\d{4})?$/.test(normalized)) continue;
    if (key === "state" && !/^[\p{L}][\p{L} .'-]*$/u.test(normalized)) continue;
    if (key === "city" && !/^[\p{L}\p{N}][\p{L}\p{N} .,'’()/-]*$/u.test(normalized)) continue;
    if (key === "county" && !/^(?:\d{3}|\d{5})$/.test(normalized)) continue;
    geography[key] = normalized;
  }

  if (geography.county && /^\d{5}$/.test(geography.county) && geography.state) {
    const normalizedState = JURISDICTIONS.find(
      jurisdiction =>
        jurisdiction.code.toLowerCase() === geography.state!.toLowerCase() ||
        jurisdiction.name.toLowerCase() === geography.state!.toLowerCase(),
    );
    if (normalizedState && !geography.county.startsWith(normalizedState.fips)) {
      delete geography.county;
    }
  }

  return Object.keys(geography).length > 0 ? geography : null;
}

export function detectNavigatorContextGeography(
  message: string,
): NavigatorContextGeography | null {
  const zipMatch = message.match(
    /\b(?:zip(?:\s+code)?|postal(?:\s+code)?)\s*(?:is\s+)?[:#-]?\s*(\d{5}(?:-\d{4})?)\b/i,
  ) || message.match(
    /\b(?:in|near|around)\s+(\d{5}(?:-\d{4})?)\b/i,
  );
  const districtMatch = message.match(
    new RegExp(`\\b${LOCATION_PREFIX}\\s+Washington\\s*,?\\s+D\\.?\\s*C\\.?\\b`, "i"),
  );
  const cityStateNameMatch = message.match(
    new RegExp(
      `\\b${LOCATION_PREFIX}\\s+([A-Z][A-Za-z.'-]*(?:\\s+[A-Z][A-Za-z.'-]*){0,3}?)(?:,\\s*|\\s+)(${STATE_NAME_TOKEN})\\b`,
    ),
  );
  const cityStateAbbreviationMatch = message.match(
    new RegExp(
      `\\b${LOCATION_PREFIX}\\s+([A-Z][A-Za-z.'-]*(?:\\s+[A-Z][A-Za-z.'-]*){0,3}?),\\s*(${STATE_ABBREVIATION_FLEX_TOKEN})\\b`,
    ),
  );
  const explicitStateNameMatch = message.match(
    new RegExp(
      `\\b${STATE_LOCATION_PREFIX}\\s+(${STATE_NAME_TOKEN})\\b`,
      "i",
    ),
  );
  const explicitStateAbbreviationMatch = message.match(
    new RegExp(
      `\\b${STATE_LOCATION_PREFIX}\\s+(${STATE_ABBREVIATION_TOKEN})\\b`,
      "i",
    ),
  );
  const stateValue = districtMatch
    ? "DC"
    : cityStateNameMatch?.[2] ??
      cityStateAbbreviationMatch?.[2] ??
      explicitStateNameMatch?.[1] ??
      explicitStateAbbreviationMatch?.[1];
  const rawCity = districtMatch
    ? "Washington, D.C."
    : cityStateNameMatch?.[1] ?? cityStateAbbreviationMatch?.[1] ??
      message.match(
        /\b(?:city|location)\s*(?:is|:)\s*([A-Z][A-Za-z.'-]*(?:\s+[A-Za-z.'-]+){0,3}?)(?=\s*[.!?]|$)/i,
      )?.[1];
  const city =
    rawCity &&
    stateValue &&
    (rawCity.toLowerCase() === stateValue.toLowerCase() ||
      rawCity.toLowerCase().endsWith(stateValue.toLowerCase()))
      ? rawCity.slice(0, -stateValue.length).trim().replace(/,\s*$/, "")
      : rawCity?.replace(/[.!?]+$/, "").trim();

  return sanitizeNavigatorContextGeography({
    zip: zipMatch?.[1],
    city,
    state: stateValue && stateValue.length <= 2 ? stateValue.toUpperCase() : stateValue,
  });
}

export function updateNavigatorUserContext(
  existing: unknown,
  detectedGeography: NavigatorContextGeography | null,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  const safeGeography = sanitizeNavigatorContextGeography(detectedGeography);
  return safeGeography ? { ...base, geography: safeGeography } : base;
}