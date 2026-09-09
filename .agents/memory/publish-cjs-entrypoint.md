---
name: Publish CommonJS entrypoint compatibility
description: Production bundles are CommonJS and must not evaluate import.meta.url in imported module entrypoint guards.
---

Production publishing bundles the server as CommonJS. A module imported during
server startup must not use `new URL(import.meta.url)` for a direct-execution
check: the bundler can replace `import.meta.url` with undefined, causing an
`ERR_INVALID_URL` crash before the health check.

**Why:** The development TypeScript runner preserves the module metadata, so the
defect is invisible in the normal workflow but blocks autoscale startup.

**How to apply:** Use a CommonJS-safe filename/process check for CLI-only code,
then build and launch `dist/index.cjs` with `NODE_ENV=production` before asking
the user to republish.