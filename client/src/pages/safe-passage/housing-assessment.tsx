import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Home, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight, CheckCircle2, Shield, DollarSign, Scale, Briefcase, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

function QuickExit() {
  return (
    <button onClick={() => window.location.replace("https://www.weather.com")}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-1.5"
      data-testid="button-quick-exit">
      <AlertTriangle className="h-3.5 w-3.5" />Quick Exit
    </button>
  );
}

const QUESTIONS = [
  {
    key: "situation",
    question: "Where are you right now?",
    sub: "Choose what best describes your current housing situation.",
    options: [
      { value: "unsafe-home", label: "Still in a home that feels unsafe", icon: AlertTriangle, color: "border-red-300 hover:border-red-400 bg-red-50 dark:bg-red-950/30" },
      { value: "emergency-shelter", label: "In an emergency shelter right now", icon: Shield, color: "border-blue-300 hover:border-blue-400 bg-blue-50 dark:bg-blue-950/30" },
      { value: "transitional", label: "In transitional housing", icon: Building2, color: "border-teal-300 hover:border-teal-400 bg-teal-50 dark:bg-teal-950/30" },
      { value: "staying-with-others", label: "Staying with family/friends (couch surfing)", icon: Home, color: "border-amber-300 hover:border-amber-400 bg-amber-50 dark:bg-amber-950/30" },
      { value: "own-housing", label: "Stably housed — recently escaped", icon: CheckCircle2, color: "border-emerald-300 hover:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" },
    ],
  },
  {
    key: "children",
    question: "Do you have children with you?",
    sub: "This helps us find housing that allows children and locate childcare resources.",
    options: [
      { value: "no", label: "No children", icon: Home, color: "border-slate-300 hover:border-slate-400" },
      { value: "under-5", label: "Yes — under 5 years old", icon: Home, color: "border-teal-300 hover:border-teal-400" },
      { value: "school-age", label: "Yes — school age (5–17)", icon: Home, color: "border-teal-300 hover:border-teal-400" },
      { value: "mixed", label: "Yes — multiple ages", icon: Home, color: "border-teal-300 hover:border-teal-400" },
    ],
  },
  {
    key: "income",
    question: "Do you currently have income or employment?",
    sub: "Helps us find the right benefits and employment support for you.",
    options: [
      { value: "employed", label: "Yes — currently employed", icon: Briefcase, color: "border-emerald-300 hover:border-emerald-400" },
      { value: "some", label: "Some — part-time or inconsistent", icon: Briefcase, color: "border-amber-300 hover:border-amber-400" },
      { value: "none", label: "No — not currently working", icon: DollarSign, color: "border-rose-300 hover:border-rose-400" },
      { value: "benefits", label: "I receive disability/SSI/TANF", icon: DollarSign, color: "border-blue-300 hover:border-blue-400" },
    ],
  },
  {
    key: "immigration",
    question: "What is your immigration status? (Optional — helps us find the right legal resources)",
    sub: "Your answer does not affect your access to any tools on this site. This is optional.",
    options: [
      { value: "us-citizen", label: "U.S. citizen or lawful permanent resident", icon: Shield, color: "border-slate-300 hover:border-slate-400" },
      { value: "other-visa", label: "Other visa or lawful status", icon: Shield, color: "border-slate-300 hover:border-slate-400" },
      { value: "unsure", label: "Not sure", icon: Shield, color: "border-amber-300 hover:border-amber-400" },
      { value: "undocumented", label: "Undocumented — I need immigration help", icon: Scale, color: "border-blue-300 hover:border-blue-400" },
      { value: "prefer-not", label: "Prefer not to say", icon: Shield, color: "border-slate-300 hover:border-slate-400" },
    ],
  },
  {
    key: "urgent",
    question: "What is most urgent for you right now?",
    sub: "We'll direct you to the right tool first.",
    options: [
      { value: "safety", label: "My immediate safety", icon: AlertTriangle, color: "border-red-300 hover:border-red-400 bg-red-50 dark:bg-red-950/30" },
      { value: "housing", label: "Finding a place to live", icon: Home, color: "border-teal-300 hover:border-teal-400" },
      { value: "money", label: "Money, benefits, or financial help", icon: DollarSign, color: "border-amber-300 hover:border-amber-400" },
      { value: "legal", label: "Legal help (protective order, lease, immigration)", icon: Scale, color: "border-blue-300 hover:border-blue-400" },
      { value: "employment", label: "Employment or financial independence", icon: Briefcase, color: "border-emerald-300 hover:border-emerald-400" },
      { value: "all", label: "All of the above — I need a starting point", icon: CheckCircle2, color: "border-violet-300 hover:border-violet-400" },
    ],
  },
];

type Answers = Record<string, string>;

function getRecommendations(answers: Answers) {
  const recs: { href: string; label: string; reason: string; icon: typeof Home; priority: boolean }[] = [];
  const { situation, urgent, immigration } = answers;

  if (situation === "unsafe-home" || urgent === "safety") {
    recs.push({ href: "/safe-passage/safety-planning", label: "Safety Planning Wizard", reason: "Build a personal plan for leaving safely", icon: Shield, priority: true });
  }
  if (urgent === "housing" || situation === "emergency-shelter" || situation === "staying-with-others") {
    recs.push({ href: "/safe-passage/housing-finder", label: "Find Transitional Housing", reason: "Search available units in your area", icon: Building2, priority: true });
  }
  if (urgent === "money" || urgent === "all" || situation !== "own-housing") {
    recs.push({ href: "/safe-passage/benefits-bridge", label: "Benefits & Financial Help", reason: "Find money and programs many survivors miss", icon: DollarSign, priority: urgent === "money" });
  }
  if (urgent === "legal" || immigration === "undocumented" || immigration === "unsure") {
    recs.push({ href: "/safe-passage/legal-navigator", label: "Your Legal Rights", reason: immigration === "undocumented" ? "VAWA self-petition, U-Visa, and housing rights" : "Protective orders, lease rights, and more", icon: Scale, priority: urgent === "legal" });
  }
  if (urgent === "employment" || situation === "own-housing" || situation === "transitional") {
    recs.push({ href: "/safe-passage/employment-pathway", label: "Employment & Independence", reason: "Jobs, resume coaching, financial safety", icon: Briefcase, priority: urgent === "employment" });
  }
  if (recs.length === 0) {
    recs.push({ href: "/safe-passage/safety-planning", label: "Safety Planning", reason: "A good starting point for everyone", icon: Shield, priority: false });
    recs.push({ href: "/safe-passage/benefits-bridge", label: "Benefits & Financial Help", reason: "Find programs you may be eligible for", icon: DollarSign, priority: false });
  }
  return recs.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
}

export default function HousingAssessmentPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const q = QUESTIONS[step];

  function selectOption(value: string) {
    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);
    if (step === QUESTIONS.length - 1) {
      apiRequest("POST", "/api/safe-passage/log", { serviceType: "housing-assessment" }).catch(() => {});
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  }

  const recs = done ? getRecommendations(answers) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/20 dark:from-slate-950 dark:to-teal-950/10">
      <QuickExit />
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6">
          <ChevronLeft className="h-3 w-3" /> Back to Safe Passage
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Where Do I Start?</h1>
            <p className="text-xs text-slate-500">5 quick questions · No account required</p>
          </div>
        </div>

        {!done ? (
          <>
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Question {step + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(((step) / QUESTIONS.length) * 100)}% done</span>
              </div>
              <Progress value={((step + 1) / QUESTIONS.length) * 100} className="h-1.5" />
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{q.question}</h2>
                <p className="text-xs text-slate-500 mb-4">{q.sub}</p>
                <div className="space-y-2">
                  {q.options.map(opt => (
                    <button key={opt.value} onClick={() => selectOption(opt.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all hover:shadow-sm ${opt.color} dark:border-opacity-50`}
                      data-testid={`option-${q.key}-${opt.value}`}>
                      <opt.icon className="h-4 w-4 flex-shrink-0 text-slate-600 dark:text-slate-300" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between mt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0} data-testid="button-prev">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Badge variant="outline" className="text-xs self-center">{step + 1}/{QUESTIONS.length}</Badge>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">Your Recommended Starting Points</h2>
              </div>
              <p className="text-sm text-slate-500">Based on your answers, here are the tools that will help you most right now — start with the top one.</p>
              <div className="space-y-3">
                {recs.map((rec, i) => (
                  <Link key={rec.href} href={rec.href}>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all group ${i === 0 ? "border-teal-400 bg-teal-50 dark:bg-teal-950/30" : "border-slate-200 dark:border-slate-700 hover:border-teal-300"}`}
                      data-testid={`rec-${i}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${i === 0 ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                        <rec.icon className={`h-4.5 w-4.5 ${i === 0 ? "text-white" : "text-slate-600 dark:text-slate-300"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{rec.label}</p>
                          {i === 0 && <Badge className="bg-teal-500 text-white text-[10px]">Start here</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.reason}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-500 flex-shrink-0 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
              <button className="text-xs text-slate-400 hover:text-slate-600 underline" onClick={() => { setDone(false); setStep(0); setAnswers({}); }} data-testid="button-restart">
                Start over
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
