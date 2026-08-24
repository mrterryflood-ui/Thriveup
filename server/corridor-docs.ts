/**
 * Corridor Docs Connector
 * ---------------------------------------------------------------------------
 * Builds a registry of every Austin/Waco document in attached_assets/ and
 * annotates each with its LIVE connection status:
 *   - which chain-web steps back it up
 *   - which community_evidence rows it cites
 *   - which community_partners it references
 *   - which grant_opportunities it targets
 *   - confidence score: green (fully connected) / yellow (partial) / red (unconnected)
 *
 * Endpoints:
 *   GET  /api/corridor/docs            full registry with connection status
 *   GET  /api/corridor/docs/:id        single doc (with source snippets)
 *   POST /api/corridor/docs/rebuild    rescan attached_assets/ and rebuild
 */
import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { db } from "./storage";
import { communityEvidence, communityPartners, grantOpportunities } from "@shared/schema";
import { inArray } from "drizzle-orm";
import { requireStaff } from "./yhsi-routes";

const ASSET_DIR = "attached_assets";
const DECK_DIR = path.join(ASSET_DIR, "decks");

const WACO_COUNTY_FIPS = "48309";
const AUSTIN_COUNTY_FIPS = "48453";

type DocRecord = {
  id: string;
  filename: string;
  fullPath: string;
  kind: "deck" | "narrative" | "loi" | "rfp" | "brief" | "analysis" | "summary" | "other";
  format: "pptx" | "docx" | "pdf" | "md" | "html" | "txt" | "other";
  audience: "funder" | "internal" | "program" | "partner" | "unknown";
  counties: Array<"waco" | "austin">;
  sizeBytes: number;
  modifiedAt: string;
  mentionsMetricKeys: string[];
  mentionsPartners: string[];
  mentionsGrants: string[];
  chainWebSteps: string[];
  livePullsFromApi: boolean;
  buildScript?: string;
};

type ConnectionReport = {
  doc: DocRecord;
  connection: {
    status: "fully-connected" | "partially-connected" | "static";
    score: number; // 0-100
    evidenceMatched: Array<{
      metricKey: string;
      metricLabel: string;
      value: number | null;
      unit: string | null;
      confidence: string | null;
      asOfDate: string | null;
      sourceName: string | null;
      county: "waco" | "austin" | "both";
    }>;
    partnersMatched: Array<{ id: string; name: string; county: string; mouStatus: string | null }>;
    grantsMatched: Array<{ id: string; funder: string; program: string; amount: number | null; status: string | null }>;
    chainWebStepsMatched: string[];
    livePullsFromApi: boolean;
    buildScript?: string;
    issues: string[];
  };
};

const CHAIN_STEP_IDS = [
  "census_total_population",
  "census_black_population",
  "census_black_poverty",
  "census_black_family",
  "census_black_education",
  "cdc_places_county",
  "atsdr_svi_county",
  "fbi_crime_state",
];

// Map: doc-side keyword-group -> (a) textual keywords that surface it in a doc, (b) DB metricKey matchers
const METRIC_KEYWORDS: Record<string, { kws: string[]; dbKeyMatch: string[] }> = {
  population_total: { kws: ["total population", "population of"], dbKeyMatch: ["total_population"] },
  black_population: { kws: ["black population", "african american population", "black share", "black youth"], dbKeyMatch: ["black_population", "black_youth", "black_children"] },
  poverty_black: { kws: ["poverty", "below the poverty", "black poverty"], dbKeyMatch: ["black_poverty"] },
  single_parent_black: { kws: ["single-parent", "single parent", "father-absent", "fatherless", "fatherhood gap", "single mother"], dbKeyMatch: ["single_parent", "single_mother"] },
  education_black_no_hs: { kws: ["without a high school", "no high school", "hs diploma", "dropout", "bachelor"], dbKeyMatch: ["less_than_hs", "bachelors_plus"] },
  mental_health_distress: { kws: ["mental health", "mental distress", "depression", "anxiety"], dbKeyMatch: ["depression", "frequent_mental_distress", "short_sleep"] },
  uninsured_adults: { kws: ["uninsured", "without health insurance", "access to care"], dbKeyMatch: ["uninsured"] },
  crime_violent: { kws: ["violent crime", "homicide", "aggravated assault", "robbery"], dbKeyMatch: ["crime_violent", "crime_homicide", "crime_aggravated", "crime_robbery"] },
  crime_property: { kws: ["property crime", "burglary", "larceny"], dbKeyMatch: ["crime_property", "crime_burglary"] },
  svi_overall: { kws: ["social vulnerability", "svi"], dbKeyMatch: ["svi_"] },
  discipline_black: { kws: ["suspension", "school discipline", "discipline rate", "school-to-prison"], dbKeyMatch: ["discipline"] },
  mentor_gap: { kws: ["mentor", "mentorship", "bbbs", "big brothers"], dbKeyMatch: ["mentor"] },
};

const PARTNER_KEYWORDS = [
  "starry", "prosper waco", "mission waco", "act locally waco", "heart of texas", "mclennan",
  "austin area urban league", "aaul", "measure austin", "out youth", "huston-tillotson", "big brothers big sisters",
  "travis county", "stars nurse", "communities in schools", "capcog", "austin justice coalition",
  "pfisd", "pflugerville", "manor isd", "del valle", "waco isd",
];

const GRANT_KEYWORDS = [
  "st. david", "st davids", "wab", "we all benefit",
  "twc", "workforce commission", "rfa",
  "nbcuniversal", "comcast",
  "spencer foundation",
  "nlm", "g08",
  "agency fund",
  "bja", "second chance",
  "nih", "nsf", "pcori", "borealis", "johnson & johnson", "j&j",
  "samhsa", "cdmrp", "sbir",
];

const COUNTY_KEYWORDS = {
  waco: ["waco", "mclennan", "76704", "76706", "76707", "76708", "76710", "76711"],
  austin: ["austin", "travis county", "78721", "78723", "78724", "78741", "78744"],
};

function classify(filename: string, content: string | null): Pick<DocRecord, "kind" | "audience" | "counties"> {
  const f = filename.toLowerCase();
  const c = (content ?? "").toLowerCase().slice(0, 50000);
  const hay = f + " " + c;
  let kind: DocRecord["kind"] = "other";
  if (/deck|slides|brief|presentation|pptx/.test(f)) kind = "deck";
  else if (/loi|letter of intent|eoi/.test(hay)) kind = "loi";
  else if (/rfp|rfa|solicitation|nofo/.test(hay)) kind = "rfp";
  else if (/analysis|assessment|deep[-_ ]analysis/.test(hay)) kind = "analysis";
  else if (/summary|executive summary/.test(hay)) kind = "summary";
  else if (/narrative|proposal|concept/.test(hay)) kind = "narrative";
  else if (/brief/.test(hay)) kind = "brief";

  let audience: DocRecord["audience"] = "unknown";
  if (/funder|foundation|grant|loi|rfp|rfa|st\. david|spencer|twc|nbcu|nih|nsf|bja/.test(hay)) audience = "funder";
  else if (/partner|mou|coalition|bbbs|urban league/.test(hay)) audience = "partner";
  else if (/curriculum|cohort|program/.test(hay)) audience = "program";
  else audience = "internal";

  const counties: Array<"waco" | "austin"> = [];
  if (COUNTY_KEYWORDS.waco.some((k) => hay.includes(k))) counties.push("waco");
  if (COUNTY_KEYWORDS.austin.some((k) => hay.includes(k))) counties.push("austin");
  return { kind, audience, counties };
}

function extractMentions(content: string): Pick<DocRecord, "mentionsMetricKeys" | "mentionsPartners" | "mentionsGrants" | "chainWebSteps"> {
  const hay = content.toLowerCase();
  const mentionsMetricKeys = Object.entries(METRIC_KEYWORDS)
    .filter(([, cfg]) => cfg.kws.some((k) => hay.includes(k)))
    .map(([key]) => key);
  const mentionsPartners = PARTNER_KEYWORDS.filter((k) => hay.includes(k));
  const mentionsGrants = GRANT_KEYWORDS.filter((k) => hay.includes(k));

  const chainWebSteps: string[] = [];
  if (mentionsMetricKeys.includes("population_total")) chainWebSteps.push("census_total_population");
  if (mentionsMetricKeys.includes("black_population")) chainWebSteps.push("census_black_population");
  if (mentionsMetricKeys.includes("poverty_black")) chainWebSteps.push("census_black_poverty");
  if (mentionsMetricKeys.includes("single_parent_black")) chainWebSteps.push("census_black_family");
  if (mentionsMetricKeys.includes("education_black_no_hs")) chainWebSteps.push("census_black_education");
  if (mentionsMetricKeys.includes("mental_health_distress") || mentionsMetricKeys.includes("uninsured_adults"))
    chainWebSteps.push("cdc_places_county");
  if (mentionsMetricKeys.includes("svi_overall")) chainWebSteps.push("atsdr_svi_county");
  if (mentionsMetricKeys.includes("crime_violent") || mentionsMetricKeys.includes("crime_property"))
    chainWebSteps.push("fbi_crime_state");

  return { mentionsMetricKeys, mentionsPartners, mentionsGrants, chainWebSteps };
}

async function readTextSafe(p: string, maxBytes = 200_000): Promise<string | null> {
  try {
    const ext = path.extname(p).toLowerCase();
    if ([".md", ".txt", ".html", ".htm"].includes(ext)) {
      const buf = fs.readFileSync(p);
      return buf.slice(0, maxBytes).toString("utf8");
    }
    // For binary (pdf/pptx/docx) we can't cheaply extract text in-request; rely on filename classification
    return null;
  } catch {
    return null;
  }
}

function fileFormat(ext: string): DocRecord["format"] {
  const e = ext.replace(".", "").toLowerCase();
  if (["pptx", "docx", "pdf", "md", "html", "txt"].includes(e)) return e as DocRecord["format"];
  return "other";
}

function docIdFromPath(p: string): string {
  return p.replace(/[^\w.-]+/g, "_");
}

async function scanDocs(): Promise<DocRecord[]> {
  const records: DocRecord[] = [];
  const candidates: string[] = [];

  if (fs.existsSync(DECK_DIR)) {
    for (const f of fs.readdirSync(DECK_DIR)) candidates.push(path.join(DECK_DIR, f));
  }
  if (fs.existsSync(ASSET_DIR)) {
    for (const f of fs.readdirSync(ASSET_DIR)) {
      const p = path.join(ASSET_DIR, f);
      if (fs.statSync(p).isFile()) candidates.push(p);
    }
  }

  for (const full of candidates) {
    const filename = path.basename(full);
    const ext = path.extname(filename);
    const format = fileFormat(ext);
    if (format === "other") continue;

    const content = await readTextSafe(full);
    const { kind, audience, counties } = classify(filename, content);

    // only keep docs that mention at least one of the two counties OR are known decks in the DECK_DIR
    const inDeckDir = full.startsWith(DECK_DIR);
    if (!inDeckDir && counties.length === 0) continue;

    const mentions = content
      ? extractMentions(content)
      : // infer from filename for binary docs
        extractMentions(filename);

    const stat = fs.statSync(full);
    records.push({
      id: docIdFromPath(full),
      filename,
      fullPath: full,
      kind,
      format,
      audience,
      counties: counties.length ? counties : (inDeckDir ? ["waco", "austin"] : []),
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      ...mentions,
      livePullsFromApi: false, // overlaid below for known build scripts
    });
  }

  // Mark build-script-generated decks as live; they cite the full chain-web.
  const ALL_METRIC_KEYS = Object.keys(METRIC_KEYWORDS);
  const BUILD_SCRIPT_DEFAULT_PARTNERS = ["bbbs", "starry", "prosper waco", "austin area urban league", "measure austin", "huston-tillotson"];
  const BUILD_SCRIPT_DEFAULT_GRANTS = ["st. david", "twc", "nbcuniversal", "spencer", "agency fund", "bja"];
  const byName = (n: string) => records.find((r) => r.filename === n);
  const liveLink = (name: string, script: string) => {
    const r = byName(name);
    if (r) {
      r.livePullsFromApi = true;
      r.buildScript = script;
      r.mentionsMetricKeys = Array.from(new Set([...r.mentionsMetricKeys, ...ALL_METRIC_KEYS]));
      r.chainWebSteps = Array.from(new Set([...r.chainWebSteps, ...CHAIN_STEP_IDS]));
      r.mentionsPartners = Array.from(new Set([...r.mentionsPartners, ...BUILD_SCRIPT_DEFAULT_PARTNERS]));
      r.mentionsGrants = Array.from(new Set([...r.mentionsGrants, ...BUILD_SCRIPT_DEFAULT_GRANTS]));
      if (r.counties.length === 0) r.counties = ["waco", "austin"];
      r.audience = "funder";
    }
  };
  liveLink("Corridor-Intelligence-Brief-v1.pptx", "scripts/build-corridor-deck.mjs");
  liveLink("Corridor-Intelligence-Brief-v1.docx", "scripts/build-corridor-deck.mjs");
  liveLink("Waco-Austin-Fatherhood-Gap-v1.pptx", "scripts/build-waco-austin-deck.mjs");
  liveLink("Waco-Austin-Fatherhood-Gap-v1.docx", "scripts/build-waco-austin-deck.mjs");

  // sort: decks first, then funder-facing, then by mtime desc
  records.sort((a, b) => {
    const rank = (r: DocRecord) => (r.kind === "deck" ? 0 : r.audience === "funder" ? 1 : 2);
    const rd = rank(a) - rank(b);
    if (rd !== 0) return rd;
    return b.modifiedAt.localeCompare(a.modifiedAt);
  });

  return records;
}

async function connectDoc(doc: DocRecord): Promise<ConnectionReport> {
  const issues: string[] = [];
  const geoKeys = [WACO_COUNTY_FIPS, AUSTIN_COUNTY_FIPS];

  // --- Evidence matches
  const evidenceMatched: ConnectionReport["connection"]["evidenceMatched"] = [];
  if (doc.mentionsMetricKeys.length > 0) {
    const rows = await db
      .select()
      .from(communityEvidence)
      .where(inArray(communityEvidence.geographyKey, geoKeys));

    const seenRowIds = new Set<string>();
    for (const mk of doc.mentionsMetricKeys) {
      const cfg = METRIC_KEYWORDS[mk];
      const matchers = cfg?.dbKeyMatch ?? [mk];
      const hits = rows.filter((r) => {
        const rk = (r.metricKey ?? "").toLowerCase();
        return matchers.some((m) => rk.includes(m));
      });
      for (const h of hits) {
        if (seenRowIds.has(h.id)) continue;
        seenRowIds.add(h.id);
        evidenceMatched.push({
          metricKey: h.metricKey ?? "",
          metricLabel: h.metricLabel ?? "",
          value: h.value != null ? Number(h.value) : null,
          unit: h.unit ?? null,
          confidence: (h as any).confidence ?? null,
          asOfDate: h.asOfDate ?? null,
          sourceName: h.sourceName ?? null,
          county: h.geographyKey === WACO_COUNTY_FIPS ? "waco" : h.geographyKey === AUSTIN_COUNTY_FIPS ? "austin" : "both",
        });
      }
    }
  } else {
    issues.push("No metric keywords detected in filename/content — consider adding explicit metric references.");
  }

  // --- Partner matches
  let partnersMatched: ConnectionReport["connection"]["partnersMatched"] = [];
  if (doc.mentionsPartners.length > 0) {
    try {
      const allPartners = await db.select().from(communityPartners);
      partnersMatched = allPartners
        .filter((p) => {
          const nm = (p.name ?? "").toLowerCase();
          return doc.mentionsPartners.some((k) => nm.includes(k));
        })
        .map((p) => ({
          id: String(p.id),
          name: p.name ?? "",
          county: (p as any).county ?? (p as any).serviceArea ?? "",
          mouStatus: (p as any).mouStatus ?? null,
        }));
    } catch {
      issues.push("community_partners table unavailable.");
    }
  }

  // --- Grant matches
  let grantsMatched: ConnectionReport["connection"]["grantsMatched"] = [];
  if (doc.mentionsGrants.length > 0) {
    try {
      const allGrants = await db.select().from(grantOpportunities);
      grantsMatched = allGrants
        .filter((g) => {
          const hay = `${(g as any).funder ?? ""} ${(g as any).program ?? ""} ${(g as any).title ?? ""}`.toLowerCase();
          return doc.mentionsGrants.some((k) => hay.includes(k));
        })
        .map((g: any) => ({
          id: String(g.id),
          funder: g.funder ?? "",
          program: g.program ?? g.title ?? "",
          amount: g.amount != null ? Number(g.amount) : null,
          status: g.status ?? null,
        }));
    } catch {
      issues.push("grant_opportunities table unavailable.");
    }
  }

  // --- Score
  let score = 0;
  if (evidenceMatched.length > 0) score += Math.min(50, evidenceMatched.length * 8);
  if (partnersMatched.length > 0) score += Math.min(20, partnersMatched.length * 5);
  if (grantsMatched.length > 0) score += Math.min(15, grantsMatched.length * 7);
  if (doc.livePullsFromApi) score += 15;
  if (doc.chainWebSteps.length >= 3) score += 0; // already counted via evidence
  score = Math.min(100, score);

  let status: ConnectionReport["connection"]["status"] = "static";
  if (score >= 70) status = "fully-connected";
  else if (score >= 30) status = "partially-connected";
  else status = "static";

  if (status !== "fully-connected" && !doc.livePullsFromApi && doc.kind === "deck") {
    issues.push("Deck is not built from the live /api/corridor/story feed — rebuild via its build script to connect.");
  }

  return {
    doc,
    connection: {
      status,
      score,
      evidenceMatched,
      partnersMatched,
      grantsMatched,
      chainWebStepsMatched: doc.chainWebSteps.filter((s) => CHAIN_STEP_IDS.includes(s)),
      livePullsFromApi: doc.livePullsFromApi,
      buildScript: doc.buildScript,
      issues,
    },
  };
}

let _cachedDocs: DocRecord[] | null = null;

export function registerCorridorDocRoutes(app: Express) {
  app.get("/api/corridor/docs", requireStaff, async (_req: Request, res: Response) => {
    try {
      if (!_cachedDocs) _cachedDocs = await scanDocs();
      const reports = await Promise.all(_cachedDocs.map(connectDoc));
      const summary = {
        total: reports.length,
        fullyConnected: reports.filter((r) => r.connection.status === "fully-connected").length,
        partiallyConnected: reports.filter((r) => r.connection.status === "partially-connected").length,
        static: reports.filter((r) => r.connection.status === "static").length,
        liveFromApi: reports.filter((r) => r.connection.livePullsFromApi).length,
        avgScore: Math.round(reports.reduce((a, r) => a + r.connection.score, 0) / Math.max(1, reports.length)),
      };
      res.json({ ok: true, generatedAt: new Date().toISOString(), summary, docs: reports });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: String(err?.message ?? err) });
    }
  });

  app.get("/api/corridor/docs/:id", requireStaff, async (req: Request, res: Response) => {
    try {
      if (!_cachedDocs) _cachedDocs = await scanDocs();
      const doc = _cachedDocs.find((d) => d.id === req.params.id);
      if (!doc) return res.status(404).json({ ok: false, error: "doc not found" });
      const report = await connectDoc(doc);
      res.json({ ok: true, report });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: String(err?.message ?? err) });
    }
  });

  app.post("/api/corridor/docs/rebuild", requireStaff, async (_req: Request, res: Response) => {
    try {
      _cachedDocs = await scanDocs();
      res.json({ ok: true, scanned: _cachedDocs.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: String(err?.message ?? err) });
    }
  });

  // Regenerate the PPTX/DOCX decks by running both build scripts against live data.
  app.post("/api/corridor/docs/regenerate", requireStaff, async (_req: Request, res: Response) => {
    const { spawn } = await import("child_process");
    const runOne = (script: string) => new Promise<{ script: string; ok: boolean; output: string }>((resolve) => {
      const p = spawn("node", [script], { env: { ...process.env, BASE_URL: `http://localhost:${process.env.PORT || 5000}` } });
      let out = "";
      p.stdout.on("data", (d) => (out += d.toString()));
      p.stderr.on("data", (d) => (out += d.toString()));
      p.on("close", (code) => resolve({ script, ok: code === 0, output: out.slice(-4000) }));
      p.on("error", (err) => resolve({ script, ok: false, output: String(err) }));
    });
    try {
      const results = await Promise.all([
        runOne("scripts/build-corridor-deck.mjs"),
        runOne("scripts/build-waco-austin-deck.mjs"),
      ]);
      _cachedDocs = await scanDocs();
      res.json({ ok: results.every((r) => r.ok), results, rescanned: _cachedDocs.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: String(err?.message ?? err) });
    }
  });
}
