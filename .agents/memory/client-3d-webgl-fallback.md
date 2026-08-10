---
name: Client 3D WebGL fail-soft
description: Vanilla-three components must never throw when WebGL is unavailable; probe canvases lie.
---
Rule: a separate probe canvas (`getContext('webgl')`) is NOT a reliable WebGL guard — the probe can succeed while `new THREE.WebGLRenderer()` still throws ("BindToCurrentSequence failed") and the dev error overlay takes down the whole page.
**Why:** Trade Sims 3D concept diagrams crashed entire lesson pages in headless/GPU-less environments even after adding a probe + try/catch.
**How to apply:** use `createRendererSafe()` in `client/src/components/trade-sims/diagrams/three-lib.ts` — create the canvas + GL context yourself, exercise it once (`getParameter(VERSION)`), hand `{canvas, context}` to Three, return null on any failure. Component calls onError → parent renders the SVG twin (SVG_FALLBACKS map keyed by diagramKey). Keep an ErrorBoundary as second line. Every 3D diagram must have a 2D twin with identical physics. R3F stays forbidden (dual-React).
