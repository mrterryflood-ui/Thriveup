---
name: Canvas-wire trial gate E2E pattern
description: Why canvas-wire-e2e failed and the fix — trial gate server API slow during boot, must wait for settled state before asserting active.
---

## The rule
In `tests/e2e/canvas-wire-interaction.spec.ts`, `openGuidedTab` must wait for ANY settled state (`trial-gate-active` OR `trial-gate-expired`) before asserting specifically for `trial-gate-active`.

## Why
`TradeSimsTrialGate` calls `/api/trade-sims/trial/status` on mount. During server startup (seeding + knowledge-graph build takes 30–60 seconds), that API can fail or be slow. If the API call fails, the hook leaves `state=null`, which keeps the component in `trial-gate-loading` forever. The original test waited 15 seconds for `trial-gate-active` directly — if the server was still booting, it timed out.

## How to apply
```typescript
await page.waitForSelector(
  '[data-testid="trial-gate-active"],[data-testid="trial-gate-expired"]',
  { timeout: 30_000 },
);
await expect(page.getByTestId("trial-gate-active")).toBeVisible({ timeout: 5_000 });
```

The 30-second outer wait covers the full server-boot window. The 5-second inner assert is tight because by then we know the DOM has settled.

**Why not wait for `networkidle`?** The dev server stays busy (cron jobs, GrantDiscovery, agency-intel) so `networkidle` never fires.
