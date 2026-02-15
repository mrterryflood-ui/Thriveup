import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import WelcomeOnboarding from "@/components/welcome-onboarding";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  ShoppingBag,
  Trophy,
  Map,
  Flag,
  Target,
  BookOpen,
  Printer,
  Building2,
  CalendarCheck,
  Zap,
  Wallet,
  Star,
  Award,
  User,
  Users,
  Briefcase,
  Route,
  Activity,
  ClipboardCheck,
  Handshake,
} from "lucide-react";
import type { AcademyAvatar } from "@shared/schema";

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

function getActivityIcon(type: string) {
  switch (type) {
    case "marketplace_list": case "marketplace_buy": return ShoppingBag;
    case "scenario_complete": case "scenario_start": return Map;
    case "stock_buy": case "stock_sell": return TrendingUp;
    case "competition_entry": return Trophy;
    case "merit_award": return Award;
    case "quest_complete": return CalendarCheck;
    default: return Star;
  }
}

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  mentor: "Mentor",
  team_captain: "Team Captain",
  class_president: "Class President",
};

const BACKGROUND_SCENES: Record<string, string> = {
  school: "from-blue-200 to-sky-300 dark:from-blue-900 dark:to-sky-800",
  park: "from-green-200 to-emerald-300 dark:from-green-900 dark:to-emerald-800",
  library: "from-amber-200 to-orange-300 dark:from-amber-900 dark:to-orange-800",
  space: "from-rose-300 to-red-400 dark:from-rose-900 dark:to-red-800",
};

const BUILDINGS = [
  { name: "Stock Exchange", icon: TrendingUp, href: "/academy/stocks", description: "Trade & invest virtual stocks", color: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { name: "Panther Marketplace", icon: ShoppingBag, href: "/academy/marketplace", description: "Buy & sell with classmates", color: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
  { name: "Competition Arena", icon: Trophy, href: "/academy/competitions", description: "Compete & win", color: "bg-rose-100 dark:bg-rose-900/30", iconColor: "text-rose-600 dark:text-rose-400" },
  { name: "Adventure Hall", icon: Map, href: "/academy/scenarios", description: "Choose your own adventure", color: "bg-sky-100 dark:bg-sky-900/30", iconColor: "text-sky-600 dark:text-sky-400" },
  { name: "House Hall", icon: Flag, href: "/academy/houses", description: "House points & rankings", color: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400" },
  { name: "Dream Lab", icon: Target, href: "/academy/dreams", description: "Design your future", color: "bg-pink-100 dark:bg-pink-900/30", iconColor: "text-pink-600 dark:text-pink-400" },
  { name: "Learning Center", icon: BookOpen, href: "/academy/lessons", description: "Life lessons & skills", color: "bg-indigo-100 dark:bg-indigo-900/30", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { name: "Print Shop", icon: Printer, href: "/academy/merch", description: "Create merchandise", color: "bg-orange-100 dark:bg-orange-900/30", iconColor: "text-orange-600 dark:text-orange-400" },
  { name: "Campus Builder", icon: Building2, href: "/academy/campus", description: "Build your campus", color: "bg-teal-100 dark:bg-teal-900/30", iconColor: "text-teal-600 dark:text-teal-400" },
  { name: "Quest Board", icon: CalendarCheck, href: "/academy/quests", description: "Daily challenges", color: "bg-cyan-100 dark:bg-cyan-900/30", iconColor: "text-cyan-600 dark:text-cyan-400" },
  { name: "Power Station", icon: Zap, href: "/academy/power", description: "Your empowerment score", color: "bg-yellow-100 dark:bg-yellow-900/30", iconColor: "text-yellow-600 dark:text-yellow-400" },
  { name: "My Wallet", icon: Wallet, href: "/academy/wallet", description: "Check your balance", color: "bg-lime-100 dark:bg-lime-900/30", iconColor: "text-lime-600 dark:text-lime-400" },
  { name: "Career Explorer", icon: Briefcase, href: "/academy/careers", description: "Explore 50+ career paths", color: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
  { name: "Mentor Hub", icon: Users, href: "/academy/mentors", description: "Connect with professionals", color: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400" },
  { name: "Mentor Finder", icon: Handshake, href: "/academy/mentor-finder", description: "Find local mentors & partners", color: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400" },
  { name: "My Pathway", icon: Route, href: "/academy/pathway", description: "Plan your 6-12 journey", color: "bg-fuchsia-100 dark:bg-fuchsia-900/30", iconColor: "text-fuchsia-600 dark:text-fuchsia-400" },
  { name: "Thrive Dashboard", icon: Activity, href: "/academy/thrive", description: "Your navigation score", color: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { name: "Daily Check-In", icon: ClipboardCheck, href: "/academy/self-assessment", description: "How are you today?", color: "bg-sky-100 dark:bg-sky-900/30", iconColor: "text-sky-600 dark:text-sky-400" },
  { name: "Game Room", icon: Trophy, href: "/academy/games", description: "Play Dominoes & more", color: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-400" },
];

interface DashboardData {
  houses: Array<{ id: string; name: string; totalPoints: number }>;
  wallet: { balance: string } | null;
  competitions: Array<{ id: string; status: string }>;
}

interface PowerData {
  totalScore: number;
  level: number;
  title: string;
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  activityType: string;
  title: string;
  description: string;
  metadata: unknown;
  powerCategory: string;
  pointsEarned: number;
  createdAt: string;
}

function MiniAvatar({ avatar, size = "md" }: { avatar: AcademyAvatar; size?: "sm" | "md" }) {
  const headSize = size === "sm" ? "w-8 h-8" : "w-12 h-12";
  const bodyW = size === "sm" ? "w-7" : "w-10";
  const bodyH = size === "sm" ? "h-8" : "h-12";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className={`absolute left-1/2 -translate-x-1/2 -top-1 z-0 rounded-t-full`}
          style={{
            backgroundColor: avatar.hairColor,
            width: size === "sm" ? "28px" : "42px",
            height: size === "sm" ? "14px" : "20px",
          }}
        />
        <div
          className={`${headSize} rounded-full relative z-10`}
          style={{ backgroundColor: avatar.skinTone }}
        />
      </div>
      <div
        className={`${bodyW} ${bodyH} rounded-md -mt-1`}
        style={{ backgroundColor: avatar.outfitColor }}
      />
    </div>
  );
}

function HeroMiniAvatar({ avatar }: { avatar: AcademyAvatar }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1 z-0 rounded-t-full"
          style={{
            backgroundColor: avatar.hairColor,
            width: "30px",
            height: "14px",
          }}
        />
        <div
          className="w-9 h-9 rounded-full relative z-10 border-2 border-white/40"
          style={{ backgroundColor: avatar.skinTone }}
        />
      </div>
      <div
        className="w-8 h-10 rounded-md -mt-1"
        style={{ backgroundColor: avatar.outfitColor }}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Skeleton className="h-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export default function AcademyVillagePage() {
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("txea_onboarding_complete"));

  const completeOnboarding = () => {
    localStorage.setItem("txea_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const { data: myAvatar, isLoading: avatarLoading } = useQuery<AcademyAvatar | null>({
    queryKey: ["/api/academy/avatars/me"],
    retry: false,
  });

  const { data: allAvatars, isLoading: avatarsLoading } = useQuery<AcademyAvatar[]>({
    queryKey: ["/api/academy/avatars"],
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/academy/dashboard"],
  });

  const { data: powerData } = useQuery<PowerData>({
    queryKey: ["/api/academy/panther-power"],
  });

  const { data: activityData } = useQuery<ActivityItem[]>({
    queryKey: ["/api/academy/activity"],
  });

  if (avatarLoading && dashboardLoading) {
    return <LoadingSkeleton />;
  }

  const walletBalance = dashboardData?.wallet?.balance ? parseFloat(dashboardData.wallet.balance) : 0;
  const totalHousePoints = (dashboardData?.houses ?? []).reduce((sum, h) => sum + (h.totalPoints || 0), 0);
  const activeCompetitions = (dashboardData?.competitions ?? []).filter((c) => c.status === "active").length;
  const pantherPowerScore = powerData?.totalScore ?? 0;
  const pantherLevel = powerData?.level ?? 1;
  const pantherTitle = powerData?.title ?? "Young Panther";

  const activities = (activityData ?? []).slice(0, 15);
  const classmates = allAvatars ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" data-testid="academy-village-page">
      <WelcomeOnboarding isOpen={showOnboarding} onComplete={completeOnboarding} />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-4 sm:p-6 lg:p-8 mb-6"
        data-testid="section-hero"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1" data-testid="text-village-title">
              Panther Village
            </h1>
            <p className="text-rose-100 text-lg" data-testid="text-village-subtitle">
              Your Campus, Your Community, Your Future
            </p>
          </div>
          {myAvatar && (
            <div data-testid="hero-mini-avatar">
              <HeroMiniAvatar avatar={myAvatar} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="section-quick-stats">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm text-muted-foreground">Wallet</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xl font-bold" data-testid="stat-wallet-balance">
            ${walletBalance.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm text-muted-foreground">House Points</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Flag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-xl font-bold" data-testid="stat-house-points">
            {totalHousePoints.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm text-muted-foreground">Panther Power</span>
            <div className="rounded-md p-1.5 bg-yellow-100 dark:bg-yellow-900/30">
              <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-xl font-bold" data-testid="stat-panther-power">
            {pantherPowerScore.toLocaleString()}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm text-muted-foreground">Competitions</span>
            <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/30">
              <Trophy className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <p className="text-xl font-bold" data-testid="stat-active-competitions">
            {activeCompetitions}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mb-6">
        <div className="space-y-6">
          <Card className="p-5" data-testid="section-avatar-card">
            {myAvatar ? (
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-full rounded-md p-4 mb-4 bg-gradient-to-b ${BACKGROUND_SCENES[myAvatar.background] || BACKGROUND_SCENES.school}`}
                  data-testid="avatar-scene"
                >
                  <MiniAvatar avatar={myAvatar} size="md" />
                </div>
                <p className="font-semibold text-lg" data-testid="avatar-display-name">
                  {myAvatar.displayName}
                </p>
                <Badge variant="secondary" className="mt-1" data-testid="avatar-role-badge">
                  {ROLE_LABELS[myAvatar.role] || myAvatar.role}
                </Badge>
                {myAvatar.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3" data-testid="avatar-bio">
                    {myAvatar.bio}
                  </p>
                )}
                <div className="mt-4 w-full border-t pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Panther Power</p>
                      <p className="font-bold" data-testid="avatar-power-level">
                        Lv. {pantherLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Score</p>
                      <p className="font-bold" data-testid="avatar-power-score">
                        {pantherPowerScore.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1" data-testid="avatar-power-title">
                    {pantherTitle}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <div className="rounded-md p-3 bg-muted mb-3">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-semibold mb-1">Create Your Avatar</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Design your unique Panther identity
                </p>
                <Link href="/academy/avatar">
                  <Button size="sm" data-testid="button-create-avatar">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <div data-testid="section-classmates">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" /> Classmates
            </h3>
            {avatarsLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-20 shrink-0" />
                ))}
              </div>
            ) : classmates.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {classmates.map((avatar) => (
                  <Card
                    key={avatar.id}
                    className="p-3 shrink-0 w-24 flex flex-col items-center text-center"
                    data-testid={`classmate-${avatar.id}`}
                  >
                    <MiniAvatar avatar={avatar} size="sm" />
                    <p className="text-xs font-medium mt-2 truncate w-full" data-testid={`classmate-name-${avatar.id}`}>
                      {avatar.displayName}
                    </p>
                    <Badge variant="secondary" className="text-[10px] mt-1 px-1.5" data-testid={`classmate-role-${avatar.id}`}>
                      {ROLE_LABELS[avatar.role] || avatar.role}
                    </Badge>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  No classmates yet. Invite friends to join!
                </p>
              </Card>
            )}
          </div>
        </div>

        <div data-testid="section-campus-map">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" /> Campus Map
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUILDINGS.map((building) => {
              const kebab = building.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link key={building.href} href={building.href} data-testid={`link-building-${kebab}`}>
                  <Card
                    className="p-4 hover-elevate cursor-pointer h-full"
                    data-testid={`building-${kebab}`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`rounded-md p-2.5 ${building.color}`}>
                        <building.icon className={`h-5 w-5 ${building.iconColor}`} />
                      </div>
                      <p className="font-medium text-sm">{building.name}</p>
                      <p className="text-xs text-muted-foreground">{building.description}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div data-testid="section-community-feed">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-muted-foreground" /> Community Feed
        </h2>
        {activities.length > 0 ? (
          <Card className="p-5" data-testid="card-community-feed">
            <div className="space-y-4">
              {activities.map((item) => {
                const IconComp = getActivityIcon(item.activityType);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3"
                    data-testid={`activity-${item.id}`}
                  >
                    <div className="w-9 h-9 rounded-md bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shrink-0">
                      <IconComp className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`activity-title-${item.id}`}>{item.title}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`activity-meta-${item.id}`}>
                        {item.userName} &middot; {timeAgo(item.createdAt)}
                      </p>
                    </div>
                    {item.pointsEarned > 0 && (
                      <Badge variant="secondary" className="shrink-0">
                        +{item.pointsEarned}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center" data-testid="card-no-activity">
            <Star className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No community activity yet. Be the first to make a move!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
