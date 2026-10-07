import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, TrendingUp, DollarSign, Users, Building2, Globe, Star, ArrowRight, Target, Layers, Zap } from "lucide-react";

const SLIDES = [
  { id: 1, type: "title" },
  { id: 2, type: "executive-summary" },
  { id: 3, type: "who-is-childinc" },
  { id: 4, type: "market-context" },
  { id: 5, type: "eligibility-overview" },
  { id: 6, type: "federal-categories" },
  { id: 7, type: "priority-programs" },
  { id: 8, type: "state-landscape" },
  { id: 9, type: "local-contracts" },
  { id: 10, type: "growth-strategy" },
  { id: 11, type: "tcaf-services" },
  { id: 12, type: "delivery-model" },
  { id: 13, type: "differentiators" },
  { id: 14, type: "pipeline-view" },
  { id: 15, type: "opportunity-range" },
  { id: 16, type: "next-steps" },
  { id: 17, type: "call-to-action" },
];

function SlideWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute inset-0 flex flex-col ${className}`}>
      {children}
    </div>
  );
}

function SlideTag({ text, color = "amber" }: { text: string; color?: string }) {
  const colors: Record<string, string> = {
    amber: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    emerald: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    blue: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    rose: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    violet: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${colors[color]}`}>
      {text}
    </span>
  );
}

// ── SLIDE 1: TITLE ─────────────────────────────────────────────────────────
function TitleSlide() {
  return (
    <SlideWrapper className="items-center justify-center text-center px-16">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 70% 60%, #3b82f6 0%, transparent 50%)" }} />
      <div className="relative z-10 max-w-4xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <SlideTag text="Prepared by TCAF / ThriveUp" color="amber" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4 leading-tight">
          Child Inc.<br />
          <span className="text-amber-400">Funding Growth Strategy</span>
        </h1>
        <p className="text-xl text-blue-200 mb-8">
          Federal · State · Local · Contract Opportunity Landscape
        </p>
        <div className="w-24 h-1 bg-amber-400 mx-auto mb-8" />
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Scaling Up · Scaling Out · Building Workforce Capacity
        </p>
        <div className="mt-12 flex items-center justify-center gap-8 text-slate-400 text-sm">
          <span>Travis County, Texas</span>
          <span>·</span>
          <span>June 2026</span>
          <span>·</span>
          <span>CONFIDENTIAL</span>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 2: EXECUTIVE SUMMARY ─────────────────────────────────────────────
function ExecutiveSummarySlide() {
  const points = [
    { icon: TrendingUp, label: "Strong alignment with early childhood, family support, and workforce funding" },
    { icon: Globe, label: "Real opportunity across federal grants, Texas pass-through, and local contracts" },
    { icon: Layers, label: "Best growth path is a braided funding model — not reliance on a single stream" },
  ];
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-blue-950" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-8">
          <SlideTag text="02 · Executive Summary" color="blue" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Child Inc. is strongly positioned for a{" "}
            <span className="text-amber-400">multi-source funding growth strategy</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-5 mb-8">
          {points.map((p, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p.icon className="w-8 h-8 text-amber-400 mb-3" />
              <p className="text-slate-200 text-sm leading-relaxed">{p.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 flex-1">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">Near-Term Funding Potential</p>
            <p className="text-4xl font-bold text-white mb-2">$3M – $15M+</p>
            <p className="text-slate-300 text-sm">Realistic direct/near-term addressable pipeline</p>
            <div className="mt-4 space-y-2">
              {["Early childhood expansion", "Childcare workforce development", "Family stabilization", "Public-sector service contracts"].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">Partnership-Driven Pipeline</p>
            <p className="text-4xl font-bold text-white mb-2">$5M – $25M+</p>
            <p className="text-slate-300 text-sm">Expanded value with colleges, health systems, workforce boards</p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-slate-400 text-xs">Theoretical opportunity universe identified:</p>
              <p className="text-white text-lg font-bold">$12.9M – $126.8M across all programs</p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 3: WHO IS CHILD INC. ─────────────────────────────────────────────
function WhoIsChildIncSlide() {
  const strengths = [
    "Established nonprofit human services footprint in Travis County",
    "Trusted provider in Head Start / Early Head Start",
    "Family-centered service model with strong community ties",
    "Serves priority populations actively targeted by funders",
  ];
  const frames = [
    { label: "Direct Impact", desc: "Child and family outcomes: school readiness, health, stability" },
    { label: "Economic Infrastructure", desc: "Supports workforce participation for low-income families" },
  ];
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-8">
          <SlideTag text="03 · About Child Inc." color="emerald" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Already in a <span className="text-emerald-400">high-opportunity lane</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-8 flex-1">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Core Strengths</p>
            <div className="space-y-3">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-200 text-sm">{s}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-emerald-400 text-xs font-bold uppercase mb-2">Strong Fit For</p>
              <div className="flex flex-wrap gap-2">
                {["Low-income families", "School readiness", "Childcare access", "Workforce participation", "Family mobility", "Community-based delivery"].map(t => (
                  <span key={t} className="bg-white/10 text-slate-300 text-xs px-2 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">How Funders See Child Inc.</p>
            <div className="space-y-4">
              {frames.map((f, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    <p className="text-white font-bold">{f.label}</p>
                  </div>
                  <p className="text-slate-300 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
              <p className="text-amber-300 font-bold mb-1">Key Message</p>
              <p className="text-slate-300 text-sm">
                Child Inc. serves the exact populations that federal, state, and local funders are actively competing to reach. That is a durable competitive advantage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 4: MARKET CONTEXT ────────────────────────────────────────────────
function MarketContextSlide() {
  const stats = [
    { value: "1.3M+", label: "Travis County Residents", sub: "One of fastest-growing counties in the US" },
    { value: "~975K", label: "City of Austin Population", sub: "Rapid growth straining services" },
    { value: "Low teens", label: "Poverty Rate Countywide", sub: "Child poverty materially higher in service areas" },
    { value: "Major gaps", label: "Childcare Supply", sub: "Affordability and access gaps persist" },
  ];
  const drivers = [
    "Rapid population growth and rising service demand",
    "High housing and cost-of-living pressure on working families",
    "Persistent childcare affordability and access gaps",
    "Employer demand for stable workforce participation",
    "Equity gaps in historically underserved neighborhoods (East/SE Austin)",
    "Transit gaps affecting low-income shift workers",
  ];
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="04 · Market Context" color="blue" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Austin / Travis County{" "}
            <span className="text-blue-400">strengthens eligibility</span>
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-300">{s.value}</p>
              <p className="text-white text-sm font-semibold mt-1">{s.label}</p>
              <p className="text-slate-400 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 flex-1">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Community Need Drivers</p>
            <div className="space-y-2">
              {drivers.map((d, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">Grant Relevance</p>
            <p className="text-slate-300 text-sm mb-4">These conditions strengthen competitiveness for:</p>
            <div className="space-y-3">
              {[
                { label: "Childcare access & quality funds", strength: 95 },
                { label: "Workforce pathway grants", strength: 90 },
                { label: "Maternal / child health funding", strength: 88 },
                { label: "Family stabilization programs", strength: 92 },
                { label: "Local government equity contracts", strength: 85 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-blue-400">{item.strength}% fit</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${item.strength}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 5: ELIGIBILITY OVERVIEW ──────────────────────────────────────────
function EligibilityOverviewSlide() {
  const levels = [
    {
      color: "amber", icon: Globe, label: "Federal",
      items: ["Head Start / Early Head Start", "Child Care Development Fund", "Maternal & child health grants", "Behavioral health programs", "AmeriCorps", "DOL workforce grants", "Community economic development"],
    },
    {
      color: "blue", icon: Building2, label: "State of Texas",
      items: ["Texas Workforce Commission", "Texas Education Agency", "TX Health & Human Services", "Maternal/child health pass-throughs", "TX Dept. Housing & Community Affairs"],
    },
    {
      color: "emerald", icon: Users, label: "Local / Regional",
      items: ["City of Austin contracts", "Travis County contracts", "Workforce Solutions Capital Area", "School district partnerships", "Higher education partnerships"],
    },
    {
      color: "violet", icon: Star, label: "Private / Blended",
      items: ["Foundation grants", "Health system partnerships", "Managed care community investment", "Corporate and place-based funding"],
    },
  ];
  const colors: Record<string, string> = {
    amber: "border-amber-500/40 bg-amber-500/10",
    blue: "border-blue-500/40 bg-blue-500/10",
    emerald: "border-emerald-500/40 bg-emerald-500/10",
    violet: "border-violet-500/40 bg-violet-500/10",
  };
  const iconColors: Record<string, string> = {
    amber: "text-amber-400", blue: "text-blue-400", emerald: "text-emerald-400", violet: "text-violet-400",
  };
  const tagColors: Record<string, string> = {
    amber: "text-amber-300", blue: "text-blue-300", emerald: "text-emerald-300", violet: "text-violet-300",
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="05 · Eligibility Overview" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Child Inc. is eligible across{" "}
            <span className="text-amber-400">four major funding levels</span>
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1">
          {levels.map((l) => (
            <div key={l.label} className={`border rounded-2xl p-5 flex flex-col ${colors[l.color]}`}>
              <div className="flex items-center gap-2 mb-4">
                <l.icon className={`w-5 h-5 ${iconColors[l.color]}`} />
                <span className={`font-bold text-base ${tagColors[l.color]}`}>{l.label}</span>
              </div>
              <div className="space-y-2 flex-1">
                {l.items.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${iconColors[l.color].replace("text-", "bg-")}`} />
                    <span className="text-slate-300 text-xs leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-white/5 rounded-xl p-4 text-center">
          <p className="text-slate-300 text-sm">
            <span className="text-amber-400 font-bold">21+ federal programs</span> identified · Strongest path is a{" "}
            <span className="text-blue-400 font-bold">braided multi-source strategy</span>
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 6: FEDERAL CATEGORIES ────────────────────────────────────────────
function FederalCategoriesSlide() {
  const cats = [
    {
      num: "01", color: "amber", title: "Early Childhood Expansion",
      items: ["Head Start / Early Head Start", "Preschool Development Grants", "Child Care Development Fund pass-through"],
    },
    {
      num: "02", color: "blue", title: "Workforce Development",
      items: ["Childcare workforce pipeline grants", "Apprenticeship / pre-apprenticeship", "Community college partnerships", "Parent employment support"],
    },
    {
      num: "03", color: "emerald", title: "Family Stabilization",
      items: ["Anti-poverty / economic mobility programs", "Family strengthening and navigation", "Financial capability / household stability"],
    },
    {
      num: "04", color: "rose", title: "Maternal & Child Health",
      items: ["MIECHV home visiting", "Infant / early childhood mental health", "Developmental support", "Trauma-informed caregiver programs"],
    },
    {
      num: "05", color: "violet", title: "Local Gov. Contracts",
      items: ["City of Austin human services", "Travis County health contracts", "Workforce Solutions procurements"],
    },
    {
      num: "06", color: "blue", title: "Capacity & Innovation",
      items: ["AmeriCorps staffing expansion", "Community Economic Development", "Community Schools / wraparound"],
    },
  ];
  const bg: Record<string, string> = {
    amber: "bg-amber-500/10 border-amber-500/30",
    blue: "bg-blue-500/10 border-blue-500/30",
    emerald: "bg-emerald-500/10 border-emerald-500/30",
    rose: "bg-rose-500/10 border-rose-500/30",
    violet: "bg-violet-500/10 border-violet-500/30",
  };
  const text: Record<string, string> = {
    amber: "text-amber-400", blue: "text-blue-400", emerald: "text-emerald-400", rose: "text-rose-400", violet: "text-violet-400",
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="06 · Federal Opportunity Categories" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Six federal funding lanes with <span className="text-amber-400">strong fit</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4 flex-1">
          {cats.map((c) => (
            <div key={c.num} className={`border rounded-2xl p-5 ${bg[c.color]}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-2xl font-black ${text[c.color]}`}>{c.num}</span>
                <p className="text-white font-bold text-sm">{c.title}</p>
              </div>
              <div className="space-y-1.5">
                {c.items.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ArrowRight className={`w-3 h-3 mt-0.5 flex-shrink-0 ${text[c.color]}`} />
                    <span className="text-slate-300 text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 7: PRIORITY PROGRAMS ─────────────────────────────────────────────
function PriorityProgramsSlide() {
  const programs = [
    { rank: 1, name: "Head Start / Early Head Start", agency: "HHS / ACF / OHS", range: "$500K – $20M+", fit: 98 },
    { rank: 2, name: "Child Care & Development Fund (CCDF)", agency: "HHS / ACF / OCC", range: "$100K – $5M", fit: 95 },
    { rank: 3, name: "MIECHV Home Visiting partnerships", agency: "HRSA", range: "$100K – $5M+", fit: 92 },
    { rank: 4, name: "DOL Childcare Workforce / Apprenticeship", agency: "Dept. of Labor", range: "$500K – $8M", fit: 90 },
    { rank: 5, name: "AmeriCorps State & National", agency: "AmeriCorps", range: "$75K – $1.5M+", fit: 88 },
    { rank: 6, name: "Community Economic Development", agency: "HHS / ACF / OCS", range: "$800K – $1.1M", fit: 85 },
    { rank: 7, name: "Community Schools Program", agency: "Dept. of Education", range: "$500K – $5M", fit: 83 },
    { rank: 8, name: "SAMHSA Early Childhood Mental Health", agency: "SAMHSA", range: "$300K – $3M", fit: 82 },
  ];
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="07 · Priority Federal Programs" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Top 8 programs to <span className="text-amber-400">evaluate first</span>
          </h2>
        </div>
        <div className="flex-1 space-y-3">
          {programs.map((p) => (
            <div key={p.rank} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 font-bold text-sm">{p.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{p.name}</p>
                <p className="text-slate-400 text-xs">{p.agency}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-emerald-400 font-bold text-sm">{p.range}</p>
              </div>
              <div className="w-32 flex-shrink-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Fit</span>
                  <span className="text-amber-400">{p.fit}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${p.fit}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 8: STATE LANDSCAPE ───────────────────────────────────────────────
function StateLandscapeSlide() {
  const agencies = [
    { name: "Texas Workforce Commission", items: ["Childcare quality & access", "Provider support networks", "Workforce participation initiatives"], color: "blue" },
    { name: "Workforce Solutions Capital Area", items: ["Local childcare and workforce contracts", "Parent employment support models"], color: "emerald" },
    { name: "Texas Education Agency", items: ["Afterschool / extended learning (21st CCLC)", "School-linked support services"], color: "amber" },
    { name: "Texas Health & Human Services", items: ["Family support & prevention", "Maternal / child health programs"], color: "rose" },
    { name: "TX Dept. Housing & Community Affairs", items: ["Family stabilization intersections", "Supportive services"], color: "violet" },
  ];
  const bgs: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/30",
    emerald: "bg-emerald-500/10 border-emerald-500/30",
    amber: "bg-amber-500/10 border-amber-500/30",
    rose: "bg-rose-500/10 border-rose-500/30",
    violet: "bg-violet-500/10 border-violet-500/30",
  };
  const texts: Record<string, string> = {
    blue: "text-blue-400", emerald: "text-emerald-400", amber: "text-amber-400", rose: "text-rose-400", violet: "text-violet-400",
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="08 · State of Texas Landscape" color="blue" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Five high-value state channels for <span className="text-blue-400">Child Inc.</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4 flex-1">
          {agencies.slice(0, 3).map((a) => (
            <div key={a.name} className={`border rounded-2xl p-5 ${bgs[a.color]}`}>
              <p className={`font-bold text-sm mb-3 ${texts[a.color]}`}>{a.name}</p>
              <div className="space-y-2">
                {a.items.map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${texts[a.color].replace("text-", "bg-")}`} />
                    <span className="text-slate-300 text-xs">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {agencies.slice(3).map((a) => (
            <div key={a.name} className={`border rounded-2xl p-5 ${bgs[a.color]}`}>
              <p className={`font-bold text-sm mb-3 ${texts[a.color]}`}>{a.name}</p>
              <div className="space-y-2">
                {a.items.map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${texts[a.color].replace("text-", "bg-")}`} />
                    <span className="text-slate-300 text-xs">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-bold mb-2">Strategic Note</p>
              <p className="text-slate-300 text-sm">
                Much of the best state funding comes through{" "}
                <span className="text-amber-400 font-semibold">pass-through contracts and implementation partnerships</span>
                {" "}— not only open grants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 9: LOCAL CONTRACTS ───────────────────────────────────────────────
function LocalContractsSlide() {
  const entities = [
    { name: "City of Austin", color: "amber", items: ["Family support services", "Early childhood & youth services", "Community-based social service contracts", "Equity-focused neighborhood initiatives"] },
    { name: "Travis County", color: "blue", items: ["Health and human services contracts", "Family stabilization & prevention", "Community health partnerships"] },
    { name: "Regional Institutions", color: "emerald", items: ["Austin ISD school partnerships", "Austin Community College", "Workforce Solutions Capital Area", "Hospital / community benefit partners", "Coordinated care / managed care investment"] },
  ];
  const colors: Record<string, string> = {
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    blue: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="09 · Local & Regional Contracts" color="emerald" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Contracts can be as important as grants for{" "}
            <span className="text-emerald-400">sustainable scale</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1">
          {entities.map((e) => {
            const [border, bg, txt] = colors[e.color].split(" ");
            return (
              <div key={e.name} className={`border rounded-2xl p-6 ${border} ${bg}`}>
                <p className={`font-bold text-lg mb-4 ${txt}`}>{e.name}</p>
                <div className="space-y-3">
                  {e.items.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${txt}`} />
                      <span className="text-slate-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-slate-300 text-sm">
            Austin rapid growth → <span className="text-emerald-400 font-semibold">increased public contract volume</span> for community-based organizations with proven track records
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 10: GROWTH STRATEGY ──────────────────────────────────────────────
function GrowthStrategySlide() {
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="10 · Growth Strategy" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Recommended model: <span className="text-amber-400">braid funding across three lanes</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1">
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">1</div>
              <p className="text-amber-400 font-bold">Protect & Expand Core</p>
            </div>
            <p className="text-slate-400 text-xs mb-4">Reinforce the foundation that funders trust</p>
            <div className="space-y-3 flex-1">
              {["Head Start / Early Head Start continuation & expansion", "Childcare access and quality improvement", "Family support services scaling"].map(i => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{i}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-amber-500/20">
              <p className="text-amber-400 text-xs font-bold">Timeline: Immediate</p>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/40 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">2</div>
              <p className="text-blue-400 font-bold">Scale Out Adjacent Services</p>
            </div>
            <p className="text-slate-400 text-xs mb-4">Add adjacent services that attract new funders</p>
            <div className="space-y-3 flex-1">
              {["MIECHV home visiting", "Early childhood mental health", "Parent navigation services", "Community schools partnerships", "Family economic mobility supports"].map(i => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{i}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-blue-500/20">
              <p className="text-blue-400 text-xs font-bold">Timeline: 6–18 months</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">3</div>
              <p className="text-emerald-400 font-bold">Build Workforce Dev as Revenue</p>
            </div>
            <p className="text-slate-400 text-xs mb-4">Strongest "scale-out" strategy — attracts both grants and contracts</p>
            <div className="space-y-3 flex-1">
              {["Childcare workforce pathways", "Family advocate workforce training", "CHW / parent peer support workforce", "Apprenticeship partnerships (DOL)"].map(i => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{i}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-500/20">
              <p className="text-emerald-400 text-xs font-bold">Timeline: 12–24 months</p>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-amber-300 font-bold">Bottom Line</p>
          <p className="text-slate-300 text-sm mt-1">
            Workforce development is the strongest scale-out strategy because it attracts{" "}
            <span className="text-white font-semibold">both grants and contracts</span> simultaneously
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 11: TCAF SERVICES ────────────────────────────────────────────────
function TcafServicesSlide() {
  const services = [
    {
      color: "amber", title: "Funding Strategy",
      items: ["Full federal, state, and local opportunity mapping", "Eligibility analysis", "Funding pipeline design", "Calendar and sequencing strategy"],
    },
    {
      color: "blue", title: "Pursuit Support",
      items: ["Opportunity qualification and scoring", "Go / no-go recommendation", "Proposal development support", "Partnership and teaming strategy"],
    },
    {
      color: "emerald", title: "Contracting Support",
      items: ["Public-sector contract identification", "Capability positioning", "RFP response support", "Subcontracting and teaming pathways"],
    },
    {
      color: "violet", title: "Growth Infrastructure",
      items: ["Grants management readiness", "Evidence and outcomes positioning", "Budget development", "Reporting and compliance preparation"],
    },
  ];
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" },
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="11 · What TCAF / ThriveUp Provides" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            How we <span className="text-amber-400">help Child Inc. win</span>
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1">
          {services.map((s) => {
            const st = styles[s.color];
            return (
              <div key={s.title} className={`border rounded-2xl p-5 ${st.bg} ${st.border}`}>
                <p className={`font-bold text-sm mb-4 ${st.text}`}>{s.title}</p>
                <div className="space-y-2.5">
                  {s.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${st.text}`} />
                      <span className="text-slate-300 text-xs leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-5 text-center">
          <p className="text-white text-xl font-bold">
            "We are not just helping you search for grants.{" "}
            <span className="text-amber-400">We are helping you build a funding capture system for growth.</span>"
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 12: DELIVERY MODEL ───────────────────────────────────────────────
function DeliveryModelSlide() {
  const phases = [
    {
      num: "01", color: "amber", title: "Discovery + Opportunity Map",
      items: ["Assess current programs, footprint, and expansion goals", "Identify best-fit grants, contracts, and pass-through funds", "Build a prioritized pursuit list"],
    },
    {
      num: "02", color: "blue", title: "Funding Capture Strategy",
      items: ["Rank opportunities by fit, timing, and win probability", "Define pursue now vs. build toward", "Prepare partner strategy and required documents"],
    },
    {
      num: "03", color: "emerald", title: "Application & Proposal Execution",
      items: ["Compliance matrix", "Narrative development", "Budget support", "Attachments and submission readiness"],
    },
    {
      num: "04", color: "violet", title: "Post-Award Support",
      items: ["Implementation planning", "Grants management systems", "Reporting and compliance workflow", "Renewal and continuation strategy"],
    },
  ];
  const styles: Record<string, { bg: string; border: string; num: string; bullet: string }> = {
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", num: "text-amber-400", bullet: "bg-amber-400" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", num: "text-blue-400", bullet: "bg-blue-400" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", num: "text-emerald-400", bullet: "bg-emerald-400" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", num: "text-violet-400", bullet: "bg-violet-400" },
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="12 · Our Delivery Model" color="blue" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Four-phase engagement — <span className="text-blue-400">from discovery to scale</span>
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1">
          {phases.map((p) => {
            const st = styles[p.color];
            return (
              <div key={p.num} className={`border rounded-2xl p-5 ${st.bg} ${st.border} flex flex-col`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-3xl font-black ${st.num}`}>{p.num}</span>
                  <p className="text-white font-bold text-sm leading-tight">{p.title}</p>
                </div>
                <div className="space-y-2.5 flex-1">
                  {p.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${st.bullet}`} />
                      <span className="text-slate-300 text-xs leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2 justify-center">
          {phases.map((p, i) => (
            <div key={p.num} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${styles[p.color].bullet}`} />
              <span className="text-slate-400 text-xs">{p.title}</span>
              {i < phases.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
            </div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 13: DIFFERENTIATORS ──────────────────────────────────────────────
function DifferentiatorsSlide() {
  const diffs = [
    { icon: Target, text: "Identify the RIGHT opportunities — not just available ones" },
    { icon: Zap, text: "Avoid low-probability pursuits that drain capacity" },
    { icon: Star, text: "Package programs in funder language, not organizational language" },
    { icon: Layers, text: "Align workforce development with childcare and family outcomes" },
    { icon: Globe, text: "Pursue both grants AND contracts simultaneously" },
    { icon: TrendingUp, text: "Build a repeatable funding pipeline — not reactive grant-chasing" },
  ];
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-8">
          <SlideTag text="13 · What Makes Us Different" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            We focus on <span className="text-amber-400">awardability</span>, not just availability
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-5 flex-1">
          {diffs.map((d, i) => (
            <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <d.icon className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-slate-200 text-sm leading-relaxed pt-1">{d.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-amber-400">21+</p>
              <p className="text-slate-300 text-sm mt-1">Federal programs identified</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">4</p>
              <p className="text-slate-300 text-sm mt-1">Funding levels mapped</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">$3M–$15M+</p>
              <p className="text-slate-300 text-sm mt-1">Near-term realistic pipeline</p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 14: PIPELINE VIEW ────────────────────────────────────────────────
function PipelineViewSlide() {
  const lanes = [
    {
      color: "emerald", label: "Pursue Now", urgency: "Immediate priority",
      items: [
        { name: "Head Start / Early Head Start opportunities", type: "Grant" },
        { name: "Texas childcare pass-through funds", type: "Pass-through" },
        { name: "AmeriCorps capacity expansion", type: "Grant" },
        { name: "Local family support contracts", type: "Contract" },
      ],
    },
    {
      color: "amber", label: "Build Toward", urgency: "6–18 month horizon",
      items: [
        { name: "DOL Apprenticeship / workforce grants", type: "Grant" },
        { name: "MIECHV partnerships", type: "Subaward" },
        { name: "Community schools partnerships", type: "Contract" },
        { name: "Early childhood mental health grants", type: "Grant" },
      ],
    },
    {
      color: "blue", label: "Monitor", urgency: "18–36 month horizon",
      items: [
        { name: "Larger state-led systems grants", type: "Grant" },
        { name: "Multi-agency demonstration pilots", type: "Consortium" },
        { name: "Innovation pilots requiring broader consortium", type: "Consortium" },
      ],
    },
  ];
  const styles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-300" },
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="14 · Funding Pipeline View" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Illustrative 3-tier <span className="text-amber-400">pursuit structure</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-5 flex-1">
          {lanes.map((l) => {
            const st = styles[l.color];
            return (
              <div key={l.label} className={`border rounded-2xl p-5 ${st.bg} ${st.border} flex flex-col`}>
                <div className="mb-4">
                  <p className={`text-xl font-bold ${st.text}`}>{l.label}</p>
                  <p className="text-slate-400 text-xs">{l.urgency}</p>
                </div>
                <div className="space-y-3 flex-1">
                  {l.items.map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <ArrowRight className={`w-3 h-3 mt-1 flex-shrink-0 ${st.text}`} />
                        <span className="text-slate-300 text-xs leading-relaxed">{item.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${st.badge}`}>{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-white/5 rounded-xl p-4 text-center">
          <p className="text-slate-300 text-sm">
            Goal: build a <span className="text-amber-400 font-semibold">high-fit, high-probability pipeline</span> — not to chase every grant
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 15: OPPORTUNITY RANGE ────────────────────────────────────────────
function OpportunityRangeSlide() {
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="15 · Estimated Opportunity Range" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            A multi-million-dollar <span className="text-amber-400">funding landscape</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-5 mb-6">
          {[
            { label: "Theoretical Universe", range: "$12.9M – $126.8M", sub: "Sum of all identified programs' bounds", color: "blue", note: "Do not present as available" },
            { label: "Tier A — Realistic Near-Term", range: "$3M – $15M+", sub: "Direct/lead opportunities, 12–24 months", color: "amber", note: "Most defensible headline number" },
            { label: "Tier B — Partnership Pipeline", range: "$5M – $25M+", sub: "Colleges, health systems, workforce boards", color: "emerald", note: "With aggressive partner strategy" },
          ].map((t) => {
            const colors: Record<string, string> = { blue: "bg-blue-500/10 border-blue-500/30", amber: "bg-amber-500/10 border-amber-500/30", emerald: "bg-emerald-500/10 border-emerald-500/30" };
            const texts: Record<string, string> = { blue: "text-blue-400", amber: "text-amber-400", emerald: "text-emerald-400" };
            return (
              <div key={t.label} className={`border rounded-2xl p-6 text-center ${colors[t.color]}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${texts[t.color]}`}>{t.label}</p>
                <p className="text-3xl font-bold text-white my-3">{t.range}</p>
                <p className="text-slate-400 text-xs mb-3">{t.sub}</p>
                <div className="bg-white/10 rounded-lg px-3 py-1.5">
                  <p className={`text-xs font-semibold ${texts[t.color]}`}>{t.note}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Tier A Sources</p>
            {[
              ["Head Start / Early Head Start expansion", ""],
              ["CCDF / Texas childcare quality funds", ""],
              ["DOL workforce pathway grants (via partnership)", ""],
              ["AmeriCorps capacity expansion", ""],
              ["Local human services contracts", ""],
              ["Maternal/child health subawards", ""],
            ].map(([s]) => (
              <div key={s} className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{s}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-center">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">Credible Headline for Child Inc.</p>
            <p className="text-white text-lg leading-relaxed">
              Child Inc. likely has a{" "}
              <span className="font-bold text-amber-400">multi-million-dollar expansion landscape</span>
              , with a realistic near-term addressable opportunity set in the{" "}
              <span className="font-bold text-white">low-to-mid seven figures</span>
              , and a broader 12–24 month pipeline that could exceed{" "}
              <span className="font-bold text-amber-400">$10M+</span>{" "}
              with a combined strategy.
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 16: NEXT STEPS ───────────────────────────────────────────────────
function NextStepsSlide() {
  const steps = [
    { n: 1, text: "Confirm priority growth lanes", sub: "Core early childhood · Workforce development · Family stabilization" },
    { n: 2, text: "Build a 12-month prioritized funding pipeline", sub: "Rank by fit, timing, and win probability" },
    { n: 3, text: "Identify opportunity type for each", sub: "Direct lead · Subcontract role · Local government contract" },
    { n: 4, text: "Prepare pursuit package", sub: "Org profile · Outcomes data · Budget framework · Partnership map" },
    { n: 5, text: "Launch 3–5 highest-fit pursuits", sub: "Start with Tier A opportunities with strongest alignment" },
  ];
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-8">
          <SlideTag text="16 · Recommended Next Steps" color="emerald" />
          <h2 className="text-4xl font-bold text-white mt-3">
            What we recommend for <span className="text-emerald-400">Child Inc. now</span>
          </h2>
        </div>
        <div className="space-y-4 flex-1">
          {steps.map((s) => (
            <div key={s.n} className="flex items-center gap-5 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">{s.n}</span>
              </div>
              <div>
                <p className="text-white font-semibold">{s.text}</p>
                <p className="text-slate-400 text-sm">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="text-emerald-300 font-bold">TCAF / ThriveUp is ready to support every step of this process.</p>
        </div>
      </div>
    </SlideWrapper>
  );
}

// ── SLIDE 17: CALL TO ACTION ───────────────────────────────────────────────
function CallToActionSlide() {
  const packages = [
    {
      num: "1", color: "blue", name: "Opportunity Scan",
      items: ["Funding landscape mapping", "Eligibility analysis", "Prioritized opportunity list", "Pursue now / later matrix"],
    },
    {
      num: "2", color: "amber", name: "Pipeline Buildout",
      items: ["Everything in Option 1", "Funding calendar", "Partner mapping", "Readiness review", "Grant/contract pursuit strategy"],
      featured: true,
    },
    {
      num: "3", color: "emerald", name: "Full Capture Support",
      items: ["Everything in Option 2", "Application support", "Proposal drafting support", "Budget/compliance support", "Submission preparation"],
    },
  ];
  const styles: Record<string, string> = {
    blue: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    amber: "border-amber-500/60 bg-amber-500/15 text-amber-400",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  };
  return (
    <SlideWrapper className="px-16 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #f59e0b 0%, transparent 50%)" }} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6">
          <SlideTag text="17 · Call to Action" color="amber" />
          <h2 className="text-4xl font-bold text-white mt-3">
            Three ways to <span className="text-amber-400">engage with TCAF</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-5 flex-1">
          {packages.map((p) => {
            const [border, bg, text] = styles[p.color].split(" ");
            return (
              <div key={p.num} className={`border-2 rounded-2xl p-6 flex flex-col relative ${border} ${bg} ${p.featured ? "scale-105 shadow-2xl shadow-amber-500/20" : ""}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">RECOMMENDED</span>
                  </div>
                )}
                <div className="mb-4">
                  <span className={`text-3xl font-black ${text}`}>{p.num}</span>
                  <p className="text-white font-bold text-lg">{p.name}</p>
                </div>
                <div className="space-y-2.5 flex-1">
                  {p.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${text}`} />
                      <span className="text-slate-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-white font-bold text-lg">Next decision:</p>
          <p className="text-slate-300">Approve a focused engagement to build Child Inc.'s{" "}
            <span className="text-amber-400 font-semibold">grant and contract capture strategy</span>
          </p>
          <div className="mt-3 flex items-center justify-center gap-6 text-slate-400 text-sm">
            <span>terryflood@thrivingcommunitiesforall.com</span>
            <span>·</span>
            <span>thrivingcommunitiesforall.com</span>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}

const SLIDE_COMPONENTS: Record<string, React.ComponentType> = {
  "title": TitleSlide,
  "executive-summary": ExecutiveSummarySlide,
  "who-is-childinc": WhoIsChildIncSlide,
  "market-context": MarketContextSlide,
  "eligibility-overview": EligibilityOverviewSlide,
  "federal-categories": FederalCategoriesSlide,
  "priority-programs": PriorityProgramsSlide,
  "state-landscape": StateLandscapeSlide,
  "local-contracts": LocalContractsSlide,
  "growth-strategy": GrowthStrategySlide,
  "tcaf-services": TcafServicesSlide,
  "delivery-model": DeliveryModelSlide,
  "differentiators": DifferentiatorsSlide,
  "pipeline-view": PipelineViewSlide,
  "opportunity-range": OpportunityRangeSlide,
  "next-steps": NextStepsSlide,
  "call-to-action": CallToActionSlide,
};

export default function ChildIncDeck() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = useCallback((dir: number) => {
    if (transitioning) return;
    const next = Math.max(0, Math.min(SLIDES.length - 1, current + dir));
    if (next === current) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(next);
      setTransitioning(false);
    }, 150);
  }, [current, transitioning]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(-1); }
      if (e.key === "Home") { e.preventDefault(); setCurrent(0); }
      if (e.key === "End") { e.preventDefault(); setCurrent(SLIDES.length - 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  const slide = SLIDES[current];
  const SlideComp = SLIDE_COMPONENTS[slide.type];

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Main slide area */}
      <div className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-150 ${transitioning ? "opacity-0" : "opacity-100"}`}>
          <SlideComp />
        </div>

        {/* Click zones */}
        <button
          onClick={() => go(-1)}
          className="absolute left-0 top-0 bottom-12 w-16 z-50 opacity-0 hover:opacity-100 flex items-center justify-center text-white/40 hover:text-white/80 transition-all"
          disabled={current === 0}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-0 top-0 bottom-12 w-16 z-50 opacity-0 hover:opacity-100 flex items-center justify-center text-white/40 hover:text-white/80 transition-all"
          disabled={current === SLIDES.length - 1}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom bar */}
      <div className="h-12 bg-slate-950 border-t border-white/10 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">TCAF / ThriveUp</span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-500 text-xs">Child Inc. Funding Strategy</span>
        </div>
        <div className="flex items-center gap-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="p-0.5"
            >
              {i === current
                ? <Circle className="w-2 h-2 fill-amber-400 text-amber-400" />
                : <Circle className="w-2 h-2 text-slate-600" />
              }
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => go(-1)} disabled={current === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-400 text-xs font-mono">{current + 1} / {SLIDES.length}</span>
          <button onClick={() => go(1)} disabled={current === SLIDES.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
