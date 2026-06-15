import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Shield, Home, DollarSign, Scale, Briefcase, Users, Building2, CheckCircle2, TrendingUp, Heart, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

interface Impact {
  totalSessions: number;
  byType: Record<string, number>;
  monthly: Record<string, number>;
  partnerOrgsCount: number;
  activeListings: number;
  vouchersRequested: number;
  vouchersApproved: number;
}

const SERVICE_META: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  "safety-plan":       { label: "Safety Plans", icon: Shield,    color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  "housing-assessment":{ label: "Housing Assessments", icon: Home, color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
  "benefits-bridge":   { label: "Benefits Sessions", icon: DollarSign, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  "legal-navigation":  { label: "Legal Navigations", icon: Scale, color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
  "employment":        { label: "Employment Sessions", icon: Briefcase, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  "housing-finder":    { label: "Housing Searches", icon: Building2, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  "voucher-request":   { label: "Voucher Requests", icon: DollarSign, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  "housing-placement": { label: "Housing Placements", icon: Home, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" },
  "peer-mentor":       { label: "Peer Mentor Sessions", icon: Heart, color: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300" },
};

function MonthlyBar({ month, value, max }: { month: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const label = month.slice(5); // "MM"
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-[10px] text-slate-500">{value}</span>
      <div className="w-full flex items-end" style={{ height: 48 }}>
        <div className="w-full rounded-t-sm bg-teal-500 transition-all" style={{ height: `${Math.max(pct, value > 0 ? 8 : 2)}%` }} />
      </div>
      <span className="text-[9px] text-slate-400">{label}</span>
    </div>
  );
}

export default function ImpactDashboardPage() {
  const { data: impact, isLoading } = useQuery<Impact>({ queryKey: ["/api/safe-passage/impact"] });

  const monthlyEntries = impact ? Object.entries(impact.monthly) : [];
  const maxMonthly = Math.max(1, ...monthlyEntries.map(([, v]) => v));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/20 dark:from-slate-950 dark:to-teal-950/10">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6">
          <ChevronLeft className="h-3 w-3" /> Back to Safe Passage
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Safe Passage Impact</h1>
            <p className="text-xs text-slate-500">Documented service delivery — updated in real time</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />)}
          </div>
        ) : impact ? (
          <div className="space-y-6">
            {/* Top metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Sessions", value: impact.totalSessions.toLocaleString(), icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
                { label: "Partner Organizations", value: impact.partnerOrgsCount.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                { label: "Active Housing Units", value: impact.activeListings.toLocaleString(), icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
                { label: "Vouchers Processed", value: impact.vouchersRequested.toLocaleString(), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              ].map(m => (
                <Card key={m.label} className="border-slate-200 dark:border-slate-700">
                  <CardContent className={`p-4 ${m.bg} rounded-xl text-center`}>
                    <m.icon className={`h-5 w-5 ${m.color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{m.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Monthly trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal-600" /> Monthly Sessions — Last 12 Months
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-end gap-1 h-16 mt-2">
                  {monthlyEntries.map(([month, value]) => (
                    <MonthlyBar key={month} month={month} value={value} max={maxMonthly} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By service type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sessions by Service Type</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(SERVICE_META).map(([key, meta]) => {
                  const count = impact.byType[key] || 0;
                  return (
                    <div key={key} className="flex items-center justify-between p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <meta.icon className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">{meta.label}</span>
                      </div>
                      <Badge className={`text-[10px] font-bold ${meta.color}`}>{count}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* OVW context */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-5 text-white">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Building Documented History</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">Every session logged here contributes to TCAF's documented history of effective work concerning domestic violence, dating violence, sexual assault, and stalking — the eligibility standard for federal OVW grants (34 U.S.C. § 12291(a)(50)). Partner organizations also build their own documented service record through this platform.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["Safety planning", "Legal advocacy", "Benefits navigation", "Housing placement", "Employment support", "Peer mentorship"].map(s => (
                      <Badge key={s} variant="outline" className="text-[10px] border-teal-500 text-teal-300">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No data yet — impact builds as survivors and partners use the tools.</p>
          </div>
        )}
      </div>
    </div>
  );
}
