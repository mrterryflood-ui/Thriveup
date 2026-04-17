import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Radio, Printer, Download } from "lucide-react";

type Claim = { value: number | string | null; unit?: string | null; confidence?: string; source?: string; asOfDate?: string } | null;
type MetricRow = { label: string; claim: Claim };

type Metro = {
  metro: { id: string; name: string; focusZip?: string; counties?: string[] };
  counts?: any;
  fatherhoodGap?: any;
  riskFactors?: MetricRow[];
  riskIndex?: number;
  protectiveFactors?: MetricRow[];
  crimeProfile?: Record<string, any>;
  rootCauses?: Array<{ cause: string; explanation?: string; citesStepIds?: string[] }>;
  recommendedSolutions?: Array<{ solution: string; description?: string; addressedRisks?: string[]; deliveryPartners?: string[]; platformModules?: string[]; fundingFit?: string[]; kpi?: string }>;
  communityResources?: Array<{ name: string; type?: string; focus?: string }>;
  partners?: Array<{ id: string; name: string; mouStatus?: string }>;
};
type Story = { ok?: boolean; generatedAt: string; metros: { waco: Metro; austin: Metro }; chainWeb?: { steps?: Array<{ id: string; label: string; dependsOn: string[] }> } };

const conf = (c?: string | null) => (c === "verified" ? "bg-emerald-600" : c === "modeled" ? "bg-amber-500" : c === "estimated" ? "bg-sky-600" : "bg-slate-500");

function Stat({ row }: { row?: MetricRow }) {
  if (!row) return null;
  const v = row.claim?.value;
  const vs = v == null ? "—" : typeof v === "number" ? v.toLocaleString() : String(v);
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium" data-testid={`live-metric-${row.label}`}>{row.label}</div>
        <div className="text-xs text-muted-foreground">
          {row.claim?.source ?? "—"}
          {row.claim?.asOfDate ? ` · ${row.claim.asOfDate}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-mono text-sm">{vs}{row.claim?.unit ? ` ${row.claim.unit}` : ""}</span>
        <Badge className={`${conf(row.claim?.confidence)} text-white text-[10px]`}>{row.claim?.confidence ?? "unverified"}</Badge>
      </div>
    </div>
  );
}

function MetroSection({ m, label }: { m: Metro | undefined; label: string }) {
  if (!m) return null;
  const crime = m.crimeProfile ?? {};
  return (
    <section className="mb-10" data-testid={`section-${label.toLowerCase()}`}>
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-2xl font-bold">{label} — {m.metro?.name ?? ""}</h2>
        <div className="text-sm text-muted-foreground">
          {m.metro?.focusZip ? `Focus ZIP ${m.metro.focusZip} · ` : ""}Risk index <span className="font-mono">{m.riskIndex ?? "—"}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Risk factors</CardTitle></CardHeader>
          <CardContent className="pt-0 divide-y-0">{(m.riskFactors ?? []).map((r, i) => <Stat key={i} row={r} />)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Protective factors</CardTitle></CardHeader>
          <CardContent className="pt-0">{(m.protectiveFactors ?? []).map((r, i) => <Stat key={i} row={r} />)}</CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2"><CardTitle className="text-base">Crime profile</CardTitle></CardHeader>
        <CardContent className="pt-0 grid md:grid-cols-2">
          {Object.entries(crime).map(([k, v]: [string, any]) =>
            v && typeof v === "object" && "value" in v ? <Stat key={k} row={{ label: k, claim: v }} /> : null
          )}
        </CardContent>
      </Card>

      {!!(m.rootCauses?.length) && (
        <Card className="mt-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">Root causes (with citations)</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2">
            {m.rootCauses!.map((rc, i) => (
              <div key={i} className="text-sm" data-testid={`rootcause-${label.toLowerCase()}-${i}`}>
                <span className="font-semibold">{rc.cause}.</span> <span className="text-muted-foreground">{rc.explanation}</span>
                {!!rc.citesStepIds?.length && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {rc.citesStepIds.map((s) => <Badge key={s} variant="outline" className="text-[10px]">cites {s}</Badge>)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!!(m.recommendedSolutions?.length) && (
        <Card className="mt-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">Recommended solutions</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            {m.recommendedSolutions!.map((s, i) => (
              <div key={i} className="border-l-4 border-emerald-500 pl-3 py-1">
                <div className="font-semibold text-sm">{s.solution}</div>
                {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.deliveryPartners?.map((p) => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                  {s.fundingFit?.map((f) => <Badge key={f} className="text-[10px] bg-violet-600 text-white">{f}</Badge>)}
                </div>
                {s.kpi && <div className="text-[11px] text-muted-foreground mt-1">KPI: {s.kpi}</div>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!!(m.communityResources?.length) && (
        <Card className="mt-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">Community resources</CardTitle></CardHeader>
          <CardContent className="pt-0 flex flex-wrap gap-2">
            {m.communityResources!.map((r, i) => (
              <Badge key={i} variant="outline" data-testid={`resource-${label.toLowerCase()}-${i}`}>{r.name}{r.focus ? ` · ${r.focus}` : ""}</Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default function CorridorDocsLivePage() {
  const { data, isLoading, isError } = useQuery<Story>({ queryKey: ["/api/corridor/story"] });

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-start justify-between gap-3 print:hidden">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Corridor Intelligence — Live Document</div>
            <h1 className="text-3xl font-bold" data-testid="text-title">Austin + Waco Briefing Book</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Every number below is pulled from <code>/api/corridor/story</code> in real time. Re-open this page to refresh.
            </p>
            {data?.generatedAt && (
              <div className="text-xs text-muted-foreground mt-1">
                Story generated {new Date(data.generatedAt).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/corridor/docs"><Button variant="outline" size="sm" data-testid="link-back">← All docs</Button></Link>
            <Button size="sm" variant="outline" onClick={() => window.print()} data-testid="button-print">
              <Printer className="h-4 w-4 mr-1" /> Print / Save as PDF
            </Button>
            <a href="/attached_assets/decks/Corridor-Intelligence-Brief-v1.pptx" download>
              <Button size="sm" data-testid="button-download-pptx"><Download className="h-4 w-4 mr-1" /> PPTX</Button>
            </a>
            <a href="/attached_assets/decks/Corridor-Intelligence-Brief-v1.docx" download>
              <Button size="sm" variant="secondary" data-testid="button-download-docx"><Download className="h-4 w-4 mr-1" /> DOCX</Button>
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
          <Radio className="h-3 w-3" /> Live from API
        </div>

        {isLoading && <div className="py-16 text-center text-muted-foreground">Loading live story…</div>}
        {isError && <div className="py-16 text-center text-destructive">Failed to load live story.</div>}

        {data?.metros && (
          <>
            <MetroSection m={data.metros.waco} label="WACO" />
            <MetroSection m={data.metros.austin} label="AUSTIN" />

            {!!data.chainWeb?.steps?.length && (
              <Card className="mt-6">
                <CardHeader className="pb-2"><CardTitle className="text-base">Chain-web provenance</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {data.chainWeb!.steps!.map((s, i) => (
                    <div key={s.id} className="text-xs" data-testid={`chain-step-${s.id}`}>
                      <span className="font-mono text-muted-foreground">#{i + 1}</span> <span className="font-semibold">{s.id}</span> — {s.label}
                      {!!s.dependsOn?.length && <span className="text-muted-foreground"> (cites {s.dependsOn.join(", ")})</span>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
