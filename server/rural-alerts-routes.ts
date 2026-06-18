/**
 * Rural Situational Intelligence — Live alert feeds
 * Sources: NOAA Weather API · FEMA Disaster Declarations · NIFC Wildfire ·
 *          NOAA/USDA Drought Monitor · USDA APHIS Animal Health Alerts (RSS)
 * All public APIs — no keys required for these endpoints.
 */
import { Router, type Request, type Response } from "express";

// ── helpers ──────────────────────────────────────────────────────────────────
async function fetchJson(url: string, opts?: RequestInit): Promise<any> {
  const r = await fetch(url, {
    headers: { "User-Agent": "ThriveUp-RuralIntel/1.0 (terryflood@thrivingcommunitiesforall.com)", "Accept": "application/json" },
    signal: AbortSignal.timeout(12000),
    ...opts,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
  return r.json();
}

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { "User-Agent": "ThriveUp-RuralIntel/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const US_STATES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",
  CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",
  IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",
  ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",
  MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",
  WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};

// ── NOAA Weather Alerts ───────────────────────────────────────────────────────
async function getNoaaAlerts(state: string) {
  try {
    const data = await fetchJson(`https://api.weather.gov/alerts/active?area=${state}&limit=50`);
    const features = data.features || [];
    return features.map((f: any) => ({
      id: f.id,
      event: f.properties.event,
      headline: f.properties.headline,
      severity: f.properties.severity,
      urgency: f.properties.urgency,
      certainty: f.properties.certainty,
      description: f.properties.description?.slice(0, 400),
      instruction: f.properties.instruction?.slice(0, 300),
      onset: f.properties.onset,
      expires: f.properties.expires,
      areas: f.properties.areaDesc,
      category: classifyNoaaEvent(f.properties.event),
      source: "NOAA National Weather Service",
      sourceUrl: `https://www.weather.gov/`,
    }));
  } catch (e: any) {
    console.error("[RuralAlerts] NOAA alerts error:", e.message);
    return [];
  }
}

function classifyNoaaEvent(event: string): string {
  const e = event?.toLowerCase() || "";
  if (e.includes("drought")) return "drought";
  if (e.includes("fire") || e.includes("smoke") || e.includes("red flag")) return "wildfire";
  if (e.includes("flood") || e.includes("flash flood")) return "flood";
  if (e.includes("tornado") || e.includes("severe thunder") || e.includes("hail")) return "severe-storm";
  if (e.includes("freeze") || e.includes("frost") || e.includes("cold") || e.includes("winter") || e.includes("ice") || e.includes("snow") || e.includes("blizzard")) return "freeze";
  if (e.includes("heat") || e.includes("excessive heat")) return "heat";
  if (e.includes("wind") || e.includes("dust") || e.includes("hurricane") || e.includes("tropical")) return "wind";
  return "weather";
}

// ── FEMA Disaster Declarations ─────────────────────────────────────────────
async function getFemaDisasters(state: string) {
  try {
    const url = `https://www.fema.gov/api/open/v2/disasterDeclarationsSummaries?state=${state}&declarationType=DR&$orderby=declarationDate desc&$top=20&$filter=incidentEndDate ge '2024-01-01T00:00:00.000z'`;
    const data = await fetchJson(url);
    return (data.DisasterDeclarationsSummaries || []).map((d: any) => ({
      disasterNumber: d.disasterNumber,
      declarationType: d.declarationType,
      title: d.declarationTitle,
      state: d.state,
      county: d.designatedArea,
      incidentType: d.incidentType,
      declarationDate: d.declarationDate,
      incidentBegin: d.incidentBeginDate,
      incidentEnd: d.incidentEndDate,
      programsApproved: [
        d.ihProgramDeclared && "Individual Assistance",
        d.iaProgramDeclared && "Individual Assistance (IA)",
        d.paProgramDeclared && "Public Assistance",
        d.hmProgramDeclared && "Hazard Mitigation",
      ].filter(Boolean),
      applyUrl: `https://www.disasterassistance.gov/`,
      source: "FEMA Disaster Declarations",
      sourceUrl: `https://www.fema.gov/disaster/${d.disasterNumber}`,
    }));
  } catch (e: any) {
    console.error("[RuralAlerts] FEMA error:", e.message);
    return [];
  }
}

// ── NIFC Active Wildfires ──────────────────────────────────────────────────
async function getActiveWildfires(state: string) {
  try {
    const stateFilter = state ? `&where=POOState='${US_STATES[state] || state}'` : "&where=1=1";
    const url = `https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?${stateFilter}&outFields=IncidentName,POOState,POOCounty,FireDiscoveryDateTime,DailyAcres,PercentContained,FireCause,IncidentTypeCategory,ModifiedOnDateTime_dt&resultRecordCount=30&f=json&orderByFields=DailyAcres desc`;
    const data = await fetchJson(url);
    return (data.features || []).map((f: any) => {
      const a = f.attributes;
      return {
        name: a.IncidentName,
        state: a.POOState,
        county: a.POOCounty,
        discoveredAt: a.FireDiscoveryDateTime ? new Date(a.FireDiscoveryDateTime).toISOString() : null,
        acres: a.DailyAcres,
        percentContained: a.PercentContained,
        cause: a.FireCause,
        type: a.IncidentTypeCategory,
        source: "NIFC — National Interagency Fire Center",
        sourceUrl: "https://www.nifc.gov/fire-information/active-incidents",
      };
    });
  } catch (e: any) {
    console.error("[RuralAlerts] NIFC wildfire error:", e.message);
    return [];
  }
}

// ── US Drought Monitor ─────────────────────────────────────────────────────
async function getDroughtConditions(state: string) {
  try {
    const url = `https://usdm.climate.unl.edu/api/usdm/${state}/current`;
    const data = await fetchJson(url);
    return {
      state,
      stateName: US_STATES[state] || state,
      data: data,
      droughtUrl: `https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?${state}`,
      source: "U.S. Drought Monitor (NOAA/USDA/UNL)",
      sourceUrl: "https://droughtmonitor.unl.edu/",
    };
  } catch {
    // Fallback: use public weekly summary JSON
    try {
      const today = new Date();
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      // Tuesday release — find nearest
      const url2 = `https://usdm.climate.unl.edu/api/usdmstats/GetDroughtMonitorSummaryStatistics?aoi=state&aoiId=${state}&startDate=2024-01-02&endDate=${new Date().toISOString().split("T")[0]}&statisticsType=1`;
      const data2 = await fetchJson(url2);
      return {
        state,
        stateName: US_STATES[state] || state,
        history: (data2 || []).slice(-4),
        droughtUrl: `https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?${state}`,
        source: "U.S. Drought Monitor (NOAA/USDA/UNL)",
        sourceUrl: "https://droughtmonitor.unl.edu/",
      };
    } catch (e2: any) {
      return {
        state,
        stateName: US_STATES[state] || state,
        error: "Drought data temporarily unavailable",
        droughtUrl: `https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?${state}`,
        source: "U.S. Drought Monitor",
        sourceUrl: "https://droughtmonitor.unl.edu/",
      };
    }
  }
}

// ── USDA APHIS Animal & Plant Health Alerts (news feed) ───────────────────
async function getAphisAlerts(state?: string) {
  const KNOWN_ALERTS = [
    {
      id: "screwworm-2025",
      title: "New World Screwworm — USDA APHIS Emergency Response",
      type: "livestock-disease",
      severity: "critical",
      states: ["TX","NM","AZ","FL","GA","AL","MS","LA","AR"],
      summary: "New World Screwworm (NWS) detected in livestock and wildlife. USDA APHIS has issued an emergency response. All livestock showing signs of wound myiasis should be inspected immediately. Report suspected cases to your state veterinarian.",
      actions: [
        "Inspect all livestock wounds daily — especially during fly season",
        "Report any suspect NWS cases to USDA APHIS: 1-800-USDA-NWS or your state vet",
        "Do NOT move potentially infested animals across state lines",
        "Maintain wound hygiene — treat and cover all injuries",
        "Flies lay eggs in fresh wounds — check ears, navels, dehorning sites",
      ],
      reportUrl: "https://www.aphis.usda.gov/livestock-poultry-disease/swine/new-world-screwworm",
      source: "USDA APHIS",
      updatedAt: "2025-06-01",
    },
    {
      id: "hpai-2024",
      title: "Highly Pathogenic Avian Influenza (H5N1) — Active Detections",
      type: "livestock-disease",
      severity: "high",
      states: ["TX","MI","CO","OH","ID","WA","ND","SD","MN","IA"],
      summary: "H5N1 HPAI continues to circulate in dairy cattle and poultry flocks. Enhanced biosecurity measures required for all poultry and dairy operations.",
      actions: [
        "Restrict access to poultry and dairy areas — no shared equipment",
        "Wear PPE when handling sick animals",
        "Report unusual mortality or production drops immediately",
        "Do not allow wild birds access to livestock feed/water",
      ],
      reportUrl: "https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza",
      source: "USDA APHIS",
      updatedAt: "2025-05-15",
    },
    {
      id: "citrus-greening",
      title: "Citrus Greening (HLB) — Huanglongbing",
      type: "plant-disease",
      severity: "high",
      states: ["FL","CA","TX","AZ","LA"],
      summary: "Citrus greening remains the most destructive citrus disease worldwide. Asian citrus psyllid vector is established in affected states. All citrus growers must maintain trapping and reporting.",
      actions: [
        "Install and monitor yellow sticky traps for Asian citrus psyllid",
        "Report symptomatic trees to your state department of agriculture",
        "Do not move citrus plant material across quarantine boundaries",
        "Contact your county extension office for approved treatment options",
      ],
      reportUrl: "https://www.aphis.usda.gov/plant-pests-diseases/citrus/citrus-greening",
      source: "USDA APHIS",
      updatedAt: "2025-04-01",
    },
    {
      id: "spotted-wing-drosophila",
      title: "Spotted Wing Drosophila — Small Fruit Alert",
      type: "pest",
      severity: "moderate",
      states: ["WA","OR","CA","MI","NC","GA","FL","NY","PA","OH"],
      summary: "SWD populations are active. Thin-skinned fruit crops (blueberries, raspberries, cherries, strawberries) at high risk during harvest season. Monitor traps weekly.",
      actions: [
        "Set vinegar or commercial SWD traps at field margins",
        "Harvest frequently — do not allow overripe fruit to remain on plants",
        "Apply registered insecticides per label — rotate modes of action",
        "Remove and destroy cull fruit immediately",
      ],
      reportUrl: "https://www.ipm.ucdavis.edu/agriculture/small-fruit/spotted-wing-drosophila/",
      source: "USDA APHIS / UC IPM",
      updatedAt: "2025-06-01",
    },
  ];

  const filtered = state
    ? KNOWN_ALERTS.filter(a => a.states.includes(state))
    : KNOWN_ALERTS;

  // Also try live APHIS RSS
  let liveAlerts: any[] = [];
  try {
    const rss = await fetchText("https://www.aphis.usda.gov/rss/animal_health.xml");
    const items = rss.match(/<item>([\s\S]*?)<\/item>/g) || [];
    liveAlerts = items.slice(0, 8).map(item => ({
      id: "aphis-" + Math.random().toString(36).slice(2),
      title: (item.match(/<title>(.*?)<\/title>/) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
      link: (item.match(/<link>(.*?)<\/link>/) || [])[1]?.trim(),
      pubDate: (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1]?.trim(),
      type: "aphis-news",
      severity: "info",
      source: "USDA APHIS Animal Health",
      sourceUrl: "https://www.aphis.usda.gov/",
    })).filter(a => a.title);
  } catch { /* APHIS RSS not critical */ }

  return { curated: filtered, live: liveAlerts };
}

// ── Route registration ─────────────────────────────────────────────────────
export function registerRuralAlertsRoutes(app: any) {

  // Unified feed — all alert types for a state
  app.get("/api/rural-alerts/feed", async (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    try {
      const [weather, fema, wildfires, drought, aphis] = await Promise.allSettled([
        getNoaaAlerts(state),
        getFemaDisasters(state),
        getActiveWildfires(state),
        getDroughtConditions(state),
        getAphisAlerts(state),
      ]);

      const toValue = (r: PromiseSettledResult<any>, fallback: any) =>
        r.status === "fulfilled" ? r.value : fallback;

      res.json({
        state,
        stateName: US_STATES[state] || state,
        generatedAt: new Date().toISOString(),
        sections: {
          weather: { alerts: toValue(weather, []), source: "NOAA National Weather Service" },
          disasters: { declarations: toValue(fema, []), source: "FEMA" },
          wildfires: { incidents: toValue(wildfires, []), source: "NIFC" },
          drought: toValue(drought, { state, error: "unavailable" }),
          aphis: toValue(aphis, { curated: [], live: [] }),
        },
        resources: {
          disasterAssistance: "https://www.disasterassistance.gov/",
          agDisasterPrograms: "https://www.fsa.usda.gov/programs-and-services/disaster-assistance-program/index",
          nrcsEmergency: "https://www.nrcs.usda.gov/programs-and-services/emergency-programs/index",
          aphi: "https://www.aphis.usda.gov/",
          droughtMonitor: `https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?${state}`,
          nifc: "https://www.nifc.gov/fire-information/active-incidents",
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // NOAA weather alerts only
  app.get("/api/rural-alerts/weather", async (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    try {
      const alerts = await getNoaaAlerts(state);
      res.json({ state, alerts, total: alerts.length, source: "NOAA National Weather Service", sourceUrl: "https://api.weather.gov" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // FEMA disasters only
  app.get("/api/rural-alerts/disasters", async (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    try {
      const declarations = await getFemaDisasters(state);
      res.json({ state, declarations, total: declarations.length, source: "FEMA", applyUrl: "https://www.disasterassistance.gov/" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // NIFC wildfires only
  app.get("/api/rural-alerts/wildfires", async (req: Request, res: Response) => {
    const state = (req.query.state as string || "CA").toUpperCase();
    try {
      const incidents = await getActiveWildfires(state);
      res.json({ state, incidents, total: incidents.length, source: "NIFC", sourceUrl: "https://www.nifc.gov/" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Drought monitor
  app.get("/api/rural-alerts/drought", async (req: Request, res: Response) => {
    const state = (req.query.state as string || "TX").toUpperCase();
    try {
      const data = await getDroughtConditions(state);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // APHIS disease & pest alerts
  app.get("/api/rural-alerts/aphis", async (req: Request, res: Response) => {
    const state = req.query.state as string || "";
    try {
      const data = await getAphisAlerts(state.toUpperCase() || undefined);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ZIP → county → state lookup helper (uses Census geocoder)
  app.get("/api/rural-alerts/zip-lookup", async (req: Request, res: Response) => {
    const zip = req.query.zip as string;
    if (!zip || !/^\d{5}$/.test(zip)) return res.status(400).json({ error: "Valid 5-digit ZIP required" });
    try {
      const url = `https://geocoding.geo.census.gov/geocoder/geographies/address?street=&city=&state=&zip=${zip}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      const data = await fetchJson(url);
      const matches = data?.result?.addressMatches || [];
      if (!matches.length) return res.json({ zip, state: null, county: null, note: "ZIP not matched" });
      const geo = matches[0].geographies?.["Counties"]?.[0];
      const stateCode = Object.keys(US_STATES).find(k =>
        US_STATES[k].toLowerCase() === (matches[0].addressComponents?.state || "").toLowerCase()
      ) || matches[0].addressComponents?.state;
      res.json({
        zip,
        state: stateCode,
        stateName: US_STATES[stateCode || ""] || matches[0].addressComponents?.state,
        county: geo?.NAME || matches[0].addressComponents?.city,
        fips: geo?.STATE + geo?.COUNTY,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
