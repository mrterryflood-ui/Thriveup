---
name: Lesson diagram verification
description: How to visually verify Trade Sims concept diagrams and the content rule they must obey
---

## Rule: diagrams must reuse the lesson's own worked numbers and units
Every concept diagram (SVG + 3D twin) must label with the SAME values/units the lesson's blurb, keyTerms, and guidedSteps use — not merely "correct physics." A 12 V example is wrong in a lesson whose guided steps compute 9 V ÷ 2 kΩ = 4.5 mA; °F labels are wrong in an SI (°C) lesson; WSFU values must match the code values the lesson quotes.
**Why:** an audit found 3 diagrams with internally-correct physics that contradicted their lesson's worked example — that misteaches even though nothing is "false."
**How to apply:** when adding/editing a diagramKey, diff the diagram's hardcoded labels against that lesson's concept block before shipping. 3D models have a 2D twin in SVG_FALLBACKS keyed identically — fix BOTH.

## 3D touch rule
Three.js diagram canvases use `touch-action: pan-y` (NOT `none`): horizontal drag rotates via OrbitControls, vertical swipe still scrolls the page. `none` traps page scroll on phones over a full-width canvas.

## Visual verification recipe (mockup sandbox gallery)
To eyeball all diagrams at 375px in light+dark: copy `svg-diagrams.tsx` into `artifacts/mockup-sandbox/src/components/mockups/<dir>/` (the sandbox can't import across its vite root), add a paginated gallery component rendering each entry at 375px inside a plain div and a `.dark` div, then screenshot `/__mockup/preview/<dir>/<Component>?page=N` on port 23636 (3 diagrams/page fits the 720px viewport). Delete the copy afterwards — it drifts.
