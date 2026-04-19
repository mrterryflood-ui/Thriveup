import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download } from "lucide-react";

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

        <div className="text-xs text-muted-foreground border-t pt-4 mt-8">
          Public coalition reference. For verification, partnership, or letters of collaboration, contact The Collaborative Advocate Foundation. Generated {sc.data?.generatedAt ? new Date(sc.data.generatedAt).toLocaleString() : ""}.
        </div>
      </div>
    </div>
  );
}
