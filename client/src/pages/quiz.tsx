import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, CheckCircle2, XCircle, Award,
  ChevronRight, RotateCcw, Trophy
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuizQuestion } from "@shared/schema";

export default function QuizPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; passed: boolean; pointsEarned: number } | null>(null);

  const { data: questions, isLoading } = useQuery<QuizQuestion[]>({
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
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${quizResult.passed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            {quizResult.passed ? (
              <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <RotateCcw className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-quiz-result">
            {quizResult.passed ? "Congratulations!" : "Keep Trying!"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {quizResult.passed
              ? `You scored ${percentage}% and earned ${quizResult.pointsEarned} points!`
              : `You scored ${percentage}%. You need 70% to pass. Review the material and try again!`}
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl font-bold text-primary">{quizResult.score}</span>
            <span className="text-xl text-muted-foreground">/ {quizResult.total}</span>
          </div>
          <Progress value={percentage} className="h-3 mb-8 max-w-xs mx-auto" />
          <div className="flex justify-center gap-3 flex-wrap">
            {!quizResult.passed && (
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers({});
                  setShowResults(false);
                  setQuizResult(null);
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
      <Link href={`/module/${moduleId}`}>
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-quiz">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Module
        </Button>
      </Link>

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
