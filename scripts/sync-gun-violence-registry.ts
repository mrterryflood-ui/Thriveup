/**
 * sync-gun-violence-registry.ts
 *
 * Pulls all incident records from gun-violence-registry.replit.app and
 * upserts them into our local gun_violence_incidents table.
 *
 * Idempotent — re-running will update existing rows but never duplicate them.
 * The unique key is (incident_id, data_source).
 *
 * Usage:
 *   npx tsx scripts/sync-gun-violence-registry.ts [--dry-run] [--limit N]
 *   dry-run:  prints counts, writes nothing to DB
 *   limit N:  stop after N records (for testing)
 */

import { db } from "../server/storage";
import { gunViolenceIncidents, gunViolenceImports } from "../shared/schema";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const REGISTRY_BASE = "https://gun-violence-registry.replit.app";
const DATA_SOURCE   = "gun-violence-registry";
const BATCH_SIZE    = 500;   // registry returns 500 per call
const INSERT_CHUNK  = 100;   // upsert 100 rows at a time to stay under param limits

const args      = process.argv.slice(2);
const DRY_RUN   = args.includes("--dry-run");
const limitArg  = args.find(a => a.startsWith("--limit="));
const MAX_ROWS  = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

// ── Field mapping ─────────────────────────────────────────────────────────────
interface RegistryIncident {
  id: string;
  externalId: string;
  date: string;         // "YYYY-MM-DD"
  time: string;         // "HH:MM" or "00:00"
  incidentType: string;
  city: string;
  county: string;
  state: string;        // 2-letter USPS code
  address: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  killed: number;
  injured: number;
  weaponType: string;
  description: string;
  source: string;
}

function mapRow(r: RegistryIncident, importId: string) {
  // Parse date+time into a JS Date for the timestamp column
  let occurredAt: Date | null = null;
  try {
    const dateStr = r.date && r.date !== "0001-01-01" ? r.date : null;
    if (dateStr) {
      const timeStr = r.time && r.time !== "00:00" ? r.time : "00:00";
      occurredAt = new Date(`${dateStr}T${timeStr}:00Z`);
      if (isNaN(occurredAt.getTime())) occurredAt = null;
    }
  } catch { occurredAt = null; }

  return {
    id:           nanoid(12),
    incidentId:   r.externalId || r.id,
    dataSource:   DATA_SOURCE,
    occurredAt:   occurredAt ?? undefined,
    latitude:     r.latitude || undefined,
    longitude:    r.longitude || undefined,
    zip:          r.zipCode || undefined,
    city:         r.city || undefined,
    state:        r.state || undefined,
    victimCount:  (r.killed ?? 0) + (r.injured ?? 0),
    fatalCount:   r.killed ?? 0,
    incidentType: r.incidentType || undefined,
    importId,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[gv-sync] Starting pull from ${REGISTRY_BASE}`);
  console.log(`[gv-sync] dry-run=${DRY_RUN}  max-rows=${MAX_ROWS}`);

  let totalFetched = 0;
  let totalUpserted = 0;
  let offset = 0;
  const importId = nanoid(12);
  const startedAt = Date.now();

  while (totalFetched < MAX_ROWS) {
    const url = `${REGISTRY_BASE}/api/incidents?offset=${offset}`;
    let batch: RegistryIncident[];
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      batch = await res.json() as RegistryIncident[];
    } catch (err) {
      console.error(`[gv-sync] Fetch failed at offset=${offset}:`, err);
      process.exit(1);
    }

    if (!Array.isArray(batch) || batch.length === 0) {
      console.log(`[gv-sync] Empty response at offset=${offset} — done.`);
      break;
    }

    // Trim to MAX_ROWS if we'd overshoot
    const remaining = MAX_ROWS - totalFetched;
    if (batch.length > remaining) batch = batch.slice(0, remaining);

    totalFetched += batch.length;
    console.log(`[gv-sync] Fetched offset=${offset} → ${batch.length} records (total so far: ${totalFetched})`);

    if (!DRY_RUN) {
      const rows = batch.map(r => mapRow(r, importId));

      // Insert in chunks to avoid parameter count limits
      for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const chunk = rows.slice(i, i + INSERT_CHUNK);
        await db.insert(gunViolenceIncidents)
          .values(chunk)
          .onConflictDoUpdate({
            target: [gunViolenceIncidents.incidentId, gunViolenceIncidents.dataSource],
            set: {
              occurredAt:   sql`excluded.occurred_at`,
              latitude:     sql`excluded.latitude`,
              longitude:    sql`excluded.longitude`,
              zip:          sql`excluded.zip`,
              city:         sql`excluded.city`,
              state:        sql`excluded.state`,
              victimCount:  sql`excluded.victim_count`,
              fatalCount:   sql`excluded.fatal_count`,
              incidentType: sql`excluded.incident_type`,
              importId:     sql`excluded.import_id`,
            },
          });
        totalUpserted += chunk.length;
      }
    }

    if (batch.length < BATCH_SIZE) {
      console.log(`[gv-sync] Short page (${batch.length} < ${BATCH_SIZE}) — last page reached.`);
      break;
    }

    offset += BATCH_SIZE;

    // Brief pause to be a polite API consumer
    await new Promise(r => setTimeout(r, 200));
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (!DRY_RUN) {
    // Write an audit row
    await db.insert(gunViolenceImports).values({
      dataSource:  DATA_SOURCE,
      recordCount: totalUpserted,
      notes:       `Automated pull sync. fetched=${totalFetched} upserted=${totalUpserted} elapsed=${elapsed}s`,
    });
  }

  console.log(`[gv-sync] ✓ Complete — fetched=${totalFetched} upserted=${totalUpserted} elapsed=${elapsed}s dry-run=${DRY_RUN}`);
  process.exit(0);
}

main().catch(err => {
  console.error("[gv-sync] Fatal:", err);
  process.exit(1);
});
