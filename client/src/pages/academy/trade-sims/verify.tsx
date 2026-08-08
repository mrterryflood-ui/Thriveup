/**
 * PUBLIC certificate verification page — the link a learner shares with an
 * employer. Resolves a certificate's unguessable UUID via
 * GET /api/trade-sims/verify/:certificateId and renders the certificate
 * holder's transcript snapshot. No auth, no trial gate: an employer must be
 * able to open this cold.
 *
 * Anti-fabrication: renders the server disclaimer verbatim; the strongest
 * claim on this page is "preparation for" a named credential.
 */

import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Printer, ShieldCheck, Award, CheckCircle2, Circle, ExternalLink,
  FlaskConical, BookOpen, BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface VerifyLesson {
  dayNumber: number;
  title: string;
  evidenceType: "interactive_simulation" | "concept_study";
  keyConcepts: string[];
  soloSuccessCriteria: string | null;
  completed: boolean;
  soloScore: number | null;
  attemptCount: number;
  completedAt: string | null;
}

interface VerifyResponse {
  valid: boolean;
  certificate: { id: string; holderName: string; levelTitle: string; issuedAt: string | null };
  tradeSlug: string;
  tradeName: string;
  generatedAt: string;
  summary: { totalLessons: number; completedLessons: number };
  lessons: VerifyLesson[];
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

export default function TradeCertVerifyPage() {
  const { certificateId } = useParams<{ certificateId: string }>();

  const { data, isLoading, error } = useQuery<VerifyResponse>({
    queryKey: ["/api/trade-sims/verify", certificateId],
    queryFn: async () => {
      const res = await fetch(`/api/trade-sims/verify/${certificateId}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!certificateId,
    retry: false,
  });

  useEffect(() => {
    if (data?.certificate) {
      document.title = `Verified: ${data.certificate.holderName} — ${data.tradeName} — ThriveUp Trade Sims`;
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4" data-testid="page-verify-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Alert variant="destructive" data-testid="alert-verify-invalid">
          <AlertTitle>Certificate not found</AlertTitle>
          <AlertDescription>
            This verification link doesn't match any issued certificate. Ask the learner to re-share their
            verification link from their skills transcript.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 space-y-5 print:py-0 print:space-y-3" data-testid="page-verify">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">ThriveUp Trade Sims — Certificate Verification</p>
        <Button size="sm" onClick={() => window.print()} data-testid="button-print-verify">
          <Printer className="h-4 w-4 mr-1" /> Print / Save PDF
        </Button>
      </div>

      <Card className="border-green-600/40" data-testid="card-verified-cert">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-green-600" /> Verified certificate
          </CardTitle>
          <CardDescription>Certificate ID {data.certificate.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-bold" data-testid="text-holder-name">{data.certificate.holderName}</p>
          <p className="text-sm">
            <Award className="h-4 w-4 inline mr-1 text-green-600" />
            {data.certificate.levelTitle} · Issued {fmtDate(data.certificate.issuedAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            Completed {data.summary.completedLessons} of {data.summary.totalLessons} lessons of the ThriveUp{" "}
            {data.tradeName} simulation curriculum.
          </p>
        </CardContent>
      </Card>

      {/* Honest disclosure — screen and print */}
      <Alert data-testid="alert-verify-disclaimer">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>What this certificate is — and isn't</AlertTitle>
        <AlertDescription>{data.disclaimer}</AlertDescription>
      </Alert>

      <Card data-testid="card-verify-evidence">
        <CardHeader>
          <CardTitle>Training evidence</CardTitle>
          <CardDescription>
            "Interactive simulation" means the learner built and ran a physics-based sim that graded their work.
            "Concept study" means reading plus a written reflection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.lessons.map((l) => (
            <div key={l.dayNumber} className="border rounded-md p-3 space-y-1" data-testid={`verify-row-lesson-${l.dayNumber}`}>
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
                    <Badge variant="secondary" className="text-[10px]">Score {l.soloScore}%</Badge>
                  )}
                </div>
              </div>
              {l.completed && (
                <p className="text-xs text-muted-foreground">
                  Completed {fmtDate(l.completedAt)}{l.attemptCount > 1 ? ` · ${l.attemptCount} attempts` : ""}
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

      {data.preparationFor.length > 0 && (
        <Card data-testid="card-verify-preparation">
          <CardHeader>
            <CardTitle>Credential pathways this training prepares for</CardTitle>
            <CardDescription>
              Preparation only — earning any credential below requires the sponsor's own exam, fees, and eligibility process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.preparationFor.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-2 flex-wrap text-sm border rounded-md p-2.5">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.sponsor}</p>
                </div>
                <a href={c.sponsorUrl} target="_blank" rel="noopener noreferrer" className="print:hidden">
                  <Button variant="ghost" size="sm">
                    Sponsor <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground border-t pt-2">
        Verified via ThriveUp Trade Sims · certificate {data.certificate.id} · generated {fmtDate(data.generatedAt)} ·
        simulation-based training evidence only, not an industry credential.
      </p>
    </div>
  );
}
