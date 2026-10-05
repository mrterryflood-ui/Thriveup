import frames from "./route-frame.generated.json";
import { navRoute, type NavRoute } from "./route-nav";

const patterns = (frames as NavRoute[]).slice().sort((a, b) =>
  b.path.split("/").filter(s => s && !s.startsWith(":")).length
  - a.path.split("/").filter(s => s && !s.startsWith(":")).length
).map(route => ({
  route,
  pattern: new RegExp("^" + route.path.split("/").filter(Boolean).map(segment => segment.startsWith(":")
    ? segment.endsWith("?") ? "(?:/[^/]+)?" : "/[^/]+"
    : "/" + segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("") + "/?$"),
}));
export function frameRoute(path: string): NavRoute | undefined {
  const clean = path.split(/[?#]/)[0];
  return navRoute(clean) ?? patterns.find(entry => entry.pattern.test(clean))?.route;
}