import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, BookOpen, Clock, CheckCircle2,
  Sparkles, Brain, Home
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lesson } from "@shared/schema";
import { ErrorRetry } from "@/components/error-retry";
import LetterTracing from "@/components/activities/letter-tracing";
import MatchingGame from "@/components/activities/matching-game";
import SortingActivity from "@/components/activities/sorting-activity";
import BreathingExercise from "@/components/activities/breathing-exercise";
import EmotionCheck from "@/components/activities/emotion-check";
import PromptLab from "@/components/activities/prompt-lab";
import ArcbEvaluator from "@/components/activities/arcb-evaluator";
import HallucinationSpotter from "@/components/activities/hallucination-spotter";
import BiasDetective from "@/components/activities/bias-detective";
import AiOrHuman from "@/components/activities/ai-or-human";
import LessonComments from "@/components/lesson-comments";
import { SparkAuto } from "@/components/SparkAuto";
import { EvidenceSummary } from "@/components/evidence-label";
import { AIAugmentationDisclosure } from "@/components/ai-augmentation-disclosure";

function parseActivityData(lesson: Lesson) {
  if (!lesson.activityData || !lesson.activityType) return null;
  try {
    const parsed = typeof lesson.activityData === "string"
      ? JSON.parse(lesson.activityData)
      : lesson.activityData;
    return parsed;
  } catch {
    return null;
  }
}

function ActivityRenderer({ lesson }: { lesson: Lesson }) {
  const data = parseActivityData(lesson);
  if (!data) return null;

  switch (data.type) {
    case "tracing":
      return <LetterTracing data={data} />;
    case "matching":
      return <MatchingGame data={data} />;
    case "sorting":
      return <SortingActivity data={data} />;
    case "breathing":
      return <BreathingExercise data={data} />;
    case "emotion_check":
      return <EmotionCheck data={data} />;
    case "prompt-lab":
      return <PromptLab data={data} />;
    case "arcb-evaluator":
      return <ArcbEvaluator data={data} />;
    case "hallucination-spotter":
      return <HallucinationSpotter data={data} />;
    case "bias-detective":
      return <BiasDetective data={data} />;
    case "ai-or-human":
      return <AiOrHuman data={data} />;
    default:
      return null;
  }
}

export default function LessonViewerPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: lesson, isLoading, error, refetch } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/lessons/${lessonId}/complete`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      toast({
        title: "Lesson Complete!",
        description: `You earned ${data.pointsEarned || 50} points!`,
      });
      if (lesson) {
        setLocation(`/module/${lesson.moduleId}`);
      }
    },
    onError: () => {
      toast({
        title: "Couldn't mark this lesson complete",
        description: "We couldn't save your progress. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => { document.title = "Lesson | ThriveUp"; }, []);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <div className="p-6"><ErrorRetry message="Failed to load lesson. Please try again." onRetry={refetch} /></div>;

  if (!lesson) return (
    <div className="p-6 max-w-4xl mx-auto text-center">
      <h2 className="text-xl font-semibold mb-2" data-testid="text-lesson-not-found">Lesson Not Found</h2>
      <p className="text-muted-foreground mb-4">This lesson may have been moved or doesn't exist.</p>
      <Button variant="outline" onClick={() => setLocation("/subjects")} data-testid="button-back-subjects">Back to Subjects</Button>
    </div>
  );

  const paragraphs = lesson.content.split("\n\n").filter(Boolean);
  const hasActivity = !!lesson.activityType && !!lesson.activityData;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumb className="mb-6" data-testid="breadcrumb-lesson">
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
              <Link href={`/module/${lesson.moduleId}`} data-testid="breadcrumb-module">Module</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage data-testid="breadcrumb-current">{lesson.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <Badge variant="secondary" data-testid="badge-lesson-number">Lesson {lesson.lessonNumber}</Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1" data-testid="text-lesson-duration">
            <Clock className="h-3.5 w-3.5" /> {lesson.durationMinutes} min
          </span>
          {lesson.activityType && (
            <Badge variant="outline" className="text-xs capitalize" data-testid="badge-activity-type">{lesson.activityType.replace("_", " ")}</Badge>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-lesson-title">{lesson.title}</h1>
      </div>

      <Card className="p-6 md:p-8 mb-6" data-testid="card-lesson-content">
        <div className="prose dark:prose-invert max-w-none">
          {paragraphs.map((paragraph, i) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={i} className="text-xl font-semibold mt-6 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={i} className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-accent shrink-0" />
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            if (paragraph.startsWith("- ")) {
              const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
              return (
                <ul key={i} className="space-y-2 my-4">
                  {items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item.replace("- ", "")}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4">
                {paragraph}
              </p>
            );
          })}
        </div>
      </Card>
      <EvidenceSummary claims={[{ value: null, unit: "", source: "TCAF Curriculum Library", sourceId: "tcaf-curriculum", asOfDate: null, geographyKey: null, confidence: "verified", decisionCaption: "Lesson content is drawn from the TCAF Curriculum Library." }]} />

      {hasActivity && <ActivityRenderer lesson={lesson} />}

      {/* AI Learning Companion */}
      <div className="mt-6">
        <SparkAuto
          lessonTitle={lesson.title}
          lessonContent={lesson.content}
        />
      </div>
      <AIAugmentationDisclosure compact drewFrom={["The lesson title and content in the TCAF Curriculum Library"]} doesNotKnow={["Your personal circumstances or learning needs unless you share them", "Whether an answer is appropriate for every context"]} verifyWith="Check important information with your instructor or a trusted source." decisionBelongsTo="You and your educator decide how to use the learning support." />

      <div className="mt-6">
        <LessonComments lessonId={lessonId} />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-6">
        <Link href={`/module/${lesson.moduleId}`}>
          <Button variant="outline" data-testid="button-back-to-module">
            <ArrowLeft className="mr-1 h-4 w-4" /> Module Overview
          </Button>
        </Link>
        <Button
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          data-testid="button-complete-lesson"
        >
          {completeMutation.isPending ? "Completing..." : "Complete Lesson"}
          <CheckCircle2 className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
