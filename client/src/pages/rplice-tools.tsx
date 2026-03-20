import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Microscope, ClipboardCheck, Target, Layers, Shield,
  ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  BarChart3, FileText, Plus, Clock, TrendingUp, Activity,
} from "lucide-react";
import type { RpliceAssessment } from "@shared/schema";

const CFIR_DOMAINS = [
  {
    name: "Innovation Characteristics",
    constructs: [
      "Evidence Strength & Quality",
      "Relative Advantage",
      "Adaptability",
      "Trialability",
      "Complexity",
      "Design Quality & Packaging",
      "Cost",
    ],
  },
  {
    name: "Outer Setting",
    constructs: [
      "Cosmopolitanism",
      "Peer Pressure",
      "External Policies & Incentives",
      "Patient/Community Needs & Resources",
    ],
  },
  {
    name: "Inner Setting",
    constructs: [
      "Structural Characteristics",
      "Networks & Communications",
      "Culture",
      "Implementation Climate",
      "Tension for Change",
      "Compatibility",
      "Relative Priority",
      "Organizational Incentives & Rewards",
      "Goals & Feedback",
      "Learning Climate",
      "Leadership Engagement",
      "Available Resources",
      "Access to Knowledge & Information",
      "Readiness for Implementation",
    ],
  },
  {
    name: "Individuals",
    constructs: [
      "Knowledge & Beliefs about the Innovation",
      "Self-efficacy",
      "Individual Stage of Change",
      "Individual Identification with Organization",
      "Other Personal Attributes",
    ],
  },
  {
    name: "Implementation Process",
    constructs: [
      "Planning",
      "Engaging (Opinion Leaders)",
      "Engaging (Champions)",
      "Engaging (External Change Agents)",
      "Executing",
      "Reflecting & Evaluating",
    ],
  },
];

const REAIM_DIMENSIONS = [
  { key: "reach", label: "Reach", description: "Who participated and are they representative of the target population?" },
  { key: "effectiveness", label: "Effectiveness", description: "What was the impact on important outcomes, including quality of life?" },
  { key: "adoption", label: "Adoption", description: "How many settings and staff adopted the intervention?" },
  { key: "implementation", label: "Implementation", description: "Was the intervention delivered as intended and what were costs?" },
  { key: "maintenance", label: "Maintenance", description: "Will effects be sustained over time at individual and organizational levels?" },
];

const FIDELITY_TEMPLATES: Record<string, string[]> = {
  "Workforce Development": [
    "Pre-assessment completed for all participants",
    "Individual service plan created within 5 business days",
    "Weekly check-in calls conducted",
    "Job readiness workshops delivered per curriculum",
    "Employer engagement activities conducted monthly",
    "90-day post-placement follow-up completed",
    "SALP indicators tracked in real-time dashboard",
    "Participant satisfaction surveys administered quarterly",
  ],
  "Youth Prevention": [
    "Evidence-based curriculum delivered with fidelity",
    "Session attendance tracked per participant",
    "Parent engagement component delivered",
    "Peer leadership activities facilitated",
    "Community awareness events conducted",
    "Pre/post assessments administered",
    "Coalition meetings held monthly",
    "Data reported to funder on schedule",
  ],
  "Reentry Support": [
    "Risk-Needs-Responsivity assessment completed at intake",
    "Reentry plan developed within 48 hours of release",
    "Housing secured within 72 hours",
    "Benefits enrollment initiated within first week",
    "Cognitive-behavioral sessions delivered weekly",
    "Employment placement within 30 days",
    "Family reunification support provided",
    "90-day recidivism monitoring completed",
  ],
  "Health & Wellness": [
    "Health screening completed at enrollment",
    "CHW home visits conducted per protocol",
    "Care coordination meetings held bi-weekly",
    "Health education sessions delivered",
    "Social determinants assessment completed",
    "Referral follow-up within 48 hours",
    "Patient satisfaction measured quarterly",
    "Outcome data reported to stakeholders",
  ],
};

function CFIRWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [programName, setProgramName] = useState("");
  const [ratings, setRatings] = useState<Record<string, { rating: number; notes: string; type: string }>>({});
  const [showSummary, setShowSummary] = useState(false);

  const domain = CFIR_DOMAINS[step];
  const totalDomains = CFIR_DOMAINS.length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/rplice/cfir-assessment", {
        programName,
        data: { ratings, domains: CFIR_DOMAINS.map(d => d.name) },
        score: calculateCFIRScore(),
        status: "complete",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rplice/cfir-assessments"] });
      toast({ title: "CFIR Assessment Saved", description: "Your assessment has been recorded." });
      setShowSummary(true);
    },
    onError: () => toast({ title: "Error", description: "Failed to save assessment.", variant: "destructive" }),
  });

  function calculateCFIRScore() {
    const vals = Object.values(ratings);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((acc, v) => acc + v.rating, 0);
    return Math.round((sum / (vals.length * 5)) * 100);
  }

  function getBarrierCount() {
    return Object.values(ratings).filter(r => r.type === "barrier").length;
  }

  function getFacilitatorCount() {
    return Object.values(ratings).filter(r => r.type === "facilitator").length;
  }

  const allConstructs = CFIR_DOMAINS.flatMap(d => d.constructs);
  const progress = Math.round((Object.keys(ratings).length / allConstructs.length) * 100);

  if (showSummary) {
    const score = calculateCFIRScore();
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold" data-testid="text-cfir-summary-title">CFIR Assessment Summary</h3>
            <p className="text-sm text-muted-foreground">{programName}</p>
          </div>
          <Button variant="outline" onClick={() => { setShowSummary(false); setStep(0); setRatings({}); setProgramName(""); }} data-testid="button-cfir-new">
            Start New Assessment
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-primary" data-testid="text-cfir-score">{score}%</p>
              <p className="text-sm text-muted-foreground">Implementation Readiness</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-cfir-facilitators">{getFacilitatorCount()}</p>
              <p className="text-sm text-muted-foreground">Facilitators</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400" data-testid="text-cfir-barriers">{getBarrierCount()}</p>
              <p className="text-sm text-muted-foreground">Barriers</p>
            </CardContent>
          </Card>
        </div>
        {CFIR_DOMAINS.map((domain) => (
          <Card key={domain.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{domain.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {domain.constructs.map((c) => {
                  const r = ratings[c];
                  return (
                    <div key={c} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex-1">{c}</span>
                      {r ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={r.type === "facilitator" ? "default" : "destructive"} className="text-xs">
                            {r.type === "facilitator" ? "Facilitator" : "Barrier"}
                          </Badge>
                          <span className="font-medium w-6 text-center">{r.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not rated</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold" data-testid="text-cfir-wizard-title">CFIR Assessment Wizard</h3>
          <p className="text-sm text-muted-foreground">Consolidated Framework for Implementation Research</p>
        </div>
        <Badge variant="secondary" data-testid="text-cfir-progress">
          Domain {step + 1} of {totalDomains}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label>Program / Intervention Name</Label>
        <Input
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="Enter the program being assessed..."
          data-testid="input-cfir-program-name"
        />
      </div>

      <Progress value={progress} className="h-2" data-testid="progress-cfir" />

      {domain && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" data-testid="text-cfir-domain-name">{domain.name}</CardTitle>
            <CardDescription>Rate each construct as a barrier or facilitator (1=weak, 5=strong)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {domain.constructs.map((construct) => {
              const current = ratings[construct] || { rating: 3, notes: "", type: "facilitator" };
              return (
                <div key={construct} className="space-y-2 border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-medium text-sm">{construct}</span>
                    <Select
                      value={current.type}
                      onValueChange={(v) => setRatings({ ...ratings, [construct]: { ...current, type: v } })}
                    >
                      <SelectTrigger className="w-[140px]" data-testid={`select-cfir-type-${construct.replace(/\s+/g, '-').toLowerCase()}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facilitator">Facilitator</SelectItem>
                        <SelectItem value="barrier">Barrier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-8">1</span>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[current.rating]}
                      onValueChange={([v]) => setRatings({ ...ratings, [construct]: { ...current, rating: v } })}
                      className="flex-1"
                      data-testid={`slider-cfir-${construct.replace(/\s+/g, '-').toLowerCase()}`}
                    />
                    <span className="text-xs text-muted-foreground w-8">5</span>
                    <span className="font-bold text-sm w-8 text-center">{current.rating}</span>
                  </div>
                  <Input
                    placeholder="Notes (optional)"
                    value={current.notes}
                    onChange={(e) => setRatings({ ...ratings, [construct]: { ...current, notes: e.target.value } })}
                    className="text-sm"
                    data-testid={`input-cfir-notes-${construct.replace(/\s+/g, '-').toLowerCase()}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          data-testid="button-cfir-prev"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {step < totalDomains - 1 ? (
          <Button onClick={() => setStep(step + 1)} data-testid="button-cfir-next">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => saveMutation.mutate()} disabled={!programName || saveMutation.isPending} data-testid="button-cfir-submit">
            {saveMutation.isPending ? "Saving..." : "Complete Assessment"}
          </Button>
        )}
      </div>
    </div>
  );
}

function REAIMScorecard() {
  const { toast } = useToast();
  const [programName, setProgramName] = useState("");
  const [scores, setScores] = useState<Record<string, { score: number; notes: string }>>({});
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const composite = calculateComposite();
      await apiRequest("POST", "/api/rplice/reaim-scorecard", {
        programName,
        data: { scores },
        score: composite,
        status: "complete",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rplice/reaim-scorecards"] });
      toast({ title: "RE-AIM Scorecard Saved" });
      setSaved(true);
    },
    onError: () => toast({ title: "Error", description: "Failed to save scorecard.", variant: "destructive" }),
  });

  function calculateComposite() {
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((acc, v) => acc + v.score, 0) / vals.length);
  }

  const composite = calculateComposite();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold" data-testid="text-reaim-title">RE-AIM Scorecard Builder</h3>
          <p className="text-sm text-muted-foreground">Score programs across all 5 RE-AIM dimensions</p>
        </div>
        {saved && (
          <Button variant="outline" onClick={() => { setSaved(false); setScores({}); setProgramName(""); }} data-testid="button-reaim-new">
            New Scorecard
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Program Name</Label>
        <Input
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="Enter program name..."
          data-testid="input-reaim-program-name"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {REAIM_DIMENSIONS.map((dim) => {
          const current = scores[dim.key] || { score: 50, notes: "" };
          return (
            <Card key={dim.key}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">{dim.label}</h4>
                    <p className="text-xs text-muted-foreground">{dim.description}</p>
                  </div>
                  <span className="text-2xl font-bold text-primary" data-testid={`text-reaim-score-${dim.key}`}>
                    {current.score}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[current.score]}
                  onValueChange={([v]) => setScores({ ...scores, [dim.key]: { ...current, score: v } })}
                  data-testid={`slider-reaim-${dim.key}`}
                />
                <Input
                  placeholder="Supporting evidence or notes..."
                  value={current.notes}
                  onChange={(e) => setScores({ ...scores, [dim.key]: { ...current, notes: e.target.value } })}
                  className="text-sm"
                  data-testid={`input-reaim-notes-${dim.key}`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Composite Score</p>
              <p className="text-sm text-muted-foreground">Average across all dimensions</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary" data-testid="text-reaim-composite">{composite}%</p>
              <Badge variant={composite >= 70 ? "default" : composite >= 40 ? "secondary" : "destructive"}>
                {composite >= 70 ? "Strong" : composite >= 40 ? "Moderate" : "Needs Improvement"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={!programName || saveMutation.isPending}
        className="w-full"
        data-testid="button-reaim-save"
      >
        {saveMutation.isPending ? "Saving..." : "Save RE-AIM Scorecard"}
      </Button>
    </div>
  );
}

function FidelityChecklist() {
  const { toast } = useToast();
  const [programName, setProgramName] = useState("");
  const [template, setTemplate] = useState("");
  const [items, setItems] = useState<{ text: string; checked: boolean }[]>([]);
  const [customItem, setCustomItem] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const checkedCount = items.filter(i => i.checked).length;
      const fidelityPct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;
      await apiRequest("POST", "/api/rplice/fidelity-checklist", {
        programName,
        data: { template, items },
        score: fidelityPct,
        status: "complete",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rplice/quality-reviews"] });
      toast({ title: "Fidelity Checklist Saved" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save checklist.", variant: "destructive" }),
  });

  function onTemplateChange(t: string) {
    setTemplate(t);
    const templateItems = FIDELITY_TEMPLATES[t] || [];
    setItems(templateItems.map((text) => ({ text, checked: false })));
  }

  function toggleItem(idx: number) {
    setItems(items.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  }

  function addCustomItem() {
    if (customItem.trim()) {
      setItems([...items, { text: customItem.trim(), checked: false }]);
      setCustomItem("");
    }
  }

  const checkedCount = items.filter(i => i.checked).length;
  const fidelityPct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;
  const belowThreshold = fidelityPct < 80 && items.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold" data-testid="text-fidelity-title">Fidelity Checklist Generator</h3>
        <p className="text-sm text-muted-foreground">Generate SALP-aligned fidelity monitoring checklists</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Program Name</Label>
          <Input
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="Enter program name..."
            data-testid="input-fidelity-program-name"
          />
        </div>
        <div className="space-y-2">
          <Label>Select Template</Label>
          <Select value={template} onValueChange={onTemplateChange}>
            <SelectTrigger data-testid="select-fidelity-template"><SelectValue placeholder="Choose a program type" /></SelectTrigger>
            <SelectContent>
              {Object.keys(FIDELITY_TEMPLATES).map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {items.length > 0 && (
        <>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Fidelity Score</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${belowThreshold ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`} data-testid="text-fidelity-score">
                    {fidelityPct}%
                  </span>
                  {belowThreshold && (
                    <Badge variant="destructive" className="text-xs">Below Threshold</Badge>
                  )}
                </div>
              </div>
              <Progress value={fidelityPct} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(idx)}
                    data-testid={`checkbox-fidelity-${idx}`}
                  />
                  <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                    {item.text}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Input
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  placeholder="Add custom checklist item..."
                  className="flex-1 text-sm"
                  data-testid="input-fidelity-custom"
                  onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
                />
                <Button size="sm" onClick={addCustomItem} data-testid="button-fidelity-add-item">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {belowThreshold && (
            <Card className="border-red-300 dark:border-red-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-red-700 dark:text-red-400">Fidelity Below 80% Threshold</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This program's fidelity score is below the MAP-GAP CQI threshold. Consider initiating a quality improvement cycle to address implementation gaps.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild data-testid="link-fidelity-cqi">
                      <a href="/cqi">Open MAP-GAP CQI</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!programName || saveMutation.isPending}
            className="w-full"
            data-testid="button-fidelity-save"
          >
            {saveMutation.isPending ? "Saving..." : "Save Fidelity Checklist"}
          </Button>
        </>
      )}
    </div>
  );
}

function ThreeRealitiesDiagnostic() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [programName, setProgramName] = useState("");
  const [research, setResearch] = useState({ findings: "", evidence: "", gaps: "" });
  const [political, setPolitical] = useState({ regulations: "", funding: "", stakeholders: "" });
  const [ground, setGround] = useState({ community: "", barriers: "", assets: "" });
  const [tensions, setTensions] = useState("");
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/rplice/three-realities", {
        programName,
        data: { research, political, ground, tensions },
        status: "complete",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rplice/quality-reviews"] });
      toast({ title: "Three Realities Diagnostic Saved" });
      setSaved(true);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const steps = [
    {
      title: "Research Reality",
      subtitle: "What does the evidence say?",
      icon: Microscope,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Key Research Findings</Label>
            <Textarea value={research.findings} onChange={(e) => setResearch({ ...research, findings: e.target.value })} placeholder="What does the research literature say about this intervention?" data-testid="input-3r-research-findings" />
          </div>
          <div>
            <Label>Evidence Base</Label>
            <Textarea value={research.evidence} onChange={(e) => setResearch({ ...research, evidence: e.target.value })} placeholder="What evidence-based practices are relevant?" data-testid="input-3r-research-evidence" />
          </div>
          <div>
            <Label>Research Gaps</Label>
            <Textarea value={research.gaps} onChange={(e) => setResearch({ ...research, gaps: e.target.value })} placeholder="What doesn't the research address?" data-testid="input-3r-research-gaps" />
          </div>
        </div>
      ),
    },
    {
      title: "Political Reality",
      subtitle: "What do regulations and politics allow?",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Regulatory Landscape</Label>
            <Textarea value={political.regulations} onChange={(e) => setPolitical({ ...political, regulations: e.target.value })} placeholder="What regulations, policies, or mandates apply?" data-testid="input-3r-political-regulations" />
          </div>
          <div>
            <Label>Funding Constraints</Label>
            <Textarea value={political.funding} onChange={(e) => setPolitical({ ...political, funding: e.target.value })} placeholder="What funding sources and their requirements?" data-testid="input-3r-political-funding" />
          </div>
          <div>
            <Label>Stakeholder Dynamics</Label>
            <Textarea value={political.stakeholders} onChange={(e) => setPolitical({ ...political, stakeholders: e.target.value })} placeholder="Who has power/influence and what are their positions?" data-testid="input-3r-political-stakeholders" />
          </div>
        </div>
      ),
    },
    {
      title: "Ground Reality",
      subtitle: "What actually works in this community?",
      icon: Target,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Community Context</Label>
            <Textarea value={ground.community} onChange={(e) => setGround({ ...ground, community: e.target.value })} placeholder="What are the cultural, demographic, and social characteristics?" data-testid="input-3r-ground-community" />
          </div>
          <div>
            <Label>Practical Barriers</Label>
            <Textarea value={ground.barriers} onChange={(e) => setGround({ ...ground, barriers: e.target.value })} placeholder="What barriers exist on the ground (transportation, access, trust)?" data-testid="input-3r-ground-barriers" />
          </div>
          <div>
            <Label>Community Assets</Label>
            <Textarea value={ground.assets} onChange={(e) => setGround({ ...ground, assets: e.target.value })} placeholder="What existing strengths and resources can be leveraged?" data-testid="input-3r-ground-assets" />
          </div>
        </div>
      ),
    },
    {
      title: "Tensions & Adaptations",
      subtitle: "Where do the three realities conflict?",
      icon: Layers,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Identified Tensions</Label>
            <Textarea value={tensions} onChange={(e) => setTensions(e.target.value)} placeholder="Where does research conflict with political reality or ground truth? What adaptations are needed?" rows={6} data-testid="input-3r-tensions" />
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  if (saved) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold" data-testid="text-3r-saved">Three Realities Diagnostic Saved</h3>
            <p className="text-sm text-muted-foreground mt-1">{programName}</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSaved(false); setStep(0); setProgramName(""); setResearch({ findings: "", evidence: "", gaps: "" }); setPolitical({ regulations: "", funding: "", stakeholders: "" }); setGround({ community: "", barriers: "", assets: "" }); setTensions(""); }} data-testid="button-3r-new">
              Start New Diagnostic
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold" data-testid="text-3r-title">Three Realities Diagnostic</h3>
        <p className="text-sm text-muted-foreground">Analyze Research, Political, and Ground realities for any intervention</p>
      </div>

      <div className="space-y-2">
        <Label>Intervention / Program Name</Label>
        <Input value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="Enter program name..." data-testid="input-3r-program-name" />
      </div>

      <div className="flex items-center gap-1" data-testid="steps-3r">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i < step ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              i === step ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {i < step && <CheckCircle2 className="h-3 w-3" />}
              {s.title.split(" ")[0]}
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>{currentStep.content}</CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} data-testid="button-3r-prev">
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} data-testid="button-3r-next">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => saveMutation.mutate()} disabled={!programName || saveMutation.isPending} data-testid="button-3r-submit">
            {saveMutation.isPending ? "Saving..." : "Complete Diagnostic"}
          </Button>
        )}
      </div>
    </div>
  );
}

function QualityGateDashboard() {
  const { toast } = useToast();
  const { data: rawReviews, isLoading } = useQuery<RpliceAssessment[]>({ queryKey: ["/api/rplice/quality-reviews"] });
  const reviews = rawReviews ?? [];

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("POST", `/api/rplice/quality-reviews/${id}/resolve`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rplice/quality-reviews"] });
      toast({ title: "Review Updated" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const pending = reviews.filter(r => r.status === "draft");
  const completed = reviews.filter(r => r.status !== "draft");

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold" data-testid="text-quality-title">Quality Gate Dashboard</h3>
        <p className="text-sm text-muted-foreground">Review and approve pending RPLICE quality reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-primary" data-testid="text-quality-total">{reviews.length}</p>
            <p className="text-sm text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-quality-pending">{pending.length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-quality-completed">{completed.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quality reviews yet. Assessments will appear here when created.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} data-testid={`card-review-${review.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium text-sm" data-testid={`text-review-program-${review.id}`}>{review.programName}</h4>
                      <Badge variant="secondary" className="text-xs">{review.assessmentType.toUpperCase()}</Badge>
                      <Badge variant={review.status === "draft" ? "destructive" : "default"} className="text-xs">
                        {review.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {review.score && <span>Score: <strong>{review.score}%</strong></span>}
                      <span>Created: {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>
                  {review.status === "draft" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => resolveMutation.mutate({ id: review.id, status: "complete" })}
                        disabled={resolveMutation.isPending}
                        data-testid={`button-approve-${review.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveMutation.mutate({ id: review.id, status: "rejected" })}
                        disabled={resolveMutation.isPending}
                        data-testid={`button-reject-${review.id}`}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RpliceToolsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">RPLICE Implementation Science Toolkit</h1>
        <p className="text-muted-foreground">
          Research-Practice Linkage for Implementation, Compliance, and Evaluation
        </p>
      </div>

      <Tabs defaultValue="cfir" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="cfir" data-testid="tab-cfir">
            <Microscope className="h-4 w-4 mr-1.5" /> CFIR Assessment
          </TabsTrigger>
          <TabsTrigger value="reaim" data-testid="tab-reaim">
            <BarChart3 className="h-4 w-4 mr-1.5" /> RE-AIM Scorecard
          </TabsTrigger>
          <TabsTrigger value="fidelity" data-testid="tab-fidelity">
            <ClipboardCheck className="h-4 w-4 mr-1.5" /> Fidelity Checklist
          </TabsTrigger>
          <TabsTrigger value="three-realities" data-testid="tab-three-realities">
            <Layers className="h-4 w-4 mr-1.5" /> Three Realities
          </TabsTrigger>
          <TabsTrigger value="quality" data-testid="tab-quality">
            <Shield className="h-4 w-4 mr-1.5" /> Quality Gate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cfir"><CFIRWizard /></TabsContent>
        <TabsContent value="reaim"><REAIMScorecard /></TabsContent>
        <TabsContent value="fidelity"><FidelityChecklist /></TabsContent>
        <TabsContent value="three-realities"><ThreeRealitiesDiagnostic /></TabsContent>
        <TabsContent value="quality"><QualityGateDashboard /></TabsContent>
      </Tabs>
    </div>
  );
}
