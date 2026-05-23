import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSearch, ArrowRight, AlertTriangle, CheckCircle2, Upload } from "lucide-react";

type GrantRow = {
  grantId: string;
  title: string;
  agency: string | null;
  deadline: string | null;
  docCounts: { base: number; amendment: number; qa: number };
  matrixCounts: { total: number; L: number; M: number; gaps: number };
  lastUploadedAt: string | null;
};

export default function RfpFidelityIndexPage() {
  const { data, isLoading } = useQuery<{ grants: GrantRow[] }>({
    queryKey: ["/api/me/rfp-fidelity/grants"],
  });
  const grants = data?.grants ?? [];

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6" data-testid="rfp-fidelity-index">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">RFP Fidelity Engine</h1>
        <p className="text-muted-foreground mt-1">
          Write TO the reviewer, in THEIR language, in THEIR order, against THEIR scoring criteria.
          Reality is fixed; framing is ours.
        </p>
      </div>

      <Card className="bg-muted/40 border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileSearch className="h-5 w-5" /> How this works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>1.</strong> Upload your base RFP (plus any amendments and Q&A) on the <Link href="/grant-narrative" className="underline text-primary" data-testid="link-rfp-writer">RFP-Driven Writer</Link> page.</p>
          <p><strong>2.</strong> Come back here. Pick the grant below. The engine pulls every <em>shall / must / will</em> requirement verbatim, tagged Section L (instructions, format) vs M (evaluation, scored) vs C (scope).</p>
          <p><strong>3.</strong> Mark each item covered, propose hybrid workarounds for real gaps, then run the final audit before submitting. Section L noncompliance gets a proposal rejected <em>before</em> Section M is scored — the engine flags that separately.</p>
        </CardContent>
      </Card>

      {isLoading && <p className="text-muted-foreground" data-testid="text-loading">Loading your RFPs…</p>}

      {!isLoading && grants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-semibold">No RFPs uploaded yet for this organization.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first base RFP on the RFP-Driven Writer page, then return here to extract its compliance matrix.
              </p>
            </div>
            <Link href="/grant-narrative">
              <Button data-testid="button-go-to-writer"><Upload className="h-4 w-4 mr-2" /> Go to RFP-Driven Writer</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {grants.length > 0 && (
        <div className="grid gap-4">
          {grants.map((g) => {
            const ready = g.matrixCounts.total > 0;
            return (
              <Card key={g.grantId} data-testid={`card-grant-${g.grantId}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-grant-title-${g.grantId}`}>{g.title}</CardTitle>
                      <CardDescription>
                        {g.agency ?? "agency on file"} · deadline {g.deadline ? new Date(g.deadline).toLocaleDateString() : "rolling"}
                      </CardDescription>
                    </div>
                    <Link href={`/grants/${g.grantId}/compliance`}>
                      <Button data-testid={`button-open-${g.grantId}`}>
                        Open Fidelity Engine <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">Base: {g.docCounts.base}</Badge>
                  <Badge variant="outline">Amendments: {g.docCounts.amendment}</Badge>
                  <Badge variant="outline">Q&A: {g.docCounts.qa}</Badge>
                  {ready ? (
                    <>
                      <Badge className="bg-indigo-100 text-indigo-900">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Matrix: {g.matrixCounts.total} items (L:{g.matrixCounts.L} · M:{g.matrixCounts.M})
                      </Badge>
                      {g.matrixCounts.gaps > 0 && (
                        <Badge className="bg-amber-100 text-amber-900">
                          <AlertTriangle className="h-3 w-3 mr-1" /> {g.matrixCounts.gaps} open / gap items
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary">Matrix not yet extracted — open to run extractor</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
