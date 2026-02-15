import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Heart,
  Crown,
  TrendingUp,
  Users,
  Flame,
  Zap,
  Star,
  Trophy,
  Target,
  Coins,
} from "lucide-react";

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

const CATEGORIES = [
  { key: "educationScore" as const, name: "Education", icon: BookOpen, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-400" },
  { key: "characterScore" as const, name: "Character", icon: Heart, bg: "bg-rose-100 dark:bg-rose-900/30", color: "text-rose-600 dark:text-rose-400" },
  { key: "leadershipScore" as const, name: "Leadership", icon: Crown, bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600 dark:text-amber-400" },
  { key: "entrepreneurshipScore" as const, name: "Entrepreneurship", icon: TrendingUp, bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600 dark:text-emerald-400" },
  { key: "communityScore" as const, name: "Community", icon: Users, bg: "bg-violet-100 dark:bg-violet-900/30", color: "text-violet-600 dark:text-violet-400" },
];

const LEVEL_TITLES = [
  { level: 1, title: "Young Panther" },
  { level: 2, title: "Rising Panther" },
  { level: 3, title: "Bold Panther" },
  { level: 4, title: "Elite Panther" },
  { level: 5, title: "Panther Leader" },
  { level: 6, title: "Panther Champion" },
  { level: 7, title: "Panther Legend" },
];

const EARN_METHODS = [
  { name: "Daily Quests", description: "Complete daily learning challenges to earn steady power points", icon: Target },
  { name: "Merit Events", description: "Earn recognition through character, leadership, and academic excellence", icon: Star },
  { name: "Competition Wins", description: "Place in Academy competitions to earn bonus power points", icon: Trophy },
  { name: "Stock Market Activity", description: "Grow your portfolio through smart investing decisions", icon: Coins },
];

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="flex justify-center">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
    </div>
  );
}

export default function AcademyPowerPage() {
  const { data, isLoading } = useQuery<PantherPowerData>({
    queryKey: ["/api/academy/panther-power"],
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const totalScore = data?.totalScore ?? 0;
  const educationScore = data?.educationScore ?? 0;
  const characterScore = data?.characterScore ?? 0;
  const leadershipScore = data?.leadershipScore ?? 0;
  const entrepreneurshipScore = data?.entrepreneurshipScore ?? 0;
  const communityScore = data?.communityScore ?? 0;
  const currentStreak = data?.currentStreak ?? 0;
  const longestStreak = data?.longestStreak ?? 0;
  const level = data?.level ?? 1;
  const title = data?.title ?? "Young Panther";

  const scores: Record<string, number> = {
    educationScore,
    characterScore,
    leadershipScore,
    entrepreneurshipScore,
    communityScore,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="page-academy-power">
      <div className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 p-8 mb-8" data-testid="section-hero">
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-power-title">
          Panther Power Score
        </h1>
        <p className="text-rose-100 text-lg" data-testid="text-power-subtitle">
          Your unified empowerment metric across all Academy activities
        </p>
      </div>

      <div className="flex flex-col items-center mb-8" data-testid="section-total-score">
        <div className="w-44 h-44 rounded-full border-4 border-primary flex flex-col items-center justify-center bg-card mb-4">
          <Zap className="h-6 w-6 text-primary mb-1" />
          <p className="text-4xl font-bold" data-testid="text-total-score">
            {parseFloat(String(totalScore)).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Power Score</p>
        </div>
        <Badge variant="secondary" className="text-sm" data-testid="badge-title">
          {title}
        </Badge>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-level">
          Level {level}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Category Scores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="section-categories">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const score = scores[cat.key] ?? 0;
            const progress = Math.min((parseFloat(String(score)) / 200) * 100, 100);

            return (
              <Card key={cat.key} className="p-5" data-testid={`card-category-${cat.name.toLowerCase()}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-md p-2 shrink-0 ${cat.bg}`}>
                    <CatIcon className={`h-5 w-5 ${cat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm">{cat.name}</h3>
                  </div>
                </div>
                <p className="text-2xl font-bold mb-2" data-testid={`text-score-${cat.name.toLowerCase()}`}>
                  {parseFloat(String(score)).toLocaleString()}
                </p>
                <Progress value={progress} className="h-2 mb-1" />
                <p className="text-xs text-muted-foreground text-right">{parseFloat(String(score)).toLocaleString()} / 200</p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" /> Streaks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="section-streaks">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-md p-2 bg-orange-100 dark:bg-orange-900/30 shrink-0">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-muted-foreground">Current Streak</span>
            </div>
            <p className="text-3xl font-bold" data-testid="text-current-streak">
              {currentStreak} <span className="text-base font-normal text-muted-foreground">days</span>
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-md p-2 bg-red-100 dark:bg-red-900/30 shrink-0">
                <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm text-muted-foreground">Longest Streak</span>
            </div>
            <p className="text-3xl font-bold" data-testid="text-longest-streak">
              {longestStreak} <span className="text-base font-normal text-muted-foreground">days</span>
            </p>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" /> Level Progression
        </h2>
        <Card className="p-6" data-testid="section-levels">
          <div className="space-y-3">
            {LEVEL_TITLES.map((lt) => {
              const isCurrent = lt.level === level;
              const isAchieved = lt.level <= level;
              return (
                <div
                  key={lt.level}
                  className={`flex items-center gap-3 p-3 rounded-md ${isCurrent ? "bg-primary/10 ring-1 ring-primary/30" : isAchieved ? "bg-muted/30" : ""}`}
                  data-testid={`level-row-${lt.level}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isAchieved ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {lt.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isCurrent ? "text-primary" : ""}`}>{lt.title}</p>
                  </div>
                  {isCurrent && (
                    <Badge variant="default" className="shrink-0">Current</Badge>
                  )}
                  {isAchieved && !isCurrent && (
                    <Badge variant="secondary" className="shrink-0">Achieved</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" /> How to Earn Power
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="section-earn-power">
          {EARN_METHODS.map((method) => {
            const MethodIcon = method.icon;
            return (
              <Card key={method.name} className="p-5" data-testid={`card-earn-${method.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md p-2 bg-primary/10 shrink-0">
                    <MethodIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm">{method.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
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