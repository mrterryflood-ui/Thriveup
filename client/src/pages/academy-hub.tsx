import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  TrendingUp,
  Wallet,
  Building2,
  Trophy,
  Flag,
  Target,
  ShoppingBag,
  Star,
  Award,
  ChevronRight,
  Clock,
  Users,
  Zap,
  CalendarCheck,
  Lightbulb,
  CheckCircle2,
  Circle,
  ArrowRight,
  Link2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";
import type { AcademyPantherPower, AcademyDailyQuest } from "@shared/schema";

interface House {
  id: string;
  name: string;
  color: string;
  motto: string;
  totalPoints: number;
  iconName: string;
  createdAt: string;
}

interface WalletData {
  id: string;
  userId: string;
  balance: string;
  totalEarned: string;
  totalInvested: string;
  campusContributed: string;
  createdAt: string;
}

interface MeritEvent {
  id: string;
  userId: string;
  houseId: string;
  points: number;
  reason: string;
  category: string;
  awardedBy?: string;
  awardedByName?: string;
  createdAt: string;
}

interface Competition {
  id: string;
  name: string;
  status: string;
  type: string;
  category: string;
  description: string;
}

interface DashboardData {
  houses: House[];
  wallet: WalletData | null;
  recentMeritEvents: MeritEvent[];
  competitions: Competition[];
}

const quickActions = [
  { label: "My Avatar", href: "/academy/avatar", icon: User, description: "Customize your look" },
  { label: "Stock Market", href: "/academy/stocks", icon: TrendingUp, description: "Trade and invest" },
  { label: "My Wallet", href: "/academy/wallet", icon: Wallet, description: "Check your balance" },
  { label: "Build Campus", href: "/academy/campus", icon: Building2, description: "Design your space" },
  { label: "Competitions", href: "/academy/competitions", icon: Trophy, description: "Compete and win" },
  { label: "House Points", href: "/academy/houses", icon: Flag, description: "Track standings" },
  { label: "Dream Design", href: "/academy/dreams", icon: Target, description: "Plan your goals" },
  { label: "Print Shop", href: "/academy/merch", icon: ShoppingBag, description: "Create merchandise" },
  { label: "Panther Power", href: "/academy/power", icon: Zap, description: "Your empowerment score" },
  { label: "Daily Quests", href: "/academy/quests", icon: CalendarCheck, description: "Today's challenges" },
  { label: "Life Lessons", href: "/academy/lessons", icon: Lightbulb, description: "Business meets life" },
];

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-32" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export default function AcademyHubPage() {
  useEffect(() => {
    document.title = "Academy Hub | AI Mastery Academy";
  }, []);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/academy/dashboard"],
  });

  const { data: powerData } = useQuery<AcademyPantherPower>({ queryKey: ["/api/academy/panther-power"] });
  const { data: questsData } = useQuery<AcademyDailyQuest[]>({ queryKey: ["/api/academy/quests"] });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const houses = data?.houses ?? [];
  const wallet = data?.wallet;
  const recentMeritEvents = data?.recentMeritEvents ?? [];
  const competitions = data?.competitions ?? [];

  const totalHousePoints = houses.reduce((sum, h) => sum + (h.totalPoints || 0), 0);
  const activeCompetitions = competitions.filter((c) => c.status === "active").length;
  const totalMeritPoints = recentMeritEvents.reduce((sum, m) => sum + (m.points || 0), 0);
  
  const walletBalance = wallet?.balance ? parseFloat(wallet.balance) : 0;

  const myHouse = houses.length > 0 ? houses[0] : null;

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="academy-hub-page">
      <div className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 p-8 mb-8" data-testid="section-hero">
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-academy-title">
          AI Mastery Academy
        </h1>
        <p className="text-rose-100 text-lg" data-testid="text-academy-subtitle">
          Young Leaders Building Their Future Through AI
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" data-testid="section-quick-stats">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">House Points</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Flag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-house-points">
            {totalHousePoints.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Wallet Balance</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-wallet-balance">
            ${walletBalance.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Active Competitions</span>
            <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/30">
              <Trophy className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-active-competitions">
            {activeCompetitions}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Merit Points</span>
            <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/30">
              <Star className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-merit-points">
            {totalMeritPoints.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="mb-8" data-testid="section-panther-power">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Panther Power
        </h2>
        <Card className="p-6" data-testid="card-panther-power">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg" data-testid="text-power-level">
                  Level {powerData?.level ?? 1} - {powerData?.title ?? "Young Panther"}
                </p>
                <p className="text-sm text-muted-foreground">Your empowerment score</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" data-testid="text-power-score">
                {(powerData?.totalScore ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">total power</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {[
              { name: "Education", score: powerData?.educationScore ?? 0 },
              { name: "Character", score: powerData?.characterScore ?? 0 },
              { name: "Leadership", score: powerData?.leadershipScore ?? 0 },
              { name: "Entrepreneurship", score: powerData?.entrepreneurshipScore ?? 0 },
              { name: "Community", score: powerData?.communityScore ?? 0 },
            ].map((cat) => (
              <div key={cat.name} data-testid={`power-category-${cat.name.toLowerCase()}`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-medium truncate">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.score}</span>
                </div>
                <Progress value={Math.min((cat.score / 200) * 100, 100)} className="h-1.5" />
              </div>
            ))}
          </div>
          <Link href="/academy/power">
            <Button variant="outline" size="sm" data-testid="button-view-power">
              View Full Stats <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      </div>

      <div className="mb-8" data-testid="section-daily-quests">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" /> Daily Quests
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Array.isArray(questsData) ? questsData : []).slice(0, 3).map((quest: AcademyDailyQuest) => (
            <Card
              key={quest.id}
              className="p-4"
              data-testid={`card-quest-${quest.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {quest.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${quest.completed ? "line-through text-muted-foreground" : ""}`} data-testid={`text-quest-title-${quest.id}`}>
                    {quest.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
                  {quest.rewardPoints && (
                    <Badge variant="secondary" className="mt-2" data-testid={`badge-quest-reward-${quest.id}`}>
                      +{quest.rewardPoints} Power
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {(!Array.isArray(questsData) || questsData.length === 0) && (
            <Card className="p-6 text-center col-span-full" data-testid="card-no-quests">
              <CalendarCheck className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No quests available yet. Check back soon!</p>
            </Card>
          )}
        </div>
        <div className="mt-3">
          <Link href="/academy/quests">
            <Button variant="outline" size="sm" data-testid="button-view-quests">
              View All Quests <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-8" data-testid="section-your-house">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Your House
        </h2>
        {myHouse ? (
          <Card className="p-6" data-testid="card-my-house">
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: myHouse.color }}
              >
                <Flag className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <p className="font-bold text-lg" data-testid="text-house-name">{myHouse.name}</p>
                <p className="text-sm text-muted-foreground italic" data-testid="text-house-motto">{myHouse.motto}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" data-testid="text-house-total-points">{myHouse.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center" data-testid="card-no-house">
            <Flag className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              You haven't been assigned to a house yet.
            </p>
            <Link href="/academy/houses">
              <Button size="sm" data-testid="button-join-house">
                View Houses <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>
        )}
      </div>

      <div className="mb-8" data-testid="section-quick-actions">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} data-testid={`link-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <Card className="p-4 hover-elevate cursor-pointer h-full" data-testid={`card-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="rounded-md p-2.5 bg-primary/10">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm" data-testid={`text-action-label-${action.label.toLowerCase().replace(/\s+/g, "-")}`}>{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-8" data-testid="section-connected-universe">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" /> Connected Universe
        </h2>
        <div className="overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max pb-2">
            {[
              { from: "Stock Market", fromIcon: TrendingUp, to: "Fund Campus", toIcon: Building2, color: "from-emerald-400 to-emerald-600" },
              { from: "Competition Wins", fromIcon: Trophy, to: "House Points", toIcon: Flag, color: "from-amber-400 to-amber-600" },
              { from: "House Points", fromIcon: Flag, to: "Unlock Rewards", toIcon: Star, color: "from-rose-400 to-rose-600" },
              { from: "All Activities", fromIcon: Target, to: "Panther Power", toIcon: Zap, color: "from-violet-400 to-violet-600" },
              { from: "Business Concepts", fromIcon: TrendingUp, to: "Life Lessons", toIcon: Lightbulb, color: "from-sky-400 to-sky-600" },
            ].map((connection, idx) => (
              <div key={idx} className="flex items-center gap-2" data-testid={`connection-${idx}`}>
                <Card className="p-3 min-w-[120px]">
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <div className={`rounded-md p-2 bg-gradient-to-br ${connection.color}`}>
                      <connection.fromIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{connection.from}</span>
                  </div>
                </Card>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <Card className="p-3 min-w-[120px]">
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <div className={`rounded-md p-2 bg-gradient-to-br ${connection.color}`}>
                      <connection.toIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{connection.to}</span>
                  </div>
                </Card>
                {idx < 4 && <div className="w-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div data-testid="section-recent-activity">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Recent Activity
        </h2>
        {recentMeritEvents.length > 0 ? (
          <Card className="p-6" data-testid="card-recent-activity">
            <div className="space-y-4">
              {recentMeritEvents.slice(0, 8).map((event) => (
                <div key={event.id} className="flex items-center gap-3" data-testid={`merit-event-${event.id}`}>
                  <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-merit-reason-${event.id}`}>{event.reason}</p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-merit-date-${event.id}`}>
                      {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0" data-testid={`badge-merit-points-${event.id}`}>
                    +{event.points}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center" data-testid="card-no-activity">
            <Award className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent activity yet. Start earning merit points!
            </p>
          </Card>
        )}
      </div>

      <AcademyWizard wizardType="welcome" steps={WIZARD_STEPS["welcome"]} />
    </div>
  );
}
