import { Link, useLocation } from "wouter";
import { Home, Compass, Search, ArrowLeft, ArrowRight, MapPin, LifeBuoy, GraduationCap, Briefcase, Users, HandCoins, BarChart3, ShieldCheck } from "lucide-react";
import { WORKSPACES, WORKSPACE_TASKS, canUseTask, homeEntryTasks } from "@shared/workspace-catalog";
import { PUBLIC_OUTCOMES, OUTCOME_LABELS, AUDIENCES, AUDIENCE_LABELS, filterNavRoutes, type Outcome } from "@shared/route-nav";
import { useAudience } from "@/lib/audience-preference";
import { useWorkspace, useWorkspaceAccess } from "@/lib/workspace-context";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

/** Always-visible public destinations not already covered by the three starting tasks; reachable from any page without choosing a workspace first. */
const KEY_DESTINATIONS = [
  { id: "for-nonprofits", label: "Coordinate services (orgs)", href: "/for-nonprofits" },
  { id: "partners", label: "Community partners & ambassadors", href: "/partners" },
  { id: "community-gravity", label: "Community Gravity: who does the work", href: "/community-gravity" },
  { id: "community-banks", label: "Community Bank Impact View", href: "/community-banks" },
  { id: "community-analysis", label: "Community analysis & maps", href: "/community-analysis" },
] as const;

/** Icon per outcome; the labels and membership come from the registry, not from this file. */
export const OUTCOME_ICONS: Record<Outcome, typeof Home> = { "get-help": LifeBuoy, learn: GraduationCap, "work-earn": Briefcase, connect: Users, fund: HandCoins, "see-the-data": BarChart3, operate: ShieldCheck };
const SIDEBAR_GROUP_CAP = 6;

/** Phase 3a: six outcomes from the route registry + audience context switcher + Operator door. Additive to the task list above it. */
function OutcomeGroups({ close }: { close: () => void }) {
  const [location] = useLocation();
  const viewer = useWorkspaceAccess();
  const [audience, setAudience] = useAudience();
  const outcomes: Outcome[] = viewer.staff ? [...PUBLIC_OUTCOMES, "operate"] : PUBLIC_OUTCOMES;
  return (
    <nav className="mt-5" aria-labelledby="focused-nav-outcomes-title" data-testid="focused-nav-outcomes">
      <p id="focused-nav-outcomes-title" className="px-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Browse by what you need</p>
      <label htmlFor="focused-nav-audience" className="sr-only">Show tools for</label>
      <select id="focused-nav-audience" value={audience ?? ""} onChange={e => setAudience(e.target.value ? (e.target.value as typeof AUDIENCES[number]) : null)} className="mt-2 mx-3 w-[calc(100%-1.5rem)] min-h-11 rounded-lg border bg-background px-2 text-sm" aria-label="Show tools for a specific audience" data-testid="focused-nav-audience">
        <option value="">Everyone</option>
        {AUDIENCES.map(a => <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>)}
      </select>
      {outcomes.map(outcome => {
        const routes = filterNavRoutes({ viewer, audience, outcome }).filter(r => r.path !== "/").sort((a, b) => a.title.localeCompare(b.title));
        if (routes.length === 0) return null;
        const Icon = OUTCOME_ICONS[outcome];
        const open = routes.some(r => r.path === location);
        return (
          <details key={outcome} open={open || undefined} className="mt-1" data-testid={`focused-outcome-${outcome}`}>
            <summary className="min-h-11 flex items-center gap-3 px-3 text-sm font-semibold cursor-pointer rounded-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon size={16} aria-hidden="true" />{OUTCOME_LABELS[outcome]}<span className="ml-auto text-xs font-normal text-muted-foreground">{routes.length}</span></summary>
            {routes.slice(0, SIDEBAR_GROUP_CAP).map(r => <Link key={r.path} href={r.path} onClick={close} aria-current={location === r.path ? "page" : undefined} className={`flex items-center gap-3 rounded-lg pl-9 pr-3 min-h-11 text-sm hover:bg-accent ${location === r.path ? "bg-accent font-semibold" : ""}`} data-testid={`focused-route-${r.path.replace(/[^a-z0-9]+/gi, "-")}`}>{r.title}</Link>)}
            {routes.length > SIDEBAR_GROUP_CAP && <Link href={`/tools?outcome=${outcome}${audience ? `&audience=${audience}` : ""}`} onClick={close} className="flex items-center gap-2 rounded-lg pl-9 pr-3 min-h-11 text-sm text-primary hover:bg-accent" aria-label={`All ${routes.length} ${OUTCOME_LABELS[outcome]} tools`} data-testid={`focused-outcome-all-${outcome}`}>All {routes.length} <ArrowRight size={13} aria-hidden="true" /></Link>}
          </details>
        );
      })}
    </nav>
  );
}

export function FocusedSidebar() {
  const [location] = useLocation();
  const { workspace, setWorkspace } = useWorkspace();
  const viewer = useWorkspaceAccess();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { setOpenMobile } = useSidebar();
  const current = WORKSPACES.find(item => item.id === workspace);
  const tasks = WORKSPACE_TASKS.filter(task => task.workspace === workspace && canUseTask(task, viewer));
  const close = () => setOpenMobile(false);
  return (
    <Sidebar aria-label="Workspace navigation">
      <SidebarHeader className="p-5 border-b">
        <Link href="/" onClick={close} className="font-bold text-lg" aria-label="TCAF and ThriveUp home" data-testid="focused-sidebar-home">TCAF + ThriveUp</Link>
        <p className="text-xs text-muted-foreground">One next step at a time.</p>
      </SidebarHeader>
      <SidebarContent className="p-3">
        <Link href="/" onClick={close} className="flex items-center gap-3 rounded-lg px-3 min-h-11 hover:bg-accent" aria-label="All starting points" data-testid="focused-nav-start"><Home size={17} aria-hidden="true" />Start here</Link>
        <div className="mt-5 px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your workspace</p>
          <p className="mt-2 font-semibold text-sm">{current?.label ?? "Start with a task"}</p>
        </div>
        {current ? (
          <>
            <Link href={`/workspace/${current.id}`} onClick={close} className="mt-2 flex gap-3 items-center rounded-lg px-3 min-h-11 hover:bg-accent" aria-current={location === `/workspace/${current.id}` ? "page" : undefined} aria-label="Workspace overview" data-testid="focused-nav-workspace"><Compass size={17} aria-hidden="true" />Workspace overview</Link>
            {tasks.map(task => <Link key={task.id} href={task.href} onClick={close} aria-label={task.label} aria-current={location === task.href ? "page" : undefined} data-testid={`focused-nav-${task.id}`} className={`flex gap-3 items-center rounded-lg px-3 min-h-11 text-sm hover:bg-accent ${location === task.href ? "bg-accent font-semibold" : ""}`}><ArrowRight size={14} aria-hidden="true" /><span>{task.label}</span></Link>)}
            <OutcomeGroups close={close} />
          </>
        ) : (
          <>
            {homeEntryTasks().map(task => <Link key={task.id} href={task.href} onClick={() => { setWorkspace(task.workspace); close(); }} aria-label={task.label} data-testid={`focused-nav-${task.id}`} className="flex gap-3 items-center rounded-lg px-3 min-h-11 text-sm hover:bg-accent"><ArrowRight size={14} aria-hidden="true" />{task.label}</Link>)}
            <OutcomeGroups close={close} />
            <nav className="mt-4" aria-labelledby="focused-nav-destinations-title">
          <p id="focused-nav-destinations-title" className="px-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Go directly to</p>
          {KEY_DESTINATIONS.map(d => <Link key={d.id} href={d.href} onClick={close} aria-current={location === d.href ? "page" : undefined} data-testid={`focused-nav-dest-${d.id}`} className={`flex items-center gap-3 rounded-lg px-3 min-h-11 text-sm hover:bg-accent ${location === d.href ? "bg-accent font-semibold" : ""}`}><MapPin size={14} aria-hidden="true" /><span>{d.label}</span></Link>)}
        </nav>
            <details className="mt-4">
              <summary className="min-h-11 flex items-center px-3 text-sm font-semibold cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="focused-nav-perspectives">Explore by audience</summary>
              {WORKSPACES.map(item => <Link key={item.id} href={`/workspace/${item.id}`} onClick={close} className="flex gap-3 items-center rounded-lg px-3 min-h-11 text-sm hover:bg-accent" aria-label={item.label} data-testid={`focused-nav-choose-${item.id}`}><Compass size={16} aria-hidden="true" />{item.label}</Link>)}
            </details>
          </>
        )}
        <Link href="/tools" onClick={close} className="mt-6 flex items-center gap-3 rounded-lg px-3 min-h-11 hover:bg-accent border" aria-label="Search all tools" data-testid="focused-nav-tools"><Search size={17} aria-hidden="true" />Search all tools</Link>
        {viewer.admin && <Link href="/ecosystem-ops-center" onClick={close} className="mt-2 px-3 min-h-11 flex items-center text-sm hover:bg-accent rounded-lg" aria-label="Staff operations center" data-testid="focused-nav-ops">Staff operations</Link>}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        {!isLoading && (isAuthenticated ? <button type="button" onClick={() => logout()} aria-label="Sign out" data-testid="focused-signout" className="min-h-11 text-left text-sm">Sign out</button> : <a href={`/api/login?returnTo=${encodeURIComponent(location)}`} aria-label="Sign in to your account" data-testid="focused-signin" className="min-h-11 flex items-center text-sm font-semibold">Sign in</a>)}
        <Link href="/workspaces" onClick={close} className="flex items-center gap-2 min-h-11 text-sm" aria-label="Change workspace" data-testid="focused-nav-change"><ArrowLeft size={15} aria-hidden="true" />Change workspace</Link>
        <Link href="/platform-overview" onClick={close} className="text-xs text-muted-foreground min-h-11 flex items-center underline" aria-label="Read the full platform overview" data-testid="focused-nav-overview">About the full platform</Link>
      </SidebarFooter>
    </Sidebar>
  );
}

export function FocusedBottomTabs() {
  const [location] = useLocation();
  // Phase 3b: tabs are outcomes (registry axis), not workspaces. Workspace stays reachable from Start and the sidebar.
  const links = [
    { href: "/", label: "Start", icon: Home },
    { href: "/get-help", label: "Help", icon: LifeBuoy },
    { href: "/tools?outcome=learn", label: "Learn", icon: GraduationCap },
    { href: "/tools?outcome=see-the-data", label: "Data", icon: BarChart3 },
    { href: "/tools", label: "Tools", icon: Search },
  ];
  return <nav aria-label="Mobile primary navigation" data-testid="nav-bottom-tab-bar" className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-sm flex pb-[env(safe-area-inset-bottom)]">
    {links.map(({ href, label, icon: Icon }) => <Link key={label} href={href} aria-label={label} aria-current={location === href.split("?")[0] ? "page" : undefined} data-testid={`tab-${label.toLowerCase()}`} className="flex-1 min-h-[60px] flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Icon size={19} aria-hidden="true" />{label}</Link>)}
  </nav>;
}