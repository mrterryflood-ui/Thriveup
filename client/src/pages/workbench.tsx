import { useState, useCallback } from "react";
import { X, Plus, Maximize2, LayoutGrid, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PINNABLE_TOOLS = [
  { id: "sparky",          label: "Sparky AI",              url: "/sparky",              tag: "AI" },
  { id: "navigator",       label: "Navigator AI",           url: "/navigator",           tag: "AI" },
  { id: "grants",          label: "Live Grants",            url: "/grants",              tag: "Fund" },
  { id: "my-grants",       label: "My Grants",              url: "/my-grants",           tag: "Fund" },
  { id: "this-week",       label: "This Week",              url: "/this-week",           tag: "Fund" },
  { id: "rfp-fidelity",    label: "RFP Fidelity",           url: "/rfp-fidelity",        tag: "Fund" },
  { id: "grant-narrative", label: "Narrative Writer",       url: "/grant-narrative",     tag: "Fund" },
  { id: "benefits",        label: "Benefits Center",        url: "/benefits",            tag: "Serve" },
  { id: "screener",        label: "Benefits Screener",      url: "/benefits-screener",   tag: "Serve" },
  { id: "resources",       label: "Resource Finder",        url: "/resources",           tag: "Serve" },
  { id: "intake",          label: "Intake Wizard",          url: "/intake",              tag: "Serve" },
  { id: "case-manager",    label: "Case Manager View",      url: "/case-manager",        tag: "Serve" },
  { id: "impact",          label: "Impact Dashboard",       url: "/impact",              tag: "Analytics" },
  { id: "transparency",    label: "Transparency",           url: "/transparency",        tag: "Analytics" },
  { id: "pilot",           label: "Pilot Dashboard",        url: "/pilot",               tag: "Analytics" },
  { id: "coalition",       label: "Coalition Dashboard",    url: "/coalition",           tag: "Partners" },
  { id: "community-map",   label: "Community Map",          url: "/community-map",       tag: "Partners" },
  { id: "coverage",        label: "Coverage Map",           url: "/coverage",            tag: "Partners" },
  { id: "trade-sims",      label: "Trade Sims",             url: "/academy/trade-sims",  tag: "Grow" },
  { id: "careers",         label: "Career Explorer",        url: "/academy/careers",     tag: "Grow" },
  { id: "dashboard",       label: "Dashboard",              url: "/dashboard",           tag: "Home" },
  { id: "foster-youth",    label: "Foster Youth Hub",       url: "/foster-youth",        tag: "Serve" },
  { id: "reentry",         label: "Reentry Dashboard",      url: "/reentry",             tag: "Serve" },
];

const TAG_COLORS: Record<string, string> = {
  AI:        "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Fund:      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Serve:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Analytics: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Partners:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  Grow:      "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  Home:      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const LS_KEY = "tcaf_workbench_pins";
const MAX_PINS = 4;

function loadPins(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function savePins(pins: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(pins)); } catch {}
}

type Layout = "grid" | "columns";

export default function WorkbenchPage() {
  const [pins, setPins] = useState<string[]>(loadPins);
  const [showPicker, setShowPicker] = useState(pins.length === 0);
  const [pickerFilter, setPickerFilter] = useState("All");
  const [layout, setLayout] = useState<Layout>("grid");
  const [fullscreen, setFullscreen] = useState<string | null>(null);

  const addPin = useCallback((id: string) => {
    if (pins.includes(id)) return;
    if (pins.length >= MAX_PINS) return;
    const next = [...pins, id];
    setPins(next);
    savePins(next);
  }, [pins]);

  const removePin = useCallback((id: string) => {
    const next = pins.filter(p => p !== id);
    setPins(next);
    savePins(next);
  }, [pins]);

  const allTags = ["All", ...Array.from(new Set(PINNABLE_TOOLS.map(t => t.tag)))];
  const filteredTools = PINNABLE_TOOLS.filter(t =>
    pickerFilter === "All" ? true : t.tag === pickerFilter
  );

  const pinnedTools = pins.map(id => PINNABLE_TOOLS.find(t => t.id === id)).filter(Boolean) as typeof PINNABLE_TOOLS;
  const fullscreenTool = fullscreen ? PINNABLE_TOOLS.find(t => t.id === fullscreen) : null;

  return (
    <div className="flex flex-col h-full min-h-screen bg-muted/30 dark:bg-background">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 pt-6 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workbench</h1>
          <p className="text-white/70 text-sm mt-0.5">Assemble up to {MAX_PINS} tools side by side</p>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setLayout(l => l === "grid" ? "columns" : "grid")}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            title="Toggle layout"
            data-testid="button-toggle-layout"
          >
            {layout === "grid" ? <Columns className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowPicker(s => !s)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
            data-testid="button-add-pane"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Pane
          </button>
        </div>
      </div>

      {showPicker && (
        <div className="border-b border-border bg-card px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              Choose a tool ({pins.length}/{MAX_PINS} pinned)
            </p>
            {pins.length > 0 && (
              <button onClick={() => setShowPicker(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Done
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setPickerFilter(tag)}
                className={cn(
                  "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all border",
                  pickerFilter === tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredTools.map(tool => {
              const pinned = pins.includes(tool.id);
              const full = pins.length >= MAX_PINS && !pinned;
              return (
                <button
                  key={tool.id}
                  onClick={() => pinned ? removePin(tool.id) : addPin(tool.id)}
                  disabled={full}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all",
                    pinned
                      ? "border-primary bg-primary/5 text-primary"
                      : full
                        ? "border-border/40 text-muted-foreground/50 cursor-not-allowed"
                        : "border-border hover:border-primary/40 text-foreground"
                  )}
                  data-testid={`picker-tool-${tool.id}`}
                >
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", TAG_COLORS[tool.tag] ?? "bg-muted text-muted-foreground")}>
                    {tool.tag}
                  </span>
                  <span className="text-xs font-medium truncate">{tool.label}</span>
                  {pinned && <span className="ml-auto text-[10px] text-primary font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fullscreenTool && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
            <span className="font-semibold text-sm">{fullscreenTool.label}</span>
            <Button variant="ghost" size="sm" onClick={() => setFullscreen(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <iframe
            src={fullscreenTool.url}
            className="flex-1 border-0 w-full"
            title={fullscreenTool.label}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      )}

      <div className={cn(
        "flex-1 p-3 pb-24",
        pinnedTools.length === 0 && "flex items-center justify-center"
      )}>
        {pinnedTools.length === 0 ? (
          <div className="text-center py-16">
            <LayoutGrid className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">Your workbench is empty</p>
            <p className="text-sm text-muted-foreground mb-4">Add up to {MAX_PINS} tools to work with them side by side</p>
            <Button onClick={() => setShowPicker(true)} data-testid="button-start-adding">
              <Plus className="w-4 h-4 mr-1.5" /> Add your first tool
            </Button>
          </div>
        ) : (
          <div className={cn(
            "grid gap-3 h-full",
            layout === "grid"
              ? pinnedTools.length <= 2
                ? "grid-cols-1"
                : "grid-cols-2"
              : "grid-cols-1",
            pinnedTools.length >= 3 && layout === "grid" ? "grid-rows-2" : ""
          )} style={{ minHeight: "60vh" }}>
            {pinnedTools.map(tool => (
              <div key={tool.id} className="flex flex-col rounded-2xl border border-border overflow-hidden bg-card shadow-sm" style={{ minHeight: 280 }}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", TAG_COLORS[tool.tag] ?? "bg-muted text-muted-foreground")}>
                      {tool.tag}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{tool.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFullscreen(tool.id)}
                      className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removePin(tool.id)}
                      className="w-6 h-6 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove pane"
                      data-testid={`remove-pane-${tool.id}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <iframe
                  src={tool.url}
                  className="flex-1 border-0 w-full"
                  title={tool.label}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  style={{ minHeight: 240 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
