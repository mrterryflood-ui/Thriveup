import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { getSidebarNavigationCatalog } from "@/components/app-sidebar";
import { canOpenPath } from "@shared/route-access";
import { useWorkspace, useWorkspaceAccess } from "@/lib/workspace-context";
import { workspaceForPath } from "@shared/workspace-catalog";
import { rankNavigationSearch } from "@shared/navigation-search";
import navigationManifest from "@shared/route-nav.generated.json";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search, Home, Target, Heart, Rocket, Network,
  ClipboardList, HandHeart, MapPin, Route, Shield,
  Trophy, FileText, Wand2, BarChart3, Users,
  Award, GraduationCap, Bot, Brain, Briefcase,
  DollarSign, Globe, Map, Building2, Scale,
  Calendar, Flame, Zap, Compass, MessageCircle,
  Wheat, Baby, AlertTriangle, Stethoscope,
  BookOpen, TrendingUp, Activity, Wrench,
  PenLine, Package, ClipboardCheck, Lightbulb,
  Sparkles, Star, Info, Mail, Landmark,
  LayoutDashboard, HeartHandshake, Handshake, FlaskConical,
  ShieldCheck, FolderLock, Wallet, Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  label: string;
  path: string;
  icon: React.ElementType;
  group: string;
  keywords?: string;
}

export const ALL_ITEMS: CommandItem[] = [
  { group: "Start", label: "Choose a starting point", path: "/", icon: Home, keywords: "home dashboard" },
  { group: "Start", label: "Search all tools", path: "/tools", icon: Search },
  { group: "Start", label: "Residents & families", path: "/workspace/residents", icon: Heart },
  { group: "Start", label: "Organizations & practitioners", path: "/workspace/organizations", icon: Building2 },
  { group: "Start", label: "Funders & evaluators", path: "/workspace/funders", icon: BarChart3 },
  { group: "Start", label: "Community & policy", path: "/workspace/community", icon: Globe },
  { group: "Home", label: "This Week (Monday Brief)", path: "/this-week", icon: Calendar, keywords: "weekly brief" },
  { group: "Home", label: "Neighborhood Intel", path: "/neighborhood", icon: MapPin },
  { group: "Home", label: "Coverage Map", path: "/coverage", icon: Map },

  { group: "Get Funded", label: "Live Grant Opportunities", path: "/grants", icon: Target },
  { group: "Get Funded", label: "My Grants & Win Rate", path: "/my-grants", icon: Trophy },
  { group: "Get Funded", label: "RFP / Narrative Writer", path: "/grant-narrative", icon: PenLine },
  { group: "Get Funded", label: "LOI Writer", path: "/loi-writer", icon: FileText },
  { group: "Get Funded", label: "Grant Packages", path: "/grant-packages", icon: Package },
  { group: "Get Funded", label: "RFP Fidelity Engine", path: "/rfp-fidelity", icon: ShieldCheck },
  { group: "Get Funded", label: "Winning Proposals Library", path: "/won-proposals", icon: Trophy },
  { group: "Get Funded", label: "APEX Accelerators", path: "/apex-accelerators", icon: Landmark },
  { group: "Get Funded", label: "CEDS Regional Alignment", path: "/ceds", icon: Map },
  { group: "Get Funded", label: "Application Tracker", path: "/grants/applications", icon: ClipboardCheck },

  { group: "Benefits & Serve", label: "Resource Finder", path: "/resources", icon: MapPin, keywords: "find help" },
  { group: "Benefits & Serve", label: "9-Benefit Screener", path: "/benefits-screener", icon: ClipboardList, keywords: "snap medicaid benefits" },
  { group: "Benefits & Serve", label: "Benefits Command Center", path: "/benefits", icon: HandHeart },
  { group: "Benefits & Serve", label: "Intake Wizard", path: "/intake", icon: ClipboardCheck },
  { group: "Benefits & Serve", label: "Resident Journey", path: "/resident-journey", icon: Route },
  { group: "Benefits & Serve", label: "My Journey", path: "/my-journey", icon: Rocket },
  { group: "Benefits & Serve", label: "My Household", path: "/my-household", icon: Home },
  { group: "Benefits & Serve", label: "My Document Vault", path: "/my-documents", icon: FolderLock },
  { group: "Benefits & Serve", label: "My Appointments", path: "/my-appointments", icon: Calendar },

  { group: "Foster Youth", label: "Foster Youth Hub", path: "/foster-youth", icon: HandHeart },
  { group: "Foster Youth", label: "Aging-Out Toolkit", path: "/foster-youth/toolkit", icon: ClipboardCheck },
  { group: "Foster Youth", label: "Wellbeing Check-in", path: "/foster-youth/wellbeing", icon: Heart },
  { group: "Foster Youth", label: "State Benefits (50 states)", path: "/foster-youth/benefits", icon: Landmark },
  { group: "Foster Youth", label: "FAFSA & ETV (foster)", path: "/fafsa-navigator?audience=foster", icon: GraduationCap },

  { group: "Justice & Reentry", label: "Reentry Program", path: "/reentry-program", icon: Scale },
  { group: "Justice & Reentry", label: "Fair-Chance Employers", path: "/jobs", icon: Trophy },
  { group: "Justice & Reentry", label: "Reentry Dashboard", path: "/reentry", icon: Scale },
  { group: "Justice & Reentry", label: "Justice Partners", path: "/justice-partners", icon: Handshake },

  { group: "Health & Prevention", label: "Veterans Program", path: "/veterans", icon: Shield },
  { group: "Health & Prevention", label: "Behavioral Health", path: "/behavioral-health", icon: Heart },
  { group: "Health & Prevention", label: "Prevention Hub", path: "/prevention", icon: ShieldCheck },
  { group: "Health & Prevention", label: "Parent Education", path: "/parent-education", icon: Heart },
  { group: "Health & Prevention", label: "CHW Dashboard", path: "/chw-dashboard", icon: Stethoscope },

  { group: "Workforce & Trades", label: "Trade Sims", path: "/academy/trade-sims", icon: Wrench, keywords: "trades vocational" },
  { group: "Workforce & Trades", label: "Career Explorer", path: "/academy/careers", icon: Briefcase },
  { group: "Workforce & Trades", label: "My Pathway", path: "/academy/pathway", icon: Route },
  { group: "Workforce & Trades", label: "Mentors & Pathways", path: "/mentorship-directory", icon: Handshake },
  { group: "Workforce & Trades", label: "Employer Connections", path: "/workforce-employers", icon: Building2 },
  { group: "Workforce & Trades", label: "MOS Translator", path: "/mos-translator", icon: Shield, keywords: "military veteran" },
  { group: "Workforce & Trades", label: "Workforce Pell Grant", path: "/workforce-pell", icon: DollarSign },
  { group: "Workforce & Trades", label: "Shadow Worker Hub", path: "/shadow-worker-hub", icon: Heart },

  { group: "Academy & Learning", label: "Panther Village", path: "/academy", icon: Rocket },
  { group: "Academy & Learning", label: "AI Curriculum (Youth)", path: "/curriculum", icon: Brain },
  { group: "Academy & Learning", label: "STAAR Test Prep", path: "/academy/staar-prep", icon: GraduationCap },
  { group: "Academy & Learning", label: "Daily Check-In", path: "/academy/self-assessment", icon: ClipboardCheck },
  { group: "Academy & Learning", label: "Daily Quests", path: "/academy/quests", icon: Zap },
  { group: "Academy & Learning", label: "Achievements", path: "/achievements", icon: Award },
  { group: "Academy & Learning", label: "Financial Literacy", path: "/academy/financial-literacy", icon: DollarSign },
  { group: "Academy & Learning", label: "AI Creation Studio", path: "/ai-tools", icon: Wand2 },
  { group: "Academy & Learning", label: "Sparky (AI Companion)", path: "/sparky", icon: MessageCircle },
  { group: "Academy & Learning", label: "Navigator (AI)", path: "/navigator", icon: Compass },

  { group: "Partners & Connect", label: "ALIGN", path: "/align", icon: Sparkles },
  { group: "Partners & Connect", label: "THRIVE", path: "/thrive", icon: Star },
  { group: "Partners & Connect", label: "Community Partners", path: "/partners", icon: Handshake },
  { group: "Partners & Connect", label: "Coalition Dashboard", path: "/coalition", icon: Users },
  { group: "Partners & Connect", label: "Ecosystem Hub", path: "/ecosystem", icon: Globe },
  { group: "Partners & Connect", label: "Community Voice", path: "/voice", icon: MessageCircle },
  { group: "Partners & Connect", label: "Community Map", path: "/community-map", icon: Map },
  { group: "Partners & Connect", label: "Why ThriveUp?", path: "/why-thriveup", icon: FileText },

  { group: "Central Texas", label: "CTX Benefits Initiative", path: "/st-davids", icon: LayoutDashboard },
  { group: "Central Texas", label: "N. Wilco Childcare Coalition", path: "/north-wilco-childcare-coalition", icon: Baby },
  { group: "Central Texas", label: "Regional Briefing", path: "/regional-briefing", icon: Sparkles },
  { group: "Central Texas", label: "Austin Initiative", path: "/austin", icon: MapPin },
  { group: "Central Texas", label: "Manor Hub", path: "/manor", icon: MapPin },
  { group: "Central Texas", label: "Pflugerville Hub", path: "/pflugerville", icon: MapPin },

  { group: "Child Care", label: "Child Care Overview", path: "/child-care", icon: Baby },
  { group: "Child Care", label: "National Supply & Economic Context", path: "/child-care/national", icon: Baby },
  { group: "Child Care", label: "North Texas Region", path: "/child-care-north-texas", icon: Baby },
  { group: "Child Care", label: "Williamson County Initiative", path: "/child-care-wilco", icon: MapPin },
  { group: "Child Care", label: "Workforce Connection & Policy", path: "/child-care-workforce", icon: TrendingUp },

  { group: "Rural & Agriculture", label: "County Ag Intelligence", path: "/rural-intel", icon: Wheat },
  { group: "Rural & Agriculture", label: "Farm Profitability Navigator", path: "/farm-profitability", icon: DollarSign },
  { group: "Rural & Agriculture", label: "Ag Trade Simulations", path: "/ag-trade-sims", icon: FlaskConical },
  { group: "Rural & Agriculture", label: "Farmworker ITI", path: "/farmworker-iti", icon: HeartHandshake },
  { group: "Rural & Agriculture", label: "Rural Healthcare Hub", path: "/rural-health", icon: Stethoscope },
  { group: "Rural & Agriculture", label: "Rural Workforce Pipeline", path: "/rural-workforce", icon: GraduationCap },
  { group: "Rural & Agriculture", label: "Rural Connectivity", path: "/rural-connectivity", icon: Activity },

  { group: "Impact & Data", label: "Impact Dashboard", path: "/impact", icon: BarChart3 },
  { group: "Impact & Data", label: "Equity Dashboard", path: "/equity-dashboard", icon: BarChart3 },
  { group: "Impact & Data", label: "SDOH Explorer", path: "/sdoh-explorer", icon: Search },
  { group: "Impact & Data", label: "Transparency Dashboard", path: "/transparency", icon: Activity },
  { group: "Impact & Data", label: "Policy Signal Engine", path: "/policy-engine", icon: BarChart3 },
  { group: "Impact & Data", label: "Live Network View", path: "/network", icon: BarChart3 },
  { group: "Impact & Data", label: "Community Impact Conductor", path: "/community-impact", icon: BarChart3 },
  { group: "Impact & Data", label: "City Comparison", path: "/city-comparison", icon: Scale },

  { group: "About", label: "About / Our Structure", path: "/about", icon: Info },
  { group: "About", label: "Pricing & Services", path: "/pricing", icon: DollarSign },
  { group: "About", label: "Methodology", path: "/methodology", icon: BookOpen },
  { group: "About", label: "Research Hub", path: "/research-hub", icon: BookOpen },
  { group: "About", label: "Contact Us", path: "/contact", icon: Mail },
  { group: "About", label: "Privacy Policy", path: "/privacy", icon: Shield },
];

let _openCommandPalette: (() => void) | null = null;

export function openCommandPalette() {
  _openCommandPalette?.();
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allWorkspaces, setAllWorkspaces] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { workspace, setWorkspace } = useWorkspace();
  const { authenticated: isAuthenticated, admin: isAdmin, staff: isStaff } = useWorkspaceAccess();

  _openCommandPalette = () => setOpen(true);

  // Filter items using the sidebar's own route metadata, before text search.
  const visibleItems = useMemo(() => {
    const catalog: CommandItem[] = getSidebarNavigationCatalog().filter(item => item.url.startsWith("/")).map(item => ({ label: item.title, path: item.url, icon: item.icon, group: "Tools" }));
    const metadata = new globalThis.Map(navigationManifest.map(item => [item.path, item]));
    const merged: CommandItem[] = Array.from(new globalThis.Map([...catalog, ...ALL_ITEMS].map(item => [item.path, item])).values()).map(item => {
      const route = metadata.get(item.path.split("?")[0]);
      return { ...item, keywords: [item.keywords, route?.title, route?.description, route?.guide].filter(Boolean).join(" ") };
    });
    return merged.filter((item) => {
    // Registry is the only access predicate (shared/route-access).
    if (!canOpenPath(item.path, { authenticated: isAuthenticated, staff: isStaff, admin: isAdmin })) return false;
    if (workspace && !allWorkspaces && item.group !== "Start" && workspaceForPath(item.path) !== workspace) return false;
    return true;
    }).sort((a, b) => Number(b.group === "Start") - Number(a.group === "Start"));
  }, [isAuthenticated, isAdmin, isStaff, workspace, allWorkspaces]);

  const matches = useMemo(() => rankNavigationSearch(visibleItems, query), [visibleItems, query]);
  const filtered = query.trim()
    ? matches.slice(0, 20)
    : visibleItems.slice(0, 8);

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const flatFiltered = filtered;
  useEffect(() => {
    listRef.current?.querySelector(`[data-command-index="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, workspace, allWorkspaces, isAuthenticated, isAdmin, isStaff]);

  const handleNavigate = useCallback(
    (path: string) => {
      const targetWorkspace = workspaceForPath(path);
      if (targetWorkspace) setWorkspace(targetWorkspace);
      setLocation(path);
      setOpen(false);
      setQuery("");
    },
    [setLocation, setWorkspace]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setSelectedIndex(0);
      setAllWorkspaces(false);
    }
  }, [open]);

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, Math.min(i + 1, flatFiltered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFiltered[selectedIndex]) {
        handleNavigate(flatFiltered[selectedIndex].path);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 gap-0 max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        data-testid="dialog-command-palette"
        aria-label="Command palette"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>

        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b bg-background"
          data-testid="container-command-search"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={workspace && !allWorkspaces ? "Search this workspace…" : "Search all pages and tools…"}
            className="border-0 focus-visible:ring-0 shadow-none text-base h-auto py-0 px-0 placeholder:text-muted-foreground/60"
            data-testid="input-command-search"
            aria-label="Search pages"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="command-results"
            aria-activedescendant={filtered[selectedIndex] ? `command-option-${selectedIndex}` : undefined}
          />
          <kbd className="hidden sm:flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground select-none">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </div>

        {workspace && <div className="px-4 py-2 border-b flex items-center justify-between gap-3 text-xs">
          <span>{allWorkspaces ? "All workspaces" : "Current workspace"}</span>
          <button type="button" onClick={() => setAllWorkspaces(value => !value)} aria-label={allWorkspaces ? "Search only this workspace" : "Search all workspaces"} data-testid="command-scope-toggle" className="min-h-11 underline font-medium">{allWorkspaces ? "Search this workspace" : "Search all workspaces"}</button>
        </div>}
        <p className="px-4 py-2 text-xs text-muted-foreground" role="status" data-testid="command-result-summary">
          {query.trim() ? `Showing ${filtered.length} of ${matches.length} matching pages and tools.` : "Find pages and tools."} This is not a live opportunity or web search.
        </p>
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto overscroll-contain p-2"
          data-testid="list-command-results"
          role="listbox"
          id="command-results"
          aria-label="Matching pages and tools"
        >
          {flatFiltered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground" data-testid="text-command-no-results">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : query.trim() ? (
            flatFiltered.map((item, index) => (
              <CommandRow
                key={item.path + item.label}
                item={item}
                index={index}
                isSelected={index === selectedIndex}
                onClick={() => handleNavigate(item.path)}
                showGroup
              />
            ))
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {group}
                </p>
                {items.map((item, index) => (
                  <CommandRow
                    key={item.path + item.label}
                    item={item}
                    index={flatFiltered.indexOf(item)}
                    isSelected={flatFiltered.indexOf(item) === selectedIndex}
                    onClick={() => handleNavigate(item.path)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <div className="border-t px-4 py-2 text-[11px] text-muted-foreground flex items-center gap-3 bg-muted/40" data-testid="container-command-hints">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommandRow({
  item,
  isSelected,
  onClick,
  showGroup,
  index,
}: {
  item: CommandItem;
  isSelected: boolean;
  onClick: () => void;
  showGroup?: boolean;
  index: number;
}) {
  const Icon = item.icon;
  return (
    <button
      role="option"
      id={`command-option-${index}`}
      data-command-index={index}
      aria-selected={isSelected}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors text-left",
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
      )}
      onClick={onClick}
      data-testid={`item-command-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="font-medium block truncate">{item.label}</span>
        {showGroup && (
          <span className="text-[11px] text-muted-foreground">{item.group}</span>
        )}
      </span>
    </button>
  );
}
