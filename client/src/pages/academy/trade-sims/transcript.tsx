/**
 * ThriveUp Trade Sims — Skills Transcript.
 *
 * Printable / shareable record of what a learner actually did across a
 * trade's 16-day curriculum: lessons completed, evidence type (interactive
 * simulation vs. concept study), scores, attempts, dates, and the named
 * credential pathways this training PREPARES the learner for.
 *
 * Anti-fabrication contract (mirrors the server payload):
 *  - The disclaimer from the API is always rendered, on screen AND in print.
 *  - Simulation evidence is labeled as simulation evidence, never as a
 *    credential. "Preparation for" is the strongest claim made anywhere.
 */

import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, Printer, Share2, ShieldCheck, Award, CheckCircle2,
  Circle, ExternalLink, GraduationCap, FlaskConical, BookOpen, Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { anonSessionId } from "@/lib/trade-sims/anon-session";
import { useToast } from "@/hooks/use-toast";

interface TranscriptLesson {
  dayNumber: number;
  title: string;
  shortDescription: string | null;
  evidenceType: "interactive_simulation" | "concept_study";
  keyConcepts: string[];
  soloSuccessCriteria: string | null;
  credentialPathway: string | null;
  status: string;
  completed: boolean;
  soloScore: number | null;
  attemptCount: number;
  completedAt: string | null;
}

interface TranscriptResponse {
  tradeSlug: string;
  tradeName: string;
  generatedAt: string;
  learner: { kind: "account" | "anonymous" | "none" };
  summary: { totalLessons: number; completedLessons: number; complete: boolean };
  lessons: TranscriptLesson[];
  certificate: { id: string; levelTitle: string; issuedAt: string | null } | null;
  preparationFor: Array<{ name: string; sponsor: string; level: string; sponsorUrl: string }>;
  disclaimer: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export default function TradeSimsTranscriptPage() {
  const { tradeSlug } = useParams<{ tradeSlug: string }>();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<TranscriptResponse>({
    queryKey: ["/api/trade-sims/transcript", tradeSlug],
    queryFn: async () => {
      const res = await fetch(`/api/trade-sims/transcript/${tradeSlug}`, {
        headers: { "x-anon-session": anonSessionId() },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!tradeSlug,
  });

  useEffect(() => {
    if (data?.tradeName) {
      document.title = `${data.tradeName} Skills Transcript — ThriveUp Trade Sims`;
    }
  }, [data?.tradeName]);

  const handleShare = async () => {
    // Employers must get the PUBLIC verification link (keyed by certificate id)
    // — this page itself only ever shows the visitor their own progress.
    const url = data?.certificate
      ? `${window.location.origin}/verify/trade-cert/${data.certificate.id}`
      : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${data?.tradeName ?? "Trade"} Skills Transcript — ThriveUp Trade Sims`,
          text: data?.certificate
            ? "Verified simulation-based training certificate from ThriveUp Trade Sims."
            : "My simulation-based training transcript from ThriveUp Trade Sims.",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: data?.certificate
          ? "Public verification link copied — anyone with it can verify your certificate."
          : "Transcript link copied. Note: it shows each visitor their own progress; finish the course to get a shareable verification link.",
      });
    } catch {
      // User cancelled the share sheet — not an error.
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4" data-testid="page-transcript-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Alert variant="destructive" data-testid="alert-transcript-error">
          <AlertTitle>Couldn't load transcript</AlertTitle>
          <AlertDescription>
            We couldn't build the transcript for this trade. Please try again or pick a different trade.
          </AlertDescription>
        </Alert>
        <Link href="/academy/trade-sims">
          <Button variant="outline" className="mt-4" data-testid="button-back-trades">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Trade Sims
          </Button>
        </Link>
      </div>
    );
  }

  const pct = data.summary.totalLessons > 0
    ? Math.round((data.summary.completedLessons / data.summary.totalLessons) * 100)
    : 0;

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 space-y-5 print:py-0 print:space-y-3" data-testid="page-transcript">
      {/* Screen-only nav + actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <Link href={`/academy/trade-sims/${tradeSlug}/certify`}>
          <Button variant="ghost" size="sm" data-testid="button-back-certify">
            <ChevronLeft className="h-4 w-4 mr-1" /> Credentials
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share-transcript">
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
          <Button size="sm" onClick={() => window.print()} data-testid="button-print-transcript">
            <Printer className="h-4 w-4 mr-1" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="space-y-1 border-b pb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">ThriveUp Trade Sims — Skills Transcript</p>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-transcript-title">
          {data.tradeName} — Simulation-Based Training Record
        </h1>
        <p className="text-sm text-muted-foreground">
          Generated {fmtDate(data.generatedAt)} · {data.summary.completedLessons} of {data.summary.totalLessons} lessons complete ({pct}%)
        </p>
        {data.learner.kind === "anonymous" && (
          <p className="text-xs text-amber-700 dark:text-amber-400 print:hidden" data-testid="text-anon-note">
            You're using a guest session — this record lives in this browser only. Sign in to earn a certificate tied to your account.
          </p>
        )}
      </header>

      {/* Certificate block */}
      {data.summary.complete ? (
        data.certificate ? (
          <Card className="border-green-600/40" data-testid="card-certificate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" /> Certificate of Completion
              </CardTitle>
              <CardDescription>
                {data.certificate.levelTitle} · Issued {fmtDate(data.certificate.issuedAt)} · ID {data.certificate.id.slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                This certificate documents completion of all {data.summary.totalLessons} lessons of the ThriveUp {data.tradeName} simulation
                curriculum. It certifies simulated skill practice — not an industry license or credential.
              </p>
              <a
                href={`/api/export/trade-cert-pdf/${data.certificate.id}`}
                download
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md border border-green-600/40 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors"
                data-testid="link-download-cert-pdf"
              >
                <Download className="h-3.5 w-3.5" />Download Certificate PDF
              </a>
            </CardContent>
          </Card>
        ) : (
          <Alert data-testid="alert-signin-cert">
            <Award className="h-4 w-4" />
            <AlertTitle>All lessons complete — sign in to receive your certificate</AlertTitle>
            <AlertDescription>
              You finished every lesson in this browser session. Create an account or sign in so your certificate is issued and saved
              to your profile permanently.
            </AlertDescription>
          </Alert>
        )
      ) : (
        <Alert data-testid="alert-incomplete">
          <GraduationCap className="h-4 w-4" />
          <AlertTitle>Course in progress</AlertTitle>
          <AlertDescription>
            Complete all {data.summary.totalLessons} lessons to receive a certificate of completion. This transcript shows your
            verified progress so far.
          </AlertDescription>
        </Alert>
      )}

      {/* Honest disclosure — always visible, screen and print */}
      <Alert data-testid="alert-transcript-disclaimer">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>What this document is — and isn't</AlertTitle>
        <AlertDescription>{data.disclaimer}</AlertDescription>
      </Alert>

      {/* Lesson evidence table */}
      <Card data-testid="card-lesson-evidence">
        <CardHeader>
          <CardTitle>Lesson-by-lesson evidence</CardTitle>
          <CardDescription>
            "Interactive simulation" means the learner built and ran a physics-based sim that graded their work.
            "Concept study" means reading plus a written reflection reviewed for length and engagement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.lessons.map((l) => (
            <div
              key={l.dayNumber}
              className={`border rounded-md p-3 space-y-1.5 ${l.completed ? "" : "opacity-60"}`}
              data-testid={`row-lesson-${l.dayNumber}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  {l.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-semibold text-sm">Day {l.dayNumber}: {l.title}</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {l.evidenceType === "interactive_simulation" ? (
                      <><FlaskConical className="h-3 w-3 mr-1" /> Interactive simulation</>
                    ) : (
                      <><BookOpen className="h-3 w-3 mr-1" /> Concept study</>
                    )}
                  </Badge>
                  {l.completed && l.soloScore !== null && (
                    <Badge variant="secondary" className="text-[10px]" data-testid={`badge-score-${l.dayNumber}`}>
                      Score {l.soloScore}%
                    </Badge>
                  )}
                </div>
              </div>
              {l.completed && (
                <p className="text-xs text-muted-foreground">
                  Completed {fmtDate(l.completedAt)}{l.attemptCount > 1 ? ` · ${l.attemptCount} attempts` : ""}
                </p>
              )}
              {l.keyConcepts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Concepts covered:</span> {l.keyConcepts.join(", ")}
                </p>
              )}
              {l.completed && l.soloSuccessCriteria && l.evidenceType === "interactive_simulation" && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Sim pass criteria:</span> {l.soloSuccessCriteria}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preparation-for credentials */}
      {data.preparationFor.length > 0 && (
        <Card data-testid="card-preparation-for">
          <CardHeader>
            <CardTitle>Credential pathways this training prepares for</CardTitle>
            <CardDescription>
              Preparation only. Earning any credential below requires the sponsor's own exam, fees, and eligibility process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.preparationFor.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-2 flex-wrap text-sm border rounded-md p-2.5">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.sponsor}</p>
                </div>
                <a
                  href={c.sponsorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="print:hidden"
                  data-testid={`link-prep-${c.name.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <Button variant="ghost" size="sm">
                    Sponsor <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Print footer */}
      <p className="hidden print:block text-xs text-muted-foreground border-t pt-2">
        ThriveUp Trade Sims skills transcript · generated {fmtDate(data.generatedAt)} · simulation-based training evidence only, not an industry credential.
      </p>
    </div>
  );
}
