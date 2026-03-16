import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Plus, Target, CheckCircle2, Clock, AlertTriangle,
  Download, BarChart3, FileText, ArrowRight, Trash2, ExternalLink,
  RefreshCw, Globe, Sparkles, Calendar, Filter, TrendingUp,
  Bell, ChevronDown, ChevronUp, Brain, Building2, Zap
} from "lucide-react";
import type { GrantOpportunity } from "@shared/schema";

interface DashboardData {
  totalGrants: number;
  highFitGrants: number;
  mediumFitGrants: number;
  lowFitGrants: number;
  totalFunding: string | null;
  upcomingDeadlines: Array<{ id: string; title: string; deadline: string; fitScore: number }>;
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  newHighFitAlerts: Array<{ id: string; title: string; fitScore: number; agency: string }>;
  capabilities: Array<{ area: string; features: string[] }>;
}

interface SAMResult {
  noticeId: string;
  title: string;
  agency: string;
  postedDate: string;
  responseDate: string;
  description: string;
  uiLink: string;
  fitScore: number;
  matchedAreas: string[];
}

interface SAMSearchResponse {
  results: SAMResult[];
  total: number;
  searchedKeywords: string[];
}

interface FitAnalysis {
  matchedAreas?: string[];
  aiSummary?: string;
  aiStrengths?: Array<{ area: string; description: string }>;
  aiGaps?: Array<{ area: string; description: string; recommendation: string }>;
  aiRecommendation?: string;
  aiCategory?: string;
}

type TabId = "dashboard" | "grants" | "search" | "reports";

function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <Badge variant="outline">Not scored</Badge>;
  if (score >= 70) return <Badge className="bg-emerald-600 text-white">{score}% Fit</Badge>;
  if (score >= 40) return <Badge className="bg-amber-600 text-white">{score}% Fit</Badge>;
  return <Badge variant="destructive">{score}% Fit</Badge>;
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; variant: "outline" | "secondary" | "default" | "destructive" }> = {
    identified: { label: "Identified", variant: "outline" },
    researching: { label: "Researching", variant: "secondary" },
    preparing: { label: "Preparing", variant: "default" },
    submitted: { label: "Submitted", variant: "default" },
    awarded: { label: "Awarded", variant: "default" },
    declined: { label: "Declined", variant: "destructive" },
  };
  const info = map[status || "identified"] || map.identified;
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function GrantHubPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", agency: "", fundingAmount: "", description: "", eligibilityCriteria: "", focusAreas: "", sourceUrl: "", grantType: "" });
  const [samKeywords, setSamKeywords] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedGrant, setExpandedGrant] = useState<string | null>(null);

  const { data: grants = [], isLoading: grantsLoading, error: grantsError, refetch } = useQuery<GrantOpportunity[]>({ queryKey: ["/api/grants"] });
  const { data: dashboard } = useQuery<DashboardData>({ queryKey: ["/api/grants/dashboard"] });

  const [samResults, setSamResults] = useState<SAMResult[]>([]);
  const [samSearching, setSamSearching] = useState(false);

  const searchSAM = async () => {
    setSamSearching(true);
    try {
      const params = samKeywords ? `?keywords=${encodeURIComponent(samKeywords)}` : "";
      const res = await apiRequest("GET", `/api/grants/search/sam${params}`);
      const data = await res.json() as SAMSearchResponse;
      setSamResults(data.results || []);
      toast({ title: `Found ${data.total} opportunities from SAM.gov` });
    } catch {
      toast({ title: "SAM.gov search failed", description: "Check your connection or API key", variant: "destructive" });
    } finally {
      setSamSearching(false);
    }
  };

  const importSAMMutation = useMutation({
    mutationFn: async (result: SAMResult) => {
      const res = await apiRequest("POST", "/api/grants/import-sam", {
        noticeId: result.noticeId, title: result.title, agency: result.agency,
        description: result.description, responseDate: result.responseDate, uiLink: result.uiLink,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/dashboard"] });
      toast({ title: "Grant imported from SAM.gov" });
    },
  });

  const aiAnalyzeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/grants/${id}/ai-analyze`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/dashboard"] });
      toast({ title: "AI analysis complete" });
    },
    onError: () => toast({ title: "AI analysis failed", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/grants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/dashboard"] });
      setShowForm(false);
      setFormData({ title: "", agency: "", fundingAmount: "", description: "", eligibilityCriteria: "", focusAreas: "", sourceUrl: "", grantType: "" });
      toast({ title: "Grant opportunity added with AI analysis" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/grants/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/dashboard"] });
      toast({ title: "Grant removed" });
    },
  });

  const handleSubmit = () => {
    const fa = formData.focusAreas.split(",").map(s => s.trim()).filter(Boolean);
    createMutation.mutate({ ...formData, focusAreas: fa.length ? fa : undefined });
  };

  const filteredGrants = grants.filter(g => {
    if (filterCategory !== "all" && g.grantType !== filterCategory) return false;
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    return true;
  });

  const categories = [...new Set(grants.map(g => g.grantType).filter(Boolean))] as string[];
  const statuses = [...new Set(grants.map(g => g.status).filter(Boolean))] as string[];

  const tabs: Array<{ id: TabId; label: string; icon: typeof BarChart3 }> = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "grants", label: "Grants", icon: FileText },
    { id: "search", label: "SAM.gov Search", icon: Globe },
    { id: "reports", label: "Reports", icon: TrendingUp },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-grant-hub-title">Grant Discovery Engine</h1>
          <p className="text-muted-foreground mt-1">AI-powered grant discovery, alignment analysis, and readiness tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("search")} data-testid="button-search-sam">
            <Globe className="mr-2 h-4 w-4" /> Search SAM.gov
          </Button>
          <Button onClick={() => { setActiveTab("grants"); setShowForm(!showForm); }} data-testid="button-add-grant">
            <Plus className="mr-2 h-4 w-4" /> Add Grant
          </Button>
        </div>
      </div>

      {dashboard?.newHighFitAlerts && dashboard.newHighFitAlerts.length > 0 && (
        <Card className="p-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800" data-testid="card-high-fit-alerts">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-200">New High-Fit Grants</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dashboard.newHighFitAlerts.map(alert => (
              <Badge key={alert.id} className="bg-emerald-600 text-white cursor-pointer" onClick={() => { setActiveTab("grants"); setExpandedGrant(alert.id); }}>
                {alert.title} ({alert.fitScore}%)
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 text-center" data-testid="card-stat-total-grants">
              <p className="text-2xl font-bold text-primary">{dashboard.totalGrants}</p>
              <p className="text-sm text-muted-foreground">Total Grants</p>
            </Card>
            <Card className="p-4 text-center" data-testid="card-stat-high-fit">
              <p className="text-2xl font-bold text-emerald-600">{dashboard.highFitGrants}</p>
              <p className="text-sm text-muted-foreground">High Fit (70%+)</p>
            </Card>
            <Card className="p-4 text-center" data-testid="card-stat-medium-fit">
              <p className="text-2xl font-bold text-amber-600">{dashboard.mediumFitGrants}</p>
              <p className="text-sm text-muted-foreground">Medium Fit</p>
            </Card>
            <Card className="p-4 text-center" data-testid="card-stat-low-fit">
              <p className="text-2xl font-bold text-red-500">{dashboard.lowFitGrants}</p>
              <p className="text-sm text-muted-foreground">Low Fit</p>
            </Card>
            {dashboard.totalFunding && (
              <Card className="p-4 text-center" data-testid="card-stat-total-funding">
                <p className="text-2xl font-bold text-blue-600">{dashboard.totalFunding}</p>
                <p className="text-sm text-muted-foreground">Total Pipeline</p>
              </Card>
            )}
          </div>

          {dashboard.upcomingDeadlines.length > 0 && (
            <Card className="p-5" data-testid="card-upcoming-deadlines">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Upcoming Deadlines
              </h3>
              <div className="space-y-2">
                {dashboard.upcomingDeadlines.map(d => {
                  const days = daysUntil(d.deadline);
                  return (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`deadline-${d.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.deadline).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FitScoreBadge score={d.fitScore} />
                        <Badge variant={days <= 7 ? "destructive" : days <= 30 ? "secondary" : "outline"}>
                          {days <= 0 ? "Past due" : `${days}d left`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {Object.keys(dashboard.categoryCounts).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5" data-testid="card-category-breakdown">
                <h3 className="font-semibold text-lg mb-3">By Category</h3>
                <div className="space-y-2">
                  {Object.entries(dashboard.categoryCounts).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{cat}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5" data-testid="card-status-breakdown">
                <h3 className="font-semibold text-lg mb-3">By Status</h3>
                <div className="space-y-2">
                  {Object.entries(dashboard.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{status}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <Card className="p-5" data-testid="card-platform-capabilities">
            <h3 className="font-semibold text-lg mb-3">Platform Capabilities for Grant Alignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dashboard.capabilities.map(cap => (
                <div key={cap.area} className="flex items-start gap-3 p-3 rounded-lg border">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{cap.area}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cap.features.map((f: string) => (
                        <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "grants" && (
        <div className="space-y-4">
          {showForm && (
            <Card className="p-6 space-y-4" data-testid="card-grant-form">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Add Grant Opportunity (AI-Analyzed)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Grant Title</label>
                  <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g., OJJDP FY25 Second Chance Act" data-testid="input-grant-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Funding Agency</label>
                  <Input value={formData.agency} onChange={e => setFormData(p => ({ ...p, agency: e.target.value }))} placeholder="e.g., Office of Juvenile Justice" data-testid="input-grant-agency" />
                </div>
                <div>
                  <label className="text-sm font-medium">Funding Amount</label>
                  <Input value={formData.fundingAmount} onChange={e => setFormData(p => ({ ...p, fundingAmount: e.target.value }))} placeholder="e.g., $750,000" data-testid="input-grant-amount" />
                </div>
                <div>
                  <label className="text-sm font-medium">Grant Type</label>
                  <Input value={formData.grantType} onChange={e => setFormData(p => ({ ...p, grantType: e.target.value }))} placeholder="e.g., workforce, justice, education" data-testid="input-grant-type" />
                </div>
                <div>
                  <label className="text-sm font-medium">Source URL</label>
                  <Input value={formData.sourceUrl} onChange={e => setFormData(p => ({ ...p, sourceUrl: e.target.value }))} placeholder="https://..." data-testid="input-grant-url" />
                </div>
                <div>
                  <label className="text-sm font-medium">Focus Areas (comma-separated)</label>
                  <Input value={formData.focusAreas} onChange={e => setFormData(p => ({ ...p, focusAreas: e.target.value }))} placeholder="workforce, reentry, education" data-testid="input-grant-focus" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description (used for AI analysis)</label>
                <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Paste the full grant description for AI-powered alignment analysis..." rows={4} data-testid="input-grant-description" />
              </div>
              <div>
                <label className="text-sm font-medium">Eligibility Criteria</label>
                <Textarea value={formData.eligibilityCriteria} onChange={e => setFormData(p => ({ ...p, eligibilityCriteria: e.target.value }))} placeholder="Who can apply, requirements..." rows={2} data-testid="input-grant-eligibility" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!formData.title || createMutation.isPending} data-testid="button-submit-grant">
                  {createMutation.isPending ? (
                    <><Sparkles className="mr-2 h-4 w-4 animate-spin" /> Analyzing & Saving...</>
                  ) : (
                    <><Brain className="mr-2 h-4 w-4" /> Save & AI Analyze</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-grant">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="text-sm border rounded-md px-2 py-1 bg-background"
                data-testid="select-filter-category"
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm border rounded-md px-2 py-1 bg-background"
              data-testid="select-filter-status"
            >
              <option value="all">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-sm text-muted-foreground">{filteredGrants.length} grants</span>
          </div>

          {grantsError ? (
            <Card className="p-6 text-center" data-testid="card-grants-error">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="font-medium">Failed to load grants</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} data-testid="button-retry-grants">Retry</Button>
            </Card>
          ) : grantsLoading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading grants...</Card>
          ) : filteredGrants.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-no-grants">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No grant opportunities match your filters.</p>
              <p className="text-sm mt-1">Try searching SAM.gov or adding a grant manually.</p>
            </Card>
          ) : (
            filteredGrants.map(grant => {
              const analysis = grant.fitAnalysis as FitAnalysis | null;
              const isExpanded = expandedGrant === grant.id;
              return (
                <Card key={grant.id} className="p-5" data-testid={`card-grant-${grant.id}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold">{grant.title}</h3>
                          <FitScoreBadge score={grant.fitScore} />
                          <StatusBadge status={grant.status} />
                          {analysis?.aiRecommendation && (
                            <Badge variant={analysis.aiRecommendation === "strong_match" ? "default" : "secondary"} className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {analysis.aiRecommendation.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                        {grant.agency && <p className="text-sm text-muted-foreground">{grant.agency}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          {grant.fundingAmount && <p className="text-sm font-medium text-primary">{grant.fundingAmount}</p>}
                          {grant.deadline && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(grant.deadline).toLocaleDateString()}
                              {daysUntil(grant.deadline as unknown as string) > 0 && ` (${daysUntil(grant.deadline as unknown as string)}d)`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline" size="icon"
                          onClick={() => aiAnalyzeMutation.mutate(grant.id)}
                          disabled={aiAnalyzeMutation.isPending}
                          title="Run AI Analysis"
                          data-testid={`button-ai-analyze-${grant.id}`}
                        >
                          <Brain className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setExpandedGrant(isExpanded ? null : grant.id)} data-testid={`button-expand-${grant.id}`}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {grant.sourceUrl && (
                          <a href={grant.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" data-testid={`button-grant-link-${grant.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <Button variant="outline" size="icon" onClick={() => deleteMutation.mutate(grant.id)} data-testid={`button-delete-grant-${grant.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {analysis?.aiSummary && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{analysis.aiSummary}</p>
                    )}

                    {isExpanded && (
                      <div className="space-y-4 border-t pt-4">
                        {grant.description && <p className="text-sm text-muted-foreground">{grant.description}</p>}

                        {analysis?.aiStrengths && analysis.aiStrengths.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> What We Have
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {analysis.aiStrengths.map((s, i) => (
                                <div key={i} className="p-2 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{s.area}</p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{s.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis?.aiGaps && analysis.aiGaps.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" /> What We Need to Build
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {analysis.aiGaps.map((g, i) => (
                                <div key={i} className="p-2 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{g.area}</p>
                                  <p className="text-xs text-amber-600 dark:text-amber-400">{g.description}</p>
                                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">{g.recommendation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {grant.focusAreas && (grant.focusAreas as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(grant.focusAreas as string[]).map(area => (
                              <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                            ))}
                          </div>
                        )}

                        {Array.isArray(grant.readinessChecklist) && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Readiness ({((grant.readinessChecklist as Array<{ status: string }>).filter(c => c.status === "ready").length)}/{(grant.readinessChecklist as Array<{ status: string }>).length} criteria met)
                            </p>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{
                                width: `${((grant.readinessChecklist as Array<{ status: string }>).filter(c => c.status === "ready").length / (grant.readinessChecklist as Array<{ status: string }>).length) * 100}%`
                              }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === "search" && (
        <div className="space-y-4">
          <Card className="p-5" data-testid="card-sam-search">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" /> Search SAM.gov Federal Grants
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search the federal grants database for opportunities matching your platform capabilities.
            </p>
            <div className="flex gap-2">
              <Input
                value={samKeywords}
                onChange={e => setSamKeywords(e.target.value)}
                placeholder="Keywords: workforce, reentry, youth development..."
                className="flex-1"
                onKeyDown={e => e.key === "Enter" && searchSAM()}
                data-testid="input-sam-keywords"
              />
              <Button onClick={searchSAM} disabled={samSearching} data-testid="button-search-sam-submit">
                {samSearching ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Searching...</>
                ) : (
                  <><Search className="mr-2 h-4 w-4" /> Search</>
                )}
              </Button>
            </div>
          </Card>

          {samResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{samResults.length} opportunities found</p>
              {samResults.map(result => (
                <Card key={result.noticeId} className="p-4" data-testid={`card-sam-result-${result.noticeId}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium text-sm">{result.title}</h4>
                        <FitScoreBadge score={result.fitScore} />
                      </div>
                      <p className="text-xs text-muted-foreground">{result.agency}</p>
                      {result.responseDate && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Deadline: {new Date(result.responseDate).toLocaleDateString()}
                        </p>
                      )}
                      {result.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{result.description}</p>
                      )}
                      {result.matchedAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.matchedAreas.map(a => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => importSAMMutation.mutate(result)}
                        disabled={importSAMMutation.isPending}
                        data-testid={`button-import-${result.noticeId}`}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Import
                      </Button>
                      <a href={result.uiLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" data-testid={`button-sam-link-${result.noticeId}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {samResults.length === 0 && !samSearching && (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-sam-empty">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Search SAM.gov for federal grant opportunities.</p>
              <p className="text-sm mt-1">Enter keywords or click Search to find grants matching your platform.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5" data-testid="card-report-alignment">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Grant Alignment Report</h3>
                  <p className="text-sm text-muted-foreground mt-1">Platform capabilities mapped against all tracked grants with fit scoring.</p>
                  <div className="flex gap-2 mt-3">
                    <a href="/api/grants/export/csv" download>
                      <Button variant="outline" size="sm" data-testid="button-export-csv">
                        <Download className="mr-1 h-3 w-3" /> Export CSV
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5" data-testid="card-report-wioa">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">WIOA/DOL Workforce Report</h3>
                  <p className="text-sm text-muted-foreground mt-1">WIOA-aligned metrics: placement rates, credentials, skill gains, employer engagement.</p>
                  <Button
                    variant="outline" size="sm" className="mt-3"
                    onClick={async () => {
                      try {
                        const res = await apiRequest("GET", "/api/grants/report/wioa");
                        const data = await res.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `wioa-report-${new Date().toISOString().split("T")[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: "WIOA report downloaded" });
                      } catch {
                        toast({ title: "Failed to generate WIOA report", variant: "destructive" });
                      }
                    }}
                    data-testid="button-download-wioa"
                  >
                    <Download className="mr-1 h-3 w-3" /> Download WIOA Report
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5" data-testid="card-report-ojjdp">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">OJJDP/DOJ Outcome Report</h3>
                <p className="text-sm text-muted-foreground mt-1">Justice-aligned outcome reporting for OJJDP and DOJ grant compliance. Available from the Outcome Reporting page.</p>
                <Button
                  variant="outline" size="sm" className="mt-3"
                  onClick={() => { window.location.assign("/outcomes"); }}
                  data-testid="button-goto-outcomes"
                >
                  <ArrowRight className="mr-1 h-3 w-3" /> Go to Outcome Reporting
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
