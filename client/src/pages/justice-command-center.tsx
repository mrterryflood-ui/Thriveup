import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Sparkles, Wand2, CircleDot, Network, Megaphone, Flag, Star
} from "lucide-react";

type TabId = "command" | "crime-map" | "pipeline" | "sel" | "court" | "trends" | "stakeholders" | "wizard" | "programs" | "rplice" | "workforce" | "government" | "community" | "ecosystem-builder" | "generational";

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
  { name: "FBI Uniform Crime Report (UCR)", category: "Crime Data", url: "https://crime-data-explorer.fr.cloud.gov/pages/docApi", description: "National crime statistics, offense data, arrest data by demographics", dataPoints: "Agency-level crime data for 18,000+ law enforcement agencies" },
  { name: "Bureau of Justice Statistics (BJS)", category: "Justice Data", url: "https://bjs.ojp.gov/data", description: "Correctional populations, recidivism, victimization surveys", dataPoints: "Prison/jail populations, recidivism rates, crime victimization" },
  { name: "Vera Institute Justice Data", category: "Incarceration", url: "https://trends.vera.org", description: "Jail/prison incarceration trends by county", dataPoints: "County-level incarceration data since 1970" },
  { name: "OJJDP Easy Access", category: "Juvenile Justice", url: "https://www.ojjdp.gov/ojstatbb/", description: "Juvenile arrest, court, and detention data", dataPoints: "State-level juvenile justice processing data" },
  { name: "Census Bureau ACS", category: "Demographics", url: "https://data.census.gov", description: "Poverty, education, employment, demographics by geography", dataPoints: "Block group through national level demographic data" },
  { name: "NCES Education Data", category: "Education", url: "https://nces.ed.gov/ccd/elsi/", description: "School enrollment, discipline, achievement gaps", dataPoints: "School and district level education data" },
  { name: "CDC WONDER", category: "Health/SDOH", url: "https://wonder.cdc.gov", description: "Mortality, natality, behavioral risk factors", dataPoints: "County-level health data, ACEs prevalence" },
  { name: "HUD AFFH Data", category: "Housing", url: "https://egis.hud.gov/affht/", description: "Housing patterns, segregation indices, opportunity mapping", dataPoints: "Census tract-level housing and opportunity data" },
  { name: "BLS Employment Data", category: "Employment", url: "https://www.bls.gov/data/", description: "Employment, wages, unemployment by demographics", dataPoints: "Metro and state-level employment data" },
  { name: "DOJ Civil Rights Data", category: "Disparities", url: "https://civilrightsdata.ed.gov", description: "School discipline, restraint/seclusion, law enforcement referrals", dataPoints: "School-level civil rights data for every public school" },
  { name: "Sentencing Commission", category: "Sentencing", url: "https://www.ussc.gov/research/datafiles", description: "Federal sentencing data, demographic disparities", dataPoints: "Individual-level federal sentencing data" },
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

function CommandDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["/api/justice/command-center/stats"] });

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

function CrimeMapOverlay() {
  const [selectedState1, setSelectedState1] = useState("TX");
  const [selectedState2, setSelectedState2] = useState("CA");
  const [activeLayers, setActiveLayers] = useState<string[]>(["crime", "schools", "poverty"]);

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const state1Data = STATE_COMPARISON_DATA[selectedState1];
  const state2Data = STATE_COMPARISON_DATA[selectedState2];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-400" />
          Data Layer Overlays
        </h3>
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

        <div className="bg-slate-900 rounded-xl border border-slate-600 p-8 min-h-[400px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 30% 40%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 70% 60%, #ef4444 0%, transparent 40%), radial-gradient(circle at 50% 30%, #f59e0b 0%, transparent 45%)" }} />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
            <Globe className="w-16 h-16 text-blue-400 mb-4" />
            <h4 className="text-xl font-bold text-white mb-2">National GIS Intelligence Map</h4>
            <p className="text-sm text-slate-400 max-w-lg mb-4">
              Interactive neighborhood-level mapping with {activeLayers.length} active data layers.
              Crime hotspots, resource deserts, education gaps, and community assets — all overlaid for pattern recognition.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {activeLayers.map(id => {
                const layer = DATA_LAYERS.find(l => l.id === id);
                return layer ? (
                  <Badge key={id} style={{ backgroundColor: layer.color + "30", color: layer.color, borderColor: layer.color }} variant="outline" className="text-xs">
                    <CircleDot className="w-3 h-3 mr-1" />
                    {layer.label} Active
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-800/60 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart className="w-5 h-5 text-purple-400" />
          State Comparison Tool
        </h3>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-1 block">State 1</label>
            <Select value={selectedState1} onValueChange={setSelectedState1}>
              <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="select-state-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(STATE_COMPARISON_DATA).map(code => (
                  <SelectItem key={code} value={code}>{US_STATES.find(s => s.code === code)?.name || code}</SelectItem>
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
                {Object.keys(STATE_COMPARISON_DATA).map(code => (
                  <SelectItem key={code} value={code}>{US_STATES.find(s => s.code === code)?.name || code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {state1Data && state2Data && (
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
        )}
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

export default function JusticeCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabId>("command");

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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
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
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Nationwide Coverage — All 50 States + DC</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {PUBLIC_DATA_APIS.length} Public Data Sources Connected</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {EVIDENCE_BASED_PROGRAMS.length} Evidence-Based Programs</span>
            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> ACOS Platform — The Collaborative Advocate Foundation</span>
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
      </div>
    </div>
  );
}
