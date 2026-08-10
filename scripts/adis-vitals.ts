/**
 * ADIS v4 — Instrumented Vital Signs (Part 6) + record-structure gates (Parts 4, 8).
 *
 * Reads real signals off the repo — never self-reported:
 *  1. Records exist: residuals ledger, sessions dir, verification records, honor list, memory index.
 *  2. Residuals ledger parses; every row has severity/status; SLA staleness computed.
 *  3. Latest session ledger has the required Film Study + Scrimmage/Change sections.
 *  4. Memory index (failure registry role) parses: every line is a `- [Title](file.md) — hook` pointer whose file exists.
 *  5. Doctrine files present: Tier A/B skill, v4 spec, v3 archive.
 *
 * Any STRUCTURAL NO (missing layer) exits 1. PATTERN/DRIFT NOs are reported but exit 0
 * unless --strict. Classification per Part 6: NOISE / PATTERN / DRIFT / STRUCTURAL.
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const strict = process.argv.includes("--strict");
type Vital = { layer: string; ok: boolean; class?: "NOISE" | "PATTERN" | "DRIFT" | "STRUCTURAL"; detail: string };
const vitals: Vital[] = [];
const add = (layer: string, ok: boolean, detail: string, cls?: Vital["class"]) =>
  vitals.push({ layer, ok, class: ok ? undefined : cls || "STRUCTURAL", detail });

const exists = (p: string) => fs.existsSync(path.join(ROOT, p));
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

// ── 1. Doctrine presence ────────────────────────────────────────────────────
add("DNA/doctrine", exists(".agents/skills/platform-dna/SKILL.md"), "platform-dna SKILL.md (Tier A/B)");
add("DNA/v4-spec", exists(".agents/skills/platform-dna/adis-v4-spec.md"), "full v4 spec verbatim");
add("DNA/v3-archive", exists(".agents/skills/platform-dna/adis-v3-archive.md"), "v3 archival (governs where v4 silent)");
add("DNA/honor-list", exists(".agents/honor-list.md"), "published honor list (declared attack surface)");

// ── 2. Residuals ledger: exists, parses, SLA staleness ─────────────────────
const SLA_DAYS: Record<string, number> = { crisis: 0, urgent: 2, soon: 7, monitor: 28, scheduled: 90 };
if (!exists(".agents/residuals.md")) {
  add("Kidneys/residuals", false, ".agents/residuals.md missing");
} else {
  const rows = read(".agents/residuals.md")
    .split("\n")
    .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => l.split("|").map((c) => c.trim()));
  let parseOk = true;
  let overdue = 0;
  const today = new Date();
  for (const r of rows) {
    // | # | Logged | Severity | Location | Finding | Logged by | Status |
    if (r.length < 8) { parseOk = false; continue; }
    const [, , logged, severity, , , , status] = r;
    if (!logged || !severity || !status) { parseOk = false; continue; }
    if (/^open/i.test(status) && !/standing exclusion/i.test(status)) {
      const sla = SLA_DAYS[severity.toLowerCase()] ?? 28;
      const age = (today.getTime() - new Date(logged).getTime()) / 86400000;
      if (Number.isFinite(age) && age > sla) overdue++;
    }
  }
  add("Kidneys/residuals-parse", parseOk, `${rows.length} row(s) parsed`, "PATTERN");
  add("Kidneys/residuals-sla", overdue === 0, overdue ? `${overdue} residual(s) PAST SLA — vital-signs NO until ingested` : "no residuals past SLA", "DRIFT");
}

// ── 3. Session ledgers: exist + latest has required sections ───────────────
if (!exists(".agents/sessions")) {
  add("Integrity/sessions", false, ".agents/sessions/ missing");
} else {
  const ledgers = fs.readdirSync(path.join(ROOT, ".agents/sessions")).filter((f) => f.endsWith(".md")).sort();
  if (ledgers.length === 0) {
    add("Integrity/sessions", false, "no session ledgers", "PATTERN");
  } else {
    const latest = read(`.agents/sessions/${ledgers[ledgers.length - 1]}`);
    const hasFilm = /##\s*Film Study/i.test(latest);
    const hasScrim = /##\s*(Scrimmage|Change)/i.test(latest);
    add("Integrity/session-structure", hasFilm && hasScrim, `latest=${ledgers[ledgers.length - 1]} filmStudy=${hasFilm} scrimmage=${hasScrim}`, "PATTERN");
  }
}

// ── 4. Verification records present ────────────────────────────────────────
const vdir = path.join(ROOT, ".verification");
add("Immune/verification-records", fs.existsSync(vdir) && fs.readdirSync(vdir).length > 0, ".verification/ populated", "PATTERN");

// ── 5. Memory index parses; every pointer resolves ─────────────────────────
if (!exists(".agents/memory/MEMORY.md")) {
  add("Brain/memory-index", false, "MEMORY.md missing");
} else {
  const lines = read(".agents/memory/MEMORY.md").split("\n").filter((l) => l.startsWith("- ["));
  const broken: string[] = [];
  for (const l of lines) {
    const m = l.match(/\]\(([^)]+)\)/);
    if (!m) continue;
    const target = m[1];
    const rel = target.startsWith(".") ? target : `.agents/memory/${target}`;
    if (!exists(rel)) broken.push(target);
  }
  add("Brain/memory-pointers", broken.length === 0, broken.length ? `broken pointers: ${broken.join(", ")}` : `${lines.length} pointers resolve`, "DRIFT");
}

// ── Report ──────────────────────────────────────────────────────────────────
let structural = 0, soft = 0;
console.log("ADIS v4 VITAL SIGNS (instrumented — Part 6)\n" + "─".repeat(60));
for (const v of vitals) {
  const mark = v.ok ? "✓" : "✗";
  if (!v.ok) v.class === "STRUCTURAL" ? structural++ : soft++;
  console.log(`${mark} ${v.layer.padEnd(32)} ${v.ok ? "OK" : `NO [${v.class}]`}  ${v.detail}`);
}
console.log("─".repeat(60));
console.log(`layers green: ${vitals.filter((v) => v.ok).length}/${vitals.length}  structural NOs: ${structural}  soft NOs: ${soft}`);
if (structural > 0 || (strict && soft > 0)) {
  console.error("VITALS FAILED — triage before substantive work (Part 9).");
  process.exit(1);
}
console.log("VITALS PASS");
