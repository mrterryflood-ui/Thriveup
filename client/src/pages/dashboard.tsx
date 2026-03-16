import { useEffect } from "react";
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
  ChevronRight, Award, Flame, TrendingUp,
  CheckCircle2, Shield, ShieldCheck, ShieldPlus, Swords, Medal,
  Sparkles, GraduationCap, Briefcase, Users, BarChart3, Circle,
} from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";
import { LEVEL_COLORS, getRankForLevel, ALL_RANKS } from "@/lib/curriculum-data";
import type { StudentProgress, Level, Module, EarnedBadge, Badge as BadgeType } from "@shared/schema";

const levelIcons = [Compass, Map, Building2, Lightbulb, Crown];
const rankIcons: Record<string, typeof Shield> = {
  Shield, ShieldCheck, ShieldPlus, Swords, Medal,
};

function RankDisplay({ level, size = "lg" }: { level: number; size?: "sm" | "lg" }) {
  const rank = getRankForLevel(level);
  const RankIcon = rankIcons[rank.icon] || Shield;
  const isGeneral = rank.stars > 0;

  return (
    <div className="flex items-center gap-2.5">
      <div className={`rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 ${size === "lg" ? "w-11 h-11" : "w-8 h-8"}`}>
        <RankIcon className={`text-white ${size === "lg" ? "h-6 w-6" : "h-4 w-4"}`} />
      </div>
      <div>
        <p className={`font-bold leading-tight ${size === "lg" ? "text-lg" : "text-sm"}`}>{rank.title}</p>
        {isGeneral && (
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: rank.stars }).map((_, i) => (
              <Star key={i} className={`fill-amber-500 text-amber-500 ${size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardData {
  progress: StudentProgress;
  currentLevel: Level;
  currentModule: Module | null;
  recentBadges: Array<EarnedBadge & { badge: BadgeType }>;
  stats: { totalLessons: number; completedLessons: number; totalModules: number; completedModules: number };
}

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard | ThriveUp Academy";
  }, []);

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4" data-testid="dashboard-loading-skeleton">
        <Skeleton className="h-10 sm:h-12 w-48 mb-2" data-testid="skeleton-dashboard-title" />
        <Skeleton className="h-5 sm:h-6 w-72 mb-6 sm:mb-8" data-testid="skeleton-dashboard-subtitle" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="skeleton-dashboard-stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3 sm:p-5 space-y-3" data-testid={`skeleton-stat-card-${i}`}>
              <div className="flex items-center justify-between gap-1">
                <Skeleton className="h-4 w-20" data-testid={`skeleton-stat-label-${i}`} />
                <Skeleton className="h-8 w-8 rounded-md" data-testid={`skeleton-stat-icon-${i}`} />
              </div>
              <Skeleton className="h-7 w-16" data-testid={`skeleton-stat-value-${i}`} />
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 mt-4" data-testid="skeleton-dashboard-content" />
      </div>
    );
  }

  if (error) return <div className="p-6"><ErrorRetry message="Failed to load dashboard. Please try again." onRetry={refetch} /></div>;

  if (!data) return null;

  const { progress, currentLevel, currentModule, recentBadges, stats } = data;
  const LevelIcon = levelIcons[(progress.currentLevel - 1) % 5];
  const colors = LEVEL_COLORS[progress.currentLevel];
  const lessonProgress = stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0;

  const isNewUser = progress.totalPoints === 0 && stats.completedLessons === 0;
  const checklistItems = [
    { label: "Take the Campus Tour", done: false, link: "/academy" },
    { label: "Explore your first subject", done: stats.completedLessons > 0, link: "/subjects" },
    { label: "Complete a curriculum lesson", done: stats.completedLessons > 0, link: "/curriculum" },
    { label: "Chat with Spark AI companion", done: progress.totalPoints > 0, link: "/ai-companion" },
    { label: "Explore career pathways", done: false, link: "/academy/careers" },
    { label: "Try the AI Creation Studio", done: false, link: "/ai-tools" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader
        title={`Welcome back, ${progress.studentName}!`}
        description="ThriveUp Academy — Keep exploring and growing!"
      />

      {isNewUser && (
        <Card className="p-4 sm:p-6 mb-6 border-primary/20 bg-primary/5" data-testid="card-getting-started">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Getting Started
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Complete these steps to get the most out of the academy:</p>
          <div className="space-y-2">
            {checklistItems.map((item, i) => (
              <Link key={i} href={item.link}>
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" data-testid={`checklist-item-${i}`}>
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm ${item.done ? 'text-muted-foreground line-through' : 'font-medium'}`}>{item.label}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
            <span className="text-xs sm:text-sm text-muted-foreground">Total Points</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold" data-testid="text-total-points">{progress.totalPoints.toLocaleString()}</p>
        </Card>

        <Card className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
            <span className="text-xs sm:text-sm text-muted-foreground">Current Rank</span>
            <div className="rounded-md p-1.5 bg-gradient-to-br from-amber-500 to-orange-600">
              {(() => {
                const rank = getRankForLevel(progress.currentLevel);
                const RIcon = rankIcons[rank.icon] || Shield;
                return <RIcon className="h-4 w-4 text-white" />;
              })()}
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold truncate" data-testid="text-current-rank">{getRankForLevel(progress.currentLevel).title}</p>
          {getRankForLevel(progress.currentLevel).stars > 0 && (
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: getRankForLevel(progress.currentLevel).stars }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
            <span className="text-xs sm:text-sm text-muted-foreground">Lessons Done</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold" data-testid="text-lessons-done">{progress.lessonsCompleted}</p>
        </Card>

        <Card className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1">
            <span className="text-xs sm:text-sm text-muted-foreground">Avg Score</span>
            <div className="rounded-md p-1.5 bg-violet-100 dark:bg-violet-900/30">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold" data-testid="text-avg-score">{progress.averageScore}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
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
                <Link href={`/module/${currentModule.id}`} aria-label={`Continue module: ${currentModule.title}`}>
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

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 flex-wrap">
              <h2 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/subjects" data-testid="link-quick-subjects" aria-label="Navigate to Subjects">
                <Card className="p-4 hover-elevate cursor-pointer">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Subjects</p>
                      <p className="text-xs text-muted-foreground">6 core subject areas</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/ai-companion" data-testid="link-quick-spark" aria-label="Navigate to Ask Spark AI companion">
                <Card className="p-4 hover-elevate cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Ask Spark</p>
                      <p className="text-xs text-muted-foreground">Your AI mastery companion</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/curriculum" data-testid="link-quick-curriculum" aria-label="Navigate to AI Mastery Curriculum">
                <Card className="p-4 hover-elevate cursor-pointer">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">AI Mastery Curriculum</p>
                      <p className="text-xs text-muted-foreground">5 mastery levels</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link href="/achievements" data-testid="link-quick-achievements" aria-label="Navigate to Achievements">
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

        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
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

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" /> Rank Progression
            </h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const rank = getRankForLevel(lvl);
                const RIcon = rankIcons[rank.icon] || Shield;
                const c = LEVEL_COLORS[lvl];
                const isActive = lvl === progress.currentLevel;
                const isCompleted = lvl < progress.currentLevel;
                return (
                  <div key={lvl} className={`flex items-center gap-3 p-2 rounded-md ${isActive ? 'bg-primary/10' : ''}`}>
                    <div className={`rounded-md p-1.5 ${isCompleted || isActive ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-muted'} shrink-0`}>
                      <RIcon className={`h-4 w-4 ${isCompleted || isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!isCompleted && !isActive ? 'text-muted-foreground' : ''}`}>
                        {rank.title}
                      </p>
                      <p className="text-xs text-muted-foreground">Level {lvl}</p>
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
