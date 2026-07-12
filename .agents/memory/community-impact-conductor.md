---
name: Community Impact Conductor
description: Unified community story surface — any ZIP/city/county → 10 social-domain scores, 25-year forward cascade, historical counterfactual (multi-vintage ACS), 5 vanilla Three.js viz tabs, verdict hero, PDF invoice, side-by-side comparison.
---

## What it is
`server/conductor-routes.ts` + `client/src/pages/community-impact.tsx`

Two endpoints:
- `POST /api/conductor/community-brief` — full community brief for one geography
- `POST /api/conductor/compare` — side-by-side multi-geography comparison

## Key import rules (caused startup failure)
- `db` must come from `"./storage"` — NOT `"./db"` (that path doesn't exist)
- Schema tables must come from `"@shared/schema"` — NOT `"../shared/schema"`

## JURISDICTION_DATA shape (caused logic failure)
Flat records, NOT a `.policies` array. Fields: `state, topic, policyName, outcome, evidenceSummary`.
`getPolicyContext()` filters by state + categorizes by `outcome` field.
Never access `.record` or `.nationalRanking` — those fields don't exist.

## API response field names (caused silent mismatches)
- `overallScore` / `overallGrade` (not score/grade)
- `cascade.interventionCost` (not investmentCost)
- `systemsScores.healthAccess` (not health)
- `cascade.timeline` nodes are narrative strings (without/with) not numbers
- `historicalCascade` — multi-vintage ACS historical cost (see below)

## 3D Viz — CRITICAL: NEVER reinstall @react-three/fiber or @react-three/drei
They crash the app with "multiple copies of React" in React 18.3.x + Vite.
All viz components are vanilla Three.js: `useEffect + useRef + WebGLRenderer on div`.
`vite.config.ts` has `resolve.dedupe: ['react', 'react-dom', 'react-dom/client']` — do NOT remove.

## Five viz tabs
1. skyline — SkylineMap.tsx — neighbor ZIPs, height = cost of inaction
2. cascade — CascadeWaterfall.tsx — narrative timeline nodes (string shape)
3. web — DomainWeb.tsx — domain score connections
4. particles — ParticleFlow.tsx — invest vs. don't population flow
5. historical — HistoricalTimeline.tsx — ACS multi-vintage bar chart, NOW divider

## Historical cascade — what has ALREADY been paid

### Census ACS multi-vintage ZCTA query quirk (CRITICAL)
Pre-2022 ACS vintages (2013, 2015, 2019) return `error: ambiguous geography` for
bare ZCTA queries. **Must add `&in=state:{FIPS}`**.

- 2022: works without qualifier
- 2019, 2015, 2013: requires `&in=state:48` (TX example) — wildcard `&in=state:*` also fails

### How to get state FIPS reliably
`stateFipsFromZip(zip)` — ZIP range lookup table covering all 50 states + DC + PR.
Called as: `stateFips || stateFipsFromName(stateName) || stateFipsFromZip(zip)`.
When ZIP routes through `fetchZctaData` (no tract-level geo), stateFips is empty and
stateName is bare ZIP, so ZIP range lookup is the definitive fallback.

**Why:** The Census API changed its ZCTA geography hierarchy between survey years.
**How to apply:** Always pass stateFips to any function that fetches older ACS vintages.

### Census API error response detection
Census errors return plain string (e.g. `error: ambiguous...`) — `resp.json()` throws.
Safe detection: `Array.isArray(data) && Array.isArray(data[0]) && data[1]`.

### historicalCascade shape in community-brief response
```typescript
historicalCascade: {
  vintages: Array<{ year, povertyRate, unemploymentRate, cohortCost }>;
  totalAccumulatedCost: number;
  trendDirection: "improving" | "stagnant" | "worsening";
  yearsAboveCrisisThreshold: number;
  keyInsight: string;
  yearsOfData: number;
}
```
Vintages: 2013, 2015, 2019, 2022. Chain model (ECE→dropout→incarceration, MH→homelessness)
applied per cohort with years-elapsed maturity factor. BRIEF_CENSUS_KEY defined inline.

### Real results (spot-check for correctness)
- 78741 Austin TX: 4 vintages, $15.89M accumulated, improving (41.5% → 24.2% poverty)
- 76707 Waco TX:   4 vintages, $16.47M accumulated, worsening (30.3% → 34.3% poverty)
