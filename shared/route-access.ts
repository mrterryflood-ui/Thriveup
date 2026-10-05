/**
 * Route access — the ONE access predicate for navigation surfaces (R2).
 *
 * The route registry (shared/route-nav.generated.json + route-frame.generated.json, generated
 * from App.tsx RequireAuth floors and the human classification lanes) is the only source of
 * access truth. The legacy sidebar flags are presentation metadata and are never consulted.
 *
 * Unregistered paths are reported as `undefined`; `canOpenPath` treats them as visible so a
 * missing registry row never hides a working page. `verify-navigation-permission-sync.ts`
 * proves that every navigable path IS registered, so that branch does not run in practice.
 */
import { frameRoute } from "./frame-route";
import { canSeeRoute, type NavViewer } from "./route-nav";
import type { Access } from "./route-registry.types";

export type { NavViewer };

/** Registry access tier for a concrete path (dynamic routes resolve through their pattern). */
export function routeAccessFor(path: string): Access | undefined {
  return frameRoute(path)?.access;
}

/** True when the viewer may see/open the path according to the route registry. */
export function canOpenPath(path: string, viewer: NavViewer): boolean {
  const route = frameRoute(path);
  return route ? canSeeRoute(route, viewer) : true;
}
