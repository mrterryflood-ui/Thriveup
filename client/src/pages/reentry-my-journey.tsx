import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Circle, Scale, ArrowRight, AlertTriangle } from "lucide-react";
import type { ReentryJourney } from "@/pages/reentry-router";

const PHASES = [
  { key: "pre_release", label: "Pre-Release", color: "bg-blue-600" },
  { key: "transition", label: "Transition (0-90 days)", color: "bg-amber-600" },
  { key: "stabilization", label: "Stabilization (90-180 days)", color: "bg-emerald-600" },
  { key: "independence", label: "Independence (180-365 days)", color: "bg-violet-600" },
];

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
  blocked: AlertTriangle,
};

function PhaseBadge({ phase }: { phase: string }) {
  const p = PHASES.find((ph) => ph.key === phase) || PHASES[0];
  return <Badge className={`${p.color} text-white`}>{p.label}</Badge>;
}

export default function ReentryMyJourney() {
  const { data, isLoading, error } = useQuery<ReentryJourney>({
    queryKey: ["/api/reentry/my-journey"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-3xl py-16 px-4">
        <Card className="border-2 border-amber-300">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
            <h1 className="text-xl font-bold">Couldn't load your journey</h1>
            <p className="text-sm text-muted-foreground">Please refresh and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated participant with no plan yet — welcoming, not an error.
  if (!data?.hasPlan || data.plans.length === 0) {
    return (
      <div className="container max-w-3xl py-12 px-4 space-y-6" data-testid="reentry-no-plan">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-violet-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold">My Reentry Journey</h1>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-muted-foreground">
              You don't have an active reentry plan yet. A case manager creates your
              individualized plan during intake. Once it's set up, your phases, milestones,
              and progress will appear here.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link href="/reentry-program">Learn about the program</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/get-help">Get help / connect</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-8" data-testid="reentry-my-journey">
      <div className="flex items-center gap-2">
        <Scale className="h-6 w-6 text-violet-600" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold">My Reentry Journey</h1>
          <p className="text-sm text-muted-foreground">Your plan, phases, and milestone progress.</p>
        </div>
      </div>

      {data.plans.map((plan) => {
        const total = plan.milestones.length;
        const completed = plan.milestones.filter((m) => m.status === "completed").length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return (
          <Card key={plan.id} data-testid={`journey-plan-${plan.id}`}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">
                  {plan.userName ? `${plan.userName}'s Plan` : "Reentry Plan"}
                </CardTitle>
                <PhaseBadge phase={plan.phase} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Milestone progress</span>
                  <span className="text-sm font-bold text-primary">{completed}/{total} ({pct}%)</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>

              <div className="space-y-2">
                {plan.milestones.length === 0 && (
                  <p className="text-sm text-muted-foreground">No milestones assigned yet.</p>
                )}
                {plan.milestones.map((m) => {
                  const Icon = STATUS_ICON[m.status] || Circle;
                  const done = m.status === "completed";
                  return (
                    <div key={m.id} className="flex items-start gap-3 p-2 rounded-md border">
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${done ? "text-emerald-500" : m.status === "blocked" ? "text-red-500" : "text-muted-foreground"}`} aria-hidden="true" />
                      <div className="flex-1">
                        <p className={`text-sm ${done ? "text-muted-foreground line-through" : "font-medium"}`}>{m.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.category.replace(/_/g, " ")}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize">{m.status.replace(/_/g, " ")}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/40">
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Need support with your next step?</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/get-help">Get help <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
