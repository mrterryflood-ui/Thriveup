import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { ChevronLeft, CheckCircle2, Circle, Lock, Trophy } from "lucide-react";
import type { LessonGrowthState } from "../../../../../shared/trade-sims-growth";

interface TradeRow {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
}
interface LessonRow {
  id: number;
  tradeId: number;
  slug: string;
  title: string;
  shortDescription: string;
  dayNumber: number;
  concept: { engineMode?: string; blurb?: string; keyTerms?: Array<{ term: string; definition: string }> } | null;
  credentialPathway: string;
}
interface ProgressRow {
  lessonId: number;
  status: string;
  soloScore: number | null;
  guidedScore: number | null;
}

import { anonSessionId } from "@/lib/trade-sims/anon-session";

export default function TradeDetailPage() {
  const [, params] = useRoute("/academy/trade-sims/:tradeSlug");
  const tradeSlug = params?.tradeSlug ?? "";

  const { data, isLoading } = useQuery<{ trade: TradeRow; lessons: LessonRow[] }>({
    queryKey: ["/api/trade-sims/lessons", tradeSlug],
    enabled: !!tradeSlug,
  });

  const { data: progressRows } = useQuery<ProgressRow[]>({
    queryKey: ["/api/trade-sims/progress", tradeSlug],
    enabled: !!tradeSlug,
    queryFn: async () => {
      const res = await fetch(`/api/trade-sims/progress/${tradeSlug}`, {
        headers: { "x-anon-session": anonSessionId() },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Adaptive growth path: unlock state per lesson (mastery gating).
  const { data: growthData } = useQuery<{ tradeId: number; lessons: LessonGrowthState[] }>({
    queryKey: ["/api/trade-sims/growth", tradeSlug],
    enabled: !!tradeSlug,
    queryFn: async () => {
      const res = await fetch(`/api/trade-sims/growth/${tradeSlug}`, {
        headers: { "x-anon-session": anonSessionId() },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
  const growthByLessonId = new Map<number, LessonGrowthState>();
  (growthData?.lessons ?? []).forEach((g) => growthByLessonId.set(g.lessonId, g));

  useEffect(() => {
    if (data?.trade) {
      document.title = `${data.trade.name} — ThriveUp Trade Sims`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", `${data.trade.tagline}. ${data.trade.description}`);
    }
  }, [data?.trade]);

  const progressByLessonId = new Map<number, ProgressRow>();
  (progressRows ?? []).forEach((p) => progressByLessonId.set(p.lessonId, p));

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardContent className="pt-6 text-center" data-testid="text-trade-not-found">
            Trade not found.
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/academy/trade-sims">← Back to trades</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { trade, lessons } = data;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" data-testid="button-back-trades">
          <Link href="/academy/trade-sims">
            <ChevronLeft className="h-4 w-4 mr-1" /> All trades
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-trade-name">{trade.name}</h1>
        <p className="text-lg text-muted-foreground" data-testid="text-trade-tagline">{trade.tagline}</p>
        <p className="text-sm text-muted-foreground max-w-3xl">{trade.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((l) => {
          const p = progressByLessonId.get(l.id);
          const g = growthByLessonId.get(l.id);
          const completed = p?.status === "completed";
          const inProgress = p?.status === "in_progress" || p?.status === "attempted";
          const locked = !!g && !g.unlocked;
          const engineMode = l.concept?.engineMode ?? "concept-only";
          return (
            <Link key={l.id} href={`/academy/trade-sims/${tradeSlug}/${l.slug}`}>
              <Card
                className={`hover-elevate cursor-pointer h-full ${locked ? "opacity-60" : ""}`}
                data-testid={`card-lesson-${l.slug}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline">Day {l.dayNumber}</Badge>
                      {locked && (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-locked-${l.slug}`}>
                          <Lock className="h-3 w-3 mr-1" /> Pass Day {l.dayNumber - 1} first
                        </Badge>
                      )}
                      {g?.stretchPassed && (
                        <Trophy className="h-4 w-4 text-amber-500" data-testid={`icon-stretch-${l.slug}`} />
                      )}
                    </div>
                    {completed && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" data-testid={`icon-complete-${l.slug}`} />
                    )}
                    {inProgress && !completed && (
                      <Circle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <CardTitle className="text-base" data-testid={`text-lesson-title-${l.slug}`}>
                    {l.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{l.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{engineMode}</Badge>
                    {p?.soloScore != null && (
                      <span data-testid={`text-score-${l.slug}`}>Best: {Math.round(p.soloScore)}%</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
