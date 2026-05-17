import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { anonSessionId } from "@/lib/trade-sims/anon-session";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, BookOpen, Target, Beaker, Lightbulb, GraduationCap, Save, Loader2 } from "lucide-react";
import { CircuitCanvas } from "@/components/trade-sims/electrical/circuit-canvas";
import { useToast } from "@/hooks/use-toast";

interface TradeRow {
  id: number;
  slug: string;
  name: string;
}
interface LessonRow {
  id: number;
  tradeId: number;
  slug: string;
  title: string;
  shortDescription: string;
  dayNumber: number;
  concept: {
    engineMode?: string;
    blurb?: string;
    keyTerms?: Array<{ term: string; definition: string }>;
    diagramKey?: string;
  } | null;
  guidedSteps: Array<{ instruction: string; hint: string; checkDescription: string }> | null;
  soloChallenge: {
    prompt: string;
    successCriteria: string;
    scoringRubric?: { correctness: number; time: number; componentCount: number };
  } | null;
  sandboxStarter: {
    prompt: string;
    initialComponents?: Array<{ kind: string; props?: Record<string, number | boolean | string> }>;
  } | null;
  credentialPathway: string;
}

type PlayerTab = "concept" | "guided" | "solo" | "sandbox" | "debrief";

const TAB_ICONS = {
  concept: BookOpen,
  guided: Target,
  solo: Beaker,
  sandbox: Lightbulb,
  debrief: GraduationCap,
} as const;

export default function LessonPlayerPage() {
  const [, params] = useRoute("/academy/trade-sims/:tradeSlug/:lessonSlug");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const tradeSlug = params?.tradeSlug ?? "";
  const lessonSlug = params?.lessonSlug ?? "";

  const [tab, setTab] = useState<PlayerTab>("concept");
  const [hint, setHint] = useState<string | null>(null);
  const [debriefNote, setDebriefNote] = useState("");
  const [startedAt] = useState(() => Date.now());
  // Real engagement tracking — gates "Mark complete" so a user can't just click
  // Concept → Debrief and claim 100%. Honesty-in-claims requirement.
  const [tabsVisited, setTabsVisited] = useState<Set<PlayerTab>>(new Set(["concept"]));
  const [hasRunSim, setHasRunSim] = useState(false);
  const initialProgressFired = useRef(false);

  const { data: lessonData, isLoading } = useQuery<{ trade: TradeRow; lesson: LessonRow }>({
    queryKey: ["/api/trade-sims/lessons", tradeSlug, lessonSlug],
    enabled: !!tradeSlug && !!lessonSlug,
  });

  const { data: tradeData } = useQuery<{ trade: TradeRow; lessons: LessonRow[] }>({
    queryKey: ["/api/trade-sims/lessons", tradeSlug],
    enabled: !!tradeSlug,
  });

  const lesson = lessonData?.lesson;
  const trade = lessonData?.trade;
  const engineMode = lesson?.concept?.engineMode ?? "concept-only";
  const allLessons = tradeData?.lessons ?? [];
  const currentIdx = allLessons.findIndex((l) => l.slug === lessonSlug);
  const nextLesson = currentIdx >= 0 ? allLessons[currentIdx + 1] : undefined;
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : undefined;

  useEffect(() => {
    if (lesson && trade) {
      document.title = `Day ${lesson.dayNumber}: ${lesson.title} — ${trade.name} — ThriveUp Trade Sims`;
    }
  }, [lesson, trade]);

  // Progress save mutation. Fields match shared/schema.ts trade_sims_lesson_progress.
  const saveProgress = useMutation({
    mutationFn: async (payload: {
      status: string;
      conceptCompleted?: boolean;
      guidedScore?: number;
      soloScore?: number;
      soloTimeMs?: number;
      debriefCompleted?: boolean;
    }) => {
      if (!lesson) return null;
      const body: Record<string, unknown> = { lessonId: lesson.id, status: payload.status };
      if (payload.conceptCompleted !== undefined) body.conceptCompleted = payload.conceptCompleted;
      if (payload.guidedScore !== undefined) body.guidedScore = payload.guidedScore;
      if (payload.soloScore !== undefined) body.soloScore = payload.soloScore;
      if (payload.soloTimeMs !== undefined) body.soloTimeMs = payload.soloTimeMs;
      if (payload.debriefCompleted !== undefined) body.debriefCompleted = payload.debriefCompleted;
      const res = await fetch("/api/trade-sims/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anon-session": anonSessionId(),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/trade-sims/progress", tradeSlug] });
    },
  });

  // Hint mutation.
  const askHint = useMutation({
    mutationFn: async () => {
      if (!lesson) return null;
      const res = await fetch("/api/trade-sims/ai-tutor/hint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anon-session": anonSessionId(),
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          question: "I'm stuck on the current step — give me a nudge without giving away the answer.",
          canvasState: { tab },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (d: any) => {
      setHint(d?.hint ?? d?.message ?? "Try checking the wiring between the source and the load.");
    },
    onError: () => {
      setHint("Tutor is offline right now. Re-read the concept blurb and try the next step.");
    },
  });

  // Mark in-progress once per lesson load (ref guard prevents remount re-fire).
  useEffect(() => {
    if (lesson?.id && !initialProgressFired.current) {
      initialProgressFired.current = true;
      saveProgress.mutate({ status: "in_progress" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // Track tab visits as honest engagement signal.
  useEffect(() => {
    setTabsVisited((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [tab]);

  // Honest completion gating: for linear-dc lessons require the learner has
  // (a) visited concept + guided + solo + sandbox tabs AND (b) actually run
  // the canvas at least once. For non-interactive engines (concept-only etc.)
  // require only that all 4 pre-debrief tabs have been visited.
  const requiresRun = engineMode === "linear-dc";
  const canMarkComplete =
    tabsVisited.has("concept") &&
    tabsVisited.has("guided") &&
    tabsVisited.has("solo") &&
    tabsVisited.has("sandbox") &&
    (!requiresRun || hasRunSim);

  const handleComplete = () => {
    if (!canMarkComplete) {
      toast({
        title: "Not yet",
        description: requiresRun && !hasRunSim
          ? "Run the circuit at least once on the canvas before marking complete."
          : "Visit all four tabs (Concept, Guided, Solo, Sandbox) before marking complete.",
        variant: "destructive",
      });
      return;
    }
    const elapsedMs = Date.now() - startedAt;
    const elapsedMin = elapsedMs / 60000;
    // Score = base for actual engagement + small time bonus (capped).
    // No way to score 100% without genuinely visiting + running.
    const speedBonus = Math.max(0, Math.min(15, 15 - Math.floor(elapsedMin)));
    const score = 80 + speedBonus;
    saveProgress.mutate({
      status: "completed",
      conceptCompleted: true,
      soloScore: score,
      soloTimeMs: elapsedMs,
      debriefCompleted: true,
    });
    toast({ title: "Lesson complete", description: `Score saved: ${score}%` });
  };

  const guidedStepCount = lesson?.guidedSteps?.length ?? 0;

  if (isLoading || !lesson || !trade) {
    return (
      <div className="container mx-auto max-w-5xl py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" data-testid="button-back-lessons">
          <Link href={`/academy/trade-sims/${tradeSlug}`}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {trade.name} lessons
          </Link>
        </Button>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Day {lesson.dayNumber}</Badge>
          <Badge variant="secondary">{engineMode}</Badge>
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-lesson-title">{lesson.title}</h1>
        <p className="text-muted-foreground">{lesson.shortDescription}</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as PlayerTab)}>
        <TabsList className="grid grid-cols-5 w-full" data-testid="tabs-player">
          {(["concept", "guided", "solo", "sandbox", "debrief"] as PlayerTab[]).map((t) => {
            const I = TAB_ICONS[t];
            return (
              <TabsTrigger key={t} value={t} data-testid={`tab-${t}`}>
                <I className="h-4 w-4 mr-1" />
                <span className="capitalize hidden sm:inline">{t}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Concept */}
        <TabsContent value="concept">
          <Card>
            <CardHeader>
              <CardTitle>Concept</CardTitle>
              <CardDescription>Read this once, then we build.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base leading-relaxed" data-testid="text-concept-blurb">
                {lesson.concept?.blurb}
              </p>
              {lesson.concept?.keyTerms && lesson.concept.keyTerms.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Key Terms</h3>
                  <ul className="space-y-2">
                    {lesson.concept.keyTerms.map((kt, i) => (
                      <li key={i} className="text-sm" data-testid={`text-keyterm-${i}`}>
                        <span className="font-semibold">{kt.term}</span> — {kt.definition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pt-2">
                <Button onClick={() => setTab("guided")} data-testid="button-next-guided">
                  Next: Guided practice <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guided */}
        <TabsContent value="guided">
          <Card>
            <CardHeader>
              <CardTitle>Guided practice</CardTitle>
              <CardDescription>
                {guidedStepCount} step{guidedStepCount === 1 ? "" : "s"}. Work through them in order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(lesson.guidedSteps ?? []).map((step, i) => (
                <div key={i} className="border-l-4 border-primary pl-4 py-2" data-testid={`block-step-${i}`}>
                  <div className="flex items-start gap-2">
                    <Badge className="mt-0.5">{i + 1}</Badge>
                    <div className="flex-1">
                      <div className="font-semibold">{step.instruction}</div>
                      <div className="text-sm text-muted-foreground mt-1">Hint: {step.hint}</div>
                      <div className="text-xs text-muted-foreground/80 mt-1">Check: {step.checkDescription}</div>
                    </div>
                  </div>
                </div>
              ))}
              {engineMode === "linear-dc" && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Build it on the canvas</h3>
                  <CircuitCanvas
                    initialComponents={lesson.sandboxStarter?.initialComponents ?? []}
                    onChange={(s) => { if (s.lastSolve) setHasRunSim(true); }}
                  />
                </div>
              )}
              {engineMode !== "linear-dc" && (
                <Alert>
                  <AlertTitle>{engineMode} simulator coming soon</AlertTitle>
                  <AlertDescription>
                    This lesson uses the {engineMode} engine. Work through the guided steps above — the interactive
                    simulator for this engine ships in the next release.
                  </AlertDescription>
                </Alert>
              )}
              <div className="pt-2">
                <Button onClick={() => setTab("solo")} data-testid="button-next-solo">
                  Next: Solo challenge <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Solo */}
        <TabsContent value="solo">
          <Card>
            <CardHeader>
              <CardTitle>Solo challenge</CardTitle>
              <CardDescription>Your turn. No hand-holding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson.soloChallenge ? (
                <>
                  <div>
                    <h3 className="font-semibold">Prompt</h3>
                    <p data-testid="text-solo-prompt">{lesson.soloChallenge.prompt}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Success criteria</h3>
                    <p className="text-sm text-muted-foreground">{lesson.soloChallenge.successCriteria}</p>
                  </div>
                  {engineMode === "linear-dc" && (
                    <CircuitCanvas onChange={(s) => { if (s.lastSolve) setHasRunSim(true); }} />
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => askHint.mutate()}
                      disabled={askHint.isPending}
                      data-testid="button-ask-hint"
                    >
                      {askHint.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-1" />}
                      Ask for a hint
                    </Button>
                    <Button onClick={() => setTab("sandbox")} data-testid="button-next-sandbox">
                      Next: Sandbox <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  {hint && (
                    <Alert data-testid="alert-hint">
                      <AlertTitle>Tutor nudge</AlertTitle>
                      <AlertDescription>{hint}</AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No solo challenge defined for this lesson.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sandbox */}
        <TabsContent value="sandbox">
          <Card>
            <CardHeader>
              <CardTitle>Sandbox</CardTitle>
              <CardDescription>
                {lesson.sandboxStarter?.prompt ?? "Free play. Build something. Break something. See what happens."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {engineMode === "linear-dc" && (
                <CircuitCanvas
                  initialComponents={lesson.sandboxStarter?.initialComponents ?? []}
                  onChange={(s) => { if (s.lastSolve) setHasRunSim(true); }}
                />
              )}
              {engineMode !== "linear-dc" && (
                <Alert>
                  <AlertTitle>Sandbox available in Phase B+</AlertTitle>
                  <AlertDescription>
                    Open-ended sandbox for the {engineMode} engine ships alongside its dedicated canvas.
                  </AlertDescription>
                </Alert>
              )}
              <div className="pt-2">
                <Button onClick={() => setTab("debrief")} data-testid="button-next-debrief">
                  Next: Debrief <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debrief */}
        <TabsContent value="debrief">
          <Card>
            <CardHeader>
              <CardTitle>Debrief</CardTitle>
              <CardDescription>What did you learn? Where does it lead?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Credential pathway</h3>
                <p className="text-sm" data-testid="text-credential-pathway">{lesson.credentialPathway}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Your notes</h3>
                <Textarea
                  value={debriefNote}
                  onChange={(e) => setDebriefNote(e.target.value)}
                  placeholder="One sentence: what's the single most useful thing you learned today?"
                  rows={3}
                  data-testid="textarea-debrief-note"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleComplete}
                  disabled={saveProgress.isPending || !canMarkComplete}
                  data-testid="button-mark-complete"
                >
                  {saveProgress.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Mark complete & save progress
                </Button>
                {!canMarkComplete && (
                  <p className="text-xs text-muted-foreground w-full">
                    {requiresRun && !hasRunSim
                      ? "Run the circuit on the canvas at least once to unlock completion."
                      : "Visit Concept, Guided, Solo, and Sandbox before completing."}
                  </p>
                )}
                {nextLesson && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/academy/trade-sims/${tradeSlug}/${nextLesson.slug}`)}
                    data-testid="button-next-lesson"
                  >
                    Next lesson: Day {nextLesson.dayNumber} {nextLesson.title} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Prev/Next nav at bottom */}
      <div className="flex justify-between pt-4 border-t">
        {prevLesson ? (
          <Button
            variant="ghost"
            onClick={() => navigate(`/academy/trade-sims/${tradeSlug}/${prevLesson.slug}`)}
            data-testid="button-prev-lesson"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Day {prevLesson.dayNumber}: {prevLesson.title}
          </Button>
        ) : <div />}
        {nextLesson ? (
          <Button
            variant="ghost"
            onClick={() => navigate(`/academy/trade-sims/${tradeSlug}/${nextLesson.slug}`)}
            data-testid="button-next-lesson-bottom"
          >
            Day {nextLesson.dayNumber}: {nextLesson.title} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : <div />}
      </div>
    </div>
  );
}
