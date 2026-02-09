import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Compass, Map, Building2, Lightbulb, Crown,
  BookOpen, Clock, Target, ChevronRight, ArrowLeft,
  GraduationCap, Sparkles, CheckCircle2
} from "lucide-react";
import { LEVEL_COLORS } from "@/lib/curriculum-data";
import type { Level, Module } from "@shared/schema";

const levelIcons = [Compass, Map, Building2, Lightbulb, Crown];

export default function CurriculumPage() {
  const { data: levels, isLoading } = useQuery<Level[]>({
    queryKey: ["/api/levels"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64 mb-8" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-curriculum-heading">Curriculum</h1>
        <p className="text-muted-foreground">
          5 progressive mastery levels spanning K-12, each with capstone projects and parent teachbacks.
        </p>
      </div>

      <div className="space-y-4">
        {levels?.map((level) => {
          const Icon = levelIcons[(level.id - 1) % 5];
          const colors = LEVEL_COLORS[level.id];
          return (
            <Link key={level.id} href={`/curriculum/${level.id}`}>
              <Card className="p-6 hover-elevate cursor-pointer group" data-testid={`card-curriculum-level-${level.id}`}>
                <div className="flex items-start gap-5 flex-wrap">
                  <div className={`rounded-md p-3 bg-gradient-to-br ${colors.gradient} shrink-0`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-lg font-semibold">Level {level.id}: {level.title}</h2>
                      <Badge variant="outline" className="text-xs">{level.grades}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {level.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> {level.theme}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0 mt-2" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function LevelDetailPage() {
  const params = useParams<{ levelId: string }>();
  const levelId = parseInt(params.levelId || "1");

  const { data: level, isLoading: levelLoading } = useQuery<Level>({
    queryKey: ["/api/levels", levelId],
  });

  const { data: levelModules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/levels", levelId, "modules"],
  });

  const isLoading = levelLoading || modulesLoading;
  const Icon = levelIcons[(levelId - 1) % 5];
  const colors = LEVEL_COLORS[levelId];

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!level) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/curriculum">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-curriculum">
          <ArrowLeft className="mr-1 h-4 w-4" /> All Levels
        </Button>
      </Link>

      <Card className={`p-8 mb-8 bg-gradient-to-br ${colors.gradient} text-white border-none`}>
        <div className="flex items-start gap-5 flex-wrap">
          <div className="rounded-md p-3 bg-white/20 shrink-0">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Badge className="mb-2 bg-white/20 text-white border-white/30">{level.grades}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Level {level.id}: {level.title}</h1>
            <p className="text-white/80 text-sm mb-3">{level.subtitle}</p>
            <p className="text-white/70 text-sm leading-relaxed">{level.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-white/70 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {level.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" /> {level.theme}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> Modules
      </h2>

      <div className="space-y-3">
        {levelModules?.map((mod) => (
          <Link key={mod.id} href={`/module/${mod.id}`}>
            <Card className="p-5 hover-elevate cursor-pointer group" data-testid={`card-module-${mod.id}`}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className={`rounded-md flex items-center justify-center w-10 h-10 font-bold text-sm ${colors.badge} shrink-0`}>
                  {mod.moduleNumber}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-semibold mb-1">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{mod.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {mod.durationWeeks} weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" /> {mod.learningObjectives.length} objectives
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> {mod.activities.length} activities
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6 mt-8">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" /> Level Requirements
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" /> 70% knowledge check score to unlock next module</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" /> 1 capstone project demonstrating real-world application</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" /> 1 parent teachback (student explains key concepts to family)</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" /> Final assessment (80% required to advance levels)</li>
        </ul>
      </Card>
    </div>
  );
}
