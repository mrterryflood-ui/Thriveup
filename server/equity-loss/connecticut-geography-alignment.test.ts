import assert from "node:assert/strict";
import test from "node:test";
import {
  alignConnecticutUsaleepTracts,
  parseCensusRelationshipFile,
} from "./connecticut-geography-alignment";
import {
  fetchUsaleepTractsForCounty,
  resolveUsaleepTractsForCounty,
  type UsaleepTractIndex,
} from "./usaleep-source";

const COUNTY_TO_SUBDIVISION = `\uFEFF"STATEFP
(INCITS38)"|"OLD_COUNTYFP
(INCITS31)"|OLD_COUNTY_NAMELSAD|"NEW_COUNTYFP
(INCITS31)"|NEW_COUNTY_NAMELSAD|COUSUBFP|OLD_COUSUB_GEOID|NEW_COUSUB_GEOID|COUSUB_NAMELSAD
09|001|Fairfield County|110|Capitol Planning Region|00001|0900100001|0911000001|Example town
09|001|Fairfield County|120|Greater Bridgeport Planning Region|00002|0900100002|0912000002|Boundary town
09|001|Fairfield County|110|Capitol Planning Region|00003|0900100003|0911000003|Second boundary town
09|001|Fairfield County|110|Capitol Planning Region|00000|0900100000|0911000000|County subdivisions not defined

   
GLOSSARY
STATEFP = State FIPS Code
`;

const SUBDIVISION_TO_TRACT = `GEOID_COUSUB_22|GEOID_TRACT_22
0911000001|09110528100
0912000002|09120528200
0911000003|09110528200
0911000000|09110000000
`;

const TRACT_2020_TO_2010 = `GEOID_TRACT_20|GEOID_TRACT_10
09001528100|09001010101
09001528200|09001010202
`;

test("normalizes Census's BOM and multi-line quoted relationship header", () => {
  const rows = parseCensusRelationshipFile(COUNTY_TO_SUBDIVISION);
  assert.equal(rows.length, 4);
  assert.equal(rows[0]["OLD_COUNTYFP(INCITS31)"], "001");
  assert.equal(rows[0]["NEW_COUNTYFP(INCITS31)"], "110");
});

test("assigns only uniquely resolved USALEEP tracts to Connecticut Planning Regions", () => {
  const sourceRows = new Map([
    [
      "Fairfield County, CT",
      [
        { tractFips: "0101.01", lifeExpectancy: 80.1, standardError: 0.1 },
        { tractFips: "0102.02", lifeExpectancy: 79.5, standardError: 0.2 },
        { tractFips: "9999.99", lifeExpectancy: 75.2, standardError: 0.3 },
        { tractFips: "not-a-tract", lifeExpectancy: 75.2, standardError: 0.3 },
      ],
    ],
  ]);

  const result = alignConnecticutUsaleepTracts(sourceRows, {
    countyToCountySubdivision: COUNTY_TO_SUBDIVISION,
    countySubdivisionToTract: SUBDIVISION_TO_TRACT,
    tract2020To2010: TRACT_2020_TO_2010,
  });

  assert.deepEqual(result.byPlanningRegionFips.get("09110")?.map((row) => row.tractFips), [
    "0101.01",
  ]);
  assert.equal(result.byPlanningRegionFips.get("09120"), undefined);
  assert.deepEqual(result.report, {
    sourceTracts: 4,
    resolvedSourceTracts: 1,
    boundarySpanningSourceTracts: 1,
    unresolvableSourceTracts: 1,
    invalidSourceTracts: 1,
    planningRegionsWithResolvedTracts: ["09110"],
  });
});

test("never falls back to a legacy Connecticut county name without Planning-Region FIPS proof", async () => {
  const legacyRows = [{ tractFips: "0101.01", lifeExpectancy: 80.1, standardError: 0.1 }];
  const index: UsaleepTractIndex = {
    bySourceCountyName: new Map([
      ["Fairfield County, CT", legacyRows],
      ["Middlesex County, MA", legacyRows],
    ]),
    byCountyFips: new Map([["09110", legacyRows]]),
    connecticutAlignment: {
      status: "resolved",
      report: {
        sourceTracts: 1,
        resolvedSourceTracts: 1,
        boundarySpanningSourceTracts: 0,
        unresolvableSourceTracts: 0,
        invalidSourceTracts: 0,
        planningRegionsWithResolvedTracts: ["09110"],
      },
    },
  };

  assert.deepEqual(
    resolveUsaleepTractsForCounty(index, {
      countyFips: "09001",
      countyName: "Fairfield County",
      stateAbbrev: "CT",
    }),
    [],
  );
  assert.deepEqual(
    resolveUsaleepTractsForCounty(index, {
      countyFips: "09110",
      countyName: "Capitol Planning Region",
      stateAbbrev: "CT",
    }),
    legacyRows,
  );
  assert.deepEqual(
    resolveUsaleepTractsForCounty(index, {
      countyFips: "25017",
      countyName: "Middlesex County",
      stateAbbrev: "MA",
    }),
    legacyRows,
  );

  const alignedDirectRows = await fetchUsaleepTractsForCounty(
    {
      countyFips: "09110",
      countyName: "Capitol Planning Region",
      stateAbbrev: "CT",
    },
    { loadConnecticutAlignedIndex: async () => index },
  );
  assert.deepEqual(alignedDirectRows, legacyRows);

  const unprovenDirectRows = await fetchUsaleepTractsForCounty(
    {
      countyFips: "09001",
      countyName: "Fairfield County",
      stateAbbrev: "CT",
    },
    { loadConnecticutAlignedIndex: async () => index },
  );
  assert.deepEqual(unprovenDirectRows, []);
});