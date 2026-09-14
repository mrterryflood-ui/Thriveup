import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { JsonLd } from "@/components/json-ld";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MapPin, Quote, Sparkles, ArrowRight, Globe2 } from "lucide-react";

type Theme = {
  title: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  memberPinIds: string[];
  recommendedPlatforms: string[];
  confidence: number;
};

type Insight = {
  generatedAt: string;
  pinCount: number;
  themes: Theme[];
  syncedToStoryAt: string | null;
  stakeholderBreakdown: Record<string, number>;
};

type Pin = { id: string; body: string; category: string; sentiment: string | null; crisisFlag: boolean; createdAt: string; displayName: string | null; anonymized: boolean };
type Project = { id: number; slug: string; name: string; description: string | null; centerLat: number; centerLng: number };

const PLATFORM_LABELS: Record<string, string> = {
  "whole-person-health": "Whole-Person Health",
  "lifebridge": "LifeBridge",
  "safe-cogni-care": "SafeCogniCare",
  "sankofa-health-network": "Sankofa Health Network",
  "trade-sims": "Trade Sims",
  "mission-transition": "Mission Transition",
  "isss": "ISSS",
  "foster-youth": "Foster Youth Wizard",
  "civic-signal": "Civic Signal",
};

export default function VoiceStoryPage() {
  const [, params] = useRoute("/voice/:slug/story");
  const slug = params?.slug ?? "";

  const projectQ = useQuery<{ project: Project }>({ queryKey: ["/api/voice/projects", slug], enabled: !!slug });
  const insightQ = useQuery<{ insight: Insight | null }>({ queryKey: ["/api/voice/projects", slug, "insights", "latest"], enabled: !!slug });
  const pinsQ = useQuery<{ pins: Pin[] }>({ queryKey: ["/api/voice/projects", slug, "pins"], enabled: !!slug });

  const project = projectQ.data?.project;
  const insight = insightQ.data?.insight ?? null;
  const pins = pinsQ.data?.pins ?? [];

  // Pick 3 anonymized verbatims per theme for the story page
  const verbatimsByTheme = useMemo(() => {
    if (!insight) return [];
    return insight.themes.map((t) => ({
      theme: t,
      voices: t.memberPinIds
        .map((id) => pins.find((p) => p.id === id))
        .filter((p): p is Pin => !!p && (p.body ?? "").trim().length > 0)
        .slice(0, 3),
    }));
  }, [insight, pins]);

  const totalVoices = insight?.pinCount ?? pins.length;
  const lastSync = insight?.syncedToStoryAt ? new Date(insight.syncedToStoryAt).toLocaleDateString() : null;

  const articleSchema = project ? {
    "@context": "https://schema.org",
    "@type": "Report",
    "name": project.name,
    "description": project.description ?? "A community storytelling report surfacing resident voices, themes, and priorities from the ThriveUp Voice platform.",
    "about": {
      "@type": "Thing",
      "name": project.name
    },
    "publisher": {
      "@type": "Organization",
      "name": "ThriveUp Academy",
      "url": "https://ai-mastery-academy.replit.app/"
    },
    "url": `https://ai-mastery-academy.replit.app/voice/${slug}/story`
  } : null;

  return (
    <div className="container max-w-5xl py-8 px-4">
      {articleSchema && <JsonLd data={articleSchema} />}
      <Link href={`/voice/${slug}`} data-testid="link-back-to-map">
        <Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to the map</Button>
      </Link>

      <header className="text-center py-10 mb-8 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border" data-testid="story-hero">
        <Badge variant="outline" className="mb-3"><Heart className="h-3 w-3 mr-1" />#DATA storytelling</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{project?.name ?? "Loading…"}</h1>
        {project?.description && <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{project.description}</p>}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2"><Quote className="h-4 w-4 text-primary" /><span className="font-semibold">{totalVoices}</span> voice{totalVoices === 1 ? "" : "s"} heard</div>
          {insight && <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span className="font-semibold">{insight.themes.length}</span> themes surfaced</div>}
          {lastSync && <div className="text-muted-foreground">Updated {lastSync}</div>}
        </div>
        <p className="text-sm mt-6 font-medium">Thank you to every neighbor who shared their voice. This page is yours.</p>
      </header>

      {!insight ? (
        <Card data-testid="story-empty">
          <CardContent className="py-12 text-center space-y-3">
            <h2 className="text-xl font-semibold">The story is still being written.</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Once enough voices are shared and the project owner publishes the themes, you'll see them here. Add yours on the map.</p>
            <Link href={`/voice/${slug}`}><Button data-testid="button-add-voice"><MapPin className="h-4 w-4 mr-1" />Add your voice</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          <section data-testid="story-themes">
            <h2 className="text-2xl font-semibold mb-6 text-center">What we heard</h2>
            <div className="space-y-8">
              {verbatimsByTheme.map(({ theme, voices }, i) => (
                <Card key={i} className="overflow-hidden" data-testid={`story-theme-${i}`}>
                  <CardHeader className="bg-muted/40">
                    <CardTitle className="text-xl">{theme.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{theme.summary}</CardDescription>
                  </CardHeader>
                  {voices.length > 0 && (
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {voices.map((v) => (
                          <blockquote key={v.id} className="border-l-4 border-primary/30 pl-4 py-1 italic text-sm" data-testid={`story-quote-${v.id}`}>
                            <Quote className="h-3 w-3 inline mr-1 text-primary/40" aria-hidden="true" />
                            "{v.body}"
                            <footer className="text-xs not-italic text-muted-foreground mt-1">— {v.anonymized || !v.displayName ? "Anonymous neighbor" : v.displayName}</footer>
                          </blockquote>
                        ))}
                      </div>
                      {theme.recommendedPlatforms.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Globe2 className="h-3 w-3" />Where this leads in our ecosystem</div>
                          <div className="flex flex-wrap items-center gap-2">
                            {theme.recommendedPlatforms.map((p, j) => (
                              <span key={p} className="flex items-center gap-2">
                                <Badge variant="secondary">{PLATFORM_LABELS[p] ?? p}</Badge>
                                {j < theme.recommendedPlatforms.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </section>

          <section data-testid="story-cta" className="text-center py-10 rounded-2xl border bg-primary/5">
            <h3 className="text-2xl font-semibold mb-2">Your voice belongs here too.</h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">Every pin gets read. Crisis pins are flagged for the project’s local safety review process. Service-working pins celebrate what's already good.</p>
            <Link href={`/voice/${slug}`}><Button size="lg" data-testid="button-add-yours"><MapPin className="h-4 w-4 mr-1" />Drop a pin</Button></Link>
          </section>
        </div>
      )}
    </div>
  );
}
