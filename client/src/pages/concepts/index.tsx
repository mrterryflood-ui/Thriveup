import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Filter } from "lucide-react";
import { CONCEPTS, LANES, getLane, type ConceptLane } from "@/lib/concepts/registry";
import { cn } from "@/lib/utils";

export default function ConceptsHubPage() {
  const [filter, setFilter] = useState<ConceptLane | "all">("all");

  useEffect(() => {
    const prev = document.title;
    document.title = "ThriveUp Concepts — Engineering for the curious";
    return () => {
      document.title = prev;
    };
  }, []);

  const visible = filter === "all" ? CONCEPTS : CONCEPTS.filter((c) => c.lane === filter);

  return (
    <div className="min-h-screen bg-background" data-testid="concepts-hub">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <header className="mb-8">
          <Badge variant="outline" className="gap-1.5 mb-3">
            <Sparkles className="w-3 h-3" />
            ThriveUp Concepts · v1
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight" data-testid="text-hub-title">
            Engineering for the curious.
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl">
            Short, hands-on explainers about the systems we live inside. Each card is a
            90-second read with a working simulator behind the diagram. No certification, no
            quiz, no streak to defend.
          </p>
        </header>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Filter className="w-3 h-3" />
            Filter by lane
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              data-testid="button-filter-all"
            >
              All ({CONCEPTS.length})
            </Button>
            {LANES.map((lane) => {
              const count = CONCEPTS.filter((c) => c.lane === lane.slug).length;
              if (count === 0) return null;
              const Icon = lane.icon;
              return (
                <Button
                  key={lane.slug}
                  size="sm"
                  variant={filter === lane.slug ? "default" : "outline"}
                  onClick={() => setFilter(lane.slug)}
                  data-testid={`button-filter-${lane.slug}`}
                  className="gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {lane.label} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((card) => {
            const lane = getLane(card.lane);
            const LaneIcon = lane.icon;
            return (
              <Link key={card.slug} href={card.url} data-testid={`card-concept-${card.slug}`}>
                <Card className="h-full hover-elevate active-elevate-2 cursor-pointer border-amber-300/40 dark:border-amber-700/30">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="gap-1">
                        <LaneIcon className="w-3 h-3" />
                        {lane.label}
                      </Badge>
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      {card.hook}
                    </p>
                    <h2 className="text-lg font-bold leading-snug mb-2">{card.title}</h2>
                    <p className="text-sm text-muted-foreground leading-snug flex-1">
                      {card.subtitle}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">~90-sec read · live sim</span>
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-lg border bg-muted/30 p-6">
          <h2 className="font-bold mb-2">Who this is for</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• <strong>Curious adults</strong> who've always wondered how something works.</li>
            <li>• <strong>Parents</strong> trying to answer "why does it…" without bluffing.</li>
            <li>• <strong>Career-curious teens</strong> figuring out what engineering even is.</li>
            <li>• <strong>Tradespeople</strong> peeking at the lane next door.</li>
            <li>• <strong>Re-entry, foster youth, and anyone rebuilding confidence</strong> — low-stakes wins on real material.</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            Want a job in one of these fields? See{" "}
            <Link href="/academy/trade-sims" data-testid="link-trade-sims">
              <span className="text-primary hover:underline font-medium">Trade Sims</span>
            </Link>{" "}
            for the full lesson series, hands-on certification path, and apprenticeship pipeline.
          </p>
        </div>

        <div className={cn("mt-8 text-center text-xs text-muted-foreground")}>
          ThriveUp · Concepts · {CONCEPTS.length} cards · v1
        </div>
      </div>
    </div>
  );
}
