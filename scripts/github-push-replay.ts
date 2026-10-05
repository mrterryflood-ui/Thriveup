/**
 * Push local commits to GitHub through the REST Git Data API when the shell has
 * no git credential. Replays each commit (blobs → tree → commit) preserving
 * author, committer, timestamps, and message, so the remote SHAs are identical
 * to local — no rebase, no divergence.
 *
 * Usage:
 *   GITHUB_TOKEN=<fine-grained token with contents:write> \
 *   npx tsx scripts/github-push-replay.ts <owner/repo> <branch> [--base <remote-ref>]
 *
 * Without GITHUB_TOKEN this prints the exact replay manifest (/tmp/replay.json)
 * so the same procedure can run through the Replit GitHub connector in the
 * agent sandbox (see .agents/memory/github-push-via-connector.md).
 * Never pushes to main unless <branch> is literally "main" and PUSH_MAIN=1.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [repo, branch, ...rest] = process.argv.slice(2);
if (!repo || !branch) { console.error("usage: github-push-replay.ts <owner/repo> <branch> [--base origin/main]"); process.exit(1); }
if (branch === "main" && process.env.PUSH_MAIN !== "1") { console.error("Refusing to push main without PUSH_MAIN=1 (production promotion)."); process.exit(1); }
const baseIdx = rest.indexOf("--base");
const base = baseIdx >= 0 ? rest[baseIdx + 1] : `origin/${branch}`;

const git = (...a: string[]) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const gitBuf = (...a: string[]) => execFileSync("git", a, { maxBuffer: 256 * 1024 * 1024 });
git("fetch", "-q", "origin");
let exclude = base;
try { git("rev-parse", "--verify", "-q", base); } catch { exclude = "origin/main"; }
const commits = git("rev-list", "--reverse", "--topo-order", `^${exclude}`, "HEAD").split("\n").filter(Boolean);

interface FileChange { path: string; mode: string; sha: string; status: string }
interface Commit { sha: string; tree: string; parents: string[]; author: string; committer: string; message: string; files: FileChange[] }
const manifest: Commit[] = commits.map(sha => {
  const raw = git("cat-file", "-p", sha);
  const [hdr, ...msg] = raw.split("\n\n");
  const h: Record<string, string> = {}; const parents: string[] = [];
  for (const line of hdr.split("\n")) { const [k, ...v] = line.split(" "); if (k === "parent") parents.push(v.join(" ")); else h[k] = v.join(" "); }
  const files = git("diff-tree", "-r", "--no-commit-id", "-m", "--first-parent", sha).split("\n").filter(Boolean).map(line => {
    const [meta, path] = line.split("\t"); const p = meta.split(" ");
    return { path, mode: p[1], sha: p[3], status: p[4][0] };
  });
  return { sha, tree: h.tree, parents, author: h.author, committer: h.committer, message: msg.join("\n\n"), files };
});
writeFileSync("/tmp/replay.json", JSON.stringify(manifest));
console.log(`${manifest.length} commits to replay (${manifest.reduce((n, c) => n + c.files.length, 0)} file changes) → /tmp/replay.json`);

const token = process.env.GITHUB_TOKEN;
if (!token) { console.log("GITHUB_TOKEN not set: manifest written; run the replay through the GitHub connector."); process.exit(0); }

const api = async (method: string, path: string, body?: unknown) => {
  const r = await fetch(`https://api.github.com${path}`, { method, headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "thriveup-push-replay" }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 404 && method === "GET") return null;
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};
const ident = (s: string) => { const m = s.match(/^(.*) <(.*)> (\d+) ([+-]\d{4})$/)!; const d = new Date(Number(m[3]) * 1000); return { name: m[1], email: m[2], date: d.toISOString().replace(/\.\d{3}Z$/, "") + m[4].slice(0, 3) + ":" + m[4].slice(3) }; };

(async () => {
  for (const cm of manifest) {
    if (await api("GET", `/repos/${repo}/git/commits/${cm.sha}`)) { console.log(`skip ${cm.sha.slice(0, 8)} (exists)`); continue; }
    const tree: unknown[] = [];
    for (const f of cm.files) {
      if (f.status === "D") { tree.push({ path: f.path, mode: "100644", type: "blob", sha: null }); continue; }
      if (!(await api("GET", `/repos/${repo}/git/blobs/${f.sha}`))) {
        const b = await api("POST", `/repos/${repo}/git/blobs`, { content: gitBuf("cat-file", "blob", f.sha).toString("base64"), encoding: "base64" });
        if (b.sha !== f.sha) throw new Error(`blob sha mismatch for ${f.path}`);
      }
      tree.push({ path: f.path, mode: f.mode, type: f.mode === "160000" ? "commit" : "blob", sha: f.sha });
    }
    const parentTree = (await api("GET", `/repos/${repo}/git/commits/${cm.parents[0]}`)).tree.sha;
    const treeSha = tree.length ? (await api("POST", `/repos/${repo}/git/trees`, { base_tree: parentTree, tree })).sha : parentTree;
    if (treeSha !== cm.tree) throw new Error(`tree mismatch at ${cm.sha}: ${treeSha} ≠ ${cm.tree}`);
    const nc = await api("POST", `/repos/${repo}/git/commits`, { message: cm.message, tree: treeSha, parents: cm.parents, author: ident(cm.author), committer: ident(cm.committer) });
    if (nc.sha !== cm.sha) throw new Error(`commit sha mismatch at ${cm.sha}: got ${nc.sha}`);
    console.log(`ok ${cm.sha.slice(0, 8)} files=${cm.files.length}`);
  }
  const head = git("rev-parse", "HEAD").trim();
  const ref = await api("GET", `/repos/${repo}/git/ref/heads/${branch}`);
  if (ref) await api("PATCH", `/repos/${repo}/git/refs/heads/${branch}`, { sha: head, force: false });
  else await api("POST", `/repos/${repo}/git/refs`, { ref: `refs/heads/${branch}`, sha: head });
  console.log(`refs/heads/${branch} → ${head}`);
})().catch(e => { console.error(e.message); process.exit(1); });
