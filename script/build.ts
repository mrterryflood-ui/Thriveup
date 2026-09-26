import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { cp, rm, readFile, writeFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
  // The repository-level public directory contains standalone deliverables
  // that are not part of Vite's client/public input. Copy them into the
  // production static root so public links resolve to their actual assets.
  await cp("public", "dist/public", { recursive: true, force: true });
  await cp("migrations", "dist/migrations", { recursive: true, force: true });
  const serviceWorkerPath = "dist/public/sw.js";
  const serviceWorker = await readFile(serviceWorkerPath, "utf-8");
  const deploymentId = (process.env.REPLIT_DEPLOYMENT_ID || `build-${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, "-");
  await writeFile(
    serviceWorkerPath,
    serviceWorker.replace(/const CACHE_VERSION = "[^"]+";/, `const CACHE_VERSION = "${deploymentId}";`),
  );

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Vercel exposes project env vars (including DATABASE_URL) to the build
  // environment. When building for Vercel with a configured database, push the
  // committed drizzle schema at build time so the schema exists BEFORE traffic
  // switches. Rules: no --force (destructive drift always requires a human),
  // and a failed push fails the build — Vercel keeps serving last-known-good
  // instead of deploying an attested-broken state.
  if (process.env.VERCEL && process.env.DATABASE_URL?.trim()) {
    console.log("vercel build: DATABASE_URL present — pushing drizzle schema (no --force)");
    const { execSync } = await import("child_process");
    try {
      execSync("npx drizzle-kit push", { stdio: "inherit", timeout: 10 * 60 * 1000 });
      console.log("vercel build: schema push completed.");
    } catch (err) {
      console.error(
        "vercel build: drizzle-kit push FAILED — failing this build so production keeps the last healthy deployment:",
        err,
      );
      process.exit(1);
    }
  } else if (process.env.VERCEL) {
    console.log(
      "vercel build: DATABASE_URL not set — skipping schema push. DB-backed routes will report structured 503s until env is configured and the project is redeployed.",
    );
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
