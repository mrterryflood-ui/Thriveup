/**
 * Grants 101 — public, no login required.
 *
 * This page teaches the full grant process in plain language.
 * No jargon. No gatekeeping. Users learn by reading, then immediately
 * act inside the platform. The "what behind the why" at every step.
 */
import { useState } from "react";
import {
  GraduationCap, ChevronRight, ChevronDown, CheckCircle2,
  Clock, DollarSign, Target, FileText, Users, AlertTriangle,
  Lightbulb, BookOpen, ArrowRight, Zap, Building2, Globe,
  Shield, Star, HelpCircle, ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Step {
  id: string;
  number: number;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  what: string;
  why: string;
  howLong: string;
  commonMistake?: string;
  action?: { label: string; url: string };
}

const STEPS: Step[] = [
  {
    id: "understand",
    number: 1,
    icon: <BookOpen className="h-6 w-6" />,
    title: "Understand what grants actually are",
    tagline: "It's not free money. It's a contract.",
    what: "A grant is a funded agreement between you and a funder — government agency, federal department, or foundation. They give you money to accomplish a specific outcome. In return, you report on what you did with it, prove the outcome happened, and often submit to audits. Grants fund programs and services, not operations or salaries (with exceptions).",
    why: "Most first-time applicants treat grants like lottery tickets — apply everywhere, hope one lands. That wastes time and builds a bad reputation with funders. Treat it like a business relationship: apply only to funders whose priorities genuinely match your work.",
    howLong: "Reading: 10 minutes",
    commonMistake: "Applying for any grant you can find regardless of fit. Funders track applicants across cycles — a misaligned application can hurt your next submission.",
  },
  {
    id: "eligibility",
    number: 2,
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Confirm you're eligible before reading anything else",
    tagline: "If you don't qualify, skip it. No exceptions.",
    what: "Eligibility requirements are binary. You either meet them or you don't. Common requirements: 501(c)(3) nonprofit status, years in operation (often 2+), geographic location (some grants are state- or county-specific), budget size minimums and maximums, and alignment with the funding priority area. Read eligibility first — before the narrative requirements, before the funding amount.",
    why: "Writing a 20-page application only to discover you don't meet a checkbox requirement is one of the most common and avoidable mistakes in grant seeking. It also signals to the funder that you didn't read the guidelines carefully — which matters on your next application.",
    howLong: "5 minutes per grant",
    commonMistake: "Skipping to the funding amount before reading who qualifies.",
    action: { label: "Check your eligibility on SAM.gov →", url: "https://sam.gov" },
  },
  {
    id: "sam-gov",
    number: 3,
    icon: <Building2 className="h-6 w-6" />,
    title: "Register in SAM.gov — do this NOW, not later",
    tagline: "Federal money requires this. It takes 7–10 days. Don't wait.",
    what: "SAM.gov (System for Award Management) is the federal government's central database of organizations that can receive federal funding. Registration is free and must be renewed annually. Without it, you cannot apply for or receive federal grants or contracts. Your registration also creates your Unique Entity Identifier (UEI), which appears on every federal application.",
    why: "SAM.gov registration is not instant. The process takes 7–10 business days. If you find a federal grant you want to apply for today with a deadline in 2 weeks and your SAM.gov registration is expired, you cannot apply. This is the single most common preventable disqualifier for first-time federal grant applicants.",
    howLong: "Registration: 1 hour setup, 7–10 days processing",
    commonMistake: "Waiting until you find a grant you want before registering. Register once, renew every year.",
    action: { label: "Register or renew on SAM.gov →", url: "https://sam.gov" },
  },
  {
    id: "fit",
    number: 4,
    icon: <Target className="h-6 w-6" />,
    title: "Match your mission to the funder's priority, not the other way around",
    tagline: "Don't contort your work to fit a grant. Find funders aligned with what you already do.",
    what: "Every funder has a specific theory of change — a set of problems they believe they can solve with money. Grants go to organizations whose actual work advances that theory. The fit score in ThriveUp's Grant Hub measures how well a grant's stated priority aligns with your organization's mission, geography, and population. A 70%+ fit score means real alignment. Below 40% means the funder's goals and your work don't overlap enough to be competitive.",
    why: "Program officers read hundreds of applications. They can immediately spot an organization that retrofitted their mission to match the RFP language vs. one that has been doing this work for years. Authentic alignment wins. The narrative writes itself when the fit is real.",
    howLong: "Assessment: 15 minutes per grant using the fit analysis tool",
    action: { label: "Run an AI Grant Hunt for your org →", url: "/grants" },
  },
  {
    id: "narrative",
    number: 5,
    icon: <FileText className="h-6 w-6" />,
    title: "Write the narrative: show don't tell",
    tagline: "Data + story = funded. Data alone or story alone = rejection.",
    what: "A grant narrative typically includes: a statement of need (why this problem exists and why you're positioned to address it), project description (what you will do, in what sequence, for whom), evaluation plan (how you will know it worked), organizational capacity (why you're the right team), and budget narrative (why you need exactly this much money for exactly these expenses). Every claim needs a data point. Every data point needs a story.",
    why: "Program officers are humans making judgment calls under time pressure. They are looking for three things: Does this org understand the problem? Do they have a realistic plan? Can they actually do it? Your narrative must answer all three — ideally in the first two paragraphs, because some reviewers stop there.",
    howLong: "First draft: 8–16 hours. Revision: 4–8 hours. Plan 3–4 weeks before deadline.",
    commonMistake: "Copying last year's narrative with minor edits. Funders often use the same reviewers across cycles.",
    action: { label: "Open the RFP Narrative Writer →", url: "/grant-narrative" },
  },
  {
    id: "budget",
    number: 6,
    icon: <DollarSign className="h-6 w-6" />,
    title: "Build a budget that tells a story",
    tagline: "Every line item is a decision that needs a justification.",
    what: "A grant budget shows the funder how you will spend their money. It includes direct costs (staff, supplies, travel, contracted services) and sometimes indirect costs (overhead — typically 10–30% of direct costs). A budget narrative explains why each line item is necessary and how you calculated it. Federal grants use detailed forms (SF-424, SF-424A); foundation grants often use simpler templates.",
    why: "An underbid budget signals you don't understand what the work costs — and makes funders nervous you'll run out of money mid-project. An overbid budget without justification raises questions about financial management. Budget the real cost of doing the work well, then justify every line.",
    howLong: "Budget development: 2–4 hours for experienced grant writers",
    commonMistake: "Submitting a budget without a narrative. Every number needs a sentence explaining it.",
  },
  {
    id: "submit",
    number: 7,
    icon: <Clock className="h-6 w-6" />,
    title: "Submit early. Never on deadline day.",
    tagline: "Technical failures on deadline day are your problem, not the funder's.",
    what: "Federal grants are submitted through Grants.gov, which has historically had system outages during high-traffic deadline windows. State grants may use their own portals. Foundation grants may use email, Submittable, Fluxx, or their own systems. Each system requires registration, which takes time. Submit at least 48 hours before the deadline. If the system is down on deadline day, you will not get an extension.",
    why: "No funder has ever rejected an application for being submitted too early. Many have rejected applications for technical failures at 11:58pm on deadline day. The margin for error is zero once the deadline passes.",
    howLong: "Submission: 1–2 hours if prepared. Buffer: submit 48+ hours early.",
    commonMistake: "Trying to create a Grants.gov account on deadline day.",
  },
  {
    id: "followup",
    number: 8,
    icon: <Users className="h-6 w-6" />,
    title: "Follow up, learn, and reapply",
    tagline: "Most grants require 3–5 applications before a first award. That's normal.",
    what: "After submitting: wait for the notice of award (NOA) or notice of rejection. If rejected, request reviewer feedback — most funders provide this. Review the feedback, improve your application, and resubmit in the next funding cycle. If awarded: read the award terms carefully before spending anything. Track your expenses and outcomes from day one. File reports on time — late reports can affect future funding.",
    why: "Grant success rates for federal competitive grants are typically 10–25%. First-time applicants are often rejected regardless of quality — reviewers favor organizations with track records. Every rejection is market research on what the funder actually wants. The organizations that consistently win grants are the ones that reapply.",
    howLong: "Grant cycles: 6–18 months from application to first payment",
    action: { label: "Track your applications →", url: "/grants/applications" },
  },
];

interface ConceptCard {
  term: string;
  plain: string;
  icon: React.ReactNode;
}

const CONCEPTS: ConceptCard[] = [
  { term: "NOFA / NOFO", plain: "Notice of Funding Availability / Opportunity — the official announcement that a grant is open for applications. It contains all eligibility rules, narrative requirements, budget guidelines, and the deadline.", icon: <FileText className="h-4 w-4" /> },
  { term: "RFP", plain: "Request for Proposals — government or foundation asking organizations to propose how they would accomplish a specific goal. More open-ended than a formula grant.", icon: <FileText className="h-4 w-4" /> },
  { term: "CFDA / ALN", plain: "Assistance Listing Number — every federal grant program has one. Use it to look up program details, past awards, and required reports on sam.gov.", icon: <Globe className="h-4 w-4" /> },
  { term: "Match / Cost Share", plain: "Some grants require you to put in your own money (cash or in-kind) alongside the federal/foundation dollar. A 1:1 match means for every $100 the funder gives, you contribute $100 from another source.", icon: <DollarSign className="h-4 w-4" /> },
  { term: "Indirect Cost Rate", plain: "An overhead percentage that covers rent, admin, utilities — costs that support the work but aren't tied to a specific deliverable. Nonprofits can negotiate an indirect cost rate with the federal government or accept a default 10% de minimis rate.", icon: <Building2 className="h-4 w-4" /> },
  { term: "Performance Period", plain: "The time window during which you must spend the grant money and complete the work. Typically 1–3 years. Unspent money at the end usually must be returned.", icon: <Clock className="h-4 w-4" /> },
  { term: "Subrecipient", plain: "An organization that receives federal money through you (as the prime recipient) to carry out part of your grant's scope of work. Requires its own agreement, monitoring, and reporting.", icon: <Users className="h-4 w-4" /> },
  { term: "Single Audit", plain: "If your organization spends $750K+ of federal funds in a year, you're required to get an annual audit from an independent CPA. This is a compliance requirement, not optional.", icon: <Shield className="h-4 w-4" /> },
];

function StepCard({ step }: { step: Step }) {
  const [open, setOpen] = useState(false);
  return (
    <Card
      className={`border-l-4 transition-all ${open ? "border-l-blue-600 shadow-md" : "border-l-slate-200 dark:border-l-slate-700 hover:border-l-blue-400"}`}
      data-testid={`step-${step.id}`}
    >
      <button
        className="w-full text-left p-5"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${open ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
            {step.number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">{step.title}</h3>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-0.5 italic">{step.tagline}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />{step.howLong}
            </p>
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-1" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">What this is</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{step.what}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
            <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Why it matters to you
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{step.why}</p>
          </div>
          {step.commonMistake && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Common mistake</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">{step.commonMistake}</p>
              </div>
            </div>
          )}
          {step.action && (
            <a href={step.action.url} target={step.action.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 mt-1">
                <ArrowRight className="h-3.5 w-3.5" />
                {step.action.label}
              </Button>
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

export default function Grants101Page() {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-8 w-8 text-blue-200" />
            <span className="text-blue-200 font-medium text-sm uppercase tracking-widest">Grants 101</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            How grants actually work
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
            Plain language. No jargon. Everything you need to go from "I've heard of grants" to "I submitted a competitive application" — explained in the order you'll actually need it.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1">
              <CheckCircle2 className="h-3 w-3" /> No login required
            </Badge>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1">
              <Zap className="h-3 w-3" /> 8 steps, ~45 min total read
            </Badge>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1">
              <Star className="h-3 w-3" /> Free. Always.
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* What this teaches */}
        <Card className="p-5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            What you'll know after reading this
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "What grants are (and aren't)",
              "Whether your org is eligible for federal funding",
              "How to find grants that actually fit your mission",
              "What makes a strong narrative vs. a rejected one",
              "How to build a grant budget that funders trust",
              "How to submit on time without last-minute panic",
              "What to do when you get rejected (and you will)",
              "The terminology grant reviewers use",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Reality check */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">A realistic expectation before you start</p>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              The national success rate for competitive federal grants is 10–25%. First-time applicants succeed at lower rates. This isn't a reason not to apply — it's a reason to be strategic, build relationships with funders before you apply, and treat every rejection as feedback, not failure. Organizations that win grants consistently are the ones that showed up every cycle, improved every time, and stayed in relationship with funders between cycles.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">The 8 steps</h2>
          <div className="space-y-3">
            {STEPS.map(step => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>
        </div>

        {/* Glossary */}
        <Card className="border-slate-200 dark:border-slate-800">
          <button
            className="w-full flex items-center justify-between p-5 text-left"
            onClick={() => setGlossaryOpen(!glossaryOpen)}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-500" />
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">Grant terminology, decoded</h2>
                <p className="text-xs text-slate-500 mt-0.5">8 terms you'll see in every grant application — in plain English</p>
              </div>
            </div>
            {glossaryOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          {glossaryOpen && (
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              {CONCEPTS.map(c => (
                <div key={c.term} className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    {c.icon}
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">{c.term}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.plain}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* CTA */}
        <Card className="p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-0">
          <h3 className="text-xl font-bold mb-2">Ready to find your first grant?</h3>
          <p className="text-blue-100 text-sm mb-4 leading-relaxed">
            ThriveUp's Grant Discovery Hub has 1,100+ live opportunities from 7 sources, scored for fit, with deadlines tracked for you. The AI Grant Hunt generates custom search queries based on your organization's mission — same approach a seasoned grant writer uses, available free.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/grants">
              <Button className="bg-white text-blue-700 hover:bg-blue-50 gap-1.5 font-semibold">
                <Target className="h-4 w-4" />
                See Live Grant Opportunities
              </Button>
            </a>
            <a href="/contractor-opportunities">
              <Button variant="outline" className="border-white/50 text-white hover:bg-white/20 gap-1.5">
                <FileText className="h-4 w-4" />
                Texas Contractor RFPs
              </Button>
            </a>
          </div>
        </Card>

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center pb-4">
          This guide is maintained by TCAF (Thriving Communities for All Foundation) · ISS LLC · Free for all users · No account required
        </p>
      </div>
    </div>
  );
}
