import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ChevronRight, X, HelpCircle, PartyPopper } from "lucide-react";
import type { WizardStep } from "@/lib/wizard-data";

interface AcademyWizardProps {
  wizardType: string;
  steps: WizardStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
}

interface WizardProgressData {
  id: string;
  userId: string;
  wizardType: string;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string | null;
}

export default function AcademyWizard({ wizardType, steps, onComplete, onDismiss }: AcademyWizardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const { data: progress, isLoading } = useQuery<WizardProgressData | null>({
    queryKey: ["/api/academy/wizard", wizardType],
  });

  useEffect(() => {
    if (progress && !progress.completed && progress.currentStep > 0) {
      setCurrentStepIndex(Math.min(progress.currentStep, steps.length - 1));
    }
  }, [progress, steps.length]);

  const advanceMutation = useMutation({
    mutationFn: async (data: { currentStep: number; totalSteps: number }) => {
      const res = await apiRequest("POST", `/api/academy/wizard/${wizardType}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/wizard", wizardType] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/academy/wizard/${wizardType}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/wizard", wizardType] });
      setShowCelebration(true);
      setTimeout(() => {
        onComplete?.();
      }, 3000);
    },
  });

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setTransitioning(true);
      const nextStep = currentStepIndex + 1;
      setTimeout(() => {
        setCurrentStepIndex(nextStep);
        setTransitioning(false);
      }, 200);
      advanceMutation.mutate({ currentStep: nextStep, totalSteps: steps.length });
    } else {
      completeMutation.mutate();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleReopen = () => {
    setDismissed(false);
  };

  if (isLoading) return null;
  if (progress?.completed && !showCelebration) return null;

  if (dismissed) {
    return (
      <div className="fixed bottom-6 right-6 z-50" data-testid="wizard-help-button-container">
        <Button
          onClick={handleReopen}
          className="rounded-full shadow-lg bg-rose-700 text-white"
          data-testid="button-wizard-reopen"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Need help?
        </Button>
      </div>
    );
  }

  if (showCelebration) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96" data-testid="wizard-celebration">
        <Card className="p-6 border-rose-300 dark:border-rose-800 shadow-lg">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 mb-4"
              style={{
                animation: "wizard-celebrate 0.6s ease-out forwards",
              }}
            >
              <PartyPopper className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2" data-testid="text-wizard-complete-title">
              Guide Complete!
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-wizard-complete-message">
              You're all set to explore this feature. Go make it happen, Panther!
            </p>
            <div
              className="mt-3 flex justify-center gap-1"
              style={{ animation: "wizard-sparkle-in 0.8s ease-out 0.3s both" }}
            >
              {[...Array(5)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="h-4 w-4 text-amber-400"
                  style={{
                    animation: `wizard-float ${1 + i * 0.2}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </Card>
        <style>{`
          @keyframes wizard-celebrate {
            0% { transform: scale(0.3); opacity: 0; }
            60% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes wizard-sparkle-in {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes wizard-float {
            0% { transform: translateY(0); }
            100% { transform: translateY(-4px); }
          }
        `}</style>
      </div>
    );
  }

  const step = steps[currentStepIndex];
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96" data-testid="wizard-panel">
      <Card className="shadow-lg border-rose-200 dark:border-rose-900/50" data-testid="wizard-card">
        <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 rounded-t-md border-b border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/40">
                <Sparkles className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="font-semibold text-sm" data-testid="text-wizard-title">Spark Guide</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" data-testid="badge-wizard-step">
                {currentStepIndex + 1} / {steps.length}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDismiss}
                data-testid="button-wizard-dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress
            value={progressPercent}
            className="mt-3 h-1.5"
            data-testid="progress-wizard"
          />
        </div>

        <div
          className="p-5"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateX(12px)" : "translateX(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          <h4 className="font-bold text-base mb-2" data-testid="text-wizard-step-title">
            {step.title}
          </h4>
          <p className="text-sm leading-relaxed mb-4" data-testid="text-wizard-instruction">
            {step.instruction}
          </p>
          <div className="rounded-md bg-rose-50 dark:bg-rose-950/20 p-3 mb-4 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground italic leading-relaxed" data-testid="text-wizard-spark-tip">
                {step.sparkTip}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            data-testid="button-wizard-skip"
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={handleNext}
            disabled={advanceMutation.isPending || completeMutation.isPending}
            data-testid="button-wizard-next"
          >
            {completeMutation.isPending
              ? "Finishing..."
              : isLastStep
                ? "Finish"
                : "Next"}
            {!isLastStep && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
