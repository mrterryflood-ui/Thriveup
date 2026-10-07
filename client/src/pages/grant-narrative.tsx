import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveStatusPill } from "@/components/autosave-status";
import { PillarFlowNav } from "@/components/dfc-cross-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Sparkles, Copy, Download, ChevronDown, ChevronUp,
  BarChart3, Users, Clock, Target, Award, BookOpen, Briefcase
} from "lucide-react";

const GRANT_TYPES = [
  {
    id: "WIOA",
    label: "WIOA Title I Youth",
    description: "Workforce Innovation & Opportunity Act — Youth workforce development, career pathways, digital literacy",
    icon: Briefcase,
    color: "bg-blue-600",
    sections: ["Program Overview", "Statement of Need", "Program Design", "Workforce Development Strategy", "Performance Outcomes", "Sustainability Plan"],
    requirements: [
      "14 required youth program elements",
      "75% out-of-school youth expenditure",
      "20% work experience expenditure",
      "Performance accountability measures",
      "Local Workforce Development Board coordination",
    ],
  },
  {
    id: "OJJDP",
    label: "OJJDP Second Chance Act",
    description: "Office of Juvenile Justice — Reentry support, recidivism reduction, case management, community reintegration",
    icon: Target,
    color: "bg-violet-600",
    sections: ["Program Overview", "Statement of Need", "Program Design", "Reentry Strategy", "Recidivism Reduction Plan", "Community Partnerships"],
    requirements: [
      "DOJ Performance Measurement Tool (PMT) alignment",
      "Evidence-based intervention model",
      "Risk/needs assessment protocol",
      "Transition planning from secure settings",
      "12-month post-release follow-up plan",
    ],
  },
  {
    id: "SAMHSA",
    label: "SAMHSA Community Mental Health",
    description: "Substance Abuse & Mental Health Services — Behavioral health, trauma-informed care, whole-child support",
    icon: Award,
    color: "bg-emerald-600",
    sections: ["Program Overview", "Statement of Need", "Program Design", "Behavioral Health Integration", "Trauma-Informed Approach", "Cultural Competency"],
    requirements: [
      "SAMHSA Strategic Prevention Framework",
      "Evidence-based behavioral health model",
      "Cultural competency and health equity plan",
      "Trauma-informed care integration",
      "Sustainability and community capacity building",
    ],
  },
];

interface NarrativeResult {
  narrative: string;
  grantType: string;
  section: string;
  metrics: {
    participants: number;
    services: number;
    serviceHours: number;
    outcomes: number;
    boardMembers: number;
  };
}

interface PlatformMetrics {
  totalParticipants: number;
  activeParticipants: number;
  totalServices: number;
  totalServiceHours: number;
  totalOutcomes: number;
  outcomesByCategory: Record<string, number>;
}

const POSITIONING_LANGUAGE = [
  {
    key: "Mission",
    icon: BookOpen,
    value: "ThriveUp empowers justice-impacted and opportunity youth through a technology-enabled, three-pillar framework that moves participants from Relief through Stabilization to Community Contribution.",
  },
  {
    key: "Differentiator",
    icon: Sparkles,
    value: "Unlike traditional workforce programs, ThriveUp integrates AI-powered career exploration, behavioral health screening, and real-time outcome tracking into a single platform, ensuring every participant receives holistic, data-driven support.",
  },
  {
    key: "Evidence Base",
    icon: BarChart3,
    value: "The platform's six-domain Thrive scoring system, aligned with DOJ Performance Measurement Tool requirements, enables continuous progress monitoring and evidence-based intervention adjustment across cognitive, social-emotional, behavioral, educational, career, and health domains.",
  },
  {
    key: "Community Voice",
    icon: Users,
    value: "Our Community Advisory Board, composed of individuals with lived experience, community leaders, and partner agency representatives, ensures program design reflects the authentic needs and aspirations of the communities we serve.",
  },
  {
    key: "Three Entities",
    icon: Target,
    value: "The Collaborative Advocate Foundation (TCAF) — an IRS-determined 501(c)(3), SAM.gov Active (CAGE 209N1) — holds direct grant eligibility and grant compliance. ThriveUp delivers direct youth services. The Minority Center of Excellence manages contracting and employer partnerships, creating a unified ecosystem of support.",
  },
  {
    key: "Outcomes Framework",
    icon: Award,
    value: "Our outcomes framework tracks WIOA common measures, DOJ PMT indicators, and SAMHSA GPRA metrics through an integrated data platform that enables real-time performance monitoring and continuous quality improvement.",
  },
];

export default function GrantNarrativePage() {
  const { toast } = useToast();
  const [selectedGrant, setSelectedGrant] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("Program Overview");
  const [narratives, setNarratives] = useState<NarrativeResult[]>([]);
  const [customContext, setCustomContext] = useState("");
  const [expandedNarrative, setExpandedNarrative] = useState<number | null>(null);

  // Autosave all generated narratives + selections so a navigate-away
  // doesn't blow away hours of AI-generated drafting work.
  const autosave = useAutosave<{
    selectedGrant: string | null;
    selectedSection: string;
    customContext: string;
    narratives: NarrativeResult[];
  }>({
    editorKind: "grant_narrative",
    // Per-grant scope: each grant has its own draft slot so switching
    // grants doesn't clobber another grant's narratives. Falls back to
    // "default" when no grant is selected yet.
    scopeKey: selectedGrant || "default",
    value: { selectedGrant, selectedSection, customContext, narratives },
    onHydrate: (saved) => {
      if (saved?.selectedGrant) setSelectedGrant(saved.selectedGrant);
      if (saved?.selectedSection) setSelectedSection(saved.selectedSection);
      if (saved?.customContext) setCustomContext(saved.customContext);
      if (Array.isArray(saved?.narratives)) setNarratives(saved.narratives);
    },
    shouldSave: (v) => v.narratives.length > 0 || v.customContext.length > 0 || !!v.selectedGrant,
  });

  const { data: platformData, isLoading: metricsLoading } = useQuery<PlatformMetrics>({
    queryKey: ["/api/logic-model/data"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { grantType: string; section: string; context?: string }) => {
      const res = await apiRequest("POST", "/api/grant-narrative/generate", data);
      return res.json() as Promise<NarrativeResult>;
    },
    onSuccess: (result) => {
      setNarratives((prev) => [result, ...prev]);
      setExpandedNarrative(0);
      toast({ title: "Narrative section generated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to generate narrative. Please try again.", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!selectedGrant) return;
    generateMutation.mutate({
      grantType: selectedGrant,
      section: selectedSection,
      context: customContext || undefined,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = (result: NarrativeResult) => {
    const content = `${result.grantType} Grant Narrative — ${result.section}\n\nGenerated by ThriveUp Grant Engine\n\n${result.narrative}\n\n---\nPlatform Metrics:\n- Participants Served: ${result.metrics.participants}\n- Service Encounters: ${result.metrics.services}\n- Service Hours: ${result.metrics.serviceHours}\n- Outcomes Tracked: ${result.metrics.outcomes}\n- Advisory Board Members: ${result.metrics.boardMembers}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.grantType}_${result.section.replace(/\s+/g, "_")}_Narrative.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (narratives.length === 0) return;
    const content = narratives
      .map((r) => `=== ${r.grantType}: ${r.section} ===\n\n${r.narrative}\n`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ThriveUp_Grant_Narratives_Package.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentGrant = GRANT_TYPES.find((g) => g.id === selectedGrant);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-narrative-title">Grant Narrative Builder</h1>
          <p className="text-muted-foreground mt-1">Generate grant-ready narrative sections with real platform data and positioning language</p>
          <div className="mt-2">
            <AutosaveStatusPill status={autosave.status} lastSavedAt={autosave.lastSavedAt} />
          </div>
        </div>
        {narratives.length > 0 && (
          <Button variant="outline" onClick={handleDownloadAll} data-testid="button-download-all">
            <Download className="mr-2 h-4 w-4" /> Download All ({narratives.length})
          </Button>
        )}
      </div>

      {metricsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-3 text-center">
              <Skeleton className="h-7 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </Card>
          ))}
        </div>
      ) : platformData ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center" data-testid="stat-narrative-participants">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users className="h-4 w-4 text-indigo-600" />
              <p className="text-xl font-bold text-indigo-600">{platformData.totalParticipants.toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground">Participants Enrolled</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-narrative-active">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Target className="h-4 w-4 text-violet-600" />
              <p className="text-xl font-bold text-violet-600">{platformData.activeParticipants.toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground">Currently Active</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-narrative-services">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <p className="text-xl font-bold text-blue-600">{platformData.totalServices.toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground">Service Encounters</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-narrative-hours">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-4 w-4 text-emerald-600" />
              <p className="text-xl font-bold text-emerald-600">{platformData.totalServiceHours.toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground">Service Hours</p>
          </Card>
          <Card className="p-3 text-center" data-testid="stat-narrative-outcomes">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Award className="h-4 w-4 text-amber-600" />
              <p className="text-xl font-bold text-amber-600">{platformData.totalOutcomes.toLocaleString()}</p>
            </div>
            <p className="text-xs text-muted-foreground">Outcomes Tracked</p>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GRANT_TYPES.map((grant) => {
          const Icon = grant.icon;
          const isSelected = selectedGrant === grant.id;
          return (
            <button
              key={grant.id}
              onClick={() => {
                setSelectedGrant(grant.id);
                setSelectedSection(grant.sections[0]);
              }}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
              data-testid={`button-grant-${grant.id.toLowerCase()}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`${grant.color} rounded-md p-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold">{grant.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{grant.description}</p>
              <div className="space-y-1">
                {grant.requirements.slice(0, isSelected ? grant.requirements.length : 2).map((req) => (
                  <div key={req} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    <span>{req}</span>
                  </div>
                ))}
                {!isSelected && grant.requirements.length > 2 && (
                  <p className="text-xs text-primary ml-4.5">+{grant.requirements.length - 2} more requirements</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {currentGrant && (
        <Card className="p-5" data-testid="card-section-selector">
          <h2 className="font-semibold text-lg mb-1">{currentGrant.label} — Section Builder</h2>
          <p className="text-sm text-muted-foreground mb-3">Select a narrative section to generate, then optionally provide additional context</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentGrant.sections.map((section) => (
              <Button
                key={section}
                variant={selectedSection === section ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSection(section)}
                data-testid={`button-section-${section.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {section}
              </Button>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">Additional Context (optional)</label>
            <Textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              className="resize-none text-sm"
              rows={3}
              data-testid="input-custom-context"
            />
            <p className="text-xs text-muted-foreground mt-1">Add local data points, partner names, or specific requirements to strengthen the narrative</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              data-testid="button-generate-narrative"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generateMutation.isPending ? "Generating..." : "Generate Narrative"}
            </Button>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{currentGrant.label}</span> — <span className="font-medium">{selectedSection}</span>
            </p>
          </div>
        </Card>
      )}

      {narratives.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Generated Narratives ({narratives.length})</h2>
          {narratives.map((result, idx) => {
            const grant = GRANT_TYPES.find((g) => g.id === result.grantType);
            const isExpanded = expandedNarrative === idx;
            return (
              <Card key={idx} className="p-5" data-testid={`card-narrative-${idx}`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={grant?.color}>{result.grantType}</Badge>
                    <span className="font-medium text-sm">{result.section}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setExpandedNarrative(isExpanded ? null : idx)} data-testid={`button-toggle-${idx}`}>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(result.narrative)} data-testid={`button-copy-${idx}`}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(result)} data-testid={`button-download-${idx}`}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </div>
                </div>
                <div className={`prose prose-sm dark:prose-invert max-w-none ${!isExpanded ? "max-h-40 overflow-hidden relative" : ""}`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.narrative}</p>
                  {!isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
                  )}
                </div>
                {isExpanded && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="font-bold text-foreground">{result.metrics.participants.toLocaleString()}</p>
                      <p className="text-muted-foreground">Participants</p>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="font-bold text-foreground">{result.metrics.services.toLocaleString()}</p>
                      <p className="text-muted-foreground">Services</p>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="font-bold text-foreground">{result.metrics.serviceHours.toLocaleString()}</p>
                      <p className="text-muted-foreground">Hours</p>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="font-bold text-foreground">{result.metrics.outcomes.toLocaleString()}</p>
                      <p className="text-muted-foreground">Outcomes</p>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="font-bold text-foreground">{result.metrics.boardMembers.toLocaleString()}</p>
                      <p className="text-muted-foreground">Board Members</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-5" data-testid="card-positioning-language">
        <h2 className="font-semibold text-lg mb-1">Positioning Language Reference</h2>
        <p className="text-sm text-muted-foreground mb-4">Pre-approved messaging for grant applications — click any block to copy</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {POSITIONING_LANGUAGE.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className="p-3 bg-muted rounded-lg text-left hover-elevate"
                onClick={() => handleCopy(item.value)}
                data-testid={`button-copy-positioning-${item.key.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-medium">{item.key}</p>
                </div>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5" data-testid="card-entity-structure">
        <h2 className="font-semibold text-lg mb-3">Three-Entity Organizational Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">The Collaborative Advocate LLC</h3>
            <p className="text-xs font-medium text-muted-foreground mb-2">Grant Applicant of Record & Compliance</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Grant application and management</li>
              <li>Financial oversight and reporting</li>
              <li>Regulatory compliance</li>
              <li>Interagency coordination</li>
              <li>Policy and advocacy</li>
            </ul>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">ThriveUp</h3>
            <p className="text-xs font-medium text-muted-foreground mb-2">Direct Youth Services & Programs</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Youth enrollment and case management</li>
              <li>Career pathway and workforce training</li>
              <li>Behavioral health integration</li>
              <li>AI-powered digital literacy curriculum</li>
              <li>Community advisory board facilitation</li>
            </ul>
          </div>
          <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
            <h3 className="font-semibold text-violet-700 dark:text-violet-400 mb-1">Minority Center of Excellence</h3>
            <p className="text-xs font-medium text-muted-foreground mb-2">Contracting & Employer Partnerships</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Employer partnership development</li>
              <li>Government contracting support</li>
              <li>Small business certification</li>
              <li>Workforce pipeline coordination</li>
              <li>Economic development strategy</li>
            </ul>
          </div>
        </div>
      </Card>

      <PillarFlowNav currentStep="narrative" />
    </div>
  );
}
