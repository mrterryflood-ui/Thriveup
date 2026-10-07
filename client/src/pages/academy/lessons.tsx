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
  useEffect(() => { document.title = 'Lessons | ThriveUp'; }, []);

  const [activeFilter, setActiveFilter] = useState("all");

  const { data: rawLessons, isLoading, error, refetch } = useQuery<LifeLesson[]>({
    queryKey: ["/api/academy/life-lessons"],
  });
  const lessons = rawLessons ?? [];

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
    <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-3 sm:p-6">
      <section className="mb-3 sm:mb-5" data-testid="section-hero">
        <nav aria-label="Breadcrumb" className="mb-1 text-xs text-muted-foreground">
          <Link href="/academy" className="underline underline-offset-2 hover:text-foreground">Academy</Link>
          <span aria-hidden="true" className="px-2">/</span>
          <span aria-current="page">Life Lessons</span>
        </nav>
        <h1 className="font-semibold text-2xl leading-tight tracking-tight text-foreground" data-testid="text-lessons-title">Life Lessons</h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground sm:text-base sm:leading-6">
          Where Business Meets Life - Every Academy activity teaches a real-world skill
        </p>
      </section>

      <label htmlFor="lesson-filter-select" className="sr-only">Filter lessons by category</label>
      <select
        id="lesson-filter-select"
        value={activeFilter}
        onChange={(event) => setActiveFilter(event.target.value)}
        className="mb-3 min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground sm:hidden"
        data-testid="lesson-filter-select"
      >
        {filterTabs.map((tab) => (
          <option key={tab} value={tab}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</option>
        ))}
      </select>

      <div className="mb-4 hidden flex-wrap gap-2 sm:mb-6 sm:flex">
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
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={`rounded-md p-1.5 ${config.bgClass} shrink-0`}>
                      <Icon className={`h-4 w-4 ${config.textClass}`} />
                    </div>
                    <h3 className="min-w-0 break-words font-semibold">{lesson.businessConcept}</h3>
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
                  <p className="break-words text-sm italic">{lesson.reflection}</p>
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

      <details className="mt-6 sm:mt-8">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-card px-4 py-3 font-semibold text-foreground marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="rounded-md bg-primary/10 p-1.5">
            <Lightbulb className="h-4 w-4 text-primary" />
          </span>
          The Parallel Universe
          <span className="ml-auto text-xs font-normal text-muted-foreground">Optional background</span>
        </summary>
        <Card className="mt-2 p-4 sm:p-6" data-testid="section-parallel-universe">
          <p className="mb-2 text-muted-foreground">
            Every business skill you learn in the Academy has a life lesson behind it.
          </p>
          <p className="mb-5 text-muted-foreground">
            Stock trading teaches risk assessment. Campus building teaches project management. Your wallet teaches budgeting.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parallelMappings.map((m) => {
              const config = getConfig(m.area);
              const Icon = config.icon;
              return (
                <div
                  key={m.area}
                  className="flex min-w-0 items-center gap-2 rounded-md bg-muted/50 p-3"
                  data-testid={`mapping-${m.area}`}
                >
                  <div className={`rounded-md p-1.5 ${config.bgClass} shrink-0`}>
                    <Icon className={`h-4 w-4 ${config.textClass}`} />
                  </div>
                  <span className="min-w-0 break-words text-sm font-medium">{m.business}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 break-words text-sm text-muted-foreground">{m.life}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </details>
    </div>
  );
}
