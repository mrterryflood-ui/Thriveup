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
} from "lucide-react";

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
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/academy/dashboard"],
  });

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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 p-8 mb-8" data-testid="section-hero">
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-academy-title">
          Sixth Grade Academy
        </h1>
        <p className="text-purple-100 text-lg">
          60 Young Entrepreneurs Building Their Future
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
            <div className="rounded-md p-1.5 bg-violet-100 dark:bg-violet-900/30">
              <Trophy className="h-4 w-4 text-violet-600 dark:text-violet-400" />
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

      <div className="mb-8">
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
                <p className="font-bold text-lg">{myHouse.name}</p>
                <p className="text-sm text-muted-foreground italic">{myHouse.motto}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{myHouse.totalPoints.toLocaleString()}</p>
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

      <div className="mb-8">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} data-testid={`link-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <Card className="p-4 hover-elevate cursor-pointer h-full">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="rounded-md p-2.5 bg-primary/10">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
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
                    <p className="text-sm font-medium truncate">{event.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
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
    </div>
  );
}
