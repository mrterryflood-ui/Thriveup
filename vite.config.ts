import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "node:fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const workingMaterialPolicy = JSON.parse(readFileSync(path.resolve(process.cwd(), "security/repository-privacy-policy.json"), "utf8")) as {
  privatePrefixes: string[];
  privateRootFiles: string[];
};

export default defineConfig({
  plugins: [
    {
      name: "private-working-material-boundary",
      enforce: "pre",
      load(id) {
        if (id.startsWith("\0")) return;
        const relative = path.relative(process.cwd(), id.split("?")[0]).replaceAll("\\", "/");
        if (workingMaterialPolicy.privatePrefixes.some(prefix => relative.startsWith(prefix)) ||
            workingMaterialPolicy.privateRootFiles.includes(relative)) {
          throw new Error("A frontend import attempted to publish private working material. Use a staff-authorized document endpoint.");
        }
      },
    },
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "react-dom/client"],
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "client", "src", "assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: [
        "**/.*",
        ...workingMaterialPolicy.privatePrefixes.map(prefix => `**/${prefix}**`),
        ...workingMaterialPolicy.privateRootFiles.map(file => `**/${file}`),
        "**/TCAF_*.md", "**/austin-*.md",
        "**/*.pem", "**/*.key", "**/*.p12", "**/*.pfx",
      ],
    },
  },
});
