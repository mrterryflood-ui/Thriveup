/**
 * /partner-dashboard/shared/:token
 *
 * Public read-only view of a partner org's dashboard.
 * No key required — the share token from the URL is the credential.
 * Shows community data, SDOH indicators, benefits, and impact.
 * A banner at the top identifies the org and links to get your own dashboard.
 */

import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  MapPin,
  Users,
  TrendingUp,
  Shield,
  FileText,
  Globe,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Number(n).toFixed(1)}%`;
}
function gradeColor(g: string | null | undefined): string {
  if (!g) return "bg-gray-100 text-gray-500 border-gray-200";
  const u = g.toUpperCase();
  if (u === "A") return "bg-green-100 text-green-800 border-green-300";
  if (u === "B") return "bg-blue-100 text-blue-800 border-blue-300";
  if (u === "C") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (u === "D") return "bg-orange-100 text-orange-700 border-orange-300";
  if (u === "F") return "bg-red-100 text-red-800 border-red-300";
  return "bg-gray-100 text-gray-500 border-gray-200";
}

interface TabData<T = any> {
  status: "idle" | "loading" | "ok" | "error";
  data?: T;
  error?: string;
}
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ── Shared view ───────────────────────────────────────────────────────────────
export default function PartnerDashboardSharedPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/partner-dashboard/shared/:token");
  const token = params?.token ?? "";

  const [profile, setProfile] = useState<TabData>({ status: "idle" });
  const [story, setStory] = useState<TabData>({ status: "idle" });
  const [benefits, setBenefits] = useState<TabData>({ status: "idle" });

  useEffect(() => {
    if (!token) return;

    // Load profile first, then parallel data
    (async () => {
      setProfile({ status: "loading" });
      try {
        const r = await fetch(`/api/partner-dashboard/share/${token}/profile`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Invalid share link");
        setProfile({ status: "ok", data: d });
      } catch (e: any) {
        setProfile({ status: "error", error: e.message });
        return;
      }

      // Load story and benefits in parallel after profile succeeds
      setStory({ status: "loading" });
      setBenefits({ status: "loading" });

      const [storyRes, benefitsRes] = await Promise.allSettled([
        fetch(`/api/partner-dashboard/share/${token}/community-story`).then(
          (r) => r.json(),
        ),
        fetch(`/api/partner-dashboard/share/${token}/benefits`).then((r) =>
          r.json(),
        ),
      ]);

      if (storyRes.status === "fulfilled") {
        setStory({ status: "ok", data: storyRes.value });
      } else {
        setStory({ status: "error", error: "Community data unavailable." });
      }

      if (benefitsRes.status === "fulfilled") {
        setBenefits({ status: "ok", data: benefitsRes.value });
      } else {
        setBenefits({ status: "error", error: "Benefits unavailable." });
      }
    })();
  }, [token]);

  // ── Invalid token ─────────────────────────────────────────────────────────
  if (profile.status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Share link unavailable
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {profile.error ??
              "This link may have expired or been removed by the organization."}
          </p>
          <Link href="/for-nonprofits">
            <Button className="bg-blue-700 hover:bg-blue-800">
              Get your own dashboard →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const org = profile.data ?? {};
  const brief = story.data?.brief ?? {};
  const geo = brief.geography ?? {};
  const demo = brief.demographics ?? {};
  const indicators: any[] = brief.indicators ?? [];
  const programs: any[] = benefits.data?.programs ?? [];

  // Synthesize indicators from flat demographics if array is empty
  const displayIndicators =
    indicators.length > 0
      ? indicators
      : Object.keys(demo).length > 0
        ? ([
            demo.povertyRate != null
              ? {
                  label: "Poverty rate",
                  displayValue: pct(demo.povertyRate),
                  grade:
                    demo.povertyRate > 20
                      ? "F"
                      : demo.povertyRate > 15
                        ? "D"
                        : "C",
                  source: "Census ACS",
                }
              : null,
            demo.unemploymentRate != null
              ? {
                  label: "Unemployment",
                  displayValue: pct(demo.unemploymentRate),
                  source: "Census ACS",
                }
              : null,
            demo.medianIncome != null
              ? {
                  label: "Median income",
                  displayValue: `$${fmt(demo.medianIncome)}`,
                  source: "Census ACS",
                }
              : null,
            demo.noHealthInsurance != null
              ? {
                  label: "Uninsured",
                  displayValue: pct(demo.noHealthInsurance),
                  source: "Census ACS",
                }
              : null,
            demo.singleParentHouseholds != null
              ? {
                  label: "Single-parent HH",
                  displayValue: pct(demo.singleParentHouseholds),
                  source: "Census ACS",
                }
              : null,
            demo.educationBelowHS != null
              ? {
                  label: "Below HS diploma",
                  displayValue: pct(demo.educationBelowHS),
                  source: "Census ACS",
                }
              : null,
          ].filter(Boolean) as any[])
        : [];

  const popRaw =
    geo.population ?? geo.totalPopulation ?? demo.totalPopulation ?? null;
  const povertyRate =
    demo.povertyRate ??
    indicators.find((i: any) =>
      (i.label ?? "").toLowerCase().includes("poverty"),
    )?.value ??
    null;

  const narratives = brief.narratives ?? brief.narrative ?? {};
  const narrativeText =
    typeof narratives === "string"
      ? narratives
      : (narratives.demographics ??
        narratives.need ??
        narratives.overview ??
        (Object.keys(demo).length > 0
          ? `${geo.displayName ?? org.location ?? "This community"} has a poverty rate of ${povertyRate != null ? povertyRate.toFixed(1) + "%" : "—"}${demo.totalPopulation ? " with a population of " + fmt(demo.totalPopulation) : ""}.`
          : ""));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Shared-by banner ── */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-200 text-xs font-medium mb-1">
                <LayoutDashboard className="h-3.5 w-3.5" />
                ThriveUp Partner Dashboard — Shared View
              </div>
              {profile.status === "loading" ? (
                <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
              ) : (
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 opacity-70" />
                  {org.orgName ?? "Partner Organization"}
                </h1>
              )}
              {org.location && (
                <p className="text-blue-200 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" /> {org.location}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                Read-only
              </Badge>
              <Link href="/for-nonprofits">
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white h-8 text-xs"
                >
                  Get your own dashboard <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stat cards ── */}
        {story.status === "loading" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}
        {story.status === "ok" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: MapPin,
                label: "Service area",
                value: geo.displayName ?? org.location ?? "—",
                color: "bg-blue-50 border-blue-200 text-blue-700",
              },
              {
                icon: Users,
                label: "Population",
                value: popRaw ? fmt(popRaw) : "—",
                color: "bg-purple-50 border-purple-200 text-purple-700",
              },
              {
                icon: TrendingUp,
                label: "Poverty rate",
                value: povertyRate != null ? pct(povertyRate) : "—",
                color:
                  povertyRate != null && povertyRate > 18
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-green-50 border-green-200 text-green-700",
              },
            ].map((s) => (
              <Card key={s.label} className="border">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${s.color}`}
                    >
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {s.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900 mt-0.5">
                        {s.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── SDOH indicators ── */}
        {story.status === "ok" && displayIndicators.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Social Determinants of Health —{" "}
                {geo.displayName ?? org.location}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayIndicators.slice(0, 12).map((ind: any, i: number) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-600 truncate pr-2">
                        {ind.label ?? ind.name ?? "Indicator"}
                      </p>
                      {ind.grade && (
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded border ${gradeColor(ind.grade)}`}
                        >
                          {ind.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {ind.displayValue ?? "—"}
                    </p>
                    {ind.source && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ind.source}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Demographics narrative ── */}
        {story.status === "ok" && narrativeText && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Statement of Need</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(narrativeText);
                    toast({
                      title: "Copied!",
                      description: "Paste into your grant proposal.",
                    });
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                {narrativeText}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Benefits catalog ── */}
        {benefits.status === "loading" && <Skeleton className="h-32" />}
        {benefits.status === "ok" && programs.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Active Programs ({programs.length})
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Live catalog
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {programs.slice(0, 6).map((prog: any, i: number) => (
                <div
                  key={prog.id ?? i}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-3.5 w-3.5 text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {prog.title}
                      </h4>
                      {prog.status && (
                        <Badge
                          className={`text-xs shrink-0 ${prog.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                        >
                          {prog.status}
                        </Badge>
                      )}
                    </div>
                    {prog.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {prog.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Footer CTA ── */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5 text-center">
          <LayoutDashboard className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900 text-sm mb-1">
            Get a dashboard like this for your organization
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Free. Takes 60 seconds. No developer needed.
          </p>
          <Link href="/for-nonprofits">
            <Button className="bg-blue-700 hover:bg-blue-800 h-8 text-xs">
              Get my partner dashboard{" "}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-center text-gray-400 pb-4">
          Powered by ThriveUp · Data from Census ACS · Shared by{" "}
          {org.orgName ?? "a partner organization"}
          <br />
          <a
            href="/partner-dashboard"
            className="underline hover:text-gray-600"
          >
            Sign in to your own dashboard
          </a>
        </p>
      </div>
    </div>
  );
}
