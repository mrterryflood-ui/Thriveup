import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award, Star, Zap, Crown,
  CheckCircle2, Lock,
  Shield, ShieldCheck, ShieldPlus, Swords, Medal
} from "lucide-react";
import { BADGE_RARITY_COLORS, getRankForLevel, ALL_RANKS } from "@/lib/curriculum-data";
import type { Badge as BadgeType, EarnedBadge } from "@shared/schema";

const rankIcons: Record<string, typeof Shield> = {
  Shield, ShieldCheck, ShieldPlus, Swords, Medal,
};

interface AchievementsData {
  allBadges: BadgeType[];
  earnedBadges: Array<EarnedBadge & { badge: BadgeType }>;
  totalPoints: number;
  currentLevel: number;
}

const categoryIcons: Record<string, typeof Award> = {
  skill: Zap,
  character: Shield,
  milestone: Crown,
};

const rarityLabels: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

export default function AchievementsPage() {
  const { data, isLoading } = useQuery<AchievementsData>({
    queryKey: ["/api/achievements"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-72 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { allBadges, earnedBadges, totalPoints, currentLevel } = data;
  const earnedIds = new Set(earnedBadges.map((eb) => eb.badgeId));
  const currentRank = getRankForLevel(currentLevel);
  const CurrentRankIcon = rankIcons[currentRank.icon] || Shield;

  const categories = Array.from(new Set(allBadges.map((b) => b.category)));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-achievements-heading">Achievements</h1>
        <p className="text-muted-foreground">
          Collect badges, earn ranks, and track your mastery progress.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
        <Card className="p-5 text-center">
          <div className="w-10 h-10 rounded-md mx-auto mb-2 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <CurrentRankIcon className="h-5 w-5 text-white" />
          </div>
          <p className="text-lg font-bold" data-testid="text-current-rank">{currentRank.title}</p>
          {currentRank.stars > 0 && (
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {Array.from({ length: currentRank.stars }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Current Rank</p>
        </Card>
        <Card className="p-5 text-center">
          <Star className="h-6 w-6 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold" data-testid="text-achievement-points">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Points</p>
        </Card>
        <Card className="p-5 text-center">
          <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold" data-testid="text-badges-earned">{earnedBadges.length}</p>
          <p className="text-xs text-muted-foreground">Badges Earned</p>
        </Card>
        <Card className="p-5 text-center">
          <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold">{allBadges.length > 0 ? Math.round((earnedBadges.length / allBadges.length) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </Card>
      </div>

      <Card className="p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-500" /> Rank Progression
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const rank = getRankForLevel(lvl);
            const RIcon = rankIcons[rank.icon] || Shield;
            const isActive = lvl === currentLevel;
            const isCompleted = lvl < currentLevel;
            const rankLabels = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];
            return (
              <div
                key={lvl}
                className={`flex flex-col items-center p-4 rounded-md border ${
                  isActive ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' :
                  isCompleted ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10' :
                  'border-border'
                }`}
                data-testid={`rank-level-${lvl}`}
              >
                <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-2 ${
                  isCompleted || isActive
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-muted'
                }`}>
                  <RIcon className={`h-6 w-6 ${isCompleted || isActive ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <p className={`text-sm font-semibold ${!isCompleted && !isActive ? 'text-muted-foreground' : ''}`}>
                  {rank.title}
                </p>
                <p className="text-xs text-muted-foreground">{rankLabels[lvl - 1]}</p>
                {isActive && <Badge variant="secondary" className="text-xs mt-2">Current</Badge>}
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-2" />}
              </div>
            );
          })}
        </div>
      </Card>

      {categories.map((category) => {
        const CategoryIcon = categoryIcons[category] || Award;
        const categoryBadges = allBadges.filter((b) => b.category === category);

        return (
          <div key={category} className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 capitalize">
              <CategoryIcon className="h-5 w-5 text-primary" /> {category} Badges
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryBadges.map((badge) => {
                const isEarned = earnedIds.has(badge.id);
                const borderColor = BADGE_RARITY_COLORS[badge.rarity] || BADGE_RARITY_COLORS.common;
                return (
                  <Card
                    key={badge.id}
                    className={`p-5 text-center border-2 ${borderColor} ${!isEarned ? 'opacity-50' : ''}`}
                    data-testid={`card-badge-${badge.id}`}
                  >
                    <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      isEarned
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                        : 'bg-muted'
                    }`}>
                      {isEarned ? (
                        <Award className="h-7 w-7 text-white" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-semibold text-sm mb-1">{badge.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{badge.description}</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{rarityLabels[badge.rarity]}</Badge>
                      <Badge variant="secondary" className="text-xs">Lvl {badge.levelRequirement}+</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
