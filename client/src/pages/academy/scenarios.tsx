import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RiskDecisionDialog } from "@/components/risk-decision-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";
import {
  BookOpen,
  Gamepad2,
  ChevronRight,
  Star,
  Trophy,
  AlertTriangle,
  Heart,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

interface ScenarioChoice {
  key: string;
  label: string;
  nextNodeKey: string;
  consequence: string;
}

interface ScenarioNode {
  id: string;
  scenarioId: string;
  nodeKey: string;
  narrative: string;
  isStart: boolean;
  isEnd: boolean;
  choices: ScenarioChoice[];
  consequenceSummary: string | null;
  walletImpact: number | null;
  powerImpact: number | null;
  meritImpact: number | null;
  emotionalTone: string | null;
  pathForward: string | null;
  sortOrder: number;
}

interface Scenario {
  id: string;
  title: string;
  theme: string;
  summary: string;
  difficulty: string;
  empathyPrompt: string;
  featureArea: string;
  totalNodes: number;
  rewardCategory: string;
  isActive: boolean;
  nodes?: ScenarioNode[];
}

interface ScenarioRun {
  id: string;
  scenarioId: string;
  userId: string;
  status: string;
  choicesMade: number;
  currentNodeKey: string | null;
  completedAt: string | null;
  createdAt: string;
  scenarioTitle?: string;
}

interface ChooseResponse {
  run: ScenarioRun;
  nextNode: ScenarioNode | null;
  isEnd: boolean;
}

function getToneStyles(tone: string | null) {
  switch (tone) {
    case "triumph":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-300",
        icon: <Trophy className="h-5 w-5 text-emerald-500" />,
        badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
        label: "Triumph",
      };
    case "setback":
      return {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-300",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
        label: "Setback",
      };
    case "learning":
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        icon: <BookOpen className="h-5 w-5 text-blue-500" />,
        badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
        label: "Learning",
      };
    default:
      return {
        bg: "bg-muted/30",
        border: "border-border",
        text: "text-muted-foreground",
        icon: <Sparkles className="h-5 w-5 text-muted-foreground" />,
        badge: "",
        label: "Neutral",
      };
  }
}

function getDifficultyBadge(difficulty: string) {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 no-default-hover-elevate no-default-active-elevate">{difficulty}</Badge>;
    case "medium":
      return <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 no-default-hover-elevate no-default-active-elevate">{difficulty}</Badge>;
    case "hard":
      return <Badge variant="secondary" className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 no-default-hover-elevate no-default-active-elevate">{difficulty}</Badge>;
    default:
      return <Badge variant="secondary">{difficulty}</Badge>;
  }
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default function AcademyScenariosPage() {
  useEffect(() => { document.title = 'Adventure Scenarios | ThriveUp Academy'; }, []);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ScenarioRun | null>(null);
  const [currentNode, setCurrentNode] = useState<ScenarioNode | null>(null);
  const [lastConsequence, setLastConsequence] = useState<string | null>(null);
  const [lastWalletImpact, setLastWalletImpact] = useState<number | null>(null);
  const [lastPowerImpact, setLastPowerImpact] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<{runId: string; choiceKey: string; choiceLabel: string; nodeKey: string} | null>(null);

  const { data: scenarios, isLoading: scenariosLoading, error: scenariosError, refetch: refetchScenarios } = useQuery<Scenario[]>({
    queryKey: ["/api/academy/scenarios"],
  });

  const { data: selectedScenario, isLoading: scenarioLoading } = useQuery<Scenario>({
    queryKey: ["/api/academy/scenarios", selectedScenarioId],
    enabled: !!selectedScenarioId,
  });

  const { data: myRuns } = useQuery<ScenarioRun[]>({
    queryKey: ["/api/academy/scenarios/runs/mine"],
  });

  const startMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const res = await apiRequest("POST", `/api/academy/scenarios/${scenarioId}/start`);
      return res.json();
    },
    onSuccess: (data: { run: ScenarioRun; startNode: ScenarioNode }) => {
      setActiveRun(data.run);
      setCurrentNode(data.startNode);
      setLastConsequence(null);
      setLastWalletImpact(null);
      setLastPowerImpact(null);
      setIsComplete(false);
      queryClient.invalidateQueries({ queryKey: ["/api/academy/scenarios/runs/mine"] });
    },
  });

  const chooseMutation = useMutation({
    mutationFn: async (payload: { runId: string; choiceKey: string; choiceLabel: string; nodeKey: string }) => {
      const res = await apiRequest("POST", `/api/academy/scenarios/runs/${payload.runId}/choose`, {
        choiceKey: payload.choiceKey,
        choiceLabel: payload.choiceLabel,
        nodeKey: payload.nodeKey,
      });
      return res.json();
    },
    onSuccess: (data: ChooseResponse) => {
      setActiveRun(data.run);
      if (data.isEnd) {
        setIsComplete(true);
        setCurrentNode(data.nextNode);
      } else {
        setCurrentNode(data.nextNode);
      }
      if (data.nextNode) {
        setLastConsequence(data.nextNode.consequenceSummary);
        setLastWalletImpact(data.nextNode.walletImpact);
        setLastPowerImpact(data.nextNode.powerImpact);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/academy/scenarios/runs/mine"] });
    },
  });

  const handleBack = () => {
    setSelectedScenarioId(null);
    setActiveRun(null);
    setCurrentNode(null);
    setLastConsequence(null);
    setLastWalletImpact(null);
    setLastPowerImpact(null);
    setIsComplete(false);
  };

  const handleRestart = () => {
    if (selectedScenarioId) {
      startMutation.mutate(selectedScenarioId);
    }
  };

  if (scenariosLoading) {
    return <LoadingSkeleton />;
  }

  if (scenariosError) {
    return <div className="p-6"><ErrorRetry message="Failed to load adventure scenarios. Please try again." onRetry={refetchScenarios} /></div>;
  }

  const toneStyles = currentNode ? getToneStyles(currentNode.emotionalTone) : getToneStyles(null);

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="page-academy-scenarios">
      <PageHeader
        title="Choose Your Adventure"
        description="Walk in someone else's shoes. Every choice matters, and every path teaches empathy."
        breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "Scenarios" }]}
      />

      {!selectedScenarioId && (
        <>
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Available Adventures
            </h2>
            {(scenarios ?? []).length === 0 ? (
              <Card className="p-6 text-center" data-testid="card-no-scenarios">
                <Gamepad2 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No adventures available yet. Check back soon!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-scenarios">
                {(scenarios ?? []).filter(s => s.isActive).map((scenario) => (
                  <Card
                    key={scenario.id}
                    className="hover-elevate cursor-pointer"
                    data-testid={`card-scenario-${scenario.id}`}
                    onClick={() => setSelectedScenarioId(scenario.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="rounded-md p-2 bg-primary/10 shrink-0">
                            <Heart className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">{scenario.title}</CardTitle>
                        </div>
                        {getDifficultyBadge(scenario.difficulty)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3" data-testid={`text-summary-${scenario.id}`}>
                        {scenario.summary}
                      </p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {scenario.theme}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> {scenario.totalNodes} nodes
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" data-testid={`button-select-scenario-${scenario.id}`}>
                          Start <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {(myRuns ?? []).length > 0 && (
            <div className="mb-8" data-testid="section-my-runs">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> My Adventures
              </h2>
              <div className="space-y-3">
                {(myRuns ?? []).map((run) => (
                  <Card key={run.id} className="p-4" data-testid={`card-run-${run.id}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          {run.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" data-testid={`text-run-title-${run.id}`}>
                            {run.scenarioTitle ?? "Adventure"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {run.choicesMade} choices made &middot; {new Date(run.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={run.status === "completed" ? "secondary" : "outline"}>
                        {run.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedScenarioId && !activeRun && (
        <div data-testid="section-scenario-detail">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4" data-testid="button-back-to-list">
            <ArrowRight className="h-3.5 w-3.5 mr-1 rotate-180" /> Back to Adventures
          </Button>

          {scenarioLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-48" />
            </div>
          ) : selectedScenario ? (
            <Card className="p-6" data-testid="card-scenario-detail">
              <div className="flex items-start gap-4 mb-6 flex-wrap">
                <div className="w-14 h-14 rounded-md bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shrink-0">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="text-xl font-bold" data-testid="text-scenario-detail-title">
                      {selectedScenario.title}
                    </h2>
                    {getDifficultyBadge(selectedScenario.difficulty)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{selectedScenario.summary}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{selectedScenario.theme}</Badge>
                    <span className="text-xs text-muted-foreground">{selectedScenario.totalNodes} story nodes</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 mb-6" data-testid="section-empathy-prompt">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">Before you begin...</p>
                    <p className="text-sm text-rose-600 dark:text-rose-400">{selectedScenario.empathyPrompt}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => startMutation.mutate(selectedScenario.id)}
                disabled={startMutation.isPending}
                data-testid="button-begin-adventure"
              >
                {startMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Begin Adventure
              </Button>
            </Card>
          ) : null}
        </div>
      )}

      {activeRun && currentNode && !isComplete && (
        <div data-testid="section-playing">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <Button variant="ghost" size="sm" onClick={handleBack} data-testid="button-back-playing">
              <ArrowRight className="h-3.5 w-3.5 mr-1 rotate-180" /> Leave Adventure
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{activeRun.choicesMade} choices made</span>
            </div>
          </div>

          {lastConsequence && (
            <Card className={`p-5 mb-4 border ${toneStyles.border} ${toneStyles.bg}`} data-testid="card-consequence">
              <div className="flex items-start gap-3">
                {toneStyles.icon}
                <div>
                  <p className="text-sm font-medium mb-1" data-testid="text-consequence">
                    {lastConsequence}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap mt-2">
                    {lastWalletImpact != null && lastWalletImpact !== 0 && (
                      <Badge variant="secondary" className={lastWalletImpact > 0 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 no-default-hover-elevate no-default-active-elevate" : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 no-default-hover-elevate no-default-active-elevate"} data-testid="badge-wallet-impact">
                      {lastWalletImpact > 0 ? "+" : ""}${lastWalletImpact}
                    </Badge>
                    )}
                    {lastPowerImpact != null && lastPowerImpact !== 0 && (
                      <Badge variant="secondary" className={lastPowerImpact > 0 ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 no-default-hover-elevate no-default-active-elevate" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 no-default-hover-elevate no-default-active-elevate"} data-testid="badge-power-impact">
                        <Zap className="h-3 w-3 mr-1" />
                        {lastPowerImpact > 0 ? "+" : ""}{lastPowerImpact} Power
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {currentNode.emotionalTone === "setback" && currentNode.pathForward && (
            <Card className="p-5 mb-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20" data-testid="card-path-forward">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Keep going! Here's a path forward:</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400" data-testid="text-path-forward">{currentNode.pathForward}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 mb-4" data-testid="card-narrative">
            <div className="flex items-center gap-2 mb-4">
              {toneStyles.icon}
              {currentNode.emotionalTone && (
                <Badge variant="secondary" className={`${toneStyles.badge} no-default-hover-elevate no-default-active-elevate`}>
                  {toneStyles.label}
                </Badge>
              )}
            </div>
            <p className="text-base leading-relaxed mb-6" data-testid="text-narrative">
              {currentNode.narrative}
            </p>

            {currentNode.choices && currentNode.choices.length > 0 && (
              <div className="space-y-3" data-testid="section-choices">
                <p className="text-sm font-medium text-muted-foreground">What do you do?</p>
                {currentNode.choices.map((choice) => (
                  <Button
                    key={choice.key}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => {
                      const isRisky = choice.consequence && /lose|risk|debt|penalty|cost|danger|gambl/i.test(choice.consequence);
                      if (isRisky) {
                        setPendingChoice({ runId: activeRun.id, choiceKey: choice.key, choiceLabel: choice.label, nodeKey: currentNode.nodeKey });
                        setRiskDialogOpen(true);
                      } else {
                        chooseMutation.mutate({ runId: activeRun.id, choiceKey: choice.key, choiceLabel: choice.label, nodeKey: currentNode.nodeKey });
                      }
                    }}
                    disabled={chooseMutation.isPending}
                    data-testid={`button-choice-${choice.key}`}
                  >
                    <ChevronRight className="h-4 w-4 mr-2 shrink-0" />
                    <span>{choice.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </Card>

          {chooseMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground" data-testid="loading-choice">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Making your choice...</span>
            </div>
          )}
        </div>
      )}

      <RiskDecisionDialog
        open={riskDialogOpen}
        onOpenChange={setRiskDialogOpen}
        riskLevel="moderate"
        featureArea="scenarios"
        actionType="risky_choice"
        warningMessage={pendingChoice ? `The choice "${pendingChoice.choiceLabel}" could have some tough consequences. In real life, risky decisions can affect your money, your relationships, and your future. This is a safe space to learn from those choices.` : "This choice involves some risk."}
        financialLiteracyModule="investing-vs-gambling"
        metadata={{ choiceKey: pendingChoice?.choiceKey, choiceLabel: pendingChoice?.choiceLabel }}
        onProceed={() => { if (pendingChoice) chooseMutation.mutate(pendingChoice); setRiskDialogOpen(false); setPendingChoice(null); }}
        onCancel={() => { setRiskDialogOpen(false); setPendingChoice(null); }}
      />

      {isComplete && currentNode && (
        <div data-testid="section-completed">
          <Card className="p-6 mb-6" data-testid="card-outcome">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2" data-testid="text-outcome-title">Adventure Complete!</h2>
              <p className="text-sm text-muted-foreground">You made {activeRun?.choicesMade ?? 0} choices on this journey.</p>
            </div>

            {currentNode.consequenceSummary && (
              <div className={`rounded-md p-5 mb-4 ${toneStyles.bg} border ${toneStyles.border}`} data-testid="section-final-consequence">
                <div className="flex items-start gap-3">
                  {toneStyles.icon}
                  <p className="text-sm" data-testid="text-final-consequence">{currentNode.consequenceSummary}</p>
                </div>
              </div>
            )}

            {currentNode.narrative && (
              <div className="rounded-md p-5 mb-4 bg-muted/30" data-testid="section-final-narrative">
                <p className="text-sm leading-relaxed">{currentNode.narrative}</p>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap mb-4">
              {currentNode.walletImpact != null && currentNode.walletImpact !== 0 && (
                <Badge variant="secondary" className={currentNode.walletImpact > 0 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 no-default-hover-elevate no-default-active-elevate" : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 no-default-hover-elevate no-default-active-elevate"} data-testid="badge-final-wallet">
                  {currentNode.walletImpact > 0 ? "+" : ""}${currentNode.walletImpact}
                </Badge>
              )}
              {currentNode.powerImpact != null && currentNode.powerImpact !== 0 && (
                <Badge variant="secondary" className={currentNode.powerImpact > 0 ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 no-default-hover-elevate no-default-active-elevate" : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 no-default-hover-elevate no-default-active-elevate"} data-testid="badge-final-power">
                  <Zap className="h-3 w-3 mr-1" />
                  {currentNode.powerImpact > 0 ? "+" : ""}{currentNode.powerImpact} Power
                </Badge>
              )}
              {currentNode.meritImpact != null && currentNode.meritImpact !== 0 && (
                <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 no-default-hover-elevate no-default-active-elevate" data-testid="badge-final-merit">
                  <Star className="h-3 w-3 mr-1" />
                  +{currentNode.meritImpact} Merit
                </Badge>
              )}
            </div>

            {currentNode.pathForward && (
              <div className="rounded-md p-5 mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800" data-testid="section-path-forward-final">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Your Path Forward</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400" data-testid="text-path-forward-final">{currentNode.pathForward}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={handleRestart} disabled={startMutation.isPending} data-testid="button-restart-adventure">
                <RefreshCw className={`h-4 w-4 mr-2 ${startMutation.isPending ? "animate-spin" : ""}`} />
                Play Again
              </Button>
              <Button variant="outline" onClick={handleBack} data-testid="button-back-to-adventures">
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                All Adventures
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
