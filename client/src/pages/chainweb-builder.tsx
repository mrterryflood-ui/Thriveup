import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingDown, TrendingUp, DollarSign, AlertTriangle, BookOpen,
  ArrowRight, Loader2, ChevronRight, ExternalLink, Copy, RefreshCw,
  Zap, Users, Baby, GraduationCap, Briefcase, Home, Heart, Scale, Building2,
  Network, MapPin, Info
} from "lucide-react";
import { SDOHImpactChain } from "@/components/sdoh-impact-chain";

const DOMAIN_ICONS: Record<string, any> = {
  early_childhood: Baby,
  education: GraduationCap,
  workforce: Briefcase,
  housing: Home,
  health: Heart,
  justice: Scale,
  family: Users,
  civic: Building2,
  economic: TrendingUp,
};

const DOMAIN_COLORS: Record<string, string> = {
  early_childhood: "bg-amber-100 text-amber-800 border-amber-200",
  education: "bg-blue-100 text-blue-800 border-blue-200",
  workforce: "bg-emerald-100 text-emerald-800 border-emerald-200",
  housing: "bg-purple-100 text-purple-800 border-purple-200",
  health: "bg-red-100 text-red-800 border-red-200",
  justice: "bg-indigo-100 text-indigo-800 border-indigo-200",
  family: "bg-orange-100 text-orange-800 border-orange-200",
  civic: "bg-teal-100 text-teal-800 border-teal-200",
  economic: "bg-slate-100 text-slate-800 border-slate-200",
};

const AUDIENCE_LABELS: Record<string, { label: string; desc: string }> = {
  grant_writer:  { label: "Grant Narrative",      desc: "RFP-style proposal language with citations" },
  org_leader:    { label: "Executive Brief",       desc: "Decision-ready summary for nonprofit leaders" },
  researcher:    { label: "Research Abstract",     desc: "Effect sizes, limitations, IS framing" },
  council:       { label: "Council Briefing",      desc: "Taxpayer cost of inaction + recommendation" },
  funder:        { label: "Investment Memo",       desc: "Leverage ratio, ROI, replication potential" },
};

function fmt$(n: number | string | null | undefined): string {
  const num = Number(n);
  if (!num || isNaN(num)) return "$0";
  if (Math.abs(num) >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${Math.round(num).toLocaleString()}`;
}

function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    strong: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    emerging: "bg-slate-100 text-slate-600",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[level] || map.moderate}`}>{level}</span>;
}

function DomainChip({ domain }: { domain: string }) {
  const Icon = DOMAIN_ICONS[domain] || Zap;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border font-medium ${DOMAIN_COLORS[domain] || "bg-slate-100 text-slate-700"}`}>
      <Icon className="h-3 w-3" />
      {domain.replace(/_/g, " ")}
    </span>
  );
}

export default function ChainwebBuilderPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"build" | "library" | "results" | "story">("build");
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [audience, setAudience] = useState<string>("grant_writer");
  const [narrative, setNarrative] = useState<any>(null);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    geographyLabel: "Travis County, TX",
    geographyFips: "48453",
    geographyType: "county",
    entryDomain: "early_childhood",
    interventionName: "",
    interventionDescription: "",
    interventionCostPerPerson: "9500",
    populationSize: "1000",
    timeHorizonYears: "10",
  });

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: domains = [] } = useQuery<any[]>({
    queryKey: ["/api/chainweb/domains"],
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/chainweb/templates"],
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery<any[]>({
    queryKey: ["/api/chainweb/scenarios"],
  });

  const { data: scenarioDetail } = useQuery<any>({
    queryKey: ["/api/chainweb/scenarios", selectedScenario],
    enabled: selectedScenario !== null,
  });

  const { data: coefficients = [] } = useQuery<any[]>({
    queryKey: ["/api/chainweb/coefficients"],
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createScenario = useMutation({
    mutationFn: () => apiRequest("POST", "/api/chainweb/scenarios", {
      ...form,
      interventionCostPerPerson: form.interventionCostPerPerson,
      populationSize: parseInt(form.populationSize),
      timeHorizonYears: parseInt(form.timeHorizonYears),
    }),
    onSuccess: async (res: any) => {
      const scenario = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/chainweb/scenarios"] });
      setSelectedScenario(scenario.id);
      calculateMutation.mutate(scenario.id);
    },
    onError: () => toast({ title: "Error creating scenario", variant: "destructive" }),
  });

  const calculateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/chainweb/scenarios/${id}/calculate`, {}),
    onSuccess: async (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chainweb/scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chainweb/scenarios", selectedScenario] });
      setActiveTab("results");
      toast({ title: "ROI Calculated", description: "Causal chain built. Generating your results." });
    },
    onError: () => toast({ title: "Calculation error", variant: "destructive" }),
  });

  const fromTemplate = useMutation({
    mutationFn: (templateId: string) => apiRequest("POST", "/api/chainweb/from-template", {
      templateId,
      geographyLabel: form.geographyLabel,
      geographyFips: form.geographyFips,
      populationSize: parseInt(form.populationSize),
      interventionCostPerPerson: parseInt(form.interventionCostPerPerson),
    }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/chainweb/scenarios"] });
      setSelectedScenario(data.scenario.id);
      setActiveTab("results");
      toast({ title: "Template loaded & calculated" });
    },
    onError: () => toast({ title: "Template error", variant: "destructive" }),
  });

  const generateNarrativeMutation = async () => {
    if (!scenarioDetail?.calculation) return;
    setGeneratingNarrative(true);
    setNarrative(null);
    try {
      const res = await apiRequest("POST", `/api/chainweb/calculations/${scenarioDetail.calculation.id}/narratives`, { audience });
      const data = await res.json();
      setNarrative(data);
    } catch {
      toast({ title: "Narrative generation failed", variant: "destructive" });
    } finally {
      setGeneratingNarrative(false);
    }
  };

  const handleFormChange = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const calc = scenarioDetail?.calculation;
  const roiRatio = Number(calc?.roiRatio || 0);
  const netSavings = Number(calc?.netSavings || 0);
  const cfCost = Number(calc?.counterfactualTotalCost || 0);
  const intCost = Number(calc?.interventionTotalCost || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chainweb ROI Engine</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Causal-chain analysis — model what inaction costs vs. what early investment saves, cited to primary sources, for any geography, any domain, any stakeholder.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Every coefficient cites a primary source</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span>Based on: Heckman (2012) · Annie E. Casey (2011) · BJS (2018) · RAND (2021) · Vera Institute (2022)</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6 bg-white dark:bg-slate-800 border shadow-sm flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="build" data-testid="tab-build">Build Scenario</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results" disabled={!selectedScenario}>
              ROI Results {selectedScenario && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Ready</span>}
            </TabsTrigger>
            <TabsTrigger value="story" data-testid="tab-story" className="flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5" />
              Community Story
            </TabsTrigger>
            <TabsTrigger value="library" data-testid="tab-library">Coefficient Library</TabsTrigger>
          </TabsList>

          {/* ── BUILD TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="build">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick-start from template */}
              <div className="lg:col-span-3">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Start — Proven Scenarios</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {templates.map((t) => (
                    <Card
                      key={t.id}
                      data-testid={`template-card-${t.id}`}
                      className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                      onClick={() => {
                        if (form.geographyLabel) fromTemplate.mutate(t.id);
                        else toast({ title: "Set geography first", variant: "destructive" });
                      }}
                    >
                      <CardContent className="p-4">
                        <DomainChip domain={t.entryDomain} />
                        <h3 className="font-semibold text-sm mt-2 mb-1 text-slate-800 dark:text-slate-200 group-hover:text-blue-700">{t.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                        <div className="flex items-center gap-1 mt-3 text-xs text-blue-600 font-medium">
                          <Zap className="h-3 w-3" />
                          <span>Calculate instantly</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {fromTemplate.isPending && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building causal web + calculating ROI…
                  </div>
                )}
              </div>

              <Separator className="lg:col-span-3" />
              <div className="lg:col-span-3">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Custom Scenario</h2>
              </div>

              {/* Left: Geography + Population */}
              <Card className="bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Geography & Population</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="geo-label" className="text-xs text-slate-500">Location</Label>
                    <Input
                      id="geo-label"
                      data-testid="input-geo-label"
                      value={form.geographyLabel}
                      onChange={e => handleFormChange("geographyLabel", e.target.value)}
                      placeholder="Travis County, TX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="geo-fips" className="text-xs text-slate-500">FIPS Code (optional)</Label>
                    <Input
                      id="geo-fips"
                      data-testid="input-geo-fips"
                      value={form.geographyFips}
                      onChange={e => handleFormChange("geographyFips", e.target.value)}
                      placeholder="48453"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pop-size" className="text-xs text-slate-500">Population Size</Label>
                    <Input
                      id="pop-size"
                      data-testid="input-pop-size"
                      type="number"
                      value={form.populationSize}
                      onChange={e => handleFormChange("populationSize", e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-400 mt-1">Number of people the intervention reaches</p>
                  </div>
                  <div>
                    <Label htmlFor="horizon" className="text-xs text-slate-500">Time Horizon (years)</Label>
                    <Input
                      id="horizon"
                      data-testid="input-horizon"
                      type="number"
                      value={form.timeHorizonYears}
                      onChange={e => handleFormChange("timeHorizonYears", e.target.value)}
                      min={1} max={30}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Center: Intervention */}
              <Card className="bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Intervention</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500">Entry Domain</Label>
                    <Select value={form.entryDomain} onValueChange={v => handleFormChange("entryDomain", v)}>
                      <SelectTrigger className="mt-1" data-testid="select-entry-domain">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            <div className="flex items-center gap-2">
                              <span>{d.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">Where the causal chain starts</p>
                  </div>
                  <div>
                    <Label htmlFor="int-name" className="text-xs text-slate-500">Intervention Name</Label>
                    <Input
                      id="int-name"
                      data-testid="input-intervention-name"
                      value={form.interventionName}
                      onChange={e => handleFormChange("interventionName", e.target.value)}
                      placeholder="Universal Pre-K + Early Counseling"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="int-desc" className="text-xs text-slate-500">Description</Label>
                    <Textarea
                      id="int-desc"
                      data-testid="input-intervention-desc"
                      value={form.interventionDescription}
                      onChange={e => handleFormChange("interventionDescription", e.target.value)}
                      placeholder="What change X are we modeling?"
                      rows={3}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost-per" className="text-xs text-slate-500">Cost per Person ($)</Label>
                    <Input
                      id="cost-per"
                      data-testid="input-cost-per-person"
                      type="number"
                      value={form.interventionCostPerPerson}
                      onChange={e => handleFormChange("interventionCostPerPerson", e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-400 mt-1">e.g. $9,500 for quality pre-K</p>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Scenario name + submit */}
              <Card className="bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Scenario Name & Launch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sc-name" className="text-xs text-slate-500">Scenario Name</Label>
                    <Input
                      id="sc-name"
                      data-testid="input-scenario-name"
                      value={form.name}
                      onChange={e => handleFormChange("name", e.target.value)}
                      placeholder="Travis County Pre-K ROI 2025"
                      className="mt-1"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">What this will calculate:</p>
                    <ul className="space-y-1.5">
                      {[
                        "Counterfactual cost — the full price of doing nothing",
                        "Intervention cost — what the program actually costs",
                        "Net ROI — dollars saved per dollar invested",
                        "Domain breakdown — where savings come from",
                        "5 stakeholder narrative formats",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                          <ChevronRight className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    data-testid="button-calculate"
                    className="w-full"
                    disabled={!form.name || !form.interventionName || createScenario.isPending || calculateMutation.isPending}
                    onClick={() => createScenario.mutate()}
                  >
                    {(createScenario.isPending || calculateMutation.isPending) ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building causal web…</>
                    ) : (
                      <><Zap className="h-4 w-4 mr-2" />Calculate ROI</>
                    )}
                  </Button>

                  {/* Existing scenarios */}
                  {scenarios.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Saved Scenarios</p>
                        <div className="space-y-1">
                          {scenarios.slice(0, 5).map((s: any) => (
                            <button
                              key={s.id}
                              data-testid={`scenario-item-${s.id}`}
                              onClick={() => { setSelectedScenario(s.id); setActiveTab("results"); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{s.name}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ml-2 shrink-0 ${s.status === "calculated" ? "border-green-300 text-green-700" : "border-slate-200 text-slate-500"}`}
                                >
                                  {s.status}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── RESULTS TAB ───────────────────────────────────────────────── */}
          <TabsContent value="results">
            {!scenarioDetail && (
              <div className="text-center py-16 text-slate-400">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select or build a scenario to see results.</p>
              </div>
            )}
            {scenarioDetail && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{scenarioDetail.scenario.name}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {scenarioDetail.scenario.geographyLabel} · {scenarioDetail.scenario.populationSize?.toLocaleString()} people · {scenarioDetail.scenario.timeHorizonYears}-year horizon
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-recalculate"
                    onClick={() => calculateMutation.mutate(scenarioDetail.scenario.id)}
                    disabled={calculateMutation.isPending}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${calculateMutation.isPending ? "animate-spin" : ""}`} />
                    Recalculate
                  </Button>
                </div>

                {/* ROI Summary Cards */}
                {calc && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-red-50 border-red-200 dark:bg-red-950/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-600 mb-1">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Cost of Inaction</span>
                        </div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-400" data-testid="stat-counterfactual">{fmt$(cfCost)}</div>
                        <p className="text-xs text-red-500 mt-1">If we do nothing over {calc.timeHorizonYears} years</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Intervention Cost</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="stat-intervention">{fmt$(intCost)}</div>
                        <p className="text-xs text-blue-500 mt-1">{fmt$(Number(scenarioDetail.scenario.interventionCostPerPerson))} per person</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200 dark:bg-green-950/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Net Savings</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="stat-net-savings">{fmt$(netSavings)}</div>
                        <p className="text-xs text-green-500 mt-1">Prevented downstream costs</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                          <Zap className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">ROI Ratio</span>
                        </div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400" data-testid="stat-roi">${roiRatio.toFixed(2)}<span className="text-sm font-normal ml-1">per $1</span></div>
                        <p className="text-xs text-amber-500 mt-1">Returned per dollar invested</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Ounce of Prevention callout */}
                {calc && roiRatio > 1 && (
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 dark:bg-blue-950/30 rounded-xl p-4">
                    <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Ounce of Prevention Principle</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
                        For every <strong>{fmt$(intCost)}</strong> invested now, society avoids <strong>{fmt$(cfCost)}</strong> in downstream costs over {calc.timeHorizonYears} years — a <strong>${roiRatio.toFixed(1)}:$1 return</strong>. The question isn't whether we can afford to act. It's whether we can afford not to.
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Evidence Statements */}
                {calc?.keyStatements && (calc.keyStatements as any[]).length > 0 && (
                  <Card className="bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700">Key Evidence Chain</CardTitle>
                      <CardDescription className="text-xs">Primary-source citations underpinning this ROI calculation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(calc.keyStatements as any[]).map((s: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                            <span className="text-xs font-bold text-slate-400 w-5 shrink-0 mt-0.5">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-800 dark:text-slate-200">{s.claim}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-slate-400 italic truncate">{s.citation}</p>
                                {s.confidence && <ConfidenceBadge level={s.confidence} />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Causal Web Domains */}
                {scenarioDetail.nodes?.length > 0 && (
                  <Card className="bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700">Causal Web — Affected Domains</CardTitle>
                      <CardDescription className="text-xs">How the intervention ripples through interconnected systems</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {scenarioDetail.nodes.map((node: any) => (
                          <div key={node.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${DOMAIN_COLORS[node.domain] || "bg-slate-100"}`}>
                            {node.isEntryNode && <ArrowRight className="h-3 w-3" />}
                            <span>{node.label}</span>
                          </div>
                        ))}
                      </div>
                      {scenarioDetail.edges?.length > 0 && (
                        <p className="text-xs text-slate-400 mt-3">{scenarioDetail.edges.length} evidence-based connections modeled</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Narrative Generator */}
                {calc && (
                  <Card className="bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700">Generate Stakeholder Narrative</CardTitle>
                      <CardDescription className="text-xs">AI-drafted, citation-grounded output for your specific audience</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        {Object.entries(AUDIENCE_LABELS).map(([key, val]) => (
                          <button
                            key={key}
                            data-testid={`audience-${key}`}
                            onClick={() => setAudience(key)}
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${audience === key ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:border-blue-300"}`}
                          >
                            <div className="font-semibold">{val.label}</div>
                            <div className={`mt-0.5 ${audience === key ? "text-blue-100" : "text-slate-400"}`}>{val.desc}</div>
                          </button>
                        ))}
                      </div>

                      <Button
                        data-testid="button-generate-narrative"
                        onClick={generateNarrativeMutation}
                        disabled={generatingNarrative}
                        className="w-full sm:w-auto"
                      >
                        {generatingNarrative ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating narrative…</>
                        ) : (
                          <><BookOpen className="h-4 w-4 mr-2" />Generate {AUDIENCE_LABELS[audience]?.label}</>
                        )}
                      </Button>

                      {narrative && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white" data-testid="narrative-headline">{narrative.headline}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid="button-copy-narrative"
                              onClick={() => {
                                navigator.clipboard.writeText(`${narrative.headline}\n\n${narrative.narrative}`);
                                toast({ title: "Copied to clipboard" });
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {(narrative.narrative || "").split("\n\n").map((para: string, i: number) => (
                              <p key={i} className="text-sm text-slate-700 dark:text-slate-300 mb-3">{para}</p>
                            ))}
                          </div>
                          {narrative.keyStats?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                              {narrative.keyStats.slice(0, 3).map((s: any, i: number) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-800 border rounded-lg p-3">
                                  <div className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-400">{s.label}</div>
                                  {s.citation && <div className="text-xs text-slate-400 italic mt-1">{s.citation}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                          {narrative.citations?.length > 0 && (
                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <p className="text-xs font-semibold text-slate-500 mb-2">Citations</p>
                              <ul className="space-y-1">
                                {narrative.citations.map((c: string, i: number) => (
                                  <li key={i} className="text-xs text-slate-500 italic">{c}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── COMMUNITY STORY TAB ───────────────────────────────────────── */}
          <TabsContent value="story">
            {(() => {
              // Parse 5-digit FIPS → stateCode + countyCode
              const clean = (form.geographyFips || "").replace(/\D/g, "");
              const hasFips = clean.length === 5;
              const stateCode = hasFips ? clean.slice(0, 2) : undefined;
              const countyCodes = hasFips ? clean.slice(2) : undefined;

              return (
                <div className="space-y-6">
                  {/* Context banner */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Network className="h-5 w-5 text-blue-600" />
                        SDOH Community Story — Break the Chain, Change the Outcome
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
                        The causal story behind the numbers. Real Census + CDC + SVI data for{" "}
                        <strong>{form.geographyLabel || "your geography"}</strong> — showing the three realities
                        people face and the breaking points where intervention changes the trajectory.
                      </p>
                    </div>
                    {selectedScenario && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="button-view-roi-from-story"
                        onClick={() => setActiveTab("results")}
                        className="shrink-0"
                      >
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                        View ROI Results
                      </Button>
                    )}
                  </div>

                  {/* Geography info strip */}
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border rounded-lg px-4 py-3">
                    <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>
                      <strong>{form.geographyLabel || "Geography not set"}</strong>
                      {hasFips ? (
                        <span className="ml-2 text-slate-400">
                          · FIPS {form.geographyFips} · State {stateCode}, County {countyCodes}
                          · Live Census/CDC/SVI data
                        </span>
                      ) : (
                        <span className="ml-2 text-amber-500">
                          · Enter a 5-digit FIPS code in Build Scenario to load live data for your geography
                        </span>
                      )}
                    </span>
                    {!hasFips && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-blue-600 px-0 h-auto"
                        data-testid="button-go-to-build"
                        onClick={() => setActiveTab("build")}
                      >
                        Set geography →
                      </Button>
                    )}
                  </div>

                  {/* Bridging callout: ROI ↔ Story */}
                  {selectedScenario && (
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 dark:bg-blue-950/30 rounded-xl p-4">
                      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                          This story is the human side of the ROI calculation you built.
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
                          The causal chain below maps the same poverty → school failure → incarceration cascade
                          that the Chainweb coefficients quantify. Use this tab to explain <em>why</em> the numbers
                          are what they are — to a council member, a funder, or a community.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* The full SDOH Impact Chain — live data if FIPS provided */}
                  <SDOHImpactChain
                    stateCode={stateCode}
                    countyCodes={countyCodes}
                  />

                  {/* Bottom CTA */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      variant="outline"
                      data-testid="button-build-roi-from-story"
                      onClick={() => setActiveTab("build")}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Build the ROI for This Geography
                    </Button>
                    {selectedScenario && (
                      <Button
                        data-testid="button-results-from-story"
                        onClick={() => setActiveTab("results")}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        See ROI Results
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* ── COEFFICIENT LIBRARY TAB ───────────────────────────────────── */}
          <TabsContent value="library">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Evidence-Based Coefficient Library</h2>
                  <p className="text-sm text-slate-500">Every ripple effect in the Chainweb engine — all cited to primary sources. No fabrication.</p>
                </div>
                <Badge variant="outline" className="text-sm">{coefficients.length} coefficients</Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {coefficients.map((c: any, i: number) => (
                  <Card key={i} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <DomainChip domain={c.fromDomain} />
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <DomainChip domain={c.toDomain} />
                            <ConfidenceBadge level={c.confidenceLevel} />
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {c.fromMetric} <span className="text-slate-400 mx-1">→</span> {c.toMetric}
                          </p>
                          {c.populationNotes && (
                            <p className="text-xs text-slate-500 mt-1 italic">{c.populationNotes}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1.5 flex items-start gap-1">
                            <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{c.evidenceCitation}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-lg font-bold ${c.direction === "positive" ? "text-green-600" : "text-red-600"}`}>
                            {c.direction === "positive" ? "+" : "−"}
                            {Math.abs(c.coefficient) >= 1000
                              ? fmt$(Math.abs(c.coefficient))
                              : Math.abs(c.coefficient) <= 1
                                ? `${(Math.abs(c.coefficient) * 100).toFixed(0)}%`
                                : `${c.coefficient}×`}
                          </div>
                          {c.lagYears > 0 && <div className="text-xs text-slate-400">{c.lagYears}yr lag</div>}
                          <div className="text-xs text-slate-400">{c.studyYear}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
