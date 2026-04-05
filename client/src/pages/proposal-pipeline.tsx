import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Rocket, Target, Clock, AlertTriangle, CheckCircle2,
  Circle, XCircle, DollarSign, Building2, FileText,
  Download, ChevronDown, ChevronUp, Microscope,
  Users, Calendar, ArrowRight, Zap, Shield,
  FlaskConical, GraduationCap, Atom, BookOpen
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";

interface Partner {
  name: string;
  role: string;
  status: string;
  note: string;
}

interface ChecklistItem {
  item: string;
  status: "complete" | "action_required" | "not_started" | "blocker";
  note: string;
}

interface ImplScience {
  frameworks: string[];
  instrument: string;
  researchDesign: string;
  evaluationLevel: string;
}

interface Proposal {
  id: string;
  title: string;
  shortTitle: string;
  solicitation: string;
  agency: string;
  entity: string;
  priority: number;
  status: string;
  fundingRange: string;
  budgetTarget: number;
  deadline: string | null;
  deadlineLabel: string;
  partnersRequired: boolean;
  partners: Partner[];
  frameworkDoc: string;
  implementationScience: ImplScience;
  readinessChecklist: ChecklistItem[];
  blockers: string[];
  winStrategy: string;
  nextActions: string[];
}

interface PipelineSummary {
  totalProposals: number;
  totalPotentialFunding: number;
  readyToSubmit: number;
  frameworksComplete: number;
  evaluationsComplete: number;
  criticalBlockers: string[];
  upcomingDeadlines: Array<{ title: string; deadline: string; daysRemaining: number }>;
}

interface PipelineData {
  proposals: Proposal[];
  summary: PipelineSummary;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "submission_ready":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid={`badge-status-${status}`}><CheckCircle2 className="h-3 w-3 mr-1" /> Ready to Submit</Badge>;
    case "framework_complete":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" data-testid={`badge-status-${status}`}><FileText className="h-3 w-3 mr-1" /> Framework Complete</Badge>;
    case "evaluation_complete":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" data-testid={`badge-status-${status}`}><Target className="h-3 w-3 mr-1" /> Evaluation Complete</Badge>;
    case "in_progress":
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" data-testid={`badge-status-${status}`}><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>;
    default:
      return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  }
}

function getChecklistIcon(status: string) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    case "action_required":
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case "blocker":
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

function getProposalIcon(id: string) {
  switch (id) {
    case "nsf-stem-k12":
      return <GraduationCap className="h-5 w-5" />;
    case "nsf-ate":
      return <FlaskConical className="h-5 w-5" />;
    case "nsf-iuse-edu":
      return <BookOpen className="h-5 w-5" />;
    case "nsf-quantum":
      return <Atom className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

function getPriorityColor(priority: number) {
  switch (priority) {
    case 1: return "from-green-500 to-emerald-600";
    case 2: return "from-blue-500 to-indigo-600";
    case 3: return "from-amber-500 to-orange-600";
    case 4: return "from-purple-500 to-violet-600";
    default: return "from-gray-500 to-gray-600";
  }
}

function getReadinessPercent(checklist: ChecklistItem[]) {
  if (checklist.length === 0) return 0;
  const complete = checklist.filter(c => c.status === "complete").length;
  return Math.round((complete / checklist.length) * 100);
}

function getDaysUntil(deadline: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days;
}

function ProposalCard({ proposal, expanded, onToggle }: { proposal: Proposal; expanded: boolean; onToggle: () => void }) {
  const { toast } = useToast();
  const readiness = getReadinessPercent(proposal.readinessChecklist);
  const daysLeft = getDaysUntil(proposal.deadline);
  const hasBlockers = proposal.blockers.length > 0;

  const downloadFramework = async () => {
    try {
      const resp = await fetch(`/api/proposal-pipeline/${proposal.id}/framework`);
      if (!resp.ok) throw new Error("Failed to load framework");
      const data = await resp.json();
      const blob = new Blob([data.content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${proposal.id}-framework.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Framework downloaded" });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card className={`border-l-4 ${hasBlockers ? 'border-l-red-500' : readiness === 100 ? 'border-l-green-500' : 'border-l-blue-500'} transition-all`} data-testid={`card-proposal-${proposal.id}`}>
      <CardHeader className="cursor-pointer" onClick={onToggle} data-testid={`button-toggle-${proposal.id}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`rounded-lg p-2 bg-gradient-to-br ${getPriorityColor(proposal.priority)} text-white shrink-0`}>
              {getProposalIcon(proposal.id)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-mono" data-testid={`badge-priority-${proposal.id}`}>P{proposal.priority}</Badge>
                {getStatusBadge(proposal.status)}
                {hasBlockers && <Badge variant="destructive" className="text-xs" data-testid={`badge-blocker-${proposal.id}`}><XCircle className="h-3 w-3 mr-1" /> Blocked</Badge>}
              </div>
              <h3 className="font-semibold text-lg mt-1" data-testid={`text-title-${proposal.id}`}>{proposal.shortTitle}</h3>
              <p className="text-sm text-muted-foreground">{proposal.solicitation} | {proposal.agency}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400" data-testid={`text-funding-${proposal.id}`}>{proposal.fundingRange}</div>
              <div className="text-xs text-muted-foreground" data-testid={`text-deadline-${proposal.id}`}>
                {daysLeft !== null ? (
                  <span className={daysLeft < 90 ? "text-red-500 font-medium" : ""}>
                    {daysLeft} days left
                  </span>
                ) : (
                  proposal.deadlineLabel
                )}
              </div>
            </div>
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Submission Readiness</span>
            <span className="font-medium" data-testid={`text-readiness-${proposal.id}`}>{readiness}%</span>
          </div>
          <Progress value={readiness} className="h-2" />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6 pt-0">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm" data-testid={`text-full-title-${proposal.id}`}>{proposal.title}</p>
            <p className="text-xs text-muted-foreground mt-1">Entity: {proposal.entity}</p>
          </div>

          <Tabs defaultValue="checklist">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="checklist" data-testid={`tab-checklist-${proposal.id}`}>Checklist</TabsTrigger>
              <TabsTrigger value="science" data-testid={`tab-science-${proposal.id}`}>Impl. Science</TabsTrigger>
              <TabsTrigger value="strategy" data-testid={`tab-strategy-${proposal.id}`}>Strategy</TabsTrigger>
              <TabsTrigger value="actions" data-testid={`tab-actions-${proposal.id}`}>Next Steps</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-3 space-y-2">
              {proposal.readinessChecklist.map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-2 rounded ${item.status === 'blocker' ? 'bg-red-50 dark:bg-red-950/30' : item.status === 'action_required' ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`} data-testid={`checklist-item-${proposal.id}-${i}`}>
                  {getChecklistIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.item}</p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="science" className="mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Microscope className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Frameworks</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proposal.implementationScience.frameworks.map(f => (
                      <Badge key={f} variant="secondary" className="text-xs" data-testid={`badge-framework-${f}`}>{f}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Instrument</span>
                  </div>
                  <p className="text-sm" data-testid={`text-instrument-${proposal.id}`}>{proposal.implementationScience.instrument}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Research Design</span>
                  </div>
                  <p className="text-sm" data-testid={`text-design-${proposal.id}`}>{proposal.implementationScience.researchDesign}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Evaluation Level</span>
                  </div>
                  <p className="text-sm" data-testid={`text-eval-level-${proposal.id}`}>{proposal.implementationScience.evaluationLevel}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="strategy" className="mt-3 space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold">Win Strategy</span>
                </div>
                <p className="text-sm" data-testid={`text-win-strategy-${proposal.id}`}>{proposal.winStrategy}</p>
              </div>

              {proposal.partnersRequired && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold">Required Partners</span>
                  </div>
                  {proposal.partners.map((p, i) => (
                    <div key={i} className="text-sm" data-testid={`text-partner-${proposal.id}-${i}`}>
                      <span className="font-medium">{p.name}</span> — {p.role}
                      <Badge variant="outline" className="ml-2 text-xs">{p.status.replace(/_/g, " ")}</Badge>
                      <p className="text-xs text-muted-foreground">{p.note}</p>
                    </div>
                  ))}
                </div>
              )}

              {proposal.blockers.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">Critical Blockers</span>
                  </div>
                  {proposal.blockers.map((b, i) => (
                    <p key={i} className="text-sm text-red-600 dark:text-red-400" data-testid={`text-blocker-${proposal.id}-${i}`}>{b}</p>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="actions" className="mt-3">
              <div className="space-y-2">
                {proposal.nextActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-2" data-testid={`action-item-${proposal.id}-${i}`}>
                    <div className="rounded-full bg-muted w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <p className="text-sm">{action}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={downloadFramework} data-testid={`button-download-${proposal.id}`}>
              <Download className="h-4 w-4 mr-1" /> Download Framework
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("/proposal-command", "_self")} data-testid={`button-generate-${proposal.id}`}>
              <Zap className="h-4 w-4 mr-1" /> Generate Full Proposal
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ProposalPipelinePage() {
  const [expandedId, setExpandedId] = useState<string | null>("nsf-stem-k12");

  const { data, isLoading, error } = useQuery<PipelineData>({
    queryKey: ["/api/proposal-pipeline"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Rocket className="h-8 w-8 mx-auto animate-pulse text-amber-500" />
          <p className="text-muted-foreground">Loading proposal pipeline...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-3" />
            <p className="font-semibold">Failed to load pipeline</p>
            <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { proposals, summary } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Proposal Pipeline</h1>
            <p className="text-sm text-muted-foreground">NSF Proposal Portfolio — Implementation Science Lens — CFIR 2.0 + RE-AIM + RPLICE</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-2xl font-bold" data-testid="text-total-proposals">{summary.totalProposals}</div>
              <div className="text-xs text-muted-foreground">Active Proposals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold" data-testid="text-total-funding">${(summary.totalPotentialFunding / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-muted-foreground">Potential Funding</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <div className="text-2xl font-bold" data-testid="text-frameworks-done">{summary.frameworksComplete}</div>
              <div className="text-xs text-muted-foreground">Frameworks Done</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <div className="text-2xl font-bold" data-testid="text-blockers-count">{summary.criticalBlockers.length}</div>
              <div className="text-xs text-muted-foreground">Critical Blockers</div>
            </CardContent>
          </Card>
        </div>

        {summary.criticalBlockers.length > 0 && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-red-700 dark:text-red-300">Critical Blocker — All Proposals</span>
              </div>
              {summary.criticalBlockers.map((b, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400" data-testid={`text-critical-blocker-${i}`}>{b}</p>
              ))}
            </CardContent>
          </Card>
        )}

        {summary.upcomingDeadlines.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">Upcoming Deadlines</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {summary.upcomingDeadlines.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded" data-testid={`deadline-item-${i}`}>
                    <span className="text-sm font-medium">{d.title}</span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">{d.deadline}</span>
                      <Badge variant={d.daysRemaining < 90 ? "destructive" : "secondary"} className="ml-2 text-xs">
                        {d.daysRemaining}d
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Proposal Portfolio</h2>
          </div>

          {proposals.map(proposal => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              expanded={expandedId === proposal.id}
              onToggle={() => setExpandedId(expandedId === proposal.id ? null : proposal.id)}
            />
          ))}
        </div>

        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Microscope className="h-6 w-6 text-emerald-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Implementation Science Integration</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                  Every proposal in this pipeline is built through the lens of implementation science. CFIR 2.0 structures the organizational readiness evaluation. RE-AIM structures program outcome measurement. RPLICE operationalizes both as a composite evaluation instrument.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">CFIR 2.0 — 5 Domains, 39 Constructs</Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">RE-AIM — Reach, Effectiveness, Adoption, Implementation, Maintenance</Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">RPLICE — Composite Evaluation</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3 pb-8">
          <Button onClick={() => window.open("/proposal-command", "_self")} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" data-testid="button-goto-command">
            <Zap className="mr-2 h-4 w-4" /> Proposal Command Center
          </Button>
          <Button variant="outline" onClick={() => window.open("/grant-packages", "_self")} data-testid="button-goto-grants">
            <Building2 className="mr-2 h-4 w-4" /> Grant Packages
          </Button>
        </div>

        <BackToTop />
      </div>
    </div>
  );
}
