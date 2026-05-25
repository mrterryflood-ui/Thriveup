// One-off: run RFP Fidelity extractor against the real NSF 26-508 solicitation
// to surface the L/M/C compliance matrix BEFORE the org bootstrap question is
// resolved. The result is printed + saved to /tmp/nsf-26508-matrix.json so
// when Dr. Flood walks /onboarding/org we can persist immediately without
// re-spending tokens on a second extraction.

import fs from "node:fs";
import { extractComplianceMatrix } from "../server/rfp-fidelity-engine";

const SRC = "attached_assets/Pasted-Skip-to-main-contentSkip-to-feedback-form-An-official-w_1779720229139.txt";

async function main() {
  const text = fs.readFileSync(SRC, "utf8");
  console.log(`[extract] solicitation length: ${text.length} chars`);

  const t0 = Date.now();
  let items: any[] = [];
  try {
    items = await extractComplianceMatrix({
      base: text,
      amendments: [],
      qa: [],
    });
  } catch (e: any) {
    console.error(`[extract] threw after ${Date.now() - t0}ms:`, e?.message || e);
    throw e;
  }
  console.log(`[extract] extractor returned after ${Date.now() - t0}ms`);

  console.log(`\n[extract] requirements extracted: ${items.length}`);
  const bySection: Record<string, number> = {};
  for (const it of items) bySection[it.sectionType] = (bySection[it.sectionType] || 0) + 1;
  console.log("[extract] section counts:", bySection);

  fs.writeFileSync("/tmp/nsf-26508-matrix.json", JSON.stringify(items, null, 2));
  console.log("[extract] saved → /tmp/nsf-26508-matrix.json");

  console.log("\n=== First 10 items (preview) ===");
  for (const it of items.slice(0, 10)) {
    const snippet = String((it as any).requirementText || (it as any).text || "").slice(0, 160);
    console.log(`- [${it.sectionType}${(it as any).reqNumber ? " " + (it as any).reqNumber : ""}] ${snippet}`);
  }
}

main().catch((e) => {
  console.error("[extract] FAILED:", e);
  process.exit(1);
});
