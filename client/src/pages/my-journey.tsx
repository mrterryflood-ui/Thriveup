import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  CheckCircle2, Circle, ChevronRight, Clock, MapPin,
  Sparkles, Calendar, Target, ArrowRight, AlertCircle,
  Trophy, Rocket, Star, Shield, Users, Heart, Briefcase,
} from "lucide-react";

interface Phase {
  id: string;
  templateId: string;
  weekNumber: number;
  name: string;
  description: string;
  sortOrder: number;
}

interface Milestone {
  id: string;
  phaseId: string;
  templateId: string;
  title: string;
  description: string;
  milestoneType: string;
  featureLink: string | null;
  serviceCategory: string | null;
  serviceHoursCredit: number | null;
  sortOrder: number;
  isRequired: boolean;
}

interface MilestoneCompletion {
  id: string;
  journeyId: string;
  milestoneId: string;
  participantId: string;
  completedAt: string;
  notes: string | null;
}

interface Journey {
  id: string;
  participantId: string;
  templateId: string;
  participantName: string;
  population: string;
  status: string;
  currentPhaseWeek: number;
  startDate: string;
  expectedEndDate: string;
  completedAt: string | null;
}

interface Template {
  id: string;
  name: string;
  population: string;
  description: string;
}

interface JourneyData {
  journey: Journey;
  template: Template;
  phases: Phase[];
  milestones: Milestone[];
  completions: MilestoneCompletion[];
  snapshots: any[];
}

interface TemplateData {
  id: string;
  name: string;
  population: string;
  description: string;
  phases: Phase[];
  milestones: Milestone[];
}

const POPULATION_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; gradient: string }> = {
  returning_citizen: { label: "Returning Citizen", icon: Shield, color: "text-blue-600", gradient: "from-blue-500 to-indigo-600" },
  youth: { label: "Youth", icon: Star, color: "text-violet-600", gradient: "from-violet-500 to-purple-600" },
  veteran: { label: "Veteran", icon: Users, color: "text-emerald-600", gradient: "from-emerald-500 to-green-600" },
};

const WEEK_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4"];

function PhaseCard({
  phase,
  milestones,
  completions,
  isCurrentPhase,
  isFuturePhase,
  journeyId,
  onComplete,
}: {
  phase: Phase;
  milestones: Milestone[];
  completions: MilestoneCompletion[];
  isCurrentPhase: boolean;
  isFuturePhase: boolean;
  journeyId: string;
  onComplete: (milestoneId: string) => void;
}) {
  const completedCount = milestones.filter(m => completions.some(c => c.milestoneId === m.id)).length;
  const totalRequired = milestones.filter(m => m.isRequired).length;
  const completedRequired = milestones.filter(m => m.isRequired && completions.some(c => c.milestoneId === m.id)).length;
  const phaseProgress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;
  const phaseComplete = completedRequired === totalRequired;

  return (
    <Card
      className={`p-4 sm:p-6 transition-all ${isCurrentPhase ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : isFuturePhase ? "opacity-60" : ""}`}
      data-testid={`card-phase-${phase.weekNumber}`}
    >
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className={`rounded-md p-2 ${phaseComplete ? "bg-emerald-100 dark:bg-emerald-900/30" : isCurrentPhase ? "bg-primary/10" : "bg-muted"}`}>
          {phaseComplete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : isCurrentPhase ? (
            <Rocket className="h-5 w-5 text-primary" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold" data-testid={`text-phase-name-${phase.weekNumber}`}>{WEEK_LABELS[phase.weekNumber - 1]}: {phase.name}</h3>
            {phaseComplete && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Complete</Badge>}
            {isCurrentPhase && !phaseComplete && <Badge variant="secondary" className="bg-primary/10 text-primary">Current</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{phase.description}</p>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{completedCount}/{milestones.length}</span>
      </div>
      <Progress value={phaseProgress} className="h-1.5 mb-4" />
      <div className="space-y-2">
        {milestones.map(milestone => {
          const isCompleted = completions.some(c => c.milestoneId === milestone.id);
          const completion = completions.find(c => c.milestoneId === milestone.id);
          return (
            <div
              key={milestone.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isCompleted ? "bg-emerald-50 dark:bg-emerald-900/10" : isCurrentPhase ? "bg-background hover:bg-muted/50" : "bg-muted/30"}`}
              data-testid={`milestone-${milestone.id}`}
            >
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{milestone.title}</span>
                  {milestone.isRequired && !isCompleted && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">Required</Badge>
                  )}
                  {!milestone.isRequired && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-muted-foreground/20">Optional</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                {isCompleted && completion && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Completed {new Date(completion.completedAt).toLocaleDateString()}
                  </p>
                )}
                {milestone.serviceHoursCredit && milestone.serviceHoursCredit > 0 && (
                  <span className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {milestone.serviceHoursCredit}h service credit
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {milestone.featureLink && !isCompleted && isCurrentPhase && (
                  <Link href={milestone.featureLink}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" data-testid={`link-milestone-go-${milestone.id}`}>
                      Go <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
                {!isCompleted && (isCurrentPhase || !isFuturePhase) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => onComplete(milestone.id)}
                    data-testid={`button-complete-${milestone.id}`}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Done
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function JourneySetup({ templates, onStart }: { templates: TemplateData[]; onStart: (templateId: string, population: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2" data-testid="text-setup-title">Start Your 30-Day Journey</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose the onboarding track that best fits you. Each journey is personalized with milestones, activities, and support to set you up for success.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map(template => {
          const config = POPULATION_CONFIG[template.population] || POPULATION_CONFIG.returning_citizen;
          const Icon = config.icon;
          const totalMilestones = template.milestones?.length || 0;
          return (
            <Card key={template.id} className="p-5 hover:shadow-md transition-shadow" data-testid={`card-template-${template.population}`}>
              <div className={`rounded-md p-2.5 bg-gradient-to-br ${config.gradient} w-fit mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> 30 days</span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {totalMilestones} milestones</span>
              </div>
              <Button
                className={`w-full bg-gradient-to-r ${config.gradient} text-white border-none`}
                onClick={() => onStart(template.id, template.population)}
                data-testid={`button-start-${template.population}`}
              >
                Start This Journey
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function MyJourneyPage() {
  const { toast } = useToast();

  const { data: templates, isLoading: templatesLoading } = useQuery<TemplateData[]>({
    queryKey: ["/api/onboarding/templates"],
  });

  const { data: journeys, isLoading: journeysLoading } = useQuery<Journey[]>({
    queryKey: ["/api/onboarding/journeys"],
  });

  const activeJourney = journeys?.find(j => j.status === "active" || j.status === "completed");

  const { data: journeyDetail, isLoading: detailLoading } = useQuery<JourneyData>({
    queryKey: ["/api/onboarding/journeys", activeJourney?.id],
    enabled: !!activeJourney?.id,
  });

  const startJourneyMutation = useMutation({
    mutationFn: async ({ templateId, population }: { templateId: string; population: string }) => {
      const res = await apiRequest("POST", "/api/onboarding/journeys", {
        participantId: `participant-${Date.now()}`,
        templateId,
        participantName: "New Participant",
        population,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/journeys"] });
      toast({ title: "Journey Started!", description: "Your 30-day onboarding journey has begun." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: async ({ journeyId, milestoneId }: { journeyId: string; milestoneId: string }) => {
      const res = await apiRequest("POST", `/api/onboarding/journeys/${journeyId}/milestones/${milestoneId}/complete`, {
        completedByName: "Participant",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/journeys"] });
      toast({ title: "Milestone Complete!", description: "Great work! Keep going." });
    },
    onError: (err: Error) => {
      if (err.message.includes("already completed")) {
        toast({ title: "Already Done", description: "This milestone was already completed." });
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    },
  });

  const snapshotMutation = useMutation({
    mutationFn: async (journeyId: string) => {
      const res = await apiRequest("POST", `/api/onboarding/journeys/${journeyId}/baseline-snapshot`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/journeys"] });
      toast({ title: "Baseline Captured", description: "Your 30-day baseline snapshot has been saved for longitudinal tracking." });
    },
  });

  const isLoading = templatesLoading || journeysLoading || (!!activeJourney && detailLoading);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const templatesList: TemplateData[] = [];
  if (templates) {
    for (const t of templates) {
      templatesList.push(t as TemplateData);
    }
  }

  if (!activeJourney || !journeyDetail) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <PageHeader
          title="My Journey"
          description="Your guided 30-day onboarding experience"
          icon={<Rocket className="h-7 w-7" />}
        />
        <JourneySetup
          templates={templatesList}
          onStart={(templateId, population) => startJourneyMutation.mutate({ templateId, population })}
        />
      </div>
    );
  }

  const { journey, template, phases, milestones, completions } = journeyDetail;
  const config = POPULATION_CONFIG[journey.population] || POPULATION_CONFIG.returning_citizen;
  const Icon = config.icon;

  const totalRequired = milestones.filter(m => m.isRequired).length;
  const completedRequired = milestones.filter(m => m.isRequired).filter(m => completions.some(c => c.milestoneId === m.id)).length;
  const overallProgress = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  const totalServiceHours = milestones
    .filter(m => completions.some(c => c.milestoneId === m.id))
    .reduce((sum, m) => sum + (m.serviceHoursCredit || 0), 0);

  const startDate = new Date(journey.startDate);
  const today = new Date();
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 30 - daysElapsed);

  const currentPhaseObj = phases.find(p => p.weekNumber === journey.currentPhaseWeek) || phases[0];
  const currentPhaseMilestones = milestones.filter(m => m.phaseId === currentPhaseObj?.id);
  const upcomingMilestones = currentPhaseMilestones.filter(m => !completions.some(c => c.milestoneId === m.id));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Journey"
        description={`${template?.name || "30-Day Onboarding"} — ${config.label} Track`}
        icon={<Rocket className="h-7 w-7" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="p-3 sm:p-4" data-testid="card-stat-progress">
          <span className="text-xs text-muted-foreground">Progress</span>
          <p className="text-xl font-bold" data-testid="text-progress-percent">{overallProgress}%</p>
          <Progress value={overallProgress} className="h-1.5 mt-1" />
        </Card>
        <Card className="p-3 sm:p-4" data-testid="card-stat-milestones">
          <span className="text-xs text-muted-foreground">Milestones</span>
          <p className="text-xl font-bold">{completions.length}/{milestones.length}</p>
        </Card>
        <Card className="p-3 sm:p-4" data-testid="card-stat-service-hours">
          <span className="text-xs text-muted-foreground">Service Hours</span>
          <p className="text-xl font-bold">{totalServiceHours.toFixed(1)}h</p>
        </Card>
        <Card className="p-3 sm:p-4" data-testid="card-stat-days">
          <span className="text-xs text-muted-foreground">{journey.status === "completed" ? "Completed" : "Days Left"}</span>
          <p className="text-xl font-bold">{journey.status === "completed" ? <CheckCircle2 className="h-6 w-6 text-emerald-500 inline" /> : daysRemaining}</p>
        </Card>
      </div>

      {journey.status === "completed" && (
        <Card className="p-4 sm:p-6 mb-6 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20" data-testid="card-journey-completed">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="h-8 w-8 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Journey Complete!</h2>
              <p className="text-sm text-muted-foreground">
                Congratulations on completing your 30-day onboarding! You've built a strong foundation.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => snapshotMutation.mutate(journey.id)}
            disabled={snapshotMutation.isPending}
            data-testid="button-capture-baseline"
          >
            <Target className="h-4 w-4 mr-2" /> Capture Baseline Snapshot
          </Button>
        </Card>
      )}

      {journey.status === "active" && upcomingMilestones.length > 0 && (
        <Card className="p-4 sm:p-6 mb-6 border-primary/20 bg-primary/5" data-testid="card-upcoming-nudge">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Next Up: {upcomingMilestones[0].title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{upcomingMilestones[0].description}</p>
              <div className="flex items-center gap-2 mt-2">
                {upcomingMilestones[0].featureLink && (
                  <Link href={upcomingMilestones[0].featureLink}>
                    <Button size="sm" variant="default" className="h-7 text-xs" data-testid="button-nudge-go">
                      Start Now <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => completeMilestoneMutation.mutate({ journeyId: journey.id, milestoneId: upcomingMilestones[0].id })}
                  data-testid="button-nudge-complete"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Done
                </Button>
              </div>
            </div>
          </div>
          {daysRemaining <= 7 && daysRemaining > 0 && (
            <div className="flex items-center gap-2 mt-3 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{daysRemaining} days remaining — keep up the great momentum!</span>
            </div>
          )}
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Your Journey Phases
        </h2>
        {phases.map(phase => {
          const phaseMilestones = milestones.filter(m => m.phaseId === phase.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const isCurrentPhase = phase.weekNumber === journey.currentPhaseWeek;
          const isFuturePhase = phase.weekNumber > journey.currentPhaseWeek;
          return (
            <PhaseCard
              key={phase.id}
              phase={phase}
              milestones={phaseMilestones}
              completions={completions}
              isCurrentPhase={isCurrentPhase}
              isFuturePhase={isFuturePhase}
              journeyId={journey.id}
              onComplete={(milestoneId) => completeMilestoneMutation.mutate({ journeyId: journey.id, milestoneId })}
            />
          );
        })}
      </div>
    </div>
  );
}
