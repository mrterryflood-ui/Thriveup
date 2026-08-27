/**
 * Connecticut USALEEP geography alignment
 *
 * CDC USALEEP reports 2010-2015 life expectancy by 2010 Census tract, but
 * names Connecticut's legacy counties. Since 2022, Census county-equivalent
 * statistics use nine Planning Regions instead. A display-name join between
 * those two systems is invalid.
 *
 * This specialist uses the Census Bureau's published identifier chain:
 *   2010 tract --(2020 tract relationship)--> 2020 tract
 *   2020 tract + legacy county --(town/tract relationship)--> 2022 town
 *   2022 town --(county/town crosswalk)--> 2022 planning-region FIPS
 *
 * A 2010 source tract is returned only if every published relation gives it
 * one modern planning-region target. A tract crossing a new-region boundary
 * is deliberately excluded instead of being copied, averaged, or guessed.
 */

export const CONNECTICUT_PLANNING_REGION_FIPS = [
  "09110",
  "09120",
  "09130",
  "09140",
  "09150",
  "09160",
  "09170",
  "09180",
  "09190",
] as const;

export const CONNECTICUT_LEGACY_COUNTY_FIPS_BY_USALEEP_NAME: Readonly<Record<string, string>> = {
  "Fairfield County, CT": "09001",
  "Hartford County, CT": "09003",
  "Litchfield County, CT": "09005",
  "Middlesex County, CT": "09007",
  "New Haven County, CT": "09009",
  "New London County, CT": "09011",
  "Tolland County, CT": "09013",
  "Windham County, CT": "09015",
};

export interface ConnecticutSourceTract {
  /** USALEEP full_ct_num: six digits displayed as four digits, a period, two digits. */
  tractFips: string;
}

export interface ConnecticutRelationshipTables {
  /**
   * Census "Ct cou to cousub crosswalk": legacy county/town to planning
   * region. Its quoted headers contain line breaks, so use parsePipeTable().
   */
  countyToCountySubdivision: string;
  /** Census ACS22 county-subdivision to 2022 Census tract relationship. */
  countySubdivisionToTract: string;
  /** Census 2020 tract to 2010 tract comparability relationship. */
  tract2020To2010: string;
}

export interface ConnecticutAlignmentReport {
  sourceTracts: number;
  resolvedSourceTracts: number;
  boundarySpanningSourceTracts: number;
  unresolvableSourceTracts: number;
  invalidSourceTracts: number;
  planningRegionsWithResolvedTracts: string[];
}

export interface ConnecticutAlignmentResult<T extends ConnecticutSourceTract> {
  byPlanningRegionFips: Map<string, T[]>;
  report: ConnecticutAlignmentReport;
}

type PipeRow = Record<string, string>;

/**
 * Parse a Census pipe-delimited relationship file. The Connecticut
 * county/town source has quoted header labels that span physical lines and
 * begins with a UTF-8 byte-order marker; data rows are still one line each.
 */
export function parseCensusRelationshipFile(raw: string): PipeRow[] {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const firstDataOffset = normalized.search(/^\d+\|/m);
  if (firstDataOffset < 0) {
    throw new Error("Census relationship file contained no tabular rows.");
  }

  const header = normalized
    .slice(0, firstDataOffset)
    .replace(/\n/g, "")
    .split("|")
    .map((column) => column.replace(/^"|"$/g, ""));
  const rows = normalized
    .slice(firstDataOffset)
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const dataRows: string[] = [];
  for (const line of rows) {
    if (line.trim() === "GLOSSARY") break;
    if (!/^\d+\|/.test(line)) {
      throw new Error("Census relationship file contained an unexpected non-data row.");
    }
    dataRows.push(line);
  }

  return dataRows.map((line) => {
    const values = line.split("|").map((value) => value.replace(/^"|"$/g, ""));
    if (values.length !== header.length) {
      throw new Error("Census relationship file row did not match its header.");
    }
    return Object.fromEntries(header.map((column, index) => [column, values[index]]));
  });
}

function requireValue(row: PipeRow, field: string): string {
  const value = row[field];
  if (!value) {
    throw new Error(`Census relationship file is missing required field ${field}.`);
  }
  return value;
}

function addUniqueMapValue(map: Map<string, string>, key: string, value: string, label: string): void {
  const current = map.get(key);
  if (current && current !== value) {
    throw new Error(`Census relationship file has conflicting ${label} values for ${key}.`);
  }
  map.set(key, value);
}

function addSetValue(map: Map<string, Set<string>>, key: string, value: string): void {
  const values = map.get(key) ?? new Set<string>();
  values.add(value);
  map.set(key, values);
}

/**
 * Resolve CDC USALEEP Connecticut legacy tracts to a modern planning-region
 * FIPS identifier through Census relationship tables. No output is produced
 * for zero-target or multi-target source tracts.
 */
export function alignConnecticutUsaleepTracts<T extends ConnecticutSourceTract>(
  sourceByCountyName: ReadonlyMap<string, readonly T[]>,
  relationshipTables: ConnecticutRelationshipTables,
): ConnecticutAlignmentResult<T> {
  const countyToSubdivisionRows = parseCensusRelationshipFile(
    relationshipTables.countyToCountySubdivision,
  );
  const subdivisionToTractRows = parseCensusRelationshipFile(
    relationshipTables.countySubdivisionToTract,
  );
  const tract2020To2010Rows = parseCensusRelationshipFile(
    relationshipTables.tract2020To2010,
  );

  const legacyCountyByNewSubdivision = new Map<string, string>();
  const planningRegionByNewSubdivision = new Map<string, string>();
  for (const row of countyToSubdivisionRows) {
    const countySubdivisionFips = requireValue(row, "COUSUBFP");
    // Census inserts a county-subdivision-not-defined placeholder. It has no
    // tract geometry, and cannot support an assignment.
    if (countySubdivisionFips === "00000") continue;

    const newSubdivisionGeoid = requireValue(row, "NEW_COUSUB_GEOID");
    addUniqueMapValue(
      legacyCountyByNewSubdivision,
      newSubdivisionGeoid,
      `09${requireValue(row, "OLD_COUNTYFP(INCITS31)")}`,
      "legacy county",
    );
    addUniqueMapValue(
      planningRegionByNewSubdivision,
      newSubdivisionGeoid,
      `09${requireValue(row, "NEW_COUNTYFP(INCITS31)")}`,
      "planning region",
    );
  }

  // Key each current tract with the legacy county FIPS that its constituent
  // town carried before the 2022 county-equivalent transition. This avoids
  // treating tract codes as globally unique.
  const planningRegionsBy2020Tract = new Map<string, Set<string>>();
  for (const row of subdivisionToTractRows) {
    const subdivisionGeoid = requireValue(row, "GEOID_COUSUB_22");
    if (subdivisionGeoid.endsWith("00000")) continue;

    const legacyCountyFips = legacyCountyByNewSubdivision.get(subdivisionGeoid);
    const planningRegionFips = planningRegionByNewSubdivision.get(subdivisionGeoid);
    if (!legacyCountyFips || !planningRegionFips) {
      throw new Error(
        `Census town ${subdivisionGeoid} is absent from the Connecticut county-equivalent crosswalk.`,
      );
    }

    const tract22Geoid = requireValue(row, "GEOID_TRACT_22");
    addSetValue(
      planningRegionsBy2020Tract,
      `${legacyCountyFips}${tract22Geoid.slice(-6)}`,
      planningRegionFips,
    );
  }

  const planningRegionsBy2010Tract = new Map<string, Set<string>>();
  for (const row of tract2020To2010Rows) {
    const planningRegions = planningRegionsBy2020Tract.get(
      requireValue(row, "GEOID_TRACT_20"),
    );
    if (!planningRegions) continue;

    const tract10Geoid = requireValue(row, "GEOID_TRACT_10");
    for (const planningRegionFips of planningRegions) {
      addSetValue(planningRegionsBy2010Tract, tract10Geoid, planningRegionFips);
    }
  }

  const byPlanningRegionFips = new Map<string, T[]>();
  let sourceTracts = 0;
  let resolvedSourceTracts = 0;
  let boundarySpanningSourceTracts = 0;
  let unresolvableSourceTracts = 0;
  let invalidSourceTracts = 0;

  for (const [sourceCountyName, sourceTractsForCounty] of sourceByCountyName) {
    const legacyCountyFips = CONNECTICUT_LEGACY_COUNTY_FIPS_BY_USALEEP_NAME[sourceCountyName];
    if (!legacyCountyFips) continue;

    for (const sourceTract of sourceTractsForCounty) {
      sourceTracts++;
      if (!/^\d{4}\.\d{2}$/.test(sourceTract.tractFips)) {
        invalidSourceTracts++;
        continue;
      }

      const tract10Geoid = `${legacyCountyFips}${sourceTract.tractFips.replace(".", "")}`;
      const planningRegions = planningRegionsBy2010Tract.get(tract10Geoid);
      if (!planningRegions || planningRegions.size === 0) {
        unresolvableSourceTracts++;
        continue;
      }
      if (planningRegions.size > 1) {
        boundarySpanningSourceTracts++;
        continue;
      }

      const planningRegionFips = [...planningRegions][0];
      const resolved = byPlanningRegionFips.get(planningRegionFips) ?? [];
      resolved.push(sourceTract);
      byPlanningRegionFips.set(planningRegionFips, resolved);
      resolvedSourceTracts++;
    }
  }

  return {
    byPlanningRegionFips,
    report: {
      sourceTracts,
      resolvedSourceTracts,
      boundarySpanningSourceTracts,
      unresolvableSourceTracts,
      invalidSourceTracts,
      planningRegionsWithResolvedTracts: [...byPlanningRegionFips.keys()].sort(),
    },
  };
}