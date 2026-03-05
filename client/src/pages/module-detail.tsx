import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  BookOpen, Clock, Target, Sparkles,
  ChevronRight, CheckCircle2, PlayCircle, MessageCircle, FileText, Gamepad2, Home
} from "lucide-react";
import type { Module, Lesson } from "@shared/schema";
import StudyTips from "@/components/study-tips";

function findBestLessonForActivity(activity: string, lessons: Lesson[]): Lesson | null {
  if (!lessons || lessons.length === 0) return null;
  const actLower = activity.toLowerCase();
  const actWords = actLower.split(/[\s:,\-()]+/).filter(w => w.length > 3);
  let bestLesson: Lesson | null = null;
  let bestScore = 0;
  for (const lesson of lessons) {
    const titleLower = lesson.title.toLowerCase();
    let score = 0;
    for (const word of actWords) {
      if (titleLower.includes(word)) score += 2;
    }
    if (lesson.activityType) {
      const typeLower = lesson.activityType.toLowerCase();
      if (actLower.includes("sort") && typeLower.includes("sort")) score += 3;
      if (actLower.includes("hunt") && (typeLower.includes("explor") || typeLower.includes("discovery"))) score += 3;
      if (actLower.includes("creat") && typeLower.includes("creat")) score += 3;
      if (actLower.includes("practice") && typeLower.includes("practice")) score += 3;
      if (actLower.includes("game") && typeLower.includes("interactive")) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLesson = lesson;
    }
  }
  return bestLesson;
}

function isSparkActivity(activity: string): boolean {
  const lower = activity.toLowerCase();
  return lower.includes("talk to alex") || lower.includes("voice/chat") ||
    lower.includes("chat interaction") || lower.includes("ask an adult") ||
    lower.includes("ask ai");
}

export default function ModuleDetailPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId || "";
  const [, setLocation] = useLocation();

  const { data: mod, isLoading: modLoading } = useQuery<Module>({
    queryKey: ["/api/modules", moduleId],
  });

  const { data: moduleLessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/modules", moduleId, "lessons"],
  });

  const isLoading = modLoading || lessonsLoading;

  if (isLoading) {
  
  useEffect(() => { document.title = "Module | AI Mastery Academy"; }, []);
  return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!mod) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb className="mb-6" data-testid="breadcrumb-module">
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
              <Link href={`/curriculum/${mod.levelId}`} data-testid="breadcrumb-level">Level</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage data-testid="breadcrumb-current">{mod.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">Module {mod.moduleNumber}</Badge>
        <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-module-title">{mod.title}</h1>
        <p className="text-muted-foreground">{mod.description}</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {mod.durationWeeks} weeks
          </span>
        </div>
      </div>

      {mod.storyArcTitle && (
        <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Story Arc: {mod.storyArcTitle}</h3>
              {mod.storyArcNarrative && (
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.storyArcNarrative}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Learning Objectives
          </h3>
          <ul className="space-y-2">
            {mod.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{obj}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Activities
          </h3>
          <ul className="space-y-1.5">
            {mod.activities.map((act, i) => {
              const isSpark = isSparkActivity(act);
              const matchedLesson = !isSpark ? findBestLessonForActivity(act, moduleLessons || []) : null;
              const activityName = act.includes(":") ? act.split(":")[0].trim() : act;
              const activityDesc = act.includes(":") ? act.split(":").slice(1).join(":").trim() : "";

              function handleClick() {
                if (isSpark) {
                  setLocation("/ai-companion");
                } else if (matchedLesson) {
                  setLocation(`/lesson/${matchedLesson.id}`);
                } else if (moduleLessons && moduleLessons.length > 0) {
                  setLocation(`/lesson/${moduleLessons[0].id}`);
                }
              }

              return (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm rounded-md p-2 cursor-pointer hover-elevate group"
                  onClick={handleClick}
                  data-testid={`button-activity-${i}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
                >
                  <PlayCircle className="h-4 w-4 text-accent shrink-0" />
                  <span className="flex-1 min-w-0">
                    {activityDesc ? (
                      <>
                        <span className="font-medium text-foreground">{activityName}:</span>{" "}
                        <span className="text-muted-foreground">{activityDesc}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{act}</span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mb-8">
        <StudyTips moduleId={moduleId} />
      </div>

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> Lessons
      </h2>

      <div className="space-y-3">
        {moduleLessons?.map((lesson) => (
          <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
            <Card className="p-5 hover-elevate cursor-pointer group" data-testid={`card-lesson-${lesson.id}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="rounded-md flex items-center justify-center w-10 h-10 bg-primary/10 font-bold text-sm text-primary shrink-0">
                  {lesson.lessonNumber}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-semibold">{lesson.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {lesson.durationMinutes} min
                    </span>
                    {lesson.activityType && (
                      <Badge variant="outline" className="text-xs">{lesson.activityType}</Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {moduleId === "level_1_module_2" && (
          <Link href="/module-1-2-tools">
            <Button variant="outline" className="w-full bg-gradient-to-r from-primary/10 to-accent/10" size="lg" data-testid="button-interactive-tools">
              <Gamepad2 className="mr-2 h-5 w-5" /> Interactive Tools: Talking to AI
            </Button>
          </Link>
        )}
        <Link href={`/quiz/${moduleId}`}>
          <Button className="w-full" size="lg" data-testid="button-take-quiz">
            <CheckCircle2 className="mr-2 h-5 w-5" /> Take Module Quiz
          </Button>
        </Link>
        <Link href={`/curriculum-documents?module=${moduleId}`}>
          <Button variant="outline" className="w-full" size="lg" data-testid="button-view-curriculum-docs">
            <FileText className="mr-2 h-5 w-5" /> View Curriculum Documents
          </Button>
        </Link>
      </div>
    </div>
  );
}
