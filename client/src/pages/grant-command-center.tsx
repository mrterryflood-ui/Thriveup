import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Target, Clock, CheckCircle2, AlertTriangle, Calendar,
  Plus, Search, FileText, DollarSign, Building2,
  ChevronRight, ExternalLink, Filter, TrendingUp,
  BarChart3, Bell, Archive, XCircle, Send, Sparkles, Mail, RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ThisWeekResponse {
  windowDays: number;
  since: string;
  totalNew: number;
  bySource: Record<string, number>;
  fitDistribution: { high: number; medium: number; low: number };
  upcomingDeadlines: Array<{
    id: string; title: string; agency: string | null;
    deadline: string | null; fitScore: number | null; sourceUrl: string | null;
  }>;
  opportunities: Array<{
    id: string; title: string; agency: string | null; fundingAmount: string | null;
    deadline: string | null; description: string | null; sourceUrl: string | null;
    fitScore: number | null; source: string | null; createdAt: string;
    focusAreas: string[] | null;
  }>;
  lastDiscoveryRun: string | null;
}

function ThisWeekView() {
  const [days, setDays] = useState(7);
  const [minFit, setMinFit] = useState(0);
  const { data, isLoading, refetch, isFetching } = useQuery<ThisWeekResponse>({
    queryKey: ["/api/grants/this-week", days, minFit],
    queryFn: async () => {
      const res = await fetch(`/api/grants/this-week?days=${days}&minFit=${minFit}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const lastRun = data?.lastDiscoveryRun ? new Date(data.lastDiscoveryRun) : null;
  const lastRunStr = lastRun ? `${lastRun.toLocaleString()}` : "Not yet run this session";

  return (
    <div className="space-y-4" data-testid="view-this-week">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Discovery Engine Status
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Daily auto-scan: SAM.gov · Grants.gov · USASpending.gov · curated state/foundation feeds.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last run: <span className="font-mono">{lastRunStr}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh-this-week"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm" variant="outline"
              onClick={() => window.open(`/api/grants/digest/preview?days=${days}`, "_blank")}
              data-testid="button-preview-digest"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Preview Email
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 items-center">
        <Label className="text-xs text-muted-foreground">Window:</Label>
        <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v))}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-window-days">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="3">Last 3 days</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Label className="text-xs text-muted-foreground ml-3">Min fit:</Label>
        <Select value={String(minFit)} onValueChange={(v) => setMinFit(parseInt(v))}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-min-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All grants</SelectItem>
            <SelectItem value="40">Medium+ (≥40)</SelectItem>
            <SelectItem value="70">High fit only (≥70)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">Loading…</Card>
      ) : !data || data.totalNew === 0 ? (
        <Card className="p-8 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No new opportunities in the selected window.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="stat-high-fit">{data.fitDistribution.high}</div>
              <div className="text-[10px] uppercase font-medium text-green-700 dark:text-green-400">High fit (≥70)</div>
            </Card>
            <Card className="p-3 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300" data-testid="stat-medium-fit">{data.fitDistribution.medium}</div>
              <div className="text-[10px] uppercase font-medium text-amber-700 dark:text-amber-400">Medium (40-69)</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold" data-testid="stat-total-new">{data.totalNew}</div>
              <div className="text-[10px] uppercase font-medium text-muted-foreground">Total new</div>
            </Card>
            <Card className="p-3">
              <div className="text-2xl font-bold" data-testid="stat-upcoming-deadlines">{data.upcomingDeadlines.length}</div>
              <div className="text-[10px] uppercase font-medium text-muted-foreground">Upcoming deadlines</div>
            </Card>
          </div>

          <Card className="p-3">
            <div className="text-xs font-medium mb-2 text-muted-foreground">By source:</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(data.bySource).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
                <Badge key={s} variant="secondary" className="text-[10px]" data-testid={`badge-source-${s}`}>
                  {s}: {n}
                </Badge>
              ))}
            </div>
          </Card>

          {data.upcomingDeadlines.length > 0 && (
            <Card className="p-3 border-orange-200 dark:border-orange-800">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-orange-700 dark:text-orange-300">
                <Clock className="h-3.5 w-3.5" /> Upcoming deadlines (act fast)
              </div>
              <div className="space-y-1.5">
                {data.upcomingDeadlines.map((g) => {
                  const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <div key={g.id} className="flex items-center justify-between gap-2 text-xs border-b border-border pb-1.5 last:border-0" data-testid={`row-deadline-${g.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{g.title}</div>
                        <div className="text-muted-foreground text-[10px]">{g.agency}</div>
                      </div>
                      <Badge variant={daysLeft && daysLeft <= 14 ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                        {daysLeft !== null ? `${daysLeft}d` : "—"}
                      </Badge>
                      {g.sourceUrl && (
                        <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline shrink-0" data-testid={`link-deadline-${g.id}`}>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card>
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold">All new opportunities (sorted by fit score)</h3>
            </div>
            <div className="divide-y divide-border">
              {data.opportunities.map((g) => {
                const fs = g.fitScore || 0;
                const fitColor = fs >= 70 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : fs >= 40 ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                return (
                  <div key={g.id} className="p-3 hover:bg-muted/30 transition-colors" data-testid={`row-opportunity-${g.id}`}>
                    <div className="flex items-start gap-3">
                      <Badge className={`shrink-0 font-mono ${fitColor}`} data-testid={`badge-fit-${g.id}`}>{fs}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm" data-testid={`text-title-${g.id}`}>{g.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{g.agency}</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-1">
                          <span><strong>Deadline:</strong> {g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : "rolling"}</span>
                          <span><strong>Amount:</strong> {g.fundingAmount || "TBD"}</span>
                          <span><strong>Source:</strong> {g.source}</span>
                          <span><strong>Added:</strong> {new Date(g.createdAt).toISOString().slice(0, 10)}</span>
                        </div>
                        {g.sourceUrl && (
                          <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1.5" data-testid={`link-source-${g.id}`}>
                            View opportunity <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

type GrantStatus =
  | "identified"
  | "researching"
  | "tracking"
  | "loi_drafting"
  | "loi_submitted"
  | "proposal_drafting"
  | "proposal_submitted"
  | "awarded"
  | "rejected"
  | "archived"
  | "recurring_watch";

type Platform =
  | "TCAF"
  | "HerHealth Network"
  | "TheHealthyBlkMan"
  | "YourHealthBirthright"
  | "ThriveUp Academy"
  | "LifeBridge"
  | "Sankofa Health Network"
  | "Sankofa Maternal Health"
  | "Sankofa Feminine Health"
  | "WholeMind Learning"
  | "SafeCogniCare"
  | "SafeReport"
  | "Mission Transition"
  | "MCE"
  | "Pinnacle Business"
  | "Perfectly Different"
  | "ISSS"
  | "Whole-Person Health"
  | "Emergency Management"
  | "Ecosystem Nexus"
  | "Multiple";

interface GrantEntry {
  id: string;
  name: string;
  funder: string;
  solicitation?: string;
  amount: string;
  amountNum: number;
  deadline?: string;
  deadlineDate?: Date;
  status: GrantStatus;
  platforms: Platform[];
  category: "federal" | "state" | "foundation" | "corporate" | "other";
  recurringCycle?: string;
  nextCycleDate?: string;
  documents: { name: string; path: string }[];
  notes: string;
  url?: string;
  submitUrl?: string;
  submitPortal?: string;
  priority: 1 | 2 | 3;
  submittedDate?: string;
  contactName?: string;
  contactEmail?: string;
}

const STATUS_CONFIG: Record<GrantStatus, { label: string; color: string; icon: any }> = {
  identified: { label: "Identified", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Target },
  researching: { label: "Researching", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: Search },
  tracking: { label: "Tracking", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", icon: Bell },
  loi_drafting: { label: "LOI Drafting", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: FileText },
  loi_submitted: { label: "LOI Submitted", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: Send },
  proposal_drafting: { label: "Proposal Drafting", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: FileText },
  proposal_submitted: { label: "Submitted", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: CheckCircle2 },
  awarded: { label: "Awarded", color: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100", icon: DollarSign },
  rejected: { label: "Not Selected", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400", icon: Archive },
  recurring_watch: { label: "Watching", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: Bell },
};

const INITIAL_GRANTS: GrantEntry[] = [
  {
    id: "spencer-small-research-2026",
    name: "Spencer Foundation Small Research Grant — ISSS Implementation Fidelity",
    funder: "Spencer Foundation",
    solicitation: "Small Research Grants",
    amount: "$50,000",
    amountNum: 50000,
    deadline: "April 15, 2026, 12:00 PM CT",
    deadlineDate: new Date("2026-04-15"),
    status: "proposal_submitted",
    platforms: ["ISSS", "TCAF"],
    category: "foundation",
    documents: [
      { name: "Grant Brief & Tracking", path: "/docs/grants/Spencer-Foundation-Small-Research-Grant-2026.md" },
      { name: "Submission Narrative + Abstract + Budget + AI Disclosure", path: "/docs/grants/Spencer-Foundation-Narrative-SUBMISSION.doc" },
    ],
    notes: "STRONG FIT. No university-as-lead required -- TCAF 501(c)(3) eligible directly. Field-initiated: propose exactly what ISSS does. Up to $50K + optional $10K course release, no indirect costs. 1-5 year timeline. RQ: How does adaptive implementation infrastructure affect fidelity of evidence-based student support practices? Mixed methods using ISSS built-in data (fidelity scores, readiness assessments, Proctor's 8 outcomes, practice-policy reports) + qualitative interviews. Sites: 3-5 schools using ISSS (PfISD anchor). SALP Science platform (salp-science--mrterryflood.replit.app) provides research analysis. RPLICE (implementationineducatio.com) provides implementation science engine. AI DISCLOSURE REQUIRED: Spencer has generative AI policy -- be transparent about AI supporting practitioners vs. conducting research. PI can only hold one active Spencer grant. PfISD support letter pending (Traci Hendrix, supervisor reviewing April 13).",
    url: "https://www.spencer.org/grant_types/small-research-grant",
    submitUrl: "https://www.spencer.org/grant_types/small-research-grant",
    submitPortal: "Spencer Foundation Online Portal",
    priority: 1,
    contactName: "Spencer Foundation Program Team",
  },
  {
    id: "rare-impact-2026",
    name: "Rare Impact Fund — Nonclinical Youth MH Workforce",
    funder: "Rare Impact Fund (Selena Gomez / Hopewell Fund)",
    solicitation: "Strengthening the Nonclinical Youth Mental Health Workforce",
    amount: "$350,000",
    amountNum: 350000,
    deadline: "April 10, 2026",
    deadlineDate: new Date("2026-04-10"),
    status: "loi_submitted",
    platforms: ["TCAF", "ThriveUp Academy", "LifeBridge", "Sankofa Health Network"],
    category: "foundation",
    documents: [
      { name: "LOI Narrative (Submitted)", path: "/docs/grants/TCAF-Rare-Impact-Fund-LOI-Narrative-SUBMITTED.md" },
      { name: "Organizational Budget", path: "/docs/grants/TCAF-Organizational-Budget-FY2025-2026.doc" },
      { name: "Leadership Overview", path: "/docs/grants/TCAF-Leadership-Staff-Overview.doc" },
    ],
    notes: "LOI submitted April 9. $350K over 2 years. All 5 pipeline stages. Waiting for Stage 2 invitation.",
    url: "https://forms.gle/jeP6kpsLMt6haw9m8",
    submitUrl: "https://forms.gle/jeP6kpsLMt6haw9m8",
    submitPortal: "Google Forms",
    priority: 1,
    submittedDate: "April 9, 2026",
    contactName: "Rare Impact Fund Program Team",
  },
  {
    id: "gates-ai-charitable-giving-2026",
    name: "Gates Foundation AI for Charitable Giving",
    funder: "Bill & Melinda Gates Foundation",
    amount: "Up to $150,000",
    amountNum: 150000,
    deadline: "April 28, 2026",
    deadlineDate: new Date("2026-04-28"),
    status: "identified",
    platforms: ["TCAF", "Multiple"],
    category: "foundation",
    documents: [],
    notes: "STRONG FIT (auto fit-score 88/100). AI applied to charitable giving / nonprofit operations is exactly what the TCAF stack does — ChainWeb evidence engine, Sparky/Spark companions, and the multilingual benefits screener are all production AI-for-social-good. Reuse the WAB2 narrative spine: gap → 15-min multilingual intake → ChainWeb-cited outcomes → live demo at lifetransitionsaid.org/st-davids. Up to $150K. Confirm portal + format on the funder page before submitting.",
    priority: 1,
  },
  {
    id: "jnj-neuroscience-2026",
    name: "J&J Innovative Medicine — Neuroscience Charitable Contributions",
    funder: "Johnson & Johnson Innovative Medicine",
    amount: "TBD (Charitable Contribution)",
    amountNum: 0,
    deadline: "May 31, 2026 (Local/Regional window: March 1 - May 31)",
    deadlineDate: new Date("2026-05-31"),
    status: "identified",
    platforms: ["TCAF", "SafeCogniCare", "Perfectly Different", "LifeBridge", "Whole-Person Health", "ISSS"],
    category: "corporate",
    documents: [],
    notes: "STRONG FIT. Disease areas: Major Depressive Disorder, Schizophrenia, Schizoaffective Disorder, Alzheimer's Disease. Areas of interest align directly: (1) Recovery-focused programs (quality of life, housing, social isolation, employment, wellness) = LifeBridge + ThriveUp workforce readiness; (2) Early intervention = ISSS early warning flags + Thrive Scores; (3) Access/continuity of care/relapse prevention = Sankofa Health Network + LifeBridge; (4) Healthcare disparities and stigma = entire SDOH framework; (5) Crisis intervention = Whole-Person Health crisis routing + SafeCogniCare; (6) Mental health and criminal justice = TX Reentry + LifeBridge reentry navigation; (7) Patients/caregivers/families/peers/community leaders = Neighborhood Champions + parent engagement + CHW coordination. APPLICATION WINDOW OPEN NOW for local/regional orgs (March 1 - May 31). Submit via CyberGrants portal.",
    url: "https://www.jnj.com/innovativemedicine/us/grants-and-giving/charitable-contributions/therapeutic-giving/neuroscience",
    submitUrl: "https://www.cybergrants.com/pls/cybergrants/quiz.display_question?x_gm_id=6960&x_quiz_id=8710&x_order_by=1",
    submitPortal: "CyberGrants",
    priority: 1,
  },
  {
    id: "stdavids-catalyzing-community-2026",
    name: "St. David's Foundation — Catalyzing Community-Led Change",
    funder: "St. David's Foundation",
    solicitation: "Open Call (May 2026)",
    amount: "TBD",
    amountNum: 0,
    deadline: "May 2026 (exact date TBD on portal)",
    deadlineDate: new Date("2026-05-31"),
    status: "tracking",
    platforms: ["TCAF", "ThriveUp Academy", "Sankofa Health Network", "LifeBridge", "HerHealth Network"],
    category: "foundation",
    documents: [],
    notes: "STRONG FIT — same funder as WAB2 (just submitted today), different lane. Goal: Community-Driven Change. Priorities: Community Voice + Decision Making, Civic Health. Funds communities with greatest health needs to define their own priorities and influence practices/policies/systems. TCAF angle: the entire stack is built BY community FOR community — Neighborhood Champions program, multilingual benefits screener, community-defined Thrive Scores, parent/youth voice in ISSS. Watch the funding-opportunities page (https://stdavidsfoundation.org/funding-opportunities) and Sparky alerts for the open date in May. Pre-stage: shorter community-voice narrative spine (vs. the workforce/systems framing used for WAB2). Two parallel pipelines with the same funder = compounding relationship, not competition.",
    url: "https://stdavidsfoundation.org/funding-opportunities",
    submitUrl: "https://stdavidsfoundation.org/funding-opportunities",
    submitPortal: "GivingData (St. David's Foundation Grants Portal)",
    priority: 1,
    contactName: "St. David's Foundation Grants Team",
    contactEmail: "grantsinfo@stdavidsfoundation.org",
  },
  {
    id: "stdavids-wab2-2026",
    name: "St. David's Foundation — We All Benefit 2.0",
    funder: "St. David's Foundation",
    solicitation: "WAB2 LOI",
    amount: "$1,000,000 (24 months)",
    amountNum: 1000000,
    deadline: "April 27, 2026",
    deadlineDate: new Date("2026-04-27"),
    status: "loi_submitted",
    platforms: ["TCAF", "ThriveUp Academy", "LifeBridge", "Sankofa Health Network"],
    category: "foundation",
    documents: [
      { name: "WAB2 LOI v7 (Submitted)", path: "/attached_assets/WAB2-LOI-RequestSummary-v7-FINAL.md" },
      { name: "Operating Budget", path: "/attached_assets/TCAF-Organizational-Budget-FY2025-2026.doc" },
      { name: "Submission Walkthrough", path: "/docs/grants/SUBMISSION-WALKTHROUGH-StDavids-WAB2-LOI.md" },
    ],
    notes: "LOI SUBMITTED April 27, 2026 via GivingData portal. $1M / 24 months ask, regional 5-county scope (Travis, Williamson, Hays, Bastrop, Caldwell), 18,000+ enrollment target with ≥40% rural Bastrop+Caldwell, $24M+ household benefit value, Dell Med / UT SSW external evaluation. TCAF is now IRS-determined 501(c)(3) (Letter 947, eff. 01/14/2026), SAM.gov Active (UEI KDDVD1FGLW35), CAGE 209N1 — applying directly, no fiscal sponsor needed. LOI confirmation received from foundation. Decision typically 6-10 weeks.",
    url: "https://stdavidsfoundation.org/funding-opportunities",
    submitUrl: "https://stdavidsfoundation.org/funding-opportunities",
    submitPortal: "GivingData (St. David's Foundation Grants Portal)",
    priority: 1,
    submittedDate: "April 27, 2026",
    contactName: "St. David's Foundation Grants Team",
    contactEmail: "grantsinfo@stdavidsfoundation.org",
  },
  {
    id: "nsf-techaccess-loi-2026",
    name: "NSF TechAccess: AI-Ready America — LOI",
    funder: "National Science Foundation",
    solicitation: "NSF 26-508",
    amount: "$1,000,000/yr x 3 years",
    amountNum: 3000000,
    deadline: "June 16, 2026",
    deadlineDate: new Date("2026-06-16"),
    status: "researching",
    platforms: ["TCAF", "ThriveUp Academy", "WholeMind Learning", "Multiple"],
    category: "federal",
    documents: [
      { name: "Alignment & Gap Assessment", path: "/docs/grants/NSF-TechAccess-AI-Ready-America-Alignment.md" },
      { name: "Proposal Framework (15-page)", path: "/docs/grants/NSF-TechAccess-Proposal-Framework.md" },
    ],
    notes: "Texas Coordination Hub. Needs university Co-PI partner (Huston-Tillotson or Texas State recommended). Biggest single opportunity at $3M total.",
    url: "https://www.nsf.gov/pubs/2026/nsf26508/nsf26508.htm",
    submitUrl: "https://www.research.gov/",
    submitPortal: "Research.gov",
    priority: 1,
    contactName: "NSF AI-Ready Program",
    contactEmail: "ai-ready@nsf.gov",
  },
  {
    id: "nsf-techaccess-full-2026",
    name: "NSF TechAccess: AI-Ready America — Full Proposal",
    funder: "National Science Foundation",
    solicitation: "NSF 26-508",
    amount: "$1,000,000/yr x 3 years",
    amountNum: 3000000,
    deadline: "July 16, 2026",
    deadlineDate: new Date("2026-07-16"),
    status: "proposal_drafting",
    platforms: ["TCAF", "ThriveUp Academy", "WholeMind Learning", "Multiple"],
    category: "federal",
    documents: [
      { name: "Proposal Framework (15-page)", path: "/docs/grants/NSF-TechAccess-Proposal-Framework.md" },
    ],
    notes: "15-page project description. Dependent on LOI submission June 16 and university partner secured by May 15.",
    submitUrl: "https://www.research.gov/",
    submitPortal: "Research.gov",
    priority: 1,
  },
  {
    id: "nih-r03-aim-housing",
    name: "NIH R03 AIM-Housing — Housing Instability Cascade Mapping",
    funder: "NIH",
    solicitation: "PA-25-302",
    amount: "$100,000",
    amountNum: 100000,
    deadline: "June 16, 2026",
    deadlineDate: new Date("2026-06-16"),
    status: "proposal_drafting",
    platforms: ["TCAF", "LifeBridge"],
    category: "federal",
    documents: [],
    notes: "Housing instability cascade mapping in Austin, TX (ZIP codes 78741, 78702, 78753). Partners: Austin Housing Authority, ECHO, Foundation Communities, Central Health, Integral Care. RPLICE Pipeline at /r03-pipeline. SAM.gov registration required (EIN 41-3618003). Most urgent NIH submission.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PA-25-302.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 1,
  },
  {
    id: "nih-r03-shield-austin",
    name: "NIH R03 SHIELD-Austin — Overdose Prevention Cascade",
    funder: "NIH",
    solicitation: "PAR-25-233",
    amount: "$100,000",
    amountNum: 100000,
    deadline: "October 5, 2026",
    deadlineDate: new Date("2026-10-05"),
    status: "proposal_drafting",
    platforms: ["TCAF", "LifeBridge", "Sankofa Health Network"],
    category: "federal",
    documents: [],
    notes: "Overdose prevention cascade mapping in Austin, TX (78741, 78702, 78753). Partners: Integral Care, Travis County Opioid Task Force, Austin Harm Reduction Coalition, ATCEMS. Austin OD rate 33/100K (highest in TX), 279 fentanyl deaths 2023, 78753 OD rate 44.8/100K.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PAR-25-233.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "nih-r01-integrate-austin",
    name: "NIH R01 INTEGRATE-Austin — Full-Scale Housing + Substance Use Intervention",
    funder: "NIH",
    solicitation: "Standard R01 — FOA TBD",
    amount: "$1,250,000",
    amountNum: 1250000,
    deadline: "TBD (after R03 pilot data)",
    status: "researching",
    platforms: ["TCAF", "LifeBridge", "Sankofa Health Network"],
    category: "federal",
    documents: [],
    notes: "Full-scale integrated intervention combining housing stabilization with substance use prevention across 6-8 sites. Cluster randomized stepped-wedge design. Builds on both R03 pilots (AIM-Housing + SHIELD-Austin) as preliminary data. All R03 partners plus expanded network. $1.25M over 5 years.",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "nih-r21-minority-health",
    name: "NIH R21 — Minority Health & Digital Health Disparities",
    funder: "NIH / NIMHD",
    amount: "$275,000",
    amountNum: 275000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network", "TheHealthyBlkMan", "YourHealthBirthright"],
    category: "federal",
    recurringCycle: "3 cycles/year (Feb, Jun, Oct)",
    nextCycleDate: "June 2026",
    documents: [],
    notes: "R21 exploratory/developmental grants. HerHealth Network is strong fit — 70 conditions, AI navigator, SDOH integration. Need academic partner for PI.",
    priority: 2,
  },
  {
    id: "nih-sbir-health-tech",
    name: "NIH SBIR/STTR — Health Technology for Underserved",
    funder: "NIH",
    solicitation: "PA-24-095",
    amount: "$275,000 (Phase I) / $1.5M (Phase II)",
    amountNum: 275000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "SafeCogniCare", "Sankofa Health Network"],
    category: "federal",
    recurringCycle: "3 cycles/year (Jan, Apr, Sep)",
    nextCycleDate: "September 2026",
    documents: [],
    notes: "SBIR requires small business concern status (VOSB qualifies, <500 employees, U.S.-owned). Phase I $275K, Phase II $1.75M. Must demo technical innovation + commercial potential + health impact. HerHealth AI navigator Nia, resource matching, P2P mesh are commercializable innovations. B2B revenue model ($50K-$500K/yr tiers) already defined. Next deadline: Sep 5, 2026.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PA-24-095.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "hhs-omh-health-equity",
    name: "HHS Office of Minority Health — Health Equity Grants",
    funder: "HHS / Office of Minority Health",
    amount: "$200,000–$500,000",
    amountNum: 400000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network", "TheHealthyBlkMan", "YourHealthBirthright"],
    category: "federal",
    recurringCycle: "Annual (varies, typically Spring)",
    nextCycleDate: "Check minorityhealth.hhs.gov",
    documents: [],
    notes: "CRITERIA: Must be nonprofit or CBO. Must focus on minority health and health equity. Must demonstrate culturally competent design + SDOH integration + community reach. HerHealth is a minority health platform by definition — 70 conditions, AI navigation, SDOH-first design. OMH has funded digital health, AI navigation, and SDOH platforms. Check May-July for FY2027 NOFOs. No academic partner required.",
    url: "https://minorityhealth.hhs.gov",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 2,
  },
  {
    id: "hrsa-community-health",
    name: "HRSA — Community Health & SDOH Grants",
    funder: "HRSA",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "LifeBridge", "Sankofa Health Network"],
    category: "federal",
    recurringCycle: "Annual (varies by program)",
    documents: [],
    notes: "CRITERIA: Must be nonprofit, health center, or community org. Must serve underserved populations with health navigation + SDOH. HerHealth serves as CHW training tool and patient navigation platform — 2,100+ resources across 50 states. CHWs use resource database, AI navigator, appointment prep center with clients. Multiple HRSA programs (CHW Training, Community Health, SDOH). Letter of support from health center recommended.",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 2,
  },
  {
    id: "komen-stand-for-her",
    name: "Susan G. Komen — Stand for H.E.R.",
    funder: "Susan G. Komen",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["HerHealth Network"],
    category: "foundation",
    recurringCycle: "Annual (check komen.org)",
    documents: [],
    notes: "CRITERIA: Must be nonprofit serving Black women with breast cancer disparities. Must be community-based + culturally competent + provide navigation support. HerHealth Cancer Platform covers triple-negative breast cancer, BRCA, IBC — all disproportionately affecting Black women. Black women 40% more likely to die from breast cancer. Stand for H.E.R. = Health Equity Revolution. Check komen.org/community-grants for cycle.",
    url: "https://www.komen.org/community-grants",
    submitUrl: "https://www.komen.org/community-grants",
    submitPortal: "Komen Community Grants Portal",
    priority: 1,
  },
  {
    id: "rwjf-evidence-action",
    name: "Robert Wood Johnson Foundation — Evidence for Action",
    funder: "RWJF",
    amount: "$100,000–$400,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Rolling (quarterly review)",
    documents: [],
    notes: "CRITERIA: Must be nonprofit. No academic partner required (letter of support acceptable). Rolling submissions. Must focus on SDOH + health equity + evidence generation. HerHealth is a living SDOH intervention — measure how SDOH-integrated health info changes care-seeking behavior. RPLICE provides evaluation framework. RE-AIM + MAP-GAP methodology alignment.",
    url: "https://www.rwjf.org/en/grants.html",
    submitUrl: "https://www.rwjf.org/en/grants.html",
    submitPortal: "RWJF Online Portal",
    priority: 1,
  },
  {
    id: "kellogg-health-equity",
    name: "W.K. Kellogg Foundation — Racial Equity & Health",
    funder: "W.K. Kellogg Foundation",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "YourHealthBirthright", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Rolling",
    documents: [],
    notes: "CRITERIA: Must be nonprofit focused on racial equity and health. Open inquiry process at wkkf.org. Must demonstrate community leadership + children/families focus + health equity. HerHealth is community-built, equity-centered, free to users. 3-platform Sankofa ecosystem addresses the family unit (women, men, maternal). $100K-$500K range.",
    url: "https://www.wkkf.org",
    submitUrl: "https://www.wkkf.org",
    submitPortal: "WKKF Online Portal",
    priority: 2,
  },
  {
    id: "google-org-ai",
    name: "Google.org — AI for Social Good",
    funder: "Google.org",
    amount: "$250,000–$2,000,000",
    amountNum: 1000000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Multiple"],
    category: "corporate",
    recurringCycle: "Annual (varies)",
    documents: [],
    notes: "CRITERIA: Must be nonprofit, social enterprise, or academic institution. Must use AI for social impact with clear health equity purpose. HerHealth uses Perplexity-powered Nia AI navigator for health equity. 3-platform P2P mesh is technically innovative. Google.org has funded AI-for-good in health for underrepresented communities. $100K-$2M+ varies. Open applications + by invitation.",
    priority: 2,
  },
  {
    id: "microsoft-ai-health",
    name: "Microsoft Philanthropies — Health Equity & AI",
    funder: "Microsoft Philanthropies",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Multiple"],
    category: "corporate",
    recurringCycle: "Annual",
    documents: [],
    notes: "CRITERIA: Must be nonprofit using technology for health equity. Rolling submissions. Grants + Azure credits ($50K-$500K). Must demo AI for social good + digital inclusion + underserved communities. HerHealth is a PWA (works offline, mobile-installable) with AI navigation — digital inclusion by design. Microsoft funds health equity tech, AI for social good.",
    url: "https://www.microsoft.com/en-us/philanthropies",
    submitUrl: "https://www.microsoft.com/en-us/philanthropies",
    submitPortal: "Microsoft Philanthropies Portal",
    priority: 2,
  },
  {
    id: "jnj-womens-health",
    name: "Johnson & Johnson Foundation — Women's & Maternal Health",
    funder: "Johnson & Johnson Foundation",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "YourHealthBirthright"],
    category: "corporate",
    recurringCycle: "Annual",
    documents: [],
    notes: "CRITERIA: Must be nonprofit focused on women's/maternal health. Annual cycle at jnj.com/our-giving. Must demo health equity + innovation + community impact. J&J funds maternal health equity + women's health innovation. HerHealth covers full spectrum — reproductive, maternal, chronic conditions — in single integrated platform for Black women. $100K-$500K.",
    url: "https://www.jnj.com/our-giving",
    submitUrl: "https://www.jnj.com/our-giving",
    submitPortal: "J&J Foundation Portal",
    priority: 2,
  },
  {
    id: "merck-cardiac-equity",
    name: "Merck Foundation — Collaborative for Equity in Cardiac Care",
    funder: "Merck Foundation",
    amount: "$100,000–$300,000",
    amountNum: 200000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "TheHealthyBlkMan"],
    category: "corporate",
    recurringCycle: "Annual",
    documents: [],
    notes: "CRITERIA: Must be nonprofit. By invitation + open calls at merckfoundation.com. Merck for Mothers covers maternal mortality (HerHealth Maternal Health Platform: preeclampsia, gestational diabetes, postpartum). Cardiac Care Collaborative aligns with HerHealth Cardiovascular Platform (hypertension, heart disease, heart failure — elevated in Black women). $50K-$300K. Must be evidence-based.",
    url: "https://www.merckfoundation.com",
    submitUrl: "https://www.merckfoundation.com",
    submitPortal: "Merck Foundation Portal",
    priority: 2,
  },
  {
    id: "tx-hhsc-sdoh",
    name: "Texas HHSC — SDOH & Minority Health Programs",
    funder: "Texas Health and Human Services Commission",
    amount: "$50,000–$300,000",
    amountNum: 150000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "LifeBridge"],
    category: "state",
    recurringCycle: "Annual (check HHSC website)",
    documents: [],
    notes: "SDOH programs, health equity planning, minority health initiatives. LifeBridge benefits navigation + HerHealth SDOH integration.",
    priority: 2,
  },
  {
    id: "ford-foundation-racial-justice",
    name: "Ford Foundation — Racial Justice & Technology Equity",
    funder: "Ford Foundation",
    amount: "$200,000–$1,000,000",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Multiple"],
    category: "foundation",
    recurringCycle: "Rolling",
    documents: [],
    notes: "Racial justice, technology equity. TCAF's ecosystem built by and for underserved communities. Strong narrative fit.",
    priority: 3,
  },
  {
    id: "stdavids-future-cycles",
    name: "St. David's Foundation — Future Grant Cycles",
    funder: "St. David's Foundation",
    amount: "$250,000–$7,000,000",
    amountNum: 1000000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Multiple cycles/year — monitor stdavidsfoundation.org/funding-opportunities weekly",
    documents: [],
    notes: "Missed Healthy Births ($7M, July 2025), Culturally Responsive MH ($4.2M, July 2025), Healthcare Workforce (May 2025). Must track future cycles actively. $250K minimum budget requirement for some programs.",
    url: "https://stdavidsfoundation.org/funding-opportunities",
    priority: 1,
  },
  {
    id: "gwbailey-stem",
    name: "Glenn W. Bailey Foundation — STEM Programs",
    funder: "Glenn W. Bailey Foundation",
    amount: "Varies",
    amountNum: 50000,
    status: "researching",
    platforms: ["TCAF", "ThriveUp Academy", "WholeMind Learning"],
    category: "foundation",
    recurringCycle: "Rolling monthly review",
    documents: [],
    notes: "STEM education focus. STEM Stars (6-12th grade) or Teen Tech (competition) could work. Requires STEM-specific framing of ThriveUp Academy. Will not cover >10% admin/salary costs.",
    url: "https://www.gwbaileyfoundation.org/programgrants",
    priority: 3,
  },
  {
    id: "rwjf-health-knowledge-2026",
    name: "RWJF — Learning from Abroad: Health Knowledge Systems",
    funder: "Robert Wood Johnson Foundation",
    amount: "Up to $500,000",
    amountNum: 500000,
    deadline: "April 13, 2026 (brief proposal)",
    deadlineDate: new Date("2026-04-13"),
    status: "identified",
    platforms: ["Sankofa Health Network", "Whole-Person Health", "LifeBridge"],
    category: "foundation",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be U.S.-based org. Must NOT have received RWJF funds since Jan 1, 2021. No biomedical/clinical/bench science. Focus on community-driven health knowledge, narrative change, cross-sector collaboration. Fiscal sponsor allowed. Sankofa + LifeBridge = community health knowledge system for Black communities in Austin.",
    url: "https://www.rwjf.org/en/grants/active-funding-opportunities/2026/learning-from-abroad-to-reimagine-health-knowledge-systems-for-equity-and-wellbeing.html",
    submitUrl: "https://www.rwjf.org/en/grants/active-funding-opportunities/2026/learning-from-abroad-to-reimagine-health-knowledge-systems-for-equity-and-wellbeing.html",
    submitPortal: "RWJF Online Portal",
    priority: 1,
  },
  {
    id: "gates-ai-charitable-2026",
    name: "Gates Foundation — AI to Accelerate Charitable Giving",
    funder: "Bill & Melinda Gates Foundation",
    amount: "Up to $150,000",
    amountNum: 150000,
    deadline: "April 28, 2026",
    deadlineDate: new Date("2026-04-28"),
    status: "identified",
    platforms: ["TCAF", "Ecosystem Nexus", "Multiple"],
    category: "foundation",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must answer: 'How might AI support charitable donors to give more and give sooner?' Awards to orgs not individuals. Indirect costs allowed within $150K cap. No min budget. Travel to convenings covered separately. The Incubator's grant discovery engine + AI LOI/narrative writer = AI tool accelerating nonprofit giving infrastructure.",
    url: "https://gcgh.grandchallenges.org/challenge/artificial-intelligence-ai-accelerate-charitable-giving",
    submitUrl: "https://submit.gatesfoundation.org/prog/artificial_intelligence_ai_to_accelerate_charitable_giving/",
    submitPortal: "Gates Foundation Submit Portal",
    priority: 1,
  },
  {
    id: "cdc-dfc-year1-2026",
    name: "CDC Drug-Free Communities (DFC) — Year 1 New Coalition",
    funder: "CDC / ONDCP",
    amount: "$125,000/yr × 10 yrs ($1.25M total)",
    amountNum: 1250000,
    deadline: "~45 days after NOFO (expected May 2026)",
    status: "identified",
    platforms: ["TCAF", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "10 statutory requirements: Must have reps from ALL 12 sectors (youth, parents, business, media, school, youth-serving orgs, law enforcement, religious, civic, healthcare, govt, other). Coalition 6+ months old. Must address 2+ substances. No geographic overlap with existing DFC. 1:1 match required (can be in-kind). SAM.gov TIN mismatch must be resolved first. DFC Command Center already built.",
    url: "https://www.cdc.gov/overdose-prevention/php/drug-free-communities/index.html",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 1,
    contactEmail: "DFC_NOFO@cdc.gov",
  },
  {
    id: "twc-healthcare-apprenticeship-2026",
    name: "TWC + DSHS Healthcare Apprenticeship Grant",
    funder: "Texas Workforce Commission + DSHS",
    amount: "Up to $500,000/yr",
    amountNum: 500000,
    deadline: "Open / rolling — check TWC portal",
    status: "identified",
    platforms: ["ThriveUp Academy"],
    category: "state",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must support creation/expansion of Registered Apprenticeship programs in healthcare. Must target in-demand healthcare occupations (RN, allied health). Must serve DSH program communities. Need healthcare employer partner (letter of support only). $1M total ($500K/yr FY26+FY27). Separate from TWC RFA 32026-00162.",
    url: "https://www.twc.texas.gov/agency/funding-opportunities/grant-opportunities",
    submitUrl: "https://www.txsmartbuy.com/esbd",
    submitPortal: "Texas ESBD",
    priority: 1,
  },
  {
    id: "fema-bric-2026",
    name: "FEMA BRIC — Building Resilient Infrastructure & Communities",
    funder: "FEMA",
    amount: "Up to $20M/project",
    amountNum: 20000000,
    deadline: "July 23, 2026 at 3:00 PM ET",
    deadlineDate: new Date("2026-07-23"),
    status: "identified",
    platforms: ["Emergency Management", "SafeReport"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "NONPROFITS CANNOT APPLY DIRECTLY — must partner with local government (city/county) as subapplicant. $1B total available. Must be hazard mitigation activity. Benefit-cost analysis required. Need City of Austin or Travis County as applying partner. Letter of support from city/county emergency management office required.",
    url: "https://www.fema.gov/grants/mitigation/building-resilient-infrastructure-communities",
    submitUrl: "https://go.fema.gov/",
    submitPortal: "FEMA GO (via local gov partner)",
    priority: 2,
  },
  {
    id: "samhsa-nctsi-cat3-2026",
    name: "SAMHSA NCTSI Category III — Child Traumatic Stress",
    funder: "SAMHSA",
    amount: "$400K–$1M/yr (up to 5 years)",
    amountNum: 1000000,
    deadline: "NOFO forecasted April–May 2026",
    status: "identified",
    platforms: ["Perfectly Different", "ISSS", "WholeMind Learning"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be domestic public/private nonprofit. Must implement evidence-based trauma-focused treatments for children/adolescents. Must collaborate with NCTSN. Must participate in cross-site evaluation. Need clinical staff qualified for trauma interventions. ISSS MTSS frameworks + Perfectly Different neurodiversity tools + WholeMind K-12 = comprehensive child trauma infrastructure. Letter of support from PfISD strengthens application. Monitor SAMHSA forecast dashboard weekly.",
    url: "https://www.samhsa.gov/grants/grants-dashboard/forecasts",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 1,
  },
  {
    id: "hrsa-mch-pip-2026",
    name: "HRSA Maternal & Child Health Policy Innovation (MCH PIP)",
    funder: "HRSA / Maternal & Child Health Bureau",
    amount: "Varies (competitive)",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["Sankofa Maternal Health", "Sankofa Feminine Health", "HerHealth Network"],
    category: "federal",
    recurringCycle: "Watch HRSA portal for next cycle",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be domestic org: nonprofit, CBO, for-profit, higher ed, or tribal. Must propose city/county/state policy initiatives for maternal/child health outcomes. SDOH focus strongly encouraged (housing, food, transport). Must provide TA to policymakers. Must address MCHB priorities: maternal mortality, infant mortality, obstetric emergencies. Letter of support from state/local health dept recommended. No open NOFO currently.",
    url: "https://grants.hrsa.gov",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 2,
  },
  {
    id: "dol-hvrp-2026",
    name: "DOL HVRP — Homeless Veterans Reintegration Program",
    funder: "DOL Veterans' Employment & Training Service",
    amount: "Multi-year (3-year performance period)",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["Mission Transition", "MCE", "Pinnacle Business"],
    category: "federal",
    recurringCycle: "Annual — FY2026 FOA closed Feb 25; watch for FY2027",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be state/local govt, nonprofit 501(c)(3), or for-profit. 3 tracks: HVRP (all homeless vets), IVTP (incarcerated vets), HWVHVWC (women vets + vets w/ children). Must provide outreach, case management, job readiness, placement, follow-up. Must coordinate with VA healthcare, HUD-VASH, local CoC. Must track employment outcomes quarterly. SAM.gov required. Letter of support from VA Medical Center recommended.",
    url: "https://www.dol.gov/agencies/vets/serviceproviders/grants",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov + JustGrants",
    priority: 2,
  },
  {
    id: "dol-ivtp-2026",
    name: "DOL IVTP — Incarcerated Veterans Transition Program",
    funder: "DOL Veterans' Employment & Training Service",
    amount: "Multi-year (3-year performance period)",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["Mission Transition", "MCE"],
    category: "federal",
    recurringCycle: "Annual — same FOA as HVRP",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Same org eligibility as HVRP. Must serve veterans in/recently released from penal institutions or mental health facilities. Must provide pre-release planning + post-release employment services. Must coordinate with correctional facilities. Must track recidivism and employment retention. Justice Command Center court-ready reports + Thrive Scores + 5-phase reentry pipeline = perfect fit. Letter of support from correctional facility or state DOC recommended.",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov + JustGrants",
    priority: 2,
  },
  {
    id: "essa-title-iva-scg-2026",
    name: "Title IV-A / Stronger Connections Grant (via PfISD)",
    funder: "U.S. DOE / Bipartisan Safer Communities Act",
    amount: "Varies (from $1B total pool)",
    amountNum: 500000,
    deadline: "Funds must be obligated by September 30, 2026",
    deadlineDate: new Date("2026-09-30"),
    status: "identified",
    platforms: ["ISSS", "WholeMind Learning", "Perfectly Different", "SafeReport"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "NONPROFITS CANNOT APPLY DIRECTLY — must partner with LEA (school district). LEA must be 'high-need' per SEA. Covers safe/healthy schools, mental health, bullying prevention, SEL. 20% must go to 'well-rounded educational opportunities', 20% to 'safe and healthy students'. Nonprofit serves as subcontractor/MOU partner. MOU must be executed before Sep 30, 2026. Ask PfISD if they received SCG funding. Letter of support from PfISD (Traci Hendrix already engaged).",
    submitUrl: "https://www2.ed.gov/fund/grant/apply/grantapps/index.html",
    submitPortal: "Via School District (PfISD)",
    priority: 1,
  },
  {
    id: "samhsa-ccbhc-pdi-2026",
    name: "SAMHSA CCBHC-PDI — Certified Community Behavioral Health Clinics",
    funder: "SAMHSA",
    amount: "$2M–$4M/year",
    amountNum: 4000000,
    status: "recurring_watch",
    platforms: ["Whole-Person Health", "Sankofa Health Network", "LifeBridge"],
    category: "federal",
    recurringCycle: "Monitor SAMHSA FY2026 forecast dashboard",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be nonprofit behavioral health org or local govt behavioral health authority. For-profits ineligible. Must meet 6 CCBHC certification areas: (1) Staffing (licensed clinicians, psychiatrist access), (2) Availability (no one turned away, 24/7 crisis), (3) Care coordination, (4) Scope (9 required service categories), (5) Quality/reporting, (6) Governance. Must serve ALL individuals regardless of ability to pay. GAP: Need clinical staffing partnerships + 24/7 crisis services. No open NOFO yet.",
    url: "https://www.samhsa.gov/certified-community-behavioral-health-clinics",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 2,
  },
  {
    id: "cdc-reach-2028",
    name: "CDC REACH — Racial & Ethnic Approaches to Community Health",
    funder: "CDC",
    amount: "Up to $800K/year (5-year cooperative agreement)",
    amountNum: 800000,
    status: "recurring_watch",
    platforms: ["Sankofa Health Network", "HerHealth Network", "LifeBridge"],
    category: "federal",
    recurringCycle: "Current cycle 2023–2028; next competition ~2028",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be state/local health dept, tribe, university, or CBO. Must reduce chronic disease disparities in racial/ethnic minorities. Must use culturally appropriate evidence-based strategies. Must address hypertension, diabetes, obesity, physical inactivity, nutrition, tobacco, or cancer screening. Cooperative agreement = CDC has substantial involvement. Must collect standardized health outcome data. Current cycle mid-stream — explore subaward with existing Central TX REACH recipient. Letters of support from local health dept, community partners, faith orgs.",
    url: "https://www.cdc.gov/reach/index.html",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 3,
  },
  {
    id: "googleorg-ai-social-good",
    name: "Google.org — AI for Social Good",
    funder: "Google.org",
    amount: "$1M–$3M per organization",
    amountNum: 3000000,
    status: "recurring_watch",
    platforms: ["TCAF", "Ecosystem Nexus", "Multiple"],
    category: "corporate",
    recurringCycle: "Gov Innovation Challenge closed Apr 3; watch for new cycles",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be nonprofit, social enterprise, or academic institution. Must have clear social impact purpose. Must demo how AI/generative AI solves critical public service challenge. Must participate in Google.org Accelerator if selected. Individuals cannot apply. Must show capacity to implement AI at scale. $60M total across two challenge tracks. 24-platform AI operating system = exactly this. Prepare 2-page AI ecosystem brief for next cycle.",
    url: "https://www.google.org/impact-challenges/",
    priority: 2,
  },
  {
    id: "va-gpd-pdo-2027",
    name: "VA GPD Per Diem Only — Veteran Transitional Housing",
    funder: "VA",
    amount: "Per diem reimbursement (3-year grants)",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["Mission Transition", "LifeBridge"],
    category: "federal",
    recurringCycle: "FY2027 NOFO expected late 2026; awards start Oct 1, 2026",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be public or nonprofit entity. Must provide transitional housing OR service center for homeless veterans. Up to 24 months per veteran, goal = permanent housing. Must provide wraparound services (case management, employment, benefits, health). Must coordinate with VA Medical Center homeless programs. Must meet fire/life safety codes. Must have VA per diem agreement. SAM.gov required. GAP: Need physical housing site or partnership with Austin veteran housing provider (Caritas, Foundation Communities). Letter of support from local VA Medical Center required.",
    url: "https://www.va.gov/homeless/gpd.asp",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 3,
  },
  {
    id: "wioa-youth-formula-2026",
    name: "WIOA Title I Youth Formula — via Workforce Board",
    funder: "DOL via TWC via Local Workforce Boards",
    amount: "$948M nationally; varies locally",
    amountNum: 200000,
    status: "recurring_watch",
    platforms: ["ThriveUp Academy"],
    category: "federal",
    recurringCycle: "Ongoing — procurement cycles vary by local board",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "CANNOT apply directly to DOL — must respond to local Workforce Board procurement. Must be selected as Youth Service Provider by Workforce Solutions Capital Area (Austin). Must serve out-of-school youth (16–24) or in-school youth (14–21) with barriers. Must provide 14 WIOA youth program elements. 75% of funds = out-of-school youth. 20% = work experience. Must track credential attainment, employment, measurable skills gains. ThriveUp Academy 50+ career pathways + Panther Village gamification + PfISD hybrid model = purpose-built WIOA youth provider. Contact Workforce Solutions Capital Area about upcoming procurement.",
    submitUrl: "https://www.wfscapitalarea.com/",
    submitPortal: "Workforce Solutions Capital Area",
    priority: 2,
  },
  {
    id: "kpmg-ai-impact-2026",
    name: "KPMG AI Impact Initiative",
    funder: "KPMG U.S. Foundation",
    amount: "$500K–$1.1M + pro bono consulting",
    amountNum: 1100000,
    status: "recurring_watch",
    platforms: ["TCAF", "Multiple"],
    category: "corporate",
    recurringCycle: "No public RFP — selected through partnership outreach",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "U.S.-based nonprofit required. No traditional application — KPMG selects through partner outreach/nominations. Must demo AI integration use case for nonprofit operations. Must participate in skills-based volunteering. Tech partners: Salesforce, Microsoft, ServiceNow, Google Cloud. Prior recipients: First Book ($500K), Big Brothers Big Sisters ($500K), Women's Health Access Matters ($1.1M). 24-platform AI OS = exactly what KPMG funds. Requires executive outreach to KPMG Foundation community impact team.",
    priority: 2,
  },
  {
    id: "sba-mbda-minority-biz",
    name: "SBA/MBDA — Minority Business Development Grants",
    funder: "SBA / Minority Business Development Agency",
    amount: "Varies by program",
    amountNum: 200000,
    status: "recurring_watch",
    platforms: ["MCE", "Pinnacle Business"],
    category: "federal",
    recurringCycle: "Recurring — check mbda.gov",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must serve minority-owned businesses or aspiring minority entrepreneurs. Can be nonprofit, for-profit, educational institution, or govt entity. Must provide business consulting, TA, or capacity building. Must track client outcomes (revenue growth, certifications, contracts won). SAM.gov required. MCE provides SAM.gov integration + certification tools. Pinnacle Business provides consulting + contractor enablement. Letters of support from local minority business orgs or chambers.",
    url: "https://www.mbda.gov/",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 3,
  },
  {
    id: "nih-di-r01-herhealth",
    name: "NIH D&I Research R01 — RPLICE/HerHealth Dissemination (PAR-25-144)",
    funder: "NIH (NIMHD, NCI, NHLBI, NIMH)",
    solicitation: "PAR-25-144",
    amount: "Up to $500K/yr direct costs (5 years)",
    amountNum: 500000,
    deadline: "June 5, 2026 | Oct 5, 2026 | Feb 5, 2027",
    deadlineDate: new Date("2026-06-05"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network", "RPLICE"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
      { name: "Grant Cross-Reference Report", path: "/docs/grants/Grant-Cross-Reference-Report.md" },
    ],
    notes: "FIT SCORE: 92/100 — YOUR NATURAL HOME. RPLICE IS a D&I platform. The Bidirectional Planning Engine is a NOVEL METHODOLOGICAL CONTRIBUTION — publishable in its own right. All CFIR, RE-AIM, ERIC strategies are operationalized, not just referenced. Evidence Programs Gateway + Unified Evidence Discovery in production. SDOH Location Intelligence + equity-focused TMF adapter. Strategy: Pair with INTEGRATE-Austin (R01, $1.25M) as parent study and propose supplemental D&I layer. CRITERIA: Must be nonprofit. No academic partnership required (letter of support acceptable). Clinical Trial Optional. Must study D&I of health intervention. Study HerHealth platform dissemination using RE-AIM across 7 condition domains. Significance (health disparities crisis), Innovation (AI navigator + SDOH-first + Bidirectional Planning), Approach (RE-AIM evaluation), Environment (production-ready). Expires Jan 8, 2028.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PAR-25-144.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 1,
  },
  {
    id: "nih-di-r21-herhealth",
    name: "NIH D&I Research R21 — HerHealth Pilot (PAR-25-143)",
    funder: "NIH (multiple ICs)",
    solicitation: "PAR-25-143",
    amount: "$275K total over 2 years",
    amountNum: 275000,
    deadline: "June 16, 2026 | Oct 16, 2026 | Feb 16, 2027",
    deadlineDate: new Date("2026-06-16"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Exploratory/developmental. No academic partner required. Pilot study measuring HerHealth impact on health literacy and care-seeking among Black women in specific ZIP codes. Study Nia AI navigator effectiveness vs. standard health info sources. Smaller scale, perfect for piloting outcome measures before R01. Expires Jan 8, 2028.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PAR-25-143.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 1,
  },
  {
    id: "nih-parent-r01-nimhd",
    name: "NIH Parent R01 — Health Disparities Focus via NIMHD (PA-25-301)",
    funder: "NIH/NIMHD",
    solicitation: "PA-25-301",
    amount: "$500K/yr direct costs",
    amountNum: 500000,
    deadline: "June 5, 2026 | Oct 5, 2026",
    deadlineDate: new Date("2026-06-05"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Clinical Trial Not Allowed. Submit to NIMHD for minority health disparities focus. Must demonstrate health disparity relevance (Black women's mortality data), innovation (AI navigator), feasibility (platform already deployed). Observational study of how culturally grounded digital health platform affects health info equity, SDOH navigation, and care engagement among Black women across 70 conditions. Expires Jan 8, 2028.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PA-25-301.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 1,
  },
  {
    id: "nih-parent-r21-nimhd",
    name: "NIH Parent R21 — Exploratory Minority Health (PA-25-304)",
    funder: "NIH/NIMHD",
    solicitation: "PA-25-304",
    amount: "$275K total over 2 years",
    amountNum: 275000,
    deadline: "June 16, 2026 | Oct 16, 2026",
    deadlineDate: new Date("2026-06-16"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Clinical Trial Not Allowed. Exploratory/hypothesis-generating. Develop and validate outcome measures for culturally grounded digital health platforms. Pilot test Nia AI navigator accuracy for minority women's health queries vs. generic chatbots. Generate preliminary data for future R01. Perfect for 'Does Nia improve health decision quality?' Expires Jan 8, 2028.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PA-25-304.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "nlm-g08-health-disparities",
    name: "NLM G08 — Information Resources to Reduce Health Disparities",
    funder: "National Library of Medicine, NIH",
    amount: "$150K–$400K over 2-3 years",
    amountNum: 400000,
    deadline: "April 24, 2026 (URGENT)",
    deadlineDate: new Date("2026-04-24"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. No academic partner required. Must be health information project reducing health disparities in underserved populations. PERFECT FIT — HerHealth IS a health information resource: 70 conditions, 2,100+ resources, AI navigation, SDOH-first design. This FOA was written for platforms like this. Check NLM website for current FOA number. Digital access + disparities reduction + underserved populations. DEADLINE 14 DAYS.",
    url: "https://www.nlm.nih.gov/ep/GrantsForFund.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 1,
  },
  {
    id: "nih-structural-racism-r01",
    name: "NIH Structural Racism & Discrimination — Minority Health R01",
    funder: "NIH/NIMHD",
    amount: "Standard R01 ($500K/yr)",
    amountNum: 500000,
    deadline: "October 2026 cycle",
    deadlineDate: new Date("2026-10-05"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Must study structural racism/discrimination mechanisms and health impact. HerHealth explicitly addresses structural racism in healthcare — every condition page names systemic failures, addresses medical mistrust, contextualizes health data through racial equity lens. Study how platform design that acknowledges structural racism affects trust and engagement. HerHealth's 'medical mistrust acknowledged' design principle IS a concrete intervention. Check NIH Guide for current PAR.",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "nih-health-it-disparities-r01",
    name: "NIH Leveraging Health IT to Address Healthcare Disparities R01",
    funder: "NIH (AHRQ participates)",
    amount: "Standard R01 ($500K/yr)",
    amountNum: 500000,
    deadline: "Feb/Jun/Oct cycles",
    deadlineDate: new Date("2026-06-05"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Must demonstrate health IT innovation reducing disparities + evidence of effectiveness or feasibility. PERFECT FIT — HerHealth IS health IT addressing disparities: AI navigator, resource matching, condition-specific appointment prep tools. All deployed for disparity reduction in Black women's health. Check NIH Guide for current PAR.",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 1,
  },
  {
    id: "nci-cancer-disparities-r21",
    name: "NCI Cancer Health Disparities R21 (PAR-25-244)",
    funder: "National Cancer Institute, NIH",
    solicitation: "PAR-25-244",
    amount: "$275K over 2 years",
    amountNum: 275000,
    deadline: "October 16, 2026",
    deadlineDate: new Date("2026-10-16"),
    status: "identified",
    platforms: ["HerHealth Network"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Clinical Trial Not Allowed. Must focus on cancer disparities research. HerHealth Cancer Platform covers 10 conditions: triple-negative breast cancer, BRCA, IBC — all disproportionately affecting Black women. Black women 40% more likely to die from breast cancer. Study platform's impact on cancer screening behavior. Basic/translational focus.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PAR-25-244.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "nia-older-adults-disparities-r01",
    name: "NIH Interventions for Health Disparities in Older Adults R01 (PAR-24-273)",
    funder: "NIA, NIMHD",
    solicitation: "PAR-24-273",
    amount: "Standard R01 ($500K/yr)",
    amountNum: 500000,
    deadline: "June 5, 2026 | Oct 5, 2026",
    deadlineDate: new Date("2026-06-05"),
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Clinical Trial Optional. Must focus on older adults from health disparity populations. HerHealth covers cardiovascular, metabolic, autoimmune conditions disproportionately affecting older Black women. Study platform effectiveness for women 50+ navigating chronic disease management. Expires Jan 8, 2028.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PAR-24-273.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "samhsa-minority-fellowship",
    name: "SAMHSA Minority Fellowship / Community Health Grants",
    funder: "SAMHSA",
    amount: "$100K–$500K",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    recurringCycle: "Annual NOFOs at samhsa.gov/grants",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Must focus on behavioral health in minority populations. Must demonstrate technology-assisted interventions + community-based approach. HerHealth Mental Health Platform covers depression, anxiety, PTSD, racial trauma, postpartum depression among Black women. SAMHSA priorities: behavioral health equity, suicide prevention, substance use in minority populations.",
    url: "https://www.samhsa.gov/grants",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 2,
  },
  {
    id: "owh-digital-health-equity",
    name: "HHS Office on Women's Health — Digital Health Equity",
    funder: "HHS Office on Women's Health",
    amount: "$150K–$500K",
    amountNum: 350000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Feminine Health", "Sankofa Maternal Health"],
    category: "federal",
    recurringCycle: "Annual — check womenshealth.gov/about-us/funding-opportunities",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Must focus on women's health + technology innovation + underserved populations + health equity. PERFECT FIT — OWH funds women's health tech. HerHealth covers 70 women's health conditions with AI navigation. This is exactly what OWH wants to fund.",
    url: "https://www.womenshealth.gov/about-us/funding-opportunities",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 1,
  },
  {
    id: "pcori-health-equity",
    name: "PCORI — Patient-Centered Outcomes Research (Health Equity)",
    funder: "Patient-Centered Outcomes Research Institute",
    amount: "$250K–$3M (varies by mechanism)",
    amountNum: 1500000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network", "LifeBridge"],
    category: "foundation",
    recurringCycle: "Multiple cycles/year at pcori.org/funding-opportunities",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Academic partnership NOT required — letter of support acceptable. Must focus on patient-centered research + health equity + comparative effectiveness + stakeholder engagement. PERFECT FIT — HerHealth is entirely patient-centered: 70 conditions from patient's perspective, Nia AI navigator, appointment prep tools, decision wizards. Compare outcomes when using HerHealth vs. standard health info.",
    url: "https://www.pcori.org/funding-opportunities",
    submitUrl: "https://www.pcori.org/funding-opportunities",
    submitPortal: "PCORI Online Portal",
    priority: 1,
  },
  {
    id: "commonwealth-fund-health-equity",
    name: "Commonwealth Fund — Health Equity & Technology",
    funder: "Commonwealth Fund",
    amount: "$100K–$400K",
    amountNum: 250000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Annual calls at commonwealthfund.org",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit or researcher. Must focus on how technology improves health equity + access + quality for underserved populations. HerHealth is a case study in equity-centered health tech design. Commonwealth Fund specifically studies tech-health equity intersection.",
    url: "https://www.commonwealthfund.org",
    submitUrl: "https://www.commonwealthfund.org",
    submitPortal: "Commonwealth Fund Portal",
    priority: 2,
  },
  {
    id: "direct-relief-health-equity",
    name: "Direct Relief — Fund for Health Equity",
    funder: "Direct Relief (AbbVie, Lilly, MacKenzie Scott)",
    amount: "~$180K over 2 years",
    amountNum: 180000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Maternal Health"],
    category: "foundation",
    recurringCycle: "Award-based at directrelief.org",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit diversifying workforce and reducing disparities. Funds digital maternal health tools for Black/rural communities + CHW support. Both are core HerHealth capabilities. ~$180K over 2 years (recent award sizes).",
    url: "https://www.directrelief.org",
    submitUrl: "https://www.directrelief.org",
    submitPortal: "Direct Relief Portal",
    priority: 2,
  },
  {
    id: "bcbstx-blue-impact",
    name: "Blue Cross Blue Shield of Texas — Blue Impact Grants",
    funder: "BCBS of Texas",
    amount: "$10K–$50K",
    amountNum: 30000,
    status: "identified",
    platforms: ["HerHealth Network", "LifeBridge", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "2025-26 and 2026-27 cycles now open",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be Texas nonprofit addressing SDOH. Must demo measurable health outcomes in Texas communities. Blue Impact targets social/economic factors affecting health. HerHealth integrates SDOH into every condition page + provides 2,100+ resources addressing financial barriers, transportation, insurance gaps. 2026-27 cycle currently open.",
    priority: 1,
  },
  {
    id: "superior-healthplan-community",
    name: "Superior HealthPlan Community Grant Program",
    funder: "Superior HealthPlan (TX Medicaid managed care)",
    amount: "$10,000",
    amountNum: 10000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "LifeBridge"],
    category: "foundation",
    recurringCycle: "Annual — watch for 2026 cycle",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be Texas nonprofit serving Medicaid populations. Must address non-medical drivers of health (housing, food, transportation). Targets exactly the populations HerHealth serves with SDOH-integrated health navigation. $10K quick-win grant. Past deadline April 30, 2025 — watch for 2026 cycle.",
    priority: 3,
  },
  {
    id: "austin-community-foundation",
    name: "Austin Community Foundation — Community Grants",
    funder: "Austin Community Foundation",
    amount: "$5K–$50K",
    amountNum: 25000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "TCAF", "LifeBridge"],
    category: "foundation",
    recurringCycle: "Annual at austincf.org",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be Austin/Travis County nonprofit. Must focus on community wellbeing + equity + measurable outcomes. ACF funds health equity, racial justice in Austin. HerHealth has specific resource depth in Austin/Manor/Pflugerville and covers health conditions affecting Austin's Black population.",
    url: "https://www.austincf.org",
    submitUrl: "https://www.austincf.org",
    submitPortal: "Austin CF Portal",
    priority: 2,
  },
  {
    id: "texas-health-community-impact",
    name: "Texas Health Community Impact Grants",
    funder: "Texas Health Resources",
    amount: "$100K–$385K per project",
    amountNum: 250000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network", "LifeBridge"],
    category: "foundation",
    recurringCycle: "Rolling/annual at texashealth.org",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be Texas nonprofit or community org. Must address health disparities in underserved TX communities with AI/technology + culturally tailored approach. From $5M pool. Recent awards include AI-powered wellness apps for minority women, CHW programs, chronic disease management in underserved ZIPs. HerHealth fits exact profile of recent awardees.",
    url: "https://www.texashealth.org",
    submitUrl: "https://www.texashealth.org",
    submitPortal: "Texas Health Resources Portal",
    priority: 1,
  },
  {
    id: "kresge-health-program",
    name: "Kresge Foundation — Health Program",
    funder: "Kresge Foundation",
    amount: "$100K–$500K",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Open inquiry at kresge.org",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be nonprofit. Must focus on health equity systems change. Kresge funds structural/systemic approaches to health equity. HerHealth represents systemic change in how Black women access health information — from fragmented search to integrated AI-guided navigation across 70 conditions.",
    url: "https://kresge.org",
    submitUrl: "https://kresge.org",
    submitPortal: "Kresge Foundation Portal",
    priority: 2,
  },
  {
    id: "astrazeneca-act-health-equity",
    name: "AstraZeneca Foundation — ACT on Health Equity Challenge",
    funder: "AstraZeneca Foundation",
    amount: "Up to $30K",
    amountNum: 30000,
    status: "recurring_watch",
    platforms: ["HerHealth Network"],
    category: "corporate",
    recurringCycle: "Annual",
    documents: [
      { name: "HerHealth 33-Grant Prospectus", path: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md" },
    ],
    notes: "CRITERIA: Must be community nonprofit improving health equity via nutrition, access, lung health. HerHealth covers cardiovascular, metabolic, respiratory conditions with SDOH navigation. Quick-win grant at $30K.",
    priority: 3,
  },
  {
    id: "cdmrp-prmrp-concept-uveitis-2026",
    name: "CDMRP PRMRP Concept Award — Autoimmune Uveitis & Genetic Variant Screening ($385K)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$385,000 (direct costs, 24 months)",
    amountNum: 385000,
    deadline: "FOAs expected May–Aug 2026 (pre-announcement phase)",
    status: "drafting",
    platforms: ["HerHealth Network", "RPLICE", "SafeCogniCare", "Autoimmune Thrive", "Sankofa Health Network", "M2C Transition", "LifeBridge", "PillScheduler", "Perfectly Different", "Whole-Person Health"],
    category: "federal",
    documents: [
      { name: "Concept Award Draft", path: "/docs/grants/CDMRP-PRMRP-Concept-Award-Draft.md" },
      { name: "Grant Cross-Reference Report", path: "/docs/grants/Grant-Cross-Reference-Report.md" },
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "FIT SCORE: 95/100. DRAFT COMPLETE. Title: 'Implementing Genetic Variant Screening for Autoimmune Uveitis and Retinal Neurodegeneration in Underserved Populations.' PI: Terry Flood, DHA. TOPIC: Autoimmune Disorders (Topic #6) / Vision Injury & Trauma. 3 AIMS: (1) CFIR landscape assessment across 3 clinical sites, (2) Pilot AI-enhanced variant screening (ESM protein language models + ClinVar + gnomAD + RPLICE) with 50 patients, (3) RE-AIM evaluation with health equity analysis. INNOVATIONS: First implementation study of AI protein language models in clinical ophthalmology; Bidirectional Planning Engine methodology; SDOH-grounded implementation. MILITARY: 275K+ eye injuries (2000-2017), blast-TBI-retinal link. EQUITY: Black Americans 6-8x higher glaucoma risk, 40-46% DR screening gap. DESIGN: Hybrid Type 2 effectiveness-implementation. LETTERS NEEDED: 3 clinical sites, EvolutionaryScale API access, patient advocacy org, health department. PRE-SUBMISSION: Register eBRAP.org, subscribe CDMRP alerts, request ESM Forge API access, identify clinical partners, begin IRB planning, prepare Quad Chart + SOW.",
    url: "https://cdmrp.health.mil/prmrp/default",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-prmrp-2026",
    name: "CDMRP #1 — PRMRP Peer Reviewed Medical Research ($370M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$385K–$20M+ (varies by mechanism)",
    amountNum: 5000000,
    deadline: "FOAs pending — pre-announcement LIVE Mar 5, 2026",
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network", "SafeCogniCare", "Whole-Person Health", "Multiple"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
      { name: "Grant Cross-Reference Report", path: "/docs/grants/Grant-Cross-Reference-Report.md" },
    ],
    notes: "TIER 1 — SUBMIT FIRST. $370M across 52 topics, ecosystem matches 45+. Strongest topics: Health Disparities, SDOH, Mental Health, PTSD, Substance Use, Suicide Prevention, Women's Health, Cardiovascular, Diabetes, Autoimmune, Cancer, Pain Management, HIV/AIDS, Kidney Disease, Sleep Disorders, Eating Disorders, Pregnancy/Maternal. Award mechanisms: Concept Award (~$385K), Investigator-Initiated (~$1.5M), Technology Development (~$3M), Clinical Trial (up to ~$20M). Position RPLICE as research infrastructure, Sankofa ecosystem as deployed intervention. SAM.gov required.",
    url: "https://cdmrp.health.mil/prmrp/default",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-prcrp-2026",
    name: "CDMRP #2 — PRCRP Peer Reviewed Cancer Research ($165M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$165M pool",
    amountNum: 2000000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 20, 2026",
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. 11+ of 20 cancer topics covered. HerHealth Cancer: breast (TNBC, BRCA, IBC), cervical, ovarian, endometrial, colorectal, lung, thyroid, melanoma. TheHealthyBlkMan: prostate, colorectal, lung. Must address military health focus: environmental exposure risk, gaps in prevention/detection, or quality of life/survivorship. Health equity angle strong.",
    url: "https://cdmrp.health.mil/prcrp/default",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-bcrp-2026",
    name: "CDMRP #3 — Breast Cancer Research Program (~$120M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$120M pool (awards up to $21M)",
    amountNum: 3000000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 10, 2026",
    status: "identified",
    platforms: ["HerHealth Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Black women 40% more likely to die from breast cancer. TNBC 2-3x more common in Black women. HerHealth covers TNBC, BRCA mutations, IBC. Mammography Decision Wizard + Clinical Trials Wizard are concrete navigation tools. Breakthrough Award Level 1 is perfect entry. Level 4 goes to $21M. Era of Hope Scholar Awards for innovative researchers.",
    url: "https://cdmrp.health.mil/bcrp/default",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-pcrp-2026",
    name: "CDMRP #4 — Prostate Cancer Research Program (~$75M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$75M pool",
    amountNum: 2000000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Black men 2x more likely to die from prostate cancer — largest racial disparity in any cancer. TheHealthyBlkMan covers prostate cancer with Malik AI, 5,200+ providers, barbershop outreach model. Family-unit angle: HerHealth reaches women who influence partner screening decisions. Cross-platform referral HerHealth→TheHealthyBlkMan is novel intervention.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-tbiphrp-2026",
    name: "CDMRP #5 — TBI & Psychological Health (~$55M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$55M pool",
    amountNum: 1000000,
    deadline: "FOAs pending — pre-announcement LIVE ~Mar 5, 2026",
    status: "identified",
    platforms: ["SafeCogniCare", "Whole-Person Health", "Mission Transition"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Three focus areas: Understand, Prevent, Treat. SafeCogniCare = TBI/cognitive navigation. Whole-Person Health = PCL-5 (PTSD), C-SSRS (suicide), PHQ-9, GAD-7. M2C = veteran transition where TBI/PTSD intersect. TheHealthyBlkMan = TBI under Brain & Neurology. Pre-announcement mentions 'crosscutting prevention approaches to address psychological health and TBI.'",
    url: "https://cdmrp.health.mil/tbiphrp/default",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-ocrp-2026",
    name: "CDMRP #6 — Ovarian Cancer Research Program ($50M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$50M pool (Clinical Trial up to ~$2.8M)",
    amountNum: 1000000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 13, 2026",
    status: "identified",
    platforms: ["HerHealth Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Black women diagnosed at later stages with worse survival. HerHealth provides ovarian cancer navigation, screening guidance, treatment decision support. Priority areas: early detection, quality of life/survivorship, prevention. Pilot Award and Academy Award mechanisms available.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-scirp-2026",
    name: "CDMRP #7 — Spinal Cord Injury Research ($33M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$33M pool",
    amountNum: 1000000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 17, 2026",
    status: "identified",
    platforms: ["SafeCogniCare", "Whole-Person Health", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Priority areas: secondary health effects (interventions for injury survivors), psychosocial issues (SCI patients, families, care-partners). Whole-Person Health screens depression/PTSD/substance use post-SCI. LifeBridge navigates housing accessibility, transportation, employment. SafeCogniCare handles cognitive/neurological navigation. Family-caregiver angle through HerHealth.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-lcrp-2026",
    name: "CDMRP #8 — Lung Cancer Research (~$30M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$30M pool",
    amountNum: 1000000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 26, 2026",
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Military connection: burn pit exposure, toxic exposure, higher smoking rates. Both HerHealth and TheHealthyBlkMan cover lung cancer. RPLICE SDOH Location Intelligence pulls EPA air quality data by ZIP code. LDCT screening navigation for high-risk populations is intervention angle.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-ptsd-2026",
    name: "CDMRP #9 — PTSD Research Program (~$20M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$20M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["Whole-Person Health", "Mission Transition", "HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Dedicated PTSD program separate from TBIPHRP. Clinical screening (PCL-5), veteran transition (M2C), racial trauma (HerHealth), community violence/childhood trauma (TheHealthyBlkMan), SDOH barriers (LifeBridge). Family-systems PTSD model: screen veteran AND partner AND children.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-erp-2026",
    name: "CDMRP #10 — Epilepsy Research Program (~$20M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$20M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement LIVE 2026 (LOI process, no invitation required)",
    status: "identified",
    platforms: ["SafeCogniCare"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Focuses on post-traumatic epilepsy (PTE) — epilepsy caused by TBI. Connects SafeCogniCare TBI + epilepsy coverage. Health equity: Black epilepsy patients face disparities in specialist access, medication management (PillScheduler). Streamlined LOI process — no pre-proposal screening required.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-msrp-2026",
    name: "CDMRP #11 — Multiple Sclerosis Research (~$20M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$20M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 18, 2026",
    status: "identified",
    platforms: ["HerHealth Network", "Autoimmune Thrive"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Black patients: more aggressive MS course, earlier onset, faster disability. Two platforms cover MS — Autoimmune Thrive + HerHealth. Health equity: racial disparities in diagnosis timing, treatment access, clinical trial enrollment. PillScheduler supports medication adherence for disease-modifying therapies.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-suicide-2026",
    name: "CDMRP #12 — Suicide Prevention Research (~$15M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$15M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["Whole-Person Health", "Mission Transition"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Suicide prevention infrastructure is concrete and deployed: C-SSRS → Safety Plan Builder → 988 auto-escalation. M2C covers 0-24 month veteran transition (highest-risk window). Black veteran suicide rates rising faster than any other demographic. Cross-platform: partner suicidal ideation on HerHealth routes to Whole-Person Health + M2C.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-sadv-2026",
    name: "CDMRP #13 — Sexual Assault & DV Prevention (~$5M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$5M pool",
    amountNum: 500000,
    deadline: "FOAs pending — covered under TBIPHRP pre-announcement",
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network", "LifeBridge", "Whole-Person Health"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Smaller pool = fewer applicants. Ecosystem addresses IPV from both sides: survivor navigation (HerHealth, LifeBridge housing/legal) AND accountability (TheHealthyBlkMan). LifeBridge addresses #1 barrier to leaving DV: housing. Military sexual trauma affects 1 in 3 women, 1 in 50 men. Gender-specific platforms serve both populations.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-asud-2026",
    name: "CDMRP #14 — Alcohol & Substance Use Disorders ($4M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$4M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["TCAF", "LifeBridge", "Whole-Person Health", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 1. Smallest Tier 1 pool but fewest applicants. SHIELD-Austin R03 pipeline for overdose prevention. LifeBridge: MAT navigation, harm reduction, recovery housing. Whole-Person Health: AUDIT-C, DAST-10. TheHealthyBlkMan: alcohol, opioids, cannabis, tobacco. Austin OD rate highest in TX — site-specific data strengthens application.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-pcarp-2026",
    name: "CDMRP #15 — Pancreatic Cancer Research ($20M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$20M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 12, 2026",
    status: "identified",
    platforms: ["HerHealth Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. 12% survival rate — deadliest major cancer. Black patients 25% higher incidence, disparities in diagnosis timing. HerHealth adding pancreatic cancer coverage. Navigation to reduce diagnostic delay is the health equity angle.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-gwirp-2026",
    name: "CDMRP #16 — Gulf War Illness Research (~$30M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$30M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["Mission Transition", "SafeCogniCare", "Whole-Person Health"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Gulf War illness: chronic pain, cognitive dysfunction, fatigue, GI issues. SafeCogniCare navigates cognitive component. Whole-Person Health screens psychological component. M2C covers veteran benefits. VOSB status and veteran-serving mission provides credibility.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-alsrp-2026",
    name: "CDMRP #17 — ALS Research Program (~$20M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$20M pool",
    amountNum: 500000,
    deadline: "FOAs pending",
    status: "identified",
    platforms: ["SafeCogniCare", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Veterans 2x more likely to develop ALS. SafeCogniCare covers ALS navigation. Caregiver support via HerHealth/TheHealthyBlkMan. LifeBridge: housing modification, disability benefits, legal planning for ALS families.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-terp-2026",
    name: "CDMRP #18 — Burn Pit / Toxic Exposures (~$15M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$15M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["HerHealth Network", "SafeCogniCare", "LifeBridge", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. PACT Act created 3.5M newly eligible veterans. Burn pit causes respiratory disease, cancers, neurological conditions. HerHealth: lung cancer, asthma, CFS/ME. TheHealthyBlkMan: COPD, respiratory. SafeCogniCare: neurological effects. LifeBridge: VA benefits under PACT Act. SDOH Location Intelligence maps veteran populations near former burn pit bases.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-momrp-2026",
    name: "CDMRP #19 — Military Operational Medicine (~$20M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$20M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["Whole-Person Health", "Mission Transition", "RPLICE"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Warfighter readiness = health readiness. Whole-Person Health provides operational screening for psychological fitness. M2C supports transition readiness. RPLICE serves as research infrastructure. Position as implementation science platform helping military health systems adopt evidence-based practices faster.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-prp-2026",
    name: "CDMRP #20 — Parkinson's Research ($16M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "$16M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement LIVE 2026",
    status: "identified",
    platforms: ["SafeCogniCare", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Military exposure links (Agent Orange, pesticides, solvents). SafeCogniCare covers Parkinson's navigation. Black patients diagnosed later, less specialist access, underrepresented in clinical trials. PillScheduler supports complex medication regimens (levodopa timing critical).",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-mrp-2026",
    name: "CDMRP #21 — Melanoma Research (~$12M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$12M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 18, 2026",
    status: "identified",
    platforms: ["HerHealth Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Melanoma in Black patients diagnosed at later stages with dramatically worse survival — providers don't screen darker skin. Acral lentiginous melanoma (palms, soles, nail beds) most common subtype in Black patients. HerHealth addresses this awareness gap. Compelling and underserved health equity angle.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-rcrp-2026",
    name: "CDMRP #22 — Rare Cancers Research (~$17.5M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$17.5M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["HerHealth Network", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Rare cancer patients in underserved communities have almost zero navigation support. HerHealth covers thyroid and endometrial cancer. SDOH barriers amplified for rare cancers (specialist travel, housing). LifeBridge + HerHealth together address navigation gap.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-kcrp-2026",
    name: "CDMRP #23 — Kidney Cancer Research (~$12M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$12M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["HerHealth Network", "Sankofa Health Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Black Americans 3x more likely to develop kidney failure. Camp Lejeune TCE exposure linked to kidney cancer. TheHealthyBlkMan covers CKD and dialysis prevention. HerHealth covers kidney disease, adding kidney cancer. SDOH Location Intelligence maps environmental exposures to risk.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-hrrp-2026",
    name: "CDMRP #24 — Hearing Restoration Research (~$12M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$12M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement LIVE Feb 20, 2026",
    status: "identified",
    platforms: ["HerHealth Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Tinnitus = #1 VA disability claim. Hearing loss = #2. Affects millions of veterans and families. HerHealth adding hearing health. Navigation to audiology, hearing aid access (VA vs OTC). Black veterans less likely to receive hearing aids despite similar prevalence.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-vrp-2026",
    name: "CDMRP #25 — Vision Research Program (~$12M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$12M pool",
    amountNum: 500000,
    deadline: "FOAs pending — expected summer 2026",
    status: "identified",
    platforms: ["HerHealth Network", "RPLICE", "SafeCogniCare", "M2C Transition"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
      { name: "Grant Cross-Reference Report", path: "/docs/grants/Grant-Cross-Reference-Report.md" },
      { name: "Concept Award Draft (PRMRP — related)", path: "/docs/grants/CDMRP-PRMRP-Concept-Award-Draft.md" },
    ],
    notes: "UPGRADED TO TIER 1. FIT SCORE: 88/100. HerHealth Vision & Ocular Health hub LIVE (5 conditions, 30 resources). Clinical depth: Anti-VEGF agents, IL-34, DRCR.net trials, treatment ladders. Disparity data: Black Americans 6-8x higher glaucoma risk, 40-46% diabetic retinopathy screening gap. 4-step screening pathway built into HerHealth. Genetic Variant Intelligence connects to clinical trial databases. Military: blast-related vision injury, TBI-retinal neurodegeneration link. CDMRP badges already in HerHealth hero section. Synergizes with PRMRP Concept Award (autoimmune uveitis).",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-mirp-2026",
    name: "CDMRP #26 — Musculoskeletal Injury Rehab (~$15M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$15M pool",
    amountNum: 500000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["Sankofa Health Network", "Whole-Person Health"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 2. Black veterans: documented disparities in pain management, less adequate treatment, more opioid-only prescriptions. TheHealthyBlkMan covers chronic pain, arthritis, back pain. Whole-Person Health screens for opioid misuse (DAST-10) and pain-related depression (PHQ-9). MSK injury → chronic pain → opioid misuse → SUD is a cascade the ecosystem addresses at every stage.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 2,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-grp-2026",
    name: "CDMRP #27 — Glioblastoma Research (~$12M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$12M pool",
    amountNum: 300000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["SafeCogniCare", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 3. Terminal brain cancer — 15 month median survival. SafeCogniCare covers brain health navigation. Caregiver support through family ecosystem. LifeBridge: employment, housing, legal for families in crisis. Narrow fit but real need for patient/family navigation. Concept Award only if bandwidth allows.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 3,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-nfrp-2026",
    name: "CDMRP #28 — Neurofibromatosis Research (~$15M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$15M pool",
    amountNum: 300000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["HerHealth Network", "SafeCogniCare"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 3. NF patients travel hundreds of miles for specialists. Platform-based navigation reduces care fragmentation. HerHealth adding NF. LifeBridge addresses transportation/housing barriers. Concept Award only.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 3,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-dmdrp-2026",
    name: "CDMRP #29 — Duchenne Muscular Dystrophy (~$8M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$8M pool",
    amountNum: 300000,
    deadline: "FOAs pending — pre-announcement LIVE 2026",
    status: "identified",
    platforms: ["Perfectly Different", "HerHealth Network", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 3. DMD primarily affects boys. Perfectly Different covers neurodevelopmental conditions. Caregiver burden on mothers — HerHealth reaches caregivers. LifeBridge: equipment, home modification, respite care, financial navigation. Adding DMD to Perfectly Different strengthens this. Concept Award only.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 3,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-tbdrp-2026",
    name: "CDMRP #30 — Tick-Borne Disease Research (~$7M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$7M pool",
    amountNum: 300000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["HerHealth Network"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 3. HerHealth covers Lyme disease (#69). Military exposed during field training. Chronic Lyme/post-treatment syndrome creates diagnostic uncertainty that a navigation platform can help manage. Smaller pool, niche audience. Concept Award only.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 3,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "cdmrp-tscrp-2026",
    name: "CDMRP #31 — Tuberous Sclerosis Complex (~$2M)",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "CFDA 12.420",
    amount: "~$2M pool",
    amountNum: 200000,
    deadline: "FOAs pending — pre-announcement expected",
    status: "identified",
    platforms: ["SafeCogniCare", "Perfectly Different"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "TIER 3. Smallest CDMRP program ($2M). TSC = genetic condition causing tumors in brain and organs. SafeCogniCare + Perfectly Different could cover if TSC added. Very narrow pool — fewer applicants but fewer awards. Submit only if bandwidth allows after Tier 1-2.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 3,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "grantwatch-edu-research-2026",
    name: "GrantWatch — Educational Research Projects",
    funder: "GrantWatch / Foundation (TBD via listing)",
    solicitation: "GrantWatch April 2026 Featured",
    amount: "$50,000–$60,000",
    amountNum: 55000,
    deadline: "April 15, 2026 — 12:00 PM Noon CT",
    deadlineDate: new Date("2026-04-15"),
    status: "identified",
    platforms: ["TCAF", "ThriveUp Academy", "ISSS"],
    category: "foundation",
    documents: [],
    notes: "DEADLINE IN 3 DAYS. GrantWatch #172494. QUALIFICATIONS: Applicants must be researchers affiliated with a nonprofit org (IHE, school district, or research facility). Two tiers: up to $50K and up to $60K (likely by project scope/career stage). USA, Canada, and International eligible. SUBMISSION: Apply via GrantWatch listing link — full details behind MemberPlus+ paywall. FIT: RPLICE/Better Science Lab ecosystem impact study, Bidirectional Planning Engine methodology, SDOH-integrated education outcomes, 24-platform longitudinal data. Could fund a formal published study. NOTE: May need academic PI partner (UT Austin, Huston-Tillotson) since TCAF is not an IHE — verify eligibility as 'research facility.'",
    url: "https://www.grantwatch.com/grant/172494/grants-to-usa-canada-and-international-researchers-for-research-projects-related-to-improving-education.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 1,
  },
  {
    id: "grantwatch-human-services-2026",
    name: "GrantWatch — Charitable Causes / Human Services",
    funder: "GrantWatch / Foundation (TBD via listing)",
    solicitation: "GrantWatch April 2026 Featured",
    amount: "Up to $10,000",
    amountNum: 10000,
    deadline: "April 30, 2026 — 11:59 PM CT",
    deadlineDate: new Date("2026-04-30"),
    status: "identified",
    platforms: ["TCAF", "LifeBridge", "Whole-Person Health"],
    category: "foundation",
    documents: [],
    notes: "GrantWatch #153889. QUALIFICATIONS: USA 501(c)(3) nonprofits, public schools, and libraries eligible. FOCUS: Human services, disaster relief, environment. Accepts both program/project AND operating grant requests. SUBMISSION: Full details behind GrantWatch MemberPlus+ paywall — click listing for application link and full requirements. LOW EFFORT, EASY WIN: LifeBridge resource navigation, CHW coordination, community SDOH screening pilot. Small but fast — worth submitting for operating support.",
    url: "https://www.grantwatch.com/grant/153889/grants-to-usa-nonprofits-libraries-and-schools-to-support-charitable-causes.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 2,
  },
  {
    id: "rwjf-global-ideas-2026",
    name: "RWJF — Global Ideas for U.S. Solutions (Health Knowledge Systems)",
    funder: "Robert Wood Johnson Foundation",
    solicitation: "Learning from Abroad to Reimagine Health Knowledge Systems for Equity and Wellbeing",
    amount: "Up to $500,000 ($485K requested)",
    amountNum: 485000,
    deadline: "April 13, 2026 — 3:00 PM ET (Brief Proposal)",
    deadlineDate: new Date("2026-04-13"),
    status: "proposal_drafting",
    platforms: ["TCAF", "Sankofa Health Network", "Whole-Person Health", "HerHealth Network", "ISSS"],
    category: "foundation",
    documents: [
      { name: "Brief Proposal Draft (Complete)", path: "/docs/grants/RWJF-Global-Ideas-2026-Brief-Proposal.md" },
    ],
    notes: "BRIEF PROPOSAL DRAFTED — READY TO SUBMIT. Up to $500K over 36 months (up to 15 awards). QUALIFICATIONS: All US-based orgs eligible. Prioritizes orgs NEW to RWJF (no RWJF funding since Jan 1, 2021 — TCAF qualifies). Encourages applications from leaders who are Indigenous, Black, Latino, LGBTQ+, and other historically marginalized groups. Fiscal sponsors allowed. SUBMISSION: Brief proposal via my.rwjf.org (CFP #3504). Full proposals by invite only (July 9). REQUIREMENTS: Action-oriented projects leveraging learning from outside US to create equitable health knowledge system. Must center communities most affected by health inequities. Cross-sector approaches encouraged. FIT: Sankofa Health Network's African diaspora health knowledge + SDOH navigation + community-driven data. STRONG MATCH on centering marginalized communities, narrative change, and cross-sector collaboration. Contact: Global2026@rwjf.org. KEY DATES: Brief proposals Apr 13 → Invitations May 28 → Full proposals Jul 9 → Decisions Sep 21 → Start Nov 15.",
    url: "https://www.rwjf.org/en/grants/active-funding-opportunities/2026/learning-from-abroad-to-reimagine-health-knowledge-systems-for-equity-and-wellbeing.html",
    submitUrl: "https://my.rwjf.org/applyFromWebsite.do?cfp=3504",
    submitPortal: "RWJF Online Application Portal",
    priority: 1,
    contactEmail: "Global2026@rwjf.org",
  },
  {
    id: "wkkf-community-2026",
    name: "W.K. Kellogg Foundation — Community Health & Racial Equity",
    funder: "W.K. Kellogg Foundation",
    solicitation: "Open / Rolling — No Cycle Deadline",
    amount: "$50–$12,000,000 (typical range)",
    amountNum: 250000,
    deadline: "Rolling — No Deadline (Apply Anytime)",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "ThriveUp Academy", "LifeBridge", "Sankofa Health Network", "Perfectly Different"],
    category: "foundation",
    documents: [],
    notes: "ALWAYS OPEN. ~$350M annual grantmaking budget. QUALIFICATIONS: Must be working in one of 4 focus areas — racial equity, early childhood education, health, or family economic security. Priority geographies include Michigan, Mississippi, New Mexico, and New Orleans, but funds nationwide. TCAF qualifies broadly. SUBMISSION: Register at wkkf.fluxx.io, submit Letter of Inquiry (LOI). No deadlines — reviewed continuously. 80% of final funding decisions within 60 business days. STRENGTHS: WKKF centers racial equity and healing, community-driven solutions. TCAF's 24-platform ecosystem, RPLICE model, Sankofa diaspora health, and LifeBridge CHW navigation all align perfectly. FIT SCORE: VERY HIGH — especially for workforce, health, and racial equity intersections.",
    url: "https://www.wkkf.org/grantseekers/",
    submitUrl: "https://wkkf.fluxx.io/apply/grant_registration/",
    submitPortal: "WKKF Fluxx Portal",
    priority: 1,
  },
  {
    id: "daisy-health-equity-2026",
    name: "DAISY Foundation — Health Equity Grants for Addressing SDoH",
    funder: "The DAISY Foundation",
    solicitation: "Health Equity (SDoH) Grants — Research and EBP",
    amount: "Up to $10,000 (Research) / Up to $2,500 (EBP)",
    amountNum: 10000,
    deadline: "Rolling — Open Applications",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "Sankofa Health Network", "HerHealth Network", "Whole-Person Health"],
    category: "foundation",
    documents: [],
    notes: "OPEN NOW. QUALIFICATIONS: Must be RN-led (registered nurse as PI). PI must be employed or formally affiliated with clinical or community health setting. Interdisciplinary/collaborative projects encouraged but team must be nurse-led. IRB approval or exemption required before funding. Institutional payment only (not to individuals). Must complete within 1 year. SUBMISSION: Apply via daisyfoundation.org — separate forms for Research and EBP grants. Mentor strongly recommended. FOCUS: Nursing research and EBP projects addressing SDoH to improve health outcomes in disadvantaged populations. FIT: HerHealth+ women's health navigation, Sankofa community health screening. REQUIREMENT: Need RN partner as PI — could partner with UT School of Nursing or community health clinic nurse leader. Dissemination of results expected.",
    url: "https://www.daisyfoundation.org/health-equity-sdoh",
    submitUrl: "https://www.daisyfoundation.org/health-equity-grant-program-addressing-sdoh",
    submitPortal: "DAISY Foundation Website",
    priority: 2,
  },
  {
    id: "wellcome-climate-2026",
    name: "Wellcome Trust — Climate & Health Discovery Award",
    funder: "Wellcome Trust",
    solicitation: "Climate Impacts on Health",
    amount: "Up to £500,000",
    amountNum: 625000,
    deadline: "April 8, 2026 (CLOSED — Next cycle TBD)",
    deadlineDate: new Date("2026-04-08"),
    status: "archived",
    platforms: ["TCAF", "Sankofa Health Network", "Whole-Person Health", "Emergency Management"],
    category: "foundation",
    documents: [],
    notes: "DEADLINE PASSED Apr 8. Watch for next cycle. QUALIFICATIONS: Researchers at eligible institutions worldwide. Must address how climate change affects health, particularly in vulnerable populations. SUBMISSION: Wellcome Trust online portal. FIT: Environmental health SDOH, community resilience, emergency management. Track for next opening.",
    url: "https://wellcome.org/grant-funding/schemes/climate-impacts-awards",
    submitUrl: "https://wellcome.org/grant-funding",
    submitPortal: "Wellcome Trust Portal",
    priority: 2,
  },
  {
    id: "wellcome-innovate-now-2026",
    name: "Wellcome Trust — Innovate Now (Global Health Innovation)",
    funder: "Wellcome Trust",
    solicitation: "Innovate Now Programme",
    amount: "Up to £2,000,000",
    amountNum: 2500000,
    deadline: "Rolling — Open Applications",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "Whole-Person Health", "HerHealth Network", "ISSS"],
    category: "foundation",
    documents: [],
    notes: "ROLLING DEADLINE. QUALIFICATIONS: Organizations developing innovations that address global health challenges. Must demonstrate potential for scalable impact. SUBMISSION: Wellcome Trust online portal — expression of interest first, then full application by invitation. FIT: AI-powered health navigation, SDOH screening tools, community health worker digital platforms. 24-platform ecosystem demonstrates scalability.",
    url: "https://wellcome.org/grant-funding",
    submitUrl: "https://wellcome.org/grant-funding",
    submitPortal: "Wellcome Trust Portal",
    priority: 2,
  },
  {
    id: "wellcome-neuroscience-2026",
    name: "Wellcome Trust — Neuroscience & Mental Health",
    funder: "Wellcome Trust",
    solicitation: "Mental Health & Neuroscience Discovery Research",
    amount: "Up to £3,000,000",
    amountNum: 3750000,
    deadline: "Rolling — Open Applications",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "SafeCogniCare", "WholeMind Learning", "Perfectly Different"],
    category: "foundation",
    documents: [],
    notes: "ROLLING DEADLINE. QUALIFICATIONS: Researchers at eligible institutions. Focus on mental health, neurodevelopmental conditions, neurodegenerative diseases. SUBMISSION: Wellcome Trust online portal. FIT: SafeCogniCare cognitive health navigation, WholeMind Learning neurodiversity, Perfectly Different disability inclusion. Would need academic research partner.",
    url: "https://wellcome.org/grant-funding",
    submitUrl: "https://wellcome.org/grant-funding",
    submitPortal: "Wellcome Trust Portal",
    priority: 3,
  },
  {
    id: "wellcome-discovery-2026",
    name: "Wellcome Trust — Discovery Research Award",
    funder: "Wellcome Trust",
    solicitation: "Discovery Research",
    amount: "Up to £3,500,000",
    amountNum: 4375000,
    deadline: "March 31, 2026 (CLOSED — Next cycle TBD)",
    deadlineDate: new Date("2026-03-31"),
    status: "archived",
    platforms: ["TCAF", "ISSS", "Sankofa Health Network"],
    category: "foundation",
    documents: [],
    notes: "DEADLINE PASSED Mar 31. Watch for next cycle. QUALIFICATIONS: Independent researchers with track record. Must propose discovery-oriented research in health sciences. SUBMISSION: Wellcome Trust online portal. FIT: RPLICE longitudinal SDOH data, health disparities research. Would need academic PI. Track for next cycle.",
    url: "https://wellcome.org/grant-funding/schemes/discovery-research",
    submitUrl: "https://wellcome.org/grant-funding",
    submitPortal: "Wellcome Trust Portal",
    priority: 3,
  },
  {
    id: "wellcome-career-dev-2026",
    name: "Wellcome Trust — Career Development Award",
    funder: "Wellcome Trust",
    solicitation: "Career Development Awards",
    amount: "Up to £1,000,000",
    amountNum: 1250000,
    deadline: "March 26, 2026 (CLOSED — Next cycle TBD)",
    deadlineDate: new Date("2026-03-26"),
    status: "archived",
    platforms: ["TCAF", "ISSS"],
    category: "foundation",
    documents: [],
    notes: "DEADLINE PASSED Mar 26. Watch for next cycle. QUALIFICATIONS: Early-to-mid career researchers (4-10 years post-PhD). Must demonstrate research independence. Eligible institutions worldwide. SUBMISSION: Wellcome Trust online portal. FIT: Could support researcher studying TCAF ecosystem impact. Track for next opening.",
    url: "https://wellcome.org/grant-funding/schemes/career-development-awards",
    submitUrl: "https://wellcome.org/grant-funding",
    submitPortal: "Wellcome Trust Portal",
    priority: 3,
  },
  {
    id: "wellcome-early-career-2026",
    name: "Wellcome Trust — Early-Career Awards",
    funder: "Wellcome Trust",
    solicitation: "Early-Career Research Awards",
    amount: "Up to £400,000",
    amountNum: 500000,
    deadline: "February 17, 2026 (CLOSED — Next cycle TBD)",
    deadlineDate: new Date("2026-02-17"),
    status: "archived",
    platforms: ["TCAF", "ISSS"],
    category: "foundation",
    documents: [],
    notes: "DEADLINE PASSED Feb 17. Watch for next cycle. QUALIFICATIONS: Early-career researchers (up to 4 years post-PhD). Must be at eligible institution. SUBMISSION: Wellcome Trust online portal. FIT: Junior researcher studying community health technology platforms. Track for next opening.",
    url: "https://wellcome.org/grant-funding/schemes/early-career-awards",
    submitUrl: "https://wellcome.org/grant-funding",
    submitPortal: "Wellcome Trust Portal",
    priority: 3,
  },
  {
    id: "grantwatch-veterans-medical-2026",
    name: "GrantWatch — Veterans Medical Services & Health Programs",
    funder: "GrantWatch / Multiple Foundations",
    solicitation: "GrantWatch Veterans + Health Category",
    amount: "Varies by listing",
    amountNum: 25000,
    deadline: "Rolling — Multiple Listings Open",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "Mission Transition", "Whole-Person Health", "HerHealth Network"],
    category: "foundation",
    documents: [],
    notes: "ROLLING. GrantWatch Veterans + Health category. QUALIFICATIONS: Varies per listing — typically 501(c)(3) nonprofits serving veterans. SUBMISSION: Via GrantWatch listing links. FIT: Mission Transition veteran workforce navigation, Whole-Person Health veteran wraparound services, HerHealth Network women veteran care. Browse GrantWatch veterans + health/medical cross-category for specific FOAs.",
    url: "https://www.grantwatch.com/cat/38/veterans-and-military-grants.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 2,
  },
  {
    id: "grantwatch-veterans-housing-2026",
    name: "GrantWatch — Veterans Housing & Homelessness Services",
    funder: "GrantWatch / Multiple Foundations",
    solicitation: "GrantWatch Veterans + Housing Category",
    amount: "Varies by listing",
    amountNum: 50000,
    deadline: "Rolling — Multiple Listings Open",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "Mission Transition", "LifeBridge"],
    category: "foundation",
    documents: [],
    notes: "ROLLING. GrantWatch Veterans + Housing cross-category. QUALIFICATIONS: Varies per listing — typically 501(c)(3) serving homeless or at-risk veterans. Many require partnership with VA Medical Center. SUBMISSION: Via GrantWatch listing links. FIT: LifeBridge housing navigation, Mission Transition veteran reintegration, CHW coordination for housing stability.",
    url: "https://www.grantwatch.com/cat/18/homeless-grants.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 2,
  },
  {
    id: "grantwatch-mobile-health-2026",
    name: "GrantWatch — Mobile Health & Telehealth Programs",
    funder: "GrantWatch / Multiple Foundations",
    solicitation: "GrantWatch Health + Technology Category",
    amount: "Varies by listing",
    amountNum: 25000,
    deadline: "Rolling — Multiple Listings Open",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "Whole-Person Health", "HerHealth Network", "Sankofa Health Network"],
    category: "foundation",
    documents: [],
    notes: "ROLLING. GrantWatch mobile health / telehealth listings. QUALIFICATIONS: Varies — typically nonprofits deploying mobile or telehealth services in underserved communities. SUBMISSION: Via GrantWatch listing links. FIT: TCAF's PWA ecosystem is mobile-first by design. HerHealth, Sankofa, Whole-Person Health all work as mobile health platforms. Strong competitive advantage with 24 deployed platforms.",
    url: "https://www.grantwatch.com/cat/14/health-and-medical-grants.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 2,
  },
  {
    id: "grantwatch-healthy-communities-2026",
    name: "GrantWatch — Healthy Communities & Neighborhood Programs",
    funder: "GrantWatch / Multiple Foundations",
    solicitation: "GrantWatch Community Services + Health Category",
    amount: "Varies by listing",
    amountNum: 25000,
    deadline: "Rolling — Multiple Listings Open",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "LifeBridge", "Whole-Person Health", "Sankofa Health Network"],
    category: "foundation",
    documents: [],
    notes: "ROLLING. GrantWatch healthy communities listings. QUALIFICATIONS: Varies — typically 501(c)(3) nonprofits working on community health, wellness, SDOH interventions. SUBMISSION: Via GrantWatch listing links. FIT: LifeBridge CHW navigation, community SDOH screening, neighborhood health resource mapping. RPLICE data can demonstrate community impact.",
    url: "https://www.grantwatch.com/cat/5/community-services-grants.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 2,
  },
  {
    id: "grantwatch-tx-equity-2026",
    name: "GrantWatch — Texas Health Equity & Disparities",
    funder: "GrantWatch / Multiple TX Foundations",
    solicitation: "GrantWatch Texas + Health Equity Category",
    amount: "Varies by listing",
    amountNum: 50000,
    deadline: "Rolling — Multiple Listings Open",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "Sankofa Health Network", "HerHealth Network", "TheHealthyBlkMan"],
    category: "foundation",
    documents: [],
    notes: "ROLLING. GrantWatch Texas-specific health equity listings. QUALIFICATIONS: Texas-based 501(c)(3) nonprofits addressing health disparities. SUBMISSION: Via GrantWatch listing links. FIT: All TCAF health platforms serve Austin/Texas communities. Sankofa, HerHealth, TheHealthyBlkMan directly address racial health disparities. RPLICE SDOH baseline data by ZIP code strengthens every application.",
    url: "https://texas.grantwatch.com/cat/14/health-and-medical-grants.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 1,
  },
  {
    id: "grantwatch-ai-cyber-2026",
    name: "GrantWatch — AI, Cybersecurity & Technology Innovation",
    funder: "GrantWatch / Multiple Foundations",
    solicitation: "GrantWatch Technology Category",
    amount: "Varies by listing",
    amountNum: 50000,
    deadline: "Rolling — Multiple Listings Open",
    deadlineDate: new Date("2026-12-31"),
    status: "identified",
    platforms: ["TCAF", "ISSS", "SafeReport", "Ecosystem Nexus"],
    category: "foundation",
    documents: [],
    notes: "ROLLING. GrantWatch technology + AI + cybersecurity listings. QUALIFICATIONS: Varies — nonprofits and social enterprises using AI/technology for social impact. SUBMISSION: Via GrantWatch listing links. FIT: TCAF's 4-engine AI architecture (RAG, Bidirectional Planning, SDOH Analytics, Community Intelligence), ISSS data systems, SafeReport privacy-preserving tech. 24 live platforms = deployed AI at scale.",
    url: "https://www.grantwatch.com/cat/36/technology-grants.html",
    submitUrl: "https://www.grantwatch.com",
    submitPortal: "GrantWatch",
    priority: 2,
  },
  {
    id: "cdmrp-prmrp-psych-health-2026",
    name: "CDMRP PRMRP — Psychological Health & Resilience Focus",
    funder: "U.S. Army / CDMRP / Defense Health Agency",
    solicitation: "PRMRP FY26 — Psychological Health & Resilience Topic",
    amount: "~$50,000–$350,000 (Concept Award)",
    amountNum: 200000,
    deadline: "FOAs expected May–August 2026",
    status: "researching",
    platforms: ["TCAF", "Mission Transition", "WholeMind Learning", "SafeCogniCare"],
    category: "federal",
    documents: [
      { name: "CDMRP Master Strategy", path: "/docs/grants/CDMRP-FY2026-Master-Grant-Strategy.md" },
    ],
    notes: "FOAs PENDING. PRMRP psychological health & resilience topic area. QUALIFICATIONS: Must address psychological health conditions affecting military/veterans. PI at eligible research institution. Pre-application and eBRAP registration required. SUBMISSION: eBRAP.org → Grants.gov. REQUIREMENTS: Concept Award = 1-page concept + CV. Must show military relevance. FIT: Mission Transition veteran mental health navigation, WholeMind Learning resilience training, SafeCogniCare cognitive assessment. Register eBRAP.org NOW. SAM.gov TIN must be resolved first.",
    url: "https://cdmrp.health.mil/prmrp",
    submitUrl: "https://eBRAP.org",
    submitPortal: "eBRAP.org → Grants.gov",
    priority: 1,
    contactEmail: "cdmrp.pa@mail.mil",
  },
  {
    id: "veterans-transition-app-2026",
    name: "Veterans Transition App — Multi-FOA Submission Strategy",
    funder: "Multiple (CDMRP, VA, DOL)",
    solicitation: "Internal — Cross-Platform Veterans Technology",
    amount: "Varies by FOA ($50K–$500K)",
    amountNum: 250000,
    deadline: "CDMRP FOAs May–August 2026 / VA rolling",
    deadlineDate: new Date("2026-08-31"),
    status: "researching",
    platforms: ["TCAF", "Mission Transition", "LifeBridge", "Whole-Person Health"],
    category: "federal",
    documents: [],
    notes: "INTERNAL STRATEGY. Veterans Transition App bundles Mission Transition + LifeBridge + Whole-Person Health into a unified veteran reintegration technology platform. Target multiple FOAs: CDMRP PRMRP (psychological health), VA GPD (housing), DOL HVRP (workforce), DOL IVTP (incarcerated veterans). Each FOA gets a tailored application but references the same platform. REQUIREMENTS: SAM.gov registration (TIN issue must be resolved), eBRAP.org for CDMRP, Grants.gov for VA/DOL. FIT: Mission Transition already designed for this. 24-platform ecosystem demonstrates wraparound capability.",
    url: "https://cdmrp.health.mil",
    submitUrl: "https://eBRAP.org",
    submitPortal: "Multiple Portals",
    priority: 1,
  },
  {
    id: "tx-health-community-equity-2026",
    name: "Texas Health Resources — Community Health Equity RFP",
    funder: "Texas Health Resources",
    solicitation: "Community Health Impact Grants — Health Equity Focus",
    amount: "Varies (typically $25,000–$100,000)",
    amountNum: 50000,
    deadline: "RFP expected 2026 — Watch for opening",
    deadlineDate: new Date("2026-12-31"),
    status: "researching",
    platforms: ["TCAF", "Sankofa Health Network", "HerHealth Network", "TheHealthyBlkMan", "LifeBridge"],
    category: "foundation",
    documents: [],
    notes: "RFP PENDING. Texas Health Resources funds community health programs addressing equity and SDOH. QUALIFICATIONS: Texas-based 501(c)(3) nonprofits. Must align with Texas Health community health needs assessment priorities. SUBMISSION: Via Texas Health Resources grant portal when RFP opens. FIT: All TCAF Austin health platforms, SDOH screening, CHW coordination. Previously funded BCBSTX-style community health initiatives. Watch texashealth.org/community-health/community-impact/Grant-Opportunities for RFP release.",
    url: "https://www.texashealth.org/community-health/community-impact/Grant-Opportunities",
    submitUrl: "https://www.texashealth.org/community-health/community-impact/Grant-Opportunities",
    submitPortal: "Texas Health Resources Portal",
    priority: 2,
  },
  {
    id: "mckinney-isd-pd-2026",
    name: "McKinney ISD -- Professional Development, Training, Consultant & Brokerage Services",
    funder: "McKinney Independent School District",
    solicitation: "RFP (Approved Vendor List)",
    amount: "Per-service pricing (recurring contract)",
    amountNum: 0,
    deadline: "May 29, 2026, 2:00 PM CT (rolling monthly evaluations)",
    deadlineDate: new Date("2026-05-29"),
    status: "identified",
    platforms: ["M&T Consulting", "CIP LLC", "TCAF", "ThriveUp Academy", "ISSS", "Perfectly Different"],
    category: "state",
    documents: [
      { name: "RFP Document", path: "/attached_assets/PROFESSIONAL_DEVELOPMENT,_TRAINING,_CONSULTANT,_AND_BROKERAGE_1776128483319.docx" },
    ],
    notes: "CONTRACT OPPORTUNITY (revenue, not grant). McKinney ISD approved vendor list for PD, training, consulting, brokerage. Covers: instructional PD (TEKS alignment, differentiated instruction, special ed, gifted, ELL), leadership development, technology training, program evaluation, grant writing, speaking/presentations, brokerage. Scoring: 50pts needs match, 35pts price, 10pts TX-based (yes), 5pts relationship. Interlocal clause: award extends to EPCNT, CCGPF, CTPA member districts. Initial term through May 2027 + 4 one-year renewals through 2031. Entity: M&T Consulting (staffing/PD lane) or CIP LLC (technology training). Electronic submission preferred. Question cutoff: May 13, 2026.",
    url: "https://mckinney.ionwave.net",
    submitPortal: "McKinney ISD IonWave Procurement Portal",
    priority: 2,
  },
  {
    id: "borealis-difxtech-2026",
    name: "Borealis Philanthropy DIF x Tech 2026 -- Disability x Technology",
    funder: "Borealis Philanthropy (Ford Foundation + MacArthur Foundation)",
    solicitation: "Disability Inclusion Fund x Tech Initiative 2026-2027",
    amount: "$50,000 - $100,000",
    amountNum: 75000,
    deadline: "May 20, 2026, 11:59 PM ET",
    deadlineDate: new Date("2026-05-20"),
    status: "identified",
    platforms: ["TCAF", "Perfectly Different", "LexiBridge", "SafeCogniCare", "ThriveUp Academy"],
    category: "foundation",
    documents: [
      { name: "Application Draft", path: "/docs/grants/Borealis-DIF-x-Tech-2026-Application-Draft.md" },
    ],
    notes: "STRONG FIT. 2-year grant ($25K-$50K/yr). TCAF qualifies as 501(c)(3). Focus: disability justice as public interest tech priority, democratize tech development, equitable access to digital infrastructure, expand participation of disabled people in tech. TCAF ADVANTAGES: (1) Perfectly Different -- neurodiversity/IEP/504 platform, (2) LexiBridge -- assistive speech/communication tech, (3) SafeCogniCare -- cognitive safety assessments, (4) Offline-capable PWAs bridging digital divide for disabled communities, (5) Intersectional: disability + race + poverty + health disparities. Fundable strategies include algorithmic bias mitigation, anti-ableist design, digital divide bridging, cross-movement coalition building. INFO SESSION: April 15 at 1:00 PM CST. Contact: difxtech@borealisphilanthropy.org. Advisory committee review process.",
    url: "https://borealisphilanthropy.org/news-and-views/difxtech2026/",
    submitUrl: "https://borealisphilanthropy.org/news-and-views/difxtech2026/",
    submitPortal: "Borealis Philanthropy Application Portal",
    priority: 1,
    contactName: "DIF x Tech Program Team",
    contactEmail: "difxtech@borealisphilanthropy.org",
  },
  {
    id: "army-sbir-aiml-2026",
    name: "Army SBIR -- AI/ML Focused Open Topic (CIP LLC)",
    funder: "U.S. Army / Department of Defense",
    solicitation: "AI/ML Focused Open Topic",
    amount: "$250,000 (Phase I) / $2,000,000 (Direct Phase II)",
    amountNum: 2000000,
    deadline: "Late April-May 2026 (post-reauthorization)",
    deadlineDate: new Date("2026-05-31"),
    status: "researching",
    platforms: ["CIP LLC", "ThriveUp Academy", "TCAF"],
    category: "federal",
    documents: [],
    notes: "SBIR via CIP LLC (EIN 41-4996540, veteran-owned for-profit SBC). TCAF can be subcontractor/partner. Reauthorization (S.3971) becomes law April 14. Army expected first to reopen. CIP LLC tech maps to required sub-fields: RAG engine (Retrieval Augmented Generation), NLP/LLM across 24-platform ecosystem, Explainable AI. Phase I: $250K/6 months. Direct to Phase II: $2M/24 months if existing feasibility demonstrated. Submit via DSIP portal (dodsbirsttr.mil). Veteran-owned scoring advantage.",
    url: "https://armysbir.army.mil/topics/ai-ml-focused-open-topic/",
    submitUrl: "https://www.dodsbirsttr.mil",
    submitPortal: "DSIP (Defense SBIR/STTR Innovation Portal)",
    priority: 2,
  },
  {
    id: "nsf-sbir-seedfund-2026",
    name: "NSF SBIR America's Seed Fund -- AI Workforce EdTech (CIP LLC)",
    funder: "National Science Foundation",
    solicitation: "NSF SBIR Phase I (NSF 24-579)",
    amount: "$275,000 (Phase I)",
    amountNum: 275000,
    deadline: "Rolling (reopening post-reauthorization, late April 2026)",
    deadlineDate: new Date("2026-06-30"),
    status: "researching",
    platforms: ["CIP LLC", "ThriveUp Academy", "ISSS", "TCAF"],
    category: "federal",
    documents: [],
    notes: "SBIR via CIP LLC. NSF is topic-agnostic -- AI-powered workforce development for underrepresented communities is exactly what they fund. Non-dilutive $275K Phase I. Process: submit Project Pitch (brief online form) -> NSF reviews in ~3 weeks -> if invited, submit full proposal. Rolling windows. Currently paused during reauthorization lapse -- expected to reopen imminently. Veteran-owned + broadening participation = strong competitive position. Submit via Research.gov. Contact: sbir@nsf.gov.",
    url: "https://seedfund.nsf.gov",
    submitUrl: "https://research.gov",
    submitPortal: "Research.gov",
    priority: 2,
  },
  {
    id: "nih-nimhd-sttr-2026",
    name: "NIH/NIMHD STTR -- Health Disparities Digital Platform (CIP LLC + TCAF)",
    funder: "NIH / National Institute on Minority Health and Health Disparities",
    solicitation: "STTR (to be announced post-reauthorization)",
    amount: "$314,000 (Phase I) / $2,000,000 (Phase II)",
    amountNum: 2000000,
    deadline: "Late April-May 2026 (NOFOs pending)",
    deadlineDate: new Date("2026-06-30"),
    status: "researching",
    platforms: ["CIP LLC", "TCAF", "Sankofa Health Network", "HerHealth Network", "TheHealthyBlkMan", "SafeCogniCare"],
    category: "federal",
    documents: [],
    notes: "STTR structure: CIP LLC (prime, for-profit SBC) + TCAF (Research Institution, 501(c)(3) doing 30%+ R&D). Textbook STTR partnership. Dr. Flood can be PI at either entity. NIMHD priority topics that match: (1) mHealth/telehealth for underserved -- Sankofa network, (2) Big data + SDOH linking -- GIS resource matching with 20,670+ resources and census tract disparity mapping, (3) AI for disparity prediction -- systems modeling across 24 platforms, (4) Community engagement tools -- culturally responsive care navigation. No active NOFOs currently -- watch Grants.gov for forecast postings. NIH indicated new NOFOs will be forecasted before opening.",
    url: "https://seed.nih.gov",
    submitUrl: "https://grants.gov",
    submitPortal: "Grants.gov / eRA Commons",
    priority: 2,
  },
  {
    id: "ed-ies-sbir-2026",
    name: "ED/IES SBIR -- Education Technology (CIP LLC)",
    funder: "U.S. Department of Education / Institute of Education Sciences",
    solicitation: "ED/IES SBIR Phase I/II",
    amount: "$250,000 (Phase I) / $1,000,000 (Phase II)",
    amountNum: 1000000,
    deadline: "November 2026 (annual window)",
    deadlineDate: new Date("2026-11-30"),
    status: "researching",
    platforms: ["CIP LLC", "ThriveUp Academy", "ISSS", "WholeMind Learning", "Perfectly Different"],
    category: "federal",
    documents: [],
    notes: "SBIR via CIP LLC. ED/IES SBIR funds R&D of education technology products. Three tracks: Phase IA ($250K/9mo, novel prototypes), Phase IB ($250K/9mo, strengthen existing), Direct to Phase II ($1M/2yr, scale researcher-developed innovations). ThriveUp Academy with AI curriculum, resume builder, workforce readiness modules = production-ready ed-tech. ISSS MTSS engine with Thrive Score algorithm. Perfectly Different for special education technology (Priority Area 2). Highly competitive: 175-275 proposals, only 10-15 funded. Annual window typically November-January. Submit via SAM.gov.",
    url: "https://ies.ed.gov/funding/research/programs/small-business-innovation-research-sbir",
    submitUrl: "https://sam.gov",
    submitPortal: "SAM.gov",
    priority: 3,
  },
  {
    id: "austin-south-housing-navigation-2026",
    name: "City of Austin — South Austin Housing Navigation Center Operator",
    funder: "City of Austin Homeless Strategies & Operations (AHSO)",
    solicitation: "AHSO Contracting Unit RFP (opened April 13, 2026)",
    amount: "Up to $250,000",
    amountNum: 250000,
    deadline: "TBD — RFP opened April 13, 2026 (deadline pending full solicitation release)",
    deadlineDate: new Date("2026-05-15"),
    status: "researching",
    platforms: ["TCAF", "LifeBridge", "ThriveUp Academy", "Sankofa Health Network"],
    category: "other",
    documents: [],
    notes: "STRONG FIT — Operate the City-owned South Austin Housing Navigation Center near I-35 & Oltorf. First City-owned navigation center, expected to open late summer/early fall 2026. Up to $250K for operations and service delivery. Collaborative proposals allowed but a LEAD AGENCY MUST BE IDENTIFIED. Center serves dual function: (1) prevention/diversion for housing-instability households (root factors: healthcare access, income/employment, lease adherence, housing quality, family safety), and (2) basic needs + next steps for those already homeless (food, hygiene, healthcare, vital documents, mailing address, housing assessment, mainstream benefits). PERFECT LIFEBRIDGE ALIGNMENT: warm handoffs, GIS resource matching (20,670+ resources), Benefits Screener (9+ programs), Workforce Assessment, Sankofa Health Network for healthcare access, Career Explorer for employment. Performance metrics expected: housing placements, service accessibility, cost efficiency. Aligns with AHSO 2025-27 Strategic Plan goals (650 shelter beds + 2 navigation centers). ACTION: (1) Monitor austintexas.gov/homeless-strategies/homeless-strategies-and-operations-contracting-unit for full solicitation, (2) Decide lead agency posture (TCAF lead OR partner under another lead like ECHO/Caritas/Front Steps), (3) Engage ECHO as community partner. Director: David Gray, AHSO.",
    url: "https://www.austintexas.gov/homeless-strategies/news/city-austin-announces-upcoming-opportunity-organizations-operate-south",
    submitUrl: "https://www.austintexas.gov/homeless-strategies/homeless-strategies-and-operations-contracting-unit",
    submitPortal: "City of Austin AHSO Contracting Unit",
    priority: 1,
    contactName: "David Gray, Director, Austin Homeless Strategies & Operations",
  },
  {
    id: "bja-sca-education-employment-2025",
    name: "BJA FY25 Second Chance Act — Improving Reentry Education & Employment Outcomes (Category 2)",
    funder: "Bureau of Justice Assistance (BJA) / U.S. Department of Justice",
    solicitation: "O-BJA-2025-172507",
    amount: "$900,000",
    amountNum: 900000,
    deadline: "May 4, 2026 (Grants.gov) / May 11, 2026 (JustGrants)",
    deadlineDate: new Date("2026-05-04"),
    status: "researching",
    platforms: ["TCAF", "LifeBridge", "ThriveUp Academy", "Mission Transition"],
    category: "federal",
    documents: [],
    notes: "PERFECT FIT — Category 2: Improving Employment Services & Connections. $900K over 36 months. Create a career pathway system or workforce development network for incarcerated individuals within 2 years of release. TCAF has: TX Reentry Stipend Pilot (running), Reentry Dashboard (4-phase case mgmt), Career Explorer (89 pathways, 56 non-collegiate), Workforce Assessment (justice-involved employer flags), Benefits Screener (9+ programs), LifeBridge (warm handoffs), intake wizard with Justice History step, Mentorship Directory. NEED: (1) Releasing institution partner (Travis County Jail, TDCJ facility), (2) Local recidivism/employment data, (3) Letters of collaboration from correctional partners. Must budget travel for 3 staff to 2 DOJ-sponsored meetings. No cost match required. Evidence-based practices required — RPLICE/CFIR 2.0 framework qualifies. Must include sustainability & replicability plan.",
    url: "https://bja.ojp.gov/funding/opportunities/o-bja-2025-172507",
    submitUrl: "https://justgrants.usdoj.gov",
    submitPortal: "Grants.gov + JustGrants",
    priority: 1,
    contactName: "Bureau of Justice Assistance",
  },
  {
    id: "bja-sca-community-reentry-2025",
    name: "BJA FY25 Second Chance Act — Community-Based Reentry Program",
    funder: "Bureau of Justice Assistance (BJA) / U.S. Department of Justice",
    solicitation: "O-BJA-2025-172499",
    amount: "$900,000",
    amountNum: 900000,
    deadline: "May 4, 2026 (Grants.gov) / May 11, 2026 (JustGrants)",
    deadlineDate: new Date("2026-05-04"),
    status: "identified",
    platforms: ["TCAF", "LifeBridge", "Mission Transition"],
    category: "federal",
    documents: [],
    notes: "STRONG FIT — Community-based mentoring and transitional services for moderate-to-high-risk adults returning from incarceration. Same BJA suite as Education/Employment NOFO. TCAF qualifies as nonprofit. Aligns with LifeBridge warm handoff model, Mentorship Directory, Justice Command Center, and Transition Plans tool. Could apply to BOTH this and Category 2 Education/Employment NOFO — different solicitation numbers. Same deadlines. Evaluate whether to submit to one or both.",
    url: "https://bja.ojp.gov/funding/opportunities/o-bja-2025-172499",
    submitUrl: "https://justgrants.usdoj.gov",
    submitPortal: "Grants.gov + JustGrants",
    priority: 2,
    contactName: "Bureau of Justice Assistance",
  },
];

function StatusBadge({ status }: { status: GrantStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} text-[10px] font-medium gap-1`} data-testid={`badge-status-${status}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function PriorityDot({ priority }: { priority: 1 | 2 | 3 }) {
  const colors = { 1: "bg-red-500", 2: "bg-yellow-500", 3: "bg-blue-400" };
  const labels = { 1: "Critical", 2: "High", 3: "Watch" };
  return (
    <div className="flex items-center gap-1.5" data-testid={`priority-${priority}`}>
      <div className={`w-2 h-2 rounded-full ${colors[priority]}`} />
      <span className="text-[10px] text-muted-foreground">{labels[priority]}</span>
    </div>
  );
}

function daysUntil(date?: Date): number | null {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineTag({ date }: { date?: Date }) {
  const days = daysUntil(date);
  if (days === null) return <span className="text-xs text-muted-foreground">No deadline</span>;
  if (days < 0) return <span className="text-xs text-muted-foreground">Passed</span>;
  if (days === 0) return <span className="text-xs font-bold text-red-600">TODAY</span>;
  if (days <= 3) return <span className="text-xs font-bold text-red-600">{days}d left</span>;
  if (days <= 7) return <span className="text-xs font-semibold text-orange-600">{days}d left</span>;
  if (days <= 30) return <span className="text-xs text-yellow-600">{days}d left</span>;
  return <span className="text-xs text-muted-foreground">{days}d</span>;
}

function GrantRow({ grant }: { grant: GrantEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-b-0" data-testid={`grant-row-${grant.id}`}>
      <div
        className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`} />
        <PriorityDot priority={grant.priority} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{grant.name}</p>
          <p className="text-[11px] text-muted-foreground">{grant.funder}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {grant.platforms.slice(0, 2).map((p) => (
            <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>
          ))}
          {grant.platforms.length > 2 && (
            <Badge variant="outline" className="text-[9px]">+{grant.platforms.length - 2}</Badge>
          )}
        </div>
        <div className="text-right shrink-0 w-20">
          <p className="text-xs font-semibold">{grant.amount}</p>
          <DeadlineTag date={grant.deadlineDate} />
        </div>
        <StatusBadge status={grant.status} />
      </div>

      {expanded && (
        <div className="px-10 pb-4 space-y-3 bg-muted/10">
          {(grant.submitUrl || grant.url) && (
            <div className="flex gap-2 mb-1">
              {grant.submitUrl && (
                <a
                  href={grant.submitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  data-testid={`link-submit-${grant.id}`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit via {grant.submitPortal || "Portal"}
                </a>
              )}
              {grant.url && grant.url !== grant.submitUrl && (
                <a
                  href={grant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
                  data-testid={`link-foa-${grant.id}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Funding Opportunity
                </a>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Details</p>
              {grant.solicitation && <p>Solicitation: {grant.solicitation}</p>}
              {grant.deadline && <p>Deadline: {grant.deadline}</p>}
              {grant.submittedDate && <p>Submitted: {grant.submittedDate}</p>}
              {grant.recurringCycle && <p>Cycle: {grant.recurringCycle}</p>}
              {grant.nextCycleDate && <p>Next Cycle: {grant.nextCycleDate}</p>}
              <p>Category: {grant.category}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Platforms</p>
              <div className="flex flex-wrap gap-1">
                {grant.platforms.map((p) => (
                  <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>
                ))}
              </div>
              {grant.contactName && (
                <div className="mt-2">
                  <p className="font-semibold text-muted-foreground mb-0.5">Contact</p>
                  <p>{grant.contactName}</p>
                  {grant.contactEmail && <p className="text-muted-foreground">{grant.contactEmail}</p>}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Documents</p>
              {grant.documents.length > 0 ? (
                <ul className="space-y-1">
                  {grant.documents.map((doc) => (
                    <li key={doc.path} className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No documents yet</p>
              )}
            </div>
          </div>
          <div className="text-xs">
            <p className="font-semibold text-muted-foreground mb-1">Notes</p>
            <p className="text-muted-foreground">{grant.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({ grants }: { grants: GrantEntry[] }) {
  const months = [
    "April 2026", "May 2026", "June 2026", "July 2026",
    "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"
  ];

  const monthGrants = months.map((month) => {
    const [monthName, year] = month.split(" ");
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const yearNum = parseInt(year);

    const active = grants.filter((g) => {
      if (g.deadlineDate) {
        return g.deadlineDate.getMonth() === monthIndex && g.deadlineDate.getFullYear() === yearNum;
      }
      return false;
    });

    const recurring = grants.filter((g) => {
      if (g.status === "recurring_watch" && g.nextCycleDate) {
        return g.nextCycleDate.toLowerCase().includes(monthName.toLowerCase());
      }
      return false;
    });

    return { month, active, recurring };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="calendar-view">
      {monthGrants.map(({ month, active, recurring }) => (
        <Card key={month} className={`p-3 ${active.length > 0 ? "border-primary/30" : ""}`}>
          <p className="text-xs font-bold mb-2">{month}</p>
          {active.length === 0 && recurring.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">No deadlines</p>
          )}
          {active.map((g) => (
            <div key={g.id} className="flex items-center gap-2 mb-1.5">
              <PriorityDot priority={g.priority} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{g.name}</p>
                <p className="text-[9px] text-muted-foreground">{g.deadline} — {g.amount}</p>
              </div>
              <StatusBadge status={g.status} />
            </div>
          ))}
          {recurring.map((g) => (
            <div key={g.id} className="flex items-center gap-2 mb-1.5 opacity-70">
              <Bell className="h-3 w-3 text-indigo-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{g.name}</p>
                <p className="text-[9px] text-muted-foreground">{g.recurringCycle}</p>
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function PipelineStats({ grants }: { grants: GrantEntry[] }) {
  const active = grants.filter((g) => !["archived", "rejected", "recurring_watch"].includes(g.status));
  const submitted = grants.filter((g) => ["loi_submitted", "proposal_submitted"].includes(g.status));
  const watching = grants.filter((g) => g.status === "recurring_watch");
  const totalPipeline = active.reduce((sum, g) => sum + g.amountNum, 0);

  const urgentCount = active.filter((g) => {
    const days = daysUntil(g.deadlineDate);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="pipeline-stats">
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-4 w-4 text-primary" />
          <p className="text-[10px] font-medium text-muted-foreground">Active Grants</p>
        </div>
        <p className="text-xl font-bold">{active.length}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Send className="h-4 w-4 text-green-600" />
          <p className="text-[10px] font-medium text-muted-foreground">Submitted</p>
        </div>
        <p className="text-xl font-bold">{submitted.length}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-[10px] font-medium text-muted-foreground">Due This Week</p>
        </div>
        <p className="text-xl font-bold">{urgentCount}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-4 w-4 text-indigo-500" />
          <p className="text-[10px] font-medium text-muted-foreground">Watching</p>
        </div>
        <p className="text-xl font-bold">{watching.length}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <p className="text-[10px] font-medium text-muted-foreground">Active Pipeline</p>
        </div>
        <p className="text-xl font-bold">${(totalPipeline / 1000000).toFixed(1)}M</p>
      </Card>
    </div>
  );
}

export default function GrantCommandCenterPage() {
  const [grants] = useState<GrantEntry[]>(INITIAL_GRANTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const allPlatforms = useMemo(() => {
    const set = new Set<string>();
    grants.forEach((g) => g.platforms.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [grants]);

  const filtered = useMemo(() => {
    return grants.filter((g) => {
      if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !g.funder.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (platformFilter !== "all" && !g.platforms.includes(platformFilter as Platform)) return false;
      return true;
    }).sort((a, b) => {
      if (a.status === "recurring_watch" && b.status !== "recurring_watch") return 1;
      if (b.status === "recurring_watch" && a.status !== "recurring_watch") return -1;
      if (!a.deadlineDate && !b.deadlineDate) return a.priority - b.priority;
      if (!a.deadlineDate) return 1;
      if (!b.deadlineDate) return -1;
      return a.deadlineDate.getTime() - b.deadlineDate.getTime();
    });
  }, [grants, searchTerm, statusFilter, categoryFilter, platformFilter]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <BarChart3 className="h-6 w-6 text-primary" />
            Grant Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unified clearinghouse — TCAF + all ecosystem platforms
          </p>
        </div>
      </div>

      <PipelineStats grants={grants} />

      <Tabs defaultValue="this-week" className="space-y-4">
        <TabsList>
          <TabsTrigger value="this-week" data-testid="tab-this-week">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> This Week
          </TabsTrigger>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            <Target className="h-3.5 w-3.5 mr-1.5" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="watching" data-testid="tab-watching">
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Recurring Watch
          </TabsTrigger>
        </TabsList>

        <TabsContent value="this-week">
          <ThisWeekView />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search grants or funders..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px] h-9" data-testid="select-platform">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {allPlatforms.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            {filtered.filter(g => g.status !== "recurring_watch").length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No grants match your filters</p>
              </div>
            ) : (
              filtered.filter(g => g.status !== "recurring_watch").map((grant) => (
                <GrantRow key={grant.id} grant={grant} />
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView grants={grants} />
        </TabsContent>

        <TabsContent value="watching" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Recurring grant opportunities being monitored. These are grants with annual or rolling cycles that TCAF platforms align with.
          </p>
          <Card>
            {grants.filter(g => g.status === "recurring_watch").map((grant) => (
              <GrantRow key={grant.id} grant={grant} />
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Platform-to-Grant Coverage Map
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1.5 font-semibold">Platform</th>
                <th className="text-center p-1.5 font-semibold">Active</th>
                <th className="text-center p-1.5 font-semibold">Watching</th>
                <th className="text-center p-1.5 font-semibold">Total $</th>
                <th className="text-left p-1.5 font-semibold">Top Funders</th>
              </tr>
            </thead>
            <tbody>
              {allPlatforms.map((platform) => {
                const platformGrants = grants.filter((g) => g.platforms.includes(platform as Platform));
                const active = platformGrants.filter((g) => !["archived", "rejected", "recurring_watch"].includes(g.status));
                const watching = platformGrants.filter((g) => g.status === "recurring_watch");
                const totalAmt = platformGrants.reduce((s, g) => s + g.amountNum, 0);
                const funders = [...new Set(platformGrants.map((g) => g.funder))].slice(0, 3);

                return (
                  <tr key={platform} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="p-1.5 font-medium">{platform}</td>
                    <td className="p-1.5 text-center">{active.length}</td>
                    <td className="p-1.5 text-center">{watching.length}</td>
                    <td className="p-1.5 text-center">${(totalAmt / 1000).toFixed(0)}K</td>
                    <td className="p-1.5 text-muted-foreground truncate max-w-[200px]">{funders.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
