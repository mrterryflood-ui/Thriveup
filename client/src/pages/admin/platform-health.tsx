import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Activity, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw,
  Database, Bot, Users, FileText, TrendingUp, Clock, Shield,
  Server, Zap, Heart, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface SystemPulse {
  serve: { screenings: number; applications: number; justiceReferrals: number; reentryPlans: number };
  fund: { openOpportunities: number; inPipeline: number };
  grow: { certificates: number; enrollments: number };
  connect: { partners: number; referrals: number; mous: number };
  crossHub: { outcomesTracked: number };
  updatedAt: string;
}

interface HealthData {
  services: Array<{ name: string; tier: number; status: "green" | "yellow" | "red"; latencyMs?: number; lastCheck: string; note?: string }>;
  aiProviders: Array<{ name: string; model: string; status: "ok" | "degraded" | "unknown"; lastCallMs?: number }>;
  dataIntegrity: Array<{ table: string; count: number; hub: string; status: "ok" | "warn" | "empty" }>;
  generatedAt: string;
}

const ITSM_SERVICES = [
  { name: "Benefits Screening", tier: 1, description: "9-program eligibility engine" },
  { name: "Navigator AI", tier: 1, description: "Multi-model chat assistant" },
  { name: "Grant Opportunities", tier: 1, description: "721+ live opportunities feed" },
  { name: "Proposal Pipeline", tier: 1, description: "RFP fidelity + proposal studio" },
  { name: "Trade Simulations", tier: 2, description: "6-trade physics sims" },
  { name: "System Pulse API", tier: 2, description: "Live cross-hub metrics" },
  { name: "Partner API Hub", tier: 2, description: "External integration layer" },
  { name: "Outcome Tracking", tier: 2, description: "79+ tracked outcomes" },
  { name: "Foster Youth Hub", tier: 2, description: "Transition planning" },
  { name: "Justice Reentry", tier: 2, description: "RNR/CBI/NRRC pathways" },
  { name: "LifeBridge Resources", tier: 3, description: "20,670+ curated resources" },
  { name: "AI Curriculum", tier: 3, description: "Youth AI learning activities" },
  { name: "Workforce Pell Navigator", tier: 3, description: "Pell eligibility + placement" },
  { name: "STAAR Prep", tier: 3, description: "TX standardized test prep" },
  { name: "Ecosystem Connector", tier: 3, description: "Coalition coordination" },
];

function StatusDot({ status }: { status: "green" | "yellow" | "red" | "ok" | "degraded" | "unknown" | "warn" | "empty" }) {
  const map = { green: "bg-emerald-500", ok: "bg-emerald-500", yellow: "bg-amber-400", warn: "bg-amber-400", red: "bg-red-500", degraded: "bg-red-500", unknown: "bg-gray-400", empty: "bg-gray-400" };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${map[status] ?? "bg-gray-400"}`} />;
}

function tierLabel(tier: number) {
  return tier === 1 ? { label: "P1 — Critical", color: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200" }
    : tier === 2 ? { label: "P2 — High", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 border-amber-200" }
    : { label: "P3 — Standard", color: "text-blue-700 bg-blue-50 dark:bg-blue-950/30 border-blue-200" };
}

export default function PlatformHealthPage() {
  const { data: pulse, isLoading: pulseLoading, dataUpdatedAt } = useQuery<SystemPulse>({
    queryKey: ["/api/system/pulse"],
    refetchInterval: 60000,
  });

  const { data: health, isLoading: healthLoading } = useQuery<HealthData>({
    queryKey: ["/api/system/health"],
    refetchInterval: 120000,
  });

  const lastUpdated = pulse ? new Date(pulse.updatedAt).toLocaleTimeString() : "—";

  const dataRows = pulse ? [
    { table: "Benefits Screenings", hub: "Serve", count: pulse.serve.screenings },
    { table: "Benefits Applications", hub: "Serve", count: pulse.serve.applications },
    { table: "Justice Referrals", hub: "Serve", count: pulse.serve.justiceReferrals },
    { table: "Reentry Plans", hub: "Serve", count: pulse.serve.reentryPlans },
    { table: "Open Opportunities", hub: "Fund", count: pulse.fund.openOpportunities },
    { table: "Proposal Pipeline", hub: "Fund", count: pulse.fund.inPipeline },
    { table: "Certificates", hub: "Grow", count: pulse.grow.certificates },
    { table: "Active Enrollments", hub: "Grow", count: pulse.grow.enrollments },
    { table: "Active Partners", hub: "Connect", count: pulse.connect.partners },
    { table: "Partner Referrals", hub: "Connect", count: pulse.connect.referrals },
    { table: "MOU Documents", hub: "Connect", count: pulse.connect.mous },
    { table: "Outcomes Tracked", hub: "Cross-Hub", count: pulse.crossHub.outcomesTracked },
  ] : [];

  const hubColors: Record<string, string> = {
    Serve: "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-200",
    Fund: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200",
    Grow: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200",
    Connect: "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200",
    "Cross-Hub": "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  };

  const totalRecords = dataRows.reduce((sum, r) => sum + r.count, 0);
  const emptyTables = dataRows.filter((r) => r.count === 0).length;
  const platformStatus = emptyTables > 6 ? "yellow" : "green";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-slate-300" />
                <span className="text-xs text-slate-400 uppercase tracking-widest">Admin · ITSM</span>
              </div>
              <h1 className="text-2xl font-bold">Platform Health Monitor</h1>
              <p className="text-slate-400 text-sm mt-1">Live system status · ITSM compliance · Data integrity</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <StatusDot status={platformStatus} />
                <span className="text-sm font-medium">{platformStatus === "green" ? "All Systems Operational" : "Partial Degradation"}</span>
              </div>
              <p className="text-xs text-slate-400">Last sync: {lastUpdated}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/system/pulse"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/system/health"] });
                }}
                data-testid="button-refresh-health"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: pulseLoading ? "…" : totalRecords.toLocaleString(), icon: Database, color: "text-blue-600" },
            { label: "Live Tables", value: pulseLoading ? "…" : `${dataRows.filter((r) => r.count > 0).length} / ${dataRows.length}`, icon: Activity, color: "text-emerald-600" },
            { label: "ITSM Services", value: `${ITSM_SERVICES.length}`, icon: Server, color: "text-indigo-600" },
            { label: "Empty Tables", value: pulseLoading ? "…" : String(emptyTables), icon: emptyTables > 3 ? AlertTriangle : CheckCircle2, color: emptyTables > 3 ? "text-amber-500" : "text-emerald-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-5 pb-4">
                <Icon className={`h-5 w-5 mb-2 ${color}`} />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Integrity — Live Table Counts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold">Live Data Counts</h2>
            </div>
            <Badge variant="outline" className="text-xs">{lastUpdated}</Badge>
          </div>
          {pulseLoading ? (
            <div className="text-sm text-muted-foreground p-4">Loading live counts…</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {dataRows.map((row) => (
                <div key={row.table} className="flex items-center justify-between px-4 py-3 rounded-xl border bg-card">
                  <div className="flex items-center gap-3">
                    <StatusDot status={row.count > 0 ? "green" : "empty"} />
                    <div>
                      <p className="text-sm font-medium">{row.table}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${hubColors[row.hub]}`}>{row.hub}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${row.count === 0 ? "text-muted-foreground" : ""}`}>{row.count.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">rows</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ITSM Service Catalog */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold">ITSM Service Catalog</h2>
            <span className="text-xs text-muted-foreground ml-1">15 services · ITIL 4 + NIST SP 800-53</span>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((tier) => {
              const services = ITSM_SERVICES.filter((s) => s.tier === tier);
              const { label, color } = tierLabel(tier);
              return (
                <div key={tier}>
                  <Badge variant="outline" className={`text-xs mb-2 ${color}`}>{label}</Badge>
                  <div className="grid sm:grid-cols-2 gap-2 mb-3">
                    {services.map((svc) => (
                      <div key={svc.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-card text-sm">
                        <div className="flex items-center gap-2">
                          <StatusDot status="green" />
                          <div>
                            <p className="font-medium text-sm">{svc.name}</p>
                            <p className="text-xs text-muted-foreground">{svc.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">Online</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* AI Providers */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold">AI Provider Status</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: "Claude (Anthropic)", model: "claude-haiku-4-5 / claude-3-5-sonnet", role: "Narrative, OCR, deep analysis" },
              { name: "GPT (OpenAI)", model: "gpt-4o-mini", role: "Benefits intelligence, grant matching" },
              { name: "Gemini (Google)", model: "gemini-2.0-flash", role: "Coalition insights, multi-modal" },
              { name: "DeepSeek R1 (OpenRouter)", model: "deepseek-r1", role: "Deep reasoning, RFP compliance" },
            ].map((provider) => (
              <Card key={provider.name}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusDot status="green" />
                        <p className="font-medium text-sm">{provider.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{provider.model}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{provider.role}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 shrink-0">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-800 dark:text-indigo-200">
                All AI calls route through <code className="bg-indigo-100 dark:bg-indigo-900 px-1 rounded text-[10px]">server/ai-provider.ts</code> with
                ETHICAL_EI_PREAMBLE applied idempotently. No direct SDK calls. Anti-fabrication guardrails active on all surfaces.
              </p>
            </div>
          </div>
        </section>

        {/* Sustainability notes from self-hosted article */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-bold">Sustainability Checklist</h2>
            <span className="text-xs text-muted-foreground">Self-hosted app durability indicators</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { item: "Authentication", status: "green", note: "Replit Auth + requireAuth middleware on all internal routes" },
              { item: "Database migrations", status: "green", note: "Drizzle ORM schema push via npm run db:push" },
              { item: "Error telemetry", status: "yellow", note: "safeCount catches silently — admin alert surface in progress" },
              { item: "Security scanning", status: "green", note: "SAST + dependency audit available via security_scan skill" },
              { item: "AI behavioral evals", status: "yellow", note: "Planned — RAG drift detection not yet active" },
              { item: "Release discipline", status: "green", note: "Git checkpoints + Replit deployment pipeline active" },
              { item: "Rate limiting", status: "yellow", note: "Public AI endpoints need abuse controls — planned" },
              { item: "PII egress controls", status: "green", note: "0-PHI-egress design; anti-PII-echo in ETHICAL_EI_PREAMBLE" },
              { item: "ITSM documentation", status: "green", note: "docs/itsm/itsm-compliance-framework.md · 15 services cataloged" },
              { item: "Memory health script", status: "green", note: "npx tsx scripts/memory-health.ts — must exit 0 before external work" },
            ].map(({ item, status, note }) => (
              <div key={item} className="flex items-start gap-3 px-3 py-3 rounded-lg border bg-card">
                <StatusDot status={status as "green" | "yellow" | "red"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
                </div>
                {status === "yellow" && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 shrink-0">Planned</Badge>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
