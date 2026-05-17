import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Wrench, Wind, Flame, Car, BookOpen, Sparkles, Globe, GraduationCap } from "lucide-react";
import { useEffect } from "react";

interface TradeRow {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  iconKey: string;
  displayOrder: number;
}

const ICONS: Record<string, typeof Zap> = {
  electrical: Zap,
  plumbing: Wrench,
  hvac: Wind,
  welding: Flame,
  automotive: Car,
};

export default function TradeSimsLandingPage() {
  const { data: trades, isLoading } = useQuery<TradeRow[]>({
    queryKey: ["/api/trade-sims/trades"],
  });

  useEffect(() => {
    document.title = "ThriveUp Trade Sims — Free game-based skilled-trades learning";
    const desc = document.querySelector('meta[name="description"]');
    const content =
      "Free, open-access game-based simulators for skilled trades: electrical, plumbing, HVAC, welding, automotive. Five-loop pedagogy with built-in AI tutor and credential pathways.";
    if (desc) desc.setAttribute("content", content);
  }, []);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      {/* Hero */}
      <section className="text-center space-y-4">
        <Badge variant="secondary" className="mx-auto" data-testid="badge-hero-free">
          Free · open access · login optional
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="text-hero-title">
          ThriveUp Trade Sims
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-tagline">
          Learn a skilled trade the way you'd learn a video game: build it, break it, fix it, repeat.
          Five-loop lessons — Concept → Guided → Solo → Sandbox → AI Debrief — built around a real physics
          engine, not a quiz.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" /> AI tutor in every lesson
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-primary" /> 10+ languages
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-primary" /> Credential pathways included
          </div>
        </div>
      </section>

      {/* Trades grid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold" data-testid="text-trades-heading">Pick a trade</h2>
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        )}
        {trades && trades.length === 0 && (
          <Card data-testid="card-no-trades">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No trades available yet. Check back soon.
            </CardContent>
          </Card>
        )}
        {trades && trades.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trades.map((t) => {
              const Icon = ICONS[t.slug] ?? BookOpen;
              return (
                <Link key={t.id} href={`/academy/trade-sims/${t.slug}`}>
                  <Card
                    className="hover-elevate cursor-pointer h-full"
                    data-testid={`card-trade-${t.slug}`}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle data-testid={`text-trade-name-${t.slug}`}>{t.name}</CardTitle>
                          <CardDescription>{t.tagline}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{t.description}</p>
                      <div className="mt-3">
                        <Badge variant="outline">15 lessons · ~15 days</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="space-y-3 pt-4 border-t">
        <h2 className="text-xl font-semibold">How the 5-loop works</h2>
        <div className="grid gap-3 md:grid-cols-5 text-sm">
          {[
            ["Concept", "Short blurb + key terms. The canvas is the teacher, not the text."],
            ["Guided", "Steps with hints. Checks against the live simulation, not against multiple choice."],
            ["Solo", "Challenge prompt. Build it your way. Score = correctness × time × elegance."],
            ["Sandbox", "Free play. Save your project. Share with peers."],
            ["Debrief", "AI tutor summarizes what you learned and points you to the next credential step."],
          ].map(([title, body]) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="text-center pt-4">
        <Button asChild variant="outline" data-testid="button-back-academy">
          <Link href="/academy">← Back to ThriveUp Academy</Link>
        </Button>
      </div>
    </div>
  );
}
