import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, GraduationCap, FileX, HeartPulse, UsersRound,
  ShieldAlert, ArrowDown, Zap, ChevronDown, ChevronUp,
  Link2, Target, TrendingDown, Loader2, MapPin, AlertTriangle,
  CheckCircle2, Lightbulb, ArrowRight
} from "lucide-react";

const CHAIN_ICONS: Record<string, any> = {
  "dollar-sign": DollarSign,
  "graduation-cap": GraduationCap,
  "file-x": FileX,
  "heart-pulse": HeartPulse,
  "users-x": UsersRound,
  "shield-alert": ShieldAlert,
};

const CHAIN_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300 dark:border-red-800", text: "text-red-700 dark:text-red-400", badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-300 dark:border-orange-800", text: "text-orange-700 dark:text-orange-400", badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  rose: { bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-300 dark:border-rose-800", text: "text-rose-700 dark:text-rose-400", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/20", border: "border-purple-300 dark:border-purple-800", text: "text-purple-700 dark:text-purple-400", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  slate: { bg: "bg-slate-50 dark:bg-slate-950/20", border: "border-slate-400 dark:border-slate-700", text: "text-slate-700 dark:text-slate-400", badge: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
};

function ChainLink({ link, isLast }: { link: any; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CHAIN_ICONS[link.icon] || ShieldAlert;
  const colors = CHAIN_COLORS[link.color] || CHAIN_COLORS.slate;

  return (
    <div className="relative" data-testid={`chain-link-${link.id}`}>
      <Card className={`${colors.bg} ${colors.border} border-2 transition-all duration-300 ${expanded ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"}`}>
        <button className="w-full text-left p-4 md:p-5" onClick={() => setExpanded(!expanded)} data-testid={`button-expand-chain-${link.id}`}>
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${colors.badge}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-base">{link.label}</h3>
                {link.type === "risk-protective" ? (
                  <>
                    <Badge variant="destructive" className="text-xs">Risk Factor</Badge>
                    <Badge className="text-xs bg-green-600">Protective Factor</Badge>
                  </>
                ) : link.type === "risk" ? (
                  <Badge variant="destructive" className="text-xs">Risk Factor</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Downstream Outcome</Badge>
                )}
              </div>
              <p className={`text-sm font-medium ${colors.text}`}>{link.metric}</p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${expanded ? "rotate-180 bg-primary/10" : "bg-muted"}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t px-4 pb-5 md:px-5 pt-4 space-y-4">
            <p className="text-sm leading-relaxed">{link.detail}</p>

            {link.dataPoints && link.dataPoints.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">By County</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {link.dataPoints.map((dp: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-black/20 border text-sm">
                      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{dp.county}</span>
                      <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{dp.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {link.interventions && link.interventions.length > 0 && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Targeted Interventions — Break This Link
                </p>
                {link.interventions.map((inv: string, i: number) => (
                  <p key={i} className="text-sm flex items-start gap-2 mb-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                    {inv}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {!isLast && (
        <div className="flex justify-center py-1.5">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-3 bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20" />
            <ArrowDown className="h-5 w-5 text-muted-foreground/60" />
            <div className="w-0.5 h-3 bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/40" />
          </div>
        </div>
      )}
    </div>
  );
}

export function SDOHImpactChain({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/benefits/sdoh-impact-chain"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading SDOH Impact Chain...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const chain = data as any;

  if (compact) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-red-50/30 via-amber-50/20 to-purple-50/30 dark:from-red-950/10 dark:via-amber-950/10 dark:to-purple-950/10" data-testid="sdoh-chain-compact">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5 text-primary" /> SDOH Impact Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {chain.links?.map((link: any, i: number) => {
              const Icon = CHAIN_ICONS[link.icon] || ShieldAlert;
              const colors = CHAIN_COLORS[link.color] || CHAIN_COLORS.slate;
              return (
                <div key={link.id} className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${colors.badge} text-xs font-medium`}>
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </div>
                  {i < chain.links.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-red-100/60 dark:bg-red-900/20">
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{chain.interventionSummary?.totalGap?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Not Enrolled</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-100/60 dark:bg-amber-900/20">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{chain.interventionSummary?.unclaimedBenefits}</p>
              <p className="text-xs text-muted-foreground">Unclaimed</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-100/60 dark:bg-purple-900/20">
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{chain.interventionSummary?.highBarrierTracts}</p>
              <p className="text-xs text-muted-foreground">High-Barrier Tracts</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            These problems don't have county boundaries. A family on N. Lamar and a family in Pflugerville face the same chain.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2" data-testid="sdoh-chain-full">
      <div className="text-center mb-6">
        <Badge variant="outline" className="mb-3 text-sm px-3 py-1">
          <Link2 className="h-3.5 w-3.5 mr-1.5" /> SDOH Impact Chain — 5-County Analysis
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Break the Chain, Change the Outcome</h2>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Poverty, education gaps, benefit enrollment failures, health insecurity, social isolation, and crime
          are links in the same chain. These problems don't respect county lines — a family in North Austin
          faces the same chain as a family in Pflugerville or Manor. See the chain. Break it with targeted interventions.
        </p>
      </div>

      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">No Boundaries, No Silos</p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Travis and Williamson counties are bordered by name only. North Austin IS Pflugerville IS Manor.
                The SDOH Impact Chain cuts across every artificial boundary. Our AI engines, RPLICE framework,
                GIS mapping, and Benefits Intelligence System work as one connected ecosystem to show the complete picture
                and deliver targeted interventions at every link in the chain.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {chain.links?.map((link: any, i: number) => (
        <ChainLink key={link.id} link={link} isLast={i === chain.links.length - 1} />
      ))}

      {chain.interventionSummary && (
        <Card className="mt-4 border-2 border-green-300 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" /> Breaking Points — Where TCAF Intervenes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-white dark:bg-background border">
                <p className="text-2xl font-bold">{chain.interventionSummary.totalGap?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">People Not Enrolled</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white dark:bg-background border">
                <p className="text-2xl font-bold">{chain.interventionSummary.unclaimedBenefits}</p>
                <p className="text-xs text-muted-foreground">Annual Benefits Unclaimed</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white dark:bg-background border">
                <p className="text-2xl font-bold">{chain.interventionSummary.tractsCovered}</p>
                <p className="text-xs text-muted-foreground">Census Tracts Mapped</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white dark:bg-background border">
                <p className="text-2xl font-bold text-red-600">{chain.interventionSummary.highBarrierTracts}</p>
                <p className="text-xs text-muted-foreground">High-Barrier Tracts</p>
              </div>
            </div>

            <div className="space-y-2">
              {chain.interventionSummary.breakingPoints?.map((bp: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-background border">
                  <Zap className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-sm">{bp.link}:</span>{" "}
                    <span className="text-sm text-muted-foreground">{bp.intervention}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">{bp.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {chain.chainNarrative && (
        <Card className="mt-4 bg-muted/30">
          <CardContent className="pt-5">
            <p className="text-sm leading-relaxed italic text-muted-foreground">{chain.chainNarrative}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
