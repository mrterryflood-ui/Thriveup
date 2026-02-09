import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Compass, Map, Building2, Lightbulb, Crown,
  BookOpen, Trophy, Star, Zap, Target,
  ChevronRight, Award, Flame, TrendingUp
} from "lucide-react";
import { LEVEL_COLORS } from "@/lib/curriculum-data";
import type { StudentProgress, Level, Module, EarnedBadge, Badge as BadgeType } from "@shared/schema";

const levelIcons = [Compass, Map, Building2, Lightbulb, Crown];

interface DashboardData {
  progress: StudentProgress;
  currentLevel: Level;
  currentModule: Module | null;
  recentBadges: Array<EarnedBadge & { badge: BadgeType }>;
  stats: { totalLessons: number; completedLessons: number; totalModules: number; completedModules: number };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-12 w-48 mb-2" />
        <Skeleton className="h-6 w-72 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 mt-4" />
      </div>
    );
  }

  if (!data) return null;

  const { progress, currentLevel, currentModule, recentBadges, stats } = data;
  const LevelIcon = levelIcons[(progress.currentLevel - 1) % 5];
  const colors = LEVEL_COLORS[progress.currentLevel];
  const lessonProgress = stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" data-testid="text-dashboard-greeting">
          Welcome back, {progress.studentName}!
        </h1>
        <p className="text-muted-foreground">
          Continue your AI Mastery journey. You're doing great!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Points</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-points">{progress.totalPoints.toLocaleString()}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Current Level</span>
            <div className={`rounded-md p-1.5 bg-gradient-to-br ${colors.gradient}`}>
              <LevelIcon className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-current-level">{currentLevel.title}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Lessons Done</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-lessons-done">{progress.lessonsCompleted}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Avg Score</span>
            <div className="rounded-md p-1.5 bg-violet-100 dark:bg-violet-900/30">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-avg-score">{progress.averageScore}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" /> Current Progress
            </h2>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className={`rounded-md p-2.5 bg-gradient-to-br ${colors.gradient} shrink-0`}>
                <LevelIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="font-medium">Level {progress.currentLevel}: {currentLevel.title}</p>
                <p className="text-sm text-muted-foreground">{currentLevel.grades}</p>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(lessonProgress)}%</span>
            </div>
            <Progress value={lessonProgress} className="h-2.5 mb-6" />

            {currentModule ? (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Continue Where You Left Off</h3>
                <Link href={`/module/${currentModule.id}`}>
                  <Card className="p-4 hover-elevate cursor-pointer group border-primary/20">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`rounded-md flex items-center justify-center w-9 h-9 ${colors.badge} font-bold text-sm shrink-0`}>
                        {currentModule.moduleNumber}
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <p className="font-medium text-sm">{currentModule.title}</p>
                        <p className="text-xs text-muted-foreground">{currentModule.durationWeeks} weeks</p>
                      </div>
                      <Button size="sm" data-testid="button-continue-module">
                        Continue <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Ready to start your next module?</p>
                <Link href="/curriculum">
                  <Button size="sm" data-testid="button-browse-curriculum">
                    Browse Curriculum <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/curriculum">
                <Card className="p-4 hover-elevate cursor-pointer">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Browse Curriculum</p>
                      <p className="text-xs text-muted-foreground">Explore all 5 levels</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/achievements">
                <Card className="p-4 hover-elevate cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Achievements</p>
                      <p className="text-xs text-muted-foreground">View your badges</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Recent Badges
            </h2>
            {recentBadges && recentBadges.length > 0 ? (
              <div className="space-y-3">
                {recentBadges.slice(0, 5).map((eb) => (
                  <div key={eb.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{eb.badge.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{eb.badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Award className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Complete lessons and quizzes to earn badges!</p>
              </div>
            )}
            <Link href="/achievements">
              <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-view-all-badges">
                View All Badges
              </Button>
            </Link>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Level Journey
            </h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const LIcon = levelIcons[(lvl - 1) % 5];
                const c = LEVEL_COLORS[lvl];
                const isActive = lvl === progress.currentLevel;
                const isCompleted = lvl < progress.currentLevel;
                return (
                  <div key={lvl} className={`flex items-center gap-3 p-2 rounded-md ${isActive ? 'bg-primary/10' : ''}`}>
                    <div className={`rounded-md p-1.5 ${isCompleted || isActive ? `bg-gradient-to-br ${c.gradient}` : 'bg-muted'} shrink-0`}>
                      <LIcon className={`h-4 w-4 ${isCompleted || isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!isCompleted && !isActive ? 'text-muted-foreground' : ''}`}>
                        Level {lvl}
                      </p>
                    </div>
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                    {isActive && <Badge variant="secondary" className="text-xs shrink-0">Current</Badge>}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2Icon(props: any) {
  return <CheckCircle2 {...props} />;
}
