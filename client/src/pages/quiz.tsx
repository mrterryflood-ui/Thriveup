import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, CheckCircle2, XCircle, Award,
  ChevronRight, RotateCcw, Trophy, Home
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getVersioned, setVersioned, safeRemove } from "@/lib/safe-storage";
import type { QuizQuestion } from "@shared/schema";

const QUIZ_DRAFT_VERSION = 1;
const QUIZ_DRAFT_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

interface QuizDraft { answers: Record<string, string>; currentQuestion: number }
function isQuizDraft(v: unknown): v is QuizDraft {
  if (!v || typeof v !== "object") return false;
  const d = v as any;
  const answersOk = d.answers && typeof d.answers === "object" && !Array.isArray(d.answers)
    && Object.values(d.answers).every((x) => typeof x === "string");
  const cqOk = typeof d.currentQuestion === "number";
  return answersOk && cqOk;
}

// The quiz GET intentionally strips the answer key — type the client to the
// sanitized shape so nothing can accidentally assume correctAnswer/explanation
// exist on the client.
type PublicQuizQuestion = Omit<QuizQuestion, "correctAnswer" | "explanation">;
import { ErrorRetry } from "@/components/error-retry";

export default function QuizPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Persist in-progress answers + current question to sessionStorage keyed by
  // moduleId AND user id so a refresh (or accidental navigation-back) doesn't
  // wipe the learner's work — and one learner's draft can't bleed into another
  // learner's session on a shared browser. Anonymous learners use "anon".
  // Decision: sessionStorage over server-side attempt drafts — this quiz is
  // small (a handful of questions) and the answers only need to survive a
  // reload within the same browser tab, so a server round-trip and draft table
  // would be overkill. The draft carries a version + expiry envelope.
  const userId = user?.id ?? "anon";
  const draftKey = `quiz-draft:${userId}:${moduleId}`;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; passed: boolean; masteryAchieved: boolean; canAdvance: boolean; pointsEarned: number } | null>(null);

  // Restore any saved draft on mount / when the module changes. Parse failures
  // are surfaced (and the corrupt draft dropped) rather than silently ignored.
  useEffect(() => {
    if (!moduleId) return;
    // getVersioned validates version + expiry + shape; a corrupt/expired draft
    // is dropped (side-effect) and null is returned rather than mis-parsed.
    const draft = getVersioned<QuizDraft>(
      draftKey,
      { version: QUIZ_DRAFT_VERSION, store: "session" },
      isQuizDraft,
    );
    if (draft) {
      setAnswers(draft.answers);
      setCurrentQuestion(draft.currentQuestion);
    }
  }, [draftKey, moduleId]);

  // Persist the draft as the learner answers / navigates. Only write once
  // there's something worth restoring, and never after results are shown.
  useEffect(() => {
    if (!moduleId || showResults) return;
    if (Object.keys(answers).length === 0) return;
    setVersioned<QuizDraft>(draftKey, { answers, currentQuestion }, {
      version: QUIZ_DRAFT_VERSION,
      store: "session",
      ttlMs: QUIZ_DRAFT_TTL_MS,
      pruneKeys: [draftKey],
    });
  }, [answers, currentQuestion, moduleId, draftKey, showResults]);

  // Unsaved-work guard: warn on refresh / tab-close while answers exist and the
  // quiz has not been submitted.
  useEffect(() => {
    const hasUnsaved = Object.keys(answers).length > 0 && !showResults;
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [answers, showResults]);

  const { data: questions, isLoading, error, refetch } = useQuery<PublicQuizQuestion[]>({
    queryKey: ["/api/modules", moduleId, "quiz"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/modules/${moduleId}/quiz/submit`, { answers });
      return res.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      setShowResults(true);
      // Work is safely submitted — drop the local draft.
      safeRemove(draftKey, "session");
      // Mastery can unlock badges, certificates, and level advancement —
      // invalidate everything downstream, not just /api/progress.
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
    },
    onError: () => {
      toast({
        title: "Couldn't submit your quiz",
        description: "We couldn't save your answers. Please check your connection and try submitting again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => { document.title = "Quiz | ThriveUp"; }, []);

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <div className="p-6"><ErrorRetry message="Failed to load quiz questions. Please try again." onRetry={refetch} /></div>;

  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Quiz Available</h2>
        <p className="text-muted-foreground mb-6">This module doesn't have a quiz yet.</p>
        <Link href={`/module/${moduleId}`}>
          <Button variant="outline" data-testid="button-back-no-quiz">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Module
          </Button>
        </Link>
      </div>
    );
  }

  if (showResults && quizResult) {
    const percentage = Math.round((quizResult.score / quizResult.total) * 100);
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${quizResult.masteryAchieved ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            {quizResult.masteryAchieved ? (
              <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <RotateCcw className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-quiz-result">
            {quizResult.masteryAchieved ? "Congratulations!" : "Keep Trying!"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {quizResult.masteryAchieved
              ? quizResult.pointsEarned > 0
                ? `You scored ${percentage}% and earned ${quizResult.pointsEarned} points!`
                : `You scored ${percentage}%! You've already mastered this quiz, so no new points this time.`
              : `You scored ${percentage}%. You need 80% to advance. Review the material and try again!`}
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl font-bold text-primary">{quizResult.score}</span>
            <span className="text-xl text-muted-foreground">/ {quizResult.total}</span>
          </div>
          <Progress value={percentage} className="h-3 mb-8 max-w-xs mx-auto" />
          <div className="flex justify-center gap-3 flex-wrap">
            {!quizResult.masteryAchieved && (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers({});
                  setShowResults(false);
                  setQuizResult(null);
                  safeRemove(draftKey, "session");
                }}
                data-testid="button-retry-quiz"
              >
                <RotateCcw className="mr-1 h-4 w-4" /> Try Again
              </Button>
            )}
            <Link href={`/module/${moduleId}`}>
              <Button data-testid="button-back-after-quiz">
                Back to Module
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const options = question.options as Array<{ id: string; text: string }>;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumb className="mb-6" data-testid="breadcrumb-quiz">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" data-testid="breadcrumb-home">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/curriculum" data-testid="breadcrumb-curriculum">Curriculum</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/module/${moduleId}`} data-testid="breadcrumb-module">Module</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage data-testid="breadcrumb-current">Quiz</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h2 className="text-lg font-semibold" data-testid="text-quiz-heading">Module Quiz</h2>
          <Badge variant="secondary">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="p-6 mb-6">
        <p className="text-lg font-medium mb-6" data-testid="text-question">
          {question.questionText}
        </p>
        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setAnswers({ ...answers, [question.id]: option.id })}
                className={`w-full text-left p-4 rounded-md border-2 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                data-testid={`button-option-${option.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <span className="text-sm">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          data-testid="button-prev-question"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={Object.keys(answers).length < questions.length || submitMutation.isPending}
            data-testid="button-submit-quiz"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            <CheckCircle2 className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            disabled={!answers[question.id]}
            data-testid="button-next-question"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
