import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, ArrowRight, ArrowLeft } from "lucide-react";
import { getSidebarNavigationCatalog, getSidebarNavigationAccess } from "@/components/app-sidebar";
import { ALL_ITEMS } from "@/components/command-palette";
import { useWorkspace, useWorkspaceAccess } from "@/lib/workspace-context";
import { WORKSPACES, workspaceForPath } from "@shared/workspace-catalog";

export default function ToolDirectory() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"workspace" | "all">("all");
  const { workspace, setWorkspace } = useWorkspace();
  const viewer = useWorkspaceAccess();
  const current = WORKSPACES.find(item => item.id === workspace);
  const items = useMemo(() => {
    const commands = ALL_ITEMS.map(item => ({ title: item.label, url: item.path, icon: item.icon }));
    const catalog = Array.from(new Map([...commands, ...getSidebarNavigationCatalog()].map(item => [item.url, item])).values());
    return catalog.filter(item => {
    const access = getSidebarNavigationAccess(item.url);
    if (access.authOnly && !viewer.authenticated) return false;
    if (access.adminOnly && !viewer.admin) return false;
    if (access.staffOnly && !viewer.staff) return false;
    if (scope === "workspace" && workspaceForPath(item.url) !== workspace) return false;
    const text = `${item.title} ${item.url}`.toLowerCase();
    return text.includes(query.toLowerCase().trim());
    });
  }, [query, scope, workspace, viewer.authenticated, viewer.admin, viewer.staff]);
  return <div className="mx-auto max-w-5xl px-5 py-10">
    <Link href="/" className="inline-flex gap-2 items-center min-h-11 text-sm text-muted-foreground" aria-label="Return to starting points" data-testid="tools-home"><ArrowLeft size={15} />Starting points</Link>
    <h1 className="text-3xl font-semibold mt-5">Find a tool</h1>
    <p className="text-muted-foreground mt-3 max-w-2xl">The full catalog is here when you need it. Search for a goal or a tool name. Access still depends on your existing permissions.</p>
    <label htmlFor="tools-query" className="block font-medium mt-8 mb-2">What are you looking for?</label>
    <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input id="tools-query" value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Try housing, research, or careers" className="w-full min-h-12 pl-10 pr-4 border rounded-xl bg-background" aria-label="Search the full tools catalog" data-testid="tools-search" /></div>
    {current && <div className="flex flex-wrap gap-2 mt-4" aria-label="Catalog scope">
      <button onClick={() => setScope("all")} aria-pressed={scope === "all"} aria-label="Search all tools" data-testid="tools-scope-all" className={`min-h-11 px-4 rounded-lg border text-sm ${scope === "all" ? "bg-primary text-primary-foreground" : ""}`}>All tools</button>
      <button onClick={() => setScope("workspace")} aria-pressed={scope === "workspace"} aria-label={`Search ${current.label} tools`} data-testid="tools-scope-workspace" className={`min-h-11 px-4 rounded-lg border text-sm ${scope === "workspace" ? "bg-primary text-primary-foreground" : ""}`}>{current.label}</button>
    </div>}
    <p role="status" className="mt-5 text-sm text-muted-foreground" data-testid="tools-result-count">{items.length} matching destinations{scope === "workspace" ? " in the focused task catalog" : ""}.</p>
    {items.length ? <div className="mt-4 grid sm:grid-cols-2 gap-2">
      {items.map(item => {
        const content = <><item.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="flex-1 text-sm">{item.title}</span><ArrowRight size={14} aria-hidden="true" /></>;
        const props = { className: "flex items-center gap-3 border rounded-xl px-4 py-3 min-h-14 hover:bg-accent", "aria-label": item.title, "data-testid": `tool-link-${item.url.replace(/[^a-z0-9]+/gi, "-")}` };
        return item.url.startsWith("https://") ? <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" {...props}>{content}<span className="sr-only">Opens an external site in a new tab</span></a> : <Link key={item.url} href={item.url} onClick={() => { const destination = workspaceForPath(item.url); if (destination) setWorkspace(destination); }} {...props}>{content}</Link>;
      })}
    </div> : <div className="mt-5 rounded-xl border border-dashed p-6"><h2 className="font-semibold">No matching tools</h2><p className="mt-2 text-sm text-muted-foreground">Try a shorter term, or search all tools. Restricted destinations are hidden until you have the required access.</p><button onClick={() => { setQuery(""); setScope("all"); }} className="mt-4 min-h-11 px-4 rounded-lg border" aria-label="Clear filters and show all available tools" data-testid="tools-reset">Clear filters</button></div>}
  </div>;
}