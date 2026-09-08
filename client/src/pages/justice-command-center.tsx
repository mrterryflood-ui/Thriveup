import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import SectionTutorial from "@/components/section-tutorial";
import { IntegrationInvitation } from "@/components/integration-invitation";
import { EvidenceSummary } from "@/components/evidence-label";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Shield, BarChart3, Users, MapPin, AlertTriangle, Activity, TrendingUp, TrendingDown,
  Brain, BookOpen, Scale, Building2, Heart, Target, Layers, Globe, Search,
  ChevronRight, Zap, Eye, ArrowRight, FileText, CheckCircle2, XCircle,
  Clock, AlertCircle, Lightbulb, Compass, Crosshair, Map, LayoutGrid,
  UserCheck, Church, Baby, GraduationCap, Gavel, Handshake, Home,
  Briefcase, Phone, ShieldAlert, Radio, Flame, Lock, Unlock,
  BarChart, PieChart, LineChart, ArrowUpRight, ArrowDownRight, Minus,
  Sparkles, Wand2, CircleDot, Network, Megaphone, Flag, Star,
  Siren, BookOpenCheck, ScrollText
} from "lucide-react";

type TabId = "command" | "crime-map" | "pipeline" | "sel" | "court" | "trends" | "stakeholders" | "wizard" | "programs" | "rplice" | "workforce" | "government" | "community" | "ecosystem-builder" | "generational" | "data-story";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "Washington DC" },
];

const NATIONAL_CRIME_DATA = {
  violentCrimeRate: 380.7,
  propertyCrimeRate: 1954.4,
  juvenileArrestRate: 1842.5,
  recidivismRate3Year: 67.8,
  incarcerationRate: 664,
  schoolSuspensionRateBlack: 13.7,
  schoolSuspensionRateWhite: 3.4,
  schoolSuspensionRateHispanic: 5.3,
  sentencingDisparityBlackWhite: 19.1,
  juvenileFacilityRate: 152,
  povertyRateBlack: 19.5,
  povertyRateWhite: 8.6,
  povertyRateHispanic: 17.1,
  highSchoolDropoutBlack: 5.6,
  highSchoolDropoutWhite: 4.1,
  highSchoolDropoutHispanic: 7.4,
  youthUnemploymentBlack: 17.2,
  youthUnemploymentWhite: 8.1,
};

const STATE_COMPARISON_DATA: Record<string, { violentCrime: number; recidivism: number; juvenileDetention: number; suspensionDisparity: number; povertyRate: number; programCount: number; diversionRate: number }> = {
  TX: { violentCrime: 446.5, recidivism: 46.1, juvenileDetention: 178, suspensionDisparity: 4.2, povertyRate: 14.7, programCount: 342, diversionRate: 28 },
  CA: { violentCrime: 499.5, recidivism: 50.0, juvenileDetention: 107, suspensionDisparity: 3.8, povertyRate: 12.3, programCount: 567, diversionRate: 35 },
  NY: { violentCrime: 363.8, recidivism: 43.0, juvenileDetention: 86, suspensionDisparity: 5.1, povertyRate: 13.1, programCount: 423, diversionRate: 32 },
  FL: { violentCrime: 383.6, recidivism: 33.0, juvenileDetention: 156, suspensionDisparity: 3.5, povertyRate: 12.7, programCount: 289, diversionRate: 41 },
  IL: { violentCrime: 425.9, recidivism: 39.0, juvenileDetention: 124, suspensionDisparity: 5.8, povertyRate: 11.5, programCount: 312, diversionRate: 30 },
  GA: { violentCrime: 400.1, recidivism: 30.0, juvenileDetention: 201, suspensionDisparity: 4.9, povertyRate: 14.0, programCount: 198, diversionRate: 22 },
  OH: { violentCrime: 308.8, recidivism: 31.7, juvenileDetention: 142, suspensionDisparity: 5.3, povertyRate: 13.4, programCount: 234, diversionRate: 26 },
  PA: { violentCrime: 389.4, recidivism: 44.0, juvenileDetention: 108, suspensionDisparity: 4.7, povertyRate: 12.0, programCount: 356, diversionRate: 29 },
  NC: { violentCrime: 419.3, recidivism: 37.0, juvenileDetention: 95, suspensionDisparity: 4.4, povertyRate: 14.0, programCount: 176, diversionRate: 34 },
  MI: { violentCrime: 474.8, recidivism: 31.0, juvenileDetention: 135, suspensionDisparity: 5.6, povertyRate: 14.1, programCount: 267, diversionRate: 27 },
};

const EVIDENCE_BASED_PROGRAMS = [
  { name: "Functional Family Therapy (FFT)", category: "Prevention/Intervention", targetAge: "11-18", evidenceLevel: "Strong", outcomes: "25-60% recidivism reduction", cost: "$2,500-$3,500/family", populations: "Youth with behavioral problems, delinquent youth", description: "Short-term family therapy that addresses risk and protective factors within the family system" },
  { name: "Multisystemic Therapy (MST)", category: "Intervention", targetAge: "12-17", evidenceLevel: "Strong", outcomes: "25-70% recidivism reduction", cost: "$5,000-$7,500/youth", populations: "Serious juvenile offenders", description: "Intensive family and community-based treatment addressing multiple determinants of antisocial behavior" },
  { name: "Aggression Replacement Training (ART)", category: "SEL/Intervention", targetAge: "12-21", evidenceLevel: "Promising", outcomes: "Reduced aggression, improved social skills", cost: "$800-$1,200/participant", populations: "Aggressive youth, juvenile offenders", description: "Cognitive-behavioral program teaching anger management, moral reasoning, and prosocial skills" },
  { name: "Thinking for a Change (T4C)", category: "Cognitive-Behavioral", targetAge: "18+", evidenceLevel: "Promising", outcomes: "33% recidivism reduction", cost: "$500-$800/participant", populations: "Adult offenders, reentry population", description: "Integrated cognitive behavioral change program for criminal justice populations" },
  { name: "Moral Reconation Therapy (MRT)", category: "Cognitive-Behavioral", targetAge: "16+", evidenceLevel: "Strong", outcomes: "33% recidivism reduction", cost: "$200-$500/participant", populations: "Substance-abusing offenders, general offender population", description: "Systematic step-by-step treatment strategy to raise moral reasoning" },
  { name: "CURE Violence", category: "Community Violence", targetAge: "All", evidenceLevel: "Promising", outcomes: "40-70% shooting reduction", cost: "$500K-$2M/community", populations: "High-violence neighborhoods", description: "Public health approach using credible messengers and violence interrupters" },
  { name: "Becoming a Man (BAM)", category: "Prevention/SEL", targetAge: "14-18", evidenceLevel: "Strong", outcomes: "44% violent crime reduction", cost: "$1,800/participant", populations: "At-risk young men of color", description: "CBT-based group intervention for young men in disadvantaged communities" },
  { name: "Big Brothers Big Sisters", category: "Mentoring/Prevention", targetAge: "6-18", evidenceLevel: "Strong", outcomes: "46% less likely to use drugs", cost: "$1,000-$1,500/match", populations: "At-risk youth", description: "One-to-one mentoring for youth facing adversity" },
  { name: "Restorative Justice Conferencing", category: "Diversion", targetAge: "All", evidenceLevel: "Promising", outcomes: "25% recidivism reduction", cost: "$300-$800/conference", populations: "Low-to-moderate risk offenders", description: "Brings together victims, offenders, and community members to address harm" },
  { name: "Drug Treatment Courts", category: "Court Services", targetAge: "18+", evidenceLevel: "Strong", outcomes: "8-14% recidivism reduction", cost: "$4,000-$12,000/participant", populations: "Substance-abusing offenders", description: "Specialized court dockets combining judicial supervision with treatment" },
  { name: "Nurse-Family Partnership", category: "Early Prevention", targetAge: "Prenatal-2", evidenceLevel: "Strong", outcomes: "48% reduction in child abuse, 56% fewer arrests by age 15", cost: "$9,000-$11,000/family", populations: "First-time, low-income mothers", description: "Home visiting program pairing nurses with first-time mothers" },
  { name: "Communities That Care (CTC)", category: "Community Prevention", targetAge: "All", evidenceLevel: "Strong", outcomes: "Community-wide behavior improvements", cost: "$50K-$200K/community/year", populations: "Entire communities", description: "Community-level prevention system for reducing youth problem behaviors" },
  { name: "Juvenile Drug Courts", category: "Court/Diversion", targetAge: "13-17", evidenceLevel: "Promising", outcomes: "Reduced substance use and delinquency", cost: "$5,000-$8,000/youth", populations: "Substance-involved youth", description: "Specialized court handling juvenile substance abuse cases" },
  { name: "Trauma-Focused CBT", category: "Treatment", targetAge: "3-18", evidenceLevel: "Strong", outcomes: "Reduced PTSD, behavioral problems", cost: "$3,000-$5,000/youth", populations: "Trauma-exposed youth", description: "Evidence-based treatment for youth who have experienced trauma" },
  { name: "Positive Behavioral Interventions (PBIS)", category: "School Prevention", targetAge: "K-12", evidenceLevel: "Strong", outcomes: "20-60% reduction in office referrals", cost: "$10-$30/student", populations: "All students, with targeted tiers for at-risk", description: "Multi-tiered framework for improving student behavior and school climate" },
  { name: "Ready4Work", category: "Reentry/Employment", targetAge: "18+", evidenceLevel: "Promising", outcomes: "Lower recidivism among employed participants", cost: "$3,000-$5,000/participant", populations: "Formerly incarcerated adults", description: "Faith-based mentoring and employment program for ex-prisoners" },
];

const SENTENCING_DISPARITIES = [
  { category: "Drug Offenses", blackMedian: 58.2, whiteMedian: 48.9, hispanicMedian: 50.3, disparity: "19% longer for Black defendants" },
  { category: "Violent Offenses", blackMedian: 91.3, whiteMedian: 82.7, hispanicMedian: 84.1, disparity: "10% longer for Black defendants" },
  { category: "Property Offenses", blackMedian: 24.6, whiteMedian: 21.8, hispanicMedian: 22.9, disparity: "13% longer for Black defendants" },
  { category: "Weapons Offenses", blackMedian: 63.5, whiteMedian: 49.2, hispanicMedian: 52.1, disparity: "29% longer for Black defendants" },
  { category: "Federal Mandatory Minimums", blackMedian: 72.0, whiteMedian: 56.8, hispanicMedian: 60.3, disparity: "27% longer for Black defendants" },
];

const PIPELINE_INDICATORS = [
  { indicator: "School Suspension Rate (Black students)", value: "13.7%", national: "5.1% overall", severity: "critical", trend: "worsening", insight: "Black students are 3.8x more likely to be suspended than white students" },
  { indicator: "School-Based Arrests", value: "52,300/year", national: "Disproportionately minority", severity: "critical", trend: "stable", insight: "70% of school-based arrests involve students of color" },
  { indicator: "Zero Tolerance Expulsions", value: "111,000/year", national: "Minority overrepresentation", severity: "high", trend: "improving", insight: "Many states revising zero-tolerance to reduce disproportionality" },
  { indicator: "Juvenile Court Referrals", value: "728,280/year", national: "Declining overall", severity: "moderate", trend: "improving", insight: "Black youth referred at 2x the rate of white youth" },
  { indicator: "Youth Detention Rate", value: "152/100K", national: "Declining but disparate", severity: "high", trend: "improving", insight: "Black youth detained at 4.6x rate of white youth" },
  { indicator: "Foster Care to Prison", value: "25%", national: "Incarcerated by age 25", severity: "critical", trend: "stable", insight: "Foster youth are 2x more likely to be arrested" },
  { indicator: "Special Education to Prison", value: "Overrepresented", national: "70% of youth in detention have disabilities", severity: "critical", trend: "worsening", insight: "Students with IEPs are 3x more likely to enter juvenile justice" },
  { indicator: "Truancy to Court Pipeline", value: "High correlation", national: "Truancy is #1 status offense", severity: "high", trend: "stable", insight: "Chronic absenteeism is the strongest predictor of juvenile court involvement" },
];

const PUBLIC_DATA_APIS = [
  { name: "FBI Uniform Crime Report (UCR)", category: "Crime Data", url: "https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/docApi", description: "National crime statistics, offense data, arrest data by demographics", dataPoints: "Agency-level crime data for 18,000+ law enforcement agencies" },
  { name: "Bureau of Justice Statistics (BJS)", category: "Justice Data", url: "https://bjs.ojp.gov/data", description: "Correctional populations, recidivism, victimization surveys", dataPoints: "Prison/jail populations, recidivism rates, crime victimization" },
  { name: "Vera Institute Justice Data", category: "Incarceration", url: "https://trends.vera.org", description: "Jail/prison incarceration trends by county", dataPoints: "County-level incarceration data since 1970" },
  { name: "OJJDP Easy Access", category: "Juvenile Justice", url: "https://www.ojjdp.gov/ojstatbb/", description: "Juvenile arrest, court, and detention data", dataPoints: "State-level juvenile justice processing data" },
  { name: "Census Bureau ACS", category: "Demographics", url: "https://data.census.gov", description: "Poverty, education, employment, demographics by geography", dataPoints: "Block group through national level demographic data" },
  { name: "NCES Education Data", category: "Education", url: "https://nces.ed.gov/ccd/elsi/", description: "School enrollment, discipline, achievement gaps", dataPoints: "School and district level education data" },
  { name: "CDC WONDER", category: "Health/SDOH", url: "https://wonder.cdc.gov", description: "Mortality, natality, behavioral risk factors", dataPoints: "County-level health data, ACEs prevalence" },
  { name: "HUD AFFH Data", category: "Housing", url: "https://egis.hud.gov/affht/", description: "Housing patterns, segregation indices, opportunity mapping", dataPoints: "Census tract-level housing and opportunity data" },
  { name: "BLS Employment Data", category: "Employment", url: "https://www.bls.gov/data/", description: "Employment, wages, unemployment by demographics", dataPoints: "Metro and state-level employment data" },
  { name: "DOJ Civil Rights Data", category: "Disparities", url: "https://civilrightsdata.ed.gov", description: "School discipline, restraint/seclusion, law enforcement referrals", dataPoints: "School-level civil rights data for every public school" },
  { name: "Sentencing Commission", category: "Sentencing", url: "https://www.ussc.gov/research/datafiles/commission-datafiles", description: "Federal sentencing data, demographic disparities", dataPoints: "Individual-level federal sentencing data" },
  { name: "National Neighborhood Indicators", category: "Community", url: "https://www.neighborhoodindicators.org", description: "Neighborhood-level data on multiple well-being dimensions", dataPoints: "Cross-cutting community indicator data" },
];

const DATA_LAYERS = [
  { id: "crime", label: "Crime Hotspots", color: "#ef4444", icon: ShieldAlert },
  { id: "schools", label: "School Discipline Rates", color: "#f59e0b", icon: GraduationCap },
  { id: "poverty", label: "Poverty Concentration", color: "#8b5cf6", icon: Home },
  { id: "programs", label: "Prevention Programs", color: "#10b981", icon: Heart },
  { id: "stakeholders", label: "Stakeholder Network", color: "#3b82f6", icon: Users },
  { id: "reentry", label: "Reentry Resources", color: "#06b6d4", icon: Unlock },
  { id: "health", label: "Mental Health Access", color: "#ec4899", icon: Brain },
  { id: "employment", label: "Employment Opportunity", color: "#14b8a6", icon: Briefcase },
  { id: "churches", label: "Faith Partners", color: "#a855f7", icon: Church },
  { id: "sentencing", label: "Sentencing Disparities", color: "#f97316", icon: Gavel },
];

interface CommandStats {
  totalReferrals?: number;
  juvenileCases?: number;
  courtServices?: number;
  selPrograms?: number;
  preventionPrograms?: number;
  activeStakeholders?: number;
  neighborhoodsMonitored?: number;
  activeAlerts?: number;
  reentryPlans?: number;
  cycleBreakingSessions?: number;
}

function CommandDashboard() {
  const { data: stats, isLoading } = useQuery<CommandStats>({ queryKey: ["/api/justice/command-center/stats"] });

  const statCards = [
    { label: "Active Referrals", value: stats?.totalReferrals || 0, icon: FileText, color: "text-blue-400" },
    { label: "Juvenile Cases", value: stats?.juvenileCases || 0, icon: Baby, color: "text-amber-400" },
    { label: "Court Services", value: stats?.courtServices || 0, icon: Gavel, color: "text-purple-400" },
    { label: "SEL Programs", value: stats?.selPrograms || 0, icon: Heart, color: "text-pink-400" },
    { label: "Prevention Programs", value: stats?.preventionPrograms || 0, icon: Shield, color: "text-green-400" },
    { label: "Stakeholders", value: stats?.activeStakeholders || 0, icon: Users, color: "text-cyan-400" },
    { label: "Neighborhoods Monitored", value: stats?.neighborhoodsMonitored || 0, icon: MapPin, color: "text-orange-400" },
    { label: "Active Alerts", value: stats?.activeAlerts || 0, icon: AlertTriangle, color: "text-red-400" },
    { label: "Reentry Plans", value: stats?.reentryPlans || 0, icon: Compass, color: "text-teal-400" },
    { label: "Cycle-Breaking Sessions", value: stats?.cycleBreakingSessions || 0, icon: Wand2, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-900/20 border-blue-500/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-300">How to Use the Command Center</h3>
            <p className="text-xs text-slate-300 mt-1">
              This is your at-a-glance overview. The national statistics below are sourced from DOJ, Census Bureau, and BJS — they're always live. The stat cards at the top reflect your organization's tracked data (referrals, court cases, programs). To explore live data for any city or state, switch to the <strong>Data Storyteller</strong> tab — it pulls real-time gun violence, Census demographics, and AI-powered analysis for 25+ cities. Use <strong>Crime Map & Overlays</strong> to drill down to any neighborhood in America.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <Card key={i} className="p-4 bg-slate-800/60 border-slate-700" data-testid={`stat-card-${i}`}>
            {isLoading ? <Skeleton className="h-16" /> : (
              <div className="flex flex-col items-center text-center gap-1">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-2xl font-bold text-white">{s.value}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-800/60 border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            National Crisis Indicators
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">3-Year Recidivism Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-400">{NATIONAL_CRIME_DATA.recidivismRate3Year}%</span>
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <Progress value={NATIONAL_CRIME_DATA.recidivismRate3Year} className="h-2" />

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-slate-300">Incarceration Rate (per 100K)</span>
              <span className="text-lg font-bold text-orange-400">{NATIONAL_CRIME_DATA.incarcerationRate}</span>
            </div>
            <Progress value={NATIONAL_CRIME_DATA.incarcerationRate / 10} className="h-2" />

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-slate-300">Sentencing Disparity (Black/White)</span>
              <span className="text-lg font-bold text-amber-400">{NATIONAL_CRIME_DATA.sentencingDisparityBlackWhite}% longer</span>
            </div>
            <Progress value={NATIONAL_CRIME_DATA.sentencingDisparityBlackWhite * 2} className="h-2" />

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-slate-300">Juvenile Facility Rate (per 100K youth)</span>
              <span className="text-lg font-bold text-yellow-400">{NATIONAL_CRIME_DATA.juvenileFacilityRate}</span>
            </div>
            <Progress value={NATIONAL_CRIME_DATA.juvenileFacilityRate / 3} className="h-2" />
          </div>
        </Card>

        <Card className="p-6 bg-slate-800/60 border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Racial Disparity Dashboard
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">School Suspension Rates by Race</p>
              <div className="space-y-2">
                {[
                  { label: "Black Students", value: NATIONAL_CRIME_DATA.schoolSuspensionRateBlack, color: "bg-red-500" },
                  { label: "Hispanic Students", value: NATIONAL_CRIME_DATA.schoolSuspensionRateHispanic, color: "bg-amber-500" },
                  { label: "White Students", value: NATIONAL_CRIME_DATA.schoolSuspensionRateWhite, color: "bg-blue-500" },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-32">{d.label}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className={`${d.color} h-full rounded-full transition-all`} style={{ width: `${(d.value / 15) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white w-12 text-right">{d.value}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-400 mt-1">Black students are {(NATIONAL_CRIME_DATA.schoolSuspensionRateBlack / NATIONAL_CRIME_DATA.schoolSuspensionRateWhite).toFixed(1)}x more likely to be suspended</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Poverty Rates by Race</p>
              <div className="space-y-2">
                {[
                  { label: "Black Americans", value: NATIONAL_CRIME_DATA.povertyRateBlack, color: "bg-red-500" },
                  { label: "Hispanic Americans", value: NATIONAL_CRIME_DATA.povertyRateHispanic, color: "bg-amber-500" },
                  { label: "White Americans", value: NATIONAL_CRIME_DATA.povertyRateWhite, color: "bg-blue-500" },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-32">{d.label}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className={`${d.color} h-full rounded-full transition-all`} style={{ width: `${(d.value / 25) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white w-12 text-right">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Youth Unemployment Rate</p>
              <div className="space-y-2">
                {[
                  { label: "Black Youth", value: NATIONAL_CRIME_DATA.youthUnemploymentBlack, color: "bg-red-500" },
                  { label: "White Youth", value: NATIONAL_CRIME_DATA.youthUnemploymentWhite, color: "bg-blue-500" },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-32">{d.label}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className={`${d.color} h-full rounded-full transition-all`} style={{ width: `${(d.value / 20) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white w-12 text-right">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-400" />
          Connected Public Data Sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PUBLIC_DATA_APIS.map((api, i) => (
            <div key={i} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600" data-testid={`data-api-${i}`}>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs shrink-0">{api.category}</Badge>
                <div>
                  <p className="text-sm font-medium text-white">{api.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{api.description}</p>
                  <p className="text-xs text-green-400 mt-1">{api.dataPoints}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function LocationIntelligence({ embedded = false }: { embedded?: boolean }) {
  const [locState, setLocState] = useState("TX");
  const [locCity, setLocCity] = useState("");
  const [locZip, setLocZip] = useState("");
  const [drillLevel, setDrillLevel] = useState<"state" | "county" | "neighborhood">("state");

  const locationQuery = useQuery({
    queryKey: ["/api/justice/live/location-intel", locState, locCity, locZip],
    queryFn: async () => {
      const params = new URLSearchParams({ state: locState });
      if (locCity) params.set("city", locCity);
      if (locZip) params.set("zip", locZip);
      const res = await fetch(`/api/justice/live/location-intel?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!locState,
  });

  const crimeQuery = useQuery({
    queryKey: ["/api/justice/live/crime", locState],
    queryFn: async () => {
      const res = await fetch(`/api/justice/live/crime/${locState}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!locState,
  });

  const legalGuideQuery = useQuery({
    queryKey: ["/api/justice/live/legal-guide", locState],
    queryFn: async () => {
      const res = await fetch(`/api/justice/live/legal-guide/${locState}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: false,
  });

  const resourcesQuery = useQuery({
    queryKey: ["/api/justice/live/resources", locZip],
    queryFn: async () => {
      const res = await fetch(`/api/justice/live/resources/${locZip}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!locZip && locZip.length === 5,
  });

  const intel = locationQuery.data;
  const crime = crimeQuery.data;
  const resources = resourcesQuery.data;

  const fmt = (n: number | undefined | null) => n ? n.toLocaleString() : "—";
  const fmtMoney = (n: number | undefined | null) => n && n > 0 ? `$${n.toLocaleString()}` : "—";

  return (
    <div className={`space-y-6 ${embedded ? "" : ""}`}>
      <Card className="p-6 bg-gradient-to-br from-cyan-900/30 to-slate-800/60 border-cyan-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-cyan-400" />
          Location Intelligence — Drill Down to Your Neighborhood
        </h3>
        <p className="text-sm text-slate-300 mb-4">
          Select your state, enter your city or ZIP code, and get real-time data from FBI Crime Data, U.S. Census, BLS, and community resource directories. Drill from state → county → neighborhood.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">State</label>
            <Select value={locState} onValueChange={(v) => { setLocState(v); setLocCity(""); setLocZip(""); }}>
              <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="loc-state-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">City (optional)</label>
            <Input
              placeholder="e.g. Austin, Houston"
              value={locCity}
              onChange={(e) => setLocCity(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              data-testid="loc-city-input"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">ZIP Code (optional)</label>
            <Input
              placeholder="e.g. 78660"
              value={locZip}
              onChange={(e) => setLocZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              className="bg-slate-700 border-slate-600 text-white"
              data-testid="loc-zip-input"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Drill Level</label>
            <div className="flex gap-1">
              {(["state", "county", "neighborhood"] as const).map(level => (
                <button key={level} onClick={() => setDrillLevel(level)} className={`flex-1 px-2 py-2 rounded text-xs font-medium transition-all ${drillLevel === level ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`} data-testid={`drill-${level}`}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {locationQuery.isLoading && (
        <Card className="p-6 bg-slate-800/60 border-slate-700">
          <div className="flex items-center gap-3"><Activity className="w-5 h-5 animate-spin text-cyan-400" /><span className="text-sm text-slate-300">Fetching live data from FBI, Census Bureau, BLS, and community databases...</span></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 bg-slate-700" />)}</div>
        </Card>
      )}

      {intel && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-slate-800/60 border-slate-700" data-testid="intel-location-card">
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Location Resolved</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">State:</span><span className="text-white font-medium">{intel.location?.state}</span></div>
                {intel.location?.county && <div className="flex justify-between"><span className="text-slate-400">County:</span><span className="text-white font-medium">{intel.location.county}</span></div>}
                {intel.location?.city && <div className="flex justify-between"><span className="text-slate-400">City/Place:</span><span className="text-white font-medium">{intel.location.city}</span></div>}
                {intel.location?.zip && <div className="flex justify-between"><span className="text-slate-400">ZIP:</span><span className="text-white font-medium">{intel.location.zip}</span></div>}
                {intel.location?.countyFips && <div className="flex justify-between"><span className="text-slate-400">County Code:</span><span className="text-slate-300">{intel.location.stateFips}-{intel.location.countyFips}</span></div>}
                {intel.location?.tractFips && <div className="flex justify-between"><span className="text-slate-400">Census Tract:</span><span className="text-slate-300">{intel.location.tractFips}</span></div>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-600">
                <span className="text-xs text-slate-500">Drill-down available:</span>
                <div className="flex gap-2 mt-1">
                  {intel.drillDownAvailable?.hasCounty && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">County</Badge>}
                  {intel.drillDownAvailable?.hasTract && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">Neighborhood</Badge>}
                  {intel.drillDownAvailable?.hasZip && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">ZIP Services</Badge>}
                </div>
              </div>
            </Card>

            {intel.countyDemographics && (
              <Card className="p-5 bg-slate-800/60 border-slate-700" data-testid="intel-county-demo">
                <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> County Demographics</h4>
                <p className="text-xs text-white font-medium mb-2">{intel.countyDemographics.name}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Population:</span><span className="text-white font-bold">{fmt(intel.countyDemographics.totalPopulation)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Median Income:</span><span className="text-green-400 font-bold">{fmtMoney(intel.countyDemographics.medianHouseholdIncome)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Poverty Rate:</span><span className={`font-bold ${parseFloat(intel.countyDemographics.povertyRate) > 15 ? "text-red-400" : "text-amber-400"}`}>{intel.countyDemographics.povertyRate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Unemployment:</span><span className={`font-bold ${parseFloat(intel.countyDemographics.unemploymentRate) > 6 ? "text-red-400" : "text-amber-400"}`}>{intel.countyDemographics.unemploymentRate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Median Home Value:</span><span className="text-white">{fmtMoney(intel.countyDemographics.medianHomeValue)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Median Rent:</span><span className="text-white">{fmtMoney(intel.countyDemographics.medianRent)}</span></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Source: Census ACS 5-Year 2022</p>
              </Card>
            )}

            {intel.neighborhoodDemographics && (
              <Card className="p-5 bg-slate-800/60 border-green-700/50" data-testid="intel-neighborhood-demo">
                <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2"><Home className="w-4 h-4" /> Neighborhood (Census Tract)</h4>
                <p className="text-xs text-white font-medium mb-2">{intel.neighborhoodDemographics.name}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Population:</span><span className="text-white font-bold">{fmt(intel.neighborhoodDemographics.totalPopulation)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Median Income:</span><span className="text-green-400 font-bold">{fmtMoney(intel.neighborhoodDemographics.medianHouseholdIncome)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Poverty Rate:</span><span className={`font-bold ${parseFloat(intel.neighborhoodDemographics.povertyRate) > 15 ? "text-red-400" : "text-amber-400"}`}>{intel.neighborhoodDemographics.povertyRate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Unemployment:</span><span className={`font-bold ${parseFloat(intel.neighborhoodDemographics.unemploymentRate) > 6 ? "text-red-400" : "text-amber-400"}`}>{intel.neighborhoodDemographics.unemploymentRate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Median Rent:</span><span className="text-white">{fmtMoney(intel.neighborhoodDemographics.medianRent)}</span></div>
                </div>
                <p className="text-xs text-green-500 mt-2">Tract-level = ~4,000 people (neighborhood)</p>
              </Card>
            )}

            {!intel.countyDemographics && !intel.neighborhoodDemographics && (
              <Card className="p-5 bg-slate-800/60 border-slate-700 md:col-span-2">
                <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Get Deeper Data</h4>
                <p className="text-xs text-slate-300">Enter a city name or ZIP code to unlock county and neighborhood-level demographics, local services, and community resources.</p>
              </Card>
            )}
          </div>

          {crime?.counties && crime.counties.length > 0 && (
            <Card className="p-5 bg-slate-800/60 border-slate-700" data-testid="intel-county-breakdown">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {locState} County Breakdown — {crime.totalCounties} Counties</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-center">
                  <p className="text-2xl font-bold text-white">{fmt(crime.statePopulation)}</p>
                  <p className="text-xs text-slate-400">Total State Population</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg border border-red-600/30 text-center">
                  <p className="text-2xl font-bold text-red-400">{crime.highPovertyCounties}</p>
                  <p className="text-xs text-slate-400">Counties &gt;20% Poverty Rate</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg border border-amber-600/30 text-center">
                  <p className="text-2xl font-bold text-amber-400">{crime.highUnemploymentCounties}</p>
                  <p className="text-xs text-slate-400">Counties &gt;8% Unemployment</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-2">Top {Math.min(crime.counties.length, 50)} counties by population. Colors indicate poverty risk levels.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {crime.counties.map((county: any, i: number) => {
                  const pov = parseFloat(county.povertyRate) || 0;
                  const borderColor = pov > 25 ? "border-red-500/50" : pov > 15 ? "border-amber-500/50" : "border-slate-600";
                  return (
                    <div key={i} className={`p-3 bg-slate-700/50 rounded border ${borderColor} text-xs`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white font-medium">{county.name}</p>
                        <Badge variant="outline" className="text-xs">{fmt(county.population)}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div>
                          <span className="text-slate-500">Income:</span>
                          <p className="text-green-400 font-medium">{fmtMoney(county.medianIncome)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Poverty:</span>
                          <p className={`font-medium ${pov > 20 ? "text-red-400" : pov > 12 ? "text-amber-400" : "text-green-400"}`}>{county.povertyRate}%</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Unemploy:</span>
                          <p className={`font-medium ${parseFloat(county.unemploymentRate) > 8 ? "text-red-400" : "text-amber-400"}`}>{county.unemploymentRate}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">Source: {crime.source}</p>
            </Card>
          )}

          {resources?.resources?.localSearchUrls && (
            <Card className="p-5 bg-slate-800/60 border-green-700/50" data-testid="intel-local-resources">
              <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2"><Search className="w-4 h-4" /> Local Resources for ZIP {locZip}</h4>
              <p className="text-xs text-slate-300 mb-3">Click any link to find services in your exact area. These search your ZIP code across verified service directories.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(resources.resources.localSearchUrls).map(([name, url]: [string, any]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-green-500/50 hover:bg-slate-700 transition-all" data-testid={`resource-link-${name}`}>
                    <Globe className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{name}</p>
                      <p className="text-xs text-green-400">Search ZIP {locZip} →</p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {resources?.resources?.nationalHotlines && (
            <Card className="p-5 bg-slate-800/60 border-red-700/50" data-testid="intel-hotlines">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> Crisis & Emergency Hotlines</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {resources.resources.nationalHotlines.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                    <Phone className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{h.name}</p>
                      <p className="text-sm font-bold text-red-400">{h.phone}</p>
                      <p className="text-xs text-slate-400">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {intel.localResources && !resources && (
            <Card className="p-5 bg-slate-800/60 border-green-700/50" data-testid="intel-zip-resources">
              <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2"><Search className="w-4 h-4" /> Local Services for ZIP {locZip}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(intel.localResources).map(([name, url]: [string, any]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-green-500/50 transition-all">
                    <Globe className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{name}</p>
                      <p className="text-xs text-green-400">Search →</p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {intel.legislativeTracking && (
            <Card className="p-5 bg-slate-800/60 border-blue-700/50" data-testid="intel-legislation">
              <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><Scale className="w-4 h-4" /> {locState} Legislative Tracking</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(intel.legislativeTracking).map(([name, url]: [string, any]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-blue-500/50 transition-all">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">{name.replace(/([A-Z])/g, " $1").trim()}</span>
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                  </a>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 text-xs border-indigo-500/30 text-indigo-400"
                onClick={() => legalGuideQuery.refetch()}
                disabled={legalGuideQuery.isFetching}
                data-testid="btn-legal-guide"
              >
                {legalGuideQuery.isFetching ? <><Activity className="w-3 h-3 mr-1 animate-spin" /> Generating...</> : <><Scale className="w-3 h-3 mr-1" /> Generate {locState} Legal Rights Guide</>}
              </Button>
            </Card>
          )}

          {legalGuideQuery.data?.legalGuide && (
            <Card className="p-5 bg-slate-800/60 border-indigo-700/50" data-testid="intel-legal-guide">
              <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2"><Scale className="w-4 h-4" /> {locState} Legal Rights Guide</h4>
              <p className="text-xs text-amber-400 mb-3">{legalGuideQuery.data.disclaimer}</p>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-[600px] bg-slate-900 p-4 rounded-lg">
                {typeof legalGuideQuery.data.legalGuide === "string" ? legalGuideQuery.data.legalGuide : JSON.stringify(legalGuideQuery.data.legalGuide, null, 2)}
              </pre>
            </Card>
          )}

          <Card className="p-4 bg-slate-800/40 border-slate-700">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Live Data Sources:</span>
              {(intel.dataSources || []).map((src: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">{src}</Badge>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function CrimeMapOverlay() {
  const [selectedState1, setSelectedState1] = useState("TX");
  const [selectedState2, setSelectedState2] = useState("CA");
  const [activeLayers, setActiveLayers] = useState<string[]>(["crime", "schools", "poverty"]);

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const state1Fips = STATE_CODES[selectedState1];
  const state2Fips = STATE_CODES[selectedState2];

  const censusState1 = useQuery({
    queryKey: ["/api/justice/live/census", state1Fips],
    queryFn: async () => { const r = await fetch(`/api/justice/live/census/${state1Fips}`); if (!r.ok) throw new Error("Failed"); return r.json(); },
    enabled: !!state1Fips,
  });
  const censusState2 = useQuery({
    queryKey: ["/api/justice/live/census", state2Fips],
    queryFn: async () => { const r = await fetch(`/api/justice/live/census/${state2Fips}`); if (!r.ok) throw new Error("Failed"); return r.json(); },
    enabled: !!state2Fips,
  });

  const LAYER_INSIGHTS: Record<string, { title: string; stats: { label: string; value: string; color: string }[]; source: string }> = {
    crime: { title: "Crime & Violence Data", stats: [
      { label: "National Violent Crime Rate", value: `${NATIONAL_CRIME_DATA.violentCrimeRate}/100K`, color: "text-red-400" },
      { label: "Property Crime Rate", value: `${NATIONAL_CRIME_DATA.propertyCrimeRate}/100K`, color: "text-amber-400" },
      { label: "Incarceration Rate", value: `${NATIONAL_CRIME_DATA.incarcerationRate}/100K`, color: "text-red-400" },
    ], source: "FBI UCR, BJS" },
    schools: { title: "School Discipline & Pipeline", stats: [
      { label: "Black Student Suspension Rate", value: `${NATIONAL_CRIME_DATA.schoolSuspensionRateBlack}%`, color: "text-red-400" },
      { label: "White Student Suspension Rate", value: `${NATIONAL_CRIME_DATA.schoolSuspensionRateWhite}%`, color: "text-blue-400" },
      { label: "Black/White Disparity", value: `${(NATIONAL_CRIME_DATA.schoolSuspensionRateBlack / NATIONAL_CRIME_DATA.schoolSuspensionRateWhite).toFixed(1)}x`, color: "text-red-400" },
      { label: "School-Based Arrests/Year", value: "52,300", color: "text-amber-400" },
    ], source: "CRDC, NCES" },
    poverty: { title: "Poverty & Economic Indicators", stats: [
      { label: "Black Poverty Rate", value: `${NATIONAL_CRIME_DATA.povertyRateBlack}%`, color: "text-red-400" },
      { label: "Hispanic Poverty Rate", value: `${NATIONAL_CRIME_DATA.povertyRateHispanic}%`, color: "text-amber-400" },
      { label: "White Poverty Rate", value: `${NATIONAL_CRIME_DATA.povertyRateWhite}%`, color: "text-blue-400" },
    ], source: "Census ACS" },
    programs: { title: "Prevention & Intervention Programs", stats: [
      { label: "Evidence-Based Programs Cataloged", value: `${EVIDENCE_BASED_PROGRAMS.length}`, color: "text-green-400" },
      { label: "Avg Cost per Youth", value: "$2,500-$7,500", color: "text-amber-400" },
      { label: "Avg Recidivism Reduction", value: "25-60%", color: "text-green-400" },
    ], source: "OJJDP, Blueprints" },
    stakeholders: { title: "Stakeholder & Partner Network", stats: [
      { label: "Community Org Types", value: "Faith, Education, Legal, Health, Employment", color: "text-blue-400" },
      { label: "DOJ Model Programs", value: "CURE Violence, BAM, CTC, MST", color: "text-green-400" },
    ], source: "ACOS Network" },
    reentry: { title: "Reentry & Second Chance", stats: [
      { label: "3-Year Recidivism Rate", value: `${NATIONAL_CRIME_DATA.recidivismRate3Year}%`, color: "text-red-400" },
      { label: "Pell Grant Restored", value: "2023 (up to $7,395/yr)", color: "text-green-400" },
      { label: "Ban-the-Box States", value: "37 states + 150 cities", color: "text-blue-400" },
    ], source: "BJS, DOE" },
    health: { title: "Mental Health Access", stats: [
      { label: "Incarcerated with Mental Health Condition", value: "44%", color: "text-red-400" },
      { label: "Incarcerated with Substance Use Disorder", value: "65%", color: "text-red-400" },
      { label: "Crisis Line", value: "988 (24/7)", color: "text-green-400" },
    ], source: "SAMHSA, BJS" },
    employment: { title: "Employment & Workforce", stats: [
      { label: "Black Youth Unemployment", value: `${NATIONAL_CRIME_DATA.youthUnemploymentBlack}%`, color: "text-red-400" },
      { label: "White Youth Unemployment", value: `${NATIONAL_CRIME_DATA.youthUnemploymentWhite}%`, color: "text-blue-400" },
      { label: "WOTC Tax Credit", value: "$2,400-$9,600/hire", color: "text-green-400" },
    ], source: "BLS, IRS" },
    churches: { title: "Faith-Based Partners", stats: [
      { label: "Prison Fellowship", value: "Angel Tree serves 300K+ children/yr", color: "text-purple-400" },
      { label: "Reentry Mentoring", value: "Proven 20-30% recidivism reduction", color: "text-green-400" },
    ], source: "ACOS Network" },
    sentencing: { title: "Sentencing Disparities", stats: [
      { label: "Black/White Drug Sentencing Gap", value: `${SENTENCING_DISPARITIES[0].disparity}`, color: "text-red-400" },
      { label: "Black/White Weapons Gap", value: `${SENTENCING_DISPARITIES[3].disparity}`, color: "text-red-400" },
      { label: "Federal Mandatory Min Gap", value: `${SENTENCING_DISPARITIES[4].disparity}`, color: "text-red-400" },
    ], source: "USSC" },
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-red-900/20 border-red-500/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-300">How to Use Crime Map & Overlays</h3>
            <p className="text-xs text-slate-300 mt-1">
              Start with <strong>Location Intelligence</strong> below — select any state, enter a city or ZIP code, and get live data from FBI, Census, and BLS down to the neighborhood level. Then use <strong>Data Layer Overlays</strong> to toggle on different data categories and see national statistics for each. Use <strong>State Comparison</strong> at the bottom to compare any two states using live Census data.
            </p>
          </div>
        </div>
      </Card>

      <LocationIntelligence embedded />

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-400" />
          Data Layer Overlays
        </h3>
        <p className="text-xs text-slate-400 mb-3">Toggle layers on/off to view national data for each category. Each layer shows real statistics from federal data sources.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {DATA_LAYERS.map(layer => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeLayers.includes(layer.id)
                  ? "bg-opacity-20 border-2"
                  : "bg-slate-700/50 border border-slate-600 text-slate-400"
              }`}
              style={activeLayers.includes(layer.id) ? { backgroundColor: layer.color + "20", borderColor: layer.color, color: layer.color } : {}}
              data-testid={`layer-toggle-${layer.id}`}
            >
              <layer.icon className="w-4 h-4" />
              {layer.label}
            </button>
          ))}
        </div>

        {activeLayers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {activeLayers.map(id => {
              const layer = DATA_LAYERS.find(l => l.id === id);
              const insight = LAYER_INSIGHTS[id];
              if (!layer || !insight) return null;
              return (
                <div key={id} className="p-4 rounded-lg border" style={{ backgroundColor: layer.color + "10", borderColor: layer.color + "40" }} data-testid={`layer-data-${id}`}>
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <layer.icon className="w-4 h-4" style={{ color: layer.color }} />
                    {insight.title}
                  </h4>
                  <div className="space-y-1.5">
                    {insight.stats.map((stat, si) => (
                      <div key={si} className="flex justify-between text-xs">
                        <span className="text-slate-400">{stat.label}</span>
                        <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Source: {insight.source}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-400" />
          State Comparison Tool — Live Census Data
        </h3>
        <p className="text-xs text-slate-400 mb-4">Compare any two states using live data from the U.S. Census Bureau American Community Survey. Select states below to see demographic and economic indicators side by side.</p>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-1 block">State 1</label>
            <Select value={selectedState1} onValueChange={setSelectedState1}>
              <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="select-state-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-1">
            <span className="text-slate-400 font-bold">VS</span>
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-1 block">State 2</label>
            <Select value={selectedState2} onValueChange={setSelectedState2}>
              <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="select-state-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(censusState1.isLoading || censusState2.isLoading) && (
          <div className="flex items-center gap-3 p-4">
            <Activity className="w-5 h-5 animate-spin text-purple-400" />
            <span className="text-sm text-slate-300">Loading live Census data...</span>
          </div>
        )}

        {censusState1.data?.counties && censusState2.data?.counties && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-slate-400">{US_STATES.find(s => s.code === selectedState1)?.name}</p>
                <p className="text-lg font-bold text-blue-400">{censusState1.data.counties.length} Counties</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-lg font-bold text-slate-400">VS</span>
              </div>
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-xs text-slate-400">{US_STATES.find(s => s.code === selectedState2)?.name}</p>
                <p className="text-lg font-bold text-purple-400">{censusState2.data.counties.length} Counties</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="census-comparison-table">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 px-2 text-slate-400">Top Counties</th>
                    <th className="text-right py-2 px-2 text-slate-400">Population</th>
                    <th className="text-right py-2 px-2 text-slate-400">Med. Income</th>
                    <th className="text-right py-2 px-2 text-slate-400">Poverty %</th>
                    <th className="text-right py-2 px-2 text-slate-400">Unemployment %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b-2 border-blue-500/30"><td colSpan={5} className="py-1 px-2 text-blue-400 font-bold text-xs">{US_STATES.find(s => s.code === selectedState1)?.name}</td></tr>
                  {censusState1.data.counties.slice(0, 5).map((c: any, i: number) => (
                    <tr key={`s1-${i}`} className="border-b border-slate-700/50">
                      <td className="py-1.5 px-2 text-white">{c.name}</td>
                      <td className="text-right py-1.5 px-2 text-blue-400">{parseInt(c.population).toLocaleString()}</td>
                      <td className="text-right py-1.5 px-2 text-green-400">${parseInt(c.medianIncome).toLocaleString()}</td>
                      <td className={`text-right py-1.5 px-2 font-semibold ${parseFloat(c.povertyRate) > 20 ? "text-red-400" : parseFloat(c.povertyRate) > 15 ? "text-amber-400" : "text-green-400"}`}>{c.povertyRate}%</td>
                      <td className="text-right py-1.5 px-2 text-slate-300">{c.unemploymentRate}%</td>
                    </tr>
                  ))}
                  <tr className="border-b-2 border-purple-500/30"><td colSpan={5} className="py-1 px-2 text-purple-400 font-bold text-xs">{US_STATES.find(s => s.code === selectedState2)?.name}</td></tr>
                  {censusState2.data.counties.slice(0, 5).map((c: any, i: number) => (
                    <tr key={`s2-${i}`} className="border-b border-slate-700/50">
                      <td className="py-1.5 px-2 text-white">{c.name}</td>
                      <td className="text-right py-1.5 px-2 text-blue-400">{parseInt(c.population).toLocaleString()}</td>
                      <td className="text-right py-1.5 px-2 text-green-400">${parseInt(c.medianIncome).toLocaleString()}</td>
                      <td className={`text-right py-1.5 px-2 font-semibold ${parseFloat(c.povertyRate) > 20 ? "text-red-400" : parseFloat(c.povertyRate) > 15 ? "text-amber-400" : "text-green-400"}`}>{c.povertyRate}%</td>
                      <td className="text-right py-1.5 px-2 text-slate-300">{c.unemploymentRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {STATE_COMPARISON_DATA[selectedState1] && STATE_COMPARISON_DATA[selectedState2] && (() => { const state1Data = STATE_COMPARISON_DATA[selectedState1]; const state2Data = STATE_COMPARISON_DATA[selectedState2]; return state1Data && state2Data && (
          <div className="space-y-4">
            {[
              { label: "Violent Crime Rate (per 100K)", v1: state1Data.violentCrime, v2: state2Data.violentCrime, max: 600, lowerBetter: true },
              { label: "Recidivism Rate (%)", v1: state1Data.recidivism, v2: state2Data.recidivism, max: 60, lowerBetter: true },
              { label: "Juvenile Detention Rate", v1: state1Data.juvenileDetention, v2: state2Data.juvenileDetention, max: 250, lowerBetter: true },
              { label: "Suspension Disparity (Black/White ratio)", v1: state1Data.suspensionDisparity, v2: state2Data.suspensionDisparity, max: 7, lowerBetter: true },
              { label: "Poverty Rate (%)", v1: state1Data.povertyRate, v2: state2Data.povertyRate, max: 20, lowerBetter: true },
              { label: "Evidence-Based Programs", v1: state1Data.programCount, v2: state2Data.programCount, max: 600, lowerBetter: false },
              { label: "Diversion Rate (%)", v1: state1Data.diversionRate, v2: state2Data.diversionRate, max: 50, lowerBetter: false },
            ].map((metric, i) => {
              const s1Better = metric.lowerBetter ? metric.v1 < metric.v2 : metric.v1 > metric.v2;
              const s2Better = !s1Better;
              return (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-lg font-bold ${s1Better ? "text-green-400" : "text-red-400"}`}>{metric.v1}</span>
                      {s1Better ? <ArrowDownRight className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex justify-end mt-1">
                      <div className="bg-slate-700 rounded-full h-2 w-full max-w-32 overflow-hidden">
                        <div className={`h-full rounded-full ${s1Better ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${(metric.v1 / metric.max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400 leading-tight block">{metric.label}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {s2Better ? <ArrowDownRight className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                      <span className={`text-lg font-bold ${s2Better ? "text-green-400" : "text-red-400"}`}>{metric.v2}</span>
                    </div>
                    <div className="mt-1">
                      <div className="bg-slate-700 rounded-full h-2 w-full max-w-32 overflow-hidden">
                        <div className={`h-full rounded-full ${s2Better ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${(metric.v2 / metric.max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ); })()}
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-400" />
          Federal Sentencing Disparities
        </h3>
        <div className="space-y-4">
          {SENTENCING_DISPARITIES.map((d, i) => (
            <div key={i} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600" data-testid={`sentencing-disparity-${i}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{d.category}</span>
                <Badge variant="outline" className="text-red-400 border-red-400/30">{d.disparity}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <span className="text-xs text-slate-400">Black Defendants</span>
                  <p className="text-lg font-bold text-red-400">{d.blackMedian} mo</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Hispanic Defendants</span>
                  <p className="text-lg font-bold text-amber-400">{d.hispanicMedian} mo</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">White Defendants</span>
                  <p className="text-lg font-bold text-blue-400">{d.whiteMedian} mo</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SchoolToPrisonPipeline() {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-red-900/30 to-slate-800/60 border-red-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-400" />
          School-to-Prison Pipeline: National Analysis
        </h3>
        <p className="text-sm text-slate-300 mb-6">
          The school-to-prison pipeline describes policies and practices that push students — disproportionately students of color, students with disabilities, and LGBTQ+ youth — out of schools and into the criminal justice system. This platform exists to predict, intervene, and reverse these trends.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-800/80 rounded-lg border border-red-600/30">
            <p className="text-3xl font-bold text-red-400">3.8x</p>
            <p className="text-xs text-slate-400">Black students more likely to be suspended</p>
          </div>
          <div className="text-center p-4 bg-slate-800/80 rounded-lg border border-amber-600/30">
            <p className="text-3xl font-bold text-amber-400">70%</p>
            <p className="text-xs text-slate-400">of school arrests involve students of color</p>
          </div>
          <div className="text-center p-4 bg-slate-800/80 rounded-lg border border-purple-600/30">
            <p className="text-3xl font-bold text-purple-400">4.6x</p>
            <p className="text-xs text-slate-400">Black youth detention rate vs white youth</p>
          </div>
          <div className="text-center p-4 bg-slate-800/80 rounded-lg border border-orange-600/30">
            <p className="text-3xl font-bold text-orange-400">25%</p>
            <p className="text-xs text-slate-400">of foster youth incarcerated by age 25</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {PIPELINE_INDICATORS.map((ind, i) => (
          <Card key={i} className="p-4 bg-slate-800/60 border-slate-700" data-testid={`pipeline-indicator-${i}`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${ind.severity === "critical" ? "bg-red-500/20" : ind.severity === "high" ? "bg-amber-500/20" : "bg-yellow-500/20"}`}>
                {ind.severity === "critical" ? <Flame className="w-5 h-5 text-red-400" /> : ind.severity === "high" ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <AlertCircle className="w-5 h-5 text-yellow-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white">{ind.indicator}</h4>
                  <Badge variant="outline" className={ind.severity === "critical" ? "text-red-400 border-red-400/30" : ind.severity === "high" ? "text-amber-400 border-amber-400/30" : "text-yellow-400 border-yellow-400/30"}>
                    {ind.severity}
                  </Badge>
                  <Badge variant="outline" className={ind.trend === "worsening" ? "text-red-400 border-red-400/30" : ind.trend === "improving" ? "text-green-400 border-green-400/30" : "text-slate-400 border-slate-400/30"}>
                    {ind.trend === "worsening" ? <TrendingUp className="w-3 h-3 mr-1" /> : ind.trend === "improving" ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                    {ind.trend}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-lg font-bold text-white">{ind.value}</span>
                  <span className="text-xs text-slate-400">National: {ind.national}</span>
                </div>
                <p className="text-xs text-amber-300/80 mt-1 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> {ind.insight}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          Pipeline Intervention Points
        </h3>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-amber-500 to-red-500" />
          {[
            { stage: "Early Childhood (0-5)", action: "Nurse-Family Partnership, Head Start, ACEs screening, parent education", color: "bg-green-500", textColor: "text-green-400" },
            { stage: "Elementary (6-10)", action: "PBIS Tier 1-2, SEL curriculum, mentoring, family engagement, school climate improvements", color: "bg-green-400", textColor: "text-green-400" },
            { stage: "Middle School (11-13)", action: "Targeted SEL (BAM, ART), truancy intervention, diversion programs, CBT for at-risk youth", color: "bg-amber-400", textColor: "text-amber-400" },
            { stage: "High School (14-18)", action: "FFT, MST, juvenile drug courts, workforce pathways, restorative justice, alternative education", color: "bg-orange-400", textColor: "text-orange-400" },
            { stage: "Young Adult (18-24)", action: "Reentry support, T4C/MRT, employment programs, housing assistance, faith-based mentoring", color: "bg-red-400", textColor: "text-red-400" },
            { stage: "Adult (25+)", action: "Comprehensive reentry plans, family reunification, career advancement, community restoration", color: "bg-red-500", textColor: "text-red-400" },
          ].map((stage, i) => (
            <div key={i} className="relative pl-14 pb-6">
              <div className={`absolute left-4 w-5 h-5 rounded-full ${stage.color} border-2 border-slate-800`} />
              <h4 className={`text-sm font-semibold ${stage.textColor}`}>{stage.stage}</h4>
              <p className="text-xs text-slate-300 mt-1">{stage.action}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SELDashboard() {
  const [assessmentInput, setAssessmentInput] = useState("");
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const selAssessment = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/justice/ai/sel-assessment", data);
      return res.json();
    },
    onSuccess: (data) => setAssessmentResult(data.assessment),
  });

  const caselCompetencies = [
    { name: "Self-Awareness", description: "Recognizing emotions, triggers, strengths, trauma responses", color: "bg-blue-500", icon: Eye, programs: ["Trauma-Focused CBT", "Mindfulness-Based Stress Reduction", "ART Module 1"] },
    { name: "Self-Management", description: "Impulse control, goal-setting, anger management, stress regulation", color: "bg-green-500", icon: Target, programs: ["Aggression Replacement Training", "Thinking for a Change", "Dialectical Behavior Therapy"] },
    { name: "Social Awareness", description: "Empathy, perspective-taking, cultural competency, community awareness", color: "bg-purple-500", icon: Users, programs: ["Restorative Justice Circles", "Becoming a Man (BAM)", "Cultural Identity Programs"] },
    { name: "Relationship Skills", description: "Communication, conflict resolution, help-seeking, teamwork", color: "bg-amber-500", icon: Handshake, programs: ["Functional Family Therapy", "Mentoring Programs", "Peer Mediation"] },
    { name: "Responsible Decision-Making", description: "Consequence evaluation, ethical reasoning, problem-solving", color: "bg-red-500", icon: Scale, programs: ["Moral Reconation Therapy", "Cognitive Behavioral Intervention", "Drug Court Programs"] },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-slate-800/60 border-purple-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-purple-400" />
          Social-Emotional Learning for Justice-Involved Youth
        </h3>
        <p className="text-sm text-slate-300">
          CASEL-aligned SEL framework adapted for at-risk and justice-involved populations. Implementation science ensures every program is delivered with fidelity and measured for impact.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {caselCompetencies.map((comp, i) => (
          <Card key={i} className="p-4 bg-slate-800/60 border-slate-700" data-testid={`sel-competency-${i}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${comp.color}/20`}>
                <comp.icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-white">{comp.name}</h4>
            </div>
            <p className="text-xs text-slate-400 mb-3">{comp.description}</p>
            <div>
              <p className="text-xs text-slate-500 mb-1">Evidence-Based Programs:</p>
              {comp.programs.map((p, j) => (
                <Badge key={j} variant="outline" className="text-xs mr-1 mb-1">{p}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          AI-Powered SEL Assessment
        </h3>
        <div className="space-y-4">
          <Textarea
            placeholder="Describe the youth's profile: age, background, behavioral observations, school performance, family situation, risk factors, strengths observed..."
            value={assessmentInput}
            onChange={(e) => setAssessmentInput(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
            data-testid="sel-assessment-input"
          />
          <Button
            onClick={() => selAssessment.mutate({ youthProfile: { description: assessmentInput }, assessmentType: "comprehensive" })}
            disabled={!assessmentInput.trim() || selAssessment.isPending}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="btn-run-sel-assessment"
          >
            {selAssessment.isPending ? <><Activity className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Brain className="w-4 h-4 mr-2" /> Run SEL Assessment</>}
          </Button>

          {assessmentResult && (
            <div className="p-4 bg-slate-700/50 rounded-lg border border-purple-500/30 mt-4" data-testid="sel-assessment-result">
              <h4 className="text-sm font-semibold text-purple-400 mb-2">Assessment Results</h4>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-96">
                {typeof assessmentResult === "string" ? assessmentResult : JSON.stringify(assessmentResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function CourtServicesTab() {
  const { data: courtData, isLoading } = useQuery({ queryKey: ["/api/justice/court-services"] });

  const courtTypes = [
    { type: "Drug Treatment Court", icon: Heart, description: "Combines judicial supervision with substance abuse treatment. 8-14% recidivism reduction.", color: "text-green-400", stats: { avgLength: "12-18 months", completionRate: "50-65%", costSavings: "$6,000-$12,000/participant" } },
    { type: "Mental Health Court", icon: Brain, description: "Diverts individuals with mental illness to treatment-based supervision.", color: "text-blue-400", stats: { avgLength: "12-24 months", completionRate: "45-60%", costSavings: "$4,000-$8,000/participant" } },
    { type: "Veterans Treatment Court", icon: Shield, description: "Specialized for justice-involved veterans with service-connected issues.", color: "text-amber-400", stats: { avgLength: "12-18 months", completionRate: "60-75%", costSavings: "$8,000-$15,000/participant" } },
    { type: "Juvenile/Family Court", icon: Baby, description: "Youth-focused with family involvement, diversion, restorative practices.", color: "text-purple-400", stats: { avgLength: "6-18 months", completionRate: "55-70%", costSavings: "$5,000-$10,000/youth" } },
    { type: "Reentry Court", icon: Unlock, description: "Post-release supervision with wraparound support services.", color: "text-cyan-400", stats: { avgLength: "6-12 months", completionRate: "40-55%", costSavings: "$3,000-$7,000/participant" } },
    { type: "Community Court", icon: Users, description: "Addresses quality-of-life offenses through community service and treatment.", color: "text-orange-400", stats: { avgLength: "3-6 months", completionRate: "65-80%", costSavings: "$1,000-$3,000/case" } },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-amber-900/30 to-slate-800/60 border-amber-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Gavel className="w-6 h-6 text-amber-400" />
          Court Services & Alternative Sentencing
        </h3>
        <p className="text-sm text-slate-300">
          Specialized courts and diversion programs that address root causes instead of just punishment. Each court type includes evidence-based programs, compliance monitoring, and outcome tracking with implementation fidelity built in.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courtTypes.map((court, i) => (
          <Card key={i} className="p-5 bg-slate-800/60 border-slate-700" data-testid={`court-type-${i}`}>
            <div className="flex items-center gap-3 mb-3">
              <court.icon className={`w-6 h-6 ${court.color}`} />
              <h4 className="text-sm font-semibold text-white">{court.type}</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">{court.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Avg Duration</span>
                <span className="text-xs text-white font-medium">{court.stats.avgLength}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Completion Rate</span>
                <span className="text-xs text-green-400 font-medium">{court.stats.completionRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Cost Savings vs Incarceration</span>
                <span className="text-xs text-cyan-400 font-medium">{court.stats.costSavings}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-400" />
          Active Court Services ({Array.isArray(courtData) ? courtData.length : 0})
        </h3>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
        ) : Array.isArray(courtData) && courtData.length > 0 ? (
          <div className="space-y-3">
            {courtData.map((cs: any, i: number) => (
              <div key={i} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{cs.courtName}</p>
                  <p className="text-xs text-slate-400">{cs.courtType} — {cs.serviceType}</p>
                </div>
                <Badge variant="outline" className={cs.status === "active" ? "text-green-400 border-green-400/30" : "text-slate-400"}>{cs.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No court services recorded yet. Add cases to track court-ordered services, alternative sentencing, and diversion programs.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function TrendsAndPatterns() {
  const [analysisArea, setAnalysisArea] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const trendAnalysis = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/justice/ai/analyze-trends", data);
      return res.json();
    },
    onSuccess: (data) => setAnalysisResult(data.analysis),
  });

  const { data: alerts } = useQuery({ queryKey: ["/api/justice/trend-alerts"] });

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-orange-900/20 border-orange-500/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-orange-300">How to Use Trends & Warnings</h3>
            <p className="text-xs text-slate-300 mt-1">
              Type any city, state, or "nationwide" in the box below, pick a focus area, and click <strong>Analyze Trends</strong>. The AI will analyze current crime patterns, education metrics, and social determinants for that area and provide actionable insights. The system also monitors for early warning patterns based on Dr. Flood's research principles.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-orange-900/30 to-slate-800/60 border-orange-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-400" />
          Trend Analysis & Early Warning System
        </h3>
        <p className="text-sm text-slate-300">
          AI-powered pattern recognition across crime data, education metrics, social determinants, and community indicators. Predict emerging risks before they become crises. Act, don't just study.
        </p>
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          AI Trend Analysis Engine
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Area (city, state, neighborhood, or 'nationwide')"
            value={analysisArea}
            onChange={(e) => setAnalysisArea(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            data-testid="trend-analysis-area"
          />
          <Select defaultValue="current">
            <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="trend-timeframe">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="5year">5-Year Trend</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => trendAnalysis.mutate({ area: analysisArea || "nationwide", timeframe: "current", dataType: "all" })}
            disabled={trendAnalysis.isPending}
            className="bg-orange-600 hover:bg-orange-700"
            data-testid="btn-analyze-trends"
          >
            {trendAnalysis.isPending ? <><Activity className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze Trends</>}
          </Button>
        </div>

        {analysisResult && (
          <div className="p-4 bg-slate-700/50 rounded-lg border border-orange-500/30" data-testid="trend-analysis-result">
            <h4 className="text-sm font-semibold text-orange-400 mb-2">AI Analysis Results</h4>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-[500px]">
              {typeof analysisResult === "string" ? analysisResult : JSON.stringify(analysisResult, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Active Alerts ({Array.isArray(alerts) ? alerts.filter((a: any) => a.status === "active").length : 0})
        </h3>
        {Array.isArray(alerts) && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert: any, i: number) => (
              <div key={i} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600" data-testid={`trend-alert-${i}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={alert.severity === "critical" ? "text-red-400 border-red-400/30" : alert.severity === "high" ? "text-amber-400 border-amber-400/30" : "text-yellow-400 border-yellow-400/30"}>{alert.severity}</Badge>
                  <span className="text-sm font-medium text-white">{alert.title}</span>
                </div>
                <p className="text-xs text-slate-400">{alert.description}</p>
                {alert.affectedArea && <p className="text-xs text-slate-500 mt-1">Affected area: {alert.affectedArea}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No active alerts. The system continuously monitors for emerging patterns and early warning signals.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function StakeholderNetwork() {
  const { data: stakeholders, isLoading } = useQuery({ queryKey: ["/api/justice/stakeholders"] });

  const stakeholderTypes = [
    { type: "Law Enforcement", icon: ShieldAlert, color: "bg-blue-500", role: "Community policing, pre-arrest diversion, crisis intervention teams, school resource officers (trained in de-escalation)" },
    { type: "Courts & Judges", icon: Gavel, color: "bg-amber-500", role: "Alternative sentencing, specialty courts, restorative justice orders, judicial leadership on reform" },
    { type: "Schools", icon: GraduationCap, color: "bg-green-500", role: "PBIS implementation, SEL curriculum, early identification, truancy intervention, alternative education" },
    { type: "Churches & Faith", icon: Church, color: "bg-purple-500", role: "Reentry hubs, pastoral counseling, mentoring, family support networks, community gathering spaces" },
    { type: "Fathers & Role Models", icon: UserCheck, color: "bg-cyan-500", role: "Prevention specialists, credible messengers, mentoring, positive identity development, community accountability" },
    { type: "Community Organizations", icon: Building2, color: "bg-orange-500", role: "Wraparound services, housing, employment training, substance abuse treatment, family counseling" },
    { type: "Employers", icon: Briefcase, color: "bg-teal-500", role: "Second-chance hiring, WOTC utilization, apprenticeships, fair-chance policies, ban-the-box compliance" },
    { type: "Families", icon: Home, color: "bg-pink-500", role: "Family reunification, parent education, family therapy participation, youth supervision, home stability" },
    { type: "Healthcare Providers", icon: Heart, color: "bg-red-500", role: "Mental health services, substance abuse treatment, trauma-informed care, medication management" },
    { type: "Government Agencies", icon: Building2, color: "bg-indigo-500", role: "Policy reform, funding allocation, program oversight, data sharing agreements, cross-agency coordination" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-cyan-900/30 to-slate-800/60 border-cyan-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Network className="w-6 h-6 text-cyan-400" />
          Unified Stakeholder Network
        </h3>
        <p className="text-sm text-slate-300">
          Every stakeholder connected through coordination workflows, communication channels, and shared outcome monitoring. Churches, fathers, schools, courts, law enforcement, employers — all pulling in the same direction with implementation fidelity.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stakeholderTypes.map((sh, i) => (
          <Card key={i} className="p-4 bg-slate-800/60 border-slate-700" data-testid={`stakeholder-type-${i}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${sh.color}/20`}>
                <sh.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{sh.type}</h4>
                <p className="text-xs text-slate-400 mt-1">{sh.role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Registered Stakeholders ({Array.isArray(stakeholders) ? stakeholders.length : 0})
        </h3>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
        ) : Array.isArray(stakeholders) && stakeholders.length > 0 ? (
          <div className="space-y-3">
            {stakeholders.map((s: any, i: number) => (
              <div key={i} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{s.name} {s.organizationName ? `— ${s.organizationName}` : ""}</p>
                  <p className="text-xs text-slate-400">{s.stakeholderType} · {s.role}</p>
                </div>
                <Badge variant="outline" className={s.isActive ? "text-green-400 border-green-400/30" : "text-slate-400"}>{s.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Handshake className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Register stakeholders to build your unified coordination network across all sectors.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function CycleBreakingWizard() {
  const [wizardStep, setWizardStep] = useState(1);
  const [sessionData, setSessionData] = useState<any>({});
  const [userInput, setUserInput] = useState("");
  const [wizardResponses, setWizardResponses] = useState<any[]>([]);

  const wizardMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/justice/ai/cycle-breaking-wizard", data);
      return res.json();
    },
    onSuccess: (data) => {
      setWizardResponses(prev => [...prev, data]);
      setSessionData((prev: any) => ({ ...prev, [`step${data.step}`]: data.response }));
      setUserInput("");
    },
  });

  const stepNames = [
    "Identify the Cycle", "Map Current Patterns", "Assess Root Causes",
    "Design Interventions", "Stakeholder Coordination", "Implementation Plan", "Fidelity & Monitoring"
  ];

  const handleNextStep = () => {
    wizardMutation.mutate({ step: wizardStep, sessionData, userInput });
  };

  const advanceStep = () => {
    if (wizardStep < 7) setWizardStep(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-violet-900/30 to-slate-800/60 border-violet-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-violet-400" />
          AI Cycle-Breaking Wizard
        </h3>
        <p className="text-sm text-slate-300">
          A guided, AI-powered process to identify destructive cycles, understand root causes using Three Realities, design evidence-based interventions, coordinate all stakeholders, and implement with RPLICE fidelity. Not just studying the problem — building the solution.
        </p>
      </Card>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {stepNames.map((name, i) => (
          <div key={i} className="flex items-center shrink-0">
            <button
              onClick={() => setWizardStep(i + 1)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                wizardStep === i + 1
                  ? "bg-violet-600 text-white"
                  : wizardResponses.find(r => r.step === i + 1)
                  ? "bg-green-600/20 text-green-400 border border-green-600/30"
                  : "bg-slate-700/50 text-slate-400 border border-slate-600"
              }`}
              data-testid={`wizard-step-${i + 1}`}
            >
              <span className="font-bold">{i + 1}</span>
              <span className="hidden sm:inline">{name}</span>
            </button>
            {i < 6 && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
          </div>
        ))}
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-2">
          Step {wizardStep}: {stepNames[wizardStep - 1]}
        </h3>
        <Textarea
          placeholder={
            wizardStep === 1 ? "Describe the cycle you want to break (e.g., 'generational incarceration in East Austin', 'school-to-prison pipeline for Black male students', 'recidivism among substance-abusing veterans')..."
            : wizardStep === 2 ? "Describe the current patterns you're seeing — what's happening on the ground?"
            : wizardStep === 3 ? "What root causes do you see? What institutional barriers exist?"
            : wizardStep === 4 ? "What interventions are you considering? What has been tried before?"
            : wizardStep === 5 ? "Who are the key stakeholders? What resources exist in the community?"
            : wizardStep === 6 ? "What's your timeline? What resources do you have?"
            : "How will you measure success? What fidelity checkpoints do you need?"
          }
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white min-h-[120px] mb-4"
          data-testid="wizard-input"
        />
        <div className="flex gap-3">
          <Button
            onClick={handleNextStep}
            disabled={!userInput.trim() || wizardMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="btn-wizard-analyze"
          >
            {wizardMutation.isPending ? <><Activity className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><Brain className="w-4 h-4 mr-2" /> Analyze & Recommend</>}
          </Button>
          {wizardResponses.find(r => r.step === wizardStep) && wizardStep < 7 && (
            <Button onClick={advanceStep} variant="outline" className="border-green-500 text-green-400" data-testid="btn-wizard-next">
              Next Step <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </Card>

      {wizardResponses.filter(r => r.step === wizardStep).map((resp, i) => (
        <Card key={i} className="p-6 bg-slate-800/60 border-violet-500/30" data-testid={`wizard-result-${wizardStep}`}>
          <h4 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Recommendations — {resp.stepName}
          </h4>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-[500px]">
            {typeof resp.response === "string" ? resp.response : JSON.stringify(resp.response, null, 2)}
          </pre>
        </Card>
      ))}
    </div>
  );
}

function ProgramLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [...new Set(EVIDENCE_BASED_PROGRAMS.map(p => p.category))];
  const filteredPrograms = EVIDENCE_BASED_PROGRAMS.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.populations.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-green-900/30 to-slate-800/60 border-green-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-green-400" />
          Evidence-Based Program Library
        </h3>
        <p className="text-sm text-slate-300">
          {EVIDENCE_BASED_PROGRAMS.length} research-validated programs spanning prevention, intervention, treatment, reentry, and community restoration. Every program includes evidence level, target population, cost, and expected outcomes.
        </p>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search programs by name, description, or population..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white flex-1 min-w-[200px]"
          data-testid="program-search"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-slate-700 border-slate-600 w-[200px]" data-testid="program-category-filter">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPrograms.map((program, i) => (
          <Card key={i} className="p-5 bg-slate-800/60 border-slate-700" data-testid={`program-card-${i}`}>
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">{program.name}</h4>
              <Badge variant="outline" className={
                program.evidenceLevel === "Strong" ? "text-green-400 border-green-400/30" : "text-amber-400 border-amber-400/30"
              }>{program.evidenceLevel}</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-3">{program.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Category:</span>
                <p className="text-white font-medium">{program.category}</p>
              </div>
              <div>
                <span className="text-slate-500">Target Age:</span>
                <p className="text-white font-medium">{program.targetAge}</p>
              </div>
              <div>
                <span className="text-slate-500">Outcomes:</span>
                <p className="text-green-400 font-medium">{program.outcomes}</p>
              </div>
              <div>
                <span className="text-slate-500">Cost:</span>
                <p className="text-cyan-400 font-medium">{program.cost}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Target Population:</span>
                <p className="text-white font-medium">{program.populations}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RPLICEFidelity() {
  const [programName, setProgramName] = useState("");
  const [programType, setProgramType] = useState("prevention");
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const rpliceAssess = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/justice/rplice/assess-program", data);
      return res.json();
    },
    onSuccess: (data) => setAssessmentResult(data.assessment),
  });

  const rplicePhases = [
    { phase: "Research", icon: Search, color: "text-blue-400", description: "Evidence base review, literature analysis, best practices identification" },
    { phase: "Plan", icon: FileText, color: "text-green-400", description: "Local adaptation, stakeholder engagement, resource planning, context assessment" },
    { phase: "Launch", icon: Zap, color: "text-amber-400", description: "Staff training, pilot implementation, communication rollout, site preparation" },
    { phase: "Implement", icon: Activity, color: "text-orange-400", description: "Program delivery, fidelity monitoring, participant engagement, data collection" },
    { phase: "Check", icon: CheckCircle2, color: "text-cyan-400", description: "Outcome measurement, benchmarking, early wins identification, gap analysis" },
    { phase: "Evolve", icon: TrendingUp, color: "text-purple-400", description: "Continuous improvement, scaling decisions, sustainability planning, knowledge sharing" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-slate-800/60 border-blue-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Crosshair className="w-6 h-6 text-blue-400" />
          RPLICE Implementation Fidelity Engine
        </h3>
        <p className="text-sm text-slate-300">
          Every justice program assessed through the RPLICE Decision Framework, CFIR 2.0 constructs, RE-AIM scorecard, and MAP-GAP continuous improvement. Programs that aren't delivered with fidelity don't produce outcomes — this ensures they are.
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {rplicePhases.map((phase, i) => (
          <Card key={i} className="p-4 bg-slate-800/60 border-slate-700 text-center" data-testid={`rplice-phase-${i}`}>
            <phase.icon className={`w-8 h-8 mx-auto mb-2 ${phase.color}`} />
            <h4 className="text-sm font-bold text-white mb-1">{phase.phase}</h4>
            <p className="text-xs text-slate-400">{phase.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          AI-Powered Program Fidelity Assessment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Program name..."
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            data-testid="rplice-program-name"
          />
          <Select value={programType} onValueChange={setProgramType}>
            <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="rplice-program-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prevention">Prevention Program</SelectItem>
              <SelectItem value="intervention">Intervention Program</SelectItem>
              <SelectItem value="diversion">Diversion Program</SelectItem>
              <SelectItem value="sel">SEL Program</SelectItem>
              <SelectItem value="reentry">Reentry Program</SelectItem>
              <SelectItem value="court_service">Court Service</SelectItem>
              <SelectItem value="community">Community Violence Prevention</SelectItem>
              <SelectItem value="mentoring">Mentoring/Role Model Program</SelectItem>
              <SelectItem value="faith_based">Faith-Based Program</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => rpliceAssess.mutate({ programName, programType, data: {} })}
          disabled={!programName.trim() || rpliceAssess.isPending}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="btn-rplice-assess"
        >
          {rpliceAssess.isPending ? <><Activity className="w-4 h-4 mr-2 animate-spin" /> Assessing...</> : <><Crosshair className="w-4 h-4 mr-2" /> Run RPLICE Assessment</>}
        </Button>

        {assessmentResult && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-blue-500/30" data-testid="rplice-result">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">Fidelity Assessment Results</h4>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-[500px]">
              {typeof assessmentResult === "string" ? assessmentResult : JSON.stringify(assessmentResult, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-green-400" />
          MAP-GAP Continuous Quality Improvement
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { step: "M", label: "Measure", desc: "Observe crime data, program fidelity scores, outcome metrics, stakeholder engagement", color: "bg-blue-500" },
            { step: "A", label: "Analyze", desc: "Identify patterns, disparity gaps, underperforming programs, emerging risks", color: "bg-green-500" },
            { step: "P", label: "Plan", desc: "Prioritize interventions, assign stakeholders, set benchmarks, timeline actions", color: "bg-amber-500" },
            { step: "G", label: "Gap", desc: "Document gaps between current state and desired outcomes across all dimensions", color: "bg-orange-500" },
            { step: "A", label: "Action", desc: "Deploy interventions, train staff, engage community, launch programs", color: "bg-red-500" },
            { step: "P", label: "Progress", desc: "Track results, verify fidelity, measure recidivism reduction, community improvement", color: "bg-purple-500" },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <span className={`${item.color} text-white text-xs font-bold px-2 py-1 rounded`}>{item.step}</span>
                <h4 className="text-sm font-semibold text-white">{item.label}</h4>
              </div>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const FINANCIAL_LITERACY_MODULES = [
  { module: "Banking & Credit Fundamentals", topics: ["Opening checking/savings accounts", "Understanding credit scores (FICO 300-850)", "Building credit from zero", "Secured credit cards", "Credit repair strategies", "Avoiding predatory lending", "Understanding APR and interest"], targetPopulation: "Justice-involved adults, at-risk youth 16+", duration: "4 weeks", icon: Building2, color: "text-blue-400" },
  { module: "Budgeting & Money Management", topics: ["50/30/20 rule", "Zero-based budgeting", "Tracking expenses", "Emergency fund building ($500 starter → 3-6 months)", "Avoiding payday loans", "Bill prioritization", "Free financial tools (Mint, YNAB)"], targetPopulation: "All populations", duration: "3 weeks", icon: BarChart, color: "text-green-400" },
  { module: "Employment & Income Building", topics: ["Resume building for justice-involved individuals", "Interview skills with disclosure strategies", "Negotiating wages", "Understanding W-2 vs 1099", "EITC (Earned Income Tax Credit) eligibility", "WOTC employer incentives", "Gig economy navigation", "Side income strategies"], targetPopulation: "Reentry population, unemployed youth", duration: "4 weeks", icon: Briefcase, color: "text-amber-400" },
  { module: "Housing & Asset Building", topics: ["Renting with a record", "Fair housing rights", "Section 8/HCV programs", "Homeownership pathways", "Down payment assistance programs", "Understanding leases", "Tenant rights", "IDA (Individual Development Accounts)"], targetPopulation: "Reentry population, families", duration: "4 weeks", icon: Home, color: "text-purple-400" },
  { module: "Debt Management & Legal Rights", topics: ["Understanding court fines/fees", "Payment plan negotiation", "Debt collection rights (FDCPA)", "Bankruptcy basics (Chapter 7 vs 13)", "Student loan options", "Child support management", "Restitution payment strategies", "Expungement cost planning"], targetPopulation: "Justice-involved adults", duration: "3 weeks", icon: Scale, color: "text-red-400" },
  { module: "Entrepreneurship & Self-Employment", topics: ["Business plan basics", "Microenterprise programs", "SBA resources for justice-involved", "EIN and business registration", "Accepting payments", "Bookkeeping fundamentals", "Marketing on zero budget", "Social enterprise models"], targetPopulation: "Motivated reentry individuals, community leaders", duration: "6 weeks", icon: Star, color: "text-orange-400" },
  { module: "Benefits Navigation & Government Programs", topics: ["SNAP/food assistance", "Medicaid/ACA enrollment", "SSI/SSDI for disabilities", "Veterans benefits (VA)", "Workforce Innovation grants", "Pell Grants (restored for incarcerated)", "TANF", "Childcare subsidies", "Utility assistance (LIHEAP)"], targetPopulation: "All justice-involved and at-risk populations", duration: "2 weeks", icon: FileText, color: "text-cyan-400" },
  { module: "Generational Wealth & Investment", topics: ["Compound interest explained", "401(k) and employer match", "Roth IRA basics", "Index fund investing", "Life insurance fundamentals", "Estate planning basics", "Teaching children about money", "Breaking the poverty cycle through financial education"], targetPopulation: "Stable reentry individuals, families, youth", duration: "4 weeks", icon: TrendingUp, color: "text-emerald-400" },
  { module: "Tax Literacy & Compliance", topics: ["Filing taxes with W-2 and 1099", "Free tax preparation (VITA/TCE)", "EITC and Child Tax Credit", "State tax obligations", "Self-employment taxes", "Avoiding tax scams", "IRS payment plans", "Tax implications of side income"], targetPopulation: "All adults", duration: "2 weeks", icon: FileText, color: "text-indigo-400" },
  { module: "Digital Financial Safety", topics: ["Online banking security", "Recognizing phishing/scams", "Identity theft protection", "Protecting personal information", "Safe money transfer apps", "Avoiding cryptocurrency scams", "Digital wallet basics", "Mobile payment safety"], targetPopulation: "All populations, especially seniors and youth", duration: "2 weeks", icon: Lock, color: "text-pink-400" },
];

const WORKFORCE_PATHWAYS = [
  { sector: "Healthcare", roles: ["Community Health Worker ($35K-$50K)", "Medical Assistant ($32K-$45K)", "Phlebotomist ($35K-$40K)", "EMT/Paramedic ($35K-$55K)", "Behavioral Health Technician ($30K-$42K)", "Peer Support Specialist ($32K-$45K)"], certifications: ["CPR/BLS", "CNA", "CHW", "CPSS", "EMT-B"], timeToEmploy: "3-12 months", banTheBoxFriendly: true },
  { sector: "Construction & Trades", roles: ["Electrician Apprentice ($35K-$55K)", "Plumber Apprentice ($33K-$50K)", "HVAC Technician ($38K-$55K)", "Welding ($35K-$50K)", "Carpentry ($32K-$48K)", "Solar Installation ($35K-$52K)"], certifications: ["OSHA 10/30", "EPA 608", "AWS Welding", "NCCER"], timeToEmploy: "2-6 months", banTheBoxFriendly: true },
  { sector: "Technology", roles: ["Help Desk Support ($35K-$48K)", "Data Entry/Processing ($28K-$38K)", "Web Development ($45K-$75K)", "Cybersecurity Analyst ($55K-$85K)", "IT Support Technician ($35K-$50K)"], certifications: ["CompTIA A+", "CompTIA Security+", "Google IT Certificate", "AWS Cloud Practitioner"], timeToEmploy: "3-12 months", banTheBoxFriendly: true },
  { sector: "Logistics & Transportation", roles: ["CDL Driver ($45K-$65K)", "Warehouse Operations ($30K-$42K)", "Forklift Operator ($32K-$40K)", "Supply Chain Coordinator ($38K-$52K)", "Delivery Driver ($30K-$45K)"], certifications: ["CDL-A/B", "Forklift Certification", "HAZMAT"], timeToEmploy: "1-4 months", banTheBoxFriendly: true },
  { sector: "Culinary & Food Service", roles: ["Line Cook ($28K-$38K)", "Sous Chef ($35K-$50K)", "Food Service Manager ($35K-$52K)", "Baker ($28K-$40K)", "Catering Coordinator ($32K-$45K)"], certifications: ["ServSafe", "Food Handler's Permit", "Culinary Arts Certificate"], timeToEmploy: "1-6 months", banTheBoxFriendly: true },
  { sector: "Social Services & Nonprofits", roles: ["Case Manager ($35K-$48K)", "Youth Mentor ($30K-$42K)", "Reentry Navigator ($33K-$45K)", "Community Organizer ($32K-$48K)", "Prevention Specialist ($35K-$50K)", "Credible Messenger ($35K-$50K)"], certifications: ["Peer Specialist", "Motivational Interviewing", "Trauma-Informed Care", "Community Health Worker"], timeToEmploy: "1-6 months", banTheBoxFriendly: true },
];

const GOVERNMENT_LEVELS = [
  {
    level: "Federal", icon: Building2, color: "bg-blue-600",
    bodies: [
      { name: "U.S. Congress — Senate", count: 100, role: "Federal legislation, confirmation of judges, treaties", dataSource: "congress.gov API", apiUrl: "https://api.congress.gov" },
      { name: "U.S. Congress — House", count: 435, role: "Federal legislation, spending bills, impeachment", dataSource: "congress.gov API", apiUrl: "https://api.congress.gov" },
      { name: "Executive Branch", count: 15, role: "Cabinet departments, federal agencies, executive orders", dataSource: "WhiteHouse.gov", apiUrl: "https://www.whitehouse.gov" },
      { name: "Federal Judiciary", count: 870, role: "Constitutional interpretation, federal case law, sentencing guidelines", dataSource: "PACER/CourtListener", apiUrl: "https://www.courtlistener.com/api/" },
      { name: "U.S. Sentencing Commission", count: 7, role: "Federal sentencing guidelines, disparity research, policy recommendations", dataSource: "ussc.gov", apiUrl: "https://www.ussc.gov/research/datafiles/commission-datafiles" },
    ]
  },
  {
    level: "State", icon: Flag, color: "bg-amber-600",
    bodies: [
      { name: "State Legislatures", count: 7383, role: "State criminal codes, sentencing laws, juvenile justice reform, education policy", dataSource: "OpenStates API", apiUrl: "https://v3.openstates.org" },
      { name: "Governors' Offices", count: 50, role: "Executive orders, clemency/pardons, budget priorities, emergency declarations", dataSource: "NGA", apiUrl: "https://www.nga.org" },
      { name: "State Courts", count: 50, role: "State criminal proceedings, juvenile courts, family courts, appeals", dataSource: "State court systems", apiUrl: "" },
      { name: "State Attorneys General", count: 50, role: "Criminal prosecution policy, civil rights enforcement, consumer protection", dataSource: "NAAG", apiUrl: "https://www.naag.org" },
      { name: "Departments of Corrections", count: 50, role: "Prison operations, reentry programs, parole supervision", dataSource: "State DOC websites", apiUrl: "" },
      { name: "Juvenile Justice Agencies", count: 50, role: "Youth detention, diversion programs, rehabilitation services", dataSource: "OJJDP", apiUrl: "https://www.ojjdp.gov" },
    ]
  },
  {
    level: "County", icon: MapPin, color: "bg-green-600",
    bodies: [
      { name: "County Commissions/Boards", count: 3143, role: "Local ordinances, county budgets, jail operations, public safety funding", dataSource: "NACo", apiUrl: "https://www.naco.org" },
      { name: "District/County Attorneys", count: 2400, role: "Prosecution decisions, diversion program referrals, charging policies", dataSource: "NDAA", apiUrl: "" },
      { name: "County Sheriffs", count: 3080, role: "County law enforcement, jail operations, civil process, court security", dataSource: "NSA", apiUrl: "" },
      { name: "County Courts", count: 3143, role: "Criminal cases, civil cases, juvenile proceedings, probate", dataSource: "Court records", apiUrl: "" },
      { name: "Public Defender Offices", count: 957, role: "Indigent defense, case advocacy, systemic reform litigation", dataSource: "NLADA", apiUrl: "" },
    ]
  },
  {
    level: "City/Municipal", icon: Building2, color: "bg-purple-600",
    bodies: [
      { name: "City Councils", count: 19502, role: "Local ordinances, policing policy, community investment, zoning", dataSource: "NLC", apiUrl: "https://www.nlc.org" },
      { name: "Mayors' Offices", count: 19502, role: "Executive leadership, police oversight, community programs, emergency response", dataSource: "USCM", apiUrl: "https://www.usmayors.org" },
      { name: "Police Departments", count: 18000, role: "Law enforcement, community policing, diversion, school resource officers", dataSource: "FBI UCR/NIBRS", apiUrl: "https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/docApi" },
      { name: "Municipal Courts", count: 7000, role: "Misdemeanor cases, traffic violations, code enforcement, fines/fees", dataSource: "Court records", apiUrl: "" },
      { name: "School Boards", count: 13000, role: "School discipline policy, SRO agreements, suspension/expulsion policy, SEL adoption", dataSource: "NCES", apiUrl: "https://nces.ed.gov" },
    ]
  },
];

const POLICY_IMPACT_AREAS = [
  { policy: "Ban the Box / Fair Chance Hiring", status: "37 states + 150 cities", impact: "Removes criminal history checkbox from job applications, reducing employment discrimination by 30%+", affectedPopulation: "78M+ Americans with criminal records", actionSteps: ["Check your state/city laws", "Know your rights in interviews", "File complaints for violations", "Advocate for local adoption"], category: "Employment" },
  { policy: "Pell Grant Restoration (FAFSA Simplification Act)", status: "Federal — Effective 2023", impact: "Restores federal financial aid for incarcerated students, enabling college education during incarceration", affectedPopulation: "1.2M+ incarcerated individuals", actionSteps: ["Apply through FAFSA", "Contact prison education coordinator", "Research approved programs", "Plan post-release continuation"], category: "Education" },
  { policy: "First Step Act", status: "Federal — Enacted 2018", impact: "Reduces mandatory minimums, expands good-time credits, allows compassionate release, funds reentry programs", affectedPopulation: "Federal prisoners (150K+)", actionSteps: ["Check eligibility for sentence reduction", "Apply for earned time credits", "Request compassionate release if eligible", "Access reentry programming"], category: "Sentencing Reform" },
  { policy: "Clean Slate / Automatic Expungement Laws", status: "12 states enacted", impact: "Automatically seals eligible criminal records after waiting period, improving employment and housing access", affectedPopulation: "Millions with old, minor convictions", actionSteps: ["Check your state's Clean Slate law", "Verify eligibility criteria", "Monitor automatic processing", "Advocate in non-Clean Slate states"], category: "Record Relief" },
  { policy: "Raise the Age Laws", status: "46 states — under 18 in adult system", impact: "Prevents children from being tried as adults, keeping them in juvenile rehabilitation system", affectedPopulation: "200K+ youth arrested annually", actionSteps: ["Know your state's age threshold", "Advocate for remaining 4 states", "Support juvenile rehabilitation funding", "Monitor implementation fidelity"], category: "Juvenile Justice" },
  { policy: "Medicaid Reentry Coverage (Section 1115 Waivers)", status: "19 states approved, more pending", impact: "Allows Medicaid coverage 90 days before release for behavioral health, substance abuse treatment continuity", affectedPopulation: "600K+ released annually", actionSteps: ["Check if your state has a waiver", "Apply 90 days before release", "Coordinate with reentry case manager", "Ensure continuity of prescriptions"], category: "Healthcare" },
  { policy: "Juvenile Justice Reform (JJDPA Reauthorization)", status: "Federal — Reauthorized 2018", impact: "Reduces youth incarceration, requires racial disparity data, promotes community-based alternatives", affectedPopulation: "All youth in juvenile justice system", actionSteps: ["Review state compliance plans", "Monitor racial disparity reports", "Advocate for community alternatives", "Support evidence-based programs"], category: "Juvenile Justice" },
  { policy: "Voting Rights Restoration", status: "Varies by state — 21 states auto-restore", impact: "Restores voting rights after incarceration (some after probation/parole), enabling civic participation", affectedPopulation: "4.6M disenfranchised citizens", actionSteps: ["Check your state's restoration law", "Register to vote when eligible", "Help others check eligibility", "Advocate for automatic restoration"], category: "Civic Rights" },
  { policy: "Housing: HUD Fair Chance Rule", status: "Federal — Proposed 2024", impact: "Limits criminal background screening in federally assisted housing, reducing homelessness post-release", affectedPopulation: "2.3M+ in public/assisted housing", actionSteps: ["Know your fair housing rights", "Challenge blanket bans", "Work with housing navigators", "Document discrimination"], category: "Housing" },
  { policy: "Community Violence Intervention (CVI) Funding", status: "Federal — $5B allocated", impact: "Federal funding for evidence-based violence prevention: CURE Violence, hospital-based intervention, community coalitions", affectedPopulation: "High-violence communities nationwide", actionSteps: ["Identify local CVI programs", "Apply for federal CVI grants", "Partner with credible messengers", "Implement with fidelity monitoring"], category: "Community Safety" },
];

const RESTORATIVE_JUSTICE_PRACTICES = [
  { practice: "Victim-Offender Mediation", description: "Facilitated face-to-face dialogue between victim and offender to address harm, express impact, and agree on restitution. 85% victim satisfaction rate.", process: ["Referral from court/agency", "Individual preparation meetings", "Facilitated dialogue session", "Written agreement", "Follow-up monitoring"], evidenceLevel: "Strong", settings: ["Courts", "Schools", "Community organizations", "Juvenile justice"] },
  { practice: "Community Conferencing", description: "Brings together the offender, victim(s), family members, and community stakeholders to collectively address the harm and develop a repair plan.", process: ["Community coordinator assigned", "Stakeholder outreach", "Pre-conference preparation", "Full community conference", "Action plan development", "Completion monitoring"], evidenceLevel: "Promising", settings: ["Neighborhoods", "Schools", "Police diversion", "Courts"] },
  { practice: "Circle Sentencing / Peacemaking Circles", description: "Seated circle process with talking piece, involving all affected parties including community elders. Rooted in Indigenous justice traditions.", process: ["Application and screening", "Circle keeper preparation", "Opening ceremony", "Storytelling rounds", "Consensus building", "Sentencing/healing plan", "Follow-up circles"], evidenceLevel: "Promising", settings: ["Tribal courts", "Community centers", "Schools", "Reentry programs"] },
  { practice: "Restorative Conferences in Schools", description: "Replaces suspension/expulsion with facilitated conversations about harm, accountability, and repair. Reduces suspension rates by 50%+.", process: ["Incident report", "Teacher/admin referral", "Individual preparation", "Restorative conference", "Reintegration plan", "Follow-up check-in"], evidenceLevel: "Strong", settings: ["K-12 schools", "Alternative education", "Special education"] },
  { practice: "Youth/Teen Courts", description: "Peer-led courts where trained youth serve as judges, attorneys, and jurors for real juvenile cases. Builds civic engagement.", process: ["Case referral", "Youth attorney preparation", "Peer court hearing", "Constructive sentencing", "Completion tracking", "Volunteer recruitment"], evidenceLevel: "Promising", settings: ["Schools", "Community centers", "Courthouses", "After-school programs"] },
  { practice: "Reentry Circles", description: "Community support circles for individuals returning from incarceration. Connects them with mentors, services, and accountability.", process: ["Pre-release identification", "Community volunteer recruitment", "Welcome home circle", "Monthly support circles", "Milestone celebrations", "Ongoing accountability"], evidenceLevel: "Emerging", settings: ["Faith communities", "Reentry organizations", "Community coalitions"] },
];

const COMMUNITY_RESOURCES = [
  { category: "Crisis & Emergency", resources: ["988 Suicide & Crisis Lifeline (call/text 988)", "National Domestic Violence Hotline: 1-800-799-7233", "Crisis Text Line: Text HOME to 741741", "SAMHSA Helpline: 1-800-662-4357", "Veterans Crisis Line: 988 (press 1)", "National Child Abuse Hotline: 1-800-422-4453", "National Runaway Safeline: 1-800-786-2929", "National Sexual Assault Hotline: 1-800-656-4673"], icon: Phone, color: "text-red-400" },
  { category: "Legal Aid & Rights", resources: ["Legal Aid Society (find local: lsc.gov)", "ACLU — Know Your Rights", "Innocence Project", "National Reentry Resource Center", "Clean Slate Initiative", "Expungement/record sealing clinics", "Public Defender referral", "Prison Policy Initiative"], icon: Scale, color: "text-amber-400" },
  { category: "Housing Assistance", resources: ["HUD Housing Counseling: 1-800-569-4287", "National Alliance to End Homelessness", "Reentry housing programs (local)", "Section 8/Housing Choice Vouchers", "Habitat for Humanity", "Transitional housing programs", "Oxford Houses (recovery housing)", "Fair housing complaint filing"], icon: Home, color: "text-purple-400" },
  { category: "Employment & Training", resources: ["American Job Centers (CareerOneStop.org)", "Goodwill Industries career services", "Safer Foundation", "Center for Employment Opportunities", "Dave's Killer Bread Foundation (Second Chance employers)", "HIRE Network", "Federal Bonding Program", "Workforce Innovation (WIOA) programs"], icon: Briefcase, color: "text-green-400" },
  { category: "Education & Literacy", resources: ["Adult Basic Education (ABE) programs", "GED preparation (free at ged.com)", "Pell Grant application (FAFSA)", "Prison education programs directory", "Khan Academy (free online learning)", "Coursera/edX (free courses)", "Public library programs", "ESL classes (findlocal)"], icon: GraduationCap, color: "text-blue-400" },
  { category: "Substance Abuse & Recovery", resources: ["SAMHSA Treatment Locator: findtreatment.gov", "Narcotics Anonymous: na.org", "Alcoholics Anonymous: aa.org", "SMART Recovery", "State-funded treatment programs", "Medication-Assisted Treatment (MAT) providers", "Recovery community organizations", "Sober living/Oxford Houses"], icon: Heart, color: "text-pink-400" },
  { category: "Mental Health Services", resources: ["NAMI Helpline: 1-800-950-6264", "Psychology Today therapist finder", "Community mental health centers", "Trauma-informed care providers", "Veteran-specific: VA mental health", "Telehealth/online therapy options", "Support groups (local)", "Peer support specialists"], icon: Brain, color: "text-cyan-400" },
  { category: "Family & Children", resources: ["Head Start programs", "WIC (Women, Infants, Children)", "Child care subsidies (CCDF)", "Family reunification services", "Parenting classes (evidence-based)", "Big Brothers Big Sisters", "Boys & Girls Clubs", "Family Resource Centers"], icon: Baby, color: "text-orange-400" },
  { category: "Civic Engagement", resources: ["Vote.org — Register to vote", "Can I Vote? (NASS tool)", "Ballotpedia — Know your representatives", "OpenSecrets — Campaign finance data", "Town hall meeting finder", "How to contact your elected officials", "Jury duty information", "Census participation"], icon: Flag, color: "text-indigo-400" },
  { category: "Faith & Spiritual Support", resources: ["Prison Fellowship", "Kairos Prison Ministry", "The Salvation Army", "Catholic Charities", "Jewish Family Services", "Islamic Society of North America (ISNA)", "Faith-based reentry coalitions", "Local church/mosque/temple outreach"], icon: Church, color: "text-violet-400" },
];

function WorkforceAndFinancial() {
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-emerald-900/30 to-slate-800/60 border-emerald-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-400" />
          Workforce Development, Career Pathways & Financial Literacy
        </h3>
        <p className="text-sm text-slate-300">
          Breaking the poverty-to-prison pipeline requires economic empowerment. Every career pathway, financial skill, and benefit navigation tool needed to build sustainable independence. No one stays free without income, and no one builds wealth without knowledge.
        </p>
      </Card>

      <h3 className="text-lg font-semibold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Financial Literacy — {FINANCIAL_LITERACY_MODULES.length} Complete Modules</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FINANCIAL_LITERACY_MODULES.map((mod, i) => (
          <Card key={i} className={`p-4 bg-slate-800/60 border-slate-700 cursor-pointer transition-all hover:border-slate-500 ${selectedModule === i ? "ring-2 ring-emerald-500" : ""}`} onClick={() => setSelectedModule(selectedModule === i ? null : i)} data-testid={`fin-module-${i}`}>
            <div className="flex items-center gap-3 mb-2">
              <mod.icon className={`w-5 h-5 ${mod.color}`} />
              <h4 className="text-sm font-semibold text-white">{mod.module}</h4>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">{mod.duration}</Badge>
              <Badge variant="outline" className="text-xs text-slate-400">{mod.targetPopulation}</Badge>
            </div>
            {selectedModule === i && (
              <div className="mt-3 pt-3 border-t border-slate-600 space-y-1">
                {mod.topics.map((topic, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-300">{topic}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mt-8"><Briefcase className="w-5 h-5 text-amber-400" /> Career Pathways — Ban-the-Box Friendly Sectors</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {WORKFORCE_PATHWAYS.map((path, i) => (
          <Card key={i} className={`p-5 bg-slate-800/60 border-slate-700 cursor-pointer transition-all hover:border-slate-500 ${selectedSector === i ? "ring-2 ring-amber-500" : ""}`} onClick={() => setSelectedSector(selectedSector === i ? null : i)} data-testid={`career-path-${i}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">{path.sector}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30">{path.timeToEmploy}</Badge>
                {path.banTheBoxFriendly && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">Fair Chance</Badge>}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-slate-500">Roles & Salary Ranges:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {path.roles.map((role, j) => (
                    <Badge key={j} variant="outline" className="text-xs">{role}</Badge>
                  ))}
                </div>
              </div>
              {selectedSector === i && (
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <span className="text-xs text-slate-500">Required Certifications:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {path.certifications.map((cert, j) => (
                      <Badge key={j} className="text-xs bg-amber-600/20 text-amber-300">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GovernmentAndPolicy() {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(0);
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-slate-800/60 border-blue-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" />
          Government Representation & Policy Impact
        </h3>
        <p className="text-sm text-slate-300">
          Every level of government from your city council to the U.S. Senate — who they are, what they control, how their policies affect your community, and how to make your voice heard. Democracy only works when people participate.
        </p>
      </Card>

      <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Flag className="w-5 h-5 text-blue-400" /> All Levels of Government — Federal to Local</h3>
      {GOVERNMENT_LEVELS.map((level, i) => (
        <Card key={i} className="bg-slate-800/60 border-slate-700 overflow-hidden" data-testid={`gov-level-${i}`}>
          <button onClick={() => setExpandedLevel(expandedLevel === i ? null : i)} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${level.color}/20`}>
                <level.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{level.level} Government</h4>
                <p className="text-xs text-slate-400">{level.bodies.length} governing bodies tracked</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedLevel === i ? "rotate-90" : ""}`} />
          </button>
          {expandedLevel === i && (
            <div className="px-4 pb-4 space-y-2">
              {level.bodies.map((body, j) => (
                <div key={j} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{body.name}</span>
                    <Badge variant="outline" className="text-xs">{body.count.toLocaleString()} seats</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{body.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">Data: {body.dataSource}</span>
                    {body.apiUrl && <a href={body.apiUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><Globe className="w-3 h-3" /> API</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mt-8"><Scale className="w-5 h-5 text-amber-400" /> Policies That Affect You — Know Your Rights, Take Action</h3>
      <div className="space-y-3">
        {POLICY_IMPACT_AREAS.map((policy, i) => (
          <Card key={i} className="bg-slate-800/60 border-slate-700 overflow-hidden" data-testid={`policy-${i}`}>
            <button onClick={() => setExpandedPolicy(expandedPolicy === i ? null : i)} className="w-full p-4 flex items-start justify-between text-left hover:bg-slate-700/30 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white">{policy.policy}</h4>
                  <Badge variant="outline" className="text-xs">{policy.category}</Badge>
                </div>
                <p className="text-xs text-slate-400">{policy.status}</p>
                <p className="text-xs text-green-400 mt-1">{policy.impact}</p>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ml-2 ${expandedPolicy === i ? "rotate-90" : ""}`} />
            </button>
            {expandedPolicy === i && (
              <div className="px-4 pb-4 space-y-3">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-xs text-slate-500">Affected Population:</span>
                  <p className="text-sm text-white font-medium">{policy.affectedPopulation}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-amber-400">Action Steps You Can Take:</span>
                  <div className="mt-2 space-y-1">
                    {policy.actionSteps.map((step, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CommunityMobilization() {
  const [expandedResource, setExpandedResource] = useState<number | null>(null);
  const [expandedRJ, setExpandedRJ] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-orange-900/30 to-slate-800/60 border-orange-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-orange-400" />
          Community Mobilization, Restorative Justice & Civic Action
        </h3>
        <p className="text-sm text-slate-300">
          Communities don't change from the outside — they change when people organize, mobilize, and act together. Voter registration, community watch, restorative justice, crisis resources, and every tool needed to take your neighborhood back.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Register to Vote", description: "Check registration status, register online, find polling locations, request absentee ballots", url: "https://vote.org", icon: Flag, color: "bg-blue-600" },
          { title: "Find Your Representatives", description: "Federal, state, and local elected officials — contact information, voting records, upcoming elections", url: "https://www.usa.gov/elected-officials", icon: Users, color: "bg-green-600" },
          { title: "Community Watch Toolkit", description: "Start a neighborhood watch: organize meetings, establish communication chains, partner with local police", url: "#", icon: Eye, color: "bg-amber-600" },
          { title: "Town Hall Finder", description: "Find upcoming public meetings, city council sessions, school board meetings, community forums", url: "https://townhallproject.com", icon: Building2, color: "bg-purple-600" },
        ].map((action, i) => (
          <Card key={i} className="p-4 bg-slate-800/60 border-slate-700 hover:border-slate-500 transition-all" data-testid={`civic-action-${i}`}>
            <div className={`p-3 rounded-lg ${action.color}/20 w-fit mb-3`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">{action.title}</h4>
            <p className="text-xs text-slate-400 mb-3">{action.description}</p>
            <Button size="sm" variant="outline" className="w-full text-xs" asChild>
              <a href={action.url} target="_blank" rel="noopener noreferrer">Take Action <ArrowRight className="w-3 h-3 ml-1" /></a>
            </Button>
          </Card>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Heart className="w-5 h-5 text-pink-400" /> Restorative Justice Practices</h3>
      <div className="space-y-3">
        {RESTORATIVE_JUSTICE_PRACTICES.map((rj, i) => (
          <Card key={i} className="bg-slate-800/60 border-slate-700 overflow-hidden" data-testid={`rj-practice-${i}`}>
            <button onClick={() => setExpandedRJ(expandedRJ === i ? null : i)} className="w-full p-4 flex items-start justify-between text-left hover:bg-slate-700/30 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white">{rj.practice}</h4>
                  <Badge variant="outline" className={rj.evidenceLevel === "Strong" ? "text-green-400 border-green-400/30 text-xs" : rj.evidenceLevel === "Promising" ? "text-amber-400 border-amber-400/30 text-xs" : "text-blue-400 border-blue-400/30 text-xs"}>{rj.evidenceLevel}</Badge>
                </div>
                <p className="text-xs text-slate-400">{rj.description}</p>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ml-2 ${expandedRJ === i ? "rotate-90" : ""}`} />
            </button>
            {expandedRJ === i && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-cyan-400">Process Steps:</span>
                  <div className="mt-2 space-y-1">
                    {rj.process.map((step, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 w-5">{j + 1}.</span>
                        <span className="text-xs text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Settings:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rj.settings.map((s, j) => <Badge key={j} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mt-8"><Phone className="w-5 h-5 text-red-400" /> Community Resources — Every Service You Need</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMMUNITY_RESOURCES.map((cat, i) => (
          <Card key={i} className="bg-slate-800/60 border-slate-700 overflow-hidden" data-testid={`resource-cat-${i}`}>
            <button onClick={() => setExpandedResource(expandedResource === i ? null : i)} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition-all">
              <div className="flex items-center gap-3">
                <cat.icon className={`w-5 h-5 ${cat.color}`} />
                <div>
                  <h4 className="text-sm font-semibold text-white">{cat.category}</h4>
                  <p className="text-xs text-slate-400">{cat.resources.length} resources</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedResource === i ? "rotate-90" : ""}`} />
            </button>
            {expandedResource === i && (
              <div className="px-4 pb-4 space-y-1">
                {cat.resources.map((r, j) => (
                  <div key={j} className="flex items-start gap-2 p-2 rounded bg-slate-700/30">
                    <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-300">{r}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function EcosystemBuilder() {
  const [projectInput, setProjectInput] = useState("");
  const [aiResponse, setAiResponse] = useState<any>(null);

  const buildProject = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/justice/ai/cycle-breaking-wizard", {
        step: 1,
        sessionData: { type: "ecosystem_builder", projectDescription: data.description },
        userInput: `I want to build a community safety ecosystem: ${data.description}. Help me design the complete plan including: what programs to implement, what stakeholders to engage, what data to track, what funding to pursue, how to ensure implementation fidelity, and how to measure success. Include a timeline, budget estimate, and sustainability plan.`,
      });
      return res.json();
    },
    onSuccess: (data) => setAiResponse(data.response),
  });

  const ecosystemTemplates = [
    { name: "Neighborhood Violence Prevention Coalition", description: "Community-based violence prevention for a high-crime neighborhood: credible messengers, community policing, youth programs, faith partner network, economic investment", stakeholders: "Churches, police, schools, fathers/mentors, businesses, healthcare, community orgs", funding: "CVI federal funds, DOJ BJA, state grants, philanthropy", timeline: "18 months to baseline, 3 years to measurable impact" },
    { name: "School-to-Success Pipeline (Reversing School-to-Prison)", description: "Transform school discipline from punitive to restorative, add SEL, mentoring, family engagement, mental health services, and career pathways — all with fidelity monitoring", stakeholders: "School board, teachers, parents, counselors, community mentors, employers", funding: "Title I, IDEA, state education, philanthropy, WIOA youth", timeline: "1 school year pilot, 3 years full implementation" },
    { name: "Reentry & Second Chance Ecosystem", description: "Comprehensive reentry support: pre-release planning, housing, employment, behavioral health, family reunification, faith community, financial literacy, civic re-engagement", stakeholders: "DOC, parole, employers, housing providers, churches, families, peer specialists", funding: "Second Chance Act, RSAT, state reentry, philanthropy, WOTC", timeline: "Start at 90 days pre-release, 3-year post-release support" },
    { name: "Youth Diversion & Prevention Ecosystem", description: "Divert youth from formal justice processing into community-based alternatives: restorative justice, mentoring, SEL, family therapy, workforce readiness", stakeholders: "Police, DA, courts, schools, families, mentors, community organizations, employers", funding: "OJJDP, state juvenile justice, JJDPA, philanthropy", timeline: "6 months to launch, 2 years for full impact measurement" },
    { name: "Community Economic Empowerment Hub", description: "Break the poverty-to-prison pipeline through financial literacy, entrepreneurship, workforce development, second-chance hiring, and asset building", stakeholders: "Employers, banks/CDFIs, workforce boards, SBA, mentors, educational institutions", funding: "WIOA, SBA, CDFI Fund, state economic development, philanthropy", timeline: "3 months for core programs, 2 years for wealth-building outcomes" },
    { name: "Intergenerational Healing & Restoration Project", description: "Address generational trauma through community healing circles, cultural programs, father engagement, elder mentoring, and truth-telling processes", stakeholders: "Elders, fathers, youth, faith leaders, cultural organizations, mental health providers", funding: "SAMHSA, state behavioral health, philanthropy, faith organizations", timeline: "Ongoing — quarterly community gatherings, continuous programming" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-teal-900/30 to-slate-800/60 border-teal-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Layers className="w-6 h-6 text-teal-400" />
          Community Ecosystem Builder
        </h3>
        <p className="text-sm text-slate-300">
          Design your own community safety and justice ecosystem. Pick a template or describe your vision, and the AI will help you build a complete, fundable, implementation-ready plan — with every stakeholder, program, funding source, timeline, and fidelity checkpoint mapped out.
        </p>
      </Card>

      <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-teal-400" /> Ready-Made Ecosystem Templates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ecosystemTemplates.map((tmpl, i) => (
          <Card key={i} className="p-5 bg-slate-800/60 border-slate-700 hover:border-teal-500/50 transition-all cursor-pointer" onClick={() => setProjectInput(tmpl.description)} data-testid={`ecosystem-template-${i}`}>
            <h4 className="text-sm font-semibold text-white mb-2">{tmpl.name}</h4>
            <p className="text-xs text-slate-400 mb-3">{tmpl.description}</p>
            <div className="space-y-2 text-xs">
              <div><span className="text-slate-500">Stakeholders:</span> <span className="text-slate-300">{tmpl.stakeholders}</span></div>
              <div><span className="text-slate-500">Funding:</span> <span className="text-green-400">{tmpl.funding}</span></div>
              <div><span className="text-slate-500">Timeline:</span> <span className="text-cyan-400">{tmpl.timeline}</span></div>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-3 text-xs border-teal-500/30 text-teal-400" onClick={(e) => { e.stopPropagation(); setProjectInput(tmpl.description); }}>
              Use This Template <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-teal-400" />
          Build Your Custom Ecosystem
        </h3>
        <Textarea
          placeholder="Describe your community safety project vision. What problem are you solving? What neighborhood or population? What resources do you already have? The AI will design a complete, fundable, implementation-ready ecosystem plan..."
          value={projectInput}
          onChange={(e) => setProjectInput(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white min-h-[150px] mb-4"
          data-testid="ecosystem-builder-input"
        />
        <Button
          onClick={() => buildProject.mutate({ description: projectInput })}
          disabled={!projectInput.trim() || buildProject.isPending}
          className="bg-teal-600 hover:bg-teal-700"
          data-testid="btn-build-ecosystem"
        >
          {buildProject.isPending ? <><Activity className="w-4 h-4 mr-2 animate-spin" /> Building Your Ecosystem...</> : <><Sparkles className="w-4 h-4 mr-2" /> Build Ecosystem Plan</>}
        </Button>

        {aiResponse && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-teal-500/30" data-testid="ecosystem-builder-result">
            <h4 className="text-sm font-semibold text-teal-400 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Your Ecosystem Plan</h4>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-[600px]">
              {typeof aiResponse === "string" ? aiResponse : typeof aiResponse?.guidance === "string" ? aiResponse.guidance : JSON.stringify(aiResponse, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Handshake className="w-5 h-5 text-purple-400" />
          Collaboration Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Invite Collaborators", desc: "Share your ecosystem plan with stakeholders. Each member can view, contribute ideas, and track their assigned responsibilities.", icon: Users, color: "text-blue-400" },
            { title: "Sandbox Testing", desc: "Test your ecosystem design before launch. Simulate program delivery, stakeholder coordination, and outcome tracking in a safe environment.", icon: Layers, color: "text-amber-400" },
            { title: "Fidelity Tracking", desc: "Once launched, the platform monitors implementation fidelity using RPLICE. Every program, every stakeholder, every outcome — tracked and improved.", icon: Crosshair, color: "text-green-400" },
          ].map((feature, i) => (
            <div key={i} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <feature.icon className={`w-6 h-6 ${feature.color} mb-2`} />
              <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
              <p className="text-xs text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const PRESET_CITIES = [
  { city: "Wilmington", state: "NC", label: "Wilmington, NC", context: "Creekwood neighborhood → Laney HS pipeline" },
  { city: "Austin", state: "TX", label: "Austin, TX", context: "East Austin vs North Austin disparity corridor" },
  { city: "Houston", state: "TX", label: "Houston, TX", context: "Third Ward → Yates HS pipeline" },
  { city: "Dallas", state: "TX", label: "Dallas, TX", context: "South Dallas → Lincoln HS pipeline" },
  { city: "Chicago", state: "IL", label: "Chicago, IL", context: "South Side violence corridor" },
  { city: "Philadelphia", state: "PA", label: "Philadelphia, PA", context: "North Philly corridor" },
  { city: "Baltimore", state: "MD", label: "Baltimore, MD", context: "West Baltimore pipeline" },
  { city: "Memphis", state: "TN", label: "Memphis, TN", context: "South Memphis pipeline" },
  { city: "New Orleans", state: "LA", label: "New Orleans, LA", context: "Central City to 7th Ward" },
  { city: "St. Louis", state: "MO", label: "St. Louis, MO", context: "North St. Louis corridor" },
  { city: "Detroit", state: "MI", label: "Detroit, MI", context: "East Side pipeline" },
  { city: "Atlanta", state: "GA", label: "Atlanta, GA", context: "Southwest Atlanta pipeline" },
  { city: "Jackson", state: "MS", label: "Jackson, MS", context: "South Jackson corridor" },
  { city: "Birmingham", state: "AL", label: "Birmingham, AL", context: "West End pipeline" },
  { city: "Charlotte", state: "NC", label: "Charlotte, NC", context: "West Charlotte corridor" },
  { city: "Kansas City", state: "MO", label: "Kansas City, MO", context: "East KC pipeline" },
  { city: "Milwaukee", state: "WI", label: "Milwaukee, WI", context: "North Side corridor" },
  { city: "San Antonio", state: "TX", label: "San Antonio, TX", context: "East Side pipeline" },
  { city: "Indianapolis", state: "IN", label: "Indianapolis, IN", context: "East/Near East pipeline" },
  { city: "Oakland", state: "CA", label: "Oakland, CA", context: "East Oakland corridor" },
  { city: "Buffalo", state: "NY", label: "Buffalo, NY", context: "East Side → Orchard Park/Hamburg disparity" },
  { city: "Rochester", state: "NY", label: "Rochester, NY", context: "Northeast corridor pipeline" },
  { city: "Syracuse", state: "NY", label: "Syracuse, NY", context: "South Side pipeline" },
  { city: "Fayetteville", state: "NC", label: "Fayetteville, NC", context: "Military community pipeline" },
  { city: "Raleigh", state: "NC", label: "Raleigh, NC", context: "Southeast Raleigh corridor" },
];

const STATE_CODES: Record<string, string> = {
  AL:"01",AK:"02",AZ:"04",AR:"05",CA:"06",CO:"08",CT:"09",DE:"10",FL:"12",GA:"13",
  HI:"15",ID:"16",IL:"17",IN:"18",IA:"19",KS:"20",KY:"21",LA:"22",ME:"23",MD:"24",
  MA:"25",MI:"26",MN:"27",MS:"28",MO:"29",MT:"30",NE:"31",NV:"32",NH:"33",NJ:"34",
  NM:"35",NY:"36",NC:"37",ND:"38",OH:"39",OK:"40",OR:"41",PA:"42",RI:"44",SC:"45",
  SD:"46",TN:"47",TX:"48",UT:"49",VT:"50",VA:"51",WA:"53",WV:"54",WI:"55",WY:"56",DC:"11"
};

function DataStoryteller() {
  const [selectedCities, setSelectedCities] = useState<Array<{ city: string; state: string; label: string; context: string }>>([
    PRESET_CITIES[0], PRESET_CITIES[1]
  ]);
  const [customCity, setCustomCity] = useState("");
  const [customState, setCustomState] = useState("");
  const [activeView, setActiveView] = useState<"dashboard" | "story" | "compare" | "risk" | "gentrification">("dashboard");
  const [focusCity, setFocusCity] = useState<string>("Wilmington");
  const [storyLoading, setStoryLoading] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<any>(null);
  const [storyContext, setStoryContext] = useState("");

  const citiesKey = selectedCities.map(c => `${c.city}-${c.state}`).join(",");

  const gvQuery = useQuery({
    queryKey: ["/api/justice/live/gun-violence/compare", citiesKey],
    queryFn: async () => {
      const resp = await apiRequest("POST", "/api/justice/live/gun-violence/compare", {
        cities: selectedCities.map(c => ({ city: c.city, state: c.state }))
      });
      return resp.json();
    },
    enabled: selectedCities.length > 0,
  });

  const uniqueStates = [...new Set(selectedCities.map(c => c.state))];
  const censusQuery = useQuery({
    queryKey: ["/api/justice/live/census-batch", uniqueStates.join(",")],
    queryFn: async () => {
      const results: Record<string, any> = {};
      await Promise.allSettled(
        uniqueStates.map(async (st) => {
          const fips = STATE_CODES[st];
          if (!fips) return;
          const resp = await fetch(`/api/justice/live/census/${fips}`);
          results[st] = await resp.json();
        })
      );
      return results;
    },
    enabled: uniqueStates.length > 0,
  });

  const riskQuery = useQuery({
    queryKey: ["/api/justice/live/risk-protective-factors", citiesKey],
    queryFn: async () => {
      const results: Record<string, any> = {};
      await Promise.allSettled(
        uniqueStates.map(async (st) => {
          const fips = STATE_CODES[st];
          if (!fips) return;
          const resp = await apiRequest("POST", "/api/justice/live/risk-protective-factors", {
            stateFips: fips, includeGunViolence: true,
          });
          results[st] = await resp.json();
        })
      );
      return results;
    },
    enabled: activeView === "risk" && uniqueStates.length > 0,
  });

  const COUNTY_LOOKUP: Record<string, { stateFips: string; countyFips: string }> = {
    "Wilmington-NC": { stateFips: "37", countyFips: "129" },
    "Austin-TX": { stateFips: "48", countyFips: "453" },
    "Houston-TX": { stateFips: "48", countyFips: "201" },
    "Dallas-TX": { stateFips: "48", countyFips: "113" },
    "Chicago-IL": { stateFips: "17", countyFips: "031" },
    "Philadelphia-PA": { stateFips: "42", countyFips: "101" },
    "Baltimore-MD": { stateFips: "24", countyFips: "510" },
    "Memphis-TN": { stateFips: "47", countyFips: "157" },
    "New Orleans-LA": { stateFips: "22", countyFips: "071" },
    "St. Louis-MO": { stateFips: "29", countyFips: "510" },
    "Detroit-MI": { stateFips: "26", countyFips: "163" },
    "Atlanta-GA": { stateFips: "13", countyFips: "121" },
    "Charlotte-NC": { stateFips: "37", countyFips: "119" },
    "San Antonio-TX": { stateFips: "48", countyFips: "029" },
    "Oakland-CA": { stateFips: "06", countyFips: "001" },
    "Milwaukee-WI": { stateFips: "55", countyFips: "079" },
    "Indianapolis-IN": { stateFips: "18", countyFips: "097" },
    "Kansas City-MO": { stateFips: "29", countyFips: "095" },
    "Birmingham-AL": { stateFips: "01", countyFips: "073" },
    "Jackson-MS": { stateFips: "28", countyFips: "049" },
    "Buffalo-NY": { stateFips: "36", countyFips: "029" },
    "Rochester-NY": { stateFips: "36", countyFips: "055" },
    "Syracuse-NY": { stateFips: "36", countyFips: "067" },
    "Fayetteville-NC": { stateFips: "37", countyFips: "051" },
    "Raleigh-NC": { stateFips: "37", countyFips: "183" },
  };

  const [gentrificationCity, setGentrificationCity] = useState<string>("Austin-TX");
  const gentrificationQuery = useQuery({
    queryKey: ["/api/justice/live/gentrification", gentrificationCity],
    queryFn: async () => {
      const lookup = COUNTY_LOOKUP[gentrificationCity];
      if (!lookup) return null;
      const resp = await fetch(`/api/justice/live/gentrification/${lookup.stateFips}/${lookup.countyFips}`);
      return resp.json();
    },
    enabled: activeView === "gentrification" && !!COUNTY_LOOKUP[gentrificationCity],
  });

  const addCity = (preset?: typeof PRESET_CITIES[0]) => {
    const toAdd = preset || { city: customCity.trim(), state: customState.trim().toUpperCase(), label: `${customCity.trim()}, ${customState.trim().toUpperCase()}`, context: "" };
    if (!toAdd.city || !toAdd.state) return;
    if (selectedCities.some(c => c.city === toAdd.city && c.state === toAdd.state)) return;
    setSelectedCities(prev => [...prev, toAdd]);
    setCustomCity("");
    setCustomState("");
    queryClient.invalidateQueries({ queryKey: ["/api/justice/live/gun-violence/compare"] });
  };

  const removeCity = (idx: number) => {
    setSelectedCities(prev => prev.filter((_, i) => i !== idx));
    queryClient.invalidateQueries({ queryKey: ["/api/justice/live/gun-violence/compare"] });
  };

  const generateStory = async (cityLabel: string) => {
    setStoryLoading(true);
    setGeneratedStory(null);
    try {
      const city = selectedCities.find(c => c.label === cityLabel || c.city === cityLabel);
      const gvData = gvQuery.data?.comparison?.find((c: any) => c.city === city?.city);
      const fips = city ? STATE_CODES[city.state] : null;
      let countyData = null;
      if (fips) {
        try {
          const cResp = await fetch(`/api/justice/live/census/${fips}`);
          countyData = await cResp.json();
        } catch {}
      }

      const resp = await apiRequest("POST", "/api/justice/live/data-story", {
        location: { city: city?.city, state: city?.state, context: city?.context },
        neighborhoodData: { gunViolence: gvData },
        countyData,
        customContext: storyContext || `Data story for ${cityLabel}. ${city?.context || ""}. Include gun violence data from the National Gun Violence Tracker. Connect neighborhood conditions → school outcomes → justice system contact. Be specific with numbers.`,
      });
      const story = await resp.json();
      setGeneratedStory(story);
      setActiveView("story");
    } catch (e: any) {
      setGeneratedStory({ error: e.message || "Unknown error" });
      setActiveView("story");
    }
    setStoryLoading(false);
  };

  const comparison = gvQuery.data?.comparison || [];
  const maxKilled = Math.max(...comparison.map((c: any) => c.killed || 0), 1);
  const maxIncidents = Math.max(...comparison.map((c: any) => c.totalIncidents || 0), 1);

  const riskColor = (level: string) => {
    if (level === "high" || level === "critical") return "text-red-400 bg-red-500/10 border-red-500/30";
    if (level === "medium") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
  };

  return (
    <div className="space-y-6" data-testid="data-storyteller">
      <Card className="p-4 bg-red-900/20 border-red-500/30">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-300">How to Use the Data Storyteller</h3>
            <p className="text-xs text-slate-300 mt-1">
              <strong>Step 1:</strong> Add cities from the preset list or type your own below. <strong>Step 2:</strong> The dashboard auto-loads live gun violence data and Census demographics for every city you add. <strong>Step 3:</strong> Switch between views — Dashboard (city cards), Compare (side-by-side table), Risk & Protective Factors (education/poverty correlations), Gentrification Tracker (8-year Census timeline), or AI Data Story (generates a full narrative with the click of a button). <strong>Everything is live</strong> — real data from Gun Violence Archive and the U.S. Census Bureau.
            </p>
          </div>
        </div>
      </Card>

      <div className="bg-gradient-to-r from-red-900/30 via-orange-900/20 to-red-900/30 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-600/20 rounded-lg border border-red-500/30">
            <Flame className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" data-testid="section-title-storyteller">Data Storyteller — Neighborhood → School → Outcomes</h2>
            <p className="text-sm text-red-300">Live gun violence tracking + Census data + AI-powered data narratives | No city limit on comparisons</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <Badge variant="outline" className="border-red-500/30 text-red-300">Gun Violence Registry Live</Badge>
          <Badge variant="outline" className="border-blue-500/30 text-blue-300">Census Bureau ACS</Badge>
          <Badge variant="outline" className="border-purple-500/30 text-purple-300">AI Data Story Engine</Badge>
          <Badge variant="outline" className="border-green-500/30 text-green-300">{selectedCities.length} Cities Tracked</Badge>
        </div>
      </div>

      {/* City Selector — Unlimited */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-400" /> Add Cities to Track & Compare (No Limit)
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedCities.map((c, i) => (
            <Badge key={i} variant="outline" className="border-blue-500/30 text-blue-300 flex items-center gap-1 px-3 py-1" data-testid={`city-badge-${i}`}>
              {c.label}
              <button onClick={() => removeCity(i)} className="ml-1 text-red-400 hover:text-red-300" data-testid={`remove-city-${i}`}>×</button>
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1 mb-3">
          {PRESET_CITIES.filter(p => !selectedCities.some(s => s.city === p.city && s.state === p.state)).map(p => (
            <button key={p.label} onClick={() => addCity(p)} className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors" data-testid={`add-preset-${p.city}`}>
              + {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={customCity} onChange={e => setCustomCity(e.target.value)} placeholder="City name" className="bg-slate-700 border-slate-600 text-white text-sm max-w-[200px]" data-testid="input-custom-city" />
          <Input value={customState} onChange={e => setCustomState(e.target.value)} placeholder="State (e.g. TX)" className="bg-slate-700 border-slate-600 text-white text-sm max-w-[100px]" data-testid="input-custom-state" />
          <Button size="sm" onClick={() => addCity()} className="bg-red-600 hover:bg-red-700" data-testid="button-add-city">Add City</Button>
        </div>
      </Card>

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "dashboard", label: "City Dashboards", icon: "grid" },
          { key: "compare", label: "Side-by-Side Compare", icon: "bar" },
          { key: "risk", label: "Risk & Protective Factors", icon: "shield" },
          { key: "gentrification", label: "Gentrification Tracker", icon: "home" },
          { key: "story", label: "AI Data Story", icon: "spark" },
        ] as const).map(v => (
          <button key={v.key} onClick={() => setActiveView(v.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === v.key ? "bg-red-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"}`} data-testid={`view-tab-${v.key}`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* === DASHBOARD VIEW === */}
      {activeView === "dashboard" && (
        <div className="space-y-4">
          {gvQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2].map(i => <Skeleton key={i} className="h-64 bg-slate-700" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {comparison.map((cityData: any, idx: number) => {
                const stateCode = selectedCities[idx]?.state;
                const censusData = stateCode ? censusQuery.data?.[stateCode] : null;
                const countyInfo = censusData?.counties?.[0];
                return (
                  <Card key={`${cityData.city}-${cityData.state}`} className="bg-slate-800/60 border-slate-700 overflow-hidden" data-testid={`city-dashboard-${cityData.city}`}>
                    <div className="bg-gradient-to-r from-red-900/40 to-slate-800 p-4 border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{cityData.city}, {cityData.state}</h3>
                          <p className="text-xs text-slate-400">{selectedCities[idx]?.context}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setFocusCity(cityData.city); generateStory(`${cityData.city}, ${cityData.state}`); }} className="border-red-500/30 text-red-300 hover:bg-red-600/20 text-xs" data-testid={`generate-story-${cityData.city}`}>
                          <ScrollText className="w-3 h-3 mr-1" /> Generate Data Story
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Gun Violence Stats */}
                      <div>
                        <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Gun Violence — Live Registry Data
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-red-400" data-testid={`stat-incidents-${cityData.city}`}>{cityData.totalIncidents}</div>
                            <div className="text-[10px] text-slate-400">Incidents</div>
                          </div>
                          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-red-500" data-testid={`stat-killed-${cityData.city}`}>{cityData.killed}</div>
                            <div className="text-[10px] text-slate-400">Killed</div>
                          </div>
                          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-orange-400" data-testid={`stat-injured-${cityData.city}`}>{cityData.injured}</div>
                            <div className="text-[10px] text-slate-400">Injured</div>
                          </div>
                          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-yellow-400">{cityData.homicides}</div>
                            <div className="text-[10px] text-slate-400">Homicides</div>
                          </div>
                        </div>
                        {/* Visual bar for killed relative to max */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Fatality Index</span>
                            <span>{cityData.killed} of {maxKilled} (tracked max)</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full transition-all" style={{ width: `${(cityData.killed / maxKilled) * 100}%` }} />
                          </div>
                        </div>
                        {cityData.massShootings > 0 && (
                          <div className="mt-2 bg-red-900/30 border border-red-500/30 rounded-lg p-2">
                            <span className="text-xs text-red-300 font-semibold">{cityData.massShootings} Mass Shooting Event{cityData.massShootings > 1 ? "s" : ""}</span>
                            <span className="text-[10px] text-red-400 ml-1">(4+ victims per incident)</span>
                          </div>
                        )}
                      </div>

                      {/* Census / Demographics if available */}
                      {countyInfo && (
                        <div>
                          <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" /> Census Demographics — {countyInfo.name}
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-blue-400">{parseInt(countyInfo.population).toLocaleString()}</div>
                              <div className="text-[10px] text-slate-400">Population</div>
                            </div>
                            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-green-400">${parseInt(countyInfo.medianIncome).toLocaleString()}</div>
                              <div className="text-[10px] text-slate-400">Med. Income</div>
                            </div>
                            <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                              <div className={`text-sm font-bold ${parseFloat(countyInfo.povertyRate) > 20 ? "text-red-400" : parseFloat(countyInfo.povertyRate) > 15 ? "text-amber-400" : "text-green-400"}`}>
                                {countyInfo.povertyRate}%
                              </div>
                              <div className="text-[10px] text-slate-400">Poverty Rate</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Monthly Trend */}
                      {cityData.monthlyTrend && cityData.monthlyTrend.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Monthly Trend
                          </h4>
                          <div className="flex gap-1 items-end h-16">
                            {cityData.monthlyTrend.map((m: any, mi: number) => {
                              const maxMo = Math.max(...cityData.monthlyTrend.map((x: any) => x.incidents), 1);
                              return (
                                <div key={mi} className="flex-1 flex flex-col items-center gap-0.5">
                                  <div className="w-full bg-red-500/60 rounded-t" style={{ height: `${(m.incidents / maxMo) * 48}px` }} title={`${m.month}: ${m.incidents} incidents, ${m.killed} killed`} />
                                  <span className="text-[8px] text-slate-500 truncate w-full text-center">{m.month.substring(5)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Recent Incidents */}
                      {cityData.recentIncidents && cityData.recentIncidents.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Recent Incidents</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {cityData.recentIncidents.slice(0, 5).map((inc: any, ii: number) => (
                              <div key={ii} className="flex items-center justify-between bg-slate-900/40 rounded px-2 py-1 text-[10px]">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500">{inc.date}</span>
                                  <span className="text-slate-300">{inc.address || inc.city}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {inc.killed > 0 && <span className="text-red-400 font-semibold">{inc.killed} killed</span>}
                                  {inc.injured > 0 && <span className="text-orange-400">{inc.injured} injured</span>}
                                  {inc.sourceUrl && <a href={inc.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">source</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === COMPARISON VIEW === */}
      {activeView === "compare" && (
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Gun Violence Comparison — {comparison.length} Cities</h3>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="comparison-table">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 px-2 text-slate-400 font-medium">City</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Incidents</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Killed</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Injured</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Homicides</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Mass Shootings</th>
                    <th className="text-right py-2 px-2 text-slate-400 font-medium">Violence Index</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.sort((a: any, b: any) => (b.killed || 0) - (a.killed || 0)).map((c: any, i: number) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-2 px-2 font-semibold text-white">{c.city}, {c.state}</td>
                      <td className="text-right py-2 px-2 text-slate-300">{c.totalIncidents}</td>
                      <td className="text-right py-2 px-2 text-red-400 font-bold">{c.killed}</td>
                      <td className="text-right py-2 px-2 text-orange-400">{c.injured}</td>
                      <td className="text-right py-2 px-2 text-amber-400">{c.homicides}</td>
                      <td className="text-right py-2 px-2 text-red-300">{c.massShootings}</td>
                      <td className="text-right py-2 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-16 bg-slate-700 rounded-full h-1.5">
                            <div className="bg-gradient-to-r from-red-600 to-red-400 h-1.5 rounded-full" style={{ width: `${(c.killed / maxKilled) * 100}%` }} />
                          </div>
                          <span className="text-slate-400 w-8 text-right">{Math.round((c.killed / maxKilled) * 100)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600 bg-slate-800/60">
                    <td className="py-2 px-2 font-bold text-white">TOTAL ({comparison.length} cities)</td>
                    <td className="text-right py-2 px-2 font-bold text-white">{comparison.reduce((s: number, c: any) => s + (c.totalIncidents || 0), 0)}</td>
                    <td className="text-right py-2 px-2 font-bold text-red-400">{comparison.reduce((s: number, c: any) => s + (c.killed || 0), 0)}</td>
                    <td className="text-right py-2 px-2 font-bold text-orange-400">{comparison.reduce((s: number, c: any) => s + (c.injured || 0), 0)}</td>
                    <td className="text-right py-2 px-2 font-bold text-amber-400">{comparison.reduce((s: number, c: any) => s + (c.homicides || 0), 0)}</td>
                    <td className="text-right py-2 px-2 font-bold text-red-300">{comparison.reduce((s: number, c: any) => s + (c.massShootings || 0), 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Visual Bar Comparison */}
            <div className="mt-6 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Fatality Comparison — Bar Chart</h4>
              {comparison.sort((a: any, b: any) => (b.killed || 0) - (a.killed || 0)).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-28 truncate text-right">{c.city}, {c.state}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all" style={{ width: `${(c.killed / maxKilled) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all opacity-40" style={{ width: `${(c.injured / Math.max(maxKilled, c.injured)) * 100}%`, background: "linear-gradient(90deg, orange, transparent)" }} />
                    <span className="absolute right-2 text-[10px] text-white font-bold top-0.5">{c.killed} killed / {c.injured} injured</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Incident Type Distribution */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {comparison.map((c: any, i: number) => (
                <div key={i} className="bg-slate-900/40 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-white mb-2">{c.city} — By Type</h5>
                  {(c.byType || []).map((t: any, ti: number) => (
                    <div key={ti} className="flex items-center justify-between text-[10px] py-0.5">
                      <span className="text-slate-400 capitalize">{t.type}</span>
                      <span className="text-slate-300 font-medium">{t.count}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          {/* Census Comparison */}
          {censusQuery.data && Object.values(censusQuery.data).some((d: any) => d?.counties) && (
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" /> Census Demographics — Side by Side
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-2 px-2 text-slate-400">State</th>
                      <th className="text-left py-2 px-2 text-slate-400">Top County</th>
                      <th className="text-right py-2 px-2 text-slate-400">Population</th>
                      <th className="text-right py-2 px-2 text-slate-400">Med. Income</th>
                      <th className="text-right py-2 px-2 text-slate-400">Poverty %</th>
                      <th className="text-right py-2 px-2 text-slate-400">Unemployment %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCities.map((sc, i) => {
                      const stCensus = censusQuery.data?.[sc.state];
                      const county = stCensus?.counties?.[0];
                      if (!county) return null;
                      return (
                        <tr key={i} className="border-b border-slate-700/50">
                          <td className="py-2 px-2 font-semibold text-white">{selectedCities[i]?.label}</td>
                          <td className="py-2 px-2 text-slate-300">{county.name}</td>
                          <td className="text-right py-2 px-2 text-blue-400">{parseInt(county.population).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-green-400">${parseInt(county.medianIncome).toLocaleString()}</td>
                          <td className={`text-right py-2 px-2 font-semibold ${parseFloat(county.povertyRate) > 20 ? "text-red-400" : parseFloat(county.povertyRate) > 15 ? "text-amber-400" : "text-green-400"}`}>{county.povertyRate}%</td>
                          <td className="text-right py-2 px-2 text-slate-300">{county.unemploymentRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* === RISK & PROTECTIVE FACTORS VIEW === */}
      {activeView === "risk" && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-500/20 p-4">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Risk & Protective Factor Analysis
            </h3>
            <p className="text-xs text-emerald-300 mb-2">Inspired by Dr. Flood's military research: 1 year of college education = primary protective factor. Married individuals and employed adults also show dramatically lower risk profiles.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
              <div className="bg-emerald-900/30 border border-emerald-500/20 rounded p-2">
                <div className="text-emerald-400 font-bold">Protective: College</div>
                <div className="text-slate-300">≥1 year college education reduces risk by up to 99% (military study)</div>
              </div>
              <div className="bg-emerald-900/30 border border-emerald-500/20 rounded p-2">
                <div className="text-emerald-400 font-bold">Protective: Marriage</div>
                <div className="text-slate-300">Married individuals avoid trouble at significantly higher rates</div>
              </div>
              <div className="bg-emerald-900/30 border border-emerald-500/20 rounded p-2">
                <div className="text-emerald-400 font-bold">Protective: Employment</div>
                <div className="text-slate-300">Stable employment is a primary buffer against justice system contact</div>
              </div>
              <div className="bg-red-900/30 border border-red-500/20 rounded p-2">
                <div className="text-red-400 font-bold">Risk: Poverty</div>
                <div className="text-slate-300">High poverty concentration drives increased crime/violence exposure</div>
              </div>
              <div className="bg-red-900/30 border border-red-500/20 rounded p-2">
                <div className="text-red-400 font-bold">Risk: ACEs</div>
                <div className="text-slate-300">Adverse Childhood Experiences compound across generations</div>
              </div>
            </div>
          </Card>

          {riskQuery.isLoading ? (
            <Skeleton className="h-64 bg-slate-700" />
          ) : riskQuery.data ? (
            <>
              {Object.entries(riskQuery.data).map(([stateCode, stateData]: [string, any]) => {
                if (!stateData?.areas) return null;
                const sortedAreas = [...stateData.areas].sort((a: any, b: any) => b.riskScore - a.riskScore).slice(0, 25);
                const maxRisk = Math.max(...sortedAreas.map((a: any) => a.riskScore), 1);
                return (
                  <Card key={stateCode} className="bg-slate-800/50 border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">{stateCode} — County Risk Rankings (Top 25 by Risk Score)</h4>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-red-400">Critical: {stateData.criticalAreas}</span>
                        <span className="text-amber-400">High: {stateData.highRiskAreas}</span>
                        {stateData.gunViolence && (
                          <Badge variant="outline" className="border-red-500/30 text-red-300 text-[10px]">
                            GV: {stateData.gunViolence.killed} killed, {stateData.gunViolence.injured} injured ({stateData.gunViolence.totalIncidents} incidents)
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" data-testid={`risk-table-${stateCode}`}>
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-1.5 px-2 text-slate-400">County</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Risk Score</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">College %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Poverty %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Unemployment %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Married HH %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">2-Parent %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Income</th>
                            <th className="text-left py-1.5 px-2 text-slate-400">Top Risk Factors</th>
                            <th className="text-left py-1.5 px-2 text-slate-400">Protective Factors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedAreas.map((area: any, i: number) => (
                            <tr key={i} className={`border-b border-slate-700/50 ${area.riskLevel === "critical" ? "bg-red-900/10" : area.riskLevel === "high" ? "bg-amber-900/10" : ""}`}>
                              <td className="py-1.5 px-2 font-medium text-white text-[11px]">{area.name.replace(/ County.*/, "")}</td>
                              <td className="text-right py-1.5 px-2">
                                <div className="flex items-center justify-end gap-1">
                                  <div className="w-12 bg-slate-700 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${area.riskLevel === "critical" ? "bg-red-500" : area.riskLevel === "high" ? "bg-amber-500" : area.riskLevel === "moderate" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${(area.riskScore / Math.max(maxRisk, 1)) * 100}%` }} />
                                  </div>
                                  <span className={`font-bold w-6 text-right ${area.riskLevel === "critical" ? "text-red-400" : area.riskLevel === "high" ? "text-amber-400" : "text-green-400"}`}>{area.riskScore}</span>
                                </div>
                              </td>
                              <td className={`text-right py-1.5 px-2 font-semibold ${area.collegePct >= 30 ? "text-emerald-400" : area.collegePct >= 20 ? "text-slate-300" : "text-red-400"}`}>{area.collegePct}%</td>
                              <td className={`text-right py-1.5 px-2 ${area.povertyRate > 20 ? "text-red-400 font-semibold" : area.povertyRate > 15 ? "text-amber-400" : "text-green-400"}`}>{area.povertyRate}%</td>
                              <td className={`text-right py-1.5 px-2 ${area.unemploymentRate > 8 ? "text-red-400" : "text-slate-300"}`}>{area.unemploymentRate}%</td>
                              <td className={`text-right py-1.5 px-2 ${area.marriagePct > 50 ? "text-emerald-400" : area.marriagePct < 35 ? "text-red-400" : "text-slate-300"}`}>{area.marriagePct}%</td>
                              <td className={`text-right py-1.5 px-2 ${area.childrenInTwoParentPct > 65 ? "text-emerald-400" : area.childrenInTwoParentPct < 50 ? "text-red-400" : "text-slate-300"}`}>{area.childrenInTwoParentPct}%</td>
                              <td className="text-right py-1.5 px-2 text-slate-300">${area.medianIncome?.toLocaleString()}</td>
                              <td className="py-1.5 px-2">
                                <div className="flex flex-wrap gap-0.5">
                                  {(area.riskFactors || []).slice(0, 2).map((rf: string, ri: number) => (
                                    <span key={ri} className="text-[9px] bg-red-900/30 text-red-300 px-1 rounded">{rf.split(":")[0]}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-1.5 px-2">
                                <div className="flex flex-wrap gap-0.5">
                                  {(area.protectiveFactors || []).slice(0, 2).map((pf: string, pi: number) => (
                                    <span key={pi} className="text-[9px] bg-emerald-900/30 text-emerald-300 px-1 rounded">{pf.split(":")[0]}</span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Gun Violence by City */}
                    {stateData.gunViolence?.byCityCount && (
                      <div className="mt-4 bg-red-900/10 border border-red-500/20 rounded-lg p-3">
                        <h5 className="text-xs font-semibold text-red-300 mb-2 flex items-center gap-1"><Flame className="w-3 h-3" /> Gun Violence by City ({stateCode})</h5>
                        <div className="flex flex-wrap gap-2">
                          {stateData.gunViolence.byCityCount.slice(0, 10).map((c: any, ci: number) => (
                            <div key={ci} className="bg-slate-900/40 rounded px-2 py-1 text-[10px]">
                              <span className="text-white font-medium">{c.city}</span>
                              <span className="text-red-400 ml-1">{c.count} incidents</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}

              {/* ACEs / Child Abuse Awareness */}
              <Card className="bg-gradient-to-r from-purple-900/30 to-red-900/30 border-purple-500/20 p-4">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-400" /> Adverse Childhood Experiences (ACEs) — No ZIP Code Left Behind
                </h3>
                <p className="text-xs text-purple-300 mb-3">ACEs are traumatic events in childhood that have lasting impacts on health, behavior, and opportunity. Every community must track and address these factors.</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { ace: "Physical Abuse", icon: "fist", stat: "28% of adults report", color: "text-red-400" },
                    { ace: "Emotional Neglect", icon: "heart", stat: "16% of adults report", color: "text-orange-400" },
                    { ace: "Household Substance Abuse", icon: "bottle", stat: "27% of adults report", color: "text-amber-400" },
                    { ace: "Parental Incarceration", icon: "lock", stat: "8% of adults report", color: "text-red-400" },
                    { ace: "Domestic Violence", icon: "shield", stat: "17% of adults report", color: "text-red-400" },
                    { ace: "Mental Illness in Home", icon: "brain", stat: "19% of adults report", color: "text-purple-400" },
                    { ace: "Parental Separation", icon: "split", stat: "28% of adults report", color: "text-amber-400" },
                    { ace: "Sexual Abuse", icon: "alert", stat: "21% of women, 8% of men", color: "text-red-400" },
                    { ace: "Household Food Insecurity", icon: "food", stat: "10% of children", color: "text-orange-400" },
                    { ace: "Community Violence Exposure", icon: "flame", stat: "Varies by ZIP code", color: "text-red-400" },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/40 border border-slate-700 rounded-lg p-2">
                      <div className={`text-[10px] font-bold ${item.color}`}>{item.ace}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{item.stat}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-slate-900/40 rounded-lg p-3 text-xs text-slate-300">
                  <strong className="text-purple-300">The Science:</strong> Individuals with 4+ ACEs are 12x more likely to attempt suicide, 7x more likely to become alcoholic, and 4.6x more likely to experience depression. Children in high-poverty, high-violence neighborhoods accumulate ACEs at 3-4x the rate of children in low-poverty areas. <strong className="text-white">Education and stable family structure are the #1 protective factors against ACE accumulation.</strong>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <a href="https://www.cdc.gov/aces/about/index.html" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">CDC ACES Data</a>
                  <a href="https://acf.gov/cb/data-research/child-maltreatment" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Child Welfare Statistics</a>
                  <a href="https://gunmemorial.org/" target="_blank" rel="noreferrer" className="text-red-400 hover:underline">Gun Memorial — National Database</a>
                  <a href="https://www.gunviolencearchive.org/" target="_blank" rel="noreferrer" className="text-red-400 hover:underline">Gun Violence Archive</a>
                </div>
              </Card>
            </>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700 p-6 text-center">
              <p className="text-slate-400">Select cities above and click this tab to load risk/protective factor data.</p>
            </Card>
          )}
        </div>
      )}

      {/* === GENTRIFICATION TRACKER VIEW === */}
      {activeView === "gentrification" && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-amber-900/30 to-red-900/30 border-amber-500/20 p-4">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Home className="w-4 h-4 text-amber-400" /> Gentrification & Displacement Tracker
            </h3>
            <p className="text-xs text-amber-300">Historical Census data (2015→2022) tracking rent spikes, home value surges, demographic shifts, and population displacement. As communities gentrify, crime doesn't disappear — it migrates.</p>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <h4 className="text-xs font-semibold text-white mb-2">Select City to Track</h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(COUNTY_LOOKUP).map(key => (
                <button key={key} onClick={() => setGentrificationCity(key)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${gentrificationCity === key ? "bg-amber-600 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"}`} data-testid={`gent-select-${key}`}>
                  {key.replace("-", ", ")}
                </button>
              ))}
            </div>
          </Card>

          {gentrificationQuery.isLoading ? (
            <Skeleton className="h-64 bg-slate-700" />
          ) : gentrificationQuery.data ? (
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden" data-testid="gentrification-results">
              <div className={`p-4 border-b border-slate-700 ${
                gentrificationQuery.data.gentrificationLevel === "high" ? "bg-gradient-to-r from-red-900/40 to-amber-900/30"
                : gentrificationQuery.data.gentrificationLevel === "moderate" ? "bg-gradient-to-r from-amber-900/30 to-slate-800"
                : "bg-gradient-to-r from-green-900/30 to-slate-800"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{gentrificationQuery.data.county}</h3>
                    <p className="text-xs text-slate-400">{gentrificationQuery.data.source}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black ${
                      gentrificationQuery.data.gentrificationLevel === "high" ? "text-red-400"
                      : gentrificationQuery.data.gentrificationLevel === "moderate" ? "text-amber-400"
                      : "text-green-400"
                    }`}>{gentrificationQuery.data.gentrificationScore}/100</div>
                    <div className="text-xs text-slate-400">Gentrification Score</div>
                    <Badge variant="outline" className={`mt-1 ${
                      gentrificationQuery.data.gentrificationLevel === "high" ? "border-red-500/30 text-red-300"
                      : gentrificationQuery.data.gentrificationLevel === "moderate" ? "border-amber-500/30 text-amber-300"
                      : "border-green-500/30 text-green-300"
                    }`}>{gentrificationQuery.data.gentrificationLevel?.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Indicators */}
                {gentrificationQuery.data.indicators?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-300 mb-2">Displacement Indicators Detected</h4>
                    <div className="space-y-1">
                      {gentrificationQuery.data.indicators.map((ind: string, ii: number) => (
                        <div key={ii} className="flex items-center gap-2 text-xs bg-amber-900/20 border border-amber-500/20 rounded px-3 py-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="text-slate-200">{ind}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical Timeline */}
                {gentrificationQuery.data.timeline?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-blue-300 mb-2">Historical Census Timeline (2015→2022)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-1.5 px-2 text-slate-400">Year</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Population</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Med. Income</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Med. Rent</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Home Value</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Poverty %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">College %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Black %</th>
                            <th className="text-right py-1.5 px-2 text-slate-400">Hispanic %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gentrificationQuery.data.timeline.map((t: any, ti: number) => {
                            const isFirst = ti === 0; const isLast = ti === gentrificationQuery.data.timeline.length - 1;
                            const first = gentrificationQuery.data.timeline[0];
                            const rentDelta = isLast && first.medianRent ? ((t.medianRent - first.medianRent) / first.medianRent * 100).toFixed(0) : null;
                            return (
                              <tr key={ti} className={`border-b border-slate-700/50 ${isLast ? "bg-slate-700/20 font-medium" : ""}`}>
                                <td className="py-1.5 px-2 text-white font-semibold">{t.year}</td>
                                <td className="text-right py-1.5 px-2 text-blue-400">{t.population?.toLocaleString()}</td>
                                <td className="text-right py-1.5 px-2 text-green-400">${t.medianIncome?.toLocaleString()}</td>
                                <td className="text-right py-1.5 px-2 text-amber-400">
                                  ${t.medianRent?.toLocaleString()}
                                  {rentDelta && <span className="text-red-400 text-[9px] ml-1">(+{rentDelta}%)</span>}
                                </td>
                                <td className="text-right py-1.5 px-2 text-amber-300">${t.medianHomeValue?.toLocaleString()}</td>
                                <td className={`text-right py-1.5 px-2 ${t.povertyRate > 15 ? "text-red-400" : "text-green-400"}`}>{t.povertyRate}%</td>
                                <td className="text-right py-1.5 px-2 text-purple-400">{t.bachelorsPct}%</td>
                                <td className={`text-right py-1.5 px-2 ${isLast && first.blackPct && t.blackPct < first.blackPct - 1 ? "text-red-400 font-semibold" : "text-slate-300"}`}>{t.blackPct}%</td>
                                <td className="text-right py-1.5 px-2 text-slate-300">{t.hispanicPct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Visual Trend Bars */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["medianRent", "medianHomeValue", "medianIncome", "povertyRate"].map(metric => {
                        const label = metric === "medianRent" ? "Rent" : metric === "medianHomeValue" ? "Home Value" : metric === "medianIncome" ? "Income" : "Poverty Rate";
                        const vals = gentrificationQuery.data.timeline.map((t: any) => t[metric] || 0);
                        const max = Math.max(...vals, 1);
                        return (
                          <div key={metric} className="bg-slate-900/40 rounded-lg p-2">
                            <div className="text-[10px] font-semibold text-slate-400 mb-1">{label} Trend</div>
                            <div className="flex items-end gap-1 h-12">
                              {gentrificationQuery.data.timeline.map((t: any, ti: number) => (
                                <div key={ti} className="flex-1 flex flex-col items-center gap-0.5">
                                  <div className={`w-full rounded-t ${metric === "povertyRate" ? "bg-red-500/60" : "bg-blue-500/60"}`} style={{ height: `${(t[metric] / max) * 40}px` }} title={`${t.year}: ${metric.includes("Rate") ? t[metric] + "%" : "$" + t[metric]?.toLocaleString()}`} />
                                  <span className="text-[8px] text-slate-500">{t.year}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/40 rounded-lg p-3 text-xs text-slate-300">
                  <strong className="text-amber-300">Crime Displacement Principle:</strong> When gentrification displaces residents, crime doesn't disappear — it migrates to the next affordable neighborhood. Track where displaced populations move to predict future violence hotspots. Education and workforce investment in receiving communities is the only sustainable prevention.
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700 p-6 text-center">
              <p className="text-slate-400">Select a city above to load gentrification tracking data.</p>
            </Card>
          )}
        </div>
      )}

      {/* === AI DATA STORY VIEW === */}
      {activeView === "story" && (
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Data Story Generator
            </h3>
            <p className="text-xs text-slate-400 mb-3">Select a city and provide optional context. The AI will weave gun violence data, Census demographics, and neighborhood conditions into a powerful narrative connecting neighborhood → school → outcomes.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedCities.map((c, i) => (
                <Button key={i} size="sm" variant={focusCity === c.city ? "default" : "outline"} onClick={() => setFocusCity(c.city)} className={focusCity === c.city ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-slate-300"} data-testid={`story-select-${c.city}`}>
                  {c.label}
                </Button>
              ))}
            </div>
            <Textarea value={storyContext} onChange={e => setStoryContext(e.target.value)} placeholder="Optional context: e.g. 'Focus on the Creekwood neighborhood feeding into Laney HS, compare east side to affluent areas, include busing effects and school police encounters'" className="bg-slate-700 border-slate-600 text-white text-sm mb-3 min-h-[60px]" data-testid="story-context-input" />
            <Button onClick={() => generateStory(focusCity)} disabled={storyLoading || !focusCity} className="bg-purple-600 hover:bg-purple-700" data-testid="button-generate-story">
              {storyLoading ? <><Activity className="w-4 h-4 mr-2 animate-spin" /> Generating Data Story...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Data Story for {focusCity}</>}
            </Button>
          </Card>

          {generatedStory && !generatedStory.error && (
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden" data-testid="generated-story">
              <div className="bg-gradient-to-r from-purple-900/40 to-red-900/40 p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white">{generatedStory.title || generatedStory.story?.title}</h3>
                <p className="text-xs text-purple-300 mt-1">AI-Generated Data Narrative — {new Date().toLocaleDateString()}</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Main Narrative */}
                {(generatedStory.narrative || generatedStory.story?.narrative) && (
                  <div className="prose prose-invert max-w-none">
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{generatedStory.narrative || generatedStory.story?.narrative}</div>
                  </div>
                )}

                {/* Pipeline Stages */}
                {(generatedStory.pipelineStages || generatedStory.story?.pipelineStages) && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" /> Neighborhood → School → Outcomes Pipeline
                    </h4>
                    <div className="space-y-2">
                      {(generatedStory.pipelineStages || generatedStory.story?.pipelineStages || []).map((stage: any, si: number) => (
                        <div key={si} className={`rounded-lg p-3 border ${riskColor(stage.riskLevel)}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold">{stage.stage}</span>
                            <Badge variant="outline" className={`text-[10px] ${riskColor(stage.riskLevel)}`}>{stage.riskLevel?.toUpperCase()}</Badge>
                          </div>
                          <p className="text-xs text-slate-300">{stage.findings}</p>
                          {stage.data && <p className="text-[10px] text-slate-400 mt-1 italic">{stage.data}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Disparities */}
                {(generatedStory.keyDisparities || generatedStory.story?.keyDisparities) && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-300 mb-3">Key Disparities Identified</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(generatedStory.keyDisparities || generatedStory.story?.keyDisparities || []).map((d: any, di: number) => (
                        <div key={di} className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                          <div className="text-xs font-semibold text-red-300">{d.metric}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-white">{d.value1}</span>
                            <span className="text-[10px] text-slate-400">vs</span>
                            <span className="text-sm text-white">{d.value2}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">{d.context}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Root Causes and Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(generatedStory.rootCauses || generatedStory.story?.rootCauses) && (
                    <div>
                      <h4 className="text-sm font-semibold text-amber-300 mb-2">Root Causes</h4>
                      <ul className="space-y-1">
                        {(generatedStory.rootCauses || generatedStory.story?.rootCauses || []).map((rc: string, ri: number) => (
                          <li key={ri} className="text-xs text-slate-300 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" /> {rc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(generatedStory.immediateActions || generatedStory.story?.immediateActions) && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-300 mb-2">Recommended Actions</h4>
                      <ul className="space-y-1">
                        {(generatedStory.immediateActions || generatedStory.story?.immediateActions || []).map((a: string, ai: number) => (
                          <li key={ai} className="text-xs text-slate-300 flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" /> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-700 p-3 bg-slate-900/40 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Sources: National Gun Violence Tracker (ACOS), Census Bureau ACS, Gun Violence Archive</span>
                <span>ACOS Data Storytelling Engine — The Collaborative Advocate Foundation</span>
              </div>
            </Card>
          )}

          {generatedStory?.error && (
            <Card className="bg-red-900/20 border-red-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-semibold text-red-300">Story generation failed</h4>
              </div>
              {(generatedStory.error.includes("401") || generatedStory.error.toLowerCase().includes("unauthorized")) ? (
                <div>
                  <p className="text-xs text-slate-300 mb-3">AI data story generation requires a free account. Sign in to unlock community narratives powered by real gun violence, Census, and SDOH data.</p>
                  <a href="/api/login" className="inline-flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors">Sign In — It's Free →</a>
                </div>
              ) : (
                <p className="text-xs text-slate-300">{generatedStory.error} — Try again or adjust your context.</p>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Data Sources Footer */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 text-[10px] text-slate-500">
        <div className="flex items-center gap-2 mb-1">
          <BookOpenCheck className="w-3 h-3" />
          <span className="font-semibold text-slate-400">Data Sources & Attribution</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><span className="text-red-400">Gun Violence Registry</span> — ACOS National Gun Violence Tracker (Dr. Terry Flood)</div>
          <div><span className="text-blue-400">Census Bureau</span> — American Community Survey (ACS) 5-Year Estimates</div>
          <div><span className="text-green-400">Gun Violence Archive</span> — National incident database (public domain)</div>
          <div><span className="text-purple-400">AI Engine</span> — ACOS Data Storytelling via Implementation Science frameworks</div>
        </div>
      </div>
    </div>
  );
}

function GenerationalAI() {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/justice/ai/cycle-breaking-wizard", {
        step: 1,
        sessionData: { type: "generational_ai", conversationHistory: chatHistory },
        userInput: message,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const responseText = typeof data.response === "string" ? data.response : data.response?.guidance || JSON.stringify(data.response, null, 2);
      setChatHistory(prev => [...prev, { role: "assistant", content: responseText }]);
    },
  });

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { role: "user", content: chatInput }]);
    sendMessage.mutate(chatInput);
    setChatInput("");
  };

  const HISTORICAL_TIMELINE = [
    { year: "1865", event: "13th Amendment — Abolition of slavery (with exception for criminal punishment)", impact: "Created the convict leasing system. The 'except as punishment for crime' clause became the foundation for mass incarceration of Black Americans.", era: "Reconstruction" },
    { year: "1877", event: "End of Reconstruction — Federal troops withdraw from South", impact: "Rise of Black Codes, vagrancy laws used to re-enslave Black people through the criminal justice system. Beginning of Jim Crow.", era: "Jim Crow" },
    { year: "1896", event: "Plessy v. Ferguson — 'Separate but equal' upheld", impact: "Legalized segregation including in education, housing, employment — creating the structural conditions that persist today.", era: "Jim Crow" },
    { year: "1935", event: "Social Security Act — excludes domestic/agricultural workers", impact: "Deliberately excluded occupations dominated by Black workers, creating generational wealth gap that correlates with criminal justice involvement.", era: "New Deal" },
    { year: "1944", event: "GI Bill — discriminatory implementation", impact: "Black veterans systematically denied benefits that built white middle class wealth. Housing, education, and employment gaps persist.", era: "Post-War" },
    { year: "1954", event: "Brown v. Board of Education — desegregation ordered", impact: "Ended legal school segregation but triggered massive resistance. Many districts remain effectively segregated today.", era: "Civil Rights" },
    { year: "1964-1968", event: "Civil Rights Act, Voting Rights Act, Fair Housing Act", impact: "Legal framework for equality established, but implementation gaps and backlash created new forms of structural inequality.", era: "Civil Rights" },
    { year: "1971", event: "Nixon declares 'War on Drugs'", impact: "John Ehrlichman later admitted it targeted Black communities and anti-war activists. Beginning of modern mass incarceration.", era: "War on Drugs" },
    { year: "1986", event: "Anti-Drug Abuse Act — crack/powder cocaine disparity 100:1", impact: "5 grams of crack (predominantly Black communities) = 500 grams of powder cocaine (predominantly white). Devastated Black communities.", era: "War on Drugs" },
    { year: "1994", event: "Violent Crime Control Act — 'Three Strikes' and mandatory minimums", impact: "Largest crime bill in history. Prison population doubled. Federal incentives for states to build prisons and impose harsh sentences.", era: "Mass Incarceration" },
    { year: "1996", event: "Welfare Reform Act (PRWORA)", impact: "Lifetime ban on SNAP/TANF for drug felonies. Barred public housing for criminal records. Created permanent underclass.", era: "Mass Incarceration" },
    { year: "2010", event: "Fair Sentencing Act — reduces crack disparity to 18:1", impact: "Reduced but did not eliminate the racial disparity in drug sentencing. Tens of thousands still serving under old guidelines.", era: "Reform" },
    { year: "2018", event: "First Step Act — federal sentencing reform", impact: "Reduced some mandatory minimums, expanded good-time credits, funded reentry programs. Limited to federal system (only 10% of prisoners).", era: "Reform" },
    { year: "2020", event: "George Floyd / national reckoning on policing", impact: "Unprecedented public awareness of police violence and systemic racism. Some policy changes but limited structural reform.", era: "Reform" },
    { year: "2023", event: "Pell Grants restored for incarcerated students", impact: "After 29-year ban, federal financial aid available in prison. Education is the strongest predictor of successful reentry.", era: "Reform" },
    { year: "2026-2050", event: "PROJECTED: Demographic shift — majority-minority nation", impact: "Systems designed for racial exclusion will either be reformed or continue to produce disparate outcomes at even larger scale.", era: "Future" },
    { year: "2050-2100", event: "PROJECTED: The generation born today reaches middle age", impact: "Every intervention or failure TODAY determines whether this generation breaks or continues the cycle. This is why we build.", era: "Future" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-indigo-900/30 to-slate-800/60 border-indigo-700/50">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Compass className="w-6 h-6 text-indigo-400" />
          Generational AI — 150 Years Back, 75 Years Forward
        </h3>
        <p className="text-sm text-slate-300">
          Nothing happens in a vacuum. Every disparity today has roots in policies from generations ago. This AI understands the full historical context — from the 13th Amendment's exception clause to today's school-to-prison pipeline — and projects forward to show what happens if we act vs. if we don't. Ethical AI for generational change.
        </p>
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Historical Timeline — How We Got Here (1865 → Present → 2100)
        </h3>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-600 via-red-500 via-amber-500 via-blue-500 to-green-500" />
          {HISTORICAL_TIMELINE.map((entry, i) => {
            const isHistorical = parseInt(entry.year) <= 2025;
            const isFuture = parseInt(entry.year) > 2025;
            return (
              <div key={i} className="relative pl-14 pb-5" data-testid={`timeline-${i}`}>
                <div className={`absolute left-4 w-5 h-5 rounded-full border-2 border-slate-800 ${
                  isFuture ? "bg-green-500" : entry.era === "Reform" ? "bg-blue-500" : entry.era === "Mass Incarceration" || entry.era === "War on Drugs" ? "bg-red-500" : entry.era === "Civil Rights" ? "bg-amber-500" : "bg-slate-500"
                }`} />
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${isFuture ? "text-green-400" : "text-white"}`}>{entry.year}</span>
                  <Badge variant="outline" className={`text-xs ${
                    entry.era === "Reform" ? "text-blue-400 border-blue-400/30" :
                    entry.era === "Future" ? "text-green-400 border-green-400/30" :
                    entry.era === "Mass Incarceration" || entry.era === "War on Drugs" ? "text-red-400 border-red-400/30" :
                    "text-slate-400 border-slate-400/30"
                  }`}>{entry.era}</Badge>
                </div>
                <h4 className="text-xs font-semibold text-white">{entry.event}</h4>
                <p className="text-xs text-slate-400 mt-1">{entry.impact}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          Ethical AI Assistant — Ask Anything About Justice, History & Change
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          This AI understands criminal justice history, policy, community organizing, evidence-based programs, implementation science, and generational impact. Ask it to help you understand a problem, design a solution, or plan a community project.
        </p>

        <div className="bg-slate-900 rounded-lg border border-slate-600 p-4 min-h-[300px] max-h-[500px] overflow-y-auto mb-4 space-y-3" data-testid="ai-chat-history">
          {chatHistory.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start a conversation. Ask about policy impact, community strategies, historical context, or building your own project.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[
                  "How did the War on Drugs create mass incarceration?",
                  "What programs actually reduce youth violence?",
                  "How do I start a community watch in my neighborhood?",
                  "What does the school-to-prison pipeline look like in Texas?",
                  "Help me design a reentry program for my church",
                  "How can I build generational wealth after incarceration?",
                ].map((q, i) => (
                  <button key={i} onClick={() => { setChatInput(q); }} className="text-xs px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all" data-testid={`suggested-question-${i}`}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-lg text-xs ${
                msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"
              }`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
            </div>
          ))}
          {sendMessage.isPending && (
            <div className="flex justify-start">
              <div className="bg-slate-700 p-3 rounded-lg text-xs text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about justice, history, community building, or your specific project..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="bg-slate-700 border-slate-600 text-white flex-1"
            data-testid="ai-chat-input"
          />
          <Button onClick={handleSend} disabled={!chatInput.trim() || sendMessage.isPending} className="bg-indigo-600 hover:bg-indigo-700" data-testid="btn-ai-chat-send">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function JusticeCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("data-story");

  const tabs: { id: TabId; label: string; icon: any; color: string }[] = [
    { id: "command", label: "Command Center", icon: LayoutGrid, color: "text-blue-400" },
    { id: "crime-map", label: "Crime Map & Overlays", icon: Map, color: "text-red-400" },
    { id: "pipeline", label: "School-to-Prison Pipeline", icon: AlertTriangle, color: "text-orange-400" },
    { id: "sel", label: "Social-Emotional Learning", icon: Heart, color: "text-purple-400" },
    { id: "court", label: "Court Services", icon: Gavel, color: "text-amber-400" },
    { id: "trends", label: "Trends & Warnings", icon: TrendingUp, color: "text-cyan-400" },
    { id: "stakeholders", label: "Stakeholder Network", icon: Network, color: "text-green-400" },
    { id: "wizard", label: "Cycle-Breaking Wizard", icon: Wand2, color: "text-violet-400" },
    { id: "programs", label: "Program Library", icon: BookOpen, color: "text-emerald-400" },
    { id: "rplice", label: "RPLICE Fidelity", icon: Crosshair, color: "text-blue-400" },
    { id: "workforce", label: "Workforce & Financial", icon: Briefcase, color: "text-emerald-400" },
    { id: "government", label: "Government & Policy", icon: Building2, color: "text-blue-400" },
    { id: "community", label: "Community Action", icon: Megaphone, color: "text-orange-400" },
    { id: "ecosystem-builder", label: "Ecosystem Builder", icon: Layers, color: "text-teal-400" },
    { id: "generational", label: "Generational AI", icon: Compass, color: "text-indigo-400" },
    { id: "data-story", label: "Data Storyteller", icon: Flame, color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="px-6 pt-4">
        <SectionTutorial {...SECTION_TUTORIALS["justice-command-center"]} />
      </div>
      <div className="bg-gradient-to-r from-slate-900 via-blue-900/40 to-slate-900 border-b border-slate-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="page-title">
                Justice & Community Safety Command Center
              </h1>
              <p className="text-sm text-blue-300">
                Predict. Prevent. Intervene. Restore. — Powered by RPLICE, MAP-GAP & Implementation Science
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> All 50 States + DC</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {PUBLIC_DATA_APIS.length} Public Data Sources</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {EVIDENCE_BASED_PROGRAMS.length} Evidence-Based Programs</span>
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {WORKFORCE_PATHWAYS.length} Career Sectors</span>
            <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {POLICY_IMPACT_AREAS.length} Active Policies Tracked</span>
            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> ACOS — The Collaborative Advocate Foundation</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-slate-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-slate-800 text-white border border-slate-600 border-b-0"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <IntegrationInvitation
          surface="justice-hub"
          surfaceContext={activeTab}
          prompt="Have you walked someone through the system — and stayed?"
          description="Reentry peer mentors, court-involved family advocates, AA/NA sponsors, formerly-incarcerated leaders, bail-fund organizers, prison ministry — you ARE the justice infrastructure. No credential required. You set the terms."
          suggestedRoleTags={["reentry peer mentor", "court-involved family advocate", "AA/NA sponsor", "bail fund organizer", "prison ministry", "lived-experience leader", "youth diversion mentor"]}
          className="mb-5"
        />

        {activeTab === "command" && <CommandDashboard />}
        {activeTab === "crime-map" && <CrimeMapOverlay />}
        {activeTab === "pipeline" && <SchoolToPrisonPipeline />}
        {activeTab === "sel" && <SELDashboard />}
        {activeTab === "court" && <CourtServicesTab />}
        {activeTab === "trends" && <TrendsAndPatterns />}
        {activeTab === "stakeholders" && <StakeholderNetwork />}
        {activeTab === "wizard" && <CycleBreakingWizard />}
        {activeTab === "programs" && <ProgramLibrary />}
        {activeTab === "rplice" && <RPLICEFidelity />}
        {activeTab === "workforce" && <WorkforceAndFinancial />}
        {activeTab === "government" && <GovernmentAndPolicy />}
        {activeTab === "community" && <CommunityMobilization />}
        {activeTab === "ecosystem-builder" && <EcosystemBuilder />}
        {activeTab === "generational" && <GenerationalAI />}
        {activeTab === "data-story" && <DataStoryteller />}
        <EvidenceSummary
          claims={[{
            value: null,
            unit: "justice-system indicators",
            source: "TCAF Reentry Case Management System",
            sourceId: "tcaf-reentry-cms",
            asOfDate: null,
            geographyKey: null,
            confidence: "verified",
            decisionCaption: "Use sensitive justice indicators to guide authorized planning and service coordination, not to make decisions about an individual without review.",
          }]}
          className="mt-5"
        />
      </div>
    </div>
  );
}
