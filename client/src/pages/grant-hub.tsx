import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Link as LinkIcon } from "lucide-react";
import { TrainingGuideButton } from "@/components/training-guide";
import { EvidenceSummary } from "@/components/evidence-label";
import { AIAugmentationDisclosure } from "@/components/ai-augmentation-disclosure";
import { GrantCoach } from "@/components/grant-coach";
import { EngineSelector, getPreferredEngine } from "@/components/engine-selector";
import { PillarFlowNav } from "@/components/dfc-cross-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Search, Plus, Target, CheckCircle2, Clock, AlertTriangle,
  Download, BarChart3, FileText, Trash2, ExternalLink,
  RefreshCw, Bell, Brain, TrendingUp, Calendar, Filter,
  ChevronDown, ChevronUp, Zap, Shield, BookOpen, Heart, Users, ArrowRight, Trophy
} from "lucide-react";
import type { GrantOpportunity } from "@shared/schema";

type TrackedRow = { tracking: { grantId: string; status: string }; grant: { id: string } };

interface ReportMetric {
  label: string;
  description: string;
  target: string;
  dataSource: string;
}

interface ReportProgramArea {
  name: string;
  wioaAlignment: string;
  services: string[];
}

interface ReportComplianceArea {
  area: string;
  details: string;
}

interface ReportData {
  metrics?: Record<string, ReportMetric>;
  programAreas?: ReportProgramArea[];
  dolComplianceAreas?: ReportComplianceArea[];
  evidenceBasedPractices?: string[];
}

interface GrantStats {
  total: number;
  highFit: number;
  mediumFit: number;
  lowFit: number;
  upcomingDeadlines: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  totalFunding: number;
  averageFit: number;
}

interface GrantAlert {
  id: string;
  grantId: string;
  alertType: string;
  title: string;
  message: string;
  fitScore: number | null;
  isRead: boolean;
  createdAt: string;
}

interface StrengthsGaps {
  strengths: Array<{ area: string; detail: string }>;
  gaps: Array<{ area: string; detail: string; effort: string }>;
}

interface AIAnalysis {
  summary: string;
  recommendedActions: string[];
  competitiveAdvantage: string;
}

interface ReadinessChecklistItem {
  criterion: string;
  status: string;
}

function parseStrengthsGaps(val: unknown): StrengthsGaps | null {
  if (!val || typeof val !== "object") return null;
  const obj = val as Record<string, unknown>;
  return {
    strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
    gaps: Array.isArray(obj.gaps) ? obj.gaps : [],
  };
}

function parseAIAnalysis(val: unknown): AIAnalysis | null {
  if (!val || typeof val !== "object") return null;
  const obj = val as Record<string, unknown>;
  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    recommendedActions: Array.isArray(obj.recommendedActions) ? obj.recommendedActions : [],
    competitiveAdvantage: typeof obj.competitiveAdvantage === "string" ? obj.competitiveAdvantage : "",
  };
}

function parseReadinessChecklist(val: unknown): ReadinessChecklistItem[] {
  if (!Array.isArray(val)) return [];
  return val.filter((item): item is ReadinessChecklistItem =>
    typeof item === "object" && item !== null && typeof item.criterion === "string" && typeof item.status === "string"
  );
}

const CATEGORY_ICONS: Record<string, typeof Target> = {
  workforce: TrendingUp,
  justice: Shield,
  education: BookOpen,
  health: Heart,
  community: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  workforce: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  justice: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  education: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  health: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  community: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <Badge variant="outline" data-testid="badge-fit-none">Not scored</Badge>;
  if (score >= 70) return <Badge className="bg-emerald-600 text-white" data-testid="badge-fit-high">{score}% Fit</Badge>;
  if (score >= 40) return <Badge className="bg-amber-600 text-white" data-testid="badge-fit-medium">{score}% Fit</Badge>;
  return <Badge variant="destructive" data-testid="badge-fit-low">{score}% Fit</Badge>;
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

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const colorClass = CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>{category}</span>;
}

function GrantDetailDialog({ grant }: { grant: GrantOpportunity }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const aiAnalyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/grants/${grant.id}/ai-analyze`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/stats"] });
      toast({ title: "AI analysis complete" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "AI analysis failed. Please try again.", variant: "destructive" });
    },
  });

  const sg = parseStrengthsGaps(grant.strengthsGaps);
  const ai = parseAIAnalysis(grant.aiAnalysis);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-view-grant-${grant.id}`}>Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{grant.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <FitScoreBadge score={grant.fitScore} />
            <StatusBadge status={grant.status} />
            <CategoryBadge category={grant.category} />
            {grant.source === "samgov" && <Badge variant="outline" className="text-xs">SAM.gov</Badge>}
          </div>

          {grant.agency && <div><span className="text-sm font-medium text-muted-foreground">Agency:</span> <span className="text-sm">{grant.agency}</span></div>}
          {grant.fundingAmount && <div><span className="text-sm font-medium text-muted-foreground">Funding:</span> <span className="text-sm font-semibold text-primary">{grant.fundingAmount}</span></div>}
          {grant.deadline && <div><span className="text-sm font-medium text-muted-foreground">Deadline:</span> <span className="text-sm">{new Date(grant.deadline).toLocaleDateString()}</span></div>}
          {grant.cfda && <div><span className="text-sm font-medium text-muted-foreground">CFDA:</span> <span className="text-sm">{grant.cfda}</span></div>}

          {grant.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grant.description}</p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => aiAnalyzeMutation.mutate()}
            disabled={aiAnalyzeMutation.isPending}
            data-testid={`button-ai-analyze-${grant.id}`}
          >
            <Brain className="h-4 w-4 mr-1" />
            {aiAnalyzeMutation.isPending ? "Analyzing..." : "Run AI Analysis"}
          </Button>

          {ai && (
            <>
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold flex items-center gap-1 mb-2"><Brain className="h-4 w-4" /> AI Analysis</h4>
              <p className="text-sm mb-3">{ai.summary}</p>
              {ai.competitiveAdvantage && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Competitive Advantage: </span>
                  <span className="text-sm">{ai.competitiveAdvantage}</span>
                </div>
              )}
              {ai.recommendedActions?.length > 0 && (
                <div>
                  <span className="text-xs font-medium">Recommended Actions:</span>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {ai.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </Card>
            <AIAugmentationDisclosure
              compact
              drewFrom={["Grant opportunity details", "organization-provided priorities"]}
              doesNotKnow={["final funder decisions", "changes not yet reflected in source records"]}
              verifyWith="The funder's current notice of funding opportunity"
            />
            </>
          )}

          {sg && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sg.strengths?.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1 mb-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> What We Have
                  </h4>
                  <ul className="space-y-2">
                    {sg.strengths.map((s, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{s.area}:</span> {s.detail}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {sg.gaps?.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1 mb-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> What We Need to Build
                  </h4>
                  <ul className="space-y-2">
                    {sg.gaps.map((g, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{g.area}:</span> {g.detail}
                        <Badge variant="outline" className="ml-1 text-xs">{g.effort}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {(() => {
            const checklist = parseReadinessChecklist(grant.readinessChecklist);
            return checklist.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Readiness Checklist</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {item.status === "ready" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-muted-foreground shrink-0" />
                      )}
                      <span className={item.status === "ready" ? "" : "text-muted-foreground"}>{item.criterion}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PasteRfpUrlCard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");
  const ingest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/grants/ingest-from-url", { url });
      return res.json() as Promise<{ grantId: string; title: string; warning: string | null; next: { rfpFidelity: string; rfpWriter: string; myGrants: string } }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/tracked"] });
      toast({
        title: data.warning ? "Saved — partial parse" : `Ingested "${data.title}"`,
        description: data.warning || "Opening the RFP Fidelity Engine so you can run the compliance matrix.",
      });
      setUrl("");
      setLocation(data.next.rfpFidelity);
    },
    onError: (e: Error) => {
      const msg = e.message || "Could not ingest that URL.";
      if (msg.includes("401")) {
        toast({ title: "Sign in to ingest a URL", variant: "destructive" });
      } else {
        toast({ title: "Ingest failed", description: msg, variant: "destructive" });
      }
    },
  });
  return (
    <Card className="p-4 border-l-4 border-l-primary bg-primary/5" data-testid="card-paste-rfp-url">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Paste an RFP URL</label>
          <p className="text-xs text-muted-foreground">
            Drop in any grants.gov, SAM.gov, foundation, or state portal URL. We'll fetch it, extract the text,
            track it on your pipeline, and open the RFP Fidelity Engine so you can run the compliance matrix and
            draft against the rubric — no copy-paste needed.
          </p>
          <Input
            type="url"
            placeholder="https://www.grants.gov/search-results-detail/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && url.trim() && !ingest.isPending) ingest.mutate(); }}
            disabled={ingest.isPending}
            data-testid="input-paste-rfp-url"
          />
        </div>
        <Button
          onClick={() => ingest.mutate()}
          disabled={!url.trim() || ingest.isPending}
          data-testid="button-paste-rfp-url-submit"
          className="shrink-0"
        >
          {ingest.isPending ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Ingesting…</> : <><ArrowRight className="mr-2 h-4 w-4" />Ingest &amp; draft</>}
        </Button>
      </div>
    </Card>
  );
}

export default function GrantHubPage() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  type TabId = "grants" | "calendar" | "compare" | "alerts" | "reports" | "outlook";
  const [activeTab, setActiveTab] = useState<TabId>("grants");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [formData, setFormData] = useState({ title: "", agency: "", fundingAmount: "", description: "", eligibilityCriteria: "", focusAreas: "", sourceUrl: "", grantType: "" });
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [liveTotal, setLiveTotal] = useState<number | null>(null);
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const liveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preferredEngine, setPreferredEngine] = useState<string>(getPreferredEngine());
  const [showAIHunt, setShowAIHunt] = useState(false);
  const [huntOrgDesc, setHuntOrgDesc] = useState("");
  const [huntState, setHuntState] = useState("");
  interface AIHuntResult {
    id: string; title: string; agency: string; synopsis: string;
    closeDate?: string; openDate?: string; cfdaList: string[];
    sourceUrl: string; matchedQuery: string; fitScore: number; reason: string; number?: string;
  }
  interface AIHuntResponse {
    results: AIHuntResult[]; queriesUsed: string[]; orgType: string;
    primaryDomains: string[]; totalFound: number; orgName?: string;
  }
  const [huntResults, setHuntResults] = useState<AIHuntResponse | null>(null);
  const [saveHuntToDb, setSaveHuntToDb] = useState(true);

  const { data: rawGrants, isLoading, error: grantsError } = useQuery<GrantOpportunity[]>({
    queryKey: ["/api/grants", { category: categoryFilter !== "all" ? categoryFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/grants?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch grants");
      return res.json();
    },
  });
  const grants = rawGrants ?? [];

  const { data: stats } = useQuery<GrantStats>({ queryKey: ["/api/grants/stats"] });

  // Auto-load org profile for entity-aligned hunt
  const { data: orgProfile } = useQuery<{ name: string; missionText?: string; focusAreas?: string[]; state?: string } | null>({
    queryKey: ["/api/me/organization"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/me/organization", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Pre-fill hunt description from org profile once loaded (only if user hasn't typed)
  useEffect(() => {
    if (orgProfile && !huntOrgDesc && orgProfile.name) {
      const desc = [orgProfile.name, orgProfile.missionText].filter(Boolean).join(". ");
      if (desc.length >= 10) setHuntOrgDesc(desc);
      if (!huntState && orgProfile.state) setHuntState(orgProfile.state);
    }
  }, [orgProfile]);
  const { data: rawAlerts } = useQuery<GrantAlert[]>({ queryKey: ["/api/grants/alerts"] });
  const alerts = rawAlerts ?? [];
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  interface DiscoveryStatus {
    automated: boolean;
    frequency: string;
    lastRun: string;
    nextRun: string;
    apiKeyConfigured: boolean;
    searchDomains: string[];
    totalGrantsTracked: number;
    highFitGrants: number;
    sources: string[];
  }
  const { data: discoveryStatus } = useQuery<DiscoveryStatus>({ queryKey: ["/api/grants/discovery/status"] });

  interface OutlookOpportunity {
    id: string; title: string; agency: string | null; description: string | null;
    fundingAmount: string | null; deadline: string | null; daysToDeadline: number | null;
    fitScore: number | null; status: string | null; source: string | null; sourceUrl: string | null;
    matchedAreas: string[]; matchedKeywords: string[]; story: string; howToPresent: string;
    hasAiAnalysis: boolean;
  }
  interface OutlookResponse { generatedAt: string; windowStart: string; windowEnd: string; total: number; opportunities: OutlookOpportunity[]; }
  const { data: outlookData, isLoading: outlookLoading, refetch: refetchOutlook, isFetching: outlookFetching } = useQuery<OutlookResponse>({
    queryKey: ["/api/grants/next-90-days"],
    enabled: activeTab === "outlook",
  });
  const outlookOpportunities = outlookData?.opportunities ?? [];

  // Gate /api/me/* queries on auth state — these endpoints are requireOrg
  // and will 404 ORG_REQUIRED for signed-in-no-org users. Without gating,
  // the queryClient used to hard-reload to /onboarding/org on every page
  // visit (the source of Eric's "every link bounces" experience).
  const { data: trackedData } = useQuery<{ tracked: TrackedRow[] }>({
    queryKey: ["/api/me/grants/tracked"],
    enabled: isAuthenticated,
  });
  const trackedMap = new Map<string, string>();
  (trackedData?.tracked ?? []).forEach(r => trackedMap.set(r.tracking.grantId, r.tracking.status));

  const pursueMutation = useMutation({
    mutationFn: async (grantId: string) => {
      const res = await apiRequest("POST", `/api/me/grants/${grantId}/track`, { status: "pursuing" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/tracked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/win-rate"] });
      toast({ title: "Grant of record", description: "Added to My Grants. Open the tracker to set status or write a draft." });
    },
    onError: (e: Error) => {
      const msg = (e.message || "").toLowerCase();
      if (msg.includes("401") || msg.includes("unauthor")) {
        toast({ title: "Sign in required", description: "Sign in to mark a grant of record.", variant: "destructive" });
      } else if (msg.includes("403") || msg.includes("organization") || msg.includes("requireorg")) {
        toast({ title: "Organization profile required", description: "Create your org profile first (Settings → Organization).", variant: "destructive" });
      } else {
        toast({ title: "Couldn't track grant", description: e.message, variant: "destructive" });
      }
    },
  });

  const untrackMutation = useMutation({
    mutationFn: async (grantId: string) => apiRequest("DELETE", `/api/me/grants/${grantId}/track`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/grants/tracked"] });
      toast({ title: "Removed from My Grants" });
    },
  });

  const scanNowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/grants/discovery/run-now");
      return res.json();
    },
    onSuccess: (data: { imported: number; skipped: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/discovery/status"] });
      toast({ title: "Discovery Scan Complete", description: `Found ${data.total} opportunities. ${data.imported} new grants imported, ${data.skipped} already tracked.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Discovery scan failed. Will retry automatically on next scheduled run.", variant: "destructive" });
    },
  });

  // Collect unique entity names for filter dropdown
  const entityNames = Array.from(new Set(grants.map(g => (g as any).entityName).filter(Boolean))).sort() as string[];

  const filteredGrants = grants.filter(g => {
    if (entityFilter !== "all" && (g as any).entityName !== entityFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      (g.agency || "").toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q) ||
      ((g as any).entityName || "").toLowerCase().includes(q)
    );
  });

  // Debounced live search — fires 600ms after the user stops typing (min 3 chars)
  useEffect(() => {
    if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current);
    if (searchQuery.trim().length < 3) {
      setLiveResults([]);
      setLiveTotal(null);
      setIsLiveSearching(false);
      return;
    }
    setIsLiveSearching(true);
    liveDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/grants/live-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          // Filter out grants already in our DB (matched by title prefix)
          const dbTitles = new Set(grants.map(g => g.title.toLowerCase().slice(0, 40)));
          const fresh = (data.results || []).filter(
            (r: any) => !dbTitles.has(r.title.toLowerCase().slice(0, 40))
          );
          setLiveResults(fresh);
          setLiveTotal(data.total ?? fresh.length);
        }
      } catch {
        // silent — live search is best-effort
      } finally {
        setIsLiveSearching(false);
      }
    }, 600);
    return () => { if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current); };
  }, [searchQuery]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/grants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/stats"] });
      setShowForm(false);
      setFormData({ title: "", agency: "", fundingAmount: "", description: "", eligibilityCriteria: "", focusAreas: "", sourceUrl: "", grantType: "" });
      toast({ title: "Grant opportunity added with AI analysis" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/grants/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/stats"] });
      toast({ title: "Grant removed" });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/grants/refresh-samgov");
      return res.json();
    },
    onSuccess: (data: { imported: number; skipped: number; newHighFitAlerts: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/alerts"] });
      toast({ title: `SAM.gov Refresh Complete`, description: `Imported ${data.imported} new opportunities (${data.skipped} already existed). ${data.newHighFitAlerts} high-fit alerts created.` });
    },
    onError: (error: Error) => {
      const msg = error.message || "";
      const isAuth = /401|unauthorized/i.test(msg);
      toast({
        title: isAuth ? "Sign in required" : "SAM.gov refresh failed",
        description: isAuth
          ? "Click Sign In in the sidebar, then try Refresh SAM.gov again."
          : (msg || "Try again in a moment, or check that the SAM.gov API key is configured."),
        variant: "destructive",
      });
    },
  });

  const markAlertReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/grants/alerts/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants/alerts"] });
    },
  });

  const aiHuntMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/grants/ai-hunt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgDescription: huntOrgDesc || undefined, state: huntState || undefined, saveToDb: saveHuntToDb }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI hunt failed");
      }
      return res.json() as Promise<AIHuntResponse>;
    },
    onSuccess: (data) => {
      setHuntResults(data);
      if (saveHuntToDb) {
        queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
        queryClient.invalidateQueries({ queryKey: ["/api/grants/stats"] });
      }
      toast({ title: `AI Grant Hunt complete`, description: `Found ${data.totalFound} grants on Grants.gov, ranked top ${data.results.length} by fit${saveHuntToDb ? " — top matches saved to your pipeline" : ""}.` });
    },
    onError: (e: Error) => {
      toast({ title: "AI Hunt failed", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const fa = formData.focusAreas.split(",").map(s => s.trim()).filter(Boolean);
    createMutation.mutate({ ...formData, focusAreas: fa.length ? fa : undefined });
  };

  const handleExportCSV = () => {
    window.open("/api/grants/report/export-csv", "_blank");
  };

  const handleExportReport = () => {
    window.open("/api/grants/report/export-pdf", "_blank");
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-grant-hub-title">Grant Discovery Hub</h1>
          <p className="text-muted-foreground mt-1">Discover, analyze, and track grant opportunities with AI-powered alignment scoring</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrainingGuideButton moduleId="grant-hub" />
          <Button
            variant={showAIHunt ? "default" : "outline"}
            onClick={() => { setShowAIHunt(!showAIHunt); if (showAIHunt) setHuntResults(null); }}
            data-testid="button-ai-hunt"
            className={showAIHunt ? "bg-violet-600 hover:bg-violet-700 text-white" : "border-violet-400 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"}
          >
            <Brain className={`mr-2 h-4 w-4 ${aiHuntMutation.isPending ? "animate-spin" : ""}`} />
            {aiHuntMutation.isPending ? "AI Hunting…" : "AI Grant Hunt"}
          </Button>
          <Button
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            data-testid="button-refresh-samgov"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            {refreshMutation.isPending ? "Searching..." : "Refresh SAM.gov"}
          </Button>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-grant">
            <Plus className="mr-2 h-4 w-4" /> Add Grant
          </Button>
        </div>
      </div>

      <PasteRfpUrlCard />

      <EvidenceSummary claims={[{
        value: null, unit: "grant opportunities", source: "SAM.gov Federal Awards + BidNet/RFPMart",
        sourceId: "sam-gov-awards", asOfDate: null, geographyKey: null, confidence: "verified",
        decisionCaption: "Use current opportunity details and eligibility requirements to prioritize your grant pipeline.",
      }]} />

      {/* ── Grant Coach + Engine Selector ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <GrantCoach className="flex-1" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">AI engine:</span>
          <EngineSelector
            value={preferredEngine}
            onChange={setPreferredEngine}
            className="text-xs"
          />
        </div>
      </div>

      {showAIHunt && (
        <Card className="p-5 border-violet-200 dark:border-violet-800 bg-violet-50/40 dark:bg-violet-950/20" data-testid="card-ai-hunt">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Brain className="h-5 w-5 text-violet-600" />
            <h2 className="font-semibold text-sm text-violet-800 dark:text-violet-200">AI Grant Hunt — Any Organization</h2>
            <span className="text-xs text-muted-foreground">Claude generates targeted queries · fires them at Grants.gov · scores every result</span>
            {orgProfile?.name && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 font-medium ml-auto">
                ⚡ Entity: {orgProfile.name}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Organization context
                {orgProfile?.name && <span className="text-violet-600 ml-1">(auto-loaded from your profile — edit if demoing a different org)</span>}
              </label>
              <Textarea
                value={huntOrgDesc}
                onChange={e => setHuntOrgDesc(e.target.value)}
                placeholder="e.g. A behavioral health nonprofit in Austin TX focused on opioid recovery and workforce re-entry for justice-involved adults. Partners include Travis County and CommUnityCare."
                rows={3}
                className="resize-none"
                data-testid="input-hunt-org-desc"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">State (optional)</label>
                <Input
                  value={huntState}
                  onChange={e => setHuntState(e.target.value)}
                  placeholder="e.g. Texas"
                  data-testid="input-hunt-state"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveHuntToDb}
                  onChange={e => setSaveHuntToDb(e.target.checked)}
                  className="accent-violet-600"
                  data-testid="checkbox-save-hunt"
                />
                <span className="text-xs text-muted-foreground">Save top matches to pipeline + sync RAG</span>
              </label>
              <Button
                onClick={() => aiHuntMutation.mutate()}
                disabled={aiHuntMutation.isPending || huntOrgDesc.trim().length < 10}
                className="mt-auto bg-violet-600 hover:bg-violet-700 text-white w-full"
                data-testid="button-run-ai-hunt"
              >
                <Brain className={`mr-2 h-4 w-4 ${aiHuntMutation.isPending ? "animate-spin" : ""}`} />
                {aiHuntMutation.isPending ? "Hunting…" : "Find Grants"}
              </Button>
            </div>
          </div>
          {aiHuntMutation.isPending && (
            <div className="mt-3 text-xs text-violet-600 flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Generating queries → firing at Grants.gov in parallel → scoring results… (~15s)
            </div>
          )}
          {huntResults && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">{huntResults.totalFound} grants found</span>
              <span className="text-xs text-muted-foreground">Queries used:</span>
              {huntResults.queriesUsed.map(q => (
                <span key={q} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">{q}</span>
              ))}
              {huntResults.primaryDomains.length > 0 && (
                <>
                  <span className="text-xs text-muted-foreground ml-1">Domains:</span>
                  {huntResults.primaryDomains.map(d => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{d}</span>
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      )}

      {discoveryStatus && (
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" data-testid="card-discovery-status">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Zap className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Daily Automated Grant Discovery</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scanning {(discoveryStatus.searchDomains ?? []).length} domains across {(discoveryStatus.sources ?? []).length} sources every 24 hours.
                  {discoveryStatus.lastRun !== "Not yet run" && (
                    <> Last scan: {new Date(discoveryStatus.lastRun).toLocaleString()}.</>
                  )}
                  {discoveryStatus.highFitGrants > 0 && (
                    <span className="text-emerald-600 font-medium"> {discoveryStatus.highFitGrants} high-fit matches found.</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(discoveryStatus.sources ?? []).map(s => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">{s}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(discoveryStatus.searchDomains ?? []).slice(0, 8).map(d => (
                    <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">{d}</span>
                  ))}
                  {(discoveryStatus.searchDomains ?? []).length > 8 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">+{(discoveryStatus.searchDomains ?? []).length - 8} more</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => scanNowMutation.mutate()}
              disabled={scanNowMutation.isPending}
              className="shrink-0"
              data-testid="button-scan-now"
            >
              <RefreshCw className={`mr-2 h-3 w-3 ${scanNowMutation.isPending ? "animate-spin" : ""}`} />
              {scanNowMutation.isPending ? "Scanning All Sources..." : "Scan Now"}
            </Button>
          </div>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4 text-center" data-testid="card-stat-total">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Grants</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-high-fit">
            <p className="text-2xl font-bold text-emerald-600">{stats.highFit}</p>
            <p className="text-xs text-muted-foreground">High Fit (70%+)</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-medium-fit">
            <p className="text-2xl font-bold text-amber-600">{stats.mediumFit}</p>
            <p className="text-xs text-muted-foreground">Medium Fit</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-deadlines">
            <p className="text-2xl font-bold text-red-600">{stats.upcomingDeadlines}</p>
            <p className="text-xs text-muted-foreground">Deadlines (30d)</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-avg-fit">
            <p className="text-2xl font-bold text-blue-600">{stats.averageFit}%</p>
            <p className="text-xs text-muted-foreground">Avg Fit Score</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-funding">
            <p className="text-2xl font-bold text-violet-600">{stats.totalFunding > 0 ? `$${(stats.totalFunding / 1000000).toFixed(1)}M` : "$0"}</p>
            <p className="text-xs text-muted-foreground">Est. Funding</p>
          </Card>
        </div>
      )}

      {stats?.byCategory && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(stats.byCategory).map(([cat, count]) => {
            const Icon = CATEGORY_ICONS[cat] || Target;
            return (
              <Card
                key={cat}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${categoryFilter === cat ? "ring-2 ring-primary" : ""}`}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                data-testid={`card-category-${cat}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium capitalize">{cat}</p>
                    <p className="text-xs text-muted-foreground">{count} grants</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="space-y-4">
        <TabsList data-testid="tabs-grant-sections">
          <TabsTrigger value="grants" data-testid="tab-grants">Grants</TabsTrigger>
          <TabsTrigger value="outlook" data-testid="tab-outlook">
            <TrendingUp className="h-4 w-4 mr-1" />
            90-Day Outlook
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-4 w-4 mr-1" />
            Deadlines
          </TabsTrigger>
          {compareIds.size >= 2 && (
            <TabsTrigger value="compare" data-testid="tab-compare">
              Compare ({compareIds.size})
            </TabsTrigger>
          )}
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Alerts {unreadAlerts > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5 w-5 p-0 flex items-center justify-center">{unreadAlerts}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="grants" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              {isLiveSearching
                ? <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                : liveResults.length > 0 && searchQuery.trim().length >= 3
                ? <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-red-500">⬤</span>
                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              }
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search grants — live Grants.gov results appear as you type"
                className="pl-9"
                data-testid="input-search-grants"
              />
              {searchQuery.trim().length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isLiveSearching && <span className="text-[10px] text-blue-500 font-medium">Searching live…</span>}
                  {!isLiveSearching && liveResults.length > 0 && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                      ⬤ LIVE · {liveTotal !== null && liveTotal > liveResults.length ? `${liveTotal} on Grants.gov` : `${liveResults.length} new`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="workforce">Workforce</SelectItem>
                <SelectItem value="justice">Justice</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="researching">Researching</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            {entityNames.length > 0 && (
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-entity-filter">
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entityNames.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {showForm && (
            <Card className="p-6 space-y-4" data-testid="card-grant-form">
              <h2 className="font-semibold text-lg">Add Grant Opportunity</h2>
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
                <label className="text-sm font-medium">Description</label>
                <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Grant description and objectives..." rows={3} data-testid="input-grant-description" />
              </div>
              <div>
                <label className="text-sm font-medium">Eligibility Criteria</label>
                <Textarea value={formData.eligibilityCriteria} onChange={e => setFormData(p => ({ ...p, eligibilityCriteria: e.target.value }))} placeholder="Who can apply, requirements..." rows={2} data-testid="input-grant-eligibility" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={!formData.title || createMutation.isPending} data-testid="button-submit-grant">
                  {createMutation.isPending ? "Saving..." : "Save & Analyze Fit"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-grant">Cancel</Button>
              </div>
            </Card>
          )}

          {grantsError ? (
            <Card className="p-6 text-center" data-testid="card-grants-error">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="font-medium">Failed to load grants</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/grants"] })} data-testid="button-retry-grants">Retry</Button>
            </Card>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-5">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredGrants.length === 0 && liveResults.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-no-grants">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No grant opportunities found.</p>
              <p className="text-sm mt-1">
                {searchQuery.trim().length >= 3 && isLiveSearching
                  ? "Searching Grants.gov live…"
                  : searchQuery.trim().length >= 3
                  ? "Nothing matched in your pipeline or Grants.gov for this term."
                  : "Type a search term to pull live results from Grants.gov, or click \"Refresh SAM.gov\" to run a full scan."}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* AI Hunt results — ranked, scored, with reasoning */}
              {huntResults && huntResults.results.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <Brain className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-xs font-bold text-violet-600">AI GRANT HUNT RESULTS</span>
                    <span className="text-xs text-muted-foreground">— {huntResults.totalFound} found · ranked by AI fit score</span>
                  </div>
                  {huntResults.results.map((grant) => (
                    <Card key={`hunt-${grant.id}`} className="p-5 hover:shadow-md transition-shadow border-violet-200 dark:border-violet-800 bg-violet-50/20 dark:bg-violet-950/10" data-testid={`card-hunt-${grant.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{grant.title}</h3>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${grant.fitScore >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : grant.fitScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                              {grant.fitScore}% fit
                            </span>
                            {grant.number && <Badge variant="outline" className="text-xs">#{grant.number}</Badge>}
                            <Badge className="text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-0">AI Hunt</Badge>
                          </div>
                          {grant.agency && <p className="text-sm text-muted-foreground">{grant.agency}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {grant.closeDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Deadline: {new Date(grant.closeDate).toLocaleDateString()}
                              </span>
                            )}
                            {grant.matchedQuery && (
                              <span className="text-xs text-muted-foreground">Query: <em>{grant.matchedQuery}</em></span>
                            )}
                          </div>
                          {grant.synopsis && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{grant.synopsis}</p>}
                          {grant.reason && (
                            <p className="text-xs text-violet-700 dark:text-violet-300 mt-2 flex items-start gap-1">
                              <Brain className="h-3 w-3 mt-0.5 shrink-0" />
                              {grant.reason}
                            </p>
                          )}
                          {grant.cfdaList.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {grant.cfdaList.map((c: string) => (
                                <Badge key={c} variant="secondary" className="text-xs">CFDA {c}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {grant.sourceUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={grant.sourceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" /> Grants.gov
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">LIVE SEARCH & YOUR PIPELINE</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </>
              )}

              {/* Live results from Grants.gov — appear at top when searching */}
              {liveResults.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-red-500">⬤ LIVE FROM GRANTS.GOV</span>
                    <span className="text-xs text-muted-foreground">— not yet in your pipeline</span>
                    {liveTotal !== null && liveTotal > liveResults.length && (
                      <span className="text-xs text-muted-foreground">· {liveTotal.toLocaleString()} total matching</span>
                    )}
                  </div>
                  {liveResults.map((grant: any) => (
                    <Card key={grant.id} className="p-5 hover:shadow-md transition-shadow border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10" data-testid={`card-grant-${grant.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{grant.title}</h3>
                            <Badge className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0">⬤ LIVE</Badge>
                            {grant.samgovId && <Badge variant="outline" className="text-xs">#{grant.samgovId}</Badge>}
                          </div>
                          {grant.agency && <p className="text-sm text-muted-foreground">{grant.agency}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {grant.deadline && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Deadline: {new Date(grant.deadline).toLocaleDateString()}
                              </span>
                            )}
                            {grant.postedDate && (
                              <span className="text-xs text-muted-foreground">Posted: {new Date(grant.postedDate).toLocaleDateString()}</span>
                            )}
                          </div>
                          {grant.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{grant.description}</p>}
                          {Array.isArray(grant.focusAreas) && grant.focusAreas.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {grant.focusAreas.map((area: string) => (
                                <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {grant.sourceUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={grant.sourceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" /> View on Grants.gov
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {filteredGrants.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">YOUR PIPELINE</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                </>
              )}
              {filteredGrants.map(grant => (
                <Card key={grant.id} className="p-5 hover:shadow-md transition-shadow" data-testid={`card-grant-${grant.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold" data-testid={`text-grant-title-${grant.id}`}>{grant.title}</h3>
                        <FitScoreBadge score={grant.fitScore} />
                        <StatusBadge status={grant.status} />
                        <CategoryBadge category={grant.category} />
                        {(grant as any).entityName && (
                          <Badge variant="outline" className="text-xs border-violet-300 text-violet-700 dark:text-violet-300 dark:border-violet-700 cursor-pointer" onClick={() => setEntityFilter((grant as any).entityName)} data-testid={`badge-entity-${grant.id}`}>
                            ⚡ {(grant as any).entityName}
                          </Badge>
                        )}
                        {grant.source === "ai-hunt" && !(grant as any).entityName && (
                          <Badge variant="outline" className="text-xs border-violet-300 text-violet-600 dark:text-violet-400">AI Hunt</Badge>
                        )}
                        {grant.source && grant.source !== "ai-hunt" && (
                          <Badge variant="outline" className="text-xs" data-testid={`badge-source-${grant.id}`}>
                            {grant.source === "samgov" ? "SAM.gov" :
                             grant.source === "grants.gov" ? "Grants.gov" :
                             grant.source === "usaspending" ? "USASpending" :
                             grant.source === "state_texas" ? "Texas State" :
                             grant.source === "foundation" ? "Foundation" :
                             grant.source === "corporate" ? "Corporate" :
                             grant.source === "accelerator" ? "Accelerator" :
                             grant.source === "federal_va" ? "VA Federal" :
                             grant.source === "federal_doj" ? "DOJ Federal" :
                             grant.source === "federal_samhsa" ? "SAMHSA" :
                             grant.source === "federal_sba" ? "SBA" :
                             grant.source === "federal_fema" ? "FEMA" :
                             grant.source}
                          </Badge>
                        )}
                      </div>
                      {grant.agency && <p className="text-sm text-muted-foreground">{grant.agency}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {grant.fundingAmount && <span className="text-sm font-medium text-primary">{grant.fundingAmount}</span>}
                        {grant.deadline && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Deadline: {new Date(grant.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {grant.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{grant.description}</p>}
                      {Array.isArray(grant.focusAreas) && grant.focusAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(grant.focusAreas as unknown[]).map(String).map(area => (
                            <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                          ))}
                        </div>
                      )}
                      {parseAIAnalysis(grant.aiAnalysis) !== null && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          AI Analyzed
                        </div>
                      )}
                      {(() => {
                        const cl = parseReadinessChecklist(grant.readinessChecklist);
                        const ready = cl.filter(c => c.status === "ready").length;
                        return cl.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Readiness ({ready}/{cl.length} criteria)
                            </p>
                            <Progress value={(ready / cl.length) * 100} className="h-2" />
                          </div>
                        ) : null;
                      })()}
                      {!!(grant as Record<string, unknown>).teamOfTeams && Array.isArray((grant as Record<string, unknown>).teamOfTeams) && (
                        <div className="mt-3 border-t pt-2" data-testid={`team-of-teams-${grant.id}`}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Users className="h-3 w-3" /> Ecosystem Team-of-Teams
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {((grant as Record<string, unknown>).teamOfTeams as Array<{role: string; platform: string; url: string; reason: string}>).map((assignment, idx) => (
                              <a
                                key={idx}
                                href={assignment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 hover:opacity-80 transition-opacity ${
                                  assignment.role === "Lead" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-1 ring-blue-300" :
                                  assignment.role === "Support" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                                  "bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                }`}
                                title={assignment.reason}
                                data-testid={`team-assignment-${grant.id}-${idx}`}
                              >
                                <span className="font-bold">{assignment.role}:</span> {assignment.platform}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer" data-testid={`label-compare-${grant.id}`}>
                        <input
                          type="checkbox"
                          checked={compareIds.has(grant.id)}
                          onChange={() => {
                            setCompareIds(prev => {
                              const next = new Set(prev);
                              next.has(grant.id) ? next.delete(grant.id) : next.add(grant.id);
                              return next;
                            });
                          }}
                          data-testid={`checkbox-compare-${grant.id}`}
                        />
                        Compare
                      </label>
                      <GrantDetailDialog grant={grant} />
                      {trackedMap.has(grant.id) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200"
                          onClick={() => untrackMutation.mutate(grant.id)}
                          disabled={untrackMutation.isPending}
                          data-testid={`button-untrack-${grant.id}`}
                          title={`Tracking as: ${trackedMap.get(grant.id)}`}
                        >
                          <Trophy className="h-3.5 w-3.5 mr-1" />
                          Tracking
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => pursueMutation.mutate(grant.id)}
                          disabled={pursueMutation.isPending}
                          data-testid={`button-pursue-${grant.id}`}
                          title="Add to My Grants as grant of record"
                        >
                          <Target className="h-3.5 w-3.5 mr-1" />
                          Pursue
                        </Button>
                      )}
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
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outlook" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2" data-testid="text-outlook-heading">
                <TrendingUp className="h-5 w-5" /> 90-Day Funding Outlook
              </h2>
              <p className="text-sm text-muted-foreground">
                TCAF's own pipeline — real opportunities with a deadline in the next 90 days (or still open with no deadline), scored against the platform's actual capabilities. Recalculated live every time you open this tab.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchOutlook()} disabled={outlookFetching} data-testid="button-refresh-outlook">
              <RefreshCw className={`h-4 w-4 mr-1 ${outlookFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {outlookData && (
            <p className="text-xs text-muted-foreground" data-testid="text-outlook-window">
              Window: {new Date(outlookData.windowStart).toLocaleDateString()} – {new Date(outlookData.windowEnd).toLocaleDateString()} · {outlookData.total} opportunit{outlookData.total === 1 ? "y" : "ies"}
            </p>
          )}

          {outlookLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : outlookOpportunities.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-no-outlook">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nothing in the next 90 days right now. Run grant discovery to pull in new opportunities.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {outlookOpportunities.map(o => (
                <Card key={o.id} className="p-4 space-y-3" data-testid={`card-outlook-${o.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm" data-testid={`text-outlook-title-${o.id}`}>{o.title}</h3>
                      {o.agency && <p className="text-xs text-muted-foreground">{o.agency}</p>}
                    </div>
                    <FitScoreBadge score={o.fitScore} />
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {o.fundingAmount && <span>{o.fundingAmount}</span>}
                    {o.deadline ? (
                      <span className={o.daysToDeadline !== null && o.daysToDeadline <= 14 ? "text-amber-600 font-medium" : ""}>
                        Deadline: {new Date(o.deadline).toLocaleDateString()}
                        {o.daysToDeadline !== null && ` (${o.daysToDeadline}d)`}
                      </span>
                    ) : (
                      <span>No fixed deadline — rolling/open</span>
                    )}
                  </div>

                  {o.matchedAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {o.matchedAreas.map(area => (
                        <Badge key={area} variant="secondary" className="text-[10px]">{area}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="rounded-md bg-muted/60 p-3 text-xs space-y-1.5">
                    <p><span className="font-medium text-foreground">The story:</span> <span className="text-muted-foreground">{o.story}</span></p>
                    <p><span className="font-medium text-foreground">How to present it:</span> <span className="text-muted-foreground">{o.howToPresent}</span></p>
                    {!o.hasAiAnalysis && (
                      <p className="text-[11px] text-muted-foreground/70 italic">Built from matched capability keywords — open in the Grants tab and run AI analysis for a deeper, opportunity-specific angle.</p>
                    )}
                  </div>

                  {o.sourceUrl && (
                    <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline" data-testid={`link-outlook-source-${o.id}`}>
                      View opportunity <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <h3 className="font-semibold text-lg" data-testid="text-calendar-title">Deadline Calendar</h3>
          {(() => {
            const withDeadline = grants
              .filter(g => g.deadline)
              .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
            if (withDeadline.length === 0) {
              return (
                <Card className="p-8 text-center text-muted-foreground" data-testid="card-no-deadlines">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No grants with deadlines found.</p>
                </Card>
              );
            }
            const now = new Date();
            const months = new Map<string, GrantOpportunity[]>();
            for (const g of withDeadline) {
              const d = new Date(g.deadline!);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              if (!months.has(key)) months.set(key, []);
              months.get(key)!.push(g);
            }
            return (
              <div className="space-y-6" data-testid="calendar-view">
                {Array.from(months.entries()).map(([monthKey, monthGrants]) => {
                  const [yr, mo] = monthKey.split("-");
                  const monthName = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString("default", { month: "long", year: "numeric" });
                  return (
                    <div key={monthKey}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">{monthName}</h4>
                      <div className="space-y-2">
                        {monthGrants.map(g => {
                          const d = new Date(g.deadline!);
                          const isPast = d < now;
                          const isUrgent = !isPast && d.getTime() - now.getTime() < 14 * 24 * 60 * 60 * 1000;
                          return (
                            <Card
                              key={g.id}
                              className={`p-4 flex items-center gap-4 ${isPast ? "opacity-50" : ""} ${isUrgent ? "border-amber-500 bg-amber-50 dark:bg-amber-950" : ""}`}
                              data-testid={`card-calendar-${g.id}`}
                            >
                              <div className="text-center min-w-[50px]">
                                <p className="text-2xl font-bold">{d.getDate()}</p>
                                <p className="text-xs text-muted-foreground">{d.toLocaleString("default", { weekday: "short" })}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{g.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <FitScoreBadge score={g.fitScore} />
                                  <CategoryBadge category={g.category} />
                                  {isPast && <Badge variant="destructive" className="text-xs">Past</Badge>}
                                  {isUrgent && <Badge className="bg-amber-600 text-white text-xs">Urgent</Badge>}
                                </div>
                              </div>
                              {g.fundingAmount && <span className="text-sm font-medium text-primary shrink-0">{g.fundingAmount}</span>}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {compareIds.size >= 2 && (
          <TabsContent value="compare" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg" data-testid="text-compare-title">Grant Comparison</h3>
              <Button variant="outline" size="sm" onClick={() => setCompareIds(new Set())} data-testid="button-clear-compare">
                Clear Selection
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" data-testid="table-compare">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground">Attribute</th>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <th key={g.id} className="text-left p-3 font-medium min-w-[200px]">{g.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Fit Score</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <td key={g.id} className="p-3"><FitScoreBadge score={g.fitScore} /></td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Category</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <td key={g.id} className="p-3"><CategoryBadge category={g.category} /></td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Funding</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <td key={g.id} className="p-3">{g.fundingAmount || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Agency</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <td key={g.id} className="p-3">{g.agency || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Deadline</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <td key={g.id} className="p-3">{g.deadline ? new Date(g.deadline).toLocaleDateString() : "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Status</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <td key={g.id} className="p-3"><StatusBadge status={g.status} /></td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Source</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => (
                      <td key={g.id} className="p-3">{g.source === "samgov" ? "SAM.gov" : "Manual"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">AI Summary</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => {
                      const aiData = parseAIAnalysis(g.aiAnalysis);
                      return <td key={g.id} className="p-3 text-xs">{aiData?.summary || "Not analyzed"}</td>;
                    })}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Strengths</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => {
                      const sgData = parseStrengthsGaps(g.strengthsGaps);
                      return (
                        <td key={g.id} className="p-3">
                          {sgData?.strengths?.length ? (
                            <ul className="text-xs space-y-1">
                              {sgData.strengths.map((s, i) => <li key={i}>{s.area}</li>)}
                            </ul>
                          ) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">Gaps</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => {
                      const sgData = parseStrengthsGaps(g.strengthsGaps);
                      return (
                        <td key={g.id} className="p-3">
                          {sgData?.gaps?.length ? (
                            <ul className="text-xs space-y-1">
                              {sgData.gaps.map((gap, i) => (
                                <li key={i}>{gap.area} <Badge variant="outline" className="text-[10px] ml-1">{gap.effort}</Badge></li>
                              ))}
                            </ul>
                          ) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-muted-foreground">Readiness</td>
                    {grants.filter(g => compareIds.has(g.id)).map(g => {
                      const cl = parseReadinessChecklist(g.readinessChecklist);
                      const ready = cl.filter(c => c.status === "ready").length;
                      return (
                        <td key={g.id} className="p-3">
                          {cl.length > 0 ? (
                            <div>
                              <p className="text-xs mb-1">{ready}/{cl.length} ready</p>
                              <Progress value={(ready / cl.length) * 100} className="h-2" />
                            </div>
                          ) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        <TabsContent value="alerts" className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2" data-testid="text-alerts-heading">
            <Bell className="h-5 w-5" /> Grant Alerts
          </h2>
          {alerts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-no-alerts">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No alerts yet. Refresh SAM.gov to discover high-fit grants.</p>
            </Card>
          ) : (
            alerts.map(alert => (
              <Card
                key={alert.id}
                className={`p-4 ${alert.isRead ? "opacity-60" : "border-l-4 border-l-amber-500"}`}
                data-testid={`card-alert-${alert.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">{alert.title}</span>
                      {alert.fitScore && <FitScoreBadge score={alert.fitScore} />}
                    </div>
                    {alert.message && <p className="text-sm text-muted-foreground">{alert.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  {!alert.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAlertReadMutation.mutate(alert.id)}
                      data-testid={`button-mark-read-${alert.id}`}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-lg" data-testid="text-reports-heading">Reports & Export</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} data-testid="button-export-csv">
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportReport} data-testid="button-export-pdf">
                <FileText className="h-4 w-4 mr-1" /> Export PDF
              </Button>
            </div>
          </div>

          <ReportSection title="WIOA/DOL Performance Report" endpoint="/api/grants/report/wioa" testId="wioa" />
          <ReportSection title="OJJDP/DOJ Compliance Report" endpoint="/api/grants/report/ojjdp" testId="ojjdp" />
        </TabsContent>
      </Tabs>

      <PillarFlowNav currentStep="grant-discovery" />
    </div>
  );
}

function ReportSection({ title, endpoint, testId }: { title: string; endpoint: string; testId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: [endpoint],
    enabled: expanded,
  });

  return (
    <Card className="p-4" data-testid={`card-report-${testId}`}>
      <button
        className="flex items-center justify-between w-full text-left"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-toggle-report-${testId}`}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold">{title}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : report ? (
            <div className="space-y-4">
              {report.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(report.metrics).map(([key, metric]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <p className="text-sm font-medium">{metric.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs">Target: <strong>{metric.target}</strong></span>
                        <span className="text-xs text-muted-foreground">Source: {metric.dataSource}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {report.programAreas && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Program Areas</h4>
                  <div className="space-y-2">
                    {report.programAreas.map((area, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{area.name}</span>
                          <Badge variant="outline" className="text-xs">{area.wioaAlignment}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {area.services.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {report.dolComplianceAreas && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Compliance Areas</h4>
                  <div className="space-y-1">
                    {report.dolComplianceAreas.map((area, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">{area.area}:</span>
                        <span className="text-muted-foreground">{area.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {report.evidenceBasedPractices && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Evidence-Based Practices</h4>
                  <div className="flex flex-wrap gap-1">
                    {report.evidenceBasedPractices.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load report</p>
          )}
        </div>
      )}
    </Card>
  );
}
