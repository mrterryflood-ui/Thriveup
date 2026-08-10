---
name: SVG canvas touch/mobile interaction rules
description: Why stroke-only SVG editors silently fail on phones and how to make drag/tap-wire work.
---

# SVG schematic canvas — touch rules

1. **Stroke-only symbols are untappable.** A finger press in the "middle" of a stroke-drawn SVG component falls through to the background. Every draggable `<g>` needs an invisible `fill="transparent"` body hit-rect as its FIRST child (handles rendered later stay on top). Small handles need oversized (~16px radius) transparent hit circles carrying the handlers, with the visible marker set to `pointerEvents: none`.
2. **Pointer events + `touchAction: "none"` on the svg**, and on pointerdown call `svg.setPointerCapture(pointerId)` — touch pointers get implicit capture on the touched child, which hides pointermove/up from svg-level handlers.
3. **Tap-to-wire self-cancel trap:** the tap that starts wiring fires a pointerup that bubbles to the svg; a "release with no target ⇒ cancel wiring" rule makes tap-tap wiring impossible. Keep wiring mode on empty release; cancel only on background click (check `e.target` tagName) or Escape.
4. **Pointer-capture click retarget trap:** if the terminal's pointerdown calls `svg.setPointerCapture()`, the browser retargets the derived `click` to the `<svg>` — a "click target is svg ⇒ cancel wiring" rule then instantly cancels every wire start. Set a ref flag in the terminal pointerdown and swallow the next canvas click.
5. **Visible wire strokes eat clicks:** the visible wire path renders above the fat transparent hit path; without `pointerEvents: "none"` on it, clicks land on the visible path (no handler) and wire selection/deletion silently fails.

6. **Select on pointerdown, not the derived click:** with svg-level pointer capture active, a touch tap on a child hit path doesn't reliably synthesize a click — wire/element selection handlers must fire on pointerdown (and set the swallow-next-canvas-click flag). Size invisible hit bands/circles for the *scaled* viewBox: a 24-unit band in an 820-wide viewBox is ~10px on a 390px phone.
7. **Stale lesson seeds can hide the canvas entirely:** engine mode lives in seeded lesson content (`concept.engineMode`); if the dev DB predates the field, every trade silently renders as read+reflect and touch tests find "no canvas". Reseed (idempotent upsert) before concluding a canvas is missing.

**Why:** mobile drag on the electrical circuit canvas was completely broken for phone-first learners; the failure was invisible on desktop because a precise mouse can hit strokes.
**How to apply:** any new drag/tap SVG canvas (plumbing visual wiring, etc.) must follow all three rules and be verified with real touch events, not mouse emulation.
