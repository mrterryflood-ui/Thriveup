/**
 * /funder/:shareToken — Public, token-gated funder impact dashboard.
 * Accessible to anyone with the share link (no login required).
 * Features: date-range filter, CSV export, PDF impact report (print).
 */

import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Printer,
  Filter,
  TrendingUp,
  Users,
  CheckCircle2,
  DollarSign,
  XCircle,
} from "lucide-react";

interface DashboardData {
  funder: { name: string; type: string };
  metrics: {
    totalReferrals: number;
    enrolled: number;
    lost: number;
    pending: number;
    valueUnlocked: number;
    enrollmentRate: number;
  };
  byProgram: {
    programCode: string;
    referrals: number;
    enrolled: number;
    lost: number;
    value: number;
  }[];
  recentActivity: {
    id: string;
    programCode: string;
    orgName: string;
    status: string;
    benefitValueEstimate: number | null;
    createdAt: string;
    resolvedAt: string | null;
  }[];
  filters: { dateFrom: string | null; dateTo: string | null };
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  enrolled: { label: "Enrolled", variant: "default" },
  sent: { label: "Sent", variant: "outline" },
  accepted: { label: "Accepted", variant: "secondary" },
  ineligible: { label: "Ineligible", variant: "destructive" },
  withdrew: { label: "Withdrew", variant: "destructive" },
};

const PROGRAM_LABELS: Record<string, string> = {
  SNAP: "SNAP (Food Assistance)",
  Medicaid: "Medicaid",
  CHIP: "CHIP",
  EITC: "EITC / Tax Credit",
  Housing: "Housing Assistance",
  WIC: "WIC",
  LIHEAP: "LIHEAP (Energy)",
  HeadStart: "Head Start",
};

function programLabel(code: string): string {
  return PROGRAM_LABELS[code] ?? code;
}

export default function FunderDashboardPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams();
  if (appliedFrom) queryParams.set("dateFrom", appliedFrom);
  if (appliedTo) queryParams.set("dateTo", appliedTo);
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/funder", shareToken, "dashboard", appliedFrom, appliedTo],
    queryFn: async () => {
      const res = await fetch(`/api/funder/${shareToken}/dashboard${qs}`);
      if (!res.ok) throw new Error("Dashboard not found");
      return res.json();
    },
    enabled: !!shareToken,
  });

  function applyFilter() {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  }

  function clearFilter() {
    setDateFrom("");
    setDateTo("");
    setAppliedFrom("");
    setAppliedTo("");
  }

  function downloadCSV() {
    const csvQs = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const url = `/api/funder/${shareToken}/export.csv${csvQs}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "funder_impact.csv";
    a.click();
  }

  function printReport() {
    window.print();
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading impact dashboard…</p>
      </div>
    );
  if (error || !data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-destructive font-medium">Dashboard not found or unavailable.</p>
          <p className="text-sm text-muted-foreground">
            This link may have expired or the token is incorrect.
          </p>
        </div>
      </div>
    );

  const { funder, metrics, byProgram, recentActivity } = data;

  return (
    <div
      ref={printRef}
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background"
    >
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-2 capitalize">
              {funder.type.replace("_", " ")}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100">
              {funder.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Community benefit outcomes tracked by TCAF — Thriving Communities for All
            </p>
            {(appliedFrom || appliedTo) && (
              <p className="text-xs text-blue-600 mt-1">
                Showing: {appliedFrom || "start"} → {appliedTo || "today"}
              </p>
            )}
          </div>

          {/* Action buttons — hidden in print */}
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadCSV}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={printReport}>
              <Printer className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* ── Date-range filter — hidden in print ───────────────────────── */}
        <Card className="mb-6 print:hidden border-blue-100 dark:border-blue-900">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <Filter className="h-4 w-4 text-muted-foreground mb-2 shrink-0" />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={applyFilter} className="h-8">
                Apply
              </Button>
              {(appliedFrom || appliedTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilter} className="h-8 text-xs">
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Metric cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Referrals",
              value: metrics.totalReferrals.toLocaleString(),
              icon: <Users className="h-5 w-5 text-blue-400" />,
              color: "text-blue-700 dark:text-blue-300",
            },
            {
              label: "Enrolled",
              value: metrics.enrolled.toLocaleString(),
              icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
              color: "text-green-700 dark:text-green-300",
            },
            {
              label: "Enrollment Rate",
              value: `${metrics.enrollmentRate}%`,
              icon: <TrendingUp className="h-5 w-5 text-purple-400" />,
              color: "text-purple-700 dark:text-purple-300",
            },
            {
              label: "Est. Annual Value",
              value: `$${(metrics.valueUnlocked || 0).toLocaleString()}`,
              icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
              color: "text-emerald-700 dark:text-emerald-300",
              note: "estimated",
            },
          ].map((s) => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="pt-5 text-center">
                <div className="flex justify-center mb-2">{s.icon}</div>
                <p className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                {s.note && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.note}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status breakdown */}
        {metrics.totalReferrals > 0 && (
          <div className="flex gap-4 mb-6 flex-wrap text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {metrics.enrolled} enrolled
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              {metrics.pending} pending
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              {metrics.lost} not enrolled
            </span>
          </div>
        )}

        {/* ── By program ─────────────────────────────────────────────────── */}
        {byProgram?.length > 0 && (
          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Outcomes by Program</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-left border-b">
                      <th className="pb-2 font-medium">Program</th>
                      <th className="pb-2 text-right font-medium">Referrals</th>
                      <th className="pb-2 text-right font-medium">Enrolled</th>
                      <th className="pb-2 text-right font-medium">Not Enrolled</th>
                      <th className="pb-2 text-right font-medium">Est. Annual Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProgram.map((p) => (
                      <tr key={p.programCode} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{programLabel(p.programCode)}</td>
                        <td className="py-2.5 text-right">{p.referrals}</td>
                        <td className="py-2.5 text-right text-green-600 font-medium">
                          {p.enrolled}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">{p.lost}</td>
                        <td className="py-2.5 text-right text-emerald-600 font-medium">
                          {p.value > 0 ? `$${p.value.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td className="pt-3 text-sm">Total</td>
                      <td className="pt-3 text-right text-sm">{metrics.totalReferrals}</td>
                      <td className="pt-3 text-right text-sm text-green-600">
                        {metrics.enrolled}
                      </td>
                      <td className="pt-3 text-right text-sm text-muted-foreground">
                        {metrics.lost}
                      </td>
                      <td className="pt-3 text-right text-sm text-emerald-600">
                        ${metrics.valueUnlocked.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Recent activity ─────────────────────────────────────────────── */}
        {recentActivity?.length > 0 && (
          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {recentActivity.map((r) => {
                  const badge = STATUS_BADGE[r.status] ?? { label: r.status, variant: "outline" as const };
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-2.5 border-b last:border-0 gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-sm">{programLabel(r.programCode)}</span>
                        <span className="text-muted-foreground text-xs mx-2">→</span>
                        <span className="text-sm text-muted-foreground truncate">{r.orgName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {r.benefitValueEstimate && r.status === "enrolled" && (
                          <span className="text-xs text-emerald-600 font-medium">
                            ${r.benefitValueEstimate.toLocaleString()}/yr
                          </span>
                        )}
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden md:block">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {metrics.totalReferrals === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium mb-1">No referrals tracked yet</p>
              <p className="text-sm">
                Referrals will appear here as community health workers connect clients to programs.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Print narrative (only visible when printing) ─────────────── */}
        <div className="hidden print:block mt-8 p-6 border rounded-lg bg-blue-50">
          <h2 className="font-bold text-lg mb-2">Impact Summary</h2>
          <p className="text-sm leading-relaxed">
            {funder.name} community benefit investment connected{" "}
            <strong>{metrics.totalReferrals.toLocaleString()} families</strong> to public benefits
            programs through TCAF's community health worker network. Of those,{" "}
            <strong>{metrics.enrolled.toLocaleString()} confirmed enrollments</strong> were
            achieved — a{" "}
            <strong>{metrics.enrollmentRate}% enrollment rate</strong> — unlocking an estimated{" "}
            <strong>${metrics.valueUnlocked.toLocaleString()} in annual benefit value</strong> for
            Austin-area families.
          </p>
          {byProgram.length > 0 && (
            <p className="text-sm leading-relaxed mt-2">
              Top programs:{" "}
              {byProgram
                .slice(0, 3)
                .map(
                  (p) =>
                    `${programLabel(p.programCode)} (${p.enrolled} enrollments, $${p.value.toLocaleString()}/yr value)`
                )
                .join("; ")}
              .
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Report generated {new Date().toLocaleDateString()} · Powered by TCAF —
            thrivingcommunitiesforall.com
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-xs text-muted-foreground print:hidden">
          Powered by{" "}
          <a
            href="https://thrivingcommunitiesforall.com"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            TCAF — Thriving Communities for All
          </a>
        </footer>
      </div>
    </div>
  );
}
