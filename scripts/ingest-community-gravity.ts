// Usage: npx tsx scripts/ingest-community-gravity.ts TX Austin   (city optional; omit for whole state)
import { ingestState } from "../server/community-gravity/engine";
const [state, ...cityParts] = process.argv.slice(2);
if (!state) { console.error("state required"); process.exit(1); }
ingestState(state, cityParts.length ? cityParts.join(" ") : undefined)
  .then(r => { console.log(JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error("ingest failed:", e.message); process.exit(1); });
