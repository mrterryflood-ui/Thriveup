---
name: GIS Maps Architecture
description: How real Leaflet maps are built and wired into the platform; replaces Google Maps links.
---

# GIS Maps Architecture

## Components
- `client/src/components/gis/GisNeedHeatMap.tsx` — main map: `GeoPoint[]` (id/label/lat/lon/needScore/metrics) → Leaflet CircleMarkers sized/colored by needScore + optional Bezier correlation arcs.
- `client/src/components/gis/CorrelationMatrix.tsx` — table companion: Pearson r color-coded by strength/sign.
- `client/src/components/gis/index.ts` — barrel export.

## GeoPoint shape
```typescript
{ id: string; label: string; lat: number; lon: number; needScore: number; // 0–100
  metrics: Record<string, { value: number; label: string; unit?: string }> }
```

## Where wired
- `client/src/pages/community-impact.tsx`: "🗺 Geographic Map" tab (lazy-loaded `GisNeedHeatMap`). Source data = `neighborResult.zips` which has `ZipPin[]` with `{ zip, lat, lon, score }`. The `score` field maps directly to `needScore`.
- `client/src/pages/sdoh-explorer.tsx`: "Find on map" link changed from Google Maps to OpenStreetMap (`openstreetmap.org/search?query=...`).

## Key implementation details
- Bezier arc formula: quadratic bezier from A→B with control point offset perpendicular to AB by `0.35 * |AB|`. Direction inverts when r < 0, making positive/negative correlations curve opposite ways.
- `BoundsFitter` component auto-fits bounds on first render using `map.fitBounds`.
- `needRadius(score)` returns `12 + (score/100) * 28` — range 12–40 px.
- Color: >70 = red, 40–70 = amber, <40 = green.
- Legend is absolutely positioned inside the map container with `z-[1000]`.
- Leaflet icon fix: delete `_getIconUrl` and mergeOptions with CDN URLs to prevent bundler path issues.

**Why:**
The previous pattern was Google Maps `<a>` tags that opened a search page — no embedded map, no context. ChildCORE's comparison maps showed what a real geographic heat map looks like.

**How to apply:**
When adding a new page that shows geographic data, import `GisNeedHeatMap` from `@/components/gis` and pass `GeoPoint[]`. For ZIP-based pages, `neighborResult.zips` from the community-impact neighbor API already has lat/lon. For county-based pages, use the county centroid lookup pattern.
