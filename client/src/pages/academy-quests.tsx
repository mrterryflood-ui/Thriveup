import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ErrorRetry } from "@/components/error-retry";
import {
  Swords,
  CheckCircle,
  Gift,
  BookOpen,
  Heart,
  Crown,
  TrendingUp,
  Users,
  Zap,
  ExternalLink,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface Quest {
  id: string;
  userId: string;
  questDate: string;
  title: string;
  description: string;
  category: string;
  featureLink: string;
  rewardPoints: number;
  rewardType: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface PantherPowerData {
  id: string;
  userId: string;
  totalScore: number;
  educationScore: number;
  characterScore: number;
  leadershipScore: number;
  entrepreneurshipScore: number;
  communityScore: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  title: string;
  updatedAt: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: typeof BookOpen }> = {
  education: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: BookOpen },
  character: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", icon: Heart },
  leadership: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", icon: Crown },
  entrepreneurship: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: TrendingUp },
  community: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-600 dark:text-violet-400", icon: Users },
};

const CATEGORY_BADGE_VARIANT: Record<string, string> = {
  education: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  character: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  leadership: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  entrepreneurship: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  community: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const CATEGORY_INFO = [
  { key: "education", name: "Education", icon: BookOpen, description: "Complete lessons, quizzes, and curriculum activities to grow your knowledge" },
  { key: "character", name: "Character", icon: Heart, description: "Practice kindness, integrity, and emotional intelligence every day" },
  { key: "leadership", name: "Leadership", icon: Crown, description: "Lead projects, mentor peers, and take initiative in your house" },
  { key: "entrepreneurship", name: "Entrepreneurship", icon: TrendingUp, description: "Build your stock portfolio, manage your wallet, and think like a CEO" },
  { key: "community", name: "Community", icon: Users, description: "Contribute to campus projects, help classmates, and strengthen your house" },
];

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="quests-loading">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export default function AcademyQuestsPage() {
  useEffect(() => { document.title = 'Daily Quests | AI Mastery Academy'; }, []);
  const { data: quests, isLoading: questsLoading, error: questsError, refetch: refetchQuests } = useQuery<Quest[]>({
    queryKey: ["/api/academy/quests"],
  });

  const { data: pantherPower, isLoading: powerLoading } = useQuery<PantherPowerData>({
    queryKey: ["/api/academy/panther-power"],
  });

  const completeMutation = useMutation({
    mutationFn: async (questId: string) => {
      await apiRequest("POST", `/api/academy/quests/${questId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/panther-power"] });
    },
  });

  if (questsLoading || powerLoading) {
    return <LoadingSkeleton />;
  }

  if (questsError) {
    return <div className="p-6"><ErrorRetry message="Failed to load daily quests. Please try again." onRetry={refetchQuests} /></div>;
  }

  const questList = quests ?? [];
  const completedCount = questList.filter((q) => q.completed).length;
  const totalCount = questList.length;
  const totalPoints = questList.reduce((sum, q) => sum + (q.rewardPoints ?? 0), 0);
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const level = pantherPower?.level ?? 1;
  const title = pantherPower?.title ?? "Young Panther";
  const totalScore = pantherPower?.totalScore ?? 0;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="page-academy-quests">
      <PageHeader
        title="Daily Quests"
        description="Complete challenges across the Academy to earn Panther Power"
        breadcrumbs={[
          { label: "Academy", href: "/academy" },
          { label: "Quests" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" data-testid="section-summary">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Progress</span>
            <div className="rounded-md p-1.5 bg-primary/10">
              <Swords className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-quest-progress">
            {completedCount} / {totalCount}
          </p>
          <Progress value={progressPercent} className="h-2 mt-2" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Points Available</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-points">
            {totalPoints.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">total today</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Completed</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-completed-count">
            {completedCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">quests done</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4" data-testid="section-quest-list">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" /> Today's Quests
          </h2>
          {questList.length === 0 ? (
            <Card className="p-8 text-center" data-testid="empty-state-quests">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Quests Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check back soon for new daily quests and challenges.
                </p>
                <Link href="/dashboard">
                  <Button data-testid="button-back-dashboard">Go to Dashboard</Button>
                </Link>
              </div>
            </Card>
          ) : (
            questList.map((quest) => {
              const catStyle = CATEGORY_STYLES[quest.category] ?? CATEGORY_STYLES.education;
              const CatIcon = catStyle.icon;
              const badgeClass = CATEGORY_BADGE_VARIANT[quest.category] ?? CATEGORY_BADGE_VARIANT.education;

              return (
                <Card
                  key={quest.id}
                  className={`p-5 ${quest.completed ? "border-emerald-200 dark:border-emerald-800/50" : ""}`}
                  data-testid={`card-quest-${quest.id}`}
                >
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className={`rounded-md p-2.5 shrink-0 ${catStyle.bg}`}>
                      <CatIcon className={`h-5 w-5 ${catStyle.text}`} />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium" data-testid={`text-quest-title-${quest.id}`}>
                          {quest.title}
                        </h3>
                        <Badge variant="secondary" className={`text-xs no-default-hover-elevate no-default-active-elevate ${badgeClass}`} data-testid={`badge-category-${quest.id}`}>
                          {quest.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3" data-testid={`text-quest-desc-${quest.id}`}>
                        {quest.description}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Gift className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium" data-testid={`text-quest-points-${quest.id}`}>
                            +{quest.rewardPoints} pts
                          </span>
                        </div>
                        {quest.completed && quest.completedAt && (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm" data-testid={`text-completed-at-${quest.id}`}>
                              Completed {new Date(quest.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {quest.completed ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400" data-testid={`status-complete-${quest.id}`}>
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      ) : (
                        <>
                          <Link href={quest.featureLink}>
                            <Button size="sm" variant="outline" data-testid={`button-go-${quest.id}`}>
                              Go <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => completeMutation.mutate(quest.id)}
                            disabled={completeMutation.isPending}
                            data-testid={`button-complete-${quest.id}`}
                          >
                            <CheckCircle className="mr-1 h-3.5 w-3.5" />
                            Mark Complete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div data-testid="section-panther-power">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" /> Panther Power
          </h2>
          <Card className="p-6" data-testid="card-panther-power">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full border-2 border-primary flex flex-col items-center justify-center bg-card mb-3">
                <Zap className="h-5 w-5 text-primary mb-0.5" />
                <p className="text-xl font-bold" data-testid="text-power-score">
                  {parseFloat(String(totalScore)).toLocaleString()}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm mb-1" data-testid="badge-power-title">
                {title}
              </Badge>
              <p className="text-sm text-muted-foreground" data-testid="text-power-level">
                Level {level}
              </p>
              <Link href="/academy/power">
                <Button variant="outline" size="sm" className="mt-4" data-testid="button-view-power">
                  View Full Stats
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div data-testid="section-motivation">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" /> Quest Categories
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Daily quests span five pillars of the Academy. Each category builds a different aspect of your Panther Power, helping you grow into a well-rounded leader.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="section-categories">
          {CATEGORY_INFO.map((cat) => {
            const CatIcon = cat.icon;
            const style = CATEGORY_STYLES[cat.key];
            return (
              <Card key={cat.key} className="p-5" data-testid={`card-category-${cat.key}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-md p-2 shrink-0 ${style?.bg ?? "bg-muted"}`}>
                    <CatIcon className={`h-5 w-5 ${style?.text ?? "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm" data-testid={`text-category-name-${cat.key}`}>{cat.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-category-desc-${cat.key}`}>{cat.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
