import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Crown,
  Flame,
  Bird,
  Waves,
  TreePine,
  Star,
  Award,
  Heart,
  Lightbulb,
  Dumbbell,
  Palette,
  Users,
  Shield,
  Flag,
  BookOpen,
  Gift,
  Send,
  Trophy,
  Target,
} from "lucide-react";
import type { AcademyHouse, AcademyMeritEvent } from "@shared/schema";

const HOUSE_ICONS: Record<string, typeof Flame> = {
  flame: Flame,
  bird: Bird,
  waves: Waves,
  tree: TreePine,
  "Phoenix Rising": Flame,
  "Golden Eagles": Bird,
  "Ocean Tide": Waves,
  "Emerald Forest": TreePine,
};

const MERIT_CATEGORIES = [
  { id: "academic", name: "Academic Excellence", description: "Homework, tests, participation", range: "5-50 pts", icon: BookOpen, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "character", name: "Character & Leadership", description: "Helping others, integrity, teamwork", range: "10-25 pts", icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30" },
  { id: "creative", name: "Creative Expression", description: "Art, music, writing, performance", range: "5-30 pts", icon: Palette, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
  { id: "community", name: "Community Service", description: "Volunteering, mentoring", range: "10-50 pts", icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: "athletic", name: "Athletic Achievement", description: "Sports, fitness goals", range: "5-25 pts", icon: Dumbbell, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
  { id: "innovation", name: "Innovation & Problem Solving", description: "Projects, ideas", range: "10-40 pts", icon: Lightbulb, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
];

const REFEREE_LEVELS = [
  { level: 1, name: "Peer Recognition", description: "Students can give", range: "1-5 pts", icon: Users },
  { level: 2, name: "Team Captain", description: "Can give", range: "5-15 pts", icon: Flag },
  { level: 3, name: "Mentor", description: "Can give", range: "10-25 pts", icon: Shield },
  { level: 4, name: "Teacher", description: "Can give", range: "10-50 pts", icon: Award },
  { level: 5, name: "Principal", description: "Can give", range: "25-100 pts", icon: Crown },
];

const REWARDS = [
  { points: 100, name: "Homework Pass", icon: BookOpen },
  { points: 250, name: "Extra Recess", icon: Target },
  { points: 500, name: "Lunch with Teacher", icon: Users },
  { points: 1000, name: "$50 to Virtual Wallet", icon: Star },
  { points: 2500, name: "Field Trip VIP", icon: Flag },
  { points: 5000, name: "Academy Star Award", icon: Trophy },
];

const CATEGORY_COLORS: Record<string, string> = {
  academic: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  character: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
  creative: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
  community: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  athletic: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  innovation: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
};

function getHouseIcon(house: AcademyHouse) {
  return HOUSE_ICONS[house.iconName] || HOUSE_ICONS[house.name] || Flag;
}

function HouseStandings({ houses }: { houses: AcademyHouse[] }) {
  const sorted = [...houses].sort((a, b) => b.totalPoints - a.totalPoints);
  const maxPoints = sorted[0]?.totalPoints || 1;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-house-standings-title">
        <Trophy className="h-5 w-5 text-amber-500" /> House Standings
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sorted.map((house, index) => {
          const HouseIcon = getHouseIcon(house);
          const isLeader = index === 0;
          const progress = maxPoints > 0 ? (house.totalPoints / maxPoints) * 100 : 0;

          return (
            <Card
              key={house.id}
              className={`p-5 relative ${isLeader ? "ring-2 ring-amber-400" : ""}`}
              data-testid={`card-house-${house.id}`}
            >
              {isLeader && (
                <div className="absolute -top-3 -right-3 rounded-full p-1.5 bg-amber-400">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="rounded-md p-2.5 shrink-0"
                  style={{ backgroundColor: house.color + "20", color: house.color }}
                >
                  <HouseIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate" data-testid={`text-house-name-${house.id}`}>
                    {house.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate" data-testid={`text-house-motto-${house.id}`}>{house.motto}</p>
                </div>
              </div>
              <p className="text-3xl font-bold mb-1" data-testid={`text-house-points-${house.id}`}>
                {house.totalPoints.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mb-3">Total Points</p>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span data-testid={`text-house-members-${house.id}`}>Members</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MeritCategories() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-merit-categories-title">
        <Star className="h-5 w-5 text-primary" /> Merit Categories
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MERIT_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <Card key={cat.id} className="p-4" data-testid={`card-category-${cat.id}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-md p-2 shrink-0 ${cat.bg}`}>
                  <CatIcon className={`h-5 w-5 ${cat.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm" data-testid={`text-category-name-${cat.id}`}>{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-category-desc-${cat.id}`}>{cat.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs" data-testid={`badge-category-range-${cat.id}`}>{cat.range}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RefereeLevels() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-referee-levels-title">
        <Shield className="h-5 w-5 text-primary" /> Referee Levels
      </h2>
      <div className="flex flex-wrap gap-3">
        {REFEREE_LEVELS.map((ref) => {
          const RefIcon = ref.icon;
          return (
            <Card key={ref.level} className="p-4 flex items-center gap-3" data-testid={`card-referee-${ref.level}`}>
              <div className="rounded-md p-2 bg-primary/10 shrink-0">
                <RefIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm" data-testid={`text-referee-name-${ref.level}`}>Level {ref.level}: {ref.name}</span>
                  <Badge variant="secondary" className="text-xs" data-testid={`badge-referee-range-${ref.level}`}>{ref.range}</Badge>
                </div>
                <p className="text-xs text-muted-foreground" data-testid={`text-referee-desc-${ref.level}`}>{ref.description} {ref.range}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AwardPointsForm({ houses }: { houses: AcademyHouse[] }) {
  const { toast } = useToast();
  const [studentName, setStudentName] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");
  const [points, setPoints] = useState("");
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");

  const awardMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      houseId: string;
      points: number;
      reason: string;
      category: string;
    }) => {
      await apiRequest("POST", "/api/academy/merit", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/dashboard"] });
      toast({ title: "Points Awarded", description: `${points} points awarded successfully!` });
      setStudentName("");
      setSelectedHouse("");
      setPoints("");
      setCategory("");
      setReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to award points. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !selectedHouse || !points || !category || !reason) {
      toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    awardMutation.mutate({
      userId: studentName,
      houseId: selectedHouse,
      points: parseInt(points, 10),
      reason,
      category,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-award-form-title">
        <Award className="h-5 w-5 text-primary" /> Award Points
      </h2>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Student Name</label>
              <Input
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                data-testid="input-student-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">House</label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger data-testid="select-house">
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id} data-testid={`select-house-${house.id}`}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Points</label>
              <Input
                type="number"
                placeholder="Points amount"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                data-testid="input-points"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {MERIT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} data-testid={`select-category-${cat.id}`}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Input
              placeholder="Why are points being awarded?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-testid="input-reason"
            />
          </div>
          <Button type="submit" disabled={awardMutation.isPending} data-testid="button-award-points">
            <Send className="h-4 w-4 mr-2" />
            {awardMutation.isPending ? "Awarding..." : "Award Points"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

interface DashboardData {
  houses: AcademyHouse[];
  recentMeritEvents: AcademyMeritEvent[];
}

function RecentMeritFeed({ houses }: { houses: AcademyHouse[] }) {
  const houseMap = new Map(houses.map((h) => [h.id, h]));

  const { data: dashData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/academy/dashboard"],
  });

  const allEvents = dashData?.recentMeritEvents || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-recent-events-title">
        <Flag className="h-5 w-5 text-primary" /> Recent Merit Events
      </h2>
      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : allEvents.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No merit events yet. Start awarding points!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allEvents.map((event) => {
              const house = event.houseId ? houseMap.get(event.houseId) : null;
              const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.academic;
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-muted/30 flex-wrap"
                  data-testid={`row-merit-event-${event.id}`}
                >
                  <Badge variant="secondary" className={`text-xs shrink-0 ${catColor}`} data-testid={`badge-merit-points-${event.id}`}>
                    +{event.points}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-merit-user-${event.id}`}>{event.userId}</p>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`text-merit-reason-${event.id}`}>{event.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {house && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {house.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground capitalize shrink-0">{event.category}</span>
                    {event.awardedByName && (
                      <span className="text-xs text-muted-foreground shrink-0">by {event.awardedByName}</span>
                    )}
                    {event.createdAt && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function InstantRewards() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-rewards-title">
        <Gift className="h-5 w-5 text-primary" /> Instant Rewards Showcase
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REWARDS.map((reward) => {
          const RewardIcon = reward.icon;
          return (
            <Card key={reward.points} className="p-4" data-testid={`card-reward-${reward.points}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-md p-2 bg-amber-100 dark:bg-amber-900/30 shrink-0">
                  <RewardIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm" data-testid={`text-reward-name-${reward.points}`}>{reward.name}</p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-reward-points-${reward.points}`}>{reward.points.toLocaleString()} points</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function AcademyHousesPage() {
  useEffect(() => { document.title = 'Houses | AI Mastery Academy'; }, []);
  const { data: houses, isLoading } = useQuery<AcademyHouse[]>({
    queryKey: ["/api/academy/houses"],
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="houses-loading">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const houseData = houses || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" data-testid="page-academy-houses">
      <div>
        <h1 className="text-3xl font-bold mb-1" data-testid="text-page-title">
          House Points & Merit System
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Panthers earn points through Education, Character, and Leadership
        </p>
      </div>

      <HouseStandings houses={houseData} />
      <MeritCategories />
      <RefereeLevels />
      <AwardPointsForm houses={houseData} />
      <RecentMeritFeed houses={houseData} />
      <InstantRewards />
      <AcademyWizard wizardType="houses" steps={WIZARD_STEPS["houses"]} />
    </div>
  );
}
