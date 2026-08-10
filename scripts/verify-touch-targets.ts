/**
 * Touch-target regression gate for the plumbing SVG canvas.
 *
 * The canvas viewBox (820 units wide) scales down to the viewport, so hit
 * geometry sized in viewBox units shrinks on phones. This gate asserts the
 * invisible wire hit band and terminal hit circles stay >= 32 effective CSS
 * px at the 390px mobile viewport, and that the canvas actually uses the
 * guarded constants (so a hardcoded value can't silently bypass the gate).
 *
 * Usage: npx tsx scripts/verify-touch-targets.ts
 */
import fs from "fs";
import {
  MIN_TOUCH_PX,
  MIN_VIEWPORT_W,
  WIRE_HIT_STROKE,
  TERMINAL_HIT_R,
  scaledPx,
} from "../client/src/components/trade-sims/plumbing/touch-constants";

let failures = 0;
function check(name: string, effectivePx: number) {
  const ok = effectivePx >= MIN_TOUCH_PX;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}: ${effectivePx.toFixed(1)}px effective at ${MIN_VIEWPORT_W}px viewport (min ${MIN_TOUCH_PX}px)`);
  if (!ok) failures++;
}

check("plumbing wire hit band", scaledPx(WIRE_HIT_STROKE));
check("plumbing terminal hit diameter", scaledPx(TERMINAL_HIT_R * 2));

// The canvas must reference the guarded constants, not hardcoded numbers.
const canvasSrc = fs.readFileSync(
  "client/src/components/trade-sims/plumbing/visual-plumbing-canvas.tsx",
  "utf8",
);
for (const ident of ["WIRE_HIT_STROKE", "TERMINAL_HIT_R", "CANVAS_VIEWBOX_W"]) {
  if (!canvasSrc.includes(ident)) {
    console.log(`FAIL visual-plumbing-canvas.tsx no longer uses ${ident} from touch-constants`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`${failures} touch-target check(s) failed`);
  process.exit(1);
}
console.log("OK: all canvas touch targets meet the 32px minimum at 390px viewport");
