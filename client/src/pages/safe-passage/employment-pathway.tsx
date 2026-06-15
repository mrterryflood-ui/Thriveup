import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Briefcase, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, DollarSign, Users, MapPin, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
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

const STEPS_CONFIG = [
  { key: "start", label: "Where I Am" },
  { key: "gaps", label: "Resume Gaps" },
  { key: "workplace", label: "Safety at Work" },
  { key: "financial", label: "Financial Safety" },
  { key: "resources", label: "Resources" },
];

const GAP_PHRASES = [
  { situation: "Left to care for family", phrase: "During this period, I managed a family care situation and maintained my skills through [reading/online courses/volunteer work]." },
  { situation: "Health reasons (yours)", phrase: "I took time off for a personal health matter that has been fully resolved. I am ready and eager to return to full-time work." },
  { situation: "Safety reasons (don't want to disclose DV)", phrase: "I needed to relocate for personal reasons that have been resolved. This was a one-time situation and I'm now fully settled and committed to this position." },
  { situation: "Relocation", phrase: "My family relocated, and I took time to establish ourselves in our new location before seeking employment." },
  { situation: "Upskilling/looking for the right fit", phrase: "I used this period to reassess my career goals and focus on finding a role that aligns with my long-term professional development." },
];

const RESOURCES = [
  { name: "WorkSource Austin", category: "Employment", url: "https://wfsaustin.com", phone: "512-597-7100", detail: "Free job search, resume help, skills training, and job placement — Austin/Travis County" },
  { name: "Workforce Solutions Capital Area", category: "Employment", url: "https://www.wrksolutions.com", phone: "512-597-7100", detail: "Career centers with DV-priority services and childcare assistance connections" },
  { name: "Texas Workforce Commission", category: "Employment", url: "https://www.twc.texas.gov", phone: "1-800-832-2829", detail: "Unemployment benefits, job training funds, and childcare subsidies" },
  { name: "SNAP Employment & Training", category: "Training", url: "https://yourtexasbenefits.com", phone: "2-1-1", detail: "Free job training and childcare funded through SNAP benefits" },
  { name: "Capital Metro GoPass", category: "Transportation", url: "https://www.capmetro.org", phone: "512-474-1200", detail: "Low-income transit passes and free rides to job interviews" },
  { name: "Child Care Management Services", category: "Childcare", url: "https://www.carsonsite.com", phone: "512-854-5437", detail: "Travis County childcare assistance — DV survivors get priority access" },
  { name: "SAFE Alliance Employment Services", category: "Employment", url: "https://safeaustin.org", phone: "512-267-7233", detail: "DV-specific employment support including employer outreach and job placement" },
  { name: "Goodwill Austin", category: "Training", url: "https://www.goodwillcentraltexas.org", phone: "512-637-1100", detail: "Free job training, certifications, and career centers — no income requirements" },
];

export default function EmploymentPathwayPage() {
  const [step, setStep] = useState(0);
  const [logged, setLogged] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!logged) {
      apiRequest("POST", "/api/safe-passage/log", { serviceType: "employment" }).catch(() => {});
      setLogged(true);
    }
  }, []);

  const statuses = [
    { value: "employed", label: "Currently employed", detail: "Focus: safety at work, financial independence" },
    { value: "searching", label: "Actively job searching", detail: "Focus: resume gaps, interview prep, resources" },
    { value: "not-ready", label: "Not ready yet — still in crisis", detail: "Focus: stabilize first, plan for later" },
    { value: "self-employed", label: "Self-employed or gig work", detail: "Focus: formalizing income, benefits access" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 dark:from-slate-950 dark:to-emerald-950/10">
      <QuickExit />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6">
          <ChevronLeft className="h-3 w-3" /> Back to Safe Passage
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Employment & Economic Independence</h1>
            <p className="text-xs text-slate-500">Work, resume coaching, financial safety, and resources built for survivors</p>
          </div>
        </div>

        <div className="mb-5">
          <Progress value={((step + 1) / STEPS_CONFIG.length) * 100} className="h-1.5" />
          <div className="flex gap-1.5 mt-1.5">
            {STEPS_CONFIG.map((s, i) => (
              <button key={s.key} onClick={() => setStep(i)}
                className={`flex-1 text-[10px] py-0.5 rounded transition-colors ${i === step ? "text-emerald-700 dark:text-emerald-300 font-semibold" : i < step ? "text-slate-500" : "text-slate-300 dark:text-slate-600"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {step === 0 && (
              <>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">Where are you right now?</h2>
                <p className="text-sm text-slate-500">This helps us show you the most relevant information first.</p>
                <div className="space-y-2">
                  {statuses.map(s => (
                    <button key={s.value} onClick={() => setSelectedStatus(s.value)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedStatus === s.value ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"}`}
                      data-testid={`status-${s.value}`}>
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{s.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.detail}</p>
                    </button>
                  ))}
                </div>
                {selectedStatus === "not-ready" && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-200">That's okay. Stabilizing your safety and housing comes first. When you're ready, this tool will be here. Meanwhile, look at the <Link href="/safe-passage/benefits-bridge"><span className="underline font-semibold">Benefits Bridge</span></Link> — financial support is available right now, even before employment.</p>
                  </div>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">Addressing Employment Gaps</h2>
                <p className="text-sm text-slate-500">Employment gaps are common. Interviewers will ask — here are honest answers that protect your privacy.</p>
                <div className="space-y-3">
                  {GAP_PHRASES.map(g => (
                    <div key={g.situation} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{g.situation}</p>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2.5">
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{g.phrase}"</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200"><strong>You are never required to disclose DV to an employer.</strong> Federal law prohibits employers from asking about your status as a survivor, and most states (including Texas) prohibit employment discrimination based on DV history.</p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">Staying Safe at Work</h2>
                <p className="text-sm text-slate-500">If your abuser knows where you work, you may need a workplace safety plan.</p>
                <div className="space-y-3">
                  {[
                    { title: "Talk to HR — but keep control of what you share", body: "You can ask for a workplace safety plan, have security briefed with a photo, and request to not be listed in the company directory. You choose how much to share." },
                    { title: "Vary your schedule and routes", body: "If possible, come in at different times. Park in different spots. Have a coworker walk you to your car. Tell a trusted coworker what to watch for." },
                    { title: "Your employer cannot fire you for being a survivor", body: "Texas Labor Code §51.012 protects you. Report any retaliation to the Texas Workforce Commission." },
                    { title: "You can use paid leave for DV-related needs", body: "Medical appointments, court hearings, safety planning, relocation, and counseling all qualify under Texas law. You don't have to explain — 'personal safety matter' is sufficient." },
                  ].map(item => (
                    <div key={item.title} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />{item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 ml-6">{item.body}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">Financial Safety — Separating Your Money</h2>
                <p className="text-sm text-slate-500">Economic abuse is one of the most effective tools abusers use to maintain control. Breaking free financially is possible — step by step.</p>
                <div className="space-y-3">
                  {[
                    { icon: DollarSign, title: "Open a bank account in only your name", body: "Use a bank your abuser doesn't know about. A credit union is often easier to access with limited ID. Use your new address or the ACP substitute address." },
                    { icon: DollarSign, title: "Start a credit history in your name", body: "A secured credit card (deposit-backed) is the fastest way to build credit with no prior history. Credit unions often offer them with $200–$500 deposits." },
                    { icon: DollarSign, title: "Get your free credit reports", body: "Check AnnualCreditReport.com for accounts opened in your name without your knowledge. You can freeze your credit to prevent new accounts being opened." },
                    { icon: Users, title: "Emergency cash resources", body: "TX Crime Victims' Compensation, emergency TANF, local DV emergency funds (SAFE Alliance has an emergency fund), and 2-1-1 can connect you to immediate cash assistance." },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <item.icon className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">Local Employment & Support Resources</h2>
                <p className="text-sm text-slate-500">All of these are free or low-cost. DV survivors often get priority access.</p>
                <div className="space-y-2">
                  {RESOURCES.map(r => (
                    <div key={r.name} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
                              {r.name} <ExternalLink className="h-3 w-3" />
                            </a>
                            <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{r.detail}</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{r.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/resume-builder">
                  <Button variant="outline" size="sm" className="w-full border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" data-testid="link-resume-builder">
                    Open Resume Builder →
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-4">
          <Button variant="outline" size="sm" onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0} data-testid="button-prev">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS_CONFIG.length - 1 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-next">
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Link href="/safe-passage"><Button variant="outline" size="sm" data-testid="button-done">Done</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}
