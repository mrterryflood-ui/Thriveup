import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { canSeeRoute, connectionsFor, upstreamFor, OUTCOME_LABELS, type NavRoute } from "@shared/route-nav";
import { canOpenPath } from "@shared/route-access";
import { OUTCOME_ICONS } from "@/components/focused-navigation";
import { useWorkspaceAccess } from "@/lib/workspace-context";
import { NetworkStatus } from "@/components/network-status";
import { frameRoute } from "@shared/frame-route";

/**
 * Phase 4a: one rail under the shell header for every registered page. Reads the route
 * registry only (outcome, guide line, upstream need, downstream next steps). Hidden on the
   * home page and on any path without registry metadata. Dynamic routes retain their access floor.
 * Access = the route registry (shared/route-access), the single access predicate.
 */
const COLLAPSE_KEY = "thriveup.pageframe.collapsed";

function readCollapsed(): boolean {
  const phone = typeof window !== "undefined" && window.innerWidth < 768;
  try { return sessionStorage.getItem(COLLAPSE_KEY) === "1" || (sessionStorage.getItem(COLLAPSE_KEY) === null && phone); } catch { return phone; }
}

export function PageFrame({ path }: { path: string }) {
  const viewer = useWorkspaceAccess();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { sessionStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); }
    catch { console.warn("[PageFrame] Session storage unavailable; path preference will not persist."); }
  }

  const route: NavRoute | undefined = frameRoute(path);
  if (!route || route.path === "/" || !canSeeRoute(route, viewer)) return null;

  const visible = (rows: NavRoute[]) => rows.filter(r => canOpenPath(r.path, viewer));
  const next = visible(connectionsFor(route, viewer)).slice(0, 3);
  const from = visible(upstreamFor(route, viewer)).filter(r => r.path !== "/").slice(0, 2);
  const Icon = OUTCOME_ICONS[route.outcome];
  const slug = (p: string) => p.replace(/[^a-z0-9]+/gi, "-");

  return (
    <nav aria-label="Where this page fits" data-testid="page-frame" data-outcome={route.outcome} className="border-b bg-muted/40 px-4 py-2 text-sm">
      <div className="mx-auto max-w-6xl flex items-center gap-2">
        <Link href={`/tools?outcome=${route.outcome}`} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 min-h-11 text-xs font-semibold hover:bg-accent" aria-label={`${OUTCOME_LABELS[route.outcome]}: see all tools for this outcome`} data-testid="page-frame-outcome"><Icon size={13} aria-hidden="true" />{OUTCOME_LABELS[route.outcome]}</Link>
        <span className="font-medium truncate flex-1 min-w-0" data-testid="page-frame-title">{route.title}</span>
        <button type="button" onClick={toggle} aria-expanded={!collapsed} aria-controls="page-frame-detail" className="shrink-0 inline-flex items-center gap-1 min-h-11 px-2 text-xs text-muted-foreground hover:text-foreground" data-testid="page-frame-toggle">{collapsed ? "Show path" : "Hide path"}{collapsed ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronUp size={13} aria-hidden="true" />}</button>
      </div>
      {!collapsed && (
        <div id="page-frame-detail" className="mx-auto max-w-6xl mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <NetworkStatus enabled={!collapsed} />
          {route.guide && <p className="basis-full sm:basis-auto sm:max-w-md" data-testid="page-frame-guide">{route.guide}</p>}
          {from.length > 0 && <span className="inline-flex flex-wrap items-center gap-1.5" data-testid="page-frame-upstream">Came from:{from.map(r => <Link key={r.path} href={r.path} className="underline underline-offset-2 min-h-11 inline-flex items-center hover:text-foreground" data-testid={`page-frame-from-${slug(r.path)}`}>{r.title}</Link>)}</span>}
          {next.length > 0 && <span className="inline-flex flex-wrap items-center gap-1.5" data-testid="page-frame-downstream">Next:{next.map(r => <Link key={r.path} href={r.path} className="inline-flex items-center gap-0.5 underline underline-offset-2 min-h-11 hover:text-foreground" data-testid={`page-frame-next-${slug(r.path)}`}>{r.title}<ArrowRight size={11} aria-hidden="true" /></Link>)}</span>}
        </div>
      )}
    </nav>
  );
}
