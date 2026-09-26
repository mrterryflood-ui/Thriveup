export type ChildCORECountyEvidence = Record<string, string | number | boolean | null>;

type NormalizedCountyPayload =
  | { kind: "invalid"; error: string }
  | { kind: "batch"; records: unknown; snapshotAt: unknown }
  | {
      kind: "flat";
      records: Array<Record<string, unknown>>;
      snapshotAt: undefined;
      rawMetrics: ChildCORECountyEvidence;
    };

const COUNT_FIELDS = [
  "total_providers",
  "total_licensed_capacity",
  "estimated_demand",
  "slot_gap",
] as const;

const FLAT_FIELDS = new Set([
  "source", "dataType", "county_fips", "county_name", "state", "as_of_date",
  "coverage_rate", "coverage_rate_suppressed", "suppression_reason",
  ...COUNT_FIELDS,
  ...COUNT_FIELDS.map((field) => `${field}_suppressed`),
]);

function validSourceDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value &&
    date.getTime() <= Date.now() + 5 * 60_000;
}

/**
 * Accept the sender's documented single-county shape without changing the
 * existing records[] batch contract. Never carry unvalidated partner fields
 * into raw_metrics or the Navigator context.
 */
export function normalizeChildCORECountyPayload(body: unknown): NormalizedCountyPayload {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { kind: "invalid", error: "Request body must be an object" };
  }
  const raw = body as Record<string, unknown>;
  if (Object.hasOwn(raw, "records")) {
    // Legacy callers may label the envelope with source/dataType. Reject only
    // county-specific flat fields alongside records[]; preserve prior tolerance.
    if (Object.keys(raw).some((field) =>
      field !== "source" && field !== "dataType" && FLAT_FIELDS.has(field))) {
      return { kind: "invalid", error: "Do not mix flat county fields with records[]" };
    }
    return { kind: "batch", records: raw.records, snapshotAt: raw.snapshotAt };
  }

  if (raw.source !== "ChildCORE" || raw.dataType !== "metric") {
    return { kind: "invalid", error: "Expected records[] or a ChildCORE metric payload" };
  }
  if (Object.keys(raw).some((field) => !FLAT_FIELDS.has(field))) {
    return { kind: "invalid", error: "Unsupported field in flat county metric payload" };
  }
  if (typeof raw.county_fips !== "string" || !/^\d{5}$/.test(raw.county_fips)) {
    return { kind: "invalid", error: "county_fips must be a 5-digit string" };
  }
  if (typeof raw.county_name !== "string" ||
      !raw.county_name.trim() || raw.county_name.trim().length > 100) {
    return { kind: "invalid", error: "county_name must be a nonempty string of at most 100 characters" };
  }
  if (typeof raw.state !== "string" ||
      !/^[A-Za-z][A-Za-z .'-]{1,49}$/.test(raw.state.trim())) {
    return { kind: "invalid", error: "state must be a bounded state name or abbreviation" };
  }
  if (!validSourceDate(raw.as_of_date)) {
    return { kind: "invalid", error: "as_of_date must be a valid, nonfuture YYYY-MM-DD date" };
  }

  const evidence: ChildCORECountyEvidence = {
    source: "ChildCORE",
    dataType: "metric",
    state: raw.state.trim(),
    as_of_date: raw.as_of_date,
  };
  let anySuppressed = false;
  for (const field of COUNT_FIELDS) {
    const suppressed = raw[`${field}_suppressed`];
    const value = raw[field];
    if (typeof suppressed !== "boolean") {
      return { kind: "invalid", error: `${field}_suppressed must be a boolean` };
    }
    if (suppressed) {
      if (value !== null) {
        return { kind: "invalid", error: `${field} must be null when suppressed` };
      }
      anySuppressed = true;
    } else if (value !== null && (
      typeof value !== "number" || !Number.isSafeInteger(value) ||
      Math.abs(value) > 1_000_000_000 ||
      (field === "slot_gap" ? Math.abs(value) < 5 : value < 5)
    )) {
      return { kind: "invalid", error: `${field} must be null or a bounded count outside the floor-5 cell` };
    }
    evidence[field] = value as number | null;
    evidence[`${field}_suppressed`] = suppressed;
  }

  if (!Object.hasOwn(raw, "coverage_rate") ||
      (raw.coverage_rate !== null &&
        (typeof raw.coverage_rate !== "number" || !Number.isFinite(raw.coverage_rate) ||
         raw.coverage_rate < 0 || raw.coverage_rate > 100))) {
    return { kind: "invalid", error: "coverage_rate must be null or a finite number from 0 to 100" };
  }
  if (Object.hasOwn(raw, "coverage_rate_suppressed")) {
    if (typeof raw.coverage_rate_suppressed !== "boolean" ||
        (raw.coverage_rate_suppressed && raw.coverage_rate !== null)) {
      return { kind: "invalid", error: "coverage_rate must be null when coverage_rate_suppressed is true" };
    }
    evidence.coverage_rate_suppressed = raw.coverage_rate_suppressed;
    anySuppressed ||= raw.coverage_rate_suppressed;
  }
  if ((anySuppressed && raw.suppression_reason !== "cell_below_floor_5") ||
      (raw.suppression_reason != null && raw.suppression_reason !== "cell_below_floor_5")) {
    return { kind: "invalid", error: "suppression_reason must be cell_below_floor_5 when values are suppressed" };
  }
  evidence.coverage_rate = raw.coverage_rate as number | null;
  evidence.suppression_reason = raw.suppression_reason === "cell_below_floor_5"
    ? "cell_below_floor_5" : null;

  return {
    kind: "flat",
    records: [{
      fipsCode: raw.county_fips,
      countyName: raw.county_name.trim(),
      snapshotAt: `${raw.as_of_date}T00:00:00.000Z`,
    }],
    snapshotAt: undefined,
    rawMetrics: evidence,
  };
}

/**
 * A county snapshot can contain algebraically related counts. If any
 * capacity/demand/gap value is suppressed, omit the entire related group.
 * Coverage-rate units and signed gap semantics are not established by the
 * sender description, so both are stored but not interpreted in the prompt.
 */
export function projectChildCORECountyContext(rawMetrics: unknown):
  { asOfDate: string; lines: string[] } | null {
  if (!rawMetrics || typeof rawMetrics !== "object" || Array.isArray(rawMetrics)) return null;
  const raw = rawMetrics as Record<string, unknown>;
  if (raw.source !== "ChildCORE" || raw.dataType !== "metric" ||
      !validSourceDate(raw.as_of_date)) return null;

  const safeCount = (field: typeof COUNT_FIELDS[number]) => {
    const value = raw[field];
    return raw[`${field}_suppressed`] === false &&
      typeof value === "number" && Number.isSafeInteger(value) &&
      Math.abs(value) <= 1_000_000_000 &&
      (field === "slot_gap" ? Math.abs(value) >= 5 : value >= 5);
  };
  const lines: string[] = [];
  if (safeCount("total_providers")) {
    lines.push(`total providers ${raw.total_providers}`);
  } else if (raw.total_providers_suppressed === true) {
    lines.push("total providers suppressed (cell below 5)");
  }

  const related = ["total_licensed_capacity", "estimated_demand", "slot_gap"] as const;
  if (related.every(safeCount)) {
    lines.push(`total licensed capacity ${raw.total_licensed_capacity}`);
    lines.push(`estimated demand ${raw.estimated_demand}`);
  } else if (related.some((field) => raw[`${field}_suppressed`] === true)) {
    lines.push("capacity, demand, and gap withheld due to small-cell suppression");
  }

  return lines.length > 0 ? { asOfDate: raw.as_of_date, lines } : null;
}