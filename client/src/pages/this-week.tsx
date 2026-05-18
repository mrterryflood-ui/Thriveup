import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Target,
  Flag,
  Rocket,
  ShieldCheck,
  ExternalLink,
  Clock,
  DollarSign,
} from "lucide-react";

/**
 * Monday Brief — the weekly priorities surface.
 *
 * Mixes three sources of truth:
 *   1. Dynamic grants closing soon (pulled from /api/grants/this-week)
 *   2. Curated ship targets for this week (declared here, edit weekly)
 *   3. Declared funder decisions in flight (sourced from replit.md memory)
 *
 * Iron Rule: every dated commitment cites where it lives. Memory entries
 * that change weekly are surfaced here so they cannot rot silently.
 */

interface GrantItem {
  id: number;
  title?: string;
  funder?: string;
  funderName?: string;
  closeDate?: string;
  fitScore?: number;
  detailUrl?: string;
  applyUrl?: string;
}

interface ThisWeekResponse {
  windowDays?: number;
  count?: number;
  grants?: GrantItem[];
}

const SHIP_TARGETS_THIS_WEEK = [
  {
    title: "Trade Sim #6 — Software Engineering — LIVE",
    detail:
      "Sixth trade added to the Trade Sims school. 15 lessons covering engineering mindset, architecture, algorithms, version control, testing, design patterns, scalability, code quality, security, and a shipped capstone. Pitch hook: 'anybody can vibe code, but you have to know how the system works to make vibecoding work.'",
    href: "/academy/trade-sims/software-engineering",
    status: "shipping",
  },
  {
    title: "Weekly Monday Brief at /this-week",
    detail:
      "A single URL surfacing dimensions / targets / goals every Monday. Now bookmarkable. Reviews depend on shared situational awareness.",
    href: "/this-week",
    status: "shipping",
  },
  {
    title: "Sitewide congruence audit — 0 FAIL maintained",
    detail:
      "Reviewer-ready posture all month. `npx tsx scripts/congruence-audit.ts` must hit 0 FAIL before every external briefing.",
    href: "/grant-command-center",
    status: "ongoing",
  },
  {
    title: "Trade Sims pilot ramp toward 200 learners by July 1",
    detail:
      "Top funder targets: Lowe's Gable CBO (Aug 1–Sep 3 window), TWC Skills Development Fund (rolling, needs ACC), Home Depot Path to Pro.",
    href: "/academy/trade-sims",
    status: "active",
  },
];

const FUNDER_DECISIONS_PENDING = [
  {
    name: "Smart Family Fund — Pitch C (Ecosystem)",
    submittedDate: "2026-05-17",
    decisionWindow: "November 2026",
    silenceWindow: "~6 months",
    note: "Submitted via smartfamilyfund.org/introduce-yourself. Plan 6mo silence as normal cycle. Summer parallel work: warm-intro outreach + diligence follow-up addressing scale-density caution.",
  },
  {
    name: "St. David's Foundation — community evaluation track",
    submittedDate: "ongoing",
    decisionWindow: "future cycles (CLC + Community Health Grants)",
    silenceWindow: "—",
    note: "WAB2 LOI declined 2026-05-15 (Regan Gruber Moffitt). Still a target via Community Health Grants cycles. Status: 'actively evaluating' — never 'in review' anywhere in pipeline.",
  },
];

const STRATEGIC_DIMENSIONS = [
  {
    icon: Rocket,
    label: "Build & Ship",
    target: "Ship every reviewable capability this month",
    goal: "Reviewers cannot ask for what is already on the platform; default to surfacing specifics from the capabilities inventory.",
  },
  {
    icon: Target,
    label: "Grant Discovery",
    target: "651 grants curated · fit ≥90 = 160",
    goal: "Re-investigate the 48hr scanner staleness (last write 2026-05-15). Run This Week digest preview before every funder meeting.",
  },
  {
    icon: ShieldCheck,
    label: "Truth-in-Claims",
    target: "0 stage-mismatch findings; 0 placeholder funders surfaced as 'awarded'",
    goal: "Every partnership badge cites stage + date. St. David's = 'actively evaluating' only. Smart Family Fund = 'submitted, awaiting decision' only.",
  },
  {
    icon: Flag,
    label: "Workforce & Trade Sims",
    target: "200 learners by July 1, 2026",
    goal: "Lock Lowe's Gable CBO submission window (Aug 1–Sep 3). Confirm ACC SDF co-applicant. Promote Trade Sim #6 to early cohort.",
  },
];

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ThisWeekPage() {
  useEffect(() => {
    document.title = "Monday Brief — Weekly Priorities | ThriveUp";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        "content",
        "Weekly Monday Brief: ship targets, grants closing this week, funder decisions pending, strategic dimensions and goals.",
      );
  }, []);

  const today = new Date();
  const weekLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { data: thisWeekGrants, isLoading: grantsLoading, isError: grantsError } = useQuery<ThisWeekResponse>({
    queryKey: ["/api/grants/this-week?days=14&minFit=0"],
  });

  const grants = thisWeekGrants?.grants ?? [];

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8" data-testid="page-this-week">
      {/* Hero */}
      <section className="space-y-3">
        <Badge variant="secondary" data-testid="badge-monday-brief">
          <CalendarDays className="h-3 w-3 mr-1" />
          Monday Brief
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-week-label">
          {weekLabel}
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          The single page for this week's dimensions, targets, and goals. Bookmark{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">/this-week</code> — it is the
          one URL to hit before any funder meeting, partner call, or internal sync.
        </p>
      </section>

      {/* Dimensions / Targets / Goals */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold" data-testid="text-dimensions-heading">
          Strategic dimensions, targets, and goals
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {STRATEGIC_DIMENSIONS.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.label} data-testid={`card-dimension-${d.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{d.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Target</div>
                    <div className="font-medium">{d.target}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Goal</div>
                    <div className="text-sm text-muted-foreground">{d.goal}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Ship targets this week */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold" data-testid="text-ship-targets-heading">
          Ship targets this week
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {SHIP_TARGETS_THIS_WEEK.map((s) => (
            <Card key={s.title} className="hover-elevate" data-testid={`card-ship-${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <Badge variant={s.status === "shipping" ? "default" : "secondary"}>
                    {s.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{s.detail}</p>
                <Button asChild variant="outline" size="sm" data-testid={`link-ship-${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`}>
                  <Link href={s.href}>Open →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Grants closing soon */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold" data-testid="text-grants-heading">
            Grants closing in the next 14 days
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/grant-command-center">Open Command Center →</Link>
          </Button>
        </div>
        {grantsLoading && (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        )}
        {!grantsLoading && grantsError && (
          <Card data-testid="card-grants-error" className="border-destructive">
            <CardContent className="pt-6 text-center text-sm text-destructive">
              Couldn't load grants closing this week. Check the live pipeline at{" "}
              <Link href="/grant-command-center" className="underline">
                Grant Command Center
              </Link>{" "}
              and refresh.
            </CardContent>
          </Card>
        )}
        {!grantsLoading && !grantsError && grants.length === 0 && (
          <Card data-testid="card-no-grants-this-week">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No tracked grants close in the next 14 days. (Check{" "}
              <Link href="/grant-command-center" className="underline">
                Grant Command Center
              </Link>{" "}
              for the full pipeline.)
            </CardContent>
          </Card>
        )}
        {!grantsLoading && grants.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {grants.slice(0, 8).map((g) => {
              const days = daysUntil(g.closeDate);
              return (
                <Card key={g.id} data-testid={`card-grant-${g.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-2">{g.title ?? "Untitled grant"}</CardTitle>
                    <CardDescription>{g.funderName ?? g.funder ?? "Funder TBD"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-sm">
                      {typeof g.fitScore === "number" && (
                        <Badge variant={g.fitScore >= 80 ? "default" : "secondary"}>
                          Fit {Math.round(g.fitScore)}
                        </Badge>
                      )}
                      {g.closeDate && (
                        <Badge variant="outline" className="font-normal">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(g.closeDate)}
                          {days !== null && days >= 0 ? ` · ${days}d` : ""}
                        </Badge>
                      )}
                    </div>
                    {(g.detailUrl || g.applyUrl) && (
                      <Button asChild variant="outline" size="sm">
                        <a href={g.detailUrl ?? g.applyUrl} target="_blank" rel="noreferrer">
                          Funder source <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Funder decisions pending */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold" data-testid="text-decisions-heading">
          Funder decisions pending
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FUNDER_DECISIONS_PENDING.map((f) => (
            <Card key={f.name} data-testid={`card-decision-${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{f.name}</CardTitle>
                <CardDescription>
                  <DollarSign className="h-3 w-3 inline mr-1" />
                  Submitted {f.submittedDate} · decision {f.decisionWindow} · silence{" "}
                  {f.silenceWindow}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="text-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Sources of truth: <code>docs/active-commitments.md</code>,{" "}
          <code>docs/memory-archive.md</code>, <code>replit.md</code>, and the live grant pipeline at{" "}
          <Link href="/grant-command-center" className="underline">
            /grant-command-center
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
