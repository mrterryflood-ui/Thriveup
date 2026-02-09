import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award, Star, Shield, Zap, Crown,
  CheckCircle2, Lock
} from "lucide-react";
import { BADGE_RARITY_COLORS } from "@/lib/curriculum-data";
import type { Badge as BadgeType, EarnedBadge } from "@shared/schema";

interface AchievementsData {
  allBadges: BadgeType[];
  earnedBadges: Array<EarnedBadge & { badge: BadgeType }>;
  totalPoints: number;
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

  const { allBadges, earnedBadges, totalPoints } = data;
  const earnedIds = new Set(earnedBadges.map((eb) => eb.badgeId));

  const categories = Array.from(new Set(allBadges.map((b) => b.category)));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-achievements-heading">Achievements</h1>
        <p className="text-muted-foreground">
          Collect badges by mastering skills, demonstrating character, and hitting milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
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
