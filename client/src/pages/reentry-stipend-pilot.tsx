import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Link } from "wouter";
import {
  DollarSign, Users, TrendingDown, TrendingUp, Shield, BarChart3,
  AlertTriangle, CheckCircle2, ArrowRight, ArrowDown, Target,
  Building2, MapPin, Briefcase, Heart, Scale, Clock, Zap,
  ChevronRight, Brain, Lightbulb, Home, GraduationCap,
  Handshake, Activity, FileText, Landmark, Globe, Star,
  Calculator, PieChart, LineChart, Lock, Unlock, Wallet,
  Bus, Ban, Award, UserCheck, BookOpen
} from "lucide-react";

const TEXAS_STATS = {
  tdcjPopulation: 130000,
  annualReleases: 60000,
  currentGateMoney: 50,
  stateRecidivismRate3yr: 46.1,
  nationalRecidivismRate3yr: 67.8,
  costPerInmateYear: 25174,
  costPerInmateDay: 68.97,
  avgDaysToReoffend: 127,
  travisCountyReleases: 4200,
  williamsonCountyReleases: 1100,
  medianTimeToEmployment: 8.2,
  unemploymentRateFormerlyIncarcerated: 27,
  homelessnessRate60Days: 33,
  substanceRelapseRate: 68,
};

const PILOT_CONFIG = {
  totalParticipants: 400,
  perArm: 100,
  arms: [
    {
      id: "control",
      name: "Control",
      label: "Status Quo",
      color: "bg-gray-500",
      colorLight: "bg-gray-50 dark:bg-gray-950/30",
      borderColor: "border-gray-300 dark:border-gray-700",
      stipendAtRelease: 50,
      workforceBonus: 0,
      trainingWage: 0,
      postProgramMonths: 0,
      postProgramMonthly: 0,
      totalPerPerson: 50,
      description: "Current TDCJ practice: $50 cash and a bus ticket home.",
    },
    {
      id: "arm1",
      name: "Arm 1",
      label: "Cash Stability",
      color: "bg-blue-500",
      colorLight: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-300 dark:border-blue-700",
      stipendAtRelease: 250,
      workforceBonus: 0,
      trainingWage: 0,
      postProgramMonths: 0,
      postProgramMonthly: 0,
      totalPerPerson: 250,
      description: "Tests whether immediate cash stability alone changes reoffending behavior.",
    },
    {
      id: "arm2",
      name: "Arm 2",
      label: "Enhanced Cash",
      color: "bg-amber-500",
      colorLight: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-300 dark:border-amber-700",
      stipendAtRelease: 500,
      workforceBonus: 0,
      trainingWage: 0,
      postProgramMonths: 0,
      postProgramMonthly: 0,
      totalPerPerson: 500,
      description: "Tests dose-response: does more immediate cash produce a larger effect?",
    },
    {
      id: "arm3",
      name: "Arm 3",
      label: "Full Bridge",
      color: "bg-emerald-500",
      colorLight: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-300 dark:border-emerald-700",
      stipendAtRelease: 500,
      workforceBonus: 500,
      trainingWage: 3600,
      postProgramMonths: 6,
      postProgramMonthly: 500,
      totalPerPerson: 7600,
      description: "$500 at release + $500 workforce enrollment bonus + paid training ($15/hr, 20hrs/wk, 12 weeks) + 6-month post-program stipend ($500/mo).",
    },
  ],
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-12" data-testid="section-hero">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-4xl">
        <Badge className="bg-emerald-600 text-white mb-4 text-sm" data-testid="badge-pilot">Proposed Pilot Study</Badge>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4" data-testid="text-hero-title">
          Invest $7,600 to Save $75,000
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mb-6">
          A Texas Reentry Stipend Pilot to Break the Cycle of Recidivism
        </p>
        <p className="text-base text-slate-400 max-w-3xl mb-8">
          Texas releases 60,000 people from TDCJ annually with $50 and a bus ticket. 
          Nearly half return within three years. This pilot tests whether strategic financial 
          investment at the moment of release -- combined with workforce development incentives -- 
          can fundamentally change that trajectory.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur">
            <p className="text-3xl font-bold text-red-400">$50</p>
            <p className="text-xs text-slate-400">Current gate money</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur">
            <p className="text-3xl font-bold text-red-400">46%</p>
            <p className="text-xs text-slate-400">TX 3-year recidivism</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur">
            <p className="text-3xl font-bold text-amber-400">60,000</p>
            <p className="text-xs text-slate-400">Annual TDCJ releases</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/10 backdrop-blur">
            <p className="text-3xl font-bold text-emerald-400">$25,174</p>
            <p className="text-xs text-slate-400">Cost per inmate/year</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <div className="space-y-6" data-testid="section-problem">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">The Problem</h2>
          <p className="text-muted-foreground">Setting people up to fail on Day 1</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" data-testid="card-day1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" /> Day 1 After Release
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cash in hand</span>
              <span className="font-bold text-red-600">$50.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Transportation</span>
              <span className="font-bold text-red-600">Bus ticket</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Housing secured</span>
              <span className="font-bold text-red-600">Often none</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Job lined up</span>
              <span className="font-bold text-red-600">Rarely</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Valid ID</span>
              <span className="font-bold text-red-600">Often expired</span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">$50 does not cover a single night in a motel in any Texas metro area. The average cost of a motel room in Austin is $89/night.</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" data-testid="card-first90">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" /> First 90 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Homeless within 60 days</span>
                <span className="font-bold text-red-600">33%</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Still unemployed at 90 days</span>
                <span className="font-bold text-red-600">60%</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Substance relapse</span>
                <span className="font-bold text-red-600">68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avg days to first reoffense</span>
                <span className="font-bold text-red-600">127 days</span>
              </div>
              <Progress value={35} className="h-2" />
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">The first 72 hours are the highest-risk window. Most reoffending starts with unmet basic needs.</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" data-testid="card-cycle">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" /> The Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { step: "Release", detail: "$50, no plan, no support", icon: Unlock },
                { step: "Survival mode", detail: "Can't afford food, shelter, phone", icon: AlertTriangle },
                { step: "Desperation", detail: "Old networks, old habits", icon: TrendingDown },
                { step: "Reoffense", detail: "Avg 127 days post-release", icon: Ban },
                { step: "Re-incarceration", detail: "$25,174/year to taxpayers", icon: Lock },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-red-100 dark:bg-red-900/40 shrink-0">
                    <item.icon className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.step}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  {i < 4 && <ArrowDown className="h-3 w-3 text-red-400 shrink-0" />}
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="text-center p-2 rounded bg-red-100 dark:bg-red-900/40">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Cost to Texas taxpayers per cycle:</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(TEXAS_STATS.costPerInmateYear * 3)}</p>
              <p className="text-xs text-muted-foreground">3-year incarceration average</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InterventionSection() {
  return (
    <div className="space-y-6" data-testid="section-intervention">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
          <Lightbulb className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">The Intervention</h2>
          <p className="text-muted-foreground">Four arms, one question: What breaks the cycle?</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {PILOT_CONFIG.arms.map((arm) => (
          <Card key={arm.id} className={`${arm.colorLight} ${arm.borderColor} border-2 transition-all hover:shadow-lg`} data-testid={`card-arm-${arm.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className={`${arm.color} text-white`}>{arm.name}</Badge>
                <span className="text-xs text-muted-foreground">{PILOT_CONFIG.perArm} participants</span>
              </div>
              <CardTitle className="text-lg mt-2">{arm.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{arm.description}</p>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Release stipend</span>
                  <span className="font-bold">{formatCurrency(arm.stipendAtRelease)}</span>
                </div>
                {arm.workforceBonus > 0 && (
                  <div className="flex justify-between">
                    <span>Workforce bonus</span>
                    <span className="font-bold text-emerald-600">+{formatCurrency(arm.workforceBonus)}</span>
                  </div>
                )}
                {arm.trainingWage > 0 && (
                  <div className="flex justify-between">
                    <span>Training wages (12 wks)</span>
                    <span className="font-bold text-emerald-600">+{formatCurrency(arm.trainingWage)}</span>
                  </div>
                )}
                {arm.postProgramMonthly > 0 && (
                  <div className="flex justify-between">
                    <span>Post-program ({arm.postProgramMonths} mo)</span>
                    <span className="font-bold text-emerald-600">+{formatCurrency(arm.postProgramMonthly * arm.postProgramMonths)}</span>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg bg-background text-center">
                <p className="text-xs text-muted-foreground">Total investment per person</p>
                <p className="text-2xl font-bold">{formatCurrency(arm.totalPerPerson)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-arm3-detail">
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            Arm 3 — The Full Bridge (detailed breakdown)
          </h3>
          <div className="grid md:grid-cols-5 gap-3">
            {[
              { phase: "Day 1", title: "$500 Stipend", detail: "Immediate cash for housing deposit, phone, food, clothing, ID replacement", icon: Wallet, amount: 500 },
              { phase: "Week 1-2", title: "$500 Bonus", detail: "Earned by enrolling in approved workforce development program", icon: Award, amount: 500 },
              { phase: "Weeks 3-14", title: "Paid Training", detail: "$15/hr, 20 hrs/week for 12 weeks. Real skills, real income.", icon: GraduationCap, amount: 3600 },
              { phase: "Months 4-9", title: "$500/month", detail: "6-month post-program runway for housing stability and career building", icon: Home, amount: 3000 },
              { phase: "Month 9+", title: "Self-Sustaining", detail: "Work history, stable housing, income trajectory established", icon: TrendingUp, amount: 0 },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-background">
                <Badge variant="outline" className="mb-2">{item.phase}</Badge>
                <item.icon className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                {item.amount > 0 && <p className="text-lg font-bold text-emerald-600 mt-2">{formatCurrency(item.amount)}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CostBenefitSection() {
  const [recidivismReduction, setRecidivismReduction] = useState([20]);
  const reduction = recidivismReduction[0];

  const baseRecidivism = TEXAS_STATS.stateRecidivismRate3yr;
  const newRecidivismRate = baseRecidivism * (1 - reduction / 100);
  const participantsPerArm = PILOT_CONFIG.perArm;

  const controlReoffenders = Math.round(participantsPerArm * (baseRecidivism / 100));
  const arm3Reoffenders = Math.round(participantsPerArm * (newRecidivismRate / 100));
  const peopleSaved = controlReoffenders - arm3Reoffenders;

  const incarcerationCostSaved = peopleSaved * TEXAS_STATS.costPerInmateYear * 3;
  const interventionCost = participantsPerArm * 7600;
  const netSavings = incarcerationCostSaved - interventionCost;
  const roi = ((incarcerationCostSaved - interventionCost) / interventionCost * 100);

  const scaleToState = TEXAS_STATS.annualReleases;
  const stateReoffenders = Math.round(scaleToState * (baseRecidivism / 100));
  const stateNewReoffenders = Math.round(scaleToState * (newRecidivismRate / 100));
  const statePeopleSaved = stateReoffenders - stateNewReoffenders;
  const stateSavings = statePeopleSaved * TEXAS_STATS.costPerInmateYear * 3;
  const stateInterventionCost = scaleToState * 7600;
  const stateNetSavings = stateSavings - stateInterventionCost;

  return (
    <div className="space-y-6" data-testid="section-cost-benefit">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/40">
          <Calculator className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Cost-Benefit Analysis</h2>
          <p className="text-muted-foreground">Adjust the recidivism reduction slider to see the fiscal impact</p>
        </div>
      </div>

      <Card className="p-6" data-testid="card-slider">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Projected Recidivism Reduction (Arm 3)</span>
            <Badge className="bg-emerald-600 text-white text-lg px-3">{reduction}%</Badge>
          </div>
          <Slider
            value={recidivismReduction}
            onValueChange={setRecidivismReduction}
            min={5}
            max={50}
            step={1}
            className="w-full"
            data-testid="slider-reduction"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Conservative (5%)</span>
            <span>Moderate (20%)</span>
            <span>Optimistic (50%)</span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2" data-testid="card-pilot-economics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Pilot Scale (100 participants, Arm 3)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                <p className="text-xs text-muted-foreground">Control group reoffenders</p>
                <p className="text-3xl font-bold text-red-600">{controlReoffenders}</p>
                <p className="text-xs">of {participantsPerArm} ({baseRecidivism}%)</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                <p className="text-xs text-muted-foreground">Arm 3 reoffenders</p>
                <p className="text-3xl font-bold text-emerald-600">{arm3Reoffenders}</p>
                <p className="text-xs">of {participantsPerArm} ({newRecidivismRate.toFixed(1)}%)</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">People who do not return to prison</span>
                <span className="font-bold text-emerald-600">{peopleSaved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Incarceration cost avoided (3-yr)</span>
                <span className="font-bold text-emerald-600">{formatCurrency(incarcerationCostSaved)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total intervention cost (Arm 3)</span>
                <span className="font-bold text-red-600">-{formatCurrency(interventionCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Net savings to Texas</span>
                <span className={`font-bold ${netSavings >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {netSavings >= 0 ? "+" : ""}{formatCurrency(netSavings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Return on investment</span>
                <span className={`font-bold ${roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>{roi >= 0 ? "+" : ""}{roi.toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10" data-testid="card-state-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" /> Scaled to All Texas Releases ({formatNumber(scaleToState)}/yr)
            </CardTitle>
            <CardDescription>If this pilot works, here is what full-state adoption looks like</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
                <p className="text-xs text-muted-foreground">Currently reoffend (3-yr)</p>
                <p className="text-3xl font-bold text-red-600">{formatNumber(stateReoffenders)}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-center">
                <p className="text-xs text-muted-foreground">Would reoffend with intervention</p>
                <p className="text-3xl font-bold text-emerald-600">{formatNumber(stateNewReoffenders)}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-center">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                {formatNumber(statePeopleSaved)} fewer people return to prison annually
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Incarceration costs avoided (3-yr)</span>
                <span className="font-bold text-emerald-600">{formatCurrency(stateSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Full intervention cost</span>
                <span className="font-bold text-red-600">-{formatCurrency(stateInterventionCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Annual net savings to Texas</span>
                <span className={`font-bold ${stateNetSavings >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {stateNetSavings >= 0 ? "+" : ""}{formatCurrency(stateNetSavings)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-background text-center text-sm text-muted-foreground">
              This does not account for reduced court costs, reduced crime victimization costs, 
              increased tax revenue from employed participants, or reduced public assistance utilization.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 bg-slate-50 dark:bg-slate-900/50" data-testid="card-context">
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Texas spends annually on incarceration</p>
            <p className="text-2xl font-bold">{formatCurrency(TEXAS_STATS.tdcjPopulation * TEXAS_STATS.costPerInmateYear)}</p>
            <p className="text-xs text-muted-foreground">130,000 inmates x $25,174/year</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Full-state intervention would cost</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stateInterventionCost)}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(scaleToState)} releases x $7,600</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Intervention = % of incarceration budget</p>
            <p className="text-2xl font-bold text-emerald-600">{(stateInterventionCost / (TEXAS_STATS.tdcjPopulation * TEXAS_STATS.costPerInmateYear) * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">A fraction of current spending</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function OutcomesSection() {
  return (
    <div className="space-y-6" data-testid="section-outcomes">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/40">
          <BarChart3 className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">What We Measure</h2>
          <p className="text-muted-foreground">Longitudinal tracking at 6, 12, 24, and 36 months</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card data-testid="card-primary-outcomes">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500" /> Primary Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { metric: "Rearrest rate", source: "TDCJ + Travis County records", icon: Shield },
                { metric: "Reconviction rate", source: "Texas court records (OCA)", icon: Scale },
                { metric: "Reincarceration rate", source: "TDCJ + county jail data", icon: Lock },
                { metric: "Time to first reoffense", source: "Criminal history timestamps", icon: Clock },
                { metric: "Offense severity at reoffense", source: "UCR classification", icon: AlertTriangle },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.metric}</p>
                    <p className="text-xs text-muted-foreground">{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-secondary-outcomes">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-500" /> Secondary Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { metric: "Employment status and income", source: "TWC wage records + self-report", icon: Briefcase },
                { metric: "Housing stability", source: "Self-report + ECHO/HMIS data", icon: Home },
                { metric: "Workforce program completion", source: "Training provider records", icon: GraduationCap },
                { metric: "Substance use and treatment", source: "SAMHSA + self-report", icon: Heart },
                { metric: "Family reunification", source: "CPS records + self-report", icon: Users },
                { metric: "Public assistance utilization", source: "HHSC SNAP/Medicaid records", icon: DollarSign },
                { metric: "Tax revenue generated", source: "TWC wage records", icon: TrendingUp },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <item.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.metric}</p>
                    <p className="text-xs text-muted-foreground">{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-community-outcomes">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-emerald-500" /> Community-Level Outcomes
          </CardTitle>
          <CardDescription>Measured in ZIP codes where participants reside</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            {[
              { metric: "Local crime rates", detail: "FBI UCR + Austin PD data in participant ZIP codes" },
              { metric: "Neighborhood safety", detail: "Resident surveys pre/post in participant areas" },
              { metric: "Economic activity", detail: "Business formation, employment rates in target ZIPs" },
              { metric: "Social cohesion", detail: "Community engagement, civic participation metrics" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm font-semibold">{item.metric}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineSection() {
  const phases = [
    { phase: "Phase 1", title: "Design and Partnership", duration: "Months 1-6", color: "bg-blue-500", items: ["IRB approval (UT Austin or Texas State)", "TDCJ data sharing agreement", "Travis County partnership MOU", "Workforce provider contracts", "Randomization protocol finalized", "Staff hiring and training"] },
    { phase: "Phase 2", title: "Enrollment", duration: "Months 7-18", color: "bg-amber-500", items: ["400 participants enrolled at TDCJ release", "Random assignment to 4 arms", "Baseline data collection", "Release day stipend distribution", "Workforce enrollment tracking (Arm 3)", "Monthly check-ins begin"] },
    { phase: "Phase 3", title: "Active Intervention", duration: "Months 7-24", color: "bg-emerald-500", items: ["Arm 3 workforce training delivery", "Post-program stipend disbursement", "Quarterly outcome measurement", "Fidelity monitoring via RPLICE", "Interim analysis at 12 months", "Community-level data collection"] },
    { phase: "Phase 4", title: "Follow-Up and Analysis", duration: "Months 25-42", color: "bg-purple-500", items: ["36-month recidivism tracking", "Full longitudinal analysis", "Cost-benefit report", "Policy brief for Texas Legislature", "Peer-reviewed publication", "Scale-up recommendation"] },
  ];

  return (
    <div className="space-y-6" data-testid="section-timeline">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Study Timeline</h2>
          <p className="text-muted-foreground">42-month design through final analysis</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {phases.map((p, i) => (
          <Card key={i} className="relative" data-testid={`card-phase-${i+1}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${p.color}`} />
                <Badge variant="outline">{p.phase}</Badge>
              </div>
              <CardTitle className="text-base mt-1">{p.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{p.duration}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {p.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PilotSitesSection() {
  return (
    <div className="space-y-6" data-testid="section-sites">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <MapPin className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pilot Sites</h2>
          <p className="text-muted-foreground">Central Texas -- existing TCAF infrastructure</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-2 border-indigo-200 dark:border-indigo-800" data-testid="card-site-travis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" /> Travis County (Primary)
            </CardTitle>
            <CardDescription>~4,200 TDCJ releases annually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted/50">
                <p className="font-bold">1.3M</p>
                <p className="text-xs text-muted-foreground">Population</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="font-bold">$435K</p>
                <p className="text-xs text-muted-foreground">Median home price</p>
              </div>
            </div>
            <p className="text-sm font-semibold">Existing TCAF partnerships:</p>
            <div className="flex flex-wrap gap-1">
              {["ECHO (CoC)", "Foundation Communities", "Caritas of Austin", "Workforce Solutions Capital Area", "Travis County Sheriff", "UT Austin (IRB)", "Goodwill Central TX"].map(p => (
                <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2" data-testid="card-site-williamson">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Williamson County (Secondary)
            </CardTitle>
            <CardDescription>~1,100 TDCJ releases annually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted/50">
                <p className="font-bold">643K</p>
                <p className="text-xs text-muted-foreground">Population</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="font-bold">Fastest</p>
                <p className="text-xs text-muted-foreground">Growing TX county</p>
              </div>
            </div>
            <p className="text-sm font-semibold">Strategic advantages:</p>
            <div className="flex flex-wrap gap-1">
              {["Samsung/Tesla corridor", "Pflugerville overlap", "Lower cost of living", "PfISD data access", "PCDC partnership", "Rural-suburban contrast"].map(p => (
                <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FundingSection() {
  const sources = [
    { name: "Arnold Ventures", type: "Foundation", amount: "$500K-$2M", fit: "Excellent", reason: "Funds criminal justice RCTs specifically. This is their core mission.", url: "arnoldventures.org" },
    { name: "NIJ Research Grants", type: "Federal (DOJ)", amount: "$500K-$1M", fit: "Excellent", reason: "Standing solicitation for reentry research. Implementation science angle strengthens proposal.", url: "nij.ojp.gov" },
    { name: "DOJ Second Chance Act", type: "Federal", amount: "$750K", fit: "Strong", reason: "Reentry demonstration projects. TCAF has OJJDP pre-award for related work.", url: "ojp.gov" },
    { name: "Laura and John Arnold Foundation", type: "Foundation", amount: "$250K-$1M", fit: "Strong", reason: "Criminal justice evidence-building. Values RCTs and rigorous evaluation.", url: "" },
    { name: "MacArthur Safety + Justice", type: "Foundation", amount: "$500K-$2M", fit: "Strong", reason: "Safety and Justice Challenge network. Travis County could apply as a site.", url: "macfound.org" },
    { name: "Texas Legislature (89th)", type: "State", amount: "$1M-$5M", fit: "Moderate", reason: "Next session 2027. Pilot data from 2026 start could inform legislative appropriation.", url: "" },
    { name: "SAMHSA Reentry Grant", type: "Federal", amount: "$400K", fit: "Moderate", reason: "Substance use component of reentry. Pairs with behavioral health tracking.", url: "samhsa.gov" },
  ];

  return (
    <div className="space-y-6" data-testid="section-funding">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40">
          <DollarSign className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Funding Strategy</h2>
          <p className="text-muted-foreground">Matched to funder priorities</p>
        </div>
      </div>

      <div className="space-y-3">
        {sources.map((s, i) => (
          <Card key={i} className="hover:shadow-md transition-all" data-testid={`card-funder-${i}`}>
            <div className="p-4 flex items-center gap-4">
              <div className="text-center shrink-0 w-16">
                <Badge className={s.fit === "Excellent" ? "bg-emerald-600 text-white" : s.fit === "Strong" ? "bg-blue-600 text-white" : "bg-amber-600 text-white"}>
                  {s.fit}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm">{s.name}</p>
                  <Badge variant="outline" className="text-xs">{s.type}</Badge>
                  <Badge variant="secondary" className="text-xs">{s.amount}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{s.reason}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InfrastructureSection() {
  return (
    <div className="space-y-6" data-testid="section-infrastructure">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/40">
          <Zap className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Why TCAF Can Execute This</h2>
          <p className="text-muted-foreground">Existing infrastructure that no other organization has</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            name: "RPLICE",
            role: "Implementation Fidelity Engine",
            detail: "CFIR 2.0 fidelity tracking ensures workforce programs are delivered as designed. Most reentry programs fail because of poor implementation -- not bad ideas. RPLICE solves that.",
            icon: Brain,
            stats: ["Multi-AI consensus", "CFIR 2.0 + RE-AIM + EPIS", "Real-time fidelity alerts"]
          },
          {
            name: "Justice Command Center",
            role: "Crime and Recidivism Analytics",
            detail: "FBI UCR, BJS recidivism data, state-by-state comparisons, and local crime mapping already built. Provides the baseline data and ongoing monitoring infrastructure.",
            icon: Shield,
            stats: ["FBI UCR integration", "50-state comparison", "Local crime mapping"]
          },
          {
            name: "Mission Transition",
            role: "Veteran Subset Support",
            detail: "Justice-involved veterans are a significant subset. M2C already provides SkillBridge pathways, peer support, and benefits navigation for this population.",
            icon: Award,
            stats: ["SkillBridge pipeline", "Peer support matching", "Benefits navigation"]
          },
          {
            name: "Workforce Dashboard",
            role: "Employment Tracking",
            detail: "Real-time tracking of job placements, wage progression, employer connections, and training completion rates across the workforce development pipeline.",
            icon: Briefcase,
            stats: ["TWC data integration", "Employer network", "Wage tracking"]
          },
          {
            name: "LifeBridge",
            role: "Peer Support and Mentoring",
            detail: "Peer support matching algorithm connects participants with trained peers who have lived experience. Proven to reduce isolation -- the #1 driver of relapse and reoffense.",
            icon: Handshake,
            stats: ["Peer matching", "Lived experience", "24/7 support line"]
          },
          {
            name: "ISSS Framework (Adapted)",
            role: "Participant Thrive Tracking",
            detail: "The same early-warning system used for K-12 students, adapted for adult reentry. Flags participants at risk of program dropout before they disengage.",
            icon: Activity,
            stats: ["Thrive Score tracking", "Early warning flags", "Intervention triggers"]
          },
        ].map((platform, i) => (
          <Card key={i} className="hover:shadow-md transition-all" data-testid={`card-platform-${i}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <platform.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{platform.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{platform.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{platform.detail}</p>
              <div className="flex flex-wrap gap-1">
                {platform.stats.map(s => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DataSourcesSection() {
  return (
    <div className="space-y-6" data-testid="section-data-sources">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/40">
          <Globe className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Data Sources -- Nationwide Coverage</h2>
          <p className="text-muted-foreground">Every data point sourced from verified federal, state, and local systems</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card data-testid="card-ds-federal">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Landmark className="h-4 w-4" /> Federal (Nationwide)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { name: "BJS Recidivism Data", detail: "400K prisoner cohort, 34 states, 5-year follow-up" },
                { name: "FBI UCR / Crime Data Explorer", detail: "State-level crime rates, arrest data, juvenile stats" },
                { name: "Census ACS", detail: "Demographics, poverty, employment at tract level" },
                { name: "CDC PLACES + SVI", detail: "Health outcomes and vulnerability by census tract" },
                { name: "BLS Employment Data", detail: "Labor market, wages, occupational data" },
                { name: "SAMHSA Treatment Locator", detail: "Substance abuse and mental health treatment capacity" },
                { name: "USASpending", detail: "Active federal awards for reentry programming" },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold text-xs">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-ds-state">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> State (Texas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { name: "TDCJ Release Data", detail: "60,000 annual releases, facility-level demographics" },
                { name: "Texas OCA Court Records", detail: "Conviction and sentencing data statewide" },
                { name: "TWC Wage Records", detail: "Employment verification and wage tracking" },
                { name: "TX HHSC Benefits Data", detail: "Medicaid, SNAP, TANF utilization" },
                { name: "TJJD Juvenile Data", detail: "Youth detention, diversion, and referral rates" },
                { name: "TX DSHS Health Data", detail: "Substance use treatment, communicable disease" },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold text-xs">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-800" data-testid="card-ds-local">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Local (Central Texas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { name: "Travis County Sheriff", detail: "Jail population, booking data, reentry programs" },
                { name: "Austin PD Crime Data", detail: "Incident reports by ZIP code and beat" },
                { name: "ECHO / HMIS", detail: "Homelessness tracking, housing placements" },
                { name: "Workforce Solutions Cap Area", detail: "Local training providers, placement rates" },
                { name: "Foundation Communities", detail: "Affordable housing placement and stability" },
                { name: "PfISD / ISSS Data", detail: "Existing implementation science infrastructure" },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold text-xs">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CallToAction() {
  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 overflow-hidden relative" data-testid="section-cta">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
      </div>
      <CardContent className="relative z-10 py-8 text-center max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">The Question Is Not Whether We Can Afford This Program.</h2>
        <p className="text-xl text-slate-300 mb-6">The question is whether we can afford not to.</p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-2xl font-bold text-red-400">$75,522</p>
            <p className="text-xs text-slate-400">Cost of one 3-year re-incarceration</p>
          </div>
          <div className="text-2xl font-bold self-center text-slate-400">vs.</div>
          <div className="p-3 rounded-lg bg-white/10">
            <p className="text-2xl font-bold text-emerald-400">$7,600</p>
            <p className="text-xs text-slate-400">Cost of the full intervention</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Every person who does not return to prison saves taxpayers three years of incarceration costs, 
          reduces crime in their community, reunites with their family, pays taxes, and contributes to the economy. 
          The data is clear. The infrastructure is built. The pilot is ready.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Badge className="bg-emerald-600 text-white px-4 py-2 text-sm">
            The Collaborative Advocate Foundation
          </Badge>
          <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
            501(c)(3) -- EIN: 41-3618003
          </Badge>
          <Badge variant="outline" className="text-slate-300 border-slate-600 px-4 py-2 text-sm">
            Veteran-Founded -- Black-Led
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReentryStipendPilotPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "problem", label: "The Problem" },
    { id: "intervention", label: "Intervention" },
    { id: "economics", label: "Cost-Benefit" },
    { id: "outcomes", label: "Outcomes" },
    { id: "timeline", label: "Timeline" },
    { id: "sites", label: "Pilot Sites" },
    { id: "funding", label: "Funding" },
    { id: "infrastructure", label: "Infrastructure" },
    { id: "data", label: "Data Sources" },
  ];

  return (
    <div className="min-h-screen" data-testid="page-reentry-stipend-pilot">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-3 py-2 overflow-x-auto">
            <span className="text-sm font-bold shrink-0">TX Reentry Pilot</span>
            <Separator orientation="vertical" className="h-6" />
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveSection(s.id)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${activeSection === s.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                data-testid={`nav-${s.id}`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 max-w-6xl space-y-12">
        <section id="overview">
          <HeroSection />
        </section>

        <section id="problem">
          <ProblemSection />
        </section>

        <section id="intervention">
          <InterventionSection />
        </section>

        <section id="economics">
          <CostBenefitSection />
        </section>

        <section id="outcomes">
          <OutcomesSection />
        </section>

        <section id="timeline">
          <TimelineSection />
        </section>

        <section id="sites">
          <PilotSitesSection />
        </section>

        <section id="funding">
          <FundingSection />
        </section>

        <section id="infrastructure">
          <InfrastructureSection />
        </section>

        <section id="data">
          <DataSourcesSection />
        </section>

        <section id="cta">
          <CallToAction />
        </section>

        <div className="flex flex-wrap gap-2 pb-8">
          <Link href="/justice-command-center">
            <Button variant="outline" size="sm" data-testid="link-justice"><Shield className="h-4 w-4 mr-1" /> Justice Command Center</Button>
          </Link>
          <Link href="/data-sources">
            <Button variant="outline" size="sm" data-testid="link-data-sources"><Globe className="h-4 w-4 mr-1" /> All Data Sources</Button>
          </Link>
          <Link href="/reentry">
            <Button variant="outline" size="sm" data-testid="link-reentry"><Scale className="h-4 w-4 mr-1" /> Reentry Dashboard</Button>
          </Link>
          <Link href="/grants">
            <Button variant="outline" size="sm" data-testid="link-grants"><Target className="h-4 w-4 mr-1" /> Grant Hub</Button>
          </Link>
          <Link href="/workforce-dashboard">
            <Button variant="outline" size="sm" data-testid="link-workforce"><Briefcase className="h-4 w-4 mr-1" /> Workforce Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}