import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Sparkles, ArrowRight, type LucideIcon } from "lucide-react";
import { getLane, type ConceptLane } from "@/lib/concepts/registry";

interface RelatedLink {
  url: string;
  label: string;
  note?: string;
}

interface Props {
  lane: ConceptLane;
  hook: string;
  title: string;
  subtitle?: string;
  metaTitle: string;
  metaDescription: string;
  simulator: ReactNode;
  explainer: ReactNode;
  related?: RelatedLink[];
  /** Optional secondary diagram below the simulator (e.g. for the pumpjack reference image). */
  referenceDiagram?: ReactNode;
}

export function ConceptCardShell({
  lane,
  hook,
  title,
  subtitle,
  metaTitle,
  metaDescription,
  simulator,
  explainer,
  related,
  referenceDiagram,
}: Props) {
  const laneMeta = getLane(lane);
  const LaneIcon: LucideIcon = laneMeta.icon;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = metaTitle;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    let created = false;
    let prevContent = "";
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
      created = true;
    } else {
      prevContent = meta.content;
    }
    meta.content = metaDescription;
    return () => {
      document.title = prevTitle;
      if (created) meta?.remove();
      else if (meta) meta.content = prevContent;
    };
  }, [metaTitle, metaDescription]);

  return (
    <div className="min-h-screen bg-background" data-testid={`concept-page-${lane}`}>
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
          <Link href="/concepts" data-testid="link-back-concepts">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              All Concepts
            </Button>
          </Link>
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="w-3 h-3" />
            ThriveUp Concepts
            <span className="opacity-60">·</span>
            <LaneIcon className="w-3 h-3" />
            {laneMeta.label}
          </Badge>
        </div>

        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {hook}
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mt-2"
            data-testid="text-concept-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-base text-muted-foreground leading-snug" data-testid="text-concept-subtitle">
              {subtitle}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            ~90-second read · live simulator · no quiz, no grade
          </p>
        </header>

        <Card className="mb-6 border-amber-300/60 dark:border-amber-700/60">
          <CardContent className="p-4 md:p-6">{simulator}</CardContent>
        </Card>

        {referenceDiagram && <div className="mb-6">{referenceDiagram}</div>}

        <article className="prose prose-slate dark:prose-invert max-w-none mb-8">
          {explainer}
        </article>

        {related && related.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-5 mb-6">
            <p className="font-semibold text-sm mb-3">Want to go further?</p>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.url}>
                  <Link href={r.url} data-testid={`link-related-${r.url}`}>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                      {r.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                  {r.note && <p className="text-xs text-muted-foreground mt-0.5">{r.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border bg-muted/20 p-5 text-sm">
          <p className="font-semibold mb-2">About ThriveUp Concepts</p>
          <p className="text-muted-foreground leading-relaxed">
            Short, hands-on explainers about the engineering behind everyday things. No
            certification, no quiz, no streak to defend — just the satisfying feeling of finally
            understanding how something works.
          </p>
          <p className="mt-3">
            <Link href="/concepts" data-testid="link-all-concepts">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Browse all Concepts
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          ThriveUp Academy · Concepts · v1
        </div>
      </div>
    </div>
  );
}
