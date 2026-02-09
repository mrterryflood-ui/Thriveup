import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, BookOpen, Clock, Target, Sparkles,
  ChevronRight, CheckCircle2, PlayCircle, MessageCircle
} from "lucide-react";
import type { Module, Lesson } from "@shared/schema";

export default function ModuleDetailPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId || "";

  const { data: mod, isLoading: modLoading } = useQuery<Module>({
    queryKey: ["/api/modules", moduleId],
  });

  const { data: moduleLessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/modules", moduleId, "lessons"],
  });

  const isLoading = modLoading || lessonsLoading;

  if (isLoading) {
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
      <Link href={`/curriculum/${mod.levelId}`}>
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-level">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Level
        </Button>
      </Link>

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
          <ul className="space-y-2">
            {mod.activities.map((act, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <PlayCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{act}</span>
              </li>
            ))}
          </ul>
        </Card>
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

      <div className="mt-8">
        <Link href={`/quiz/${moduleId}`}>
          <Button className="w-full" size="lg" data-testid="button-take-quiz">
            <CheckCircle2 className="mr-2 h-5 w-5" /> Take Module Quiz
          </Button>
        </Link>
      </div>
    </div>
  );
}
