import { Link, useLocation } from "wouter";
import { Home, Compass, Search, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { WORKSPACES, WORKSPACE_TASKS, canUseTask, homeEntryTasks } from "@shared/workspace-catalog";
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
          </>
        ) : (
          <>
            {homeEntryTasks().map(task => <Link key={task.id} href={task.href} onClick={() => { setWorkspace(task.workspace); close(); }} aria-label={task.label} data-testid={`focused-nav-${task.id}`} className="flex gap-3 items-center rounded-lg px-3 min-h-11 text-sm hover:bg-accent"><ArrowRight size={14} aria-hidden="true" />{task.label}</Link>)}
            <nav className="mt-4" aria-labelledby="focused-nav-destinations-title">
          <p id="focused-nav-destinations-title" className="px-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Go directly to</p>
          {KEY_DESTINATIONS.map(d => <Link key={d.id} href={d.href} onClick={close} aria-current={location === d.href ? "page" : undefined} data-testid={`focused-nav-dest-${d.id}`} className={`flex items-center gap-3 rounded-lg px-3 min-h-11 text-sm hover:bg-accent ${location === d.href ? "bg-accent font-semibold" : ""}`}><MapPin size={14} aria-hidden="true" /><span>{d.label}</span></Link>)}
        </nav>
            <details className="mt-4" open>
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
  const { workspace } = useWorkspace();
  const [location] = useLocation();
  const links = [
    { href: "/", label: "Start", icon: Home },
    { href: workspace ? `/workspace/${workspace}` : "/workspaces", label: "Workspace", icon: Compass },
    { href: "/tools", label: "Tools", icon: Search },
  ];
  return <nav aria-label="Mobile primary navigation" data-testid="nav-bottom-tab-bar" className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-sm flex pb-[env(safe-area-inset-bottom)]">
    {links.map(({ href, label, icon: Icon }) => <Link key={label} href={href} aria-label={label} aria-current={location === href ? "page" : undefined} data-testid={`tab-${label.toLowerCase()}`} className="flex-1 min-h-[60px] flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Icon size={19} aria-hidden="true" />{label}</Link>)}
  </nav>;
}