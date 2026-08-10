import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Wrench, Wind, Flame, Car, Code, BookOpen, Sparkles, Globe, GraduationCap } from "lucide-react";
import { IntegrationInvitation } from "@/components/integration-invitation";
import { useEffect } from "react";

interface TradeRow {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  iconKey: string;
  displayOrder: number;
  /** Count of active lessons, derived server-side from the lessons table. */
  lessonCount: number;
}

const ICONS: Record<string, typeof Zap> = {
  electrical: Zap,
  plumbing: Wrench,
  hvac: Wind,
  welding: Flame,
  automotive: Car,
  "software-engineering": Code,
};

export default function TradeSimsLandingPage() {
  const { data: trades, isLoading } = useQuery<TradeRow[]>({
    queryKey: ["/api/trade-sims/trades"],
  });

  useEffect(() => {
    document.title = "ThriveUp Trade Sims — Free game-based skilled-trades learning";
    const desc = document.querySelector('meta[name="description"]');
    const content =
      "Free, open-access game-based simulators for skilled trades: electrical, plumbing, HVAC, welding, automotive, and software engineering. Five-loop pedagogy with built-in AI tutor and credential pathways.";
    if (desc) desc.setAttribute("content", content);
  }, []);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      <IntegrationInvitation
        surface="trade-sims"
        prompt="Are you already certified — and could you teach this?"
        description="Working welders, master plumbers, journeyman electricians, ASE techs, line crews — if you've got the card and the years, you could mentor a learner inside these sims. We'll route stipends and credentialing-prep referrals when the fit lines up."
        suggestedRoleTags={["master welder", "journeyman electrician", "master plumber", "ASE-certified tech", "lineman", "HVAC tech", "skilled trade instructor"]}
      />
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
                        {t.lessonCount > 0 && (
                          <Badge variant="outline">
                            {t.lessonCount} {t.lessonCount === 1 ? "lesson" : "lessons"}
                          </Badge>
                        )}
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

      {/* What happens after Day 15? → Workforce Pathways hub */}
      <section className="pt-4 border-t">
        <Card className="bg-primary/5 border-primary/20" data-testid="card-after-day-15">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">What happens after Day 15?</CardTitle>
            </div>
            <CardDescription>
              Every trade ends in a capstone certificate — then a named next step:
              an ACC certificate, an apprenticeship intake (UA Local 286, PHCC,
              SMART Local 67), or a credential exam (NATE, EPA 608, AWS D1.1, ASE).
              See the whole journey — what it takes, how long, what you earn — on one page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild data-testid="button-workforce-pathways">
              <Link href="/workforce">Explore Workforce Pathways →</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="text-center pt-4">
        <Button asChild variant="outline" data-testid="button-back-academy">
          <Link href="/academy">← Back to ThriveUp Academy</Link>
        </Button>
      </div>
    </div>
  );
}
