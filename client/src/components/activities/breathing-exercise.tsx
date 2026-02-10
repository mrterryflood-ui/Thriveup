import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";

interface BreathingData {
  type: "breathing";
  pattern: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  cycles: number;
  name: string;
  instructions?: string;
  kidFriendlyTip?: string;
}

type Phase = "inhale" | "hold" | "exhale" | "rest";

export default function BreathingExercise({ data }: { data: BreathingData }) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("rest");
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    setIsRunning(true);
    setCompleted(false);
    setCurrentCycle(0);
    startPhase("inhale", 0);
  }

  function startPhase(p: Phase, cycle: number) {
    if (cycle >= data.cycles) {
      setPhase("rest");
      setIsRunning(false);
      setCompleted(true);
      return;
    }

    setPhase(p);
    setCurrentCycle(cycle);
    const duration = p === "inhale" ? data.inhaleSeconds : p === "hold" ? data.holdSeconds : data.exhaleSeconds;
    setCountdown(duration);

    if (intervalRef.current) clearInterval(intervalRef.current);
    let remaining = duration;

    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (p === "inhale") {
          startPhase("hold", cycle);
        } else if (p === "hold") {
          startPhase("exhale", cycle);
        } else {
          startPhase("inhale", cycle + 1);
        }
      }
    }, 1000);
  }

  function pause() {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function reset() {
    pause();
    setPhase("rest");
    setCurrentCycle(0);
    setCountdown(0);
    setCompleted(false);
  }

  const phaseLabels: Record<Phase, string> = {
    inhale: "Breathe In",
    hold: "Hold",
    exhale: "Breathe Out",
    rest: "Ready",
  };

  const phaseColors: Record<Phase, string> = {
    inhale: "text-sky-500",
    hold: "text-amber-500",
    exhale: "text-emerald-500",
    rest: "text-muted-foreground",
  };

  const circleScale = phase === "inhale" ? "scale-110" : phase === "exhale" ? "scale-90" : "scale-100";

  return (
    <Card className="p-6 my-6" data-testid="activity-breathing">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{data.name}</h3>
        <Badge variant="secondary" className="text-xs">{data.pattern} pattern</Badge>
      </div>

      {data.instructions && (
        <p className="text-sm text-muted-foreground mb-4">{data.instructions}</p>
      )}

      {data.kidFriendlyTip && (
        <div className="p-3 rounded-md bg-primary/5 mb-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Tip:</span> {data.kidFriendlyTip}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center py-8">
        <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ease-in-out ${circleScale} ${
          phase === "inhale" ? "border-sky-400 bg-sky-50 dark:bg-sky-900/20"
          : phase === "hold" ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
          : phase === "exhale" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
          : "border-muted-foreground/20 bg-muted/20"
        }`}>
          <div className="text-center">
            <p className={`text-3xl font-bold ${phaseColors[phase]}`}>
              {isRunning ? countdown : ""}
            </p>
            <p className={`text-sm font-medium ${phaseColors[phase]}`}>
              {phaseLabels[phase]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {Array.from({ length: data.cycles }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentCycle
                  ? "bg-emerald-500"
                  : i === currentCycle && isRunning
                  ? "bg-primary"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {completed ? (
          <div className="mt-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold mb-1">Great job!</p>
            <p className="text-sm text-muted-foreground mb-3">You completed {data.cycles} breathing cycles. Notice how your body feels calmer?</p>
            <Button variant="outline" size="sm" onClick={reset} data-testid="button-breathing-again">
              <RotateCcw className="mr-1 h-4 w-4" /> Breathe Again
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-6">
            {!isRunning ? (
              <Button onClick={start} data-testid="button-start-breathing">
                <Play className="mr-1 h-4 w-4" /> {currentCycle > 0 ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button variant="outline" onClick={pause} data-testid="button-pause-breathing">
                <Pause className="mr-1 h-4 w-4" /> Pause
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={reset} data-testid="button-reset-breathing">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
