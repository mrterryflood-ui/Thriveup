/**
 * GrantCoach — an inline coaching panel that lives on the Grant Hub.
 * 
 * Philosophy: Every time a user interacts with a grant, they should leave
 * knowing a little more than when they arrived. Not gated. Not locked behind
 * a course. Just plain-spoken context attached to what they're already doing.
 * 
 * The coach explains the "what behind the why" — what a fit score actually
 * means in practice, why deadlines matter more than funding size, what makes
 * a grant "worth your time" vs not. It teaches through doing.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ChevronRight, ChevronDown, Lightbulb,
  X, BookOpen, Target, Clock, DollarSign, CheckCircle2,
  AlertTriangle, Zap, HelpCircle,
} from "lucide-react";

interface CoachTip {
  id: string;
  trigger: string;        // short label for the chip that opens this tip
  icon: React.ReactNode;
  headline: string;       // plain-language "what this is"
  body: string;           // "why it matters to YOU"
  action?: string;        // what to do next
  actionUrl?: string;
  level: "beginner" | "intermediate" | "advanced";
}

const TIPS: CoachTip[] = [
  {
    id: "fit-score",
    trigger: "Fit Score",
    icon: <Target className="h-4 w-4 text-emerald-500" />,
    headline: "What is a fit score?",
    body: "The fit score (0–100%) is how closely this grant matches your organization's mission, focus areas, and location. A 70%+ score means the funder's goals and your work are genuinely aligned — your application won't be fighting an uphill battle. Scores below 40% don't mean the grant is bad; it means your energy is better spent elsewhere. Use it to triage, not disqualify.",
    action: "Set up your org profile to get personalized scores",
    actionUrl: "/settings/organization",
    level: "beginner",
  },
  {
    id: "deadline",
    trigger: "Deadlines",
    icon: <Clock className="h-4 w-4 text-red-500" />,
    headline: "Why deadlines are non-negotiable",
    body: "Federal and state funders do not accept late applications. Period. If you miss a deadline by 1 minute, your application is rejected — regardless of quality. Most grants require internal review, board sign-off, and a registered organization in SAM.gov (which takes 7–10 days to activate). Start your application at least 3 weeks before the close date. Use the Deadlines tab to see everything due in the next 30 days.",
    action: "See upcoming deadlines",
    level: "beginner",
  },
  {
    id: "funding-amount",
    trigger: "Funding Amount",
    icon: <DollarSign className="h-4 w-4 text-violet-500" />,
    headline: "The number isn't the whole story",
    body: "Funding amounts in this database are the maximum award — most applicants receive less. More importantly: a $50K grant from a funder perfectly aligned with your mission is often worth more than a $500K grant you'd spend 6 months contorting your programs to fit. Look at the funding amount alongside the fit score, not instead of it. Also check whether it's one-time or renewable — renewable grants build your baseline budget.",
    level: "intermediate",
  },
  {
    id: "eligibility",
    trigger: "Eligibility",
    icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
    headline: "Eligibility rules are binary",
    body: "If you don't meet an eligibility requirement, you cannot apply. Common disqualifiers: nonprofit status (must have 501(c)(3) IRS determination letter), geographic restrictions (some grants are Texas-only, some county-specific), organization age (many require 2+ years of operations), and budget size (some funders won't fund orgs with budgets under $250K or over $5M). Read eligibility criteria FIRST before investing time in an application.",
    level: "beginner",
  },
  {
    id: "live-search",
    trigger: "Live Search",
    icon: <Zap className="h-4 w-4 text-amber-500" />,
    headline: "What 'live search' means",
    body: "When you type 3+ characters in the search bar, ThriveUp searches Grants.gov in real time — not just the 1,000+ grants already in your database. The red LIVE badge means those results are fresh from the federal database right now. This lets you find grants posted in the last few hours that haven't been scored yet. Click any live result to save it to your pipeline.",
    level: "beginner",
  },
  {
    id: "ai-hunt",
    trigger: "AI Grant Hunt",
    icon: <Lightbulb className="h-4 w-4 text-violet-500" />,
    headline: "How the AI hunt works",
    body: "You describe your organization (mission, geography, population served). The AI generates 6–8 search queries specifically for your context — the same way a seasoned grant writer would search, not just keyword matching. Those queries fire against Grants.gov in parallel, every result gets scored against your org profile, and the top matches come back ranked. The difference from manual search: it thinks like a researcher, not a search engine.",
    level: "intermediate",
  },
  {
    id: "sources",
    trigger: "Data Sources",
    icon: <BookOpen className="h-4 w-4 text-slate-500" />,
    headline: "Where these grants come from",
    body: "ThriveUp pulls from 7 sources every 24 hours: SAM.gov (federal contracts & grants), Grants.gov (federal grants only), SAMHSA (behavioral health), USASpending.gov (active awards), Texas ESBD (TX state solicitations), BidNet Direct (regional RFPs), and curated foundations. Each source covers different types of funding — federal formula grants, competitive grants, state contracts, and private foundation awards. No single source shows everything.",
    level: "intermediate",
  },
  {
    id: "sam-gov",
    trigger: "SAM.gov",
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    headline: "SAM.gov is required for federal money",
    body: "If you want federal grants or contracts, your organization MUST be registered in SAM.gov (System for Award Management). Registration is free but takes 7–10 business days to activate, and it must be renewed annually. An expired SAM.gov registration will get your federal application automatically rejected. Register or renew at sam.gov — don't wait until you find a grant you want to apply for.",
    action: "Register on SAM.gov →",
    actionUrl: "https://sam.gov",
    level: "beginner",
  },
];

interface GrantCoachProps {
  defaultOpen?: boolean;
  className?: string;
}

export function GrantCoach({ defaultOpen = false, className = "" }: GrantCoachProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTip, setActiveTip] = useState<CoachTip | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors ${className}`}
        data-testid="grant-coach-open"
      >
        <GraduationCap className="h-4 w-4 shrink-0" />
        <span>Grant Coach</span>
        <span className="text-xs text-amber-600 dark:text-amber-400 font-normal hidden sm:inline">— plain-language explanations as you go</span>
        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />
      </button>
    );
  }

  return (
    <Card className={`border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 ${className}`} data-testid="grant-coach-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 dark:border-amber-800">
        <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">Grant Coach</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">Plain-spoken explanations — no jargon, no gatekeeping</p>
        </div>
        <button
          onClick={() => { setIsOpen(false); setActiveTip(null); }}
          className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          data-testid="grant-coach-close"
        >
          <X className="h-4 w-4 text-amber-600" />
        </button>
      </div>

      {/* Tip chips */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">What would you like explained?</p>
        <div className="flex flex-wrap gap-2">
          {TIPS.map(tip => (
            <button
              key={tip.id}
              onClick={() => setActiveTip(activeTip?.id === tip.id ? null : tip)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                activeTip?.id === tip.id
                  ? "bg-amber-200 dark:bg-amber-800 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-100"
                  : "bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              }`}
              data-testid={`coach-tip-${tip.id}`}
            >
              {tip.icon}
              {tip.trigger}
              {activeTip?.id === tip.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3 opacity-50" />}
            </button>
          ))}
        </div>
      </div>

      {/* Active tip */}
      {activeTip && (
        <div className="px-4 pb-4" data-testid={`coach-tip-content-${activeTip.id}`}>
          <div className="rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 p-4 space-y-2">
            <div className="flex items-center gap-2">
              {activeTip.icon}
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50">{activeTip.headline}</h3>
              <Badge
                variant="outline"
                className={`text-[10px] ml-auto shrink-0 ${
                  activeTip.level === "beginner"
                    ? "border-green-300 text-green-700 dark:text-green-400"
                    : activeTip.level === "intermediate"
                    ? "border-blue-300 text-blue-700 dark:text-blue-400"
                    : "border-purple-300 text-purple-700 dark:text-purple-400"
                }`}
              >
                {activeTip.level}
              </Badge>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{activeTip.body}</p>
            {activeTip.action && (
              <div className="pt-1">
                {activeTip.actionUrl?.startsWith("http") ? (
                  <a href={activeTip.actionUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40">
                      <ChevronRight className="h-3 w-3" />
                      {activeTip.action}
                    </Button>
                  </a>
                ) : (
                  <a href={activeTip.actionUrl ?? "#"}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40">
                      <ChevronRight className="h-3 w-3" />
                      {activeTip.action}
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer nudge */}
      {!activeTip && (
        <div className="px-4 pb-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            Tap any topic above for a plain-language breakdown. You learn by doing — this coach explains as you go, not before you start.
          </p>
        </div>
      )}
    </Card>
  );
}
