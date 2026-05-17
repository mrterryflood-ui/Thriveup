/**
 * ThriveUp Trade Sims — Certify page.
 *
 * Gated landing after lesson completion. Shows:
 *  - Industry certifications the learner can now pursue (catalog).
 *  - Registered apprenticeship pathways and locator URLs.
 *  - Practice question banks (locked until ≥80% lesson completion).
 *
 * Honesty discipline: every cert card links to its sponsor and says
 * "verify fees and scheduling before paying." Practice questions are
 * explicitly labeled "study questions, not official exam content."
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink, Lock, GraduationCap, Hammer, ShieldCheck, Sparkles, Circle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface CertItem {
  slug: string;
  name: string;
  sponsor: string;
  level: "entry" | "journey" | "specialty" | "safety";
  whatItProves: string;
  examDomains: string[];
  unlocks: string[];
  sponsorUrl: string;
  eligibility: string;
  hasPerformanceTest: boolean;
  practiceAvailable: boolean;
}

interface ApprPathway {
  slug: string;
  name: string;
  sponsor: string;
  scope: string;
  typicalLength: string;
  earningStructure: string;
  entrySteps: string[];
  locatorUrl: string;
  programInfoUrl?: string;
  notes?: string;
}

interface CertifyResponse {
  tradeSlug: string;
  unlockThreshold: number;
  progress: {
    totalLessons: number;
    completedLessons: number;
    fractionComplete: number;
    unlocked: boolean;
  };
  certifications: { intro: string; items: CertItem[] };
  apprenticeships: {
    intro: string;
    pathways: ApprPathway[];
    universalLocators: Record<string, string>;
  };
}

interface PracticeQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  rationale: string;
}

interface PracticeResponse {
  certSlug: string;
  tradeSlug: string;
  intro: string;
  disclaimer: string;
  questions: PracticeQuestion[];
}

const LEVEL_LABEL: Record<CertItem["level"], string> = {
  entry: "Entry credential",
  journey: "Journey-level",
  specialty: "Specialty",
  safety: "Safety card",
};

const LEVEL_COLOR: Record<CertItem["level"], string> = {
  entry: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
  journey: "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
  specialty: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  safety: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
};

export default function TradeSimsCertifyPage() {
  const { tradeSlug } = useParams<{ tradeSlug: string }>();
  const [activeCertSlug, setActiveCertSlug] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<CertifyResponse>({
    queryKey: ["/api/trade-sims/certifications", tradeSlug],
    enabled: !!tradeSlug,
  });

  const tradeName = tradeSlug ? tradeSlug.charAt(0).toUpperCase() + tradeSlug.slice(1) : "";
  useEffect(() => {
    if (tradeName) {
      document.title = `${tradeName} Certifications & Apprenticeships — ThriveUp Trade Sims`;
    }
  }, [tradeName]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl py-8 space-y-6" data-testid="page-certify-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <Alert variant="destructive" data-testid="alert-certify-error">
          <AlertTitle>Couldn't load credentials</AlertTitle>
          <AlertDescription>
            We couldn't load the credential catalog for this trade. Please try again or pick a different trade.
          </AlertDescription>
        </Alert>
        <Link href="/academy/trade-sims" data-testid="link-back-trade-sims">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Trade Sims
          </Button>
        </Link>
      </div>
    );
  }

  const unlockPct = Math.round(data.unlockThreshold * 100);
  const progressPct = Math.round(data.progress.fractionComplete * 100);

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6" data-testid="page-certify">
      {/* Back link + header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href={`/academy/trade-sims/${tradeSlug}`} data-testid="link-back-trade">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> {tradeName} lessons
          </Button>
        </Link>
        <Badge variant="outline" data-testid="badge-progress-summary">
          {data.progress.completedLessons} / {data.progress.totalLessons} lessons complete
        </Badge>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-certify-title">
          {tradeName} — Credentials & Apprenticeships
        </h1>
        <p className="text-muted-foreground" data-testid="text-certify-subtitle">
          Real industry credentials and registered apprenticeship pathways for {tradeName}. Free, sponsor-verified, and yours to pursue.
        </p>
      </header>

      {/* Progress + unlock summary */}
      <Card data-testid="card-unlock-status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {data.progress.unlocked ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" /> Practice tests unlocked
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" /> Practice tests locked
              </>
            )}
          </CardTitle>
          <CardDescription>
            {data.progress.unlocked
              ? "You've completed enough lessons to access practice questions for each credential."
              : `Finish at least ${unlockPct}% of ${tradeName} lessons to unlock practice questions. The credential and apprenticeship information below is free to browse anytime.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPct} data-testid="progress-trade-completion" />
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-progress-detail">
            {progressPct}% complete · {data.progress.completedLessons} of {data.progress.totalLessons} lessons
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="certifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="certifications" data-testid="tab-certifications">
            <GraduationCap className="h-4 w-4 mr-1" /> Certifications
          </TabsTrigger>
          <TabsTrigger value="apprenticeships" data-testid="tab-apprenticeships">
            <Hammer className="h-4 w-4 mr-1" /> Apprenticeships
          </TabsTrigger>
        </TabsList>

        {/* CERTIFICATIONS */}
        <TabsContent value="certifications" className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Honest disclosure</AlertTitle>
            <AlertDescription>
              Sponsor names, exam scopes, and eligibility below are pulled from each sponsor's public materials. Fees, exact retake windows, and seat availability change — verify with the sponsor before paying. {data.certifications.intro}
            </AlertDescription>
          </Alert>

          {data.certifications.items.map((cert) => (
            <Card key={cert.slug} data-testid={`card-cert-${cert.slug}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle data-testid={`title-cert-${cert.slug}`}>{cert.name}</CardTitle>
                    <CardDescription>{cert.sponsor}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={LEVEL_COLOR[cert.level]} data-testid={`badge-level-${cert.slug}`}>
                      {LEVEL_LABEL[cert.level]}
                    </Badge>
                    {cert.hasPerformanceTest && (
                      <Badge variant="outline" data-testid={`badge-perf-${cert.slug}`}>
                        Includes hands-on test
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p data-testid={`text-proves-${cert.slug}`}>{cert.whatItProves}</p>

                <div>
                  <h4 className="text-sm font-semibold mb-1">What the exam covers</h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-5">
                    {cert.examDomains.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">What it unlocks</h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-5">
                    {cert.unlocks.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Eligibility</h4>
                  <p className="text-sm text-muted-foreground">{cert.eligibility}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={cert.sponsorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-sponsor-${cert.slug}`}
                  >
                    <Button variant="outline" size="sm">
                      Sponsor site <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                  {cert.practiceAvailable && (
                    <Button
                      size="sm"
                      disabled={!data.progress.unlocked}
                      onClick={() => setActiveCertSlug(cert.slug)}
                      data-testid={`button-practice-${cert.slug}`}
                    >
                      {data.progress.unlocked ? (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" /> Start practice
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" /> Locked
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {activeCertSlug === cert.slug && data.progress.unlocked && (
                  <PracticeQuiz
                    tradeSlug={tradeSlug}
                    certSlug={cert.slug}
                    onClose={() => setActiveCertSlug(null)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* APPRENTICESHIPS */}
        <TabsContent value="apprenticeships" className="space-y-4">
          <Alert>
            <Hammer className="h-4 w-4" />
            <AlertTitle>Where the paid pathways live</AlertTitle>
            <AlertDescription>{data.apprenticeships.intro}</AlertDescription>
          </Alert>

          {data.apprenticeships.pathways.map((p) => (
            <Card key={p.slug} data-testid={`card-appr-${p.slug}`}>
              <CardHeader>
                <CardTitle data-testid={`title-appr-${p.slug}`}>{p.name}</CardTitle>
                <CardDescription>{p.sponsor}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>{p.scope}</p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <h4 className="font-semibold">Typical length</h4>
                    <p className="text-muted-foreground">{p.typicalLength}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">How you earn</h4>
                    <p className="text-muted-foreground">{p.earningStructure}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">How to get in</h4>
                  <ol className="text-sm text-muted-foreground list-decimal pl-5">
                    {p.entrySteps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
                {p.notes && (
                  <p className="text-sm text-muted-foreground italic" data-testid={`text-notes-${p.slug}`}>
                    {p.notes}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <a href={p.locatorUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-locator-${p.slug}`}>
                    <Button variant="outline" size="sm">
                      Find a sponsor near you <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                  {p.programInfoUrl && (
                    <a
                      href={p.programInfoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-program-${p.slug}`}
                    >
                      <Button variant="ghost" size="sm">
                        Program details <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Universal locators — apprenticeship.gov + state agency */}
          <Card data-testid="card-universal-locators">
            <CardHeader>
              <CardTitle>National + state locators (work for every trade)</CardTitle>
              <CardDescription>These three locators index thousands of Registered Apprenticeship sponsors across the country.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(data.apprenticeships.universalLocators).map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="block" data-testid={`link-universal-${key}`}>
                  <Button variant="outline" className="w-full justify-between">
                    <span>{labelForUniversalLocator(key)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function labelForUniversalLocator(key: string): string {
  switch (key) {
    case "usdolApprenticeshipGov":
      return "Apprenticeship.gov — USDOL Job Finder";
    case "twcApprenticeship":
      return "Texas Workforce Commission — Apprenticeship Programs";
    case "twcWorkInTexas":
      return "WorkInTexas.com — Texas job board";
    default:
      return key;
  }
}

/**
 * Practice quiz — fetches the gated question bank, walks the learner
 * one question at a time, shows the rationale immediately after answering.
 * Score tallied on the client; not saved server-side (this is study, not
 * a graded exam).
 */
function PracticeQuiz({
  tradeSlug,
  certSlug,
  onClose,
}: {
  tradeSlug: string;
  certSlug: string;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<PracticeResponse>({
    queryKey: ["/api/trade-sims/certifications", tradeSlug, "practice", certSlug],
  });

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" data-testid={`practice-loading-${certSlug}`} />;
  }
  if (error || !data || data.questions.length === 0) {
    return (
      <Alert data-testid={`practice-empty-${certSlug}`}>
        <AlertTitle>Practice questions still being added</AlertTitle>
        <AlertDescription>
          The bank for this credential is still in development. Use the sponsor link above for now.
        </AlertDescription>
      </Alert>
    );
  }

  const q = data.questions[idx];
  const isLast = idx === data.questions.length - 1;

  function pick(i: number) {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function next() {
    if (isLast) return;
    setIdx((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
  }

  return (
    <div className="mt-3 border rounded-md p-4 space-y-3 bg-muted/30" data-testid={`practice-${certSlug}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm font-semibold">
          Question {idx + 1} of {data.questions.length} · Score {score}/{idx + (revealed ? 1 : 0)}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid={`button-close-practice-${certSlug}`}>
          Close
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{data.disclaimer}</p>

      <div className="space-y-2">
        <p className="font-medium" data-testid={`practice-stem-${certSlug}`}>
          {q.stem}
        </p>
        <div className="space-y-1">
          {q.options.map((opt, i) => {
            const isPicked = selected === i;
            const isCorrect = i === q.correctIndex;
            let color = "";
            if (revealed) {
              if (isCorrect) color = "border-green-600 bg-green-50 dark:bg-green-950";
              else if (isPicked) color = "border-red-600 bg-red-50 dark:bg-red-950";
            }
            return (
              <button
                type="button"
                key={i}
                onClick={() => pick(i)}
                disabled={revealed}
                className={`w-full text-left p-2 border rounded text-sm hover:bg-accent ${color}`}
                data-testid={`practice-option-${certSlug}-${i}`}
              >
                <span className="inline-flex items-center gap-2">
                  {revealed && isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {revealed && (
        <div className="text-sm border-l-4 border-primary pl-3 py-1" data-testid={`practice-rationale-${certSlug}`}>
          <strong>Why:</strong> {q.rationale}
        </div>
      )}

      <div className="flex gap-2">
        {isLast && revealed ? (
          <Button onClick={restart} data-testid={`button-restart-practice-${certSlug}`}>
            Restart quiz
          </Button>
        ) : (
          <Button disabled={!revealed} onClick={next} data-testid={`button-next-question-${certSlug}`}>
            Next question
          </Button>
        )}
      </div>
    </div>
  );
}
