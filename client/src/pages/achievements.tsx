import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import {
  Award, Star, Zap, Crown,
  CheckCircle2, Lock,
  Shield, ShieldCheck, ShieldPlus, Swords, Medal,
  Filter, Heart,
} from "lucide-react";
import { BADGE_RARITY_COLORS, getRankForLevel } from "@/lib/curriculum-data";
import { ErrorRetry } from "@/components/error-retry";
import { BadgeIcon } from "@/components/badge-icon";
import { CelebrationOverlay, useCelebration } from "@/components/celebration";
import type { Badge as BadgeType, EarnedBadge } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  character: Heart,
  milestone: Crown,
};

const rarityLabels: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

const categoryLabels: Record<string, string> = {
  skill: "Skill",
  character: "Character",
  milestone: "Milestone",
};

export default function AchievementsPage() {
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const { state: celebrationState, celebrate, dismiss } = useCelebration();

  const { data, isLoading, error, refetch } = useQuery<AchievementsData>({
    queryKey: ["/api/achievements"],
  });

  useEffect(() => { document.title = "Achievements | ThriveUp"; }, []);

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

  if (error) return <div className="p-6"><ErrorRetry message="Failed to load achievements. Please try again." onRetry={refetch} /></div>;

  if (!data || (data.allBadges.length === 0 && data.earnedBadges.length === 0)) return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Achievements" description="Your badges, credentials, and milestones" />
      <Card className="p-8 text-center mt-6" data-testid="card-empty-achievements">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2" data-testid="text-no-achievements">Your Achievement Journey Starts Here</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Complete lessons, quizzes, and activities to earn badges and credentials. Every achievement is verifiable and aligned to workforce readiness standards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <Zap className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Skill Badges</p>
            <p className="text-xs text-muted-foreground">Earn by completing modules</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Character Badges</p>
            <p className="text-xs text-muted-foreground">Demonstrate leadership & growth</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <Crown className="h-6 w-6 text-violet-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Milestone Badges</p>
            <p className="text-xs text-muted-foreground">Hit major career milestones</p>
          </div>
        </div>
        <a href="/subjects" data-testid="link-start-learning" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
          <Star className="h-4 w-4" /> Start Learning to Earn Badges
        </a>
      </Card>
    </div>
  );

  const { allBadges, earnedBadges, totalPoints, currentLevel } = data;
  const earnedIds = new Set(earnedBadges.map((eb) => eb.badgeId));
  const currentRank = getRankForLevel(currentLevel);
  const CurrentRankIcon = rankIcons[currentRank.icon] || Shield;

  const categories = Array.from(new Set(allBadges.map((b) => b.category)));

  const filterBadges = (badgeList: BadgeType[]) => {
    if (rarityFilter === "all") return badgeList;
    return badgeList.filter((b) => b.rarity === rarityFilter);
  };

  const earnedCount = earnedBadges.length;
  const totalCount = allBadges.length;
  const completionPct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const renderBadgeGrid = (badgeList: BadgeType[]) => {
    const filtered = filterBadges(badgeList);
    if (filtered.length === 0) {
      return (
        <div className="col-span-full text-center py-10 text-muted-foreground">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No badges match this filter</p>
        </div>
      );
    }
    return filtered.map((badge) => {
      const isEarned = earnedIds.has(badge.id);
      const borderColor = BADGE_RARITY_COLORS[badge.rarity] || BADGE_RARITY_COLORS.common;
      return (
        <Card
          key={badge.id}
          className={`p-5 text-center border-2 transition-opacity ${borderColor} ${!isEarned ? "opacity-50" : ""}`}
          data-testid={`card-badge-${badge.id}`}
        >
          <div className="flex justify-center mb-3">
            <BadgeIcon badge={badge} size="md" earned={isEarned} />
          </div>
          <p className="font-semibold text-sm mb-1" data-testid={`text-badge-name-${badge.id}`}>
            {badge.name}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {badge.description}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {rarityLabels[badge.rarity]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Lvl {badge.levelRequirement}+
            </Badge>
          </div>
          {isEarned && (
            <div className="mt-2">
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Earned
              </Badge>
            </div>
          )}
        </Card>
      );
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <CelebrationOverlay
        badge={celebrationState.badge}
        visible={celebrationState.visible}
        onDismiss={dismiss}
      />

      <PageHeader
        title="Achievements"
        description="Collect badges, earn ranks, and track your mastery progress."
        breadcrumbs={[{label:"Achievements"}]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Card className="p-5 text-center">
          <div className="w-10 h-10 rounded-md mx-auto mb-2 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <CurrentRankIcon className="h-5 w-5 text-white" />
          </div>
          <p className="text-lg font-bold" data-testid="text-current-rank">
            {currentRank.title}
          </p>
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
          <p className="text-2xl font-bold" data-testid="text-achievement-points">
            {totalPoints.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total Points</p>
        </Card>
        <Card className="p-5 text-center">
          <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold" data-testid="text-badges-earned">
            {earnedCount} / {totalCount}
          </p>
          <p className="text-xs text-muted-foreground">Badges Earned</p>
        </Card>
        <Card className="p-5 text-center">
          <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold" data-testid="text-completion-pct">
            {completionPct}%
          </p>
          <p className="text-xs text-muted-foreground">Completion</p>
          <Progress value={completionPct} className="mt-2 h-1.5" />
        </Card>
      </div>

      <Card className="p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-500" /> Rank Progression
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const rank = getRankForLevel(lvl);
            const RIcon = rankIcons[rank.icon] || Shield;
            const isActive = lvl === currentLevel;
            const isCompleted = lvl < currentLevel;
            const rankLabelsArr = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];
            return (
              <div
                key={lvl}
                className={`flex flex-col items-center p-4 rounded-md border ${
                  isActive
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                    : isCompleted
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10"
                      : "border-border"
                }`}
                data-testid={`rank-level-${lvl}`}
              >
                <div
                  className={`w-12 h-12 rounded-md flex items-center justify-center mb-2 ${
                    isCompleted || isActive
                      ? "bg-gradient-to-br from-amber-500 to-orange-600"
                      : "bg-muted"
                  }`}
                >
                  <RIcon
                    className={`h-6 w-6 ${isCompleted || isActive ? "text-white" : "text-muted-foreground"}`}
                  />
                </div>
                <p
                  className={`text-sm font-semibold ${!isCompleted && !isActive ? "text-muted-foreground" : ""}`}
                >
                  {rank.title}
                </p>
                <p className="text-xs text-muted-foreground">{rankLabelsArr[lvl - 1]}</p>
                {isActive && (
                  <Badge variant="secondary" className="text-xs mt-2">
                    Current
                  </Badge>
                )}
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-2" />}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h2 className="text-xl font-semibold">Badge Collection</h2>
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-rarity-filter">
            <SelectValue placeholder="Filter by rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="option-rarity-all">All Rarities</SelectItem>
            <SelectItem value="common" data-testid="option-rarity-common">Common</SelectItem>
            <SelectItem value="uncommon" data-testid="option-rarity-uncommon">Uncommon</SelectItem>
            <SelectItem value="rare" data-testid="option-rarity-rare">Rare</SelectItem>
            <SelectItem value="legendary" data-testid="option-rarity-legendary">Legendary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="mb-10">
        <TabsList data-testid="tabs-category-filter">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          {categories.map((cat) => {
            const CIcon = categoryIcons[cat] || Award;
            return (
              <TabsTrigger key={cat} value={cat} data-testid={`tab-${cat}`}>
                <CIcon className="h-4 w-4 mr-1.5" />
                {categoryLabels[cat] || cat}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {renderBadgeGrid(allBadges)}
          </div>
        </TabsContent>

        {categories.map((cat) => {
          const categoryBadges = allBadges.filter((b) => b.category === cat);
          return (
            <TabsContent key={cat} value={cat}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {renderBadgeGrid(categoryBadges)}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
