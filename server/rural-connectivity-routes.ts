/**
 * Rural Connectivity & Infrastructure Hub
 * Sources: FCC Broadband Map API · USDA ReConnect · USDA Community Facilities ·
 *          USDA Rural Energy for America (REAP) · Census transportation data
 */
import { type Request, type Response } from "express";

async function fetchJson(url: string, opts?: RequestInit): Promise<any> {
  const r = await fetch(url, {
    headers: { "User-Agent": "ThriveUp-RuralConnectivity/1.0 (terryflood@thrivingcommunitiesforall.com)", "Accept": "application/json" },
    signal: AbortSignal.timeout(12000),
    ...opts,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
  return r.json();
}

// FCC Broadband availability by lat/lng
async function getFccBroadband(lat: number, lng: number) {
  try {
    // FCC Broadband Map API — fabric location lookup
    const locationUrl = `https://broadbandmap.fcc.gov/api/public/map/listAvailability?latitude=${lat}&longitude=${lng}&unit=0&category=Fixed+Broadband`;
    const data = await fetchJson(locationUrl);
    const providers = (data?.availability || []).map((p: any) => ({
      provider: p.brand_name || p.provider_id,
      technology: decodeTech(p.technology),
      maxDownMbps: p.max_advertised_download_speed,
      maxUpMbps: p.max_advertised_upload_speed,
      isBusinessOnly: p.business_residential_code === "X",
    }));
    const hasHighSpeed = providers.some((p: any) => p.maxDownMbps >= 100 && p.maxUpMbps >= 20);
    const hasBroadband = providers.some((p: any) => p.maxDownMbps >= 25 && p.maxUpMbps >= 3);
    return {
      lat, lng,
      providers,
      summary: {
        totalProviders: providers.length,
        hasFccBroadband: hasBroadband,
        hasHighSpeed,
        isBroadbandDesert: !hasBroadband,
        note: !hasBroadband ? "This location appears to be a broadband desert (no 25/3 Mbps service)" : hasHighSpeed ? "High-speed service available" : "Basic broadband available",
      },
      reConnectEligible: !hasBroadband,
      source: "FCC National Broadband Map",
      sourceUrl: `https://broadbandmap.fcc.gov/location/fixed?location_id=&addr=&lat=${lat}&lon=${lng}&zoom=14`,
    };
  } catch (e: any) {
    console.error("[RuralConnectivity] FCC broadband error:", e.message);
    return { lat, lng, error: "FCC data unavailable", isBroadbandDesert: null, providers: [] };
  }
}

function decodeTech(code: number): string {
  const techs: Record<number, string> = {
    10: "DSL", 11: "ADSL2", 12: "VDSL", 40: "Cable", 41: "Cable (DOCSIS 3.0)",
    42: "Cable (DOCSIS 3.1)", 43: "Cable (DOCSIS 4.0)", 50: "Fiber", 60: "Satellite",
    61: "LEO Satellite (Starlink-type)", 70: "Fixed Wireless", 71: "Licensed Fixed Wireless",
    72: "Licensed LTE Fixed Wireless", 300: "3G Wireless", 301: "4G LTE", 302: "5G",
  };
  return techs[code] || `Technology code ${code}`;
}

// USDA ReConnect eligibility
function getReConnectEligibility(isRural: boolean, hasBroadband: boolean, popUnder25k?: boolean) {
  if (!isRural) {
    return { eligible: false, reason: "ReConnect requires rural area designation (< 10K population per square mile)" };
  }
  return {
    eligible: !hasBroadband || popUnder25k,
    programs: [
      {
        name: "USDA ReConnect Round 4",
        description: "Provides loans, grants, and loan/grant combinations to build broadband infrastructure in rural areas lacking 100/20 Mbps service.",
        maxAward: "$25M grant or $25M loan or $25M combination",
        match: "25% match required for grants",
        eligibleUses: ["Fiber optic", "Fixed wireless", "Community anchor institutions"],
        requirements: [
          "Service area must lack 100/20 Mbps broadband to 90%+ of locations",
          "Rural area — generally fewer than 10,000 people per square mile",
          "Project must serve at least 50% rural locations",
        ],
        applicationUrl: "https://www.rd.usda.gov/programs-services/telecommunications-programs/reconnect-program",
        technicalAssistance: "https://ruraldevelopment.us/reconnect-technical-assistance",
      },
    ],
    digitalEquity: {
      program: "NTIA Digital Equity Act Programs",
      description: "State Digital Equity Plans + Digital Equity Capacity Grant Program",
      url: "https://www.internetforall.gov/",
    },
    eRate: {
      program: "FCC E-Rate",
      description: "Schools and libraries can receive up to 90% discount on broadband — especially important for rural communities",
      url: "https://www.usac.org/e-rate/",
    },
    source: "USDA ReConnect / NTIA / FCC",
  };
}

// USDA Community Facilities programs
function getCommunityFacilitiesPrograms() {
  return {
    programs: [
      {
        name: "Community Facilities Direct Loan & Grant",
        administrator: "USDA Rural Development",
        description: "Funds essential community facilities in rural areas: health care, public safety, community support, educational, and public service facilities.",
        eligibleProjects: ["Hospitals", "Clinics", "Schools", "Libraries", "Fire stations", "Community centers", "Child care centers", "Food pantries"],
        maxGrant: "Up to 75% of eligible project costs (highest priority: poverty-stricken communities)",
        loanTerms: "Up to 40 years at reduced rates",
        eligibility: "Public bodies, nonprofits, tribes in rural areas < 20,000 population",
        url: "https://www.rd.usda.gov/programs-services/community-facilities-direct-loan-grant-program",
      },
      {
        name: "Community Facilities Guaranteed Loan",
        administrator: "USDA Rural Development",
        description: "Guarantees loans made by approved lenders for essential community facility projects.",
        maxLoan: "$100M",
        url: "https://www.rd.usda.gov/programs-services/community-facilities-guaranteed-loan-program",
      },
      {
        name: "Rural Energy for America Program (REAP)",
        administrator: "USDA Rural Development",
        description: "Grants and loan guarantees for renewable energy systems and energy efficiency improvements for agricultural producers and rural small businesses.",
        maxGrant: "Up to 50% of eligible project costs",
        eligibleProjects: ["Solar", "Wind", "Biogas", "Energy efficiency upgrades", "EV charging stations"],
        url: "https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-guaranteed-loans",
      },
      {
        name: "Rural Water & Waste Disposal",
        administrator: "USDA Rural Development",
        description: "Funds water and wastewater infrastructure for rural communities.",
        url: "https://www.rd.usda.gov/programs-services/water-environmental-programs/water-waste-disposal-loan-grant-program",
      },
      {
        name: "Distance Learning & Telemedicine",
        administrator: "USDA Rural Development",
        description: "Grants for equipment and technical assistance to expand distance learning and telemedicine access in rural areas.",
        maxGrant: "$1M",
        url: "https://www.rd.usda.gov/programs-services/distance-learning-telemedicine-grants",
      },
    ],
    findOffice: "https://www.rd.usda.gov/contactus/state-offices",
    source: "USDA Rural Development",
  };
}

// Transportation / service desert score
export async function getServiceDesertScore(lat: number, lng: number, stateFips: string, countyFips: string) {
  // Use Census ACS data for vehicle access, commute time, poverty
  let censusData: any = null;
  const censusBit = process.env.CENSUS_API_KEY ? `&key=${process.env.CENSUS_API_KEY}` : "";
  try {
    // B08141: vehicles available, B19013: median household income, B01003: total pop
    const url = `https://api.census.gov/data/2022/acs/acs5?get=B08141_001E,B08141_002E,B19013_001E,B01003_001E,B25003_001E,B25003_002E&for=county:${countyFips}&in=state:${stateFips}${censusBit}`;
    const data = await fetchJson(url);
    if (data?.[1]) {
      const [totalVehicles, noVehicle, medianIncome, totalPop, totalHousing, ownOcc] = data[1];
      censusData = {
        totalPop: parseInt(totalPop),
        noVehicleHouseholds: parseInt(noVehicle),
        medianHouseholdIncome: parseInt(medianIncome),
        ownerOccupied: parseInt(ownOcc),
        totalHousingUnits: parseInt(totalHousing),
        noVehiclePct: totalVehicles > 0 ? ((parseInt(noVehicle) / parseInt(totalVehicles)) * 100).toFixed(1) : null,
      };
    }
  } catch { /* Census optional */ }

  return {
    lat, lng,
    census: censusData,
    desertIndicators: {
      foodDesert: { description: "Low-income area with low supermarket access", checkUrl: "https://www.ers.usda.gov/data-products/food-access-research-atlas/" },
      medicalDesert: { description: "No primary care physician within 60 miles", checkUrl: "https://www.ruralhealthinfo.org/" },
      broadbandDesert: { description: "No 25/3 Mbps fixed broadband", checkUrl: `https://broadbandmap.fcc.gov/location/fixed?lat=${lat}&lon=${lng}&zoom=14` },
      bankingDesert: { description: "No bank or credit union within 10 miles", checkUrl: "https://www.fdic.gov/bank/individual/failed/banklist.html" },
    },
    programs: [
      "USDA Rural Transportation Technical Assistance",
      "FHWA Rural Transportation Planning",
      "FTA Rural Area Formula Grants (Section 5311)",
    ],
    source: "U.S. Census ACS / USDA ERS / FCC",
  };
}

// Cell coverage checker — redirects to FCC
function getCellCoverageInfo(lat: number, lng: number) {
  return {
    fccCoverageMap: `https://broadbandmap.fcc.gov/location/mobile?latitude=${lat}&longitude=${lng}&zoom=14`,
    carriers: ["AT&T","Verizon","T-Mobile","US Cellular","FirstNet (First Responders)"],
    ruralNote: "Rural cell coverage gaps are significant — 20% of rural Americans lack adequate mobile broadband. FCC maps often overstate coverage in rural areas.",
    alternativeSolutions: [
      { name: "Starlink (SpaceX LEO Satellite)", url: "https://www.starlink.com/", note: "Available most rural areas — ~$120/mo + $599 hardware" },
      { name: "HughesNet / Viasat GEO Satellite", url: "https://www.hughesnet.com/", note: "Higher latency, lower cost" },
      { name: "USDA ReConnect Fixed Wireless", url: "https://www.rd.usda.gov/programs-services/telecommunications-programs/reconnect-program", note: "Community solution" },
    ],
    source: "FCC",
  };
}

export function registerRuralConnectivityRoutes(app: any) {

  // FCC broadband by lat/lng
  app.get("/api/rural-connectivity/broadband", async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: "lat and lng required" });
    try {
      const data = await getFccBroadband(lat, lng);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ReConnect eligibility
  app.get("/api/rural-connectivity/reconnect", (req: Request, res: Response) => {
    const isRural = req.query.rural !== "false";
    const hasBroadband = req.query.hasBroadband === "true";
    const popUnder25k = req.query.popUnder25k === "true";
    res.json(getReConnectEligibility(isRural, hasBroadband, popUnder25k));
  });

  // Community Facilities programs
  app.get("/api/rural-connectivity/community-facilities", (_req: Request, res: Response) => {
    res.json(getCommunityFacilitiesPrograms());
  });

  // Service desert score
  app.get("/api/rural-connectivity/desert-score", async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string || "30.26");
    const lng = parseFloat(req.query.lng as string || "-97.74");
    const stateFips = req.query.stateFips as string || "48";
    const countyFips = req.query.countyFips as string || "453";
    try {
      const data = await getServiceDesertScore(lat, lng, stateFips, countyFips);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Cell coverage info
  app.get("/api/rural-connectivity/cell-coverage", (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string || "30.26");
    const lng = parseFloat(req.query.lng as string || "-97.74");
    res.json(getCellCoverageInfo(lat, lng));
  });

  // Full connectivity snapshot
  app.get("/api/rural-connectivity/snapshot", async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string || "30.26");
    const lng = parseFloat(req.query.lng as string || "-97.74");
    const isRural = req.query.rural !== "false";
    const stateFips = req.query.stateFips as string || "48";
    const countyFips = req.query.countyFips as string || "453";
    try {
      const [broadband, desert, cell] = await Promise.allSettled([
        getFccBroadband(lat, lng),
        getServiceDesertScore(lat, lng, stateFips, countyFips),
        Promise.resolve(getCellCoverageInfo(lat, lng)),
      ]);
      const v = (r: any, fallback: any) => r.status === "fulfilled" ? r.value : fallback;
      const bb = v(broadband, { isBroadbandDesert: null });
      res.json({
        lat, lng, generatedAt: new Date().toISOString(),
        broadband: bb,
        reconnect: getReConnectEligibility(isRural, !bb.summary?.isBroadbandDesert),
        communityFacilities: getCommunityFacilitiesPrograms(),
        desertScore: v(desert, {}),
        cellCoverage: v(cell, {}),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
