import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users, MapPin, AlertTriangle, Target, TrendingUp, ChevronRight,
  UserCheck, Clock, CheckCircle2, ArrowRight, BarChart3,
  Home, Briefcase, Heart, Shield, Scale, GraduationCap,
  Search, Eye, UserPlus, Phone, FileText, RefreshCw,
  Baby, Car, Brain, Pill, Sparkles, Bot, Send, Loader2,
  ClipboardList, HandHeart, Megaphone, PenLine, ExternalLink,
  Workflow, Info, Zap, Activity, BookOpen, LinkIcon, DollarSign,
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

const LIFECYCLE_STEPS = [
  {
    key: "identification",
    label: "Identification",
    icon: Search,
    description: "Locate disconnected youth ages 16-24 using Census data, school dropout records, justice referrals, and community partner outreach.",
    tools: ["Population Overview tab", "Community Partners page"],
    color: "#6366f1",
  },
  {
    key: "outreach",
    label: "Outreach",
    icon: Megaphone,
    description: "Engage identified youth through mobile teams, digital campaigns, peer navigators, and community events using trauma-informed approaches.",
    tools: ["Re-engagement Strategies tab", "AI Community Analyst"],
    color: "#8b5cf6",
  },
  {
    key: "assessment",
    label: "Assessment",
    icon: ClipboardList,
    description: "Complete comprehensive intake including barrier identification, needs assessment, strengths mapping, and goal setting.",
    tools: ["Intake Wizard", "Benefits Screener"],
    color: "#a855f7",
  },
  {
    key: "enrollment",
    label: "Enrollment",
    icon: UserCheck,
    description: "Formally enroll youth into WIOA Title I Youth program with individualized service plans and assigned case managers.",
    tools: ["Case Management", "Transition Planning"],
    color: "#22c55e",
  },
  {
    key: "services",
    label: "Services",
    icon: HandHeart,
    description: "Deliver 14 WIOA Youth Elements: tutoring, mentoring, work experience, occupational training, leadership development, and supportive services.",
    tools: ["Apprenticeship Pathways", "Benefits Screener"],
    color: "#14b8a6",
  },
  {
    key: "retention",
    label: "Retention",
    icon: Activity,
    description: "Monitor engagement, address emerging barriers, celebrate milestones, and maintain consistent contact through 30/60/90 day checkpoints.",
    tools: ["Case Tracking tab", "Retention Tracking"],
    color: "#0ea5e9",
  },
  {
    key: "followup",
    label: "Follow-Up",
    icon: RefreshCw,
    description: "12-month post-exit follow-up tracking employment, education, and credential attainment outcomes for WIOA performance reporting.",
    tools: ["Outcome Reporting", "Case Management"],
    color: "#f59e0b",
  },
];

const CROSS_PAGE_LINKS = [
  { label: "Intake Wizard", href: "/intake-wizard", icon: ClipboardList, description: "Comprehensive intake assessment for new participants" },
  { label: "Benefits Screener", href: "/benefits-screener", icon: Shield, description: "Screen for SNAP, Medicaid, housing, and other benefits eligibility" },
  { label: "Case Management", href: "/reentry-dashboard", icon: FileText, description: "Individualized reentry plans with phase-based milestones" },
  { label: "Apprenticeship Pathways", href: "/apprenticeship-tracker", icon: Briefcase, description: "Registered apprenticeship and career pathway tracking" },
  { label: "Transition Planning", href: "/transition-plans", icon: GraduationCap, description: "ITP development and post-secondary readiness" },
  { label: "Community Partners", href: "/community-partners", icon: Users, description: "Partner organization directory and referral network" },
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

function ExampleBadge() {
  return (
    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-700 dark:text-amber-400" data-testid="badge-example">
      EXAMPLE
    </Badge>
  );
}

function HolisticDashboard() {
  const totalOY = COUNTIES.reduce((sum, c) => sum + c.oyEstimate, 0);
  const pipelineConversion = Math.round((PIPELINE_STAGES[3].count / PIPELINE_STAGES[0].count) * 100);
  const completedStories = SUCCESS_STORIES.filter(s => s.status === "Completed").length;

  return (
    <div className="space-y-6" data-testid="section-holistic-dashboard">
      <Card className="p-4 bg-indigo-900/10 border-indigo-500/30 dark:bg-indigo-900/20">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Holistic OY Dashboard</h3>
            <p className="text-xs text-muted-foreground mt-1">
              At-a-glance summary of opportunity youth population, outreach pipeline, barriers, retention, and success outcomes across all 5 counties.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4" data-testid="stat-dashboard-total-oy">
          <div className="flex flex-col items-center text-center gap-1">
            <Users className="h-5 w-5 text-indigo-500" />
            <span className="text-2xl font-bold">{totalOY.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Est. OY Population</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-dashboard-contacts">
          <div className="flex flex-col items-center text-center gap-1">
            <Phone className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold">{PIPELINE_STAGES[1].count.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Active Contacts</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-dashboard-conversion">
          <div className="flex flex-col items-center text-center gap-1">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{pipelineConversion}%</span>
            <span className="text-xs text-muted-foreground">Pipeline Conversion</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-dashboard-30day">
          <div className="flex flex-col items-center text-center gap-1">
            <Clock className="h-5 w-5 text-emerald-500" />
            <span className="text-2xl font-bold">{RETENTION_DATA[0].rate}%</span>
            <span className="text-xs text-muted-foreground">30-Day Retention</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-dashboard-90day">
          <div className="flex flex-col items-center text-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-teal-500" />
            <span className="text-2xl font-bold">{RETENTION_DATA[2].rate}%</span>
            <span className="text-xs text-muted-foreground">90-Day Retention</span>
          </div>
        </Card>
        <Card className="p-4" data-testid="stat-dashboard-success">
          <div className="flex flex-col items-center text-center gap-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold">{completedStories}</span>
            <span className="text-xs text-muted-foreground">Success Stories</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-barrier-heatmap">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Barrier Prevalence Heat Map</CardTitle>
            <CardDescription>Severity and population affected by barrier type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {BARRIERS.sort((a, b) => b.severity - a.severity).map((barrier) => {
                const Icon = barrier.icon;
                return (
                  <div key={barrier.id} className="flex items-center gap-3" data-testid={`heatmap-barrier-${barrier.id}`}>
                    <Icon className="h-4 w-4 shrink-0" style={{ color: getSeverityColor(barrier.severity) }} />
                    <span className="text-sm w-36 truncate">{barrier.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${barrier.severity}%`, backgroundColor: getSeverityColor(barrier.severity) }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color: getSeverityColor(barrier.severity) }}>
                      {barrier.severity}%
                    </span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{barrier.affected.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-retention-summary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Retention Rates</CardTitle>
            <CardDescription>30 / 60 / 90 day retention after enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RETENTION_DATA.map((ret) => (
                <div key={ret.period} className="space-y-1" data-testid={`dashboard-retention-${ret.period.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="flex justify-between text-sm gap-1">
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

      <Card data-testid="card-cross-page-links">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Connected Platform Tools
          </CardTitle>
          <CardDescription>Navigate to related tools across the ecosystem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CROSS_PAGE_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Card className="p-4 hover-elevate cursor-pointer h-full" data-testid={`link-cross-page-${link.href.replace(/\//g, '')}`}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-md p-2 bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium flex items-center gap-1">
                          {link.label}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-base">Referral Sources</CardTitle>
                <CardDescription>How OY enter our pipeline</CardDescription>
              </div>
              <ExampleBadge />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded-lg" data-testid="text-referral-example-note">
              These are example referral sources. Real referral data is populated when youth are identified through outreach or partner organizations and entered via the Intake Wizard.
            </p>
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
                  <div className="flex justify-between text-sm gap-1">
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
        <ExampleBadge />
        <span className="text-xs text-muted-foreground">Example barrier data -- real data is collected through the Intake Wizard assessment.</span>
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
                <div className="flex justify-between text-xs gap-1">
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
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base">Barrier Co-Occurrence Analysis</CardTitle>
              <CardDescription>Most common barrier combinations among enrolled OY</CardDescription>
            </div>
            <ExampleBadge />
          </div>
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
      <Card className="p-4 bg-amber-900/10 border-amber-500/30 dark:bg-amber-900/20" data-testid="card-case-example-notice">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Example Case Profiles</h3>
              <ExampleBadge />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              These are example case profiles showing what real cases look like. Real cases are created through the Intake Wizard when youth are identified through outreach or referral partners. All names shown are fictional initials only.
            </p>
          </div>
        </div>
      </Card>

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
        <Link href="/intake-wizard">
          <Button variant="outline" data-testid="button-goto-intake">
            <ClipboardList className="h-4 w-4 mr-1" /> Start New Intake
          </Button>
        </Link>
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
                    <div className="flex items-center gap-1">
                      <ExampleBadge />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
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
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Youth {selected.initials}
                        <ExampleBadge />
                      </h3>
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

                <Separator />

                <div className="flex gap-2 flex-wrap">
                  <Link href="/reentry-dashboard">
                    <Button variant="outline" size="sm" data-testid="button-case-to-management">
                      <FileText className="h-4 w-4 mr-1" /> Case Management
                    </Button>
                  </Link>
                  <Link href="/transition-plans">
                    <Button variant="outline" size="sm" data-testid="button-case-to-transition">
                      <GraduationCap className="h-4 w-4 mr-1" /> Transition Plan
                    </Button>
                  </Link>
                  <Link href="/benefits-screener">
                    <Button variant="outline" size="sm" data-testid="button-case-to-benefits">
                      <Shield className="h-4 w-4 mr-1" /> Screen Benefits
                    </Button>
                  </Link>
                  <Link href="/apprenticeship-tracker">
                    <Button variant="outline" size="sm" data-testid="button-case-to-apprenticeship">
                      <Briefcase className="h-4 w-4 mr-1" /> Apprenticeship
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground" data-testid="card-select-case">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Select a case from the list to view details</p>
              <p className="text-xs mt-2">All cases shown are examples. Create real cases via the Intake Wizard.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessVisualization() {
  return (
    <div className="space-y-6" data-testid="section-process-visualization">
      <Card className="p-4 bg-violet-900/10 border-violet-500/30 dark:bg-violet-900/20">
        <div className="flex items-start gap-3">
          <Workflow className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-300">OY Engagement Lifecycle</h3>
            <p className="text-xs text-muted-foreground mt-1">
              The complete journey from identifying disconnected youth to sustained follow-up. Each step shows what happens and which platform tools support it.
            </p>
          </div>
        </div>
      </Card>

      <div className="relative">
        <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5 bg-muted z-0" />
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 relative z-10">
          {LIFECYCLE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex flex-col items-center text-center" data-testid={`lifecycle-step-${step.key}`}>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-2 border-2 bg-background"
                  style={{ borderColor: step.color }}
                >
                  <Icon className="h-6 w-6" style={{ color: step.color }} />
                </div>
                <p className="text-xs font-semibold mb-1">{step.label}</p>
                <p className="text-xs text-muted-foreground leading-tight">{step.description}</p>
                <div className="mt-2 flex flex-col gap-1">
                  {step.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card data-testid="card-process-drilldowns">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" /> Quick Actions
          </CardTitle>
          <CardDescription>Jump to the right tool for each stage of the lifecycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CROSS_PAGE_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" className="w-full justify-start" data-testid={`button-process-link-${link.href.replace(/\//g, '')}`}>
                    <Icon className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{link.label}</span>
                    <ExternalLink className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AIResponse {
  answer: string;
  engines: Array<{
    engine: string;
    model: string;
    responseTimeMs: number;
    hasResponse: boolean;
    error?: string;
  }>;
  ragContext?: string[];
  frameworks?: string[];
  consensusMethod?: string;
  totalTimeMs?: number;
}

function AIAnalystPanel() {
  const [question, setQuestion] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  const analystMutation = useMutation({
    mutationFn: async (payload: { question: string; barrierProfile?: string[]; demographics?: Record<string, string>; county?: string }) => {
      const res = await apiRequest("POST", "/api/opportunity-youth/ai-analyst", payload);
      return res.json() as Promise<AIResponse>;
    },
    onSuccess: (data) => {
      setAiResponse(data);
    },
  });

  const handleSubmit = () => {
    if (!question.trim()) return;
    const county = selectedCounty !== "all" ? COUNTIES.find(c => c.fips === selectedCounty)?.name : undefined;
    analystMutation.mutate({
      question,
      county,
    });
  };

  const handlePresetQuery = (presetQuestion: string, barrierProfile?: string[], demographics?: Record<string, string>) => {
    setQuestion(presetQuestion);
    const county = selectedCounty !== "all" ? COUNTIES.find(c => c.fips === selectedCounty)?.name : undefined;
    analystMutation.mutate({
      question: presetQuestion,
      barrierProfile,
      demographics,
      county,
    });
  };

  return (
    <div className="space-y-6" data-testid="section-ai-analyst">
      <Card className="p-4 bg-purple-900/10 border-purple-500/30 dark:bg-purple-900/20">
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">AI Community Analyst</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ask questions about opportunity youth populations, barriers, and strategies. Powered by 4-engine collaborative AI with RAG context from census data, WIOA guidelines, and evidence-based frameworks.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 hover-elevate cursor-pointer" onClick={() => handlePresetQuery(
          "Generate a comprehensive re-engagement plan for opportunity youth ages 16-24 facing housing instability, mental health challenges, and education gaps. Include timeline, resource requirements, and measurable outcomes.",
          ["housing", "mental_health", "education"],
          { ageRange: "16-24", educationLevel: "Some high school or less" }
        )} data-testid="button-generate-reengagement">
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2 bg-green-100 dark:bg-green-900/30 shrink-0">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Generate Re-engagement Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI-generated intervention strategy based on barrier profiles and demographics
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover-elevate cursor-pointer" onClick={() => handlePresetQuery(
          "Create a targeted outreach strategy for disconnected youth in our 5-county service area. Include specific messaging for different demographics, recommended channels (social media, community events, partner referrals), and engagement tactics for youth who are hardest to reach.",
          ["housing", "employment", "transportation"],
          { ageRange: "16-24" }
        )} data-testid="button-create-outreach">
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2 bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Create Outreach Strategy</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Targeted messaging and channel recommendations for youth outreach
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover-elevate cursor-pointer" onClick={() => {
          const totalOY = COUNTIES.reduce((sum, c) => sum + c.oyEstimate, 0);
          handlePresetQuery(
            `Write a grant-ready narrative section about our opportunity youth program. Key data: ${totalOY.toLocaleString()} estimated OY across 5 counties, ${PIPELINE_STAGES[3].count.toLocaleString()} currently enrolled, ${RETENTION_DATA[2].rate}% 90-day retention rate. Top barriers: mental health (82% severity), housing instability (78%), transportation (72%). Include statement of need, target population description, and evidence-based approach.`,
            BARRIERS.map(b => b.id),
            { ageRange: "16-24", region: "5-county Central Texas" }
          );
        }} data-testid="button-write-grant">
          <div className="flex items-start gap-3">
            <div className="rounded-md p-2 bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <PenLine className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Write Grant Narrative</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Synthesize population data into grant-ready language
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger className="w-[200px]" data-testid="select-ai-county">
                <SelectValue placeholder="County context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {COUNTIES.map(c => (
                  <SelectItem key={c.fips} value={c.fips}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about opportunity youth populations, barriers, strategies, or program design..."
              rows={3}
              data-testid="input-ai-question"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!question.trim() || analystMutation.isPending}
              data-testid="button-ai-submit"
            >
              {analystMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" /> Ask AI Analyst
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {analystMutation.isPending && (
        <Card className="p-6" data-testid="card-ai-loading">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <div>
              <p className="text-sm font-medium">AI engines collaborating...</p>
              <p className="text-xs text-muted-foreground">Querying multiple AI models with RAG context for comprehensive analysis</p>
            </div>
          </div>
        </Card>
      )}

      {analystMutation.isError && (
        <Card className="p-4 border-destructive/50" data-testid="card-ai-error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium">Analysis failed</p>
              <p className="text-xs text-muted-foreground">{(analystMutation.error as Error)?.message || "An error occurred while processing your request."}</p>
            </div>
          </div>
        </Card>
      )}

      {aiResponse && !analystMutation.isPending && (
        <div className="space-y-4">
          <Card className="p-6" data-testid="card-ai-response">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">AI Analysis</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-ai-answer">
              <div className="whitespace-pre-wrap text-sm">{aiResponse.answer}</div>
            </div>
          </Card>

          <Card className="p-4" data-testid="card-ai-metadata">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4" /> Engine Metadata
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {aiResponse.engines.map((engine, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1" data-testid={`card-engine-${engine.engine}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{engine.engine}</span>
                    {engine.hasResponse ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{engine.model}</p>
                  <p className="text-xs text-muted-foreground">{engine.responseTimeMs}ms</p>
                  {engine.error && <p className="text-xs text-destructive truncate">{engine.error}</p>}
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            <div className="flex flex-wrap gap-4 text-xs">
              {aiResponse.consensusMethod && (
                <div data-testid="text-ai-consensus">
                  <span className="text-muted-foreground">Consensus: </span>
                  <span className="font-medium">{aiResponse.consensusMethod}</span>
                </div>
              )}
              {aiResponse.totalTimeMs && (
                <div data-testid="text-ai-time">
                  <span className="text-muted-foreground">Total Time: </span>
                  <span className="font-medium">{aiResponse.totalTimeMs}ms</span>
                </div>
              )}
            </div>

            {aiResponse.ragContext && aiResponse.ragContext.length > 0 && (
              <div className="mt-3" data-testid="section-rag-sources">
                <p className="text-xs font-semibold mb-1">RAG Sources</p>
                <div className="flex flex-wrap gap-1">
                  {aiResponse.ragContext.map((source, i) => (
                    <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-rag-source-${i}`}>
                      <BookOpen className="h-3 w-3 mr-1" /> {source}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {aiResponse.frameworks && aiResponse.frameworks.length > 0 && (
              <div className="mt-3" data-testid="section-frameworks">
                <p className="text-xs font-semibold mb-1">Frameworks Applied</p>
                <div className="flex flex-wrap gap-1">
                  {aiResponse.frameworks.map((fw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-framework-${i}`}>
                      {fw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

const REGION_PRESETS = [
  { label: "Central Texas", state: "48", counties: "453,491,209,021,055" },
  { label: "Houston", state: "48", counties: "201,157,039,071" },
  { label: "Dallas-Fort Worth", state: "48", counties: "113,439,085,397" },
  { label: "San Antonio", state: "48", counties: "029,091,259,187" },
  { label: "Rio Grande Valley", state: "48", counties: "215,061,427,489" },
];

const RISK_FACTOR_NOTES: Record<string, string> = {
  "High Poverty": "Youth in high-poverty tracts are 3x more likely to disconnect from school and work",
  "Low Educational Attainment": "Parents without HS diplomas often lack knowledge of postsecondary pathways",
  "Transportation Barrier": "Without transit access, youth cannot reach job training or education sites",
  "Language Barrier": "Limited English creates barriers to program enrollment and documentation",
  "High Single-Parent Rate": "Single-parent households face higher caregiving demands that pull youth from education",
  "High Unemployment": "Youth model adult labor market participation \u2014 high unemployment normalizes disconnection",
  "High Uninsured Rate": "Lack of health coverage prevents access to mental health and substance use treatment",
  "Vulnerable Housing": "Mobile or substandard housing correlates with frequent school changes and instability",
  "Overcrowded Housing": "Overcrowded conditions reduce study space and increase stress on youth",
  "High Disability Rate": "Communities with high disability need targeted accommodations in program design",
};

const PROTECTIVE_FACTOR_NOTES: Record<string, string> = {
  "High Educational Attainment": "These communities can serve as mentorship pipelines for adjacent high-risk areas",
  "Near-Full Employment": "Employer partnerships in these areas can create apprenticeship on-ramps",
  "Transportation Access": "Transit-connected tracts are ideal locations for program sites",
  "High Insurance Coverage": "Health access enables wraparound support service delivery",
  "Low Poverty": "Economically stable neighborhoods provide natural bridging opportunities for nearby high-need areas",
};

function getSviColor(svi: number): string {
  if (svi >= 0.75) return "#ef4444";
  if (svi >= 0.5) return "#f97316";
  if (svi >= 0.25) return "#eab308";
  return "#22c55e";
}

function NeighborhoodIntel({ onDesignOutreach }: { onDesignOutreach: (context: string) => void }) {
  const [selectedRegion, setSelectedRegion] = useState(REGION_PRESETS[0]);
  const [expandedTract, setExpandedTract] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/benefits/svi-analysis", selectedRegion.state, selectedRegion.counties],
    queryFn: async () => {
      const res = await fetch(`/api/benefits/svi-analysis?state=${selectedRegion.state}&counties=${selectedRegion.counties}`);
      if (!res.ok) throw new Error("Failed to fetch SVI data");
      return res.json();
    },
  });

  const result = data as any;
  const sviSummary = result?.sviSummary;
  const themes = result?.themes;
  const riskFactors = result?.riskFactorPrevalence || {};
  const protectiveFactors = result?.protectiveFactorPrevalence || {};
  const adjacentResources = result?.adjacentResources || [];

  const allVulnerableTracts = useMemo(() => {
    if (!result?.counties) return [];
    const tracts: any[] = [];
    for (const county of Object.values(result.counties) as any[]) {
      if (county.topVulnerableTracts) {
        tracts.push(...county.topVulnerableTracts);
      }
    }
    return tracts.sort((a: any, b: any) => b.svi - a.svi).slice(0, 10);
  }, [result]);

  return (
    <div className="space-y-6" data-testid="section-neighborhood-intel">
      <Card className="p-4 bg-teal-900/10 border-teal-500/30 dark:bg-teal-900/20">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-300">Neighborhood Intel</h3>
            <p className="text-xs text-muted-foreground mt-1">
              CDC Social Vulnerability Index data at the census tract level. This tab shows where vulnerability concentrates and where protective factors exist \u2014 so outreach teams know exactly which neighborhoods need what.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap" data-testid="region-selector">
        {REGION_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={selectedRegion.label === preset.label ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRegion(preset)}
            data-testid={`button-region-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <Card className="p-8" data-testid="card-svi-loading">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="text-sm text-muted-foreground">Pulling CDC SVI data for {selectedRegion.label}...</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-destructive/50" data-testid="card-svi-error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium">Failed to load SVI data</p>
              <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
            </div>
          </div>
        </Card>
      )}

      {sviSummary && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:row-span-2 p-6 flex flex-col items-center justify-center text-center" data-testid="card-community-vulnerability-score">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Community Vulnerability Score</p>
              <div
                className="text-5xl font-bold mb-2"
                style={{ color: getSviColor(sviSummary.averageSVI) }}
                data-testid="text-avg-svi"
              >
                {Math.round(sviSummary.averageSVI * 100)}
              </div>
              <p className="text-xs text-muted-foreground">out of 100 (higher = more vulnerable)</p>
              <div className="w-full mt-4 h-3 rounded-full overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(sviSummary.averageSVI * 100)}%`,
                    background: `linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)`,
                  }}
                />
              </div>
              <div className="flex justify-between w-full text-xs text-muted-foreground mt-1 gap-1">
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
            </Card>

            <Card className="p-4" data-testid="stat-total-tracts">
              <div className="flex flex-col items-center text-center gap-1">
                <MapPin className="h-5 w-5 text-teal-500" />
                <span className="text-2xl font-bold">{sviSummary.totalTracts}</span>
                <span className="text-xs text-muted-foreground">Census Tracts Analyzed</span>
              </div>
            </Card>
            <Card className="p-4" data-testid="stat-total-population">
              <div className="flex flex-col items-center text-center gap-1">
                <Users className="h-5 w-5 text-indigo-500" />
                <span className="text-2xl font-bold">{sviSummary.totalPopulation?.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">Total Population</span>
              </div>
            </Card>
            <Card className="p-4" data-testid="stat-high-vuln-tracts">
              <div className="flex flex-col items-center text-center gap-1">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">{sviSummary.highVulnerabilityTracts}</span>
                <span className="text-xs text-muted-foreground">High Vulnerability Tracts</span>
              </div>
            </Card>
            <Card className="p-4" data-testid="stat-low-vuln-tracts">
              <div className="flex flex-col items-center text-center gap-1">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{sviSummary.lowVulnerabilityTracts}</span>
                <span className="text-xs text-muted-foreground">Low Vulnerability Tracts</span>
              </div>
            </Card>
          </div>

          {themes && (
            <Card data-testid="card-theme-scores">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">SVI Theme Scores</CardTitle>
                <CardDescription>Average percentile ranking across 4 vulnerability dimensions (higher = more vulnerable)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: "socioeconomic", label: "Socioeconomic Status", icon: DollarSign, color: "#6366f1" },
                    { key: "household", label: "Household Characteristics", icon: Home, color: "#8b5cf6" },
                    { key: "minority", label: "Racial & Ethnic Minority Status", icon: Users, color: "#a855f7" },
                    { key: "housingTransport", label: "Housing Type & Transportation", icon: Car, color: "#0ea5e9" },
                  ].map((theme) => {
                    const Icon = theme.icon;
                    const val = themes[theme.key]?.average || 0;
                    const pct = Math.round(val * 100);
                    return (
                      <div key={theme.key} className="space-y-2" data-testid={`theme-score-${theme.key}`}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" style={{ color: theme.color }} />
                          <span className="text-sm font-medium truncate">{theme.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: getSviColor(val) }}
                            />
                          </div>
                          <span className="text-sm font-bold w-10 text-right" style={{ color: getSviColor(val) }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-testid="card-risk-factors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Risk Factors \u2014 Where to Focus Outreach
                </CardTitle>
                <CardDescription>Tract-level risk factors that drive youth disconnection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(riskFactors)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([factor, count]) => {
                      const pct = sviSummary.totalTracts > 0 ? Math.round(((count as number) / sviSummary.totalTracts) * 100) : 0;
                      const note = RISK_FACTOR_NOTES[factor] || "This factor correlates with higher rates of youth disconnection";
                      return (
                        <div key={factor} className="space-y-1" data-testid={`risk-factor-${factor.toLowerCase().replace(/\s+/g, '-')}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full bg-red-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-medium">{factor}</span>
                                <span className="text-xs text-muted-foreground shrink-0">{count as number} tracts ({pct}%)</span>
                              </div>
                              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden mt-1">
                                <div className="h-full rounded-full bg-red-500/70" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 italic">{note}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-protective-factors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" /> Protective Factors \u2014 Build on These Strengths
                </CardTitle>
                <CardDescription>Community assets that can anchor program design</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(protectiveFactors)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([factor, count]) => {
                      const pct = sviSummary.totalTracts > 0 ? Math.round(((count as number) / sviSummary.totalTracts) * 100) : 0;
                      const note = PROTECTIVE_FACTOR_NOTES[factor] || "This factor supports positive youth outcomes";
                      return (
                        <div key={factor} className="space-y-1" data-testid={`protective-factor-${factor.toLowerCase().replace(/\s+/g, '-')}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full bg-green-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-medium">{factor}</span>
                                <span className="text-xs text-muted-foreground shrink-0">{count as number} tracts ({pct}%)</span>
                              </div>
                              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden mt-1">
                                <div className="h-full rounded-full bg-green-500/70" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 italic">{note}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {allVulnerableTracts.length > 0 && (
            <Card data-testid="card-high-vuln-table">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" /> Top 10 Most Vulnerable Neighborhoods
                </CardTitle>
                <CardDescription>These tracts have the highest concentration of risk factors for youth disconnection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allVulnerableTracts.map((tract: any, i: number) => {
                    const isExpanded = expandedTract === tract.fips;
                    const topRisks = (tract.riskFactors || []).slice(0, 3);
                    return (
                      <div key={tract.fips} data-testid={`row-vuln-tract-${i}`}>
                        <button
                          className="w-full text-left p-3 rounded-lg bg-muted/30 hover-elevate"
                          onClick={() => setExpandedTract(isExpanded ? null : tract.fips)}
                          data-testid={`button-expand-tract-${i}`}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{tract.location?.split(",")[0] || tract.fips}</p>
                              <p className="text-xs text-muted-foreground">Pop: {(tract.population || 0).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-bold" style={{ color: getSviColor(tract.svi) }}>
                                {Math.round(tract.svi * 100)}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {topRisks.map((rf: string) => (
                                  <Badge key={rf} variant="destructive" className="text-xs">{rf}</Badge>
                                ))}
                              </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="ml-9 mt-2 p-3 rounded-lg bg-muted/20 space-y-3" data-testid={`detail-tract-${i}`}>
                            <div>
                              <p className="text-xs font-semibold mb-1">All Risk Factors</p>
                              <div className="flex flex-wrap gap-1">
                                {(tract.riskFactors || []).map((rf: string) => (
                                  <Badge key={rf} variant="destructive" className="text-xs">{rf}</Badge>
                                ))}
                                {(!tract.riskFactors || tract.riskFactors.length === 0) && (
                                  <span className="text-xs text-muted-foreground">None identified</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1">FIPS Code</p>
                              <p className="text-xs font-mono text-muted-foreground">{tract.fips}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDesignOutreach(
                                  `Design a targeted outreach strategy for census tract ${tract.location || tract.fips} (SVI score: ${Math.round(tract.svi * 100)}/100, population: ${tract.population?.toLocaleString()}). Risk factors: ${(tract.riskFactors || []).join(", ")}. This tract is in the top 10 most vulnerable neighborhoods in the ${selectedRegion.label} region. What specific interventions, staffing, and partnership strategies would be most effective for reconnecting opportunity youth in this neighborhood?`
                                );
                              }}
                              data-testid={`button-design-outreach-${i}`}
                            >
                              <Sparkles className="h-4 w-4 mr-1" /> Design Outreach Strategy
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {adjacentResources.length > 0 && (
            <Card data-testid="card-adjacent-resources">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-purple-500" /> Resources Without Borders
                </CardTitle>
                <CardDescription>How low-vulnerability neighborhoods can serve high-vulnerability neighbors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800" data-testid="text-adjacent-concept">
                  <p className="text-sm">
                    A youth in a high-poverty tract may be 2 miles from a transit-connected, high-employment community with job training programs. Geographic proximity means we can design programs that bridge these boundaries.
                  </p>
                </div>
                <div className="space-y-3">
                  {adjacentResources.slice(0, 5).map((ar: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-2" data-testid={`adjacent-resource-${i}`}>
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                            <span className="truncate">{ar.vulnerableTract?.location?.split(",")[0] || ar.vulnerableTract?.fips}</span>
                            <span className="text-xs font-bold text-red-600 shrink-0">(SVI {Math.round((ar.vulnerableTract?.svi || 0) * 100)})</span>
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {(ar.vulnerableTract?.riskFactors || []).slice(0, 3).map((rf: string) => (
                              <Badge key={rf} variant="destructive" className="text-xs">{rf}</Badge>
                            ))}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Nearby protective tracts:</p>
                          {(ar.nearbyProtectiveTracts || []).slice(0, 2).map((pt: any) => (
                            <p key={pt.fips} className="text-xs">
                              <span className="font-medium">{pt.location?.split(",")[0] || pt.fips}</span>
                              <span className="text-green-600 ml-1">(SVI {Math.round((pt.svi || 0) * 100)})</span>
                              {pt.protectiveFactors?.length > 0 && (
                                <span className="text-muted-foreground ml-1">\u2014 {pt.protectiveFactors.slice(0, 2).join(", ")}</span>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-intel-cross-links">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Continue Your Analysis
              </CardTitle>
              <CardDescription>Go deeper into the data or take action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Deep Dive into SVI Data", href: "/sdoh-explorer", icon: BarChart3 },
                  { label: "View Community Map", href: "/community-map", icon: MapPin },
                  { label: "Design Transition Plans", href: "/transition-plans", icon: GraduationCap },
                  { label: "Screen for Benefits", href: "/benefits-screener", icon: Shield },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}>
                      <Button variant="outline" className="w-full justify-start" data-testid={`link-intel-${link.href.replace(/\//g, '')}`}>
                        <Icon className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate">{link.label}</span>
                        <ExternalLink className="h-3 w-3 ml-auto shrink-0 text-muted-foreground" />
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-teal-50/30 dark:bg-teal-950/10 border-teal-200 dark:border-teal-800" data-testid="card-svi-source">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Data Source:</strong> CDC/ATSDR Social Vulnerability Index (SVI).
                Generated at {result?.generatedAt ? new Date(result.generatedAt).toLocaleString() : "just now"}.
                SVI rankings are relative \u2014 a score of 75 means more vulnerable than 75% of all U.S. census tracts.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function OpportunityYouthPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6" data-testid="page-opportunity-youth">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-oy-title">
            <Users className="h-7 w-7 text-indigo-500" />
            Opportunity Youth Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered disconnected youth outreach, engagement, and retention tracking across 5 counties
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <Activity className="h-4 w-4 mr-1" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="neighborhood-intel" data-testid="tab-neighborhood-intel">
            <MapPin className="h-4 w-4 mr-1" /> Neighborhood Intel
          </TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-1" /> Population
          </TabsTrigger>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            <ArrowRight className="h-4 w-4 mr-1" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="barriers" data-testid="tab-barriers">
            <AlertTriangle className="h-4 w-4 mr-1" /> Barriers
          </TabsTrigger>
          <TabsTrigger value="strategies" data-testid="tab-strategies">
            <Target className="h-4 w-4 mr-1" /> Re-engagement
          </TabsTrigger>
          <TabsTrigger value="cases" data-testid="tab-cases">
            <Eye className="h-4 w-4 mr-1" /> Cases
          </TabsTrigger>
          <TabsTrigger value="lifecycle" data-testid="tab-lifecycle">
            <Workflow className="h-4 w-4 mr-1" /> Lifecycle
          </TabsTrigger>
          <TabsTrigger value="ai-analyst" data-testid="tab-ai-analyst">
            <Sparkles className="h-4 w-4 mr-1" /> AI Analyst
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <HolisticDashboard />
        </TabsContent>
        <TabsContent value="neighborhood-intel">
          <NeighborhoodIntel onDesignOutreach={(context) => {
            setActiveTab("ai-analyst");
            setTimeout(() => {
              const textarea = document.querySelector('[data-testid="input-ai-question"]') as HTMLTextAreaElement;
              if (textarea) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                nativeInputValueSetter?.call(textarea, context);
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }, 100);
          }} />
        </TabsContent>
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
        <TabsContent value="lifecycle">
          <ProcessVisualization />
        </TabsContent>
        <TabsContent value="ai-analyst">
          <AIAnalystPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
