import type { Express } from "express";
import PDFDocument from "pdfkit";
import PptxGenJSModule from "pptxgenjs";
const PptxGenJS = (PptxGenJSModule as any).default || PptxGenJSModule;
import { db } from "./storage";
import { grantOpportunities } from "@shared/schema";
import { desc, isNotNull } from "drizzle-orm";

const CENSUS_ACS_URL = "https://api.census.gov/data/2022/acs/acs5";
const CENSUS_GEOCODER_URL = "https://geocoding.geo.census.gov/geocoder/geographies/address";

const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT',
  '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL',
  '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD',
  '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE',
  '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV',
  '55': 'WI', '56': 'WY',
};

const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
  'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
  'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
  'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia',
  'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
};

async function fetchJson(url: string, timeoutMs = 12000): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json();
}

interface NeighborhoodProfile {
  zipCode: string;
  neighborhoodName: string;
  stateFips: string;
  stateAbbr: string;
  stateName: string;
  countyFips: string;
  countyName: string;
  tractFips: string;
  tractName: string;
  population: number;
  medianIncome: number;
  indicators: {
    povertyRate: number;
    unemploymentRate: number;
    noHighSchoolDiploma: number;
    uninsuredRate: number;
    age65Plus: number;
    ageUnder17: number;
    disabilityRate: number;
    singleParentRate: number;
    limitedEnglish: number;
    minorityPct: number;
    multiUnitHousing: number;
    overcrowding: number;
    noVehicle: number;
    noBroadband: number;
    snapRecipients: number;
  };
  sviScore: number;
  themes: {
    socioeconomic: number;
    household: number;
    minority: number;
    housingTransport: number;
  };
  goingWell: { label: string; detail: string; value: number }[];
  needsAttention: { label: string; detail: string; value: number; solution: string }[];
  generatedAt: string;
}

async function resolveLocationToZip(locationText: string): Promise<{ zip: string; displayName: string } | null> {
  const trimmed = locationText.trim();
  if (/^\d{5}$/.test(trimmed)) return { zip: trimmed, displayName: trimmed };

  try {
    const onelineUrl = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(trimmed)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const data = await fetchJson(onelineUrl);
    const match = data?.result?.addressMatches?.[0];
    if (match) {
      const addr = match.matchedAddress || trimmed;
      const zipMatch = addr.match(/\b(\d{5})\b/);
      if (zipMatch) return { zip: zipMatch[1], displayName: addr };
      if (match.coordinates) {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${match.coordinates.y}&lon=${match.coordinates.x}&format=json&addressdetails=1&zoom=18`;
        try {
          const revResp = await fetch(revUrl, { headers: { Accept: "application/json", "User-Agent": "ThriveUpAcademy/1.0" } });
          if (revResp.ok) {
            const revData = await revResp.json() as any;
            const pc = revData?.address?.postcode;
            if (pc) {
              const z5 = pc.match(/(\d{5})/)?.[1];
              if (z5) return { zip: z5, displayName: addr };
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.log("Oneline geocoder attempt for:", trimmed);
  }

  const variations = [
    trimmed,
    `${trimmed}, TX`,
    `${trimmed}, US`,
  ];
  for (const addr of variations) {
    try {
      const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(addr)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      const data = await fetchJson(url);
      const match = data?.result?.addressMatches?.[0];
      if (match) {
        const matchedAddr = match.matchedAddress || addr;
        const zipMatch = matchedAddr.match(/\b(\d{5})\b/);
        if (zipMatch) return { zip: zipMatch[1], displayName: matchedAddr };
      }
    } catch {}
  }

  try {
    const headers = { Accept: "application/json", "User-Agent": "ThriveUpAcademy/1.0" };
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed + ", USA")}&format=json&addressdetails=1&limit=1`;
    const nomResp = await fetch(nominatimUrl, { headers });
    if (nomResp.ok) {
      const nomData = await nomResp.json() as any[];
      if (Array.isArray(nomData) && nomData.length > 0) {
        const result = nomData[0];
        const postcode = result.address?.postcode;
        if (postcode) {
          const zip5 = postcode.match(/(\d{5})/)?.[1];
          if (zip5) return { zip: zip5, displayName: result.display_name || trimmed };
        }

        if (result.lat && result.lon) {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${result.lat}&lon=${result.lon}&format=json&addressdetails=1&zoom=18`;
          const revResp = await fetch(revUrl, { headers });
          if (revResp.ok) {
            const revData = await revResp.json() as any;
            const revPostcode = revData?.address?.postcode;
            if (revPostcode) {
              const zip5 = revPostcode.match(/(\d{5})/)?.[1];
              if (zip5) return { zip: zip5, displayName: result.display_name || trimmed };
            }
          }
        }
      }
    }
  } catch (err) {
    console.log("Nominatim fallback attempt for:", trimmed);
  }

  return null;
}

async function zipToGeography(zipCode: string): Promise<{ stateFips: string; countyFips: string; tractFips: string; countyName: string; isZcta: boolean } | null> {
  try {
    const url = `${CENSUS_GEOCODER_URL}?street=1+Main+St&zip=${zipCode}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const data = await fetchJson(url);
    const match = data?.result?.addressMatches?.[0];
    if (match) {
      const geo = match.geographies?.["Census Tracts"]?.[0];
      if (geo) {
        return {
          stateFips: geo.STATE,
          countyFips: geo.COUNTY,
          tractFips: geo.TRACT,
          countyName: geo.NAME || `County ${geo.COUNTY}`,
          isZcta: false,
        };
      }
    }
  } catch (err) {
    console.log("Geocoder fallback for ZIP:", zipCode);
  }

  // If the address geocoder didn't match, treat the ZIP as a ZCTA directly.
  // fetchZctaData will confirm whether ACS5 data exists for it; if not, the
  // caller returns a proper 404 rather than this function returning null.
  return { stateFips: "", countyFips: "", tractFips: "", countyName: "", isZcta: true };
}

export async function fetchZctaData(zipCode: string): Promise<any> {
  const censusKey = process.env.CENSUS_API_KEY || "";
  const keyParam = censusKey ? `&key=${censusKey}` : "";

  const vars1 = [
    "NAME", "B01003_001E", "B19013_001E",
    "B17001_002E", "B17001_001E",
    "B23025_005E", "B23025_003E",
    "B15003_001E", "B15003_017E", "B15003_018E", "B15003_021E", "B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E",
    "B27001_001E", "B27001_005E", "B27001_008E", "B27001_011E", "B27001_033E", "B27001_036E", "B27001_039E",
    "B11001_001E", "B11001_006E",
    "B01001_020E", "B01001_021E", "B01001_022E", "B01001_023E", "B01001_024E", "B01001_025E",
    "B01001_044E", "B01001_045E", "B01001_046E", "B01001_047E", "B01001_048E", "B01001_049E",
    "B01001_003E", "B01001_004E", "B01001_005E", "B01001_006E",
    "B01001_027E", "B01001_028E", "B01001_029E", "B01001_030E",
  ].join(",");

  const vars2 = [
    "NAME",
    "B18101_001E", "B18101_004E", "B18101_007E", "B18101_010E", "B18101_013E", "B18101_016E", "B18101_019E",
    "B18101_023E", "B18101_026E", "B18101_029E", "B18101_032E", "B18101_035E", "B18101_038E",
    "B16004_001E", "B16004_025E", "B16004_047E",
    "B03002_001E", "B03002_003E",
    "B25024_001E", "B25024_007E", "B25024_008E", "B25024_009E", "B25024_010E",
    "B25014_001E", "B25014_005E", "B25014_006E", "B25014_007E", "B25014_011E", "B25014_012E", "B25014_013E",
    "B08141_001E", "B08141_002E",
    "B26001_001E",
    "B28002_001E", "B28002_013E",
    "B22001_001E", "B22001_002E",
  ].join(",");

  const zctaGeo = `zip%20code%20tabulation%20area:${zipCode}`;
  const url1 = `${CENSUS_ACS_URL}?get=${vars1}&for=${zctaGeo}${keyParam}`;
  const url2 = `${CENSUS_ACS_URL}?get=${vars2}&for=${zctaGeo}${keyParam}`;

  const [data1, data2] = await Promise.all([
    fetchJson(url1).catch(() => null),
    fetchJson(url2).catch(() => null),
  ]);

  if (!data1 || !Array.isArray(data1) || data1.length < 2) return null;

  const h1 = data1[0] as string[];
  const r1 = data1[1] as string[];
  const h2 = Array.isArray(data2) && data2.length > 1 ? data2[0] as string[] : [];
  const r2 = Array.isArray(data2) && data2.length > 1 ? data2[1] as string[] : [];

  const v = (name: string) => { const i = h1.indexOf(name); return i >= 0 ? parseInt(r1[i]) || 0 : 0; };
  const v2 = (name: string) => { const i = h2.indexOf(name); return i >= 0 ? parseInt(r2[i]) || 0 : 0; };

  return processIndicators(v, v2, `ZCTA5 ${zipCode}`, `ZIP Code ${zipCode} Area`);
}

function processIndicators(v: (n: string) => number, v2: (n: string) => number, tractName: string, countyName: string): any {
  const totalPop = v("B01003_001E");
  const medianIncome = v("B19013_001E");

  const belowPov = v("B17001_002E");
  const povUniverse = v("B17001_001E");
  const povertyRate = povUniverse > 0 ? (belowPov / povUniverse) * 100 : 0;

  const unemployed = v("B23025_005E");
  const laborForce = v("B23025_003E");
  const unemploymentRate = laborForce > 0 ? (unemployed / laborForce) * 100 : 0;

  const eduTotal = v("B15003_001E");
  const hsOrHigher = v("B15003_017E") + v("B15003_018E") + v("B15003_021E") +
                     v("B15003_022E") + v("B15003_023E") + v("B15003_024E") + v("B15003_025E");
  const noHsDpPct = eduTotal > 0 ? ((eduTotal - hsOrHigher) / eduTotal) * 100 : 0;

  const insTotal = v("B27001_001E");
  const uninsured = v("B27001_005E") + v("B27001_008E") + v("B27001_011E") +
                    v("B27001_033E") + v("B27001_036E") + v("B27001_039E");
  const uninsuredRate = insTotal > 0 ? (uninsured / insTotal) * 100 : 0;

  const age65plus = v("B01001_020E") + v("B01001_021E") + v("B01001_022E") +
                    v("B01001_023E") + v("B01001_024E") + v("B01001_025E") +
                    v("B01001_044E") + v("B01001_045E") + v("B01001_046E") +
                    v("B01001_047E") + v("B01001_048E") + v("B01001_049E");
  const age65Pct = totalPop > 0 ? (age65plus / totalPop) * 100 : 0;

  const age17under = v("B01001_003E") + v("B01001_004E") + v("B01001_005E") + v("B01001_006E") +
                     v("B01001_027E") + v("B01001_028E") + v("B01001_029E") + v("B01001_030E");
  const age17Pct = totalPop > 0 ? (age17under / totalPop) * 100 : 0;

  const singleParent = v("B11001_006E");
  const totalHH = v("B11001_001E");
  const sngpntPct = totalHH > 0 ? (singleParent / totalHH) * 100 : 0;

  const disabTotal = v2("B18101_001E");
  const disabled = v2("B18101_004E") + v2("B18101_007E") + v2("B18101_010E") +
                   v2("B18101_013E") + v2("B18101_016E") + v2("B18101_019E") +
                   v2("B18101_023E") + v2("B18101_026E") + v2("B18101_029E") +
                   v2("B18101_032E") + v2("B18101_035E") + v2("B18101_038E");
  const disablPct = disabTotal > 0 ? (disabled / disabTotal) * 100 : 0;

  const langTotal = v2("B16004_001E");
  const langLimited = v2("B16004_025E") + v2("B16004_047E");
  const limengPct = langTotal > 0 ? (langLimited / langTotal) * 100 : 0;

  const raceTotal = v2("B03002_001E");
  const whiteNH = v2("B03002_003E");
  const minorityPct = raceTotal > 0 ? ((raceTotal - whiteNH) / raceTotal) * 100 : 0;

  const housingTotal = v2("B25024_001E");
  const multiUnit = v2("B25024_007E") + v2("B25024_008E") + v2("B25024_009E") + v2("B25024_010E");
  const munitPct = housingTotal > 0 ? (multiUnit / housingTotal) * 100 : 0;

  const crowdTotal = v2("B25014_001E");
  const crowded = v2("B25014_005E") + v2("B25014_006E") + v2("B25014_007E") +
                  v2("B25014_011E") + v2("B25014_012E") + v2("B25014_013E");
  const crowdPct = crowdTotal > 0 ? (crowded / crowdTotal) * 100 : 0;

  const commuteTotal = v2("B08141_001E");
  const noVehicle = v2("B08141_002E");
  const novehPct = commuteTotal > 0 ? (noVehicle / commuteTotal) * 100 : 0;

  const internetTotal = v2("B28002_001E");
  const noInternet = v2("B28002_013E");
  const noBroadbandPct = internetTotal > 0 ? (noInternet / internetTotal) * 100 : 0;

  const snapUniverse = v2("B22001_001E");
  const snapRecipients = v2("B22001_002E");
  const snapPct = snapUniverse > 0 ? (snapRecipients / snapUniverse) * 100 : 0;

  const groupQ = v2("B26001_001E");
  const groupqPct = totalPop > 0 ? (groupQ / totalPop) * 100 : 0;

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const theme1 = (povertyRate / 50 + unemploymentRate / 30 + noHsDpPct / 40 + uninsuredRate / 30) / 4;
  const theme2 = (age65Pct / 30 + age17Pct / 35 + disablPct / 25 + sngpntPct / 50 + limengPct / 30) / 5;
  const theme3 = minorityPct / 100;
  const theme4 = (munitPct / 50 + 0 + crowdPct / 15 + novehPct / 30 + groupqPct / 10) / 5;
  const sviScore = clamp((theme1 + theme2 + theme3 + theme4) / 4);

  const r = (n: number) => Math.round(n * 10) / 10;

  const goingWell: { label: string; detail: string; value: number }[] = [];
  const needsAttention: { label: string; detail: string; value: number; solution: string }[] = [];

  if (povertyRate < 10) goingWell.push({ label: "Low Poverty Rate", detail: `Only ${r(povertyRate)}% of residents live below the poverty line — well below the national average of 12.4%.`, value: r(povertyRate) });
  else if (povertyRate > 20) needsAttention.push({ label: "Elevated Poverty Rate", detail: `${r(povertyRate)}% of residents live below the poverty line, above the national average of 12.4%.`, value: r(povertyRate), solution: "Connect with local workforce development programs, SNAP benefits, Earned Income Tax Credit (EITC) assistance, and community development financial institutions (CDFIs) for financial coaching." });

  if (unemploymentRate < 4) goingWell.push({ label: "Strong Employment", detail: `The unemployment rate is ${r(unemploymentRate)}%, indicating near-full employment and a healthy local job market.`, value: r(unemploymentRate) });
  else if (unemploymentRate > 8) needsAttention.push({ label: "High Unemployment", detail: `${r(unemploymentRate)}% unemployment rate exceeds the national average.`, value: r(unemploymentRate), solution: "Explore apprenticeship programs, workforce training grants, WIOA-funded career services, and employer incentive programs for local hiring." });

  if (noHsDpPct < 10) goingWell.push({ label: "High Educational Attainment", detail: `${r(100 - noHsDpPct)}% of adults have at least a high school diploma — strong educational foundation.`, value: r(noHsDpPct) });
  else if (noHsDpPct > 15) needsAttention.push({ label: "Educational Attainment Gap", detail: `${r(noHsDpPct)}% of adults lack a high school diploma. This correlates with reduced lifetime earnings and health outcomes.`, value: r(noHsDpPct), solution: "GED programs, adult education centers, community college bridge programs, and digital literacy initiatives can close this gap. ThriveUp Academy offers free online coursework." });

  if (uninsuredRate < 5) goingWell.push({ label: "Strong Insurance Coverage", detail: `${r(100 - uninsuredRate)}% of residents have health insurance — excellent coverage.`, value: r(uninsuredRate) });
  else if (uninsuredRate > 12) needsAttention.push({ label: "Insurance Coverage Gap", detail: `${r(uninsuredRate)}% of residents lack health insurance, limiting access to preventive care.`, value: r(uninsuredRate), solution: "ACA Marketplace enrollment assistance, Medicaid expansion navigation, FQHC (community health center) services, and community health worker outreach." });

  if (novehPct < 5) goingWell.push({ label: "Transportation Access", detail: `${r(100 - novehPct)}% of workers have vehicle access, enabling mobility to jobs and services.`, value: r(novehPct) });
  else if (novehPct > 15) needsAttention.push({ label: "Transportation Barrier", detail: `${r(novehPct)}% of workers lack vehicle access, creating barriers to employment and healthcare.`, value: r(novehPct), solution: "Advocate for transit route expansion, rideshare programs, employer shuttle services, and telehealth/remote work options." });

  if (noBroadbandPct < 10) goingWell.push({ label: "Digital Connectivity", detail: `${r(100 - noBroadbandPct)}% of households have internet access — strong digital infrastructure.`, value: r(noBroadbandPct) });
  else if (noBroadbandPct > 25) needsAttention.push({ label: "Digital Divide", detail: `${r(noBroadbandPct)}% of households lack broadband access, limiting educational and economic opportunities.`, value: r(noBroadbandPct), solution: "FCC Affordable Connectivity Program, library hotspot lending, community Wi-Fi initiatives, and digital inclusion grants." });

  if (sngpntPct < 15) goingWell.push({ label: "Family Stability", detail: `${r(100 - sngpntPct)}% of households are two-parent or non-single-parent, indicating family stability.`, value: r(sngpntPct) });
  else if (sngpntPct > 35) needsAttention.push({ label: "Single-Parent Household Rate", detail: `${r(sngpntPct)}% of households are headed by single parents, often indicating need for additional family support.`, value: r(sngpntPct), solution: "Subsidized childcare programs, Head Start, after-school programs, co-parenting resources, and family resource centers." });

  if (disablPct < 10) goingWell.push({ label: "Low Disability Prevalence", detail: `The disability rate of ${r(disablPct)}% suggests accessible healthcare and preventive services.`, value: r(disablPct) });
  else if (disablPct > 15) needsAttention.push({ label: "Disability Support Needs", detail: `${r(disablPct)}% of the population has a disability, requiring accessible services and accommodations.`, value: r(disablPct), solution: "ADA compliance advocacy, vocational rehabilitation services, assistive technology programs, and inclusive employment initiatives." });

  if (limengPct < 5) goingWell.push({ label: "Language Accessibility", detail: `Most residents are English-proficient, reducing barriers to services and employment.`, value: r(limengPct) });
  else if (limengPct > 10) needsAttention.push({ label: "Language Access Needs", detail: `${r(limengPct)}% of residents have limited English proficiency, creating barriers to services.`, value: r(limengPct), solution: "Multilingual service navigation, ESL programs, interpreter services at public agencies, and culturally competent community health workers." });

  if (crowdPct < 3) goingWell.push({ label: "Adequate Housing", detail: `Low overcrowding rate of ${r(crowdPct)}% indicates adequate housing stock.`, value: r(crowdPct) });
  else if (crowdPct > 5) needsAttention.push({ label: "Housing Overcrowding", detail: `${r(crowdPct)}% of housing units are overcrowded (>1 person per room), indicating housing supply issues.`, value: r(crowdPct), solution: "Affordable housing development, Section 8 voucher programs, community land trusts, and housing counseling services." });

  if (snapPct < 8) goingWell.push({ label: "Low Food Assistance Need", detail: `Only ${r(snapPct)}% of households receive SNAP benefits, indicating food security.`, value: r(snapPct) });
  else if (snapPct > 20) needsAttention.push({ label: "Food Security Concerns", detail: `${r(snapPct)}% of households receive SNAP benefits, indicating widespread food insecurity.`, value: r(snapPct), solution: "Food bank partnerships, community gardens, SNAP education, WIC enrollment, and school meal program expansion." });

  if (medianIncome > 75000) goingWell.push({ label: "Strong Median Income", detail: `Median household income of $${medianIncome.toLocaleString()} exceeds the national median, indicating economic stability.`, value: medianIncome });
  else if (medianIncome < 40000 && medianIncome > 0) needsAttention.push({ label: "Low Median Income", detail: `Median household income of $${medianIncome.toLocaleString()} is below the national median of $74,580.`, value: medianIncome, solution: "Financial literacy programs, workforce upskilling, microenterprise development, and Individual Development Account (IDA) programs." });

  return {
    countyName,
    tractName,
    population: totalPop,
    medianIncome,
    indicators: {
      povertyRate: r(povertyRate),
      unemploymentRate: r(unemploymentRate),
      noHighSchoolDiploma: r(noHsDpPct),
      uninsuredRate: r(uninsuredRate),
      age65Plus: r(age65Pct),
      ageUnder17: r(age17Pct),
      disabilityRate: r(disablPct),
      singleParentRate: r(sngpntPct),
      limitedEnglish: r(limengPct),
      minorityPct: r(minorityPct),
      multiUnitHousing: r(munitPct),
      overcrowding: r(crowdPct),
      noVehicle: r(novehPct),
      noBroadband: r(noBroadbandPct),
      snapRecipients: r(snapPct),
    },
    sviScore: Math.round(sviScore * 1000) / 1000,
    themes: {
      socioeconomic: Math.round(clamp(theme1) * 1000) / 1000,
      household: Math.round(clamp(theme2) * 1000) / 1000,
      minority: Math.round(clamp(theme3) * 1000) / 1000,
      housingTransport: Math.round(clamp(theme4) * 1000) / 1000,
    },
    goingWell,
    needsAttention,
  };
}

export async function fetchNeighborhoodData(stateFips: string, countyFips: string, tractFips: string): Promise<any> {
  const censusKey = process.env.CENSUS_API_KEY || "";
  const keyParam = censusKey ? `&key=${censusKey}` : "";

  const vars1 = [
    "NAME", "B01003_001E", "B19013_001E",
    "B17001_002E", "B17001_001E",
    "B23025_005E", "B23025_003E",
    "B15003_001E", "B15003_017E", "B15003_018E", "B15003_021E", "B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E",
    "B27001_001E", "B27001_005E", "B27001_008E", "B27001_011E", "B27001_033E", "B27001_036E", "B27001_039E",
    "B11001_001E", "B11001_006E",
    "B01001_020E", "B01001_021E", "B01001_022E", "B01001_023E", "B01001_024E", "B01001_025E",
    "B01001_044E", "B01001_045E", "B01001_046E", "B01001_047E", "B01001_048E", "B01001_049E",
    "B01001_003E", "B01001_004E", "B01001_005E", "B01001_006E",
    "B01001_027E", "B01001_028E", "B01001_029E", "B01001_030E",
  ].join(",");

  const vars2 = [
    "NAME",
    "B18101_001E", "B18101_004E", "B18101_007E", "B18101_010E", "B18101_013E", "B18101_016E", "B18101_019E",
    "B18101_023E", "B18101_026E", "B18101_029E", "B18101_032E", "B18101_035E", "B18101_038E",
    "B16004_001E", "B16004_025E", "B16004_047E",
    "B03002_001E", "B03002_003E",
    "B25024_001E", "B25024_007E", "B25024_008E", "B25024_009E", "B25024_010E",
    "B25014_001E", "B25014_005E", "B25014_006E", "B25014_007E", "B25014_011E", "B25014_012E", "B25014_013E",
    "B08141_001E", "B08141_002E",
    "B26001_001E",
    "B28002_001E", "B28002_013E",
    "B22001_001E", "B22001_002E",
  ].join(",");

  const url1 = `${CENSUS_ACS_URL}?get=${vars1}&for=tract:${tractFips}&in=state:${stateFips}+county:${countyFips}${keyParam}`;
  const url2 = `${CENSUS_ACS_URL}?get=${vars2}&for=tract:${tractFips}&in=state:${stateFips}+county:${countyFips}${keyParam}`;
  const countyVarsUrl = `${CENSUS_ACS_URL}?get=NAME&for=county:${countyFips}&in=state:${stateFips}${keyParam}`;

  const [data1, data2, countyData] = await Promise.all([
    fetchJson(url1).catch(() => null),
    fetchJson(url2).catch(() => null),
    fetchJson(countyVarsUrl).catch(() => null),
  ]);

  let countyName = `County ${countyFips}`;
  if (Array.isArray(countyData) && countyData.length > 1) {
    const nameIdx = (countyData[0] as string[]).indexOf("NAME");
    if (nameIdx >= 0) countyName = countyData[1][nameIdx] as string;
  }

  if (!data1 || !Array.isArray(data1) || data1.length < 2) return null;

  const h1 = data1[0] as string[];
  const r1 = data1[1] as string[];
  const h2 = Array.isArray(data2) && data2.length > 1 ? data2[0] as string[] : [];
  const r2 = Array.isArray(data2) && data2.length > 1 ? data2[1] as string[] : [];

  const v = (name: string) => { const i = h1.indexOf(name); return i >= 0 ? parseInt(r1[i]) || 0 : 0; };
  const v2 = (name: string) => { const i = h2.indexOf(name); return i >= 0 ? parseInt(r2[i]) || 0 : 0; };
  const tractName = r1[h1.indexOf("NAME")] || `Census Tract`;

  return processIndicators(v, v2, tractName, countyName);
}

function applyScenario(profile: NeighborhoodProfile, adjustments: Record<string, number>): NeighborhoodProfile {
  const p = JSON.parse(JSON.stringify(profile)) as NeighborhoodProfile;
  const ind = p.indicators;

  if (adjustments.povertyChange) ind.povertyRate = Math.max(0, ind.povertyRate * (1 + adjustments.povertyChange / 100));
  if (adjustments.unemploymentChange) ind.unemploymentRate = Math.max(0, ind.unemploymentRate * (1 + adjustments.unemploymentChange / 100));
  if (adjustments.educationChange) ind.noHighSchoolDiploma = Math.max(0, ind.noHighSchoolDiploma * (1 + adjustments.educationChange / 100));
  if (adjustments.insuranceChange) ind.uninsuredRate = Math.max(0, ind.uninsuredRate * (1 + adjustments.insuranceChange / 100));
  if (adjustments.transportChange) ind.noVehicle = Math.max(0, ind.noVehicle * (1 + adjustments.transportChange / 100));
  if (adjustments.broadbandChange) ind.noBroadband = Math.max(0, ind.noBroadband * (1 + adjustments.broadbandChange / 100));
  if (adjustments.crimeChange) {}
  if (adjustments.graduationChange) ind.noHighSchoolDiploma = Math.max(0, ind.noHighSchoolDiploma * (1 - (adjustments.graduationChange || 0) / 100));

  const r = (n: number) => Math.round(n * 10) / 10;
  Object.keys(ind).forEach(k => { (ind as any)[k] = r((ind as any)[k]); });

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const t1 = (ind.povertyRate / 50 + ind.unemploymentRate / 30 + ind.noHighSchoolDiploma / 40 + ind.uninsuredRate / 30) / 4;
  const t2 = (ind.age65Plus / 30 + ind.ageUnder17 / 35 + ind.disabilityRate / 25 + ind.singleParentRate / 50 + ind.limitedEnglish / 30) / 5;
  const t3 = ind.minorityPct / 100;
  const t4 = (ind.multiUnitHousing / 50 + ind.overcrowding / 15 + ind.noVehicle / 30) / 5;

  p.sviScore = Math.round(clamp((t1 + t2 + t3 + t4) / 4) * 1000) / 1000;
  p.themes = {
    socioeconomic: Math.round(clamp(t1) * 1000) / 1000,
    household: Math.round(clamp(t2) * 1000) / 1000,
    minority: Math.round(clamp(t3) * 1000) / 1000,
    housingTransport: Math.round(clamp(t4) * 1000) / 1000,
  };

  p.goingWell = [];
  p.needsAttention = [];

  if (ind.povertyRate < 10) p.goingWell.push({ label: "Low Poverty Rate", detail: `Poverty rate at ${ind.povertyRate}% — well below national average.`, value: ind.povertyRate });
  else if (ind.povertyRate > 20) p.needsAttention.push({ label: "Elevated Poverty Rate", detail: `${ind.povertyRate}% poverty rate exceeds national average.`, value: ind.povertyRate, solution: "Workforce development, EITC assistance, financial coaching programs." });

  if (ind.unemploymentRate < 4) p.goingWell.push({ label: "Strong Employment", detail: `${ind.unemploymentRate}% unemployment — near-full employment.`, value: ind.unemploymentRate });
  else if (ind.unemploymentRate > 8) p.needsAttention.push({ label: "High Unemployment", detail: `${ind.unemploymentRate}% unemployment rate.`, value: ind.unemploymentRate, solution: "Apprenticeship programs, workforce training grants." });

  if (ind.noHighSchoolDiploma < 10) p.goingWell.push({ label: "High Educational Attainment", detail: `${r(100 - ind.noHighSchoolDiploma)}% have HS diploma or higher.`, value: ind.noHighSchoolDiploma });
  else if (ind.noHighSchoolDiploma > 15) p.needsAttention.push({ label: "Educational Gap", detail: `${ind.noHighSchoolDiploma}% lack HS diploma.`, value: ind.noHighSchoolDiploma, solution: "GED programs, adult education, community college bridge programs." });

  if (ind.uninsuredRate < 5) p.goingWell.push({ label: "Strong Insurance Coverage", detail: `${r(100 - ind.uninsuredRate)}% insured.`, value: ind.uninsuredRate });
  else if (ind.uninsuredRate > 12) p.needsAttention.push({ label: "Insurance Gap", detail: `${ind.uninsuredRate}% uninsured.`, value: ind.uninsuredRate, solution: "ACA enrollment, Medicaid navigation, FQHC services." });

  if (ind.noVehicle < 5) p.goingWell.push({ label: "Transportation Access", detail: `Most workers have vehicle access.`, value: ind.noVehicle });
  else if (ind.noVehicle > 15) p.needsAttention.push({ label: "Transportation Barrier", detail: `${ind.noVehicle}% lack vehicle access.`, value: ind.noVehicle, solution: "Transit expansion, rideshare programs, telehealth." });

  return p;
}

async function matchGrants(profile: NeighborhoodProfile): Promise<any[]> {
  try {
    const allGrants = await db.select().from(grantOpportunities)
      .where(isNotNull(grantOpportunities.title))
      .orderBy(desc(grantOpportunities.createdAt))
      .limit(200);

    const needKeywords: string[] = [];
    for (const item of profile.needsAttention) {
      if (item.label.includes("Poverty")) needKeywords.push("poverty", "economic", "workforce", "TANF", "community development");
      if (item.label.includes("Unemployment")) needKeywords.push("workforce", "employment", "job training", "apprenticeship", "WIOA");
      if (item.label.includes("Education")) needKeywords.push("education", "literacy", "GED", "adult education", "college access");
      if (item.label.includes("Insurance")) needKeywords.push("health", "insurance", "Medicaid", "healthcare", "FQHC");
      if (item.label.includes("Transportation")) needKeywords.push("transportation", "transit", "mobility");
      if (item.label.includes("Digital")) needKeywords.push("broadband", "digital", "internet", "technology", "connectivity");
      if (item.label.includes("Housing")) needKeywords.push("housing", "affordable", "HUD", "shelter");
      if (item.label.includes("Food")) needKeywords.push("food", "nutrition", "SNAP", "hunger");
      if (item.label.includes("Language")) needKeywords.push("language", "ESL", "interpreter", "immigrant", "refugee");
      if (item.label.includes("Single-Parent")) needKeywords.push("family", "childcare", "Head Start", "child", "parenting");
      if (item.label.includes("Disability")) needKeywords.push("disability", "ADA", "rehabilitation", "assistive");
      if (item.label.includes("Income")) needKeywords.push("income", "financial", "economic", "poverty");
    }
    needKeywords.push("community", "social services", "grant", "resilience");

    const scoredGrants = allGrants.map(g => {
      let score = 0;
      const text = `${g.title} ${g.description || ""} ${(g.focusAreas || []).join(" ")} ${g.agency || ""}`.toLowerCase();
      for (const kw of needKeywords) {
        if (text.includes(kw.toLowerCase())) score += 2;
      }
      if (g.fitScore && g.fitScore > 50) score += 3;
      if (g.deadline && new Date(g.deadline) > new Date()) score += 5;
      const stAbbr = FIPS_TO_STATE[profile.stateFips] || "";
      if (text.includes(stAbbr.toLowerCase()) || text.includes((STATE_NAMES[stAbbr] || "").toLowerCase())) score += 3;
      return { ...g, matchScore: score };
    }).filter(g => g.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);

    return scoredGrants.map(g => ({
      id: g.id,
      title: g.title,
      agency: g.agency,
      fundingAmount: g.fundingAmount,
      deadline: g.deadline,
      description: g.description?.substring(0, 300),
      focusAreas: g.focusAreas,
      sourceUrl: g.sourceUrl,
      matchScore: g.matchScore,
      grantType: g.grantType,
      source: g.source,
    }));
  } catch (err) {
    console.error("Grant matching error:", err);
    return [];
  }
}

function generateScenarioNarrative(original: NeighborhoodProfile, adjusted: NeighborhoodProfile, adjustments: Record<string, number>): string {
  const parts: string[] = [];
  parts.push(`Scenario Analysis for ${adjusted.neighborhoodName || adjusted.zipCode}:`);
  parts.push("");

  const sviDelta = adjusted.sviScore - original.sviScore;
  const direction = sviDelta < 0 ? "decrease" : "increase";
  parts.push(`Overall vulnerability would ${direction} from ${original.sviScore} to ${adjusted.sviScore} (${sviDelta > 0 ? "+" : ""}${Math.round(sviDelta * 1000) / 1000}).`);
  parts.push("");

  if (adjustments.povertyChange) {
    const d = adjustments.povertyChange;
    parts.push(`- If poverty ${d < 0 ? "decreased" : "increased"} by ${Math.abs(d)}%: Rate moves from ${original.indicators.povertyRate}% to ${adjusted.indicators.povertyRate}%.`);
  }
  if (adjustments.unemploymentChange) {
    const d = adjustments.unemploymentChange;
    parts.push(`- If unemployment ${d < 0 ? "decreased" : "increased"} by ${Math.abs(d)}%: Rate moves from ${original.indicators.unemploymentRate}% to ${adjusted.indicators.unemploymentRate}%.`);
  }
  if (adjustments.graduationChange) {
    const d = adjustments.graduationChange;
    parts.push(`- If HS graduation ${d > 0 ? "increased" : "decreased"} by ${Math.abs(d)}%: "No diploma" rate moves from ${original.indicators.noHighSchoolDiploma}% to ${adjusted.indicators.noHighSchoolDiploma}%.`);
  }
  if (adjustments.educationChange) {
    const d = adjustments.educationChange;
    parts.push(`- If educational attainment ${d < 0 ? "improved" : "declined"} by ${Math.abs(d)}%: Gap moves from ${original.indicators.noHighSchoolDiploma}% to ${adjusted.indicators.noHighSchoolDiploma}%.`);
  }

  parts.push("");
  parts.push("Key Takeaway: These projections are based on CDC/ATSDR SVI methodology and illustrate how targeted interventions in specific areas create cascading positive effects across the entire Social Vulnerability Index.");

  return parts.join("\n");
}

export function registerNeighborhoodRoutes(app: Express) {

  app.get("/api/neighborhood/lookup", async (req, res) => {
    // Hard deadline: respond within 28s so the browser never sees a naked "failed to fetch"
    const deadline = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({ error: "Census data took too long to respond. Please try again — it usually succeeds on a second attempt." });
      }
    }, 28000);
    const done = () => clearTimeout(deadline);
    try {
      let zipCode = (req.query.zip as string || "").trim();
      const neighborhoodName = (req.query.name as string || "").trim();
      const locationInput = (req.query.location as string || "").trim();
      let resolvedDisplayName = "";

      if (!zipCode && locationInput) {
        const resolved = await resolveLocationToZip(locationInput);
        if (resolved && resolved.zip) {
          zipCode = resolved.zip;
          resolvedDisplayName = resolved.displayName;
        } else {
          done();
          return res.status(404).json({
            error: `Could not find a location for "${locationInput}". Try adding a city/state (e.g., "East Austin, TX") or a ZIP code.`,
            suggestion: "You can enter a ZIP code, a neighborhood name with city/state, a street name, or a city name.",
          });
        }
      }

      if (!zipCode || !/^\d{5}$/.test(zipCode)) {
        done();
        return res.status(400).json({
          error: "Please provide a ZIP code or a location (neighborhood, street, or city).",
          suggestion: "Examples: 78702, East Austin TX, MLK Blvd Austin TX, Austin TX",
        });
      }

      const geo = await zipToGeography(zipCode);
      if (!geo) {
        done();
        return res.status(404).json({ error: `Could not find geographic data for ZIP code ${zipCode}. Please verify and try again.` });
      }

      let data: any = null;
      if (geo.isZcta) {
        data = await fetchZctaData(zipCode);
      } else {
        data = await fetchNeighborhoodData(geo.stateFips, geo.countyFips, geo.tractFips);
        if (!data) {
          data = await fetchZctaData(zipCode);
        }
      }
      if (!data) {
        done();
        return res.status(404).json({ error: `Census data not available for ZIP ${zipCode}. The Census Bureau may not have data for this area.` });
      }

      const stateAbbr = FIPS_TO_STATE[geo.stateFips] || "";
      const stateName = STATE_NAMES[stateAbbr] || stateAbbr;

      const derivedName = neighborhoodName || resolvedDisplayName || `ZIP ${zipCode}`;

      const profile: NeighborhoodProfile = {
        zipCode,
        neighborhoodName: derivedName,
        stateFips: geo.stateFips,
        stateAbbr,
        stateName,
        countyFips: geo.countyFips,
        countyName: data.countyName || geo.countyName || `ZIP ${zipCode} Area`,
        tractFips: geo.tractFips,
        tractName: data.tractName || `ZCTA5 ${zipCode}`,
        population: data.population,
        medianIncome: data.medianIncome,
        indicators: data.indicators,
        sviScore: data.sviScore,
        themes: data.themes,
        goingWell: data.goingWell,
        needsAttention: data.needsAttention,
        generatedAt: new Date().toISOString(),
      };

      const grants = await matchGrants(profile);

      done();
      res.json({
        profile,
        matchedGrants: grants,
        disclaimer: "This report presents U.S. Census Bureau data and CDC/ATSDR Social Vulnerability Index methodology. These are known statistical characteristics of this geographic area — not characterizations of its residents. Every neighborhood has strengths and challenges. This data is meant to inform compassionate action, not to label or judge.",
        methodology: "Data sourced from the American Community Survey (ACS) 5-Year Estimates (2018-2022). SVI scores computed using CDC/ATSDR methodology across 16 social vulnerability indicators grouped into 4 themes. Research by Stillwell (2026, under review at Nature) validates that SVI inversely correlates with educational attainment across 3,144 U.S. counties.",
        dataSource: "U.S. Census Bureau American Community Survey, CDC/ATSDR Social Vulnerability Index",
      });
    } catch (err: any) {
      done();
      console.error("Neighborhood lookup error:", err);
      const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError" || String(err).includes("timeout");
      res.status(isTimeout ? 504 : 500).json({
        error: isTimeout
          ? "The Census Bureau API is responding slowly right now. Please try again in a moment — it usually succeeds on the second attempt."
          : "Failed to retrieve neighborhood data. Please try again.",
      });
    }
  });

  app.post("/api/neighborhood/scenario", async (req, res) => {
    try {
      const { profile, adjustments } = req.body as { profile: NeighborhoodProfile; adjustments: Record<string, number> };
      if (!profile) return res.status(400).json({ error: "Profile data required." });

      const adjusted = applyScenario(profile, adjustments || {});
      const narrative = generateScenarioNarrative(profile, adjusted, adjustments || {});

      res.json({
        original: profile,
        adjusted,
        narrative,
        adjustments,
      });
    } catch (err) {
      console.error("Scenario error:", err);
      res.status(500).json({ error: "Failed to run scenario." });
    }
  });

  app.post("/api/neighborhood/report-pdf", async (req, res) => {
    try {
      const { profile, grants, scenario } = req.body as {
        profile: NeighborhoodProfile;
        grants?: any[];
        scenario?: { adjusted: NeighborhoodProfile; narrative: string; adjustments: Record<string, number> } | null;
      };
      if (!profile) return res.status(400).json({ error: "Profile required" });

      const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Neighborhood_Report_${profile.zipCode}_${Date.now()}.pdf"`);
      doc.pipe(res);

      const navy = "#1a365d";
      const teal = "#0d9488";
      const green = "#276749";
      const red = "#c53030";
      const gray = "#4a5568";
      const lightBg = "#f7fafc";
      const W = 512;
      const pageCheck = () => { if (doc.y > 680) doc.addPage(); };
      const sectionHeader = (title: string, y?: number) => {
        doc.rect(0, y ?? doc.y, 612, 40).fill(navy);
        doc.fontSize(14).font("Helvetica-Bold").fillColor("white").text(title, 50, (y ?? doc.y) + 12, { width: W });
        doc.moveDown(2.5);
      };
      const locationLine = profile.countyName && profile.stateName
        ? `${profile.neighborhoodName} | ZIP ${profile.zipCode} | ${profile.countyName}, ${profile.stateName}`
        : `${profile.neighborhoodName} | ZIP ${profile.zipCode}`;

      // ── PAGE 1: COVER ──
      doc.rect(0, 0, 612, 160).fill(navy);
      doc.fontSize(28).font("Helvetica-Bold").fillColor("white").text("Neighborhood Intelligence Report", 50, 35, { width: W });
      doc.fontSize(14).font("Helvetica").text(locationLine, 50, 80, { width: W });
      doc.fontSize(10).text(`Generated ${new Date(profile.generatedAt).toLocaleDateString()} by ThriveUp Academy`, 50, 105, { width: W });
      doc.fontSize(10).text(`Census Tract: ${profile.tractName}`, 50, 125, { width: W });

      doc.moveDown(6);
      doc.rect(50, doc.y, W, 2).fill(teal);
      doc.moveDown(1);
      doc.fillColor(gray).fontSize(9).font("Helvetica-Oblique")
        .text("IMPORTANT DISCLAIMER: This report presents U.S. Census Bureau data and CDC/ATSDR Social Vulnerability Index methodology. These are known statistical characteristics of this geographic area — not characterizations of its residents. Every neighborhood has strengths and challenges. This data is meant to inform compassionate action, not to label or judge. Data represents this area's overall statistics and may not reflect every individual's experience.", 50, undefined, { width: W });

      doc.moveDown(1.5);
      doc.fillColor(navy).fontSize(16).font("Helvetica-Bold").text("What This Report Contains");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(10).font("Helvetica");
      const toc = [
        "1. Community Snapshot — Population, income, and vulnerability overview",
        "2. Social Vulnerability Index (SVI) — Four-theme analysis of community resilience",
        "3. All Community Indicators — Full 15-indicator data breakdown with national comparisons",
        "4. What's Going Well — Strengths your community can build on",
        "5. Areas That Need Attention — Challenges with specific, actionable solutions",
        "6. Scenario Analysis — \"What If\" projections (when available)",
        "7. Matched Grants & Resources — Funding opportunities matched to your needs",
        "8. Action Plan — Step-by-step next moves for community leaders",
        "9. Methodology & Citations — Data sources, research basis, and references",
      ];
      for (const line of toc) {
        doc.text(line, 65, undefined, { width: W - 15 });
        doc.moveDown(0.3);
      }

      doc.moveDown(1.5);
      doc.rect(50, doc.y, W, 1).fill(teal);
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(9).font("Helvetica-Oblique")
        .text("\"This is DATA, not characterization.\" — ThriveUp Academy", 50, undefined, { width: W, align: "center" });

      // ── PAGE 2: COMMUNITY SNAPSHOT ──
      doc.addPage();
      sectionHeader("1. Community Snapshot", 0);

      doc.fillColor(navy).fontSize(13).font("Helvetica-Bold").text("Population & Demographics");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(10).font("Helvetica");
      const popStr = profile.population > 0 ? profile.population.toLocaleString() : "Data not available";
      const incStr = profile.medianIncome > 0 ? `$${profile.medianIncome.toLocaleString()}` : "Data not available";
      const natIncome = 74580;
      const incComp = profile.medianIncome > 0
        ? (profile.medianIncome >= natIncome
          ? `$${(profile.medianIncome - natIncome).toLocaleString()} above national median ($${natIncome.toLocaleString()})`
          : `$${(natIncome - profile.medianIncome).toLocaleString()} below national median ($${natIncome.toLocaleString()})`)
        : "";

      doc.text(`Total Population: ${popStr}`);
      doc.moveDown(0.3);
      doc.text(`Median Household Income: ${incStr}`);
      if (incComp) { doc.moveDown(0.2); doc.fillColor(profile.medianIncome >= natIncome ? green : red).fontSize(9).text(`  → ${incComp}`); }
      doc.moveDown(0.3);
      doc.fillColor(gray).fontSize(10).font("Helvetica");
      doc.text(`Poverty Rate: ${profile.indicators.povertyRate}% (National avg: 12.4%)`);
      doc.moveDown(0.3);
      doc.text(`Unemployment Rate: ${profile.indicators.unemploymentRate}% (National avg: 3.6%)`);
      doc.moveDown(0.3);
      doc.text(`Uninsured Rate: ${profile.indicators.uninsuredRate}% (National avg: 8.6%)`);
      doc.moveDown(0.3);
      doc.text(`SNAP Recipients: ${profile.indicators.snapRecipients}% of households`);

      doc.moveDown(1.5);
      doc.fillColor(navy).fontSize(13).font("Helvetica-Bold").text("Overall Social Vulnerability Score");
      doc.moveDown(0.5);
      const sviPct = Math.round(profile.sviScore * 100);
      const sviLabel = sviPct <= 25 ? "Low Vulnerability" : sviPct <= 50 ? "Moderate Vulnerability" : sviPct <= 75 ? "Moderate-High Vulnerability" : "High Vulnerability";
      const sviColor = sviPct <= 25 ? green : sviPct <= 50 ? teal : sviPct <= 75 ? "#d69e2e" : red;
      doc.fillColor(sviColor).fontSize(24).font("Helvetica-Bold").text(`${profile.sviScore}`, 50, undefined, { continued: true });
      doc.fillColor(gray).fontSize(12).font("Helvetica").text(`  / 1.000 — ${sviLabel}`);
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(9).font("Helvetica")
        .text("The Social Vulnerability Index (SVI) ranges from 0 to 1. Higher scores indicate greater social vulnerability — meaning more resources and attention may be needed to help communities prepare for and recover from health emergencies, natural disasters, and economic shocks.", { width: W });

      doc.moveDown(1.5);
      doc.fillColor(navy).fontSize(13).font("Helvetica-Bold").text("Community Context");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(10).font("Helvetica");
      doc.text(`Children Under 17: ${profile.indicators.ageUnder17}% of population`);
      doc.moveDown(0.3);
      doc.text(`Adults 65+: ${profile.indicators.age65Plus}% of population`);
      doc.moveDown(0.3);
      doc.text(`Single-Parent Households: ${profile.indicators.singleParentRate}%`);
      doc.moveDown(0.3);
      doc.text(`Disability Rate: ${profile.indicators.disabilityRate}%`);
      doc.moveDown(0.3);
      doc.text(`Limited English Proficiency: ${profile.indicators.limitedEnglish}%`);

      // ── PAGE 3: SVI THEME DEEP DIVE ──
      doc.addPage();
      sectionHeader("2. Social Vulnerability Index — Theme Analysis", 0);

      const themeDetails = [
        {
          key: "socioeconomic", label: "Theme 1: Socioeconomic Status",
          score: profile.themes.socioeconomic,
          desc: "Measures the economic resilience of the community through poverty, unemployment, income, and educational attainment. Communities with lower socioeconomic status may have fewer resources to prepare for and recover from adverse events.",
          indicators: [
            `Poverty Rate: ${profile.indicators.povertyRate}% (National: 12.4%)`,
            `Unemployment: ${profile.indicators.unemploymentRate}% (National: 3.6%)`,
            `No HS Diploma: ${profile.indicators.noHighSchoolDiploma}% (National: 11.1%)`,
            `Uninsured: ${profile.indicators.uninsuredRate}% (National: 8.6%)`,
          ],
        },
        {
          key: "household", label: "Theme 2: Household Composition & Disability",
          score: profile.themes.household,
          desc: "Captures vulnerability from household structure and disability status. Elderly, very young, disabled individuals, and single-parent households may need additional support during emergencies.",
          indicators: [
            `Age 65+: ${profile.indicators.age65Plus}%`,
            `Under 17: ${profile.indicators.ageUnder17}%`,
            `Disability: ${profile.indicators.disabilityRate}%`,
            `Single Parent: ${profile.indicators.singleParentRate}%`,
            `Limited English: ${profile.indicators.limitedEnglish}%`,
          ],
        },
        {
          key: "minority", label: "Theme 3: Racial & Ethnic Minority Status",
          score: profile.themes.minority,
          desc: "Reflects the proportion of racial and ethnic minority populations. Research shows these communities often face systemic barriers to healthcare, education, and economic opportunity — not due to inherent characteristics, but due to structural inequities.",
          indicators: [
            `Minority Population: ${profile.indicators.minorityPct}%`,
          ],
        },
        {
          key: "housingTransport", label: "Theme 4: Housing Type & Transportation",
          score: profile.themes.housingTransport,
          desc: "Assesses housing density, crowding, vehicle access, and digital connectivity. Multi-unit housing, overcrowding, and lack of transportation create barriers to evacuation, healthcare access, and economic mobility.",
          indicators: [
            `Multi-Unit Housing: ${profile.indicators.multiUnitHousing}%`,
            `Overcrowding: ${profile.indicators.overcrowding}%`,
            `No Vehicle: ${profile.indicators.noVehicle}%`,
            `No Broadband: ${profile.indicators.noBroadband}%`,
          ],
        },
      ];

      for (const theme of themeDetails) {
        pageCheck();
        const tPct = Math.round(theme.score * 100);
        doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text(theme.label);
        doc.moveDown(0.3);
        doc.fillColor(sviPct <= 50 ? green : red).fontSize(11).font("Helvetica-Bold")
          .text(`Score: ${theme.score} (${tPct}%)`);
        doc.moveDown(0.3);
        doc.fillColor(gray).fontSize(9).font("Helvetica").text(theme.desc, { width: W });
        doc.moveDown(0.3);
        for (const ind of theme.indicators) {
          doc.fillColor(gray).fontSize(9).font("Helvetica").text(`  • ${ind}`, { indent: 10 });
          doc.moveDown(0.15);
        }
        doc.moveDown(0.8);
      }

      // ── PAGE 4: ALL INDICATORS TABLE ──
      doc.addPage();
      sectionHeader("3. Complete Indicator Breakdown", 0);

      const allIndicators = [
        { label: "Poverty Rate", value: `${profile.indicators.povertyRate}%`, national: "12.4%", status: profile.indicators.povertyRate < 12.4 ? "Better" : "Worse" },
        { label: "Unemployment Rate", value: `${profile.indicators.unemploymentRate}%`, national: "3.6%", status: profile.indicators.unemploymentRate < 3.6 ? "Better" : "Worse" },
        { label: "No High School Diploma", value: `${profile.indicators.noHighSchoolDiploma}%`, national: "11.1%", status: profile.indicators.noHighSchoolDiploma < 11.1 ? "Better" : "Worse" },
        { label: "Uninsured Rate", value: `${profile.indicators.uninsuredRate}%`, national: "8.6%", status: profile.indicators.uninsuredRate < 8.6 ? "Better" : "Worse" },
        { label: "Age 65+", value: `${profile.indicators.age65Plus}%`, national: "16.8%", status: "Neutral" },
        { label: "Under Age 17", value: `${profile.indicators.ageUnder17}%`, national: "22.0%", status: "Neutral" },
        { label: "Disability Rate", value: `${profile.indicators.disabilityRate}%`, national: "13.0%", status: profile.indicators.disabilityRate < 13 ? "Better" : "Worse" },
        { label: "Single-Parent Households", value: `${profile.indicators.singleParentRate}%`, national: "20.0%", status: profile.indicators.singleParentRate < 20 ? "Better" : "Worse" },
        { label: "Limited English Proficiency", value: `${profile.indicators.limitedEnglish}%`, national: "8.2%", status: profile.indicators.limitedEnglish < 8.2 ? "Better" : "Worse" },
        { label: "Minority Population", value: `${profile.indicators.minorityPct}%`, national: "38.4%", status: "Neutral" },
        { label: "Multi-Unit Housing", value: `${profile.indicators.multiUnitHousing}%`, national: "17.0%", status: "Neutral" },
        { label: "Overcrowding", value: `${profile.indicators.overcrowding}%`, national: "3.4%", status: profile.indicators.overcrowding < 3.4 ? "Better" : "Worse" },
        { label: "No Vehicle Access", value: `${profile.indicators.noVehicle}%`, national: "5.3%", status: profile.indicators.noVehicle < 5.3 ? "Better" : "Worse" },
        { label: "No Broadband", value: `${profile.indicators.noBroadband}%`, national: "12.0%", status: profile.indicators.noBroadband < 12 ? "Better" : "Worse" },
        { label: "SNAP Recipients", value: `${profile.indicators.snapRecipients}%`, national: "11.7%", status: profile.indicators.snapRecipients < 11.7 ? "Better" : "Worse" },
      ];

      doc.fillColor(navy).fontSize(9).font("Helvetica-Bold");
      doc.text("Indicator", 50, undefined, { continued: true, width: 200 });
      doc.text("Your Area", 280, undefined, { continued: true, width: 80 });
      doc.text("National", 370, undefined, { continued: true, width: 80 });
      doc.text("Comparison", 460, undefined, { width: 80 });
      doc.moveDown(0.3);
      doc.rect(50, doc.y, W, 1).fill(navy);
      doc.moveDown(0.3);

      for (const ind of allIndicators) {
        doc.fontSize(9).font("Helvetica");
        doc.fillColor(gray).text(ind.label, 50, undefined, { continued: true, width: 200 });
        doc.text(ind.value, 280, undefined, { continued: true, width: 80 });
        doc.text(ind.national, 370, undefined, { continued: true, width: 80 });
        const statusColor = ind.status === "Better" ? green : ind.status === "Worse" ? red : gray;
        doc.fillColor(statusColor).text(ind.status, 460, undefined, { width: 80 });
        doc.moveDown(0.2);
      }

      // ── PAGE 5: WHAT'S GOING WELL ──
      doc.addPage();
      sectionHeader("4. What's Going Well — Community Strengths", 0);

      if (profile.goingWell.length > 0) {
        doc.fillColor(gray).fontSize(10).font("Helvetica")
          .text("These are areas where your community is performing at or above national benchmarks. These strengths are assets to celebrate and build upon.", { width: W });
        doc.moveDown(1);
        for (let i = 0; i < profile.goingWell.length; i++) {
          pageCheck();
          const item = profile.goingWell[i];
          doc.fillColor(green).fontSize(11).font("Helvetica-Bold").text(`✓ ${item.label}`);
          doc.moveDown(0.3);
          doc.fillColor(gray).fontSize(10).font("Helvetica").text(item.detail, { width: W, indent: 15 });
          doc.moveDown(0.3);
          doc.fillColor(teal).fontSize(9).font("Helvetica-Oblique")
            .text("How to build on this: Continue supporting the programs and policies that contribute to this strength. Share this success story with neighboring communities as a model.", { width: W - 30, indent: 15 });
          doc.moveDown(0.8);
        }
      } else {
        doc.fillColor(gray).fontSize(10).font("Helvetica")
          .text("All measured indicators for this area fall within or above national averages, which means there are moderate characteristics across the board. Every community has unmeasured strengths — local culture, resilience, mutual aid networks, and community spirit that data cannot capture.", { width: W });
      }

      // ── PAGE 6: NEEDS ATTENTION ──
      doc.addPage();
      sectionHeader("5. Areas That Need Attention — Challenges & Solutions", 0);

      if (profile.needsAttention.length > 0) {
        doc.fillColor(gray).fontSize(10).font("Helvetica")
          .text("These indicators show where your community faces challenges compared to national benchmarks. For each challenge, we provide specific, actionable solutions.", { width: W });
        doc.moveDown(1);
        for (let i = 0; i < profile.needsAttention.length; i++) {
          pageCheck();
          const item = profile.needsAttention[i];
          const valStr = typeof item.value === "number" && item.value < 200 ? `${item.value}%` : `$${item.value.toLocaleString()}`;
          doc.fillColor(red).fontSize(11).font("Helvetica-Bold").text(`▲ ${item.label} — ${valStr}`);
          doc.moveDown(0.3);
          doc.fillColor(gray).fontSize(10).font("Helvetica").text(item.detail, { width: W, indent: 15 });
          doc.moveDown(0.3);
          doc.fillColor(navy).fontSize(10).font("Helvetica-Bold").text("Recommended Actions:", { indent: 15 });
          doc.moveDown(0.2);
          doc.fillColor(gray).fontSize(9).font("Helvetica").text(item.solution, { width: W - 30, indent: 25 });
          doc.moveDown(0.8);
        }
      } else {
        doc.fillColor(gray).fontSize(10).font("Helvetica")
          .text("No indicators exceeded the elevated threshold in this analysis. This doesn't mean there are no challenges — it means the measured Census indicators fall within moderate ranges. Community members often identify needs that data alone cannot reveal.", { width: W });
      }

      // ── PAGE 7: SCENARIO ANALYSIS (if available) ──
      if (scenario) {
        doc.addPage();
        sectionHeader("6. Scenario Analysis — \"What If\" Projections", 0);

        doc.fillColor(gray).fontSize(10).font("Helvetica")
          .text("Using the interactive scenario sandbox, the following adjustments were modeled to project how targeted interventions could change your community's vulnerability profile:", { width: W });
        doc.moveDown(1);

        if (scenario.adjustments) {
          doc.fillColor(navy).fontSize(11).font("Helvetica-Bold").text("Adjustments Applied:");
          doc.moveDown(0.5);
          const adjLabels: Record<string, string> = {
            povertyChange: "Poverty Rate Change",
            unemploymentChange: "Unemployment Rate Change",
            graduationChange: "HS Graduation Rate Change",
            insuranceChange: "Insurance Coverage Change",
            transportChange: "Transportation Access Change",
            broadbandChange: "Broadband Access Change",
          };
          for (const [key, val] of Object.entries(scenario.adjustments)) {
            if (val !== 0) {
              const label = adjLabels[key] || key;
              doc.fillColor(gray).fontSize(10).font("Helvetica").text(`  • ${label}: ${val > 0 ? '+' : ''}${val} percentage points`, { indent: 10 });
              doc.moveDown(0.2);
            }
          }
        }

        doc.moveDown(1);
        doc.fillColor(navy).fontSize(11).font("Helvetica-Bold").text("Projected Impact:");
        doc.moveDown(0.5);
        const origSvi = (scenario as any).original?.sviScore ?? profile.sviScore;
        const adjSvi = scenario.adjusted.sviScore;
        const sviDelta = Math.round((adjSvi - origSvi) * 1000) / 1000;
        doc.fillColor(gray).fontSize(10).font("Helvetica");
        doc.text(`Original SVI Score: ${origSvi}`);
        doc.moveDown(0.2);
        doc.text(`Projected SVI Score: ${adjSvi}`);
        doc.moveDown(0.2);
        doc.fillColor(sviDelta < 0 ? green : sviDelta > 0 ? red : gray).fontSize(10).font("Helvetica-Bold")
          .text(`Change: ${sviDelta > 0 ? '+' : ''}${sviDelta} (${sviDelta < 0 ? 'Improvement' : sviDelta > 0 ? 'Increased vulnerability' : 'No change'})`);

        doc.moveDown(1);
        doc.fillColor(navy).fontSize(11).font("Helvetica-Bold").text("Narrative:");
        doc.moveDown(0.5);
        doc.fillColor(gray).fontSize(10).font("Helvetica");
        const narLines = scenario.narrative.split("\n");
        for (const line of narLines) {
          pageCheck();
          doc.text(line, 50, undefined, { width: W });
          doc.moveDown(0.3);
        }
      }

      // ── GRANTS PAGE(S) ──
      if (grants && grants.length > 0) {
        doc.addPage();
        sectionHeader("7. Matched Grants & Resources", 0);

        doc.fillColor(gray).fontSize(10).font("Helvetica")
          .text(`Based on your community's indicators, we identified ${grants.length} grant opportunities and resources that align with your neighborhood's specific needs:`, { width: W });
        doc.moveDown(1);

        const topGrants = grants.slice(0, 20);
        for (let i = 0; i < topGrants.length; i++) {
          pageCheck();
          const g = topGrants[i];
          doc.fillColor(navy).fontSize(10).font("Helvetica-Bold").text(`${i + 1}. ${g.title}`);
          doc.fillColor(gray).fontSize(9).font("Helvetica");
          if (g.agency) doc.text(`   Agency: ${g.agency}`, { indent: 15 });
          if (g.fundingAmount) doc.text(`   Funding: ${g.fundingAmount}`, { indent: 15 });
          if (g.deadline) doc.text(`   Deadline: ${new Date(g.deadline).toLocaleDateString()}`, { indent: 15 });
          if (g.matchReason) doc.text(`   Why it matches: ${g.matchReason}`, { indent: 15 });
          if (g.sourceUrl) { doc.fillColor(teal).text(`   Apply: ${g.sourceUrl}`, { indent: 15 }); }
          doc.moveDown(0.6);
        }
      }

      // ── ACTION PLAN PAGE ──
      doc.addPage();
      sectionHeader("8. Community Action Plan", 0);

      doc.fillColor(gray).fontSize(10).font("Helvetica")
        .text("This action plan is tailored to your community's specific indicators. Each step is designed to be taken by community members, leaders, and organizations working together.", { width: W });
      doc.moveDown(1);

      doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("Immediate Actions (This Week)");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(10).font("Helvetica");
      doc.text("1. Share this report with your neighborhood association, city council representative, faith community, or local organization.", 50, undefined, { width: W });
      doc.moveDown(0.3);
      doc.text("2. Identify 2-3 areas from the \"Needs Attention\" section that resonate most with your lived experience and prioritize those.", 50, undefined, { width: W });
      doc.moveDown(0.3);
      doc.text("3. Bookmark the matched grants and check their deadlines — many federal grant cycles have firm cutoff dates.", 50, undefined, { width: W });

      doc.moveDown(1);
      doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("Short-Term Goals (Next 30 Days)");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(10).font("Helvetica");
      let stepNum = 4;
      for (const item of profile.needsAttention) {
        pageCheck();
        doc.text(`${stepNum}. ${item.label}: ${item.solution}`, 50, undefined, { width: W });
        doc.moveDown(0.4);
        stepNum++;
      }
      if (profile.needsAttention.length === 0) {
        doc.text(`${stepNum}. Even with strong indicators, continue to invest in community programs that maintain these positive outcomes.`, 50, undefined, { width: W });
        doc.moveDown(0.4);
        stepNum++;
      }

      doc.moveDown(0.5);
      doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("Ongoing Commitments");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(10).font("Helvetica");
      doc.text(`${stepNum}. Connect with ThriveUp Academy for free educational resources, workforce training, and community advocacy tools.`, 50, undefined, { width: W });
      doc.moveDown(0.3);
      stepNum++;
      doc.text(`${stepNum}. Apply for at least 3 matched grants from this report — cast a wide net to maximize your chances.`, 50, undefined, { width: W });
      doc.moveDown(0.3);
      stepNum++;
      doc.text(`${stepNum}. Revisit this Neighborhood Intelligence tool quarterly to track progress and refine your community action plan.`, 50, undefined, { width: W });
      doc.moveDown(0.3);
      stepNum++;
      doc.text(`${stepNum}. Organize a community data walk — present this report at a public meeting and gather resident input on priorities that data alone cannot capture.`, 50, undefined, { width: W });
      doc.moveDown(0.3);
      stepNum++;
      doc.text(`${stepNum}. Build a coalition — invite schools, businesses, healthcare providers, and faith organizations to coordinate responses to shared challenges.`, 50, undefined, { width: W });

      // ── METHODOLOGY & CITATIONS PAGE ──
      doc.addPage();
      sectionHeader("9. Methodology, Data Sources & Citations", 0);

      doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("Data Sources");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(9).font("Helvetica");
      doc.text("• U.S. Census Bureau, American Community Survey (ACS) 5-Year Estimates, 2018-2022", { indent: 10, width: W });
      doc.moveDown(0.2);
      doc.text("• Centers for Disease Control and Prevention / Agency for Toxic Substances and Disease Registry (CDC/ATSDR), Social Vulnerability Index (SVI)", { indent: 10, width: W });
      doc.moveDown(0.2);
      doc.text("• SAM.gov (System for Award Management) — Federal grant opportunity matching", { indent: 10, width: W });

      doc.moveDown(1);
      doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("SVI Methodology");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(9).font("Helvetica")
        .text("The Social Vulnerability Index uses 16 U.S. Census variables grouped into four themes to identify communities that may need support before, during, and after hazardous events. This report computes SVI-equivalent scores using the original CDC/ATSDR methodology adapted for real-time Census ACS data. Scores range from 0 (lowest vulnerability) to 1 (highest vulnerability). Each theme score is independently calculated and averaged for the overall SVI.", { width: W });

      doc.moveDown(1);
      doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("Research Citation");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(9).font("Helvetica")
        .text("Stillwell, C. (2026). SVI-based geographic accountability in higher education accreditation. Under review at Nature. Findings: SVI inversely correlates with bachelor's degree attainment across all 3,144 U.S. counties (9.3 percentage-point gap between highest and lowest SVI quintiles).", { width: W });

      doc.moveDown(1);
      doc.fillColor(navy).fontSize(12).font("Helvetica-Bold").text("Limitations");
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(9).font("Helvetica")
        .text("• ACS 5-year estimates represent averages over the survey period and may not reflect very recent changes.", { indent: 10, width: W });
      doc.moveDown(0.2);
      doc.text("• ZIP Code Tabulation Areas (ZCTAs) approximate but do not exactly match USPS ZIP codes.", { indent: 10, width: W });
      doc.moveDown(0.2);
      doc.text("• Census data represents statistical averages — individual experiences within a community vary widely.", { indent: 10, width: W });
      doc.moveDown(0.2);
      doc.text("• Small populations may have larger margins of error in ACS estimates.", { indent: 10, width: W });
      doc.moveDown(0.2);
      doc.text("• This tool does not replace on-the-ground community assessment and resident engagement.", { indent: 10, width: W });

      doc.moveDown(1.5);
      doc.rect(50, doc.y, W, 2).fill(teal);
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(8).font("Helvetica-Oblique")
        .text("Generated by ThriveUp Academy Neighborhood Intelligence | thriveupacademy.com | For questions or partnership inquiries, contact us through the platform.", 50, undefined, { width: W, align: "center" });
      doc.moveDown(0.5);
      doc.fillColor(gray).fontSize(8).font("Helvetica-Oblique")
        .text("\"Every neighborhood has a story. Data helps us tell it with compassion and precision.\"", 50, undefined, { width: W, align: "center" });

      doc.end();
    } catch (err) {
      console.error("PDF generation error:", err);
      res.status(500).json({ error: "Failed to generate PDF report." });
    }
  });

  app.post("/api/neighborhood/presentation", async (req, res) => {
    try {
      const { profile, grants, scenario } = req.body as {
        profile: NeighborhoodProfile;
        grants?: any[];
        scenario?: { adjusted: NeighborhoodProfile; narrative: string; adjustments: Record<string, number> } | null;
      };
      if (!profile) return res.status(400).json({ error: "Profile required" });

      const pptx = new PptxGenJS();
      pptx.author = "ThriveUp Academy";
      pptx.title = `Neighborhood Intelligence: ${profile.neighborhoodName}`;
      pptx.subject = `Data story for ZIP ${profile.zipCode}`;

      const NAVY = "1a365d";
      const GOLD = "d69e2e";
      const GREEN = "276749";
      const RED = "c53030";
      const WHITE = "FFFFFF";
      const GRAY = "f7fafc";
      const DARK = "2d3748";

      const addHeader = (slide: any, title: string) => {
        slide.addShape("rect", { x: 0, y: 0, w: "100%", h: 1.0, fill: { color: NAVY } });
        slide.addText(title, { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 24, fontFace: "Arial", color: WHITE, bold: true });
      };

      const addFooter = (slide: any, pageNum: number, total: number) => {
        slide.addText("ThriveUp Academy | Neighborhood Intelligence", { x: 0.5, y: 7.0, w: 7, h: 0.3, fontSize: 8, color: "999999" });
        slide.addText(`${pageNum}/${total}`, { x: 8.5, y: 7.0, w: 1, h: 0.3, fontSize: 8, color: "999999", align: "right" });
      };

      const totalSlides = 15 + (scenario ? 2 : 0) + Math.min(Math.ceil((grants || []).length / 4), 3);

      let slideNum = 0;

      const slide1 = pptx.addSlide();
      slideNum++;
      slide1.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: NAVY } });
      slide1.addText("NEIGHBORHOOD\nINTELLIGENCE REPORT", { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 36, fontFace: "Arial", color: WHITE, bold: true, align: "center" });
      slide1.addText(`${profile.neighborhoodName}`, { x: 0.5, y: 3.5, w: 9, h: 0.8, fontSize: 28, fontFace: "Arial", color: GOLD, align: "center" });
      slide1.addText(`ZIP Code ${profile.zipCode} | ${profile.countyName}, ${profile.stateName}`, { x: 0.5, y: 4.3, w: 9, h: 0.5, fontSize: 16, fontFace: "Arial", color: WHITE, align: "center" });
      slide1.addText(`Generated ${new Date().toLocaleDateString()} | Powered by ThriveUp Academy`, { x: 0.5, y: 5.5, w: 9, h: 0.4, fontSize: 12, fontFace: "Arial", color: "aaaaaa", align: "center" });
      addFooter(slide1, slideNum, totalSlides);

      const slide2 = pptx.addSlide();
      slideNum++;
      addHeader(slide2, "About This Report");
      slide2.addText("What You're Looking At", { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 20, fontFace: "Arial", color: NAVY, bold: true });
      slide2.addText([
        { text: "This report presents ", options: { fontSize: 14, color: DARK } },
        { text: "data", options: { fontSize: 14, color: NAVY, bold: true } },
        { text: " — not judgment.", options: { fontSize: 14, color: DARK } },
      ], { x: 0.5, y: 1.9, w: 9, h: 0.5 });
      slide2.addText("These are the known statistical characteristics of your geographic area based on U.S. Census Bureau data and CDC/ATSDR Social Vulnerability Index methodology.\n\nEvery neighborhood has strengths and challenges. This data is meant to inform compassionate action — not to label or define the people who live here.\n\nWhat we'll cover:\n  1. Your community snapshot\n  2. What's going well\n  3. What needs attention\n  4. Specific solutions for your neighborhood\n  5. Available grants and resources\n  6. An action plan you can take home", { x: 0.5, y: 2.5, w: 9, h: 4, fontSize: 13, fontFace: "Arial", color: DARK, lineSpacing: 22 });
      addFooter(slide2, slideNum, totalSlides);

      const slide3 = pptx.addSlide();
      slideNum++;
      addHeader(slide3, "Community Snapshot");
      const snapData = [
        { label: "Population", value: profile.population.toLocaleString() },
        { label: "Median Household Income", value: `$${profile.medianIncome > 0 ? profile.medianIncome.toLocaleString() : "N/A"}` },
        { label: "Vulnerability Score (SVI)", value: `${profile.sviScore} / 1.000` },
        { label: "Census Tract", value: profile.tractName },
        { label: "County", value: profile.countyName },
      ];
      for (let i = 0; i < snapData.length; i++) {
        const y = 1.4 + i * 0.9;
        slide3.addShape("rect", { x: 0.5, y, w: 9, h: 0.7, fill: { color: i % 2 === 0 ? GRAY : WHITE }, rectRadius: 0.05 });
        slide3.addText(snapData[i].label, { x: 0.8, y: y + 0.1, w: 4, h: 0.5, fontSize: 14, color: DARK, fontFace: "Arial" });
        slide3.addText(snapData[i].value, { x: 5, y: y + 0.1, w: 4, h: 0.5, fontSize: 16, color: NAVY, bold: true, fontFace: "Arial", align: "right" });
      }
      addFooter(slide3, slideNum, totalSlides);

      const slide4 = pptx.addSlide();
      slideNum++;
      addHeader(slide4, "Vulnerability Score Explained");
      const sviPct = Math.round(profile.sviScore * 100);
      const sviColor = sviPct > 75 ? RED : sviPct > 50 ? GOLD : sviPct > 25 ? "3182ce" : GREEN;
      const sviLabel = sviPct > 75 ? "High Vulnerability" : sviPct > 50 ? "Moderate-High" : sviPct > 25 ? "Moderate-Low" : "Low Vulnerability";
      slide4.addText(`${profile.sviScore}`, { x: 3, y: 1.5, w: 4, h: 1.5, fontSize: 60, fontFace: "Arial", color: sviColor, bold: true, align: "center" });
      slide4.addText(sviLabel, { x: 3, y: 3, w: 4, h: 0.5, fontSize: 18, fontFace: "Arial", color: sviColor, align: "center" });
      slide4.addText("The Social Vulnerability Index (SVI) ranges from 0 to 1.\nLower is better. A score of 0.5 means this area is more\nvulnerable than 50% of communities nationally.", { x: 1, y: 3.8, w: 8, h: 1, fontSize: 13, fontFace: "Arial", color: DARK, align: "center", lineSpacing: 20 });

      const pptxThemeLabels = [
        { key: "socioeconomic", label: "Socioeconomic Status" },
        { key: "household", label: "Household Composition & Disability" },
        { key: "minority", label: "Racial & Ethnic Minority Status" },
        { key: "housingTransport", label: "Housing Type & Transportation" },
      ];
      for (let i = 0; i < pptxThemeLabels.length; i++) {
        const t = pptxThemeLabels[i];
        const score = (profile.themes as any)[t.key] as number;
        const y = 5.2 + i * 0.4;
        slide4.addText(t.label, { x: 0.5, y, w: 5, h: 0.35, fontSize: 11, color: DARK, fontFace: "Arial" });
        slide4.addShape("rect", { x: 5.5, y: y + 0.05, w: 3.5, h: 0.25, fill: { color: "e2e8f0" }, rectRadius: 0.05 });
        slide4.addShape("rect", { x: 5.5, y: y + 0.05, w: Math.max(0.1, 3.5 * score), h: 0.25, fill: { color: score > 0.75 ? RED : score > 0.5 ? GOLD : score > 0.25 ? "3182ce" : GREEN }, rectRadius: 0.05 });
        slide4.addText(`${Math.round(score * 100)}%`, { x: 9.2, y, w: 0.6, h: 0.35, fontSize: 10, color: DARK, fontFace: "Arial" });
      }
      addFooter(slide4, slideNum, totalSlides);

      const slide5 = pptx.addSlide();
      slideNum++;
      addHeader(slide5, "Key Indicators at a Glance");
      const indicators = [
        { label: "Poverty Rate", value: `${profile.indicators.povertyRate}%`, nat: "12.4%", good: profile.indicators.povertyRate < 12 },
        { label: "Unemployment", value: `${profile.indicators.unemploymentRate}%`, nat: "3.6%", good: profile.indicators.unemploymentRate < 5 },
        { label: "No HS Diploma", value: `${profile.indicators.noHighSchoolDiploma}%`, nat: "11%", good: profile.indicators.noHighSchoolDiploma < 12 },
        { label: "Uninsured", value: `${profile.indicators.uninsuredRate}%`, nat: "8.3%", good: profile.indicators.uninsuredRate < 10 },
        { label: "No Vehicle", value: `${profile.indicators.noVehicle}%`, nat: "8.5%", good: profile.indicators.noVehicle < 10 },
        { label: "No Broadband", value: `${profile.indicators.noBroadband}%`, nat: "13%", good: profile.indicators.noBroadband < 15 },
        { label: "Single Parent HH", value: `${profile.indicators.singleParentRate}%`, nat: "25%", good: profile.indicators.singleParentRate < 25 },
        { label: "Disability Rate", value: `${profile.indicators.disabilityRate}%`, nat: "13%", good: profile.indicators.disabilityRate < 13 },
      ];
      slide5.addText(["Indicator", "Your Area", "National Avg", "Status"].join("          "), { x: 0.3, y: 1.3, w: 9.4, h: 0.4, fontSize: 10, bold: true, color: NAVY, fontFace: "Arial" });

      for (let i = 0; i < indicators.length; i++) {
        const ind = indicators[i];
        const y = 1.8 + i * 0.55;
        slide5.addShape("rect", { x: 0.3, y, w: 9.4, h: 0.45, fill: { color: i % 2 === 0 ? GRAY : WHITE } });
        slide5.addText(ind.label, { x: 0.5, y: y + 0.05, w: 2.5, h: 0.35, fontSize: 11, color: DARK, fontFace: "Arial" });
        slide5.addText(ind.value, { x: 3.2, y: y + 0.05, w: 1.8, h: 0.35, fontSize: 12, color: NAVY, bold: true, fontFace: "Arial", align: "center" });
        slide5.addText(ind.nat, { x: 5.2, y: y + 0.05, w: 1.8, h: 0.35, fontSize: 11, color: "888888", fontFace: "Arial", align: "center" });
        slide5.addText(ind.good ? "Strong" : "Needs Attention", { x: 7.2, y: y + 0.05, w: 2, h: 0.35, fontSize: 11, color: ind.good ? GREEN : RED, bold: true, fontFace: "Arial", align: "center" });
      }
      addFooter(slide5, slideNum, totalSlides);

      if (profile.goingWell.length > 0) {
        const slide6 = pptx.addSlide();
        slideNum++;
        addHeader(slide6, "What's Going Well");
        slide6.addText("Every community has strengths. Here's what the data says about yours:", { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 14, color: DARK, fontFace: "Arial" });
        for (let i = 0; i < Math.min(profile.goingWell.length, 6); i++) {
          const item = profile.goingWell[i];
          const y = 2.0 + i * 0.8;
          slide6.addShape("rect", { x: 0.5, y, w: 9, h: 0.7, fill: { color: "f0fff4" }, rectRadius: 0.05, line: { color: GREEN, width: 1 } });
          slide6.addText(`+ ${item.label}`, { x: 0.8, y: y + 0.05, w: 3, h: 0.3, fontSize: 12, color: GREEN, bold: true, fontFace: "Arial" });
          slide6.addText(item.detail, { x: 0.8, y: y + 0.35, w: 8.5, h: 0.3, fontSize: 10, color: DARK, fontFace: "Arial" });
        }
        addFooter(slide6, slideNum, totalSlides);

        if (profile.goingWell.length > 6) {
          const slide6b = pptx.addSlide();
          slideNum++;
          addHeader(slide6b, "What's Going Well (continued)");
          for (let i = 6; i < profile.goingWell.length; i++) {
            const item = profile.goingWell[i];
            const y = 1.4 + (i - 6) * 0.8;
            slide6b.addShape("rect", { x: 0.5, y, w: 9, h: 0.7, fill: { color: "f0fff4" }, rectRadius: 0.05, line: { color: GREEN, width: 1 } });
            slide6b.addText(`+ ${item.label}`, { x: 0.8, y: y + 0.05, w: 3, h: 0.3, fontSize: 12, color: GREEN, bold: true, fontFace: "Arial" });
            slide6b.addText(item.detail, { x: 0.8, y: y + 0.35, w: 8.5, h: 0.3, fontSize: 10, color: DARK, fontFace: "Arial" });
          }
          addFooter(slide6b, slideNum, totalSlides);
        }
      }

      if (profile.needsAttention.length > 0) {
        for (let page = 0; page < Math.ceil(profile.needsAttention.length / 3); page++) {
          const slideN = pptx.addSlide();
          slideNum++;
          addHeader(slideN, page === 0 ? "Areas That Need Attention" : "Areas That Need Attention (continued)");
          if (page === 0) {
            slideN.addText("These challenges are common and solvable. Here are evidence-based solutions:", { x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 13, color: DARK, fontFace: "Arial" });
          }
          const startIdx = page * 3;
          const items = profile.needsAttention.slice(startIdx, startIdx + 3);
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const y = (page === 0 ? 1.9 : 1.4) + i * 1.7;
            slideN.addShape("rect", { x: 0.5, y, w: 9, h: 1.5, fill: { color: "fff5f5" }, rectRadius: 0.05, line: { color: RED, width: 1 } });
            slideN.addText(`! ${item.label}`, { x: 0.8, y: y + 0.1, w: 4, h: 0.3, fontSize: 13, color: RED, bold: true, fontFace: "Arial" });
            slideN.addText(`${item.value}${typeof item.value === 'number' && item.value < 100 ? '%' : ''}`, { x: 7.5, y: y + 0.1, w: 1.8, h: 0.3, fontSize: 14, color: RED, bold: true, fontFace: "Arial", align: "right" });
            slideN.addText(item.detail, { x: 0.8, y: y + 0.45, w: 8.5, h: 0.35, fontSize: 10, color: DARK, fontFace: "Arial" });
            slideN.addText(`Solution: ${item.solution}`, { x: 0.8, y: y + 0.85, w: 8.5, h: 0.5, fontSize: 10, color: NAVY, fontFace: "Arial", italic: true });
          }
          addFooter(slideN, slideNum, totalSlides);
        }
      }

      if (scenario) {
        const slideS = pptx.addSlide();
        slideNum++;
        addHeader(slideS, "Scenario Analysis: \"What If?\"");
        slideS.addText("Using CDC/ATSDR SVI methodology, here's what happens when we change key indicators:", { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 13, color: DARK, fontFace: "Arial" });
        const sviDelta = scenario.adjusted.sviScore - profile.sviScore;
        slideS.addShape("rect", { x: 1.5, y: 2.0, w: 3, h: 1.5, fill: { color: GRAY }, rectRadius: 0.1 });
        slideS.addText("Current SVI", { x: 1.5, y: 2.1, w: 3, h: 0.3, fontSize: 12, color: DARK, align: "center", fontFace: "Arial" });
        slideS.addText(`${profile.sviScore}`, { x: 1.5, y: 2.5, w: 3, h: 0.7, fontSize: 32, color: NAVY, bold: true, align: "center", fontFace: "Arial" });

        slideS.addText("->", { x: 4.5, y: 2.5, w: 1, h: 0.5, fontSize: 24, color: GOLD, align: "center", fontFace: "Arial" });

        const adjColor = sviDelta < 0 ? GREEN : RED;
        slideS.addShape("rect", { x: 5.5, y: 2.0, w: 3, h: 1.5, fill: { color: sviDelta < 0 ? "f0fff4" : "fff5f5" }, rectRadius: 0.1 });
        slideS.addText("Projected SVI", { x: 5.5, y: 2.1, w: 3, h: 0.3, fontSize: 12, color: DARK, align: "center", fontFace: "Arial" });
        slideS.addText(`${scenario.adjusted.sviScore}`, { x: 5.5, y: 2.5, w: 3, h: 0.7, fontSize: 32, color: adjColor, bold: true, align: "center", fontFace: "Arial" });

        const lines = scenario.narrative.split("\n").filter((l: string) => l.startsWith("-"));
        let yPos = 4.0;
        for (const line of lines.slice(0, 6)) {
          slideS.addText(line, { x: 0.8, y: yPos, w: 8.5, h: 0.35, fontSize: 11, color: DARK, fontFace: "Arial" });
          yPos += 0.4;
        }
        addFooter(slideS, slideNum, totalSlides);
      }

      if (grants && grants.length > 0) {
        const grantPages = Math.min(Math.ceil(grants.length / 4), 3);
        for (let page = 0; page < grantPages; page++) {
          const slideG = pptx.addSlide();
          slideNum++;
          addHeader(slideG, page === 0 ? "Matched Grants & Resources" : `Grants & Resources (continued)`);
          if (page === 0) {
            slideG.addText("Based on your neighborhood's specific needs, these grants and resources are a strong match:", { x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 13, color: DARK, fontFace: "Arial" });
          }
          const startIdx = page * 4;
          const pageGrants = grants.slice(startIdx, startIdx + 4);
          for (let i = 0; i < pageGrants.length; i++) {
            const g = pageGrants[i];
            const y = (page === 0 ? 1.9 : 1.4) + i * 1.3;
            slideG.addShape("rect", { x: 0.5, y, w: 9, h: 1.1, fill: { color: "fffff0" }, rectRadius: 0.05, line: { color: GOLD, width: 1 } });
            slideG.addText(`${startIdx + i + 1}. ${g.title}`, { x: 0.8, y: y + 0.05, w: 8.5, h: 0.3, fontSize: 11, color: NAVY, bold: true, fontFace: "Arial" });
            const details = [g.agency, g.fundingAmount, g.deadline ? `Deadline: ${new Date(g.deadline).toLocaleDateString()}` : null].filter(Boolean).join(" | ");
            slideG.addText(details, { x: 0.8, y: y + 0.35, w: 8.5, h: 0.25, fontSize: 9, color: "666666", fontFace: "Arial" });
            if (g.sourceUrl) slideG.addText(g.sourceUrl, { x: 0.8, y: y + 0.65, w: 8.5, h: 0.25, fontSize: 8, color: "3182ce", fontFace: "Arial" });
          }
          addFooter(slideG, slideNum, totalSlides);
        }
      }

      const slideAction = pptx.addSlide();
      slideNum++;
      addHeader(slideAction, "Your Action Plan");
      slideAction.addText("What You Can Do Right Now", { x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 18, color: NAVY, bold: true, fontFace: "Arial" });

      const actionSteps = [
        "Share this report with your neighborhood association or community organization",
        "Identify which challenges resonate most with your lived experience",
        ...profile.needsAttention.slice(0, 5).map(item => `${item.label}: ${item.solution.split('.')[0]}`),
        "Apply for the matched grants listed in this report",
        "Connect with ThriveUp Academy for free training and advocacy tools",
        "Revisit this tool quarterly to track community improvements",
      ];

      for (let i = 0; i < Math.min(actionSteps.length, 8); i++) {
        const y = 2.0 + i * 0.55;
        slideAction.addShape("rect", { x: 0.5, y, w: 0.4, h: 0.4, fill: { color: NAVY }, rectRadius: 0.2 });
        slideAction.addText(`${i + 1}`, { x: 0.5, y, w: 0.4, h: 0.4, fontSize: 12, color: WHITE, align: "center", fontFace: "Arial", bold: true, valign: "middle" });
        slideAction.addText(actionSteps[i], { x: 1.1, y, w: 8.4, h: 0.4, fontSize: 11, color: DARK, fontFace: "Arial", valign: "middle" });
      }
      addFooter(slideAction, slideNum, totalSlides);

      const slideEnd = pptx.addSlide();
      slideNum++;
      slideEnd.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: NAVY } });
      slideEnd.addText("Data is Power.\nKnowledge is Action.\nYour Community Matters.", { x: 1, y: 1.5, w: 8, h: 2.5, fontSize: 28, fontFace: "Arial", color: WHITE, align: "center", bold: true, lineSpacing: 40 });
      slideEnd.addText("This report was generated by ThriveUp Academy's\nNeighborhood Intelligence Engine", { x: 1, y: 4.2, w: 8, h: 0.8, fontSize: 14, fontFace: "Arial", color: GOLD, align: "center" });
      slideEnd.addText("Data: U.S. Census Bureau ACS 5-Year Estimates (2018-2022)\nMethodology: CDC/ATSDR Social Vulnerability Index\nResearch: Stillwell (2026) SVI-Education Correlation", { x: 1, y: 5.3, w: 8, h: 1, fontSize: 10, fontFace: "Arial", color: "aaaaaa", align: "center", lineSpacing: 16 });
      slideEnd.addText("www.thrivingcommunitiesforall.com", { x: 1, y: 6.5, w: 8, h: 0.4, fontSize: 12, fontFace: "Arial", color: GOLD, align: "center" });

      const pptxBuffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      res.setHeader("Content-Disposition", `attachment; filename="Neighborhood_Report_${profile.zipCode}_${Date.now()}.pptx"`);
      res.send(pptxBuffer);
    } catch (err) {
      console.error("Presentation generation error:", err);
      res.status(500).json({ error: "Failed to generate presentation." });
    }
  });

  const emailRateLimit = new Map<string, number>();
  app.post("/api/neighborhood/email-report", async (req, res) => {
    try {
      const { profile, recipientEmail } = req.body;
      if (!profile || !recipientEmail) return res.status(400).json({ error: "Profile and recipient email required." });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail) || recipientEmail.length > 254) {
        return res.status(400).json({ error: "Please provide a valid email address." });
      }

      const ip = req.ip || "unknown";
      const now = Date.now();
      const lastSent = emailRateLimit.get(ip) || 0;
      if (now - lastSent < 30000) {
        return res.status(429).json({ error: "Please wait 30 seconds between email requests." });
      }
      emailRateLimit.set(ip, now);

      const sanitize = (s: string) => String(s || "").replace(/[<>]/g, "").substring(0, 500);
      const safeProfile = {
        ...profile,
        neighborhoodName: sanitize(profile.neighborhoodName),
        countyName: sanitize(profile.countyName),
        stateName: sanitize(profile.stateName),
        tractName: sanitize(profile.tractName),
      };

      const { sendNeighborhoodReport } = await import("./email-service");
      const sent = await sendNeighborhoodReport(safeProfile, recipientEmail);
      res.json({ sent, message: sent ? "Report emailed successfully." : "Email delivery pending." });
    } catch (err) {
      console.error("Email error:", err);
      res.json({ sent: false, message: "Email service currently unavailable. Please download the PDF instead." });
    }
  });

}
