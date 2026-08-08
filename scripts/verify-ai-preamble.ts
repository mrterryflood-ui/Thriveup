/**
 * verify-ai-preamble.ts — guards the platform's ethical-preamble doctrine.
 *
 * Doctrine: every AI call on this platform must carry ETHICAL_EI_PREAMBLE.
 * Route-level call sites express this by wrapping their `role: "system"`
 * message content with `withEthicalPreamble(...)` (or the grant-writing
 * superset `withRfpTemplateDiscipline(...)`, which itself calls
 * withEthicalPreamble). This script fails loudly if any generateAIResponse /
 * generateAIJSON call site passes a `role: "system"` prompt that is NOT wrapped.
 *
 * Scope: server/**.ts, excluding:
 *   - server/ai-provider.ts — the wrapper source itself; every path there
 *     routes through streamAIResponse / generateAIJSON, which auto-inject the
 *     preamble via withEthicalMessages()/withEthicalPreamble().
 *   - scripts/ — this checker and its neighbors.
 *
 * Only `generateAIResponse(...)` and `generateAIJSON(...)` call blocks are
 * inspected. streamAIResponse / direct SDK calls (e.g. TTS) are out of scope
 * for THIS check because streamAIResponse auto-wraps and TTS carries no
 * user-facing reasoning prompt.
 *
 * Exit 1 (listing violators) when any unwrapped system prompt is found; exit 0
 * when clean.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const SERVER_DIR = join(process.cwd(), "server");
const TARGET_FNS = ["generateAIResponse", "generateAIJSON"];
const WRAPPERS = ["withEthicalPreamble", "withRfpTemplateDiscipline"];

// Files that legitimately contain unwrapped `role: "system"` prompts because
// they auto-inject the preamble downstream.
const EXCLUDED_FILES = new Set(["ai-provider.ts"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "scripts") continue;
      out.push(...walk(full));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Given source and the index of the "(" that opens a call's argument list,
 * return the substring spanning the balanced argument list (paren-matched,
 * quote/template/comment-aware). Returns null if unbalanced.
 */
function extractArgs(src: string, openParen: number): { text: string; end: number } | null {
  let depth = 0;
  let i = openParen;
  let inStr: string | null = null; // '"' | "'" | "`"
  let escaped = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (escaped) { escaped = false; continue; }
      if (c === "\\") { escaped = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return { text: src.slice(openParen, i + 1), end: i + 1 };
    }
  }
  return null;
}

type Violation = { file: string; line: number; snippet: string };

function checkFile(absPath: string): Violation[] {
  const src = readFileSync(absPath, "utf8");
  const rel = relative(process.cwd(), absPath);
  const violations: Violation[] = [];

  // Regex to find a system-message whose content is a bare string/template
  // literal, i.e. NOT immediately opening with a wrapper call.
  const systemRe = /role\s*:\s*["']system["']\s*,\s*content\s*:\s*([`"'])/g;

  for (const fn of TARGET_FNS) {
    const callRe = new RegExp(`\\b${fn}\\s*(<[^>]*>)?\\s*\\(`, "g");
    let m: RegExpExecArray | null;
    while ((m = callRe.exec(src)) !== null) {
      const openParen = src.indexOf("(", m.index + m[0].length - 1);
      if (openParen === -1) continue;
      const args = extractArgs(src, openParen);
      if (!args) continue;

      // Within this call's argument block, find every system prompt whose
      // content is a bare literal not preceded by an approved wrapper.
      let sm: RegExpExecArray | null;
      systemRe.lastIndex = 0;
      while ((sm = systemRe.exec(args.text)) !== null) {
        // Look at what immediately precedes the opening quote — the regex only
        // matched when content is a raw literal, so any wrapper call would have
        // put `withEthicalPreamble(` before the quote and this regex would not
        // match (content: withEthicalPreamble("...") has no quote right after
        // the colon). Belt-and-suspenders: re-confirm no wrapper token appears
        // between `content:` and the quote.
        const beforeQuote = args.text.slice(Math.max(0, sm.index), sm.index + sm[0].length);
        if (WRAPPERS.some((w) => beforeQuote.includes(w))) continue;

        const absIdx = openParen + sm.index;
        const line = src.slice(0, absIdx).split("\n").length;
        const snippet = src.split("\n")[line - 1]?.trim().slice(0, 120) ?? "";
        violations.push({ file: rel, line, snippet });
      }
    }
  }
  return violations;
}

function main(): void {
  const files = walk(SERVER_DIR).filter((f) => {
    const base = f.split("/").pop() ?? "";
    return !EXCLUDED_FILES.has(base);
  });

  const violations: Violation[] = [];
  for (const f of files) violations.push(...checkFile(f));

  if (violations.length > 0) {
    console.error(`\n✖ Ethical-preamble check FAILED — ${violations.length} unwrapped AI system prompt(s):\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`      ${v.snippet}`);
    }
    console.error(
      `\nEvery generateAIResponse/generateAIJSON system prompt must be wrapped with ` +
        `withEthicalPreamble(...) (or withRfpTemplateDiscipline(...)). ` +
        `Fix the call sites above.\n`,
    );
    process.exit(1);
  }

  console.log("✓ Ethical-preamble check passed — all AI system prompts are wrapped.");
  process.exit(0);
}

main();
