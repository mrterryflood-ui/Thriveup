import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
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
  ArrowRight,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";

interface LifeLesson {
  id: string;
  featureArea: string;
  businessConcept: string;
  lifeSkillesson: string;
  reflection: string;
  ageGroup: string;
  iconName: string;
  sortOrder: number;
}

const featureAreaConfig: Record<string, { icon: LucideIcon; color: string; bgClass: string; textClass: string; badgeBg: string; href: string }> = {
  stocks: { icon: TrendingUp, color: "emerald", bgClass: "bg-emerald-100 dark:bg-emerald-900/30", textClass: "text-emerald-600 dark:text-emerald-400", badgeBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", href: "/academy/stocks" },
  wallet: { icon: Wallet, color: "blue", bgClass: "bg-blue-100 dark:bg-blue-900/30", textClass: "text-blue-600 dark:text-blue-400", badgeBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", href: "/academy/wallet" },
  campus: { icon: Building2, color: "amber", bgClass: "bg-amber-100 dark:bg-amber-900/30", textClass: "text-amber-600 dark:text-amber-400", badgeBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", href: "/academy/campus" },
  competitions: { icon: Trophy, color: "violet", bgClass: "bg-violet-100 dark:bg-violet-900/30", textClass: "text-violet-600 dark:text-violet-400", badgeBg: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", href: "/academy/competitions" },
  houses: { icon: Flag, color: "rose", bgClass: "bg-rose-100 dark:bg-rose-900/30", textClass: "text-rose-600 dark:text-rose-400", badgeBg: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", href: "/academy/houses" },
  dreams: { icon: Target, color: "orange", bgClass: "bg-orange-100 dark:bg-orange-900/30", textClass: "text-orange-600 dark:text-orange-400", badgeBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", href: "/academy/dreams" },
  merch: { icon: ShoppingBag, color: "teal", bgClass: "bg-teal-100 dark:bg-teal-900/30", textClass: "text-teal-600 dark:text-teal-400", badgeBg: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300", href: "/academy/merch" },
  avatar: { icon: User, color: "indigo", bgClass: "bg-indigo-100 dark:bg-indigo-900/30", textClass: "text-indigo-600 dark:text-indigo-400", badgeBg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", href: "/academy/avatar" },
};

const filterTabs = ["all", "stocks", "wallet", "campus", "competitions", "houses", "dreams", "merch", "avatar"];

const parallelMappings = [
  { business: "Stock Trading", life: "Risk Assessment", area: "stocks" },
  { business: "Campus Building", life: "Project Management", area: "campus" },
  { business: "Wallet Management", life: "Budgeting", area: "wallet" },
  { business: "Competitions", life: "Goal Setting", area: "competitions" },
  { business: "House System", life: "Teamwork", area: "houses" },
  { business: "Dream Design", life: "Vision Planning", area: "dreams" },
];

function getConfig(featureArea: string) {
  return featureAreaConfig[featureArea.toLowerCase()] ?? featureAreaConfig.stocks;
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export default function AcademyLessonsPage() {
  useEffect(() => { document.title = 'Lessons | AI Mastery Academy'; }, []);

  const [activeFilter, setActiveFilter] = useState("all");

  const { data: lessons = [], isLoading, error, refetch } = useQuery<LifeLesson[]>({
    queryKey: ["/api/academy/life-lessons"],
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div className="p-6"><ErrorRetry message="Failed to load life lessons. Please try again." onRetry={refetch} /></div>;
  }

  const filtered = activeFilter === "all"
    ? lessons
    : lessons.filter((l) => l.featureArea.toLowerCase() === activeFilter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 p-8 mb-8" data-testid="section-hero">
        <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-lessons-title">
          Life Lessons
        </h1>
        <p className="text-rose-100 text-lg">
          Where Business Meets Life - Every Academy activity teaches a real-world skill
        </p>
      </div>

      <Card className="p-6 mb-8" data-testid="section-parallel-universe">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-md p-2 bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-semibold text-lg">The Parallel Universe</h2>
        </div>
        <p className="text-muted-foreground mb-2">
          Every business skill you learn in the Academy has a life lesson behind it.
        </p>
        <p className="text-muted-foreground mb-6">
          Stock trading teaches risk assessment. Campus building teaches project management. Your wallet teaches budgeting.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {parallelMappings.map((m) => {
            const config = getConfig(m.area);
            const Icon = config.icon;
            return (
              <div
                key={m.area}
                className="flex items-center gap-3 rounded-md p-3 bg-muted/50"
                data-testid={`mapping-${m.area}`}
              >
                <div className={`rounded-md p-1.5 ${config.bgClass} shrink-0`}>
                  <Icon className={`h-4 w-4 ${config.textClass}`} />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{m.business}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">{m.life}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap mb-6">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab;
          const label = tab.charAt(0).toUpperCase() + tab.slice(1);
          return (
            <Button
              key={tab}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(tab)}
              data-testid={`filter-${tab}`}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" data-testid="card-no-lessons">
          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            No life lessons found for this category yet.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="lessons-grid">
          {filtered.map((lesson) => {
            const config = getConfig(lesson.featureArea);
            const Icon = config.icon;
            return (
              <Card key={lesson.id} className="p-5" data-testid={`card-lesson-${lesson.id}`}>
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-md p-1.5 ${config.bgClass} shrink-0`}>
                      <Icon className={`h-4 w-4 ${config.textClass}`} />
                    </div>
                    <h3 className="font-semibold">{lesson.businessConcept}</h3>
                  </div>
                  <Badge variant="secondary" className={`${config.badgeBg} no-default-hover-elevate no-default-active-elevate shrink-0`}>
                    {lesson.featureArea}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4" data-testid={`text-life-skill-${lesson.id}`}>
                  {lesson.lifeSkillesson}
                </p>

                <div className="rounded-md bg-muted/50 p-3 mb-4" data-testid={`section-reflection-${lesson.id}`}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reflection</p>
                  <p className="text-sm italic">{lesson.reflection}</p>
                </div>

                <Link href={config.href}>
                  <Button variant="outline" size="sm" data-testid={`link-explore-${lesson.id}`}>
                    Explore {lesson.featureArea.charAt(0).toUpperCase() + lesson.featureArea.slice(1)}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
