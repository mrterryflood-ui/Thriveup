import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, MapPin, AlertTriangle, Target, TrendingUp, ChevronRight,
  UserCheck, Clock, CheckCircle2, ArrowRight, BarChart3,
  Home, Briefcase, Heart, Shield, Scale, GraduationCap,
  Plus, Search, Eye, UserPlus, Phone, FileText, RefreshCw,
  Baby, Car, Brain, Pill,
} from "lucide-react";

const COUNTIES = [
  { name: "Travis County", fips: "48453", population: 1290188, oyEstimate: 18240, oyRate: 8.2, lat: 30.3074, lng: -97.7561, color: "#3b82f6" },
  { name: "Williamson County", fips: "48491", population: 609017, oyEstimate: 7110, oyRate: 6.8, lat: 30.6483, lng: -97.6011, color: "#8b5cf6" },
  { name: "Hays County", fips: "48209", population: 251026, oyEstimate: 4320, oyRate: 9.1, lat: 30.0592, lng: -97.9978, color: "#22c55e" },
  { name: "Bastrop County", fips: "48021", population: 104078, oyEstimate: 2890, oyRate: 11.4, lat: 30.1103, lng: -97.3142, color: "#f97316" },
  { name: "Caldwell County", fips: "48055", population: 46791, oyEstimate: 1680, oyRate: 12.7, lat: 29.8369, lng: -97.6200, color: "#ef4444" },
];

const PIPELINE_STAGES = [
  { key: "identification", label: "Identification", icon: Search, count: 34240, color: "#6366f1" },
  { key: "contact", label: "Contact", icon: Phone, count: 18650, color: "#8b5cf6" },
  { key: "engagement", label: "Engagement", icon: UserPlus, count: 9420, color: "#a855f7" },
  { key: "enrollment", label: "Enrollment", icon: UserCheck, count: 4180, color: "#22c55e" },
  { key: "retention", label: "Retention", icon: CheckCircle2, count: 3210, color: "#14b8a6" },
];

const REFERRAL_SOURCES = [
  { source: "Juvenile Justice", count: 412, percent: 24, icon: Scale },
  { source: "CPS / Child Welfare", count: 289, percent: 17, icon: Shield },
  { source: "Schools / Districts", count: 356, percent: 21, icon: GraduationCap },
  { source: "Community Partners", count: 245, percent: 14, icon: Users },
  { source: "Self-Referral", count: 198, percent: 12, icon: UserCheck },
  { source: "Healthcare Provider", count: 112, percent: 7, icon: Heart },
  { source: "Other", count: 88, percent: 5, icon: FileText },
];

const BARRIERS = [
  { id: "housing", label: "Housing Instability", icon: Home, severity: 78, affected: 2840, color: "#ef4444" },
  { id: "transportation", label: "Transportation", icon: Car, severity: 72, affected: 2610, color: "#f97316" },
  { id: "childcare", label: "Childcare Needs", icon: Baby, severity: 58, affected: 1420, color: "#eab308" },
  { id: "legal", label: "Legal Issues", icon: Scale, severity: 65, affected: 1890, color: "#f97316" },
  { id: "mental_health", label: "Mental Health", icon: Brain, severity: 82, affected: 3120, color: "#ef4444" },
  { id: "substance", label: "Substance Use", icon: Pill, severity: 54, affected: 1280, color: "#eab308" },
  { id: "education", label: "Education Gap", icon: GraduationCap, severity: 68, affected: 2350, color: "#f97316" },
  { id: "employment", label: "Employment Barriers", icon: Briefcase, severity: 71, affected: 2540, color: "#f97316" },
];

const REENGAGEMENT_STRATEGIES = [
  {
    name: "Motivational Interviewing",
    evidenceBase: "Strong",
    description: "Person-centered counseling to strengthen motivation for change. Used in initial outreach contacts.",
    targetBarriers: ["mental_health", "substance"],
    successRate: 64,
  },
  {
    name: "Peer Navigator Model",
    evidenceBase: "Strong",
    description: "Near-peer mentors with lived experience guide OY through enrollment and early retention.",
    targetBarriers: ["housing", "legal", "employment"],
    successRate: 71,
  },
  {
    name: "Rapid Re-Housing + Employment",
    evidenceBase: "Moderate",
    description: "Co-enrolled housing + employment supports to address top two barriers simultaneously.",
    targetBarriers: ["housing", "employment"],
    successRate: 58,
  },
  {
    name: "Mobile Outreach Teams",
    evidenceBase: "Strong",
    description: "Street-level outreach in identified hotspots using trauma-informed engagement.",
    targetBarriers: ["housing", "substance", "mental_health"],
    successRate: 52,
  },
  {
    name: "Digital Engagement Campaign",
    evidenceBase: "Emerging",
    description: "Social media and text-based outreach targeting 16-24 year olds through trusted channels.",
    targetBarriers: ["education", "employment"],
    successRate: 38,
  },
  {
    name: "School Re-Engagement Centers",
    evidenceBase: "Moderate",
    description: "Drop-in centers near schools for credit recovery, GED prep, and wraparound services.",
    targetBarriers: ["education", "childcare", "transportation"],
    successRate: 61,
  },
];

const RETENTION_DATA = [
  { period: "30 Days", enrolled: 4180, retained: 3640, rate: 87 },
  { period: "60 Days", enrolled: 4180, retained: 3210, rate: 77 },
  { period: "90 Days", enrolled: 4180, retained: 2870, rate: 69 },
];

const SUCCESS_STORIES = [
  {
    id: "ss-1",
    initials: "MJ",
    age: 19,
    county: "Travis",
    referralSource: "Juvenile Justice",
    barriers: ["Housing Instability", "Legal Issues", "Education Gap"],
    enrollment: "2025-09-15",
    status: "Active",
    milestones: ["Secured transitional housing", "Enrolled in GED program", "Completed job readiness training"],
    retentionDays: 127,
    notes: "Referred from Travis County Juvenile Probation. Engaged through peer navigator model. Currently working part-time at H-E-B while pursuing GED.",
  },
  {
    id: "ss-2",
    initials: "AR",
    age: 21,
    county: "Bastrop",
    referralSource: "Self-Referral",
    barriers: ["Transportation", "Employment Barriers"],
    enrollment: "2025-11-02",
    status: "Active",
    milestones: ["Obtained driver's license", "Completed forklift certification", "Hired at Samsung Austin"],
    retentionDays: 82,
    notes: "Walked into Bastrop community center after seeing outreach flyer. Enrolled in pre-apprenticeship track. Strong retention.",
  },
  {
    id: "ss-3",
    initials: "TW",
    age: 17,
    county: "Williamson",
    referralSource: "Schools / Districts",
    barriers: ["Mental Health", "Education Gap"],
    enrollment: "2026-01-10",
    status: "Active",
    milestones: ["Connected with mental health counselor", "Re-enrolled in credit recovery"],
    retentionDays: 45,
    notes: "Referred by Round Rock ISD after dropping out. Engaged through school re-engagement center. Showing strong academic progress.",
  },
  {
    id: "ss-4",
    initials: "KL",
    age: 22,
    county: "Hays",
    referralSource: "Community Partners",
    barriers: ["Substance Use", "Housing Instability", "Employment Barriers"],
    enrollment: "2025-08-20",
    status: "Completed",
    milestones: ["Completed substance treatment program", "Obtained stable housing", "Earned CNA certification", "Employed at Ascension Seton"],
    retentionDays: 210,
    notes: "Referred by Hays County substance abuse coalition. Successfully completed 180-day program. Now employed in healthcare sector.",
  },
];

function getOYRateColor(rate: number): string {
  if (rate >= 11) return "#ef4444";
  if (rate >= 9) return "#f97316";
  if (rate >= 7) return "#eab308";
  return "#22c55e";
}

function getSeverityColor(severity: number): string {
  if (severity >= 75) return "#ef4444";
  if (severity >= 60) return "#f97316";
  if (severity >= 40) return "#eab308";
  return "#22c55e";
}

function PopulationOverview() {
  const totalOY = COUNTIES.reduce((sum, c) => sum + c.oyEstimate, 0);
  const totalPop = COUNTIES.reduce((sum, c) => sum + c.population, 0);
  const avgRate = ((totalOY / totalPop) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-indigo-900/10 border-indigo-500/30 dark:bg-indigo-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Opportunity Youth Population Estimates</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Based on Census ACS 5-year estimates for ages 16-24 not enrolled in school and not employed.
              5-county service area: Travis, Williamson, Hays, Bastrop, and Caldwell counties.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4" data-testid="stat-total-oy">
          <div className="flex flex-col items-center text-center gap-1">
            <Users className="h-5 w-5 text-indigo-500" />
            <span className="text-2xl font-bold">{totalOY.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Est. Opportunity Youth</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-avg-rate">
          <div className="flex flex-col items-center text-center gap-1">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{avgRate}%</span>
            <span className="text-xs text-muted-foreground">Regional OY Rate</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-enrolled">
          <div className="flex flex-col items-center text-center gap-1">
            <UserCheck className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{PIPELINE_STAGES[3].count.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Currently Enrolled</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-retention">
          <div className="flex flex-col items-center text-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-teal-500" />
            <span className="text-2xl font-bold">{RETENTION_DATA[2].rate}%</span>
            <span className="text-xs text-muted-foreground">90-Day Retention</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {COUNTIES.map((county) => (
          <Card key={county.fips} className="relative overflow-hidden" data-testid={`card-county-${county.fips}`}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: county.color }} />
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">{county.name.replace(" County", "")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <span className="text-3xl font-bold" style={{ color: getOYRateColor(county.oyRate) }}>
                  {county.oyRate}%
                </span>
                <p className="text-xs text-muted-foreground">OY Rate (16-24)</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">Population</span>
                  <span className="font-medium">{county.population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-muted-foreground">Est. OY</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">{county.oyEstimate.toLocaleString()}</span>
                </div>
              </div>
              <Progress value={county.oyRate * 8} className="h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Geographic Distribution</CardTitle>
          <CardDescription>Estimated OY population by county (Census ACS data)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {COUNTIES.sort((a, b) => b.oyEstimate - a.oyEstimate).map((county) => {
              const maxOY = COUNTIES[0].oyEstimate;
              const width = (county.oyEstimate / maxOY) * 100;
              return (
                <div key={county.fips} className="flex items-center gap-3" data-testid={`bar-county-${county.fips}`}>
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: county.color }} />
                  <span className="text-sm font-medium w-28 truncate">{county.name.replace(" County", "")}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${width}%`, backgroundColor: county.color }}
                    />
                  </div>
                  <span className="text-sm font-bold w-20 text-right" style={{ color: getOYRateColor(county.oyRate) }}>
                    {county.oyEstimate.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OutreachPipeline() {
  const totalIdentified = PIPELINE_STAGES[0].count;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outreach Pipeline</CardTitle>
          <CardDescription>Journey from identification through retention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {PIPELINE_STAGES.map((stage, i) => {
              const convRate = i > 0 ? Math.round((stage.count / PIPELINE_STAGES[i - 1].count) * 100) : 100;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex-1 flex flex-col items-center" data-testid={`pipeline-stage-${stage.key}`}>
                  <div className="flex items-center gap-2 w-full">
                    {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />}
                    <Card className="flex-1 p-4 text-center">
                      <Icon className="h-6 w-6 mx-auto mb-2" style={{ color: stage.color }} />
                      <p className="text-lg font-bold">{stage.count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{stage.label}</p>
                      {i > 0 && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {convRate}% conv.
                        </Badge>
                      )}
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            <span>Overall pipeline conversion: {Math.round((PIPELINE_STAGES[4].count / totalIdentified) * 100)}% (Identified to Retained)</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Referral Sources</CardTitle>
            <CardDescription>How OY enter our pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {REFERRAL_SOURCES.map((ref) => {
                const Icon = ref.icon;
                return (
                  <div key={ref.source} className="flex items-center gap-3" data-testid={`referral-source-${ref.source.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm w-36 truncate">{ref.source}</span>
                    <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${ref.percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{ref.count}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{ref.percent}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention Tracking</CardTitle>
            <CardDescription>30 / 60 / 90 day retention after enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RETENTION_DATA.map((ret) => (
                <div key={ret.period} className="space-y-1" data-testid={`retention-${ret.period.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{ret.period}</span>
                    <span>
                      <span className="font-bold">{ret.retained.toLocaleString()}</span>
                      <span className="text-muted-foreground"> / {ret.enrolled.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${ret.rate}%`,
                          backgroundColor: ret.rate >= 80 ? "#22c55e" : ret.rate >= 70 ? "#eab308" : "#f97316",
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right" style={{
                      color: ret.rate >= 80 ? "#22c55e" : ret.rate >= 70 ? "#eab308" : "#f97316",
                    }}>
                      {ret.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                WIOA Title I Youth performance target: 70% retention at 90 days.
                Current performance: <span className="font-semibold text-foreground">{RETENTION_DATA[2].rate}%</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BarrierAssessment() {
  const [selectedCounty, setSelectedCounty] = useState("all");

  const countyMultiplier = useMemo(() => {
    if (selectedCounty === "all") return 1;
    const county = COUNTIES.find(c => c.fips === selectedCounty);
    if (!county) return 1;
    const totalOY = COUNTIES.reduce((sum, c) => sum + c.oyEstimate, 0);
    return county.oyEstimate / totalOY;
  }, [selectedCounty]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedCounty} onValueChange={setSelectedCounty}>
          <SelectTrigger className="w-[220px]" data-testid="select-barrier-county">
            <SelectValue placeholder="Filter by county" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {COUNTIES.map(c => (
              <SelectItem key={c.fips} value={c.fips}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BARRIERS.map((barrier) => {
          const Icon = barrier.icon;
          const adjusted = Math.round(barrier.affected * countyMultiplier);
          return (
            <Card key={barrier.id} className="p-4" data-testid={`card-barrier-${barrier.id}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-md p-2 bg-muted">
                  <Icon className="h-5 w-5" style={{ color: getSeverityColor(barrier.severity) }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{barrier.label}</p>
                  <p className="text-xs text-muted-foreground">{adjusted.toLocaleString()} affected</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Severity</span>
                  <span className="font-bold" style={{ color: getSeverityColor(barrier.severity) }}>{barrier.severity}%</span>
                </div>
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barrier.severity}%`, backgroundColor: getSeverityColor(barrier.severity) }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Barrier Co-Occurrence Analysis</CardTitle>
          <CardDescription>Most common barrier combinations among enrolled OY</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { combo: "Mental Health + Housing Instability", count: 1420, percent: 34 },
              { combo: "Education Gap + Employment Barriers", count: 1180, percent: 28 },
              { combo: "Legal Issues + Housing + Employment", count: 890, percent: 21 },
              { combo: "Transportation + Childcare", count: 720, percent: 17 },
              { combo: "Substance Use + Mental Health", count: 680, percent: 16 },
            ].map((item) => (
              <div key={item.combo} className="flex items-center gap-3" data-testid={`barrier-combo-${item.combo.toLowerCase().replace(/\s+\+\s+/g, '-')}`}>
                <span className="text-sm w-64 truncate">{item.combo}</span>
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${item.percent * 2.5}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-14 text-right">{item.count}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{item.percent}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReengagementStrategies() {
  return (
    <div className="space-y-6">
      <Card className="p-4 bg-green-900/10 border-green-500/30 dark:bg-green-900/20">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-300">Evidence-Based Re-engagement</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Strategies aligned with WIOA Title I Youth program requirements. Evidence ratings reflect available research from
              MDRC, RAND, and DOL evaluations.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REENGAGEMENT_STRATEGIES.map((strategy) => (
          <Card key={strategy.name} data-testid={`card-strategy-${strategy.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm">{strategy.name}</CardTitle>
                <Badge
                  variant={strategy.evidenceBase === "Strong" ? "default" : strategy.evidenceBase === "Moderate" ? "secondary" : "outline"}
                >
                  {strategy.evidenceBase} Evidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{strategy.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {strategy.targetBarriers.map((bId) => {
                  const barrier = BARRIERS.find(b => b.id === bId);
                  return barrier ? (
                    <Badge key={bId} variant="outline" className="text-xs">
                      {barrier.label}
                    </Badge>
                  ) : null;
                })}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Success Rate:</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-green-500"
                    style={{ width: `${strategy.successRate}%` }}
                  />
                </div>
                <span className="text-sm font-bold" style={{
                  color: strategy.successRate >= 60 ? "#22c55e" : strategy.successRate >= 45 ? "#eab308" : "#f97316"
                }}>
                  {strategy.successRate}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CaseTracking() {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStories = useMemo(() => {
    if (!searchTerm) return SUCCESS_STORIES;
    const lower = searchTerm.toLowerCase();
    return SUCCESS_STORIES.filter(s =>
      s.initials.toLowerCase().includes(lower) ||
      s.county.toLowerCase().includes(lower) ||
      s.referralSource.toLowerCase().includes(lower)
    );
  }, [searchTerm]);

  const selected = SUCCESS_STORIES.find(s => s.id === selectedCase);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by initials, county, or referral source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-case-search"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-sm" data-testid="text-cases-heading">Case Tracking ({filteredStories.length})</h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 pr-3">
              {filteredStories.map((story) => (
                <Card
                  key={story.id}
                  className={`p-4 cursor-pointer transition-colors ${selectedCase === story.id ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setSelectedCase(story.id)}
                  data-testid={`card-case-${story.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {story.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Youth {story.initials}</p>
                        <p className="text-xs text-muted-foreground">Age {story.age} - {story.county}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={story.status === "Active" ? "default" : "secondary"} className="text-xs">
                      {story.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {story.retentionDays}d retained
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <Card className="p-6" data-testid="card-case-detail">
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-lg font-bold text-indigo-700 dark:text-indigo-300">
                      {selected.initials}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Youth {selected.initials}</h3>
                      <p className="text-sm text-muted-foreground">
                        Age {selected.age} | {selected.county} County | Enrolled {selected.enrollment}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={selected.status === "Active" ? "default" : "secondary"}>
                      {selected.status}
                    </Badge>
                    <Badge variant="outline">{selected.retentionDays} days retained</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">REFERRAL SOURCE</p>
                  <Badge variant="secondary">{selected.referralSource}</Badge>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">IDENTIFIED BARRIERS</p>
                  <div className="flex gap-1 flex-wrap">
                    {selected.barriers.map(b => (
                      <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">MILESTONES ACHIEVED</p>
                  <div className="space-y-2">
                    {selected.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">CASE NOTES</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-select-case">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Select a case from the list to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OpportunityYouthPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6" data-testid="page-opportunity-youth">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-oy-title">
            <Users className="h-7 w-7 text-indigo-500" />
            Opportunity Youth Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Disconnected youth outreach, engagement, and retention tracking across 5 counties
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-1" /> Population Overview
          </TabsTrigger>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            <ArrowRight className="h-4 w-4 mr-1" /> Outreach Pipeline
          </TabsTrigger>
          <TabsTrigger value="barriers" data-testid="tab-barriers">
            <AlertTriangle className="h-4 w-4 mr-1" /> Barrier Assessment
          </TabsTrigger>
          <TabsTrigger value="strategies" data-testid="tab-strategies">
            <Target className="h-4 w-4 mr-1" /> Re-engagement
          </TabsTrigger>
          <TabsTrigger value="cases" data-testid="tab-cases">
            <Eye className="h-4 w-4 mr-1" /> Case Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PopulationOverview />
        </TabsContent>
        <TabsContent value="pipeline">
          <OutreachPipeline />
        </TabsContent>
        <TabsContent value="barriers">
          <BarrierAssessment />
        </TabsContent>
        <TabsContent value="strategies">
          <ReengagementStrategies />
        </TabsContent>
        <TabsContent value="cases">
          <CaseTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
