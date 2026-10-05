import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Search, ArrowRight, ArrowLeft } from "lucide-react";
import { getSidebarNavigationAccess } from "@/components/app-sidebar";
import { OUTCOME_ICONS } from "@/components/focused-navigation";
import { useWorkspace, useWorkspaceAccess } from "@/lib/workspace-context";
import { useAudience } from "@/lib/audience-preference";
import { workspaceForPath } from "@shared/workspace-catalog";
import { PUBLIC_OUTCOMES, OUTCOME_LABELS, AUDIENCES, AUDIENCE_LABELS, filterNavRoutes, groupByOutcome, connectionsFor, isValidOutcome, isValidAudience, type Outcome } from "@shared/route-nav";

/**
 * Phase 3c: the tools directory reads the route registry only — grouped by the
 * six outcomes, narrowed by audience context, and showing where each tool
 * sends people next. Access = registry floor AND the legacy sidebar predicate.
 */
export default function ToolDirectory() {
  const [query, setQuery] = useState("");
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const outcomeParam = params.get("outcome");
  const outcome: Outcome | null = isValidOutcome(outcomeParam) ? outcomeParam : null;
  const { setWorkspace } = useWorkspace();
  const viewer = useWorkspaceAccess();
  const [storedAudience, setAudience] = useAudience();
  const audienceParam = params.get("audience");
  const audience = isValidAudience(audienceParam) ? audienceParam : storedAudience;
  const outcomes: Outcome[] = viewer.staff ? [...PUBLIC_OUTCOMES, "operate"] : PUBLIC_OUTCOMES;

  const setOutcome = (next: Outcome | null) => {
    const p = new URLSearchParams(search);
    next ? p.set("outcome", next) : p.delete("outcome");
    const qs = p.toString();
    navigate(`/tools${qs ? `?${qs}` : ""}`, { replace: true });
  };

  const groups = useMemo(() => {
    const routes = filterNavRoutes({ viewer, audience, outcome, query }).filter(item => {
      const access = getSidebarNavigationAccess(item.path);
      if (access.authOnly && !viewer.authenticated) return false;
      if (access.adminOnly && !viewer.admin) return false;
      if (access.staffOnly && !viewer.staff) return false;
      return true;
    });
    return groupByOutcome(routes);
  }, [query, outcome, audience, viewer]);
  const total = groups.reduce((n, g) => n + g.routes.length, 0);

  return <div className="mx-auto max-w-5xl px-5 py-10">
    <Link href="/" className="inline-flex gap-2 items-center min-h-11 text-sm text-muted-foreground" aria-label="Return to starting points" data-testid="tools-home"><ArrowLeft size={15} />Starting points</Link>
    <h1 className="text-3xl font-semibold mt-5">Find a tool</h1>
    <p className="text-muted-foreground mt-3 max-w-2xl">Every tool on the platform, grouped by what you need to get done. Access still depends on your existing permissions.</p>
    <label htmlFor="tools-query" className="block font-medium mt-8 mb-2">What are you looking for?</label>
    <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input id="tools-query" value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Try housing, research, or careers" className="w-full min-h-12 pl-10 pr-4 border rounded-xl bg-background" aria-label="Search the full tools catalog" data-testid="tools-search" /></div>

    <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Filter by outcome">
      <button onClick={() => setOutcome(null)} aria-pressed={outcome === null} data-testid="tools-outcome-all" className={`min-h-11 px-4 rounded-lg border text-sm ${outcome === null ? "bg-primary text-primary-foreground" : ""}`}>All</button>
      {outcomes.map(o => { const Icon = OUTCOME_ICONS[o]; return <button key={o} onClick={() => setOutcome(o)} aria-pressed={outcome === o} data-testid={`tools-outcome-${o}`} className={`min-h-11 px-4 rounded-lg border text-sm inline-flex items-center gap-2 ${outcome === o ? "bg-primary text-primary-foreground" : ""}`}><Icon size={15} aria-hidden="true" />{OUTCOME_LABELS[o]}</button>; })}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label htmlFor="tools-audience" className="text-sm font-medium">Show tools for</label>
      <select id="tools-audience" value={audience ?? ""} onChange={e => { const v = e.target.value; setAudience(isValidAudience(v) ? v : null); const p = new URLSearchParams(search); p.delete("audience"); const qs = p.toString(); navigate(`/tools${qs ? `?${qs}` : ""}`, { replace: true }); }} className="min-h-11 rounded-lg border bg-background px-3 text-sm" data-testid="tools-audience">
        <option value="">Everyone</option>
        {AUDIENCES.map(a => <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>)}
      </select>
    </div>

    <p role="status" className="mt-5 text-sm text-muted-foreground" data-testid="tools-result-count">{total} matching destinations{outcome ? ` under ${OUTCOME_LABELS[outcome]}` : ""}{audience ? ` for ${AUDIENCE_LABELS[audience]}` : ""}.</p>

    {total ? groups.map(g => {
      const Icon = OUTCOME_ICONS[g.outcome];
      return <section key={g.outcome} className="mt-8" aria-labelledby={`tools-group-${g.outcome}`} data-testid={`tools-group-${g.outcome}`}>
        <h2 id={`tools-group-${g.outcome}`} className="flex items-center gap-2 text-lg font-semibold"><Icon size={18} aria-hidden="true" />{g.label}<span className="text-sm font-normal text-muted-foreground">({g.routes.length})</span></h2>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {g.routes.map(item => {
            const next = connectionsFor(item, viewer).slice(0, 3);
            return <Link key={item.path} href={item.path} onClick={() => { const destination = workspaceForPath(item.path); if (destination) setWorkspace(destination); }} className="flex flex-col gap-1 border rounded-xl px-4 py-3 min-h-14 hover:bg-accent" aria-label={item.title} data-testid={`tool-link-${item.path.replace(/[^a-z0-9]+/gi, "-")}`}>
              <span className="flex items-center gap-2 text-sm font-medium">{item.title}<ArrowRight size={14} aria-hidden="true" className="ml-auto shrink-0" /></span>
              {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
              {next.length > 0 && <span className="text-[11px] text-muted-foreground" data-testid="tool-connections">Leads to: {next.map(n => n.title).join(" · ")}</span>}
            </Link>;
          })}
        </div>
      </section>;
    }) : <div className="mt-5 rounded-xl border border-dashed p-6"><h2 className="font-semibold">No matching tools</h2><p className="mt-2 text-sm text-muted-foreground">Try a shorter term, another outcome, or "Everyone". Restricted destinations are hidden until you have the required access.</p><button onClick={() => { setQuery(""); setOutcome(null); setAudience(null); }} className="mt-4 min-h-11 px-4 rounded-lg border" aria-label="Clear filters and show all available tools" data-testid="tools-reset">Clear filters</button></div>}
  </div>;
}
