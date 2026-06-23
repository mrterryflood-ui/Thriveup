---
name: Visual Circuit Canvas
description: Architecture decisions for the trade sims electrical visual schematic editor.
---

## What was built
`client/src/components/trade-sims/electrical/visual-circuit-canvas.tsx` — a full SVG-based interactive schematic editor replacing the old form-based `CircuitCanvas`.

## Key architectural decisions

**Two separate predicates in lesson-player.tsx:**
- `shouldShowCanvas(tradeSlug, engineMode)` — always true for "electrical"; used to decide whether to *render* a canvas
- `ENGINES_WITH_CANVAS.has(engineMode)` — unchanged; used to decide whether `hasRunSim` is *required for mark-complete*

**Why:** Electrical concept-only lessons (AC circuits, logic gates, transistors) need an exploration canvas but don't need a solver result to complete — the reflection textarea gates completion instead. Conflating the two predicates would either break completion logic or hide the canvas.

**onInteract vs onChange:**
- `onInteract` fires `onRun` on any canvas interaction (drag, wire draw) — gates concept-only completion
- `onChange` fires `onRun` only when `lastSolve !== null` — gates linear-dc completion
Both are passed from `renderEngineCanvas` to the canvas component.

**Union-Find node assignment:**
- Battery negative terminal is always assigned node 0 (ground reference)
- All connected terminals get the same node ID via path-compressed union-find
- Wire direction doesn't matter for node assignment (symmetric union)

**Solver integration:**
- `runSolve()` builds a `PlacedComponent[]` array from `VisualComp[]` + node map, casts to `any` since the local type differs from the exported `PlacedComponent` shape
- Transistors, AND/OR/NOT gates return `[]` from `placedToSolverElements` (Phase B/C — not yet in MNA)
- 150ms debounce prevents solver thrashing during drag

**Wire animation:**
- Uses SVG `<animateMotion>` with `<mpath href="#pathId" />` for amber current dots
- 3 dots per wire, staggered 0.4s apart for Falstad-style effect
- Only animates wires where `nodeVoltage > 0.005V` (ground wires stay static)
- Path IDs use `instanceId` prefix to avoid collisions when multiple canvases render simultaneously

**How to apply:** If adding new component kinds, add to both `VDEF` (visual definition with `draw` fn) and ensure `placedToSolverElements` in `component-defs.ts` handles the new kind.
