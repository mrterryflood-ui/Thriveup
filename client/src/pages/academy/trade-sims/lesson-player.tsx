import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  ChevronLeft, ChevronRight, BookOpen, Target, Beaker, Lightbulb,
  GraduationCap, Save, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { VisualCircuitCanvas } from "@/components/trade-sims/electrical/visual-circuit-canvas";
import { PlumbingCanvas } from "@/components/trade-sims/plumbing/plumbing-canvas";
import { AutoCanvas } from "@/components/trade-sims/automotive/auto-canvas";
import { WeldingCanvas } from "@/components/trade-sims/welding/welding-canvas";
import { HvacCanvas } from "@/components/trade-sims/hvac/hvac-canvas";
import { useToast } from "@/hooks/use-toast";
import {
  gradeBackflow,
  backflowDebriefLine,
  type BackflowRubric,
  type BackflowGrade,
} from "@/lib/trade-sims/plumbing/backflow-rubric";
import type { FlowSolveResult } from "@/lib/trade-sims/plumbing/flow-solver";
import type { PlacedPlumbingComponent } from "@/lib/trade-sims/plumbing/component-defs";

/**
 * Render the right sim canvas for a given engineMode, or null if that engine
 * doesn't have a learner-facing canvas yet. The `onRun` callback fires once
 * the learner has actually executed a solve — used to gate "Mark complete".
 */
function renderEngineCanvas(
  engineMode: string,
  initialComponents: Array<{ kind: string; props?: Record<string, number | boolean | string> }> | undefined,
  onRun: () => void,
  onPlumbingState?: (s: {
    components: PlacedPlumbingComponent[];
    lastSolve: FlowSolveResult | null;
  }) => void,
  tradeSlug?: string,
) {
  // Electrical: always use the visual schematic canvas regardless of engineMode.
  // This covers both linear-dc lessons (full physics) and concept-only lessons
  // (exploration mode — solver still runs for any solvable sub-circuits).
  if (tradeSlug === "electrical") {
    return (
      <VisualCircuitCanvas
        initialComponents={initialComponents ?? []}
        onChange={(s) => { if (s.lastSolve) onRun(); }}
        onInteract={onRun}
        engineMode={engineMode}
      />
    );
  }

  if (engineMode === "linear-dc") {
    // Automotive reuses the linear-dc solver but ships its own domain canvas
    // (battery sag, fuse blowing, alternator load, starter current).
    return (
      <AutoCanvas
        initialComponents={initialComponents ?? []}
        onChange={(s) => { if (s.lastSolve) onRun(); }}
      />
    );
  }
  if (engineMode === "pipe-network") {
    return (
      <PlumbingCanvas
        initialComponents={initialComponents ?? []}
        onChange={(s) => {
          if (s.lastSolve) onRun();
          onPlumbingState?.(s);
        }}
      />
    );
  }
  if (engineMode === "heat-input") {
    return (
      <WeldingCanvas
        onChange={(s) => { if (s.lastSolve) onRun(); }}
      />
    );
  }
  if (engineMode === "thermal-airflow") {
    return (
      <HvacCanvas
        onChange={(s) => { if (s.lastSolve) onRun(); }}
      />
    );
  }
  return null;
}

/**
 * Whether this trade+engine combination should surface an interactive canvas
 * to the learner. Electrical always gets the visual circuit canvas. All other
 * trades use the ENGINES_WITH_CANVAS set (physics-backed engine required).
 */
function shouldShowCanvas(tradeSlug: string | undefined, engineMode: string): boolean {
  if (tradeSlug === "electrical") return true;
  return ENGINES_WITH_CANVAS.has(engineMode);
}

/**
 * Tiny pass/fail badge for a backflow-rubric step. Pulled out of the JSX
 * to keep the guided-steps render readable.
 */
function BackflowGradeBadge({ grade }: { grade: BackflowGrade }) {
  if (grade.status === "pending") {
    return (
      <Badge variant="outline" data-testid="badge-backflow-pending">
        Run the sim to grade
      </Badge>
    );
  }
  if (grade.status === "pass") {
    return (
      <Badge className="bg-green-600 hover:bg-green-600" data-testid="badge-backflow-pass">
        <CheckCircle2 className="h-3 w-3 mr-1" /> PASS
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" data-testid="badge-backflow-fail">
      <XCircle className="h-3 w-3 mr-1" /> Not yet
    </Badge>
  );
}

// Derived from renderEngineCanvas — keep these in sync. Any engine listed here
// will (a) mount its canvas via renderEngineCanvas and (b) require the learner
// to actually run the sim before Mark Complete unlocks.
const ENGINES_WITH_CANVAS = new Set(["linear-dc", "pipe-network", "heat-input", "thermal-airflow"]);

// Learner-facing label for an engine mode. The raw mode names (linear-dc,
// thermal-airflow, heat-input, pipe-network, concept-only) are developer
// jargon and must NOT leak into the public UI. See trade-sims audit P1 #3.
const ENGINE_LABEL: Record<string, string> = {
  "linear-dc": "Interactive sim",
  "pipe-network": "Interactive sim",
  "heat-input": "Calculator + sim",
  "thermal-airflow": "Calculator + sim",
  "concept-only": "Read + reflect",
};
function engineLabelFor(mode: string): string {
  return ENGINE_LABEL[mode] ?? "Lesson";
}

// Mark-complete reflection gate (words, not chars) for no-canvas lessons.
// 40 words ~= 2-3 sentences = a thoughtful one-liner, not a race-click.
const REFLECTION_MIN_WORDS = 40;
function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// Single line of the pre-completion checklist. Kept tiny + presentational —
// real gating lives in `canMarkComplete`.
function CheckItem({
  done,
  label,
  testId,
  muted,
}: {
  done: boolean;
  label: string;
  testId: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm" data-testid={testId}>
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
      ) : (
        <XCircle className={`h-4 w-4 shrink-0 ${muted ? "opacity-40" : "text-muted-foreground"}`} />
      )}
      <span className={done ? "" : muted ? "opacity-60" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
// Self-check: assert renderEngineCanvas knows every engine in the Set.
if (typeof window !== "undefined" && import.meta.env.DEV) {
  for (const e of ENGINES_WITH_CANVAS) {
    if (renderEngineCanvas(e, [], () => {}) === null) {
      // eslint-disable-next-line no-console
      console.warn(`[trade-sims] engine "${e}" is in ENGINES_WITH_CANVAS but renderEngineCanvas returned null`);
    }
  }
}

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
  guidedSteps: Array<{
    instruction: string;
    hint: string;
    checkDescription: string;
    backflowRubric?: BackflowRubric;
  }> | null;
  soloChallenge: {
    prompt: string;
    successCriteria: string;
    scoringRubric?: { correctness: number; time: number; componentCount: number };
    backflowRubric?: BackflowRubric;
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
  const [debrief, setDebrief] = useState<string | null>(null);
  const [debriefNote, setDebriefNote] = useState("");
  // Reflection captured on the Solo tab. For no-canvas lessons this is the
  // primary engagement gate (≥ REFLECTION_MIN_WORDS). On canvas lessons it
  // remains optional but is still encouraged. Persisted to localStorage
  // per-lesson so a refresh / accidental navigation doesn't wipe it.
  const [soloReflection, setSoloReflection] = useState("");
  // Open journal entry from the Sandbox tab. Same persistence pattern.
  const [sandboxJournal, setSandboxJournal] = useState("");
  const [startedAt] = useState(() => Date.now());
  // Real engagement tracking — gates "Mark complete" so a user can't just click
  // Concept → Debrief and claim 100%. Honesty-in-claims requirement.
  const [tabsVisited, setTabsVisited] = useState<Set<PlayerTab>>(new Set(["concept"]));
  const [hasRunSim, setHasRunSim] = useState(false);
  // Latest plumbing canvas state, scoped PER TAB. Guided / Solo / Sandbox
  // each mount their own PlumbingCanvas instance, so we must not let a
  // Guided solve bleed into the Solo rubric (and vice-versa) — that would
  // grade the learner on work they did somewhere else.
  type PlumbingTabState = {
    components: PlacedPlumbingComponent[];
    lastSolve: FlowSolveResult | null;
  };
  const EMPTY_PLUMBING: PlumbingTabState = { components: [], lastSolve: null };
  const [plumbingByTab, setPlumbingByTab] = useState<Record<PlayerTab, PlumbingTabState>>({
    concept: EMPTY_PLUMBING,
    guided: EMPTY_PLUMBING,
    solo: EMPTY_PLUMBING,
    sandbox: EMPTY_PLUMBING,
    debrief: EMPTY_PLUMBING,
  });
  const setPlumbingFor = useCallback(
    (t: PlayerTab) => (s: PlumbingTabState) =>
      setPlumbingByTab((prev) => ({ ...prev, [t]: s })),
    [],
  );
  const guidedPlumbing = plumbingByTab.guided;
  const soloPlumbing = plumbingByTab.solo;
  // Debrief: prefer the Solo result (it's the graded one); fall back to
  // Guided so the learner still gets a "what the solver caught" summary if
  // they never finished Solo.
  const debriefPlumbing = soloPlumbing.lastSolve ? soloPlumbing : guidedPlumbing;
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

  // localStorage hydration for soloReflection + sandboxJournal, keyed by
  // lesson.id once the lesson loads. Quiet no-op on SSR / private mode.
  useEffect(() => {
    if (typeof window === "undefined" || !lesson?.id) return;
    try {
      const r = window.localStorage.getItem(`trade-sims:reflection:${lesson.id}`);
      if (r !== null) setSoloReflection(r);
      const j = window.localStorage.getItem(`trade-sims:journal:${lesson.id}`);
      if (j !== null) setSandboxJournal(j);
    } catch {
      // localStorage may be disabled; silently fall back to in-memory state.
    }
    // Intentionally only re-hydrate when a new lesson loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);
  useEffect(() => {
    if (typeof window === "undefined" || !lesson?.id) return;
    try { window.localStorage.setItem(`trade-sims:reflection:${lesson.id}`, soloReflection); } catch { /* quota / private mode — ignore */ }
  }, [soloReflection, lesson?.id]);
  useEffect(() => {
    if (typeof window === "undefined" || !lesson?.id) return;
    try { window.localStorage.setItem(`trade-sims:journal:${lesson.id}`, sandboxJournal); } catch { /* quota / private mode — ignore */ }
  }, [sandboxJournal, lesson?.id]);
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

  // Hint mutation (Solo tab).
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
          mode: "hint",
          question: "I'm stuck on the current step — give me a nudge without giving away the answer.",
          canvasState: { tab },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (d: any) => {
      setHint(d?.response ?? d?.hint ?? d?.message ?? "Try checking the wiring between the source and the load.");
    },
    onError: () => {
      setHint("Tutor is offline right now. Re-read the concept blurb and try the next step.");
    },
  });

  // Debrief mutation (Debrief tab) — calls the same endpoint with mode=debrief
  // and ensemble-consensus on the server. Passes the learner's notes so the
  // summary actually reflects what they wrote.
  const askDebrief = useMutation({
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
          mode: "debrief",
          canvasState: { tab, notes: debriefNote },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (d: any) => {
      setDebrief(d?.response ?? "Lesson wrapped. Try the next day to keep momentum.");
    },
    onError: () => {
      setDebrief("Tutor is offline right now — your notes are saved locally; you can continue without a summary.");
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

  // Honest completion gating. Three signals:
  //   (1) Tabs visited: concept + guided + solo + sandbox all opened.
  //   (2) Engagement: either ran the sim (canvas lessons) OR wrote a
  //       ≥40-word reflection in Solo (no-canvas lessons). Either path
  //       proves the learner did more than tab-click.
  //   (3) Always allow optional reflection on canvas lessons but don't
  //       require it.
  const requiresRun = ENGINES_WITH_CANVAS.has(engineMode);
  const tabsAllVisited =
    tabsVisited.has("concept") &&
    tabsVisited.has("guided") &&
    tabsVisited.has("solo") &&
    tabsVisited.has("sandbox");
  const reflectionWords = countWords(soloReflection);
  const reflectionOk = reflectionWords >= REFLECTION_MIN_WORDS;
  const engagementOk = requiresRun ? hasRunSim : reflectionOk;
  const canMarkComplete = tabsAllVisited && engagementOk;

  const handleComplete = () => {
    if (!canMarkComplete) {
      toast({
        title: "Not yet",
        description: !tabsAllVisited
          ? "Visit all four tabs (Concept, Guided, Solo, Sandbox) before marking complete."
          : requiresRun
            ? "Run the sim at least once on the canvas before marking complete."
            : `Write a short reflection in Solo first — at least ${REFLECTION_MIN_WORDS} words (you have ${reflectionWords}).`,
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
          <Badge variant="secondary" data-testid="badge-engine-label" title={`engine: ${engineMode}`}>
            {engineLabelFor(engineMode)}
          </Badge>
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
              {(lesson.guidedSteps ?? []).map((step, i) => {
                const grade = step.backflowRubric && engineMode === "pipe-network"
                  ? gradeBackflow(step.backflowRubric, guidedPlumbing.lastSolve, guidedPlumbing.components)
                  : null;
                return (
                  <div key={i} className="border-l-4 border-primary pl-4 py-2" data-testid={`block-step-${i}`}>
                    <div className="flex items-start gap-2">
                      <Badge className="mt-0.5">{i + 1}</Badge>
                      <div className="flex-1">
                        <div className="font-semibold">{step.instruction}</div>
                        <div className="text-sm text-muted-foreground mt-1">Hint: {step.hint}</div>
                        <div className="text-xs text-muted-foreground/80 mt-1">Check: {step.checkDescription}</div>
                        {grade && (
                          <div className="mt-2 flex items-start gap-2" data-testid={`grade-step-${i}`}>
                            <BackflowGradeBadge grade={grade} />
                            <p className="text-xs text-muted-foreground flex-1">{grade.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {shouldShowCanvas(tradeSlug, engineMode) && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">
                    {ENGINES_WITH_CANVAS.has(engineMode) ? "Build it on the canvas" : "Explore on the canvas"}
                  </h3>
                  {lesson.sandboxStarter?.prompt && !ENGINES_WITH_CANVAS.has(engineMode) && (
                    <p className="text-sm text-muted-foreground mb-3 italic">
                      {lesson.sandboxStarter.prompt}
                    </p>
                  )}
                  {renderEngineCanvas(
                    engineMode,
                    lesson.sandboxStarter?.initialComponents,
                    () => setHasRunSim(true),
                    setPlumbingFor("guided"),
                    tradeSlug,
                  )}
                </div>
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
                  {shouldShowCanvas(tradeSlug, engineMode) &&
                    renderEngineCanvas(engineMode, undefined, () => setHasRunSim(true), setPlumbingFor("solo"), tradeSlug)}
                  {lesson.soloChallenge.backflowRubric && engineMode === "pipe-network" && (() => {
                    const g = gradeBackflow(
                      lesson.soloChallenge.backflowRubric,
                      soloPlumbing.lastSolve,
                      soloPlumbing.components,
                    );
                    return (
                      <Alert
                        variant={g.status === "fail" ? "destructive" : "default"}
                        data-testid="alert-solo-grade"
                      >
                        <AlertTitle className="flex items-center gap-2">
                          <BackflowGradeBadge grade={g} />
                          <span>Solo grade</span>
                        </AlertTitle>
                        <AlertDescription>
                          {g.message}
                          {g.status !== "pending" && (
                            <span className="block text-xs mt-1 opacity-80">
                              Check valves closed in last run: {g.closedCount}.
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    );
                  })()}
                  <div className="space-y-1">
                    <h3 className="font-semibold">Your reflection</h3>
                    <p className="text-xs text-muted-foreground">
                      {requiresRun
                        ? `Optional. A short note (2-3 sentences) helps the AI tutor debrief you.`
                        : `Required for this lesson — at least ${REFLECTION_MIN_WORDS} words. What did you actually figure out?`}
                    </p>
                    <Textarea
                      value={soloReflection}
                      onChange={(e) => setSoloReflection(e.target.value)}
                      placeholder="What did you try? What surprised you? What's still unclear?"
                      rows={4}
                      data-testid="textarea-solo-reflection"
                    />
                    <p className="text-xs text-muted-foreground" data-testid="text-reflection-wordcount">
                      {reflectionWords} {reflectionWords === 1 ? "word" : "words"}
                      {!requiresRun && reflectionWords < REFLECTION_MIN_WORDS && (
                        <span> · need {REFLECTION_MIN_WORDS - reflectionWords} more</span>
                      )}
                      {!requiresRun && reflectionOk && (
                        <span className="text-green-600 dark:text-green-400"> · ready</span>
                      )}
                    </p>
                  </div>
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
              {shouldShowCanvas(tradeSlug, engineMode) ? (
                renderEngineCanvas(
                  engineMode,
                  lesson.sandboxStarter?.initialComponents,
                  () => setHasRunSim(true),
                  setPlumbingFor("sandbox"),
                  tradeSlug,
                )
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertTitle>Sandbox prompt</AlertTitle>
                    <AlertDescription>
                      {lesson.sandboxStarter?.prompt ?? "Free play. Plan something you would actually build, even without the canvas yet."}
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Your sandbox journal</h3>
                    <p className="text-xs text-muted-foreground">
                      Sketch your plan in words: what would you build, what's the first move, what could go wrong? Saved automatically as you type.
                    </p>
                    <Textarea
                      value={sandboxJournal}
                      onChange={(e) => setSandboxJournal(e.target.value)}
                      placeholder="If I had the tools in front of me right now, I would start by…"
                      rows={5}
                      data-testid="textarea-sandbox-journal"
                    />
                    <p className="text-xs text-muted-foreground" data-testid="text-sandbox-wordcount">
                      {countWords(sandboxJournal)} words
                    </p>
                  </div>
                </div>
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
              {engineMode === "pipe-network" && (() => {
                const line = backflowDebriefLine(debriefPlumbing.lastSolve, debriefPlumbing.components);
                if (!line) return null;
                return (
                  <Alert data-testid="alert-backflow-debrief">
                    <AlertTitle>What the solver caught</AlertTitle>
                    <AlertDescription>{line}</AlertDescription>
                  </Alert>
                );
              })()}
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
              {/* Always-visible 3-item checklist so the learner knows what's
                  still required to unlock Mark Complete. No silent disabled
                  state. See trade-sims audit P1 #1. */}
              <div className="rounded border p-3 space-y-1" data-testid="checklist-complete">
                <h3 className="text-sm font-semibold mb-1">Before you finish</h3>
                <CheckItem
                  done={tabsAllVisited}
                  label="Visited Concept, Guided, Solo, and Sandbox tabs"
                  testId="check-tabs"
                />
                {requiresRun ? (
                  <CheckItem
                    done={hasRunSim}
                    label="Ran the interactive simulator at least once"
                    testId="check-ran-sim"
                  />
                ) : (
                  <CheckItem
                    done={reflectionOk}
                    label={`Wrote a ≥${REFLECTION_MIN_WORDS}-word reflection in Solo (${reflectionWords} so far)`}
                    testId="check-reflection"
                  />
                )}
                <CheckItem
                  done={canMarkComplete}
                  label="Ready to mark complete"
                  testId="check-ready"
                  muted
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => askDebrief.mutate()}
                  disabled={askDebrief.isPending}
                  data-testid="button-ask-debrief"
                >
                  {askDebrief.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-1" />}
                  Ask tutor for debrief
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={saveProgress.isPending || !canMarkComplete}
                  data-testid="button-mark-complete"
                >
                  {saveProgress.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Mark complete & save progress
                </Button>
                {nextLesson && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/academy/trade-sims/${tradeSlug}/${nextLesson.slug}`)}
                    data-testid="button-next-lesson"
                  >
                    Next lesson: Day {nextLesson.dayNumber} {nextLesson.title} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/academy/trade-sims/${tradeSlug}/certify`)}
                  data-testid="button-credentials"
                >
                  Credentials & apprenticeships <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              {debrief && (
                <Alert data-testid="alert-debrief">
                  <AlertTitle>Tutor debrief</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap">{debrief}</AlertDescription>
                </Alert>
              )}
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
