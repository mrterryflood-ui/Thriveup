import type { Express } from "express";
import { db } from "./storage";
import { invasiveSpeciesSightings, insertInvasiveSpeciesSightingSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";

// USDA APHIS priority invasive species list (top threats to US agriculture)
const APHIS_PRIORITY_SPECIES = [
  { commonName: "Spotted Lanternfly", scientificName: "Lycorma delicatula", category: "insect", hostCrops: ["grapes","apple","hops","cherry","peach"], statesConfirmed: ["PA","NJ","NY","DE","MD","VA","WV","CT","OH","IN","IL","MI","NC","GA"], threat: "critical" },
  { commonName: "Asian Longhorned Beetle", scientificName: "Anoplophora glabripennis", category: "insect", hostCrops: ["maple","birch","elm","willow"], statesConfirmed: ["NY","MA","OH","SC"], threat: "critical" },
  { commonName: "Emerald Ash Borer", scientificName: "Agrilus planipennis", category: "insect", hostCrops: ["ash trees"], statesConfirmed: ["MI","OH","IN","IL","WI","MN","IA","MO","KS","NE","CO","NY","PA","MD","VA","WV","NC","TN","KY"], threat: "critical" },
  { commonName: "Spongy Moth", scientificName: "Lymantria dispar dispar", category: "insect", hostCrops: ["oak","maple","birch","apple","cherry"], statesConfirmed: ["ME","NH","VT","MA","RI","CT","NY","NJ","PA","DE","MD","VA","WV","NC","OH","MI","WI","MN","IN","IL"], threat: "high" },
  { commonName: "Brown Marmorated Stink Bug", scientificName: "Halyomorpha halys", category: "insect", hostCrops: ["apple","peach","corn","soybeans","tomato","pepper"], statesConfirmed: ["MD","VA","WV","PA","NJ","NY","DE","OH","IN","IL","CA","OR","WA"], threat: "high" },
  { commonName: "Kudzu", scientificName: "Pueraria montana", category: "plant", hostCrops: ["general agricultural land"], statesConfirmed: ["GA","AL","MS","TN","SC","NC","VA","KY","FL","TX","OK","AR","LA"], threat: "high" },
  { commonName: "Palmer Amaranth", scientificName: "Amaranthus palmeri", category: "plant", hostCrops: ["cotton","soybean","corn","peanut","sorghum"], statesConfirmed: ["GA","AL","MS","AR","TN","NC","SC","VA","TX","OK","KS","NE","MO","IN","OH","MI","IL","MN","ND","SD"], threat: "high" },
  { commonName: "Giant Hogweed", scientificName: "Heracleum mantegazzianum", category: "plant", hostCrops: ["pasture land"], statesConfirmed: ["NY","PA","OH","WA","OR","MI","VT","NH","ME","MA"], threat: "high" },
  { commonName: "Cheatgrass", scientificName: "Bromus tectorum", category: "plant", hostCrops: ["range/pasture","wheat"], statesConfirmed: ["MT","ID","WY","CO","UT","NV","OR","WA","CA","AZ","NM","TX","ND","SD","NE","KS"], threat: "high" },
  { commonName: "Eurasian Watermilfoil", scientificName: "Myriophyllum spicatum", category: "plant", hostCrops: ["irrigation waterways"], statesConfirmed: ["nationwide"], threat: "moderate" },
  { commonName: "Wild Pig / Feral Hog", scientificName: "Sus scrofa", category: "vertebrate", hostCrops: ["corn","soybean","peanut","pasture","rice"], statesConfirmed: ["TX","CA","FL","GA","AL","SC","NC","LA","OK","AR","MS","TN","KY","VA"], threat: "critical" },
  { commonName: "European Starling", scientificName: "Sturnus vulgaris", category: "vertebrate", hostCrops: ["grapes","cherries","strawberry","blueberry","grain"], statesConfirmed: ["nationwide"], threat: "moderate" },
  { commonName: "Sudden Oak Death", scientificName: "Phytophthora ramorum", category: "pathogen", hostCrops: ["oak","rhododendron","avocado"], statesConfirmed: ["CA","OR"], threat: "critical" },
  { commonName: "Citrus Greening (HLB)", scientificName: "Candidatus Liberibacter asiaticus", category: "pathogen", hostCrops: ["citrus"], statesConfirmed: ["FL","TX","CA","GA","LA","SC"], threat: "critical" },
  { commonName: "Wheat Stem Sawfly", scientificName: "Cephus cinctus", category: "insect", hostCrops: ["wheat","barley","rye"], statesConfirmed: ["MT","ND","SD","WY","CO","MN","WI","MI","NY","PA"], threat: "high" },
];

// iNaturalist county-level invasive species search by bounding box
async function fetchInatCountyInvasives(lat: number, lng: number, page: number = 1): Promise<any[]> {
  const url = `https://api.inaturalist.org/v1/observations?introduced=true&quality_grade=research&lat=${lat}&lng=${lng}&radius=40&per_page=20&page=${page}&order_by=observed_on&order=desc&fields=id,observed_on,taxon.name,taxon.preferred_common_name,taxon.iconic_taxon_name,place_guess,location,description`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.results || [];
  } catch { return []; }
}

// Rough county centroid table (for lat/lng lookup from FIPS)
const STATE_CENTERS: Record<string, { lat: number; lng: number }> = {
  "01":{lat:32.8,lng:-86.8},"02":{lat:64.2,lng:-153.4},"04":{lat:34.2,lng:-111.1},"05":{lat:34.8,lng:-92.2},
  "06":{lat:37.2,lng:-119.7},"08":{lat:39.0,lng:-105.5},"09":{lat:41.6,lng:-72.7},"10":{lat:38.9,lng:-75.5},
  "11":{lat:38.9,lng:-77.0},"12":{lat:28.6,lng:-82.4},"13":{lat:32.7,lng:-83.6},"15":{lat:20.3,lng:-156.4},
  "16":{lat:44.4,lng:-114.6},"17":{lat:40.0,lng:-89.2},"18":{lat:40.3,lng:-86.1},"19":{lat:42.1,lng:-93.5},
  "20":{lat:38.5,lng:-98.4},"21":{lat:37.5,lng:-85.3},"22":{lat:31.0,lng:-91.9},"23":{lat:45.3,lng:-69.2},
  "24":{lat:39.1,lng:-76.8},"25":{lat:42.3,lng:-71.8},"26":{lat:44.3,lng:-85.4},"27":{lat:46.4,lng:-93.1},
  "28":{lat:32.7,lng:-89.7},"29":{lat:38.4,lng:-92.5},"30":{lat:47.0,lng:-110.4},"31":{lat:41.5,lng:-99.7},
  "32":{lat:39.3,lng:-116.6},"33":{lat:43.7,lng:-71.6},"34":{lat:40.1,lng:-74.7},"35":{lat:34.4,lng:-106.1},
  "36":{lat:42.9,lng:-75.5},"37":{lat:35.5,lng:-79.7},"38":{lat:47.5,lng:-100.5},"39":{lat:40.2,lng:-82.8},
  "40":{lat:35.6,lng:-96.9},"41":{lat:44.1,lng:-120.5},"42":{lat:40.9,lng:-77.8},"44":{lat:41.7,lng:-71.5},
  "45":{lat:33.9,lng:-80.9},"46":{lat:44.4,lng:-100.2},"47":{lat:35.9,lng:-86.7},"48":{lat:31.5,lng:-99.3},
  "49":{lat:39.4,lng:-111.1},"50":{lat:44.1,lng:-72.7},"51":{lat:37.5,lng:-78.5},"53":{lat:47.4,lng:-120.5},
  "54":{lat:38.6,lng:-80.6},"55":{lat:44.3,lng:-89.8},"56":{lat:43.0,lng:-107.6},
};

export function registerInvasiveSpeciesRoutes(app: Express) {

  // List USDA APHIS priority species (can filter by state)
  app.get("/api/invasive-species/priority-list", async (req, res) => {
    const { state, category, threat } = req.query as Record<string, string>;
    let list = [...APHIS_PRIORITY_SPECIES];
    if (state) list = list.filter(s => s.statesConfirmed.includes(state.toUpperCase()) || s.statesConfirmed.includes("nationwide"));
    if (category) list = list.filter(s => s.category === category);
    if (threat) list = list.filter(s => s.threat === threat);
    res.json({ total: list.length, species: list, source: "USDA APHIS National Invasive Species framework (curated)" });
  });

  // iNaturalist live observations for a county centroid
  app.get("/api/invasive-species/county-observations", async (req, res) => {
    const { stateFips, lat, lng, page } = req.query as Record<string, string>;
    const centerLat = parseFloat(lat) || STATE_CENTERS[stateFips || "48"]?.lat || 38.5;
    const centerLng = parseFloat(lng) || STATE_CENTERS[stateFips || "48"]?.lng || -97.5;
    const observations = await fetchInatCountyInvasives(centerLat, centerLng, parseInt(page || "1"));
    const formatted = observations.map(o => ({
      inatId: o.id,
      commonName: o.taxon?.preferred_common_name || o.taxon?.name || "Unknown species",
      scientificName: o.taxon?.name,
      category: o.taxon?.iconic_taxon_name,
      observedOn: o.observed_on,
      locationGuess: o.place_guess,
      coordinates: o.location,
      notes: o.description,
    }));
    res.json({
      total: formatted.length,
      centerLat, centerLng,
      observations: formatted,
      inatBrowseUrl: `https://www.inaturalist.org/observations?introduced=true&quality_grade=research&lat=${centerLat}&lng=${centerLng}&radius=40`,
      source: "iNaturalist — research-grade observations only",
    });
  });

  // Community report a sighting
  app.post("/api/invasive-species/report", async (req, res) => {
    try {
      const body = insertInvasiveSpeciesSightingSchema.parse(req.body);
      const [sighting] = await db.insert(invasiveSpeciesSightings).values(body).returning();
      res.json({ success: true, sightingId: sighting.id, message: "Sighting reported. Community-reported sightings help protect your neighbors and your crops." });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // List community-reported sightings
  app.get("/api/invasive-species/community-reports", async (req, res) => {
    const { stateFips, countyFips, category } = req.query as Record<string, string>;
    const all = await db.select().from(invasiveSpeciesSightings).orderBy(desc(invasiveSpeciesSightings.reportedAt));
    let filtered = all;
    if (stateFips) filtered = filtered.filter(s => s.stateFips === stateFips);
    if (countyFips) filtered = filtered.filter(s => s.countyFips === countyFips);
    if (category) filtered = filtered.filter(s => s.speciesCategory === category);
    res.json({ total: filtered.length, sightings: filtered.slice(0, 50) });
  });

  // AI treatment recommendation for a species
  app.post("/api/invasive-species/treatment-recommendation", async (req, res) => {
    const { speciesName, countyName, stateName, cropContext } = req.body;
    if (!speciesName) return res.status(400).json({ error: "speciesName required" });

    const priority = APHIS_PRIORITY_SPECIES.find(s =>
      s.commonName.toLowerCase() === speciesName.toLowerCase() ||
      s.scientificName.toLowerCase() === speciesName.toLowerCase()
    );

    const prompt = `You are an agricultural extension specialist advising a farmer about invasive species management. Based on USDA APHIS and NRCS extension guidance, provide a management recommendation.

Species: ${speciesName} ${priority ? `(${priority.scientificName})` : ""}
Location: ${countyName || "unknown county"}, ${stateName || "unknown state"}
Crop context: ${cropContext || "general farming operation"}
USDA threat level: ${priority?.threat || "unknown"}
Known host crops: ${priority?.hostCrops?.join(", ") || "see USDA APHIS guidance"}

Provide: (1) immediate actions a farmer should take upon discovery, (2) USDA APHIS/NRCS programs available for cost-share treatment, (3) reporting contacts (state plant regulatory officials), (4) long-term management strategy. Be practical and specific. Return as JSON: { immediateActions: string[], usdaPrograms: string[], reportingContacts: string[], longTermStrategy: string, sourceNote: string }`;

    try {
      const result = await generateAIJSON(prompt, '{"immediateActions":[],"usdaPrograms":[],"reportingContacts":[],"longTermStrategy":"","sourceNote":""}');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
