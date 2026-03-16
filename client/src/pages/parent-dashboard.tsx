import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star, BookOpen, Trophy, TrendingUp, Flame, Target,
  ChevronRight, Award, CheckCircle2, Clock,
  BarChart3, Lightbulb, GraduationCap, Brain, Users,
  ArrowRight, Sparkles, AlertTriangle
} from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";
import { LEVEL_COLORS, getRankForLevel } from "@/lib/curriculum-data";
import type { StudentProgress, Level, Module, EarnedBadge, Badge as BadgeType } from "@shared/schema";

interface SupportAlert {
  id: string;
  userId: string;
  supportType: string | null;
  createdAt: string;
  energyLevel: number | null;
  stressLevel: number | null;
  moodRating: number | null;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function getContextLine(alert: SupportAlert): string {
  const parts: string[] = [];
  if (alert.moodRating !== null && alert.moodRating <= 3) parts.push("low mood");
  if (alert.energyLevel !== null && alert.energyLevel <= 3) parts.push("low energy");
  if (alert.stressLevel !== null && alert.stressLevel >= 7) parts.push("high stress");
  if (parts.length === 0) {
    if (alert.moodRating !== null) parts.push(`mood: ${alert.moodRating}/10`);
    if (alert.energyLevel !== null) parts.push(`energy: ${alert.energyLevel}/10`);
    if (alert.stressLevel !== null) parts.push(`stress: ${alert.stressLevel}/10`);
  }
  return parts.length > 0 ? `Reported ${parts.join(", ")}` : "Student indicated they need support";
}

interface DashboardData {
  progress: StudentProgress;
  currentLevel: Level;
  currentModule: Module | null;
  recentBadges: Array<EarnedBadge & { badge: BadgeType }>;
  stats: { totalLessons: number; completedLessons: number; totalModules: number; completedModules: number };
}

interface AchievementsData {
  allBadges: BadgeType[];
  earnedBadges: Array<EarnedBadge & { badge: BadgeType }>;
  totalPoints: number;
  currentLevel: number;
}

const subjectAreas = [
  { name: "AI Basics", icon: Brain, color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" },
  { name: "Digital Literacy", icon: GraduationCap, color: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" },
  { name: "Critical Thinking", icon: Lightbulb, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  { name: "Communication", icon: Users, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  { name: "Safety & Ethics", icon: Target, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  { name: "Creative Projects", icon: Sparkles, color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" },
];

function LoadingSkeleton() {

  useEffect(() => { document.title = "Parent Dashboard | ThriveUp Academy"; }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-5 w-96 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function ParentDashboardPage() {
  const { data: dashboardData, isLoading: dashLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const { data: achievementsData, isLoading: achLoading } = useQuery<AchievementsData>({
    queryKey: ["/api/achievements"],
  });

  const { data: supportAlerts } = useQuery<SupportAlert[]>({
    queryKey: ["/api/parent/support-alerts"],
  });

  const isLoading = dashLoading || achLoading;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) return <div className="p-6"><ErrorRetry message="Failed to load parent dashboard. Please try again." onRetry={refetch} /></div>;

  if (!dashboardData) return null;

  const { progress, currentLevel, currentModule, recentBadges, stats } = dashboardData;
  const lessonProgress = stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0;
  const earnedCount = achievementsData?.earnedBadges?.length || 0;
  const totalBadges = achievementsData?.allBadges?.length || 0;

  const subjectProgress = subjectAreas.map((subject, i) => {
    const base = Math.max(0, progress.lessonsCompleted - i * 2);
    const pct = stats.totalLessons > 0 ? Math.min(100, Math.round((base / (stats.totalLessons / subjectAreas.length)) * 100)) : 0;
    return { ...subject, progress: pct };
  });

  const recommendations = [
    currentModule ? {
      title: currentModule.title,
      desc: `Continue where you left off in Level ${progress.currentLevel}`,
      href: `/module/${currentModule.id}`,
      icon: BookOpen,
    } : null,
    {
      title: "Explore AI Curriculum",
      desc: "Browse all 5 mastery levels and find the right fit",
      href: "/curriculum",
      icon: Brain,
    },
    {
      title: "Practice with Spark",
      desc: "Interactive AI companion for guided learning",
      href: "/ai-companion",
      icon: Sparkles,
    },
    {
      title: "View All Subjects",
      desc: "6 core subject areas covering digital literacy",
      href: "/subjects",
      icon: GraduationCap,
    },
  ].filter(Boolean) as Array<{ title: string; desc: string; href: string; icon: typeof BookOpen }>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {supportAlerts && supportAlerts.length > 0 && (
        <Card
          className="mb-6 border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
          data-testid="parent-support-alerts"
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <h2 className="font-semibold text-destructive" data-testid="text-support-alert-title">
                Your child needs support
              </h2>
              <Badge variant="destructive" className="ml-auto">
                {supportAlerts.length} alert{supportAlerts.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="space-y-3">
              {supportAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-md bg-background/80 flex-wrap"
                  data-testid={`support-alert-${alert.id}`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {alert.supportType && (
                        <Badge variant="outline" data-testid={`badge-support-type-${alert.id}`}>
                          {alert.supportType}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground" data-testid={`text-alert-time-${alert.id}`}>
                        {formatRelativeTime(alert.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-alert-context-${alert.id}`}>
                      {getContextLine(alert)}
                    </p>
                  </div>
                  <Link href="/academy/self-assessment">
                    <Button variant="outline" size="sm" data-testid={`button-view-alert-${alert.id}`}>
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <PageHeader
        title="Parent Dashboard"
        description={`Track ${progress.studentName}'s learning progress, scores, and achievements`}
        breadcrumbs={[{ label: "Parents", href: "/parents" }, { label: "Dashboard" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="p-5" data-testid="card-total-points">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Points</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-parent-total-points">{progress.totalPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Earned across all activities</p>
        </Card>

        <Card className="p-5" data-testid="card-lessons-completed">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Lessons Completed</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-parent-lessons-completed">{progress.lessonsCompleted}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.completedLessons} of {stats.totalLessons} in current level</p>
        </Card>

        <Card className="p-5" data-testid="card-quizzes-completed">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Quizzes Completed</span>
            <div className="rounded-md p-1.5 bg-blue-100 dark:bg-blue-900/30">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-parent-quizzes-completed">{progress.quizzesCompleted}</p>
          <p className="text-xs text-muted-foreground mt-1">Assessments passed</p>
        </Card>

        <Card className="p-5" data-testid="card-current-streak">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Current Streak</span>
            <div className="rounded-md p-1.5 bg-orange-100 dark:bg-orange-900/30">
              <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-parent-current-streak">{progress.streakDays} days</p>
          <p className="text-xs text-muted-foreground mt-1">Longest: {progress.longestStreak} days</p>
        </Card>

        <Card className="p-5" data-testid="card-average-score">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Average Score</span>
            <div className="rounded-md p-1.5 bg-violet-100 dark:bg-violet-900/30">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-parent-average-score">{progress.averageScore}%</p>
          <p className="text-xs text-muted-foreground mt-1">Across all quiz attempts</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6" data-testid="card-subject-progress">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Progress by Subject Area
            </h2>
            <div className="space-y-4">
              {subjectProgress.map((subject) => (
                <div key={subject.name} data-testid={`progress-subject-${subject.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-md p-1 ${subject.color.split(' ').slice(0, 2).join(' ')}`}>
                        <subject.icon className={`h-3.5 w-3.5 ${subject.color.split(' ').slice(2).join(' ')}`} />
                      </div>
                      <span className="text-sm font-medium">{subject.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{subject.progress}%</span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6" data-testid="card-current-level-progress">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Current Level Progress
            </h2>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className={`rounded-md p-2.5 bg-gradient-to-br ${LEVEL_COLORS[progress.currentLevel]?.gradient || 'from-violet-500 to-indigo-600'} shrink-0`}>
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="font-medium" data-testid="text-parent-current-level">Level {progress.currentLevel}: {currentLevel.title}</p>
                <p className="text-sm text-muted-foreground">{currentLevel.grades}</p>
              </div>
              <Badge variant="secondary" data-testid="badge-rank">
                {getRankForLevel(progress.currentLevel).title}
              </Badge>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-medium" data-testid="text-parent-level-progress">{Math.round(lessonProgress)}%</span>
            </div>
            <Progress value={lessonProgress} className="h-2.5" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-lg font-bold" data-testid="text-parent-lessons-stat">{stats.completedLessons}/{stats.totalLessons}</p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-lg font-bold" data-testid="text-parent-badges-stat">{earnedCount}/{totalBadges}</p>
                <p className="text-xs text-muted-foreground">Badges Earned</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6" data-testid="card-recent-activity">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Recent Activity
            </h2>
            {recentBadges && recentBadges.length > 0 ? (
              <div className="space-y-3">
                {recentBadges.slice(0, 5).map((eb) => (
                  <div key={eb.id} className="flex items-start gap-3" data-testid={`activity-badge-${eb.id}`}>
                    <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{eb.badge.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{eb.badge.description}</p>
                      {eb.earnedAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(eb.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Complete lessons and quizzes to see activity here.</p>
              </div>
            )}
            <Link href="/achievements">
              <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-view-all-activity">
                View All Achievements <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6" data-testid="card-recommendations">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Recommendations
            </h2>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec) => (
                <Link key={rec.title} href={rec.href}>
                  <Card className="p-3 hover-elevate cursor-pointer" data-testid={`card-rec-${rec.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md p-1.5 bg-primary/10 shrink-0">
                        <rec.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{rec.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{rec.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5" data-testid="card-parent-tips">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Tips for Parents
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">Review progress weekly to stay informed</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">Celebrate milestones and badge achievements</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">Encourage consistent daily learning streaks</p>
              </div>
            </div>
            <Link href="/parents">
              <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-parent-resources">
                Parent Resources <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
