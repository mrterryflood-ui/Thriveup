import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, BookOpen, Library, Handshake, GraduationCap, HeartHandshake } from "lucide-react";

const REFERENCE_SOURCES = [
  { icon: Library, title: "TDCJ Reentry & Rehabilitation Division", url: "https://www.tdcj.texas.gov/divisions/rrd/index.html",
    role: "Statewide reentry programs, recidivism baseline data, approved program list", tag: "State agency" },
  { icon: Handshake, title: "Reentry Roundtable of Austin & Travis County", url: "https://www.reentryroundtable.org/get-help/",
    role: "Local coalition + public Get Help resource portal for Travis County", tag: "Coalition partner" },
  { icon: GraduationCap, title: "Beacon Connections", url: "https://beaconconnections.org",
    role: "CBT, Motivational Interviewing, and reentry-skills facilitator training (Dr. Barry Gregory)", tag: "Training partner" },
  { icon: BookOpen, title: "How Reentry Services Transform Lives (Beacon blog)", url: "https://beaconreentry.blogspot.com/2023/08/how-reentry-services-transform.html",
    role: "Practitioner narrative on reentry services impact — context for our service model", tag: "Practice evidence" },
];

const STATUS_COLOR: Record<string, string> = {
  exceeds: "bg-emerald-600 text-white",
  full: "bg-green-600 text-white",
  partial: "bg-amber-500 text-white",
  gap: "bg-red-600 text-white",
};

interface PublicScorecard {
  generatedAt: string;
  totalStandards: number;
  averageCoverage: number;
  cbiCatalogSize: number;
  byBody: Record<string, { count: number; sum: number }>;
}
interface PublicStandard {
  standardCode: string;
  standardBody: string;
  category: string;
  standardTitle: string;
  standardDescription: string;
  coverageStatus: string;
  coveragePercent: number;
  tcafCapabilities: string[] | null;
  notes: string | null;
}

export default function StandardsPublicPage() {
  useEffect(() => { document.title = "TCAF Reentry Standards — Public Coalition View"; }, []);
  const sc = useQuery<PublicScorecard>({ queryKey: ["/api/standards/public/scorecard"] });
  const cw = useQuery<PublicStandard[]>({ queryKey: ["/api/standards/public/crosswalk"] });

  const grouped: Record<string, PublicStandard[]> = {};
  for (const r of cw.data || []) (grouped[r.category] ||= []).push(r);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto p-6 space-y-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-public-title">
              <Award className="h-7 w-7 text-primary" /> National Reentry Standards Alignment
            </h1>
            <p className="text-muted-foreground mt-1 max-w-3xl">
              Public coalition view from <strong>The Collaborative Advocate Foundation (TCAF)</strong>. Live crosswalk of TCAF capabilities against National Reentry Resource Center (NRRC) and Bureau of Justice Assistance Second Chance Act standards.
            </p>
          </div>
          <Button variant="outline" asChild data-testid="button-pdf-download">
            <a href="/api/coalition/public/crosswalk.html" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" /> Printable PDF
            </a>
          </Button>
        </div>

        {sc.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="public-tiles">
            <Card><CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Standards Tracked</div>
              <div className="text-3xl font-bold mt-1">{sc.data.totalStandards}</div>
            </CardContent></Card>
            <Card className="border-primary border-2"><CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Average Coverage</div>
              <div className="text-3xl font-bold mt-1">{sc.data.averageCoverage}%</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">CBI Programs</div>
              <div className="text-3xl font-bold mt-1">{sc.data.cbiCatalogSize}</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Standards Bodies</div>
              <div className="text-3xl font-bold mt-1">{Object.keys(sc.data.byBody).length}</div>
            </CardContent></Card>
          </div>
        )}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-3" data-testid={`public-category-${cat}`}>
            <h2 className="text-xl font-semibold border-b pb-2 capitalize">{cat.replace(/_/g, " ")}</h2>
            {items.map(r => (
              <div key={r.standardCode} className="border rounded-lg p-4 space-y-2 bg-white dark:bg-slate-900" data-testid={`public-row-${r.standardCode}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">{r.standardCode}</Badge>
                  <Badge variant="secondary" className="text-xs">{r.standardBody}</Badge>
                  <Badge className={`text-xs ${STATUS_COLOR[r.coverageStatus] || ""}`}>{r.coverageStatus.toUpperCase()} • {r.coveragePercent}%</Badge>
                </div>
                <div className="font-semibold">{r.standardTitle}</div>
                <div className="text-sm text-muted-foreground">{r.standardDescription}</div>
                {r.tcafCapabilities && r.tcafCapabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.tcafCapabilities.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
                  </div>
                )}
                {r.notes && <div className="text-xs italic text-muted-foreground border-l-2 pl-3 mt-1">{r.notes}</div>}
              </div>
            ))}
          </div>
        ))}

        <div className="space-y-3 pt-4" data-testid="reference-sources">
          <h2 className="text-xl font-semibold border-b pb-2">Reference Sources & Coalition Resources</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {REFERENCE_SOURCES.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                   className="border rounded-lg p-3 bg-white dark:bg-slate-900 hover:border-primary hover-elevate active-elevate-2 transition-colors block"
                   data-testid={`ref-source-${i}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-1 text-sm">
                        {s.title} <ExternalLink className="h-3 w-3" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.role}</div>
                      <Badge variant="outline" className="text-xs mt-1.5">{s.tag}</Badge>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 flex items-center gap-3 mt-2">
            <HeartHandshake className="h-6 w-6 text-blue-700 dark:text-blue-400 shrink-0" />
            <div className="flex-1 text-sm">
              <strong>Travis County warm handoff:</strong> Need immediate help with housing, employment, ID, food, healthcare, or other reentry support?
            </div>
            <Button asChild data-testid="button-warm-handoff">
              <a href="https://www.reentryroundtable.org/get-help/" target="_blank" rel="noopener noreferrer">
                Open Get Help Portal <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4 mt-8">
          Public coalition reference. For verification, partnership, or letters of collaboration, contact The Collaborative Advocate Foundation. Generated {sc.data?.generatedAt ? new Date(sc.data.generatedAt).toLocaleString() : ""}.
        </div>
      </div>
    </div>
  );
}
