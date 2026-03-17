import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import {
  Shield, BookOpen, ChevronRight, CheckCircle2, Users, Target,
  ExternalLink, Layers, BarChart3, Settings, Activity, Globe,
  Briefcase, Heart, Scale, Zap, Megaphone, Building2,
} from "lucide-react";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import type { EvidenceBasedProgram, EbpImplementation, EnvironmentalStrategy, CfirAssessment } from "@shared/schema";

interface DashboardData {
  totalPrograms: number;
  totalImplementations: number;
  totalStrategies: number;
  totalCfirAssessments: number;
}

interface StrategyCategory {
  key: string;
  label: string;
}

const EVIDENCE_LEVELS: Record<string, { label: string; color: string }> = {
  strong: { label: "Strong Evidence", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  promising: { label: "Promising", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  emerging: { label: "Emerging", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
};

const IMPL_STAGES: Record<string, { label: string; color: string }> = {
  exploration: { label: "Exploration", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300" },
  preparation: { label: "Preparation", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  implementation: { label: "Implementation", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  sustainment: { label: "Sustainment", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

const STAKEHOLDER_LABELS: Record<string, string> = {
  youth: "Youth",
  parents: "Parents",
  educators: "Educators",
  veterans: "Veterans",
  returning_citizens: "Returning Citizens",
  neurodivergent: "Neurodivergent",
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  access_availability: Shield,
  social_norms: Users,
  policy_enforcement: Scale,
  community_design: Building2,
  economic_incentives: Briefcase,
  media_advocacy: Megaphone,
  coalition_capacity: Layers,
};

function ProgramCard({ program, onSelect }: { program: EvidenceBasedProgram; onSelect: (id: string) => void }) {
  const ev = EVIDENCE_LEVELS[program.evidenceLevel] || EVIDENCE_LEVELS.emerging;
  const stakeholderFit = (program.stakeholderFit as Record<string, boolean>) || {};
  const fittingStakeholders = Object.entries(stakeholderFit).filter(([, v]) => v).map(([k]) => STAKEHOLDER_LABELS[k] || k);

  return (
    <Card className="p-4" data-testid={`card-program-${program.id}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-md p-2 bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" data-testid={`text-program-name-${program.id}`}>{program.name}</h3>
          {program.acronym && <span className="text-xs text-muted-foreground">({program.acronym})</span>}
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Badge className={`text-[10px] ${ev.color}`}>{ev.label}</Badge>
        <Badge variant="secondary" className="text-[10px]">{program.ageRange}</Badge>
        <Badge variant="outline" className="text-[10px]">{program.targetPopulation}</Badge>
      </div>
      {fittingStakeholders.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-3">
          <span className="text-[10px] text-muted-foreground mr-1">Fits:</span>
          {fittingStakeholders.map(s => (
            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        {program.costEstimate && <span className="text-xs text-muted-foreground">{program.costEstimate}</span>}
        <Button size="sm" onClick={() => onSelect(program.id)} data-testid={`button-view-program-${program.id}`}>
          Details <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function ProgramDetail({ program, onBack }: { program: EvidenceBasedProgram; onBack: () => void }) {
  const ev = EVIDENCE_LEVELS[program.evidenceLevel] || EVIDENCE_LEVELS.emerging;
  const outcomes = (program.outcomesDemo as string[]) || [];
  const stakeholderFit = (program.stakeholderFit as Record<string, boolean>) || {};

  return (
    <div className="max-w-3xl mx-auto" data-testid="section-program-detail">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4" data-testid="button-back-programs">
        <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Back to Registry
      </Button>
      <h2 className="text-xl font-bold mb-1" data-testid="text-program-detail-name">{program.name}</h2>
      {program.acronym && <p className="text-sm text-muted-foreground mb-4">({program.acronym})</p>}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Badge className={ev.color}>{ev.label}</Badge>
        <Badge variant="secondary">{program.ageRange}</Badge>
        {program.registrySource && <Badge variant="outline" className="text-[10px]">{program.registrySource}</Badge>}
      </div>
      <Card className="p-4 mb-4" data-testid="card-program-description">
        <p className="text-sm leading-relaxed">{program.description}</p>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="p-4" data-testid="card-program-target">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500" /> Target Population</h3>
          <p className="text-sm">{program.targetPopulation}</p>
        </Card>
        <Card className="p-4" data-testid="card-program-cost">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4 text-indigo-500" /> Cost Estimate</h3>
          <p className="text-sm">{program.costEstimate || "Not specified"}</p>
        </Card>
      </div>
      {outcomes.length > 0 && (
        <Card className="p-4 mb-4" data-testid="card-program-outcomes">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-emerald-500" /> Demonstrated Outcomes</h3>
          <ul className="space-y-1">
            {outcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-outcome-${i}`}>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" /><span>{o}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {program.implementationReqs && (
          <Card className="p-4" data-testid="card-program-reqs">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Settings className="h-4 w-4 text-amber-500" /> Implementation Requirements</h3>
            <p className="text-sm">{program.implementationReqs}</p>
          </Card>
        )}
        {program.fidelityMeasures && (
          <Card className="p-4" data-testid="card-program-fidelity">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-blue-500" /> Fidelity Measures</h3>
            <p className="text-sm">{program.fidelityMeasures}</p>
          </Card>
        )}
      </div>
      {program.culturalAdaptability && (
        <Card className="p-4 mb-4" data-testid="card-program-cultural">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-violet-500" /> Cultural Adaptability</h3>
          <p className="text-sm">{program.culturalAdaptability}</p>
        </Card>
      )}
      <Card className="p-4 mb-4" data-testid="card-program-stakeholders">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Stakeholder Fit</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(stakeholderFit).map(([k, v]) => (
            <Badge key={k} variant={v ? "default" : "outline"} className="text-[10px]">
              {STAKEHOLDER_LABELS[k] || k}: {v ? "Yes" : "No"}
            </Badge>
          ))}
        </div>
      </Card>
      {program.websiteUrl && (
        <a href={program.websiteUrl} target="_blank" rel="noopener noreferrer" data-testid="link-program-website">
          <Button variant="outline" size="sm">
            Visit Website <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </a>
      )}
    </div>
  );
}

function ImplementationsTab({ programs, implementations }: { programs: EvidenceBasedProgram[]; implementations: EbpImplementation[] }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formProgramId, setFormProgramId] = useState("");
  const [formStatus, setFormStatus] = useState("exploring");
  const [formStage, setFormStage] = useState("exploration");
  const [formNotes, setFormNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/prevention-strategies/implementations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention-strategies/implementations"] });
      toast({ title: "Implementation Created" });
      setShowForm(false);
      setFormProgramId("");
      setFormNotes("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!formProgramId) return toast({ title: "Select a program", variant: "destructive" });
    createMutation.mutate({ programId: formProgramId, status: formStatus, implementationStage: formStage, notes: formNotes || undefined });
  };

  const programMap = new Map(programs.map(p => [p.id, p]));

  return (
    <div data-testid="section-implementations">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h2 className="text-lg font-bold" data-testid="text-implementations-title">Our EBP Implementations</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-implementation">
          {showForm ? "Cancel" : "Add Implementation"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4" data-testid="card-implementation-form">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Program</label>
              <Select value={formProgramId} onValueChange={setFormProgramId}>
                <SelectTrigger data-testid="select-implementation-program"><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger data-testid="select-implementation-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exploring">Exploring</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Implementation Stage</label>
                <Select value={formStage} onValueChange={setFormStage}>
                  <SelectTrigger data-testid="select-implementation-stage"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exploration">Exploration</SelectItem>
                    <SelectItem value="preparation">Preparation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="sustainment">Sustainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} className="resize-none" data-testid="input-implementation-notes" />
            </div>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-implementation">
              {createMutation.isPending ? "Saving..." : "Save Implementation"}
            </Button>
          </div>
        </Card>
      )}

      {implementations.length === 0 ? (
        <Card className="p-6 text-center" data-testid="card-no-implementations">
          <p className="text-sm text-muted-foreground">No implementations tracked yet. Add one to begin monitoring fidelity.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {implementations.map(impl => {
            const prog = programMap.get(impl.programId);
            const stage = IMPL_STAGES[impl.implementationStage] || IMPL_STAGES.exploration;
            return (
              <Card key={impl.id} className="p-4" data-testid={`card-implementation-${impl.id}`}>
                <h3 className="font-semibold text-sm mb-1" data-testid={`text-impl-name-${impl.id}`}>{prog?.name || "Unknown Program"}</h3>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <Badge className={`text-[10px] ${stage.color}`}>{stage.label}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{impl.status}</Badge>
                </div>
                {impl.fidelityScore !== null && impl.fidelityScore !== undefined && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Fidelity Score</span><span>{impl.fidelityScore}%</span>
                    </div>
                    <Progress value={impl.fidelityScore} className="h-2" data-testid={`progress-fidelity-${impl.id}`} />
                  </div>
                )}
                {impl.notes && <p className="text-xs text-muted-foreground">{impl.notes}</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EnvironmentalStrategiesTab({ strategies, categories }: { strategies: EnvironmentalStrategy[]; categories: StrategyCategory[] }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStage, setFormStage] = useState("exploration");

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/prevention-strategies/strategies", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention-strategies/strategies"] });
      toast({ title: "Strategy Created" });
      setShowForm(false);
      setFormName("");
      setFormDesc("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!formName || !formCategory) return toast({ title: "Name and category required", variant: "destructive" });
    createMutation.mutate({ name: formName, category: formCategory, description: formDesc, implementationStage: formStage });
  };

  const categoryMap = new Map(categories.map(c => [c.key, c.label]));
  const grouped = categories.map(cat => ({
    ...cat,
    strategies: strategies.filter(s => s.category === cat.key),
  }));

  return (
    <div data-testid="section-environmental-strategies">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h2 className="text-lg font-bold" data-testid="text-strategies-title">Environmental Strategies</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-strategy">
          {showForm ? "Cancel" : "Add Strategy"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4" data-testid="card-strategy-form">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Strategy Name</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} data-testid="input-strategy-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger data-testid="select-strategy-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Stage</label>
                <Select value={formStage} onValueChange={setFormStage}>
                  <SelectTrigger data-testid="select-strategy-stage"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exploration">Exploration</SelectItem>
                    <SelectItem value="preparation">Preparation</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="sustainment">Sustainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="resize-none" data-testid="input-strategy-desc" />
            </div>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-strategy">
              {createMutation.isPending ? "Saving..." : "Save Strategy"}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {grouped.map(group => {
          const Icon = CATEGORY_ICONS[group.key] || Shield;
          return (
            <div key={group.key} data-testid={`section-category-${group.key}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">{group.label}</h3>
                <Badge variant="secondary" className="text-[10px]">{group.strategies.length}</Badge>
              </div>
              {group.strategies.length === 0 ? (
                <p className="text-xs text-muted-foreground ml-6">No strategies in this category yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                  {group.strategies.map(s => {
                    const stage = IMPL_STAGES[s.implementationStage] || IMPL_STAGES.exploration;
                    return (
                      <Card key={s.id} className="p-3" data-testid={`card-strategy-${s.id}`}>
                        <h4 className="font-medium text-sm mb-1" data-testid={`text-strategy-name-${s.id}`}>{s.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{s.description}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={`text-[10px] ${stage.color}`}>{stage.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CfirDashboardTab({ assessments, programs, strategies }: { assessments: CfirAssessment[]; programs: EvidenceBasedProgram[]; strategies: EnvironmentalStrategy[] }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formProgramId, setFormProgramId] = useState("");
  const [formIC, setFormIC] = useState(50);
  const [formOS, setFormOS] = useState(50);
  const [formIS, setFormIS] = useState(50);
  const [formInd, setFormInd] = useState(50);
  const [formIP, setFormIP] = useState(50);
  const [formNotes, setFormNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/prevention-strategies/cfir", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prevention-strategies/cfir"] });
      toast({ title: "CFIR Assessment Saved" });
      setShowForm(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    createMutation.mutate({
      programId: formProgramId || undefined,
      interventionCharacteristics: formIC,
      outerSetting: formOS,
      innerSetting: formIS,
      individuals: formInd,
      implementationProcess: formIP,
      notes: formNotes || undefined,
    });
  };

  const CFIR_DOMAINS = [
    { key: "interventionCharacteristics", label: "Intervention Characteristics", desc: "Evidence strength, adaptability, complexity, cost" },
    { key: "outerSetting", label: "Outer Setting", desc: "Patient needs, external policies, peer pressure" },
    { key: "innerSetting", label: "Inner Setting", desc: "Culture, leadership, resources, communication" },
    { key: "individuals", label: "Individuals", desc: "Knowledge, self-efficacy, motivation" },
    { key: "implementationProcess", label: "Implementation Process", desc: "Planning, engagement, execution, evaluation" },
  ];

  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  return (
    <div data-testid="section-cfir-dashboard">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-bold" data-testid="text-cfir-title">CFIR Dashboard</h2>
          <p className="text-xs text-muted-foreground">Consolidated Framework for Implementation Research</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-cfir">
          {showForm ? "Cancel" : "New Assessment"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4" data-testid="card-cfir-form">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Program (optional)</label>
              <Select value={formProgramId} onValueChange={setFormProgramId}>
                <SelectTrigger data-testid="select-cfir-program"><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Assessment</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "Intervention Characteristics", val: formIC, set: setFormIC, tid: "input-cfir-ic" },
              { label: "Outer Setting", val: formOS, set: setFormOS, tid: "input-cfir-os" },
              { label: "Inner Setting", val: formIS, set: setFormIS, tid: "input-cfir-is" },
              { label: "Individuals", val: formInd, set: setFormInd, tid: "input-cfir-ind" },
              { label: "Implementation Process", val: formIP, set: setFormIP, tid: "input-cfir-ip" },
            ].map(f => (
              <div key={f.tid}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{f.label}</label>
                  <span className="text-sm text-muted-foreground">{f.val}%</span>
                </div>
                <Input type="range" min={0} max={100} value={f.val} onChange={e => f.set(Number(e.target.value))} data-testid={f.tid} />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} className="resize-none" data-testid="input-cfir-notes" />
            </div>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-cfir">
              {createMutation.isPending ? "Saving..." : "Save Assessment"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {CFIR_DOMAINS.map(d => {
          const val = latestAssessment ? (latestAssessment as Record<string, unknown>)[d.key] as number : 0;
          return (
            <Card key={d.key} className="p-3" data-testid={`card-cfir-domain-${d.key}`}>
              <h4 className="text-xs font-semibold mb-1">{d.label}</h4>
              <p className="text-[10px] text-muted-foreground mb-2">{d.desc}</p>
              <div className="text-lg font-bold" data-testid={`text-cfir-score-${d.key}`}>{val}%</div>
              <Progress value={val} className="h-1.5 mt-1" />
            </Card>
          );
        })}
      </div>

      {latestAssessment && (
        <Card className="p-4 mb-4" data-testid="card-cfir-overall">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm">Overall CFIR Score</h3>
            <span className="text-xl font-bold" data-testid="text-cfir-overall-score">{latestAssessment.overallScore}%</span>
          </div>
          <Progress value={latestAssessment.overallScore} className="h-3" data-testid="progress-cfir-overall" />
          {latestAssessment.notes && <p className="text-xs text-muted-foreground mt-2">{latestAssessment.notes}</p>}
        </Card>
      )}

      {assessments.length > 1 && (
        <Card className="p-4" data-testid="card-cfir-history">
          <h3 className="font-semibold text-sm mb-3">Assessment History</h3>
          <div className="space-y-2">
            {assessments.slice(0, 10).map((a, i) => (
              <div key={a.id} className="flex items-center justify-between gap-2 text-sm" data-testid={`row-cfir-history-${i}`}>
                <span className="text-muted-foreground text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "N/A"}</span>
                <div className="flex items-center gap-2">
                  <Progress value={a.overallScore} className="h-2 w-24" />
                  <span className="font-medium text-xs">{a.overallScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StakeholderMapTab({ programs }: { programs: EvidenceBasedProgram[] }) {
  const stakeholders = Object.keys(STAKEHOLDER_LABELS);

  return (
    <div data-testid="section-stakeholder-map">
      <h2 className="text-lg font-bold mb-2" data-testid="text-stakeholder-title">Stakeholder Fit Map</h2>
      <p className="text-sm text-muted-foreground mb-4">Shows which evidence-based programs are best suited for each stakeholder population.</p>

      <div className="space-y-4">
        {stakeholders.map(sk => {
          const fitting = programs.filter(p => {
            const fit = (p.stakeholderFit as Record<string, boolean>) || {};
            return fit[sk];
          });
          return (
            <Card key={sk} className="p-4" data-testid={`card-stakeholder-${sk}`}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-indigo-500" />
                <h3 className="font-semibold text-sm" data-testid={`text-stakeholder-label-${sk}`}>{STAKEHOLDER_LABELS[sk]}</h3>
                <Badge variant="secondary" className="text-[10px]">{fitting.length} programs</Badge>
              </div>
              {fitting.length === 0 ? (
                <p className="text-xs text-muted-foreground">No programs currently mapped to this population.</p>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {fitting.map(p => (
                    <Badge key={p.id} variant="outline" className="text-[10px]" data-testid={`badge-fit-${sk}-${p.id}`}>
                      {p.acronym || p.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function PreventionStrategiesPage() {
  useEffect(() => { document.title = "Prevention Strategies | ThriveUp"; }, []);

  const [activeTab, setActiveTab] = useState("programs");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const { data: dashboard, isLoading: dashLoading } = useQuery<DashboardData>({ queryKey: ["/api/prevention-strategies/dashboard"] });
  const { data: programs, isLoading: progsLoading } = useQuery<EvidenceBasedProgram[]>({ queryKey: ["/api/prevention-strategies/programs"] });
  const { data: implementations } = useQuery<EbpImplementation[]>({ queryKey: ["/api/prevention-strategies/implementations"] });
  const { data: strategies } = useQuery<EnvironmentalStrategy[]>({ queryKey: ["/api/prevention-strategies/strategies"] });
  const { data: cfirAssessments } = useQuery<CfirAssessment[]>({ queryKey: ["/api/prevention-strategies/cfir"] });
  const { data: categories } = useQuery<StrategyCategory[]>({ queryKey: ["/api/prevention-strategies/categories"] });

  const selectedProgram = programs?.find(p => p.id === selectedProgramId);

  if (selectedProgram) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-strategies-page">
        <PageHeader title="Prevention Strategies" breadcrumbs={[{ label: "Prevention Strategies", href: "/prevention-strategies" }, { label: selectedProgram.name }]} />
        <ProgramDetail program={selectedProgram} onBack={() => setSelectedProgramId(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="prevention-strategies-page">
      <PageHeader title="Prevention Strategies" breadcrumbs={[{ label: "Prevention Strategies" }]} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {dashLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <Card className="p-3" data-testid="card-stat-programs">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="text-xs text-muted-foreground">EBP Registry</span>
              </div>
              <p className="text-xl font-bold" data-testid="text-stat-programs">{dashboard?.totalPrograms || 0}</p>
            </Card>
            <Card className="p-3" data-testid="card-stat-implementations">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Implementations</span>
              </div>
              <p className="text-xl font-bold" data-testid="text-stat-implementations">{dashboard?.totalImplementations || 0}</p>
            </Card>
            <Card className="p-3" data-testid="card-stat-strategies">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Env. Strategies</span>
              </div>
              <p className="text-xl font-bold" data-testid="text-stat-strategies">{dashboard?.totalStrategies || 0}</p>
            </Card>
            <Card className="p-3" data-testid="card-stat-cfir">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-violet-500" />
                <span className="text-xs text-muted-foreground">CFIR Assessments</span>
              </div>
              <p className="text-xl font-bold" data-testid="text-stat-cfir">{dashboard?.totalCfirAssessments || 0}</p>
            </Card>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap" data-testid="tabs-prevention-strategies">
          <TabsTrigger value="programs" data-testid="tab-programs">Evidence-Based Programs</TabsTrigger>
          <TabsTrigger value="implementations" data-testid="tab-implementations">Our Implementations</TabsTrigger>
          <TabsTrigger value="strategies" data-testid="tab-strategies">Environmental Strategies</TabsTrigger>
          <TabsTrigger value="cfir" data-testid="tab-cfir">CFIR Dashboard</TabsTrigger>
          <TabsTrigger value="stakeholders" data-testid="tab-stakeholders">Stakeholder Map</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-4">
          {progsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(programs || []).map(p => (
                <ProgramCard key={p.id} program={p} onSelect={setSelectedProgramId} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="implementations" className="mt-4">
          <ImplementationsTab programs={programs || []} implementations={implementations || []} />
        </TabsContent>

        <TabsContent value="strategies" className="mt-4">
          <EnvironmentalStrategiesTab strategies={strategies || []} categories={categories || []} />
        </TabsContent>

        <TabsContent value="cfir" className="mt-4">
          <CfirDashboardTab assessments={cfirAssessments || []} programs={programs || []} strategies={strategies || []} />
        </TabsContent>

        <TabsContent value="stakeholders" className="mt-4">
          <StakeholderMapTab programs={programs || []} />
        </TabsContent>
      </Tabs>
      <DFCCrossNav currentPage="prevention-strategies" />
    </div>
  );
}
