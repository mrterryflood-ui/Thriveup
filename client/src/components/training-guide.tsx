import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BookOpen, X, Minus, Download, FileText, ChevronRight, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { getGuideForModule, generateFullManual, generateModuleManual } from "@/lib/guide-data";
import type { GuideSection } from "@/lib/guide-data";

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const MODULE_ROUTES: Record<string, string> = {
  "ecosystem-ops-center": "/ops-center",
  "peer-review": "/peer-review",
  "ecosystem-connector": "/ecosystem",
  "directive-compliance": "/directive-compliance",
  "grant-hub": "/grants",
  "program-engine": "/program-engine",
  "pm-academy": "/pm-academy",
  "workforce-dashboard": "/workforce",
  "reentry-dashboard": "/reentry",
  "program-designer": "/program-designer",
  "program-lifecycle": "/program-lifecycle",
  "program-management": "/program-management",
  "chw-dashboard": "/chw-dashboard",
  "health-wellness": "/health-wellness",
  "community-map": "/community-map",
  "prevention": "/prevention",
  "resource-finder": "/resources",
  "impact": "/impact",
  "intake-wizard": "/intake",
  "workforce-training": "/workforce-training",
  "workforce-assessment": "/workforce-assessment",
  "workforce-employers": "/workforce-employers",
  "dashboard": "/dashboard",
  "academy-admin": "/academy-admin",
  "academy-pathway": "/academy-pathway",
  "academy-careers": "/academy-careers",
  "academy-financial-literacy": "/financial-literacy",
  "ai-workforce": "/ai-workforce",
  "ai-consulting": "/ai-consulting",
  "research-hub": "/research",
  "map-gap-cqi": "/cqi",
  "mapgap-framework": "/mapgap-framework",
  "transparency-dashboard": "/transparency",
  "coalition": "/coalition",
  "case-studies": "/case-studies",
  "third-spaces": "/third-spaces",
  "voices-of-austin": "/voices",
  "cohort-onboarding": "/cohort-onboarding",
  "outcome-reporting": "/outcome-reporting",
  "austin-housing-initiative": "/austin",
  "manor-community-hub": "/manor",
  "pflugerville-community-hub": "/pflugerville",
  "ecosystem-hub": "/ecosystem-hub",
};

interface SectionTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function SectionTab({ label, active, onClick }: SectionTabProps) {
  return (
    <button
      onClick={onClick}
      data-testid={`guide-tab-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );
}

function GuideOverlay({ guide, onClose, onMinimize }: { guide: GuideSection; onClose: () => void; onMinimize: () => void }) {
  const [activeSection, setActiveSection] = useState("story");
  const [, setLocation] = useLocation();

  const sections = [
    { id: "story", label: "The Story" },
    { id: "purpose", label: "Purpose" },
    { id: "manual", label: "User Manual" },
    { id: "sop", label: "SOP" },
    { id: "flow", label: "Logical Flow" },
    { id: "next", label: "What To Do Next" },
    { id: "technical", label: "Technical Reference" },
  ];

  function handleNavigate(moduleId: string) {
    const route = MODULE_ROUTES[moduleId];
    if (route) {
      setLocation(route);
    }
  }

  function handleDownloadModule() {
    const content = generateModuleManual(guide.moduleId);
    if (content) {
      downloadTextFile(content, `${guide.moduleName.replace(/\s+/g, "-")}-Manual.txt`);
    }
  }

  function handleDownloadFull() {
    const content = generateFullManual();
    downloadTextFile(content, "ThriveUp-Complete-Operations-Manual.txt");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="guide-overlay">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{guide.moduleName}</h2>
              <p className="text-xs text-muted-foreground">Training Guide & Operations Manual</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMinimize} data-testid="guide-minimize">
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} data-testid="guide-close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 px-5 py-2 border-b border-border overflow-x-auto">
          {sections.map(s => (
            <SectionTab key={s.id} label={s.label} active={activeSection === s.id} onClick={() => setActiveSection(s.id)} />
          ))}
        </div>

        <ScrollArea className="flex-1 px-5 py-4">
          {activeSection === "story" && (
            <div className="space-y-3" data-testid="guide-section-story">
              <h3 className="font-semibold text-lg">The Story</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{guide.story}</p>
            </div>
          )}

          {activeSection === "purpose" && (
            <div className="space-y-3" data-testid="guide-section-purpose">
              <h3 className="font-semibold text-lg">Purpose</h3>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium">{guide.purpose}</p>
              </div>
            </div>
          )}

          {activeSection === "manual" && (
            <div className="space-y-3" data-testid="guide-section-manual">
              <h3 className="font-semibold text-lg">User Manual</h3>
              <div className="space-y-2">
                {guide.userManual.map(step => (
                  <div key={step.step} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{step.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "sop" && (
            <div className="space-y-4" data-testid="guide-section-sop">
              <h3 className="font-semibold text-lg">Standard Operating Procedure</h3>
              <div className="grid gap-3">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">When To Use</p>
                  <p className="text-sm">{guide.sop.when}</p>
                </div>
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Frequency</p>
                  <p className="text-sm">{guide.sop.frequency}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Badge variant="outline" className="mb-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">Before Operations</Badge>
                  <ul className="space-y-1">
                    {guide.sop.before.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">During Operations</Badge>
                  <ul className="space-y-1">
                    {guide.sop.during.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">After Operations</Badge>
                  <ul className="space-y-1">
                    {guide.sop.after.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === "flow" && (
            <div className="space-y-3" data-testid="guide-section-flow">
              <h3 className="font-semibold text-lg">Logical Flow — What To Do</h3>
              <div className="space-y-1">
                {guide.logicalFlow.map((step, i) => (
                  <div key={step.step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-foreground">{step.step}</span>
                      </div>
                      {i < guide.logicalFlow.length - 1 && (
                        <div className="w-0.5 h-6 bg-primary/20" />
                      )}
                    </div>
                    <div className="pt-1 pb-4">
                      <p className="text-sm font-semibold">{step.action}</p>
                      <p className="text-xs text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "next" && (
            <div className="space-y-3" data-testid="guide-section-next">
              <h3 className="font-semibold text-lg">What To Do Next</h3>
              <div className="space-y-2">
                {guide.whatToDoNext.map(next => (
                  <button
                    key={next.moduleId}
                    onClick={() => handleNavigate(next.moduleId)}
                    data-testid={`guide-navigate-${next.moduleId}`}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group"
                  >
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{next.label}</p>
                      <p className="text-xs text-muted-foreground">{next.reason}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === "technical" && (
            <div className="space-y-4" data-testid="guide-section-technical">
              <h3 className="font-semibold text-lg">Technical Reference</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Data Sources</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.technicalReference.dataSources.map((ds, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{ds}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Standards</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.technicalReference.standards.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Protocols</p>
                  <ul className="space-y-1">
                    {guide.technicalReference.protocols.map((p, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center gap-2 px-5 py-3 border-t border-border bg-muted/20 rounded-b-xl">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleDownloadModule} data-testid="guide-download-module">
            <Download className="h-3.5 w-3.5" />
            Download Manual
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleDownloadFull} data-testid="guide-download-full">
            <FileText className="h-3.5 w-3.5" />
            Full Manual ({Object.keys(MODULE_ROUTES).length} Modules)
          </Button>
        </div>
      </div>
    </div>
  );
}

function MinimizedPill({ moduleName, onRestore }: { moduleName: string; onRestore: () => void }) {
  return (
    <button
      onClick={onRestore}
      data-testid="guide-pill-restore"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
    >
      <BookOpen className="h-4 w-4" />
      <span className="text-sm font-medium">{moduleName} Guide</span>
    </button>
  );
}

export function TrainingGuideButton({ moduleId }: { moduleId: string }) {
  const guide = getGuideForModule(moduleId);
  if (!guide) return null;

  return <TrainingGuideButtonInner guide={guide} />;
}

function TrainingGuideButtonInner({ guide }: { guide: GuideSection }) {
  const [state, setState] = useState<"closed" | "open" | "minimized">("closed");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-xs"
        onClick={() => setState("open")}
        data-testid="guide-open-button"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Guide & Manual
      </Button>

      {state === "open" && (
        <GuideOverlay
          guide={guide}
          onClose={() => setState("closed")}
          onMinimize={() => setState("minimized")}
        />
      )}

      {state === "minimized" && (
        <MinimizedPill
          moduleName={guide.moduleName}
          onRestore={() => setState("open")}
        />
      )}
    </>
  );
}
