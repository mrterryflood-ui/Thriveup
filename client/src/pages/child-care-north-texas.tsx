import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Baby, MapPin, ArrowLeft, Users, Building2,
  TrendingUp, Target, AlertTriangle, ChevronRight, CheckCircle2, Clock
} from "lucide-react";

const REGION_STATS = [
  { label: "Child care providers", value: "62", note: "All TRS-certified · Apr 2026", color: "text-sky-700" },
  { label: "Children served daily (current)", value: "1,032", note: "Feb 2026 finalized data", color: "text-blue-700" },
  { label: "TWC target — children/day", value: "1,268", note: "+23% growth required", color: "text-amber-700" },
  { label: "Job search success target", value: "62.2%", note: "Initial job search rate", color: "text-green-700" },
];

const COUNTIES = [
  { name: "Wichita", seat: "Wichita Falls", note: "Primary WFS center; largest county" },
  { name: "Archer", seat: "Archer City", note: "Rural; limited provider base" },
  { name: "Baylor", seat: "Seymour", note: "Rural; sparse population" },
  { name: "Clay", seat: "Henrietta", note: "Rural; proximity to Wichita Falls" },
  { name: "Cottle", seat: "Paducah", note: "Rural; very small population" },
  { name: "Foard", seat: "Crowell", note: "Rural; smallest in region" },
  { name: "Hardeman", seat: "Quanah", note: "Rural; western region" },
  { name: "Jack", seat: "Jacksboro", note: "Semi-rural; I-20 corridor" },
  { name: "Montague", seat: "Montague", note: "Rural; growing bedroom community" },
  { name: "Wilbarger", seat: "Vernon", note: "Secondary WFS center" },
  { name: "Young", seat: "Graham", note: "Semi-rural; natural gas sector" },
];

const PERFORMANCE_CONTEXT = [
  {
    measure: "Child Care Initial Job Search Success Rate",
    current: "~62%",
    target: "62.2%",
    what: "Percentage of CCS participants who secure employment within 90 days of beginning job search activities while receiving child care assistance.",
    why: "This is the primary workforce integration metric. It directly measures whether child care subsidy administration is achieving its core purpose: enabling parental employment.",
  },
  {
    measure: "Average Number of Children Served Per Day",
    current: "1,032",
    target: "1,268",
    what: "Average daily enrollment across all contracted TRS provider sites in the 11-county region.",
    why: "A 23% growth target (+236 children/day) signals WSNT wants active slot expansion — not just maintenance. This requires new provider recruitment or capacity growth at existing sites.",
  },
];

const TRANSITION_TIMELINE = [
  { date: "Jun 22, 2026", event: "Letter of Intent due", type: "deadline" },
  { date: "Jun 30, 2026", event: "Full proposal submission deadline", type: "deadline" },
  { date: "Aug 2026", event: "WSNT Board final selection", type: "milestone" },
  { date: "Sep 1, 2026", event: "Transition period begins (30 days)", type: "milestone" },
  { date: "Oct 1, 2026", event: "Full operations begin · Year 1 of up to 4", type: "milestone" },
];

export default function ChildCareNorthTexasPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">

      {/* Back nav */}
      <Link href="/child-care">
        <Button variant="ghost" size="sm" className="text-muted-foreground -ml-1" data-testid="button-back-child-care">
          <ArrowLeft className="h-4 w-4 mr-1" /> Child Care & Workforce
        </Button>
      </Link>

      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <Badge variant="outline" className="text-blue-700 border-blue-300">Workforce Solutions North Texas</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">North Texas Region</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Workforce Solutions North Texas (WSNT) administers child care services across 11 rural and semi-rural counties anchored in Wichita Falls. With 62 TRS-certified providers and 1,032 children served daily, the region faces a 23% growth requirement — and a $10.5M annual contract to execute it.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {REGION_STATS.map((s) => (
          <div key={s.label} className="p-4 rounded-lg border bg-card" data-testid={`stat-ntx-${s.label.slice(0, 15).replace(/\s/g, "-").toLowerCase()}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium mt-1 leading-tight">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* 11-county map table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">11-County Service Region</h2>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">County</th>
                <th className="text-left p-3 font-medium">County Seat</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Context</th>
              </tr>
            </thead>
            <tbody>
              {COUNTIES.map((c, i) => (
                <tr key={c.name} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"} data-testid={`row-county-${c.name.toLowerCase()}`}>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.seat}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Workforce centers physically staffed in Wichita Falls (primary), Bowie (Montague County), and Vernon (Wilbarger County). Staff are required to be on-site M–F 8 a.m.–5 p.m.
        </p>
      </div>

      {/* Performance measures */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">What Success Looks Like — By Measure</h2>
        </div>
        <div className="space-y-4">
          {PERFORMANCE_CONTEXT.map((pm) => (
            <Card key={pm.measure} data-testid={`pm-card-${pm.measure.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{pm.measure}</CardTitle>
                <div className="flex gap-3 mt-1">
                  <Badge variant="outline" className="text-blue-700 border-blue-300">Current: {pm.current}</Badge>
                  <Badge variant="outline" className="text-amber-700 border-amber-300">Target: {pm.target}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">What it measures:</span> {pm.what}</p>
                <p><span className="font-medium text-foreground">Why it matters:</span> {pm.why}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rural challenge */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">The Rural Delivery Challenge</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                Nine of eleven counties in the WSNT region are rural or frontier. Provider recruitment, staff retention, and family outreach in Cottle, Foard, Hardeman, and Baylor counties require strategies that differ fundamentally from urban CCS delivery. The administrative model must account for long drive times between centers, thin labor markets for credentialed staff, and limited internet connectivity in some family homes.
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-2">
                WSNT's decision to require 100% TRS certification across all providers is a quality floor that benefits children — but it also creates a provider supply constraint in rural counties where TRS-ready centers are scarce. Any growth toward the 1,268/day target requires both retaining current providers <em>and</em> supporting aspiring rural providers through the TRS certification pipeline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-sky-600" />
          <h2 className="text-xl font-semibold">Contract Timeline</h2>
        </div>
        <div className="space-y-2">
          {TRANSITION_TIMELINE.map((t, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg border bg-card" data-testid={`timeline-${i}`}>
              <div className={`shrink-0 px-2 py-1 rounded text-xs font-mono font-semibold ${t.type === "deadline" ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"}`}>
                {t.date}
              </div>
              <div className="flex items-center gap-2">
                {t.type === "deadline" && <Badge variant="destructive" className="text-xs">Deadline</Badge>}
                <p className="text-sm">{t.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link href="/child-care-wilco" className="flex-1">
          <Button variant="outline" className="w-full justify-between" data-testid="button-nav-wilco">
            Williamson County <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/child-care-workforce" className="flex-1">
          <Button variant="outline" className="w-full justify-between" data-testid="button-nav-workforce">
            Workforce Connection <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
